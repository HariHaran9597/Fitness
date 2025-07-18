# AI Fitness Game

An AI-powered fitness game that uses computer vision to track exercise form and gamifies workouts with animal rescue themes.

## Features

- **Real-time Pose Detection**: Uses MediaPipe to detect and track body poses during exercises
- **Multiple Exercise Types**: Supports push-ups, chin-ups, and planks with proper form validation
- **Animal Rescue Theme**: Save virtual animals by completing exercise milestones
- **Progress Tracking**: Track workout history, achievements, and statistics
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Support**: Core functionality works without an internet connection

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Exercise Types](#exercise-types)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Performance Optimization](#performance-optimization)
- [Browser Compatibility](#browser-compatibility)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Installation

### Prerequisites

- Node.js 14.x or higher
- npm 7.x or higher

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-fitness-game.git
   cd ai-fitness-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Allow camera access when prompted
2. Select an exercise type (push-ups, chin-ups, or planks)
3. Position yourself in the camera frame
4. Follow the on-screen guidance for proper form
5. Complete exercises to rescue animals and earn achievements
6. View your progress in the dashboard

## Exercise Types

### Push-ups

- **Form Requirements**: Proper body alignment, full range of motion
- **Animal Theme**: Rescue cats by completing push-up milestones
- **Tips**: Keep your core engaged and maintain a straight line from head to heels

### Chin-ups

- **Form Requirements**: Full arm extension, proper chin position above the bar
- **Animal Theme**: Rescue dogs by completing chin-up milestones
- **Tips**: Avoid swinging or kicking your legs during the movement

### Planks

- **Form Requirements**: Proper body alignment, stable position
- **Animal Theme**: Rescue penguins by maintaining plank position
- **Tips**: Keep your core engaged and breathe normally throughout the hold

## Architecture

The application is built using a component-based architecture with TypeScript:

### Core Services

- **CameraService**: Handles camera access and video streaming
- **PoseDetector**: Wraps MediaPipe pose detection functionality
- **ExerciseValidator**: Base class for exercise-specific validators
- **GameManager**: Manages game state and exercise sessions
- **AnimalRescueManager**: Handles animal rescue theme and milestones
- **WorkoutSessionManager**: Tracks workout sessions and statistics
- **UserProgress**: Manages user progress data with IndexedDB storage

### Components

- **CameraView**: Displays camera feed and handles camera UI
- **PoseOverlay**: Visualizes pose detection results
- **ExerciseSelector**: UI for selecting exercise types
- **FeedbackRenderer**: Provides real-time visual feedback on form
- **ProgressDashboard**: Displays user progress statistics
- **AnimalDisplay**: Shows rescued animals and celebrations

### Utilities

- **ErrorHandler**: Advanced error handling and user guidance
- **PerformanceMonitor**: Monitors and optimizes application performance
- **MemoryManager**: Manages memory usage and cleanup
- **AudioManager**: Handles sound effects and audio feedback
- **MobileOptimizer**: Optimizes the application for mobile devices

## Development

### Project Structure

```
ai-fitness-game/
├── public/            # Static assets
├── src/
│   ├── components/    # UI components
│   │   ├── animations/
│   │   ├── animals/
│   │   ├── camera/
│   │   ├── exercise/
│   │   ├── feedback/
│   │   ├── guidance/
│   │   ├── pose/
│   │   ├── progress/
│   │   └── ui/
│   ├── models/        # Data models
│   ├── services/      # Core services
│   ├── tests/         # Test files
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── main.ts        # Application entry point
│   └── style.css      # Global styles
├── index.html         # HTML entry point
├── tsconfig.json      # TypeScript configuration
└── package.json       # Project dependencies
```

### Build Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run test`: Run tests
- `npm run lint`: Lint code

## Testing

The application includes comprehensive tests:

- **Unit Tests**: Test individual components and services
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test application performance
- **Cross-Browser Tests**: Test compatibility across browsers

Run tests with:

```bash
npm run test
```

## Performance Optimization

The application includes several performance optimizations:

- **Automatic Quality Adjustment**: Adjusts camera resolution based on device performance
- **Memory Management**: Automatically cleans up unused resources
- **Mobile Optimizations**: Specific optimizations for mobile devices
- **Lazy Loading**: Components and services are loaded on demand
- **Frame Rate Monitoring**: Monitors and optimizes frame rate for smooth experience

## Browser Compatibility

The application is compatible with:

- Chrome 80+
- Firefox 76+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome for Android)

## Troubleshooting

### Camera Access Issues

- Ensure your browser has permission to access the camera
- Try using a different browser if issues persist
- Check if another application is using the camera

### Performance Issues

- Close other browser tabs and applications
- Try lowering the camera resolution in settings
- Use a device with better hardware if possible

### Pose Detection Issues

- Ensure you are in a well-lit area
- Wear clothing that contrasts with your background
- Position yourself so your full body is visible in the frame

## License

This project is licensed under the MIT License - see the LICENSE file for details.