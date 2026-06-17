// src/screens/event/templates/wedding/YozmStyleTemplate.js
// Editorial "yozm" wedding invitation: dark photo cover, pink diary sections, and bold photo grids.
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width: W } = Dimensions.get('window');
const PAGE_W = Math.min(W, 430);
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SCRIPT = Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif';
const HAND = Platform.OS === 'ios' ? 'NanumBrushScript' : 'serif';

const P = {
  black: '#030303',
  ink: '#191919',
  muted: '#4E4E4E',
  pink: '#F6A9B7',
  pinkDeep: '#EE7E9B',
  palePink: '#FCE0E6',
  paper: '#F7F4EF',
  white: '#FFFFFF',
  line: 'rgba(0,0,0,0.16)',
};

const YOZM_ENVELOPE = require('../../../../../assets/images/wedding/yozm-envelope.png');
const BLUSH_MAP_TITLE = require('../../../../../assets/images/wedding/blush-map-title.png');

const getImageSource = (image) => {
  if (!image) return null;
  if (typeof image === 'number') return image;
  return toImageSource(image) || image;
};

const getGivenName = (name) => {
  const text = String(name || '').trim();
  if (!text) return '';
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return parts[parts.length - 1];
  if (/^[가-힣]{3,4}$/.test(text)) return text.slice(1);
  return text;
};

const getEnglishDay = (day) => {
  const map = { 일: 'SUN', 월: 'MON', 화: 'TUE', 수: 'WED', 목: 'THU', 금: 'FRI', 토: 'SAT' };
  return map[day] || 'SUN';
};

const formatPhone = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone || '';
};

const buildPeople = (items) => items.filter((item) => item.number || item.contact);

const getImageKey = (image) => {
  if (!image) return '';
  if (typeof image === 'number') return `asset-${image}`;
  return image.uri || image.url || image.path || image.publicUrl || image.primaryUrl || JSON.stringify(image);
};

