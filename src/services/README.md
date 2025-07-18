# Services Documentation

This directory contains the core services that power the AI Fitness Game application. Each service is responsible for a specific aspect of the application's functionality.

## Service Overview

### AppService

The main application initialization service that coordinates the startup of all other services and components.

**Key Functions:**
- `initializeApp()`: Initializes the entire application
- `initializeUI()`: Sets up the user interface components
- `initializeCamera()`: Initializes the camera service
- `initializePoseDetection()`: Sets up pose detection
- `setupEventListeners()`: Configures application-wide event listeners

### CameraService

Handles camera access, video streaming, and camera-related functionality.

**Key Functions:**
- `initialize()`: Sets up the camera service
- `startCamera()`: Starts the camera stream
- `stopCamera()`: Stops the camera stream
- `toggleFacingMode()`: Switches between front and back cameras
- `setResolution()`: Changes camera resolution
- `getCurrentResolution()`: Gets current camera resolution

### PoseDetector

Wraps MediaPipe pose detection functionality and provides an interface for pose detection.

**Key Functions:**
- `initialize()`: Sets up pose detection
- `start()`: Starts pose detection
- `stop()`: Stops pose detection
- `setConfidenceThreshold()`: Sets the minimum confidence threshold for pose detection
- `getPoseKeypoints()`: Gets the latest detected pose keypoints

### PoseDetectionService

Provides higher-level pose detection functionality built on top of the PoseDetector.

**Key Functions:**
- `initializePoseDetection()`: Sets up pose detection
- `startPoseDetection()`: Starts pose detection
- `stopPoseDetection()`: Stops pose detection
- `setPoseDetectionOptions()`: Configures pose detection options

### ExerciseValidator

Base class for exercise-specific validators that check exercise form and count repetitions.

**Key Functions:**
- `validate()`: Validates exercise form based on pose data
- `getRepCount()`: Gets the current repetition count
- `reset()`: Resets the validator state

### PushUpValidator, ChinUpValidator, PlankValidator

Exercise-specific validators that extend the ExerciseValidator base class.

**Key Functions:**
- `validate()`: Validates specific exercise form
- `getRepCount()`: Gets the current repetition count
- `getFormattedDuration()`: Gets formatted duration (for plank)
- `getNextMilestoneDuration()`: Gets the next milestone duration (for plank)

### GameManager

Manages game state, exercise sessions, and scoring.

**Key Functions:**
- `initialize()`: Sets up the game manager
- `startExercise()`: Starts an exercise session
- `endExercise()`: Ends the current exercise session
- `recordRepetition()`: Records a completed repetition
- `getScore()`: Gets the current score

### AnimalRescueManager

Handles animal rescue theme, milestones, and rescue events.

**Key Functions:**
- `initialize()`: Sets up the animal rescue manager
- `recordRescue()`: Records an animal rescue
- `getRescueData()`: Gets the current rescue data
- `onAnimalRescue()`: Registers a callback for animal rescue events

### WorkoutSessionManager

Tracks workout sessions, statistics, and progress.

**Key Functions:**
- `startSession()`: Starts a new workout session
- `endSession()`: Ends the current workout session
- `recordRepetition()`: Records a completed repetition
- `recordRescuedAnimals()`: Records rescued animals
- `getCurrentSessionDuration()`: Gets the current session duration

## Usage Examples

### Initializing the Application

```typescript
import { initializeApp } from './services/AppService';

// Initialize the application
initializeApp().catch(error => {
  console.error('Failed to initialize application:', error);
});
```

### Using the Camera Service

```typescript
import { getCameraService } from './services/CameraService';

// Get camera service instance
const cameraService = getCameraService();

// Initialize camera with video element
const videoElement = document.getElementById('video') as HTMLVideoElement;
await cameraService.initialize(videoElement);

// Start camera
await cameraService.startCamera();

// Switch camera
await cameraService.toggleFacingMode();

// Stop camera
cameraService.stopCamera();
```

### Using the Pose Detector

```typescript
import { getPoseDetector } from './services/PoseDetector';

// Get pose detector instance
const poseDetector = getPoseDetector();

// Initialize pose detector with callback
await poseDetector.initialize('pose-overlay', (result) => {
  console.log('Pose detected:', result);
});

// Start pose detection
poseDetector.start();

// Stop pose detection
poseDetector.stop();
```

### Using the Game Manager

```typescript
import { getGameManager } from './services/GameManager';

// Get game manager instance
const gameManager = getGameManager();

// Initialize game manager
await gameManager.initialize();

// Start exercise
gameManager.startExercise('pushup');

// Record repetition
const milestoneReached = gameManager.recordRepetition('pushup');

// End exercise
gameManager.endExercise();
```

## Service Dependencies

- **AppService**: Depends on all other services
- **CameraService**: No dependencies
- **PoseDetector**: Depends on CameraService
- **PoseDetectionService**: Depends on PoseDetector
- **ExerciseValidator**: Depends on PoseDetector
- **GameManager**: Depends on WorkoutSessionManager, AnimalRescueManager
- **AnimalRescueManager**: No dependencies
- **WorkoutSessionManager**: Depends on UserProgress

## Error Handling

Services use a centralized error handling approach through the ErrorHandler utility. Errors are categorized by type and severity, and appropriate user guidance is provided.

Example:

```typescript
import { handleError, ErrorType, ErrorSeverity } from '../utils/ErrorHandler';

try {
  // Some operation that might fail
} catch (error) {
  handleError(
    ErrorType.CAMERA_ACCESS,
    ErrorSeverity.ERROR,
    'Failed to access camera',
    error
  );
}
```

## Performance Considerations

Services are designed with performance in mind:

- **Lazy Initialization**: Services are initialized only when needed
- **Resource Management**: Resources are properly cleaned up when no longer needed
- **Optimized Processing**: Pose detection and validation are optimized for performance
- **Adaptive Quality**: Camera resolution and processing quality adapt to device capabilities

## Extending Services

To extend or add new services:

1. Create a new service file in the `services` directory
2. Implement the service functionality
3. Export a singleton instance getter function
4. Update dependencies in other services as needed
5. Add initialization to AppService if required