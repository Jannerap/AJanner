/**
 * Rainbow Spiral (GL Edition) — drop-in replacement
 * Signature preserved: renderRainbowSpiral(ctx, time, audioData, width, height)
 *
 * - Renders a high-detail kaleidoscopic spiral via WebGL2 fragment shader.
 * - Blits to the provided 2D canvas context (`ctx`) for compatibility.
 * - Falls back gracefully to 2D particles if WebGL2 is unavailable.
 *
 * Audio coupling:
 *  audioData can provide:
 *    - volume (0..255)
 *    - bass, mid, treble (0..255)
 *    - bands[] (array of fft magnitudes 0..255)
 */

let GL_STATE = null;

function makeGL(width, height) {
  const glCanvas = document.createElement('canvas');
  glCanvas.width = Math.max(2, width|0);
  glCanvas.height = Math.max(2, height|0);
  const gl = glCanvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false });
  if (!gl) return null;

  const vtx = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vtx, `#version 300 es
    precision highp float;
    const vec2 verts[3] = vec2[3](
      vec2(-1.0,-1.0),
      vec2( 3.0,-1.0),
      vec2(-1.0, 3.0)
    );
    out vec2 v_uv;
    void main() {
      vec2 p = verts[gl_VertexID];
      v_uv = 0.5 * (p + 1.0);
      gl_Position = vec4(p, 0.0, 1.0);
    }
  `);
  gl.compileShader(vtx);

  const fsh = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fsh, `#version 300 es
    precision highp float;
    in vec2 v_uv;
    out vec4 fragColor;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_bass;
    uniform float u_mid;
    uniform float u_treble;

    float hash21(vec2 p){
      p = fract(p*vec2(123.34, 345.45));
      p += dot(p, p+34.345);
      return fract(p.x*p.y);
    }
    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i);
      float b = hash21(i+vec2(1.0,0.0));
      float c = hash21(i+vec2(0.0,1.0));
      float d = hash21(i+vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    vec2 kaleido(vec2 p, float sides){
      float ang = atan(p.y, p.x);
      float r = length(p);
      float sector = 6.28318530718 / sides;
      ang = mod(ang, sector);
      ang = abs(ang - sector*0.5);
      return vec2(cos(ang), sin(ang)) * r;
    }

    void main(){
      vec2 uv = v_uv;
      vec2 res = u_res;
      vec2 p = (uv*2.0 - 1.0);
      p.x *= res.x/res.y;

      float bass = clamp(u_bass/255.0, 0.0, 1.0);
      float mid  = clamp(u_mid/255.0,  0.0, 1.0);
      float treb = clamp(u_treble/255.0,0.0, 1.0);
      float energy = bass*0.6 + mid*0.3 + treb*0.1;

      float t = u_time * (1.0 + 0.6*energy);
      float sides = mix(5.0, 10.0 + 12.0*treb, 0.8);
      vec2 q = kaleido(p, sides);

      float a = atan(q.y, q.x);
      float r = length(q);
      float rot = t*0.25 + bass*0.7;
      a += r*6.0 + rot*2.5;

      float n = 0.0;
      for (int i=0; i<4; ++i){
        float fi = float(i);
        float k = 2.0 + fi*0.7 + mid*1.2;
        n += noise(q*k + vec2(t*0.2 + fi, -t*0.15 - fi));
      }
      n /= 4.0;

      float hue = fract(0.5 + a/(6.28318530718) + n*0.2 + t*0.03);
      float sat = mix(0.6, 1.0, clamp(energy*1.2, 0.0, 1.0));
      float val = mix(0.3, 1.0, smoothstep(0.0, 1.0, 1.0 - r*0.6 + n*0.4));

      float h = hue*6.0;
      float c = val*sat;
      float x = c*(1.0 - abs(mod(h, 2.0)-1.0));
      vec3 rgb;
      if (0.0<=h && h<1.0) rgb=vec3(c,x,0);
      else if (1.0<=h && h<2.0) rgb=vec3(x,c,0);
      else if (2.0<=h && h<3.0) rgb=vec3(0,c,x);
      else if (3.0<=h && h<4.0) rgb=vec3(0,x,c);
      else if (4.0<=h && h<5.0) rgb=vec3(x,0,c);
      else rgb=vec3(c,0,x);
      vec3 m = vec3(val - c);

      float glow = exp(-r*2.2) * (0.3 + 0.7*treb);
      vec3 col = rgb + m + glow;

      float scan = 0.04 * sin(uv.y*res.y*3.14159 + t*6.0);
      float grain = (hash21(uv*res + t*10.0)-0.5)*0.04;
      col += scan + grain;

      float vig = smoothstep(1.2, 0.2, length(p));
      col *= vig;

      fragColor = vec4(pow(col, vec3(1.1)), 1.0);
    }
  `);
  gl.compileShader(fsh);

  const prog = gl.createProgram();
  gl.attachShader(prog, vtx);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.useProgram(prog);

  const uni = {
    u_res: gl.getUniformLocation(prog, 'u_res'),
    u_time: gl.getUniformLocation(prog, 'u_time'),
    u_bass: gl.getUniformLocation(prog, 'u_bass'),
    u_mid: gl.getUniformLocation(prog, 'u_mid'),
    u_treble: gl.getUniformLocation(prog, 'u_treble'),
  };

  return { gl, glCanvas, prog, vao, uni, w: glCanvas.width, h: glCanvas.height };
}

