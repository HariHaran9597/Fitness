/**
 * Core type definitions for the AI Fitness Game
 */

/**
 * Supported exercise types
 */
export type ExerciseType = 'pushup' | 'chinup' | 'plank';

/**
 * Animal theme types
 */
export type AnimalType = 'dogs' | 'cats' | 'penguins';

/**
 * Pose landmark structure from MediaPipe
 */
export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * Result from pose detection
 */
export interface PoseResult {
  landmarks: Landmark3D[];
  worldLandmarks: Landmark3D[];
  confidence: number;
  timestamp: number;
}

/**
 * Exercise validation result
 */
export interface ExerciseValidation {
  isValid: boolean;
  feedback: string[];
  completedRep: boolean;
  formScore: number;
}

/**
 * Game state
 */
export interface GameState {
  currentExercise: ExerciseType | null;
  repCount: number;
  animalsRescued: number;
  sessionStartTime: number;
  isActive: boolean;
}

/**
 * Rescue theme configuration
 */
export interface RescueTheme {
  animalType: AnimalType;
  rescueGoal: number;
  currentProgress: number;
  animations: AnimationConfig[];
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  id: string;
  type: string;
  duration: number;
  options?: Record<string, any>;
}

/**
 * Loading state types
 */
export enum LoadingStateType {
  INITIAL = 'initial',
  CAMERA = 'camera',
  POSE_DETECTION = 'pose_detection',
  ASSETS = 'assets',
  EXERCISE = 'exercise'
}

/**
 * Disposable interface for memory management
 */
export interface Disposable {
  dispose(): void;
}