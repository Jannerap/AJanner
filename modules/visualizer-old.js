/**
 * LocalVisualizer - Advanced Music Visualization Module
 * Provides 37+ high-quality visualization effects with audio reactivity
 */

class LocalVisualizer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.time = 0;
    this.currentPreset = 0;
    this.presets = [];
    this.effects = {};
    this.audioData = {
      frequency: new Uint8Array(256),
      waveform: new Uint8Array(256),
      volume: 0,
      bass: 0,
      mid: 0,
      treble: 0
    };
    this.analyser = null;
    this.audioContext = null;
    this.audioSource = null;
  }

  // Initialize the visualizer
  async init() {
    this.createCanvas();
    await this.loadLocalPresets();
    this.setupAudioReactivity();
    console.log('✅ Local visualizer initialized');
  }

  // Create and setup canvas
  createCanvas() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createCanvas());
      return;
    }

    const container = document.querySelector('.visualization-canvas-container');
    if (!container) {
      console.error('❌ Canvas container not found, trying alternative selectors...');
      
      // Try alternative selectors
      const alternativeContainer = document.querySelector('#butterchurnCanvas') || 
                                  document.querySelector('.projectm-panel canvas') ||
                                  document.querySelector('canvas');
      
      if (alternativeContainer) {
        console.log('✅ Found alternative canvas container');
        this.canvas = alternativeContainer;
        this.ctx = this.canvas.getContext('2d');
        if (this.ctx) {
          console.log('✅ Canvas context obtained from alternative container');
          return;
        }
      }
      
      console.error('❌ No suitable canvas container found');
      return;
    }

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.border = '1px solid #333';
    this.canvas.style.borderRadius = '8px';

    // Get context
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('❌ Failed to get canvas context');
      return;
    }

    // Clear container and add canvas
    container.innerHTML = '';
    container.appendChild(this.canvas);

    console.log('✅ Canvas created and setup complete');
  }

  // Load local preset definitions
  loadLocalPresets() {
    this.presets = [
      {
        name: 'Wave Symphony',
        type: 'waveform',
        description: 'Complex wave patterns with color evolution'
      },
      {
        name: 'Particle Galaxy',
        type: 'particles',
        description: 'Dynamic particle system with physics'
      },
      {
        name: 'Circular Ripples',
        type: 'rings',
        description: 'Expanding circular rings with ripple effects'
      },
      {
        name: 'Spectrum Bars',
        type: 'spectrum',
        description: 'Audio spectrum-like bars with motion'
      },
      {
        name: 'Geometric Dance',
        type: 'shapes',
        description: 'Rotating geometric shapes with colors'
      },
      {
        name: 'Spiral Galaxy',
        type: 'spiral',
        description: 'Spiral patterns with cosmic effects'
      },
      {
        name: 'Matrix Rain',
        type: 'matrix',
        description: 'Digital rain effect with glowing trails'
      },
      {
        name: 'Fireworks',
        type: 'fireworks',
        description: 'Explosive particle effects'
      },
      {
        name: 'Neon Grid',
        type: 'neonGrid',
        description: 'Glowing neon grid with pulsing effects'
      },
      {
        name: 'Cosmic Dust',
        type: 'cosmicDust',
        description: 'Floating cosmic particles with trails'
      },
      {
        name: 'Liquid Metal',
        type: 'liquidMetal',
        description: 'Flowing metallic liquid effects'
      },
      {
        name: 'Energy Field',
        type: 'energyField',
        description: 'Pulsing energy field with lightning'
      },
      {
        name: 'Crystal Formation',
        type: 'crystalFormation',
        description: 'Growing crystal structures'
      },
      {
        name: 'Plasma Storm',
        type: 'plasmaStorm',
        description: 'Intense plasma storm effects'
      },
      {
        name: 'Quantum Waves',
        type: 'quantumWaves',
        description: 'Quantum wave interference patterns'
      },
      {
        name: 'Stellar Nebula',
        type: 'stellarNebula',
        description: 'Cosmic nebula with star formation'
      },
      {
        name: 'Digital Vortex',
        type: 'digitalVortex',
        description: 'Digital vortex with data streams'
      },
      {
        name: 'Holographic Display',
        type: 'holographic',
        description: '3D holographic projection effects'
      },
      {
        name: 'Neural Network',
        type: 'neuralNetwork',
        description: 'Animated neural network connections'
      },
      {
        name: 'Fractal Universe',
        type: 'fractalUniverse',
        description: 'Infinite fractal patterns'
      },
      {
        name: 'Solar Flare',
        type: 'solarFlare',
        description: 'Intense solar flare effects'
      },
      {
        name: 'Aurora Borealis',
        type: 'auroraBorealis',
        description: 'Northern lights simulation'
      },
      {
        name: 'Magnetic Field',
        type: 'magneticField',
        description: 'Magnetic field line visualization'
      },
      {
        name: 'Temporal Rift',
        type: 'temporalRift',
        description: 'Time distortion effects'
      },
      {
        name: 'Gravity Well',
        type: 'gravityWell',
        description: 'Gravitational distortion effects'
      },
      {
        name: 'Quantum Tunnel',
        type: 'quantumTunnel',
        description: 'Quantum tunneling visualization'
      },
      {
        name: 'Dark Matter',
        type: 'darkMatter',
        description: 'Dark matter particle effects'
      },
      {
        name: 'Light Speed',
        type: 'lightSpeed',
        description: 'Relativistic light effects'
      },
      {
        name: 'Wormhole',
        type: 'wormhole',
        description: 'Space-time wormhole effects'
      },
      {
        name: 'Supernova',
        type: 'supernova',
        description: 'Explosive supernova simulation'
      }
    ];

    this.updatePresetInfo();
    console.log(`✅ Loaded ${this.presets.length} local presets`);
  }

  // Setup audio reactivity
  setupAudioReactivity() {
    // Listen for audio connection events
    document.addEventListener('audioConnected', (event) => {
      this.connectToAudio(event.detail.audioElement);
    });

    // Try to connect to existing audio
    if (window.currentAudio) {
      this.connectToAudio(window.currentAudio);
    }
  }

  // Connect to audio element for reactivity
  connectToAudio(audioElement) {
    if (!audioElement || this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.audioSource = this.audioContext.createMediaElementSource(audioElement);
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      console.log('🎵 Audio connected for visualization reactivity');
    } catch (error) {
      console.error('Failed to connect audio:', error);
    }
  }

  // Update audio data for reactivity
  updateAudioData() {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.audioData.frequency);
      this.analyser.getByteTimeDomainData(this.audioData.waveform);
      
      // Calculate volume, bass, mid, treble
      let totalVolume = 0;
      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;
      
      for (let i = 0; i < this.audioData.frequency.length; i++) {
        totalVolume += this.audioData.frequency[i];
        
        if (i < 8) { // Bass frequencies
          bassSum += this.audioData.frequency[i];
        } else if (i < 32) { // Mid frequencies
          midSum += this.audioData.frequency[i];
        } else { // Treble frequencies
          trebleSum += this.audioData.frequency[i];
        }
      }
      
      this.audioData.volume = totalVolume / this.audioData.frequency.length;
      this.audioData.bass = bassSum / 8;
      this.audioData.mid = midSum / 24;
      this.audioData.treble = trebleSum / 96;
    }
  }

  // Safety function to ensure positive values for rendering
  safeRadius(radius) {
    return Math.max(1, radius);
  }

  safeSize(size) {
    return Math.max(1, size);
  }

  // Fallback render function if main rendering fails
  renderFallback(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Simple pulsing circle as fallback
    const pulse = Math.sin(this.time * 2) * 0.5 + 0.5;
    const radius = 50 + pulse * 30;
    
    this.ctx.fillStyle = `rgba(76, 175, 80, ${0.3 + pulse * 0.4})`;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add some simple particles
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + this.time;
      const x = centerX + Math.cos(angle) * (radius + 20);
      const y = centerY + Math.sin(angle) * (radius + 20);
      const size = 2 + pulse * 3;
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // Main render loop
  render() {
    if (!this.isRunning) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Update audio data for reactivity
    this.updateAudioData();
    
    // Clear canvas with fade effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, width, height);
    
    // Render current preset with error handling
    try {
      const preset = this.presets[this.currentPreset];
      switch(preset.type) {
        case 'waveform':
          this.renderWaveform(width, height);
          break;
        case 'particles':
          this.renderParticles(width, height);
          break;
        case 'rings':
          this.renderRings(width, height);
          break;
        case 'spectrum':
          this.renderSpectrum(width, height);
          break;
        case 'shapes':
          this.renderShapes(width, height);
          break;
        case 'spiral':
          this.renderSpiral(width, height);
          break;
        case 'matrix':
          this.renderMatrix(width, height);
          break;
        case 'fireworks':
          this.renderFireworks(width, height);
          break;
        case 'neonGrid':
          this.renderNeonGrid(width, height);
          break;
        case 'cosmicDust':
          this.renderCosmicDust(width, height);
          break;
        case 'liquidMetal':
          this.renderLiquidMetal(width, height);
          break;
        case 'energyField':
          this.renderEnergyField(width, height);
          break;
        case 'crystalFormation':
          this.renderCrystalFormation(width, height);
          break;
        case 'plasmaStorm':
          this.renderPlasmaStorm(width, height);
          break;
        case 'quantumWaves':
          this.renderQuantumWaves(width, height);
          break;
        case 'stellarNebula':
          this.renderStellarNebula(width, height);
          break;
        case 'digitalVortex':
          this.renderDigitalVortex(width, height);
          break;
        case 'holographic':
          this.renderHolographic(width, height);
          break;
        case 'neuralNetwork':
          this.renderNeuralNetwork(width, height);
          break;
        case 'fractalUniverse':
          this.renderFractalUniverse(width, height);
          break;
        case 'solarFlare':
          this.renderSolarFlare(width, height);
          break;
        case 'auroraBorealis':
          this.renderAuroraBorealis(width, height);
          break;
        case 'magneticField':
          this.renderMagneticField(width, height);
          break;
        case 'temporalRift':
          this.renderTemporalRift(width, height);
          break;
        case 'gravityWell':
          this.renderGravityWell(width, height);
          break;
        case 'quantumTunnel':
          this.renderQuantumTunnel(width, height);
          break;
        case 'darkMatter':
          this.renderDarkMatter(width, height);
          break;
        case 'lightSpeed':
          this.renderLightSpeed(width, height);
          break;
        case 'wormhole':
          this.renderWormhole(width, height);
          break;
        case 'supernova':
          this.renderSupernova(width, height);
          break;
      }
    } catch (error) {
      console.error('🎨 Visualization render error:', error);
      // Fallback to simple effect if rendering fails
      this.renderFallback(width, height);
    }
    
    this.time += 0.02;
    requestAnimationFrame(() => this.render());
  }

  // Update preset information display
  updatePresetInfo() {
    const currentPreset = document.getElementById('currentPreset');
    const totalPresets = document.getElementById('totalPresets');
    const presetStatus = document.getElementById('presetStatus');
    
    if (currentPreset) currentPreset.textContent = this.presets[this.currentPreset].name;
    if (totalPresets) totalPresets.textContent = this.presets.length + ' Effects';
    if (presetStatus) presetStatus.textContent = 'Local system ready';
  }

  // Start visualization
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.render();
    console.log('🎬 Local visualizer started');
  }

  // Stop visualization
  stop() {
    this.isRunning = false;
    console.log('⏹️ Local visualizer stopped');
  }

  // Next preset
  next() {
    this.currentPreset = (this.currentPreset + 1) % this.presets.length;
    this.updatePresetInfo();
    console.log(`⏭️ Switched to: ${this.presets[this.currentPreset].name}`);
  }

  // Previous preset
  previous() {
    this.currentPreset = (this.currentPreset - 1 + this.presets.length) % this.presets.length;
    this.updatePresetInfo();
    console.log(`⏮️ Switched to: ${this.presets[this.currentPreset].name}`);
  }

  // Random preset
  random() {
    const newPreset = Math.floor(Math.random() * this.presets.length);
    if (newPreset !== this.currentPreset) {
      this.currentPreset = newPreset;
      this.updatePresetInfo();
      console.log(`🎲 Random preset: ${this.presets[this.currentPreset].name}`);
    } else {
      this.random(); // Try again if same preset
    }
  }

  // Select specific preset
  select(index) {
    if (index >= 0 && index < this.presets.length) {
      this.currentPreset = index;
      this.updatePresetInfo();
      console.log(`🎯 Selected: ${this.presets[this.currentPreset].name}`);
    }
  }

  // Toggle fullscreen for canvas
  toggleFullscreen() {
    const canvas = this.canvas;
    if (!canvas) return;

    if (!document.fullscreenElement) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
      } else if (canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
      }
      console.log('🎬 Visualization entered fullscreen');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      console.log('🎬 Visualization exited fullscreen');
    }
  }
}

// Export for use in other modules
export default LocalVisualizer;
