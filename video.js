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

function videoPlayVideo(index) {
  if (index < 0 || index >= videoPlaylist.length) return;
  
  videoCurrentIndex = index;
  const url = videoPlaylist[index];
  const videoId = extractYouTubeId(url);
  
  if (videoId) {
    // Handle YouTube videos
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=0&enablejsapi=1&origin=${window.location.origin}`;
    const videoIframe = document.getElementById('videoIframe');
    if (videoIframe) {
      videoIframe.src = embedUrl;
      videoIframe.style.display = 'block';
      videoIframe.style.zIndex = '1';
      videoIsPlaying = true;
      updateVideoPlaylistDisplay();
      window.videoLogger.info('🎵 Video Playing YouTube video:', { index: index + 1, total: videoPlaylist.length, videoId: videoId });
      
      // Add event listener for iframe load to handle autoplay restrictions
      videoIframe.onload = function() {
        window.videoLogger.debug('🎥 Video iframe loaded');
        // Try to force play after load
        setTimeout(() => {
          try {
            videoIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            window.videoLogger.debug('🎥 Attempted to force play video');
          } catch (error) {
            window.videoLogger.warn('⚠️ Could not force play video (autoplay restriction)');
          }
        }, 1000);
      };
    }
  } else {
    // Handle non-YouTube URLs (webcam streams, direct video links, etc.)
    window.videoLogger.info('🌐 Playing non-YouTube URL from playlist:', url);
    
    const contentType = detectContentType(url);
    let embedUrl;
    
    switch(contentType) {
      case 'video':
        // Handle direct video streams by creating an HTML5 video player
        const videoHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; }
              video { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <video controls autoplay loop crossorigin="anonymous">
              <source src="${url}" type="video/mp4">
              <source src="${url}" type="video/webm">
              <source src="${url}" type="video/ogg">
              <source src="${url}">
              <p>Your browser doesn't support HTML5 video. <a href="${url}">Download the video</a> instead.</p>
            </video>
            <script>
              const video = document.querySelector('video');
              video.addEventListener('loadstart', () => {
                console.log('🎥 Video loading started');
              });
              video.addEventListener('error', (e) => {
                console.error('🎥 Video error:', e);
                document.body.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Error loading video stream. Please check the URL and try again.</div>';
              });
              video.addEventListener('canplay', () => {
                console.log('🎥 Video ready to play');
              });
            </script>
          </body>
          </html>
        `;
        
        const blob = new Blob([videoHtml], { type: 'text/html' });
        embedUrl = URL.createObjectURL(blob);
        window.videoLogger.info('🎥 Created HTML5 video player for video stream in playlist');
        break;
        
      case 'website':
      default:
        // Handle regular websites by loading them directly in iframe
        embedUrl = url;
        window.videoLogger.info('🌐 Loading website directly in iframe from playlist');
        break;
    }
    
    // Load the content in the iframe
    const videoIframe = document.getElementById('videoIframe');
    if (videoIframe) {
      videoIframe.src = embedUrl;
      videoIframe.style.display = 'block';
      videoIframe.style.zIndex = '1';
      videoIsPlaying = true;
      updateVideoPlaylistDisplay();
      window.videoLogger.info('🌐 Playing non-YouTube content:', { index: index + 1, total: videoPlaylist.length, url: url });
    }
  }
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&]+)/);
  return match ? match[1] : null;
}

// Helper function to detect content type
function detectContentType(url) {
  // Check if it's a YouTube URL first
  if (extractYouTubeId(url)) {
    return 'youtube';
  }
  
  // Check if it's a direct video file
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.m4v'];
  const streamingFormats = ['.m3u8', '.mpd', '.f4m'];
  const allVideoFormats = [...videoExtensions, ...streamingFormats];
  
  const urlLower = url.toLowerCase();
  if (allVideoFormats.some(ext => urlLower.includes(ext))) {
    return 'video';
  }
  
  // Do not guess 'video' for generic streaming paths/domains.
  // Only explicit file or manifest extensions should be considered video.
  
  // Default to website
  return 'website';
}

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