// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../styles/constants';
import { supabase } from '../../lib/supabase';
import { createPhoneUserProfile } from '../../lib/smsAuth';

export default function RegisterScreen({ navigation, route }) {
  const { 
    phoneNumber, 
    originalPhone, 
    carrier, 
    name,
    verificationComplete,
    setUserInfo,
    setIsAuthenticated
  } = route.params;

  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!verificationComplete) {
      Alert.alert('오류', '인증이 완료되지 않았습니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 현재 사용자 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('🔴 No authenticated user found');
        Alert.alert('오류', '인증된 사용자를 찾을 수 없습니다.');
        return;
      }

      console.log('🟢 Authenticated user found:', user.id);

      // 사용자 프로필 생성/업데이트
      const profileResult = await createPhoneUserProfile(user, phoneNumber, {
        name,
        carrier: carrier?.name,
      });

      if (profileResult.success) {
        console.log('🟢 Profile created successfully');
        
        // AsyncStorage에 사용자 정보 저장 (핸드폰 인증 사용자)
        const userInfo = {
          userId: user.id,
          userName: name,
          userPhone: originalPhone,
          carrier: carrier?.name,
          authMethod: 'phone',
          createdAt: new Date().toISOString(),
        };
        
        try {
          await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
          await AsyncStorage.setItem('isLoggedIn', 'true');
          console.log('🟢 User info saved to AsyncStorage:', userInfo);
          
          Alert.alert(
            '가입 완료!',
            `${name}님, 정담에 오신 것을 환영합니다!`,
            [
              {
                text: '정담 시작하기',
                onPress: () => {
                  console.log('🟢 Registration complete, AsyncStorage updated');
                  // 상위 App.js의 상태를 직접 업데이트하여 즉시 앱으로 진입
                  if (setUserInfo && setIsAuthenticated) {
                    setUserInfo(userInfo);
                    setIsAuthenticated(true);
                    console.log('🔄 상위 컴포넌트 상태 업데이트 완료');
                  }
                }
              }
            ]
          );
        } catch (storageError) {
          console.error('🔴 AsyncStorage save error:', storageError);
          Alert.alert('오류', '로그인 정보 저장에 실패했습니다.');
        }
      } else {
        Alert.alert('오류', '프로필 생성에 실패했습니다.');
      }

    } catch (error) {
      console.error('Registration completion error:', error);
      Alert.alert('오류', '회원가입 완료 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* 성공 아이콘 */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          
          <Text style={styles.successTitle}>인증이 완료되었어요!</Text>
          <Text style={styles.successSubtitle}>
            이제 정담에서 경조사 관리를{'\n'}
            시작할 수 있어요
          </Text>
        </View>

        {/* 가입 정보 요약 */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>가입 정보</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>이름</Text>
              <Text style={styles.infoValue}>{name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>휴대폰</Text>
              <Text style={styles.infoValue}>{originalPhone}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="cellular" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>통신사</Text>
              <Text style={styles.infoValue}>{carrier?.name}</Text>
            </View>
          </View>
        </View>

        {/* 서비스 소개 */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>이제 이런 것들을 할 수 있어요</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="heart" size={20} color={Colors.wedding} />
            </View>
            <Text style={styles.featureText}>결혼식, 장례식 등 경조사 등록</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="people" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.featureText}>부조금 관리 및 현황 확인</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="notifications" size={20} color={Colors.success} />
            </View>
            <Text style={styles.featureText}>중요한 날짜 알림 설정</Text>
          </View>
        </View>
      </View>

      {/* 완료 버튼 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.completeButton, isLoading && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={isLoading}
        >
          <Text style={styles.completeButtonText}>
            {isLoading ? '완료 중...' : '정담 시작하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  
  // 성공 섹션
  successSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // 요약 섹션
  summarySection: {
    marginBottom: 40,
  },
  summaryCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  
  // 기능 섹션
  featuresSection: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    gap: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  
  // 버튼 섹션
  buttonSection: {
    padding: 24,
    paddingTop: 16,
  },
  completeButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonDisabled: {
    backgroundColor: Colors.gray200,
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
});