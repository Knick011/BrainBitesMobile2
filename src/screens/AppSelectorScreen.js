// src/screens/AppSelectorScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ImageBackground
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppLauncher from '../services/AppLauncher';
import TimerService from '../services/TimerService';
import SoundService from '../services/SoundService';
import MascotDisplay from '../components/mascot/MascotDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppSelectorScreen = ({ navigation }) => {
  // State
  const [apps, setApps] = useState([]);
  const [installedApps, setInstalledApps] = useState([]);
  const [availableTime, setAvailableTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [showMascot, setShowMascot] = useState(true);
  const [mascotMessage, setMascotMessage] = useState(null);
  const [sortedApps, setSortedApps] = useState([]);
  
  // Animation values
  const timeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Load apps on mount
  useEffect(() => {
    loadData();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      })
    ]).start();
    
    // Add timer event listener
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    return () => {
      removeListener();
    };
  }, []);
  
  // Animate time changes
  useEffect(() => {
    Animated.timing(timeAnim, {
      toValue: availableTime,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [availableTime]);
  
  // Load all necessary data
  const loadData = async () => {
    setLoading(true);
    
    try {
      // Check if there's an active session
      const currentSession = TimerService.getCurrentSession();
      if (currentSession) {
        setActiveSession(currentSession);
        setMascotMessage("You already have an active app session! Want to continue or start a new one?");
      } else {
        setMascotMessage("Choose an app to use your screen time. Remember to come back when you're done!");
      }
      
      // Get available time
      const time = TimerService.getAvailableTime();
      setAvailableTime(time);
      timeAnim.setValue(time);
      
      // Get available apps
      const appList = AppLauncher.getAppList();
      
      // Add demo apps for testing if needed
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
      
      // Sort apps by usage
      sortAppsByUsage([...appList, ...demoApps], installedAppIds);
      
      // Load mascot setting
      const mascotEnabled = await AsyncStorage.getItem('brainbites_show_mascot');
      if (mascotEnabled !== null) {
        setShowMascot(mascotEnabled === 'true');
      }
    } catch (error) {
      console.error('Error loading app data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Sort apps by usage
  const sortAppsByUsage = (appsList, installedIds) => {
    // Get app usage stats
    const appUsage = TimerService.getAppUsage();
    
    // Filter for installed apps and sort by usage (most used first)
    const sorted = appsList
      .filter(app => installedIds.includes(app.id))
      .sort((a, b) => {
        const usageA = appUsage[a.id] || 0;
        const usageB = appUsage[b.id] || 0;
        return usageB - usageA;
      });
    
    setSortedApps(sorted);
  };
  
  // Handle timer events
  const handleTimerEvent = (event) => {
    if (event.event === 'timeUpdate' || event.event === 'creditsAdded') {
      setAvailableTime(TimerService.getAvailableTime());
    } else if (event.event === 'sessionStarted') {
      setActiveSession(TimerService.getCurrentSession());
    } else if (event.event === 'sessionEnded' || event.event === 'timeExpired') {
      setActiveSession(null);
    }
  };
  
  // Handle app selection
  const handleSelectApp = async (app) => {
    SoundService.playButtonPress();
    
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
      SoundService.playTimeExpired();
      Alert.alert(
        'No Time Available',
        'You need to earn more time by answering questions first.',
        [
          { 
            text: 'Go to Quiz', 
            onPress: () => {
              SoundService.playButtonPress();
              navigation.navigate('Quiz');
            }
          },
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
              SoundService.playButtonPress();
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
  
  // Start a session for the selected app
  const startAppSession = (app) => {
    // Start app timer
    const success = TimerService.startAppTimer(app.id);
    
    if (success) {
      SoundService.playTransition();
      
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
  
  // Continue an existing session
  const handleContinueSession = () => {
    if (!activeSession) return;
    
    SoundService.playButtonPress();
    
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
  
  // Render app item
  const renderAppItem = ({ item }) => {
    const isNotInstalled = !item.isDemo && !installedApps.includes(item.id);
    const isActive = activeSession && activeSession.appId === item.id;
    
    // Get app usage in minutes (for display)
    const appUsage = TimerService.getAppUsage();
    const usageMinutes = Math.floor((appUsage[item.id] || 0) / 60);
    
    return (
      <TouchableOpacity
        style={[
          styles.appItem,
          isNotInstalled && styles.appNotInstalled,
          isActive && styles.activeSessionApp
        ]}
        onPress={() => handleSelectApp(item)}
        disabled={isNotInstalled}
      >
        <View style={[styles.appIcon, { backgroundColor: item.color || '#FF9F1C' }]}>
          <Icon name={item.icon} size={30} color="white" />
        </View>
        
        <View style={styles.appInfo}>
          <Text style={styles.appName}>{item.name}</Text>
          {usageMinutes > 0 && (
            <Text style={styles.appUsage}>Used: {usageMinutes} min</Text>
          )}
        </View>
        
        {/* Active session indicator */}
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
        
        {/* Not installed badge */}
        {isNotInstalled && (
          <View style={styles.notInstalledBadge}>
            <Text style={styles.notInstalledText}>Not Installed</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              SoundService.playButtonPress();
              navigation.goBack();
            }}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Choose an App</Text>
        </View>
        
        <View style={styles.timeInfoBar}>
          <View style={styles.timeDisplay}>
            <Icon name="clock-outline" size={24} color="#FF9F1C" />
            <Animated.Text style={styles.timeText}>
              {timeAnim.interpolate({
                inputRange: [0, availableTime],
                outputRange: [0, availableTime]
              }).interpolate(value => TimerService.formatTime(Math.round(value)))}
            </Animated.Text>
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
            
            {sortedApps.length > 0 ? (
              <FlatList
                data={sortedApps}
                keyExtractor={(item) => item.id}
                renderItem={renderAppItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.appList}
              />
            ) : (
              <View style={styles.noAppsContainer}>
                <Icon name="application-outline" size={64} color="#ccc" />
                <Text style={styles.noAppsText}>No apps available</Text>
                <Text style={styles.noAppsSubtext}>
                  We couldn't find any installed apps that are compatible with Brain Bites.
                </Text>
              </View>
            )}
            
            {availableTime <= 0 && (
              <View style={styles.noTimeContainer}>
                <Text style={styles.noTimeText}>
                  You have no available time. Answer questions to earn more!
                </Text>
                <TouchableOpacity 
                  style={styles.earnMoreButton}
                  onPress={() => {
                    SoundService.playButtonPress();
                    navigation.navigate('Quiz');
                  }}
                >
                  <Text style={styles.earnMoreButtonText}>Earn More Time</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </Animated.View>
      
      {/* Mascot display */}
      {showMascot && (
        <MascotDisplay
          type="happy"
          position="right"
          showMascot={showMascot}
          message={mascotMessage}
          autoHide={true}
          autoHideDuration={8000}
        />
      )}
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
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
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
  appList: {
    paddingBottom: 20,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  appNotInstalled: {
    opacity: 0.6,
  },
  activeSessionApp: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  appIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appUsage: {
    fontSize: 12,
    color: '#666',
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
  noAppsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAppsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noAppsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    maxWidth: '80%',
  },
  noTimeContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
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