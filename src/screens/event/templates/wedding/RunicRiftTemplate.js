// src/screens/event/templates/wedding/RunicRiftTemplate.js
// 웨딩 데이 스크립트 — 포토 커버형 모바일 청첩장
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
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
import LottieLoading from '../../../../components/LottieLoading';
import {
  defaultImages,
  formatKoreanDate,
  formatKoreanTime,
  getCategorizedImagesSafe,
  resolveWeddingMapCoord,
} from './WeddingUtils';
import { PhotoFrameOverlay } from './WeddingCommonComponents';
import { toImageSource } from '../../../../lib/imageUri';

const { width: W, height: H } = Dimensions.get('window');
const IS_TABLET = W >= 768;
const HERO_CARD_HEIGHT = IS_TABLET ? Math.min(H * 0.72, 720) : Math.min(H * 0.7, 620);
const SECTION_DIVIDER = require('../../../../../assets/studio/elements/29-wedding divider champagne floral.png');
const INTRO_TOP_FLORAL = require('../../../../../assets/studio/elements/1-eucalyptus-branch-top-right.png');
const INTRO_BOTTOM_FLORAL = require('../../../../../assets/studio/elements/2-white-flowers-bottom-left.png');
const INTRO_RING_ORNAMENT = require('../../../../../assets/studio/elements/31-wedding ornament rings ribbon.png');
const INTRO_BOUQUET = require('../../../../../assets/studio/elements/32-wedding watercolor bouquet ornament.png');
const INTRO_CAKE = require('../../../../../assets/studio/elements/33-wedding cake champagne ornament.png');
const INTRO_HEELS = require('../../../../../assets/studio/elements/34-wedding bridal heels veil ornament.png');
const INTRO_ENVELOPE = require('../../../../../assets/studio/elements/35-wedding invitation envelope ornament.png');

const C = {
  ink: '#F8F8F5',
  deep: '#ECEDE8',
  panel: '#FFFFFF',
  panel2: '#F1F2ED',
  panel3: '#E4E7DF',
  blue: '#6D7773',
  teal: '#5F8580',
  gold: '#A38E70',
  gold2: '#25241F',
  bronze: '#CFC3B1',
  accent: '#D78646',
  text: '#25241F',
  sub: '#706E67',
  line: 'rgba(37, 36, 31, 0.13)',
  danger: '#9D5A5A',
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const getImageSource = (img) => {
  if (!img) return null;
  if (typeof img === 'number') return img;
  return toImageSource(img) || img;
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
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>{label}</Text>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <Image source={SECTION_DIVIDER} style={s.sectionDividerImage} resizeMode="contain" />
      {children}
    </View>
  );
}

function ClientChrome({ children }) {
  return (
    <View style={s.clientChrome}>
      {children}
    </View>
  );
}

