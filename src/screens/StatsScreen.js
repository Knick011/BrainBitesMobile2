// src/screens/StatsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Animated,
  Easing,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QuizService from '../services/QuizService';
import TimerService from '../services/TimerService';

const StatsScreen = ({ navigation }) => {
  // Animation values
  const barAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [overallStats, setOverallStats] = useState({
    totalAnswered: 0,
    totalCorrect: 0,
    accuracy: 0,
    streakRecord: 0
  });
  
  const [categoryStats, setCategoryStats] = useState({});
  const [timeStats, setTimeStats] = useState({
    totalTimeEarned: 0,
    totalTimeUsed: 0,
    currentBalance: 0
  });
  
  // Load stats on mount
  useEffect(() => {
    loadStats();
    
    // Start bar animation
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, []);
  
  const loadStats = () => {
    // Get overall stats
    const overall = QuizService.getOverallStats();
    setOverallStats(overall);
    
    // Get category stats
    const categories = QuizService.getCategories();
    const catStats = {};
    
    categories.forEach(category => {
      catStats[category] = QuizService.getCategoryStats(category);
    });
    
    setCategoryStats(catStats);
    
    // Get time stats from TimerService
    const timeData = TimerService.getTimeStats();
    setTimeStats(timeData);
  };
  
  // Handle reset stats
  const handleResetStats = () => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset all your statistics? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await QuizService.resetStats();
            loadStats();
          }
        }
      ]
    );
  };
  
  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} min`;
    }
  };
  
  // Get color for accuracy bar
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return '#4CAF50';
    if (accuracy >= 60) return '#FF9F1C';
    if (accuracy >= 40) return '#FF9800';
    return '#F44336';
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Statistics</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Overall Stats Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Performance</Text>
            
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Icon name="help-circle-outline" size={24} color="#FF9F1C" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>{overallStats.totalAnswered}</Text>
                  <Text style={styles.statLabel}>Questions</Text>
                </View>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="check-circle-outline" size={24} color="#4CAF50" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>{overallStats.totalCorrect}</Text>
                  <Text style={styles.statLabel}>Correct</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Icon name="fire" size={24} color="#FF9F1C" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>{overallStats.streakRecord}</Text>
                  <Text style={styles.statLabel}>Best Streak</Text>
                </View>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="percent" size={24} color="#4CAF50" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>{overallStats.accuracy}%</Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.accuracyBarContainer}>
              <Animated.View 
                style={[
                  styles.accuracyBar,
                  {
                    width: barAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${overallStats.accuracy}%`]
                    }),
                    backgroundColor: getAccuracyColor(overallStats.accuracy)
                  }
                ]}
              />
            </View>
          </View>
          
          {/* Time Stats Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Screen Time</Text>
            
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Icon name="clock-plus-outline" size={24} color="#4CAF50" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>{formatTime(timeStats.totalTimeEarned)}</Text>
                  <Text style={styles.statLabel}>Total Time Earned</Text>
                </View>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="clock-minus-outline" size={24} color="#F44336" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>{formatTime(timeStats.totalTimeUsed)}</Text>
                  <Text style={styles.statLabel}>Total Time Used</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.timeBalanceContainer}>
              <Text style={styles.timeBalanceLabel}>Current Balance:</Text>
              <Text style={styles.timeBalanceValue}>
                {TimerService.formatTime(timeStats.currentBalance)}
              </Text>
            </View>
          </View>
          
          {/* Category Stats Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Category Performance</Text>
            
            {Object.entries(categoryStats).map(([category, stats]) => (
              <View key={category} style={styles.categoryContainer}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <Text style={styles.categoryAccuracy}>
                    {stats.accuracy}%
                  </Text>
                </View>
                
                <View style={styles.categoryBarContainer}>
                  <Animated.View 
                    style={[
                      styles.categoryBar,
                      {
                        width: barAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${stats.accuracy}%`]
                        }),
                        backgroundColor: getAccuracyColor(stats.accuracy)
                      }
                    ]}
                  />
                </View>
                
                <View style={styles.categoryDetailRow}>
                  <Text style={styles.categoryDetailText}>
                    {stats.answered} questions • {stats.correct} correct
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          {/* Reset Stats Button */}
          {overallStats.totalAnswered > 0 && (
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleResetStats}
            >
              <Icon name="refresh" size={18} color="white" />
              <Text style={styles.resetButtonText}>Reset Statistics</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  statTextContainer: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  accuracyBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  accuracyBar: {
    height: '100%',
    borderRadius: 4,
  },
  timeBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  timeBalanceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  timeBalanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9F1C',
  },
  categoryContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  categoryAccuracy: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  categoryDetailText: {
    fontSize: 12,
    color: '#666',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 30,
    paddingVertical: 12,
    marginBottom: 30,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  }
});

export default StatsScreen;