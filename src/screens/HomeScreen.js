// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TimerService from '../services/TimerService';
import QuizService from '../services/QuizService';
import MascotDisplay from '../components/mascot/MascotDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const [availableTime, setAvailableTime] = useState(0);
  const [categories, setCategories] = useState(['funfacts', 'psychology']);
  const [showMascot, setShowMascot] = useState(true);
  const [mascotMessage, setMascotMessage] = useState(null);
  
  useEffect(() => {
    // Load initial time
    loadAvailableTime();
    
    // Add timer event listener
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    // Load categories
    loadCategories();
    
    // Load settings
    loadSettings();
    
    // Set mascot message based on available time
    updateMascotMessage();
    
    return () => {
      removeListener();
    };
  }, []);
  
  useEffect(() => {
    // Update mascot message when time changes
    updateMascotMessage();
  }, [availableTime]);
  
  const loadAvailableTime = async () => {
    const timeInSeconds = TimerService.getAvailableTime();
    setAvailableTime(timeInSeconds);
  };
  
  const loadCategories = async () => {
    try {
      const cats = await QuizService.getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadSettings = async () => {
    try {
      const mascotEnabled = await AsyncStorage.getItem('brainbites_show_mascot');
      if (mascotEnabled !== null) {
        setShowMascot(mascotEnabled === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const updateMascotMessage = () => {
    if (availableTime <= 0) {
      setMascotMessage("You're out of app time! Answer questions to earn more.");
    } else if (availableTime < 60) {
      setMascotMessage("You're running low on time! Let's earn some more.");
    } else {
      setMascotMessage("Ready to use your app time or earn more?");
    }
  };
  
  const handleTimerEvent = (event) => {
    if (event.event === 'creditsAdded' || event.event === 'timeUpdate') {
      setAvailableTime(TimerService.getAvailableTime());
    }
  };
  
  const handleStartQuiz = (category) => {
    navigation.navigate('Quiz', { category });
  };
  
  const handleUseTime = () => {
    navigation.navigate('AppSelector');
  };
  
  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };
  
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
  
  const formattedTime = TimerService.formatTime(availableTime);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Settings button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleOpenSettings}
        >
          <Icon name="cog" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Text style={styles.title}>Brain Bites Mobile</Text>
          <Text style={styles.subtitle}>Learn and earn app time!</Text>
        </View>
        
        <View style={styles.timeCard}>
          <Icon name="clock-outline" size={40} color="#FF9F1C" />
          <Text style={styles.timeTitle}>Available App Time</Text>
          <Text style={styles.timeValue}>{formattedTime}</Text>
          
          <TouchableOpacity 
            style={[
              styles.timeButton,
              availableTime <= 0 && styles.disabledButton
            ]}
            onPress={handleUseTime}
            disabled={availableTime <= 0}
          >
            <Text style={styles.buttonText}>Use Time</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionTitle}>Quiz Categories</Text>
        
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category}
              style={[styles.categoryCard, { borderColor: getCategoryColor(category) }]}
              onPress={() => handleStartQuiz(category)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category) }]}>
                <Icon name={getCategoryIcon(category)} size={24} color="white" />
              </View>
              <Text style={styles.categoryName}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <Text style={styles.categorySubtext}>
                Answer to earn time
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.footer} />
      </ScrollView>
      
      {/* Mascot component */}
      {showMascot && (
        <MascotDisplay
          type="happy"
          position="left"
          showMascot={true}
          message={mascotMessage}
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
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  timeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginBottom: 16,
  },
  timeButton: {
    backgroundColor: '#FF9F1C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: '#FF9F1C',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9F1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  categorySubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    height: 100,
  },
});

export default HomeScreen;