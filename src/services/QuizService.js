// src/services/QuizService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import { Platform } from 'react-native';

class QuizService {
  constructor() {
    this.questions = [];
    this.usedQuestionIds = new Set();
    this.categoryCounts = {};
    this.stats = {
      totalAnswered: 0,
      totalCorrect: 0,
      streakRecord: 0,
      categoryStats: {}
    };
    this.STORAGE_KEY = 'brainbites_quiz_data';
    this.STATS_KEY = 'brainbites_quiz_stats';
    
    // Load saved data on initialization
    this.loadSavedData();
    this.loadQuestions();
  }
  
  // Load previously saved quiz data from storage
  async loadSavedData() {
    try {
      // Load used question IDs
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        this.usedQuestionIds = new Set(parsedData.usedQuestionIds || []);
      }
      
      // Load stats
      const statsData = await AsyncStorage.getItem(this.STATS_KEY);
      if (statsData) {
        this.stats = JSON.parse(statsData);
      }
      
    } catch (error) {
      console.error('Error loading saved quiz data:', error);
    }
  }
  
  // Save quiz data to storage
  async saveData() {
    try {
      const data = {
        usedQuestionIds: Array.from(this.usedQuestionIds),
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving quiz data:', error);
    }
  }
  
  // Save stats to storage
  async saveStats() {
    try {
      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Error saving quiz stats:', error);
    }
  }
  
  // Update stats when a question is answered
  async updateStats(category, isCorrect, streak) {
    // Update overall stats
    this.stats.totalAnswered++;
    if (isCorrect) {
      this.stats.totalCorrect++;
    }
    
    // Update streak record
    if (streak > this.stats.streakRecord) {
      this.stats.streakRecord = streak;
    }
    
    // Update category stats
    if (!this.stats.categoryStats[category]) {
      this.stats.categoryStats[category] = {
        answered: 0,
        correct: 0
      };
    }
    
    this.stats.categoryStats[category].answered++;
    if (isCorrect) {
      this.stats.categoryStats[category].correct++;
    }
    
    // Save updated stats
    await this.saveStats();
  }
  
  // Load questions from CSV file
  async loadQuestions() {
    try {
      // Get path to where we'll store the CSV
      const destinationPath = RNFS.DocumentDirectoryPath + '/questions.csv';
      
      // Check if file exists in document directory
      const exists = await RNFS.exists(destinationPath);
      
      if (!exists) {
        // Source path depends on platform
        let sourcePath;
        
        if (Platform.OS === 'ios') {
          // For iOS, we need to use the main bundle path
          sourcePath = RNFS.MainBundlePath + '/questions.csv';
          
          // Check if it exists in the main bundle
          const existsInBundle = await RNFS.exists(sourcePath);
          
          if (!existsInBundle) {
            console.error('CSV file not found in iOS bundle. Using fallback questions.');
            this.setupFallbackQuestions();
            return;
          }
          
          // Copy from bundle to document directory
          await RNFS.copyFile(sourcePath, destinationPath);
          console.log('CSV file copied from iOS bundle to document directory');
        } else {
          // For Android, we can copy from assets folder
          try {
            await RNFS.copyFileAssets('questions.csv', destinationPath);
            console.log('CSV file copied from Android assets to document directory');
          } catch (e) {
            console.error('Failed to copy from assets:', e);
            this.setupFallbackQuestions();
            return;
          }
        }
      }
      
      // Now read the file from document directory
      const csvData = await RNFS.readFile(destinationPath, 'utf8');
      
      // Parse CSV
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          // Filter out any rows with missing data
          this.questions = results.data.filter(item => 
            item.id && 
            item.question && 
            item.optionA && 
            item.optionB && 
            item.correctAnswer
          );
          
          // Count questions per category
          this.categoryCounts = {};
          this.questions.forEach(q => {
            if (q.category) {
              if (!this.categoryCounts[q.category]) {
                this.categoryCounts[q.category] = 0;
              }
              this.categoryCounts[q.category]++;
            }
          });
          
          console.log(`Loaded ${this.questions.length} questions`);
          console.log('Categories count:', this.categoryCounts);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          this.setupFallbackQuestions();
        }
      });
    } catch (error) {
      console.error('Error loading questions from CSV:', error);
      this.setupFallbackQuestions();
    }
  }
  
  // Set up fallback questions in case CSV loading fails
  setupFallbackQuestions() {
    console.log('Using fallback questions');
    
    // Create a minimal set of fallback questions for each expected category
    this.questions = [
      {
        id: 'F1',
        category: 'funfacts',
        question: 'Which planet is known as the Red Planet?',
        optionA: 'Venus',
        optionB: 'Mars',
        optionC: 'Jupiter',
        optionD: 'Saturn',
        correctAnswer: 'B',
        explanation: 'Mars is called the Red Planet because of the reddish iron oxide on its surface.'
      },
      {
        id: 'P1',
        category: 'psychology',
        question: 'What is the fear of spiders called?',
        optionA: 'Arachnophobia',
        optionB: 'Acrophobia',
        optionC: 'Agoraphobia',
        optionD: 'Aerophobia',
        correctAnswer: 'A',
        explanation: 'Arachnophobia is the intense fear of spiders and other arachnids.'
      },
      {
        id: 'M1',
        category: 'math',
        question: 'What is the square root of 144?',
        optionA: '10',
        optionB: '11',
        optionC: '12',
        optionD: '14',
        correctAnswer: 'C',
        explanation: 'The square root of 144 is 12, because 12 × 12 = 144.'
      },
      {
        id: 'S1',
        category: 'science',
        question: 'What is the chemical symbol for gold?',
        optionA: 'Au',
        optionB: 'Ag',
        optionC: 'Fe',
        optionD: 'Go',
        correctAnswer: 'A',
        explanation: 'The chemical symbol for gold is Au, from the Latin word "aurum".'
      },
      {
        id: 'G1',
        category: 'general',
        question: 'Which is the largest ocean on Earth?',
        optionA: 'Atlantic Ocean',
        optionB: 'Indian Ocean',
        optionC: 'Southern Ocean',
        optionD: 'Pacific Ocean',
        correctAnswer: 'D',
        explanation: 'The Pacific Ocean is the largest and deepest ocean on Earth.'
      }
    ];
    
    // Setup category counts for fallbacks
    this.categoryCounts = {
      'funfacts': 1,
      'psychology': 1,
      'math': 1,
      'science': 1,
      'general': 1
    };
  }
  
  // Get a random question from a specific category
  async getRandomQuestion(category = 'funfacts') {
    try {
      // Filter questions by category
      const categoryQuestions = this.questions.filter(q => q.category.toLowerCase() === category.toLowerCase());
      
      if (categoryQuestions.length === 0) {
        throw new Error(`No questions found for category: ${category}`);
      }
      
      // Filter out recently used questions
      const availableQuestions = categoryQuestions.filter(q => !this.usedQuestionIds.has(q.id));
      
      // If we've used too many questions (more than 80% of the category), reset tracking for this category
      if (availableQuestions.length < 0.2 * this.categoryCounts[category]) {
        // Clear only the used questions for this specific category
        const categoryIds = categoryQuestions.map(q => q.id);
        categoryIds.forEach(id => this.usedQuestionIds.delete(id));
        
        await this.saveData();
        console.log(`Reset tracking for category ${category}`);
        
        // Try again with refreshed tracking
        return this.getRandomQuestion(category);
      }
      
      // If still no available questions, return a fallback
      if (availableQuestions.length === 0) {
        return this.getFallbackQuestion(category);
      }
      
      // Pick a truly random question
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];
      
      // Mark as used
      this.usedQuestionIds.add(question.id);
      await this.saveData();
      
      console.log(`Selected question ${question.id} from ${availableQuestions.length} available questions`);
      
      // Format the question object to match what the app expects
      return {
        id: question.id,
        question: question.question,
        options: {
          A: question.optionA,
          B: question.optionB,
          C: question.optionC,
          D: question.optionD
        },
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || 'No explanation available.',
        category: question.category
      };
    } catch (error) {
      console.error('Error getting random question:', error);
      return this.getFallbackQuestion(category);
    }
  }
  
  // Provide a fallback question if something goes wrong
  getFallbackQuestion(category) {
    const fallbacks = {
      'funfacts': {
        id: 'fallback-funfacts',
        question: "Which planet is closest to the Sun?",
        options: {
          A: "Earth",
          B: "Venus",
          C: "Mercury",
          D: "Mars"
        },
        correctAnswer: "C",
        explanation: "Mercury is the closest planet to the Sun in our solar system.",
        category: "funfacts"
      },
      'psychology': {
        id: 'fallback-psychology',
        question: "What is the study of dreams called?",
        options: {
          A: "Oneirology",
          B: "Neurology",
          C: "Psychology",
          D: "Psychiatry"
        },
        correctAnswer: "A",
        explanation: "Oneirology is the scientific study of dreams.",
        category: "psychology"
      },
      'math': {
        id: 'fallback-math',
        question: "What is the result of 7² - 3²?",
        options: {
          A: "40",
          B: "30",
          C: "49",
          D: "4"
        },
        correctAnswer: "A",
        explanation: "7² - 3² = 49 - 9 = 40",
        category: "math"
      },
      'science': {
        id: 'fallback-science',
        question: "Which particle has a positive charge?",
        options: {
          A: "Proton",
          B: "Neutron",
          C: "Electron",
          D: "Photon"
        },
        correctAnswer: "A",
        explanation: "Protons have a positive charge, electrons have a negative charge, and neutrons have no charge.",
        category: "science"
      },
      'default': {
        id: 'fallback-default',
        question: "What is 2 + 2?",
        options: {
          A: "3",
          B: "4",
          C: "5",
          D: "6"
        },
        correctAnswer: "B",
        explanation: "2 + 2 = 4. This is a basic addition fact.",
        category: "general"
      }
    };
    
    return fallbacks[category] || fallbacks['default'];
  }
  
  // Get available categories
  getCategories() {
    try {
      // Get unique categories from questions
      const categories = [...new Set(this.questions.map(q => q.category))];
      return categories.length > 0 ? categories : ['funfacts', 'psychology', 'math', 'science', 'general'];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['funfacts', 'psychology', 'math', 'science', 'general'];
    }
  }
  
  // Get stats for a specific category
  getCategoryStats(category) {
    if (!this.stats.categoryStats[category]) {
      return { answered: 0, correct: 0, accuracy: 0 };
    }
    
    const { answered, correct } = this.stats.categoryStats[category];
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    
    return { answered, correct, accuracy };
  }
  
  // Get overall quiz stats
  getOverallStats() {
    const { totalAnswered, totalCorrect, streakRecord } = this.stats;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    
    return {
      totalAnswered,
      totalCorrect,
      accuracy,
      streakRecord
    };
  }
  
  // Clear used questions tracking
  async resetUsedQuestions() {
    this.usedQuestionIds.clear();
    await this.saveData();
    console.log('Reset all used questions tracking');
  }
  
  // Reset stats
  async resetStats() {
    this.stats = {
      totalAnswered: 0,
      totalCorrect: 0,
      streakRecord: 0,
      categoryStats: {}
    };
    
    await this.saveStats();
    console.log('Reset all quiz stats');
  }
}

export default new QuizService();