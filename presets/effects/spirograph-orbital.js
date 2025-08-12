/**
 * Spirograph Orbital - Complex Orbital Mathematics Visualization
 * 
 * Features:
 * - Central energy core with dynamic glow
 * - 7 orbiting balls with different spirograph patterns
 * - Complex mathematical curves and trails
 * - Full audio reactivity affecting orbits and patterns
 * - WebGL2 acceleration with 2D fallback
 * - Real-time pattern generation
 */

let GL_STATE = null;
let ORBITAL_SYSTEM = null;

// Orbital system for 2D fallback
class OrbitalSystem {
  constructor() {
    this.centralCore = { x: 0, y: 0, radius: 0, energy: 0 };
    this.orbitals = [];
    this.trails = [];
    this.time = 0;
    this.maxTrailLength = 200;
    
    // Initialize 7 orbital balls with different spirograph parameters
    for (let i = 0; i < 7; i++) {
      this.orbitals.push({
        id: i,
        baseRadius: 80 + i * 20,           // Base orbital radius
        speed: 0.5 + i * 0.3,             // Orbital speed
        spirographRadius: 15 + i * 8,      // Spirograph pattern radius
        spirographSpeed: 2.0 + i * 1.5,   // Spirograph rotation speed
        phase: i * Math.PI / 3.5,          // Phase offset
        color: `hsl(${i * 51.4}, 80%, 60%)`, // Unique color for each
        trail: [],
        lastTrailPoint: { x: 0, y: 0, time: 0 }
      });
    }
  }

  update(deltaTime, audioData, width, height) {
    this.time += deltaTime;
    
    // Update central core
    this.centralCore.x = width / 2;
    this.centralCore.y = height / 2;
    this.centralCore.radius = 20 + (audioData?.bass || 0) * 0.3;
    this.centralCore.energy = (audioData?.volume || 0) / 255;
    
    // Update each orbital
    this.orbitals.forEach((orbital, index) => {
      // Audio-reactive parameters
      const bass = (audioData?.bass || 0) / 255;
      const mid = (audioData?.mid || 0) / 255;
      const treble = (audioData?.treble || 0) / 255;
      
      // Dynamic orbital radius based on audio
      const dynamicRadius = orbital.baseRadius + bass * 50 + mid * 30;
      
      // Orbital position
      const orbitalAngle = this.time * 0.001 * orbital.speed + orbital.phase;
      orbital.x = this.centralCore.x + Math.cos(orbitalAngle) * dynamicRadius;
      orbital.y = this.centralCore.y + Math.sin(orbitalAngle) * dynamicRadius;
      
      // Spirograph pattern position
      const spiroAngle = this.time * 0.001 * orbital.spirographSpeed + orbital.phase * 2;
      const spiroRadius = orbital.spirographRadius + treble * 20;
      
      // Final position combining orbital and spirograph
      orbital.finalX = orbital.x + Math.cos(spiroAngle) * spiroRadius;
      orbital.finalY = orbital.y + Math.sin(spiroAngle) * spiroRadius;
      
      // Add trail point
      if (this.time - orbital.lastTrailPoint.time > 16) { // 60fps trail updates
        orbital.trail.push({
          x: orbital.finalX,
          y: orbital.finalY,
          time: this.time,
          energy: this.centralCore.energy
        });
        
        // Limit trail length
        if (orbital.trail.length > this.maxTrailLength) {
          orbital.trail.shift();
        }
        
        orbital.lastTrailPoint = { x: orbital.finalX, y: orbital.finalY, time: this.time };
      }
    });
  }

  render(ctx, width, height) {
    // Clear with fade effect
    // Original fade for spirograph trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Render central core
    this.renderCentralCore(ctx);
    
    // Render orbital trails
    this.renderOrbitalTrails(ctx);
    
    // Render orbital balls
    this.renderOrbitalBalls(ctx);
    
    // Render energy connections
    this.renderEnergyConnections(ctx);
  }

