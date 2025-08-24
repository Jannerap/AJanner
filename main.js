// ===== MINDS EYE - MAIN CORE =====

// Centralized logging system - OPTIMIZED FOR PERFORMANCE
(function() {
    const LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    // Set to ERROR only for production - reduces console spam significantly
    let currentLogLevel = LOG_LEVELS.ERROR; // Changed from INFO to ERROR for performance
    let logCount = 0;
    const MAX_LOGS_PER_SECOND = 2; // Reduced from 3 to 2 for even less spam
    let lastLogTime = 0;
    const MIN_LOG_INTERVAL = 200; // Increased from 100ms to 200ms for less frequent logging

    // Frame-based logging control to prevent spam in animation loops
    let frameCounter = 0;
    const LOG_EVERY_N_FRAMES = 60; // Only log every 60 frames (once per second at 60fps)

    function log(level, message, data = null) {
        const now = Date.now();
        
        // Rate limiting: only log if enough time has passed and we're under the limit
        if (level <= currentLogLevel && 
            logCount < MAX_LOGS_PER_SECOND && 
            (now - lastLogTime) >= MIN_LOG_INTERVAL) {
            
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            const prefix = `[${timestamp}] `;
            
            switch (level) {
                case LOG_LEVELS.ERROR:
                    console.error(prefix + message, data);
                    break;
                case LOG_LEVELS.WARN:
                    console.warn(prefix + message, data);
                    break;
                case LOG_LEVELS.INFO:
                    console.info(prefix + message, data);
                    break;
                case LOG_LEVELS.DEBUG:
                    console.log(prefix + message, data);
                    break;
            }
            logCount++;
            lastLogTime = now;
        }
    }

    // Reset log counter every second
    setInterval(() => { logCount = 0; }, 1000);

    // Logging utility functions with frame-based control
    const logger = {
        error: (msg, data) => log(LOG_LEVELS.ERROR, msg, data),
        warn: (msg, data) => log(LOG_LEVELS.WARN, msg, data),
        info: (msg, data) => log(LOG_LEVELS.INFO, msg, data),
        debug: (msg, data) => {
            // Only log debug messages every N frames to prevent spam in animation loops
            if (window.frameCounter % LOG_EVERY_N_FRAMES === 0) {
                log(LOG_LEVELS.DEBUG, msg, data);
            }
        },
        // Special function for frequent updates that should be logged sparingly
        debugSparse: (msg, data, interval = 120) => {
            if (window.frameCounter % interval === 0) {
                log(LOG_LEVELS.DEBUG, msg, data);
            }
        }
    };

    // Make logger available globally for this file
    window.mainLogger = logger;
    window.logger = logger; // Also make it available as 'logger' for convenience
    
    // Expose frameCounter for animation loop updates
    window.updateFrameCounter = function() {
        frameCounter++;
        window.frameCounter = frameCounter; // Keep global in sync
    };
    
    // Make frameCounter globally accessible for reading
    window.getFrameCounter = function() {
        return frameCounter;
    };
    
    // Also expose frameCounter directly for convenience
    window.frameCounter = frameCounter;
    
    // Expose logging constants for external use
    window.LOG_LEVELS = LOG_LEVELS;
    window.LOG_EVERY_N_FRAMES = LOG_EVERY_N_FRAMES;
})();

// Global variables
let movementDelayActive = false;
let backgroundRotation = 0;
let speedMultiplier = 0; // Start paused for edit mode
let previousSpeed = 1.3; // Default resume speed
let originalSpeed = 1.3; // Default original speed
let showPauseBorder = false; // Track pause border state (renamed from showCheckeredBorder)
let ideas = [];
let selectedIdea = null;
let backgroundImage = null;
let currentTheme = "default";
let backgroundIndex = 1;
let width, height;
let border = 10;
let strikerAttacks = []; // Array to track active striker attacks

// Striker capture system
let strikerCaptureMode = false;
let capturedBubble = null;
let lastStrikerCapture = 0;
let strikerCaptureCooldown = 3000; // 3 seconds cooldown (only applies to previously captured bubbles)
let strikerLastDirection = { x: 0, y: 0 }; // Track striker movement direction
let collisionDetected = false; // Flag to prevent position override after collision
let captureFrame = 0; // Track which frame the capture happened
let captureModeStartTime = 0; // Track when capture mode was activated
let captureModeDuration = 1000; // 1 second duration for capture mode

// Drag and drop variables
let isDragging = false;
let draggedIdea = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Canvas setup
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Font array
const fonts = [
  "Monaco", "Arial", "Verdana", "Tahoma", "Trebuchet MS", "Comic Sans MS",
  "Impact", "Franklin Gothic Medium", "Century Gothic", "Calibri", "Cambria",
  "Constantia", "Corbel", "Arial Black", "System-ui", "Sans-serif",
  "Times New Roman", "Georgia", "Garamond", "Courier New", "Lucida Sans Unicode",
  "Palatino Linotype", "Serif", "Monospace"
];
let fontIndex = 0;

// Image management
const loadedImages = {};
let imageLoadErrors = new Set();

// Panel management
let panelSide = 'left';
let panelFadeTimeout = null;

// Video Playlist variables
let videoPlaylist = [];
let videoCurrentIndex = 0;
let videoPlaylistVisible = false;
let videoPlaylistTimeout = null;
let videoTitles = [];

// Drawing mode variables
let isDrawingMode = false;
let isDrawing = false;
let drawingPath = [];
let drawingColor = '#FF3131';
let drawingWidth = 5;
let existingDrawingsFlash = false; // For flashing existing drawings
let drawingGlow = false; // For glowing existing drawings
let drawingGlowAnimationId = null;
let drawingPaths = []; // Store all drawing paths for smoothing
// Removed previousSpeedForDrawing - using single previousSpeed variable

// ===== UTILITY FUNCTIONS =====

function randomColor() {
  return `hsl(${Math.random() * 360}, 100%, 70%)`;
}

// ===== SHAPE DRAWING FUNCTIONS =====

function drawShape(ctx, shape, x, y, radius, heightRatio = 1.0, rotation = 0) {
  // Calculate width and height based on ratio
  let width, height;
  if (heightRatio <= 1.0) {
    // For ratios <= 1.0, keep width constant, adjust height
    width = radius;
    height = radius * heightRatio;
  } else {
    // For ratios > 1.0, keep height constant, adjust width
    width = radius / heightRatio;
    height = radius;
  }
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  switch(shape) {
    case 'circle':
      ctx.beginPath();
      ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
      break;
      
    case 'square':
      ctx.beginPath();
      ctx.rect(-width, -height, width * 2, height * 2);
      break;
      
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -height);
      ctx.lineTo(-width, height);
      ctx.lineTo(width, height);
      ctx.closePath();
      break;
      
    case 'pentagon':
      drawRegularPolygon(ctx, 0, 0, width, 5);
      break;
      
    case 'hexagon':
      drawRegularPolygon(ctx, 0, 0, width, 6);
      break;
      
    case 'octagon':
      drawRegularPolygon(ctx, 0, 0, width, 8);
      break;
      
    case 'striker':
      // Striker is drawn as a circle with a special visual indicator
      ctx.beginPath();
      ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
      break;
      
    case 'goal':
      // Goal is drawn as a vertical rectangle (height:width = 2:1 ratio)
      ctx.beginPath();
      const goalWidth = radius * 0.5; // Narrow width
      const goalHeight = radius; // Full height
      ctx.rect(-goalWidth/2, -goalHeight/2, goalWidth, goalHeight);
      break;
      
    case 'ball':
      // Ball is drawn as a circle (like a football/soccer ball)
      ctx.beginPath();
      ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
      break;
      
    case 'puck':
      // Puck is drawn as a circle (like a hockey puck)
      ctx.beginPath();
      ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
      break;
      
    default:
      // Default to circle
      ctx.beginPath();
      ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
  }
  
  ctx.restore();
}

function drawRegularPolygon(ctx, x, y, radius, sides) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function randomTextColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 100;
  const lightness = 50 + Math.random() * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// ===== DRAWING FUNCTIONS =====

function toggleDrawingMode() {
  isDrawingMode = !isDrawingMode;
          window.mainLogger.info('✏️ Drawing mode:', isDrawingMode ? 'ON' : 'OFF');
  
  // Get references to elements
  const analysisButton = document.querySelector('[data-icon="analysis"]');
  const drawingDropdowns = document.getElementById('drawingDropdowns');
  const colorDropdown = document.getElementById('drawingColorDropdown');
  const widthDropdown = document.getElementById('drawingWidthDropdown');
  
  // Update cursor and CSS class
  if (isDrawingMode) {
    // Store current speed and pause animation
    // Ensure we always store a valid speed for restoration
    if (speedMultiplier > 0) {
      previousSpeed = speedMultiplier;
      originalSpeed = speedMultiplier; // Update original speed
    } else if (originalSpeed > 0) {
      previousSpeed = originalSpeed;
    } else {
      // Fallback to default speed if no valid speed is available
      previousSpeed = 1;
      originalSpeed = 1;
    }
    speedMultiplier = 0;
    
    // Update the speed slider to reflect paused state
    const speedSlider = document.querySelector('input[type="range"]');
    if (speedSlider) {
      speedSlider.value = 0;
      speedSlider.classList.add('paused');
    }
    
    canvas.style.cursor = 'url(images/cross.png) 16 16, crosshair';
    canvas.classList.add('drawing-mode');
            window.mainLogger.info('🎨 Drawing mode activated - click and drag to draw');
        window.mainLogger.info('⌨️ Keyboard shortcuts: D=Toggle Mode, W=Width, C=Color, S=Smooth Last Line, X=Clear (works in any mode), F=Flash Existing Drawings');
        window.mainLogger.info('💡 Animation paused, bubble creation disabled');
        window.mainLogger.info('⚡ Speed stored as:', previousSpeed, '(current was:', speedMultiplier, ')');
    
    // Hide Analysis button and show drawing dropdowns
    if (analysisButton) {
      analysisButton.style.display = 'none';
    }
    if (drawingDropdowns) {
      drawingDropdowns.style.display = 'flex';
      // Update all UI elements to ensure synchronization
      updateDrawingColorUI();
      updateDrawingWidthUI();
    }
    
    // Drawings will be automatically redrawn by the draw loop
    logger.info('🎨 Drawing mode activated - drawings will be preserved');
    
    // Update draw button to show active state
    const drawButton = document.querySelector('[data-icon="draw"]');
    if (drawButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(drawButton, 'draw2.png');
    }
  } else {
    // Restore previous speed with fallback to ensure smooth performance
    if (previousSpeed && previousSpeed > 0) {
      speedMultiplier = previousSpeed;
    } else {
      // Fallback to a reasonable default speed if previousSpeed is invalid
      speedMultiplier = 1;
      previousSpeed = 1;
    }
    
    // Update the speed slider to reflect restored state
    const speedSlider = document.querySelector('input[type="range"]');
    if (speedSlider) {
      speedSlider.value = speedMultiplier;
      speedSlider.classList.remove('paused');
    }
    
    canvas.style.cursor = 'default';
    canvas.classList.remove('drawing-mode');
    logger.info('🎨 Drawing mode deactivated');
    logger.info('💡 Animation resumed, bubble creation re-enabled');
    logger.info('⚡ Speed restored to:', speedMultiplier, '(previousSpeed was:', previousSpeed, ')');
    
    // Show Analysis button and hide drawing dropdowns
    if (analysisButton) {
      analysisButton.style.display = 'block';
    }
    if (drawingDropdowns) {
      drawingDropdowns.style.display = 'none';
    }
    
    // Update draw button to show inactive state
    const drawButton = document.querySelector('[data-icon="draw"]');
    if (drawButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(drawButton, 'draw.png');
    }
  }
}

function startDrawing(e) {
  if (!isDrawingMode) return;
  
  // Prevent bubble creation when drawing
  e.preventDefault();
  e.stopPropagation();
  
  // Close drawing settings panel when drawing starts
  closeDrawingSettings();
  
  isDrawing = true;
  drawingPath = [];
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  drawingPath.push({ x, y });
      logger.debug('✏️ Started drawing at:', x, y);
}

function drawLine(e) {
  if (!isDrawingMode || !isDrawing) return;
  
  // Prevent bubble creation when drawing
  e.preventDefault();
  e.stopPropagation();
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  drawingPath.push({ x, y });
  
  // Draw the line segment directly on the main canvas
  if (drawingPath.length >= 2) {
    const prev = drawingPath[drawingPath.length - 2];
    const curr = drawingPath[drawingPath.length - 1];
    
    // Save context state to prevent interference from flash animations
    ctx.save();
    
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = drawingWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 1; // Force solid opacity for current drawing
    
    ctx.stroke();
    
    // Restore context state
    ctx.restore();
    
    logger.debug('✏️ Drawing line from', prev.x, prev.y, 'to', curr.x, curr.y, 'color:', drawingColor, 'width:', drawingWidth);
  }
}

function stopDrawing() {
  if (!isDrawingMode) return;
  
  isDrawing = false;
  
  // Save the completed path with color and width
  if (drawingPath.length > 1) {
    const pathWithMetadata = [...drawingPath];
    // Always save the current drawing color and width
    pathWithMetadata.color = drawingColor;
    pathWithMetadata.width = drawingWidth;
    drawingPaths.push(pathWithMetadata);
    logger.info('✏️ Drawing path saved with', drawingPath.length, 'points, color:', drawingColor, 'width:', drawingWidth);
    logger.info('📊 Total paths stored:', drawingPaths.length);
    
    // Debug: Check all stored paths
    for (let i = 0; i < drawingPaths.length; i++) {
      const path = drawingPaths[i];
      // Debug logging removed for performance
    }
  }
  
  drawingPath = [];
      logger.info('✏️ Stopped drawing');
}

function clearDrawing() {
  // Clear the canvas and redraw everything
  ctx.clearRect(0, 0, width, height);
  draw(); // Redraw all bubbles and background
  
  // Also clear the drawing paths array
  drawingPaths = [];
  
  // Stop flash animation if it's running
  if (existingDrawingsFlash) {
    stopExistingDrawingsFlash();
  }
  
      logger.info('🧹 Drawing cleared and paths array emptied');
}

function clearDrawingVisually() {
  // Clear only the visual canvas without touching drawingPaths array
  // This is for functions that need to redraw with effects
  
  // Simply clear the canvas and redraw background and bubbles without movement
  ctx.clearRect(0, 0, width, height);
  
  // Draw background
  if (backgroundImage) {
    if (backgroundRotation !== 0) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((backgroundRotation * Math.PI) / 180);
      const maxDimension = Math.max(width, height);
      const scaleX = width / backgroundImage.width;
      const scaleY = height / backgroundImage.height;
      const scale = Math.max(scaleX, scaleY) * 1.2;
      
      const scaledWidth = backgroundImage.width * scale;
      const scaledHeight = backgroundImage.height * scale;
      
      ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
    } else {
      ctx.drawImage(backgroundImage, 0, 0, width, height);
    }
  }
  
  // Draw bubbles without movement calculations
  for (let i = 0; i < ideas.length; i++) {
    const a = ideas[i];
    
    // Draw bubble (no movement calculations)
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    
    // Draw the shape path
    const shape = a.shape || 'circle';
    const heightRatio = a.heightRatio || 1.0;
    drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
    ctx.clip();

    if (a.image) {
      const src = a.image;
      
      if (loadedImages[src] && loadedImages[src].complete) {
        try {
          const img = loadedImages[src];
          const maxW = a.radius * 2;
          const maxH = a.radius * 2;
          const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } catch (error) {
          logger.error("❌ Error drawing image for bubble:", a.title, "Error:", error);
          a.image = null;
        }
      } else {
        if (!loadedImages[src]) {
          const img = new Image();
          img.onload = () => {
            loadedImages[src] = img;
          };
          img.onerror = () => {
            logger.error("❌ Failed to load image:", src);
            a.image = null;
          };
          img.src = src;
        }
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }
    } else {
      if (a.transparent) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
      } else if (a.animateColors) {
        ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
      } else {
        ctx.fillStyle = a.color || "white";
      }

      // Basic glow border (always present)
      ctx.shadowBlur = 10;
      ctx.shadowColor = a.color || "white";
      ctx.fill();
    }

    ctx.restore();

    // Enhanced glow effect (for bubbles with glow enabled)
    if (a.glow) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      ctx.shadowBlur = 20;
      ctx.shadowColor = a.color || "white";
      ctx.fillStyle = a.color || "white";
      drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
      ctx.fill();
      
      ctx.restore();
    }

    // Draw text
    if (a.title && a.title.trim() !== "") {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      ctx.font = `${a.fontSize || 14}px ${a.font || fonts[0]}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = a.textColor || "white";
      
      // Word wrap
      const words = a.title.split(" ");
      const lineHeight = a.fontSize || 14;
      let y = -lineHeight * (words.length - 1) / 2;
      
      for (let word of words) {
        ctx.fillText(word, 0, y);
        y += lineHeight;
      }
      
      ctx.restore();
    }
  }
}

function redrawBackgroundAndBubbles() {
  // Redraw background and bubbles without movement calculations
  // This is used for visual clearing without affecting speed state
  redrawBackgroundAndBubblesNoEffects();
}

function redrawBackgroundAndBubblesNoEffects() {
  // Redraw background and bubbles with basic effects but no animated effects
  // This is used for drawing operations to avoid cross-contamination
  
  // Draw background
  if (backgroundImage) {
    if (backgroundRotation !== 0) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((backgroundRotation * Math.PI) / 180);
      const maxDimension = Math.max(width, height);
      const scaleX = width / backgroundImage.width;
      const scaleY = height / backgroundImage.height;
      const scale = Math.max(scaleX, scaleY) * 1.2;
      
      const scaledWidth = backgroundImage.width * scale;
      const scaledHeight = backgroundImage.height * scale;
      
      ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
    } else {
      ctx.drawImage(backgroundImage, 0, 0, width, height);
    }
  } else {
    ctx.clearRect(0, 0, width, height);
  }
  
  // Draw bubbles without movement
  for (let i = 0; i < ideas.length; i++) {
    const a = ideas[i];
    
    // Draw bubble (no movement calculations)
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    
    // Draw the shape path
    const shape = a.shape || 'circle';
    const heightRatio = a.heightRatio || 1.0;
    drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
    ctx.clip();

    if (a.image) {
      const src = a.image;
      
      if (loadedImages[src] && loadedImages[src].complete) {
        try {
          const img = loadedImages[src];
          const maxW = a.radius * 2;
          const maxH = a.radius * 2;
          const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } catch (error) {
          logger.error("❌ Error drawing image for bubble:", a.title, "Error:", error);
          a.image = null;
        }
      } else {
        if (!loadedImages[src]) {
          const img = new Image();
          img.onload = () => {
            loadedImages[src] = img;
          };
          img.onerror = () => {
            logger.error("❌ Failed to load image:", src);
            a.image = null;
          };
          img.src = src;
        }
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }
    } else {
      if (a.transparent) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
      } else if (a.animateColors) {
        ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
      } else {
        ctx.fillStyle = a.color || "white";
      }

      // Basic glow border (always present)
      ctx.shadowBlur = 10;
      ctx.shadowColor = a.color || "white";
      ctx.fill();
    }

    ctx.restore();

    // Enhanced glow effect (for bubbles with glow enabled)
    if (a.glow) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      ctx.shadowBlur = 20;
      ctx.shadowColor = a.color || "white";
      ctx.fillStyle = a.color || "white";
      drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
      ctx.fill();
      
      ctx.restore();
    }

    // Draw text
    if (a.title && a.title.trim() !== "") {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      ctx.font = `${a.fontSize || 14}px ${a.font || fonts[0]}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = a.textColor || "white";
      
      // Word wrap
      const words = a.title.split(" ");
      const lineHeight = a.fontSize || 14;
      let y = -lineHeight * (words.length - 1) / 2;
      
      for (let word of words) {
        ctx.fillText(word, 0, y);
        y += lineHeight;
      }
      
      ctx.restore();
    }
  }
}

function clearDrawingOnly() {
  // Clear the drawingPaths array
  drawingPaths = [];
  
  // Only clear drawings, preserve bubbles and background
  if (backgroundImage) {
    // Redraw background to clear drawings
    if (backgroundRotation !== 0) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((backgroundRotation * Math.PI) / 180);
      const maxDimension = Math.max(width, height);
      const scaleX = width / backgroundImage.width;
      const scaleY = height / backgroundImage.height;
      const scale = Math.max(scaleX, scaleY) * 1.2;
      
      const scaledWidth = backgroundImage.width * scale;
      const scaledHeight = backgroundImage.height * scale;
      
      ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
    } else {
      ctx.drawImage(backgroundImage, 0, 0, width, height);
    }
  } else {
    // Clear with background color
    ctx.clearRect(0, 0, width, height);
  }
  
  // Redraw bubbles
  for (let i = 0; i < ideas.length; i++) {
    const a = ideas[i];
    
    // Draw bubble
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    ctx.beginPath();
    if (a.shape === 'goal') {
      // Rectangular clipping for goals
      const goalWidth = a.radius * 0.5; // 0.5:1 ratio
      const goalHeight = a.radius;
      
      // Account for goal rotation - swap dimensions if rotated 90 degrees
      let finalGoalWidth = goalWidth;
      let finalGoalHeight = goalHeight;
      if (a.rotation === 89 || a.rotation === 271 || a.rotation === 90 || a.rotation === 270) {
        // If rotated 90 degrees, swap width and height
        finalGoalWidth = goalHeight;
        finalGoalHeight = goalWidth;
      }
      
      ctx.rect(-finalGoalWidth/2, -finalGoalHeight/2, finalGoalWidth, finalGoalHeight);
    } else {
      // Circular clipping for other shapes
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
    }
    ctx.clip();

    if (a.image) {
      const src = a.image;
      
      if (loadedImages[src] && loadedImages[src].complete) {
        try {
          const img = loadedImages[src];
          const maxW = a.radius * 2;
          const maxH = a.radius * 2;
          const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } catch (error) {
          logger.error("❌ Error drawing image for bubble:", a.title, "Error:", error);
          a.image = null;
        }
      } else {
        if (!loadedImages[src]) {
          const img = new Image();
          img.onload = () => {
            loadedImages[src] = img;
          };
          img.onerror = () => {
            logger.error("❌ Failed to load image:", src);
            a.image = null;
          };
          img.src = src;
        }
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }
    } else {
      if (a.transparent) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
      } else if (a.animateColors) {
        ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
      } else {
        ctx.fillStyle = a.color || "white";
      }

      if (a.glow) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = a.color || "white";
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = a.color || "white";
      }
      
      ctx.fill();
    }

    ctx.restore();

    // Effects
    if (a.glow || a.flash) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      if (a.flash) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100);
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Rectangular flash for goals
          const goalWidth = a.radius * 2;
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2, -goalHeight/2, goalWidth, goalHeight);
        } else {
          ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
        }
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      if (a.glow) {
        const glowColor = a.glowColor || a.color || "white";
        
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Rectangular glow for goals
          const goalWidth = a.radius * 2;
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2 - 3, -goalHeight/2 - 3, goalWidth + 6, goalHeight + 6);
        } else {
          ctx.arc(0, 0, a.radius + 3, 0, Math.PI * 2);
        }
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Outer rectangular glow for goals
          const goalWidth = a.radius * 2;
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2 - 5, -goalHeight/2 - 5, goalWidth + 10, goalHeight + 10);
        } else {
          ctx.arc(0, 0, a.radius + 5, 0, Math.PI * 2);
        }
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Text
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    ctx.fillStyle = a.textColor || "white";
    const fontSize = a.fontSize || 14;
    ctx.font = `bold ${fontSize}px ${a.font || "Tahoma"}`;
    ctx.textAlign = "center";
    const words = a.title.split(" ");
    const lineHeight = fontSize + 2;
    words.forEach((word, idx) => {
      ctx.fillText(word, 0, idx * lineHeight - (words.length - 1) * (lineHeight / 2));
    });
    ctx.restore();
    
    // Visual feedback for dragging and manual control
    if (speedMultiplier === 0 && showPauseBorder) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
              if (a.shape === 'goal') {
          // Rectangular pause border for goals
          const goalWidth = a.radius * 0.5; // 0.5:1 ratio
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2 - 3, -goalHeight/2 - 3, goalWidth + 6, goalHeight + 6);
        } else {
        // Circular pause border for other shapes
        ctx.arc(0, 0, a.radius + 3, 0, Math.PI * 2);
      }
      ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
    
    // Visual feedback for dragging
    if (isDragging && draggedIdea === a) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      if (a.shape === 'goal') {
        // Rectangular drag border for goals
        const goalWidth = a.radius * 0.5; // 0.5:1 ratio
        const goalHeight = a.radius;
        ctx.rect(-goalWidth/2 - 8, -goalHeight/2 - 8, goalWidth + 16, goalHeight + 16);
      } else {
        // Circular drag border for other shapes
        ctx.arc(0, 0, a.radius + 8, 0, Math.PI * 2);
      }
      ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }
  
      logger.info('🧹 Only drawings cleared, bubbles and background preserved');
    logger.info('🎨 Drawings cleared - drawingPaths array reset');
}

