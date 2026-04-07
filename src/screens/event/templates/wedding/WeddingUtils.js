// src/screens/event/templates/wedding/WeddingUtils.js
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// 기본 이미지들
export const defaultImages = [
  require('../../../../../assets/images/aa1.png'),
  require('../../../../../assets/images/aa2.png'), 
  require('../../../../../assets/images/aa3.png'), 
  require('../../../../../assets/images/aa1.png'), 
  require('../../../../../assets/images/aa2.png'), 
  require('../../../../../assets/images/aa3.png'), 
  require('../../../../../assets/images/aa1.png'),
  require('../../../../../assets/images/aa2.png'), 
  require('../../../../../assets/images/aa3.png'), 
  require('../../../../../assets/images/aa1.png'),
  require('../../../../../assets/images/aa2.png'), 
  require('../../../../../assets/images/aa3.png'), 
  require('../../../../../assets/images/aa1.png'), 
  require('../../../../../assets/images/aa2.png'), 
  require('../../../../../assets/images/aa3.png'), 
  require('../../../../../assets/images/aa1.png'),
  require('../../../../../assets/images/aa2.png'), 
  require('../../../../../assets/images/aa3.png'), 
  require('../../../../../assets/images/aa1.png'), 
  require('../../../../../assets/images/aa2.png'), 
];

// 한국 전통 색상 팔레트
// WeddingUtils.js의 색상 팔레트 부분만 교체하세요

// 트렌디한 웨딩 색상 팔레트 - 2024/2025 트렌드
export const KoreanColors = {
  // 로맨틱 그라데이션
  romantic: {
    pink: '#FF69B4',        // 핫핑크
    lightPink: '#FFB6C1',   // 라이트핑크  
    purple: '#9B59B6',      // 퍼플
    lavender: '#E8DAEF',    // 라벤더
    coral: '#FF6B9D',       // 코랄
    peach: '#FFEAA7',       // 피치
    white: '#FFFFFF'
  },
  // 모던 미니멀
  modern: {
    primary: '#667eea',     // 일렉트릭 퍼플
    secondary: '#764ba2',   // 딥 퍼플
    accent: '#f093fb',      // 소프트 핑크
    gradient1: '#f5576c',   // 그라데이션 핑크
    gradient2: '#4facfe',   // 그라데이션 블루
    text: '#2D3436',        // 차콜
    light: '#FAFAFA'        // 화이트
  },
  // 프리미엄 엘레강트
  elegant: {
    primary: '#FF1493',     // 딥핑크
    secondary: '#FFE4E1',   // 미스티로즈
    accent: '#FF69B4',      // 핫핑크
    gold: '#FFD700',        // 골드
    rose: '#F8BBD0',        // 로즈
    blush: '#FFF5F7',       // 블러시
    text: '#2D3436',        // 다크그레이
    light: '#FAFAFA'        // 소프트화이트
  },
  // 파스텔 드림
  pastel: {
    mint: '#A8E6CF',        // 민트
    peach: '#FFD3B6',       // 피치
    lavender: '#D4A5FF',    // 라벤더
    sky: '#A8DAFF',         // 스카이
    pink: '#FFB3E6',        // 핑크
    yellow: '#FFF1B8'       // 옐로우
  }
};

