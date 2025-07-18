/**
 * ChinUpValidator.test.ts
 * Tests for the ChinUpValidator class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChinUpValidator } from '../services/ChinUpValidator';
import { PoseResult } from '../types/index';

describe('ChinUpValidator', () => {
  let validator: ChinUpValidator;
  
  beforeEach(() => {
    validator = new ChinUpValidator();
  });
  
  it('should initialize with zero repetitions', () => {
    expect(validator.getRepCount()).toBe(0);
  });
  
  it('should reject pose with low confidence', () => {
    const lowConfidencePose: PoseResult = {
      landmarks: [],
      worldLandmarks: [],
      confidence: 0.3,
      timestamp: Date.now()
    };
    
    const result = validator.validate(lowConfidencePose);
    
    expect(result.isValid).toBe(false);
    expect(result.completedRep).toBe(false);
    expect(result.feedback).toContain('Please position yourself clearly in the camera view');
  });
  
  it('should reject pose with missing landmarks', () => {
    const missingLandmarksPose: PoseResult = {
      landmarks: Array(33).fill(null),
      worldLandmarks: [],
      confidence: 0.8,
      timestamp: Date.now()
    };
    
    const result = validator.validate(missingLandmarksPose);
    
    expect(result.isValid).toBe(false);
    expect(result.completedRep).toBe(false);
    expect(result.feedback).toContain('Please ensure your upper body is fully visible');
  });
  
  it('should detect down position', () => {
    // Create mock pose with arms extended (down position)
    const downPositionPose = createMockPose({
      armAngle: 150, // Extended arms
      chinAboveBar: false,
      bodyAlignment: 0.9
    });
    
    const result = validator.validate(downPositionPose);
    
    // First validation should detect down position but not count a rep
    expect(result.completedRep).toBe(false);
    expect(validator.getRepCount()).toBe(0);
    expect(result.feedback.some(f => f.includes('starting position'))).toBe(true);
  });
  
  it('should detect up position after down position', () => {
    // First get into down position
    const downPositionPose = createMockPose({
      armAngle: 150, // Extended arms
      chinAboveBar: false,
      bodyAlignment: 0.9
    });
    
    validator.validate(downPositionPose);
    
    // Then move to up position
    const upPositionPose = createMockPose({
      armAngle: 60, // Bent arms
      chinAboveBar: true,
      bodyAlignment: 0.9
    });
    
    const result = validator.validate(upPositionPose);
    
    // Should detect up position but not count rep yet
    expect(result.completedRep).toBe(false);
    expect(validator.getRepCount()).toBe(0);
    expect(result.feedback.some(f => f.includes('Chin over the bar'))).toBe(true);
  });
  
  it('should count a repetition when completing full movement', () => {
    // Mock the time passage for repetition counting
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = () => mockTime;
    
    try {
      // First get into down position
      const downPositionPose = createMockPose({
        armAngle: 150, // Extended arms
        chinAboveBar: false,
        bodyAlignment: 0.9
      });
      
      validator.validate(downPositionPose);
      
      // Then move to up position
      const upPositionPose = createMockPose({
        armAngle: 60, // Bent arms
        chinAboveBar: true,
        bodyAlignment: 0.9
      });
      
      validator.validate(upPositionPose);
      
      // Advance time
      mockTime += 1500;
      
      // Then back to down position
      const result = validator.validate(downPositionPose);
      
      // Should count a repetition
      expect(result.completedRep).toBe(true);
      expect(validator.getRepCount()).toBe(1);
      expect(result.feedback.some(f => f.includes('Great chin-up! Count: 1'))).toBe(true);
    } finally {
      // Restore original Date.now
      Date.now = originalNow;
    }
  });
  
  it('should provide feedback on body position', () => {
    // Create mock pose with poor body alignment
    const poorAlignmentPose = createMockPose({
      armAngle: 90,
      chinAboveBar: false,
      bodyAlignment: 0.3 // Poor alignment
    });
    
    const result = validator.validate(poorAlignmentPose);
    
    expect(result.isValid).toBe(false);
    expect(result.feedback.some(f => f.includes('Keep your body straight'))).toBe(true);
  });
  
  it('should provide feedback on arm symmetry', () => {
    // Create mock pose with asymmetric arms
    const asymmetricPose = createMockPose({
      armAngle: 90,
      chinAboveBar: false,
      bodyAlignment: 0.9,
      armSymmetry: 0.3 // Asymmetric arms
    });
    
    const result = validator.validate(asymmetricPose);
    
    expect(result.feedback.some(f => f.includes('symmetrically'))).toBe(true);
  });
  
  it('should reset correctly', () => {
    // First get into a state with a counted rep
    const downPositionPose = createMockPose({
      armAngle: 150,
      chinAboveBar: false,
      bodyAlignment: 0.9
    });
    
    const upPositionPose = createMockPose({
      armAngle: 60,
      chinAboveBar: true,
      bodyAlignment: 0.9
    });
    
    // Mock time for rep counting
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = () => mockTime;
    
    try {
      validator.validate(downPositionPose);
      validator.validate(upPositionPose);
      mockTime += 1500;
      validator.validate(downPositionPose);
      
      expect(validator.getRepCount()).toBe(1);
      
      // Reset validator
      validator.reset();
      
      // Should be back to initial state
      expect(validator.getRepCount()).toBe(0);
      
      // Should be able to start a new rep
      validator.validate(downPositionPose);
      validator.validate(upPositionPose);
      mockTime += 1500;
      const result = validator.validate(downPositionPose);
      
      expect(result.completedRep).toBe(true);
      expect(validator.getRepCount()).toBe(1);
    } finally {
      // Restore original Date.now
      Date.now = originalNow;
    }
  });
});

/**
 * Create a mock pose result for testing
 */
