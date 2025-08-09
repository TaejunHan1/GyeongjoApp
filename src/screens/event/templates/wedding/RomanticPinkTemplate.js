// src/screens/event/templates/wedding/RomanticPinkTemplate.js
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
  Modal,
  Alert,
  Platform,
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
  FallingPetals,
  CountdownDisplay,
  ImageViewer,
  MainPhotoSlideshow,
  HeartPulse,
  RomanticPinkCalendar,
  OpeningOverlay,
  GuestBookMessages,
  AccountToggle,
} from './WeddingCommonComponents';
import styles from './WeddingStyles';

const RomanticPinkTemplate = ({ eventData = {}, categorizedImages = {} }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOpening, setShowOpening] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [galleryScrollIndex, setGalleryScrollIndex] = useState(0);
  const [activeAccountToggle, setActiveAccountToggle] = useState(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(Array.from({ length: 15 }, () => new Animated.Value(0))).current;
  const slideAnims = useRef(Array.from({ length: 15 }, () => new Animated.Value(50))).current;
  const dateTextAnim = useRef(new Animated.Value(0)).current;
  
  // 실시간 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date || '2025-10-04', 
    eventData.ceremonyTime || eventData.ceremony_time || '12:00'
  );
  
  // 카테고리별 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);

  useEffect(() => {
    // 오프닝 오버레이 제거
    setTimeout(() => {
      setShowOpening(false);
    }, 5500);

    // 순차적 페이드인 애니메이션
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        delay: index * 200 + 2500, // 오프닝 후 시작
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });

    slideAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 1000,
        delay: index * 200 + 2500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  }, []);

  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date || '2025-10-04');
  const ceremonyTime = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time || '12:00');
  const receptionTime = formatKoreanTime(eventData.receptionTime || eventData.reception_time || '13:00');

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleShare = async () => {
    try {
      const groomName = eventData.groomName || eventData.groom_name || '이민호';
      const brideName = eventData.brideName || eventData.bride_name || '배하윤';
      const dateStr = dateInfo.full;
      const timeStr = ceremonyTime;
      const location = eventData.location || '더 플라자 지스텀하우스 22층';
      
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

  const handleAccountToggle = (type) => {
    setActiveAccountToggle(activeAccountToggle === type ? null : type);
  };

  const copyAccount = (accountNumber) => {
    Alert.alert('복사 완료', '계좌번호가 복사되었습니다.');
  };

  const openMessageModal = () => {
    setShowMessageModal(true);
  };

  const handleNavigation = () => {
    // 네비게이션 앱 연동
    const address = eventData.detailedAddress || eventData.detailed_address || '서울시 중구 소공로 119';
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`
    });
    Linking.openURL(url);
  };

  // 방명록 메시지 데이터
  const guestMessages = eventData.guestMessages || [
    {
      from: "민나",
      date: "2025.04.24 18:52",
      content: "하윤아❤️ 결혼을 진심으로 축하한다!\n민호 오빠랑 둘이 지금처럼 행복하게 백년해로 하기\n항상 웃음 가득한 하루하루 보내길 바랄게!\nHappy Wedding💜"
    },
    {
      from: "sooyeon",
      date: "2025.04.23 09:41",
      content: "결혼을 진심으로 축하드립니다💕\n사진도 청첩장도 너무 이쁘요!\n항상 서로를 응원하고 아껴주는 모습이 참 이쁜 커플입니다😊\n행복한 결혼 생활 되길 바래요"
    },
    {
      from: "지현",
      date: "2025.04.22 14:23",
      content: "하윤아 결혼 진심으로 축하해!\n웨딩스냅, 청첩장 모두 너무 예쁘다!💚\n남은 결혼식 준비도 잘 마무리하고!\n행복한 결혼생활 되기를 바래✨"
    }
  ];

  return (
    <View style={styles.romantic_container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5F2" />
      
      {/* 오프닝 오버레이 */}
      <OpeningOverlay visible={showOpening} />
      
      {/* 꽃잎 애니메이션 */}
      <FallingPetals />
      
      <ScrollView
        style={styles.romantic_scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* 인트로 섹션 */}
        <Animated.View style={[
          styles.romantic_introSection,
          {
            opacity: fadeAnims[0],
            transform: [{ translateY: slideAnims[0] }]
          }
        ]}>
          <LinearGradient
            colors={['#F8F5F2', '#F3EFEC']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.romantic_introContent}>
            <Text style={styles.romantic_subtitle}>WEDDING INVITATION</Text>
            <Text style={styles.romantic_loveText}>With Love</Text>
            
            <View style={styles.romantic_mainImageContainer}>
              <MainPhotoSlideshow 
                images={safeImages.main}
                style={styles.romantic_mainPhoto}
                onImagePress={handleImagePress}
                template="romantic"
              />
            </View>
          </View>
        </Animated.View>

        {/* 인사말 섹션 */}
        <Animated.View style={[
          styles.romantic_greetingSection,
          {
            opacity: fadeAnims[1],
            transform: [{ translateY: slideAnims[1] }]
          }
        ]}>
          <View style={styles.romantic_floatingHeart}>
            <HeartPulse style={styles.romantic_heartPulse} delay={1000} />
          </View>
          
          <Text style={styles.romantic_poem}>
            사람이 온다는 건 실은 어마어마한 일이다.{'\n'}
            그는 그의 과거와 현재와 그리고{'\n'}
            그의 미래와 함께 오기 때문이다.{'\n'}
            한 사람의 일생이 오기 때문이다.{'\n\n'}
            - 정현종, '방문객'{'\n\n'}
            저희 두 사람이 함께하는 새로운 시작에{'\n'}
            귀한 발걸음으로 축복해 주시면 감사하겠습니다.
          </Text>
          
          <View style={styles.romantic_divider} />
          
          <Text style={styles.romantic_coupleNames}>
            <Text style={styles.romantic_boldText}>신랑 {eventData.groomName || eventData.groom_name || '이민호'}</Text>
            {' · '}
            <Text style={styles.romantic_boldText}>신부 {eventData.brideName || eventData.bride_name || '배하윤'}</Text>
          </Text>
        </Animated.View>

        {/* 갤러리 섹션 */}
        <Animated.View style={[
          styles.romantic_gallerySection,
          {
            opacity: fadeAnims[2],
            transform: [{ translateY: slideAnims[2] }]
          }
        ]}>
          <Text style={styles.romantic_galleryTitle}>Our Gallery</Text>
          <Text style={styles.romantic_gallerySubtitle}>우리의 특별한 순간들</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.romantic_gallerySlider}
            pagingEnabled
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width * 0.75));
              setGalleryScrollIndex(newIndex);
            }}
          >
            {safeImages.gallery.map((image, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.romantic_galleryItem}
                onPress={() => handleImagePress(safeImages.main.length + index)}
              >
                <Image source={image} style={styles.romantic_galleryImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* 갤러리 인디케이터 */}
          <View style={styles.romantic_galleryDots}>
            {safeImages.gallery.slice(0, 6).map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.romantic_dot,
                  galleryScrollIndex === index && styles.romantic_dotActive
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Oct 4 2025 별도 섹션 */}
        <Animated.View style={[
          styles.romantic_dateSection,
          {
            opacity: fadeAnims[3],
            transform: [{ translateY: slideAnims[3] }]
          }
        ]}>
          <LinearGradient
            colors={['#9B8D82', '#C2B0A2']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.Text style={[
            styles.romantic_dateTextLarge,
            {
              opacity: dateTextAnim,
              transform: [{ translateY: dateTextAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}]
            }
          ]}>
            Oct 4, 2025
          </Animated.Text>
          <Text style={styles.romantic_dateSubtext}>우리가 하나가 되는 날</Text>
        </Animated.View>

        {/* Wedding Day 섹션 */}
        <Animated.View style={[
          styles.romantic_weddingDaySection,
          {
            opacity: fadeAnims[4],
            transform: [{ translateY: slideAnims[4] }]
          }
        ]}>
          <Text style={styles.romantic_weddingDayTitle}>Wedding Day</Text>
          <View style={styles.romantic_dateInfo}>
            <Text style={styles.romantic_dateMain}>{dateInfo.full}</Text>
            <Text style={styles.romantic_dateSub}>Saturday, October 4, 2025 | 12:00 PM</Text>
          </View>
          
          <View style={styles.romantic_divider} />
          
          {/* 달력 */}
          <RomanticPinkCalendar 
            targetDate={eventData.date || eventData.event_date || '2025-10-04'}
            style={styles.romantic_calendar}
          />
          
          {/* 카운트다운 */}
          <View style={styles.romantic_countdown}>
            <CountdownDisplay 
              timeLeft={timeLeft}
              style={styles.romantic_countdownGrid}
              textStyle={styles.romantic_countdownNumber}
              labelStyle={styles.romantic_countdownLabel}
              isExpired={timeLeft.isExpired}
            />
          </View>
          
          <Text style={styles.romantic_countdownMessage}>
            {eventData.groomName || eventData.groom_name || '민호'} 
            <Text style={styles.romantic_heartText}> ♥ </Text>
            {eventData.brideName || eventData.bride_name || '하윤'}의 결혼식이{' '}
            <Text style={styles.romantic_countdownDays}>{timeLeft.days}일</Text> 남았습니다
          </Text>
        </Animated.View>

        {/* 신랑신부 카드 */}
        <Animated.View style={[
          styles.romantic_coupleSection,
          {
            opacity: fadeAnims[5],
            transform: [{ translateY: slideAnims[5] }]
          }
        ]}>
          <LinearGradient
            colors={['#F8F5F2', '#F5F3F2']}
            style={StyleSheet.absoluteFill}
          />
          
          <Text style={styles.romantic_coupleTitle}>Meet the Couple</Text>
          
          <View style={styles.romantic_coupleCards}>
            {/* 신부 카드 */}
            <View style={styles.romantic_coupleCard}>
              <View style={styles.romantic_couplePhotoContainer}>
                <Image
                  source={safeImages.bride[0]}
                  style={styles.romantic_couplePhoto}
                />
              </View>
              <Text style={styles.romantic_coupleRole}>신부</Text>
              <Text style={styles.romantic_coupleName}>{eventData.brideName || eventData.bride_name || '배하윤'}</Text>
              <Text style={styles.romantic_coupleEngName}>Bae Hayoon</Text>
              <Text style={styles.romantic_coupleParents}>
                {eventData.brideFatherName || eventData.bride_father_name || '배종영'} · {eventData.brideMotherName || eventData.bride_mother_name || '유미연'}의 딸
              </Text>
              <Text style={styles.romantic_coupleInfo}>
                1995년 7월 제주 출생{'\n'}
                감성 과다 제주소녀 🍊
              </Text>
            </View>
            
            {/* 신랑 카드 */}
            <View style={styles.romantic_coupleCard}>
              <View style={styles.romantic_couplePhotoContainer}>
                <Image
                  source={safeImages.groom[0]}
                  style={styles.romantic_couplePhoto}
                />
              </View>
              <Text style={styles.romantic_coupleRole}>신랑</Text>
              <Text style={styles.romantic_coupleName}>{eventData.groomName || eventData.groom_name || '이민호'}</Text>
              <Text style={styles.romantic_coupleEngName}>Lee Minho</Text>
              <Text style={styles.romantic_coupleParents}>
                {eventData.groomFatherName || eventData.groom_father_name || '이상현'} · {eventData.groomMotherName || eventData.groom_mother_name || '김미정'}의 아들
              </Text>
              <Text style={styles.romantic_coupleInfo}>
                1993년 3월 서울 출생{'\n'}
                따뜻한 서울 남자 ☕
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 방명록 메시지 섹션 */}
        <Animated.View style={[
          styles.romantic_messagesSection,
          {
            opacity: fadeAnims[6],
            transform: [{ translateY: slideAnims[6] }]
          }
        ]}>
          <LinearGradient
            colors={['#F8F5F2', '#F3EFEC']}
            style={StyleSheet.absoluteFill}
          />
          
          <Text style={styles.romantic_messagesTitle}>Messages</Text>
          <Text style={styles.romantic_messagesSubtitle}>
            저희 둘에게 따뜻한 방명록을 남겨주세요
          </Text>
          
          <GuestBookMessages 
            messages={guestMessages}
            onAddMessage={openMessageModal}
          />
        </Animated.View>

        {/* 오시는 길 */}
        <Animated.View style={[
          styles.romantic_locationSection,
          {
            opacity: fadeAnims[7],
            transform: [{ translateY: slideAnims[7] }]
          }
        ]}>
          <Text style={styles.romantic_locationTitle}>Location</Text>
          <View style={styles.romantic_venueInfo}>
            <Text style={styles.romantic_venueName}>
              {eventData.location || '더 플라자 지스텀하우스 22층'}
            </Text>
            <Text style={styles.romantic_venueAddress}>
              {eventData.detailedAddress || eventData.detailed_address || '서울시 중구 소공로 119'}
            </Text>
          </View>
          
          <View style={styles.romantic_mapContainer}>
            <Text style={styles.romantic_mapPlaceholder}>🗺️</Text>
            <Text style={styles.romantic_mapText}>지도 영역</Text>
          </View>
          
          <View style={styles.romantic_transportCard}>
            <View style={styles.romantic_transportIcon}>
              <Text>🅿️</Text>
            </View>
            <View style={styles.romantic_transportContent}>
              <Text style={styles.romantic_transportTitle}>주차 안내</Text>
              <Text style={styles.romantic_transportText}>
                더 플라자 호텔 주차장 이용{'\n'}
                하객 3시간 무료 주차{'\n'}
                주차 요원의 안내를 받아주세요
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.romantic_navigationButton} onPress={handleNavigation}>
            <Ionicons name="navigate" size={20} color="white" />
            <Text style={styles.romantic_navigationText}>길찾기</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 계좌번호 토글 */}
        <Animated.View style={[
          styles.romantic_accountSection,
          {
            opacity: fadeAnims[8],
            transform: [{ translateY: slideAnims[8] }]
          }
        ]}>
          <LinearGradient
            colors={['#F8F5F2', '#F3EFEC']}
            style={StyleSheet.absoluteFill}
          />
          
          <Text style={styles.romantic_accountTitle}>Gift of Love</Text>
          <Text style={styles.romantic_accountSubtitle}>
            참석이 어려우신 분들을 위해 마련했습니다{'\n'}
            마음만으로도 감사드립니다
          </Text>
          
          <AccountToggle
            groomAccount={{
              bank: "국민은행",
              number: "123-456-789012",
              name: eventData.groomName || eventData.groom_name || "이민호"
            }}
            brideAccount={{
              bank: "신한은행",
              number: "987-654-321098",
              name: eventData.brideName || eventData.bride_name || "배하윤"
            }}
            activeToggle={activeAccountToggle}
            onToggle={handleAccountToggle}
            onCopy={copyAccount}
          />
        </Animated.View>

        {/* 공유 섹션 */}
        <Animated.View style={[
          styles.romantic_shareSection,
          {
            opacity: fadeAnims[9],
            transform: [{ translateY: slideAnims[9] }]
          }
        ]}>
          <TouchableOpacity style={styles.romantic_shareButton} onPress={handleShare}>
            <LinearGradient
              colors={['#C2B0A2', '#9B8D82']}
              style={styles.romantic_shareButtonGradient}
            >
              <Ionicons name="share-social" size={24} color="white" />
              <Text style={styles.romantic_shareButtonText}>청첩장 공유하기</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* 푸터 */}
        <Animated.View style={[
          styles.romantic_footerSection,
          {
            opacity: fadeAnims[10],
            transform: [{ translateY: slideAnims[10] }]
          }
        ]}>
          <LinearGradient
            colors={['#9B8D82', '#C2B0A2']}
            style={StyleSheet.absoluteFill}
          />
          
          <Text style={styles.romantic_footerTitle}>Thank You</Text>
          <View style={styles.romantic_footerDivider} />
          <Text style={styles.romantic_footerMessage}>
            저희의 새로운 시작을 축복해주셔서{'\n'}
            진심으로 감사드립니다
          </Text>
        </Animated.View>
      </ScrollView>

      {/* 이미지 뷰어 */}
      <ImageViewer 
        visible={showImageViewer}
        images={[...safeImages.main, ...safeImages.gallery]}
        currentIndex={currentImageIndex}
        onClose={() => setShowImageViewer(false)}
        onIndexChange={setCurrentImageIndex}
      />

      {/* 메시지 작성 모달 */}
      <Modal
        visible={showMessageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.romantic_modalOverlay}>
          <View style={styles.romantic_modalContent}>
            <Text style={styles.romantic_modalTitle}>축하 메시지 남기기</Text>
            <TouchableOpacity 
              style={styles.romantic_modalClose}
              onPress={() => setShowMessageModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RomanticPinkTemplate;