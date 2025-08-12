/**
 * Matrix Digital Rain — audio‑reactive
 * Signature: renderMatrixRain(ctx, time, audioData, width, height)
 *
 * Drop this into your render loop. Requires only a 2D canvas context.
 * - Speed & density react to `audioData.volume` (0..255), plus bass/mid/treble when available.
 * - Trails & glow mimic the classic Matrix look with modern polish.
 * - Optional: set `window.MATRIX_GLYPHS = ['ア','イ','3','A',...]` to override the glyph set.
 *
 * Example:
 *   import { renderMatrixRain } from './matrix-rain-visual.js';
 *   renderMatrixRain(ctx, t, audioData, w, h);
 */

const MATRIX = {
  init: false,
  cols: [], // per-column state
  colWidth: 18,
  rowHeight: 22,
  density: 0.9,
  speedBase: 48,   // px/sec at volume=0
  speedGain: 240,  // extra px/sec at volume=255
  fade: 0.08,      // trail fade per frame
  glow: true,
  atlas: null,
  actx: null,
  atlasScale: 1,
  glyphs: [],
  rng: matrixMulberry32(0xC0FFEE),
  lastW: 0, lastH: 0,
  lastTime: 0,
  // color palette
  colMain: 'rgb(0, 255, 140)',
  colDim: 'rgb(0, 200, 90)',
  colHead: 'rgb(220, 255, 220)'
};

function matrixMulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function defaultGlyphs(){
  const kana = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ';
  const ascii = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const symbols = '∴∵∷≡⊕⊗◇◆◈◉⊙○●◍◌◇◆◬◮◯';
  return (window.MATRIX_GLYPHS && Array.isArray(window.MATRIX_GLYPHS) && window.MATRIX_GLYPHS.length)
    ? window.MATRIX_GLYPHS.map(String)
    : (kana + ascii + symbols).split('');
}

function buildAtlas(fontPx){
  const scale = Math.max(1, Math.floor(fontPx/16));
  const glyphs = MATRIX.glyphs = defaultGlyphs();
  const cols = 16;
  const rows = Math.ceil(glyphs.length / cols);
  const cw = fontPx + 6*scale;
  const ch = Math.round(fontPx*1.2) + 6*scale;
  const w = cols*cw, h = rows*ch;

  // Use OffscreenCanvas if available, fallback to regular canvas
  let canvas;
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(w, h);
    } else {
      // Fallback for browsers without OffscreenCanvas support
      canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
    }
  } catch (e) {
    // Ultimate fallback
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  }

  const c = canvas.getContext('2d');
  c.clearRect(0,0,w,h);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `bold ${fontPx}px ui-monospace, Menlo, Consolas, monospace`;

  for (let i=0;i<glyphs.length;i++){
    const g = glyphs[i];
    const gx = (i % cols)*cw + cw/2;
    const gy = Math.floor(i/cols)*ch + ch/2;

    // outer glow
    c.shadowBlur = 16*scale;
    c.shadowColor = 'rgba(0,255,160,0.8)';
    c.fillStyle = 'rgba(120,255,190,0.85)';
    c.fillText(g, gx, gy);

    // core
    c.shadowBlur = 0;
    c.fillStyle = 'rgb(160,255,200)';
    c.fillText(g, gx, gy);
  }

  MATRIX.atlas = canvas;
  MATRIX.actx = c;
  MATRIX.atlasScale = scale;
  MATRIX.colWidth = cw;
  MATRIX.rowHeight = ch;
}

function resetGrid(width, height){
  const cols = Math.max(1, Math.floor(width / MATRIX.colWidth));
  MATRIX.cols = new Array(cols).fill(0).map((_, i) => ({
    x: i*MATRIX.colWidth,
    y: -Math.random()*height,    // head y position (can start above screen)
    speed: 60 + MATRIX.rng()*140, // px/sec base
    len: 6 + Math.floor(MATRIX.rng()*24), // trail length in glyphs
    glyphIdx: Math.floor(MATRIX.rng()*MATRIX.glyphs.length),
    flicker: 0, // frames left for bright head
  }));
}

function tickColumns(dt, energy01, bass01, mid01, treb01, height){
  const speedBoost = (MATRIX.speedBase + MATRIX.speedGain*energy01);
  for (let c of MATRIX.cols){
    // Random per-column wander
    const jitter = 6 * (0.3 + 0.7*treb01);
    const sp = c.speed + speedBoost + jitter*(MATRIX.rng()-0.5);
    c.y += sp * dt;
    if (c.y - c.len*MATRIX.rowHeight > height){
      // reset stream
      c.y = -MATRIX.rng()*height*0.3;
      c.speed = 60 + MATRIX.rng()*140;
      c.len = 6 + Math.floor(MATRIX.rng()*24*(0.5 + energy01));
      c.flicker = 6 + Math.floor(12*MATRIX.rng());
    }
    // occasional glyph change
    if (MATRIX.rng() < 0.02 + 0.05*mid01){
      c.glyphIdx = (c.glyphIdx + 1 + Math.floor(MATRIX.rng()*5)) % MATRIX.glyphs.length;
    }
    if (c.flicker > 0) c.flicker--;
  }
}

