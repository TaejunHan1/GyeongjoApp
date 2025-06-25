// src/utils/index.js - 유틸리티 함수들
import { Platform, Alert, Linking } from 'react-native';

// ===================================
// 날짜 관련 유틸리티
// ===================================

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return '날짜 미정';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      return '잘못된 날짜';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };
    
    return date.toLocaleDateString('ko-KR', defaultOptions);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '날짜 오류';
  }
};

/**
 * 날짜를 간단한 형식으로 포맷팅 (MM.DD)
 */
export const formatDateShort = (dateInput) => {
  if (!dateInput) return '--';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      return '--';
    }
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${month}.${day}`;
  } catch (error) {
    console.error('Short date formatting error:', error);
    return '--';
  }
};

/**
 * 상대적 시간 표시 (몇 분 전, 몇 시간 전 등)
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '알 수 없음';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return '방금 전';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return formatDate(date, { month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return '알 수 없음';
  }
};

/**
 * D-Day 계산
 */
export const calculateDDay = (targetDate) => {
  if (!targetDate) return null;
  
  try {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const today = new Date();
    
    // 시간을 00:00:00으로 설정하여 정확한 일수 계산
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    
    const diffInMs = target.getTime() - today.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'D-Day';
    } else if (diffInDays > 0) {
      return `D-${diffInDays}`;
    } else {
      return `D+${Math.abs(diffInDays)}`;
    }
  } catch (error) {
    console.error('D-Day calculation error:', error);
    return null;
  }
};

// ===================================
// 금액 관련 유틸리티
// ===================================

/**
 * 금액을 한국 원화 형식으로 포맷팅
 */
export const formatAmount = (amount, options = {}) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0원';
  }
  
  try {
    const { 
      showUnit = true, 
      unit = '원',
      minimumFractionDigits = 0,
      maximumFractionDigits = 0 
    } = options;
    
    const formatted = new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
    
    return showUnit ? `${formatted}${unit}` : formatted;
  } catch (error) {
    console.error('Amount formatting error:', error);
    return `${amount}원`;
  }
};

/**
 * 금액을 축약형으로 포맷팅 (1만원, 10만원 등)
 */
export const formatAmountShort = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0원';
  }
  
  try {
    if (amount >= 100000000) { // 1억 이상
      return `${(amount / 100000000).toFixed(1).replace('.0', '')}억원`;
    } else if (amount >= 10000) { // 1만 이상
      return `${(amount / 10000).toFixed(1).replace('.0', '')}만원`;
    } else {
      return `${amount.toLocaleString('ko-KR')}원`;
    }
  } catch (error) {
    console.error('Short amount formatting error:', error);
    return `${amount}원`;
  }
};

/**
 * 문자열에서 숫자만 추출
 */
export const parseAmount = (amountString) => {
  if (!amountString) return 0;
  
  try {
    const numbers = amountString.toString().replace(/[^\d]/g, '');
    return parseInt(numbers) || 0;
  } catch (error) {
    console.error('Amount parsing error:', error);
    return 0;
  }
};

// ===================================
// 문자열 관련 유틸리티
// ===================================

/**
 * 전화번호 포맷팅
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  try {
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  } catch (error) {
    console.error('Phone number formatting error:', error);
    return phoneNumber;
  }
};

/**
 * 이름 마스킹 (개인정보 보호)
 */
export const maskName = (name) => {
  if (!name || name.length < 2) return name;
  
  try {
    if (name.length === 2) {
      return `${name[0]}*`;
    } else {
      const firstChar = name[0];
      const lastChar = name[name.length - 1];
      const middleMask = '*'.repeat(name.length - 2);
      return `${firstChar}${middleMask}${lastChar}`;
    }
  } catch (error) {
    console.error('Name masking error:', error);
    return name;
  }
};

/**
 * 텍스트 줄임표 처리
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  try {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength)}...`;
  } catch (error) {
    console.error('Text truncation error:', error);
    return text;
  }
};

/**
 * 빈 문자열 체크
 */
export const isEmpty = (value) => {
  return !value || value.toString().trim() === '';
};

// ===================================
// 검증 관련 유틸리티
// ===================================

/**
 * 이메일 검증
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 전화번호 검증 (한국)
 */
export const validatePhoneNumber = (phoneNumber) => {
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  const phoneRegex = /^010\d{8}$/;
  return phoneRegex.test(cleanNumber);
};

/**
 * 이름 검증
 */
export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return false;
  }
  
  // 한글, 영문만 허용
  const nameRegex = /^[가-힣a-zA-Z\s]+$/;
  return nameRegex.test(name.trim());
};

/**
 * 금액 검증
 */
export const validateAmount = (amount, minAmount = 1000) => {
  const numAmount = typeof amount === 'string' ? parseAmount(amount) : amount;
  return numAmount >= minAmount;
};

