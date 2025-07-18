/**
 * AnimalRescueManager.ts
 * Manages animal rescue themes and animations
 */

import type { AnimalType, ExerciseType } from '../types/index';
import { EXERCISE_CONFIG } from '../utils/constants';
import { safeLocalStorageGet, safeLocalStorageSave } from '../utils/helpers';

// Animal rescue data interface
interface AnimalRescueData {
  dogs: number;
  cats: number;
  penguins: number;
  totalRescued: number;
  lastMilestone: Record<ExerciseType, number>;
}

export class AnimalRescueManager {
  private rescueData: AnimalRescueData;
  private isInitialized = false;
  private rescueCallbacks: ((animalType: AnimalType, count: number, milestone: boolean) => void)[] = [];

  constructor() {
    // Default rescue data
    this.rescueData = {
      dogs: 0,
      cats: 0,
      penguins: 0,
      totalRescued: 0,
      lastMilestone: {
        pushup: 0,
        chinup: 0,
        plank: 0
      }
    };

    // Load saved data
    this.loadRescueData();
  }

  /**
   * Initialize the animal rescue manager
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * Record a repetition and check for animal rescue
   * @param exerciseType Type of exercise
   * @param repCount Current repetition count
   * @returns Whether an animal was rescued
   */
  public recordRepetition(exerciseType: ExerciseType, repCount: number): boolean {
    // Get animal type for this exercise
    const animalType = this.getAnimalTypeForExercise(exerciseType);
    if (!animalType) return false;

    // Check if rep count reaches a milestone
    const milestone = this.checkMilestone(exerciseType, repCount);
    
    if (milestone) {
      // Update rescue counts
      this.rescueData[animalType]++;
      this.rescueData.totalRescued++;
      this.rescueData.lastMilestone[exerciseType] = repCount;
      
      // Save data
      this.saveRescueData();
      
      // Notify callbacks
      this.notifyRescue(animalType, this.rescueData[animalType], true);
      
      return true;
    }
    
    return false;
  }

  /**
   * Check if repetition count reaches a milestone
   * @param exerciseType Type of exercise
   * @param repCount Current repetition count
   * @returns Whether milestone was reached
   */
  private checkMilestone(exerciseType: ExerciseType, repCount: number): boolean {
    const config = EXERCISE_CONFIG[exerciseType];
    if (!config) return false;
    
    // Check if rep count is in milestones and greater than last milestone
    return config.milestones.includes(repCount) && 
           repCount > this.rescueData.lastMilestone[exerciseType];
  }

  /**
   * Get animal type for exercise
   * @param exerciseType Type of exercise
   * @returns Animal type
   */
  public getAnimalTypeForExercise(exerciseType: ExerciseType): AnimalType | null {
    const config = EXERCISE_CONFIG[exerciseType];
    return config?.animalTheme || null;
  }

  /**
   * Get rescue count for specific animal type
   * @param animalType Type of animal
   * @returns Number of animals rescued
   */
  public getRescueCount(animalType: AnimalType): number {
    return this.rescueData[animalType] || 0;
  }

  /**
   * Get total rescue count
   * @returns Total number of animals rescued
   */
  public getTotalRescueCount(): number {
    return this.rescueData.totalRescued;
  }

  /**
   * Get all rescue data
   * @returns Animal rescue data
   */
  public getRescueData(): AnimalRescueData {
    return { ...this.rescueData };
  }

  /**
   * Register callback for animal rescue events
   * @param callback Function to call when animal is rescued
   */
  public onAnimalRescue(
    callback: (animalType: AnimalType, count: number, milestone: boolean) => void
  ): void {
    this.rescueCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks of animal rescue
   * @param animalType Type of animal
   * @param count Number of animals rescued
   * @param milestone Whether this was a milestone
   */
  private notifyRescue(animalType: AnimalType, count: number, milestone: boolean): void {
    this.rescueCallbacks.forEach(callback => callback(animalType, count, milestone));
  }

  /**
   * Save rescue data to localStorage
   */
  private saveRescueData(): void {
    safeLocalStorageSave('animal-rescue-data', this.rescueData);
  }

  /**
   * Load rescue data from localStorage
   */
  private loadRescueData(): void {
    const savedData = safeLocalStorageGet<AnimalRescueData | null>(
      'animal-rescue-data',
      null
    );
    
    if (savedData) {
      this.rescueData = { ...savedData };
    }
  }

  /**
   * Reset all rescue data
   */
  public resetRescueData(): void {
    this.rescueData = {
      dogs: 0,
      cats: 0,
      penguins: 0,
      totalRescued: 0,
      lastMilestone: {
        pushup: 0,
        chinup: 0,
        plank: 0
      }
    };
    
    this.saveRescueData();
  }
}

// Singleton instance
let animalRescueManagerInstance: AnimalRescueManager | null = null;

/**
 * Get the animal rescue manager instance
 */
export function getAnimalRescueManager(): AnimalRescueManager {
  if (!animalRescueManagerInstance) {
    animalRescueManagerInstance = new AnimalRescueManager();
  }
  return animalRescueManagerInstance;
}

/**
 * Initialize the animal rescue manager
 */
export function initializeAnimalRescueManager(): boolean {
  const manager = getAnimalRescueManager();
  return manager.initialize();
}