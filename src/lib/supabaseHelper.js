// src/lib/supabaseHelper.js - 결혼식 특화 최종 개선 버전 (전체 코드)
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
 * 사용자 이벤트 목록 가져오기 (통합 인증 지원 및 에러 수정)
 */
export const getUserEvents = async (passedUserInfo = null) => {
  try {
    console.log('🔍 getUserEvents 시작');
    
    let currentUser = null;
    
    if (passedUserInfo?.id) {
      console.log('✅ 전달받은 userInfo 사용:', {
        id: passedUserInfo.id,
        name: passedUserInfo.name
      });
      currentUser = passedUserInfo;
    } else {
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
    
    // 🔥 FIX: 'wedding_style' 컬럼이 존재하지 않으므로 SELECT 문에서 제거합니다.
    // 이 컬럼은 additional_info JSONB 필드 안에 저장됩니다.
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        event_name,
        event_type,
        event_date,
        ceremony_time,
        main_person_name,
        groom_name,
        bride_name,
        location,
        template_style,
        status,
        created_at,
        updated_at,
        user_id,
        custom_message,
        additional_info
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
 * 새 이벤트 생성 (결혼식 특화)
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

    let processedEventData = {
      ...eventData,
      user_id: currentUser.id,
      status: 'active',
      is_finalized: false,
      created_at: new Date().toISOString()
    };

    if (eventData.event_type === 'wedding') {
      if (!eventData.groom_name || !eventData.bride_name) {
        throw new Error('신랑과 신부 이름은 필수입니다.');
      }
      if (!eventData.main_person_name) {
        processedEventData.main_person_name = `${eventData.groom_name}, ${eventData.bride_name}`;
      }
      if (!eventData.event_name) {
        processedEventData.event_name = `${eventData.groom_name} ♥ ${eventData.bride_name} 결혼식`;
      }
      processedEventData.additional_info = {
        ...eventData.additional_info,
        // wedding_style은 이제 template_style로 관리되므로 여기서는 제거하거나 다른 용도로 사용
        reception_time: eventData.reception_time,
        created_via: 'app_v2.2',
        version: '2.2'
      };
    }

    console.log('🔍 생성할 이벤트 데이터:', processedEventData);

    const { data, error } = await supabase
      .from('events')
      .insert([processedEventData])
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
 * 이벤트 수정 (결혼식 특화)
 */
export const updateEvent = async (eventId, updates) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

    let processedUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.event_type === 'wedding' || updates.groom_name || updates.bride_name) {
      if (updates.groom_name && updates.bride_name) {
        processedUpdates.main_person_name = `${updates.groom_name}, ${updates.bride_name}`;
      }
      if (updates.groom_name && updates.bride_name && !updates.event_name) {
        processedUpdates.event_name = `${updates.groom_name} ♥ ${updates.bride_name} 결혼식`;
      }
    }

    const { data, error } = await supabase
      .from('events')
      .update(processedUpdates)
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

    try {
      await supabase
        .from('contributions')
        .delete()
        .eq('event_id', eventId);
    } catch (contribError) {
      console.log('⚠️ 부조금 삭제 중 오류 (무시):', contribError);
    }

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
 * 특정 이벤트 상세 정보 조회 (결혼식 특화)
 */
export const getEventDetail = async (eventId) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

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
          created_at,
          updated_at
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
    
    if (data.event_type === 'wedding') {
      if (data.additional_info?.wedding_style) {
        data.wedding_style = data.additional_info.wedding_style;
      }
      if (data.additional_info?.reception_time) {
        data.reception_time = data.additional_info.reception_time;
      }
    }
    
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
 * 결혼식 전용 이벤트 조회
 */
export const getWeddingEvents = async () => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

    const { data, error } = await supabase
      .from('wedding_events_view') // 뷰가 존재한다고 가정
      .select('*')
      .eq('user_id', currentUser.id)
      .order('event_date', { ascending: false });

    if (error) {
      console.error('❌ 결혼식 이벤트 조회 오류(뷰):', error);
      return getUserEvents(); // 뷰가 없으면 일반 쿼리로 대체
    }

    console.log('✅ 결혼식 이벤트 조회 완료:', data?.length || 0);
    
    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ getWeddingEvents error:', error);
    return getUserEvents();
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
 * 특정 이벤트의 부조금 목록 조회
 */
export const getEventContributions = async (eventId) => {
  try {
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
 * 이벤트 통계 조회 (결혼식 특화)
 */
export const getEventStatistics = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .select('amount, is_confirmed, relation_to')
      .eq('event_id', eventId);

    if (error) {
      console.error('❌ 이벤트 통계 조회 오류:', error);
      throw error;
    }

    const totalContributions = data.length;
    const totalAmount = data.reduce((sum, contrib) => sum + (contrib.amount || 0), 0);
    const confirmedCount = data.filter(contrib => contrib.is_confirmed).length;
    const pendingCount = totalContributions - confirmedCount;
    
    const relationStats = data.reduce((acc, contrib) => {
      const relation = contrib.relation_to || '기타';
      if (!acc[relation]) {
        acc[relation] = { count: 0, amount: 0 };
      }
      acc[relation].count += 1;
      acc[relation].amount += contrib.amount || 0;
      return acc;
    }, {});

    console.log('✅ 이벤트 통계 조회 완료');
    
    return {
      success: true,
      data: {
        totalContributions,
        totalAmount,
        confirmedCount,
        pendingCount,
        averageAmount: totalContributions > 0 ? Math.round(totalAmount / totalContributions) : 0,
        relationStats
      }
    };

  } catch (error) {
    console.error('❌ getEventStatistics error:', error);
    return {
      success: false,
      error: error.message || '통계 조회에 실패했습니다.'
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
 * 유틸리티: 시간 포맷팅
 */
export const formatTime = (timeString) => {
  if (!timeString) return '시간 미정';
  
  if (typeof timeString === 'string' && timeString.includes(':')) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${isPM ? '오후' : '오전'} ${displayHour}:${minutes}`;
  }
  
  const date = new Date(timeString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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
 * 유틸리티: D-Day 계산
 */
export const calculateDDay = (eventDateString) => {
  if (!eventDateString) return null;
  
  const eventDate = new Date(eventDateString);
  const today = new Date();
  
  eventDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = eventDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
};

/**
 * 디버깅용: 사용자 정보 확인
 */
export const debugUserInfo = async () => {
  try {
    console.log('🔍 === 사용자 정보 디버깅 ===');
    
    const storedUserInfo = await AsyncStorage.getItem('userInfo');
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    console.log('📱 AsyncStorage:', {
      isLoggedIn,
      userInfo: storedUserInfo ? JSON.parse(storedUserInfo) : null
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('🔐 Supabase Auth:', {
      user: user ? { id: user.id, email: user.email, phone: user.phone } : null,
      error: error?.message
    });
    
    const userResult = await getCurrentUserInfo();
    console.log('🔧 getCurrentUserInfo 결과:', userResult);
    
    console.log('🔍 === 디버깅 완료 ===');
  } catch (error) {
    console.error('❌ 디버깅 오류:', error);
  }
};