/**
 * AnimalRescueManager.test.ts
 * Unit tests for the AnimalRescueManager
 */

import { AnimalRescueManager, getAnimalRescueManager } from '../services/AnimalRescueManager';
import type { AnimalType } from '../types/index';

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
    },
    plank: {
      name: 'Planks',
      animalTheme: 'penguins',
      milestones: [30, 60, 120, 180, 300],
      formCheckpoints: ['back', 'hips', 'shoulders']
    }
  }
}));

describe('AnimalRescueManager', () => {
  let rescueManager: AnimalRescueManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    rescueManager = new AnimalRescueManager();
    rescueManager.initialize();
  });
  
  test('should initialize with default rescue data', () => {
    const data = rescueManager.getRescueData();
    
    expect(data.dogs).toBe(0);
    expect(data.cats).toBe(0);
    expect(data.penguins).toBe(0);
    expect(data.totalRescued).toBe(0);
  });
  
  test('should get correct animal type for exercise', () => {
    expect(rescueManager.getAnimalTypeForExercise('pushup')).toBe('dogs');
    expect(rescueManager.getAnimalTypeForExercise('chinup')).toBe('cats');
    expect(rescueManager.getAnimalTypeForExercise('plank')).toBe('penguins');
  });
  
  test('should record repetition and rescue animal at milestone', () => {
    // First 4 reps should not rescue animal
    for (let i = 1; i <= 4; i++) {
      const rescued = rescueManager.recordRepetition('pushup', i);
      expect(rescued).toBe(false);
    }
    
    // 5th rep should rescue animal (milestone)
    const rescued = rescueManager.recordRepetition('pushup', 5);
    expect(rescued).toBe(true);
    
    const data = rescueManager.getRescueData();
    expect(data.dogs).toBe(1);
    expect(data.totalRescued).toBe(1);
  });
  
  test('should not rescue animal for same milestone twice', () => {
    // First milestone at 5 reps
    rescueManager.recordRepetition('pushup', 5);
    
    // Should not rescue again at 5 reps
    const rescued = rescueManager.recordRepetition('pushup', 5);
    expect(rescued).toBe(false);
    
    const data = rescueManager.getRescueData();
    expect(data.dogs).toBe(1);
  });
  
  test('should rescue animal at next milestone', () => {
    // First milestone at 5 reps
    rescueManager.recordRepetition('pushup', 5);
    
    // Next milestone at 10 reps
    const rescued = rescueManager.recordRepetition('pushup', 10);
    expect(rescued).toBe(true);
    
    const data = rescueManager.getRescueData();
    expect(data.dogs).toBe(2);
  });
  
  test('should notify callbacks when animal is rescued', () => {
    const mockCallback = jest.fn();
    rescueManager.onAnimalRescue(mockCallback);
    
    rescueManager.recordRepetition('pushup', 5);
    
    expect(mockCallback).toHaveBeenCalledWith('dogs', 1, true);
  });
  
  test('should reset rescue data', () => {
    rescueManager.recordRepetition('pushup', 5);
    rescueManager.resetRescueData();
    
    const data = rescueManager.getRescueData();
    expect(data.dogs).toBe(0);
    expect(data.totalRescued).toBe(0);
  });
  
  test('getAnimalRescueManager should return singleton instance', () => {
    const instance1 = getAnimalRescueManager();
    const instance2 = getAnimalRescueManager();
    
    expect(instance1).toBe(instance2);
  });
});