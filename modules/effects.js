/**
 * Effects Module - All visualization rendering functions
 * Provides 37+ high-quality visualization effects
 */

// Base effects class with common functionality
class EffectsRenderer {
  constructor(ctx, time, audioData) {
    this.ctx = ctx;
    this.time = time;
    this.audioData = audioData;
  }

  // Safety functions
  safeRadius(radius) {
    return Math.max(1, radius);
  }

  safeSize(size) {
    return Math.max(1, size);
  }

  // Utility functions
  getCenter(width, height) {
    return { x: width / 2, y: height / 2 };
  }

  getAudioReactiveValue(baseValue, audioMultiplier = 0.1) {
    return baseValue + (this.audioData.volume * audioMultiplier);
  }

  getAudioReactiveColor(baseHue, audioShift = 0) {
    const hue = (baseHue + audioShift + this.time * 30) % 360;
    const saturation = 80 + (this.audioData.bass * 0.2);
    const lightness = 60 + (this.audioData.treble * 0.3);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}

// Waveform rendering
export function renderWaveform(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Draw multiple wave layers
  for (let layer = 0; layer < 3; layer++) {
    const layerOffset = layer * 0.3;
    const layerHeight = 80 + layer * 20;
    const layerWidth = renderer.getAudioReactiveValue(2, 0.05);
    
    ctx.strokeStyle = renderer.getAudioReactiveColor(200 + layer * 60, layer * 30);
    ctx.lineWidth = layerWidth;
    ctx.beginPath();
    
    for (let x = 0; x < width; x += 4) {
      const progress = x / width;
      const wave = Math.sin(progress * Math.PI * 4 + time * 2 + layerOffset);
      const audioWave = Math.sin(progress * Math.PI * 8 + time * 4) * (audioData.volume * 0.1);
      const y = center.y + wave * layerHeight + audioWave * 20;
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
}

// Particle system rendering
export function renderParticles(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  const particleCount = renderer.getAudioReactiveValue(80, 0.5);
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + time;
    const radius = 100 + Math.sin(time * 1.5 + i * 0.1) * 50;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.1));
    
    ctx.fillStyle = renderer.getAudioReactiveColor(i * 7, i * 5);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Ring system rendering
export function renderRings(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  for (let ring = 0; ring < 6; ring++) {
    const ringRadius = (time * 25 + ring * 35) % (Math.max(width, height) / 2);
    const ringOpacity = Math.max(0, 1 - (ringRadius / (Math.max(width, height) / 2)));
    const ringWidth = renderer.safeSize(renderer.getAudioReactiveValue(4, 0.1));
    
    // Ensure radius is always positive
    const finalRadius = renderer.safeRadius(ringRadius);
    
    ctx.strokeStyle = `hsla(${(time * 120 + ring * 50) % 360}, 80%, 60%, ${ringOpacity})`;
    ctx.lineWidth = ringWidth;
    ctx.beginPath();
    ctx.arc(center.x, center.y, finalRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Spectrum bars rendering
export function renderSpectrum(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  const barCount = 32;
  const barWidth = width / barCount;
  
  for (let i = 0; i < barCount; i++) {
    const barHeight = renderer.getAudioReactiveValue(20, 0.3) + 
                     Math.sin(time * 2 + i * 0.2) * 30 +
                     (audioData.frequency[i * 8] || 0) * 0.5;
    
    const x = i * barWidth;
    const y = center.y + renderer.safeSize(barHeight);
    
    ctx.fillStyle = renderer.getAudioReactiveColor(i * 11, i * 10);
    ctx.fillRect(x, y, barWidth - 2, renderer.safeSize(barHeight));
  }
}

// Geometric shapes rendering
export function renderShapes(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time;
    const radius = 60 + Math.sin(time + i * 0.5) * 20;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(15, 0.1));
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time + i * 0.5);
    
    ctx.fillStyle = renderer.getAudioReactiveColor(i * 45, i * 20);
    ctx.beginPath();
    
    if (i % 3 === 0) {
      // Triangle
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.lineTo(-size * 0.866, size * 0.5);
    } else if (i % 3 === 1) {
      // Square
      ctx.rect(-size, -size, size * 2, size * 2);
    } else {
      // Circle
      ctx.arc(0, 0, size, 0, Math.PI * 2);
    }
    
    ctx.fill();
    ctx.restore();
  }
}

// Spiral rendering
export function renderSpiral(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  ctx.strokeStyle = renderer.getAudioReactiveColor(180, 0);
  ctx.lineWidth = renderer.getAudioReactiveValue(2, 0.05);
  ctx.beginPath();
  
  for (let i = 0; i < 200; i++) {
    const progress = i / 200;
    const angle = progress * Math.PI * 8 + time * 2;
    const radius = progress * 150 + Math.sin(time + i * 0.1) * 20;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

// Matrix rain rendering
export function renderMatrix(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const columnCount = 40;
  const columnWidth = width / columnCount;
  
  for (let col = 0; col < columnCount; col++) {
    const x = col * columnWidth;
    const speed = 1 + Math.sin(time + col * 0.1) * 0.5;
    const dropCount = renderer.getAudioReactiveValue(8, 0.2);
    
    for (let drop = 0; drop < dropCount; drop++) {
      const y = ((time * 50 * speed + drop * 30) % height);
      const size = renderer.safeSize(renderer.getAudioReactiveValue(12, 0.05));
      const opacity = Math.max(0.1, 1 - (drop / dropCount));
      
      ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
      ctx.font = `${size}px monospace`;
      ctx.fillText('01', x, y);
    }
  }
}

// Fireworks rendering
export function renderFireworks(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const fireworkCount = 3;
  
  for (let fw = 0; fw < fireworkCount; fw++) {
    const centerX = width * 0.3 + (fw * 0.2) * width;
    const centerY = height * 0.3 + Math.sin(time + fw) * 50;
    const particleCount = 30;
    
    for (let p = 0; p < particleCount; p++) {
      const angle = (p / particleCount) * Math.PI * 2;
      const velocity = 3 + Math.sin(time * 2 + p * 0.2) * 2;
      const x = centerX + Math.cos(angle) * velocity * (time * 20);
      const y = centerY + Math.sin(angle) * velocity * (time * 20);
      const size = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.1));
      
      ctx.fillStyle = renderer.getAudioReactiveColor(fw * 120 + p * 12, p * 5);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Neon grid rendering
export function renderNeonGrid(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const gridSize = 40;
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;
  
  ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + pulse * 0.4})`;
  ctx.lineWidth = renderer.getAudioReactiveValue(1, 0.05);
  
  // Vertical lines
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Add pulsing nodes at intersections
  for (let x = gridSize / 2; x < width; x += gridSize) {
    for (let y = gridSize / 2; y < height; y += gridSize) {
      const nodeSize = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.1));
      ctx.fillStyle = renderer.getAudioReactiveColor(180, 0);
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Cosmic dust rendering
export function renderCosmicDust(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const particleCount = renderer.getAudioReactiveValue(60, 0.3);
  
  for (let i = 0; i < particleCount; i++) {
    const x = (i * 13.37) % width;
    const y = (i * 7.89 + time * 20) % height;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(2, 0.05));
    const opacity = Math.sin(time + i * 0.1) * 0.5 + 0.5;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add trail
    if (opacity > 0.3) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + size * 3);
      ctx.stroke();
    }
  }
}

// Liquid metal rendering
export function renderLiquidMetal(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create flowing liquid effect
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    const radius = 80 + Math.sin(time * 2 + i * 0.1) * 30;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(4, 0.1));
    
    // Metallic gradient effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, 'rgba(192, 192, 192, 0.8)');
    gradient.addColorStop(0.5, 'rgba(128, 128, 128, 0.6)');
    gradient.addColorStop(1, 'rgba(64, 64, 64, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Energy field rendering
export function renderEnergyField(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  const fieldRadius = renderer.getAudioReactiveValue(120, 0.2);
  
  // Create energy field
  for (let ring = 0; ring < 5; ring++) {
    const ringRadius = fieldRadius + ring * 20;
    const pulse = Math.sin(time * 4 + ring * 0.5) * 0.5 + 0.5;
    
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + pulse * 0.4})`;
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.1));
    ctx.beginPath();
    ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Add lightning bolts
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time;
    const startX = center.x;
    const startY = center.y;
    const endX = center.x + Math.cos(angle) * fieldRadius;
    const endY = center.y + Math.sin(angle) * fieldRadius;
    
    ctx.strokeStyle = `rgba(255, 255, 0, ${0.6 + Math.sin(time * 8 + i) * 0.4})`;
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(2, 0.05));
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

// Crystal formation rendering
export function renderCrystalFormation(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 60 + Math.sin(time + i * 0.3) * 20;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(8, 0.1));
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + time);
    
    // Draw crystal
    ctx.fillStyle = renderer.getAudioReactiveColor(i * 30, i * 15);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.5, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}

