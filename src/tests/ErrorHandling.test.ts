/**
 * ErrorHandling.test.ts
 * Tests for error handling and user guidance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  ErrorHandler, 
  ErrorType, 
  ErrorSeverity, 
  handleError, 
  showGuidance 
} from '../utils/ErrorHandler';

describe('ErrorHandler', () => {
  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = '';
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });
  
  it('should create error container', () => {
    // Get error handler instance
    const errorHandler = ErrorHandler.getInstance();
    
    // Check if error container is created
    const errorContainer = document.getElementById('error-container');
    expect(errorContainer).not.toBeNull();
    expect(errorContainer?.className).toBe('error-container');
  });
  
  it('should display error message', () => {
    // Handle error
    handleError(
      ErrorType.CAMERA_ACCESS,
      ErrorSeverity.ERROR,
      'Camera access denied'
    );
    
    // Check if error message is displayed
    const errorMessage = document.querySelector('.error-message');
    expect(errorMessage).not.toBeNull();
    expect(errorMessage?.textContent).toContain('Camera access denied');
  });
  
  it('should show guidance', () => {
    // Show guidance
    showGuidance({
      title: 'Test Guidance',
      steps: ['Step 1', 'Step 2']
    });
    
    // Check if guidance is displayed
    const guidanceContainer = document.getElementById('guidance-container');
    expect(guidanceContainer).not.toBeNull();
    expect(guidanceContainer?.classList.contains('hidden')).toBe(false);
    
    // Check guidance content
    const guidanceTitle = document.querySelector('.guidance-title');
    expect(guidanceTitle?.textContent).toBe('Test Guidance');
    
    const guidanceSteps = document.querySelectorAll('.guidance-steps li');
    expect(guidanceSteps.length).toBe(2);
    expect(guidanceSteps[0].textContent).toBe('Step 1');
    expect(guidanceSteps[1].textContent).toBe('Step 2');
  });
  
  it('should add error to error list', () => {
    // Get error handler instance
    const errorHandler = ErrorHandler.getInstance();
    
    // Handle error
    handleError(
      ErrorType.NETWORK,
      ErrorSeverity.WARNING,
      'Network connection lost'
    );
    
    // Check if error is added to list
    const errors = errorHandler.getErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[errors.length - 1].type).toBe(ErrorType.NETWORK);
    expect(errors[errors.length - 1].message).toBe('Network connection lost');
  });
  
  it('should notify error callbacks', () => {
    // Get error handler instance
    const errorHandler = ErrorHandler.getInstance();
    
    // Create mock callback
    const mockCallback = vi.fn();
    errorHandler.addErrorCallback(mockCallback);
    
    // Handle error
    handleError(
      ErrorType.PERFORMANCE,
      ErrorSeverity.INFO,
      'Performance optimization applied'
    );
    
    // Check if callback was called
    expect(mockCallback).toHaveBeenCalled();
    expect(mockCallback.mock.calls[0][0].type).toBe(ErrorType.PERFORMANCE);
    expect(mockCallback.mock.calls[0][0].message).toBe('Performance optimization applied');
  });
});

// Import UserGuidance for testing
import { 
  UserGuidanceManager, 
  GuidanceType, 
  initializeUserGuidance 
} from '../components/guidance/UserGuidance';

describe('UserGuidance', () => {
  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = '';
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });
  
  it('should initialize user guidance', () => {
    // Initialize user guidance
    initializeUserGuidance();
    
    // Check if guidance overlay is created
    const guidanceOverlay = document.getElementById('guidance-overlay');
    expect(guidanceOverlay).not.toBeNull();
    expect(guidanceOverlay?.className).toContain('guidance-overlay');
  });
  
  it('should show positioning guide', () => {
    // Initialize user guidance
    initializeUserGuidance();
    
    // Get user guidance manager
    const userGuidanceManager = UserGuidanceManager.getInstance();
    
    // Show positioning guide
    userGuidanceManager.showPositioningGuide();
    
    // Check if positioning guide is displayed
    const positioningGuide = document.querySelector('.positioning-guide');
    expect(positioningGuide).not.toBeNull();
    expect(positioningGuide?.classList.contains('hidden')).toBe(false);
    
    // Check if guidance overlay is displayed
    const guidanceOverlay = document.getElementById('guidance-overlay');
    expect(guidanceOverlay?.classList.contains('hidden')).toBe(false);
  });
  
  it('should show lighting guide', () => {
    // Initialize user guidance
    initializeUserGuidance();
    
    // Get user guidance manager
    const userGuidanceManager = UserGuidanceManager.getInstance();
    
    // Show lighting guide
    userGuidanceManager.showLightingGuide();
    
    // Check if lighting guide is displayed
    const lightingGuide = document.querySelector('.lighting-guide');
    expect(lightingGuide).not.toBeNull();
    expect(lightingGuide?.classList.contains('hidden')).toBe(false);
    
    // Check if guidance overlay is displayed
    const guidanceOverlay = document.getElementById('guidance-overlay');
    expect(guidanceOverlay?.classList.contains('hidden')).toBe(false);
  });
  
  it('should hide guide', () => {
    // Initialize user guidance
    initializeUserGuidance();
    
    // Get user guidance manager
    const userGuidanceManager = UserGuidanceManager.getInstance();
    
    // Show positioning guide
    userGuidanceManager.showPositioningGuide();
    
    // Hide guide
    userGuidanceManager.hideGuide(GuidanceType.POSITIONING);
    
    // Check if positioning guide is hidden
    const positioningGuide = document.querySelector('.positioning-guide');
    expect(positioningGuide?.classList.contains('hidden')).toBe(true);
    
    // Check if guidance overlay is hidden
    const guidanceOverlay = document.getElementById('guidance-overlay');
    expect(guidanceOverlay?.classList.contains('hidden')).toBe(true);
  });
});

// Import PerformanceMonitor for testing
import { 
  PerformanceMonitor, 
  getPerformanceMonitor, 
  startPerformanceMonitoring, 
  stopPerformanceMonitoring, 
  checkMinimumRequirements 
} from '../utils/PerformanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Mock performance API
    if (!window.performance) {
      (window as any).performance = {
        now: vi.fn().mockReturnValue(0),
        memory: {
          usedJSHeapSize: 100000000,
          jsHeapSizeLimit: 200000000
        }
      };
    }
    
    // Mock requestAnimationFrame
    window.requestAnimationFrame = vi.fn().mockReturnValue(1);
    window.cancelAnimationFrame = vi.fn();
  });
  
  afterEach(() => {
    // Stop monitoring
    stopPerformanceMonitoring();
    
    // Clear mocks
    vi.clearAllMocks();
  });
  
  it('should start and stop monitoring', () => {
    // Start monitoring
    startPerformanceMonitoring();
    
    // Check if monitoring is started
    expect(window.requestAnimationFrame).toHaveBeenCalled();
    
    // Stop monitoring
    stopPerformanceMonitoring();
    
    // Check if monitoring is stopped
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
  
  it('should check minimum requirements', () => {
    // Mock WebGL context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({});
    
    // Mock getUserMedia
    if (!navigator.mediaDevices) {
      (navigator as any).mediaDevices = {
        getUserMedia: vi.fn()
      };
    }
    
    // Check minimum requirements
    const meetsRequirements = checkMinimumRequirements();
    
    // Should meet requirements with our mocks
    expect(meetsRequirements).toBe(true);
  });
});