// src/screens/main/HomeScreen.js - 개선된 통계 UI 포함 전체 코드
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Colors } from '../../styles/constants';
import { supabase } from '../../lib/supabase';
import { 
  getUserEvents, 
  getActiveEvents, 
  getAllUserEvents,
  createPersonalSchedule,
  getPersonalSchedules,
  debugUserInfo,
  getEventGuestBook,
  getMonthlyStatistics,
  getEventStatistics,
  getUserSubscriptionInfo
} from '../../lib/supabaseHelper';
import * as Notifications from 'expo-notifications';
import NotificationPermissionModal from '../../components/NotificationPermissionModal';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// 🔥 이벤트 역할 구분
const EVENT_ROLES = {
  HOST: 'host',        // 주최자 (내가 주최하는 경조사)
  PARTICIPANT: 'participant'  // 참여자 (참석할 다른 사람의 경조사)
};

// 🔥 캘린더 컴포넌트
const CalendarComponent = ({ events, onDatePress, onEventPress, currentCalendarDate, onMonthChange }) => {
  const [currentDate, setCurrentDate] = useState(currentCalendarDate || new Date());
  
  // 현재 월의 첫 번째 날과 마지막 날
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 달력 시작 날짜 (이전 월의 일부 포함)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // 달력 끝 날짜 (다음 월의 일부 포함)
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
  
  // 날짜 배열 생성 (6주)
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  // 특정 날짜의 개인 일정만 찾기 (주최한 경조사 제외)
  const getEventsForDate = (date) => {
    const filteredEvents = events.filter(event => {
      if (!event.event_date) return false;
      const eventDate = new Date(event.event_date);
      const isPersonalSchedule = event.source === 'personal' || event.is_personal_schedule;
      const matchesDate = eventDate.toDateString() === date.toDateString();
      
      // 디버깅 로그
      // if (matchesDate) {
      //   console.log('📅 캘린더 날짜 매칭:', {
      //     date: date.toDateString(),
      //     eventDate: eventDate.toDateString(),
      //     eventName: event.event_name || event.title,
      //     isPersonalSchedule,
      //     source: event.source,
      //     is_personal_schedule: event.is_personal_schedule
      //   });
      // }
      
      return matchesDate && isPersonalSchedule;
    });
    
    // if (filteredEvents.length > 0) {
    //   console.log('📅 해당 날짜 이벤트 수:', filteredEvents.length, 'for', date.toDateString());
    // }
    
    return filteredEvents;
  };
  
  // 이전/다음 달로 이동
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    onMonthChange && onMonthChange(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    onMonthChange && onMonthChange(newDate);
  };
  
  const renderDate = (date, index) => {
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isToday = date.toDateString() === new Date().toDateString();
    const dayEvents = getEventsForDate(date);
    const eventCount = dayEvents.length;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          !isCurrentMonth && styles.calendarDayOther,
          isToday && styles.calendarDayToday,
        ]}
        onPress={() => onDatePress(date, dayEvents)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.calendarDayText,
          !isCurrentMonth && styles.calendarDayTextOther,
          isToday && styles.calendarDayTextToday,
        ]}>
          {date.getDate()}
        </Text>
        
        {/* 일정 표시 점들 */}
        {eventCount > 0 && (
          <View style={styles.eventIndicatorContainer}>
            {eventCount === 1 ? (
              <View style={[styles.eventDot, styles.personalEventDot]} />
            ) : eventCount === 2 ? (
              <>
                <View style={[styles.eventDot, styles.personalEventDot]} />
                <View style={[styles.eventDot, styles.personalEventDot]} />
              </>
            ) : (
              <View style={styles.multipleEventIndicator}>
                <Text style={styles.multipleEventText}>{eventCount}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.calendar}>
      {/* 캘린더 헤더 */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.calendarHeaderTitle}>
          {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* 요일 헤더 */}
      <View style={styles.calendarWeekHeader}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <View key={index} style={styles.calendarWeekDay}>
            <Text style={[
              styles.calendarWeekDayText,
              index === 0 && styles.calendarSundayText,
              index === 6 && styles.calendarSaturdayText
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      
      {/* 날짜 그리드 */}
      <View style={styles.calendarGrid}>
        {dates.map((date, index) => renderDate(date, index))}
      </View>
    </View>
  );
};

// 🔥 일정 추가 모달 컴포넌트
const EventAddModal = ({ visible, onClose, selectedDate, onAddEvent }) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('wedding'); // 'wedding' 또는 'funeral'
  const [eventLocation, setEventLocation] = useState('');

  const handleAddEvent = () => {
    if (eventTitle.trim()) {
      onAddEvent(eventTitle, eventType, eventLocation);
      setEventTitle('');
      setEventLocation('');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.modalContent}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>일정 추가</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          </View>
          
          {/* 선택된 날짜 표시 */}
          <View style={styles.selectedDateContainer}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
          </View>
          
          {/* 경조사 종류 선택 */}
          <View style={styles.eventTypeContainer}>
            <Text style={styles.inputLabel}>경조사 종류</Text>
            <View style={styles.eventTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.eventTypeButton,
                  eventType === 'wedding' && styles.eventTypeButtonActive
                ]}
                onPress={() => setEventType('wedding')}
              >
                <Ionicons 
                  name="heart" 
                  size={20} 
                  color={eventType === 'wedding' ? Colors.white : Colors.wedding} 
                />
                <Text style={[
                  styles.eventTypeButtonText,
                  eventType === 'wedding' && styles.eventTypeButtonTextActive
                ]}>
                  결혼식
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.eventTypeButton,
                  eventType === 'funeral' && styles.eventTypeButtonActive
                ]}
                onPress={() => setEventType('funeral')}
              >
                <Ionicons 
                  name="flower" 
                  size={20} 
                  color={eventType === 'funeral' ? Colors.white : Colors.funeral} 
                />
                <Text style={[
                  styles.eventTypeButtonText,
                  eventType === 'funeral' && styles.eventTypeButtonTextActive
                ]}>
                  장례식
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 일정 제목 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>일정 제목</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`예: ${eventType === 'wedding' ? '김철수 결혼식' : '동료 부친상'}`}
              value={eventTitle}
              onChangeText={setEventTitle}
              autoFocus={true}
              multiline={false}
              returnKeyType="next"
            />
          </View>
          
          {/* 장소 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>장소 (선택사항)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="예: 강남구 웨딩홀, 서초동 장례식장"
              value={eventLocation}
              onChangeText={setEventLocation}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={handleAddEvent}
            />
          </View>
          
          {/* 액션 버튼들 */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelButtonText}>취소</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalAddButton,
                !eventTitle.trim() && styles.modalAddButtonDisabled
              ]}
              onPress={handleAddEvent}
              disabled={!eventTitle.trim()}
            >
              <Text style={[
                styles.modalAddButtonText,
                !eventTitle.trim() && styles.modalAddButtonTextDisabled
              ]}>
                일정 추가
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 📱 푸시 알림 핸들러 설정 (Expo Go에서는 제한됨)
try {
  if (typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (error) {
}

export default function HomeScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [user, setUser] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTab, setSelectedTab] = useState('active'); // 'active' or 'completed'
  
  // 🚀 캐싱을 위한 상태들 - 성능 최적화
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const CACHE_DURATION = 30000; // 30초 캐시
  const [calendarDate, setCalendarDate] = useState(new Date()); // 🔥 캘린더 현재 날짜 상태
  const [currentEventPage, setCurrentEventPage] = useState(0); // 🔥 현재 페이지
  const eventsPerPage = 3; // 페이지당 표시할 이벤트 수
  
  // 📱 알림 관련 상태
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false); // 🔥 일정 추가 모달 상태
  const [selectedDate, setSelectedDate] = useState(new Date()); // 🔥 선택된 날짜
  const [showEventListModal, setShowEventListModal] = useState(false); // 🔥 일정 목록 모달 상태
  const [selectedDateEvents, setSelectedDateEvents] = useState([]); // 🔥 선택된 날짜의 일정들
  const [showTossConfirmModal, setShowTossConfirmModal] = useState(false); // 🔥 토스 스타일 확인 모달
  const [showTossSuccessModal, setShowTossSuccessModal] = useState(false); // 🔥 토스 스타일 성공 모달
  const [showCreateEventModal, setShowCreateEventModal] = useState(false); // 경조사 만들기 모달
  const [showPremiumModal, setShowPremiumModal] = useState(false); // 🔥 프리미엄 업그레이드 모달
  const [premiumModalType, setPremiumModalType] = useState(''); // 'wedding' or 'funeral'
  const [monthlyStats, setMonthlyStats] = useState({
    totalEvents: 0,
    monthlyEvents: 0,
    activeEvents: 0,
    
    // 전체 통계
    totalAmount: 0,
    totalWeddingAmount: 0,
    totalFuneralAmount: 0,
    totalEntries: 0,
    
    // 이번 달 통계
    receivedAmount: 0,
    monthlyWeddingAmount: 0,
    monthlyFuneralAmount: 0,
    totalContributions: 0,
    
    // 이벤트별 상세
    eventDetails: [],
    
    // 보낸 금액 (추후 구현)
    sentAmount: 0,
    sentContributions: 0,
    
    // 기간 정보
    period: null
  });
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const eventIdsRef = useRef([]);

  // 토스 모달 애니메이션 값들
  const confirmModalSlideAnim = useRef(new Animated.Value(0)).current;
  const confirmModalOpacity = useRef(new Animated.Value(0)).current;
  const successModalScale = useRef(new Animated.Value(0)).current;
  const successModalOpacity = useRef(new Animated.Value(0)).current;

  // Props 확인 & 네트워크 테스트
  useEffect(() => {

    // 네트워크 연결 테스트
    fetch('https://ofshqvrldcesvjtredxo.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc2hxdnJsZGNlc3ZqdHJlZHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDI1MTQsImV4cCI6MjA2NDYxODUxNH0.uIfuqMP7SFvQfQXSESS9xKHWlBYeWmZwf1j_4eveZ6Q'
      }
    })
    
    ;

  }, [userInfo, session, isAuthenticated]);

  // 슬라이드 데이터 - 경조사 종류별로 구성
  const slides = [
    {
      backgroundColor: Colors.primary,
      title: '마음을 나누는\n가장 쉬운 방법',
      subtitle: '정성스러운 마음을 기록해보세요 💝',
      icon: 'people',
    },
    {
      backgroundColor: Colors.wedding,
      title: '소중한 순간을\n함께 기록하세요',
      subtitle: '결혼식, 돌잔치 등 기쁜 날들 🎉',
      icon: 'heart',
    },
    {
      backgroundColor: Colors.funeral,
      title: '마지막 인사를\n정중하게 전하세요',
      subtitle: '고인의 명복을 빌며 🕊️',
      icon: 'flower',
    },
    {
      backgroundColor: Colors.success,
      title: 'QR 코드로\n간편하게 참여하세요',
      subtitle: '스캔 한 번으로 부조 완료 📱',
      icon: 'qr-code',
    },
  ];

  // 화면 포커스 시 데이터 새로고침 - 캐싱과 병렬 로딩으로 성능 최적화
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const shouldRefresh = !dataLoaded || (now - lastLoadTime > CACHE_DURATION);
      
      if (!shouldRefresh) {
        return;
      }
      
      setLoading(true);
      
      // 모든 데이터를 병렬로 로드하여 성능 개선
      Promise.all([
        loadUserData(),
        loadEvents(),
        loadActiveEvents(),
        loadMonthlyStatistics()
      ]).then(() => {
        setLastLoadTime(now);
        setDataLoaded(true);
        setLoading(false);
      }).catch((error) => {
        setLoading(false);
      });
    }, [userInfo, session, dataLoaded, lastLoadTime])
  );

  // eventIds ref를 최신 상태로 유지
  useEffect(() => {
    eventIdsRef.current = events.map(e => e.id).filter(id => id);
  }, [events]);

  // 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [fadeAnim]);


  // 📱 알림 권한 체크 및 설정
  useEffect(() => {
    const checkNotificationPermission = async () => {
      try {
        const actualUserInfo = userInfo?.userId ? {
          id: userInfo.userId,
          name: userInfo.userName
        } : userInfo;

        if (!actualUserInfo?.id) return;

        const { data: userData, error } = await supabase
          .from('users')
          .select('push_notification_enabled')
          .eq('id', actualUserInfo.id)
          .single();

        if (error) {
          const permissionAsked = await AsyncStorage.getItem('notificationPermissionAsked');
          if (!permissionAsked) {
            setTimeout(() => setShowNotificationModal(true), 2000);
          }
          return;
        }

        if (userData && userData.push_notification_enabled === false) {
          const permissionAsked = await AsyncStorage.getItem('notificationPermissionAsked');
          if (!permissionAsked) {
            setTimeout(() => setShowNotificationModal(true), 2000);
          }
        }
      } catch (error) {
      }
    };

    checkNotificationPermission();
  }, [userInfo]);

  // 📱 푸시 알림 수신 리스너
  useEffect(() => {

    let notificationListener = null;
    let responseListener = null;

    try {
      // Expo Go에서는 알림 기능이 제한됨 - 함수 존재 여부 확인
      if (typeof Notifications.addNotificationReceivedListener === 'function') {
        // 포그라운드에서 알림 수신 시
        notificationListener = Notifications.addNotificationReceivedListener(notification => {

          // 축의금 알림인 경우 데이터 새로고침
          if (notification.request.content.data?.type === 'contribution') {
            loadEvents(); // 이벤트 목록 새로고침
            loadMonthlyStatistics(); // 통계 새로고침

            // 토스트 메시지 표시
            Toast.show({
              type: 'success',
              text1: '💰 새로운 축의금',
              text2: notification.request.content.body,
              position: 'top',
              visibilityTime: 4000,
            });
          }
        });
      }

      if (typeof Notifications.addNotificationResponseReceivedListener === 'function') {
        // 알림 클릭 시 응답
        responseListener = Notifications.addNotificationResponseReceivedListener(response => {

          // 축의금 알림 클릭 시 해당 이벤트로 이동
          if (response.notification.request.content.data?.type === 'contribution') {
            const eventId = response.notification.request.content.data.eventId;
            if (eventId) {
              // 이벤트 상세 화면으로 이동
              navigation.navigate('EventDisplay', { eventId });
            }
          }
        });
      }
    } catch (error) {
    }

    return () => {
      try {
        // 함수 존재 여부 확인 후 호출
        if (notificationListener && typeof Notifications.removeNotificationSubscription === 'function') {
          Notifications.removeNotificationSubscription(notificationListener);
        } else if (notificationListener?.remove) {
          notificationListener.remove();
        }

        if (responseListener && typeof Notifications.removeNotificationSubscription === 'function') {
          Notifications.removeNotificationSubscription(responseListener);
        } else if (responseListener?.remove) {
          responseListener.remove();
        }
      } catch (error) {
      }
    };
  }, [navigation]);

  // 📱 축의금 실시간 업데이트 리스너
  useEffect(() => {
    const actualUserInfo = userInfo?.userId ? {
      id: userInfo.userId,
      name: userInfo.userName
    } : userInfo;

    if (!actualUserInfo?.id) return;

    const channelName = `guest-book-realtime-${actualUserInfo.id}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'guest_book' },
        (payload) => {
          const changeType = payload.eventType || payload.event;
          const contributionData = payload.new || payload.old;
          const contributionEventId = contributionData?.event_id;
          const currentEventIds = eventIdsRef.current;

          // 내 이벤트인 경우만 처리
          if (currentEventIds.includes(contributionEventId)) {
            if (contributionData) {
              Toast.show({
                type: 'info',
                text1: '💰 축의금 알림',
                text2: `${contributionData.guest_name || '익명'}님 - ${(contributionData.amount || 0).toLocaleString()}원`,
                position: 'top',
                visibilityTime: 3000,
              });
            }
            handleContributionChange(changeType, contributionData, currentEventIds);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userInfo]);



  // 📱 축의금 변경 처리 공통 함수
  const handleContributionChange = (eventType, contribution, eventIds) => {
    if (!eventIds.includes(contribution?.event_id)) return;

    const actionText = eventType === 'INSERT' ? '전달' : '수정';
    Toast.show({
      type: 'success',
      text1: `💰 축의금 ${actionText}!`,
      text2: `${contribution.guest_name}님이 ${contribution.amount?.toLocaleString()}원을 ${actionText}했습니다`,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });

    setDataLoaded(false);
    loadMonthlyStatistics();
  };

  // 🔥 월별 통계 로드 함수
  const loadMonthlyStatistics = async () => {
    try {
      
      // 현재 사용자 정보 가져오기
      let currentUserId = null;
      
      if (userInfo?.userId) {
        currentUserId = userInfo.userId;
      } else if (session?.user?.id) {
        currentUserId = session.user.id;
      } else {
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        if (storedUserInfo) {
          const parsedInfo = JSON.parse(storedUserInfo);
          currentUserId = parsedInfo.userId;
        }
      }
      
      if (!currentUserId) {
        return;
      }
      
      const result = await getMonthlyStatistics(currentUserId);
      
      if (result.success) {
        setMonthlyStats(result.data);
      } else {
      }
      
    } catch (error) {
    }
  };

  // 🔥 서울 시간 기준 날짜 비교 함수 - 완전히 새로 작성
  const isEventCompleted = (eventDate) => {
    if (!eventDate) {
      return true; // 미정인 경우 완료로 처리
    }

    try {
      // 현재 서울 시간 구하기
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 이벤트 날짜 구하기
      const eventDay = new Date(eventDate);
      const eventDateOnly = new Date(eventDay.getFullYear(), eventDay.getMonth(), eventDay.getDate());

      // 오늘보다 이전이면 완료, 오늘 이후(오늘 포함)면 진행중
      const isCompleted = eventDateOnly < today;

      return isCompleted;

    } catch (error) {
      return true;
    }
  };

  // 🔥 개선된 사용자 정보 로드 함수 - 명확한 우선순위
  const loadUserData = async () => {
    try {
      
      // 🔥 디버깅을 위해 사용자 정보 확인
      await debugUserInfo();
      
      // 1순위: Props로 받은 userInfo (폰 인증)
      if (userInfo?.userId) {
        setUser({
          id: userInfo.userId,
          user_metadata: { name: userInfo.userName },
          phone: userInfo.phone,
          auth_method: 'phone'
        });
        
        // 구독 정보 로드
        await loadSubscriptionInfo(userInfo.userId);
        return;
      }
      
      // 2순위: Supabase Auth 세션
      if (session?.user) {
        setUser(session.user);
        
        // 구독 정보 로드
        await loadSubscriptionInfo(session.user.id);
        return;
      }
      
      // 3순위: AsyncStorage 확인 (폰 인증)
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      if (isLoggedIn === 'true' && storedUserInfo) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        setUser({
          id: parsedUserInfo.userId,
          user_metadata: { name: parsedUserInfo.userName },
          phone: parsedUserInfo.phone,
          auth_method: 'phone'
        });
        
        // 구독 정보 로드
        await loadSubscriptionInfo(parsedUserInfo.userId);
        return;
      }
      
      // 4순위: 직접 Supabase 조회
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // 구독 정보 로드
        await loadSubscriptionInfo(user.id);
      } else {
      }
      
    } catch (error) {
    }
  };

  // 🔥 구독 정보 로드 함수
  const loadSubscriptionInfo = async (userId) => {
    try {
      const result = await getUserSubscriptionInfo(userId);
      
      // subscription 객체 추출 및 필드명 변환
      const subscriptionInfo = result?.subscription ? {
        subscription_type: result.subscription.type || 'free',
        max_wedding_events: result.subscription.maxWeddingEvents || 1,
        max_funeral_events: result.subscription.maxFuneralEvents || 1,
        current_wedding_events: result.subscription.currentWeddingEvents || 0,
        current_funeral_events: result.subscription.currentFuneralEvents || 0
      } : {
        subscription_type: 'free',
        max_wedding_events: 1,
        max_funeral_events: 1,
        current_wedding_events: 0,
        current_funeral_events: 0
      };
      
      
      setUserSubscription(subscriptionInfo);
    } catch (error) {
      // 기본값 설정
      setUserSubscription({
        subscription_type: 'free',
        max_wedding_events: 1,
        max_funeral_events: 1,
        current_wedding_events: 0,
        current_funeral_events: 0
      });
    }
  };

  // 🔥 개선된 이벤트 로드 함수 - 명확한 사용자 정보 전달
  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // 🔥 명확한 사용자 정보 준비
      let currentUserInfo = null;
      
      if (userInfo?.userId) {
        // Props에서 받은 정보 사용
        currentUserInfo = {
          id: userInfo.userId,
          name: userInfo.userName,
          phone: userInfo.phone,
          auth_method: 'phone'
        };
      } else if (session?.user) {
        // Supabase 세션 사용
        currentUserInfo = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          email: session.user.email,
          auth_method: 'supabase'
        };
      }
      
      if (!currentUserInfo) {
        setEvents([]);
        return;
      }
      
      const result = await getAllUserEvents(currentUserInfo);
      
      if (result.success) {
        
        // 🔥 각 이벤트별 통계 정보 추가
        const eventsWithStats = await Promise.all(
          (result.data || []).map(async (event) => {
            try {
              const statsResult = await getEventStatistics(event.id);
              if (statsResult.success) {
                const eventWithStats = {
                  ...event,
                  total_contributions: statsResult.data.totalContributions,
                  total_amount: statsResult.data.totalAmount,
                  verified_count: statsResult.data.verifiedCount,
                  attending_count: statsResult.data.attendingCount,
                  average_amount: statsResult.data.averageAmount
                };
                return eventWithStats;
              }
            } catch (error) {
            }
            // 통계 로드 실패 시 기본값
            return {
              ...event,
              total_contributions: 0,
              total_amount: 0,
              verified_count: 0,
              attending_count: 0,
              average_amount: 0
            };
          })
        );
        
        setEvents(eventsWithStats);
      } else {
        setEvents([]);
      }
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 개선된 활성 이벤트 로드 함수 - 개인 일정 포함
  const loadActiveEvents = async () => {
    try {
      
      // 🔥 상태 초기화
      setActiveEvents([]);
      
      // 개인 일정 불러오기
      const personalResult = await getPersonalSchedules();
      
      if (personalResult.success) {
        const personalSchedules = personalResult.data || [];
        
        // 개인 일정에 필요한 속성 추가
        const formattedSchedules = personalSchedules.map(schedule => ({
          ...schedule,
          is_personal_schedule: true,
          source: 'personal'
        }));
        
        // 🔥 중복 제거 - ID 기준으로 고유한 이벤트만 필터링
        const uniqueEvents = formattedSchedules.filter((event, index, self) => 
          index === self.findIndex(e => e.id === event.id)
        );
        
        
        setActiveEvents(uniqueEvents);
      } else {
        setActiveEvents([]);
      }
    } catch (error) {
      setActiveEvents([]);
    }
  };


  // 🔥 수정된 빠른 시작 버튼 핸들러 - 구독 제한 체크 포함
  const handleQuickStart = async (eventType) => {
    // 구독 제한 체크
    const userId = user?.id;
    if (userId && userSubscription) {
      const { checkEventCreationLimit } = require('../../lib/supabaseHelper');
      const canCreate = await checkEventCreationLimit(eventType, userId);
      
      if (!canCreate) {
        setPremiumModalType(eventType);
        setShowPremiumModal(true);
        return;
      }
    }

    if (eventType === 'wedding') {
      // 🆕 결혼식은 전용 스크린으로
      navigation.navigate('CreateWedding');
    } else if (eventType === 'funeral') {
      // 🔄 부고는 전용 스크린으로 수정
      navigation.navigate('CreateFuneral');
    } else {
      // 🔄 기타 타입들은 기존 방식 유지
      navigation.navigate('CreateEvent', { eventType });
    }
  };

  // 🔥 토스 모달 애니메이션 함수들
  const showConfirmModal = () => {
    setShowTossConfirmModal(true);
    // 동시에 슬라이드업과 페이드인 애니메이션
    Animated.parallel([
      Animated.timing(confirmModalSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(confirmModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideConfirmModal = () => {
    Animated.parallel([
      Animated.timing(confirmModalSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(confirmModalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowTossConfirmModal(false);
      // 애니메이션 값 초기화
      confirmModalSlideAnim.setValue(0);
      confirmModalOpacity.setValue(0);
    });
  };

  const showSuccessModal = () => {
    setShowTossSuccessModal(true);
    // 스케일과 페이드인 애니메이션
    Animated.parallel([
      Animated.spring(successModalScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideSuccessModal = () => {
    Animated.parallel([
      Animated.spring(successModalScale, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowTossSuccessModal(false);
      // 애니메이션 값 초기화
      successModalScale.setValue(0);
      successModalOpacity.setValue(0);
    });
  };

  // 🔥 캘린더 날짜 클릭 핸들러
  const handleCalendarDatePress = (date, dayEvents = []) => {
    setSelectedDate(date);
    setSelectedDateEvents(dayEvents);
    
    if (dayEvents.length === 0) {
      // 일정이 없는 경우: 바로 일정 추가 모달
      setShowEventModal(true);
    } else {
      // 일정이 있는 경우: 토스 스타일 확인 모달 (애니메이션 포함)
      showConfirmModal();
    }
  };

  // 🔥 캘린더 월 변경 핸들러
  const handleCalendarMonthChange = (newDate) => {
    setCalendarDate(newDate);
  };

  // 🔥 현재 캘린더 월의 경조사 필터링 함수
  const getMonthlyEvents = () => {
    const currentMonth = calendarDate.getMonth();
    const currentYear = calendarDate.getFullYear();
    
    // 개인 일정(activeEvents)만 사용
    return activeEvents.filter(event => {
      if (!event.event_date) return false;
      
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear;
    }).sort((a, b) => {
      // 날짜순 정렬
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return new Date(a.event_date) - new Date(b.event_date);
    });
  };

  // 🔥 월별 이벤트를 주최자/참여자로 분리
  const getGroupedMonthlyEvents = () => {
    const monthlyEvents = getMonthlyEvents();
    const hostEvents = monthlyEvents.filter(event => 
      event.source === 'hosted' && !event.is_personal_schedule
    );
    const participantEvents = monthlyEvents.filter(event => 
      event.source === 'personal' || event.is_personal_schedule
    );
    
    return { hostEvents, participantEvents };
  };

  // 🔥 이벤트 역할 구분 함수
  const getEventRole = (event) => {
    // 주최자: 내가 생성한 경조사 (events 테이블에서 온 데이터)
    if (event.source === 'hosted' && !event.is_personal_schedule) {
      return EVENT_ROLES.HOST;
    }
    // 참여자: 개인 일정으로 추가한 다른 사람의 경조사
    if (event.source === 'personal' || event.is_personal_schedule) {
      return EVENT_ROLES.PARTICIPANT;
    }
    return EVENT_ROLES.PARTICIPANT; // 기본값
  };

  // 🔥 역할별 이벤트 분리 함수
  const separateEventsByRole = (events) => {
    const hostEvents = events.filter(event => getEventRole(event) === EVENT_ROLES.HOST);
    const participantEvents = events.filter(event => getEventRole(event) === EVENT_ROLES.PARTICIPANT);
    
    return {
      hostEvents,
      participantEvents
    };
  };


  // 🔥 이벤트 클릭 처리 - 소스에 따라 다르게 처리
  const handleActiveEventPress = (event, source = 'management') => {
    const eventRole = getEventRole(event);
    const roleText = eventRole === EVENT_ROLES.HOST ? '주최자' : '참여자';
    
    // 캘린더에서 클릭: 단순 로그만 출력 (모달 제거)
    if (source === 'calendar') {
      return;
    }
    
    // 나의 경조사 관리에서 클릭: 디스플레이 모드로 이동 (기존 로직)
    if (source === 'management') {
      // DB에서 저장된 이미지와 템플릿 정보 파싱
      const templateStyle = event.template_style || (event.event_type === 'funeral' ? 'traditional-dark' : 'modern-dark');
      
      // additional_info에서 카테고리별 이미지 정보 추출
      const additionalInfo = event.additional_info || {};
      const categorizedImages = additionalInfo.categorized_images || {};
      
      // image_urls에서 카테고리별로 이미지 분류 (백업 로직)
      const imageUrls = event.image_urls || [];
      const fallbackCategorizedImages = {
        main: imageUrls.filter(img => img.category === 'main'),
        gallery: imageUrls.filter(img => img.category === 'gallery'),
        groom: imageUrls.filter(img => img.category === 'groom'),
        bride: imageUrls.filter(img => img.category === 'bride'),
        all: imageUrls
      };
      
      // 카테고리별 이미지가 없으면 fallback 사용
      const finalCategorizedImages = Object.keys(categorizedImages).length > 0 
        ? categorizedImages 
        : fallbackCategorizedImages;
      
      // 🔥 이벤트 타입에 따른 데이터 준비
      let eventData = {
        type: event.event_type,
      };

      if (event.event_type === 'funeral') {
        // 🔥 부고 데이터 준비 - additional_info에서 상주 정보 추출
        const familyMembers = event.family_members || 
                             additionalInfo.family_members || 
                             [];
        
        eventData = {
          ...eventData,
          // 고인 정보
          deceasedName: event.deceased_name || event.main_person_name,
          deceasedAge: event.deceased_age,
          deathDate: event.death_date,
          deceasedGender: event.deceased_gender || '남',
          
          // 장례 일정
          casketDate: event.casket_date || event.funeral_start_date || additionalInfo.funeral_start_date,
          casketTime: event.casket_time,
          burialDate: event.burial_date || event.funeral_end_date || additionalInfo.funeral_end_date,
          burialTime: event.burial_time,
          burialLocation: event.burial_location,
          secondaryBurialLocation: event.secondary_burial_location,
          
          // 장례식장 정보
          funeralHome: event.funeral_home,
          location: event.location, // 장례식장 주소
          detailedAddress: event.detailed_address, // 빈소 위치
          
          // 🔥 가족 정보 (상주) - 여러 소스에서 확인
          familyMembers: Array.isArray(familyMembers) ? familyMembers : [],
          
          // 연락처
          primaryContact: event.primary_contact,
          secondaryContact: event.secondary_contact,
          funeralDirector: event.funeral_director,
          
          // 메시지
          customMessage: event.custom_message,
          
          // additional_info에서 추가 정보 병합
          ...additionalInfo,
        };
        
        // 🔍 상주 정보 디버깅 로그
      } else {
        // 🔥 결혼식 데이터 준비 (기존 로직)
        eventData = {
          ...eventData,
          // 기본 정보
          groomName: event.groom_name,
          brideName: event.bride_name,
          date: event.event_date,
          ceremonyTime: event.ceremony_time,
          location: event.location,
          detailedAddress: event.detailed_address,
          customMessage: event.custom_message,
          parkingInfo: event.parking_info,
          
          // 부모님 정보
          groomFatherName: event.groom_father_name,
          groomMotherName: event.groom_mother_name,
          brideFatherName: event.bride_father_name,
          brideMotherName: event.bride_mother_name,
          groomContact: event.groom_contact,
          brideContact: event.bride_contact,
          
          // additional_info에서 추가 정보
          groomFatherContact: additionalInfo.groom_father_contact,
          groomMotherContact: additionalInfo.groom_mother_contact,
          brideFatherContact: additionalInfo.bride_father_contact,
          brideMotherContact: additionalInfo.bride_mother_contact,
          receptionTime: additionalInfo.reception_time,
          
          // 🔥 추가 정보 전체 포함 (계좌번호 등)
          additional_info: additionalInfo,
        };
      }
      
      
      // 🔍 이미지 URL 디버깅 정보 추가

      navigation.navigate('EventDisplay', { 
        eventId: event.id,
        templateStyle: templateStyle,
        categorizedImages: finalCategorizedImages,
        eventData: eventData
      });
    }
  };

  // 부조하기 버튼 클릭
  const handleContributePress = (event, e) => {
    e.stopPropagation(); // 부모 터치 이벤트 방지
    navigation.navigate('Contribution', { 
      eventId: event.id, 
      eventName: event.event_name 
    });
  };


  // 🔥 더보기 버튼 핸들러
  const handleViewMore = () => {
    navigation.navigate('MyEvents');
  };

  // 🔥 통계 상세보기 - MyEvents 탭으로 이동하면서 통계 탭 선택
  const handleStatisticsDetail = () => {
    // Statistics 스크린이 없으므로 MyEvents로 이동
    navigation.navigate('MyEvents', { initialTab: 'statistics' });
  };
  

  const currentSlideData = slides[currentSlide];
  
  // 사용자 이름 결정 로직 개선
  const getUserName = () => {
    if (userInfo?.userName) return userInfo.userName;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.phone) return user.phone.replace('+82', '0');
    if (user?.email) return user.email.split('@')[0];
    return '사용자';
  };

  const userName = getUserName();

  // 🔥 나의 경조사 관리는 주최한 경조사만 사용 (개인 일정 완전 제외)
  const hostedEvents = events.filter((event, index, self) => {
    // 중복 제거
    const isUnique = index === self.findIndex(e => e.id === event.id);
    // 개인 일정 제외 (source가 'personal'이거나 is_personal_schedule이 true인 항목 제외)
    const isNotPersonalSchedule = !(event.source === 'personal' || event.is_personal_schedule);
    // 실제 경조사 이벤트만 포함 (created_by나 user_id가 있는 주최한 경조사)
    const isHostedEvent = event.created_by || (event.user_id && !event.is_personal_schedule);
    
    return isUnique && isNotPersonalSchedule && isHostedEvent;
  });
  
  // 🔥 서울 시간 기준으로 진행중/완료 분류 - 주최한 경조사만
  const activeEventsFiltered = hostedEvents.filter(event => {
    const isCompleted = isEventCompleted(event.event_date);
    return !isCompleted;
  });

  const completedEventsFiltered = hostedEvents.filter(event => {
    const isCompleted = isEventCompleted(event.event_date);
    return isCompleted;
  });

  // 🔥 최대 3개까지만 표시
  const currentEvents = selectedTab === 'active' 
    ? activeEventsFiltered.slice(0, 3) 
    : completedEventsFiltered.slice(0, 3);
  
  const totalCount = selectedTab === 'active' 
    ? activeEventsFiltered.length 
    : completedEventsFiltered.length;
  
  const hasMore = totalCount > 3;

  // 🔥 금액 포맷팅 함수
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0원';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>정담</Text>
            {userSubscription && (
              <View style={[
                styles.headerBadge,
                { backgroundColor: userSubscription.subscription_type === 'premium' ? '#FF6B6B' : '#95A5A6' }
              ]}>
                <Text style={styles.headerBadgeText}>
                  {userSubscription.subscription_type === 'premium' ? 'PREMIUM' : 'FREE'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {userSubscription?.subscription_type === 'premium' 
              ? `${userName}님, 프리미엄을 이용중입니다! 🎉`
              : `${userName}님 안녕하세요!`
            }
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 웰컴 섹션 */}
        <View style={styles.welcomeSection}>
          <Animated.View style={[
            styles.welcomeCard,
            { backgroundColor: currentSlideData.backgroundColor, opacity: fadeAnim }
          ]}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>{currentSlideData.title}</Text>
              <Text style={styles.welcomeSubtitle}>{currentSlideData.subtitle}</Text>
            </View>
            <View style={styles.welcomeIcon}>
              <Ionicons name={currentSlideData.icon} size={32} color={Colors.white} />
            </View>
          </Animated.View>
          
          {/* 슬라이드 인디케이터 */}
          <View style={styles.slideIndicator}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, currentSlide === index && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        {/* 빠른 시작 - 청첩장과 부고장만 */}
        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>빠른 시작</Text>
          <Text style={styles.sectionSubtitle}>
            새로운 경조사를 만들어보세요
          </Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity 
              style={styles.quickItem}
              onPress={() => handleQuickStart('wedding')}
              disabled={
                userSubscription?.subscription_type === 'free' && 
                userSubscription?.current_wedding_events >= userSubscription?.max_wedding_events
              }
            >
              <Image
                source={require('../../../assets/wedding-Photoroom.png')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
              />
              <Text style={styles.quickTitle}>청첩장</Text>
              <Text style={styles.quickSubtitle}>행복한 결혼 소식을 전해보세요</Text>
              <TouchableOpacity 
                style={[
                  styles.quickButton, 
                  { 
                    backgroundColor: userSubscription?.subscription_type === 'free' && 
                    userSubscription?.current_wedding_events >= userSubscription?.max_wedding_events 
                    ? '#BDC3C7' : Colors.wedding 
                  }
                ]}
                onPress={() => handleQuickStart('wedding')}
                disabled={
                  userSubscription?.subscription_type === 'free' && 
                  userSubscription?.current_wedding_events >= userSubscription?.max_wedding_events
                }
              >
                <Text style={styles.quickButtonText}>
                  {userSubscription?.subscription_type === 'free' && 
                   userSubscription?.current_wedding_events >= userSubscription?.max_wedding_events 
                   ? '제한됨' : '만들기'}
                </Text>
              </TouchableOpacity>
              <View style={styles.quickTypeIndicator}>
                <Text style={styles.quickTypeText}>경사</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickItem}
              onPress={() => handleQuickStart('funeral')}
              disabled={
                userSubscription?.subscription_type === 'free' && 
                userSubscription?.current_funeral_events >= userSubscription?.max_funeral_events
              }
            >
              <Image
                source={require('../../../assets/funeral-Photoroom.png')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
              />
              <Text style={styles.quickTitle}>부고장</Text>
              <Text style={styles.quickSubtitle}>슬픈 소식을 정중하게 전달하세요</Text>
              <TouchableOpacity 
                style={[
                  styles.quickButton, 
                  { 
                    backgroundColor: userSubscription?.subscription_type === 'free' && 
                    userSubscription?.current_funeral_events >= userSubscription?.max_funeral_events 
                    ? '#BDC3C7' : Colors.funeral 
                  }
                ]}
                onPress={() => handleQuickStart('funeral')}
                disabled={
                  userSubscription?.subscription_type === 'free' && 
                  userSubscription?.current_funeral_events >= userSubscription?.max_funeral_events
                }
              >
                <Text style={styles.quickButtonText}>
                  {userSubscription?.subscription_type === 'free' && 
                   userSubscription?.current_funeral_events >= userSubscription?.max_funeral_events 
                   ? '제한됨' : '만들기'}
                </Text>
              </TouchableOpacity>
              <View style={[styles.quickTypeIndicator, { backgroundColor: Colors.funeral }]}>
                <Text style={[styles.quickTypeText, { color: Colors.white }]}>조사</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔥 내가 주최한 경조사 - 호스트 역할 */}
        <View style={styles.eventsManagementSection}>
          <Text style={styles.sectionTitle}>내가 주최한 경조사</Text>
          
          
          {/* 탭 버튼 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'active' && styles.activeTabButton]}
              onPress={() => setSelectedTab('active')}
            >
              <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
                진행중 ({activeEventsFiltered.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'completed' && styles.activeTabButton]}
              onPress={() => setSelectedTab('completed')}
            >
              <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
                최근 완료 ({completedEventsFiltered.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* 이벤트 리스트 */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
              <Text style={styles.loadingText}>불러오는 중...</Text>
            </View>
          ) : currentEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {currentEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCardNew}
                  onPress={() => handleActiveEventPress(event)}
                  activeOpacity={0.8}
                >
                  {/* 상단: 배지 + 날짜 */}
                  <View style={styles.eventCardHeader}>
                    <View style={[
                      styles.eventTypeBadgeNew,
                      { backgroundColor: event.event_type === 'funeral' ? '#F1F5F9' : '#FFF1F2' }
                    ]}>
                      <Text style={[
                        styles.eventTypeBadgeTextNew,
                        { color: getEventStatusColor(event.event_type) }
                      ]}>
                        {getEventTypeText(event.event_type)}
                      </Text>
                    </View>
                    <View style={styles.eventDateBadge}>
                      <Text style={styles.eventDateBadgeText}>
                        {formatDateWithTime(event.event_date, event.event_time)}
                      </Text>
                    </View>
                  </View>

                  {/* 중간: 이벤트명 + 장소 */}
                  <Text style={styles.eventCardTitle} numberOfLines={1}>
                    {event.event_name || event.title}
                  </Text>
                  <View style={styles.eventCardLocationRow}>
                    <Ionicons name="location-outline" size={15} color={Colors.gray400} />
                    <Text style={styles.eventCardLocation} numberOfLines={1}>
                      {event.location || '장소 미정'}
                    </Text>
                  </View>

                  {/* 하단: 참여 통계 */}
                  <View style={styles.eventCardStatsBar}>
                    <View style={styles.eventCardStatItem}>
                      <Ionicons name="people-outline" size={16} color={Colors.gray500} />
                      <Text style={styles.eventCardStatText}>
                        {event.total_contributions || 0}명 참여
                      </Text>
                    </View>
                    <Text style={styles.eventCardStatAmount}>
                      {event.total_amount
                        ? (event.total_amount >= 10000
                            ? `${Math.floor(event.total_amount / 10000).toLocaleString()}만원`
                            : `${event.total_amount.toLocaleString()}원`)
                        : '0원'
                      }
                    </Text>
                  </View>

                </TouchableOpacity>
              ))}
              
              {/* 🔥 더보기 버튼 */}
              {hasMore && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={handleViewMore}
                >
                  <Text style={styles.viewMoreText}>
                    더보기 ({totalCount - 3}개 더)
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>
                {selectedTab === 'active' ? '진행중인 경조사가 없어요' : '완료된 경조사가 없어요'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === 'active' ? '첫 번째 경조사를 만들어보세요' : '첫 번째 경조사를 완료해보세요'}
              </Text>
              {selectedTab === 'active' && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setShowCreateEventModal(true)}
                >
                  <Text style={styles.createButtonText}>경조사 만들기</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 🔥 참여할 경조사 일정 관리 - 참여자 역할 */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarSectionHeader}>
            <Text style={styles.sectionTitle}>참여할 경조사 일정</Text>
            <TouchableOpacity 
              onPress={() => handleCalendarDatePress(new Date())}
              style={styles.addEventButton}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.addEventButtonText}>일정 추가</Text>
            </TouchableOpacity>
          </View>

          {/* 🔥 월별 캘린더 */}
          <View style={styles.calendarContainer}>
            <CalendarComponent 
              events={(() => {
                // console.log('🔥 캘린더에 전달되는 activeEvents:', activeEvents.length, 'items');
                activeEvents.forEach((event, i) => {
                  // console.log(`🔥 Event ${i}:`, {
                  //   id: event.id,
                  //   title: event.event_name || event.title,
                  //   date: event.event_date,
                  //   source: event.source,
                  //   is_personal_schedule: event.is_personal_schedule
                  // });
                });
                return activeEvents;
              })()}
              onDatePress={handleCalendarDatePress}
              onEventPress={handleActiveEventPress}
              currentCalendarDate={calendarDate}
              onMonthChange={handleCalendarMonthChange}
            />
          </View>

          {/* 🔥 이번 달 경조사 티켓 - 주최자/참여자 분리 */}
          <View style={styles.monthlyTicketsContainer}>
            <Text style={styles.monthlyTicketsTitle}>
              {calendarDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })} 참여 예정 일정
            </Text>
            
            {(() => {
              const { participantEvents } = getGroupedMonthlyEvents();
              // 🔥 참여자 일정만 표시
              const hasEvents = participantEvents.length > 0;
              
              if (!hasEvents) {
                return (
                  <View style={styles.noEventsContainer}>
                    <Ionicons name="calendar-outline" size={48} color={Colors.gray200} />
                    <Text style={styles.noEventsText}>등록된 일정이 없습니다</Text>
                    <Text style={styles.noEventsSubText}>새로운 경조사 일정을 추가해보세요</Text>
                  </View>
                );
              }
              
              // 페이지네이션 계산
              const totalPages = Math.ceil(participantEvents.length / eventsPerPage);
              const startIndex = currentEventPage * eventsPerPage;
              const endIndex = Math.min(startIndex + eventsPerPage, participantEvents.length);
              const currentPageEvents = participantEvents.slice(startIndex, endIndex);
              
              return (
                <View style={styles.ticketsList}>
                  {/* 🔥 현재 페이지의 이벤트만 표시 */}
                  {currentPageEvents.map((event, index) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.eventTicket,
                            { borderLeftColor: event.event_type === 'wedding' ? Colors.wedding : Colors.funeral }
                          ]}
                          onPress={() => handleActiveEventPress(event, 'calendar')}
                          activeOpacity={0.8}
                        >
                          <View style={styles.ticketDateSection}>
                            <Text style={styles.ticketDay}>
                              {event.event_date ? new Date(event.event_date).getDate() : '?'}
                            </Text>
                            <Text style={styles.ticketWeekday}>
                              {event.event_date ? 
                                new Date(event.event_date).toLocaleDateString('ko-KR', { weekday: 'short' }) : 
                                '미정'
                              }
                            </Text>
                          </View>
                          
                          <View style={styles.ticketContent}>
                            <View style={styles.ticketHeader}>
                              <Text style={styles.ticketTitle} numberOfLines={1}>
                                {event.event_name || event.title}
                              </Text>
                              <View style={[
                                styles.ticketTypeBadge,
                                { backgroundColor: event.event_type === 'wedding' ? Colors.wedding : Colors.funeral }
                              ]}>
                                <Text style={styles.ticketTypeText}>
                                  {event.event_type === 'wedding' ? '경사' : '조사'}
                                </Text>
                              </View>
                            </View>
                            
                            <Text style={styles.ticketLocation} numberOfLines={1}>
                              {event.location || '장소 미정'}
                            </Text>
                            
                            {event.event_date && (
                              <Text style={styles.ticketTime}>
                                {new Date(event.event_date).toLocaleDateString('ko-KR', { 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </Text>
                            )}
                          </View>
                          
                          <View style={styles.ticketAction}>
                            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                          </View>
                        </TouchableOpacity>
                      ))}
                  
                  {/* 페이지네이션 컨트롤 */}
                  {totalPages > 1 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity 
                        style={[styles.paginationButton, currentEventPage === 0 && styles.paginationButtonDisabled]}
                        onPress={() => {
                          if (currentEventPage > 0) {
                            setCurrentEventPage(currentEventPage - 1);
                          }
                        }}
                        disabled={currentEventPage === 0}
                      >
                        <Ionicons 
                          name="chevron-back" 
                          size={20} 
                          color={currentEventPage === 0 ? Colors.gray300 : Colors.primary} 
                        />
                      </TouchableOpacity>
                      
                      <View style={styles.paginationDots}>
                        {[...Array(totalPages)].map((_, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.paginationDot,
                              index === currentEventPage && styles.paginationDotActive
                            ]}
                            onPress={() => setCurrentEventPage(index)}
                          />
                        ))}
                      </View>
                      
                      <TouchableOpacity 
                        style={[styles.paginationButton, currentEventPage === totalPages - 1 && styles.paginationButtonDisabled]}
                        onPress={() => {
                          if (currentEventPage < totalPages - 1) {
                            setCurrentEventPage(currentEventPage + 1);
                          }
                        }}
                        disabled={currentEventPage === totalPages - 1}
                      >
                        <Ionicons 
                          name="chevron-forward" 
                          size={20} 
                          color={currentEventPage === totalPages - 1 ? Colors.gray300 : Colors.primary} 
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>

        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* 🔥 일정 추가 모달 */}
      <EventAddModal 
        visible={showEventModal}
        onClose={() => setShowEventModal(false)}
        selectedDate={selectedDate}
        onAddEvent={async (eventTitle, eventType, eventLocation) => {
          try {
            // 개인 일정 생성
            const scheduleData = {
              title: eventTitle.trim(),
              event_type: eventType,
              event_date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
              location: eventLocation.trim() || null
            };
            
            // 현재 사용자 정보 준비 (loadEvents와 동일한 로직)
            let currentUserInfo = null;
            if (userInfo?.userId) {
              currentUserInfo = {
                id: userInfo.userId,
                name: userInfo.userName,
                phone: userInfo.phone,
                auth_method: 'phone'
              };
            } else if (session?.user) {
              currentUserInfo = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                email: session.user.email,
                auth_method: 'supabase'
              };
            }
            
            const result = await createPersonalSchedule(scheduleData, currentUserInfo);
            
            if (result.success) {
              // 🔥 디버깅: 새로 생성된 일정 데이터 확인
              
              // UI에 즉시 반영 - 개인 일정은 activeEvents에 추가
              setActiveEvents(prev => {
                const updated = [...prev, result.data];
                return updated;
              });
              // 🔥 토스 스타일 성공 모달 표시
              setShowEventModal(false);
              setTimeout(() => {
                showSuccessModal();
                // 3초 후 자동으로 닫기
                setTimeout(() => {
                  hideSuccessModal();
                }, 3000);
              }, 200);
            } else {
              Alert.alert('오류', result.error || '일정 추가에 실패했습니다.');
              setShowEventModal(false);
            }
          } catch (error) {
            Alert.alert('오류', '일정 추가 중 오류가 발생했습니다.');
          }
        }}
      />

      {/* 🔥 일정 목록 모달 */}
      <Modal
        visible={showEventListModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventListModal(false)}
      >
        <SafeAreaView style={styles.eventListModal}>
          <View style={styles.eventListHeader}>
            <View>
              <Text style={styles.eventModalTitle}>일정 목록</Text>
              <Text style={styles.eventModalDate}>
                {selectedDate.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowEventListModal(false)} 
              style={styles.eventListCloseButton}
            >
              <Ionicons name="close" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.eventListContent} showsVerticalScrollIndicator={false}>
            {selectedDateEvents.map((event, index) => (
              <TouchableOpacity
                key={event.id || index}
                style={styles.eventListItem}
                onPress={() => {
                  // 일정 편집 기능은 나중에 구현
                }}
                activeOpacity={0.7}
              >
                <View style={styles.eventListItemContent}>
                  <View style={styles.eventListItemHeader}>
                    <Text style={styles.eventListItemTitle}>
                      {event.event_name || event.title}
                    </Text>
                    <View style={styles.eventListItemBadge}>
                      <Ionicons 
                        name={event.event_type === 'wedding' ? 'heart' : 'flower'} 
                        size={12} 
                        color={Colors.primary} 
                      />
                      <Text style={styles.eventListItemBadgeText}>
                        {event.event_type === 'wedding' ? '결혼' : '조문'}
                      </Text>
                    </View>
                  </View>
                  
                  {event.location && (
                    <View style={styles.eventListItemLocation}>
                      <Ionicons name="location-outline" size={14} color={Colors.gray500} />
                      <Text style={styles.eventListItemLocationText}>
                        {event.location}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.eventListFooter}>
            <TouchableOpacity 
              style={styles.addEventFromListButton}
              onPress={() => {
                setShowEventListModal(false);
                setShowEventModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.addEventFromListButtonText}>일정 추가</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 🔥 토스 스타일 확인 모달 */}
      <Modal
        visible={showTossConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTossConfirmModal(false)}
      >
        <TouchableWithoutFeedback onPress={hideConfirmModal}>
          <Animated.View 
            style={[
              styles.tossModalOverlay,
              {
                opacity: confirmModalOpacity
              }
            ]}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.tossModalContainer,
                  {
                    transform: [{
                      translateY: confirmModalSlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0], // 300px 아래에서 슬라이드업
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.tossModalHeader}>
                  <Text style={styles.tossModalTitle}>
                    {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </Text>
                  <Text style={styles.tossModalSubtitle}>
                    {selectedDateEvents.length}개의 일정이 있어요
                  </Text>
                </View>

                <ScrollView style={styles.tossEventList} showsVerticalScrollIndicator={false}>
                  {selectedDateEvents.map((event, index) => (
                    <TouchableOpacity
                      key={event.id || index}
                      style={styles.tossEventItem}
                      onPress={() => {
                        // 일정 편집 기능은 나중에 구현
                      }}
                      activeOpacity={0.7}
                    >
                      {/* 🔥 이벤트 타입 표시 (왼쪽) */}
                      <View style={styles.tossEventTypeColumn}>
                        <View style={[
                          styles.tossEventTypeBadge, 
                          { backgroundColor: getEventStatusColor(event.event_type) }
                        ]}>
                          <Text style={styles.tossEventTypeBadgeText}>
                            {getEventTypeText(event.event_type)}
                          </Text>
                        </View>
                      </View>

                      {/* 이벤트 정보 */}
                      <View style={styles.tossEventInfo}>
                        <View style={styles.tossEventTitleRow}>
                          <Text style={styles.tossEventTitle} numberOfLines={1}>
                            {event.event_name || event.title}
                          </Text>
                          <Text style={styles.tossEventTime}>
                            {new Date(event.event_date).toLocaleDateString('ko-KR', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                        </View>
                        
                        {event.location && (
                          <View style={styles.tossEventLocationRow}>
                            <Ionicons name="location-outline" size={14} color={Colors.gray400} />
                            <Text style={styles.tossEventLocation} numberOfLines={1}>
                              {event.location}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 🔥 화살표 */}
                      <View style={styles.tossEventArrow}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.tossModalActions}>
                  <TouchableOpacity 
                    style={styles.tossModalButton}
                    onPress={() => {
                      hideConfirmModal();
                      setTimeout(() => setShowEventModal(true), 100);
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color={Colors.white} />
                    <Text style={styles.tossModalButtonText}>일정 추가하기</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.tossModalButton, styles.tossModalCancelButton]}
                    onPress={hideConfirmModal}
                  >
                    <Text style={[styles.tossModalButtonText, styles.tossModalCancelText]}>
                      닫기
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 🔥 토스 스타일 성공 모달 */}
      <Modal
        visible={showTossSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTossSuccessModal(false)}
      >
        <Animated.View 
          style={[
            styles.tossModalOverlay,
            {
              opacity: successModalOpacity
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.tossSuccessContainer,
              {
                transform: [{
                  scale: successModalScale
                }],
                opacity: successModalOpacity
              }
            ]}
          >
            <View style={styles.tossSuccessIcon}>
              <Ionicons name="checkmark" size={30} color={Colors.white} />
            </View>
            <Text style={styles.tossSuccessTitle}>일정이 추가되었어요</Text>
            <Text style={styles.tossSuccessSubtitle}>
              {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </Text>
            <TouchableOpacity 
              style={styles.tossSuccessButton}
              onPress={hideSuccessModal}
            >
              <Text style={styles.tossSuccessButtonText}>확인</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* 경조사 만들기 바텀시트 모달 */}
      <Modal
        visible={showCreateEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateEventModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCreateEventModal(false)}>
          <View style={styles.createEventModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.createEventModalContainer}>
                <View style={styles.createEventModalHandle} />
                <Text style={styles.createEventModalTitle}>경조사 만들기</Text>
                <Text style={styles.createEventModalSubtitle}>어떤 경조사를 준비하시나요?</Text>

                <View style={styles.createEventModalOptions}>
                  <TouchableOpacity
                    style={styles.createEventModalOption}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowCreateEventModal(false);
                      handleQuickStart('wedding');
                    }}
                  >
                    <View style={[styles.createEventModalIconWrap, { backgroundColor: '#FFF0F5' }]}>
                      <Image
                        source={require('../../../assets/wedding-Photoroom.png')}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.createEventModalOptionInfo}>
                      <Text style={styles.createEventModalOptionTitle}>청첩장 만들기</Text>
                      <Text style={styles.createEventModalOptionDesc}>결혼식 초대장과 부조금 관리</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                  </TouchableOpacity>

                  <View style={styles.createEventModalDivider} />

                  <TouchableOpacity
                    style={styles.createEventModalOption}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowCreateEventModal(false);
                      handleQuickStart('funeral');
                    }}
                  >
                    <View style={[styles.createEventModalIconWrap, { backgroundColor: '#F0F0F5' }]}>
                      <Image
                        source={require('../../../assets/funeral-Photoroom.png')}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.createEventModalOptionInfo}>
                      <Text style={styles.createEventModalOptionTitle}>부고장 만들기</Text>
                      <Text style={styles.createEventModalOptionDesc}>장례 안내와 조의금 관리</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.createEventModalCancelBtn}
                  onPress={() => setShowCreateEventModal(false)}
                >
                  <Text style={styles.createEventModalCancelText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 🔥 프리미엄 업그레이드 모달 */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.premiumModalOverlay}>
          <View style={styles.premiumModalContainer}>
            {/* 헤더 */}
            <View style={styles.premiumModalHeader}>
              <View style={styles.premiumBadge}>
                <Ionicons name="crown" size={20} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
              <TouchableOpacity 
                style={styles.premiumCloseButton}
                onPress={() => setShowPremiumModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* 메인 콘텐츠 */}
            <View style={styles.premiumModalContent}>
              <Text style={styles.premiumModalTitle}>
                {premiumModalType === 'wedding' ? '청첩장' : '부고장'} 무제한 생성
              </Text>
              <Text style={styles.premiumModalSubtitle}>
                프리미엄 플랜으로 업그레이드하고 제한 없이 이용하세요
              </Text>

              {/* 기능 리스트 */}
              <View style={styles.premiumFeatureList}>
                <View style={styles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.premiumFeatureText}>무제한 경조사 생성</Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.premiumFeatureText}>프리미엄 템플릿 이용</Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.premiumFeatureText}>고급 통계 및 분석</Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.premiumFeatureText}>우선 고객 지원</Text>
                </View>
              </View>

              {/* 현재 제한 표시 */}
              <View style={styles.premiumCurrentLimit}>
                <Ionicons name="information-circle-outline" size={16} color="#FF9800" />
                <Text style={styles.premiumLimitText}>
                  무료 플랜: {premiumModalType === 'wedding' ? '결혼식' : '장례식'} 1개 제한
                </Text>
              </View>
            </View>

            {/* 버튼 영역 */}
            <View style={styles.premiumModalButtons}>
              <TouchableOpacity
                style={styles.premiumCancelButton}
                onPress={() => setShowPremiumModal(false)}
              >
                <Text style={styles.premiumCancelText}>나중에</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.premiumUpgradeButton}
                onPress={() => {
                  setShowPremiumModal(false);
                  // TODO: 프리미엄 업그레이드 페이지로 이동 또는 웹뷰 열기
                  Alert.alert('준비 중', '프리미엄 업그레이드 기능을 준비 중입니다.\n곧 더 나은 서비스로 찾아뵙겠습니다!');
                }}
              >
                <View style={styles.premiumUpgradeContent}>
                  <Ionicons name="crown" size={16} color="#FFFFFF" />
                  <Text style={styles.premiumUpgradeText}>프리미엄 시작하기</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📱 알림 권한 모달 */}
      <NotificationPermissionModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        userInfo={userInfo}
      />
    </SafeAreaView>
  );
}

// 헬퍼 함수들
const getEventIcon = (eventType) => {
  switch (eventType) {
    case 'wedding': return 'heart';
    case 'funeral': return 'flower';
    case 'birthday': return 'gift';
    default: return 'calendar';
  }
};

const getEventColor = (eventType) => {
  switch (eventType) {
    case 'wedding': return Colors.wedding;
    case 'funeral': return Colors.funeral;
    case 'birthday': return Colors.celebration;
    default: return Colors.other;
  }
};

const getEventStatusColor = (eventType) => {
  switch (eventType) {
    case 'wedding': return Colors.wedding;
    case 'funeral': return Colors.funeral;
    default: return Colors.success;
  }
};

const getEventTypeText = (eventType) => {
  switch (eventType) {
    case 'wedding': return '경사';
    case 'funeral': return '조사';
    default: return '행사';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '날짜 미정';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateWithTime = (dateString, timeString) => {
  if (!dateString) return '날짜 미정';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = dayNames[date.getDay()];
  let result = `${year}.${month}.${day}(${dayOfWeek})`;
  if (timeString) {
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      result += ` ${timeParts[0]}:${timeParts[1]}`;
    }
  }
  return result;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  headerLeft: {},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // 콘텐츠
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 웰컴 섹션
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
    lineHeight: 28,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray300,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  
  // 퀵 액션 - 수정됨
  quickSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickItem: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    minHeight: 180,
  },
  quickIcon: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  quickSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    flex: 1,
  },
  quickButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  quickTypeIndicator: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  quickTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },

  // 🔥 새로운 경조사 관리 섹션
  eventsManagementSection: {
    marginBottom: 40,
  },
  
  // 탭 컨테이너
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // 이벤트 리스트
  eventsList: {
    gap: 16,
  },

  // 새 이벤트 카드 (세로형)
  eventCardNew: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // 카드 상단: 배지 + 날짜
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  eventTypeBadgeNew: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  eventTypeBadgeTextNew: {
    fontSize: 13,
    fontWeight: '600',
  },
  eventDateBadge: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  eventDateBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray600 || '#475569',
  },

  // 카드 중간: 이벤트명 + 장소
  eventCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 6,
  },
  eventCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  eventCardLocation: {
    fontSize: 14,
    color: Colors.gray500,
    lineHeight: 18,
  },

  // 카드 하단: 통계 바
  eventCardStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eventCardStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventCardStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray600 || '#475569',
  },
  eventCardStatAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },

  // 🔥 더보기 버튼
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 6,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  
  // 빈 상태
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 로딩
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // 🔥 캘린더 섹션 스타일
  calendarSection: {
    marginBottom: 40,
  },
  
  calendarSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  
  addEventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 캘린더 컨테이너
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // 캘린더 스타일
  calendar: {
    width: '100%',
  },
  
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  calendarHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  
  calendarWeekDay: {
    width: '14.28%', // 7분의 1로 통일
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  
  calendarSundayText: {
    color: Colors.error,
  },
  
  calendarSaturdayText: {
    color: Colors.primary,
  },
  
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  calendarDay: {
    width: '14.28%', // 7분의 1
    aspectRatio: 1, // 정사각형 유지
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 48, // 최소 높이 보장
  },
  
  calendarDayOther: {
    opacity: 0.3,
  },
  
  calendarDayToday: {
    backgroundColor: Colors.primary, // 선명한 파란색 배경
    borderRadius: 8,
  },
  
  // 일정 표시 점들 스타일
  eventIndicatorContainer: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },

  personalEventDot: {
    backgroundColor: Colors.primary, // 파란색 점
  },

  multipleEventIndicator: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  multipleEventText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  
  calendarDayTextOther: {
    color: Colors.gray400,
  },
  
  calendarDayTextToday: {
    color: Colors.white, // 흰색 텍스트로 선명한 대비
    fontWeight: '700',
  },
  
  calendarDayTextWithEvents: {
    fontWeight: '600',
    color: 'rgba(0, 122, 255, 0.9)', // iOS 블루 진한 색상
  },
  
  // 🔥 월별 티켓 스타일
  monthlyTicketsContainer: {
    marginBottom: 24,
  },
  
  // 🔥 이벤트 섹션 분리 스타일
  eventSection: {
    marginBottom: 16,
  },
  
  eventSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  
  monthlyTicketsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  
  ticketsList: {
    gap: 12,
  },
  
  eventTicket: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12, // 티켓 간격 추가
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  ticketDateSection: {
    width: 50,
    alignItems: 'center',
    marginRight: 16,
  },
  
  ticketDay: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  
  ticketWeekday: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  ticketContent: {
    flex: 1,
  },
  
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  
  ticketTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  ticketTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  
  ticketLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  
  ticketTime: {
    fontSize: 12,
    color: Colors.gray500,
  },
  
  ticketAction: {
    marginLeft: 12,
  },
  
  // 티켓 없음 상태
  noTicketsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
  },
  
  noTicketsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  
  createEventFromCalendarButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  
  createEventFromCalendarText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  
  
  // 페이지네이션 스타일
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray300,
  },
  
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  
  // 🔥 모달 스타일
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    zIndex: 1,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    marginBottom: 20,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  
  eventTypeContainer: {
    marginBottom: 24,
  },
  
  // 🔥 일정 모드 선택 스타일
  eventModeContainer: {
    marginBottom: 24,
  },
  
  eventModeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  eventModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    gap: 6,
  },
  
  eventModeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  
  eventModeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  
  eventModeButtonTextActive: {
    color: Colors.white,
  },
  
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  
  eventTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  eventTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    gap: 8,
  },
  
  eventTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  
  eventTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  
  eventTypeButtonTextActive: {
    color: Colors.white,
  },
  
  inputContainer: {
    marginBottom: 24,
  },
  
  textInput: {
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    minHeight: 56,
  },
  
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 8,
  },
  
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  
  modalAddButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalAddButtonDisabled: {
    backgroundColor: Colors.gray200,
  },
  
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  
  modalAddButtonTextDisabled: {
    color: Colors.gray400,
  },

  // 🔥 일정 목록 모달 스타일
  eventListModal: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  eventListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  eventModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray900,
  },

  eventModalDate: {
    fontSize: 16,
    color: Colors.gray600,
    marginTop: 4,
  },

  eventListCloseButton: {
    padding: 8,
  },

  eventListContent: {
    flex: 1,
    padding: 20,
  },

  eventListItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  eventListItemContent: {
    flex: 1,
  },

  eventListItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  eventListItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
  },

  eventListItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  eventListItemBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 4,
  },

  eventListItemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  eventListItemLocationText: {
    fontSize: 14,
    color: Colors.gray500,
    marginLeft: 4,
  },

  eventListFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },

  addEventFromListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },

  addEventFromListButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },

  // Toss 스타일 모달 스타일
  tossModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  tossModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 300,
  },

  tossModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  tossModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray900,
  },

  tossModalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },

  tossModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  tossEventList: {
    marginVertical: 10,
  },

  tossEventItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  tossEventTypeColumn: {
    marginRight: 12,
  },

  tossEventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },

  tossEventTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },

  tossEventInfo: {
    flex: 1,
  },

  tossEventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  tossEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
    marginRight: 8,
  },

  tossEventTime: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.gray500,
  },

  tossEventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  tossEventLocation: {
    fontSize: 14,
    color: Colors.gray500,
    marginLeft: 4,
    flex: 1,
  },

  tossEventArrow: {
    marginLeft: 8,
  },


  // 🔥 각 행사별 통계 스타일
  eventStatsRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },

  eventStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },

  eventStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.gray500,
    marginLeft: 4,
  },

  tossModalActions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    flexDirection: 'row',
    gap: 12,
  },

  tossModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },

  tossModalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
  },

  tossModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  tossModalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray700,
  },

  // 성공 모달 스타일
  tossSuccessContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },

  tossSuccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  tossSuccessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: 8,
    textAlign: 'center',
  },

  tossSuccessMessage: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  tossSuccessButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },

  tossSuccessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // 추가 토스 모달 스타일
  tossModalSubtitle: {
    fontSize: 16,
    color: Colors.gray600,
    marginTop: 8,
    textAlign: 'left',
  },

  tossEventContent: {
    flex: 1,
  },

  tossEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
  },

  tossModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray700,
  },

  tossSuccessSubtitle: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: 20,
  },

  // 🔥 프리미엄 모달 스타일
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  premiumModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },

  premiumModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },

  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },

  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F57C00',
    letterSpacing: 0.5,
  },

  premiumCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  premiumModalContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  premiumModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },

  premiumModalSubtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  premiumFeatureList: {
    gap: 16,
    marginBottom: 24,
  },

  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  premiumFeatureText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },

  premiumCurrentLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },

  premiumLimitText: {
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '500',
  },

  premiumModalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },

  premiumCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  premiumCancelText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '600',
  },

  premiumUpgradeButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  premiumUpgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  premiumUpgradeText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 일정 없음 컨테이너 스타일
  noEventsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  noEventsText: {
    fontSize: 16,
    color: Colors.gray400,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  
  noEventsSubText: {
    fontSize: 14,
    color: Colors.gray300,
    fontWeight: '400',
  },

  // 경조사 만들기 바텀시트 모달
  createEventModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  createEventModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  createEventModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  createEventModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  createEventModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  createEventModalOptions: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    overflow: 'hidden',
  },
  createEventModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  createEventModalIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  createEventModalOptionInfo: {
    flex: 1,
  },
  createEventModalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  createEventModalOptionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  createEventModalDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginHorizontal: 16,
  },
  createEventModalCancelBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
  },
  createEventModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

});