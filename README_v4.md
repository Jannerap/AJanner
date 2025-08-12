# MindsEye v4.0 - Interactive Digital Canvas & Media Player

## 🎨 Overview

MindsEye is an advanced interactive digital canvas application that combines bubble-based idea visualization with powerful media playback and animation recording capabilities. Version 4.0 introduces comprehensive video player controls, animation recording system, and enhanced UI modularity.

## ✨ Key Features

### 🎯 Core Functionality
- **Interactive Bubble Canvas**: Create, edit, and animate idea bubbles
- **Media Integration**: YouTube video player with advanced controls
- **Animation Recording**: Capture and playback bubble movements
- **Music Player**: Background music with playlist support
- **Image Upload**: Custom bubble images and backgrounds
- **Theme System**: Multiple visual themes and presets

### 🎥 Video Player (NEW v4)
- **3D Positioning**: Opacity, size, and vertical position controls
- **Hover Tooltips**: Informative labels for all sliders
- **Always-On-Top Controls**: Z-index optimized for visibility
- **Playlist Management**: Upload, cycle, and random video selection
- **YouTube Integration**: Direct video loading and playback

### 🎬 Animation System (NEW v4)
- **Keyframe Recording**: Capture bubble positions at specific times
- **Timeline Scrubbing**: Real-time preview and position updates
- **Save/Load**: Export and import animation JSON files
- **Auto-Update**: Modify keyframes by moving bubbles during recording
- **Duration Control**: 10s, 20s, 30s, 40s, 50s playback options

### 🎛️ Enhanced Controls
- **PNG Button System**: All toolbar buttons use custom PNG images
- **Modular Loading**: Centralized PNG configuration and loading
- **Hover Effects**: Professional tooltips and visual feedback
- **Responsive Design**: Adaptive layouts and smooth transitions

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local file server (for PNG loading and media playback)
- YouTube API access (for video functionality)

### Installation
1. Clone or download the repository
2. Serve files through a local web server
3. Open `index.html` in your browser
4. Ensure all PNG images are in the `images/` folder

## 📁 File Structure

```
Argyle/
├── index.html              # Main application interface
├── main.js                 # Core bubble and canvas functionality
├── media.js                # Video player and animation system
├── video.js                # YouTube integration
├── themes.js               # Theme and preset management
├── styles.css              # Complete styling system
├── images/                 # PNG button assets (100+ files)
├── mp3/                    # Music files
├── README_v4.md           # This documentation
└── Various .txt files     # Playlist configurations
```

## 🎮 Usage Guide

### Creating Bubbles
1. **Click anywhere** on the canvas to create a bubble
2. **Double-click** to edit bubble content
3. **Drag** to move bubbles around
4. **Use panel controls** to customize appearance

### Video Player Controls
1. **Click "Video" button** in toolbar to open player
2. **Hover over video** to show controls
3. **Use sliders** for:
   - **Opacity**: 0.0 to 1.0 transparency
   - **Size**: 0.3x to 1.5x scale
   - **Vertical Position**: -200px to +200px movement
4. **Upload playlists** (.txt files) for batch video loading

### Animation Recording
1. **Open Media Toolbar** (click "Media" button)
2. **Set duration** (10s-50s) from dropdown
3. **Click "In Point"** to start recording
4. **Move bubbles** to desired positions
5. **Click "Keyframe"** to capture positions
6. **Click "Out Point"** to finish recording
7. **Click "Play"** to playback animation
8. **Save/Load** animations using JSON files

### Music Player
1. **Click "Music" button** in toolbar
2. **Select MP3 files** from the list
3. **Click to play** background music
4. **Use stop button** to end playback

## 🎨 Customization

### Themes
- **Multiple themes** available in themes.js
- **Color schemes** for bubbles, backgrounds, and UI
- **Preset configurations** for quick setup

### PNG Buttons
- **Custom PNG images** for all toolbar buttons
- **Hover effects** and visual feedback
- **Modular loading system** for easy updates

### Animation Workflow
- **In-point recording**: Start animation capture
- **Keyframe creation**: Capture specific positions
- **Timeline scrubbing**: Real-time preview
- **Auto-update**: Modify keyframes during recording
- **Export/Import**: Save and load animation files

## 🔧 Technical Features

### Z-Index Hierarchy
```
20001: Video Controls (highest)
2000:  Dice Overlay
10001: Toolbar
1000:  Video Player
1:     Video iframe
```

### Animation System
- **Ideas Array**: Central data structure for bubble positions
- **Keyframe Interpolation**: Smooth position transitions
- **Timeline Markers**: Visual indicators for keyframes
- **JSON Export**: Complete animation state serialization

### PNG Loading System
- **PNG_CONFIG**: Centralized button-to-file mapping
- **PNGLoader**: Modular loading utility
- **Container-specific targeting**: Precise button identification
- **CSS integration**: Seamless visual integration

## 🐛 Troubleshooting

### Common Issues

#### Video Controls Not Visible
- **Check z-index**: Controls should be at 20001
- **Hover over video**: Controls appear on mouse enter
- **Check console**: Debug logs show control states

#### PNG Buttons Not Loading
- **Verify file paths**: PNGs must be in `images/` folder
- **Check browser console**: Error messages for missing files
- **Use debug functions**: `debugPNGLoading()` in console

#### Animation Not Recording
- **Check ideas array**: Ensure bubbles exist in main.js
- **Verify recording state**: Animation must be active
- **Use test functions**: `testBubbleCapture()` in console

### Debug Functions
```javascript
// Available in browser console
debugPNGLoading()           // Test PNG loading system
testBubbleCapture()         // Verify bubble position capture
autoUpdateKeyframes()       // Update keyframes manually
updateKeyframesForCurrentPositions()  // Force keyframe update
```

## 🎯 Version 4.0 Highlights

### Major Improvements
- **Complete video player** with 3D positioning controls
- **Animation recording system** with timeline and keyframes
- **Modular PNG loading** for all toolbar buttons
- **Enhanced z-index management** for proper layering
- **Comprehensive hover tooltips** and visual feedback

### New Features
- **Vertical position slider** for video player
- **Animation save/load** with JSON export
- **Timeline scrubbing** with real-time updates
- **Auto-update keyframes** during recording
- **Professional tooltips** for all controls

### Technical Enhancements
- **Centralized state management** for animations
- **Robust error handling** and debugging
- **Optimized performance** with modular loading
- **Cross-browser compatibility** improvements

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📞 Support

For support, questions, or feature requests, please open an issue in the repository or contact the development team.

---

**MindsEye v4.0** - Where ideas come to life through interactive visualization and powerful media integration! 🎨✨ 