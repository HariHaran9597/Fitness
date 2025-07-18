/**
 * WorkoutSessionManager.ts
 * Service for managing workout sessions
 */

import { UserProgress, WorkoutSession } from '../models/UserProgress';
import type { ExerciseType, AnimalTheme } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

/**
 * WorkoutSessionManager class
 */
export class WorkoutSessionManager {
  private userProgress: UserProgress;
  private currentSession: WorkoutSession | null = null;
  private formScores: number[] = [];
  private animalsRescued: { type: AnimalTheme; count: number }[] = [];

  /**
   * Create a new WorkoutSessionManager
   * @param userProgress UserProgress instance
   */
  constructor(userProgress: UserProgress) {
    this.userProgress = userProgress;
  }

  /**
   * Start a new workout session
   * @param exerciseType Exercise type
   */
  public startSession(exerciseType: ExerciseType): void {
    // End current session if exists
    if (this.currentSession) {
      this.endSession();
    }
    
    // Create new session
    this.currentSession = {
      sessionId: uuidv4(),
      exerciseType,
      startTime: new Date(),
      endTime: null,
      totalReps: 0,
      duration: 0,
      averageFormScore: 0,
      animalsRescued: []
    };
    
    // Reset tracking
    this.formScores = [];
    this.animalsRescued = [];
    
    console.log(`Started new ${exerciseType} session`);
  }

  /**
   * End current workout session
   */
  public async endSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    
    // Set end time
    this.currentSession.endTime = new Date();
    
    // Calculate duration
    this.currentSession.duration = 
      this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
    
    // Calculate average form score
    if (this.formScores.length > 0) {
      const totalScore = this.formScores.reduce((sum, score) => sum + score, 0);
      this.currentSession.averageFormScore = totalScore / this.formScores.length;
    }
    
    // Set animals rescued
    this.currentSession.animalsRescued = [...this.animalsRescued];
    
    // Record session
    try {
      await this.userProgress.recordWorkoutSession(this.currentSession);
      console.log('Workout session recorded successfully');
    } catch (error) {
      console.error('Failed to record workout session:', error);
    }
    
    // Clear current session
    this.currentSession = null;
    this.formScores = [];
    this.animalsRescued = [];
  }

  /**
   * Record a repetition
   * @param formScore Form score
   */
  public recordRepetition(formScore: number): void {
    if (!this.currentSession) {
      return;
    }
    
    // Increment rep count
    this.currentSession.totalReps++;
    
    // Add form score
    this.formScores.push(formScore);
  }

  /**
   * Record rescued animals
   * @param animalType Animal type
   * @param count Number of animals rescued
   */
  public recordRescuedAnimals(animalType: AnimalTheme, count: number): void {
    if (!this.currentSession) {
      return;
    }
    
    // Find existing entry for animal type
    const existingEntry = this.animalsRescued.find(entry => entry.type === animalType);
    
    if (existingEntry) {
      // Update count
      existingEntry.count += count;
    } else {
      // Add new entry
      this.animalsRescued.push({ type: animalType, count });
    }
  }

  /**
   * Get current session
   */
  public getCurrentSession(): WorkoutSession | null {
    return this.currentSession;
  }

  /**
   * Check if a session is in progress
   */
  public isSessionInProgress(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get current session duration in milliseconds
   */
  public getCurrentSessionDuration(): number {
    if (!this.currentSession) {
      return 0;
    }
    
    return Date.now() - this.currentSession.startTime.getTime();
  }

  /**
   * Get current session formatted duration (MM:SS)
   */
  public getFormattedSessionDuration(): string {
    const duration = this.getCurrentSessionDuration();
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}