/**
 * AnimalAnimator.ts
 * Handles animal rescue animations
 */

import * as THREE from 'three';
import type { AnimalType } from '../../types/index';

export class AnimalAnimator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private isInitialized = false;
  private containerId: string;
  private container: HTMLElement | null = null;
  private animalModels: Map<string, THREE.Group> = new Map();
  private clock: THREE.Clock;

  /**
   * Create a new AnimalAnimator
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
   * Initialize the animal animator
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
      console.error('Failed to initialize animal animator:', error);
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

    // Rotate animal models
    this.animalModels.forEach((model) => {
      model.rotation.y += delta * 0.5;
      
      // Bounce effect
      const time = Date.now() * 0.001;
      model.position.y = Math.sin(time * 2) * 0.1;
    });
  }

  /**
   * Create rescue celebration animation
   * @param animalType Type of animal
   */
  public createRescueCelebration(animalType: AnimalType): void {
    // Clear existing models
    this.animalModels.forEach((model) => {
      this.scene.remove(model);
    });
    this.animalModels.clear();

    // Create animal model based on type
    const model = this.createAnimalModel(animalType);
    
    // Add to scene
    this.scene.add(model);
    
    // Store reference
    this.animalModels.set(animalType, model);
    
    // Add celebration effects
    this.addCelebrationEffects(animalType);
  }

  /**
   * Create animal model
   * @param animalType Type of animal
   * @returns THREE.Group containing the animal model
   */
  private createAnimalModel(animalType: AnimalType): THREE.Group {
    const group = new THREE.Group();
    
    // Create simple geometric shapes for the animal
    let bodyGeometry: THREE.BufferGeometry;
    let bodyMaterial: THREE.Material;
    
    switch (animalType) {
      case 'cats':
        // Cat model
        bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xF5A623 });
        
        const catBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(catBody);
        
        // Cat head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xF5A623 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.5, 0.3);
        group.add(head);
        
        // Cat ears
        const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 32);
        const earMaterial = new THREE.MeshPhongMaterial({ color: 0xF5A623 });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.15, 0.7, 0.3);
        leftEar.rotation.x = -Math.PI / 4;
        group.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.15, 0.7, 0.3);
        rightEar.rotation.x = -Math.PI / 4;
        group.add(rightEar);
        
        // Cat tail
        const tailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xF5A623 });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0, -0.5);
        tail.rotation.x = Math.PI / 2;
        group.add(tail);
        break;
        
      case 'dogs':
        // Dog model
        bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        
        const dogBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(dogBody);
        
        // Dog head
        const dogHeadGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const dogHeadMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const dogHead = new THREE.Mesh(dogHeadGeometry, dogHeadMaterial);
        dogHead.position.set(0, 0.4, 0.4);
        group.add(dogHead);
        
        // Dog ears
        const dogEarGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
        const dogEarMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        
        const leftDogEar = new THREE.Mesh(dogEarGeometry, dogEarMaterial);
        leftDogEar.position.set(-0.25, 0.6, 0.4);
        leftDogEar.rotation.z = -Math.PI / 6;
        group.add(leftDogEar);
        
        const rightDogEar = new THREE.Mesh(dogEarGeometry, dogEarMaterial);
        rightDogEar.position.set(0.25, 0.6, 0.4);
        rightDogEar.rotation.z = Math.PI / 6;
        group.add(rightDogEar);
        
        // Dog tail
        const dogTailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const dogTailMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const dogTail = new THREE.Mesh(dogTailGeometry, dogTailMaterial);
        dogTail.position.set(0, 0.2, -0.6);
        dogTail.rotation.x = Math.PI / 4;
        group.add(dogTail);
        break;
        
      case 'penguins':
        // Penguin model
        bodyGeometry = new THREE.CapsuleGeometry(0.4, 0.6, 16, 16);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const penguinBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(penguinBody);
        
        // Penguin belly
        const bellyGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const bellyMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
        belly.position.set(0, -0.1, 0.2);
        belly.scale.set(1, 1.2, 0.6);
        group.add(belly);
        
        // Penguin head
        const penguinHeadGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const penguinHeadMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const penguinHead = new THREE.Mesh(penguinHeadGeometry, penguinHeadMaterial);
        penguinHead.position.set(0, 0.5, 0.1);
        group.add(penguinHead);
        
        // Penguin beak
        const beakGeometry = new THREE.ConeGeometry(0.1, 0.2, 32);
        const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xFFA500 });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(0, 0.45, 0.35);
        beak.rotation.x = Math.PI / 2;
        group.add(beak);
        
        // Penguin wings
        const wingGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.2);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.45, 0, 0);
        leftWing.rotation.z = Math.PI / 6;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.45, 0, 0);
        rightWing.rotation.z = -Math.PI / 6;
        group.add(rightWing);
        break;
        
      default:
        // Generic animal
        bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
        
        const genericBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(genericBody);
    }
    
    return group;
  }

  /**
   * Add celebration effects
   * @param animalType Type of animal
   */
  private addCelebrationEffects(animalType: AnimalType): void {
    // Create particle system
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Set particle positions and colors
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random position in a sphere
      positions[i3] = (Math.random() - 0.5) * 3;
      positions[i3 + 1] = (Math.random() - 0.5) * 3;
      positions[i3 + 2] = (Math.random() - 0.5) * 3;
      
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
    
    // Add to scene
    this.scene.add(particleSystem);
    
    // Remove after 3 seconds
    setTimeout(() => {
      this.scene.remove(particleSystem);
    }, 3000);
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
    
    this.animalModels.clear();
    this.isInitialized = false;
  }
}

// Singleton instance map (one per container)
const animalAnimatorInstances: Map<string, AnimalAnimator> = new Map();

/**
 * Get the animal animator instance for a specific container
 * @param containerId ID of the container element
 */
export function getAnimalAnimator(containerId: string): AnimalAnimator {
  if (!animalAnimatorInstances.has(containerId)) {
    animalAnimatorInstances.set(containerId, new AnimalAnimator(containerId));
  }
  return animalAnimatorInstances.get(containerId)!;
}