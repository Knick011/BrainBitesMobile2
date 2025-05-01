// src/screens/AppSelectorScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppLauncher from '../services/AppLauncher';
import TimerService from '../services/TimerService';

const AppSelectorScreen = ({ navigation }) => {
  const [apps, setApps] = useState([]);
  const [installedApps, setInstalledApps] = useState([]);
  const [availableTime, setAvailableTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  
  useEffect(() => {
    // Load available apps and check which are installed
    const loadApps = async () => {
      setLoading(true);
      
      // Check if there's an active session
      const currentSession = TimerService.getCurrentSession();
      if (currentSession) {
        setActiveSession(currentSession);
      }
      
      // Get available apps
      const appList = AppLauncher.getAppList();
      
      // Add some demo apps for testing
      const demoApps = [
        {
          id: 'demo_social',
          name: 'Social Media',
          icon: 'account-group',
          color: '#1877F2',
          isDemo: true
        },
        {
          id: 'demo_games',
          name: 'Games',
          icon: 'gamepad-variant',
          color: '#FF4500',
          isDemo: true
        },
        {
          id: 'demo_video',
          name: 'Video Apps',
          icon: 'video',
          color: '#FF0000',
          isDemo: true
        }
      ];
      
      setApps([...appList, ...demoApps]);
      
      // Check which apps are installed
      const installedAppIds = [];
      for (const app of appList) {
        const isInstalled = await AppLauncher.isAppInstalled(app.id);
        if (isInstalled) {
          installedAppIds.push(app.id);
        }
      }
      
      // All demo apps are "installed"
      for (const app of demoApps) {
        installedAppIds.push(app.id);
      }
      
      setInstalledApps(installedAppIds);
      setLoading(false);
    };
    
    // Get available time
    setAvailableTime(TimerService.getAvailableTime());
    
    // Set up timer event listener
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    loadApps();
    
    return () => {
      removeListener();
    };
  }, []);
  
  const handleTimerEvent = (event) => {
    if (event.event === 'timeUpdate' || event.event === 'creditsAdded') {
      setAvailableTime(TimerService.getAvailableTime());
    } else if (event.event === 'sessionStarted') {
      setActiveSession(TimerService.getCurrentSession());
    } else if (event.event === 'sessionEnded' || event.event === 'timeExpired') {
      setActiveSession(null);
    }
  };
  
  const handleSelectApp = async (app) => {
    // For real apps, check if installed
    if (!app.isDemo && !installedApps.includes(app.id)) {
      Alert.alert(
        'App Not Installed',
        `${app.name} is not installed on your device.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if we have enough time
    if (availableTime <= 0) {
      Alert.alert(
        'No Time Available',
        'You need to earn more time by answering questions first.',
        [
          { text: 'Go to Quiz', onPress: () => navigation.navigate('Quiz') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    // If there's an active session, ask if user wants to end it
    if (activeSession) {
      Alert.alert(
        'Active Session',
        `You already have an active session for ${activeSession.appId}. Would you like to end it and start a new one?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'End Current & Start New', 
            onPress: () => {
              TimerService.stopAppTimer();
              startAppSession(app);
            } 
          }
        ]
      );
      return;
    }
    
    startAppSession(app);
  };
  
  // Continuing src/screens/AppSelectorScreen.js

  const startAppSession = (app) => {
    // Start app timer
    const success = TimerService.startAppTimer(app.id);
    
    if (success) {
      if (!app.isDemo) {
        // Launch real app
        AppLauncher.launchApp(app.id);
      } else {
        // For demo apps, just show a message
        Alert.alert(
          'Session Started',
          `Your time for ${app.name} is now being tracked. This is a demo app, so we won't actually launch anything.`,
          [{ text: 'OK' }]
        );
      }
      
      // Set active session
      setActiveSession(TimerService.getCurrentSession());
    } else {
      Alert.alert(
        'Failed to Start Session',
        'There was an error starting your session. Please try again.'
      );
    }
  };
  
  const handleContinueSession = () => {
    if (!activeSession) return;
    
    // Find the app object
    const app = apps.find(a => a.id === activeSession.appId);
    if (!app) return;
    
    if (!app.isDemo) {
      // Launch real app
      AppLauncher.launchApp(app.id);
    } else {
      // For demo apps, just show a message
      Alert.alert(
        'Session Continued',
        `Continuing your session for ${app.name}. This is a demo app, so we won't actually launch anything.`,
        [{ text: 'OK' }]
      );
    }
  };
  
  const renderAppItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.appItem,
        (!item.isDemo && !installedApps.includes(item.id)) && styles.appNotInstalled,
        activeSession && activeSession.appId === item.id && styles.activeSessionApp
      ]}
      onPress={() => handleSelectApp(item)}
      disabled={!item.isDemo && !installedApps.includes(item.id)}
    >
      <View style={[styles.appIcon, { backgroundColor: item.color || '#FF9F1C' }]}>
        <Icon name={item.icon} size={32} color="white" />
      </View>
      <Text style={styles.appName}>{item.name}</Text>
      
      {/* Active session indicator */}
      {activeSession && activeSession.appId === item.id && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      )}
      
      {/* Not installed badge */}
      {!item.isDemo && !installedApps.includes(item.id) && (
        <View style={styles.notInstalledBadge}>
          <Text style={styles.notInstalledText}>Not Installed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Choose an App</Text>
        </View>
        
        <View style={styles.timeInfoBar}>
          <View style={styles.timeDisplay}>
            <Icon name="clock-outline" size={24} color="#FF9F1C" />
            <Text style={styles.timeText}>
              {TimerService.formatTime(availableTime)}
            </Text>
          </View>
          
          {activeSession && (
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinueSession}
            >
              <Text style={styles.continueButtonText}>Continue Session</Text>
              <Icon name="arrow-right" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9F1C" />
            <Text style={styles.loadingText}>Loading apps...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Available Apps</Text>
            
            <FlatList
              data={apps}
              keyExtractor={(item) => item.id}
              renderItem={renderAppItem}
              numColumns={2}
              contentContainerStyle={styles.appGrid}
              showsVerticalScrollIndicator={false}
            />
            
            {availableTime <= 0 && (
              <View style={styles.noTimeContainer}>
                <Text style={styles.noTimeText}>
                  You have no available time. Answer questions to earn more!
                </Text>
                <TouchableOpacity 
                  style={styles.earnMoreButton}
                  onPress={() => navigation.navigate('Quiz')}
                >
                  <Text style={styles.earnMoreButtonText}>Earn More Time</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  timeInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  continueButton: {
    backgroundColor: '#FF9F1C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  appGrid: {
    paddingBottom: 20,
  },
  appItem: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
    minHeight: 140,
  },
  appNotInstalled: {
    opacity: 0.6,
  },
  activeSessionApp: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF9F1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notInstalledBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  notInstalledText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noTimeContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  noTimeText: {
    color: '#856404',
    textAlign: 'center',
    marginBottom: 12,
  },
  earnMoreButton: {
    backgroundColor: '#FF9F1C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  earnMoreButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default AppSelectorScreen;