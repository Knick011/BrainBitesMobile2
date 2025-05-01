// src/services/AppLauncher.js
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// App schemes for deep linking
const APP_SCHEMES = {
  tiktok: 'tiktok://',
  instagram: 'instagram://',
  facebook: 'fb://',
  twitter: 'twitter://',
  youtube: 'youtube://',
  snapchat: 'snapchat://',
  pinterest: 'pinterest://',
  reddit: 'reddit://',
  whatsapp: 'whatsapp://',
  spotify: 'spotify://',
  netflix: 'netflix://',
  amazon: 'amazon://',
  tinder: 'tinder://',
  // Add more apps as needed
};

// Store URL fallbacks (if app not installed)
const STORE_URLS = {
  tiktok: {
    ios: 'https://apps.apple.com/app/id835599320',
    android: 'https://play.google.com/store/apps/details?id=com.zhiliaoapp.musically'
  },
  instagram: {
    ios: 'https://apps.apple.com/app/id389801252',
    android: 'https://play.google.com/store/apps/details?id=com.instagram.android'
  },
  facebook: {
    ios: 'https://apps.apple.com/app/id284882215',
    android: 'https://play.google.com/store/apps/details?id=com.facebook.katana'
  },
  twitter: {
    ios: 'https://apps.apple.com/app/id333903271',
    android: 'https://play.google.com/store/apps/details?id=com.twitter.android'
  },
  youtube: {
    ios: 'https://apps.apple.com/app/id544007664',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.youtube'
  },
  snapchat: {
    ios: 'https://apps.apple.com/app/id447188370',
    android: 'https://play.google.com/store/apps/details?id=com.snapchat.android'
  },
  // Add more store URLs as needed
};

// App display info
const APP_INFO = {
  tiktok: {
    name: 'TikTok',
    icon: 'video',
    color: '#000000',
    backgroundColor: '#ffffff',
    category: 'social'
  },
  instagram: {
    name: 'Instagram',
    icon: 'instagram',
    color: '#E1306C',
    backgroundColor: '#ffffff',
    category: 'social'
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    backgroundColor: '#ffffff',
    category: 'social'
  },
  twitter: {
    name: 'Twitter',
    icon: 'twitter',
    color: '#1DA1F2',
    backgroundColor: '#ffffff',
    category: 'social'
  },
  youtube: {
    name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    backgroundColor: '#ffffff',
    category: 'video'
  },
  snapchat: {
    name: 'Snapchat',
    icon: 'snapchat',
    color: '#FFFC00',
    backgroundColor: '#ffffff',
    category: 'social'
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'pinterest',
    color: '#E60023',
    backgroundColor: '#ffffff',
    category: 'social'
  },
  reddit: {
    name: 'Reddit',
    icon: 'reddit',
    color: '#FF4500',
    backgroundColor: '#ffffff',
    category: 'social'
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: 'whatsapp',
    color: '#25D366',
    backgroundColor: '#ffffff',
    category: 'messaging'
  },
  spotify: {
    name: 'Spotify',
    icon: 'spotify',
    color: '#1DB954',
    backgroundColor: '#ffffff',
    category: 'music'
  },
  netflix: {
    name: 'Netflix',
    icon: 'netflix',
    color: '#E50914',
    backgroundColor: '#ffffff',
    category: 'video'
  },
  // Add more apps as needed
};

class AppLauncher {
  constructor() {
    this.activeApp = null;
    this.listeners = [];
    this.recentlyUsed = [];
    this.STORAGE_KEY = 'brainbites_app_launcher';
    
    // Load saved data
    this.loadSavedData();
  }
  
  // Load saved data from storage
  async loadSavedData() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        this.recentlyUsed = parsedData.recentlyUsed || [];
      }
    } catch (error) {
      console.error('Error loading app launcher data:', error);
    }
  }
  
  // Save data to storage
  async saveData() {
    try {
      const data = {
        recentlyUsed: this.recentlyUsed,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving app launcher data:', error);
    }
  }
  
  // Get list of popular apps
  getAppList() {
    return Object.keys(APP_SCHEMES).map(appId => ({
      id: appId,
      ...APP_INFO[appId]
    }));
  }
  
  // Get recently used apps
  getRecentlyUsedApps(limit = 5) {
    const appList = this.getAppList();
    
    return this.recentlyUsed
      .slice(0, limit)
      .map(appId => appList.find(app => app.id === appId))
      .filter(app => app !== undefined); // Filter out any undefined apps
  }
  
  // Get apps by category
  getAppsByCategory(category) {
    return this.getAppList().filter(app => app.category === category);
  }
  
  // Check if an app is installed
  async isAppInstalled(appId) {
    const scheme = APP_SCHEMES[appId];
    if (!scheme) return false;
    
    try {
      const canOpen = await Linking.canOpenURL(scheme);
      return canOpen;
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
      
      if (canOpen) {
        // Add to recently used
        this._addToRecentlyUsed(appId);
        
        // Set as active app
        this.activeApp = appId;
        
        // Launch the app
        await Linking.openURL(scheme);
        
        // Notify listeners
        this._notifyListeners('appLaunched', { appId });
        
        return true;
      } else {
        // App not installed, try to open store page
        this._openAppStore(appId);
        return false;
      }
    } catch (error) {
      console.error(`Error launching app ${appId}:`, error);
      return false;
    }
  }
  
  // Open app store page for an app
  _openAppStore(appId) {
    const storeInfo = STORE_URLS[appId];
    if (!storeInfo) return false;
    
    const url = Platform.OS === 'ios' ? storeInfo.ios : storeInfo.android;
    
    try {
      Linking.openURL(url);
      return true;
    } catch (error) {
      console.error(`Error opening store for ${appId}:`, error);
      return false;
    }
  }
  
  // Add app to recently used list
  _addToRecentlyUsed(appId) {
    // Remove if already in the list
    this.recentlyUsed = this.recentlyUsed.filter(id => id !== appId);
    
    // Add to the beginning
    this.recentlyUsed.unshift(appId);
    
    // Keep the list at a reasonable size
    if (this.recentlyUsed.length > 10) {
      this.recentlyUsed = this.recentlyUsed.slice(0, 10);
    }
    
    // Save the updated list
    this.saveData();
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