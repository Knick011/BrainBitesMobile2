// src/screens/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Image,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TimerService from '../services/TimerService';
import QuizService from '../services/QuizService';
import MascotDisplay from '../components/mascot/MascotDisplay';
import SoundService from '../services/SoundService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  // State
  const [availableTime, setAvailableTime] = useState(0);
  const [categories, setCategories] = useState([]);
  const [showMascot, setShowMascot] = useState(true);
  const [mascotMessage, setMascotMessage] = useState(null);
  const [stats, setStats] = useState({
    totalAnswered: 0,
    totalCorrect: 0,
    streakRecord: 0
  });
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timeAnim = useRef(new Animated.Value(0)).current;
  
  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Add timer event listener for time updates
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    // Start entry animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
    
    // Update mascot message
    updateMascotMessage();
    
    return () => {
      removeListener();
    };
  }, []);
  
  // Animate time changes
  useEffect(() => {
    Animated.timing(timeAnim, {
      toValue: availableTime,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [availableTime]);
  
  // Load all necessary data
  const loadData = async () => {
    try {
      // Load time
      const time = TimerService.getAvailableTime();
      setAvailableTime(time);
      timeAnim.setValue(time);
      
      // Load categories
      const cats = QuizService.getCategories();
      setCategories(cats);
      
      // Load stats
      const overallStats = QuizService.getOverallStats();
      setStats(overallStats);
      
      // Load settings
      const mascotEnabled = await AsyncStorage.getItem('brainbites_show_mascot');
      if (mascotEnabled !== null) {
        setShowMascot(mascotEnabled === 'true');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  
  // Handle timer events
  const handleTimerEvent = (event) => {
    if (event.event === 'timeUpdate' || event.event === 'creditsAdded') {
      setAvailableTime(TimerService.getAvailableTime());
      updateMascotMessage();
    }
  };
  
  // Update mascot message based on available time
  const updateMascotMessage = () => {
    const time = TimerService.getAvailableTime();
    
    if (time <= 0) {
      setMascotMessage("You're out of screen time! Answer some questions to earn more time. 📱");
    } else if (time < 60) {
      setMascotMessage("You're running low on screen time! Let's earn some more. ⏱️");
    } else if (time < 300) {
      setMascotMessage("You have a bit of screen time. Want to earn more? 🎮");
    } else {
      setMascotMessage("You have plenty of screen time! Ready to use it or earn more? 🎉");
    }
  };
  
  // Navigation handlers
  const handleStartQuiz = (category) => {
    SoundService.playButtonPress();
    navigation.navigate('Quiz', { category, quizLength: 5 });
  };
  
  const handleUseTime = () => {
    SoundService.playButtonPress();
    
    if (availableTime <= 0) {
      // Show message about needing to earn time
      setMascotMessage("You don't have any screen time yet! Answer questions correctly to earn time. 📱");
      return;
    }
    
    navigation.navigate('AppSelector');
  };
  
  const handleOpenSettings = () => {
    SoundService.playButtonPress();
    navigation.navigate('Settings');
  };
  
  const handleOpenStats = () => {
    SoundService.playButtonPress();
    navigation.navigate('Stats');
  };
  
  // Helper functions for UI
  const getCategoryIcon = (category) => {
    // Map categories to icons
    const iconMap = {
      'funfacts': 'lightbulb-on-outline',
      'psychology': 'brain',
      'math': 'calculator-variant-outline',
      'science': 'flask-outline',
      'history': 'book-open-page-variant-outline',
      'english': 'alphabetical',
      'general': 'clipboard-text-outline'
    };
    
    return iconMap[category] || 'help-circle-outline';
  };
  
  const getCategoryColor = (category) => {
    // Map categories to colors
    const colorMap = {
      'funfacts': '#FF9F1C',
      'psychology': '#FF6B6B',
      'math': '#4CAF50',
      'science': '#2196F3',
      'history': '#9C27B0',
      'english': '#3F51B5',
      'general': '#607D8B'
    };
    
    return colorMap[category] || '#FF9F1C';
  };
  
  const getCategoryEmoji = (category) => {
    // Map categories to emojis
    const emojiMap = {
      'funfacts': '💡',
      'psychology': '🧠',
      'math': '🔢',
      'science': '🔬',
      'history': '📚',
      'english': '📝',
      'general': '🎯'
    };
    
    return emojiMap[category] || '❓';
  };
  
  // Format time for display
  const formatTimeWithHours = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    
    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes}m`);
    }
    
    parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Header with settings and stats buttons */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleOpenSettings}
          >
            <Icon name="cog" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Brain Bites</Text>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleOpenStats}
          >
            <Icon name="chart-bar" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Time card */}
          <View style={styles.timeCard}>
            <View style={styles.timeCardHeader}>
              <Icon name="clock-outline" size={24} color="#FF9F1C" />
              <Text style={styles.timeCardTitle}>Available Screen Time</Text>
            </View>
            
            <Animated.Text style={styles.timeCardValue}>
              {timeAnim.interpolate({
                inputRange: [0, availableTime],
                outputRange: [0, availableTime]
              }).interpolate(value => formatTimeWithHours(Math.round(value)))}
            </Animated.Text>
            
            <TouchableOpacity 
              style={[
                styles.timeCardButton,
                availableTime <= 0 && styles.disabledButton
              ]}
              onPress={handleUseTime}
              disabled={availableTime <= 0}
            >
              <Text style={styles.buttonText}>Use Time</Text>
              <Icon name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Stats summary */}
          <View style={styles.statsSummary}>
            <View style={styles.statItem}>
              <Icon name="help-circle-outline" size={20} color="#FF9F1C" />
              <Text style={styles.statValue}>{stats.totalAnswered}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="check-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.totalCorrect}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="fire" size={20} color="#FF9F1C" />
              <Text style={styles.statValue}>{stats.streakRecord}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
          
          {/* Categories section */}
          <Text style={styles.sectionTitle}>Quiz Categories</Text>
          
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity 
                key={category}
                style={[
                  styles.categoryCard,
                  { borderColor: getCategoryColor(category) }
                ]}
                onPress={() => handleStartQuiz(category)}
              >
                <View 
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: getCategoryColor(category) }
                  ]}
                >
                  <Icon name={getCategoryIcon(category)} size={28} color="white" />
                </View>
                
                <Text style={styles.categoryName}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                
                <Text style={styles.categoryEmoji}>
                  {getCategoryEmoji(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Quick start button */}
          <TouchableOpacity 
            style={styles.quickStartButton}
            onPress={() => handleStartQuiz('random')}
          >
            <Icon name="shuffle-variant" size={24} color="white" />
            <Text style={styles.quickStartText}>Quick Start (Random Category)</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
      
      {/* Mascot display */}
      {showMascot && (
        <MascotDisplay
          type="happy"
          position="left"
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
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  timeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  timeCardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginBottom: 16,
  },
  timeCardButton: {
    backgroundColor: '#FF9F1C',
    borderRadius: 30,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 6,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: (width - 64) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  quickStartButton: {
    backgroundColor: '#FF9F1C',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStartText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  }
});

export default HomeScreen;