// 카운트다운 계산 훅 - 완전히 안전한 버전
export const useCountdown = (targetDate, ceremonyTime) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    let target;
    
    // 날짜 처리
    if (!targetDate) {
      const defaultTarget = new Date();
      defaultTarget.setDate(defaultTarget.getDate() + 30);
      target = defaultTarget;
    } else {
      try {
        target = new Date(targetDate);
        if (isNaN(target.getTime())) {
          const defaultTarget = new Date();
          defaultTarget.setDate(defaultTarget.getDate() + 30);
          target = defaultTarget;
        }
      } catch (error) {
        console.warn('Target date parsing error:', error);
        const defaultTarget = new Date();
        defaultTarget.setDate(defaultTarget.getDate() + 30);
        target = defaultTarget;
      }
    }

    const calculateTimeLeft = () => {
      try {
        // 시간 설정
        if (ceremonyTime) {
          if (ceremonyTime instanceof Date && !isNaN(ceremonyTime.getTime())) {
            target.setHours(ceremonyTime.getHours(), ceremonyTime.getMinutes(), 0, 0);
          } else if (typeof ceremonyTime === 'string' && ceremonyTime.includes(':')) {
            const timeParts = ceremonyTime.split(':');
            if (timeParts.length >= 2) {
              const hours = parseInt(timeParts[0], 10);
              const minutes = parseInt(timeParts[1], 10);
              
              if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                target.setHours(hours, minutes, 0, 0);
              } else {
                target.setHours(14, 0, 0, 0); // 기본값 오후 2시
              }
            } else {
              target.setHours(14, 0, 0, 0); // 기본값 오후 2시
            }
          } else {
            target.setHours(14, 0, 0, 0); // 기본값 오후 2시
          }
        } else {
          target.setHours(14, 0, 0, 0); // 기본값 오후 2시
        }

        const now = new Date();
        const difference = target.getTime() - now.getTime();

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        }
      } catch (error) {
        console.warn('Countdown calculation error:', error);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, ceremonyTime]);

  return timeLeft;
};

// 달력 유틸리티 함수들
export const getCalendarData = (targetDate) => {
  try {
    const today = new Date();
    const target = new Date(targetDate);
    
    if (isNaN(target.getTime())) {
      const defaultTarget = new Date();
      defaultTarget.setMonth(defaultTarget.getMonth() + 1);
      return getCalendarDataForDate(defaultTarget);
    }
    
    return getCalendarDataForDate(target);
  } catch (error) {
    const defaultTarget = new Date();
    defaultTarget.setMonth(defaultTarget.getMonth() + 1);
    return getCalendarDataForDate(defaultTarget);
  }
};

export const getCalendarDataForDate = (date) => {
  const today = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // 달의 첫 날과 마지막 날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 달력 시작 요일 (일요일 = 0)
  const startDayOfWeek = firstDay.getDay();
  
  // 이전 달의 마지막 날들
  const prevMonth = new Date(year, month - 1, 0);
  const prevDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevDays.push({
      day: prevMonth.getDate() - i,
      isCurrentMonth: false,
      isToday: false,
      isTargetDate: false,
      date: new Date(year, month - 1, prevMonth.getDate() - i)
    });
  }
  
  // 현재 달의 날들
  const currentDays = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const currentDate = new Date(year, month, i);
    const isToday = today.toDateString() === currentDate.toDateString();
    const isTargetDate = date.toDateString() === currentDate.toDateString();
    
    currentDays.push({
      day: i,
      isCurrentMonth: true,
      isToday,
      isTargetDate,
      date: currentDate
    });
  }
  
  // 다음 달의 첫 날들 (총 42칸을 채우기 위해)
  const totalCells = 42;
  const usedCells = prevDays.length + currentDays.length;
  const nextDays = [];
  for (let i = 1; i <= totalCells - usedCells; i++) {
    nextDays.push({
      day: i,
      isCurrentMonth: false,
      isToday: false,
      isTargetDate: false,
      date: new Date(year, month + 1, i)
    });
  }
  
  return {
    year,
    month,
    monthName: firstDay.toLocaleString('ko-KR', { month: 'long' }),
    monthNameEn: firstDay.toLocaleString('en-US', { month: 'long' }),
    days: [...prevDays, ...currentDays, ...nextDays],
    targetDate: date,
    today: today
  };
};

// 이미지 URL 검증 함수 - 모든 URL 허용
export const isValidImageUrl = (url) => {
  // URL이 문자열이면 모두 허용
  return url && typeof url === 'string' && url.length > 0;
};

