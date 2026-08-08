// src/screens/main/guides/themes/GuideThemeMinimal.js
// 토스 디자이너 스타일 — 클린 블루, 부드러운 아이콘 버블, 스프링 애니메이션
// · 진입 시 카드 순차 페이드인
// · 탭 시 스케일 다운 피드백
// · 소프트 톤 아이콘 버블 (블루/그린/옐로/핑크 각 카테고리)
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HOST_FAQS, PARTICIPANT_FAQS, shuffleFaqs } from '../faqData';

const C = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  ink: '#191F28',
  inkSoft: '#4E5968',
  inkMuted: '#8B95A1',
  inkDim: '#B0B8C1',
  border: '#F2F4F6',
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
};

// 카테고리/역할 id → 아이콘 버블 색상
const BUBBLE_MAP = {
  host:         { bg: C.blueSoft,   color: C.blue },
  participant:  { bg: C.greenSoft,  color: C.green },
  'wedding-prep': { bg: C.pinkSoft, color: C.pink },
  'funeral-prep': { bg: C.purpleSoft, color: C.purple },
  'contract-questions': { bg: C.orangeSoft, color: C.orange },
  'budget-calc':  { bg: C.orangeSoft, color: C.orange },
  money:          { bg: C.blueSoft, color: C.blue },
  manner:         { bg: C.pinkSoft, color: C.pink },
  etiquette:      { bg: C.greenSoft, color: C.green },
};

const getBubble = (id) => BUBBLE_MAP[id] || { bg: C.blueSoft, color: C.blue };

