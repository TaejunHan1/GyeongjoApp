import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Animated, StyleSheet, Dimensions, Share, Linking, Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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

const { width } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ── 당근마켓 컬러 팔레트 ──
const C = {
  orange: '#FF8A3D',
  orangeBg: '#FFF1E8',
  main: '#212124',
  sub: '#868B94',
  gray: '#F2F3F6',
  white: '#FFFFFF',
  border: '#EBEBED',
  cardBg: '#FAFAFA',
};

// ── 기본 캡션 ──
const defaultCaptions = [
  '함께라서 좋은 날 ☀️',
  '웃음이 가득한 하루 😊',
  '소중한 우리의 기록 📸',
  '같이 걸어온 길 🌿',
  '오늘도 사랑해 💕',
  '둘만의 특별한 순간 ✨',
  '설레는 매일 🌸',
  '행복을 담다 🎞️',
];

// ── 지인 후기 초기 데이터 ──
const initialReviews = [
  { name: '김영희', emoji: '❤️', message: '두 분 정말 축하드려요! 행복하게 잘 살아요~', time: '방금 전' },
  { name: '박철수', emoji: '🎉', message: '결혼 축하해! 정말 잘 어울리는 커플이야', time: '1시간 전' },
  { name: '이수진', emoji: '💐', message: '예쁜 사랑 오래오래 하세요 ♥', time: '3시간 전' },
];

