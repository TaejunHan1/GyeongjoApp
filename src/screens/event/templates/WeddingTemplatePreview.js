// src/screens/event/templates/WeddingTemplatePreview.js - 카테고리별 이미지 올바른 사용 버전

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Easing,
  Platform,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Modal,
  PanResponder,
  Share,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 기본 이미지들
const defaultImages = [
  require('../../../../assets/images/aa1.png'),
  require('../../../../assets/images/aa2.png'), 
  require('../../../../assets/images/aa3.png'), 
  require('../../../../assets/images/aa1.png'), 
  require('../../../../assets/images/aa2.png'), 
  require('../../../../assets/images/aa3.png'), 
  require('../../../../assets/images/aa1.png'),
  require('../../../../assets/images/aa2.png'), 
  require('../../../../assets/images/aa3.png'), 
  require('../../../../assets/images/aa1.png'),
  require('../../../../assets/images/aa2.png'), 
  require('../../../../assets/images/aa3.png'), 
  require('../../../../assets/images/aa1.png'), 
  require('../../../../assets/images/aa2.png'), 
  require('../../../../assets/images/aa3.png'), 
  require('../../../../assets/images/aa1.png'),
  require('../../../../assets/images/aa2.png'), 
  require('../../../../assets/images/aa3.png'), 
  require('../../../../assets/images/aa1.png'), 
  require('../../../../assets/images/aa2.png'), 
];

// 한국 전통 색상 팔레트
const KoreanColors = {
  // 전통 한복 색상
  dancheong: {
    red: '#E53E3E',
    blue: '#3182CE', 
    yellow: '#D69E2E',
    green: '#38A169',
    white: '#FFFFFF'
  },
  // 모던 한국 웨딩 색상
  modern: {
    primary: '#8B4513',    // 따뜻한 브라운
    secondary: '#F7E7CE',  // 크림
    accent: '#E8B4A0',     // 로즈골드
    text: '#2D3748',       // 다크 그레이
    light: '#FAF5F0'       // 아이보리
  },
  // 우아한 색상
  elegant: {
    primary: '#704139',    // 깊은 브라운
    secondary: '#E2C2B9',  // 베이지 핑크
    accent: '#D4AF37',     // 골드
    text: '#1A202C',
    light: '#FFF8F3'
  }
};

// 카운트다운 계산 훅 - 완전히 안전한 버전
const useCountdown = (targetDate, ceremonyTime) => {
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
const getCalendarData = (targetDate) => {
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

const getCalendarDataForDate = (date) => {
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

// 이미지 처리 유틸리티 함수들
const processImageArray = (images, defaultFallback = []) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return defaultFallback;
  }
  
  return images.map(img => {
    if (typeof img === 'string') {
      return { uri: img };
    } else if (img && img.uri) {
      return img;
    } else if (typeof img === 'object' && !img.uri) {
      return img; // 이미 require()된 이미지
    }
    return defaultFallback[0] || require('../../../../assets/images/aa1.png');
  });
};

// 카테고리별 이미지 안전하게 가져오기
const getCategorizedImagesSafe = (categorizedImages, userImages = []) => {

  // categorizedImages가 이미 객체 형태로 전달된 경우
  if (categorizedImages && typeof categorizedImages === 'object') {
    const safe = {
      main: processImageArray(categorizedImages.main, defaultImages.slice(0, 5)),
      gallery: processImageArray(categorizedImages.gallery, defaultImages.slice(5, 15)),
      groom: processImageArray(categorizedImages.groom, [defaultImages[0]]),
      bride: processImageArray(categorizedImages.bride, [defaultImages[1]]),
      all: processImageArray(categorizedImages.all || userImages, defaultImages)
    };
    
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

// 모던 다크 달력 컴포넌트
const ModernDarkCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);
  
  return (
    <View style={[styles.modernCalendar, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        style={styles.modernCalendarContainer}
      >
        <View style={styles.modernCalendarHeader}>
          <Text style={styles.modernCalendarTitle}>
            {calendarData.monthNameEn} {calendarData.year}
          </Text>
        </View>
        
        <View style={styles.modernCalendarWeekDays}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[
              styles.modernCalendarWeekDay,
              (index === 0 || index === 6) && styles.modernCalendarWeekendDay
            ]}>
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.modernCalendarGrid}>
          {calendarData.days.map((dayData, index) => (
            <View key={index} style={styles.modernCalendarDayContainer}>
              {dayData.isTargetDate ? (
                <Animated.View style={[
                  styles.modernCalendarDay,
                  styles.modernCalendarTargetDay,
                  {
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1]
                      })
                    }],
                    shadowOpacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.7]
                    })
                  }
                ]}>
                  <Text style={styles.modernCalendarTargetDayText}>{dayData.day}</Text>
                  <Text style={styles.modernCalendarDDayText}>💖</Text>
                </Animated.View>
              ) : (
                <View style={[
                  styles.modernCalendarDay,
                  dayData.isToday && styles.modernCalendarToday,
                  !dayData.isCurrentMonth && styles.modernCalendarOtherMonth
                ]}>
                  <Text style={[
                    styles.modernCalendarDayText,
                    dayData.isToday && styles.modernCalendarTodayText,
                    !dayData.isCurrentMonth && styles.modernCalendarOtherMonthText,
                    (index % 7 === 0 || index % 7 === 6) && styles.modernCalendarWeekendText
                  ]}>
                    {dayData.day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// 한국 전통 달력 컴포넌트
const KoreanElegantCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);
  
  return (
    <View style={[styles.koreanCalendar, style]}>
      <LinearGradient
        colors={[KoreanColors.elegant.light, KoreanColors.elegant.secondary]}
        style={styles.koreanCalendarContainer}
      >
        <View style={styles.koreanCalendarHeader}>
          <View style={styles.koreanCalendarDecoLine} />
          <Text style={styles.koreanCalendarTitle}>
            {calendarData.year}년 {calendarData.monthName}
          </Text>
          <View style={styles.koreanCalendarDecoLine} />
        </View>
        
        <View style={styles.koreanCalendarWeekDays}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[
              styles.koreanCalendarWeekDay,
              (index === 0 || index === 6) && styles.koreanCalendarWeekendDay
            ]}>
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.koreanCalendarGrid}>
          {calendarData.days.map((dayData, index) => (
            <View key={index} style={styles.koreanCalendarDayContainer}>
              {dayData.isTargetDate ? (
                <Animated.View style={[
                  styles.koreanCalendarDay,
                  styles.koreanCalendarTargetDay,
                  {
                    shadowColor: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [KoreanColors.elegant.accent, KoreanColors.elegant.primary]
                    }),
                    shadowOpacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8]
                    })
                  }
                ]}>
                  <Text style={styles.koreanCalendarTargetDayText}>{dayData.day}</Text>
                  <Text style={styles.koreanCalendarDDayText}>💗</Text>
                </Animated.View>
              ) : (
                <View style={[
                  styles.koreanCalendarDay,
                  dayData.isToday && styles.koreanCalendarToday,
                  !dayData.isCurrentMonth && styles.koreanCalendarOtherMonth
                ]}>
                  <Text style={[
                    styles.koreanCalendarDayText,
                    dayData.isToday && styles.koreanCalendarTodayText,
                    !dayData.isCurrentMonth && styles.koreanCalendarOtherMonthText,
                    (index % 7 === 0) && styles.koreanCalendarSundayText,
                    (index % 7 === 6) && styles.koreanCalendarSaturdayText
                  ]}>
                    {dayData.day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// 빈티지 앱 달력 컴포넌트
const VintageAppCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);
  
  return (
    <View style={[styles.vintageCalendar, style]}>
      <View style={styles.vintageCalendarContainer}>
        <LinearGradient
          colors={['#6c5ce7', '#a29bfe']}
          style={styles.vintageCalendarHeader}
        >
          <Text style={styles.vintageCalendarTitle}>
            {calendarData.monthNameEn} {calendarData.year}
          </Text>
          <View style={styles.vintageCalendarHeaderDeco}>
            <Text style={styles.vintageCalendarEmojiLeft}>📅</Text>
            <Text style={styles.vintageCalendarEmojiRight}>💝</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.vintageCalendarContent}>
          <View style={styles.vintageCalendarWeekDays}>
            {weekDays.map((day, index) => (
              <Text key={index} style={[
                styles.vintageCalendarWeekDay,
                (index === 0 || index === 6) && styles.vintageCalendarWeekendDay
              ]}>
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.vintageCalendarGrid}>
            {calendarData.days.map((dayData, index) => (
              <View key={index} style={styles.vintageCalendarDayContainer}>
                {dayData.isTargetDate ? (
                  <Animated.View style={[
                    styles.vintageCalendarDay,
                    styles.vintageCalendarTargetDay,
                    {
                      transform: [{
                        translateY: bounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -3]
                        })
                      }, {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]}>
                    <Text style={styles.vintageCalendarTargetDayText}>{dayData.day}</Text>
                    <Text style={styles.vintageCalendarDDayText}>💕</Text>
                  </Animated.View>
                ) : (
                  <View style={[
                    styles.vintageCalendarDay,
                    dayData.isToday && styles.vintageCalendarToday,
                    !dayData.isCurrentMonth && styles.vintageCalendarOtherMonth
                  ]}>
                    <Text style={[
                      styles.vintageCalendarDayText,
                      dayData.isToday && styles.vintageCalendarTodayText,
                      !dayData.isCurrentMonth && styles.vintageCalendarOtherMonthText,
                      (index % 7 === 0 || index % 7 === 6) && styles.vintageCalendarWeekendText
                    ]}>
                      {dayData.day}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// 헬퍼 함수들 - 완전히 안전한 버전
const formatDate = (date, options = {}) => {
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

const formatTime = (time, options = {}) => {
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

const formatKoreanDate = (dateString) => {
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

const formatKoreanTime = (timeString) => {
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
const getSafeAnimValue = (animArray, index, defaultValue = 1) => {
  if (!animArray || !animArray[index]) {
    return new Animated.Value(defaultValue);
  }
  return animArray[index];
};

// 꽃잎 컴포넌트
const FallingPetals = () => {
  const petals = useRef([...Array(15)].map(() => ({
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: Math.random() * 5000,
  }))).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const startPetals = () => {
      if (!isMountedRef.current) return;
      
      petals.forEach((petal, index) => {
        const animateLoop = () => {
          if (!isMountedRef.current) return;
          
          Animated.loop(
            Animated.timing(petal.anim, {
              toValue: 1,
              duration: 8000 + (index * 1000),
              delay: petal.delay,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            { iterations: -1 }
          ).start();
        };
        
        setTimeout(animateLoop, index * 100);
      });
    };
    
    startPetals();
    
    return () => {
      isMountedRef.current = false;
      petals.forEach(petal => {
        petal.anim.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={styles.petalsContainer}>
      {petals.map((petal, index) => (
        <Animated.View
          key={index}
          style={[
            styles.petal,
            {
              left: petal.x,
              transform: [{
                translateY: petal.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50]
                })
              }, {
                rotate: petal.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }],
              opacity: petal.anim.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 0.8, 0.8, 0]
              })
            }
          ]}
        >
          <Text style={styles.petalText}>🌸</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// 하트 효과 컴포넌트
const FloatingHearts = () => {
  const hearts = useRef([...Array(12)].map(() => ({
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: Math.random() * 3000,
  }))).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    hearts.forEach((heart, index) => {
      const animateHeart = () => {
        if (!isMountedRef.current) return;
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(heart.anim, {
              toValue: 1,
              duration: 6000 + (index * 500),
              delay: heart.delay,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(heart.anim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            })
          ]),
          { iterations: -1 }
        ).start();
      };
      
      setTimeout(animateHeart, index * 200);
    });
    
    return () => {
      isMountedRef.current = false;
      hearts.forEach(heart => {
        heart.anim.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={styles.heartsContainer}>
      {hearts.map((heart, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.floatingHeart,
            {
              left: heart.x,
              transform: [{
                translateY: heart.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, -100]
                })
              }, {
                scale: heart.anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1.2, 0]
                })
              }],
              opacity: heart.anim.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, 1, 1, 0]
              })
            }
          ]}
        >
          {['💕', '💖', '💗', '❤️', '💓'][index % 5]}
        </Animated.Text>
      ))}
    </View>
  );
};

// 하트 펄스 컴포넌트
const HeartPulse = ({ style, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const pulse = () => {
      if (!isMountedRef.current) return;
      
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start((finished) => {
        if (finished && isMountedRef.current) {
          requestAnimationFrame(pulse);
        }
      });
    };
    
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        pulse();
      }
    }, delay);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      scaleAnim.stopAnimation();
    };
  }, [delay, scaleAnim]);

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.heartIcon}>💖</Text>
    </Animated.View>
  );
};

