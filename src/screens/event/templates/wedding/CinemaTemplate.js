import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TextInput, TouchableOpacity,
  Animated, StyleSheet, Dimensions, Easing, Modal, Linking, Platform, KeyboardAvoidingView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieLoading from '../../../../components/LottieLoading';
import {
  getCategorizedImagesSafe,
  useCountdown,
  formatKoreanDate,
  formatKoreanTime,
  resolveWeddingMapCoord,
} from './WeddingUtils';
import { PhotoFrameOverlay } from './WeddingCommonComponents';

const { width: W, height: H } = Dimensions.get('window');

const C = {
  red:    '#8b0000',
  gold:   '#d4af37',
  black:  '#111111',
  dark:   '#1a1a1a',
  white:  '#f8f9fa',
  main:   '#e0e0e0',
  sub:    '#a0a0a0',
  border: '#333333',
};

// ── 커튼 컴포넌트 ──
function Curtain({ side, openAnim }) {
  const scaleX = openAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  return (
    <Animated.View
      style={[
        cu.curtain,
        side === 'left' ? { left: 0, transformOrigin: 'left' } : { right: 0, transformOrigin: 'right' },
        { transform: [{ scaleX }] },
      ]}
    />
  );
}
const cu = StyleSheet.create({
  curtain: {
    position: 'absolute', top: 0, width: '50%', height: '100%', backgroundColor: C.red,
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10,
  },
});

