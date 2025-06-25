// src/screens/LoadingScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../styles/constants';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 초기 페이드인 및 스케일 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // 펄스 애니메이션 (무한 반복)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // 1초 후 펄스 애니메이션 시작
    const timer = setTimeout(() => {
      pulseAnimation.start();
    }, 1000);

    return () => {
      clearTimeout(timer);
      pulseAnimation.stop();
    };
  }, [fadeAnim, scaleAnim, pulseAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* 로고 */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.logoBackground}>
            <Ionicons name="heart" size={60} color={Colors.primary} />
          </View>
        </Animated.View>

        {/* 앱 이름 */}
        <Text style={styles.appName}>정담</Text>
        <Text style={styles.tagline}>마음을 나누는 가장 쉬운 방법</Text>

        {/* 로딩 인디케이터 */}
        <View style={styles.loadingSection}>
          <View style={styles.loadingDots}>
            <LoadingDot delay={0} />
            <LoadingDot delay={200} />
            <LoadingDot delay={400} />
          </View>
          <Text style={styles.loadingText}>잠시만 기다려주세요...</Text>
        </View>
      </Animated.View>

      {/* 하단 카피라이트 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 정담. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
}

// 로딩 점 컴포넌트
const LoadingDot = ({ delay }) => {
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [dotAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: dotAnim,
          transform: [
            {
              scale: dotAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            },
          ],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  
  // 로고
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  
  // 텍스트
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 80,
    lineHeight: 26,
  },
  
  // 로딩
  loadingSection: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  
  // 푸터
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 12,
    color: Colors.gray400,
    textAlign: 'center',
  },
});