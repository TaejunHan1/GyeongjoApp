// src/screens/event/guestbook/GuestWritingScreen.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { useKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';

const INACTIVITY_MS = 10000;

export default function GuestWritingScreen({ navigation, route }) {
  const { event, side = 'groom' } = route.params;
  const sideLabel = side === 'groom' ? '신랑측' : '신부측';
  const sideColor = side === 'groom' ? '#3B82F6' : '#EC4899';
  const sideEmoji = side === 'groom' ? '🤵' : '👰';

  useKeepAwake();

  // 상태: 'intro' | 'drawing'
  const [mode, setMode] = useState('intro');
  const [screenSize, setScreenSize] = useState(Dimensions.get('window'));

  const viewShotRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const hideTimerRef = useRef(null);
  // 팜 리젝션
  const drawingTouchId = useRef(null);
  // 아직 어느 터치가 펜인지 결정 못한 후보들 { id → {x, y} }
  const pendingTouches = useRef(new Map());

  const hasStrokes = strokes.length > 0 || currentPath.length > 0;

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
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // ── 컨트롤 버튼 자동 숨김 ────────────────────
  const showControls = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0.15, duration: 600, useNativeDriver: true }).start();
    }, 3000);
  }, [controlsOpacity]);

  // ── PanResponder (팜 리젝션: 움직이는 터치 = 펜) ─
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        resetInactivityTimer();
        showControls();

        const touches = evt.nativeEvent.touches;

        // ① iOS Apple Pencil: OS가 이미 구분해줌 → 즉시 확정
        const stylusTouch = touches.find((t) => t.touchType === 'stylus');
        if (stylusTouch) {
          drawingTouchId.current = stylusTouch.identifier;
          pendingTouches.current.clear();
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
      const uri = await viewShotRef.current.capture();
      clearCanvas();
      navigation.navigate('GuestConfirm', { event, handwritingUri: uri, side });
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

    return (
      <View style={intro.container}>
        <StatusBar hidden />

        {/* 뒤로 */}
        <TouchableOpacity style={intro.backBtn} onPress={() => navigation.goBack()}>
          <Text style={intro.backText}>✕</Text>
        </TouchableOpacity>

        {/* 측 배지 */}
        <View style={[intro.sideBadge, { backgroundColor: sideColor + '18', borderColor: sideColor }]}>
          <Text style={intro.sideEmoji}>{sideEmoji}</Text>
          <Text style={[intro.sideLabel, { color: sideColor }]}>{sideLabel}</Text>
        </View>

        {/* 행사명 */}
        <Text style={intro.eventName}>{eventTitle}</Text>
        <Text style={intro.desc}>결혼식에 오신 것을 환영합니다</Text>

        {/* 안내 */}
        <View style={intro.infoBox}>
          <Text style={intro.infoIcon}>📱</Text>
          <Text style={intro.infoText}>
            시작 버튼을 누르면 화면이{'\n'}
            <Text style={intro.infoHighlight}>가로 방향 전체화면</Text>으로 전환됩니다.{'\n'}
            하객분이 터치펜으로 성함만 적으시면 됩니다.
          </Text>
        </View>

        {/* 시작 버튼 */}
        <TouchableOpacity
          style={[intro.startBtn, { backgroundColor: sideColor }]}
          onPress={enterDrawing}
          activeOpacity={0.85}
        >
          <Text style={intro.startBtnText}>방명록 시작하기  →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ════════════════════════════════════════════
  // 드로잉 화면 (전체화면 가로)
  // ════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: '#F8F4EE' }}>
      <StatusBar hidden />

      {/* 종이 캔버스 */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
        style={{ flex: 1, backgroundColor: '#FDFAF5' }}
      >
        <View
          style={{ flex: 1, backgroundColor: '#FDFAF5' }}
          {...panResponder.panHandlers}
        >
          {/* 종이 질감 가로선 */}
          <Svg style={StyleSheet.absoluteFill} width={SW} height={SH}>
            {Array.from({ length: Math.ceil(SH / 60) }).map((_, i) => (
              <Path
                key={i}
                d={`M0,${(i + 1) * 60} L${SW},${(i + 1) * 60}`}
                stroke="#E8E0D0"
                strokeWidth={0.8}
                opacity={0.6}
              />
            ))}
            {/* 완료된 획 */}
            {strokes.map((d, i) => (
              <Path
                key={i}
                d={d}
                stroke="#1A1209"
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
                stroke="#1A1209"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>

          {/* 빈 캔버스 안내 */}
          {!hasStrokes && (
            <View style={draw.emptyHint} pointerEvents="none">
              <Text style={draw.emptyText}>성함을 적어주세요</Text>
            </View>
          )}
        </View>
      </ViewShot>

      {/* 플로팅 컨트롤 — 3초 후 반투명 */}
      <Animated.View style={[draw.controls, { opacity: controlsOpacity }]} pointerEvents="box-none">

        {/* 좌상단: 나가기 */}
        <TouchableOpacity
          style={draw.exitBtn}
          onPress={exitDrawing}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Text style={draw.exitBtnText}>✕  나가기</Text>
        </TouchableOpacity>

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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  backBtn: {
    position: 'absolute', top: 52, left: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 16, color: '#3C3C43', fontWeight: '600' },
  sideBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1.5,
  },
  sideEmoji: { fontSize: 20 },
  sideLabel: { fontSize: 15, fontWeight: '700' },
  eventName: {
    fontSize: 26, fontWeight: '700', color: '#1C1C1E',
    letterSpacing: -0.5, textAlign: 'center',
  },
  desc: { fontSize: 15, color: '#8E8E93' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#F5F5F7', borderRadius: 16,
    padding: 16, marginTop: 8,
  },
  infoIcon: { fontSize: 22, marginTop: 1 },
  infoText: { flex: 1, fontSize: 14, color: '#3C3C43', lineHeight: 22 },
  infoHighlight: { fontWeight: '700', color: '#1C1C1E' },
  startBtn: {
    width: '100%', height: 58, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
});

// ── 드로잉 스타일 ─────────────────────────────
const draw = StyleSheet.create({
  emptyHint: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  emptyText: {
    fontSize: 28, color: '#C8BFA8', fontWeight: '300', letterSpacing: 4,
  },
  controls: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'box-none',
  },
  // 나가기 버튼 (좌상단)
  exitBtn: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: 'rgba(28,20,12,0.4)',
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  exitBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', letterSpacing: 0.2 },

  // 우하단 버튼 그룹 (가로)
  rightBtns: {
    position: 'absolute', bottom: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
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
