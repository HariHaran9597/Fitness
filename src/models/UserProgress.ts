/**
 * UserProgress.ts
 * Data model for user progress tracking with IndexedDB storage
 */

import type { ExerciseType, AnimalTheme } from '../types/index';

/**
 * Exercise statistics
 */
export interface ExerciseStats {
  exerciseType: ExerciseType;
  totalReps: number;
  totalDuration: number; // in milliseconds
  bestStreak: number;
  lastPerformed: Date | null;
  averageFormScore: number;
  animalsRescued: number;
}

/**
 * Achievement badge
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt: Date;
  category: 'exercise' | 'rescue' | 'streak' | 'form';
}

/**
 * Workout session
 */
export interface WorkoutSession {
  sessionId: string;
  exerciseType: ExerciseType;
  startTime: Date;
  endTime: Date | null;
  totalReps: number;
  duration: number; // in milliseconds
  averageFormScore: number;
  animalsRescued: {
    type: AnimalTheme;
    count: number;
  }[];
  caloriesBurned?: number;
}

/**
 * User progress data
 */
export interface UserProgressData {
  userId: string;
  totalWorkouts: number;
  totalExerciseTime: number; // in milliseconds
  exerciseStats: Map<ExerciseType, ExerciseStats>;
  achievements: Achievement[];
  totalAnimalsRescued: {
    cats: number;
    dogs: number;
    penguins: number;
  };
  streakDays: number;
  lastWorkout: Date | null;
  createdAt: Date;
}

/**
 * Database schema version
 */
const DB_VERSION = 1;

/**
 * Database name
 */
const DB_NAME = 'ai-fitness-game';

/**
 * User progress store name
 */
const USER_PROGRESS_STORE = 'user-progress';

/**
 * Workout session store name
 */
const WORKOUT_SESSION_STORE = 'workout-sessions';

/**
 * UserProgress class for managing user progress data
 */
export class UserProgress {
  private db: IDBDatabase | null = null;
  private userId: string;
  private data: UserProgressData | null = null;
  private isInitialized = false;

  /**
   * Create a new UserProgress instance
   * @param userId User ID
   */
  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Initialize the database
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Open database
      this.db = await this.openDatabase();
      
