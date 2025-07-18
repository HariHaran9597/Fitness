/**
 * AppService.ts
 * Main application initialization service
 */

// Import services
import { CameraView } from '../components/camera/CameraView';
import { initializePoseDetection } from './PoseDetectionService';
import { initializeGameManager, getGameManager } from './GameManager';
import { getPoseDetector } from './PoseDetector';
import { getAnimalRescueManager, initializeAnimalRescueManager } from './AnimalRescueManager';
import { initializeAnimationManager, getAnimationManager } from './AnimationManager';
import { getAnimalAnimator } from '../components/animations/AnimalAnimator';
import type { PoseResult, ExerciseValidation, ExerciseType, AnimalTheme } from '../types/index';
import { PushUpValidator } from './PushUpValidator';
import { ChinUpValidator } from './ChinUpValidator';
import { PlankValidator } from './PlankValidator';
import { FeedbackRenderer } from '../components/feedback/FeedbackRenderer';
import { AnimalDisplay } from '../components/animals/AnimalDisplay';
import { ExerciseSelector } from '../components/exercise/ExerciseSelector';

// Global references
let cameraView: CameraView | null = null;
let poseDetector = getPoseDetector();
let pushUpValidator = new PushUpValidator();
let chinUpValidator = new ChinUpValidator();
let plankValidator = new PlankValidator();
let feedbackRenderer: FeedbackRenderer | null = null;
let animalDisplay: AnimalDisplay | null = null;

/**
 * Initialize the application and all required services
 */
export async function initializeApp(): Promise<void> {
  console.log('Initializing AI Fitness Game...');

  try {
    // Import loading state
    const {
      showLoading,
      hideLoading,
      updateLoadingProgress,
      updateLoadingMessage,
      LoadingStateType
    } = await import('../components/ui/LoadingState');
    
    // Show initial loading state
    showLoading(LoadingStateType.INITIAL);
    updateLoadingProgress(5);
    
    // Import error handling and user guidance
    const { 
      handleError, 
      ErrorType, 
      ErrorSeverity 
    } = await import('../utils/ErrorHandler');
    
    const {
      initializeUserGuidance,
      showCameraSetupGuide
    } = await import('../components/guidance/UserGuidance');
    
    const {
      checkMinimumRequirements,
      startPerformanceMonitoring
    } = await import('../utils/PerformanceMonitor');
    
    // Import memory management
    const {
      getMemoryManager,
      startAutoGC
    } = await import('../utils/MemoryManager');
    
    // Import audio management
    const {
      initializeAudioManager,
      playSoundEffect,
      SoundEffectType
    } = await import('../utils/AudioManager');
    
    // Import mobile optimizations
    const { 
      initializeMobileOptimizations, 
      addTouchOptimizations, 
      isMobileDevice 
    } = await import('../utils/MobileOptimizer');

    updateLoadingProgress(10);
    updateLoadingMessage('Checking system requirements...');

    // Check minimum requirements
    if (!checkMinimumRequirements()) {
      handleError(
        ErrorType.PERFORMANCE,
        ErrorSeverity.ERROR,
        'Your device does not meet the minimum requirements for this application. Some features may not work properly.'
      );
    }

    updateLoadingProgress(15);
    updateLoadingMessage('Initializing UI components...');

    // Initialize UI components
    initializeUI();
    
    // Initialize error handling and user guidance
    initializeUserGuidance();
    
    // Initialize memory manager and start auto GC
    const memoryManager = getMemoryManager();
    startAutoGC(60000); // Run GC every minute
    
    // Initialize audio manager
    await initializeAudioManager();

    updateLoadingProgress(25);
    updateLoadingMessage('Applying optimizations...');

    // Apply mobile optimizations if needed
    if (isMobileDevice()) {
      console.log('Mobile device detected, applying optimizations...');
      initializeMobileOptimizations();
      addTouchOptimizations();
    }

    updateLoadingProgress(35);
    updateLoadingMessage('Initializing camera...');

    // Initialize camera view
    const cameraInitialized = await initializeCamera();
    
    // Show camera setup guide if camera was initialized
    if (cameraInitialized) {
      showCameraSetupGuide();
    }

    updateLoadingProgress(50);
    updateLoadingMessage('Loading pose detection...');

    // Initialize pose detection
    await initializePoseDetection();

    updateLoadingProgress(65);
    updateLoadingMessage('Initializing game systems...');

    // Initialize game manager
    await initializeGameManager();

    // Initialize animal rescue manager
    initializeAnimalRescueManager();

    updateLoadingProgress(80);
    updateLoadingMessage('Loading animations...');

    // Initialize animation system
    initializeAnimationManager('animal-display');

    // Initialize animal display
    initializeAnimalDisplay();

    updateLoadingProgress(90);
    updateLoadingMessage('Setting up event handlers...');

    // Set up event listeners
    setupEventListeners();
    
    // Start performance monitoring
    startPerformanceMonitoring();

    updateLoadingProgress(100);
    updateLoadingMessage('Ready!');
    
    // Hide loading state with a slight delay for better UX
    setTimeout(() => {
      hideLoading();
      
      // Play success sound
      playSoundEffect(SoundEffectType.SUCCESS);
    }, 500);

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Import error handling on demand
    const { handleError, ErrorType, ErrorSeverity } = await import('../utils/ErrorHandler');
    
    // Hide loading state if visible
    const { hideLoading } = await import('../components/ui/LoadingState');
    hideLoading();
    
    handleError(
      ErrorType.GENERAL,
      ErrorSeverity.CRITICAL,
      'Failed to initialize application. Please refresh the page and try again.',
      error
    );
  }
}

