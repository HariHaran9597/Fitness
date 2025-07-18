/**
 * PlankValidator.test.ts
 * Tests for the PlankValidator class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlankValidator } from '../services/PlankValidator';
import { PoseResult } from '../types/index';

describe('PlankValidator', () => {
  let validator: PlankValidator;
  
  beforeEach(() => {
    validator = new PlankValidator();
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
    expect(result.feedback).toContain('Please ensure your full body is visible');
  });
  
  it('should detect valid plank position', () => {
    // Create mock pose with good plank form
    const goodPlankPose = createMockPlankPose({
      bodyAlignment: 0.9,
      elbowPosition: 0.9,
      hipPosition: 0.9,
      stability: 0.9
    });
    
    const result = validator.validate(goodPlankPose);
    
    expect(result.isValid).toBe(true);
    expect(result.feedback.some(f => f.includes('Good plank position'))).toBe(true);
  });
  
  it('should track plank duration', () => {
    // Mock the time passage
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = vi.fn(() => mockTime);
    
    try {
      // Create mock pose with good plank form
      const goodPlankPose = createMockPlankPose({
        bodyAlignment: 0.9,
        elbowPosition: 0.9,
        hipPosition: 0.9,
        stability: 0.9
      });
      
      // Start plank
      validator.validate(goodPlankPose);
      
      // Advance time
      mockTime += 3000; // 3 seconds
      
      // Continue plank
      const result = validator.validate(goodPlankPose);
      
      expect(result.isValid).toBe(true);
      expect(validator.getPlankDuration()).toBe(3000);
      expect(result.feedback.some(f => f.includes('Duration: 3 seconds'))).toBe(true);
    } finally {
      // Restore original Date.now
      Date.now = originalNow;
    }
  });
  
  it('should count milestone repetitions', () => {
    // Mock the time passage
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = vi.fn(() => mockTime);
    
    try {
      // Create mock pose with good plank form
      const goodPlankPose = createMockPlankPose({
        bodyAlignment: 0.9,
        elbowPosition: 0.9,
        hipPosition: 0.9,
        stability: 0.9
      });
      
      // Start plank
      validator.validate(goodPlankPose);
      
      // Advance time to first milestone (5 seconds)
      mockTime += 5000;
      
      // Continue plank
      const result = validator.validate(goodPlankPose);
      
      expect(result.completedRep).toBe(true);
      expect(validator.getRepCount()).toBe(1);
      expect(result.feedback.some(f => f.includes('Milestone reached: 5 seconds'))).toBe(true);
      
      // Advance time to second milestone (10 seconds)
      mockTime += 5000;
      
      // Continue plank
      const result2 = validator.validate(goodPlankPose);
      
      expect(result2.completedRep).toBe(true);
      expect(validator.getRepCount()).toBe(2);
      expect(result2.feedback.some(f => f.includes('Milestone reached: 10 seconds'))).toBe(true);
    } finally {
      // Restore original Date.now
      Date.now = originalNow;
    }
  });
  
  it('should provide feedback on poor body alignment', () => {
    // Create mock pose with poor body alignment
    const poorAlignmentPose = createMockPlankPose({
      bodyAlignment: 0.3, // Poor alignment
      elbowPosition: 0.9,
      hipPosition: 0.9,
      stability: 0.9
    });
    
    const result = validator.validate(poorAlignmentPose);
    
    expect(result.isValid).toBe(false);
    expect(result.feedback.some(f => f.includes('straight line'))).toBe(true);
  });
  
  it('should provide feedback on poor elbow position', () => {
    // Create mock pose with poor elbow position
    const poorElbowPose = createMockPlankPose({
      bodyAlignment: 0.9,
      elbowPosition: 0.3, // Poor elbow position
      hipPosition: 0.9,
      stability: 0.9
    });
    
    const result = validator.validate(poorElbowPose);
    
    expect(result.isValid).toBe(false);
    expect(result.feedback.some(f => f.includes('elbows'))).toBe(true);
  });
  
  it('should provide feedback on poor hip position', () => {
    // Create mock pose with poor hip position
    const poorHipPose = createMockPlankPose({
      bodyAlignment: 0.9,
      elbowPosition: 0.9,
      hipPosition: 0.3, // Poor hip position
      stability: 0.9
    });
    
    const result = validator.validate(poorHipPose);
    
    expect(result.isValid).toBe(false);
    expect(result.feedback.some(f => f.includes('hips'))).toBe(true);
  });
  
  it('should provide feedback on poor stability', () => {
    // Create mock pose with poor stability
    const poorStabilityPose = createMockPlankPose({
      bodyAlignment: 0.9,
      elbowPosition: 0.9,
      hipPosition: 0.9,
      stability: 0.3 // Poor stability
    });
    
    const result = validator.validate(poorStabilityPose);
    
    expect(result.isValid).toBe(false);
    expect(result.feedback.some(f => f.includes('hold still'))).toBe(true);
  });
  
  it('should reset correctly', () => {
    // Mock the time passage
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = vi.fn(() => mockTime);
    
    try {
      // Create mock pose with good plank form
      const goodPlankPose = createMockPlankPose({
        bodyAlignment: 0.9,
        elbowPosition: 0.9,
        hipPosition: 0.9,
        stability: 0.9
      });
      
      // Start plank and reach milestone
      validator.validate(goodPlankPose);
      mockTime += 5000;
      validator.validate(goodPlankPose);
      
      expect(validator.getRepCount()).toBe(1);
      expect(validator.getPlankDuration()).toBe(5000);
      
      // Reset validator
      validator.reset();
      
      // Should be back to initial state
      expect(validator.getRepCount()).toBe(0);
      expect(validator.getPlankDuration()).toBe(0);
      expect(validator.isInPlank()).toBe(false);
      
      // Should be able to start a new plank
      validator.validate(goodPlankPose);
      mockTime += 5000;
      const result = validator.validate(goodPlankPose);
      
      expect(result.completedRep).toBe(true);
      expect(validator.getRepCount()).toBe(1);
    } finally {
      // Restore original Date.now
      Date.now = originalNow;
    }
  });
  
  it('should format duration correctly', () => {
    // Mock the time passage
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = vi.fn(() => mockTime);
    
    try {
      // Create mock pose with good plank form
      const goodPlankPose = createMockPlankPose({
        bodyAlignment: 0.9,
        elbowPosition: 0.9,
        hipPosition: 0.9,
        stability: 0.9
      });
      
      // Start plank
      validator.validate(goodPlankPose);
      
      // Check initial format
      expect(validator.getFormattedDuration()).toBe('00:00');
      
      // Advance time
      mockTime += 65000; // 1 minute 5 seconds
      
      // Continue plank
      validator.validate(goodPlankPose);
      
      // Check formatted duration
      expect(validator.getFormattedDuration()).toBe('01:05');
    } finally {
      // Restore original Date.now
      Date.now = originalNow;
    }
  });
});

/**
 * Create a mock pose result for plank testing
 */
