/**
 * Image Collage Visual (2D Canvas, audio-reactive)
 *
 * Usage:
 *   1) Put your images in /IMGS and create /IMGS/index.json like:
 *        ["IMGS/pic1.jpg","IMGS/pic2.webp","IMGS/pic3.png"]
 *      OR set window.VJ_IMAGE_SOURCES = [...] before rendering.
 *   2) Each frame call:
 *        renderImageCollage(ctx, time, audioData, width, height);
 *
 * Features:
 *   - Cross-fades between images, scaled by bass "pulse"
 *   - Echo/feedback trail for motion persistence
 *   - Subtle chromatic shift + occasional glitch stripes
 *   - Randomized pan/zoom/rotate per image
 *   - Graceful if no audioData (uses time-based motion)
 */

const STATE = {
  ready: false,
  images: [],
  pointers: [], // [{img, w, h}]
  currentIndex: 0,
  nextAt: 0,
  crossfade: 1.5,      // seconds to crossfade
  hold: 5.0,           // seconds to hold before switching
  fxFeedback: 0.12,    // strength of frame feedback
  fxZoomDecay: 0.004,  // scale decay per frame in feedback
  fxRotateDecay: 0.0006,
  rng: mulberry32(1337),
  offA: null, offB: null, // offscreen for feedback
  offCtxA: null, offCtxB: null,
  // per-image transform plan
  plan: null,
  nextPlan: null,
  // glitches
  glitchCooldown: 0
};

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

async function ensureImages(){
  if (STATE.ready) return true;
  let sources = [];
  if (Array.isArray(window.VJ_IMAGE_SOURCES) && window.VJ_IMAGE_SOURCES.length){
    sources = window.VJ_IMAGE_SOURCES.slice();
  } else {
    try {
      // Try multiple paths for the IMGS folder
      const paths = [
        '/IMGS/index.json',
        '../IMGS/index.json',
        '../../IMGS/index.json',
        'IMGS/index.json'
      ];
      
      for (const path of paths) {
        try {
          const res = await fetch(path, {cache:'no-store'});
          if (res.ok) {
            sources = await res.json();
            console.log(`[collage] Found images at: ${path}`);
            break;
          }
        } catch (e) {
          console.log(`[collage] Failed to load from: ${path}`);
        }
      }
    } catch (e) {
      console.warn('[collage] Failed to load image sources:', e);
    }
  }
  if (!sources.length) {
    console.warn('[collage] No image sources found. Set window.VJ_IMAGE_SOURCES or provide IMGS/index.json');
    // Create a fallback canvas with text
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 400;
    fallbackCanvas.height = 300;
    const fallbackCtx = fallbackCanvas.getContext('2d');
    fallbackCtx.fillStyle = '#333';
    fallbackCtx.fillRect(0, 0, 400, 300);
    fallbackCtx.fillStyle = '#fff';
    fallbackCtx.font = '16px Arial';
    fallbackCtx.textAlign = 'center';
    fallbackCtx.fillText('No Images Found', 200, 150);
    
    // Create a fallback image pointer
    STATE.pointers = [{
      img: fallbackCanvas,
      w: 400,
      h: 300
    }];
    STATE.images = ['fallback'];
    STATE.ready = true;
    return true;
  }
  // Preload
  const loads = sources.map(src => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ok:true, img});
    img.onerror = () => resolve({ok:false});
    img.src = src;
  }));
  const results = await Promise.all(loads);
  const validResults = results.filter(r => r.ok);
  
  if (validResults.length === 0) {
    console.warn('[collage] No images loaded successfully');
    // Create fallback canvas
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 400;
    fallbackCanvas.height = 300;
    const fallbackCtx = fallbackCanvas.getContext('2d');
    fallbackCtx.fillStyle = '#333';
    fallbackCtx.fillRect(0, 0, 400, 300);
    fallbackCtx.fillStyle = '#fff';
    fallbackCtx.font = '16px Arial';
    fallbackCtx.textAlign = 'center';
    fallbackCtx.fillText('Images Failed to Load', 200, 150);
    
    STATE.pointers = [{
      img: fallbackCanvas,
      w: 400,
      h: 300
    }];
    STATE.images = ['fallback'];
    STATE.ready = true;
    return true;
  }
  
  STATE.pointers = validResults.map(r => ({
    img: r.img, w: r.img.naturalWidth, h: r.img.naturalHeight
  }));
  STATE.images = sources;
  STATE.ready = true;
  console.log(`[collage] Successfully loaded ${validResults.length} images`);
  return true;
}

