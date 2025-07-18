/**
 * PoseDetector.ts
 * Main pose detection wrapper class
 */

import type { PoseResult } from '../types/index';
import { getPoseDetectionService } from './PoseDetectionService';
import { PoseOverlay } from '../components/pose/PoseOverlay';
import { getCameraService } from './CameraService';

export class PoseDetector {
  private poseService = getPoseDetectionService();
  private poseOverlay: PoseOverlay | null = null;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private onPoseResultCallback: ((result: PoseResult) => void) | null = null;

  /**
   * Initialize the pose detector
   * @param overlayContainerId Container ID for pose overlay
   * @param onPoseResult Callback for pose results
   */
  public async initialize(
    overlayContainerId: string,
    onPoseResult?: (result: PoseResult) => void
  ): Promise<boolean> {
    try {
      // Set callback
      if (onPoseResult) {
        this.onPoseResultCallback = onPoseResult;
      }

      // Initialize pose detection service
      const success = await this.poseService.initialize((result) => {
        this.handlePoseResult(result);
      });

      if (!success) {
        console.error('Failed to initialize pose detection service');
        return false;
      }

      // Create pose overlay
      this.poseOverlay = new PoseOverlay(overlayContainerId);

      console.log('Pose detector initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize pose detector:', error);
      return false;
    }
  }

  /**
   * Start pose detection
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.detectPose();
    console.log('Pose detection started');
  }

  /**
   * Stop pose detection
   */
  public stop(): void {
    this.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear overlay
    if (this.poseOverlay) {
      this.poseOverlay.clear();
    }

    console.log('Pose detection stopped');
  }

  /**
   * Main pose detection loop
   */
  private detectPose(): void {
    if (!this.isRunning) {
      return;
    }

    // Get video element from camera service
    const cameraService = getCameraService();
    const videoElement = cameraService.getVideoElement();

    if (videoElement && videoElement.readyState >= 2) {
      // Process frame for pose detection
      this.poseService.processFrame(videoElement).catch(error => {
        console.error('Error processing frame:', error);
      });
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => {
      this.detectPose();
    });
  }

  /**
   * Handle pose detection results
   * @param result Pose detection result
   */
  private handlePoseResult(result: PoseResult): void {
    // Draw pose overlay
    if (this.poseOverlay) {
      this.poseOverlay.drawPose(result);
      this.poseOverlay.drawConfidenceIndicator(result.confidence);
    }

    // Call external callback
    if (this.onPoseResultCallback) {
      this.onPoseResultCallback(result);
    }
  }

  /**
   * Toggle pose overlay visibility
   */
  public toggleOverlay(): void {
    if (this.poseOverlay) {
      this.poseOverlay.toggleVisibility();
    }
  }

  /**
   * Set pose overlay visibility
   * @param visible Whether to show the overlay
   */
  public setOverlayVisible(visible: boolean): void {
    if (this.poseOverlay) {
      this.poseOverlay.setVisible(visible);
    }
  }

  /**
   * Check if pose detection is running
   */
  public isActive(): boolean {
    return this.isRunning && this.poseService.isActive();
  }

  /**
   * Get the latest pose confidence threshold
   */
  public getConfidenceThreshold(): number {
    return 0.5; // Default threshold
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stop();
    
    if (this.poseOverlay) {
      this.poseOverlay.dispose();
      this.poseOverlay = null;
    }

    this.poseService.dispose();
    this.onPoseResultCallback = null;
  }
}

// Singleton instance
let poseDetectorInstance: PoseDetector | null = null;

/**
 * Get the pose detector instance
 */
export function getPoseDetector(): PoseDetector {
  if (!poseDetectorInstance) {
    poseDetectorInstance = new PoseDetector();
  }
  return poseDetectorInstance;
}