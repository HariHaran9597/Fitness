/**
 * PoseDetectionService.ts
 * Handles MediaPipe pose detection
 */

import { Pose } from '@mediapipe/pose';
import type { Results } from '@mediapipe/pose';
import type { PoseResult, Landmark3D } from '../types/index';
import { POSE_DETECTION_CONFIG } from '../utils/constants';

// Pose detection service class
export class PoseDetectionService {
  private pose: Pose | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: PoseResult) => void) | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    // Initialize canvas for pose overlay
    this.canvas = document.createElement('canvas');
    this.canvasCtx = this.canvas.getContext('2d');
  }

  /**
   * Initialize the pose detection service
   * @param onResults Callback function for pose detection results
   */
  public async initialize(onResults?: (results: PoseResult) => void): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Set callback
      if (onResults) {
        this.onResultsCallback = onResults;
      }

      // Initialize MediaPipe Pose
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      // Configure pose detection options
      this.pose.setOptions({
        modelComplexity: POSE_DETECTION_CONFIG.modelComplexity as 0 | 1 | 2,
        smoothLandmarks: POSE_DETECTION_CONFIG.smoothLandmarks,
        enableSegmentation: POSE_DETECTION_CONFIG.enableSegmentation,
        minDetectionConfidence: POSE_DETECTION_CONFIG.minDetectionConfidence,
        minTrackingConfidence: POSE_DETECTION_CONFIG.minTrackingConfidence
      });

      // Set up results callback
      this.pose.onResults((results: Results) => {
        this.handlePoseResults(results);
      });

      this.isInitialized = true;
      console.log('Pose detection service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      return false;
    }
  }

  /**
   * Process video frame for pose detection
   * @param videoElement The video element to process
   */
  public async processFrame(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.pose || !this.isInitialized) {
      console.warn('Pose detection not initialized');
      return;
    }

    try {
      await this.pose.send({ image: videoElement });
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }

  /**
   * Handle pose detection results
   * @param results MediaPipe pose results
   */
  private handlePoseResults(results: Results): void {
    if (!results.poseLandmarks) {
      return;
    }

    // Convert MediaPipe results to our format
    const poseResult: PoseResult = {
      landmarks: results.poseLandmarks.map(landmark => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility
      })),
      worldLandmarks: results.poseWorldLandmarks?.map(landmark => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility
      })) || [],
      confidence: this.calculateOverallConfidence(results.poseLandmarks),
      timestamp: Date.now()
    };

    // Call the callback if set
    if (this.onResultsCallback) {
      this.onResultsCallback(poseResult);
    }
  }

  /**
   * Calculate overall confidence from landmarks
   * @param landmarks Pose landmarks
   * @returns Overall confidence score
   */
  private calculateOverallConfidence(landmarks: any[]): number {
    if (!landmarks || landmarks.length === 0) {
      return 0;
    }

    const visibilityScores = landmarks
      .filter(landmark => landmark.visibility !== undefined)
      .map(landmark => landmark.visibility);

    if (visibilityScores.length === 0) {
      return 0.5; // Default confidence if no visibility data
    }

    return visibilityScores.reduce((sum, score) => sum + score, 0) / visibilityScores.length;
  }

  /**
   * Draw pose landmarks on canvas
   * @param canvas Canvas element to draw on
   * @param results Pose detection results
   */
  public drawPoseLandmarks(canvas: HTMLCanvasElement, results: PoseResult): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !results.landmarks) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set drawing style
    ctx.fillStyle = '#00FF00';
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    // Draw landmarks
    results.landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      // Draw landmark point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw landmark index (for debugging)
      if (landmark.visibility && landmark.visibility > 0.5) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.fillText(index.toString(), x + 5, y - 5);
        ctx.fillStyle = '#00FF00';
      }
    });

    // Draw pose connections (simplified)
    this.drawPoseConnections(ctx, results.landmarks, canvas.width, canvas.height);
  }

  /**
   * Draw connections between pose landmarks
   * @param ctx Canvas context
   * @param landmarks Pose landmarks
   * @param width Canvas width
   * @param height Canvas height
   */
  private drawPoseConnections(
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark3D[],
    width: number,
    height: number
  ): void {
    // Define key pose connections (simplified set)
    const connections = [
      [11, 12], // Shoulders
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 23], [12, 24], // Torso
      [23, 24], // Hips
      [23, 25], [25, 27], // Left leg
      [24, 26], [26, 28], // Right leg
    ];

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    connections.forEach(([startIdx, endIdx]) => {
      const startLandmark = landmarks[startIdx];
      const endLandmark = landmarks[endIdx];

      if (startLandmark && endLandmark &&
          startLandmark.visibility && startLandmark.visibility > 0.5 &&
          endLandmark.visibility && endLandmark.visibility > 0.5) {
        
        ctx.beginPath();
        ctx.moveTo(startLandmark.x * width, startLandmark.y * height);
        ctx.lineTo(endLandmark.x * width, endLandmark.y * height);
        ctx.stroke();
      }
    });
  }

  /**
   * Get specific landmark by index
   * @param results Pose results
   * @param index Landmark index
   * @returns Landmark or null
   */
  public getLandmark(results: PoseResult, index: number): Landmark3D | null {
    if (!results.landmarks || index < 0 || index >= results.landmarks.length) {
      return null;
    }
    return results.landmarks[index];
  }

  /**
   * Check if pose detection is active
   */
  public isActive(): boolean {
    return this.isInitialized && this.pose !== null;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
    this.onResultsCallback = null;
  }
}

// Singleton instance
let poseDetectionServiceInstance: PoseDetectionService | null = null;

/**
 * Get the pose detection service instance
 */
export function getPoseDetectionService(): PoseDetectionService {
  if (!poseDetectionServiceInstance) {
    poseDetectionServiceInstance = new PoseDetectionService();
  }
  return poseDetectionServiceInstance;
}

/**
 * Initialize the pose detection service
 * @param onResults Callback function for pose detection results
 */
export async function initializePoseDetection(onResults?: (results: PoseResult) => void): Promise<boolean> {
  const poseService = getPoseDetectionService();
  return poseService.initialize(onResults);
}