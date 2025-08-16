// ===== MINDS EYE - VIDEO HANDLING =====

// Centralized logging system - OPTIMIZED FOR PERFORMANCE
(function() {
    const LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    // Set to WARN for video operations - reduces console spam while keeping important video info
    let currentLogLevel = LOG_LEVELS.WARN;
    let logCount = 0;
    const MAX_LOGS_PER_SECOND = 2; // Keep video logs minimal to avoid spam
    let lastLogTime = 0;
    const MIN_LOG_INTERVAL = 200; // Same as main.js for consistency

    function log(level, message, data = null) {
        const now = Date.now();

        // Rate limiting: only log if enough time has passed and we're under the limit
        if (level <= currentLogLevel &&
            logCount < MAX_LOGS_PER_SECOND &&
            (now - lastLogTime) >= MIN_LOG_INTERVAL) {

            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            const prefix = `[VIDEO:${timestamp}] `;

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

    // Logging utility functions
    const logger = {
        error: (msg, data) => log(LOG_LEVELS.ERROR, msg, data),
        warn: (msg, data) => log(LOG_LEVELS.WARN, msg, data),
        info: (msg, data) => log(LOG_LEVELS.INFO, msg, data),
        debug: (msg, data) => log(LOG_LEVELS.DEBUG, msg, data)
    };

    // Make logger available globally for this file
    window.videoLogger = logger;
})();

// ===== VIDEO VARIABLES =====
// Video Player Variables
// Note: These variables are defined in main.js to avoid conflicts
let videoIsPlaying = false;
let videoPlayerMode = 'centered';

// ===== VIDEO PLAYLIST FUNCTIONS =====
// Note: Main video playlist functions are in media.js
// This file contains only the basic video player functionality

// Note: updateVideoPlaylistDisplay is defined in media.js

// videoPlayVideo function is now defined in media.js

// extractYouTubeId and detectContentType functions are now defined in media.js

// ===== VIDEO CONTROL FUNCTIONS =====
// Note: Video control functions are defined in media.js

// Note: videoTogglePlaylist is defined in media.js

// Note: videoToggleFullscreen is defined in media.js

// ===== VIDEO DISPLAY FUNCTIONS =====

// Auto-hide functionality removed - video controls now stay visible

// Note: startVideoPlaylistFadeOut is defined in media.js

// Note: showVideoControls is defined in media.js

// Note: showVideoPlaylist is defined in media.js

// ===== VIDEO LIFECYCLE FUNCTIONS =====

// Note: videoClose is defined in media.js

function forceCloseVideo() {
  window.videoLogger.info('🚨 Force closing Video');
  const elements = ['videoPlayer', 'videoControls', 'videoPlaylist', 'videoIframe'];
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
      element.style.pointerEvents = 'none';
      element.style.zIndex = '-1';
    }
  });
  videoIsPlaying = false;
  videoPlaylistVisible = false;
  
  // Reset first open flag when video is force closed
  if (typeof window.videoPlayerFirstOpen !== 'undefined') {
    window.videoPlayerFirstOpen = true;
  }
}

// Note: toggleVideoPlayer is defined in media.js

// ===== VIDEO.JS LOADED =====
window.videoLogger.info('🔧 Video.js loaded successfully'); 