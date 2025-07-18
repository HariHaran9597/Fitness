/**
 * Application constants
 */

// Local storage keys
export const STORAGE_KEYS = {
  USER_PROGRESS: 'ai-fitness-game-progress',
  SETTINGS: 'ai-fitness-game-settings',
  SESSION_HISTORY: 'ai-fitness-game-sessions'
};

// Exercise configurations
export const EXERCISE_CONFIG = {
  pushup: {
    name: 'Push-ups',
    animalTheme: 'dogs',
    milestones: [5, 10, 20, 50, 100],
    formCheckpoints: ['arms', 'back', 'hips']
  },
  chinup: {
    name: 'Chin-ups',
    animalTheme: 'cats',
    milestones: [3, 5, 10, 20, 50],
    formCheckpoints: ['arms', 'shoulders', 'chin']
  },
  plank: {
    name: 'Planks',
    animalTheme: 'penguins',
    milestones: [30, 60, 120, 180, 300], // seconds
    formCheckpoints: ['back', 'hips', 'shoulders']
  }
};

// Pose detection settings
export const POSE_DETECTION_CONFIG = {
  minConfidence: 0.5,
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
};

// Animation settings
export const ANIMATION_CONFIG = {
  celebrationDuration: 2000,
  feedbackDuration: 500,
  transitionSpeed: 300
};

// UI settings
export const UI_CONFIG = {
  repCounterUpdateDelay: 100,
  feedbackDisplayTime: 2000,
  errorDisplayTime: 5000
};