// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';
import { findUserByPhone, sendSmsVerification } from '../../lib/smsAuth';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text) => {
    // 숫자만 추출
    const numbers = text.replace(/[^\d]/g, '');
    
    // 최대 11자리까지만 허용
    if (numbers.length > 11) return phoneNumber;
    
    // 형식 적용
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
  };

  const validatePhoneNumber = () => {
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    
    if (numbers.length !== 11) {
      Alert.alert('알림', '올바른 핸드폰 번호를 입력해주세요.');
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (!validatePhoneNumber()) return;
    
    setIsLoading(true);
    
    try {
      const numbers = phoneNumber.replace(/[^\d]/g, '');
      const formattedPhone = `+82${numbers.slice(1)}`; // +82로 시작하는 국제 형식
      
      console.log('🔍 Checking if user exists:', formattedPhone);
      
      // 사용자 존재 여부 확인
      const userResult = await findUserByPhone(formattedPhone);
      
      if (!userResult.success) {
        Alert.alert('오류', '사용자 확인 중 오류가 발생했습니다.');
        return;
      }
      
      if (!userResult.exists) {
        Alert.alert(
          '가입되지 않은 번호',
          '해당 번호로 가입된 계정이 없습니다.\n회원가입을 진행하시겠어요?',
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '회원가입', 
              onPress: () => navigation.navigate('PhoneAuth', { isSignUp: true })
            }
          ]
        );
        return;
      }
      
      console.log('🟢 User exists, sending SMS verification');
      
      // 기존 사용자에게 인증번호 발송
      const smsResult = await sendSmsVerification(formattedPhone);
      
      if (smsResult.success) {
        navigation.navigate('Verification', {
          phoneNumber: formattedPhone,
          originalPhone: phoneNumber,
          carrier: null,
          name: null,
          isSignUp: false,
        });
      } else {
        Alert.alert('오류', smsResult.error || '인증번호 발송에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('오류', '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpPress = () => {
    navigation.navigate('PhoneAuth', { isSignUp: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>로그인</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
          {/* 로고 */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>다시 만나서 반가워요!</Text>
            <Text style={styles.subtitle}>
              등록하신 핸드폰 번호로{'\n'}
              로그인해주세요
            </Text>
          </View>

          {/* 핸드폰 번호 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>핸드폰 번호</Text>
            <TextInput
              style={styles.textInput}
              placeholder="010-0000-0000"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
              keyboardType="numeric"
              placeholderTextColor={Colors.gray400}
              editable={!isLoading}
            />
          </View>

          {/* 안내 문구 */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              등록하신 번호로 인증번호가 발송됩니다.
            </Text>
          </View>

          {/* 회원가입 링크 */}
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>
              아직 정담 회원이 아니신가요?{' '}
            </Text>
            <TouchableOpacity onPress={handleSignUpPress}>
              <Text style={styles.signupLink}>회원가입하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 로그인 버튼 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.loginButton,
              (!phoneNumber || isLoading) && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={!phoneNumber || isLoading}
          >
            <Text style={[
              styles.loginButtonText,
              (!phoneNumber || isLoading) && styles.loginButtonTextDisabled
            ]}>
              {isLoading ? '확인 중...' : '로그인'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
    padding: 24,
  },
  
  // 로고 섹션
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
    marginTop: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // 입력 필드
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.gray200,
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // 안내 박스
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // 회원가입 섹션
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  
  // 버튼
  buttonSection: {
    padding: 24,
    paddingTop: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: Colors.gray200,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  loginButtonTextDisabled: {
    color: Colors.gray400,
  },
});