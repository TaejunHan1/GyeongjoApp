// src/screens/main/BenefitsScreen.js — 혜택 탭 (종이 청첩장 디자이너 메인)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TC, PressableCard, StaggerItem } from './guides/tossStyle';
import { getAiStatus } from '../../lib/aiCredit';

const { width } = Dimensions.get('window');

// 청첩장 템플릿 미리보기 (에셋 완성 전 플레이스홀더 스타일)
const TEMPLATE_PREVIEWS = [
  { id: 'elegant-garden', name: 'Elegant Garden', bg: '#FBF9F3', accent: '#B5C7A8', emoji: '🌿' },
  { id: 'korean-elegant', name: 'Korean Elegant', bg: '#F5EDE0', accent: '#C9A97A', emoji: '🎋' },
  { id: 'modern-minimal', name: 'Modern Minimal', bg: '#F4F4F6', accent: '#6B7684', emoji: '✦' },
  { id: 'romantic-pink', name: 'Romantic Pink', bg: '#FCE7F3', accent: '#F472B6', emoji: '🌸' },
  { id: 'vintage', name: 'Vintage', bg: '#EDE3D2', accent: '#8B6F47', emoji: '🕯️' },
];

const FEATURE_LIST = [
  { icon: 'flower-outline', label: '수채화 꽃·잎 장식', color: TC.green, bg: TC.greenSoft },
  { icon: 'image-outline', label: '사진 자유 배치', color: TC.blue, bg: TC.blueSoft },
  { icon: 'map-outline', label: '지도·교통 안내', color: TC.purple, bg: TC.purpleSoft },
  { icon: 'document-text-outline', label: '고해상도 PDF', color: TC.orange, bg: TC.orangeSoft },
];

