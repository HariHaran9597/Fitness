/**
 * FeedbackRenderer.test.ts
 * Unit tests for the FeedbackRenderer
 */

import { FeedbackRenderer } from '../components/feedback/FeedbackRenderer';
import { PoseResult, ExerciseValidation } from '../types/index';

describe('FeedbackRenderer', () => {
  let renderer: FeedbackRenderer;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create mock canvas and context
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 640;
    mockCanvas.height = 480;
    
    mockCtx = {
      clearRect: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      setLineDash: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      textAlign: 'left',
      font: '',
      shadowBlur: 0,
      shadowColor: '',
      globalAlpha: 1
    } as unknown as CanvasRenderingContext2D;
    
    jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockCtx);
    
    renderer = new FeedbackRenderer(mockCanvas);
  });

  test('renderPoseFeedback should clear canvas', () => {
    const mockPoseResult: PoseResult = {
      landmarks: [],
      worldLandmarks: [],
      confidence: 0.8,
      timestamp: Date.now()
    };
    
    const mockValidation: ExerciseValidation = {
      isValid: true,
      feedback: [],
      completedRep: false,
      formScore: 0.8
    };
    
    renderer.renderPoseFeedback(mockPoseResult, mockValidation);
    
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, mockCanvas.width, mockCanvas.height);
  });

  test('renderPoseFeedback should draw feedback text', () => {
    const mockPoseResult: PoseResult = {
      landmarks: [],
      worldLandmarks: [],
      confidence: 0.8,
      timestamp: Date.now()
    };
    
    const mockValidation: ExerciseValidation = {
      isValid: true,
      feedback: ['Good form!', 'Keep going!'],
      completedRep: false,
      formScore: 0.8
    };
    
    renderer.renderPoseFeedback(mockPoseResult, mockValidation);
    
    expect(mockCtx.fillText).toHaveBeenCalledTimes(4); // 2 feedback messages x 2 (stroke + fill)
  });

  test('renderPoseFeedback should draw form score indicator', () => {
    const mockPoseResult: PoseResult = {
      landmarks: [],
      worldLandmarks: [],
      confidence: 0.8,
      timestamp: Date.now()
    };
    
    const mockValidation: ExerciseValidation = {
      isValid: true,
      feedback: [],
      completedRep: false,
      formScore: 0.8
    };
    
    renderer.renderPoseFeedback(mockPoseResult, mockValidation);
    
    expect(mockCtx.fillRect).toHaveBeenCalledTimes(2); // Background + score bar
    expect(mockCtx.strokeRect).toHaveBeenCalledTimes(1); // Border
  });

  test('addRepCompletionAnimation should add animation to queue', () => {
    renderer.addRepCompletionAnimation(5);
    
    // Access private property for testing
    const queue = (renderer as any).animationQueue;
    
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe('repCompletion');
    expect(queue[0].data.repCount).toBe(5);
  });

  test('clear should remove all animations', () => {
    renderer.addRepCompletionAnimation(5);
    renderer.addEncouragementEffect();
    
    renderer.clear();
    
    // Access private property for testing
    const queue = (renderer as any).animationQueue;
    
    expect(queue.length).toBe(0);
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, mockCanvas.width, mockCanvas.height);
  });
});