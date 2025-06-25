// src/lib/supabaseHelper.js - 컬럼명 수정
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 통합 사용자 정보 가져오기 (AsyncStorage + Supabase Auth 지원)
 */
export const getCurrentUserInfo = async () => {
  try {
    console.log('🔍 getCurrentUserInfo 시작');
    
    // 1순위: AsyncStorage에서 폰 인증 사용자 확인
    const storedUserInfo = await AsyncStorage.getItem('userInfo');
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true' && storedUserInfo) {
      const userInfo = JSON.parse(storedUserInfo);
      console.log('✅ AsyncStorage 사용자 확인:', {
        userId: userInfo.userId,
        userName: userInfo.userName,
        phone: userInfo.phone
      });
      
      return {
        success: true,
        user: {
          id: userInfo.userId,
          phone: userInfo.phone,
          name: userInfo.userName,
          email: `${userInfo.phone.replace(/\D/g, '')}@phone.temp`, // 임시 이메일
          auth_method: 'phone'
        },
        source: 'asyncstorage'
      };
    }
    
    // 2순위: Supabase Auth 세션 확인
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('❌ 인증된 사용자 없음');
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    console.log('✅ Supabase 사용자 확인:', {
      userId: user.id,
      email: user.email,
      phone: user.phone
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
        auth_method: 'supabase'
      },
      source: 'supabase'
    };
    
  } catch (error) {
    console.error('❌ getCurrentUserInfo 오류:', error);
    return {
      success: false,
      error: '사용자 정보를 가져올 수 없습니다.'
    };
  }
};

/**
 * 사용자 이벤트 목록 가져오기 (통합 인증 지원)
 */
export const getUserEvents = async (passedUserInfo = null) => {
  try {
    console.log('🔍 getUserEvents 시작');
    
    // 전달받은 userInfo 우선 사용
    let currentUser = null;
    
    if (passedUserInfo?.id) {
      console.log('✅ 전달받은 userInfo 사용:', {
        id: passedUserInfo.id,
        name: passedUserInfo.name
      });
      currentUser = passedUserInfo;
    } else {
      // userInfo가 없으면 직접 확인
      const userResult = await getCurrentUserInfo();
      if (!userResult.success) {
        throw new Error(userResult.error);
      }
      currentUser = userResult.user;
    }
    
    console.log('👤 이벤트 조회 대상 사용자:', {
      id: currentUser.id,
      name: currentUser.name,
      auth_method: currentUser.auth_method || 'unknown'
    });
    
    // events 테이블에서 사용자의 이벤트 조회 (user_id 컬럼만 사용)
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        event_name,
        event_type,
        event_date,
        main_person_name,
        status,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 이벤트 조회 오류:', error);
      throw error;
    }

    console.log(`✅ 이벤트 조회 완료: ${data?.length || 0}개`);
    
    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ getUserEvents error:', error);
    return {
      success: false,
      error: error.message || '이벤트를 불러올 수 없습니다.'
    };
  }
};

/**
 * 새 이벤트 생성 (통합 인증 지원)
 */
export const createEvent = async (eventData) => {
  try {
    console.log('🔍 createEvent 시작');
    
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;
    console.log('👤 이벤트 생성 사용자:', {
      id: currentUser.id,
      name: currentUser.name,
      auth_method: currentUser.auth_method
    });

    // 이벤트 데이터 구성 (user_id만 사용)
    const newEvent = {
      ...eventData,
      user_id: currentUser.id,
      status: 'active',
      created_at: new Date().toISOString()
    };

    console.log('🔍 생성할 이벤트 데이터:', newEvent);

    const { data, error } = await supabase
      .from('events')
      .insert([newEvent])
      .select()
      .single();

    if (error) {
      console.error('❌ 이벤트 생성 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 생성 완료:', data.id);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ createEvent error:', error);
    return {
      success: false,
      error: error.message || '이벤트 생성에 실패했습니다.'
    };
  }
};

/**
 * 이벤트 수정 (통합 인증 지원)
 */
export const updateEvent = async (eventId, updates) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUser.id)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ 이벤트 수정 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 수정 완료:', eventId);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ updateEvent error:', error);
    return {
      success: false,
      error: error.message || '이벤트 수정에 실패했습니다.'
    };
  }
};

/**
 * 이벤트 삭제 (통합 인증 지원)
 */