// ===== DRAWING FLASH AND SMOOTH FUNCTIONS =====


function toggleDrawingFlash() {
  existingDrawingsFlash = !existingDrawingsFlash;
  const flashBtn = document.getElementById('flashDrawingBtn');
  
  if (existingDrawingsFlash) {
    flashBtn.style.background = 'linear-gradient(45deg, #FF1493, #FF69B4)';
    flashBtn.textContent = '✨ Flash ON';
    logger.info('✨ Drawing flash activated');
    
    // Start flash animation for existing drawings
    startExistingDrawingsFlash();
  } else {
    flashBtn.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
    flashBtn.textContent = '✨ Flash Drawing';
    logger.info('✨ Drawing flash deactivated');
    
    // Stop flash animation
    stopExistingDrawingsFlash();
  }
}

let flashAnimationId = null;

function startExistingDrawingsFlash() {
  if (flashAnimationId) return;
  
  function flashLoop() {
    if (!existingDrawingsFlash) return;
    
    // Clear the entire canvas first
    ctx.clearRect(0, 0, width, height);
    
    // Redraw background and bubbles without movement calculations
    // Draw background
    if (backgroundImage) {
      if (backgroundRotation !== 0) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((backgroundRotation * Math.PI) / 180);
        const maxDimension = Math.max(width, height);
        const scaleX = width / backgroundImage.width;
        const scaleY = height / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY) * 1.2;
        
        const scaledWidth = backgroundImage.width * scale;
        const scaledHeight = backgroundImage.height * scale;
        
        ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
      } else {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
      }
    }
    
    // Draw bubbles without movement
    for (let i = 0; i < ideas.length; i++) {
      const a = ideas[i];
      
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      const shape = a.shape || 'circle';
      const heightRatio = a.heightRatio || 1.0;
      drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
      ctx.clip();

      if (a.image) {
        const src = a.image;
        
        if (loadedImages[src] && loadedImages[src].complete) {
          try {
            const img = loadedImages[src];
            const maxW = a.radius * 2;
            const maxH = a.radius * 2;
            const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
            const drawW = img.naturalWidth * scale;
            const drawH = img.naturalHeight * scale;
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          } catch (error) {
            logger.error("❌ Error drawing image for bubble:", { title: a.title, error: error });
            a.image = null;
          }
        } else {
          if (!loadedImages[src]) {
            const img = new Image();
            img.onload = () => {
              loadedImages[src] = img;
            };
            img.onerror = () => {
              logger.error("❌ Failed to load image:", { src: src });
              a.image = null;
            };
            img.src = src;
          }
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fill();
        }
      } else {
        if (a.transparent) {
          ctx.fillStyle = "rgba(255,255,255,0.1)";
        } else if (a.animateColors) {
          ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
        } else {
          ctx.fillStyle = a.color || "white";
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = a.color || "white";
        ctx.fill();
      }

      ctx.restore();

      if (a.glow) {
        ctx.save();
        ctx.translate(a.x, a.y);
        if (a.rotation) {
          ctx.rotate((a.rotation * Math.PI) / 180);
        }
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = a.color || "white";
        ctx.fillStyle = a.color || "white";
        drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
        ctx.fill();
        
        ctx.restore();
      }

      if (a.title && a.title.trim() !== "") {
        ctx.save();
        ctx.translate(a.x, a.y);
        if (a.rotation) {
          ctx.rotate((a.rotation * Math.PI) / 180);
        }
        
        ctx.font = `${a.fontSize || 14}px ${a.font || fonts[0]}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = a.textColor || "white";
        
        const words = a.title.split(" ");
        const lineHeight = a.fontSize || 14;
        let y = -lineHeight * (words.length - 1) / 2;
        
        for (let word of words) {
          ctx.fillText(word, 0, y);
          y += lineHeight;
        }
        
        ctx.restore();
      }
    }
    
    // Flash effect: smooth fade from 0 to 100% and back repeatedly
    const cycleTime = 600; // Complete cycle every 600ms (0->100->0)
    const timeInCycle = Date.now() % cycleTime; // Position in current cycle (0-599)
    const flashOpacity = Math.abs(Math.sin((timeInCycle / cycleTime) * Math.PI)); // 0.0 to 1.0 to 0.0 using absolute value
    
    // Only draw existing drawings (not the current drawing action)
    if (flashOpacity > 0.01) { // Small threshold to avoid drawing when opacity is very low
      // Draw all completed paths from drawingPaths array
      for (let i = 0; i < drawingPaths.length; i++) {
        const path = drawingPaths[i];
        const pathColor = path.color || drawingColor;
        const pathWidth = path.width || drawingWidth;
        ctx.save();
        ctx.globalAlpha = flashOpacity; // Apply opacity only to this stroke
        strokeSmoothPath(path, pathColor, pathWidth, flashOpacity);
        ctx.restore();
      }
    }
    
    // Redraw the current drawing line on top (if actively drawing)
    if (isDrawing && drawingPath.length > 1) {
      ctx.save();
      strokeSmoothPath(drawingPath, drawingColor, drawingWidth, 1);
      
      ctx.restore();
    }
    
    flashAnimationId = setTimeout(flashLoop, 100);
  }
  
  flashLoop();
}

function stopExistingDrawingsFlash() {
  if (flashAnimationId) {
    clearTimeout(flashAnimationId);
    flashAnimationId = null;
    logger.info('⚡ Existing drawings flash animation stopped');
  }
}

// Convenience aliases for flashing the current drawn line arrays (distinct from bubble flashing)
function toggleDrawingsFlash() {
  toggleDrawingFlash();
}

function startDrawingsFlash() {
  if (!existingDrawingsFlash) existingDrawingsFlash = true;
  startExistingDrawingsFlash();
}

function stopDrawingsFlash() {
  if (existingDrawingsFlash) existingDrawingsFlash = false;
  stopExistingDrawingsFlash();
}

function redrawAllDrawings() {
  // Redraw all drawing paths with their original colors
  for (let i = 0; i < drawingPaths.length; i++) {
    const path = drawingPaths[i];
    const pathColor = path.color || drawingColor;
    const pathWidth = path.width || drawingWidth;
    
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    
    for (let j = 1; j < path.length; j++) {
      ctx.lineTo(path[j].x, path[j].y);
    }
    
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = pathWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function toggleExistingDrawingsFlash() {
  existingDrawingsFlash = !existingDrawingsFlash;
  
  if (existingDrawingsFlash) {
    logger.info('✨ Existing drawings flash activated');
    startExistingDrawingsFlash();
  } else {
    logger.info('✨ Existing drawings flash deactivated');
    stopExistingDrawingsFlash();
    // Redraw without flash effect
    ctx.clearRect(0, 0, width, height);
    
    // Redraw background and bubbles normally
    const wasDrawingMode = isDrawingMode;
    isDrawingMode = false;
    draw(); // This draws background and bubbles normally
    isDrawingMode = wasDrawingMode;
    
    redrawAllDrawings();
  }
}

function toggleDrawingGlow() {
  drawingGlow = !drawingGlow;
  
  if (drawingGlow) {
    logger.info('✨ Drawing glow activated');
    startDrawingGlow();
  } else {
    logger.info('✨ Drawing glow deactivated');
    stopDrawingGlow();
    // Redraw without glow effect
    clearDrawingVisually();
    redrawAllDrawings();
  }
}

function startDrawingGlow() {
  if (drawingGlowAnimationId) return;
  
  function glowLoop() {
    if (!drawingGlow) return;
    
    // Clear the entire canvas first
    ctx.clearRect(0, 0, width, height);
    
    // Redraw background and bubbles without movement calculations
    // Draw background
    if (backgroundImage) {
      if (backgroundRotation !== 0) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((backgroundRotation * Math.PI) / 180);
        const maxDimension = Math.max(width, height);
        const scaleX = width / backgroundImage.width;
        const scaleY = height / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY) * 1.2;
        
        const scaledWidth = backgroundImage.width * scale;
        const scaledHeight = backgroundImage.height * scale;
        
        ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
      } else {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
      }
    }
    
    // Draw bubbles without movement
    for (let i = 0; i < ideas.length; i++) {
      const a = ideas[i];
      
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      const shape = a.shape || 'circle';
      const heightRatio = a.heightRatio || 1.0;
      drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
      ctx.clip();

      if (a.image) {
        const src = a.image;
        
        if (loadedImages[src] && loadedImages[src].complete) {
          try {
            const img = loadedImages[src];
            const maxW = a.radius * 2;
            const maxH = a.radius * 2;
            const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
            const drawW = img.naturalWidth * scale;
            const drawH = img.naturalHeight * scale;
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          } catch (error) {
            logger.error("❌ Error drawing image for bubble:", { title: a.title, error: error });
            a.image = null;
          }
        } else {
          if (!loadedImages[src]) {
            const img = new Image();
            img.onload = () => {
              loadedImages[src] = img;
            };
            img.onerror = () => {
              logger.error("❌ Failed to load image:", { src: src });
              a.image = null;
            };
            img.src = src;
          }
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fill();
        }
      } else {
        if (a.transparent) {
          ctx.fillStyle = "rgba(255,255,255,0.1)";
        } else if (a.animateColors) {
          ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
        } else {
          ctx.fillStyle = a.color || "white";
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = a.color || "white";
        ctx.fill();
      }

      ctx.restore();

      if (a.glow) {
        ctx.save();
        ctx.translate(a.x, a.y);
        if (a.rotation) {
          ctx.rotate((a.rotation * Math.PI) / 180);
        }
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = a.color || "white";
        ctx.fillStyle = a.color || "white";
        drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
        ctx.fill();
        
        ctx.restore();
      }

      if (a.title && a.title.trim() !== "") {
        ctx.save();
        ctx.translate(a.x, a.y);
        if (a.rotation) {
          ctx.rotate((a.rotation * Math.PI) / 180);
        }
        
        ctx.font = `${a.fontSize || 14}px ${a.font || fonts[0]}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = a.textColor || "white";
        
        const words = a.title.split(" ");
        const lineHeight = a.fontSize || 14;
        let y = -lineHeight * (words.length - 1) / 2;
        
        for (let word of words) {
          ctx.fillText(word, 0, y);
          y += lineHeight;
        }
        
        ctx.restore();
      }
    }
    
    // Draw all existing drawings with glow effect
    for (let i = 0; i < drawingPaths.length; i++) {
      const path = drawingPaths[i];
      const pathColor = path.color || drawingColor;
      const pathWidth = path.width || drawingWidth;
      
      // Save context state
      ctx.save();
      
      // Apply glow effect (similar to bubble glow)
      ctx.shadowBlur = 15;
      ctx.shadowColor = pathColor;
      
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      
      for (let j = 1; j < path.length; j++) {
        ctx.lineTo(path[j].x, path[j].y);
      }
      
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = pathWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Restore context state
      ctx.restore();
    }
    
    // Redraw the current drawing line on top (if actively drawing)
    if (isDrawing && drawingPath.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(drawingPath[0].x, drawingPath[0].y);
      
      for (let i = 1; i < drawingPath.length; i++) {
        ctx.lineTo(drawingPath[i].x, drawingPath[i].y);
      }
      
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = drawingWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      ctx.restore();
    }
    
    drawingGlowAnimationId = setTimeout(glowLoop, 50);
  }
  
  glowLoop();
}

function stopDrawingGlow() {
  if (drawingGlowAnimationId) {
    clearTimeout(drawingGlowAnimationId);
    drawingGlowAnimationId = null;
    logger.info('✨ Drawing glow animation stopped');
  }
}

function debugDrawingPaths() {
  logger.debug('🔍 Debugging drawing paths:');
  logger.debug('📊 Total paths:', drawingPaths.length);
  for (let i = 0; i < drawingPaths.length; i++) {
    const path = drawingPaths[i];
    logger.debug(`  Path ${i}: color=${path.color}, width=${path.width}, points=${path.length}`);
  }
}

function smoothLastLine() {
  if (drawingPaths.length === 0) {
    logger.warn('⚠️ No lines to smooth');
    return;
  }
  
  const lastPath = drawingPaths[drawingPaths.length - 1];
  if (!lastPath || lastPath.length < 3) {
    logger.warn('⚠️ Last line too short to smooth');
    return;
  }
  
  // Store original color and width from the last path
  const originalColor = lastPath.color || drawingColor;
  const originalWidth = lastPath.width || drawingWidth;
  
  logger.info('🔄 Smoothing last line with', lastPath.length, 'points');
  logger.info('🎨 Original color:', originalColor, 'width:', originalWidth);
  
  // Create smoothed version of the last path
  const smoothedPath = smoothPath(lastPath);
  
  // Replace the last path with smoothed version, preserving color and width
  smoothedPath.color = originalColor;
  smoothedPath.width = originalWidth;
  drawingPaths[drawingPaths.length - 1] = smoothedPath;
  
  // Force a complete redraw to show the smoothed line properly
  // Clear the canvas and redraw everything
  ctx.clearRect(0, 0, width, height);
  
  // Redraw background
  if (backgroundImage) {
    if (backgroundRotation !== 0) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((backgroundRotation * Math.PI) / 180);
      const scaleX = width / backgroundImage.width;
      const scaleY = height / backgroundImage.height;
      const scale = Math.max(scaleX, scaleY) * 1.2;
      
      const scaledWidth = backgroundImage.width * scale;
      const scaledHeight = backgroundImage.height * scale;
      
      ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
    } else {
      ctx.drawImage(backgroundImage, 0, 0, width, height);
    }
  }
  
  // Redraw all bubbles exactly as they should be
  for (let i = 0; i < ideas.length; i++) {
    const a = ideas[i];
    
    // Draw glow effects exactly like the main draw loop
    if (a.glow === true) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      const glowColor = a.glowColor || a.color || "white";
      
      ctx.globalAlpha = 0.8;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 25;
      ctx.beginPath();
              if (a.shape === 'goal') {
          // Rectangular glow for goals
          const goalWidth = a.radius * 0.5; // 0.5:1 ratio
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2 - 3, -goalHeight/2 - 3, goalWidth + 6, goalHeight + 6);
        } else {
          // Circular glow for other shapes
          ctx.arc(0, 0, a.radius + 3, 0, Math.PI * 2);
        }
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Outer rectangular glow for goals
          const goalWidth = a.radius * 0.5; // 0.5:1 ratio
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2 - 5, -goalHeight/2 - 5, goalWidth + 10, goalHeight + 10);
        } else {
          // Outer circular glow for other shapes
          ctx.arc(0, 0, a.radius + 5, 0, Math.PI * 2);
        }
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Draw the main bubble
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    
    const shape = a.shape || 'circle';
    const heightRatio = a.heightRatio || 1.0;
    drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
    ctx.clip();

    if (a.image) {
      const src = a.image;
      if (loadedImages[src] && loadedImages[src].complete) {
        try {
          const img = loadedImages[src];
          const maxW = a.radius * 2;
          const maxH = a.radius * 2;
          const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } catch (error) {
          logger.error("❌ Error drawing image for bubble:", a.title, "Error:", error);
          a.image = null;
        }
      } else {
        // If image is loading, show placeholder
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }
    } else {
      if (a.transparent) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
      } else if (a.animateColors) {
        ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
      } else {
        ctx.fillStyle = a.color || "white";
      }
      
      // Apply shadow for non-glow bubbles
      if (a.glow !== true) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = a.color || "white";
      }
      
      ctx.fill();
    }
    ctx.restore();

    // Draw text on top
    if (a.title && a.title.trim() !== "") {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      // Use the exact same font handling as the main draw loop
      const fontSize = a.fontSize || 14;
      const fontFamily = a.font || fonts[0];
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = a.textColor || "white";
      
      // Handle multi-line text properly
      const words = a.title.split(" ");
      const lineHeight = fontSize;
      let y = -lineHeight * (words.length - 1) / 2;
      
      for (let word of words) {
        ctx.fillText(word, 0, y);
        y += lineHeight;
      }
      ctx.restore();
    }
  }
  
  // Redraw all drawing paths including the smoothed one with anti-jagged stroke
  for (let i = 0; i < drawingPaths.length; i++) {
    const path = drawingPaths[i];
    const pathColor = path.color || drawingColor;
    const pathWidth = path.width || drawingWidth;
    strokeSmoothPath(path, pathColor, pathWidth, 1);
  }
  
  logger.info('✅ Last line smoothed and immediately visible');
}

function smoothPath(path) {
  if (path.length < 3) return path;
  
  const smoothed = [];
  const tension = 0.3; // Smoothing factor
  
  // Add first point
  smoothed.push({ x: path[0].x, y: path[0].y });
  
  // Smooth intermediate points
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];
    
    // Calculate smoothed point
    const smoothedX = curr.x + (prev.x + next.x - 2 * curr.x) * tension * 0.3;
    const smoothedY = curr.y + (prev.y + next.y - 2 * curr.y) * tension * 0.3;
    
    smoothed.push({ x: smoothedX, y: smoothedY });
  }
  
  // Add last point
  smoothed.push({ x: path[path.length - 1].x, y: path[path.length - 1].y });
  
  return smoothed;
}

function drawPath(path) {
  if (path.length < 2) return;
  
  // Use a smoother stroke to reduce jagged edges
  const pathColor = path.color || drawingColor;
  const pathWidth = path.width || drawingWidth;
  strokeSmoothPath(path, pathColor, pathWidth, 1);
}

// Smoothly stroke a polyline using quadratic curves and safe canvas settings
function strokeSmoothPath(points, color, width, alpha) {
  if (!points || points.length < 2) return;
  
  const pLen = points.length;
  const path2D = new Path2D();
  
  // Build a smooth path using midpoint quadratic curves
  path2D.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < pLen - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path2D.quadraticCurveTo(current.x, current.y, midX, midY);
  }
  // Ensure we finish at the last point
  path2D.lineTo(points[pLen - 1].x, points[pLen - 1].y);
  
  ctx.save();
  // Eliminate any unintended glow/shadow artifacts
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  // Improve joins and avoid spikes
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.miterLimit = 2;
  // Apply style
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha != null ? alpha : 1;
  ctx.stroke(path2D);
  ctx.restore();
}

function changeDrawingColor() {
  const colors = [
    '#FF3131', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', 
    '#FFA500', '#800080', '#008000', '#000080', '#FFD700', '#FF69B4',
    '#32CD32', '#FF4500', '#8A2BE2', '#00CED1', '#FF1493', '#32CD32',
    '#FF6347', '#9370DB', '#20B2AA', '#FFB6C1', '#DDA0DD', '#98FB98',
    '#F0E68C', '#FFA07A', '#87CEEB', '#DDA0DD', '#90EE90', '#F0E68C'
  ];
  const currentIndex = colors.indexOf(drawingColor);
  const nextIndex = (currentIndex + 1) % colors.length;
  drawingColor = colors[nextIndex];
  
  // Update all UI elements
  updateDrawingColorUI();
  
  logger.info('🎨 Drawing color changed to:', drawingColor);
}

function changeDrawingWidth() {
  const widths = [1, 2, 3, 4, 5, 8, 12, 16, 20];
  const currentIndex = widths.indexOf(drawingWidth);
  const nextIndex = (currentIndex + 1) % widths.length;
  drawingWidth = widths[nextIndex];
  
  // Update all UI elements
  updateDrawingWidthUI();
  
  logger.info('📏 Drawing width changed to:', drawingWidth);
}

// Test function to verify drawing is working
function testDrawing() {
  logger.info('🧪 Testing drawing functionality...');
  logger.info('🎨 Current drawing color:', drawingColor);
  logger.info('📏 Current drawing width:', drawingWidth);
  logger.info('✏️ Drawing mode:', isDrawingMode);
  logger.info('🎯 Canvas context:', ctx);
  logger.info('🎨 Canvas z-index:', canvas.style.zIndex || 'default');
  
  // Check computed z-index
  const computedStyle = window.getComputedStyle(canvas);
  logger.info('🎨 Computed canvas z-index:', computedStyle.zIndex);
  
  // Check video player z-index
  const videoPlayer = document.getElementById('videoPlayer');
  if (videoPlayer) {
    const videoComputedStyle = window.getComputedStyle(videoPlayer);
    logger.info('🎥 Video player z-index:', videoComputedStyle.zIndex);
  }
  
  // Draw a test line
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(200, 200);
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  
  logger.info('✅ Test line drawn from (100,100) to (200,200)');
  logger.info('🎯 Check if red line appears on screen');
}

// ===== DRAWING SETTINGS PANEL FUNCTIONS =====

function showDrawingSettings(e) {
  if (!isDrawingMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const panel = document.getElementById('drawingSettingsPanel');
  const colorSelect = document.getElementById('drawingColorSelect');
  const widthSelect = document.getElementById('drawingWidthSelect');
  
  // Set current values
  colorSelect.value = drawingColor;
  widthSelect.value = drawingWidth;
  
  // Position panel near mouse
  panel.style.left = e.clientX + 'px';
  panel.style.top = e.clientY + 'px';
  panel.style.display = 'block';
  
  logger.info('🎨 Drawing settings panel opened');
}

function closeDrawingSettings() {
  const panel = document.getElementById('drawingSettingsPanel');
  panel.style.display = 'none';
  logger.info('🎨 Drawing settings panel closed');
}

function setDrawingColor(color) {
  drawingColor = color;
  
  // Update all UI elements
  updateDrawingColorUI();
  
  logger.info('🎨 Drawing color set to:', color);
}

function setDrawingWidth(width) {
  drawingWidth = width;
  
  // Update all UI elements
  updateDrawingWidthUI();
  
  logger.info('📏 Drawing width set to:', width);
}

function updateDrawingColorUI() {
  // Update toolbar dropdown
  const colorDropdown = document.getElementById('drawingColorDropdown');
  if (colorDropdown) {
    colorDropdown.value = drawingColor;
  }
  
  // Update drawing settings panel dropdown
  const colorSelect = document.getElementById('drawingColorSelect');
  if (colorSelect) {
    colorSelect.value = drawingColor;
  }
}

function updateDrawingWidthUI() {
  // Update toolbar dropdown
  const widthDropdown = document.getElementById('drawingWidthDropdown');
  if (widthDropdown) {
    widthDropdown.value = drawingWidth;
  }
  
  // Update drawing settings panel dropdown
  const widthSelect = document.getElementById('drawingWidthSelect');
  if (widthSelect) {
    widthSelect.value = drawingWidth;
  }
}

function clearDrawingFromPanel() {
  // Clear the visual canvas
  clearDrawingOnly();
  
  // Actually remove all drawing paths from the array
  drawingPaths = [];
  
  // Stop flash animation if it's running
  if (existingDrawingsFlash) {
    stopExistingDrawingsFlash();
  }
  
  closeDrawingSettings();
  logger.info('🧹 All drawings cleared from panel and paths array emptied');
}

function switchToBubbleMode() {
  // Exit drawing mode while preserving drawings
  isDrawingMode = false;
  
  // Restore animation speed
  speedMultiplier = previousSpeed;
  
  // Update UI
  canvas.classList.remove('drawing-mode');
  canvas.style.cursor = 'default';
  
  // Stop flash animation if running
  if (existingDrawingsFlash) {
    stopExistingDrawingsFlash();
    existingDrawingsFlash = false;
  }
  
  // Close drawing settings panel
  closeDrawingSettings();
  
  // Update draw button to show inactive state
  const drawButton = document.querySelector('[data-icon="draw"]');
  if (drawButton && typeof PNGLoader !== 'undefined') {
    PNGLoader.applyPNG(drawButton, 'draw.png');
  }
  
  // Resume normal canvas drawing (bubbles will be drawn again)
  logger.info('🫧 Switched to bubble mode - drawings preserved');
  logger.info('📊 Preserved', drawingPaths.length, 'drawing paths');
}

function clearDrawingsOnRightClick(event) {
  event.preventDefault(); // Prevent default context menu
  
  // Clear only the drawings (like the panel button does)
  clearDrawingOnly();
  drawingPaths = [];
  
  // Stop flash animation if running
  if (existingDrawingsFlash) {
    stopExistingDrawingsFlash();
    existingDrawingsFlash = false;
  }
  
  logger.info('🧹 All drawings cleared via right-click on toggle button');
  
  // Show a brief visual feedback
  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = '🧹';
  button.style.background = 'linear-gradient(45deg, #f44336, #da190b)';
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.background = 'linear-gradient(45deg, #FF6B6B, #FF8E53)';
  }, 500);
}

