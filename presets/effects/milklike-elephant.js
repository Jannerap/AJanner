/**
 * MilkLike: "Artificial Inspiration — outward (approx)"
 * Drop-in: export function renderMilkLike(ctx, time, audioData, width, height)
 *
 * Inspired by the uploaded preset's outward "brainstorming" burst, with:
 * - audio-driven domain-warped noise flow
 * - outward spiral/kaleidoscope
 * - channel-shifted color grading + pseudo-bloom
 * - subtle scanlines/grain
 *
 * Keeps your 2D-canvas callsite unchanged by blitting from an offscreen WebGL2 canvas.
 */

let STATE = null;

function createGL(w, h){
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, w|0);
  canvas.height = Math.max(2, h|0);
  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
  if(!gl) return null;

  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, `#version 300 es
    precision highp float;
    const vec2 verts[3] = vec2[3](
      vec2(-1.0,-1.0),
      vec2( 3.0,-1.0),
      vec2(-1.0, 3.0)
    );
    out vec2 v_uv;
    void main(){
      vec2 p = verts[gl_VertexID];
      v_uv = 0.5*(p+1.0);
      gl_Position = vec4(p,0.0,1.0);
    }
  `);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, `#version 300 es
    precision highp float;
    in vec2 v_uv; out vec4 frag;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_bass, u_mid, u_treb, u_energy;
    uniform float u_decay;

    // Hash / noise utilities
    float hash21(vec2 p){
      p = fract(p*vec2(123.34, 345.45));
      p += dot(p, p+34.345);
      return fract(p.x*p.y);
    }
    vec2 hash22(vec2 p){ return vec2(hash21(p), hash21(p+19.19)); }

    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=hash21(i);
      float b=hash21(i+vec2(1,0));
      float c=hash21(i+vec2(0,1));
      float d=hash21(i+vec2(1,1));
      vec2 u=f*f*(3.-2.*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }

    // fBm
    float fbm(vec2 p){
      float s=0., a=0.5;
      mat2 m=mat2(1.6,1.2,-1.2,1.6);
      for(int i=0;i<5;i++){
        s += a*noise(p);
        p = m*p + 0.11;
        a *= 0.5;
      }
      return s;
    }

    vec3 hsv2rgb(vec3 c){
      vec3 p = abs(fract(c.xxx + vec3(0,2,1)/3.)*6.-3.);
      return c.z * mix(vec3(1.0), clamp(p-1.,0.,1.), c.y);
    }

    // Small neighborhood blur (cheap)
    vec3 blur(sampler2D tex, vec2 uv, vec2 texel){
      vec3 s = vec3(0.0);
      s += texture(tex, uv + texel*vec2(-1,-1)).rgb;
      s += texture(tex, uv + texel*vec2( 0,-1)).rgb;
      s += texture(tex, uv + texel*vec2( 1,-1)).rgb;
      s += texture(tex, uv + texel*vec2(-1, 0)).rgb;
      s += texture(tex, uv).rgb;
      s += texture(tex, uv + texel*vec2( 1, 0)).rgb;
      s += texture(tex, uv + texel*vec2(-1, 1)).rgb;
      s += texture(tex, uv + texel*vec2( 0, 1)).rgb;
      s += texture(tex, uv + texel*vec2( 1, 1)).rgb;
      return s/9.0;
    }

    void main(){
      vec2 res = u_res;
      vec2 uv = v_uv;
      vec2 p = uv*2.0-1.0;
      p.x *= res.x/res.y;

      // Audio features (0..1)
      float bass = clamp(u_bass/255.,0.,1.);
      float mid  = clamp(u_mid/255.,0.,1.);
      float treb = clamp(u_treb/255.,0.,1.);
      float energy = clamp(u_energy/255.,0.,1.);

      // Outward "brainstorming" push
      float t = u_time;
      float push = mix(0.4, 1.6, bass) + 0.5*mid;
      float rot  = t*0.35 + 1.2*bass;
      float sides = mix(6.0, 24.0, treb); // kaleidoscope count

      // Kaleidoscope warp
      float ang = atan(p.y, p.x) + rot + length(p)*2.0;
      float seg = 6.2831853/sides;
      ang = mod(ang, seg);
      ang = abs(ang - seg*0.5);
      vec2 q = vec2(cos(ang), sin(ang)) * length(p);

      // Domain-warped fbm field (audio-driven)
      float warpA = fbm(q*2.2 + vec2(t*0.25, -t*0.21));
      float warpB = fbm(q*3.4 + vec2(-t*0.18, t*0.22));
      vec2 flow = vec2(warpA, warpB);
      q += (flow-0.5) * (0.9 + 1.8*energy);

      // Spiral layering
      float a2 = atan(q.y,q.x);
      float r2 = length(q);
      float bandPulse = 0.4 + 0.6*energy;
      float spiral = sin(8.0*a2 + r2*14.0 + t*3.0*bandPulse);

      // Hue base from spiral + noise
      float n = fbm(q*3.0 + spiral);
      float hue = fract(0.1 + a2/(6.2831853) + 0.25*n + 0.05*t);
      float sat = mix(0.6, 1.0, clamp(energy*1.1 + treb*0.4,0.,1.));
      float val = mix(0.25, 1.2, smoothstep(0.0, 1.0, 1.0 - r2*0.7 + 0.6*n));

      vec3 base = hsv2rgb(vec3(hue, sat, val));

      // Channel mixing akin to "comp" tweaks
      vec3 shifted = base;
      shifted.r += 0.12*fbm(q*4.1 + 2.7 + t*0.4);
      shifted.g += 0.07*fbm(q*3.7 - 1.3 + t*0.3);
      shifted.b += 0.09*fbm(q*4.6 + 0.9 - t*0.25);

      // Radial glow
      float glow = exp(-r2*2.1) * (0.35 + 0.75*treb);
      vec3 col = shifted + glow;

      // Vignette + scanlines/grain
      float vig = smoothstep(1.25, 0.2, length(p));
      col *= vig;
      float scan = 0.03*sin(uv.y*res.y*3.14159 + t*7.0);
      float grain = (hash21(uv*res + t*11.0)-0.5)*0.035;
      col += scan + grain;

      frag = vec4(pow(col, vec3(1.1)), 1.0);
    }
  `);
  gl.compileShader(fs);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.useProgram(prog);

  const uni = {
    u_res: gl.getUniformLocation(prog, 'u_res'),
    u_time: gl.getUniformLocation(prog, 'u_time'),
    u_bass: gl.getUniformLocation(prog, 'u_bass'),
    u_mid: gl.getUniformLocation(prog, 'u_mid'),
    u_treb: gl.getUniformLocation(prog, 'u_treb'),
    u_energy: gl.getUniformLocation(prog, 'u_energy'),
    u_decay: gl.getUniformLocation(prog, 'u_decay')
  };

  return { gl, canvas, prog, vao, uni, w: canvas.width, h: canvas.height };
}

