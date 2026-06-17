// src/screens/event/templates/wedding/ElegantGardenTemplate.js
// Apple Event Invitation Style Template
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Animated, StyleSheet, Dimensions, Modal, Share, Linking, Easing,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import LottieLoading from '../../../../components/LottieLoading';
import {
  getCategorizedImagesSafe,
  useCountdown,
  formatKoreanDate,
  formatKoreanTime,
  resolveWeddingMapCoord,
} from './WeddingUtils';
import { GuestBookMessages, PhotoFrameOverlay } from './WeddingCommonComponents';

const { width, height } = Dimensions.get('window');

const C = {
  blue: '#0071E3',
  main: '#1D1D1F',
  sub: '#86868B',
  gray: '#F5F5F7',
  grayMid: '#E8E8ED',
  border: '#D2D2D7',
  white: '#FFFFFF',
  black: '#000000',
  gold: '#C9A96E',
};

// ── 꽃잎 떨어지는 컴포넌트 ──
// 꽃잎 이미지 미리 로드
const FLOWER_IMAGES = [
  require('../../../../../assets/images/flowers/flower2.png'),
  require('../../../../../assets/images/flowers/flower3.png'),
  require('../../../../../assets/images/flowers/flower4.png'),
  require('../../../../../assets/images/flowers/flower5.png'),
];

const FallingFlowers = () => {
  const flowers = useRef([...Array(40)].map((_, i) => ({
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: 500 + i * 100,
    size: Math.random() * 35 + 20,
    imageIndex: i % 4,
    duration: 3500 + Math.random() * 2000,
  }))).current;

  useEffect(() => {
    flowers.forEach((f) => {
      const run = () => {
        f.anim.setValue(0);
        Animated.timing(f.anim, { toValue: 1, duration: f.duration, useNativeDriver: true, easing: Easing.linear }).start(() => setTimeout(run, 100));
      };
      setTimeout(run, f.delay);
    });
  }, []);

  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
      {flowers.map((f, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: f.x,
          opacity: f.anim.interpolate({ inputRange: [0, 0.02, 0.95, 1], outputRange: [0, 0.7, 0.7, 0] }),
          transform: [
            { translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [-100, height + 50] }) },
            { translateX: f.anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 15, -10, 5] }) },
            { rotate: f.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '120deg'] }) },
          ],
        }}>
          <Image source={FLOWER_IMAGES[f.imageIndex]} style={{ width: f.size, height: f.size }} resizeMode="contain" fadeDuration={0} />
        </Animated.View>
      ))}
    </View>
  );
};

const WEDDING_ICON = require('../../../../../assets/icons/wedding2.png');

