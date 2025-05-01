// src/screens/QuizResultsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Animated,
  Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SoundService from '../services/SoundService';
import MascotDisplay from '../components/mascot/MascotDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuizResultsScreen = ({ navigation, route }) => {
  // Get data from route params
  const { 
    results = [], 
    sessionScore = 0, 
    timeEarned = 0, 
    category = 'general',
    streak = 0, 
    questionsAnswered = 0, 
    correctAnswers = 0 
  } = route.params || {};
  
  // Animation values
  const [showMascot, setShowMascot] = useState(true);
  const scoreAnim = new Animated.Value(0);
  const timeAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);
  
  // Calculate stats
  const correctCount = results.filter(r => r.isCorrect).length;
  const incorrectCount = results.length - correctCount;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  
  // Format time earned
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes} min ${remainingSeconds} sec` 
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };
  
  // Load settings
  useEffect(() => {
    // Load mascot setting
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
    
    loadSettings();
    
    // Start animations
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.parallel([
        Animated.timing(scoreAnim, {
          toValue: sessionScore,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false
        }),
        Animated.timing(timeAnim, {
          toValue: timeEarned,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false
        })
      ])
    ]).start();
    
    // Play sound based on performance
    if (accuracy >= 80) {
      SoundService.playStreak();
    } else if (accuracy >= 50) {
      SoundService.playCorrect();
    } else {
      SoundService.playTransition();
    }
    
  }, []);
  
  // Get mascot message based on performance
  const getMascotMessage = () => {
    if (accuracy >= 80) {
      return "Fantastic job! You earned a lot of screen time! 🎉";
    } else if (accuracy >= 50) {
      return "Good work! Keep practicing to earn more time! 👍";
    } else {
      return "You'll do better next time! Practice makes perfect! 💪";
    }
  };
  
  // Handle continue to home
  const handleContinue = () => {
    SoundService.playButtonPress();
    navigation.navigate('Home');
  };
  
  // Handle play again
  const handlePlayAgain = () => {
    SoundService.playButtonPress();
    navigation.replace('Quiz', { category });
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="home" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Results</Text>
          <View style={{ width: 32 }} />
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Results summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.resultRow}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scorePercent}>{accuracy}%</Text>
                <Text style={styles.scoreLabel}>Accuracy</Text>
              </View>
              
              <View style={styles.statsColumn}>
                <View style={styles.statItem}>
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.statValue}>{correctCount}</Text>
                  <Text style={styles.statLabel}>Correct</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Icon name="close-circle" size={20} color="#F44336" />
                  <Text style={styles.statValue}>{incorrectCount}</Text>
                  <Text style={styles.statLabel}>Incorrect</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.rewardsRow}>
              <View style={styles.rewardItem}>
                <Icon name="trophy" size={24} color="#FF9F1C" />
                <View style={styles.rewardTextContainer}>
                  <Text style={styles.rewardLabel}>Points Earned</Text>
                  <Animated.Text style={styles.rewardValue}>
                    {scoreAnim.interpolate({
                      inputRange: [0, sessionScore],
                      outputRange: [0, sessionScore].map(Math.round)
                    }).interpolate(value => Math.round(value))}
                  </Animated.Text>
                </View>
              </View>
              
              <View style={styles.rewardItem}>
                <Icon name="clock-plus-outline" size={24} color="#FF9F1C" />
                <View style={styles.rewardTextContainer}>
                  <Text style={styles.rewardLabel}>Time Earned</Text>
                  <Animated.Text style={styles.rewardValue}>
                    {timeAnim.interpolate({
                      inputRange: [0, timeEarned],
                      outputRange: [0, timeEarned]
                    }).interpolate(value => formatTime(Math.round(value)))}
                  </Animated.Text>
                </View>
              </View>
              
              {streak > 0 && (
                <View style={styles.streakContainer}>
                  <Icon name="fire" size={20} color="#FF9F1C" />
                  <Text style={styles.streakText}>Streak: {streak}</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Category badge */}
          <View style={styles.categoryContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </View>
          </View>
          
          {/* Questions review */}
          <Text style={styles.sectionTitle}>Question Review</Text>
          
          {results.map((result, index) => (
            <View 
              key={result.questionId || index} 
              style={[
                styles.questionCard,
                result.isCorrect ? styles.correctCard : styles.incorrectCard
              ]}
            >
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <View style={styles.resultBadge}>
                  <Icon 
                    name={result.isCorrect ? "check" : "close"} 
                    size={16} 
                    color="white" 
                  />
                  <Text style={styles.resultText}>
                    {result.isCorrect ? "Correct" : "Incorrect"}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.questionText}>{result.question}</Text>
              
              {!result.isCorrect && (
                <View style={styles.answerContainer}>
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Your answer:</Text>
                    <Text style={styles.wrongAnswer}>
                      {result.selectedAnswer}: {result.options && result.options[result.selectedAnswer]}
                    </Text>
                  </View>
                  
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Correct answer:</Text>
                    <Text style={styles.correctAnswer}>
                      {result.correctAnswer}: {result.options && result.options[result.correctAnswer]}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
          
          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handlePlayAgain}
            >
              <Icon name="refresh" size={20} color="white" />
              <Text style={styles.actionText}>Play Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleContinue}
            >
              <Icon name="home" size={20} color="white" />
              <Text style={styles.actionText}>Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
      
      {/* Mascot display */}
      {showMascot && (
        <MascotDisplay
          type={accuracy >= 80 ? "excited" : accuracy >= 50 ? "happy" : "sad"}
          position="right"
          showMascot={showMascot}
          message={getMascotMessage()}
          autoHide={false}
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
    justifyContent: 'space-between',
    marginBottom: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF9F1C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scorePercent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  statsColumn: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  rewardsRow: {
    flexDirection: 'column',
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 12,
  },
  rewardTextContainer: {
    marginLeft: 12,
  },
  rewardLabel: {
    fontSize: 14,
    color: '#666',
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  streakText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9F1C',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#FF9F1C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  correctCard: {
    borderLeftColor: '#4CAF50',
  },
  incorrectCard: {
    borderLeftColor: '#F44336',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: (props) => props.isCorrect ? '#4CAF50' : '#F44336',
  },
  resultText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  answerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 100,
  },
  wrongAnswer: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
  },
  correctAnswer: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    borderRadius: 30,
    paddingVertical: 12,
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#FF9F1C',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default QuizResultsScreen;