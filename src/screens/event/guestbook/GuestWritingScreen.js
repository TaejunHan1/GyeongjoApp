// src/screens/event/guestbook/GuestWritingScreen.js
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTutorial } from '../../../contexts/TutorialContext';
import {
  getGuestbookPaperPurchaseState,
  purchaseGuestbookPaperTemplate,
} from '../../../lib/guestbookPaperCredit';
import {
  GUESTBOOK_EVENT_UNLOCK_COST,
  getGuestbookEventAccessState,
  unlockGuestbookEvent,
} from '../../../lib/guestbookEventCredit';

const JEONGDAM_LOGO = require('../../../../assets/images/jeongdamlogonobackground.png');
const DIGITAL_INK_LANGUAGE = 'ko';

// Digital Ink Recognition — dev client 빌드에서만 동작
let DigitalInk = null;
try {
  DigitalInk = require('digital-ink-recognition');
} catch (_) {}

const AnimatedPath = Animated.createAnimatedComponent(Path);

const INACTIVITY_MS = 5000;

// 웹 버전과 동일한 경로 사용 (viewBox 0 0 250 120 기준)
// strokeDasharray=200 통일 — 모든 획이 200 미만이므로 정상 동작
const HINT_STROKES = [
  // ── 홍 ──
  { d: 'M 45 20 L 45 25' },                                         // ㅎ 머리 (세로 짧은 획)
  { d: 'M 30 35 L 60 35' },                                         // ㅎ 가로줄
  { d: 'M 45 44 A 8 8 0 1 1 45 60 A 8 8 0 1 1 45 44' },           // ㅎ 동그라미
  { d: 'M 45 66 L 45 76' },                                         // ㅗ 세로줄 (위→아래)
  { d: 'M 25 76 L 65 76' },                                         // ㅗ 가로줄
  { d: 'M 45 84 A 10 10 0 1 1 45 104 A 10 10 0 1 1 45 84' },      // ㅇ 받침
  // ── 길 ──
  { d: 'M 100 28 L 125 28 L 125 55' },                             // ㄱ (가로→오른 세로)
  { d: 'M 142 22 L 142 65' },                                       // ㅣ
  { d: 'M 102 75 L 138 75 L 138 86' },                             // ㄹ 위
  { d: 'M 102 86 L 138 86' },                                       // ㄹ 중간
  { d: 'M 102 86 L 102 99 L 142 99' },                             // ㄹ 아래
  // ── 동 ──
  { d: 'M 185 28 L 215 28' },                                       // ㄷ 위 가로
  { d: 'M 185 28 L 185 55 L 215 55' },                             // ㄷ 왼 세로 + 아래 가로
  { d: 'M 200 64 L 200 74' },                                       // ㅗ 세로
  { d: 'M 175 74 L 225 74' },                                       // ㅗ 가로
  { d: 'M 200 84 A 10 10 0 1 1 200 104 A 10 10 0 1 1 200 84' },   // ㅇ 받침
];

const PAPER_TEMPLATES = [
  {
    id: 'jd-floral-corner',
    name: 'Floral Corner',
    subtitle: '플로럴 코너',
    price: 0,
    bg: '#F9F3E8',
    ink: '#221C16',
    line: '#D6BE92',
    accent: '#B99B68',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/jd-floral-corner.png'),
  },
  {
    id: 'jd-arch-garden',
    name: 'Arch Garden',
    subtitle: '아치 가든',
    price: 4,
    bg: '#F7F1E8',
    ink: '#211B16',
    line: '#D5C09B',
    accent: '#AF9063',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/jd-arch-garden.png'),
  },
  {
    id: 'jd-vellum-wave',
    name: 'Vellum Wave',
    subtitle: '벨럼 웨이브',
    price: 5,
    bg: '#F8F0E4',
    ink: '#211B15',
    line: '#D8BE8C',
    accent: '#B99762',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/jd-vellum-wave.png'),
  },
  {
    id: 'jd-sage-botanical',
    name: 'Sage Botanical',
    subtitle: '세이지 보태니컬',
    price: 5,
    bg: '#F7F3EA',
    ink: '#211B15',
    line: '#C9C0A8',
    accent: '#A59676',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/jd-sage-botanical.png'),
  },
  {
    id: 'jd-modern-paper',
    name: 'Modern Paper',
    subtitle: '모던 페이퍼',
    price: 5,
    bg: '#F8F3EA',
    ink: '#211B15',
    line: '#D3BE94',
    accent: '#B49562',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/jd-modern-paper.png'),
  },
  {
    id: 'ivory-line',
    name: 'Ivory Line',
    subtitle: '아이보리 라인',
    price: 0,
    bg: '#FDF8EF',
    ink: '#1A1209',
    line: '#E7DCC8',
    accent: '#B89A68',
    pattern: 'line',
    image: require('../../../../assets/guestbook/paper-templates/ivory-line.png'),
  },
  {
    id: 'hanji-calm',
    name: 'Hanji Sign',
    subtitle: '하객 서명 한지',
    price: 4,
    bg: '#F3EEE4',
    ink: '#241D16',
    line: '#D4C8B7',
    accent: '#9B8566',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/hanji-calm.png'),
  },
  {
    id: 'hanji-border',
    name: 'Hanji Border',
    subtitle: '라운드 한지 보더',
    price: 3,
    bg: '#F5EFE4',
    ink: '#241D16',
    line: '#D8CCBA',
    accent: '#9A8262',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/hanji-border.png'),
    brandOffset: { top: 84, right: 72, previewTop: 16, previewRight: 16 },
  },
  {
    id: 'ivory-guestbook',
    name: 'Guestbook Ivory',
    subtitle: '프리미엄 아이보리',
    price: 4,
    bg: '#FBF7EF',
    ink: '#211B15',
    line: '#DDD2C0',
    accent: '#9B8664',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/ivory-guestbook.png'),
  },
  {
    id: 'ink-wash',
    name: 'Ink Wash',
    subtitle: '은은한 수묵 한지',
    price: 5,
    bg: '#F2EDE3',
    ink: '#241D16',
    line: '#D3C6B4',
    accent: '#8C7354',
    pattern: 'blank',
    image: require('../../../../assets/guestbook/paper-templates/ink-wash.png'),
    brandOffset: { top: 14, previewTop: 6 },
  },
];