// ======================================================================
export default function VintageAppTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings, selectedPhotoFrame, frameAdjusting = false, onPhotoFrameAdjust }) {
  const insets = useSafeAreaInsets();

  // ── 인트로 ──
  const [showIntro, setShowIntro] = useState(true);
  const introOpacity = useRef(new Animated.Value(1)).current;
  const notifSlide = useRef(new Animated.Value(-80)).current;
  const notifOpacity = useRef(new Animated.Value(0)).current;
  const mainOpacity = useRef(new Animated.Value(0.8)).current;

  const [activeAccount, setActiveAccount] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [viewerImage, setViewerImage] = useState(null);
  const [temperature, setTemperature] = useState(36.5);
  const [tempReached100, setTempReached100] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [floatingHearts, setFloatingHearts] = useState([]);

  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // ── 이름 ──
  const groomName = eventData.groomName || eventData.groom_name || '';
  const brideName = eventData.brideName || eventData.bride_name || '';

  // ── 부모님 ──
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '';

  // ── 날짜/시간 ──
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const dateStr = dateInfo?.full || '';
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);

  // ── 장소 ──
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';

  // ── 카운트다운 ──
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date,
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // ── D-day ──
  const weddingDate = eventData.date || eventData.event_date;
  let dDayText = '';
  if (weddingDate) {
    const diff = Math.ceil((new Date(weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff > 0) dDayText = `D-${diff}`;
    else if (diff === 0) dDayText = 'D-Day';
    else dDayText = `D+${Math.abs(diff)}`;
  }

  // ── 계좌 & 연락처 ──
  const ai = eventData.additional_info || {};
  const groomContact = eventData.groomContact || eventData.groom_contact || '';
  const brideContact = eventData.brideContact || eventData.bride_contact || '';
  const groomFatherContact = eventData.groomFatherContact || ai.groom_father_contact || '';
  const groomMotherContact = eventData.groomMotherContact || ai.groom_mother_contact || '';
  const brideFatherContact = eventData.brideFatherContact || ai.bride_father_contact || '';
  const brideMotherContact = eventData.brideMotherContact || ai.bride_mother_contact || '';

  // 사람 한 명당 { name, role, bank, number, contact } — 계좌·연락처가 둘 다 없으면 제외
  const buildPerson = (name, role, bank, number, contact) => {
    if (!number && !contact) return null;
    return { name: name || role, role, bank: bank || '', number: number || '', contact: contact || '' };
  };

  const accounts = {
    groom: [
      buildPerson(groomName, '신랑', ai.groom_bank_name, ai.groom_account_number, groomContact),
      buildPerson(groomFather ? `${groomFather} 아버님` : '아버님', '아버님', ai.groom_father_bank_name, ai.groom_father_account_number, groomFatherContact),
      buildPerson(groomMother ? `${groomMother} 어머님` : '어머님', '어머님', ai.groom_mother_bank_name, ai.groom_mother_account_number, groomMotherContact),
    ].filter(Boolean),
    bride: [
      buildPerson(brideName, '신부', ai.bride_bank_name, ai.bride_account_number, brideContact),
      buildPerson(brideFather ? `${brideFather} 아버님` : '아버님', '아버님', ai.bride_father_bank_name, ai.bride_father_account_number, brideFatherContact),
      buildPerson(brideMother ? `${brideMother} 어머님` : '어머님', '어머님', ai.bride_mother_bank_name, ai.bride_mother_account_number, brideMotherContact),
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

  // ── 메인 이미지 크로스페이드 슬라이드쇼 ──
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

  // ── 갤러리 이미지 + 랜덤 회전 + 캡션 ──
  const galleryImages = (safeImages.gallery || safeImages.all || []).map((img, idx) => ({
    source: img,
    caption: defaultCaptions[idx % defaultCaptions.length],
    rotate: (Math.random() * 6 - 3).toFixed(1),
  }));

  // ── 인트로 시퀀스 — 자동 닫기 없음, 반드시 터치로만 열림 ──
  useEffect(() => {
    Animated.parallel([
      Animated.spring(notifSlide, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 150 }),
      Animated.timing(notifOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismissIntro = () => {
    Animated.parallel([
      Animated.timing(notifSlide, { toValue: -80, duration: 400, useNativeDriver: true }),
      Animated.timing(notifOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(introOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(mainOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => setShowIntro(false));
  };

  // ── 토스트 ──
  const toastAnim = useRef(new Animated.Value(0)).current;
  const showToast = (message) => {
    setToast({ visible: true, message });
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, message: '' }));
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast('\uACC4\uC88C\uBC88\uD638\uAC00 \uBCF5\uC0AC\uB418\uC5C8\uC5B4\uC694');
    } catch {
      showToast('\uBCF5\uC0AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4');
    }
  };

  // ── 사랑 온도 ──
  const tempBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ratio = Math.min((temperature - 36.5) / (100 - 36.5), 1);
    Animated.timing(tempBarAnim, {
      toValue: ratio,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [temperature]);

  const handleTempPress = () => {
    if (temperature >= 100) return;
    const next = Math.min(temperature + 0.1, 100);
    setTemperature(parseFloat(next.toFixed(1)));
    if (next >= 100 && !tempReached100) {
      setTempReached100(true);
      showToast('\uD83C\uDF89 \uC0AC\uB791 \uC628\uB3C4 100\uB3C4 \uB2EC\uC131! \uCD95\uD558\uD569\uB2C8\uB2E4!');
    }
    // 떠오르는 하트
    const id = Date.now();
    const x = Math.random() * (width - 60) + 10;
    setFloatingHearts(prev => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1500);
  };

  // ── 아코디언 ──
  const groomAnim = useRef(new Animated.Value(0)).current;
  const brideAnim = useRef(new Animated.Value(0)).current;

  const toggleAccount = (side) => {
    const isOpen = activeAccount === side;
    const anim = side === 'groom' ? groomAnim : brideAnim;
    const other = side === 'groom' ? brideAnim : groomAnim;
    Animated.timing(other, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    Animated.timing(anim, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    setActiveAccount(isOpen ? null : side);
  };

  // 카드 1개당 대략 110px (계좌 행 + 연락처 행 + 패딩)
  const accordionHeight = (anim, count) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(count * 120 + 16, 120)] });


  // ── 공유 — 미리보기에서는 동작 안 함 (껍데기 버튼) ──
  const handleShare = () => {
    showToast('미리보기에서는 공유할 수 없어요');
  };

  // 카카오 좌표 검색
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);

  useEffect(() => {
    resolveWeddingMapCoord({ locName, locAddr, kakaoKey: KAKAO_KEY })
      .then(coord => {
        if (coord) setMapCoord(coord);
      })
      .catch(() => {});
  }, [locAddr, locName]);

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <Animated.View style={[{ flex: 1 }, { opacity: mainOpacity }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} scrollEnabled={!frameAdjusting}>

        {/* ═══ 1. 히어로 ═══ */}
        <View style={s.hero}>
          {mainImages.map((img, i) => (
            <Animated.Image
              key={i}
              source={img}
              style={[s.heroImage, i > 0 && s.heroImageOverlay, { opacity: heroAnims[i] }]}
              resizeMode="cover"
            />
          ))}
          <PhotoFrameOverlay
            selectedPhotoFrame={selectedPhotoFrame}
            frameAdjusting={frameAdjusting}
            onPhotoFrameAdjust={onPhotoFrameAdjust}
          />
          {/* 아래쪽 텍스트 가독성용 연한 그라데이션 (상단 사진은 깔끔하게 유지) */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(245,243,240,0.85)']}
            locations={[0, 1]}
            style={s.heroBottomFade}
            pointerEvents="none"
          />
          <View style={s.heroContent}>
            <View style={s.heroBadge}>
              <Text style={s.heroBadgeText}>저희 결혼합니다 🥕</Text>
            </View>
            <Text style={s.heroNames}>
              {groomName} <Text style={{ color: C.orange }}>♥</Text> {brideName}
            </Text>
            <Text style={s.heroDate}>{dateStr} {timeStr}</Text>
          </View>
        </View>

        {/* ═══ 2. 인사말 ═══ */}
        <View style={s.greetingSection}>
          <Text style={s.greetingTitle}>초대합니다</Text>
          <Text style={s.greetingText}>
            {eventData.customMessage || eventData.custom_message ||
              '같은 곳을 바라보며 걸어온 두 사람이\n이제 한 길을 같이 걸어가려 합니다.\n\n저희 두 사람의 새로운 시작을\n따뜻한 마음으로 축복해주시면\n더 없는 기쁨으로 간직하겠습니다.'}
          </Text>
          {(groomFather || groomMother || brideFather || brideMother) && (
            <View style={s.parentsBox}>
              {(groomFather || groomMother) && (
                <View style={s.parentsRow}>
                  <Text style={s.parentsNames}>{groomFather}{groomFather && groomMother ? ' · ' : ''}{groomMother}</Text>
                  <Text style={s.parentsRole}>의 아들</Text>
                  <Text style={s.parentsChild}>{groomName}</Text>
                </View>
              )}
              {(brideFather || brideMother) && (
                <View style={[s.parentsRow, { marginTop: 12 }]}>
                  <Text style={s.parentsNames}>{brideFather}{brideFather && brideMother ? ' · ' : ''}{brideMother}</Text>
                  <Text style={s.parentsRole}>의 딸</Text>
                  <Text style={s.parentsChild}>{brideName}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ═══ 3. 사랑 온도 카드 ═══ */}
        <TouchableOpacity style={s.tempCard} onPress={handleTempPress} activeOpacity={0.85}>
          <Text style={s.tempGuide}>터치해서 두 사람의 사랑 온도를 올려주세요!</Text>
          <View style={s.tempRow}>
            <Text style={s.tempFireIcon}>🔥</Text>
            <View style={s.tempBarArea}>
              <View style={s.tempValueRow}>
                <Text style={s.tempValue}>{temperature.toFixed(1)}°C</Text>
                <Text style={s.tempMax}>100°C</Text>
              </View>
              <View style={s.tempBarBg}>
                <Animated.View
                  style={[
                    s.tempBarFill,
                    {
                      width: tempBarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </View>
          {tempReached100 && (
            <Text style={s.tempCongrats}>🎉 축하해주셔서 감사합니다!</Text>
          )}
        </TouchableOpacity>

        {/* 떠오르는 하트 */}
        {floatingHearts.map(heart => (
          <FloatingHeart key={heart.id} x={heart.x} />
        ))}

        {/* ═══ 3. 스크랩북 갤러리 (2행 × N열 가로 스크롤) ═══ */}
        {galleryImages.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionEmoji}>📷</Text>
              <Text style={s.sectionTitle}>우리의 스크랩북</Text>
            </View>
            <View style={s.galleryOuter}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.galleryScrollContent}
              >
                {/* 2장씩 묶어서 세로로 쌓은 열(column)을 가로로 나열 */}
                {Array.from({ length: Math.ceil(galleryImages.length / 2) }).map((_, colIdx) => {
                  const top = galleryImages[colIdx * 2];
                  const bottom = galleryImages[colIdx * 2 + 1];
                  const renderCard = (item, idx) => {
                    if (!item) return <View style={{ width: 180 }} />;
                    const heightVar = idx % 3 === 0 ? 200 : idx % 3 === 1 ? 180 : 190;
                    const imgSource = typeof item.source === 'string' ? { uri: item.source } : item.source;
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.9}
                        onPress={() => setViewerImage(imgSource)}
                        style={[
                          s.polaroid,
                          { width: 180, transform: [{ rotate: `${item.rotate}deg` }] },
                        ]}
                      >
                        <View style={s.polaroidTape}>
                          <View style={s.tapeStrip} />
                        </View>
                        <Image source={imgSource} style={[s.polaroidImage, { height: heightVar }]} resizeMode="cover" />
                        <Text style={s.polaroidCaption}>{item.caption}</Text>
                      </TouchableOpacity>
                    );
                  };
                  return (
                    <View key={colIdx} style={s.galleryColumn}>
                      {renderCard(top, colIdx * 2)}
                      <View style={{ height: 24 }} />
                      {renderCard(bottom, colIdx * 2 + 1)}
                    </View>
                  );
                })}
              </ScrollView>
              {/* 우측 페이드 — 4장 초과 시만 */}
              {galleryImages.length > 4 && (
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.98)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.galleryFadeRight}
                  pointerEvents="none"
                />
              )}
            </View>
            {galleryImages.length > 4 && (
              <View style={s.galleryHint}>
                <Text style={s.galleryHintText}>
                  옆으로 밀면 사진 {galleryImages.length - 4}장이 더 있어요
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ═══ 4. 지인들의 따뜻한 후기 (축하메시지) ═══ */}
        {allowMessages && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionEmoji}>💬</Text>
              <Text style={s.sectionTitle}>지인들의 따뜻한 후기</Text>
            </View>
            {reviews.map((review, idx) => (
              <View key={idx} style={s.reviewCard}>
                <View style={s.reviewTop}>
                  <View style={s.reviewAvatar}>
                    <Text style={s.reviewAvatarText}>{review.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.reviewName}>{review.name}</Text>
                    <Text style={s.reviewTime}>{review.time}</Text>
                  </View>
                </View>
                <Text style={s.reviewMessage}>{review.message}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={s.addReviewBtn}
              onPress={() => showToast('미리보기에서는 메시지를 남길 수 없어요')}
              activeOpacity={0.8}
            >
              <Text style={s.addReviewBtnText}>+ 축하 메시지 남기기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ 6. 축의금 + 연락처 아코디언 ═══ */}
        {hasAnyAccount && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionEmoji}>🧡</Text>
              <Text style={s.sectionTitle}>축의금 보내기</Text>
            </View>
            <Text style={s.accountDesc}>계좌번호 터치하면 복사, 연락처 터치하면 전화가 연결됩니다</Text>
            {['groom', 'bride'].map(side => {
              const list = accounts[side];
              if (list.length === 0) return null;
              const anim = side === 'groom' ? groomAnim : brideAnim;
              const h = accordionHeight(anim, list.length);
              const isGroom = side === 'groom';
              return (
                <View key={side} style={s.accordionCard}>
                  <TouchableOpacity style={s.accordionHeader} onPress={() => toggleAccount(side)} activeOpacity={0.85}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[s.sideBadge, { backgroundColor: isGroom ? C.orangeBg : '#FFF0F6' }]}>
                        <Text style={{ fontSize: 16 }}>{isGroom ? '🤵' : '👰'}</Text>
                      </View>
                      <Text style={s.accordionTitle}>
                        {isGroom ? '신랑측' : '신부측'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, color: C.sub }}>
                      {activeAccount === side ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  <Animated.View style={[s.accordionBody, { height: h, overflow: 'hidden' }]}>
                    {list.map((p, idx) => (
                      <View key={idx} style={s.personCard}>
                        <Text style={s.personCardLabel}>{p.name}</Text>
                        {p.number ? (
                          <TouchableOpacity style={s.personRow} onPress={() => copyToClipboard(p.number)} activeOpacity={0.7}>
                            <View style={{ flex: 1 }}>
                              <Text style={s.personRowValue}>{p.bank} {p.number}</Text>
                            </View>
                            <View style={s.copyBtn}>
                              <Text style={s.copyBtnText}>복사</Text>
                            </View>
                          </TouchableOpacity>
                        ) : null}
                        {p.number && p.contact ? <View style={s.personDivider} /> : null}
                        {p.contact ? (
                          <TouchableOpacity
                            style={s.personRow}
                            onPress={() => Linking.openURL(`tel:${p.contact.replace(/\D/g, '')}`)}
                            activeOpacity={0.7}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={s.personRowValue}>📞 {formatPhone(p.contact)}</Text>
                            </View>
                            <View style={s.callBtn}>
                              <Text style={s.callBtnText}>전화</Text>
                            </View>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))}
                  </Animated.View>
                </View>
              );
            })}
          </View>
        )}

        {/* ═══ 당근 스타일 달력 ═══ */}
        {weddingDate && (() => {
          const wd = new Date(weddingDate);
          if (isNaN(wd.getTime())) return null;
          const calYear = wd.getFullYear();
          const calMonth = wd.getMonth(); // 0-indexed
          const calDay = wd.getDate();
          const firstDow = new Date(calYear, calMonth, 1).getDay();
          const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
          const cells = [];
          for (let i = 0; i < firstDow; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
          while (cells.length % 7 !== 0) cells.push(null);
          const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
          return (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionEmoji}>📅</Text>
                <Text style={s.sectionTitle}>우리의 그날</Text>
              </View>
              <View style={s.calCard}>
                <View style={s.calHeader}>
                  <Text style={s.calMonthText}>{calYear}년 {calMonth + 1}월</Text>
                  {dDayText ? (
                    <View style={s.calDdayBadge}>
                      <Text style={s.calDdayText}>{dDayText}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={s.calWeekRow}>
                  {dayNames.map((n, i) => (
                    <Text key={n} style={[s.calWeekCell, i === 0 && { color: '#F04452' }, i === 6 && { color: '#3182F6' }]}>{n}</Text>
                  ))}
                </View>
                <View style={s.calGrid}>
                  {cells.map((d, idx) => {
                    const col = idx % 7;
                    const isTarget = d === calDay;
                    return (
                      <View key={idx} style={s.calDayCell}>
                        {d ? (
                          isTarget ? (
                            <View style={s.calDayHighlight}>
                              <Text style={s.calDayHighlightText}>{d}</Text>
                            </View>
                          ) : (
                            <Text style={[
                              s.calDayText,
                              col === 0 && { color: '#F04452' },
                              col === 6 && { color: '#3182F6' },
                            ]}>{d}</Text>
                          )
                        ) : null}
                      </View>
                    );
                  })}
                </View>
                {timeStr ? (
                  <View style={s.calTimeRow}>
                    <Text style={s.calTimeEmoji}>⏰</Text>
                    <Text style={s.calTimeText}>{dateStr} {timeStr}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })()}

        {/* ── 장소 안내 ── */}
        {locName ? (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionEmoji}>📍</Text>
              <Text style={s.sectionTitle}>오시는 길</Text>
            </View>
            <Text style={s.locName}>{locName}</Text>
            {locAddr ? <Text style={s.locAddr}>{locAddr}</Text> : null}
            <Text style={s.locDate}>{dateStr} {timeStr}</Text>

            {/* 지도 */}
            {mapCoord ? (
              <View style={s.mapContainer}>
                <WebView
                  source={{
                    html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#FFF1E8}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,tap:false}).setView([${Number(mapCoord.lat)},${Number(mapCoord.lng)}],17);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${Number(mapCoord.lat)},${Number(mapCoord.lng)}]).addTo(map);</script></body></html>`,
                  }}
                  style={{ flex: 1, backgroundColor: 'transparent' }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  domStorageEnabled
                  originWhitelist={['*']}
                  mixedContentMode="always"
                  androidLayerType="hardware"
                />
              </View>
            ) : (locAddr || locName) ? (
              <View style={s.mapMock}>
                <LottieLoading text="지도를 불러오는 중..." size={54} color={C.sub} />
              </View>
            ) : null}

            {/* 내비 버튼 */}
            <View style={s.navBtns}>
              <TouchableOpacity style={s.navBtn} onPress={() => showToast('네이버지도로 이동합니다')} activeOpacity={0.85}>
                <Text style={s.navBtnText}>🧭 네이버지도</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.navBtn} onPress={() => showToast('카카오내비로 이동합니다')} activeOpacity={0.85}>
                <Text style={s.navBtnText}>🧭 카카오내비</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.navBtn} onPress={() => showToast('티맵으로 이동합니다')} activeOpacity={0.85}>
                <Text style={s.navBtnText}>🧭 티맵</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

      </ScrollView>
      </Animated.View>

      {/* ═══ 7. 하단 고정 버튼 ═══ */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={s.shareMainBtn} onPress={handleShare} activeOpacity={0.88}>
          <Text style={s.shareMainBtnText}>주변 지인에게 공유하기 🥕</Text>
        </TouchableOpacity>
      </View>

      {/* ═══ 8. 토스트 ═══ */}
      {toast.visible && (
        <Animated.View
          style={[
            s.toast,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              bottom: insets.bottom + 80,
            },
          ]}
        >
          <Text style={s.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ═══ 이미지 뷰어 모달 ═══ */}
      <Modal visible={!!viewerImage} transparent animationType="fade">
        <View style={s.viewerBg}>
          <TouchableOpacity style={[s.viewerClose, { top: insets.top + 16 }]} onPress={() => setViewerImage(null)}>
            <Text style={s.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {viewerImage && (
            <Image source={viewerImage} style={s.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* ═══ 인트로 오버레이 ═══ */}
      {showIntro && (
        <Animated.View style={[s.introOverlay, { opacity: introOpacity }]} pointerEvents="auto">
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          {/* 배경(카드 밖) 탭 — 바로 닫힘 */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismissIntro} activeOpacity={1} />
          {/* 알림 카드 자체도 탭하면 바로 닫히도록 AnimatedTouchable로 변경 */}
          <AnimatedTouchable
            activeOpacity={0.9}
            onPress={dismissIntro}
            style={[
              s.notifCard,
              { top: insets.top + 16 },
              { opacity: notifOpacity, transform: [{ translateY: notifSlide }] },
            ]}
          >
            <View style={s.notifIcon}>
              <Text style={{ fontSize: 22 }}>🥕</Text>
            </View>
            <View style={s.notifContent}>
              <View style={s.notifTopRow}>
                <View style={s.notifAppRow}>
                  <Text style={s.notifAppName}>경조앱</Text>
                  <View style={s.notifDot} />
                </View>
                <Text style={s.notifTime}>방금 전</Text>
              </View>
              <Text style={s.notifMessage}>
                따뜻한 이웃,{' '}
                <Text style={{ fontWeight: '800', color: C.orange }}>
                  {groomName} ♥ {brideName}
                </Text>
                {' '}님의 모바일 청첩장이 도착했어요! 💌
              </Text>
              <Text style={s.notifHint}>터치해서 열어보기</Text>
            </View>
          </AnimatedTouchable>
        </Animated.View>
      )}
    </View>
  );
}

// ── 떠오르는 하트 컴포넌트 ──
function FloatingHeart({ x }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        fontSize: 28,
        zIndex: 99,
        opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] }),
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [400, 100] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.2, 0.8] }) },
        ],
      }}
    >
      {'\u2764\uFE0F'}
    </Animated.Text>
  );
}

// ======================================================================
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.gray },

  // ── 히어로 ──
  hero: { width: '100%', height: 640, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroImageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroBottomFade: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 220,
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 56, alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(180,170,155,0.45)', paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999, marginBottom: 24,
  },
  heroBadgeText: { color: '#4A4540', fontSize: 14, fontWeight: '700' },
  heroNames: { fontSize: 36, fontWeight: '800', color: '#2A2520', marginBottom: 12, textAlign: 'center', letterSpacing: 4 },
  heroDate: { fontSize: 15, fontWeight: '500', color: '#6A6560', letterSpacing: 1 },

  // ── 사랑 온도 카드 ──
  tempCard: {
    marginTop: -24, marginHorizontal: 16, backgroundColor: C.white,
    borderRadius: 20, padding: 24, zIndex: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  tempGuide: { fontSize: 15, fontWeight: '700', color: C.sub, textAlign: 'center', marginBottom: 20 },
  tempRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  tempFireIcon: { fontSize: 40, marginBottom: -4 },
  tempBarArea: { flex: 1 },
  tempValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  tempValue: { fontSize: 26, fontWeight: '800', color: C.orange },
  tempMax: { fontSize: 13, color: C.sub },
  tempBarBg: {
    width: '100%', height: 14, backgroundColor: C.gray, borderRadius: 7, overflow: 'hidden',
  },
  tempBarFill: {
    height: '100%', borderRadius: 7,
    backgroundColor: C.orange,
  },
  tempCongrats: {
    marginTop: 16, fontSize: 14, fontWeight: '700', color: C.orange, textAlign: 'center',
  },

  // ── 인사말 ──
  greetingSection: {
    backgroundColor: C.white, paddingHorizontal: 24, paddingVertical: 48, alignItems: 'center',
  },
  greetingTitle: { fontSize: 18, fontWeight: '700', color: C.orange, marginBottom: 24 },
  greetingText: { fontSize: 15, lineHeight: 26, color: C.main, textAlign: 'center', marginBottom: 32 },
  parentsBox: {
    backgroundColor: C.orangeBg, borderRadius: 20, paddingVertical: 24, paddingHorizontal: 20, width: '100%',
  },
  parentsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  parentsNames: { fontSize: 15, color: C.sub },
  parentsRole: { fontSize: 13, color: C.sub },
  parentsChild: { fontSize: 15, fontWeight: '700', color: C.main, marginLeft: 8 },

  // ── 공통 섹션 ──
  section: {
    backgroundColor: C.white, marginTop: 8, paddingHorizontal: 20, paddingVertical: 28,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  sectionEmoji: { fontSize: 22 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: C.main },

  // ── 스크랩북 갤러리 (2행 × N열 가로 스크롤) ──
  galleryOuter: {
    marginHorizontal: -24,   // 섹션 패딩 뚫고 양끝 확장
    marginTop: 4,
    position: 'relative',
  },
  galleryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
    flexDirection: 'row',
  },
  galleryColumn: {
    width: 180,
    marginRight: 16,
  },
  galleryFadeRight: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: 56,
  },
  galleryHint: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.orangeBg,
    borderRadius: 999,
  },
  galleryHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.orange,
  },
  polaroid: {
    backgroundColor: C.white, borderRadius: 4, padding: 8, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
    borderWidth: 1, borderColor: '#eee', position: 'relative',
  },
  polaroidTape: {
    position: 'absolute', top: -6, left: '35%', zIndex: 2,
    alignItems: 'center',
  },
  tapeStrip: {
    width: 40, height: 14, backgroundColor: 'rgba(255,200,100,0.5)',
    borderRadius: 1, transform: [{ rotate: '-2deg' }],
  },
  polaroidImage: { width: '100%', borderRadius: 2 },
  polaroidCaption: {
    marginTop: 10, fontSize: 13, color: C.sub, textAlign: 'center', fontWeight: '500',
  },

  // ── 지인 후기 ──
  reviewCard: {
    backgroundColor: C.gray, borderRadius: 16, padding: 16, marginBottom: 10,
  },
  reviewTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.orangeBg,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 18 },
  reviewName: { fontSize: 15, fontWeight: '700', color: C.main },
  reviewTime: { fontSize: 12, color: C.sub },
  reviewMessage: { fontSize: 14, lineHeight: 22, color: C.main },
  addReviewBtn: {
    marginTop: 8, borderWidth: 1.5, borderColor: C.orange, borderStyle: 'dashed',
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  addReviewBtnText: { fontSize: 15, fontWeight: '700', color: C.orange },

  // ── 계좌 아코디언 ──
  accountDesc: { fontSize: 14, color: C.sub, marginBottom: 16 },
  accordionCard: {
    borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden',
    marginBottom: 10, backgroundColor: C.white,
  },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: C.main },
  accordionBody: { paddingHorizontal: 16 },
  sideBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sideBadgeText: { fontSize: 12, fontWeight: '700' },
  accountBox: {
    backgroundColor: C.gray, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  accountName: { fontSize: 15, fontWeight: '700', color: C.main, marginBottom: 2 },
  accountBank: { fontSize: 13, color: C.sub },
  copyBtn: {
    backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: C.orange },
  // 축의금 + 연락처 통합 카드
  personCard: {
    backgroundColor: C.gray, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  personCardLabel: { fontSize: 14, fontWeight: '700', color: C.main, marginBottom: 8 },
  personRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
  },
  personRowValue: { fontSize: 14, color: C.main, fontWeight: '500' },
  personDivider: { height: 1, backgroundColor: C.border, marginVertical: 2 },
  callBtn: {
    backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: C.orange },

  // ── 당근 스타일 달력 ──
  calCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  calHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  calMonthText: { fontSize: 17, fontWeight: '800', color: C.main, letterSpacing: -0.3 },
  calDdayBadge: {
    backgroundColor: C.orange, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 999,
  },
  calDdayText: { fontSize: 13, fontWeight: '800', color: C.white, letterSpacing: 0.2 },
  calWeekRow: {
    flexDirection: 'row', marginBottom: 8,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  calWeekCell: {
    flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: C.sub,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayCell: {
    width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center',
  },
  calDayText: { fontSize: 14, color: C.main, fontWeight: '500' },
  calDayHighlight: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.orange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  calDayHighlightText: { fontSize: 14, fontWeight: '800', color: C.white },
  calTimeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border,
  },
  calTimeEmoji: { fontSize: 14 },
  calTimeText: { fontSize: 13, color: C.sub, fontWeight: '600' },

  // ── 장소 ──
  locName: { fontSize: 18, fontWeight: '700', color: C.main, marginBottom: 4 },
  locAddr: { fontSize: 14, color: C.sub, marginBottom: 4 },
  locDate: { fontSize: 13, color: C.sub, marginBottom: 16 },
  mapMock: {
    width: '100%', height: 180, backgroundColor: '#E8E6E3', borderRadius: 16, marginBottom: 12,
    alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
  },
  mapPin: {
    width: 44, height: 44, backgroundColor: C.white, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  mapLabel: {
    position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  mapLabelText: { fontSize: 12, fontWeight: '700', color: C.main },
  navBtns: { flexDirection: 'row', gap: 8 },
  navBtn: {
    flex: 1, backgroundColor: C.gray, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  navBtnText: { fontSize: 13, fontWeight: '700', color: C.main },

  // ── 하단 버튼 ──
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 16, paddingTop: 12,
  },
  shareMainBtn: {
    backgroundColor: C.orange, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center',
    shadowColor: C.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  shareMainBtnText: { fontSize: 17, fontWeight: '700', color: C.white },

  // ── 토스트 ──
  toast: {
    position: 'absolute', left: 24, right: 24, zIndex: 50,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: 'rgba(33,33,36,0.92)', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 999, fontSize: 15, fontWeight: '600', color: C.white,
    overflow: 'hidden',
  },

  // ── 이미지 뷰어 ──
  viewerBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  viewerClose: { position: 'absolute', left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  viewerCloseText: { fontSize: 20, color: '#fff', fontWeight: '600' },
  viewerImage: { width: '100%', height: '80%' },

  // ── 지도 ──
  mapContainer: {
    width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F2F3F6',
  },
  mapImage: { width: '100%', height: '100%' },

  // ── 인트로 오버레이 ──
  introOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 50,
  },
  notifCard: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },
  notifIcon: {
    width: 42, height: 42, backgroundColor: C.orange, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1, paddingTop: 2 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifAppRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  notifAppName: { fontSize: 13, fontWeight: '700', color: C.main },
  notifDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  notifTime: { fontSize: 12, color: C.sub },
  notifMessage: { fontSize: 14, color: C.main, lineHeight: 20, fontWeight: '500' },
  notifHint: { fontSize: 12, color: C.sub, fontWeight: '600', marginTop: 6 },
});
