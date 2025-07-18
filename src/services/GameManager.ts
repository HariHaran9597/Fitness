/**
 * GameManager.ts
 * Handles game state and scoring logic
 */

import { GameState, ExerciseType, AnimalType } from '../types/index';
import { safeLocalStorageGet, safeLocalStorageSave } from '../utils/helpers';
import { STORAGE_KEYS, EXERCISE_CONFIG } from '../utils/constants';

export class GameManager {
  private gameState: GameState;
  private sessionStartTime: number;
  private isInitialized = false;
  private stateChangeCallbacks: ((state: GameState) => void)[] = [];

  constructor() {
    // Default game state
    this.gameState = {
      currentExercise: null,
      repCount: 0,
      animalsRescued: 0,
      sessionStartTime: 0,
      isActive: false
    };

    this.sessionStartTime = Date.now();

    // Try to load saved game state
    this.loadState();
  }

  /**
   * Initialize the game manager
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }

    // Set up auto-save interval
    setInterval(() => this.saveState(), 30000); // Save every 30 seconds

    this.isInitialized = true;
    return true;
  }

  /**
   * Start a new exercise session
   * @param exerciseType Type of exercise
   */
  public startExercise(exerciseType: ExerciseType): void {
    this.gameState.currentExercise = exerciseType;
    this.gameState.repCount = 0;
    this.gameState.isActive = true;
    this.gameState.sessionStartTime = Date.now();

    this.notifyStateChange();
    console.log(`Started ${exerciseType} exercise session`);
  }

  /**
   * End current exercise session
   */
  public endExercise(): void {
    if (!this.gameState.isActive) return;

    // Calculate session duration
    const sessionDuration = Date.now() - this.gameState.sessionStartTime;
    
    console.log(`Ended exercise session. Duration: ${Math.round(sessionDuration / 1000)} seconds, Reps: ${this.gameState.repCount}`);
    
    // Save session stats (to be expanded in Task 12)
    
    this.gameState.isActive = false;
    this.notifyStateChange();
    this.saveState();
  }

  /**
   * Record a completed repetition
   * @param exerciseType Type of exercise
   * @returns Whether milestone was reached
   */
  public recordRepetition(exerciseType: ExerciseType): boolean {
    if (!this.gameState.isActive || this.gameState.currentExercise !== exerciseType) {
      this.startExercise(exerciseType);
    }

    this.gameState.repCount++;
    
    // Check if we've reached a milestone for animal rescue
    const milestoneReached = this.checkMilestone(exerciseType);
    
    if (milestoneReached) {
      this.gameState.animalsRescued++;
    }
    
    this.notifyStateChange();
    return milestoneReached;
  }

  /**
   * Check if current rep count reaches a milestone
   * @param exerciseType Type of exercise
   * @returns Whether milestone was reached
   */
  private checkMilestone(exerciseType: ExerciseType): boolean {
    const config = EXERCISE_CONFIG[exerciseType];
    if (!config) return false;
    
    return config.milestones.includes(this.gameState.repCount);
  }

  /**
   * Get animal type for current exercise
   */
  public getAnimalType(): AnimalType | null {
    if (!this.gameState.currentExercise) return null;
    
    const config = EXERCISE_CONFIG[this.gameState.currentExercise];
    return config?.animalTheme || null;
  }

  /**
   * Get current game state
   */
  public getState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Save game state to localStorage
   */
  private saveState(): void {
    safeLocalStorageSave(STORAGE_KEYS.USER_PROGRESS, this.gameState);
  }

  /**
   * Load game state from localStorage
   */
  private loadState(): void {
    const savedState = safeLocalStorageGet<GameState | null>(
      STORAGE_KEYS.USER_PROGRESS,
      null
    );
    
    if (savedState) {
      // Only load certain properties, keep session-specific ones fresh
      this.gameState.animalsRescued = savedState.animalsRescued;
    }
  }

  /**
   * Register callback for state changes
   * @param callback Function to call when state changes
   */
  public onStateChange(callback: (state: GameState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks of state change
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeCallbacks.forEach(callback => callback(state));
  }

  /**
   * Reset all progress
   */
  public resetProgress(): void {
    this.gameState = {
      currentExercise: null,
      repCount: 0,
      animalsRescued: 0,
      sessionStartTime: Date.now(),
      isActive: false
    };
    
    this.saveState();
    this.notifyStateChange();
  }
}

// Singleton instance
let gameManagerInstance: GameManager | null = null;

/**
 * Get the game manager instance
 */
export function getGameManager(): GameManager {
  if (!gameManagerInstance) {
    gameManagerInstance = new GameManager();
  }
  return gameManagerInstance;
}

/**
 * Initialize the game manager
 */
export async function initializeGameManager(): Promise<boolean> {
  const gameManager = getGameManager();
  return gameManager.initialize();
}