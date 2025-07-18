/**
 * CameraView.ts
 * Component for displaying the camera feed and handling camera UI
 */

import { getCameraService } from '../../services/CameraService';
import { 
  isMobileDevice, 
  optimizeCameraForMobile, 
  addFullscreenToggle, 
  applyOrientationOptimizations 
} from '../../utils/MobileOptimizer';

export class CameraView {
  private container: HTMLElement;
  private videoElement: HTMLVideoElement | null = null;
  private cameraControls: HTMLElement | null = null;
  private errorDisplay: HTMLElement | null = null;
  private isInitialized = false;
  private isMobile: boolean;

  /**
   * Create a new CameraView
   * @param containerId ID of the container element
   */
  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }
    
    this.container = container;
    this.isMobile = isMobileDevice();
    
    // Listen for orientation changes
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Initialize the camera view
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Create video element
      this.videoElement = document.createElement('video');
      this.videoElement.id = 'camera-feed';
      this.videoElement.playsInline = true; // Important for iOS
      this.videoElement.muted = true;
      this.videoElement.className = 'camera-feed';
      
      // Create error display
      this.errorDisplay = document.createElement('div');
      this.errorDisplay.className = 'camera-error hidden';
      
      // Create camera controls
      this.cameraControls = document.createElement('div');
      this.cameraControls.className = 'camera-controls';
      
      // Add switch camera button
      const switchCameraBtn = document.createElement('button');
      switchCameraBtn.className = 'camera-control-btn';
      switchCameraBtn.innerHTML = '<span>Switch Camera</span>';
      switchCameraBtn.setAttribute('aria-label', 'Switch Camera');
      switchCameraBtn.addEventListener('click', () => this.handleSwitchCamera());
      this.cameraControls.appendChild(switchCameraBtn);
      
      // Add elements to container
      const videoContainer = document.getElementById('video-container');
      if (videoContainer) {
        videoContainer.innerHTML = ''; // Clear any existing content
        videoContainer.appendChild(this.videoElement);
        videoContainer.appendChild(this.errorDisplay);
        videoContainer.appendChild(this.cameraControls);
      } else {
        this.container.appendChild(this.videoElement);
        this.container.appendChild(this.errorDisplay);
        this.container.appendChild(this.cameraControls);
      }
      
      // Apply mobile optimizations if needed
      if (this.isMobile) {
        this.applyMobileOptimizations();
      }
      
      // Initialize camera service
      const success = await getCameraService().initialize(
        this.videoElement,
        (error) => this.showError(error)
      );
      
      if (!success) {
        this.showError('Failed to initialize camera');
        return false;
      }
      
      // Add camera device selection if multiple cameras available
      await this.updateCameraDeviceList();
      
      // Apply mobile camera optimizations after camera is initialized
      if (this.isMobile && this.videoElement) {
        optimizeCameraForMobile(this.videoElement);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      this.showError('Error initializing camera view: ' + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }

  /**
   * Apply mobile-specific optimizations
   */
  private applyMobileOptimizations(): void {
    // Add fullscreen toggle button
    addFullscreenToggle('camera-container');
    
    // Apply orientation optimizations
    applyOrientationOptimizations();
    
    // Optimize camera controls for touch
    if (this.cameraControls) {
      // Make buttons larger for touch
      const buttons = this.cameraControls.querySelectorAll('button');
      buttons.forEach(button => {
        button.classList.add('touch-optimized');
      });
      
      // Add resolution selector for mobile
      this.addResolutionSelector();
    }
  }

  /**
   * Add resolution selector for mobile devices
   */
  private addResolutionSelector(): void {
    if (!this.cameraControls) return;
    
    // Create resolution selector button
    const resolutionBtn = document.createElement('button');
    resolutionBtn.className = 'camera-control-btn resolution-btn';
    resolutionBtn.innerHTML = '<span>Quality</span>';
    resolutionBtn.setAttribute('aria-label', 'Change camera quality');
    
    // Add click event listener
    resolutionBtn.addEventListener('click', () => {
      this.toggleResolution();
    });
    
    this.cameraControls.appendChild(resolutionBtn);
  }

  /**
   * Toggle between high and low resolution for performance
   */
  private async toggleResolution(): Promise<void> {
    const cameraService = getCameraService();
    const currentWidth = cameraService.getCurrentResolution().width;
    
    // Toggle between high and low resolution
    if (currentWidth >= 640) {
      // Switch to low resolution for better performance
      await cameraService.setResolution(320, 240);
      this.showMessage('Switched to low quality for better performance');
    } else {
      // Switch to high resolution for better quality
      await cameraService.setResolution(640, 480);
      this.showMessage('Switched to high quality');
    }
  }

  /**
   * Show a temporary message
   * @param message Message to display
   */
  private showMessage(message: string): void {
    // Create message element if it doesn't exist
    let messageElement = document.getElementById('camera-message');
    
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.id = 'camera-message';
      messageElement.className = 'camera-message';
      this.container.appendChild(messageElement);
    }
    
    // Set message text
    messageElement.textContent = message;
    messageElement.classList.add('visible');
    
    // Hide after 2 seconds
    setTimeout(() => {
      if (messageElement) {
        messageElement.classList.remove('visible');
      }
    }, 2000);
  }

  /**
   * Update the camera device selection dropdown
   */
  private async updateCameraDeviceList(): Promise<void> {
    if (!this.cameraControls) return;
    
    const cameraService = getCameraService();
    await cameraService.updateAvailableDevices();
    const devices = cameraService.getAvailableDevices();
    
    // Only show device selector if multiple cameras available
    if (devices.length > 1) {
      // Remove existing selector if any
      const existingSelector = this.cameraControls.querySelector('.camera-device-selector');
      if (existingSelector) {
        existingSelector.remove();
      }
      
      // Create device selector
      const deviceSelector = document.createElement('select');
      deviceSelector.className = 'camera-device-selector';
      
      devices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${index + 1}`;
        deviceSelector.appendChild(option);
      });
      
      // Add change event listener
      deviceSelector.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        cameraService.switchCamera(target.value);
      });
      
      this.cameraControls.appendChild(deviceSelector);
    }
  }

  /**
   * Handle switch camera button click
   */
  private async handleSwitchCamera(): Promise<void> {
    const cameraService = getCameraService();
    
    // If we have device IDs, use the device selector
    if (cameraService.getAvailableDevices().length > 1) {
      await this.updateCameraDeviceList();
    } else {
      // Otherwise toggle between front/back cameras
      await cameraService.toggleFacingMode();
    }
  }

  /**
   * Show an error message
   * @param message Error message to display
   */
  public showError(message: string): void {
    if (!this.errorDisplay) return;
    
    this.errorDisplay.textContent = message;
    this.errorDisplay.classList.remove('hidden');
    
    // Hide after 5 seconds
    setTimeout(() => {
      if (this.errorDisplay) {
        this.errorDisplay.classList.add('hidden');
      }
    }, 5000);
  }

  /**
   * Get the video element
   */
  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Check if camera is active
   */
  public isCameraActive(): boolean {
    return getCameraService().isActive();
  }

  /**
   * Start the camera
   */
  public async startCamera(): Promise<boolean> {
    return getCameraService().startCamera();
  }

  /**
   * Stop the camera
   */
  public stopCamera(): void {
    getCameraService().stopCamera();
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopCamera();
    this.isInitialized = false;
  }

  /**
   * Handle window resize event
   */
  public handleResize(): void {
    // Apply orientation optimizations if mobile
    if (this.isMobile) {
      applyOrientationOptimizations();
    }
    
    // Adjust video element size if needed
    if (this.videoElement) {
      // Ensure the video maintains proper aspect ratio
      const containerWidth = this.container.clientWidth;
      const containerHeight = this.container.clientHeight;
      
      // Apply any necessary adjustments to maintain aspect ratio
      if (this.videoElement.videoWidth && this.videoElement.videoHeight) {
        const videoRatio = this.videoElement.videoWidth / this.videoElement.videoHeight;
        const containerRatio = containerWidth / containerHeight;
        
        if (videoRatio > containerRatio) {
          // Video is wider than container
          this.videoElement.style.width = '100%';
          this.videoElement.style.height = 'auto';
        } else {
          // Video is taller than container
          this.videoElement.style.width = 'auto';
          this.videoElement.style.height = '100%';
        }
      }
    }
  }
}