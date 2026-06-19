// src/screens/main/HomeScreen.js - 개선된 통계 UI 포함 전체 코드
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ImageBackground,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Linking,
  Share,
  DeviceEventEmitter,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../../styles/constants";
import { supabase } from "../../lib/supabase";
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
  deleteGuestBookEntry,
  getEventCreationCreditState,
  markEventCreationWelcomeSeen,
  EVENT_CREATION_CREDIT_COST,
  EVENT_CREATION_FREE_LIMIT,
  EVENT_EDIT_CREDIT_COST,
} from "../../lib/supabaseHelper";
import * as Notifications from "expo-notifications";
import NotificationPermissionModal from "../../components/NotificationPermissionModal";
import LottieLoading from "../../components/LottieLoading";
import { useTutorial } from "../../contexts/TutorialContext";
import TutorialPulseRing from "../../components/TutorialPulseRing";
import {
  getReciprocityNotifications,
  updateReciprocityNotificationStatus,
} from "../../lib/eventReciprocity";
import {
  getActivityNotifications,
  updateActivityNotificationStatus,
} from "../../lib/activityNotifications";
import { getInvitationUrl } from "../../lib/webLinks";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;
const HOSTED_PHOTO_WIDTH = isTablet ? 140 : 102;
const HOSTED_PHOTO_HEIGHT = isTablet ? 148 : 116;
const RECIPROCITY_EVENT_ICONS = {
  wedding: require("../../../assets/icons/reciprocity/wedding.png"),
  funeral: require("../../../assets/icons/reciprocity/funeral.png"),
};
const JEONGDAM_LOGO = require("../../../assets/images/jeongdamlogo.png");
const HOME_BANNERS = [
  {
    title: "스마트하게\n부조를 기록하세요",
    mobileImage: require("../../../assets/home-banners/generated/mobile/smart-ledger-bg.png"),
    tabletImage: require("../../../assets/home-banners/generated/tablet/smart-ledger-bg.png"),
  },
  {
    title: "마음을 나누는\n가장 쉬운 방법",
    mobileImage: require("../../../assets/home-banners/generated/mobile/easy-heart-bg.png"),
    tabletImage: require("../../../assets/home-banners/generated/tablet/easy-heart-bg.png"),
  },
  {
    title: "소중한 순간을\n함께 기록하세요",
    mobileImage: require("../../../assets/home-banners/generated/mobile/memory-bg.png"),
    tabletImage: require("../../../assets/home-banners/generated/tablet/memory-bg.png"),
  },
];
const SHOW_HOME_PUMASI_SECTION = false;
const FUNERAL_HOME_FRAME_SOURCES = {
  "funeral-template-modern-card": require("../../../assets/funeral/templates/funeral-template-modern-card.png"),
  "photo-frame-modern-card": require("../../../assets/funeral/templates/funeral-template-modern-card.png"),
  "funeral-template-editorial-timeline": require("../../../assets/funeral/templates/funeral-template-editorial-timeline.png"),
  "photo-frame-editorial-timeline": require("../../../assets/funeral/templates/funeral-template-editorial-timeline.png"),
  "funeral-template-paper-letter": require("../../../assets/funeral/templates/funeral-template-paper-letter.png"),
  "photo-frame-paper-letter": require("../../../assets/funeral/templates/funeral-template-paper-letter.png"),
  "funeral-template-certificate": require("../../../assets/funeral/templates/funeral-template-certificate.png"),
  "photo-frame-certificate": require("../../../assets/funeral/templates/funeral-template-certificate.png"),
  "funeral-template-classic-flower": require("../../../assets/funeral/templates/funeral-template-classic-flower.png"),
  "photo-frame-classic-flower": require("../../../assets/funeral/templates/funeral-template-classic-flower.png"),
};
const FUNERAL_HOME_FRAME_ASPECT_RATIOS = {
  "funeral-template-modern-card": 1024 / 1535,
  "photo-frame-modern-card": 1024 / 1535,
  "funeral-template-editorial-timeline": 941 / 1672,
  "photo-frame-editorial-timeline": 941 / 1672,
  "funeral-template-paper-letter": 941 / 1672,
  "photo-frame-paper-letter": 941 / 1672,
  "funeral-template-certificate": 941 / 1672,
  "photo-frame-certificate": 941 / 1672,
  "funeral-template-classic-flower": 1024 / 1535,
  "photo-frame-classic-flower": 1024 / 1535,
};

// 🔥 이벤트 역할 구분
const EVENT_ROLES = {
  HOST: "host", // 주최자 (내가 주최하는 경조사)
  PARTICIPANT: "participant", // 참여자 (참석할 다른 사람의 경조사)
};

