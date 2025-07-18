/**
 * GameManager.test.ts
 * Unit tests for the GameManager
 */

import { GameManager, getGameManager } from '../services/GameManager';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock constants
jest.mock('../utils/constants', () => ({
  STORAGE_KEYS: {
    USER_PROGRESS: 'ai-fitness-game-progress'
  },
  EXERCISE_CONFIG: {
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
    }
  }
}));

describe('GameManager', () => {
  let gameManager: GameManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    gameManager = new GameManager();
    gameManager.initialize();
  });
  
  test('should initialize with default state', () => {
    const state = gameManager.getState();
    
    expect(state.currentExercise).toBeNull();
    expect(state.repCount).toBe(0);
    expect(state.animalsRescued).toBe(0);
    expect(state.isActive).toBe(false);
  });
  
  test('should start exercise session', () => {
    gameManager.startExercise('pushup');
    const state = gameManager.getState();
    
    expect(state.currentExercise).toBe('pushup');
    expect(state.repCount).toBe(0);
    expect(state.isActive).toBe(true);
    expect(state.sessionStartTime).toBeGreaterThan(0);
  });
  
  test('should record repetition', () => {
    gameManager.startExercise('pushup');
    gameManager.recordRepetition('pushup');
    
    const state = gameManager.getState();
    expect(state.repCount).toBe(1);
  });
  
  test('should detect milestone and increment animals rescued', () => {
    gameManager.startExercise('pushup');
    
    // Record 4 reps (no milestone yet)
    for (let i = 0; i < 4; i++) {
      const milestone = gameManager.recordRepetition('pushup');
      expect(milestone).toBe(false);
    }
    
    // 5th rep should hit milestone
    const milestone = gameManager.recordRepetition('pushup');
    expect(milestone).toBe(true);
    
    const state = gameManager.getState();
    expect(state.animalsRescued).toBe(1);
  });
  
  test('should end exercise session', () => {
    gameManager.startExercise('pushup');
    gameManager.recordRepetition('pushup');
    gameManager.endExercise();
    
    const state = gameManager.getState();
    expect(state.isActive).toBe(false);
  });
  
  test('should get correct animal type for exercise', () => {
    gameManager.startExercise('pushup');
    expect(gameManager.getAnimalType()).toBe('dogs');
    
    gameManager.startExercise('chinup');
    expect(gameManager.getAnimalType()).toBe('cats');
  });
  
  test('should notify state change listeners', () => {
    const mockCallback = jest.fn();
    gameManager.onStateChange(mockCallback);
    
    gameManager.startExercise('pushup');
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
      currentExercise: 'pushup',
      isActive: true
    }));
  });
  
  test('should reset progress', () => {
    gameManager.startExercise('pushup');
    gameManager.recordRepetition('pushup');
    gameManager.resetProgress();
    
    const state = gameManager.getState();
    expect(state.repCount).toBe(0);
    expect(state.animalsRescued).toBe(0);
    expect(state.currentExercise).toBeNull();
    expect(state.isActive).toBe(false);
  });
  
  test('getGameManager should return singleton instance', () => {
    const instance1 = getGameManager();
    const instance2 = getGameManager();
    
    expect(instance1).toBe(instance2);
  });
});