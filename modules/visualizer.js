/**
 * Local Visualizer - Core visualization system
 * Handles canvas creation, audio reactivity, and preset management
 */

class LocalVisualizer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.animationId = null;
    this.time = 0;
    this.audioData = { bass: 0, mid: 0, treble: 0, volume: 0 };
    this.presets = [];
    this.currentPreset = 0;
    this.audioContext = null;
    this.analyser = null;
    this.audioSource = null;
  }

  // Initialize the visualizer
  async init() {
    this.createCanvas();
    await this.loadLocalPresets();
    this.setupAudioReactivity();
    // Update UI with initial preset info
    this.updatePresetInfo();
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

    // Prefer using existing canvas in container (e.g., #butterchurnCanvas) to preserve sizing
    const existingCanvas = container.querySelector('#butterchurnCanvas') || container.querySelector('canvas');
    if (existingCanvas) {
      this.canvas = existingCanvas;
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx) {
        console.log('✅ Using existing visualization canvas');
        return;
      }
      console.warn('⚠️ Existing canvas context unavailable, creating a new canvas');
    }

    // Create canvas only if none exists or context could not be obtained
    this.canvas = document.createElement('canvas');
    // Set explicit size to ensure visibility even if parent has no height
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

    // Append without clearing to avoid removing other UI
    container.appendChild(this.canvas);

    console.log('✅ Canvas created and setup complete');
  }

  // Load local preset definitions
  async loadLocalPresets() {
    try {
      console.log('🔍 Attempting to load custom presets...');
      
      // First try to get presets from global object
      if (typeof window !== 'undefined' && window.globalPresets && Array.isArray(window.globalPresets)) {
        this.presets = window.globalPresets;
        console.log(`✅ Loaded ${this.presets.length} presets from global object (including ${this.presets.filter(p => p.custom).length} custom)`);
        console.log('📋 Preset names:', this.presets.map(p => p.name));
        
        // Ensure custom effects are available
        if (window.customEffects) {
          console.log('🎨 Custom effects available:', Object.keys(window.customEffects));
        }
        return;
      }
      
      // Fallback: Try to import and load custom presets
      console.log('📦 Global presets not found, trying dynamic import...');
      const customPresets = await import('../presets/index.js');
      console.log('📦 Import result:', Object.keys(customPresets || {}));
      
      if (customPresets && Array.isArray(customPresets.presets)) {
        this.presets = customPresets.presets;
        // Expose custom effects globally so attachEffects can wire them
        if (customPresets.customEffects) {
          window.customEffects = customPresets.customEffects;
          console.log('🎨 Custom effects loaded:', Object.keys(customPresets.customEffects));
        }
        console.log(`✅ Loaded ${this.presets.length} presets from import (including ${customPresets.presets.filter(p => p.custom).length} custom)`);
        console.log('📋 Preset names:', this.presets.map(p => p.name));
      } else {
        console.warn('⚠️ No presets found in customPresets, using built-in');
        // Fallback to built-in presets
        this.loadBuiltInPresets();
      }
    } catch (error) {
      console.warn('⚠️ Failed to load custom presets, using built-in:', error);
      this.loadBuiltInPresets();
    }
  }

  // Load built-in presets as fallback
  loadBuiltInPresets() {
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
  }

  // Setup audio reactivity
  setupAudioReactivity() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Try to connect to existing global audio
      if (window.currentAudio) {
        this.connectToAudio(window.currentAudio);
      }
      
      // Listen for audio connection events
      document.addEventListener('audioConnected', (event) => {
        this.connectToAudio(event.detail.audioElement);
      });
      
      console.log('✅ Audio reactivity setup complete');
    } catch (error) {
      console.warn('⚠️ Audio reactivity setup failed:', error);
    }
  }

  // Connect to audio element
  connectToAudio(audioElement) {
    if (!this.audioContext || !this.analyser || !audioElement) return;
    
    try {
      this.audioSource = this.audioContext.createMediaElementSource(audioElement);
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      // Also make audio data available globally for other systems
      this.updateAudioData();
      window.globalAudioData = this.audioData;
      
      console.log('✅ Audio connected to visualizer and made globally available');
    } catch (error) {
      console.warn('⚠️ Audio connection failed:', error);
    }
  }

  // Update audio data
  updateAudioData() {
    if (!this.analyser) return;
    
    try {
      const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      const timeData = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.analyser.getByteFrequencyData(frequencyData);
      this.analyser.getByteTimeDomainData(timeData);
      
      // Calculate audio metrics
      const bass = this.calculateBass(frequencyData);
      const mid = this.calculateMid(frequencyData);
      const treble = this.calculateTreble(frequencyData);
      const volume = this.calculateVolume(timeData);
      
      // Calculate overall intensity (average of all frequencies)
      const overall = (bass + mid + treble) / 3;
      
      this.audioData = { bass, mid, treble, volume, overall };
      
      // Make audio data globally available
      window.globalAudioData = this.audioData;
      
    } catch (error) {
      // Silent fail for audio updates
    }
  }

  // Calculate bass frequencies (0-60Hz)
  calculateBass(frequencyData) {
    const bassRange = Math.floor(frequencyData.length * 0.1);
    let sum = 0;
    for (let i = 0; i < bassRange; i++) {
      sum += frequencyData[i];
    }
    return (sum / bassRange) / 255; // Normalize to 0-1
  }

  // Calculate mid frequencies (60-250Hz)
  calculateMid(frequencyData) {
    const start = Math.floor(frequencyData.length * 0.1);
    const end = Math.floor(frequencyData.length * 0.4);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += frequencyData[i];
    }
    return (sum / (end - start)) / 255; // Normalize to 0-1
  }

  // Calculate treble frequencies (250Hz+)
  calculateTreble(frequencyData) {
    const start = Math.floor(frequencyData.length * 0.4);
    let sum = 0;
    for (let i = start; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }
    return (sum / (frequencyData.length - start)) / 255; // Normalize to 0-1
  }

  // Calculate overall volume
  calculateVolume(timeData) {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += Math.abs(timeData[i] - 128);
    }
    return (sum / timeData.length) / 128; // Normalize to 0-1
  }

  // Safety functions for radius and size
  safeRadius(radius) {
    return Math.max(1, radius);
  }

  safeSize(size) {
    return Math.max(1, size);
  }

  // Fallback render function
  renderFallback(width, height) {
    if (!this.ctx) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const time = this.time * 0.001;
    
    // Draw pulsing circle
    const pulse = Math.sin(time * 3) * 0.5 + 0.5;
    const radius = 50 + pulse * 30;
    
    this.ctx.fillStyle = `hsl(${time * 50 % 360}, 70%, 60%)`;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add glow effect
    this.ctx.shadowColor = this.ctx.fillStyle;
    this.ctx.shadowBlur = 20;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  // Main render loop
  render() {
    if (!this.ctx || !this.canvas) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    try {
      // Update audio data
      this.updateAudioData();
      
      // Clear with a very light fade for smooth motion trails
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      this.ctx.fillRect(0, 0, width, height);
      
      // Get current preset
      const preset = this.presets[this.currentPreset];
      if (!preset) {
        console.warn('⚠️ No preset found at index:', this.currentPreset);
        this.renderFallback(width, height);
        return;
      }
      
      // Call the appropriate render function
      const renderMethod = `render${preset.type.charAt(0).toUpperCase() + preset.type.slice(1)}`;
      console.log(`🎨 Rendering preset: ${preset.name} (type: ${preset.type}, method: ${renderMethod})`);
      
      if (typeof this[renderMethod] === 'function') {
        this[renderMethod](width, height);
      } else {
        console.warn(`⚠️ Render method ${renderMethod} not found for preset: ${preset.name}`);
        console.log('🔍 Available render methods:', Object.getOwnPropertyNames(this).filter(name => name.startsWith('render')));
        this.renderFallback(width, height);
      }
      
    } catch (error) {
      console.error('❌ Render error:', error);
      this.renderFallback(width, height);
    }
  }

  // Update preset information
  updatePresetInfo() {
    const preset = this.presets[this.currentPreset];
    // Update known UI elements in the ProjectM panel
    const currentPresetEl = document.getElementById('currentPreset');
    const totalPresetsEl = document.getElementById('totalPresets');
    const presetStatusEl = document.getElementById('presetStatus');

    if (currentPresetEl && preset) currentPresetEl.textContent = preset.name;
    if (totalPresetsEl) totalPresetsEl.textContent = String(this.presets.length || 0);
    if (presetStatusEl) presetStatusEl.textContent = 'Ready';

    // Backward compatibility with any alternate UI labels if present
    const presetName = document.getElementById('presetName');
    const presetDescription = document.getElementById('presetDescription');
    if (presetName && preset) presetName.textContent = preset.name;
    if (presetDescription && preset) presetDescription.textContent = preset.description;
  }

  // Start the visualizer
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.time = 0;
    
    const animate = () => {
      if (!this.isRunning) return;
      
      this.time += 16; // Assume 60fps
      this.render();
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
    console.log('🎬 Visualizer started');
  }

  // Stop the visualizer
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    console.log('⏹️ Visualizer stopped');
  }

  // Next preset
  next() {
    this.currentPreset = (this.currentPreset + 1) % this.presets.length;
    this.updatePresetInfo();
    console.log(`⏭️ Next preset: ${this.presets[this.currentPreset].name}`);
  }

  // Previous preset
  previous() {
    this.currentPreset = (this.currentPreset - 1 + this.presets.length) % this.presets.length;
    this.updatePresetInfo();
    console.log(`⏮️ Previous preset: ${this.presets[this.currentPreset].name}`);
  }

  // Random preset
  random() {
    const newIndex = Math.floor(Math.random() * this.presets.length);
    if (newIndex !== this.currentPreset) {
      this.currentPreset = newIndex;
      this.updatePresetInfo();
      console.log(`🎲 Random preset: ${this.presets[this.currentPreset].name}`);
    }
  }

  // Select specific preset
  select(index) {
    if (index >= 0 && index < this.presets.length) {
      this.currentPreset = index;
      this.updatePresetInfo();
      console.log(`🎯 Selected preset: ${this.presets[this.currentPreset].name}`);
    }
  }

  // Toggle fullscreen
  toggleFullscreen() {
    if (!this.canvas) return;
    
    try {
      if (!document.fullscreenElement) {
        this.canvas.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    } catch (error) {
      console.warn('⚠️ Fullscreen not supported:', error);
    }
  }
}

export default LocalVisualizer;