export default function RunicRiftTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings, selectedPhotoFrame, frameAdjusting = false, onPhotoFrameAdjust, isPreviewMode = false }) {
  const insets = useSafeAreaInsets();
  const safeImages = getCategorizedImagesSafe(categorizedImages);

  const [toast, setToast] = useState('');
  const [activeAccount, setActiveAccount] = useState(null);
  const [mapCoord, setMapCoord] = useState(null);
  const [guestBookOpen, setGuestBookOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [introVisible, setIntroVisible] = useState(true);
  const scriptIntroOpacity = useRef(new Animated.Value(1)).current;
  const scriptLineAnim = useRef(new Animated.Value(0)).current;
  const scriptTextAnim = useRef(new Animated.Value(0)).current;
  const scriptHintOpacity = useRef(new Animated.Value(1)).current;
  const [selectedImageGroup, setSelectedImageGroup] = useState('gallery');
  const imageModalScrollRef = useRef(null);
  const imageViewerClosingRef = useRef(false);
  const [gbName, setGbName] = useState('');
  const [gbMessage, setGbMessage] = useState('');
  const [guestMessages, setGuestMessages] = useState([
    { name: '친구', message: '두 분의 결혼을 진심으로 축하합니다. 오래도록 행복하세요.', time: '방금 전' },
    { name: '동료', message: '아름다운 시작을 함께 축복합니다.', time: '1시간 전' },
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
    '서로 다른 길을 걸어온 두 사람이\n이제 하나의 팀이 되어 같은 방향으로 나아갑니다.\n소중한 분들의 축복 속에서\n새로운 여정을 시작하고자 합니다.';

  let calYear = 2026;
  let calMonth = 1;
  let calDay = 1;
  if (dateInfo) {
    calYear = dateInfo.year;
    calMonth = dateInfo.month;
    calDay = dateInfo.day;
  }
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const matchDate = `${calYear} / ${String(calMonth).padStart(2, '0')} / ${String(calDay).padStart(2, '0')}`;

  useEffect(() => {
    if (!introVisible) return undefined;
    scriptLineAnim.setValue(0);
    scriptTextAnim.setValue(0);
    Animated.sequence([
      Animated.delay(220),
      Animated.parallel([
        Animated.timing(scriptLineAnim, {
          toValue: 1,
          duration: 1050,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scriptTextAnim, {
          toValue: 1,
          duration: 820,
          delay: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scriptHintOpacity, { toValue: 0.35, duration: 760, useNativeDriver: true }),
      Animated.timing(scriptHintOpacity, { toValue: 1, duration: 760, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [introVisible, scriptHintOpacity, scriptLineAnim, scriptTextAnim]);

  const openScriptIntro = () => {
    Animated.timing(scriptIntroOpacity, {
      toValue: 0,
      duration: 620,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setIntroVisible(false));
  };

  const mainImages = safeImages.main?.length ? safeImages.main : defaultImages.slice(0, 2);
  const galleryImages = safeImages.gallery?.length ? safeImages.gallery : defaultImages.slice(2, 8);
  const mainImage = mainImages[0];
  const modalImages = selectedImageGroup === 'main' ? mainImages : galleryImages;

  const openImageViewer = (group, index) => {
    imageViewerClosingRef.current = false;
    setSelectedImageGroup(group);
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    imageViewerClosingRef.current = true;
    setSelectedImageIndex(null);
    requestAnimationFrame(() => {
      imageViewerClosingRef.current = false;
    });
  };

  useEffect(() => {
    if (selectedImageIndex === null) return;
    requestAnimationFrame(() => {
      imageModalScrollRef.current?.scrollTo({ x: selectedImageIndex * W, y: 0, animated: false });
    });
  }, [selectedImageIndex]);

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
    const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
    resolveWeddingMapCoord({ locName, locAddr, kakaoKey: KAKAO_KEY })
      .then(coord => {
        if (coord) setMapCoord(coord);
      })
      .catch(() => {});
  }, [locAddr, locName]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 1600);
  };

  const blockPreviewAction = () => {
    showToast('미리보기에서는 사용할 수 없습니다');
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
      <View style={[s.content, { paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={!frameAdjusting} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          <View style={s.hero}>
            <ClientChrome>
              <View style={s.editorialHero}>
                <View style={s.heroPhotoLayer}>
                  <TouchableOpacity
                    style={s.mainPhotoButton}
                    activeOpacity={frameAdjusting ? 1 : 0.92}
                    onPress={frameAdjusting ? undefined : () => openImageViewer('main', 0)}
                  >
                    <Image source={getImageSource(mainImage)} style={s.mainPhoto} resizeMode="cover" />
                    <PhotoFrameOverlay
                      selectedPhotoFrame={selectedPhotoFrame}
                      frameAdjusting={frameAdjusting}
                      onPhotoFrameAdjust={onPhotoFrameAdjust}
                    />
                  </TouchableOpacity>
                </View>
                <View style={s.heroNameCard}>
                  <Text style={s.heroLabel}>Wedding Invitation</Text>
                  <View style={s.heroCoupleRow}>
                    <Text style={s.heroName}>{groomName}</Text>
                    <Text style={s.heroAmpersand}>&</Text>
                    <Text style={s.heroName}>{brideName}</Text>
                  </View>
                </View>
              </View>
            </ClientChrome>
          </View>

          <Section label="INVITATION" title="초대합니다">
            <View style={s.invitationCard}>
              <Text style={s.invitationLead}>저희 두 사람의 시작에 함께해 주세요</Text>
              <Text style={s.invitationText}>{customMessage}</Text>
              <View style={s.signatureRow}>
                <Text style={s.signatureName}>{groomName}</Text>
                <Text style={s.signatureName}>{brideName}</Text>
              </View>
            </View>
          </Section>

          {weddingDate && (
            <Section label="WEDDING DAY" title="결혼식 일정">
              <View style={s.scheduleCard}>
                <Text style={s.dateDisplay}>{matchDate}</Text>
                <Text style={s.timeDisplay}>{timeStr}</Text>
              </View>
              <View style={s.calendar}>
                <View style={s.calendarHeader}>
                  {DAYS.map((d, i) => <Text key={d} style={[s.calendarHeaderText, i === 0 && s.sunday]}>{d}</Text>)}
                </View>
                <View style={s.calendarGrid}>
                  {Array.from({ length: firstDow }).map((_, i) => <View key={`e${i}`} style={s.calendarCell} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const selected = day === calDay;
                    const dow = (firstDow + i) % 7;
                    return (
                      <View key={day} style={s.calendarCell}>
                        <View style={selected ? s.selectedDay : null}>
                          <Text style={[s.calendarDay, dow === 0 && s.sunday, selected && s.selectedDayText]}>{day}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Section>
          )}

          {galleryImages.length > 0 && (
            <Section label="GALLERY" title="웨딩 갤러리">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.galleryRail}>
                {Array.from({ length: Math.ceil(galleryImages.length / 3) }).map((_, col) => (
                  <View key={col} style={s.galleryColumn}>
                    {galleryImages.slice(col * 3, col * 3 + 3).map((img, row) => (
                      <TouchableOpacity
                        key={row}
                        style={s.galleryTile}
                        activeOpacity={0.9}
                        onPress={() => openImageViewer('gallery', col * 3 + row)}
                      >
                        <Image source={getImageSource(img)} style={s.galleryImage} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </Section>
          )}

          {locName ? (
            <Section label="LOCATION" title="오시는 길">
              <View style={s.locationCard}>
                <Text style={s.locationName}>{locName}</Text>
                {locAddr ? <Text style={s.locationAddr}>{locAddr}</Text> : null}
              </View>
              <View style={s.mapBox}>
                {mapCoord ? (
                  <WebView
                    source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#07131F}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                    style={{ flex: 1 }}
                    scrollEnabled={false}
                    javaScriptEnabled
                    originWhitelist={['*']}
                  />
                ) : (
                  <LottieLoading text="지도를 불러오는 중..." size={54} color={C.sub} />
                )}
              </View>
              <View style={s.navRow}>
                <TouchableOpacity style={s.navButton} onPress={() => {
                  if (isPreviewMode) {
                    blockPreviewAction();
                    return;
                  }
                  mapCoord ? Linking.openURL(`nmap://place?lat=${mapCoord.lat}&lng=${mapCoord.lng}&name=${encodeURIComponent(locName)}&appname=wedding`) : showToast('좌표 정보가 없습니다');
                }}>
                  <Text style={s.navButtonText}>네이버 지도</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navButton} onPress={() => {
                  if (isPreviewMode) {
                    blockPreviewAction();
                    return;
                  }
                  mapCoord ? Linking.openURL(`kakaomap://look?p=${mapCoord.lat},${mapCoord.lng}`) : showToast('좌표 정보가 없습니다');
                }}>
                  <Text style={s.navButtonText}>카카오맵</Text>
                </TouchableOpacity>
              </View>
              {eventData.parkingInfo || eventData.parking_info ? (
                <View style={s.parkingCard}>
                  <Text style={s.parkingTitle}>PARKING</Text>
                  <Text style={s.parkingText}>{eventData.parkingInfo || eventData.parking_info}</Text>
                </View>
              ) : null}
            </Section>
          ) : null}

          {hasAnyAccount && (
            <Section label="GIFT" title="마음 전하기">
              {['groom', 'bride'].map(side => {
                const list = accounts[side];
                if (!list.length) return null;
                const open = activeAccount === side;
                return (
                  <View key={side} style={s.accountCard}>
                    <TouchableOpacity style={s.accountHeader} onPress={() => setActiveAccount(open ? null : side)}>
                      <Text style={s.accountTitle}>{side === 'groom' ? '신랑측 보관함' : '신부측 보관함'}</Text>
                      <Text style={s.accountChevron}>{open ? '▲' : '▼'}</Text>
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
            <Section label="MESSAGES" title="축하 메시지">
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
            <Text style={s.footerTitle}>THANK YOU</Text>
            <Text style={s.footerNames}>{groomName} & {brideName}</Text>
          </View>
        </ScrollView>
      </View>

      {!!toast && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}

      <Modal visible={selectedImageIndex !== null} transparent animationType="fade">
        <View style={s.imageModal}>
          <TouchableOpacity style={[s.imageModalClose, { top: insets.top + 16 }]} onPress={closeImageViewer}>
            <Text style={s.imageModalCloseText}>닫기</Text>
          </TouchableOpacity>
          <View style={[s.imageModalCounter, { bottom: insets.bottom + 34 }]}>
            <Text style={s.imageModalCounterText}>
              {Math.min((selectedImageIndex || 0) + 1, modalImages.length)} / {modalImages.length}
            </Text>
          </View>
          <ScrollView
            ref={imageModalScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={s.imageModalScroller}
            contentOffset={{ x: Math.max(selectedImageIndex || 0, 0) * W, y: 0 }}
            onMomentumScrollEnd={(event) => {
              if (imageViewerClosingRef.current || selectedImageIndex === null) return;
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / W);
              setSelectedImageIndex(Math.max(0, Math.min(nextIndex, modalImages.length - 1)));
            }}
          >
            {modalImages.map((img, index) => (
              <View key={index} style={s.imageModalSlide}>
                <Image source={getImageSource(img)} style={s.imageModalImg} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={guestBookOpen} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
          <TouchableOpacity style={s.modalDim} activeOpacity={1} onPress={() => setGuestBookOpen(false)} />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>MESSAGE</Text>
            <TextInput
              value={gbName}
              onChangeText={setGbName}
              placeholder="이름"
              placeholderTextColor="#657A87"
              style={s.input}
            />
            <TextInput
              value={gbMessage}
              onChangeText={setGbMessage}
              placeholder={messageSettings?.placeholder || '축하 메시지를 입력해주세요'}
              placeholderTextColor="#657A87"
              style={[s.input, s.textarea]}
              multiline
            />
            <TouchableOpacity style={s.submitButton} onPress={submitGuestbook}>
              <Text style={s.submitButtonText}>전송</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {introVisible && (
        <Animated.View style={[s.scriptIntroLayer, { opacity: scriptIntroOpacity }]}>
          <TouchableOpacity activeOpacity={0.96} style={s.scriptIntroTouch} onPress={openScriptIntro}>
            <Image source={INTRO_TOP_FLORAL} style={s.scriptIntroTopFloral} resizeMode="contain" />
            <Image source={INTRO_BOTTOM_FLORAL} style={s.scriptIntroBottomFloral} resizeMode="contain" />
            <View style={s.scriptIntroPaper} pointerEvents="none">
              <Image source={INTRO_BOUQUET} style={s.scriptIntroBouquet} resizeMode="contain" />
              <Image source={INTRO_ENVELOPE} style={s.scriptIntroEnvelope} resizeMode="contain" />
              <Image source={INTRO_RING_ORNAMENT} style={s.scriptIntroRing} resizeMode="contain" />
              <Text style={s.scriptIntroLabel}>WEDDING DAY SCRIPT</Text>
              <Animated.Text
                style={[
                  s.scriptIntroTitle,
                  {
                    opacity: scriptTextAnim,
                    transform: [{
                      translateY: scriptTextAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    }],
                  },
                ]}
              >
                Wedding Day
              </Animated.Text>
              <View style={s.scriptIntroLineTrack}>
                <Animated.View
                  style={[
                    s.scriptIntroInkLine,
                    {
                      transform: [{
                        scaleX: scriptLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.02, 1],
                        }),
                      }],
                    },
                  ]}
                />
              </View>
              <Animated.Text style={[s.scriptIntroSubtitle, { opacity: scriptTextAnim }]}>
                우리 두 사람의 가장 아름다운 문장
              </Animated.Text>
              <Animated.View style={[s.scriptIntroNames, { opacity: scriptTextAnim }]}>
                <Text style={s.scriptIntroName}>{groomName}</Text>
                <Text style={s.scriptIntroAmp}>&</Text>
                <Text style={s.scriptIntroName}>{brideName}</Text>
              </Animated.View>
              <Text style={s.scriptIntroDate}>{matchDate}</Text>
              <Image source={INTRO_CAKE} style={s.scriptIntroCake} resizeMode="contain" />
              <Image source={INTRO_HEELS} style={s.scriptIntroHeels} resizeMode="contain" />
            </View>
            <Animated.View style={[s.scriptIntroHintPill, { opacity: scriptHintOpacity }]}>
              <Text style={s.scriptIntroHint}>청첩장 열기</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  content: { flex: 1, backgroundColor: C.ink },
  hero: { backgroundColor: C.ink },
  clientChrome: {
    flex: 1,
    backgroundColor: C.ink,
    paddingTop: 0,
    paddingBottom: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  editorialHero: {
    position: 'relative',
    paddingTop: IS_TABLET ? 34 : 24,
    paddingBottom: 26,
  },
  heroPhotoLayer: {
    width: IS_TABLET ? '72%' : '86%',
    height: HERO_CARD_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.panel,
    alignSelf: 'center',
    padding: 8,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  mainPhotoButton: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden' },
  mainPhoto: { width: '100%', height: '100%', borderRadius: 22 },
  heroNameCard: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 2,
    backgroundColor: 'transparent',
  },
  heroLabel: {
    color: C.sub,
    fontSize: 9,
    letterSpacing: 2.6,
    fontWeight: '600',
    marginBottom: 18,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  heroCoupleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 14,
    flexWrap: 'wrap',
  },
  heroName: {
    color: C.text,
    fontSize: 33,
    fontWeight: '300',
    lineHeight: 40,
    textAlign: 'center',
  },
  heroAmpersand: {
    color: C.gold,
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 28,
    textAlign: 'center',
  },
  section: { paddingHorizontal: 24, paddingVertical: 46, backgroundColor: C.ink },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionLabel: {
    minWidth: 118,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    color: C.text,
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionTitle: { marginTop: 12, color: C.text, textAlign: 'center', fontSize: 25, fontWeight: '300', letterSpacing: 0 },
  sectionDividerImage: {
    width: '112%',
    height: 96,
    alignSelf: 'center',
    marginTop: -30,
    marginBottom: -16,
  },
  invitationCard: {
    marginHorizontal: 4,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: 'transparent',
  },
  invitationLead: {
    color: C.text,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 32,
    marginBottom: 16,
    textAlign: 'center',
  },
  invitationText: { color: C.sub, fontSize: 15, lineHeight: 32, textAlign: 'center' },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 34,
  },
  signatureName: {
    color: C.text,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 1,
  },
  scheduleCard: {
    marginHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 10,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
  },
  dateDisplay: { color: C.gold2, textAlign: 'center', fontSize: 27, fontWeight: '300', letterSpacing: 1.5 },
  timeDisplay: { marginTop: 8, color: C.sub, textAlign: 'center', fontSize: 16, fontWeight: '400' },
  calendar: {
    marginTop: 0,
    marginHorizontal: 6,
    paddingVertical: 18,
    paddingHorizontal: 14,
    backgroundColor: C.panel,
    borderRadius: 18,
  },
  calendarHeader: { flexDirection: 'row', marginBottom: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  calendarHeaderText: { flex: 1, color: C.sub, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { color: C.text, fontSize: 13, fontWeight: '400' },
  sunday: { color: C.danger },
  selectedDay: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center' },
  selectedDayText: { color: C.ink, fontWeight: '900' },
  galleryRail: { paddingHorizontal: 6, paddingRight: 24, gap: 10 },
  galleryColumn: { width: 132, gap: 10 },
  galleryTile: { width: 132, height: 132, overflow: 'hidden', backgroundColor: C.panel2 },
  galleryImage: { width: '100%', height: '100%' },
  locationCard: { marginHorizontal: 6, backgroundColor: C.panel, paddingVertical: 26, paddingHorizontal: 20, alignItems: 'center' },
  locationName: { color: C.text, fontSize: 20, fontWeight: '400', textAlign: 'center', lineHeight: 28 },
  locationAddr: { marginTop: 8, color: C.sub, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  mapBox: { height: 230, marginTop: 12, marginHorizontal: 6, overflow: 'hidden', backgroundColor: C.panel2 },
  mapLoading: { color: C.sub, textAlign: 'center', marginTop: 100 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginHorizontal: 6 },
  navButton: { flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: C.panel },
  navButtonText: { color: C.gold2, fontSize: 12, fontWeight: '500' },
  parkingCard: { marginTop: 12, marginHorizontal: 6, backgroundColor: C.panel, padding: 16 },
  parkingTitle: { color: C.sub, fontSize: 10, letterSpacing: 2, fontWeight: '500', marginBottom: 7 },
  parkingText: { color: C.sub, fontSize: 14, lineHeight: 22 },
  accountCard: { marginHorizontal: 6, backgroundColor: C.panel, marginBottom: 12 },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  accountTitle: { color: C.text, fontSize: 16, fontWeight: '400' },
  accountChevron: { color: C.sub },
  personCard: { borderTopWidth: 1, borderTopColor: 'rgba(207,175,106,0.18)', padding: 14 },
  personName: { color: C.gold2, fontSize: 14, fontWeight: '400', marginBottom: 8 },
  personRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 7 },
  personText: { flex: 1, color: C.sub, fontSize: 13, lineHeight: 19 },
  personAction: { color: C.sub, fontSize: 11, fontWeight: '500' },
  chatCard: { marginHorizontal: 6, backgroundColor: C.panel, padding: 16, marginBottom: 10 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  chatName: { color: C.gold2, fontSize: 14, fontWeight: '400' },
  chatTime: { color: C.sub, fontSize: 12 },
  chatMessage: { color: C.text, fontSize: 14, lineHeight: 22 },
  chatButton: { marginTop: 18, marginHorizontal: 6, backgroundColor: C.text, paddingVertical: 15, alignItems: 'center' },
  chatButtonText: { color: C.ink, fontSize: 15, fontWeight: '500', letterSpacing: 1 },
  footer: { paddingVertical: 70, alignItems: 'center', backgroundColor: C.deep },
  footerTitle: { color: C.gold2, fontSize: 28, fontWeight: '300', letterSpacing: 4 },
  footerNames: { marginTop: 12, color: C.sub, fontSize: 16, letterSpacing: 2 },
  toast: { position: 'absolute', left: 24, right: 24, bottom: 34, padding: 14, backgroundColor: 'rgba(3,10,17,0.92)', borderWidth: 1, borderColor: C.line, zIndex: 50 },
  toastText: { color: C.text, textAlign: 'center', fontWeight: '700' },
  imageModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageModalClose: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  imageModalCloseText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  imageModalCounter: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  imageModalCounterText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  imageModalScroller: { flex: 1 },
  imageModalSlide: { width: W, height: '100%', alignItems: 'center', justifyContent: 'center' },
  imageModalImg: { width: '100%', height: '82%' },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  modalCard: { backgroundColor: C.panel, borderTopWidth: 1, borderTopColor: C.line, padding: 24, gap: 12 },
  modalTitle: { color: C.gold2, fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  input: { borderWidth: 1, borderColor: C.line, color: C.text, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.ink },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  submitButton: { backgroundColor: C.gold, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitButtonText: { color: C.ink, fontSize: 15, fontWeight: '900' },
  scriptIntroLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: '#F7F2EA',
  },
  scriptIntroTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingTop: IS_TABLET ? 34 : 24,
    overflow: 'hidden',
  },
  scriptIntroTopFloral: {
    position: 'absolute',
    top: -72,
    right: -104,
    width: IS_TABLET ? 390 : 340,
    height: IS_TABLET ? 260 : 227,
    opacity: 0.42,
    transform: [{ rotate: '3deg' }],
  },
  scriptIntroBottomFloral: {
    position: 'absolute',
    left: -82,
    bottom: -70,
    width: IS_TABLET ? 390 : 330,
    height: IS_TABLET ? 260 : 220,
    opacity: 0.48,
    transform: [{ rotate: '-2deg' }],
  },
  scriptIntroPaper: {
    width: Math.min(W - 52, 430),
    minHeight: IS_TABLET ? 480 : 405,
    backgroundColor: 'rgba(255,253,248,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(168,139,92,0.2)',
    paddingHorizontal: 30,
    paddingTop: IS_TABLET ? 34 : 26,
    paddingBottom: IS_TABLET ? 50 : 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    shadowColor: '#2B2823',
    shadowOpacity: 0.11,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
    elevation: 5,
  },
  scriptIntroBouquet: {
    position: 'absolute',
    top: -46,
    left: -42,
    width: IS_TABLET ? 132 : 108,
    height: IS_TABLET ? 132 : 108,
    opacity: 0.86,
    transform: [{ rotate: '-12deg' }],
    zIndex: 1,
  },
  scriptIntroEnvelope: {
    position: 'absolute',
    top: 20,
    right: -34,
    width: IS_TABLET ? 118 : 98,
    height: IS_TABLET ? 118 : 98,
    opacity: 0.7,
    transform: [{ rotate: '10deg' }],
    zIndex: 1,
  },
  scriptIntroRing: {
    width: IS_TABLET ? 128 : 110,
    height: IS_TABLET ? 128 : 110,
    marginTop: -24,
    marginBottom: -12,
    opacity: 0.82,
    zIndex: 0,
  },
  scriptIntroCake: {
    position: 'absolute',
    right: -30,
    bottom: 26,
    width: IS_TABLET ? 122 : 100,
    height: IS_TABLET ? 122 : 100,
    opacity: 0.62,
    transform: [{ rotate: '-7deg' }],
    zIndex: 1,
  },
  scriptIntroHeels: {
    position: 'absolute',
    left: -28,
    bottom: 18,
    width: IS_TABLET ? 118 : 96,
    height: IS_TABLET ? 118 : 96,
    opacity: 0.58,
    transform: [{ rotate: '8deg' }],
    zIndex: 1,
  },
  scriptIntroLabel: {
    color: '#A48A5E',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '800',
    marginBottom: 14,
    transform: [{ translateY: -16 }],
    zIndex: 2,
  },
  scriptIntroTitle: {
    color: '#2E2923',
    fontFamily: 'Great Vibes',
    fontSize: IS_TABLET ? 68 : 58,
    lineHeight: IS_TABLET ? 88 : 76,
    fontWeight: '400',
    textAlign: 'center',
    zIndex: 3,
  },
  scriptIntroLineTrack: {
    width: '74%',
    height: 26,
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  scriptIntroInkLine: {
    width: '100%',
    height: 1.4,
    backgroundColor: '#B99255',
  },
  scriptIntroSubtitle: {
    color: '#736A5F',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 18,
    textAlign: 'center',
  },
  scriptIntroNames: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptIntroName: {
    color: '#9D773A',
    fontFamily: 'NanumBrushScript',
    fontSize: IS_TABLET ? 70 : 58,
    lineHeight: IS_TABLET ? 76 : 63,
    fontWeight: '400',
    textAlign: 'center',
  },
  scriptIntroAmp: {
    color: '#A88754',
    fontFamily: 'Great Vibes',
    fontSize: IS_TABLET ? 34 : 30,
    lineHeight: IS_TABLET ? 38 : 34,
    fontWeight: '400',
    marginVertical: -2,
  },
  scriptIntroDate: {
    marginTop: 16,
    color: '#8E7E68',
    fontSize: 12,
    letterSpacing: 2.2,
    fontWeight: '700',
  },
  scriptIntroHintPill: {
    marginTop: 26,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#2E2923',
    shadowColor: '#2B2823',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  scriptIntroHint: {
    color: '#FFF9EF',
    fontSize: 13,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
});
