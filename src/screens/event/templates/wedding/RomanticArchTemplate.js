import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Animated, StyleSheet, Dimensions, Modal, Linking,
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
import { GuestBookMessages, PhotoFrameOverlay } from './WeddingCommonComponents';

const { width } = Dimensions.get('window');

// -- Theme --
const T = {
  bg: '#F9F8F5',
  main: '#4A433B',
  sub: '#8A8175',
  accent: '#B5A48F',
  surface: '#F0ECE4',
  border: '#E6E1D6',
};

// ======================================================================
export default function RomanticArchTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings, selectedPhotoFrame, frameAdjusting = false, onPhotoFrameAdjust }) {
  const insets = useSafeAreaInsets();
  const [activeAccount, setActiveAccount] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [selectedImage, setSelectedImage] = useState(null);

  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // -- Names --
  const groomName = eventData.groomName || eventData.groom_name || '';
  const brideName = eventData.brideName || eventData.bride_name || '';

  // -- Parents --
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '';

  // -- Date / Time --
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const dateStr = dateInfo?.full || '';
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);

  // -- Location --
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';

  // -- Kakao coord --
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);

  useEffect(() => {
    resolveWeddingMapCoord({ locName, locAddr, kakaoKey: KAKAO_KEY })
      .then(coord => {
        if (coord) setMapCoord(coord);
      })
      .catch(() => {});
  }, [locAddr, locName]);

  // -- Countdown --
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date,
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // -- Accounts --
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

  // -- Gallery --
  const galleryImages = safeImages.gallery || safeImages.all || [];

  // -- Hero crossfade slideshow --
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

  // -- Toast --
  const toastAnim = useRef(new Animated.Value(0)).current;
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
      showToast('계좌번호가 복사되었습니다');
    } catch { showToast('복사에 실패했습니다'); }
  };

  // -- Accordion --
  const groomAnim = useRef(new Animated.Value(0)).current;
  const brideAnim = useRef(new Animated.Value(0)).current;
  const chevronGroomAnim = useRef(new Animated.Value(0)).current;
  const chevronBrideAnim = useRef(new Animated.Value(0)).current;

  const toggleAccount = (side) => {
    const isOpen = activeAccount === side;
    const anim = side === 'groom' ? groomAnim : brideAnim;
    const other = side === 'groom' ? brideAnim : groomAnim;
    const chevAnim = side === 'groom' ? chevronGroomAnim : chevronBrideAnim;
    const chevOther = side === 'groom' ? chevronBrideAnim : chevronGroomAnim;
    Animated.timing(other, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    Animated.timing(chevOther, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    Animated.timing(anim, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    Animated.timing(chevAnim, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    setActiveAccount(isOpen ? null : side);
  };

  const accordionHeight = (anim, count) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(count * 84 + 16, 100)] });

  // -- Calendar --
  const calDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weddingDate = eventData.date || eventData.event_date;
  let calYear = 2026, calMonth = 5, calDay = 14;
  if (weddingDate) {
    try {
      const d = new Date(weddingDate);
      if (!isNaN(d.getTime())) { calYear = d.getFullYear(); calMonth = d.getMonth() + 1; calDay = d.getDate(); }
    } catch {}
  }
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();

  // -- D-day --
  let dDayText = '';
  if (weddingDate) {
    const diff = Math.ceil((new Date(weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff > 0) dDayText = `D-${diff}`;
    else if (diff === 0) dDayText = 'D-Day';
    else dDayText = `D+${Math.abs(diff)}`;
  }

  // -- Gallery layout --
  const renderGalleryItem = (img, idx) => {
    const imgSource = typeof img === 'string' ? { uri: img } : img;
    const pattern = idx % 5;
    if (pattern === 0) {
      return (
        <TouchableOpacity key={idx} onPress={() => setSelectedImage(imgSource)} activeOpacity={0.9}>
          <Image source={imgSource} style={st.galleryTall} resizeMode="cover" />
        </TouchableOpacity>
      );
    } else if (pattern === 1 || pattern === 2) {
      return (
        <TouchableOpacity key={idx} onPress={() => setSelectedImage(imgSource)} activeOpacity={0.9}
          style={{ width: (width - 52) / 2 }}>
          <Image source={imgSource} style={st.galleryHalf} resizeMode="cover" />
        </TouchableOpacity>
      );
    } else if (pattern === 3) {
      return (
        <TouchableOpacity key={idx} onPress={() => setSelectedImage(imgSource)} activeOpacity={0.9}>
          <Image source={imgSource} style={st.galleryWide} resizeMode="cover" />
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity key={idx} onPress={() => setSelectedImage(imgSource)} activeOpacity={0.9}>
          <Image source={imgSource} style={st.galleryTall} resizeMode="cover" />
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={[st.root, { paddingBottom: insets.bottom }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false} scrollEnabled={!frameAdjusting}>

        {/* ── Hero ── */}
        <View style={st.hero}>
          <Text style={st.heroSaveDate}>Save the Date</Text>
          <View style={st.archFrame}>
            <View style={st.archInner}>
              {mainImages.map((img, i) => (
                <Animated.Image
                  key={i}
                  source={img}
                  style={[st.archImage, i > 0 && StyleSheet.absoluteFill, { opacity: heroAnims[i] }]}
                  resizeMode="cover"
                />
              ))}
              <PhotoFrameOverlay
                selectedPhotoFrame={selectedPhotoFrame}
                frameAdjusting={frameAdjusting}
                onPhotoFrameAdjust={onPhotoFrameAdjust}
              />
            </View>
          </View>
          <View style={st.heroNamesRow}>
            <Text style={st.heroName}>{groomName}</Text>
            <Text style={st.heroAmpersand}>&</Text>
            <Text style={st.heroName}>{brideName}</Text>
          </View>
          <Text style={st.heroDate}>{dateStr}</Text>
          {timeStr ? <Text style={st.heroTime}>{timeStr}</Text> : null}
        </View>

        {/* ── Greeting ── */}
        <View style={st.section}>
          <Text style={st.sectionLabel}>INVITATION</Text>
          <View style={st.labelDot} />
          <Text style={st.greetingText}>
            {eventData.customMessage || eventData.custom_message ||
              '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n\n저희 두 사람이 사랑의 이름으로\n지켜나갈 수 있게 앞날을\n축복해 주시면 감사하겠습니다.'}
          </Text>
          {(groomFather || groomMother || brideFather || brideMother) && (
            <View style={st.parentsBox}>
              {(groomFather || groomMother) && (
                <Text style={st.parentsText}>
                  {groomFather}{groomFather && groomMother ? ' · ' : ''}{groomMother}
                  <Text style={st.parentsRole}>{' 의 아들 '}</Text>
                  <Text style={st.parentsChild}>{groomName}</Text>
                </Text>
              )}
              {(brideFather || brideMother) && (
                <Text style={[st.parentsText, { marginTop: 8 }]}>
                  {brideFather}{brideFather && brideMother ? ' · ' : ''}{brideMother}
                  <Text style={st.parentsRole}>{' 의 딸 '}</Text>
                  <Text style={st.parentsChild}>{brideName}</Text>
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── Contact ── */}
        {(groomName || brideName) && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>CONTACT</Text>
            <View style={st.labelDot} />
            {[
              { label: '신랑에게 연락하기', phone: eventData.groomContact || eventData.groom_contact },
              { label: '신부에게 연락하기', phone: eventData.brideContact || eventData.bride_contact },
            ].map((c, i) => (
              <TouchableOpacity key={i} style={st.contactBtn} activeOpacity={0.8}
                onPress={() => c.phone ? Linking.openURL(`tel:${c.phone}`) : showToast('연락처가 등록되지 않았습니다')}>
                <Text style={st.contactBtnText}>{c.label}</Text>
                <Text style={st.contactArrow}>{'>'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Calendar ── */}
        {weddingDate && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>CALENDAR</Text>
            <View style={st.labelDot} />
            <Text style={st.calHeader}>{calYear}.{String(calMonth).padStart(2, '0')}</Text>
            <View style={st.calRow}>
              {calDays.map((d, i) => (
                <Text key={i} style={[st.calDayLabel, i === 0 && { color: '#B07D62' }]}>{d}</Text>
              ))}
            </View>
            <View style={st.calGrid}>
              {Array.from({ length: firstDow }).map((_, i) => (
                <View key={`e${i}`} style={st.calCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isWedding = day === calDay;
                return (
                  <View key={i} style={st.calCell}>
                    <View style={[st.calDayCircle, isWedding && st.calDayCircleActive]}>
                      <Text style={[st.calDayText, isWedding && st.calDayTextActive]}>{day}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <Text style={st.calTimeText}>{timeStr}</Text>
            {dDayText && (
              <Text style={st.calDday}>{groomName} & {brideName}의 결혼식까지 {dDayText}</Text>
            )}
          </View>
        )}

        {/* ── Gallery ── */}
        {galleryImages.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>GALLERY</Text>
            <View style={st.labelDot} />
            <View style={st.galleryWrap}>
              {galleryImages.slice(0, 5).map((img, idx) => renderGalleryItem(img, idx))}
            </View>
            {galleryImages.length > 5 && (
              <TouchableOpacity style={st.morePhotosBtn} activeOpacity={0.8}
                onPress={() => showToast('더 많은 사진이 준비 중입니다')}>
                <Text style={st.morePhotosBtnText}>더 많은 사진 보기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Location ── */}
        {locName ? (
          <View style={st.section}>
            <Text style={st.sectionLabel}>LOCATION</Text>
            <View style={st.labelDot} />
            <Text style={st.locName}>{locName}</Text>
            {locAddr ? <Text style={st.locAddr}>{locAddr}</Text> : null}
            {mapCoord ? (
              <View style={st.mapContainer}>
                <WebView
                  source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              </View>
            ) : (
              <View style={st.mapMock}>
                <LottieLoading text="지도를 불러오는 중..." size={54} color={T.sub} />
              </View>
            )}
            <View style={st.navBtns}>
              <TouchableOpacity style={st.navBtn} onPress={() => showToast('네이버지도로 이동합니다')} activeOpacity={0.8}>
                <Text style={st.navBtnText}>네이버지도</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.navBtn} onPress={() => showToast('카카오내비로 이동합니다')} activeOpacity={0.8}>
                <Text style={st.navBtnText}>카카오내비</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.navBtn} onPress={() => showToast('티맵으로 이동합니다')} activeOpacity={0.8}>
                <Text style={st.navBtnText}>티맵</Text>
              </TouchableOpacity>
            </View>
            <View style={st.transportBox}>
              {[
                { icon: '🚇', title: '지하철', desc: eventData.additional_info?.subway_info || '' },
                { icon: '🚌', title: '버스', desc: eventData.additional_info?.bus_info || '' },
                { icon: '🅿️', title: '주차', desc: eventData.additional_info?.parking_info || '' },
              ].filter(t => t.desc).map((t, i) => (
                <View key={i} style={st.transportRow}>
                  <Text style={st.transportIcon}>{t.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.transportTitle}>{t.title}</Text>
                    <Text style={st.transportDesc}>{t.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Guestbook ── */}
        {allowMessages && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>GUEST BOOK</Text>
            <View style={st.labelDot} />
            <GuestBookMessages
              messages={[]}
              onAddMessage={() => showToast('미리보기에서는 메시지를 남길 수 없습니다')}
              placeholder={messageSettings?.placeholder || '축하 메시지를 남겨주세요'}
            />
            <TouchableOpacity style={st.guestBookBtn} activeOpacity={0.85}
              onPress={() => showToast('미리보기에서는 메시지를 남길 수 없습니다')}>
              <Text style={st.guestBookBtnText}>메시지 남기기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Accounts ── */}
        {hasAnyAccount && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>GIFT</Text>
            <View style={st.labelDot} />
            {['groom', 'bride'].map(side => {
              const list = accounts[side];
              if (list.length === 0) return null;
              const anim = side === 'groom' ? groomAnim : brideAnim;
              const chevAnim = side === 'groom' ? chevronGroomAnim : chevronBrideAnim;
              const h = accordionHeight(anim, list.length);
              const chevRotate = chevAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
              return (
                <View key={side} style={st.accordionCard}>
                  <TouchableOpacity style={st.accordionHeader} onPress={() => toggleAccount(side)} activeOpacity={0.85}>
                    <Text style={st.accordionTitle}>{side === 'groom' ? '신랑측 계좌번호' : '신부측 계좌번호'}</Text>
                    <Animated.Text style={[st.chevron, { transform: [{ rotate: chevRotate }] }]}>{'▼'}</Animated.Text>
                  </TouchableOpacity>
                  <Animated.View style={[st.accordionBody, { height: h, overflow: 'hidden' }]}>
                    {list.map((acc, idx) => (
                      <View key={idx} style={st.accountRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={st.accountLabel}>{acc.bank} ({acc.name})</Text>
                          <Text style={st.accountNum}>{acc.number}</Text>
                        </View>
                        <TouchableOpacity style={st.copyBtn} onPress={() => copyToClipboard(acc.number)} activeOpacity={0.85}>
                          <Text style={st.copyBtnText}>복사</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </Animated.View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={st.footer}>
          <Text style={st.footerThank}>Thank You</Text>
          <Text style={st.footerNames}>{groomName} & {brideName}</Text>
          <TouchableOpacity style={st.shareBtn} activeOpacity={0.85}
            onPress={() => showToast('카카오톡 공유 기능 준비 중입니다')}>
            <Text style={st.shareBtnText}>카카오톡으로 공유하기</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Toast ── */}
      {toast.visible && (
        <Animated.View style={[st.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          top: insets.top + 16,
        }]}>
          <Text style={st.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ── Fullscreen Image ── */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={st.imageModal}>
          <TouchableOpacity style={[st.imageModalClose, { top: insets.top + 16 }]} onPress={() => setSelectedImage(null)}>
            <Text style={{ fontSize: 22, color: '#fff' }}>{'✕'}</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={selectedImage} style={st.imageModalImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ======================================================================
const ARCH_WIDTH = width - 64;
const ARCH_HEIGHT = ARCH_WIDTH * 1.35;
const ARCH_RADIUS = ARCH_WIDTH / 2;

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Hero
  hero: { paddingTop: 60, paddingBottom: 40, alignItems: 'center', backgroundColor: T.bg },
  heroSaveDate: { fontSize: 36, color: T.accent, fontStyle: 'italic', fontWeight: '300', marginBottom: 32, letterSpacing: 1 },
  archFrame: {
    width: ARCH_WIDTH,
    height: ARCH_HEIGHT,
    borderTopLeftRadius: ARCH_RADIUS,
    borderTopRightRadius: ARCH_RADIUS,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    marginBottom: 28,
  },
  archInner: { flex: 1, position: 'relative' },
  archImage: { width: '100%', height: '100%', position: 'absolute' },
  heroNamesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  heroName: { fontSize: 22, fontWeight: '300', color: T.main, letterSpacing: 2 },
  heroAmpersand: { fontSize: 20, color: T.accent, marginHorizontal: 16, fontStyle: 'italic' },
  heroDate: { fontSize: 14, color: T.sub, letterSpacing: 1 },
  heroTime: { fontSize: 13, color: T.sub, marginTop: 4, fontWeight: '300' },

  // Section
  section: { paddingHorizontal: 24, paddingVertical: 44, borderBottomWidth: 1, borderBottomColor: T.border },
  sectionLabel: { fontSize: 11, color: T.accent, letterSpacing: 4, textAlign: 'center', marginBottom: 8 },
  labelDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.accent, alignSelf: 'center', marginBottom: 28 },

  // Greeting
  greetingText: { fontSize: 15, lineHeight: 28, color: T.sub, textAlign: 'center', marginBottom: 32, fontWeight: '300' },
  parentsBox: { alignItems: 'center' },
  parentsText: { fontSize: 14, color: T.main, textAlign: 'center', lineHeight: 24 },
  parentsRole: { color: T.sub, fontWeight: '300' },
  parentsChild: { fontWeight: '600', color: T.main },

  // Contact
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: T.surface, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  contactBtnText: { fontSize: 15, color: T.main, fontWeight: '400' },
  contactArrow: { fontSize: 16, color: T.sub },

  // Calendar
  calHeader: { fontSize: 16, color: T.main, textAlign: 'center', marginBottom: 20, fontWeight: '300', letterSpacing: 2 },
  calRow: { flexDirection: 'row', marginBottom: 8 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: T.sub, fontWeight: '500' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 5 },
  calDayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calDayCircleActive: { backgroundColor: T.accent },
  calDayText: { fontSize: 14, color: T.main, fontWeight: '300' },
  calDayTextActive: { color: '#fff', fontWeight: '600' },
  calTimeText: { textAlign: 'center', fontSize: 14, color: T.sub, marginTop: 20, fontWeight: '300' },
  calDday: { textAlign: 'center', fontSize: 13, color: T.accent, marginTop: 8, fontWeight: '400' },

  // Gallery
  galleryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  galleryTall: { width: width - 48, height: 400, borderRadius: 4 },
  galleryHalf: { width: '100%', height: 200, borderRadius: 4 },
  galleryWide: { width: width - 48, height: 220, borderRadius: 4 },
  morePhotosBtn: { marginTop: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: T.border, borderRadius: 8 },
  morePhotosBtnText: { fontSize: 14, color: T.sub },

  // Location
  locName: { fontSize: 18, fontWeight: '500', color: T.main, textAlign: 'center', marginBottom: 4 },
  locAddr: { fontSize: 14, color: T.sub, textAlign: 'center', marginBottom: 20, fontWeight: '300' },
  mapContainer: { width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: T.border },
  mapMock: { width: '100%', height: 200, backgroundColor: T.surface, borderRadius: 8, marginBottom: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  navBtns: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  navBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border, borderRadius: 8, backgroundColor: T.surface },
  navBtnText: { fontSize: 13, color: T.main, fontWeight: '400' },
  transportBox: { marginTop: 8 },
  transportRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  transportIcon: { fontSize: 16 },
  transportTitle: { fontSize: 13, fontWeight: '600', color: T.main, marginBottom: 2 },
  transportDesc: { fontSize: 13, color: T.sub, lineHeight: 20, fontWeight: '300' },

  // Guestbook
  guestBookBtn: { marginTop: 16, paddingVertical: 14, backgroundColor: T.accent, borderRadius: 8, alignItems: 'center' },
  guestBookBtnText: { fontSize: 15, color: '#fff', fontWeight: '500' },

  // Accounts
  accordionCard: { borderWidth: 1, borderColor: T.border, borderRadius: 8, overflow: 'hidden', marginBottom: 10, backgroundColor: T.bg },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  accordionTitle: { fontSize: 15, fontWeight: '500', color: T.main },
  chevron: { fontSize: 12, color: T.sub },
  accordionBody: { paddingHorizontal: 16 },
  accountRow: { backgroundColor: T.surface, borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  accountLabel: { fontSize: 13, color: T.sub, marginBottom: 2 },
  accountNum: { fontSize: 16, fontWeight: '600', color: T.main },
  copyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: T.border },
  copyBtnText: { fontSize: 13, color: T.accent, fontWeight: '500' },

  // Footer
  footer: { paddingVertical: 60, alignItems: 'center' },
  footerThank: { fontSize: 24, color: T.accent, fontWeight: '300', fontStyle: 'italic', letterSpacing: 2, marginBottom: 8 },
  footerNames: { fontSize: 14, color: T.sub, fontWeight: '300', letterSpacing: 2, marginBottom: 32 },
  shareBtn: { paddingHorizontal: 32, paddingVertical: 14, borderWidth: 1, borderColor: T.border, borderRadius: 8, backgroundColor: T.surface },
  shareBtnText: { fontSize: 14, color: T.main, fontWeight: '400' },

  // Toast
  toast: { position: 'absolute', left: 24, right: 24, zIndex: 50, alignItems: 'center' },
  toastText: { backgroundColor: 'rgba(74,67,59,0.9)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, fontSize: 14, color: '#fff' },

  // Image Modal
  imageModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageModalClose: { position: 'absolute', right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 999 },
  imageModalImg: { width: '100%', height: '80%' },
});
