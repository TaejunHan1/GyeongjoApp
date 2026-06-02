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
  Image,
  ImageBackground,
  Modal,
  Pressable,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TC, StaggerItem } from './guides/tossStyle';
import { A6_ASPECT_RATIO, MOBILE_TEMPLATES, TEMPLATE_CATEGORIES } from './studio/mobileTemplateConfigs';

const { width } = Dimensions.get('window');
const PREVIEW_CARD_WIDTH = 170;
const SHEET_PREVIEW_WIDTH = Math.min(width - 72, 340);
const PRINT_SIZE_GUIDE_IMAGE = require('../../../assets/studio/templates/floral/size.png');
const PAPER_INVITATION_HERO_IMAGE = require('../../../assets/studio/hero/paper-invitation-hero.png');
const PRINT_SIZE_GUIDE_WIDTH = width - 68;
const PRINT_SIZE_GUIDE_HEIGHT = PRINT_SIZE_GUIDE_WIDTH * (1086 / 1448);

function TemplatePreviewCard({ template, selectedSide, onSelectSide, onOpen }) {
  const hasBackPreview = !!template.backPreview;
  const flip = useRef(new Animated.Value(selectedSide === 'back' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(flip, {
      toValue: selectedSide === 'back' ? 1 : 0,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [flip, selectedSide]);

  const frontRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity
      style={s.previewItem}
      activeOpacity={0.85}
      onPress={onOpen}
    >
      <View style={s.previewFlipStage}>
        <Animated.View
          style={[
            s.previewFlipFace,
            {
              transform: [{ perspective: 900 }, { rotateY: frontRotate }],
            },
          ]}
        >
          <Image
            source={template.preview}
            style={s.previewImage}
            resizeMode="cover"
          />
        </Animated.View>
        {hasBackPreview && (
          <Animated.View
            style={[
              s.previewFlipFace,
              {
                transform: [{ perspective: 900 }, { rotateY: backRotate }],
              },
            ]}
          >
            <Image
              source={template.backPreview}
              style={s.previewImage}
              resizeMode="cover"
            />
          </Animated.View>
        )}
        <View style={s.previewOpenBadge} pointerEvents="none">
          <Ionicons name="expand-outline" size={13} color="#fff" />
          <Text style={s.previewOpenBadgeText}>크게 보기</Text>
        </View>
      </View>
      {hasBackPreview && (
        <View style={s.sideToggle} pointerEvents="box-none">
          {[
            { id: 'front', label: '앞면' },
            { id: 'back', label: '뒷면' },
          ].map((side) => {
            const isSelected = selectedSide === side.id;
            return (
              <Pressable
                key={side.id}
                hitSlop={6}
                style={[s.sideToggleButton, isSelected && s.sideToggleButtonActive]}
                onPress={(event) => {
                  event?.stopPropagation?.();
                  onSelectSide(side.id);
                }}
              >
                <Text style={[s.sideToggleText, isSelected && s.sideToggleTextActive]}>
                  {side.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <Text style={s.previewName}>{template.name}</Text>
      <Text style={s.previewSub}>{template.subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function BenefitsScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [heroFloat] = useState(new Animated.Value(0));
  const [activeCategory, setActiveCategory] = useState('minimal');
  const [zoomTemplate, setZoomTemplate] = useState(null); // 바텀 시트 모달
  const [templatePreviewSides, setTemplatePreviewSides] = useState({});
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
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

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.headerTitle}>스튜디오</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={s.headerIconBtn}
          onPress={() => navigation.navigate('SavedInvitations')}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="bookmark-outline" size={20} color={TC.ink} />
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
              <ImageBackground
                source={PAPER_INVITATION_HERO_IMAGE}
                style={s.heroImageBg}
                imageStyle={s.heroImage}
                resizeMode="cover"
              >
                <View style={s.heroTextScrim}>
                  <Text style={s.heroTitle}>종이 청첩장{'\n'}디자이너</Text>
                  <Text style={s.heroSub}>
                    수채화 꽃·잎으로 꾸민 나만의 종이 청첩장{'\n'}
                    PDF로 받아 원하는 인쇄소에 맡기세요
                  </Text>
                </View>
              </ImageBackground>
            </Animated.View>
          </View>
        </StaggerItem>

        {/* 템플릿 미리보기 (카테고리 + 가로 스크롤) */}
        <StaggerItem delay={80}>
          <View style={s.previewHead}>
            <View>
              <Text style={s.sectionLabel}>미리 보는 템플릿</Text>
              <Text style={s.previewLead}>카드를 눌러 크게 보고 선택하세요</Text>
            </View>
            <Text style={s.previewHint}>
              {MOBILE_TEMPLATES.filter((t) => t.category === activeCategory).length}종
            </Text>
          </View>

          <View style={s.previewSizeGuide}>
            <Pressable
              style={s.previewSizeGuideHeader}
              onPress={() => setIsSizeGuideOpen((prev) => !prev)}
            >
              <View style={s.a6Paper}>
                <Text style={s.a6Label}>A6</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.a6GuideTitle}>실제 인쇄 사이즈</Text>
                <Text style={s.a6GuideSub}>105 × 148 mm 기준으로 제작돼요</Text>
              </View>
              <View style={s.sizeGuideAction}>
                <Text style={s.sizeGuideActionText}>{isSizeGuideOpen ? '접기' : '보기'}</Text>
                <Ionicons
                  name={isSizeGuideOpen ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={TC.inkMuted}
                />
              </View>
            </Pressable>
            {isSizeGuideOpen && (
              <Image
                source={PRINT_SIZE_GUIDE_IMAGE}
                style={s.previewSizeGuideImage}
                resizeMode="contain"
              />
            )}
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
                (t) => {
                  const hasBackPreview = !!t.backPreview;
                  const selectedSide = hasBackPreview ? templatePreviewSides[t.id] || 'front' : 'front';

                  return (
                    <TemplatePreviewCard
                      key={t.id}
                      template={t}
                      selectedSide={selectedSide}
                      onOpen={() => openZoom(t)}
                      onSelectSide={(side) => {
                        setTemplatePreviewSides((prev) => ({
                          ...prev,
                          [t.id]: side,
                        }));
                      }}
                    />
                  );
                }
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

        {/* 진행 과정 (3 step) */}
        <StaggerItem delay={160}>
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

                {/* 이미지 — 시트가 길면 스크롤 */}
                <ScrollView
                  style={{ flexGrow: 0 }}
                  contentContainerStyle={{ paddingBottom: 8 }}
                  showsVerticalScrollIndicator={false}
                >
                  {zoomTemplate.backPreview ? (
                    <View style={s.sheetSpreadWrap}>
                      <View style={s.sheetSideCard}>
                        <Text style={s.sheetSideLabel}>앞면</Text>
                        <Image
                          source={zoomTemplate.preview}
                          style={s.sheetSideImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={s.sheetSideCard}>
                        <Text style={s.sheetSideLabel}>뒷면</Text>
                        <Image
                          source={zoomTemplate.backPreview}
                          style={s.sheetSideImage}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={s.sheetImageWrap}>
                      <Image
                        source={zoomTemplate.preview}
                        style={s.sheetImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                </ScrollView>

                {/* CTA — 이 템플릿으로 만들기 */}
                <View style={s.sheetCtaWrap}>
                  <Text style={s.sheetCtaHint}>앞면과 뒷면을 확인한 뒤 제작을 시작해요</Text>
                  <TouchableOpacity
                    style={s.sheetCta}
                    activeOpacity={0.85}
                    onPress={() => {
                      const t = zoomTemplate;
                      closeZoom();
                      setTimeout(() => {
                        navigation.navigate('PaperInvitationForm', { template: t });
                      }, 260);
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={s.sheetCtaText}>이 템플릿으로 종이 청첩장 만들기</Text>
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
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  // ═══ HERO 카드 ═══
  heroWrap: { paddingHorizontal: 20, paddingTop: 16 },
  heroCard: {
    borderRadius: 24,
    minHeight: 210,
    overflow: 'hidden',
    backgroundColor: '#F8F1E7',
  },
  heroImageBg: {
    minHeight: 210,
    justifyContent: 'center',
  },
  heroImage: {
    borderRadius: 24,
  },
  heroTextScrim: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 26,
    backgroundColor: 'rgba(255, 252, 246, 0.42)',
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
  previewLead: {
    fontSize: 12,
    color: TC.ink,
    fontWeight: '700',
    letterSpacing: -0.2,
    paddingHorizontal: 20,
    marginTop: -6,
  },
  previewSizeGuide: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#F8F6F2',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8E2D8',
    overflow: 'hidden',
  },
  previewSizeGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sizeGuideAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 8,
  },
  sizeGuideActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  previewSizeGuideImage: {
    width: PRINT_SIZE_GUIDE_WIDTH,
    height: PRINT_SIZE_GUIDE_HEIGHT,
    alignSelf: 'center',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
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
    width: PREVIEW_CARD_WIDTH,
  },
  previewFlipStage: {
    width: PREVIEW_CARD_WIDTH,
    height: PREVIEW_CARD_WIDTH * A6_ASPECT_RATIO,
  },
  previewFlipFace: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
  },
  previewImage: {
    width: PREVIEW_CARD_WIDTH,
    height: PREVIEW_CARD_WIDTH * A6_ASPECT_RATIO,
    borderRadius: 12,
    backgroundColor: '#FBF9F3',
  },
  previewOpenBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  previewOpenBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sideToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    padding: 2,
    borderRadius: 999,
    backgroundColor: '#F1F1F1',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E1E1E1',
  },
  sideToggleButton: {
    minWidth: 42,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 9,
  },
  sideToggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sideToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  sideToggleTextActive: {
    color: TC.ink,
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
    maxHeight: '92%',
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
    width: SHEET_PREVIEW_WIDTH,
    height: SHEET_PREVIEW_WIDTH * A6_ASPECT_RATIO,
    borderRadius: 12,
    backgroundColor: '#FBF9F3',
  },
  sheetSpreadWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 20,
  },
  sheetSideCard: {
    alignItems: 'center',
  },
  sheetSideImage: {
    width: SHEET_PREVIEW_WIDTH,
    height: SHEET_PREVIEW_WIDTH * A6_ASPECT_RATIO,
    borderRadius: 12,
    backgroundColor: '#FBF9F3',
  },
  sheetSideLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  a6Guide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 2,
  },
  a6Paper: {
    width: 44,
    height: 44 * A6_ASPECT_RATIO,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  a6Label: {
    fontSize: 11,
    fontWeight: '800',
    color: TC.inkMuted,
  },
  a6GuideTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.2,
  },
  a6GuideSub: {
    fontSize: 11,
    color: TC.inkMuted,
    letterSpacing: -0.2,
    marginTop: 2,
    lineHeight: 16,
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
  sheetCtaHint: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    color: TC.inkMuted,
    textAlign: 'center',
    letterSpacing: -0.2,
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
});
