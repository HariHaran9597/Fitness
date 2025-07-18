/**
 * PoseDetectionService.test.ts
 * Tests for the pose detection service
 */

import { getPoseDetectionService, initializePoseDetection } from '../services/PoseDetectionService';

describe('PoseDetectionService', () => {
  // Mock MediaPipe Pose
  const mockPose = {
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn(),
    close: jest.fn()
  };

  // Mock MediaPipe global
  global.Pose = jest.fn().mockImplementation(() => mockPose);

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('getPoseDetectionService returns singleton instance', () => {
    const service1 = getPoseDetectionService();
    const service2 = getPoseDetectionService();
    
    expect(service1).toBe(service2);
  });

  test('initialize sets up MediaPipe Pose with correct options', async () => {
    const service = getPoseDetectionService();
    const callback = jest.fn();
    
    await service.initialize(callback);
    
    expect(mockPose.setOptions).toHaveBeenCalledWith({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    expect(mockPose.onResults).toHaveBeenCalled();
  });

  test('processFrame sends video frame to MediaPipe', async () => {
    const service = getPoseDetectionService();
    await service.initialize();
    
    const mockVideoElement = {} as HTMLVideoElement;
    await service.processFrame(mockVideoElement);
    
    expect(mockPose.send).toHaveBeenCalledWith({ image: mockVideoElement });
  });

  test('handlePoseResults converts MediaPipe results to PoseResult format', async () => {
    const service = getPoseDetectionService();
    const callback = jest.fn();
    
    await service.initialize(callback);
    
    // Get the onResults callback
    const onResultsCallback = mockPose.onResults.mock.calls[0][0];
    
    // Create mock results
    const mockResults = {
      poseLandmarks: [
        { x: 0.1, y: 0.2, z: 0.3, visibility: 0.9 },
        { x: 0.4, y: 0.5, z: 0.6, visibility: 0.8 }
      ],
      poseWorldLandmarks: [
        { x: 1.1, y: 1.2, z: 1.3, visibility: 0.9 },
        { x: 1.4, y: 1.5, z: 1.6, visibility: 0.8 }
      ]
    };
    
    // Call the onResults callback
    onResultsCallback(mockResults);
    
    // Check that our callback was called with converted results
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      landmarks: [
        { x: 0.1, y: 0.2, z: 0.3, visibility: 0.9 },
        { x: 0.4, y: 0.5, z: 0.6, visibility: 0.8 }
      ],
      worldLandmarks: [
        { x: 1.1, y: 1.2, z: 1.3, visibility: 0.9 },
        { x: 1.4, y: 1.5, z: 1.6, visibility: 0.8 }
      ],
      confidence: expect.any(Number),
      timestamp: expect.any(Number)
    }));
  });

  test('calculateOverallConfidence returns average visibility', () => {
    const service = getPoseDetectionService();
    
    const landmarks = [
      { x: 0.1, y: 0.2, z: 0.3, visibility: 0.9 },
      { x: 0.4, y: 0.5, z: 0.6, visibility: 0.7 }
    ];
    
    // Use private method via any type
    const confidence = (service as any).calculateOverallConfidence(landmarks);
    
    expect(confidence).toBe(0.8); // (0.9 + 0.7) / 2
  });

  test('dispose cleans up resources', async () => {
    const service = getPoseDetectionService();
    await service.initialize();
    
    service.dispose();
    
    expect(mockPose.close).toHaveBeenCalled();
  });

  test('initializePoseDetection initializes service with callback', async () => {
    const callback = jest.fn();
    
    await initializePoseDetection(callback);
    
    expect(mockPose.setOptions).toHaveBeenCalled();
    expect(mockPose.onResults).toHaveBeenCalled();
  });
});