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
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
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
  const [activeAccountToggle, setActiveAccountToggle] = useState('groom');

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(Array.from({ length: 14 }, () => new Animated.Value(0))).current;
  const slideAnims = useRef(Array.from({ length: 14 }, () => new Animated.Value(50))).current;
  
  // 실시간 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date, 
    eventData.ceremonyTime || eventData.ceremony_time
  );
  
  // 카테고리별 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // 신랑/신부 사진 유무 확인
  const hasGroomPhoto = categorizedImages?.groom?.length > 0 && typeof categorizedImages.groom[0] !== 'number';
  const hasBridePhoto = categorizedImages?.bride?.length > 0 && typeof categorizedImages.bride[0] !== 'number';
  const hasCouplePhotos = hasGroomPhoto || hasBridePhoto;

  
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
      
      
      await Share.share({
        message: `${groomName} ♥ ${brideName} 결혼식에 초대합니다!\n\n${dateStr} ${timeStr}\n${location}\n\n모바일 청첩장을 확인하세요:\n${templateUrl}`,
        title: '모바일 청첩장',
      });
    } catch (error) {
    }
  };

  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const handleAccountToggle = (type) => {
    setActiveAccountToggle(activeAccountToggle === type ? null : type);
  };

  const copyAccount = async (accountNumber) => {
    try {
      await Clipboard.setStringAsync(accountNumber);
      Alert.alert('복사 완료', '계좌번호가 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '복사에 실패했습니다.');
    }
  };

  // 계좌 정보 존재 여부
  const hasAnyAccount = !!(
    eventData.additional_info?.groom_account_number ||
    eventData.additional_info?.groom_father_account_number ||
    eventData.additional_info?.groom_mother_account_number ||
    eventData.additional_info?.bride_account_number ||
    eventData.additional_info?.bride_father_account_number ||
    eventData.additional_info?.bride_mother_account_number
  );

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

          {/* 인사 메시지 박스 */}
          <View style={styles.korean_greetingMessageBox}>
            <Text style={styles.korean_customMessage}>
              {eventData.customMessage || eventData.custom_message ||
               '두 사람이 하나 되어 새로운 인생을 시작하려 합니다.\n저희의 소중한 첫걸음에 함께해 주시면 더없는 기쁨이겠습니다.'}
            </Text>
          </View>

          {/* 신랑 · 신부 이름 카드 */}
          <View style={styles.korean_greetingCoupleRow}>
            <View style={styles.korean_greetingCoupleItem}>
              <Text style={styles.korean_greetingCoupleRole}>신랑</Text>
              <Text style={styles.korean_greetingCoupleName}>
                {eventData.groomName || eventData.groom_name || '신랑'}
              </Text>
              <Text style={styles.korean_greetingCoupleParents}>
                {eventData.additional_info?.groom_father_name || eventData.groomFatherName || '아버지'}{' · '}{eventData.additional_info?.groom_mother_name || eventData.groomMotherName || '어머니'}의 아들
              </Text>
            </View>

            <Text style={styles.korean_greetingHeart}>♡</Text>

            <View style={styles.korean_greetingCoupleItem}>
              <Text style={styles.korean_greetingCoupleRole}>신부</Text>
              <Text style={styles.korean_greetingCoupleName}>
                {eventData.brideName || eventData.bride_name || '신부'}
              </Text>
              <Text style={styles.korean_greetingCoupleParents}>
                {eventData.additional_info?.bride_father_name || eventData.brideFatherName || '아버지'}{' · '}{eventData.additional_info?.bride_mother_name || eventData.brideMotherName || '어머니'}의 딸
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 신랑신부 소개 - 사진이 있을 때만 */}
        {hasCouplePhotos && (
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
        )}

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
              }}
            >
              <MaterialIcons name="card-giftcard" size={20} color={KoreanColors.elegant.primary} />
              <Text style={styles.korean_contributionButtonText}>부조하기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 계좌번호 섹션 */}
        {hasAnyAccount && (
          <Animated.View style={[
            koreanAccountStyles.accountSection,
            {
              opacity: fadeAnims[10],
              transform: [{ translateY: slideAnims[10] }]
            }
          ]}>
            <View style={styles.korean_sectionHeader}>
              <View style={styles.korean_decorativeLine} />
              <Text style={styles.korean_sectionTitle}>마음 전하실 곳</Text>
              <View style={styles.korean_decorativeLine} />
            </View>

            {/* 토글 버튼 */}
            <View style={koreanAccountStyles.toggleContainer}>
              <View style={koreanAccountStyles.toggleButtons}>
                <TouchableOpacity
                  style={[
                    koreanAccountStyles.toggleButton,
                    activeAccountToggle === 'groom' && koreanAccountStyles.toggleButtonActive
                  ]}
                  onPress={() => handleAccountToggle('groom')}
                >
                  <Text style={[
                    koreanAccountStyles.toggleButtonText,
                    activeAccountToggle === 'groom' && koreanAccountStyles.toggleButtonTextActive
                  ]}>신랑측</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    koreanAccountStyles.toggleButton,
                    activeAccountToggle === 'bride' && koreanAccountStyles.toggleButtonActive
                  ]}
                  onPress={() => handleAccountToggle('bride')}
                >
                  <Text style={[
                    koreanAccountStyles.toggleButtonText,
                    activeAccountToggle === 'bride' && koreanAccountStyles.toggleButtonTextActive
                  ]}>신부측</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 신랑측 계좌 */}
            {activeAccountToggle === 'groom' && (eventData.additional_info?.groom_account_number ||
              eventData.additional_info?.groom_father_account_number ||
              eventData.additional_info?.groom_mother_account_number) && (
              <View style={koreanAccountStyles.accountGroup}>
                {eventData.additional_info?.groom_account_number && (
                  <TouchableOpacity
                    style={koreanAccountStyles.accountCard}
                    onPress={() => copyAccount(eventData.additional_info.groom_account_number)}
                  >
                    <View style={koreanAccountStyles.accountInfo}>
                      <Text style={koreanAccountStyles.accountName}>
                        {eventData.groomName || eventData.groom_name || '신랑'}
                      </Text>
                      <View style={koreanAccountStyles.bankInfo}>
                        <Text style={koreanAccountStyles.bankName}>{eventData.additional_info.groom_bank_name || '은행'}</Text>
                        <Text style={koreanAccountStyles.accountNumber}>{eventData.additional_info.groom_account_number}</Text>
                      </View>
                    </View>
                    <View style={koreanAccountStyles.copyButton}>
                      <Text style={koreanAccountStyles.copyButtonText}>복사</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {eventData.additional_info?.groom_father_account_number && (
                  <TouchableOpacity
                    style={koreanAccountStyles.accountCard}
                    onPress={() => copyAccount(eventData.additional_info.groom_father_account_number)}
                  >
                    <View style={koreanAccountStyles.accountInfo}>
                      <Text style={koreanAccountStyles.accountName}>
                        {eventData.groomFatherName || eventData.groom_father_name || '신랑 아버지'} 아버님
                      </Text>
                      <View style={koreanAccountStyles.bankInfo}>
                        <Text style={koreanAccountStyles.bankName}>{eventData.additional_info.groom_father_bank_name || '은행'}</Text>
                        <Text style={koreanAccountStyles.accountNumber}>{eventData.additional_info.groom_father_account_number}</Text>
                      </View>
                    </View>
                    <View style={koreanAccountStyles.copyButton}>
                      <Text style={koreanAccountStyles.copyButtonText}>복사</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {eventData.additional_info?.groom_mother_account_number && (
                  <TouchableOpacity
                    style={koreanAccountStyles.accountCard}
                    onPress={() => copyAccount(eventData.additional_info.groom_mother_account_number)}
                  >
                    <View style={koreanAccountStyles.accountInfo}>
                      <Text style={koreanAccountStyles.accountName}>
                        {eventData.groomMotherName || eventData.groom_mother_name || '신랑 어머니'} 어머님
                      </Text>
                      <View style={koreanAccountStyles.bankInfo}>
                        <Text style={koreanAccountStyles.bankName}>{eventData.additional_info.groom_mother_bank_name || '은행'}</Text>
                        <Text style={koreanAccountStyles.accountNumber}>{eventData.additional_info.groom_mother_account_number}</Text>
                      </View>
                    </View>
                    <View style={koreanAccountStyles.copyButton}>
                      <Text style={koreanAccountStyles.copyButtonText}>복사</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 신부측 계좌 */}
            {activeAccountToggle === 'bride' && (eventData.additional_info?.bride_account_number ||
              eventData.additional_info?.bride_father_account_number ||
              eventData.additional_info?.bride_mother_account_number) && (
              <View style={koreanAccountStyles.accountGroup}>
                {eventData.additional_info?.bride_account_number && (
                  <TouchableOpacity
                    style={koreanAccountStyles.accountCard}
                    onPress={() => copyAccount(eventData.additional_info.bride_account_number)}
                  >
                    <View style={koreanAccountStyles.accountInfo}>
                      <Text style={koreanAccountStyles.accountName}>
                        {eventData.brideName || eventData.bride_name || '신부'}
                      </Text>
                      <View style={koreanAccountStyles.bankInfo}>
                        <Text style={koreanAccountStyles.bankName}>{eventData.additional_info.bride_bank_name || '은행'}</Text>
                        <Text style={koreanAccountStyles.accountNumber}>{eventData.additional_info.bride_account_number}</Text>
                      </View>
                    </View>
                    <View style={koreanAccountStyles.copyButton}>
                      <Text style={koreanAccountStyles.copyButtonText}>복사</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {eventData.additional_info?.bride_father_account_number && (
                  <TouchableOpacity
                    style={koreanAccountStyles.accountCard}
                    onPress={() => copyAccount(eventData.additional_info.bride_father_account_number)}
                  >
                    <View style={koreanAccountStyles.accountInfo}>
                      <Text style={koreanAccountStyles.accountName}>
                        {eventData.brideFatherName || eventData.bride_father_name || '신부 아버지'} 아버님
                      </Text>
                      <View style={koreanAccountStyles.bankInfo}>
                        <Text style={koreanAccountStyles.bankName}>{eventData.additional_info.bride_father_bank_name || '은행'}</Text>
                        <Text style={koreanAccountStyles.accountNumber}>{eventData.additional_info.bride_father_account_number}</Text>
                      </View>
                    </View>
                    <View style={koreanAccountStyles.copyButton}>
                      <Text style={koreanAccountStyles.copyButtonText}>복사</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {eventData.additional_info?.bride_mother_account_number && (
                  <TouchableOpacity
                    style={koreanAccountStyles.accountCard}
                    onPress={() => copyAccount(eventData.additional_info.bride_mother_account_number)}
                  >
                    <View style={koreanAccountStyles.accountInfo}>
                      <Text style={koreanAccountStyles.accountName}>
                        {eventData.brideMotherName || eventData.bride_mother_name || '신부 어머니'} 어머님
                      </Text>
                      <View style={koreanAccountStyles.bankInfo}>
                        <Text style={koreanAccountStyles.bankName}>{eventData.additional_info.bride_mother_bank_name || '은행'}</Text>
                        <Text style={koreanAccountStyles.accountNumber}>{eventData.additional_info.bride_mother_account_number}</Text>
                      </View>
                    </View>
                    <View style={koreanAccountStyles.copyButton}>
                      <Text style={koreanAccountStyles.copyButtonText}>복사</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        )}

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

const koreanAccountStyles = StyleSheet.create({
  accountSection: {
    backgroundColor: KoreanColors.elegant.light,
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: KoreanColors.elegant.secondary,
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 22,
  },
  toggleButtonActive: {
    backgroundColor: KoreanColors.elegant.accent,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    opacity: 0.5,
  },
  toggleButtonTextActive: {
    color: '#ffffff',
    opacity: 1,
  },
  accountGroup: {
    marginTop: 5,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: KoreanColors.elegant.secondary,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    marginBottom: 4,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 13,
    color: KoreanColors.elegant.text,
    opacity: 0.6,
    marginRight: 8,
  },
  accountNumber: {
    fontSize: 13,
    color: KoreanColors.elegant.text,
    opacity: 0.8,
  },
  copyButton: {
    backgroundColor: KoreanColors.elegant.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default KoreanElegantTemplate;