// src/screens/SettingsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  SafeAreaView, 
  Alert,
  Linking,
  Animated,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimerService from '../services/TimerService';
import QuizService from '../services/QuizService';
import SoundService from '../services/SoundService';

// For a real app, import the version from package.json
const version = "1.0.0";

const SettingsScreen = ({ navigation }) => {
  // Settings state
  const [normalReward, setNormalReward] = useState(30); // Seconds for correct answer
  const [milestoneReward, setMilestoneReward] = useState(120); // Seconds for milestone
  const [showMascot, setShowMascot] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [quizLength, setQuizLength] = useState(5);
  const [darkMode, setDarkMode] = useState(false);
  
  // Animation value
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  // Load settings on mount
  useEffect(() => {
    loadSettings();
    
    // Run bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);
  
  // Load all settings
  const loadSettings = async () => {
    try {
      // Load mascot setting
      const mascotEnabled = await AsyncStorage.getItem('brainbites_show_mascot');
      if (mascotEnabled !== null) {
        setShowMascot(mascotEnabled === 'true');
      }
      
      // Load sounds setting
      const sounds = await AsyncStorage.getItem('brainbites_sounds_enabled');
      if (sounds !== null) {
        setSoundsEnabled(sounds === 'true');
        SoundService.setEnabled(sounds === 'true');
      }
      
      // Load reward settings
      const nReward = await AsyncStorage.getItem('brainbites_normal_reward');
      if (nReward !== null) {
        setNormalReward(parseInt(nReward, 10));
      }
      
      const mReward = await AsyncStorage.getItem('brainbites_milestone_reward');
      if (mReward !== null) {
        setMilestoneReward(parseInt(mReward, 10));
      }
      
      // Load quiz length
      const qLength = await AsyncStorage.getItem('brainbites_quiz_length');
      if (qLength !== null) {
        setQuizLength(parseInt(qLength, 10));
      }
      
      // Load theme
      const theme = await AsyncStorage.getItem('brainbites_dark_mode');
      if (theme !== null) {
        setDarkMode(theme === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  // Handle data reset
  const handleClearProgress = async () => {
    try {
      // Display confirmation dialog
      Alert.alert(
        'Reset All Progress',
        'This will reset all your progress, time credits, and question history. This cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: async () => {
              try {
                // Play sound
                SoundService.playButtonPress();
                
                // Reset timer stats
                await TimerService.resetStats();
                
                // Reset quiz stats and history
                await QuizService.resetStats();
                await QuizService.resetUsedQuestions();
                
                // Update UI
                Alert.alert('Reset Complete', 'All progress has been reset.');
              } catch (error) {
                console.error('Error during reset:', error);
                Alert.alert('Error', 'Failed to reset data. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to reset data. Please try again.');
    }
  };
  
  // Handle reward setting changes
  const handleRewardChange = (type, value) => {
    SoundService.playButtonPress();
    
    if (type === 'normal') {
      setNormalReward(value);
      AsyncStorage.setItem('brainbites_normal_reward', value.toString());
    } else {
      setMilestoneReward(value);
      AsyncStorage.setItem('brainbites_milestone_reward', value.toString());
    }
  };
  
  // Handle quiz length change
  const handleQuizLengthChange = (value) => {
    SoundService.playButtonPress();
    setQuizLength(value);
    AsyncStorage.setItem('brainbites_quiz_length', value.toString());
  };
  
  // Handle toggle switches
  const handleToggleMascot = (value) => {
    SoundService.playButtonPress();
    setShowMascot(value);
    AsyncStorage.setItem('brainbites_show_mascot', value.toString());
  };
  
  const handleToggleSounds = (value) => {
    // Don't play sound for this toggle specifically
    setSoundsEnabled(value);
    AsyncStorage.setItem('brainbites_sounds_enabled', value.toString());
    SoundService.setEnabled(value);
  };
  
  const handleToggleDarkMode = (value) => {
    SoundService.playButtonPress();
    setDarkMode(value);
    AsyncStorage.setItem('brainbites_dark_mode', value.toString());
    // In a real app, we'd apply the theme change here
  };
  
  // Handle add test time
  const handleAddTestTime = () => {
    SoundService.playButtonPress();
    
    // Add 5 minutes (300 seconds) for testing
    TimerService.addTimeCredits(300);
    Alert.alert('Test Time Added', 'Added 5 minutes of test time');
  };
  
  // Handle feedback/support
  const handleSendFeedback = () => {
    SoundService.playButtonPress();
    
    const emailSubject = 'Brain Bites Feedback';
    const emailBody = `\n\n\n\n--\nApp Version: ${version}\nPlatform: ${Platform.OS} ${Platform.Version}`;
    const emailUrl = `mailto:support@brainbites.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    Linking.canOpenURL(emailUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert('Email Not Supported', 'Your device does not support sending emails.');
        }
      })
      .catch(error => {
        console.error('Error opening email client:', error);
      });
  };
  
  // Handle privacy policy
  const handlePrivacyPolicy = () => {
    SoundService.playButtonPress();
    Linking.openURL('https://www.brainbites.com/privacy');
  };
  
  // Handle terms of service
  const handleTermsOfService = () => {
    SoundService.playButtonPress();
    Linking.openURL('https://www.brainbites.com/terms');
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.darkSafeArea]}>
      <ScrollView style={[styles.container, darkMode && styles.darkContainer]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, darkMode && styles.darkBackButton]}
            onPress={() => {
              SoundService.playButtonPress();
              navigation.goBack();
            }}
          >
            <Icon name="arrow-left" size={24} color={darkMode ? "#FFF" : "#333"} />
          </TouchableOpacity>
          <Text style={[styles.title, darkMode && styles.darkTitle]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Time Rewards Section */}
        <View style={[styles.section, darkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Time Rewards</Text>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={[styles.settingLabel, darkMode && styles.darkSettingLabel]}>Correct Answer</Text>
              <Text style={[styles.settingDescription, darkMode && styles.darkSettingDescription]}>
                Time added for each correct answer
              </Text>
            </View>
            <View style={styles.rewardSelector}>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  normalReward === 15 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  normalReward === 15 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleRewardChange('normal', 15)}
              >
                <Text style={normalReward === 15 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>15s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  normalReward === 30 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  normalReward === 30 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleRewardChange('normal', 30)}
              >
                <Text style={normalReward === 30 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>30s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  normalReward === 60 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  normalReward === 60 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleRewardChange('normal', 60)}
              >
                <Text style={normalReward === 60 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>1m</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={[styles.settingLabel, darkMode && styles.darkSettingLabel]}>Milestone Reward</Text>
              <Text style={[styles.settingDescription, darkMode && styles.darkSettingDescription]}>
                Bonus time for streak milestones (every 5)
              </Text>
            </View>
            <View style={styles.rewardSelector}>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  milestoneReward === 60 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  milestoneReward === 60 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleRewardChange('milestone', 60)}
              >
                <Text style={milestoneReward === 60 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>1m</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  milestoneReward === 120 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  milestoneReward === 120 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleRewardChange('milestone', 120)}
              >
                <Text style={milestoneReward === 120 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>2m</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  milestoneReward === 300 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  milestoneReward === 300 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleRewardChange('milestone', 300)}
              >
                <Text style={milestoneReward === 300 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>5m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Quiz Settings Section */}
        <View style={[styles.section, darkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Quiz Settings</Text>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={[styles.settingLabel, darkMode && styles.darkSettingLabel]}>Questions Per Quiz</Text>
              <Text style={[styles.settingDescription, darkMode && styles.darkSettingDescription]}>
                Number of questions per quiz session
              </Text>
            </View>
            <View style={styles.rewardSelector}>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  quizLength === 3 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  quizLength === 3 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleQuizLengthChange(3)}
              >
                <Text style={quizLength === 3 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  quizLength === 5 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  quizLength === 5 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleQuizLengthChange(5)}
              >
                <Text style={quizLength === 5 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.rewardButton,
                  quizLength === 10 && styles.selectedRewardButton,
                  darkMode && styles.darkRewardButton,
                  quizLength === 10 && darkMode && styles.darkSelectedRewardButton
                ]}
                onPress={() => handleQuizLengthChange(10)}
              >
                <Text style={quizLength === 10 ? 
                  (darkMode ? styles.darkSelectedReward : styles.selectedReward) : 
                  (darkMode ? styles.darkRewardText : styles.rewardText)}>10</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* App Preferences Section */}
        <View style={[styles.section, darkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>App Preferences</Text>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={[styles.settingLabel, darkMode && styles.darkSettingLabel]}>Show Mascot</Text>
              <Text style={[styles.settingDescription, darkMode && styles.darkSettingDescription]}>
                Display the helpful mascot character
              </Text>
            </View>
            <Switch
              value={showMascot}
              onValueChange={handleToggleMascot}
              trackColor={{ false: '#e0e0e0', true: '#FF9F1C' }}
              thumbColor={'#fff'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={[styles.settingLabel, darkMode && styles.darkSettingLabel]}>Sound Effects</Text>
              <Text style={[styles.settingDescription, darkMode && styles.darkSettingDescription]}>
                Play sounds for actions and events
              </Text>
            </View>
            <Switch
              value={soundsEnabled}
              onValueChange={handleToggleSounds}
              trackColor={{ false: '#e0e0e0', true: '#FF9F1C' }}
              thumbColor={'#fff'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={[styles.settingLabel, darkMode && styles.darkSettingLabel]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, darkMode && styles.darkSettingDescription]}>
                Use dark color scheme
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: '#e0e0e0', true: '#FF9F1C' }}
              thumbColor={'#fff'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>
        </View>
        
        {/* Support Section */}
        <View style={[styles.section, darkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Support</Text>
          
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={handleSendFeedback}
          >
            <Icon name="email-outline" size={20} color="#333" />
            <Text style={styles.supportButtonText}>Send Feedback</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={handlePrivacyPolicy}
          >
            <Icon name="shield-outline" size={20} color="#333" />
            <Text style={styles.supportButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={handleTermsOfService}
          >
            <Icon name="file-document-outline" size={20} color="#333" />
            <Text style={styles.supportButtonText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
        
        {/* Data Management Section */}
        <View style={[styles.section, darkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Data Management</Text>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleClearProgress}
          >
            <Icon name="delete-outline" size={20} color="white" />
            <Text style={styles.dangerButtonText}>Reset All Progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleAddTestTime}
          >
            <Icon name="clock-plus-outline" size={20} color="white" />
            <Text style={styles.testButtonText}>Add Test Time (5 min)</Text>
          </TouchableOpacity>
        </View>
        
        {/* App info */}
        <View style={styles.footer}>
          <Animated.View
            style={[
              styles.logoContainer,
              { 
                transform: [{ 
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5]
                  }) 
                }]
              }
            ]}
          >
            <Icon name="brain" size={40} color="#FF9F1C" />
          </Animated.View>
          <Text style={[styles.footerText, darkMode && styles.darkFooterText]}>Brain Bites</Text>
          <Text style={[styles.versionText, darkMode && styles.darkVersionText]}>Version {version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  darkSafeArea: {
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkBackButton: {
    backgroundColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  darkTitle: {
    color: '#FFF',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkSection: {
    backgroundColor: '#222',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  darkSectionTitle: {
    color: '#FFF',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  darkSettingLabel: {
    color: '#FFF',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    maxWidth: 200,
  },
  darkSettingDescription: {
    color: '#AAA',
  },
  rewardSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkRewardButton: {
    backgroundColor: '#333',
  },
  selectedRewardButton: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FF9F1C',
  },
  darkSelectedRewardButton: {
    backgroundColor: '#4F3200',
    borderColor: '#FF9F1C',
  },
  rewardText: {
    fontSize: 14,
    color: '#666',
  },
  darkRewardText: {
    color: '#CCC',
  },
  selectedReward: {
    fontSize: 14,
    color: '#FF9F1C',
    fontWeight: 'bold',
  },
  darkSelectedReward: {
    color: '#FF9F1C',
    fontWeight: 'bold',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  supportButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  dangerButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  dangerButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  testButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  darkFooterText: {
    color: '#FFF',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  darkVersionText: {
    color: '#AAA',
  },
});

export default SettingsScreen;