/**
 * ExerciseSelector.ts
 * Component for selecting exercise types
 */

import type { ExerciseType } from '../../types/index';
import { EXERCISE_CONFIG } from '../../utils/constants';

export class ExerciseSelector {
  private container: HTMLElement;
  private isInitialized = false;
  private selectedExercise: ExerciseType | null = null;
  private exerciseButtons: Map<ExerciseType, HTMLElement> = new Map();
  private exerciseSelectedCallbacks: ((exercise: ExerciseType) => void)[] = [];

  /**
   * Create a new ExerciseSelector
   * @param containerId ID of the container element
   */
  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }
    
    this.container = container;
  }

  /**
   * Initialize the exercise selector
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Create exercise selection UI
      this.createExerciseButtons();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize exercise selector:', error);
      return false;
    }
  }

  /**
   * Create exercise selection buttons
   */
  private createExerciseButtons(): void {
    // Clear container
    this.container.innerHTML = '';
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Choose Your Exercise';
    title.className = 'exercise-selector-title';
    this.container.appendChild(title);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'exercise-button-container';
    
    // Create buttons for each exercise type
    const exerciseTypes: ExerciseType[] = ['pushup', 'chinup', 'plank'];
    
    exerciseTypes.forEach(exerciseType => {
      const button = document.createElement('button');
      button.className = 'exercise-button';
      button.dataset.exercise = exerciseType;
      
      // Get exercise config
      const config = EXERCISE_CONFIG[exerciseType];
      
      // Create button content
      const icon = document.createElement('div');
      icon.className = 'exercise-icon';
      
      // Set icon based on exercise type
      switch (exerciseType) {
        case 'pushup':
          icon.innerHTML = '💪';
          break;
        case 'chinup':
          icon.innerHTML = '🏋️';
          break;
        case 'plank':
          icon.innerHTML = '🧘';
          break;
      }
      
      const name = document.createElement('div');
      name.className = 'exercise-name';
      name.textContent = config?.name || this.capitalizeFirstLetter(exerciseType);
      
      const description = document.createElement('div');
      description.className = 'exercise-description';
      description.textContent = config?.description || `Perform ${this.capitalizeFirstLetter(exerciseType)} exercises to rescue animals!`;
      
      const animalType = document.createElement('div');
      animalType.className = 'exercise-animal-type';
      
      // Set animal emoji based on animal theme
      switch (config?.animalTheme) {
        case 'cats':
          animalType.innerHTML = 'Rescue Cats 🐱';
          break;
        case 'dogs':
          animalType.innerHTML = 'Rescue Dogs 🐶';
          break;
        case 'penguins':
          animalType.innerHTML = 'Rescue Penguins 🐧';
          break;
      }
      
      // Add elements to button
      button.appendChild(icon);
      button.appendChild(name);
      button.appendChild(description);
      button.appendChild(animalType);
      
      // Add click handler
      button.addEventListener('click', () => this.selectExercise(exerciseType));
      
      // Add to container
      buttonContainer.appendChild(button);
      
      // Store reference
      this.exerciseButtons.set(exerciseType, button);
    });
    
    this.container.appendChild(buttonContainer);
  }

  /**
   * Select an exercise
   * @param exerciseType Type of exercise to select
   */
  public selectExercise(exerciseType: ExerciseType): void {
    // Update selected exercise
    this.selectedExercise = exerciseType;
    
    // Update button styles
    this.exerciseButtons.forEach((button, type) => {
      if (type === exerciseType) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });
    
    // Hide exercise selector
    this.container.classList.add('exercise-selector-hidden');
    
    // Create exercise UI
    this.createExerciseUI(exerciseType);
    
    // Notify callbacks
    this.exerciseSelectedCallbacks.forEach(callback => callback(exerciseType));
  }

  /**
   * Create exercise-specific UI
   * @param exerciseType Type of exercise
   */
  private createExerciseUI(exerciseType: ExerciseType): void {
    // Get exercise config
    const config = EXERCISE_CONFIG[exerciseType];
    
    // Create exercise progress UI
    const progressUI = document.createElement('div');
    progressUI.className = 'exercise-progress';
    
    // Create exercise title
    const title = document.createElement('h2');
    title.textContent = config?.name || this.capitalizeFirstLetter(exerciseType);
    title.className = 'exercise-title';
    progressUI.appendChild(title);
    
    // Create exercise instructions
    const instructions = document.createElement('div');
    instructions.className = 'exercise-instructions';
    
    switch (exerciseType) {
      case 'pushup':
        instructions.innerHTML = `
          <p>Position yourself in front of the camera in a push-up position.</p>
          <p>Lower your body until your elbows are at 90 degrees.</p>
          <p>Push back up to the starting position.</p>
          <p>Complete reps to rescue cats!</p>
        `;
        break;
      case 'chinup':
        instructions.innerHTML = `
          <p>Position yourself in front of the camera with your arms raised.</p>
          <p>Pull your body up until your chin is above the bar.</p>
          <p>Lower your body back to the starting position.</p>
          <p>Complete reps to rescue dogs!</p>
        `;
        break;
      case 'plank':
        instructions.innerHTML = `
          <p>Position yourself in front of the camera in a plank position.</p>
          <p>Keep your body straight and core engaged.</p>
          <p>Hold the position as long as possible.</p>
          <p>Reach time milestones to rescue penguins!</p>
        `;
        break;
    }
    
    progressUI.appendChild(instructions);
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.className = 'exercise-back-button';
    backButton.textContent = 'Back to Exercise Selection';
    backButton.addEventListener('click', () => this.showExerciseSelector());
    progressUI.appendChild(backButton);
    
    // Add to document
    document.body.appendChild(progressUI);
  }

  /**
   * Show exercise selector
   */
  public showExerciseSelector(): void {
    // Show exercise selector
    this.container.classList.remove('exercise-selector-hidden');
    
    // Remove exercise progress UI
    const progressUI = document.querySelector('.exercise-progress');
    if (progressUI) {
      progressUI.remove();
    }
    
    // Clear selected exercise
    this.selectedExercise = null;
    
    // Update button styles
    this.exerciseButtons.forEach(button => {
      button.classList.remove('selected');
    });
  }

  /**
   * Get the currently selected exercise
   * @returns Selected exercise type or null if none selected
   */
  public getSelectedExercise(): ExerciseType | null {
    return this.selectedExercise;
  }

  /**
   * Register callback for exercise selection
   * @param callback Function to call when exercise is selected
   */
  public onExerciseSelected(callback: (exercise: ExerciseType) => void): void {
    this.exerciseSelectedCallbacks.push(callback);
  }

  /**
   * Capitalize the first letter of a string
   * @param str String to capitalize
   * @returns Capitalized string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Remove event listeners
    this.exerciseButtons.forEach(button => {
      button.removeEventListener('click', () => {});
    });
    
    // Clear container
    this.container.innerHTML = '';
    
    // Remove exercise progress UI
    const progressUI = document.querySelector('.exercise-progress');
    if (progressUI) {
      progressUI.remove();
    }
    
    this.exerciseButtons.clear();
    this.exerciseSelectedCallbacks = [];
    this.isInitialized = false;
  }
}