let drawingSettingsFadeTimeout = null;

function handleDrawButtonRightClick(event) {
  event.preventDefault(); // Prevent default context menu
  event.stopPropagation();
  
  if (isDrawingMode) {
    // If drawing mode is active, show drawing settings
    showDrawingSettingsOnRightClick(event);
  } else {
    // If drawing mode is not active, clear drawings
    clearDrawingOnly();
    logger.info('🎨 Drawings cleared via right-click on draw button');
  }
  
  return false; // Ensure context menu doesn't show
}

function showDrawingSettingsOnRightClick(event) {
  event.preventDefault(); // Prevent default context menu
  event.stopPropagation();
  
  const panel = document.getElementById('drawingSettingsPanel');
  const colorSelect = document.getElementById('drawingColorSelect');
  const widthSelect = document.getElementById('drawingWidthSelect');
  
  // Toggle panel visibility if already visible
  if (panel && panel.style.display === 'block') {
    hideDrawingSettingsPanel();
    return false;
  }
  
  // Update all UI elements to ensure synchronization
  updateDrawingColorUI();
  updateDrawingWidthUI();
  
  // Position panel at the x-coordinate of the draw button
  if (panel) {
    const drawButton = event.target;
    const buttonRect = drawButton.getBoundingClientRect();
    
    // Position panel at button's x-position
    panel.style.position = 'fixed';
    panel.style.left = buttonRect.left + 'px';
    panel.style.top = (buttonRect.bottom + 10) + 'px'; // 10px below button
    panel.style.display = 'block';
    panel.style.zIndex = '10000';
    panel.style.opacity = '1';
    
    logger.info('🎨 Drawing settings panel opened at button position');
    
    // Clear any existing timeout
    if (drawingSettingsFadeTimeout) {
      clearTimeout(drawingSettingsFadeTimeout);
    }
    
    // Set fade-out timeout for 10 seconds
    drawingSettingsFadeTimeout = setTimeout(() => {
      fadeOutDrawingSettingsPanel();
    }, 10000);
  }
  
  return false; // Ensure context menu doesn't show
}

function hideDrawingSettingsPanel() {
  const panel = document.getElementById('drawingSettingsPanel');
  if (panel) {
    panel.style.display = 'none';
    if (drawingSettingsFadeTimeout) {
      clearTimeout(drawingSettingsFadeTimeout);
      drawingSettingsFadeTimeout = null;
    }
    logger.info('🎨 Drawing settings panel hidden');
  }
}

function fadeOutDrawingSettingsPanel() {
  const panel = document.getElementById('drawingSettingsPanel');
  if (panel && panel.style.display === 'block') {
    // Fade out animation
    panel.style.transition = 'opacity 1s ease-out';
    panel.style.opacity = '0';
    
    // Hide after fade completes
    setTimeout(() => {
      panel.style.display = 'none';
      panel.style.transition = '';
      drawingSettingsFadeTimeout = null;
      logger.info('🎨 Drawing settings panel faded out');
    }, 1000);
  }
}

let analysisPanelFadeTimeout = null;
window.analysisPanelFadeTimeout = analysisPanelFadeTimeout;

// Suggestions button cooldown
let suggestionsCooldownActive = false;
let suggestionsCooldownTimer = null;

// Ideas button cooldown
let ideasCooldownActive = false;
let ideasCooldownTimer = null;

function toggleAnalysisPanel() {
  const panel = document.getElementById('analysisPanel');
  const analysisButton = document.querySelector('[data-icon="analysis"]');
  
  if (panel) {
    if (panel.style.display === 'block') {
      hideAnalysisPanel();
    } else {
      showAnalysisPanel();
    }
  }
}

function showAnalysisPanel() {
  const panel = document.getElementById('analysisPanel');
  const analysisButton = document.querySelector('[data-icon="analysis"]');
  
  if (panel && analysisButton) {
    // Position panel under the analysis button
    const buttonRect = analysisButton.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.left = buttonRect.left + 'px';
    panel.style.top = (buttonRect.bottom + 10) + 'px';
    panel.style.display = 'block';
    panel.style.opacity = '1';
    panel.style.zIndex = '29999';
    
    logger.info('📊 Analysis panel opened under button');
    
    // Apply analysis.png to button
    if (typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(analysisButton, 'analysis.png');
    }
    
    // Clear any existing timeout
    if (window.analysisPanelFadeTimeout) {
      clearTimeout(window.analysisPanelFadeTimeout);
    }
    
    // Set fade-out timeout for 30 seconds
    window.analysisPanelFadeTimeout = setTimeout(() => {
      fadeOutAnalysisPanel();
    }, 30000);
    analysisPanelFadeTimeout = window.analysisPanelFadeTimeout;
  }
}

function hideAnalysisPanel() {
  const panel = document.getElementById('analysisPanel');
  const analysisButton = document.querySelector('[data-icon="analysis"]');
  
  if (panel) {
    panel.style.display = 'none';
    if (window.analysisPanelFadeTimeout) {
      clearTimeout(window.analysisPanelFadeTimeout);
      window.analysisPanelFadeTimeout = null;
      analysisPanelFadeTimeout = null;
    }
    logger.info('📊 Analysis panel closed');
  }
  
  // Reset button to default state
  if (analysisButton && typeof PNGLoader !== 'undefined') {
    PNGLoader.applyPNG(analysisButton, 'analysis.png');
  }
}

function fadeOutAnalysisPanel() {
  const panel = document.getElementById('analysisPanel');
  if (panel && panel.style.display === 'block') {
    // Fade out animation
    panel.style.opacity = '0';
    
    // Hide after fade completes
    setTimeout(() => {
      panel.style.display = 'none';
      window.analysisPanelFadeTimeout = null;
      analysisPanelFadeTimeout = null;
      logger.info('📊 Analysis panel faded out');
    }, 1000);
  }
}

function closeAnalysisPanel() {
  hideAnalysisPanel();
}

function setCreditsDropdowns() {
  // Set theme dropdown to "credits" (💚)
  const themeSelector = document.getElementById('themeSelector');
  if (themeSelector) {
    themeSelector.value = 'credits';
    // Trigger the change event to actually switch the theme
    switchTheme('credits');
  }
  
  // Set preset dropdown to "start" 
  const presetSelector = document.getElementById('presetSelector');
  if (presetSelector) {
    // Wait a moment for theme to load, then set preset
    setTimeout(() => {
      presetSelector.value = 'start';
      // Trigger the change event to actually switch the preset
      switchPreset('start');
    }, 100);
  }
  
  // Close the analysis panel after setting dropdowns
  closeAnalysisPanel();
  
  logger.info('💚 Credits: Set theme to 💚 and preset to Start');
}

function openAnalysisIframe(type) {
  // Special handling for credits - set dropdowns instead of opening iframe
  if (type === 'credits') {
    setCreditsDropdowns();
    return;
  }
  
  // Check for suggestions cooldown
  if (type === 'suggestions' && suggestionsCooldownActive) {
    logger.info('💡 Suggestions button is on cooldown');
    return;
  }
  
  // Check for ideas cooldown
  if (type === 'ideas' && ideasCooldownActive) {
    logger.info('🧠 Ideas button is on cooldown');
    return;
  }
  
  const container = document.getElementById('analysisIframeContainer');
  const iframe = document.getElementById('analysisIframe');
  
  if (container && iframe) {
    // Set the iframe source based on type
    if (type === 'suggestions') {
      iframe.src = 'https://jannerap.github.io/Trailers/';
      
      // Start cooldown for suggestions
      startSuggestionsCooldown();
    } else if (type === 'ideas') {
      iframe.src = 'https://jannerap.github.io/Trailers/All/';
      
      // Start cooldown for ideas button
      startIdeasCooldown();
    } else {
      iframe.src = 'https://ajanner.com';
    }
    
    // Add onload event to ensure iframe content fits properly
    iframe.onload = function() {
      // Force iframe to respect container dimensions
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      
      // Try to send a message to the iframe to request proper scaling
      try {
        iframe.contentWindow.postMessage({
          type: 'resize',
          width: container.offsetWidth - 40, // Account for padding
          height: container.offsetHeight - 40
        }, '*');
      } catch (e) {
        // Ignore CORS errors
        logger.debug('Could not send resize message to iframe (CORS restriction)');
      }
      
      logger.info('📊 Analysis iframe loaded and sized for:', type);
    };
    
    // Show the container
    container.style.display = 'block';
    
    // Auto-close after 5 minutes (300,000 milliseconds)
    setTimeout(() => {
      if (container.style.display === 'block') {
        closeAnalysisIframe();
        logger.info('📊 Analysis iframe auto-closed after 5 minutes');
      }
    }, 300000);
    
    logger.info('📊 Analysis iframe opened for:', type);
  }
}

function closeAnalysisIframe() {
  const container = document.getElementById('analysisIframeContainer');
  const iframe = document.getElementById('analysisIframe');
  
  if (container && iframe) {
    // Clear the iframe source
    iframe.src = '';
    
    // Hide the container
    container.style.display = 'none';
    
    logger.info('📊 Analysis iframe closed');
  }
}

// Suggestions button cooldown functions
function startSuggestionsCooldown() {
  if (suggestionsCooldownActive) return;
  
  suggestionsCooldownActive = true;
  const suggestionsButton = document.querySelector('button[onclick*="suggestions"]');
  
  if (suggestionsButton) {
    // Visual feedback: disabled state
    suggestionsButton.style.opacity = '0.5';
    suggestionsButton.style.cursor = 'not-allowed';
    suggestionsButton.style.background = 'linear-gradient(45deg, #666, #444)';
    suggestionsButton.style.color = '#999';
    suggestionsButton.disabled = true;
    
    let timeLeft = 20;
    const originalText = suggestionsButton.textContent;
    
    // Update button text with countdown
    const countdownInterval = setInterval(() => {
      suggestionsButton.textContent = `🎞️Suggestions (${timeLeft}s)`;
      timeLeft--;
      
      if (timeLeft < 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    // Set cooldown timer
    suggestionsCooldownTimer = setTimeout(() => {
      endSuggestionsCooldown();
      clearInterval(countdownInterval);
    }, 20000);
    
    logger.info('💡 Suggestions cooldown started (20 seconds)');
  }
}

function endSuggestionsCooldown() {
  suggestionsCooldownActive = false;
  const suggestionsButton = document.querySelector('button[onclick*="suggestions"]');
  
  if (suggestionsButton) {
    // Visual feedback: enabled state
    suggestionsButton.style.opacity = '1';
    suggestionsButton.style.cursor = 'pointer';
    suggestionsButton.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
    suggestionsButton.style.color = 'white';
    suggestionsButton.disabled = false;
    suggestionsButton.innerHTML = 'Suggestions:<br>Anime (All)🍿';
    
    // Add brief visual indication that cooldown ended
    suggestionsButton.style.boxShadow = '0 0 10px #4CAF50';
    setTimeout(() => {
      suggestionsButton.style.boxShadow = '';
    }, 2000);
    
    logger.debugSparse('✅ Suggestions cooldown ended', null, 60);
  }
  
  if (suggestionsCooldownTimer) {
    clearTimeout(suggestionsCooldownTimer);
    suggestionsCooldownTimer = null;
  }
}

// Ideas button cooldown functions
function startIdeasCooldown() {
  if (ideasCooldownActive) return;
  
  ideasCooldownActive = true;
  const ideasButton = document.querySelector('button[onclick*="ideas"]');
  
  if (ideasButton) {
    // Visual feedback: disabled state
    ideasButton.style.opacity = '0.5';
    ideasButton.style.cursor = 'not-allowed';
    ideasButton.style.background = 'linear-gradient(45deg, #666, #444)';
    ideasButton.style.color = '#999';
    ideasButton.disabled = true;
    
    // Show countdown timer
    let countdown = 20;
    ideasButton.innerHTML = `🎬 Ideas:<br>Cooldown: ${countdown}s`;
    
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        ideasButton.innerHTML = `🎬 Ideas:<br>Cooldown: ${countdown}s`;
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    // Set cooldown timer
    ideasCooldownTimer = setTimeout(() => {
      endIdeasCooldown();
      clearInterval(countdownInterval);
    }, 20000);
    
    logger.info('🧠 Ideas cooldown started (20 seconds)');
  }
}

function endIdeasCooldown() {
  ideasCooldownActive = false;
  const ideasButton = document.querySelector('button[onclick*="ideas"]');
  
  if (ideasButton) {
    // Visual feedback: enabled state
    ideasButton.style.opacity = '1';
    ideasButton.style.cursor = 'pointer';
    ideasButton.style.background = 'linear-gradient(45deg, #2196F3, #1976D2)';
    ideasButton.style.color = 'white';
    ideasButton.disabled = false;
    ideasButton.innerHTML = '🎞️ Ideas:<br>FilmTV (All)';
    
    // Flash effect to indicate cooldown ended
    setTimeout(() => {
      if (ideasButton) {
        ideasButton.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        setTimeout(() => {
          if (ideasButton) {
            ideasButton.style.background = 'linear-gradient(45deg, #2196F3, #1976D2)';
          }
        }, 500);
      }
    }, 2000);
    
    logger.debugSparse('✅ Ideas cooldown ended', null, 60);
  }
  
  if (ideasCooldownTimer) {
    clearTimeout(ideasCooldownTimer);
    ideasCooldownTimer = null;
  }
}


function resize() {
  // High-DPI rendering for crisper images (Retina/4K etc.)
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;

  // Set CSS size for layout
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';

  // Set backing store size for resolution
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  // Use logical coordinates in CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Prefer high quality resampling when scaling images
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  } catch (_) {}

  // App-level logical width/height remain in CSS pixels
  width = cssW;
  height = cssH;
}

// ===== IDEA MANAGEMENT =====

function addIdea(x, y, title = "", description = "", color = randomColor(), textColor = "white", radius = 80) {
  // On touch devices, default to half-size bubbles for easier layout
  try {
    const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    if (isTouch && radius && typeof radius === 'number') {
      radius = Math.max(10, Math.round(radius / 2));
    }
  } catch (_) {}
  const maxSpeed = 3;
  const bubbleColor = color || randomColor();
  
  // Get current date and time
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS format
  
  // Generate initial velocity
  let vx = (Math.random() * 2 - 1) * maxSpeed;
  let vy = (Math.random() * 2 - 1) * maxSpeed;
  
  ideas.push({ 
    title, 
    description, 
    x, 
    y, 
    vx, 
    vy, 
    color: bubbleColor, 
    textColor, 
    radius, 
    font: fonts[0],
    shape: 'circle',
    heightRatio: 1.0,
    glow: false,
    flash: false,
    animateColors: false,
    transparent: false,
    glowColor: null,
    fixed: false,
    static: false,
    showPauseBorder: false,
    strikerVelocity: 5,
    createdDate: dateString,
    createdTime: timeString,
    // Goal properties
    goals: 0,
    flashUntil: 0,
    goalCooldown: 0, // 5-second cooldown between goals
    // Ball properties
    ballVelocityBoost: 0,
    ballVelocityDecay: 0
  });
  
  logger.debugSparse("🆕 New bubble created with color:", bubbleColor, "at", dateString, timeString, 120);
}

// ===== THEME SYSTEM =====

function switchTheme(themeName) {
  logger.debugSparse('🎨 Switching theme to:', themeName, null, 60);
  currentTheme = themeName;
  backgroundIndex = 1;
  
  const theme = themePresets[themeName];
  if (!theme) {
    logger.error('❌ Theme not found:', { themeName: themeName });
    return;
  }
  
  // Update preset selector
  updatePresetSelector(themeName);
  
  // Load first preset if available
  if (theme.presets) {
    const presetKeys = Object.keys(theme.presets);
    if (presetKeys.length > 0) {
      const firstPreset = presetKeys[0];
      switchPreset(firstPreset);
    }
  } else {
    // Fallback for old theme structure
    logger.info('📋 Loading theme ideas:', theme.ideas?.length || 0);
    if (theme.ideas) {
      ideas = theme.ideas.map(idea => ({
        ...idea,
        font: idea.font || fonts[0],
        radius: idea.radius || 80,
        shape: idea.shape || 'circle',
        heightRatio: idea.heightRatio || 1.0,
        showPauseBorder: idea.showPauseBorder || false,
        createdDate: idea.createdDate || new Date().toISOString().split('T')[0],
        createdTime: idea.createdTime || new Date().toTimeString().split(' ')[0]
      }));
      
      // Auto-focus on the last (most recently added) bubble
      if (ideas.length > 0) {
        selectedIdea = ideas[ideas.length - 1];
        logger.info('🎯 Auto-focused on last bubble from theme:', selectedIdea.title || 'Untitled');
      }
    }
    
    if (theme.bg) {
      loadBackgroundImage(theme.bg);
    }
  }
}

function updatePresetSelector(themeName) {
  const presetSelector = document.getElementById('presetSelector');
  if (!presetSelector) return;
  
  presetSelector.innerHTML = '<option value="">Preset 😇</option>';
  
  const theme = themePresets[themeName];
  if (theme && theme.presets) {
    Object.keys(theme.presets).forEach(presetKey => {
      const preset = theme.presets[presetKey];
      const option = document.createElement('option');
      option.value = presetKey;
      option.textContent = preset.name;
      presetSelector.appendChild(option);
    });
  }
}

function switchPreset(presetKey) {
  if (!presetKey || !currentTheme) return;
  
  const theme = themePresets[currentTheme];
  if (!theme || !theme.presets) return;
  
  const preset = theme.presets[presetKey];
  if (!preset) {
    logger.error('❌ Preset not found:', { presetKey: presetKey });
    return;
  }
  
  logger.info('📋 Loading preset:', preset.name, 'with', preset.ideas.length, 'ideas');
  
  // Load preset ideas
  ideas = preset.ideas.map(idea => ({
    ...idea,
    font: idea.font || fonts[0],
    radius: idea.radius || 80,
    shape: idea.shape || 'circle',
    heightRatio: idea.heightRatio || 1.0,
    showPauseBorder: idea.showPauseBorder || false,
    createdDate: idea.createdDate || new Date().toISOString().split('T')[0],
    createdTime: idea.createdTime || new Date().toTimeString().split(' ')[0],
    // Goal properties
    goals: idea.goals || 0,
    flashUntil: idea.flashUntil || 0,
    goalCooldown: idea.goalCooldown || 0,
    // Ball properties
    ballVelocityBoost: idea.ballVelocityBoost || 0,
    ballVelocityDecay: idea.ballVelocityDecay || 0
  }));
  
  // Auto-focus on the last (most recently added) bubble
  if (ideas && ideas.length > 0) {
    selectedIdea = ideas[ideas.length - 1];
    logger.info('🎯 Auto-focused on last bubble from preset:', selectedIdea.title || 'Untitled');
  }
  
  // Load preset background
  if (preset.bg) {
    loadBackgroundImage(preset.bg);
  }
}

function loadBackgroundImage(bgPath) {
  const img = new Image();
  img.onload = function () {
    backgroundImage = img;
    logger.info('🖼️ Background image loaded:', bgPath);
  };
  img.onerror = function() {
    logger.error('❌ Failed to load background image:', { bgPath: bgPath });
  };
  img.src = bgPath;
}

function cycleBackground() {
  backgroundIndex += 1;
  const img = new Image();
  img.onload = function () {
    backgroundImage = img;
  };
  img.onerror = function () {
    backgroundIndex = 1;
    img.src = `images/${currentTheme}1.png`;
  };
  img.src = `images/${currentTheme}${backgroundIndex}.png`;
}

function rotateBackground() {
  backgroundRotation = (backgroundRotation + 90) % 360;
  logger.info("🔄 Background rotated to:", backgroundRotation + "°");
}

// ===== PANEL MANAGEMENT =====

function showPanel() {
  if (!selectedIdea) return;
  
  document.getElementById("title").value = selectedIdea.title;
  document.getElementById("description").value = selectedIdea.description;
  document.getElementById("sizeSlider").value = selectedIdea.radius || 80;
  document.getElementById("fontSizeSlider").value = selectedIdea.fontSize || 14;
  document.getElementById("heightRatioSlider").value = selectedIdea.heightRatio || 1.0;
  document.getElementById("rotationSlider").value = selectedIdea.rotation || 0;
  document.getElementById("shapeSelector").value = selectedIdea.shape || 'circle';
  
  // Update action slider visibility and value
  updateActionSliderVisibility();
  
  // Set date and time fields
  document.getElementById("dateField").value = selectedIdea.createdDate || new Date().toISOString().split('T')[0];
  document.getElementById("timeField").value = selectedIdea.createdTime || new Date().toTimeString().split(' ')[0];
  
  // Update checkered border button state
  const checkeredBorderButtons = document.querySelectorAll('button[onclick="toggleCheckeredBorder()"]');
  checkeredBorderButtons.forEach(button => {
    if (selectedIdea.showPauseBorder) {
      button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
      button.style.color = "black";
    } else {
      button.style.background = "";
      button.style.color = "";
    }
  });
  
  // Update image selector
  if (selectedIdea.image) {
    if (selectedIdea.image.startsWith('data:')) {
      document.getElementById("imageSelector").value = "";
      const uploadInput = document.getElementById('uploadImage');
      uploadInput.style.border = '2px solid gold';
      uploadInput.title = "Custom image uploaded";
    } else {
      document.getElementById("imageSelector").value = selectedIdea.image;
      document.getElementById('uploadImage').style.border = '';
      document.getElementById('uploadImage').title = "Upload custom image";
    }
  } else {
    document.getElementById("imageSelector").value = "";
    document.getElementById('uploadImage').style.border = '';
    document.getElementById('uploadImage').title = "Upload custom image";
  }
  
  // Hook up audio upload UI
  const uploadAudio = document.getElementById('uploadAudio');
  if (uploadAudio) {
    uploadAudio.onchange = handleAudioUpload;
    if (selectedIdea.audio && selectedIdea.audio.url) {
      uploadAudio.title = 'Audio attached';
      const nameEl = document.getElementById('uploadAudioName');
      if (nameEl) nameEl.textContent = selectedIdea.audio.name || 'Attached audio';
    } else {
      uploadAudio.title = 'Attach audio to this bubble';
      const nameEl = document.getElementById('uploadAudioName');
      if (nameEl) nameEl.textContent = 'No file selected.';
    }
  }
  
  // Hook up attachments UI
  const uploadDocs = document.getElementById('uploadDocs');
  const attachmentsList = document.getElementById('attachmentsList');
  if (uploadDocs) {
    uploadDocs.onchange = handleDocsUpload;
  }
  if (!selectedIdea.attachments) {
    selectedIdea.attachments = [];
  }
  if (attachmentsList) {
    renderAttachmentsList(selectedIdea.attachments);
  }

  // Hook up URLs UI
  const urlList = document.getElementById('urlList');
  if (!selectedIdea.urls) selectedIdea.urls = [];
  if (urlList) renderUrlList(selectedIdea.urls);
  
  document.getElementById('panel').style.display = "block";
  resetPanelFade();
}

function savePanel() {
  if (!selectedIdea) return;
  
  const oldTitle = selectedIdea.title;
  selectedIdea.title = document.getElementById("title").value;
  selectedIdea.description = document.getElementById("description").value;
  selectedIdea.createdDate = document.getElementById("dateField").value;
  selectedIdea.createdTime = document.getElementById("timeField").value;
  selectedIdea.shape = document.getElementById("shapeSelector").value;
  selectedIdea.heightRatio = parseFloat(document.getElementById("heightRatioSlider").value);
  
  // Save striker velocity if it exists
  if (selectedIdea.shape === 'striker') {
    const actionSlider = document.getElementById('actionSlider');
    if (actionSlider) {
      selectedIdea.strikerVelocity = parseInt(actionSlider.value);
    }
  }
  
  document.getElementById('panel').style.display = "none";
  logger.info('💾 Bubble saved:', selectedIdea.title || 'Untitled', oldTitle !== selectedIdea.title ? `(renamed from "${oldTitle}")` : '');
}

function deleteIdea() {
  if (selectedIdea) {
    const deletedTitle = selectedIdea.title || 'Untitled';
    ideas = ideas.filter(idea => idea !== selectedIdea);
    selectedIdea = null;
    document.getElementById('panel').style.display = "none";
    logger.info('🗑️ Bubble deleted:', deletedTitle);
  }
}

function closePanel() { 
  document.getElementById('panel').style.display = "none"; 
  if (panelFadeTimeout) {
    clearTimeout(panelFadeTimeout);
    panelFadeTimeout = null;
  }
}

// ===== BUBBLE AUDIO FUNCTIONS =====
let currentBubbleAudio = null;
let currentBubbleAudioOwner = null;

function handleAudioUpload(event) {
  if (!selectedIdea) return;
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    if (selectedIdea.audio && selectedIdea.audio.url && selectedIdea.audio.isObjectUrl) {
      try { URL.revokeObjectURL(selectedIdea.audio.url); } catch (e) {}
    }
    const objectUrl = URL.createObjectURL(file);
    selectedIdea.audio = { url: objectUrl, name: file.name, isObjectUrl: true };
    const btn = document.getElementById('playBubbleAudioBtn');
    if (btn) btn.textContent = '▶︎';
    const nameEl = document.getElementById('uploadAudioName');
    if (nameEl) nameEl.textContent = file.name;
    logger.info('🎧 Audio attached to bubble:', file.name);
  } catch (e) {
    logger.error('❌ Failed to attach audio:', e && e.message ? e.message : e);
  } finally {
    if (event.target) event.target.value = '';
  }
}

async function playSelectedBubbleAudio() {
  if (!selectedIdea || !selectedIdea.audio || !selectedIdea.audio.url) {
    logger.warn('🎧 No audio attached to the selected bubble');
    return;
  }
  try {
    if (currentBubbleAudio) {
      currentBubbleAudio.pause();
      currentBubbleAudio = null;
      currentBubbleAudioOwner = null;
    }
    // Prefer file from session_uploads if present
    let urlToPlay = selectedIdea.audio.url;
    try {
      const baseName = selectedIdea.audio.name || selectedIdea.audio.originalName || '';
      if (baseName) {
        const candidate = `session_uploads/${baseName}`;
        try {
          const headRes = await fetch(candidate, { method: 'HEAD' });
          if (headRes && headRes.ok) {
            urlToPlay = candidate;
          }
        } catch (_) {}
      }
    } catch (_) {}

    const audio = new Audio(urlToPlay);
    audio.volume = 1.0;
    audio.onended = () => {
      const btn = document.getElementById('playBubbleAudioBtn');
      if (btn) btn.textContent = '▶︎';
      currentBubbleAudio = null;
      currentBubbleAudioOwner = null;
    };
    const btn = document.getElementById('playBubbleAudioBtn');
    if (btn && btn.textContent === '⏸') {
      audio.pause();
      btn.textContent = '▶︎';
      return;
    }
    audio.play().then(() => {
      currentBubbleAudio = audio;
      currentBubbleAudioOwner = selectedIdea;
      // flag owner as pulsing
      selectedIdea.pulseWithAudio = true;
      if (btn) btn.textContent = '⏸';
      logger.info('🎧 Playing bubble audio');
    }).catch(err => {
      logger.error('❌ Error playing bubble audio:', err && err.message ? err.message : err);
    });
  } catch (e) {
    logger.error('❌ playSelectedBubbleAudio failed:', e && e.message ? e.message : e);
  }
}

function stopSelectedBubbleAudio() {
  if (currentBubbleAudio) {
    try { currentBubbleAudio.pause(); } catch (e) {}
    currentBubbleAudio = null;
  }
  if (currentBubbleAudioOwner) {
    currentBubbleAudioOwner.pulseWithAudio = false;
    currentBubbleAudioOwner = null;
  }
  const btn = document.getElementById('playBubbleAudioBtn');
  if (btn) btn.textContent = '▶︎';
  logger.info('🎧 Bubble audio stopped');
}

function clearSelectedBubbleAudio() {
  if (!selectedIdea) return;
  try {
    if (currentBubbleAudio) {
      currentBubbleAudio.pause();
      currentBubbleAudio = null;
      currentBubbleAudioOwner = null;
    }
    if (selectedIdea.audio && selectedIdea.audio.url && selectedIdea.audio.isObjectUrl) {
      try { URL.revokeObjectURL(selectedIdea.audio.url); } catch (e) {}
    }
    selectedIdea.audio = null;
    const btn = document.getElementById('playBubbleAudioBtn');
    if (btn) btn.textContent = '▶︎';
    const uploadAudio = document.getElementById('uploadAudio');
    if (uploadAudio) uploadAudio.title = 'Attach audio to this bubble';
    const nameEl = document.getElementById('uploadAudioName');
    if (nameEl) nameEl.textContent = 'No file selected.';
    logger.info('🎧 Bubble audio cleared');
  } catch (e) {
    logger.error('❌ clearSelectedBubbleAudio failed:', e && e.message ? e.message : e);
  }
}

function handleDocsUpload(event) {
  if (!selectedIdea) return;
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  if (!selectedIdea.attachments) selectedIdea.attachments = [];
  files.forEach(file => {
    try {
      const objectUrl = URL.createObjectURL(file);
      selectedIdea.attachments.push({
        name: file.name,
        type: file.type || guessMimeType(file.name),
        url: objectUrl,
        originalName: file.name,
        isObjectUrl: true
      });
    } catch (_) {}
  });
  const list = document.getElementById('attachmentsList');
  if (list) renderAttachmentsList(selectedIdea.attachments);
  if (event.target) event.target.value = '';
}

function guessMimeType(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  return 'application/octet-stream';
}

function renderAttachmentsList(attachments) {
  const list = document.getElementById('attachmentsList');
  if (!list) return;
  list.innerHTML = '';
  attachments.forEach((att, index) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '6px';
    row.style.fontSize = '12px';
    row.style.color = '#ddd';

    const name = document.createElement('span');
    name.textContent = att.name;
    name.style.flex = '1';
    name.style.overflow = 'hidden';
    name.style.whiteSpace = 'nowrap';
    name.style.textOverflow = 'ellipsis';

    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'View';
    viewBtn.title = 'Open attachment';
    viewBtn.style.background = 'rgba(0,0,0,0.7)';
    viewBtn.style.color = 'white';
    viewBtn.style.border = 'none';
    viewBtn.style.borderRadius = '3px';
    viewBtn.style.padding = '2px 6px';
    viewBtn.style.cursor = 'pointer';
    viewBtn.style.fontSize = '11px';
    viewBtn.onclick = () => {
      try {
        // Handle object URLs that won't persist across sessions by data URL fallback
        const href = att.url;
        if (att.type && att.type.startsWith('video/')) {
          // Open a lightweight inline viewer in a new window/tab
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${att.name}</title></head><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;"><video src="${href}" controls autoplay style="max-width:100vw;max-height:100vh"></video></body></html>`;
          const win = window.open('', '_blank');
          if (win && win.document) {
            win.document.open();
            win.document.write(html);
            win.document.close();
          } else {
            window.open(href, '_blank');
          }
        } else if (att.type === 'text/csv') {
          // Render CSV in a minimal HTML table for quick view
          fetch(href).then(r => r.text()).then(text => {
            const rows = text.split(/\r?\n/).map(l => l.split(','));
            const table = rows.map(cells => `<tr>${cells.map(c => `<td style="border:1px solid #444;padding:4px;">${c.replace(/</g,'&lt;')}</td>`).join('')}</tr>`).join('');
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${att.name}</title></head><body style="margin:0;background:#111;color:#eee;font-family:monospace;"><div style="padding:8px;overflow:auto;"><table style="border-collapse:collapse;">${table}</table></div></body></html>`;
            const win = window.open('', '_blank');
            if (win && win.document) {
              win.document.open();
              win.document.write(html);
              win.document.close();
            }
          }).catch(() => window.open(href, '_blank'));
        } else if (
          att.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          att.type === 'application/msword' ||
          (att.name && (att.name.toLowerCase().endsWith('.docx') || att.name.toLowerCase().endsWith('.doc')))
        ) {
          // Try to view .doc/.docx via Google Docs Viewer
          const encoded = encodeURIComponent(href);
          const viewerUrl = `https://docs.google.com/gview?embedded=1&url=${encoded}`;
          window.open(viewerUrl, '_blank');
        } else {
          window.open(href, '_blank');
        }
      } catch (_) {}
    };

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✖';
    removeBtn.title = 'Remove attachment';
    removeBtn.style.background = 'rgba(0,0,0,0.7)';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '3px';
    removeBtn.style.padding = '2px 6px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.fontSize = '11px';
    removeBtn.onclick = () => {
      try {
        const removed = selectedIdea.attachments.splice(index, 1)[0];
        if (removed && removed.isObjectUrl && removed.url) {
          try { URL.revokeObjectURL(removed.url); } catch (_) {}
        }
        renderAttachmentsList(selectedIdea.attachments);
      } catch (_) {}
    };

    row.appendChild(name);
    row.appendChild(viewBtn);
    row.appendChild(removeBtn);
    list.appendChild(row);
  });
}

function addBubbleUrl() {
  if (!selectedIdea) return;
  const input = document.getElementById('urlInput');
  if (!input) return;
  const val = (input.value || '').trim();
  if (!val) return;
  try {
    const url = new URL(val);
    if (!selectedIdea.urls) selectedIdea.urls = [];
    selectedIdea.urls.push({ href: url.toString(), title: url.toString() });
    input.value = '';
    renderUrlList(selectedIdea.urls);
  } catch (_) {
    alert('Please enter a valid URL starting with http(s)://');
  }
}

function renderUrlList(urls) {
  const list = document.getElementById('urlList');
  if (!list) return;
  list.innerHTML = '';
  urls.forEach((link, index) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '6px';
    row.style.fontSize = '12px';
    row.style.color = '#ddd';

    const name = document.createElement('span');
    name.textContent = link.title || link.href;
    name.style.flex = '1';
    name.style.overflow = 'hidden';
    name.style.whiteSpace = 'nowrap';
    name.style.textOverflow = 'ellipsis';

    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'View';
    viewBtn.title = 'Open URL in overlay';
    viewBtn.style.background = 'rgba(0,0,0,0.7)';
    viewBtn.style.color = 'white';
    viewBtn.style.border = 'none';
    viewBtn.style.borderRadius = '3px';
    viewBtn.style.padding = '2px 6px';
    viewBtn.style.cursor = 'pointer';
    viewBtn.style.fontSize = '11px';
    viewBtn.onclick = () => openUrlOverlay(link.href);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✖';
    removeBtn.title = 'Remove URL';
    removeBtn.style.background = 'rgba(0,0,0,0.7)';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '3px';
    removeBtn.style.padding = '2px 6px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.fontSize = '11px';
    removeBtn.onclick = () => {
      try {
        selectedIdea.urls.splice(index, 1);
        renderUrlList(selectedIdea.urls);
      } catch (_) {}
    };

    row.appendChild(name);
    row.appendChild(viewBtn);
    row.appendChild(removeBtn);
    list.appendChild(row);
  });
}

function openUrlOverlay(href) {
  // Create a simple fullscreen iframe overlay with close
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.85)';
  overlay.style.zIndex = '70002';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  const frame = document.createElement('iframe');
  frame.src = href;
  frame.allow = 'autoplay; fullscreen';
  frame.style.width = '90vw';
  frame.style.height = '80vh';
  frame.style.border = '2px solid darkgreen';
  frame.style.borderRadius = '8px';
  frame.style.background = '#000';

  const close = document.createElement('button');
  close.textContent = 'Close';
  close.title = 'Close';
  close.style.position = 'absolute';
  close.style.top = '16px';
  close.style.right = '16px';
  close.style.background = 'rgba(0,0,0,0.7)';
  close.style.color = 'white';
  close.style.border = '2px solid #4CAF50';
  close.style.borderRadius = '6px';
  close.style.padding = '6px 10px';
  close.style.cursor = 'pointer';
  // Cleanup helper
  const cleanup = () => {
    try { document.removeEventListener('keydown', escHandler); } catch (_) {}
    if (overlay && overlay.parentNode) {
      try { document.body.removeChild(overlay); } catch (_) {}
    }
  };
  const escHandler = (e) => {
    if (e.key === 'Escape') cleanup();
  };
  close.onclick = cleanup;

  // Listen for ESC to close
  document.addEventListener('keydown', escHandler);

  // Blocked embedding helper UI (below iframe)
  const blockedWrap = document.createElement('div');
  blockedWrap.style.marginTop = '12px';
  blockedWrap.style.display = 'none';
  blockedWrap.style.textAlign = 'center';
  blockedWrap.style.position = 'absolute';
  blockedWrap.style.bottom = '5vh';
  blockedWrap.style.left = '50%';
  blockedWrap.style.transform = 'translateX(-50%)';
  const openBtn = document.createElement('button');
  openBtn.textContent = 'Open Link in New Tab';
  openBtn.style.background = 'rgba(0,0,0,0.7)';
  openBtn.style.color = 'white';
  openBtn.style.border = '2px solid #4CAF50';
  openBtn.style.borderRadius = '6px';
  openBtn.style.padding = '6px 10px';
  openBtn.style.cursor = 'pointer';
  openBtn.onclick = () => window.open(href, '_blank');
  blockedWrap.appendChild(openBtn);

  overlay.appendChild(frame);
  overlay.appendChild(close);
  overlay.appendChild(blockedWrap);
  document.body.appendChild(overlay);

  // Detect frame-ancestors/X-Frame-Options blocks and show fallback
  let loaded = false;
  frame.onload = () => {
    loaded = true;
    try {
      // Some blocked pages still fire onload but deny DOM access
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc || !doc.body) {
        blockedWrap.style.display = 'block';
      } else if ((doc.body.innerHTML || '').trim().length === 0) {
        blockedWrap.style.display = 'block';
      }
    } catch (e) {
      blockedWrap.style.display = 'block';
    }
  };
  setTimeout(() => {
    if (!loaded) {
      blockedWrap.style.display = 'block';
    }
  }, 1500);
}

