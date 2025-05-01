// src/screens/QuizScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Animated,
  BackHandler,
  Alert,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QuizService from '../services/QuizService';
import TimerService from '../services/TimerService';
import SoundService from '../services/SoundService';
import MascotDisplay from '../components/mascot/MascotDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuizScreen = ({ navigation, route }) => {
  // Core quiz state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Stats tracking
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [category, setCategory] = useState(route.params?.category || 'funfacts');
  const [quizLength, setQuizLength] = useState(route.params?.quizLength || 5); // Default to 5 questions per session
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Mascot state
  const [showMascot, setShowMascot] = useState(true);
  const [mascotType, setMascotType] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState(null);
  
  // Results tracking
  const [results, setResults] = useState([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [timeEarned, setTimeEarned] = useState(0);
  
  // Load settings and initialize
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load mascot setting
        const mascotEnabled = await AsyncStorage.getItem('brainbites_show_mascot');
        if (mascotEnabled !== null) {
          setShowMascot(mascotEnabled === 'true');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    // Handle hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (results.length > 0 || currentQuestionIndex > 0) {
        // If quiz already started, confirm exit
        Alert.alert(
          'Exit Quiz',
          'Are you sure you want to exit? Your progress will be lost.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
          ]
        );
        return true; // Prevent default behavior
      }
      return false; // Let default behavior happen
    });
    
    loadSettings();
    loadQuestion();
    
    return () => {
      backHandler.remove();
    };
  }, []);
  
  // Load a new question
  const loadQuestion = async () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    try {
      const question = await QuizService.getRandomQuestion(category);
      setCurrentQuestion(question);
      
      // Increment question index
      setCurrentQuestionIndex(prev => prev + 1);
      
      // Start fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        })
      ]).start();
      
      // Set initial mascot message
      setMascotType('happy');
      setMascotMessage(getRandomEncouragementMessage());
      
    } catch (error) {
      console.error('Error loading question:', error);
      Alert.alert(
        'Error',
        'Failed to load question. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get random encouragement message
  const getRandomEncouragementMessage = () => {
    const messages = [
      "You've got this! 🙌",
      "Take your time and think carefully! 🤔",
      "Remember, each correct answer earns you time! ⏱️",
      "Focus and you'll do great! 👍",
      "Let's earn some screen time! 📱",
      "Read carefully before answering! 📖"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  // Handle answer selection
  const handleAnswerSelect = (option) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    setSelectedAnswer(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    
    // Add result to tracking
    const result = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      selectedAnswer: option,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: correct,
      category: currentQuestion.category
    };
    
    setResults(prev => [...prev, result]);
    
    // Update stats
    setQuestionsAnswered(prev => prev + 1);
    
    // Play sound effect
    if (correct) {
      SoundService.playCorrect();
      
      // Update streak and correct answer count
      setStreak(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      
      // Set mascot to excited
      setMascotType('excited');
      setMascotMessage("Great job! 🎉");
      
      // Calculate time reward
      let timeReward;
      if ((streak + 1) % 5 === 0) {
        // Milestone reward (every 5 correct)
        timeReward = 120; // 2 minutes
        setMascotMessage("Amazing streak! You earned a time bonus! ⭐⭐⭐");
        
        // Play special streak sound
        SoundService.playStreak();
      } else {
        // Standard reward
        timeReward = 30; // 30 seconds
      }
      
      // Add time credits
      TimerService.addTimeCredits(timeReward);
      SoundService.playTimeAdded();
      
      // Track total time earned
      setTimeEarned(prev => prev + timeReward);
      
      // Update session score (10 points per correct answer)
      setSessionScore(prev => prev + 10);
      
    } else {
      // Incorrect answer
      SoundService.playIncorrect();
      
      // Reset streak
      setStreak(0);
      
      // Set mascot to sad
      setMascotType('sad');
      setMascotMessage("That's not right. Try the next one!");
      
      // Shake animation for wrong answer
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]).start();
    }
    
    // Show explanation after a short delay
    setTimeout(() => {
      setShowExplanation(true);
    }, 500);
    
    // Update quiz stats in service
    QuizService.updateStats(category, correct, streak + (correct ? 1 : 0));
  };
  
  // Handle continue to next question or complete quiz
  const handleContinue = () => {
    // Play transition sound
    SoundService.playTransition();
    
    // Check if quiz is complete
    if (currentQuestionIndex >= quizLength) {
      // Navigate to results screen
      navigation.replace('QuizResults', {
        results,
        sessionScore,
        timeEarned,
        category,
        streak: correct ? streak : 0,
        questionsAnswered,
        correctAnswers
      });
    } else {
      // Load next question with exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        loadQuestion();
      });
    }
  };
  
  // Handle back button
  const handleGoBack = () => {
    if (results.length > 0 || currentQuestionIndex > 0) {
      // If quiz already started, confirm exit
      Alert.alert(
        'Exit Quiz',
        'Are you sure you want to exit? Your progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex} of {quizLength}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(currentQuestionIndex / quizLength) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>
        
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.statText}>{correctAnswers}/{questionsAnswered}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="fire" size={16} color={streak > 0 ? "#FF9F1C" : "#ccc"} />
            <Text style={styles.statText}>{streak}</Text>
          </View>
          
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </View>
        </View>
        
        {/* Question card */}
        <Animated.View 
          style={[
            styles.questionCard,
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateX: shakeAnim }
              ]
            }
          ]}
        >
          <Text style={styles.questionText}>{currentQuestion?.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQuestion?.options && Object.entries(currentQuestion.options).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  selectedAnswer === key && (
                    key === currentQuestion.correctAnswer 
                      ? styles.correctOption 
                      : styles.incorrectOption
                  )
                ]}
                onPress={() => handleAnswerSelect(key)}
                disabled={selectedAnswer !== null}
              >
                <View style={styles.optionKey}>
                  <Text style={styles.optionKeyText}>{key}</Text>
                </View>
                <Text style={styles.optionText}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Explanation card */}
        {showExplanation && (
          <View style={[
            styles.explanationCard,
            isCorrect ? styles.correctExplanation : styles.incorrectExplanation
          ]}>
            <View style={styles.explanationHeader}>
              <Icon 
                name={isCorrect ? "check-circle" : "close-circle"} 
                size={24} 
                color={isCorrect ? "#4CAF50" : "#F44336"} 
              />
              <Text style={styles.explanationTitle}>
                {isCorrect ? "Correct!" : "Incorrect"}
              </Text>
            </View>
            
            {!isCorrect && (
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswerLabel}>The correct answer was:</Text>
                <Text style={styles.correctAnswerText}>
                  {currentQuestion.correctAnswer}: {currentQuestion.options[currentQuestion.correctAnswer]}
                </Text>
              </View>
            )}
            
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
            
            {isCorrect && (
              <View style={styles.rewardContainer}>
                <Icon name="clock-plus-outline" size={20} color="#FF9F1C" />
                <Text style={styles.rewardText}>
                  {streak % 5 === 0 && streak > 0 
                    ? "+2 minutes of screen time! (Streak bonus)" 
                    : "+30 seconds of screen time!"}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>
                {currentQuestionIndex >= quizLength ? "See Results" : "Next Question"}
              </Text>
              <Icon name="arrow-right" size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* Mascot display */}
      {showMascot && !showExplanation && (
        <MascotDisplay
          type={mascotType}
          position="right"
          showMascot={showMascot}
          message={mascotMessage}
          autoHide={true}
          autoHideDuration={5000}
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
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9F1C',
    borderRadius: 2,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  statText: {
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  categoryBadge: {
    backgroundColor: '#FF9F1C',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  correctOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  incorrectOption: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E57373',
  },
  optionKey: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF9F1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionKeyText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  explanationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  correctExplanation: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#81C784',
  },
  incorrectExplanation: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#E57373',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  correctAnswerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#666',
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#333',
  },
  rewardContainer: {
    backgroundColor: '#FFF3CD',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  rewardText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#856404',
  },
  continueButton: {
    backgroundColor: '#FF9F1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
});

export default QuizScreen;