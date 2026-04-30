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
const CANVAS_W = SCREEN_W - 32 - CARD_INNER_PADDING * 2;
const CANVAS_H = CANVAS_W * (1400 / 1024);

// 사진 크기 최대값 — 캔버스를 넘어 크롭 효과처럼 확대 가능
const PHOTO_MAX = 500;

const SERIF_FONT = Platform.select({ ios: 'AppleMyungjo', android: 'serif' });
const NUMERIC_FONT = Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' });

// 폰트 옵션 — 무료 폰트 (assets/fonts에 ttf + App.js에서 Font.loadAsync로 로드)
const FONT_OPTIONS = [
  { id: 'serif', label: '명조', sample: '가나', family: SERIF_FONT },
  { id: 'sans', label: '고딕', sample: '가나', family: NUMERIC_FONT },
  { id: 'nanum-myeongjo', label: '나눔명조', sample: '가나', family: 'NanumMyeongjo' },
  { id: 'gowun-batang', label: '고운바탕', sample: '가나', family: 'GowunBatang' },
  { id: 'gowun-dodum', label: '고운돋움', sample: '가나', family: 'GowunDodum' },
  { id: 'sunflower', label: '선플라워', sample: '가나', family: 'Sunflower' },
  { id: 'playfair', label: 'Playfair', sample: 'Aa', family: 'PlayfairDisplay' },
  { id: 'garamond', label: 'Garamond', sample: 'Aa', family: 'EBGaramond' },
  { id: 'great-vibes', label: 'Vibes', sample: 'Aa', family: 'Great Vibes' },
  { id: 'italianno', label: 'Italianno', sample: 'Aa', family: 'Italianno' },
];

