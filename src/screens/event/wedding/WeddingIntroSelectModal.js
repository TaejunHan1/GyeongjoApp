// src/screens/event/wedding/WeddingIntroSelectModal.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  Animated, StyleSheet, Dimensions, Switch, Platform, Easing,
} from 'react-native';
import Svg, { Defs, G, Mask, Path } from 'react-native-svg';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TutorialOverlay from '../../../components/TutorialOverlay';
import { useTutorial } from '../../../contexts/TutorialContext';
import {
  KOREAN_MARRIAGE_FILL_PATHS,
  KOREAN_MARRIAGE_FILL_TRANSLATE,
  KOREAN_MARRIAGE_MASK_STROKE_GROUPS,
  KOREAN_MARRIAGE_MASK_TRANSLATE,
  KOREAN_MARRIAGE_SCRIPT_COLOR,
  KOREAN_MARRIAGE_SCRIPT_VIEWBOX,
} from './koreanMarriageScriptPaths';
import {
  WELCOME_WEDDING_DOT_COLOR,
  WELCOME_WEDDING_DOT_FILL,
  WELCOME_WEDDING_DOT_STROKE,
  WELCOME_WEDDING_SCRIPT_COLOR,
  WELCOME_WEDDING_SCRIPT_VIEWBOX,
  WELCOME_WEDDING_STROKE_PATHS,
} from './welcomeWeddingScriptPaths';
import {
  INVITE_GUESTS_FILL_PATHS,
  INVITE_GUESTS_FILL_TRANSLATE,
  INVITE_GUESTS_MASK_STROKE_GROUPS,
  INVITE_GUESTS_MASK_TRANSLATE,
  INVITE_GUESTS_SCRIPT_COLOR,
  INVITE_GUESTS_SCRIPT_VIEWBOX,
} from './inviteGuestsScriptPaths';

const { width: SCREEN_W } = Dimensions.get('window');
const PHONE_W = Math.min(SCREEN_W - 48, 270);
const PHONE_H = PHONE_W * (16 / 9);
const KOREAN_MARRIAGE_SCRIPT_RATIO = 385 / 92;
const KOREAN_MARRIAGE_DASH_LENGTH = 900;
const WELCOME_WEDDING_SCRIPT_RATIO = 680 / 330;
const INVITE_GUESTS_SCRIPT_RATIO = 520 / 110;
const INVITE_GUESTS_DASH_LENGTH = 900;
const TEXT_INTRO_VERTICAL_OFFSET = -34;
const blockIntroTouch = () => true;
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const INTRO_LIST = [
  { id: 'none',    type: 'common', title: '인트로 없음',   desc: '청첩장이 바로 열립니다',                   emoji: '✕'  },
  { id: 'grand',   type: 'door',   title: '그랜드 오픈',   desc: '아이보리 도어 · 황금빛 W 씰',             emoji: '🚪' },
  { id: 'classic', type: 'door',   title: '클래식 누아르',  desc: '칠흑 더블프레임 도어 · 골드 링 씰',       emoji: '🚪' },
  { id: 'arch',    type: 'door',   title: '로맨틱 버건디',  desc: '와인빛 아치 도어 · 로즈골드 다이아 씰',   emoji: '🚪' },
  { id: 'glass',   type: 'door',   title: '딥 오션',        desc: '네이비 창문 도어 · 더블링 씰',            emoji: '🚪' },
  { id: 'artdeco', type: 'door',   title: '골드 럭셔리',    desc: '딥 퍼플 아르데코 도어 · 골드 다이아 씰',  emoji: '🚪' },
  { id: 'garden',  type: 'door',   title: '포레스트',       desc: '다크 그린 브라켓 도어 · 오벌 크리미 씰',  emoji: '🚪' },
  { id: 'curtain', type: 'door',   title: '화이트 커튼',    desc: '하늘하늘 시폰 커튼 · 부드러운 열림',      emoji: '🪟' },
  { id: 'happily-script', type: 'text', title: 'Happily ever after', desc: '검은 페이드 · 핑크 영문 필기체 인트로', emoji: '✍️' },
  { id: 'korean-marriage-script', type: 'text', title: '저희 둘 결혼합니다', desc: '검은 페이드 · 연두빛 한글 손글씨 인트로', emoji: '✍️' },
  { id: 'welcome-wedding-script', type: 'text', title: 'Welcome to our wedding', desc: '검은 페이드 · 보라빛 웰컴 스크립트 인트로', emoji: '✍️' },
  { id: 'invite-guests-script', type: 'text', title: '소중한 분들을 초대합니다', desc: '검은 페이드 · 베이지 한글 초대 스크립트 인트로', emoji: '✍️' },
];

const INTRO_TABS = [
  { id: 'door', label: '도어' },
  { id: 'text', label: '텍스트 인트로' },
];

// ── 청첩장 배경 ──
function MockInvitation() {
  const FW = PHONE_W - 16;
  return (
    <View style={ms.wrap}>
      <Text style={ms.label}>WEDDING INVITATION</Text>
      <Text style={ms.names}>김민수 <Text style={ms.and}>&</Text> 이서연</Text>
      <Text style={ms.date}>2026. 05. 14 SAT PM 1:00</Text>
      <View style={[ms.imgFrame, { width: FW, height: FW * (5 / 4) }]}>
        <View style={ms.imgInner}>
          <View style={ms.iconCircle}><Text style={{ fontSize: 20 }}>💍</Text></View>
          <Text style={ms.imgText}>Beautiful Day</Text>
        </View>
      </View>
    </View>
  );
}
const ms = StyleSheet.create({
  wrap:       { flex: 1, backgroundColor: '#FAF8F5', alignItems: 'center', paddingTop: 32, paddingHorizontal: 8 },
  label:      { fontSize: 9, letterSpacing: 4, color: '#A29A8E', fontWeight: '600', marginBottom: 8 },
  names:      { fontSize: 20, color: '#2C2C2C', fontWeight: '500', marginBottom: 6 },
  and:        { fontSize: 14, color: '#A29A8E', fontStyle: 'italic' },
  date:       { fontSize: 10, color: '#8B8B8B', letterSpacing: 1, marginBottom: 16 },
  imgFrame:   { backgroundColor: '#EBE7E0', borderTopLeftRadius: 80, borderTopRightRadius: 80,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  imgInner:   { alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#fff' },
  imgText:    { fontSize: 9, color: '#A29A8E', letterSpacing: 2, textTransform: 'uppercase' },
});

// ── 탭 힌트 (인라인): 씰/이름 바로 아래 marginTop으로 배치 ──
// 신랑 · 신부 이름 좌우 분리 레이아웃
// 문 가운데 기준으로 신랑은 우측정렬, 신부는 좌측정렬 → 이름 길이 관계없이 정중앙 유지
function NamesRow({ names = '', color = '#fff' }) {
  const parts = names.split(' · ');
  const groom = parts[0] || '';
  const bride = parts[1] || '';
  const nameStyle = { flex: 1, fontSize: 12, color, fontStyle: 'italic', fontFamily: SERIF };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 200, marginBottom: 0 }}>
      <Text style={[nameStyle, { textAlign: 'right' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
        {groom}
      </Text>
      <Text style={{ marginHorizontal: 5, color, fontSize: 10, opacity: 0.7 }}>·</Text>
      <Text style={[nameStyle, { textAlign: 'left' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
        {bride}
      </Text>
    </View>
  );
}

// 퍼센트 top 방식을 쓰지 않아 화면 크기에 무관하게 항상 씰 아래에 고정됨
function TapHintInline({ textColor = '#fff', pillBg = 'rgba(0,0,0,0.32)' }) {
  const op = useRef(new Animated.Value(1)).current;
  const sc = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(op, { toValue: 0.25, duration: 850, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1,    duration: 850, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(sc, { toValue: 0.93, duration: 850, useNativeDriver: true }),
        Animated.timing(sc, { toValue: 1,    duration: 850, useNativeDriver: true }),
      ]),
    ])).start();
  }, []);
  return (
    <Animated.View style={{ marginTop: 20, opacity: op, transform: [{ scale: sc }] }}
      pointerEvents="none">
      <View style={{ paddingHorizontal: 14, paddingVertical: 6,
        backgroundColor: pillBg, borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth, borderColor: textColor }}>
        <Text style={{ fontSize: 11, letterSpacing: 2.5, color: textColor, fontWeight: '600' }}>
          초대장 열기
        </Text>
      </View>
    </Animated.View>
  );
}