// Plasma storm rendering
export function renderPlasmaStorm(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create plasma clouds
  for (let cloud = 0; cloud < 6; cloud++) {
    const cloudX = center.x + Math.sin(time * 0.5 + cloud) * 100;
    const cloudY = center.y + Math.cos(time * 0.7 + cloud) * 80;
    const cloudSize = renderer.getAudioReactiveValue(40, 0.2);
    
    // Plasma gradient
    const gradient = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cloudSize);
    gradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 0, 128, 0.6)');
    gradient.addColorStop(1, 'rgba(128, 0, 255, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Quantum waves rendering
export function renderQuantumWaves(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Draw interference patterns
  for (let wave = 0; wave < 4; wave++) {
    const waveOffset = wave * Math.PI / 2;
    const waveAmplitude = renderer.getAudioReactiveValue(60, 0.2);
    
    ctx.strokeStyle = renderer.getAudioReactiveColor(280 + wave * 20, wave * 30);
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(2, 0.05));
    ctx.beginPath();
    
    for (let x = 0; x < width; x += 2) {
      const progress = x / width;
      const interference = Math.sin(progress * Math.PI * 8 + time * 2 + waveOffset) * 
                          Math.sin(progress * Math.PI * 4 + time * 1.5) * waveAmplitude;
      const y = center.y + interference;
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
}

// Stellar nebula rendering
export function renderStellarNebula(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create nebula clouds
  for (let cloud = 0; cloud < 8; cloud++) {
    const cloudX = center.x + Math.sin(time * 0.3 + cloud * 0.5) * 120;
    const cloudY = center.y + Math.cos(time * 0.4 + cloud * 0.3) * 100;
    const cloudSize = renderer.getAudioReactiveValue(50, 0.3);
    
    // Nebula colors
    const colors = ['rgba(255, 0, 128, 0.4)', 'rgba(128, 0, 255, 0.4)', 'rgba(0, 128, 255, 0.4)'];
    const colorIndex = cloud % colors.length;
    
    ctx.fillStyle = colors[colorIndex];
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add stars
  for (let star = 0; star < 20; star++) {
    const starX = (star * 37.1) % width;
    const starY = (star * 73.3 + time * 10) % height;
    const starSize = renderer.safeSize(renderer.getAudioReactiveValue(2, 0.05));
    const twinkle = Math.sin(time * 3 + star * 0.2) * 0.5 + 0.5;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
    ctx.beginPath();
    ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Digital vortex rendering
export function renderDigitalVortex(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create vortex effect
  for (let i = 0; i < 200; i++) {
    const progress = i / 200;
    const angle = progress * Math.PI * 6 + time * 3;
    const radius = progress * 200 + Math.sin(time + i * 0.1) * 30;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.05));
    
    ctx.fillStyle = renderer.getAudioReactiveColor(i * 2, i * 10);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Holographic display rendering
export function renderHolographic(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create holographic grid
  const gridSize = 30;
  const pulse = Math.sin(time * 2) * 0.5 + 0.5;
  
  ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 + pulse * 0.3})`;
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Add holographic data points
  for (let i = 0; i < 15; i++) {
    const x = (i * 53.7) % width;
    const y = (i * 29.3 + time * 30) % height;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(4, 0.1));
    
    ctx.fillStyle = renderer.getAudioReactiveColor(180, i * 20);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Neural network rendering
export function renderNeuralNetwork(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  const nodeCount = 12;
  
  // Draw nodes
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const radius = 80 + Math.sin(time + i * 0.3) * 20;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(6, 0.1));
    
    nodes.push({ x, y, size });
    
    ctx.fillStyle = renderer.getAudioReactiveColor(i * 30, i * 15);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw connections
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const distance = Math.sqrt(
        Math.pow(nodes[i].x - nodes[j].x, 2) + 
        Math.pow(nodes[i].y - nodes[j].y, 2)
      );
      
      if (distance < 150) {
        const opacity = Math.max(0.1, 1 - (distance / 150));
        ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
        ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(1, 0.05));
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }
}

// Fractal universe rendering
export function renderFractalUniverse(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create fractal-like patterns
  for (let level = 0; level < 4; level++) {
    const levelRadius = 40 + level * 30;
    const levelCount = 6 + level * 2;
    
    for (let i = 0; i < levelCount; i++) {
      const angle = (i / levelCount) * Math.PI * 2 + time * (0.5 + level * 0.2);
      const radius = levelRadius + Math.sin(time * 2 + i * 0.1) * 15;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      const size = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.05));
      
      ctx.fillStyle = renderer.getAudioReactiveColor(level * 60 + i * 15, level * 20);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Solar flare rendering
export function renderSolarFlare(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create solar flare effect
  for (let flare = 0; flare < 8; flare++) {
    const angle = (flare / 8) * Math.PI * 2;
    const flareLength = renderer.getAudioReactiveValue(80, 0.3);
    const flareWidth = renderer.safeSize(renderer.getAudioReactiveValue(8, 0.1));
    
    const startX = center.x;
    const startY = center.y;
    const endX = center.x + Math.cos(angle) * flareLength;
    const endY = center.y + Math.sin(angle) * flareLength;
    
    // Flare gradient
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 128, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.4)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = flareWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

// Aurora borealis rendering
export function renderAuroraBorealis(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  
  // Create aurora curtains
  for (let curtain = 0; curtain < 5; curtain++) {
    const curtainX = (curtain / 4) * width;
    const curtainHeight = renderer.getAudioReactiveValue(100, 0.3);
    
    ctx.strokeStyle = renderer.getAudioReactiveColor(120 + curtain * 30, curtain * 20);
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(4, 0.1));
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    for (let y = 0; y < height; y += 4) {
      const progress = y / height;
      const wave = Math.sin(progress * Math.PI * 4 + time * 2 + curtain * 0.5) * 30;
      const x = curtainX + wave;
      
      if (y === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
}

// Magnetic field rendering
export function renderMagneticField(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create magnetic field lines
  for (let line = 0; line < 12; line++) {
    const angle = (line / 12) * Math.PI * 2;
    const lineLength = renderer.getAudioReactiveValue(100, 0.2);
    
    const startX = center.x;
    const startY = center.y;
    const endX = center.x + Math.cos(angle) * lineLength;
    const endY = center.y + Math.sin(angle) * lineLength;
    
    ctx.strokeStyle = renderer.getAudioReactiveColor(240, line * 20);
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(2, 0.05));
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// Temporal rift rendering
export function renderTemporalRift(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create time distortion effect
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    const radius = 80 + Math.sin(time * 3 + i * 0.1) * 40;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(2, 0.05));
    
    // Time-warped colors
    const hue = (i * 3.6 + time * 100) % 360;
    ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Gravity well rendering
export function renderGravityWell(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create gravitational distortion
  for (let ring = 0; ring < 8; ring++) {
    const ringRadius = (ring * 20 + time * 30) % 200;
    const distortion = Math.sin(time * 2 + ring * 0.3) * 15;
    const finalRadius = renderer.safeRadius(ringRadius + distortion);
    
    ctx.strokeStyle = `rgba(128, 0, 255, ${0.3 + Math.sin(time + ring) * 0.2})`;
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(2, 0.05));
    ctx.beginPath();
    ctx.arc(center.x, center.y, finalRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Quantum tunnel rendering
export function renderQuantumTunnel(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create tunnel effect
  for (let ring = 0; ring < 15; ring++) {
    const ringRadius = (ring * 15 + time * 40) % 300;
    const tunnelDepth = Math.sin(time + ring * 0.2) * 20;
    const finalRadius = renderer.safeRadius(ringRadius + tunnelDepth);
    
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 + Math.sin(time * 2 + ring) * 0.3})`;
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(2, 0.05));
    ctx.beginPath();
    ctx.arc(center.x, center.y, finalRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Dark matter rendering
export function renderDarkMatter(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create dark matter particles
  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2;
    const radius = 60 + Math.sin(time * 1.5 + i * 0.1) * 40;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.05));
    
    // Dark matter effect
    ctx.fillStyle = `rgba(64, 0, 128, ${0.6 + Math.sin(time + i * 0.1) * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add dark energy trails
    if (Math.random() > 0.7) {
      ctx.strokeStyle = `rgba(128, 0, 255, ${0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10);
      ctx.stroke();
    }
  }
}

// Light speed rendering
export function renderLightSpeed(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create light speed trails
  for (let trail = 0; trail < 6; trail++) {
    const angle = (trail / 6) * Math.PI * 2;
    const trailLength = renderer.getAudioReactiveValue(120, 0.3);
    
    const startX = center.x;
    const startY = center.y;
    const endX = center.x + Math.cos(angle) * trailLength;
    const endY = center.y + Math.sin(angle) * trailLength;
    
    // Light speed gradient
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 128, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.2)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.05));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

