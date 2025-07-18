/**
 * ExerciseValidator.ts
 * Base class for exercise validation
 */

import { PoseResult, ExerciseValidation, Landmark3D } from '../types/index';

export abstract class ExerciseValidator {
  protected repCount = 0;
  protected isInPosition = false;
  protected lastValidationTime = 0;
  protected validationHistory: boolean[] = [];
  protected readonly historySize = 5; // Number of frames to consider for stability

  /**
   * Validate exercise form and count repetitions
   * @param poseResult Pose detection result
   * @returns Exercise validation result
   */
  public abstract validate(poseResult: PoseResult): ExerciseValidation;

  /**
   * Reset the validator state
   */
  public reset(): void {
    this.repCount = 0;
    this.isInPosition = false;
    this.lastValidationTime = 0;
    this.validationHistory = [];
  }

  /**
   * Get current repetition count
   */
  public getRepCount(): number {
    return this.repCount;
  }

  /**
   * Calculate angle between three points
   * @param a First point
   * @param b Middle point (vertex)
   * @param c Third point
   * @returns Angle in degrees
   */
  protected calculateAngle(a: Landmark3D, b: Landmark3D, c: Landmark3D): number {
    // Vector from b to a
    const ba = { x: a.x - b.x, y: a.y - b.y };
    // Vector from b to c
    const bc = { x: c.x - b.x, y: c.y - b.y };

    // Calculate dot product
    const dotProduct = ba.x * bc.x + ba.y * bc.y;
    
    // Calculate magnitudes
    const magnitudeBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
    const magnitudeBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

    // Calculate angle in radians
    const angleRad = Math.acos(dotProduct / (magnitudeBA * magnitudeBC));
    
    // Convert to degrees
    return angleRad * (180 / Math.PI);
  }

  /**
   * Calculate distance between two points
   * @param a First point
   * @param b Second point
   * @returns Distance
   */
  protected calculateDistance(a: Landmark3D, b: Landmark3D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Check if landmark is visible and reliable
   * @param landmark Pose landmark
   * @param minVisibility Minimum visibility threshold
   * @returns Whether landmark is reliable
   */
  protected isLandmarkReliable(landmark: Landmark3D | undefined, minVisibility = 0.5): boolean {
    return landmark !== undefined && 
           landmark.visibility !== undefined && 
           landmark.visibility >= minVisibility;
  }

  /**
   * Add validation result to history for stability checking
   * @param isValid Whether current validation is valid
   * @returns Stable validation result
   */
  protected addToValidationHistory(isValid: boolean): boolean {
    this.validationHistory.push(isValid);
    
    // Keep only recent history
    if (this.validationHistory.length > this.historySize) {
      this.validationHistory.shift();
    }

    // Require majority of recent validations to be true for stability
    const validCount = this.validationHistory.filter(v => v).length;
    return validCount >= Math.ceil(this.historySize * 0.6);
  }

  /**
   * Check if enough time has passed since last validation
   * @param minInterval Minimum interval in milliseconds
   * @returns Whether enough time has passed
   */
  protected hasEnoughTimePassed(minInterval = 500): boolean {
    const now = Date.now();
    const timePassed = now - this.lastValidationTime;
    
    if (timePassed >= minInterval) {
      this.lastValidationTime = now;
      return true;
    }
    
    return false;
  }

  /**
   * Get landmark by index with safety check
   * @param poseResult Pose result
   * @param index Landmark index
   * @returns Landmark or undefined
   */
  protected getLandmark(poseResult: PoseResult, index: number): Landmark3D | undefined {
    if (!poseResult.landmarks || index < 0 || index >= poseResult.landmarks.length) {
      return undefined;
    }
    return poseResult.landmarks[index];
  }

  /**
   * Calculate form score based on multiple criteria
   * @param criteria Array of boolean criteria
   * @returns Form score between 0 and 1
   */
  protected calculateFormScore(criteria: boolean[]): number {
    if (criteria.length === 0) return 0;
    
    const validCriteria = criteria.filter(c => c).length;
    return validCriteria / criteria.length;
  }
}