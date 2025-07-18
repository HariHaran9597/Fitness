/**
 * CameraService.ts
 * Handles camera access and video streaming
 */

// Import types
import { safeLocalStorageGet, safeLocalStorageSave } from '../utils/helpers';
import { STORAGE_KEYS } from '../utils/constants';
import { isMobileDevice } from '../utils/MobileOptimizer';

// Camera settings interface
interface CameraSettings {
  deviceId: string | null;
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
  idealFrameRate?: number;
}

// Resolution presets
export enum ResolutionPreset {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Resolution settings
interface ResolutionSettings {
  width: number;
  height: number;
  frameRate?: number;
}

// Camera service class
export class CameraService {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private settings: CameraSettings;
  private availableDevices: MediaDeviceInfo[] = [];
  private isInitialized = false;
  private errorCallback: ((error: string) => void) | null = null;
  private isMobile: boolean;
  private currentResolution: ResolutionSettings;

  constructor() {
    this.isMobile = isMobileDevice();
    
    // Default camera settings - adjust based on device
    this.settings = {
      deviceId: null,
      width: this.isMobile ? 480 : 640,
      height: this.isMobile ? 360 : 480,
      facingMode: 'user', // Front camera by default
      idealFrameRate: this.isMobile ? 24 : 30
    };
    
    this.currentResolution = {
      width: this.settings.width,
      height: this.settings.height,
      frameRate: this.settings.idealFrameRate
    };

    // Try to load saved camera settings
    const savedSettings = safeLocalStorageGet<CameraSettings | null>(
      STORAGE_KEYS.SETTINGS + '-camera',
      null
    );
    
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
      this.currentResolution = {
        width: this.settings.width,
        height: this.settings.height,
        frameRate: this.settings.idealFrameRate
      };
    }
  }

  /**
   * Initialize the camera service
   * @param videoElement The video element to display the camera feed
   * @param errorCallback Callback for error handling
   */
  public async initialize(
    videoElement: HTMLVideoElement,
    errorCallback?: (error: string) => void
  ): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    this.video = videoElement;
    
