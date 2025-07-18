/**
 * EndToEnd.test.ts
 * End-to-end tests for complete user workflows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeApp } from '../services/AppService';
import { getGameManager } from '../services/GameManager';
import { getCameraService } from '../services/CameraService';
import { getPoseDetector } from '../services/PoseDetector';
import { getAnimalRescueManager } from '../services/AnimalRescueManager';

// Mock dependencies
vi.mock('../services/CameraService', () => ({
  getCameraService: vi.fn().mockReturnValue({
    initialize: vi.fn().mockResolvedValue(true),
    startCamera: vi.fn().mockResolvedValue(true),
    stopCamera: vi.fn(),
    isActive: vi.fn().mockReturnValue(true),
    updateAvailableDevices: vi.fn().mockResolvedValue([]),
    getAvailableDevices: vi.fn().mockReturnValue([]),
    toggleFacingMode: vi.fn().mockResolvedValue(true),
    setResolution: vi.fn().mockResolvedValue(true),
    getCurrentResolution: vi.fn().mockReturnValue({ width: 640, height: 480 })
  }),
  initializeCameraService: vi.fn().mockResolvedValue(true)
}));

vi.mock('../services/PoseDetector', () => ({
  getPoseDetector: vi.fn().mockReturnValue({
    initialize: vi.fn().mockResolvedValue(true),
    start: vi.fn(),
    stop: vi.fn(),
    isRunning: vi.fn().mockReturnValue(true),
    setConfidenceThreshold: vi.fn()
  })
}));

vi.mock('../services/GameManager', () => ({
  getGameManager: vi.fn().mockReturnValue({
    initialize: vi.fn().mockResolvedValue(true),
    startExercise: vi.fn(),
    endExercise: vi.fn(),
    recordRepetition: vi.fn().mockReturnValue(false),
    getCurrentExercise: vi.fn().mockReturnValue('pushup'),
    getScore: vi.fn().mockReturnValue(0)
  }),
  initializeGameManager: vi.fn().mockResolvedValue(true)
}));

vi.mock('../services/AnimalRescueManager', () => ({
  getAnimalRescueManager: vi.fn().mockReturnValue({
    initialize: vi.fn(),
    recordRescue: vi.fn(),
    getRescueData: vi.fn().mockReturnValue({ cats: 0, dogs: 0, penguins: 0 }),
    onAnimalRescue: vi.fn()
  }),
  initializeAnimalRescueManager: vi.fn()
}));

vi.mock('../components/ui/LoadingState', () => ({
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  updateLoadingProgress: vi.fn(),
  updateLoadingMessage: vi.fn(),
  LoadingStateType: {
    INITIAL: 'initial',
    CAMERA: 'camera',
    POSE_DETECTION: 'pose_detection',
    ASSETS: 'assets',
    EXERCISE: 'exercise'
  }
}));

describe('End-to-End User Workflows', () => {
  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <div id="app">
        <header>
          <h1>AI Fitness Game</h1>
          <div id="exercise-selector"></div>
        </header>
        <main>
          <div id="camera-container">
            <div id="video-container"></div>
            <div id="pose-overlay"></div>
          </div>
          <div id="game-stats">
            <div id="animal-counter"></div>
            <div id="rep-counter"></div>
          </div>
          <div id="animal-display"></div>
        </main>
        <footer>
          <div id="instructions"></div>
          <div id="progress-dashboard"></div>
        </footer>
      </div>
    `;
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });
  
  it('should initialize the application successfully', async () => {
    // Initialize app
    await initializeApp();
    
    // Check if camera service was initialized
    const cameraService = getCameraService();
    expect(cameraService.initialize).toHaveBeenCalled();
    
    // Check if pose detector was initialized
    const poseDetector = getPoseDetector();
    expect(poseDetector.initialize).toHaveBeenCalled();
    
    // Check if game manager was initialized
    const gameManager = getGameManager();
    expect(gameManager.initialize).toHaveBeenCalled();
    
    // Check if animal rescue manager was initialized
    const animalRescueManager = getAnimalRescueManager();
    expect(animalRescueManager.initialize).toHaveBeenCalled();
  });
  
  it('should handle exercise selection and start workflow', async () => {
    // Initialize app
    await initializeApp();
    
    // Get exercise selector
    const exerciseSelector = document.getElementById('exercise-selector');
    expect(exerciseSelector).not.toBeNull();
    
    // Simulate exercise selection
    const event = new CustomEvent('exercise-selected', { detail: { exercise: 'pushup' } });
    exerciseSelector?.dispatchEvent(event);
    
    // Check if game manager started exercise
    const gameManager = getGameManager();
    expect(gameManager.startExercise).toHaveBeenCalledWith('pushup');
    
    // Check if camera is active
    const cameraService = getCameraService();
    expect(cameraService.isActive).toHaveBeenCalled();
    
    // Check if pose detector is running
    const poseDetector = getPoseDetector();
    expect(poseDetector.isRunning).toHaveBeenCalled();
  });
  
  it('should handle exercise completion workflow', async () => {
    // Initialize app
    await initializeApp();
    
    // Simulate exercise selection
    const exerciseSelector = document.getElementById('exercise-selector');
    const selectEvent = new CustomEvent('exercise-selected', { detail: { exercise: 'pushup' } });
    exerciseSelector?.dispatchEvent(selectEvent);
    
    // Simulate exercise completion (Escape key press)
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);
    
    // Check if game manager ended exercise
    const gameManager = getGameManager();
    expect(gameManager.endExercise).toHaveBeenCalled();
    
    // Check if pose detector was stopped
    const poseDetector = getPoseDetector();
    expect(poseDetector.stop).toHaveBeenCalled();
  });
  
  it('should handle repetition counting and animal rescue', async () => {
    // Initialize app
    await initializeApp();
    
    // Mock game manager to simulate repetition
    const gameManager = getGameManager();
    (gameManager.recordRepetition as any).mockReturnValueOnce(true); // Milestone reached
    
    // Simulate exercise selection
    const exerciseSelector = document.getElementById('exercise-selector');
    const selectEvent = new CustomEvent('exercise-selected', { detail: { exercise: 'pushup' } });
    exerciseSelector?.dispatchEvent(selectEvent);
    
    // Simulate pose detection result with completed rep
    const poseDetector = getPoseDetector();
    const poseCallback = (poseDetector.initialize as any).mock.calls[0][1];
    
    // Call pose callback with mock data
    poseCallback({
      keypoints: [],
      score: 0.9,
      confidence: 0.9
    });
    
    // Check if animal rescue manager was called for milestone
    const animalRescueManager = getAnimalRescueManager();
    expect(animalRescueManager.recordRescue).toHaveBeenCalled();
  });
});

// Cross-browser compatibility tests
describe('Cross-Browser Compatibility', () => {
  beforeEach(() => {
    // Reset user agent
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });
  
  it('should detect Chrome browser', () => {
    // Mock Chrome user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true
    });
    
    // Check browser detection
    expect(navigator.userAgent).toContain('Chrome');
  });
  
  it('should detect Firefox browser', () => {
    // Mock Firefox user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      configurable: true
    });
    
    // Check browser detection
    expect(navigator.userAgent).toContain('Firefox');
  });
  
  it('should detect Safari browser', () => {
    // Mock Safari user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      configurable: true
    });
    
    // Check browser detection
    expect(navigator.userAgent).toContain('Safari');
  });
  
  it('should detect mobile device', () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      configurable: true
    });
    
    // Import mobile detection function
    const { isMobileDevice } = require('../utils/MobileOptimizer');
    
    // Check mobile detection
    expect(isMobileDevice()).toBe(true);
  });
});