// Expose add method for inline onclick
window.addBubbleUrl = addBubbleUrl;

function minimizePanel() {
  const panel = document.getElementById('panel');
  const minimizeBtn = panel.querySelector('button[onclick="minimizePanel()"]');
  if (panel) {
    if (panel.classList.contains('minimized')) {
      // Restore panel
      panel.classList.remove('minimized');
      panel.style.width = '300px';
      panel.style.height = 'auto';
      panel.style.overflow = 'visible';
      if (minimizeBtn) {
        minimizeBtn.textContent = '📋';
        minimizeBtn.title = 'Minimize';
      }
      logger.info('💭 Panel restored');
    } else {
      // Minimize panel
      panel.classList.add('minimized');
      panel.style.width = '15px';
      panel.style.height = '200px';
      panel.style.overflow = 'hidden';
      if (minimizeBtn) {
        minimizeBtn.textContent = '⬜';
        minimizeBtn.title = 'Restore';
      }
      logger.info('💭 Panel minimized');
    }
  }
}

function restorePanel() {
  const panel = document.getElementById('panel');
  if (panel && panel.classList.contains('minimized')) {
    panel.classList.remove('minimized');
    panel.style.width = '300px';
    panel.style.height = 'auto';
    panel.style.overflow = 'visible';
    logger.info('💭 Panel restored');
  }
}

function resetPanelFade() {
  const panel = document.getElementById('panel');
  const disableTimeoutCheckbox = document.getElementById('disablePanelTimeout');
  
  if (panel && panel.style.display === 'block') {
    // Check if timeout is disabled
    if (disableTimeoutCheckbox && disableTimeoutCheckbox.checked) {
      // Clear any existing timeout but don't set a new one
      if (panelFadeTimeout) {
        clearTimeout(panelFadeTimeout);
        panelFadeTimeout = null;
      }
      return;
    }
    
    if (panelFadeTimeout) {
      clearTimeout(panelFadeTimeout);
    }
    
    panelFadeTimeout = setTimeout(() => {
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.style.display = 'none';
        panel.style.opacity = '1';
      }, 500);
    }, 30000);
  }
}

function resetPanelTimer() {
  const panel = document.getElementById('panel');
  if (panel.style.display === 'block') {
    resetPanelFade();
  }
}

// ===== EFFECTS SYSTEM =====

function toggleGlow() {
  if (!selectedIdea) {
    logger.warn("⚠️ Please select a bubble first");
    return;
  }
  selectedIdea.glow = !selectedIdea.glow;
  logger.info("✨ Glow:", selectedIdea.glow ? "ON" : "OFF");
}

function toggleFlash() {
  if (!selectedIdea) {
    logger.warn("⚠️ Please select a bubble first");
    return;
  }
  selectedIdea.flash = !selectedIdea.flash;
  logger.info("⚡ Flash:", selectedIdea.flash ? "ON" : "OFF");
}

function toggleAnimateColors() {
  if (!selectedIdea) {
    logger.warn("⚠️ Please select a bubble first");
    return;
  }
  selectedIdea.animateColors = !selectedIdea.animateColors;
  logger.info("🎨 Animate:", selectedIdea.animateColors ? "ON" : "OFF");
}

function toggleTransparent() {
  if (!selectedIdea) {
    logger.warn("⚠️ Please select a bubble first");
    return;
  }
  selectedIdea.transparent = !selectedIdea.transparent;
  logger.info("👻 Transparent:", selectedIdea.transparent ? "ON" : "OFF");
}

function changeGlowColor() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  
  const glowColor = randomColor();
  selectedIdea.glowColor = glowColor;
  logger.info("🌈 Glow color changed to:", glowColor);
  
  const button = event.target;
  button.style.background = `linear-gradient(45deg, ${glowColor}, ${glowColor}80)`;
  button.style.color = "white";
  
  setTimeout(() => {
    button.style.background = "";
    button.style.color = "";
  }, 1000);
}

function toggleFixed() {
  if (!selectedIdea) {
    logger.warn("⚠️ Please select a bubble first");
    return;
  }
  selectedIdea.fixed = !selectedIdea.fixed;
    logger.info("🛑 Fixed:", selectedIdea.fixed ? "ON" : "OFF");
}

function toggleStatic() {
  if (!selectedIdea) {
    logger.warn("⚠️ Please select a bubble first");
    return;
  }
  selectedIdea.static = !selectedIdea.static;
  logger.info("🛑 Static:", selectedIdea.static ? "ON" : "OFF");
}

function toggleCheckeredBorder() {
  if (!selectedIdea) {
    logger.warn("⚠️ Please select a bubble first");
    return;
  }
  
  selectedIdea.showPauseBorder = !selectedIdea.showPauseBorder;
  logger.info("🏁 Checkered border:", selectedIdea.showPauseBorder ? "ON" : "OFF");
}

// ===== BUBBLE PROPERTIES =====

function changeColor() { 
  if (!selectedIdea) return;
  selectedIdea.color = randomColor(); 
  logger.info("🎨 Color changed to:", selectedIdea.color);
}

function changeTextColor() { 
  if (!selectedIdea) return;
  selectedIdea.textColor = randomTextColor(); 
}

function cycleFont() {
  if (!selectedIdea) return;
  fontIndex = (fontIndex + 1) % fonts.length;
  selectedIdea.font = fonts[fontIndex];
}

function updateBubbleRatio(value) {
  if (!selectedIdea) return;
  const sliderValue = parseFloat(value);
  
  // Convert slider value to symmetric ratio
  // 0.3 -> 0.3 (very thin)
  // 1.0 -> 1.0 (perfect circle/square)
  // 1.7 -> 3.0 (very tall)
  let actualRatio;
  if (sliderValue <= 1.0) {
    // 0.3 to 1.0 maps to 0.3 to 1.0 (thin to normal)
    actualRatio = sliderValue;
  } else {
    // 1.0 to 1.7 maps to 1.0 to 3.0 (normal to tall)
    const normalizedValue = (sliderValue - 1.0) / 0.7; // 0 to 1
    actualRatio = 1.0 + (normalizedValue * 2.0); // 1.0 to 3.0
  }
  
  selectedIdea.heightRatio = actualRatio;
  logger.info('📐 Ratio changed to:', actualRatio, '(slider:', sliderValue, ')');
}

function updateActionSlider(value) {
  if (!selectedIdea) return;
  const sliderValue = parseInt(value);
  
  // Update the display value
  const actionSliderValue = document.getElementById('actionSliderValue');
  if (actionSliderValue) {
    actionSliderValue.textContent = sliderValue;
  }
  
  // Store the value based on shape type
  if (selectedIdea.shape === 'striker') {
    selectedIdea.strikerVelocity = sliderValue;
    logger.info('⚡ Striker velocity changed to:', sliderValue);
  }
  // Add more shape-specific actions here in the future
}

function updateActionSliderVisibility() {
  const actionSliderContainer = document.getElementById('actionSliderContainer');
  const actionSlider = document.getElementById('actionSlider');
  const actionSliderValue = document.getElementById('actionSliderValue');
  
  if (!actionSliderContainer || !actionSlider || !actionSliderValue) return;
  
  if (selectedIdea && selectedIdea.shape === 'striker') {
    actionSliderContainer.style.display = 'block';
    actionSlider.title = 'Striker Velocity';
    actionSlider.min = '1';
    actionSlider.max = '20';
    actionSlider.value = selectedIdea.strikerVelocity || 5;
    actionSliderValue.textContent = selectedIdea.strikerVelocity || 5;
  } else {
    actionSliderContainer.style.display = 'none';
  }
}

function triggerStrikerAttack(bubble) {
  if (bubble.shape !== 'striker') return;
  
  // Check cooldown - prevent continuous attacks
  const now = Date.now();
  const cooldownTime = 300; // 0.3 seconds cooldown
  if (bubble.lastStrikerAttack && (now - bubble.lastStrikerAttack) < cooldownTime) {
    return; // Still in cooldown
  }
  
  // Release captured bubble if any (collision release)
  if (capturedBubble) {
    endStrikerCapture(); // Uses current position, not capture point
  }
  
  // Set last attack time
  bubble.lastStrikerAttack = now;
  
  // Create striker attack
  const attack = {
    x: bubble.x,
    y: bubble.y,
    radius: bubble.radius * 1.5, // 50% bigger
    color: bubble.color,
    startTime: Date.now(),
    duration: 200, // 0.2 seconds
    bubble: bubble
  };
  
  logger.info('⚡ Striker attack created with radius:', attack.radius);
  
  strikerAttacks.push(attack);
  logger.info('⚡ Striker attack triggered!');
  
  // Remove attack after duration
  setTimeout(() => {
    const index = strikerAttacks.indexOf(attack);
    if (index > -1) {
      strikerAttacks.splice(index, 1);
    }
  }, attack.duration);
}

function triggerStrikerCapture(bubble) {
  if (!bubble || bubble.shape !== 'striker') return;
  
  // No cooldown check for capture activation - can be pressed repeatedly
  const now = Date.now();
  
  // Start capture mode for 1 second
  strikerCaptureMode = true;
  capturedBubble = null;
  collisionDetected = false; // Reset collision flag
  captureModeStartTime = now;
  
  logger.info('🎣 Striker capture mode activated by:', bubble.title || 'Unknown bubble');
  logger.info('🎣 Capture range:', bubble.radius * 1.5, 'pixels');
  logger.info('🎣 Striker position:', bubble.x, bubble.y);
  logger.info('🎣 Capture mode will auto-deactivate in 1 second');
  
  // Auto-deactivate capture mode after 1 second
  setTimeout(() => {
    if (strikerCaptureMode && !capturedBubble) {
      strikerCaptureMode = false;
      logger.info('🎣 Capture mode auto-deactivated (no capture made)');
    }
  }, captureModeDuration);
}

function endStrikerCapture() {
  if (!strikerCaptureMode) return;
  
  // Don't deactivate capture mode if a bubble is captured - let it stay active
  if (!capturedBubble) {
    strikerCaptureMode = false;
    logger.info('🎣 Capture mode deactivated (no bubble captured)');
    return;
  }
  
  if (capturedBubble) {
    // Release captured bubble at current position (not capture point)
    // The bubble stays where it currently is, not where it was captured
    
    // Calculate release velocity based on striker direction
    let releaseVX = capturedBubble.originalVX || 0;
    let releaseVY = capturedBubble.originalVY || 0;
    
    // If striker was moving, add some of that momentum to the release
    if (strikerLastDirection.x !== 0 || strikerLastDirection.y !== 0) {
      const strikerSpeed = Math.sqrt(strikerLastDirection.x * strikerLastDirection.x + strikerLastDirection.y * strikerLastDirection.y);
      if (strikerSpeed > 0) {
        // Add 50% of striker's momentum to the release
        releaseVX += strikerLastDirection.x * 0.5;
        releaseVY += strikerLastDirection.y * 0.5;
      }
    }
    
    capturedBubble.vx = releaseVX;
    capturedBubble.vy = releaseVY;
    
    capturedBubble.attachedTo = null;
    delete capturedBubble.captureX;
    delete capturedBubble.captureY;
    delete capturedBubble.originalVX;
    delete capturedBubble.originalVY;
    
    // Set cooldown on the released bubble (only for collision releases, not normal releases)
    if (collisionDetected) {
      const now = Date.now();
      capturedBubble.lastCaptureTime = now;
      logger.info('🎣 Set cooldown on released bubble (collision):', capturedBubble.title || 'Unknown bubble');
    } else {
      logger.info('🎣 No cooldown set (normal release):', capturedBubble.title || 'Unknown bubble');
    }
    
    logger.info('🎣 Released captured bubble (collision):', capturedBubble.title || 'Unknown bubble');
    logger.info('🎣 Release position:', capturedBubble.x, capturedBubble.y);
    logger.info('🎣 Release velocity:', capturedBubble.vx, capturedBubble.vy);
    logger.info('🎣 Striker direction:', strikerLastDirection.x, strikerLastDirection.y);
    logger.info('🎣 Collision flag was:', collisionDetected);
  }
  
  capturedBubble = null;
  collisionDetected = false; // Reset collision flag
}

