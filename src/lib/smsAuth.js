// src/lib/smsAuth.js - SMS 인증 관련 함수들
import { supabase } from './supabase';

// Twilio 설정
const TWILIO_ACCOUNT_SID = 'AC5dd31b5e03e762535d6b924d7fc75bf1';
const TWILIO_AUTH_TOKEN = '8241502dffed02b342346e8cf671d530';
const TWILIO_MESSAGE_SERVICE_SID = 'MG3b71d5e9e3b1c461f51ef67b3519266a';

// 인증번호 생성
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// SMS 발송 (Twilio 직접 호출)
const sendSmsWithTwilio = async (phoneNumber, code) => {
  try {
    console.log('📱 Sending SMS via Twilio to:', phoneNumber);
    
    const authString = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        MessagingServiceSid: TWILIO_MESSAGE_SERVICE_SID,
        To: phoneNumber,
        Body: `[정담] 인증번호: ${code}\n타인에게 절대 알려주지 마세요.`,
      }).toString(),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('🟢 SMS sent successfully:', data.sid);
      return { success: true, sid: data.sid };
    } else {
      console.log('🔴 SMS send failed:', data);
      return { success: false, error: data.message || 'SMS 발송 실패' };
    }
  } catch (error) {
    console.error('🔴 Twilio SMS error:', error);
    return { success: false, error: '네트워크 오류가 발생했습니다.' };
  }
};

// Supabase OTP 사용 (대안)
const sendSmsWithSupabase = async (phoneNumber) => {
  try {
    console.log('📱 Sending SMS via Supabase to:', phoneNumber);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      console.log('🔴 Supabase SMS error:', error);
      return { success: false, error: error.message };
    }

    console.log('🟢 Supabase SMS sent successfully');
    return { success: true, data };
  } catch (error) {
    console.error('🔴 Supabase SMS exception:', error);
    return { success: false, error: '인증번호 발송에 실패했습니다.' };
  }
};

// 인증번호 임시 저장소 (실제로는 안전한 저장소 사용)
const verificationCodes = new Map();

// 인증번호 발송 (메인 함수)
export const sendSmsVerification = async (phoneNumber) => {
  try {
    console.log('📱 Starting SMS verification for:', phoneNumber);
    
    // 방법 1: Supabase OTP 사용 (권장)
    const supabaseResult = await sendSmsWithSupabase(phoneNumber);
    if (supabaseResult.success) {
      return supabaseResult;
    }
    
    console.log('🟡 Supabase OTP failed, trying Twilio...');
    
    // 방법 2: Twilio 직접 사용 (백업)
    const code = generateVerificationCode();
    const twilioResult = await sendSmsWithTwilio(phoneNumber, code);
    
    if (twilioResult.success) {
      // 인증번호 임시 저장 (5분 TTL)
      verificationCodes.set(phoneNumber, {
        code,
        timestamp: Date.now(),
        attempts: 0,
      });
      
      // 5분 후 자동 삭제
      setTimeout(() => {
        verificationCodes.delete(phoneNumber);
      }, 5 * 60 * 1000);
      
      return { success: true, method: 'twilio' };
    }
    
    return { success: false, error: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    
  } catch (error) {
    console.error('🔴 SMS verification error:', error);
    return { success: false, error: '시스템 오류가 발생했습니다.' };
  }
};

// 인증번호 확인 (Supabase OTP)
export const verifyOtpWithSupabase = async (phoneNumber, token) => {
  try {
    console.log('🔍 Verifying Supabase OTP for:', phoneNumber);
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: token,
      type: 'sms',
    });

    if (error) {
      console.log('🔴 Supabase OTP verification failed:', error);
      return { success: false, error: error.message };
    }

    console.log('🟢 Supabase OTP verified successfully');
    return { success: true, session: data.session, user: data.user };
    
  } catch (error) {
    console.error('🔴 Supabase OTP verification exception:', error);
    return { success: false, error: '인증에 실패했습니다.' };
  }
};

