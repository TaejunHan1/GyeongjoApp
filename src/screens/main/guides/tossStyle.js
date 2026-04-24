// src/screens/main/guides/tossStyle.js
// 가이드 섹션 전체에 재사용되는 토스 디자인 시스템
import React, { useRef, useEffect } from 'react';
import { Animated, Easing, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ───── 컬러 팔레트 ─────
export const TC = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  ink: '#191F28',
  inkSoft: '#4E5968',
  inkMuted: '#8B95A1',
  inkDim: '#B0B8C1',
  border: '#F2F4F6',

  // Accent
  blue: '#3182F6',
  blueSoft: '#E6F0FF',
  green: '#22C55E',
  greenSoft: '#DCFCE7',
  pink: '#F472B6',
  pinkSoft: '#FCE7F3',
  orange: '#F59E0B',
  orangeSoft: '#FEF3C7',
  purple: '#8B5CF6',
  purpleSoft: '#EDE9FE',
  red: '#EF4444',
  redSoft: '#FEE2E2',
  yellow: '#EAB308',
  yellowSoft: '#FEF9C3',
};

// ───── 카테고리별 버블 색상 ─────
export const BUBBLE_MAP = {
  host:            { bg: TC.blueSoft,   color: TC.blue },
  participant:     { bg: TC.greenSoft,  color: TC.green },
  'wedding-prep':  { bg: TC.pinkSoft,   color: TC.pink },
  'funeral-prep':  { bg: TC.purpleSoft, color: TC.purple },
  'budget-calc':   { bg: TC.orangeSoft, color: TC.orange },
  money:           { bg: TC.blueSoft,   color: TC.blue },
  manner:          { bg: TC.pinkSoft,   color: TC.pink },
  etiquette:       { bg: TC.greenSoft,  color: TC.green },
  faq:             { bg: TC.purpleSoft, color: TC.purple },
  credit:          { bg: TC.orangeSoft, color: TC.orange },
};

export const getBubble = (id) => BUBBLE_MAP[id] || { bg: TC.blueSoft, color: TC.blue };

// ───── PressableCard: 탭 시 스케일 다운 피드백 ─────
export function PressableCard({ onPress, onLongPress, style, children, activeScale = 0.97, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }], opacity: disabled ? 0.5 : 1 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ───── StaggerItem: 화면 진입 시 순차 페이드인 + 슬라이드업 ─────
export function StaggerItem({ delay = 0, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ───── Bubble: 아이콘 + 색상 배경 원형 래퍼 ─────
export function Bubble({ icon, size = 'md', color, bg, emoji }) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 52 : 44;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 26 : 22;
  const fallback = { bg: TC.blueSoft, color: TC.blue };
  const actualBg = bg || fallback.bg;
  const actualColor = color || fallback.color;
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: actualBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {emoji ? (
        <Animated.Text style={{ fontSize: iconSize }}>{emoji}</Animated.Text>
      ) : (
        <Ionicons name={icon} size={iconSize} color={actualColor} />
      )}
    </View>
  );
}

// ───── ScreenHeader: 뒤로가기 + eyebrow + 타이틀 ─────
export function ScreenHeader({ onBack, eyebrow, title, subtitle, right }) {
  return (
    <View style={headerStyles.wrap}>
      <View style={headerStyles.top}>
        {onBack ? (
          <PressableCard style={headerStyles.backBtn} onPress={onBack} activeScale={0.9}>
            <Ionicons name="arrow-back" size={18} color={TC.ink} />
          </PressableCard>
        ) : <View style={{ width: 36 }} />}
        {right ? right : <View style={{ width: 36 }} />}
      </View>
      {eyebrow ? <Animated.Text style={headerStyles.eyebrow}>{eyebrow}</Animated.Text> : null}
      {title ? <Animated.Text style={headerStyles.title}>{title}</Animated.Text> : null}
      {subtitle ? <Animated.Text style={headerStyles.subtitle}>{subtitle}</Animated.Text> : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 18 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TC.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 12, fontWeight: '700', color: TC.blue, letterSpacing: 0.5, marginBottom: 6 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.7,
    lineHeight: 36,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: TC.inkMuted, letterSpacing: -0.2, lineHeight: 20 },
});

// ───── SectionLabel: 섹션 구분 라벨 ─────
export function SectionLabel({ children, count }) {
  return (
    <Animated.Text style={sectionLabelStyle}>
      {children}{count !== undefined ? ` · ${count}` : ''}
    </Animated.Text>
  );
}

const sectionLabelStyle = {
  fontSize: 12,
  fontWeight: '700',
  color: TC.inkMuted,
  letterSpacing: 0.5,
  marginTop: 4,
  marginBottom: 10,
};

// ───── 공용 스타일 헬퍼 ─────
export const commonStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TC.bg },
  scroll: { padding: 20, paddingBottom: 60 },

  card: {
    backgroundColor: TC.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TC.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },

  rowBody: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TC.ink,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  rowSub: { fontSize: 12, color: TC.inkSoft, letterSpacing: -0.2 },
});

// ───── Chevron 유틸 ─────
export function Chevron({ color = TC.inkDim, size = 18 }) {
  return <Ionicons name="chevron-forward" size={size} color={color} />;
}
