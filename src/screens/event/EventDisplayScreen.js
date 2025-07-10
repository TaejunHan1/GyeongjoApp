// src/screens/event/EventDisplayScreen.js - 완전한 개선 버전
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
  ImageBackground,
  ScrollView,
  Image,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../styles/constants';
import { getEventDetail } from '../../lib/supabaseHelper';

const { width, height } = Dimensions.get('window');
const WEB_BASE_URL = 'https://jeongdam.com';

export default function EventDisplayScreen({ navigation, route }) {
  const { eventId, templateStyle = 'modern-minimal', previewData } = route.params;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');
  const [showExitButton, setShowExitButton] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [userImages, setUserImages] = useState([]);

  // 애니메이션 refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const qrPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (eventId === 'preview' && previewData) {
      setIsPreviewMode(true);
      setEvent(previewData);
      setQrValue('https://jeongdam.com/preview');
      setLoading(false);
      
      if (previewData.userImages && previewData.userImages.length > 0) {
        setUserImages(previewData.userImages);
        console.log('🖼️ 사용자 이미지 설정됨:', previewData.userImages.length);
      }
    } else {
      loadEventData();
    }
    
    startAnimations();
    
    const imageSlideInterval = startImageSlideshow(getImageCount());
    
    const exitTimer = setTimeout(() => {
      setShowExitButton(true);
    }, 8000);

    return () => {
      clearTimeout(exitTimer);
      clearInterval(imageSlideInterval);
    };
  }, [eventId, previewData]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const result = await getEventDetail(eventId);
      
      if (result.success) {
        setEvent(result.data);
        setQrValue(`${WEB_BASE_URL}/contribute/${result.data.id}`);
        
        if (result.data.image_urls && result.data.image_urls.length > 0) {
          setUserImages(result.data.image_urls.map(url => ({ uri: url })));
        }
      } else {
        console.error('Event loading failed:', result.error);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Event loading error:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // QR 맥박 효과
    Animated.loop(
      Animated.sequence([
        Animated.timing(qrPulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(qrPulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startImageSlideshow = (imageCount) => {
    if (imageCount <= 1) return null;
    return setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageCount);
    }, 4000);
  };

  const getImageSource = (index) => {
    // 🔥 사용자 업로드 이미지 우선 사용
    if (userImages && userImages.length > 0) {
      console.log('📷 사용자 이미지 사용:', index % userImages.length);
      return userImages[index % userImages.length];
    }

    const eventType = event?.event_type || 'wedding';
    let imageSet;
    
    switch (eventType) {
      case 'wedding':
        imageSet = [
          require('../../../assets/images/aa1.png'),
          require('../../../assets/images/aa2.png'),
          require('../../../assets/images/aa3.png'),
          require('../../../assets/images/aa4.png'),
        ];
        break;
      case 'funeral':
        imageSet = [
          require('../../../assets/images/bb1.png'),
          require('../../../assets/images/bb2.png'),
        ];
        break;
      case 'birthday':
        imageSet = [
          require('../../../assets/images/aa1.png'),
          require('../../../assets/images/aa2.png'),
          require('../../../assets/images/aa3.png'),
          require('../../../assets/images/aa4.png'),
        ];
        break;
      default:
        imageSet = [
          require('../../../assets/images/aa1.png'),
          require('../../../assets/images/aa2.png'),
          require('../../../assets/images/aa3.png'),
          require('../../../assets/images/aa4.png'),
        ];
    }
    
    return imageSet[index % imageSet.length];
  };

  const getImageCount = () => {
    if (userImages && userImages.length > 0) {
      return userImages.length;
    }
    return 4;
  };

  const formatDate = (dateString) => {
    if (!dateString) return { 
      year: '2024', 
      month: '12', 
      day: '14', 
      weekday: 'SATURDAY',
      koreanDate: '2024년 12월 14일',
      koreanWeekday: '토요일',
      shortMonth: 'DEC'
    };
    const date = new Date(dateString);
    return {
      year: date.getFullYear().toString(),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      day: String(date.getDate()).padStart(2, '0'),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
      koreanDate: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
      koreanWeekday: date.toLocaleDateString('ko-KR', { weekday: 'long' }),
      shortMonth: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  const formatTime = (timeString) => {
    if (!timeString) return '오후 2:00';
    
    // timeString이 "14:00:00" 형태일 때
    if (typeof timeString === 'string' && timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${isPM ? '오후' : '오전'} ${displayHour}:${minutes}`;
    }
    
    // Date 객체일 때
    const date = new Date(timeString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleContribute = () => {
    if (isPreviewMode) {
      alert('미리보기 모드입니다. 실제 부조는 완성된 경조사에서 가능합니다.');
      return;
    }
    
    navigation.navigate('Contribution', {
      eventId: event.id,
      eventName: event.event_name
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="tv" size={48} color="#ec4899" />
          <Text style={styles.loadingText}>초대장 준비 중</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>초대장을 불러올 수 없습니다</Text>
      </View>
    );
  }

  const dateInfo = formatDate(event.event_date);

  // 🌟 모던 미니멀 템플릿
  const renderModernMinimalTemplate = () => (
    <View style={styles.modernContainer}>
      {isPreviewMode && (
        <View style={styles.previewBanner}>
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.previewBannerText}>미리보기 모드</Text>
        </View>
      )}
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.modernContent, { opacity: fadeAnim }]}>
          
          {/* Save the Date 헤더 */}
          <View style={styles.modernSaveHeader}>
            <Text style={styles.modernSaveText}>SAVE THE DATE</Text>
            <View style={styles.modernDateBadge}>
              <Text style={styles.modernDateBadgeText}>
                {dateInfo.shortMonth} {dateInfo.day}
              </Text>
            </View>
          </View>

          {/* 메인 이미지 섹션 */}
          <View style={styles.modernMainImageSection}>
            <View style={styles.modernMainImageCard}>
              <Image
                source={getImageSource(currentImageIndex)}
                style={styles.modernMainImage}
                resizeMode="cover"
              />
              <View style={styles.modernImageGradient} />
              <View style={styles.modernImageContent}>
                <Text style={styles.modernImageTitle}>We're Getting</Text>
                <Text style={styles.modernImageTitle}>Married</Text>
                <View style={styles.modernImageDivider} />
                <Text style={styles.modernImageDate}>{dateInfo.koreanDate}</Text>
              </View>
            </View>
            
            {/* 이미지 인디케이터 */}
            {getImageCount() > 1 && (
              <View style={styles.modernImageIndicator}>
                {[...Array(getImageCount())].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.modernImageDot,
                      { backgroundColor: currentImageIndex === index ? '#ec4899' : 'rgba(255,255,255,0.7)' }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* 신랑신부 이름 */}
          <View style={styles.modernNamesSection}>
            <View style={styles.modernNameCard}>
              <Text style={styles.modernNameLabel}>GROOM</Text>
              <Text style={styles.modernNameText}>
                {event.groom_name || event.main_person_name?.split(',')[0] || '신랑이름'}
              </Text>
            </View>
            <View style={styles.modernHeartIcon}>
              <Ionicons name="heart" size={24} color="#ec4899" />
            </View>
            <View style={styles.modernNameCard}>
              <Text style={styles.modernNameLabel}>BRIDE</Text>
              <Text style={styles.modernNameText}>
                {event.bride_name || event.main_person_name?.split(',')[1]?.trim() || '신부이름'}
              </Text>
            </View>
          </View>

          {/* 초대 메시지 */}
          <View style={styles.modernInviteSection}>
            <View style={styles.modernInviteCard}>
              <Text style={styles.modernInviteTitle}>초대합니다</Text>
              <Text style={styles.modernInviteMessage}>
                {event.custom_message || 
                 '두 사람이 사랑으로 하나 되는\n소중한 순간을 함께해 주세요'}
              </Text>
              
              <View style={styles.modernEventDetails}>
                <View style={styles.modernDetailItem}>
                  <Ionicons name="calendar" size={16} color="#ec4899" />
                  <Text style={styles.modernDetailText}>
                    {dateInfo.koreanDate} {formatTime(event.ceremony_time)}
                  </Text>
                </View>
                
                {event.location && (
                  <View style={styles.modernDetailItem}>
                    <Ionicons name="location" size={16} color="#ec4899" />
                    <Text style={styles.modernDetailText}>{event.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 갤러리 섹션 */}
          <View style={styles.modernGallerySection}>
            <Text style={styles.modernSectionTitle}>GALLERY</Text>
            <View style={styles.modernGalleryGrid}>
              {[...Array(Math.min(6, getImageCount()))].map((_, index) => (
                <View key={index} style={styles.modernGalleryItem}>
                  <Image
                    source={getImageSource(index)}
                    style={styles.modernGalleryImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          </View>

          {/* QR 코드 & 축의금 섹션 */}
          <View style={styles.modernQRSection}>
            <View style={styles.modernQRCard}>
              <Text style={styles.modernQRTitle}>축하의 마음을 전해주세요</Text>
              
              <Animated.View 
                style={[
                  styles.modernQRContainer,
                  { transform: [{ scale: qrPulseAnim }] }
                ]}
              >
                <QRCode
                  value={qrValue}
                  size={160}
                  color="#1f2937"
                  backgroundColor="white"
                  quietZone={15}
                />
              </Animated.View>
              
              <Text style={styles.modernQRSubtitle}>
                QR 코드를 스캔하여 간편하게 축의금을 전달하세요
              </Text>
              
              <TouchableOpacity 
                style={styles.modernQRButton}
                onPress={handleContribute}
              >
                <Ionicons name="heart" size={18} color="white" />
                <Text style={styles.modernQRButtonText}>
                  {isPreviewMode ? 'PREVIEW MODE' : 'SEND CONGRATULATIONS'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );

  // 🌸 로맨틱 플로럴 템플릿
  const renderRomanticFloralTemplate = () => (
    <ScrollView style={styles.romanticContainer}>
      {isPreviewMode && (
        <View style={styles.previewBanner}>
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.previewBannerText}>미리보기 모드</Text>
        </View>
      )}
      
      <View style={styles.romanticBackground}>
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.romanticHeader,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.romanticDecoTop}>
            <Text style={styles.romanticDecorIcon}>🌸</Text>
            <Text style={styles.romanticDecorIcon}>💕</Text>
            <Text style={styles.romanticDecorIcon}>🌸</Text>
          </View>
          
          <Text style={styles.romanticTitle}>Wedding Invitation</Text>
          
          <View style={styles.romanticNames}>
            <Text style={styles.romanticName}>
              {event.groom_name || event.main_person_name?.split(',')[0] || 'Groom'}
            </Text>
            <Text style={styles.romanticHeart}>💖</Text>
            <Text style={styles.romanticName}>
              {event.bride_name || event.main_person_name?.split(',')[1]?.trim() || 'Bride'}
            </Text>
          </View>
        </Animated.View>

        {/* Main Photo */}
        <View style={styles.romanticPhotoSection}>
          <View style={styles.romanticPhotoFrame}>
            <Image 
              source={getImageSource(currentImageIndex)} 
              style={styles.romanticPhoto}
              resizeMode="cover"
            />
            <View style={styles.romanticPhotoDecor}>
              <Text style={styles.romanticFlower}>🌹</Text>
              <Text style={styles.romanticFlower}>🌹</Text>
            </View>
          </View>
        </View>

        {/* Wedding Details */}
        <View style={styles.romanticDetailsCard}>
          <Text style={styles.romanticDetailsTitle}>Wedding Details</Text>
          
          <View style={styles.romanticDetailItem}>
            <Text style={styles.romanticDetailIcon}>📅</Text>
            <Text style={styles.romanticDetailText}>
              {dateInfo.koreanDate}
            </Text>
          </View>
          
          <View style={styles.romanticDetailItem}>
            <Text style={styles.romanticDetailIcon}>🕐</Text>
            <Text style={styles.romanticDetailText}>
              {formatTime(event.ceremony_time)}
            </Text>
          </View>
          
          <View style={styles.romanticDetailItem}>
            <Text style={styles.romanticDetailIcon}>🏛️</Text>
            <Text style={styles.romanticDetailText}>
              {event.location || 'Wedding Hall'}
            </Text>
          </View>
        </View>

        {/* Family Section */}
        <View style={styles.romanticFamilySection}>
          <Text style={styles.romanticFamilyTitle}>가족 소개</Text>
          
          <View style={styles.romanticFamilyCards}>
            <View style={styles.romanticFamilyCard}>
              <Text style={styles.romanticFamilyLabel}>신랑측</Text>
              <Text style={styles.romanticFamilyName}>
                {event.groom_father_name || '○○○'} · {event.groom_mother_name || '○○○'}
              </Text>
              <Text style={styles.romanticFamilyRelation}>의 아들</Text>
              <Text style={styles.romanticCoupleName}>
                {event.groom_name || event.main_person_name?.split(',')[0] || '신랑'}
              </Text>
            </View>
            
            <View style={styles.romanticFamilyCard}>
              <Text style={styles.romanticFamilyLabel}>신부측</Text>
              <Text style={styles.romanticFamilyName}>
                {event.bride_father_name || '○○○'} · {event.bride_mother_name || '○○○'}
              </Text>
              <Text style={styles.romanticFamilyRelation}>의 딸</Text>
              <Text style={styles.romanticCoupleName}>
                {event.bride_name || event.main_person_name?.split(',')[1]?.trim() || '신부'}
              </Text>
            </View>
          </View>
        </View>

        {/* Love Message */}
        <View style={styles.romanticMessageSection}>
          <Text style={styles.romanticMessageTitle}>💌 Love Message</Text>
          <Text style={styles.romanticMessageText}>
            {event.custom_message || 
             '서로를 향한 진실한 마음이\n아름다운 사랑으로 꽃피었습니다.\n\n소중한 분들과 함께\n새로운 시작을 약속합니다.'}
          </Text>
        </View>

        {/* QR Section */}
        <View style={styles.romanticQRSection}>
          <Text style={styles.romanticQRTitle}>축복의 마음 전하기</Text>
          <View style={styles.romanticQRCard}>
            <Animated.View style={{ transform: [{ scale: qrPulseAnim }] }}>
              <QRCode
                value={qrValue}
                size={150}
                color="#be185d"
                backgroundColor="white"
                quietZone={15}
              />
            </Animated.View>
          </View>
          <TouchableOpacity 
            style={styles.romanticButton}
            onPress={handleContribute}
          >
            <Ionicons name="heart" size={18} color="white" />
            <Text style={styles.romanticButtonText}>
              {isPreviewMode ? '미리보기 모드' : '축하 인사 전하기'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );

  // 🎨 아티스틱 모던 템플릿
  const renderArtisticModernTemplate = () => (
    <View style={styles.artisticContainer}>
      {isPreviewMode && (
        <View style={styles.previewBanner}>
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.previewBannerText}>미리보기 모드</Text>
        </View>
      )}
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.artisticContent, { opacity: fadeAnim }]}>
          
          {/* Geometric Header */}
          <View style={styles.artisticHeader}>
            <View style={styles.artisticGeometric}>
              <View style={styles.artisticShape1} />
              <View style={styles.artisticShape2} />
              <View style={styles.artisticShape3} />
            </View>
            
            <Text style={styles.artisticTitle}>MODERN WEDDING</Text>
            <Text style={styles.artisticSubtitle}>Contemporary Celebration</Text>
          </View>

          {/* Split Image Layout */}
          <View style={styles.artisticImageSection}>
            <View style={styles.artisticMainImage}>
              <Image 
                source={getImageSource(currentImageIndex)} 
                style={styles.artisticImage}
                resizeMode="cover"
              />
              <View style={styles.artisticImageOverlay}>
                <Text style={styles.artisticCoupleNames}>
                  {(event.groom_name || 'GROOM')} × {(event.bride_name || 'BRIDE')}
                </Text>
              </View>
            </View>
            
            <View style={styles.artisticSideImages}>
              {[...Array(2)].map((_, index) => (
                <View key={index} style={styles.artisticSideImage}>
                  <Image source={getImageSource(index + 1)} style={styles.artisticSideImg} />
                </View>
              ))}
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.artisticInfoSection}>
            <View style={styles.artisticInfoCards}>
              <View style={styles.artisticInfoCard}>
                <Text style={styles.artisticInfoIcon}>📍</Text>
                <View>
                  <Text style={styles.artisticInfoTitle}>VENUE</Text>
                  <Text style={styles.artisticInfoText}>
                    {event.location || 'Modern Art Gallery'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.artisticInfoCard}>
                <Text style={styles.artisticInfoIcon}>⏰</Text>
                <View>
                  <Text style={styles.artisticInfoTitle}>TIME</Text>
                  <Text style={styles.artisticInfoText}>
                    {formatTime(event.ceremony_time)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.artisticInfoCard}>
                <Text style={styles.artisticInfoIcon}>📅</Text>
                <View>
                  <Text style={styles.artisticInfoTitle}>DATE</Text>
                  <Text style={styles.artisticInfoText}>
                    {dateInfo.koreanDate}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* QR Section */}
          <View style={styles.artisticQRSection}>
            <Text style={styles.artisticQRTitle}>CELEBRATION FUND</Text>
            <View style={styles.artisticQRCard}>
              <Animated.View style={{ transform: [{ scale: qrPulseAnim }] }}>
                <QRCode
                  value={qrValue}
                  size={160}
                  color="#06b6d4"
                  backgroundColor="white"
                  quietZone={15}
                />
              </Animated.View>
            </View>
            <TouchableOpacity 
              style={styles.artisticButton}
              onPress={handleContribute}
            >
              <Ionicons name="diamond" size={18} color="#1a1a2e" />
              <Text style={styles.artisticButtonText}>
                {isPreviewMode ? 'PREVIEW MODE' : 'SEND GIFT'}
              </Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );

  // 🌿 네이처 가든 템플릿
  const renderNatureGardenTemplate = () => (
    <ScrollView style={styles.gardenContainer}>
      {isPreviewMode && (
        <View style={styles.previewBanner}>
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.previewBannerText}>미리보기 모드</Text>
        </View>
      )}
      
      <View style={styles.gardenBackground}>
        
        {/* Nature Header */}
        <Animated.View 
          style={[
            styles.gardenHeader,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.gardenLeaves}>
            <Text style={styles.gardenLeaf}>🍃</Text>
            <Text style={styles.gardenLeaf}>🌿</Text>
            <Text style={styles.gardenLeaf}>🍃</Text>
          </View>
          
          <Text style={styles.gardenTitle}>Garden Wedding</Text>
          <Text style={styles.gardenSubtitle}>A Natural Celebration</Text>
          
          <View style={styles.gardenBranch}>
            <View style={styles.gardenBranchLine} />
            <Text style={styles.gardenFlower}>🌸</Text>
            <View style={styles.gardenBranchLine} />
          </View>
        </Animated.View>

        {/* Main Garden Scene */}
        <View style={styles.gardenScene}>
          <View style={styles.gardenMainFrame}>
            <Image 
              source={getImageSource(currentImageIndex)} 
              style={styles.gardenMainImage}
              resizeMode="cover"
            />
            <View style={styles.gardenImageDecor}>
              <View style={styles.gardenVines}>
                <Text style={styles.gardenVine}>🌿</Text>
                <Text style={styles.gardenVine}>🌿</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.gardenNameTag}>
            <Text style={styles.gardenCoupleText}>
              {(event.groom_name || 'Groom')} & {(event.bride_name || 'Bride')}
            </Text>
            <Text style={styles.gardenCoupleSubtext}>Growing Together</Text>
          </View>
        </View>

        {/* Garden Details */}
        <View style={styles.gardenDetailsSection}>
          <View style={styles.gardenDetailCard}>
            <View style={styles.gardenDetailHeader}>
              <Text style={styles.gardenDetailIcon}>🌺</Text>
              <Text style={styles.gardenDetailTitle}>Wedding Garden</Text>
            </View>
            
            <View style={styles.gardenDetailRow}>
              <Text style={styles.gardenDetailLabel}>날짜</Text>
              <Text style={styles.gardenDetailValue}>
                {dateInfo.koreanDate}
              </Text>
            </View>
            
            <View style={styles.gardenDetailRow}>
              <Text style={styles.gardenDetailLabel}>시간</Text>
              <Text style={styles.gardenDetailValue}>
                {formatTime(event.ceremony_time)}
              </Text>
            </View>
            
            <View style={styles.gardenDetailRow}>
              <Text style={styles.gardenDetailLabel}>장소</Text>
              <Text style={styles.gardenDetailValue}>
                {event.location || 'Secret Garden'}
              </Text>
            </View>
          </View>
        </View>

        {/* Message in the Garden */}
        <View style={styles.gardenMessageSection}>
          <View style={styles.gardenMessageCard}>
            <Text style={styles.gardenMessageTitle}>자연의 축복</Text>
            <Text style={styles.gardenMessageText}>
              {event.custom_message || 
               '자연이 주는 따뜻한 축복 아래\n두 마음이 하나로 이어집니다.\n\n함께 성장해 나갈 우리의 사랑에\n여러분의 축복을 나누어 주세요.'}
            </Text>
            <View style={styles.gardenMessageDecor}>
              <Text style={styles.gardenMessageFlower}>🌻</Text>
              <Text style={styles.gardenMessageFlower}>🌺</Text>
              <Text style={styles.gardenMessageFlower}>🌻</Text>
            </View>
          </View>
        </View>

        {/* QR Section */}
        <View style={styles.gardenQRSection}>
          <Text style={styles.gardenQRTitle}>자연의 선물 함께하기</Text>
          <View style={styles.gardenQRCard}>
            <Animated.View style={{ transform: [{ scale: qrPulseAnim }] }}>
              <QRCode
                value={qrValue}
                size={150}
                color="#064e3b"
                backgroundColor="white"
                quietZone={15}
              />
            </Animated.View>
          </View>
          <TouchableOpacity 
            style={styles.gardenButton}
            onPress={handleContribute}
          >
            <Ionicons name="leaf" size={18} color="white" />
            <Text style={styles.gardenButtonText}>
              {isPreviewMode ? '미리보기 모드' : '자연의 축복 함께하기'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );

  // 템플릿별 렌더링
  const renderTemplate = () => {
    switch (templateStyle) {
      case 'modern-minimal':
        return renderModernMinimalTemplate();
      case 'romantic-floral':
        return renderRomanticFloralTemplate();
      case 'artistic-modern':
        return renderArtisticModernTemplate();
      case 'nature-garden':
        return renderNatureGardenTemplate();
      default:
        return renderModernMinimalTemplate();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {renderTemplate()}
      
      {(showExitButton || isPreviewMode) && (
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // 공통 스타일
  previewBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    zIndex: 1000,
  },
  previewBannerText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F3F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F3F0',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    fontWeight: '500',
  },
  exitButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 🌟 Modern Minimal Template
  modernContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modernContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  
  // Save the Date 헤더
  modernSaveHeader: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  modernSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ec4899',
    letterSpacing: 3,
    marginBottom: 15,
  },
  modernDateBadge: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modernDateBadgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  
  // 메인 이미지 섹션
  modernMainImageSection: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  modernMainImageCard: {
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modernMainImage: {
    width: '100%',
    height: '100%',
  },
  modernImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modernImageContent: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    right: 30,
  },
  modernImageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
  },
  modernImageDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#ec4899',
    alignSelf: 'center',
    marginVertical: 15,
  },
  modernImageDate: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1,
  },
  modernImageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 8,
  },
  modernImageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // 신랑신부 이름 섹션
  modernNamesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  modernNameCard: {
    alignItems: 'center',
    flex: 1,
  },
  modernNameLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 2,
    marginBottom: 8,
  },
  modernNameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  modernHeartIcon: {
    marginHorizontal: 30,
  },
  
  // 초대 섹션
  modernInviteSection: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  modernInviteCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  modernInviteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 15,
  },
  modernInviteMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  modernEventDetails: {
    width: '100%',
    gap: 12,
  },
  modernDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  modernDetailText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  
  // 갤러리 섹션
  modernGallerySection: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 2,
  },
  modernGalleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modernGalleryItem: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernGalleryImage: {
    width: '100%',
    height: '100%',
  },
  
  // QR 섹션
  modernQRSection: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  modernQRCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modernQRTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  modernQRContainer: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  modernQRSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  modernQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ec4899',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernQRButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },

  // 🌸 Romantic Floral Template
  romanticContainer: {
    backgroundColor: '#fdf2f8',
  },
  romanticBackground: {
    flex: 1,
    paddingVertical: 40,
  },
  romanticHeader: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  romanticDecoTop: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  romanticDecorIcon: {
    fontSize: 24,
  },
  romanticTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#be185d',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  romanticNames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  romanticName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#831843',
  },
  romanticHeart: {
    fontSize: 20,
  },
  romanticPhotoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  romanticPhotoFrame: {
    width: 240,
    height: 300,
    borderRadius: 120,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 4,
    borderColor: '#fce7f3',
  },
  romanticPhoto: {
    width: '100%',
    height: '100%',
  },
  romanticPhotoDecor: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 5,
  },
  romanticFlower: {
    fontSize: 16,
  },
  romanticDetailsCard: {
    marginHorizontal: 30,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  romanticDetailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#be185d',
    textAlign: 'center',
    marginBottom: 20,
  },
  romanticDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
  },
  romanticDetailIcon: {
    fontSize: 18,
    marginRight: 15,
    width: 30,
  },
  romanticDetailText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  romanticFamilySection: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  romanticFamilyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#be185d',
    textAlign: 'center',
    marginBottom: 25,
  },
  romanticFamilyCards: {
    gap: 20,
  },
  romanticFamilyCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fce7f3',
  },
  romanticFamilyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be185d',
    marginBottom: 10,
  },
  romanticFamilyName: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 5,
  },
  romanticFamilyRelation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  romanticCoupleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
  },
  romanticMessageSection: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  romanticMessageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#be185d',
    textAlign: 'center',
    marginBottom: 20,
  },
  romanticMessageText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
  },
  romanticQRSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  romanticQRTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#be185d',
    marginBottom: 20,
  },
  romanticQRCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  romanticButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#be185d',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  romanticButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },

  // 🎨 Artistic Modern Template
  artisticContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  artisticContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  artisticHeader: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  artisticGeometric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 15,
  },
  artisticShape1: {
    width: 20,
    height: 20,
    backgroundColor: '#06b6d4',
    transform: [{ rotate: '45deg' }],
  },
  artisticShape2: {
    width: 16,
    height: 16,
    backgroundColor: '#ec4899',
    borderRadius: 8,
  },
  artisticShape3: {
    width: 20,
    height: 20,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
  },
  artisticTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 2,
    marginBottom: 10,
  },
  artisticSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: 1,
  },
  artisticImageSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 40,
    gap: 10,
  },
  artisticMainImage: {
    flex: 2,
    height: 300,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  artisticImage: {
    width: '100%',
    height: '100%',
  },
  artisticImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
  },
  artisticCoupleNames: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  artisticSideImages: {
    flex: 1,
    gap: 10,
  },
  artisticSideImage: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  artisticSideImg: {
    width: '100%',
    height: '100%',
  },
  artisticInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  artisticInfoCards: {
    gap: 15,
  },
  artisticInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  artisticInfoIcon: {
    fontSize: 20,
  },
  artisticInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 5,
  },
  artisticInfoText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  artisticQRSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  artisticQRTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
    letterSpacing: 1,
  },
  artisticQRCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
  },
  artisticButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06b6d4',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  artisticButtonText: {
    fontSize: 16,
    color: '#1a1a2e',
    fontWeight: '700',
  },

  // 🌿 Nature Garden Template
  gardenContainer: {
    backgroundColor: '#f0f9ff',
  },
  gardenBackground: {
    flex: 1,
    paddingVertical: 40,
  },
  gardenHeader: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  gardenLeaves: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  gardenLeaf: {
    fontSize: 24,
  },
  gardenTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#064e3b',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  gardenSubtitle: {
    fontSize: 16,
    color: '#065f46',
    marginBottom: 20,
  },
  gardenBranch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gardenBranchLine: {
    width: 40,
    height: 2,
    backgroundColor: '#10b981',
  },
  gardenFlower: {
    fontSize: 16,
  },
  gardenScene: {
    alignItems: 'center',
    marginBottom: 40,
  },
  gardenMainFrame: {
    width: 260,
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#a7f3d0',
  },
  gardenMainImage: {
    width: '100%',
    height: '100%',
  },
  gardenImageDecor: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
  gardenVines: {
    gap: 5,
  },
  gardenVine: {
    fontSize: 14,
  },
  gardenNameTag: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  gardenCoupleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#064e3b',
    marginBottom: 5,
  },
  gardenCoupleSubtext: {
    fontSize: 14,
    color: '#065f46',
    fontStyle: 'italic',
  },
  gardenDetailsSection: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  gardenDetailCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  gardenDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  gardenDetailIcon: {
    fontSize: 20,
  },
  gardenDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#064e3b',
  },
  gardenDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  gardenDetailLabel: {
    fontSize: 16,
    color: '#065f46',
    fontWeight: '500',
  },
  gardenDetailValue: {
    fontSize: 16,
    color: '#064e3b',
    fontWeight: '600',
  },
  gardenMessageSection: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  gardenMessageCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  gardenMessageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#064e3b',
    marginBottom: 15,
  },
  gardenMessageText: {
    fontSize: 16,
    color: '#065f46',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  gardenMessageDecor: {
    flexDirection: 'row',
    gap: 10,
  },
  gardenMessageFlower: {
    fontSize: 16,
  },
  gardenQRSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  gardenQRTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#064e3b',
    marginBottom: 20,
  },
  gardenQRCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  gardenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  gardenButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});