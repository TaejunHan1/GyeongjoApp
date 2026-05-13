// src/screens/event/templates/wedding/PhotoBookTemplate.js
// 포토북 에디션 — 앨범형 모바일 청첩장
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  defaultImages,
  formatKoreanDate,
  formatKoreanTime,
  getCategorizedImagesSafe,
} from './WeddingUtils';

const { width: W } = Dimensions.get('window');
const IS_TABLET = W >= 600;
const GALLERY_SPREAD_WIDTH = Math.min(W - 52, 520);
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DECOR = {
  eucalyptusTop: require('../../../../../assets/studio/elements/1-eucalyptus-branch-top-right.png'),
  flowersBottom: require('../../../../../assets/studio/elements/2-white-flowers-bottom-left.png'),
  eucalyptusShort: require('../../../../../assets/studio/elements/3-eucalyptus-single-short.png'),
  peonySingle: require('../../../../../assets/studio/elements/4-white-peony-single.png'),
  peonyCluster: require('../../../../../assets/studio/elements/5-white-peony-cluster.png'),
  babyBreath: require('../../../../../assets/studio/elements/6-babies-breath-small.png'),
  olive: require('../../../../../assets/studio/elements/7-olive-branch.png'),
  lavender: require('../../../../../assets/studio/elements/8-lavender-stems.png'),
  peony: require('../../../../../assets/studio/elements/9-ranunculus-cream.png'),
  leafSmall: require('../../../../../assets/studio/elements/10-single-leaf-small.png'),
  roseBud: require('../../../../../assets/studio/elements/11-rose-bud-dusty.png'),
  magnolia: require('../../../../../assets/studio/elements/12-magnolia-petals.png'),
  greeneryMixed: require('../../../../../assets/studio/elements/16-greenery-mixed-small.png'),
  dividerLeaves: require('../../../../../assets/studio/elements/17-divider-leaves-horizontal.png'),
  dividerFlower: require('../../../../../assets/studio/elements/18-divider-flower-horizontal.png'),
  corner: require('../../../../../assets/studio/elements/19-corner-ornament.png'),
  wave: require('../../../../../assets/studio/elements/20-divider-wave-script.png'),
  plantMotif: require('../../../../../assets/studio/elements/21-motif-minimal-plant.png'),
  whiteArrangement: require('../../../../../assets/studio/elements/28-funeral white flower arrangement.png'),
};

const P = {
  bg: '#F7F3EE',
  deep: '#24211E',
  paper: '#FFFDF9',
  ink: '#24211E',
  sub: '#746B61',
  line: 'rgba(36,33,30,0.14)',
  mist: '#EEE8DF',
  clay: '#9C735E',
};

const getImageSource = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return { uri: img };
  if (img.uri) return { uri: img.uri };
  if (img.publicUrl) return { uri: img.publicUrl };
  if (img.url) return { uri: img.url };
  return img;
};

