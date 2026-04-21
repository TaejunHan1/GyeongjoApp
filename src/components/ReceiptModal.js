// 참여한 경조사 영수증 모달 — 웹 영수증과 동일한 종이 스타일 (톱니 + 점선 + 크림 배경)
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Easing,
} from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RECEIPT_API = 'https://contribution-web-srgt.vercel.app/api/get-receipt';

// 웹과 동일한 매핑
const SIDE_MAP = { groom: '신랑측', bride: '신부측' };
const RELATION_MAP = {
  family: '가족', relative: '친척', friend: '지인·친구',
  colleague: '직장동료', senior: '선배', junior: '후배',
  neighbor: '이웃', other: '기타',
};
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// ── 색상 상수 (웹 CSS와 동일) ─────────────────────
const BG = '#D6D6D6';        // 모달 배경
const PAPER = '#F5F4F0';     // 영수증 종이
const TEXT_PRIMARY = '#1a1a1a';
const TEXT_SECONDARY = '#444';
const TEXT_MUTED = '#888';
const DASHED = '#BBBBBB';

function formatAmount(n) {
  if (!n) return '0';
  return Number(n).toLocaleString('ko-KR');
}

function formatKoreanDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.length <= 10 ? dateStr + 'T00:00:00' : dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
  } catch { return ''; }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':').map(Number);
  const ampm = h < 12 ? '오전' : '오후';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${ampm} ${hour}시${m > 0 ? ` ${m}분` : ''}`;
}

function formatCreatedAt(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    const wk = WEEKDAYS[d.getDay()];
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h < 12 ? '오전' : '오후';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${y}년 ${mo}월 ${day}일 ${wk}요일 ${ampm} ${hour}:${String(m).padStart(2, '0')}`;
  } catch { return ''; }
}

// ── 지그재그 톱니 엣지 ────────────────────────────
function ZigzagEdge({ width, position = 'top' }) {
  const size = 14;
  const count = Math.ceil(width / size);
  // position === 'top': paper 위에 있음 → 배경색 원들이 아래쪽으로 파고듦 (원의 중심이 paper 바닥에)
  // position === 'bottom': paper 아래 → 배경색 원들이 위쪽에서 파고듦 (원 중심이 paper 위쪽)
  return (
    <Svg width={width} height={size} viewBox={`0 0 ${width} ${size}`}>
      <Rect x={0} y={0} width={width} height={size} fill={PAPER} />
      {Array.from({ length: count }).map((_, i) => (
        <Circle
          key={i}
          cx={i * size + size / 2}
          cy={position === 'top' ? size : 0}
          r={size / 2}
          fill={BG}
        />
      ))}
    </Svg>
  );
}

// ── 점선 ─────────────────────────────────────────
function DashedLine() {
  return <View style={styles.dashed} />;
}

// ── 라벨 · 값 행 ──────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// 힌트 → receipt 변환 (API 응답 전 즉시 표시용)
function hintToReceipt(h) {
  if (!h) return null;
  return {
    id: h.contributionId,
    guestName: h.guestName,
    amount: h.amount,
    side: h.category === '신랑측' ? 'groom' : h.category === '신부측' ? 'bride' : null,
    relationship: h.detail,
    createdAt: h.contributionDate,
    eventDate: h.eventDate,
    groomName: h.mainPersonName,
    brideName: '',
  };
}

