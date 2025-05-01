// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SplashScreen = () => {
  // Animation values
  const logoScale = new Animated.Value(0.3);
  const logoOpacity = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);
  
  useEffect(() => {
    // Start animations
    Animated.sequence([
      // First fade in and scale logo
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.7))
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        })
      ]),
      // Then fade in text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.logoContainer,
        { 
          opacity: logoOpacity,
          transform: [{ scale: logoScale }]
        }
      ]}>
        <Icon name="brain" size={80} color="#FF9F1C" />
      </Animated.View>
      
      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        Brain Bites
      </Animated.Text>
      
      <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>
        Learn & Earn Screen Time
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  }
});

export default SplashScreen;