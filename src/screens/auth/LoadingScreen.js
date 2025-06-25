// src/screens/auth/LoadingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/constants';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  // 임시 로그인 함수 (개발용)
  const handleTempLogin = async () => {
    try {
      setLoading(true);
      
      // 임시로 익명 세션 생성
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.log('Login error:', error.message);
        // 에러가 있어도 임시로 진행
        Alert.alert('알림', '임시 로그인으로 진행합니다.');
      }
      
      // 성공적으로 로그인 처리됨 (App.js에서 자동으로 화면 전환됨)
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('알림', '임시 로그인으로 진행합니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('준비중', 'Google 로그인 기능을 준비 중입니다.\n임시 로그인을 사용해주세요.');
  };

  const handleKakaoLogin = async () => {
    // Alert.alert('준비중', 'Kakao 로그인 기능을 준비 중입니다.\n임시 로그인을 사용해주세요.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 로고 영역 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="gift" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.appTitle}>경조사 관리</Text>
          <Text style={styles.appSubtitle}>
            결혼식, 장례식 부조금을{'\n'}
            간편하게 관리해보세요
          </Text>
        </View>

        {/* 로그인 버튼 영역 */}
        <View style={styles.buttonContainer}>
          {/* 임시 로그인 버튼 (개발용) */}
          <TouchableOpacity
            style={[styles.loginButton, styles.tempButton]}
            onPress={handleTempLogin}
            disabled={loading}
          >
            <Ionicons name="flash" size={24} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? '로그인 중...' : '임시 로그인 (개발용)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, styles.googleButton]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={24} color="#fff" />
            <Text style={styles.buttonText}>Google로 시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, styles.kakaoButton]}
            onPress={handleKakaoLogin}
            disabled={loading}
          >
            <View style={styles.kakaoIcon}>
              <Text style={styles.kakaoText}>카</Text>
            </View>
            <Text style={[styles.buttonText, { color: '#000' }]}>
              Kakao로 시작하기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 하단 정보 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            로그인하면 서비스 이용약관 및{'\n'}
            개인정보 처리방침에 동의하게 됩니다
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.15,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  buttonContainer: {
    gap: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: BorderRadius.md,
    gap: 12,
  },
  tempButton: {
    backgroundColor: Colors.success,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  kakaoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoText: {
    color: '#FEE500',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.xs,
  },
});