// Wormhole rendering
export function renderWormhole(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  const maxRadius = Math.min(width, height) / 2;
  
  // Create wormhole tunnel
  for (let ring = 0; ring < 25; ring++) {
    const radius = (ring * 8 + time * 40) % maxRadius;
    const opacity = Math.max(0, 1 - (radius / maxRadius));
    const distortion = Math.sin(time * 2 + ring * 0.1) * 10;
    
    // Ensure radius is always positive
    const finalRadius = renderer.safeRadius(radius + distortion);
    
    ctx.strokeStyle = `rgba(150, 0, 255, ${opacity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center.x, center.y, finalRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Add space-time distortion particles
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2 + time;
    const radius = 80 + Math.sin(time * 1.5 + i * 0.1) * 30;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const size = renderer.safeSize(2 + Math.sin(time * 2 + i * 0.05));
    
    ctx.fillStyle = `hsl(${(i * 9 + time * 30) % 360}, 80%, 70%)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Supernova rendering
export function renderSupernova(ctx, time, audioData, width, height) {
  const renderer = new EffectsRenderer(ctx, time, audioData);
  const center = renderer.getCenter(width, height);
  
  // Create explosion effect
  for (let particle = 0; particle < 100; particle++) {
    const angle = (particle / 100) * Math.PI * 2;
    const velocity = renderer.getAudioReactiveValue(3, 0.2);
    const explosionRadius = (time * 50 * velocity) % 300;
    const x = center.x + Math.cos(angle) * explosionRadius;
    const y = center.y + Math.sin(angle) * explosionRadius;
    const size = renderer.safeSize(renderer.getAudioReactiveValue(4, 0.1));
    
    // Supernova colors
    const colors = ['rgba(255, 255, 0, 0.8)', 'rgba(255, 128, 0, 0.6)', 'rgba(255, 0, 0, 0.4)'];
    const colorIndex = particle % colors.length;
    
    ctx.fillStyle = colors[colorIndex];
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add shockwave rings
  for (let ring = 0; ring < 3; ring++) {
    const ringRadius = (time * 100 + ring * 50) % 400;
    const ringOpacity = Math.max(0, 1 - (ringRadius / 400));
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringOpacity * 0.6})`;
    ctx.lineWidth = renderer.safeSize(renderer.getAudioReactiveValue(3, 0.1));
    ctx.beginPath();
    ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
