// src/screens/main/studio/PaperInvitationLayoutScreen.js
// 종이 청첩장 만들기 2단계 — 사진·텍스트 위치/크기 직접 조정
// - 요소 탭으로 선택 → 드래그로 이동 → 하단 툴바로 크기 조정
// - 완성 누르면 Supabase 저장
import React, { useState, useRef } from 'react';
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
// 좌우 16px 만 여백 → 가능한 한 넓게 캔버스 확보 (장식 잘림 방지)
const CANVAS_W = SCREEN_W - 16;
const CANVAS_H = CANVAS_W * (1400 / 1024);

const SERIF_FONT = Platform.select({ ios: 'AppleMyungjo', android: 'serif' });
const NUMERIC_FONT = Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' });

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
        },
        selected && s.selectedBorder,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function PaperInvitationLayoutScreen({ navigation, route }) {
  const { template, formData } = route.params;

  // photo: x, y는 좌상단 기준 px (canvas 안에서)
  const photoConf = template.photo || { shape: 'rectangle', x: 50, y: 35, w: 50, h: 38 };
  const text = template.text || {};

  // 초기 위치를 percent → px 변환 (좌상단 기준)
  // shape='circle' 이면 정사각 픽셀로 강제 (캔버스 가로세로 비율 보정)
  const photoCenterX_px = (photoConf.x / 100) * CANVAS_W;
  const photoCenterY_px = (photoConf.y / 100) * CANVAS_H;
  const photoWPx = (photoConf.w / 100) * CANVAS_W;
  const photoHPx =
    photoConf.shape === 'circle'
      ? photoWPx // 원: w_px === h_px
      : (photoConf.h / 100) * CANVAS_H;

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

  const [layout, setLayout] = useState({
    photo: initPhoto,
    groom: initGroom,
    connector: initConnector,
    bride: initBride,
    date: initDate,
    venue: initVenue,
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
        const newW = Math.max(40, Math.min(CANVAS_W, el.w + step));

        // 원형: 항상 정사각 유지 (가로/세로 별도 조절 불가)
        if (el.shape === 'circle') {
          return { ...prev, photo: { ...el, w: newW, h: newW } };
        }
        if (resizeMode === 'w') {
          return { ...prev, photo: { ...el, w: newW } };
        }
        if (resizeMode === 'h') {
          const newH = Math.max(40, Math.min(CANVAS_H, el.h + step));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1) 사진 업로드 — 실패해도 청첩장 자체는 저장 (사진 없이)
      let photoUrl = null;
      if (formData.photoUri) {
        const upload = await uploadInvitationPhoto(formData.photoUri);
        if (upload.success) {
          photoUrl = upload.url;
        } else {
          // bucket 미생성 등 — 저장은 계속
          console.warn('[handleSave] photo upload failed:', upload.error);
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

      // 3) DB insert
      const result = await createPaperInvitation({
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
      });

      if (!result.success) {
        Alert.alert('저장 실패', result.error || '저장에 실패했습니다.');
        setSaving(false);
        return;
      }

      Alert.alert('저장 완료', '청첩장이 저장되었습니다.', [
        {
          text: '목록 보기',
          onPress: () => {
            navigation.popToTop();
            // 다음 프레임에 목록 화면으로 이동
            setTimeout(() => navigation.navigate('SavedInvitations'), 100);
          },
        },
        {
          text: '확인',
          style: 'cancel',
          onPress: () => navigation.popToTop(),
        },
      ]);
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={TC.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>위치 조정</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 단계 표시 */}
      <View style={s.stepBar}>
        <View style={s.stepDot}>
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
        <View style={[s.stepLine, { backgroundColor: TC.ink }]} />
        <View style={[s.stepDot, s.stepDotActive]}>
          <Text style={s.stepDotText}>2</Text>
        </View>
      </View>

      {/* 스크롤 영역 — 작은 화면에서 컨트롤 다 보이게 (드래그 중 스크롤 차단) */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!dragging}
      >

      {/* 안내 */}
      <View style={s.hint}>
        <Ionicons name="information-circle-outline" size={14} color={TC.blue} />
        <Text style={s.hintText}>
          {!selected
            ? '요소를 탭해 선택 → 끌어서 옮기거나 아래에서 미세조정'
            : selected === 'photo'
              ? '사진을 끌어 옮기거나 아래에서 크기·위치 조정'
              : '텍스트를 끌어 옮기거나 아래에서 크기·위치 조정'}
        </Text>
      </View>

      {/* 캔버스 — 빈 영역 탭하면 선택 해제 */}
      <View style={s.canvasWrap}>
        <Pressable
          onPress={() => setSelected(null)}
          style={[s.canvas, { width: CANVAS_W, height: CANVAS_H }]}
        >
          {/* 빈 템플릿 배경 */}
          <Image
            source={template.blank}
            style={{ position: 'absolute', width: CANVAS_W, height: CANVAS_H }}
            resizeMode="contain"
          />

          {/* 베이크인 요소 가리는 마스크 (& 등) */}
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
              }}
            />
          ))}

          {/* 사진 — blank.png 위 layer */}
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
          >
            <Text
              style={{
                textAlign: 'center',
                fontFamily: SERIF_FONT,
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
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: SERIF_FONT,
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
          >
            <Text
              style={{
                textAlign: 'center',
                fontFamily: SERIF_FONT,
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
          >
            <Text
              style={{
                textAlign: 'center',
                fontFamily: NUMERIC_FONT,
                fontSize: layout.date.size,
                color: '#6B5B44',
                letterSpacing: 1.2,
                fontWeight: '600',
              }}
            >
              {formData.date_str}  {formData.time_str}
            </Text>
          </DraggableElement>

          {/* 장소 */}
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
          >
            <Text
              numberOfLines={1}
              style={{
                textAlign: 'center',
                fontFamily: SERIF_FONT,
                fontSize: layout.venue.size,
                color: '#6B5B44',
                fontWeight: '500',
              }}
            >
              {formData.venue}
            </Text>
          </DraggableElement>
        </Pressable>
      </View>

      {/* 요소 선택 탭 — 가로 스크롤 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.elementTabs}
      >
        {[
          { id: 'photo', label: '사진', icon: 'image-outline' },
          { id: 'groom', label: '신랑', icon: 'person-outline' },
          ...(hideConnector
            ? []
            : [{ id: 'connector', label: '&', icon: 'remove-outline' }]),
          { id: 'bride', label: '신부', icon: 'person-outline' },
          { id: 'date', label: '일시', icon: 'calendar-outline' },
          { id: 'venue', label: '장소', icon: 'location-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[s.elementTab, selected === tab.id && s.elementTabActive]}
            onPress={() => setSelected(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={14}
              color={selected === tab.id ? '#fff' : TC.inkMuted}
            />
            <Text
              style={[
                s.elementTabText,
                selected === tab.id && { color: '#fff' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 사진 선택시: 가로/세로/전체 모드 토글 (원형은 숨김) */}
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
              <Text
                style={[
                  s.modeBtnText,
                  resizeMode === m.id && { color: '#fff' },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 미세조정 + 크기 툴바 — selected 있을 때만 활성 */}
      {selected && (
        <View style={s.controlsCard}>
          {/* 미세조정 (1px) */}
          <View style={s.nudgeRow}>
            <Text style={s.controlLabel}>미세 조정</Text>
            <View style={s.nudgeGrid}>
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                <View style={{ width: 48 }} />
                <TouchableOpacity
                  style={s.nudgeBtn}
                  onPress={() => nudge(0, -1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-up" size={16} color={TC.ink} />
                </TouchableOpacity>
                <View style={{ width: 48 }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                <TouchableOpacity
                  style={s.nudgeBtn}
                  onPress={() => nudge(-1, 0)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={16} color={TC.ink} />
                </TouchableOpacity>
                <View style={s.nudgeCenter}>
                  <Ionicons name="move-outline" size={14} color={TC.inkMuted} />
                </View>
                <TouchableOpacity
                  style={s.nudgeBtn}
                  onPress={() => nudge(1, 0)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={16} color={TC.ink} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                <View style={{ width: 48 }} />
                <TouchableOpacity
                  style={s.nudgeBtn}
                  onPress={() => nudge(0, 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-down" size={16} color={TC.ink} />
                </TouchableOpacity>
                <View style={{ width: 48 }} />
              </View>
            </View>
          </View>

          {/* 크기 조절 */}
          <View style={s.sizeRow}>
            <Text style={s.controlLabel}>
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
            <View style={s.sizeBtnRow}>
              <TouchableOpacity
                style={s.sizeBtn}
                onPress={() => adjustSize(-1)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color={TC.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.sizeBtn}
                onPress={() => adjustSize(1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={TC.ink} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      </ScrollView>

      {/* 저장 버튼 — 하단 고정 (sticky) */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={s.saveBtnText}>{saving ? '저장 중...' : '완성하고 저장하기'}</Text>
        </TouchableOpacity>
      </View>
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

  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    gap: 8,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TC.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: TC.ink },
  stepDotText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  stepLine: { width: 32, height: 2, backgroundColor: TC.bg },

  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  hintText: { fontSize: 12, color: TC.inkMuted, letterSpacing: -0.2 },

  canvasWrap: {
    alignItems: 'center',
    paddingTop: 4,
  },
  canvas: {
    backgroundColor: '#FBF9F3',
    overflow: 'hidden',
    position: 'relative',
  },

  selectedBorder: {
    borderWidth: 1.5,
    borderColor: TC.blue,
    borderStyle: 'dashed',
    borderRadius: 4,
  },

  // 요소 선택 탭 (가로 스크롤)
  elementTabs: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
  },
  elementTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: TC.card,
    borderRadius: 10,
  },
  elementTabActive: { backgroundColor: TC.ink },
  elementTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // 사진 리사이즈 모드 토글 (가로/세로/전체)
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: TC.card,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: TC.blue },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // 미세조정 + 크기 카드
  controlsCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: TC.card,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  nudgeRow: {},
  nudgeGrid: { gap: 6, alignItems: 'center' },
  nudgeBtn: {
    width: 48,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeCenter: {
    width: 48,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sizeBtnRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  sizeBtn: {
    width: 80,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 저장 — 하단 sticky, safe area 처리
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: TC.ink,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
});