// ── 메인 모달 ─────────────────────────────────────
export default function ReceiptModal({ visible, onClose, receipt: receiptHint }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(winH)).current;
  const [receipt, setReceipt] = useState(null);

  // 태블릿 / 가로모드 판정 — 짧은 변이 600 이상이면 태블릿
  const shortSide = Math.min(winW, winH);
  const isTablet = shortSide >= 600;

  // 영수증 카드 너비 — 화면 기반 적응
  //   모바일: 화면-40 (최대 380)
  //   태블릿 세로: 화면의 90% (최대 640)
  //   태블릿 가로: 540 고정 (너무 길어지지 않게)
  const paperWidth = isTablet
    ? (winW >= winH ? 540 : Math.min(winW * 0.9, 640))
    : Math.min(winW - 40, 380);

  useEffect(() => {
    if (!visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(winH);
      return;
    }
    // 즉시 힌트로 영수증 채움 — 로딩 화면 없음
    setReceipt(hintToReceipt(receiptHint));

    // 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // 백그라운드로 서버에서 정확한 영수증 가져오기 (결혼식 시간/장소 등 추가 정보)
    if (receiptHint?.contributionId) {
      fetch(`${RECEIPT_API}?id=${receiptHint.contributionId}`)
        .then(r => r.json())
        .then(data => {
          if (data?.success && data.receipt) {
            setReceipt(data.receipt);
          }
        })
        .catch(() => {
          /* 힌트 그대로 유지 */
        });
    }
  }, [visible, receiptHint?.contributionId]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* 반투명 배경 */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* 슬라이드 업 컨테이너 */}
      <Animated.View style={[styles.wrap, { transform: [{ translateY: slideAnim }] }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 상단 X 버튼 — Safe Area 반영 */}
          <TouchableOpacity
            style={[styles.topCloseBtn, { top: insets.top + 12 }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.topCloseX}>✕</Text>
          </TouchableOpacity>

          {/* ── 영수증 카드 ── */}
          <View style={[styles.receiptWrap, { width: paperWidth }]}>
            {/* 상단 톱니 */}
            <ZigzagEdge width={paperWidth} position="top" />

            {/* 종이 본체 */}
            <View style={styles.paper}>
              {!receipt ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator color={TEXT_MUTED} />
                </View>
              ) : (
                <>
                  {/* 로고 + 브랜드 */}
                  <View style={styles.logoBadge}>
                    <Image
                      source={require('../../assets/images/jeongdamlogo.png')}
                      style={styles.logoImg}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.brandName}>JEONGDAM · 정담</Text>
                  <Text style={styles.brandSub}>디지털 경조사 · 축의금 영수증</Text>

                  <DashedLine />

                  {/* 메인: 이름 + 행사 */}
                  <View style={styles.mainInfo}>
                    <Text style={styles.mainName}>{receipt.guestName || '-'}</Text>
                    <Text style={styles.mainEvent}>
                      {receipt.groomName || ''}
                      {receipt.groomName && receipt.brideName ? ' · ' : ''}
                      {receipt.brideName || ''}
                      {(receipt.groomName || receipt.brideName) ? ' 결혼식' : ''}
                    </Text>
                  </View>

                  <DashedLine />

                  {/* 상세 항목 */}
                  <View style={styles.detailList}>
                    {receipt.side && (
                      <DetailRow label="구분" value={SIDE_MAP[receipt.side] || receipt.side} />
                    )}
                    {receipt.relationship && (
                      <DetailRow label="관계" value={RELATION_MAP[receipt.relationship] || receipt.relationship} />
                    )}
                    <DetailRow label="일시" value={formatCreatedAt(receipt.createdAt)} />
                    {receipt.eventDate && (
                      <DetailRow
                        label="결혼식일"
                        value={`${formatKoreanDate(receipt.eventDate)}${receipt.ceremonyTime ? ' ' + formatTime(receipt.ceremonyTime) : ''}`}
                      />
                    )}
                    {receipt.location && (
                      <DetailRow label="장소" value={receipt.location} />
                    )}
                  </View>

                  <DashedLine />

                  {/* 총 금액 */}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>축의금</Text>
                    <Text style={styles.totalAmount}>{formatAmount(receipt.amount)}원</Text>
                  </View>

                  {/* 영수증 번호 */}
                  <View style={styles.receiptNo}>
                    <Text style={styles.receiptNoLabel}>영수증 번호</Text>
                    <Text style={styles.receiptNoValue}>
                      {String(receipt.id || '').toUpperCase()}
                    </Text>
                  </View>

                  <DashedLine />

                  {/* 앱 CTA */}
                  <View style={styles.appCta}>
                    <Text style={styles.appCtaTitle}>내 축의 내역을 앱에서 평생 보관하세요</Text>
                    <Text style={styles.appCtaSub}>정담 앱에서 모든 경조사 내역을 한눈에</Text>
                  </View>
                </>
              )}
            </View>

            {/* 하단 톱니 */}
            <ZigzagEdge width={paperWidth} position="bottom" />
          </View>

          {/* 하단 닫기 버튼 (웹의 '공유하기' 자리) */}
          <TouchableOpacity
            style={[styles.closeBtn, { width: paperWidth }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── 스타일 (웹 CSS와 동일한 수치) ───────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  wrap: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  topCloseBtn: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  topCloseX: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '600',
  },
  receiptWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  paper: {
    backgroundColor: PAPER,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 28,
  },
  logoBadge: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  logoImg: {
    width: 52,
    height: 52,
  },
  brandName: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  brandSub: {
    textAlign: 'center',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  dashed: {
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: DASHED,
    marginVertical: 20,
  },
  mainInfo: {
    paddingVertical: 2,
  },
  mainName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  mainEvent: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  detailList: {
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 13,
    color: '#222',
    textAlign: 'right',
    flex: 1,
    lineHeight: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  receiptNo: {
    marginTop: 10,
  },
  receiptNoLabel: {
    fontSize: 10,
    color: '#AAAAAA',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  receiptNoValue: {
    fontSize: 11,
    color: '#BBBBBB',
    fontFamily: 'Menlo',
    letterSpacing: 0.5,
  },
  appCta: {
    paddingVertical: 6,
  },
  appCtaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  appCtaSub: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  // 하단 닫기 버튼 (웹의 shareBtn과 같은 스타일)
  closeBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
