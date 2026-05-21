// src/screens/event/templates/wedding/WeddingCommonComponents.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Easing,
  PanResponder,
  ScrollView,
  Linking,
  Share,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc2hxdnJsZGNlc3ZqdHJlZHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDI1MTQsImV4cCI6MjA2NDYxODUxNH0.uIfuqMP7SFvQfQXSESS9xKHWlBYeWmZwf1j_4eveZ6Q';

const getPhotoFrameTouchDistance = (touches = []) => {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  const dx = (a.pageX || 0) - (b.pageX || 0);
  const dy = (a.pageY || 0) - (b.pageY || 0);
  return Math.sqrt(dx * dx + dy * dy);
};

export const PhotoFrameOverlay = ({
  selectedPhotoFrame,
  frameAdjusting = false,
  onPhotoFrameAdjust,
  activeStyle,
}) => {
  const selectedFrameRef = useRef(selectedPhotoFrame);
  const adjustFrameRef = useRef(onPhotoFrameAdjust);
  const frameAdjustingRef = useRef(frameAdjusting);
  const gestureStartRef = useRef({ scale: 0.78, offsetX: 0, offsetY: 0, distance: 0 });

  useEffect(() => {
    selectedFrameRef.current = selectedPhotoFrame;
  }, [selectedPhotoFrame]);

  useEffect(() => {
    adjustFrameRef.current = onPhotoFrameAdjust;
  }, [onPhotoFrameAdjust]);

  useEffect(() => {
    frameAdjustingRef.current = frameAdjusting;
  }, [frameAdjusting]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => frameAdjustingRef.current && !!selectedFrameRef.current?.source,
    onMoveShouldSetPanResponder: () => frameAdjustingRef.current && !!selectedFrameRef.current?.source,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (evt) => {
      const frame = selectedFrameRef.current || {};
      const touches = evt.nativeEvent?.touches || [];
      gestureStartRef.current = {
        scale: frame.scale || 0.78,
        offsetX: frame.offsetX || 0,
        offsetY: frame.offsetY || 0,
        distance: getPhotoFrameTouchDistance(touches),
      };
    },
    onPanResponderMove: (evt, gestureState) => {
      const start = gestureStartRef.current;
      const touches = evt.nativeEvent?.touches || [];
      if (touches.length >= 2) {
        const distance = getPhotoFrameTouchDistance(touches);
        if (distance <= 0) return;
        if (start.distance <= 0) {
          const frame = selectedFrameRef.current || {};
          gestureStartRef.current = {
            scale: frame.scale || 0.78,
            offsetX: frame.offsetX || 0,
            offsetY: frame.offsetY || 0,
            distance,
          };
          return;
        }
        adjustFrameRef.current?.({ scale: start.scale * (distance / start.distance) });
        return;
      }
      adjustFrameRef.current?.({
        offsetX: start.offsetX + gestureState.dx,
        offsetY: start.offsetY + gestureState.dy,
      });
    },
  })).current;

  if (!selectedPhotoFrame?.source) return null;

  const scale = selectedPhotoFrame.scale || 0.78;
  return (
    <View
      pointerEvents={frameAdjusting ? 'auto' : 'none'}
      style={[photoFrameStyles.layer, frameAdjusting && photoFrameStyles.layerActive, frameAdjusting && activeStyle]}
      {...(frameAdjusting ? panResponder.panHandlers : {})}
    >
      <Image
        source={selectedPhotoFrame.source}
        style={[
          photoFrameStyles.image,
          {
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
            transform: [
              { translateX: selectedPhotoFrame.offsetX || 0 },
              { translateY: selectedPhotoFrame.offsetY || 0 },
            ],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const photoFrameStyles = {
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  layerActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  image: {},
};

const downloadSupabaseImage = async (url) => {
  if (!url || !url.startsWith('http')) return null;

  // 방법1: fetch + arrayBuffer
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      if (bytes.length > 0) {
        const chunkSize = 8192;
        let binary = '';
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        if (base64) return `data:image/jpeg;base64,${base64}`;
      }
    }
  } catch (fetchErr) {
    // fetch 실패 시 FileSystem으로 폴백
  }

  // 방법2: FileSystem.downloadAsync
  try {
    const fileName = `supa_${Date.now()}.jpg`;
    const tempPath = `${FileSystem.cacheDirectory || ''}${fileName}`;
    const result = await Promise.race([
      FileSystem.downloadAsync(url, tempPath, { headers: { 'apikey': SUPABASE_ANON_KEY } }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('FS timeout')), 15000)),
    ]);
    if (result.status === 200) {
      const base64 = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.deleteAsync(result.uri, { idempotent: true });
      if (base64) return `data:image/jpeg;base64,${base64}`;
    }
  } catch (fsErr) {
    // 실패
  }

  return null;
};
import { 
  width, 
  height, 
  defaultImages, 
  KoreanColors, 
  getCalendarData,
  getSafeAnimValue 
} from './WeddingUtils';
import styles from './WeddingStyles';