// ===================================
// 플랫폼 관련 유틸리티
// ===================================

/**
 * 플랫폼 확인
 */
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * 앱 스토어로 이동
 */
export const openAppStore = () => {
  const url = isIOS 
    ? 'https://apps.apple.com/app/id123456789' // 실제 앱 ID로 교체 필요
    : 'https://play.google.com/store/apps/details?id=com.yourcompany.gyeongjoapp';
  
  Linking.openURL(url).catch((err) => {
    console.error('App store opening error:', err);
    Alert.alert('오류', '앱 스토어를 열 수 없습니다.');
  });
};

/**
 * 외부 링크 열기
 */
export const openURL = (url) => {
  if (!url) return;
  
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        Alert.alert('오류', '링크를 열 수 없습니다.');
      }
    })
    .catch((err) => {
      console.error('URL opening error:', err);
      Alert.alert('오류', '링크를 여는 중 오류가 발생했습니다.');
    });
};

/**
 * 전화 걸기
 */
export const makePhoneCall = (phoneNumber) => {
  if (!phoneNumber) return;
  
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  const phoneUrl = `tel:${cleanNumber}`;
  
  Linking.canOpenURL(phoneUrl)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(phoneUrl);
      } else {
        Alert.alert('오류', '전화를 걸 수 없습니다.');
      }
    })
    .catch((err) => {
      console.error('Phone call error:', err);
      Alert.alert('오류', '전화 연결 중 오류가 발생했습니다.');
    });
};

// ===================================
// 에러 처리 유틸리티
// ===================================

/**
 * 에러 메시지 정규화
 */
export const normalizeError = (error) => {
  if (!error) return '알 수 없는 오류가 발생했습니다.';
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (error.error) {
    return error.error;
  }
  
  return '오류가 발생했습니다.';
};

/**
 * 개발용 로그 (프로덕션에서는 비활성화)
 */
export const devLog = (message, data = null) => {
  if (__DEV__) {
    console.log(`[DEV] ${message}`, data);
  }
};

/**
 * 에러 로그
 */
export const errorLog = (message, error = null) => {
  console.error(`[ERROR] ${message}`, error);
  
  // 프로덕션에서는 에러 추적 서비스로 전송
  if (!__DEV__) {
    // TODO: Crashlytics, Sentry 등으로 에러 전송
  }
};

// ===================================
// 배열 및 객체 유틸리티
// ===================================

/**
 * 배열이 비어있는지 확인
 */
export const isEmptyArray = (array) => {
  return !Array.isArray(array) || array.length === 0;
};

/**
 * 객체가 비어있는지 확인
 */
export const isEmptyObject = (obj) => {
  return !obj || Object.keys(obj).length === 0;
};

/**
 * 배열에서 중복 제거
 */
export const removeDuplicates = (array, key = null) => {
  if (!Array.isArray(array)) return [];
  
  if (key) {
    return array.filter((item, index, self) => 
      index === self.findIndex(t => t[key] === item[key])
    );
  }
  
  return [...new Set(array)];
};

/**
 * 배열을 특정 크기로 분할
 */
export const chunkArray = (array, size) => {
  if (!Array.isArray(array)) return [];
  
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// ===================================
// 스타일 유틸리티
// ===================================

/**
 * 조건부 스타일 적용
 */
export const conditionalStyle = (condition, trueStyle, falseStyle = {}) => {
  return condition ? trueStyle : falseStyle;
};

/**
 * 여러 스타일 병합
 */
export const mergeStyles = (...styles) => {
  return styles.filter(Boolean).reduce((merged, style) => {
    return { ...merged, ...style };
  }, {});
};

// ===================================
// 랜덤 유틸리티
// ===================================

/**
 * 랜덤 ID 생성
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 랜덤 색상 생성
 */
export const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// ===================================
// 디바운스 및 스로틀
// ===================================

/**
 * 디바운스 함수
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 스로틀 함수
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 기본 익스포트
export default {
  // 날짜
  formatDate,
  formatDateShort,
  formatRelativeTime,
  calculateDDay,
  
  // 금액
  formatAmount,
  formatAmountShort,
  parseAmount,
  
  // 문자열
  formatPhoneNumber,
  maskName,
  truncateText,
  isEmpty,
  
  // 검증
  validateEmail,
  validatePhoneNumber,
  validateName,
  validateAmount,
  
  // 플랫폼
  isIOS,
  isAndroid,
  openAppStore,
  openURL,
  makePhoneCall,
  
  // 에러
  normalizeError,
  devLog,
  errorLog,
  
  // 배열/객체
  isEmptyArray,
  isEmptyObject,
  removeDuplicates,
  chunkArray,
  
  // 스타일
  conditionalStyle,
  mergeStyles,
  
  // 랜덤
  generateId,
  generateRandomColor,
  
  // 성능
  debounce,
  throttle,
};