function endStrikerCaptureAtCapturePoint() {
  if (!strikerCaptureMode) return;
  
  strikerCaptureMode = false;
  
  if (capturedBubble) {
    // Release captured bubble at the capture point (for normal button release)
    capturedBubble.x = capturedBubble.captureX || capturedBubble.x;
    capturedBubble.y = capturedBubble.captureY || capturedBubble.y;
    
    // Calculate release velocity based on striker direction
    let releaseVX = capturedBubble.originalVX || 0;
    let releaseVY = capturedBubble.originalVY || 0;
    
    // If striker was moving, add some of that momentum to the release
    if (strikerLastDirection.x !== 0 || strikerLastDirection.y !== 0) {
      const strikerSpeed = Math.sqrt(strikerLastDirection.x * strikerLastDirection.x + strikerLastDirection.y * strikerLastDirection.y);
      if (strikerSpeed > 0) {
        // Add 50% of striker's momentum to the release
        releaseVX += strikerLastDirection.x * 0.5;
        releaseVY += strikerLastDirection.y * 0.5;
      }
    }
    
    capturedBubble.vx = releaseVX;
    capturedBubble.vy = releaseVY;
    
    capturedBubble.attachedTo = null;
    delete capturedBubble.captureX;
    delete capturedBubble.captureY;
    delete capturedBubble.originalVX;
    delete capturedBubble.originalVY;
    
    // No cooldown for normal button release
    // Logging removed for performance
  }
  
  capturedBubble = null;
  collisionDetected = false; // Reset collision flag
  // Logging removed for performance
}



function handleImageUpload(event) {
  if (!selectedIdea) return;
  
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    logger.warn('⚠️ Please select an image file (PNG, JPG, etc.)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    selectedIdea.image = e.target.result; // Store as data URL
    document.getElementById('uploadImage').style.border = '2px solid gold';
    document.getElementById('uploadImage').title = "Custom image uploaded";
    document.getElementById("imageSelector").value = "";
    logger.info('🖼️ Custom image uploaded for bubble:', selectedIdea.title || 'Untitled');
  };
  reader.readAsDataURL(file);
}

function handleImageSelect(event) {
  if (!selectedIdea) return;
  
  const selectedImage = event.target.value;
  if (selectedImage) {
    selectedIdea.image = selectedImage;
    document.getElementById('uploadImage').style.border = '';
    document.getElementById('uploadImage').title = "Upload custom image";
    // Logging removed for performance
  } else {
    selectedIdea.image = null;
    // Logging removed for performance
  }
}

function clearUploadedImage() {
  if (!selectedIdea) return;
  
  selectedIdea.image = null;
  if (!selectedIdea.color || selectedIdea.color === "black") {
    selectedIdea.color = randomColor();
  }
  document.getElementById("imageSelector").value = "";
  document.getElementById('uploadImage').style.border = '';
  document.getElementById('uploadImage').title = "Upload custom image";
  logger.info("🗑️ Image cleared from bubble, color set to:", selectedIdea.color);
}

// ===== SAVE/LOAD SYSTEM =====