function drawRain(ctx, width, height){
  // Trail fade for smooth motion trails
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(0,0,0,${MATRIX.fade})`;
  ctx.fillRect(0,0,width,height);
  ctx.restore();

  const atlas = MATRIX.atlas;
  const cols = MATRIX.cols;
  const gw = MATRIX.colWidth, gh = MATRIX.rowHeight;
  const gcols = 16;
  const cw = gw, ch = gh;

  for (let c of cols){
    // draw from tail to head
    for (let i=0; i<c.len; i++){
      const yy = Math.round(c.y - i*gh);
      if (yy < -gh || yy > height+gh) continue;

      const idx = (c.glyphIdx + i) % MATRIX.glyphs.length;
      const sx = (idx % gcols) * cw;
      const sy = Math.floor(idx / gcols) * ch;

      let a = 0.08 + 0.92 * (1 - i/c.len); // alpha from tail to head
      // brighter head
      if (i === 0){
        a = 1.0;
      } else if (i < 3){
        a = Math.min(0.75, a + 0.1);
      }

      // tint: head is whitish-green, tail is dimmer green
      const head = (i === 0);
      const tint = head ? MATRIX.colHead : ((i<3) ? MATRIX.colMain : MATRIX.colDim);

      // draw glyph with tint
      ctx.save();
      ctx.globalAlpha = a;
      ctx.globalCompositeOperation = 'lighter';
      // draw
      ctx.drawImage(atlas, sx, sy, cw, ch, Math.round(c.x), yy, cw, ch);
      // overlay color
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = tint;
      ctx.fillRect(Math.round(c.x), yy, cw, ch);
      ctx.restore();

      // glow behind brighter segments
      if (head || i < 3){
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(0,255,170,0.05)';
        ctx.fillRect(Math.round(c.x)-1, yy-1, cw+2, ch+2);
        ctx.restore();
      }
    }
  }
}

export function renderMatrixRain(ctx, time, audioData, width, height){
  try {
    // (Re)build atlas & grid when size or font step changes
    const fontPx = Math.max(12, Math.round(height / 36)); // scale with height
    const needAtlas = !MATRIX.atlas || MATRIX.rowHeight < fontPx*1.1 || MATRIX.rowHeight > fontPx*1.6;
    const resized = (MATRIX.lastW !== width || MATRIX.lastH !== height);

    if (needAtlas){
      buildAtlas(fontPx);
      resetGrid(width, height);
    } else if (resized){
      resetGrid(width, height);
    }

    MATRIX.lastW = width; MATRIX.lastH = height;
    if (!MATRIX.init){ MATRIX.init = true; MATRIX.lastTime = time; }

    // Audio metrics
    const vol = (audioData && (audioData.volume ?? 0))|0;
    const bass = (audioData && (audioData.bass ?? 0))|0;
    const mid  = (audioData && (audioData.mid  ?? 0))|0;
    const treb = (audioData && (audioData.treble ?? 0))|0;
    const e01 = Math.max(vol, bass, mid, treb) / 255;
    const b01 = bass/255, m01 = mid/255, t01 = treb/255;

    // Timing
    const dt = Math.max(0.001, Math.min(0.05, time - MATRIX.lastTime));
    MATRIX.lastTime = time;

    // Reactivity: density + fades + occasional burst
    MATRIX.fade = 0.06 + 0.10*(1-e01); // louder -> longer trails (smaller fade)
    if (e01 > 0.8 && Math.random() < 0.03){
      // burst: briefly increase lengths
      for (let c of MATRIX.cols) c.len = Math.min(40, c.len + 2 + (Math.random()*6|0));
    }

    tickColumns(dt, e01, b01, m01, t01, height);
    drawRain(ctx, width, height);
  } catch (error) {
    console.warn('⚠️ Matrix Rain render failed, using fallback:', error);
    renderMatrixRainFallback(ctx, time, audioData, width, height);
  }
}

// 2D Canvas fallback for Matrix Rain
function renderMatrixRainFallback(ctx, time, audioData, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const t = time * 0.001;
  
      // Audio-reactive fade for Matrix rain trails
    const audioIntensity = audioData ? (audioData.volume + audioData.bass) / 255 : 0.5;
    const fadeIntensity = 0.05 + audioIntensity * 0.15;
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeIntensity})`;
    ctx.fillRect(0, 0, width, height);
  
  // Audio-reactive parameters
  const volume = (audioData && audioData.volume) ? audioData.volume / 255 : 0.5;
  const bass = (audioData && audioData.bass) ? audioData.bass / 255 : 0.5;
  
  // Draw Matrix-style digital rain
  const cols = Math.floor(width / 20);
  const speed = 2 + volume * 3;
  const density = 0.3 + bass * 0.4;
  
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  for (let i = 0; i < cols; i++) {
    if (Math.random() > density) continue;
    
    const x = i * 20;
    const y = (t * speed * 100 + i * 50) % (height + 100) - 50;
    
    // Trail effect
    for (let j = 0; j < 8; j++) {
      const alpha = (1 - j / 8) * 0.8;
      const trailY = y - j * 20;
      
      if (trailY < -20 || trailY > height) continue;
      
      ctx.fillStyle = `rgba(0, 255, 140, ${alpha})`;
      ctx.fillText('01', x, trailY);
      
      // Glow effect
      ctx.shadowColor = 'rgba(0, 255, 140, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText('01', x, trailY);
      ctx.shadowBlur = 0;
    }
  }
}
