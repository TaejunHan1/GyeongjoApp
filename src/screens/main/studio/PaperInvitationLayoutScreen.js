// src/screens/main/studio/PaperInvitationLayoutScreen.js
// 종이 청첩장 만들기 2단계 — 사진·텍스트 위치/크기 직접 조정
// - 요소 탭으로 선택 → 드래그로 이동 → 하단 툴바로 크기 조정
// - 완성 누르면 Supabase 저장
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Platform,
  PanResponder,
  Animated,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, ClipPath, Path, Image as SvgImage } from 'react-native-svg';
import { TC } from '../guides/tossStyle';
import {
  createPaperInvitation,
  updatePaperInvitation,
  uploadInvitationPhoto,
} from '../../../lib/paperInvitationHelper';

// 계란 모양 path — 위가 좁고 아래가 넓은 비대칭 oval (vintage 템플릿 프레임 매칭)
const buildEggPath = (w, h) =>
  `M ${w / 2} 0 ` +
  `C ${w * 0.86} 0, ${w} ${h * 0.42}, ${w} ${h * 0.68} ` +
  `C ${w} ${h * 0.91}, ${w * 0.78} ${h}, ${w / 2} ${h} ` +
  `C ${w * 0.22} ${h}, 0 ${h * 0.91}, 0 ${h * 0.68} ` +
  `C 0 ${h * 0.42}, ${w * 0.14} 0, ${w / 2} 0 Z`;

const { width: SCREEN_W } = Dimensions.get('window');
// 카드 패딩 16 + 화면 여백 좌우 16
const CARD_INNER_PADDING = 16;
const A6_ASPECT_RATIO = 148 / 105;
const CANVAS_W = SCREEN_W - 32 - CARD_INNER_PADDING * 2;
const CANVAS_H = CANVAS_W * A6_ASPECT_RATIO;

// 사진 크기 최대값 — 캔버스를 넘어 크롭 효과처럼 확대 가능
const PHOTO_MAX = 500;
// 텍스트 글자 크기 범위
const TEXT_SIZE_MIN = 6;
const TEXT_SIZE_MAX = 150;
const BACK_DIVIDER_IDS = [
  'backInfoTopDivider',
  'backInfoBottomDivider',
  'backThanksDivider',
];
const isBackDivider = (id) => BACK_DIVIDER_IDS.includes(id);

const SERIF_FONT = 'NanumMyeongjo';
const NUMERIC_FONT = 'GowunDodum';

const normalizeSavedFontFamily = (fontFamily) => {
  if (!fontFamily) return fontFamily;
  if (['AppleMyungjo', 'Times New Roman', 'serif'].includes(fontFamily)) return SERIF_FONT;
  if (['Helvetica Neue', 'System', 'sans-serif'].includes(fontFamily)) return NUMERIC_FONT;
  return fontFamily;
};

const splitManualLines = (value) => String(value ?? '').split(/\r?\n/);

// 텍스트 색상 옵션 — 청첩장에 어울리는 톤
const COLOR_OPTIONS = [
  // 무채색
  { id: 'black', label: '검정', value: '#000000' },
  { id: 'ink', label: '먹', value: '#2C2A28' },
  { id: 'charcoal', label: '차콜', value: '#4A4A4A' },
  { id: 'gray', label: '회색', value: '#8E9197' },
  { id: 'lightgray', label: '연회색', value: '#C7C7C7' },
  { id: 'white', label: '흰색', value: '#FFFFFF' },
  // 갈색 톤
  { id: 'darkbrown', label: '진갈', value: '#4A2C20' },
  { id: 'brown', label: '갈색', value: '#3A2E22' },
  { id: 'mocha', label: '모카', value: '#6B4A3A' },
  { id: 'olive', label: '올리브', value: '#6B5B44' },
  { id: 'beige', label: '베이지', value: '#A89571' },
  { id: 'gold', label: '골드', value: '#A8895A' },
  // 컬러
  { id: 'wine', label: '와인', value: '#722F37' },
  { id: 'rose', label: '로즈', value: '#C8898E' },
  { id: 'pink', label: '핑크', value: '#F4A5B6' },
  { id: 'lightpink', label: '연핑크', value: '#F8DAD0' },
  { id: 'navy', label: '네이비', value: '#2C3E50' },
  { id: 'darkblue', label: '진청', value: '#1F3A5F' },
  { id: 'blue', label: '블루', value: '#3182F6' },
  { id: 'forest', label: '포레스트', value: '#3C5A4E' },
];

// 폰트 옵션 — 무료 폰트 (assets/fonts에 ttf + App.js에서 Font.loadAsync로 로드)
const FONT_OPTIONS = [
  // 한글
  { id: 'serif', label: '명조', sample: '가나', family: SERIF_FONT },
  { id: 'sans', label: '고딕', sample: '가나', family: NUMERIC_FONT },
  { id: 'nanum-myeongjo', label: '나눔명조', sample: '가나', family: 'NanumMyeongjo' },
  { id: 'hahmlet', label: '함렛', sample: '가나', family: 'Hahmlet' },
  { id: 'gowun-batang', label: '고운바탕', sample: '가나', family: 'GowunBatang' },
  { id: 'gowun-dodum', label: '고운돋움', sample: '가나', family: 'GowunDodum' },
  { id: 'sunflower', label: '선플라워', sample: '가나', family: 'Sunflower' },
  { id: 'black-han', label: '블랙한산스', sample: '가나', family: 'BlackHanSans' },
  { id: 'yeon-sung', label: '연성', sample: '가나', family: 'YeonSung' },
  { id: 'single-day', label: '싱글데이', sample: '가나', family: 'SingleDay' },
  // 영문
  { id: 'playfair', label: 'Playfair', sample: 'Aa', family: 'PlayfairDisplay' },
  { id: 'garamond', label: 'Garamond', sample: 'Aa', family: 'EBGaramond' },
  { id: 'cinzel', label: 'Cinzel', sample: 'Aa', family: 'Cinzel' },
  { id: 'great-vibes', label: 'Vibes', sample: 'Aa', family: 'Great Vibes' },
  { id: 'italianno', label: 'Italianno', sample: 'Aa', family: 'Italianno' },
  { id: 'dancing', label: 'Dancing', sample: 'Aa', family: 'DancingScript' },
  { id: 'tangerine', label: 'Tangerine', sample: 'Aa', family: 'Tangerine' },
];

const getPhotoRadius = (shape, w, radius) => {
  if (radius != null) return { borderRadius: radius };
  switch (shape) {
    case 'circle':
      return { borderRadius: w / 2 };
    case 'arch':
      return {
        borderTopLeftRadius: w / 2,
        borderTopRightRadius: w / 2,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
      };
    case 'oval':
      // 진짜 계란/타원: percentage borderRadius 로 양축 모두 풀라운드
      return { borderRadius: '50%' };
    default:
      return { borderRadius: 6 };
  }
};