// ── 클래퍼보드 ──
function Clapperboard({ onTap, namesText, dateText }) {
  const stickRot = useRef(new Animated.Value(-25)).current;
  const boardSc = useRef(new Animated.Value(1)).current;

  const doClap = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(stickRot, { toValue: 0, duration: 150, easing: Easing.out(Easing.back(3)), useNativeDriver: true }),
        Animated.timing(boardSc,  { toValue: 0.95, duration: 150, useNativeDriver: true }),
      ]),
      Animated.timing(boardSc, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => onTap());
  };

  const rot = stickRot.interpolate({ inputRange: [-25, 0], outputRange: ['-25deg', '0deg'] });

  return (
    <TouchableOpacity onPress={doClap} activeOpacity={0.9}>
      <Animated.View style={[cb.wrapper, { transform: [{ scale: boardSc }, { rotate: '-5deg' }] }]}>
        <Animated.View style={[cb.stick, { transform: [{ rotate: rot }] }]}>
          {Array.from({ length: 7 }, (_, i) => (
            <View key={i} style={[cb.stripe, { left: i * 36, backgroundColor: i % 2 === 0 ? '#fff' : '#111' }]} />
          ))}
        </Animated.View>
        <View style={cb.bottom}>
          <View style={cb.topRow}>
            <View style={cb.topCell}><Text style={cb.topLabel}>SCENE</Text><Text style={cb.topValue}>01</Text></View>
            <View style={cb.topCell}><Text style={cb.topLabel}>TAKE</Text><Text style={cb.topValue}>24</Text></View>
            <View style={cb.topCell}><Text style={cb.topLabel}>ROLL</Text><Text style={cb.topValue}>10</Text></View>
          </View>

          <Text style={cb.title}>WEDDING</Text>

          <View style={cb.footer}>
            <View style={cb.footerCell}>
              <Text style={cb.footerLabel}>CAST</Text>
              <Text style={cb.footerValue} numberOfLines={1}>{namesText}</Text>
            </View>
            <View style={cb.footerDivider} />
            <View style={cb.footerCell}>
              <Text style={cb.footerLabel}>DATE</Text>
              <Text style={cb.footerValue} numberOfLines={1}>{dateText}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
const cb = StyleSheet.create({
  wrapper: { width: 280 },
  stick:   { width: '100%', height: 40, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden',
    transformOrigin: 'bottom left', borderWidth: 2, borderColor: '#333', flexDirection: 'row', zIndex: 2 },
  stripe:  { position: 'absolute', top: 0, width: 18, height: '100%' },
  bottom:  { backgroundColor: '#111', borderRadius: 8, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    padding: 20, borderWidth: 2, borderColor: '#333', borderTopWidth: 0 },

  topRow:     { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#333', paddingBottom: 10, marginBottom: 12 },
  topCell:    { alignItems: 'flex-start' },
  topLabel:   { fontSize: 9, color: '#777', letterSpacing: 2, marginBottom: 2 },
  topValue:   { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 1 },

  title:      { textAlign: 'center', fontSize: 30, fontWeight: '800', color: C.gold, letterSpacing: 6, marginBottom: 14 },

  footer:     { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#2a2a2a', paddingTop: 12 },
  footerCell: { flex: 1 },
  footerLabel:{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 4, fontWeight: '700' },
  footerValue:{ fontSize: 13, color: '#fff', fontWeight: '600', letterSpacing: 0.5 },
  footerDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#333', marginHorizontal: 14 },
});

// ── 필름 스트립 (가로 스크롤) ──
function FilmStrip({ images, onImagePress }) {
  if (!images || images.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fs.scrollContent}>
      <View style={fs.strip}>
        <View style={fs.holesTopRow}>
          {Array.from({ length: Math.max(images.length * 3, 8) }, (_, i) => (
            <View key={`t${i}`} style={fs.holeH} />
          ))}
        </View>
        <View style={fs.framesRow}>
          {images.map((img, i) => (
            <TouchableOpacity key={i} style={fs.frame} onPress={() => onImagePress && onImagePress(img)} activeOpacity={0.9}>
              <Image
                source={typeof img === 'string' ? { uri: img } : img}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={fs.holesBottomRow}>
          {Array.from({ length: Math.max(images.length * 3, 8) }, (_, i) => (
            <View key={`b${i}`} style={fs.holeH} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
const fs = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24 },
  strip: { backgroundColor: '#000', paddingVertical: 14, borderWidth: 2, borderColor: '#222' },
  holesTopRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, paddingHorizontal: 8 },
  holesBottomRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingHorizontal: 8 },
  holeH: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#444' },
  framesRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 12 },
  frame: { width: 220, height: 165, backgroundColor: '#fff', padding: 3 },
});

// ── 섹션 래퍼 ──
function Section({ title, subtitle, children, alt, noHeader }) {
  return (
    <View style={[sec.wrap, alt && sec.wrapAlt]}>
      {!noHeader && (
        <View style={sec.header}>
          <Text style={sec.title}>{title}</Text>
          {subtitle ? <Text style={sec.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
      {children}
    </View>
  );
}
const sec = StyleSheet.create({
  wrap:    { paddingHorizontal: 24, paddingVertical: 56, backgroundColor: C.black },
  wrapAlt: { backgroundColor: C.dark },
  header:  { alignItems: 'center', marginBottom: 36 },
  title:   { fontSize: 28, fontWeight: '800', color: C.gold, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 },
  subtitle:{ fontSize: 13, color: C.sub, letterSpacing: 3 },
});

// ======================================================================
// 메인
// ======================================================================
export default function CinemaTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings, selectedPhotoFrame, frameAdjusting = false, onPhotoFrameAdjust, isPreviewMode = false }) {
  const insets = useSafeAreaInsets();
  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // ── 이름 / 부모 ──
  const groomName = eventData.groomName || eventData.groom_name || '';
  const brideName = eventData.brideName || eventData.bride_name || '';
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '';

  // ── 날짜/시간 ──
  const weddingDate = eventData.date || eventData.event_date;
  const dateInfo = formatKoreanDate(weddingDate);
  const dateStr = dateInfo?.full || '';
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);

  let shortDate = '', posterDate = '', showtimeDate = '';
  let calYear = 2026, calMonth = 1, calDay = 1;
  if (weddingDate) {
    try {
      const d = new Date(weddingDate);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        shortDate = `${y}.${m}.${dd}`;
        const MON = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
        posterDate = `${MON[d.getMonth()]} ${d.getDate()}, ${y}`;
        const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
        showtimeDate = `${y}. ${m}. ${dd} ${DOW[d.getDay()]}`;
        calYear = y; calMonth = d.getMonth() + 1; calDay = d.getDate();
      }
    } catch {}
  }
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const calDays = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const calMonthName = MONTH_NAMES[calMonth - 1] || '';

  // ── D-day ──
  let dDayText = '';
  if (weddingDate) {
    const diff = Math.ceil((new Date(weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff > 0) dDayText = `D-${diff}`;
    else if (diff === 0) dDayText = 'D-Day';
    else dDayText = `D+${Math.abs(diff)}`;
  }

  // ── 카운트다운 ──
  const timeLeft = useCountdown(weddingDate, eventData.ceremonyTime || eventData.ceremony_time);

  // ── 클래퍼보드 출연진 표기 ──
  const namesText = (groomName || brideName)
    ? `${groomName || '신랑'} × ${brideName || '신부'}`
    : 'GROOM × BRIDE';
  const clapDate = shortDate || '— . — . —';

  // ── 장소 ──
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';

  // ── 갤러리 ──
  const galleryImages = safeImages.gallery?.length > 0
    ? safeImages.gallery
    : (safeImages.all || []);

  // ── 포스터 메인 이미지 ──
  const mainImage = safeImages.main?.[0] || safeImages.all?.[0] || null;

  // ── 계좌 / 연락처 ──
  const aInfo = eventData.additional_info || {};
  const groomContact = eventData.groomContact || eventData.groom_contact || '';
  const brideContact = eventData.brideContact || eventData.bride_contact || '';
  const groomFatherContact = eventData.groomFatherContact || aInfo.groom_father_contact || '';
  const groomMotherContact = eventData.groomMotherContact || aInfo.groom_mother_contact || '';
  const brideFatherContact = eventData.brideFatherContact || aInfo.bride_father_contact || '';
  const brideMotherContact = eventData.brideMotherContact || aInfo.bride_mother_contact || '';

  const buildPerson = (name, role, bank, number, contact) => {
    if (!number && !contact) return null;
    return { name: name || role, role, bank: bank || '', number: number || '', contact: contact || '' };
  };
  const accounts = {
    groom: [
      buildPerson(groomName || '신랑', '신랑', aInfo.groom_bank_name, aInfo.groom_account_number, groomContact),
      buildPerson(groomFather ? `${groomFather} 아버님` : '아버님', '아버님', aInfo.groom_father_bank_name, aInfo.groom_father_account_number, groomFatherContact),
      buildPerson(groomMother ? `${groomMother} 어머님` : '어머님', '어머님', aInfo.groom_mother_bank_name, aInfo.groom_mother_account_number, groomMotherContact),
    ].filter(Boolean),
    bride: [
      buildPerson(brideName || '신부', '신부', aInfo.bride_bank_name, aInfo.bride_account_number, brideContact),
      buildPerson(brideFather ? `${brideFather} 아버님` : '아버님', '아버님', aInfo.bride_father_bank_name, aInfo.bride_father_account_number, brideFatherContact),
      buildPerson(brideMother ? `${brideMother} 어머님` : '어머님', '어머님', aInfo.bride_mother_bank_name, aInfo.bride_mother_account_number, brideMotherContact),
    ].filter(Boolean),
  };
  const hasAnyAccount = accounts.groom.length > 0 || accounts.bride.length > 0;

  // 전화번호 포맷
  const formatPhone = (phone) => {
    const d = (phone || '').replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
    return phone || '';
  };

  // ── 교통편 ──
  const transportInfo = aInfo.transport || eventData.transport || null;

  // ── 인트로 애니메이션 ──
  const [isAction,  setIsAction]  = useState(false);
  const [introGone, setIntroGone] = useState(false);

  const curtainOpen = useRef(new Animated.Value(0)).current;
  const introOp     = useRef(new Animated.Value(1)).current;
  const flashOp     = useRef(new Animated.Value(0)).current;
  const contentOp   = useRef(new Animated.Value(0)).current;
  const tapBlink    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(tapBlink, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      Animated.timing(tapBlink, { toValue: 1,   duration: 750, useNativeDriver: true }),
    ])).start();
  }, []);

  const handleClap = () => {
    if (isAction) return;
    setIsAction(true);
    setTimeout(() => {
      flashOp.setValue(1);
      Animated.timing(flashOp, { toValue: 0, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }, 150);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(curtainOpen, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(introOp,     { toValue: 0, duration: 600,  useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(contentOp, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ]).start(() => setIntroGone(true));
    }, 200);
  };

  // ── 토스트 ──
  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const showToast = (message) => {
    setToast({ visible: true, message });
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, message: '' }));
  };

  const blockPreviewAction = () => {
    showToast('미리보기에서는 사용할 수 없습니다');
  };

  const copyAccount = async (text) => {
    try {
      await Clipboard.setStringAsync((text || '').replace(/-/g, ''));
      showToast('계좌번호가 복사되었습니다');
    } catch { showToast('복사에 실패했습니다'); }
  };

  // ── 이미지 뷰어 ──
  const [viewerImage, setViewerImage] = useState(null);

  // ── 계좌 아코디언 ──
  const [activeAccount, setActiveAccount] = useState(null);
  const groomAnim = useRef(new Animated.Value(0)).current;
  const brideAnim = useRef(new Animated.Value(0)).current;
  const chevGroom = useRef(new Animated.Value(0)).current;
  const chevBride = useRef(new Animated.Value(0)).current;
  const toggleAccount = (side) => {
    const isOpen = activeAccount === side;
    const anim = side === 'groom' ? groomAnim : brideAnim;
    const other = side === 'groom' ? brideAnim : groomAnim;
    const chev = side === 'groom' ? chevGroom : chevBride;
    const chevO = side === 'groom' ? chevBride : chevGroom;
    Animated.timing(other, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    Animated.timing(chevO, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    Animated.timing(anim, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    Animated.timing(chev, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    setActiveAccount(isOpen ? null : side);
  };

  // ── 카카오 좌표 ──
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);
  useEffect(() => {
    resolveWeddingMapCoord({ locName, locAddr, kakaoKey: KAKAO_KEY })
      .then(coord => {
        if (coord) setMapCoord(coord);
      })
      .catch(() => {});
  }, [locAddr, locName]);

  const mapHtml = mapCoord ? `
    <!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <style>body,html,#m{margin:0;padding:0;height:100%;background:#111;filter:invert(1) hue-rotate(180deg);}</style></head>
    <body><div id="m"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('m', { zoomControl:false, attributionControl:false }).setView([${mapCoord.lat},${mapCoord.lng}], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);
    </script></body></html>` : '';

  // ── 방명록 ──
  const [guestBookOpen, setGuestBookOpen] = useState(false);
  const [gbName, setGbName] = useState('');
  const [gbPassword, setGbPassword] = useState('');
  const [gbMessage, setGbMessage] = useState('');
  const [reviews, setReviews] = useState([
    { id: 1, name: '씨네필 박지민', date: '2026. 08. 15', text: '올해 개봉작 중 최고의 로맨스! 두 분의 아름다운 앞날을 응원합니다. 🎬🍿' },
    { id: 2, name: '친구 최동훈',   date: '2026. 08. 12', text: '엔딩 크레딧이 올라갈 때까지 눈을 뗄 수 없을 것 같아요. 결혼 축하해!' },
  ]);
  const handleGuestBookSubmit = () => {
    if (!gbName.trim() || !gbMessage.trim()) {
      showToast('이름과 메시지를 입력해주세요');
      return;
    }
    const today = new Date();
    const date = `${today.getFullYear()}. ${String(today.getMonth()+1).padStart(2,'0')}. ${String(today.getDate()).padStart(2,'0')}`;
    setReviews(prev => [{ id: Date.now(), name: `관객 ${gbName.trim()}`, date, text: gbMessage.trim() }, ...prev]);
    setGbName(''); setGbPassword(''); setGbMessage('');
    setGuestBookOpen(false);
    showToast('관람평이 등록되었습니다 🎬');
  };

  // ── 공유 / 링크 복사 ──
  const handleShareLink = async () => {
    if (isPreviewMode) {
      showToast('미리보기에서는 공유할 수 없습니다');
      return;
    }

    try {
      await Clipboard.setStringAsync(`${groomName || '신랑'} ❤ ${brideName || '신부'} 결혼식 초대장`);
      showToast('초대장 내용이 복사되었습니다');
    } catch { showToast('복사에 실패했습니다'); }
  };

  // ══════════════════════════════════════════════════════════════════
  return (
    <View style={s.root}>
      {/* 커튼 */}
      {!introGone && (
        <>
          <Curtain side="left"  openAnim={curtainOpen} />
          <Curtain side="right" openAnim={curtainOpen} />
        </>
      )}

      {/* 플래시 */}
      <Animated.View pointerEvents="none" style={[s.flash, { opacity: flashOp }]} />

      {/* 인트로 레이어 */}
      {!introGone && (
        <Animated.View style={[s.introLayer, { opacity: introOp }]}>
          <Clapperboard onTap={handleClap} namesText={namesText} dateText={clapDate} />
          <Animated.View style={[s.tapHint, { opacity: tapBlink }]}>
            <Text style={s.tapHintText}>초대장 열기</Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* 본문 */}
      <ScrollView
        scrollEnabled={isAction}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!frameAdjusting}
      >
        <Animated.View style={{ opacity: contentOp }}>

          {/* 포스터: 사진만 깔끔하게 */}
          <View style={[s.poster, { height: H * 0.75 }]}>
            {mainImage ? (
              <TouchableOpacity activeOpacity={0.95} style={StyleSheet.absoluteFill} onPress={() => setViewerImage(mainImage)}>
                <Image
                  source={typeof mainImage === 'string' ? { uri: mainImage } : mainImage}
                  style={s.posterImg}
                  resizeMode="cover"
                />
                <PhotoFrameOverlay
                  selectedPhotoFrame={selectedPhotoFrame}
                  frameAdjusting={frameAdjusting}
                  onPhotoFrameAdjust={onPhotoFrameAdjust}
                />
              </TouchableOpacity>
            ) : (
              <View style={[s.posterImg, { backgroundColor: '#222' }]} />
            )}
          </View>

          {/* 타이틀 카드 (포스터의 텍스트들을 여기로 이동) */}
          <Section title="" subtitle="" noHeader>
            <View style={s.titleCard}>
              {/* 크레딧 박스 */}
              <View style={s.creditsBox}>
                <View style={s.creditsDividerRow}>
                  <View style={s.creditsLine} />
                  <Text style={s.creditsStar}>★</Text>
                  <View style={s.creditsLine} />
                </View>
                <Text style={s.creditsLabel}>A ROMANTIC FILM BY</Text>
                <Text style={s.creditsNames}>
                  {(groomName || 'GROOM').toUpperCase()}
                  <Text style={s.creditsAmp}>  &  </Text>
                  {(brideName || 'BRIDE').toUpperCase()}
                </Text>
                <View style={s.creditsDividerRow}>
                  <View style={s.creditsLine} />
                  <Text style={s.creditsStar}>★</Text>
                  <View style={s.creditsLine} />
                </View>
              </View>

              <Text style={s.titleMain}>{'THE\nWEDDING'}</Text>
              <Text style={s.titleSubtitle}>우리들의 가장 빛나는 순간</Text>
              {posterDate ? (
                <View style={s.titleDateBadge}>
                  <Text style={s.titleDate}>{posterDate}</Text>
                </View>
              ) : null}
              {dDayText ? <Text style={s.titleDDay}>{dDayText}</Text> : null}
            </View>
          </Section>

          {/* 시놉시스 */}
          <Section title="Synopsis" subtitle="시놉시스" alt>
            <Text style={s.synopsisText}>
              {eventData.customMessage || eventData.custom_message ? (
                eventData.customMessage || eventData.custom_message
              ) : (
                <>
                  {'각자의 장르에서 주인공으로 살던 두 사람이\n서로를 만나 '}
                  <Text style={{ color: C.gold, fontWeight: '600' }}>단 하나의 로맨스 영화</Text>
                  {'를\n완성하게 되었습니다.\n\n때로는 코미디처럼 유쾌하게,\n때로는 멜로처럼 따뜻하게\n아름다운 이야기를 써 내려가려 합니다.\n\n저희 영화의 '}
                  <Text style={{ color: C.gold, fontWeight: '600' }}>첫 시사회</Text>
                  {'에\nVIP 관객으로 모시고 싶습니다.\n부디 참석하시어 자리를 빛내주세요.'}
                </>
              )}
            </Text>

            {/* 부모님 자식 표시 */}
            {(groomFather || groomMother || brideFather || brideMother) && (
              <View style={s.parentsWrap}>
                {(groomFather || groomMother) && (
                  <Text style={s.parentsText}>
                    {groomFather}{groomFather && groomMother ? ' · ' : ''}{groomMother}
                    <Text style={s.parentsRole}>  의 아들  </Text>
                    <Text style={s.parentsChild}>{groomName}</Text>
                  </Text>
                )}
                {(brideFather || brideMother) && (
                  <Text style={[s.parentsText, { marginTop: 10 }]}>
                    {brideFather}{brideFather && brideMother ? ' · ' : ''}{brideMother}
                    <Text style={s.parentsRole}>  의 딸  </Text>
                    <Text style={s.parentsChild}>{brideName}</Text>
                  </Text>
                )}
              </View>
            )}
          </Section>

          {/* 상영 안내 */}
          <Section title="Showtime" subtitle="상영 안내">
            <View style={s.showtimeCard}>
              <Text style={s.stDate}>{showtimeDate || dateStr || '-'}</Text>
              {timeStr ? <Text style={s.stTime}>{timeStr}</Text> : null}
              {locName ? <Text style={s.stVenue}>{locName}</Text> : null}
              {locAddr ? <Text style={s.stAddress}>{locAddr}</Text> : null}
            </View>
          </Section>

          {/* 달력 + D-day */}
          {weddingDate && (
            <Section title="Calendar" subtitle="달력" alt>
              <View style={s.calendarWrap}>
                {/* 헤더: 월/년 */}
                <View style={s.calTopRow}>
                  <View style={s.calTopDivider} />
                  <View style={s.calTopCenter}>
                    <Text style={s.calMonthBig}>{calMonthName}</Text>
                    <Text style={s.calYearSmall}>{calYear}</Text>
                  </View>
                  <View style={s.calTopDivider} />
                </View>

                {/* 요일 */}
                <View style={s.calDayHeaderRow}>
                  {calDays.map((d, i) => (
                    <View key={i} style={s.calDayHeaderCell}>
                      <Text style={[
                        s.calDayHeaderText,
                        i === 0 && { color: '#c86060' },
                        i === 6 && { color: '#6a8fb8' },
                      ]}>{d}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.calDayHeaderDivider} />

                {/* 날짜 그리드 */}
                <View style={s.calGrid}>
                  {Array.from({ length: firstDow }).map((_, i) => (
                    <View key={`e${i}`} style={s.calCell} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isWedding = day === calDay;
                    const dow = (firstDow + i) % 7;
                    const isSunday = dow === 0;
                    const isSaturday = dow === 6;
                    return (
                      <View key={i} style={s.calCell}>
                        {isWedding ? (
                          <View style={s.calWeddingMark}>
                            <Text style={s.calWeddingDay}>{day}</Text>
                          </View>
                        ) : (
                          <Text style={[
                            s.calDayText,
                            isSunday && { color: '#c86060' },
                            isSaturday && { color: '#6a8fb8' },
                          ]}>{day}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* 카운트다운 */}
              {timeLeft && (timeLeft.days >= 0 || timeLeft.hours >= 0) && dDayText !== 'D-Day' && dDayText.startsWith('D-') && (
                <View style={s.countdownBox}>
                  <Text style={s.countdownLabel}>결혼식까지 남은 시간</Text>
                  <View style={s.countdownRow}>
                    <View style={s.countCell}>
                      <Text style={s.countNum}>{String(timeLeft.days || 0).padStart(2, '0')}</Text>
                      <Text style={s.countUnit}>DAYS</Text>
                    </View>
                    <Text style={s.countColon}>:</Text>
                    <View style={s.countCell}>
                      <Text style={s.countNum}>{String(timeLeft.hours || 0).padStart(2, '0')}</Text>
                      <Text style={s.countUnit}>HRS</Text>
                    </View>
                    <Text style={s.countColon}>:</Text>
                    <View style={s.countCell}>
                      <Text style={s.countNum}>{String(timeLeft.minutes || 0).padStart(2, '0')}</Text>
                      <Text style={s.countUnit}>MIN</Text>
                    </View>
                    <Text style={s.countColon}>:</Text>
                    <View style={s.countCell}>
                      <Text style={s.countNum}>{String(timeLeft.seconds || 0).padStart(2, '0')}</Text>
                      <Text style={s.countUnit}>SEC</Text>
                    </View>
                  </View>
                </View>
              )}

              {dDayText && (
                <Text style={s.dDayLine}>
                  {groomName || '신랑'} ♥ {brideName || '신부'}의 결혼식이{' '}
                  <Text style={{ color: C.gold, fontWeight: '800' }}>{dDayText}</Text>
                  {' '}남았습니다
                </Text>
              )}
            </Section>
          )}

          {/* 스틸컷 */}
          {galleryImages.length > 0 && (
            <View style={{ paddingVertical: 56, backgroundColor: C.black }}>
              <View style={sec.header}>
                <Text style={sec.title}>Still Cuts</Text>
                <Text style={sec.subtitle}>스틸컷</Text>
              </View>
              <FilmStrip images={galleryImages} onImagePress={setViewerImage} />
              {galleryImages.length > 1 && (
                <Text style={s.galleryHint}>
                  ◀ 옆으로 밀어 총 {galleryImages.length}장의 스틸컷 보기 ▶
                </Text>
              )}
            </View>
          )}

          {/* 오시는 길 */}
          {(locName || locAddr) && (
            <Section title="Direction" subtitle="오시는 길" alt>
              {locName ? <Text style={s.locName}>{locName}</Text> : null}
              {locAddr ? <Text style={s.locAddr}>{locAddr}</Text> : null}

              {mapCoord ? (
                <View style={s.mapBox}>
                  <WebView
                    source={{ html: mapHtml }}
                    style={{ flex: 1, backgroundColor: '#111' }}
                    scrollEnabled={false}
                    javaScriptEnabled
                    originWhitelist={['*']}
                  />
                </View>
              ) : (locAddr || locName) ? (
                <View style={s.mapPlaceholder}><LottieLoading text="지도를 불러오는 중..." size={54} color={C.sub} /></View>
              ) : null}

              <View style={s.navRow}>
                <TouchableOpacity style={s.navBtn} activeOpacity={0.8} onPress={() => {
                  if (isPreviewMode) {
                    blockPreviewAction();
                    return;
                  }
                  if (mapCoord) Linking.openURL(`nmap://place?lat=${mapCoord.lat}&lng=${mapCoord.lng}&name=${encodeURIComponent(locName)}&appname=wedding`);
                  else showToast('좌표 정보가 없습니다');
                }}>
                  <Text style={s.navBtnText}>🧭 네이버지도</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navBtn} activeOpacity={0.8} onPress={() => {
                  if (isPreviewMode) {
                    blockPreviewAction();
                    return;
                  }
                  if (mapCoord) Linking.openURL(`kakaomap://look?p=${mapCoord.lat},${mapCoord.lng}`);
                  else showToast('좌표 정보가 없습니다');
                }}>
                  <Text style={s.navBtnText}>🧭 카카오맵</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navBtn} activeOpacity={0.8} onPress={() => {
                  if (isPreviewMode) {
                    blockPreviewAction();
                    return;
                  }
                  if (mapCoord) Linking.openURL(`tmap://route?goalx=${mapCoord.lng}&goaly=${mapCoord.lat}&goalname=${encodeURIComponent(locName)}`);
                  else showToast('좌표 정보가 없습니다');
                }}>
                  <Text style={s.navBtnText}>🧭 티맵</Text>
                </TouchableOpacity>
              </View>

              {/* 교통편 */}
              {transportInfo && (transportInfo.subway || transportInfo.bus || transportInfo.parking) && (
                <View style={s.transportWrap}>
                  {transportInfo.subway ? (
                    <View style={s.transportItem}>
                      <View style={s.transportDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.transportTitle}>지하철</Text>
                        <Text style={s.transportDesc}>{transportInfo.subway}</Text>
                      </View>
                    </View>
                  ) : null}
                  {transportInfo.bus ? (
                    <View style={s.transportItem}>
                      <View style={s.transportDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.transportTitle}>버스</Text>
                        <Text style={s.transportDesc}>{transportInfo.bus}</Text>
                      </View>
                    </View>
                  ) : null}
                  {transportInfo.parking ? (
                    <View style={[s.transportItem, { marginTop: 18 }]}>
                      <View style={s.transportDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.transportTitle}>주차</Text>
                        <Text style={s.transportDesc}>{transportInfo.parking}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}
            </Section>
          )}

          {/* 제작 지원 (계좌·연락처) */}
          {hasAnyAccount && (
            <Section title="Sponsorship" subtitle="제작 지원 (마음 전하실 곳)">
              <Text style={s.accDesc}>계좌번호는 탭하면 복사되고,{'\n'}연락처는 탭하면 전화가 연결됩니다.</Text>

              {['groom', 'bride'].map(side => {
                const list = accounts[side];
                if (list.length === 0) return null;
                const anim = side === 'groom' ? groomAnim : brideAnim;
                const chev = side === 'groom' ? chevGroom : chevBride;
                const h = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(list.length * 140 + 16, 140)] });
                const chevronRotate = chev.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
                return (
                  <View key={side} style={s.accordionCard}>
                    <TouchableOpacity style={s.accordionHeader} onPress={() => toggleAccount(side)} activeOpacity={0.85}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 16, color: C.gold }}>🎞</Text>
                        <Text style={s.accordionTitle}>
                          {side === 'groom' ? '감독 (신랑측) 계좌·연락처' : '주연 (신부측) 계좌·연락처'}
                        </Text>
                      </View>
                      <Animated.Text style={[s.accordionChevron, { transform: [{ rotate: chevronRotate }] }]}>▼</Animated.Text>
                    </TouchableOpacity>
                    <Animated.View style={[s.accordionBody, { height: h, overflow: 'hidden' }]}>
                      {list.map((p, idx) => (
                        <View key={idx} style={s.personCard}>
                          <Text style={s.personLabel}>{p.name}</Text>
                          {p.number ? (
                            <TouchableOpacity style={s.personRow} onPress={() => copyAccount(p.number)} activeOpacity={0.7}>
                              <Text style={s.personValue} numberOfLines={1}>{p.bank} {p.number}</Text>
                              <View style={s.copyBtn}><Text style={s.copyBtnText}>복사</Text></View>
                            </TouchableOpacity>
                          ) : null}
                          {p.number && p.contact ? <View style={s.personDivider} /> : null}
                          {p.contact ? (
                            <TouchableOpacity
                              style={s.personRow}
                              onPress={() => Linking.openURL(`tel:${p.contact.replace(/\D/g, '')}`)}
                              activeOpacity={0.7}
                            >
                              <Text style={s.personValue}>📞 {formatPhone(p.contact)}</Text>
                              <View style={s.callBtn}><Text style={s.callBtnText}>전화</Text></View>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ))}
                    </Animated.View>
                  </View>
                );
              })}
            </Section>
          )}

          {/* 관람평 (방명록) */}
          {allowMessages !== false && (
            <Section title="Reviews" subtitle="관람평 남기기" alt>
              {reviews.map(r => (
                <View key={r.id} style={s.reviewItem}>
                  <Text style={s.reviewStars}>★★★★★</Text>
                  <Text style={s.reviewText}>{r.text}</Text>
                  <View style={s.reviewBottom}>
                    <Text style={s.reviewAuthor}>{r.name}</Text>
                    <Text style={s.reviewDate}>{r.date}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={s.gbWriteBtn} activeOpacity={0.85} onPress={() => setGuestBookOpen(true)}>
                <Text style={s.gbWriteText}>✏️ 관람평 작성하기</Text>
              </TouchableOpacity>
            </Section>
          )}

          {/* 푸터 (공유 버튼 포함) */}
          <View style={s.footer}>
            <Text style={s.footerThankYou}>Thank You</Text>
            <Text style={s.footerNames}>{groomName || 'Groom'} & {brideName || 'Bride'}</Text>
            <View style={s.footerBtns}>
              <TouchableOpacity style={s.footerBtn} activeOpacity={0.85} onPress={() => showToast(isPreviewMode ? '미리보기에서는 공유할 수 없습니다' : '카카오톡 공유 준비 중입니다')}>
                <Text style={s.footerBtnText}>카카오톡 공유</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.footerBtn, s.footerBtnPrimary]} activeOpacity={0.85} onPress={handleShareLink}>
                <Text style={[s.footerBtnText, { color: '#111' }]}>링크 복사</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.footerCopy}>
              Copyright {dateInfo?.year || new Date().getFullYear()}. {groomName || 'Groom'} & {brideName || 'Bride'} All rights reserved.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* 이미지 뷰어 */}
      <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <View style={s.viewerBg}>
          <TouchableOpacity
            style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={1}
            onPress={() => setViewerImage(null)}
          >
            {viewerImage && (
              <Image
                source={typeof viewerImage === 'string' ? { uri: viewerImage } : viewerImage}
                style={s.viewerImg}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[s.viewerClose, { top: insets.top + 16 }]} onPress={() => setViewerImage(null)} activeOpacity={0.8}>
            <Text style={{ fontSize: 22, color: '#fff', fontWeight: '600' }}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 방명록 바텀시트 */}
      <Modal visible={guestBookOpen} transparent animationType="slide" onRequestClose={() => setGuestBookOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.gbOverlay} activeOpacity={1} onPress={() => setGuestBookOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={s.gbSheet} onPress={() => {}}>
              <View style={s.gbSheetHandle} />
              <Text style={s.gbSheetTitle}>관람평 작성</Text>
              <Text style={s.gbSheetStars}>★★★★★</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[s.gbInput, { flex: 1 }]}
                  placeholder="이름"
                  placeholderTextColor="#666"
                  value={gbName}
                  onChangeText={setGbName}
                />
                <TextInput
                  style={[s.gbInput, { flex: 1 }]}
                  placeholder="비밀번호"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={gbPassword}
                  onChangeText={setGbPassword}
                />
              </View>
              <TextInput
                style={[s.gbInput, s.gbInputMessage]}
                placeholder={messageSettings?.placeholder || '축하 메시지를 입력해주세요'}
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
                value={gbMessage}
                onChangeText={setGbMessage}
              />
              <TouchableOpacity style={s.gbSubmitBtn} activeOpacity={0.85} onPress={handleGuestBookSubmit}>
                <Text style={s.gbSubmitText}>등록하기</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* 토스트 */}
      {toast.visible && (
        <Animated.View
          pointerEvents="none"
          style={[s.toast, {
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            bottom: insets.bottom + 60,
          }]}
        >
          <Text style={s.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ======================================================================
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.black, overflow: 'hidden' },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 200 },

  introLayer:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 150,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  tapHint:     { marginTop: 48, flexDirection: 'row', alignItems: 'center' },
  tapHintText: { fontSize: 18, letterSpacing: 4, color: C.white, fontWeight: '600' },

  // 포스터 (심플)
  poster:     { width: '100%', position: 'relative' },
  posterImg:  { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  // 타이틀 카드
  titleCard:       { alignItems: 'center', paddingVertical: 10 },

  creditsBox:      { alignItems: 'center', marginBottom: 28, paddingHorizontal: 10 },
  creditsDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: 260, justifyContent: 'center' },
  creditsLine:     { flex: 1, height: 1, backgroundColor: C.gold, opacity: 0.6 },
  creditsStar:     { color: C.gold, fontSize: 14 },
  creditsLabel:    { fontSize: 13, letterSpacing: 6, color: C.gold, fontWeight: '700', marginVertical: 14, textAlign: 'center' },
  creditsNames:    { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 3, textAlign: 'center', marginBottom: 14,
                     textShadowColor: 'rgba(212,175,55,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  creditsAmp:      { color: C.gold, fontSize: 20, fontWeight: '400' },

  titleMain:       { fontSize: 54, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 58, marginBottom: 14, letterSpacing: 2 },
  titleSubtitle:   { fontSize: 15, letterSpacing: 5, color: '#ccc', fontWeight: '300', marginBottom: 28 },
  titleDateBadge:  { borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(212,175,55,0.35)', paddingVertical: 10, paddingHorizontal: 22 },
  titleDate:       { fontSize: 15, letterSpacing: 4, color: C.gold, fontWeight: '600' },
  titleDDay:       { marginTop: 20, fontSize: 14, color: C.gold, letterSpacing: 2, fontWeight: '700' },

  // 시놉시스
  synopsisText:   { fontSize: 16, lineHeight: 34, textAlign: 'center', fontWeight: '300', color: '#ddd' },
  parentsWrap:    { marginTop: 32, alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 24 },
  parentsText:    { fontSize: 14, color: '#bbb', textAlign: 'center' },
  parentsRole:    { color: C.sub, fontSize: 13 },
  parentsChild:   { color: C.gold, fontWeight: '700', fontSize: 16 },

  // 상영 안내
  showtimeCard:   { backgroundColor: '#111', borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 28, alignItems: 'center' },
  stDate:         { fontSize: 30, fontWeight: '800', color: C.white, marginBottom: 6, letterSpacing: 1, textAlign: 'center' },
  stTime:         { fontSize: 18, color: C.gold, fontWeight: '600', letterSpacing: 3, marginBottom: 20 },
  stVenue:        { fontSize: 16, color: C.main, marginBottom: 8, textAlign: 'center' },
  stAddress:      { fontSize: 13, color: C.sub, lineHeight: 22, textAlign: 'center' },

  // 달력
  calendarWrap:   { backgroundColor: '#111', borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 18 },

  calTopRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  calTopDivider:  { flex: 1, height: 1, backgroundColor: C.gold, opacity: 0.5 },
  calTopCenter:   { alignItems: 'center', paddingHorizontal: 18 },
  calMonthBig:    { fontSize: 32, fontWeight: '800', color: C.gold, letterSpacing: 6 },
  calYearSmall:   { fontSize: 11, color: C.sub, letterSpacing: 6, marginTop: 2 },

  calDayHeaderRow:{ flexDirection: 'row' },
  calDayHeaderCell:{ flex: 1, alignItems: 'center', paddingVertical: 8 },
  calDayHeaderText:{ fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 1 },
  calDayHeaderDivider: { height: 1, backgroundColor: C.border, marginBottom: 8 },

  calGrid:        { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:        { width: '14.2857%', height: 44, alignItems: 'center', justifyContent: 'center' },
  calDayText:     { fontSize: 14, color: '#ddd', fontWeight: '500' },

  calWeddingMark: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
                    shadowColor: C.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },
  calWeddingDay:  { fontSize: 14, fontWeight: '800', color: '#111' },

  // 카운트다운 (디지털 타이머 스타일)
  countdownBox:   { marginTop: 22, backgroundColor: '#000', borderWidth: 1, borderColor: C.gold, borderRadius: 8, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center' },
  countdownLabel: { fontSize: 11, color: C.gold, letterSpacing: 4, marginBottom: 14, fontWeight: '600' },
  countdownRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  countCell:      { alignItems: 'center', minWidth: 54 },
  countNum:       { fontSize: 26, fontWeight: '800', color: C.gold, letterSpacing: 1, fontVariant: ['tabular-nums'] },
  countUnit:      { fontSize: 9, color: C.sub, letterSpacing: 2, marginTop: 4 },
  countColon:     { fontSize: 22, color: C.gold, fontWeight: '700', marginHorizontal: 4, marginBottom: 13, opacity: 0.6 },
  dDayLine:       { marginTop: 22, fontSize: 13, color: '#ccc', textAlign: 'center', letterSpacing: 1 },

  // 오시는 길
  locName:        { fontSize: 20, color: C.white, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  locAddr:        { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 22, marginBottom: 22 },
  mapBox:         { width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  mapPlaceholder: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  navRow:         { flexDirection: 'row', gap: 8 },
  navBtn:         { flex: 1, borderWidth: 1, borderColor: C.gold, paddingVertical: 10, borderRadius: 30, alignItems: 'center' },
  navBtnText:     { fontSize: 12, color: C.gold, letterSpacing: 1, fontWeight: '600' },

  // 교통편
  transportWrap:  { marginTop: 28, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 22 },
  transportItem:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  transportDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold, marginTop: 8 },
  transportTitle: { fontSize: 13, color: C.gold, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  transportDesc:  { fontSize: 13, color: '#bbb', lineHeight: 20 },

  // 계좌·연락처
  accDesc:        { fontSize: 13, color: '#888', lineHeight: 22, textAlign: 'center', marginBottom: 22 },
  accordionCard:  { marginBottom: 12, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: 'hidden' },
  accordionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  accordionTitle: { fontSize: 15, color: '#eee', fontWeight: '600' },
  accordionChevron: { fontSize: 12, color: C.sub },
  accordionBody:  { paddingHorizontal: 16 },
  personCard:     { backgroundColor: '#111', borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 14, marginBottom: 10 },
  personLabel:    { fontSize: 12, color: C.gold, letterSpacing: 2, fontWeight: '600', marginBottom: 8 },
  personRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  personValue:    { fontSize: 13, color: '#ccc', flex: 1, marginRight: 10 },
  personDivider:  { height: 1, backgroundColor: C.border, marginVertical: 10 },
  copyBtn:        { backgroundColor: C.red, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4 },
  copyBtnText:    { fontSize: 11, fontWeight: '700', color: '#fff' },
  callBtn:        { backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4 },
  callBtnText:    { fontSize: 11, fontWeight: '700', color: '#111' },

  // 관람평
  reviewItem:     { backgroundColor: '#111', padding: 18, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: C.gold, marginBottom: 12 },
  reviewStars:    { color: C.gold, fontSize: 13, marginBottom: 6, letterSpacing: 3 },
  reviewText:     { fontSize: 14, lineHeight: 22, color: C.main, fontWeight: '300', marginBottom: 10 },
  reviewBottom:   { flexDirection: 'row', justifyContent: 'space-between' },
  reviewAuthor:   { fontSize: 12, color: C.sub },
  reviewDate:     { fontSize: 12, color: C.sub },
  gbWriteBtn:     { backgroundColor: C.gold, paddingVertical: 14, borderRadius: 4, alignItems: 'center', marginTop: 8 },
  gbWriteText:    { fontSize: 14, fontWeight: '700', color: '#111', letterSpacing: 2 },
  galleryHint:    { fontSize: 12, color: C.sub, textAlign: 'center', marginTop: 16, letterSpacing: 2 },

  // 푸터
  footer:         { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center', backgroundColor: C.black, borderTopWidth: 1, borderTopColor: C.border },
  footerThankYou: { fontSize: 26, fontWeight: '800', color: C.gold, letterSpacing: 6, marginBottom: 8 },
  footerNames:    { fontSize: 14, color: '#bbb', letterSpacing: 2, marginBottom: 24 },
  footerBtns:     { flexDirection: 'row', gap: 10, marginBottom: 24 },
  footerBtn:      { borderWidth: 1, borderColor: C.gold, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30 },
  footerBtnPrimary: { backgroundColor: C.gold },
  footerBtnText:  { fontSize: 13, color: C.gold, fontWeight: '700', letterSpacing: 1 },
  footerCopy:     { fontSize: 11, color: '#555', textAlign: 'center' },

  // 뷰어
  viewerBg:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerImg:      { width: '100%', height: '100%' },
  viewerClose:    { position: 'absolute', left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  // 방명록 바텀시트
  gbOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  gbSheet:        { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  gbSheetHandle:  { width: 36, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  gbSheetTitle:   { fontSize: 18, fontWeight: '700', color: C.gold, textAlign: 'center', marginBottom: 10, letterSpacing: 3 },
  gbSheetStars:   { color: C.gold, fontSize: 20, textAlign: 'center', marginBottom: 16, letterSpacing: 4 },
  gbInput:        { backgroundColor: '#111', borderWidth: 1, borderColor: C.border, color: '#fff', padding: 14, borderRadius: 6, fontSize: 14, marginBottom: 10 },
  gbInputMessage: { height: 100 },
  gbSubmitBtn:    { backgroundColor: C.gold, paddingVertical: 14, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  gbSubmitText:   { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: 2 },

  // 토스트
  toast:          { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(212,175,55,0.95)', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, zIndex: 300 },
  toastText:      { color: '#111', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
