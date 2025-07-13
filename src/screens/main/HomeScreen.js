// src/screens/main/HomeScreen.js - QR 버튼 제거 및 개선
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
import { getUserEvents, getActiveEvents } from '../../lib/supabaseHelper';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function HomeScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  
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

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
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

  // 사용자 정보 통합 로드 함수
  const loadUserData = async () => {
    try {
      console.log('👤 사용자 정보 로드 시작');
      
      // 1. Props로 받은 userInfo 우선 사용
      if (userInfo?.userId) {
        console.log('✅ Props userInfo 사용:', userInfo.userName);
        setUser({
          id: userInfo.userId,
          user_metadata: { name: userInfo.userName },
          phone: userInfo.phone,
          auth_method: 'phone'
        });
        return;
      }
      
      // 2. AsyncStorage에서 확인
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      if (isLoggedIn === 'true' && storedUserInfo) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        console.log('✅ AsyncStorage userInfo 사용:', parsedUserInfo.userName);
        setUser({
          id: parsedUserInfo.userId,
          user_metadata: { name: parsedUserInfo.userName },
          phone: parsedUserInfo.phone,
          auth_method: 'phone'
        });
        return;
      }
      
      // 3. Supabase Auth 확인
      if (session?.user) {
        console.log('✅ Supabase session 사용');
        setUser(session.user);
        return;
      }
      
      // 4. 마지막 시도 - 직접 Supabase 조회
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ Supabase 직접 조회 성공');
        setUser(user);
      } else {
        console.log('❌ 사용자 정보 없음');
      }
      
    } catch (error) {
      console.error('❌ 사용자 정보 로드 오류:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('📅 이벤트 로드 시작');
      
      // userInfo를 getUserEvents에 전달
      const currentUserInfo = userInfo?.userId ? {
        id: userInfo.userId,
        name: userInfo.userName,
        phone: userInfo.phone,
        auth_method: 'phone'
      } : null;
      
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

  // HomeScreen.js의 loadActiveEvents 함수에 디버깅 로그 추가

const loadActiveEvents = async () => {
  try {
    console.log('📅 활성 이벤트 로드 시작');
    
    const result = await getActiveEvents();
    
    if (result.success) {
      console.log(`✅ 활성 이벤트 로드 완료: ${result.data?.length || 0}개`);
      
      // 🔍 디버깅: 각 이벤트의 상세 정보 로그
      result.data?.forEach((event, index) => {
        console.log(`🎭 이벤트 ${index + 1}:`, {
          id: event.id,
          name: event.event_name,
          type: event.event_type,
          templateStyle: event.template_style,
          imageUrls: event.image_urls?.length || 0,
          additionalInfo: event.additional_info ? 'exists' : 'null',
          categorizedImages: event.additional_info?.categorized_images ? 'exists' : 'null'
        });
        
        // 이미지 정보 상세 로그
        if (event.image_urls && event.image_urls.length > 0) {
          console.log(`📸 이벤트 ${index + 1} 이미지 상세:`, 
            event.image_urls.map(img => ({
              category: img.category,
              hasUri: !!img.uri
            }))
          );
        }
        
        // additional_info 상세 로그
        if (event.additional_info?.categorized_images) {
          const catImages = event.additional_info.categorized_images;
          console.log(`📁 이벤트 ${index + 1} 카테고리별 이미지:`, {
            main: catImages.main?.length || 0,
            gallery: catImages.gallery?.length || 0,
            groom: catImages.groom?.length || 0,
            bride: catImages.bride?.length || 0
          });
        }
      });
      
      setActiveEvents(result.data || []);
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

  // QR 스캔 기능 (수정됨)
  const handleQRScan = () => {
    Alert.alert('준비중', 'QR 스캐너 기능을 준비 중입니다.');
  };

  // 빠른 시작 버튼 핸들러
  const handleQuickStart = (eventType) => {
    navigation.navigate('CreateEvent', { eventType });
  };

  // src/screens/main/HomeScreen.js - 전시모드 데이터 전달 수정

// 기존 handleActiveEventPress 함수를 수정
const handleActiveEventPress = (event) => {
  console.log('🎭 전시모드로 이동:', event.event_name);
  
  // DB에서 저장된 이미지와 템플릿 정보 파싱
  const templateStyle = event.template_style || 'modern-dark';
  
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
  
  console.log('🎭 전달할 데이터:', {
    eventId: event.id,
    templateStyle,
    categorizedImages: {
      main: finalCategorizedImages.main?.length || 0,
      gallery: finalCategorizedImages.gallery?.length || 0,
      groom: finalCategorizedImages.groom?.length || 0,
      bride: finalCategorizedImages.bride?.length || 0
    }
  });
  
  navigation.navigate('EventDisplay', { 
    eventId: event.id,
    templateStyle: templateStyle,
    categorizedImages: finalCategorizedImages,
    eventData: {
      // 기본 정보 전달
      type: event.event_type,
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
    }
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

        {/* 현재 진행중인 행사들 */}
        {activeEvents.length > 0 && (
          <View style={styles.activeEventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>현재 진행중인 행사</Text>
              <Text style={styles.eventCount}>({activeEvents.length})</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeEventsList}
            >
              {activeEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.activeEventCard}
                  onPress={() => handleActiveEventPress(event)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.eventTypeIndicator, { backgroundColor: getEventColor(event.event_type) }]}>
                    <Ionicons 
                      name={getEventIcon(event.event_type)} 
                      size={16} 
                      color={Colors.white} 
                    />
                  </View>
                  <Text style={styles.activeEventTitle} numberOfLines={2}>
                    {event.event_name}
                  </Text>
                  <Text style={styles.activeEventDate}>
                    {event.event_date ? formatDate(event.event_date) : '날짜 미정'}
                  </Text>
                  
                  {/* 액션 버튼들 - QR 버튼 제거, 부조 버튼만 유지 */}
                  {/* <View style={styles.activeEventActions}>
                    <TouchableOpacity 
                      style={styles.contributeButton}
                      onPress={(e) => handleContributePress(event, e)}
                    >
                      <Ionicons name="heart" size={16} color={Colors.white} />
                      <Text style={styles.contributeButtonText}>부조하기</Text>
                    </TouchableOpacity>
                  </View> */}
                  
                  {/* 전시모드 안내 - 더 눈에 띄게 */}
                  <View style={styles.displayModeHint}>
                    <Ionicons name="tv" size={14} color={Colors.primary} />
                    <Text style={styles.displayModeText}>
                      {event.event_type === 'funeral' ? '추모모드' : '전시모드'}로 보기
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 퀵 액션 */}
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
              <View style={[styles.quickIcon, { backgroundColor: Colors.wedding }]}>
                <Ionicons name="heart" size={24} color={Colors.white} />
              </View>
              <Text style={styles.quickTitle}>결혼식</Text>
              <Text style={styles.quickSubtitle}>새로운 시작을 축하해요</Text>
              <View style={styles.quickTypeIndicator}>
                <Text style={styles.quickTypeText}>경사</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickItem}
              onPress={() => handleQuickStart('funeral')}
            >
              <View style={[styles.quickIcon, { backgroundColor: Colors.funeral }]}>
                <Ionicons name="flower" size={24} color={Colors.white} />
              </View>
              <Text style={styles.quickTitle}>부고</Text>
              <Text style={styles.quickSubtitle}>마지막 인사를 전해요</Text>
              <View style={[styles.quickTypeIndicator, { backgroundColor: Colors.funeral }]}>
                <Text style={[styles.quickTypeText, { color: Colors.white }]}>조사</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickItem}
              onPress={() => handleQuickStart('birthday')}
            >
              <View style={[styles.quickIcon, { backgroundColor: Colors.celebration }]}>
                <Ionicons name="gift" size={24} color={Colors.white} />
              </View>
              <Text style={styles.quickTitle}>돌잔치</Text>
              <Text style={styles.quickSubtitle}>소중한 성장을 기념해요</Text>
              <View style={styles.quickTypeIndicator}>
                <Text style={styles.quickTypeText}>경사</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickItem}
              onPress={() => handleQuickStart('other')}
            >
              <View style={[styles.quickIcon, { backgroundColor: Colors.other }]}>
                <Ionicons name="add-circle" size={24} color={Colors.white} />
              </View>
              <Text style={styles.quickTitle}>기타</Text>
              <Text style={styles.quickSubtitle}>다양한 행사를 만들어요</Text>
              <View style={styles.quickTypeIndicator}>
                <Text style={styles.quickTypeText}>기타</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 최근 경조사 */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 경조사</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyEvents')}>
              <Text style={styles.sectionLink}>전체보기</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
              <Text style={styles.loadingText}>불러오는 중...</Text>
            </View>
          ) : events.length > 0 ? (
            <View style={styles.eventsList}>
              {events.slice(0, 3).map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventItem}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                >
                  <View style={styles.eventIcon}>
                    <Ionicons 
                      name={getEventIcon(event.event_type)} 
                      size={20} 
                      color={getEventColor(event.event_type)} 
                    />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.event_name}</Text>
                    <Text style={styles.eventDate}>
                      {event.event_date ? formatDate(event.event_date) : '날짜 미정'}
                    </Text>
                    <View style={styles.eventStatusContainer}>
                      <View style={[
                        styles.eventStatusBadge, 
                        { backgroundColor: event.status === 'active' ? Colors.success : Colors.gray300 }
                      ]}>
                        <Text style={[
                          styles.eventStatusText,
                          { color: event.status === 'active' ? Colors.white : Colors.textSecondary }
                        ]}>
                          {event.status === 'active' ? '진행중' : '완료'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.eventStats}>
                    <Text style={styles.eventCount}>0건</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>아직 등록된 경조사가 없어요</Text>
              <Text style={styles.emptySubtitle}>첫 번째 경조사를 만들어보세요</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <Text style={styles.createButtonText}>경조사 만들기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 통계 요약 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>이번 달 요약</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{events.length}</Text>
              <Text style={styles.statLabel}>총 경조사</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0원</Text>
              <Text style={styles.statLabel}>총 부조금</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{activeEvents.length}</Text>
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

  // 활성 이벤트 섹션
  activeEventsSection: {
    marginBottom: 32,
  },
  activeEventsList: {
    paddingRight: 20,
    gap: 16,
  },
  activeEventCard: {
    width: 220,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventTypeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  activeEventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  
  // 액션 버튼들 - 부조 버튼만 남김
  activeEventActions: {
    marginBottom: 12,
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  contributeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 전시모드 힌트 - 더 강조
  displayModeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  displayModeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // 퀵 액션
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
    flexWrap: 'wrap',
    gap: 12,
  },
  quickItem: {
    width: isTablet ? '23%' : '48%',
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
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  quickSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
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
  
  // 최근 섹션
  recentSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventCount: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // 이벤트 리스트
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  eventStatusContainer: {
    flexDirection: 'row',
  },
  eventStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  eventStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
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