const formatPhone = (phone) => {
  const d = (phone || '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone || '';
};

function Section({ label, title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{label}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
      <Image source={DECOR.dividerLeaves} style={s.sectionDividerImage} resizeMode="contain" />
      {children}
    </View>
  );
}

export default function PhotoBookTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings }) {
  const insets = useSafeAreaInsets();
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState('');
  const [activeAccount, setActiveAccount] = useState(null);
  const [mapCoord, setMapCoord] = useState(null);
  const [guestBookOpen, setGuestBookOpen] = useState(false);
  const [gbName, setGbName] = useState('');
  const [gbMessage, setGbMessage] = useState('');
  const [guestMessages, setGuestMessages] = useState([
    { name: '친구', message: '두 분의 아름다운 시작을 진심으로 축하합니다.', time: '방금 전' },
    { name: '동료', message: '평생 서로에게 가장 따뜻한 계절이 되어주세요.', time: '1시간 전' },
  ]);

  const groomName = eventData.groomName || eventData.groom_name || '신랑';
  const brideName = eventData.brideName || eventData.bride_name || '신부';
  const ai = eventData.additional_info || {};
  const weddingDate = eventData.date || eventData.event_date;
  const dateInfo = formatKoreanDate(weddingDate);
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';
  const customMessage = eventData.customMessage || eventData.custom_message ||
    '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어가고자 합니다.\n\n소중한 분들의 축복 속에서\n새로운 시작을 함께하고 싶습니다.';

  const calYear = dateInfo?.year || 2026;
  const calMonth = dateInfo?.month || 1;
  const calDay = dateInfo?.day || 1;
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const dateLine = `${calYear}.${String(calMonth).padStart(2, '0')}.${String(calDay).padStart(2, '0')}`;

  const mainImages = safeImages.main?.length ? safeImages.main : defaultImages.slice(0, 2);
  const galleryImages = safeImages.gallery?.length ? safeImages.gallery : defaultImages.slice(2, 10);
  const mainImage = mainImages[0];

  const accounts = {
    groom: [
      { name: groomName, bank: ai.groom_bank_name, number: ai.groom_account_number, contact: eventData.groomContact || eventData.groom_contact },
      { name: eventData.groomFatherName || eventData.groom_father_name || '신랑 아버님', bank: ai.groom_father_bank_name, number: ai.groom_father_account_number, contact: ai.groom_father_contact },
      { name: eventData.groomMotherName || eventData.groom_mother_name || '신랑 어머님', bank: ai.groom_mother_bank_name, number: ai.groom_mother_account_number, contact: ai.groom_mother_contact },
    ].filter(p => p.number || p.contact),
    bride: [
      { name: brideName, bank: ai.bride_bank_name, number: ai.bride_account_number, contact: eventData.brideContact || eventData.bride_contact },
      { name: eventData.brideFatherName || eventData.bride_father_name || '신부 아버님', bank: ai.bride_father_bank_name, number: ai.bride_father_account_number, contact: ai.bride_father_contact },
      { name: eventData.brideMotherName || eventData.bride_mother_name || '신부 어머님', bank: ai.bride_mother_bank_name, number: ai.bride_mother_account_number, contact: ai.bride_mother_contact },
    ].filter(p => p.number || p.contact),
  };
  const hasAnyAccount = accounts.groom.length > 0 || accounts.bride.length > 0;

  useEffect(() => {
    const query = locAddr || locName;
    if (!query) return;
    const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    })
      .then(r => r.json())
      .then(data => {
        const doc = data.documents?.[0];
        if (doc) setMapCoord({ lat: doc.y, lng: doc.x });
      })
      .catch(() => {});
  }, [locAddr, locName]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 1600);
  };

  const copyAccount = async (number) => {
    try {
      await Clipboard.setStringAsync(number);
      showToast('계좌번호가 복사되었습니다');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  const submitGuestbook = () => {
    if (!gbName.trim() || !gbMessage.trim()) {
      showToast('이름과 메시지를 입력해주세요');
      return;
    }
    setGuestMessages(prev => [{ name: gbName.trim(), message: gbMessage.trim(), time: '방금 전' }, ...prev]);
    setGbName('');
    setGbMessage('');
    setGuestBookOpen(false);
    showToast('축하 메시지가 등록되었습니다');
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 76 }}>
        <View style={[s.hero, { paddingTop: insets.top + 24 }]}>
          <Text style={s.coverLabel}>ARCHIVE NO. 01</Text>
          <TouchableOpacity activeOpacity={0.92} onPress={() => setSelectedImage(getImageSource(mainImage))} style={s.coverPhotoCard}>
            <Image source={getImageSource(mainImage)} style={s.coverPhoto} resizeMode="cover" />
          </TouchableOpacity>
          <View style={s.coverMeta}>
            <Text style={s.coverNames}>{groomName} & {brideName}</Text>
            <Text style={s.coverDate}>{dateLine}</Text>
          </View>
        </View>

        <Section label="Invitation" title="초대합니다">
          <View style={s.invitationPanel}>
            <Image source={DECOR.eucalyptusTop} style={s.invitationTopDecor} resizeMode="contain" />
            <Image source={DECOR.flowersBottom} style={s.invitationBottomDecor} resizeMode="contain" />
            <Text style={s.invitationText}>{customMessage}</Text>
            <View style={s.signatureRow}>
              <Text style={s.signatureName}>{groomName}</Text>
              <Text style={s.signatureDot}>·</Text>
              <Text style={s.signatureName}>{brideName}</Text>
            </View>
          </View>
        </Section>

        {weddingDate && (
          <Section label="Wedding Day" title="결혼식 일정">
            <View style={s.datePanel}>
              <Image source={DECOR.corner} style={s.dateCornerDecor} resizeMode="contain" />
              <Image source={DECOR.babyBreath} style={s.dateFlowerDecor} resizeMode="contain" />
              <View style={s.dateSummary}>
                <Text style={s.dateFullText}>{dateLine}</Text>
                <View style={s.dateInfoRow}>
                  <Text style={s.dateInfoText}>{timeStr}</Text>
                  {locName ? <Text style={s.dateInfoDot}>·</Text> : null}
                  {locName ? <Text style={s.dateInfoText}>{locName}</Text> : null}
                </View>
              </View>
              <View style={s.calendar}>
                <View style={s.calendarHeader}>
                  {DAYS.map((d, i) => <Text key={`${d}${i}`} style={s.calendarHeaderText}>{d}</Text>)}
                </View>
                <View style={s.calendarGrid}>
                  {Array.from({ length: firstDow }).map((_, i) => <View key={`e${i}`} style={s.calendarCell} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const selected = day === calDay;
                    return (
                      <View key={day} style={s.calendarCell}>
                        <View style={selected ? s.selectedDay : null}>
                          <Text style={[s.calendarDay, selected && s.selectedDayText]}>{day}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </Section>
        )}

        {galleryImages.length > 0 && (
          <Section label="Gallery" title="사진첩">
            <View style={s.galleryPlainGrid}>
              {galleryImages.slice(0, 12).map((img, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.9}
                  style={s.galleryPlainTile}
                  onPress={() => setSelectedImage(getImageSource(img))}
                >
                  <Image source={getImageSource(img)} style={s.fill} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          </Section>
        )}

        {locName ? (
          <Section label="Location" title="오시는 길">
            <View style={s.locationCard}>
              <Text style={s.locationName}>{locName}</Text>
              {locAddr ? <Text style={s.locationAddr}>{locAddr}</Text> : null}
            </View>
            <View style={s.mapBox}>
              {mapCoord ? (
                <WebView
                  source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#E8EDF0}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              ) : (
                <Text style={s.mapLoading}>지도를 불러오는 중...</Text>
              )}
            </View>
            <View style={s.navRow}>
              <TouchableOpacity style={s.navButton} onPress={() => mapCoord ? Linking.openURL(`nmap://place?lat=${mapCoord.lat}&lng=${mapCoord.lng}&name=${encodeURIComponent(locName)}&appname=wedding`) : showToast('좌표 정보가 없습니다')}>
                <Text style={s.navButtonText}>네이버 지도</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.navButton} onPress={() => mapCoord ? Linking.openURL(`kakaomap://look?p=${mapCoord.lat},${mapCoord.lng}`) : showToast('좌표 정보가 없습니다')}>
                <Text style={s.navButtonText}>카카오맵</Text>
              </TouchableOpacity>
            </View>
          </Section>
        ) : null}

        {hasAnyAccount && (
          <Section label="Gift" title="마음 전하기">
            {['groom', 'bride'].map(side => {
              const list = accounts[side];
              if (!list.length) return null;
              const open = activeAccount === side;
              return (
                <View key={side} style={s.accountCard}>
                  <TouchableOpacity style={s.accountHeader} onPress={() => setActiveAccount(open ? null : side)}>
                    <Text style={s.accountTitle}>{side === 'groom' ? '신랑측 계좌' : '신부측 계좌'}</Text>
                    <Text style={s.accountChevron}>{open ? '닫기' : '보기'}</Text>
                  </TouchableOpacity>
                  {open && list.map((p, idx) => (
                    <View key={idx} style={s.personCard}>
                      <Text style={s.personName}>{p.name}</Text>
                      {p.number ? (
                        <TouchableOpacity style={s.personRow} onPress={() => copyAccount(p.number)}>
                          <Text style={s.personText}>{p.bank} {p.number}</Text>
                          <Text style={s.personAction}>복사</Text>
                        </TouchableOpacity>
                      ) : null}
                      {p.contact ? (
                        <TouchableOpacity style={s.personRow} onPress={() => Linking.openURL(`tel:${String(p.contact).replace(/\D/g, '')}`)}>
                          <Text style={s.personText}>{formatPhone(p.contact)}</Text>
                          <Text style={s.personAction}>전화</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </View>
              );
            })}
          </Section>
        )}

        {allowMessages && (
          <Section label="Messages" title="축하 메시지">
            {guestMessages.map((msg, i) => (
              <View key={i} style={s.chatCard}>
                <View style={s.chatHeader}>
                  <Text style={s.chatName}>{msg.name}</Text>
                  <Text style={s.chatTime}>{msg.time}</Text>
                </View>
                <Text style={s.chatMessage}>{msg.message}</Text>
              </View>
            ))}
            <TouchableOpacity style={s.chatButton} onPress={() => setGuestBookOpen(true)}>
              <Text style={s.chatButtonText}>축하 메시지 남기기</Text>
            </TouchableOpacity>
          </Section>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>{groomName} & {brideName}</Text>
        </View>
      </ScrollView>

      {!!toast && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={s.imageModal}>
          <TouchableOpacity style={[s.imageModalClose, { top: insets.top + 16 }]} onPress={() => setSelectedImage(null)}>
            <Text style={s.imageModalCloseText}>닫기</Text>
          </TouchableOpacity>
          {selectedImage && <Image source={selectedImage} style={s.imageModalImg} resizeMode="contain" />}
        </View>
      </Modal>

      <Modal visible={guestBookOpen} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
          <TouchableOpacity style={s.modalDim} activeOpacity={1} onPress={() => setGuestBookOpen(false)} />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>MESSAGE</Text>
            <TextInput value={gbName} onChangeText={setGbName} placeholder="이름" placeholderTextColor="#9B958C" style={s.input} />
            <TextInput
              value={gbMessage}
              onChangeText={setGbMessage}
              placeholder={messageSettings?.placeholder || '축하 메시지를 입력해주세요'}
              placeholderTextColor="#9B958C"
              style={[s.input, s.textarea]}
              multiline
            />
            <TouchableOpacity style={s.submitButton} onPress={submitGuestbook}>
              <Text style={s.submitButtonText}>전송</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  fill: { width: '100%', height: '100%' },
  hero: { paddingHorizontal: 24, paddingBottom: 46, backgroundColor: P.bg },
  coverLabel: { color: P.clay, fontSize: 10, letterSpacing: 3.2, textAlign: 'center', marginBottom: 18, fontWeight: '800' },
  coverPhotoCard: {
    width: '100%',
    height: Math.min(W * 1.16, 520),
    backgroundColor: P.paper,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(36,33,30,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  coverPhoto: { width: '100%', height: '100%' },
  coverMeta: { alignItems: 'center', paddingTop: 22 },
  coverNames: { color: P.deep, fontSize: 30, fontWeight: '300', lineHeight: 38, textAlign: 'center' },
  coverDate: { color: P.clay, fontSize: 12, letterSpacing: 2.2, marginTop: 8, fontWeight: '700' },
  section: { paddingHorizontal: 26, paddingVertical: 24 },
  sectionLabel: { color: P.clay, fontSize: 10, letterSpacing: 2.8, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  sectionTitle: { color: P.deep, fontSize: 25, fontWeight: '300', textAlign: 'center', marginTop: 3 },
  sectionDividerImage: { width: 340, height: 112, alignSelf: 'center', marginTop: -26, marginBottom: -30, opacity: 1 },
  invitationPanel: {
    minHeight: IS_TABLET ? 330 : 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: P.paper,
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: IS_TABLET ? 70 : 34,
    paddingVertical: 42,
    overflow: 'hidden',
  },
  invitationTopDecor: {
    position: 'absolute',
    width: IS_TABLET ? 210 : 160,
    height: IS_TABLET ? 140 : 108,
    right: -34,
    top: -28,
    opacity: 0.62,
  },
  invitationBottomDecor: {
    position: 'absolute',
    width: IS_TABLET ? 220 : 166,
    height: IS_TABLET ? 146 : 112,
    left: -42,
    bottom: -28,
    opacity: 0.58,
  },
  invitationText: { width: '100%', color: P.sub, fontSize: 15, lineHeight: 31, textAlign: 'center' },
  signatureRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28 },
  signatureName: { color: P.deep, fontSize: 16, fontWeight: '500' },
  signatureDot: { color: P.clay, fontSize: 16 },
  datePanel: {
    backgroundColor: P.paper,
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: IS_TABLET ? 58 : 26,
    paddingVertical: 34,
    overflow: 'hidden',
  },
  dateCornerDecor: {
    position: 'absolute',
    width: 92,
    height: 92,
    right: -30,
    top: -28,
    opacity: 0.38,
  },
  dateFlowerDecor: {
    position: 'absolute',
    width: 118,
    height: 118,
    left: -44,
    bottom: -44,
    opacity: 0.34,
  },
  dateSummary: { alignItems: 'center', paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: P.line },
  dateFullText: { color: P.deep, fontSize: 28, lineHeight: 34, fontWeight: '300', letterSpacing: 1.8, textAlign: 'center' },
  dateInfoRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10, paddingHorizontal: 4 },
  dateInfoText: { color: P.sub, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  dateInfoDot: { color: P.clay, fontSize: 13, lineHeight: 20 },
  calendar: { width: '100%', marginTop: 24 },
  calendarHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: P.line, paddingBottom: 9, marginBottom: 8 },
  calendarHeaderText: { flex: 1, color: P.clay, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: `${100 / 7}%`, height: 34, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { color: P.deep, fontSize: 12 },
  selectedDay: { width: 30, height: 30, borderRadius: 15, backgroundColor: P.deep, alignItems: 'center', justifyContent: 'center' },
  selectedDayText: { color: P.paper, fontWeight: '800' },
  galleryPlainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryPlainTile: {
    width: (W - 60) / 2,
    height: (W - 60) / 2,
    backgroundColor: P.mist,
    overflow: 'hidden',
  },
  galleryScrollerWrap: { position: 'relative' },
  galleryRail: { paddingRight: 26, paddingBottom: 8 },
  gallerySpread: {
    width: GALLERY_SPREAD_WIDTH,
    backgroundColor: P.paper,
    padding: 16,
    marginRight: 14,
    borderWidth: 1,
    borderColor: P.line,
    overflow: 'hidden',
  },
  galleryArrangementDecor: {
    position: 'absolute',
    width: 190,
    height: 252,
    left: '50%',
    bottom: -122,
    marginLeft: -95,
    opacity: 0.30,
  },
  galleryOliveDecor: {
    position: 'absolute',
    width: 178,
    height: 118,
    right: -58,
    top: -34,
    opacity: 0.54,
    transform: [{ rotate: '-14deg' }],
  },
  galleryRoseDecor: {
    position: 'absolute',
    width: 108,
    height: 108,
    left: -34,
    bottom: -30,
    opacity: 0.54,
  },
  galleryEucalyptusDecor: {
    position: 'absolute',
    width: 126,
    height: 126,
    left: -38,
    top: 34,
    opacity: 0.24,
    transform: [{ rotate: '-28deg' }],
  },
  galleryMagnoliaDecor: {
    position: 'absolute',
    width: 132,
    height: 132,
    right: -26,
    bottom: 36,
    opacity: 0.44,
  },
  galleryPlantDecor: {
    position: 'absolute',
    width: 116,
    height: 84,
    left: 84,
    bottom: -30,
    opacity: 0.22,
  },
  galleryPeonySingleDecor: {
    position: 'absolute',
    width: 92,
    height: 92,
    left: 10,
    top: -30,
    opacity: 0.42,
  },
  galleryRanunculusDecor: {
    position: 'absolute',
    width: 98,
    height: 98,
    right: 56,
    bottom: -40,
    opacity: 0.36,
  },
  galleryLeavesDecor: {
    position: 'absolute',
    width: 180,
    height: 70,
    left: '50%',
    top: 50,
    marginLeft: -90,
    opacity: 0.24,
  },
  gallerySpreadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 10, zIndex: 2 },
  gallerySpreadNo: { color: P.clay, fontSize: 10, letterSpacing: 1.8, fontWeight: '900' },
  gallerySpreadMeta: { color: P.sub, fontSize: 10, letterSpacing: 0.8, marginTop: 4, lineHeight: 15 },
  galleryMosaic: {
    height: IS_TABLET ? 430 : 342,
    position: 'relative',
    zIndex: 2,
  },
  galleryMosaicTile: {
    position: 'absolute',
    backgroundColor: P.paper,
    padding: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,33,30,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  galleryMosaicMain: { left: 0, top: 4, width: '52%', height: IS_TABLET ? 278 : 218 },
  galleryMosaicSideTop: { right: 0, top: 4, width: '43%', height: IS_TABLET ? 132 : 104 },
  galleryMosaicSideBottom: { right: 0, top: IS_TABLET ? 150 : 118, width: '43%', height: IS_TABLET ? 132 : 104 },
  galleryMosaicWide: { left: 0, right: 0, bottom: 0, width: '100%', height: IS_TABLET ? 130 : 104 },
  galleryPhotoNo: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    color: '#fff',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gallerySwipeHintBottom: {
    marginTop: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(36,33,30,0.82)',
    borderRadius: 999,
    zIndex: 3,
  },
  gallerySwipeHintBottomText: { color: P.paper, fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  gallerySwipeSideArrow: { color: P.paper, fontSize: 19, lineHeight: 19, fontWeight: '300' },
  gallerySwipeFloat: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -22,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(36,33,30,0.84)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,253,249,0.55)',
  },
  gallerySwipeFloatArrow: { color: '#FFFDF9', fontSize: 38, lineHeight: 40, fontWeight: '200' },
  locationCard: { backgroundColor: P.paper, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: P.line, overflow: 'hidden' },
  locationName: { color: P.deep, fontSize: 20, lineHeight: 28, fontWeight: '400', textAlign: 'center' },
  locationAddr: { color: P.sub, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  mapBox: { height: 220, marginTop: 14, backgroundColor: P.paper, overflow: 'hidden' },
  mapLoading: { color: P.sub, textAlign: 'center', marginTop: 98 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  navButton: { flex: 1, backgroundColor: P.deep, paddingVertical: 13, alignItems: 'center' },
  navButtonText: { color: P.paper, fontSize: 12, fontWeight: '700' },
  accountCard: { backgroundColor: P.paper, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(36,48,56,0.08)' },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  accountTitle: { color: P.deep, fontSize: 15, fontWeight: '700' },
  accountChevron: { color: P.clay, fontSize: 12, fontWeight: '700' },
  personCard: { borderTopWidth: 1, borderTopColor: P.line, padding: 14 },
  personName: { color: P.deep, fontSize: 14, marginBottom: 8, fontWeight: '700' },
  personRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 6 },
  personText: { flex: 1, color: P.sub, fontSize: 13, lineHeight: 19 },
  personAction: { color: P.clay, fontSize: 12, fontWeight: '800' },
  chatCard: { backgroundColor: P.paper, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(36,48,56,0.08)' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chatName: { color: P.deep, fontSize: 14, fontWeight: '700' },
  chatTime: { color: P.sub, fontSize: 12 },
  chatMessage: { color: P.sub, fontSize: 14, lineHeight: 22 },
  chatButton: { marginTop: 14, backgroundColor: P.deep, paddingVertical: 15, alignItems: 'center' },
  chatButtonText: { color: P.paper, fontSize: 14, fontWeight: '800' },
  footer: { paddingVertical: 58, alignItems: 'center' },
  footerText: { color: P.sub, fontSize: 13, letterSpacing: 2 },
  toast: { position: 'absolute', left: 24, right: 24, bottom: 34, padding: 14, backgroundColor: 'rgba(34,33,30,0.9)', zIndex: 50 },
  toastText: { color: P.paper, textAlign: 'center', fontWeight: '700' },
  imageModal: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  imageModalClose: { position: 'absolute', right: 16, zIndex: 10, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  imageModalCloseText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  imageModalImg: { width: '100%', height: '82%' },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { backgroundColor: P.paper, padding: 24, gap: 12 },
  modalTitle: { color: P.ink, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  input: { borderWidth: 1, borderColor: P.line, color: P.ink, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  submitButton: { backgroundColor: P.ink, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { color: P.paper, fontSize: 15, fontWeight: '800' },
});
