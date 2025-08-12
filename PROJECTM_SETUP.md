# 🎨 ProjectM Setup Guide - .milk Preset Support

## 📁 **Recommended Folder Structure**

```
your-site/
├── index.html
├── styles.css
├── media.js
├── projectm-real.html          # Enhanced ProjectM visualizer
├── projectm-visualizer.html    # Basic visualizer (backup)
├── presets/                    # Create this folder for .milk files
│   ├── milk/                   # Put .milk files here
│   │   ├── preset1.milk
│   │   ├── preset2.milk
│   │   └── ...
│   └── webgl/                  # WebGL preset files (optional)
│       ├── custom1.js
│       └── custom2.js
└── PROJECTM_SETUP.md           # This file
```

## 🚀 **How to Use .milk Files**

### **Option 1: Drag & Drop (Easiest)**

1. **Open the ProjectM panel** by clicking the 🎨 button
2. **Click "Start Visualization"** to load the visualizer
3. **Drag .milk files** directly onto the visualizer window
4. **Use the preset controls** to navigate between loaded presets

### **Option 2: File Input**

1. **Open the ProjectM panel**
2. **Click "Start Visualization"**
3. **Click "Choose Files"** in the visualizer
4. **Select multiple .milk files** at once
5. **Navigate through presets** using the controls

### **Option 3: Pre-load Presets**

1. **Place .milk files** in the `presets/milk/` folder
2. **Modify the visualizer** to auto-load from this folder
3. **Restart the visualizer** to see new presets

## 📋 **Where to Get .milk Files**

### **Official Sources:**
- **ProjectM Repository**: https://github.com/projectM-visualizer/projectm
- **Preset Collections**: Various community collections
- **Winamp Presets**: Many .milk files are compatible

### **Popular .milk Collections:**
- **Geiss Presets**: Classic geometric patterns
- **Milkdrop Presets**: Advanced audio-reactive visualizations
- **Community Presets**: User-created collections

## 🔧 **Advanced Setup**

### **Auto-load Presets from Folder**

To automatically load presets from a folder, you can modify the visualizer:

```javascript
// In projectm-real.html, add this function:
async function loadPresetsFromFolder() {
    try {
        const response = await fetch('presets/milk/');
        const files = await response.text();
        // Parse directory listing and load .milk files
        // This requires server-side support
    } catch (error) {
        console.log('Auto-load not available, use manual upload');
    }
}
```

### **Custom Preset Parsing**

For advanced users, you can enhance the `.milk` file parsing:

```javascript
// Enhanced milk preset parser
parseMilkPreset(content) {
    const lines = content.split('\n');
    const preset = {
        name: '',
        parameters: {},
        code: content
    };
    
    lines.forEach(line => {
        if (line.startsWith('//')) {
            // Parse comments for preset name
            const nameMatch = line.match(/\/\/\s*(.+)/);
            if (nameMatch) preset.name = nameMatch[1];
        }
        // Add more parsing logic here
    });
    
    return preset;
}
```

## 🎯 **Current Features**

✅ **6 Built-in Presets** - Geiss, Waveform, Spectrum, Particles, Spiral, Matrix  
✅ **Drag & Drop .milk Support** - Load any .milk preset file  
✅ **Preset Navigation** - Next, Previous, Random, Reset  
✅ **Audio Integration Ready** - Can receive real audio data  
✅ **Fullscreen Mode** - Immersive visualization experience  
✅ **Responsive Design** - Works on all screen sizes  

## 🚨 **Troubleshooting**

### **Presets Not Loading:**
- Check file format (must be .milk)
- Ensure files are valid ProjectM presets
- Try refreshing the visualizer

### **Performance Issues:**
- Reduce preset complexity
- Close other browser tabs
- Check WebGL support in your browser

### **Audio Not Working:**
- Enable audio permissions in browser
- Check if music is playing in your site
- Verify audio integration is active

## 🔮 **Future Enhancements**

- **Real-time .milk Parsing** - Full ProjectM compatibility
- **Preset Library Management** - Organize and categorize presets
- **Audio-reactive Presets** - Real-time frequency analysis
- **Custom Preset Editor** - Create your own visualizations
- **Preset Sharing** - Export/import preset collections

## 📞 **Support**

If you need help with:
- **Loading .milk files** - Check the file format and try different presets
- **Performance issues** - Reduce preset complexity or check browser compatibility
- **Custom development** - Modify the visualizer code as needed

## 🎉 **Quick Start**

1. **Create the folder structure** above
2. **Download some .milk files** from ProjectM repositories
3. **Open your site** and click the 🎨 button
4. **Start the visualizer** and drag .milk files onto it
5. **Enjoy your custom visualizations!**

---

**Note**: The current implementation provides a WebGL-based visualizer that can load .milk files. For full ProjectM compatibility, you may need to implement the complete .milk parser, but this gives you a working foundation with custom preset support.