// 꽃잎 컴포넌트
export const FallingPetals = () => {
  const petals = useRef([...Array(15)].map(() => ({
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: Math.random() * 5000,
  }))).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const startPetals = () => {
      if (!isMountedRef.current) return;
      
      petals.forEach((petal, index) => {
        const animateLoop = () => {
          if (!isMountedRef.current) return;
          
          Animated.loop(
            Animated.timing(petal.anim, {
              toValue: 1,
              duration: 8000 + (index * 1000),
              delay: petal.delay,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            { iterations: -1 }
          ).start();
        };
        
        setTimeout(animateLoop, index * 100);
      });
    };
    
    startPetals();
    
    return () => {
      isMountedRef.current = false;
      petals.forEach(petal => {
        petal.anim.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={styles.petalsContainer}>
      {petals.map((petal, index) => (
        <Animated.View
          key={index}
          style={[
            styles.petal,
            {
              left: petal.x,
              transform: [{
                translateY: petal.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50]
                })
              }, {
                rotate: petal.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }],
              opacity: petal.anim.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 0.8, 0.8, 0]
              })
            }
          ]}
        >
          <Text style={styles.petalText}>🌸</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// ── 전역 꽃잎 효과 (configurable) ──
const SPEED_MULT = { slow: 1.9, normal: 1, fast: 0.55 };
const QTY_COUNT = { few: 0.45, normal: 1, many: 1.8 };

// 각 파티클을 랜덤 진행률에서 시작 → 항상 화면 전체에 고르게 분포, 끊김 없이 루프
function startContinuousParticle(anim, dur) {
  const initialProgress = Math.random(); // 0~1 랜덤 시작 위치
  anim.setValue(initialProgress);
  // 현재 사이클 나머지 구간 완료
  Animated.timing(anim, {
    toValue: 1,
    duration: dur * (1 - initialProgress),
    useNativeDriver: true,
    easing: Easing.linear,
  }).start(({ finished }) => {
    if (!finished) return;
    anim.setValue(0);
    // 이후 무한 루프
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: dur, useNativeDriver: true, easing: Easing.linear }),
      { iterations: -1 }
    ).start();
  });
}

const FlowerEffect = ({ speed = 'normal', qty = 'normal' }) => {
  const imgs = [
    require('../../../../../assets/images/flowers/flower2.png'),
    require('../../../../../assets/images/flowers/flower3.png'),
    require('../../../../../assets/images/flowers/flower4.png'),
    require('../../../../../assets/images/flowers/flower5.png'),
  ];
  const sm = SPEED_MULT[speed] || 1;
  const count = Math.round(28 * (QTY_COUNT[qty] || 1));
  const flowers = useRef([...Array(count)].map((_, i) => ({
    anim: new Animated.Value(Math.random()),
    x: Math.random() * width,
    size: Math.random() * 38 + 26,
    imgIdx: i % 4,
    dur: (7000 + Math.random() * 2000) * sm,
  }))).current;
  useEffect(() => {
    flowers.forEach(f => startContinuousParticle(f.anim, f.dur));
  }, []);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, pointerEvents: 'none' }}>
      {flowers.map((f, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: f.x,
          opacity: f.anim.interpolate({ inputRange: [0, 0.04, 0.92, 1], outputRange: [0, 0.82, 0.82, 0] }),
          transform: [
            { translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [-100, height + 100] }) },
            { translateX: f.anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 14, -9, 5] }) },
            { rotate: f.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '120deg'] }) },
          ],
        }}>
          <Image source={imgs[f.imgIdx]} style={{ width: f.size, height: f.size }} resizeMode="contain" />
        </Animated.View>
      ))}
    </View>
  );
};

const ClassicSnowEffect = ({ speed = 'normal', qty = 'normal' }) => {
  const imgs = [
    require('../../../../../assets/icons/1.png'), require('../../../../../assets/icons/2.png'),
    require('../../../../../assets/icons/3.png'), require('../../../../../assets/icons/4.png'),
    require('../../../../../assets/icons/5.png'), require('../../../../../assets/icons/6.png'),
    require('../../../../../assets/icons/7.png'), require('../../../../../assets/icons/8.png'),
    require('../../../../../assets/icons/9.png'), require('../../../../../assets/icons/10.png'),
    require('../../../../../assets/icons/11.png'), require('../../../../../assets/icons/12.png'),
  ];
  const sm = SPEED_MULT[speed] || 1;
  const count = Math.round(32 * (QTY_COUNT[qty] || 1));
  const flakes = useRef([...Array(count)].map((_, i) => ({
    anim: new Animated.Value(Math.random()),
    x: Math.random() * width,
    size: Math.random() * 7 + 4,
    imgIdx: i % 12,
    dur: (5000 + Math.random() * 2000) * sm,
  }))).current;
  useEffect(() => {
    flakes.forEach(f => startContinuousParticle(f.anim, f.dur));
  }, []);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, pointerEvents: 'none' }}>
      {flakes.map((f, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: f.x,
          opacity: f.anim.interpolate({ inputRange: [0, 0.04, 0.92, 1], outputRange: [0, 0.68, 0.68, 0] }),
          transform: [
            { translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [-80, height + 50] }) },
            { translateX: f.anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 12, -8, 5] }) },
            { rotate: f.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '100deg'] }) },
          ],
        }}>
          <Image source={imgs[f.imgIdx]} style={{ width: f.size, height: f.size }} resizeMode="contain" fadeDuration={0} />
        </Animated.View>
      ))}
    </View>
  );
};

