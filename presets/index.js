/**
 * Preset Configuration - All Available Visualization Presets
 * This file defines all presets and can be easily modified to add new ones
 */

// Import custom presets
import { renderRainbowSpiral } from './effects/rainbow-spiral-GL.js';
import { renderNeonPulse } from './effects/neon-pulse.js';
import { renderMyCoolEffect } from './effects/my-cool-effect.js';
import { renderQuantumPlasmaStorm } from './effects/quantum-plasma-storm.js';
import { renderSpirographOrbital } from './effects/spirograph-orbital.js';
import { renderMilkLike } from './effects/milklike-elephant.js';
import { renderImageCollage } from './effects/image-collage-visual.js';
import { renderMatrixRain } from './effects/matrix-rain-visual.js';
import { renderAuroraBorealis } from './effects/aurora-borealis.js';
import { renderNeuralNetwork } from './effects/neural-network.js';
import { renderFractalUniverse } from './effects/fractal-universe.js';
import { renderHolographicDisplay } from './effects/holographic-display.js';
import { renderSolarFlare } from './effects/solar-flare.js';

// Preset definitions
export const presets = [
  // Built-in presets
  {
    name: 'Wave Symphony',
    type: 'waveform',
    description: 'Complex wave patterns with color evolution',
    category: 'Audio'
  },
  {
    name: 'Particle Galaxy',
    type: 'particles',
    description: 'Dynamic particle system with physics',
    category: 'Particles'
  },
  {
    name: 'Circular Ripples',
    type: 'rings',
    description: 'Expanding circular rings with ripple effects',
    category: 'Geometric'
  },
  {
    name: 'Spectrum Bars',
    type: 'spectrum',
    description: 'Audio spectrum-like bars with motion',
    category: 'Audio'
  },
  {
    name: 'Geometric Dance',
    type: 'shapes',
    description: 'Rotating geometric shapes with colors',
    category: 'Geometric'
  },
  {
    name: 'Spiral Galaxy',
    type: 'spiral',
    description: 'Spiral patterns with cosmic effects',
    category: 'Cosmic'
  },
  {
    name: 'Matrix Rain',
    type: 'matrix',
    description: 'Digital rain effect with glowing trails',
    category: 'Digital'
  },
  {
    name: 'Fireworks',
    type: 'fireworks',
    description: 'Explosive particle effects',
    category: 'Particles'
  },
  {
    name: 'Neon Grid',
    type: 'neonGrid',
    description: 'Glowing neon grid with pulsing effects',
    category: 'Neon'
  },
  {
    name: 'Cosmic Dust',
    type: 'cosmicDust',
    description: 'Floating cosmic particles with trails',
    category: 'Cosmic'
  },
  {
    name: 'Liquid Metal',
    type: 'liquidMetal',
    description: 'Flowing metallic liquid effects',
    category: 'Metallic'
  },
  {
    name: 'Energy Field',
    type: 'energyField',
    description: 'Pulsing energy field with lightning',
    category: 'Energy'
  },
  {
    name: 'Crystal Formation',
    type: 'crystalFormation',
    description: 'Growing crystal structures',
    category: 'Crystal'
  },
  {
    name: 'Plasma Storm',
    type: 'plasmaStorm',
    description: 'Intense plasma storm effects',
    category: 'Plasma'
  },
  {
    name: 'Quantum Waves',
    type: 'quantumWaves',
    description: 'Quantum wave interference patterns',
    category: 'Quantum'
  },
  {
    name: 'Stellar Nebula',
    type: 'stellarNebula',
    description: 'Cosmic nebula with star formation',
    category: 'Cosmic'
  },
  {
    name: 'Digital Vortex',
    type: 'digitalVortex',
    description: 'Digital vortex with data streams',
    category: 'Digital'
  },
  {
    name: 'Holographic Display',
    type: 'holographic',
    description: '3D holographic projection effects',
    category: 'Holographic'
  },
  {
    name: 'Neural Network',
    type: 'neuralNetwork',
    description: 'Animated neural network connections',
    category: 'Neural'
  },
  {
    name: 'Fractal Universe',
    type: 'fractalUniverse',
    description: 'Infinite fractal patterns',
    category: 'Fractal'
  },
  {
    name: 'Solar Flare',
    type: 'solarFlare',
    description: 'Intense solar flare effects',
    category: 'Solar'
  },
  {
    name: 'Aurora Borealis',
    type: 'auroraBorealis',
    description: 'Northern lights simulation',
    category: 'Aurora'
  },
  {
    name: 'Magnetic Field',
    type: 'magneticField',
    description: 'Magnetic field line visualization',
    category: 'Magnetic'
  },
  {
    name: 'Temporal Rift',
    type: 'temporalRift',
    description: 'Time distortion effects',
    category: 'Temporal'
  },
  {
    name: 'Gravity Well',
    type: 'gravityWell',
    description: 'Gravitational distortion effects',
    category: 'Gravitational'
  },
  {
    name: 'Quantum Tunnel',
    type: 'quantumTunnel',
    description: 'Quantum tunneling visualization',
    category: 'Quantum'
  },
  {
    name: 'Dark Matter',
    type: 'darkMatter',
    description: 'Dark matter particle effects',
    category: 'Cosmic'
  },
  {
    name: 'Light Speed',
    type: 'lightSpeed',
    description: 'Relativistic light effects',
    category: 'Relativistic'
  },
  {
    name: 'Wormhole',
    type: 'wormhole',
    description: 'Space-time wormhole effects',
    category: 'Cosmic'
  },
  {
    name: 'Supernova',
    type: 'supernova',
    description: 'Explosive supernova simulation',
    category: 'Cosmic'
  },
  
  // Custom presets
  {
    name: 'Rainbow Spiral GL',
    type: 'rainbowSpiral',
    description: 'High-performance WebGL2 kaleidoscopic spiral with audio reactivity',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Neon Pulse',
    type: 'neonPulse',
    description: 'Pulsing neon effects with audio reactivity',
    category: 'Custom',
    custom: true
  },
  {
    name: 'My Cool Effect',
    type: 'myCoolEffect',
    description: 'Custom audio-reactive circles with connecting lines',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Quantum Plasma Storm',
    type: 'quantumPlasmaStorm',
    description: 'Advanced WebGL2 plasma storm with particle systems and fluid dynamics',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Spirograph Orbital',
    type: 'spirographOrbital',
    description: 'Central core with 7 orbiting balls creating complex spirograph patterns',
    category: 'Custom',
    custom: true
  },
  {
    name: 'MilkLike Elephant',
    type: 'milkLike',
    description: 'Advanced MilkDrop-style domain-warped noise flow with kaleidoscope patterns',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Image Collage Visual',
    type: 'imageCollage',
    description: 'Professional VJ-style image collage with audio-reactive effects and transitions',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Matrix Digital Rain',
    type: 'matrixRain',
    description: 'Classic Matrix-style digital rain with audio-reactive speed, density, and glow effects',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Aurora Borealis',
    type: 'auroraBorealis',
    description: 'Beautiful flowing aurora ribbons with audio-reactive colors and movement',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Neural Network',
    type: 'neuralNetwork',
    description: 'Dynamic neural network with animated connections and data flow',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Fractal Universe',
    type: 'fractalUniverse',
    description: 'Infinite fractal patterns with audio-reactive zoom and cosmic particles',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Holographic Display',
    type: 'holographicDisplay',
    description: 'Futuristic 3D holographic projections with scan lines and glitch effects',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Solar Flare',
    type: 'solarFlare',
    description: 'Intense solar flare with explosive energy and plasma streams',
    category: 'Custom',
    custom: true
  }
];