const parseWeddingDate = (dateStr) => {
  const m = (dateStr || '').match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

function MiniCalendar({ dateStr, width, height }) {
  const date = parseWeddingDate(dateStr);
  if (!date) return null;

  const year = date.getFullYear();
  const month = date.getMonth();
  const selectedDay = date.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.max(35, Math.ceil((firstDay + daysInMonth) / 7) * 7);
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const horizontalPadding = Math.max(4, width * 0.035);
  const innerW = Math.max(1, width - horizontalPadding * 2);
  const cellW = innerW / 7;
  const headerH = height * 0.18;
  const weekdaysH = height * 0.13;
  const weekCount = cells.length / 7;
  const rowH = Math.max(1, (height - headerH - weekdaysH) / weekCount);
  const monthLabel = `${year}. ${String(month + 1).padStart(2, '0')}`;
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weeks = Array.from({ length: weekCount }, (_, row) =>
    cells.slice(row * 7, row * 7 + 7)
  );

  return (
    <View style={{ width, height, paddingHorizontal: horizontalPadding }}>
      <Text
        style={{
          height: headerH,
          textAlign: 'center',
          fontSize: Math.max(10, headerH * 0.55),
          fontWeight: '700',
          color: '#A96770',
          letterSpacing: 1.4,
          lineHeight: headerH,
        }}
      >
        {monthLabel}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((d, i) => (
          <Text
            key={`${d}-${i}`}
            style={{
              width: cellW,
              height: weekdaysH,
              textAlign: 'center',
              fontSize: Math.max(6, weekdaysH * 0.42),
              fontWeight: '700',
              color: i === 0 ? '#C98B92' : '#3A3732',
              lineHeight: weekdaysH,
            }}
          >
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, rowIndex) => (
        <View key={`week-${rowIndex}`} style={{ flexDirection: 'row', width: innerW }}>
          {week.map((day, colIndex) => {
            const selected = day === selectedDay;
            return (
              <View
                key={`day-${rowIndex}-${colIndex}`}
                style={{
                  width: cellW,
                  height: rowH,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text
                      style={{
                        fontSize: Math.max(18, rowH * 1.22),
                        color: '#F1B7BE',
                        lineHeight: Math.max(18, rowH * 1.18),
                      }}
                    >
                      ♥
                    </Text>
                    <Text
                      style={{
                        position: 'absolute',
                        fontSize: Math.max(6, rowH * 0.34),
                        fontWeight: '900',
                        color: '#4A3838',
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      fontSize: Math.max(7, rowH * 0.42),
                      fontWeight: '500',
                      color: day ? (colIndex === 0 ? '#C98B92' : '#3A3732') : 'transparent',
                    }}
                  >
                    {day || ''}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// 드래그 가능한 요소
function DraggableElement({
  id,
  selected,
  onSelect,
  initialX,
  initialY,
  width,
  height,
  onMoveEnd,
  onDragStart,
  onDragEnd,
  zIndex,
  locked,
  rotation = 0,
  children,
}) {
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const positionRef = useRef({ x: initialX, y: initialY });
  // PanResponder는 한 번만 생성 → ref로 최신 locked 추적
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  // initialX/Y가 외부에서 바뀌면 동기화 (size 조정 등)
  React.useEffect(() => {
    pan.setValue({ x: initialX, y: initialY });
    positionRef.current = { x: initialX, y: initialY };
  }, [initialX, initialY]);

  const responder = useRef(
    PanResponder.create({
      // 항상 제스처 잡음 → 잠금이어도 선택은 가능
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        // 선택은 항상
        onSelect(id);
        // 잠금이면 드래그 시작/오프셋 세팅 안 함 → 박스 안 움직임
        if (lockedRef.current) return;
        onDragStart?.();
        pan.setOffset(positionRef.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (lockedRef.current) return;
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (lockedRef.current) return;
        pan.flattenOffset();
        const newX = positionRef.current.x + g.dx;
        const newY = positionRef.current.y + g.dy;
        positionRef.current = { x: newX, y: newY };
        onMoveEnd(id, newX, newY);
        onDragEnd?.();
      },
      onPanResponderTerminate: () => {
        if (lockedRef.current) return;
        pan.flattenOffset();
        onDragEnd?.();
      },
    })
  ).current;

  return (
    <Animated.View
      collapsable={false}
      pointerEvents="box-only"
      {...responder.panHandlers}
      style={{
        position: 'absolute',
        width,
        height,
        // 외부: 위치만 (Animated translate)
        transform: pan.getTranslateTransform(),
        zIndex: zIndex ?? 0,
        elevation: zIndex ?? 0,
      }}
    >
      <View
        style={[
          {
            width: '100%',
            height: '100%',
            // 내부: 회전만 (정적) — Animated와 분리해서 누락 방지
            transform: [{ rotate: `${rotation}deg` }],
          },
          selected && (locked ? s.selectedBorderLocked : s.selectedBorder),
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
}

// 누르고 있으면 빠르게 반복 — 미세조정/크기 조절 가속용
// 안전망: timeout/interval 별도 ref + unmount/terminate cleanup + 안전 횟수 제한
function HoldButton({ onPress, style, children }) {
  // onPress는 매 렌더마다 새 참조 → ref로 최신값 추적
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    // 혹시 이전 타이머가 살아있다면 먼저 정리
    stop();
    onPressRef.current();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      let count = 0;
      intervalRef.current = setInterval(() => {
        // 안전망: 최대 300회 (= 약 18초) 후 자동 중단
        if (count++ > 300) {
          stop();
          return;
        }
        onPressRef.current();
      }, 60);
    }, 320);
  }, [stop]);

  // 언마운트 / props 교체 시 정리
  useEffect(() => stop, [stop]);

  return (
    <Pressable
      onPressIn={start}
      onPressOut={stop}
      // 제스처가 ScrollView 등으로 가로채일 때도 정리
      onResponderTerminate={stop}
      onTouchCancel={stop}
      style={style}
      hitSlop={4}
    >
      {children}
    </Pressable>
  );
}

// 토스 스타일 슬라이더 — 의존성 없음, PanResponder 기반
function Slider({ value, min, max, onChange }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        if (trackWidth <= 0) return;
        const x = e.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / trackWidth));
        const next = Math.round(min + ratio * (max - min));
        if (next !== valueRef.current) onChange(next);
      },
      onPanResponderMove: (e) => {
        if (trackWidth <= 0) return;
        const x = e.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / trackWidth));
        const next = Math.round(min + ratio * (max - min));
        if (next !== valueRef.current) onChange(next);
      },
    })
  ).current;

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const fillW = trackWidth * Math.max(0, Math.min(1, ratio));

  return (
    <View
      style={sliderStyles.track}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...responder.panHandlers}
    >
      <View style={sliderStyles.trackBg} />
      <View style={[sliderStyles.trackFill, { width: fillW }]} />
      <View
        style={[
          sliderStyles.thumb,
          { left: Math.max(0, fillW - 12) },
        ]}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  track: {
    height: 24,
    justifyContent: 'center',
    flex: 1,
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8EAF0',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3182F6',
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#3182F6',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

export default function PaperInvitationLayoutScreen({ navigation, route }) {
  const { template, formData, editingId, editingLayout } = route.params;
  const isEditing = !!editingId;
  const hasBackSide = !!template.hasBack;
  const backData = formData.backData || editingLayout?.backData || {};
  const savedCanvasW =
    editingLayout?.canvas_w && editingLayout.canvas_w > 0
      ? editingLayout.canvas_w
      : null;

  // 저장된 layout(percent 기준)을 현재 캔버스 px 좌표로 복원
  const restoreFromSaved = (savedEl) => {
    if (!savedEl) return null;
    const out = {};
    if (savedEl.x != null) out.x = (savedEl.x / 100) * CANVAS_W;
    if (savedEl.y != null) out.y = (savedEl.y / 100) * CANVAS_H;
    if (savedEl.w != null) out.w = (savedEl.w / 100) * CANVAS_W;
    if (savedEl.h != null) out.h = (savedEl.h / 100) * CANVAS_H;
    if (savedEl.size_pct != null) {
      out.size = (savedEl.size_pct / 100) * CANVAS_W;
    } else if (savedEl.size != null) {
      out.size = savedCanvasW ? savedEl.size * (CANVAS_W / savedCanvasW) : savedEl.size;
    }
    if (savedEl.shape) out.shape = savedEl.shape;
    if (savedEl.radius != null) out.radius = savedEl.radius;
    if (savedEl.fontFamily) out.fontFamily = normalizeSavedFontFamily(savedEl.fontFamily);
    if (savedEl.letterSpacing != null) out.letterSpacing = savedEl.letterSpacing;
    if (savedEl.locked) out.locked = true;
    if (savedEl.rotation != null) out.rotation = savedEl.rotation;
    if (savedEl.color) out.color = savedEl.color;
    if (savedEl.bold) out.bold = true;
    return out;
  };

  // photo: x, y는 좌상단 기준 px (canvas 안에서)
  const photoConf = template.photo || { shape: 'rectangle', x: 50, y: 35, w: 50, h: 38 };
  const text = template.text || {};

  // 초기 위치를 percent → px 변환 (좌상단 기준)
  // shape='circle' 이면 정사각 픽셀로 강제 (캔버스 가로세로 비율 보정)
  const photoCenterX_px = (photoConf.x / 100) * CANVAS_W;
  const photoCenterY_px = (photoConf.y / 100) * CANVAS_H;
  const baseWPx = (photoConf.w / 100) * CANVAS_W;
  const baseHPx = (photoConf.h / 100) * CANVAS_H;

  // 사진 원본 비율(가로/세로) — 사용자가 업로드한 사진을 자르지 않고
  // 그 비율 그대로 사진 영역 크기를 맞춤. circle은 정사각 강제 유지.
  const aspect = formData.photoAspect;
  let photoWPx, photoHPx;

  if (photoConf.shape === 'circle') {
    photoWPx = baseWPx;
    photoHPx = baseWPx;
  } else if (aspect && aspect > 0) {
    // 템플릿 기본 영역의 대각선/면적을 비슷하게 유지하면서 사진 비율로 매핑
    if (aspect >= 1) {
      // 가로형 사진: 너비 기준
      photoWPx = baseWPx;
      photoHPx = baseWPx / aspect;
      // 영역이 캔버스 높이를 넘지 않게 안전장치
      if (photoHPx > CANVAS_H * 0.85) {
        photoHPx = CANVAS_H * 0.85;
        photoWPx = photoHPx * aspect;
      }
    } else {
      // 세로형 사진: 높이 기준
      photoHPx = baseHPx;
      photoWPx = baseHPx * aspect;
      if (photoWPx > CANVAS_W * 0.95) {
        photoWPx = CANVAS_W * 0.95;
        photoHPx = photoWPx / aspect;
      }
    }
  } else {
    // 사진 비율 모름 → 템플릿 기본 사용
    photoWPx = baseWPx;
    photoHPx = baseHPx;
  }

  const initPhoto = {
    w: photoWPx,
    h: photoHPx,
    x: photoCenterX_px - photoWPx / 2,
    y: photoCenterY_px - photoHPx / 2,
    shape: photoConf.shape,
    radius: photoConf.radius,
  };

  // 신랑·신부 각각 분리. 템플릿에 베이크인 "&" 있으면 connector 안 그림
  const hideConnector = !!text.names?.hideConnector;
  const namesY = ((text.names?.y || 70) / 100) * CANVAS_H;
  const namesSize = text.names?.size || 14;
  // 박스 너비를 35% 로 키워서 글자 크기 키워도 줄나눔 안 되게 함.
  // 박스 가운데 위치는 기존과 동일하게 유지 (좌측 25%, 우측 75% 또는 35%/65%).
  const NAME_W = CANVAS_W * 0.35;
  const NAME_HALF = NAME_W / 2;
  const initGroom = {
    x: hideConnector ? CANVAS_W * 0.27 - NAME_HALF : CANVAS_W * 0.37 - NAME_HALF,
    y: namesY,
    w: NAME_W,
    size: namesSize,
    color: text.names?.color,
  };
  const initBride = {
    x: hideConnector ? CANVAS_W * 0.73 - NAME_HALF : CANVAS_W * 0.63 - NAME_HALF,
    y: namesY,
    w: NAME_W,
    size: namesSize,
    color: text.names?.color,
  };
  const initConnector = {
    x: CANVAS_W * 0.46,
    y: namesY,
    w: CANVAS_W * 0.08,
    size: namesSize,
    color: text.names?.connectorColor,
  };
  const initDate = {
    x: 0,
    y: ((text.date?.y || 78) / 100) * CANVAS_H,
    size: text.date?.size || 9,
    w: CANVAS_W,
    color: text.date?.color,
  };
  const initVenue = {
    x: 0,
    y: ((text.venue?.y || 85) / 100) * CANVAS_H,
    size: text.venue?.size || 9,
    w: CANVAS_W,
    color: text.venue?.color,
  };
  // 큰 날짜 (월/일 두 줄) — 템플릿에 dateBig 정의된 경우만 사용
  const hasDateBig = !!text.dateBig;
  const initDateBig = {
    x: 0,
    y: ((text.dateBig?.y || 92) / 100) * CANVAS_H,
    size: text.dateBig?.size || 28,
    w: CANVAS_W,
    color: text.dateBig?.color,
  };
  // 인사말 — 템플릿에 greeting 정의된 경우만 (예: minimal-4의 "결 혼 합 니 다")
  const hasGreeting = !!text.greeting;
  const greetingText = text.greeting?.text || '';
  const initGreeting = {
    x: 0,
    y: ((text.greeting?.y || 8) / 100) * CANVAS_H,
    size: text.greeting?.size || 12,
    w: CANVAS_W,
    color: text.greeting?.color,
  };
  const backConf = template.back || {};
  const hasBackTitle = !!backConf.title;
  const makeBackText = (key, fallback) => {
    const conf = backConf[key] || fallback;
    return {
      x: ((conf.x ?? 10) / 100) * CANVAS_W,
      y: ((conf.y ?? 10) / 100) * CANVAS_H,
      w: ((conf.w ?? 80) / 100) * CANVAS_W,
      size: conf.size ?? 10,
      color: conf.color,
      fontFamily: conf.fontFamily ? normalizeSavedFontFamily(conf.fontFamily) : undefined,
      letterSpacing: conf.letterSpacing,
      bold: conf.bold,
    };
  };
  const makeBackBox = (key, fallback) => {
    const conf = backConf[key] || fallback;
    return {
      x: ((conf.x ?? 20) / 100) * CANVAS_W,
      y: ((conf.y ?? 60) / 100) * CANVAS_H,
      w: ((conf.w ?? 60) / 100) * CANVAS_W,
      h: ((conf.h ?? 24) / 100) * CANVAS_H,
      color: conf.color,
    };
  };
  const initBackInvitation = makeBackText('invitation', { x: 18, y: 15.2, w: 64, size: 9.5, color: '#3A3732' });
  const initBackTitle = makeBackText('title', { x: 18, y: 9.4, w: 64, size: 17, color: '#2C2A28', fontFamily: 'PlayfairDisplay', letterSpacing: 0 });
  const initBackGroomParents = makeBackText('groomParents', { x: 23, y: 39.7, w: 35, size: 8.5, color: '#3A3732' });
  const initBackBrideParents = makeBackText('brideParents', { x: 23, y: 44.1, w: 35, size: 8.5, color: '#3A3732' });
  const initBackGroomName = makeBackText('groomName', { x: 60, y: 39.3, w: 21, size: 13, color: '#2C2A28' });
  const initBackBrideName = makeBackText('brideName', { x: 60, y: 43.8, w: 21, size: 13, color: '#2C2A28' });
  const initBackDateLabel = makeBackText('dateLabel', { x: 24, y: 52, w: 18, size: 8.5, color: '#3A3732' });
  const initBackVenueLabel = makeBackText('venueLabel', { x: 24, y: 57.8, w: 18, size: 8.5, color: '#3A3732' });
  const initBackDate = makeBackText('date', { x: 37, y: 52, w: 48, size: 9, color: '#3A3732' });
  const initBackVenue = makeBackText('venue', { x: 37, y: 57.8, w: 55, size: 8.5, color: '#3A3732' });
  const initBackCalendar = makeBackBox('calendar', { x: 21, y: 65.5, w: 58, h: 21.5 });
  const initBackInfoTopDivider = makeBackBox('infoTopDivider', { x: 18, y: 49.6, w: 64, h: 0.16, color: '#B6B2AD' });
  const initBackInfoBottomDivider = makeBackBox('infoBottomDivider', { x: 18, y: 62.4, w: 64, h: 0.16, color: '#B6B2AD' });
  const initBackThanksDivider = makeBackBox('thanksDivider', { x: 18, y: 86.4, w: 64, h: 0.16, color: '#B6B2AD' });

  // 수정 모드: 저장된 layout이 있으면 그걸로 시작, 부족한 필드는 기본값
  const [layout, setLayout] = useState(() => {
    const saved = isEditing && editingLayout ? editingLayout : null;
    const merge = (defaultEl, savedKey) => {
      const restored = saved ? restoreFromSaved(saved[savedKey]) : null;
      return restored ? { ...defaultEl, ...restored } : defaultEl;
    };
    const mergeBack = (defaultEl, savedKey) => {
      const restored = saved?.back ? restoreFromSaved(saved.back[savedKey]) : null;
      return restored ? { ...defaultEl, ...restored } : defaultEl;
    };
    return {
      photo: merge(initPhoto, 'photo'),
      groom: merge(initGroom, 'groom'),
      connector: merge(initConnector, 'connector'),
      bride: merge(initBride, 'bride'),
      date: merge(initDate, 'date'),
      venue: merge(initVenue, 'venue'),
      dateBig: merge(initDateBig, 'dateBig'),
      greeting: merge(initGreeting, 'greeting'),
      backTitle: mergeBack(initBackTitle, 'title'),
      backInvitation: mergeBack(initBackInvitation, 'invitation'),
      backGroomParents: mergeBack(initBackGroomParents, 'groomParents'),
      backBrideParents: mergeBack(initBackBrideParents, 'brideParents'),
      backGroomName: mergeBack(initBackGroomName, 'groomName'),
      backBrideName: mergeBack(initBackBrideName, 'brideName'),
      backDateLabel: mergeBack(initBackDateLabel, 'dateLabel'),
      backVenueLabel: mergeBack(initBackVenueLabel, 'venueLabel'),
      backDate: mergeBack(initBackDate, 'date'),
      backVenue: mergeBack(initBackVenue, 'venue'),
      backCalendar: mergeBack(initBackCalendar, 'calendar'),
      backInfoTopDivider: mergeBack(initBackInfoTopDivider, 'infoTopDivider'),
      backInfoBottomDivider: mergeBack(initBackInfoBottomDivider, 'infoBottomDivider'),
      backThanksDivider: mergeBack(initBackThanksDivider, 'thanksDivider'),
    };
  });

  // formData.date_str ("2026.06.14 SAT") 에서 월·일 추출 → "06.\n14."
  const bigDateText = (() => {
    const m = (formData.date_str || '').match(/\d+\.(\d+)\.(\d+)/);
    if (!m) return '';
    return `${m[1]}.\n${m[2]}.`;
  })();
  const [selected, setSelected] = useState(null);
  const [activeSide, setActiveSide] = useState('front');
  const [resizeMode, setResizeMode] = useState('all'); // 'all' | 'w' | 'h' (사진만 적용)
  // 슬라이더 카드 안 카테고리 탭 — 한 번에 한 영역만 표시 (미리보기 잘 보이게)
  const [editTab, setEditTab] = useState('size'); // 'style' | 'size' | 'position' | 'rotation'

  // 요소 변경 시 기본 탭으로 (사진은 style 없음)
  useEffect(() => {
    setEditTab('size');
    if (isBackDivider(selected)) setResizeMode('w');
    if (selected === 'photo') setResizeMode('all');
  }, [selected]);
  useEffect(() => {
    setSelected(null);
  }, [activeSide]);
  const [dragging, setDragging] = useState(false);     // 드래그 중엔 스크롤 차단
  const [saving, setSaving] = useState(false);

  const handleMoveEnd = (id, x, y) => {
    setLayout((prev) => {
      const el = prev[id];
      if (!el || el.locked) return prev;
      return { ...prev, [id]: { ...el, x, y } };
    });
  };

  // 미세조정 — 1px 씩 이동 (잠금 시 차단)
  const nudge = (dx, dy) => {
    if (!selected) return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, x: el.x + dx, y: el.y + dy } };
    });
  };

  const getElementBox = (el) => {
    if (!el) return { w: 0, h: 0 };
    if (el.w != null || el.h != null) {
      return {
        w: el.w ?? CANVAS_W,
        h: el.h ?? (el.size ? el.size * 2.2 : 1),
      };
    }
    return {
      w: CANVAS_W,
      h: el.size ? el.size * 2.2 : 1,
    };
  };

  const alignSelected = (mode) => {
    if (!selected) return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      const box = getElementBox(el);
      const safeX = CANVAS_W * 0.08;
      const safeY = CANVAS_H * 0.06;
      const next = { ...el };

      if (mode === 'centerX') next.x = (CANVAS_W - box.w) / 2;
      if (mode === 'centerY') next.y = (CANVAS_H - box.h) / 2;
      if (mode === 'safeLeft') next.x = safeX;
      if (mode === 'safeRight') next.x = CANVAS_W - safeX - box.w;
      if (mode === 'safeTop') next.y = safeY;
      if (mode === 'safeBottom') next.y = CANVAS_H - safeY - box.h;

      return { ...prev, [selected]: next };
    });
  };

  const selectedMetrics = (() => {
    if (!selected) return null;
    const el = layout[selected];
    if (!el) return null;
    const box = getElementBox(el);
    const centerDeltaX = Math.round(el.x + box.w / 2 - CANVAS_W / 2);
    const centerDeltaY = Math.round(el.y + box.h / 2 - CANVAS_H / 2);
    const leftGap = Math.round(el.x);
    const rightGap = Math.round(CANVAS_W - el.x - box.w);
    const topGap = Math.round(el.y);
    const bottomGap = Math.round(CANVAS_H - el.y - box.h);
    return {
      centerDeltaX,
      centerDeltaY,
      leftGap,
      rightGap,
      topGap,
      bottomGap,
      horizontalGapDiff: Math.round(leftGap - rightGap),
      verticalGapDiff: Math.round(topGap - bottomGap),
      isCenterX: Math.abs(centerDeltaX) <= 1,
      isCenterY: Math.abs(centerDeltaY) <= 1,
      isEvenX: Math.abs(leftGap - rightGap) <= 1,
      isEvenY: Math.abs(topGap - bottomGap) <= 1,
    };
  })();

  // 잠금 토글 — 잠그면 드래그/미세조정/크기/폰트 모두 차단
  const toggleLock = () => {
    if (!selected) return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el) return prev;
      return { ...prev, [selected]: { ...el, locked: !el.locked } };
    });
  };

  // 회전 — 절대값 설정 (잠금 시 차단)
  const setRotation = (deg) => {
    if (!selected) return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      // -180 ~ 180 범위로 정규화
      let v = Math.round(deg);
      if (v > 180) v = 180;
      if (v < -180) v = -180;
      return { ...prev, [selected]: { ...el, rotation: v } };
    });
  };

  // 회전 — 미세조정 (잠금 시 차단)
  const adjustRotation = (delta) => {
    if (!selected) return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      const cur = el.rotation || 0;
      let v = cur + delta;
      if (v > 180) v = 180;
      if (v < -180) v = -180;
      return { ...prev, [selected]: { ...el, rotation: v } };
    });
  };

  // 회전 리셋 (잠금 시 차단)
  const resetRotation = () => {
    if (!selected) return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, rotation: 0 } };
    });
  };

  const adjustSize = (delta) => {
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;

      if (isBackDivider(selected)) {
        const step = delta * 6;
        if (resizeMode === 'h') {
          const newH = Math.max(1, Math.min(18, el.h + delta));
          return { ...prev, [selected]: { ...el, h: newH } };
        }
        const newW = Math.max(40, Math.min(CANVAS_W, el.w + step));
        return { ...prev, [selected]: { ...el, w: newW } };
      }

      if (selected === 'backCalendar') {
        const step = delta * 6;
        const ratio = el.h / el.w;
        const newW = Math.max(120, Math.min(CANVAS_W, el.w + step));
        return { ...prev, backCalendar: { ...el, w: newW, h: newW * ratio } };
      }

      if (selected === 'photo') {
        const step = delta * 6;
        const newW = Math.max(40, Math.min(PHOTO_MAX, el.w + step));

        // 원형: 항상 정사각 유지 (가로/세로 별도 조절 불가)
        if (el.shape === 'circle') {
          return { ...prev, photo: { ...el, w: newW, h: newW } };
        }
        if (resizeMode === 'w') {
          return { ...prev, photo: { ...el, w: newW } };
        }
        if (resizeMode === 'h') {
          const newH = Math.max(40, Math.min(PHOTO_MAX, el.h + step));
          return { ...prev, photo: { ...el, h: newH } };
        }
        // all: 비율 유지
        const ratio = el.h / el.w;
        return { ...prev, photo: { ...el, w: newW, h: newW * ratio } };
      }

      // 텍스트: 글자 크기 조정
      const newSize = Math.max(TEXT_SIZE_MIN, Math.min(TEXT_SIZE_MAX, el.size + delta));
      return { ...prev, [selected]: { ...el, size: newSize } };
    });
  };

  // 폰트 변경 — 텍스트 요소에만 적용 (잠금 시 차단)
  const setFont = (family) => {
    if (!selected || selected === 'photo') return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, fontFamily: family } };
    });
  };

  // 색상 변경 — 텍스트 요소에만 적용 (잠금 시 차단)
  const setColor = (color) => {
    if (!selected || selected === 'photo') return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, color } };
    });
  };

  // 굵게 토글 — 텍스트 요소에만 적용 (잠금 시 차단)
  const toggleBold = () => {
    if (!selected || selected === 'photo') return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, bold: !el.bold } };
    });
  };

  // 슬라이더로 절대값 설정 (잠금 시 차단)
  const setSizeAbsolute = (value) => {
    setLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;

      if (selected === 'photo') {
        const newW = Math.max(40, Math.min(PHOTO_MAX, value));
        if (el.shape === 'circle') {
          return { ...prev, photo: { ...el, w: newW, h: newW } };
        }
        if (resizeMode === 'w') {
          return { ...prev, photo: { ...el, w: newW } };
        }
        if (resizeMode === 'h') {
          const newH = Math.max(40, Math.min(PHOTO_MAX, value));
          return { ...prev, photo: { ...el, h: newH } };
        }
        const ratio = el.h / el.w;
        return { ...prev, photo: { ...el, w: newW, h: newW * ratio } };
      }

      if (isBackDivider(selected)) {
        if (resizeMode === 'h') {
          const newH = Math.max(1, Math.min(18, value));
          return { ...prev, [selected]: { ...el, h: newH } };
        }
        const newW = Math.max(40, Math.min(CANVAS_W, value));
        return { ...prev, [selected]: { ...el, w: newW } };
      }

      if (selected === 'backCalendar') {
        const ratio = el.h / el.w;
        const newW = Math.max(120, Math.min(CANVAS_W, value));
        return { ...prev, backCalendar: { ...el, w: newW, h: newW * ratio } };
      }

      const newSize = Math.max(TEXT_SIZE_MIN, Math.min(TEXT_SIZE_MAX, value));
      return { ...prev, [selected]: { ...el, size: newSize } };
    });
  };

  // 현재 슬라이더 값/범위 계산
  const sliderConfig = (() => {
    if (!selected) return null;
    const el = layout[selected];
    if (!el) return null;
    if (selected === 'photo') {
      if (resizeMode === 'h') {
        return { value: Math.round(el.h), min: 40, max: PHOTO_MAX };
      }
      return { value: Math.round(el.w), min: 40, max: PHOTO_MAX };
    }
    if (isBackDivider(selected)) {
      if (resizeMode === 'h') return { value: Math.round(el.h), min: 1, max: 18 };
      return { value: Math.round(el.w), min: 40, max: CANVAS_W };
    }
    if (selected === 'backCalendar') {
      return { value: Math.round(el.w), min: 120, max: CANVAS_W };
    }
    return { value: el.size, min: TEXT_SIZE_MIN, max: TEXT_SIZE_MAX };
  })();

  // 잠금 여부 — 잠금 시 컨트롤 영역 시각적 비활성
  const isLocked = !!(selected && layout[selected]?.locked);
  const lockedDimStyle = isLocked ? { opacity: 0.4 } : null;
  const lockedPointer = isLocked ? 'none' : 'auto';

    const handleSave = async () => {
    setSaving(true);
    try {
      // 1) 사진 업로드 — 사용자가 새 사진을 골랐을 때만 업로드
      // 수정 모드에서 photoUri가 기존 supabase URL이면 그대로 재사용
      let photoUrl = null;
      if (formData.photoUri) {
        const isRemoteUrl = /^https?:\/\//i.test(formData.photoUri);
        if (isRemoteUrl) {
          photoUrl = formData.photoUri;
        } else {
          const upload = await uploadInvitationPhoto(formData.photoUri);
          if (upload.success) {
            photoUrl = upload.url;
          } else {
            console.warn('[handleSave] photo upload failed:', upload.error);
          }
        }
      }

      // 2) layout px → percent 로 정규화 후 저장
      const norm = (el, hasW = true) => ({
        x: (el.x / CANVAS_W) * 100,
        y: (el.y / CANVAS_H) * 100,
        ...(hasW && el.w != null ? { w: (el.w / CANVAS_W) * 100 } : {}),
        ...(el.h != null ? { h: (el.h / CANVAS_H) * 100 } : {}),
        ...(el.size != null
          ? {
              size: el.size,
              size_pct: (el.size / CANVAS_W) * 100,
            }
          : {}),
        ...(el.shape ? { shape: el.shape } : {}),
        ...(el.radius != null ? { radius: el.radius } : {}),
        ...(el.fontFamily ? { fontFamily: el.fontFamily } : {}),
        ...(el.letterSpacing != null ? { letterSpacing: el.letterSpacing } : {}),
        ...(el.locked ? { locked: true } : {}),
        ...(el.rotation ? { rotation: el.rotation } : {}),
        ...(el.color ? { color: el.color } : {}),
        ...(el.bold ? { bold: true } : {}),
      });
      const normalizedLayout = {
        canvas_w: CANVAS_W, // 저장 시점 캔버스 너비 (px) — 스케일 기준
        photo: norm(layout.photo),
        groom: norm(layout.groom),
        bride: norm(layout.bride),
        date: norm(layout.date),
        venue: norm(layout.venue),
        ...(hideConnector ? {} : { connector: norm(layout.connector) }),
        ...(hasDateBig ? { dateBig: norm(layout.dateBig) } : {}),
        ...(hasGreeting ? { greeting: norm(layout.greeting) } : {}),
        ...(hasBackSide
          ? {
              backData,
              back: {
                ...(hasBackTitle ? { title: norm(layout.backTitle) } : {}),
                invitation: norm(layout.backInvitation),
                groomParents: norm(layout.backGroomParents),
                brideParents: norm(layout.backBrideParents),
                groomName: norm(layout.backGroomName),
                brideName: norm(layout.backBrideName),
                dateLabel: norm(layout.backDateLabel),
                venueLabel: norm(layout.backVenueLabel),
                date: norm(layout.backDate),
                venue: norm(layout.backVenue),
                calendar: norm(layout.backCalendar),
                infoTopDivider: norm(layout.backInfoTopDivider),
                infoBottomDivider: norm(layout.backInfoBottomDivider),
                thanksDivider: norm(layout.backThanksDivider),
              },
            }
          : {}),
      };

      // 3) DB insert 또는 update
      const payload = {
        template_id: template.id,
        category: template.category,
        groom: formData.groom,
        bride: formData.bride,
        date_str: formData.date_str,
        time_str: formData.time_str,
        venue: formData.venue,
        address: formData.address,
        photo_url: photoUrl,
        layout: normalizedLayout,
      };
      const result = isEditing
        ? await updatePaperInvitation(editingId, payload)
        : await createPaperInvitation(payload);

      if (!result.success) {
        Alert.alert(
          isEditing ? '수정 실패' : '저장 실패',
          result.error || (isEditing ? '수정에 실패했습니다.' : '저장에 실패했습니다.')
        );
        setSaving(false);
        return;
      }

      Alert.alert(
        isEditing ? '수정 완료' : '저장 완료',
        isEditing ? '청첩장이 수정되었습니다.' : '청첩장이 저장되었습니다.',
        [
          {
            text: '목록 보기',
            onPress: () => {
              navigation.popToTop();
              setTimeout(() => navigation.navigate('SavedInvitations'), 100);
            },
          },
          {
            text: '확인',
            style: 'cancel',
            onPress: () => navigation.popToTop(),
          },
        ]
      );
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setSaving(false);
    }
    };

  const renderBackTextElement = (id, value, options = {}) => {
    const el = layout[id];
    if (!el || !value) return null;
    const manualLines = options.preserveManualLines ? splitManualLines(value) : null;
    const lineCount = manualLines ? Math.max(1, manualLines.length) : options.lines || 1;
    const lineHeight = lineCount === 1 ? el.size * 2.2 : el.size * 1.55;
    return (
      <DraggableElement
        id={id}
        selected={selected === id}
        onSelect={setSelected}
        initialX={el.x}
        initialY={el.y}
        width={Math.max(el.w, options.minWidth || 0)}
        height={manualLines ? lineHeight * lineCount : el.size * (lineCount === 1 ? 2.2 : lineCount * 1.45)}
        onMoveEnd={handleMoveEnd}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        locked={el.locked}
        rotation={el.rotation}
        zIndex={4}
      >
        {manualLines ? (
          <View pointerEvents="none" style={{ width: '100%' }}>
            {manualLines.map((line, idx) => (
              <Text
                key={`${id}-line-${idx}`}
                numberOfLines={1}
                ellipsizeMode="clip"
                style={{
                  textAlign: options.align || 'center',
                  fontFamily: el.fontFamily || SERIF_FONT,
                  fontSize: el.size,
                  lineHeight,
                  color: el.color || options.color || '#3A3732',
                  fontWeight: el.bold ? '900' : options.weight || '500',
                  letterSpacing: el.letterSpacing ?? options.letterSpacing ?? 0,
                }}
              >
                {line || ' '}
              </Text>
            ))}
          </View>
        ) : (
          <Text
            numberOfLines={lineCount === 1 ? 1 : undefined}
            style={{
              textAlign: options.align || 'center',
              fontFamily: el.fontFamily || SERIF_FONT,
              fontSize: el.size,
              lineHeight: lineCount === 1 ? undefined : el.size * 1.55,
              color: el.color || options.color || '#3A3732',
              fontWeight: el.bold ? '900' : options.weight || '500',
              letterSpacing: el.letterSpacing ?? options.letterSpacing ?? 0,
            }}
          >
            {value}
          </Text>
        )}
      </DraggableElement>
    );
  };

  const renderBackDividerElement = (id) => {
    const el = layout[id];
    if (!el) return null;

    return (
      <DraggableElement
        id={id}
        selected={selected === id}
        onSelect={setSelected}
        initialX={el.x}
        initialY={el.y}
        width={el.w}
        height={Math.max(el.h + 12, 18)}
        onMoveEnd={handleMoveEnd}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        locked={el.locked}
        rotation={el.rotation}
        zIndex={4}
      >
        <View
          pointerEvents="none"
          style={{
            width: '100%',
            height: Math.max(el.h, 1),
            marginTop: 6,
            backgroundColor: el.color || '#B6B2AD',
          }}
        />
      </DraggableElement>
    );
  };

  const formatParentLine = (father, mother, childLabel) => {
    const names = [father, mother].map((v) => (v || '').trim()).filter(Boolean);
    if (names.length === 0) return childLabel;
    return `${names.join(' · ')}의 ${childLabel}`;
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      {/* 헤더 — 저장 버튼 우측 인라인 */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={TC.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? '청첩장 수정' : '청첩장 만들기'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.headerSaveBtn}
        >
          <Text style={[s.headerSaveText, saving && { opacity: 0.4 }]}>
            {saving ? '저장 중' : '저장'}
          </Text>
        </TouchableOpacity>
        </View>

        {hasBackSide && (
          <View style={s.sideSwitch}>
            {[
              { id: 'front', label: '앞면' },
              { id: 'back', label: '뒷면' },
            ].map((side) => {
              const active = activeSide === side.id;
              return (
                <TouchableOpacity
                  key={side.id}
                  style={[s.sideSwitchBtn, active && s.sideSwitchBtnActive]}
                  onPress={() => setActiveSide(side.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.sideSwitchText, active && s.sideSwitchTextActive]}>
                    {side.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 캔버스 — 토스 스타일 흰색 카드, 가운데 정렬, 필요시만 스크롤 */}
        <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!dragging}
      >
      <View style={s.canvasCard}>
        <Pressable
          onPress={() => setSelected(null)}
          style={[
            s.canvas,
            {
              width: CANVAS_W,
              height: CANVAS_H,
              backgroundColor: template.bgColor || '#FFFFFF',
            },
            ]}
          >
          {activeSide === 'front' ? (
            <>
            {/* 사진 — blank.png 아래 layer (cutout 템플릿이면 사진이 구멍으로 비침) */}
            <DraggableElement
            id="photo"
            selected={selected === 'photo'}
            onSelect={setSelected}
            initialX={layout.photo.x}
            initialY={layout.photo.y}
            width={layout.photo.w}
            height={layout.photo.h}
            onMoveEnd={handleMoveEnd}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            locked={layout.photo.locked}
            rotation={layout.photo.rotation}
            zIndex={1}
          >
            {layout.photo.shape === 'oval' ? (
              // 계란 모양: SVG 클립 패스로 비대칭 oval 렌더
              <Svg
                pointerEvents="none"
                width={layout.photo.w}
                height={layout.photo.h}
                style={{ overflow: 'visible' }}
              >
                <Defs>
                  <ClipPath id="eggClip">
                    <Path d={buildEggPath(layout.photo.w, layout.photo.h)} />
                  </ClipPath>
                </Defs>
                <Path
                  d={buildEggPath(layout.photo.w, layout.photo.h)}
                  fill="rgba(168,149,119,0.15)"
                />
                {formData.photoUri && (
                  <SvgImage
                    href={{ uri: formData.photoUri }}
                    x={0}
                    y={0}
                    width={layout.photo.w}
                    height={layout.photo.h}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#eggClip)"
                  />
                )}
              </Svg>
            ) : (
              <View
                pointerEvents="none"
                style={[
                  {
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(168,149,119,0.15)',
                  },
                  getPhotoRadius(layout.photo.shape, layout.photo.w, layout.photo.radius),
                ]}
              >
                {formData.photoUri ? (
                  <Image
                    pointerEvents="none"
                    source={{ uri: formData.photoUri }}
                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                  />
                ) : (
                  <View
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#A89577', fontSize: 12, letterSpacing: 1 }}>
                      PHOTO
                    </Text>
                  </View>
                )}
              </View>
            )}
          </DraggableElement>

          {/* 빈 템플릿 — 사진 위 layer. pointerEvents="none" 으로 터치는 사진/캔버스로 통과 */}
          {/* cover: 템플릿 PNG가 캔버스를 가득 채워 흰 띠 없음 → 사진이 캔버스 밖으로 나가면 잘림이 명확 */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: CANVAS_W,
              height: CANVAS_H,
              zIndex: 2,
              elevation: 2,
            }}
          >
            <Image
              pointerEvents="none"
              source={template.blank}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* 베이크인 요소 가리는 마스크 (& 등) — 템플릿 위에 얹힘 */}
          {(template.masks || []).map((m, i) => (
            <View
              key={`mask-${i}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: ((m.x - m.w / 2) / 100) * CANVAS_W,
                top: ((m.y - m.h / 2) / 100) * CANVAS_H,
                width: (m.w / 100) * CANVAS_W,
                height: (m.h / 100) * CANVAS_H,
                backgroundColor: template.bgColor || '#FBF9F3',
                zIndex: 3,
                elevation: 3,
              }}
            />
          ))}

          {/* 신랑 — 별도 드래그. 박스 너비를 글자 크기에 비례하게 늘려 줄나눔/잘림 방지 */}
          <DraggableElement
            id="groom"
            selected={selected === 'groom'}
            onSelect={setSelected}
            initialX={layout.groom.x}
            initialY={layout.groom.y}
            width={Math.max(layout.groom.w, (layout.groom.size || 14) * 5)}
            height={layout.groom.size * 2.2}
            onMoveEnd={handleMoveEnd}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            locked={layout.groom.locked}
            rotation={layout.groom.rotation}
            zIndex={4}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
              style={{
                textAlign: 'center',
                fontFamily: layout.groom.fontFamily || SERIF_FONT,
                fontSize: layout.groom.size,
                color: layout.groom.color || '#3A2E22',
                fontWeight: layout.groom.bold ? '900' : '500',
              }}
            >
              {formData.groom}
            </Text>
          </DraggableElement>

          {/* & 커넥터 — 템플릿에 베이크인 안 되어있을 때만 */}
          {!hideConnector && (
            <DraggableElement
              id="connector"
              selected={selected === 'connector'}
              onSelect={setSelected}
              initialX={layout.connector.x}
              initialY={layout.connector.y}
              width={Math.max(layout.connector.w, (layout.connector.size || 14) * 1.5)}
              height={layout.connector.size * 2.2}
              onMoveEnd={handleMoveEnd}
              locked={layout.connector.locked}
              rotation={layout.connector.rotation}
              zIndex={4}
            >
              <Text
                numberOfLines={1}
                style={{
                  textAlign: 'center',
                  fontFamily: layout.connector.fontFamily || SERIF_FONT,
                  fontSize: layout.connector.size * 0.95,
                  color: layout.connector.color || '#A89571',
                  fontWeight: layout.connector.bold ? '900' : '300',
                }}
              >
                &
              </Text>
            </DraggableElement>
          )}

          {/* 신부 — 별도 드래그. 박스 너비 동적 확장 (이름 길이/크기 대응) */}
          <DraggableElement
            id="bride"
            selected={selected === 'bride'}
            onSelect={setSelected}
            initialX={layout.bride.x}
            initialY={layout.bride.y}
            width={Math.max(layout.bride.w, (layout.bride.size || 14) * 5)}
            height={layout.bride.size * 2.2}
            onMoveEnd={handleMoveEnd}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            locked={layout.bride.locked}
            rotation={layout.bride.rotation}
            zIndex={4}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
              style={{
                textAlign: 'center',
                fontFamily: layout.bride.fontFamily || SERIF_FONT,
                fontSize: layout.bride.size,
                color: layout.bride.color || '#3A2E22',
                fontWeight: layout.bride.bold ? '900' : '500',
              }}
            >
              {formData.bride}
            </Text>
          </DraggableElement>

          {/* 날짜 */}
          <DraggableElement
            id="date"
            selected={selected === 'date'}
            onSelect={setSelected}
            initialX={layout.date.x}
            initialY={layout.date.y}
            width={layout.date.w}
            height={layout.date.size * 2.2}
            onMoveEnd={handleMoveEnd}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            locked={layout.date.locked}
            rotation={layout.date.rotation}
            zIndex={4}
          >
            <Text
              style={{
                textAlign: 'center',
                fontFamily: layout.date.fontFamily || NUMERIC_FONT,
                fontSize: layout.date.size,
                color: layout.date.color || '#6B5B44',
                letterSpacing: 1.2,
                fontWeight: layout.date.bold ? '900' : '600',
              }}
            >
              {formData.date_str}  {formData.time_str}
            </Text>
          </DraggableElement>

          {/* 장소 — 입력했을 때만 표시 (선택사항) */}
          {!!formData.venue && (() => {
            const venueLines = splitManualLines(formData.venue);
            const venueLineHeight = layout.venue.size * 1.55;
            return (
            <DraggableElement
              id="venue"
              selected={selected === 'venue'}
              onSelect={setSelected}
              initialX={layout.venue.x}
              initialY={layout.venue.y}
              width={layout.venue.w}
              height={Math.max(layout.venue.size * 2.2, venueLineHeight * venueLines.length)}
              onMoveEnd={handleMoveEnd}
              onDragStart={() => setDragging(true)}
              onDragEnd={() => setDragging(false)}
              locked={layout.venue.locked}
              rotation={layout.venue.rotation}
              zIndex={4}
            >
              <View pointerEvents="none" style={{ width: '100%' }}>
                {venueLines.map((line, idx) => (
                  <Text
                    key={`venue-line-${idx}`}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                    style={{
                      textAlign: 'center',
                      fontFamily: layout.venue.fontFamily || SERIF_FONT,
                      fontSize: layout.venue.size,
                      lineHeight: venueLineHeight,
                      color: layout.venue.color || '#6B5B44',
                      fontWeight: layout.venue.bold ? '900' : '500',
                    }}
                  >
                    {line || ' '}
                  </Text>
                ))}
              </View>
            </DraggableElement>
            );
          })()}

          {/* 큰 날짜 (월/일 두 줄) — 템플릿에 dateBig 정의되고 일시 선택했을 때만 표시 */}
          {hasDateBig && bigDateText !== '' && (
            <DraggableElement
              id="dateBig"
              selected={selected === 'dateBig'}
              onSelect={setSelected}
              initialX={layout.dateBig.x}
              initialY={layout.dateBig.y}
              width={layout.dateBig.w}
              height={layout.dateBig.size * 2.6}
              onMoveEnd={handleMoveEnd}
              onDragStart={() => setDragging(true)}
              onDragEnd={() => setDragging(false)}
              locked={layout.dateBig.locked}
              rotation={layout.dateBig.rotation}
              zIndex={4}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: layout.dateBig.fontFamily || SERIF_FONT,
                  fontSize: layout.dateBig.size,
                  color: layout.dateBig.color || '#2C2A28',
                  fontWeight: layout.dateBig.bold ? '900' : '300',
                  letterSpacing: 1,
                  lineHeight: layout.dateBig.size * 1.1,
                }}
              >
                {bigDateText}
              </Text>
            </DraggableElement>
          )}

          {/* 인사말 — 템플릿이 greeting 정의한 경우만 (예: minimal-4 "결 혼 합 니 다") */}
          {hasGreeting && (
            <DraggableElement
              id="greeting"
              selected={selected === 'greeting'}
              onSelect={setSelected}
              initialX={layout.greeting.x}
              initialY={layout.greeting.y}
              width={layout.greeting.w}
              height={layout.greeting.size * 2.2}
              onMoveEnd={handleMoveEnd}
              onDragStart={() => setDragging(true)}
              onDragEnd={() => setDragging(false)}
              locked={layout.greeting.locked}
              rotation={layout.greeting.rotation}
              zIndex={4}
            >
              <Text
                numberOfLines={1}
                style={{
                  textAlign: 'center',
                  fontFamily: layout.greeting.fontFamily || SERIF_FONT,
                  fontSize: layout.greeting.size,
                  color: layout.greeting.color || '#5A5854',
                  fontWeight: layout.greeting.bold ? '900' : '500',
                  letterSpacing: 1,
                }}
              >
                {greetingText}
                </Text>
              </DraggableElement>
            )}
            </>
          ) : (
            <>
              {template.backBlank ? (
                <Image
                  source={template.backBlank}
                  pointerEvents="none"
                  style={{ position: 'absolute', width: CANVAS_W, height: CANVAS_H }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  pointerEvents="none"
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: '#FFFDF9',
                  }}
                />
              )}

              {hasBackTitle && renderBackTextElement('backTitle', 'INVITATION', {
                letterSpacing: layout.backTitle?.letterSpacing ?? 0,
                weight: '400',
              })}
              {renderBackTextElement('backInvitation', backData.invitationText, {
                preserveManualLines: true,
                align: 'center',
                weight: '400',
                letterSpacing: 0.2,
              })}
              {renderBackTextElement(
                'backGroomParents',
                formatParentLine(
                  backData.groomFather || '아버님',
                  backData.groomMother || '어머님',
                  backData.groomRelation || '아들'
                ),
                {
                  align: 'left',
                  weight: '400',
                }
              )}
              {renderBackTextElement(
                'backBrideParents',
                formatParentLine(
                  backData.brideFather || '아버님',
                  backData.brideMother || '어머님',
                  backData.brideRelation || '딸'
                ),
                {
                  align: 'left',
                  weight: '400',
                }
              )}
              {renderBackTextElement('backGroomName', formData.groom, {
                letterSpacing: 2,
              })}
              {renderBackTextElement('backBrideName', formData.bride, {
                letterSpacing: 2,
              })}
              {renderBackTextElement('backDateLabel', '일  시  |', {
                align: 'left',
                weight: '500',
                minWidth: CANVAS_W * 0.18,
              })}
              {renderBackTextElement('backVenueLabel', '장  소  |', {
                align: 'left',
                weight: '500',
                minWidth: CANVAS_W * 0.18,
              })}
              {renderBackTextElement('backDate', `${formData.date_str} ${formData.time_str}`, {
                align: 'left',
                weight: '500',
              })}
              {!!formData.venue && renderBackTextElement('backVenue', formData.venue, {
                preserveManualLines: true,
                align: 'left',
                weight: '500',
              })}

              {renderBackDividerElement('backInfoTopDivider')}
              {renderBackDividerElement('backInfoBottomDivider')}
              {renderBackDividerElement('backThanksDivider')}

              <DraggableElement
                id="backCalendar"
                selected={selected === 'backCalendar'}
                onSelect={setSelected}
                initialX={layout.backCalendar.x}
                initialY={layout.backCalendar.y}
                width={layout.backCalendar.w}
                height={layout.backCalendar.h}
                onMoveEnd={handleMoveEnd}
                onDragStart={() => setDragging(true)}
                onDragEnd={() => setDragging(false)}
                locked={layout.backCalendar.locked}
                rotation={layout.backCalendar.rotation}
                zIndex={4}
              >
                <MiniCalendar
                  dateStr={formData.date_str}
                  width={layout.backCalendar.w}
                  height={layout.backCalendar.h}
                />
              </DraggableElement>
            </>
          )}

          {selected && (
            <View pointerEvents="none" style={s.guideLayer}>
              <View style={s.guideCenterV} />
              <View style={s.guideCenterH} />
              <View style={s.guideSafeBox} />
              <Text style={s.guideCenterVLabel}>세로 중앙</Text>
              <Text style={s.guideCenterHLabel}>가로 중앙</Text>
              <Text style={s.guideSafeLabel}>권장 여백</Text>
            </View>
          )}
          </Pressable>
      </View>
      </ScrollView>

        {/* 요소 선택 탭 — 큰 카드형 4분할 그리드 (토스 스타일) */}
        <View style={s.tabsCard}>
          {(activeSide === 'front'
            ? [
                { id: 'photo', label: '사진', icon: 'image-outline' },
                { id: 'groom', label: '신랑', icon: 'person-outline' },
                ...(hideConnector
                  ? []
                  : [{ id: 'connector', label: '&', icon: 'remove-outline' }]),
                { id: 'bride', label: '신부', icon: 'person-outline' },
                { id: 'date', label: '일시', icon: 'calendar-outline' },
                ...(formData.venue
                  ? [{ id: 'venue', label: '장소', icon: 'location-outline' }]
                  : []),
                ...(hasDateBig && bigDateText
                  ? [{ id: 'dateBig', label: '큰 날짜', icon: 'calendar' }]
                  : []),
                ...(hasGreeting
                  ? [{ id: 'greeting', label: '인사말', icon: 'chatbox-outline' }]
                  : []),
            ]
          : [
              ...(hasBackTitle
                ? [{ id: 'backTitle', label: 'INVITATION', icon: 'text-outline' }]
                : []),
              { id: 'backInvitation', label: '초대문구', icon: 'chatbubble-ellipses-outline' },
              { id: 'backGroomParents', label: '신랑측', icon: 'people-outline' },
              { id: 'backGroomName', label: '신랑', icon: 'person-outline' },
              { id: 'backBrideParents', label: '신부측', icon: 'people-outline' },
              { id: 'backBrideName', label: '신부', icon: 'person-outline' },
              { id: 'backDateLabel', label: '일시 |', icon: 'text-outline' },
              { id: 'backDate', label: '일시', icon: 'time-outline' },
              { id: 'backVenueLabel', label: '장소 |', icon: 'text-outline' },
              ...(formData.venue
                ? [{ id: 'backVenue', label: '장소', icon: 'location-outline' }]
                : []),
              { id: 'backCalendar', label: '달력', icon: 'calendar-outline' },
              { id: 'backInfoTopDivider', label: '상단선', icon: 'remove-outline' },
              { id: 'backInfoBottomDivider', label: '하단선', icon: 'remove-outline' },
              { id: 'backThanksDivider', label: '감사선', icon: 'remove-outline' },
            ]).map((tab) => {
            const active = selected === tab.id;
            return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabItem}
              onPress={() => setSelected(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={22}
                color={active ? TC.blue : TC.inkMuted}
              />
              <Text style={[s.tabItemText, active && { color: TC.blue, fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

        {/* 슬라이더 카드 — 선택 시에만 */}
        {selected && sliderConfig && (() => {
          const selectedIsShapeOnly = selected === 'photo' || selected === 'backCalendar';
          const editTabs = [
            ...(!selectedIsShapeOnly ? [{ id: 'style', label: '꾸미기' }] : []),
            { id: 'size', label: '크기' },
            { id: 'position', label: '위치' },
            { id: 'rotation', label: '회전' },
        ];
        const currentTab = editTabs.some((t) => t.id === editTab) ? editTab : 'size';
        return (
          <View style={s.sliderCard}>
            {/* 카테고리 탭 + 잠금 버튼 (헤더에 항상) */}
            <View style={s.editTabsRow}>
              <View style={s.editTabs}>
                {editTabs.map((t) => {
                  const active = currentTab === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[s.editTabBtn, active && s.editTabBtnActive]}
                      onPress={() => setEditTab(t.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.editTabText, active && s.editTabTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={toggleLock}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={s.lockBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={layout[selected]?.locked ? 'lock-closed' : 'lock-open-outline'}
                  size={18}
                  color={layout[selected]?.locked ? TC.blue : TC.inkMuted}
                />
              </TouchableOpacity>
            </View>

            {/* 꾸미기 — 폰트 + 색상 (텍스트 요소만) */}
            {currentTab === 'style' && (
              <View style={[lockedDimStyle, { gap: 10 }]} pointerEvents={lockedPointer}>
                {/* 글씨체 + 굵게 토글 */}
                {!isBackDivider(selected) && (
                  <View style={s.fontSection}>
                    <View style={s.styleSectionHeader}>
                      <Text style={s.fontSectionLabel}>글씨체</Text>
                      <TouchableOpacity
                        style={[s.boldBtn, layout[selected]?.bold && s.boldBtnActive]}
                        onPress={toggleBold}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            s.boldBtnText,
                            layout[selected]?.bold && { color: '#FFFFFF' },
                          ]}
                        >
                          B
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fontRow}>
                      {FONT_OPTIONS.map((f) => {
                        const currentFamily = layout[selected]?.fontFamily || SERIF_FONT;
                        const active = currentFamily === f.family;
                        return (
                          <TouchableOpacity
                            key={f.id}
                            style={[s.fontChip, active && s.fontChipActive]}
                            onPress={() => setFont(f.family)}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.fontChipSample, { fontFamily: f.family }, active && { color: TC.blue }]}>
                              {f.sample}
                            </Text>
                            <Text style={[s.fontChipLabel, active && { color: TC.blue, fontWeight: '700' }]}>
                              {f.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                <View style={s.fontSection}>
                  <Text style={s.fontSectionLabel}>색상</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fontRow}>
                    {COLOR_OPTIONS.map((c) => {
                      const active = (layout[selected]?.color) === c.value;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[s.colorChip, active && s.colorChipActive]}
                          onPress={() => setColor(c.value)}
                          activeOpacity={0.7}
                        >
                          <View style={[s.colorSwatch, { backgroundColor: c.value }]} />
                          <Text style={[s.fontChipLabel, active && { color: TC.blue, fontWeight: '700' }]}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 크기 — 사진 모드 + 사이즈 슬라이더 */}
            {currentTab === 'size' && (
              <View style={[lockedDimStyle, { gap: 10 }]} pointerEvents={lockedPointer}>
                  {selected === 'photo' && layout.photo.shape !== 'circle' && (
                    <View style={s.modeRow}>
                    {[
                      { id: 'all', label: '전체' },
                      { id: 'w', label: '가로' },
                      { id: 'h', label: '세로' },
                    ].map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[s.modeBtn, resizeMode === m.id && s.modeBtnActive]}
                        onPress={() => setResizeMode(m.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.modeBtnText, resizeMode === m.id && s.modeBtnTextActive]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    </View>
                  )}
                  {isBackDivider(selected) && (
                    <View style={s.modeRow}>
                      {[
                        { id: 'w', label: '길이' },
                        { id: 'h', label: '두께' },
                      ].map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[s.modeBtn, resizeMode === m.id && s.modeBtnActive]}
                          onPress={() => setResizeMode(m.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.modeBtnText, resizeMode === m.id && s.modeBtnTextActive]}>
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View style={s.sliderHeader}>
                    <Text style={s.sliderLabel}>
                      {selected === 'photo'
                        ? layout.photo.shape === 'circle'
                          ? '사진 크기'
                        : resizeMode === 'w'
                            ? '가로 크기'
                            : resizeMode === 'h'
                              ? '세로 크기'
                              : '사진 크기'
                        : selected === 'backCalendar'
                          ? '달력 크기'
                          : isBackDivider(selected)
                            ? resizeMode === 'h'
                              ? '구분선 두께'
                              : '구분선 길이'
                        : '글자 크기'}
                    </Text>
                  <Text style={s.sliderValue}>{sliderConfig.value}</Text>
                </View>
                <View style={s.sliderRow}>
                  <HoldButton style={s.sliderIconBtn} onPress={() => adjustSize(-1)}>
                    <Ionicons name="remove" size={20} color={TC.inkMuted} />
                  </HoldButton>
                  <Slider
                    value={sliderConfig.value}
                    min={sliderConfig.min}
                    max={sliderConfig.max}
                    onChange={setSizeAbsolute}
                  />
                  <HoldButton style={s.sliderIconBtn} onPress={() => adjustSize(1)}>
                    <Ionicons name="add" size={20} color={TC.inkMuted} />
                  </HoldButton>
                </View>
              </View>
            )}

            {/* 위치 — 4방향 미세조정 (크게) */}
            {currentTab === 'position' && (
              <View style={[s.positionPad, lockedDimStyle]} pointerEvents={lockedPointer}>
                {selectedMetrics && (
                  <View style={s.measurePanel}>
                    <View style={s.measureRow}>
                      <Text style={s.measureLabel}>중앙</Text>
                      <Text
                        style={[
                          s.measureValue,
                          selectedMetrics.isCenterX && selectedMetrics.isCenterY && s.measureValueGood,
                        ]}
                      >
                        X {selectedMetrics.centerDeltaX > 0 ? '+' : ''}
                        {selectedMetrics.centerDeltaX}px · Y{' '}
                        {selectedMetrics.centerDeltaY > 0 ? '+' : ''}
                        {selectedMetrics.centerDeltaY}px
                      </Text>
                    </View>
                    <View style={s.measureRow}>
                      <Text style={s.measureLabel}>좌우</Text>
                      <Text
                        style={[
                          s.measureValue,
                          selectedMetrics.isEvenX && s.measureValueGood,
                        ]}
                      >
                        L {selectedMetrics.leftGap}px / R {selectedMetrics.rightGap}px
                      </Text>
                    </View>
                    <View style={s.measureRow}>
                      <Text style={s.measureLabel}>상하</Text>
                      <Text
                        style={[
                          s.measureValue,
                          selectedMetrics.isEvenY && s.measureValueGood,
                        ]}
                      >
                        T {selectedMetrics.topGap}px / B {selectedMetrics.bottomGap}px
                      </Text>
                    </View>
                  </View>
                )}
                <View style={s.alignQuickRow}>
                  {[
                    { id: 'centerX', label: '가로중앙' },
                    { id: 'centerY', label: '세로중앙' },
                    { id: 'safeLeft', label: '좌측여백' },
                    { id: 'safeRight', label: '우측여백' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={s.alignQuickBtn}
                      onPress={() => alignSelected(item.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.alignQuickText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.positionRow}>
                  <View style={s.positionSlot} />
                  <HoldButton style={s.positionBtn} onPress={() => nudge(0, -1)}>
                    <Ionicons name="chevron-up" size={20} color={TC.ink} />
                  </HoldButton>
                  <View style={s.positionSlot} />
                </View>
                <View style={s.positionRow}>
                  <HoldButton style={s.positionBtn} onPress={() => nudge(-1, 0)}>
                    <Ionicons name="chevron-back" size={20} color={TC.ink} />
                  </HoldButton>
                  <View style={s.positionCenter}>
                    <Ionicons name="move" size={18} color={TC.inkMuted} />
                  </View>
                  <HoldButton style={s.positionBtn} onPress={() => nudge(1, 0)}>
                    <Ionicons name="chevron-forward" size={20} color={TC.ink} />
                  </HoldButton>
                </View>
                <View style={s.positionRow}>
                  <View style={s.positionSlot} />
                  <HoldButton style={s.positionBtn} onPress={() => nudge(0, 1)}>
                    <Ionicons name="chevron-down" size={20} color={TC.ink} />
                  </HoldButton>
                  <View style={s.positionSlot} />
                </View>
              </View>
            )}

            {/* 회전 — 슬라이더 + -/+ + 0° 리셋 */}
            {currentTab === 'rotation' && (
              <View style={[lockedDimStyle, { gap: 10 }]} pointerEvents={lockedPointer}>
                <View style={s.sliderHeader}>
                  <Text style={s.sliderLabel}>회전</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={s.sliderValue}>{layout[selected]?.rotation || 0}°</Text>
                    <TouchableOpacity
                      onPress={resetRotation}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={s.lockBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="refresh-outline" size={18} color={TC.inkMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={s.sliderRow}>
                  <HoldButton style={s.sliderIconBtn} onPress={() => adjustRotation(-1)}>
                    <Ionicons name="arrow-undo" size={18} color={TC.inkMuted} />
                  </HoldButton>
                  <Slider
                    value={layout[selected]?.rotation || 0}
                    min={-180}
                    max={180}
                    onChange={setRotation}
                  />
                  <HoldButton style={s.sliderIconBtn} onPress={() => adjustRotation(1)}>
                    <Ionicons name="arrow-redo" size={18} color={TC.inkMuted} />
                  </HoldButton>
                </View>
              </View>
            )}
          </View>
        );
      })()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: TC.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: TC.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  // 헤더 우측 저장 버튼
  headerSaveBtn: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: TC.blue,
    letterSpacing: -0.3,
  },
  sideSwitch: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 4,
    backgroundColor: '#EDEFF3',
    borderRadius: 12,
  },
  sideSwitchBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  sideSwitchBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  sideSwitchText: {
    fontSize: 13,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  sideSwitchTextActive: {
    color: TC.ink,
  },

  // 캔버스 wrap — 배경/그림자 없이 템플릿 PNG만 보이도록
  canvasCard: {
    backgroundColor: 'transparent',
    padding: CARD_INNER_PADDING,
  },
  canvas: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 8,
    // 캔버스 영역 명확화 — 그림자로 떠있는 종이 느낌
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  guideLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    elevation: 99,
  },
  guideCenterV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(49,130,246,0.48)',
  },
  guideCenterH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(49,130,246,0.48)',
  },
  guideSafeBox: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: '6%',
    bottom: '6%',
    borderWidth: 1,
    borderColor: 'rgba(49,130,246,0.26)',
    borderStyle: 'dashed',
  },
  guideCenterVLabel: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(49,130,246,0.86)',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  guideCenterHLabel: {
    position: 'absolute',
    top: '50%',
    right: 8,
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(49,130,246,0.86)',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  guideSafeLabel: {
    position: 'absolute',
    left: '8%',
    top: '6%',
    marginTop: 4,
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: TC.blue,
    fontSize: 9,
    fontWeight: '900',
  },

  selectedBorder: {
    borderWidth: 1.5,
    borderColor: TC.blue,
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  selectedBorderLocked: {
    borderWidth: 1.5,
    borderColor: '#A0A0A0',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  lockBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  // 요소 탭 카드 — 흰색, 4분할 그리드
  tabsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabItem: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // 슬라이더 카드
  sliderCard: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 24 : 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // 사진 가로/세로/전체 모드 토글 (슬라이더 카드 안)
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#FFFFFF' },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  modeBtnTextActive: {
    color: TC.ink,
    fontWeight: '700',
  },

  // 폰트 선택 영역
  fontSection: {
    gap: 6,
  },
  fontSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TC.ink,
    letterSpacing: -0.3,
  },
  fontRow: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  fontChip: {
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fontChipActive: {
    backgroundColor: '#EAF3FF',
    borderColor: TC.blue,
  },
  fontChipSample: {
    fontSize: 18,
    color: TC.ink,
    marginBottom: 2,
    lineHeight: 22,
  },
  fontChipLabel: {
    fontSize: 10,
    color: TC.inkMuted,
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  // 꾸미기 섹션 헤더 (라벨 + 굵게 버튼)
  styleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boldBtn: {
    width: 32,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boldBtnActive: {
    backgroundColor: TC.ink,
  },
  boldBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: TC.ink,
  },

  // 색상 칩
  colorChip: {
    width: 56,
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  colorChipActive: {
    backgroundColor: '#EAF3FF',
    borderColor: TC.blue,
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },

  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TC.ink,
    letterSpacing: -0.3,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.3,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 위치 미세조정 — 슬라이더 카드 푸터
  nudgeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  nudgeFooterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  nudgeFooterBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  nudgeFooterBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 회전 섹션
  rotationSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    gap: 10,
  },

  // 카테고리 탭 (꾸미기 / 크기 / 위치 / 회전)
  editTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editTabs: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    padding: 3,
  },
  editTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  editTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  editTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  editTabTextActive: {
    color: TC.ink,
    fontWeight: '700',
  },

  // 위치 D-pad (크게, 직관적)
  positionPad: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  alignQuickRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 2,
  },
  measurePanel: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    gap: 5,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  measureLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: TC.inkMuted,
  },
  measureValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '800',
    color: TC.ink,
  },
  measureValueGood: {
    color: TC.blue,
  },
  alignQuickBtn: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F2F7FF',
    borderWidth: 1,
    borderColor: '#D8E8FF',
    alignItems: 'center',
  },
  alignQuickText: {
    fontSize: 12,
    fontWeight: '800',
    color: TC.blue,
    letterSpacing: -0.2,
  },
  positionRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  positionBtn: {
    width: 44,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionSlot: { width: 44, height: 38 },
  positionCenter: {
    width: 44,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
