/**
 * PerformanceMonitor.ts
 * Utility for monitoring and optimizing application performance
 */

import { getCameraService, ResolutionPreset } from '../services/CameraService';
import { handleError, ErrorType, ErrorSeverity } from './ErrorHandler';
import { showPerformanceGuide } from '../components/guidance/UserGuidance';

// Performance thresholds
const FRAME_RATE_THRESHOLD_LOW = 15;
const FRAME_RATE_THRESHOLD_MEDIUM = 24;
const MEMORY_THRESHOLD_HIGH = 0.8; // 80% of available memory
const CPU_USAGE_THRESHOLD = 0.7; // 70% CPU usage

// Performance data interface
interface PerformanceData {
  frameRate: number;
  memoryUsage: number | null;
  cpuUsage: number | null;
  timestamp: number;
}

/**
 * PerformanceMonitor class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isMonitoring = false;
  private frameRateData: number[] = [];
  private lastFrameTimestamp = 0;
  private performanceHistory: PerformanceData[] = [];
  private monitoringInterval: number | null = null;
  private frameCallback: number | null = null;
  private autoAdjustEnabled = true;
  private hasShownPerformanceWarning = false;
  private consecutiveLowFrameRates = 0;

  /**
   * Private constructor for singleton
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameRateData = [];
    this.lastFrameTimestamp = performance.now();
    this.performanceHistory = [];
    this.consecutiveLowFrameRates = 0;
    
    // Start frame rate monitoring
    this.monitorFrameRate();
    
    // Start periodic monitoring
    this.monitoringInterval = window.setInterval(() => {
      this.checkPerformance();
    }, 5000); // Check every 5 seconds
    
    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Stop frame rate monitoring
    if (this.frameCallback !== null) {
      cancelAnimationFrame(this.frameCallback);
      this.frameCallback = null;
    }
    
    // Stop periodic monitoring
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Performance monitoring stopped');
  }

  /**
   * Monitor frame rate
   */
  private monitorFrameRate(): void {
    const frameStep = () => {
      const now = performance.now();
      const elapsed = now - this.lastFrameTimestamp;
      
      if (elapsed > 0) {
        // Calculate instantaneous FPS
        const fps = 1000 / elapsed;
        
        // Add to frame rate data (keep last 60 frames)
        this.frameRateData.push(fps);
        if (this.frameRateData.length > 60) {
          this.frameRateData.shift();
        }
      }
      
      this.lastFrameTimestamp = now;
      
      // Continue monitoring if active
      if (this.isMonitoring) {
        this.frameCallback = requestAnimationFrame(frameStep);
      }
    };
    
    this.frameCallback = requestAnimationFrame(frameStep);
  }

  /**
   * Check performance and optimize if needed
   */
  private checkPerformance(): void {
    if (!this.isMonitoring) return;
    
    // Get current performance metrics
    const performanceData = this.getCurrentPerformanceData();
    
    // Add to history (keep last 12 data points = 1 minute)
    this.performanceHistory.push(performanceData);
    if (this.performanceHistory.length > 12) {
      this.performanceHistory.shift();
    }
    
    // Log performance data
    console.log('Performance data:', performanceData);
    
    // Check if performance is poor
    if (this.isPoorPerformance(performanceData)) {
      this.handlePoorPerformance(performanceData);
    } else {
      // Reset consecutive low frame rates
      this.consecutiveLowFrameRates = 0;
    }
  }

  /**
   * Get current performance data
   */
  private getCurrentPerformanceData(): PerformanceData {
    // Calculate average frame rate
    const frameRate = this.frameRateData.length > 0
      ? this.frameRateData.reduce((sum, fps) => sum + fps, 0) / this.frameRateData.length
      : 0;
    
    // Get memory usage if available
    let memoryUsage: number | null = null;
    if (performance && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
        memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      }
    }
    
    // CPU usage is not directly available in browsers
    // We'll use a rough approximation based on frame rate
    const cpuUsage = frameRate > 0 ? Math.min(1, 60 / frameRate) : null;
    
    return {
      frameRate,
      memoryUsage,
      cpuUsage,
      timestamp: Date.now()
    };
  }

  /**
   * Check if performance is poor
   * @param data Performance data
   */
  private isPoorPerformance(data: PerformanceData): boolean {
    // Check frame rate
    if (data.frameRate < FRAME_RATE_THRESHOLD_LOW) {
      this.consecutiveLowFrameRates++;
      return this.consecutiveLowFrameRates >= 3; // Three consecutive low frame rates
    }
    
    // Check memory usage
    if (data.memoryUsage !== null && data.memoryUsage > MEMORY_THRESHOLD_HIGH) {
      return true;
    }
    
    // Check CPU usage approximation
    if (data.cpuUsage !== null && data.cpuUsage > CPU_USAGE_THRESHOLD) {
      return true;
    }
    
    return false;
  }

  /**
   * Handle poor performance
   * @param data Performance data
   */
  private handlePoorPerformance(data: PerformanceData): void {
    if (!this.autoAdjustEnabled) return;
    
    console.warn('Poor performance detected:', data);
    
    // Show performance warning if not shown before
    if (!this.hasShownPerformanceWarning) {
      handleError(
        ErrorType.PERFORMANCE,
        ErrorSeverity.WARNING,
        'Performance issues detected. Automatically optimizing settings for better experience.'
      );
      
      // Show performance guide
      showPerformanceGuide();
      
      this.hasShownPerformanceWarning = true;
    }
    
    // Optimize camera resolution
    this.optimizeCameraResolution(data.frameRate);
  }

  /**
   * Optimize camera resolution based on frame rate
   * @param frameRate Current frame rate
   */
  private optimizeCameraResolution(frameRate: number): void {
    const cameraService = getCameraService();
    const currentResolution = cameraService.getCurrentResolution();
    
    // Skip if no current resolution
    if (!currentResolution) return;
    
    // Determine target resolution preset based on frame rate
    let targetPreset: ResolutionPreset;
    
    if (frameRate < FRAME_RATE_THRESHOLD_LOW) {
      targetPreset = ResolutionPreset.LOW;
    } else if (frameRate < FRAME_RATE_THRESHOLD_MEDIUM) {
      targetPreset = ResolutionPreset.MEDIUM;
    } else {
      // Performance is good, no need to change
      return;
    }
    
    // Apply resolution preset
    cameraService.setResolutionPreset(targetPreset)
      .then(success => {
        if (success) {
          console.log(`Camera resolution optimized to ${targetPreset} preset`);
        } else {
          console.warn('Failed to optimize camera resolution');
        }
      })
      .catch(error => {
        console.error('Error optimizing camera resolution:', error);
      });
  }

  /**
   * Enable or disable auto-adjustment
   * @param enabled Whether auto-adjustment is enabled
   */
  public setAutoAdjustEnabled(enabled: boolean): void {
    this.autoAdjustEnabled = enabled;
  }

  /**
   * Get current frame rate
   */
  public getCurrentFrameRate(): number {
    if (this.frameRateData.length === 0) return 0;
    
    return this.frameRateData.reduce((sum, fps) => sum + fps, 0) / this.frameRateData.length;
  }

  /**
   * Get performance history
   */
  public getPerformanceHistory(): PerformanceData[] {
    return [...this.performanceHistory];
  }

  /**
   * Check if device meets minimum requirements
   */
  public static checkMinimumRequirements(): boolean {
    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const hasWebGL = !!gl;
    
    // Check for camera support
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    // Check for sufficient memory (if available)
    let hasSufficientMemory = true;
    if (performance && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory && memory.jsHeapSizeLimit) {
        // Require at least 256MB of memory
        hasSufficientMemory = memory.jsHeapSizeLimit >= 268435456; // 256MB in bytes
      }
    }
    
    return hasWebGL && hasCamera && hasSufficientMemory;
  }
}

// Get performance monitor instance
export function getPerformanceMonitor(): PerformanceMonitor {
  return PerformanceMonitor.getInstance();
}

// Start performance monitoring
export function startPerformanceMonitoring(): void {
  const performanceMonitor = getPerformanceMonitor();
  performanceMonitor.startMonitoring();
}

// Stop performance monitoring
export function stopPerformanceMonitoring(): void {
  const performanceMonitor = getPerformanceMonitor();
  performanceMonitor.stopMonitoring();
}

// Check minimum requirements
export function checkMinimumRequirements(): boolean {
  return PerformanceMonitor.checkMinimumRequirements();
}