// src/lib/supabase.js - 핸드폰 인증 지원 버전
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ofshqvrldcesvjtredxo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc2hxdnJsZGNlc3ZqdHJlZHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDI1MTQsImV4cCI6MjA2NDYxODUxNH0.uIfuqMP7SFvQfQXSESS9xKHWlBYeWmZwf1j_4eveZ6Q';

// 딥링크 URL 생성
const createRedirectUrl = () => {
  if (__DEV__) {
    // 개발 환경에서는 현재 IP와 포트 사용
    if (Constants.expoConfig?.hostUri) {
      return `exp://${Constants.expoConfig.hostUri}`;
    }
    // 수동으로 현재 IP와 포트 지정 (필요시 수정)
    return 'exp://192.168.219.43:8081';
  }
  
  // 프로덕션 환경에서는 커스텀 스키마 사용
  return 'gyeongjoapp://';
};


// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // React Native에서는 false로 설정
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // 초당 이벤트 수 제한
    },
  },
  global: {
    headers: {
      'x-client-info': 'gyeongjoapp',
    },
  },
});

// ===================================
// 핸드폰 번호 인증 관련 함수들
// ===================================

/**
 * 핸드폰 번호로 OTP 발송
 */
export const sendPhoneOtp = async (phoneNumber) => {
  try {
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: '인증번호 발송에 실패했습니다.' };
  }
};

/**
 * 핸드폰 OTP 인증
 */
export const verifyPhoneOtp = async (phoneNumber, token) => {
  try {
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: token,
      type: 'sms',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session, user: data.user };
  } catch (error) {
    return { success: false, error: '인증에 실패했습니다.' };
  }
};

/**
 * 핸드폰 번호로 직접 로그인 (OTP 없이)
 */
export const signInWithPhone = async (phoneNumber, password = null) => {
  try {
    
    // 임시 이메일 생성 (핸드폰 번호 기반)
    const tempEmail = `${phoneNumber.replace(/\D/g, '')}@gyeongjo.temp`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: password || 'temp_password_123',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session, user: data.user };
  } catch (error) {
    return { success: false, error: '로그인에 실패했습니다.' };
  }
};

/**
 * 핸드폰 번호로 계정 생성
 */
export const signUpWithPhone = async (phoneNumber, userInfo = {}) => {
  try {
    
    // 임시 이메일 생성 (핸드폰 번호 기반)
    const tempEmail = `${phoneNumber.replace(/\D/g, '')}@gyeongjo.temp`;
    const tempPassword = Math.random().toString(36).substring(2, 15);
    
    const { data, error } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPassword,
      options: {
        data: {
          phone: phoneNumber,
          name: userInfo.name || '',
          carrier: userInfo.carrier || '',
          auth_method: 'phone',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session, user: data.user };
  } catch (error) {
    return { success: false, error: '회원가입에 실패했습니다.' };
  }
};

// ===================================
// 기존 인증 함수들 (백업용)
// ===================================

/**
 * Google 로그인 (백업용)
 */
export const signInWithGoogle = async () => {
  try {
    
    const redirectUrl = createRedirectUrl();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: '구글 로그인에 실패했습니다.' };
  }
};

/**
 * Kakao 로그인 (백업용)
 */
export const signInWithKakao = async () => {
  try {
    
    const redirectUrl = createRedirectUrl();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: redirectUrl,
        scopes: 'profile_nickname profile_image account_email',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: '카카오 로그인에 실패했습니다.' };
  }
};

// ===================================
// 공통 인증 함수들
// ===================================

/**
 * 로그아웃
 */
export const signOut = async () => {
  try {
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
};

/**
 * 현재 사용자 세션 가져오기
 */
export const getCurrentUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, user: session?.user || null, session };
  } catch (error) {
    return { success: false, error: '사용자 정보를 가져올 수 없습니다.' };
  }
};

/**
 * 인증 상태 변화 리스너
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    
    if (session?.user) {
      const loginMethod = session.user.user_metadata?.auth_method || 
                         session.user.app_metadata?.provider || 
                         'unknown';
    }
    
    callback(event, session);
  });
};

/**
 * 사용자 프로필 업데이트
 */
export const updateUserProfile = async (updates) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: '프로필 업데이트에 실패했습니다.' };
  }
};

// ===================================
// 데이터베이스 헬퍼 함수들
// ===================================

/**
 * 테이블에서 데이터 조회
 */
export const selectData = async (table, filters = {}, options = {}) => {
  try {
    let query = supabase.from(table).select(options.select || '*');
    
    // 필터 적용
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    // 정렬
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending !== false 
      });
    }
    
    // 제한
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = options.single ? await query.single() : await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: '데이터 조회에 실패했습니다.' };
  }
};

/**
 * 테이블에 데이터 삽입
 */
export const insertData = async (table, data) => {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(Array.isArray(data) ? data : [data])
      .select();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data: Array.isArray(data) ? result : result[0] };
  } catch (error) {
    return { success: false, error: '데이터 삽입에 실패했습니다.' };
  }
};

/**
 * 테이블 데이터 업데이트
 */
export const updateData = async (table, data, filters) => {
  try {
    let query = supabase.from(table).update(data);
    
    // 필터 적용
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: result, error } = await query.select();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: '데이터 업데이트에 실패했습니다.' };
  }
};

/**
 * 테이블 데이터 삭제
 */
export const deleteData = async (table, filters) => {
  try {
    let query = supabase.from(table).delete();
    
    // 필터 적용
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { error } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: '데이터 삭제에 실패했습니다.' };
  }
};

// 기본 내보내기
export default supabase;