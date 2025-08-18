// src/screens/main/BenefitsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';

const { width } = Dimensions.get('window');

// 토스 스타일 컬러 팔레트
const TossColors = {
  primary: '#0064FF',
  primaryLight: '#E6F0FF',
  background: '#FFFFFF',
  surface: '#F7F8FA',
  text: {
    primary: '#191F28',
    secondary: '#8B95A1',
    tertiary: '#B0B8C1',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F2F4F6',
    200: '#E5E8EB',
    300: '#D1D6DB',
    400: '#B0B8C1',
    500: '#8B95A1',
    600: '#6B7684',
    700: '#4E5968',
    800: '#333D4B',
    900: '#191F28',
  },
  border: '#F2F3F5',
  success: '#00C896',
  error: '#FF5A5F',
  warning: '#FFB800',
};

export default function BenefitsScreen({ navigation, userInfo, session, isAuthenticated }) {
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎁 혜택</Text>
          <Text style={styles.headerSubtitle}>
            특별한 할인과 프리미엄 서비스를 준비중입니다
          </Text>
        </View>

        {/* 준비중 컨테이너 */}
        <View style={styles.preparingContainer}>
          <View style={styles.preparingIconWrapper}>
            <Text style={styles.preparingIcon}>🎁</Text>
          </View>
          <Text style={styles.preparingTitle}>서비스 준비중</Text>
          <Text style={styles.preparingDescription}>
            더 나은 혜택과 서비스로{'\n'}곧 찾아뵙겠습니다
          </Text>
          
          <View style={styles.preparingFeatures}>
            <View style={styles.preparingFeatureItem}>
              <Text style={styles.featureIcon}>🏷️</Text>
              <Text style={styles.featureText}>제휴 할인 쿠폰</Text>
            </View>
            <View style={styles.preparingFeatureItem}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureText}>프리미엄 템플릿</Text>
            </View>
            <View style={styles.preparingFeatureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>부가 기능</Text>
            </View>
          </View>

          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TossColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  
  // 헤더
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TossColors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: TossColors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // 준비중 컨테이너
  preparingContainer: {
    alignItems: 'center',
    backgroundColor: TossColors.gray[50],
    borderRadius: 24,
    padding: 40,
    marginHorizontal: 20,
  },
  preparingIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TossColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  preparingIcon: {
    fontSize: 40,
  },
  preparingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TossColors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  preparingDescription: {
    fontSize: 16,
    color: TossColors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  preparingFeatures: {
    gap: 16,
    marginBottom: 32,
  },
  preparingFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: TossColors.text.primary,
    fontWeight: '500',
  },
  comingSoonBadge: {
    backgroundColor: TossColors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  comingSoonText: {
    color: TossColors.background,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});