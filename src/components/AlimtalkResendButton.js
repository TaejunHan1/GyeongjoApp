// 영수증 재발송 버튼 — 주변에 빛나는 파티클 + 펄스 애니메이션
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlimtalkResendButton({ onPress, loading = false, disabled = false }) {
  // 버튼 주변 파티클 3개
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;
  // 배경 글로우
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopTiming = (val, duration, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(val, { toValue: 0, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      );

    const animations = [
      loopTiming(sparkle1, 1600, 0),
      loopTiming(sparkle2, 1800, 300),
      loopTiming(sparkle3, 2000, 600),
      loopTiming(glow, 1800, 200),
    ];
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  // 글로우 — 배경 빛 강도 (크기 변화 없음, opacity만)
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <View style={styles.wrap}>
      {/* 뒤에서 빛나는 노란 글로우 */}
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { opacity: glowOpacity }]}
      />

      {/* 스파클 1 — 좌상단 */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sparkle,
          styles.sparkleTL,
          {
            opacity: sparkle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateX: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
              { translateY: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
              { scale: sparkle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] }) },
            ],
          },
        ]}
      >
        <Text style={styles.sparkleStar}>✦</Text>
      </Animated.View>

      {/* 스파클 2 — 우상단 */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sparkle,
          styles.sparkleTR,
          {
            opacity: sparkle2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.9, 0] }),
            transform: [
              { translateX: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) },
              { translateY: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
              { scale: sparkle2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.9, 0.3] }) },
            ],
          },
        ]}
      >
        <Text style={styles.sparkleStarSm}>✦</Text>
      </Animated.View>

      {/* 스파클 3 — 우하단 */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sparkle,
          styles.sparkleBR,
          {
            opacity: sparkle3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.8, 0] }),
            transform: [
              { translateX: sparkle3.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
              { translateY: sparkle3.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) },
              { scale: sparkle3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.8, 0.3] }) },
            ],
          },
        ]}
      >
        <Text style={styles.sparkleStarSm}>✦</Text>
      </Animated.View>

      {/* 실제 버튼 */}
      <TouchableOpacity
        style={[styles.btn, (loading || disabled) && { opacity: 0.5 }]}
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.8}
      >
        <Ionicons
          name={loading ? 'sync' : 'paper-plane'}
          size={11}
          color="#3A1D00"
          style={{ marginRight: 4 }}
        />
        <Text style={styles.btnText}>
          {loading ? '발송 중' : '영수증 재발송'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignSelf: 'flex-end',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    // 따뜻한 금빛 그림자 — 빛나는 느낌
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3A1D00',
    letterSpacing: -0.2,
  },
  // 배경 글로우 — 카카오 노랑과 잘 어울리는 따뜻한 빛
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 14,
    backgroundColor: '#FFE87C',
    opacity: 0.5,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleTL: { top: -10, left: -6 },
  sparkleTR: { top: -8, right: -4 },
  sparkleBR: { bottom: -10, right: 10 },
  sparkleStar: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: '#FEE500',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  sparkleStarSm: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: '#FEE500',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
