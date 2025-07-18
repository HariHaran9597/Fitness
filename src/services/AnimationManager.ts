/**
 * AnimationManager.ts
 * Manages animations and visual effects
 */

import * as THREE from 'three';
import type { AnimalType } from '../types/index';
import { getAnimalAnimator } from '../components/animations/AnimalAnimator';

export class AnimationManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private isInitialized = false;
  private containerId: string;
  private container: HTMLElement | null = null;
  private particles: THREE.Points[] = [];
  private clock: THREE.Clock;

  /**
   * Create a new AnimationManager
   * @param containerId ID of the container element
   */
  constructor(containerId: string) {
    this.containerId = containerId;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.clock = new THREE.Clock();
  }

  /**
   * Initialize the animation manager
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Get container element
      this.container = document.getElementById(this.containerId);
      if (!this.container) {
        console.error(`Container element with ID "${this.containerId}" not found`);
        return false;
      }

      // Set up renderer
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setClearColor(0x000000, 0);
      this.container.appendChild(this.renderer.domElement);

      // Set up camera
      this.camera.position.z = 5;

      // Set up scene
      this.setupLighting();

      // Start animation loop
      this.startAnimationLoop();

      // Add window resize handler
      window.addEventListener('resize', () => this.handleResize());

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize animation manager:', error);
      return false;
    }
  }

  /**
   * Set up scene lighting
   */
  private setupLighting(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);
  }

  /**
   * Start animation loop
   */
  private startAnimationLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.updateAnimations();
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Update animations
   */
  private updateAnimations(): void {
    const delta = this.clock.getDelta();

    // Update particles
    this.particles.forEach(particles => {
      const particleSystem = particles as THREE.Points;
      const geometry = particleSystem.geometry as THREE.BufferGeometry;
      
      if (geometry.attributes.position) {
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
          // Move particles upward and slightly to the side
          positions[i] += (Math.random() - 0.5) * 0.01; // X
          positions[i + 1] += 0.01; // Y
          positions[i + 2] += (Math.random() - 0.5) * 0.01; // Z
        }
        
        geometry.attributes.position.needsUpdate = true;
      }
    });

    // Remove old particles
    this.particles = this.particles.filter(particles => {
      const age = Date.now() - (particles as any).creationTime;
      if (age > 3000) {
        this.scene.remove(particles);
        return false;
      }
      return true;
    });
  }

  /**
   * Create celebration effect
   * @param animalType Type of animal
   */
  public createCelebrationEffect(animalType: AnimalType): void {
    // Create particle system
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Set particle positions and colors
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random position in a sphere
      positions[i3] = (Math.random() - 0.5) * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * 2;
      
      // Color based on animal type
      switch (animalType) {
        case 'cats':
          colors[i3] = 0.8; // R
          colors[i3 + 1] = 0.4; // G
          colors[i3 + 2] = 0.8; // B
          break;
        case 'dogs':
          colors[i3] = 0.4; // R
          colors[i3 + 1] = 0.7; // G
          colors[i3 + 2] = 0.9; // B
          break;
        case 'penguins':
          colors[i3] = 0.9; // R
          colors[i3 + 1] = 0.9; // G
          colors[i3 + 2] = 1.0; // B
          break;
        default:
          colors[i3] = 1.0; // R
          colors[i3 + 1] = 1.0; // G
          colors[i3 + 2] = 1.0; // B
      }
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    (particleSystem as any).creationTime = Date.now();
    
    // Add to scene
    this.scene.add(particleSystem);
    this.particles.push(particleSystem);
  }

  /**
   * Handle window resize
   */
  public handleResize(): void {
    if (!this.container) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove event listeners
    window.removeEventListener('resize', () => this.handleResize());
    
    // Remove renderer from DOM
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Clear scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    
    this.particles = [];
    this.isInitialized = false;
  }
}

// Singleton instance
let animationManagerInstance: AnimationManager | null = null;

/**
 * Initialize the animation manager
 * @param containerId ID of the container element
 */
export function initializeAnimationManager(containerId: string): boolean {
  animationManagerInstance = new AnimationManager(containerId);
  return animationManagerInstance.initialize();
}

/**
 * Get the animation manager instance
 */
export function getAnimationManager(): AnimationManager {
  if (!animationManagerInstance) {
    throw new Error('Animation manager not initialized');
  }
  return animationManagerInstance;
}