async function saveIdeas() {
  // Helper to convert a resource URL (including blob:) to data URL
  async function toDataUrl(resourceUrl) {
    try {
      const res = await fetch(resourceUrl);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (_) {
      return null;
    }
  }

  const dataToSave = await Promise.all(ideas.map(async (idea) => {
    const copy = { ...idea };
    // Persist attachments; embed images and CSV as data URLs for portability
    if (Array.isArray(copy.attachments)) {
      const out = [];
      for (const att of copy.attachments) {
        const item = {
          name: att.name,
          type: att.type,
          url: att.url,
          isObjectUrl: !!att.isObjectUrl,
          originalName: att.originalName || att.name || ''
        };
        if (att && typeof att.type === 'string') {
          if (att.type.startsWith('image/') || att.type === 'text/csv') {
            const dataUrl = await toDataUrl(att.url);
            if (dataUrl) {
              item.dataUrl = dataUrl;
              // Prefer embedded data URL to ensure post-load viewing
              item.url = dataUrl;
              item.isObjectUrl = false;
            }
          }
        }
        out.push(item);
      }
      copy.attachments = out;
    }
    // Persist URLs list
    if (Array.isArray(copy.urls)) {
      copy.urls = copy.urls.map(u => ({ href: u.href, title: u.title || u.href }));
    }
    // Audio: keep url and a flag (do not embed to keep JSON smaller)
    if (copy.audio) {
      copy.audio = {
        url: copy.audio.url,
        name: copy.audio.name,
        isObjectUrl: !!copy.audio.isObjectUrl
      };
    }
    return copy;
  }));

  const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ideas.json';
  a.click();
  logger.info('💾 Ideas saved to file:', dataToSave.length, 'ideas exported');
}

function deleteAllIdeas() {
  if (confirm("📋CREATE BLANK CANVAS? ✅")) {
    const deletedCount = ideas.length;
    ideas = [];
    selectedIdea = null;
    document.getElementById('panel').style.display = "none";
    backgroundImage = null;
    
    const video = document.getElementById("bgVideo");
    video.style.display = "none";
    video.pause();
    video.src = "";
    
    const iframe = document.getElementById("ytFrame");
    iframe.style.display = "none";
    iframe.src = "";
    
    logger.info('🗑️ All ideas deleted:', deletedCount, 'ideas removed, canvas cleared');
  }
}

// ===== CANVAS RENDERING =====

function draw() {
  // Performance optimized - removed debug logging
  window.frameCounter++; // Increment global frame counter for logging control
  
  // Apply enhanced physics and effects
  if (physicsEnabled) {
    applyMagneticForces();
  }
  updateBubbleTrails();
  
  // Only clear canvas if not in drawing mode
  if (!isDrawingMode) {
    // Draw background
    if (backgroundImage) {
      if (backgroundRotation !== 0) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((backgroundRotation * Math.PI) / 180);
        const maxDimension = Math.max(width, height);
        const scaleX = width / backgroundImage.width;
        const scaleY = height / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY) * 1.2;
        
        const scaledWidth = backgroundImage.width * scale;
        const scaledHeight = backgroundImage.height * scale;
        
        ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
      } else {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
      }
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }
  // If in drawing mode, don't clear the canvas - preserve drawings

  // Update and draw ideas (skip drawing if in drawing mode)
  for (let i = 0; i < ideas.length; i++) {
    const a = ideas[i];
    const actualSpeed = movementDelayActive ? 0 : speedMultiplier;

    // Movement (skip if captured)
    if (!a.fixed && !a.static && !a.attachedTo) {
      a.x += a.vx * actualSpeed;
      a.y += a.vy * actualSpeed;
    }
    
    // Ball physics - removed velocity boost/decay system for steady play

    // Boundary bounce (skip if captured)
    if (!a.static && !a.attachedTo) {
      // Ball physics for pitch boundaries (no energy loss, clean bounces)
      if (a.shape === 'ball') {
        // Perfect bounces off pitch boundaries
        if (a.x - a.radius < border) { 
          a.x = border + a.radius; 
          a.vx *= -1; // Perfect reflection
        }
        if (a.x + a.radius > width - border) { 
          a.x = width - border - a.radius; 
          a.vx *= -1; // Perfect reflection
        }
        if (a.y - a.radius < border + 50) { 
          a.y = border + 50 + a.radius; 
          a.vy *= -1; // Perfect reflection
        }
        if (a.y + a.radius > height - border) { 
          a.y = height - border - a.radius; 
          a.vy *= -1; // Perfect reflection
        }
      } else {
        // Normal bouncing for other shapes
        if (a.x - a.radius < border) { a.x = border + a.radius; a.vx *= -1; }
        if (a.x + a.radius > width - border) { a.x = width - border - a.radius; a.vx *= -1; }
        if (a.y - a.radius < border + 50) { a.y = border + 50 + a.radius; a.vy *= -1; }
        if (a.y + a.radius > height - border) { a.y = height - border - a.radius; a.vy *= -1; }
      }
    }
    
    // Ball-specific physics: maintain steady velocity on the pitch
    if (a.shape === 'ball' && !a.static && !a.attachedTo) {
      // Very minimal air resistance to maintain steady movement
      const airResistance = 0.999; // Minimal friction on the pitch
      a.vx *= airResistance;
      a.vy *= airResistance;
      
      // NO GRAVITY - this is a bird's-eye view of a pitch
      
      // Maintain steady velocity to keep ball moving around the pitch
      const minVelocity = 1.0; // Higher minimum to keep ball active
      const maxVelocity = 8.0; // Cap maximum speed for playability
      const currentSpeed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      
      if (currentSpeed < minVelocity && currentSpeed > 0.1) {
        // Boost to minimum velocity if too slow
        const normalizedVx = a.vx / currentSpeed;
        const normalizedVy = a.vy / currentSpeed;
        a.vx = normalizedVx * minVelocity;
        a.vy = normalizedVy * minVelocity;
      } else if (currentSpeed > maxVelocity) {
        // Cap maximum velocity
        const normalizedVx = a.vx / currentSpeed;
        const normalizedVy = a.vy / currentSpeed;
        a.vx = normalizedVx * maxVelocity;
        a.vy = normalizedVy * maxVelocity;
      }
    }

    // Striker capture proximity check (separate from collision detection) - OPTIMIZED
    if (strikerCaptureMode && !capturedBubble) {
      // Check if capture mode should auto-deactivate (1 second timeout)
      const now = Date.now();
      if (now - captureModeStartTime > captureModeDuration) {
        strikerCaptureMode = false;
        continue;
      }
      
      const striker = ideas.find(idea => idea.shape === 'striker' && idea === selectedIdea);
      if (striker && a !== striker) {
        // Only check cooldown if this bubble was previously captured and released
        if (a.lastCaptureTime && (now - a.lastCaptureTime) < strikerCaptureCooldown) {
          continue; // Skip this bubble due to cooldown
        }
        
        const dx = striker.x - a.x;
        const dy = striker.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Check if bubble touches the capture range (1.5x striker radius)
        if (dist <= striker.radius * 1.5) {
          // Calculate capture point on striker circumference
          const angle = Math.atan2(a.y - striker.y, a.x - striker.x);
          const capturePointX = striker.x + Math.cos(angle) * (striker.radius * 1.5);
          const capturePointY = striker.y + Math.sin(angle) * (striker.radius * 1.5);
          
          // Capture the bubble at the capture point
          capturedBubble = a;
          a.captureX = capturePointX; // Store capture point position
          a.captureY = capturePointY; // Store capture point position
          a.originalVX = a.vx; // Store original velocity
          a.originalVY = a.vy; // Store original velocity
          a.attachedTo = striker;
          
          // Position the bubble at the capture point immediately
          a.x = capturePointX;
          a.y = capturePointY;
          
          // Set velocity to null while captured
          a.vx = 0;
          a.vy = 0;
          
          // Track capture frame to prevent immediate collision release
          captureFrame = Date.now();
          
          logger.debugSparse('🎣 Captured bubble:', a.title || 'Unknown bubble', 'at distance:', Math.round(dist), 180);
        }
      }
    }
    
    // Release captured bubble on any collision with other bubbles (prevent immediate release)
    if (capturedBubble && a === capturedBubble) {
      // Prevent immediate collision release (wait at least 100ms after capture)
      const now = Date.now();
      if (now - captureFrame < 100) {
        // Skip logging to reduce spam
      } else {
        // Check collision with any other bubble (but not with the striker)
        const striker = a.attachedTo;
        for (let j = 0; j < ideas.length; j++) {
          const otherBubble = ideas[j];
          if (otherBubble !== a && otherBubble !== a.attachedTo && otherBubble !== striker) {
            const dx = a.x - otherBubble.x;
            const dy = a.y - otherBubble.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < a.radius + otherBubble.radius) {
              collisionDetected = true; // Set collision flag
              endStrikerCapture();
              break;
            }
          }
        }
      }
    }
    
    // Also check if any bubble collides with the captured bubble (prevent immediate release)
    if (capturedBubble && a !== capturedBubble && a !== capturedBubble.attachedTo) {
      // Prevent immediate collision release (wait at least 100ms after capture)
      const now = Date.now();
      if (now - captureFrame < 100) {
        // Skip logging to reduce spam
      } else {
        const dx = a.x - capturedBubble.x;
        const dy = a.y - capturedBubble.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < a.radius + capturedBubble.radius) {
          collisionDetected = true; // Set collision flag
          endStrikerCapture();
        }
      }
    }
    
    // Check if any bubble collides with the striker (which would release the captured bubble)
    if (capturedBubble && a !== capturedBubble.attachedTo) {
      // Prevent immediate collision release (wait at least 100ms after capture)
      const now = Date.now();
      if (now - captureFrame < 100) {
        // Skip logging to reduce spam
      } else {
        const striker = capturedBubble.attachedTo;
        if (striker && a !== striker) {
          const dx = a.x - striker.x;
          const dy = a.y - striker.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < a.radius + striker.radius) {
            collisionDetected = true; // Set collision flag
            endStrikerCapture();
          }
        }
      }
    }
    
    // Ball-Goal collision detection (check before general collisions)
    if (a.shape === 'ball' && !a.attachedTo) {
      for (let j = 0; j < ideas.length; j++) {
        const goal = ideas[j];
        if (goal.shape === 'goal' && goal !== a) {
          // For Goal (rectangle), use more complex collision detection
          const ballCenterX = a.x;
          const ballCenterY = a.y;
          const ballRadius = a.radius;
          
          // Goal dimensions (0.5:1 ratio)
          const goalWidth = goal.radius * 0.5; // 0.5:1 ratio
          const goalHeight = goal.radius;
          
          // Account for goal rotation - swap dimensions if rotated 90 degrees
          let finalGoalWidth = goalWidth;
          let finalGoalHeight = goalHeight;
          if (goal.rotation === 89 || goal.rotation === 271 || goal.rotation === 90 || goal.rotation === 270) {
            // If rotated 90 degrees, swap width and height
            finalGoalWidth = goalHeight;
            finalGoalHeight = goalWidth;
          }
          
          const goalLeft = goal.x - finalGoalWidth/2;
          const goalRight = goal.x + finalGoalWidth/2;
          const goalTop = goal.y - finalGoalHeight/2;
          const goalBottom = goal.y + finalGoalHeight/2;
          
          // Check if ball collides with goal rectangle
          const closestX = Math.max(goalLeft, Math.min(ballCenterX, goalRight));
          const closestY = Math.max(goalTop, Math.min(ballCenterY, goalBottom));
          const distanceX = ballCenterX - closestX;
          const distanceY = ballCenterY - closestY;
          const distanceSquared = distanceX * distanceX + distanceY * distanceY;
          
          if (distanceSquared < ballRadius * ballRadius) {
            // Determine which side was hit (left/right/top/bottom)
            const distToLeft = Math.abs(ballCenterX - goalLeft);
            const distToRight = Math.abs(goalRight - ballCenterX);
            const distToTop = Math.abs(ballCenterY - goalTop);
            const distToBottom = Math.abs(goalBottom - ballCenterY);
            let hitSide = 'left';
            let minSideDist = distToLeft;
            if (distToRight < minSideDist) { minSideDist = distToRight; hitSide = 'right'; }
            if (distToTop < minSideDist) { minSideDist = distToTop; hitSide = 'top'; }
            if (distToBottom < minSideDist) { minSideDist = distToBottom; hitSide = 'bottom'; }

            // Initialize goal active side if missing (vertical -> left, horizontal -> top)
            if (!goal.activeSide) {
              goal.activeSide = (finalGoalHeight >= finalGoalWidth) ? 'left' : 'top';
            }

            // Check cooldown and active scoring side
            const now = Date.now();
            if (now > goal.goalCooldown && hitSide === goal.activeSide) {
              // GOAL SCORED!
              goal.goals += 1;
              goal.flashUntil = now + 500; // Flash for 500ms
              goal.goalCooldown = now + 5000; // 5-second cooldown
              
              logger.info(`⚽ GOAL! Ball hit Goal. Total goals: ${goal.goals}`);
            }
            
            // Reflect and separate to prevent sticking
            const epsilon = 1;
            if (hitSide === 'left') {
              a.x = goalLeft - (ballRadius + epsilon);
              a.vx = Math.abs(a.vx) * -1; // ensure moving left->right flips
            } else if (hitSide === 'right') {
              a.x = goalRight + (ballRadius + epsilon);
              a.vx = Math.abs(a.vx);
            } else if (hitSide === 'top') {
              a.y = goalTop - (ballRadius + epsilon);
              a.vy = Math.abs(a.vy) * -1;
            } else { // bottom
              a.y = goalBottom + (ballRadius + epsilon);
              a.vy = Math.abs(a.vy);
            }
            
            // Ensure ball maintains good velocity after goal
            const currentSpeed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
            if (currentSpeed < 2.0) {
              // Give ball a good velocity if it was too slow
              const normalizedVx = a.vx / currentSpeed;
              const normalizedVy = a.vy / currentSpeed;
              if (isFinite(normalizedVx) && isFinite(normalizedVy)) {
                a.vx = normalizedVx * 2.0;
                a.vy = normalizedVy * 2.0;
              } else {
                // fallback nudge away from goal center
                a.vx = (hitSide === 'left' ? -2 : hitSide === 'right' ? 2 : 0);
                a.vy = (hitSide === 'top' ? -2 : hitSide === 'bottom' ? 2 : 0);
              }
            }
          }
        }
      }
    }
    
    // Puck-Goal collision detection (same as Ball-Goal but for Pucks)
    if (a.shape === 'puck' && !a.attachedTo) {
      for (let j = 0; j < ideas.length; j++) {
        const goal = ideas[j];
        if (goal.shape === 'goal' && goal !== a) {
          // For Goal (rectangle), use rectangle-circle collision detection
          const puckCenterX = a.x;
          const puckCenterY = a.y;
          const puckRadius = a.radius;
          
          // Goal dimensions (0.5:1 ratio)
          const goalWidth = goal.radius * 0.5; // 0.5:1 ratio
          const goalHeight = goal.radius;
          
          // Account for goal rotation - swap dimensions if rotated 90 degrees
          let finalGoalWidth = goalWidth;
          let finalGoalHeight = goalHeight;
          if (goal.rotation === 89 || goal.rotation === 271 || goal.rotation === 90 || goal.rotation === 270) {
            // If rotated 90 degrees, swap width and height
            finalGoalWidth = goalHeight;
            finalGoalHeight = goalWidth;
          }
          
          const goalLeft = goal.x - finalGoalWidth/2;
          const goalRight = goal.x + finalGoalWidth/2;
          const goalTop = goal.y - finalGoalHeight/2;
          const goalBottom = goal.y + finalGoalHeight/2;
          
          // Check if puck collides with goal rectangle
          const closestX = Math.max(goalLeft, Math.min(puckCenterX, goalRight));
          const closestY = Math.max(goalTop, Math.min(puckCenterY, goalBottom));
          const distanceX = puckCenterX - closestX;
          const distanceY = puckCenterY - closestY;
          const distanceSquared = distanceX * distanceX + distanceY * distanceY;
          
          if (distanceSquared < puckRadius * puckRadius) {
            // Determine hit side
            const distToLeft = Math.abs(puckCenterX - goalLeft);
            const distToRight = Math.abs(goalRight - puckCenterX);
            const distToTop = Math.abs(puckCenterY - goalTop);
            const distToBottom = Math.abs(goalBottom - puckCenterY);
            let hitSide = 'left';
            let minSideDist = distToLeft;
            if (distToRight < minSideDist) { minSideDist = distToRight; hitSide = 'right'; }
            if (distToTop < minSideDist) { minSideDist = distToTop; hitSide = 'top'; }
            if (distToBottom < minSideDist) { minSideDist = distToBottom; hitSide = 'bottom'; }

            if (!goal.activeSide) {
              goal.activeSide = (finalGoalHeight >= finalGoalWidth) ? 'left' : 'top';
            }

            // Check cooldown and scoring side
            const now = Date.now();
            if (now > goal.goalCooldown && hitSide === goal.activeSide) {
              // GOAL SCORED!
              goal.goals += 1;
              goal.flashUntil = now + 500; // Flash for 500ms
              goal.goalCooldown = now + 5000; // 5-second cooldown
              
              logger.info(`🏒 GOAL! Puck hit Goal. Total goals: ${goal.goals}`);
            }
            
            // Reflect and separate
            const epsilon = 1;
            if (hitSide === 'left') {
              a.x = goalLeft - (puckRadius + epsilon);
              a.vx = Math.abs(a.vx) * -1;
            } else if (hitSide === 'right') {
              a.x = goalRight + (puckRadius + epsilon);
              a.vx = Math.abs(a.vx);
            } else if (hitSide === 'top') {
              a.y = goalTop - (puckRadius + epsilon);
              a.vy = Math.abs(a.vy) * -1;
            } else {
              a.y = goalBottom + (puckRadius + epsilon);
              a.vy = Math.abs(a.vy);
            }
            
            // Ensure puck maintains good velocity after goal
            const currentSpeed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
            if (currentSpeed < 2.0) {
              // Give puck a good velocity if it was too slow
              const normalizedVx = a.vx / currentSpeed;
              const normalizedVy = a.vy / currentSpeed;
              if (isFinite(normalizedVx) && isFinite(normalizedVy)) {
                a.vx = normalizedVx * 2.0;
                a.vy = normalizedVy * 2.0;
              } else {
                a.vx = (hitSide === 'left' ? -2 : hitSide === 'right' ? 2 : 0);
                a.vy = (hitSide === 'top' ? -2 : hitSide === 'bottom' ? 2 : 0);
              }
            }
          }
        }
      }
    }
    
    // Collision detection (skip if captured)
    if (!a.attachedTo) {
      for (let j = i + 1; j < ideas.length; j++) {
        const b = ideas[j];
        if (b.attachedTo) continue; // Skip captured bubbles
        
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < a.radius + b.radius) {
          const angle = Math.atan2(dy, dx);
          
          // Release captured bubble on any collision (but not with the striker)
          if (capturedBubble && (a === capturedBubble || b === capturedBubble)) {
            // Don't release if the collision is with the striker
            const striker = capturedBubble.attachedTo;
            if (a !== striker && b !== striker) {
              logger.debugSparse('🎣 Captured bubble released due to collision', null, 120);
              collisionDetected = true; // Set collision flag
              endStrikerCapture();
            }
          }
          
          if (a.static && !b.static) {
            const tx = a.x - Math.cos(angle) * (a.radius + b.radius);
            const ty = a.y - Math.sin(angle) * (a.radius + b.radius);
            b.x = tx;
            b.y = ty;
            b.vx *= -1;
            b.vy *= -1;
          } else if (!a.static && b.static) {
            const tx = b.x + Math.cos(angle) * (a.radius + b.radius);
            const ty = b.y + Math.sin(angle) * (a.radius + b.radius);
            a.x = tx;
            a.y = ty;
            a.vx *= -1;
            a.vy *= -1;
          } else {
            // Special Ball-to-Ball collision physics - stronger velocity wins
            if (a.shape === 'ball' && b.shape === 'ball') {
              const tx = a.x - Math.cos(angle) * (a.radius + b.radius);
              const ty = a.y - Math.sin(angle) * (a.radius + b.radius);
              b.x = tx;
              b.y = ty;
              
              // Calculate current speeds
              const speedA = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
              const speedB = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
              
              // The stronger (faster) ball dominates the collision
              if (speedA > speedB) {
                // Ball A is faster - B takes on A's velocity direction with A's speed
                const directionA = Math.atan2(a.vy, a.vx);
                b.vx = Math.cos(directionA) * speedA * 0.8; // 80% of A's speed
                b.vy = Math.sin(directionA) * speedA * 0.8;
                // A maintains most of its velocity but deflects slightly
                a.vx *= 0.9;
                a.vy *= 0.9;
              } else if (speedB > speedA) {
                // Ball B is faster - A takes on B's velocity direction with B's speed
                const directionB = Math.atan2(b.vy, b.vx);
                a.vx = Math.cos(directionB) * speedB * 0.8; // 80% of B's speed
                a.vy = Math.sin(directionB) * speedB * 0.8;
                // B maintains most of its velocity but deflects slightly
                b.vx *= 0.9;
                b.vy *= 0.9;
              } else {
                // Similar speeds - exchange velocities with slight variation
                [a.vx, b.vx] = [b.vx, a.vx];
                [a.vy, b.vy] = [b.vy, a.vy];
              }
              
              logger.debugSparse('⚽ Ball-to-Ball collision - stronger velocity dominates!', null, 180);
            } else if (a.shape === 'ball' || b.shape === 'ball') {
              // Ball colliding with other shapes - ball takes stronger velocity
              const tx = a.x - Math.cos(angle) * (a.radius + b.radius);
              const ty = a.y - Math.sin(angle) * (a.radius + b.radius);
              b.x = tx;
              b.y = ty;
              
              const speedA = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
              const speedB = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
              
              if (a.shape === 'ball') {
                // Ball A takes the stronger velocity
                if (speedB > speedA) {
                  a.vx = b.vx;
                  a.vy = b.vy;
                }
                // Other shape gets pushed away
                b.vx = a.vx * 0.5;
                b.vy = a.vy * 0.5;
              } else if (b.shape === 'ball') {
                // Ball B takes the stronger velocity
                if (speedA > speedB) {
                  b.vx = a.vx;
                  b.vy = a.vy;
                }
                // Other shape gets pushed away
                a.vx = b.vx * 0.5;
                a.vy = b.vy * 0.5;
              }
            } else {
              // Normal collision for non-ball shapes
              const tx = a.x - Math.cos(angle) * (a.radius + b.radius);
              const ty = a.y - Math.sin(angle) * (a.radius + b.radius);
              b.x = tx;
              b.y = ty;
              [a.vx, b.vx] = [b.vx, a.vx];
              [a.vy, b.vy] = [b.vy, a.vy];
            }
          }
        }
      }
    }

    // Update captured bubble position to follow striker (skip if collision detected)
    if (a.attachedTo && strikerCaptureMode && !collisionDetected) {
      const striker = a.attachedTo;
      
      // Position the captured bubble at the capture point on the circumference
      if (a.captureX !== undefined && a.captureY !== undefined) {
        // Calculate the angle from striker to the original capture point
        const captureAngle = Math.atan2(a.captureY - striker.y, a.captureX - striker.x);
        
        // Update the capture point position to follow the striker
        a.captureX = striker.x + Math.cos(captureAngle) * (striker.radius * 1.5);
        a.captureY = striker.y + Math.sin(captureAngle) * (striker.radius * 1.5);
        
        // Position the bubble at the updated capture point
        a.x = a.captureX;
        a.y = a.captureY;
      } else {
        // Fallback: position at striker center if capture point not available
        a.x = striker.x;
        a.y = striker.y;
      }
      
      a.vx = 0;
      a.vy = 0;
      
      // Track striker movement direction
      if (striker.vx !== 0 || striker.vy !== 0) {
        strikerLastDirection.x = striker.vx;
        strikerLastDirection.y = striker.vy;
      }
      
              logger.debugSparse('🎣 Updated captured bubble position:', a.x, a.y, 'Striker:', striker.x, striker.y, 300);
    } else if (a.attachedTo && strikerCaptureMode && collisionDetected) {
              logger.debugSparse('🎣 Skipping position update due to collision flag', null, 300);
    }
    
    // Draw bubble (skip if in drawing mode)
    if (!isDrawingMode) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      // Draw the shape path
      const shape = a.shape || 'circle';
      const heightRatio = a.heightRatio || 1.0;
      drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
      
      // Bubble-scoped audio pulse overlay (owner only)
      try {
        if (a.pulseWithAudio === true && currentBubbleAudioOwner === a) {
          const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180 + i * 0.45);
          const inflate = 1 + 0.15 * pulse; // enlarge pulse radius ~15%
          ctx.save();
          // Red tint fill overlay
          ctx.globalAlpha = 0.18 + 0.25 * pulse;
          ctx.fillStyle = 'red';
          ctx.beginPath();
          if (a.shape === 'goal') {
            const goalWidth = a.radius * 0.5;
            const goalHeight = a.radius;
            let w = goalWidth * inflate;
            let h = goalHeight * inflate;
            if (a.rotation === 89 || a.rotation === 271 || a.rotation === 90 || a.rotation === 270) {
              [w, h] = [h, w];
            }
            ctx.rect(-w / 2, -h / 2, w, h);
          } else {
            ctx.arc(0, 0, a.radius * inflate, 0, Math.PI * 2);
          }
          ctx.fill();
          
          // Red outline
          ctx.globalAlpha = 0.25 + 0.35 * pulse;
          ctx.lineWidth = 2 + 2.5 * pulse;
          ctx.strokeStyle = 'red';
          ctx.beginPath();
          if (a.shape === 'goal') {
            const goalWidth = a.radius * 0.5;
            const goalHeight = a.radius;
            let w = goalWidth * inflate;
            let h = goalHeight * inflate;
            if (a.rotation === 89 || a.rotation === 271 || a.rotation === 90 || a.rotation === 270) {
              [w, h] = [h, w];
            }
            ctx.rect(-w / 2, -h / 2, w, h);
          } else {
            ctx.arc(0, 0, a.radius * inflate, 0, Math.PI * 2);
          }
          ctx.stroke();
          ctx.restore();
        }
      } catch (e) {}

      // Draw capture border for striker in capture mode
      if (a.shape === 'striker' && strikerCaptureMode && a === selectedIdea) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#00FF00'; // Green border for capture mode
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Rectangular capture boundary for goals
          const goalWidth = a.radius * 0.5; // 0.5:1 ratio
          const goalHeight = a.radius;
          
          // Account for goal rotation - swap dimensions if rotated 90 degrees
          let finalGoalWidth = goalWidth;
          let finalGoalHeight = goalHeight;
          if (a.rotation === 89 || a.rotation === 271 || a.rotation === 90 || a.rotation === 270) {
            // If rotated 90 degrees, swap width and height
            finalGoalWidth = goalHeight;
            finalGoalHeight = goalWidth;
          }
          
          ctx.rect(-finalGoalWidth/2 - a.radius * 0.5, -finalGoalHeight/2 - a.radius * 0.5, 
                   finalGoalWidth + a.radius, finalGoalHeight + a.radius);
        } else {
          // Circular capture boundary for other shapes
          ctx.arc(0, 0, a.radius * 1.5, 0, Math.PI * 2);
        }
        ctx.stroke();
        
        // Draw a dashed line to show the capture boundary more clearly
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Rectangular dashed capture boundary for goals
          const goalWidth = a.radius * 0.5; // 0.5:1 ratio
          const goalHeight = a.radius;
          
          // Account for goal rotation - swap dimensions if rotated 90 degrees
          let finalGoalWidth = goalWidth;
          let finalGoalHeight = goalHeight;
          if (a.rotation === 89 || a.rotation === 271 || a.rotation === 90 || a.rotation === 270) {
            // If rotated 90 degrees, swap width and height
            finalGoalWidth = goalHeight;
            finalGoalHeight = goalWidth;
          }
          
          ctx.rect(-finalGoalWidth/2 - a.radius * 0.5, -finalGoalHeight/2 - a.radius * 0.5, 
                   finalGoalWidth + a.radius, finalGoalHeight + a.radius);
        } else {
          // Circular dashed capture boundary for other shapes
          ctx.arc(0, 0, a.radius * 1.5, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
      }
      // Remove circular clipping around goals to avoid circular barrier behavior

    if (a.image) {
      const src = a.image;
      
      if (loadedImages[src] && loadedImages[src].complete) {
        try {
          const img = loadedImages[src];
          // Preserve the original aspect ratio of the uploaded PNG/JPG
          const maxW = a.radius * 2;
          const maxH = a.radius * 2;
          // Scale to fit within the bubble diameter WITHOUT stretching
          const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          // Center the image within the bubble area
          const drawX = -drawW / 2;
          const drawY = -drawH / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } catch (error) {
          logger.error("❌ Error drawing image for bubble:", { title: a.title, error: error });
          a.image = null;
        }
      } else {
        if (!loadedImages[src]) {
          const img = new Image();
          img.onload = () => {
            loadedImages[src] = img;
          };
          img.onerror = () => {
            logger.error("❌ Failed to load image:", { src: src });
            a.image = null;
          };
          img.src = src;
        }
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }
    } else {
      if (a.transparent) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
      } else if (a.animateColors) {
        ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
      } else {
        ctx.fillStyle = a.color || "white";
      }

      if (a.glow) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = a.color || "white";
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = a.color || "white";
      }
      
      ctx.fill();
    }

    ctx.restore();

    // Effects
    if (a.glow || a.flash) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      if (a.flash) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100);
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Rectangular flash for goals
          const goalWidth = a.radius * 2;
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2, -goalHeight/2, goalWidth, goalHeight);
        } else {
          ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
        }
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      if (a.glow) {
        const glowColor = a.glowColor || a.color || "white";
        
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Rectangular glow for goals
          const goalWidth = a.radius * 2;
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2 - 3, -goalHeight/2 - 3, goalWidth + 6, goalHeight + 6);
        } else {
          ctx.arc(0, 0, a.radius + 3, 0, Math.PI * 2);
        }
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        if (a.shape === 'goal') {
          // Outer rectangular glow for goals
          const goalWidth = a.radius * 2;
          const goalHeight = a.radius;
          ctx.rect(-goalWidth/2 - 5, -goalHeight/2 - 5, goalWidth + 10, goalHeight + 10);
        } else {
          ctx.arc(0, 0, a.radius + 5, 0, Math.PI * 2);
        }
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Text
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    ctx.fillStyle = a.textColor || "white";
    const fontSize = a.fontSize || 14;
    ctx.font = `bold ${fontSize}px ${a.font || "Tahoma"}`;
    ctx.textAlign = "center";
    const words = a.title.split(" ");
    const lineHeight = fontSize + 2;
    words.forEach((word, idx) => {
      ctx.fillText(word, 0, idx * lineHeight - (words.length - 1) * (lineHeight / 2));
    });
    
    // For Goal bubbles, show goals count
    if (a.shape === 'goal') {
      const goalsText = `Goals: ${a.goals || 0}`;
      
      // Special styling for goals count
      if (a.flashUntil > Date.now()) {
        // Flash the goals text when scoring
        const flashIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 100);
        ctx.fillStyle = `rgba(255, 215, 0, ${flashIntensity})`; // Gold flash
      } else {
        ctx.fillStyle = "#FFD700"; // Gold for goals count
      }
      ctx.font = `bold ${fontSize + 2}px ${a.font || "Tahoma"}`;
      ctx.fillText(goalsText, 0, fontSize + 8);
    }
    
    ctx.restore();
    
    // Goal flash border effect when goals are scored
    if (a.shape === 'goal' && a.flashUntil > Date.now()) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      // Flash effect - pulsing bright border
      const flashIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 50); // Fast pulse
      ctx.globalAlpha = flashIntensity;
      ctx.strokeStyle = "#FFD700"; // Gold color for goal flash
      ctx.lineWidth = 6;
      ctx.setLineDash([]);
      
      // Draw flashing border around goal rectangle
      const goalWidth = a.radius * 0.5; // 0.5:1 ratio
      const goalHeight = a.radius;
      ctx.beginPath();
      ctx.rect(-goalWidth/2, -goalHeight/2, goalWidth, goalHeight);
      ctx.stroke();
      
      // Add inner flash
      ctx.strokeStyle = "#FFFFFF"; // White inner flash
      ctx.lineWidth = 3;
      ctx.globalAlpha = flashIntensity * 0.7;
      ctx.beginPath();
      ctx.rect(-goalWidth/2 + 3, -goalHeight/2 + 3, goalWidth - 6, goalHeight - 6);
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Checkered border for glowing bubbles
    if (a.glow && a.showPauseBorder) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      const shape = a.shape || 'circle';
      const heightRatio = a.heightRatio || 1.0;
      drawShape(ctx, shape, 0, 0, a.radius + 3, heightRatio, 0);
      ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
    
    // Visual feedback for manual control (always available) - REMOVED
    
    // Visual feedback for dragging
    if (isDragging && draggedIdea === a) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      if (a.shape === 'goal') {
        // Rectangular drag border for goals
        const goalWidth = a.radius * 0.5; // 0.5:1 ratio
        const goalHeight = a.radius;
        ctx.rect(-goalWidth/2 - 8, -goalHeight/2 - 8, goalWidth + 16, goalHeight + 16);
      } else {
        // Circular drag border for other shapes
        ctx.arc(0, 0, a.radius + 8, 0, Math.PI * 2);
      }
      ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw trail effect
    if (a.hasTrail && a.trail && a.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = a.color + '40'; // Semi-transparent
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      
      ctx.beginPath();
      a.trail.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      ctx.restore();
    }
    } // Close if (!isDrawingMode) block
  }

  // Draw striker attacks and handle collisions
  for (let i = 0; i < strikerAttacks.length; i++) {
    const attack = strikerAttacks[i];
    const elapsed = Date.now() - attack.startTime;
    const progress = elapsed / attack.duration;
    
    if (progress >= 1) continue; // Skip if attack is finished
    
    ctx.save();
    ctx.translate(attack.x, attack.y);
    
    // Draw attack ring with fade effect (outline only)
    ctx.globalAlpha = 0.7 * (1 - progress);
    ctx.strokeStyle = attack.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, attack.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // Check for collisions with other bubbles
    for (let j = 0; j < ideas.length; j++) {
      const target = ideas[j];
      if (target === attack.bubble) continue; // Skip the attacking bubble
      
      // Check for collisions with other bubbles using expanded radius
      const expandedRadius = attack.bubble.radius * 2; // Twice the normal size
      const dx = attack.x - target.x;
      const dy = attack.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < expandedRadius + target.radius) {
        // Check if this target has already been hit by this attack
        if (!attack.hitTargets) {
          attack.hitTargets = new Set();
        }
        
        if (!attack.hitTargets.has(target)) {
          // Collision detected! Apply strike effect
          logger.debugSparse('💥 Striker hit:', target.title, 120);
          
          // Mark this target as hit by this attack
          attack.hitTargets.add(target);
          
          // Visual feedback - flash the hit bubble
          target.flash = true;
          setTimeout(() => {
            target.flash = false;
          }, 500);
          
          // Bounce effect - push the target away from the striker
          if (!target.static) {
            const pushDistance = 50; // Increased push distance
            
            // Calculate direction from striker to target
            const dirX = target.x - attack.x;
            const dirY = target.y - attack.y;
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);
            
            if (distance > 0) {
              // Normalize direction
              const normalizedDirX = dirX / distance;
              const normalizedDirY = dirY / distance;
              
              // Set velocity based on striker's custom velocity setting
              const strikerVelocity = attack.bubble.strikerVelocity || 5;
              target.vx = normalizedDirX * strikerVelocity;
              target.vy = normalizedDirY * strikerVelocity;
            }
          }
        }
      }
    }
  }

  // Draw preserved drawings (works in both drawing mode and bubble mode)
  if (drawingPaths.length > 0) {
    for (let i = 0; i < drawingPaths.length; i++) {
      const path = drawingPaths[i];
      const pathColor = path.color || drawingColor;
      const pathWidth = path.width || drawingWidth;
      
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      
      for (let j = 1; j < path.length; j++) {
        ctx.lineTo(path[j].x, path[j].y);
      }
      
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = pathWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  requestAnimationFrame(draw);
}

// ===== INITIALIZATION =====

function init() {
  logger.info("🚀 Initializing MindsEye...");
  
  // Set up canvas
  resize();
  window.addEventListener("resize", resize);
  
  // Start in edit mode (no pre-start delay)
  movementDelayActive = false;
  
  // Load default theme and first preset
  switchTheme('default');
  
  // Initialize video player
  if (typeof initVideoPlayer === 'function') {
    initVideoPlayer();
  }
  
  // Load bubble button PNGs
  loadBubbleButtonPNGs();
  
  // Initialize drawing UI elements
  updateDrawingColorUI();
  updateDrawingWidthUI();
  
  // Initialize auto-save system
  initializeAutoSave();
  
  // Start rendering
  draw();
  
  logger.info("✅ MindsEye initialized successfully");
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
  // Canvas click (left click for adding bubbles only)
  canvas.addEventListener("click", (e) => {
    if (isDragging) return; // Don't add bubbles while dragging
    if (isDrawingMode) return; // Don't add bubbles while in drawing mode
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let clicked = false;
    
    for (let idea of ideas) {
      const dx = x - idea.x;
      const dy = y - idea.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < idea.radius) {
        selectedIdea = idea;
        const panel = document.getElementById('panel');
        if (panel.style.display === 'block') {
          showPanel();
        }
        clicked = true;
        break;
      }
    }
    if (!clicked) addIdea(x, y);
  });

  // Touch to create/select bubbles
  canvas.addEventListener("touchstart", (e) => {
    if (isDragging) return;
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Double-tap detection
    const now = Date.now();
    window.__lastTapTime = window.__lastTapTime || 0;
    const isDoubleTap = (now - window.__lastTapTime) < 350; // 350ms window
    window.__lastTapTime = now;

    // Hit test
    let tappedBubble = null;
    for (let idea of ideas) {
      const dx = x - idea.x;
      const dy = y - idea.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < idea.radius) { tappedBubble = idea; break; }
    }

    // If currently in drawing mode: only allow double-tap to toggle out/in
    if (isDrawingMode) {
      if (isDoubleTap) {
        toggleDrawingMode();
      }
      e.preventDefault();
      return;
    }

    // Not in drawing mode (bubble mode)
    if (tappedBubble) {
      selectedIdea = tappedBubble;
      if (isDoubleTap) {
        showPanel();
      }
    } else {
      if (isDoubleTap) {
        // Double-tap empty area switches to drawing mode (no bubble creation)
        toggleDrawingMode();
      } else {
        // Single tap empty area creates a bubble
        addIdea(x, y);
      }
    }
    e.preventDefault();
  }, { passive: false });

  // Right-click behavior
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    
    // Stop any dragging that might be happening
    isDragging = false;
    draggedIdea = null;
    
    // In bubble mode, check if right-clicking on a bubble first
    if (!isDrawingMode) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      for (let idea of ideas) {
        const dx = x - idea.x;
        const dy = y - idea.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < idea.radius) {
          selectedIdea = idea;
          
          // Check if panel is already open for this bubble
          const panel = document.getElementById('panel');
          if (panel.style.display === 'block' && selectedIdea === idea) {
            // Panel is open for this bubble - close it
            closePanel();
          } else {
            // Panel is not open or for different bubble - show panel
            showPanel();
          }
          logger.debug('💭 Bubble panel toggled via right-click on bubble');
          return;
        }
      }
    }
    
    // If not clicking on a bubble (or in drawing mode), toggle drawing mode
    toggleDrawingMode();
            logger.debug('🎨 Drawing mode toggled via right-click on canvas');
  });

  // Double-click behavior depends on mode
  canvas.addEventListener("dblclick", (e) => {
    if (isDrawingMode) {
      // In drawing mode: clear drawings
      clearDrawingOnly();
      drawingPaths = [];
              logger.debug('🧽 Drawings cleared via double-click');
    } else {
      // In bubble mode: open bubble panel
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      for (let idea of ideas) {
        const dx = x - idea.x;
        const dy = y - idea.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < idea.radius) {
          selectedIdea = idea;
          
          // Check if panel is already open for this bubble
          const panel = document.getElementById('panel');
          if (panel.style.display === 'block' && selectedIdea === idea) {
            // Panel is open for this bubble - close it
            closePanel();
          } else {
            // Panel is not open or for different bubble - show panel
            showPanel();
          }
          logger.debug('💭 Bubble panel toggled via double-click');
          return;
        }
      }
      
      // Double-click on empty space - close panel if open
      const panel = document.getElementById('panel');
      if (panel.style.display === 'block') {
        closePanel();
        logger.debug('💭 Bubble panel closed via double-click on empty space');
      }
    }
  });

  // Drag and drop functionality
  canvas.addEventListener("mousedown", (e) => {
    if (isDrawingMode) return; // Don't drag bubbles while in drawing mode
    
    // Only start dragging on left-click (button 0), not right-click (button 2)
    if (e.button !== 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (let idea of ideas) {
      const dx = x - idea.x;
      const dy = y - idea.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < idea.radius) {
        isDragging = true;
        draggedIdea = idea;
        dragOffsetX = dx;
        dragOffsetY = dy;
        selectedIdea = idea;
        // Don't show panel on drag start
        break;
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging || !draggedIdea) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    draggedIdea.x = x - dragOffsetX;
    draggedIdea.y = y - dragOffsetY;
    
    // Keep bubble within bounds
    if (draggedIdea.x - draggedIdea.radius < border) {
      draggedIdea.x = border + draggedIdea.radius;
    }
    if (draggedIdea.x + draggedIdea.radius > width - border) {
      draggedIdea.x = width - border - draggedIdea.radius;
    }
    if (draggedIdea.y - draggedIdea.radius < border + 50) {
      draggedIdea.y = border + 50 + draggedIdea.radius;
    }
    if (draggedIdea.y + draggedIdea.radius > height - border) {
      draggedIdea.y = height - border - draggedIdea.radius;
    }
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    // When user releases a dragged bubble while a timeline exists (in/out set), record an auto keyframe
    try {
      if (typeof window.AnimationState !== 'undefined' && window.AnimationState.data) {
        const anim = window.AnimationState.data;
        const hasInOut = typeof anim.inPoint === 'number' && typeof anim.outPoint === 'number' && anim.outPoint > anim.inPoint;
        if (hasInOut) {
          // Ensure we have base keyframes
          if (!anim.keyframes || anim.keyframes.length < 2) {
            const durationSeconds = (anim.duration || 10000) / 1000;
            const basePositions = typeof window.captureBubblePositions === 'function' ? window.captureBubblePositions() : [];
            anim.keyframes = [
              { time: 0, positions: basePositions },
              { time: durationSeconds, positions: basePositions }
            ];
          }
          // Determine current timeline time (from media slider if available)
          const slider = document.getElementById('mediaPlaybackSlider');
          const durationSeconds = (anim.duration || 10000) / 1000;
          let currentTime = 0;
          if (slider) {
            const progress = Math.max(0, Math.min(1, parseFloat(slider.value) || 0));
            currentTime = progress * durationSeconds;
          }
          // Clamp to (inPoint, outPoint)
          const epsilon = 0.01;
          currentTime = Math.max(anim.inPoint + epsilon, Math.min(anim.outPoint - epsilon, currentTime));
          // Capture positions and insert/update keyframe at this time
          if (typeof window.captureBubblePositions === 'function') {
            const positions = window.captureBubblePositions();
            // Find existing keyframe at this time (within small tolerance)
            const existingIdx = anim.keyframes.findIndex(kf => Math.abs(kf.time - currentTime) < 0.001);
            if (existingIdx !== -1) {
              anim.keyframes[existingIdx].positions = positions;
              anim.keyframes[existingIdx].time = currentTime;
            } else {
              anim.keyframes.push({ time: currentTime, positions });
            }
            // Keep sorted
            anim.keyframes.sort((a, b) => a.time - b.time);
            // Reflect marker
            if (typeof window.addTimelineMarker === 'function') {
              window.addTimelineMarker('keyframe', currentTime);
            }
          }
        }
      }
    } catch (e) {
      // Non-fatal if animation system isn't present
    }
    draggedIdea = null;
  });

  // Touch drag support for mobile
  canvas.addEventListener("touchstart", (e) => {
    if (isDrawingMode) return;
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    for (let idea of ideas) {
      const dx = x - idea.x;
      const dy = y - idea.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < idea.radius) {
        isDragging = true;
        draggedIdea = idea;
        dragOffsetX = dx;
        dragOffsetY = dy;
        selectedIdea = idea;
        e.preventDefault();
        break;
      }
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (!isDragging || !draggedIdea) return;
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    draggedIdea.x = x - dragOffsetX;
    draggedIdea.y = y - dragOffsetY;
    if (draggedIdea.x - draggedIdea.radius < border) {
      draggedIdea.x = border + draggedIdea.radius;
    }
    if (draggedIdea.x + draggedIdea.radius > width - border) {
      draggedIdea.x = width - border - draggedIdea.radius;
    }
    if (draggedIdea.y - draggedIdea.radius < border + 50) {
      draggedIdea.y = border + 50 + draggedIdea.radius;
    }
    if (draggedIdea.y + draggedIdea.radius > height - border) {
      draggedIdea.y = height - border - draggedIdea.radius;
    }
    e.preventDefault();
  }, { passive: false });

  const endTouchDrag = () => {
    isDragging = false;
    try {
      if (typeof window.AnimationState !== 'undefined' && window.AnimationState.data) {
        const anim = window.AnimationState.data;
        const hasInOut = typeof anim.inPoint === 'number' && typeof anim.outPoint === 'number' && anim.outPoint > anim.inPoint;
        if (hasInOut) {
          if (!anim.keyframes || anim.keyframes.length < 2) {
            const durationSeconds = (anim.duration || 10000) / 1000;
            const basePositions = typeof window.captureBubblePositions === 'function' ? window.captureBubblePositions() : [];
            anim.keyframes = [
              { time: 0, positions: basePositions },
              { time: durationSeconds, positions: basePositions }
            ];
          }
          const slider = document.getElementById('mediaPlaybackSlider');
          const durationSeconds = (anim.duration || 10000) / 1000;
          let currentTime = 0;
          if (slider) {
            const progress = Math.max(0, Math.min(1, parseFloat(slider.value) || 0));
            currentTime = progress * durationSeconds;
          }
          const epsilon = 0.01;
          currentTime = Math.max(anim.inPoint + epsilon, Math.min(anim.outPoint - epsilon, currentTime));
          if (typeof window.captureBubblePositions === 'function') {
            const positions = window.captureBubblePositions();
            const existingIdx = anim.keyframes.findIndex(kf => Math.abs(kf.time - currentTime) < 0.001);
            if (existingIdx !== -1) {
              anim.keyframes[existingIdx].positions = positions;
              anim.keyframes[existingIdx].time = currentTime;
            } else {
              anim.keyframes.push({ time: currentTime, positions });
            }
            anim.keyframes.sort((a, b) => a.time - b.time);
            if (typeof window.addTimelineMarker === 'function') {
              window.addTimelineMarker('keyframe', currentTime);
            }
          }
        }
      }
    } catch (_) {}
    draggedIdea = null;
  };

  canvas.addEventListener("touchend", (e) => {
    endTouchDrag();
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchcancel", (e) => {
    endTouchDrag();
    e.preventDefault();
  }, { passive: false });

  // Gamepad controls
  let gamepadConnected = false;
  let lastGamepadState = {};
  
  function handleGamepadInput() {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Use first connected gamepad
    
    if (!gamepad) {
      gamepadConnected = false;
      return;
    }
    
    if (!gamepadConnected) {
      logger.info('🎮 PS5 Controller connected:', gamepad.id);
      gamepadConnected = true;
    }
    
    // PS5 Controller button mapping
    const buttons = gamepad.buttons;
    const axes = gamepad.axes;
    const currentState = {};
    
    // Check button states
    currentState.L1 = buttons[4].pressed; // L1
    currentState.R1 = buttons[5].pressed; // R1
    currentState.L2 = buttons[6].pressed; // L2
    currentState.R2 = buttons[7].pressed; // R2
    currentState.Triangle = buttons[3].pressed; // Triangle
    currentState.Circle = buttons[1].pressed; // Circle
    currentState.X = buttons[0].pressed; // X
    currentState.Square = buttons[2].pressed; // Square
    
    // Handle button presses (only on press, not hold)
    if (currentState.L1 && !lastGamepadState.L1) {
      logger.debugSparse('🎮 L1 pressed - Previous bubble', null, 60);
      previousBubble();
    }
    
    if (currentState.R1 && !lastGamepadState.R1) {
      logger.debugSparse('🎮 R1 pressed - Next bubble', null, 60);
      nextBubble();
    }
    
    if (currentState.R2 && !lastGamepadState.R2) {
      logger.debugSparse('🎮 R2 pressed - Striker attack', null, 60);
      if (selectedIdea && selectedIdea.shape === 'striker') {
        triggerStrikerAttack(selectedIdea);
      }
    }
    
    if (currentState.L2 && !lastGamepadState.L2) {
      logger.debugSparse('🎮 L2 pressed - Striker capture start', null, 60);
      if (selectedIdea && selectedIdea.shape === 'striker') {
        triggerStrikerCapture(selectedIdea);
      }
    }
    
    // Handle L2 release for striker capture
    if (!currentState.L2 && lastGamepadState.L2) {
      logger.debugSparse('🎮 L2 released - Striker capture end', null, 60);
      if (strikerCaptureMode && capturedBubble) {
        endStrikerCapture(); // Only release if a bubble is captured
      }
    }
    
    if (currentState.Triangle && !lastGamepadState.Triangle) {
      logger.debugSparse('🎮 Triangle pressed - Toggle video player', null, 60);
      if (typeof toggleVideoPlayer === 'function') {
        toggleVideoPlayer();
      }
    }
    
    if (currentState.Circle && !lastGamepadState.Circle) {
      logger.debugSparse('🎮 Circle pressed - Toggle music panel', null, 60);
      if (typeof toggleMusicPanel === 'function') {
        toggleMusicPanel();
      }
    }
    
    if (currentState.X && !lastGamepadState.X) {
      logger.debugSparse('🎮 X pressed - Select/scroll music track', null, 60);
      handleMusicTrackSelection();
    }
    
    if (currentState.Square && !lastGamepadState.Square) {
      logger.debugSparse('🎮 Square pressed - Close panels', null, 60);
      closeAllPanels();
    }
    
    // Handle analog stick movement for bubble control
    if (selectedIdea) {
      const moveAmount = 3; // Slightly slower than keyboard for precision
      let moved = false;
      
      // Left stick (axes 0 and 1) for movement
      const leftStickX = axes[0]; // Left/Right
      const leftStickY = axes[1]; // Up/Down
      
      // Apply deadzone to prevent drift
      const deadzone = 0.1;
      
      if (Math.abs(leftStickX) > deadzone) {
        selectedIdea.x += leftStickX * moveAmount;
        moved = true;
      }
      
      if (Math.abs(leftStickY) > deadzone) {
        selectedIdea.y += leftStickY * moveAmount;
        moved = true;
      }
      
      if (moved) {
        // Keep bubble within bounds (same as keyboard movement)
        if (selectedIdea.x - selectedIdea.radius < border) {
          selectedIdea.x = border + selectedIdea.radius;
        }
        if (selectedIdea.x + selectedIdea.radius > width - border) {
          selectedIdea.x = width - border - selectedIdea.radius;
        }
        if (selectedIdea.y - selectedIdea.radius < border + 50) {
          selectedIdea.y = border + 50 + selectedIdea.radius;
        }
        if (selectedIdea.y + selectedIdea.radius > height - border) {
          selectedIdea.y = height - border - selectedIdea.radius;
        }
      }
      
      // Debug analog stick values (only log occasionally to avoid spam)
      if (Math.abs(leftStickX) > 0.05 || Math.abs(leftStickY) > 0.05) {
        // Only log every 120 frames to reduce spam even more
        if (!window.analogLogFrame || window.analogLogFrame % 120 === 0) {
          logger.debugSparse(`🎮 Analog stick: X=${leftStickX.toFixed(2)}, Y=${leftStickY.toFixed(2)}`, null, 180);
        }
        window.analogLogFrame = (window.analogLogFrame || 0) + 1;
      }
    }
    
    // Update last state
    lastGamepadState = currentState;
  }
  
  // Gamepad polling
  setInterval(handleGamepadInput, 16); // ~60fps polling
  
  // Gamepad connection events
  window.addEventListener("gamepadconnected", (e) => {
    logger.debugSparse('🎮 Gamepad connected:', e.gamepad.id, null, 60);
    gamepadConnected = true;
    
    // Debug gamepad info (only in debug mode)
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      setTimeout(() => {
        debugGamepadInfo();
      }, 1000);
    }
  });
  
  window.addEventListener("gamepaddisconnected", (e) => {
    logger.debugSparse('🎮 Gamepad disconnected:', e.gamepad.id, null, 60);
    gamepadConnected = false;
  });
  
  function debugGamepadInfo() {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0];
    
    if (gamepad) {
      logger.debug('🎮 Gamepad debug info:', {
        id: gamepad.id,
        axes: gamepad.axes.length,
        buttons: gamepad.buttons.length
      });
    }
  }
  
  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    // Check if bubble panel is open - if so, don't intercept keyboard shortcuts
    // EXCEPT for ESC key which should always work to close panels
    const panel = document.getElementById('panel');
    if (panel && panel.style.display === 'block' && e.key !== 'Escape') {
      // Allow 'B' to toggle the bubble panel when not typing in inputs/textareas
      const targetTag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
      const isTypingTarget = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || (e.target && e.target.isContentEditable);
      const isBKey = e.key === 'b' || e.key === 'B';
      if (!(isBKey && !isTypingTarget)) {
        return; // Allow normal text input in panel, but let ESC and non-typing 'B' through
      }
    }
    
    // Handle general shortcuts that work without selected bubble
    switch(e.key) {
      case "Escape":
        logger.debugSparse('🔍 ESC key detected!', null, 60);
        // ESC closes any open panels
        closeAllPanels();
        e.preventDefault();
        return;
      case " ":
        // Spacebar behavior depends on drawing mode
        if (isDrawingMode) {
          // If in drawing mode, exit drawing mode and restart speed
          toggleDrawingMode();
          // Speed is already restored by toggleDrawingMode(), no need to call toggleSpeed()
        } else {
          // Normal spacebar behavior: toggle speed (pause/unpause)
          toggleSpeed();
        }
        e.preventDefault();
        return;
      case "v":
      case "V":
        // V opens video playlist (but not when Ctrl+V or Cmd+V for paste)
        if (!e.ctrlKey && !e.metaKey && typeof videoTogglePlaylist === 'function') {
          videoTogglePlaylist();
          e.preventDefault();
        }
        return;
      case "m":
      case "M":
        // M opens music playlist
        if (typeof toggleMusicPanel === 'function') {
          toggleMusicPanel();
        }
        e.preventDefault();
        return;
      case "p":
      case "P":
        // P pauses/plays MP4 video
        if (typeof pauseMp4Video === 'function') {
          pauseMp4Video();
        }
        e.preventDefault();
        return;
      case "b":
      case "B":
        // B toggles bubble panel visibility
        toggleBubblePanel();
        e.preventDefault();
        return;
      case "u":
      case "U":
        // U duplicates selected bubble
        if (selectedIdea && !e.target.matches('input, textarea')) {
          duplicateBubble(selectedIdea);
        }
        e.preventDefault();
        return;
      // S key shortcut removed - conflicts with smooth drawing shortcut
      // Search functionality available through bubble panel instead
      case "d":
      case "D":
        // D toggles drawing mode
        logger.info('🎨 D key pressed - toggling drawing mode');
        toggleDrawingMode();
        e.preventDefault();
        return;
      case "m":
      case "M":
        // M opens music panel (existing functionality)
        if (typeof toggleMusicPanel === 'function') {
          toggleMusicPanel();
        }
        e.preventDefault();
        return;
      case "p":
      case "P":
        // P pauses/plays MP4 video (existing functionality)
        if (typeof pauseMp4Video === 'function') {
          pauseMp4Video();
        }
        e.preventDefault();
        return;
      case "-":
        // Minus decreases speed multiplier
        if (speedMultiplier > 0.1) { // Minimum speed limit
          speedMultiplier = Math.max(0.1, speedMultiplier - 0.1);
          speedMultiplier = Math.round(speedMultiplier * 10) / 10; // Round to 1 decimal
          // Update speed slider if it exists
          const speedSlider = document.querySelector('input[type="range"][max="3"]');
          if (speedSlider) {
            speedSlider.value = speedMultiplier;
          }
          logger.debug('⚡ Speed decreased to:', speedMultiplier);
        }
        e.preventDefault();
        return;
      case "+":
      case "=": // Handle both + and = keys (since + requires shift)
        // Plus increases speed multiplier
        if (speedMultiplier < 3.0) { // Maximum speed limit
          speedMultiplier = Math.min(3.0, speedMultiplier + 0.1);
          speedMultiplier = Math.round(speedMultiplier * 10) / 10; // Round to 1 decimal
          // Update speed slider if it exists
          const speedSlider = document.querySelector('input[type="range"][max="3"]');
          if (speedSlider) {
            speedSlider.value = speedMultiplier;
          }
          logger.debug('⚡ Speed increased to:', speedMultiplier);
        }
        e.preventDefault();
        return;
    }
    
    if (!selectedIdea) return;
    
    const moveAmount = 5;
    let moved = false;
    
    switch(e.key) {
      case "ArrowUp":
        selectedIdea.y -= moveAmount;
        moved = true;
        break;
      case "ArrowDown":
        selectedIdea.y += moveAmount;
        moved = true;
        break;
      case "ArrowLeft":
        selectedIdea.x -= moveAmount;
        moved = true;
        break;
      case "ArrowRight":
        selectedIdea.x += moveAmount;
        moved = true;
        break;
      case "Shift":
        // Shift key triggers bubble bounce (striker attack)
        if (selectedIdea.shape === 'striker') {
          triggerStrikerAttack(selectedIdea);
          e.preventDefault();
        }
        break;
      case ".":
        // Period triggers bubble collect (striker capture)
        if (selectedIdea.shape === 'striker') {
          triggerStrikerCapture(selectedIdea);
          e.preventDefault();
        }
        break;
      case "s":
      case "S":
        // S key smooths the last drawn line (works in drawing mode)
        if (isDrawingMode && drawingPaths.length > 0) {
          smoothLastLine();
          e.preventDefault();
        }
        break;
      case "[":
        // Left bracket decreases bubble size
        if (selectedIdea.radius > 20) { // Minimum size limit
          selectedIdea.radius -= 5;
          e.preventDefault();
        }
        break;
      case "]":
        // Right bracket increases bubble size
        if (selectedIdea.radius < 200) { // Maximum size limit
          selectedIdea.radius += 5;
          e.preventDefault();
        }
        break;
    }
    
    if (moved) {
      e.preventDefault();
      
      // Keep bubble within bounds
      if (selectedIdea.x - selectedIdea.radius < border) {
        selectedIdea.x = border + selectedIdea.radius;
      }
      if (selectedIdea.x + selectedIdea.radius > width - border) {
        selectedIdea.x = width - border - selectedIdea.radius;
      }
      if (selectedIdea.y - selectedIdea.radius < border + 50) {
        selectedIdea.y = border + 50 + selectedIdea.radius;
      }
      if (selectedIdea.y + selectedIdea.radius > height - border) {
        selectedIdea.y = height - border - selectedIdea.radius;
      }
    }
  });

  // File loader
  document.getElementById("fileLoader").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const loaded = JSON.parse(event.target.result);
        ideas = loaded.map(idea => ({
          ...idea,
          font: idea.font || fonts[0],
          radius: idea.radius || 80,
          fontSize: idea.fontSize || 14,
          rotation: idea.rotation || 0,
          shape: idea.shape || 'circle',
          heightRatio: idea.heightRatio || 1.0,
          showPauseBorder: idea.showPauseBorder || false,
          createdDate: idea.createdDate || new Date().toISOString().split('T')[0],
          createdTime: idea.createdTime || new Date().toTimeString().split(' ')[0],
          // Goal properties
          goals: idea.goals || 0,
          flashUntil: idea.flashUntil || 0,
          // Ball properties
          ballVelocityBoost: idea.ballVelocityBoost || 0,
          ballVelocityDecay: idea.ballVelocityDecay || 0,
          // Ensure attachments array exists and restore minimal metadata
          attachments: Array.isArray(idea.attachments) ? idea.attachments.map(att => ({
            name: att.name,
            type: att.type,
            url: att.url || '',
            isObjectUrl: !!att.isObjectUrl,
            originalName: att.originalName || att.name || ''
          })) : [],
          // Restore URLs list if present
          urls: Array.isArray(idea.urls) ? idea.urls.map(u => ({ href: u.href, title: u.title || u.href })) : [],
          // Restore audio stub if present
          audio: idea.audio ? {
            url: idea.audio.url || '',
            name: idea.audio.name || '',
            isObjectUrl: !!idea.audio.isObjectUrl
          } : null
        }));

        // After loading, prefer embedded data URLs if present; else try session folder
        (async () => {
          try {
            for (const idea of ideas) {
              if (Array.isArray(idea.attachments)) {
                for (const att of idea.attachments) {
                  if (att.dataUrl && att.dataUrl.startsWith('data:')) {
                    att.url = att.dataUrl;
                    att.isObjectUrl = false;
                  }
                }
              }
            }
          } catch (_) {}
          await resolveAllExternalAssets(ideas);
          logger.info(`📋 Loaded ${loaded.length} ideas from JSON file:`, file.name);
        })();
        // Remove pre-start slowdown after loading JSON
        movementDelayActive = false;
      } catch (err) {
        logger.error("❌ Invalid JSON file:", err.message);
      }
    };
    reader.readAsText(file);
  });

  // Panel interactions
  const panel = document.getElementById('panel');
  if (panel) {
    panel.addEventListener('mousemove', resetPanelTimer);
    panel.addEventListener('click', resetPanelTimer);
    panel.addEventListener('input', resetPanelTimer);
    panel.addEventListener('change', resetPanelTimer);
  }

  // Attach resize toggle handler
  if (typeof resizePanelToggle === 'function') {
    // no-op, exposed later
  }
  
  // Panel timeout checkbox
  const disableTimeoutCheckbox = document.getElementById('disablePanelTimeout');
  if (disableTimeoutCheckbox) {
    disableTimeoutCheckbox.addEventListener('change', function() {
      if (this.checked) {
        // Disable timeout - clear any existing timeout
        if (panelFadeTimeout) {
          clearTimeout(panelFadeTimeout);
          panelFadeTimeout = null;
        }
        logger.debug('⏰ Panel timeout disabled');
      } else {
        // Re-enable timeout - start the timer again
        resetPanelFade();
        logger.debug('⏰ Panel timeout enabled');
      }
    });
  }
  
  // Image upload functionality
  const uploadImage = document.getElementById('uploadImage');
  if (uploadImage) {
    uploadImage.addEventListener('change', handleImageUpload);
  }
  
  // Image selector functionality
  const imageSelector = document.getElementById('imageSelector');
  if (imageSelector) {
    imageSelector.addEventListener('change', handleImageSelect);
  }
  
  // Shape selector functionality
  const shapeSelector = document.getElementById('shapeSelector');
  if (shapeSelector) {
    shapeSelector.addEventListener('change', function() {
      if (selectedIdea) {
        selectedIdea.shape = this.value;
        logger.debug('🔷 Shape changed to:', this.value);
        // Update action slider visibility when shape changes
        updateActionSliderVisibility();
      }
    });
  }
  
  // Media toolbar functionality
  const bgLoader = document.getElementById('bgLoader');
  if (bgLoader && typeof handleBackgroundUpload === 'function') {
    bgLoader.addEventListener('change', handleBackgroundUpload);
  }
  
  const videoLoader = document.getElementById('videoLoader');
  if (videoLoader && typeof handleVideoUpload === 'function') {
    videoLoader.addEventListener('change', handleVideoUpload);
  }
  
  // Add click handler for minimized panel
  const panelElement = document.getElementById('panel');
  if (panelElement) {
    panelElement.addEventListener('click', function(e) {
      // Only restore if minimized and click is not on a button
      if (this.classList.contains('minimized') && !e.target.matches('button')) {
        restorePanel();
      }
    });
  }
  
  // Drawing mode event listeners (mouse)
  canvas.addEventListener('mousedown', startDrawing, true);
  canvas.addEventListener('mousemove', drawLine, true);
  canvas.addEventListener('mouseup', stopDrawing, true);
  canvas.addEventListener('mouseleave', stopDrawing, true);

  // Touch support for drawing
  canvas.addEventListener('touchstart', (e) => {
    if (!isDrawingMode) return;
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, preventDefault: ()=>{}, stopPropagation: ()=>{} };
    startDrawing(fakeEvent);
    e.preventDefault();
  }, { passive: false, capture: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDrawingMode || !e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, preventDefault: ()=>{}, stopPropagation: ()=>{} };
    drawLine(fakeEvent);
    e.preventDefault();
  }, { passive: false, capture: true });

  canvas.addEventListener('touchend', (e) => {
    if (!isDrawingMode) return;
    stopDrawing();
    e.preventDefault();
  }, { passive: false, capture: true });
  canvas.addEventListener('touchcancel', (e) => {
    if (!isDrawingMode) return;
    stopDrawing();
    e.preventDefault();
  }, { passive: false, capture: true });
  
  // Keyboard shortcuts for drawing
  document.addEventListener('keydown', (e) => {
    // Check if bubble panel is open - if so, don't intercept keyboard shortcuts
    const panel = document.getElementById('panel');
    if (panel && panel.style.display === 'block') {
      return; // Allow normal text input in panel
    }
    
    // Drawing shortcuts work regardless of drawing mode state
    switch(e.key) {
      case 'w':
      case 'W':
        if (isDrawingMode) {
          changeDrawingWidth();
        }
        break;
      case 'c':
      case 'C':
        if (isDrawingMode) {
          changeDrawingColor();
        }
        break;
      case 's':
      case 'S':
        if (isDrawingMode) {
          smoothLastLine();
          e.preventDefault(); // Prevent browser default behavior
        }
        break;
      case 'x':
      case 'X':
        // X clears drawings in both drawing mode and bubble mode
        clearDrawingOnly();
        break;
      case 'f':
      case 'F':
        if (isDrawingMode) {
          // Toggle flashing of current drawn lines (not bubbles)
          toggleDrawingFlash();
          e.preventDefault(); // Prevent browser default behavior
        }
        break;
      case 'g':
      case 'G':
        if (isDrawingMode) {
          // DISABLED: toggleDrawingGlow();
          logger.warn('⚠️ Glow function temporarily disabled to prevent bubble interference');
          e.preventDefault(); // Prevent browser default behavior
        }
        break;
    }
  });
}

