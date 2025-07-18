/**
 * PushUpValidator.test.ts
 * Unit tests for the PushUpValidator
 */

import { PushUpValidator } from '../services/PushUpValidator';
import { PoseResult, Landmark3D } from '../types/index';

describe('PushUpValidator', () => {
  let validator: PushUpValidator;

  beforeEach(() => {
    validator = new PushUpValidator();
  });

  const createMockPoseResult = (armAngle: number, confidence = 0.8): PoseResult => {
    // Create mock landmarks for push-up position
    const landmarks: Landmark3D[] = new Array(33).fill(null).map((_, i) => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9
    }));

    // Set specific landmarks for push-up validation
    landmarks[11] = { x: 0.3, y: 0.4, z: 0, visibility: 0.9 }; // Left shoulder
    landmarks[12] = { x: 0.7, y: 0.4, z: 0, visibility: 0.9 }; // Right shoulder
    landmarks[13] = { x: 0.25, y: 0.5, z: 0, visibility: 0.9 }; // Left elbow
    landmarks[14] = { x: 0.75, y: 0.5, z: 0, visibility: 0.9 }; // Right elbow
    landmarks[15] = { x: 0.2, y: 0.6, z: 0, visibility: 0.9 }; // Left wrist
    landmarks[16] = { x: 0.8, y: 0.6, z: 0, visibility: 0.9 }; // Right wrist
    landmarks[23] = { x: 0.3, y: 0.6, z: 0, visibility: 0.9 }; // Left hip
    landmarks[24] = { x: 0.7, y: 0.6, z: 0, visibility: 0.9 }; // Right hip

    return {
      landmarks,
      worldLandmarks: [],
      confidence,
      timestamp: Date.now()
    };
  };

  test('should validate good push-up form', () => {
    const poseResult = createMockPoseResult(90);
    const validation = validator.validate(poseResult);

    expect(validation.isValid).toBe(true);
    expect(validation.formScore).toBeGreaterThan(0.6);
  });

  test('should reject low confidence poses', () => {
    const poseResult = createMockPoseResult(90, 0.3);
    const validation = validator.validate(poseResult);

    expect(validation.isValid).toBe(false);
    expect(validation.feedback).toContain('Please position yourself clearly in the camera view');
  });

  test('should count repetitions correctly', () => {
    // Simulate down position
    const downPose = createMockPoseResult(60);
    validator.validate(downPose);

    // Simulate up position
    const upPose = createMockPoseResult(170);
    const validation = validator.validate(upPose);

    expect(validator.getRepCount()).toBe(1);
    expect(validation.completedRep).toBe(true);
  });

  test('should reset validator state', () => {
    const poseResult = createMockPoseResult(90);
    validator.validate(poseResult);
    
    validator.reset();
    
    expect(validator.getRepCount()).toBe(0);
    expect(validator.getCurrentPhase()).toBe('Transitioning');
  });
});