function createMockPose(options: {
  armAngle: number,
  chinAboveBar: boolean,
  bodyAlignment: number,
  armSymmetry?: number
}): PoseResult {
  const { armAngle, chinAboveBar, bodyAlignment, armSymmetry = 0.9 } = options;
  
  // Calculate landmark positions based on parameters
  const shoulderY = 0.5;
  const shoulderWidth = 0.3;
  const armLength = 0.2;
  
  // Calculate elbow position based on arm angle
  const elbowOffsetX = armLength * Math.cos(armAngle * Math.PI / 180);
  const elbowOffsetY = armLength * Math.sin(armAngle * Math.PI / 180);
  
  // Calculate wrist position (extend from elbow)
  const wristOffsetX = armLength * Math.cos(armAngle * Math.PI / 180);
  const wristOffsetY = armLength * Math.sin(armAngle * Math.PI / 180);
  
  // Calculate hip position based on body alignment
  const hipOffsetX = (1 - bodyAlignment) * 0.2; // More offset = worse alignment
  
  // Calculate nose position based on chin above bar parameter
  const noseY = chinAboveBar ? 
    Math.min(shoulderY - 0.1, shoulderY + elbowOffsetY + wristOffsetY - 0.05) : // Above bar
    shoulderY - 0.1; // Normal position
  
  // Create asymmetry if specified
  const rightArmAngleAdjustment = armSymmetry < 0.8 ? 30 * (1 - armSymmetry) : 0;
  
  // Create landmarks array
  const landmarks = Array(33).fill(null).map((_, i) => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0.9
  }));
  
  // Set specific landmarks
  // Nose (0)
  landmarks[0] = { x: 0, y: noseY, z: 0, visibility: 0.9 };
  
  // Left shoulder (11)
  landmarks[11] = { x: -shoulderWidth/2, y: shoulderY, z: 0, visibility: 0.9 };
  
  // Right shoulder (12)
  landmarks[12] = { x: shoulderWidth/2, y: shoulderY, z: 0, visibility: 0.9 };
  
  // Left elbow (13)
  landmarks[13] = { 
    x: -shoulderWidth/2 + elbowOffsetX, 
    y: shoulderY + elbowOffsetY, 
    z: 0, 
    visibility: 0.9 
  };
  
  // Right elbow (14) - potentially asymmetric
  landmarks[14] = { 
    x: shoulderWidth/2 + elbowOffsetX * Math.cos(rightArmAngleAdjustment * Math.PI / 180), 
    y: shoulderY + elbowOffsetY * Math.cos(rightArmAngleAdjustment * Math.PI / 180), 
    z: 0, 
    visibility: 0.9 
  };
  
  // Left wrist (15)
  landmarks[15] = { 
    x: -shoulderWidth/2 + elbowOffsetX + wristOffsetX, 
    y: shoulderY + elbowOffsetY + wristOffsetY, 
    z: 0, 
    visibility: 0.9 
  };
  
  // Right wrist (16) - potentially asymmetric
  landmarks[16] = { 
    x: shoulderWidth/2 + elbowOffsetX * Math.cos(rightArmAngleAdjustment * Math.PI / 180) + wristOffsetX * Math.cos(rightArmAngleAdjustment * Math.PI / 180), 
    y: shoulderY + elbowOffsetY * Math.cos(rightArmAngleAdjustment * Math.PI / 180) + wristOffsetY * Math.cos(rightArmAngleAdjustment * Math.PI / 180), 
    z: 0, 
    visibility: 0.9 
  };
  
  // Left hip (23)
  landmarks[23] = { x: -shoulderWidth/2 + hipOffsetX, y: shoulderY + 0.4, z: 0, visibility: 0.9 };
  
  // Right hip (24)
  landmarks[24] = { x: shoulderWidth/2 + hipOffsetX, y: shoulderY + 0.4, z: 0, visibility: 0.9 };
  
  // Left knee (25)
  landmarks[25] = { x: -shoulderWidth/2 + hipOffsetX, y: shoulderY + 0.7, z: 0, visibility: 0.9 };
  
  // Right knee (26)
  landmarks[26] = { x: shoulderWidth/2 + hipOffsetX, y: shoulderY + 0.7, z: 0, visibility: 0.9 };
  
  return {
    landmarks,
    worldLandmarks: landmarks,
    confidence: 0.9,
    timestamp: Date.now()
  };
}