// ======================================================================
export default function ElegantGardenTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings, selectedPhotoFrame, frameAdjusting = false, onPhotoFrameAdjust, isPreviewMode = false }) {
  const insets = useSafeAreaInsets();

  // ── Intro state ──
  // 자체 인트로 제거 — 바로 본문 노출
  const [showIntro, setShowIntro] = useState(false);
  const [showFlowers, setShowFlowers] = useState(false);

  // 꽃잎 지연 마운트 (이미지 먼저 렌더링 후)
  useEffect(() => {
    const t = setTimeout(() => setShowFlowers(true), 800);
    return () => clearTimeout(t);
  }, []);
  const introScale = useRef(new Animated.Value(1)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  // 자체 인트로 제거 — 메인 즉시 표시 (scale 1, opacity 1)
  const mainScale = useRef(new Animated.Value(1)).current;
  const mainOpacity = useRef(new Animated.Value(1)).current;
  const bottomBarSlide = useRef(new Animated.Value(0)).current;

  // 인트로 콘텐츠 페이드인
  const introContentOpacity = useRef(new Animated.Value(0)).current;
  const introContentSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // 약간 딜레이 후 콘텐츠 페이드인
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(introContentOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(introContentSlide, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]).start();
    }, 300);
  }, []);

  // ── Ring glow animation ──
  const ringGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringGlow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(ringGlow, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const [activeAccount, setActiveAccount] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });

  // ── 방명록 ──
  const [guestbookList, setGuestbookList] = useState([
    { id: 1, name: '김영희', message: '두 분의 결혼을 진심으로 축하합니다! 행복하세요 💕', date: '2026.04.10' },
    { id: 2, name: '박철수', message: '정말 잘 어울리는 커플이야. 축하해!', date: '2026.04.11' },
  ]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newMsg, setNewMsg] = useState({ name: '', password: '', text: '' });
  const sheetAnim = useRef(new Animated.Value(height)).current;
  const dimAnim = useRef(new Animated.Value(0)).current;
  const [selectedImage, setSelectedImage] = useState(null);

  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // ── Names ──
  const groomName = eventData.groomName || eventData.groom_name || '';
  const brideName = eventData.brideName || eventData.bride_name || '';

  // ── Parents ──
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '';

  // ── Date / Time ──
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const dateStr = dateInfo?.full || '';
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);

  // ── Apple-style English date ──
  const weddingDate = eventData.date || eventData.event_date;
  let appleDate = '';
  if (weddingDate) {
    try {
      const d = new Date(weddingDate);
      if (!isNaN(d.getTime())) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        appleDate = `${months[d.getMonth()]} ${d.getDate()} at ${timeStr} KST`;
      }
    } catch {}
  }

  // ── Location ──
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';

  // ── Countdown ──
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date,
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // ── D-day ──
  let dDayText = '';
  if (weddingDate) {
    const diff = Math.ceil((new Date(weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff > 0) dDayText = `D-${diff}`;
    else if (diff === 0) dDayText = 'D-Day';
    else dDayText = `D+${Math.abs(diff)}`;
  }

  // ── Account info ──
  const ai = eventData.additional_info || {};
  const accounts = {
    groom: [
      ai.groom_account_number && { bank: ai.groom_bank_name || '', number: ai.groom_account_number, name: groomName },
      ai.groom_father_account_number && { bank: ai.groom_father_bank_name || '', number: ai.groom_father_account_number, name: groomFather ? `${groomFather} 아버님` : '아버님' },
      ai.groom_mother_account_number && { bank: ai.groom_mother_bank_name || '', number: ai.groom_mother_account_number, name: groomMother ? `${groomMother} 어머님` : '어머님' },
    ].filter(Boolean),
    bride: [
      ai.bride_account_number && { bank: ai.bride_bank_name || '', number: ai.bride_account_number, name: brideName },
      ai.bride_father_account_number && { bank: ai.bride_father_bank_name || '', number: ai.bride_father_account_number, name: brideFather ? `${brideFather} 아버님` : '아버님' },
      ai.bride_mother_account_number && { bank: ai.bride_mother_bank_name || '', number: ai.bride_mother_account_number, name: brideMother ? `${brideMother} 어머님` : '어머님' },
    ].filter(Boolean),
  };
  const hasAnyAccount = accounts.groom.length > 0 || accounts.bride.length > 0;

  // ── Gallery ──
  const galleryImages = safeImages.gallery || safeImages.all || [];

  // ── Main image crossfade slideshow ──
  const mainImages = safeImages.main?.length > 0 ? safeImages.main : (safeImages.all?.length > 0 ? [safeImages.all[0]] : []);
  const heroAnims = useRef(mainImages.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const heroIdxRef = useRef(0);

  useEffect(() => {
    if (mainImages.length <= 1) return;
    const interval = setInterval(() => {
      const curr = heroIdxRef.current;
      const next = (curr + 1) % mainImages.length;
      Animated.parallel([
        Animated.timing(heroAnims[curr], { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(heroAnims[next], { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]).start();
      heroIdxRef.current = next;
    }, 4000);
    return () => clearInterval(interval);
  }, [mainImages.length]);

  // ── Dismiss intro ──
  const dismissIntro = () => {
    Animated.parallel([
      Animated.timing(introScale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
      Animated.timing(introOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(mainScale, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(mainOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      setShowIntro(false);
      Animated.spring(bottomBarSlide, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 140 }).start();
    });
  };

  // ── Toast ──
  const toastAnim = useRef(new Animated.Value(0)).current;
  // ── 방명록 시트 ──
  const openSheet = () => {
    setIsSheetOpen(true);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
      Animated.timing(dimAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };
  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: height, duration: 340, useNativeDriver: true }),
      Animated.timing(dimAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setIsSheetOpen(false));
  };
  const handleAddMessage = () => {
    if (!newMsg.name.trim() || !newMsg.text.trim()) {
      showToast('이름과 메시지를 모두 입력해주세요.');
      return;
    }
    const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    setGuestbookList(prev => [{ id: Date.now(), name: newMsg.name, message: newMsg.text, date }, ...prev]);
    setNewMsg({ name: '', password: '', text: '' });
    closeSheet();
    showToast('방명록이 등록되었습니다.');
  };

  const showToast = (message) => {
    setToast({ visible: true, message });
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, message: '' }));
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast('계좌번호가 복사되었어요');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  // ── Accordion ──
  const groomAnim = useRef(new Animated.Value(0)).current;
  const brideAnim = useRef(new Animated.Value(0)).current;
  const chevronGroomAnim = useRef(new Animated.Value(0)).current;
  const chevronBrideAnim = useRef(new Animated.Value(0)).current;

  const toggleAccount = (side) => {
    const isOpen = activeAccount === side;
    const anim = side === 'groom' ? groomAnim : brideAnim;
    const other = side === 'groom' ? brideAnim : groomAnim;
    const chevron = side === 'groom' ? chevronGroomAnim : chevronBrideAnim;
    const otherChevron = side === 'groom' ? chevronBrideAnim : chevronGroomAnim;
    Animated.timing(other, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    Animated.timing(otherChevron, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    Animated.timing(anim, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    Animated.timing(chevron, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    setActiveAccount(isOpen ? null : side);
  };

  const accordionHeight = (anim, count) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(count * 80 + 16, 96)] });

  // ── Share ──
  const handleShare = async () => {
    if (isPreviewMode) {
      showToast('미리보기에서는 공유할 수 없습니다');
      return;
    }

    try {
      await Share.share({
        message: `${groomName} & ${brideName}의 결혼식에 초대합니다!\n${dateStr} ${timeStr}\n${locName}`,
      });
    } catch {
      showToast('공유에 실패했습니다');
    }
  };

  // ── Kakao coord search + map ──
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);

  useEffect(() => {
    resolveWeddingMapCoord({ locName, locAddr, kakaoKey: KAKAO_KEY })
      .then(coord => {
        if (coord) setMapCoord(coord);
      })
      .catch(() => {});
  }, [locAddr, locName]);

  // ── Transport info ──
  const transportInfo = ai.transport_info || eventData.transportInfo || '';

  return (
    <View style={ap.root}>

      {/* ═══ MAIN CONTENT ═══ */}
      <Animated.View style={[{ flex: 1 }, { opacity: mainOpacity, transform: [{ scale: mainScale }] }]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false} scrollEnabled={!frameAdjusting}>

          {/* ── 1. Hero with crossfade slideshow ── */}
          <View style={ap.hero}>
            {mainImages.map((img, i) => (
              <Animated.Image
                key={i}
                source={img}
                style={[ap.heroImage, i > 0 && ap.heroImageOverlay, { opacity: heroAnims[i] }]}
                resizeMode="cover"
              />
            ))}
            <PhotoFrameOverlay
              selectedPhotoFrame={selectedPhotoFrame}
              frameAdjusting={frameAdjusting}
              onPhotoFrameAdjust={onPhotoFrameAdjust}
            />
            {/* Top dim */}
            <LinearGradient
              colors={['rgba(0,0,0,0.45)', 'transparent']}
              style={ap.heroDimTop}
            />
            {/* Bottom dim */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={ap.heroDimBottom}
            />
            {/* Glassmorphism card */}
            <View style={ap.heroGlass}>
              <View style={ap.heroGlassInner}>
                <Text style={ap.heroGlassNames}>{groomName}  &  {brideName}</Text>
                <View style={ap.heroGlassDivider} />
                <Text style={ap.heroGlassDate}>{dateStr} {timeStr}</Text>
                {locName ? <Text style={ap.heroGlassLoc}>{locName}</Text> : null}
              </View>
            </View>
          </View>

          {/* ── 2. Invitation (Greeting) ── */}
          <View style={ap.section}>
            <Text style={ap.sectionLabel}>초대합니다</Text>
            <Text style={ap.greetingText}>
              {eventData.customMessage || eventData.custom_message ||
                '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n\n저희 두 사람이 사랑의 이름으로\n지켜나갈 수 있게 앞날을\n축복해 주시면 감사하겠습니다.'}
            </Text>
            {(groomFather || groomMother || brideFather || brideMother) && (
              <View style={ap.parentsBox}>
                {(groomFather || groomMother) && (
                  <View style={ap.parentsRow}>
                    <Text style={ap.parentsNames}>
                      {groomFather}{groomFather && groomMother ? ' · ' : ''}{groomMother}
                      <Text style={ap.parentsRole}> 의 아들 </Text>
                      <Text style={ap.parentsChild}>{groomName}</Text>
                    </Text>
                  </View>
                )}
                {(brideFather || brideMother) && (
                  <View style={[ap.parentsRow, { marginTop: 8 }]}>
                    <Text style={ap.parentsNames}>
                      {brideFather}{brideFather && brideMother ? ' · ' : ''}{brideMother}
                      <Text style={ap.parentsRole}> 의 딸 </Text>
                      <Text style={ap.parentsChild}>{brideName}</Text>
                    </Text>
                  </View>
                )}
              </View>
            )}
            {/* D-day */}
            {dDayText ? (
              <View style={ap.dDayBox}>
                <Text style={ap.dDayText}>
                  {groomName} & {brideName}의 결혼식까지{' '}
                  <Text style={{ color: C.blue, fontWeight: '700' }}>{dDayText}</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── 3. Contact ── */}
          <View style={ap.section}>
            <Text style={ap.sectionLabel}>CONTACT</Text>
            {[
              { label: '신랑', name: groomName, phone: eventData.groomContact || eventData.groom_contact, badgeBg: '#E3F0FF', badgeColor: C.blue },
              { label: '신부', name: brideName, phone: eventData.brideContact || eventData.bride_contact, badgeBg: '#FFE5E5', badgeColor: '#E34040' },
            ].filter(p => p.name).map(p => (
              <View key={p.label} style={ap.contactCard}>
                <View style={ap.contactLeft}>
                  <View style={[ap.contactBadge, { backgroundColor: p.badgeBg }]}>
                    <Text style={[ap.contactBadgeText, { color: p.badgeColor }]}>{p.label}</Text>
                  </View>
                  <Text style={ap.contactName}>{p.name}</Text>
                </View>
                <View style={ap.contactActions}>
                  <TouchableOpacity
                    style={ap.contactBtn}
                    onPress={() => p.phone ? Linking.openURL(`tel:${p.phone}`) : showToast('연락처가 등록되지 않았습니다')}
                    activeOpacity={0.7}
                  >
                    <Text style={ap.contactBtnIcon}>📞</Text>
                    <Text style={ap.contactBtnText}>전화</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={ap.contactBtn}
                    onPress={() => p.phone ? Linking.openURL(`sms:${p.phone}`) : showToast('연락처가 등록되지 않았습니다')}
                    activeOpacity={0.7}
                  >
                    <Text style={ap.contactBtnIcon}>💬</Text>
                    <Text style={ap.contactBtnText}>문자</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* ── 4. Gallery ── */}
          {galleryImages.length > 0 && (
            <View style={[ap.section, { paddingRight: 0 }]}>
              <Text style={[ap.sectionLabel, { paddingRight: 24 }]}>GALLERY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ap.galleryScroll}>
                {galleryImages.map((img, idx) => {
                  const imgSource = typeof img === 'string' ? { uri: img } : img;
                  return (
                    <TouchableOpacity key={idx} onPress={() => setSelectedImage(imgSource)} activeOpacity={0.92}>
                      <Image source={imgSource} style={ap.galleryCard} resizeMode="cover" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── 5. Location ── */}
          {locName ? (
            <View style={[ap.section, { backgroundColor: C.gray }]}>
              <Text style={ap.sectionLabel}>LOCATION</Text>
              <View style={ap.locationCard}>
                <Text style={ap.locationName}>{locName}</Text>
                {locAddr ? <Text style={ap.locationAddr}>{locAddr}</Text> : null}

                {/* Map - OpenStreetMap Leaflet WebView */}
                {mapCoord ? (
                  <View style={ap.mapContainer}>
                    <WebView
                      source={{
                        html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;border-radius:16px}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>`,
                      }}
                      style={{ flex: 1 }}
                      scrollEnabled={false}
                      javaScriptEnabled
                      originWhitelist={['*']}
                    />
                  </View>
                ) : (locAddr || locName) ? (
                  <View style={ap.mapPlaceholder}>
                    <LottieLoading text="지도를 불러오는 중..." size={54} color={C.sub} />
                  </View>
                ) : null}

                {/* Nav buttons */}
                <View style={ap.navBtns}>
                  {[
                    { label: '네이버지도', icon: '🧭' },
                    { label: '카카오내비', icon: '🧭' },
                    { label: '티맵', icon: '🧭' },
                  ].map(nav => (
                    <TouchableOpacity
                      key={nav.label}
                      style={ap.navBtn}
                      onPress={() => showToast(`${nav.label}로 이동합니다`)}
                      activeOpacity={0.7}
                    >
                      <Text style={ap.navBtnIcon}>{nav.icon}</Text>
                      <Text style={ap.navBtnText}>{nav.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Transport info */}
                {transportInfo ? (
                  <View style={ap.transportBox}>
                    <Text style={ap.transportTitle}>교통편 안내</Text>
                    <Text style={ap.transportText}>{transportInfo}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* ── 6. 방명록 ── */}
          {allowMessages && (
            <View style={[ap.section, { backgroundColor: C.white }]}>
              <View style={ap.guestbookHeader}>
                <Text style={ap.secTitle}>방명록</Text>
                <TouchableOpacity style={ap.writeBtn} onPress={openSheet} activeOpacity={0.8}>
                  <Text style={{ fontSize: 14, color: C.blue }}>✏️</Text>
                  <Text style={ap.writeBtnText}> 작성하기</Text>
                </TouchableOpacity>
              </View>
              {guestbookList.length === 0 ? (
                <View style={ap.emptyGuestbook}>
                  <Text style={ap.emptyText}>가장 먼저 축하 메시지를 남겨보세요.</Text>
                </View>
              ) : (
                guestbookList.map(g => (
                  <View key={g.id} style={ap.guestCard}>
                    <View style={ap.guestCardTop}>
                      <Text style={ap.guestName}>{g.name}</Text>
                      <Text style={ap.guestDate}>{g.date}</Text>
                    </View>
                    <Text style={ap.guestMsg}>{g.message}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── 7. Accounts (Accordion) ── */}
          {hasAnyAccount && (
            <View style={ap.section}>
              <Text style={ap.sectionLabel}>마음 전하실 곳</Text>
              <Text style={ap.accountDesc}>축하의 마음을 전해주세요</Text>
              {['groom', 'bride'].map(side => {
                const list = accounts[side];
                if (list.length === 0) return null;
                const anim = side === 'groom' ? groomAnim : brideAnim;
                const chevron = side === 'groom' ? chevronGroomAnim : chevronBrideAnim;
                const h = accordionHeight(anim, list.length);
                const isGroom = side === 'groom';
                const chevronRotate = chevron.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '90deg'],
                });
                return (
                  <View key={side} style={ap.accordionCard}>
                    <TouchableOpacity style={ap.accordionHeader} onPress={() => toggleAccount(side)} activeOpacity={0.7}>
                      <Text style={ap.accordionTitle}>{isGroom ? '신랑측 계좌번호' : '신부측 계좌번호'}</Text>
                      <Animated.Text style={[ap.accordionChevron, { transform: [{ rotate: chevronRotate }] }]}>
                        ›
                      </Animated.Text>
                    </TouchableOpacity>
                    <Animated.View style={[ap.accordionBody, { height: h, overflow: 'hidden' }]}>
                      {list.map((acc, idx) => (
                        <View key={idx} style={ap.accountBox}>
                          <View style={{ flex: 1 }}>
                            <Text style={ap.accountBank}>{acc.bank} (예금주: {acc.name})</Text>
                            <Text style={ap.accountNum}>{acc.number}</Text>
                          </View>
                          <TouchableOpacity style={ap.copyBtn} onPress={() => copyToClipboard(acc.number)} activeOpacity={0.7}>
                            <Text style={ap.copyBtnText}>복사</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </Animated.View>
                  </View>
                );
              })}
            </View>
          )}

        </ScrollView>
      </Animated.View>

      {/* ═══ Glassmorphism Bottom Bar (pill shape) ═══ */}
      <Animated.View style={[ap.bottomBar, { paddingBottom: insets.bottom + 8, transform: [{ translateY: bottomBarSlide }] }]}>
        <View style={ap.bottomBarPill}>
          <TouchableOpacity style={ap.bottomShareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Text style={ap.bottomShareIcon}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ap.bottomMsgBtn} onPress={() => showToast('축하 메시지 기능 준비 중입니다')} activeOpacity={0.85}>
            <Text style={ap.bottomMsgText}>축하 메시지 남기기</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ═══ Toast ═══ */}
      {toast.visible && (
        <Animated.View style={[ap.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          top: insets.top + 16,
        }]}>
          <Text style={ap.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ═══ Fullscreen Image Modal ═══ */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={ap.imageModal}>
          <TouchableOpacity style={[ap.imageModalClose, { top: insets.top + 16 }]} onPress={() => setSelectedImage(null)}>
            <Text style={{ fontSize: 22, color: '#fff' }}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={selectedImage} style={ap.imageModalImg} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* ═══ Apple Event Intro Overlay ═══ */}
      {showIntro && (
        <Animated.View
          style={[
            ap.introOverlay,
            { opacity: introOpacity, transform: [{ scale: introScale }] },
          ]}
          pointerEvents="auto"
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.black }]} />

          {/* 꽃잎 - 지연 마운트 */}
          {showFlowers && <FallingFlowers />}

          {/* 인트로 콘텐츠 - 페이드인 */}
          <Animated.View style={{
            alignItems: 'center',
            opacity: introContentOpacity,
            transform: [{ translateY: introContentSlide }],
          }}>
            {/* 웨딩 일러스트 + 네온 발광 */}
            <View style={ap.introImageArea}>
              <Animated.View style={[ap.neonGlow, {
                opacity: ringGlow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }),
                transform: [{ scale: ringGlow.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] }) }],
              }]} />
              <Image
                source={WEDDING_ICON}
                style={ap.introImage}
                resizeMode="contain"
                fadeDuration={0}
              />
            </View>

            <Text style={ap.introHeadline}>결혼합니다</Text>

            <Text style={ap.introDesc}>
              소중한 분들을 초대합니다{'\n'}
              {groomName} & {brideName}
            </Text>

            {dateStr ? <Text style={ap.introDate}>{dateStr} {timeStr}</Text> : null}

            <TouchableOpacity style={ap.introBtn} onPress={dismissIntro} activeOpacity={0.8}>
              <Text style={ap.introBtnText}>청첩장 보기</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      {/* ── 방명록 바텀시트 ── */}
      {isSheetOpen && (
        <>
          <Animated.View style={[ap.sheetDim, { opacity: dimAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSheet} activeOpacity={1} />
          </Animated.View>
          <Animated.View style={[ap.sheet, { transform: [{ translateY: sheetAnim }] }]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={ap.sheetHandle}><View style={ap.sheetHandleBar} /></View>
              <View style={ap.sheetHeader}>
                <TouchableOpacity onPress={closeSheet}><Text style={ap.sheetCancel}>취소</Text></TouchableOpacity>
                <Text style={ap.sheetTitle}>메시지 작성</Text>
                <TouchableOpacity onPress={handleAddMessage}><Text style={ap.sheetSubmit}>등록</Text></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={ap.sheetForm} keyboardShouldPersistTaps="handled">
                <View style={ap.sheetInputRow}>
                  <TextInput style={[ap.sheetInput, { flex: 1 }]} placeholder="이름" placeholderTextColor={C.sub}
                    value={newMsg.name} onChangeText={v => setNewMsg({ ...newMsg, name: v })} />
                  <TextInput style={[ap.sheetInput, { flex: 1 }]} placeholder="비밀번호" placeholderTextColor={C.sub}
                    secureTextEntry value={newMsg.password} onChangeText={v => setNewMsg({ ...newMsg, password: v })} />
                </View>
                <TextInput
                  style={[ap.sheetInput, ap.sheetTextarea]}
                  placeholder="두 사람의 새로운 출발을 축하하는 따뜻한 메시지를 남겨주세요."
                  placeholderTextColor={C.sub}
                  multiline numberOfLines={5} textAlignVertical="top"
                  value={newMsg.text} onChangeText={v => setNewMsg({ ...newMsg, text: v })}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </>
      )}
    </View>
  );
}

// ======================================================================
const ap = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },

  // ── Intro ──
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 웨딩 일러스트 영역
  introImageArea: {
    width: 200, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  neonGlow: {
    position: 'absolute', width: 200, height: 240, borderRadius: 100,
    backgroundColor: 'transparent',
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 50, elevation: 20,
  },
  introImage: {
    width: 160, height: 200,
  },
  introHeadline: {
    fontSize: 36,
    fontWeight: '700',
    color: C.white,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  introDesc: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  introDate: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginBottom: 40,
  },
  introBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: C.blue,
  },
  introBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: C.white,
  },

  // ── Hero ──
  hero: { width: '100%', height: height * 0.75, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroImageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroDimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  heroDimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  heroGlass: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
  },
  heroGlassInner: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    // iOS backdrop blur approximation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  heroGlassNames: {
    fontSize: 24,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 2,
    marginBottom: 12,
  },
  heroGlassDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
  },
  heroGlassDate: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroGlassLoc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
  },

  // ── Section ──
  section: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: C.white,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.blue,
    letterSpacing: 3,
    marginBottom: 20,
  },

  // ── Greeting ──
  greetingText: {
    fontSize: 16,
    lineHeight: 28,
    color: C.main,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 32,
  },
  parentsBox: {
    backgroundColor: C.gray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  parentsRow: { alignItems: 'center' },
  parentsNames: { fontSize: 15, color: C.main, textAlign: 'center', lineHeight: 24 },
  parentsRole: { color: C.sub, fontWeight: '400' },
  parentsChild: { fontWeight: '700', color: C.blue },
  dDayBox: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.grayMid,
  },
  dDayText: { fontSize: 15, color: C.sub, fontWeight: '500' },

  // ── Contact ──
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.gray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  contactLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBadgeText: { fontSize: 13, fontWeight: '700' },
  contactName: { fontSize: 17, fontWeight: '600', color: C.main },
  contactActions: { flexDirection: 'row', gap: 8 },
  contactBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  contactBtnIcon: { fontSize: 16, marginBottom: 2 },
  contactBtnText: { fontSize: 11, fontWeight: '600', color: C.sub },

  // ── Gallery ──
  galleryScroll: { paddingRight: 24, gap: 12 },
  galleryCard: {
    width: 280,
    height: 380,
    borderRadius: 28,
    backgroundColor: C.grayMid,
  },

  // ── Location ──
  locationCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '700',
    color: C.main,
    marginBottom: 6,
  },
  locationAddr: {
    fontSize: 15,
    color: C.sub,
    marginBottom: 20,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: C.grayMid,
  },
  mapPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: C.grayMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  navBtns: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.gray,
    paddingVertical: 14,
    borderRadius: 12,
  },
  navBtnIcon: { fontSize: 14 },
  navBtnText: { fontSize: 13, fontWeight: '600', color: C.main },
  transportBox: {
    backgroundColor: C.gray,
    borderRadius: 12,
    padding: 16,
  },
  transportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.main,
    marginBottom: 6,
  },
  transportText: {
    fontSize: 13,
    lineHeight: 20,
    color: C.sub,
  },

  // ── Accounts ──
  accountDesc: { fontSize: 14, color: C.sub, marginBottom: 16 },
  accordionCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: C.white,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  accordionTitle: { fontSize: 16, fontWeight: '600', color: C.main },
  accordionChevron: {
    fontSize: 24,
    color: C.sub,
    fontWeight: '300',
  },
  accordionBody: { paddingHorizontal: 20 },
  accountBox: {
    backgroundColor: C.gray,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountBank: { fontSize: 13, fontWeight: '500', color: C.sub, marginBottom: 4 },
  accountNum: { fontSize: 17, fontWeight: '700', color: C.main },
  copyBtn: {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: C.blue },

  // ── Bottom Bar ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bottomBarPill: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bottomShareBtn: {
    width: 48,
    height: 48,
    backgroundColor: C.gray,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomShareIcon: { fontSize: 22, color: C.main },
  bottomMsgBtn: {
    flex: 1,
    height: 48,
    backgroundColor: C.blue,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomMsgText: { fontSize: 16, fontWeight: '600', color: C.white },

  // ── Toast ──
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 50,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: 'rgba(29,29,31,0.92)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
    overflow: 'hidden',
  },

  // ── Image Modal ──
  imageModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageModalClose: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalImg: { width: '100%', height: '80%' },

  // 방명록
  guestbookHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  writeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  writeBtnText: { fontSize: 14, fontWeight: '600', color: C.blue },
  emptyGuestbook: { backgroundColor: C.gray, borderRadius: 24, paddingVertical: 36, alignItems: 'center' },
  emptyText: { fontSize: 15, color: C.sub, fontWeight: '500' },
  guestCard: { backgroundColor: C.gray, borderRadius: 24, padding: 20, marginBottom: 10 },
  guestCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  guestName: { fontSize: 15, fontWeight: '600', color: C.main },
  guestDate: { fontSize: 13, color: C.sub },
  guestMsg: { fontSize: 15, color: C.main, lineHeight: 22 },

  // 바텀시트
  sheetDim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.55, backgroundColor: C.gray, borderTopLeftRadius: 32, borderTopRightRadius: 32, zIndex: 55 },
  sheetHandle: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  sheetHandleBar: { width: 40, height: 5, borderRadius: 999, backgroundColor: C.border },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.grayMid },
  sheetCancel: { fontSize: 17, color: C.blue, fontWeight: '500' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: C.main },
  sheetSubmit: { fontSize: 17, color: C.blue, fontWeight: '700' },
  sheetForm: { padding: 24, gap: 14 },
  sheetInputRow: { flexDirection: 'row', gap: 12 },
  sheetInput: { backgroundColor: C.white, borderRadius: 20, padding: 16, fontSize: 15, fontWeight: '500', color: C.main },
  sheetTextarea: { height: 160, textAlignVertical: 'top' },
});