// ── 탭 힌트 (절대위치): 커튼처럼 씰이 없는 경우 중앙 아래에 배치 ──
function TapHintAbsolute({ textColor = '#fff', pillBg = 'rgba(0,0,0,0.32)' }) {
  const op = useRef(new Animated.Value(1)).current;
  const sc = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(op, { toValue: 0.25, duration: 850, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1,    duration: 850, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(sc, { toValue: 0.93, duration: 850, useNativeDriver: true }),
        Animated.timing(sc, { toValue: 1,    duration: 850, useNativeDriver: true }),
      ]),
    ])).start();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      alignItems: 'center', justifyContent: 'center',
      opacity: op, transform: [{ scale: sc }] }} pointerEvents="none">
      <View style={{ paddingHorizontal: 14, paddingVertical: 6,
        backgroundColor: pillBg, borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth, borderColor: textColor }}>
        <Text style={{ fontSize: 11, letterSpacing: 2.5, color: textColor, fontWeight: '600' }}>
          초대장 열기
        </Text>
      </View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════
// 공통 도어 애니메이션 훅
// ══════════════════════════════════════════════════════
function useDoorAnim({ containerW = PHONE_W, sealDelay = 0, tapToOpen = false, onEnd } = {}) {
  const leftX  = useRef(new Animated.Value(0)).current;
  const rightX = useRef(new Animated.Value(0)).current;
  const sealOp = useRef(new Animated.Value(1)).current;
  const sealSc = useRef(new Animated.Value(1)).current;
  const [started, setStarted] = useState(false);
  const [done,    setDone]    = useState(false);

  const play = useCallback(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(sealOp, { toValue: 0,    duration: 600, useNativeDriver: true }),
        Animated.timing(sealSc, { toValue: 0.92, duration: 600, useNativeDriver: true }),
      ]),
      ...(sealDelay > 0 ? [Animated.delay(sealDelay)] : []),
      Animated.parallel([
        Animated.timing(leftX,  { toValue: -(containerW / 2), duration: 900, useNativeDriver: true }),
        Animated.timing(rightX, { toValue:   containerW / 2,  duration: 900, useNativeDriver: true }),
      ]),
    ]).start(() => { setDone(true); onEnd?.(); });
  }, [containerW, sealDelay]);

  useEffect(() => { if (!tapToOpen) setTimeout(() => play(), 1200); }, []);
  const handleTap = () => { if (!started) { setStarted(true); play(); } };
  return { leftX, rightX, sealOp, sealSc, started, done, handleTap };
}

const DOOR_Z = { zIndex: 10 };

function DoorWrapper({ tapToOpen, started, done, handleTap, hint, children }) {
  if (done) return null;
  if (tapToOpen && !started) {
    return (
      <TouchableOpacity style={[StyleSheet.absoluteFill, DOOR_Z]} onPress={handleTap} activeOpacity={0.95}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">{children}</View>
        {hint}
      </TouchableOpacity>
    );
  }
  return (
    <View
      style={[StyleSheet.absoluteFill, DOOR_Z]}
      pointerEvents="auto"
      onStartShouldSetResponder={blockIntroTouch}
      onMoveShouldSetResponder={blockIntroTouch}
    >
      {children}
    </View>
  );
}

// ══════════════════════════════════════════════════════
// 도어 팩토리 — 렌더 함수 기반 (패널 디테일 · 씰 각각 다르게)
// ══════════════════════════════════════════════════════
function createDoor({ bg, crackColor, tapHintColor, tapHintPillBg, sealDelay = 0,
                      renderLeftDetail, renderRightDetail, renderSeal }) {
  const RD = renderRightDetail || renderLeftDetail;
  return function Door({ containerW = PHONE_W, tapToOpen = false, onEnd, coupleNames = '김민수 · 이서연' }) {
    const { leftX, rightX, sealOp, sealSc, started, done, handleTap } = useDoorAnim({
      containerW, sealDelay, tapToOpen, onEnd,
    });
    const HW = containerW / 2;
    return (
      <DoorWrapper tapToOpen={tapToOpen} started={started} done={done} handleTap={handleTap}>
        {/* 왼쪽 문 */}
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, height: '100%',
          width: HW, backgroundColor: bg,
          borderRightWidth: 1, borderRightColor: crackColor,
          transform: [{ translateX: leftX }] }}>
          {renderLeftDetail?.()}
        </Animated.View>
        {/* 오른쪽 문 */}
        <Animated.View style={{ position: 'absolute', top: 0, right: 0, height: '100%',
          width: HW, backgroundColor: bg,
          borderLeftWidth: 1, borderLeftColor: crackColor,
          transform: [{ translateX: rightX }] }}>
          {RD?.()}
        </Animated.View>
        {/* 씰 + 이름 + 힌트 (sealOp와 함께 fade — layout 점프 없음) */}
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
          opacity: sealOp, transform: [{ scale: sealSc }] }}>
          {renderSeal(coupleNames)}
          {tapToOpen && <TapHintInline textColor={tapHintColor} pillBg={tapHintPillBg} />}
        </Animated.View>
      </DoorWrapper>
    );
  };
}

// ══════════════════════════════════════════════════════
// 1. 그랜드 오픈 — 원본 유지
//    아이보리 패널 · 단일 인셋 테두리 · 골드 채운 원 씰
// ══════════════════════════════════════════════════════
function GrandOpenDoor({ containerW = PHONE_W, tapToOpen = false, onEnd, coupleNames = '김민수 · 이서연' }) {
  const { leftX, rightX, sealOp, sealSc, started, done, handleTap } = useDoorAnim({
    containerW, sealDelay: 400, tapToOpen, onEnd,
  });
  const HW = containerW / 2;
  return (
    <DoorWrapper tapToOpen={tapToOpen} started={started} done={done} handleTap={handleTap}>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, height: '100%',
        width: HW, backgroundColor: '#EFECE8',
        borderRightWidth: 1, borderRightColor: '#D9D1C7',
        transform: [{ translateX: leftX }] }}>
        <View style={{ position: 'absolute', top: 18, left: 7, right: 7, bottom: 18,
          borderWidth: 1, borderColor: 'rgba(217,209,199,0.6)' }} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, height: '100%',
        width: HW, backgroundColor: '#EFECE8',
        borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.6)',
        transform: [{ translateX: rightX }] }}>
        <View style={{ position: 'absolute', top: 18, left: 7, right: 7, bottom: 18,
          borderWidth: 1, borderColor: 'rgba(217,209,199,0.6)' }} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
        opacity: sealOp, transform: [{ scale: sealSc }] }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#D4AF37',
          alignItems: 'center', justifyContent: 'center', marginBottom: 6,
          shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 6 }}>
          <View style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4,
            borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }} />
          <Text style={{ fontSize: 22, color: '#fff', fontWeight: '400', fontStyle: 'italic', fontFamily: SERIF }}>W</Text>
        </View>
        <Text style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(140,115,90,0.6)', marginBottom: 4 }}>Wedding</Text>
        <NamesRow names={coupleNames} color="#8C7B65" />
        {tapToOpen && <TapHintInline textColor="rgba(70,50,25,0.9)" pillBg="rgba(70,50,25,0.12)" />}
      </Animated.View>
    </DoorWrapper>
  );
}

