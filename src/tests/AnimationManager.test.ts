/**
 * AnimationManager.test.ts
 * Unit tests for the AnimationManager
 */

import { AnimationManager, getAnimationManager } from '../services/AnimationManager';

// Mock Three.js
jest.mock('three', () => {
  const mockThree = {
    Scene: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      remove: jest.fn()
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
      position: { z: 0 },
      aspect: 1,
      updateProjectionMatrix: jest.fn()
    })),
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setClearColor: jest.fn(),
      render: jest.fn(),
      domElement: document.createElement('canvas'),
      dispose: jest.fn()
    })),
    AmbientLight: jest.fn().mockImplementation(() => ({})),
    DirectionalLight: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() }
    })),
    Clock: jest.fn().mockImplementation(() => ({
      getDelta: jest.fn().mockReturnValue(0.016)
    })),
    BufferGeometry: jest.fn().mockImplementation(() => ({
      setAttribute: jest.fn(),
      dispose: jest.fn()
    })),
    BufferAttribute: jest.fn(),
    PointsMaterial: jest.fn().mockImplementation(() => ({
      dispose: jest.fn()
    })),
    Points: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() },
      geometry: {
        attributes: {
          position: {
            array: new Float32Array(300),
            needsUpdate: false
          }
        }
      }
    })),
    Group: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      position: { set: jest.fn() },
      rotation: { y: 0 }
    })),
    BoxGeometry: jest.fn(),
    SphereGeometry: jest.fn(),
    CylinderGeometry: jest.fn(),
    ConeGeometry: jest.fn(),
    MeshLambertMaterial: jest.fn(),
    Mesh: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() },
      rotation: { z: 0 }
    })),
    Color: jest.fn()
  };
  
  return mockThree;
});

describe('AnimationManager', () => {
  let animationManager: AnimationManager;
  let mockContainer: HTMLElement;
  
  beforeEach(() => {
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'animation-container';
    document.body.appendChild(mockContainer);
    
    // Reset singleton
    (getAnimationManager as any).instance = null;
    
    // Create animation manager
    animationManager = new AnimationManager('animation-container');
  });
  
  afterEach(() => {
    // Clean up
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
    
    jest.clearAllMocks();
  });
  
  test('initialize should set up Three.js scene', () => {
    const result = animationManager.initialize();
    
    expect(result).toBe(true);
    expect(animationManager['isInitialized']).toBe(true);
  });
  
  test('createCelebrationEffect should create particle system', () => {
    animationManager.initialize();
    
    animationManager.createCelebrationEffect('dogs');
    
    expect(animationManager['particleSystems'].length).toBe(1);
  });
  
  test('createAnimalModel should create animal model', () => {
    animationManager.initialize();
    
    const model = animationManager.createAnimalModel('cats');
    
    expect(model).toBeDefined();
    expect(animationManager['animationObjects'].length).toBe(1);
  });
  
  test('clearAnimations should remove all animations', () => {
    animationManager.initialize();
    
    animationManager.createCelebrationEffect('dogs');
    animationManager.createAnimalModel('cats');
    
    animationManager.clearAnimations();
    
    expect(animationManager['particleSystems'].length).toBe(0);
    expect(animationManager['animationObjects'].length).toBe(0);
  });
  
  test('dispose should clean up resources', () => {
    animationManager.initialize();
    
    animationManager.dispose();
    
    expect(animationManager['isInitialized']).toBe(false);
    expect(animationManager['renderer'].dispose).toHaveBeenCalled();
  });
  
  test('getAnimationManager should return singleton instance', () => {
    const instance1 = getAnimationManager('animation-container');
    const instance2 = getAnimationManager();
    
    expect(instance1).toBe(instance2);
  });
});