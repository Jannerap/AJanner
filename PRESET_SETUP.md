# 🎨 ProjectM Preset System Setup Guide

## 📁 **Folder Structure**

Your presets are organized in a dedicated `presets/` folder that's completely separate from your music and video playlists:

```
Argyle/
├── presets/                    # 🎨 Preset folder (NEW!)
│   ├── index.txt              # 📋 List of available presets
│   ├── sample_preset.milk     # 🎭 Example preset
│   └── your_preset.milk       # 🎨 Your custom presets
├── mp3/                       # 🎵 Music files (unchanged)
├── playlist.txt               # 📋 Music playlist (unchanged)
└── ...                        # Other files (unchanged)
```

## 🚀 **How to Add Your Own Presets**

### **Option 1: Drag & Drop (Easiest)**
1. **Open the ProjectM Panel** (🎨 button in Analysis Panel)
2. **Click "📁 Load Default Presets"** to see the file input
3. **Drag your .milk files** into the file input area
4. **Your presets will appear** in the preset list immediately

### **Option 2: Pre-load from Presets Folder (Recommended)**
1. **Place your .milk files** in the `presets/` folder
2. **Edit `presets/index.txt`** and add your filenames:
   ```
   # Add your presets here:
   my_awesome_preset.milk
   cool_visualization.milk
   epic_effects.milk
   ```
3. **Restart the ProjectM panel** - presets will auto-load!

## 📋 **Preset File Format**

### **Basic .milk File Structure:**
```
# This is a comment
PRESET_NAME "My Cool Preset"
PRESET_AUTHOR "Your Name"
PRESET_RATING 5

# Animation parameters
WAVE_SPEED 1.5      # Rotation speed (0.1 to 5.0)
WAVE_SCALE 1.2      # Size scale (0.5 to 2.0)
WAVES 12            # Number of wave elements
WAVE_MODE 3         # Wave rendering mode

# Color parameters
WAVE_A 0.8          # Red component (0.0 to 1.0)
WAVE_B 0.6          # Green component (0.0 to 1.0)
WAVE_C 0.9          # Blue component (0.0 to 1.0)
```

### **Supported Parameters:**
- **`WAVE_SPEED`**: Controls rotation speed
- **`WAVE_SCALE`**: Controls size/scale of effects
- **`WAVES`**: Number of wave elements
- **`WAVE_MODE`**: Rendering mode (1-5)
- **`WAVE_A/B/C`**: RGB color components
- **`WAVE_SMOOTHING`**: Smoothness level (0.0 to 1.0)

## 🎯 **Where to Get .milk Presets**

### **Free Preset Sources:**
1. **ProjectM Official**: [projectm.sourceforge.net](https://projectm.sourceforge.net)
2. **MilkDrop Presets**: [milkdrop.co.uk](https://milkdrop.co.uk)
3. **Community Collections**: Search for "milkdrop presets" or "projectm presets"

### **Converting from MilkDrop:**
- **MilkDrop presets** (.milk) work directly with ProjectM
- **No conversion needed** - just copy .milk files to your presets folder

## 🔧 **Troubleshooting**

### **Presets Not Loading?**
1. **Check file format**: Ensure files end with `.milk`
2. **Check index.txt**: Make sure filenames are listed correctly
3. **Check console**: Look for error messages in browser console
4. **File permissions**: Ensure files are readable

### **Preset Looks Wrong?**
1. **Parameter values**: Check that numeric values are reasonable (0.1 to 5.0)
2. **File encoding**: Use UTF-8 encoding for .milk files
3. **Syntax errors**: Ensure no typos in parameter names

### **Performance Issues?**
1. **Reduce complexity**: Use fewer `WAVES` or lower `WAVE_MODE`
2. **Check WebGL**: Ensure WebGL is working (check renderer status)
3. **Close other tabs**: Reduce browser memory usage

## 🎨 **Custom Preset Creation**

### **Basic Template:**
```
PRESET_NAME "My First Preset"
PRESET_AUTHOR "Your Name"
PRESET_RATING 5

# Start with simple parameters
WAVE_SPEED 1.0
WAVE_SCALE 1.0
WAVES 8
WAVE_MODE 1

# Add colors
WAVE_A 1.0
WAVE_B 0.5
WAVE_C 0.8
```

### **Advanced Tips:**
1. **Start simple**: Begin with basic parameters
2. **Test incrementally**: Add one parameter at a time
3. **Use comments**: Document what each parameter does
4. **Backup files**: Keep copies of working presets

## 🔄 **Integration with Your Site**

### **No Interference:**
- ✅ **Music playlists**: Completely separate system
- ✅ **Video playlists**: No conflicts
- ✅ **File uploads**: Presets don't affect other uploads
- ✅ **Performance**: Lightweight preset loading

### **Auto-Loading:**
- ✅ **Starts automatically** when ProjectM panel opens
- ✅ **Loads from presets folder** without user action
- ✅ **Updates preset list** in real-time
- ✅ **Remembers loaded presets** during session

## 📱 **Mobile Compatibility**

### **Mobile Features:**
- ✅ **Touch-friendly controls** for preset switching
- ✅ **Responsive design** adapts to screen size
- ✅ **Performance optimized** for mobile devices
- ✅ **Fallback rendering** if WebGL isn't supported

## 🎵 **Audio Reactivity (Future)**

### **Planned Features:**
- 🚧 **Audio input**: Connect to music player
- 🚧 **FFT analysis**: Real-time frequency analysis
- 🚧 **Beat detection**: Sync to music tempo
- 🚧 **Dynamic parameters**: Change based on audio

## 🆘 **Need Help?**

### **Common Issues:**
1. **"No presets loaded"**: Check your presets folder and index.txt
2. **"WebGL not supported"**: System will use Canvas 2D fallback
3. **"Preset not found"**: Verify filename spelling in index.txt
4. **"Rendering error"**: Check .milk file syntax

### **Getting Support:**
- **Check console logs** for error messages
- **Verify file paths** and permissions
- **Test with sample preset** first
- **Restart ProjectM panel** after changes

---

## 🎉 **You're Ready!**

Your ProjectM preset system is now set up and ready to use! 

1. **Add .milk files** to the `presets/` folder
2. **List them** in `presets/index.txt`
3. **Open ProjectM panel** and enjoy your visualizations!

The system will automatically load your presets and provide a smooth, professional visualization experience. 🎨✨
