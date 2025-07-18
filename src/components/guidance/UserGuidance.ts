/**
 * UserGuidance.ts
 * Component for providing user guidance and assistance
 */

import { showGuidance, UserGuidance } from '../../utils/ErrorHandler';

// Guidance types
export enum GuidanceType {
  POSITIONING = 'positioning',
  LIGHTING = 'lighting',
  EXERCISE_FORM = 'exercise_form',
  CAMERA_SETUP = 'camera_setup',
  PERFORMANCE = 'performance'
}

// Exercise form guidance map
const exerciseFormGuidance: Record<string, UserGuidance> = {
  pushup: {
    title: 'Push-Up Form Guide',
    steps: [
      'Start in a plank position with hands slightly wider than shoulder-width apart',
      'Keep your body in a straight line from head to heels',
      'Lower your body until your chest nearly touches the floor',
      'Push back up to the starting position',
      'Keep your core engaged throughout the movement',
      'Don\'t let your hips sag or pike up'
    ]
  },
  chinup: {
    title: 'Chin-Up Form Guide',
    steps: [
      'Grip the bar with palms facing toward you, hands shoulder-width apart',
      'Hang with arms fully extended',
      'Pull yourself up until your chin is above the bar',
      'Lower yourself back down with control',
      'Avoid swinging or kicking your legs',
      'Keep your shoulders down and away from your ears'
    ]
  },
  plank: {
    title: 'Plank Form Guide',
    steps: [
      'Start in a forearm plank position with elbows directly under shoulders',
      'Keep your body in a straight line from head to heels',
      'Engage your core by drawing your navel toward your spine',
      'Keep your neck in a neutral position, looking at the floor',
      'Don\'t let your hips sag or pike up',
      'Breathe normally throughout the hold'
    ]
  }
};

/**
 * UserGuidance class
 */
export class UserGuidanceManager {
  private static instance: UserGuidanceManager;
  private guidanceOverlay: HTMLElement | null = null;
  private positioningGuide: HTMLElement | null = null;
  private lightingGuide: HTMLElement | null = null;
  private isInitialized = false;

  /**
   * Private constructor for singleton
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): UserGuidanceManager {
    if (!UserGuidanceManager.instance) {
      UserGuidanceManager.instance = new UserGuidanceManager();
    }
    return UserGuidanceManager.instance;
  }

  /**
   * Initialize user guidance
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    // Create guidance overlay
    this.createGuidanceOverlay();
    
    // Create positioning guide
    this.createPositioningGuide();
    
    // Create lighting guide
    this.createLightingGuide();
    
    // Add styles
    this.addStyles();
    
    this.isInitialized = true;
  }

  /**
   * Create guidance overlay
   */
  private createGuidanceOverlay(): void {
    // Check if overlay already exists
    this.guidanceOverlay = document.getElementById('guidance-overlay');
    
    if (!this.guidanceOverlay) {
      this.guidanceOverlay = document.createElement('div');
      this.guidanceOverlay.id = 'guidance-overlay';
      this.guidanceOverlay.className = 'guidance-overlay hidden';
      document.body.appendChild(this.guidanceOverlay);
    }
  }

