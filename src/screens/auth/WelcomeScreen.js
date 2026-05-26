// src/screens/auth/WelcomeScreen.js
import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // useFocusEffect 훅 임포트
import { Colors } from '../../styles/constants';

const JEONGDAM_LOGO = require('../../../assets/images/jeongdamlogonobackground.png');

const WELCOME_SLIDES = [
  {
    id: 'reception-pad',
    image: require('../../../assets/images/welcome-carousel/reception-pad.png'),
  },
  {
    id: 'mobile-invitation',
    image: require('../../../assets/images/welcome-carousel/mobile-invitation.png'),
  },
  {
    id: 'ledger-management',
    image: require('../../../assets/images/welcome-carousel/ledger-management.png'),
  },
];

const getCarouselMetrics = (screenWidth) => {
  const isTabletViewport = screenWidth >= 768;
  const availableWidth = screenWidth - 48;
  const cardWidth = isTabletViewport ? Math.min(availableWidth, 620) : availableWidth;

  return {
    cardWidth,
    imageHeight: Math.round(cardWidth * 0.75),
    slidePadding: isTabletViewport ? 10 : 8,
    cardRadius: isTabletViewport ? 26 : 22,
    imageRadius: isTabletViewport ? 24 : 18,
  };
};

export default function WelcomeScreen({ navigation }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const carouselMetrics = getCarouselMetrics(screenWidth);
  const carouselRef = useRef(null);
  const activeSlideRef = useRef(0);
  const isCarouselDraggingRef = useRef(false);

  // 애니메이션 값 참조
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;
  const buttonFloatingAnim1 = useRef(new Animated.Value(0)).current;
  const buttonFloatingAnim2 = useRef(new Animated.Value(0)).current;
  
  const locationScaleAnim = useRef(new Animated.Value(0.98)).current;
  const locationOpacityAnim = useRef(new Animated.Value(0.8)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.9)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;

  // 화면 포커스 시 애니메이션을 제어
  useFocusEffect(
    useCallback(() => {
      // --- 1. 애니메이션 값 초기화 ---
      const resetAnimations = () => {
        floatingAnim1.setValue(0);
        floatingAnim2.setValue(0);
        floatingAnim3.setValue(0);
        buttonFloatingAnim1.setValue(0);
        buttonFloatingAnim2.setValue(0);
        locationScaleAnim.setValue(0.98);
        locationOpacityAnim.setValue(0.8);
        cardScaleAnim.setValue(0.9);
        cardOpacityAnim.setValue(0);
      };
      
      resetAnimations();

      // --- 2. 애니메이션 정의 및 시작 ---
      const createFloatingAnimation = (animValue, duration, delay = 0) => Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(animValue, { toValue: 1, duration, useNativeDriver: true }), Animated.timing(animValue, { toValue: 0, duration, useNativeDriver: true })]));
      const createButtonAnimation = (animValue, duration, delay = 0) => Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(animValue, { toValue: 1, duration, useNativeDriver: true }), Animated.timing(animValue, { toValue: 0, duration, useNativeDriver: true })]));
      // locationGlowAnimation 제거 - useNativeDriver: false로 JS 스레드 병목 유발
      const locationScaleAnimation = () => Animated.loop(Animated.sequence([Animated.timing(locationScaleAnim, { toValue: 1.02, duration: 3000, useNativeDriver: true }), Animated.timing(locationScaleAnim, { toValue: 0.98, duration: 3000, useNativeDriver: true })]));
      const locationOpacityAnimation = () => Animated.loop(Animated.sequence([Animated.timing(locationOpacityAnim, { toValue: 1, duration: 2000, useNativeDriver: true }), Animated.timing(locationOpacityAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true })]));
      const cardAppearAnimation = () => Animated.parallel([Animated.timing(cardScaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }), Animated.timing(cardOpacityAnim, { toValue: 1, duration: 800, useNativeDriver: true })]);

      const loopingAnimations = [
        createFloatingAnimation(floatingAnim1, 3000, 0),
        createFloatingAnimation(floatingAnim2, 4000, 1000),
        createFloatingAnimation(floatingAnim3, 5000, 2000),
        createButtonAnimation(buttonFloatingAnim1, 6000, 0),
        createButtonAnimation(buttonFloatingAnim2, 8000, 3000),
        locationScaleAnimation(),
        locationOpacityAnimation(),
      ];
      loopingAnimations.forEach(anim => anim.start());

      const sequenceTimer = setTimeout(() => {
        cardAppearAnimation().start();
      }, 300);

      // --- 3. 클린업 함수 ---
      return () => {
        loopingAnimations.forEach(anim => anim.stop());
        clearTimeout(sequenceTimer);
        [floatingAnim1, floatingAnim2, floatingAnim3, buttonFloatingAnim1, buttonFloatingAnim2, locationScaleAnim, locationOpacityAnim, cardScaleAnim, cardOpacityAnim].forEach(anim => anim.stopAnimation());
      };
    }, [])
  );

  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  useFocusEffect(
    useCallback(() => {
      if (WELCOME_SLIDES.length <= 1) {
        return undefined;
      }

      const carouselTimer = setInterval(() => {
        if (isCarouselDraggingRef.current) {
          return;
        }

        const nextIndex = (activeSlideRef.current + 1) % WELCOME_SLIDES.length;
        activeSlideRef.current = nextIndex;
        setActiveSlide(nextIndex);
        carouselRef.current?.scrollTo({
          x: nextIndex * carouselMetrics.cardWidth,
          animated: true,
        });
      }, 2000);

      return () => clearInterval(carouselTimer);
    }, [carouselMetrics.cardWidth])
  );

  const handleStartPress = () => {
    navigation.navigate('PhoneAuth', { isSignUp: false });
  };

  const handleGuestPress = () => {
    navigation.navigate('GuestGuide');
  };

  const handleTermsPress = () => {
    navigation.navigate('Terms');
  };

  const handlePrivacyPress = () => {
    navigation.navigate('Privacy');
  };

  const handleCarouselScrollBeginDrag = () => {
    isCarouselDraggingRef.current = true;
  };

  const handleCarouselScrollEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselMetrics.cardWidth);
    const boundedIndex = Math.max(0, Math.min(WELCOME_SLIDES.length - 1, nextIndex));
    isCarouselDraggingRef.current = false;
    activeSlideRef.current = boundedIndex;
    setActiveSlide(boundedIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* [레이아웃 수정]
        모든 요소를 하나의 flex 컨테이너(content) 안에 배치하고,
        justifyContent: 'space-between'을 사용해 상단 콘텐츠와 하단 버튼을 명확하게 분리합니다.
        이를 통해 화면 재진입 시 발생하던 레이아웃 밀림 현상을 해결합니다.
      */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* 상단 및 중간 콘텐츠를 하나의 그룹으로 묶습니다. */}
        <View>
          {/* 로고 및 메인 메시지 */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image source={JEONGDAM_LOGO} style={styles.logoImage} resizeMode="contain" />
            </View>
            
            <Text style={styles.mainTitle}>
              마음을 나누는{'\n'}가장 쉬운 방법
            </Text>
            
            <Text style={styles.subtitle}>
              정성스러운 마음을 기록하고{'\n'}
              소중한 인연을 관리해보세요
            </Text>
            
            <Animated.View style={[
              styles.locationContainer,
              {
                transform: [{ scale: locationScaleAnim }],
                opacity: locationOpacityAnim,
              }
            ]}>
              <Animated.View style={[styles.floatingCircle, styles.floatingCircle1, { transform: [{ translateX: floatingAnim1.interpolate({ inputRange: [0, 1], outputRange: [5, 25] }) }, { translateY: floatingAnim1.interpolate({ inputRange: [0, 1], outputRange: [3, 15] }) }], opacity: floatingAnim1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.6, 0.3] }) }]} />
              <Animated.View style={[styles.floatingCircle, styles.floatingCircle2, { transform: [{ translateX: floatingAnim2.interpolate({ inputRange: [0, 1], outputRange: [20, -10] }) }, { translateY: floatingAnim2.interpolate({ inputRange: [0, 1], outputRange: [5, 20] }) }], opacity: floatingAnim2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.5, 0.2] }) }]} />
              <Animated.View style={[styles.floatingCircle, styles.floatingCircle3, { transform: [{ translateX: floatingAnim3.interpolate({ inputRange: [0, 1], outputRange: [-5, 15] }) }, { translateY: floatingAnim3.interpolate({ inputRange: [0, 1], outputRange: [8, -5] }) }], opacity: floatingAnim3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.7, 0.4] }) }]} />
              
              <View style={styles.locationTextShadow}>
                <Text style={styles.locationText}>
                  지금 경조사 관리를 시작해보세요
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* 일러스트레이션 영역 */}
          <View style={styles.illustrationSection}>
            <Animated.View
              style={[
                styles.illustrationCard,
                {
                  width: carouselMetrics.cardWidth,
                  borderRadius: carouselMetrics.cardRadius,
                  transform: [{ scale: cardScaleAnim }],
                  opacity: cardOpacityAnim,
                },
              ]}
            >
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                decelerationRate="fast"
                onScrollBeginDrag={handleCarouselScrollBeginDrag}
                onMomentumScrollEnd={handleCarouselScrollEnd}
                style={styles.carouselScroller}
              >
                {WELCOME_SLIDES.map((slide) => (
                  <View
                    key={slide.id}
                    style={[
                      styles.carouselSlide,
                      {
                        width: carouselMetrics.cardWidth,
                        padding: carouselMetrics.slidePadding,
                      },
                    ]}
                  >
                    <Image
                      source={slide.image}
                      style={[
                        styles.carouselImage,
                        {
                          height: carouselMetrics.imageHeight,
                          borderRadius: carouselMetrics.imageRadius,
                        },
                      ]}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>

              <View style={styles.carouselDots}>
                {WELCOME_SLIDES.map((slide, index) => (
                  <View
                    key={`${slide.id}-dot`}
                    style={[
                      styles.carouselDot,
                      index === activeSlide && styles.carouselDotActive,
                    ]}
                  />
                ))}
              </View>
            </Animated.View>
          </View>
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartPress}>
            <Animated.View style={[styles.buttonFloatingCircle, styles.buttonFloatingCircle1, { transform: [{ translateX: buttonFloatingAnim1.interpolate({ inputRange: [0, 1], outputRange: [10, 80] }) }, { translateY: buttonFloatingAnim1.interpolate({ inputRange: [0, 1], outputRange: [5, 45] }) }], opacity: buttonFloatingAnim1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, 0.3, 0.1] }) }]} />
            <Animated.View style={[styles.buttonFloatingCircle, styles.buttonFloatingCircle2, { transform: [{ translateX: buttonFloatingAnim2.interpolate({ inputRange: [0, 1], outputRange: [70, 20] }) }, { translateY: buttonFloatingAnim2.interpolate({ inputRange: [0, 1], outputRange: [10, 40] }) }], opacity: buttonFloatingAnim2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, 0.25, 0.1] }) }]} />
            <Text style={styles.startButtonText}>휴대폰 번호로 시작하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guestButton} onPress={handleGuestPress}>
            <Text style={styles.guestButtonText}>가이드 먼저 보기</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            계속하면 <Text style={styles.linkText} onPress={handleTermsPress}>이용약관</Text> 및{' '}
            <Text style={styles.linkText} onPress={handlePrivacyPress}>개인정보처리방침</Text>에 동의하게 됩니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 0 : 28,
    paddingBottom: Platform.OS === 'ios' ? 10 : 44,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 0,
  },
  logoContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 50,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F7FF',
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 18,
    fontWeight: '400',
  },
  locationContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  locationTextShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '700',
    backgroundColor: '#F8FDFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#90CAF9',
    zIndex: 10,
  },
  floatingCircle: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    borderRadius: 50,
  },
  floatingCircle1: {
    width: 8,
    height: 8,
    top: -5,
    left: 15,
  },
  floatingCircle2: {
    width: 6,
    height: 6,
    top: 5,
    right: 20,
  },
  floatingCircle3: {
    width: 4,
    height: 4,
    bottom: 0,
    left: 25,
  },
  illustrationSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationCard: {
    backgroundColor: '#FAFBFC',
    padding: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F3F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  carouselScroller: {
    width: '100%',
  },
  carouselSlide: {},
  carouselImage: {
    width: '100%',
    backgroundColor: Colors.white,
  },
  carouselDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 2,
    paddingBottom: 12,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray300,
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: Colors.primary,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  miniIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  illustrationText: {
    fontSize: 15,
    color: '#6B7684',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonSection: {
    // 상위 View(content)에서 가로/세로 여백을 모두 제어하므로 관련 스타일 제거
    gap: 5,
  },
  startButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonFloatingCircle: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 50,
  },
  buttonFloatingCircle1: {
    width: 16,
    height: 16,
  },
  buttonFloatingCircle2: {
    width: 12,
    height: 12,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
    zIndex: 10,
  },
  guestButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  footerText: {
    fontSize: 12,
    color: '#8B95A1',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 5,
    fontWeight: '400',
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
