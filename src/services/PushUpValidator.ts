/**
 * PushUpValidator.ts
 * Validates push-up exercise form and counts repetitions
 */

import { ExerciseValidator } from './ExerciseValidator';
import { PoseResult, ExerciseValidation, Landmark3D } from '../types/index';

// MediaPipe pose landmark indices
const POSE_LANDMARKS = {
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

export class PushUpValidator extends ExerciseValidator {
  private isInDownPosition = false;
  private isInUpPosition = false;
  private minArmAngle = 70;  // Minimum arm angle for down position
  private maxArmAngle = 160; // Maximum arm angle for up position
  private bodyAlignmentThreshold = 0.1; // Threshold for body alignment

  /**
   * Validate push-up form and count repetitions
   * @param poseResult Pose detection result
   * @returns Exercise validation result
   */
  public validate(poseResult: PoseResult): ExerciseValidation {
    const feedback: string[] = [];
    let isValid = false;
    let completedRep = false;

    // Check if we have sufficient confidence
    if (poseResult.confidence < 0.6) {
      feedback.push('Please position yourself clearly in the camera view');
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

    // Check if all required landmarks are visible
    const requiredLandmarks = [leftShoulder, rightShoulder, leftElbow, rightElbow, 
                              leftWrist, rightWrist, leftHip, rightHip];
    
    if (!requiredLandmarks.every(landmark => this.isLandmarkReliable(landmark))) {
      feedback.push('Please ensure your upper body is fully visible');
      return {
        isValid: false,
        feedback,
        completedRep: false,
        formScore: 0
      };
    }

    // Calculate arm angles
    const leftArmAngle = this.calculateAngle(leftShoulder!, leftElbow!, leftWrist!);
    const rightArmAngle = this.calculateAngle(rightShoulder!, rightElbow!, rightWrist!);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

    // Check body alignment
    const bodyAlignmentScore = this.checkBodyAlignment(
      leftShoulder!, rightShoulder!, leftHip!, rightHip!
    );

    // Check arm position symmetry
    const armSymmetryScore = this.checkArmSymmetry(leftArmAngle, rightArmAngle);

    // Validate form criteria
    const formCriteria = [
      bodyAlignmentScore > 0.7,
      armSymmetryScore > 0.7,
      avgArmAngle > 30 && avgArmAngle < 180
    ];

    const formScore = this.calculateFormScore(formCriteria);
    isValid = formScore > 0.6;

    // Provide specific feedback
    if (bodyAlignmentScore <= 0.7) {
      feedback.push('Keep your body straight - align shoulders with hips');
    }
    
    if (armSymmetryScore <= 0.7) {
      feedback.push('Keep both arms moving symmetrically');
    }

    // Check for push-up phases
    const isCurrentlyDown = avgArmAngle < this.minArmAngle;
    const isCurrentlyUp = avgArmAngle > this.maxArmAngle;

    // State machine for repetition counting
    if (isCurrentlyDown && !this.isInDownPosition && isValid) {
      this.isInDownPosition = true;
      this.isInUpPosition = false;
      feedback.push('Good down position!');
    } else if (isCurrentlyUp && this.isInDownPosition && !this.isInUpPosition && isValid) {
      this.isInUpPosition = true;
      
      // Complete repetition when returning to up position
      if (this.hasEnoughTimePassed(1000)) { // Minimum 1 second between reps
        this.repCount++;
        completedRep = true;
        this.isInDownPosition = false;
        this.isInUpPosition = false;
        feedback.push(`Great push-up! Count: ${this.repCount}`);
      }
    }

    // Provide guidance based on current position
    if (isValid) {
      if (avgArmAngle > this.maxArmAngle) {
        feedback.push('Lower yourself down');
      } else if (avgArmAngle < this.minArmAngle) {
        feedback.push('Push back up');
      } else {
        feedback.push('Good form - keep going!');
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
   * Check body alignment (straight line from shoulders to hips)
   * @param leftShoulder Left shoulder landmark
   * @param rightShoulder Right shoulder landmark
   * @param leftHip Left hip landmark
   * @param rightHip Right hip landmark
   * @returns Alignment score (0-1)
   */
  private checkBodyAlignment(
    leftShoulder: Landmark3D,
    rightShoulder: Landmark3D,
    leftHip: Landmark3D,
    rightHip: Landmark3D
  ): number {
    // Calculate shoulder and hip center points
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

    // Calculate the vertical difference (should be minimal for good alignment)
    const verticalDifference = Math.abs(shoulderCenter.y - hipCenter.y);
    
    // Score based on how straight the body is
    const alignmentScore = Math.max(0, 1 - (verticalDifference / this.bodyAlignmentThreshold));
    
    return Math.min(1, alignmentScore);
  }

  /**
   * Check arm symmetry (both arms should move similarly)
   * @param leftArmAngle Left arm angle
   * @param rightArmAngle Right arm angle
   * @returns Symmetry score (0-1)
   */
  private checkArmSymmetry(leftArmAngle: number, rightArmAngle: number): number {
    const angleDifference = Math.abs(leftArmAngle - rightArmAngle);
    const maxAllowedDifference = 30; // degrees
    
    const symmetryScore = Math.max(0, 1 - (angleDifference / maxAllowedDifference));
    return Math.min(1, symmetryScore);
  }

  /**
   * Reset validator state
   */
  public reset(): void {
    super.reset();
    this.isInDownPosition = false;
    this.isInUpPosition = false;
  }

  /**
   * Get current push-up phase
   * @returns Current phase description
   */
  public getCurrentPhase(): string {
    if (this.isInDownPosition) {
      return 'Down Position';
    } else if (this.isInUpPosition) {
      return 'Up Position';
    } else {
      return 'Transitioning';
    }
  }
}