const PetalEffect = ({ speed = 'normal', qty = 'normal' }) => {
  const sm = SPEED_MULT[speed] || 1;
  const count = Math.round(18 * (QTY_COUNT[qty] || 1));
  const petals = useRef([...Array(count)].map(() => ({
    anim: new Animated.Value(Math.random()),
    x: Math.random() * width,
    size: 18 + Math.random() * 12,
    dur: (8000 + Math.random() * 4000) * sm,
  }))).current;
  useEffect(() => {
    petals.forEach(p => startContinuousParticle(p.anim, p.dur));
  }, []);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, pointerEvents: 'none' }}>
      {petals.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: p.x,
          opacity: p.anim.interpolate({ inputRange: [0, 0.05, 0.92, 1], outputRange: [0, 0.82, 0.82, 0] }),
          transform: [
            { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [-50, height + 50] }) },
            { rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        }}>
          <Text style={{ fontSize: p.size }}>🌸</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// ── 커스텀 꽃비 (색상 선택 가능한 타원형 꽃잎) ──
const CUSTOM_PETAL_THEMES = {
  pink:   ['#ffb7c5', '#ff9eaf', '#ffd1dc', '#fff0f5', '#ffccd5'],
  yellow: ['#ffd700', '#ffea00', '#ffc100', '#fffacd', '#ffe066'],
  red:    ['#ff4060', '#d70000', '#ff6b6b', '#ff0000', '#c00000'],
  blue:   ['#8a2be2', '#4169e1', '#87cefa', '#e6e6fa', '#6ab0f5'],
  mixed:  ['#ffb7c5', '#ffd700', '#ff4060', '#87cefa', '#c8a2e0', '#ffd1dc', '#ffe066'],
};

const CustomPetalEffect = ({ speed = 'normal', qty = 'normal', color = 'pink' }) => {
  const sm = SPEED_MULT[speed] || 1;
  const count = Math.round(30 * (QTY_COUNT[qty] || 1));
  const colors = CUSTOM_PETAL_THEMES[color] || CUSTOM_PETAL_THEMES.pink;

  // 핵심: 원(width=height)을 scaleY로 늘려서 진짜 타원 만들기
  // borderRadius: size/2 on a circle → always a perfect circle
  // transform scaleY: aspect → stretches circle into true ellipse
  // flutter: scaleY oscillates between aspect and aspect*0.12 (pre-multiplied)
  const petals = useRef([...Array(count)].map((_, i) => {
    const size   = 1.5 + Math.random() * 1.5;     // 원 지름 1.5~3px
    const aspect = 2.2 + Math.random() * 1.0;    // 세로 늘이기 2.2~3.2배 → 실제 높이 3~10px
    return {
      anim:     new Animated.Value(Math.random()),
      flipAnim: new Animated.Value(Math.random()),
      x:        Math.random() * width,
      size,
      aspect,
      wobble:   12 + Math.random() * 22,
      dur:      (4000 + Math.random() * 5000) * sm,
      color:    colors[i % colors.length],
      opPeak:   0.55 + Math.random() * 0.4,
    };
  })).current;

  useEffect(() => {
    petals.forEach(p => {
      startContinuousParticle(p.anim, p.dur);
      p.flipAnim.setValue(Math.random());
      Animated.loop(
        Animated.timing(p.flipAnim, {
          toValue: 1, duration: p.dur * 0.35,
          useNativeDriver: true, easing: Easing.linear,
        }),
        { iterations: -1 }
      ).start();
    });
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, pointerEvents: 'none' }}>
      {petals.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          left: p.x,
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,  // 완벽한 원 → scaleY로 타원이 됨
          backgroundColor: p.color,
          opacity: p.anim.interpolate({ inputRange: [0, 0.04, 0.92, 1], outputRange: [0, p.opPeak, p.opPeak, 0] }),
          transform: [
            { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [-50, height + 50] }) },
            { translateX: p.anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, p.wobble, 0, -p.wobble, 0] }) },
            { rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            // aspect ratio + flutter 를 하나의 scaleY로 처리
            // outputRange에 aspect를 미리 곱해서 진짜 타원(oval) 구현
            { scaleY: p.flipAnim.interpolate({
                inputRange:  [0,       0.25,          0.5,    0.75,          1      ],
                outputRange: [p.aspect, p.aspect*0.12, p.aspect, p.aspect*0.12, p.aspect],
              })
            },
          ],
        }} />
      ))}
    </View>
  );
};

