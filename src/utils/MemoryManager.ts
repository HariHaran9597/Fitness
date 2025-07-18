/**
 * MemoryManager.ts
 * Utility for managing memory usage and cleanup
 */

// Disposable interface for objects that need cleanup
export interface Disposable {
  dispose(): void;
}

/**
 * MemoryManager class
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private disposables: Map<string, Disposable> = new Map();
  private gcInterval: number | null = null;
  private isEnabled = true;

  /**
   * Private constructor for singleton
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Register a disposable object
   * @param id Unique identifier for the object
   * @param disposable Disposable object
   */
  public register(id: string, disposable: Disposable): void {
    // Dispose existing object with same ID if it exists
    if (this.disposables.has(id)) {
      this.dispose(id);
    }
    
    // Register new disposable
    this.disposables.set(id, disposable);
    
    console.log(`Registered disposable: ${id}`);
  }

  /**
   * Dispose a specific object
   * @param id Object identifier
   */
  public dispose(id: string): void {
    const disposable = this.disposables.get(id);
    
    if (disposable) {
      try {
        disposable.dispose();
        console.log(`Disposed: ${id}`);
      } catch (error) {
        console.error(`Error disposing ${id}:`, error);
      }
      
      this.disposables.delete(id);
    }
  }

  /**
   * Dispose all objects
   */
  public disposeAll(): void {
    for (const [id, disposable] of this.disposables.entries()) {
      try {
        disposable.dispose();
        console.log(`Disposed: ${id}`);
      } catch (error) {
        console.error(`Error disposing ${id}:`, error);
      }
    }
    
    this.disposables.clear();
  }

  /**
   * Start automatic garbage collection
   * @param interval Interval in milliseconds
   */
  public startAutoGC(interval = 60000): void {
    // Stop existing interval if any
    this.stopAutoGC();
    
    // Start new interval
    this.gcInterval = window.setInterval(() => {
      this.runGC();
    }, interval);
    
    console.log(`Automatic GC started with interval: ${interval}ms`);
  }

  /**
   * Stop automatic garbage collection
   */
  public stopAutoGC(): void {
    if (this.gcInterval !== null) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
      
      console.log('Automatic GC stopped');
    }
  }

  /**
   * Run garbage collection
   */
  public runGC(): void {
    if (!this.isEnabled) return;
    
    console.log('Running manual GC...');
    
    // Force garbage collection if available
    if (window.gc) {
      try {
        window.gc();
        console.log('Forced GC completed');
      } catch (error) {
        console.warn('Failed to force GC:', error);
      }
    }
    
    // Clear any unused canvases
    this.clearUnusedCanvases();
    
    // Clear any unused textures
    this.clearUnusedTextures();
    
    // Clear any unused event listeners
    this.clearUnusedEventListeners();
    
    console.log('Manual GC completed');
  }

  /**
   * Clear unused canvases
   */
  private clearUnusedCanvases(): void {
    // Find all canvases that are not in the DOM
    const canvases = document.querySelectorAll('canvas');
    const canvasIds = new Set<string>();
    
    canvases.forEach(canvas => {
      if (canvas.id) {
        canvasIds.add(canvas.id);
      }
    });
    
    // Check for canvas disposables that are no longer in the DOM
    for (const [id, disposable] of this.disposables.entries()) {
      if (id.startsWith('canvas-') && !canvasIds.has(id.substring(7))) {
        this.dispose(id);
      }
    }
  }

  /**
   * Clear unused textures
   */
  private clearUnusedTextures(): void {
    // This would be implemented with specific WebGL texture handling
    // For now, we'll just log that it's being called
    console.log('Clearing unused textures');
  }

  /**
   * Clear unused event listeners
   */
  private clearUnusedEventListeners(): void {
    // This would be implemented with specific event listener tracking
    // For now, we'll just log that it's being called
    console.log('Clearing unused event listeners');
  }

  /**
   * Enable or disable memory management
   * @param enabled Whether memory management is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.stopAutoGC();
    }
  }

  /**
   * Get current memory usage
   */
  public getMemoryUsage(): { used: number; total: number; percentage: number } | null {
    if (performance && 'memory' in performance) {
      const memory = (performance as any).memory;
      
      if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
        const used = memory.usedJSHeapSize;
        const total = memory.jsHeapSizeLimit;
        const percentage = (used / total) * 100;
        
        return { used, total, percentage };
      }
    }
    
    return null;
  }

  /**
   * Log memory usage
   */
  public logMemoryUsage(): void {
    const usage = this.getMemoryUsage();
    
    if (usage) {
      console.log(`Memory usage: ${(usage.used / 1024 / 1024).toFixed(2)}MB / ${(usage.total / 1024 / 1024).toFixed(2)}MB (${usage.percentage.toFixed(2)}%)`);
    } else {
      console.log('Memory usage information not available');
    }
  }
}

// Get memory manager instance
export function getMemoryManager(): MemoryManager {
  return MemoryManager.getInstance();
}

// Register disposable object
export function registerDisposable(id: string, disposable: Disposable): void {
  const memoryManager = getMemoryManager();
  memoryManager.register(id, disposable);
}

// Dispose object
export function disposeObject(id: string): void {
  const memoryManager = getMemoryManager();
  memoryManager.dispose(id);
}

// Start automatic garbage collection
export function startAutoGC(interval = 60000): void {
  const memoryManager = getMemoryManager();
  memoryManager.startAutoGC(interval);
}

// Run garbage collection
export function runGC(): void {
  const memoryManager = getMemoryManager();
  memoryManager.runGC();
}

// Log memory usage
export function logMemoryUsage(): void {
  const memoryManager = getMemoryManager();
  memoryManager.logMemoryUsage();
}