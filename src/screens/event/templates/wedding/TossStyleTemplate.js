import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Animated, StyleSheet, Dimensions, Modal, Alert, Linking,
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
import { GuestBookMessages } from './WeddingCommonComponents';

const { width, height } = Dimensions.get('window');

// ── 아이콘 ──
const Ic = {
  Phone:  () => <Text style={{ fontSize: 17 }}>📞</Text>,
  Chat:   () => <Text style={{ fontSize: 17 }}>💬</Text>,
  Pin:    () => <Text style={{ fontSize: 14, color: '#8B95A1' }}>📍</Text>,
  Nav:    () => <Text style={{ fontSize: 16 }}>🧭</Text>,
  Share:  () => <Text style={{ fontSize: 22, color: '#4E5968' }}>↗</Text>,
  Check:  () => <Text style={{ fontSize: 16, color: '#3182F6' }}>✓</Text>,
  Heart:  () => <Text style={{ fontSize: 16, color: '#fff' }}>♥</Text>,
  ChevUp: () => <Text style={{ fontSize: 18, color: '#8B95A1' }}>▲</Text>,
  ChevDn: () => <Text style={{ fontSize: 18, color: '#8B95A1' }}>▼</Text>,
};

// ── 공통 섹션 ──
function Section({ children, style }) {
  return <View style={[ts.section, style]}>{children}</View>;
}
function SectionTitle({ children, subtitle }) {
  return (
    <View style={ts.sectionTitleWrap}>
      <Text style={ts.sectionTitle}>{children}</Text>
      {subtitle && <Text style={ts.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}
function ActionBtn({ icon, text, onPress }) {
  return (
    <TouchableOpacity style={ts.actionBtn} onPress={onPress} activeOpacity={0.85}>
      {icon}
      <Text style={ts.actionBtnText}>{text}</Text>
    </TouchableOpacity>
  );
}

// ======================================================================
export default function TossStyleTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings }) {
  const insets = useSafeAreaInsets();
  const [activeAccount, setActiveAccount] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [selectedImage, setSelectedImage] = useState(null);

  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // 사진 유무
  const hasGroomPhoto = categorizedImages?.groom?.length > 0 && typeof categorizedImages.groom[0] !== 'number';
  const hasBridePhoto = categorizedImages?.bride?.length > 0 && typeof categorizedImages.bride[0] !== 'number';

  // 이름
  const groomName = eventData.groomName || eventData.groom_name || '';
  const brideName = eventData.brideName || eventData.bride_name || '';

  // 부모님
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '';

  // 날짜/시간
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const dateStr = dateInfo?.full || '';
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);

  // 장소
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';

  // 카카오 좌표 검색
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);

  useEffect(() => {
    const query = locAddr || locName;
    if (!query) return;

    // 1차: 키워드 검색
    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    })
      .then(r => r.json())
      .then(data => {
        const doc = data.documents?.[0];
        if (doc) {
          setMapCoord({ lat: doc.y, lng: doc.x });
        } else if (locAddr) {
          // 2차: 주소 검색
          return fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(locAddr)}`, {
            headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
          }).then(r => r.json()).then(d2 => {
            const doc2 = d2.documents?.[0];
            if (doc2) setMapCoord({ lat: doc2.y, lng: doc2.x });
          });
        }
      })
      .catch(() => {});
  }, [locAddr, locName]);

  // 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date,
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // 계좌 정보
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

  // 갤러리
  const galleryImages = safeImages.gallery || safeImages.all || [];

  // 토스트
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
      showToast('계좌번호가 복사되었어요');
    } catch { showToast('복사에 실패했습니다'); }
  };

  // 아코디언
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

  const accordionHeight = (anim, count) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(count * 80 + 16, 96)] });

  // 달력
  const calDays = ['일', '월', '화', '수', '목', '금', '토'];
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

  // D-day
  let dDayText = '';
  if (weddingDate) {
    const diff = Math.ceil((new Date(weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff > 0) dDayText = `D-${diff}`;
    else if (diff === 0) dDayText = 'D-Day';
    else dDayText = `D+${Math.abs(diff)}`;
  }

  return (
    <View style={[ts.root, { paddingBottom: insets.bottom }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ── 히어로 ── */}
        <View style={ts.hero}>
          <Image source={safeImages.main?.[0] || safeImages.all?.[0]} style={ts.heroImage} resizeMode="cover" />
          <View style={ts.heroContent}>
            <View style={ts.heroBadge}>
              <Text style={ts.heroBadgeText}>결혼합니다</Text>
            </View>
            <Text style={ts.heroNames}>{groomName} <Text style={ts.heroAnd}>&</Text> {brideName}</Text>
            <Text style={ts.heroDate}>{dateStr} {timeStr}</Text>
            {locName ? <Text style={ts.heroLocation}>{locName}</Text> : null}
          </View>
        </View>

        {/* ── 인사말 ── */}
        <Section style={ts.greetingSection}>
          <SectionTitle subtitle="소중한 분들을 초대합니다">인사말</SectionTitle>
          <Text style={ts.greetingText}>
            {eventData.customMessage || eventData.custom_message ||
              '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n\n저희 두 사람이 사랑의 이름으로\n지켜나갈 수 있게 앞날을\n축복해 주시면 감사하겠습니다.'}
          </Text>
          {(groomFather || groomMother || brideFather || brideMother) && (
            <View style={ts.parentsBox}>
              {(groomFather || groomMother) && (
                <View style={ts.parentsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.parentsName}>{groomFather}{groomFather && groomMother ? ' · ' : ''}{groomMother}</Text>
                    <Text style={ts.parentsRole}>의 아들</Text>
                  </View>
                  <Text style={ts.parentsGroom}>{groomName}</Text>
                </View>
              )}
              {(brideFather || brideMother) && (
                <View style={[ts.parentsRow, (groomFather || groomMother) && { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.parentsName}>{brideFather}{brideFather && brideMother ? ' · ' : ''}{brideMother}</Text>
                    <Text style={ts.parentsRole}>의 딸</Text>
                  </View>
                  <Text style={ts.parentsBride}>{brideName}</Text>
                </View>
              )}
            </View>
          )}
        </Section>

        {/* ── 연락처 ── */}
        <Section>
          <SectionTitle subtitle="축하의 마음을 전해보세요">연락처</SectionTitle>
          {[
            { label: '신랑', name: groomName, phone: eventData.groomContact || eventData.groom_contact, bg: '#eff6ff', color: '#3182F6' },
            { label: '신부', name: brideName, phone: eventData.brideContact || eventData.bride_contact, bg: '#fff0f1', color: '#F04452' },
          ].filter(p => p.name).map(p => (
            <View key={p.label} style={ts.contactCard}>
              <View style={ts.contactLeft}>
                <View style={[ts.contactBadge, { backgroundColor: p.bg }]}>
                  <Text style={[ts.contactBadgeText, { color: p.color }]}>{p.label}</Text>
                </View>
                <Text style={ts.contactName}>{p.name}</Text>
              </View>
              <View style={ts.contactActions}>
                <TouchableOpacity style={ts.iconBtn} onPress={() => p.phone && showToast('전화 앱으로 이동합니다')} activeOpacity={0.8}>
                  <Ic.Phone />
                </TouchableOpacity>
                <TouchableOpacity style={ts.iconBtn} onPress={() => p.phone && showToast('문자 앱으로 이동합니다')} activeOpacity={0.8}>
                  <Ic.Chat />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Section>

        {/* ── 갤러리 ── */}
        {galleryImages.length > 0 && (
          <Section style={{ paddingRight: 0 }}>
            <SectionTitle subtitle="아름다운 순간들">갤러리</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ts.galleryScroll}>
              {galleryImages.map((img, idx) => (
                <TouchableOpacity key={idx} onPress={() => setSelectedImage(img)} activeOpacity={0.92}>
                  <Image source={typeof img === 'string' ? { uri: img } : img} style={ts.galleryThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Section>
        )}

        {/* ── 달력 ── */}
        {weddingDate && (
          <Section>
            <SectionTitle subtitle="잊지 못할 하루">{`${calMonth}월 ${calDay}일`}</SectionTitle>
            <View style={ts.calBox}>
              <Text style={ts.calMonth}>{calYear}. {String(calMonth).padStart(2, '0')}</Text>
              <View style={ts.calRow}>
                {calDays.map(d => (
                  <Text key={d} style={[ts.calDayLabel, d === '일' && ts.calDayLabelSun]}>{d}</Text>
                ))}
              </View>
              <View style={ts.calGrid}>
                {Array.from({ length: firstDow }).map((_, i) => (
                  <View key={`e${i}`} style={ts.calCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isWedding = day === calDay;
                  return (
                    <View key={i} style={ts.calCell}>
                      <View style={[ts.calDayCircle, isWedding && ts.calDayCircleActive]}>
                        <Text style={[ts.calDayText, isWedding && ts.calDayTextActive]}>{day}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              {dDayText && (
                <View style={ts.calFooter}>
                  <Text style={ts.calFooterText}>
                    {groomName}, {brideName}의 결혼식이 <Text style={{ color: '#3182F6', fontWeight: '700' }}>{dDayText}</Text> 남았습니다.
                  </Text>
                </View>
              )}
            </View>
          </Section>
        )}

        {/* ── 장소 ── */}
        {locName && (
          <Section>
            <SectionTitle subtitle="오시는 길">장소 안내</SectionTitle>
            <Text style={ts.locationName}>{locName}</Text>
            {locAddr ? (
              <View style={ts.locationAddrRow}>
                <Ic.Pin />
                <Text style={ts.locationAddr}> {locAddr}</Text>
              </View>
            ) : null}
            {mapCoord ? (
              <View style={ts.mapContainer}>
                <WebView
                  source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              </View>
            ) : (locAddr || locName) ? (
              <View style={ts.mapMock}>
                <Text style={{ fontSize: 14, color: '#8B95A1' }}>지도를 불러오는 중...</Text>
              </View>
            ) : null}
            <View style={ts.navBtns}>
              <ActionBtn icon={<Ic.Nav />} text="네이버지도" onPress={() => showToast('네이버지도로 이동합니다')} />
              <ActionBtn icon={<Ic.Nav />} text="카카오내비" onPress={() => showToast('카카오내비로 이동합니다')} />
              <ActionBtn icon={<Ic.Nav />} text="티맵" onPress={() => showToast('티맵으로 이동합니다')} />
            </View>
          </Section>
        )}

        {/* ── 방명록 ── */}
        {allowMessages && (
          <Section>
            <SectionTitle subtitle="따뜻한 마음을 남겨주세요">축하 메시지</SectionTitle>
            <GuestBookMessages
              messages={[]}
              onAddMessage={() => showToast('미리보기에서는 메시지를 남길 수 없어요')}
              placeholder={messageSettings?.placeholder || '축하 메시지를 입력해주세요'}
            />
          </Section>
        )}

        {/* ── 계좌 ── */}
        {hasAnyAccount && (
          <Section>
            <SectionTitle subtitle="축하의 마음을 전해주세요">마음 전하실 곳</SectionTitle>
            {['groom', 'bride'].map(side => {
              const list = accounts[side];
              if (list.length === 0) return null;
              const anim = side === 'groom' ? groomAnim : brideAnim;
              const h = accordionHeight(anim, list.length);
              return (
                <View key={side} style={ts.accordionCard}>
                  <TouchableOpacity style={ts.accordionHeader} onPress={() => toggleAccount(side)} activeOpacity={0.85}>
                    <Text style={ts.accordionTitle}>{side === 'groom' ? '신랑측 계좌번호' : '신부측 계좌번호'}</Text>
                    {activeAccount === side ? <Ic.ChevUp /> : <Ic.ChevDn />}
                  </TouchableOpacity>
                  <Animated.View style={[ts.accordionBody, { height: h, overflow: 'hidden' }]}>
                    {list.map((acc, idx) => (
                      <View key={idx} style={ts.accountBox}>
                        <View style={{ flex: 1 }}>
                          <Text style={ts.accountBank}>{acc.bank} (예금주: {acc.name})</Text>
                          <Text style={ts.accountNum}>{acc.number}</Text>
                        </View>
                        <TouchableOpacity style={ts.copyBtn} onPress={() => copyToClipboard(acc.number)} activeOpacity={0.85}>
                          <Text style={ts.copyBtnText}>복사</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </Animated.View>
                </View>
              );
            })}
          </Section>
        )}
      </ScrollView>

      {/* ── 하단 바 ── */}
      <View style={[ts.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={ts.shareBtn} onPress={() => showToast('공유 기능 준비 중입니다')} activeOpacity={0.85}>
          <Ic.Share />
        </TouchableOpacity>
        <TouchableOpacity style={ts.msgBtn} onPress={() => showToast('축하 메시지 기능 준비 중입니다')} activeOpacity={0.88}>
          <Text style={ts.msgBtnText}>축하 메시지 남기기</Text>
        </TouchableOpacity>
      </View>

      {/* ── 토스트 ── */}
      {toast.visible && (
        <Animated.View style={[ts.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          top: insets.top + 16,
        }]}>
          <Ic.Check />
          <Text style={ts.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ── 이미지 풀스크린 ── */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={ts.imageModal}>
          <TouchableOpacity style={[ts.imageModalClose, { top: insets.top + 16 }]} onPress={() => setSelectedImage(null)}>
            <Text style={{ fontSize: 22, color: '#fff' }}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={typeof selectedImage === 'string' ? { uri: selectedImage } : selectedImage} style={ts.imageModalImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ======================================================================
const ts = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F4F6' },

  hero: { width: '100%', height: height * 0.8, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroDimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.12)' },
  heroDimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: 'rgba(0,0,0,0.55)' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 32 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  heroBadgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  heroNames: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: -0.5 },
  heroAnd: { fontWeight: '300' },
  heroDate: { fontSize: 18, fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  heroLocation: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },

  section: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 40, marginBottom: 8 },
  greetingSection: { borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, zIndex: 1 },
  sectionTitleWrap: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#191F28', marginBottom: 4 },
  sectionSubtitle: { fontSize: 15, color: '#8B95A1', fontWeight: '500' },

  greetingText: { fontSize: 16, lineHeight: 28, color: '#4E5968', fontWeight: '500', marginBottom: 32 },
  parentsBox: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F2F4F6' },
  parentsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  parentsName: { fontSize: 15, fontWeight: '700', color: '#191F28' },
  parentsRole: { fontSize: 13, color: '#8B95A1', marginTop: 2 },
  parentsGroom: { fontSize: 18, fontWeight: '800', color: '#3182F6' },
  parentsBride: { fontSize: 18, fontWeight: '800', color: '#F04452' },

  contactCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F2F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  contactLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactBadgeText: { fontSize: 13, fontWeight: '700' },
  contactName: { fontSize: 18, fontWeight: '700', color: '#191F28' },
  contactActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, backgroundColor: '#F2F4F6', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  galleryScroll: { paddingRight: 24, gap: 14, paddingBottom: 8 },
  galleryThumb: { width: 192, height: 256, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },

  calBox: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#F2F4F6' },
  calMonth: { fontSize: 18, fontWeight: '700', color: '#191F28', marginBottom: 20 },
  calRow: { flexDirection: 'row', marginBottom: 10 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#8B95A1' },
  calDayLabelSun: { color: '#F04452' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  calDayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calDayCircleActive: { backgroundColor: '#3182F6', shadowColor: '#3182F6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  calDayText: { fontSize: 15, fontWeight: '600', color: '#4E5968' },
  calDayTextActive: { color: '#fff' },
  calFooter: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'center' },
  calFooterText: { fontSize: 15, color: '#4E5968', fontWeight: '500' },

  locationName: { fontSize: 18, fontWeight: '700', color: '#191F28', marginBottom: 6 },
  locationAddrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationAddr: { fontSize: 15, color: '#8B95A1', fontWeight: '500' },
  mapContainer: { width: '100%', height: 192, borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#F2F4F6' },
  mapMock: { width: '100%', height: 192, backgroundColor: '#E5E8EB', borderRadius: 20, marginBottom: 16, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  mapPin: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  mapPinInner: { width: 32, height: 32, backgroundColor: '#3182F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mapLabel: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  mapLabelText: { fontSize: 12, fontWeight: '700', color: '#4E5968' },
  navBtns: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#F2F4F6', paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#4E5968' },

  accordionCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, overflow: 'hidden', marginBottom: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: '#191F28' },
  accordionBody: { paddingHorizontal: 20 },
  accountBox: { backgroundColor: '#F2F4F6', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  accountBank: { fontSize: 13, fontWeight: '600', color: '#4E5968', marginBottom: 4 },
  accountNum: { fontSize: 18, fontWeight: '800', color: '#191F28' },
  copyBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F2F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: '#3182F6' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.92)', borderTopWidth: 1, borderTopColor: '#F2F4F6', paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', gap: 10 },
  shareBtn: { width: 56, height: 56, backgroundColor: '#F2F4F6', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  msgBtn: { flex: 1, height: 56, backgroundColor: '#3182F6', borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#3182F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  msgBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  toast: { position: 'absolute', left: 0, right: 0, zIndex: 50, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  toastText: { backgroundColor: 'rgba(25,31,40,0.9)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999, fontSize: 15, fontWeight: '700', color: '#fff' },

  imageModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageModalClose: { position: 'absolute', right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 999 },
  imageModalImg: { width: '100%', height: '80%' },
});