export const GlobalFallingEffect = ({ type, speed = 'normal', qty = 'normal', color = 'pink' }) => {
  if (!type || type === 'none') return null;
  if (type === 'flower') return <FlowerEffect speed={speed} qty={qty} />;
  if (type === 'classic') return <ClassicSnowEffect speed={speed} qty={qty} />;
  if (type === 'custom_petal') return <CustomPetalEffect speed={speed} qty={qty} color={color} />;
  return null;
};

// 하트 효과 컴포넌트
export const FloatingHearts = () => {
  const hearts = useRef([...Array(12)].map(() => ({
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: Math.random() * 3000,
  }))).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    hearts.forEach((heart, index) => {
      const animateHeart = () => {
        if (!isMountedRef.current) return;
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(heart.anim, {
              toValue: 1,
              duration: 6000 + (index * 500),
              delay: heart.delay,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(heart.anim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            })
          ]),
          { iterations: -1 }
        ).start();
      };
      
      setTimeout(animateHeart, index * 200);
    });
    
    return () => {
      isMountedRef.current = false;
      hearts.forEach(heart => {
        heart.anim.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={styles.heartsContainer}>
      {hearts.map((heart, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.floatingHeart,
            {
              left: heart.x,
              transform: [{
                translateY: heart.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, -100]
                })
              }, {
                scale: heart.anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1.2, 0]
                })
              }],
              opacity: heart.anim.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, 1, 1, 0]
              })
            }
          ]}
        >
          {['💕', '💖', '💗', '❤️', '💓'][index % 5]}
        </Animated.Text>
      ))}
    </View>
  );
};

// 하트 펄스 컴포넌트
export const HeartPulse = ({ style, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const pulse = () => {
      if (!isMountedRef.current) return;
      
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start((finished) => {
        if (finished && isMountedRef.current) {
          requestAnimationFrame(pulse);
        }
      });
    };
    
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        pulse();
      }
    }, delay);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      scaleAnim.stopAnimation();
    };
  }, [delay, scaleAnim]);

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.heartIcon}>💖</Text>
    </Animated.View>
  );
};

// 카운트다운 디스플레이 컴포넌트
export const CountdownDisplay = ({ timeLeft, style, textStyle, labelStyle, isExpired = false }) => {
  if (isExpired) {
    return (
      <View style={[styles.countdownExpired, style]}>
        <Text style={[styles.countdownExpiredText, textStyle]}>
          D-Day! 축하합니다! 🎉
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.countdownContainer, style]}>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.days}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>일</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.hours}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>시간</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.minutes}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>분</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.seconds}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>초</Text>
      </View>
    </View>
  );
};

