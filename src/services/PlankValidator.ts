/**
 * PlankValidator.ts
 * Validates plank exercise form and tracks duration
 */

import { ExerciseValidator } from './ExerciseValidator';
import { PoseResult, ExerciseValidation, Landmark3D } from '../types/index';
import { FormChecker } from '../utils/FormChecker';

// MediaPipe pose landmark indices
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28
};

export class PlankValidator extends ExerciseValidator {
  private plankStartTime = 0;
  private plankDuration = 0;
  private isInPlankPosition = false;
  private lastStableTime = 0;
  private recentPoses: PoseResult[] = [];
  private readonly maxRecentPoses = 10;
  private readonly stabilityThreshold = 0.7;
  private readonly bodyAlignmentThreshold = 0.1;
  private readonly minPlankDuration = 5000; // 5 seconds for a milestone
  
  // Milestone durations in milliseconds
  private readonly milestoneDurations = [
    5000,   // 5 seconds
    10000,  // 10 seconds
    20000,  // 20 seconds
    30000,  // 30 seconds
    60000   // 1 minute
  ];
  
  private nextMilestoneIndex = 0;

  /**
   * Validate plank form and track duration
   * @param poseResult Pose detection result
   * @returns Exercise validation result
   */
  public validate(poseResult: PoseResult): ExerciseValidation {
    const feedback: string[] = [];
    let isValid = false;
    let completedRep = false;

    // Add to recent poses for stability calculation
    this.addToRecentPoses(poseResult);

    // Check if we have sufficient confidence
    if (poseResult.confidence < 0.6) {
      feedback.push('Please position yourself clearly in the camera view');
      this.handleInvalidPose();
      return {
        isValid: false,
        feedback,
        completedRep: false,
        formScore: 0
      };
    }

    // Get required landmarks
    const leftShoulder = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_SHOULDER);
    const rightShoulder = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_SHOULDER);
    const leftElbow = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_ELBOW);
    const rightElbow = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_ELBOW);
    const leftWrist = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_WRIST);
    const rightWrist = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_WRIST);
    const leftHip = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_HIP);
    const rightHip = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_HIP);
    const leftKnee = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_KNEE);
    const rightKnee = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_KNEE);
    const leftAnkle = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_ANKLE);
    const rightAnkle = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_ANKLE);

    // Check if all required landmarks are visible
    const requiredLandmarks = [
      leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist,
      leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle
    ];
    
    if (!requiredLandmarks.every(landmark => this.isLandmarkReliable(landmark))) {
      feedback.push('Please ensure your full body is visible');
      this.handleInvalidPose();
      return {
        isValid: false,
        feedback,
        completedRep: false,
        formScore: 0
      };
    }

    // Check body alignment (straight line from shoulders to ankles)
    const bodyAlignmentScore = this.checkBodyAlignment(
      leftShoulder!, rightShoulder!, leftHip!, rightHip!, leftAnkle!, rightAnkle!
    );

    // Check elbow position (should be under shoulders)
    const elbowPositionScore = this.checkElbowPosition(
      leftShoulder!, leftElbow!, leftWrist!, rightShoulder!, rightElbow!, rightWrist!
    );

    // Check hip position (should not sag or pike)
    const hipPositionScore = this.checkHipPosition(
      leftShoulder!, rightShoulder!, leftHip!, rightHip!, leftAnkle!, rightAnkle!
    );

    // Check stability (minimal movement)
    const stabilityScore = FormChecker.calculatePoseStability(this.recentPoses);

    // Validate form criteria
    const formCriteria = [
      bodyAlignmentScore > 0.7,
      elbowPositionScore > 0.7,
      hipPositionScore > 0.7,
      stabilityScore > this.stabilityThreshold
    ];

    const formScore = this.calculateFormScore(formCriteria);
    isValid = formScore > 0.6;

    // Provide specific feedback
    if (bodyAlignmentScore <= 0.7) {
      feedback.push('Keep your body in a straight line from head to heels');
    }
    
    if (elbowPositionScore <= 0.7) {
      feedback.push('Position your elbows directly under your shoulders');
    }
    
    if (hipPositionScore <= 0.7) {
      feedback.push('Keep your hips level - don\'t sag or pike');
    }
    
    if (stabilityScore <= this.stabilityThreshold) {
      feedback.push('Try to hold still with minimal movement');
    }

    // Handle plank state
    if (isValid) {
      if (!this.isInPlankPosition) {
        // Starting a new plank
        this.isInPlankPosition = true;
        this.plankStartTime = Date.now();
        feedback.push('Good plank position! Hold steady...');
      } else {
        // Continue tracking plank duration
        const now = Date.now();
        this.plankDuration = now - this.plankStartTime;
        
        // Update last stable time
        this.lastStableTime = now;
        
        // Format duration for feedback
        const durationSeconds = Math.floor(this.plankDuration / 1000);
        feedback.push(`Great form! Duration: ${durationSeconds} seconds`);
        
        // Check for milestones
        if (this.nextMilestoneIndex < this.milestoneDurations.length && 
            this.plankDuration >= this.milestoneDurations[this.nextMilestoneIndex]) {
          completedRep = true;
          this.repCount++;
          feedback.push(`Milestone reached: ${this.milestoneDurations[this.nextMilestoneIndex] / 1000} seconds!`);
          this.nextMilestoneIndex++;
        }
      }
    } else {
      // Check if we've been in an invalid position for too long
      const now = Date.now();
      if (this.isInPlankPosition && (now - this.lastStableTime) > 1000) {
        this.handleInvalidPose();
        feedback.push('Plank position lost. Reset and try again.');
      }
    }

    return {
      isValid: this.addToValidationHistory(isValid),
      feedback,
      completedRep,
      formScore
    };
  }

  /**
   * Add pose result to recent poses for stability calculation
   * @param poseResult Pose detection result
   */
  private addToRecentPoses(poseResult: PoseResult): void {
    this.recentPoses.push(poseResult);
    
    // Keep only recent poses
    if (this.recentPoses.length > this.maxRecentPoses) {
      this.recentPoses.shift();
    }
  }

  /**
   * Handle invalid pose (reset plank tracking)
   */
  private handleInvalidPose(): void {
    if (this.isInPlankPosition) {
      // Only reset if we've been in an invalid position for a while
      const now = Date.now();
      if ((now - this.lastStableTime) > 1000) {
        this.isInPlankPosition = false;
        // Don't reset duration or milestone progress
      }
    }
  }

  /**
   * Check body alignment (straight line from shoulders to ankles)
   * @param leftShoulder Left shoulder landmark
   * @param rightShoulder Right shoulder landmark
   * @param leftHip Left hip landmark
   * @param rightHip Right hip landmark
   * @param leftAnkle Left ankle landmark
   * @param rightAnkle Right ankle landmark
   * @returns Alignment score (0-1)
   */
  private checkBodyAlignment(
    leftShoulder: Landmark3D,
    rightShoulder: Landmark3D,
    leftHip: Landmark3D,
    rightHip: Landmark3D,
    leftAnkle: Landmark3D,
    rightAnkle: Landmark3D
  ): number {
    // Calculate center points
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: (leftShoulder.z + rightShoulder.z) / 2
    };
    
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: (leftHip.z + rightHip.z) / 2
    };
    
    const ankleCenter = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2,
      z: (leftAnkle.z + rightAnkle.z) / 2
    };
    
    // Check if these points form a straight line
    const landmarks = [shoulderCenter, hipCenter, ankleCenter];
    const isAligned = FormChecker.areLandmarksAligned(landmarks, this.bodyAlignmentThreshold);
    
    // Calculate alignment score based on deviation
    if (isAligned) {
      return 1.0;
    } else {
      // Calculate deviation from straight line
      const distance = FormChecker.calculateBodyAngle(shoulderCenter, hipCenter, ankleCenter);
      const normalizedDistance = Math.min(distance / 30, 1); // Normalize to 0-1, max 30 degrees
      return Math.max(0, 1 - normalizedDistance);
    }
  }

  /**
   * Check elbow position (should be under shoulders)
   * @param leftShoulder Left shoulder landmark
   * @param leftElbow Left elbow landmark
   * @param leftWrist Left wrist landmark
   * @param rightShoulder Right shoulder landmark
   * @param rightElbow Right elbow landmark
   * @param rightWrist Right wrist landmark
   * @returns Position score (0-1)
   */
  private checkElbowPosition(
    leftShoulder: Landmark3D,
    leftElbow: Landmark3D,
    leftWrist: Landmark3D,
    rightShoulder: Landmark3D,
    rightElbow: Landmark3D,
    rightWrist: Landmark3D
  ): number {
    // Check horizontal alignment of elbows with shoulders
    const leftAlignmentX = Math.abs(leftElbow.x - leftShoulder.x);
    const rightAlignmentX = Math.abs(rightElbow.x - rightShoulder.x);
    
    // Normalize to 0-1 score (lower is better)
    const leftScore = Math.max(0, 1 - (leftAlignmentX / 0.1));
    const rightScore = Math.max(0, 1 - (rightAlignmentX / 0.1));
    
    // Average the scores
    return (leftScore + rightScore) / 2;
  }

  /**
   * Check hip position (should not sag or pike)
   * @param leftShoulder Left shoulder landmark
   * @param rightShoulder Right shoulder landmark
   * @param leftHip Left hip landmark
   * @param rightHip Right hip landmark
   * @param leftAnkle Left ankle landmark
   * @param rightAnkle Right ankle landmark
   * @returns Position score (0-1)
   */
  private checkHipPosition(
    leftShoulder: Landmark3D,
    rightShoulder: Landmark3D,
    leftHip: Landmark3D,
    rightHip: Landmark3D,
    leftAnkle: Landmark3D,
    rightAnkle: Landmark3D
  ): number {
    // Calculate center points
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: (leftShoulder.z + rightShoulder.z) / 2
    };
    
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: (leftHip.z + rightHip.z) / 2
    };
    
    const ankleCenter = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2,
      z: (leftAnkle.z + rightAnkle.z) / 2
    };
    
    // Calculate the angle at the hip
    const shoulderToHip = {
      x: shoulderCenter.x - hipCenter.x,
      y: shoulderCenter.y - hipCenter.y
    };
    
    const ankleToHip = {
      x: ankleCenter.x - hipCenter.x,
      y: ankleCenter.y - hipCenter.y
    };
    
    // Calculate dot product
    const dotProduct = shoulderToHip.x * ankleToHip.x + shoulderToHip.y * ankleToHip.y;
    
    // Calculate magnitudes
    const shoulderToHipMag = Math.sqrt(shoulderToHip.x ** 2 + shoulderToHip.y ** 2);
    const ankleToHipMag = Math.sqrt(ankleToHip.x ** 2 + ankleToHip.y ** 2);
    
    // Calculate angle in radians
    const cosAngle = dotProduct / (shoulderToHipMag * ankleToHipMag);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    // Convert to degrees
    const angleDeg = angleRad * (180 / Math.PI);
    
    // Ideal angle is 180 degrees (straight line)
    const deviation = Math.abs(180 - angleDeg);
    
    // Normalize to 0-1 score (lower deviation is better)
    return Math.max(0, 1 - (deviation / 30)); // Max 30 degrees deviation
  }

  /**
   * Reset validator state
   */
  public reset(): void {
    super.reset();
    this.plankStartTime = 0;
    this.plankDuration = 0;
    this.isInPlankPosition = false;
    this.lastStableTime = 0;
    this.recentPoses = [];
    this.nextMilestoneIndex = 0;
  }

  /**
   * Get current plank duration in milliseconds
   */
  public getPlankDuration(): number {
    if (!this.isInPlankPosition) {
      return this.plankDuration;
    }
    return Date.now() - this.plankStartTime;
  }

  /**
   * Get formatted plank duration string (MM:SS)
   */
  public getFormattedDuration(): string {
    const duration = this.getPlankDuration();
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get current plank state
   */
  public isInPlank(): boolean {
    return this.isInPlankPosition;
  }

  /**
   * Get next milestone duration in seconds
   */
  public getNextMilestoneDuration(): number {
    if (this.nextMilestoneIndex >= this.milestoneDurations.length) {
      return 0;
    }
    return this.milestoneDurations[this.nextMilestoneIndex] / 1000;
  }
}