function ensure(w,h){
  if(!STATE || STATE.w!==w || STATE.h!==h){
    STATE = createGL(w,h);
  }
  return STATE;
}

function getBand(a, lo, hi){
  if(!a || !Array.isArray(a.bands) || a.bands.length===0) return 0;
  const n=a.bands.length, i0=Math.max(0, Math.floor(lo*n)), i1=Math.min(n, Math.ceil(hi*n));
  let s=0,c=0; for(let i=i0;i<i1;i++){ s+=a.bands[i]; c++; } return c? s/c : 0;
}

export function renderMilkLike(ctx, time, audio, width, height){
  const st = ensure(width, height);
  if(!st) {
    // Fallback to 2D rendering if WebGL2 fails
    render2DFallback(ctx, time, audio, width, height);
    return;
  }
  
  const { gl, canvas, uni, vao } = st;
  gl.viewport(0,0,canvas.width, canvas.height);
  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const bass = (audio && (audio.bass ?? getBand(audio, 0.00, 0.10))) || 0;
  const mid  = (audio && (audio.mid  ?? getBand(audio, 0.10, 0.40))) || 0;
  const treb = (audio && (audio.treble ?? getBand(audio, 0.60, 0.95))) || 0;
  const energy = (audio && (audio.volume ?? getBand(audio, 0.00, 0.95))) || 0;

  gl.useProgram(st.prog);
  gl.bindVertexArray(vao);
  gl.uniform2f(uni.u_res, canvas.width, canvas.height);
  gl.uniform1f(uni.u_time, time||0);
  gl.uniform1f(uni.u_bass, bass);
  gl.uniform1f(uni.u_mid, mid);
  gl.uniform1f(uni.u_treb, treb);
  gl.uniform1f(uni.u_energy, energy);
  gl.uniform1f(uni.u_decay, 0.9);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Blit
  try { ctx.drawImage(canvas, 0, 0, width, height); } catch(e){}
}

// 2D Fallback rendering function
function render2DFallback(ctx, time, audio, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Clear with fade effect
      // Audio-reactive fade for MilkDrop-style effects
    const audioIntensity = audioData ? (audioData.volume + audioData.bass) / 255 : 0.5;
    const fadeIntensity = 0.05 + audioIntensity * 0.15;
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeIntensity})`;
    ctx.fillRect(0, 0, width, height);
  
  // Audio-reactive parameters
  const bass = (audio && audio.bass) || 0;
  const mid = (audio && audio.mid) || 0;
  const treble = (audio && audio.treble) || 0;
  const volume = (audio && audio.volume) || 0;
  
  // Create outward "brainstorming" effect
  const push = (0.4 + (bass / 255) * 1.2) + (mid / 255) * 0.5;
  const rotation = time * 0.001 * 0.35 + (bass / 255) * 1.2;
  const sides = 6 + (treble / 255) * 18; // kaleidoscope count
  
  // Draw multiple layers
  for (let layer = 0; layer < 8; layer++) {
    const layerRadius = 30 + layer * 25 + (bass / 255) * 50;
    const layerAngle = rotation + layer * 0.5;
    
    // Kaleidoscope effect
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + layerAngle;
      const x = centerX + Math.cos(angle) * layerRadius;
      const y = centerY + Math.sin(angle) * layerRadius;
      
      // Audio-reactive size and color
      const size = 8 + (mid / 255) * 12 + Math.sin(time * 0.001 + i) * 4;
      const hue = (i / sides * 360 + time * 0.1 + layer * 45) % 360;
      const saturation = 70 + (volume / 255) * 30;
      const lightness = 50 + (treble / 255) * 30;
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  // Add energy field
  const energyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.6);
  energyGradient.addColorStop(0, `rgba(255, 255, 255, ${0.1 + volume / 500})`);
  energyGradient.addColorStop(0.5, `rgba(0, 255, 255, ${0.05 + bass / 500})`);
  energyGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = energyGradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}