const getPaperTemplate = (id) =>
  PAPER_TEMPLATES.find((template) => template.id === id) || PAPER_TEMPLATES[0];

const normalizeRecognitionCandidates = (values = []) => {
  const blocked = new Set(['정성을담아서', '정담', 'jeongdam']);
  const seen = new Set();

  return values
    .flatMap((value) => String(value || '').split(/\n+/))
    .map((value) => value.replace(/\s+/g, '').replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z]/g, ''))
    .filter((value) => value.length >= 1 && value.length <= 20)
    .filter((value) => !blocked.has(value.toLowerCase()))
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
};

const countInkPoints = (strokes = []) =>
  strokes.reduce((sum, stroke) => sum + (Array.isArray(stroke) ? stroke.length : 0), 0);

const nowMs = () => {
  if (global.performance?.now) return global.performance.now();
  return Date.now();
};

const DEFAULT_OWNED_PAPER_IDS = PAPER_TEMPLATES
  .filter((template) => Number(template.price || 0) <= 0)
  .map((template) => template.id);

const getPatternPath = (template, width, height) => {
  if (template.pattern === 'line') {
    return Array.from({ length: Math.ceil(height / 60) })
      .map((_, i) => `M0,${(i + 1) * 60} L${width},${(i + 1) * 60}`)
      .join(' ');
  }
  if (template.pattern === 'grid') {
    const rows = Array.from({ length: Math.ceil(height / 54) })
      .map((_, i) => `M0,${(i + 1) * 54} L${width},${(i + 1) * 54}`)
      .join(' ');
    const cols = Array.from({ length: Math.ceil(width / 54) })
      .map((_, i) => `M${(i + 1) * 54},0 L${(i + 1) * 54},${height}`)
      .join(' ');
    return `${rows} ${cols}`;
  }
  if (template.pattern === 'archive') {
    return [
      `M${width * 0.08},${height * 0.16} L${width * 0.92},${height * 0.16}`,
      `M${width * 0.08},${height * 0.84} L${width * 0.92},${height * 0.84}`,
      `M${width * 0.5},${height * 0.24} L${width * 0.5},${height * 0.76}`,
    ].join(' ');
  }
  return '';
};

const renderPaperPattern = (template, width, height, preview = false) => {
  const patternPath = getPatternPath(template, width, height);
  if (template.pattern === 'blank') {
    return null;
  }
  if (template.pattern === 'dot') {
    const step = preview ? 12 : 44;
    const radius = preview ? 0.9 : 1.4;
    const dots = [];
    for (let y = step; y < height; y += step) {
      for (let x = step; x < width; x += step) {
        dots.push(`M${x},${y} m-${radius},0 a${radius},${radius} 0 1,0 ${radius * 2},0 a${radius},${radius} 0 1,0 -${radius * 2},0`);
      }
    }
    return (
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Path d={dots.join(' ')} fill={template.line} opacity={0.45} />
      </Svg>
    );
  }
  if (!patternPath) return null;
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Path
        d={patternPath}
        stroke={template.line}
        strokeWidth={preview ? 0.7 : 0.8}
        opacity={template.pattern === 'archive' ? 0.42 : 0.62}
        fill="none"
      />
    </Svg>
  );
};

const getBrandOffsetStyle = (template, preview = false) => {
  const offset = template?.brandOffset;
  if (!offset) return null;
  const style = {};
  const top = preview ? offset.previewTop : offset.top;
  const right = preview ? offset.previewRight : offset.right;
  if (top != null) style.top = top;
  if (right != null) style.right = right;
  return style;
};

const PaperBrandMark = ({ template, preview = false }) => (
  <View
    pointerEvents="none"
    style={[
      preview ? intro.brandMarkPreview : draw.brandMark,
      getBrandOffsetStyle(template, preview),
    ]}
  >
    <Image
      source={JEONGDAM_LOGO}
      style={preview ? intro.brandLogoPreview : draw.brandLogo}
      resizeMode="contain"
    />
    <Text style={preview ? intro.brandTaglinePreview : draw.brandTagline}>정성을 담아서</Text>
  </View>
);

const PaperLivePreview = ({ template, width }) => {
  const previewHeight = 154;
  const content = (
    <>
      {!template.image && renderPaperPattern(template, width - 20, previewHeight, true)}
      <View style={intro.livePreviewShade} />
      <PaperBrandMark template={template} preview />
      <Text style={[intro.livePreviewName, { color: template.ink }]}>홍길동</Text>
    </>
  );

  if (template.image) {
    return (
      <ImageBackground
        source={template.image}
        style={[intro.livePreview, { height: previewHeight, backgroundColor: template.bg }]}
        imageStyle={intro.livePreviewImage}
        resizeMode="cover"
      >
        {content}
      </ImageBackground>
    );
  }

  return (
    <View style={[intro.livePreview, { height: previewHeight, backgroundColor: template.bg }]}>
      {content}
    </View>
  );
};

