// src/screens/auth/PhoneAuthScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { sendVerificationSms, generateVerificationCode } from '../../lib/twilioDirectSms';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// 토스 스타일 커스텀 모달 컴포넌트
const CustomModal = ({ visible, onClose, title, message, buttons }) => {
  const modalAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(modalAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(modalAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose} // Android 뒤로가기 처리
    >
      <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: modalAnim }] }]}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <View style={styles.modalButtons}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButton,
                    button.primary && styles.modalButtonPrimary,
                    buttons.length === 1 && styles.modalButtonSingle,
                  ]}
                  onPress={() => {
                    onClose(); // 먼저 모달 닫기
                    // 약간의 딜레이 후에 액션 실행 (모달 애니메이션이 끝난 후)
                    setTimeout(() => {
                      button.onPress && button.onPress();
                    }, 200);
                  }}
                >
                  <Text style={[styles.modalButtonText, button.primary && styles.modalButtonTextPrimary]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function PhoneAuthScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isSignUp: initialIsSignUp = true } = route.params || {};

  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('phone');
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '', buttons: [] });
  
  // 실시간 중복 검사용 상태 변수들
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isDuplicatePhone, setIsDuplicatePhone] = useState(false);
  const [duplicateCheckMessage, setDuplicateCheckMessage] = useState('');

  // 애니메이션 값들
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const verificationFadeAnim = useRef(new Animated.Value(0)).current;
  const verificationSlideAnim = useRef(new Animated.Value(50)).current;
  
  // 하트 주변 떠다니는 애니메이션
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;

  // 입력 필드 참조
  const phoneInputRef = useRef(null);
  const verificationInputRef = useRef(null);
  const nameInputRef = useRef(null);
  
  // 떠다니는 애니메이션 시작
  useEffect(() => {
    const createFloatingAnimation = (animValue, duration, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      createFloatingAnimation(floatingAnim1, 3000, 0),
      createFloatingAnimation(floatingAnim2, 4000, 1000),
      createFloatingAnimation(floatingAnim3, 5000, 2000),
    ];

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, []);

  // 사용자 정보 저장 및 Supabase 세션 생성
  const saveUserInfoAndCreateSession = async (userInfo) => {
    try {
      // 1. AsyncStorage에 저장
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      await AsyncStorage.setItem('isLoggedIn', 'true');
      console.log('✅ 사용자 정보 AsyncStorage에 저장 완료:', userInfo);
      
      // 2. Supabase Auth 세션도 생성 (AppNavigator에서 일관된 인증 상태 유지)
      try {
        // Supabase에 더미 세션 생성 또는 기존 방식 유지
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.log('⚠️ Supabase 더미 세션 생성 실패:', error.message);
        } else {
          console.log('✅ Supabase 더미 세션 생성 성공');
        }
      } catch (supabaseError) {
        console.log('⚠️ Supabase 세션 처리 오류:', supabaseError.message);
        // Supabase 오류는 무시하고 AsyncStorage만으로 진행
      }
      
    } catch (error) {
      console.error('❌ 사용자 정보 저장 실패:', error);
    }
  };

  // 커스텀 모달 표시/숨기기 함수
  const showModal = (title, message, buttons) => {
    setModalConfig({ visible: true, title, message, buttons });
  };
  const hideModal = () => setModalConfig(prev => ({ ...prev, visible: false }));

  // 핸드폰 번호 형식 자동 변환
  const formatPhoneNumber = (text) => {
    const numbers = text.replace(/[^\d]/g, '');
    if (numbers.length > 11) return phoneNumber;
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  // 실시간 중복 검사 함수
  const checkPhoneDuplicate = async (formattedPhone) => {
    if (!isSignUp) return;
    
    setIsCheckingDuplicate(true);
    setIsDuplicatePhone(false);
    setDuplicateCheckMessage('');

    try {
      console.log('🔍 실시간 중복 검사 시작 (public.users):', formattedPhone);
      
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('phone', formattedPhone)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('중복 검사 오류:', error);
        setDuplicateCheckMessage('확인 중 오류');
        return;
      }

      if (existingUser) {
        console.log('✅ 기존 회원 확인됨:', existingUser);
        setIsDuplicatePhone(true);
        setDuplicateCheckMessage('가입된 번호');
      } else {
        console.log('❌ 신규 회원 확인됨');
        setIsDuplicatePhone(false);
        setDuplicateCheckMessage('사용 가능');
      }
    } catch (error) {
      console.error('🚨 중복 검사 오류:', error);
      setDuplicateCheckMessage('확인 중 오류');
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // 핸드폰 번호 입력 처리
  const handlePhoneNumberChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    
    const numbers = formatted.replace(/[^\d]/g, '');
    
    if (numbers.length < 11) {
      setIsDuplicatePhone(false);
      setDuplicateCheckMessage('');
    }
    
    if (numbers.length === 11) {
      Keyboard.dismiss();
      
      if (isSignUp) {
        const formattedPhone = `+82${numbers.slice(1)}`;
        checkPhoneDuplicate(formattedPhone);
      }
    }
  };

  const handleVerificationCodeChange = (text) => {
    const numbers = text.replace(/[^\d]/g, '');
    if (numbers.length <= 6) {
      setVerificationCode(numbers);
      if (numbers.length === 6) Keyboard.dismiss();
    }
  };

  // SMS 인증번호 발송
  const sendSmsCode = async (phoneNumber) => {
    try {
      console.log('📱 Twilio SMS 인증번호 발송 시작:', phoneNumber);
      
      const verificationCode = generateVerificationCode();
      console.log('🔢 생성된 인증번호:', verificationCode);
      
      await supabase
        .from('sms_verifications')
        .delete()
        .eq('phone', phoneNumber)
        .eq('is_verified', false);
      
      const smsResult = await sendVerificationSms(phoneNumber, verificationCode);
      
      if (!smsResult.success) {
        console.error('❌ Twilio SMS 발송 실패:', smsResult.error);
        return { 
          success: false, 
          error: smsResult.error || 'SMS 발송에 실패했습니다.' 
        };
      }
      
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('sms_verifications')
        .insert([{
          phone: phoneNumber,
          verification_code: verificationCode,
          expires_at: expiresAt,
          twilio_sid: smsResult.sid
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ 인증번호 DB 저장 오류:', error);
        return { success: false, error: '인증번호 저장 중 오류가 발생했습니다.' };
      }
      
      console.log('✅ Twilio SMS 발송 및 DB 저장 완료');
      return { success: true };
      
    } catch (error) {
      console.error('🚨 SMS 발송 프로세스 오류:', error);
      return { success: false, error: '인증번호 발송 중 오류가 발생했습니다.' };
    }
  };
  
  // 인증번호 입력 화면으로 애니메이션 전환
  const animateToVerification = () => {
    setVerificationCode('');
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setStep('verification');
      Animated.parallel([
        Animated.timing(verificationFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(verificationSlideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        verificationInputRef.current?.focus();
      });
    });
  };

  // 인증번호 받기 요청 처리
  const handleSendVerification = async () => {
    if (isLoading) return;
    
    if (isSignUp && !name.trim()) {
      showModal('이름을 입력해주세요', '정담에서 사용할 이름을 입력해주세요.', [{ text: '확인', primary: true }]);
      return;
    }
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    if (numbers.length !== 11) {
      showModal('휴대폰 번호를 확인해주세요', '올바른 휴대폰 번호를 입력해주세요.', [{ text: '확인', primary: true }]);
      return;
    }
    
    if (isSignUp && isDuplicatePhone) {
      showModal(
        '이미 가입된 번호예요',
        '로그인 화면에서 계속하실까요?',
        [
          { text: '취소' },
          { text: '로그인하기', primary: true, onPress: () => setIsSignUp(false) },
        ]
      );
      return;
    }
    
    setIsLoading(true);
    
    const formattedPhone = `+82${numbers.slice(1)}`;

    try {
      console.log('📱 SMS 인증번호 발송 요청:', formattedPhone);
      
      const result = await sendSmsCode(formattedPhone);
      
      if (result.success) {
        animateToVerification();
      } else {
        showModal('인증번호 발송 실패', result.error || '잠시 후 다시 시도해주세요.', [{ text: '확인', primary: true }]);
      }
    } catch (error) {
      console.error('🚨 인증 프로세스 오류:', error);
      showModal('오류가 발생했어요', '네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.', [{ text: '확인', primary: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  // SMS 인증 코드 검증
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6 || isLoading) return;
    
    setIsLoading(true);
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    const formattedPhone = `+82${numbers.slice(1)}`;
    
    try {
      console.log('🔍 SMS 인증번호 검증 시작:', { phone: formattedPhone, code: verificationCode });
      
      const { data: verificationData, error: selectError } = await supabase
        .from('sms_verifications')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('verification_code', verificationCode)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (selectError || !verificationData) {
        console.log('❌ 잘못된 인증번호 또는 만료됨:', selectError);
        
        showModal('인증번호가 맞지 않아요', '다시 한번 확인해주세요.', [{ text: '다시 입력', onPress: () => setVerificationCode('') }]);
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('sms_verifications')
        .update({ 
          is_verified: true, 
          attempts_count: verificationData.attempts_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', verificationData.id);

      if (updateError) {
        console.error('❌ 인증 상태 업데이트 오류:', updateError);
        showModal('인증 중 오류 발생', '잠시 후 다시 시도해주세요.', [{ text: '확인', primary: true }]);
        setIsLoading(false);
        return;
      }

      console.log('✅ SMS 인증 성공');

      let userName = name.trim();
      let userId = null;

      if (isSignUp) {
        console.log('✨ 신규 사용자 생성 중...');
        
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, name')
          .eq('phone', formattedPhone)
          .single();

        if (existingUser) {
          userId = existingUser.id;
          userName = existingUser.name;
          console.log('✅ 기존 사용자로 로그인:', userId);
        } else {
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
              name: userName,
              phone: formattedPhone,
              phone_verified: true,
              provider: 'phone'
            }])
            .select()
            .single();

          if (insertError) {
            console.error('❌ 사용자 생성 오류:', insertError);
            showModal('회원가입 실패', '사용자 정보 저장 중 오류가 발생했습니다.', [{ text: '확인', primary: true }]);
            setIsLoading(false);
            return;
          }

          userId = newUser.id;
          userName = newUser.name;
          console.log('✅ 새 사용자 생성 완료:', userId);
        }
      } else {
        console.log('🔍 기존 사용자 조회 중...');
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id, name')
          .eq('phone', formattedPhone)
          .single();

        if (fetchError || !existingUser) {
          console.error('❌ 사용자 조회 오류:', fetchError);
          showModal('로그인 실패', '등록된 사용자를 찾을 수 없습니다.', [{ text: '확인', primary: true }]);
          setIsLoading(false);
          return;
        }

        userId = existingUser.id;
        userName = existingUser.name;
        
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId);

        console.log('✅ 기존 사용자 로그인 완료:', userId);
      }

      const userInfo = {
        userId,
        userName,
        phone: formattedPhone,
        isLoggedIn: true,
        loginTime: new Date().toISOString()
      };
      
      // 로그인 완료 후 AsyncStorage에 저장하고 App.js로 이동 처리
      await saveUserInfoAndCreateSession(userInfo);

      showModal(
        '인증 완료! 🎉',
        `${userName}님, ${isSignUp ? '환영합니다!' : '다시 만나서 반가워요!'}`,
        [{ 
          text: '정담 시작하기', 
          primary: true, 
          onPress: () => {
            console.log('✅ 로그인 완료 - 앱 재시작 또는 홈으로 이동');
            
            // 1. 먼저 모든 Auth 스택을 리셋하고 Welcome으로 돌아감
            // App.js가 AsyncStorage 변화를 감지해서 자동으로 AppNavigator로 전환할 것임
            try {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }] // AuthNavigator 내의 Welcome 화면으로
              });
              console.log('✅ Welcome 화면으로 리셋 완료');
            } catch (resetError) {
              console.log('⚠️ Welcome 리셋 실패, goBack 시도:', resetError);
              // 리셋이 안되면 단순히 뒤로가기
              navigation.goBack();
            }
          }
        }]
      );
      
    } catch (error) {
      console.error('🚨 SMS 인증 중 오류:', error);
      showModal('네트워크 오류', '인터넷 연결을 확인하고 다시 시도해주세요.', [{ text: '확인', primary: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    if (step === 'verification') {
      Animated.parallel([
        Animated.timing(verificationFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(verificationSlideAnim, { toValue: 50, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setStep('phone');
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      });
    } else {
      navigation.goBack();
    }
  };

  const handleModeSwitch = () => {
    const newIsSignUp = !isSignUp;
    setIsSignUp(newIsSignUp);
    
    setIsDuplicatePhone(false);
    setDuplicateCheckMessage('');
    
    if (newIsSignUp) {
      if (phoneNumber.replace(/[^\d]/g, '').length === 11) {
        const numbers = phoneNumber.replace(/[^\d]/g, '');
        const formattedPhone = `+82${numbers.slice(1)}`;
        checkPhoneDuplicate(formattedPhone);
      }
    } else {
      setName('');
    }
  };

  const handleSwitchToLogin = () => {
    setIsSignUp(false);
    setIsDuplicatePhone(false);
    setDuplicateCheckMessage('');
    setName('');
  };

  const handleMainButtonPress = () => {
    if (isSignUp && isDuplicatePhone) {
      handleSwitchToLogin();
    } else {
      handleSendVerification();
    }
  };

  const getMainButtonText = () => {
    if (isSignUp && isDuplicatePhone) {
      return '로그인하기';
    }
    return '인증번호 받기';
  };

  const isMainButtonDisabled = () => {
    if (isLoading || isCheckingDuplicate) return true;
    
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    if (numbers.length !== 11) return true;
    
    if (isSignUp && !name.trim()) return true;
    
    return false;
  };

  const renderPhoneStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.topSection}>
        {/* 하트 아이콘과 떠다니는 애니메이션 */}
        <View style={styles.iconContainer}>
          {/* 떠다니는 원들 */}
          <Animated.View style={[
            styles.floatingCircle, 
            styles.floatingCircle1,
            {
              transform: [
                { 
                  translateX: floatingAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 25]
                  })
                },
                { 
                  translateY: floatingAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, 15]
                  })
                }
              ],
              opacity: floatingAnim1.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.6, 0.3]
              })
            }
          ]} />
          
          <Animated.View style={[
            styles.floatingCircle, 
            styles.floatingCircle2,
            {
              transform: [
                { 
                  translateX: floatingAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, -10]
                  })
                },
                { 
                  translateY: floatingAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 20]
                  })
                }
              ],
              opacity: floatingAnim2.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.5, 0.2]
              })
            }
          ]} />
          
          <Animated.View style={[
            styles.floatingCircle, 
            styles.floatingCircle3,
            {
              transform: [
                { 
                  translateX: floatingAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-5, 15]
                  })
                },
                { 
                  translateY: floatingAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, -5]
                  })
                }
              ],
              opacity: floatingAnim3.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 0.7, 0.4]
              })
            }
          ]} />
          
          {/* 하트 아이콘 */}
          <Ionicons name="heart" size={40} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>
          {isSignUp ? '정담과 함께\n마음을 나눠보세요' : '다시 만나서\n반가워요!'}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp ? '간단한 정보로 바로 시작할 수 있어요' : '휴대폰 번호로 빠르게 로그인하세요'}
        </Text>
      </View>
      
      <View style={styles.formSection}>
        {isSignUp && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름</Text>
            <TextInput 
              ref={nameInputRef} 
              style={styles.textInput} 
              placeholder="이름을 입력해주세요" 
              placeholderTextColor="#A0A8B0"
              value={name} 
              onChangeText={setName} 
              returnKeyType="next" 
              onSubmitEditing={() => phoneInputRef.current?.focus()} 
            />
          </View>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>휴대폰 번호</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput 
              ref={phoneInputRef} 
              style={styles.textInput} 
              placeholder="010-1234-5678" 
              placeholderTextColor="#A0A8B0"
              value={phoneNumber} 
              onChangeText={handlePhoneNumberChange} 
              keyboardType="numeric" 
              maxLength={13} 
              returnKeyType="done" 
              onSubmitEditing={handleMainButtonPress} 
            />
            
            {/* 중복 검사 상태 표시 - 간단한 텍스트 */}
            {isSignUp && phoneNumber.replace(/[^\d]/g, '').length === 11 && (
              <View style={styles.statusContainer}>
                {isCheckingDuplicate ? (
                  <View style={styles.statusRow}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.statusText}>확인중</Text>
                  </View>
                ) : duplicateCheckMessage ? (
                  <View style={styles.statusRow}>
                    <Ionicons 
                      name={isDuplicatePhone ? "close-circle" : "checkmark-circle"} 
                      size={16} 
                      color={isDuplicatePhone ? '#FF6B6B' : '#20C65A'} 
                    />
                    <Text style={[
                      styles.statusText, 
                      { color: isDuplicatePhone ? '#FF6B6B' : '#20C65A' }
                    ]}>
                      {duplicateCheckMessage}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[
            styles.primaryButton, 
            isMainButtonDisabled() && styles.primaryButtonDisabled
          ]} 
          onPress={handleMainButtonPress} 
          disabled={isMainButtonDisabled()}
        >
          {isLoading || isCheckingDuplicate ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>{getMainButtonText()}</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.switchSection}>
          <Text style={styles.switchText}>
            {isSignUp ? '이미 회원이신가요?' : '아직 회원이 아니신가요?'}
          </Text>
          <TouchableOpacity onPress={handleModeSwitch} style={styles.switchButton}>
            <Text style={styles.switchButtonText}>
              {isSignUp ? '로그인하기' : '회원가입하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderVerificationStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: verificationFadeAnim, transform: [{ translateY: verificationSlideAnim }] }]}>
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          {/* 떠다니는 원들 */}
          <Animated.View style={[
            styles.floatingCircle, 
            styles.floatingCircle1,
            {
              transform: [
                { 
                  translateX: floatingAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 28]
                  })
                },
                { 
                  translateY: floatingAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 18]
                  })
                }
              ],
              opacity: floatingAnim1.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.6, 0.3]
              })
            }
          ]} />
          
          <Animated.View style={[
            styles.floatingCircle, 
            styles.floatingCircle2,
            {
              transform: [
                { 
                  translateX: floatingAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [25, -12]
                  })
                },
                { 
                  translateY: floatingAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 25]
                  })
                }
              ],
              opacity: floatingAnim2.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.5, 0.2]
              })
            }
          ]} />
          
          <Animated.View style={[
            styles.floatingCircle, 
            styles.floatingCircle3,
            {
              transform: [
                { 
                  translateX: floatingAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 18]
                  })
                },
                { 
                  translateY: floatingAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, -8]
                  })
                }
              ],
              opacity: floatingAnim3.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 0.7, 0.4]
              })
            }
          ]} />
          
          {/* 메시지 아이콘 */}
          <Ionicons name="chatbubble-ellipses" size={40} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>인증번호를{'\n'}확인해주세요</Text>
        <Text style={styles.subtitle}>{phoneNumber}로 발송된{'\n'}6자리 인증번호를 입력해주세요</Text>
      </View>
      
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>인증번호</Text>
          <TextInput 
            ref={verificationInputRef} 
            style={[styles.textInput, styles.verificationInput]} 
            placeholder="123456" 
            placeholderTextColor="#A0A8B0"
            value={verificationCode} 
            onChangeText={handleVerificationCodeChange} 
            keyboardType="number-pad" 
            maxLength={6} 
            textAlign="center" 
            returnKeyType="done" 
            onSubmitEditing={handleVerifyCode} 
          />
        </View>
        
        <TouchableOpacity style={styles.resendButton} onPress={handleSendVerification}>
          <Text style={styles.resendButtonText}>인증번호를 받지 못하셨나요?</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[
            styles.primaryButton, 
            verificationCode.length !== 6 || isLoading ? styles.primaryButtonDisabled : {}
          ]} 
          onPress={handleVerifyCode} 
          disabled={verificationCode.length !== 6 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>인증완료</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* 헤더 - 상단 시계와 겹치지 않도록 수정 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'verification' ? '휴대폰 인증' : (isSignUp ? '회원가입' : '로그인')}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'phone' ? renderPhoneStep() : renderVerificationStep()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CustomModal 
        visible={modalConfig.visible} 
        onClose={hideModal} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        buttons={modalConfig.buttons} 
      />
    </SafeAreaView>
  );
}

