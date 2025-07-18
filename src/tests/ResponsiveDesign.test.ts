/**
 * ResponsiveDesign.test.ts
 * Tests for responsive design and mobile optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isMobileDevice, 
  isPortraitOrientation, 
  applyOrientationOptimizations,
  addFullscreenToggle,
  toggleFullscreenMode
} from '../utils/MobileOptimizer';

describe('Mobile Detection', () => {
  const originalUserAgent = navigator.userAgent;
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  
  afterEach(() => {
    // Reset user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
    
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true
    });
  });
  
  it('should detect mobile devices by user agent', () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    });
    
    expect(isMobileDevice()).toBe(true);
  });
  
  it('should detect mobile devices by screen width', () => {
    // Mock desktop user agent but mobile screen width
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true
    });
    
    Object.defineProperty(window, 'innerWidth', {
      value: 480,
      configurable: true
    });
    
    expect(isMobileDevice()).toBe(true);
  });
  
  it('should detect desktop devices', () => {
    // Mock desktop user agent and screen width
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true
    });
    
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true
    });
    
    expect(isMobileDevice()).toBe(false);
  });
});

describe('Orientation Detection', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  
  afterEach(() => {
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true
    });
  });
  
  it('should detect portrait orientation', () => {
    // Mock portrait dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      configurable: true
    });
    
    expect(isPortraitOrientation()).toBe(true);
  });
  
  it('should detect landscape orientation', () => {
    // Mock landscape dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: 667,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: 375,
      configurable: true
    });
    
    expect(isPortraitOrientation()).toBe(false);
  });
});

describe('Fullscreen Toggle', () => {
  beforeEach(() => {
    // Create test DOM elements
    document.body.innerHTML = `
      <div id="app">
        <div id="camera-container"></div>
      </div>
    `;
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });
  
  it('should add fullscreen toggle button', () => {
    addFullscreenToggle('camera-container');
    
    const button = document.querySelector('.fullscreen-toggle');
    expect(button).not.toBeNull();
    expect(button?.tagName).toBe('BUTTON');
  });
  
  it('should toggle fullscreen mode', () => {
    addFullscreenToggle('camera-container');
    toggleFullscreenMode('camera-container');
    
    const app = document.getElementById('app');
    expect(app?.classList.contains('fullscreen-mode')).toBe(true);
    
    // Toggle again
    toggleFullscreenMode('camera-container');
    expect(app?.classList.contains('fullscreen-mode')).toBe(false);
  });
});

describe('Orientation Optimizations', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  
  beforeEach(() => {
    // Create test DOM elements
    document.body.innerHTML = `<div id="app"></div>`;
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true
    });
  });
  
  it('should apply landscape mode class', () => {
    // Mock landscape dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: 667,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: 375,
      configurable: true
    });
    
    applyOrientationOptimizations();
    
    const app = document.getElementById('app');
    expect(app?.classList.contains('landscape-mode')).toBe(true);
  });
  
  it('should remove landscape mode class in portrait', () => {
    // Add landscape class first
    const app = document.getElementById('app');
    app?.classList.add('landscape-mode');
    
    // Mock portrait dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      configurable: true
    });
    
    applyOrientationOptimizations();
    
    expect(app?.classList.contains('landscape-mode')).toBe(false);
  });
});