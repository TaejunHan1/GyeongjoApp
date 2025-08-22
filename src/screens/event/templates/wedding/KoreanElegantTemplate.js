// src/screens/event/templates/wedding/KoreanElegantTemplate.js
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  useCountdown,
  getCategorizedImagesSafe,
  formatKoreanDate,
  formatKoreanTime,
  KoreanColors,
} from './WeddingUtils';
import {
  FallingPetals,
  CountdownDisplay,
  ImageViewer,
  MainPhotoSlideshow,
  HeartPulse,
  KoreanElegantCalendar,
} from './WeddingCommonComponents';
import styles from './WeddingStyles';

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
      
      // 템플릿 공유 로직 - 웹 링크로 이동
      const WEB_BASE_URL = 'https://contribution-web-srgt.vercel.app';
      const eventId = eventData.id || eventData.event_id || 'sample-event';
      const templateUrl = `${WEB_BASE_URL}/template/${eventId}?template=korean`;
      
      console.log('🔍 공유 링크 생성:', { eventData, eventId, templateUrl });
      
      await Share.share({
        message: `${groomName} ♥ ${brideName} 결혼식에 초대합니다!\n\n${dateStr} ${timeStr}\n${location}\n\n모바일 청첩장을 확인하세요:\n${templateUrl}`,
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

export default KoreanElegantTemplate;