// ══════════════════════════════════════════════════════
// 2. 클래식 누아르
//    짙은 차콜 패널 · 세로 3분할 패널라인 + 상단 아치 힌트
//    씰: 실버 팔각형 (사각형 + 45° 사각형 겹침)
// ══════════════════════════════════════════════════════
function classicDetail() {
  return (
    <View style={{ position: 'absolute', top: 18, left: 7, right: 7, bottom: 18,
      borderWidth: 1, borderColor: 'rgba(210,210,225,0.28)' }}>
      {/* 상단 아치 힌트: 위쪽 인셋 반원 */}
      <View style={{ position: 'absolute', top: -1, left: '20%', right: '20%', height: 18,
        borderTopLeftRadius: 40, borderTopRightRadius: 40,
        borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
        borderColor: 'rgba(210,210,225,0.22)' }} />
      {/* 세로 1/3 분할선 */}
      <View style={{ position: 'absolute', top: 6, bottom: 6, left: '33%', width: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(210,210,225,0.15)' }} />
      <View style={{ position: 'absolute', top: 6, bottom: 6, left: '66%', width: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(210,210,225,0.15)' }} />
    </View>
  );
}
const ClassicDoor = createDoor({
  bg: '#18181E',
  crackColor: 'rgba(200,200,220,0.5)',
  tapHintColor: '#D0D0E8',
  tapHintPillBg: 'rgba(200,200,220,0.15)',
  renderLeftDetail: classicDetail,
  renderSeal: (names) => (
    <>
      {/* 팔각형 느낌: 원 + 안쪽 45° 회전 사각형 겹침 */}
      <View style={{ width: 56, height: 56, borderRadius: 28,
        backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(210,210,230,0.85)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
        shadowColor: '#A0A0C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }}>
        {/* 내부 회전 사각형 */}
        <View style={{ position: 'absolute', width: 32, height: 32,
          transform: [{ rotate: '45deg' }],
          borderWidth: 1, borderColor: 'rgba(210,210,230,0.45)' }} />
        <Text style={{ fontSize: 22, color: 'rgba(220,220,240,0.95)', fontWeight: '400', fontStyle: 'italic', fontFamily: SERIF }}>W</Text>
      </View>
      <Text style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(200,200,220,0.45)', marginBottom: 4 }}>Wedding</Text>
      <NamesRow names={names} color="rgba(210,210,235,0.82)" />
    </>
  ),
});

// ══════════════════════════════════════════════════════
// 3. 로맨틱 버건디
//    와인빛 패널 · 크랙 방향 아치형 인셋 (중앙에서 아치)
//    씰: 로즈골드 다이아몬드 (45° 회전 정사각형)
// ══════════════════════════════════════════════════════
const ArchDoor = createDoor({
  bg: '#3B2030',
  crackColor: '#C4977A',
  tapHintColor: '#E8C4A8',
  tapHintPillBg: 'rgba(196,151,122,0.22)',
  renderLeftDetail: () => (
    // 왼쪽: 문 크랙 방향(오른쪽)에 아치
    <View style={{ position: 'absolute', top: 18, left: 7, right: 7, bottom: 18,
      borderWidth: 1, borderColor: 'rgba(196,151,122,0.45)',
      borderTopRightRadius: 26 }}>
      {/* 아치 피크에 다이아 장식 */}
      <View style={{ position: 'absolute', top: -4, right: -4, width: 7, height: 7,
        transform: [{ rotate: '45deg' }], backgroundColor: 'rgba(196,151,122,0.65)' }} />
    </View>
  ),
  renderRightDetail: () => (
    // 오른쪽: 문 크랙 방향(왼쪽)에 아치
    <View style={{ position: 'absolute', top: 18, left: 7, right: 7, bottom: 18,
      borderWidth: 1, borderColor: 'rgba(196,151,122,0.45)',
      borderTopLeftRadius: 26 }}>
      <View style={{ position: 'absolute', top: -4, left: -4, width: 7, height: 7,
        transform: [{ rotate: '45deg' }], backgroundColor: 'rgba(196,151,122,0.65)' }} />
    </View>
  ),
  renderSeal: (names) => (
    <>
      <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <View style={{ width: 46, height: 46, transform: [{ rotate: '45deg' }],
          backgroundColor: '#C4977A',
          shadowColor: '#C4977A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
          alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: 5, left: 5, right: 5, bottom: 5,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' }} />
          <Text style={{ transform: [{ rotate: '-45deg' }], fontSize: 20, color: '#fff', fontWeight: '400', fontStyle: 'italic', fontFamily: SERIF }}>W</Text>
        </View>
      </View>
      <Text style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(220,185,165,0.55)', marginBottom: 4 }}>Wedding</Text>
      <NamesRow names={names} color="rgba(220,185,165,0.9)" />
    </>
  ),
});

// ══════════════════════════════════════════════════════
// 4. 딥 오션
//    네이비 패널 · 4분할 창문 그리드 (세로 + 가로 선)
//    씰: 더블링 (원 안에 원 두 겹)
// ══════════════════════════════════════════════════════
function oceanDetail() {
  return (
    <View style={{ position: 'absolute', top: 18, left: 7, right: 7, bottom: 18,
      borderWidth: 1, borderColor: 'rgba(200,215,255,0.28)' }}>
      {/* 세로 그리드 선 */}
      <View style={{ position: 'absolute', top: 6, bottom: 6, left: '50%', width: 1,
        backgroundColor: 'rgba(200,215,255,0.18)' }} />
      {/* 가로 그리드 선 */}
      <View style={{ position: 'absolute', left: 6, right: 6, top: '45%', height: 1,
        backgroundColor: 'rgba(200,215,255,0.18)' }} />
    </View>
  );
}
const GlassDoor = createDoor({
  bg: '#18243E',
  crackColor: 'rgba(200,215,255,0.4)',
  tapHintColor: '#C8D8F8',
  tapHintPillBg: 'rgba(200,215,255,0.18)',
  renderLeftDetail: oceanDetail,
  renderSeal: (names) => (
    <>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8EAF4',
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
        shadowColor: '#8090B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
        <View style={{ position: 'absolute', top: 5, left: 5, right: 5, bottom: 5,
          borderRadius: 23, borderWidth: 1, borderColor: 'rgba(130,150,190,0.45)' }} />
        <View style={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
          borderRadius: 18, borderWidth: 1, borderColor: 'rgba(130,150,190,0.25)' }} />
        <Text style={{ fontSize: 22, color: '#18243E', fontWeight: '400', fontStyle: 'italic', fontFamily: SERIF }}>W</Text>
      </View>
      <Text style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(200,215,245,0.5)', marginBottom: 4 }}>Wedding</Text>
      <NamesRow names={names} color="rgba(200,215,245,0.9)" />
    </>
  ),
});

// ══════════════════════════════════════════════════════
// 5. 골드 럭셔리
//    딥 퍼플 패널 · 아르데코 코너 브라켓 L자 장식 + 중앙 세로선
//    씰: 골드 다이아몬드 (45° 회전, 내부 인셋 테두리)
// ══════════════════════════════════════════════════════
function artdecoDetail() {
  return (
    <View style={{ position: 'absolute', top: 18, left: 7, right: 7, bottom: 18,
      borderWidth: 1, borderColor: 'rgba(212,175,55,0.38)' }}>
      {/* TL 코너 브라켓 */}
      <View style={{ position: 'absolute', top: 5, left: 5, width: 12, height: 12,
        borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(212,175,55,0.65)' }} />
      {/* TR 코너 브라켓 */}
      <View style={{ position: 'absolute', top: 5, right: 5, width: 12, height: 12,
        borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(212,175,55,0.65)' }} />
      {/* BL 코너 브라켓 */}
      <View style={{ position: 'absolute', bottom: 5, left: 5, width: 12, height: 12,
        borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(212,175,55,0.65)' }} />
      {/* BR 코너 브라켓 */}
      <View style={{ position: 'absolute', bottom: 5, right: 5, width: 12, height: 12,
        borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(212,175,55,0.65)' }} />
      {/* 중앙 세로 장식선 */}
      <View style={{ position: 'absolute', top: '25%', bottom: '25%', left: '50%', width: 1,
        backgroundColor: 'rgba(212,175,55,0.22)' }} />
    </View>
  );
}
const ArtDecoDoor = createDoor({
  bg: '#0E0C18',
  crackColor: 'rgba(212,175,55,0.65)',
  tapHintColor: '#D4AF37',
  tapHintPillBg: 'rgba(212,175,55,0.18)',
  sealDelay: 200,
  renderLeftDetail: artdecoDetail,
  renderSeal: (names) => (
    <>
      <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <View style={{ width: 46, height: 46, transform: [{ rotate: '45deg' }],
          backgroundColor: '#D4AF37',
          shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 6,
          alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: 5, left: 5, right: 5, bottom: 5,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} />
          <Text style={{ transform: [{ rotate: '-45deg' }], fontSize: 20, color: '#0E0C18', fontWeight: '400', fontStyle: 'italic', fontFamily: SERIF }}>W</Text>
        </View>
      </View>
      <Text style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(212,175,55,0.55)', marginBottom: 4 }}>Wedding</Text>
      <NamesRow names={names} color="rgba(212,175,55,0.9)" />
    </>
  ),
});

// ══════════════════════════════════════════════════════
// 6. 포레스트
//    다크 그린 패널 · 모서리 브라켓 + 중앙 원형 장식
//    씰: 크리미 오벌 (타원형)
// ══════════════════════════════════════════════════════
function gardenDetail() {
  return (
    <View style={{ position: 'absolute', top: 18, left: 7, right: 7, bottom: 18,
      borderWidth: 1, borderColor: 'rgba(185,210,170,0.32)', borderRadius: 4 }}>
      {/* TL 브라켓 */}
      <View style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10,
        borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(185,210,170,0.6)', borderTopLeftRadius: 3 }} />
      {/* TR 브라켓 */}
      <View style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10,
        borderTopWidth: 2, borderRightWidth: 2, borderColor: 'rgba(185,210,170,0.6)', borderTopRightRadius: 3 }} />
      {/* BL 브라켓 */}
      <View style={{ position: 'absolute', bottom: -1, left: -1, width: 10, height: 10,
        borderBottomWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(185,210,170,0.6)', borderBottomLeftRadius: 3 }} />
      {/* BR 브라켓 */}
      <View style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10,
        borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(185,210,170,0.6)', borderBottomRightRadius: 3 }} />
      {/* 중앙 소형 원 장식 */}
      <View style={{ position: 'absolute', top: '30%', left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5,
          borderWidth: 1, borderColor: 'rgba(185,210,170,0.5)' }} />
      </View>
    </View>
  );
}
const GardenDoor = createDoor({
  bg: '#283525',
  crackColor: 'rgba(190,215,175,0.55)',
  tapHintColor: '#C0E0B0',
  tapHintPillBg: 'rgba(185,215,170,0.2)',
  renderLeftDetail: gardenDetail,
  renderSeal: (names) => (
    <>
      <View style={{ width: 68, height: 48, borderRadius: 24, backgroundColor: '#F0EDE6',
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
        shadowColor: '#4A6A40', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 }}>
        <View style={{ position: 'absolute', top: 4, left: 6, right: 6, bottom: 4,
          borderRadius: 20, borderWidth: 1, borderColor: 'rgba(160,190,148,0.45)' }} />
        <Text style={{ fontSize: 20, color: '#283525', fontWeight: '400', fontStyle: 'italic', fontFamily: SERIF }}>W</Text>
      </View>
      <Text style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(200,225,188,0.55)', marginBottom: 4 }}>Wedding</Text>
      <NamesRow names={names} color="rgba(200,225,188,0.92)" />
    </>
  ),
});

// ══════════════════════════════════════════════════════
// 7. 화이트 커튼
//    하늘하늘한 시폰 커튼 · 수직 주름 라인 · 씰 없음
// ══════════════════════════════════════════════════════
function CurtainFolds() {
  // 불규칙한 수직 주름: 그림자 띠로 자연스러운 드레이프 표현
  const folds = [
    { pct: '8%',  w: '3%', op: 0.07 },
    { pct: '18%', w: '4%', op: 0.05 },
    { pct: '30%', w: '3%', op: 0.08 },
    { pct: '44%', w: '4%', op: 0.06 },
    { pct: '57%', w: '3%', op: 0.07 },
    { pct: '68%', w: '4%', op: 0.05 },
    { pct: '80%', w: '3%', op: 0.07 },
    { pct: '90%', w: '3%', op: 0.05 },
  ];
  return (
    <>
      {folds.map((f, i) => (
        <View key={i} style={{ position: 'absolute', top: 0, bottom: 0,
          left: f.pct, width: f.w,
          backgroundColor: `rgba(160,165,175,${f.op})` }} />
      ))}
      {/* 상단 커튼 봉 그림자 */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10,
        backgroundColor: 'rgba(180,183,190,0.12)' }} />
      {/* 하단 자연스러운 처짐 */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20,
        backgroundColor: 'rgba(200,203,210,0.08)' }} />
    </>
  );
}

function CurtainDoor({ containerW = PHONE_W, tapToOpen = false, onEnd, coupleNames = '김민수 · 이서연' }) {
  const { leftX, rightX, sealOp, sealSc, started, done, handleTap } = useDoorAnim({
    containerW, sealDelay: 300, tapToOpen, onEnd,
  });
  const HW = containerW / 2;
  return (
    <DoorWrapper tapToOpen={tapToOpen} started={started} done={done} handleTap={handleTap}>
      {/* 왼쪽 커튼 패널 */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, height: '100%',
        width: HW, backgroundColor: '#FAFAFE',
        borderRightWidth: 1, borderRightColor: 'rgba(210,212,220,0.5)',
        transform: [{ translateX: leftX }] }}>
        <CurtainFolds />
      </Animated.View>
      {/* 오른쪽 커튼 패널 */}
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, height: '100%',
        width: HW, backgroundColor: '#FAFAFE',
        borderLeftWidth: 1, borderLeftColor: 'rgba(210,212,220,0.5)',
        transform: [{ translateX: rightX }] }}>
        <CurtainFolds />
      </Animated.View>
      {/* 커튼 중앙 텍스트 오버레이 (씰처럼 fade out) */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
        opacity: sealOp, transform: [{ scale: sealSc }] }}>
        <Text style={{ fontSize: 26, color: 'rgba(70,70,95,0.72)', fontStyle: 'italic',
          fontFamily: SERIF, fontWeight: '300', letterSpacing: 2, marginBottom: 8 }}>
          Wedding
        </Text>
        <View style={{ width: 48, height: 1, backgroundColor: 'rgba(100,105,130,0.2)', marginBottom: 8 }} />
        <NamesRow names={coupleNames} color="rgba(70,70,95,0.65)" />
        {tapToOpen && <TapHintInline textColor="rgba(70,70,95,0.85)" pillBg="rgba(70,70,95,0.1)" />}
      </Animated.View>
    </DoorWrapper>
  );
}

function WritingLine({ text, progress, width, textStyle }) {
  const revealWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });
  return (
    <View style={[s.writeLineBox, { width, alignSelf: 'center' }]}>
      <Animated.View style={{ width: revealWidth, overflow: 'hidden' }}>
        <Text style={[textStyle, { width }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

function KoreanMarriageStrokeText({ dashGroups, width, height }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={KOREAN_MARRIAGE_SCRIPT_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <Mask id="koreanMarriageStrokeMask" x="0" y="0" width="680" height="400" maskUnits="userSpaceOnUse">
          <G transform={`translate(${KOREAN_MARRIAGE_MASK_TRANSLATE.x} ${KOREAN_MARRIAGE_MASK_TRANSLATE.y})`}>
            {KOREAN_MARRIAGE_MASK_STROKE_GROUPS.map((group, groupIndex) => (
              <G key={groupIndex}>
                {group.map((d, strokeIndex) => (
                  <AnimatedPath
                    key={`${groupIndex}-${strokeIndex}`}
                    d={d}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={6.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={`${KOREAN_MARRIAGE_DASH_LENGTH} ${KOREAN_MARRIAGE_DASH_LENGTH}`}
                    strokeDashoffset={dashGroups[groupIndex][strokeIndex]}
                  />
                ))}
              </G>
            ))}
          </G>
        </Mask>
      </Defs>
      <G mask="url(#koreanMarriageStrokeMask)">
        <G transform={`translate(${KOREAN_MARRIAGE_FILL_TRANSLATE.x} ${KOREAN_MARRIAGE_FILL_TRANSLATE.y})`}>
          {KOREAN_MARRIAGE_FILL_PATHS.map((d, index) => (
            <Path
              key={index}
              d={d}
              fill={KOREAN_MARRIAGE_SCRIPT_COLOR}
              fillOpacity={1}
            />
          ))}
        </G>
      </G>
    </Svg>
  );
}

function InviteGuestsStrokeText({ dashGroups, width, height }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={INVITE_GUESTS_SCRIPT_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <Mask id="inviteGuestsStrokeMask" x="0" y="0" width="680" height="400" maskUnits="userSpaceOnUse">
          <G transform={`translate(${INVITE_GUESTS_MASK_TRANSLATE.x} ${INVITE_GUESTS_MASK_TRANSLATE.y})`}>
            {INVITE_GUESTS_MASK_STROKE_GROUPS.map((group, groupIndex) => (
              <G key={groupIndex}>
                {group.map((d, strokeIndex) => (
                  <AnimatedPath
                    key={`${groupIndex}-${strokeIndex}`}
                    d={d}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={7.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={`${INVITE_GUESTS_DASH_LENGTH} ${INVITE_GUESTS_DASH_LENGTH}`}
                    strokeDashoffset={dashGroups[groupIndex][strokeIndex]}
                  />
                ))}
              </G>
            ))}
          </G>
        </Mask>
      </Defs>
      <G mask="url(#inviteGuestsStrokeMask)">
        <G transform={`translate(${INVITE_GUESTS_FILL_TRANSLATE.x} ${INVITE_GUESTS_FILL_TRANSLATE.y})`}>
          {INVITE_GUESTS_FILL_PATHS.map((d, index) => (
            <Path
              key={index}
              d={d}
              fill={INVITE_GUESTS_SCRIPT_COLOR}
              fillOpacity={1}
            />
          ))}
        </G>
      </G>
    </Svg>
  );
}

function TextIntroTapHint({ opacity }) {
  return (
    <Animated.View style={[s.textIntroHintWrap, { opacity }]} pointerEvents="none">
      <View style={s.textIntroTapMark}>
        <View style={s.textIntroTapRing} />
        <View style={s.textIntroTapDot} />
      </View>
      <Text style={s.textIntroHintGuide}>화면을 터치해 주세요</Text>
      <View style={s.textIntroHintPillInner}>
        <Text style={s.textIntroHint}>초대장 열기</Text>
      </View>
    </Animated.View>
  );
}

function TextFadeIntro({
  containerW = PHONE_W,
  containerH = PHONE_H,
  tapToOpen = false,
  onEnd,
}) {
  const dim = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  const pinkOne = useRef(new Animated.Value(0)).current;
  const pinkTwo = useRef(new Animated.Value(0)).current;
  const hintOp = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const compact = containerW <= PHONE_W + 4;
  const textW = compact
    ? Math.max(containerW - 18, 220)
    : Math.max(containerW - 24, 320);

  const close = useCallback(() => {
    if (done) return;
    Animated.parallel([
      Animated.timing(dim, { toValue: 0, duration: 520, useNativeDriver: true }),
      Animated.timing(content, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start(() => {
      setDone(true);
      onEnd?.();
    });
  }, [content, dim, done, onEnd]);

  useEffect(() => {
    pinkOne.setValue(0);
    pinkTwo.setValue(0);
    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(content, { toValue: 1, duration: 680, useNativeDriver: true }),
      ]),
      Animated.timing(pinkOne, { toValue: 1, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.delay(90),
      Animated.timing(pinkTwo, { toValue: 1, duration: 2100, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]);

    sequence.start(() => {
      setReady(true);
      if (tapToOpen) {
        Animated.loop(Animated.sequence([
          Animated.timing(hintOp, { toValue: 1, duration: 620, useNativeDriver: true }),
          Animated.timing(hintOp, { toValue: 0.38, duration: 620, useNativeDriver: true }),
        ])).start();
      } else {
        setTimeout(close, 1050);
      }
    });
  }, []);

  if (done) return null;

  const body = (
    <View
      style={[StyleSheet.absoluteFill, DOOR_Z]}
      {...(!tapToOpen ? {
        onStartShouldSetResponder: blockIntroTouch,
        onMoveShouldSetResponder: blockIntroTouch,
      } : {})}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000',
            opacity: dim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.58] }),
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          s.textIntroStage,
          {
            justifyContent: 'center',
            paddingTop: 0,
            opacity: content,
            transform: [{
              translateY: content.interpolate({
                inputRange: [0, 1],
                outputRange: [TEXT_INTRO_VERTICAL_OFFSET + 10, TEXT_INTRO_VERTICAL_OFFSET],
              }),
            }],
          },
        ]}
      >
        <View style={{ width: textW, alignItems: 'center', transform: [{ rotate: '-2deg' }] }}>
          <WritingLine
            text="Happily"
            progress={pinkOne}
            width={textW}
            textStyle={[s.textIntroPink, compact && s.textIntroPinkCompact]}
          />
          <View style={{ marginTop: compact ? -12 : -18 }}>
            <WritingLine
              text="ever after"
              progress={pinkTwo}
              width={textW}
              textStyle={[s.textIntroPink, compact && s.textIntroPinkCompact]}
            />
          </View>
        </View>
      </Animated.View>
      {tapToOpen && ready && <TextIntroTapHint opacity={hintOp} />}
    </View>
  );

  if (tapToOpen) {
    return (
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, DOOR_Z]}
        activeOpacity={0.98}
        onPress={close}
        disabled={!ready}
      >
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

function KoreanMarriageIntro({
  containerW = PHONE_W,
  tapToOpen = false,
  onEnd,
}) {
  const dim = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  const drawGroups = useRef(KOREAN_MARRIAGE_MASK_STROKE_GROUPS.map(group =>
    group.map(() => new Animated.Value(KOREAN_MARRIAGE_DASH_LENGTH)),
  )).current;
  const hintOp = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const compact = containerW <= PHONE_W + 4;
  const textW = compact
    ? Math.min(Math.max(containerW - 44, 210), containerW - 20)
    : Math.min(Math.max(containerW * 0.7, 300), containerW - 48);
  const textH = textW / KOREAN_MARRIAGE_SCRIPT_RATIO;

  const close = useCallback(() => {
    if (done) return;
    Animated.parallel([
      Animated.timing(dim, { toValue: 0, duration: 520, useNativeDriver: true }),
      Animated.timing(content, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start(() => {
      setDone(true);
      onEnd?.();
    });
  }, [content, dim, done, onEnd]);

  useEffect(() => {
    drawGroups.forEach(group => {
      group.forEach(stroke => stroke.setValue(KOREAN_MARRIAGE_DASH_LENGTH));
    });
    Animated.sequence([
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(content, { toValue: 1, duration: 680, useNativeDriver: true }),
      ]),
      Animated.sequence(drawGroups.flatMap((group, groupIndex) =>
        group.map((stroke, strokeIndex) => Animated.timing(stroke, {
          toValue: 0,
          duration: Math.min(
            56,
            Math.max(20, KOREAN_MARRIAGE_MASK_STROKE_GROUPS[groupIndex][strokeIndex].length * 0.095),
          ),
          easing: Easing.linear,
          useNativeDriver: false,
        })),
      )),
    ]).start(() => {
      setReady(true);
      if (tapToOpen) {
        Animated.loop(Animated.sequence([
          Animated.timing(hintOp, { toValue: 1, duration: 620, useNativeDriver: true }),
          Animated.timing(hintOp, { toValue: 0.38, duration: 620, useNativeDriver: true }),
        ])).start();
      } else {
        setTimeout(close, 1050);
      }
    });
  }, []);

  if (done) return null;

  const body = (
    <View
      style={[StyleSheet.absoluteFill, DOOR_Z]}
      {...(!tapToOpen ? {
        onStartShouldSetResponder: blockIntroTouch,
        onMoveShouldSetResponder: blockIntroTouch,
      } : {})}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000',
            opacity: dim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.58] }),
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          s.textIntroStage,
          {
            justifyContent: 'center',
            paddingTop: 0,
            opacity: content,
            transform: [{
              translateY: content.interpolate({
                inputRange: [0, 1],
                outputRange: [TEXT_INTRO_VERTICAL_OFFSET + 10, TEXT_INTRO_VERTICAL_OFFSET],
              }),
            }],
          },
        ]}
      >
        <View style={{ width: textW, height: textH, alignItems: 'center', justifyContent: 'center' }}>
          <KoreanMarriageStrokeText
            dashGroups={drawGroups}
            width={textW}
            height={textH}
          />
        </View>
      </Animated.View>
      {tapToOpen && ready && <TextIntroTapHint opacity={hintOp} />}
    </View>
  );

  if (tapToOpen) {
    return (
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, DOOR_Z]}
        activeOpacity={0.98}
        onPress={close}
        disabled={!ready}
      >
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

function WelcomeWeddingStrokeText({ dashValues, dotDash, dotOpacity, width, height }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={WELCOME_WEDDING_SCRIPT_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
    >
      {WELCOME_WEDDING_STROKE_PATHS.map((item, index) => (
        <AnimatedPath
          key={index}
          d={item.d}
          transform={`translate(${item.tx} ${item.ty})`}
          fill="none"
          stroke={WELCOME_WEDDING_SCRIPT_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${item.len} ${item.len}`}
          strokeDashoffset={dashValues[index]}
        />
      ))}
      <AnimatedPath
        d={WELCOME_WEDDING_DOT_FILL.d}
        transform={`translate(${WELCOME_WEDDING_DOT_FILL.tx} ${WELCOME_WEDDING_DOT_FILL.ty})`}
        fill={WELCOME_WEDDING_DOT_COLOR}
        fillOpacity={1}
        opacity={dotOpacity}
      />
      <AnimatedPath
        d={WELCOME_WEDDING_DOT_STROKE.d}
        transform={`translate(${WELCOME_WEDDING_DOT_STROKE.tx} ${WELCOME_WEDDING_DOT_STROKE.ty})`}
        fill="none"
        stroke={WELCOME_WEDDING_SCRIPT_COLOR}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${WELCOME_WEDDING_DOT_STROKE.len} ${WELCOME_WEDDING_DOT_STROKE.len}`}
        strokeDashoffset={dotDash}
      />
    </Svg>
  );
}

function WelcomeWeddingIntro({
  containerW = PHONE_W,
  tapToOpen = false,
  onEnd,
}) {
  const dim = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  const dashValues = useRef(WELCOME_WEDDING_STROKE_PATHS.map(
    item => new Animated.Value(item.len),
  )).current;
  const dotDash = useRef(new Animated.Value(WELCOME_WEDDING_DOT_STROKE.len)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;
  const hintOp = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const compact = containerW <= PHONE_W + 4;
  const textW = compact
    ? Math.min(Math.max(containerW - 24, 250), containerW - 12)
    : Math.min(Math.max(containerW * 0.82, 360), containerW - 40);
  const textH = textW / WELCOME_WEDDING_SCRIPT_RATIO;

  const close = useCallback(() => {
    if (done) return;
    Animated.parallel([
      Animated.timing(dim, { toValue: 0, duration: 520, useNativeDriver: true }),
      Animated.timing(content, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start(() => {
      setDone(true);
      onEnd?.();
    });
  }, [content, dim, done, onEnd]);

  useEffect(() => {
    dashValues.forEach((value, index) => value.setValue(WELCOME_WEDDING_STROKE_PATHS[index].len));
    dotDash.setValue(WELCOME_WEDDING_DOT_STROKE.len);
    dotOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(content, { toValue: 1, duration: 680, useNativeDriver: true }),
      ]),
      Animated.stagger(360, dashValues.map((value, index) => Animated.timing(value, {
        toValue: 0,
        duration: Math.min(
          1500,
          Math.max(640, WELCOME_WEDDING_STROKE_PATHS[index].len * 0.92),
        ),
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }))),
      Animated.parallel([
        Animated.timing(dotDash, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 160, useNativeDriver: false }),
      ]),
    ]).start(() => {
      setReady(true);
      if (tapToOpen) {
        Animated.loop(Animated.sequence([
          Animated.timing(hintOp, { toValue: 1, duration: 620, useNativeDriver: true }),
          Animated.timing(hintOp, { toValue: 0.38, duration: 620, useNativeDriver: true }),
        ])).start();
      } else {
        setTimeout(close, 1050);
      }
    });
  }, []);

  if (done) return null;

  const body = (
    <View
      style={[StyleSheet.absoluteFill, DOOR_Z]}
      {...(!tapToOpen ? {
        onStartShouldSetResponder: blockIntroTouch,
        onMoveShouldSetResponder: blockIntroTouch,
      } : {})}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000',
            opacity: dim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.58] }),
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          s.textIntroStage,
          {
            justifyContent: 'center',
            paddingTop: 0,
            opacity: content,
            transform: [{
              translateY: content.interpolate({
                inputRange: [0, 1],
                outputRange: [TEXT_INTRO_VERTICAL_OFFSET + 10, TEXT_INTRO_VERTICAL_OFFSET],
              }),
            }],
          },
        ]}
      >
        <View style={{ width: textW, height: textH, alignItems: 'center', justifyContent: 'center' }}>
          <WelcomeWeddingStrokeText
            dashValues={dashValues}
            dotDash={dotDash}
            dotOpacity={dotOpacity}
            width={textW}
            height={textH}
          />
        </View>
      </Animated.View>
      {tapToOpen && ready && <TextIntroTapHint opacity={hintOp} />}
    </View>
  );

  if (tapToOpen) {
    return (
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, DOOR_Z]}
        activeOpacity={0.98}
        onPress={close}
        disabled={!ready}
      >
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

function InviteGuestsIntro({
  containerW = PHONE_W,
  tapToOpen = false,
  onEnd,
}) {
  const dim = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  const drawGroups = useRef(INVITE_GUESTS_MASK_STROKE_GROUPS.map(group =>
    group.map(() => new Animated.Value(INVITE_GUESTS_DASH_LENGTH)),
  )).current;
  const hintOp = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const compact = containerW <= PHONE_W + 4;
  const textW = compact
    ? Math.min(Math.max(containerW - 34, 220), containerW - 18)
    : Math.min(Math.max(containerW * 0.74, 330), containerW - 48);
  const textH = textW / INVITE_GUESTS_SCRIPT_RATIO;

  const close = useCallback(() => {
    if (done) return;
    Animated.parallel([
      Animated.timing(dim, { toValue: 0, duration: 520, useNativeDriver: true }),
      Animated.timing(content, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start(() => {
      setDone(true);
      onEnd?.();
    });
  }, [content, dim, done, onEnd]);

  useEffect(() => {
    drawGroups.forEach(group => {
      group.forEach(stroke => stroke.setValue(INVITE_GUESTS_DASH_LENGTH));
    });

    Animated.sequence([
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(content, { toValue: 1, duration: 680, useNativeDriver: true }),
      ]),
      Animated.sequence(drawGroups.flatMap((group, groupIndex) =>
        group.map((stroke, strokeIndex) => Animated.timing(stroke, {
          toValue: 0,
          duration: Math.min(
            46,
            Math.max(16, INVITE_GUESTS_MASK_STROKE_GROUPS[groupIndex][strokeIndex].length * 0.07),
          ),
          easing: Easing.linear,
          useNativeDriver: false,
        })),
      )),
    ]).start(() => {
      setReady(true);
      if (tapToOpen) {
        Animated.loop(Animated.sequence([
          Animated.timing(hintOp, { toValue: 1, duration: 620, useNativeDriver: true }),
          Animated.timing(hintOp, { toValue: 0.38, duration: 620, useNativeDriver: true }),
        ])).start();
      } else {
        setTimeout(close, 1050);
      }
    });
  }, []);

  if (done) return null;

  const body = (
    <View
      style={[StyleSheet.absoluteFill, DOOR_Z]}
      {...(!tapToOpen ? {
        onStartShouldSetResponder: blockIntroTouch,
        onMoveShouldSetResponder: blockIntroTouch,
      } : {})}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000',
            opacity: dim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.58] }),
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          s.textIntroStage,
          {
            justifyContent: 'center',
            paddingTop: 0,
            opacity: content,
            transform: [{
              translateY: content.interpolate({
                inputRange: [0, 1],
                outputRange: [TEXT_INTRO_VERTICAL_OFFSET + 10, TEXT_INTRO_VERTICAL_OFFSET],
              }),
            }],
          },
        ]}
      >
        <View style={{ width: textW, height: textH, alignItems: 'center', justifyContent: 'center' }}>
          <InviteGuestsStrokeText
            dashGroups={drawGroups}
            width={textW}
            height={textH}
          />
        </View>
      </Animated.View>
      {tapToOpen && ready && <TextIntroTapHint opacity={hintOp} />}
    </View>
  );

  if (tapToOpen) {
    return (
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, DOOR_Z]}
        activeOpacity={0.98}
        onPress={close}
        disabled={!ready}
      >
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

export const INTRO_OVERLAYS = {
  grand:   GrandOpenDoor,
  classic: ClassicDoor,
  arch:    ArchDoor,
  glass:   GlassDoor,
  artdeco: ArtDecoDoor,
  garden:  GardenDoor,
  curtain: CurtainDoor,
  'happily-script': TextFadeIntro,
  'korean-marriage-script': KoreanMarriageIntro,
  'welcome-wedding-script': WelcomeWeddingIntro,
  'invite-guests-script': InviteGuestsIntro,
};

// ══════════════════════════════════════════════════════
// WeddingIntroSelectModal
// ══════════════════════════════════════════════════════
export default function WeddingIntroSelectModal({ visible, onClose, selectedId, onSelect }) {
  const insets = useSafeAreaInsets();
  const [selected,  setSelected]  = useState('none');
  const [tapToOpen, setTapToOpen] = useState(false);
  const [playKey,   setPlayKey]   = useState(0);
  const [activeTab, setActiveTab] = useState('door');
  const selectedIntroId = typeof selectedId === 'string' ? selectedId : selectedId?.id || 'none';
  const selectedTapToOpen = typeof selectedId === 'object' && selectedId !== null
    ? !!selectedId.tapToOpen
    : false;

  // 튜토리얼 연동 — 포커스만 잡고 탭 시 수동 advance (handler 자동화 X, 사용자 조작 자유)
  const { step: tutorialStep, registerTarget, advanceStep: tutorialAdvance } = useTutorial();
  const grandItemRef = useRef(null);
  const applyBtnRef = useRef(null);
  const scrollRef = useRef(null);

  // intro 스텝일 때만 타겟 좌표 측정 (반복)
  useEffect(() => {
    if (!visible) return;
    const id = tutorialStep?.id;
    if (id !== 'intro_grand_item' && id !== 'intro_apply_btn') return;

    const measure = () => {
      grandItemRef.current?.measureInWindow?.((x, y, w, h) => {
        if (w > 0 && h > 0) registerTarget('introGrandItem', { x, y, width: w, height: h });
      });
      applyBtnRef.current?.measureInWindow?.((x, y, w, h) => {
        if (w > 0 && h > 0) registerTarget('introApplyBtn', { x, y, width: w, height: h });
      });
    };

    // intro_grand_item에서 그랜드 위치로 자동 스크롤
    if (id === 'intro_grand_item') {
      setTimeout(() => {
        grandItemRef.current?.measureInWindow?.((gx, gy) => {
          scrollRef.current?.measureInWindow?.((sx, sy) => {
            const relative = gy - sy;
            scrollRef.current?.scrollTo({ y: Math.max(0, relative - 80), animated: true });
          });
        });
      }, 200);
    }

    measure();
    const interval = setInterval(measure, 500);
    return () => clearInterval(interval);
  }, [visible, tutorialStep?.id, registerTarget]);

  useEffect(() => {
    if (!visible) return;
    setSelected(selectedIntroId);
    setTapToOpen(selectedTapToOpen);
    const introType = INTRO_LIST.find(item => item.id === selectedIntroId)?.type;
    setActiveTab(introType === 'text' ? 'text' : 'door');
    setPlayKey(k => k + 1);
  }, [visible, selectedIntroId, selectedTapToOpen]);

  const handleTapToOpenChange = (val) => {
    setTapToOpen(val);
    setPlayKey(k => k + 1);
  };

  const IntroComponent = INTRO_OVERLAYS[selected];
  const activeIntros = INTRO_LIST.filter(item => item.id === 'none' || item.type === activeTab);
  const activeIntroCount = activeIntros.filter(item => item.id !== 'none').length;
  const isTextTab = activeTab === 'text';
  const selectedIntroType = INTRO_LIST.find(item => item.id === selected)?.type;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.navBar}>
          <TouchableOpacity style={s.backBtn} activeOpacity={0.6} onPress={onClose}>
            <Text style={s.backText}>‹ 뒤로</Text>
          </TouchableOpacity>
          <Text style={s.navTitle}>인트로 효과</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[s.scroll, { paddingBottom: (insets.bottom || 16) + 90 }]}
          showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            <Text style={s.heroTitle}>
              {isTextTab ? '어떤 문장으로\n초대하시겠습니까?' : '어떤 문을 열고\n초대하시겠습니까?'}
            </Text>
            <Text style={s.heroSub}>
              {isTextTab
                ? '어두운 페이드 위로 필기체 문장이 천천히 써지는 감성 인트로.'
                : '디자인 테마에 맞춘 프리미엄 도어.\n손끝에서 시작되는 웅장한 감동.'}
            </Text>
          </View>

          <View style={s.tabWrap}>
            {INTRO_TABS.map(tab => {
              const tabActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[s.tabBtn, tabActive && s.tabBtnActive]}
                  onPress={() => {
                    setActiveTab(tab.id);
                    const currentType = INTRO_LIST.find(item => item.id === selected)?.type;
                    if (selected !== 'none' && currentType !== tab.id) {
                      setSelected(tab.id === 'text' ? 'happily-script' : 'grand');
                    }
                    setPlayKey(p => p + 1);
                  }}
                  activeOpacity={0.82}
                >
                  <Text style={[s.tabText, tabActive && s.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.previewWrap}>
            <View style={[s.phone, { width: PHONE_W, height: PHONE_H }]}>
              <MockInvitation />
              {IntroComponent && (
                <IntroComponent key={playKey} containerW={PHONE_W} containerH={PHONE_H} tapToOpen={tapToOpen} />
              )}
              <View style={s.replayWrap} pointerEvents="box-none">
                <TouchableOpacity style={s.replayBtn} onPress={() => setPlayKey(p => p + 1)} activeOpacity={0.85}>
                  <Text style={s.replayIcon}>↺ </Text>
                  <Text style={s.replayText}>다시보기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {selected !== 'none' && (
            <View style={s.toggleSection}>
              <View style={s.toggleRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={s.toggleLabel}>눌러서 열기</Text>
                  <Text style={s.toggleDesc}>하객이 화면을 직접 터치해서 인트로를 지나갈 수 있어요</Text>
                </View>
                <Switch value={tapToOpen} onValueChange={handleTapToOpenChange}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#fff" ios_backgroundColor="#E5E5EA" />
              </View>
            </View>
          )}

          <View style={s.listWrap}>
            <Text style={s.listHeader}>
              {isTextTab ? `텍스트 인트로 (${activeIntroCount})` : `도어 컬렉션 (${activeIntroCount})`}
            </Text>
            <View style={s.listCard}>
              {activeIntros.map((intro, i) => {
                const isSel = selected === intro.id;
                const isGrand = intro.id === 'grand';
                return (
                  <View key={intro.id} ref={isGrand ? grandItemRef : null}>
                    <TouchableOpacity
                      style={[s.listItem, isSel && s.listItemSel]}
                      onPress={() => {
                        setSelected(intro.id);
                        setPlayKey(p => p + 1);
                        // 튜토리얼: 그랜드 탭 시 다음 스텝
                        if (isGrand && tutorialStep?.id === 'intro_grand_item') {
                          tutorialAdvance();
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={[s.listIcon, isSel && s.listIconSel]}>
                        <Text style={{ fontSize: 18 }}>{intro.emoji}</Text>
                      </View>
                      <View style={s.listInfo}>
                        <Text style={[s.listTitle, isSel && s.listTitleSel]}>{intro.title}</Text>
                        <Text style={s.listDesc} numberOfLines={1}>{intro.desc}</Text>
                      </View>
                      {isSel && <Text style={{ fontSize: 18, color: '#0071E3', fontWeight: '700' }}>✓</Text>}
                    </TouchableOpacity>
                    {i < activeIntros.length - 1 && <View style={s.sep} />}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={[s.cta, { paddingBottom: (insets.bottom || 0) + 16 }]}>
          <TouchableOpacity
            ref={applyBtnRef}
            style={s.ctaBtn}
            activeOpacity={0.88}
            onPress={() => {
              onSelect({ id: selected, tapToOpen });
              onClose();
              // 튜토리얼: 적용 탭 시 다음 스텝
              if (tutorialStep?.id === 'intro_apply_btn') {
                tutorialAdvance();
              }
            }}
          >
            <Text style={s.ctaBtnText}>
              {selected === 'none'
                ? '인트로 없이 적용하기'
                : selectedIntroType === 'text'
                  ? '이 인트로로 적용하기'
                  : '이 도어로 적용하기'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* 튜토리얼 오버레이 — 인트로 모달 전용 (그랜드/적용 포커스) */}
        <TutorialOverlay scope="introModal" />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F5F5F7' },
  scroll:  { paddingHorizontal: 16 },
  navBar:  { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, backgroundColor: 'rgba(245,245,247,0.97)',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  backBtn: { padding: 8, minWidth: 60 },
  backText:{ fontSize: 17, color: '#0071E3' },
  navTitle:{ fontSize: 16, fontWeight: '600', color: '#1d1d1f' },

  hero:      { paddingHorizontal: 8, paddingTop: 20, paddingBottom: 24 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#1d1d1f', lineHeight: 32, letterSpacing: -0.5, marginBottom: 10 },
  heroSub:   { fontSize: 14, color: '#86868b', lineHeight: 20 },

  tabWrap: {
    flexDirection: 'row',
    backgroundColor: '#E8E8ED',
    borderRadius: 999,
    padding: 4,
    marginHorizontal: 8,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: { fontSize: 14, color: '#6e6e73', fontWeight: '700', letterSpacing: -0.2 },
  tabTextActive: { color: '#1d1d1f' },

  previewWrap: { alignItems: 'center', paddingBottom: 24 },
  phone:       { borderRadius: 32, overflow: 'hidden', borderWidth: 8, borderColor: '#F2F2F7',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 12 },
  replayWrap:  { position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  replayBtn:   { backgroundColor: 'rgba(30,30,30,0.65)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, flexDirection: 'row', alignItems: 'center' },
  replayIcon:  { fontSize: 14, color: '#fff' },
  replayText:  { color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },

  toggleSection: { marginHorizontal: 8, marginBottom: 24 },
  toggleRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  toggleLabel:   { fontSize: 15, color: '#1d1d1f', fontWeight: '500', marginBottom: 3 },
  toggleDesc:    { fontSize: 12, color: '#86868b', lineHeight: 16 },

  listWrap:    { paddingHorizontal: 8 },
  listHeader:  { fontSize: 12, fontWeight: '600', color: '#86868b', marginLeft: 8, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 1 },
  listCard:    { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  listItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  listItemSel: { backgroundColor: 'rgba(0,113,227,0.04)' },
  listIcon:    { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F2F2F7',
    alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 },
  listIconSel: { backgroundColor: 'rgba(0,113,227,0.12)' },
  listInfo:    { flex: 1, paddingRight: 8 },
  listTitle:   { fontSize: 15, color: '#1d1d1f', fontWeight: '500', letterSpacing: -0.2, marginBottom: 2 },
  listTitleSel:{ color: '#0071E3', fontWeight: '600' },
  listDesc:    { fontSize: 12, color: '#86868b', letterSpacing: -0.1, lineHeight: 16 },
  sep:         { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e5ea', marginLeft: 68 },

  writeLineBox: {
    overflow: 'hidden',
    marginBottom: 1,
  },
  textIntroStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
  },
  textIntroPink: {
    color: '#d779d8',
    fontFamily: 'AAutoSignature',
    fontSize: 58,
    lineHeight: 70,
    fontWeight: '400',
    textAlign: 'center',
  },
  textIntroPinkCompact: {
    fontSize: 38,
    lineHeight: 48,
  },
  textIntroKorean: {
    color: '#b8d8a4',
    fontFamily: 'NanumBrushScript',
    fontSize: 43,
    lineHeight: 58,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  textIntroKoreanCompact: {
    fontSize: 28,
    lineHeight: 38,
  },
  textIntroHintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 74,
    alignItems: 'center',
  },
  textIntroTapMark: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  textIntroTapRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  textIntroTapDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#d779d8',
    shadowColor: '#d779d8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
    elevation: 6,
  },
  textIntroHintGuide: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 9,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  textIntroHintPillInner: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  textIntroHint: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  cta:       { position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 20, paddingTop: 12 },
  ctaBtn:    { backgroundColor: '#0071E3', height: 52, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0071E3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  ctaBtnText:{ fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: -0.3 },
});