// 이미지 뷰어 컴포넌트
export const ImageViewer = ({ visible, images = [], currentIndex, onClose, onIndexChange }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [imageIndex, setImageIndex] = useState(currentIndex || 0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current && currentIndex !== undefined) {
      setImageIndex(currentIndex);
    }
  }, [currentIndex]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (evt, gestureState) => {
      if (!isMountedRef.current) return;
      
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        if (gestureState.dx > 50 && imageIndex > 0) {
          const newIndex = imageIndex - 1;
          setImageIndex(newIndex);
          onIndexChange && onIndexChange(newIndex);
        } else if (gestureState.dx < -50 && imageIndex < images.length - 1) {
          const newIndex = imageIndex + 1;
          setImageIndex(newIndex);
          onIndexChange && onIndexChange(newIndex);
        }
      });
    },
  });

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.imageViewerContainer}>
        <TouchableOpacity style={styles.imageViewerClose} onPress={onClose}>
          <Ionicons name="close" size={30} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.imageViewerContent} {...panResponder.panHandlers}>
          <Image 
            source={(images[imageIndex] || images[0] || defaultImages[0])}
            style={styles.imageViewerImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.imageViewerIndicator}>
          <Text style={styles.imageViewerCounter}>
            {imageIndex + 1} / {images.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// 메인 슬라이드쇼 컴포넌트 (5장까지)
export const MainPhotoSlideshow = ({ images = [], style, onImagePress, template = 'modern' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isChangingRef = useRef(false);
  const [downloadedUris, setDownloadedUris] = useState({});
  const downloadingRef = useRef({});

  const handleImageError = async (imgSource) => {
    const url = imgSource?.uri;
    if (!url || !url.startsWith('http')) return;
    if (downloadedUris[url] || downloadingRef.current[url]) return;
    downloadingRef.current[url] = true;
    const base64Uri = await downloadSupabaseImage(url);
    if (base64Uri && isMountedRef.current) {
      setDownloadedUris(prev => ({ ...prev, [url]: base64Uri }));
    }
    downloadingRef.current[url] = false;
  };

  const getResolvedSource = (imgSource) => {
    if (!imgSource) return defaultImages[0];
    const url = imgSource?.uri;
    if (url && downloadedUris[url]) return { uri: downloadedUris[url] };
    return imgSource;
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 메인사진은 최대 5장까지만 사용
  const mainImages = images && images.length > 0 ? images.slice(0, 5) : defaultImages.slice(0, 5);

  useEffect(() => {
    if (mainImages.length > 1) {
      intervalRef.current = setInterval(() => {
        if (!isMountedRef.current || isChangingRef.current) return;
        
        isChangingRef.current = true;
        
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start((finished) => {
          if (finished && isMountedRef.current) {
            requestAnimationFrame(() => {
              if (isMountedRef.current) {
                setCurrentIndex((prev) => (prev + 1) % mainImages.length);
                // 이미지 변경 후 바로 다시 페이드인
                setTimeout(() => {
                  if (isMountedRef.current) {
                    Animated.timing(fadeAnim, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      isChangingRef.current = false;
                    });
                  }
                }, 50);
              }
            });
          }
        });
      }, 3000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [mainImages.length, fadeAnim]);

  return (
    <TouchableOpacity 
      style={[styles.mainPhotoSlideshow, style]}
      onPress={() => onImagePress && onImagePress(currentIndex)}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={getResolvedSource(mainImages[currentIndex] || mainImages[0])}
          style={styles.mainPhotoImage}
          resizeMode="cover"
          onError={() => {
            const failedSrc = mainImages[currentIndex] || mainImages[0];
            handleImageError(failedSrc);
          }}
          defaultSource={defaultImages[0]}
        />
      </Animated.View>
      
      {/* 인디케이터 */}
      <View style={styles.mainPhotoIndicators}>
        {mainImages.map((_, index) => (
          <View 
            key={index}
            style={[
              styles.mainPhotoIndicator,
              { opacity: index === currentIndex ? 1 : 0.3 }
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
};

// 사진 갤러리 컴포넌트
export const PhotoGallery = ({ images = [], style, onImagePress, autoSlide = false, template = 'modern' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const [downloadedUris, setDownloadedUris] = useState({});
  const downloadingRef = useRef({});

  const handleGalleryImageError = async (imgSource) => {
    const url = imgSource?.uri;
    if (!url || !url.startsWith('http')) return;
    if (downloadedUris[url] || downloadingRef.current[url]) return;
    downloadingRef.current[url] = true;
    const base64Uri = await downloadSupabaseImage(url);
    if (base64Uri && isMountedRef.current) {
      setDownloadedUris(prev => ({ ...prev, [url]: base64Uri }));
    }
    downloadingRef.current[url] = false;
  };

  const getGallerySource = (imgSource) => {
    if (!imgSource) return defaultImages[0];
    const url = imgSource?.uri;
    if (url && downloadedUris[url]) return { uri: downloadedUris[url] };
    return imgSource;
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (autoSlide && images && images.length > 1) {
      const startSlideShow = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
          if (!isMountedRef.current) return;
          
          // 페이드아웃
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start((finished) => {
            if (finished && isMountedRef.current) {
              // requestAnimationFrame을 사용하여 안전하게 state 업데이트
              requestAnimationFrame(() => {
                if (isMountedRef.current) {
                  setCurrentIndex((prev) => (prev + 1) % images.length);
                  // 페이드인
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                  }).start();
                }
              });
            }
          });
        }, 4000);
      };

      startSlideShow();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [images?.length, autoSlide, fadeAnim]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!images || images.length === 0) {
    return (
      <View style={[styles.galleryAutoSlide, style]}>
        <View style={styles.galleryAutoSlideImage}>
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 50 }}>
            사진이 없습니다
          </Text>
        </View>
      </View>
    );
  }

  if (autoSlide) {
    return (
      <TouchableOpacity 
        style={[styles.galleryAutoSlide, style]}
        onPress={() => onImagePress && onImagePress(currentIndex)}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image
            source={getGallerySource(images[currentIndex] || images[0])}
            style={styles.galleryAutoSlideImage}
            resizeMode="cover"
            onError={() => handleGalleryImageError(images[currentIndex] || images[0])}
          />
        </Animated.View>
        <View style={styles.galleryAutoSlideIndicators}>
          {images.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.galleryIndicator,
                { opacity: index === currentIndex ? 1 : 0.3 }
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={[styles.galleryScroll, style]}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: slideAnim } } }],
        { useNativeDriver: false }
      )}
    >
      {images.map((image, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.galleryItem}
          onPress={() => onImagePress(index)}
        >
          <Image
            source={getGallerySource(image)}
            style={styles.galleryItemImage}
            resizeMode="cover"
            onError={() => handleGalleryImageError(image)}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// 모던 다크 달력 컴포넌트
export const ModernDarkCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);
  
  return (
    <View style={[styles.modernCalendar, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        style={styles.modernCalendarContainer}
      >
        <View style={styles.modernCalendarHeader}>
          <Text style={styles.modernCalendarTitle}>
            {calendarData.monthNameEn} {calendarData.year}
          </Text>
        </View>
        
        <View style={styles.modernCalendarWeekDays}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[
              styles.modernCalendarWeekDay,
              (index === 0 || index === 6) && styles.modernCalendarWeekendDay
            ]}>
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.modernCalendarGrid}>
          {calendarData.days.map((dayData, index) => (
            <View key={index} style={styles.modernCalendarDayContainer}>
              {dayData.isTargetDate ? (
                <Animated.View style={[
                  styles.modernCalendarDay,
                  styles.modernCalendarTargetDay,
                  {
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1]
                      })
                    }],
                    shadowOpacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.7]
                    })
                  }
                ]}>
                  <Text style={styles.modernCalendarTargetDayText}>{dayData.day}</Text>
                  <Text style={styles.modernCalendarDDayText}>💖</Text>
                </Animated.View>
              ) : (
                <View style={[
                  styles.modernCalendarDay,
                  dayData.isToday && styles.modernCalendarToday,
                  !dayData.isCurrentMonth && styles.modernCalendarOtherMonth
                ]}>
                  <Text style={[
                    styles.modernCalendarDayText,
                    dayData.isToday && styles.modernCalendarTodayText,
                    !dayData.isCurrentMonth && styles.modernCalendarOtherMonthText,
                    (index % 7 === 0 || index % 7 === 6) && styles.modernCalendarWeekendText
                  ]}>
                    {dayData.day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// 한국 전통 달력 컴포넌트
export const KoreanElegantCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);
  
  return (
    <View style={[styles.koreanCalendar, style]}>
      <LinearGradient
        colors={[KoreanColors.elegant.light, KoreanColors.elegant.secondary]}
        style={styles.koreanCalendarContainer}
      >
        <View style={styles.koreanCalendarHeader}>
          <View style={styles.koreanCalendarDecoLine} />
          <Text style={styles.koreanCalendarTitle}>
            {calendarData.year}년 {calendarData.monthName}
          </Text>
          <View style={styles.koreanCalendarDecoLine} />
        </View>
        
        <View style={styles.koreanCalendarWeekDays}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[
              styles.koreanCalendarWeekDay,
              (index === 0 || index === 6) && styles.koreanCalendarWeekendDay
            ]}>
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.koreanCalendarGrid}>
          {calendarData.days.map((dayData, index) => (
            <View key={index} style={styles.koreanCalendarDayContainer}>
              {dayData.isTargetDate ? (
                <Animated.View style={[
                  styles.koreanCalendarDay,
                  styles.koreanCalendarTargetDay,
                  {
                    shadowColor: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [KoreanColors.elegant.accent, KoreanColors.elegant.primary]
                    }),
                    shadowOpacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8]
                    })
                  }
                ]}>
                  <Text style={styles.koreanCalendarTargetDayText}>{dayData.day}</Text>
                  <Text style={styles.koreanCalendarDDayText}>💗</Text>
                </Animated.View>
              ) : (
                <View style={[
                  styles.koreanCalendarDay,
                  dayData.isToday && styles.koreanCalendarToday,
                  !dayData.isCurrentMonth && styles.koreanCalendarOtherMonth
                ]}>
                  <Text style={[
                    styles.koreanCalendarDayText,
                    dayData.isToday && styles.koreanCalendarTodayText,
                    !dayData.isCurrentMonth && styles.koreanCalendarOtherMonthText,
                    (index % 7 === 0) && styles.koreanCalendarSundayText,
                    (index % 7 === 6) && styles.koreanCalendarSaturdayText
                  ]}>
                    {dayData.day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// 빈티지 앱 달력 컴포넌트
export const VintageAppCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);
  
  return (
    <View style={[styles.vintageCalendar, style]}>
      <View style={styles.vintageCalendarContainer}>
        <LinearGradient
          colors={['#6c5ce7', '#a29bfe']}
          style={styles.vintageCalendarHeader}
        >
          <Text style={styles.vintageCalendarTitle}>
            {calendarData.monthNameEn} {calendarData.year}
          </Text>
          <View style={styles.vintageCalendarHeaderDeco}>
            <Text style={styles.vintageCalendarEmojiLeft}>📅</Text>
            <Text style={styles.vintageCalendarEmojiRight}>💝</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.vintageCalendarContent}>
          <View style={styles.vintageCalendarWeekDays}>
            {weekDays.map((day, index) => (
              <Text key={index} style={[
                styles.vintageCalendarWeekDay,
                (index === 0 || index === 6) && styles.vintageCalendarWeekendDay
              ]}>
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.vintageCalendarGrid}>
            {calendarData.days.map((dayData, index) => (
              <View key={index} style={styles.vintageCalendarDayContainer}>
                {dayData.isTargetDate ? (
                  <Animated.View style={[
                    styles.vintageCalendarDay,
                    styles.vintageCalendarTargetDay,
                    {
                      transform: [{
                        translateY: bounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -3]
                        })
                      }, {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]}>
                    <Text style={styles.vintageCalendarTargetDayText}>{dayData.day}</Text>
                    <Text style={styles.vintageCalendarDDayText}>💕</Text>
                  </Animated.View>
                ) : (
                  <View style={[
                    styles.vintageCalendarDay,
                    dayData.isToday && styles.vintageCalendarToday,
                    !dayData.isCurrentMonth && styles.vintageCalendarOtherMonth
                  ]}>
                    <Text style={[
                      styles.vintageCalendarDayText,
                      dayData.isToday && styles.vintageCalendarTodayText,
                      !dayData.isCurrentMonth && styles.vintageCalendarOtherMonthText,
                      (index % 7 === 0 || index % 7 === 6) && styles.vintageCalendarWeekendText
                    ]}>
                      {dayData.day}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// RomanticPinkCalendar 컴포넌트 (로맨틱 핑크 달력)
export const RomanticPinkCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 30,
      marginVertical: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 30,
      elevation: 5,
      ...style
    }}>
      <Text style={{
        fontSize: 18,
        color: '#333',
        marginBottom: 25,
        fontWeight: '500',
        textAlign: 'center'
      }}>
        {calendarData.monthNameEn} {calendarData.year}
      </Text>
      
      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        {weekDays.map((day, index) => (
          <Text key={index} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 12,
            color: index === 0 ? '#ff6b6b' : '#666',
            fontWeight: '500'
          }}>
            {day}
          </Text>
        ))}
      </View>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {calendarData.days.map((dayData, index) => (
          <View key={index} style={{ 
            width: '14.28%', 
            aspectRatio: 1,
            padding: 5 
          }}>
            {dayData.isTargetDate ? (
              <View style={{
                flex: 1,
                backgroundColor: '#C2B0A2',
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#C2B0A2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
                elevation: 3
              }}>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  {dayData.day}
                </Text>
              </View>
            ) : (
              <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8
              }}>
                <Text style={{
                  color: !dayData.isCurrentMonth ? '#ddd' : 
                         index % 7 === 0 ? '#ff6b6b' : '#666',
                  fontSize: 14
                }}>
                  {dayData.day || ''}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// OpeningOverlay 컴포넌트 (오프닝 오버레이)
export const OpeningOverlay = ({ visible }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const strokeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // 텍스트 쓰기 애니메이션
      Animated.timing(strokeAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
        easing: Easing.ease,
      }).start();
      
      // 페이드아웃
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500,
        delay: 3500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeAnim
      }}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Text style={{
        fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
        fontSize: 48,
        color: 'white',
        fontStyle: 'italic'
      }}>
        Happy Wedding
      </Text>
    </Animated.View>
  );
};

// 🔥 GuestBookMessages 컴포넌트 - 실제 DB 메시지 표시 및 작성
export const GuestBookMessages = ({ 
  messages = [], 
  onAddMessage, 
  style,
  loadingMessages = false,
  placeholder = '축하 메시지를 입력해주세요',
  messageType = 'congratulation'
}) => {
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
    name: '',
    message: '',
    phone: '',
    isAnonymous: false
  });

  const handleSubmitMessage = async () => {
    if (!newMessage.message.trim()) {
      Alert.alert('알림', '메시지를 입력해주세요.');
      return;
    }

    if (!newMessage.isAnonymous && !newMessage.name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    // 메시지 제출
    await onAddMessage({
      name: newMessage.isAnonymous ? '익명' : newMessage.name,
      message: newMessage.message,
      phone: newMessage.phone,
      isAnonymous: newMessage.isAnonymous
    });

    // 폼 초기화
    setNewMessage({
      name: '',
      message: '',
      phone: '',
      isAnonymous: false
    });
    setShowMessageForm(false);
  };

  // 메시지 포맷팅 함수
  const formatMessageDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={[{ maxWidth: 400, alignSelf: 'center', width: '100%' }, style]}>
      {/* 메시지 작성 버튼 */}
      <TouchableOpacity 
        style={{
          width: '100%',
          padding: 18,
          borderRadius: 30,
          marginBottom: 20,
          overflow: 'hidden'
        }}
        onPress={() => setShowMessageForm(true)}
      >
        <LinearGradient
          colors={['#C2B0A2', '#9B8D82']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            borderRadius: 30
          }}
        />
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>💌</Text>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
            {messageType === 'condolence' ? '조문 메시지 남기기' : '축하 메시지 남기기'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 메시지 작성 폼 */}
      {showMessageForm && (
        <View style={{
          backgroundColor: 'white',
          borderRadius: 15,
          padding: 25,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 15,
          elevation: 3
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>
              메시지 작성
            </Text>
            <TouchableOpacity onPress={() => setShowMessageForm(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {!newMessage.isAnonymous && (
            <>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  fontSize: 14
                }}
                placeholder="이름"
                value={newMessage.name}
                onChangeText={(text) => setNewMessage({...newMessage, name: text})}
              />
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  fontSize: 14
                }}
                placeholder="연락처 (선택)"
                value={newMessage.phone}
                onChangeText={(text) => setNewMessage({...newMessage, phone: text})}
                keyboardType="phone-pad"
              />
            </>
          )}

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#DDD',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              fontSize: 14,
              minHeight: 100,
              textAlignVertical: 'top'
            }}
            placeholder={placeholder}
            value={newMessage.message}
            onChangeText={(text) => setNewMessage({...newMessage, message: text})}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20
            }}
            onPress={() => setNewMessage({...newMessage, isAnonymous: !newMessage.isAnonymous})}
          >
            <Ionicons 
              name={newMessage.isAnonymous ? "checkbox" : "square-outline"} 
              size={20} 
              color="#666" 
            />
            <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>
              익명으로 작성
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#C2B0A2',
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleSubmitMessage}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              메시지 남기기
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 메시지 목록 */}
      {loadingMessages ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={{ marginTop: 10, fontSize: 14, color: '#666' }}>
            메시지를 불러오는 중...
          </Text>
        </View>
      ) : messages.length > 0 ? (
        messages.map((message, index) => (
          <View key={message.id || index} style={{
            backgroundColor: 'white',
            borderRadius: 15,
            padding: 25,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.05,
            shadowRadius: 15,
            elevation: 3
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15
            }}>
              <Text style={{ color: '#999', fontSize: 13 }}>
                From. {message.sender_name || message.name || message.from || '익명'}
              </Text>
              <Text style={{ color: '#DDD', fontSize: 12 }}>
                {formatMessageDate(message.created_at || message.date)}
              </Text>
            </View>
            <Text style={{
              lineHeight: 24,
              color: '#555',
              fontSize: 14
            }}>
              {message.message || message.content}
            </Text>
          </View>
        ))
      ) : (
        <View style={{
          alignItems: 'center',
          paddingVertical: 40,
          backgroundColor: 'white',
          borderRadius: 15,
          marginBottom: 20
        }}>
          <Ionicons name="chatbubbles-outline" size={48} color="#DDD" />
          <Text style={{ fontSize: 16, color: '#999', marginTop: 12, marginBottom: 8 }}>
            {messageType === 'condolence' ? '아직 조문 메시지가 없습니다' : '아직 축하 메시지가 없습니다'}
          </Text>
          <Text style={{ fontSize: 14, color: '#BBB' }}>
            {messageType === 'condolence' ? '첫 번째로 조문 메시지를 남겨보세요' : '첫 번째로 축하 메시지를 남겨보세요!'}
          </Text>
        </View>
      )}
    </View>
  );
};