function ensureGL(width, height) {
  if (!GL_STATE) {
    GL_STATE = makeGL(width, height);
  } else if (GL_STATE && (GL_STATE.w !== width || GL_STATE.h !== height)) {
    GL_STATE = makeGL(width, height);
  }
  return GL_STATE;
}

function getBand(a, lo, hi){
  if (!a || !Array.isArray(a.bands) || a.bands.length === 0) return 0;
  const n = a.bands.length;
  const i0 = Math.max(0, Math.floor(lo * n));
  const i1 = Math.min(n, Math.ceil(hi * n));
  let sum = 0, cnt = 0;
  for (let i=i0; i<i1; i++){ sum += a.bands[i]; cnt++; }
  return cnt ? sum/cnt : 0;
}

function renderGL(ctx2d, time, audioData, width, height){
  const st = ensureGL(width, height);
  if (!st) return false;
  const { gl, glCanvas, uni, vao } = st;
  gl.viewport(0,0,glCanvas.width, glCanvas.height);
  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const bass = (audioData && (audioData.bass ?? getBand(audioData, 0.00, 0.10))) || 0;
  const mid  = (audioData && (audioData.mid  ?? getBand(audioData, 0.10, 0.40))) || 0;
  const treb = (audioData && (audioData.treble ?? getBand(audioData, 0.60, 0.95))) || 0;

  gl.useProgram(st.prog);
  gl.bindVertexArray(vao);
  gl.uniform2f(uni.u_res, glCanvas.width, glCanvas.height);
  gl.uniform1f(uni.u_time, time || 0);
  gl.uniform1f(uni.u_bass, bass);
  gl.uniform1f(uni.u_mid, mid);
  gl.uniform1f(uni.u_treble, treb);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  try {
    ctx2d.drawImage(glCanvas, 0, 0, width, height);
  } catch (e) {}
  return true;
}

function render2DFallback(ctx, time, audioData, width, height){
  const cx = width/2, cy = height/2;
  ctx.globalCompositeOperation = 'source-over';
  // Original fade for kaleidoscope effects
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation = 'lighter';

  const vol = (audioData && audioData.volume) || 64;
  const n = 420;
  for (let i=0;i<n;i++){
    const t = time + i*0.003;
    const r = (Math.sin(t*0.7 + i*0.05) * 0.5 + 0.5) * Math.min(cx, cy) * 0.95;
    const a = t*0.8 + i*0.15;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const hue = (i*0.7 + time*20) % 360;
    const s = 0.6 + 0.4*Math.sin(time + i*0.1);
    const size = 0.7 + (vol/255)*3.0 * (0.5 + 0.5*Math.sin(i*0.2+time*2.0));
    ctx.fillStyle = `hsla(${hue},${80+20*s}%,${55 + 15*s}%,0.9)`;
    ctx.beginPath();
    ctx.arc(x,y,size,0,Math.PI*2);
    ctx.fill();
  }
  const grd = ctx.createRadialGradient(cx, cy, Math.min(cx,cy)*0.1, cx, cy, Math.max(cx,cy));
  grd.addColorStop(0,'rgba(0,0,0,0)');
  grd.addColorStop(1,'rgba(0,0,0,0.25)');
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation = 'source-over';
}

export function renderRainbowSpiral(ctx, time, audioData, width, height){
  const ok = renderGL(ctx, time, audioData, width, height);
  if (!ok) {
    render2DFallback(ctx, time, audioData, width, height);
  }
}