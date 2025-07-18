# Pose Detection Components

This directory contains components related to pose detection and visualization.

## Components

### PoseOverlay

The `PoseOverlay` component visualizes pose detection results on top of the camera feed.

#### Features

- Pose keypoint visualization
- Skeleton visualization
- Confidence indicators
- Form guidance overlays
- Performance optimizations

#### Usage

```typescript
import { PoseOverlay } from './components/pose/PoseOverlay';

// Create pose overlay
const poseOverlay = new PoseOverlay('pose-overlay');

// Initialize pose overlay
poseOverlay.initialize();

// Render pose data
poseOverlay.renderPose(poseData);

// Show form guidance
poseOverlay.showFormGuidance('pushup');

// Hide form guidance
poseOverlay.hideFormGuidance();

// Clean up resources
poseOverlay.dispose();
```

## Integration with MediaPipe

The pose detection components use MediaPipe for pose detection:

1. MediaPipe Pose model is loaded and initialized
2. Camera frames are processed by the model
3. Pose keypoints are extracted and normalized
4. Keypoints are rendered on the overlay
5. Additional visualizations are added based on the exercise type

## Pose Keypoints

The pose detection provides the following keypoints:

- Nose
- Left and right eyes
- Left and right ears
- Left and right shoulders
- Left and right elbows
- Left and right wrists
- Left and right hips
- Left and right knees
- Left and right ankles

Each keypoint includes:
- x, y coordinates (normalized to 0-1)
- confidence score (0-1)
- visibility (0-1)

## Form Validation

The pose data is used for exercise form validation:

- **Push-ups**: Checks arm angles, body alignment, and range of motion
- **Chin-ups**: Checks arm extension, chin position, and body stability
- **Planks**: Checks body alignment, stability, and duration

## Performance Optimizations

Pose detection can be computationally intensive. The components include several optimizations:

- Adjustable model complexity (Lite, Full, Heavy)
- Configurable detection confidence threshold
- Frame rate throttling for lower-end devices
- Resolution scaling based on device performance
- WebGL acceleration when available

## Best Practices

When working with pose detection components:

1. Ensure good lighting conditions for accurate detection
2. Position the camera to capture the full body
3. Adjust confidence thresholds based on use case
4. Monitor performance and adjust settings accordingly
5. Provide clear user guidance for optimal positioning
6. Handle detection errors gracefully

## Limitations

Current limitations of the pose detection:

- May struggle with unusual body positions
- Performance varies based on device capabilities
- Accuracy depends on lighting and clothing
- Some exercises may be harder to detect than others
- Occlusion can affect detection accuracy

## Future Improvements

Planned improvements for pose detection:

- Support for more exercise types
- Improved accuracy for edge cases
- Better performance on lower-end devices
- More detailed form feedback
- Custom pose models for specific exercises