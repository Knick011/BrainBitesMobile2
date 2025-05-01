// src/screens/QuizScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QuizService from '../services/QuizService';
import TimerService from '../services/TimerService';

const QuizScreen = ({ navigation, route }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [category, setCategory] = useState(route.params?.category || 'funfacts');
  
  useEffect(() => {
    loadQuestion();
  }, []);
  
  const loadQuestion = async () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    
    try {
      const question = await QuizService.getRandomQuestion(category);
      setCurrentQuestion(question);
      setQuestionsAnswered(prev => prev + 1);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSelect = (option) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    setSelectedAnswer(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    
    // Update streak
    if (correct) {
      setStreak(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      
      // Handle milestone (every 5 correct answers)
      if ((streak + 1) % 5 === 0) {
        // Add more time for milestones - 2 minutes (120 seconds)
        TimerService.addTimeCredits(120);
      } else {
        // Regular reward - 30 seconds
        TimerService.addTimeCredits(30);
      }
    } else {
      // Reset streak on wrong answer
      setStreak(0);
    }
    
    // Show explanation after a short delay
    setTimeout(() => {
      setShowExplanation(true);
    }, 500);
  };
  
  const handleContinue = () => {
    loadQuestion();
  };
  
  const handleGoBack = () => {
    navigation.goBack();
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
  
  const getRewardText = () => {
    if (!isCorrect) return '';
    
    // Different text for milestone versus regular correct answer
    if ((streak) % 5 === 0) {
      return '🎉 Milestone bonus! +2 minutes of app time!';
    } else {
      return '+30 seconds of app time!';
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with stats */}
        <View style={styles.header}>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Correct: {correctAnswers}/{questionsAnswered}</Text>
          </View>
          <View style={styles.streakContainer}>
            <Icon 
              name="fire" 
              size={16} 
              color={streak > 0 ? '#FF9F1C' : '#ccc'} 
            />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>
        
        {/* Category indicator */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </View>
        
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion?.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQuestion?.options && Object.entries(currentQuestion.options).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  selectedAnswer === key && (
                    key === currentQuestion.correctAnswer ? styles.correctOption : styles.incorrectOption
                  )
                ]}
                onPress={() => handleAnswerSelect(key)}
                disabled={selectedAnswer !== null}
              >
                <Text style={styles.optionKey}>{key}.</Text>
                <Text style={styles.optionText}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Explanation */}
        {showExplanation && (
          <View style={[
            styles.explanationContainer,
            isCorrect ? styles.correctExplanation : styles.incorrectExplanation
          ]}>
            <Text style={styles.explanationTitle}>
              {isCorrect ? 'Correct!' : 'Incorrect!'}
            </Text>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
            
            {isCorrect && (
              <View style={styles.rewardContainer}>
                <Icon name="clock-plus-outline" size={20} color="#856404" />
                <Text style={styles.rewardText}>
                  {getRewardText()}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Next Question</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Exit button */}
        {!showExplanation && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Text style={styles.backButtonText}>Exit Quiz</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsText: {
    fontWeight: '600',
    fontSize: 14,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  streakText: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#333',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9F1C',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  optionsContainer: {
    marginVertical: 12,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  correctOption: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  incorrectOption: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  optionKey: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  explanationContainer: {
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  correctExplanation: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  incorrectExplanation: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  rewardContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    color: '#856404',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#FF9F1C',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#FF9F1C',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default QuizScreen;