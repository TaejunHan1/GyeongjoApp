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
import Svg, { Path, G } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { useKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const INACTIVITY_MS = 10000;

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

  // 힌트 획 애니메이션
  const hintAnims = useRef(HINT_STROKES.map(() => new Animated.Value(0))).current;
  const hintOpacity = useRef(new Animated.Value(1)).current;
  // 팜 리젝션
  const drawingTouchId = useRef(null);
  // 아직 어느 터치가 펜인지 결정 못한 후보들 { id → {x, y} }
  const pendingTouches = useRef(new Map());

  const hasStrokes = strokes.length > 0 || currentPath.length > 0;

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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* 헤더 */}
        <View style={intro.header}>
          <TouchableOpacity style={intro.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={intro.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={intro.headerTitle}>하객 접수</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* 본문 */}
        <View style={intro.body}>
          {/* 측 + 행사명 */}
          <View style={[intro.sideIconWrap, { backgroundColor: sideColor + '15' }]}>
            <Text style={{ fontSize: 32 }}>{sideEmoji}</Text>
          </View>
          <Text style={[intro.sideName, { color: sideColor }]}>{sideLabel}</Text>
          <Text style={intro.eventName}>{eventTitle}</Text>

          {/* 안내 카드 */}
          <View style={intro.infoCard}>
            <View style={intro.infoRow}>
              <View style={intro.infoDot} />
              <Text style={intro.infoText}>시작하면 화면이 <Text style={intro.infoStrong}>가로 전체화면</Text>으로 전환돼요</Text>
            </View>
            <View style={intro.infoRow}>
              <View style={intro.infoDot} />
              <Text style={intro.infoText}>하객분이 터치펜으로 성함을 직접 적어요</Text>
            </View>
            <View style={intro.infoRow}>
              <View style={intro.infoDot} />
              <Text style={intro.infoText}>10초 무입력 시 자동으로 초기화돼요</Text>
            </View>
          </View>
        </View>

        {/* 하단 버튼 */}
        <View style={intro.footer}>
          <TouchableOpacity
            style={[intro.startBtn, { backgroundColor: sideColor }]}
            onPress={enterDrawing}
            activeOpacity={0.85}
          >
            <Text style={intro.startBtnText}>방명록 시작하기</Text>
          </TouchableOpacity>
        </View>
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

          {/* 힌트는 ViewShot 밖으로 이동 — 캡처에 포함 안 됨 */}
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
          <View style={draw.hintTextWrap}>
            <Text style={draw.emptyText}>성함을 적어주세요</Text>
          </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
    paddingBottom: 40,
  },
  sideIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  sideName: {
    fontSize: 14, fontWeight: '700', letterSpacing: 0.2,
  },
  eventName: {
    fontSize: 22, fontWeight: '800', color: '#191F28',
    letterSpacing: -0.5, textAlign: 'center',
    marginBottom: 8,
  },

  // 안내 카드
  infoCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#C5CCD5',
  },
  infoText: {
    flex: 1, fontSize: 14, color: '#4E5968', lineHeight: 20,
  },
  infoStrong: { fontWeight: '700', color: '#191F28' },

  // 하단 버튼
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  startBtn: {
    height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
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
  hintTextWrap: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16, color: '#C8BFA8', fontWeight: '400', letterSpacing: 3,
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