// Global reference to exercise selector
let exerciseSelector: ExerciseSelector | null = null;

/**
 * Initialize the user interface components
 */
function initializeUI(): void {
  // Set up the exercise selector
  const exerciseSelectorContainer = document.getElementById('exercise-selector');
  if (exerciseSelectorContainer) {
    // Create and initialize exercise selector
    exerciseSelector = new ExerciseSelector('exercise-selector');
    exerciseSelector.initialize();
    
    // Set up exercise selection callback
    exerciseSelector.onExerciseSelected((exercise) => {
      console.log(`Selected exercise: ${exercise}`);
      
      // Ensure camera is active when exercise is selected
      if (cameraView && !cameraView.isCameraActive()) {
        cameraView.startCamera().catch(error => {
          console.error('Failed to start camera:', error);
          displayErrorMessage('Failed to start camera. Please refresh and try again.');
        });
      }
    });
  }

  // Set up the animal counter display
  const animalCounter = document.getElementById('animal-counter');
  if (animalCounter) {
    animalCounter.innerHTML = `
      <div class="counter">
        <div class="counter-cats">Cats Saved: 0</div>
        <div class="counter-dogs">Dogs Saved: 0</div>
        <div class="counter-penguins">Penguins Saved: 0</div>
      </div>
    `;
  }

  // Set up the rep counter
  const repCounter = document.getElementById('rep-counter');
  if (repCounter) {
    repCounter.innerHTML = `
      <div class="rep-display">
        <span class="rep-count">0</span> reps
      </div>
    `;
  }

  // Set up instructions
  const instructions = document.getElementById('instructions');
  if (instructions) {
    instructions.innerHTML = `
      <div class="instruction-panel">
        <h3>How to Play</h3>
        <p>1. Select an exercise type</p>
        <p>2. Allow camera access when prompted</p>
        <p>3. Position yourself in frame</p>
        <p>4. Complete exercises with proper form to save animals!</p>
      </div>
    `;
  }

  // Add CSS for camera components
  addCameraStyles();
}

/**
 * Initialize the camera
 */