function ensureOffscreen(width, height){
  if (!STATE.offA || STATE.offA.width !== width || STATE.offA.height !== height){
    STATE.offA = new OffscreenCanvas(width, height);
    STATE.offB = new OffscreenCanvas(width, height);
    STATE.offCtxA = STATE.offA.getContext('2d', {alpha: false});
    STATE.offCtxB = STATE.offB.getContext('2d', {alpha: false});
  }
}

function pickTransform(rng, width, height, iw, ih){
  // Random pan/zoom/rotate plan that keeps image fully covering the canvas
  const aspectC = width/height, aspectI = iw/ih;
  // Compute cover scale
  const baseScale = (aspectI > aspectC) ? height/ih : width/iw;
  const zoomAmt = 1.0 + 0.12 + rng()*0.18; // 1.12..1.30
  const rot = (rng()-0.5) * 0.1; // ~ +/- 0.05 rad
  const panX = (rng()-0.5) * 0.2; // -0.1..0.1 of canvas
  const panY = (rng()-0.5) * 0.2;
  return { baseScale, zoomAmt, rot, panX, panY };
}

function norm01(x){ return Math.max(0, Math.min(1, x)); }

function drawImagePlan(ctx, plan, img, width, height, scalePulse, alpha){
  const cx = width*0.5, cy = height*0.5;
  const s = plan.baseScale * (plan.zoomAmt + scalePulse);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx + plan.panX*width*0.5, cy + plan.panY*height*0.5);
  ctx.rotate(plan.rot);
  ctx.scale(s, s);
  ctx.drawImage(img, -img.naturalWidth/2, -img.naturalHeight/2);
  ctx.restore();
}

function rgbSplit(ctx, srcCanvas, width, height, shift){
  // Simple chromatic aberration: draw three channels with small offsets
  const tmp = STATE.offB; // reuse
  const tctx = STATE.offCtxB;
  tctx.clearRect(0,0,width,height);
  // Red
  tctx.globalCompositeOperation = 'source-over';
  tctx.filter = 'none';
  tctx.drawImage(srcCanvas, shift, 0);
  // Mask to red-ish by drawing a translucent red overlay in multiply
  tctx.globalCompositeOperation = 'multiply';
  tctx.fillStyle = 'rgba(255,0,0,0.5)';
  tctx.fillRect(0,0,width,height);

  // Copy to main
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(tmp, 0, 0);

  // Green
  tctx.globalCompositeOperation = 'source-over';
  tctx.clearRect(0,0,width,height);
  tctx.drawImage(srcCanvas, -shift, 0);
  tctx.globalCompositeOperation = 'multiply';
  tctx.fillStyle = 'rgba(0,255,0,0.5)';
  tctx.fillRect(0,0,width,height);
  ctx.drawImage(tmp, 0, 0);

  // Blue
  tctx.globalCompositeOperation = 'source-over';
  tctx.clearRect(0,0,width,height);
  tctx.drawImage(srcCanvas, 0, shift);
  tctx.globalCompositeOperation = 'multiply';
  tctx.fillStyle = 'rgba(0,0,255,0.5)';
  tctx.fillRect(0,0,width,height);
  ctx.drawImage(tmp, 0, 0);

  ctx.globalCompositeOperation = 'source-over';
}

function doGlitch(ctx, width, height, strength){
  // Occasional horizontal stripe offsets
  const stripes = 2 + (strength>0.5? 3:0);
  for(let i=0;i<stripes;i++){
    const h = Math.max(4, (height* (0.02 + Math.random()*0.06))|0);
    const y = (Math.random()*(height-h))|0;
    const xoff = ((Math.random() - 0.5) * strength * 40)|0;
    const img = ctx.getImageData(0, y, width, h);
    ctx.putImageData(img, xoff, y);
  }
}