// 인증번호 확인 (Twilio)
export const verifyCodeWithTwilio = async (phoneNumber, inputCode) => {
  try {
    console.log('🔍 Verifying Twilio code for:', phoneNumber);
    
    const stored = verificationCodes.get(phoneNumber);
    
    if (!stored) {
      return { success: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' };
    }
    
    // 5분 만료 체크
    const now = Date.now();
    const elapsed = now - stored.timestamp;
    if (elapsed > 5 * 60 * 1000) {
      verificationCodes.delete(phoneNumber);
      return { success: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' };
    }
    
    // 시도 횟수 체크
    if (stored.attempts >= 5) {
      verificationCodes.delete(phoneNumber);
      return { success: false, error: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' };
    }
    
    // 코드 확인
    if (stored.code === inputCode) {
      verificationCodes.delete(phoneNumber);
      console.log('🟢 Twilio code verified successfully');
      return { success: true };
    } else {
      stored.attempts += 1;
      verificationCodes.set(phoneNumber, stored);
      return { 
        success: false, 
        error: `인증번호가 일치하지 않습니다. (${stored.attempts}/5)` 
      };
    }
    
  } catch (error) {
    console.error('🔴 Twilio code verification exception:', error);
    return { success: false, error: '인증에 실패했습니다.' };
  }
};

// 통합 인증번호 확인 함수
export const verifyPhoneCode = async (phoneNumber, code) => {
  try {
    console.log('🔍 Starting phone verification for:', phoneNumber);
    
    // 먼저 Supabase OTP 시도
    const supabaseResult = await verifyOtpWithSupabase(phoneNumber, code);
    if (supabaseResult.success) {
      return supabaseResult;
    }
    
    console.log('🟡 Supabase OTP failed, trying Twilio verification...');
    
    // Twilio 코드 확인
    const twilioResult = await verifyCodeWithTwilio(phoneNumber, code);
    if (twilioResult.success) {
      // Twilio로 인증 성공시 Supabase에 사용자 등록
      return await createUserWithPhone(phoneNumber);
    }
    
    return twilioResult;
    
  } catch (error) {
    console.error('🔴 Phone verification error:', error);
    return { success: false, error: '인증 처리 중 오류가 발생했습니다.' };
  }
};

// 핸드폰 번호로 사용자 생성 (Twilio 인증 후)
const createUserWithPhone = async (phoneNumber, userInfo = {}) => {
  try {
    console.log('👤 Creating user with phone:', phoneNumber);
    
    // 임시 이메일 생성 (핸드폰 번호 기반)
    const tempEmail = `${phoneNumber.replace(/\D/g, '')}@gyeongjo.temp`;
    const tempPassword = Math.random().toString(36).substring(2, 15);
    
    // Supabase에 임시 계정 생성
    const { data, error } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPassword,
      options: {
        data: {
          phone: phoneNumber,
          name: userInfo.name || '',
          auth_method: 'phone',
        },
      },
    });

    if (error) {
      console.log('🔴 User creation error:', error);
      return { success: false, error: '계정 생성에 실패했습니다.' };
    }

    console.log('🟢 User created successfully with phone');
    return { success: true, session: data.session, user: data.user };
    
  } catch (error) {
    console.error('🔴 User creation exception:', error);
    return { success: false, error: '계정 생성 중 오류가 발생했습니다.' };
  }
};

// 핸드폰 번호로 기존 사용자 찾기
export const findUserByPhone = async (phoneNumber) => {
  try {
    console.log('🔍 Finding user by phone:', phoneNumber);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.log('🔴 Find user error:', error);
      return { success: false, error: error.message };
    }

    if (data) {
      console.log('🟢 User found:', data.id);
      return { success: true, user: data, exists: true };
    } else {
      console.log('🟡 User not found');
      return { success: true, user: null, exists: false };
    }
    
  } catch (error) {
    console.error('🔴 Find user exception:', error);
    return { success: false, error: '사용자 조회 중 오류가 발생했습니다.' };
  }
};

// 사용자 프로필 생성/업데이트 (핸드폰 번호 기반)
export const createPhoneUserProfile = async (user, phoneNumber, additionalInfo = {}) => {
  try {
    console.log('👤 Creating phone user profile for:', user.id);
    
    const profileData = {
      id: user.id,
      phone: phoneNumber,
      name: additionalInfo.name || user.user_metadata?.name || '',
      carrier: additionalInfo.carrier || '',
      auth_method: 'phone',
    };

    const { data, error } = await supabase
      .from('users')
      .upsert([profileData], {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.log('🔴 Profile creation error:', error);
      return { success: false, error: error.message };
    }

    console.log('🟢 Phone user profile created successfully');
    return { success: true, data: data[0] };
    
  } catch (error) {
    console.error('🔴 Profile creation exception:', error);
    return { success: false, error: '프로필 생성 중 오류가 발생했습니다.' };
  }
};