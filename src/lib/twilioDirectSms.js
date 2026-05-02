// src/lib/twilioDirectSms.js
// Twilio REST API 직접 연동

// Twilio 계정 정보
const TWILIO_ACCOUNT_SID =
  process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID ||
  process.env.TWILIO_ACCOUNT_SID ||
  'AC5dd31b5e03e762535d6b924d7fc75bf1';
const TWILIO_AUTH_TOKEN =
  process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN ||
  process.env.TWILIO_AUTH_TOKEN ||
  '8241502dffed02b342346e8cf671d530';
const TWILIO_MESSAGE_SERVICE_SID =
  process.env.EXPO_PUBLIC_TWILIO_MESSAGE_SERVICE_SID ||
  process.env.TWILIO_MESSAGE_SERVICE_SID ||
  'MG3b71d5e9e3b1c461f51ef67b3519266a';
const TWILIO_REQUEST_TIMEOUT_MS = 15000;

// Base64 인코딩을 위한 유틸리티
const base64Encode = (str) => {
  if (typeof btoa === 'function') {
    return btoa(str);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;

  while (i < str.length) {
    const chr1 = str.charCodeAt(i++);
    const chr2 = str.charCodeAt(i++);
    const chr3 = str.charCodeAt(i++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;

    if (Number.isNaN(chr2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (Number.isNaN(chr3)) {
      enc4 = 64;
    }

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }

  return output;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = TWILIO_REQUEST_TIMEOUT_MS) => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = setTimeout(() => {
    if (controller) controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('SMS_REQUEST_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

// Twilio REST API 직접 호출 (React Native 호환)
export const sendTwilioSms = async (phoneNumber, message) => {
  try {
    console.log('📱 Twilio SMS 발송 시작:', { phone: phoneNumber, message });

    // 전화번호 유효성 검사
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      console.error('❌ 잘못된 전화번호 형식:', phoneNumber);
      return {
        success: false,
        error: '전화번호 형식이 올바르지 않습니다.',
      };
    }

    // Twilio API 인증 헤더 생성
    const auth = base64Encode(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    // SMS 발송 요청 본문 (React Native 호환 방식)
    const formBody = [
      `To=${encodeURIComponent(phoneNumber)}`,
      `MessagingServiceSid=${encodeURIComponent(TWILIO_MESSAGE_SERVICE_SID)}`,
      `Body=${encodeURIComponent(message)}`
    ].join('&');

    console.log('🔍 Twilio API 요청 데이터:', {
      to: phoneNumber,
      messagingServiceSid: TWILIO_MESSAGE_SERVICE_SID,
      body: message,
      formBody: formBody.substring(0, 100) + '...' // 디버깅용 (일부만 표시)
    });

    const response = await fetchWithTimeout(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      }
    );

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      result = { message: responseText || 'Twilio 응답을 해석할 수 없습니다.' };
    }

    console.log('🔍 Twilio API 응답:', {
      status: response.status,
      ok: response.ok,
      result: result
    });

    if (!response.ok) {
      console.error('❌ Twilio SMS 발송 실패:', result);

      if (response.status === 401 || result.code === 20003 || String(result.message || '').toLowerCase().includes('authenticate')) {
        return {
          success: false,
          error: 'SMS 발송 계정 인증 정보가 올바르지 않습니다. Twilio 설정을 확인해주세요.',
          code: result.code || response.status,
        };
      }

      return {
        success: false,
        error: result.message || 'SMS 발송에 실패했습니다.',
        code: result.code,
      };
    }

    console.log('✅ Twilio SMS 발송 성공:', {
      sid: result.sid,
      status: result.status,
      to: result.to,
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status,
      to: result.to,
    };

  } catch (error) {
    console.error('🚨 Twilio SMS 발송 오류:', error);

    if (error?.message === 'SMS_REQUEST_TIMEOUT') {
      return {
        success: false,
        error: 'SMS 발송 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
      };
    }

    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
    };
  }
};

// 인증번호 SMS 발송 래퍼 함수
export const sendVerificationSms = async (phoneNumber, verificationCode) => {
  const message = `[정담] 인증번호는 ${verificationCode}입니다. 5분 내에 입력해주세요.`;
  
  const result = await sendTwilioSms(phoneNumber, message);
  
  if (result.success) {
    console.log(`✅ 인증번호 SMS 발송 완료: ${phoneNumber} -> ${verificationCode}`);
  } else {
    console.error(`❌ 인증번호 SMS 발송 실패: ${phoneNumber}`, result.error);
  }
  
  return result;
};

// 인증번호 생성 유틸리티
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
