# Camera Components

This directory contains components related to camera access and display.

## Components

### CameraView

The `CameraView` component is responsible for displaying the camera feed and providing camera-related UI controls.

#### Features

- Camera feed display
- Camera device selection
- Camera facing mode toggle (front/back)
- Camera resolution control
- Error handling and display
- Mobile optimizations

#### Usage

```typescript
import { CameraView } from './components/camera/CameraView';

// Create camera view
const cameraView = new CameraView('camera-container');

// Initialize camera view
await cameraView.initialize();

// Check if camera is active
const isActive = cameraView.isCameraActive();

// Start camera
await cameraView.startCamera();

// Stop camera
cameraView.stopCamera();

// Handle resize events
cameraView.handleResize();

// Clean up resources
cameraView.dispose();
```

#### Mobile Optimizations

The `CameraView` component includes several mobile-specific optimizations:

- Fullscreen toggle for better viewing
- Touch-optimized controls
- Resolution adjustment for performance
- Orientation-specific layout adjustments
- Positioning guides for better user experience

#### Error Handling

The component provides user-friendly error messages for common camera issues:

- Camera access denied
- Camera not found
- Camera in use by another application
- Camera initialization errors

## Integration with Services

The camera components work closely with the `CameraService` to provide a seamless camera experience:

- `CameraView` uses `CameraService` for camera access and control
- `CameraService` provides the underlying functionality for camera operations
- `CameraView` handles the UI aspects of camera interaction

## Best Practices

When working with camera components:

1. Always check for camera permissions before accessing the camera
2. Handle camera errors gracefully with user-friendly messages
3. Provide camera selection options when multiple cameras are available
4. Optimize camera resolution for performance on lower-end devices
5. Ensure proper cleanup when the camera is no longer needed
6. Consider privacy implications and provide clear user guidance

## Browser Compatibility

The camera components are designed to work across modern browsers:

- Chrome 80+
- Firefox 76+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome for Android)

Some features may have limited support in older browsers:

- `facingMode` is not supported in all browsers
- Camera device selection may be limited in some browsers
- Resolution control may not work consistently across all browsers

## Performance Considerations

Camera access can be resource-intensive. Consider the following:

- Lower the resolution for better performance on mobile devices
- Stop the camera when not in use to save battery and resources
- Use appropriate video element attributes (`playsinline`, `muted`) for better mobile experience
- Monitor frame rate and adjust quality settings accordingly