const PaperSwatch = ({ template }) => {
  const swatchStyle = [intro.selectedSwatch, { backgroundColor: template.bg }];
  if (template.image) {
    return (
      <ImageBackground
        source={template.image}
        style={swatchStyle}
        imageStyle={intro.selectedSwatchImage}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={swatchStyle}>
      {renderPaperPattern(template, 44, 56, true)}
    </View>
  );
};

export default function GuestWritingScreen({ navigation, route }) {
  const { event, side = 'groom', paperTemplateId } = route.params;
  const sideLabel = side === 'groom' ? '신랑측' : '신부측';
  const sideColor = side === 'groom' ? '#3B82F6' : '#EC4899';
  const sideCode = side === 'groom' ? 'GROOM' : 'BRIDE';
  const initialPaperId = PAPER_TEMPLATES.some((template) => template.id === paperTemplateId)
    ? paperTemplateId
    : PAPER_TEMPLATES[0].id;

  useKeepAwake();

  // ── 튜토리얼 ──
  const { activeTutorial, step: tutorialStep, registerTarget, advanceStep: tutorialAdvance, pauseTutorial } = useTutorial();
  const startBtnRef = useRef(null);

  // 상태: 'intro' | 'drawing'
  const [mode, setMode] = useState('intro');
  const [screenSize, setScreenSize] = useState(Dimensions.get('window'));
  const [selectedPaperId, setSelectedPaperId] = useState(initialPaperId);
  const [ownedPaperIds, setOwnedPaperIds] = useState(DEFAULT_OWNED_PAPER_IDS);
  const [creditBalance, setCreditBalance] = useState(null);
  const [eventAccessUnlocked, setEventAccessUnlocked] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(true);
  const selectedPaper = getPaperTemplate(selectedPaperId);
  const ownedPaperIdSet = useMemo(() => new Set([...DEFAULT_OWNED_PAPER_IDS, ...ownedPaperIds]), [ownedPaperIds]);
  const selectedPaperOwned = Number(selectedPaper.price || 0) <= 0 || ownedPaperIdSet.has(selectedPaper.id);
  const ownedPaperTemplates = useMemo(
    () => PAPER_TEMPLATES.filter((template) => Number(template.price || 0) <= 0 || ownedPaperIdSet.has(template.id)),
    [ownedPaperIdSet]
  );

  const viewShotRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Digital Ink용 원시 좌표 수집 (state 아닌 ref — 렌더링 불필요)
  const inkPointsRef = useRef([]);    // 현재 획의 포인트 [{x, y, t}]
  const inkStrokesRef = useRef([]);   // 완료된 모든 획
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const hideTimerRef = useRef(null);

  // 힌트 획 애니메이션
  const hintAnims = useRef(HINT_STROKES.map(() => new Animated.Value(0))).current;
  const hintOpacity = useRef(new Animated.Value(1)).current;
  // 팜 리젝션
  const hasStrokesRef = useRef(false);
  const drawingTouchId = useRef(null);
  // 아직 어느 터치가 펜인지 결정 못한 후보들 { id → {x, y} }
  const pendingTouches = useRef(new Map());

  const hasStrokes = strokes.length > 0 || currentPath.length > 0;
  hasStrokesRef.current = hasStrokes;

  // 튜토리얼: 방명록 시작하기 버튼 위치 반복 측정
  useEffect(() => {
    if (activeTutorial !== 'myEvents') return;
    if (tutorialStep?.id !== 'me_guest_writing_start') return;
    if (mode !== 'intro') return;
    const measure = () => {
      if (startBtnRef.current?.measureInWindow) {
        startBtnRef.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            registerTarget('guestWritingStartBtn', { x, y, width, height });
          }
        });
      }
    };
    measure();
    const id = setInterval(measure, 500);
    return () => clearInterval(id);
  }, [activeTutorial, tutorialStep?.id, mode, registerTarget]);

  const loadPaperStoreState = useCallback(async () => {
    setStoreLoading(true);
    try {
      const [result, accessResult] = await Promise.all([
        getGuestbookPaperPurchaseState(),
        getGuestbookEventAccessState({ eventId: event?.id }),
      ]);
      const nextOwned = new Set(DEFAULT_OWNED_PAPER_IDS);
      if (result?.success) {
        (result.templateIds || []).forEach((id) => nextOwned.add(id));
        setCreditBalance(result.balance ?? 0);
      }
      if (accessResult?.success) {
        setEventAccessUnlocked(!!accessResult.unlocked);
        setCreditBalance(accessResult.balance ?? result?.balance ?? 0);
      }
      setOwnedPaperIds(Array.from(nextOwned));
    } catch (e) {
      console.warn('[GuestbookPaper] 구매 상태 로드 실패:', e);
      setOwnedPaperIds(DEFAULT_OWNED_PAPER_IDS);
    } finally {
      setStoreLoading(false);
    }
  }, [event?.id]);

  useEffect(() => {
    loadPaperStoreState();
  }, [loadPaperStoreState]);

  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', loadPaperStoreState);
    return unsubscribe;
  }, [navigation, loadPaperStoreState]);

  // 획 하나씩 그려지는 힌트 애니메이션 (웹 버전과 동일한 로직)
  useEffect(() => {
    if (hasStrokes || mode !== 'drawing') {
      hintAnims.forEach(v => v.stopAnimation());
      hintOpacity.stopAnimation();
      return;
    }

    const run = () => {
      hintAnims.forEach(v => v.setValue(0));
      hintOpacity.setValue(1);

      const seq = [];
      HINT_STROKES.forEach((_, i) => {
        // 각 획: 280ms 그리기 + 70ms 간격 (웹의 0.3s + 0.05s 갭)
        seq.push(Animated.timing(hintAnims[i], {
          toValue: 1,
          duration: 280,
          useNativeDriver: false,
        }));
        seq.push(Animated.delay(70));
      });
      seq.push(Animated.delay(1800));   // 완성 후 잠시 유지
      seq.push(Animated.timing(hintOpacity, { toValue: 0, duration: 600, useNativeDriver: false }));
      seq.push(Animated.delay(500));

      Animated.sequence(seq).start(({ finished }) => { if (finished) run(); });
    };

    run();
    return () => {
      hintAnims.forEach(v => v.stopAnimation());
      hintOpacity.stopAnimation();
    };
  }, [hasStrokes, mode]);

  // 획이 있으면 버튼 항상 완전히 표시, 없어지면 타이머 허용
  useEffect(() => {
    if (hasStrokes) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [hasStrokes]);

  // 화면 크기 변경 감지 (회전 후)
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenSize(window);
    });
    return () => sub?.remove();
  }, []);

  // intro 모드일 때 세로 복구 (GuestConfirm에서 돌아올 때도 처리)
  useEffect(() => {
    if (mode === 'intro') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
  }, [mode]);

  // 언마운트 시 세로 복구
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // ── 인트로 → 드로잉 진입 ──────────────────────
  const enterDrawing = async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch (e) {
      console.warn('Orientation lock failed:', e);
    }
    setMode('drawing');
    resetInactivityTimer();
    // Android: Digital Ink 모델과 인식기를 미리 준비해서 완료 시 대기 시간을 줄인다.
    if (Platform.OS === 'android' && DigitalInk) {
      const prepareRecognizer = DigitalInk.warmUpRecognizer || DigitalInk.downloadModel;
      prepareRecognizer(DIGITAL_INK_LANGUAGE).catch(() => {});
    }
  };

  // ── 드로잉 종료 → 세로 복귀 ──────────────────
  const exitDrawing = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    clearCanvas();
    setMode('intro');
  };

  // ── 10초 무입력 자동 초기화 ──────────────────
  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => clearCanvas(), INACTIVITY_MS);
  }, []);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setCurrentPath('');
    inkPointsRef.current = [];
    inkStrokesRef.current = [];
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // ── 컨트롤 버튼 자동 숨김 ────────────────────
  const showControls = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    hideTimerRef.current = setTimeout(() => {
      // 획이 그려져 있으면 버튼 숨기지 않음
      if (!hasStrokesRef.current) {
        Animated.timing(controlsOpacity, { toValue: 0.15, duration: 600, useNativeDriver: true }).start();
      }
    }, 3000);
  }, [controlsOpacity]);

  const handlePurchaseSelected = useCallback(async () => {
    if (selectedPaperOwned) return true;

    const price = Number(selectedPaper.price || 0);
    setPurchaseLoading(true);
    try {
      const result = await purchaseGuestbookPaperTemplate({
        templateId: selectedPaper.id,
        price,
        eventId: event?.id,
      });

      if (result?.success) {
        setOwnedPaperIds((prev) => Array.from(new Set([...DEFAULT_OWNED_PAPER_IDS, ...prev, selectedPaper.id])));
        setCreditBalance(result.balance ?? 0);
        Alert.alert(
          result.alreadyOwned ? '이미 구매한 배경' : '구매 완료',
          `${selectedPaper.subtitle} 배경을 사용할 수 있어요.\n남은 크레딧: ${Number(result.balance ?? 0).toLocaleString('ko-KR')}건`,
          [{ text: '확인' }]
        );
        return true;
      }

      if (result?.error === 'insufficient_balance') {
        setCreditBalance(result.balance ?? 0);
        Alert.alert(
          '크레딧 부족',
          `${selectedPaper.subtitle} 배경은 ${price}크레딧이 필요해요.\n현재 잔액: ${Number(result.balance ?? 0).toLocaleString('ko-KR')}건\n충전 후 다시 구매해주세요.`,
          [
            { text: '닫기', style: 'cancel' },
            { text: '충전하러 가기', onPress: () => navigation.navigate('Credit') },
          ]
        );
        return false;
      }

      Alert.alert(
        '구매 실패',
        result?.error === 'setup_required'
          ? '배경 구매 시스템 설정이 아직 적용되지 않았어요.\n관리자에게 설정을 요청해주세요.'
          : '구매 처리 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
      return false;
    } catch (e) {
      console.warn('[GuestbookPaper] 구매 실패:', e);
      Alert.alert('구매 실패', '구매 처리 중 오류가 발생했습니다.', [{ text: '확인' }]);
      return false;
    } finally {
      setPurchaseLoading(false);
    }
  }, [event?.id, navigation, selectedPaper, selectedPaperOwned]);

  const startGuestbookDrawing = useCallback(() => {
    if (tutorialStep?.id === 'me_guest_writing_start') {
      tutorialAdvance();
      pauseTutorial(); // 서명패드에서는 오버레이 숨김 → GuestConfirm에서 재개
    }
    enterDrawing();
  }, [enterDrawing, pauseTutorial, tutorialAdvance, tutorialStep?.id]);

  const handleUnlockAndStart = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const result = await unlockGuestbookEvent({
        eventId: event?.id,
        price: GUESTBOOK_EVENT_UNLOCK_COST,
      });

      if (result?.success) {
        setEventAccessUnlocked(true);
        setCreditBalance(result.balance ?? 0);
        startGuestbookDrawing();
        return;
      }

      if (result?.error === 'insufficient_balance') {
        setCreditBalance(result.balance ?? 0);
        Alert.alert(
          '크레딧 부족',
          `방명록 시작에는 ${GUESTBOOK_EVENT_UNLOCK_COST.toLocaleString('ko-KR')}크레딧이 필요해요.\n현재 잔액: ${Number(result.balance ?? 0).toLocaleString('ko-KR')}크레딧`,
          [
            { text: '닫기', style: 'cancel' },
            { text: '충전하러 가기', onPress: () => navigation.navigate('Credit') },
          ]
        );
        return;
      }

      Alert.alert(
        '이용권 설정 필요',
        result?.error === 'setup_required'
          ? '방명록 이용권 시스템 설정이 아직 적용되지 않았어요.\n관리자에게 설정을 요청해주세요.'
          : '방명록 이용권 처리 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    } catch (e) {
      console.warn('[GuestbookEvent] 이용권 처리 실패:', e);
      Alert.alert('오류', '방명록 이용권 처리 중 오류가 발생했습니다.', [{ text: '확인' }]);
    } finally {
      setPurchaseLoading(false);
    }
  }, [event?.id, navigation, startGuestbookDrawing]);

  const handleStartPress = useCallback(async () => {
    if (!selectedPaperOwned) {
      await handlePurchaseSelected();
      return;
    }

    if (!eventAccessUnlocked) {
      Alert.alert(
        '방명록 시작',
        `${GUESTBOOK_EVENT_UNLOCK_COST.toLocaleString('ko-KR')}크레딧이 차감됩니다.\n행사당 최초 1회만 차감되며, 신랑측/신부측 접수대를 모두 사용할 수 있어요.`,
        [
          { text: '취소', style: 'cancel' },
          { text: '시작하기', onPress: handleUnlockAndStart },
        ]
      );
      return;
    }

    startGuestbookDrawing();
  }, [eventAccessUnlocked, handlePurchaseSelected, handleUnlockAndStart, selectedPaperOwned, startGuestbookDrawing]);

  // ── PanResponder (팜 리젝션: 움직이는 터치 = 펜) ─
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        resetInactivityTimer();
        showControls();

        const touches = evt.nativeEvent.touches;

        // ① iOS Apple Pencil: OS가 이미 구분해줌 → 즉시 확정
        const stylusTouch = touches.find((t) => t.touchType === 'stylus');
        if (stylusTouch) {
          drawingTouchId.current = stylusTouch.identifier;
          pendingTouches.current.clear();
          inkPointsRef.current = [{ x: stylusTouch.locationX, y: stylusTouch.locationY, t: Date.now() }];
          setCurrentPath(
            `M${stylusTouch.locationX.toFixed(1)},${stylusTouch.locationY.toFixed(1)}`
          );
          return;
        }

        // ② 이미 그리는 중 → 새 터치(손바닥)는 무시
        if (drawingTouchId.current !== null) return;

        // ③ 터치가 1개뿐 → 즉시 그리기 시작 (지연 없음)
        if (touches.length === 1) {
          const t = touches[0];
          drawingTouchId.current = t.identifier;
          pendingTouches.current.clear();
          inkPointsRef.current = [{ x: t.locationX, y: t.locationY, t: Date.now() }];
          setCurrentPath(`M${t.locationX.toFixed(1)},${t.locationY.toFixed(1)}`);
          return;
        }

        // ④ 터치가 여러 개 (손바닥 + 펜 동시 감지) → 일단 후보로 등록
        //    onMove에서 "실제로 움직이는 터치"를 펜으로 확정
        pendingTouches.current.clear();
        for (const t of touches) {
          pendingTouches.current.set(t.identifier, {
            x: t.locationX,
            y: t.locationY,
          });
        }
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;

        // 펜이 이미 확정된 경우 → 해당 터치만 추적
        if (drawingTouchId.current !== null) {
          const target = touches.find(
            (t) => t.identifier === drawingTouchId.current
          );
          if (!target) return;
          inkPointsRef.current.push({ x: target.locationX, y: target.locationY, t: Date.now() });
          setCurrentPath(
            (prev) => `${prev} L${target.locationX.toFixed(1)},${target.locationY.toFixed(1)}`
          );
          return;
        }

        // 후보 중 "가장 많이 움직인 터치"를 펜으로 확정
        // 손바닥은 거의 안 움직이고, 펜은 글자를 쓰므로 빠르게 이동
        const PEN_MOVE_THRESHOLD = 6; // px — 이 이상 움직인 터치를 펜으로 판단
        let bestId = null;
        let maxDist = PEN_MOVE_THRESHOLD;

        for (const t of touches) {
          const origin = pendingTouches.current.get(t.identifier);
          if (!origin) continue;
          const dist = Math.hypot(
            t.locationX - origin.x,
            t.locationY - origin.y
          );
          if (dist > maxDist) {
            maxDist = dist;
            bestId = t.identifier;
          }
        }

        if (bestId !== null) {
          // 펜 확정: 시작 위치 → 현재 위치로 경로 구성
          const origin = pendingTouches.current.get(bestId);
          const penTouch = touches.find((t) => t.identifier === bestId);
          drawingTouchId.current = bestId;
          pendingTouches.current.clear();
          inkPointsRef.current = [
            { x: origin.x, y: origin.y, t: Date.now() - 16 },
            { x: penTouch.locationX, y: penTouch.locationY, t: Date.now() },
          ];
          setCurrentPath(
            `M${origin.x.toFixed(1)},${origin.y.toFixed(1)}` +
            ` L${penTouch.locationX.toFixed(1)},${penTouch.locationY.toFixed(1)}`
          );
        }
      },

      onPanResponderRelease: (evt) => {
        const changed = evt.nativeEvent.changedTouches ?? [evt.nativeEvent];
        const isOurs = changed.some(
          (t) => t.identifier === drawingTouchId.current
        );

        if (isOurs) {
          setCurrentPath((prev) => {
            if (prev.length > 0) setStrokes((s) => [...s, prev]);
            return '';
          });
          if (inkPointsRef.current.length > 0) {
            inkStrokesRef.current.push([...inkPointsRef.current]);
            inkPointsRef.current = [];
          }
          drawingTouchId.current = null;
          pendingTouches.current.clear();
        } else {
          // 손바닥이 먼저 떼진 경우 — 후보 목록에서도 제거
          for (const t of changed) {
            pendingTouches.current.delete(t.identifier);
          }
        }
      },

      onPanResponderTerminate: () => {
        setCurrentPath((prev) => {
          if (prev.length > 0) setStrokes((s) => [...s, prev]);
          return '';
        });
        if (inkPointsRef.current.length > 0) {
          inkStrokesRef.current.push([...inkPointsRef.current]);
          inkPointsRef.current = [];
        }
        drawingTouchId.current = null;
        pendingTouches.current.clear();
      },
    })
  ).current;

  // ── 완료 ─────────────────────────────────────
  const handleDone = async () => {
    if (!hasStrokes) {
      Alert.alert('알림', '이름을 먼저 적어주세요.');
      return;
    }
    setIsProcessing(true);
    try {
      const doneStartedAt = nowMs();
      const strokesSnapshot = inkStrokesRef.current.map((stroke) => [...stroke]);
      const createRecognitionDebug = () => ({
        platform: Platform.OS,
        moduleLoaded: !!DigitalInk,
        language: DIGITAL_INK_LANGUAGE,
        strokeCount: strokesSnapshot.length,
        pointCount: countInkPoints(strokesSnapshot),
        stage: DigitalInk ? 'READY' : 'JS_MODULE_NOT_LOADED',
        rawCandidates: [],
        normalizedCandidates: [],
      });

      const recognizeHandwriting = async () => {
        const startedAt = nowMs();
        let inkCandidates = [];
        let recognitionDebug = createRecognitionDebug();

        if (DigitalInk) {
          try {
            if (strokesSnapshot.length > 0) {
              inkCandidates = await DigitalInk.recognize(strokesSnapshot, DIGITAL_INK_LANGUAGE);
              recognitionDebug.stage = 'RECOGNIZE';
              recognitionDebug.rawCandidates = inkCandidates;
              if (inkCandidates.length === 0 && DigitalInk.recognizeWithDebug) {
                const debugResult = await DigitalInk.recognizeWithDebug(strokesSnapshot, DIGITAL_INK_LANGUAGE);
                recognitionDebug = {
                  ...recognitionDebug,
                  ...debugResult,
                  rawCandidates: debugResult?.candidates || [],
                };
                inkCandidates = debugResult?.candidates || [];
              }
            } else {
              recognitionDebug.stage = 'NO_STROKES_JS';
            }
          } catch (e) {
            recognitionDebug.stage = 'JS_EXCEPTION';
            recognitionDebug.error = e?.message || String(e);
          }

          inkCandidates = normalizeRecognitionCandidates(inkCandidates);
          recognitionDebug.normalizedCandidates = inkCandidates;
        }

        recognitionDebug.timing = {
          ...(recognitionDebug.timing || {}),
          recognizeMs: Math.round(nowMs() - startedAt),
        };
        return { inkCandidates, recognitionDebug };
      };

      const captureHandwriting = async () => {
        const startedAt = nowMs();
        const uri = await viewShotRef.current.capture();
        return {
          uri,
          captureMs: Math.round(nowMs() - startedAt),
        };
      };

      const [uri, recognitionResult] = await Promise.all([
        captureHandwriting(),
        recognizeHandwriting(),
      ]);
      const { inkCandidates, recognitionDebug } = recognitionResult;
      const timing = {
        ...(recognitionDebug?.timing || {}),
        captureMs: uri.captureMs,
        totalBeforeNavigateMs: Math.round(nowMs() - doneStartedAt),
      };

      clearCanvas();
      navigation.navigate('GuestConfirm', {
        event,
        handwritingUri: uri.uri,
        side,
        inkCandidates,
        recognitionDebug: {
          ...recognitionDebug,
          timing,
        },
        paperTemplateId: selectedPaperId,
      });
    } catch (err) {
      console.error('Capture error:', err);
      Alert.alert('오류', '처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const { width: SW, height: SH } = screenSize;

  // ════════════════════════════════════════════
  // 인트로 화면
  // ════════════════════════════════════════════
  if (mode === 'intro') {
    const eventTitle =
      event?.event_type === 'wedding'
        ? `${event.groom_name || ''} ♥ ${event.bride_name || ''}`
        : event?.event_name || '경조사';
    const carouselCardWidth = Math.min(screenSize.width - 40, 360);
    const carouselGap = 12;
    const startButtonLabel = purchaseLoading
      ? '처리 중...'
      : storeLoading
        ? '이용 정보 확인 중...'
        : selectedPaperOwned
          ? eventAccessUnlocked
            ? '방명록 시작하기'
            : `${GUESTBOOK_EVENT_UNLOCK_COST.toLocaleString('ko-KR')}크레딧으로 방명록 시작하기`
          : `${selectedPaper.price}크레딧으로 구매하기`;

    return (
      <View style={intro.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* 헤더 */}
        <View style={intro.header}>
          <TouchableOpacity style={intro.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={intro.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={intro.headerTitle}>하객 접수</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={intro.body}>
          <View style={intro.eventBlock}>
            <View style={[intro.sidePill, { backgroundColor: sideColor + '14' }]}>
              <Text style={[intro.sidePillText, { color: sideColor }]}>{sideCode}</Text>
              <Text style={[intro.sideName, { color: sideColor }]}>{sideLabel}</Text>
            </View>
            <Text style={intro.eventName}>{eventTitle}</Text>
          </View>

          <View style={intro.sectionHeader}>
            <View>
              <Text style={intro.sectionTitle}>접수 배경 선택</Text>
              <Text style={intro.sectionSub}>축의대 화면에 표시될 종이 템플릿</Text>
            </View>
            <View style={intro.creditPill}>
              <Text style={intro.creditPillText}>
                {creditBalance == null ? '크레딧 -' : `잔액 ${Number(creditBalance).toLocaleString('ko-KR')}크레딧`}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            style={intro.templateScroller}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={intro.templateList}
            decelerationRate="fast"
            snapToInterval={carouselCardWidth + carouselGap}
            snapToAlignment="start"
            onMomentumScrollEnd={(e) => {
              const nextIndex = Math.max(
                0,
                Math.min(
                  PAPER_TEMPLATES.length - 1,
                  Math.round(e.nativeEvent.contentOffset.x / (carouselCardWidth + carouselGap))
                )
              );
              const nextTemplate = PAPER_TEMPLATES[nextIndex];
              if (nextTemplate) setSelectedPaperId(nextTemplate.id);
            }}
          >
            {PAPER_TEMPLATES.map((template) => {
              const selected = selectedPaperId === template.id;
              const owned = Number(template.price || 0) <= 0 || ownedPaperIdSet.has(template.id);
              return (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    intro.templateCard,
                    { width: carouselCardWidth },
                    selected && { borderColor: sideColor, backgroundColor: '#FFFFFF' },
                  ]}
                  onPress={() => setSelectedPaperId(template.id)}
                  activeOpacity={0.82}
                >
                  <PaperLivePreview template={template} width={carouselCardWidth - 20} />
                  <View style={intro.templateInfoRow}>
                    <View style={intro.templateMeta}>
                      <Text style={intro.templateName}>{template.name}</Text>
                      <Text style={intro.templateSub}>{template.subtitle}</Text>
                    </View>
                    <View style={[
                      intro.priceBadge,
                      owned ? intro.freeBadge : intro.paidBadge,
                    ]}>
                      <Text style={[
                        intro.priceBadgeText,
                        !owned && intro.paidBadgeText,
                      ]}>
                        {Number(template.price || 0) <= 0 ? '기본' : owned ? '보유중' : `${template.price} 크레딧`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={intro.selectedCard}>
            <PaperSwatch template={selectedPaper} />
            <View style={{ flex: 1 }}>
              <Text style={intro.selectedLabel}>선택한 배경</Text>
              <Text style={intro.selectedName}>{selectedPaper.name}</Text>
            </View>
            <Text style={intro.selectedPrice}>
              {selectedPaperOwned
                ? Number(selectedPaper.price || 0) <= 0 ? '기본' : '보유중'
                : `${selectedPaper.price} 크레딧 구매 필요`}
            </Text>
          </View>

          <View style={intro.ownedSection}>
            <View style={intro.ownedHeader}>
              <Text style={intro.ownedTitle}>보유한 배경</Text>
              <Text style={intro.ownedCount}>{storeLoading ? '확인 중' : `${ownedPaperTemplates.length}개`}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={intro.ownedList}
            >
              {ownedPaperTemplates.map((template) => {
                const selected = selectedPaperId === template.id;
                return (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      intro.ownedChip,
                      selected && { borderColor: sideColor, backgroundColor: sideColor + '0D' },
                    ]}
                    onPress={() => setSelectedPaperId(template.id)}
                    activeOpacity={0.82}
                  >
                    <PaperSwatch template={template} />
                    <View style={intro.ownedChipTextWrap}>
                      <Text style={intro.ownedChipName} numberOfLines={1}>{template.name}</Text>
                      <Text style={intro.ownedChipSub}>{Number(template.price || 0) <= 0 ? '기본' : '구매 완료'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* 하단 버튼 */}
        <View style={intro.footer}>
          {!storeLoading && (
            <View style={intro.accessNotice}>
              <View style={intro.accessNoticeIcon}>
                <Ionicons
                  name={eventAccessUnlocked ? 'checkmark-circle' : 'ticket-outline'}
                  size={17}
                  color={eventAccessUnlocked ? '#22C55E' : '#3182F6'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={intro.accessNoticeTitle}>
                  {eventAccessUnlocked
                    ? '이 행사는 방명록 이용권이 활성화됐어요'
                    : `방명록 시작 ${GUESTBOOK_EVENT_UNLOCK_COST.toLocaleString('ko-KR')}크레딧`}
                </Text>
                <Text style={intro.accessNoticeSub}>
                  {eventAccessUnlocked
                    ? '신랑측/신부측 접수대 모두 추가 차감 없이 사용할 수 있어요'
                    : selectedPaperOwned
                      ? '행사당 최초 1회만 차감되며, 양쪽 접수대를 모두 사용할 수 있어요'
                      : '배경 구매 후 행사 이용권을 활성화하면 양쪽 접수대를 모두 사용할 수 있어요'}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            ref={startBtnRef}
            style={[
              intro.startBtn,
              { backgroundColor: selectedPaperOwned && eventAccessUnlocked ? sideColor : '#191F28' },
              (purchaseLoading || storeLoading) && intro.startBtnDisabled,
            ]}
            onPress={handleStartPress}
            disabled={purchaseLoading || storeLoading}
            activeOpacity={0.85}
          >
            {purchaseLoading || storeLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={intro.startBtnText}>{startButtonLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════════
  // 드로잉 화면 (전체화면 가로)
  // ════════════════════════════════════════════
  const drawingContent = (
    <>
      {!selectedPaper.image && renderPaperPattern(selectedPaper, SW, SH)}

      <Svg style={StyleSheet.absoluteFill} width={SW} height={SH}>
        {/* 완료된 획 */}
        {strokes.map((d, i) => (
          <Path
            key={i}
            d={d}
            stroke={selectedPaper.ink}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {/* 현재 획 */}
        {currentPath.length > 0 && (
          <Path
            d={currentPath}
            stroke={selectedPaper.ink}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>

      {/* 힌트는 ViewShot 밖으로 이동 — 캡처에 포함 안 됨 */}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: selectedPaper.bg }}>
      <StatusBar hidden />

      {/* 종이 캔버스 */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
        style={{ flex: 1, backgroundColor: selectedPaper.bg }}
      >
        <View
          style={{ flex: 1, backgroundColor: selectedPaper.bg }}
          {...panResponder.panHandlers}
        >
          {selectedPaper.image && (
            <ImageBackground
              source={selectedPaper.image}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              pointerEvents="none"
            />
          )}
          <PaperBrandMark template={selectedPaper} />
          {drawingContent}
        </View>
      </ViewShot>

      {/* 획 힌트 오버레이 — ViewShot 밖, 캡처 안 됨 */}
      {!hasStrokes && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: hintOpacity }]}
          pointerEvents="none"
        >
          <Svg style={StyleSheet.absoluteFill} width={SW} height={SH}>
            {/*
              웹 viewBox 0 0 250 120 기준 경로
              캐릭터 x중심≈125, y중심≈62
              scale(2.5) 후 화면 중앙 배치:
                translateX = SW/2 - 125*2.5 = SW/2 - 312
                translateY = SH/2 - 62*2.5  = SH/2 - 155
            */}
            <G transform={`translate(${SW / 2 - 312}, ${SH / 2 - 155}) scale(2.5)`}>
              {HINT_STROKES.map((stroke, i) => {
                const dashOffset = hintAnims[i].interpolate({ inputRange: [0, 1], outputRange: [200, 0] });
                const coreColor = hintAnims[i].interpolate({
                  inputRange:  [0,       0.15,    0.6,     1      ],
                  outputRange: ['#fff',  '#fff',  '#E0F2FE','#C8CDD4'],
                });
                return (
                  <G key={i}>
                    {/* ── 레이어 1: 하늘색 아우터 블룸 (scale 2.5 → 실제 20px) ── */}
                    <AnimatedPath
                      d={stroke.d} fill="none"
                      stroke="#7DD3FC" strokeWidth={8}
                      strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="200 201" strokeDashoffset={dashOffset}
                      opacity={hintAnims[i].interpolate({
                        inputRange: [0, 0.05, 0.5, 1],
                        outputRange: [0, 0.35, 0.25, 0],
                      })}
                    />

                    {/* ── 레이어 2: 흰색 이너 글로우 (scale 2.5 → 실제 10px) ── */}
                    <AnimatedPath
                      d={stroke.d} fill="none"
                      stroke="white" strokeWidth={4}
                      strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="200 201" strokeDashoffset={dashOffset}
                      opacity={hintAnims[i].interpolate({
                        inputRange: [0, 0.05, 0.45, 1],
                        outputRange: [0, 0.80, 0.55, 0],
                      })}
                    />

                    {/* ── 레이어 3: 흰색 코어 (scale 2.5 → 실제 4px 얇은 네온선) ── */}
                    <AnimatedPath
                      d={stroke.d} fill="none"
                      stroke={coreColor} strokeWidth={1.6}
                      strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="200 201" strokeDashoffset={dashOffset}
                      opacity={0.98}
                    />
                  </G>
                );
              })}
            </G>
          </Svg>
        </Animated.View>
      )}

      {/* 나가기 버튼 — 항상 완전히 보임 (애니메이션 밖) */}
      <TouchableOpacity
        style={draw.exitBtn}
        onPress={exitDrawing}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <Text style={draw.exitBtnText}>✕  나가기</Text>
      </TouchableOpacity>

      {/* 플로팅 컨트롤 — 3초 후 반투명 (다시쓰기 + 완료) */}
      <Animated.View style={[draw.controls, { opacity: controlsOpacity }]} pointerEvents="box-none">

        {/* 우하단: 다시쓰기 + 완료 */}
        <View style={draw.rightBtns}>
          <TouchableOpacity
            style={draw.clearBtn}
            onPress={() => { clearCanvas(); showControls(); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={draw.clearBtnText}>↺  다시 쓰기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[draw.doneBtn, { backgroundColor: sideColor }, (!hasStrokes || isProcessing) && draw.doneBtnDisabled]}
            onPress={handleDone}
            disabled={!hasStrokes || isProcessing}
          >
            <Text style={draw.doneBtnText}>{isProcessing ? '처리 중...' : '완료  ✓'}</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </View>
  );
}

// ── 인트로 스타일 ─────────────────────────────
const intro = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 14, color: '#4E5968', fontWeight: '700' },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: '#191F28',
  },

  // 본문
  body: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 20,
  },
  eventBlock: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sidePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 12,
  },
  sidePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sideName: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  eventName: {
    fontSize: 25,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B95A1',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  creditPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F2F4F6',
  },
  creditPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4E5968',
    letterSpacing: -0.1,
  },
  templateList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  templateScroller: {
    flexGrow: 0,
    height: 248,
  },
  templateCard: {
    width: 132,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#EEF2F7',
    padding: 10,
  },
  livePreview: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(25,31,40,0.06)',
    marginBottom: 12,
  },
  livePreviewImage: {
    borderRadius: 14,
  },
  livePreviewShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  livePreviewTop: {
    position: 'absolute',
    top: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePreviewDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  livePreviewLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  livePreviewGuide: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.8,
    opacity: 0.65,
  },
  livePreviewName: {
    position: 'absolute',
    alignSelf: 'center',
    top: 72,
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: 8,
  },
  brandMarkPreview: {
    position: 'absolute',
    top: 9,
    right: 11,
    alignItems: 'center',
    opacity: 0.62,
  },
  brandLogoPreview: {
    width: 34,
    height: 34,
  },
  brandTaglinePreview: {
    marginTop: -1,
    fontSize: 6,
    color: '#5F5549',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  templateMeta: {
    flex: 1,
  },
  templateInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.35,
  },
  templateSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B95A1',
    marginTop: 3,
    letterSpacing: -0.25,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
  freeBadge: {
    backgroundColor: '#E8F3FF',
  },
  paidBadge: {
    backgroundColor: '#191F28',
  },
  priceBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3182F6',
  },
  paidBadgeText: {
    color: '#FFFFFF',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    gap: 12,
  },
  selectedSwatch: {
    width: 44,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(25,31,40,0.08)',
  },
  selectedSwatchImage: {
    borderRadius: 8,
  },
  selectedLabel: {
    fontSize: 11,
    color: '#8B95A1',
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedName: {
    fontSize: 15,
    color: '#191F28',
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  selectedPrice: {
    fontSize: 13,
    color: '#4E5968',
    fontWeight: '800',
  },
  ownedSection: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  ownedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ownedTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.2,
  },
  ownedCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B95A1',
  },
  ownedList: {
    gap: 8,
    paddingRight: 20,
  },
  ownedChip: {
    width: 132,
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEF2F7',
    backgroundColor: '#FFFFFF',
  },
  ownedChipTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  ownedChipName: {
    fontSize: 11,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.2,
  },
  ownedChipSub: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '700',
    color: '#8B95A1',
  },

  // 하단 버튼
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  accessNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginBottom: 10,
  },
  accessNoticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessNoticeTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.2,
  },
  accessNoticeSub: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7684',
    lineHeight: 15,
  },
  startBtn: {
    height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  startBtnDisabled: {
    backgroundColor: '#8B95A1',
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
});

// ── 드로잉 스타일 ─────────────────────────────
const draw = StyleSheet.create({
  hintCharRow: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  hintChar: {
    fontSize: 72,
    fontWeight: '200',
    color: '#1A1209',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  charGlow: {
    position: 'absolute',
    width: 84, height: 84,
    borderRadius: 42,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    shadowOpacity: 0.7,
    elevation: 0,
  },
  brandMark: {
    position: 'absolute',
    top: 30,
    right: 42,
    alignItems: 'center',
    opacity: 0.62,
  },
  brandLogo: {
    width: 92,
    height: 92,
  },
  brandTagline: {
    marginTop: -6,
    fontSize: 13,
    color: '#5F5549',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  controls: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'box-none',
  },
  // 나가기 버튼 (좌상단)
  exitBtn: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: '#191F28',
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 4,
  },
  exitBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.2 },

  // 우하단 버튼 그룹 (가로)
  rightBtns: {
    position: 'absolute', bottom: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#191F28',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  clearBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  doneBtn: {
    paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  doneBtnDisabled: { opacity: 0.28, shadowOpacity: 0 },
  doneBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.2 },
});

const styles = StyleSheet.create({});