// AccountToggle 컴포넌트 (계좌번호 토글)
export const AccountToggle = ({ 
  groomAccount, 
  brideAccount, 
  activeToggle, 
  onToggle, 
  onCopy 
}) => {
  return (
    <View style={{ maxWidth: 400, alignSelf: 'center', width: '100%' }}>
      {/* 신랑 계좌 */}
      <View style={{
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 3,
        backgroundColor: 'white'
      }}>
        <TouchableOpacity 
          onPress={() => onToggle('groom')}
        >
          <LinearGradient
            colors={['#C2B0A2', '#9B8D82']}
            style={{
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
              신랑측 계좌번호
            </Text>
            <Text style={{ 
              color: 'white', 
              fontSize: 18,
              transform: [{ rotate: activeToggle === 'groom' ? '180deg' : '0deg' }]
            }}>
              ▼
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {activeToggle === 'groom' && (
          <View style={{
            backgroundColor: 'white',
            padding: 25
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5 }}>
              {groomAccount.bank}
            </Text>
            <Text style={{ fontSize: 15, marginBottom: 5, color: '#333' }}>
              {groomAccount.number}
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 15 }}>
              예금주: {groomAccount.name}
            </Text>
            <TouchableOpacity 
              style={{
                backgroundColor: '#FFE0EC',
                paddingVertical: 10,
                paddingHorizontal: 25,
                borderRadius: 20,
                alignSelf: 'flex-start'
              }}
              onPress={() => onCopy(groomAccount.number)}
            >
              <Text style={{ color: '#666', fontSize: 13 }}>
                계좌번호 복사
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* 신부 계좌 */}
      <View style={{
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 3,
        backgroundColor: 'white'
      }}>
        <TouchableOpacity 
          onPress={() => onToggle('bride')}
        >
          <LinearGradient
            colors={['#C2B0A2', '#9B8D82']}
            style={{
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
              신부측 계좌번호
            </Text>
            <Text style={{ 
              color: 'white', 
              fontSize: 18,
              transform: [{ rotate: activeToggle === 'bride' ? '180deg' : '0deg' }]
            }}>
              ▼
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {activeToggle === 'bride' && (
          <View style={{
            backgroundColor: 'white',
            padding: 25
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5 }}>
              {brideAccount.bank}
            </Text>
            <Text style={{ fontSize: 15, marginBottom: 5, color: '#333' }}>
              {brideAccount.number}
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 15 }}>
              예금주: {brideAccount.name}
            </Text>
            <TouchableOpacity 
              style={{
                backgroundColor: '#FFE0EC',
                paddingVertical: 10,
                paddingHorizontal: 25,
                borderRadius: 20,
                alignSelf: 'flex-start'
              }}
              onPress={() => onCopy(brideAccount.number)}
            >
              <Text style={{ color: '#666', fontSize: 13 }}>
                계좌번호 복사
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// Export all components
export default {
  FallingPetals,
  FloatingHearts,
  HeartPulse,
  CountdownDisplay,
  ImageViewer,
  MainPhotoSlideshow,
  PhotoGallery,
  ModernDarkCalendar,
  KoreanElegantCalendar,
  VintageAppCalendar,
  RomanticPinkCalendar,
  OpeningOverlay,
  GuestBookMessages,
  AccountToggle,
};
