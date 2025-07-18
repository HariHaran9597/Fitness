/**
 * LoadingState.ts
 * Component for managing loading states and transitions
 */

// Loading state types
export enum LoadingStateType {
  INITIAL = 'initial',
  CAMERA = 'camera',
  POSE_DETECTION = 'pose_detection',
  ASSETS = 'assets',
  EXERCISE = 'exercise'
}

// Create loading state instance immediately
const loadingStyles = `
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 1;
    transition: opacity 0.5s ease;
  }

  .loading-overlay.hidden {
    display: none;
  }

  .loading-overlay.loading-fade-out {
    opacity: 0;
  }

  .loading-content {
    text-align: center;
    max-width: 80%;
  }

  .loading-logo {
    font-size: 2.5rem;
    font-weight: bold;
    color: #4CAF50;
    margin-bottom: 2rem;
    text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
    animation: pulse 2s infinite;
  }

  .loading-progress-container {
    width: 300px;
    height: 10px;
    background-color: #2d2d2d;
    border-radius: 5px;
    overflow: hidden;
    margin: 0 auto 1.5rem;
  }

  .loading-progress-bar {
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, #4CAF50, #2196F3);
    border-radius: 5px;
    transition: width 0.3s ease;
  }

  .loading-text {
    color: white;
    font-size: 1.2rem;
  }

  @keyframes pulse {
    0% { opacity: 0.8; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 0.8; transform: scale(0.98); }
  }
`;

// Add styles to document
const styleElement = document.createElement('style');
styleElement.textContent = loadingStyles;
document.head.appendChild(styleElement);

export class LoadingState {
  private container: HTMLElement;
  private loadingOverlay: HTMLElement | null = null;
  private loadingContent: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private loadingText: HTMLElement | null = null;
  private isVisible = false;
  private currentProgress = 0;
  private targetProgress = 0;
  private animationFrame: number | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }
    this.container = container;
    this.createLoadingOverlay();
  }

  private createLoadingOverlay(): void {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay hidden';
    
    this.loadingContent = document.createElement('div');
    this.loadingContent.className = 'loading-content';
    
    const logo = document.createElement('div');
    logo.className = 'loading-logo';
    logo.innerHTML = '<span>AI Fitness Game</span>';
    this.loadingContent.appendChild(logo);
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'loading-progress-container';
    
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'loading-progress-bar';
    progressContainer.appendChild(this.progressBar);
    
    this.loadingContent.appendChild(progressContainer);
    
    this.loadingText = document.createElement('div');
    this.loadingText.className = 'loading-text';
    this.loadingText.textContent = 'Loading...';
    this.loadingContent.appendChild(this.loadingText);
    
    this.loadingOverlay.appendChild(this.loadingContent);
    this.container.appendChild(this.loadingOverlay);
  }

  public show(type: LoadingStateType): void {
    if (!this.loadingOverlay || !this.loadingText) return;
    
    this.loadingText.textContent = this.getDefaultMessage(type);
    this.setProgress(0);
    
    this.loadingOverlay.classList.remove('hidden');
    this.isVisible = true;
  }

  public hide(): void {
    if (!this.loadingOverlay) return;
    
    this.loadingOverlay.classList.add('loading-fade-out');
    
    setTimeout(() => {
      if (this.loadingOverlay) {
        this.loadingOverlay.classList.add('hidden');
        this.loadingOverlay.classList.remove('loading-fade-out');
      }
    }, 500);
    
    this.isVisible = false;
    
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  public setProgress(progress: number): void {
    if (!this.progressBar) return;
    
    progress = Math.max(0, Math.min(100, progress));
    this.targetProgress = progress;
    
    if (this.animationFrame === null) {
      this.animateProgress();
    }
  }

  private animateProgress(): void {
    const diff = this.targetProgress - this.currentProgress;
    const step = Math.sign(diff) * Math.min(Math.abs(diff), 2);
    
    if (Math.abs(diff) < 0.1) {
      this.currentProgress = this.targetProgress;
      this.animationFrame = null;
    } else {
      this.currentProgress += step;
      this.animationFrame = requestAnimationFrame(() => this.animateProgress());
    }
    
    if (this.progressBar) {
      this.progressBar.style.width = `${this.currentProgress}%`;
    }
  }

  private getDefaultMessage(type: LoadingStateType): string {
    switch (type) {
      case LoadingStateType.INITIAL:
        return 'Initializing...';
      case LoadingStateType.CAMERA:
        return 'Accessing camera...';
      case LoadingStateType.POSE_DETECTION:
        return 'Loading pose detection...';
      case LoadingStateType.ASSETS:
        return 'Loading assets...';
      case LoadingStateType.EXERCISE:
        return 'Preparing exercise...';
      default:
        return 'Loading...';
    }
  }

  public updateMessage(message: string): void {
    if (!this.loadingText) return;
    this.loadingText.textContent = message;
  }

  public isLoading(): boolean {
    return this.isVisible;
  }
}

// Singleton instance
let loadingStateInstance: LoadingState | null = null;

export function showLoading(type: LoadingStateType): void {
  const loadingState = getLoadingState();
  loadingState.show(type);
}

export function hideLoading(): void {
  const loadingState = getLoadingState();
  loadingState.hide();
}

export function updateLoadingProgress(progress: number): void {
  const loadingState = getLoadingState();
  loadingState.setProgress(progress);
}

export function updateLoadingMessage(message: string): void {
  const loadingState = getLoadingState();
  loadingState.updateMessage(message);
}

export function getLoadingState(): LoadingState {
  if (!loadingStateInstance) {
    loadingStateInstance = new LoadingState('app');
  }
  return loadingStateInstance;
}