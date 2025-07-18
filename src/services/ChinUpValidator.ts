/**
 * ChinUpValidator.ts
 * Validates chin-up exercise form and counts repetitions
 */

import { ExerciseValidator } from './ExerciseValidator';
import { PoseResult, ExerciseValidation, Landmark3D } from '../types/index';

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
  RIGHT_KNEE: 26
};

export class ChinUpValidator extends ExerciseValidator {
  private isInDownPosition = false;
  private isInUpPosition = false;
  private minArmAngle = 130;  // Minimum arm angle for down position (arms extended)
  private maxArmAngle = 70;   // Maximum arm angle for up position (arms bent)
  private chinOverBarThreshold = 0.05; // Threshold for chin over bar position

  /**
   * Validate chin-up form and count repetitions
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
    const nose = this.getLandmark(poseResult, POSE_LANDMARKS.NOSE);
    const leftShoulder = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_SHOULDER);
    const rightShoulder = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_SHOULDER);
    const leftElbow = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_ELBOW);
    const rightElbow = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_ELBOW);
    const leftWrist = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_WRIST);
    const rightWrist = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_WRIST);
    const leftHip = this.getLandmark(poseResult, POSE_LANDMARKS.LEFT_HIP);
    const rightHip = this.getLandmark(poseResult, POSE_LANDMARKS.RIGHT_HIP);

    // Check if all required landmarks are visible
    const requiredLandmarks = [
      nose, leftShoulder, rightShoulder, leftElbow, rightElbow, 
      leftWrist, rightWrist, leftHip, rightHip
    ];
    
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

    // Check body position
    const bodyPositionScore = this.checkBodyPosition(
      leftShoulder!, rightShoulder!, leftHip!, rightHip!
    );

    // Check arm position symmetry
    const armSymmetryScore = this.checkArmSymmetry(leftArmAngle, rightArmAngle);

    // Check chin position relative to hands/bar
    const chinOverBarScore = this.checkChinOverBar(
      nose!, leftWrist!, rightWrist!
    );

    // Validate form criteria
    const formCriteria = [
      bodyPositionScore > 0.7,
      armSymmetryScore > 0.7,
      avgArmAngle > 30 && avgArmAngle < 180
    ];

    const formScore = this.calculateFormScore(formCriteria);
    isValid = formScore > 0.6;

    // Provide specific feedback
    if (bodyPositionScore <= 0.7) {
      feedback.push('Keep your body straight - avoid swinging');
    }
    
    if (armSymmetryScore <= 0.7) {
      feedback.push('Keep both arms moving symmetrically');
    }

    // Check for chin-up phases
    const isCurrentlyDown = avgArmAngle > this.minArmAngle;
    const isCurrentlyUp = avgArmAngle < this.maxArmAngle && chinOverBarScore > 0.7;

    // State machine for repetition counting
    if (isCurrentlyDown && !this.isInDownPosition && !this.isInUpPosition) {
      this.isInDownPosition = true;
      feedback.push('Good starting position!');
    } else if (isCurrentlyUp && this.isInDownPosition && !this.isInUpPosition && isValid) {
      this.isInUpPosition = true;
      feedback.push('Great! Chin over the bar!');
    } else if (isCurrentlyDown && this.isInDownPosition && this.isInUpPosition && isValid) {
      // Complete repetition when returning to down position
      if (this.hasEnoughTimePassed(1000)) { // Minimum 1 second between reps
        this.repCount++;
        completedRep = true;
        this.isInDownPosition = true;
        this.isInUpPosition = false;
        feedback.push(`Great chin-up! Count: ${this.repCount}`);
      }
    }

    // Provide guidance based on current position
    if (isValid) {
      if (avgArmAngle > this.minArmAngle) {
        feedback.push('Pull yourself up');
      } else if (avgArmAngle < this.maxArmAngle) {
        feedback.push('Lower yourself down');
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
   * Check body position (vertical alignment, minimal swinging)
   * @param leftShoulder Left shoulder landmark
   * @param rightShoulder Right shoulder landmark
   * @param leftHip Left hip landmark
   * @param rightHip Right hip landmark
   * @returns Position score (0-1)
   */
  private checkBodyPosition(
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

    // Calculate horizontal difference (should be minimal for good vertical alignment)
    const horizontalDifference = Math.abs(shoulderCenter.x - hipCenter.x);
    
    // Score based on how vertical the body is
    const alignmentScore = Math.max(0, 1 - (horizontalDifference / 0.1));
    
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
   * Check if chin is over the bar (hands)
   * @param nose Nose landmark
   * @param leftWrist Left wrist landmark
   * @param rightWrist Right wrist landmark
   * @returns Chin over bar score (0-1)
   */
  private checkChinOverBar(
    nose: Landmark3D,
    leftWrist: Landmark3D,
    rightWrist: Landmark3D
  ): number {
    // Calculate wrist center point (approximation of bar position)
    const wristCenter = {
      y: (leftWrist.y + rightWrist.y) / 2
    };

    // Check if nose is above wrists
    const noseAboveWrists = nose.y < wristCenter.y;
    
    if (!noseAboveWrists) {
      return 0;
    }

    // Calculate how far above the bar the chin is
    const distanceAboveBar = wristCenter.y - nose.y;
    
    // Score based on how far above the bar the chin is
    const chinOverBarScore = Math.min(1, distanceAboveBar / this.chinOverBarThreshold);
    
    return chinOverBarScore;
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
   * Get current chin-up phase
   * @returns Current phase description
   */
  public getCurrentPhase(): string {
    if (this.isInUpPosition) {
      return 'Up Position';
    } else if (this.isInDownPosition) {
      return 'Down Position';
    } else {
      return 'Transitioning';
    }
  }
}