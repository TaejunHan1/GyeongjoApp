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
  Image,
  Modal,
  Pressable,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TC, PressableCard, StaggerItem } from './guides/tossStyle';
import { getAiStatus } from '../../lib/aiCredit';
import { MOBILE_TEMPLATES, TEMPLATE_CATEGORIES } from './studio/mobileTemplateConfigs';

const { width } = Dimensions.get('window');

const FEATURE_LIST = [
  { icon: 'flower-outline', label: '수채화 꽃·잎 장식', color: TC.green, bg: TC.greenSoft },
  { icon: 'image-outline', label: '사진 자유 배치', color: TC.blue, bg: TC.blueSoft },
  { icon: 'map-outline', label: '지도·교통 안내', color: TC.purple, bg: TC.purpleSoft },
  { icon: 'document-text-outline', label: '고해상도 PDF', color: TC.orange, bg: TC.orangeSoft },
];

export default function BenefitsScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [aiStatus, setAiStatus] = useState({ balance: 0 });
  const [heroFloat] = useState(new Animated.Value(0));
  const [activeCategory, setActiveCategory] = useState('floral');
  const [zoomTemplate, setZoomTemplate] = useState(null); // 바텀 시트 모달
  const sheetFade = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openZoom = (template) => {
    setZoomTemplate(template);
    Animated.parallel([
      Animated.timing(sheetFade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }),
    ]).start();
  };

  const closeZoom = () => {
    Animated.parallel([
      Animated.timing(sheetFade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setZoomTemplate(null));
  };

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

        {/* 템플릿 미리보기 (카테고리 + 가로 스크롤) */}
        <StaggerItem delay={80}>
          <View style={s.previewHead}>
            <Text style={s.sectionLabel}>미리 보는 템플릿</Text>
            <Text style={s.previewHint}>
              {MOBILE_TEMPLATES.filter((t) => t.category === activeCategory).length}종
            </Text>
          </View>

          {/* 카테고리 칩 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.categoryRow}
          >
            {TEMPLATE_CATEGORIES.map((c) => {
              const isActive = c.id === activeCategory;
              const count = MOBILE_TEMPLATES.filter((t) => t.category === c.id).length;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setActiveCategory(c.id)}
                  activeOpacity={0.8}
                  style={[s.categoryChip, isActive && s.categoryChipActive]}
                >
                  <Ionicons
                    name={c.icon}
                    size={13}
                    color={isActive ? '#fff' : TC.inkMuted}
                  />
                  <Text
                    style={[
                      s.categoryChipText,
                      isActive && s.categoryChipTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        s.categoryBadge,
                        isActive && s.categoryBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          s.categoryBadgeText,
                          isActive && s.categoryBadgeTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 템플릿 가로 스크롤 */}
          {MOBILE_TEMPLATES.filter((t) => t.category === activeCategory).length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.previewRow}
            >
              {MOBILE_TEMPLATES.filter((t) => t.category === activeCategory).map(
                (t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={s.previewItem}
                    activeOpacity={0.85}
                    onPress={() => openZoom(t)}
                  >
                    <Image
                      source={t.preview}
                      style={s.previewImage}
                      resizeMode="cover"
                    />
                    <Text style={s.previewName}>{t.name}</Text>
                    <Text style={s.previewSub}>{t.subtitle}</Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          ) : (
            <View style={s.emptyCategory}>
              <Ionicons name="time-outline" size={28} color={TC.inkMuted} />
              <Text style={s.emptyCategoryTitle}>준비 중인 카테고리예요</Text>
              <Text style={s.emptyCategorySub}>곧 새 템플릿으로 찾아올게요</Text>
            </View>
          )}
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

      {/* 템플릿 확대 보기 — 바텀 시트 */}
      <Modal
        visible={!!zoomTemplate}
        transparent
        statusBarTranslucent
        onRequestClose={closeZoom}
        animationType="none"
      >
        <View style={s.sheetRoot}>
          <Animated.View style={[s.sheetBackdrop, { opacity: sheetFade }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeZoom} />
          </Animated.View>

          <Animated.View
            style={[
              s.sheetContainer,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            {/* 핸들바 */}
            <View style={s.sheetHandle} />

            {zoomTemplate && (
              <>
                {/* 헤더 */}
                <View style={s.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sheetTitle}>{zoomTemplate.name}</Text>
                    <Text style={s.sheetSubtitle}>{zoomTemplate.subtitle}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={closeZoom}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={s.sheetCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={TC.ink} />
                  </TouchableOpacity>
                </View>

                {/* 이미지 */}
                <View style={s.sheetImageWrap}>
                  <Image
                    source={zoomTemplate.preview}
                    style={s.sheetImage}
                    resizeMode="contain"
                  />
                </View>

                {/* CTA — 이 템플릿으로 만들기 */}
                <View style={s.sheetCtaWrap}>
                  <TouchableOpacity
                    style={s.sheetCta}
                    activeOpacity={0.85}
                    onPress={() => {
                      const t = zoomTemplate;
                      closeZoom();
                      setTimeout(() => {
                        navigation.navigate('PaperInvitationEditor', { template: t });
                      }, 260);
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={s.sheetCtaText}>이 템플릿으로 만들기</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
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

  // 카테고리 칩
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: TC.card,
    borderRadius: 18,
  },
  categoryChipActive: {
    backgroundColor: TC.ink,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  categoryBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  categoryBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: TC.inkMuted,
  },
  categoryBadgeTextActive: {
    color: '#fff',
  },

  // 빈 카테고리
  emptyCategory: {
    marginHorizontal: 20,
    paddingVertical: 36,
    alignItems: 'center',
    backgroundColor: TC.card,
    borderRadius: 16,
    gap: 6,
  },
  emptyCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TC.ink,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  emptyCategorySub: {
    fontSize: 12,
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // 템플릿 미리보기
  previewRow: {
    paddingHorizontal: 20,
    gap: 14,
    paddingRight: 24,
  },
  previewItem: {
    alignItems: 'center',
    width: 170,
  },
  previewImage: {
    width: 170,
    height: 238,
    borderRadius: 12,
    backgroundColor: '#FBF9F3',
  },

  // 바텀 시트 모달
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E8EB',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: TC.inkMuted,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TC.bg,
  },
  sheetImageWrap: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  sheetImage: {
    width: width,
    height: width * (1400 / 1024),
    backgroundColor: '#FBF9F3',
  },

  // 시트 CTA 버튼
  sheetCtaWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: TC.ink,
    borderRadius: 14,
  },
  sheetCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  previewName: {
    fontSize: 13,
    fontWeight: '700',
    color: TC.ink,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  previewSub: {
    fontSize: 11,
    color: TC.inkMuted,
    letterSpacing: -0.2,
    marginTop: 2,
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
