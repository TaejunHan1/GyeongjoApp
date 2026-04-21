// 튜토리얼용 — 특정 버튼 주위에 펄스 링 (포커스 보조 강조용)
// 사용법: 강조할 버튼 내부/상위에 absolute로 배치
//   <View style={{ position: 'relative' }}>
//     <TouchableOpacity>...버튼...</TouchableOpacity>
//     {tutorialActive && <TutorialPulseRing />}
//   </View>
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';

export default function TutorialPulseRing({ color = '#FEE500', borderRadius = 10 }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius,
          borderWidth: 3,
          borderColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}
