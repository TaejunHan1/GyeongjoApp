// src/screens/main/HomeScreen.js - 중복 이벤트 문제 해결
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
import { getUserEvents, getActiveEvents, debugUserInfo } from '../../lib/supabaseHelper';
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
      
      // console.log('📅 날짜 확인:', {
      //   이벤트날짜: eventDate,
      //   이벤트날짜만: eventDateOnly.toLocaleDateString('ko-KR'),
      //   오늘날짜: today.toLocaleDateString('ko-KR'),
      //   완료여부: isCompleted ? '완료' : '진행중',
      //   비교: `${eventDateOnly.getTime()} < ${today.getTime()} = ${isCompleted}`
      // });
      
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
        
        // 🔍 각 이벤트 상세 로그
        uniqueEvents.forEach((event, index) => {
          // console.log(`🎭 고유 이벤트 ${index + 1}:`, {
          //   id: event.id,
          //   name: event.event_name,
          //   type: event.event_type,
          //   created_at: event.created_at,
          //   user_id: event.user_id
          // });
        });
        
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

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // AsyncStorage 정리
              await AsyncStorage.removeItem('userInfo');
              await AsyncStorage.removeItem('isLoggedIn');
              
              // Supabase 로그아웃
              await supabase.auth.signOut();
              
              console.log('✅ 로그아웃 완료');
            } catch (error) {
              console.error('❌ 로그아웃 오류:', error);
            }
          },
        },
      ]
    );
  };

  // QR 스캔 기능
  const handleQRScan = () => {
    Alert.alert('준비중', 'QR 스캐너 기능을 준비 중입니다.');
  };

  // 빠른 시작 버튼 핸들러
  const handleQuickStart = (eventType) => {
    navigation.navigate('CreateEvent', { eventType });
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

  // 🔥 수동 새로고침 함수 추가
  const handleRefresh = async () => {
    console.log('🔄 수동 새로고침 시작');
    setLoading(true);
    await loadUserData();
    await loadEvents();
    await loadActiveEvents();
    setLoading(false);
  };

  // 🔥 더보기 버튼 핸들러
  const handleViewMore = () => {
    navigation.navigate('MyEvents');
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
    // console.log('🔍 이벤트 분류:', {
    //   eventName: event.event_name,
    //   eventDate: event.event_date,
    //   isCompleted,
    //   category: isCompleted ? '완료' : '진행중'
    // });
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

  // 🔥 분류 결과 로그
  // console.log('📊 이벤트 분류 결과:', {
  //   totalEvents: allEvents.length,
  //   activeCount: activeEventsFiltered.length,
  //   completedCount: completedEventsFiltered.length,
  //   activeEvents: activeEventsFiltered.map(e => ({ name: e.event_name, date: e.event_date })),
  //   completedEvents: completedEventsFiltered.map(e => ({ name: e.event_name, date: e.event_date }))
  // });

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

        {/* 통계 요약 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>이번 달 요약</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{allEvents.length}</Text>
              <Text style={styles.statLabel}>총 경조사</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0원</Text>
              <Text style={styles.statLabel}>총 부조금</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{activeEventsFiltered.length}</Text>
              <Text style={styles.statLabel}>진행중</Text>
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
  
  // 통계
  statsSection: {
    marginBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});