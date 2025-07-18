/**
 * ParticleSystem.ts
 * Handles particle effects for celebrations and visual feedback
 */

import * as THREE from 'three';

export class ParticleSystem {
  private scene: THREE.Scene;
  private particleSystems: THREE.Points[] = [];
  private isInitialized = false;

  /**
   * Create a new ParticleSystem
   * @param scene THREE.Scene to add particles to
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Initialize the particle system
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * Create a burst of particles
   * @param position Position to create particles at
   * @param color Base color of particles
   * @param count Number of particles to create
   * @param size Size of particles
   * @param lifetime Lifetime of particles in milliseconds
   */
  public createParticleBurst(
    position: THREE.Vector3,
    color: THREE.Color,
    count: number = 50,
    size: number = 0.1,
    lifetime: number = 2000
  ): void {
    // Create particle geometry
    const particles = new THREE.BufferGeometry();
    
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities: number[] = [];
    
    // Set particle positions and colors
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Initial position at burst center
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
      
      // Random velocity
      velocities.push(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05 + 0.02, // Slight upward bias
        (Math.random() - 0.5) * 0.05
      );
      
      // Color with slight variation
      colors[i3] = color.r + (Math.random() - 0.5) * 0.2;
      colors[i3 + 1] = color.g + (Math.random() - 0.5) * 0.2;
      colors[i3 + 2] = color.b + (Math.random() - 0.5) * 0.2;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      size,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    (particleSystem as any).velocities = velocities;
    (particleSystem as any).creationTime = Date.now();
    (particleSystem as any).lifetime = lifetime;
    
    // Add to scene and tracking array
    this.scene.add(particleSystem);
    this.particleSystems.push(particleSystem);
  }

  /**
   * Create a confetti effect
   * @param position Position to create confetti at
   * @param count Number of confetti particles
   * @param size Size of confetti
   * @param lifetime Lifetime of confetti in milliseconds
   */
  public createConfetti(
    position: THREE.Vector3,
    count: number = 100,
    size: number = 0.05,
    lifetime: number = 3000
  ): void {
    // Create particle geometry
    const particles = new THREE.BufferGeometry();
    
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities: number[] = [];
    const rotations: number[] = [];
    
    // Set particle positions and colors
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Initial position with slight randomness
      positions[i3] = position.x + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
      
      // Random velocity
      velocities.push(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.01 - 0.01, // Downward bias
        (Math.random() - 0.5) * 0.02
      );
      
      // Random rotation
      rotations.push(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      );
      
      // Random bright color
      colors[i3] = Math.random();
      colors[i3 + 1] = Math.random();
      colors[i3 + 2] = Math.random();
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      size,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    (particleSystem as any).velocities = velocities;
    (particleSystem as any).rotations = rotations;
    (particleSystem as any).creationTime = Date.now();
    (particleSystem as any).lifetime = lifetime;
    
    // Add to scene and tracking array
    this.scene.add(particleSystem);
    this.particleSystems.push(particleSystem);
  }

  /**
   * Create a trail effect
   * @param position Position to create trail at
   * @param color Base color of trail
   * @param count Number of particles to create
   * @param size Size of particles
   * @param lifetime Lifetime of trail in milliseconds
   */
  public createTrail(
    position: THREE.Vector3,
    color: THREE.Color,
    count: number = 20,
    size: number = 0.05,
    lifetime: number = 1000
  ): void {
    // Create particle geometry
    const particles = new THREE.BufferGeometry();
    
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities: number[] = [];
    
    // Set particle positions and colors
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Initial position with slight randomness
      positions[i3] = position.x + (Math.random() - 0.5) * 0.1;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.1;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.1;
      
      // Minimal velocity
      velocities.push(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      );
      
      // Color with fade out
      const fade = Math.random() * 0.5 + 0.5;
      colors[i3] = color.r * fade;
      colors[i3 + 1] = color.g * fade;
      colors[i3 + 2] = color.b * fade;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      size,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    (particleSystem as any).velocities = velocities;
    (particleSystem as any).creationTime = Date.now();
    (particleSystem as any).lifetime = lifetime;
    
    // Add to scene and tracking array
    this.scene.add(particleSystem);
    this.particleSystems.push(particleSystem);
  }

  /**
   * Update particle systems
   * @param delta Time delta in seconds
   */
  public update(delta: number): void {
    const now = Date.now();
    
    // Update and remove expired particle systems
    this.particleSystems = this.particleSystems.filter(system => {
      const age = now - (system as any).creationTime;
      const lifetime = (system as any).lifetime;
      
      if (age > lifetime) {
        this.scene.remove(system);
        return false;
      }
      
      // Update particle positions
      const positions = (system.geometry as THREE.BufferGeometry).attributes.position.array;
      const velocities = (system as any).velocities;
      
      if (positions && velocities) {
        for (let i = 0; i < positions.length; i += 3) {
          const vi = (i / 3) * 3;
          
          // Apply velocity
          positions[i] += velocities[vi] * delta * 60;
          positions[i + 1] += velocities[vi + 1] * delta * 60;
          positions[i + 2] += velocities[vi + 2] * delta * 60;
          
          // Apply gravity to velocity
          velocities[vi + 1] -= 0.0001 * delta * 60;
        }
        
        (system.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
      }
      
      // Fade out based on age
      const fadeStart = lifetime * 0.7;
      if (age > fadeStart) {
        const opacity = 1 - (age - fadeStart) / (lifetime - fadeStart);
        (system.material as THREE.PointsMaterial).opacity = opacity;
      }
      
      return true;
    });
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Remove all particle systems
    this.particleSystems.forEach(system => {
      this.scene.remove(system);
    });
    
    this.particleSystems = [];
    this.isInitialized = false;
  }
}