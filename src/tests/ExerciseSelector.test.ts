/**
 * ExerciseSelector.test.ts
 * Tests for the ExerciseSelector component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExerciseSelector } from '../components/exercise/ExerciseSelector';
import { getGameManager } from '../services/GameManager';
import { getPoseDetector } from '../services/PoseDetector';

// Mock dependencies
vi.mock('../services/GameManager', () => ({
  getGameManager: vi.fn(() => ({
    startExercise: vi.fn(),
    endExercise: vi.fn(),
    togglePause: vi.fn(() => false)
  }))
}));

vi.mock('../services/PoseDetector', () => ({
  getPoseDetector: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    setDetectionConfidence: vi.fn(),
    setTrackingConfidence: vi.fn()
  }))
}));

describe('ExerciseSelector', () => {
  let container: HTMLElement;
  let exerciseSelector: ExerciseSelector;
  
  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'exercise-selector-test';
    document.body.appendChild(container);
    
    // Create exercise selector
    exerciseSelector = new ExerciseSelector('exercise-selector-test');
  });
  
  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
    vi.clearAllMocks();
  });
  
  it('should initialize with exercise options', () => {
    // Initialize exercise selector
    exerciseSelector.initialize();
    
    // Check if exercise cards are rendered
    const exerciseCards = container.querySelectorAll('.exercise-card');
    expect(exerciseCards.length).toBe(3); // Should have 3 exercise options
    
    // Check if start button is disabled initially
    const startButton = container.querySelector('.start-exercise-button');
    expect(startButton).not.toBeNull();
    expect(startButton?.hasAttribute('disabled')).toBe(true);
  });
  
  it('should select an exercise when clicked', () => {
    // Initialize exercise selector
    exerciseSelector.initialize();
    
    // Get first exercise card
    const exerciseCard = container.querySelector('.exercise-card');
    expect(exerciseCard).not.toBeNull();
    
    // Click on exercise card
    exerciseCard?.dispatchEvent(new Event('click'));
    
    // Check if exercise is selected
    expect(exerciseCard?.classList.contains('selected')).toBe(true);
    
    // Check if start button is enabled
    const startButton = container.querySelector('.start-exercise-button');
    expect(startButton?.hasAttribute('disabled')).toBe(false);
  });
  
  it('should start exercise when start button is clicked', () => {
    // Initialize exercise selector
    exerciseSelector.initialize();
    
    // Select an exercise
    exerciseSelector.selectExercise('pushup');
    
    // Get start button
    const startButton = container.querySelector('.start-exercise-button');
    expect(startButton).not.toBeNull();
    
    // Click start button
    startButton?.dispatchEvent(new Event('click'));
    
    // Check if game manager is called
    expect(getGameManager().startExercise).toHaveBeenCalledWith('pushup');
    
    // Check if pose detector is configured and started
    expect(getPoseDetector().setDetectionConfidence).toHaveBeenCalled();
    expect(getPoseDetector().setTrackingConfidence).toHaveBeenCalled();
    expect(getPoseDetector().start).toHaveBeenCalled();
    
    // Check if exercise selector is hidden
    expect(container.classList.contains('exercise-selector-hidden')).toBe(true);
    
    // Check if exercise progress UI is shown
    const progressUI = document.querySelector('.exercise-progress');
    expect(progressUI).not.toBeNull();
  });
  
  it('should apply theme based on selected exercise', () => {
    // Initialize exercise selector
    exerciseSelector.initialize();
    
    // Select push-up exercise (dogs theme)
    exerciseSelector.selectExercise('pushup');
    
    // Check if theme is applied
    expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#4ECDC4');
    
    // Select chin-up exercise (cats theme)
    exerciseSelector.selectExercise('chinup');
    
    // Check if theme is updated
    expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#FF6B6B');
  });
  
  it('should end exercise session when stop button is clicked', () => {
    // Initialize exercise selector
    exerciseSelector.initialize();
    
    // Select and start exercise
    exerciseSelector.selectExercise('pushup');
    const startButton = container.querySelector('.start-exercise-button');
    startButton?.dispatchEvent(new Event('click'));
    
    // Get stop button
    const stopButton = document.querySelector('.stop-button');
    expect(stopButton).not.toBeNull();
    
    // Click stop button
    stopButton?.dispatchEvent(new Event('click'));
    
    // Check if game manager is called
    expect(getGameManager().endExercise).toHaveBeenCalled();
    
    // Check if pose detector is stopped
    expect(getPoseDetector().stop).toHaveBeenCalled();
    
    // Check if exercise selector is shown again
    expect(container.classList.contains('exercise-selector-hidden')).toBe(false);
    
    // Check if exercise progress UI is removed
    const progressUI = document.querySelector('.exercise-progress');
    expect(progressUI).toBeNull();
  });
  
  it('should toggle pause state when pause button is clicked', () => {
    // Initialize exercise selector
    exerciseSelector.initialize();
    
    // Select and start exercise
    exerciseSelector.selectExercise('pushup');
    const startButton = container.querySelector('.start-exercise-button');
    startButton?.dispatchEvent(new Event('click'));
    
    // Get pause button
    const pauseButton = document.querySelector('.pause-button');
    expect(pauseButton).not.toBeNull();
    
    // Click pause button
    pauseButton?.dispatchEvent(new Event('click'));
    
    // Check if game manager is called
    expect(getGameManager().togglePause).toHaveBeenCalled();
  });
  
  it('should configure pose detector based on exercise type', () => {
    // Initialize exercise selector
    exerciseSelector.initialize();
    
    // Test push-up configuration
    exerciseSelector.selectExercise('pushup');
    const startButton = container.querySelector('.start-exercise-button');
    startButton?.dispatchEvent(new Event('click'));
    
    expect(getPoseDetector().setDetectionConfidence).toHaveBeenCalledWith(0.7);
    expect(getPoseDetector().setTrackingConfidence).toHaveBeenCalledWith(0.5);
    
    // Clean up
    document.querySelector('.stop-button')?.dispatchEvent(new Event('click'));
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Test chin-up configuration
    exerciseSelector.selectExercise('chinup');
    startButton?.dispatchEvent(new Event('click'));
    
    expect(getPoseDetector().setDetectionConfidence).toHaveBeenCalledWith(0.8);
    expect(getPoseDetector().setTrackingConfidence).toHaveBeenCalledWith(0.6);
  });
});