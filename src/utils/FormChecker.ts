/**
 * FormChecker.ts
 * Utility class for pose analysis and form checking
 */

import { Landmark3D, PoseResult } from '../types/index';

export class FormChecker {
  /**
   * Check if person is in plank position
   * @param poseResult Pose detection result
   * @returns Whether person is in plank position
   */
  public static isInPlankPosition(poseResult: PoseResult): boolean {
    const leftShoulder = poseResult.landmarks[11];
    const rightShoulder = poseResult.landmarks[12];
    const leftHip = poseResult.landmarks[23];
    const rightHip = poseResult.landmarks[24];
    const leftAnkle = poseResult.landmarks[27];
    const rightAnkle = poseResult.landmarks[28];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle || !rightAnkle) {
      return false;
    }

    // Check if body is roughly horizontal
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

    // Body should be relatively straight
    const bodyAlignment = Math.abs(shoulderY - hipY) < 0.1 && Math.abs(hipY - ankleY) < 0.1;

    return bodyAlignment;
  }

  /**
   * Check if arms are in push-up position
   * @param poseResult Pose detection result
   * @returns Whether arms are in push-up position
   */
  public static areArmsInPushUpPosition(poseResult: PoseResult): boolean {
    const leftShoulder = poseResult.landmarks[11];
    const leftElbow = poseResult.landmarks[13];
    const leftWrist = poseResult.landmarks[15];
    const rightShoulder = poseResult.landmarks[12];
    const rightElbow = poseResult.landmarks[14];
    const rightWrist = poseResult.landmarks[16];

    if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) {
      return false;
    }

    // Check if elbows are below shoulders (arms bent)
    const leftElbowBelowShoulder = leftElbow.y > leftShoulder.y;
    const rightElbowBelowShoulder = rightElbow.y > rightShoulder.y;

    // Check if wrists are roughly aligned with shoulders
    const leftWristAlignment = Math.abs(leftWrist.x - leftShoulder.x) < 0.2;
    const rightWristAlignment = Math.abs(rightWrist.x - rightShoulder.x) < 0.2;

    return leftElbowBelowShoulder && rightElbowBelowShoulder && 
           leftWristAlignment && rightWristAlignment;
  }

  /**
   * Calculate body angle relative to ground
   * @param shoulder Shoulder landmark
   * @param hip Hip landmark
   * @param ankle Ankle landmark
   * @returns Body angle in degrees
   */
  public static calculateBodyAngle(shoulder: Landmark3D, hip: Landmark3D, ankle: Landmark3D): number {
    // Vector from hip to shoulder
    const shoulderVector = { x: shoulder.x - hip.x, y: shoulder.y - hip.y };
    // Vector from hip to ankle
    const ankleVector = { x: ankle.x - hip.x, y: ankle.y - hip.y };

    // Calculate angle between vectors
    const dotProduct = shoulderVector.x * ankleVector.x + shoulderVector.y * ankleVector.y;
    const shoulderMagnitude = Math.sqrt(shoulderVector.x ** 2 + shoulderVector.y ** 2);
    const ankleMagnitude = Math.sqrt(ankleVector.x ** 2 + ankleVector.y ** 2);

    const cosAngle = dotProduct / (shoulderMagnitude * ankleMagnitude);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    return angleRad * (180 / Math.PI);
  }

  /**
   * Check if landmarks form a straight line (for body alignment)
   * @param landmarks Array of landmarks that should be aligned
   * @param threshold Maximum deviation allowed
   * @returns Whether landmarks are aligned
   */
  public static areLandmarksAligned(landmarks: Landmark3D[], threshold = 0.05): boolean {
    if (landmarks.length < 2) return true;

    // Calculate the line from first to last landmark
    const first = landmarks[0];
    const last = landmarks[landmarks.length - 1];
    
    // Check if intermediate landmarks are close to this line
    for (let i = 1; i < landmarks.length - 1; i++) {
      const current = landmarks[i];
      
      // Calculate distance from point to line
      const distance = this.pointToLineDistance(current, first, last);
      
      if (distance > threshold) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate distance from a point to a line
   * @param point Point landmark
   * @param lineStart Start of line
   * @param lineEnd End of line
   * @returns Distance from point to line
   */
  private static pointToLineDistance(point: Landmark3D, lineStart: Landmark3D, lineEnd: Landmark3D): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    const param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if person is facing the camera
   * @param poseResult Pose detection result
   * @returns Whether person is facing camera
   */
  public static isFacingCamera(poseResult: PoseResult): boolean {
    const leftShoulder = poseResult.landmarks[11];
    const rightShoulder = poseResult.landmarks[12];
    const nose = poseResult.landmarks[0];

    if (!leftShoulder || !rightShoulder || !nose) {
      return false;
    }

    // Check if nose is roughly between shoulders
    const shoulderMidpoint = (leftShoulder.x + rightShoulder.x) / 2;
    const noseAlignment = Math.abs(nose.x - shoulderMidpoint) < 0.1;

    // Check shoulder width (should be visible if facing camera)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const hasGoodShoulderWidth = shoulderWidth > 0.1;

    return noseAlignment && hasGoodShoulderWidth;
  }

  /**
   * Calculate overall pose stability
   * @param poseResults Array of recent pose results
   * @returns Stability score (0-1)
   */
  public static calculatePoseStability(poseResults: PoseResult[]): number {
    if (poseResults.length < 2) return 0;

    let totalMovement = 0;
    let comparisonCount = 0;

    // Compare consecutive poses
    for (let i = 1; i < poseResults.length; i++) {
      const prev = poseResults[i - 1];
      const curr = poseResults[i];

      if (!prev.landmarks || !curr.landmarks) continue;

      // Calculate movement for key landmarks
      const keyLandmarks = [11, 12, 13, 14, 15, 16, 23, 24]; // shoulders, elbows, wrists, hips
      
      for (const landmarkIndex of keyLandmarks) {
        const prevLandmark = prev.landmarks[landmarkIndex];
        const currLandmark = curr.landmarks[landmarkIndex];

        if (prevLandmark && currLandmark) {
          const movement = Math.sqrt(
            Math.pow(currLandmark.x - prevLandmark.x, 2) +
            Math.pow(currLandmark.y - prevLandmark.y, 2)
          );
          
          totalMovement += movement;
          comparisonCount++;
        }
      }
    }

    if (comparisonCount === 0) return 0;

    const averageMovement = totalMovement / comparisonCount;
    
    // Convert to stability score (less movement = more stability)
    const stabilityScore = Math.max(0, 1 - (averageMovement * 10));
    
    return Math.min(1, stabilityScore);
  }
}