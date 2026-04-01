import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Animated, StyleSheet, Dimensions, Modal, Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getCategorizedImagesSafe,
  useCountdown,
  formatKoreanDate,
  formatKoreanTime,
} from './WeddingUtils';

const { width } = Dimensions.get('window');

// -- Theme --
const T = {
  bg: '#fff',
  main: '#111',
  sub: '#888',
  accent: '#111',
  surface: '#F7F7F7',
  border: '#EEE',
};

// ======================================================================
export default function EditorialMagazineTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings }) {
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

  // -- Build hero date typography --
  let heroMonth = '';
  let heroDay = '';
  if (dateInfo) {
    heroMonth = String(dateInfo.month || '').padStart(2, '0');
    heroDay = String(dateInfo.day || '').padStart(2, '0');
  }

  // -- Kakao coord --
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);

  useEffect(() => {
    const query = locAddr || locName;
    if (!query) return;
    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    })
      .then(r => r.json())
      .then(data => {
        const doc = data.documents?.[0];
        if (doc) {
          setMapCoord({ lat: doc.y, lng: doc.x });
        } else if (locAddr) {
          return fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(locAddr)}`, {
            headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
          }).then(r2 => r2.json()).then(d2 => {
            const doc2 = d2.documents?.[0];
            if (doc2) setMapCoord({ lat: doc2.y, lng: doc2.x });
          });
        }
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={st.hero}>
          {/* Big date typography - month and day on separate lines */}
          <View style={st.heroDateTypo}>
            <Text style={st.heroDateBig}>{heroMonth}.</Text>
            <Text style={st.heroDateSub}>{heroDay}</Text>
          </View>
          {/* Photo right-aligned */}
          <View style={st.heroImageWrap}>
            {mainImages.map((img, i) => (
              <Animated.Image
                key={i}
                source={img}
                style={[st.heroImage, i > 0 && StyleSheet.absoluteFill, { opacity: heroAnims[i] }]}
                resizeMode="cover"
              />
            ))}
          </View>
          <View style={st.heroBottom}>
            <Text style={st.heroNames}>
              <Text style={st.heroNameBold}>{groomName}</Text>
              <Text style={st.heroNameAnd}> and </Text>
              <Text style={st.heroNameBold}>{brideName}</Text>
            </Text>
            <Text style={st.heroMarried}>WE ARE GETTING MARRIED</Text>
          </View>
        </View>

        {/* ── Greeting ── */}
        <View style={st.section}>
          <Text style={st.sectionLabel}>INVITATION</Text>
          <View style={st.labelLine} />
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
          <View style={st.contactSection}>
            <View style={st.contactRow}>
              <TouchableOpacity style={st.contactCard} activeOpacity={0.8}
                onPress={() => {
                  const phone = eventData.groomContact || eventData.groom_contact;
                  phone ? Linking.openURL(`tel:${phone}`) : showToast('연락처가 등록되지 않았습니다');
                }}>
                <Text style={st.contactIcon}>📞</Text>
                <Text style={st.contactCardText}>신랑에게 연락</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.contactCard} activeOpacity={0.8}
                onPress={() => {
                  const phone = eventData.brideContact || eventData.bride_contact;
                  phone ? Linking.openURL(`tel:${phone}`) : showToast('연락처가 등록되지 않았습니다');
                }}>
                <Text style={st.contactIcon}>📞</Text>
                <Text style={st.contactCardText}>신부에게 연락</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Calendar ── */}
        {weddingDate && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>{'D   A   T   E'}</Text>
            <View style={st.labelLine} />
            <Text style={st.calDateFull}>{dateStr} {timeStr}</Text>
            <Text style={st.calBigMonth}>{String(calMonth).padStart(2, '0')} / {calYear}</Text>
            <View style={st.calRow}>
              {calDays.map((d, i) => (
                <Text key={i} style={[st.calDayLabel, (i === 0 || i === 6) && { color: '#D4828F' }]}>{d}</Text>
              ))}
            </View>
            <View style={st.calGrid}>
              {Array.from({ length: firstDow }).map((_, i) => (
                <View key={`e${i}`} style={st.calCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isWedding = day === calDay;
                const dow = (firstDow + i) % 7;
                const isSunday = dow === 0;
                return (
                  <View key={i} style={st.calCell}>
                    <View style={[st.calDayCircle, isWedding && st.calDayCircleActive]}>
                      <Text style={[st.calDayText, isSunday && !isWedding && { color: '#D4828F' }, isWedding && st.calDayTextActive]}>{day}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            {dDayText && (
              <Text style={st.calDday}>{dDayText}</Text>
            )}
          </View>
        )}

        {/* ── Gallery ── */}
        {galleryImages.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>GALLERY</Text>
            <View style={st.labelLine} />
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
            <View style={st.labelLine} />
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
                <Text style={{ fontSize: 14, color: T.sub }}>지도를 불러오는 중...</Text>
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
            <Text style={st.sectionLabel}>{'G   U   E   S   T   B   O   O   K'}</Text>
            <View style={st.labelLine} />
            <Text style={st.gbSubtitle}>축하의 메시지를 남겨주세요</Text>
            {[
              { name: '이정민', date: '2026.09.15', message: '두 분 너무 잘 어울려요. 결혼 진심으로 축하합니다! 늘 행복하고 예쁘게 사세요 🤍' },
              { name: '박수진', date: '2026.09.16', message: '서아아아앙 결혼 너무 축하해!! 웰컴투 유부월드!! 식날 예쁜 모습으로 보자!!' },
            ].map((msg, i) => (
              <View key={i} style={st.gbCard}>
                <View style={st.gbCardBorder} />
                <View style={st.gbCardContent}>
                  <View style={st.gbCardHeader}>
                    <Text style={st.gbCardName}>{msg.name}</Text>
                    <Text style={st.gbCardDate}>{msg.date}</Text>
                  </View>
                  <Text style={st.gbCardMessage}>{msg.message}</Text>
                </View>
              </View>
            ))}
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
            <View style={st.labelLine} />
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
          <View style={st.footerLine} />
          <Text style={st.footerNames}>{groomName} & {brideName}</Text>
          <Text style={st.footerDate}>{dateStr}</Text>
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
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Hero - editorial magazine style
  hero: { paddingTop: 48, paddingBottom: 40, backgroundColor: T.bg },
  heroDateTypo: { paddingLeft: 24, marginBottom: 16 },
  heroDateBig: { fontSize: 76, fontWeight: '900', color: T.main, letterSpacing: -3, lineHeight: 80 },
  heroDateSub: { fontSize: 76, fontWeight: '900', color: T.sub, letterSpacing: -3, lineHeight: 80, marginLeft: 20 },
  heroImageWrap: { width: '85%', aspectRatio: 3 / 4, alignSelf: 'flex-end', overflow: 'hidden', marginBottom: 24 },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroBottom: { paddingHorizontal: 24 },
  heroNames: { fontSize: 18, fontWeight: '300', color: T.main, letterSpacing: 4, marginBottom: 6 },
  heroNameBold: { fontWeight: '700', color: T.main },
  heroNameAnd: { fontWeight: '300', color: T.sub },
  heroMarried: { fontSize: 11, color: T.sub, letterSpacing: 6, fontWeight: '500' },

  // Section
  section: { paddingHorizontal: 24, paddingVertical: 56, borderBottomWidth: 1, borderBottomColor: T.border },
  sectionLabel: { fontSize: 10, color: T.sub, letterSpacing: 6, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
  labelLine: { width: 32, height: 1, backgroundColor: T.main, alignSelf: 'center', marginBottom: 36 },

  // Greeting
  greetingText: { fontSize: 15, lineHeight: 30, color: T.sub, textAlign: 'center', marginBottom: 36, fontWeight: '300' },
  parentsBox: { alignItems: 'center' },
  parentsText: { fontSize: 14, color: T.main, textAlign: 'center', lineHeight: 24 },
  parentsRole: { color: T.sub, fontWeight: '300' },
  parentsChild: { fontWeight: '700', color: T.main },

  // Contact
  contactSection: { backgroundColor: T.surface, paddingVertical: 32, paddingHorizontal: 24 },
  contactRow: { flexDirection: 'row', gap: 12 },
  contactCard: { flex: 1, backgroundColor: '#fff', paddingVertical: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  contactIcon: { fontSize: 20, marginBottom: 8 },
  contactCardText: { fontSize: 13, color: T.main, fontWeight: '500', letterSpacing: 1 },

  // Calendar
  calDateFull: { fontSize: 14, color: T.sub, textAlign: 'center', marginBottom: 20, fontWeight: '300', letterSpacing: 1 },
  calBigMonth: { fontSize: 32, color: T.main, textAlign: 'center', marginBottom: 28, fontWeight: '800', letterSpacing: 2 },
  calRow: { flexDirection: 'row', marginBottom: 8 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: T.sub, fontWeight: '600', letterSpacing: 1 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 6 },
  calDayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calDayCircleActive: { backgroundColor: T.main },
  calDayText: { fontSize: 13, color: T.main, fontWeight: '300' },
  calDayTextActive: { color: '#fff', fontWeight: '700' },
  calDday: { textAlign: 'center', fontSize: 28, color: T.main, marginTop: 24, fontWeight: '900', letterSpacing: -1 },

  // Gallery
  galleryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  galleryTall: { width: width - 48, height: 420, borderRadius: 0 },
  galleryHalf: { width: '100%', height: 200, borderRadius: 0 },
  galleryWide: { width: width - 48, height: 220, borderRadius: 0 },
  morePhotosBtn: { marginTop: 20, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: T.main },
  morePhotosBtnText: { fontSize: 12, color: T.main, fontWeight: '600', letterSpacing: 2 },

  // Location
  locName: { fontSize: 18, fontWeight: '600', color: T.main, textAlign: 'center', marginBottom: 4, letterSpacing: 1 },
  locAddr: { fontSize: 13, color: T.sub, textAlign: 'center', marginBottom: 24, fontWeight: '300' },
  mapContainer: { width: '100%', height: 200, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: T.border },
  mapMock: { width: '100%', height: 200, backgroundColor: T.surface, marginBottom: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  navBtns: { flexDirection: 'row', gap: 0, marginBottom: 20 },
  navBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border, backgroundColor: T.bg },
  navBtnText: { fontSize: 12, color: T.main, fontWeight: '500', letterSpacing: 1 },
  transportBox: { marginTop: 8 },
  transportRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  transportIcon: { fontSize: 16 },
  transportTitle: { fontSize: 12, fontWeight: '700', color: T.main, marginBottom: 2, letterSpacing: 1 },
  transportDesc: { fontSize: 13, color: T.sub, lineHeight: 20, fontWeight: '300' },

  // Guestbook
  gbSubtitle: { fontSize: 14, color: T.sub, textAlign: 'center', marginBottom: 28, fontWeight: '300' },
  gbCard: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 12, borderWidth: 1, borderColor: T.border },
  gbCardBorder: { width: 4, backgroundColor: '#ccc' },
  gbCardContent: { flex: 1, padding: 16 },
  gbCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  gbCardName: { fontSize: 14, fontWeight: '700', color: T.main },
  gbCardDate: { fontSize: 11, color: T.sub, fontWeight: '300' },
  gbCardMessage: { fontSize: 13, color: T.sub, lineHeight: 20, fontWeight: '300' },
  guestBookBtn: { marginTop: 16, paddingVertical: 16, backgroundColor: T.main, alignItems: 'center' },
  guestBookBtnText: { fontSize: 13, color: '#fff', fontWeight: '600', letterSpacing: 2 },

  // Accounts
  accordionCard: { borderWidth: 1, borderColor: T.border, overflow: 'hidden', marginBottom: 8, backgroundColor: T.bg },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  accordionTitle: { fontSize: 14, fontWeight: '600', color: T.main, letterSpacing: 1 },
  chevron: { fontSize: 11, color: T.sub },
  accordionBody: { paddingHorizontal: 16 },
  accountRow: { backgroundColor: T.surface, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  accountLabel: { fontSize: 12, color: T.sub, marginBottom: 2 },
  accountNum: { fontSize: 16, fontWeight: '700', color: T.main, letterSpacing: 0.5 },
  copyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: T.main },
  copyBtnText: { fontSize: 11, color: T.main, fontWeight: '700', letterSpacing: 1 },

  // Footer
  footer: { paddingVertical: 64, alignItems: 'center' },
  footerLine: { width: 1, height: 40, backgroundColor: T.main, marginBottom: 24 },
  footerNames: { fontSize: 16, color: T.main, fontWeight: '300', letterSpacing: 4, marginBottom: 4 },
  footerDate: { fontSize: 12, color: T.sub, letterSpacing: 2, marginBottom: 36 },
  shareBtn: { paddingHorizontal: 36, paddingVertical: 14, borderWidth: 1, borderColor: T.main },
  shareBtnText: { fontSize: 12, color: T.main, fontWeight: '600', letterSpacing: 2 },

  // Toast
  toast: { position: 'absolute', left: 24, right: 24, zIndex: 50, alignItems: 'center' },
  toastText: { backgroundColor: 'rgba(17,17,17,0.92)', paddingHorizontal: 24, paddingVertical: 12, fontSize: 14, color: '#fff' },

  // Image Modal
  imageModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageModalClose: { position: 'absolute', right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 999 },
  imageModalImg: { width: '100%', height: '80%' },
});
