// 튜토리얼 스포트라이트 + 툴팁 오버레이 (토스 스타일)
// - 스텝 전환 시 fade out → 스크롤 대기 → fade in
// - fade는 native driver로 JS 부하 0 → ScrollView 프레임 확보
// - position/size 애니메이션 없음 (JS 부하 최소)
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTutorial } from '../contexts/TutorialContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TutorialPulseRing from './TutorialPulseRing';

const TOOLTIP_WIDTH = 280;
const TOOLTIP_MARGIN = 14;
const SPOT_PADDING = 14;
const SPOT_RADIUS = 16;

export default function TutorialOverlay({ scope = 'app' }) {
  const {
    activeTutorial, step, targets, handlers, totalSteps, currentStep,
    advanceStep, skipTutorial, isPaused, pauseTutorial, resumeTutorial,
  } = useTutorial();
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // fade는 native driver로 JS 부하 0
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const isFirstStepRef = useRef(true);

  // 좌표계 보정:
  //   iOS: 모든 scope에서 screen 전체 좌표계라 offset 0
  //   Android app scope: SafeAreaProvider가 상태바 아래부터 → +insets.top
  //   Android Modal scope: Modal 자체 window라 offset 0 (Modal이 상태바 제외 영역 덮음)
  const statusBarOffset =
    Platform.OS === 'android' && scope === 'app' ? insets.top : 0;

  const primary = step ? targets[step.targetKey] : null;
  const hasTarget = !!primary && typeof primary.x === 'number';
  const centerTooltip = !!step?.centerTooltip;
  const allowInteraction = !!step?.allowInteraction;

  // 좌표 계산 — render마다 직접 (Animated 없음)
  const primaryY = hasTarget ? primary.y + statusBarOffset : 0;
  const spotX = hasTarget ? primary.x - SPOT_PADDING : 0;
  const spotY = hasTarget ? primaryY - SPOT_PADDING : 0;
  const spotW = hasTarget ? primary.width + SPOT_PADDING * 2 : 0;
  const spotH = hasTarget ? primary.height + SPOT_PADDING * 2 : 0;

  // 툴팁 실제 높이는 상황마다 다르지만 최대 약 220px (힌트 2줄 + 완료 버튼 + 메타 포함)
  const TOOLTIP_EST_HEIGHT = 220;

  // tooltipAlign: 'leftOfSpot' | 'rightOfSpot' — 가로 화면에서 스폿 옆에 툴팁 배치
  const tooltipAlign = step?.tooltipAlign;
  const isSideAlign = tooltipAlign === 'leftOfSpot' || tooltipAlign === 'rightOfSpot';

  const placeBelow = !isSideAlign &&
    spotY + spotH + 12 + TOOLTIP_EST_HEIGHT < winH - insets.bottom - 40;

  let tooltipY, tooltipX;
  if (isSideAlign && hasTarget) {
    // 스폿 중앙과 툴팁 중앙이 세로로 맞도록 배치, 화면 밖으로 안 나가게 clamp
    tooltipY = Math.max(
      insets.top + 20,
      Math.min(
        winH - insets.bottom - TOOLTIP_EST_HEIGHT - 20,
        spotY + spotH / 2 - TOOLTIP_EST_HEIGHT / 2
      )
    );
    tooltipX = tooltipAlign === 'leftOfSpot'
      ? Math.max(TOOLTIP_MARGIN, spotX - TOOLTIP_WIDTH - 20)
      : Math.min(winW - TOOLTIP_WIDTH - TOOLTIP_MARGIN, spotX + spotW + 20);
  } else {
    tooltipY = placeBelow
      ? spotY + spotH + 12
      : Math.max(insets.top + 20, spotY - TOOLTIP_EST_HEIGHT);
    tooltipX = Math.max(
      TOOLTIP_MARGIN,
      Math.min(
        winW - TOOLTIP_WIDTH - TOOLTIP_MARGIN,
        spotX + spotW / 2 - TOOLTIP_WIDTH / 2
      )
    );
  }

  // 활성화 종료
  useEffect(() => {
    if (!activeTutorial) {
      fade.setValue(0);
      isFirstStepRef.current = true;
    }
  }, [activeTutorial]);

  // 스텝 변경 감지 — 최초: fadeIn만 / 이후: fadeOut → 스크롤 대기 → fadeIn
  useEffect(() => {
    if (!activeTutorial) return;
    if (isFirstStepRef.current) {
      isFirstStepRef.current = false;
      Animated.timing(fade, {
        toValue: 1, duration: 260, useNativeDriver: true,
      }).start();
      return;
    }
    const seq = Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.delay(520), // 이 동안 ScrollView가 부드럽게 이동 (JS 완전 free)
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]);
    seq.start();
    return () => seq.stop();
  }, [step?.id, activeTutorial]);

  // 펄스 링
  useEffect(() => {
    if (!activeTutorial) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeTutorial]);

  if (!activeTutorial || !step) return null;
  // 현재 스텝의 scope와 일치하는 Overlay만 렌더 (중복 방지)
  const stepScope = step.scope || 'app';
  if (stepScope !== scope) return null;

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  const isTap = step.interaction === 'tap';

  const handleTargetPress = () => {
    const fn = handlers[step.targetKey];
    if (fn) fn();
    if (step.pauseAfterTap) {
      pauseTutorial();
      advanceStep();
      // 모달 mount + 내부 ref 측정 여유
      setTimeout(() => resumeTutorial(), 1200);
    } else {
      advanceStep();
    }
  };

  const accents = Array.isArray(step.accents) ? step.accents : [];
  const arrowLeft = Math.max(16, Math.min(TOOLTIP_WIDTH - 32, spotX + spotW / 2 - tooltipX - 8));

  if (isPaused) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 9999 }]}
    >
        {/* 스포트라이트 SVG 마스크 — allowInteraction이면 배경 투명하게 (뒤 콘텐츠 보이게) */}
        {!allowInteraction ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={winW} height={winH}>
              <Defs>
                <Mask id="spotlightMask">
                  <Rect x="0" y="0" width={winW} height={winH} fill="white" />
                  {hasTarget ? (
                    <Rect
                      x={spotX}
                      y={spotY}
                      width={spotW}
                      height={spotH}
                      rx={SPOT_RADIUS}
                      ry={SPOT_RADIUS}
                      fill="black"
                    />
                  ) : null}
                </Mask>
              </Defs>
              <Rect
                x="0" y="0" width={winW} height={winH}
                fill="rgba(12, 17, 29, 0.72)"
                mask="url(#spotlightMask)"
              />
            </Svg>
          </View>
        ) : null}

        {/* 터치 차단 —
            allowInteraction: 전체 자유 조작
            hasTarget: 스포트라이트 바깥 4면 차단 (passTargetTap이어도 바깥은 막음 → 타겟만 탭 허용)
            그 외 + passTargetTap: 차단 안 함
            그 외: 전체 차단 */}
        {allowInteraction ? null : (
          hasTarget && !centerTooltip ? (
            <>
              <View onStartShouldSetResponder={() => true} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: spotY }} />
              <View onStartShouldSetResponder={() => true} style={{ position: 'absolute', left: 0, right: 0, top: spotY + spotH, bottom: 0 }} />
              <View onStartShouldSetResponder={() => true} style={{ position: 'absolute', top: spotY, left: 0, width: spotX, height: spotH }} />
              <View onStartShouldSetResponder={() => true} style={{ position: 'absolute', top: spotY, left: spotX + spotW, right: 0, height: spotH }} />
            </>
          ) : (
            step.passTargetTap ? null : (
              <View onStartShouldSetResponder={() => true} style={StyleSheet.absoluteFill} />
            )
          )
        )}

        {/* 메인 펄스 링 (native driver, 정적 위치 + transform/opacity) */}
        {hasTarget ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: spotX,
              top: spotY,
              width: spotW,
              height: spotH,
            }}
          >
            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                borderRadius: SPOT_RADIUS,
                borderWidth: 2,
                borderColor: '#FEE500',
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              }}
            />
          </View>
        ) : null}

        {/* accent 펄스 링들 */}
        {accents.map(key => {
          const t = targets[key];
          if (!t || typeof t.x !== 'number') return null;
          return (
            <View
              key={key}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: t.x,
                top: t.y + statusBarOffset,
                width: t.width,
                height: t.height,
              }}
            >
              <TutorialPulseRing color="#FEE500" borderRadius={10} />
            </View>
          );
        })}

        {/* 타겟 영역 처리 —
            isTap: TouchableOpacity로 탭만 허용
            next: 전부 차단
            passTargetTap: 아무것도 안 올림 → 실제 아이템 탭 허용 (튜토리얼 진행은 아이템 onPress 내부에서) */}
        {hasTarget && !centerTooltip && !step.passTargetTap ? (
          isTap ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleTargetPress}
              style={{
                position: 'absolute',
                left: spotX,
                top: spotY,
                width: spotW,
                height: spotH,
              }}
            />
          ) : (
            <View
              onStartShouldSetResponder={() => true}
              style={{
                position: 'absolute',
                left: spotX,
                top: spotY,
                width: spotW,
                height: spotH,
              }}
            />
          )
        ) : null}

        {/* topBar 제거됨 — 스텝 뱃지와 건너뛰기는 툴팁 내부로 통합 */}

        {/* 툴팁 */}
        {hasTarget || centerTooltip ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.tooltip,
              centerTooltip
                ? {
                    left: (winW - TOOLTIP_WIDTH) / 2,
                    top: winH / 2 - 80,
                    width: TOOLTIP_WIDTH,
                  }
                : { left: tooltipX, top: tooltipY, width: TOOLTIP_WIDTH },
            ]}
          >
            {hasTarget && !centerTooltip && !isSideAlign ? (
              <View
                style={[
                  placeBelow ? styles.arrowTop : styles.arrowBottom,
                  { left: arrowLeft },
                ]}
              />
            ) : null}
            <Text style={styles.tooltipText}>{step.tooltip}</Text>
            {!!step.hint ? (
              <View style={styles.hintRow}>
                <Ionicons name="information-circle" size={14} color="#3182F6" style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={styles.tooltipHint}>{step.hint}</Text>
              </View>
            ) : null}
            {!isTap ? (
              <TouchableOpacity style={styles.nextBtn} onPress={advanceStep} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>
                  {currentStep + 1 === totalSteps ? '완료' : '다음'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {/* 툴팁 하단: 스텝 인디케이터 + 건너뛰기 */}
            <View style={styles.metaRow}>
              <Text style={styles.metaStep}>{currentStep + 1} / {totalSteps}</Text>
              <TouchableOpacity onPress={skipTutorial} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.metaSkip}>건너뛰기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 툴팁 하단 메타 row — 스텝 인디케이터 + 건너뛰기
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
  },
  metaStep: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
    letterSpacing: -0.1,
  },
  metaSkip: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B95A1',
    letterSpacing: -0.1,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  tooltipText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191F28',
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  tooltipHint: {
    flex: 1,
    fontSize: 13,
    color: '#4E5968',
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  nextBtn: {
    marginTop: 18,
    backgroundColor: '#3182F6',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  arrowTop: {
    position: 'absolute',
    top: -7,
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  arrowBottom: {
    position: 'absolute',
    bottom: -7,
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
});