  renderCentralCore(ctx) {
    const { x, y, radius, energy } = this.centralCore;
    
    // Core glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 + energy * 0.2})`);
    gradient.addColorStop(0.3, `rgba(0, 255, 255, ${0.6 + energy * 0.3})`);
    gradient.addColorStop(0.7, `rgba(255, 0, 255, ${0.3 + energy * 0.2})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Core body
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + energy * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Core highlight
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + energy * 0.3})`;
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  renderOrbitalTrails(ctx) {
    this.orbitals.forEach((orbital, index) => {
      if (orbital.trail.length < 2) return;
      
      ctx.strokeStyle = orbital.color;
      ctx.lineWidth = 2 + index * 0.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(orbital.trail[0].x, orbital.trail[0].y);
      
      for (let i = 1; i < orbital.trail.length; i++) {
        const point = orbital.trail[i];
        const alpha = (i / orbital.trail.length) * 0.8;
        ctx.strokeStyle = `${orbital.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla')}`;
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
      }
    });
  }

  renderOrbitalBalls(ctx) {
    this.orbitals.forEach((orbital, index) => {
      const { finalX, finalY, color } = orbital;
      const size = 8 + index * 2;
      
      // Ball glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      
      // Ball body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(finalX, finalY, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball highlight
      ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
      ctx.beginPath();
      ctx.arc(finalX - size * 0.3, finalY - size * 0.3, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    });
  }

  renderEnergyConnections(ctx) {
    // Connect central core to orbitals
    this.orbitals.forEach((orbital, index) => {
      const alpha = 0.3 + (this.centralCore.energy * 0.4);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(this.centralCore.x, this.centralCore.y);
      ctx.lineTo(orbital.x, orbital.y);
      ctx.stroke();
    });
    
    ctx.setLineDash([]);
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

  // Fragment shader for spirograph patterns
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
    
    // Mathematical functions
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
    
    // Spirograph function
    vec2 spirograph(vec2 p, float time, float radius, float speed, float phase) {
      float angle = time * speed + phase;
      return vec2(cos(angle), sin(angle)) * radius;
    }
    
    // Orbital position calculation
    vec2 orbitalPosition(vec2 center, float time, float radius, float speed, float phase) {
      float angle = time * speed + phase;
      return center + vec2(cos(angle), sin(angle)) * radius;
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
      
      vec2 center = vec2(0.0, 0.0);
      vec3 color = vec3(0.0);
      
      // Central core
      float coreDist = length(p);
      float coreRadius = 0.1 + bass * 0.05;
      float coreGlow = exp(-coreDist * 8.0) * (0.8 + volume * 0.4);
      color += vec3(1.0, 1.0, 1.0) * coreGlow;
      
      // 7 orbital balls with spirograph patterns
      for (int i = 0; i < 7; i++) {
        float fi = float(i);
        float orbitalRadius = 0.3 + fi * 0.1 + bass * 0.2;
        float orbitalSpeed = 0.5 + fi * 0.3;
        float orbitalPhase = fi * 3.14159 / 3.5;
        
        // Orbital position
        vec2 orbitalPos = orbitalPosition(center, time, orbitalRadius, orbitalSpeed, orbitalPhase);
        
        // Spirograph pattern
        float spiroRadius = 0.05 + fi * 0.02 + treble * 0.05;
        float spiroSpeed = 2.0 + fi * 1.5;
        vec2 spiroPos = spirograph(orbitalPos, time, spiroRadius, spiroSpeed, orbitalPhase * 2.0);
        
        // Final ball position
        vec2 ballPos = orbitalPos + spiroPos;
        float ballDist = length(p - ballPos);
        float ballSize = 0.02 + fi * 0.005;
        
        // Ball glow
        float ballGlow = exp(-ballDist * 50.0) * (0.6 + volume * 0.4);
        vec3 ballColor = hsv2rgb(vec3(fi * 0.143, 0.8, 0.8)); // 7 colors around the spectrum
        color += ballColor * ballGlow;
        
        // Orbital trail
        float trailIntensity = 0.0;
        for (int j = 0; j < 5; j++) {
          float trailTime = time - float(j) * 0.016; // 60fps trail
          vec2 trailPos = orbitalPosition(center, trailTime, orbitalRadius, orbitalSpeed, orbitalPhase);
          vec2 trailSpiro = spirograph(trailPos, trailTime, spiroRadius, spiroSpeed, orbitalPhase * 2.0);
          vec2 trailFinal = trailPos + trailSpiro;
          float trailDist = length(p - trailFinal);
          float trailAlpha = 1.0 - float(j) * 0.2;
          trailIntensity += exp(-trailDist * 30.0) * trailAlpha * 0.3;
        }
        color += ballColor * trailIntensity;
      }
      
      // Energy field connections
      float connectionIntensity = 0.0;
      for (int i = 0; i < 7; i++) {
        float fi = float(i);
        float orbitalRadius = 0.3 + fi * 0.1 + bass * 0.2;
        float orbitalSpeed = 0.5 + fi * 0.3;
        float orbitalPhase = fi * 3.14159 / 3.5;
        vec2 orbitalPos = orbitalPosition(center, time, orbitalRadius, orbitalSpeed, orbitalPhase);
        
        // Line from center to orbital
        vec2 lineDir = normalize(orbitalPos);
        float lineDist = abs(dot(p, vec2(-lineDir.y, lineDir.x)));
        float lineProj = dot(p, lineDir);
        float lineLength = length(orbitalPos);
        
        if (lineProj > 0.0 && lineProj < lineLength) {
          float lineAlpha = exp(-lineDist * 20.0) * 0.2 * (0.5 + volume * 0.5);
          connectionIntensity += lineAlpha;
        }
      }
      color += vec3(1.0, 1.0, 1.0) * connectionIntensity;
      
      // Add some noise for organic feel
      float noiseValue = noise(p * 10.0 + time * 0.5) * 0.05 * volume;
      color += noiseValue;
      
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
  // Initialize orbital system
  if (!ORBITAL_SYSTEM) {
    ORBITAL_SYSTEM = new OrbitalSystem();
  }
  
  const deltaTime = 16; // Assume 60fps
  ORBITAL_SYSTEM.update(deltaTime, audioData, width, height);
  ORBITAL_SYSTEM.render(ctx, width, height);
}

export function renderSpirographOrbital(ctx, time, audioData, width, height) {
  const ok = renderGL(ctx, time, audioData, width, height);
  if (!ok) {
    render2DFallback(ctx, time, audioData, width, height);
  }
}