const getPhotoRadius = (shape, w) => {
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
  children,
}) {
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const positionRef = useRef({ x: initialX, y: initialY });

  // initialX/Y가 외부에서 바뀌면 동기화 (size 조정 등)
  React.useEffect(() => {
    pan.setValue({ x: initialX, y: initialY });
    positionRef.current = { x: initialX, y: initialY };
  }, [initialX, initialY]);

  const responder = useRef(
    PanResponder.create({
      // 터치 시작 즉시 캡처 → 부모 ScrollView 가 제스처 가로채지 못하게
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // 다른 responder 가 제스처 가져가려 할 때 거절
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        onSelect(id);
        onDragStart?.();
        pan.setOffset(positionRef.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        const newX = positionRef.current.x + g.dx;
        const newY = positionRef.current.y + g.dy;
        positionRef.current = { x: newX, y: newY };
        onMoveEnd(id, newX, newY);
        onDragEnd?.();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        onDragEnd?.();
      },
    })
  ).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        {
          position: 'absolute',
          width,
          height,
          transform: pan.getTranslateTransform(),
          zIndex: zIndex ?? 0,
          elevation: zIndex ?? 0,
        },
        selected && s.selectedBorder,
      ]}
    >
      {children}
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

  // 저장된 layout(percent 기준)을 현재 캔버스 px 좌표로 복원
  const restoreFromSaved = (savedEl) => {
    if (!savedEl) return null;
    const out = {};
    if (savedEl.x != null) out.x = (savedEl.x / 100) * CANVAS_W;
    if (savedEl.y != null) out.y = (savedEl.y / 100) * CANVAS_H;
    if (savedEl.w != null) out.w = (savedEl.w / 100) * CANVAS_W;
    if (savedEl.h != null) out.h = (savedEl.h / 100) * CANVAS_H;
    if (savedEl.size != null) out.size = savedEl.size;
    if (savedEl.shape) out.shape = savedEl.shape;
    if (savedEl.fontFamily) out.fontFamily = savedEl.fontFamily;
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
  };

  // 신랑·신부 각각 분리. 템플릿에 베이크인 "&" 있으면 connector 안 그림
  const hideConnector = !!text.names?.hideConnector;
  const namesY = ((text.names?.y || 70) / 100) * CANVAS_H;
  const namesSize = text.names?.size || 14;
  const initGroom = {
    x: hideConnector ? CANVAS_W * 0.18 : CANVAS_W * 0.28,
    y: namesY,
    w: CANVAS_W * 0.18,
    size: namesSize,
  };
  const initBride = {
    x: hideConnector ? CANVAS_W * 0.64 : CANVAS_W * 0.54,
    y: namesY,
    w: CANVAS_W * 0.18,
    size: namesSize,
  };
  const initConnector = {
    x: CANVAS_W * 0.46,
    y: namesY,
    w: CANVAS_W * 0.08,
    size: namesSize,
  };
  const initDate = {
    x: 0,
    y: ((text.date?.y || 78) / 100) * CANVAS_H,
    size: text.date?.size || 9,
    w: CANVAS_W,
  };
  const initVenue = {
    x: 0,
    y: ((text.venue?.y || 85) / 100) * CANVAS_H,
    size: text.venue?.size || 9,
    w: CANVAS_W,
  };

  // 수정 모드: 저장된 layout이 있으면 그걸로 시작, 부족한 필드는 기본값
  const [layout, setLayout] = useState(() => {
    const saved = isEditing && editingLayout ? editingLayout : null;
    const merge = (defaultEl, savedKey) => {
      const restored = saved ? restoreFromSaved(saved[savedKey]) : null;
      return restored ? { ...defaultEl, ...restored } : defaultEl;
    };
    return {
      photo: merge(initPhoto, 'photo'),
      groom: merge(initGroom, 'groom'),
      connector: merge(initConnector, 'connector'),
      bride: merge(initBride, 'bride'),
      date: merge(initDate, 'date'),
      venue: merge(initVenue, 'venue'),
    };
  });
  const [selected, setSelected] = useState(null);
  const [resizeMode, setResizeMode] = useState('all'); // 'all' | 'w' | 'h' (사진만 적용)
  const [dragging, setDragging] = useState(false);     // 드래그 중엔 스크롤 차단
  const [saving, setSaving] = useState(false);

  const handleMoveEnd = (id, x, y) => {
    setLayout((prev) => ({ ...prev, [id]: { ...prev[id], x, y } }));
  };

  // 미세조정 — 1px 씩 이동
  const nudge = (dx, dy) => {
    if (!selected) return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el) return prev;
      return { ...prev, [selected]: { ...el, x: el.x + dx, y: el.y + dy } };
    });
  };

  const adjustSize = (delta) => {
    setLayout((prev) => {
      const el = prev[selected];
      if (!el) return prev;

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
      const newSize = Math.max(6, Math.min(36, el.size + delta));
      return { ...prev, [selected]: { ...el, size: newSize } };
    });
  };

  // 폰트 변경 — 텍스트 요소에만 적용
  const setFont = (family) => {
    if (!selected || selected === 'photo') return;
    setLayout((prev) => {
      const el = prev[selected];
      if (!el) return prev;
      return { ...prev, [selected]: { ...el, fontFamily: family } };
    });
  };

  // 슬라이더로 절대값 설정
  const setSizeAbsolute = (value) => {
    setLayout((prev) => {
      const el = prev[selected];
      if (!el) return prev;

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

      const newSize = Math.max(6, Math.min(36, value));
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
    return { value: el.size, min: 6, max: 36 };
  })();

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
        ...(el.size != null ? { size: el.size } : {}),
        ...(el.shape ? { shape: el.shape } : {}),
        ...(el.fontFamily ? { fontFamily: el.fontFamily } : {}),
      });
      const normalizedLayout = {
        canvas_w: CANVAS_W, // 저장 시점 캔버스 너비 (px) — 스케일 기준
        photo: norm(layout.photo),
        groom: norm(layout.groom),
        bride: norm(layout.bride),
        date: norm(layout.date),
        venue: norm(layout.venue),
        ...(hideConnector ? {} : { connector: norm(layout.connector) }),
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
          style={[s.canvas, { width: CANVAS_W, height: CANVAS_H }]}
        >
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
            zIndex={1}
          >
            {layout.photo.shape === 'oval' ? (
              // 계란 모양: SVG 클립 패스로 비대칭 oval 렌더
              <Svg
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
                style={[
                  {
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(168,149,119,0.15)',
                  },
                  getPhotoRadius(layout.photo.shape, layout.photo.w),
                ]}
              >
                {formData.photoUri ? (
                  <Image
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
          <Image
            source={template.blank}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: CANVAS_W,
              height: CANVAS_H,
              zIndex: 2,
              elevation: 2,
            }}
            resizeMode="contain"
          />

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

          {/* 신랑 — 별도 드래그 */}
          <DraggableElement
            id="groom"
            selected={selected === 'groom'}
            onSelect={setSelected}
            initialX={layout.groom.x}
            initialY={layout.groom.y}
            width={layout.groom.w}
            height={layout.groom.size * 2.2}
            onMoveEnd={handleMoveEnd}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            zIndex={4}
          >
            <Text
              style={{
                textAlign: 'center',
                fontFamily: layout.groom.fontFamily || SERIF_FONT,
                fontSize: layout.groom.size,
                color: '#3A2E22',
                fontWeight: '500',
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
              width={layout.connector.w}
              height={layout.connector.size * 2.2}
              onMoveEnd={handleMoveEnd}
              zIndex={4}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: layout.connector.fontFamily || SERIF_FONT,
                  fontSize: layout.connector.size * 0.95,
                  color: '#A89571',
                  fontWeight: '300',
                }}
              >
                &
              </Text>
            </DraggableElement>
          )}

          {/* 신부 — 별도 드래그 */}
          <DraggableElement
            id="bride"
            selected={selected === 'bride'}
            onSelect={setSelected}
            initialX={layout.bride.x}
            initialY={layout.bride.y}
            width={layout.bride.w}
            height={layout.bride.size * 2.2}
            onMoveEnd={handleMoveEnd}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            zIndex={4}
          >
            <Text
              style={{
                textAlign: 'center',
                fontFamily: layout.bride.fontFamily || SERIF_FONT,
                fontSize: layout.bride.size,
                color: '#3A2E22',
                fontWeight: '500',
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
            zIndex={4}
          >
            <Text
              style={{
                textAlign: 'center',
                fontFamily: layout.date.fontFamily || NUMERIC_FONT,
                fontSize: layout.date.size,
                color: '#6B5B44',
                letterSpacing: 1.2,
                fontWeight: '600',
              }}
            >
              {formData.date_str}  {formData.time_str}
            </Text>
          </DraggableElement>

          {/* 장소 — 입력했을 때만 표시 (선택사항) */}
          {!!formData.venue && (
            <DraggableElement
              id="venue"
              selected={selected === 'venue'}
              onSelect={setSelected}
              initialX={layout.venue.x}
              initialY={layout.venue.y}
              width={layout.venue.w}
              height={layout.venue.size * 2.2}
              onMoveEnd={handleMoveEnd}
              onDragStart={() => setDragging(true)}
              onDragEnd={() => setDragging(false)}
              zIndex={4}
            >
              <Text
                numberOfLines={1}
                style={{
                  textAlign: 'center',
                  fontFamily: layout.venue.fontFamily || SERIF_FONT,
                  fontSize: layout.venue.size,
                  color: '#6B5B44',
                  fontWeight: '500',
                }}
              >
                {formData.venue}
              </Text>
            </DraggableElement>
          )}
        </Pressable>
      </View>
      </ScrollView>

      {/* 요소 선택 탭 — 큰 카드형 4분할 그리드 (토스 스타일) */}
      <View style={s.tabsCard}>
        {[
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
        ].map((tab) => {
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
      {selected && sliderConfig && (
        <View style={s.sliderCard}>
          {/* 사진 가로/세로/전체 모드 */}
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

          {/* 폰트 선택 — 텍스트 요소일 때만 가로 스크롤 */}
          {selected !== 'photo' && (
            <View style={s.fontSection}>
              <Text style={s.fontSectionLabel}>글씨체</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.fontRow}
              >
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
                      <Text
                        style={[
                          s.fontChipSample,
                          { fontFamily: f.family },
                          active && { color: TC.blue },
                        ]}
                      >
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

          {/* 위치 미세조정 — 4방향 (작게) */}
          <View style={s.nudgeFooter}>
            <Text style={s.nudgeFooterLabel}>위치 미세조정</Text>
            <View style={s.nudgeFooterBtns}>
              <HoldButton style={s.nudgeFooterBtn} onPress={() => nudge(-1, 0)}>
                <Ionicons name="chevron-back" size={16} color={TC.ink} />
              </HoldButton>
              <HoldButton style={s.nudgeFooterBtn} onPress={() => nudge(0, -1)}>
                <Ionicons name="chevron-up" size={16} color={TC.ink} />
              </HoldButton>
              <HoldButton style={s.nudgeFooterBtn} onPress={() => nudge(0, 1)}>
                <Ionicons name="chevron-down" size={16} color={TC.ink} />
              </HoldButton>
              <HoldButton style={s.nudgeFooterBtn} onPress={() => nudge(1, 0)}>
                <Ionicons name="chevron-forward" size={16} color={TC.ink} />
              </HoldButton>
            </View>
          </View>
        </View>
      )}
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

  // 캔버스 — 토스 카드형 흰색 배경
  canvasCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: CARD_INNER_PADDING,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  canvas: {
    backgroundColor: '#FBF9F3',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 8,
  },

  selectedBorder: {
    borderWidth: 1.5,
    borderColor: TC.blue,
    borderStyle: 'dashed',
    borderRadius: 4,
  },

  // 요소 탭 카드 — 흰색, 4분할 그리드
  tabsCard: {
    flexDirection: 'row',
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
    flex: 1,
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
});
