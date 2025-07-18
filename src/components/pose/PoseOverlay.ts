/**
 * PoseOverlay.ts
 * Component for displaying pose detection overlay on video
 */

import type { PoseResult } from '../../types/index';

export class PoseOverlay {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isVisible = true;
  private confidenceIndicator: HTMLElement | null = null;

  /**
   * Create a new PoseOverlay
   * @param containerId ID of the container element
   */
  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }
    
    this.container = container;
    
    // Create canvas for pose overlay
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pose-overlay-canvas';
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;
    
    // Add canvas to container
    this.container.appendChild(this.canvas);
    
    // Create confidence indicator
    this.createConfidenceIndicator();
    
    // Add window resize handler
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Create confidence indicator element
   */
  private createConfidenceIndicator(): void {
    this.confidenceIndicator = document.createElement('div');
    this.confidenceIndicator.className = 'pose-confidence-indicator';
    this.confidenceIndicator.style.position = 'absolute';
    this.confidenceIndicator.style.top = '10px';
    this.confidenceIndicator.style.right = '10px';
    this.confidenceIndicator.style.padding = '5px 10px';
    this.confidenceIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.confidenceIndicator.style.color = 'white';
    this.confidenceIndicator.style.borderRadius = '4px';
    this.confidenceIndicator.style.fontSize = '12px';
    this.confidenceIndicator.style.fontFamily = 'Arial, sans-serif';
    this.confidenceIndicator.style.pointerEvents = 'none';
    this.confidenceIndicator.textContent = 'Pose Confidence: 0%';
    
    this.container.appendChild(this.confidenceIndicator);
  }

  /**
   * Draw pose landmarks on canvas
   * @param poseResult Pose detection result
   */
  public drawPose(poseResult: PoseResult): void {
    if (!this.isVisible) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (!poseResult.landmarks) return;
    
    // Draw landmarks
    this.drawLandmarks(poseResult.landmarks);
    
    // Draw connections
    this.drawConnections(poseResult.landmarks);
  }

  /**
   * Draw pose landmarks
   * @param landmarks Pose landmarks
   */
  private drawLandmarks(landmarks: any[]): void {
    this.ctx.fillStyle = '#00FF00';
    
    landmarks.forEach((landmark, index) => {
      if (!landmark.visibility || landmark.visibility < 0.5) return;
      
      const x = landmark.x * this.canvas.width;
      const y = landmark.y * this.canvas.height;
      
      // Draw landmark point
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Draw landmark index (for debugging)
      if (index % 4 === 0) { // Only show some indices to avoid clutter
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(index.toString(), x + 5, y - 5);
        this.ctx.fillStyle = '#00FF00';
      }
    });
  }

  /**
   * Draw connections between landmarks
   * @param landmarks Pose landmarks
   */
  private drawConnections(landmarks: any[]): void {
    // Define connections between landmarks
    const connections = [
      [11, 12], // Shoulders
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 23], [12, 24], // Torso
      [23, 24], // Hips
      [23, 25], [25, 27], // Left leg
      [24, 26], [26, 28], // Right leg
    ];
    
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;
    
    connections.forEach(([startIdx, endIdx]) => {
      const startLandmark = landmarks[startIdx];
      const endLandmark = landmarks[endIdx];
      
      if (startLandmark && endLandmark &&
          startLandmark.visibility && startLandmark.visibility > 0.5 &&
          endLandmark.visibility && endLandmark.visibility > 0.5) {
        
        this.ctx.beginPath();
        this.ctx.moveTo(startLandmark.x * this.canvas.width, startLandmark.y * this.canvas.height);
        this.ctx.lineTo(endLandmark.x * this.canvas.width, endLandmark.y * this.canvas.height);
        this.ctx.stroke();
      }
    });
  }

  /**
   * Update confidence indicator
   * @param confidence Pose detection confidence
   */
  public drawConfidenceIndicator(confidence: number): void {
    if (!this.confidenceIndicator || !this.isVisible) return;
    
    const confidencePercent = Math.round(confidence * 100);
    this.confidenceIndicator.textContent = `Pose Confidence: ${confidencePercent}%`;
    
    // Color based on confidence level
    if (confidencePercent > 80) {
      this.confidenceIndicator.style.color = '#00FF00';
    } else if (confidencePercent > 50) {
      this.confidenceIndicator.style.color = '#FFFF00';
    } else {
      this.confidenceIndicator.style.color = '#FF0000';
    }
  }

  /**
   * Toggle overlay visibility
   */
  public toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    
    if (this.isVisible) {
      this.canvas.style.display = 'block';
      if (this.confidenceIndicator) {
        this.confidenceIndicator.style.display = 'block';
      }
    } else {
      this.canvas.style.display = 'none';
      if (this.confidenceIndicator) {
        this.confidenceIndicator.style.display = 'none';
      }
    }
  }

  /**
   * Set overlay visibility
   * @param visible Whether to show the overlay
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    
    if (this.isVisible) {
      this.canvas.style.display = 'block';
      if (this.confidenceIndicator) {
        this.confidenceIndicator.style.display = 'block';
      }
    } else {
      this.canvas.style.display = 'none';
      if (this.confidenceIndicator) {
        this.confidenceIndicator.style.display = 'none';
      }
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }

  /**
   * Clear the overlay
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('resize', () => this.handleResize());
    
    // Remove elements
    this.canvas.remove();
    if (this.confidenceIndicator) {
      this.confidenceIndicator.remove();
    }
  }
}