// src/services/SoundService.js
import { Platform } from 'react-native';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable playback in silence mode (iOS only)
Sound.setCategory('Playback');

class SoundService {
  constructor() {
    this.sounds = {};
    this.isSoundEnabled = true;
    this.volumeLevel = 0.7; // Default volume level
    this.isInitialized = false;
    
    // Load user preferences
    this.loadPreferences();
  }
  
  async loadPreferences() {
    try {
      const soundEnabled = await AsyncStorage.getItem('brainbites_sounds_enabled');
      if (soundEnabled !== null) {
        this.isSoundEnabled = soundEnabled === 'true';
      }
      
      const volume = await AsyncStorage.getItem('brainbites_sound_volume');
      if (volume !== null) {
        this.volumeLevel = parseFloat(volume);
      }
    } catch (error) {
      console.error('Error loading sound preferences:', error);
    }
  }
  
  async savePreferences() {
    try {
      await AsyncStorage.setItem('brainbites_sounds_enabled', String(this.isSoundEnabled));
      await AsyncStorage.setItem('brainbites_sound_volume', String(this.volumeLevel));
    } catch (error) {
      console.error('Error saving sound preferences:', error);
    }
  }
  
  preloadSounds() {
    if (this.isInitialized) return;
    
    try {
      // Define sounds to preload
      const soundsToLoad = {
        correct: 'correct.mp3',
        incorrect: 'incorrect.mp3',
        buttonPress: 'button_press.mp3',
        transition: 'transition.mp3',
        streak: 'streak.mp3',
        timeAdded: 'time_added.mp3',
        timeExpired: 'time_expired.mp3'
      };
      
      // Preload each sound
      Object.entries(soundsToLoad).forEach(([key, file]) => {
        const soundPath = Platform.OS === 'ios' 
          ? file
          : `${file}`; // For Android, just use the filename
        
        this.sounds[key] = new Sound(soundPath, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn(`Error loading sound: ${key}`, error);
          } else {
            // Set default volume
            this.sounds[key].setVolume(this.volumeLevel);
          }
        });
      });
      
      this.isInitialized = true;
      console.log('Sound effects initialized');
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }
  
  playSound(soundName) {
    if (!this.isSoundEnabled || !this.sounds[soundName]) return;
    
    try {
      // Reset to start (in case the sound was already played)
      this.sounds[soundName].stop();
      this.sounds[soundName].setCurrentTime(0);
      
      // Play the sound
      this.sounds[soundName].play((success) => {
        if (!success) {
          console.warn(`Sound playback failed: ${soundName}`);
        }
      });
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error);
    }
  }
  
  // Specific sound methods
  playCorrect() {
    this.playSound('correct');
  }
  
  playIncorrect() {
    this.playSound('incorrect');
  }
  
  playButtonPress() {
    this.playSound('buttonPress');
  }
  
  playTransition() {
    this.playSound('transition');
  }
  
  playStreak() {
    this.playSound('streak');
  }
  
  playTimeAdded() {
    this.playSound('timeAdded');
  }
  
  playTimeExpired() {
    this.playSound('timeExpired');
  }
  
  // Settings
  setEnabled(isEnabled) {
    this.isSoundEnabled = isEnabled;
    this.savePreferences();
  }
  
  setVolume(level) {
    this.volumeLevel = Math.max(0, Math.min(1, level));
    
    // Apply to all loaded sounds
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.setVolume) {
        sound.setVolume(this.volumeLevel);
      }
    });
    
    this.savePreferences();
  }
  
  // Clean up resources
  cleanup() {
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.release) {
        sound.release();
      }
    });
    
    this.sounds = {};
    this.isInitialized = false;
  }
}

export default new SoundService();