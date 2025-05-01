// src/services/AppLauncher.js
import { Linking } from 'react-native';
import TimerService from './TimerService';

// App schemes for deep linking
const APP_SCHEMES = {
  tiktok: 'tiktok://',
  instagram: 'instagram://',
  facebook: 'fb://',
  twitter: 'twitter://',
  youtube: 'youtube://',
  snapchat: 'snapchat://',
  // Add more apps as needed
};

// App display info
const APP_INFO = {
  tiktok: {
    name: 'TikTok',
    icon: 'video',
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  instagram: {
    name: 'Instagram',
    icon: 'instagram',
    color: '#E1306C',
    backgroundColor: '#ffffff',
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    backgroundColor: '#ffffff',
  },
  twitter: {
    name: 'Twitter',
    icon: 'twitter',
    color: '#1DA1F2',
    backgroundColor: '#ffffff',
  },
  youtube: {
    name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    backgroundColor: '#ffffff',
  },
  snapchat: {
    name: 'Snapchat',
    icon: 'snapchat',
    color: '#FFFC00',
    backgroundColor: '#ffffff',
  },
  // Add more apps as needed
};

class AppLauncher {
  constructor() {
    this.activeApp = null;
    this.listeners = [];
  }
  
  // Get list of popular apps
  getAppList() {
    return Object.keys(APP_SCHEMES).map(appId => ({
      id: appId,
      ...APP_INFO[appId]
    }));
  }
  
  // Check if an app is installed
  async isAppInstalled(appId) {
    const scheme = APP_SCHEMES[appId];
    if (!scheme) return false;
    
    try {
      return await Linking.canOpenURL(scheme);
    } catch (error) {
      console.error(`Error checking if ${appId} is installed:`, error);
      return false;
    }
  }
  
  // Launch an app
  async launchApp(appId) {
    const scheme = APP_SCHEMES[appId];
    if (!scheme) {
      console.error(`No scheme found for app: ${appId}`);
      return false;
    }
    
    try {
      // Check if app is installed
      const canOpen = await Linking.canOpenURL(scheme);
      if (!canOpen) {
        console.error(`App not installed: ${appId}`);
        return false;
      }
      
      // Check if we have enough time
      const availableTime = TimerService.getAvailableTime();
      if (availableTime <= 0) {
        console.error('No time available');
        return false;
      }
      
      // Start timer
      TimerService.startAppTimer(appId);
      
      // Set as active app
      this.activeApp = appId;
      
      // Launch the app
      await Linking.openURL(scheme);
      
      // Notify listeners
      this._notifyListeners('appLaunched', { appId });
      
      return true;
    } catch (error) {
      console.error(`Error launching app ${appId}:`, error);
      return false;
    }
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
}

export default new AppLauncher();