async function initializeCamera(): Promise<boolean> {
  try {
    // Create camera view
    cameraView = new CameraView('camera-container');

    // Initialize camera
    const success = await cameraView.initialize();

    if (!success) {
      displayErrorMessage('Failed to initialize camera. Please check camera permissions and try again.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Camera initialization error:', error);
    displayErrorMessage('Failed to initialize camera: ' + (error instanceof Error ? error.message : String(error)));
    return false;
  }
}

/**
 * Initialize pose detection
 */
async function initializePoseDetection(): Promise<boolean> {
  try {
    // Initialize pose detector with overlay
    const success = await poseDetector.initialize('pose-overlay', (result: PoseResult) => {
      // Handle pose detection results
      handlePoseResult(result);
    });

    if (!success) {
      displayErrorMessage('Failed to initialize pose detection. Some features may not work.');
      return false;
    }

    console.log('Pose detection initialized successfully');
    return true;
  } catch (error) {
    console.error('Pose detection initialization error:', error);
    displayErrorMessage('Failed to initialize pose detection: ' + (error instanceof Error ? error.message : String(error)));
    return false;
  }
}

/**
 * Handle pose detection results
 * @param result Pose detection result
 */
function handlePoseResult(result: PoseResult): void {
  // Log pose confidence for debugging
  if (result.confidence > 0.5) {
    console.log(`Pose detected with confidence: ${Math.round(result.confidence * 100)}%`);
  }

  // Get the selected exercise from our ExerciseSelector component
  if (!exerciseSelector) return;
  
  const selectedExercise = exerciseSelector.getSelectedExercise();
  if (!selectedExercise) return;

  // Validate exercise form based on selected exercise
  switch (selectedExercise) {
    case 'pushup':
      validatePushUp(result);
      break;
    case 'chinup':
      validateChinUp(result);
      break;
    case 'plank':
      validatePlank(result);
      break;
    default:
      console.warn(`Unknown exercise type: ${selectedExercise}`);
  }
}

/**
 * Validate push-up form
 * @param result Pose detection result
 */
function validatePushUp(result: PoseResult): void {
  // Initialize feedback renderer if needed
  if (!feedbackRenderer) {
    initializeFeedbackRenderer();
  }

  // Validate push-up form
  const validation = pushUpValidator.validate(result);

  // Update rep counter display
  updateRepCounter(pushUpValidator.getRepCount());

  // Record completed repetition in game manager
  if (validation.completedRep) {
    const gameManager = getGameManager();
    const milestoneReached = gameManager.recordRepetition('pushup');

    // Update animal counter display
    updateAnimalCounters();
  }

  // Render feedback
  if (feedbackRenderer) {
    feedbackRenderer.renderPoseFeedback(result, validation);

    // Add animations for completed reps
    if (validation.completedRep) {
      feedbackRenderer.addRepCompletionAnimation(pushUpValidator.getRepCount());
    }

    // Add encouragement effect for good form
    if (validation.isValid && Math.random() < 0.05) { // Occasionally show encouragement
      feedbackRenderer.addEncouragementEffect();
    }
  }
}

/**
 * Validate chin-up form
 * @param result Pose detection result
 */
function validateChinUp(result: PoseResult): void {
  // Initialize feedback renderer if needed
  if (!feedbackRenderer) {
    initializeFeedbackRenderer();
  }

  // Validate chin-up form
  const validation = chinUpValidator.validate(result);

  // Update rep counter display
  updateRepCounter(chinUpValidator.getRepCount());

  // Record completed repetition in game manager
  if (validation.completedRep) {
    const gameManager = getGameManager();
    const milestoneReached = gameManager.recordRepetition('chinup');

    // Update animal counter display
    updateAnimalCounters();
  }

  // Render feedback
  if (feedbackRenderer) {
    feedbackRenderer.renderPoseFeedback(result, validation);

    // Add animations for completed reps
    if (validation.completedRep) {
      feedbackRenderer.addRepCompletionAnimation(chinUpValidator.getRepCount());
      
      // Add special chin-up completion effect
      feedbackRenderer.addChinUpCompletionEffect();
    }

    // Add encouragement effect for good form
    if (validation.isValid && Math.random() < 0.05) { // Occasionally show encouragement
      feedbackRenderer.addEncouragementEffect();
    }
  }
}

/**
 * Validate plank form
 * @param result Pose detection result
 */
function validatePlank(result: PoseResult): void {
  // Initialize feedback renderer if needed
  if (!feedbackRenderer) {
    initializeFeedbackRenderer();
  }

  // Validate plank form
  const validation = plankValidator.validate(result);

  // Update rep counter display (milestones for plank)
  updateRepCounter(plankValidator.getRepCount());

  // Display plank timer
  if (feedbackRenderer) {
    const duration = plankValidator.getFormattedDuration();
    feedbackRenderer.addPlankTimerDisplay(duration);
  }

  // Record completed milestone in game manager
  if (validation.completedRep) {
    const gameManager = getGameManager();
    const milestoneReached = gameManager.recordRepetition('plank');

    // Update animal counter display
    updateAnimalCounters();

    // Add milestone celebration effect
    if (feedbackRenderer) {
      const nextMilestone = plankValidator.getNextMilestoneDuration();
      feedbackRenderer.addPlankMilestoneEffect(nextMilestone);
    }
  }

  // Render feedback
  if (feedbackRenderer) {
    feedbackRenderer.renderPoseFeedback(result, validation);

    // Add encouragement effect for good form
    if (validation.isValid && Math.random() < 0.05) { // Occasionally show encouragement
      feedbackRenderer.addEncouragementEffect();
    }
  }
}

/**
 * Initialize feedback renderer
 */
function initializeFeedbackRenderer(): void {
  const overlayElement = document.getElementById('pose-overlay');
  if (!overlayElement) return;

  // Create canvas for feedback
  const feedbackCanvas = document.createElement('canvas');
  feedbackCanvas.className = 'feedback-canvas';
  feedbackCanvas.width = overlayElement.clientWidth;
  feedbackCanvas.height = overlayElement.clientHeight;
  feedbackCanvas.style.position = 'absolute';
  feedbackCanvas.style.top = '0';
  feedbackCanvas.style.left = '0';
  feedbackCanvas.style.width = '100%';
  feedbackCanvas.style.height = '100%';
  feedbackCanvas.style.pointerEvents = 'none';
  feedbackCanvas.style.zIndex = '10';

  overlayElement.appendChild(feedbackCanvas);
  feedbackRenderer = new FeedbackRenderer(feedbackCanvas);
}

/**
 * Update repetition counter display
 * @param count Current rep count
 */
function updateRepCounter(count: number): void {
  const repCountElement = document.querySelector('.rep-count');
  if (repCountElement) {
    repCountElement.textContent = count.toString();
  }
}

/**
 * Initialize animal display
 */
function initializeAnimalDisplay(): void {
  // Create animal display
  const animalDisplayContainer = document.getElementById('animal-display');
  if (!animalDisplayContainer) return;

  animalDisplay = new AnimalDisplay('animal-display');
  animalDisplay.initialize();

  // Set up animal rescue callback
  const animalRescueManager = getAnimalRescueManager();
  animalRescueManager.onAnimalRescue((animalType, count, milestone) => {
    // Update animal display
    if (animalDisplay) {
      // Add new animal with animation
      animalDisplay.addAnimal(animalType, count, true);

      // Celebrate if milestone reached
      if (milestone) {
        animalDisplay.celebrateRescue(animalType);
        
        // Add 3D celebration effect
        const animationManager = getAnimationManager();
        animationManager.createCelebrationEffect(animalType);
        
        // Create 3D animal model for milestone
        const animalAnimator = getAnimalAnimator('animal-display');
        animalAnimator.initialize();
        animalAnimator.createRescueCelebration(animalType);
      }
    }

    // Update counters
    updateAnimalCounters();
  });

  // Initialize display with current rescue data
  updateAnimalCounters();
}

/**
 * Update animal counters display
 */
function updateAnimalCounters(): void {
  const animalRescueManager = getAnimalRescueManager();
  const rescueData = animalRescueManager.getRescueData();

  // Update counter elements
  const catCounter = document.querySelector('.counter-cats');
  const dogCounter = document.querySelector('.counter-dogs');
  const penguinCounter = document.querySelector('.counter-penguins');

  if (catCounter) {
    catCounter.textContent = `Cats Saved: ${rescueData.cats}`;
  }

  if (dogCounter) {
    dogCounter.textContent = `Dogs Saved: ${rescueData.dogs}`;
  }

  if (penguinCounter) {
    penguinCounter.textContent = `Penguins Saved: ${rescueData.penguins}`;
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  // Set up window resize handler
  window.addEventListener('resize', () => {
    // Resize camera view if active
    if (cameraView) {
      cameraView.handleResize();
    }
    
    // Resize feedback canvas if it exists
    if (feedbackRenderer) {
      feedbackRenderer.handleResize();
    }
  });
  
  // Set up keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape key to exit current exercise
    if (e.key === 'Escape' && exerciseSelector) {
      const gameManager = getGameManager();
      gameManager.endExercise();
      
      // Stop pose detection
      if (poseDetector) {
        poseDetector.stop();
      }
      
      // Show exercise selector
      const container = document.getElementById('exercise-selector');
      if (container) {
        container.classList.remove('exercise-selector-hidden');
      }
      
      // Remove exercise progress UI
      const progressUI = document.querySelector('.exercise-progress');
      if (progressUI) {
        progressUI.remove();
      }
    }
  });
}