// Export custom render functions
export const customEffects = {
  rainbowSpiral: renderRainbowSpiral,
  neonPulse: renderNeonPulse,
  myCoolEffect: renderMyCoolEffect,
  quantumPlasmaStorm: renderQuantumPlasmaStorm,
  spirographOrbital: renderSpirographOrbital,
  milkLike: renderMilkLike,
  imageCollage: renderImageCollage,
  matrixRain: renderMatrixRain,
  auroraBorealis: renderAuroraBorealis,
  neuralNetwork: renderNeuralNetwork,
  fractalUniverse: renderFractalUniverse,
  holographicDisplay: renderHolographicDisplay,
  solarFlare: renderSolarFlare
};

// Make customEffects available globally
if (typeof window !== 'undefined') {
  window.customEffects = customEffects;
  
  // Make presets available globally
  window.globalPresets = presets;
  
  // Make effect count functions available globally
  window.effectCounts = {
    total: getTotalEffectsCount(),
    custom: getCustomEffectsCount(),
    builtIn: getBuiltInEffectsCount()
  };
  
  // Make individual count functions available
  window.getTotalEffectsCount = getTotalEffectsCount;
  window.getCustomEffectsCount = getCustomEffectsCount;
  window.getBuiltInEffectsCount = getBuiltInEffectsCount;
  
  console.log('🌍 Global presets loaded:', {
    total: presets.length,
    custom: presets.filter(p => p.custom).length,
    builtIn: presets.filter(p => !p.custom).length,
    names: presets.map(p => p.name)
  });
}

// Get presets by category
export function getPresetsByCategory(category) {
  return presets.filter(preset => preset.category === category);
}

// Get all categories
export function getCategories() {
  return [...new Set(presets.map(preset => preset.category))];
}

// Get custom presets
export function getCustomPresets() {
  return presets.filter(preset => preset.custom);
}

// Get built-in presets
export function getBuiltInPresets() {
  return presets.filter(preset => !preset.custom);
}

// Get total count of all effects
export function getTotalEffectsCount() {
  return presets.length;
}

// Get total count of custom effects
export function getCustomEffectsCount() {
  return presets.filter(preset => preset.custom).length;
}

// Get total count of built-in effects
export function getBuiltInEffectsCount() {
  return presets.filter(preset => !preset.custom).length;
}
