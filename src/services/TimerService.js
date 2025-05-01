// src/services/TimerService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

class TimerService {
  constructor() {
    this.availableTime = 0; // in seconds
    this.activeApp = null;
    this.isAppRunning = false;
    this.timer = null;
    this.startTime = null;
    this.listeners = [];
    this.STORAGE_KEY = 'brainbites_timer_data';
    this.STATS_KEY = 'brainbites_timer_stats';
    this.appState = 'active';
    this.sessionStartTime = null;
    this.pausedTime = 0;
    this.pauseStartTime = null;
    this.appStateSubscription = null;
    
    // Stats tracking
    this.stats = {
      totalTimeEarned: 0,
      totalTimeUsed: 0,
      sessionHistory: [],
      appUsage: {}
    };
    
    // Load saved data on initialization
    this.loadSavedTime();
    
    // Listen for app state changes - using the new approach
    this.appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange);
  }
  
  // Handle app going to background/foreground
  _handleAppStateChange = (nextAppState) => {
    console.log(`App State Changed: ${this.appState} -> ${nextAppState}`);
    
    // If session is running and app goes to background
    if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      this._pauseSession();
    } 
    // If session is paused and app comes to foreground
    else if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      this._resumeSession();
    }
    
    this.appState = nextAppState;
  }
  
  // Load previously saved time from storage
  async loadSavedTime() {
    try {
      // Load timer data
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        this.availableTime = parsedData.availableTime || 0;
        
        // If there was an active session that wasn't properly ended
        if (parsedData.sessionStartTime && !parsedData.sessionEnded) {
          const elapsedTime = Math.floor((Date.now() - parsedData.sessionStartTime) / 1000);
          const adjustedTime = Math.max(0, this.availableTime - elapsedTime);
          
          // If more than 5 minutes elapsed, assume app was closed and deduct time
          if (elapsedTime > 300) {
            this.availableTime = adjustedTime;
            this.saveTimeData();
          }
        }
      }
      
      // Load stats data
      const statsData = await AsyncStorage.getItem(this.STATS_KEY);
      if (statsData) {
        this.stats = JSON.parse(statsData);
      }
      
      this._notifyListeners('timeLoaded', { availableTime: this.availableTime });
      console.log('Timer data loaded successfully');
    } catch (error) {
      console.error('Error loading saved time:', error);
    }
  }
  
  // Save current time state to storage
  async saveTimeData() {
    try {
      const data = {
        availableTime: this.availableTime,
        lastUpdated: new Date().toISOString(),
        sessionStartTime: this.sessionStartTime,
        sessionEnded: !this.isAppRunning,
        activeApp: this.activeApp
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving time data:', error);
    }
  }
  
  // Save stats to storage
  async saveStats() {
    try {
      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Error saving timer stats:', error);
    }
  }
  
  // Get time stats for display
  getTimeStats() {
    const { totalTimeEarned, totalTimeUsed } = this.stats;
    return {
      totalTimeEarned,
      totalTimeUsed,
      currentBalance: this.availableTime
    };
  }
  
  // Pause the session when app goes to background
  _pauseSession() {
    if (!this.isAppRunning) return;
    
    console.log('Pausing app session');
    this.pauseStartTime = Date.now();
    
    // Clear the timer but don't end session
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this._notifyListeners('sessionPaused', { 
      app: this.activeApp,
      elapsedBeforePause: Math.floor((Date.now() - this.sessionStartTime) / 1000) - this.pausedTime
    });
  }
  
  // Resume the session when app comes to foreground
  _resumeSession() {
    if (!this.isAppRunning || !this.pauseStartTime) return;
    
    console.log('Resuming app session');
    
    // Calculate paused duration and add to total paused time
    if (this.pauseStartTime) {
      this.pausedTime += Math.floor((Date.now() - this.pauseStartTime) / 1000);
      this.pauseStartTime = null;
    }
    
    // Restart the timer
    this.timer = setInterval(() => {
      this._updateRemainingTime();
    }, 1000);
    
    this._notifyListeners('sessionResumed', { app: this.activeApp });
  }
  
  // Start the timer for an app
  startAppTimer(appId) {
    if (this.availableTime <= 0) {
      this._notifyListeners('timeExpired');
      return false;
    }
    
    console.log(`Starting timer for app: ${appId}`);
    this.activeApp = appId;
    this.isAppRunning = true;
    this.sessionStartTime = Date.now();
    this.pausedTime = 0;
    this.pauseStartTime = null;
    
    // Clear any existing timer
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    // Start tracking time
    this.timer = setInterval(() => {
      this._updateRemainingTime();
    }, 1000);
    
    this._notifyListeners('sessionStarted', { 
      appId,
      availableTime: this.availableTime 
    });
    
    this.saveTimeData();
    return true;
  }
  
  // Stop the timer
  stopAppTimer() {
    if (!this.isAppRunning) return 0;
    
    console.log('Stopping app timer');
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Calculate time spent in this session
    let timeSpent = 0;
    if (this.sessionStartTime) {
      timeSpent = Math.floor((Date.now() - this.sessionStartTime) / 1000) - this.pausedTime;
      this.availableTime = Math.max(0, this.availableTime - timeSpent);
      
      // Update stats
      this.stats.totalTimeUsed += timeSpent;
      
      // Update app usage stats
      if (!this.stats.appUsage[this.activeApp]) {
        this.stats.appUsage[this.activeApp] = 0;
      }
      this.stats.appUsage[this.activeApp] += timeSpent;
      
      // Add to session history
      this.stats.sessionHistory.push({
        appId: this.activeApp,
        startTime: new Date(this.sessionStartTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: timeSpent
      });
      
      // Keep only last 50 sessions to prevent data growth
      if (this.stats.sessionHistory.length > 50) {
        this.stats.sessionHistory = this.stats.sessionHistory.slice(-50);
      }
      
      // Save updated stats
      this.saveStats();
    }
    
    this.isAppRunning = false;
    this.sessionStartTime = null;
    this.pausedTime = 0;
    this.pauseStartTime = null;
    
    this._notifyListeners('sessionEnded', { 
      appId: this.activeApp,
      timeSpent,
      remainingTime: this.availableTime
    });
    
    this.activeApp = null;
    this.saveTimeData();
    return timeSpent;
  }
  
  // Get current session info
  getCurrentSession() {
    if (!this.isAppRunning) return null;
    
    const rawElapsed = this.sessionStartTime ? 
      Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0;
    
    const elapsedTime = Math.max(0, rawElapsed - this.pausedTime);
    const remainingTime = Math.max(0, this.availableTime - elapsedTime);
    
    return {
      appId: this.activeApp,
      elapsedTime,
      remainingTime,
      startTime: this.sessionStartTime,
      isActive: this.appState === 'active' && !this.pauseStartTime
    };
  }
  
  // Update remaining time
  _updateRemainingTime() {
    if (!this.sessionStartTime || this.pauseStartTime) return;
    
    const rawElapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const elapsedTime = Math.max(0, rawElapsed - this.pausedTime);
    const remainingTime = Math.max(0, this.availableTime - elapsedTime);
    
    // Notify listeners of time update
    this._notifyListeners('timeUpdate', { 
      remaining: remainingTime,
      elapsed: elapsedTime,
      total: this.availableTime
    });
    
    // Check if time expired
    if (remainingTime <= 0) {
      this.stopAppTimer();
      this._notifyListeners('timeExpired');
    }
    
    // Save time periodically (every 30 seconds) to avoid too many writes
    if (elapsedTime % 30 === 0) {
      this.saveTimeData();
    }
  }
  
  // Add time credits (rewards for correct answers)
  addTimeCredits(seconds) {
    console.log(`Adding ${seconds} seconds of time credits`);
    this.availableTime += seconds;
    
    // Update stats
    this.stats.totalTimeEarned += seconds;
    this.saveStats();
    
    this.saveTimeData();
    this._notifyListeners('creditsAdded', { seconds, newTotal: this.availableTime });
    return this.availableTime;
  }
  
  // Get current available time
  getAvailableTime() {
    // If there's an active session, calculate real-time remaining
    if (this.isAppRunning && this.sessionStartTime) {
      const session = this.getCurrentSession();
      return session.remainingTime;
    }
    return this.availableTime;
  }
  
  // Format seconds to MM:SS or HH:MM:SS if > 60 minutes
  formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    } else {
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
  }
  
  // Get app usage data for stats
  getAppUsage() {
    return this.stats.appUsage;
  }
  
  // Reset statistics
  async resetStats() {
    this.stats = {
      totalTimeEarned: 0,
      totalTimeUsed: 0,
      sessionHistory: [],
      appUsage: {}
    };
    
    await this.saveStats();
    console.log('Timer stats reset');
  }
  
  // Add event listener
  addEventListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // Notify all listeners
  _notifyListeners(event, data = {}) {
    this.listeners.forEach(listener => {
      listener({ event, ...data });
    });
  }
  
  // Clean up
  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    // Remove the AppState event listener using new approach
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    // If session is active, save the state before cleanup
    if (this.isAppRunning) {
      this.stopAppTimer();
    }
    
    console.log('Timer service cleaned up');
  }
}

export default new TimerService();