export default function BenefitsScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [aiStatus, setAiStatus] = useState({ balance: 0 });
  const [heroFloat] = useState(new Animated.Value(0));

  // 크레딧 잔액 로드
  useEffect(() => {
    getAiStatus().then((s) => {
      if (s?.success) setAiStatus({ balance: s.balance });
    });
  }, []);

  // 히어로 카드 위아래 미세 플로팅 (토스식 subtle motion)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatY = heroFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const handleNotifyPaperInvite = () => {
    // TODO: waitlist DB 저장 + 완료 토스트
  };

  const handleShareReferral = async () => {
    try {
      await Share.share({
        message:
          '정담 — 경조사 관리 앱, 이 링크로 가입하면 3 크레딧 받아요 🎁\nhttps://jeongdam.app/invite/xxxxx',
      });
    } catch (e) {}
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.headerTitle}>스튜디오</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={s.creditPill}
          onPress={() => navigation.navigate('Credit')}
          activeOpacity={0.85}
        >
          <Ionicons name="diamond-outline" size={14} color={TC.blue} />
          <Text style={s.creditPillText}>{aiStatus.balance}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HERO — 종이 청첩장 디자이너 ═══ */}
        <StaggerItem delay={0}>
          <View style={s.heroWrap}>
            <Animated.View
              style={[
                s.heroCard,
                { transform: [{ translateY: floatY }] },
              ]}
            >
              {/* 장식 배경 이모지 */}
              <Text style={[s.heroDeco, { top: 16, right: 20, fontSize: 40, opacity: 0.35 }]}>🌿</Text>
              <Text style={[s.heroDeco, { bottom: 20, left: 16, fontSize: 32, opacity: 0.3 }]}>🌸</Text>

              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>곧 출시</Text>
              </View>

              <Text style={s.heroTitle}>종이 청첩장{'\n'}디자이너</Text>
              <Text style={s.heroSub}>
                수채화 꽃·잎으로 꾸민 나만의 종이 청첩장{'\n'}
                PDF로 받아 원하는 인쇄소에 맡기세요
              </Text>

              <TouchableOpacity
                style={s.heroCta}
                onPress={handleNotifyPaperInvite}
                activeOpacity={0.85}
              >
                <Ionicons name="notifications-outline" size={16} color="#fff" />
                <Text style={s.heroCtaText}>출시 알림 받기</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </StaggerItem>

        {/* 템플릿 미리보기 (가로 스크롤) */}
        <StaggerItem delay={80}>
          <View style={s.previewHead}>
            <Text style={s.sectionLabel}>미리 보는 템플릿</Text>
            <Text style={s.previewHint}>5종 준비 중</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.previewRow}
          >
            {TEMPLATE_PREVIEWS.map((t, i) => (
              <View
                key={t.id}
                style={[s.previewCard, { backgroundColor: t.bg }]}
              >
                {/* 상단 꾸밈 */}
                <View style={[s.previewDecoTop, { backgroundColor: t.accent, opacity: 0.2 }]} />
                <Text style={s.previewEmoji}>{t.emoji}</Text>

                {/* 가상 청첩장 미리보기 */}
                <View style={[s.previewPaper, { borderColor: t.accent + '40' }]}>
                  <View style={[s.previewLine, { backgroundColor: t.accent, width: '50%', height: 3 }]} />
                  <View style={[s.previewLine, { backgroundColor: t.accent, width: '70%', height: 2, marginTop: 6 }]} />
                  <View style={[s.previewPhoto, { backgroundColor: t.accent + '30' }]} />
                  <View style={[s.previewLine, { backgroundColor: t.accent, width: '60%', height: 2, marginTop: 6 }]} />
                  <View style={[s.previewLine, { backgroundColor: t.accent, width: '40%', height: 2, marginTop: 3 }]} />
                </View>

                <Text style={s.previewName}>{t.name}</Text>
              </View>
            ))}
          </ScrollView>
        </StaggerItem>

        {/* 기능 4개 그리드 */}
        <StaggerItem delay={160}>
          <Text style={[s.sectionLabel, { marginTop: 28 }]}>이런 기능이 있어요</Text>
        </StaggerItem>

        <StaggerItem delay={220}>
          <View style={s.featureGrid}>
            {FEATURE_LIST.map((f, i) => (
              <View key={i} style={s.featureCell}>
                <View style={[s.featureBubble, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={20} color={f.color} />
                </View>
                <Text style={s.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </StaggerItem>

        {/* 진행 과정 (3 step) */}
        <StaggerItem delay={280}>
          <View style={s.stepsCard}>
            <Text style={s.stepsTitle}>어떻게 만드나요?</Text>
            <View style={s.stepRow}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.stepLabel}>템플릿 선택</Text>
                <Text style={s.stepDesc}>5가지 스타일 · 1면·2면·반접지·삼단 지원</Text>
              </View>
            </View>
            <View style={s.stepRow}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.stepLabel}>사진·정보 입력</Text>
                <Text style={s.stepDesc}>이름·날짜·장소·지도·연락처 한 번에</Text>
              </View>
            </View>
            <View style={s.stepRow}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.stepLabel}>PDF 다운로드</Text>
                <Text style={s.stepDesc}>300dpi 인쇄용 · 원하는 인쇄소에 전달</Text>
              </View>
            </View>
          </View>
        </StaggerItem>

        {/* ═══ 그 외 혜택 (작게) ═══ */}
        <StaggerItem delay={360}>
          <Text style={[s.sectionLabel, { marginTop: 28 }]}>그 외 혜택</Text>
        </StaggerItem>

        <StaggerItem delay={420}>
          <PressableCard
            style={s.miniCard}
            onPress={() => navigation.navigate('Credit')}
          >
            <View style={[s.miniBubble, { backgroundColor: TC.blueSoft }]}>
              <Ionicons name="diamond" size={18} color={TC.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.miniTitle}>AI 크레딧 번들</Text>
              <Text style={s.miniSub}>10 크레딧 + 보너스 3 크레딧</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={TC.inkDim} />
          </PressableCard>
        </StaggerItem>

        <StaggerItem delay={470}>
          <PressableCard
            style={s.miniCard}
            onPress={handleShareReferral}
          >
            <View style={[s.miniBubble, { backgroundColor: TC.orangeSoft }]}>
              <Ionicons name="gift" size={18} color={TC.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.miniTitle}>친구 초대하기</Text>
              <Text style={s.miniSub}>1명 초대당 3 크레딧 적립</Text>
            </View>
            <Ionicons name="share-outline" size={16} color={TC.inkDim} />
          </PressableCard>
        </StaggerItem>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: TC.bg },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.5,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: TC.blueSoft,
    borderRadius: 14,
  },
  creditPillText: { fontSize: 13, fontWeight: '700', color: TC.blue },

  // ═══ HERO 카드 ═══
  heroWrap: { paddingHorizontal: 20, paddingTop: 16 },
  heroCard: {
    backgroundColor: '#F5EEE0',
    borderRadius: 24,
    padding: 28,
    minHeight: 240,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDeco: {
    position: 'absolute',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: TC.ink,
    borderRadius: 8,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: TC.ink,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 13,
    color: TC.inkSoft,
    lineHeight: 20,
    letterSpacing: -0.2,
    marginBottom: 20,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: TC.ink,
    borderRadius: 24,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 10,
  },

  // 미리보기 헤더
  previewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 28,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  previewHint: {
    fontSize: 11,
    color: TC.inkMuted,
    fontWeight: '500',
  },

  // 템플릿 미리보기
  previewRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingRight: 24,
  },
  previewCard: {
    width: 140,
    height: 200,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },
  previewDecoTop: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  previewEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  previewPaper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  previewLine: {
    borderRadius: 2,
    opacity: 0.5,
  },
  previewPhoto: {
    width: '80%',
    height: 60,
    borderRadius: 6,
    marginTop: 6,
  },
  previewName: {
    fontSize: 11,
    fontWeight: '700',
    color: TC.inkSoft,
    letterSpacing: -0.2,
  },

  // 기능 그리드
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  featureCell: {
    width: (width - 50) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TC.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  featureBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '700',
    color: TC.ink,
    letterSpacing: -0.2,
    flex: 1,
  },

  // Steps
  stepsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: TC.card,
    borderRadius: 16,
    padding: 20,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TC.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: TC.ink,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TC.ink,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // 미니 카드 (그 외 혜택)
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: TC.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  miniBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TC.ink,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  miniSub: {
    fontSize: 12,
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
});
