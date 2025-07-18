/**
 * ErrorHandler.ts
 * Advanced error handling and user guidance utilities
 */

// Error types
export enum ErrorType {
  CAMERA_ACCESS = 'camera_access',
  CAMERA_NOT_FOUND = 'camera_not_found',
  CAMERA_IN_USE = 'camera_in_use',
  POSE_DETECTION = 'pose_detection',
  NETWORK = 'network',
  PERFORMANCE = 'performance',
  STORAGE = 'storage',
  GENERAL = 'general'
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error data interface
export interface ErrorData {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error | unknown;
  timestamp: Date;
  handled: boolean;
}

// User guidance interface
export interface UserGuidance {
  title: string;
  steps: string[];
  helpLink?: string;
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: ErrorData[] = [];
  private errorCallbacks: ((error: ErrorData) => void)[] = [];
  private errorContainer: HTMLElement | null = null;
  private guidanceContainer: HTMLElement | null = null;
  private isOffline = false;

  // Private constructor for singleton
  private constructor() {
    // Initialize error container
    this.createErrorContainer();
    
    // Initialize guidance container
    this.createGuidanceContainer();
    
    // Set up offline detection
    this.setupOfflineDetection();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create error container
   */
  private createErrorContainer(): void {
    // Check if container already exists
    this.errorContainer = document.getElementById('error-container');
    
    if (!this.errorContainer) {
      this.errorContainer = document.createElement('div');
      this.errorContainer.id = 'error-container';
      this.errorContainer.className = 'error-container';
      document.body.appendChild(this.errorContainer);
    }
  }

  /**
   * Create guidance container
   */
  private createGuidanceContainer(): void {
    // Check if container already exists
    this.guidanceContainer = document.getElementById('guidance-container');
    
    if (!this.guidanceContainer) {
      this.guidanceContainer = document.createElement('div');
      this.guidanceContainer.id = 'guidance-container';
      this.guidanceContainer.className = 'guidance-container hidden';
      document.body.appendChild(this.guidanceContainer);
    }
  }

  /**
   * Set up offline detection
   */
  private setupOfflineDetection(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.hideError(ErrorType.NETWORK);
    });
    
    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.handleError({
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.WARNING,
        message: 'You are currently offline. Some features may not work properly.',
        timestamp: new Date(),
        handled: false
      });
    });
  }

  /**
   * Handle an error
   * @param errorData Error data
   */
  public handleError(errorData: Omit<ErrorData, 'handled'>): void {
    // Create full error data
    const fullErrorData: ErrorData = {
      ...errorData,
      handled: true
    };
    
    // Add to errors list
    this.errors.push(fullErrorData);
    
    // Log error
    console.error('Error handled:', fullErrorData);
    
    // Display error to user
    this.displayError(fullErrorData);
    
    // Notify callbacks
    this.notifyErrorCallbacks(fullErrorData);
    
    // Show guidance for specific error types
    this.showGuidanceForError(fullErrorData);
  }

  /**
   * Display error to user
   * @param errorData Error data
   */
  private displayError(errorData: ErrorData): void {
    if (!this.errorContainer) return;
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = `error-message error-${errorData.severity} error-${errorData.type}`;
    
    // Create error content
    errorElement.innerHTML = `
      <div class="error-icon">${this.getErrorIcon(errorData.severity)}</div>
      <div class="error-content">
        <div class="error-title">${this.getErrorTitle(errorData.type)}</div>
        <div class="error-message-text">${errorData.message}</div>
      </div>
      <button class="error-close" aria-label="Close">&times;</button>
    `;
    
    // Add close button event
    const closeButton = errorElement.querySelector('.error-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        errorElement.classList.add('error-hiding');
        setTimeout(() => {
          errorElement.remove();
        }, 300);
      });
    }
    
    // Add to container
    this.errorContainer.appendChild(errorElement);
    
    // Auto-hide non-critical errors after a delay
    if (errorData.severity !== ErrorSeverity.CRITICAL) {
      setTimeout(() => {
        errorElement.classList.add('error-hiding');
        setTimeout(() => {
          errorElement.remove();
        }, 300);
      }, 5000);
    }
  }

  /**
   * Hide error by type
   * @param type Error type
   */
  public hideError(type: ErrorType): void {
    if (!this.errorContainer) return;
    
    // Find all errors of this type
    const errorElements = this.errorContainer.querySelectorAll(`.error-${type}`);
    
    // Hide each error
    errorElements.forEach(element => {
      element.classList.add('error-hiding');
      setTimeout(() => {
        element.remove();
      }, 300);
    });
  }

  /**
   * Get error icon based on severity
   * @param severity Error severity
   */
  private getErrorIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.INFO:
        return '&#9432;'; // Info icon
      case ErrorSeverity.WARNING:
        return '&#9888;'; // Warning icon
      case ErrorSeverity.ERROR:
        return '&#10060;'; // Error icon
      case ErrorSeverity.CRITICAL:
        return '&#9940;'; // Critical icon
      default:
        return '&#9432;'; // Default to info
    }
  }

  /**
   * Get error title based on type
   * @param type Error type
   */
  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.CAMERA_ACCESS:
        return 'Camera Access Error';
      case ErrorType.CAMERA_NOT_FOUND:
        return 'Camera Not Found';
      case ErrorType.CAMERA_IN_USE:
        return 'Camera In Use';
      case ErrorType.POSE_DETECTION:
        return 'Pose Detection Error';
      case ErrorType.NETWORK:
        return 'Network Error';
      case ErrorType.PERFORMANCE:
        return 'Performance Issue';
      case ErrorType.STORAGE:
        return 'Storage Error';
      case ErrorType.GENERAL:
        return 'Application Error';
      default:
        return 'Error';
    }
  }

  /**
   * Show guidance for specific error
   * @param errorData Error data
   */
  private showGuidanceForError(errorData: ErrorData): void {
    // Get guidance for error type
    const guidance = this.getGuidanceForErrorType(errorData.type);
    
    if (guidance) {
      this.showGuidance(guidance);
    }
  }

  /**
   * Get guidance for error type
   * @param type Error type
   */
  private getGuidanceForErrorType(type: ErrorType): UserGuidance | null {
    switch (type) {
      case ErrorType.CAMERA_ACCESS:
        return {
          title: 'Camera Access Troubleshooting',
          steps: [
            'Check that you have allowed camera permissions in your browser',
            'Try refreshing the page',
            'If using Chrome, click the camera icon in the address bar and select "Allow"',
            'If using Safari, go to Settings > Safari > Camera and ensure it\'s enabled',
            'Try closing other applications that might be using your camera'
          ],
          helpLink: 'https://support.google.com/chrome/answer/2693767'
        };
      case ErrorType.CAMERA_NOT_FOUND:
        return {
          title: 'Camera Not Found Troubleshooting',
          steps: [
            'Check that your camera is properly connected',
            'Try using a different camera if available',
            'Restart your browser',
            'Check if your camera works in other applications'
          ]
        };
      case ErrorType.POSE_DETECTION:
        return {
          title: 'Pose Detection Troubleshooting',
          steps: [
            'Ensure you are in a well-lit area',
            'Make sure your full body is visible in the camera frame',
            'Try wearing clothing that contrasts with your background',
            'Move away from the camera to ensure your full body is visible',
            'Try a different exercise if the current one is not being detected properly'
          ]
        };
      case ErrorType.PERFORMANCE:
        return {
          title: 'Performance Troubleshooting',
          steps: [
            'Close other browser tabs and applications',
            'Try lowering the camera resolution in settings',
            'Ensure your device meets the minimum requirements',
            'If on mobile, try switching to a desktop device for better performance',
            'Try using a different browser (Chrome or Firefox recommended)'
          ]
        };
      default:
        return null;
    }
  }

  /**
   * Show guidance to user
   * @param guidance User guidance
   */
  public showGuidance(guidance: UserGuidance): void {
    if (!this.guidanceContainer) return;
    
    // Clear existing guidance
    this.guidanceContainer.innerHTML = '';
    
    // Create guidance content
    const guidanceContent = document.createElement('div');
    guidanceContent.className = 'guidance-content';
    
    // Add title
    const title = document.createElement('h3');
    title.className = 'guidance-title';
    title.textContent = guidance.title;
    guidanceContent.appendChild(title);
    
    // Add steps
    const stepsList = document.createElement('ol');
    stepsList.className = 'guidance-steps';
    
    guidance.steps.forEach(step => {
      const stepItem = document.createElement('li');
      stepItem.textContent = step;
      stepsList.appendChild(stepItem);
    });
    
    guidanceContent.appendChild(stepsList);
    
    // Add help link if available
    if (guidance.helpLink) {
      const helpLink = document.createElement('a');
      helpLink.href = guidance.helpLink;
      helpLink.target = '_blank';
      helpLink.className = 'guidance-help-link';
      helpLink.textContent = 'Learn more';
      guidanceContent.appendChild(helpLink);
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'guidance-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close guidance');
    closeButton.addEventListener('click', () => this.hideGuidance());
    guidanceContent.appendChild(closeButton);
    
    // Add to container
    this.guidanceContainer.appendChild(guidanceContent);
    
    // Show container
    this.guidanceContainer.classList.remove('hidden');
  }

  /**
   * Hide guidance
   */
  public hideGuidance(): void {
    if (!this.guidanceContainer) return;
    
    this.guidanceContainer.classList.add('hidden');
  }

  /**
   * Add error callback
   * @param callback Error callback function
   */
  public addErrorCallback(callback: (error: ErrorData) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Notify error callbacks
   * @param errorData Error data
   */
  private notifyErrorCallbacks(errorData: ErrorData): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorData);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }

  /**
   * Get all errors
   */
  public getErrors(): ErrorData[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors = [];
    
    if (this.errorContainer) {
      this.errorContainer.innerHTML = '';
    }
  }

  /**
   * Check if offline
   */
  public isNetworkOffline(): boolean {
    return this.isOffline;
  }
}

// Get error handler instance
export function getErrorHandler(): ErrorHandler {
  return ErrorHandler.getInstance();
}

// Handle error helper function
export function handleError(
  type: ErrorType,
  severity: ErrorSeverity,
  message: string,
  originalError?: Error | unknown
): void {
  const errorHandler = getErrorHandler();
  errorHandler.handleError({
    type,
    severity,
    message,
    originalError,
    timestamp: new Date()
  });
}

// Show guidance helper function
export function showGuidance(guidance: UserGuidance): void {
  const errorHandler = getErrorHandler();
  errorHandler.showGuidance(guidance);
}

// Hide guidance helper function
export function hideGuidance(): void {
  const errorHandler = getErrorHandler();
  errorHandler.hideGuidance();
}