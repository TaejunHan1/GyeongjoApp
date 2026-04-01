// src/lib/webSync.js - 웹 동기화 (Supabase 직접 사용)

// 웹 페이지 기본 URL (QR 코드 링크용)
const WEB_BASE_URL = 'https://contribution-web-srgt.vercel.app';

/**
 * 이벤트 데이터를 웹에 동기화
 * - Supabase에 이미 데이터가 저장되어 있으므로 별도 API 호출 불필요
 * - 웹 페이지에서 Supabase를 직접 읽도록 구성
 */
export const syncEventToWeb = async (eventData) => {
  try {
    console.log('🔄 웹 동기화 확인:', eventData.id);

    // Supabase에 이미 데이터가 저장되어 있음
    // 웹 페이지에서 Supabase를 직접 조회하므로 별도 동기화 불필요
    console.log('✅ 데이터가 Supabase에 저장되어 있음 - 웹에서 직접 조회 가능');

    return {
      success: true,
      message: 'Supabase에 데이터 저장됨',
      eventId: eventData.id
    };

  } catch (error) {
    console.error('❌ 웹 동기화 에러:', error);
    return { success: false, error: error.message };
  }
};

/**
 * QR 코드 생성 시 URL 반환
 */
export const generateQRWithSync = async (eventData) => {
  try {
    // 1. 동기화 확인
    const syncResult = await syncEventToWeb(eventData);

    if (!syncResult.success) {
      console.warn('⚠️ 동기화 확인 실패:', syncResult.error);
    }

    // 2. QR 코드 URL 생성
    const templateType = eventData.template_style || eventData.templateStyle || 'modern';
    const qrUrl = `${WEB_BASE_URL}/template/${eventData.id}?template=${templateType}`;

    console.log('🔗 QR 코드 URL 생성:', qrUrl);

    return {
      success: true,
      qrUrl: qrUrl,
      synced: syncResult.success
    };

  } catch (error) {
    console.error('❌ QR 코드 생성 에러:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 이벤트 상태 변경 시 동기화
 * - Supabase에서 직접 상태 업데이트하므로 별도 API 불필요
 */
export const syncEventStatusToWeb = async (eventId, status) => {
  try {
    console.log('🔄 이벤트 상태 동기화:', { eventId, status });

    // Supabase에서 직접 업데이트하므로 별도 API 호출 불필요
    console.log('✅ 상태가 Supabase에 저장됨');

    return {
      success: true,
      message: 'Supabase에 상태 저장됨',
      eventId,
      status
    };

  } catch (error) {
    console.error('❌ 이벤트 상태 동기화 에러:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 웹 페이지 URL 가져오기
 */
export const getWebPageUrl = (eventId, templateType = 'modern') => {
  return `${WEB_BASE_URL}/template/${eventId}?template=${templateType}`;
};

/**
 * 기부 페이지 URL 가져오기
 */
export const getContributionUrl = (eventId) => {
  return `${WEB_BASE_URL}/contribute/${eventId}`;
};

export default {
  syncEventToWeb,
  generateQRWithSync,
  syncEventStatusToWeb,
  getWebPageUrl,
  getContributionUrl
};