      // Load user progress data
      await this.loadUserProgress();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize user progress:', error);
      return false;
    }
  }

  /**
   * Open the IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      // Create object stores if needed
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create user progress store
        if (!db.objectStoreNames.contains(USER_PROGRESS_STORE)) {
          const userProgressStore = db.createObjectStore(USER_PROGRESS_STORE, { keyPath: 'userId' });
          userProgressStore.createIndex('userId', 'userId', { unique: true });
          userProgressStore.createIndex('lastWorkout', 'lastWorkout', { unique: false });
        }
        
        // Create workout sessions store
        if (!db.objectStoreNames.contains(WORKOUT_SESSION_STORE)) {
          const workoutSessionStore = db.createObjectStore(WORKOUT_SESSION_STORE, { keyPath: 'sessionId' });
          workoutSessionStore.createIndex('userId', 'userId', { unique: false });
          workoutSessionStore.createIndex('exerciseType', 'exerciseType', { unique: false });
          workoutSessionStore.createIndex('startTime', 'startTime', { unique: false });
        }
      };
      
      // Handle success
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };
      
      // Handle error
      request.onerror = (event) => {
        reject(new Error(`Failed to open database: ${(event.target as IDBOpenDBRequest).error}`));
      };
    });
  }

  /**
   * Load user progress data
   */
  private async loadUserProgress(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    try {
      // Get user progress from database
      const userProgress = await this.getUserProgressFromDB(this.userId);
      
      if (userProgress) {
        // Convert plain object to UserProgressData
        this.data = this.convertToUserProgressData(userProgress);
      } else {
        // Create new user progress data
        this.data = this.createNewUserProgress();
        
        // Save to database
        await this.saveUserProgress();
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
      
      // Create new user progress data as fallback
      this.data = this.createNewUserProgress();
    }
  }

  /**
   * Get user progress from database
   * @param userId User ID
   */
  private getUserProgressFromDB(userId: string): Promise<any> {
    if (!this.db) {
      return Promise.reject(new Error('Database not initialized'));
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(USER_PROGRESS_STORE, 'readonly');
      const store = transaction.objectStore(USER_PROGRESS_STORE);
      const request = store.get(userId);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get user progress: ${request.error}`));
      };
    });
  }

  /**
   * Convert plain object to UserProgressData
   * @param obj Plain object
   */
  private convertToUserProgressData(obj: any): UserProgressData {
    // Convert exerciseStats from plain object to Map
    const exerciseStats = new Map<ExerciseType, ExerciseStats>();
    
    if (obj.exerciseStats) {
      Object.entries(obj.exerciseStats).forEach(([key, value]) => {
        exerciseStats.set(key as ExerciseType, {
          ...(value as ExerciseStats),
          lastPerformed: value.lastPerformed ? new Date(value.lastPerformed) : null
        });
      });
    }
    
    // Convert dates
    const lastWorkout = obj.lastWorkout ? new Date(obj.lastWorkout) : null;
    const createdAt = obj.createdAt ? new Date(obj.createdAt) : new Date();
    
    // Convert achievements
    const achievements = obj.achievements ? obj.achievements.map((achievement: any) => ({
      ...achievement,
      unlockedAt: new Date(achievement.unlockedAt)
    })) : [];
    
    return {
      userId: obj.userId,
      totalWorkouts: obj.totalWorkouts || 0,
      totalExerciseTime: obj.totalExerciseTime || 0,
      exerciseStats,
      achievements,
      totalAnimalsRescued: obj.totalAnimalsRescued || { cats: 0, dogs: 0, penguins: 0 },
      streakDays: obj.streakDays || 0,
      lastWorkout,
      createdAt
    };
  }

  /**
   * Create new user progress data
   */
  private createNewUserProgress(): UserProgressData {
    return {
      userId: this.userId,
      totalWorkouts: 0,
      totalExerciseTime: 0,
      exerciseStats: new Map<ExerciseType, ExerciseStats>(),
      achievements: [],
      totalAnimalsRescued: {
        cats: 0,
        dogs: 0,
        penguins: 0
      },
      streakDays: 0,
      lastWorkout: null,
      createdAt: new Date()
    };
  }

  /**
   * Save user progress to database
   */
  private async saveUserProgress(): Promise<void> {
    if (!this.db || !this.data) {
      throw new Error('Database or user progress data not initialized');
    }
    
    return new Promise((resolve, reject) => {
      // Convert Map to plain object for storage
      const dataToStore = {
        ...this.data,
        exerciseStats: Object.fromEntries(this.data.exerciseStats)
      };
      
      const transaction = this.db.transaction(USER_PROGRESS_STORE, 'readwrite');
      const store = transaction.objectStore(USER_PROGRESS_STORE);
      const request = store.put(dataToStore);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to save user progress: ${request.error}`));
      };
    });
  }

  /**
   * Record a workout session
   * @param session Workout session
   */
  public async recordWorkoutSession(session: WorkoutSession): Promise<void> {
    if (!this.db || !this.data) {
      throw new Error('Database or user progress data not initialized');
    }
    
    try {
      // Save workout session to database
      await this.saveWorkoutSession(session);
      
      // Update user progress
      this.updateUserProgressWithSession(session);
      
      // Check for achievements
      this.checkForAchievements();
      
      // Save updated user progress
      await this.saveUserProgress();
    } catch (error) {
      console.error('Failed to record workout session:', error);
      throw error;
    }
  }

  /**
   * Save workout session to database
   * @param session Workout session
   */
  private saveWorkoutSession(session: WorkoutSession): Promise<void> {
    if (!this.db) {
      return Promise.reject(new Error('Database not initialized'));
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(WORKOUT_SESSION_STORE, 'readwrite');
      const store = transaction.objectStore(WORKOUT_SESSION_STORE);
      
      // Add userId to session for querying
      const sessionWithUserId = {
        ...session,
        userId: this.userId
      };
      
      const request = store.add(sessionWithUserId);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to save workout session: ${request.error}`));
      };
    });
  }

  /**
   * Update user progress with workout session
   * @param session Workout session
   */
  private updateUserProgressWithSession(session: WorkoutSession): void {
    if (!this.data) return;
    
    // Update total workouts
    this.data.totalWorkouts++;
    
    // Update last workout
    this.data.lastWorkout = new Date();
    
    // Update streak days
    this.updateStreakDays();
    
    // Update total exercise time
    const sessionDuration = session.duration || 
      (session.endTime && session.startTime ? 
        session.endTime.getTime() - session.startTime.getTime() : 0);
    
    this.data.totalExerciseTime += sessionDuration;
    
    // Update exercise stats
    let exerciseStats = this.data.exerciseStats.get(session.exerciseType);
    
    if (!exerciseStats) {
      // Create new exercise stats
      exerciseStats = {
        exerciseType: session.exerciseType,
        totalReps: 0,
        totalDuration: 0,
        bestStreak: 0,
        lastPerformed: null,
        averageFormScore: 0,
        animalsRescued: 0
      };
      
      this.data.exerciseStats.set(session.exerciseType, exerciseStats);
    }
    
    // Update exercise stats
    exerciseStats.totalReps += session.totalReps;
    exerciseStats.totalDuration += sessionDuration;
    exerciseStats.lastPerformed = new Date();
    
    // Update average form score
    const totalSessions = this.data.totalWorkouts;
    exerciseStats.averageFormScore = 
      ((exerciseStats.averageFormScore * (totalSessions - 1)) + session.averageFormScore) / totalSessions;
    
    // Update animals rescued
    let totalAnimalsRescued = 0;
    
    session.animalsRescued.forEach(animal => {
      // Update total animals rescued by type
      if (animal.type === 'cats') {
        this.data!.totalAnimalsRescued.cats += animal.count;
      } else if (animal.type === 'dogs') {
        this.data!.totalAnimalsRescued.dogs += animal.count;
      } else if (animal.type === 'penguins') {
        this.data!.totalAnimalsRescued.penguins += animal.count;
      }
      
      totalAnimalsRescued += animal.count;
    });
    
    exerciseStats.animalsRescued += totalAnimalsRescued;
  }

  /**
   * Update streak days
   */
  private updateStreakDays(): void {
    if (!this.data) return;
    
    const now = new Date();
    const lastWorkout = this.data.lastWorkout;
    
    if (!lastWorkout) {
      // First workout
      this.data.streakDays = 1;
      return;
    }
    
    // Check if last workout was yesterday or today
    const lastWorkoutDate = new Date(lastWorkout);
    const lastWorkoutDay = lastWorkoutDate.setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.setHours(0, 0, 0, 0);
    
    if (lastWorkoutDay === today) {
      // Already worked out today, streak stays the same
      return;
    } else if (lastWorkoutDay === yesterdayDate) {
      // Worked out yesterday, increment streak
      this.data.streakDays++;
    } else {
      // Missed a day, reset streak
      this.data.streakDays = 1;
    }
  }

  /**
   * Check for achievements
   */
  private checkForAchievements(): void {
    if (!this.data) return;
    
    const achievements: Achievement[] = [];
    
    // Check for workout count achievements
    if (this.data.totalWorkouts === 1) {
      achievements.push(this.createAchievement(
        'first-workout',
        'First Workout',
        'Completed your first workout',
        '🏆',
        'exercise'
      ));
    } else if (this.data.totalWorkouts === 10) {
      achievements.push(this.createAchievement(
        'ten-workouts',
        'Dedicated',
        'Completed 10 workouts',
        '🏆',
        'exercise'
      ));
    } else if (this.data.totalWorkouts === 50) {
      achievements.push(this.createAchievement(
        'fifty-workouts',
        'Fitness Enthusiast',
        'Completed 50 workouts',
        '🏆',
        'exercise'
      ));
    } else if (this.data.totalWorkouts === 100) {
      achievements.push(this.createAchievement(
        'hundred-workouts',
        'Fitness Master',
        'Completed 100 workouts',
        '🏆',
        'exercise'
      ));
    }
    
    // Check for streak achievements
    if (this.data.streakDays === 3) {
      achievements.push(this.createAchievement(
        'three-day-streak',
        'Consistency',
        'Worked out for 3 days in a row',
        '🔥',
        'streak'
      ));
    } else if (this.data.streakDays === 7) {
      achievements.push(this.createAchievement(
        'week-streak',
        'Weekly Warrior',
        'Worked out for 7 days in a row',
        '🔥',
        'streak'
      ));
    } else if (this.data.streakDays === 30) {
      achievements.push(this.createAchievement(
        'month-streak',
        'Monthly Master',
        'Worked out for 30 days in a row',
        '🔥',
        'streak'
      ));
    }
    
    // Check for animal rescue achievements
    const totalAnimals = 
      this.data.totalAnimalsRescued.cats + 
      this.data.totalAnimalsRescued.dogs + 
      this.data.totalAnimalsRescued.penguins;
    
    if (totalAnimals >= 10) {
      achievements.push(this.createAchievement(
        'ten-animals',
        'Animal Friend',
        'Rescued 10 animals',
        '🐾',
        'rescue'
      ));
    } else if (totalAnimals >= 50) {
      achievements.push(this.createAchievement(
        'fifty-animals',
        'Animal Protector',
        'Rescued 50 animals',
        '🐾',
        'rescue'
      ));
    } else if (totalAnimals >= 100) {
      achievements.push(this.createAchievement(
        'hundred-animals',
        'Animal Savior',
        'Rescued 100 animals',
        '🐾',
        'rescue'
      ));
    }
    
    // Add new achievements
    achievements.forEach(achievement => {
      // Check if achievement already exists
      const existingAchievement = this.data!.achievements.find(a => a.id === achievement.id);
      
      if (!existingAchievement) {
        this.data!.achievements.push(achievement);
      }
    });
  }

  /**
   * Create a new achievement
   * @param id Achievement ID
   * @param name Achievement name
   * @param description Achievement description
   * @param iconUrl Achievement icon URL
   * @param category Achievement category
   */
  private createAchievement(
    id: string,
    name: string,
    description: string,
    iconUrl: string,
    category: 'exercise' | 'rescue' | 'streak' | 'form'
  ): Achievement {
    return {
      id,
      name,
      description,
      iconUrl,
      unlockedAt: new Date(),
      category
    };
  }

  /**
   * Get user progress data
   */
  public getUserProgressData(): UserProgressData | null {
    return this.data;
  }

  /**
   * Get workout sessions
   * @param limit Maximum number of sessions to return
   * @param offset Offset for pagination
   */
  public async getWorkoutSessions(limit = 10, offset = 0): Promise<WorkoutSession[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(WORKOUT_SESSION_STORE, 'readonly');
      const store = transaction.objectStore(WORKOUT_SESSION_STORE);
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(this.userId));
      
      const sessions: WorkoutSession[] = [];
      let cursorCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          if (cursorCount >= offset && cursorCount < offset + limit) {
            // Convert dates
            const session = cursor.value;
            sessions.push({
              ...session,
              startTime: new Date(session.startTime),
              endTime: session.endTime ? new Date(session.endTime) : null
            });
          }
          
          cursorCount++;
          
          if (cursorCount < offset + limit) {
            cursor.continue();
          } else {
            resolve(sessions);
          }
        } else {
          resolve(sessions);
        }
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get workout sessions: ${request.error}`));
      };
    });
  }

  /**
   * Get workout sessions by exercise type
   * @param exerciseType Exercise type
   * @param limit Maximum number of sessions to return
   * @param offset Offset for pagination
   */
  public async getWorkoutSessionsByExerciseType(
    exerciseType: ExerciseType,
    limit = 10,
    offset = 0
  ): Promise<WorkoutSession[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(WORKOUT_SESSION_STORE, 'readonly');
      const store = transaction.objectStore(WORKOUT_SESSION_STORE);
      const index = store.index('exerciseType');
      const request = index.openCursor(IDBKeyRange.only(exerciseType));
      
      const sessions: WorkoutSession[] = [];
      let cursorCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const session = cursor.value;
          
          // Check if session belongs to current user
          if (session.userId === this.userId) {
            if (cursorCount >= offset && cursorCount < offset + limit) {
              // Convert dates
              sessions.push({
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : null
              });
            }
            
            cursorCount++;
          }
          
          if (cursorCount < offset + limit) {
            cursor.continue();
          } else {
            resolve(sessions);
          }
        } else {
          resolve(sessions);
        }
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get workout sessions: ${request.error}`));
      };
    });
  }

  /**
   * Get workout sessions by date range
   * @param startDate Start date
   * @param endDate End date
   */
  public async getWorkoutSessionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutSession[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(WORKOUT_SESSION_STORE, 'readonly');
      const store = transaction.objectStore(WORKOUT_SESSION_STORE);
      const index = store.index('startTime');
      const request = index.openCursor(IDBKeyRange.bound(startDate, endDate));
      
      const sessions: WorkoutSession[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const session = cursor.value;
          
          // Check if session belongs to current user
          if (session.userId === this.userId) {
            // Convert dates
            sessions.push({
              ...session,
              startTime: new Date(session.startTime),
              endTime: session.endTime ? new Date(session.endTime) : null
            });
          }
          
          cursor.continue();
        } else {
          resolve(sessions);
        }
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get workout sessions: ${request.error}`));
      };
    });
  }

  /**
   * Get achievements
   */
  public getAchievements(): Achievement[] {
    if (!this.data) {
      return [];
    }
    
    return this.data.achievements;
  }

  /**
   * Get exercise stats
   * @param exerciseType Exercise type
   */
  public getExerciseStats(exerciseType: ExerciseType): ExerciseStats | undefined {
    if (!this.data) {
      return undefined;
    }
    
    return this.data.exerciseStats.get(exerciseType);
  }

  /**
   * Get all exercise stats
   */
  public getAllExerciseStats(): Map<ExerciseType, ExerciseStats> {
    if (!this.data) {
      return new Map();
    }
    
    return this.data.exerciseStats;
  }

  /**
   * Get total animals rescued
   */
  public getTotalAnimalsRescued(): { cats: number; dogs: number; penguins: number } {
    if (!this.data) {
      return { cats: 0, dogs: 0, penguins: 0 };
    }
    
    return this.data.totalAnimalsRescued;
  }

  /**
   * Get streak days
   */
  public getStreakDays(): number {
    if (!this.data) {
      return 0;
    }
    
    return this.data.streakDays;
  }

  /**
   * Reset user progress
   */
  public async resetUserProgress(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    try {
      // Delete user progress
      await this.deleteUserProgress();
      
      // Delete workout sessions
      await this.deleteWorkoutSessions();
      
      // Create new user progress data
      this.data = this.createNewUserProgress();
      
      // Save to database
      await this.saveUserProgress();
    } catch (error) {
      console.error('Failed to reset user progress:', error);
      throw error;
    }
  }

  /**
   * Delete user progress
   */
  private deleteUserProgress(): Promise<void> {
    if (!this.db) {
      return Promise.reject(new Error('Database not initialized'));
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(USER_PROGRESS_STORE, 'readwrite');
      const store = transaction.objectStore(USER_PROGRESS_STORE);
      const request = store.delete(this.userId);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete user progress: ${request.error}`));
      };
    });
  }

  /**
   * Delete workout sessions
   */
  private deleteWorkoutSessions(): Promise<void> {
    if (!this.db) {
      return Promise.reject(new Error('Database not initialized'));
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(WORKOUT_SESSION_STORE, 'readwrite');
      const store = transaction.objectStore(WORKOUT_SESSION_STORE);
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(this.userId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete workout sessions: ${request.error}`));
      };
    });
  }

  /**
   * Close the database
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    this.isInitialized = false;
  }
}