// 수정된 스타일시트
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  
  // 헤더 위치 수정 - 상단 시계와 겹치지 않도록
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 35, // iOS/Android 동일
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4'
  },
  
  backButton: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  },
  
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: Colors.textPrimary,
    letterSpacing: -0.3
  },
  
  scrollContent: { 
    flexGrow: 1, 
    padding: 24 
  },
  
  stepContainer: { 
    flex: 1, 
    justifyContent: 'space-between',
    minHeight: height - 150
  },
  
  topSection: {
    alignItems: 'center',
    paddingTop: 20
  },
  
  // 아이콘 컨테이너 - 떠다니는 애니메이션 포함
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    position: 'relative',
    overflow: 'visible', // 떠다니는 원들이 밖으로 나갈 수 있도록
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // 떠다니는 원들 스타일
  floatingCircle: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    borderRadius: 50,
    zIndex: -1 // 아이콘 뒤로
  },
  
  floatingCircle1: {
    width: 10,
    height: 10,
    top: -15,
    left: 20,
  },
  
  floatingCircle2: {
    width: 8,
    height: 8,
    top: 15,
    right: 25,
  },
  
  floatingCircle3: {
    width: 6,
    height: 6,
    bottom: 10,
    left: 30,
  },
  
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: Colors.textPrimary, 
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
    letterSpacing: -0.4
  },
  
  subtitle: { 
    fontSize: 16, 
    color: Colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 40,
    fontWeight: '400'
  },
  
  formSection: {
    flex: 1,
    paddingVertical: 20
  },
  
  inputGroup: { 
    marginBottom: 24
  },
  
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: Colors.textPrimary, 
    marginBottom: 8,
    letterSpacing: -0.2
  },
  
  phoneInputContainer: {
    position: 'relative'
  },
  
  textInput: { 
    height: 56, 
    backgroundColor: '#F8F9FA', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    fontSize: 16, 
    color: Colors.textPrimary, 
    borderWidth: 1, 
    borderColor: '#E5E8EB',
    fontWeight: '500'
  },
  
  verificationInput: { 
    textAlign: 'center', 
    fontSize: 24, 
    letterSpacing: 8, 
    fontWeight: '700',
    color: Colors.primary
  },
  
  // 상태 표시 간소화
  statusContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
    paddingRight: 4
  },
  
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  
  bottomSection: {
    paddingTop: 20
  },
  
  primaryButton: { 
    height: 56, 
    backgroundColor: Colors.primary, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 24
  },
  
  primaryButtonDisabled: { 
    backgroundColor: '#E5E8EB'
  },
  
  primaryButtonText: { 
    color: Colors.white, 
    fontSize: 17, 
    fontWeight: '700',
    letterSpacing: -0.3
  },
  
  resendButton: { 
    alignSelf: 'center', 
    padding: 12,
    borderRadius: 8
  },
  
  resendButtonText: { 
    color: Colors.primary, 
    fontSize: 14, 
    fontWeight: '600'
  },
  
  switchSection: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 4
  },
  
  switchText: { 
    fontSize: 14, 
    color: Colors.textSecondary,
    fontWeight: '400'
  },
  
  switchButton: {
    padding: 8,
    borderRadius: 6
  },
  
  switchButtonText: { 
    color: Colors.primary, 
    fontWeight: '700', 
    fontSize: 14
  },
  
  // 모달 스타일들 (기존 유지)
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  
  modalContainer: { 
    width: '100%', 
    maxWidth: 340, 
    backgroundColor: Colors.white, 
    borderRadius: 20, 
    overflow: 'hidden' 
  },
  
  modalContent: { 
    padding: 24, 
    alignItems: 'center' 
  },
  
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: Colors.textPrimary, 
    marginBottom: 8, 
    textAlign: 'center'
  },
  
  modalMessage: { 
    fontSize: 16, 
    color: Colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 24
  },
  
  modalButtons: { 
    flexDirection: 'row', 
    width: '100%', 
    gap: 12 
  },
  
  modalButton: { 
    flex: 1, 
    height: 50, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F2F4F6'
  },
  
  modalButtonPrimary: { 
    backgroundColor: Colors.primary
  },
  
  modalButtonSingle: { 
    flex: 1 
  },
  
  modalButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.textPrimary 
  },
  
  modalButtonTextPrimary: { 
    color: Colors.white 
  }
});