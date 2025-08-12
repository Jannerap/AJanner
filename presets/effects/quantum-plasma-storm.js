/**
 * Quantum Plasma Storm - Advanced WebGL2 Visualization
 * 
 * Features:
 * - Multi-layered particle systems with physics
 * - Fluid dynamics simulation
 * - Complex audio-reactive color mapping
 * - Real-time shader effects
 * - Performance-optimized rendering
 * - Fallback to 2D Canvas
 */

let GL_STATE = null;
let PARTICLE_SYSTEM = null;

// Particle system for 2D fallback
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.emitters = [];
    this.time = 0;
  }

  addEmitter(x, y, intensity) {
    this.emitters.push({ x, y, intensity, lastEmit: 0 });
  }

  update(deltaTime, audioData) {
    this.time += deltaTime;
    
    // Emit new particles
    this.emitters.forEach(emitter => {
      if (this.time - emitter.lastEmit > 50) { // Emit every 50ms
        for (let i = 0; i < emitter.intensity; i++) {
          this.particles.push({
            x: emitter.x + (Math.random() - 0.5) * 20,
            y: emitter.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            decay: 0.98,
            size: Math.random() * 3 + 1,
            hue: Math.random() * 360,
            type: Math.floor(Math.random() * 3)
          });
        }
        emitter.lastEmit = this.time;
      }
    });

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.life *= p.decay;
      p.size *= 0.995;
      p.hue += 2;
      
      return p.life > 0.01 && p.size > 0.1;
    });
  }

  render(ctx, width, height) {
    ctx.globalCompositeOperation = 'lighter';
    
    this.particles.forEach(p => {
      const alpha = p.life * 0.8;
      const size = p.size * (1 + p.life);
      
      if (p.type === 0) {
        // Energy particles
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 1) {
        // Plasma trails
        ctx.strokeStyle = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.5})`;
        ctx.lineWidth = size * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.stroke();
      } else {
        // Quantum sparks
        ctx.fillStyle = `hsla(${p.hue + 180}, 100%, 80%, ${alpha})`;
        ctx.fillRect(p.x - size/2, p.y - size/2, size, size);
      }
    });
    
    ctx.globalCompositeOperation = 'source-over';
  }
}

function makeGL(width, height) {
  const glCanvas = document.createElement('canvas');
  glCanvas.width = Math.max(2, width|0);
  glCanvas.height = Math.max(2, height|0);
  const gl = glCanvas.getContext('webgl2', { 
    antialias: true, 
    premultipliedAlpha: false,
    powerPreference: 'high-performance'
  });
  if (!gl) return null;

  // Vertex shader for full-screen quad
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

  // Fragment shader with advanced effects
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
    uniform float u_volume;
    
    // Noise functions
    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.78));
      p += dot(p, p + 34.56);
      return fract(p.x * p.y);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }
    
    // Plasma functions
    float plasma(vec2 p, float time) {
      float v1 = sin(p.x * 10.0 + time);
      float v2 = sin(p.y * 10.0 + time * 0.5);
      float v3 = sin(sqrt(p.x * p.x + p.y * p.y) * 8.0 + time);
      return (v1 + v2 + v3) / 3.0;
    }
    
    // Color functions
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    void main() {
      vec2 uv = v_uv;
      vec2 res = u_res;
      vec2 p = (uv * 2.0 - 1.0) * vec2(res.x / res.y, 1.0);
      
      float time = u_time * 0.001;
      float bass = clamp(u_bass / 255.0, 0.0, 1.0);
      float mid = clamp(u_mid / 255.0, 0.0, 1.0);
      float treble = clamp(u_treble / 255.0, 0.0, 1.0);
      float volume = clamp(u_volume / 255.0, 0.0, 1.0);
      
      // Energy level based on audio
      float energy = bass * 0.5 + mid * 0.3 + treble * 0.2;
      float intensity = volume * 2.0 + energy * 3.0;
      
      // Multiple plasma layers
      float plasma1 = plasma(p * 3.0, time * 2.0 + bass * 10.0);
      float plasma2 = plasma(p * 5.0 + vec2(0.5), time * 1.5 + mid * 8.0);
      float plasma3 = plasma(p * 7.0 + vec2(-0.3), time * 3.0 + treble * 12.0);
      
      // Combine plasma layers
      float plasmaMix = (plasma1 * 0.4 + plasma2 * 0.3 + plasma3 * 0.3) * intensity;
      
      // Fractal noise for organic movement
      float fractal = fbm(p * 4.0 + time * 0.5) * 0.5 + 0.5;
      
      // Vortex effect
      float angle = atan(p.y, p.x);
      float radius = length(p);
      float vortex = sin(angle * 8.0 + radius * 10.0 - time * 3.0) * 0.5 + 0.5;
      
      // Combine all effects
      float finalValue = (plasmaMix * 0.6 + fractal * 0.3 + vortex * 0.1) * intensity;
      
      // Dynamic color mapping
      float hue = fract(time * 0.1 + finalValue * 0.5 + energy * 0.3);
      float saturation = 0.8 + energy * 0.2;
      float value = 0.3 + finalValue * 0.7;
      
      // Create base color
      vec3 color = hsv2rgb(vec3(hue, saturation, value));
      
      // Add energy glow
      float glow = exp(-radius * 1.5) * (0.5 + energy * 0.5);
      color += vec3(glow * 0.3, glow * 0.6, glow) * intensity;
      
      // Add scan lines
      float scan = 0.1 * sin(uv.y * res.y * 0.1 + time * 10.0) * (0.5 + energy * 0.5);
      color += scan;
      
      // Add grain
      float grain = (hash21(uv * res + time * 100.0) - 0.5) * 0.05 * intensity;
      color += grain;
      
      // Vignette
      float vignette = smoothstep(1.5, 0.3, length(p));
      color *= vignette;
      
      // Final color with gamma correction
      color = pow(color, vec3(1.0 / 2.2));
      
      fragColor = vec4(color, 1.0);
    }
  `);
  gl.compileShader(fsh);

  // Check for shader compilation errors
  if (!gl.getShaderParameter(vtx, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vtx));
    return null;
  }
  if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fsh));
    return null;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vtx);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(prog));
    return null;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.useProgram(prog);

  const uni = {
    u_res: gl.getUniformLocation(prog, 'u_res'),
    u_time: gl.getUniformLocation(prog, 'u_time'),
    u_bass: gl.getUniformLocation(prog, 'u_bass'),
    u_mid: gl.getUniformLocation(prog, 'u_mid'),
    u_treble: gl.getUniformLocation(prog, 'u_treble'),
    u_volume: gl.getUniformLocation(prog, 'u_volume'),
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

function renderGL(ctx2d, time, audioData, width, height) {
  const st = ensureGL(width, height);
  if (!st) return false;
  
  const { gl, glCanvas, uni, vao } = st;
  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Extract audio data with fallbacks
  const bass = (audioData && audioData.bass) || 0;
  const mid = (audioData && audioData.mid) || 0;
  const treble = (audioData && audioData.treble) || 0;
  const volume = (audioData && audioData.volume) || 128;

  gl.useProgram(st.prog);
  gl.bindVertexArray(vao);
  gl.uniform2f(uni.u_res, glCanvas.width, glCanvas.height);
  gl.uniform1f(uni.u_time, time || 0);
  gl.uniform1f(uni.u_bass, bass);
  gl.uniform1f(uni.u_mid, mid);
  gl.uniform1f(uni.u_treble, treble);
  gl.uniform1f(uni.u_volume, volume);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  try {
    ctx2d.drawImage(glCanvas, 0, 0, width, height);
  } catch (e) {
    console.warn('WebGL to Canvas transfer failed:', e);
  }
  return true;
}

function render2DFallback(ctx, time, audioData, width, height) {
  // Initialize particle system
  if (!PARTICLE_SYSTEM) {
    PARTICLE_SYSTEM = new ParticleSystem();
  }
  
  const deltaTime = 16; // Assume 60fps
  PARTICLE_SYSTEM.update(deltaTime, audioData);
  
  // Clear with fade effect
      // Original fade for storm effects
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
  
  // Add dynamic emitters based on audio
  const centerX = width / 2;
  const centerY = height / 2;
  const bass = (audioData && audioData.bass) || 0;
  const mid = (audioData && audioData.mid) || 0;
  const treble = (audioData && audioData.treble) || 0;
  
  // Clear old emitters and add new ones
  PARTICLE_SYSTEM.emitters = [];
  
  // Center energy core
  PARTICLE_SYSTEM.addEmitter(centerX, centerY, 3 + Math.floor(bass / 20));
  
  // Orbital emitters
  const orbitalCount = 3 + Math.floor(mid / 30);
  for (let i = 0; i < orbitalCount; i++) {
    const angle = (time * 0.001 + i * Math.PI * 2 / orbitalCount);
    const radius = 100 + treble * 0.5;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    PARTICLE_SYSTEM.addEmitter(x, y, 2 + Math.floor(treble / 25));
  }
  
  // Render particle system
  PARTICLE_SYSTEM.render(ctx, width, height);
  
  // Add energy field
  const energyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.8);
  energyGradient.addColorStop(0, `rgba(0, 255, 255, ${0.1 + bass / 500})`);
  energyGradient.addColorStop(0.5, `rgba(255, 0, 255, ${0.05 + mid / 500})`);
  energyGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = energyGradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

export function renderQuantumPlasmaStorm(ctx, time, audioData, width, height) {
  const ok = renderGL(ctx, time, audioData, width, height);
  if (!ok) {
    render2DFallback(ctx, time, audioData, width, height);
  }
}
