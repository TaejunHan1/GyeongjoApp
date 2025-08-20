// src/screens/auth/VerificationScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../styles/constants';
import { 
  verifyPhoneCode, 
  sendSmsVerification, 
  createPhoneUserProfile,
  findUserByPhone
} from '../../lib/smsAuth';

export default function VerificationScreen({ navigation, route }) {
  const { 
    phoneNumber, 
    originalPhone, 
    carrier, 
    name, 
    isSignUp,
    setUserInfo,
    setIsAuthenticated
  } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5분
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  // 타이머 효과
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // 자동 포커스 이동
  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // 다음 입력 필드로 포커스 이동
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // 코드가 완성되면 자동 인증
    if (newCode.every(digit => digit) && !isLoading) {
      handleVerification(newCode.join(''));
    }
  };

  // 백스페이스 처리
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 인증번호 확인
  const handleVerification = async (verificationCode = null) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('알림', '6자리 인증번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 Verifying code:', codeToVerify);
      
      const result = await verifyPhoneCode(phoneNumber, codeToVerify);

      if (result.success) {
        console.log('🟢 Phone verification successful');
        
        // Supabase OTP로 인증된 경우 (세션이 자동 생성됨)
        if (result.session && result.user) {
          console.log('🟢 Supabase session created automatically');
          
          // 사용자 프로필 생성/업데이트
          await createPhoneUserProfile(result.user, phoneNumber, {
            name,
            carrier: carrier?.name,
          });
          
          // 인증 완료 - 자동으로 홈으로 이동됨 (Auth state change에 의해)
          Alert.alert('인증 완료', '회원가입이 완료되었습니다!');
          return;
        }
        
        // Twilio로 인증된 경우 또는 추가 정보 필요한 경우
        if (isSignUp) {
          navigation.navigate('Register', {
            phoneNumber,
            originalPhone,
            carrier,
            name,
            verificationComplete: true,
            setUserInfo,
            setIsAuthenticated,
          });
        } else {
          // 기존 사용자 로그인 - AsyncStorage에 정보 저장
          try {
            console.log('🔍 Finding existing user profile...');
            const userProfile = await findUserByPhone(phoneNumber);
            
            if (userProfile.success && userProfile.exists) {
              const user = userProfile.user;
              const userInfo = {
                userId: user.id,
                userName: user.name || name,
                userPhone: originalPhone,
                carrier: user.carrier || carrier?.name,
                authMethod: 'phone',
                loginAt: new Date().toISOString(),
              };
              
              await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
              await AsyncStorage.setItem('isLoggedIn', 'true');
              console.log('🟢 Existing user login info saved to AsyncStorage:', userInfo);
              
              Alert.alert('로그인 완료', '로그인되었습니다!', [
                {
                  text: '확인',
                  onPress: () => {
                    console.log('✅ 로그인 완료 - AsyncStorage 업데이트됨');
                    // 상위 App.js의 상태를 직접 업데이트하여 즉시 앱으로 진입
                    if (setUserInfo && setIsAuthenticated) {
                      setUserInfo(userInfo);
                      setIsAuthenticated(true);
                      console.log('🔄 상위 컴포넌트 상태 업데이트 완료 (기존 사용자)');
                    }
                  }
                }
              ]);
            } else {
              // 사용자 프로필이 없다면 회원가입으로 이동
              navigation.navigate('Register', {
                phoneNumber,
                originalPhone,
                carrier,
                name,
                verificationComplete: true,
                setUserInfo,
                setIsAuthenticated,
              });
            }
          } catch (error) {
            console.error('🔴 Login AsyncStorage error:', error);
            Alert.alert('오류', '로그인 정보 저장에 실패했습니다.');
          }
        }
        
      } else {
        Alert.alert('인증 실패', result.error || '인증번호가 올바르지 않습니다.');
        // 실패시 코드 초기화
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('오류', '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증번호 재발송
  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setCode(['', '', '', '', '', '']);

    try {
      const result = await sendSmsVerification(phoneNumber);
      
      if (result.success) {
        setTimeLeft(300);
        setCanResend(false);
        Alert.alert('재발송 완료', '인증번호가 재발송되었습니다.');
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('재발송 실패', result.error || '인증번호 재발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('오류', '재발송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인증번호 입력</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble-ellipses" size={48} color={Colors.primary} />
          </View>
          
          <Text style={styles.title}>인증번호가 발송되었어요</Text>
          <Text style={styles.subtitle}>
            {originalPhone}로{'\n'}
            발송된 6자리 번호를 입력해주세요
          </Text>

          {/* 인증번호 입력 */}
          <View style={styles.codeInputContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  isLoading && styles.codeInputDisabled,
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text.slice(-1), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          {/* 타이머 및 재발송 */}
          <View style={styles.timerContainer}>
            {timeLeft > 0 ? (
              <Text style={styles.timerText}>
                {formatTime(timeLeft)} 후 재발송 가능
              </Text>
            ) : (
              <TouchableOpacity 
                onPress={handleResend}
                disabled={isLoading}
                style={styles.resendButton}
              >
                <Text style={styles.resendButtonText}>
                  {isLoading ? '발송 중...' : '인증번호 재발송'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 안내 문구 */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              • 인증번호가 오지 않나요?{'\n'}
              • 스팸 차단, 문자 차단 설정을 확인해주세요{'\n'}
              • 통신사 사정에 따라 늦어질 수 있어요
            </Text>
          </View>
        </View>

        {/* 완료 버튼 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!code.every(digit => digit) || isLoading) && styles.verifyButtonDisabled
            ]}
            onPress={() => handleVerification()}
            disabled={!code.every(digit => digit) || isLoading}
          >
            <Text style={[
              styles.verifyButtonText,
              (!code.every(digit => digit) || isLoading) && styles.verifyButtonTextDisabled
            ]}>
              {isLoading ? '확인 중...' : '인증 완료'}
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  
  // 인증번호 입력
  codeInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  codeInputDisabled: {
    opacity: 0.6,
  },
  
  // 타이머
  timerContainer: {
    marginBottom: 40,
  },
  timerText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  resendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  
  // 안내 박스
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // 버튼
  buttonSection: {
    padding: 24,
    paddingTop: 16,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: Colors.gray200,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  verifyButtonTextDisabled: {
    color: Colors.gray400,
  },
});