const uniqueImages = (images) => {
  const seen = new Set();
  return images.filter((image) => {
    const key = getImageKey(image);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function OvalLabel({ children, dark = false, style }) {
  return (
    <View style={[s.ovalOuter, dark && s.ovalOuterDark, style]}>
      <View style={[s.ovalInner, dark && s.ovalInnerDark]}>
        <Text style={[s.ovalText, dark && s.ovalTextDark]}>{children}</Text>
      </View>
    </View>
  );
}

function EnvelopeCard({ dateLine, dayLabel, timeText, locName }) {
  return (
    <View style={s.envelope}>
      <Image source={YOZM_ENVELOPE} style={s.envelopeImage} resizeMode="stretch" />
      <Text style={s.envelopeSmall}>YOU'RE INVITED TO</Text>
      <Text style={s.envelopeScript}>Our Wedding</Text>
      <Text style={s.envelopeDate}>{dateLine}. {dayLabel}</Text>
      <Text style={s.envelopeTime}>{timeText}</Text>
      <Text style={s.envelopePlace}>{locName}</Text>
    </View>
  );
}

function MemoLines({ children, align = 'right' }) {
  const lines = String(children || '').split('\n').filter(Boolean);
  return (
    <View style={s.memoLines}>
      {lines.map((line, index) => (
        <View
          key={`${line}-${index}`}
          style={[
            s.memoStrip,
            align === 'left' ? s.memoStripLeft : s.memoStripRight,
            { transform: [{ rotate: `${index % 2 === 0 ? -2 : 1.5}deg` }] },
          ]}
        >
          <Text style={s.memoText}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

function ParentBlock({
  title,
  nameLine,
  photo,
  sticker,
  stickerRight,
  message,
}) {
  return (
    <View style={s.parentBlock}>
      <Text style={s.parentHeading}>{title}</Text>
      <View style={s.parentPhotoWrap}>
        <Image source={getImageSource(photo)} style={s.parentPhoto} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0.02)']} style={StyleSheet.absoluteFillObject} />
        <Text style={s.parentPhotoName}>{nameLine}</Text>
      </View>
      <View style={[s.childSticker, stickerRight && s.childStickerRight]}>
        <Image source={getImageSource(sticker)} style={s.childStickerImage} resizeMode="cover" />
      </View>
      <MemoLines align={stickerRight ? 'left' : 'right'}>{message}</MemoLines>
    </View>
  );
}

function CalendarSection({ year, month, day, dayLabel, dateLine, timeText }) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <View style={s.calendarSection}>
      <Text style={s.calendarTitle}>{dateLine}. {dayLabel}</Text>
      <Text style={s.calendarTime}>{timeText}</Text>
      <View style={s.calendarHead}>
        {DAYS.map((label) => <Text key={label} style={s.calendarHeadText}>{label}</Text>)}
      </View>
      <View style={s.calendarGrid}>
        {Array.from({ length: firstDow }).map((_, index) => <View key={`blank-${index}`} style={s.calendarCell} />)}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const current = index + 1;
          const selected = current === day;
          return (
            <View key={current} style={s.calendarCell}>
              <View style={selected && s.calendarSelected}>
                <Text style={[s.calendarDay, selected && s.calendarSelectedText]}>{current}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function YozmStyleTemplate({
  eventData = {},
  categorizedImages = {},
  allowMessages = false,
  selectedPhotoFrame,
  frameAdjusting = false,
  onPhotoFrameAdjust,
  isPreviewMode = false,
}) {
  const insets = useSafeAreaInsets();
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  const mainImages = safeImages.main?.length ? safeImages.main : defaultImages.slice(0, 4);
  const galleryImages = safeImages.gallery?.length ? safeImages.gallery : defaultImages.slice(3, 18);
  const orderedImages = uniqueImages([...mainImages, ...galleryImages, ...(safeImages.all || []), ...defaultImages].filter(Boolean));
  const pickImage = (index, fallback = defaultImages[0]) => orderedImages[index % Math.max(orderedImages.length, 1)] || fallback;
  const coverImage = pickImage(0);
  const coupleImage = pickImage(1, coverImage);
  const groomParentImage = pickImage(2, coupleImage);
  const groomChildCandidate = safeImages.groom?.[0];
  const groomChildImage = groomChildCandidate && getImageKey(groomChildCandidate) !== getImageKey(groomParentImage)
    ? groomChildCandidate
    : pickImage(3, groomParentImage);
  const brideParentImage = pickImage(4, groomChildImage);
  const brideChildCandidate = safeImages.bride?.[0];
  const brideChildImage = brideChildCandidate && getImageKey(brideChildCandidate) !== getImageKey(brideParentImage)
    ? brideChildCandidate
    : pickImage(5, brideParentImage);
  const storyImageOne = pickImage(6, coverImage);
  const storyImageTwo = pickImage(7, coupleImage);

  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [mapCoord, setMapCoord] = useState(null);
  const [toast, setToast] = useState('');

  const ai = eventData.additional_info || {};
  const groomName = eventData.groomName || eventData.groom_name || '안재진';
  const brideName = eventData.brideName || eventData.bride_name || '권정은';
  const groomGivenName = getGivenName(groomName) || groomName;
  const brideGivenName = getGivenName(brideName) || brideName;
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '안정환';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '유은희';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '권세광';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '정순분';
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const timeText = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);
  const dayLabel = getEnglishDay(dateInfo.dayOfWeek);
  const dateLine = `${dateInfo.year}.${String(dateInfo.month).padStart(2, '0')}.${String(dateInfo.day).padStart(2, '0')}`;
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '웨딩피치홀';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '서울시 마포구 서교동 123-12';

  const accounts = {
    groom: buildPeople([
      { role: '신랑', name: groomName, bank: ai.groom_bank_name, number: ai.groom_account_number, contact: eventData.groomContact || eventData.groom_contact },
      { role: '신랑부', name: groomFather, bank: ai.groom_father_bank_name, number: ai.groom_father_account_number, contact: ai.groom_father_contact },
      { role: '신랑모', name: groomMother, bank: ai.groom_mother_bank_name, number: ai.groom_mother_account_number, contact: ai.groom_mother_contact },
    ]),
    bride: buildPeople([
      { role: '신부', name: brideName, bank: ai.bride_bank_name, number: ai.bride_account_number, contact: eventData.brideContact || eventData.bride_contact },
      { role: '신부부', name: brideFather, bank: ai.bride_father_bank_name, number: ai.bride_father_account_number, contact: ai.bride_father_contact },
      { role: '신부모', name: brideMother, bank: ai.bride_mother_bank_name, number: ai.bride_mother_account_number, contact: ai.bride_mother_contact },
    ]),
  };
  const hasAccounts = accounts.groom.length > 0 || accounts.bride.length > 0;
  const subwayInfo = ai.subway_info || eventData.subwayInfo || eventData.subway_info || '';
  const busInfo = ai.bus_info || eventData.busInfo || eventData.bus_info || '';
  const galleryPreview = orderedImages.length ? orderedImages : defaultImages;

  useEffect(() => {
    const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
    resolveWeddingMapCoord({ locName, locAddr, kakaoKey: KAKAO_KEY })
      .then((coord) => {
        if (coord) setMapCoord(coord);
      })
      .catch(() => {});
  }, [locAddr, locName]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 1600);
  };

  const blockPreviewAction = () => showToast('미리보기에서는 사용할 수 없습니다');

  const copyText = async (value, message = '복사되었습니다') => {
    if (isPreviewMode) {
      blockPreviewAction();
      return;
    }
    try {
      await Clipboard.setStringAsync(String(value || ''));
      showToast(message);
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  const shareInvitation = async () => {
    if (isPreviewMode) {
      blockPreviewAction();
      return;
    }
    try {
      await Share.share({
        message: `${groomName} & ${brideName} 결혼합니다.\n${dateLine} ${dayLabel} ${timeText}\n${locName}`,
      });
    } catch {
      showToast('공유에 실패했습니다');
    }
  };

  const openMap = (kind) => {
    if (isPreviewMode) {
      blockPreviewAction();
      return;
    }
    const query = encodeURIComponent(locAddr || locName);
    if (kind === 'naver') {
      Linking.openURL(`nmap://search?query=${query}&appname=com.gyeongjo`).catch(() =>
        Linking.openURL(`https://map.naver.com/v5/search/${query}`)
      );
      return;
    }
    if (kind === 'kakao') {
      Linking.openURL(`kakaomap://search?q=${query}`).catch(() =>
        Linking.openURL(`https://map.kakao.com/?q=${query}`)
      );
      return;
    }
    Linking.openURL(`tmap://search?searchKeyword=${query}`).catch(() =>
      Linking.openURL(`https://tmap.life/search?query=${query}`)
    );
  };

  const renderAccountGroup = (title, list) => {
    if (!list.length) return null;
    return (
      <View style={s.accountGroup}>
        <Text style={s.accountGroupTitle}>{title}</Text>
        <View style={s.accountLine} />
        {list.map((item, index) => (
          <View key={`${title}-${index}`} style={s.accountRow}>
            <View style={s.accountTextWrap}>
              {!!item.number && <Text style={s.accountNumber}>{item.bank} {item.number}</Text>}
              <Text style={s.accountRole}>{item.role}{item.name ? ` · ${item.name}` : ''}</Text>
              {!!item.contact && <Text style={s.accountRole}>{formatPhone(item.contact)}</Text>}
            </View>
            {!!item.number && (
              <TouchableOpacity style={s.accountCopy} onPress={() => copyText(item.number, '계좌번호가 복사되었습니다')} activeOpacity={0.85}>
                <Text style={s.accountCopyText}>복사하기</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={!frameAdjusting} contentContainerStyle={{ paddingBottom: insets.bottom + 44 }}>
        <View style={[s.page, { paddingTop: insets.top }]}>
          <View style={s.hero}>
            <Image source={getImageSource(coverImage)} style={s.heroImage} resizeMode="cover" />
            <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.92)']} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFillObject} />
            <PhotoFrameOverlay
              selectedPhotoFrame={selectedPhotoFrame}
              frameAdjusting={frameAdjusting}
              onPhotoFrameAdjust={onPhotoFrameAdjust}
            />
            <View style={s.heroTitle}>
              <Text style={s.invited}>YOU'RE INVITED TO</Text>
              <Text style={s.heroScript}>Our Wedding</Text>
              <Text style={s.heroDate}>{dateLine}. {dayLabel} {timeText.replace('오전 ', '').replace('오후 ', '')}</Text>
              <Text style={s.heroPlace}>{locName}</Text>
            </View>
          </View>

          <View style={s.saveSection}>
            <OvalLabel>SAVE THE DATE</OvalLabel>
            <Text style={s.saveInfo}>{dateInfo.full} {timeText}</Text>
            <Text style={s.saveInfo}>{locName}</Text>
            <Text style={s.saveInfo}>{locAddr}</Text>
          </View>

          <View style={s.envelopeSection}>
            <EnvelopeCard dateLine={dateLine} dayLabel={dayLabel} timeText={timeText} locName={locName} />
          </View>

          <View style={s.coupleNameSection}>
            <Text style={s.coupleName}>{groomName}  {brideName}</Text>
            <Image source={getImageSource(coupleImage)} style={s.couplePhoto} resizeMode="cover" />
          </View>

          <View style={s.parentsSection}>
            <ParentBlock
              title="Groom's Parents"
              nameLine={`${groomFather} & ${groomMother}의\n아들 ${groomGivenName}`}
              photo={groomParentImage}
              sticker={groomChildImage}
              message={`사랑하는 아들 ${groomGivenName}\n대견하고 멋지게 커주어 고맙고\n지금 마음처럼 늘 서로 아끼며\n가정을 소중히 가꾸어 가길 기원한다.`}
            />
            <ParentBlock
              title="Bride's Parents"
              nameLine={`${brideFather} & ${brideMother}의\n딸 ${brideGivenName}`}
              photo={brideParentImage}
              sticker={brideChildImage}
              stickerRight
              message={`예쁜 우리 딸 ${brideGivenName}\n너의 다정함이 새 가정에도 피어나길\n서로 웃으며 기대어 살아가길\n엄마 아빠가 마음 다해 응원한다.`}
            />
          </View>

          <View style={s.storySection}>
            <Text style={s.storyHandTop}>언제나 날 웃게하는{'\n'}사랑스러운 사람.{'\n'}내 삶에 머물러줘 고마워요.{'\n'}지금처럼 평생 내 곁에{'\n'}함께 해줘요!</Text>
            <Image source={getImageSource(storyImageOne)} style={s.storyPhoto} resizeMode="cover" />
            <Text style={s.storyHandBottom}>나의 귀엽고 소중한 청춘,{'\n'}처음 본 순간부터 지금까지{'\n'}내 가슴은 너로 가득 차있어.{'\n'}함께 늙고 싶은 사람, 사랑해요</Text>
            <Image source={getImageSource(storyImageTwo)} style={s.storyPhotoTall} resizeMode="cover" />
          </View>

          <View style={s.galleryGrid}>
            {galleryPreview.slice(0, 15).map((img, index) => (
              <TouchableOpacity
                key={`gallery-${index}`}
                style={[s.galleryTile, index % 5 === 0 && s.galleryWide]}
                activeOpacity={0.9}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image source={getImageSource(img)} style={s.fill} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>

          <CalendarSection
            year={dateInfo.year}
            month={dateInfo.month}
            day={dateInfo.day}
            dayLabel={dayLabel}
            dateLine={dateLine}
            timeText={timeText}
          />

          <View style={s.mapTitleSection}>
            <Image source={BLUSH_MAP_TITLE} style={s.mapTitleImage} resizeMode="contain" />
          </View>
          <View style={s.mapBox}>
            {mapCoord ? (
              <WebView
                source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#F8F3EF}.leaflet-marker-icon{filter:hue-rotate(120deg) saturate(1.2)}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                javaScriptEnabled
                originWhitelist={['*']}
              />
            ) : (
              <LottieLoading text="지도를 불러오는 중..." size={54} color={P.pinkDeep} />
            )}
          </View>
          <View style={s.mapButtons}>
            <TouchableOpacity style={s.mapButton} onPress={() => openMap('naver')} activeOpacity={0.85}>
              <Text style={s.mapIconNaver}>N</Text>
              <Text style={s.mapButtonText}>네이버지도</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.mapButton} onPress={() => openMap('kakao')} activeOpacity={0.85}>
              <Text style={s.mapIconKakao}>K</Text>
              <Text style={s.mapButtonText}>카카오맵</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.mapButton} onPress={() => openMap('tmap')} activeOpacity={0.85}>
              <Text style={s.mapIconTmap}>T</Text>
              <Text style={s.mapButtonText}>T맵</Text>
            </TouchableOpacity>
          </View>
          <View style={s.locationInfo}>
            <View style={s.locationHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.locationName}>{locName}</Text>
                <Text style={s.locationAddr}>{locAddr}</Text>
              </View>
              <TouchableOpacity style={s.locationCopy} onPress={() => copyText(locAddr, '주소가 복사되었습니다')} activeOpacity={0.85}>
                <Text style={s.locationCopyText}>복사하기</Text>
              </TouchableOpacity>
            </View>
            {!!subwayInfo && <Text style={s.transportText}>🚃 지하철{'\n'}{subwayInfo}</Text>}
            {!!busInfo && <Text style={s.transportText}>🚌 버스{'\n'}{busInfo}</Text>}
          </View>

          {hasAccounts && (
            <View style={s.accountsSection}>
              <OvalLabel dark style={s.accountOval}>마음 전하실 곳</OvalLabel>
              {renderAccountGroup('🤵🏻 신랑 측 계좌번호', accounts.groom)}
              {renderAccountGroup('👰🏻 신부 측 계좌번호', accounts.bride)}
            </View>
          )}

          {allowMessages && (
            <View style={s.messageSection}>
              <Text style={s.messageTitle}>축하 메시지</Text>
              <Text style={s.messageText}>두 분의 새로운 시작을 진심으로 축하합니다.</Text>
            </View>
          )}

          <View style={s.footer}>
            <TouchableOpacity style={s.kakaoButton} onPress={shareInvitation} activeOpacity={0.9}>
              <Text style={s.kakaoText}>카카오톡 공유하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.darkButton} onPress={() => copyText(`${groomName} & ${brideName}\n${dateLine} ${timeText}\n${locName}`, '청첩장 정보가 복사되었습니다')} activeOpacity={0.9}>
              <Text style={s.darkButtonText}>청첩장 주소 복사하기</Text>
            </TouchableOpacity>
            <Text style={s.copyright}>©weddingpeach</Text>
          </View>
        </View>
      </ScrollView>

      {!!toast && (
        <View style={[s.toast, { bottom: insets.bottom + 28 }]}>
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}

      <Modal visible={selectedImageIndex !== null} transparent animationType="fade">
        <View style={s.imageModal}>
          <TouchableOpacity style={[s.modalClose, { top: insets.top + 16 }]} onPress={() => setSelectedImageIndex(null)}>
            <Text style={s.modalCloseText}>닫기</Text>
          </TouchableOpacity>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: Math.max(selectedImageIndex || 0, 0) * W, y: 0 }}>
            {galleryPreview.slice(0, 15).map((img, index) => (
              <View key={`modal-${index}`} style={s.modalSlide}>
                <Image source={getImageSource(img)} style={s.modalImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.black, alignItems: 'center' },
  page: { width: PAGE_W, backgroundColor: P.black, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  hero: { height: 760, backgroundColor: P.black, justifyContent: 'flex-end' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroTitle: { paddingHorizontal: 22, paddingBottom: 52, alignItems: 'center' },
  invited: { color: P.pink, fontFamily: SERIF, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  heroScript: { color: P.pinkDeep, fontFamily: SCRIPT, fontSize: 66, lineHeight: 78, fontWeight: '400' },
  heroDate: { color: P.pink, fontFamily: SERIF, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  heroPlace: { color: P.pink, fontFamily: SERIF, fontSize: 15, lineHeight: 22, fontWeight: '900' },
  saveSection: { backgroundColor: P.black, paddingTop: 126, paddingHorizontal: 34, paddingBottom: 116, alignItems: 'center' },
  ovalOuter: {
    width: 190,
    height: 54,
    borderRadius: 999,
    backgroundColor: P.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalInner: {
    width: 172,
    height: 42,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: 'rgba(25,25,25,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalOuterDark: { backgroundColor: P.black },
  ovalInnerDark: { borderColor: 'rgba(255,255,255,0.26)' },
  ovalText: { color: P.ink, fontSize: 17, fontWeight: '900' },
  ovalTextDark: { color: P.white },
  saveInfo: { color: P.white, fontSize: 22, lineHeight: 34, textAlign: 'center', fontWeight: '800', marginTop: 42 },
  envelopeSection: { backgroundColor: P.black, paddingHorizontal: 8, paddingBottom: 110 },
  envelope: {
    width: '100%',
    height: 250,
    backgroundColor: 'transparent',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  envelopeImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  envelopeSmall: { color: P.ink, fontSize: 12, fontWeight: '900', marginBottom: 10, zIndex: 2 },
  envelopeScript: { color: P.ink, fontFamily: SCRIPT, fontSize: 61, lineHeight: 72, zIndex: 2 },
  envelopeDate: { position: 'absolute', left: 28, bottom: 42, color: P.ink, fontSize: 13, fontWeight: '900', zIndex: 2 },
  envelopeTime: { position: 'absolute', left: 28, bottom: 27, color: P.ink, fontSize: 13, fontWeight: '900', zIndex: 2 },
  envelopePlace: { position: 'absolute', right: 28, bottom: 29, maxWidth: '43%', color: P.ink, fontSize: 12, fontWeight: '900', textAlign: 'right', zIndex: 2 },
  coupleNameSection: { backgroundColor: P.black, paddingTop: 30, paddingBottom: 0, alignItems: 'center' },
  coupleName: { color: P.white, fontSize: 24, lineHeight: 32, fontWeight: '900', marginBottom: 72 },
  couplePhoto: { width: PAGE_W, height: 314 },
  parentsSection: { backgroundColor: P.pink, paddingHorizontal: 18, paddingTop: 92, paddingBottom: 86 },
  parentBlock: { marginBottom: 120, alignItems: 'center' },
  parentHeading: { color: P.ink, fontSize: 22, lineHeight: 30, fontWeight: '900', marginBottom: 16 },
  parentPhotoWrap: { width: PAGE_W - 110, height: 350, backgroundColor: '#ddd', overflow: 'hidden' },
  parentPhoto: { width: '100%', height: '100%' },
  parentPhotoName: { position: 'absolute', top: 22, left: 24, color: P.white, fontSize: 21, lineHeight: 29, fontWeight: '900' },
  childSticker: {
    alignSelf: 'flex-start',
    marginTop: -82,
    marginLeft: 22,
    width: 132,
    height: 168,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: P.white,
    overflow: 'hidden',
    backgroundColor: P.white,
    transform: [{ rotate: '-5deg' }],
  },
  childStickerRight: {
    alignSelf: 'flex-end',
    marginLeft: 0,
    marginRight: 4,
    marginTop: -92,
    transform: [{ rotate: '5deg' }],
  },
  childStickerImage: { width: '100%', height: '100%' },
  memoLines: { width: '100%', marginTop: 18, alignItems: 'flex-end' },
  memoStrip: { backgroundColor: P.white, borderRadius: 5, paddingHorizontal: 13, paddingVertical: 5, marginBottom: 8 },
  memoStripLeft: { alignSelf: 'flex-start', marginLeft: 44 },
  memoStripRight: { alignSelf: 'flex-end', marginRight: 22 },
  memoText: { color: P.black, fontFamily: HAND, fontSize: 26, lineHeight: 33, fontWeight: '900' },
  storySection: { backgroundColor: P.white, paddingTop: 86, paddingBottom: 0 },
  storyHandTop: { color: P.black, fontFamily: HAND, fontSize: 27, lineHeight: 39, fontWeight: '900', paddingHorizontal: 72, marginBottom: 70, transform: [{ rotate: '-4deg' }] },
  storyPhoto: { width: PAGE_W, height: 520 },
  storyHandBottom: { color: P.black, fontFamily: HAND, fontSize: 27, lineHeight: 39, fontWeight: '900', paddingHorizontal: 72, marginVertical: 90, transform: [{ rotate: '-3deg' }] },
  storyPhotoTall: { width: PAGE_W, height: 540 },
  galleryGrid: { backgroundColor: P.black, flexDirection: 'row', flexWrap: 'wrap' },
  galleryTile: { width: PAGE_W / 3, height: PAGE_W / 3 },
  galleryWide: { width: PAGE_W, height: 250 },
  calendarSection: { backgroundColor: P.pink, paddingHorizontal: 40, paddingTop: 84, paddingBottom: 82 },
  calendarTitle: { color: P.ink, fontFamily: SERIF, fontSize: 27, lineHeight: 34, fontWeight: '900', textAlign: 'center' },
  calendarTime: { color: P.ink, fontFamily: SERIF, fontSize: 19, lineHeight: 24, fontWeight: '900', fontStyle: 'italic', textAlign: 'center', marginBottom: 46 },
  calendarHead: { flexDirection: 'row', marginBottom: 22 },
  calendarHeadText: { width: (PAGE_W - 80) / 7, color: P.ink, fontFamily: SERIF, fontSize: 17, lineHeight: 24, fontWeight: '900', textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: (PAGE_W - 80) / 7, height: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  calendarSelected: { width: 36, height: 36, borderRadius: 18, backgroundColor: P.black, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { color: P.ink, fontFamily: SERIF, fontSize: 19, fontWeight: '800' },
  calendarSelectedText: { color: P.white },
  mapTitleSection: { backgroundColor: P.white, paddingTop: 72, paddingBottom: 30, alignItems: 'center' },
  mapTitleImage: { width: Math.min(PAGE_W * 0.58, 250), height: Math.min(PAGE_W * 0.58, 250) * (250 / 620) },
  mapBox: { height: 314, backgroundColor: '#F5F1EE' },
  mapButtons: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: P.white,
    paddingHorizontal: 3,
    paddingTop: 16,
    paddingBottom: 16,
  },
  mapButton: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mapIconNaver: { width: 24, height: 24, borderRadius: 5, backgroundColor: '#03C75A', color: P.white, textAlign: 'center', lineHeight: 24, fontSize: 14, fontWeight: '900' },
  mapIconKakao: { width: 24, height: 24, borderRadius: 5, backgroundColor: '#FEE500', color: P.ink, textAlign: 'center', lineHeight: 24, fontSize: 14, fontWeight: '900' },
  mapIconTmap: { width: 24, height: 24, borderRadius: 5, backgroundColor: '#E6007E', color: P.white, textAlign: 'center', lineHeight: 24, fontSize: 14, fontWeight: '900' },
  mapButtonText: { color: P.ink, fontSize: 15, fontWeight: '900' },
  locationInfo: { backgroundColor: P.white, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: P.line },
  locationName: { color: P.ink, fontSize: 18, lineHeight: 25, fontWeight: '900', marginBottom: 4 },
  locationAddr: { color: P.ink, fontSize: 15, lineHeight: 23, fontWeight: '600' },
  locationCopy: { backgroundColor: P.pinkDeep, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 11 },
  locationCopyText: { color: P.ink, fontSize: 14, fontWeight: '900' },
  transportText: { color: P.ink, fontSize: 17, lineHeight: 27, fontWeight: '800', marginTop: 22 },
  accountsSection: { backgroundColor: P.palePink, paddingHorizontal: 22, paddingTop: 60, paddingBottom: 64 },
  accountOval: { alignSelf: 'center', marginBottom: 42, width: 150, height: 46 },
  accountGroup: { marginBottom: 32 },
  accountGroupTitle: { color: P.ink, fontSize: 20, lineHeight: 28, fontWeight: '900', marginBottom: 12 },
  accountLine: { height: 1.2, backgroundColor: P.ink, marginBottom: 14 },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  accountTextWrap: { flex: 1, paddingRight: 12 },
  accountNumber: { color: P.ink, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  accountRole: { color: P.ink, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 2 },
  accountCopy: { backgroundColor: P.black, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 11 },
  accountCopyText: { color: P.white, fontSize: 14, fontWeight: '900' },
  messageSection: { backgroundColor: P.palePink, paddingHorizontal: 28, paddingBottom: 52 },
  messageTitle: { color: P.ink, fontSize: 24, fontWeight: '900', marginBottom: 12 },
  messageText: { color: P.muted, fontSize: 17, lineHeight: 26 },
  footer: { backgroundColor: P.white, paddingTop: 80, paddingBottom: 96, alignItems: 'center', gap: 14 },
  kakaoButton: { width: 188, borderRadius: 5, backgroundColor: '#FFE500', paddingVertical: 16, alignItems: 'center' },
  kakaoText: { color: P.ink, fontSize: 17, fontWeight: '900' },
  darkButton: { width: 188, borderRadius: 5, backgroundColor: P.black, paddingVertical: 16, alignItems: 'center' },
  darkButtonText: { color: P.white, fontSize: 17, fontWeight: '900' },
  copyright: { color: '#999', fontSize: 16, lineHeight: 22, fontWeight: '700', marginTop: 56 },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11 },
  toastText: { color: P.white, fontSize: 14, fontWeight: '800' },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  modalClose: { position: 'absolute', right: 18, zIndex: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8 },
  modalCloseText: { color: P.white, fontSize: 14, fontWeight: '800' },
  modalSlide: { width: W, height: '100%', alignItems: 'center', justifyContent: 'center' },
  modalImage: { width: W, height: '82%' },
});
