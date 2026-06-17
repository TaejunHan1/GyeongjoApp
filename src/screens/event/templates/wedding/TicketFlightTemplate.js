// src/screens/event/templates/wedding/TicketFlightTemplate.js
// 러브 티켓 (Love Ticket) — 비행 탑승 티켓 컨셉 청첩장
// 인트로: 하늘에 떠있는 티켓 카드 + 하단 full-width 슬라이더 "밀어서 탑승하기"
// 탑승 완료: 티켓 풀스크린 확장 + 스크롤 본문 등장
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, Linking,
  Animated, StyleSheet, Dimensions, Easing, PanResponder, Alert, DeviceEventEmitter,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import LottieLoading from '../../../../components/LottieLoading';
import { getCategorizedImagesSafe, formatKoreanDate, formatKoreanTime, resolveWeddingMapCoord } from './WeddingUtils';
import { PhotoFrameOverlay } from './WeddingCommonComponents';

// 이륙 비행기 SVG (assets/images/airplane_takeoff.svg)
const AIRPLANE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
<g fill="#2B3C88">
<path d="M82.5,43.2 C82.5,37 72,33.5 58,35.8 L44,38 L25,25 L20,26 L30,42 L16,45 L11,39 L6,40 L11,51 C11,56 16,58.5 22,58.5 L73,58.5 C80,58.5 82.5,50 82.5,43.2 Z"/>
<path d="M26,72 L74,72" stroke="#2B3C88" stroke-width="7" stroke-linecap="round"/>
</g>
</svg>`;

const { width: W, height: H } = Dimensions.get('window');

// ── 티켓 사이즈 (intro 상태) ──
const TICKET_W = W * 0.88;
const TICKET_H = Math.min(H * 0.58, 560);          // 티켓 전체 높이
const PHOTO_H  = Math.round(TICKET_H * 0.42);       // 티켓 내부 사진 높이

const THUMB_SIZE = 48;
const SLIDER_PAD = 4;
const SLIDER_W = TICKET_W;
const SLIDE_MAX = SLIDER_W - THUMB_SIZE - SLIDER_PAD * 2;

const C = {
  navy: '#1e3799',
  skyBlue: '#74b9ff',
  skyDark: '#0984e3',
  brand: '#ff7675',
  main: '#2d3436',
  sub: '#636e72',
  bg: '#f0f2f5',
};
const CONFETTI_COLORS = ['#ff7675', '#fff', '#ffeaa7', '#55efc4', '#74b9ff'];
const rnd = (a, b) => Math.random() * (b - a) + a;

// 한글 이름 → 영문 이니셜 (예: 김철수 → KC / 김민수 → KM)
const toInitials = (name) => {
  if (!name) return 'XX';
  const map = {
    '김':'K','이':'L','박':'P','최':'C','정':'J','강':'K','조':'J','윤':'Y',
    '장':'J','임':'L','한':'H','오':'O','서':'S','신':'S','권':'K','황':'H',
    '안':'A','송':'S','전':'J','홍':'H','유':'Y','고':'K','문':'M','배':'B',
    '백':'B','허':'H','남':'N','심':'S','노':'N','하':'H',
    '민':'M','철':'C','수':'S','영':'Y','희':'H','진':'J','현':'H','우':'W',
    '준':'J','호':'H','석':'S','규':'K','지':'J','은':'E','미':'M','선':'S','경':'K',
  };
  const chars = [...name];
  if (chars.length >= 2) {
    const a = map[chars[chars.length - 2]] || chars[chars.length - 2].toUpperCase();
    const b = map[chars[chars.length - 1]] || chars[chars.length - 1].toUpperCase();
    return `${a}${b}`;
  }
  return (map[chars[0]] || chars[0] || 'X').toUpperCase() + 'X';
};

// ══════════════════════════════════════════════════════
// 비행기 (좌우 흔들림, SVG, 진짜 사인 곡선 — requestAnimationFrame)
// ══════════════════════════════════════════════════════
function SwayPlane({ size = 44 }) {
  const tx = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let rafId;
    const start = Date.now();
    const AMP = 3;        // 좌우 ±3px
    const PERIOD = 3200;  // 주기 3.2초
    const tick = () => {
      const t = ((Date.now() - start) % PERIOD) / PERIOD;   // 0 → 1 반복
      tx.setValue(AMP * Math.sin(t * Math.PI * 2));          // 진짜 사인 곡선
      rafId = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateX: tx }] }}>
      <SvgXml xml={AIRPLANE_SVG} width={size} height={size} />
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════
// 구름 — 겹치는 원 4개로 뭉게구름 실루엣
// ══════════════════════════════════════════════════════
function Cloud({ top, size, delay }) {
  const x = useRef(new Animated.Value(-size)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: W + size, duration: 28000, delay, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(x, { toValue: -size, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const H_ = size * 0.6;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        width: size,
        height: H_,
        transform: [{ translateX: x }],
      }}
    >
      {/* 바닥 pill (평평한 밑부분) */}
      <View style={[cl.part, {
        position: 'absolute',
        left: size * 0.08,
        bottom: 0,
        width: size * 0.84,
        height: size * 0.36,
        borderRadius: size * 0.18,
      }]} />
      {/* 왼쪽 작은 봉우리 */}
      <View style={[cl.part, {
        position: 'absolute',
        left: 0,
        top: H_ - size * 0.5,
        width: size * 0.42,
        height: size * 0.42,
        borderRadius: size * 0.21,
      }]} />
      {/* 중앙 큰 봉우리 */}
      <View style={[cl.part, {
        position: 'absolute',
        left: size * 0.28,
        top: 0,
        width: size * 0.52,
        height: size * 0.52,
        borderRadius: size * 0.26,
      }]} />
      {/* 오른쪽 중간 봉우리 */}
      <View style={[cl.part, {
        position: 'absolute',
        right: 0,
        top: H_ - size * 0.48,
        width: size * 0.4,
        height: size * 0.4,
        borderRadius: size * 0.2,
      }]} />
    </Animated.View>
  );
}
const cl = StyleSheet.create({
  part: { backgroundColor: 'rgba(255,255,255,0.95)' },
});

// ══════════════════════════════════════════════════════
// 폭죽
// ══════════════════════════════════════════════════════
function useConfetti() {
  const [particles, setParticles] = useState([]);
  const fire = () => {
    const ps = Array.from({ length: 60 }, (_, i) => {
      const angle = rnd(Math.PI, Math.PI * 2);
      const vel = rnd(8, 22);
      const x = new Animated.Value(W / 2);
      const y = new Animated.Value(H * 0.5);
      const rot = new Animated.Value(0);
      const op = new Animated.Value(1);
      const dur = rnd(700, 1400);
      Animated.parallel([
        Animated.timing(x, { toValue: W / 2 + Math.cos(angle) * vel * 18, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(y, { toValue: H * 0.5 + Math.sin(angle) * vel * 10, duration: dur * 0.5, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(y, { toValue: H + 80, duration: dur * 0.5, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(rot, { toValue: rnd(-360, 360), duration: dur, useNativeDriver: true }),
        Animated.sequence([Animated.delay(dur * 0.5), Animated.timing(op, { toValue: 0, duration: dur * 0.5, useNativeDriver: true })]),
      ]).start(() => setParticles((prev) => prev.filter((p) => p.id !== i)));
      return { id: i, x, y, rot, op, color: CONFETTI_COLORS[i % 5], size: rnd(5, 11) };
    });
    setParticles(ps);
  };
  return { particles, fire };
}

// ══════════════════════════════════════════════════════
// BOARDED 도장
// ══════════════════════════════════════════════════════
function Stamp({ show, gone }) {
  const sc = useRef(new Animated.Value(3)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!show) return;
    Animated.parallel([
      Animated.timing(sc, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.9, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [show]);
  useEffect(() => {
    if (gone) Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }).start();
  }, [gone]);
  if (!show && !gone) return null;
  return (
    <Animated.View style={[stmp.stamp, { opacity: op, transform: [{ scale: sc }, { rotate: '-15deg' }] }]}>
      <Text style={stmp.stampText}>BOARDED</Text>
    </Animated.View>
  );
}
const stmp = StyleSheet.create({
  stamp: {
    position: 'absolute', top: '40%', alignSelf: 'center',
    borderWidth: 4, borderColor: C.brand, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 5, zIndex: 100,
  },
  stampText: { fontSize: 26, fontWeight: '800', color: C.brand, letterSpacing: 2 },
});

// ══════════════════════════════════════════════════════
// 달력
// ══════════════════════════════════════════════════════
const CAL_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
function CalendarView({ year, month, day }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  const monthName = `${month}월`;
  return (
    <View>
      <View style={cal.topRow}>
        <Text style={cal.month}>{monthName}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={cal.detailLabel}>탑승일</Text>
          <Text style={cal.detailValue}>{year}. {String(month).padStart(2,'0')}. {String(day).padStart(2,'0')}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {CAL_DAYS.map((d) => <Text key={d} style={cal.dayLabel}>{d}</Text>)}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', marginBottom: 6 }}>
          {row.map((d, di) => (
            <View key={di} style={cal.cell}>
              {d === day ? (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Animated.View style={[cal.pulse, { transform: [{ scale: pulse }] }]} />
                  <Text style={cal.dday}>{d}</Text>
                </View>
              ) : (
                <Text style={cal.day}>{d ?? ''}</Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
const cal = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: '#eee', paddingBottom: 14, marginBottom: 16 },
  month: { fontSize: 40, fontWeight: '800', color: C.navy, lineHeight: 44 },
  detailLabel: { fontSize: 10, color: C.sub, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  detailValue: { fontSize: 18, fontWeight: '800', color: C.brand },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: C.sub },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, position: 'relative' },
  day: { fontSize: 14, fontWeight: '600', color: C.main },
  dday: { fontSize: 14, fontWeight: '700', color: C.brand, zIndex: 1 },
  pulse: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.brand, opacity: 0.5 },
});

// ══════════════════════════════════════════════════════
// 스터브 카드
// ══════════════════════════════════════════════════════
// 실제 바코드 모양 — 얇고 촘촘한 세로선 100개
function Barcode() {
  const pattern = Array.from({ length: 100 }, (_, i) => {
    if (i % 11 === 0) return 2;
    if (i % 17 === 0) return 2;
    return 1;
  });
  return (
    <View style={stub.barcodeRow}>
      {pattern.map((w, i) => (
        <View
          key={i}
          style={{ flex: w, height: '100%', backgroundColor: i % 2 === 0 ? '#111' : 'transparent' }}
        />
      ))}
    </View>
  );
}

function StubCard({ headerBg = C.navy, icon, title, children, footer = 'barcode', sideCuts = true }) {
  return (
    <View style={stub.card}>
      <View style={[stub.header, { backgroundColor: headerBg }]}>
        <Text style={stub.headerIcon}>{icon}</Text>
        <Text style={stub.headerText}>{title}</Text>
      </View>
      <View style={stub.body}>{children}</View>
      {/* footer: 'barcode' | React element | null */}
      {footer === 'barcode' ? (
        <>
          {sideCuts && (
            <View style={stub.dividerWrap}>
              <View style={stub.dividerLine} />
              <View style={[stub.nub, { left: -14 }]} />
              <View style={[stub.nub, { right: -14 }]} />
            </View>
          )}
          <View style={stub.barcodeBody}>
            <Barcode />
          </View>
        </>
      ) : footer ? (
        <>
          {sideCuts && (
            <View style={stub.dividerWrap}>
              <View style={stub.dividerLine} />
              <View style={[stub.nub, { left: -14 }]} />
              <View style={[stub.nub, { right: -14 }]} />
            </View>
          )}
          <View style={stub.footerBody}>{footer}</View>
        </>
      ) : null}
    </View>
  );
}
const stub = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  header: { paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { fontSize: 18 },
  headerText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  body: { padding: 20 },
  dividerWrap: { height: 20, position: 'relative', justifyContent: 'center', overflow: 'visible' },
  dividerLine: { height: 2, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', marginHorizontal: 8 },
  nub: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, top: -4 },
  barcodeBody: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  barcodeRow: { flexDirection: 'row', height: 44, width: '100%' },
  footerBody: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, alignItems: 'center' },
});

// ══════════════════════════════════════════════════════
// 계좌 아코디언
// ══════════════════════════════════════════════════════
function AccountItem({ label, bank, account, name, onCopy }) {
  const [open, setOpen] = useState(false);
  const h = useRef(new Animated.Value(0)).current;
  const toggle = () => {
    Animated.timing(h, { toValue: open ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    setOpen(!open);
  };
  const panelH = h.interpolate({ inputRange: [0, 1], outputRange: [0, 72] });
  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity style={acc.btn} onPress={toggle} activeOpacity={0.85}>
        <Text style={acc.btnText}>👤 {label}</Text>
        <Text style={acc.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      <Animated.View style={{ height: panelH, overflow: 'hidden' }}>
        <View style={acc.panel}>
          <Text style={acc.panelText}>{bank} {account} ({name})</Text>
          <TouchableOpacity style={acc.copyBtn} onPress={() => onCopy(account.replace(/-/g, ''))} activeOpacity={0.85}>
            <Text style={acc.copyBtnText}>복사</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
const acc = StyleSheet.create({
  btn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', padding: 15, borderRadius: 8 },
  btnText: { fontSize: 15, fontWeight: '600', color: C.main },
  chevron: { fontSize: 12, color: C.sub },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelText: { fontSize: 13, color: '#555', flex: 1 },
  copyBtn: { backgroundColor: C.navy, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  copyBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

// ══════════════════════════════════════════════════════
// 티켓 카드 — intro/boarded 공통
// ══════════════════════════════════════════════════════
function TicketCard({
  groomName, brideName,
  groomFather, groomMother, brideFather, brideMother,
  mainImage, dateStr, timeStr, locName, isBoarded, showStamp, stampGone,
}) {
  const groomParents = [groomFather, groomMother].filter(Boolean).join(' · ') || '아버지 · 어머니';
  const brideParents = [brideFather, brideMother].filter(Boolean).join(' · ') || '아버지 · 어머니';
  return (
    <View style={tk.card}>
      {/* 상단: 항공사 */}
      <View style={tk.headerRow}>
        <Text style={tk.airline}>✈  LOVE AIRLINES</Text>
      </View>
      {/* 신랑(왼쪽) · 비행기(중앙) · 신부(오른쪽) */}
      <View style={tk.routeRow}>
        <View style={[tk.city, { alignItems: 'flex-start' }]}>
          <Text style={tk.cityCode} numberOfLines={1}>{groomName}</Text>
          <Text style={tk.cityParents} numberOfLines={1}>{groomParents}</Text>
          <Text style={tk.cityRole}>의 아들</Text>
        </View>
        <View style={tk.planeWrap}>
          <SwayPlane />
        </View>
        <View style={[tk.city, { alignItems: 'flex-end' }]}>
          <Text style={[tk.cityCode, { textAlign: 'right' }]} numberOfLines={1}>{brideName}</Text>
          <Text style={[tk.cityParents, { textAlign: 'right' }]} numberOfLines={1}>{brideParents}</Text>
          <Text style={[tk.cityRole, { textAlign: 'right' }]}>의 딸</Text>
        </View>
      </View>

      {/* 커플 사진 */}
      <View style={tk.photoWrap}>
        {mainImage ? (
          <Image
            source={typeof mainImage === 'string' ? { uri: mainImage } : mainImage}
            style={tk.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[tk.photo, { backgroundColor: C.skyBlue, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 56 }}>💕</Text>
          </View>
        )}
      </View>

      {/* 절취선 */}
      <View style={tk.divider}>
        <View style={tk.dividerLine} />
        <View style={[tk.dividerNub, { left: -14 }]} />
        <View style={[tk.dividerNub, { right: -14 }]} />
      </View>

      {/* 하단 정보 */}
      <View style={tk.infoGrid}>
        <View style={tk.infoItem}>
          <Text style={tk.infoLabel}>날짜</Text>
          <Text style={tk.infoValue} numberOfLines={1}>{dateStr || '날짜 미정'}</Text>
        </View>
        <View style={tk.infoItem}>
          <Text style={tk.infoLabel}>탑승 시간</Text>
          <Text style={tk.infoValue} numberOfLines={1}>{timeStr || '시간 미정'}</Text>
        </View>
        <View style={tk.infoItemFull}>
          <Text style={tk.infoLabel}>예식장</Text>
          <Text style={tk.infoValue} numberOfLines={1}>{locName || '장소 미정'}</Text>
        </View>
      </View>

      <Stamp show={showStamp} gone={stampGone} />
    </View>
  );
}
const tk = StyleSheet.create({
  card: { backgroundColor: '#fff', width: '100%', padding: 20 },
  headerRow: { marginBottom: 14 },
  airline: { fontSize: 16, fontWeight: '800', color: C.navy, letterSpacing: 0.5 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  city: { flex: 1, minWidth: 0 },
  cityCode: { fontSize: 26, fontWeight: '800', color: C.main, lineHeight: 32 },
  cityParents: { fontSize: 11, fontWeight: '500', color: C.sub, marginTop: 4 },
  cityRole: { fontSize: 11, fontWeight: '400', color: C.sub, marginTop: 1 },
  planeWrap: { width: 48, alignItems: 'center', justifyContent: 'center' },
  planeIcon: { fontSize: 32, lineHeight: 36 },
  photoWrap: { width: '100%', height: PHOTO_H, borderRadius: 12, overflow: 'hidden', backgroundColor: '#eee', marginBottom: 14 },
  photo: { width: '100%', height: '100%' },
  divider: { height: 20, position: 'relative', justifyContent: 'center', marginBottom: 8 },
  dividerLine: { height: 2, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  dividerNub: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: C.skyBlue, top: -4 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  infoItem: { width: '50%', marginBottom: 12 },
  infoItemFull: { width: '100%', marginBottom: 12 },
  infoLabel: { fontSize: 10, color: C.sub, textTransform: 'uppercase', fontWeight: '600', marginBottom: 3, letterSpacing: 1 },
  infoValue: { fontSize: 15, fontWeight: '800', color: C.main },
});

// ══════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════
export default function TicketFlightTemplate({ eventData = {}, categorizedImages = {}, allowMessages = true, selectedPhotoFrame, frameAdjusting = false, onPhotoFrameAdjust, isPreviewMode = false }) {
  const insets = useSafeAreaInsets();
  const confetti = useConfetti();
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  const mainImage = safeImages.main?.[0] || safeImages.all?.[0];
  const galleryImages = safeImages.gallery?.length > 0 ? safeImages.gallery : safeImages.all || [];

  // 데이터
  const groomName = eventData.groomName || eventData.groom_name || '김철수';
  const brideName = eventData.brideName || eventData.bride_name || '이영희';
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '';
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);
  const weddingDate = new Date(eventData.date || eventData.event_date || Date.now());
  const calYear = isNaN(weddingDate.getTime()) ? new Date().getFullYear() : weddingDate.getFullYear();
  const calMonth = isNaN(weddingDate.getTime()) ? 1 : weddingDate.getMonth() + 1;
  const calDay = isNaN(weddingDate.getTime()) ? 1 : weddingDate.getDate();
  const dowShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weddingDate.getDay()];
  const dateStr = dateInfo?.full ? `${dateInfo.full} (${dowShort})` : '';

  // D-Day 계산
  let dDayText = '';
  if (!isNaN(weddingDate.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(weddingDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) dDayText = `D-${diff}`;
    else if (diff === 0) dDayText = 'D-DAY';
    else dDayText = `D+${Math.abs(diff)}`;
  }
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '웨딩홀';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';
  const ai = eventData.additional_info || {};

  // 상태
  const [isBoarded, setIsBoarded] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [stampGone, setStampGone] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [sliderLabel, setSliderLabel] = useState('밀어서 탑승하기  >>');

  // 애니메이션 값
  const thumbX = useRef(new Animated.Value(0)).current;
  const textOp = useRef(new Animated.Value(1)).current;
  const thumbColor = useRef(new Animated.Value(0)).current;
  const mainContentOp = useRef(new Animated.Value(0)).current;
  // 티켓 위아래 — requestAnimationFrame + Math.sin으로 진짜 사인 곡선 (이음새/끊김 없음)
  const ticketFloatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isBoarded) return;
    let rafId;
    const start = Date.now();
    const AMP = 4;        // 위아래 ±4px
    const PERIOD = 4400;  // 주기 4.4초 (느긋한 호흡)
    const tick = () => {
      const t = ((Date.now() - start) % PERIOD) / PERIOD;
      ticketFloatY.setValue(AMP * Math.sin(t * Math.PI * 2));
      rafId = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [isBoarded]);

  // 슬라이더
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !unlocked,
      onPanResponderMove: (_, g) => {
        const v = Math.max(0, Math.min(g.dx, SLIDE_MAX));
        thumbX.setValue(v);
        textOp.setValue(1 - v / SLIDE_MAX);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SLIDE_MAX * 0.85) {
          Animated.timing(thumbX, { toValue: SLIDE_MAX, duration: 150, useNativeDriver: true }).start();
          thumbColor.setValue(1);
          setSliderLabel('탑승 수속 완료!');
          textOp.setValue(1);
          setUnlocked(true);
          onBoardingSuccess();
        } else {
          Animated.timing(thumbX, { toValue: 0, duration: 300, useNativeDriver: true }).start();
          Animated.timing(textOp, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const onBoardingSuccess = () => {
    // 1) 폭죽 + 도장
    setTimeout(() => {
      setShowStamp(true);
      confetti.fire();
    }, 150);
    // 2) 1.2초 후 인트로/하늘/슬라이더 전부 언마운트 + 본문으로 전환
    setTimeout(() => {
      setStampGone(true);
      setIsBoarded(true);
      DeviceEventEmitter.emit('ticket-flight-boarded', true); // 프리뷰 모달에 boarded 알림 → 음악/꽃잎 버튼 노출
      Animated.timing(mainContentOp, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1200);
  };

  const copyAccount = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('', '계좌번호가 복사되었습니다.');
    } catch {
      Alert.alert('', '복사에 실패했습니다.');
    }
  };

  // 카카오 좌표 검색
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);
  useEffect(() => {
    if (!isBoarded) return;
    resolveWeddingMapCoord({ locName, locAddr, kakaoKey: KAKAO_KEY })
      .then(coord => {
        if (coord) setMapCoord(coord);
      })
      .catch(() => {});
  }, [isBoarded, locAddr, locName]);

  // 방명록 샘플 (리뷰 리스트 형식)
  const [gbList] = useState([
    { id: 1, name: '박지민', date: '2026. 08. 15', text: '결혼 너무너무 축하해! 앞으로 꽃길만 걷자 행복해야해 🌸' },
    { id: 2, name: '최동훈', date: '2026. 08. 12', text: '철수야 축하한다! 신혼여행 조심히 잘 다녀오고 갔다와서 보자~' },
  ]);

  const thumbBg = thumbColor.interpolate({ inputRange: [0, 1], outputRange: ['#fff', C.brand] });
  const thumbTxtC = thumbColor.interpolate({ inputRange: [0, 1], outputRange: [C.skyDark, '#fff'] });

  const groomAccNum = ai.groom_account_number;
  const brideAccNum = ai.bride_account_number;

  // ═══════════════════════════════════════════════════════
  // BOARDED 이후 — intro 전체(하늘/구름/슬라이더/티켓)를 언마운트하고 풀스크린 본문만 렌더
  // ═══════════════════════════════════════════════════════
  if (isBoarded) {
    return (
      <Animated.View style={{ flex: 1, backgroundColor: C.bg, opacity: mainContentOp }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 60 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!frameAdjusting}
        >
          {/* ═══ 큰 히어로 사진 + APPROVED 스탬프 + FLIGHT TO LOVE (맨 위) ═══ */}
          <View style={bd.heroPhotoWrap}>
            {mainImage ? (
              <Image
                source={typeof mainImage === 'string' ? { uri: mainImage } : mainImage}
                style={bd.heroPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={[bd.heroPhoto, { backgroundColor: C.skyBlue, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 64 }}>💕</Text>
              </View>
            )}
            <PhotoFrameOverlay
              selectedPhotoFrame={selectedPhotoFrame}
              frameAdjusting={frameAdjusting}
              onPhotoFrameAdjust={onPhotoFrameAdjust}
            />
            <View style={bd.heroOverlay}>
              <View style={bd.approvedStamp}>
                <Text style={bd.approvedStampText}>APPROVED</Text>
              </View>
              <Text style={bd.flightTitle}>FLIGHT{'\n'}TO LOVE</Text>
              <Text style={bd.flightNames}>{groomName} & {brideName}</Text>
            </View>
          </View>

          {/* ═══ 컨텐츠 카드들 ═══ */}
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            {/* 기장 인사말 — 바코드 + 가운데 DEPARTURE 워터마크 */}
            <StubCard icon="📣" title="초대의 인사">
              <View style={{ position: 'relative' }}>
                <Text style={mc.watermarkCentered}>DEPARTURE</Text>
                <Text style={mc.greetingText}>
                  {eventData.customMessage || eventData.custom_message ||
                    '각자의 길을 비행하던 두 사람이\n이제 한 비행기에 올라\n같은 목적지를 향해 날아가려 합니다.\n\n가장 설레는 첫 출발의 순간,\n소중한 분들을 저희의 비행에 초대합니다.\n귀한 걸음 하시어 축복해 주시면\n더없는 기쁨으로 간직하겠습니다.'}
                </Text>
              </View>
            </StubCard>

            {/* 달력 — 바코드 대신 D-DAY 카운트다운 텍스트 */}
            <StubCard
              icon="📅" title="결혼식 일정"
              footer={<Text style={mc.ddayText}>D-Day 카운트다운 : {dDayText || '오늘'}</Text>}
            >
              <CalendarView year={calYear} month={calMonth} day={calDay} />
            </StubCard>

            {/* 갤러리 — 바코드/절취선 없음 */}
            {galleryImages.length > 0 && (
              <StubCard icon="📷" title="우리의 추억" footer={null}>
                {galleryImages[0] && (
                  <View style={mc.galleryFull}>
                    <Image
                      source={typeof galleryImages[0] === 'string' ? { uri: galleryImages[0] } : galleryImages[0]}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                )}
                {(galleryImages[1] || galleryImages[2]) && (
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    {galleryImages[1] && (
                      <View style={[mc.galleryItem, { transform: [{ rotate: '-2deg' }] }]}>
                        <Image
                          source={typeof galleryImages[1] === 'string' ? { uri: galleryImages[1] } : galleryImages[1]}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    {galleryImages[2] && (
                      <View style={[mc.galleryItem, { transform: [{ rotate: '2deg' }] }]}>
                        <Image
                          source={typeof galleryImages[2] === 'string' ? { uri: galleryImages[2] } : galleryImages[2]}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  </View>
                )}
              </StubCard>
            )}

            {/* 오시는 길 + 지도 — 바코드/절취선 없음 */}
            <StubCard icon="📍" title="오시는 길" headerBg={C.brand} footer={null}>
              <Text style={mc.locationName}>{locName || '장소 미정'}</Text>
              {locAddr ? <Text style={mc.locationAddr}>{locAddr}</Text> : null}
              {/* 결혼식 날짜 + 시간 */}
              {dateStr ? (
                <Text style={mc.locationDate}>🗓  {dateStr}{timeStr ? `  ·  ${timeStr}` : ''}</Text>
              ) : null}
              {mapCoord ? (
                <View style={mc.mapContainer}>
                  <WebView
                    source={{
                      html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#F3F7FF}</style></head><body><div id="map"></div><script>var lat=${Number(mapCoord.lat)};var lng=${Number(mapCoord.lng)};var map=L.map('map',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,tap:false}).setView([lat,lng],17);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([lat,lng]).addTo(map);</script></body></html>`
                    }}
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    scrollEnabled={false}
                    javaScriptEnabled
                    domStorageEnabled
                    originWhitelist={['*']}
                  />
                </View>
              ) : (
                <View style={mc.mapPlaceholder}>
                  <LottieLoading text="지도를 불러오는 중..." size={54} color={C.sub} />
                </View>
              )}
              {/* 내비 버튼 — 깔끔한 아웃라인 스타일 */}
              <View style={mc.navBtns}>
                <TouchableOpacity
                  style={mc.navBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isPreviewMode) {
                      Alert.alert('', '미리보기에서는 사용할 수 없습니다.');
                      return;
                    }
                    const q = encodeURIComponent(locAddr || locName);
                    Linking.openURL(`nmap://search?query=${q}&appname=com.gyeongjo`)
                      .catch(() => Linking.openURL(`https://map.naver.com/v5/search/${q}`));
                  }}
                >
                  <Text style={mc.navBtnText}>네이버지도</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={mc.navBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isPreviewMode) {
                      Alert.alert('', '미리보기에서는 사용할 수 없습니다.');
                      return;
                    }
                    if (mapCoord) {
                      Linking.openURL(`kakaomap://look?p=${mapCoord.lat},${mapCoord.lng}`)
                        .catch(() => Linking.openURL(`https://map.kakao.com/link/map/${encodeURIComponent(locName)},${mapCoord.lat},${mapCoord.lng}`));
                    } else {
                      const q = encodeURIComponent(locAddr || locName);
                      Linking.openURL(`https://map.kakao.com/?q=${q}`);
                    }
                  }}
                >
                  <Text style={mc.navBtnText}>카카오맵</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={mc.navBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isPreviewMode) {
                      Alert.alert('', '미리보기에서는 사용할 수 없습니다.');
                      return;
                    }
                    if (mapCoord) {
                      Linking.openURL(`tmap://route?goalx=${mapCoord.lng}&goaly=${mapCoord.lat}&goalname=${encodeURIComponent(locName)}`)
                        .catch(() => Linking.openURL(`https://tmap.life/search?query=${encodeURIComponent(locAddr || locName)}`));
                    } else {
                      Linking.openURL(`https://tmap.life/search?query=${encodeURIComponent(locAddr || locName)}`);
                    }
                  }}
                >
                  <Text style={mc.navBtnText}>티맵</Text>
                </TouchableOpacity>
              </View>
              {(eventData.parkingInfo || eventData.parking_info) && (
                <View style={[mc.transitRow, { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' }]}>
                  <View style={mc.badge}><Text style={mc.badgeText}>주차</Text></View>
                  <Text style={mc.transitText}>{eventData.parkingInfo || eventData.parking_info}</Text>
                </View>
              )}
            </StubCard>

            {/* 계좌 — 신랑/신부 + 양가 부모님 모두 표시 */}
            {(() => {
              const groomAccounts = [
                ai.groom_account_number && { label: `신랑 ${groomName}`.trim() || '신랑', bank: ai.groom_bank_name || '은행', number: ai.groom_account_number, name: groomName || '신랑' },
                ai.groom_father_account_number && { label: groomFather ? `신랑 아버님 ${groomFather}` : '신랑 아버님', bank: ai.groom_father_bank_name || '은행', number: ai.groom_father_account_number, name: groomFather || '아버님' },
                ai.groom_mother_account_number && { label: groomMother ? `신랑 어머님 ${groomMother}` : '신랑 어머님', bank: ai.groom_mother_bank_name || '은행', number: ai.groom_mother_account_number, name: groomMother || '어머님' },
              ].filter(Boolean);
              const brideAccounts = [
                ai.bride_account_number && { label: `신부 ${brideName}`.trim() || '신부', bank: ai.bride_bank_name || '은행', number: ai.bride_account_number, name: brideName || '신부' },
                ai.bride_father_account_number && { label: brideFather ? `신부 아버님 ${brideFather}` : '신부 아버님', bank: ai.bride_father_bank_name || '은행', number: ai.bride_father_account_number, name: brideFather || '아버님' },
                ai.bride_mother_account_number && { label: brideMother ? `신부 어머님 ${brideMother}` : '신부 어머님', bank: ai.bride_mother_bank_name || '은행', number: ai.bride_mother_account_number, name: brideMother || '어머님' },
              ].filter(Boolean);
              const total = groomAccounts.length + brideAccounts.length;
              if (total === 0) return null;
              return (
                <StubCard icon="💰" title="마음 전하기">
                  <Text style={mc.accountDesc}>
                    {'참석이 어려우신 분들을 위해\n마음 전하실 곳을 안내해 드립니다.'}
                  </Text>
                  {groomAccounts.length > 0 && (
                    <>
                      <Text style={mc.accountGroupLabel}>신랑측</Text>
                      {groomAccounts.map((acc, i) => (
                        <AccountItem
                          key={`g${i}`}
                          label={acc.label}
                          bank={acc.bank}
                          account={acc.number}
                          name={acc.name}
                          onCopy={copyAccount}
                        />
                      ))}
                    </>
                  )}
                  {brideAccounts.length > 0 && (
                    <>
                      <Text style={[mc.accountGroupLabel, { marginTop: groomAccounts.length > 0 ? 16 : 0 }]}>신부측</Text>
                      {brideAccounts.map((acc, i) => (
                        <AccountItem
                          key={`b${i}`}
                          label={acc.label}
                          bank={acc.bank}
                          account={acc.number}
                          name={acc.name}
                          onCopy={copyAccount}
                        />
                      ))}
                    </>
                  )}
                </StubCard>
              );
            })()}

            {/* 방명록 — 다른 템플릿처럼 리스트 + 버튼 방식 */}
            <StubCard icon="✏️" title="방명록" footer={null}>
              {gbList.map((c, idx) => (
                <View key={c.id} style={[gb.reviewCard, idx === gbList.length - 1 && { marginBottom: 0 }]}>
                  <View style={gb.reviewTop}>
                    <Text style={gb.reviewName}>{c.name}</Text>
                    <Text style={gb.reviewDate}>{c.date}</Text>
                  </View>
                  <Text style={gb.reviewText}>{c.text}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={gb.addBtn}
                onPress={() => Alert.alert('', '미리보기에서는 메시지를 남길 수 없습니다.')}
                activeOpacity={0.85}
              >
                <Text style={gb.addBtnText}>+ 축하 메시지 남기기</Text>
              </TouchableOpacity>
            </StubCard>

            {/* ═══ 하단 공유 섹션 ═══ */}
            <View style={fo.section}>
              <Text style={fo.thankYou}>감사합니다</Text>
              <Text style={fo.subtitle}>귀한 걸음으로 축복해 주세요</Text>
              <Text style={fo.names}>{groomName} & {brideName}</Text>
              <TouchableOpacity
                style={fo.shareBtn}
                onPress={() => Alert.alert('', '미리보기에서는 공유할 수 없습니다.')}
                activeOpacity={0.88}
              >
                <Text style={fo.shareBtnIcon}>✈</Text>
                <Text style={fo.shareBtnText}>초대장 공유하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    );
  }

  // ═══════════════════════════════════════════════════════
  // INTRO 상태 — 하늘 + 구름 + 티켓 + 슬라이더
  // ═══════════════════════════════════════════════════════
  return (
    <View style={s.root}>
      {/* 하늘 */}
      <View style={s.sky} pointerEvents="none">
        <Cloud top={H * 0.1} size={110} delay={0} />
        <Cloud top={H * 0.28} size={130} delay={8000} />
        <Cloud top={H * 0.75} size={90} delay={4000} />
      </View>

      {/* 중앙 티켓 — 위아래로 둥실둥실 */}
      <View style={s.introContainer}>
        <Animated.View style={[s.ticketFloating, { transform: [{ translateY: ticketFloatY }] }]}>
          <TicketCard
            groomName={groomName}
            brideName={brideName}
            groomFather={groomFather}
            groomMother={groomMother}
            brideFather={brideFather}
            brideMother={brideMother}
            mainImage={mainImage}
            dateStr={dateStr}
            timeStr={timeStr}
            locName={locName}
            isBoarded={false}
            showStamp={showStamp}
            stampGone={stampGone}
          />
        </Animated.View>
      </View>

      {/* 하단 슬라이더 */}
      <View style={[s.slider, { bottom: insets.bottom + 32, width: SLIDER_W }]}>
        <Animated.Text style={[s.sliderText, { opacity: textOp }]}>{sliderLabel}</Animated.Text>
        <Animated.View
          style={[s.thumb, { backgroundColor: thumbBg, transform: [{ translateX: thumbX }] }]}
          {...panResponder.panHandlers}
        >
          <Animated.Text style={[s.thumbIcon, { color: thumbTxtC }]}>✈</Animated.Text>
        </Animated.View>
      </View>

      {/* 폭죽 */}
      {confetti.particles.map((p) => (
        <Animated.View
          key={p.id}
          pointerEvents="none"
          style={[
            s.particle,
            {
              width: p.size, height: p.size, backgroundColor: p.color, opacity: p.op,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: p.rot.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.skyBlue, overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: C.skyBlue },

  // INTRO 컨테이너 — 티켓을 세로 중앙에 floating
  introContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketFloating: {
    width: TICKET_W,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },

  // 슬라이더 — 하단 full-width pill
  slider: {
    position: 'absolute',
    alignSelf: 'center',
    height: THUMB_SIZE + SLIDER_PAD * 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: (THUMB_SIZE + SLIDER_PAD * 2) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SLIDER_PAD,
    zIndex: 30,
  },
  sliderText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbIcon: { fontSize: 22, fontWeight: '700' },
  particle: { position: 'absolute', zIndex: 50 },
});

const mc = StyleSheet.create({
  watermarkCentered: {
    position: 'absolute',
    top: '50%', left: 0, right: 0,
    textAlign: 'center',
    fontSize: 56, fontWeight: '900',
    color: 'rgba(0,0,0,0.05)',
    letterSpacing: 8,
    marginTop: -30, // 텍스트 센터 정렬 보정
    zIndex: 0,
  },
  greetingText: { fontSize: 15, lineHeight: 28, color: '#333', textAlign: 'center', fontWeight: '400' },
  ddayText: {
    fontSize: 12, color: C.sub, fontWeight: '600', letterSpacing: 1,
    textTransform: 'uppercase', textAlign: 'center', marginTop: 18,
  },
  galleryFull: {
    width: '100%', height: 200, backgroundColor: '#fff', padding: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  galleryItem: {
    flex: 1, aspectRatio: 1, backgroundColor: '#fff', padding: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  gateDisplay: { backgroundColor: '#111', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  gateText: { color: '#ff9f43', fontSize: 22, fontWeight: '600', letterSpacing: 4 },
  locationName: { fontSize: 15, fontWeight: '700', color: C.navy, marginBottom: 4 },
  locationAddr: { fontSize: 13, color: '#777', marginBottom: 6 },
  locationDate: { fontSize: 13, color: C.main, fontWeight: '600', marginBottom: 14 },
  navBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  navBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e5e8eb',
  },
  navBtnText: { fontSize: 13, fontWeight: '600', color: C.main, letterSpacing: 0.2 },
  mapContainer: {
    width: '100%', height: 180, borderRadius: 8, overflow: 'hidden',
    marginBottom: 12, backgroundColor: '#dfe6e9',
  },
  mapPlaceholder: {
    width: '100%', height: 180, backgroundColor: '#dfe6e9', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  transitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { backgroundColor: C.sub, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  transitText: { fontSize: 13, color: '#444', flex: 1 },
  accountDesc: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 24, marginBottom: 18 },
  accountGroupLabel: {
    fontSize: 12, fontWeight: '800', color: C.navy, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 10,
  },
});

// ══════════════════════════════════════════════════════
// Boarded 화면 — 티켓 헤더/히어로 사진/바코드 전용
// ══════════════════════════════════════════════════════
const bd = StyleSheet.create({
  ticketHeader: { backgroundColor: '#fff', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 14 },
  heroPhotoWrap: {
    width: '100%', height: H * 0.6, position: 'relative', backgroundColor: '#222',
  },
  heroPhoto: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 80, paddingBottom: 40, paddingHorizontal: 24,
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)',
  },
  approvedStamp: {
    position: 'absolute', top: 16, right: 20,
    borderWidth: 3, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 4,
    transform: [{ rotate: '15deg' }],
  },
  approvedStampText: {
    fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.95)', letterSpacing: 1,
  },
  flightTitle: {
    fontSize: 36, fontWeight: '900', color: '#fff',
    letterSpacing: 4, marginBottom: 10, textAlign: 'center', lineHeight: 40,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  flightNames: { fontSize: 15, fontWeight: '500', color: '#e0e0e0', letterSpacing: 2 },

  ticketBottom: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 4 },
  dividerWrap: { height: 24, justifyContent: 'center', overflow: 'visible' },
  dividerLine: { height: 2, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', marginHorizontal: 6 },
  dividerNub: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, top: -2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 10 },
  barcodeWrap: { paddingVertical: 8 },
  barcode: { height: 32, opacity: 0.2, backgroundColor: C.main },
});

// ══════════════════════════════════════════════════════
// 방명록 (Immigration Card)
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// Footer (공유 섹션)
// ══════════════════════════════════════════════════════
const fo = StyleSheet.create({
  section: {
    marginTop: 20, marginBottom: 40, paddingVertical: 40, paddingHorizontal: 24,
    alignItems: 'center',
  },
  thankYou: {
    fontSize: 30, fontWeight: '900', color: C.navy,
    letterSpacing: 2, marginBottom: 10, textAlign: 'center',
  },
  subtitle: {
    fontSize: 13, color: C.sub, fontWeight: '500',
    letterSpacing: 1, marginBottom: 24, textAlign: 'center',
  },
  names: {
    fontSize: 15, color: C.main, fontWeight: '700',
    letterSpacing: 3, marginBottom: 32, textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.navy, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 999, gap: 8,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  shareBtnIcon: { color: '#fff', fontSize: 16, fontWeight: '800' },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});

const gb = StyleSheet.create({
  // 리뷰 카드 형식 (다른 템플릿과 통일)
  reviewCard: {
    backgroundColor: '#fdfbf7', padding: 14, borderRadius: 6,
    borderLeftWidth: 3, borderLeftColor: C.brand, marginBottom: 10,
  },
  reviewTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  reviewName: { fontSize: 14, fontWeight: '700', color: C.navy, letterSpacing: 0.3 },
  reviewDate: { fontSize: 11, color: '#999', fontWeight: '500' },
  reviewText: { fontSize: 13, color: '#444', lineHeight: 20 },
  addBtn: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: C.brand,
    borderRadius: 6, paddingVertical: 14, marginTop: 8, alignItems: 'center',
    backgroundColor: 'rgba(255, 118, 117, 0.05)',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: C.brand, letterSpacing: 0.5 },
});