  /**
   * Create positioning guide
   */
  private createPositioningGuide(): void {
    if (!this.guidanceOverlay) return;
    
    this.positioningGuide = document.createElement('div');
    this.positioningGuide.className = 'positioning-guide hidden';
    
    this.positioningGuide.innerHTML = `
      <div class="guide-content">
        <h3>Position Yourself</h3>
        <div class="guide-outline"></div>
        <div class="guide-instructions">
          <p>Stand back so your full body is visible</p>
          <p>Center yourself in the frame</p>
        </div>
        <button class="guide-close" aria-label="Close guide">&times;</button>
      </div>
    `;
    
    // Add close button event
    const closeButton = this.positioningGuide.querySelector('.guide-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hideGuide(GuidanceType.POSITIONING);
      });
    }
    
    this.guidanceOverlay.appendChild(this.positioningGuide);
  }

  /**
   * Create lighting guide
   */
  private createLightingGuide(): void {
    if (!this.guidanceOverlay) return;
    
    this.lightingGuide = document.createElement('div');
    this.lightingGuide.className = 'lighting-guide hidden';
    
    this.lightingGuide.innerHTML = `
      <div class="guide-content">
        <h3>Improve Lighting</h3>
        <div class="lighting-icon">💡</div>
        <div class="guide-instructions">
          <p>Move to a well-lit area</p>
          <p>Avoid backlighting (light behind you)</p>
          <p>Ensure even lighting on your body</p>
        </div>
        <button class="guide-close" aria-label="Close guide">&times;</button>
      </div>
    `;
    
    // Add close button event
    const closeButton = this.lightingGuide.querySelector('.guide-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hideGuide(GuidanceType.LIGHTING);
      });
    }
    
    this.guidanceOverlay.appendChild(this.lightingGuide);
  }

  /**
   * Show positioning guide
   */
  public showPositioningGuide(): void {
    if (!this.guidanceOverlay || !this.positioningGuide) return;
    
    this.guidanceOverlay.classList.remove('hidden');
    this.positioningGuide.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideGuide(GuidanceType.POSITIONING);
    }, 5000);
  }

  /**
   * Show lighting guide
   */
  public showLightingGuide(): void {
    if (!this.guidanceOverlay || !this.lightingGuide) return;
    
    this.guidanceOverlay.classList.remove('hidden');
    this.lightingGuide.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideGuide(GuidanceType.LIGHTING);
    }, 5000);
  }

  /**
   * Show exercise form guide
   * @param exerciseType Exercise type
   */
  public showExerciseFormGuide(exerciseType: string): void {
    const guidance = exerciseFormGuidance[exerciseType];
    
    if (guidance) {
      showGuidance(guidance);
    }
  }

  /**
   * Show camera setup guide
   */
  public showCameraSetupGuide(): void {
    showGuidance({
      title: 'Camera Setup Guide',
      steps: [
        'Position your camera at a height that can see your full body',
        'Ensure there is enough space around you to perform exercises',
        'Make sure the area is well-lit with light in front of you, not behind',
        'Clear the background of distractions and clutter',
        'If using a mobile device, place it in landscape orientation for better view'
      ]
    });
  }

  /**
   * Show performance optimization guide
   */
  public showPerformanceGuide(): void {
    showGuidance({
      title: 'Performance Optimization',
      steps: [
        'Close other browser tabs and applications',
        'Lower the camera resolution in settings',
        'Ensure your device meets the minimum requirements',
        'Try using a different browser (Chrome or Firefox recommended)',
        'If on mobile, try switching to a desktop device for better performance'
      ]
    });
  }

  /**
   * Hide specific guide
   * @param type Guidance type
   */
  public hideGuide(type: GuidanceType): void {
    if (!this.guidanceOverlay) return;
    
    switch (type) {
      case GuidanceType.POSITIONING:
        if (this.positioningGuide) {
          this.positioningGuide.classList.add('hidden');
        }
        break;
      case GuidanceType.LIGHTING:
        if (this.lightingGuide) {
          this.lightingGuide.classList.add('hidden');
        }
        break;
      default:
        break;
    }
    
    // Hide overlay if all guides are hidden
    if (
      (!this.positioningGuide || this.positioningGuide.classList.contains('hidden')) &&
      (!this.lightingGuide || this.lightingGuide.classList.contains('hidden'))
    ) {
      this.guidanceOverlay.classList.add('hidden');
    }
  }

  /**
   * Add styles
   */
  private addStyles(): void {
    // Create style element if it doesn't exist
    let styleElement = document.getElementById('user-guidance-styles');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'user-guidance-styles';
      document.head.appendChild(styleElement);
    }
    
    // Add styles
    styleElement.textContent = `
      .guidance-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        transition: opacity 0.3s ease;
      }
      
      .guidance-overlay.hidden {
        display: none;
        opacity: 0;
      }
      
      .positioning-guide, .lighting-guide {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 90%;
        width: 400px;
        background-color: var(--surface-color, #2d2d2d);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        padding: 20px;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .positioning-guide.hidden, .lighting-guide.hidden {
        display: none;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
      
      .guide-content {
        text-align: center;
      }
      
      .guide-content h3 {
        margin-top: 0;
        color: var(--primary-color, #4ECDC4);
        font-size: 1.5rem;
        margin-bottom: 15px;
      }
      
      .guide-outline {
        width: 200px;
        height: 300px;
        border: 2px dashed var(--primary-color, #4ECDC4);
        margin: 0 auto 20px;
        border-radius: 10px;
        position: relative;
      }
      
      .guide-outline::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50px;
        height: 100px;
        border: 2px dashed rgba(255, 255, 255, 0.5);
        border-radius: 25px;
      }
      
      .lighting-icon {
        font-size: 4rem;
        margin: 20px 0;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 0.7; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0.7; transform: scale(0.95); }
      }
      
      .guide-instructions {
        margin-bottom: 20px;
      }
      
      .guide-instructions p {
        margin: 8px 0;
        color: var(--text-color, #ffffff);
      }
      
      .guide-close {
        background-color: transparent;
        border: none;
        color: var(--text-color, #ffffff);
        font-size: 1.5rem;
        cursor: pointer;
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .guide-close:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      /* Error and guidance container styles */
      .error-container {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 350px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .error-message {
        background-color: var(--surface-color, #2d2d2d);
        border-left: 4px solid var(--error-color, #f44336);
        border-radius: 4px;
        padding: 12px;
        display: flex;
        align-items: flex-start;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        animation: slide-in 0.3s ease;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .error-message.error-hiding {
        opacity: 0;
        transform: translateX(100%);
      }
      
      .error-info {
        border-left-color: var(--secondary-color, #2196F3);
      }
      
      .error-warning {
        border-left-color: var(--accent-color, #FF9800);
      }
      
      .error-critical {
        border-left-color: var(--error-color, #f44336);
        background-color: rgba(244, 67, 54, 0.1);
      }
      
      .error-icon {
        margin-right: 12px;
        font-size: 1.5rem;
      }
      
      .error-content {
        flex: 1;
      }
      
      .error-title {
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .error-message-text {
        font-size: 0.9rem;
        color: var(--text-secondary, #b0b0b0);
      }
      
      .error-close {
        background: transparent;
        border: none;
        color: var(--text-secondary, #b0b0b0);
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        margin-left: 8px;
      }
      
      .guidance-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 90%;
        width: 500px;
        background-color: var(--surface-color, #2d2d2d);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slide-up 0.3s ease;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .guidance-container.hidden {
        display: none;
        opacity: 0;
        transform: translateX(-50%) translateY(100%);
      }
      
      .guidance-content {
        padding: 20px;
        position: relative;
      }
      
      .guidance-title {
        margin-top: 0;
        color: var(--primary-color, #4ECDC4);
        font-size: 1.3rem;
        margin-bottom: 15px;
      }
      
      .guidance-steps {
        margin: 0;
        padding-left: 20px;
      }
      
      .guidance-steps li {
        margin-bottom: 8px;
        color: var(--text-color, #ffffff);
      }
      
      .guidance-help-link {
        display: inline-block;
        margin-top: 15px;
        color: var(--secondary-color, #2196F3);
        text-decoration: none;
      }
      
      .guidance-help-link:hover {
        text-decoration: underline;
      }
      
      .guidance-close {
        background-color: transparent;
        border: none;
        color: var(--text-color, #ffffff);
        font-size: 1.5rem;
        cursor: pointer;
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .guidance-close:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slide-up {
        from { transform: translateX(-50%) translateY(100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      
      @media (max-width: 768px) {
        .error-container {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
        
        .guidance-container {
          bottom: 10px;
          width: calc(100% - 20px);
        }
      }
    `;
  }
}

// Get user guidance manager instance
export function getUserGuidanceManager(): UserGuidanceManager {
  return UserGuidanceManager.getInstance();
}

// Initialize user guidance
export function initializeUserGuidance(): void {
  const userGuidanceManager = getUserGuidanceManager();
  userGuidanceManager.initialize();
}

// Show positioning guide
export function showPositioningGuide(): void {
  const userGuidanceManager = getUserGuidanceManager();
  userGuidanceManager.showPositioningGuide();
}

// Show lighting guide
export function showLightingGuide(): void {
  const userGuidanceManager = getUserGuidanceManager();
  userGuidanceManager.showLightingGuide();
}

// Show exercise form guide
export function showExerciseFormGuide(exerciseType: string): void {
  const userGuidanceManager = getUserGuidanceManager();
  userGuidanceManager.showExerciseFormGuide(exerciseType);
}

// Show camera setup guide
export function showCameraSetupGuide(): void {
  const userGuidanceManager = getUserGuidanceManager();
  userGuidanceManager.showCameraSetupGuide();
}

// Show performance guide
export function showPerformanceGuide(): void {
  const userGuidanceManager = getUserGuidanceManager();
  userGuidanceManager.showPerformanceGuide();
}