function createMockPlankPose(options: {
  bodyAlignment: number,
  elbowPosition: number,
  hipPosition: number,
  stability: number
}): PoseResult {
  const { bodyAlignment, elbowPosition, hipPosition, stability } = options;
  
  // Calculate landmark positions based on parameters
  const shoulderY = 0.5;
  const shoulderWidth = 0.3;
  
  // Calculate hip position based on body alignment
  const hipY = shoulderY + 0.3;
  const hipDeviation = (1 - bodyAlignment) * 0.2; // More deviation = worse alignment
  
  // Calculate elbow position based on elbow position score
  const elbowDeviation = (1 - elbowPosition) * 0.2; // More deviation = worse position
  
  // Calculate hip position based on hip position score
  const hipAngleDeviation = (1 - hipPosition) * 30; // More deviation = worse position
  
  // Create landmarks array
  const landmarks = Array(33).fill(null).map((_, i) => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0.9
  }));
  
  // Set specific landmarks
  // Left shoulder (11)
  landmarks[11] = { x: -shoulderWidth/2, y: shoulderY, z: 0, visibility: 0.9 };
  
  // Right shoulder (12)
  landmarks[12] = { x: shoulderWidth/2, y: shoulderY, z: 0, visibility: 0.9 };
  
  // Left elbow (13)
  landmarks[13] = { 
    x: -shoulderWidth/2 - elbowDeviation, 
    y: shoulderY, 
    z: 0, 
    visibility: 0.9 
  };
  
  // Right elbow (14)
  landmarks[14] = { 
    x: shoulderWidth/2 + elbowDeviation, 
    y: shoulderY, 
    z: 0, 
    visibility: 0.9 
  };
  
  // Left wrist (15)
  landmarks[15] = { 
    x: -shoulderWidth/2 - elbowDeviation, 
    y: shoulderY, 
    z: 0, 
    visibility: 0.9 
  };
  
  // Right wrist (16)
  landmarks[16] = { 
    x: shoulderWidth/2 + elbowDeviation, 
    y: shoulderY, 
    z: 0, 
    visibility: 0.9 
  };
  
  // Left hip (23)
  landmarks[23] = { x: -shoulderWidth/2, y: hipY + hipDeviation, z: 0, visibility: 0.9 };
  
  // Right hip (24)
  landmarks[24] = { x: shoulderWidth/2, y: hipY + hipDeviation, z: 0, visibility: 0.9 };
  
  // Left knee (25)
  landmarks[25] = { x: -shoulderWidth/2, y: hipY + 0.3, z: 0, visibility: 0.9 };
  
  // Right knee (26)
  landmarks[26] = { x: shoulderWidth/2, y: hipY + 0.3, z: 0, visibility: 0.9 };
  
  // Left ankle (27)
  landmarks[27] = { x: -shoulderWidth/2, y: hipY + 0.6 + hipAngleDeviation/100, z: 0, visibility: 0.9 };
  
  // Right ankle (28)
  landmarks[28] = { x: shoulderWidth/2, y: hipY + 0.6 + hipAngleDeviation/100, z: 0, visibility: 0.9 };
  
  return {
    landmarks,
    worldLandmarks: landmarks,
    confidence: 0.9,
    timestamp: Date.now()
  };
}