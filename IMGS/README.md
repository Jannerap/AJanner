# IMGS Folder - Image Collage Visualizer

This folder contains images for the **Image Collage Visual** effect.

## Setup Instructions

### 1. Add Your Images
Place your image files in this folder. Supported formats:
- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.gif`

### 2. Update index.json
Edit `index.json` to list your image files:

```json
[
  "IMGS/your-image-1.jpg",
  "IMGS/your-image-2.png",
  "IMGS/your-image-3.webp",
  "IMGS/your-image-4.jpg"
]
```

### 3. Alternative: Set Global Variable
You can also set images programmatically:

```javascript
window.VJ_IMAGE_SOURCES = [
  "IMGS/image1.jpg",
  "IMGS/image2.png",
  "IMGS/image3.webp"
];
```

## Image Requirements

- **Format**: JPG, PNG, WebP, or GIF
- **Size**: Any size (will be automatically scaled)
- **Aspect Ratio**: Any (will be automatically cropped to fit)
- **Quantity**: Minimum 1, recommended 5-20 images

## How It Works

The Image Collage Visual:
1. **Loads images** from this folder
2. **Crossfades** between images based on audio
3. **Applies effects** like chromatic aberration and glitches
4. **Creates feedback trails** for motion persistence
5. **Randomizes transforms** (pan, zoom, rotate) for each image

## Troubleshooting

- **No images showing**: Check `index.json` format and image paths
- **Images not loading**: Ensure images exist and are accessible
- **Performance issues**: Reduce image count or image sizes
- **CORS errors**: Serve images from the same domain

## Example Images

You can start with any images you like, or use placeholder images for testing.
