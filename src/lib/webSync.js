// src/lib/webSync.js - 웹 데이터베이스 동기화

const WEB_BASE_URL = 'https://contribution-web-srgt.vercel.app';

/**
 * 이벤트 데이터를 웹 데이터베이스에 동기화
 */
export const syncEventToWeb = async (eventData) => {
  try {
    console.log('🔄 웹 동기화 시작:', eventData.id);
    
    // 웹 API로 이벤트 데이터 전송
    const response = await fetch(`${WEB_BASE_URL}/api/sync-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: eventData.id,
        event_name: eventData.event_name || eventData.eventName,
        event_type: eventData.event_type || 'wedding',
        event_date: eventData.event_date || eventData.date,
        ceremony_time: eventData.ceremony_time || eventData.ceremonyTime,
        location: eventData.location,
        detailed_address: eventData.detailed_address || eventData.detailedAddress,
        groom_name: eventData.groom_name || eventData.groomName,
        bride_name: eventData.bride_name || eventData.brideName,
        groom_father_name: eventData.groom_father_name || eventData.groomFatherName,
        groom_mother_name: eventData.groom_mother_name || eventData.groomMotherName,
        bride_father_name: eventData.bride_father_name || eventData.brideFatherName,
        bride_mother_name: eventData.bride_mother_name || eventData.brideMotherName,
        primary_contact: eventData.primary_contact || eventData.primaryContact,
        secondary_contact: eventData.secondary_contact || eventData.secondaryContact,
        custom_message: eventData.custom_message || eventData.customMessage,
        template_style: eventData.template_style || eventData.templateStyle || 'modern',
        status: 'active'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 웹 동기화 완료:', result);
      return { success: true, data: result };
    } else {
      console.error('❌ 웹 동기화 실패:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.error('❌ 웹 동기화 에러:', error);
    return { success: false, error: error.message };
  }
};

/**
 * QR 코드 생성 시 자동으로 웹 동기화
 */
export const generateQRWithSync = async (eventData) => {
  try {
    // 1. 웹에 이벤트 데이터 동기화
    const syncResult = await syncEventToWeb(eventData);
    
    if (!syncResult.success) {
      console.warn('⚠️ 웹 동기화 실패했지만 QR 코드는 생성:', syncResult.error);
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
 * 이벤트 상태 변경 시 웹 동기화
 */
export const syncEventStatusToWeb = async (eventId, status) => {
  try {
    const response = await fetch(`${WEB_BASE_URL}/api/sync-event-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: eventId,
        status: status
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 이벤트 상태 동기화 완료:', result);
      return { success: true, data: result };
    } else {
      console.error('❌ 이벤트 상태 동기화 실패:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.error('❌ 이벤트 상태 동기화 에러:', error);
    return { success: false, error: error.message };
  }
};

export default {
  syncEventToWeb,
  generateQRWithSync,
  syncEventStatusToWeb
};