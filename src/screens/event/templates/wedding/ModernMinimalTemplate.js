// src/screens/event/templates/wedding/ModernMinimalTemplate.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  useCountdown,
  getCategorizedImagesSafe,
  formatKoreanDate,
  formatKoreanTime,
  width,
  height,
} from './WeddingUtils';
import {
  CountdownDisplay,
  ImageViewer,
  MainPhotoSlideshow,
  GuestBookMessages,
} from './WeddingCommonComponents';

// 꽃잎 떨어지는 컴포넌트 (heroHeight 파라미터 추가)
const FallingFlowers = ({ heroHeight = height * 0.85 }) => {
  // 꽃잎 이미지 경로 배열
  const flowerImages = [
    require('../../../../../assets/images/flowers/flower2.png'),
    require('../../../../../assets/images/flowers/flower3.png'),
    require('../../../../../assets/images/flowers/flower4.png'),
    require('../../../../../assets/images/flowers/flower5.png'),
    require('../../../../../assets/images/flowers/flower2.png'),
    require('../../../../../assets/images/flowers/flower3.png'),
    require('../../../../../assets/images/flowers/flower4.png'),
    require('../../../../../assets/images/flowers/flower5.png'),
  ];

  // 두 세트의 꽃잎 그룹 생성 (끊김 없는 연속 효과)
  const flowersSet1 = useRef([...Array(20)].map((_, index) => ({ 
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: index * 250, // 순차적으로 시작
    size: Math.random() * 50 + 45,
    imageIndex: index % 8,
    duration: 6000 + Math.random() * 1000,
  }))).current;

  const flowersSet2 = useRef([...Array(20)].map((_, index) => ({ 
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: 3000 + (index * 250), // 첫 번째 세트 중간부터 시작
    size: Math.random() * 50 + 45,
    imageIndex: index % 8,
    duration: 6000 + Math.random() * 1000,
  }))).current;

  useEffect(() => {
    // 첫 번째 세트 애니메이션
    flowersSet1.forEach((flower) => {
      const animateFlower = () => {
        flower.anim.setValue(0);
        Animated.timing(flower.anim, {
          toValue: 1,
          duration: flower.duration,
          useNativeDriver: true,
          easing: Easing.linear,
        }).start(() => {
          setTimeout(() => animateFlower(), 100); // 약간의 갭으로 재시작
        });
      };
      
      setTimeout(() => animateFlower(), flower.delay);
    });

    // 두 번째 세트 애니메이션
    flowersSet2.forEach((flower) => {
      const animateFlower = () => {
        flower.anim.setValue(0);
        Animated.timing(flower.anim, {
          toValue: 1,
          duration: flower.duration,
          useNativeDriver: true,
          easing: Easing.linear,
        }).start(() => {
          setTimeout(() => animateFlower(), 100);
        });
      };
      
      setTimeout(() => animateFlower(), flower.delay);
    });
  }, []);

  const renderFlowers = (flowers) => flowers.map((flower, index) => (
    <Animated.View
      key={`flower-${index}`}
      style={{
        position: 'absolute',
        left: flower.x,
        opacity: flower.anim.interpolate({
          inputRange: [0, 0.02, 0.98, 1],
          outputRange: [0, 0.75, 0.75, 0]
        }),
        transform: [{
          translateY: flower.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-150, heroHeight + 100]
          })
        }, {
          translateX: flower.anim.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0, 12, -8, 5] // 부드럽게 조정
          })
        }, {
          rotate: flower.anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '120deg'] // 회전 줄임
          })
        }, {
          scale: flower.anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.8, 1, 0.9] // 크기 변화 추가
          })
        }]
      }}
    >
      <Image 
        source={flowerImages[flower.imageIndex]}
        style={{ 
          width: flower.size, 
          height: flower.size,
        }}
        resizeMode="contain"
      />
    </Animated.View>
  ));

  return (
    <View style={{ 
      position: 'absolute', 
      width: '100%', 
      height: '100%', 
      zIndex: 2, 
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      {renderFlowers(flowersSet1)}
      {renderFlowers(flowersSet2)}
    </View>
  );
};

// 미니멀한 달력 컴포넌트
const MinimalCalendar = ({ targetDate, style }) => {
  const date = new Date(targetDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  // 해당 월의 첫 날과 마지막 날 구하기
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  // 달력 데이터 생성
  const calendarDays = [];
  
  // 이전 달 날짜들
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isTargetDate: false,
    });
  }
  
  // 현재 달 날짜들
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      isTargetDate: i === day,
    });
  }
  
  // 다음 달 날짜들 (6주 맞추기)
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      isTargetDate: false,
    });
  }
  
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  
  return (
    <View style={[{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: 25,
      borderRadius: 8,
    }, style]}>
      <Text style={{
        fontSize: 16,
        letterSpacing: 3,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: '200',
      }}>
        {months[month]} {year}
      </Text>
      
      {/* 요일 헤더 */}
      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        {weekDays.map((weekDay, index) => (
          <View key={index} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontSize: 11,
              color: index === 0 ? 'rgba(255, 182, 193, 0.8)' : 'rgba(255, 255, 255, 0.5)',
              letterSpacing: 1,
            }}>
              {weekDay}
            </Text>
          </View>
        ))}
      </View>
      
      {/* 날짜 그리드 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {calendarDays.map((dayData, index) => (
          <View key={index} style={{ 
            width: '14.28%', 
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
          }}>
            {dayData.isTargetDate ? (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#1a1a1a',
                }}>
                  {dayData.day}
                </Text>
              </View>
            ) : (
              <Text style={{
                fontSize: 13,
                color: !dayData.isCurrentMonth ? 'rgba(255, 255, 255, 0.2)' :
                       index % 7 === 0 ? 'rgba(255, 182, 193, 0.6)' : 
                       'rgba(255, 255, 255, 0.6)',
              }}>
                {dayData.day}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const ModernMinimalTemplate = ({ eventData = {}, categorizedImages = {}, allowMessages = false, messageSettings = {} }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeAccountToggle, setActiveAccountToggle] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0); // 갤러리 인덱스 추가
  
  const scrollViewRef = useRef(null);
  const fadeAnims = useRef(Array.from({ length: 20 }, () => new Animated.Value(0))).current;
  const slideAnims = useRef(Array.from({ length: 20 }, () => new Animated.Value(30))).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const lineWidthAnim = useRef(new Animated.Value(0)).current;
  
  // 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date || '2025-10-04',
    eventData.ceremonyTime || eventData.ceremony_time || '14:00'
  );
  
  // 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  
  useEffect(() => {
    // 순차적 애니메이션
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: 300 + (index * 150),
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
    
    slideAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 800,
        delay: 300 + (index * 150),
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });
    
    // 메인 이미지 스케일 애니메이션
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      delay: 500,
      useNativeDriver: true,
    }).start();
    
    // 라인 애니메이션
    Animated.timing(lineWidthAnim, {
      toValue: 1,
      duration: 1500,
      delay: 800,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();
  }, []);
  
  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };
  
  const handleShare = async () => {
    try {
      const groomName = eventData.groomName || '현';
      const brideName = eventData.brideName || '아름';
      const dateInfo = formatKoreanDate(eventData.date || '2025-10-04');
      const timeStr = formatKoreanTime(eventData.ceremonyTime || '14:00');
      const location = eventData.location || '더 플라자 호텔';
      
      // 템플릿 공유 로직 - 웹 링크로 이동
      const WEB_BASE_URL = 'https://contribution-web-srgt.vercel.app';
      const eventId = eventData.id || eventData.event_id || 'sample-event';
      const templateUrl = `${WEB_BASE_URL}/template/${eventId}?template=modern`;
      
      console.log('🔍 공유 링크 생성:', { eventData, eventId, templateUrl });
      
      await Share.share({
        message: `${groomName} & ${brideName}\n우리의 사랑이 꽃피는 날\n\n${dateInfo.full} ${timeStr}\n${location}\n\n모바일 청첩장을 확인하세요:\n${templateUrl}`,
        title: 'Wedding Invitation',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleAccountToggle = (type) => {
    setActiveAccountToggle(activeAccountToggle === type ? null : type);
  };

  const copyAccount = (accountNumber) => {
    Alert.alert('복사 완료', '계좌번호가 복사되었습니다.');
  };
  
  const dateInfo = formatKoreanDate(eventData.date || '2025-10-04');
  const ceremonyTime = formatKoreanTime(eventData.ceremonyTime || '14:00');
  
  // 영문 이름 변환
  const getEnglishName = (koreanName) => {
    const nameMap = {
      '현': 'HYUN', '아름': 'AREUM', '민호': 'MINHO', '하윤': 'HAYOON',
      '재현': 'JAEHYUN', '민지': 'MINJI', '준호': 'JUNHO', '서연': 'SEOYEON'
    };
    return nameMap[koreanName] || koreanName.toUpperCase();
  };
  
  const groomEngName = getEnglishName(eventData.groomName || '현');
  const brideEngName = getEnglishName(eventData.brideName || '아름');

  // 방명록 예제 메시지 (allowMessages가 true일 때만 사용)
  const guestMessages = allowMessages ? (eventData.guestMessages || [
    {
      from: "민나",
      date: "2025.04.24 18:52",
      content: "아름아❤️ 결혼을 진심으로 축하한다!\n현 오빠랑 둘이 지금처럼 행복하게 백년해로 하기\n항상 웃음 가득한 하루하루 보내길 바랄게!\nHappy Wedding💜"
    },
    {
      from: "sooyeon",
      date: "2025.04.23 09:41",
      content: "결혼을 진심으로 축하드립니다💕\n사진도 청첩장도 너무 이쁘요!\n항상 서로를 응원하고 아껴주는 모습이 참 이쁜 커플입니다😊\n행복한 결혼 생활 되길 바래요"
    },
    {
      from: "지현",
      date: "2025.04.22 14:23",
      content: "아름아 결혼 진심으로 축하해!\n웨딩스냅, 청첩장 모두 너무 예쁘다!💚\n남은 결혼식 준비도 잘 마무리하고!\n행복한 결혼생활 되기를 바래✨"
    },
    {
      from: "준서",
      date: "2025.04.21 11:30",
      content: "현이 형! 드디어 결혼하네요 축하해요! 🎉\n형수님이랑 항상 행복하시고\n앞으로도 좋은 일만 가득하길 바랄게요!"
    },
    {
      from: "혜진",
      date: "2025.04.20 16:45",
      content: "언니 결혼 너무너무 축하해요!! 💖\n정말 아름다운 신부가 될 거예요\n평생 사랑하고 행복하게 살아요!"
    }
  ]) : [];

  const groomAccount = {
    bank: eventData.groomBank || '국민은행',
    number: eventData.groomAccount || '123-456-789012',
    name: eventData.groomName || '현'
  };

  const brideAccount = {
    bank: eventData.brideBank || '신한은행',
    number: eventData.brideAccount || '234-567-890123',
    name: eventData.brideName || '아름'
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 메인 히어로 섹션 */}
        <View style={styles.heroSection}>
          <View style={styles.mainImageWrapper}>
            <MainPhotoSlideshow 
              images={safeImages.main}
              style={styles.mainPhoto}
              onImagePress={handleImagePress}
              template="minimal"
            />
            {/* 메인 포토 커스텀 인디케이터 오버레이 */}
            <View style={{
              position: 'absolute',
              bottom: 100,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              zIndex: 10,
            }}>
              {safeImages.main.slice(0, 5).map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    marginHorizontal: 4,
                    opacity: 0.8,
                  }}
                />
              ))}
            </View>
            
            {/* 오버레이 그라데이션 */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
            
            {/* 꽃잎 애니메이션 - 히어로 섹션 내부에만 */}
            <FallingFlowers heroHeight={height * 0.85} />
            
            {/* 메인 텍스트 오버레이 */}
            <View style={styles.heroTextOverlay}>
              <Animated.View style={{ 
                opacity: fadeAnims[0],
                transform: [{ translateY: slideAnims[0] }]
              }}>
                <Text style={styles.heroEngNames}>
                  {groomEngName} & {brideEngName}
                </Text>
                <View style={styles.heroNameDivider} />
                <Text style={styles.heroKorNames}>
                  {eventData.groomName || '현'} 그리고 {eventData.brideName || '아름'}
                </Text>
              </Animated.View>
            </View>
          </View>
        </View>
        
        {/* 인사말 섹션 */}
        <Animated.View style={[
          styles.greetingSection,
          {
            opacity: fadeAnims[1],
            transform: [{ translateY: slideAnims[1] }]
          }
        ]}>
          <Text style={styles.greetingTitle}>우리의 사랑이 꽃피는 날,</Text>
          <Text style={styles.greetingSubtitle}>함께 축복해 주세요</Text>
          
          <View style={styles.greetingDivider} />
          
          <Text style={styles.greetingContent}>
            {eventData.customMessage || 
            `서로 다른 길을 걸어온 두 사람이
하나의 길을 함께 걷고자 합니다.
저희의 새로운 시작을 
따뜻한 마음으로 축복해 주세요.

On the day our love blossoms,
please bless our marriage.`}
          </Text>
          
          {/* 부모님 성함 */}
          <View style={styles.parentsSection}>
            <View style={styles.parentsRow}>
              <Text style={styles.parentsText}>
                {eventData.groomFatherName || '아버지'} · {eventData.groomMotherName || '어머니'}의 아들 {eventData.groomName || '현'}
              </Text>
            </View>
            <View style={styles.parentsRow}>
              <Text style={styles.parentsText}>
                {eventData.brideFatherName || '아버지'} · {eventData.brideMotherName || '어머니'}의 딸 {eventData.brideName || '아름'}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* 날짜 & 시간 & 카운트다운 통합 섹션 */}
        <View style={styles.dateSection}>
          <LinearGradient
            colors={['#1a1a1a', '#000000']}
            style={StyleSheet.absoluteFill}
          />
          
          <Animated.View style={[
            styles.dateSectionContent,
            {
              opacity: fadeAnims[2],
              transform: [{ translateY: slideAnims[2] }]
            }
          ]}>
            <Text style={styles.dateTitle}>WEDDING DAY</Text>
            
            {/* 미니멀 달력 */}
            <MinimalCalendar 
              targetDate={eventData.date || '2025-10-04'} 
              style={{ marginBottom: 25 }}
            />
            
            {/* 카운트다운 바로 표시 */}
            <View style={styles.countdownContainer}>
              {!timeLeft.isExpired ? (
                <>
                  <Text style={styles.countdownTitle}>THE BIG DAY</Text>
                  <View style={styles.countdownGrid}>
                    {[
                      { value: timeLeft.days, label: 'DAYS' },
                      { value: timeLeft.hours, label: 'HOURS' },
                      { value: timeLeft.minutes, label: 'MINS' },
                      { value: timeLeft.seconds, label: 'SECS' },
                    ].map((item, index) => (
                      <View key={index} style={styles.countdownItem}>
                        <Text style={styles.countdownNumber}>{item.value}</Text>
                        <Text style={styles.countdownLabel}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.countdownMessage}>
                    우리의 결혼식이 <Text style={styles.countdownDays}>{timeLeft.days}일</Text> 남았습니다
                  </Text>
                </>
              ) : (
                <Text style={styles.countdownExpired}>💍 TODAY IS THE DAY 💍</Text>
              )}
            </View>
            
            {/* CEREMONY 정보 - 날짜와 시간 모두 표시 */}
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>CEREMONY</Text>
              <Text style={styles.ceremonyDate}>
                {dateInfo.year}년 {dateInfo.month}월 {dateInfo.day}일 {dateInfo.dayOfWeek}
              </Text>
              <Text style={styles.timeText}>{ceremonyTime}</Text>
              {eventData.receptionTime && (
                <>
                  <Text style={[styles.timeLabel, { marginTop: 20 }]}>RECEPTION</Text>
                  <Text style={styles.ceremonyDate}>
                    {dateInfo.year}년 {dateInfo.month}월 {dateInfo.day}일 {dateInfo.dayOfWeek}
                  </Text>
                  <Text style={styles.timeText}>{formatKoreanTime(eventData.receptionTime)}</Text>
                </>
              )}
            </View>
          </Animated.View>
        </View>
        
        {/* 갤러리 섹션 */}
        <Animated.View style={[
          styles.gallerySection,
          {
            opacity: fadeAnims[3],
            transform: [{ translateY: slideAnims[3] }]
          }
        ]}>
          <Text style={styles.sectionTitle}>GALLERY</Text>
          <View style={styles.sectionTitleLine} />
          
          <View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={width} // 전체 화면 너비로 스냅
              snapToAlignment="start"
              decelerationRate="fast"
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setGalleryIndex(index);
              }}
            >
              {safeImages.gallery.map((image, index) => (
                <View
                  key={index}
                  style={{ width: width, paddingHorizontal: 20 }} // 전체 너비 사용, 내부 패딩
                >
                  <TouchableOpacity
                    style={styles.galleryItem}
                    onPress={() => handleImagePress(safeImages.main.length + index)}
                  >
                    <Image 
                      source={image}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)']}
                      style={styles.galleryImageOverlay}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            {/* 페이지 인디케이터 */}
            <View style={styles.galleryIndicatorContainer}>
              {safeImages.gallery.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.galleryIndicator,
                    galleryIndex === index && styles.galleryIndicatorActive
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
        
        {/* 신랑 & 신부 섹션 */}
        <Animated.View style={[
          styles.coupleSection,
          {
            opacity: fadeAnims[4],
            transform: [{ translateY: slideAnims[4] }]
          }
        ]}>
          <Text style={styles.sectionTitle}>THE COUPLE</Text>
          <View style={styles.sectionTitleLine} />
          
          <View style={styles.coupleContainer}>
            {/* 신랑 */}
            <View style={styles.personCard}>
              <View style={styles.personImageContainer}>
                <Image 
                  source={safeImages.groom[0]}
                  style={styles.personImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.personRole}>GROOM</Text>
              <Text style={styles.personName}>{eventData.groomName || '현'}</Text>
              <Text style={styles.personEngName}>{groomEngName}</Text>
            </View>
            
            {/* & 심볼 */}
            <View style={styles.ampersandContainer}>
              <Text style={styles.ampersand}>&</Text>
            </View>
            
            {/* 신부 */}
            <View style={styles.personCard}>
              <View style={styles.personImageContainer}>
                <Image 
                  source={safeImages.bride[0]}
                  style={styles.personImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.personRole}>BRIDE</Text>
              <Text style={styles.personName}>{eventData.brideName || '아름'}</Text>
              <Text style={styles.personEngName}>{brideEngName}</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* 오시는 길 섹션 */}
        <View style={styles.locationSection}>
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a']}
            style={StyleSheet.absoluteFill}
          />
          
          <Animated.View style={[
            styles.locationContent,
            {
              opacity: fadeAnims[6],
              transform: [{ translateY: slideAnims[6] }]
            }
          ]}>
            <Text style={styles.sectionTitleWhite}>LOCATION</Text>
            <View style={[styles.sectionTitleLine, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            
            <Text style={styles.locationName}>
              {eventData.location || '더 플라자 호텔'}
            </Text>
            <Text style={styles.locationAddress}>
              {eventData.detailedAddress || '서울시 중구 소공로 119 그랜드볼룸'}
            </Text>
            
            <TouchableOpacity style={styles.mapButton}>
              <Text style={styles.mapButtonText}>지도 보기</Text>
            </TouchableOpacity>
            
            {eventData.parkingInfo && (
              <View style={styles.parkingInfo}>
                <Ionicons name="car" size={20} color="rgba(255,255,255,0.6)" />
                <Text style={styles.parkingText}>{eventData.parkingInfo}</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* 계좌번호 섹션 */}
        <Animated.View style={[
          styles.accountSection,
          {
            opacity: fadeAnims[7],
            transform: [{ translateY: slideAnims[7] }]
          }
        ]}>
          <Text style={styles.sectionTitle}>CONGRATULATORY MONEY</Text>
          <View style={styles.sectionTitleLine} />
          <Text style={styles.accountSubtitle}>마음 전하실 곳</Text>
          
          <View style={styles.accountContainer}>
            {/* 신랑 계좌 */}
            <TouchableOpacity 
              style={styles.accountCard}
              onPress={() => handleAccountToggle('groom')}
            >
              <View style={styles.accountHeader}>
                <Text style={styles.accountTitle}>신랑측 계좌번호</Text>
                <Ionicons 
                  name={activeAccountToggle === 'groom' ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </View>
              {activeAccountToggle === 'groom' && (
                <View style={styles.accountDetails}>
                  <Text style={styles.accountBank}>{groomAccount.bank}</Text>
                  <Text style={styles.accountNumber}>{groomAccount.number}</Text>
                  <Text style={styles.accountName}>예금주: {groomAccount.name}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => copyAccount(groomAccount.number)}
                  >
                    <Text style={styles.copyButtonText}>복사하기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
            
            {/* 신부 계좌 */}
            <TouchableOpacity 
              style={styles.accountCard}
              onPress={() => handleAccountToggle('bride')}
            >
              <View style={styles.accountHeader}>
                <Text style={styles.accountTitle}>신부측 계좌번호</Text>
                <Ionicons 
                  name={activeAccountToggle === 'bride' ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </View>
              {activeAccountToggle === 'bride' && (
                <View style={styles.accountDetails}>
                  <Text style={styles.accountBank}>{brideAccount.bank}</Text>
                  <Text style={styles.accountNumber}>{brideAccount.number}</Text>
                  <Text style={styles.accountName}>예금주: {brideAccount.name}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => copyAccount(brideAccount.number)}
                  >
                    <Text style={styles.copyButtonText}>복사하기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* 방명록 섹션 */}
        {allowMessages && (
          <Animated.View style={[
            styles.messagesSection,
            {
              opacity: fadeAnims[8],
              transform: [{ translateY: slideAnims[8] }]
            }
          ]}>
            <Text style={styles.sectionTitle}>GUEST BOOK</Text>
            <View style={styles.sectionTitleLine} />
            
            <GuestBookMessages 
              messages={eventData.guestMessages || []}
              onAddMessage={() => console.log('Add message')}
            />
          </Animated.View>
        )}
        
        {/* 마지막 섹션 */}
        <View style={styles.footerSection}>
          <LinearGradient
            colors={['#000000', '#1a1a1a']}
            style={StyleSheet.absoluteFill}
          />
          
          <Animated.View style={[
            styles.footerContent,
            {
              opacity: fadeAnims[9],
              transform: [{ translateY: slideAnims[9] }]
            }
          ]}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>SHARE INVITATION</Text>
            </TouchableOpacity>
            
            <View style={styles.footerDivider} />
            
            <Text style={styles.footerText}>
              WE LOOK FORWARD TO{'\n'}
              CELEBRATING WITH YOU
            </Text>
            
            <Text style={styles.footerNames}>
              {groomEngName} & {brideEngName}
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
      
      {/* 이미지 뷰어 */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // 히어로 섹션
  heroSection: {
    height: height * 0.85,
    backgroundColor: '#000',
    overflow: 'hidden', // 꽃잎이 섹션 밖으로 나가지 않도록
    position: 'relative',
  },
  mainImageWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden', // 추가 안전장치
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    zIndex: 1, // 꽃잎 아래에 표시
  },
  heroTextOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3, // 꽃잎보다 위에 표시
  },
  heroEngNames: {
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: 4,
    color: '#fff',
    marginBottom: 12,
  },
  heroNameDivider: {
    width: 50,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginVertical: 12,
  },
  heroKorNames: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
  },
  
  // 인사말 섹션
  greetingSection: {
    paddingVertical: 60,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 16,
    fontWeight: '200',
    color: '#666',
    marginBottom: 25,
  },
  greetingDivider: {
    width: 30,
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 25,
  },
  greetingContent: {
    fontSize: 14,
    lineHeight: 26,
    color: '#666',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  parentsSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  parentsRow: {
    marginVertical: 5,
  },
  parentsText: {
    fontSize: 13,
    color: '#999',
    letterSpacing: 0.5,
  },
  
  // 날짜 섹션
  dateSection: {
    paddingVertical: 60,
    position: 'relative',
    minHeight: 700, // 높이 증가
  },
  dateSectionContent: {
    alignItems: 'center',
  },
  dateTitle: {
    fontSize: 18,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 30,
  },
  dateBox: {
    alignItems: 'center',
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dateMonth: {
    fontSize: 14,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  dateDay: {
    fontSize: 60,
    fontWeight: '100',
    color: '#fff',
    marginBottom: 10,
  },
  dateYear: {
    fontSize: 14,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.6)',
  },
  timeInfo: {
    marginTop: 40,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  ceremonyDate: {
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#fff',
  },
  
  // 갤러리 섹션
  gallerySection: {
    paddingVertical: 60,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '200',
    letterSpacing: 3,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitleLine: {
    width: 30,
    height: 1,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 40,
  },
  galleryItem: {
    width: '100%',
    height: 400,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  galleryIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  galleryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc', // 더 진한 회색
    marginHorizontal: 4,
    opacity: 0.5,
  },
  galleryIndicatorActive: {
    backgroundColor: '#333', // 진한 검정
    width: 24,
    opacity: 1,
  },
  // 카운트다운 (날짜 섹션에 통합)
  countdownContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  countdownTitle: {
    fontSize: 16,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 25,
  },
  countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  countdownItem: {
    marginHorizontal: 18,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: '100',
    color: '#fff',
    marginBottom: 5,
  },
  countdownLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
  },
  countdownMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  countdownDays: {
    fontSize: 15,
    fontWeight: '400',
    color: '#fff',
  },
  countdownExpired: {
    fontSize: 22,
    color: '#fff',
    letterSpacing: 2,
  },
  
  // 커플 섹션
  coupleSection: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  coupleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  personCard: {
    alignItems: 'center',
    flex: 1,
  },
  personImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  personImage: {
    width: '100%',
    height: '100%',
  },
  personRole: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#999',
    marginBottom: 5,
  },
  personName: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  personEngName: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#999',
  },
  ampersandContainer: {
    paddingHorizontal: 15,
  },
  ampersand: {
    fontSize: 28,
    fontWeight: '100',
    color: '#ccc',
  },
  
  // 위치 섹션
  locationSection: {
    paddingVertical: 60,
    position: 'relative',
  },
  locationContent: {
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  sectionTitleWhite: {
    fontSize: 22,
    fontWeight: '200',
    letterSpacing: 3,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 10,
    marginTop: 20,
  },
  locationAddress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 25,
  },
  mapButton: {
    paddingVertical: 10,
    paddingHorizontal: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 25,
  },
  mapButtonText: {
    fontSize: 13,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.8)',
  },
  parkingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parkingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 10,
  },

  // 계좌번호 섹션
  accountSection: {
    paddingVertical: 60,
    paddingHorizontal: 25,
    backgroundColor: '#fafafa',
  },
  accountSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  accountContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#fff',
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333',
  },
  accountDetails: {
    padding: 18,
    paddingTop: 0,
  },
  accountBank: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },
  accountNumber: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  accountName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  copyButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#666',
  },
  
  // 메시지 섹션
  messagesSection: {
    paddingVertical: 60,
    paddingHorizontal: 25,
    backgroundColor: '#f8f8f8',
  },
  messagesSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
  },
  messagesContainer: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  messageFrom: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  messageDate: {
    fontSize: 11,
    color: '#aaa',
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 24,
    color: '#555',
    letterSpacing: 0.3,
  },
  writeMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 30,
    alignSelf: 'center',
  },
  writeMessageIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  writeMessageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    letterSpacing: 0.5,
  },
  
  // 푸터 섹션
  footerSection: {
    paddingVertical: 80,
    position: 'relative',
  },
  footerContent: {
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 35,
  },
  shareButtonText: {
    fontSize: 13,
    letterSpacing: 2,
    color: '#fff',
    marginLeft: 10,
  },
  footerDivider: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 25,
  },
  footerText: {
    fontSize: 13,
    letterSpacing: 1,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 25,
  },
  footerNames: {
    fontSize: 18,
    letterSpacing: 3,
    fontWeight: '200',
    color: '#fff',
  },
});

export default ModernMinimalTemplate;