// 이미지 처리 유틸리티 함수들 - 안전한 버전
export const processImageArray = (images, defaultFallback = []) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    console.log('⚠️ processImageArray: 이미지 배열이 비어있음, 기본 이미지 사용');
    return defaultFallback;
  }
  
  console.log('🔍 processImageArray 입력:', images.length, '개 이미지');
  
  return images.map((img, index) => {
    console.log(`🔍 이미지 [${index}] 처리:`, typeof img, img);
    
    // 문자열 URL인 경우 - 모든 URL 형태 허용
    if (typeof img === 'string') {
      console.log(`✅ 문자열 이미지 [${index}] 사용:`, img.substring(0, 50) + '...');
      return { 
        uri: img
      };
    } 
    // 이미 객체 형태인 경우 - 로컬 파일 우선, 없으면 publicUrl
    else if (img && (img.uri || img.publicUrl)) {
      const isLocal = img.uri && (img.uri.startsWith('file://') || img.uri.startsWith('ph://') || img.uri.startsWith('assets-library://') || img.uri.startsWith('data:'));
      const uri = isLocal ? img.uri : (img.publicUrl || img.uri);
      console.log(`✅ 객체 이미지 [${index}] 사용:`, uri.substring(0, 50) + '...');
      return {
        uri: uri
      };
    } 
    // require()된 이미지인 경우
    else if (typeof img === 'object' && !img.uri && !img.publicUrl) {
      console.log(`✅ require 이미지 [${index}] 사용`);
      return img;
    }
    
    // 모든 처리 실패 시 기본 이미지
    console.log(`⚠️ 처리 실패 [${index}], 기본 이미지 사용:`, typeof img);
    return defaultFallback[index % defaultFallback.length] || defaultFallback[0] || require('../../../../../assets/images/aa1.png');
  });
};

// 카테고리별 이미지 안전하게 가져오기 - 개선된 버전
export const getCategorizedImagesSafe = (categorizedImages, userImages = []) => {
  console.log('🔍 getCategorizedImagesSafe 호출됨:', {
    hasCategorizedImages: !!categorizedImages,
    categorizedImagesType: typeof categorizedImages,
    userImagesLength: userImages?.length || 0
  });

  // categorizedImages가 이미 객체 형태로 전달된 경우
  if (categorizedImages && typeof categorizedImages === 'object') {
    console.log('📸 카테고리별 이미지 처리 중:', {
      main: categorizedImages.main?.length || 0,
      gallery: categorizedImages.gallery?.length || 0,
      groom: categorizedImages.groom?.length || 0,
      bride: categorizedImages.bride?.length || 0,
      all: categorizedImages.all?.length || 0
    });
    
    // 실제 이미지 URI 샘플 출력
    if (categorizedImages.main && categorizedImages.main.length > 0) {
      console.log('🔍 [SAMPLE] main[0]:', categorizedImages.main[0]);
    }
    if (categorizedImages.all && categorizedImages.all.length > 0) {
      console.log('🔍 [SAMPLE] all[0]:', categorizedImages.all[0]);
    }
    
    const safe = {
      main: processImageArray(categorizedImages.main, defaultImages.slice(0, 5)),
      gallery: processImageArray(categorizedImages.gallery, defaultImages.slice(5, 15)),
      groom: processImageArray(categorizedImages.groom, [defaultImages[0]]),
      bride: processImageArray(categorizedImages.bride, [defaultImages[1]]),
      all: processImageArray(categorizedImages.all || userImages, defaultImages)
    };
    
    console.log('✅ 처리된 카테고리별 이미지:', {
      main: safe.main?.length || 0,
      gallery: safe.gallery?.length || 0,
      groom: safe.groom?.length || 0,
      bride: safe.bride?.length || 0,
      all: safe.all?.length || 0
    });
    
    return safe;
  }

  // categorizedImages가 없으면 userImages로부터 추출 시도
  if (userImages && Array.isArray(userImages) && userImages.length > 0) {
    console.log('🔍 [TEMPLATE DEBUG] userImages에서 카테고리별로 분류 시도');
    
    const mainImages = userImages.filter(img => img.category === 'main');
    const galleryImages = userImages.filter(img => img.category === 'gallery');
    const groomImages = userImages.filter(img => img.category === 'groom');
    const brideImages = userImages.filter(img => img.category === 'bride');
    
    console.log('🔍 [TEMPLATE DEBUG] 분류 결과:', {
      main: mainImages.length,
      gallery: galleryImages.length,
      groom: groomImages.length,
      bride: brideImages.length
    });
    
    return {
      main: processImageArray(mainImages, defaultImages.slice(0, 5)),
      gallery: processImageArray(galleryImages, defaultImages.slice(5, 15)),
      groom: processImageArray(groomImages, [defaultImages[0]]),
      bride: processImageArray(brideImages, [defaultImages[1]]),
      all: processImageArray(userImages, defaultImages)
    };
  }

  // 기본값 반환
  console.log('🔍 [TEMPLATE DEBUG] 기본값 사용');
  return {
    main: defaultImages.slice(0, 5),
    gallery: defaultImages.slice(5, 15),
    groom: [defaultImages[0]],
    bride: [defaultImages[1]],
    all: defaultImages
  };
};

