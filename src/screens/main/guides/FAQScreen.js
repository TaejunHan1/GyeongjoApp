// src/screens/main/guides/FAQScreen.js
// 통합 FAQ 화면 — role 파라미터로 주최자/참여자 분기
// 토스 디자인 시스템 적용
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  TC,
  PressableCard,
  StaggerItem,
  Bubble,
  ScreenHeader,
  SectionLabel,
  getBubble,
} from './tossStyle';
import {
  HOST_FAQS,
  PARTICIPANT_FAQS,
  HOST_CATEGORIES,
  PARTICIPANT_CATEGORIES,
  shuffleFaqs,
} from './faqData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DISPLAY_COUNT = 15;

// 카테고리별 아이콘 색상 (faqData 의 category 값)
const CAT_COLOR_MAP = {
  wedding:     { bg: TC.pinkSoft,   color: TC.pink },
  funeral:     { bg: TC.purpleSoft, color: TC.purple },
  budget:      { bg: TC.orangeSoft, color: TC.orange },
  preparation: { bg: TC.greenSoft,  color: TC.green },
  money:       { bg: TC.blueSoft,   color: TC.blue },
  manner:      { bg: TC.pinkSoft,   color: TC.pink },
  etiquette:   { bg: TC.greenSoft,  color: TC.green },
  etc:         { bg: TC.orangeSoft, color: TC.orange },
  all:         { bg: TC.blueSoft,   color: TC.blue },
};

const FAQ_INSIGHTS = {
  wedding: {
    icon: 'heart-outline',
    label: '결혼식 체크',
    note: '비용은 식대와 보증 인원이 가장 크게 흔들어요.',
  },
  funeral: {
    icon: 'flower-outline',
    label: '장례 준비',
    note: '장례식장·용품·화장 예약은 공식 가격표를 먼저 확인하세요.',
  },
  budget: {
    icon: 'calculator-outline',
    label: '예산 기준',
    note: '평균보다 우리 인원과 계약 조건을 기준으로 잡는 게 안전해요.',
  },
  preparation: {
    icon: 'checkmark-done-outline',
    label: '준비 흐름',
    note: '한 번에 끝내기보다 날짜별로 나눠서 확정하세요.',
  },
  money: {
    icon: 'cash-outline',
    label: '금액 판단',
    note: '관계·참석 여부·지역 관례를 함께 보는 게 좋아요.',
  },
  manner: {
    icon: 'shirt-outline',
    label: '복장 매너',
    note: '튀지 않게, 단정하게, 상황에 맞게가 핵심이에요.',
  },
  etiquette: {
    icon: 'people-outline',
    label: '예절 포인트',
    note: '형식보다 상대를 배려하는 태도가 먼저예요.',
  },
  etc: {
    icon: 'help-circle-outline',
    label: '상황별 팁',
    note: '애매하면 미리 짧게 물어보는 게 가장 깔끔해요.',
  },
};

const cleanAnswerText = (text = '') => String(text).replace(/\*\*/g, '').trim();

const parseAnswerSections = (answer = '') => {
  const lines = String(answer).split('\n').map((line) => line.trim()).filter(Boolean);
  const sections = [];
  let current = { title: null, body: [] };

  lines.forEach((line) => {
    const heading = line.match(/^\*\*(.+?)\*\*$/);
    if (heading) {
      if (current.title || current.body.length) sections.push(current);
      current = { title: heading[1], body: [] };
      return;
    }
    current.body.push(line.replace(/^•\s*/, ''));
  });

  if (current.title || current.body.length) sections.push(current);
  return sections;
};

const getFaqSummary = (item) => {
  const sections = parseAnswerSections(item.answer);
  const firstBody = sections.flatMap((section) => section.body).find(Boolean);
  return cleanAnswerText(firstBody || item.answer).slice(0, 82);
};

