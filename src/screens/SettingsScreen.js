// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimerService from '../services/TimerService';
import QuizService from '../services/QuizService';

const SettingsScreen = ({ navigation }) => {
  const [normalReward, setNormalReward] = useState(30); // Seconds for correct answer
  const [milestoneReward, setMilestoneReward] = useState(120); // Seconds for milestone
  const [showMascot, setShowMascot] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
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
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
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
              // Clear AsyncStorage
              await AsyncStorage.clear();
              
              // Reset services
              await QuizService.resetUsedQuestions();
              
              // Return to home
              navigation.navigate('Home');
              
              // Show success message
              setTimeout(() => {
                Alert.alert('Reset Complete', 'All data has been reset.');
              }, 500);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Failed to reset data. Please try again.');
    }
  };
  
  const handleRewardChange = (type, value) => {
    if (type === 'normal') {
      setNormalReward(value);
      AsyncStorage.setItem('brainbites_normal_reward', value.toString());
    } else {
      setMilestoneReward(value);
      AsyncStorage.setItem('brainbites_milestone_reward', value.toString());
    }
  };
  
  const handleToggleMascot = (value) => {
    setShowMascot(value);
    AsyncStorage.setItem('brainbites_show_mascot', value.toString());
  };
  
  const handleToggleSounds = (value) => {
    setSoundsEnabled(value);
    AsyncStorage.setItem('brainbites_sounds_enabled', value.toString());
  };
  
  const handleAddTestTime = () => {
    // Add 5 minutes (300 seconds) for testing
    TimerService.addTimeCredits(300);
    Alert.alert('Added 5 minutes of test time');
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Rewards</Text>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Correct Answer Reward</Text>
              <Text style={styles.settingDescription}>
                Time added for each correct answer
              </Text>
            </View>
            <View style={styles.rewardSelector}>
              <TouchableOpacity 
                style={styles.rewardButton}
                onPress={() => handleRewardChange('normal', 15)}
              >
                <Text style={normalReward === 15 ? styles.selectedReward : styles.rewardText}>15s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rewardButton}
                onPress={() => handleRewardChange('normal', 30)}
              >
                <Text style={normalReward === 30 ? styles.selectedReward : styles.rewardText}>30s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rewardButton}
                onPress={() => handleRewardChange('normal', 60)}
              >
                <Text style={normalReward === 60 ? styles.selectedReward : styles.rewardText}>1m</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Milestone Reward</Text>
              <Text style={styles.settingDescription}>
                Bonus time for streak milestones (every 5)
              </Text>
            </View>
            <View style={styles.rewardSelector}>
              <TouchableOpacity 
                style={styles.rewardButton}
                onPress={() => handleRewardChange('milestone', 60)}
              >
                <Text style={milestoneReward === 60 ? styles.selectedReward : styles.rewardText}>1m</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rewardButton}
                onPress={() => handleRewardChange('milestone', 120)}
              >
                <Text style={milestoneReward === 120 ? styles.selectedReward : styles.rewardText}>2m</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rewardButton}
                onPress={() => handleRewardChange('milestone', 300)}
              >
                <Text style={milestoneReward === 300 ? styles.selectedReward : styles.rewardText}>5m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Show Mascot</Text>
              <Text style={styles.settingDescription}>
                Display the helpful mascot character
              </Text>
            </View>
            <Switch
              value={showMascot}
              onValueChange={handleToggleMascot}
              trackColor={{ false: '#e0e0e0', true: '#FF9F1C' }}
              thumbColor={showMascot ? '#fff' : '#fff'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingDescription}>
                Play sounds for actions and events
              </Text>
            </View>
            <Switch
              value={soundsEnabled}
              onValueChange={handleToggleSounds}
              trackColor={{ false: '#e0e0e0', true: '#FF9F1C' }}
              thumbColor={soundsEnabled ? '#fff' : '#fff'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
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
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Brain Bites Mobile</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    maxWidth: 200,
  },
  rewardSelector: {
    flexDirection: 'row',
  },
  rewardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rewardText: {
    fontSize: 14,
    color: '#666',
  },
  selectedReward: {
    fontSize: 14,
    color: '#FF9F1C',
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default SettingsScreen;