// 카운트다운 디스플레이 컴포넌트
const CountdownDisplay = ({ timeLeft, style, textStyle, labelStyle, isExpired = false }) => {
  if (isExpired) {
    return (
      <View style={[styles.countdownExpired, style]}>
        <Text style={[styles.countdownExpiredText, textStyle]}>
          D-Day! 축하합니다! 🎉
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.countdownContainer, style]}>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.days}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>일</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.hours}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>시간</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.minutes}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>분</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.seconds}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>초</Text>
      </View>
    </View>
  );
};

// 이미지 뷰어 컴포넌트
const ImageViewer = ({ visible, images = [], currentIndex, onClose, onIndexChange }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [imageIndex, setImageIndex] = useState(currentIndex || 0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current && currentIndex !== undefined) {
      setImageIndex(currentIndex);
    }
  }, [currentIndex]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (evt, gestureState) => {
      if (!isMountedRef.current) return;
      
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        if (gestureState.dx > 50 && imageIndex > 0) {
          const newIndex = imageIndex - 1;
          setImageIndex(newIndex);
          onIndexChange && onIndexChange(newIndex);
        } else if (gestureState.dx < -50 && imageIndex < images.length - 1) {
          const newIndex = imageIndex + 1;
          setImageIndex(newIndex);
          onIndexChange && onIndexChange(newIndex);
        }
      });
    },
  });

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.imageViewerContainer}>
        <TouchableOpacity style={styles.imageViewerClose} onPress={onClose}>
          <Ionicons name="close" size={30} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.imageViewerContent} {...panResponder.panHandlers}>
          <Image 
            source={(images[imageIndex] || images[0] || defaultImages[0])}
            style={styles.imageViewerImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.imageViewerIndicator}>
          <Text style={styles.imageViewerCounter}>
            {imageIndex + 1} / {images.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// 메인 슬라이드쇼 컴포넌트 (5장까지)
const MainPhotoSlideshow = ({ images = [], style, onImagePress, template = 'modern' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isChangingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 메인사진은 최대 5장까지만 사용
  const mainImages = images && images.length > 0 ? images.slice(0, 5) : defaultImages.slice(0, 5);

  useEffect(() => {
    if (mainImages.length > 1) {
      intervalRef.current = setInterval(() => {
        if (!isMountedRef.current || isChangingRef.current) return;
        
        isChangingRef.current = true;
        
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start((finished) => {
          if (finished && isMountedRef.current) {
            requestAnimationFrame(() => {
              if (isMountedRef.current) {
                setCurrentIndex((prev) => (prev + 1) % mainImages.length);
                // 이미지 변경 후 바로 다시 페이드인
                setTimeout(() => {
                  if (isMountedRef.current) {
                    Animated.timing(fadeAnim, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      isChangingRef.current = false;
                    });
                  }
                }, 50);
              }
            });
          }
        });
      }, 3000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [mainImages.length, fadeAnim]);

  return (
    <TouchableOpacity 
      style={[styles.mainPhotoSlideshow, style]}
      onPress={() => onImagePress && onImagePress(currentIndex)}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image 
          source={mainImages[currentIndex] || mainImages[0] || defaultImages[0]}
          style={styles.mainPhotoImage}
          resizeMode="cover"
        />
      </Animated.View>
      
      {/* 인디케이터 */}
      <View style={styles.mainPhotoIndicators}>
        {mainImages.map((_, index) => (
          <View 
            key={index}
            style={[
              styles.mainPhotoIndicator,
              { opacity: index === currentIndex ? 1 : 0.3 }
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
};

// 사진 갤러리 컴포넌트
const PhotoGallery = ({ images = [], style, onImagePress, autoSlide = false, template = 'modern' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (autoSlide && images && images.length > 1) {
      const startSlideShow = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
          if (!isMountedRef.current) return;
          
          // 페이드아웃
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start((finished) => {
            if (finished && isMountedRef.current) {
              // requestAnimationFrame을 사용하여 안전하게 state 업데이트
              requestAnimationFrame(() => {
                if (isMountedRef.current) {
                  setCurrentIndex((prev) => (prev + 1) % images.length);
                  // 페이드인
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                  }).start();
                }
              });
            }
          });
        }, 4000);
      };

      startSlideShow();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [images?.length, autoSlide, fadeAnim]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!images || images.length === 0) {
    return (
      <View style={[styles.galleryAutoSlide, style]}>
        <View style={styles.galleryAutoSlideImage}>
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 50 }}>
            사진이 없습니다
          </Text>
        </View>
      </View>
    );
  }

  if (autoSlide) {
    return (
      <TouchableOpacity 
        style={[styles.galleryAutoSlide, style]}
        onPress={() => onImagePress && onImagePress(currentIndex)}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image 
            source={images[currentIndex] || images[0] || defaultImages[0]}
            style={styles.galleryAutoSlideImage}
            resizeMode="cover"
          />
        </Animated.View>
        <View style={styles.galleryAutoSlideIndicators}>
          {images.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.galleryIndicator,
                { opacity: index === currentIndex ? 1 : 0.3 }
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={[styles.galleryScroll, style]}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: slideAnim } } }],
        { useNativeDriver: false }
      )}
    >
      {images.map((image, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.galleryItem}
          onPress={() => onImagePress(index)}
        >
          <Image 
            source={image}
            style={styles.galleryItemImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// =================================================================
// 템플릿 1: 모던 다크 디자인 - 카테고리별 이미지 올바른 사용
// =================================================================
const ModernDarkTemplate = ({ eventData = {}, categorizedImages = {} }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const heroAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef([...Array(25)].map(() => new Animated.Value(0))).current;
  const fadeAnims = useRef([...Array(25)].map(() => new Animated.Value(0))).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const titleGlowAnim = useRef(new Animated.Value(0)).current;

  // 실시간 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date, 
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // 카테고리별 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);

  useEffect(() => {
    // Hero entrance animation
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      }),
    ]).start();

    // Title glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(titleGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Breathing background animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    // Particle animations
    particleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 8000 + (index * 200),
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ).start();
    });

    // Staggered fade-ins
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        delay: 2000 + (index * 300),
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  }, []);

  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  return (
    <View style={styles.modern_container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <FallingPetals />
      <FloatingHearts />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section with Main Photo */}
        <View style={styles.modern_heroSection}>
          {/* 메인 사진 슬라이드쇼 */}
          <MainPhotoSlideshow 
            images={safeImages.main}
            style={styles.modern_mainPhotoContainer}
            onImagePress={handleImagePress}
            template="modern"
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.modern_heroOverlay}
          />

          {/* Animated background elements */}
          <Animated.View 
            style={[
              styles.modern_bgCircle1,
              {
                opacity: breatheAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.3]
                }),
                transform: [{
                  scale: breatheAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2]
                  })
                }, {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]}
          />

          {/* Floating particles */}
          {particleAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.modern_particle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 0.8, 0.3]
                  }),
                  transform: [{
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -50]
                    })
                  }, {
                    scale: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.5, 1]
                    })
                  }]
                }
              ]}
            />
          ))}

          <Animated.View 
            style={[
              styles.modern_heroContent,
              {
                opacity: heroAnim,
                transform: [{
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_heroTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 35]
                  })
                }
              ]}
            >
              Forever Love
            </Animated.Text>
            
            <View style={styles.modern_heroNamesContainer}>
              <Animated.Text 
                style={[
                  styles.modern_heroNames,
                  {
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02]
                      })
                    }]
                  }
                ]}
              >
                {eventData.groomName || eventData.groom_name || '재현'} & {eventData.brideName || eventData.bride_name || '민지'}
              </Animated.Text>
            </View>
            
            <Text style={styles.modern_heroDate}>
              {formatDate(eventData.date || eventData.event_date, { 
                defaultDate: '2024년 11월 23일 토요일'
              })}
            </Text>
            
            <Text style={styles.modern_heroTime}>
              {formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' })}
            </Text>
          </Animated.View>
        </View>

        {/* 실시간 카운트다운 & 달력 섹션 */}
        <LinearGradient 
          colors={['#16213e', '#1a1a2e']} 
          style={styles.modern_countdownSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[0],
                transform: [{
                  translateY: fadeAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_countdownTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 20]
                  })
                }
              ]}
            >
              우리의 결혼식
            </Animated.Text>
            
            <CountdownDisplay 
              timeLeft={timeLeft} 
              style={styles.modern_countdownGrid}
              textStyle={styles.modern_countdownNumber}
              labelStyle={styles.modern_countdownLabel}
              isExpired={timeLeft.isExpired}
            />

            {/* 모던 다크 달력 추가 */}
            <ModernDarkCalendar 
              targetDate={eventData.date || eventData.event_date}
              style={styles.modern_calendarSection}
            />
          </Animated.View>
        </LinearGradient>

        {/* 갤러리 사진 섹션 (신랑/신부 사진 제외) */}
        <View style={styles.modern_gallerySection}>
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[1],
                transform: [{
                  translateY: fadeAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_sectionTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              갤러리
            </Animated.Text>
            <Animated.Text 
              style={[
                styles.modern_sectionSubtitle,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1]
                  })
                }
              ]}
            >
              소중한 추억들을 모아두었습니다
            </Animated.Text>
            
            <PhotoGallery 
              images={safeImages.gallery}
              style={styles.modern_photoGallery}
              onImagePress={(index) => handleImagePress(safeImages.main.length + index)}
              autoSlide={true}
              template="modern"
            />
            
            {/* 갤러리 사진들 그리드 */}
            <View style={styles.modern_photoGrid}>
              {safeImages.gallery && safeImages.gallery.length > 0 && safeImages.gallery.map((image, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.modern_photoGridItem,
                    {
                      opacity: getSafeAnimValue(fadeAnims, 2 + index),
                      transform: [{
                        scale: getSafeAnimValue(fadeAnims, 2 + index).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity onPress={() => handleImagePress(safeImages.main.length + index)}>
                    <Image 
                      source={image}
                      style={styles.modern_photoGridImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* 사랑의 명언 섹션 */}
        <LinearGradient 
          colors={['#0a0a0a', '#111111']} 
          style={styles.modern_quoteSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[8],
                transform: [{
                  translateY: fadeAnims[8].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_quoteText,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }
              ]}
            >
              {eventData.customMessage || eventData.custom_message || 
               '"진정한 사랑은 떨어져 있어도\n변하지 않는 마음입니다."'
              }
            </Animated.Text>
            <Text style={styles.modern_quoteAuthor}>- {eventData.groomName || '신랑'} & {eventData.brideName || '신부'}</Text>
          </Animated.View>
        </LinearGradient>

        {/* 웨딩 디테일 */}
        <LinearGradient 
          colors={['#1a1a2e', '#16213e']} 
          style={styles.modern_detailsSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[9],
                transform: [{
                  translateY: fadeAnims[9].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_sectionTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              결혼식 안내
            </Animated.Text>
            
            <View style={styles.modern_detailsCards}>
              {[
                {
                  icon: '📅',
                  title: '날짜 & 시간',
                  main: formatDate(eventData.date || eventData.event_date, { defaultDate: '2024년 11월 23일' }),
                  sub: `토요일 ${formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' })}`
                },
                {
                  icon: '🏛️',
                  title: '예식장소',
                  main: eventData.location || '더 플라자 호텔',
                  sub: eventData.detailedAddress || eventData.detailed_address || '그랜드볼룸 (5층)'
                },
                {
                  icon: '🚗',
                  title: '주차 안내',
                  main: eventData.parkingInfo || eventData.parking_info || '주차 가능',
                  sub: '자세한 사항은 연락처로 문의해주세요'
                }
              ].map((detail, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.modern_detailCard,
                    {
                      opacity: fadeAnims[10 + index],
                      transform: [{
                        translateY: fadeAnims[10 + index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0]
                        })
                      }, {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.modern_detailIcon}>{detail.icon}</Text>
                  <Text style={styles.modern_detailTitle}>{detail.title}</Text>
                  <Text style={styles.modern_detailMain}>{detail.main}</Text>
                  <Text style={styles.modern_detailSub}>{detail.sub}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 커플 소개 - 신랑/신부 전용 사진 사용 */}
        <View style={styles.modern_coupleSection}>
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[13],
                transform: [{
                  translateY: fadeAnims[13].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_sectionTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              신랑 & 신부
            </Animated.Text>
            
            <View style={styles.modern_coupleGrid}>
              {[
                {
                  image: safeImages.groom[0], // 신랑 전용 사진
                  name: eventData.groomName || eventData.groom_name || '재현',
                  role: '신랑',
                  parents: `${eventData.groomFatherName || eventData.groom_father_name || '김○○'} · ${eventData.groomMotherName || eventData.groom_mother_name || '이○○'}의 장남`,
                },
                {
                  image: safeImages.bride[0], // 신부 전용 사진
                  name: eventData.brideName || eventData.bride_name || '민지',
                  role: '신부',
                  parents: `${eventData.brideFatherName || eventData.bride_father_name || '박○○'} · ${eventData.brideMotherName || eventData.bride_mother_name || '최○○'}의 차녀`,
                }
              ].map((person, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.modern_coupleCard,
                    {
                      opacity: fadeAnims[14 + index],
                      transform: [{
                        translateY: fadeAnims[14 + index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        })
                      }, {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.modern_couplePhotoContainer}>
                    <Image 
                      source={person.image}
                      style={styles.modern_couplePhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.modern_couplePhotoOverlay} />
                  </View>
                  <Text style={styles.modern_coupleName}>{person.name}</Text>
                  <Text style={styles.modern_coupleRole}>{person.role}</Text>
                  <Text style={styles.modern_coupleParents}>{person.parents}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* 연락처 & 공유 섹션 */}
        <LinearGradient 
          colors={['#16213e', '#0a0a0a']} 
          style={styles.modern_contactSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: getSafeAnimValue(fadeAnims, 16),
                transform: [{
                  translateY: getSafeAnimValue(fadeAnims, 16, 0).interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_sectionTitle,
                {
                  textShadowRadius: (titleGlowAnim || new Animated.Value(0)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              연락처
            </Animated.Text>
            
            <View style={styles.modern_contactGrid}>
              {[
                { name: `신랑 ${eventData.groomName || eventData.groom_name || '재현'}`, role: '신랑', color: '#667eea', phone: eventData.groomContact || eventData.groom_contact },
                { name: `신부 ${eventData.brideName || eventData.bride_name || '민지'}`, role: '신부', color: '#764ba2', phone: eventData.brideContact || eventData.bride_contact }
              ].map((contact, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.modern_contactCard,
                    {
                      opacity: getSafeAnimValue(fadeAnims, 17 + index),
                      transform: [{
                        scale: getSafeAnimValue(fadeAnims, 17 + index).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.modern_contactButton}
                    onPress={() => {
                      if (contact.phone) {
                        Linking.openURL(`tel:${contact.phone}`);
                      }
                    }}
                  >
                    <Text style={styles.modern_contactName}>{contact.name}</Text>
                    <View style={[styles.modern_contactBtnContainer, { backgroundColor: contact.color }]}>
                      <Ionicons name="call" size={16} color="#ffffff" />
                      <Text style={styles.modern_contactBtnText}>전화하기</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            
            <View style={styles.modern_shareButtonContainer}>
              <Animated.View
                style={[
                  {
                    opacity: getSafeAnimValue(fadeAnims, 19),
                    transform: [{
                      scale: (pulseAnim || new Animated.Value(1)).interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05]
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity 
                  style={styles.modern_shareButton}
                  onPress={async () => {
                    try {
                      const dateStr = formatDate(eventData.date || eventData.event_date, { defaultDate: '2024년 11월 23일' });
                      const timeStr = formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' });
                      const location = eventData.location || '웨딩홀';
                      const groomName = eventData.groomName || eventData.groom_name || '신랑';
                      const brideName = eventData.brideName || eventData.bride_name || '신부';
                      
                      await Share.share({
                        message: `${groomName} ♥ ${brideName} 결혼식에 초대합니다!\n${dateStr} ${timeStr}\n${location}`,
                        title: '모바일 청첩장',
                      });
                    } catch (error) {
                      console.log('Share error:', error);
                    }
                  }}
                >
                  <Ionicons name="heart" size={20} color="#ffffff" style={{ marginRight: 10 }} />
                  <Text style={styles.modern_shareButtonText}>청첩장 공유하기</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 부조하기 버튼 섹션 추가 */}
        <LinearGradient 
          colors={['#0a0a0a', '#16213e']} 
          style={styles.modern_donationSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: getSafeAnimValue(fadeAnims, 20),
                transform: [{
                  translateY: getSafeAnimValue(fadeAnims, 20, 0).interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_donationTitle,
                {
                  textShadowRadius: (titleGlowAnim || new Animated.Value(0)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              마음을 전하세요
            </Animated.Text>
            
            <Text style={styles.modern_donationSubtitle}>
              소중한 분들의 축복이 큰 힘이 됩니다
            </Text>

            <Animated.View
              style={[
                {
                  transform: [{
                    scale: (pulseAnim || new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.03]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.modern_donationButton}
                onPress={() => {
                  // 부조하기 기능 구현 예정
                  console.log('부조하기 버튼 클릭됨');
                }}
              >
                <Ionicons name="gift" size={24} color="#ffffff" style={{ marginRight: 12 }} />
                <Text style={styles.modern_donationButtonText}>부조하기</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </ScrollView>

      <ImageViewer 
        visible={showImageViewer}
        images={[...safeImages.main, ...safeImages.gallery]}
        currentIndex={currentImageIndex}
        onClose={() => setShowImageViewer(false)}
        onIndexChange={setCurrentImageIndex}
      />
    </View>
  );
};

// =================================================================
// 템플릿 2: 한국 전통 웨딩 디자인 - 카테고리별 이미지 올바른 사용
// =================================================================
const KoreanElegantTemplate = ({ eventData = {}, categorizedImages = {} }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(Array.from({ length: 12 }, () => new Animated.Value(0))).current;
  const slideAnims = useRef(Array.from({ length: 12 }, () => new Animated.Value(50))).current;
  
  // 실시간 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date, 
    eventData.ceremonyTime || eventData.ceremony_time
  );
  
  // 카테고리별 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  
  console.log('🔍 [KOREAN TEMPLATE] 사용할 이미지들:', {
    main: safeImages.main.length,
    gallery: safeImages.gallery.length,
    groom: safeImages.groom.length,
    bride: safeImages.bride.length
  });
  
  useEffect(() => {
    // 순차적 페이드인 애니메이션
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        delay: index * 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });

    slideAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 1000,
        delay: index * 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  }, []);

  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const ceremonyTime = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);
  const receptionTime = formatKoreanTime(eventData.receptionTime || eventData.reception_time);

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleShare = async () => {
    try {
      const groomName = eventData.groomName || eventData.groom_name || '신랑';
      const brideName = eventData.brideName || eventData.bride_name || '신부';
      const dateStr = dateInfo.full;
      const timeStr = ceremonyTime;
      const location = eventData.location || '웨딩홀';
      
      await Share.share({
        message: `${groomName} ♥ ${brideName} 결혼식에 초대합니다!\n${dateStr} ${timeStr}\n${location}`,
        title: '모바일 청첩장',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  return (
    <View style={styles.korean_container}>
      <StatusBar barStyle="dark-content" backgroundColor={KoreanColors.elegant.light} />
      <FallingPetals />
      
      <ScrollView
        style={styles.korean_scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* 메인 헤더 섹션 with Main Photo */}
        <Animated.View style={[
          styles.korean_heroSection,
          {
            opacity: fadeAnims[0],
            transform: [{ translateY: slideAnims[0] }]
          }
        ]}>
          <LinearGradient
            colors={[KoreanColors.elegant.light, KoreanColors.elegant.secondary]}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.korean_heroContent}>
            <MainPhotoSlideshow 
              images={safeImages.main}
              style={styles.korean_mainPhotoContainer}
              onImagePress={handleImagePress}
              template="romantic"
            />

            <View style={styles.korean_namesContainer}>
              <Text style={styles.korean_groomName}>{eventData.groomName || eventData.groom_name || '신랑'}</Text>
              <HeartPulse style={styles.korean_heartContainer} delay={1000} />
              <Text style={styles.korean_brideName}>{eventData.brideName || eventData.bride_name || '신부'}</Text>
            </View>

            <View style={styles.korean_dateContainer}>
              <Text style={styles.korean_dateYear}>{dateInfo.year}</Text>
              <Text style={styles.korean_dateMonthDay}>{dateInfo.month}.{dateInfo.day}</Text>
              <Text style={styles.korean_dateDayOfWeek}>{dateInfo.dayOfWeek}요일</Text>
              <Text style={styles.korean_dateTime}>{ceremonyTime}</Text>
            </View>
          </View>
        </Animated.View>

        {/* 카운트다운 & 달력 섹션 추가 */}
        <Animated.View style={[
          styles.korean_countdownSection,
          {
            opacity: fadeAnims[1],
            transform: [{ translateY: slideAnims[1] }]
          }
        ]}>
          <LinearGradient
            colors={[KoreanColors.elegant.secondary, KoreanColors.elegant.light]}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.korean_sectionHeader}>
            <View style={styles.korean_decorativeLine} />
            <Text style={styles.korean_sectionTitle}>D-Day</Text>
            <View style={styles.korean_decorativeLine} />
          </View>

          <CountdownDisplay 
            timeLeft={timeLeft}
            style={styles.korean_countdownGrid}
            textStyle={styles.korean_countdownNumber}
            labelStyle={styles.korean_countdownLabel}
            isExpired={timeLeft.isExpired}
          />

          {/* 한국 전통 달력 추가 */}
          <KoreanElegantCalendar 
            targetDate={eventData.date || eventData.event_date}
            style={styles.korean_calendarSection}
          />
        </Animated.View>

        {/* 인사말 섹션 */}
        <Animated.View style={[
          styles.korean_messageSection,
          {
            opacity: fadeAnims[2],
            transform: [{ translateY: slideAnims[2] }]
          }
        ]}>
          <View style={styles.korean_sectionHeader}>
            <View style={styles.korean_decorativeLine} />
            <Text style={styles.korean_sectionTitle}>인사말</Text>
            <View style={styles.korean_decorativeLine} />
          </View>
          
          <Text style={styles.korean_customMessage}>
            {eventData.customMessage || eventData.custom_message || 
             '두 사람이 하나 되어 새로운 인생을 시작하려 합니다.\n저희의 소중한 첫걸음에 함께해 주시면 더없는 기쁨이겠습니다.'}
          </Text>
        </Animated.View>

        {/* 신랑신부 소개 - 신랑/신부 전용 사진 사용 */}
        <Animated.View style={[
          styles.korean_coupleSection,
          {
            opacity: fadeAnims[3],
            transform: [{ translateY: slideAnims[3] }]
          }
        ]}>
          <View style={styles.korean_sectionHeader}>
            <View style={styles.korean_decorativeLine} />
            <Text style={styles.korean_sectionTitle}>신랑 · 신부</Text>
            <View style={styles.korean_decorativeLine} />
          </View>

          <View style={styles.korean_coupleGrid}>
            {/* 신랑 정보 */}
            <View style={styles.korean_personCard}>
              <View style={styles.korean_personPhotoContainer}>
                <Image
                  source={safeImages.groom[0]} // 신랑 전용 사진
                  style={styles.korean_personPhoto}
                />
              </View>
              <Text style={styles.korean_personName}>{eventData.groomName || eventData.groom_name || '신랑'}</Text>
              <Text style={styles.korean_personRole}>신랑</Text>
              <Text style={styles.korean_parentNames}>
                {eventData.groomFatherName || eventData.groom_father_name || '○○○'} · {eventData.groomMotherName || eventData.groom_mother_name || '○○○'}의 장남
              </Text>
              <TouchableOpacity 
                style={styles.korean_contactButton}
                onPress={() => handleCall(eventData.groomContact || eventData.groom_contact)}
              >
                <Ionicons name="call" size={16} color={KoreanColors.elegant.primary} />
                <Text style={styles.korean_contactButtonText}>연락하기</Text>
              </TouchableOpacity>
            </View>

            {/* 신부 정보 */}
            <View style={styles.korean_personCard}>
              <View style={styles.korean_personPhotoContainer}>
                <Image
                  source={safeImages.bride[0]} // 신부 전용 사진
                  style={styles.korean_personPhoto}
                />
              </View>
              <Text style={styles.korean_personName}>{eventData.brideName || eventData.bride_name || '신부'}</Text>
              <Text style={styles.korean_personRole}>신부</Text>
              <Text style={styles.korean_parentNames}>
                {eventData.brideFatherName || eventData.bride_father_name || '○○○'} · {eventData.brideMotherName || eventData.bride_mother_name || '○○○'}의 장녀
              </Text>
              <TouchableOpacity 
                style={styles.korean_contactButton}
                onPress={() => handleCall(eventData.brideContact || eventData.bride_contact)}
              >
                <Ionicons name="call" size={16} color={KoreanColors.elegant.primary} />
                <Text style={styles.korean_contactButtonText}>연락하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* 예식 정보 */}
        <Animated.View style={[
          styles.korean_weddingInfoSection,
          {
            opacity: fadeAnims[4],
            transform: [{ translateY: slideAnims[4] }]
          }
        ]}>
          <LinearGradient
            colors={[KoreanColors.elegant.secondary, KoreanColors.elegant.light]}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.korean_sectionHeader}>
            <View style={styles.korean_decorativeLine} />
            <Text style={styles.korean_sectionTitle}>예식 정보</Text>
            <View style={styles.korean_decorativeLine} />
          </View>

          <View style={styles.korean_infoCard}>
            <View style={styles.korean_infoRow}>
              <View style={styles.korean_infoIcon}>
                <Ionicons name="calendar" size={24} color={KoreanColors.elegant.accent} />
              </View>
              <View style={styles.korean_infoContent}>
                <Text style={styles.korean_infoLabel}>예식일시</Text>
                <Text style={styles.korean_infoValue}>{dateInfo.full}</Text>
                <Text style={styles.korean_infoSubValue}>
                  예식 {ceremonyTime} | 피로연 {receptionTime}
                </Text>
              </View>
            </View>

            <View style={styles.korean_infoRow}>
              <View style={styles.korean_infoIcon}>
                <Ionicons name="location" size={24} color={KoreanColors.elegant.accent} />
              </View>
              <View style={styles.korean_infoContent}>
                <Text style={styles.korean_infoLabel}>예식장소</Text>
                <Text style={styles.korean_infoValue}>{eventData.location || '웨딩홀'}</Text>
                <Text style={styles.korean_infoSubValue}>{eventData.detailedAddress || eventData.detailed_address || '상세 주소'}</Text>
              </View>
            </View>

            <View style={styles.korean_infoRow}>
              <View style={styles.korean_infoIcon}>
                <MaterialIcons name="local-parking" size={24} color={KoreanColors.elegant.accent} />
              </View>
              <View style={styles.korean_infoContent}>
                <Text style={styles.korean_infoLabel}>주차안내</Text>
                <Text style={styles.korean_infoValue}>{eventData.parkingInfo || eventData.parking_info || '주차 가능'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* 갤러리 섹션 - 갤러리 전용 사진 사용 */}
        <Animated.View style={[
          styles.korean_gallerySection,
          {
            opacity: fadeAnims[5],
            transform: [{ translateY: slideAnims[5] }]
          }
        ]}>
          <View style={styles.korean_sectionHeader}>
            <View style={styles.korean_decorativeLine} />
            <Text style={styles.korean_sectionTitle}>Gallery</Text>
            <View style={styles.korean_decorativeLine} />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.korean_galleryScroll}
          >
            {safeImages.gallery.map((image, index) => (
              <TouchableOpacity key={index} style={styles.korean_galleryItem} onPress={() => handleImagePress(safeImages.main.length + index)}>
                <Image source={image} style={styles.korean_galleryImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* 오시는 길 */}
        <Animated.View style={[
          styles.korean_locationSection,
          {
            opacity: fadeAnims[6],
            transform: [{ translateY: slideAnims[6] }]
          }
        ]}>
          <View style={styles.korean_sectionHeader}>
            <View style={styles.korean_decorativeLine} />
            <Text style={styles.korean_sectionTitle}>오시는 길</Text>
            <View style={styles.korean_decorativeLine} />
          </View>

          <View style={styles.korean_mapContainer}>
            <Text style={styles.korean_mapPlaceholder}>🗺️ 지도</Text>
            <Text style={styles.korean_mapText}>지도 API 연동 영역</Text>
          </View>

          <View style={styles.korean_locationButtons}>
            <TouchableOpacity style={styles.korean_locationButton}>
              <Ionicons name="navigate" size={20} color="white" />
              <Text style={styles.korean_locationButtonText}>길찾기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.korean_locationButton, styles.korean_locationButtonSecondary]}>
              <Ionicons name="copy" size={20} color={KoreanColors.elegant.primary} />
              <Text style={[styles.korean_locationButtonText, styles.korean_locationButtonTextSecondary]}>주소복사</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 축의금 안내 */}
        <Animated.View style={[
          styles.korean_contributionSection,
          {
            opacity: fadeAnims[7],
            transform: [{ translateY: slideAnims[7] }]
          }
        ]}>
          <LinearGradient
            colors={[KoreanColors.elegant.secondary, KoreanColors.elegant.light]}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.korean_sectionHeader}>
            <View style={styles.korean_decorativeLine} />
            <Text style={styles.korean_sectionTitle}>축의금 안내</Text>
            <View style={styles.korean_decorativeLine} />
          </View>

          <View style={styles.korean_contributionCard}>
            <Text style={styles.korean_contributionTitle}>마음만으로도 충분합니다</Text>
            <Text style={styles.korean_contributionDescription}>
              귀한 시간 내어 참석해 주시는 것만으로도{'\n'}
              저희에겐 큰 기쁨과 축복입니다.
            </Text>
            
            <TouchableOpacity 
              style={styles.korean_contributionButton}
              onPress={() => {
                // 부조하기 기능 구현 예정
                console.log('부조하기 버튼 클릭됨');
              }}
            >
              <MaterialIcons name="card-giftcard" size={20} color={KoreanColors.elegant.primary} />
              <Text style={styles.korean_contributionButtonText}>부조하기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 공유 섹션 */}
        <Animated.View style={[
          styles.korean_shareSection,
          {
            opacity: fadeAnims[8],
            transform: [{ translateY: slideAnims[8] }]
          }
        ]}>
          <TouchableOpacity style={styles.korean_shareButton} onPress={handleShare}>
            <LinearGradient
              colors={[KoreanColors.elegant.accent, KoreanColors.elegant.primary]}
              style={styles.korean_shareButtonGradient}
            >
              <Ionicons name="share-social" size={24} color="white" />
              <Text style={styles.korean_shareButtonText}>청첩장 공유하기</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* 마무리 메시지 */}
        <Animated.View style={[
          styles.korean_footerSection,
          {
            opacity: fadeAnims[9],
            transform: [{ translateY: slideAnims[9] }]
          }
        ]}>
          <Text style={styles.korean_footerMessage}>
            소중한 분들과 함께하는{'\n'}
            행복한 시간이 되길 바랍니다.
          </Text>
          <Text style={styles.korean_footerNames}>
            {eventData.groomName || eventData.groom_name || '신랑'} ♥ {eventData.brideName || eventData.bride_name || '신부'}
          </Text>
          <Text style={styles.korean_footerDate}>{dateInfo.full}</Text>
        </Animated.View>
      </ScrollView>

      <ImageViewer 
        visible={showImageViewer}
        images={[...safeImages.main, ...safeImages.gallery]}
        currentIndex={currentImageIndex}
        onClose={() => setShowImageViewer(false)}
        onIndexChange={setCurrentImageIndex}
      />
    </View>
  );
};

// =================================================================
// 템플릿 3: 빈티지 앱 디자인 - 카테고리별 이미지 올바른 사용
// =================================================================
const VintageAppTemplate = ({ eventData = {}, categorizedImages = {} }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const appLoadAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([...Array(25)].map(() => new Animated.Value(0))).current;
  const sparkleAnims = useRef([...Array(15)].map(() => new Animated.Value(0))).current;
  const fadeAnims = useRef([...Array(30)].map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // 실시간 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date, 
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // 카테고리별 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  
  console.log('🔍 [VINTAGE TEMPLATE] 사용할 이미지들:', {
    main: safeImages.main.length,
    gallery: safeImages.gallery.length,
    groom: safeImages.groom.length,
    bride: safeImages.bride.length
  });

  useEffect(() => {
    // App loading animation
    Animated.timing(appLoadAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ])
    ).start();

    // Sparkle animations
    sparkleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + (index * 200),
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ).start();
    });

    // Card animations
    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: 1000 + (index * 150),
        useNativeDriver: true,
        easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
      }).start();
    });

    // Fade animations
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        delay: 1500 + (index * 200),
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  }, []);

  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  return (
    <View style={styles.app_container}>
      {/* Simplified Status Bar */}
      <View style={styles.app_statusBar}>
        <View style={styles.app_statusLeft} />
        <View style={styles.app_statusCenter}>
          <Text style={styles.app_statusTitle}>결혼식</Text>
        </View>
        <View style={styles.app_statusRight} />
      </View>

      <ScrollView style={styles.app_scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Main Photo */}
        <View style={styles.app_heroSection}>
          <MainPhotoSlideshow 
            images={safeImages.main}
            style={styles.app_mainPhotoContainer}
            onImagePress={handleImagePress}
            template="vintage"
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Sparkle effects */}
          {sparkleAnims.map((anim, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.app_sparkle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3]
                  }),
                  transform: [{
                    scale: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.5, 1]
                    })
                  }, {
                    rotate: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]}
            >
              ✨
            </Animated.Text>
          ))}

          <Animated.View 
            style={[
              styles.app_heroContent,
              {
                opacity: appLoadAnim,
                transform: [{
                  translateY: appLoadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }, {
                  scale: appLoadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_heroTitle}>Wedding</Text>
            <Text style={styles.app_heroSubtitle}>우리의 특별한 날에 함께해주세요</Text>
            <Text style={styles.app_heroNames}>
              {eventData.groomName || eventData.groom_name || '민수'} & {eventData.brideName || eventData.bride_name || '예은'}
            </Text>
            <Text style={styles.app_heroDate}>
              {formatDate(eventData.date || eventData.event_date, { 
                format: 'english',
                defaultDate: 'November 16, 2024'
              })} • Saturday {formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '2:00 PM' })}
            </Text>
            
            <Animated.View
              style={[
                {
                  transform: [{
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5]
                    })
                  }]
                }
              ]}
            >
            </Animated.View>
          </Animated.View>
          
          <Animated.Text 
            style={[
              styles.app_scrollHint,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1]
                })
              }
            ]}
          >
            ↓ 아래로 스크롤해주세요
          </Animated.Text>
        </View>

        {/* 카운트다운 & 달력 섹션 추가 */}
        <LinearGradient 
          colors={['#6c5ce7', '#5f3dc4']} 
          style={styles.app_countdownSection}
        >
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: cardAnims[0],
                transform: [{
                  translateY: cardAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_countdownTitle}>결혼식 D-Day</Text>
            <Text style={styles.app_countdownSubtitle}>특별한 날까지 남은 시간</Text>
            
            <CountdownDisplay 
              timeLeft={timeLeft}
              style={styles.app_countdownGrid}
              textStyle={styles.app_countdownNumber}
              labelStyle={styles.app_countdownLabel}
              isExpired={timeLeft.isExpired}
            />

            {/* 빈티지 앱 달력 추가 */}
            <VintageAppCalendar 
              targetDate={eventData.date || eventData.event_date}
              style={styles.app_calendarSection}
            />
          </Animated.View>
        </LinearGradient>

        {/* 갤러리 섹션 - 갤러리 전용 사진 사용 */}
        <View style={styles.app_gallerySection}>
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: cardAnims[6],
                transform: [{
                  translateY: cardAnims[6].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_sectionTitle}>사진 갤러리</Text>
            <Text style={styles.app_sectionSubtitle}>소중한 추억들을 모아두었습니다</Text>
            
            <PhotoGallery 
              images={safeImages.gallery.slice(0, 6)}
              style={styles.app_photoGallery}
              onImagePress={(index) => handleImagePress(safeImages.main.length + index)}
              autoSlide={false}
              template="vintage"
            />
            
            {/* 사진 마사지 레이아웃 */}
            <View style={styles.app_photoMasonry}>
              <View style={styles.app_photoColumn}>
                {safeImages.gallery && safeImages.gallery.length > 0 && safeImages.gallery.slice(0, Math.ceil(safeImages.gallery.length / 2)).map((image, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      {
                        opacity: getSafeAnimValue(cardAnims, 7 + index),
                        transform: [{
                          scale: getSafeAnimValue(cardAnims, 7 + index).interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1]
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity onPress={() => handleImagePress(safeImages.main.length + index)}>
                      <Image 
                        source={image}
                        style={[
                          styles.app_photoMasonryItem,
                          { height: (index % 3 + 1) * 80 + 100 }
                        ]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
              <View style={styles.app_photoColumn}>
                {safeImages.gallery && safeImages.gallery.length > 0 && safeImages.gallery.slice(Math.ceil(safeImages.gallery.length / 2)).map((image, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      {
                        opacity: getSafeAnimValue(cardAnims, 7 + Math.ceil(safeImages.gallery.length / 2) + index),
                        transform: [{
                          scale: getSafeAnimValue(cardAnims, 7 + Math.ceil(safeImages.gallery.length / 2) + index).interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1]
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity onPress={() => handleImagePress(safeImages.main.length + Math.ceil(safeImages.gallery.length / 2) + index)}>
                      <Image 
                        source={image}
                        style={[
                          styles.app_photoMasonryItem,
                          { height: ((index + 1) % 3 + 1) * 80 + 100 }
                        ]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* 인포 카드 섹션 */}
        <LinearGradient 
          colors={['#f8f9fa', '#e9ecef']} 
          style={styles.app_cardsSection}
        >
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: cardAnims[13],
                transform: [{
                  translateY: cardAnims[13].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_sectionTitle}>결혼식 정보</Text>
            <Text style={styles.app_sectionSubtitle}>결혼식 세부 정보를 확인해주세요</Text>
            
            <View style={styles.app_infoCards}>
              {[
                {
                  icon: '📅',
                  title: '날짜 & 시간',
                  description: `${formatDate(eventData.date || eventData.event_date, { defaultDate: '2024년 11월 16일 토요일' })}\n${formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' })} - 4시`,
                  accent: '#6c5ce7',
                  details: '가든 세레모니'
                },
                {
                  icon: '🏛️',
                  title: '장소',
                  description: `${eventData.location || '블루밍 가든 웨딩홀'}\n${eventData.detailedAddress || eventData.detailed_address || '야외 테라스'}`,
                  accent: '#00b894',
                  details: '서울 강남구 테헤란로 152'
                },
                {
                  icon: '🚗',
                  title: '주차 정보',
                  description: eventData.parkingInfo || eventData.parking_info || '무료 주차 가능\n100대 수용',
                  accent: '#0984e3',
                  details: '발렛 서비스 제공'
                }
              ].map((card, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.app_infoCard,
                    {
                      opacity: cardAnims[14 + index],
                      transform: [{
                        translateY: cardAnims[14 + index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0]
                        })
                      }, {
                        scale: cardAnims[14 + index].interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.95, 1.02, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={[styles.app_cardIcon, { backgroundColor: card.accent + '20' }]}>
                    <Text style={styles.app_cardIconText}>{card.icon}</Text>
                  </View>
                  <Text style={styles.app_cardTitle}>{card.title}</Text>
                  <Text style={styles.app_cardDescription}>{card.description}</Text>
                  <Text style={[styles.app_cardDetails, { color: card.accent }]}>{card.details}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 커플 소개 섹션 - 신랑/신부 전용 사진 사용 */}
        <View style={styles.app_coupleSection}>
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: cardAnims[18],
                transform: [{
                  translateY: cardAnims[18].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_sectionTitle}>신랑 & 신부</Text>
            <Text style={styles.app_sectionSubtitle}>두 사람을 소개합니다</Text>
            
            <View style={styles.app_coupleCards}>
              {[
                {
                  image: safeImages.groom[0], // 신랑 전용 사진
                  name: eventData.groomName || eventData.groom_name || '김민수',
                  role: '신랑',
                  parents: `${eventData.groomFatherName || eventData.groom_father_name || '김○○'} · ${eventData.groomMotherName || eventData.groom_mother_name || '이○○'}의 장남`,
                },
                {
                  image: safeImages.bride[0], // 신부 전용 사진
                  name: eventData.brideName || eventData.bride_name || '박예은',
                  role: '신부',
                  parents: `${eventData.brideFatherName || eventData.bride_father_name || '박○○'} · ${eventData.brideMotherName || eventData.bride_mother_name || '최○○'}의 장녀`,
                }
              ].map((person, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.app_coupleCard,
                    {
                      opacity: cardAnims[19 + index],
                      transform: [{
                        translateY: cardAnims[19 + index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0]
                        })
                      }, {
                        scale: cardAnims[19 + index].interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.95, 1.03, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.app_couplePhotoContainer}>
                    <Image 
                      source={person.image}
                      style={styles.app_couplePhoto}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.app_coupleName}>{person.name}</Text>
                  <Text style={styles.app_coupleRole}>{person.role}</Text>
                  <Text style={styles.app_coupleParents}>{person.parents}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* 연락처 섹션 */}
        <LinearGradient 
          colors={['#ffffff', '#f8f9fa']} 
          style={styles.app_contactSection}
        >
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: getSafeAnimValue(fadeAnims, 21),
                transform: [{
                  translateY: getSafeAnimValue(fadeAnims, 21, 0).interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_sectionTitle}>연락처</Text>
            <Text style={styles.app_sectionSubtitle}>문의사항이 있으시면 연락해주세요</Text>
            
            <View style={styles.app_contactCards}>
              {[
                { name: `신랑 ${eventData.groomName || eventData.groom_name || '민수'}`, role: '신랑', color: '#6c5ce7', phone: eventData.groomContact || eventData.groom_contact || '010-1234-5678' },
                { name: `신부 ${eventData.brideName || eventData.bride_name || '예은'}`, role: '신부', color: '#fd79a8', phone: eventData.brideContact || eventData.bride_contact || '010-9876-5432' }
              ].map((contact, index) => (
                <Animated.View
                  key={index}
                  style={[
                    {
                      opacity: getSafeAnimValue(fadeAnims, 22 + index),
                      transform: [{
                        scale: getSafeAnimValue(fadeAnims, 22 + index).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.app_contactCard}
                    onPress={() => {
                      if (contact.phone) {
                        Linking.openURL(`tel:${contact.phone}`);
                      }
                    }}
                  >
                    <View style={[styles.app_contactAvatar, { backgroundColor: contact.color + '20' }]}>
                      <Text style={styles.app_contactAvatarText}>
                        {contact.role === '신랑' ? '👨' : '👩'}
                      </Text>
                    </View>
                    <View style={styles.app_contactInfo}>
                      <Text style={styles.app_contactName}>{contact.name}</Text>
                      <Text style={styles.app_contactPhone}>{contact.phone}</Text>
                      <Text style={styles.app_contactRole}>{contact.role}</Text>
                    </View>
                    <View style={[styles.app_contactButton, { backgroundColor: contact.color }]}>
                      <Ionicons name="call" size={16} color="#ffffff" />
                      <Text style={styles.app_contactButtonText}>전화</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 부조하기 & 공유 섹션 */}
        <LinearGradient 
          colors={['#6c5ce7', '#5f3dc4']} 
          style={styles.app_shareSection}
        >
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: getSafeAnimValue(fadeAnims, 24),
                transform: [{
                  translateY: getSafeAnimValue(fadeAnims, 24, 0).interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }, {
                  scale: getSafeAnimValue(fadeAnims, 24).interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.9, 1.05, 1]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_shareTitle}>마음을 전해주세요</Text>
            <Text style={styles.app_shareSubtitle}>
              소중한 분들의 축복과 마음이 큰 힘이 됩니다
            </Text>
            
            {/* 부조하기 버튼 */}
            <Animated.View
              style={[
                {
                  transform: [{
                    scale: (pulseAnim || new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.app_donationButton}
                onPress={() => {
                  // 부조하기 기능 구현 예정
                  console.log('부조하기 버튼 클릭됨');
                }}
              >
                <Ionicons name="gift" size={20} color="#6c5ce7" style={{ marginRight: 8 }} />
                <Text style={styles.app_donationButtonText}>부조하기</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* 공유하기 버튼 */}
            <Animated.View
              style={[
                {
                  transform: [{
                    scale: (pulseAnim || new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.app_shareButton}
                onPress={async () => {
                  try {
                    const dateStr = formatDate(eventData.date || eventData.event_date, { defaultDate: '2024년 11월 16일' });
                    const timeStr = formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' });
                    const location = eventData.location || '웨딩홀';
                    const groomName = eventData.groomName || eventData.groom_name || '신랑';
                    const brideName = eventData.brideName || eventData.bride_name || '신부';
                    
                    await Share.share({
                      message: `${groomName} ♥ ${brideName} 결혼식에 초대합니다!\n${dateStr} ${timeStr}\n${location}`,
                      title: '모바일 청첩장',
                    });
                  } catch (error) {
                    console.log('Share error:', error);
                  }
                }}
              >
                <Ionicons name="heart" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.app_shareButtonText}>청첩장 공유하기</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.app_socialButtons}>
              {[
                { name: 'logo-instagram', label: 'Instagram', color: '#E4405F' },
                { name: 'logo-facebook', label: 'Facebook', color: '#1877F2' },
                { name: 'chatbubble-ellipses', label: 'KakaoTalk', color: '#FEE500' }
              ].map((social, index) => (
                <Animated.View
                  key={social.name}
                  style={[
                    {
                      opacity: getSafeAnimValue(fadeAnims, 25 + index),
                      transform: [{
                        translateY: getSafeAnimValue(fadeAnims, 25 + index, 0).interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={[styles.app_socialButton, { backgroundColor: social.color }]}
                  >
                    <Ionicons name={social.name} size={18} color="#ffffff" />
                    <Text style={styles.app_socialButtonText}>{social.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>
      </ScrollView>

      <ImageViewer 
        visible={showImageViewer}
        images={[...safeImages.main, ...safeImages.gallery]}
        currentIndex={currentImageIndex}
        onClose={() => setShowImageViewer(false)}
        onIndexChange={setCurrentImageIndex}
      />
    </View>
  );
};

// 메인 렌더링 컴포넌트
export default function WeddingTemplatePreview({ template, eventData, userImages, categorizedImages }) {
  console.log('🔍 [MAIN COMPONENT] 입력 파라미터:', {
    template: template?.style || 'undefined',
    eventData: !!eventData,
    userImages: userImages?.length || 0,
    categorizedImages: !!categorizedImages
  });

  // template이 undefined인 경우 대비
  if (!template || !template.style) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>템플릿을 선택해주세요.</Text>
      </View>
    );
  }

  switch (template.style) {
    case 'modern-dark': 
      return <ModernDarkTemplate eventData={eventData || {}} categorizedImages={categorizedImages} />;
    case 'romantic-gold': 
      return <KoreanElegantTemplate eventData={eventData || {}} categorizedImages={categorizedImages} />;
    case 'vintage-app': 
      return <VintageAppTemplate eventData={eventData || {}} categorizedImages={categorizedImages} />;
    default: 
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>템플릿을 선택해주세요.</Text>
        </View>
      );
  }
}

// 완전히 새로운 스타일시트
const styles = StyleSheet.create({
  // =================================================================
  // 공통 컴포넌트 스타일
  // =================================================================
  petalsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  petal: {
    position: 'absolute',
    zIndex: 1,
  },
  petalText: {
    fontSize: 16,
    opacity: 0.7,
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 999,
    pointerEvents: 'none',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 20,
    bottom: height - 100,
  },
  heartIcon: {
    fontSize: 24,
  },
  
  // 카운트다운 공통 스타일
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  countdownItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    minWidth: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 5,
  },
  countdownLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdownExpired: {
    alignItems: 'center',
    padding: 20,
  },
  countdownExpiredText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  
  // 이미지 뷰어
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imageViewerContent: {
    width: '100%',
    height: '70%',
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerIndicator: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageViewerCounter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },

  // 메인 포토 슬라이드쇼
  mainPhotoSlideshow: {
    width: '100%',
    height: height * 0.6,
    position: 'relative',
  },
  mainPhotoImage: {
    width: '100%',
    height: '100%',
  },
  mainPhotoIndicators: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  mainPhotoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },

  // 갤러리
  galleryAutoSlide: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryAutoSlideImage: {
    width: '100%',
    height: '100%',
  },
  galleryAutoSlideIndicators: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  galleryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  galleryScroll: {
    width: '100%',
    height: 300,
  },
  galleryItem: {
    width: width - 60,
    height: 300,
    marginHorizontal: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  galleryItemImage: {
    width: '100%',
    height: '100%',
  },

  // =================================================================
  // 달력 스타일
  // =================================================================
  
  // 모던 다크 달력 스타일
  modernCalendar: {
    marginTop: 30,
    width: '100%',
  },
  modernCalendarContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modernCalendarHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modernCalendarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#667eea',
    letterSpacing: 1,
  },
  modernCalendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  modernCalendarWeekDay: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    width: 35,
    textAlign: 'center',
  },
  modernCalendarWeekendDay: {
    color: '#667eea',
  },
  modernCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modernCalendarDayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  modernCalendarDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modernCalendarTargetDay: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  modernCalendarToday: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modernCalendarOtherMonth: {
    opacity: 0.3,
  },
  modernCalendarDayText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  modernCalendarTargetDayText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  modernCalendarTodayText: {
    color: '#667eea',
    fontWeight: '600',
  },
  modernCalendarOtherMonthText: {
    color: 'rgba(255,255,255,0.3)',
  },
  modernCalendarWeekendText: {
    color: '#667eea',
  },
  modernCalendarDDayText: {
    fontSize: 8,
    marginTop: 2,
  },
  
  // 한국 전통 달력 스타일
  koreanCalendar: {
    marginTop: 30,
    width: '100%',
  },
  koreanCalendarContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  koreanCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  koreanCalendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    paddingHorizontal: 15,
  },
  koreanCalendarDecoLine: {
    flex: 1,
    height: 1,
    backgroundColor: KoreanColors.elegant.accent,
    opacity: 0.5,
  },
  koreanCalendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  koreanCalendarWeekDay: {
    fontSize: 12,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    width: 35,
    textAlign: 'center',
  },
  koreanCalendarWeekendDay: {
    color: KoreanColors.elegant.primary,
  },
  koreanCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  koreanCalendarDayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  koreanCalendarDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  koreanCalendarTargetDay: {
    backgroundColor: KoreanColors.elegant.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  koreanCalendarToday: {
    backgroundColor: KoreanColors.elegant.secondary,
    borderWidth: 1,
    borderColor: KoreanColors.elegant.primary,
  },
  koreanCalendarOtherMonth: {
    opacity: 0.3,
  },
  koreanCalendarDayText: {
    fontSize: 13,
    color: KoreanColors.elegant.text,
    fontWeight: '500',
  },
  koreanCalendarTargetDayText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  koreanCalendarTodayText: {
    color: KoreanColors.elegant.primary,
    fontWeight: '600',
  },
  koreanCalendarOtherMonthText: {
    color: 'rgba(26, 32, 44, 0.3)',
  },
  koreanCalendarSundayText: {
    color: '#E53E3E',
  },
  koreanCalendarSaturdayText: {
    color: '#3182CE',
  },
  koreanCalendarDDayText: {
    fontSize: 8,
    marginTop: 2,
  },
  
  // 빈티지 앱 달력 스타일
  vintageCalendar: {
    marginTop: 30,
    width: '100%',
  },
  vintageCalendarContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  vintageCalendarHeader: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  vintageCalendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  vintageCalendarHeaderDeco: {
    position: 'absolute',
    left: 15,
    right: 15,
    top: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vintageCalendarEmojiLeft: {
    fontSize: 16,
  },
  vintageCalendarEmojiRight: {
    fontSize: 16,
  },
  vintageCalendarContent: {
    backgroundColor: '#ffffff',
    padding: 20,
  },
  vintageCalendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  vintageCalendarWeekDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d3436',
    width: 35,
    textAlign: 'center',
  },
  vintageCalendarWeekendDay: {
    color: '#6c5ce7',
  },
  vintageCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vintageCalendarDayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  vintageCalendarDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  vintageCalendarTargetDay: {
    backgroundColor: '#fd79a8',
    shadowColor: '#fd79a8',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  vintageCalendarToday: {
    backgroundColor: '#f1f2f6',
    borderWidth: 2,
    borderColor: '#6c5ce7',
  },
  vintageCalendarOtherMonth: {
    opacity: 0.3,
  },
  vintageCalendarDayText: {
    fontSize: 13,
    color: '#2d3436',
    fontWeight: '500',
  },
  vintageCalendarTargetDayText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  vintageCalendarTodayText: {
    color: '#6c5ce7',
    fontWeight: '600',
  },
  vintageCalendarOtherMonthText: {
    color: 'rgba(45, 52, 54, 0.3)',
  },
  vintageCalendarWeekendText: {
    color: '#6c5ce7',
  },
  vintageCalendarDDayText: {
    fontSize: 8,
    marginTop: 2,
  },

  // =================================================================
  // Modern Dark Template Styles
  // =================================================================
  modern_container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modern_heroSection: {
    height: height,
    position: 'relative',
    overflow: 'hidden',
  },
  modern_mainPhotoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modern_heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  modern_bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#667eea',
    top: -200,
    left: -100,
  },
  modern_particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
  modern_heroContent: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 40,
  },
  modern_heroSubtitle: {
    fontFamily: Platform.OS === 'ios' ? 'Allura' : 'serif',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modern_heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 72,
    color: '#ffffff',
    marginBottom: 30,
    fontStyle: 'italic',
    textShadowColor: 'rgba(102, 126, 234, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  modern_heroNamesContainer: {
    marginBottom: 30,
  },
  modern_heroNames: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modern_heroDate: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  modern_heroTime: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
  },
  modern_countdownSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_sectionContent: {
    alignItems: 'center',
  },
  modern_countdownTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 48,
    color: '#ffffff',
    marginBottom: 40,
    fontStyle: 'italic',
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  modern_countdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  modern_countdownNumber: {
    fontSize: 32,
    color: '#667eea',
    fontWeight: '700',
    marginBottom: 5,
  },
  modern_countdownLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modern_calendarSection: {
    marginTop: 30,
  },
  modern_gallerySection: {
    backgroundColor: '#111111',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 48,
    color: '#ffffff',
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  modern_sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 50,
    textAlign: 'center',
  },
  modern_photoGallery: {
    marginBottom: 40,
  },
  modern_photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  modern_photoGridItem: {
    width: (width - 80) / 3,
    aspectRatio: 1,
  },
  modern_photoGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  modern_quoteSection: {
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  modern_quoteText: {
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  modern_quoteAuthor: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 2,
  },
  modern_detailsSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_detailsCards: {
    gap: 20,
  },
  modern_detailCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  modern_detailIcon: {
    fontSize: 32,
    marginBottom: 15,
  },
  modern_detailTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  modern_detailMain: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  modern_detailSub: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
  },
  modern_coupleSection: {
    backgroundColor: '#0a0a0a',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_coupleGrid: {
    gap: 40,
  },
  modern_coupleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  modern_couplePhotoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 3,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    position: 'relative',
  },
  modern_couplePhoto: {
    width: '100%',
    height: '100%',
  },
  modern_couplePhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  modern_coupleName: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: '400',
  },
  modern_coupleRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 15,
  },
  modern_coupleParents: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  modern_contactSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_contactGrid: {
    gap: 25,
    marginBottom: 50,
    width: '100%',
  },
  modern_contactCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  modern_contactButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    width: '100%',
  },
  modern_contactName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  modern_contactBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  modern_contactBtnText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 5,
    fontWeight: '500',
  },
  modern_shareButtonContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  modern_shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modern_shareButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },

  // 부조하기 섹션 추가
  modern_donationSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_donationTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 48,
    color: '#ffffff',
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  modern_donationSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  modern_donationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modern_donationButtonText: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '700',
  },

  // =================================================================
  // Korean Elegant Template Styles
  // =================================================================
  korean_container: {
    flex: 1,
    backgroundColor: KoreanColors.elegant.light,
  },
  korean_scrollView: {
    flex: 1,
  },
  
  // 헤로 섹션
  korean_heroSection: {
    minHeight: height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  korean_heroContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  korean_mainPhotoContainer: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  
  // 이름 섹션
  korean_namesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  korean_groomName: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: KoreanColors.elegant.text,
    fontWeight: '600',
  },
  korean_brideName: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: KoreanColors.elegant.text,
    fontWeight: '600',
  },
  korean_heartContainer: {
    marginHorizontal: 15,
  },
  
  // 날짜 섹션
  korean_dateContainer: {
    alignItems: 'center',
  },
  korean_dateYear: {
    fontSize: 16,
    color: KoreanColors.elegant.primary,
    marginBottom: 5,
  },
  korean_dateMonthDay: {
    fontSize: 48,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: KoreanColors.elegant.text,
    fontWeight: '300',
    lineHeight: 48,
  },
  korean_dateDayOfWeek: {
    fontSize: 18,
    color: KoreanColors.elegant.primary,
    marginBottom: 10,
  },
  korean_dateTime: {
    fontSize: 16,
    color: KoreanColors.elegant.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // 카운트다운 섹션 추가
  korean_countdownSection: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    position: 'relative',
  },
  korean_countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  korean_countdownNumber: {
    fontSize: 28,
    color: KoreanColors.elegant.primary,
    fontWeight: '700',
  },
  korean_countdownLabel: {
    fontSize: 12,
    color: KoreanColors.elegant.text,
    fontWeight: '600',
  },
  korean_calendarSection: {
    marginTop: 30,
  },
  
  // 공통 섹션 스타일
  korean_messageSection: {
    paddingHorizontal: 30,
    paddingVertical: 50,
    alignItems: 'center',
  },
  korean_coupleSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  korean_weddingInfoSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    position: 'relative',
  },
  korean_gallerySection: {
    paddingVertical: 50,
  },
  korean_locationSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  korean_contributionSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    position: 'relative',
  },
  korean_shareSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  korean_footerSection: {
    paddingHorizontal: 30,
    paddingVertical: 50,
    alignItems: 'center',
  },
  
  // 섹션 헤더
  korean_sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  korean_sectionTitle: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: KoreanColors.elegant.text,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  korean_decorativeLine: {
    flex: 1,
    height: 1,
    backgroundColor: KoreanColors.elegant.accent,
    opacity: 0.5,
  },
  
  // 메시지
  korean_customMessage: {
    fontSize: 16,
    lineHeight: 28,
    color: KoreanColors.elegant.text,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  
  // 커플 정보
  korean_coupleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  korean_personCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  korean_personPhotoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 15,
  },
  korean_personPhoto: {
    width: '100%',
    height: '100%',
  },
  korean_personName: {
    fontSize: 18,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    marginBottom: 5,
  },
  korean_personRole: {
    fontSize: 12,
    color: KoreanColors.elegant.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  korean_parentNames: {
    fontSize: 12,
    color: KoreanColors.elegant.text,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 15,
  },
  korean_contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KoreanColors.elegant.light,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: KoreanColors.elegant.primary,
  },
  korean_contactButtonText: {
    fontSize: 12,
    color: KoreanColors.elegant.primary,
    marginLeft: 5,
    fontWeight: '500',
  },
  
  // 정보 카드
  korean_infoCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  korean_infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  korean_infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: KoreanColors.elegant.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  korean_infoContent: {
    flex: 1,
  },
  korean_infoLabel: {
    fontSize: 12,
    color: KoreanColors.elegant.primary,
    marginBottom: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  korean_infoValue: {
    fontSize: 16,
    color: KoreanColors.elegant.text,
    fontWeight: '600',
    marginBottom: 3,
  },
  korean_infoSubValue: {
    fontSize: 14,
    color: KoreanColors.elegant.text,
    opacity: 0.7,
  },
  
  // 갤러리
  korean_galleryScroll: {
    paddingLeft: 20,
  },
  korean_galleryItem: {
    width: width * 0.7,
    height: width * 0.7,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  korean_galleryImage: {
    width: '100%',
    height: '100%',
  },
  
  // 지도 및 위치
  korean_mapContainer: {
    height: 200,
    backgroundColor: KoreanColors.elegant.secondary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  korean_mapPlaceholder: {
    fontSize: 48,
    marginBottom: 10,
  },
  korean_mapText: {
    fontSize: 14,
    color: KoreanColors.elegant.text,
    opacity: 0.7,
  },
  korean_locationButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  korean_locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KoreanColors.elegant.primary,
    paddingVertical: 15,
    borderRadius: 15,
  },
  korean_locationButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: KoreanColors.elegant.primary,
  },
  korean_locationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  korean_locationButtonTextSecondary: {
    color: KoreanColors.elegant.primary,
  },
  
  // 축의금
  korean_contributionCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  korean_contributionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    marginBottom: 15,
  },
  korean_contributionDescription: {
    fontSize: 14,
    color: KoreanColors.elegant.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  korean_contributionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KoreanColors.elegant.light,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: KoreanColors.elegant.primary,
  },
  korean_contributionButtonText: {
    color: KoreanColors.elegant.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // 공유 버튼
  korean_shareButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  korean_shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  korean_shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  
  // 푸터
  korean_footerMessage: {
    fontSize: 16,
    color: KoreanColors.elegant.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  korean_footerNames: {
    fontSize: 20,
    fontWeight: '600',
    color: KoreanColors.elegant.primary,
    marginBottom: 10,
  },
  korean_footerDate: {
    fontSize: 14,
    color: KoreanColors.elegant.text,
    opacity: 0.7,
  },

  // =================================================================
  // Vintage App Template Styles
  // =================================================================
  app_container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  app_statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  app_statusLeft: {
    flex: 1,
  },
  app_statusCenter: {
    flex: 1,
    alignItems: 'center',
  },
  app_statusTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6c5ce7',
  },
  app_statusRight: {
    flex: 1,
  },
  app_scrollContainer: {
    flex: 1,
  },
  app_heroSection: {
    height: height * 0.85,
    position: 'relative',
    overflow: 'hidden',
  },
  app_mainPhotoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  app_sparkle: {
    position: 'absolute',
    fontSize: 18,
  },
  app_heroContent: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 40,
  },
  app_heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 64,
    color: '#ffffff',
    marginBottom: 20,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  app_heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  app_heroNames: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 20,
  },
  app_heroDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 18,
  },
  app_scrollHint: {
    position: 'absolute',
    bottom: 30,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // 카운트다운 섹션
  app_countdownSection: {
    paddingVertical: 60,
    paddingHorizontal: 25,
  },
  app_countdownTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  app_countdownSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  app_countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  app_countdownNumber: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
  },
  app_countdownLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  app_calendarSection: {
    marginTop: 30,
  },
  
  app_sectionContent: {
    alignItems: 'center',
  },
  app_sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  app_sectionSubtitle: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 40,
  },
  app_gallerySection: {
    backgroundColor: '#ffffff',
    paddingVertical: 80,
    paddingHorizontal: 25,
  },
  app_photoGallery: {
    marginBottom: 30,
  },
  app_photoMasonry: {
    flexDirection: 'row',
    gap: 10,
  },
  app_photoColumn: {
    flex: 1,
    gap: 10,
  },
  app_photoMasonryItem: {
    width: '100%',
    borderRadius: 15,
    backgroundColor: '#f1f2f6',
  },
  app_cardsSection: {
    paddingVertical: 80,
    paddingHorizontal: 25,
  },
  app_infoCards: {
    gap: 20,
  },
  app_infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.1)',
  },
  app_cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  app_cardIconText: {
    fontSize: 24,
  },
  app_cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 10,
  },
  app_cardDescription: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 22,
    marginBottom: 8,
  },
  app_cardDetails: {
    fontSize: 12,
    fontWeight: '500',
  },
  app_coupleSection: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 80,
    paddingHorizontal: 25,
  },
  app_coupleCards: {
    gap: 30,
  },
  app_coupleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  app_couplePhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#f1f2f6',
  },
  app_couplePhoto: {
    width: '100%',
    height: '100%',
  },
  app_coupleName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  app_coupleRole: {
    fontSize: 12,
    color: '#6c5ce7',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  app_coupleParents: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  app_contactSection: {
    paddingVertical: 80,
    paddingHorizontal: 25,
  },
  app_contactCards: {
    gap: 20,
    marginBottom: 40,
    width: '100%',
  },
  app_contactCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 10,
    width: '100%',
  },
  app_contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  app_contactAvatarText: {
    fontSize: 28,
  },
  app_contactInfo: {
    flex: 1,
  },
  app_contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 3,
  },
  app_contactPhone: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 3,
  },
  app_contactRole: {
    fontSize: 12,
    color: '#636e72',
  },
  app_contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginLeft: 10,
  },
  app_contactButtonText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 5,
    fontWeight: '500',
  },
  app_shareSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  app_shareTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  app_shareSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  
  // 부조하기 버튼 추가
  app_donationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    marginBottom: 20,
  },
  app_donationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c5ce7',
  },
  
  app_shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    marginBottom: 30,
  },
  app_shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  app_socialButtons: {
    flexDirection: 'row',
    gap: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  app_socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  app_socialButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
});