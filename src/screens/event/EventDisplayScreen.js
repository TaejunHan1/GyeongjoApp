// src/screens/event/EventDisplayScreen.js - 다양한 템플릿 스타일
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../styles/constants';
import { getEventDetail } from '../../lib/supabaseHelper';

const { width, height } = Dimensions.get('window');
const isLandscape = width > height;

// 실제 배포 시에는 실제 도메인으로 변경해야 함
const WEB_BASE_URL = 'https://jeongdam.com';

export default function EventDisplayScreen({ navigation, route }) {
  const { eventId, templateStyle = 'classic' } = route.params;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');
  const [showExitButton, setShowExitButton] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const qrPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadEventData();
    startAnimations();
    
    // 이미지 슬라이드쇼 시작
    const imageSlideInterval = startImageSlideshow(getImageCount());
    
    const exitTimer = setTimeout(() => {
      setShowExitButton(true);
    }, 8000);

    return () => {
      clearTimeout(exitTimer);
      clearInterval(imageSlideInterval);
    };
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const result = await getEventDetail(eventId);
      
      if (result.success) {
        setEvent(result.data);
        const webUrl = `${WEB_BASE_URL}/contribute/${result.data.id}`;
        setQrValue(webUrl);
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(qrPulseAnim, {
          toValue: 1.02,
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
    return setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageCount);
    }, 4000);
  };

  // 이미지 소스 가져오기
  const getImageSource = (index) => {
    const images = [
      require('../../../assets/images/aa1.png'),
      require('../../../assets/images/aa2.png'),
      require('../../../assets/images/aa3.png'),
      require('../../../assets/images/aa4.png'),
    ];
    return images[index % images.length];
  };

  // 이미지 개수 가져오기
  const getImageCount = () => {
    return 4; // aa1.png ~ aa4.png 총 4개
  };

  const getTemplateConfig = () => {
    const baseConfig = {
      classic: {
        backgroundColor: '#F7F3F0',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        primaryColor: '#D4AF8C',
        textColor: '#5A4A3A',
        secondaryTextColor: '#8B7355',
        qrColor: '#5A4A3A',
        headerTitle: 'WEDDING INVITATION',
        subtitle: '소중한 분들을 초대합니다',
        emotionalMessage: '두 사람이 사랑으로 하나 되는\n소중한 순간에 함께해 주세요',
        qrTitle: '축하의 마음을 전해주세요',
        qrSubtitle: 'QR 코드를 스캔하여 간편하게 축의금을 전달하세요',
      },
      modern: {
        backgroundColor: '#FFFFFF',
        cardBackground: 'rgba(248, 250, 252, 0.95)',
        primaryColor: '#EC4899',
        textColor: '#1F2937',
        secondaryTextColor: '#6B7280',
        qrColor: '#1F2937',
        headerTitle: 'MODERN WEDDING',
        subtitle: '깔끔하고 세련된 초대',
        emotionalMessage: '새로운 시작을 함께\n축하해 주세요',
        qrTitle: '마음을 전해주세요',
        qrSubtitle: '간편한 QR 스캔으로 축하를 전하세요',
      },
      garden: {
        backgroundColor: '#F0F9FF',
        cardBackground: 'rgba(255, 255, 255, 0.9)',
        primaryColor: '#10B981',
        textColor: '#064E3B',
        secondaryTextColor: '#059669',
        qrColor: '#064E3B',
        headerTitle: 'GARDEN WEDDING',
        subtitle: '자연 속에서의 만남',
        emotionalMessage: '푸른 자연이 축복하는\n아름다운 하루가 되길',
        qrTitle: '자연의 축복을 함께',
        qrSubtitle: 'QR 코드로 따뜻한 마음을 나누어 주세요',
      },
      luxury: {
        backgroundColor: '#FEF3C7',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        primaryColor: '#F59E0B',
        textColor: '#92400E',
        secondaryTextColor: '#D97706',
        qrColor: '#92400E',
        headerTitle: 'LUXURY CELEBRATION',
        subtitle: '럭셔리한 순간의 초대',
        emotionalMessage: '특별한 순간을 더욱\n빛나게 해주세요',
        qrTitle: '귀한 마음을 전해주세요',
        qrSubtitle: 'QR 스캔으로 품격있는 축하를 전하세요',
      },
      solemn: {
        backgroundColor: '#F8F9FA',
        cardBackground: 'rgba(255, 255, 255, 0.98)',
        primaryColor: '#64748B',
        textColor: '#2D2D2D',
        secondaryTextColor: '#6B7280',
        qrColor: '#2D2D2D',
        headerTitle: 'MEMORIAL SERVICE',
        subtitle: '고인의 명복을 빕니다',
        emotionalMessage: '고인을 추모하며\n마지막 인사를 전해 주세요',
        qrTitle: '위로의 마음을 전해주세요',
        qrSubtitle: 'QR 코드를 스캔하여 조의를 표하실 수 있습니다',
      },
    };

    return baseConfig[templateStyle] || baseConfig.classic;
  };

  const formatDate = (dateString) => {
    if (!dateString) return { year: '2024', month: '12', day: '25', weekday: 'SUNDAY' };
    const date = new Date(dateString);
    return {
      year: date.getFullYear().toString(),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      day: String(date.getDate()).padStart(2, '0'),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
    };
  };

  const formatTime = (dateString) => {
    if (!dateString) return '오후 2:00';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleContribute = () => {
    navigation.navigate('Contribution', {
      eventId: event.id,
      eventName: event.event_name
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="tv" size={48} color="#D4AF8C" />
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

  const theme = getTemplateConfig();
  const dateInfo = formatDate(event.event_date);

  // 템플릿별 렌더링
  const renderTemplate = () => {
    switch (templateStyle) {
      case 'modern':
        return renderModernTemplate();
      case 'garden':
        return renderGardenTemplate();
      case 'luxury':
        return renderLuxuryTemplate();
      case 'solemn':
        return renderSolemnTemplate();
      default:
        return renderClassicTemplate();
    }
  };

  // 클래식 템플릿 (기존 디자인)
  const renderClassicTemplate = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* 헤더 섹션 */}
        <View style={styles.header}>
          <Text style={[styles.headerDate, { color: theme.primaryColor }]}>
            {dateInfo.year}.{dateInfo.month}.{dateInfo.day}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            {theme.headerTitle}
          </Text>
        </View>

        {/* 메인 이미지 섹션 */}
        <View style={styles.imageSection}>
          <View style={[styles.imageFrame, { backgroundColor: '#E8DDD4' }]}>
            <Image
              source={getImageSource(currentImageIndex)}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {getImageCount() > 1 && (
              <View style={styles.imageIndicator}>
                {[...Array(getImageCount())].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.imageDot,
                      { 
                        backgroundColor: currentImageIndex === index 
                          ? theme.primaryColor 
                          : 'rgba(255,255,255,0.5)' 
                      }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 이벤트 타이틀 */}
        <View style={styles.titleSection}>
          <Text style={[styles.eventTitle, { color: theme.textColor }]}>
            {event.event_name}
          </Text>
          <Text style={[styles.eventSubtitle, { color: theme.secondaryTextColor }]}>
            {theme.subtitle}
          </Text>
        </View>

        {/* 감성 메시지 */}
        <View style={styles.messageSection}>
          <Text style={[styles.emotionalMessage, { color: theme.textColor }]}>
            {theme.emotionalMessage}
          </Text>
        </View>

        {/* 날짜 및 시간 정보 */}
        <View style={[styles.dateTimeCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.dateTimeHeader}>
            <Text style={[styles.dateLabel, { color: theme.primaryColor }]}>
              THE WEDDING
            </Text>
          </View>
          
          <View style={styles.dateTimeContent}>
            <View style={styles.dateRow}>
              <Text style={[styles.dateNumber, { color: theme.textColor }]}>
                {dateInfo.month}.{dateInfo.day}
              </Text>
              <Text style={[styles.dateYear, { color: theme.secondaryTextColor }]}>
                {dateInfo.year}
              </Text>
            </View>
            <Text style={[styles.dateWeekday, { color: theme.secondaryTextColor }]}>
              {dateInfo.weekday}
            </Text>
            <Text style={[styles.dateTime, { color: theme.textColor }]}>
              {formatTime(event.event_date)}
            </Text>
          </View>
        </View>

        {/* QR 코드 섹션 */}
        <View style={[styles.qrSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.qrTitle, { color: theme.primaryColor }]}>
            {theme.qrTitle}
          </Text>
          <Text style={[styles.qrSubtitle, { color: theme.secondaryTextColor }]}>
            {theme.qrSubtitle}
          </Text>
          
          <Animated.View 
            style={[
              styles.qrContainer,
              { transform: [{ scale: qrPulseAnim }] }
            ]}
          >
            {qrValue && (
              <QRCode
                value={qrValue}
                size={200}
                color={theme.qrColor}
                backgroundColor="white"
                quietZone={15}
              />
            )}
          </Animated.View>

          <TouchableOpacity 
            style={[styles.contributeButton, { backgroundColor: theme.primaryColor }]}
            onPress={handleContribute}
            activeOpacity={0.9}
          >
            <Ionicons name="heart" size={18} color="white" />
            <Text style={styles.contributeButtonText}>마음 전하기</Text>
          </TouchableOpacity>
        </View>

        {/* 푸터 */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.secondaryTextColor }]}>
            정담 - 마음을 나누는 가장 쉬운 방법
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );

  // 모던 템플릿
  const renderModernTemplate = () => (
    <View style={[styles.modernContainer, { backgroundColor: theme.backgroundColor }]}>
      <Animated.View style={[styles.modernContent, { opacity: fadeAnim }]}>
        {/* 미니멀 헤더 */}
        <View style={styles.modernHeader}>
          <View style={styles.modernDateContainer}>
            <Text style={[styles.modernDate, { color: theme.primaryColor }]}>
              {dateInfo.month}.{dateInfo.day}.{dateInfo.year}
            </Text>
          </View>
          <Text style={[styles.modernTitle, { color: theme.textColor }]}>
            {event.event_name}
          </Text>
        </View>

        {/* 큰 이미지 */}
        <View style={styles.modernImageContainer}>
          <Image
            source={getImageSource(currentImageIndex)}
            style={styles.modernImage}
            resizeMode="cover"
          />
          <View style={styles.modernImageOverlay}>
            <Text style={styles.modernImageText}>
              {theme.emotionalMessage}
            </Text>
          </View>
        </View>

        {/* 정보 카드들 */}
        <View style={styles.modernCards}>
          <View style={[styles.modernCard, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="time" size={20} color={theme.primaryColor} />
            <Text style={[styles.modernCardText, { color: theme.textColor }]}>
              {formatTime(event.event_date)}
            </Text>
          </View>
          
          {event.location && (
            <View style={[styles.modernCard, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="location" size={20} color={theme.primaryColor} />
              <Text style={[styles.modernCardText, { color: theme.textColor }]}>
                {event.location}
              </Text>
            </View>
          )}
        </View>

        {/* QR 섹션 */}
        <View style={[styles.modernQRSection, { backgroundColor: theme.cardBackground }]}>
          <QRCode
            value={qrValue}
            size={180}
            color={theme.qrColor}
            backgroundColor="white"
            quietZone={15}
          />
          <TouchableOpacity 
            style={[styles.modernButton, { backgroundColor: theme.primaryColor }]}
            onPress={handleContribute}
          >
            <Text style={styles.modernButtonText}>CONTRIBUTE</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  // 가든 템플릿
  const renderGardenTemplate = () => (
    <ImageBackground
      source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9InJnYmEoMTYsIDE4NSwgMTI5LCAwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==' }}
      style={[styles.gardenContainer, { backgroundColor: theme.backgroundColor }]}
    >
      <ScrollView style={styles.gardenScrollView}>
        <Animated.View style={[styles.gardenContent, { opacity: fadeAnim }]}>
          {/* 자연스러운 헤더 */}
          <View style={styles.gardenHeader}>
            <View style={styles.gardenLeafDecor}>
              <Ionicons name="leaf" size={24} color={theme.primaryColor} />
            </View>
            <Text style={[styles.gardenTitle, { color: theme.textColor }]}>
              {event.event_name}
            </Text>
            <Text style={[styles.gardenSubtitle, { color: theme.secondaryTextColor }]}>
              {theme.subtitle}
            </Text>
          </View>

          {/* 원형 이미지 */}
          <View style={styles.gardenImageSection}>
            <View style={[styles.gardenImageFrame, { borderColor: theme.primaryColor }]}>
              <Image
                source={getImageSource(currentImageIndex)}
                style={styles.gardenImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.gardenLeaves}>
              <Ionicons name="leaf" size={32} color={theme.primaryColor} style={{ opacity: 0.3 }} />
              <Ionicons name="flower" size={28} color={theme.primaryColor} style={{ opacity: 0.4 }} />
            </View>
          </View>

          {/* 자연스러운 메시지 */}
          <View style={styles.gardenMessage}>
            <Text style={[styles.gardenMessageText, { color: theme.textColor }]}>
              {theme.emotionalMessage}
            </Text>
          </View>

          {/* 날짜 정보 */}
          <View style={[styles.gardenDateCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.gardenDateHeader}>
              <Ionicons name="calendar" size={24} color={theme.primaryColor} />
              <Text style={[styles.gardenDateTitle, { color: theme.primaryColor }]}>
                GARDEN CELEBRATION
              </Text>
            </View>
            <Text style={[styles.gardenDateTime, { color: theme.textColor }]}>
              {formatDate(event.event_date).year}년 {formatDate(event.event_date).month}월 {formatDate(event.event_date).day}일
            </Text>
            <Text style={[styles.gardenTime, { color: theme.secondaryTextColor }]}>
              {formatTime(event.event_date)}
            </Text>
          </View>

          {/* QR 코드 섹션 */}
          <View style={[styles.gardenQRSection, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.gardenQRTitle, { color: theme.primaryColor }]}>
              {theme.qrTitle}
            </Text>
            <QRCode
              value={qrValue}
              size={200}
              color={theme.qrColor}
              backgroundColor="white"
              quietZone={15}
            />
            <TouchableOpacity 
              style={[styles.gardenButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleContribute}
            >
              <Ionicons name="leaf" size={18} color="white" />
              <Text style={styles.gardenButtonText}>자연의 축복을 함께</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </ImageBackground>
  );

  // 럭셔리 템플릿
  const renderLuxuryTemplate = () => (
    <View style={[styles.luxuryContainer, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.luxuryScrollView}>
        <Animated.View style={[styles.luxuryContent, { opacity: fadeAnim }]}>
          {/* 골드 헤더 */}
          <View style={styles.luxuryHeader}>
            <View style={[styles.luxuryFrame, { borderColor: theme.primaryColor }]}>
              <Text style={[styles.luxuryHeaderTitle, { color: theme.primaryColor }]}>
                {theme.headerTitle}
              </Text>
              <View style={[styles.luxuryDivider, { backgroundColor: theme.primaryColor }]} />
              <Text style={[styles.luxuryEventTitle, { color: theme.textColor }]}>
                {event.event_name}
              </Text>
            </View>
          </View>

          {/* 다이아몬드 이미지 프레임 */}
          <View style={styles.luxuryImageSection}>
            <View style={[styles.luxuryDiamondFrame, { borderColor: theme.primaryColor }]}>
              <Image
                source={getImageSource(currentImageIndex)}
                style={styles.luxuryImage}
                resizeMode="cover"
              />
              <View style={styles.luxuryCorners}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={[styles.luxuryCorner, { backgroundColor: theme.primaryColor }]} />
                ))}
              </View>
            </View>
          </View>

          {/* 럭셔리 정보 카드 */}
          <View style={[styles.luxuryInfoCard, { backgroundColor: theme.cardBackground, borderColor: theme.primaryColor }]}>
            <View style={styles.luxuryInfoHeader}>
              <Ionicons name="diamond" size={24} color={theme.primaryColor} />
              <Text style={[styles.luxuryInfoTitle, { color: theme.primaryColor }]}>
                CELEBRATION DETAILS
              </Text>
            </View>
            
            <View style={styles.luxuryInfoContent}>
              <Text style={[styles.luxuryDate, { color: theme.textColor }]}>
                {dateInfo.year}년 {dateInfo.month}월 {dateInfo.day}일 {formatTime(event.event_date)}
              </Text>
              {event.location && (
                <Text style={[styles.luxuryLocation, { color: theme.secondaryTextColor }]}>
                  {event.location}
                </Text>
              )}
              <Text style={[styles.luxuryHost, { color: theme.secondaryTextColor }]}>
                Host: {event.main_person_name}
              </Text>
            </View>
          </View>

          {/* 럭셔리 QR 섹션 */}
          <View style={[styles.luxuryQRSection, { backgroundColor: theme.cardBackground, borderColor: theme.primaryColor }]}>
            <Text style={[styles.luxuryQRTitle, { color: theme.primaryColor }]}>
              {theme.qrTitle}
            </Text>
            <View style={[styles.luxuryQRFrame, { borderColor: theme.primaryColor }]}>
              <QRCode
                value={qrValue}
                size={180}
                color={theme.qrColor}
                backgroundColor="white"
                quietZone={15}
              />
            </View>
            <TouchableOpacity 
              style={[styles.luxuryButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleContribute}
            >
              <Ionicons name="diamond" size={18} color="white" />
              <Text style={styles.luxuryButtonText}>EXCLUSIVE CONTRIBUTION</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );

  // 추모 템플릿
  const renderSolemnTemplate = () => (
    <View style={[styles.solemnContainer, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.solemnScrollView}>
        <Animated.View style={[styles.solemnContent, { opacity: fadeAnim }]}>
          {/* 추모 헤더 */}
          <View style={styles.solemnHeader}>
            <View style={[styles.solemnCross, { backgroundColor: theme.primaryColor }]} />
            <Text style={[styles.solemnTitle, { color: theme.textColor }]}>
              {event.event_name}
            </Text>
            <Text style={[styles.solemnSubtitle, { color: theme.secondaryTextColor }]}>
              {theme.subtitle}
            </Text>
          </View>

          {/* 추모 이미지 */}
          <View style={styles.solemnImageSection}>
            <View style={[styles.solemnImageFrame, { borderColor: theme.primaryColor }]}>
              <Image
                source={getImageSource(currentImageIndex)}
                style={styles.solemnImage}
                resizeMode="cover"
              />
              <View style={styles.solemnFlowers}>
                <Ionicons name="flower" size={20} color={theme.primaryColor} style={{ opacity: 0.6 }} />
                <Ionicons name="flower" size={24} color={theme.primaryColor} style={{ opacity: 0.4 }} />
                <Ionicons name="flower" size={18} color={theme.primaryColor} style={{ opacity: 0.5 }} />
              </View>
            </View>
          </View>

          {/* 추모 메시지 */}
          <View style={styles.solemnMessage}>
            <Text style={[styles.solemnMessageText, { color: theme.textColor }]}>
              {theme.emotionalMessage}
            </Text>
          </View>

          {/* 추모 정보 */}
          <View style={[styles.solemnInfoCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.solemnInfoHeader}>
              <Ionicons name="flower" size={20} color={theme.primaryColor} />
              <Text style={[styles.solemnInfoTitle, { color: theme.primaryColor }]}>
                MEMORIAL INFORMATION
              </Text>
            </View>
            
            <Text style={[styles.solemnDate, { color: theme.textColor }]}>
              {dateInfo.year}년 {dateInfo.month}월 {dateInfo.day}일
            </Text>
            <Text style={[styles.solemnTime, { color: theme.secondaryTextColor }]}>
              {formatTime(event.event_date)}
            </Text>
            {event.location && (
              <Text style={[styles.solemnLocation, { color: theme.secondaryTextColor }]}>
                {event.location}
              </Text>
            )}
          </View>

          {/* 조의 QR 섹션 */}
          <View style={[styles.solemnQRSection, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.solemnQRTitle, { color: theme.primaryColor }]}>
              {theme.qrTitle}
            </Text>
            <Text style={[styles.solemnQRSubtitle, { color: theme.secondaryTextColor }]}>
              {theme.qrSubtitle}
            </Text>
            
            <QRCode
              value={qrValue}
              size={200}
              color={theme.qrColor}
              backgroundColor="white"
              quietZone={15}
            />
            
            <TouchableOpacity 
              style={[styles.solemnButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleContribute}
            >
              <Ionicons name="flower" size={18} color="white" />
              <Text style={styles.solemnButtonText}>조의 표하기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {renderTemplate()}
      
      {/* 종료 버튼 */}
      {showExitButton && (
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
  
  // 공통 스타일들
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

  // 클래식 템플릿 (기존 스타일 유지)
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerDate: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 3,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageFrame: {
    width: width * 0.8,
    height: width * 1.2,
    borderRadius: 200,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 192,
  },
  imageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  eventSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  emotionalMessage: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  dateTimeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dateTimeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  dateTimeContent: {
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  dateNumber: {
    fontSize: 36,
    fontWeight: '200',
    letterSpacing: -1,
  },
  dateYear: {
    fontSize: 16,
    fontWeight: '300',
    marginLeft: 8,
  },
  dateWeekday: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    letterSpacing: 1,
  },
  dateTime: {
    fontSize: 16,
    fontWeight: '500',
  },
  qrSection: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  qrSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  contributeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.7,
  },

  // 모던 템플릿 스타일
  modernContainer: {
    flex: 1,
    padding: 20,
  },
  modernContent: {
    flex: 1,
  },
  modernHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  modernDateContainer: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  modernDate: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  modernTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
  },
  modernImageContainer: {
    position: 'relative',
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modernImage: {
    width: '100%',
    height: 400,
  },
  modernImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modernImageText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 26,
  },
  modernCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  modernCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  modernCardText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modernQRSection: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
  },
  modernButton: {
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
  },
  modernButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // 가든 템플릿 스타일
  gardenContainer: {
    flex: 1,
  },
  gardenScrollView: {
    flex: 1,
  },
  gardenContent: {
    padding: 20,
    paddingTop: 60,
  },
  gardenHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  gardenLeafDecor: {
    marginBottom: 16,
  },
  gardenTitle: {
    fontSize: 30,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  gardenSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  gardenImageSection: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  gardenImageFrame: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4,
    padding: 4,
  },
  gardenImage: {
    width: '100%',
    height: '100%',
    borderRadius: 121,
  },
  gardenLeaves: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    gap: 5,
  },
  gardenMessage: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  gardenMessageText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  gardenDateCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  gardenDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  gardenDateTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  gardenDateTime: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  gardenTime: {
    fontSize: 16,
  },
  gardenQRSection: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
  },
  gardenQRTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  gardenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
  },
  gardenButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // 럭셔리 템플릿 스타일
  luxuryContainer: {
    flex: 1,
  },
  luxuryScrollView: {
    flex: 1,
  },
  luxuryContent: {
    padding: 20,
    paddingTop: 60,
  },
  luxuryHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  luxuryFrame: {
    borderWidth: 3,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  luxuryHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  luxuryDivider: {
    width: 60,
    height: 2,
    marginBottom: 16,
  },
  luxuryEventTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  luxuryImageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  luxuryDiamondFrame: {
    width: 280,
    height: 280,
    borderWidth: 4,
    transform: [{ rotate: '45deg' }],
    position: 'relative',
    overflow: 'hidden',
  },
  luxuryImage: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '-45deg' }, { scale: 1.4 }],
  },
  luxuryCorners: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
  },
  luxuryCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  luxuryInfoCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
  },
  luxuryInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  luxuryInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  luxuryInfoContent: {
    alignItems: 'center',
  },
  luxuryDate: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  luxuryLocation: {
    fontSize: 16,
    marginBottom: 8,
  },
  luxuryHost: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  luxuryQRSection: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  luxuryQRTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  luxuryQRFrame: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  luxuryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  luxuryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // 추모 템플릿 스타일
  solemnContainer: {
    flex: 1,
  },
  solemnScrollView: {
    flex: 1,
  },
  solemnContent: {
    padding: 20,
    paddingTop: 60,
  },
  solemnHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  solemnCross: {
    width: 24,
    height: 4,
    marginBottom: 16,
  },
  solemnTitle: {
    fontSize: 26,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  solemnSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  solemnImageSection: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  solemnImageFrame: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    padding: 4,
  },
  solemnImage: {
    width: '100%',
    height: '100%',
    borderRadius: 96,
  },
  solemnFlowers: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    flexDirection: 'row',
    gap: 3,
  },
  solemnMessage: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  solemnMessageText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },
  solemnInfoCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  solemnInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  solemnInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  solemnDate: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  solemnTime: {
    fontSize: 16,
    marginBottom: 8,
  },
  solemnLocation: {
    fontSize: 14,
  },
  solemnQRSection: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
  },
  solemnQRTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  solemnQRSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  solemnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 8,
  },
  solemnButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});