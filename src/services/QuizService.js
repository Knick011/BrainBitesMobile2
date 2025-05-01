// src/services/QuizService.js - modified to use CSV from src/assets/data
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import { Platform } from 'react-native';

class QuizService {
  constructor() {
    this.questions = [];
    this.usedQuestionIds = new Set();
    this.categoryCounts = {};
    this.STORAGE_KEY = 'brainbites_quiz_data';
    this.loadSavedData();
    this.loadQuestions();
  }
  
  // Load previously saved quiz data from storage
  async loadSavedData() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        this.usedQuestionIds = new Set(parsedData.usedQuestionIds || []);
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
            console.error('CSV file not found in iOS bundle. Make sure to add it to the Xcode project.');
            // Use embedded fallback questions
            this.setupFallbackQuestions();
            return;
          }
        } else {
          // For Android, we can copy from assets folder
          try {
            await RNFS.copyFileAssets('questions.csv', destinationPath);
            console.log('CSV file copied from Android assets to document directory');
          } catch (e) {
            console.error('Failed to copy from assets:', e);
            // Use embedded fallback questions
            this.setupFallbackQuestions();
            return;
          }
        }
        
        // For iOS, we need to copy from bundle to document directory
        if (Platform.OS === 'ios') {
          await RNFS.copyFile(sourcePath, destinationPath);
          console.log('CSV file copied from iOS bundle to document directory');
        }
      }
      
      // Now read the file from document directory
      const csvData = await RNFS.readFile(destinationPath, 'utf8');
      
      // Parse CSV
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          this.questions = results.data.filter(item => item.id && item.question); // Filter out any empty rows
          
          // Count questions per category for tracking purposes
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
    
    // Create a minimal set of fallback questions
    this.questions = [
      {
        id: 'A1',
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
        id: 'B1',
        category: 'psychology',
        question: 'What is the fear of spiders called?',
        optionA: 'Arachnophobia',
        optionB: 'Acrophobia',
        optionC: 'Agoraphobia',
        optionD: 'Aerophobia',
        correctAnswer: 'A',
        explanation: 'Arachnophobia is the intense fear of spiders and other arachnids.'
      },
      // Add a few more fallbacks for each category
    ];
    
    // Set up category counts for fallbacks
    this.categoryCounts = {
      'funfacts': 1,
      'psychology': 1
    };
  }
  
  // Get a random question from a specific category
  async getRandomQuestion(category = 'funfacts') {
    try {
      // Filter questions by category
      const categoryQuestions = this.questions.filter(q => q.category === category);
      
      if (categoryQuestions.length === 0) {
        throw new Error(`No questions found for category: ${category}`);
      }
      
      // Filter out recently used questions
      const availableQuestions = categoryQuestions.filter(q => !this.usedQuestionIds.has(q.id));
      
      // If we've used too many questions (more than 80% of the category), reset tracking for this category
      if (availableQuestions.length < 0.2 * this.categoryCounts[category]) {
        // Clear only the used questions for this specific category
        const categoryPrefix = category[0].toUpperCase();
        this.usedQuestionIds.forEach(id => {
          if (id.startsWith(categoryPrefix)) {
            this.usedQuestionIds.delete(id);
          }
        });
        
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
        explanation: question.explanation
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
        explanation: "Mercury is the closest planet to the Sun in our solar system."
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
        explanation: "Oneirology is the scientific study of dreams."
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
        explanation: "2 + 2 = 4. This is a basic addition fact."
      }
    };
    
    return fallbacks[category] || fallbacks['default'];
  }
  
  // Get available categories
  async getCategories() {
    try {
      // Get unique categories from questions
      const categories = [...new Set(this.questions.map(q => q.category))];
      return categories.length > 0 ? categories : ['funfacts', 'psychology', 'math', 'science', 'history', 'english', 'general'];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['funfacts', 'psychology', 'math', 'science', 'history', 'english', 'general'];
    }
  }
  
  // Clear used questions tracking
  async resetUsedQuestions() {
    this.usedQuestionIds.clear();
    await this.saveData();
    console.log('Reset all used questions tracking');
  }
}

export default new QuizService();