    if (errorCallback) {
      this.errorCallback = errorCallback;
    }

    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.handleError('Your browser does not support camera access. Please try a different browser.');
        return false;
      }

      // Get available camera devices
      await this.updateAvailableDevices();

      // Start the camera
      await this.startCamera();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      this.handleError('Failed to initialize camera: ' + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }

  /**
   * Start the camera with current settings
   */
  public async startCamera(): Promise<boolean> {
    if (!this.video) {
      this.handleError('Video element not initialized');
      return false;
    }

    try {
      // Stop any existing stream
      this.stopCamera();

      // Create constraints based on settings
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: this.settings.deviceId ? { exact: this.settings.deviceId } : undefined,
          width: { ideal: this.settings.width },
          height: { ideal: this.settings.height },
          facingMode: this.settings.facingMode,
          frameRate: this.settings.idealFrameRate ? { ideal: this.settings.idealFrameRate } : undefined
        },
        audio: false
      };

      // Get camera stream
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Connect stream to video element
      this.video.srcObject = this.stream;
      
      // Update current resolution from actual track settings
      this.updateCurrentResolutionFromTrack();
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (!this.video) return;
        
        const onCanPlay = () => {
          this.video?.removeEventListener('canplay', onCanPlay);
          resolve();
        };
        
        this.video.addEventListener('canplay', onCanPlay);
        
        // If video is already ready, resolve immediately
        if (this.video.readyState >= 3) {
          resolve();
        }
      });

      // Start playing
      await this.video.play();
      
      console.log('Camera started successfully with resolution:', 
        `${this.currentResolution.width}x${this.currentResolution.height}`,
        `at ${this.currentResolution.frameRate || 'unknown'} fps`);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.handleError('Camera access denied. Please allow camera access and try again.');
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        this.handleError('No camera found. Please connect a camera and try again.');
      } else if (error instanceof DOMException && error.name === 'NotReadableError') {
        this.handleError('Camera is in use by another application or not accessible.');
      } else if (error instanceof DOMException && error.name === 'OverconstrainedError') {
        // Try again with lower resolution if constraints are too strict
        console.warn('Camera constraints too strict, trying with lower resolution');
        this.settings.width = Math.floor(this.settings.width * 0.75);
        this.settings.height = Math.floor(this.settings.height * 0.75);
        return this.startCamera();
      } else {
        this.handleError('Failed to start camera: ' + (error instanceof Error ? error.message : String(error)));
      }
      return false;
    }
  }

  /**
   * Update current resolution from active video track
   */
  private updateCurrentResolutionFromTrack(): void {
    if (!this.stream) return;
    
    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      this.currentResolution = {
        width: settings.width || this.settings.width,
        height: settings.height || this.settings.height,
        frameRate: settings.frameRate
      };
    }
  }

  /**
   * Stop the camera stream
   */
  public stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  /**
   * Update the list of available camera devices
   */
  public async updateAvailableDevices(): Promise<MediaDeviceInfo[]> {
    try {
      // Request permission first by accessing any camera
      if (!this.stream) {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      
      // Get all video input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter(device => device.kind === 'videoinput');
      
      return this.availableDevices;
    } catch (error) {
      this.handleError('Failed to get camera devices: ' + (error instanceof Error ? error.message : String(error)));
      return [];
    }
  }

  /**
   * Get the list of available camera devices
   */
  public getAvailableDevices(): MediaDeviceInfo[] {
    return this.availableDevices;
  }

  /**
   * Switch to a different camera device
   * @param deviceId The ID of the camera device to use
   */
  public async switchCamera(deviceId: string): Promise<boolean> {
    // Update settings
    this.settings.deviceId = deviceId;
    
    // Save settings
    safeLocalStorageSave(STORAGE_KEYS.SETTINGS + '-camera', this.settings);
    
    // Restart camera with new device
    return this.startCamera();
  }

  /**
   * Toggle between front and back cameras (mobile)
   */
  public async toggleFacingMode(): Promise<boolean> {
    // Toggle facing mode
    this.settings.facingMode = this.settings.facingMode === 'user' ? 'environment' : 'user';
    
    // Clear device ID to use facing mode
    this.settings.deviceId = null;
    
    // Save settings
    safeLocalStorageSave(STORAGE_KEYS.SETTINGS + '-camera', this.settings);
    
    // Restart camera with new facing mode
    return this.startCamera();
  }

  /**
   * Set camera resolution
   * @param width Desired width
   * @param height Desired height
   * @param frameRate Optional frame rate
   */
  public async setResolution(width: number, height: number, frameRate?: number): Promise<boolean> {
    this.settings.width = width;
    this.settings.height = height;
    
    if (frameRate !== undefined) {
      this.settings.idealFrameRate = frameRate;
    }
    
    // Save settings
    safeLocalStorageSave(STORAGE_KEYS.SETTINGS + '-camera', this.settings);
    
    // Restart camera with new resolution
    return this.startCamera();
  }

  /**
   * Set resolution preset
   * @param preset Resolution preset
   */
  public async setResolutionPreset(preset: ResolutionPreset): Promise<boolean> {
    switch (preset) {
      case ResolutionPreset.LOW:
        return this.setResolution(320, 240, 15);
      case ResolutionPreset.MEDIUM:
        return this.setResolution(640, 480, 24);
      case ResolutionPreset.HIGH:
        return this.setResolution(1280, 720, 30);
      default:
        return false;
    }
  }

  /**
   * Get current resolution
   */
  public getCurrentResolution(): ResolutionSettings {
    return this.currentResolution;
  }

  /**
   * Get the video element
   */
  public getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  /**
   * Check if camera is currently active
   */
  public isActive(): boolean {
    return !!this.stream && this.stream.active;
  }

  /**
   * Get camera capabilities
   */
  public getCameraCapabilities(): MediaTrackCapabilities | null {
    if (!this.stream) return null;
    
    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) return null;
    
    return videoTrack.getCapabilities();
  }

  /**
   * Handle camera errors
   * @param message Error message
   */
  private handleError(message: string): void {
    console.error('Camera error:', message);
    
    if (this.errorCallback) {
      this.errorCallback(message);
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopCamera();
    this.isInitialized = false;
  }
}

// Singleton instance
let cameraServiceInstance: CameraService | null = null;

/**
 * Get the camera service instance
 */
export function getCameraService(): CameraService {
  if (!cameraServiceInstance) {
    cameraServiceInstance = new CameraService();
  }
  return cameraServiceInstance;
}

/**
 * Initialize the camera service
 * @param videoElement The video element to display the camera feed
 * @param errorCallback Callback for error handling
 */
export async function initializeCameraService(
  videoElement: HTMLVideoElement,
  errorCallback?: (error: string) => void
): Promise<boolean> {
  const cameraService = getCameraService();
  return cameraService.initialize(videoElement, errorCallback);
}