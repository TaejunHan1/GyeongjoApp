// src/lib/solapiSms.js
// SOLAPI SMS REST API 직접 연동
import CryptoJS from 'crypto-js';

const SOLAPI_API_KEY =
  process.env.EXPO_PUBLIC_SOLAPI_API_KEY ||
  process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET =
  process.env.EXPO_PUBLIC_SOLAPI_API_SECRET ||
  process.env.SOLAPI_API_SECRET;
const SOLAPI_SENDER_PHONE_NUMBER = (
  process.env.EXPO_PUBLIC_SOLAPI_SENDER_PHONE_NUMBER ||
  process.env.SOLAPI_SENDER_PHONE_NUMBER ||
  ''
).replace(/[^\d]/g, '');

const SOLAPI_SEND_URL = 'https://api.solapi.com/messages/v4/send';
const SOLAPI_REQUEST_TIMEOUT_MS = 15000;

const generateSalt = () => {
  return `${Date.now()}${Math.random().toString(36).slice(2, 12)}`;
};

const createAuthorizationHeader = () => {
  const date = new Date().toISOString();
  const salt = generateSalt();
  const signature = CryptoJS.HmacSHA256(date + salt, SOLAPI_API_SECRET).toString(CryptoJS.enc.Hex);

  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
};

const normalizeKoreanPhoneNumber = (phoneNumber) => {
  const value = String(phoneNumber || '').replace(/[^\d+]/g, '');

  if (value.startsWith('+82')) {
    return `0${value.slice(3)}`.replace(/[^\d]/g, '');
  }

  if (value.startsWith('82')) {
    return `0${value.slice(2)}`.replace(/[^\d]/g, '');
  }

  return value.replace(/[^\d]/g, '');
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = SOLAPI_REQUEST_TIMEOUT_MS) => {
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
      throw new Error('SOLAPI_REQUEST_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const sendSolapiSms = async (phoneNumber, message) => {
  try {
    const to = normalizeKoreanPhoneNumber(phoneNumber);

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER_PHONE_NUMBER) {
      return {
        success: false,
        error: 'SOLAPI 문자 발송 설정이 누락되었습니다.',
      };
    }

    if (!/^01\d{8,9}$/.test(to)) {
      return {
        success: false,
        error: '수신 휴대폰 번호 형식이 올바르지 않습니다.',
      };
    }

    if (!/^01\d{8,9}$/.test(SOLAPI_SENDER_PHONE_NUMBER)) {
      return {
        success: false,
        error: '발신번호 형식이 올바르지 않습니다.',
      };
    }

    const body = {
      message: {
        to,
        from: SOLAPI_SENDER_PHONE_NUMBER,
        text: message,
      },
    };

    console.log('📱 SOLAPI SMS 발송 시작:', {
      to,
      from: SOLAPI_SENDER_PHONE_NUMBER,
      textLength: message.length,
    });

    const response = await fetchWithTimeout(SOLAPI_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: createAuthorizationHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      result = { message: responseText || 'SOLAPI 응답을 해석할 수 없습니다.' };
    }

    console.log('🔍 SOLAPI API 응답:', {
      status: response.status,
      ok: response.ok,
      result,
    });

    if (!response.ok) {
      const errorMessage =
        result.errorMessage ||
        result.message ||
        result.error ||
        '문자 발송에 실패했습니다.';

      return {
        success: false,
        error: errorMessage,
        code: result.errorCode || result.code || response.status,
      };
    }

    const messageId =
      result.messageId ||
      result.groupId ||
      result?.message?.messageId ||
      result?.message?.message_id ||
      null;

    return {
      success: true,
      sid: messageId,
      messageId,
      result,
    };
  } catch (error) {
    console.error('🚨 SOLAPI SMS 발송 오류:', error);

    if (error?.message === 'SOLAPI_REQUEST_TIMEOUT') {
      return {
        success: false,
        error: '문자 발송 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
      };
    }

    return {
      success: false,
      error: '문자 발송 중 네트워크 오류가 발생했습니다.',
    };
  }
};

export const sendVerificationSms = async (phoneNumber, verificationCode) => {
  const message = `[정담] 인증번호는 ${verificationCode}입니다. 5분 내에 입력해주세요.`;
  const result = await sendSolapiSms(phoneNumber, message);

  if (result.success) {
    console.log(`✅ SOLAPI 인증번호 SMS 발송 완료: ${phoneNumber}`);
  } else {
    console.error(`❌ SOLAPI 인증번호 SMS 발송 실패: ${phoneNumber}`, result.error);
  }

  return result;
};

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
