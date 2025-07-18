/**
 * Helper utility functions for the AI Fitness Game
 */

/**
 * Generate a unique ID
 * @returns A unique string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Format a number with leading zeros
 * @param num The number to format
 * @param places Number of digits to ensure
 * @returns Formatted string with leading zeros
 */
export function padNumber(num: number, places: number): string {
  return String(num).padStart(places, '0');
}

/**
 * Format a timestamp as a readable duration (mm:ss)
 * @param milliseconds Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${padNumber(minutes, 2)}:${padNumber(seconds, 2)}`;
}

/**
 * Debounce a function to limit how often it can be called
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait);
  };
}

/**
 * Safely store data in localStorage with error handling
 * @param key Storage key
 * @param data Data to store
 * @returns Success status
 */
export function safeLocalStorageSave(key: string, data: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Safely retrieve data from localStorage with error handling
 * @param key Storage key
 * @param defaultValue Default value if retrieval fails
 * @returns Retrieved data or default value
 */
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to retrieve from localStorage:', error);
    return defaultValue;
  }
}