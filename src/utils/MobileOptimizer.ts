/**
 * MobileOptimizer.ts
 * Utility for optimizing the application for mobile devices
 */

/**
 * Check if the device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         (window.innerWidth <= 768);
}

/**
 * Check if the device is in portrait orientation
 */
export function isPortraitOrientation(): boolean {
  return window.innerHeight > window.innerWidth;
}

/**
 * Add fullscreen toggle button to camera container
 * @param containerId ID of the camera container element
 */
export function addFullscreenToggle(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Create fullscreen toggle button
  const fullscreenToggle = document.createElement('button');
  fullscreenToggle.className = 'fullscreen-toggle';
  fullscreenToggle.innerHTML = '⛶';
  fullscreenToggle.setAttribute('aria-label', 'Toggle fullscreen mode');
  
  // Add click event listener
  fullscreenToggle.addEventListener('click', () => {
    toggleFullscreenMode(containerId);
  });
  
  // Add button to container
  container.appendChild(fullscreenToggle);
}

/**
 * Toggle fullscreen mode for camera container
 * @param containerId ID of the camera container element
 */
export function toggleFullscreenMode(containerId: string): void {
  const container = document.getElementById(containerId);
  const appElement = document.getElementById('app');
  
  if (!container || !appElement) return;
  
  // Toggle fullscreen class
  appElement.classList.toggle('fullscreen-mode');
  
  // Update button text
  const fullscreenToggle = container.querySelector('.fullscreen-toggle') as HTMLButtonElement;
  if (fullscreenToggle) {
    fullscreenToggle.innerHTML = appElement.classList.contains('fullscreen-mode') ? '✕' : '⛶';
  }
  
  // Trigger resize event to adjust camera view
  window.dispatchEvent(new Event('resize'));
}

/**
 * Apply orientation-specific optimizations
 */
export function applyOrientationOptimizations(): void {
  const appElement = document.getElementById('app');
  if (!appElement) return;
  
  // Apply landscape mode optimizations
  if (!isPortraitOrientation()) {
    appElement.classList.add('landscape-mode');
  } else {
    appElement.classList.remove('landscape-mode');
  }
}

/**
 * Initialize mobile optimizations
 */
export function initializeMobileOptimizations(): void {
  if (isMobileDevice()) {
    // Add fullscreen toggle to camera container
    addFullscreenToggle('camera-container');
    
    // Apply orientation optimizations
    applyOrientationOptimizations();
    
    // Listen for orientation changes
    window.addEventListener('resize', () => {
      applyOrientationOptimizations();
    });
    
    // Add meta viewport tag for proper scaling
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    } else {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }
}

/**
 * Add touch-specific optimizations
 */
export function addTouchOptimizations(): void {
  // Check if device supports touch
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch-device');
    
    // Add touch feedback to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('touchstart', () => {
        button.classList.add('touch-active');
      });
      
      button.addEventListener('touchend', () => {
        button.classList.remove('touch-active');
      });
    });
  }
}

/**
 * Optimize camera positioning for mobile
 * @param videoElement Video element
 */
export function optimizeCameraForMobile(videoElement: HTMLVideoElement): void {
  if (!isMobileDevice()) return;
  
  // Add positioning guide overlay
  const container = videoElement.parentElement;
  if (!container) return;
  
  const positioningGuide = document.createElement('div');
  positioningGuide.className = 'positioning-guide';
  positioningGuide.innerHTML = `
    <div class="guide-outline"></div>
    <div class="guide-text">Position yourself within the frame</div>
  `;
  
  // Add to container
  container.appendChild(positioningGuide);
  
  // Show guide briefly then fade out
  setTimeout(() => {
    positioningGuide.classList.add('fade-out');
    
    // Remove after animation
    setTimeout(() => {
      positioningGuide.remove();
    }, 1000);
  }, 3000);
}