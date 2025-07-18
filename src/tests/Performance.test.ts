/**
 * Performance.test.ts
 * Tests for performance optimization utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  MemoryManager, 
  getMemoryManager, 
  registerDisposable, 
  disposeObject 
} from '../utils/MemoryManager';

describe('MemoryManager', () => {
  beforeEach(() => {
    // Reset memory manager
    const memoryManager = getMemoryManager();
    memoryManager.disposeAll();
  });
  
  it('should register and dispose objects', () => {
    // Create mock disposable
    const mockDisposable = {
      dispose: vi.fn()
    };
    
    // Register disposable
    registerDisposable('test-object', mockDisposable);
    
    // Dispose object
    disposeObject('test-object');
    
    // Check if dispose was called
    expect(mockDisposable.dispose).toHaveBeenCalled();
  });
  
  it('should dispose all objects', () => {
    // Create mock disposables
    const mockDisposable1 = {
      dispose: vi.fn()
    };
    
    const mockDisposable2 = {
      dispose: vi.fn()
    };
    
    // Register disposables
    registerDisposable('test-object-1', mockDisposable1);
    registerDisposable('test-object-2', mockDisposable2);
    
    // Dispose all objects
    const memoryManager = getMemoryManager();
    memoryManager.disposeAll();
    
    // Check if dispose was called for both objects
    expect(mockDisposable1.dispose).toHaveBeenCalled();
    expect(mockDisposable2.dispose).toHaveBeenCalled();
  });
  
  it('should handle dispose errors gracefully', () => {
    // Create mock disposable that throws error
    const mockDisposable = {
      dispose: vi.fn().mockImplementation(() => {
        throw new Error('Dispose error');
      })
    };
    
    // Register disposable
    registerDisposable('test-object', mockDisposable);
    
    // Mock console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Dispose object should not throw
    expect(() => disposeObject('test-object')).not.toThrow();
    
    // Check if error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});

// Import AudioManager for testing
import { 
  AudioManager, 
  getAudioManager, 
  SoundEffectType 
} from '../utils/AudioManager';

describe('AudioManager', () => {
  beforeEach(() => {
    // Mock AudioContext
    global.AudioContext = vi.fn().mockImplementation(() => ({
      createBufferSource: vi.fn().mockReturnValue({
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        loop: false
      }),
      createGain: vi.fn().mockReturnValue({
        connect: vi.fn(),
        gain: { value: 1 }
      }),
      decodeAudioData: vi.fn().mockResolvedValue({}),
      destination: {},
      state: 'running',
      resume: vi.fn(),
      close: vi.fn()
    }));
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
    });
  });
  
  afterEach(() => {
    // Clean up
    const audioManager = getAudioManager();
    audioManager.dispose();
    
    // Restore mocks
    vi.restoreAllMocks();
  });
  
  it('should initialize audio manager', async () => {
    // Get audio manager
    const audioManager = getAudioManager();
    
    // Initialize
    const result = await audioManager.initialize();
    
    // Check result
    expect(result).toBe(true);
    
    // Check if AudioContext was created
    expect(global.AudioContext).toHaveBeenCalled();
  });
  
  it('should play sound effect', async () => {
    // Get audio manager
    const audioManager = getAudioManager();
    
    // Initialize
    await audioManager.initialize();
    
    // Mock sound effect
    (audioManager as any).soundEffects.set(SoundEffectType.SUCCESS, {});
    
    // Mock createBufferSource
    const createBufferSourceSpy = vi.spyOn((audioManager as any).audioContext, 'createBufferSource');
    
    // Play sound effect
    audioManager.playSoundEffect(SoundEffectType.SUCCESS);
    
    // Check if createBufferSource was called
    expect(createBufferSourceSpy).toHaveBeenCalled();
  });
  
  it('should not play sound effect when disabled', async () => {
    // Get audio manager
    const audioManager = getAudioManager();
    
    // Initialize
    await audioManager.initialize();
    
    // Disable sound effects
    audioManager.setEffectsEnabled(false);
    
    // Mock sound effect
    (audioManager as any).soundEffects.set(SoundEffectType.SUCCESS, {});
    
    // Mock createBufferSource
    const createBufferSourceSpy = vi.spyOn((audioManager as any).audioContext, 'createBufferSource');
    
    // Play sound effect
    audioManager.playSoundEffect(SoundEffectType.SUCCESS);
    
    // Check if createBufferSource was not called
    expect(createBufferSourceSpy).not.toHaveBeenCalled();
  });
});

// Import LoadingState for testing
import { 
  LoadingState, 
  getLoadingState, 
  LoadingStateType 
} from '../components/ui/LoadingState';

describe('LoadingState', () => {
  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = '<div id="app"></div>';
    
    // Mock requestAnimationFrame
    window.requestAnimationFrame = vi.fn().mockReturnValue(1);
    window.cancelAnimationFrame = vi.fn();
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });
  
  it('should create loading overlay', () => {
    // Get loading state
    const loadingState = getLoadingState();
    
    // Check if loading overlay is created
    const loadingOverlay = document.querySelector('.loading-overlay');
    expect(loadingOverlay).not.toBeNull();
    expect(loadingOverlay?.classList.contains('hidden')).toBe(true);
  });
  
  it('should show and hide loading state', () => {
    // Get loading state
    const loadingState = getLoadingState();
    
    // Show loading state
    loadingState.show(LoadingStateType.INITIAL);
    
    // Check if loading overlay is visible
    const loadingOverlay = document.querySelector('.loading-overlay');
    expect(loadingOverlay?.classList.contains('hidden')).toBe(false);
    
    // Check if loading text is set
    const loadingText = document.querySelector('.loading-text');
    expect(loadingText?.textContent).toBe('Initializing...');
    
    // Hide loading state
    loadingState.hide();
    
    // Check if loading overlay has fade-out class
    expect(loadingOverlay?.classList.contains('loading-fade-out')).toBe(true);
  });
  
  it('should update loading progress', () => {
    // Get loading state
    const loadingState = getLoadingState();
    
    // Show loading state
    loadingState.show(LoadingStateType.INITIAL);
    
    // Update progress
    loadingState.setProgress(50);
    
    // Check if progress bar is updated
    const progressBar = document.querySelector('.loading-progress-bar') as HTMLElement;
    
    // Since we're using animation, we need to manually trigger the animation frame
    const animateProgress = (loadingState as any).animateProgress.bind(loadingState);
    animateProgress();
    
    // Check if progress bar width is updated
    expect(progressBar.style.width).toBe('50%');
  });
  
  it('should update loading message', () => {
    // Get loading state
    const loadingState = getLoadingState();
    
    // Show loading state
    loadingState.show(LoadingStateType.INITIAL);
    
    // Update message
    loadingState.updateMessage('Custom message');
    
    // Check if loading text is updated
    const loadingText = document.querySelector('.loading-text');
    expect(loadingText?.textContent).toBe('Custom message');
  });
});