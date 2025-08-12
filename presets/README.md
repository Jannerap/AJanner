# 🎨 Custom Visualization Presets

This folder contains all visualization presets and allows you to easily add your own custom effects!

## 📁 Folder Structure

```
presets/
├── README.md              # This documentation file
├── index.js               # Main preset configuration
├── effects/               # Individual effect files
│   ├── rainbow-spiral.js  # Example custom preset
│   └── neon-pulse.js      # Example custom preset
└── custom/                # Your custom presets go here
```

## 🚀 Adding Custom Presets

### Step 1: Create Your Effect File

Create a new JavaScript file in the `presets/effects/` folder:

```javascript
// presets/effects/my-effect.js
export function renderMyEffect(ctx, time, audioData, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Your visualization code here
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2 + time;
    const radius = 80 + Math.sin(time + i * 0.1) * 30;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    ctx.fillStyle = `hsl(${(i * 3.6 + time * 30) % 360}, 80%, 70%)`;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

### Step 2: Add to Preset Configuration

Edit `presets/index.js` to add your preset:

```javascript
// Import your effect
import { renderMyEffect } from './effects/my-effect.js';

// Add to presets array
{
  name: 'My Awesome Effect',
  type: 'myEffect',
  description: 'My custom visualization effect',
  category: 'Custom',
  custom: true
},

// Add to customEffects object
export const customEffects = {
  // ... existing effects
  myEffect: renderMyEffect
};
```

### Step 3: Update Main Module

Edit `modules/index.js` to include your effect:

```javascript
// In the attachEffects function
visualizer.renderMyEffect = (width, height) => Effects.renderMyEffect(visualizer.ctx, visualizer.time, visualizer.audioData, width, height);

// In the render switch statement
case 'myEffect':
  this.renderMyEffect(width, height);
  break;
```

## 🎯 Available Parameters

Your render function receives these parameters:

- **`ctx`** - Canvas 2D context for drawing
- **`time`** - Current time in seconds (for animation)
- **`audioData`** - Audio analysis data:
  - `audioData.volume` - Overall volume (0-255)
  - `audioData.bass` - Bass frequencies (0-255)
  - `audioData.mid` - Mid frequencies (0-255)
  - `audioData.treble` - Treble frequencies (0-255)
  - `audioData.frequency` - Full frequency spectrum
  - `audioData.waveform` - Waveform data
- **`width`** - Canvas width
- **`height`** - Canvas height

## 🎨 Drawing Examples

### Basic Shapes

```javascript
// Circle
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();

// Rectangle
ctx.fillRect(x, y, width, height);

// Line
ctx.beginPath();
ctx.moveTo(startX, startY);
ctx.lineTo(endX, endY);
ctx.stroke();
```

### Colors and Styles

```javascript
// Solid color
ctx.fillStyle = 'red';
ctx.fillStyle = '#ff0000';
ctx.fillStyle = 'rgb(255, 0, 0)';

// HSL with animation
ctx.fillStyle = `hsl(${(time * 30) % 360}, 80%, 70%)`;

// Transparency
ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';

// Line styles
ctx.lineWidth = 2;
ctx.lineCap = 'round';
ctx.strokeStyle = 'blue';
```

### Audio Reactivity

```javascript
// Size based on volume
const size = 5 + (audioData.volume * 0.1);

// Color based on bass
const hue = 200 + (audioData.bass * 0.5);
ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;

// Animation speed based on treble
const speed = 1 + (audioData.treble * 0.01);
const angle = time * speed;
```

## 🔧 Best Practices

### Performance
- Keep loops under 200-300 iterations
- Use `Math.max(1, value)` to prevent negative values
- Avoid complex calculations in render loops

### Safety
- Always check bounds before drawing
- Use `Math.max()` and `Math.min()` for safe values
- Handle edge cases gracefully

### Audio Integration
- Use `audioData.volume` for overall reactivity
- Use `audioData.bass`, `audioData.mid`, `audioData.treble` for frequency-specific effects
- Scale audio values appropriately (they're 0-255)

## 📚 Example Presets

### Simple Particle System
```javascript
export function renderParticles(ctx, time, audioData, width, height) {
  const particleCount = 50 + (audioData.volume * 0.2);
  
  for (let i = 0; i < particleCount; i++) {
    const x = (i * 7.3) % width;
    const y = (i * 11.7 + time * 30) % height;
    const size = 2 + Math.sin(time + i * 0.1) * 2;
    
    ctx.fillStyle = `hsl(${(i * 7 + time * 30) % 360}, 80%, 70%)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

### Audio-Reactive Bars
```javascript
export function renderAudioBars(ctx, time, audioData, width, height) {
  const barCount = 32;
  const barWidth = width / barCount;
  
  for (let i = 0; i < barCount; i++) {
    const barHeight = (audioData.frequency[i * 8] || 0) * 0.5;
    const x = i * barWidth;
    const y = height - barHeight;
    
    ctx.fillStyle = `hsl(${(i * 11) % 360}, 80%, 70%)`;
    ctx.fillRect(x, y, barWidth - 2, barHeight);
  }
}
```

## 🎉 Tips for Great Effects

1. **Use `time` for smooth animation** - Always animate based on the `time` parameter
2. **Be audio reactive** - Use audio data to make effects respond to music
3. **Think in layers** - Create depth with multiple rendering passes
4. **Use gradients** - Canvas gradients create beautiful effects
5. **Experiment with math** - Sine, cosine, and other functions create organic motion
6. **Consider performance** - Balance visual quality with smooth performance

## 🚨 Troubleshooting

### Effect not showing
- Check that the preset is added to `presets/index.js`
- Verify the render function is attached in `modules/index.js`
- Check browser console for errors

### Performance issues
- Reduce loop iterations
- Simplify calculations
- Use `requestAnimationFrame` for smooth animation

### Audio not working
- Ensure audio is playing
- Check that `audioData` values are reasonable
- Verify audio connection in the main visualizer

## 📖 Advanced Features

### Custom Shaders
For advanced users, you can create WebGL shaders for even more impressive effects.

### External Libraries
You can import and use external visualization libraries like Three.js or p5.js.

### Dynamic Preset Loading
Create a system to load presets from external files or URLs.

---

Happy coding! 🎨✨ Create amazing visualizations and share them with the community!