// ===== DESCRIPTION INPUT MODAL HANDLERS =====
function openDescriptionInput() {
  try {
    const modal = document.getElementById('descriptionInputModal');
    const textarea = document.getElementById('descriptionInputText');
    const panelDesc = document.getElementById('description');
    if (!modal || !textarea || !panelDesc) return;
    // Seed with current description (from selected idea if present, else from panel)
    const current = (typeof selectedIdea !== 'undefined' && selectedIdea && typeof selectedIdea.description === 'string')
      ? selectedIdea.description
      : panelDesc.value || '';
    textarea.value = current;
    modal.style.display = 'flex';
  } catch (_) {}
}

function closeDescriptionInput() {
  const modal = document.getElementById('descriptionInputModal');
  if (modal) modal.style.display = 'none';
}

function saveDescriptionInput() {
  const textarea = document.getElementById('descriptionInputText');
  const panelDesc = document.getElementById('description');
  if (!textarea || !panelDesc) return;
  const newText = textarea.value;
  // Update selected idea if present
  if (typeof selectedIdea !== 'undefined' && selectedIdea) {
    selectedIdea.description = newText;
  }
  // Sync panel description field
  panelDesc.value = newText;
  closeDescriptionInput();
}

function resizePanelToggle() {
  const panel = document.getElementById('panel');
  if (!panel) return;
  if (panel.style.width === '300px' || !panel.style.width) {
    panel.style.width = '500px';
    panel.style.height = '70vh';
  } else {
    panel.style.width = '300px';
    panel.style.height = 'auto';
  }
}

window.resizePanelToggle = resizePanelToggle;

// Attempt to re-resolve attachments/audio URLs from a local session folder
async function resolveAllExternalAssets(ideasArr) {
  try {
    const sessionFolder = 'session_uploads/'; // configurable base folder under project root
    for (const idea of ideasArr) {
      // Resolve attachments
      if (Array.isArray(idea.attachments)) {
        for (const att of idea.attachments) {
          if (att && att.url && att.isObjectUrl !== true) {
            // If URL already usable (http(s) or data:), skip
            if (/^(https?:|data:)/i.test(att.url)) continue;
            // Try session folder by originalName first, fallback to url string
            const candidate = sessionFolder + (att.originalName || att.name || att.url);
            try {
              const res = await fetch(candidate, { method: 'HEAD' });
              if (res.ok) {
                att.url = candidate;
                att.isObjectUrl = false;
              }
            } catch (_) {}
          }
        }
      }
      // Resolve audio
      if (idea.audio && idea.audio.url && idea.audio.isObjectUrl !== true) {
        if (!/^(https?:|data:)/i.test(idea.audio.url)) {
          const candidate = sessionFolder + (idea.audio.name || 'audio');
          try {
            const res = await fetch(candidate, { method: 'HEAD' });
            if (res.ok) {
              idea.audio.url = candidate;
              idea.audio.isObjectUrl = false;
            }
          } catch (_) {}
        }
      }
    }
  } catch (e) {
    logger.warn('⚠️ resolveAllExternalAssets encountered an issue:', e && e.message ? e.message : e);
  }
}

