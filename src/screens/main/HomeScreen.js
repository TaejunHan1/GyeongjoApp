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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../styles/constants';
import { supabase } from '../../lib/supabase';
import { 
  getUserEvents, 
  getActiveEvents, 
  debugUserInfo,
  getEventGuestBook,
  getMonthlyStatistics 
} from '../../lib/supabaseHelper';
import Svg, { Rect, Circle, Path, Ellipse, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// 🔥 커스텀 SVG 아이콘 컴포넌트들
const WeddingIcon = () => (
  <Svg width="64" height="64" viewBox="0 0 90 90" fill="none">
    <Rect width="90" height="90" rx="18" fill="#FFF"/>
    <Rect x="20" y="18" width="50" height="60" rx="8" fill="#EAF3FF" stroke="#0064FF" strokeWidth="2"/>
    <Rect x="28" y="26" width="34" height="14" rx="4" fill="#FFF"/>
    <Rect x="32" y="44" width="26" height="5" rx="2.5" fill="#BBD5FF"/>
    <Circle cx="45" cy="62" r="8" fill="#FFF7F0" stroke="#FFAA64" strokeWidth="2"/>
    <Path d="M40 59 Q45 69 50 59" stroke="#FFAA64" strokeWidth="1.5" fill="none"/>
    <Ellipse cx="43" cy="61.5" rx="1.6" ry="2.2" fill="#FF7F63"/>
    <Ellipse cx="47" cy="61.5" rx="1.6" ry="2.2" fill="#FF7F63"/>
    <Rect x="41.5" y="65" width="7" height="1.6" rx="0.8" fill="#FFAA64"/>
  </Svg>
);

const FuneralIcon = () => (
  <Svg width="64" height="64" viewBox="0 0 90 90" fill="none">
    <Rect width="90" height="90" rx="18" fill="#FFF"/>
    <Rect x="20" y="18" width="50" height="60" rx="8" fill="#F4F4F5" stroke="#A8B3C7" strokeWidth="2"/>
    <Rect x="28" y="26" width="34" height="14" rx="4" fill="#FFF"/>
    <Rect x="32" y="44" width="26" height="5" rx="2.5" fill="#E3E6EE"/>
    <G>
      <Ellipse cx="45" cy="62" rx="7.5" ry="9" fill="#FFF" stroke="#A8B3C7" strokeWidth="2"/>
      <Rect x="41" y="70" width="8" height="3" rx="1.5" fill="#A8B3C7"/>
      <Rect x="44" y="56.2" width="2" height="7" rx="1" fill="#A8B3C7"/>
      <Ellipse cx="45" cy="56" rx="4" ry="2.2" fill="#A8B3C7" opacity="0.4"/>
      <Path d="M41.5 63 C43 66, 47 66, 48.5 63" stroke="#BCC5D2" strokeWidth="1.2" fill="none"/>
    </G>
  </Svg>
);

export default function HomeScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTab, setSelectedTab] = useState('active'); // 'active' or 'completed'
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

  // Props 확인 로그
  useEffect(() => {
    console.log('🏠 HomeScreen props:', { 
      hasUserInfo: !!userInfo, 
      hasSession: !!session, 
      isAuthenticated,
      userInfo: userInfo ? { userId: userInfo.userId, userName: userInfo.userName } : null
    });
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

  // 화면 포커스 시 데이터 새로고침 - 중복 호출 방지
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 화면 포커스 - 데이터 로드 시작');
      loadUserData();
      loadEvents();
      loadActiveEvents();
      loadMonthlyStatistics(); // 🔥 월별 통계 로드 추가
    }, [userInfo, session])
  );

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

  // 🔥 월별 통계 로드 함수
  const loadMonthlyStatistics = async () => {
    try {
      console.log('📊 월별 통계 로드 시작');
      
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
        console.log('❌ 사용자 ID 없음 - 통계 로드 불가');
        return;
      }
      
      const result = await getMonthlyStatistics(currentUserId);
      
      if (result.success) {
        console.log('✅ 월별 통계 로드 성공:', result.data);
        setMonthlyStats(result.data);
      } else {
        console.error('❌ 월별 통계 로드 실패:', result.error);
      }
      
    } catch (error) {
      console.error('❌ 월별 통계 로드 예외:', error);
    }
  };

  // 🔥 서울 시간 기준 날짜 비교 함수 - 완전히 새로 작성
  const isEventCompleted = (eventDate) => {
    if (!eventDate) return true; // 미정인 경우 완료로 처리
    
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
      console.error('❌ 날짜 오류:', error);
      return true;
    }
  };

  // 🔥 개선된 사용자 정보 로드 함수 - 명확한 우선순위
  const loadUserData = async () => {
    try {
      console.log('👤 사용자 정보 로드 시작');
      
      // 🔥 디버깅을 위해 사용자 정보 확인
      await debugUserInfo();
      
      // 1순위: Props로 받은 userInfo (폰 인증)
      if (userInfo?.userId) {
        console.log('✅ Props userInfo 사용:', {
          userId: userInfo.userId,
          userName: userInfo.userName,
          phone: userInfo.phone
        });
        setUser({
          id: userInfo.userId,
          user_metadata: { name: userInfo.userName },
          phone: userInfo.phone,
          auth_method: 'phone'
        });
        return;
      }
      
      // 2순위: Supabase Auth 세션
      if (session?.user) {
        console.log('✅ Supabase session 사용:', {
          id: session.user.id,
          email: session.user.email
        });
        setUser(session.user);
        return;
      }
      
      // 3순위: AsyncStorage 확인 (폰 인증)
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      if (isLoggedIn === 'true' && storedUserInfo) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        console.log('✅ AsyncStorage userInfo 사용:', {
          userId: parsedUserInfo.userId,
          userName: parsedUserInfo.userName
        });
        setUser({
          id: parsedUserInfo.userId,
          user_metadata: { name: parsedUserInfo.userName },
          phone: parsedUserInfo.phone,
          auth_method: 'phone'
        });
        return;
      }
      
      // 4순위: 직접 Supabase 조회
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ Supabase 직접 조회 성공:', {
          id: user.id,
          email: user.email
        });
        setUser(user);
      } else {
        console.log('❌ 사용자 정보 없음');
      }
      
    } catch (error) {
      console.error('❌ 사용자 정보 로드 오류:', error);
    }
  };

  // 🔥 개선된 이벤트 로드 함수 - 명확한 사용자 정보 전달
  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('📅 이벤트 로드 시작');
      
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
        console.log('📅 Props userInfo로 이벤트 조회:', currentUserInfo.id);
      } else if (session?.user) {
        // Supabase 세션 사용
        currentUserInfo = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          email: session.user.email,
          auth_method: 'supabase'
        };
        console.log('📅 Supabase session으로 이벤트 조회:', currentUserInfo.id);
      }
      
      if (!currentUserInfo) {
        console.log('❌ 사용자 정보 없음 - 이벤트 조회 불가');
        setEvents([]);
        return;
      }
      
      const result = await getUserEvents(currentUserInfo);
      
      if (result.success) {
        console.log(`✅ 이벤트 로드 완료: ${result.data?.length || 0}개`);
        setEvents(result.data || []);
      } else {
        console.error('❌ 이벤트 로드 실패:', result.error);
        setEvents([]);
      }
    } catch (error) {
      console.error('❌ 이벤트 로드 예외:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 개선된 활성 이벤트 로드 함수 - 중복 제거 및 디버깅 강화
  const loadActiveEvents = async () => {
    try {
      console.log('📅 활성 이벤트 로드 시작');
      
      // 🔥 상태 초기화
      setActiveEvents([]);
      
      const result = await getActiveEvents();
      
      if (result.success) {
        const rawData = result.data || [];
        console.log(`✅ 활성 이벤트 원본 데이터: ${rawData.length}개`);
        
        // 🔥 중복 제거 - ID 기준으로 고유한 이벤트만 필터링
        const uniqueEvents = rawData.filter((event, index, self) => 
          index === self.findIndex(e => e.id === event.id)
        );
        
        console.log(`🔧 중복 제거 후: ${uniqueEvents.length}개`);
        
        setActiveEvents(uniqueEvents);
      } else {
        console.error('❌ 활성 이벤트 로드 실패:', result.error);
        setActiveEvents([]);
      }
    } catch (error) {
      console.error('❌ 활성 이벤트 로드 예외:', error);
      setActiveEvents([]);
    }
  };

  // QR 스캔 기능
  const handleQRScan = () => {
    Alert.alert('준비중', 'QR 스캐너 기능을 준비 중입니다.');
  };

  // 🔥 수정된 빠른 시작 버튼 핸들러
  const handleQuickStart = (eventType) => {
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

  // 🔥 수정된 handleActiveEventPress 함수 - 부고 정보 포함
  const handleActiveEventPress = (event) => {
    console.log('🎭 전시모드로 이동:', event.event_name, '타입:', event.event_type);
    
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
      console.log('🎭 상주 정보 확인:', {
        eventName: event.event_name,
        familyMembersFromEvent: event.family_members?.length || 0,
        familyMembersFromAdditional: additionalInfo.family_members?.length || 0,
        finalFamilyMembers: eventData.familyMembers?.length || 0,
        familyMemberDetails: eventData.familyMembers?.map(fm => ({ 
          relation: fm.relation, 
          names: fm.names,
          hasNames: !!fm.names 
        })) || []
      });
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
      };
    }
    
    console.log('🎭 전달할 데이터:', {
      eventId: event.id,
      eventType: event.event_type,
      templateStyle,
      categorizedImages: {
        main: finalCategorizedImages.main?.length || 0,
        gallery: finalCategorizedImages.gallery?.length || 0,
        groom: finalCategorizedImages.groom?.length || 0,
        bride: finalCategorizedImages.bride?.length || 0
      },
      eventDataKeys: Object.keys(eventData),
      // 부고 전용 디버깅
      ...(event.event_type === 'funeral' && {
        funeralDebug: {
          deceasedName: eventData.deceasedName,
          familyMembersCount: eventData.familyMembers?.length || 0,
          primaryContact: eventData.primaryContact,
          funeralHome: eventData.funeralHome,
          burialLocation: eventData.burialLocation
        }
      })
    });
    
    navigation.navigate('EventDisplay', { 
      eventId: event.id,
      templateStyle: templateStyle,
      categorizedImages: finalCategorizedImages,
      eventData: eventData
    });
  };

  // 부조하기 버튼 클릭
  const handleContributePress = (event, e) => {
    e.stopPropagation(); // 부모 터치 이벤트 방지
    console.log('💰 부조하기:', event.event_name);
    navigation.navigate('Contribution', { 
      eventId: event.id, 
      eventName: event.event_name 
    });
  };

  // 🔥 수동 새로고침 함수 수정 - 통계도 포함
  const handleRefresh = async () => {
    console.log('🔄 수동 새로고침 시작');
    setLoading(true);
    await loadUserData();
    await loadEvents();
    await loadActiveEvents();
    await loadMonthlyStatistics(); // 🔥 통계 새로고침 추가
    setLoading(false);
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

  // 🔥 모든 이벤트 합치기 및 날짜 기준 분류
  const allEvents = [...activeEvents, ...events].filter((event, index, self) => 
    index === self.findIndex(e => e.id === event.id)
  );
  
  // 🔥 서울 시간 기준으로 진행중/완료 분류
  const activeEventsFiltered = allEvents.filter(event => {
    const isCompleted = isEventCompleted(event.event_date);
    return !isCompleted;
  });
  
  const completedEventsFiltered = allEvents.filter(event => {
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
          <Text style={styles.headerTitle}>정담</Text>
          <Text style={styles.headerSubtitle}>
            {userName}님 안녕하세요!
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* 🔥 디버깅용 새로고침 버튼 추가 */}
          <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
            <Ionicons name="refresh-outline" size={24} color={Colors.gray600} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleQRScan} style={styles.headerButton}>
            <Ionicons name="qr-code-outline" size={24} color={Colors.gray600} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color={Colors.gray600} />
          </TouchableOpacity>
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
            >
              <View style={styles.quickIcon}>
                <WeddingIcon />
              </View>
              <Text style={styles.quickTitle}>청첩장</Text>
              <Text style={styles.quickSubtitle}>행복한 결혼 소식을 전해보세요</Text>
              <TouchableOpacity 
                style={[styles.quickButton, { backgroundColor: Colors.wedding }]}
                onPress={() => handleQuickStart('wedding')}
              >
                <Text style={styles.quickButtonText}>만들기</Text>
              </TouchableOpacity>
              <View style={styles.quickTypeIndicator}>
                <Text style={styles.quickTypeText}>경사</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickItem}
              onPress={() => handleQuickStart('funeral')}
            >
              <View style={styles.quickIcon}>
                <FuneralIcon />
              </View>
              <Text style={styles.quickTitle}>부고장</Text>
              <Text style={styles.quickSubtitle}>슬픈 소식을 정중하게 전달하세요</Text>
              <TouchableOpacity 
                style={[styles.quickButton, { backgroundColor: Colors.funeral }]}
                onPress={() => handleQuickStart('funeral')}
              >
                <Text style={styles.quickButtonText}>만들기</Text>
              </TouchableOpacity>
              <View style={[styles.quickTypeIndicator, { backgroundColor: Colors.funeral }]}>
                <Text style={[styles.quickTypeText, { color: Colors.white }]}>조사</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔥 나의 경조사 관리 - 통합된 섹션 */}
        <View style={styles.eventsManagementSection}>
          <Text style={styles.sectionTitle}>나의 경조사 관리</Text>
          
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
                  style={[
                    styles.eventListItem,
                    selectedTab === 'completed' && styles.completedEventItem
                  ]}
                  onPress={() => handleActiveEventPress(event)}
                  activeOpacity={0.8}
                >
                  {/* 🔥 완료된 항목에 왼쪽 파란색 바 */}
                  {selectedTab === 'completed' && (
                    <View style={styles.completedMarker} />
                  )}

                  {/* 🔥 이벤트 타입 표시 (왼쪽) */}
                  <View style={styles.eventTypeColumn}>
                    <View style={[
                      styles.eventTypeBadge, 
                      { backgroundColor: getEventStatusColor(event.event_type) }
                    ]}>
                      <Text style={styles.eventTypeBadgeText}>
                        {getEventTypeText(event.event_type)}
                      </Text>
                    </View>
                  </View>

                  {/* 이벤트 정보 */}
                  <View style={styles.eventListInfo}>
                    <Text style={styles.eventListTitle} numberOfLines={1}>
                      {event.event_name}
                    </Text>
                    
                    <Text style={styles.eventListLocation}>
                      {event.location || '장소 미정'}
                    </Text>
                    
                    <Text style={styles.eventListDate} numberOfLines={1}>
                      {event.event_date ? formatDate(event.event_date) : '날짜 미정'}
                    </Text>
                  </View>

                  {/* 🔥 완료/화살표 */}
                  {selectedTab === 'completed' ? (
                    <TouchableOpacity 
                      style={styles.completedButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        // 완료 버튼 클릭 시 동작 (예: 통계 보기, 상세 보기 등)
                        console.log('완료 버튼 클릭:', event.event_name);
                      }}
                    >
                      <Text style={styles.completedButtonText}>완료</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.eventArrow}>
                      <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                    </View>
                  )}
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
                  onPress={() => navigation.navigate('CreateEvent')}
                >
                  <Text style={styles.createButtonText}>경조사 만들기</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 🔥 통계 요약 - 완전히 새로운 디자인 */}
        <View style={styles.statsSection}>
          <View style={styles.statsSectionHeader}>
            <Text style={styles.sectionTitle}>
              {monthlyStats.period?.monthName || new Date().toLocaleDateString('ko-KR', { month: 'long' })} 경조사 현황
            </Text>
            <TouchableOpacity 
              onPress={handleStatisticsDetail}
              style={styles.statsDetailButton}
            >
              <Text style={styles.statsDetailButtonText}>전체보기</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* 🔥 이번 달 받은 금액 요약 카드 */}
          {monthlyStats.receivedAmount > 0 || monthlyStats.totalContributions > 0 ? (
            <>
              <View style={styles.monthlyReceivedCard}>
                <View style={styles.monthlyCardHeader}>
                  <View style={styles.monthlyCardIconContainer}>
                    <Ionicons name="wallet" size={24} color={Colors.white} />
                  </View>
                  <View style={styles.monthlyCardTitleSection}>
                    <Text style={styles.monthlyCardTitle}>이번 달 받은 금액</Text>
                    <Text style={styles.monthlyCardSubtitle}>총 {monthlyStats.totalContributions}건</Text>
                  </View>
                </View>
                
                <Text style={styles.monthlyTotalAmount}>
                  {formatAmount(monthlyStats.receivedAmount)}
                </Text>

                {/* 타입별 분류 */}
                <View style={styles.monthlyTypeBreakdown}>
                  {monthlyStats.monthlyWeddingAmount > 0 && (
                    <View style={styles.typeBreakdownItem}>
                      <View style={[styles.typeIndicator, { backgroundColor: Colors.wedding }]} />
                      <Text style={styles.typeLabel}>축의금</Text>
                      <Text style={styles.typeAmount}>
                        {formatAmount(monthlyStats.monthlyWeddingAmount)}
                      </Text>
                    </View>
                  )}
                  {monthlyStats.monthlyFuneralAmount > 0 && (
                    <View style={styles.typeBreakdownItem}>
                      <View style={[styles.typeIndicator, { backgroundColor: Colors.funeral }]} />
                      <Text style={styles.typeLabel}>부조금</Text>
                      <Text style={styles.typeAmount}>
                        {formatAmount(monthlyStats.monthlyFuneralAmount)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 🔥 이벤트별 상세 내역 - 중요! */}
              {monthlyStats.eventDetails && monthlyStats.eventDetails.length > 0 && (
                <View style={styles.eventBreakdownCard}>
                  <Text style={styles.eventBreakdownTitle}>경조사별 상세</Text>
                  {monthlyStats.eventDetails.map((detail, index) => (
                    <View 
                      key={`${detail.eventId}-${index}`} 
                      style={[
                        styles.eventBreakdownItem,
                        index === monthlyStats.eventDetails.length - 1 && styles.lastBreakdownItem
                      ]}
                    >
                      <View style={styles.eventBreakdownLeft}>
                        <View style={[
                          styles.eventTypeIcon,
                          { backgroundColor: detail.eventType === 'wedding' ? Colors.wedding : Colors.funeral }
                        ]}>
                          <Ionicons 
                            name={detail.eventType === 'wedding' ? 'heart' : 'flower'} 
                            size={14} 
                            color={Colors.white} 
                          />
                        </View>
                        <View style={styles.eventBreakdownInfo}>
                          <Text style={styles.eventBreakdownName} numberOfLines={1}>
                            {detail.eventName}
                          </Text>
                          <Text style={styles.eventBreakdownType}>
                            {detail.eventType === 'wedding' ? '결혼식' : '부고'} · {detail.count}건
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.eventBreakdownAmount}>
                        {formatAmount(detail.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noMonthlyDataCard}>
              <Ionicons name="calendar-clear-outline" size={48} color={Colors.gray300} />
              <Text style={styles.noMonthlyDataText}>이번 달 경조사 데이터가 없습니다</Text>
              <Text style={styles.noMonthlyDataSubtext}>새로운 경조사를 만들어보세요</Text>
            </View>
          )}

          {/* 🔥 보낸 금액 섹션 (미구현 상태 표시) */}
          <View style={styles.sentMoneySection}>
            <View style={styles.sentMoneySectionHeader}>
              <Text style={styles.sentMoneySectionTitle}>이번 달 보낸 금액</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>준비중</Text>
              </View>
            </View>
            <Text style={styles.sentMoneySectionDescription}>
              다른 경조사에 참여한 내역을 관리하는 기능을 준비하고 있습니다
            </Text>
          </View>

          {/* 🔥 전체 누적 통계 */}
          <View style={styles.totalStatsContainer}>
            <Text style={styles.totalStatsTitle}>전체 누적 통계</Text>
            <View style={styles.totalStatsGrid}>
              <View style={styles.totalStatItem}>
                <Ionicons name="calendar" size={24} color={Colors.primary} />
                <Text style={styles.totalStatValue}>{monthlyStats.totalEvents}</Text>
                <Text style={styles.totalStatLabel}>전체 경조사</Text>
              </View>
              <View style={styles.totalStatItem}>
                <Ionicons name="people" size={24} color={Colors.success} />
                <Text style={styles.totalStatValue}>{monthlyStats.totalEntries}</Text>
                <Text style={styles.totalStatLabel}>누적 참여자</Text>
              </View>
              <View style={styles.totalStatItem}>
                <Ionicons name="cash" size={24} color={Colors.warning} />
                <Text style={styles.totalStatValue}>
                  {monthlyStats.totalAmount >= 1000000 
                    ? `${Math.floor(monthlyStats.totalAmount / 10000)}만원`
                    : formatAmount(monthlyStats.totalAmount)
                  }
                </Text>
                <Text style={styles.totalStatLabel}>누적 금액</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    case 'wedding': return '결혼식';
    case 'funeral': return '부고';
    default: return '행사';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '날짜 미정';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // 이벤트 리스트 아이템
  eventsList: {
    gap: 12,
  },
  eventListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  
  // 🔥 완료된 이벤트 아이템 (왼쪽 여백 추가)
  completedEventItem: {
    paddingLeft: 20,
  },
  
  // 🔥 완료된 항목 왼쪽 파란색 마커
  completedMarker: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  
  // 🔥 이벤트 타입 컬럼 (왼쪽)
  eventTypeColumn: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  eventTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 이벤트 정보
  eventListInfo: {
    flex: 1,
  },
  eventListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  eventListLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  eventListDate: {
    fontSize: 13,
    color: Colors.gray400,
    lineHeight: 16,
  },
  
  // 화살표
  eventArrow: {
    marginLeft: 12,
  },
  
  // 🔥 완료 버튼
  completedButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
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
  
  // 🔥 완전히 새로운 통계 섹션 스타일
  statsSection: {
    marginBottom: 40,
  },
  
  statsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  statsDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  statsDetailButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // 이번 달 받은 금액 카드
  monthlyReceivedCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  
  monthlyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  monthlyCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  monthlyCardTitleSection: {
    flex: 1,
  },
  
  monthlyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  
  monthlyCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  
  monthlyTotalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 20,
  },
  
  monthlyTypeBreakdown: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
    gap: 12,
  },
  
  typeBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  
  typeLabel: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  
  typeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 이벤트별 상세 내역 카드
  eventBreakdownCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  eventBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  
  eventBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  
  lastBreakdownItem: {
    borderBottomWidth: 0,
  },
  
  eventBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  eventTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  eventBreakdownInfo: {
    flex: 1,
  },
  
  eventBreakdownName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  
  eventBreakdownType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  
  eventBreakdownAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  
  // 데이터 없음 카드
  noMonthlyDataCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  
  noMonthlyDataText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  
  noMonthlyDataSubtext: {
    fontSize: 14,
    color: Colors.gray500,
  },
  
  // 보낸 금액 섹션
  sentMoneySection: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  
  sentMoneySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  sentMoneySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  
  comingSoonBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  
  sentMoneySectionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  
  // 전체 누적 통계
  totalStatsContainer: {
    marginTop: 8,
  },
  
  totalStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  
  totalStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  
  totalStatItem: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  
  totalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  
  totalStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});