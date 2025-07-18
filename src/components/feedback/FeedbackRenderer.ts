/**
 * FeedbackRenderer.ts
 * Renders visual feedback for exercise form
 */

import { PoseResult, ExerciseValidation, Landmark3D } from '../../types/index';

export class FeedbackRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationQueue: Array<{ type: string; timestamp: number; data: any }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;
  }

  /**
   * Render pose feedback with color-coded indicators
   */
  public renderPoseFeedback(poseResult: PoseResult, validation: ExerciseValidation): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!poseResult.landmarks) return;

    // Draw landmarks with color coding
    this.drawColorCodedLandmarks(poseResult, validation);
    
    // Draw feedback text
    this.drawFeedbackText(validation);
    
    // Draw form score indicator
    this.drawFormScoreIndicator(validation.formScore);
    
    // Process animation queue
    this.processAnimations();
  }

  /**
   * Draw landmarks with color coding based on form quality
   */
  private drawColorCodedLandmarks(poseResult: PoseResult, validation: ExerciseValidation): void {
    const landmarks = poseResult.landmarks;
    if (!landmarks) return;

    // Key landmarks for push-ups
    const keyLandmarks = [11, 12, 13, 14, 15, 16, 23, 24]; // shoulders, elbows, wrists, hips
    
    keyLandmarks.forEach(index => {
      const landmark = landmarks[index];
      if (!landmark || !landmark.visibility || landmark.visibility < 0.5) return;

      const x = landmark.x * this.canvas.width;
      const y = landmark.y * this.canvas.height;
      
      // Color based on form quality
      const color = validation.isValid ? '#00FF00' : '#FF0000';
      const size = validation.isValid ? 8 : 6;
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Add glow effect for good form
      if (validation.isValid) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }
    });

    // Draw connections between key points
    this.drawFormConnections(landmarks, validation.isValid);
  }

  /**
   * Draw connections between pose landmarks
   */
  private drawFormConnections(landmarks: Landmark3D[], isGoodForm: boolean): void {
    const connections = [
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 12], // Shoulders
      [23, 24], // Hips
      [11, 23], [12, 24] // Torso
    ];

    this.ctx.strokeStyle = isGoodForm ? '#00FF00' : '#FF0000';
    this.ctx.lineWidth = isGoodForm ? 3 : 2;
    this.ctx.setLineDash(isGoodForm ? [] : [5, 5]);

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && start.visibility && end.visibility && 
          start.visibility > 0.5 && end.visibility > 0.5) {
        
        this.ctx.beginPath();
        this.ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
        this.ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
        this.ctx.stroke();
      }
    });

    this.ctx.setLineDash([]);
  }

  /**
   * Draw feedback text
   */
  private drawFeedbackText(validation: ExerciseValidation): void {
    if (validation.feedback.length === 0) return;

    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;

    const padding = 10;
    let y = 30;

    validation.feedback.forEach(text => {
      // Draw text outline
      this.ctx.strokeText(text, padding, y);
      // Draw text fill
      this.ctx.fillText(text, padding, y);
      y += 25;
    });
  }

  /**
   * Draw form score indicator
   */
  private drawFormScoreIndicator(formScore: number): void {
    const x = this.canvas.width - 120;
    const y = 30;
    const width = 100;
    const height = 20;

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x - 5, y - 15, width + 10, height + 10);

    // Score bar
    const scoreWidth = width * formScore;
    const color = formScore > 0.8 ? '#00FF00' : formScore > 0.5 ? '#FFFF00' : '#FF0000';
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, scoreWidth, height);

    // Border
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Form: ${Math.round(formScore * 100)}%`, x, y - 5);
  }

  /**
   * Add celebration animation for completed rep
   */
  public addRepCompletionAnimation(repCount: number): void {
    this.animationQueue.push({
      type: 'repCompletion',
      timestamp: Date.now(),
      data: { repCount }
    });
  }

  /**
   * Add encouraging visual effect
   */
  public addEncouragementEffect(): void {
    this.animationQueue.push({
      type: 'encouragement',
      timestamp: Date.now(),
      data: {}
    });
  }
  
  /**
   * Add chin-up completion effect
   */
  public addChinUpCompletionEffect(): void {
    this.animationQueue.push({
      type: 'chinUpCompletion',
      timestamp: Date.now(),
      data: {}
    });
  }

  /**
   * Process animation queue
   */
  private processAnimations(): void {
    const now = Date.now();
    
    this.animationQueue = this.animationQueue.filter(animation => {
      const age = now - animation.timestamp;
      
      switch (animation.type) {
        case 'repCompletion':
          if (age < 2000) { // Show for 2 seconds
            this.drawRepCompletionAnimation(animation.data.repCount, age);
            return true;
          }
          break;
          
        case 'encouragement':
          if (age < 1000) { // Show for 1 second
            this.drawEncouragementEffect(age);
            return true;
          }
          break;
          
        case 'chinUpCompletion':
          if (age < 2500) { // Show for 2.5 seconds
            this.drawChinUpCompletionEffect(age);
            return true;
          }
          break;
      }
      
      return false;
    });
  }

  /**
   * Draw rep completion animation
   */
  private drawRepCompletionAnimation(repCount: number, age: number): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Fade in/out effect
    const alpha = age < 500 ? age / 500 : (2000 - age) / 1500;
    
    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    
    // Draw celebration text
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillStyle = '#00FF00';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.textAlign = 'center';
    
    const text = `Rep ${repCount}!`;
    this.ctx.strokeText(text, centerX, centerY);
    this.ctx.fillText(text, centerX, centerY);
    
    // Draw particles
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const distance = (age / 2000) * 100;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  /**
   * Draw encouragement effect
   */
  private drawEncouragementEffect(age: number): void {
    const alpha = 1 - (age / 1000);
    
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    
    // Draw pulsing border
    const pulseSize = Math.sin((age / 100) * Math.PI) * 10;
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 5 + pulseSize;
    this.ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);
    
    this.ctx.restore();
  }
  
  /**
   * Draw chin-up completion effect
   */
  private drawChinUpCompletionEffect(age: number): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 3; // Position higher for chin-up
    
    // Fade in/out effect
    const alpha = age < 500 ? age / 500 : (2500 - age) / 2000;
    
    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    
    // Draw celebration text
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillStyle = '#FF6B6B'; // Pink color for cats theme
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.textAlign = 'center';
    
    const text = 'Great Chin-Up!';
    this.ctx.strokeText(text, centerX, centerY);
    this.ctx.fillText(text, centerX, centerY);
    
    // Draw cat emoji
    this.ctx.font = 'bold 64px Arial';
    this.ctx.fillText('🐱', centerX, centerY + 80);
    
    // Draw rising stars effect
    const starCount = 12;
    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2;
      const radius = 100 + Math.sin(age / 200 + i) * 20;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius - (age / 10) % 100;
      
      // Alternate star colors
      this.ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FF6B6B';
      
      // Draw star
      this.drawStar(x, y, 5, 10, 5);
    }
    
    // Draw arcing motion lines
    this.ctx.strokeStyle = '#FF6B6B';
    this.ctx.lineWidth = 3;
    
    for (let i = 0; i < 5; i++) {
      const startAngle = Math.PI + 0.5 - (i * 0.2);
      const endAngle = Math.PI + 0.5 + (i * 0.2);
      const arcRadius = 80 + (i * 15);
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY + 120, arcRadius, startAngle, endAngle);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  /**
   * Draw a star shape
   */
  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Clear all feedback
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.animationQueue = [];
  }
}