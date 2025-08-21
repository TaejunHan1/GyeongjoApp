// src/screens/event/templates/wedding/ElegantGardenTemplate.js
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
  ImageBackground,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
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

// 꽃잎 떨어지는 애니메이션
const FallingFlowers = ({ heroHeight = height * 0.75 }) => {
  const flowerImages = [
    require('../../../../../assets/images/flowers/flower2.png'),
    require('../../../../../assets/images/flowers/flower3.png'),
    require('../../../../../assets/images/flowers/flower4.png'),
    require('../../../../../assets/images/flowers/flower5.png'),
  ];

  const flowersSet1 = useRef([...Array(12)].map((_, index) => ({ 
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: index * 300,
    size: Math.random() * 40 + 35,
    imageIndex: index % 4,
    duration: 7000 + Math.random() * 2000,
  }))).current;

  const flowersSet2 = useRef([...Array(12)].map((_, index) => ({ 
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: 3500 + (index * 300),
    size: Math.random() * 40 + 35,
    imageIndex: index % 4,
    duration: 7000 + Math.random() * 2000,
  }))).current;

  useEffect(() => {
    flowersSet1.forEach((flower) => {
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
          outputRange: [0, 0.7, 0.7, 0]
        }),
        transform: [{
          translateY: flower.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-100, heroHeight + 100]
          })
        }, {
          translateX: flower.anim.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0, 10, -8, 5]
          })
        }, {
          rotate: flower.anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg']
          })
        }]
      }}
    >
      <Image 
        source={flowerImages[flower.imageIndex]}
        style={{ width: flower.size, height: flower.size }}
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

