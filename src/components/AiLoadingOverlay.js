// src/components/AiLoadingOverlay.js
// 전역 AI 계산 로딩 오버레이
// - 반투명 배경 + 중앙 카드
// - 펄스 애니메이션 로고 + 회전 메시지 + 진행 바 + 팁
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const DEFAULT_MESSAGES = [
  '🤖 AI가 데이터를 분석하고 있어요',
  '📊 시장 정보를 수집하고 있어요',
  '💡 맞춤 추천을 만들고 있어요',
  '✨ 결과를 정리하고 있어요',
];

const TIPS = [
  '💡 AI 추천은 평균 15~30초 정도 걸려요',
  '☕ 잠시만 기다려주세요, 거의 다 됐어요',
  '🎯 딥시크 AI가 꼼꼼히 계산 중이에요',
];

export default function AiLoadingOverlay({
  visible,
  title = 'AI가 추천을 만들고 있어요',
  messages = DEFAULT_MESSAGES,
  accent = '#0064FF',
}) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  const pulse = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 메시지 순환 (2.5초마다)
  useEffect(() => {
    if (!visible) {
      setMsgIdx(0);
      setTipIdx(0);
      return;
    }
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 2500);
    const tipTimer = setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
    }, 5000);
    return () => {
      clearInterval(msgTimer);
      clearInterval(tipTimer);
    };
  }, [visible, messages.length]);

  // 애니메이션 (펄스 + 회전 + 점 + 프로그레스 바)
  useEffect(() => {
    if (!visible) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 3500, easing: Easing.linear, useNativeDriver: true })
    );

    const makeDot = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(400 - delay),
        ])
      );

    const dotsLoop = Animated.parallel([
      makeDot(dot1, 0),
      makeDot(dot2, 150),
      makeDot(dot3, 300),
    ]);

    // 인디터미네이트 프로그레스 바 (0 → 1 → 반복)
    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(progressAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );

    pulseLoop.start();
    rotateLoop.start();
    dotsLoop.start();
    progressLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
      dotsLoop.stop();
      progressLoop.stop();
      pulse.setValue(0);
      rotate.setValue(0);
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
      progressAnim.setValue(0);
    };
  }, [visible]);

  const outerScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
  const outerOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const innerScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const rotateStr = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['5%', '95%'] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={s.card}>
          {/* 펄스 스피너 */}
          <View style={s.spinnerWrap}>
            <Animated.View
              style={[s.pulseRing, { backgroundColor: accent + '40', transform: [{ scale: outerScale }], opacity: outerOpacity }]}
            />
            <Animated.View
              style={[s.pulseRing, { backgroundColor: accent + '25', transform: [{ scale: outerScale }], opacity: outerOpacity }]}
            />
            <Animated.View
              style={[s.spinnerCore, { backgroundColor: accent, transform: [{ scale: innerScale }, { rotate: rotateStr }] }]}
            >
              <Text style={s.spinnerEmoji}>🤖</Text>
            </Animated.View>
          </View>

          {/* 타이틀 */}
          <Text style={s.title}>{title}</Text>

          {/* 회전 메시지 */}
          <View style={s.msgRow}>
            <Text style={s.msg}>{messages[msgIdx]}</Text>
            <View style={s.dotsRow}>
              {[dot1, dot2, dot3].map((a, i) => (
                <Animated.View
                  key={i}
                  style={[
                    s.dot,
                    {
                      backgroundColor: accent,
                      opacity: a,
                      transform: [
                        { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* 프로그레스 바 */}
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressBar, { width: progressWidth, backgroundColor: accent }]} />
          </View>

          {/* 팁 */}
          <Text style={s.tip}>{TIPS[tipIdx]}</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(width - 48, 320),
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },

  // 스피너
  spinnerWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  spinnerCore: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0064FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  spinnerEmoji: { fontSize: 32 },

  // 타이틀
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191F28',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // 회전 메시지
  msgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    marginBottom: 18,
  },
  msg: {
    fontSize: 13,
    color: '#4E5968',
    fontWeight: '500',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // 프로그레스 바
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#F2F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },

  // 팁
  tip: {
    fontSize: 12,
    color: '#8B95A1',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});