export function renderImageCollage(ctx, time, audioData, width, height){
  // Prepare - handle async image loading
  if (!STATE.ready) {
    ensureImages().then(() => {
      // Images loaded, but we can't wait here
      console.log('[collage] Images loaded asynchronously');
    });
    // Show loading state
    // Original fade for image transitions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading Images...', width/2, height/2);
    return;
  }
  
  ensureOffscreen(width, height);
  const a = STATE.offCtxA, b = STATE.offCtxB;
  a.imageSmoothingEnabled = true; b.imageSmoothingEnabled = true;

  // Compute audio metrics
  const volume = (audioData && (audioData.volume ?? 0))|0;
  const bass = (audioData && (audioData.bass ?? 0))|0;
  const mid  = (audioData && (audioData.mid  ?? 0))|0;
  const treb = (audioData && (audioData.treble ?? 0))|0;
  const energy = Math.max(volume, Math.max(bass, Math.max(mid, treb)));
  const e01 = norm01(energy/255);

  // Initialize plans
  if (!STATE.plan && ready){
    const p0 = STATE.pointers[STATE.currentIndex];
    STATE.plan = pickTransform(STATE.rng, width, height, p0.w, p0.h);
    const n1 = (STATE.currentIndex+1)%STATE.pointers.length;
    const p1 = STATE.pointers[n1];
    STATE.nextPlan = pickTransform(STATE.rng, width, height, p1.w, p1.h);
    STATE.nextAt = time + STATE.hold;
  }

  // Feedback trail (slight zoom out + alpha)
  // Swap offscreens
  b.clearRect(0,0,width,height);
  b.drawImage(STATE.offA, 0, 0);
  a.save();
  a.globalAlpha = 1.0;
  a.setTransform(1,0,0,1,0,0);
  // Darken a bit (decay)
  a.fillStyle = `rgba(0,0,0,${0.25 + STATE.fxFeedback*0.25})`;
  a.fillRect(0,0,width,height);
  // draw previous frame back with slight shrink/rotate to create echo
  a.translate(width/2, height/2);
  a.rotate(-STATE.fxRotateDecay * (0.5 + e01));
  const sdecay = 1.0 - STATE.fxZoomDecay * (1 + e01*2);
  a.scale(sdecay, sdecay);
  a.globalAlpha = 0.86 - STATE.fxFeedback*0.3;
  a.drawImage(STATE.offB.canvas ?? STATE.offB, -width/2, -height/2, width, height);
  a.restore();

  // Determine crossfade
  let tToSwitch = STATE.nextAt - time;
  if (tToSwitch <= 0){
    // Advance
    STATE.currentIndex = (STATE.currentIndex + 1) % STATE.pointers.length;
    const n1 = (STATE.currentIndex+1)%STATE.pointers.length;
    STATE.plan = STATE.nextPlan;
    STATE.nextPlan = pickTransform(STATE.rng, width, height, STATE.pointers[n1].w, STATE.pointers[n1].h);
    STATE.nextAt = time + STATE.hold;
    tToSwitch = STATE.nextAt - time;
  }
  const fade = Math.min(STATE.crossfade, Math.max(0, STATE.crossfade - tToSwitch));
  const fade01 = norm01(fade / STATE.crossfade);

  // Pulse based on bass/energy
  const pulse = 0.02 + 0.06 * (bass/255) * (0.5 + 0.5*Math.sin(time*8.0));
  const pulseNext = 0.02 + 0.06 * (mid/255) * (0.5 + 0.5*Math.cos(time*7.3));

  // Draw current and next images
  const cur = STATE.pointers[STATE.currentIndex];
  const nxt = STATE.pointers[(STATE.currentIndex+1)%STATE.pointers.length];
  if (cur && cur.img){
    const alphaCur = 1.0 - fade01;
    drawImagePlan(a, STATE.plan, cur.img, width, height, pulse, alphaCur);
  }
  if (nxt && nxt.img){
    const alphaNext = fade01;
    drawImagePlan(a, STATE.nextPlan, nxt.img, width, height, pulseNext, alphaNext);
  }

  // Chromatic aberration proportional to treble
  const shift = Math.round(1 + 5*(treb/255));
  rgbSplit(a, STATE.offA, width, height, shift);

  // Occasional glitch when energy spikes
  STATE.glitchCooldown -= 1;
  if (STATE.glitchCooldown <= 0 && e01 > 0.65 && Math.random() < 0.05){
    doGlitch(a, width, height, e01);
    STATE.glitchCooldown = 20 + Math.floor(40*Math.random());
  }

  // finally blit to main ctx
  ctx.drawImage(STATE.offA.canvas ?? STATE.offA, 0, 0, width, height);
}
