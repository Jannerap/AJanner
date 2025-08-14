/**
 * Main Module Loader - Visualizer System
 * Imports and initializes all visualization components
 */

import LocalVisualizer from './visualizer.js';
import * as Effects from './effects.js';

// Global visualizer instance
let localVisualizer = null;

// Initialize the visualizer system
export async function initializeVisualizer() {
  try {
    console.log('🎨 Starting visualizer initialization...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Create visualizer instance
    localVisualizer = new LocalVisualizer();
    console.log('✅ LocalVisualizer instance created');
    
    // Attach all effects to the visualizer
    attachEffects(localVisualizer);
    console.log('✅ Effects attached');
    
    // Initialize the visualizer
    await localVisualizer.init();
    console.log('✅ Visualizer initialized');
    
    // Make it globally available
    window.LocalVisualizer = localVisualizer;
    // Provide global presets and effects if available from presets module
    if (window.globalPresets) {
      localVisualizer.presets = window.globalPresets;
      // Ensure UI shows correct counts
      localVisualizer.updatePresetInfo();
    }
    console.log('✅ Visualizer made globally available');
    
    console.log('✅ Visualizer system initialized successfully');
    return localVisualizer;
    
  } catch (error) {
    console.error('❌ Failed to initialize visualizer:', error);
    
    // Create a fallback visualizer
    console.log('🔄 Creating fallback visualizer...');
    try {
      localVisualizer = {
        isRunning: false,
        presets: [
          { name: 'Fallback Mode', type: 'fallback', description: 'Basic fallback visualization' }
        ],
        currentPreset: 0,
        start: () => console.log('🎬 Fallback visualizer started'),
        stop: () => console.log('⏹️ Fallback visualizer stopped'),
        next: () => console.log('⏭️ Fallback next preset'),
        previous: () => console.log('⏮️ Fallback previous preset'),
        random: () => console.log('🎲 Fallback random preset'),
        select: () => console.log('🎯 Fallback select preset'),
        updatePresetInfo: () => console.log('📊 Fallback preset info updated'),
        toggleFullscreen: () => console.log('🎬 Fallback fullscreen')
      };
      
      window.LocalVisualizer = localVisualizer;
      console.log('✅ Fallback visualizer created');
      return localVisualizer;
      
    } catch (fallbackError) {
      console.error('❌ Failed to create fallback visualizer:', fallbackError);
      throw error;
    }
  }
}

// Attach all effects to the visualizer
function attachEffects(visualizer) {
  // Attach all render functions
  visualizer.renderWaveform = (width, height) => Effects.renderWaveform(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderParticles = (width, height) => Effects.renderParticles(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderRings = (width, height) => Effects.renderRings(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderSpectrum = (width, height) => Effects.renderSpectrum(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderShapes = (width, height) => Effects.renderShapes(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderSpiral = (width, height) => Effects.renderSpiral(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderMatrix = (width, height) => Effects.renderMatrix(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderFireworks = (width, height) => Effects.renderFireworks(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderNeonGrid = (width, height) => Effects.renderNeonGrid(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderCosmicDust = (width, height) => Effects.renderCosmicDust(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderLiquidMetal = (width, height) => Effects.renderLiquidMetal(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderEnergyField = (width, height) => Effects.renderEnergyField(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderCrystalFormation = (width, height) => Effects.renderCrystalFormation(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderPlasmaStorm = (width, height) => Effects.renderPlasmaStorm(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderQuantumWaves = (width, height) => Effects.renderQuantumWaves(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderStellarNebula = (width, height) => Effects.renderStellarNebula(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderDigitalVortex = (width, height) => Effects.renderDigitalVortex(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  // Note: Holographic is now a custom effect and will be attached by the attachCustomEffects function below
  // Note: NeuralNetwork, FractalUniverse, SolarFlare, and AuroraBorealis are now custom effects
  // and will be attached by the attachCustomEffects function below
  visualizer.renderMagneticField = (width, height) => Effects.renderMagneticField(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderTemporalRift = (width, height) => Effects.renderTemporalRift(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderGravityWell = (width, height) => Effects.renderGravityWell(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderQuantumTunnel = (width, height) => Effects.renderQuantumTunnel(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderDarkMatter = (width, height) => Effects.renderDarkMatter(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderLightSpeed = (width, height) => Effects.renderLightSpeed(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderWormhole = (width, height) => Effects.renderWormhole(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  visualizer.renderSupernova = (width, height) => Effects.renderSupernova(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);
  
  // Attach custom effects from presets
  const attachCustomEffects = () => {
    console.log('🔍 Checking for custom effects...', {
      customEffects: typeof window.customEffects,
      customEffectsValue: window.customEffects
    });
    
    if (typeof window.customEffects !== 'undefined' && window.customEffects) {
      console.log('📦 Found custom effects:', Object.keys(window.customEffects));
      Object.entries(window.customEffects).forEach(([type, renderFunc]) => {
        const methodName = `render${type.charAt(0).toUpperCase() + type.slice(1)}`;
        visualizer[methodName] = (width, height) => {
          console.log(`🎨 Rendering custom effect: ${methodName}`, {
            canvas: visualizer.canvas,
            ctx: visualizer.ctx,
            audioData: visualizer.audioData,
            time: visualizer.time * 0.001
          });
          return renderFunc(visualizer.canvas, visualizer.ctx, visualizer.audioData, visualizer.time * 0.001);
        };
        console.log(`✅ Custom effect attached: ${methodName}`);
      });
    } else {
      console.log('⏳ Custom effects not yet available, retrying in 100ms...');
      // Wait for customEffects to be available
      setTimeout(attachCustomEffects, 100);
    }
  };
  
  // Start attaching custom effects with a delay to ensure presets are loaded
  setTimeout(attachCustomEffects, 200);
  
  console.log('✅ All effects attached to visualizer');
}

// Get the visualizer instance
export function getVisualizer() {
  return localVisualizer;
}

// Start the visualizer
export function startVisualizer() {
  if (localVisualizer) {
    localVisualizer.start();
  }
}

// Stop the visualizer
export function stopVisualizer() {
  if (localVisualizer) {
    localVisualizer.stop();
  }
}

// Next preset
export function nextPreset() {
  if (localVisualizer) {
    localVisualizer.next();
  }
}

// Previous preset
export function previousPreset() {
  if (localVisualizer) {
    localVisualizer.previous();
  }
}

// Random preset
export function randomPreset() {
  if (localVisualizer) {
    localVisualizer.random();
  }
}

// Select specific preset
export function selectPreset(index) {
  if (localVisualizer) {
    localVisualizer.select(index);
  }
}

// Toggle fullscreen
export function toggleFullscreen() {
  if (localVisualizer) {
    localVisualizer.toggleFullscreen();
  }
}

// Export for global use - these will be available after module loads
setTimeout(() => {
  window.initializeVisualizer = initializeVisualizer;
  window.getVisualizer = getVisualizer;
  window.startVisualizer = startVisualizer;
  window.stopVisualizer = stopVisualizer;
  window.nextPreset = nextPreset;
  window.previousPreset = previousPreset;
  window.randomPreset = randomPreset;
  window.selectPreset = selectPreset;
  window.toggleVisualizationFullscreen = toggleFullscreen;
  console.log('✅ Global functions exported to window object');
}, 100);