// 섹션 타이틀 꽃 배경 컴포넌트 - 각 섹션마다 다른 이미지 세트 사용
const FlowerSectionTitle = ({ title, subtitle, imageSet = 'invitation' }) => {
  const fadeAnim1 = useRef(new Animated.Value(1)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  
  const fadeAnims = [fadeAnim1, fadeAnim2, fadeAnim3, fadeAnim4];
  
  // 모든 섹션 동일한 이미지 사용 (invitation 이미지만 사용)
  const flowerImages = [
    require('../../../../../assets/images/flowers/invitation1.png'),
    require('../../../../../assets/images/flowers/invitation2.png'),
    require('../../../../../assets/images/flowers/invitation3.png'),
    require('../../../../../assets/images/flowers/invitation4.png'),
  ];

  useEffect(() => {
    let currentIndex = 0;
    
    const animate = () => {
      const nextIndex = (currentIndex + 1) % 4;
      
      // 현재 이미지 페이드 아웃과 다음 이미지 페이드 인을 동시에
      Animated.parallel([
        Animated.timing(fadeAnims[currentIndex], {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(fadeAnims[nextIndex], {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ]).start();
      
      currentIndex = nextIndex;
    };
    
    const interval = setInterval(animate, 4000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.sectionTitleContainer}>
      {flowerImages.map((image, index) => (
        <Animated.Image
          key={index}
          source={image}
          style={[
            styles.sectionTitleBg,
            { opacity: fadeAnims[index] }
          ]}
        />
      ))}
      <View style={styles.sectionTitleOverlay}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

// 인사말 문구 목록 - 10개로 확장
const GREETING_MESSAGES = [
  `두 사람이 사랑으로 만나
진실과 이해로 하나를 이루고
미래를 약속하게 되었습니다.

저희의 새로운 시작을
축복해 주시면 감사하겠습니다.`,

  `서로 다른 길을 걸어온 두 사람이
이제 하나의 길을 함께 걷고자 합니다.

따뜻한 격려와 축복 속에서
더욱 행복한 가정을 이루겠습니다.`,

  `사랑하는 마음 하나로 시작하여
서로를 이해하는 지혜를 배우고
함께 성장하는 기쁨을 누리며
영원히 함께하겠습니다.`,

  `평생을 함께 할 동반자를 만났습니다.
서로를 아끼고 존중하며
아름다운 가정을 만들어가겠습니다.

귀한 걸음으로 축복해 주세요.`,

  `오랜 기다림 끝에 만난
소중한 인연과 함께
새로운 삶을 시작합니다.

변함없는 사랑과 관심으로
지켜봐 주시기 바랍니다.`,

  `서로의 부족함을 채워주고
함께 있을 때 더 빛나는
두 사람이 하나가 됩니다.

따뜻한 축복과 격려를
부탁드립니다.`,

  `꽃처럼 아름다운 계절에
사랑하는 사람과 함께
영원을 약속하려 합니다.

소중한 날, 함께해 주시어
감사의 마음을 전합니다.`,

  `첫 만남의 설렘을 간직하며
서로에게 든든한 버팀목이 되어
행복한 미래를 만들어가겠습니다.

축복의 자리에 함께해 주세요.`,

  `인생의 가장 아름다운 순간을
사랑하는 사람과 함께
시작하게 되었습니다.

기쁨을 나누고 싶은 분들께
초대의 말씀을 전합니다.`,

  `두 마음이 하나 되어
새로운 가정을 이루고자 합니다.

평생 서로 사랑하고 존중하며
행복하게 살겠습니다.
축복해 주시면 감사하겠습니다.`,
];

// 엘레강트 달력 컴포넌트
const ElegantCalendar = ({ targetDate }) => {
  const date = new Date(targetDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const calendarDays = [];
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({ day: '', isCurrentMonth: false, isTargetDate: false });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      isTargetDate: i === day,
    });
  }

  return (
    <View style={styles.calendarContainer}>
      <Text style={styles.calendarMonth}>{months[month]} {year}</Text>
      
      <View style={styles.calendarWeekDays}>
        {weekDays.map((weekDay, index) => (
          <Text key={index} style={[
            styles.calendarWeekDay,
            index === 0 && styles.calendarSunday
          ]}>
            {weekDay}
          </Text>
        ))}
      </View>
      
      <View style={styles.calendarGrid}>
        {calendarDays.map((dayData, index) => (
          <View key={index} style={styles.calendarDayWrapper}>
            {dayData.isTargetDate ? (
              <View style={styles.calendarTargetDay}>
                <Text style={styles.calendarTargetDayText}>{dayData.day}</Text>
              </View>
            ) : (
              <Text style={[
                styles.calendarDay,
                !dayData.isCurrentMonth && styles.calendarDayInactive,
                index % 7 === 0 && styles.calendarSundayText
              ]}>
                {dayData.day}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const ElegantGardenTemplate = ({ eventData = {}, categorizedImages = {}, allowMessages = false, messageSettings = {} }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [showAccountDetails, setShowAccountDetails] = useState({});
  // 랜덤 인사말 - 컴포넌트 마운트 시 한 번만 선택
  const [selectedGreeting] = useState(() => Math.floor(Math.random() * GREETING_MESSAGES.length));
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(Array.from({ length: 12 }, () => new Animated.Value(0))).current;
  const slideAnims = useRef(Array.from({ length: 12 }, () => new Animated.Value(50))).current;
  
  // 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date || '2025-06-14',
    (() => {
      const timeStr = eventData.ceremonyTime || eventData.ceremony_time || '15:00';
      if (!timeStr || typeof timeStr !== 'string') {
        return '15:00';
      }
      return timeStr;
    })()
  );
  
  // 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  
  useEffect(() => {
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        delay: index * 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });
    
    slideAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 1000,
        delay: index * 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });
  }, []);
  
  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };
  
  const handleShare = async () => {
    try {
      const groomName = eventData.groomName || eventData.groom_name || '준영';
      const brideName = eventData.brideName || eventData.bride_name || '소연';
      
      let dateStr = '2025년 6월 14일 토요일';
      try {
        const dateInfo = formatKoreanDate(eventData.date || eventData.event_date || '2025-06-14');
        dateStr = dateInfo.full;
      } catch (error) {
        console.log('Date format error:', error);
      }
      
      let timeStr = '오후 3:00';
      try {
        const timeData = eventData.ceremonyTime || eventData.ceremony_time || '15:00';
        if (timeData && typeof timeData === 'string') {
          timeStr = formatKoreanTime(timeData);
        }
      } catch (error) {
        console.log('Time format error:', error);
      }
      
      const location = eventData.location || '더 그린하우스 가든홀';
      
      // 템플릿 공유 로직 - 웹 링크로 이동
      const WEB_BASE_URL = 'https://jeongdam.com'; // 실제 도메인으로 변경 필요
      const eventId = eventData.id || eventData.event_id || 'sample-event';
      const templateUrl = `${WEB_BASE_URL}/template/${eventId}?template=garden`;
      
      console.log('🔍 공유 링크 생성:', { eventData, eventId, templateUrl });
      
      await Share.share({
        message: `${groomName} ♡ ${brideName}\n${dateStr} ${timeStr}\n${location}\n\n우리의 특별한 날에 초대합니다 🌸\n\n모바일 청첩장을 확인하세요:\n${templateUrl}`,
        title: 'Wedding Invitation',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };
  
  const toggleAccount = (type) => {
    setShowAccountDetails(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  const copyToClipboard = (text, type) => {
    Alert.alert('복사 완료', `${type} 계좌번호가 복사되었습니다.`);
  };
  
  const dateInfo = (() => {
    try {
      return formatKoreanDate(eventData.date || eventData.event_date || '2025-06-14');
    } catch (error) {
      return {
        year: '2025',
        month: '6',
        day: '14',
        dayOfWeek: '토요일',
        full: '2025년 6월 14일 토요일'
      };
    }
  })();
  
  const ceremonyTime = (() => {
    try {
      const timeStr = eventData.ceremonyTime || eventData.ceremony_time || '15:00';
      if (!timeStr || typeof timeStr !== 'string') {
        return '오후 3:00';
      }
      return formatKoreanTime(timeStr);
    } catch (error) {
      return '오후 3:00';
    }
  })();
  
  const formatDateDisplay = () => {
    const dateStr = eventData.date || eventData.event_date || '2025-06-14';
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return '2025. 06. 14 FRI';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayOfWeek = days[date.getDay()];
    return `${year}. ${month}. ${day} ${dayOfWeek}`;
  };
  
  const formatTimeDisplay = () => {
    const timeStr = eventData.ceremonyTime || eventData.ceremony_time || '15:00';
    
    if (typeof timeStr !== 'string') {
      return '3:00 PM';
    }
    
    const timeParts = timeStr.split(':');
    if (timeParts.length < 2) {
      return '3:00 PM';
    }
    
    const [hours, minutes] = timeParts;
    const hour = parseInt(hours) || 15;
    const min = minutes || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${hour12}:${min} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5B8BA0" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* 메인 히어로 섹션 */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageContainer}>
            <MainPhotoSlideshow 
              images={safeImages.main}
              style={styles.heroImage}
              onImagePress={handleImagePress}
              template="elegant"
            />
            <FallingFlowers heroHeight={height * 0.75} />
            
            <View style={styles.heroOverlay}>
              <Animated.View style={[
                styles.heroContent,
                {
                  opacity: fadeAnims[0],
                  transform: [{ translateY: slideAnims[0] }]
                }
              ]}>
                <View style={styles.heroTopInfo}>
                  <Text style={styles.heroDate}>{formatDateDisplay()}</Text>
                  <Text style={styles.heroTime}>{formatTimeDisplay()}</Text>
                </View>
                
                <Text style={styles.heroMainText}>We're Getting Married</Text>
                
                <View style={styles.heroNamesContainer}>
                  <Text style={styles.heroName}>{eventData.groomName || '차지환'}</Text>
                  <Text style={styles.heroName}>{eventData.brideName || '이소을'}</Text>
                </View>
              </Animated.View>
            </View>
          </View>
        </View>
        
        {/* Invitation 섹션 */}
        <Animated.View style={[
          styles.invitationSection,
          {
            opacity: fadeAnims[1],
            transform: [{ translateY: slideAnims[1] }]
          }
        ]}>
          <View style={styles.sectionWrapper}>
            <FlowerSectionTitle title="Invitation" subtitle="초대합니다" imageSet="invitation" />
          </View>
          
          <View style={styles.invitationContent}>
            <Text style={styles.invitationText}>
              {eventData.customMessage || GREETING_MESSAGES[selectedGreeting]}
            </Text>
          </View>
          
          <View style={styles.parentsInfo}>
            <View style={styles.parentRow}>
              <Text style={styles.parentNames}>
                {eventData.groomFatherName || '차상현'} · {eventData.groomMotherName || '김미정'}
              </Text>
              <Text style={styles.parentRelation}>의 아들</Text>
              <Text style={styles.parentChild}>{eventData.groomName || '지환'}</Text>
            </View>
            <View style={styles.parentRow}>
              <Text style={styles.parentNames}>
                {eventData.brideFatherName || '이준호'} · {eventData.brideMotherName || '박서연'}
              </Text>
              <Text style={styles.parentRelation}>의 딸</Text>
              <Text style={styles.parentChild}>{eventData.brideName || '소을'}</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Gallery 섹션 */}
        <Animated.View style={[
          styles.gallerySection,
          {
            opacity: fadeAnims[2],
            transform: [{ translateY: slideAnims[2] }]
          }
        ]}>
          <View style={styles.gallerySectionWrapper}>
            <FlowerSectionTitle title="Gallery" subtitle="우리의 순간들" imageSet="gallery" />
          </View>
          
          <View style={styles.galleryContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
              snapToInterval={width * 0.75}
              decelerationRate="fast"
              onScroll={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / (width * 0.75));
                setCurrentGalleryIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {safeImages.gallery.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.galleryItem}
                  onPress={() => handleImagePress(safeImages.main.length + index)}
                >
                  <Image
                    source={image}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* 페이지네이션 인디케이터 */}
            <View style={styles.galleryPagination}>
              {safeImages.gallery.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.galleryDot,
                    currentGalleryIndex === index && styles.galleryDotActive
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Wedding Day 섹션 */}
        <Animated.View style={[
          styles.weddingDaySection,
          {
            opacity: fadeAnims[3],
            transform: [{ translateY: slideAnims[3] }]
          }
        ]}>
          <View style={styles.sectionWrapper}>
            <FlowerSectionTitle title="Wedding Day" subtitle="예식 일시" imageSet="wedding" />
          </View>
          
          <ElegantCalendar targetDate={eventData.date || eventData.event_date || '2025-06-14'} />
          
          {/* D-Day 카운트다운 */}
          <View style={styles.countdownContainer}>
            {!timeLeft.isExpired ? (
              <>
                <Text style={styles.countdownTitle}>D-{timeLeft.days}</Text>
                <View style={styles.countdownBoxes}>
                  <View style={styles.countdownBox}>
                    <View style={styles.countdownValueWrapper}>
                      <Text style={styles.countdownValue}>
                        {String(timeLeft.days).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text style={styles.countdownLabel}>Days</Text>
                  </View>
                  <View style={styles.countdownBox}>
                    <View style={styles.countdownValueWrapper}>
                      <Text style={styles.countdownValue}>
                        {String(timeLeft.hours).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text style={styles.countdownLabel}>Hours</Text>
                  </View>
                  <View style={styles.countdownBox}>
                    <View style={styles.countdownValueWrapper}>
                      <Text style={styles.countdownValue}>
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text style={styles.countdownLabel}>Min</Text>
                  </View>
                  <View style={styles.countdownBox}>
                    <View style={styles.countdownValueWrapper}>
                      <Text style={styles.countdownValue}>
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text style={styles.countdownLabel}>Sec</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.countdownExpired}>💐 Today is the Day 💐</Text>
            )}
          </View>
        </Animated.View>
        
        {/* Location 섹션 */}
        <Animated.View style={[
          styles.locationSection,
          {
            opacity: fadeAnims[4],
            transform: [{ translateY: slideAnims[4] }]
          }
        ]}>
          <View style={styles.sectionWrapper}>
            <FlowerSectionTitle title="Location" subtitle="오시는 길" imageSet="location" />
          </View>
          
          <View style={styles.locationCard}>
            <Text style={styles.locationName}>
              {eventData.location || '더 그린하우스 가든홀'}
            </Text>
            <Text style={styles.locationAddress}>
              {eventData.detailedAddress || '서울시 강남구 영동대로 513'}
            </Text>
            
            <TouchableOpacity style={styles.mapButton}>
              <Ionicons name="map" size={20} color="#FFF" />
              <Text style={styles.mapButtonText}>지도 보기</Text>
            </TouchableOpacity>
            
            {eventData.parkingInfo && (
              <View style={styles.parkingInfo}>
                <MaterialCommunityIcons name="parking" size={20} color="#666" />
                <Text style={styles.parkingText}>{eventData.parkingInfo}</Text>
              </View>
            )}
          </View>
        </Animated.View>
        
        {/* Gift 섹션 */}
        <Animated.View style={[
          styles.accountSection,
          {
            opacity: fadeAnims[5],
            transform: [{ translateY: slideAnims[5] }]
          }
        ]}>
          <View style={styles.sectionWrapper}>
            <FlowerSectionTitle title="Gift" subtitle="마음 전하실 곳" imageSet="gift" />
          </View>
          
          <View style={styles.accountCards}>
            <TouchableOpacity 
              style={styles.accountCard}
              onPress={() => toggleAccount('groom')}
            >
              <View style={styles.accountHeader}>
                <Text style={styles.accountRole}>신랑측 계좌번호</Text>
                <Ionicons 
                  name={showAccountDetails.groom ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </View>
              {showAccountDetails.groom && (
                <View style={styles.accountDetails}>
                  <Text style={styles.accountBank}>
                    {eventData.groomBank || '국민은행'}
                  </Text>
                  <Text style={styles.accountNumber}>
                    {eventData.groomAccount || '123-456-789012'}
                  </Text>
                  <Text style={styles.accountHolder}>
                    예금주: {eventData.groomName || '차지환'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(eventData.groomAccount || '123-456-789012', '신랑측')}
                  >
                    <Text style={styles.copyButtonText}>복사하기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.accountCard}
              onPress={() => toggleAccount('bride')}
            >
              <View style={styles.accountHeader}>
                <Text style={styles.accountRole}>신부측 계좌번호</Text>
                <Ionicons 
                  name={showAccountDetails.bride ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </View>
              {showAccountDetails.bride && (
                <View style={styles.accountDetails}>
                  <Text style={styles.accountBank}>
                    {eventData.brideBank || '신한은행'}
                  </Text>
                  <Text style={styles.accountNumber}>
                    {eventData.brideAccount || '234-567-890123'}
                  </Text>
                  <Text style={styles.accountHolder}>
                    예금주: {eventData.brideName || '이소을'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(eventData.brideAccount || '234-567-890123', '신부측')}
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
            styles.guestbookSection,
            {
              opacity: fadeAnims[6],
              transform: [{ translateY: slideAnims[6] }]
            }
          ]}>
            <View style={styles.sectionWrapper}>
              <FlowerSectionTitle title="Guestbook" subtitle="축하 메시지" imageSet="guestbook" />
            </View>
            
            <GuestBookMessages 
              messages={eventData.guestMessages || []}
              onAddMessage={() => console.log('Add message')}
              style={styles.guestbookContainer}
            />
          </Animated.View>
        )}
        
        {/* 푸터 섹션 */}
        <View style={styles.footerSection}>
          <LinearGradient
            colors={['#5B8BA0', '#4A7A8F']}
            style={StyleSheet.absoluteFill}
          />
          
          <Animated.View style={[
            styles.footerContent,
            {
              opacity: fadeAnims[7],
              transform: [{ translateY: slideAnims[7] }]
            }
          ]}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color="#FFF" />
              <Text style={styles.shareButtonText}>청첩장 공유하기</Text>
            </TouchableOpacity>
            
            <View style={styles.footerDivider} />
            
            <Text style={styles.footerTitle}>Thank You</Text>
            <Text style={styles.footerMessage}>
              함께해 주시는 모든 분들께{'\n'}진심으로 감사드립니다
            </Text>
          </Animated.View>
        </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  
  // 섹션 래퍼 (전체 너비 타이틀용)
  sectionWrapper: {
    marginHorizontal: -30,
  },
  
  // 히어로 섹션
  heroSection: {
    height: height * 0.75,
    position: 'relative',
  },
  heroImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  heroContent: {
    paddingHorizontal: 30,
  },
  heroTopInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  heroDate: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '300',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Light' : 'sans-serif-light',
  },
  heroTime: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '300',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Light' : 'sans-serif-light',
  },
  heroMainText: {
    fontSize: 32,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroNamesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // 섹션 타이틀 컨테이너
  sectionTitleContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    marginBottom: 30,
    overflow: 'hidden',
  },
  sectionTitleBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sectionTitleOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Invitation 섹션
  invitationSection: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 30,
    backgroundColor: '#FAFAF8',
  },
  invitationContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 30,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    minHeight: 200,
    justifyContent: 'center',
  },
  invitationText: {
    fontSize: 15,
    lineHeight: 28,
    color: '#444',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  parentsInfo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  parentNames: {
    fontSize: 14,
    color: '#666',
  },
  parentRelation: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  parentChild: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  
  // Gallery 섹션
  gallerySection: {
    paddingTop: 60,
    paddingBottom: 80,
    backgroundColor: '#FFF',
  },
  gallerySectionWrapper: {
    marginHorizontal: -30,  // 제목만 전체 너비로
  },
  galleryContainer: {
    position: 'relative',
  },
  galleryScroll: {
    paddingHorizontal: 30,
  },
  galleryItem: {
    width: width * 0.75,
    height: 350,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  galleryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
    marginHorizontal: 4,
  },
  galleryDotActive: {
    backgroundColor: '#5B8BA0',
    width: 24,
  },
  
  // Wedding Day 섹션
  weddingDaySection: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 30,
    backgroundColor: '#FAFAF8',
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 25,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarMonth: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  calendarWeekDay: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  calendarSunday: {
    color: '#FF6B6B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayWrapper: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 3,
  },
  calendarDay: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    lineHeight: 35,
  },
  calendarDayInactive: {
    color: '#CCC',
  },
  calendarSundayText: {
    color: '#FF6B6B',
  },
  calendarTargetDay: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#5B8BA0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTargetDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  countdownContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  countdownTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#5B8BA0',
    marginBottom: 25,
  },
  countdownBoxes: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownBox: {
    backgroundColor: 'rgba(91, 139, 160, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  countdownValueWrapper: {
    flexDirection: 'row',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownValue: {
    fontSize: 22,
    fontWeight: '300',
    color: '#333',
    letterSpacing: 2,
    textAlign: 'center',
  },
  countdownLabel: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 4,
  },
  countdownExpired: {
    fontSize: 24,
    color: '#5B8BA0',
    textAlign: 'center',
  },
  
  // Location 섹션
  locationSection: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 30,
    backgroundColor: '#FFF',
  },
  locationCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  mapButton: {
    backgroundColor: '#5B8BA0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  mapButtonText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  parkingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parkingText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
  },
  
  // Account 섹션
  accountSection: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 30,
    backgroundColor: '#FAFAF8',
  },
  accountCards: {
    gap: 15,
  },
  accountCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountRole: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  accountDetails: {
    marginTop: 20,
  },
  accountBank: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  accountHolder: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  copyButton: {
    backgroundColor: '#5B8BA0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  
  // Guestbook 섹션
  guestbookSection: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 30,
    backgroundColor: '#FFF',
  },
  guestbookContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  
  // Footer 섹션
  footerSection: {
    paddingVertical: 100,
    position: 'relative',
  },
  footerContent: {
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 40,
  },
  shareButtonText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 10,
    fontWeight: '500',
  },
  footerDivider: {
    width: 50,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 30,
  },
  footerTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    marginBottom: 15,
  },
  footerMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ElegantGardenTemplate;