// Dynamically anchor key panels just below the toolbar bottom edge
function updatePanelAnchors() {
  try {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) return;
    const rect = toolbar.getBoundingClientRect();
    // For fixed toolbar and fixed panels, use viewport coordinates only
    // 20px gap below toolbar
    const topPx = Math.max(0, Math.round(rect.bottom + 20));
    const topValue = topPx + 'px';

    const bubblePanel = document.getElementById('panel');
    if (bubblePanel) bubblePanel.style.top = topValue;

    const musicPanel = document.getElementById('musicPanel');
    if (musicPanel) musicPanel.style.top = topValue;

    const videoPanel = document.getElementById('videoPlaylist');
    if (videoPanel) videoPanel.style.top = topValue;
  } catch (_) {
    // no-op
  }
}

// Observe toolbar layout changes to keep panels anchored
function installToolbarAnchorObservers() {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;

  // Initial position
  updatePanelAnchors();

  // On window resize and scroll
  window.addEventListener('resize', updatePanelAnchors);
  window.addEventListener('orientationchange', updatePanelAnchors);
  window.addEventListener('scroll', updatePanelAnchors, { passive: true });

  // Also after load to ensure accurate measurements
  window.addEventListener('load', updatePanelAnchors);

  // On DOM mutations within the toolbar that change size
  try {
    const observer = new MutationObserver(() => {
      // micro-debounce via rAF
      requestAnimationFrame(updatePanelAnchors);
    });
    observer.observe(toolbar, { attributes: true, childList: true, subtree: true });
  } catch (_) {}
}

function toggleSpeed() {
  const speedSlider = document.querySelector('input[type="range"]');
  if (speedMultiplier === 0) {
    // If currently paused, restore to previous speed
    speedMultiplier = previousSpeed;
    speedSlider.value = previousSpeed;
    speedSlider.classList.remove('paused');
    logger.info('▶️ Animation resumed at speed:', previousSpeed);
    
    // Ensure media toolbar is hidden when running
    if (typeof toggleMediaToolbarVisibilityOnly === 'function') {
      const bar = document.getElementById('mediaToolbar');
      if (bar && (bar.style.display === 'flex' || getComputedStyle(bar).display === 'flex')) {
        logger.info('📺 Hiding media toolbar (spacebar resume)');
        toggleMediaToolbarVisibilityOnly();
      }
    }
  } else {
    // If currently running, pause and remember current speed
    previousSpeed = speedMultiplier;
    originalSpeed = speedMultiplier; // Update original speed
    speedMultiplier = 0;
    speedSlider.value = 0;
    speedSlider.classList.add('paused');
    logger.info('⏸️ Animation paused');
    
    // Ensure media toolbar is shown when paused
    if (typeof toggleMediaToolbarVisibilityOnly === 'function') {
      const bar = document.getElementById('mediaToolbar');
      if (bar && (bar.style.display === 'none' || getComputedStyle(bar).display === 'none')) {
        logger.info('📺 Showing media toolbar (spacebar pause)');
        toggleMediaToolbarVisibilityOnly();
      }
    }
  }
  // Keep toolbar icon in sync when spacebar toggles speed
  if (typeof updatePauseButtonIcon === 'function') {
    updatePauseButtonIcon();
  }
}

function togglePauseButton() {
  const speedSlider = document.querySelector('input[type="range"]');
  
  // If in drawing mode, exit drawing mode instead of toggling pause
  if (isDrawingMode) {
            logger.debug('⏯️ Pause button pressed while in drawing mode - exiting drawing mode');
    toggleDrawingMode();
    return;
  }
  
  if (speedMultiplier === 0) {
    // If currently paused, restore to previous speed
    speedMultiplier = previousSpeed;
    speedSlider.value = previousSpeed;
    speedSlider.classList.remove('paused');
    
    // Ensure media toolbar is hidden when running
    if (typeof toggleMediaToolbar === 'function') {
      const bar = document.getElementById('mediaToolbar');
      if (bar && (bar.style.display === 'flex' || getComputedStyle(bar).display === 'flex')) {
        toggleMediaToolbar();
      }
    }
  } else {
    // If currently running, pause and remember current speed
    previousSpeed = speedMultiplier;
    speedMultiplier = 0;
    speedSlider.value = 0;
    speedSlider.classList.add('paused');
    
    // Ensure media toolbar is shown when paused
    if (typeof toggleMediaToolbar === 'function') {
      const bar = document.getElementById('mediaToolbar');
      if (bar && (bar.style.display === 'none' || getComputedStyle(bar).display === 'none')) {
        toggleMediaToolbar();
      }
    }
  }
  
  // Update the pause button icon
  if (typeof updatePauseButtonIcon === 'function') {
    updatePauseButtonIcon();
  }
}

// ===== TEST FUNCTIONS =====

function testImageUpload() {
  logger.debug('🧪 Testing image upload functionality...');
  logger.info('🧪 Image upload test - functionality working!');
}

function testEffects() {
  logger.debug('🎭 Testing effects functionality...');
  logger.info('🎭 Effects test - functionality working!');
}

function toggleBubblePanel() {
  const panel = document.getElementById('panel');
  if (!panel) {
    logger.warn('⚠️ Bubble panel not found');
    return;
  }
  
  const computedStyle = window.getComputedStyle(panel);
  if (computedStyle.display !== 'none') {
    // Panel is open, close it
    closePanel();
    logger.debug('🫧 Bubble panel closed');
  } else {
    // Panel is closed, open it
    if (!selectedIdea) {
      // No bubble selected, select the last one (most recently added)
      if (ideas && ideas.length > 0) {
        selectedIdea = ideas[ideas.length - 1];
        logger.debug('🫧 Auto-selected last bubble for panel');
      } else {
        logger.warn('⚠️ No bubbles available to show panel');
        return;
      }
    }
    showPanel();
    logger.debug('🫧 Bubble panel opened');
  }
}

function closeAllPanels() {
  logger.debug('🔍 ESC pressed - checking panels...');
  
  // Close bubble panel
  const panel = document.getElementById('panel');
  if (panel) {
    const computedStyle = window.getComputedStyle(panel);
    if (computedStyle.display !== 'none') {
      closePanel();
      logger.debug('🚪 Bubble panel closed via ESC');
    }
  }
  
  // Close drawing settings panel
  const drawingSettingsPanel = document.getElementById('drawingSettingsPanel');
  if (drawingSettingsPanel && drawingSettingsPanel.style.display === 'block') {
    hideDrawingSettingsPanel();
    logger.debug('🚪 Drawing settings panel closed via ESC');
  }
  
  // Close analysis panel
  const analysisPanel = document.getElementById('analysisPanel');
  if (analysisPanel && analysisPanel.style.display === 'block') {
    hideAnalysisPanel();
    logger.debug('🚪 Analysis panel closed via ESC');
  }
  
  // Close analysis iframe container
  const analysisIframeContainer = document.getElementById('analysisIframeContainer');
  if (analysisIframeContainer && analysisIframeContainer.style.display === 'block') {
    closeAnalysisIframe();
    logger.debug('🚪 Analysis iframe closed via ESC');
  }
  
  // Close music panel
  const musicPanel = document.getElementById('musicPanel');
  if (musicPanel && musicPanel.style.display === 'block') {
    if (typeof toggleMusicPanel === 'function') {
      toggleMusicPanel();
      logger.debug('🚪 Music panel closed via ESC');
    }
  }
  
  // Close video playlist
  const videoPlaylist = document.getElementById('videoPlaylist');
  if (videoPlaylist && videoPlaylist.style.display === 'block') {
    if (typeof videoTogglePlaylist === 'function') {
      videoTogglePlaylist();
      logger.debug('🚪 Video playlist closed via ESC');
    }
  }
  
  // Close read panel
  const readPanel = document.getElementById('readPanel');
  if (readPanel && readPanel.style.display === 'block') {
    if (typeof hideReadPanel === 'function') {
      hideReadPanel();
      // Logging removed for performance
    }
  }
  
  // Logging removed for performance
}

// Gamepad helper functions
function previousBubble() {
  if (!ideas || ideas.length === 0) return;
  
  let currentIndex = -1;
  if (selectedIdea) {
    currentIndex = ideas.indexOf(selectedIdea);
  }
  
  // Go to previous bubble, wrap around to end
  let newIndex = currentIndex - 1;
  if (newIndex < 0) {
    newIndex = ideas.length - 1;
  }
  
  selectedIdea = ideas[newIndex];
  showPanel();
  // Logging removed for performance
}

function nextBubble() {
  if (!ideas || ideas.length === 0) return;
  
  let currentIndex = -1;
  if (selectedIdea) {
    currentIndex = ideas.indexOf(selectedIdea);
  }
  
  // Go to next bubble, wrap around to beginning
  let newIndex = currentIndex + 1;
  if (newIndex >= ideas.length) {
    newIndex = 0;
  }
  
  selectedIdea = ideas[newIndex];
  showPanel();
  // Logging removed for performance
}

function handleMusicTrackSelection() {
  const musicPanel = document.getElementById('musicPanel');
  const musicList = document.getElementById('musicList');
  
  if (!musicPanel || musicPanel.style.display === 'none') {
    // If music panel is closed, open it
    if (typeof toggleMusicPanel === 'function') {
      toggleMusicPanel();
      // Logging removed for performance
    }
    return;
  }
  
  // If music panel is open, cycle through tracks
  if (musicList) {
    const musicItems = musicList.querySelectorAll('.music-item');
    if (musicItems.length === 0) return;
    
    // Find currently playing track
    let currentIndex = -1;
    for (let i = 0; i < musicItems.length; i++) {
      if (musicItems[i].classList.contains('playing')) {
        currentIndex = i;
        break;
      }
    }
    
    // Go to next track
    let nextIndex = currentIndex + 1;
    if (nextIndex >= musicItems.length) {
      nextIndex = 0;
    }
    
    // Simulate click on next track
    if (musicItems[nextIndex]) {
      musicItems[nextIndex].click();
      // Logging removed for performance
    }
  }
}

function togglePanelSide() {
  const panel = document.getElementById('panel');
  if (panel) {
    const currentLeft = panel.style.left;
    if (currentLeft === '15px' || currentLeft === '') {
      panel.style.left = 'auto';
      panel.style.right = '15px';
      // Logging removed for performance
    } else {
      panel.style.left = '15px';
      panel.style.right = 'auto';
      // Logging removed for performance
    }
  }
}

// ===== BUBBLE BUTTON PNG LOADER =====

function loadBubbleButtonPNGs() {
  // Performance optimized - removed console logging
  const bubbleButtons = document.querySelectorAll('.bubble-btn[data-png]');
  
  bubbleButtons.forEach(button => {
    const pngName = button.getAttribute('data-png');
    if (pngName) {
      const img = new Image();
      img.onload = function() {
        // PNG loaded successfully, apply it
        button.style.backgroundImage = `url(images/${pngName}.png)`;
        button.style.setProperty('background-image', `url(images/${pngName}.png)`, 'important');
        button.classList.add('has-png');
        
        // Special handling for bucheck.png
        if (pngName === 'bucheck') {
          // Force refresh the background style
          setTimeout(() => {
            button.style.setProperty('background-image', `url(images/${pngName}.png)`, 'important');
            button.style.setProperty('background-size', 'contain', 'important');
            button.style.setProperty('background-repeat', 'no-repeat', 'important');
            button.style.setProperty('background-position', 'center', 'important');
          }, 100);
        }
      };
      img.onerror = function() {
        // PNG not found, keep text - silent fail for performance
        if (pngName === 'bucheck') {
          // Only log critical errors for bucheck
          logger.error(`❌ bucheck.png failed to load`);
        }
      };
      img.src = `images/${pngName}.png`;
    }
  });
}

// ===== DEBUGGING FUNCTION FOR PNG LOADING =====
function forceLoadBucheck() {
  // Performance optimized - removed console logging
  const checkButton = document.querySelector('button[data-png="bucheck"]');
  if (checkButton) {
    const img = new Image();
    img.onload = function() {
      checkButton.style.setProperty('background-image', 'url(images/bucheck.png)', 'important');
      checkButton.style.setProperty('background-size', 'contain', 'important');
      checkButton.style.setProperty('background-repeat', 'no-repeat', 'important');
      checkButton.style.setProperty('background-position', 'center', 'important');
      checkButton.style.setProperty('background-color', 'transparent', 'important');
      checkButton.classList.add('has-png');
    };
    img.onerror = function() {
      logger.error('❌ Failed to force load bucheck.png');
    };
    img.src = 'images/bucheck.png';
  }
}

// Make forceLoadBucheck available globally for debugging
window.forceLoadBucheck = forceLoadBucheck;

// Force bucheck button to have PNG immediately on page load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    const bucheckButton = document.querySelector('button[data-png="bucheck"]');
    if (bucheckButton) {
      bucheckButton.classList.add('has-png');
      bucheckButton.style.setProperty('background-image', 'url(images/bucheck.png)', 'important');
    }
  }, 500);
});

// ===== MAIN.JS LOADED =====
// Performance optimized - removed console logging 

// ===== ENHANCED BUBBLE MANAGEMENT =====

function searchBubbles(query) {
  if (!query || query.trim() === '') {
    logger.warn('⚠️ Please enter a search term');
    return [];
  }
  
  const searchTerm = query.toLowerCase().trim();
  const results = ideas.filter(idea => 
    (idea.title && idea.title.toLowerCase().includes(searchTerm)) ||
    (idea.description && idea.description.toLowerCase().includes(searchTerm))
  );
  
  logger.info(`🔍 Search results for "${query}":`, results.length, 'bubbles found');
  return results;
}

function groupBubblesByColor() {
  const colorGroups = {};
  ideas.forEach(idea => {
    const color = idea.color || '#000000';
    if (!colorGroups[color]) {
      colorGroups[color] = [];
    }
    colorGroups[color].push(idea);
  });
  
  logger.info('🎨 Bubbles grouped by color:', Object.keys(colorGroups).length, 'color groups');
  return colorGroups;
}

function groupBubblesByShape() {
  const shapeGroups = {};
  ideas.forEach(idea => {
    const shape = idea.shape || 'circle';
    if (!shapeGroups[shape]) {
      shapeGroups[shape] = [];
    }
    shapeGroups[shape].push(idea);
  });
  
  logger.info('🔷 Bubbles grouped by shape:', Object.keys(shapeGroups).length, 'shape groups');
  return shapeGroups;
}

function duplicateBubble(idea) {
  if (!idea) {
    logger.warn('⚠️ Please select a bubble to duplicate');
    return;
  }
  
  const newIdea = {
    ...idea,
    x: idea.x + 20,
    y: idea.y + 20,
    title: idea.title ? `${idea.title} (Copy)` : 'Copy',
    vx: idea.vx * 0.8, // Slightly slower velocity
    vy: idea.vy * 0.8
  };
  
  ideas.push(newIdea);
  selectedIdea = newIdea;
  logger.info('📋 Bubble duplicated:', newIdea.title);
  return newIdea;
}

function exportBubbleData(idea) {
  if (!idea) {
    logger.warn('⚠️ Please select a bubble to export');
    return;
  }
  
  const data = JSON.stringify(idea, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${idea.title || 'bubble'}_${Date.now()}.json`;
  a.click();
  
  logger.info('📤 Bubble data exported:', idea.title || 'Untitled');
}

function importBubbleData(jsonData) {
  try {
    const bubbleData = JSON.parse(jsonData);
    if (bubbleData.x !== undefined && bubbleData.y !== undefined) {
      ideas.push(bubbleData);
      selectedIdea = bubbleData;
      logger.info('📥 Bubble data imported successfully:', bubbleData.title || 'Untitled');
      return bubbleData;
    } else {
      throw new Error('Invalid bubble data format');
    }
  } catch (err) {
    logger.error('❌ Error importing bubble data:', err.message);
    return null;
  }
}

// ===== ENHANCED ANIMATION & PHYSICS =====

let physicsEnabled = true;
let attractionForce = 0.1;
let repulsionForce = 0.05;
let magneticBubbles = [];

function togglePhysics() {
  physicsEnabled = !physicsEnabled;
  logger.info(physicsEnabled ? '🔬 Physics enabled' : '⏸️ Physics disabled');
}

function setAttractionForce(force) {
  attractionForce = Math.max(0, Math.min(1, force));
  logger.debug('🧲 Attraction force set to:', attractionForce);
}

function setRepulsionForce(force) {
  repulsionForce = Math.max(0, Math.min(1, force));
  logger.debug('⚡ Repulsion force set to:', repulsionForce);
}

function makeBubbleMagnetic(idea) {
  if (!idea) {
    logger.warn('⚠️ Please select a bubble to make magnetic');
    return;
  }
  
  if (!magneticBubbles.includes(idea)) {
    magneticBubbles.push(idea);
    idea.isMagnetic = true;
    logger.info('🧲 Bubble made magnetic:', idea.title || 'Untitled');
  } else {
    magneticBubbles = magneticBubbles.filter(b => b !== idea);
    idea.isMagnetic = false;
    logger.info('🔌 Bubble magnetism removed:', idea.title || 'Untitled');
  }
}

function applyMagneticForces() {
  if (!physicsEnabled || magneticBubbles.length === 0) return;
  
  magneticBubbles.forEach(magneticBubble => {
    if (!magneticBubble || magneticBubble.static || magneticBubble.fixed) return;
    
    ideas.forEach(otherBubble => {
      if (otherBubble === magneticBubble || otherBubble.static || otherBubble.fixed) return;
      
      const dx = otherBubble.x - magneticBubble.x;
      const dy = otherBubble.y - magneticBubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 150 && distance > 20) { // Attraction range
        const force = attractionForce / (distance * 0.01);
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Apply attraction force
        magneticBubble.vx += normalizedDx * force;
        magneticBubble.vy += normalizedDy * force;
        
        // Apply opposite force to other bubble
        otherBubble.vx -= normalizedDx * force * 0.5;
        otherBubble.vy -= normalizedDy * force * 0.5;
      }
    });
  });
}

function createBubbleCluster(centerX, centerY, count = 5, radius = 100) {
  const cluster = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = Math.random() * radius;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    const newBubble = addIdea(x, y, `Cluster ${i + 1}`, '', randomColor());
    newBubble.clusterId = `cluster_${Date.now()}`;
    cluster.push(newBubble);
  }
  
  logger.info('🌟 Bubble cluster created:', count, 'bubbles');
  return cluster;
}

function addBubbleTrail(idea, trailLength = 10) {
  if (!idea) {
    logger.warn('⚠️ Please select a bubble to add trail effect');
    return;
  }
  
  idea.trail = [];
  idea.trailLength = trailLength;
  idea.hasTrail = true;
  
  logger.info('✨ Trail effect added to bubble:', idea.title || 'Untitled');
}

function updateBubbleTrails() {
  ideas.forEach(idea => {
    if (idea.hasTrail && idea.trail) {
      // Add current position to trail
      idea.trail.push({ x: idea.x, y: idea.y, timestamp: Date.now() });
      
      // Remove old trail points
      while (idea.trail.length > idea.trailLength) {
        idea.trail.shift();
      }
    }
  });
}

function drawBubbleTrails(ctx) {
  ideas.forEach(idea => {
    if (idea.hasTrail && idea.trail && idea.trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = idea.color + '40'; // Semi-transparent
      ctx.lineWidth = 2;
      
      idea.trail.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
    }
  });
}

// ===== SMART AUTO-SAVE & RECOVERY =====

let autoSaveEnabled = true;
let autoSaveInterval = 30000; // 30 seconds
let lastAutoSave = Date.now();
let autoSaveTimer = null;
let recoveryData = null;

function enableAutoSave() {
  autoSaveEnabled = true;
  startAutoSaveTimer();
  logger.info('💾 Auto-save enabled');
}

function disableAutoSave() {
  autoSaveEnabled = false;
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
  logger.info('⏸️ Auto-save disabled');
}

function startAutoSaveTimer() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
  
  autoSaveTimer = setInterval(() => {
    if (autoSaveEnabled && ideas.length > 0) {
      autoSaveIdeas();
    }
  }, autoSaveInterval);
}

function autoSaveIdeas() {
  try {
    const autoSaveData = {
      ideas: ideas,
      timestamp: Date.now(),
      version: '1.0',
      checksum: generateChecksum(ideas)
    };
    
    localStorage.setItem('mindsEye_autoSave', JSON.stringify(autoSaveData));
    lastAutoSave = Date.now();
    
    logger.debug('💾 Auto-save completed:', ideas.length, 'ideas saved');
  } catch (err) {
    logger.error('❌ Auto-save failed:', err.message);
  }
}

function generateChecksum(data) {
  // Simple checksum for data integrity
  let checksum = 0;
  const str = JSON.stringify(data);
  for (let i = 0; i < str.length; i++) {
    checksum = ((checksum << 5) - checksum + str.charCodeAt(i)) & 0xffffffff;
  }
  return checksum;
}

function loadAutoSave() {
  try {
    const autoSaveData = localStorage.getItem('mindsEye_autoSave');
    if (autoSaveData) {
      const parsed = JSON.parse(autoSaveData);
      
      // Verify data integrity
      if (parsed.checksum === generateChecksum(parsed.ideas)) {
        ideas = parsed.ideas;
        logger.info('💾 Auto-save recovered:', ideas.length, 'ideas loaded');
        return true;
      } else {
        logger.warn('⚠️ Auto-save data corrupted, using backup');
        return loadBackup();
      }
    }
  } catch (err) {
    logger.error('❌ Error loading auto-save:', err.message);
  }
  return false;
}

function createBackup() {
  try {
    const backupData = {
      ideas: ideas,
      timestamp: Date.now(),
      version: '1.0',
      checksum: generateChecksum(ideas),
      description: 'Manual backup'
    };
    
    const backupKey = `mindsEye_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    // Keep only last 5 backups
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('mindsEye_backup_'));
    if (backupKeys.length > 5) {
      backupKeys.sort();
      localStorage.removeItem(backupKeys[0]); // Remove oldest
    }
    
    logger.info('💾 Manual backup created:', backupKey);
    return backupKey;
  } catch (err) {
    logger.error('❌ Backup creation failed:', err.message);
    return null;
  }
}

function loadBackup() {
  try {
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('mindsEye_backup_'));
    if (backupKeys.length === 0) return false;
    
    // Load most recent backup
    backupKeys.sort().reverse();
    const latestBackup = localStorage.getItem(backupKeys[0]);
    const parsed = JSON.parse(latestBackup);
    
    if (parsed.checksum === generateChecksum(parsed.ideas)) {
      ideas = parsed.ideas;
      logger.info('💾 Backup recovered:', ideas.length, 'ideas loaded from', backupKeys[0]);
      return true;
    }
  } catch (err) {
    logger.error('❌ Error loading backup:', err.message);
  }
  return false;
}

function exportBackup() {
  try {
    const backupData = {
      ideas: ideas,
      timestamp: Date.now(),
      version: '1.0',
      checksum: generateChecksum(ideas),
      description: 'Exported backup'
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mindsEye_backup_${Date.now()}.json`;
    a.click();
    
    logger.info('💾 Backup exported successfully');
  } catch (err) {
    logger.error('❌ Backup export failed:', err.message);
  }
}

function importBackup(jsonData) {
  try {
    const backupData = JSON.parse(jsonData);
    
    if (backupData.ideas && Array.isArray(backupData.ideas)) {
      // Verify data integrity
      if (backupData.checksum === generateChecksum(backupData.ideas)) {
        ideas = backupData.ideas;
        logger.info('💾 Backup imported successfully:', ideas.length, 'ideas loaded');
        return true;
      } else {
        throw new Error('Backup data corrupted');
      }
    } else {
      throw new Error('Invalid backup format');
    }
  } catch (err) {
    logger.error('❌ Error importing backup:', err.message);
    return false;
  }
}

// Initialize auto-save on startup
function initializeAutoSave() {
  if (autoSaveEnabled) {
    startAutoSaveTimer();
    logger.info('💾 Auto-save initialized');
  }
}

// ... existing code ...