/**
 * AudioManager.ts
 * Utility for managing audio playback and sound effects
 */

import { safeLocalStorageGet, safeLocalStorageSave } from './helpers';
import { STORAGE_KEYS } from './constants';
import { Disposable } from './MemoryManager';

// Sound effect types
export enum SoundEffectType {
  REP_COMPLETE = 'rep_complete',
  MILESTONE = 'milestone',
  ANIMAL_RESCUE = 'animal_rescue',
  ERROR = 'error',
  SUCCESS = 'success',
  BUTTON_CLICK = 'button_click',
  COUNTDOWN = 'countdown',
  ENCOURAGEMENT = 'encouragement'
}

// Audio settings interface
interface AudioSettings {
  enabled: boolean;
  volume: number;
  effectsEnabled: boolean;
  effectsVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
}

/**
 * AudioManager class
 */
export class AudioManager implements Disposable {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private soundEffects: Map<SoundEffectType, AudioBuffer> = new Map();
  private musicTracks: Map<string, { buffer: AudioBuffer; source: AudioBufferSourceNode | null }> = new Map();
  private currentMusicTrack: string | null = null;
  private settings: AudioSettings;
  private isInitialized = false;
  private isMuted = false;

  /**
   * Private constructor for singleton
   */
  private constructor() {
    // Default audio settings
    this.settings = {
      enabled: true,
      volume: 0.7,
      effectsEnabled: true,
      effectsVolume: 0.8,
      musicEnabled: true,
      musicVolume: 0.5
    };

    // Try to load saved audio settings
    const savedSettings = safeLocalStorageGet<AudioSettings | null>(
      STORAGE_KEYS.SETTINGS + '-audio',
      null
    );
    
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize audio manager
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load sound effects
      await this.loadSoundEffects();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio manager:', error);
      return false;
    }
  }

  /**
   * Load sound effects
   */
  private async loadSoundEffects(): Promise<void> {
    // Define sound effect URLs
    const soundEffectUrls: Record<SoundEffectType, string> = {
      [SoundEffectType.REP_COMPLETE]: '/sounds/rep_complete.mp3',
      [SoundEffectType.MILESTONE]: '/sounds/milestone.mp3',
      [SoundEffectType.ANIMAL_RESCUE]: '/sounds/animal_rescue.mp3',
      [SoundEffectType.ERROR]: '/sounds/error.mp3',
      [SoundEffectType.SUCCESS]: '/sounds/success.mp3',
      [SoundEffectType.BUTTON_CLICK]: '/sounds/button_click.mp3',
      [SoundEffectType.COUNTDOWN]: '/sounds/countdown.mp3',
      [SoundEffectType.ENCOURAGEMENT]: '/sounds/encouragement.mp3'
    };
    
    // Load each sound effect
    for (const [type, url] of Object.entries(soundEffectUrls)) {
      try {
        const buffer = await this.loadAudioFile(url);
        this.soundEffects.set(type as SoundEffectType, buffer);
      } catch (error) {
        console.warn(`Failed to load sound effect ${type}:`, error);
      }
    }
  }

  /**
   * Load audio file
   * @param url Audio file URL
   */
  private async loadAudioFile(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }
    
    // Fetch audio file
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode audio data
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Play sound effect
   * @param type Sound effect type
   * @param volume Optional volume override
   */
  public playSoundEffect(type: SoundEffectType, volume?: number): void {
    if (!this.isInitialized || !this.audioContext || !this.settings.enabled || !this.settings.effectsEnabled || this.isMuted) {
      return;
    }
    
    // Get sound effect buffer
    const buffer = this.soundEffects.get(type);
    
    if (!buffer) {
      console.warn(`Sound effect ${type} not found`);
      return;
    }
    
    // Create source node
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume !== undefined ? volume : this.settings.effectsVolume;
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Play sound
    source.start();
  }

  /**
   * Load music track
   * @param id Track identifier
   * @param url Track URL
   */
  public async loadMusicTrack(id: string, url: string): Promise<boolean> {
    if (!this.isInitialized || !this.audioContext) {
      return false;
    }
    
    try {
      // Load audio file
      const buffer = await this.loadAudioFile(url);
      
      // Store track
      this.musicTracks.set(id, { buffer, source: null });
      
      return true;
    } catch (error) {
      console.error(`Failed to load music track ${id}:`, error);
      return false;
    }
  }

  /**
   * Play music track
   * @param id Track identifier
   * @param loop Whether to loop the track
   * @param volume Optional volume override
   */
  public playMusicTrack(id: string, loop = true, volume?: number): void {
    if (!this.isInitialized || !this.audioContext || !this.settings.enabled || !this.settings.musicEnabled || this.isMuted) {
      return;
    }
    
    // Stop current track if playing
    this.stopMusic();
    
    // Get track
    const track = this.musicTracks.get(id);
    
    if (!track || !track.buffer) {
      console.warn(`Music track ${id} not found`);
      return;
    }
    
    // Create source node
    const source = this.audioContext.createBufferSource();
    source.buffer = track.buffer;
    source.loop = loop;
    
    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume !== undefined ? volume : this.settings.musicVolume;
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Play music
    source.start();
    
    // Update track source
    track.source = source;
    this.currentMusicTrack = id;
  }

  /**
   * Stop music
   */
  public stopMusic(): void {
    if (!this.currentMusicTrack) {
      return;
    }
    
    // Get current track
    const track = this.musicTracks.get(this.currentMusicTrack);
    
    if (track && track.source) {
      // Stop source
      track.source.stop();
      track.source = null;
    }
    
    this.currentMusicTrack = null;
  }

  /**
   * Set master volume
   * @param volume Volume level (0-1)
   */
  public setVolume(volume: number): void {
    // Clamp volume to 0-1
    volume = Math.max(0, Math.min(1, volume));
    
    // Update settings
    this.settings.volume = volume;
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Set effects volume
   * @param volume Volume level (0-1)
   */
  public setEffectsVolume(volume: number): void {
    // Clamp volume to 0-1
    volume = Math.max(0, Math.min(1, volume));
    
    // Update settings
    this.settings.effectsVolume = volume;
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Set music volume
   * @param volume Volume level (0-1)
   */
  public setMusicVolume(volume: number): void {
    // Clamp volume to 0-1
    volume = Math.max(0, Math.min(1, volume));
    
    // Update settings
    this.settings.musicVolume = volume;
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Enable or disable all audio
   * @param enabled Whether audio is enabled
   */
  public setEnabled(enabled: boolean): void {
    // Update settings
    this.settings.enabled = enabled;
    
    // Stop music if disabled
    if (!enabled) {
      this.stopMusic();
    }
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Enable or disable sound effects
   * @param enabled Whether sound effects are enabled
   */
  public setEffectsEnabled(enabled: boolean): void {
    // Update settings
    this.settings.effectsEnabled = enabled;
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Enable or disable music
   * @param enabled Whether music is enabled
   */
  public setMusicEnabled(enabled: boolean): void {
    // Update settings
    this.settings.musicEnabled = enabled;
    
    // Stop music if disabled
    if (!enabled) {
      this.stopMusic();
    }
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Mute or unmute all audio
   * @param muted Whether audio is muted
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    
    // Stop music if muted
    if (muted) {
      this.stopMusic();
    }
  }

  /**
   * Save audio settings
   */
  private saveSettings(): void {
    safeLocalStorageSave(STORAGE_KEYS.SETTINGS + '-audio', this.settings);
  }

  /**
   * Get audio settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Resume audio context
   */
  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Dispose audio manager
   */
  public dispose(): void {
    // Stop music
    this.stopMusic();
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clear sound effects and music tracks
    this.soundEffects.clear();
    this.musicTracks.clear();
    
    this.isInitialized = false;
  }
}

// Get audio manager instance
export function getAudioManager(): AudioManager {
  return AudioManager.getInstance();
}

// Initialize audio manager
export async function initializeAudioManager(): Promise<boolean> {
  const audioManager = getAudioManager();
  return audioManager.initialize();
}

// Play sound effect
export function playSoundEffect(type: SoundEffectType, volume?: number): void {
  const audioManager = getAudioManager();
  audioManager.playSoundEffect(type, volume);
}

// Play music track
export function playMusicTrack(id: string, loop = true, volume?: number): void {
  const audioManager = getAudioManager();
  audioManager.playMusicTrack(id, loop, volume);
}

// Stop music
export function stopMusic(): void {
  const audioManager = getAudioManager();
  audioManager.stopMusic();
}