/**
 * Add camera-specific CSS styles
 */
function addCameraStyles(): void {
  // Create style element if it doesn't exist
  let styleElement = document.getElementById('camera-styles');

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'camera-styles';
    document.head.appendChild(styleElement);
  }

  // Add camera and animal display styles
  styleElement.textContent = `
    .camera-feed {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    
    .camera-controls {
      position: absolute;
      bottom: 10px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 10px;
      z-index: 10;
    }
    
    .camera-control-btn {
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .camera-control-btn:hover {
      background: rgba(0, 0, 0, 0.8);
    }
    
    .camera-device-selector {
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 8px 16px;
      cursor: pointer;
    }
    
    .camera-error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(244, 67, 54, 0.9);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      text-align: center;
      max-width: 80%;
      z-index: 20;
    }
    
    .hidden {
      display: none;
    }
    
    .exercise-button.selected {
      background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
      transform: scale(1.05);
    }
    
    /* Animal Display Styles */
    .animal-display-area {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      padding: 10px;
    }
    
    .dogs-area {
      background-color: rgba(76, 175, 80, 0.1);
      border-radius: 8px;
    }
    
    .cats-area {
      background-color: rgba(33, 150, 243, 0.1);
      border-radius: 8px;
    }
    
    .penguins-area {
      background-color: rgba(255, 152, 0, 0.1);
      border-radius: 8px;
    }
    
    .animal {
      font-size: 2rem;
      transition: all 0.3s ease;
    }
    
    .animal-enter {
      animation: pop-in 0.5s ease-out;
    }
    
    @keyframes pop-in {
      0% { transform: scale(0); opacity: 0; }
      70% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    .celebration-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100;
      animation: fade-in-out 3s ease-in-out;
    }
    
    .celebration-content {
      text-align: center;
    }
    
    .celebration-animal {
      font-size: 5rem;
      animation: bounce 1s infinite alternate;
    }
    
    .celebration-text {
      color: white;
      font-size: 2rem;
      margin-top: 20px;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    }
    
    @keyframes fade-in-out {
      0% { opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
    
    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-20px); }
    }
  `;
}

/**
 * Display an error message to the user
 */
function displayErrorMessage(message: string): void {
  const app = document.getElementById('app');
  if (app) {
    // Remove any existing error messages
    const existingErrors = app.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    // Create new error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    app.prepend(errorElement);

    // Remove after 5 seconds
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }
}