// 헬퍼 함수들 - 완전히 안전한 버전
export const formatDate = (date, options = {}) => {
  if (!date) return options.defaultDate || '날짜 미정';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return options.defaultDate || '날짜 미정';
    }
    
    if (options.format === 'english') {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', ...options
      });
    }
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', ...options
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return options.defaultDate || '날짜 미정';
  }
};

export const formatTime = (time, options = {}) => {
  const defaultTime = options.defaultTime || '오후 2시';
  
  if (!time) return defaultTime;
  
  try {
    // Date 객체인 경우
    if (time instanceof Date && !isNaN(time.getTime())) {
      return time.toLocaleTimeString('ko-KR', {
        hour: '2-digit', minute: '2-digit', hour12: true, ...options
      });
    }
    
    // 문자열인 경우
    if (typeof time === 'string' && time.includes(':')) {
      const timeParts = time.split(':');
      if (timeParts.length >= 2) {
        const date = new Date();
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          date.setHours(hours, minutes, 0, 0);
          return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit', hour12: true, ...options
          });
        }
      }
    }
    
    return defaultTime;
  } catch (error) {
    console.warn('Time formatting error:', error);
    return defaultTime;
  }
};

export const formatKoreanDate = (dateString) => {
  const defaultResult = {
    year: 2024,
    month: 11,
    day: 30,
    dayOfWeek: '토',
    full: '2024년 11월 30일 토요일'
  };
  
  if (!dateString) return defaultResult;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return defaultResult;
    }
    
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    
    return {
      year: year,
      month: parseInt(months[month]),
      day: day,
      dayOfWeek: days[dayOfWeek],
      full: `${year}년 ${parseInt(months[month])}월 ${day}일 ${days[dayOfWeek]}요일`
    };
  } catch (error) {
    console.warn('Korean date formatting error:', error);
    return defaultResult;
  }
};

export const formatKoreanTime = (timeString) => {
  const defaultTime = '오후 2시';
  
  if (!timeString) return defaultTime;
  
  try {
    // Date 객체인 경우
    if (timeString instanceof Date && !isNaN(timeString.getTime())) {
      const hour = timeString.getHours();
      const minutes = timeString.getMinutes();
      const ampm = hour >= 12 ? '오후' : '오전';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      return `${ampm} ${displayHour}시${minutes !== 0 ? ` ${minutes}분` : ''}`;
    }
    
    // 문자열인 경우
    if (typeof timeString === 'string' && timeString.includes(':')) {
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const ampm = hours >= 12 ? '오후' : '오전';
          const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
          return `${ampm} ${displayHour}시${minutes !== 0 ? ` ${minutes}분` : ''}`;
        }
      }
    }
    
    return defaultTime;
  } catch (error) {
    console.warn('Korean time formatting error:', error);
    return defaultTime;
  }
};

// 안전한 애니메이션 값 가져오기 헬퍼 함수
export const getSafeAnimValue = (animArray, index, defaultValue = 1) => {
  if (!animArray || !animArray[index]) {
    return new Animated.Value(defaultValue);
  }
  return animArray[index];
};

export { width, height };