function FAQAnswer({ item }) {
  const catColor = CAT_COLOR_MAP[item.category] || CAT_COLOR_MAP.all;
  const insight = FAQ_INSIGHTS[item.category] || FAQ_INSIGHTS.etc;
  const sections = parseAnswerSections(item.answer);
  const quickPoints = sections
    .flatMap((section) => section.body)
    .map(cleanAnswerText)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <View style={s.answerContent}>
      <View style={[s.insightCard, { backgroundColor: catColor.bg }]}>
        <View style={[s.insightIcon, { backgroundColor: TC.card }]}>
          <Ionicons name={insight.icon} size={17} color={catColor.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.insightLabel, { color: catColor.color }]}>{insight.label}</Text>
          <Text style={s.insightText}>{insight.note}</Text>
        </View>
      </View>

      {quickPoints.length > 0 && (
        <View style={s.quickWrap}>
          {quickPoints.map((point, index) => (
            <View key={`${item.id}-quick-${index}`} style={s.quickChip}>
              <Ionicons name="checkmark" size={13} color={catColor.color} />
              <Text style={s.quickText} numberOfLines={2}>{point}</Text>
            </View>
          ))}
        </View>
      )}

      {sections.map((section, sectionIndex) => (
        <View key={`${item.id}-section-${sectionIndex}`} style={s.answerSection}>
          {!!section.title && (
            <View style={s.answerSectionTitleRow}>
              <View style={[s.answerSectionDot, { backgroundColor: catColor.color }]} />
              <Text style={s.answerSectionTitle}>{section.title}</Text>
            </View>
          )}
          {section.body.map((line, lineIndex) => (
            <View key={`${item.id}-line-${sectionIndex}-${lineIndex}`} style={s.answerBulletRow}>
              <View style={s.answerBullet} />
              <Text style={s.answerBulletText}>{cleanAnswerText(line)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function FAQScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role === 'participant' ? 'participant' : 'host';
  const isHost = role === 'host';

  const allFaqs = isHost ? HOST_FAQS : PARTICIPANT_FAQS;
  const categories = isHost ? HOST_CATEGORIES : PARTICIPANT_CATEGORIES;

  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedFAQ, setDisplayedFAQ] = useState([]);

  const getFeaturedFaqs = React.useCallback((items) => {
    const popular = items.filter((item) => item.popular);
    const others = shuffleFaqs(items.filter((item) => !item.popular));
    return [...popular, ...others].slice(0, DISPLAY_COUNT);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setDisplayedFAQ(getFeaturedFaqs(allFaqs));
      setExpandedItems(new Set());
    }, [role, getFeaturedFaqs])
  );

  const filteredFAQ =
    selectedCategory === 'all'
      ? displayedFAQ
      : displayedFAQ.filter((item) => item.category === selectedCategory);

  const popularFAQs = selectedCategory === 'all' ? displayedFAQ.filter((i) => i.popular) : [];

  const toggleItem = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setDisplayedFAQ(getFeaturedFaqs(allFaqs));
    setExpandedItems(new Set());
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <StaggerItem delay={0}>
          <ScreenHeader
            onBack={() => navigation.goBack()}
            eyebrow={isHost ? '주최자 FAQ' : '참여자 FAQ'}
            title={isHost ? '준비하며\n자주 궁금한 것' : '참석하며\n자주 궁금한 것'}
            subtitle={isHost ? `총 ${allFaqs.length}개 · ${DISPLAY_COUNT}개 랜덤 표시` : `총 ${allFaqs.length}개 · ${DISPLAY_COUNT}개 랜덤 표시`}
            right={
              <PressableCard style={s.refreshBtn} onPress={handleRefresh} activeScale={0.88}>
                <Ionicons name="refresh" size={18} color={TC.blue} />
              </PressableCard>
            }
          />
        </StaggerItem>

        {/* 카테고리 탭 */}
        <StaggerItem delay={80}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catRow}
          >
            {categories.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <PressableCard
                  key={category.id}
                  style={[s.catChip, active && s.catChipActive]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeScale={0.95}
                >
                  <Ionicons
                    name={category.icon}
                    size={14}
                    color={active ? TC.card : TC.inkSoft}
                  />
                  <Text style={[s.catChipText, active && s.catChipTextActive]}>
                    {category.title}
                  </Text>
                </PressableCard>
              );
            })}
          </ScrollView>
        </StaggerItem>

        {/* 인기 질문 */}
        {popularFAQs.length > 0 && (
          <StaggerItem delay={140}>
            <View style={s.popularWrap}>
              <SectionLabel>🔥 인기 질문</SectionLabel>
              {popularFAQs.map((item, idx) => {
                const key = `popular-${item.id}`;
                const expanded = expandedItems.has(key);
                const catColor = CAT_COLOR_MAP[item.category] || CAT_COLOR_MAP.all;
                return (
                  <StaggerItem key={key} delay={180 + idx * 50}>
                    <PressableCard
                      style={[s.faqCard, s.faqCardPopular]}
                      onPress={() => toggleItem(key)}
                    >
                      <View style={s.faqHead}>
                        <View style={[s.faqFireIcon, { backgroundColor: TC.orangeSoft }]}>
                          <Ionicons name="flame" size={14} color={TC.orange} />
                        </View>
                        <Text style={s.faqQuestion} numberOfLines={expanded ? 0 : 2}>
                          {item.question}
                        </Text>
                        <Ionicons
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={TC.inkMuted}
                        />
                      </View>
                      {!expanded && (
                        <Text style={s.faqSummary} numberOfLines={2}>
                          {getFaqSummary(item)}
                        </Text>
                      )}
                      {expanded && (
                        <View style={s.faqAnswerWrap}>
                          <FAQAnswer item={item} />
                        </View>
                      )}
                    </PressableCard>
                  </StaggerItem>
                );
              })}
            </View>
          </StaggerItem>
        )}

        {/* 전체 / 카테고리 FAQ */}
        <StaggerItem delay={220}>
          <SectionLabel count={filteredFAQ.length}>
            {selectedCategory === 'all'
              ? '전체 질문'
              : `${categories.find((c) => c.id === selectedCategory)?.title || ''} 질문`}
          </SectionLabel>
        </StaggerItem>

        {filteredFAQ.length === 0 ? (
          <StaggerItem delay={260}>
            <View style={s.emptyBox}>
              <Bubble icon="help-circle-outline" bg={TC.border} color={TC.inkMuted} size="lg" />
              <Text style={s.emptyText}>해당 카테고리 질문이 없어요</Text>
            </View>
          </StaggerItem>
        ) : (
          filteredFAQ.map((item, idx) => {
            const expanded = expandedItems.has(item.id);
            const catColor = CAT_COLOR_MAP[item.category] || CAT_COLOR_MAP.all;
            return (
              <StaggerItem key={item.id} delay={260 + idx * 45}>
                <PressableCard
                  style={s.faqCard}
                  onPress={() => toggleItem(item.id)}
                >
                  <View style={s.faqHead}>
                    <View style={[s.faqCatDot, { backgroundColor: catColor.color }]} />
                    <Text style={s.faqQuestion} numberOfLines={expanded ? 0 : 2}>
                      {item.question}
                    </Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={TC.inkMuted}
                    />
                  </View>
                  {!expanded && (
                    <Text style={s.faqSummary} numberOfLines={2}>
                      {getFaqSummary(item)}
                    </Text>
                  )}
                  {expanded && (
                    <View style={s.faqAnswerWrap}>
                      <FAQAnswer item={item} />
                    </View>
                  )}
                </PressableCard>
              </StaggerItem>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: TC.bg },
  scroll: { padding: 20, paddingBottom: 60 },

  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TC.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 카테고리 탭
  catRow: { gap: 8, paddingVertical: 4, marginBottom: 16 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: TC.card,
    borderRadius: 20,
  },
  catChipActive: { backgroundColor: TC.ink },
  catChipText: { fontSize: 13, fontWeight: '600', color: TC.inkSoft, letterSpacing: -0.2 },
  catChipTextActive: { color: TC.card },

  // 인기
  popularWrap: { marginBottom: 8 },

  // FAQ 카드
  faqCard: {
    backgroundColor: TC.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  faqCardPopular: {
    borderWidth: 1,
    borderColor: TC.orangeSoft,
  },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faqFireIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqCatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: TC.ink,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  faqAnswerWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: TC.border,
  },
  faqSummary: {
    marginTop: 9,
    marginLeft: 38,
    fontSize: 12,
    fontWeight: '600',
    color: TC.inkMuted,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  faqAnswer: {
    fontSize: 13,
    color: TC.inkSoft,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  answerContent: {
    gap: 10,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '700',
    color: TC.inkSoft,
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  quickWrap: {
    gap: 6,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: TC.bg,
  },
  quickText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: TC.ink,
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  answerSection: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: TC.border,
  },
  answerSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  answerSectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  answerSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: TC.ink,
    letterSpacing: -0.2,
  },
  answerBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 5,
  },
  answerBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TC.inkMuted,
    marginTop: 8,
  },
  answerBulletText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: TC.inkSoft,
    lineHeight: 19,
    letterSpacing: -0.2,
  },

  // 빈 상태
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: TC.inkMuted,
  },
});
