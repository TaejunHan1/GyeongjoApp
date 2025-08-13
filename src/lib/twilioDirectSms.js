// src/lib/twilioDirectSms.js
// Twilio REST API 직접 연동

// Twilio 계정 정보
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'AC5dd31b5e03e762535d6b924d7fc75bf1';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '8241502dffed02b342346e8cf671d530';
const TWILIO_MESSAGE_SERVICE_SID = process.env.TWILIO_MESSAGE_SERVICE_SID || 'MG3b71d5e9e3b1c461f51ef67b3519266a';

// Base64 인코딩을 위한 유틸리티
const base64Encode = (str) => {
  return btoa(str);
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

    const response = await fetch(
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

    const result = await response.json();

    console.log('🔍 Twilio API 응답:', {
      status: response.status,
      ok: response.ok,
      result: result
    });

    if (!response.ok) {
      console.error('❌ Twilio SMS 발송 실패:', result);
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