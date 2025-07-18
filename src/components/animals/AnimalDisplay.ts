/**
 * AnimalDisplay.ts
 * Component for displaying rescued animals
 */

import type { AnimalType } from '../../types/index';

export class AnimalDisplay {
  private container: HTMLElement;
  private isInitialized = false;
  private animalAreas: Map<AnimalType, HTMLElement> = new Map();
  private animalEmojis: Record<AnimalType, string> = {
    cats: '🐱',
    dogs: '🐶',
    penguins: '🐧'
  };

  /**
   * Create a new AnimalDisplay
   * @param containerId ID of the container element
   */
  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }
    
    this.container = container;
  }

  /**
   * Initialize the animal display
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Create display areas for each animal type
      this.createAnimalAreas();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize animal display:', error);
      return false;
    }
  }

  /**
   * Create display areas for each animal type
   */
  private createAnimalAreas(): void {
    // Clear container
    this.container.innerHTML = '';
    
    // Create main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'animal-display-wrapper';
    
    // Create areas for each animal type
    const animalTypes: AnimalType[] = ['cats', 'dogs', 'penguins'];
    
    animalTypes.forEach(animalType => {
      const area = document.createElement('div');
      area.className = `animal-display-area ${animalType}-area`;
      
      const title = document.createElement('h3');
      title.textContent = `${this.capitalizeFirstLetter(animalType)} Rescued`;
      area.appendChild(title);
      
      const animalContainer = document.createElement('div');
      animalContainer.className = 'animals-container';
      area.appendChild(animalContainer);
      
      wrapper.appendChild(area);
      this.animalAreas.set(animalType, animalContainer);
    });
    
    this.container.appendChild(wrapper);
  }

  /**
   * Add an animal to the display
   * @param animalType Type of animal
   * @param count Current count (used for positioning)
   * @param animate Whether to animate the addition
   */
  public addAnimal(animalType: AnimalType, count: number, animate: boolean = false): void {
    const area = this.animalAreas.get(animalType);
    if (!area) return;
    
    // Create animal element
    const animal = document.createElement('div');
    animal.className = `animal ${animate ? 'animal-enter' : ''}`;
    animal.textContent = this.animalEmojis[animalType];
    animal.title = `${this.capitalizeFirstLetter(animalType)} #${count}`;
    
    // Add to area
    area.appendChild(animal);
    
    // Scroll to show new animal
    animal.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  /**
   * Celebrate a rescue milestone
   * @param animalType Type of animal
   */
  public celebrateRescue(animalType: AnimalType): void {
    // Create celebration overlay
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    
    const content = document.createElement('div');
    content.className = 'celebration-content';
    
    const animalElement = document.createElement('div');
    animalElement.className = 'celebration-animal';
    animalElement.textContent = this.animalEmojis[animalType];
    content.appendChild(animalElement);
    
    const text = document.createElement('div');
    text.className = 'celebration-text';
    text.textContent = `${this.capitalizeFirstLetter(animalType)} Rescued!`;
    content.appendChild(text);
    
    overlay.appendChild(content);
    this.container.appendChild(overlay);
    
    // Remove after animation completes
    setTimeout(() => {
      overlay.remove();
    }, 3000);
  }

  /**
   * Clear all animals from the display
   */
  public clearAnimals(): void {
    this.animalAreas.forEach(area => {
      area.innerHTML = '';
    });
  }

  /**
   * Set animals for a specific type
   * @param animalType Type of animal
   * @param count Number of animals to display
   */
  public setAnimals(animalType: AnimalType, count: number): void {
    const area = this.animalAreas.get(animalType);
    if (!area) return;
    
    // Clear area
    area.innerHTML = '';
    
    // Add animals
    for (let i = 0; i < count; i++) {
      this.addAnimal(animalType, i + 1, false);
    }
  }

  /**
   * Capitalize the first letter of a string
   * @param str String to capitalize
   * @returns Capitalized string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.container.innerHTML = '';
    this.animalAreas.clear();
    this.isInitialized = false;
  }
}