export const deleteEvent = async (eventId) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

    // 먼저 관련 부조금 삭제 (있다면)
    try {
      await supabase
        .from('contributions')
        .delete()
        .eq('event_id', eventId);
    } catch (contribError) {
      console.log('⚠️ 부조금 삭제 중 오류 (무시):', contribError);
    }

    // 이벤트 삭제
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('id', eventId);

    if (error) {
      console.error('❌ 이벤트 삭제 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 삭제 완료:', eventId);
    
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ deleteEvent error:', error);
    return {
      success: false,
      error: error.message || '이벤트 삭제에 실패했습니다.'
    };
  }
};

/**
 * 특정 이벤트 상세 정보 조회 (통합 인증 지원) - 🔧 컬럼명 수정
 */
export const getEventDetail = async (eventId) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

    // 🔧 수정: message → notes로 변경
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        contributions (
          id,
          contributor_name,
          amount,
          relation_to,
          notes,
          is_confirmed,
          is_manual_entry,
          created_at
        )
      `)
      .eq('user_id', currentUser.id)
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('❌ 이벤트 상세 조회 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 상세 조회 완료:', eventId);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ getEventDetail error:', error);
    return {
      success: false,
      error: error.message || '이벤트 정보를 불러올 수 없습니다.'
    };
  }
};

/**
 * 활성 이벤트만 조회
 */
export const getActiveEvents = async () => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 활성 이벤트 조회 오류:', error);
      throw error;
    }

    console.log('✅ 활성 이벤트 조회 완료:', data?.length || 0);
    
    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ getActiveEvents error:', error);
    return {
      success: false,
      error: error.message || '활성 이벤트를 불러올 수 없습니다.'
    };
  }
};

/**
 * 부조금 추가
 */
export const addContribution = async (contributionData) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const { data, error } = await supabase
      .from('contributions')
      .insert([{
        ...contributionData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ 부조금 추가 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 추가 완료:', data.id);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ addContribution error:', error);
    return {
      success: false,
      error: error.message || '부조금 추가에 실패했습니다.'
    };
  }
};

/**
 * 특정 이벤트의 부조금 목록 조회 - 🔧 컬럼명 수정
 */
export const getEventContributions = async (eventId) => {
  try {
    // 🔧 수정: message → notes로 변경
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        id,
        contributor_name,
        amount,
        relation_to,
        notes,
        is_confirmed,
        is_manual_entry,
        created_at,
        updated_at
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 부조금 목록 조회 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 목록 조회 완료:', data?.length || 0);
    
    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ getEventContributions error:', error);
    return {
      success: false,
      error: error.message || '부조금 목록을 불러올 수 없습니다.'
    };
  }
};

/**
 * 부조금 수정
 */
export const updateContribution = async (contributionId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', contributionId)
      .select()
      .single();

    if (error) {
      console.error('❌ 부조금 수정 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 수정 완료:', contributionId);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ updateContribution error:', error);
    return {
      success: false,
      error: error.message || '부조금 수정에 실패했습니다.'
    };
  }
};

/**
 * 부조금 삭제
 */
export const deleteContribution = async (contributionId) => {
  try {
    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('id', contributionId);

    if (error) {
      console.error('❌ 부조금 삭제 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 삭제 완료:', contributionId);
    
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ deleteContribution error:', error);
    return {
      success: false,
      error: error.message || '부조금 삭제에 실패했습니다.'
    };
  }
};

/**
 * 유틸리티: 금액 포맷팅
 */
export const formatAmount = (amount) => {
  if (!amount || amount === 0) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

/**
 * 유틸리티: 날짜 포맷팅
 */
export const formatDate = (dateString) => {
  if (!dateString) return '날짜 미정';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * 유틸리티: 상대 시간 포맷팅
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '알 수 없음';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
};

/**
 * 디버깅용: 사용자 정보 확인
 */
export const debugUserInfo = async () => {
  try {
    console.log('🔍 === 사용자 정보 디버깅 ===');
    
    // AsyncStorage 확인
    const storedUserInfo = await AsyncStorage.getItem('userInfo');
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    console.log('📱 AsyncStorage:', {
      isLoggedIn,
      userInfo: storedUserInfo ? JSON.parse(storedUserInfo) : null
    });
    
    // Supabase Auth 확인
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('🔐 Supabase Auth:', {
      user: user ? { id: user.id, email: user.email, phone: user.phone } : null,
      error: error?.message
    });
    
    // 통합 함수 결과
    const userResult = await getCurrentUserInfo();
    console.log('🔧 getCurrentUserInfo 결과:', userResult);
    
    console.log('🔍 === 디버깅 완료 ===');
  } catch (error) {
    console.error('❌ 디버깅 오류:', error);
  }
};