// 🔥 캘린더 컴포넌트
const CalendarComponent = ({
  events,
  onDatePress,
  onEventPress,
  currentCalendarDate,
  onMonthChange,
}) => {
  const [currentDate, setCurrentDate] = useState(
    currentCalendarDate || new Date(),
  );

  // 현재 월의 첫 번째 날과 마지막 날
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const lastDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  );

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
    const filteredEvents = events.filter((event) => {
      if (!event.event_date) return false;
      const eventDate = new Date(event.event_date);
      const isPersonalSchedule =
        event.source === "personal" || event.is_personal_schedule;
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
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1,
    );
    setCurrentDate(newDate);
    onMonthChange && onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1,
    );
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
        <Text
          style={[
            styles.calendarDayText,
            !isCurrentMonth && styles.calendarDayTextOther,
            isToday && styles.calendarDayTextToday,
          ]}
        >
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
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={styles.calendarNavButton}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <Text style={styles.calendarHeaderTitle}>
          {currentDate.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
          })}
        </Text>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.calendarNavButton}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.calendarWeekHeader}>
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <View key={index} style={styles.calendarWeekDay}>
            <Text
              style={[
                styles.calendarWeekDayText,
                index === 0 && styles.calendarSundayText,
                index === 6 && styles.calendarSaturdayText,
              ]}
            >
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
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("wedding"); // 'wedding' 또는 'funeral'
  const [eventLocation, setEventLocation] = useState("");

  const handleAddEvent = () => {
    if (eventTitle.trim()) {
      onAddEvent(eventTitle, eventType, eventLocation);
      setEventTitle("");
      setEventLocation("");
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.modalContent}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>일정 추가</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.gray400} />
              </TouchableOpacity>
            </View>

            {/* 선택된 날짜 표시 */}
            <View style={styles.selectedDateContainer}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.selectedDateText}>
                {formatDate(selectedDate)}
              </Text>
            </View>

            {/* 경조사 종류 선택 */}
            <View style={styles.eventTypeContainer}>
              <Text style={styles.inputLabel}>경조사 종류</Text>
              <View style={styles.eventTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.eventTypeButton,
                    eventType === "wedding" && styles.eventTypeButtonActive,
                  ]}
                  onPress={() => setEventType("wedding")}
                >
                  <Ionicons
                    name="heart"
                    size={20}
                    color={
                      eventType === "wedding" ? Colors.white : Colors.wedding
                    }
                  />
                  <Text
                    style={[
                      styles.eventTypeButtonText,
                      eventType === "wedding" &&
                        styles.eventTypeButtonTextActive,
                    ]}
                  >
                    결혼식
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.eventTypeButton,
                    eventType === "funeral" && styles.eventTypeButtonActive,
                  ]}
                  onPress={() => setEventType("funeral")}
                >
                  <Ionicons
                    name="flower"
                    size={20}
                    color={
                      eventType === "funeral" ? Colors.white : Colors.funeral
                    }
                  />
                  <Text
                    style={[
                      styles.eventTypeButtonText,
                      eventType === "funeral" &&
                        styles.eventTypeButtonTextActive,
                    ]}
                  >
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
                placeholder={`예: ${eventType === "wedding" ? "김철수 결혼식" : "동료 부친상"}`}
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
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={onClose}
              >
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalAddButton,
                  !eventTitle.trim() && styles.modalAddButtonDisabled,
                ]}
                onPress={handleAddEvent}
                disabled={!eventTitle.trim()}
              >
                <Text
                  style={[
                    styles.modalAddButtonText,
                    !eventTitle.trim() && styles.modalAddButtonTextDisabled,
                  ]}
                >
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
  if (typeof Notifications.setNotificationHandler === "function") {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (error) {}

export default function HomeScreen({
  navigation,
  userInfo,
  session,
  isAuthenticated,
}) {
  const {
    startHomeTutorial,
    registerTarget,
    registerHandler,
    onTargetTap,
    activeTutorial,
    isActiveStep,
  } = useTutorial();
  const quickGridRef = useRef(null);
  const weddingMakeBtnRef = useRef(null);
  const funeralMakeBtnRef = useRef(null);
  const tutorialCheckedRef = useRef(false);
  const welcomeCreditCheckedRef = useRef(null);
  const wasHomeTutorialActiveRef = useRef(false);
  const eventCreationFlowLockedRef = useRef(false);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTab, setSelectedTab] = useState("active"); // 'active' or 'completed'
  const [hostedSortBy, setHostedSortBy] = useState("eventDate"); // 'eventDate' or 'createdAt'
  const [hostedSortOrder, setHostedSortOrder] = useState("desc"); // 'desc' or 'asc'
  const [hostedPhotoPageByEventIds, setHostedPhotoPageByEventIds] = useState(
    {},
  );

  // 🚀 캐싱을 위한 상태들 - 성능 최적화
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const CACHE_DURATION = 30000; // 30초 캐시
  const [calendarDate, setCalendarDate] = useState(new Date()); // 🔥 캘린더 현재 날짜 상태
  const [currentEventPage, setCurrentEventPage] = useState(0); // 🔥 현재 페이지 (참여할 경조사)
  const [hostedEventPage, setHostedEventPage] = useState(0); // 🔥 내가 주최한 경조사 페이지
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
  const [eventCreationFlowLocked, setEventCreationFlowLocked] =
    useState(false);
  const [showEventCreationWelcomeModal, setShowEventCreationWelcomeModal] =
    useState(false);
  const [eventCreationCreditState, setEventCreationCreditState] = useState({
    balance: 0,
    freeRemaining: EVENT_CREATION_FREE_LIMIT,
    priceCredits: EVENT_CREATION_CREDIT_COST,
    welcomeSeen: true,
  });
  const [creditShortageModal, setCreditShortageModal] = useState({
    visible: false,
    eventType: "wedding",
    balance: 0,
    priceCredits: EVENT_CREATION_CREDIT_COST,
  });
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
    period: null,
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bannerScrollRef = useRef(null);
  const bannerWidth = Dimensions.get("window").width - 40;
  const currentSlideRef = useRef(0);
  const isHomeScrollingRef = useRef(false);
  const scrollIdleTimerRef = useRef(null);
  const eventIdsRef = useRef([]);
  const hostedEventMetaRef = useRef(new Map());
  const reciprocityRealtimeSeenRef = useRef(new Set());
  const reciprocityKnownIdsRef = useRef(new Set());
  const reciprocityNotifyAfterRef = useRef(new Date().toISOString());
  const reciprocitySignatureRef = useRef("");

  // 토스 모달 애니메이션 값들
  const confirmModalSlideAnim = useRef(new Animated.Value(0)).current;
  const confirmModalOpacity = useRef(new Animated.Value(0)).current;
  const successModalScale = useRef(new Animated.Value(0)).current;
  const successModalOpacity = useRef(new Animated.Value(0)).current;

  // Props 확인 & 네트워크 테스트
  useEffect(() => {
    // 네트워크 연결 테스트
    fetch("https://ofshqvrldcesvjtredxo.supabase.co/rest/v1/", {
      method: "HEAD",
      headers: {
        apikey:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc2hxdnJsZGNlc3ZqdHJlZHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDI1MTQsImV4cCI6MjA2NDYxODUxNH0.uIfuqMP7SFvQfQXSESS9xKHWlBYeWmZwf1j_4eveZ6Q",
      },
    });
  }, [userInfo, session, isAuthenticated]);

  // 배너 데이터 - 이미지 카드 스타일
  const banners = HOME_BANNERS;

  // 화면 포커스 시 데이터 새로고침 - 캐싱과 병렬 로딩으로 성능 최적화
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const shouldRefresh = !dataLoaded || now - lastLoadTime > CACHE_DURATION;

      if (!shouldRefresh) {
        return;
      }

      setLoading(true);

      // 모든 데이터를 병렬로 로드하여 성능 개선
      Promise.all([
        loadUserData(),
        loadEvents(),
        loadActiveEvents(),
        loadMonthlyStatistics(),
        user?.id ? refreshEventCreationCreditState() : Promise.resolve(),
      ])
        .then(() => {
          setLastLoadTime(now);
          setDataLoaded(true);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
        });
    }, [userInfo, session, dataLoaded, lastLoadTime]),
  );

  useFocusEffect(
    React.useCallback(() => {
      eventCreationFlowLockedRef.current = false;
      setEventCreationFlowLocked(false);
    }, []),
  );

  // eventIds ref를 최신 상태로 유지
  useEffect(() => {
    eventIdsRef.current = events.map((e) => e.id).filter((id) => id);
    hostedEventMetaRef.current = new Map(
      events
        .filter((event) => {
          const isNotPersonalSchedule = !(
            event.source === "personal" || event.is_personal_schedule
          );
          const isHostedEvent =
            event.created_by || (event.user_id && !event.is_personal_schedule);
          return event.id && isNotPersonalSchedule && isHostedEvent;
        })
        .map((event) => [
          event.id,
          {
            event_name: event.event_name || event.title || "",
            event_type: event.event_type || "",
          },
        ]),
    );
  }, [events]);

  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  useEffect(
    () => () => {
      if (scrollIdleTimerRef.current) {
        clearTimeout(scrollIdleTimerRef.current);
      }
    },
    [],
  );

  const markHomeScrollActive = () => {
    isHomeScrollingRef.current = true;
    if (scrollIdleTimerRef.current) {
      clearTimeout(scrollIdleTimerRef.current);
    }
  };

  const markHomeScrollIdleSoon = () => {
    if (scrollIdleTimerRef.current) {
      clearTimeout(scrollIdleTimerRef.current);
    }
    scrollIdleTimerRef.current = setTimeout(() => {
      isHomeScrollingRef.current = false;
    }, 220);
  };

  // 홈 튜토리얼 자동 시작 — 로그인 후 첫 진입 시 1회
  useEffect(() => {
    if (!user?.id || tutorialCheckedRef.current) return;
    tutorialCheckedRef.current = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("tutorial_home_completed")
          .eq("id", user.id)
          .single();
        if (!error && data && !data.tutorial_home_completed) {
          // 튜토리얼 시작 전 더미 행사 없으면 하나 생성 (튜토리얼 중 만들기 건너뛰어도 내 행사에 하나는 보이도록)
          await ensureDemoEvent(user.id);
          setTimeout(() => startHomeTutorial(), 800);
        }
      } catch (e) {
        console.warn("튜토리얼 상태 조회 실패:", e);
      }
    })();
  }, [user?.id]);

  const refreshEventCreationCreditState = async ({
    showWelcomeIfReady = false,
  } = {}) => {
    if (!user?.id) return null;

    const state = await getEventCreationCreditState(user.id);
    if (!state.success) return null;

    setEventCreationCreditState(state);

    if (showWelcomeIfReady && !state.welcomeSeen) {
      setShowEventCreationWelcomeModal(true);
    }

    return state;
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "event-creation-credit-refunded",
      () => {
        refreshEventCreationCreditState();
      },
    );
    return () => sub.remove();
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return undefined;
      const timer = setTimeout(() => {
        refreshEventCreationCreditState();
      }, 250);
      return () => clearTimeout(timer);
    }, [user?.id]),
  );

  useEffect(() => {
    if (!user?.id) {
      welcomeCreditCheckedRef.current = null;
      return;
    }

    if (welcomeCreditCheckedRef.current === user.id) return;
    welcomeCreditCheckedRef.current = user.id;

    (async () => {
      const state = await refreshEventCreationCreditState();
      if (!state || state.welcomeSeen) return;

      const { data, error } = await supabase
        .from("users")
        .select("tutorial_home_completed")
        .eq("id", user.id)
        .single();

      if (!error && data?.tutorial_home_completed) {
        setShowEventCreationWelcomeModal(true);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (activeTutorial === "home") {
      wasHomeTutorialActiveRef.current = true;
      return;
    }

    if (
      !user?.id ||
      !wasHomeTutorialActiveRef.current ||
      activeTutorial !== null
    )
      return;
    wasHomeTutorialActiveRef.current = false;

    setTimeout(() => {
      refreshEventCreationCreditState({ showWelcomeIfReady: true });
    }, 700);
  }, [activeTutorial, user?.id]);

  const handleCloseEventCreationWelcomeModal = async () => {
    setShowEventCreationWelcomeModal(false);
    if (!user?.id) return;

    await markEventCreationWelcomeSeen(user.id);
    setEventCreationCreditState((prev) => ({
      ...prev,
      welcomeSeen: true,
    }));
  };

  // 더미 행사 존재 보장 — 신규 유저가 튜토리얼 시작 전에 하나 생성
  const ensureDemoEvent = async (uid) => {
    try {
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("user_id", uid)
        .limit(1);
      if (existing && existing.length > 0) return;

      await supabase.from("events").insert({
        user_id: uid,
        event_type: "wedding",
        event_name: "홍길동 · 김영희 결혼식",
        main_person_name: "홍길동 · 김영희",
        groom_name: "홍길동",
        bride_name: "김영희",
        event_date: "2099-12-31",
        ceremony_time: "14:00:00",
        location: "서울 샘플 웨딩홀",
        status: "active",
        template_style: "modern-dark",
        allow_messages: true,
      });
    } catch (e) {
      console.warn("더미 행사 생성 실패:", e);
    }
  };

  // 튜토리얼 활성 중에는 타겟 위치를 지속 재측정
  //   - 안드로이드/iPad: 레이아웃 시점 차이로 어긋나는 문제 해결
  //   - 스크롤/이미지 로드/회전: 어긋난 좌표 자동 복구
  useEffect(() => {
    if (activeTutorial !== "home") return;
    const measureRef = (ref, key) => {
      if (ref.current?.measureInWindow) {
        ref.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            registerTarget(key, { x, y, width, height });
          }
        });
      }
    };
    const measureAll = () => {
      measureRef(quickGridRef, "homeCreateSection");
      measureRef(weddingMakeBtnRef, "weddingMakeBtn");
      measureRef(funeralMakeBtnRef, "funeralMakeBtn");
    };
    // 즉시 + 200ms마다 재측정
    measureAll();
    const interval = setInterval(measureAll, 200);
    return () => clearInterval(interval);
  }, [activeTutorial, registerTarget]);

  // 튜토리얼 handler 등록 — Overlay가 타겟 탭 시 실행
  useEffect(() => {
    registerHandler("homeCreateSection", () => handleQuickStart("wedding"));
  }, [registerHandler]);

  // 자동 배너 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      if (isHomeScrollingRef.current) return;

      const nextIndex = (currentSlideRef.current + 1) % banners.length;
      bannerScrollRef.current?.scrollTo({
        x: nextIndex * bannerWidth,
        animated: true,
      });
      setCurrentSlide(nextIndex);
    }, 3500);
    return () => clearInterval(interval);
  }, [bannerWidth, banners.length]);

  // 📱 알림 권한 체크 및 설정
  useEffect(() => {
    const checkNotificationPermission = async () => {
      try {
        const actualUserInfo = userInfo?.userId
          ? {
              id: userInfo.userId,
              name: userInfo.userName,
            }
          : userInfo;

        if (!actualUserInfo?.id) return;

        const { data: userData, error } = await supabase
          .from("users")
          .select("push_notification_enabled")
          .eq("id", actualUserInfo.id)
          .single();

        if (error) {
          const permissionAsked = await AsyncStorage.getItem(
            "notificationPermissionAsked",
          );
          if (!permissionAsked) {
            setTimeout(() => setShowNotificationModal(true), 2000);
          }
          return;
        }

        if (userData && userData.push_notification_enabled === false) {
          const permissionAsked = await AsyncStorage.getItem(
            "notificationPermissionAsked",
          );
          if (!permissionAsked) {
            setTimeout(() => setShowNotificationModal(true), 2000);
          }
        }
      } catch (error) {}
    };

    checkNotificationPermission();
  }, [userInfo]);

  // 📱 푸시 알림 수신 리스너
  useEffect(() => {
    let notificationListener = null;
    let responseListener = null;

    try {
      // Expo Go에서는 알림 기능이 제한됨 - 함수 존재 여부 확인
      if (typeof Notifications.addNotificationReceivedListener === "function") {
        // 포그라운드에서 알림 수신 시
        notificationListener = Notifications.addNotificationReceivedListener(
          (notification) => {
            // 축의금 알림인 경우 데이터 새로고침
            if (notification.request.content.data?.type === "contribution") {
              loadEvents(); // 이벤트 목록 새로고침
              loadMonthlyStatistics(); // 통계 새로고침
            }
            if (notification.request.content.data?.type === "reciprocity") {
              loadReciprocityNotifications();
            }
          },
        );
      }

      if (
        typeof Notifications.addNotificationResponseReceivedListener ===
        "function"
      ) {
        // 알림 클릭 시 응답
        responseListener =
          Notifications.addNotificationResponseReceivedListener((response) => {
            // 축의금 알림 클릭 시 해당 이벤트로 이동
            if (
              response.notification.request.content.data?.type ===
              "contribution"
            ) {
              const eventId =
                response.notification.request.content.data.eventId;
              if (eventId) {
                // 이벤트 상세 화면으로 이동
                navigation.navigate("EventDisplay", { eventId });
              }
            }
            if (
              response.notification.request.content.data?.type === "reciprocity"
            ) {
              const eventId =
                response.notification.request.content.data.originalEventId;
              if (eventId) {
                navigation.navigate("EventDetail", { eventId });
              }
            }
          });
      }
    } catch (error) {}

    return () => {
      try {
        // 함수 존재 여부 확인 후 호출
        if (
          notificationListener &&
          typeof Notifications.removeNotificationSubscription === "function"
        ) {
          Notifications.removeNotificationSubscription(notificationListener);
        } else if (notificationListener?.remove) {
          notificationListener.remove();
        }

        if (
          responseListener &&
          typeof Notifications.removeNotificationSubscription === "function"
        ) {
          Notifications.removeNotificationSubscription(responseListener);
        } else if (responseListener?.remove) {
          responseListener.remove();
        }
      } catch (error) {}
    };
  }, [navigation]);

  // 📱 축의금 실시간 업데이트 리스너
  useEffect(() => {
    const actualUserInfo = userInfo?.userId
      ? {
          id: userInfo.userId,
          name: userInfo.userName,
        }
      : userInfo;

    if (!actualUserInfo?.id) return;

    const channelName = `guest-book-realtime-${actualUserInfo.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guest_book" },
        (payload) => {
          const changeType = payload.eventType || payload.event;
          const contributionData = payload.new || payload.old;
          const contributionEventId = contributionData?.event_id;
          const currentEventIds = eventIdsRef.current;

          // 내 이벤트인 경우만 처리
          if (currentEventIds.includes(contributionEventId)) {
            handleContributionChange(
              changeType,
              contributionData,
              currentEventIds,
            );
            handleGuestbookRealtimeChange(changeType, contributionData);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userInfo]);

  // 📱 축의금 변경 처리 공통 함수
  const handleContributionChange = (eventType, contribution, eventIds) => {
    if (!eventIds.includes(contribution?.event_id)) return;

    setDataLoaded(false);
    loadMonthlyStatistics();
  };

  const handleGuestbookRealtimeChange = (eventType, entry) => {
    const eventId = entry?.event_id;
    if (!eventId || !hostedEventMetaRef.current.has(eventId)) return;

    if (eventType === "DELETE") {
      setRecentGuestbookMessages((prev) =>
        prev.filter((item) => item.id !== entry.id),
      );
      return;
    }

    if (isReceptionGuestEntry(entry) || !String(entry.message || "").trim()) {
      setRecentGuestbookMessages((prev) =>
        prev.filter((item) => item.id !== entry.id),
      );
      return;
    }

    const eventInfo = hostedEventMetaRef.current.get(eventId) || {};
    const nextItem = {
      ...entry,
      event_name: eventInfo.event_name || "",
      event_type: eventInfo.event_type || "",
    };

    setRecentGuestbookMessages((prev) => {
      const withoutSame = prev.filter((item) => item.id !== nextItem.id);
      return [nextItem, ...withoutSame]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
        )
        .slice(0, 80);
    });

    setExpandedGuestbookEventIds((prev) => ({
      ...prev,
      [eventId]: true,
    }));

    setGuestbookPageByEventIds((prev) => ({
      ...prev,
      [eventId]: 0,
    }));
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
        const storedUserInfo = await AsyncStorage.getItem("userInfo");
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
    } catch (error) {}
  };

  // 🔥 서울 시간 기준 날짜 비교 함수 - 완전히 새로 작성
  const getEventCompletionDate = (event) => {
    if (!event) return null;
    if (event.event_type === "funeral") {
      return (
        event.burial_date ||
        event.funeral_end_date ||
        event.casket_date ||
        event.death_date ||
        event.event_date ||
        event.additional_info?.burial_date ||
        event.additional_info?.funeral_end_date ||
        event.additional_info?.casket_date ||
        event.additional_info?.death_date ||
        null
      );
    }
    return event.event_date || null;
  };

  const getEventDisplayDate = (event) => getEventCompletionDate(event);

  const getEventDisplayTime = (event) => {
    if (!event) return null;
    if (event.event_type === "funeral") {
      const completionDate = getEventCompletionDate(event);
      if (
        completionDate === event.burial_date ||
        completionDate === event.funeral_end_date ||
        completionDate === event.additional_info?.burial_date ||
        completionDate === event.additional_info?.funeral_end_date
      ) {
        return event.burial_time || event.additional_info?.burial_time || null;
      }
      if (
        completionDate === event.casket_date ||
        completionDate === event.additional_info?.casket_date
      ) {
        return event.casket_time || event.additional_info?.casket_time || null;
      }
      if (
        completionDate === event.death_date ||
        completionDate === event.additional_info?.death_date
      ) {
        return event.death_time || event.additional_info?.death_time || null;
      }
      return event.burial_time || event.casket_time || event.death_time || null;
    }
    return event.event_time || event.ceremony_time || null;
  };

  const getEventDisplayLocation = (event) => {
    if (!event) return "장소 미정";
    if (event.event_type === "funeral") {
      return (
        event.funeral_home ||
        event.location ||
        event.burial_location ||
        event.additional_info?.funeral_home ||
        event.additional_info?.burial_location ||
        "장소 미정"
      );
    }
    return event.location || "장소 미정";
  };

  const isEventCompleted = (event) => {
    const eventDate =
      typeof event === "string" ? event : getEventCompletionDate(event);
    if (!eventDate) {
      return false; // 부고/경조사 날짜가 미정이면 진행중으로 유지
    }

    try {
      // 현재 서울 시간 구하기
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 이벤트 날짜 구하기
      const eventDay = new Date(eventDate);
      if (Number.isNaN(eventDay.getTime())) return false;
      const eventDateOnly = new Date(
        eventDay.getFullYear(),
        eventDay.getMonth(),
        eventDay.getDate(),
      );

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
          auth_method: "phone",
        });

        return;
      }

      // 2순위: Supabase Auth 세션
      if (session?.user) {
        setUser(session.user);

        return;
      }

      // 3순위: AsyncStorage 확인 (폰 인증)
      const storedUserInfo = await AsyncStorage.getItem("userInfo");
      const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");

      if (isLoggedIn === "true" && storedUserInfo) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        setUser({
          id: parsedUserInfo.userId,
          user_metadata: { name: parsedUserInfo.userName },
          phone: parsedUserInfo.phone,
          auth_method: "phone",
        });

        return;
      }

      // 4순위: 직접 Supabase 조회
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
      }
    } catch (error) {}
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
          phone: userInfo.phone || userInfo.userPhone,
          auth_method: "phone",
        };
      } else if (session?.user) {
        // Supabase 세션 사용
        currentUserInfo = {
          id: session.user.id,
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0],
          email: session.user.email,
          auth_method: "supabase",
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
                  average_amount: statsResult.data.averageAmount,
                };
                return eventWithStats;
              }
            } catch (error) {}
            // 통계 로드 실패 시 기본값
            return {
              ...event,
              total_contributions: 0,
              total_amount: 0,
              verified_count: 0,
              attending_count: 0,
              average_amount: 0,
            };
          }),
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
        const formattedSchedules = personalSchedules.map((schedule) => ({
          ...schedule,
          is_personal_schedule: true,
          source: "personal",
        }));

        // 🔥 중복 제거 - ID 기준으로 고유한 이벤트만 필터링
        const uniqueEvents = formattedSchedules.filter(
          (event, index, self) =>
            index === self.findIndex((e) => e.id === event.id),
        );

        setActiveEvents(uniqueEvents);
      } else {
        setActiveEvents([]);
      }
    } catch (error) {
      setActiveEvents([]);
    }
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "hosted-event-finalized",
      async () => {
        await Promise.all([loadEvents(), loadActiveEvents()]);
        setLastLoadTime(Date.now());
        setDataLoaded(true);
      },
    );
    return () => sub.remove();
  }, [userInfo, session]);

  // 빠른 시작 버튼 핸들러
  const getCreationCreditNotice = (state = eventCreationCreditState) => {
    const freeRemaining = Number(state?.freeRemaining || 0);
    const priceCredits = Number(
      state?.priceCredits || EVENT_CREATION_CREDIT_COST,
    );
    const balance = Number(state?.balance || 0);

    if (freeRemaining > 0) {
      return {
        isPaid: false,
        text: `무료 생성 ${freeRemaining}회 남음`,
        detail: `청첩장/부고장 만들기를 완료할 때 무료 생성 횟수 1회가 사용됩니다.`,
      };
    }

    return {
      isPaid: true,
      text: `${priceCredits}크레딧 차감`,
      detail: `무료 생성 횟수를 모두 사용해서 만들기를 완료할 때 ${priceCredits}크레딧이 차감됩니다. 현재 잔액은 ${balance}크레딧입니다.`,
    };
  };

  const closeCreditShortageModal = () => {
    eventCreationFlowLockedRef.current = false;
    setEventCreationFlowLocked(false);
    setCreditShortageModal((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const showCreditShortageModal = (eventType, state) => {
    setCreditShortageModal({
      visible: true,
      eventType,
      balance: Number(state?.balance || 0),
      priceCredits: Number(state?.priceCredits || EVENT_CREATION_CREDIT_COST),
    });
  };

  const handleEventCreationIntent = async (eventType) => {
    if (eventCreationFlowLockedRef.current) return;
    eventCreationFlowLockedRef.current = true;
    setEventCreationFlowLocked(true);

    let latestState;
    try {
      latestState = await refreshEventCreationCreditState();
    } catch (error) {
      eventCreationFlowLockedRef.current = false;
      setEventCreationFlowLocked(false);
      throw error;
    }

    const state = latestState || eventCreationCreditState;
    const notice = getCreationCreditNotice(state);

    let shouldUnlockOnDismiss = true;
    const proceedToCreateScreen = () => {
      shouldUnlockOnDismiss = false;
      handleQuickStart(eventType);
    };

    if (!notice.isPaid) {
      proceedToCreateScreen();
      return;
    }

    if (
      Number(state?.balance || 0) <
      Number(state?.priceCredits || EVENT_CREATION_CREDIT_COST)
    ) {
      showCreditShortageModal(eventType, state);
      return;
    }

    Alert.alert(
      `완료 시 ${state?.priceCredits || EVENT_CREATION_CREDIT_COST}크레딧이 차감됩니다`,
      `${eventType === "funeral" ? "부고장" : "청첩장"} 만들기를 완료하면 ${state?.priceCredits || EVENT_CREATION_CREDIT_COST}크레딧이 사용됩니다.\n계속 진행할까요?`,
      [
        {
          text: "취소",
          style: "cancel",
          onPress: () => {
            eventCreationFlowLockedRef.current = false;
            setEventCreationFlowLocked(false);
          },
        },
        { text: "진행하기", onPress: proceedToCreateScreen },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          if (shouldUnlockOnDismiss && eventCreationFlowLockedRef.current) {
            eventCreationFlowLockedRef.current = false;
            setEventCreationFlowLocked(false);
          }
        },
      },
    );
  };

  const handleQuickStart = async (eventType, params = {}) => {
    if (eventType === "wedding") {
      // 🆕 결혼식은 전용 스크린으로
      navigation.navigate("CreateWedding", params);
    } else if (eventType === "funeral") {
      navigation.navigate("CreateFuneral", params);
    } else {
      // 🔄 기타 타입들은 기존 방식 유지
      navigation.navigate("CreateEvent", { eventType });
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
    return activeEvents
      .filter((event) => {
        if (!event.event_date) return false;

        const eventDate = new Date(event.event_date);
        return (
          eventDate.getMonth() === currentMonth &&
          eventDate.getFullYear() === currentYear
        );
      })
      .sort((a, b) => {
        // 날짜순 정렬
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        return new Date(a.event_date) - new Date(b.event_date);
      });
  };

  // 🔥 월별 이벤트를 주최자/참여자로 분리
  const getGroupedMonthlyEvents = () => {
    const monthlyEvents = getMonthlyEvents();
    const hostEvents = monthlyEvents.filter(
      (event) => event.source === "hosted" && !event.is_personal_schedule,
    );
    const participantEvents = monthlyEvents.filter(
      (event) => event.source === "personal" || event.is_personal_schedule,
    );

    return { hostEvents, participantEvents };
  };

  // 🔥 이벤트 역할 구분 함수
  const getEventRole = (event) => {
    // 주최자: 내가 생성한 경조사 (events 테이블에서 온 데이터)
    if (event.source === "hosted" && !event.is_personal_schedule) {
      return EVENT_ROLES.HOST;
    }
    // 참여자: 개인 일정으로 추가한 다른 사람의 경조사
    if (event.source === "personal" || event.is_personal_schedule) {
      return EVENT_ROLES.PARTICIPANT;
    }
    return EVENT_ROLES.PARTICIPANT; // 기본값
  };

  // 🔥 역할별 이벤트 분리 함수
  const separateEventsByRole = (events) => {
    const hostEvents = events.filter(
      (event) => getEventRole(event) === EVENT_ROLES.HOST,
    );
    const participantEvents = events.filter(
      (event) => getEventRole(event) === EVENT_ROLES.PARTICIPANT,
    );

    return {
      hostEvents,
      participantEvents,
    };
  };

  // 🔥 이벤트 클릭 처리 - 소스에 따라 다르게 처리
  const handleActiveEventPress = (event, source = "management") => {
    const eventRole = getEventRole(event);
    const roleText = eventRole === EVENT_ROLES.HOST ? "주최자" : "참여자";

    // 캘린더에서 클릭: 단순 로그만 출력 (모달 제거)
    if (source === "calendar") {
      return;
    }

    // 나의 경조사 관리에서 클릭: 디스플레이 모드로 이동 (기존 로직)
    if (source === "management") {
      // DB에서 저장된 이미지와 템플릿 정보 파싱
      const templateStyle =
        event.template_style ||
        (event.event_type === "funeral" ? "modern-card" : "modern-dark");

      // additional_info에서 카테고리별 이미지 정보 추출
      const additionalInfo = event.additional_info || {};
      const categorizedImages = additionalInfo.categorized_images || {};

      // image_urls에서 카테고리별로 이미지 분류 (백업 로직)
      const imageUrls = event.image_urls || [];
      const fallbackCategorizedImages = {
        main: imageUrls.filter((img) => img.category === "main"),
        gallery: imageUrls.filter((img) => img.category === "gallery"),
        groom: imageUrls.filter((img) => img.category === "groom"),
        bride: imageUrls.filter((img) => img.category === "bride"),
        all: imageUrls,
      };

      // 카테고리별 이미지가 없으면 fallback 사용
      const finalCategorizedImages =
        Object.keys(categorizedImages).length > 0
          ? categorizedImages
          : fallbackCategorizedImages;

      // 🔥 이벤트 타입에 따른 데이터 준비
      let eventData = {
        type: event.event_type,
      };

      if (event.event_type === "funeral") {
        // 🔥 부고 데이터 준비 - additional_info에서 상주 정보 추출
        const familyMembers =
          event.family_members || additionalInfo.family_members || [];

        eventData = {
          ...eventData,
          // 고인 정보
          deceasedName: event.deceased_name || event.main_person_name,
          deceasedAge: event.deceased_age,
          birthDate: event.birth_date,
          ageCalculationMethod: event.age_calculation_method,
          deathDate: event.death_date,
          deathTime: event.death_time,
          deceasedGender: event.deceased_gender || "남",

          // 장례 일정
          casketDate:
            event.casket_date ||
            event.funeral_start_date ||
            additionalInfo.funeral_start_date,
          casketTime: event.casket_time,
          burialDate:
            event.burial_date ||
            event.funeral_end_date ||
            additionalInfo.funeral_end_date,
          burialTime: event.burial_time,
          burialLocation: event.burial_location,
          secondaryBurialLocation: event.secondary_burial_location,
          religiousRite: event.religious_rite,
          funeralMethod: event.funeral_method,
          visitationType: event.visitation_type,
          visitationNote: event.visitation_note,
          parkingTransportInfo: event.parking_transport_info,
          condolenceAccounts: event.condolence_accounts,

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
          additional_info: additionalInfo,
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

      const displayParams = {
        eventId: event.id,
        templateStyle: templateStyle,
        categorizedImages: finalCategorizedImages,
      };

      if (event.event_type !== "funeral") {
        displayParams.eventData = eventData;
      }

      navigation.navigate("EventDisplay", displayParams);
    }
  };

  // 부조하기 버튼 클릭
  const handleContributePress = (event, e) => {
    e.stopPropagation(); // 부모 터치 이벤트 방지
    navigation.navigate("Contribution", {
      eventId: event.id,
      eventName: event.event_name,
    });
  };

  // 🔥 더보기 버튼 핸들러
  const handleViewMore = () => {
    navigation.navigate("MyEvents");
  };

  // 🔥 통계 상세보기 - MyEvents 탭으로 이동하면서 통계 탭 선택
  const handleStatisticsDetail = () => {
    // Statistics 스크린이 없으므로 MyEvents로 이동
    navigation.navigate("MyEvents", { initialTab: "statistics" });
  };

  const currentSlideData = banners[currentSlide] || banners[0];

  // 사용자 이름 결정 로직 개선
  const getUserName = () => {
    if (userInfo?.userName) return userInfo.userName;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.phone) return user.phone.replace("+82", "0");
    if (user?.email) return user.email.split("@")[0];
    return "사용자";
  };

  const userName = getUserName();
  const currentUserId = user?.id || userInfo?.userId;

  const formatPhoneNumber = (phone) => {
    const digits = String(phone || "").replace(/[^0-9]/g, "");
    if (!digits) return "";
    const localDigits =
      digits.startsWith("82") && digits.length >= 11
        ? `0${digits.slice(2)}`
        : digits.startsWith("0082") && digits.length >= 13
          ? `0${digits.slice(4)}`
          : digits;
    if (localDigits.length === 11) {
      return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 7)}-${localDigits.slice(7)}`;
    }
    if (localDigits.length === 10) {
      return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
    }
    return phone || "";
  };

  const openHostedEventEdit = (event) => {
    if (!event || event.status !== "active") return;
    const targetScreen =
      event.event_type === "funeral" ? "CreateFuneral" : "CreateWedding";
    Alert.alert("수정 안내", `수정 내용을 저장하면 ${EVENT_EDIT_CREDIT_COST}크레딧이 차감됩니다.`, [
      { text: "취소", style: "cancel" },
      {
        text: "수정하기",
        onPress: () =>
          navigation.navigate(targetScreen, {
            editMode: true,
            editEventId: event.id,
            editEvent: event,
          }),
      },
    ]);
  };

  const getReciprocityEventIcon = (eventType) =>
    eventType === "funeral"
      ? RECIPROCITY_EVENT_ICONS.funeral
      : RECIPROCITY_EVENT_ICONS.wedding;

  // 🔥 나의 경조사 관리는 주최한 경조사만 사용 (개인 일정 완전 제외)
  const hostedEvents = useMemo(
    () =>
      events.filter((event, index, self) => {
        // 중복 제거
        const isUnique = index === self.findIndex((e) => e.id === event.id);
        // 개인 일정 제외 (source가 'personal'이거나 is_personal_schedule이 true인 항목 제외)
        const isNotPersonalSchedule = !(
          event.source === "personal" || event.is_personal_schedule
        );
        // 실제 경조사 이벤트만 포함 (created_by나 user_id가 있는 주최한 경조사)
        const isHostedEvent =
          event.created_by || (event.user_id && !event.is_personal_schedule);

        return isUnique && isNotPersonalSchedule && isHostedEvent;
      }),
    [events],
  );

  // 🔥 서울 시간 기준으로 진행중/완료 분류 - 주최한 경조사만
  const activeEventsFiltered = useMemo(
    () => hostedEvents.filter((event) => !isEventCompleted(event)),
    [hostedEvents],
  );

  const completedEventsFiltered = useMemo(
    () => hostedEvents.filter((event) => isEventCompleted(event)),
    [hostedEvents],
  );
  const thankYouReadyEvents = useMemo(
    () => hostedEvents.filter((event) => event.is_finalized === true),
    [hostedEvents],
  );

  const getHostedEventSortTime = (event) => {
    const dateValue =
      hostedSortBy === "createdAt"
        ? event.created_at || event.createdAt || event.created_at_local
        : getEventDisplayDate(event);
    const time = new Date(dateValue || "").getTime();
    return Number.isFinite(time) ? time : null;
  };

  const sortedDisplayedEvents = useMemo(() => {
    const eventList =
      selectedTab === "active" ? activeEventsFiltered : completedEventsFiltered;
    return [...eventList].sort((a, b) => {
      const aTime = getHostedEventSortTime(a);
      const bTime = getHostedEventSortTime(b);

      if (aTime === null && bTime === null) {
        return String(a.event_name || a.title || "").localeCompare(
          String(b.event_name || b.title || ""),
          "ko",
        );
      }
      if (aTime === null) return 1;
      if (bTime === null) return -1;

      return hostedSortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [
    activeEventsFiltered,
    completedEventsFiltered,
    hostedSortBy,
    hostedSortOrder,
    selectedTab,
  ]);

  const handleHostedSortByPress = (sortBy) => {
    setHostedSortBy(sortBy);
    setHostedEventPage(0);
  };

  const toggleHostedSortOrder = () => {
    setHostedSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setHostedEventPage(0);
  };

  // 🔥 페이지네이션으로 표시
  const displayedEvents = sortedDisplayedEvents;
  const totalCount = displayedEvents.length;
  const hostedTotalPages = Math.max(1, Math.ceil(totalCount / eventsPerPage));
  const safeHostedEventPage = Math.min(
    Math.max(0, hostedEventPage),
    hostedTotalPages - 1,
  );
  const currentEvents = useMemo(
    () =>
      displayedEvents.slice(
        safeHostedEventPage * eventsPerPage,
        (safeHostedEventPage + 1) * eventsPerPage,
      ),
    [displayedEvents, safeHostedEventPage],
  );

  useEffect(() => {
    if (hostedEventPage !== safeHostedEventPage) {
      setHostedEventPage(safeHostedEventPage);
    }
  }, [hostedEventPage, safeHostedEventPage]);

  // 🔥 금액 포맷팅 함수
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return "0원";
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 품앗이 장부 state & 함수 (Supabase 기반)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [pumasiTab, setPumasiTab] = useState("received"); // 'received' | 'gave'
  const [pumasiReceived, setPumasiReceived] = useState([]); // guest_book 기반 "내가 받음"
  const [pumasiGave, setPumasiGave] = useState([]); // pumasi_gave 테이블 "내가 줬음"
  const [showPumasiAddModal, setShowPumasiAddModal] = useState(false);
  const [pumasiGaveForm, setPumasiGaveForm] = useState({
    recipient_name: "",
    amount: "",
    occasion: "",
    event_date: new Date().toISOString().split("T")[0],
    linked_guest_id: null,
  });
  const [guestBookList, setGuestBookList] = useState([]); // 사람 선택용 guest_book 목록

  // 필터 state
  const [pumasiFilterEvent, setPumasiFilterEvent] = useState(null); // { id, event_name, event_type } | null
  const [pumasiFilterRelation, setPumasiFilterRelation] = useState(null); // string | null
  const [showPumasiFilterSheet, setShowPumasiFilterSheet] = useState(false);
  const [pumasiFilterStep, setPumasiFilterStep] = useState(1); // 1=경조사선택, 2=신랑/신부측(wedding만), 3=관계선택
  const [pumasiFilterSide, setPumasiFilterSide] = useState(null); // '신랑측' | '신부측' | null

  // 줬음 기록 바텀시트 (받음 항목에서 열리는 모달)
  const [showPumasiGaveSheet, setShowPumasiGaveSheet] = useState(false);

  // 페이지네이션
  const [pumasiReceivedPage, setPumasiReceivedPage] = useState(0);
  const [pumasiGavePage, setPumasiGavePage] = useState(0);
  const PUMASI_PER_PAGE = 5;
  const [reciprocityNotifications, setReciprocityNotifications] = useState([]);
  const [reciprocityLoading, setReciprocityLoading] = useState(false);
  const [reciprocityPage, setReciprocityPage] = useState(0);
  const [selectedReciprocityGroup, setSelectedReciprocityGroup] =
    useState(null);
  const [reciprocitySheetVisible, setReciprocitySheetVisible] =
    useState(false);
  const reciprocitySheetFade = useRef(new Animated.Value(0)).current;
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [recentGuestbookMessages, setRecentGuestbookMessages] = useState([]);
  const [expandedGuestbookEventIds, setExpandedGuestbookEventIds] = useState(
    {},
  );
  const [guestbookPageByEventIds, setGuestbookPageByEventIds] = useState({});
  const RECIPROCITY_PER_PAGE = 3;
  const EVENT_GUESTBOOK_PER_PAGE = 3;
  const [activityNotifications, setActivityNotifications] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const activityNotificationSignatureRef = useRef("");

  // 줬음 기록된 guest_book id 세트
  const gaveLinkedIds = useMemo(
    () => new Set(pumasiGave.map((g) => g.linked_guest_id).filter(Boolean)),
    [pumasiGave],
  );

  // 영어 DB 값 → 한글 변환 (표시용)
  const koreanCat = (val) => {
    const map = {
      groom: "신랑측",
      bride: "신부측",
      groom_side: "신랑측",
      bride_side: "신부측",
      신랑측: "신랑측",
      신부측: "신부측",
    };
    return map[val] || val || "";
  };
  const koreanDet = (val) => {
    const map = {
      family: "친척",
      friend: "친구",
      colleague: "직장",
      other: "기타",
      groom_family: "친척",
      bride_family: "친척",
      groom_friend: "친구",
      bride_friend: "친구",
      groom_colleague: "직장",
      bride_colleague: "직장",
      친척: "친척",
      친구: "친구",
      직장: "직장",
      기타: "기타",
    };
    return map[val] || val || "";
  };

  // 요약 금액용: 줬음 제외 없이 필터 조건만 적용 (한글 기준 비교)
  const filteredPumasiReceivedAll = useMemo(
    () =>
      pumasiReceived.filter((item) => {
        if (pumasiFilterEvent && item.event_id !== pumasiFilterEvent.id)
          return false;
        if (
          pumasiFilterSide &&
          koreanCat(item.relation_category) !== pumasiFilterSide
        )
          return false;
        if (
          pumasiFilterRelation &&
          koreanDet(item.relation_detail) !== pumasiFilterRelation
        )
          return false;
        return true;
      }),
    [pumasiFilterEvent, pumasiFilterRelation, pumasiFilterSide, pumasiReceived],
  );

  // 목록용: 이미 줬음 기록된 항목 추가 제외
  const filteredPumasiReceived = useMemo(
    () =>
      filteredPumasiReceivedAll.filter((item) => !gaveLinkedIds.has(item.id)),
    [filteredPumasiReceivedAll, gaveLinkedIds],
  );

  // 선택된 경조사의 측 목록 — 한글로 변환 후 중복 제거 (groom/신랑측 통합)
  const availableSides = useMemo(
    () =>
      pumasiFilterEvent
        ? [
            ...new Set(
              pumasiReceived
                .filter((g) => g.event_id === pumasiFilterEvent.id)
                .map((g) => koreanCat(g.relation_category))
                .filter(Boolean),
            ),
          ]
        : [],
    [pumasiFilterEvent, pumasiReceived],
  );

  // 선택된 경조사 + 측의 관계 목록 — 한글로 변환 후 중복 제거
  const availableRelations = useMemo(
    () =>
      pumasiFilterEvent
        ? [
            ...new Set(
              pumasiReceived
                .filter((g) => {
                  if (g.event_id !== pumasiFilterEvent.id) return false;
                  if (
                    pumasiFilterSide &&
                    koreanCat(g.relation_category) !== pumasiFilterSide
                  )
                    return false;
                  return true;
                })
                .map((g) => koreanDet(g.relation_detail))
                .filter(Boolean),
            ),
          ]
        : [],
    [pumasiFilterEvent, pumasiFilterSide, pumasiReceived],
  );

  const parseGuestAdditionalInfo = (value) => {
    if (!value) return {};
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const isReceptionGuestEntry = (entry) => {
    const info = parseGuestAdditionalInfo(entry?.additional_info);
    return (
      Number(entry?.amount || 0) > 0 &&
      (entry?.input_method === "handwriting" ||
        !!entry?.handwriting_image_url ||
        info.created_via === "app_guest_reception")
    );
  };

  const getNewEventPersonName = (event = {}) => {
    const mainName = String(event.main_person_name || "").trim();
    if (mainName) return mainName;

    const groomName = String(event.groom_name || "").trim();
    const brideName = String(event.bride_name || "").trim();
    if (groomName && brideName) return `${groomName} · ${brideName}`;
    return groomName || brideName || "상대";
  };

  const getReciprocityDisplayName = (item = {}, latestNewEvent = {}) => {
    const candidates = [
      item.originalEvents?.[0]?.source_guest_name,
      item.source_guest_name,
      item.items?.[0]?.source_guest_name,
      getNewEventPersonName(latestNewEvent),
    ];

    return (
      candidates
        .map((name) => String(name || "").trim())
        .find((name) => name.length > 0) || "상대"
    );
  };

  const getCurrentReciprocityGuest = (item = {}) => item.source_guest || null;

  const getCurrentReciprocityAmount = (item = {}) => {
    const currentGuest = getCurrentReciprocityGuest(item);
    if (!currentGuest) return 0;
    return Number(currentGuest.amount || 0) || 0;
  };

  const openInvitationPreview = async (event) => {
    if (!event?.id) return;
    try {
      await Linking.openURL(
        getInvitationUrl(
          event,
          event.template_style ||
            (event.event_type === "funeral" ? "modern-card" : "modern-dark"),
        ),
      );
    } catch (error) {
      console.warn("open invitation failed:", error);
      Alert.alert("알림", "모바일 청첩장을 열 수 없습니다.");
    }
  };

  const recentGuestbookByEventId = useMemo(() => {
    const grouped = new Map();
    recentGuestbookMessages.forEach((item) => {
      const eventId = item.event_id;
      if (!eventId) return;
      const list = grouped.get(eventId) || [];
      list.push(item);
      grouped.set(eventId, list);
    });
    return grouped;
  }, [recentGuestbookMessages]);

  const getRecentGuestbookForEvent = (eventId) =>
    recentGuestbookByEventId.get(eventId) || [];

  const toggleGuestbookForEvent = (eventId) => {
    setExpandedGuestbookEventIds((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));

    setGuestbookPageByEventIds((prev) => ({
      ...prev,
      [eventId]: 0,
    }));
  };

  const setGuestbookPageForEvent = (eventId, nextPage, totalPages) => {
    const safeTotalPages = Math.max(1, totalPages);
    const safePage = Math.min(Math.max(0, nextPage), safeTotalPages - 1);
    setGuestbookPageByEventIds((prev) => ({
      ...prev,
      [eventId]: safePage,
    }));
  };

  const handleDeleteGuestbookMessage = (messageItem) => {
    if (!messageItem?.id) return;
    const actorUserId = user?.id || userInfo?.userId;
    const writerName = messageItem.guest_name || "익명";

    Alert.alert(
      "방명록 삭제",
      `${writerName}님의 방명록을 삭제하시겠어요?\n\n삭제된 글은 복구할 수 없습니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const result = await deleteGuestBookEntry(
              messageItem.id,
              actorUserId,
            );
            if (!result.success) {
              Alert.alert(
                "삭제 실패",
                result.error || "방명록 삭제 중 오류가 발생했습니다.",
              );
              return;
            }

            setRecentGuestbookMessages((prev) =>
              prev.filter((item) => item.id !== messageItem.id),
            );
            setPumasiReceived((prev) =>
              prev.filter((item) => item.id !== messageItem.id),
            );
            setGuestBookList((prev) =>
              prev.filter((item) => item.id !== messageItem.id),
            );
            setDataLoaded(false);
            loadMonthlyStatistics();
          },
        },
      ],
    );
  };

  // 내가 받음: 이미 로드된 hostedEvents 기반으로 guest_book 전체 로드
  const loadPumasiReceived = async () => {
    try {
      const userId = user?.id || userInfo?.userId;
      if (!userId) return;

      // hostedEvents 우선 사용, 없으면 직접 쿼리
      let eventList =
        hostedEvents.length > 0
          ? hostedEvents.map((e) => ({
              id: e.id,
              event_name: e.event_name || e.title || "",
              event_type: e.event_type || "",
            }))
          : null;

      if (!eventList || eventList.length === 0) {
        const { data: evData } = await supabase
          .from("events")
          .select("id, event_name, event_type")
          .eq("user_id", userId)
          .limit(200);
        if (!evData || evData.length === 0) return;
        eventList = evData;
      }

      const eventIds = eventList.map((e) => e.id);

      // limit 10000으로 전체 로드 (Supabase 기본 1000행 제한 우회)
      const { data: guestData } = await supabase
        .from("guest_book")
        .select(
          "id, guest_name, amount, relation_category, relation_detail, event_id, created_at, input_method, handwriting_image_url, additional_info",
        )
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
        .limit(10000);

      if (guestData) {
        const enriched = guestData.filter(isReceptionGuestEntry).map((g) => ({
          ...g,
          event_name:
            eventList.find((e) => e.id === g.event_id)?.event_name || "",
          event_type:
            eventList.find((e) => e.id === g.event_id)?.event_type || "",
        }));
        setPumasiReceived(enriched);
        setGuestBookList(enriched);
      }
    } catch (e) {
      console.error("loadPumasiReceived error:", e);
    }
  };

  const loadRecentGuestbookMessages = async () => {
    try {
      const userId = user?.id || userInfo?.userId;
      if (!userId) return;

      let eventList =
        hostedEvents.length > 0
          ? hostedEvents.map((e) => ({
              id: e.id,
              event_name: e.event_name || e.title || "",
              event_type: e.event_type || "",
            }))
          : null;

      if (!eventList || eventList.length === 0) {
        const { data: evData } = await supabase
          .from("events")
          .select("id, event_name, event_type")
          .eq("user_id", userId)
          .limit(200);
        if (!evData || evData.length === 0) {
          setRecentGuestbookMessages([]);
          return;
        }
        eventList = evData;
      }

      const eventIds = eventList.map((e) => e.id).filter(Boolean);
      if (eventIds.length === 0) {
        setRecentGuestbookMessages([]);
        return;
      }

      const { data: guestData, error } = await supabase
        .from("guest_book")
        .select(
          "id, event_id, guest_name, guest_phone, message, amount, created_at, input_method, handwriting_image_url, additional_info",
        )
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
        .limit(80);

      if (error) throw error;

      const enriched = (guestData || [])
        .filter((item) => !isReceptionGuestEntry(item))
        .filter((item) => String(item.message || "").trim().length > 0)
        .map((item) => {
          const eventInfo = eventList.find((e) => e.id === item.event_id) || {};
          return {
            ...item,
            event_name: eventInfo.event_name || "",
            event_type: eventInfo.event_type || "",
          };
        })
        .slice(0, 5);

      setRecentGuestbookMessages(enriched);
    } catch (e) {
      console.error("loadRecentGuestbookMessages error:", e);
    }
  };

  // Supabase auth.uid() 가져오기 (폰 인증은 anonymously 세션 사용)
  const getSupabaseAuthId = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    return currentSession?.user?.id || null;
  };

  // 내가 줬음: pumasi_gave 테이블 로드
  const loadPumasiGave = async () => {
    const authId = await getSupabaseAuthId();
    if (!authId) return;
    try {
      const { data } = await supabase
        .from("pumasi_gave")
        .select("*")
        .eq("user_id", authId)
        .order("created_at", { ascending: false });
      if (data) setPumasiGave(data);
    } catch (e) {
      console.error("loadPumasiGave error:", e);
    }
  };

  // 줬음 추가
  const addPumasiGave = async () => {
    if (!pumasiGaveForm.recipient_name || !pumasiGaveForm.amount) return;
    const authId = await getSupabaseAuthId();
    if (!authId) {
      Alert.alert("오류", "로그인 상태를 확인해주세요.");
      return;
    }
    try {
      const { error } = await supabase.from("pumasi_gave").insert({
        user_id: authId,
        linked_guest_id: pumasiGaveForm.linked_guest_id,
        recipient_name: pumasiGaveForm.recipient_name,
        amount: parseInt(String(pumasiGaveForm.amount).replace(/,/g, ""), 10),
        occasion: pumasiGaveForm.occasion,
        event_date: pumasiGaveForm.event_date || null,
      });
      if (!error) {
        setShowPumasiGaveSheet(false);
        setShowPumasiAddModal(false);
        setPumasiGaveForm({
          recipient_name: "",
          amount: "",
          occasion: "",
          event_date: new Date().toISOString().split("T")[0],
          linked_guest_id: null,
        });
        loadPumasiGave();
      } else {
        console.error("addPumasiGave DB error:", error);
        Alert.alert("오류", "저장 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error("addPumasiGave error:", e);
      Alert.alert("오류", "저장 중 오류가 발생했습니다.");
    }
  };

  // 정산 완료/취소 토글
  const togglePumasiSettle = async (id, currentSettled) => {
    try {
      await supabase
        .from("pumasi_gave")
        .update({ settled: !currentSettled })
        .eq("id", id);
      loadPumasiGave();
    } catch (e) {
      console.error("togglePumasiSettle error:", e);
    }
  };

  const normalizePhoneDigits = (phone) => {
    const digits = String(phone || "").replace(/[^0-9]/g, "");
    if (digits.startsWith("0082") && digits.length >= 13)
      return `0${digits.slice(4)}`;
    if (digits.startsWith("82") && digits.length >= 11)
      return `0${digits.slice(2)}`;
    return digits;
  };

  const groupReciprocityNotifications = (items = []) => {
    const grouped = new Map();

    items.forEach((item) => {
      const phoneKey = normalizePhoneDigits(item.source_guest_phone);
      const nameKey = String(item.source_guest_name || "").trim();
      const groupKey = phoneKey || `name:${nameKey || item.id}`;
      const currentGuest = getCurrentReciprocityGuest(item);
      const currentAmount = getCurrentReciprocityAmount(item);

      if (!currentGuest || currentAmount <= 0) {
        return;
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          ...item,
          id: groupKey,
          groupKey,
          source_guest_phone:
            currentGuest?.guest_phone || item.source_guest_phone,
          source_guest_name:
            currentGuest?.guest_name || item.source_guest_name,
          items: [],
          originalEvents: [],
          newEvents: [],
          originalEventMap: new Map(),
          newEventMap: new Map(),
          source_amount_total: 0,
          source_amount_max: 0,
          status: "read",
        });
      }

      const group = grouped.get(groupKey);
      group.items.push(item);
      if (item.status === "completed" && group.status !== "unread") {
        group.status = "completed";
      }
      if (item.status === "unread") {
        group.status = "unread";
      }

      if (
        !group.created_at ||
        new Date(item.created_at) > new Date(group.created_at)
      ) {
        group.created_at = item.created_at;
        group.source_guest_name =
          currentGuest?.guest_name ||
          item.source_guest_name ||
          group.source_guest_name;
        group.source_guest_phone =
          currentGuest?.guest_phone ||
          item.source_guest_phone ||
          group.source_guest_phone;
        group.new_event = item.new_event || group.new_event;
        group.new_event_id = item.new_event_id || group.new_event_id;
      }

      const originalEventId = item.original_event_id || item.original_event?.id;
      if (
        originalEventId &&
        item.original_event &&
        !group.originalEventMap.has(originalEventId)
      ) {
        group.originalEventMap.set(originalEventId, {
          ...item.original_event,
          notificationId: item.id,
          source_guest_id: currentGuest?.id || item.source_guest_id,
          source_guest_name:
            currentGuest?.guest_name || item.source_guest_name,
          source_guest_phone:
            currentGuest?.guest_phone || item.source_guest_phone,
          amount: currentAmount,
          created_at: item.created_at,
        });
        group.source_amount_total += currentAmount;
        group.source_amount_max = Math.max(
          group.source_amount_max,
          currentAmount,
        );
      }

      const newEventId = item.new_event_id || item.new_event?.id;
      if (newEventId && item.new_event && !group.newEventMap.has(newEventId)) {
        group.newEventMap.set(newEventId, {
          ...item.new_event,
          notificationId: item.id,
          notification_created_at: item.created_at,
        });
      }
    });

    return Array.from(grouped.values())
      .map((group) => {
        const originalEvents = Array.from(group.originalEventMap.values()).sort(
          (a, b) =>
            new Date(b.event_date || b.created_at || 0) -
            new Date(a.event_date || a.created_at || 0),
        );
        const newEvents = Array.from(group.newEventMap.values()).sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
        );
        return {
          ...group,
          originalEvents,
          newEvents,
          originalEventMap: undefined,
          newEventMap: undefined,
        };
      })
      .sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );
  };

  const groupedReciprocityNotifications = useMemo(
    () => groupReciprocityNotifications(reciprocityNotifications),
    [reciprocityNotifications],
  );

  const showReciprocityLocalNotification = async (item, options = {}) => {
    try {
      const notificationKey = item?.new_event_id || item?.id;
      if (
        !notificationKey ||
        reciprocityRealtimeSeenRef.current.has(notificationKey)
      )
        return;
      if (
        item.created_at &&
        new Date(item.created_at) < new Date(reciprocityNotifyAfterRef.current)
      )
        return;
      reciprocityRealtimeSeenRef.current.add(notificationKey);

      const body = `${item.source_guest_name || "하객"}님이 새 경조사를 만들었어요.`;

      if (typeof Notifications.scheduleNotificationAsync === "function") {
        const permission =
          typeof Notifications.getPermissionsAsync === "function"
            ? await Notifications.getPermissionsAsync()
            : null;

        if (!permission || permission.status === "granted") {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "돌아온 경조사 알림",
              body,
              data: {
                type: "reciprocity",
                notificationId: item.id,
                originalEventId: item.original_event_id,
              },
            },
            trigger: null,
          });
        }
      }

      if (options.showAlert) {
        Alert.alert("돌아온 경조사 알림", body, [
          {
            text: "내역 보기",
            onPress: () => {
              if (item.original_event_id) {
                navigation.navigate("EventDetail", {
                  eventId: item.original_event_id,
                  initialSearchQuery:
                    item.source_guest_phone || item.source_guest_name || "",
                });
              }
            },
          },
          { text: "확인" },
        ]);
      }
    } catch (error) {
      console.warn("reciprocity local notification failed:", error);
    }
  };

  const notifyNewReciprocityItems = async (items = []) => {
    const newItems = items.filter(
      (item) =>
        item?.id &&
        !reciprocityKnownIdsRef.current.has(item.id) &&
        (!item.created_at ||
          new Date(item.created_at) >=
            new Date(reciprocityNotifyAfterRef.current)),
    );

    if (newItems.length === 0) return;

    newItems.forEach((item) => reciprocityKnownIdsRef.current.add(item.id));
    await showReciprocityLocalNotification(newItems[0], { showAlert: true });
  };

  const getReciprocitySignature = (items = []) =>
    items
      .map(
        (item) =>
          `${item.id || ""}:${item.status || ""}:${item.created_at || ""}:${item.updated_at || ""}`,
      )
      .join("|");

  const loadReciprocityNotifications = async ({
    notifyNew = false,
    silent = false,
    skipIfScrolling = false,
  } = {}) => {
    if (skipIfScrolling && isHomeScrollingRef.current) return;
    if (!silent) setReciprocityLoading(true);
    try {
      const res = await getReciprocityNotifications(currentUserId);
      if (res?.success) {
        const nextItems = res.data || [];
        const nextSignature = getReciprocitySignature(nextItems);
        if (notifyNew) {
          await notifyNewReciprocityItems(nextItems);
        } else {
          reciprocityKnownIdsRef.current = new Set(
            nextItems.map((item) => item.id).filter(Boolean),
          );
        }
        if (nextSignature !== reciprocitySignatureRef.current) {
          reciprocitySignatureRef.current = nextSignature;
          setReciprocityNotifications(nextItems);
        }
      }
    } catch (e) {
      console.error("loadReciprocityNotifications error:", e);
    } finally {
      if (!silent) setReciprocityLoading(false);
    }
  };

  const markReciprocityNotifications = async (
    notificationIds,
    status = "read",
  ) => {
    const ids = Array.isArray(notificationIds)
      ? notificationIds.filter(Boolean)
      : [notificationIds].filter(Boolean);
    if (ids.length === 0) return;

    const previous = reciprocityNotifications;
    setReciprocityNotifications((prev) =>
      status === "dismissed"
        ? prev.filter((item) => !ids.includes(item.id))
        : prev.map((item) =>
            ids.includes(item.id) ? { ...item, status } : item,
          ),
    );

    const results = await Promise.all(
      ids.map((id) =>
        updateReciprocityNotificationStatus(id, status, currentUserId),
      ),
    );

    if (results.some((res) => !res?.success)) {
      setReciprocityNotifications(previous);
    }
  };

  const getActivityNotificationSignature = (items = []) =>
    items
      .map(
        (item) =>
          `${item.id || ""}:${item.status || ""}:${item.created_at || ""}:${item.read_at || ""}`,
      )
      .join("|");

  const loadActivityNotifications = async ({ silent = false } = {}) => {
    if (!currentUserId) return;
    if (!silent) setActivityLoading(true);
    try {
      const res = await getActivityNotifications(currentUserId);
      if (res?.success) {
        const nextItems = res.data || [];
        const nextSignature = getActivityNotificationSignature(nextItems);
        if (nextSignature !== activityNotificationSignatureRef.current) {
          activityNotificationSignatureRef.current = nextSignature;
          setActivityNotifications(nextItems);
        }
      }
    } catch (error) {
      console.error("loadActivityNotifications error:", error);
    } finally {
      if (!silent) setActivityLoading(false);
    }
  };

  const markActivityNotification = async (notificationId, status = "read") => {
    if (!notificationId) return;
    const previous = activityNotifications;
    setActivityNotifications((prev) =>
      status === "dismissed"
        ? prev.filter((item) => item.id !== notificationId)
        : prev.map((item) =>
            item.id === notificationId ? { ...item, status } : item,
          ),
    );

    const result = await updateActivityNotificationStatus(
      notificationId,
      status,
      currentUserId,
    );
    if (!result?.success) {
      setActivityNotifications(previous);
    }
  };

  const getActivityNotificationIcon = (type) => {
    switch (type) {
      case "event_created":
        return "add-circle-outline";
      case "event_updated":
        return "create-outline";
      case "event_finalized":
        return "checkmark-circle-outline";
      case "event_deleted":
        return "trash-outline";
      case "credit_purchased":
        return "diamond-outline";
      case "cover_purchased":
        return "albums-outline";
      case "guestbook_reception_unlocked":
        return "qr-code-outline";
      case "guestbook_template_purchased":
        return "document-text-outline";
      case "reciprocity_marked_given":
        return "heart-circle-outline";
      case "guest_confirmed":
        return "checkmark-done-outline";
      case "guest_unconfirmed":
        return "return-down-back-outline";
      default:
        return "notifications-outline";
    }
  };

  const getActivityNotificationCategoryText = (type, category) => {
    if (category === "credit" || type === "credit_purchased") return "크레딧";
    if (category === "purchase") return "구매";
    if (category === "event") return "내 행사";
    if (category === "guestbook") return "하객 접수";
    if (category === "reciprocity") return "챙길 경조사";
    return "활동";
  };

  const openReciprocityDetail = async (item) => {
    const rawItems = item?.items?.length ? item.items : [item];
    const first = rawItems[0];
    const targetEvent =
      first?.original_event ||
      item?.original_event ||
      item?.originalEvents?.[0];
    if (!targetEvent?.id) return;

    navigation.navigate("EventDetail", {
      eventId: targetEvent.id,
      initialEvent: targetEvent,
      initialSearchQuery:
        first?.source_guest_phone ||
        first?.source_guest_name ||
        item.source_guest_phone ||
        item.source_guest_name ||
        "",
    });
  };

  const openReciprocitySheet = (item) => {
    setSelectedReciprocityGroup(item);
    setReciprocitySheetVisible(true);
    reciprocitySheetFade.setValue(0);
    requestAnimationFrame(() => {
      Animated.timing(reciprocitySheetFade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeReciprocitySheet = () => {
    Animated.timing(reciprocitySheetFade, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setReciprocitySheetVisible(false);
      setSelectedReciprocityGroup(null);
    });
  };

  const completeReciprocityGroup = async (item) => {
    if (!item) return;
    const rawItems = item?.items?.length ? item.items : [item];
    await markReciprocityNotifications(
      rawItems.map((raw) => raw.id),
      "completed",
    );
    closeReciprocitySheet();
  };

  const openNotificationCenter = () => {
    setShowNotificationCenter(true);
    loadReciprocityNotifications();
    loadActivityNotifications();
  };

  const openNotificationItem = (item) => {
    if (item?.notificationKind === "activity") {
      if (item.status === "unread") {
        markActivityNotification(item.id, "read");
      }
      setShowNotificationCenter(false);
      if (item.event_id) {
        navigation.navigate("EventDetail", { eventId: item.event_id });
      }
      return;
    }

    setShowNotificationCenter(false);
    openReciprocitySheet(item);
  };

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(groupedReciprocityNotifications.length / RECIPROCITY_PER_PAGE),
    );
    if (reciprocityPage > totalPages - 1) {
      setReciprocityPage(Math.max(0, totalPages - 1));
    }
  }, [groupedReciprocityNotifications.length, reciprocityPage]);

  const actionableReciprocityNotifications = useMemo(
    () =>
      groupedReciprocityNotifications.filter((item) => item.status === "unread"),
    [groupedReciprocityNotifications],
  );
  const visibleReciprocityNotifications = useMemo(
    () =>
      groupedReciprocityNotifications.filter(
        (item) => item.status !== "dismissed",
      ),
    [groupedReciprocityNotifications],
  );
  const reciprocityUnreadCount = actionableReciprocityNotifications.filter(
    (item) => item.status === "unread",
  ).length;
  const visibleActivityNotifications = useMemo(
    () => activityNotifications.filter((item) => item.status !== "dismissed"),
    [activityNotifications],
  );
  const activityUnreadCount = visibleActivityNotifications.filter(
    (item) => item.status === "unread",
  ).length;
  const visibleHomeNotifications = useMemo(() => {
    const reciprocityItems = visibleReciprocityNotifications.map((item) => ({
      ...item,
      notificationKind: "reciprocity",
      notificationSortAt: item.created_at,
    }));
    const activityItems = visibleActivityNotifications.map((item) => ({
      ...item,
      notificationKind: "activity",
      notificationSortAt: item.created_at,
    }));

    return [...reciprocityItems, ...activityItems].sort(
      (a, b) =>
        new Date(b.notificationSortAt || 0) -
        new Date(a.notificationSortAt || 0),
    );
  }, [visibleActivityNotifications, visibleReciprocityNotifications]);
  const homeNotificationUnreadCount =
    reciprocityUnreadCount + activityUnreadCount;
  const reciprocityTotalPages = Math.max(
    1,
    Math.ceil(visibleReciprocityNotifications.length / RECIPROCITY_PER_PAGE),
  );
  const currentReciprocityItems = visibleReciprocityNotifications.slice(
    reciprocityPage * RECIPROCITY_PER_PAGE,
    reciprocityPage * RECIPROCITY_PER_PAGE + RECIPROCITY_PER_PAGE,
  );

  useEffect(() => {
    if (!currentUserId) return;

    reciprocityRealtimeSeenRef.current = new Set();
    const channel = supabase
      .channel(`reciprocity_notifications_${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_reciprocity_notifications",
          filter: `receiver_user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const item = payload.new;
          showReciprocityLocalNotification(item, { showAlert: true });
          loadReciprocityNotifications();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_reciprocity_notifications",
          filter: `receiver_user_id=eq.${currentUserId}`,
        },
        () => {
          loadReciprocityNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    loadReciprocityNotifications({ silent: true });
    loadActivityNotifications({ silent: true });
    const intervalId = setInterval(() => {
      loadReciprocityNotifications({
        silent: true,
        skipIfScrolling: true,
      });
      loadActivityNotifications({ silent: true });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`activity_notifications_${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_activity_notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          loadActivityNotifications({ silent: true });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // 품앗이 필터 이전 버튼 핸들러
  const handlePumasiBack = () => {
    if (pumasiFilterStep === 3) {
      setPumasiFilterStep(pumasiFilterEvent?.event_type === "wedding" ? 2 : 1);
    } else if (pumasiFilterStep === 2) {
      setPumasiFilterStep(1);
    }
  };

  // 품앗이 데이터 로드 (events 로드 완료 후)
  useEffect(() => {
    if ((user?.id || userInfo?.userId) && events.length > 0) {
      if (SHOW_HOME_PUMASI_SECTION) {
        loadPumasiReceived();
        loadPumasiGave();
      }
      loadRecentGuestbookMessages();
      loadReciprocityNotifications({ silent: true });
      loadActivityNotifications({ silent: true });
    }
  }, [user?.id, userInfo?.userId, events.length]);

  const getImageUrlFromValue = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value !== "object") return null;
    return (
      value.publicUrl ||
      value.public_url ||
      value.signedUrl ||
      value.signed_url ||
      value.url ||
      value.uri ||
      value.image_url ||
      value.photo_url ||
      null
    );
  };

  const isRenderableHostedImageUri = (uri) => {
    if (typeof uri !== "string") return false;
    const value = uri.trim();
    if (!value) return false;
    return /^(https?:\/\/|file:\/\/|content:\/\/|data:image\/|asset:\/\/|ph:\/\/)/i.test(
      value,
    );
  };

  const getHostedImageIdentity = (uri) => {
    if (typeof uri !== "string") return "";
    const trimmed = uri.trim();
    if (!trimmed) return "";
    return trimmed.split("?")[0].replace(/\/+$/, "");
  };

  const normalizeHostedImageList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [trimmed];
        }
      }
      return trimmed.includes(",")
        ? trimmed.split(",").map((item) => item.trim())
        : [trimmed];
    }
    if (typeof value === "object") return [value];
    return [];
  };

  const getHostedEventAdditionalInfo = (event) => {
    if (!event?.additional_info) return {};
    if (typeof event.additional_info === "object") return event.additional_info;
    try {
      return JSON.parse(event.additional_info);
    } catch {
      return {};
    }
  };

  const getHostedEventPhotos = (event) => {
    const additionalInfo = getHostedEventAdditionalInfo(event);
    const categorized = additionalInfo?.categorized_images || {};
    const orderedCandidates = [
      ...normalizeHostedImageList(categorized.main),
      ...normalizeHostedImageList(
        event?.image_urls?.filter?.((img) => img?.category === "main"),
      ),
      ...normalizeHostedImageList(categorized.gallery),
      ...normalizeHostedImageList(
        event?.image_urls?.filter?.((img) => img?.category === "gallery"),
      ),
      ...normalizeHostedImageList(categorized.all),
      ...normalizeHostedImageList(event?.image_urls),
      event?.main_image_url,
      event?.main_photo_url,
      event?.cover_image_url,
      event?.thumbnail_url,
      event?.photo_url,
      event?.image_url,
    ];

    const seen = new Set();
    return orderedCandidates
      .map(getImageUrlFromValue)
      .filter((url) => typeof url === "string")
      .map((url) => url.trim())
      .filter(isRenderableHostedImageUri)
      .filter((url) => {
        const identity = getHostedImageIdentity(url);
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      })
      .slice(0, 3);
  };

  const getHostedFuneralPhotoStyle = (event) => {
    if (event?.event_type !== "funeral") return null;
    const additionalInfo = getHostedEventAdditionalInfo(event);
    const rawLayout =
      event?.mainPhotoLayout ||
      event?.main_photo_layout ||
      additionalInfo.main_photo_layout ||
      additionalInfo.mainPhotoLayout ||
      {};
    const scale = Number(rawLayout.scale);
    const translateX = Number(rawLayout.translateX);
    const translateY = Number(rawLayout.translateY);
    const baseWidth = Number(rawLayout.baseWidth);
    const renderScale =
      HOSTED_PHOTO_WIDTH /
      (Number.isFinite(baseWidth) && baseWidth > 0 ? baseWidth : width * 0.88);

    return {
      transform: [
        {
          translateX: Number.isFinite(translateX)
            ? translateX * renderScale
            : 0,
        },
        {
          translateY: Number.isFinite(translateY)
            ? translateY * renderScale
            : 0,
        },
        {
          scale: Number.isFinite(scale) ? Math.min(3, Math.max(0.25, scale)) : 1,
        },
      ],
    };
  };

  const getHostedFuneralFrameKey = (event) => {
    if (event?.event_type !== "funeral") return null;
    const additionalInfo = getHostedEventAdditionalInfo(event);
    const frame =
      additionalInfo.photo_frame ||
      additionalInfo.photoFrame ||
      event?.photo_frame ||
      event?.photoFrame ||
      {};
    return frame.key || frame.id || event?.photoFrameKey || null;
  };

  const getHostedFuneralFrameSource = (event) => {
    if (event?.event_type !== "funeral") return null;
    const frameKey = getHostedFuneralFrameKey(event);
    return (
      FUNERAL_HOME_FRAME_SOURCES[frameKey] ||
      FUNERAL_HOME_FRAME_SOURCES["funeral-template-modern-card"]
    );
  };

  const getHostedPhotoFrameHeight = (event) => {
    if (event?.event_type !== "funeral") return HOSTED_PHOTO_HEIGHT;
    const frameKey = getHostedFuneralFrameKey(event);
    const aspectRatio =
      FUNERAL_HOME_FRAME_ASPECT_RATIOS[frameKey] ||
      FUNERAL_HOME_FRAME_ASPECT_RATIOS["funeral-template-modern-card"];
    return Math.round(HOSTED_PHOTO_WIDTH / aspectRatio);
  };

  const handleHostedPhotoScroll = (eventId, nativeEvent) => {
    const nextIndex = Math.round(
      nativeEvent.contentOffset.x / HOSTED_PHOTO_WIDTH,
    );
    setHostedPhotoPageByEventIds((prev) => {
      if (prev[eventId] === nextIndex) return prev;
      return {
        ...prev,
        [eventId]: nextIndex,
      };
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 헤더 - Toss 스타일 */}
      <View style={styles.header}>
        <View style={styles.headerLogoSpot}>
          <Image
            source={JEONGDAM_LOGO}
            style={styles.headerLogoLarge}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>정담</Text>
            <Text style={styles.headerGreeting} numberOfLines={1}>
              {userName}님, 안녕하세요
            </Text>
          </View>
          <View style={styles.headerCreditRow}>
            <View style={styles.headerCreditChip}>
              <Ionicons name="diamond" size={15} color="#2F80ED" />
              <Text style={styles.headerCreditText} numberOfLines={1}>
                {eventCreationCreditState.balance} 크레딧
              </Text>
            </View>
            <View
              style={[styles.headerCreditChip, styles.headerCreditChipWarm]}
            >
              <Ionicons name="gift" size={15} color="#7C3AED" />
              <Text
                style={[styles.headerCreditText, styles.headerCreditTextWarm]}
                numberOfLines={1}
              >
                무료 {eventCreationCreditState.freeRemaining}회
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerNotificationButton}
          onPress={openNotificationCenter}
          activeOpacity={0.78}
          accessibilityLabel="알림"
        >
          <Ionicons name="notifications-outline" size={21} color="#4E5968" />
          {homeNotificationUnreadCount > 0 && (
            <View style={styles.headerNotificationDot} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        removeClippedSubviews={Platform.OS === "android"}
        onScrollBeginDrag={markHomeScrollActive}
        onScrollEndDrag={markHomeScrollIdleSoon}
        onMomentumScrollBegin={markHomeScrollActive}
        onMomentumScrollEnd={markHomeScrollIdleSoon}
      >
        {/* 배너 캐러셀 */}
        <View style={styles.welcomeSection}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / bannerWidth,
              );
              if (idx !== currentSlide) setCurrentSlide(idx);
            }}
          >
            {banners.map((banner, idx) => (
              <View key={idx} style={styles.welcomeSlide}>
                <ImageBackground
                  source={isTablet ? banner.tabletImage : banner.mobileImage}
                  style={[
                    styles.welcomeCard,
                    isTablet
                      ? styles.welcomeCardTablet
                      : styles.welcomeCardMobile,
                    styles.welcomeImageCard,
                  ]}
                  imageStyle={styles.welcomeCardBackgroundImage}
                  resizeMode="cover"
                  fadeDuration={0}
                >
                  <View style={styles.welcomeTextLayer}>
                    <Text style={styles.welcomeTitle}>{banner.title}</Text>
                  </View>
                </ImageBackground>
              </View>
            ))}
          </ScrollView>

          {/* 인디케이터 */}
          <View style={styles.slideIndicator}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, currentSlide === index && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        {/* 경조사 만들기 - Toss 스타일 카드 그리드 */}
        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>경조사 만들기</Text>
          <Text style={styles.sectionSubtitle}>소중한 순간을 기록해보세요</Text>
          <View
            ref={quickGridRef}
            style={styles.quickGrid}
            onLayout={() => {
              if (quickGridRef.current?.measureInWindow) {
                quickGridRef.current.measureInWindow((x, y, width, height) => {
                  registerTarget("homeCreateSection", { x, y, width, height });
                });
              }
            }}
          >
            <TouchableOpacity
              style={[
                styles.quickItem,
                eventCreationFlowLocked && styles.quickItemDisabled,
              ]}
              onPress={() => handleEventCreationIntent("wedding")}
              disabled={eventCreationFlowLocked}
            >
              <Image
                source={RECIPROCITY_EVENT_ICONS.wedding}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
                fadeDuration={0}
              />
              <Text style={styles.quickTitle}>청첩장</Text>
              <Text style={styles.quickSubtitle}>
                행복한 결혼 소식을 전해보세요
              </Text>
              <TouchableOpacity
                ref={weddingMakeBtnRef}
                style={[
                  styles.quickButton,
                  { backgroundColor: Colors.wedding },
                  eventCreationFlowLocked && styles.quickButtonDisabled,
                ]}
                onPress={() => handleEventCreationIntent("wedding")}
                disabled={eventCreationFlowLocked}
              >
                <Text style={styles.quickButtonText}>만들기</Text>
              </TouchableOpacity>
              <View style={styles.quickTypeIndicator}>
                <Text style={styles.quickTypeText}>경사</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickItem,
                eventCreationFlowLocked && styles.quickItemDisabled,
              ]}
              onPress={() => handleEventCreationIntent("funeral")}
              disabled={eventCreationFlowLocked}
            >
              <Image
                source={RECIPROCITY_EVENT_ICONS.funeral}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
                fadeDuration={0}
              />
              <Text style={styles.quickTitle}>부고장</Text>
              <Text style={styles.quickSubtitle}>
                슬픈 소식을 정중하게 전달하세요
              </Text>
              <TouchableOpacity
                ref={funeralMakeBtnRef}
                style={[
                  styles.quickButton,
                  { backgroundColor: Colors.funeral },
                  eventCreationFlowLocked && styles.quickButtonDisabled,
                ]}
                onPress={() => handleEventCreationIntent("funeral")}
                disabled={eventCreationFlowLocked}
              >
                <Text style={styles.quickButtonText}>만들기</Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.quickTypeIndicator,
                  { backgroundColor: Colors.funeral },
                ]}
              >
                <Text style={[styles.quickTypeText, { color: Colors.white }]}>
                  조사
                </Text>
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
              style={[
                styles.tabButton,
                selectedTab === "active" && styles.activeTabButton,
              ]}
              onPress={() => {
                setSelectedTab("active");
                setHostedEventPage(0);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "active" && styles.activeTabText,
                ]}
              >
                진행중 ({activeEventsFiltered.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "completed" && styles.activeTabButton,
              ]}
              onPress={() => {
                setSelectedTab("completed");
                setHostedEventPage(0);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "completed" && styles.activeTabText,
                ]}
              >
                최근 완료 ({completedEventsFiltered.length})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hostedSortBar}>
            <View style={styles.hostedSortGroup}>
              <TouchableOpacity
                style={[
                  styles.hostedSortChip,
                  hostedSortBy === "eventDate" && styles.hostedSortChipActive,
                ]}
                onPress={() => handleHostedSortByPress("eventDate")}
                activeOpacity={0.78}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={hostedSortBy === "eventDate" ? "#191F28" : "#8B95A1"}
                />
                <Text
                  style={[
                    styles.hostedSortChipText,
                    hostedSortBy === "eventDate" &&
                      styles.hostedSortChipTextActive,
                  ]}
                >
                  행사일
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.hostedSortChip,
                  hostedSortBy === "createdAt" && styles.hostedSortChipActive,
                ]}
                onPress={() => handleHostedSortByPress("createdAt")}
                activeOpacity={0.78}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={hostedSortBy === "createdAt" ? "#191F28" : "#8B95A1"}
                />
                <Text
                  style={[
                    styles.hostedSortChipText,
                    hostedSortBy === "createdAt" &&
                      styles.hostedSortChipTextActive,
                  ]}
                >
                  생성일
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.hostedSortOrderButton}
              onPress={toggleHostedSortOrder}
              activeOpacity={0.78}
            >
              <Ionicons
                name={hostedSortOrder === "desc" ? "arrow-down" : "arrow-up"}
                size={14}
                color="#4E5968"
              />
              <Text style={styles.hostedSortOrderText}>
                {hostedSortOrder === "desc" ? "내림차순" : "오름차순"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 이벤트 리스트 */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <LottieLoading size={72} />
            </View>
          ) : currentEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {currentEvents.map((event) => {
                const eventGuestbookMessages = getRecentGuestbookForEvent(
                  event.id,
                );
                const guestbookExpanded = !!expandedGuestbookEventIds[event.id];
                const guestbookTotalPages = Math.max(
                  1,
                  Math.ceil(
                    eventGuestbookMessages.length / EVENT_GUESTBOOK_PER_PAGE,
                  ),
                );
                const guestbookPage = Math.min(
                  guestbookPageByEventIds[event.id] || 0,
                  guestbookTotalPages - 1,
                );
                const pagedGuestbookMessages = eventGuestbookMessages.slice(
                  guestbookPage * EVENT_GUESTBOOK_PER_PAGE,
                  guestbookPage * EVENT_GUESTBOOK_PER_PAGE +
                    EVENT_GUESTBOOK_PER_PAGE,
                );
                const hostedPhotos = getHostedEventPhotos(event);
                const hostedPhotoPage = Math.min(
                  hostedPhotoPageByEventIds[event.id] || 0,
                  Math.max(0, hostedPhotos.length - 1),
                );
                const hostedPhotoFrameHeight = getHostedPhotoFrameHeight(event);
                const hostedFuneralPhotoStyle =
                  getHostedFuneralPhotoStyle(event);
                const hostedFuneralFrameSource =
                  getHostedFuneralFrameSource(event);

                return (
                  <View key={event.id} style={styles.eventCardNew}>
                    <View style={styles.eventCardShowcase}>
                      <View style={styles.eventPhotoColumn}>
                        <View style={styles.eventPhotoBadgeRow}>
                          <View
                            style={[
                              styles.eventPhotoTypeBadge,
                              event.event_type === "funeral" &&
                                styles.eventPhotoTypeBadgeFuneral,
                            ]}
                          >
                            <Text style={styles.eventPhotoTypeText}>
                              {getEventTypeText(event.event_type)}
                            </Text>
                          </View>
                          {getDDay(getEventDisplayDate(event)) && (
                            <View style={styles.eventPhotoDdayBadge}>
                              <Text style={styles.eventPhotoDdayText}>
                                {getDDay(getEventDisplayDate(event))}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View
                          style={[
                            styles.eventPhotoStage,
                            { height: hostedPhotoFrameHeight },
                          ]}
                        >
                          {hostedPhotos.length > 0 ? (
                            <ScrollView
                              horizontal
                              pagingEnabled
                              nestedScrollEnabled
                              directionalLockEnabled
                              disableIntervalMomentum
                              showsHorizontalScrollIndicator={false}
                              scrollEventThrottle={32}
                              onMomentumScrollEnd={(scrollEvent) =>
                                handleHostedPhotoScroll(
                                  event.id,
                                  scrollEvent.nativeEvent,
                                )
                              }
                            >
                              {hostedPhotos.map((photoUrl, photoIndex) => (
                                event.event_type === "funeral" ? (
                                  <View
                                    key={`${event.id}-photo-${photoIndex}`}
                                    style={[
                                      styles.eventHeroPhotoFrame,
                                      { height: hostedPhotoFrameHeight },
                                    ]}
                                  >
                                    <Image
                                      source={{ uri: photoUrl }}
                                      style={[
                                        styles.eventHeroPhoto,
                                        { height: hostedPhotoFrameHeight },
                                        hostedFuneralPhotoStyle,
                                      ]}
                                      resizeMode="cover"
                                      resizeMethod="resize"
                                      progressiveRenderingEnabled
                                      fadeDuration={0}
                                    />
                                    <Image
                                      source={hostedFuneralFrameSource}
                                      style={[
                                        styles.eventFuneralFrameImage,
                                        { height: hostedPhotoFrameHeight },
                                      ]}
                                      resizeMode="cover"
                                      fadeDuration={0}
                                    />
                                  </View>
                                ) : (
                                  <Image
                                    key={`${event.id}-photo-${photoIndex}`}
                                    source={{ uri: photoUrl }}
                                    style={[
                                      styles.eventHeroPhoto,
                                      { height: hostedPhotoFrameHeight },
                                    ]}
                                    resizeMode="cover"
                                    resizeMethod="resize"
                                    progressiveRenderingEnabled
                                    fadeDuration={0}
                                  />
                                )
                              ))}
                            </ScrollView>
                          ) : (
                            <View
                              style={[
                                styles.eventHeroPlaceholder,
                                { height: hostedPhotoFrameHeight },
                              ]}
                            >
                              <Image
                                source={
                                  event.event_type === "funeral"
                                    ? RECIPROCITY_EVENT_ICONS.funeral
                                    : RECIPROCITY_EVENT_ICONS.wedding
                                }
                                style={styles.eventHeroPlaceholderIcon}
                                resizeMode="contain"
                                fadeDuration={0}
                              />
                            </View>
                          )}

                          {hostedPhotos.length > 1 && (
                            <View style={styles.eventPhotoDots}>
                              {hostedPhotos.map((_, photoIndex) => (
                                <View
                                  key={`${event.id}-photo-dot-${photoIndex}`}
                                  style={[
                                    styles.eventPhotoDot,
                                    photoIndex === hostedPhotoPage &&
                                      styles.eventPhotoDotActive,
                                  ]}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.eventCardInfo}
                        onPress={() => handleActiveEventPress(event)}
                        activeOpacity={0.82}
                      >
                        <View style={styles.eventDatePill}>
                          <Ionicons
                            name="calendar-outline"
                            size={13}
                            color="#2F80ED"
                          />
                          <Text
                            style={styles.eventDatePillText}
                            numberOfLines={1}
                          >
                            {formatDateWithTime(
                              getEventDisplayDate(event),
                              getEventDisplayTime(event),
                            )}
                          </Text>
                        </View>

                        <Text style={styles.eventCardTitle} numberOfLines={2}>
                          {event.event_name || event.title}
                        </Text>
                        <View style={styles.eventCardLocationRow}>
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color="#8B95A1"
                          />
                          <Text
                            style={styles.eventCardLocation}
                            numberOfLines={1}
                          >
                            {getEventDisplayLocation(event)}
                          </Text>
                        </View>

                        <View style={styles.eventCardStatsBar}>
                          <View style={styles.eventCardStatBlock}>
                            <Text style={styles.eventCardStatValue}>
                              {event.total_contributions || 0}명
                            </Text>
                            <Text style={styles.eventCardStatLabel}>참여</Text>
                          </View>
                          <View style={styles.eventCardStatDivider} />
                          <View style={styles.eventCardStatBlock}>
                            <Text style={styles.eventCardStatValue}>
                              {event.total_amount
                                ? event.total_amount >= 10000
                                  ? `${Math.floor(event.total_amount / 10000).toLocaleString()}만원`
                                  : `${event.total_amount.toLocaleString()}원`
                                : "0원"}
                            </Text>
                            <Text style={styles.eventCardStatLabel}>
                              총 부조금
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {selectedTab === "active" &&
                      event.status === "active" && (
                        <TouchableOpacity
                          style={styles.hostedEditButton}
                          onPress={() => openHostedEventEdit(event)}
                          activeOpacity={0.82}
                        >
                          <Ionicons
                            name="create-outline"
                            size={16}
                            color="#2F80ED"
                          />
                          <Text style={styles.hostedEditButtonText}>
                            {event.event_type === "funeral"
                              ? "부고장 정보 수정"
                              : "청첩장 정보 수정"}
                          </Text>
                        </TouchableOpacity>
                      )}

                    {eventGuestbookMessages.length > 0 && (
                      <View
                        style={[
                          styles.eventGuestbookPanel,
                          guestbookExpanded && styles.eventGuestbookPanelOpen,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.eventGuestbookToggle}
                          onPress={() => toggleGuestbookForEvent(event.id)}
                          activeOpacity={0.78}
                        >
                          <View style={styles.eventGuestbookToggleLeft}>
                            <View style={styles.eventGuestbookToggleIcon}>
                              <Ionicons
                                name="chatbubble-ellipses"
                                size={17}
                                color="#3182F6"
                              />
                            </View>
                            <Text style={styles.eventGuestbookToggleText}>
                              새 방명록 {eventGuestbookMessages.length}개
                            </Text>
                          </View>
                          <Ionicons
                            name={
                              guestbookExpanded ? "chevron-up" : "chevron-down"
                            }
                            size={18}
                            color="#8B95A1"
                          />
                        </TouchableOpacity>

                        {guestbookExpanded && (
                          <View style={styles.eventGuestbookMessages}>
                            {pagedGuestbookMessages.map((messageItem) => (
                              <View
                                key={messageItem.id}
                                style={styles.eventGuestbookMessageRow}
                              >
                                <View style={styles.eventGuestbookMessageBody}>
                                  <Text
                                    style={styles.eventGuestbookMessageName}
                                    numberOfLines={1}
                                  >
                                    {messageItem.guest_name || "익명"}
                                  </Text>
                                  <Text
                                    style={styles.eventGuestbookMessageText}
                                    numberOfLines={2}
                                  >
                                    {messageItem.message}
                                  </Text>
                                  <Text
                                    style={styles.eventGuestbookMessageDate}
                                  >
                                    {formatDate(messageItem.created_at)}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={styles.eventGuestbookDeleteButton}
                                  onPress={() =>
                                    handleDeleteGuestbookMessage(messageItem)
                                  }
                                  activeOpacity={0.78}
                                  accessibilityLabel="방명록 삭제"
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={16}
                                    color="#EF4444"
                                  />
                                </TouchableOpacity>
                              </View>
                            ))}

                            {guestbookTotalPages > 1 && (
                              <View style={styles.eventGuestbookPagination}>
                                <TouchableOpacity
                                  style={[
                                    styles.eventGuestbookPageButton,
                                    guestbookPage === 0 &&
                                      styles.eventGuestbookPageButtonDisabled,
                                  ]}
                                  activeOpacity={0.78}
                                  disabled={guestbookPage === 0}
                                  onPress={() =>
                                    setGuestbookPageForEvent(
                                      event.id,
                                      guestbookPage - 1,
                                      guestbookTotalPages,
                                    )
                                  }
                                >
                                  <Ionicons
                                    name="chevron-back"
                                    size={16}
                                    color={
                                      guestbookPage === 0
                                        ? "#CBD5E1"
                                        : "#6D28D9"
                                    }
                                  />
                                </TouchableOpacity>
                                <Text style={styles.eventGuestbookPageText}>
                                  {guestbookPage + 1} / {guestbookTotalPages}
                                </Text>
                                <TouchableOpacity
                                  style={[
                                    styles.eventGuestbookPageButton,
                                    guestbookPage >= guestbookTotalPages - 1 &&
                                      styles.eventGuestbookPageButtonDisabled,
                                  ]}
                                  activeOpacity={0.78}
                                  disabled={
                                    guestbookPage >= guestbookTotalPages - 1
                                  }
                                  onPress={() =>
                                    setGuestbookPageForEvent(
                                      event.id,
                                      guestbookPage + 1,
                                      guestbookTotalPages,
                                    )
                                  }
                                >
                                  <Ionicons
                                    name="chevron-forward"
                                    size={16}
                                    color={
                                      guestbookPage >= guestbookTotalPages - 1
                                        ? "#CBD5E1"
                                        : "#6D28D9"
                                    }
                                  />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {hostedTotalPages > 1 && (
                <View style={styles.hostedPaginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.hostedPaginationArrow,
                      safeHostedEventPage === 0 &&
                        styles.hostedPaginationArrowDisabled,
                    ]}
                    onPress={() => {
                      setHostedEventPage((page) => Math.max(0, page - 1));
                    }}
                    disabled={safeHostedEventPage === 0}
                    activeOpacity={0.72}
                    accessibilityLabel="이전 경조사 목록"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={17}
                      color={
                        safeHostedEventPage === 0
                          ? "#D1D6DC"
                          : "#4E5968"
                      }
                    />
                  </TouchableOpacity>

                  <View style={styles.hostedPaginationDots}>
                    {Array.from({ length: hostedTotalPages }).map(
                      (_, pageIndex) => (
                        <TouchableOpacity
                          key={`hosted-event-page-${pageIndex}`}
                          style={styles.hostedPaginationDotHitSlop}
                          onPress={() => setHostedEventPage(pageIndex)}
                          activeOpacity={0.7}
                          accessibilityLabel={`${pageIndex + 1}번째 경조사 목록`}
                        >
                          <View
                            style={[
                              styles.hostedPaginationDot,
                              pageIndex === safeHostedEventPage &&
                                styles.hostedPaginationDotActive,
                            ]}
                          />
                        </TouchableOpacity>
                      ),
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.hostedPaginationArrow,
                      safeHostedEventPage === hostedTotalPages - 1 &&
                        styles.hostedPaginationArrowDisabled,
                    ]}
                    onPress={() => {
                      setHostedEventPage((page) =>
                        Math.min(hostedTotalPages - 1, page + 1),
                      );
                    }}
                    disabled={safeHostedEventPage === hostedTotalPages - 1}
                    activeOpacity={0.72}
                    accessibilityLabel="다음 경조사 목록"
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={
                        safeHostedEventPage === hostedTotalPages - 1
                          ? "#D1D6DC"
                          : "#4E5968"
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={Colors.gray300}
              />
              <Text style={styles.emptyTitle}>
                {selectedTab === "active"
                  ? "진행중인 경조사가 없어요"
                  : "완료된 경조사가 없어요"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === "active"
                  ? "첫 번째 경조사를 만들어보세요"
                  : "첫 번째 경조사를 완료해보세요"}
              </Text>
              {selectedTab === "active" && (
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

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 위젯 1: 품앗이 장부 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.homeSectionDivider} />

        {/* ━━━━━━━━━━━━━━━━ 돌아온 경조사 ━━━━━━━━━━━━━━━━ */}
        <View style={styles.reciprocitySection}>
          <View style={styles.reciprocityHeader}>
            <Text style={styles.reciprocityTitle}>챙길 경조사</Text>
            <TouchableOpacity
              style={styles.reciprocityHeaderAction}
              onPress={() => navigation.navigate("Reciprocity")}
              activeOpacity={0.78}
            >
              <Text style={styles.reciprocityUnreadText}>전체 보기</Text>
              <Ionicons name="chevron-forward" size={18} color="#6B7684" />
            </TouchableOpacity>
          </View>

          {visibleReciprocityNotifications.length === 0 ? (
            <TouchableOpacity
              style={styles.reciprocityEmptyCard}
              onPress={() => navigation.navigate("Reciprocity")}
              activeOpacity={0.82}
            >
              <View style={styles.reciprocityEmptyIcon}>
                <Ionicons
                  name="heart-circle-outline"
                  size={30}
                  color="#3182F6"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reciprocityEmptyTitle}>
                  아직 챙길 경조사가 없어요
                </Text>
                <Text style={styles.reciprocityEmptyText}>
                  챙긴 내역과 새 소식을 전체 보기에서 확인할 수 있어요.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#B0B8C1" />
            </TouchableOpacity>
          ) : (
            <View style={styles.reciprocityList}>
              {visibleReciprocityNotifications.slice(0, 1).map((item) => {
                const originalEvents = item.originalEvents || [];
                const newEvents = item.newEvents || [];
                const latestNewEvent = newEvents[0] || item.new_event || {};
                const originalEventCount =
                  originalEvents.length || item.items?.length || 1;
                const firstOriginalEvent =
                  originalEvents[0] || item.original_event || {};
                const isUnread = item.status === "unread";
                const isCompleted = item.status === "completed";
                const displayGuestName = getReciprocityDisplayName(
                  item,
                  latestNewEvent,
                );
                const newEventDate = formatDateWithTime(
                  latestNewEvent.event_date,
                  latestNewEvent.event_time || latestNewEvent.ceremony_time,
                );
                const recentAmount =
                  firstOriginalEvent.amount ||
                  item.source_amount_max ||
                  item.source_amount_total ||
                  0;
                const eventTypeLabel = getEventTypeText(
                  latestNewEvent.event_type,
                );

                return (
                  <TouchableOpacity
                    key={item.groupKey || item.id}
                    style={[
                      styles.reciprocityCard,
                      isUnread && styles.reciprocityCardUnread,
                    ]}
                    onPress={() => openReciprocitySheet(item)}
                    activeOpacity={0.84}
                  >
                    <View style={styles.reciprocityCardTop}>
                      <View style={styles.reciprocityAvatar}>
                        <Text style={styles.reciprocityAvatarText}>
                          {(displayGuestName || "?").charAt(0)}
                        </Text>
                        <View style={styles.reciprocityAvatarBadge}>
                          <Ionicons name="heart" size={11} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.reciprocityCardContent}>
                        <Text
                          style={styles.reciprocityCardTitle}
                          numberOfLines={1}
                        >
                          {displayGuestName}님이 새 경조사를 만들었어요
                        </Text>
                        <Text
                          style={styles.reciprocityCardSub}
                          numberOfLines={1}
                        >
                          내 행사에{" "}
                          <Text style={styles.reciprocityAmountText}>
                            {formatAmount(recentAmount)}
                          </Text>{" "}
                          접수한 기록이 있어요
                        </Text>
                        <Text
                          style={styles.reciprocityEventDateText}
                          numberOfLines={1}
                        >
                          {newEventDate}
                        </Text>
                        <View style={styles.reciprocityChipRow}>
                          <View style={styles.reciprocityChipPrimary}>
                            <Text style={styles.reciprocityChipPrimaryText}>
                              {eventTypeLabel}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.reciprocityChipMuted,
                              isCompleted && styles.reciprocityChipDone,
                            ]}
                          >
                            <Text
                              style={[
                                styles.reciprocityChipMutedText,
                                isCompleted &&
                                  styles.reciprocityChipDoneText,
                              ]}
                            >
                              {isCompleted ? "챙김 완료" : "확인 필요"}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.reciprocityCardChevron}>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#4E5968"
                        />
                      </View>
                    </View>

                    <View style={styles.reciprocitySummaryBar}>
                      <View style={styles.reciprocitySummaryItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={17}
                          color="#8B95A1"
                        />
                        <Text style={styles.reciprocitySummaryLabel}>
                          이전에 참석한 행사
                        </Text>
                        <Text style={styles.reciprocitySummaryValue}>
                          {originalEventCount}건
                        </Text>
                      </View>
                      <View style={styles.reciprocitySummaryDivider} />
                      <View style={styles.reciprocitySummaryItem}>
                        <Ionicons
                          name="card-outline"
                          size={17}
                          color="#8B95A1"
                        />
                        <Text style={styles.reciprocitySummaryLabel}>
                          최근 접수
                        </Text>
                        <Text style={styles.reciprocitySummaryValue}>
                          {formatAmount(recentAmount)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {thankYouReadyEvents.length > 0 && (
          <View style={styles.thankHomeSection}>
            <TouchableOpacity
              style={styles.thankHomeCard}
              onPress={() => navigation.navigate("ThankYouMessages")}
              activeOpacity={0.84}
            >
              <View style={styles.thankHomeIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={24}
                  color="#2563EB"
                />
              </View>
              <View style={styles.thankHomeTextBox}>
                <Text style={styles.thankHomeTitle}>감사 인사 보내기</Text>
                <Text style={styles.thankHomeSubtitle}>
                  확정된 행사 하객에게 감사 인사를 전해요
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B0B8C1" />
            </TouchableOpacity>
          </View>
        )}

        {/* ━━━━━━━━━━━━━━━━ 품앗이 장부 ━━━━━━━━━━━━━━━━ */}
        {SHOW_HOME_PUMASI_SECTION && (
        <View style={styles.pmSection}>
          {/* 헤더 */}
          <View style={styles.pmHeader}>
            <Text style={styles.pmHeaderTitle}>품앗이 장부</Text>
            {pumasiTab === "gave" && (
              <TouchableOpacity
                style={styles.pmAddBtn}
                onPress={() => setShowPumasiAddModal(true)}
              >
                <Ionicons name="add" size={14} color="#3182F6" />
                <Text style={styles.pmAddBtnText}>기록</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 요약 카드 */}
          {(() => {
            const isFiltered = !!(
              pumasiFilterEvent ||
              pumasiFilterSide ||
              pumasiFilterRelation
            );
            // 받은 금액: 줬음 여부 무관하게 필터 조건만 적용한 총액
            const receivedAmount = filteredPumasiReceivedAll.reduce(
              (s, i) => s + (i.amount || 0),
              0,
            );
            // 낸 금액: 필터된 받음 항목과 linked된 줬음 합계 (필터 없으면 전체)
            const filteredGaveAmount = isFiltered
              ? pumasiGave
                  .filter((g) =>
                    filteredPumasiReceivedAll.some(
                      (r) => r.id === g.linked_guest_id,
                    ),
                  )
                  .reduce((s, i) => s + (i.amount || 0), 0)
              : pumasiGave.reduce((s, i) => s + (i.amount || 0), 0);
            return (
              <View style={styles.pmSummaryCard}>
                <View style={styles.pmSummaryItem}>
                  <Text style={styles.pmSummaryLabel}>
                    {isFiltered
                      ? pumasiFilterEvent?.event_name || "필터"
                      : "전체"}{" "}
                    받은 금액
                  </Text>
                  <Text style={styles.pmSummaryAmount}>
                    {receivedAmount.toLocaleString()}원
                  </Text>
                </View>
                <View style={styles.pmSummaryDivider} />
                <View style={styles.pmSummaryItem}>
                  <Text style={styles.pmSummaryLabel}>
                    {isFiltered
                      ? pumasiFilterEvent?.event_name || "필터"
                      : "전체"}{" "}
                    낸 금액
                  </Text>
                  <Text style={[styles.pmSummaryAmount, { color: "#FF3B30" }]}>
                    {filteredGaveAmount.toLocaleString()}원
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* 탭 */}
          <View style={styles.pmTabRow}>
            <TouchableOpacity
              style={[
                styles.pmTab,
                pumasiTab === "received" && styles.pmTabActive,
              ]}
              onPress={() => {
                setPumasiTab("received");
                setPumasiReceivedPage(0);
              }}
            >
              <Text
                style={[
                  styles.pmTabText,
                  pumasiTab === "received" && styles.pmTabTextActive,
                ]}
              >
                받음
                {pumasiReceived.length > 0 ? ` ${pumasiReceived.length}` : ""}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pmTab, pumasiTab === "gave" && styles.pmTabActive]}
              onPress={() => {
                setPumasiTab("gave");
                setPumasiGavePage(0);
              }}
            >
              <Text
                style={[
                  styles.pmTabText,
                  pumasiTab === "gave" && styles.pmTabTextActive,
                ]}
              >
                줬음{pumasiGave.length > 0 ? ` ${pumasiGave.length}` : ""}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 받음 탭 ── */}
          {pumasiTab === "received" && (
            <View style={styles.pmCard}>
              {/* 필터 바 */}
              {(() => {
                const isFiltered = !!(
                  pumasiFilterEvent ||
                  pumasiFilterSide ||
                  pumasiFilterRelation
                );
                return (
                  <View style={styles.pmFilterBar}>
                    <TouchableOpacity
                      style={[
                        styles.pmFilterBtn,
                        isFiltered && styles.pmFilterBtnActive,
                      ]}
                      onPress={() => {
                        setPumasiFilterStep(1);
                        setShowPumasiFilterSheet(true);
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="options"
                        size={15}
                        color={isFiltered ? "#3182F6" : "#4E5968"}
                      />
                      <Text
                        style={[
                          styles.pmFilterBtnText,
                          isFiltered && styles.pmFilterBtnTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {isFiltered
                          ? `${pumasiFilterEvent?.event_name || ""}${pumasiFilterSide ? " · " + koreanCat(pumasiFilterSide) : ""}${pumasiFilterRelation ? " · " + koreanDet(pumasiFilterRelation) : ""}`
                          : "필터로 보기"}
                      </Text>
                      {!isFiltered && (
                        <Ionicons
                          name="chevron-down"
                          size={13}
                          color="#8B95A1"
                        />
                      )}
                    </TouchableOpacity>
                    {isFiltered && (
                      <TouchableOpacity
                        style={styles.pmFilterClearBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => {
                          setPumasiFilterEvent(null);
                          setPumasiFilterSide(null);
                          setPumasiFilterRelation(null);
                          setPumasiReceivedPage(0);
                        }}
                      >
                        <Text style={styles.pmFilterClearText}>초기화</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}

              {filteredPumasiReceived.length === 0 ? (
                <View style={styles.pmEmpty}>
                  <Ionicons name="wallet-outline" size={32} color="#D1D6DB" />
                  <Text style={styles.pmEmptyText}>
                    아직 받은 내역이 없어요
                  </Text>
                </View>
              ) : (
                <>
                  {filteredPumasiReceived
                    .slice(
                      pumasiReceivedPage * PUMASI_PER_PAGE,
                      (pumasiReceivedPage + 1) * PUMASI_PER_PAGE,
                    )
                    .map((item, idx) => (
                      <View
                        key={item.id}
                        style={[
                          styles.pmRow,
                          idx < PUMASI_PER_PAGE - 1 && styles.pmRowBorder,
                        ]}
                      >
                        {/* 아바타 */}
                        <View style={styles.pmAvatar}>
                          <Text style={styles.pmAvatarText}>
                            {(item.guest_name || "?").charAt(0)}
                          </Text>
                        </View>

                        {/* 이름 + 관계 */}
                        <View style={styles.pmRowInfo}>
                          <Text style={styles.pmRowName}>
                            {item.guest_name}
                          </Text>
                          <Text style={styles.pmRowSub}>
                            {item.event_name}
                            {item.relation_category
                              ? ` · ${koreanCat(item.relation_category)}`
                              : ""}
                            {item.relation_detail
                              ? ` ${koreanDet(item.relation_detail)}`
                              : ""}
                          </Text>
                        </View>

                        {/* 금액 + 줬음기록 */}
                        <View style={styles.pmRowRight}>
                          <Text style={styles.pmRowAmount}>
                            +{Number(item.amount || 0).toLocaleString()}원
                          </Text>
                          <TouchableOpacity
                            style={styles.pmGaveBtn}
                            onPress={() => {
                              setPumasiGaveForm({
                                recipient_name: item.guest_name,
                                amount: String(item.amount || ""),
                                occasion:
                                  item.event_type === "wedding"
                                    ? "결혼"
                                    : "장례",
                                event_date: new Date()
                                  .toISOString()
                                  .split("T")[0],
                                linked_guest_id: item.id,
                              });
                              setShowPumasiGaveSheet(true);
                            }}
                          >
                            <Text style={styles.pmGaveBtnText}>줬음 기록</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                  {/* 페이지네이션 */}
                  {(() => {
                    const totalPages = Math.ceil(
                      filteredPumasiReceived.length / PUMASI_PER_PAGE,
                    );
                    return (
                      totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                          <TouchableOpacity
                            style={[
                              styles.paginationButton,
                              pumasiReceivedPage === 0 &&
                                styles.paginationButtonDisabled,
                            ]}
                            disabled={pumasiReceivedPage === 0}
                            onPress={() => setPumasiReceivedPage((p) => p - 1)}
                          >
                            <Ionicons
                              name="chevron-back"
                              size={20}
                              color={
                                pumasiReceivedPage === 0
                                  ? Colors.gray300
                                  : Colors.primary
                              }
                            />
                          </TouchableOpacity>
                          <View style={styles.paginationDots}>
                            {[...Array(totalPages)].map((_, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.paginationDot,
                                  index === pumasiReceivedPage &&
                                    styles.paginationDotActive,
                                ]}
                                onPress={() => setPumasiReceivedPage(index)}
                              />
                            ))}
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.paginationButton,
                              pumasiReceivedPage >= totalPages - 1 &&
                                styles.paginationButtonDisabled,
                            ]}
                            disabled={pumasiReceivedPage >= totalPages - 1}
                            onPress={() => setPumasiReceivedPage((p) => p + 1)}
                          >
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={
                                pumasiReceivedPage >= totalPages - 1
                                  ? Colors.gray300
                                  : Colors.primary
                              }
                            />
                          </TouchableOpacity>
                        </View>
                      )
                    );
                  })()}
                </>
              )}
            </View>
          )}

          {/* ── 줬음 탭 ── */}
          {pumasiTab === "gave" && (
            <View style={styles.pmCard}>
              {pumasiGave.length === 0 ? (
                <View style={styles.pmEmpty}>
                  <Ionicons
                    name="arrow-redo-outline"
                    size={32}
                    color="#D1D6DB"
                  />
                  <Text style={styles.pmEmptyText}>기록된 내역이 없어요</Text>
                  <Text style={styles.pmEmptySubText}>
                    위 + 기록 버튼으로 추가해보세요
                  </Text>
                </View>
              ) : (
                <>
                  {pumasiGave
                    .slice(
                      pumasiGavePage * PUMASI_PER_PAGE,
                      (pumasiGavePage + 1) * PUMASI_PER_PAGE,
                    )
                    .map((item, idx) => (
                      <View
                        key={item.id}
                        style={[
                          styles.pmRow,
                          idx < PUMASI_PER_PAGE - 1 && styles.pmRowBorder,
                        ]}
                      >
                        {/* 상태 바 */}
                        <View
                          style={[
                            styles.pmStatusBar,
                            {
                              backgroundColor: item.settled
                                ? "#D1D6DB"
                                : "#FF3B30",
                            },
                          ]}
                        />

                        {/* 아바타 */}
                        <View
                          style={[
                            styles.pmAvatar,
                            {
                              backgroundColor: item.settled
                                ? "#F2F4F6"
                                : "#FFF0F0",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pmAvatarText,
                              { color: item.settled ? "#8B95A1" : "#FF3B30" },
                            ]}
                          >
                            {(item.recipient_name || "?").charAt(0)}
                          </Text>
                        </View>

                        {/* 이름 + 경조사 */}
                        <View style={styles.pmRowInfo}>
                          <Text style={styles.pmRowName}>
                            {item.recipient_name}
                          </Text>
                          <Text style={styles.pmRowSub}>
                            {item.occasion || "경조사"}
                            {item.event_date ? ` · ${item.event_date}` : ""}
                          </Text>
                        </View>

                        {/* 금액 + 정산 */}
                        <View style={styles.pmRowRight}>
                          <Text
                            style={[
                              styles.pmRowAmount,
                              { color: item.settled ? "#8B95A1" : "#FF3B30" },
                            ]}
                          >
                            -{Number(item.amount || 0).toLocaleString()}원
                          </Text>
                          <TouchableOpacity
                            style={
                              item.settled
                                ? styles.pmSettledBadge
                                : styles.pmSettleBtn
                            }
                            onPress={() =>
                              togglePumasiSettle(item.id, item.settled)
                            }
                          >
                            {item.settled ? (
                              <>
                                <Ionicons
                                  name="checkmark"
                                  size={10}
                                  color="#8B95A1"
                                />
                                <Text style={styles.pmSettledText}>완료</Text>
                              </>
                            ) : (
                              <Text style={styles.pmSettleBtnText}>
                                정산완료
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                  {(() => {
                    const totalPages = Math.ceil(
                      pumasiGave.length / PUMASI_PER_PAGE,
                    );
                    return (
                      totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                          <TouchableOpacity
                            style={[
                              styles.paginationButton,
                              pumasiGavePage === 0 &&
                                styles.paginationButtonDisabled,
                            ]}
                            disabled={pumasiGavePage === 0}
                            onPress={() => setPumasiGavePage((p) => p - 1)}
                          >
                            <Ionicons
                              name="chevron-back"
                              size={20}
                              color={
                                pumasiGavePage === 0
                                  ? Colors.gray300
                                  : Colors.primary
                              }
                            />
                          </TouchableOpacity>
                          <View style={styles.paginationDots}>
                            {[...Array(totalPages)].map((_, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.paginationDot,
                                  index === pumasiGavePage &&
                                    styles.paginationDotActive,
                                ]}
                                onPress={() => setPumasiGavePage(index)}
                              />
                            ))}
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.paginationButton,
                              pumasiGavePage >= totalPages - 1 &&
                                styles.paginationButtonDisabled,
                            ]}
                            disabled={pumasiGavePage >= totalPages - 1}
                            onPress={() => setPumasiGavePage((p) => p + 1)}
                          >
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={
                                pumasiGavePage >= totalPages - 1
                                  ? Colors.gray300
                                  : Colors.primary
                              }
                            />
                          </TouchableOpacity>
                        </View>
                      )
                    );
                  })()}
                </>
              )}
            </View>
          )}
        </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {showNotificationCenter && (
      <Modal
        visible={showNotificationCenter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotificationCenter(false)}
      >
        <SafeAreaView style={styles.notificationCenter}>
          <View style={styles.notificationHeader}>
            <View>
              <Text style={styles.notificationTitle}>알림</Text>
              <Text style={styles.notificationSubtitle}>
                {reciprocityLoading || activityLoading
                  ? "알림을 불러오는 중이에요"
                  : homeNotificationUnreadCount > 0
                  ? `확인하지 않은 알림 ${homeNotificationUnreadCount}개`
                  : "새로 확인할 알림이 없어요"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notificationCloseButton}
              onPress={() => setShowNotificationCenter(false)}
              activeOpacity={0.75}
            >
              <Ionicons name="close" size={22} color="#4E5968" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.notificationList}
            contentContainerStyle={styles.notificationListContent}
            showsVerticalScrollIndicator={false}
          >
            {visibleHomeNotifications.length === 0 ? (
              <View style={styles.notificationEmpty}>
                <View style={styles.notificationEmptyIcon}>
                  <Ionicons
                    name="notifications-outline"
                    size={30}
                    color="#8B95A1"
                  />
                </View>
                <Text style={styles.notificationEmptyTitle}>
                  아직 알림이 없어요
                </Text>
                <Text style={styles.notificationEmptyText}>
                  경조사 생성, 수정, 결제, 하객 접수 활동을 여기에서
                  확인할 수 있어요.
                </Text>
              </View>
            ) : (
              visibleHomeNotifications.map((item) => {
                if (item.notificationKind === "activity") {
                  const isUnread = item.status === "unread";
                  return (
                    <TouchableOpacity
                      key={`activity-${item.id}`}
                      style={[
                        styles.notificationItem,
                        isUnread && styles.notificationItemUnread,
                      ]}
                      onPress={() => openNotificationItem(item)}
                      activeOpacity={0.82}
                    >
                      {isUnread && (
                        <View style={styles.notificationUnreadBar} />
                      )}
                      <View style={styles.notificationIconWrap}>
                        <Ionicons
                          name={getActivityNotificationIcon(item.type)}
                          size={21}
                          color="#4E5968"
                        />
                      </View>
                      <View style={styles.notificationBody}>
                        <View style={styles.notificationItemTop}>
                          <Text
                            style={[
                              styles.notificationCategory,
                              isUnread && styles.notificationCategoryUnread,
                            ]}
                          >
                            {getActivityNotificationCategoryText(
                              item.type,
                              item.category,
                            )}
                          </Text>
                          <Text style={styles.notificationTime}>
                            {formatDate(item.created_at)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.notificationItemTitle,
                            isUnread && styles.notificationItemTitleUnread,
                          ]}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                        {!!item.body && (
                          <Text
                            style={styles.notificationItemText}
                            numberOfLines={2}
                          >
                            {item.body}
                          </Text>
                        )}
                      </View>
                      {isUnread && (
                        <View style={styles.notificationUnreadDot} />
                      )}
                    </TouchableOpacity>
                  );
                }

                const originalEvents = item.originalEvents || [];
                const newEvents = item.newEvents || [];
                const latestNewEvent = newEvents[0] || item.new_event || {};
                const firstOriginalEvent =
                  originalEvents[0] || item.original_event || {};
                const isUnread = item.status === "unread";
                const displayGuestName = getReciprocityDisplayName(
                  item,
                  latestNewEvent,
                );
                const notificationDate = latestNewEvent.event_date
                  ? formatDateWithTime(
                      latestNewEvent.event_date,
                      latestNewEvent.event_time ||
                        latestNewEvent.ceremony_time,
                    )
                  : formatDate(item.created_at);

                return (
                  <TouchableOpacity
                    key={item.groupKey || item.id}
                    style={[
                      styles.notificationItem,
                      isUnread && styles.notificationItemUnread,
                    ]}
                    onPress={() => openNotificationItem(item)}
                    activeOpacity={0.82}
                  >
                    {isUnread && <View style={styles.notificationUnreadBar} />}
                    <View style={styles.notificationIconWrap}>
                      <Image
                        source={getReciprocityEventIcon(
                          latestNewEvent.event_type,
                        )}
                        style={styles.notificationEventIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.notificationBody}>
                      <View style={styles.notificationItemTop}>
                        <Text
                          style={[
                            styles.notificationCategory,
                            isUnread && styles.notificationCategoryUnread,
                          ]}
                        >
                          챙길 경조사
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatDate(item.created_at)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.notificationItemTitle,
                          isUnread && styles.notificationItemTitleUnread,
                        ]}
                        numberOfLines={2}
                      >
                        {displayGuestName}님이 새 경조사를 만들었어요
                      </Text>
                      <Text
                        style={styles.notificationItemText}
                        numberOfLines={2}
                      >
                        {latestNewEvent.event_name || "새 경조사"} ·{" "}
                        {notificationDate}
                      </Text>
                      {!!firstOriginalEvent.event_name && (
                        <Text
                          style={styles.notificationItemSubText}
                          numberOfLines={1}
                        >
                          이전 기록: {firstOriginalEvent.event_name}
                        </Text>
                      )}
                    </View>
                    {isUnread && <View style={styles.notificationUnreadDot} />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      )}

      {reciprocitySheetVisible && (
      <Modal
        visible={reciprocitySheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReciprocitySheet}
      >
        <View style={styles.reciprocitySheetOverlay}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.reciprocitySheetBackdrop,
              { opacity: reciprocitySheetFade },
            ]}
          />
          <TouchableWithoutFeedback onPress={closeReciprocitySheet}>
            <View style={styles.reciprocitySheetBackdropTouchable} />
          </TouchableWithoutFeedback>
          <View style={styles.reciprocitySheet}>
                {(() => {
                  const item = selectedReciprocityGroup || {};
                  const originalEvents = item.originalEvents || [];
                  const newEvents = item.newEvents || [];
                  const latestNewEvent = newEvents[0] || item.new_event || {};
                  const guestPhone = formatPhoneNumber(item.source_guest_phone);
                  const maskedGuestPhone = guestPhone
                    ? guestPhone.replace(
                        /(\d{3})-\d{3,4}-(\d{4})/,
                        "$1-****-$2",
                      )
                    : "";
                  const totalAmount = item.source_amount_total || 0;
                  const isCompleted = item.status === "completed";
                  const eventTypeLabel = getEventTypeText(
                    latestNewEvent.event_type,
                  );
                  const latestAmount =
                    item.source_amount_max ||
                    originalEvents[0]?.amount ||
                    totalAmount ||
                    0;
                  const displayGuestName = getReciprocityDisplayName(
                    item,
                    latestNewEvent,
                  );

                  return (
                    <>
                      <View style={styles.reciprocitySheetHandle} />
                      <ScrollView
                        style={styles.reciprocitySheetScroll}
                        contentContainerStyle={
                          styles.reciprocitySheetScrollContent
                        }
                        showsVerticalScrollIndicator={false}
                      >
                      <View style={styles.reciprocitySheetHero}>
                        <Text style={styles.reciprocitySheetEyebrow}>
                          챙길 경조사
                        </Text>
                        <Text
                          style={styles.reciprocitySheetHeroTitle}
                          numberOfLines={1}
                        >
                          {displayGuestName}님을 챙겨야 해요
                        </Text>
                        <Text
                          style={styles.reciprocitySheetHeroSub}
                          numberOfLines={1}
                        >
                          내 행사에 접수한 기록과 새 경조사를 함께 확인해요.
                        </Text>
                        <TouchableOpacity
                          style={styles.reciprocitySheetClose}
                          onPress={closeReciprocitySheet}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="close" size={22} color="#6B7684" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.reciprocitySheetPersonCard}>
                        <View style={styles.reciprocitySheetAvatar}>
                          <Text style={styles.reciprocitySheetAvatarText}>
                            {(displayGuestName || "?").charAt(0)}
                          </Text>
                          <View style={styles.reciprocitySheetAvatarBadge}>
                            <Ionicons name="heart" size={11} color="#FFFFFF" />
                          </View>
                        </View>
                        <View style={styles.reciprocitySheetPersonText}>
                          <Text
                            style={styles.reciprocitySheetPersonName}
                            numberOfLines={1}
                          >
                            {displayGuestName}
                          </Text>
                          {!!maskedGuestPhone && (
                            <Text style={styles.reciprocitySheetPhone}>
                              {maskedGuestPhone}
                            </Text>
                          )}
                        </View>
                        <View style={styles.reciprocitySheetAmountCard}>
                          <Text style={styles.reciprocitySheetAmountLabel}>
                            최근 받은 금액
                          </Text>
                          <Text style={styles.reciprocitySheetAmountValue}>
                            {formatAmount(latestAmount)}
                          </Text>
                        </View>
                      </View>

                        <View style={styles.reciprocitySheetBlock}>
                          <Text style={styles.reciprocitySheetBlockTitle}>
                            이 사람이 만든 경조사
                          </Text>
                          <View style={styles.reciprocitySheetNewEvent}>
                            <View style={styles.reciprocitySheetNewEventBar} />
                            <View style={styles.reciprocitySheetNewEventBody}>
                              <Text style={styles.reciprocitySheetEventType}>
                                {eventTypeLabel}
                              </Text>
                              <Text
                                style={styles.reciprocitySheetNewEventTitle}
                                numberOfLines={1}
                              >
                                {latestNewEvent.event_name || "새 경조사"}
                              </Text>
                              <Text
                                style={styles.reciprocitySheetNewEventSub}
                                numberOfLines={1}
                              >
                                {formatDateWithTime(
                                  latestNewEvent.event_date,
                                  latestNewEvent.event_time ||
                                    latestNewEvent.ceremony_time,
                                )}
                                {newEvents.length > 1
                                  ? ` · 외 ${newEvents.length - 1}개`
                                  : ""}
                              </Text>
                            </View>
                            <View style={styles.reciprocitySheetNewEventSide}>
                              <View
                                style={[
                                  styles.reciprocitySheetStatusPill,
                                  isCompleted &&
                                    styles.reciprocitySheetStatusDone,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.reciprocitySheetStatusText,
                                    isCompleted &&
                                      styles.reciprocitySheetStatusDoneText,
                                  ]}
                                >
                                  {isCompleted ? "챙김 완료" : "확인 필요"}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.reciprocitySheetInviteButton}
                                onPress={() =>
                                  openInvitationPreview(latestNewEvent)
                                }
                                activeOpacity={0.82}
                              >
                                <Text
                                  style={styles.reciprocitySheetInviteText}
                                >
                                  청첩장 보기
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        <View style={styles.reciprocitySheetSummary}>
                          <View style={styles.reciprocitySheetSummaryItem}>
                            <Text style={styles.reciprocitySheetSummaryLabel}>
                              이전에 참석
                            </Text>
                            <Text style={styles.reciprocitySheetSummaryValue}>
                              {originalEvents.length}건
                            </Text>
                          </View>
                          <View style={styles.reciprocitySheetSummaryDivider} />
                          <View style={styles.reciprocitySheetSummaryItem}>
                            <Text style={styles.reciprocitySheetSummaryLabel}>
                              최근 접수
                            </Text>
                            <Text
                              style={[
                                styles.reciprocitySheetSummaryValue,
                                styles.reciprocitySheetSummaryValueBlue,
                              ]}
                            >
                              {formatAmount(latestAmount)}
                            </Text>
                          </View>
                          <View style={styles.reciprocitySheetSummaryDivider} />
                          <View style={styles.reciprocitySheetSummaryItem}>
                            <Text style={styles.reciprocitySheetSummaryLabel}>
                              챙김 상태
                            </Text>
                            <Text style={styles.reciprocitySheetSummaryValue}>
                              {isCompleted ? "완료" : "대기"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.reciprocitySheetHistoryHeader}>
                          <Text style={styles.reciprocitySheetBlockTitle}>
                            함께했던 기록
                          </Text>
                          <View style={styles.reciprocitySheetCountPill}>
                            <Text style={styles.reciprocitySheetCountText}>
                              총 {originalEvents.length}건
                            </Text>
                          </View>
                        </View>

                        <View style={styles.reciprocitySheetTimeline}>
                          <View style={styles.reciprocitySheetTimelineLine} />
                          {originalEvents.length === 0 ? (
                            <Text style={styles.reciprocitySheetEmptyText}>
                              연결된 참여 기록이 없어요.
                            </Text>
                          ) : (
                            originalEvents.map((event, eventIndex) => (
                              <TouchableOpacity
                                key={event.id || event.notificationId}
                                style={styles.reciprocitySheetHistoryRow}
                                onPress={() => {
                                  setReciprocitySheetVisible(false);
                                  setSelectedReciprocityGroup(null);
                                  openReciprocityDetail({
                                    ...item,
                                    items:
                                      item.items?.filter(
                                        (raw) =>
                                          raw.original_event_id === event.id,
                                      ) || item.items,
                                    original_event: event,
                                  });
                                }}
                                activeOpacity={0.78}
                              >
                                <View
                                  style={[
                                    styles.reciprocitySheetHistoryDot,
                                    eventIndex === 0 &&
                                      styles.reciprocitySheetHistoryDotActive,
                                  ]}
                                />
                                <View style={styles.reciprocitySheetHistoryCard}>
                                  <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                      style={
                                        styles.reciprocitySheetHistoryTitle
                                      }
                                      numberOfLines={1}
                                    >
                                      {event.event_name || "이전 경조사"}
                                    </Text>
                                    <Text
                                      style={styles.reciprocitySheetHistorySub}
                                      numberOfLines={1}
                                    >
                                      {event.event_date
                                        ? `${formatDate(event.event_date)} · `
                                        : ""}
                                      축의금
                                    </Text>
                                  </View>
                                  <View style={styles.reciprocitySheetHistoryMeta}>
                                    <Text
                                      style={
                                        styles.reciprocitySheetHistoryAmount
                                      }
                                      numberOfLines={1}
                                    >
                                      {formatAmount(event.amount || 0)}
                                    </Text>
                                    <View
                                      style={styles.reciprocitySheetHistoryBtn}
                                    >
                                      <Text
                                        style={
                                          styles.reciprocitySheetHistoryBtnText
                                        }
                                      >
                                        내역 보기
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            ))
                          )}
                        </View>
                      </ScrollView>

                      <View style={styles.reciprocitySheetActions}>
                        <TouchableOpacity
                          style={styles.reciprocitySheetLaterButton}
                          onPress={closeReciprocitySheet}
                          activeOpacity={0.78}
                        >
                          <Text style={styles.reciprocitySheetLaterText}>
                            나중에 볼게요
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.reciprocitySheetDoneButton,
                            isCompleted &&
                              styles.reciprocitySheetDoneButtonCompleted,
                          ]}
                          onPress={() => completeReciprocityGroup(item)}
                          activeOpacity={0.82}
                          disabled={isCompleted}
                        >
                          <Text style={styles.reciprocitySheetDoneText}>
                            {isCompleted ? "챙김 완료" : "챙겼어요"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                })()}
          </View>
          </View>
      </Modal>
      )}

      {/* 🔥 일정 추가 모달 */}
      {showEventModal && (
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
              event_date: selectedDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
              location: eventLocation.trim() || null,
            };

            // 현재 사용자 정보 준비 (loadEvents와 동일한 로직)
            let currentUserInfo = null;
            if (userInfo?.userId) {
              currentUserInfo = {
                id: userInfo.userId,
                name: userInfo.userName,
                phone: userInfo.phone,
                auth_method: "phone",
              };
            } else if (session?.user) {
              currentUserInfo = {
                id: session.user.id,
                name:
                  session.user.user_metadata?.name ||
                  session.user.email?.split("@")[0],
                email: session.user.email,
                auth_method: "supabase",
              };
            }

            const result = await createPersonalSchedule(
              scheduleData,
              currentUserInfo,
            );

            if (result.success) {
              // 🔥 디버깅: 새로 생성된 일정 데이터 확인

              // UI에 즉시 반영 - 개인 일정은 activeEvents에 추가
              setActiveEvents((prev) => {
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
              Alert.alert("오류", result.error || "일정 추가에 실패했습니다.");
              setShowEventModal(false);
            }
          } catch (error) {
            Alert.alert("오류", "일정 추가 중 오류가 발생했습니다.");
          }
        }}
      />
      )}

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
                {selectedDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
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

          <ScrollView
            style={styles.eventListContent}
            showsVerticalScrollIndicator={false}
          >
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
                        name={
                          event.event_type === "wedding" ? "heart" : "flower"
                        }
                        size={12}
                        color={Colors.primary}
                      />
                      <Text style={styles.eventListItemBadgeText}>
                        {event.event_type === "wedding" ? "결혼" : "조문"}
                      </Text>
                    </View>
                  </View>

                  {event.location && (
                    <View style={styles.eventListItemLocation}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={Colors.gray500}
                      />
                      <Text style={styles.eventListItemLocationText}>
                        {event.location}
                      </Text>
                    </View>
                  )}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.gray400}
                />
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
                opacity: confirmModalOpacity,
              },
            ]}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={[
                  styles.tossModalContainer,
                  {
                    transform: [
                      {
                        translateY: confirmModalSlideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, 0], // 300px 아래에서 슬라이드업
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.tossModalHeader}>
                  <Text style={styles.tossModalTitle}>
                    {selectedDate.toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={styles.tossModalSubtitle}>
                    {selectedDateEvents.length}개의 일정이 있어요
                  </Text>
                </View>

                <ScrollView
                  style={styles.tossEventList}
                  showsVerticalScrollIndicator={false}
                >
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
                        <View
                          style={[
                            styles.tossEventTypeBadge,
                            {
                              backgroundColor: getEventStatusColor(
                                event.event_type,
                              ),
                            },
                          ]}
                        >
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
                            {new Date(event.event_date).toLocaleDateString(
                              "ko-KR",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </Text>
                        </View>

                        {event.location && (
                          <View style={styles.tossEventLocationRow}>
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color={Colors.gray400}
                            />
                            <Text
                              style={styles.tossEventLocation}
                              numberOfLines={1}
                            >
                              {event.location}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 🔥 화살표 */}
                      <View style={styles.tossEventArrow}>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={Colors.gray400}
                        />
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
                    <Ionicons
                      name="add-circle"
                      size={20}
                      color={Colors.white}
                    />
                    <Text style={styles.tossModalButtonText}>
                      일정 추가하기
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tossModalButton,
                      styles.tossModalCancelButton,
                    ]}
                    onPress={hideConfirmModal}
                  >
                    <Text
                      style={[
                        styles.tossModalButtonText,
                        styles.tossModalCancelText,
                      ]}
                    >
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
              opacity: successModalOpacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.tossSuccessContainer,
              {
                transform: [
                  {
                    scale: successModalScale,
                  },
                ],
                opacity: successModalOpacity,
              },
            ]}
          >
            <View style={styles.tossSuccessIcon}>
              <Ionicons name="checkmark" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.tossSuccessTitle}>일정이 추가되었어요</Text>
            <Text style={styles.tossSuccessSubtitle}>
              {selectedDate.toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
              })}
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
        <TouchableWithoutFeedback
          onPress={() => setShowCreateEventModal(false)}
        >
          <View style={styles.createEventModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.createEventModalContainer}>
                <View style={styles.createEventModalHandle} />
                <Text style={styles.createEventModalTitle}>경조사 만들기</Text>
                <Text style={styles.createEventModalSubtitle}>
                  어떤 경조사를 준비하시나요?
                </Text>

                <View style={styles.createEventModalOptions}>
                  <TouchableOpacity
                    style={[
                      styles.createEventModalOption,
                      styles.createEventModalOptionComingSoon,
                      eventCreationFlowLocked &&
                        styles.createEventModalOptionDisabled,
                    ]}
                    activeOpacity={0.7}
                    disabled={eventCreationFlowLocked}
                    onPress={() => {
                      setShowCreateEventModal(false);
                      handleEventCreationIntent("wedding");
                    }}
                  >
                    <View
                      style={[
                        styles.createEventModalIconWrap,
                        { backgroundColor: "#FFF0F5" },
                      ]}
                    >
                      <Image
                        source={RECIPROCITY_EVENT_ICONS.wedding}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.createEventModalOptionInfo}>
                      <Text style={styles.createEventModalOptionTitle}>
                        청첩장 만들기
                      </Text>
                      <Text style={styles.createEventModalOptionDesc}>
                        결혼식 초대장과 부조금 관리
                      </Text>
                      <Text
                        style={[
                          styles.createEventModalCreditText,
                          getCreationCreditNotice().isPaid &&
                            styles.createEventModalCreditTextPaid,
                        ]}
                      >
                        {getCreationCreditNotice().text}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.gray400}
                    />
                  </TouchableOpacity>

                  <View style={styles.createEventModalDivider} />

                  <TouchableOpacity
                    style={[
                      styles.createEventModalOption,
                      eventCreationFlowLocked &&
                        styles.createEventModalOptionDisabled,
                    ]}
                    activeOpacity={0.7}
                    disabled={eventCreationFlowLocked}
                    onPress={() => {
                      setShowCreateEventModal(false);
                      handleEventCreationIntent("funeral");
                    }}
                  >
                    <View
                      style={[
                        styles.createEventModalIconWrap,
                        { backgroundColor: "#F0F0F5" },
                      ]}
                    >
                      <Image
                        source={RECIPROCITY_EVENT_ICONS.funeral}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.createEventModalOptionInfo}>
                      <View style={styles.createEventModalOptionTitleRow}>
                        <Text style={styles.createEventModalOptionTitle}>
                          부고장 만들기
                        </Text>
                      </View>
                      <Text style={styles.createEventModalOptionDesc}>
                        부고장과 조의금 관리를 시작해보세요
                      </Text>
                      <Text
                        style={[
                          styles.createEventModalCreditText,
                          getCreationCreditNotice().isPaid &&
                            styles.createEventModalCreditTextPaid,
                        ]}
                      >
                        {getCreationCreditNotice().text}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.gray400}
                    />
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

      <Modal
        visible={creditShortageModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeCreditShortageModal}
      >
        <TouchableWithoutFeedback onPress={closeCreditShortageModal}>
          <View style={styles.creditShortageOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.creditShortageCard}>
                <TouchableOpacity
                  style={styles.creditShortageClose}
                  activeOpacity={0.75}
                  onPress={closeCreditShortageModal}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>

                <View style={styles.creditShortageIconWrap}>
                  <View style={styles.creditShortageIconBack} />
                  <Ionicons name="wallet-outline" size={34} color="#B45309" />
                </View>

                <Text style={styles.creditShortageTitle}>
                  크레딧이 부족해요
                </Text>
                <Text style={styles.creditShortageDesc}>
                  무료 생성 {EVENT_CREATION_FREE_LIMIT}회를 모두 사용했습니다.
                  {"\n"}
                  {creditShortageModal.eventType === "funeral"
                    ? "부고장"
                    : "청첩장"}{" "}
                  만들기는 {creditShortageModal.priceCredits}크레딧이 필요해요.
                </Text>

                <View style={styles.creditShortageSummary}>
                  <View style={styles.creditShortageSummaryItem}>
                    <Text style={styles.creditShortageSummaryLabel}>
                      현재 잔액
                    </Text>
                    <Text style={styles.creditShortageSummaryValue}>
                      {creditShortageModal.balance}크레딧
                    </Text>
                  </View>
                  <View style={styles.creditShortageSummaryDivider} />
                  <View style={styles.creditShortageSummaryItem}>
                    <Text style={styles.creditShortageSummaryLabel}>
                      필요 크레딧
                    </Text>
                    <Text
                      style={[
                        styles.creditShortageSummaryValue,
                        styles.creditShortageRequiredValue,
                      ]}
                    >
                      {creditShortageModal.priceCredits}크레딧
                    </Text>
                  </View>
                </View>

                <View style={styles.creditShortageNotice}>
                  <Ionicons
                    name="information-circle-outline"
                    size={17}
                    color="#0F766E"
                  />
                  <Text style={styles.creditShortageNoticeText}>
                    충전 후 바로 청첩장 만들기를 이어갈 수 있어요.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.creditShortageButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    closeCreditShortageModal();
                    navigation.navigate("Credit");
                  }}
                >
                  <Text style={styles.creditShortageButtonText}>충전하러 가기</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showEventCreationWelcomeModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseEventCreationWelcomeModal}
      >
        <View style={styles.eventCreationWelcomeOverlay}>
          <View style={styles.eventCreationWelcomeCard}>
            <View style={styles.eventCreationWelcomeIconWrap}>
              <Ionicons name="gift-outline" size={30} color="#0F766E" />
            </View>
            <Text style={styles.eventCreationWelcomeTitle}>
              정담 시작 선물이 도착했어요
            </Text>
            <Text style={styles.eventCreationWelcomeDesc}>
              처음 {EVENT_CREATION_FREE_LIMIT}개의 청첩장은 무료로 만들 수
              있어요.
              {"\n"}이후 청첩장 만들기는 {EVENT_CREATION_CREDIT_COST}크레딧이
              사용됩니다.
              {"\n"}가입 선물로 크레딧 20개를 드렸어요.
            </Text>
            <View style={styles.eventCreationWelcomeNotice}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color="#8B5E00"
              />
              <Text style={styles.eventCreationWelcomeNoticeText}>
                부고장은 곧 제공될 예정입니다.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.eventCreationWelcomeButton}
              activeOpacity={0.85}
              onPress={handleCloseEventCreationWelcomeModal}
            >
              <Text style={styles.eventCreationWelcomeButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📱 알림 권한 모달 */}
      <NotificationPermissionModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        userInfo={userInfo}
      />

      {/* 품앗이 줬음 직접추가 모달 (내가 줬음 탭 + 기록 버튼) */}
      <Modal visible={showPumasiAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            activeOpacity={1}
            onPress={() => setShowPumasiAddModal(false)}
          />
          <View style={styles.pumasiModalContainer}>
            <Text style={styles.pumasiModalTitle}>줬음 기록하기</Text>

            <Text style={styles.pumasiModalLabel}>이름</Text>
            <TextInput
              style={styles.pumasiInput}
              placeholder="받은 사람 이름"
              value={pumasiGaveForm.recipient_name}
              onChangeText={(v) =>
                setPumasiGaveForm((f) => ({ ...f, recipient_name: v }))
              }
            />

            <Text style={styles.pumasiModalLabel}>금액</Text>
            <TextInput
              style={styles.pumasiInput}
              placeholder="금액 (숫자만)"
              keyboardType="numeric"
              value={String(pumasiGaveForm.amount)}
              onChangeText={(v) =>
                setPumasiGaveForm((f) => ({ ...f, amount: v }))
              }
            />

            <Text style={styles.pumasiModalLabel}>경조사 종류</Text>
            <TextInput
              style={styles.pumasiInput}
              placeholder="예: 결혼, 장례, 돌잔치"
              value={pumasiGaveForm.occasion}
              onChangeText={(v) =>
                setPumasiGaveForm((f) => ({ ...f, occasion: v }))
              }
            />

            <Text style={styles.pumasiModalLabel}>날짜</Text>
            <TextInput
              style={styles.pumasiInput}
              placeholder="YYYY-MM-DD"
              value={pumasiGaveForm.event_date}
              onChangeText={(v) =>
                setPumasiGaveForm((f) => ({ ...f, event_date: v }))
              }
            />

            <View style={styles.pumasiModalButtons}>
              <TouchableOpacity
                style={styles.pumasiCancelBtn}
                onPress={() => setShowPumasiAddModal(false)}
              >
                <Text style={styles.pumasiCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pumasiSaveBtn}
                onPress={addPumasiGave}
              >
                <Text style={styles.pumasiSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 필터 바텀시트 (3단계: 경조사 선택 → 신랑/신부측 → 관계 선택) */}
      <Modal visible={showPumasiFilterSheet} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            activeOpacity={1}
            onPress={() => setShowPumasiFilterSheet(false)}
          />
          <View style={styles.tossSheet}>
            {/* Handle bar */}
            <View style={styles.tossSheetHandle} />

            {/* 헤더: 이전(좌) + 제목(중) + 취소(우) */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              {pumasiFilterStep > 1 ? (
                <TouchableOpacity
                  onPress={handlePumasiBack}
                  style={{ padding: 4, marginRight: 4 }}
                >
                  <Ionicons name="chevron-back" size={24} color="#191F28" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 32 }} />
              )}
              <Text
                style={[styles.tossSheetTitle, { flex: 1, marginBottom: 0 }]}
              >
                {pumasiFilterStep === 1
                  ? "어떤 경조사인가요?"
                  : pumasiFilterStep === 2
                    ? "어느 측 하객인가요?"
                    : "관계를 선택해주세요"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPumasiFilterSheet(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color="#8B95A1" />
              </TouchableOpacity>
            </View>

            {/* Step 1: 경조사 선택 */}
            {pumasiFilterStep === 1 && (
              <>
                <ScrollView
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator={false}
                >
                  {(hostedEvents || []).map((event) => {
                    const isSelected = pumasiFilterEvent?.id === event.id;
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.tossSheetRow}
                        onPress={() => setPumasiFilterEvent(event)}
                      >
                        {isSelected ? (
                          <View style={styles.tossRadioActive}>
                            <View style={styles.tossRadioDot} />
                          </View>
                        ) : (
                          <View style={styles.tossRadio} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.tossSheetRowText,
                              isSelected && styles.tossSheetRowTextActive,
                            ]}
                          >
                            {event.event_name}
                          </Text>
                          <Text style={styles.tossSheetRowSub}>
                            {event.event_type === "wedding"
                              ? "결혼식"
                              : event.event_type === "funeral"
                                ? "장례식"
                                : event.event_type}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={[
                    styles.tossNextBtn,
                    !pumasiFilterEvent && styles.tossNextBtnDisabled,
                  ]}
                  disabled={!pumasiFilterEvent}
                  onPress={() => {
                    setPumasiFilterSide(null);
                    setPumasiFilterRelation(null);
                    // availableSides가 있으면 Step 2, 없으면 Step 3으로
                    setPumasiFilterStep(availableSides.length > 0 ? 2 : 3);
                  }}
                >
                  <Text
                    style={[
                      styles.tossNextBtnText,
                      !pumasiFilterEvent && styles.tossNextBtnTextDisabled,
                    ]}
                  >
                    다음
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 2: relation_category 선택 (DB 실제 값) */}
            {pumasiFilterStep === 2 && (
              <>
                <ScrollView
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator={false}
                >
                  {[
                    { label: "전체", value: null },
                    ...availableSides.map((s) => ({ label: s, value: s })),
                  ].map((item) => {
                    const isSelected = pumasiFilterSide === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value ?? "전체"}
                        style={styles.tossSheetRow}
                        onPress={() => setPumasiFilterSide(item.value)}
                      >
                        {isSelected ? (
                          <View style={styles.tossRadioActive}>
                            <View style={styles.tossRadioDot} />
                          </View>
                        ) : (
                          <View style={styles.tossRadio} />
                        )}
                        <Text
                          style={[
                            styles.tossSheetRowText,
                            isSelected && styles.tossSheetRowTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={styles.tossNextBtn}
                  onPress={() => setPumasiFilterStep(3)}
                >
                  <Text style={styles.tossNextBtnText}>다음</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 3: 관계 선택 */}
            {pumasiFilterStep === 3 && (
              <>
                <ScrollView
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator={false}
                >
                  {[
                    { label: "전체", value: null },
                    ...availableRelations.map((r) => ({ label: r, value: r })),
                  ].map((item) => {
                    const isSelected = pumasiFilterRelation === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value ?? "전체"}
                        style={styles.tossSheetRow}
                        onPress={() => setPumasiFilterRelation(item.value)}
                      >
                        {isSelected ? (
                          <View style={styles.tossRadioActive}>
                            <View style={styles.tossRadioDot} />
                          </View>
                        ) : (
                          <View style={styles.tossRadio} />
                        )}
                        <Text
                          style={[
                            styles.tossSheetRowText,
                            isSelected && styles.tossSheetRowTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={styles.tossNextBtn}
                  onPress={() => setShowPumasiFilterSheet(false)}
                >
                  <Text style={styles.tossNextBtnText}>확인</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 줬음 기록 바텀시트 (받음 항목의 [줬음 기록] 버튼에서 열림) */}
      <Modal visible={showPumasiGaveSheet} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* 외부 탭 → 닫기 */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            activeOpacity={1}
            onPress={() => setShowPumasiGaveSheet(false)}
          />
          {/* 시트 (View 유지 → paddingBottom 정상 적용) */}
          <View style={styles.tossSheet}>
            <View style={styles.tossSheetHandle} />
            <Text style={styles.tossSheetTitle}>줬음 기록</Text>

            <Text style={styles.tossInputLabel}>이름</Text>
            <TextInput
              style={styles.tossInput}
              value={pumasiGaveForm.recipient_name}
              onChangeText={(v) =>
                setPumasiGaveForm((f) => ({ ...f, recipient_name: v }))
              }
            />

            <Text style={styles.tossInputLabel}>금액</Text>
            <TextInput
              style={styles.tossInput}
              keyboardType="numeric"
              value={String(pumasiGaveForm.amount)}
              onChangeText={(v) =>
                setPumasiGaveForm((f) => ({ ...f, amount: v }))
              }
            />

            <Text style={styles.tossInputLabel}>경조사 종류</Text>
            <TextInput
              style={styles.tossInput}
              placeholder="예: 결혼, 장례, 돌잔치"
              value={pumasiGaveForm.occasion}
              onChangeText={(v) =>
                setPumasiGaveForm((f) => ({ ...f, occasion: v }))
              }
            />

            <Text style={styles.tossInputLabel}>날짜</Text>
            <TextInput
              style={styles.tossInput}
              placeholder="YYYY-MM-DD"
              value={pumasiGaveForm.event_date}
              onChangeText={(v) =>
                setPumasiGaveForm((f) => ({ ...f, event_date: v }))
              }
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={styles.tossCancelBtn}
                onPress={() => setShowPumasiGaveSheet(false)}
              >
                <Text style={styles.tossCancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tossPrimaryBtn}
                onPress={addPumasiGave}
              >
                <Text style={styles.tossPrimaryBtnText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// 헬퍼 함수들
const getEventIcon = (eventType) => {
  switch (eventType) {
    case "wedding":
      return "heart";
    case "funeral":
      return "flower";
    case "birthday":
      return "gift";
    default:
      return "calendar";
  }
};

const getEventColor = (eventType) => {
  switch (eventType) {
    case "wedding":
      return Colors.wedding;
    case "funeral":
      return Colors.funeral;
    case "birthday":
      return Colors.celebration;
    default:
      return Colors.other;
  }
};

const getEventStatusColor = (eventType) => {
  switch (eventType) {
    case "wedding":
      return Colors.wedding;
    case "funeral":
      return Colors.funeral;
    default:
      return Colors.success;
  }
};

const getEventTypeText = (eventType) => {
  switch (eventType) {
    case "wedding":
      return "결혼식";
    case "funeral":
      return "장례식";
    default:
      return "행사";
  }
};

const getDDay = (dateString) => {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);
  const diff = Math.round((eventDate - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "날짜 미정";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateWithTime = (dateString, timeString) => {
  if (!dateString) return "날짜 미정";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = dayNames[date.getDay()];
  let result = `${year}.${month}.${day}(${dayOfWeek})`;
  if (timeString) {
    const timeParts = timeString.split(":");
    if (timeParts.length >= 2) {
      result += ` ${timeParts[0]}:${timeParts[1]}`;
    }
  }
  return result;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F6",
  },

  // 헤더 - Toss 표준
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 16 : 56,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
    gap: 14,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    height: 68,
    justifyContent: "center",
  },
  headerLogoSpot: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAF0",
    shadowColor: "#191F28",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  headerLogoLarge: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 26,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#191F28",
    lineHeight: 25,
  },
  headerGreeting: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    fontSize: 13,
    color: "#6B7684",
    fontWeight: "500",
    lineHeight: 16,
  },
  headerCreditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  headerCreditChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E8EC",
    shadowColor: "#191F28",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  headerCreditChipWarm: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E8EC",
  },
  headerCreditText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#191F28",
    lineHeight: 16,
  },
  headerCreditTextWarm: {
    color: "#191F28",
  },
  headerNotificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    position: "relative",
  },
  headerNotificationDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  notificationCenter: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
  },
  notificationTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#191F28",
    lineHeight: 28,
  },
  notificationSubtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    color: "#8B95A1",
    lineHeight: 17,
  },
  notificationCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FA",
  },
  notificationList: {
    flex: 1,
  },
  notificationListContent: {
    paddingVertical: 6,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  notificationItemUnread: {
    backgroundColor: "#FFF6F2",
  },
  notificationUnreadBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#FF6B35",
  },
  notificationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FA",
    marginRight: 12,
  },
  notificationEventIcon: {
    width: 28,
    height: 28,
  },
  notificationBody: {
    flex: 1,
    minWidth: 0,
  },
  notificationItemTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  notificationCategory: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7684",
    lineHeight: 17,
  },
  notificationCategoryUnread: {
    color: "#191F28",
    fontWeight: "800",
  },
  notificationTime: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "500",
    color: "#8B95A1",
    lineHeight: 16,
  },
  notificationItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333D4B",
    lineHeight: 21,
  },
  notificationItemTitleUnread: {
    fontWeight: "800",
    color: "#191F28",
  },
  notificationItemText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7684",
    lineHeight: 19,
  },
  notificationItemSubText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
    color: "#8B95A1",
    lineHeight: 17,
  },
  notificationUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B35",
    marginLeft: 8,
    marginTop: 7,
  },
  notificationEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  notificationEmptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F6",
    marginBottom: 16,
  },
  notificationEmptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#191F28",
    lineHeight: 23,
  },
  notificationEmptyText: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: "500",
    color: "#8B95A1",
    lineHeight: 20,
    textAlign: "center",
  },

  // 콘텐츠
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#F2F4F6",
  },

  // 배너 섹션
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeSlide: {
    width: width - 40,
    paddingHorizontal: 0,
    paddingBottom: 4,
  },
  welcomeCard: {
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  welcomeCardMobile: {
    height: 124,
  },
  welcomeCardTablet: {
    alignSelf: "center",
    width: "100%",
    height: 148,
  },
  welcomeImageCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  welcomeCardBackgroundImage: {
    borderRadius: 20,
  },
  welcomeTextLayer: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: isTablet ? 34 : 26,
    paddingRight: isTablet ? 300 : 118,
  },
  welcomeContent: {
    flex: 1,
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "800",
    color: "#191F28",
    marginBottom: 8,
    lineHeight: isTablet ? 32 : 27,
    letterSpacing: 0,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "#4E5968",
    fontWeight: "600",
    lineHeight: 18,
    opacity: 0.85,
  },
  bannerIconWrap: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    width: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerMainIcon: {
    fontSize: 76,
  },
  bannerMainImage: {
    width: 100,
    height: 100,
  },
  bannerDeco: {
    position: "absolute",
    fontSize: 18,
  },
  slideIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D6DB",
  },
  activeDot: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#191F28",
  },

  // 경조사 만들기 (퀵 액션) - Toss 표준
  quickSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191F28",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#8B95A1",
    marginBottom: 14,
    fontWeight: "400",
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    minHeight: 240,
  },
  quickItemDisabled: {
    opacity: 0.72,
  },
  quickIcon: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191F28",
    marginTop: 8,
    marginBottom: 4,
  },
  quickSubtitle: {
    fontSize: 12,
    color: "#8B95A1",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 14,
    flex: 1,
    fontWeight: "400",
  },
  quickButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
    minWidth: 100,
    alignItems: "center",
  },
  quickButtonDisabled: {
    opacity: 0.65,
  },
  quickButtonComingSoon: {
    backgroundColor: "#A7AEB8",
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  quickTypeIndicator: {
    backgroundColor: Colors.wedding,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    position: "absolute",
    top: 12,
    right: 12,
  },
  quickTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  comingSoonBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F2F4F6",
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
  },

  // 내가 주최한 경조사 - Toss 표준
  eventsManagementSection: {
    marginBottom: 0,
  },
  homeSectionDivider: {
    height: 8,
    backgroundColor: "#F2F4F6",
    marginHorizontal: -20,
    marginTop: 10,
    marginBottom: 16,
  },

  // 세그먼트 컨트롤 (Pill)
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F4F6",
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B95A1",
  },
  activeTabText: {
    color: "#191F28",
    fontWeight: "700",
  },
  hostedSortBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: -4,
    marginBottom: 14,
  },
  hostedSortGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hostedSortChip: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hostedSortChipActive: {
    backgroundColor: "#E8F2FF",
  },
  hostedSortChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B95A1",
  },
  hostedSortChipTextActive: {
    color: "#191F28",
  },
  hostedSortOrderButton: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hostedSortOrderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4E5968",
  },

  // 이벤트 리스트
  eventsList: {
    gap: 12,
  },

  // 이벤트 카드 (Toss)
  eventCardNew: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    position: "relative",
    ...Platform.select({
      ios: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#EEF1F4",
      },
      android: {
        elevation: 0,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#EEF1F4",
        overflow: "hidden",
      },
      default: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#EEF1F4",
      },
    }),
  },
  hostedEditButton: {
    marginTop: 13,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#BFD8FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  hostedEditButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2F80ED",
  },

  eventCardShowcase: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 22,
  },
  eventPhotoColumn: {
    width: HOSTED_PHOTO_WIDTH,
  },
  eventPhotoBadgeRow: {
    height: 26,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventPhotoStage: {
    width: HOSTED_PHOTO_WIDTH,
    height: HOSTED_PHOTO_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F2F4F6",
    position: "relative",
  },
  eventHeroPhoto: {
    width: HOSTED_PHOTO_WIDTH,
    height: HOSTED_PHOTO_HEIGHT,
  },
  eventHeroPhotoFrame: {
    width: HOSTED_PHOTO_WIDTH,
    height: HOSTED_PHOTO_HEIGHT,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  eventFuneralFrameImage: {
    ...StyleSheet.absoluteFillObject,
    width: HOSTED_PHOTO_WIDTH,
    height: HOSTED_PHOTO_HEIGHT,
  },
  eventHeroPlaceholder: {
    width: HOSTED_PHOTO_WIDTH,
    height: HOSTED_PHOTO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  eventHeroPlaceholderIcon: {
    width: HOSTED_PHOTO_WIDTH * 0.58,
    height: HOSTED_PHOTO_WIDTH * 0.58,
    opacity: 0.92,
  },
  eventPhotoTypeBadge: {
    width: 44,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F765A3",
    alignItems: "center",
    justifyContent: "center",
  },
  eventPhotoTypeBadgeFuneral: {
    backgroundColor: "#64748B",
  },
  eventPhotoTypeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  eventPhotoDdayBadge: {
    flex: 1,
    minWidth: 54,
    height: 24,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  eventPhotoDdayText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#191F28",
  },
  eventPhotoDots: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  eventPhotoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  eventPhotoDotActive: {
    width: 12,
    backgroundColor: "#FFFFFF",
  },
  eventCardInfo: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
    paddingLeft: 2,
  },
  eventDatePill: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: "#EAF3FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  eventDatePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#3666A8",
    flexShrink: 1,
  },

  // 카드 중간: 이벤트명 + 장소
  eventCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#191F28",
    lineHeight: 21,
    marginBottom: 6,
  },
  eventCardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 11,
  },
  eventCardLocation: {
    fontSize: 12,
    color: "#8B95A1",
    lineHeight: 18,
    fontWeight: "700",
    flex: 1,
  },

  // 카드 하단: 통계 바
  eventCardStatsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: 12,
    paddingVertical: 8,
    minHeight: 52,
    overflow: "hidden",
  },
  eventCardStatBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  eventCardStatValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#191F28",
  },
  eventCardStatLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "800",
    color: "#8B95A1",
  },
  eventCardStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: "#E5E8EC",
  },
  eventGuestbookPanel: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#E5E8EC",
    borderStyle: "dashed",
  },
  eventGuestbookPanelOpen: {
    backgroundColor: "#FFFFFF",
  },
  eventGuestbookToggle: {
    minHeight: 44,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventGuestbookToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  eventGuestbookToggleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  eventGuestbookToggleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#191F28",
  },
  eventGuestbookMessages: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF1F4",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  eventGuestbookMessageRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventGuestbookMessageBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventGuestbookMessageName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#191F28",
    width: 58,
  },
  eventGuestbookMessageText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    color: "#4E5968",
    flex: 1,
  },
  eventGuestbookMessageDate: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B0B8C1",
  },
  eventGuestbookDeleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  eventGuestbookPagination: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 2,
  },
  eventGuestbookPageButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F3FF",
  },
  eventGuestbookPageButtonDisabled: {
    backgroundColor: "#F8FAFC",
  },
  eventGuestbookPageText: {
    minWidth: 42,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
    color: "#6D28D9",
  },

  // 🔥 더보기 버튼
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 6,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },

  // 빈 상태 - Toss 표준
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191F28",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#8B95A1",
    marginBottom: 20,
    fontWeight: "400",
  },
  createButton: {
    backgroundColor: "#3182F6",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // 로딩
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // 캘린더 섹션 - Toss 표준
  calendarSection: {
    marginBottom: 28,
  },

  calendarSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3182F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },

  addEventButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // 캘린더 컨테이너
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // 캘린더 스타일
  calendar: {
    width: "100%",
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },

  calendarHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  calendarWeekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },

  calendarWeekDay: {
    width: "14.28%", // 7분의 1로 통일
    alignItems: "center",
    paddingVertical: 8,
  },

  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  calendarSundayText: {
    color: Colors.error,
  },

  calendarSaturdayText: {
    color: Colors.primary,
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  calendarDay: {
    width: "14.28%", // 7분의 1
    aspectRatio: 1, // 정사각형 유지
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
    position: "absolute",
    bottom: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
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
    justifyContent: "center",
    alignItems: "center",
  },

  multipleEventText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },

  calendarDayTextOther: {
    color: Colors.gray400,
  },

  calendarDayTextToday: {
    color: Colors.white, // 흰색 텍스트로 선명한 대비
    fontWeight: "700",
  },

  calendarDayTextWithEvents: {
    fontWeight: "600",
    color: "rgba(0, 122, 255, 0.9)", // iOS 블루 진한 색상
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
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
    paddingLeft: 4,
  },

  monthlyTicketsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191F28",
    marginBottom: 12,
    marginTop: 4,
    letterSpacing: -0.2,
  },

  ticketsList: {
    gap: 12,
  },

  eventTicket: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingRight: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  ticketDateSection: {
    width: 54,
    alignItems: "center",
    marginLeft: 12,
    marginRight: 12,
  },

  ticketDay: {
    fontSize: 22,
    fontWeight: "700",
    color: "#191F28",
    lineHeight: 26,
    letterSpacing: -0.3,
  },

  ticketWeekday: {
    fontSize: 12,
    color: "#8B95A1",
    marginTop: 2,
    fontWeight: "500",
  },

  ticketContent: {
    flex: 1,
  },

  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  ticketTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#191F28",
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },

  ticketTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  ticketTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  ticketLocation: {
    fontSize: 13,
    color: "#8B95A1",
    marginBottom: 2,
    fontWeight: "400",
  },

  ticketTime: {
    fontSize: 12,
    color: "#8B95A1",
  },

  ticketAction: {
    marginLeft: 8,
    paddingHorizontal: 4,
  },

  // 티켓 없음 상태
  noTicketsContainer: {
    alignItems: "center",
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
    fontWeight: "600",
    color: Colors.white,
  },

  // 내가 주최한 경조사 페이지네이션
  hostedPaginationContainer: {
    height: 38,
    marginTop: 8,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  hostedPaginationArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  hostedPaginationArrowDisabled: {
    opacity: 0.55,
  },
  hostedPaginationDots: {
    minHeight: 30,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  hostedPaginationDotHitSlop: {
    width: 18,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  hostedPaginationDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#D1D6DC",
  },
  hostedPaginationDotActive: {
    width: 16,
    backgroundColor: "#191F28",
  },

  // 페이지네이션 스타일
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 16,
  },

  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },

  paginationButtonDisabled: {
    opacity: 0.3,
  },

  paginationInfo: {
    minWidth: 92,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F7F8FA",
    alignItems: "center",
    justifyContent: "center",
  },
  paginationInfoText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#191F28",
    lineHeight: 18,
  },
  paginationInfoSubText: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#8B95A1",
    lineHeight: 14,
  },

  paginationDots: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    zIndex: 1,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },

  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "10",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },

  selectedDateText: {
    fontSize: 16,
    fontWeight: "600",
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
    flexDirection: "row",
    gap: 12,
  },

  eventModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  eventModeButtonTextActive: {
    color: Colors.white,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  eventTypeButtons: {
    flexDirection: "row",
    gap: 12,
  },

  eventTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "600",
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
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingTop: 8,
  },

  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  modalAddButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  modalAddButtonDisabled: {
    backgroundColor: Colors.gray200,
  },

  modalAddButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  eventModalTitle: {
    fontSize: 24,
    fontWeight: "700",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  eventListItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray900,
    flex: 1,
  },

  eventListItemBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  eventListItemBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
    marginLeft: 4,
  },

  eventListItemLocation: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },

  addEventFromListButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginLeft: 8,
  },

  // Toss 스타일 모달 스타일
  tossModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  tossModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    minHeight: 300,
  },

  tossModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  tossModalTitle: {
    fontSize: 20,
    fontWeight: "700",
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
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
  },

  tossEventTypeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },

  tossEventInfo: {
    flex: 1,
  },

  tossEventTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  tossEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray900,
    flex: 1,
    marginRight: 8,
  },

  tossEventTime: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.gray500,
  },

  tossEventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },

  eventStatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },

  eventStatText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.gray500,
    marginLeft: 4,
  },

  tossModalActions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    flexDirection: "row",
    gap: 12,
  },

  tossModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },

  tossModalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray100,
  },

  tossModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  tossModalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray700,
  },

  // 성공 모달 스타일
  tossSuccessContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: "center",
    minHeight: 200,
    justifyContent: "center",
  },

  tossSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  tossSuccessTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: 8,
    textAlign: "center",
  },

  tossSuccessMessage: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  tossSuccessButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },

  tossSuccessButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  // 추가 토스 모달 스타일
  tossModalSubtitle: {
    fontSize: 16,
    color: Colors.gray600,
    marginTop: 8,
    textAlign: "left",
  },

  tossEventContent: {
    flex: 1,
  },

  tossEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray900,
  },

  tossModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray700,
  },

  tossSuccessSubtitle: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: "center",
    marginBottom: 20,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 위젯 공통
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  widgetSection: {
    marginBottom: 8,
  },
  widgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  widgetAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3182F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  widgetAddButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  widgetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── 품앗이 장부 (pm prefix) ──
  reciprocitySection: {
    marginBottom: 28,
  },
  thankHomeSection: {
    marginBottom: 28,
  },
  thankHomeCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EEF8",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#2D6CDF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  thankHomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  thankHomeTextBox: {
    flex: 1,
    minWidth: 0,
  },
  thankHomeTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  thankHomeSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0,
  },
  reciprocityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  reciprocityTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  reciprocitySubTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    color: "#8B95A1",
  },
  reciprocityUnreadPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EBF3FE",
  },
  reciprocityHeaderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 5,
    paddingLeft: 8,
  },
  reciprocityUnreadText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4E5968",
    letterSpacing: 0,
  },
  reciprocityEmptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF1F4",
  },
  reciprocityEmptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F9FF",
  },
  reciprocityEmptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#191F28",
  },
  reciprocityEmptyText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    color: "#8B95A1",
  },
  reciprocityList: {
    gap: 10,
  },
  reciprocityCard: {
    padding: 0,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE4EC",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  reciprocityCardUnread: {
    borderColor: "#D5E0EF",
    backgroundColor: "#FFFFFF",
  },
  reciprocityCardGlow: {
    position: "absolute",
    right: -36,
    top: -42,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#EEF6FF",
  },
  reciprocityCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
    paddingLeft: 18,
    paddingRight: 12,
    paddingTop: 18,
    paddingBottom: 16,
  },
  reciprocityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F6FF",
    position: "relative",
    marginTop: 4,
  },
  reciprocityAvatarText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#2F5C9B",
    letterSpacing: 0,
  },
  reciprocityAvatarBadge: {
    position: "absolute",
    right: -7,
    bottom: -2,
    width: 24,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#3182F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#3182F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  reciprocityAvatarImage: {
    width: 42,
    height: 42,
  },
  reciprocityCardContent: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 0,
  },
  reciprocityCardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  reciprocityCardSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: "#6B7684",
    letterSpacing: 0,
  },
  reciprocityAmountText: {
    color: "#3182F6",
    fontWeight: "900",
  },
  reciprocityEventDateText: {
    marginTop: 13,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: "#6B7684",
    letterSpacing: 0,
  },
  reciprocityChipRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reciprocityChipPrimary: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#E8F3FF",
  },
  reciprocityChipPrimaryText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    color: "#3182F6",
    letterSpacing: 0,
  },
  reciprocityChipMuted: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F2F4F6",
  },
  reciprocityChipMutedText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    color: "#4E5968",
    letterSpacing: 0,
  },
  reciprocityChipDone: {
    backgroundColor: "#E7F8EF",
  },
  reciprocityChipDoneText: {
    color: "#009D6A",
  },
  reciprocityCardChevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 4,
  },
  reciprocityPhoneRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reciprocityPhoneText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#8B95A1",
  },
  reciprocityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3182F6",
  },
  reciprocityMemoryBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#EEF1F4",
  },
  reciprocityMemoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B95A1",
  },
  reciprocityMemoryText: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900",
    color: "#191F28",
  },
  reciprocityMemorySubText: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#8B95A1",
  },
  reciprocityActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 13,
  },
  reciprocityHintText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#8B95A1",
  },
  reciprocityPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#3182F6",
  },
  reciprocityPrimaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  reciprocitySummaryBar: {
    minHeight: 38,
    borderTopWidth: 1,
    borderTopColor: "#E5EAF1",
    backgroundColor: "#FBFDFF",
    flexDirection: "row",
    alignItems: "center",
  },
  reciprocitySummaryItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    gap: 3,
  },
  reciprocitySummaryDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#DDE4EC",
  },
  reciprocitySummaryLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    color: "#6B7684",
    letterSpacing: 0,
  },
  reciprocitySummaryValue: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900",
    color: "#3182F6",
    letterSpacing: 0,
  },
  reciprocitySheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  reciprocitySheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: "rgba(0, 0, 0, 0.32)",
  },
  reciprocitySheetBackdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  reciprocitySheet: {
    position: "relative",
    maxHeight: "86%",
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 26 : 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#FFFFFF",
    zIndex: 2,
  },
  reciprocitySheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D1D6DB",
    marginBottom: 16,
  },
  reciprocitySheetHero: {
    position: "relative",
    paddingRight: 48,
  },
  reciprocitySheetEyebrow: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: "#3182F6",
  },
  reciprocitySheetHeroTitle: {
    marginTop: 7,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  reciprocitySheetHeroSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#6B7684",
  },
  reciprocitySheetPersonCard: {
    marginTop: 20,
    minHeight: 92,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5EAF1",
    backgroundColor: "#F9FBFD",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reciprocitySheetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F6FF",
    position: "relative",
    flexShrink: 0,
  },
  reciprocitySheetAvatarText: {
    fontSize: 23,
    fontWeight: "900",
    color: "#2F5C9B",
  },
  reciprocitySheetAvatarBadge: {
    position: "absolute",
    right: -5,
    bottom: 0,
    width: 26,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3182F6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  reciprocitySheetPersonText: {
    flex: 1,
    minWidth: 0,
  },
  reciprocitySheetPersonName: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    color: "#191F28",
  },
  reciprocitySheetPhone: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#8B95A1",
  },
  reciprocitySheetAmountCard: {
    minWidth: 124,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 17,
    backgroundColor: "#E8F3FF",
  },
  reciprocitySheetAmountLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: "#3182F6",
  },
  reciprocitySheetAmountValue: {
    marginTop: 5,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    color: "#3182F6",
  },
  reciprocitySheetClose: {
    position: "absolute",
    top: 5,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F6",
  },
  reciprocitySheetSummary: {
    marginTop: 14,
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#FBFDFF",
    borderWidth: 1,
    borderColor: "#E5EAF1",
  },
  reciprocitySheetSummaryItem: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  reciprocitySheetSummaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#DDE4EC",
  },
  reciprocitySheetSummaryLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: "#8B95A1",
  },
  reciprocitySheetSummaryValue: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: "#191F28",
  },
  reciprocitySheetSummaryValueBlue: {
    color: "#3182F6",
  },
  reciprocitySheetScroll: {
    marginTop: 0,
    flexGrow: 0,
    flexShrink: 1,
  },
  reciprocitySheetScrollContent: {
    paddingBottom: 14,
    gap: 20,
  },
  reciprocitySheetBlock: {
    gap: 10,
  },
  reciprocitySheetBlockTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: "#191F28",
  },
  reciprocitySheetNewEvent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 138,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAF1",
  },
  reciprocitySheetNewEventBar: {
    width: 5,
    height: 88,
    borderRadius: 3,
    backgroundColor: "#3182F6",
  },
  reciprocitySheetNewEventBody: {
    flex: 1,
    minWidth: 0,
  },
  reciprocitySheetNewEventSide: {
    width: 122,
    alignItems: "stretch",
    gap: 10,
  },
  reciprocitySheetEventType: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    color: "#3182F6",
  },
  reciprocitySheetNewEventTitle: {
    marginTop: 7,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: "#191F28",
  },
  reciprocitySheetNewEventSub: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#6B7684",
  },
  reciprocitySheetStatusPill: {
    alignSelf: "flex-end",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#F2F4F6",
  },
  reciprocitySheetStatusDone: {
    backgroundColor: "#E7F8EF",
  },
  reciprocitySheetStatusText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    color: "#6B7684",
  },
  reciprocitySheetStatusDoneText: {
    color: "#009D6A",
  },
  reciprocitySheetInviteButton: {
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3182F6",
  },
  reciprocitySheetInviteText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  reciprocitySheetHistoryHeader: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reciprocitySheetCountPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F2F4F6",
  },
  reciprocitySheetCountText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    color: "#6B7684",
  },
  reciprocitySheetTimeline: {
    position: "relative",
    gap: 10,
    paddingLeft: 28,
  },
  reciprocitySheetTimelineLine: {
    position: "absolute",
    left: 8,
    top: 11,
    bottom: 11,
    width: 2,
    borderRadius: 16,
    backgroundColor: "#DDE4EC",
  },
  reciprocitySheetEmptyText: {
    paddingVertical: 16,
    fontSize: 13,
    fontWeight: "700",
    color: "#8B95A1",
  },
  reciprocitySheetHistoryRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  reciprocitySheetHistoryDot: {
    position: "absolute",
    left: -28,
    top: 25,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#B0B8C1",
    zIndex: 2,
  },
  reciprocitySheetHistoryDotActive: {
    backgroundColor: "#3182F6",
  },
  reciprocitySheetHistoryCard: {
    flex: 1,
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAF1",
  },
  reciprocitySheetHistoryTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#191F28",
  },
  reciprocitySheetHistorySub: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#8B95A1",
  },
  reciprocitySheetHistoryMeta: {
    alignItems: "flex-end",
    gap: 7,
  },
  reciprocitySheetHistoryAmount: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#3182F6",
  },
  reciprocitySheetHistoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F2F4F6",
  },
  reciprocitySheetHistoryBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7684",
  },
  reciprocitySheetActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
  },
  reciprocitySheetLaterButton: {
    width: 132,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F6",
  },
  reciprocitySheetLaterText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6B7684",
  },
  reciprocitySheetDoneButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3182F6",
  },
  reciprocitySheetDoneButtonCompleted: {
    backgroundColor: "#3182F6",
    opacity: 0.72,
  },
  reciprocitySheetDoneText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  reciprocityPager: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  reciprocityPageButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EBF3FE",
    borderWidth: 1,
    borderColor: "#D7E9FF",
  },
  reciprocityPageButtonDisabled: {
    backgroundColor: "#F2F4F6",
    borderColor: "#EEF1F4",
  },
  reciprocityPageText: {
    minWidth: 44,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    color: "#4E5968",
  },
  pmSection: {
    paddingBottom: 8,
  },
  pmSectionHidden: {
    display: "none",
  },
  pmHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pmHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191F28",
  },
  pmAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#EBF3FE",
    borderRadius: 20,
  },
  pmAddBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3182F6",
  },
  pmSummaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pmSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  pmSummaryDivider: {
    width: 1,
    backgroundColor: "#F2F4F6",
    marginHorizontal: 16,
  },
  pmSummaryLabel: {
    fontSize: 12,
    color: "#8B95A1",
    marginBottom: 6,
    fontWeight: "500",
  },
  pmSummaryAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3182F6",
    letterSpacing: -0.5,
  },
  pmTabRow: {
    flexDirection: "row",
    backgroundColor: "#F2F4F6",
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  pmTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },
  pmTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pmTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8B95A1",
  },
  pmTabTextActive: {
    fontWeight: "700",
    color: "#191F28",
  },
  pmCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  pmFilterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
    backgroundColor: "#FAFBFC",
  },
  pmFilterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E8EB",
    backgroundColor: "#FFFFFF",
  },
  pmFilterBtnActive: {
    borderColor: "#3182F6",
    backgroundColor: "#EBF2FF",
  },
  pmFilterBtnText: {
    flex: 1,
    fontSize: 13,
    color: "#4E5968",
    fontWeight: "500",
  },
  pmFilterBtnTextActive: {
    color: "#3182F6",
    fontWeight: "600",
  },
  pmFilterClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F2F4F6",
    borderWidth: 1,
    borderColor: "#E5E8EB",
  },
  pmFilterClearText: {
    fontSize: 12,
    color: "#6B7684",
    fontWeight: "600",
  },
  pmRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  pmRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
  },
  pmStatusBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  pmAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EBF3FE",
    alignItems: "center",
    justifyContent: "center",
  },
  pmAvatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3182F6",
  },
  pmRowInfo: {
    flex: 1,
  },
  pmRowName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#191F28",
  },
  pmRowSub: {
    fontSize: 12,
    color: "#8B95A1",
    marginTop: 2,
  },
  pmRowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  pmRowAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3182F6",
  },
  pmGaveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#3182F6",
    borderRadius: 8,
    marginTop: 2,
  },
  pmGaveBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pmPagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F6",
    gap: 6,
  },
  pmPageBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EBF3FE",
    alignItems: "center",
    justifyContent: "center",
  },
  pmPageBtnDisabled: {
    backgroundColor: "#F2F4F6",
  },
  pmPageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#191F28",
    minWidth: 50,
    textAlign: "center",
  },
  pmSettleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#FFF0F0",
    borderRadius: 6,
  },
  pmSettleBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF3B30",
  },
  pmSettledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "#F2F4F6",
    borderRadius: 6,
  },
  pmSettledText: {
    fontSize: 11,
    color: "#8B95A1",
    fontWeight: "500",
  },
  pmEmpty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  pmEmptyText: {
    fontSize: 14,
    color: "#8B95A1",
    fontWeight: "500",
  },
  pmEmptySubText: {
    fontSize: 12,
    color: "#B0B8C1",
  },
  pmViewAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F6",
    gap: 4,
  },
  pmViewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3182F6",
  },
  // 토스 바텀시트 공통
  tossSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  tossSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E8EB",
    alignSelf: "center",
    marginBottom: 20,
  },
  tossSheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#191F28",
    marginBottom: 8,
  },
  tossSheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
  },
  tossSheetRowText: {
    fontSize: 16,
    color: "#191F28",
    fontWeight: "500",
    flex: 1,
  },
  tossSheetRowTextActive: { color: "#3182F6", fontWeight: "700" },
  tossSheetRowSub: { fontSize: 12, color: "#8B95A1", marginTop: 2 },
  tossRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D6DB",
    marginRight: 14,
  },
  tossRadioActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3182F6",
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tossRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  tossSheetCancel: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  tossSheetBack: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
    marginTop: 4,
  },
  tossSheetCancelText: { fontSize: 16, color: "#8B95A1", fontWeight: "600" },
  tossNextBtn: {
    backgroundColor: "#3182F6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  tossNextBtnDisabled: {
    backgroundColor: "#F2F4F6",
  },
  tossNextBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tossNextBtnTextDisabled: {
    color: "#8B95A1",
  },
  // 줬음 기록 입력
  tossInputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B95A1",
    marginTop: 14,
    marginBottom: 6,
  },
  tossInput: {
    backgroundColor: "#F2F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#191F28",
  },
  tossCancelBtn: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: "#F2F4F6",
    borderRadius: 12,
    alignItems: "center",
  },
  tossCancelBtnText: { fontSize: 15, fontWeight: "700", color: "#8B95A1" },
  tossPrimaryBtn: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: "#3182F6",
    borderRadius: 12,
    alignItems: "center",
  },
  tossPrimaryBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  // 품앗이 모달
  pumasiModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    marginTop: "auto",
  },
  pumasiModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191F28",
    marginBottom: 20,
  },
  pumasiModalSection: {
    marginBottom: 12,
  },
  pumasiModalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B95A1",
    marginBottom: 6,
    marginTop: 12,
  },
  pumasiInput: {
    backgroundColor: "#F2F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#191F28",
  },
  guestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F2F4F6",
    borderRadius: 20,
    marginRight: 8,
  },
  guestChipActive: {
    backgroundColor: "#3182F6",
  },
  guestChipText: {
    fontSize: 13,
    color: "#191F28",
  },
  guestChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pumasiModalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  pumasiCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#F2F4F6",
    borderRadius: 12,
    alignItems: "center",
  },
  pumasiCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8B95A1",
  },
  pumasiSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#3182F6",
    borderRadius: 12,
    alignItems: "center",
  },
  pumasiSaveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // 일정 없음 컨테이너
  noEventsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  noEventsText: {
    fontSize: 15,
    color: "#191F28",
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },

  noEventsSubText: {
    fontSize: 13,
    color: "#8B95A1",
    fontWeight: "400",
  },

  creditShortageOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
    backgroundColor: "rgba(15, 23, 42, 0.52)",
  },
  creditShortageCard: {
    width: "100%",
    maxWidth: 366,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  creditShortageClose: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  creditShortageIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
    overflow: "hidden",
  },
  creditShortageIconBack: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#FDE68A",
    opacity: 0.45,
    transform: [{ rotate: "-12deg" }],
  },
  creditShortageTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  creditShortageDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4B5563",
    textAlign: "center",
  },
  creditShortageSummary: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  creditShortageSummaryItem: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  creditShortageSummaryDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  creditShortageSummaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
    marginBottom: 5,
  },
  creditShortageSummaryValue: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "900",
  },
  creditShortageRequiredValue: {
    color: "#B45309",
  },
  creditShortageNotice: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
  },
  creditShortageNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#0F766E",
    fontWeight: "700",
  },
  creditShortageButton: {
    width: "100%",
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center",
    backgroundColor: "#111827",
  },
  creditShortageButtonText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "800",
  },

  eventCreationWelcomeOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
    backgroundColor: "rgba(0, 0, 0, 0.46)",
  },
  eventCreationWelcomeCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
  },
  eventCreationWelcomeIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#E7F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  eventCreationWelcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#191F28",
    textAlign: "center",
    marginBottom: 12,
  },
  eventCreationWelcomeDesc: {
    fontSize: 14,
    color: "#4E5968",
    lineHeight: 22,
    textAlign: "center",
  },
  eventCreationWelcomeNotice: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#FFF7E6",
  },
  eventCreationWelcomeNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#8B5E00",
    fontWeight: "600",
  },
  eventCreationWelcomeButton: {
    width: "100%",
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#0F766E",
  },
  eventCreationWelcomeButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // 경조사 만들기 바텀시트 모달
  createEventModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  createEventModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  createEventModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray200,
    alignSelf: "center",
    marginBottom: 20,
  },
  createEventModalTitle: {
    fontSize: 20,
    fontWeight: "700",
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
    overflow: "hidden",
  },
  createEventModalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  createEventModalOptionDisabled: {
    opacity: 0.55,
  },
  createEventModalOptionComingSoon: {
    opacity: 0.78,
  },
  createEventModalIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  createEventModalOptionInfo: {
    flex: 1,
  },
  createEventModalOptionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 2,
  },
  createEventModalOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  createEventModalComingSoonBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#EEF2F7",
  },
  createEventModalComingSoonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
  },
  createEventModalOptionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  createEventModalCreditText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    color: "#0F766E",
  },
  createEventModalCreditTextPaid: {
    color: "#D97706",
  },
  createEventModalDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginHorizontal: 16,
  },
  createEventModalCancelBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.gray100,
    borderRadius: 12,
  },
  createEventModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