// 프레스 피드백이 있는 커스텀 버튼 (토스 스타일 scale-down)
function PressableCard({ onPress, style, children, activeScale = 0.97 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
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
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// 스태거드 페이드인 래퍼
function StaggerItem({ delay = 0, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function GuideThemeMinimal({
  navigation,
  userTypes,
  hostCategories,
  participantCategories,
  hostTips,
  participantTips,
  aiStatus,
  AI_COST,
  selectedUserType,
  setSelectedUserType,
  onCreditPress,
}) {
  const [hostTip, setHostTip] = useState(hostTips[0] || '');
  const [guestTip, setGuestTip] = useState(participantTips[0] || '');

  // 역할 선택 화면 하단에 쓰일 혼합 팁 + 인기 FAQ
  const mixedTips = [...hostTips, ...participantTips];
  const [entryTip, setEntryTip] = useState(mixedTips[0] || '');
  const popularFAQs = React.useMemo(() => {
    const allPopular = [
      ...HOST_FAQS.filter((f) => f.popular).map((f) => ({ ...f, _role: 'host' })),
      ...PARTICIPANT_FAQS.filter((f) => f.popular).map((f) => ({ ...f, _role: 'participant' })),
    ];
    return shuffleFaqs(allPopular).slice(0, 3);
  }, []);

  // 팁 새로고침 (살짝 트위들 애니메이션) — 직전 팁과 중복되지 않게 선택
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const pickDifferent = (arr, current) => {
    if (!arr || arr.length === 0) return current;
    if (arr.length === 1) return arr[0];
    let next = current;
    let guard = 0;
    while (next === current && guard < 10) {
      next = arr[Math.floor(Math.random() * arr.length)];
      guard += 1;
    }
    return next;
  };
  const refreshTip = () => {
    Animated.sequence([
      Animated.timing(tipOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(tipOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      if (selectedUserType === 'host') {
        setHostTip((prev) => pickDifferent(hostTips, prev));
      } else {
        setGuestTip((prev) => pickDifferent(participantTips, prev));
      }
    }, 150);
  };

  // ═══════════════════════════════════════════════
  // 역할 선택
  // ═══════════════════════════════════════════════
  if (!selectedUserType) {
    return (
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <StaggerItem delay={0}>
            <View style={s.hero}>
              <Text style={s.heroGreet}>안녕하세요 👋</Text>
              <Text style={s.heroTitle}>
                어떤 도움이{'\n'}필요하신가요?
              </Text>
              <Text style={s.heroSub}>역할에 맞는 가이드를 준비했어요</Text>
            </View>
          </StaggerItem>

          {userTypes.map((ut, i) => {
            const b = getBubble(ut.id);
            return (
              <StaggerItem key={ut.id} delay={120 + i * 80}>
                <PressableCard
                  style={s.roleCard}
                  onPress={() => setSelectedUserType(ut.id)}
                >
                  <View style={[s.bubble, { backgroundColor: b.bg }]}>
                    <Ionicons name={ut.icon} size={24} color={b.color} />
                  </View>
                  <View style={s.roleBody}>
                    <Text style={s.roleTitle}>{ut.title}</Text>
                    <Text style={s.roleSub}>{ut.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={C.inkDim} />
                </PressableCard>
              </StaggerItem>
            );
          })}

          {/* 오늘의 팁 */}
          <StaggerItem delay={400}>
            <Text style={s.sectionLabel}>오늘의 팁</Text>
            <PressableCard
              style={s.tipEntry}
              onPress={() => {
                Animated.sequence([
                  Animated.timing(tipOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
                  Animated.timing(tipOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                ]).start();
                setTimeout(() => {
                  setEntryTip((prev) => pickDifferent(mixedTips, prev));
                }, 150);
              }}
            >
              <View style={s.tipEntryHead}>
                <View style={[s.bubbleSmall, { backgroundColor: C.blueSoft }]}>
                  <Ionicons name="bulb" size={14} color={C.blue} />
                </View>
                <Text style={s.tipEntryLabel}>경조사 꿀팁</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="refresh" size={14} color={C.inkDim} />
              </View>
              <Animated.Text style={[s.tipEntryText, { opacity: tipOpacity }]}>
                {entryTip}
              </Animated.Text>
            </PressableCard>
          </StaggerItem>

          {/* 인기 질문 */}
          <StaggerItem delay={480}>
            <View style={s.popularHead}>
              <Text style={s.sectionLabel}>인기 질문</Text>
              <PressableCard
                onPress={() => navigation.navigate('FAQ', { role: 'host' })}
                activeScale={0.92}
                style={s.popularMoreBtn}
              >
                <Text style={s.popularMore}>전체 보기</Text>
                <Ionicons name="chevron-forward" size={12} color={C.inkMuted} />
              </PressableCard>
            </View>

            {popularFAQs.map((faq, i) => (
              <StaggerItem key={faq.id} delay={520 + i * 50}>
                <PressableCard
                  style={s.popularCard}
                  onPress={() => navigation.navigate('FAQ', { role: faq._role })}
                >
                  <View style={[s.popularDot, { backgroundColor: faq._role === 'host' ? C.blue : C.green }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.popularRole}>
                      {faq._role === 'host' ? '주최자' : '참여자'}
                    </Text>
                    <Text style={s.popularQ} numberOfLines={2}>{faq.question}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.inkDim} />
                </PressableCard>
              </StaggerItem>
            ))}
          </StaggerItem>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════
  // 카테고리 화면
  // ═══════════════════════════════════════════════
  const isHost = selectedUserType === 'host';
  const cats = isHost ? hostCategories : participantCategories;
  const tip = isHost ? hostTip : guestTip;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <StaggerItem delay={0}>
          <View style={s.catHero}>
            <PressableCard style={s.backBtn} onPress={() => setSelectedUserType(null)} activeScale={0.9}>
              <Ionicons name="arrow-back" size={18} color={C.ink} />
            </PressableCard>
            <Text style={s.catLabel}>
              {isHost ? '주최자 가이드' : '참여자 가이드'}
            </Text>
            <Text style={s.catTitle}>
              {isHost ? '행사 준비,\n이렇게 시작하세요' : '편안하게\n참석하는 법'}
            </Text>
          </View>
        </StaggerItem>

        {/* 인사이트 카드 (꿀팁) */}
        <StaggerItem delay={100}>
          <PressableCard style={s.tipCard} onPress={refreshTip}>
            <View style={s.tipHead}>
              <View style={[s.bubbleSmall, { backgroundColor: C.blueSoft }]}>
                <Ionicons name="bulb" size={14} color={C.blue} />
              </View>
              <Text style={s.tipLabel}>오늘의 팁</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="refresh" size={14} color={C.inkDim} />
            </View>
            <Animated.Text style={[s.tipText, { opacity: tipOpacity }]}>
              {tip}
            </Animated.Text>
          </PressableCard>
        </StaggerItem>

        {/* 섹션 라벨 */}
        <StaggerItem delay={180}>
          <Text style={s.sectionLabel}>가이드 · {cats.length}</Text>
        </StaggerItem>

        {/* 카테고리 카드 */}
        {cats.map((cat, i) => {
          const isAi = !!cat.isAi;
          const free =
            isAi &&
            ((cat.aiFeature === 'budget' && aiStatus.budgetFreeAvailable) ||
              (cat.aiFeature === 'money' && aiStatus.moneyFreeAvailable));
          const b = getBubble(cat.id);
          return (
            <StaggerItem key={cat.id} delay={220 + i * 60}>
              <PressableCard
                style={s.catCard}
                onPress={() => navigation.navigate(cat.screen)}
              >
                <View style={[s.bubble, { backgroundColor: b.bg }]}>
                  <Ionicons name={cat.icon} size={22} color={b.color} />
                </View>
                <View style={s.catBody}>
                  <View style={s.catTitleRow}>
                    <Text style={s.catTitle2}>{cat.title}</Text>
                    {isAi && (
                      <View style={[s.aiPill, free && s.aiPillFree]}>
                        <Text style={[s.aiPillText, free && s.aiPillTextFree]}>
                          {free ? '무료 체험' : `💎 ${cat.aiCost}`}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.catSub}>{cat.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.inkDim} />
              </PressableCard>
            </StaggerItem>
          );
        })}

        {/* FAQ + 크레딧 (bottom) */}
        <StaggerItem delay={560}>
          <PressableCard
            style={s.miniLink}
            onPress={() => navigation.navigate('FAQ', { role: selectedUserType })}
          >
            <Ionicons name="help-circle-outline" size={20} color={C.inkSoft} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.miniLinkTitle}>자주 묻는 질문</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.inkDim} />
          </PressableCard>
        </StaggerItem>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 60 },

  // 히어로
  hero: { paddingTop: 16, paddingBottom: 28 },
  heroGreet: { fontSize: 13, color: C.inkSoft, fontWeight: '500', marginBottom: 4 },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSub: { fontSize: 13, color: C.inkMuted, letterSpacing: -0.2 },

  // 역할 카드
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
  },
  bubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bubbleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  roleBody: { flex: 1 },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  roleSub: { fontSize: 12, color: C.inkSoft, letterSpacing: -0.2 },

  // 크레딧 카드
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },
  creditLabel: { fontSize: 11, color: C.inkMuted, fontWeight: '600', marginBottom: 2 },
  creditValue: { fontSize: 14, color: C.ink },
  creditValueBig: {
    fontSize: 17,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  creditUnit: { fontSize: 12, fontWeight: '500', color: C.inkSoft },
  creditCta: {
    fontSize: 13,
    fontWeight: '700',
    color: C.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.blueSoft,
    borderRadius: 10,
  },

  // 카테고리 헤더
  catHero: { paddingTop: 8, paddingBottom: 18 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  catLabel: { fontSize: 12, fontWeight: '700', color: C.blue, letterSpacing: 0.5, marginBottom: 6 },
  catTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.7,
    lineHeight: 36,
  },

  // 팁 카드
  tipCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  tipHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tipLabel: { fontSize: 12, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },
  tipText: {
    fontSize: 14,
    color: C.inkSoft,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '500',
  },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkMuted,
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 10,
  },

  // 카테고리 카드
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  catBody: { flex: 1 },
  catTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  catTitle2: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
    letterSpacing: -0.3,
  },
  catSub: { fontSize: 12, color: C.inkSoft, letterSpacing: -0.2 },

  aiPill: {
    backgroundColor: C.blueSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiPillText: { fontSize: 10, fontWeight: '800', color: C.blue, letterSpacing: -0.2 },
  aiPillFree: { backgroundColor: C.greenSoft },
  aiPillTextFree: { color: C.green },

  // 미니 링크 (FAQ)
  miniLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },
  miniLinkTitle: { fontSize: 14, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkMuted,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },

  // 오늘의 팁 (역할 선택 화면용)
  tipEntry: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
  },
  tipEntryHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tipEntryLabel: { fontSize: 12, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },
  tipEntryText: {
    fontSize: 14,
    color: C.inkSoft,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '500',
  },

  // 인기 질문
  popularHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popularMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 20,
  },
  popularMore: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkMuted,
    letterSpacing: -0.2,
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  popularDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  popularRole: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  popularQ: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
});
