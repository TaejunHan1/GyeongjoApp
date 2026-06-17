// src/screens/event/templates/wedding/BlushEditorialTemplate.js
// Vintage kitsch scrapbook-style mobile invitation.
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
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
import { toImageSource } from '../../../../lib/imageUri';

const { width: W } = Dimensions.get('window');
const PAGE_W = Math.min(W, 430);
const DAYS = ['SUN', 'M', 'T', 'W', 'T', 'F', 'SAT'];
const SCRIPT_FONT = Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif';
const SERIF_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const HAND_FONT = Platform.OS === 'ios' ? 'NanumBrushScript' : 'serif';

const P = {
  black: '#171717',
  pink: '#F6C0D0',
  hotPink: '#F39ABA',
  paper: '#F8F7F3',
  ink: '#202020',
  muted: '#5E5658',
  white: '#FFFFFF',
  yellow: '#FFE188',
  blueTape: '#AAD2FF',
  greenTape: '#82EF9D',
  line: 'rgba(25,25,25,0.2)',
};

const BLUSH_LACE_FRAME = require('../../../../../assets/images/wedding/blush-editorial-lace-frame.png');
const BLUSH_LETTER_PAPER = require('../../../../../assets/images/wedding/blush-editorial-letter-paper.png');
const BLUSH_CALENDAR_DOODLES = require('../../../../../assets/images/wedding/blush-calendar-doodles.png');
const BLUSH_MAP_TITLE = require('../../../../../assets/images/wedding/blush-map-title.png');

const getImageSource = (image) => {
  if (!image) return null;
  if (typeof image === 'number') return image;
  return toImageSource(image) || image;
};

const formatPhone = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone || '';
};

const getGivenName = (name) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return parts[parts.length - 1];
  if (/^[가-힣]{3,4}$/.test(trimmed)) return trimmed.slice(1);
  return trimmed;
};

const getImageKey = (image) => {
  if (!image) return '';
  if (typeof image === 'number') return `asset-${image}`;
  return image.uri || image.url || image.path || JSON.stringify(image);
};

const PARENT_BG_PHOTO_STYLES = [
  {
    left: -88,
    top: -28,
    width: '76%',
    height: '28%',
    opacity: 0.34,
    transform: [{ rotate: '-9deg' }],
  },
  {
    right: -76,
    top: 120,
    width: '62%',
    height: '26%',
    opacity: 0.32,
    transform: [{ rotate: '8deg' }],
  },
  {
    left: -56,
    top: 360,
    width: '66%',
    height: '25%',
    opacity: 0.34,
    transform: [{ rotate: '6deg' }],
  },
  {
    right: -64,
    top: 560,
    width: '70%',
    height: '28%',
    opacity: 0.32,
    transform: [{ rotate: '-7deg' }],
  },
  {
    left: -92,
    bottom: 510,
    width: '68%',
    height: '24%',
    opacity: 0.32,
    transform: [{ rotate: '-4deg' }],
  },
  {
    right: -82,
    bottom: 330,
    width: '66%',
    height: '25%',
    opacity: 0.34,
    transform: [{ rotate: '9deg' }],
  },
  {
    left: -62,
    bottom: 130,
    width: '62%',
    height: '24%',
    opacity: 0.33,
    transform: [{ rotate: '7deg' }],
  },
  {
    right: -54,
    bottom: -36,
    width: '64%',
    height: '24%',
    opacity: 0.33,
    transform: [{ rotate: '-6deg' }],
  },
];

const PaperTexture = () => (
  <>
    <View style={[s.paperFold, { left: '50%' }]} />
    <View style={[s.paperFold, { top: '49%', width: '86%', height: 1, left: '7%' }]} />
    <View style={s.paperNoiseOne} />
    <View style={s.paperNoiseTwo} />
  </>
);

const NotebookTexture = ({ type = 'lined' }) => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {type === 'grid' ? (
      <>
        {Array.from({ length: 13 }).map((_, index) => (
          <View key={`grid-v-${index}`} style={[s.noteGridVertical, { left: `${8 + index * 7.4}%` }]} />
        ))}
        {Array.from({ length: 12 }).map((_, index) => (
          <View key={`grid-h-${index}`} style={[s.noteGridHorizontal, { top: 26 + index * 28 }]} />
        ))}
      </>
    ) : (
      <>
        <View style={s.noteMarginLine} />
        {Array.from({ length: 10 }).map((_, index) => (
          <View key={`line-${index}`} style={[s.noteLine, { top: 34 + index * 34 }]} />
        ))}
      </>
    )}
    <View style={s.notePaperSmudge} />
  </View>
);

const Tape = ({ color = P.yellow, style }) => <View style={[s.tape, { backgroundColor: color }, style]} />;

const CopyButton = ({ label = '복사하기', onPress }) => (
  <TouchableOpacity style={s.copyBtn} onPress={onPress} activeOpacity={0.8}>
    <Text style={s.copyBtnText}>{label}</Text>
  </TouchableOpacity>
);

export default function BlushEditorialTemplate({
  eventData = {},
  categorizedImages = {},
  allowMessages = false,
  isPreviewMode = false,
}) {
  const insets = useSafeAreaInsets();
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  const mainImages = safeImages.main?.length ? safeImages.main : defaultImages.slice(0, 3);
  const galleryImages = safeImages.gallery?.length ? safeImages.gallery : defaultImages.slice(2, 17);
  const coverImage = mainImages[0] || galleryImages[0] || defaultImages[0];
  const letterImage = mainImages[1] || galleryImages[0] || coverImage;
  const secondLetterImage = galleryImages[1] || mainImages[1] || coverImage;
  const uniqueParentBackgroundImages = [coverImage, letterImage, secondLetterImage, ...galleryImages, ...mainImages]
    .filter((image, index, images) => {
      if (!image) return false;
      const key = getImageKey(image);
      return images.findIndex((item) => getImageKey(item) === key) === index;
    });
  const parentBackgroundImages = Array.from(
    { length: PARENT_BG_PHOTO_STYLES.length },
    (_, index) => uniqueParentBackgroundImages[index % uniqueParentBackgroundImages.length] || coverImage
  ).filter(Boolean);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [mapCoord, setMapCoord] = useState(null);
  const [activeAccount, setActiveAccount] = useState(null);
  const [toast, setToast] = useState('');
  const [messageOpen, setMessageOpen] = useState(false);
  const [msgName, setMsgName] = useState('');
  const [msgText, setMsgText] = useState('');
  const [guestMessages, setGuestMessages] = useState([
    { name: '친구', message: '두 분의 시작을 진심으로 축하합니다.', time: '방금 전' },
    { name: '동료', message: '사진처럼 사랑스럽고 유쾌한 날들이 계속되길 바라요.', time: '1시간 전' },
  ]);

  const ai = eventData.additional_info || {};
  const groomName = eventData.groomName || eventData.groom_name || 'Lee Jang Hyeon';
  const brideName = eventData.brideName || eventData.bride_name || 'Noh Eun Ah';
  const groomKo = eventData.groomName || eventData.groom_name || '장현';
  const brideKo = eventData.brideName || eventData.bride_name || '은아';
  const groomGivenName = getGivenName(groomKo);
  const brideGivenName = getGivenName(brideKo);
  const groomFatherName = eventData.groomFatherName || eventData.groom_father_name || '이호일';
  const groomMotherName = eventData.groomMotherName || eventData.groom_mother_name || '문명례';
  const brideFatherName = eventData.brideFatherName || eventData.bride_father_name || '노삼진';
  const brideMotherName = eventData.brideMotherName || eventData.bride_mother_name || '장현희';
  const weddingDate = eventData.date || eventData.event_date;
  const dateInfo = formatKoreanDate(weddingDate);
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '웨딩피치 웨딩홀';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '서울시 마포구 서교동 123-12';
  const customMessage = eventData.customMessage || eventData.custom_message ||
    '나의 바람은,\n먼 훗날에도 우리가 서로의 삶에 섞여 있는 것\n그때도 눈이 마주치면 아무 이유 없이 웃어줄 수 있는 것.\n사랑한다는 말을 주저하지 않고 전할 수 있는 것.\n그리고 너의 평생에 내가 사는 것\n\n소중한 분들을 모시고 첫 시작을 함께하고자 합니다\n귀한 걸음 하시어 축복해주신다면\n더 없는 기쁨으로 간직하겠습니다.';

  const calYear = dateInfo?.year || 2026;
  const calMonth = dateInfo?.month || 5;
  const calDay = dateInfo?.day || 2;
  const dateLine = `${calYear}.${String(calMonth).padStart(2, '0')}.${String(calDay).padStart(2, '0')}`;
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const dateTitle = `${dateLine}. ${dateInfo?.dayOfWeek || 'SAT'}`.replace('요일', '');

  const accounts = {
    groom: [
      { role: '신랑', name: groomKo, bank: ai.groom_bank_name, number: ai.groom_account_number, contact: eventData.groomContact || eventData.groom_contact },
      { role: '신랑부', name: groomFatherName, bank: ai.groom_father_bank_name, number: ai.groom_father_account_number, contact: ai.groom_father_contact },
      { role: '신랑모', name: groomMotherName, bank: ai.groom_mother_bank_name, number: ai.groom_mother_account_number, contact: ai.groom_mother_contact },
    ].filter((item) => item.number || item.contact),
    bride: [
      { role: '신부', name: brideKo, bank: ai.bride_bank_name, number: ai.bride_account_number, contact: eventData.brideContact || eventData.bride_contact },
      { role: '신부부', name: brideFatherName, bank: ai.bride_father_bank_name, number: ai.bride_father_account_number, contact: ai.bride_father_contact },
      { role: '신부모', name: brideMotherName, bank: ai.bride_mother_bank_name, number: ai.bride_mother_account_number, contact: ai.bride_mother_contact },
    ].filter((item) => item.number || item.contact),
  };
  const hasAnyAccount = accounts.groom.length > 0 || accounts.bride.length > 0;

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
    setTimeout(() => setToast(''), 1500);
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
      await Share.share({ message: `${groomKo} & ${brideKo} 결혼합니다.\n${dateLine} ${timeStr}\n${locName}` });
    } catch {
      showToast('공유에 실패했습니다');
    }
  };

  const submitMessage = () => {
    if (!msgName.trim() || !msgText.trim()) {
      showToast('이름과 메시지를 입력해주세요');
      return;
    }
    setGuestMessages((prev) => [{ name: msgName.trim(), message: msgText.trim(), time: '방금 전' }, ...prev]);
    setMsgName('');
    setMsgText('');
    setMessageOpen(false);
    showToast('축하 메시지가 등록되었습니다');
  };

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 44 }}>
        <View style={[s.page, { paddingTop: insets.top }]}>
          <View style={s.hero}>
            <Text style={s.saveTitle}>Save the Date</Text>
            <Text style={s.enNames}>{groomName}  *  {brideName}</Text>
            <View style={s.laceStage}>
              <Image source={getImageSource(coverImage)} style={s.lacePhoto} resizeMode="cover" />
              <Image pointerEvents="none" source={BLUSH_LACE_FRAME} style={s.laceFrame} resizeMode="contain" />
            </View>
            <Text style={s.invitePink}>YOU'RE INVITED TO OUR WEDDING</Text>
            <Text style={s.heroInfo}>{dateLine} {timeStr}</Text>
            <Text style={s.heroInfo}>{locName}</Text>
            <Text style={s.heroInfo}>{locAddr}</Text>
          </View>

          <View style={s.blackPaperWrap}>
            <View style={s.paperCard}>
              <Image source={BLUSH_LETTER_PAPER} style={s.paperBackgroundImage} resizeMode="cover" />
              <View style={s.paperContent}>
                <Text style={s.handMessage}>{customMessage}</Text>
                <View style={s.paperLargePhotoWrap}>
                  <Image source={getImageSource(letterImage)} style={s.fill} resizeMode="cover" />
                </View>
                <View style={s.paperSmallPhotoWrap}>
                  <Image source={getImageSource(secondLetterImage)} style={s.fill} resizeMode="cover" />
                </View>
                <View style={s.paperStamp}>
                  <Text style={s.paperStampText}>{groomName}</Text>
                  <Text style={s.paperStampDate}>{dateLine}</Text>
                  <Text style={s.paperStampText}>{brideName}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={s.parentSection}>
            {parentBackgroundImages.map((img, index) => (
              <Image
                key={`parent-bg-${index}`}
                source={getImageSource(img)}
                style={[s.parentBgPhoto, PARENT_BG_PHOTO_STYLES[index]]}
                resizeMode="cover"
              />
            ))}
            <View style={s.parentBgPinkVeil} />
            <View style={s.parentBgWhiteWash} />
            <View style={s.parentBlock}>
              <Text style={s.parentTitle}>{groomFatherName} & {groomMotherName}의 아들</Text>
              <Text style={s.parentName}>신랑 {groomGivenName}</Text>
              <View style={[s.parentPhotoFrame, s.parentPhotoFrameLeft]}>
                <Image source={getImageSource(letterImage)} style={s.fill} resizeMode="cover" />
              </View>
              <View style={[s.memoPaper, s.memoPaperLined, s.memoPaperLeft]}>
                <NotebookTexture type="lined" />
                <Tape style={s.tapeLeft} />
                <Text style={s.memoText}>밝고 든든한 우리 {groomGivenName}야,{'\n'}네가 웃으며 걸어온 시간마다{'\n'}엄마 아빠는 참 고맙고 자랑스러웠단다.{'\n'}이제는 서로의 손을 꼭 잡고{'\n'}천천히, 오래 행복하게 살아가렴.{'\n'}언제나 너희 편에서 응원할게.</Text>
              </View>
            </View>

            <View style={s.parentBlock}>
              <Text style={s.parentTitle}>{brideFatherName} & {brideMotherName}의 딸</Text>
              <Text style={s.parentName}>신부 {brideGivenName}</Text>
              <View style={[s.parentPhotoFrame, s.parentPhotoFrameRight]}>
                <Image source={getImageSource(secondLetterImage)} style={s.fill} resizeMode="cover" />
              </View>
              <View style={[s.memoPaper, s.memoPaperGrid, s.memoPaperRight]}>
                <NotebookTexture type="grid" />
                <Tape color={P.blueTape} style={s.tapeRight} />
                <Text style={s.memoText}>사랑하는 우리 {brideGivenName}에게,{'\n'}너의 다정한 마음이 새 보금자리에도{'\n'}따뜻하게 번져가길 바란다.{'\n'}서로 아껴주고 웃음 잃지 말고{'\n'}오늘처럼 예쁘게 사랑하며 살아가렴.{'\n'}엄마 아빠가 마음 다해 축복한다.</Text>
              </View>
            </View>
          </View>

          <View style={s.galleryGrid}>
            {galleryImages.slice(0, 15).map((img, index) => (
              <TouchableOpacity key={`${index}`} activeOpacity={0.9} style={s.galleryTile} onPress={() => setSelectedImageIndex(index)}>
                <Image source={getImageSource(img)} style={s.fill} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.calendarSection}>
            <Image pointerEvents="none" source={BLUSH_CALENDAR_DOODLES} style={s.calendarDoodles} resizeMode="cover" />
            <View style={s.calendarPaper}>
              <Text style={s.calendarTitle}>{dateTitle}</Text>
              {!!timeStr && <Text style={s.calendarTime}>{timeStr}</Text>}
              <View style={s.calendarHead}>
                {DAYS.map((day, index) => <Text key={`${day}${index}`} style={s.calendarHeadText}>{day}</Text>)}
              </View>
              <View style={s.calendarDays}>
                {Array.from({ length: firstDow }).map((_, index) => <View key={`blank-${index}`} style={s.calendarCell} />)}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const selected = day === calDay;
                  return (
                    <View key={day} style={s.calendarCell}>
                      <View style={selected ? s.calendarSelected : null}>
                        <Text style={[s.calendarDay, selected && s.calendarSelectedText]}>{day}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={s.mapTitleSection}>
            <Image source={BLUSH_MAP_TITLE} style={s.mapTitleImage} resizeMode="contain" />
          </View>
          <View style={s.mapBox}>
            {mapCoord ? (
              <WebView
                source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#ECE7E7}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                javaScriptEnabled
                originWhitelist={['*']}
              />
            ) : (
              <LottieLoading text="지도를 불러오는 중..." size={54} color={P.muted} />
            )}
          </View>
          <View style={s.locationInfo}>
            <View style={s.addressRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.locationName}>{locName}</Text>
                <Text style={s.locationAddr}>{locAddr}</Text>
              </View>
              <CopyButton onPress={() => copyText(locAddr, '주소가 복사되었습니다')} />
            </View>
          </View>

          {hasAnyAccount && (
            <View style={s.accountSection}>
              <Text style={s.accountTitle}>마음 전하실 곳</Text>
              {[
                ['groom', '🤵🏻‍♂️ 신랑 측 계좌번호'],
                ['bride', '👰🏻‍♀️ 신부 측 계좌번호'],
              ].map(([side, title]) => {
                const list = accounts[side];
                if (!list.length) return null;
                const open = activeAccount === side;
                return (
                  <View key={side} style={s.accountGroup}>
                    <TouchableOpacity style={s.accountHeader} onPress={() => setActiveAccount(open ? null : side)}>
                      <Text style={s.accountHeaderText}>{title}</Text>
                      <Text style={s.accountHeaderAction}>{open ? '닫기' : '보기'}</Text>
                    </TouchableOpacity>
                    {open && list.map((item, index) => (
                      <View key={`${side}-${index}`} style={s.accountPerson}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.accountName}>{item.role} · {item.name}</Text>
                          {!!item.number && <Text style={s.accountValue}>{item.bank} {item.number}</Text>}
                          {!!item.contact && <Text style={s.accountValue}>{formatPhone(item.contact)}</Text>}
                        </View>
                        {!!item.number && <CopyButton label="복사" onPress={() => copyText(item.number, '계좌번호가 복사되었습니다')} />}
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {allowMessages && (
            <View style={s.messageSection}>
              <Text style={s.accountTitle}>축하 메시지</Text>
              {guestMessages.map((item, index) => (
                <View key={`${item.name}-${index}`} style={s.messageCard}>
                  <Text style={s.messageName}>{item.name} · {item.time}</Text>
                  <Text style={s.messageText}>{item.message}</Text>
                </View>
              ))}
              <TouchableOpacity style={s.darkButton} onPress={() => setMessageOpen(true)}>
                <Text style={s.darkButtonText}>축하 메시지 남기기</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.shareSection}>
            <TouchableOpacity style={s.kakaoButton} onPress={shareInvitation}>
              <Text style={s.kakaoText}>청첩장 공유하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.urlButton} onPress={() => copyText(`${groomKo} & ${brideKo}`, '청첩장 정보가 복사되었습니다')}>
              <Text style={s.urlText}>청첩장 주소 복사하기</Text>
            </TouchableOpacity>
            <Text style={s.copyright}>ⓒ GyeongjoApp</Text>
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
            {galleryImages.slice(0, 15).map((img, index) => (
              <View key={`modal-${index}`} style={s.modalSlide}>
                <Image source={getImageSource(img)} style={s.modalImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={messageOpen} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.messageModalWrap}>
          <TouchableOpacity style={s.messageDim} activeOpacity={1} onPress={() => setMessageOpen(false)} />
          <View style={s.messageModal}>
            <Text style={s.messageModalTitle}>축하 메시지</Text>
            <TextInput value={msgName} onChangeText={setMsgName} placeholder="이름" placeholderTextColor="#9A8D91" style={s.input} />
            <TextInput value={msgText} onChangeText={setMsgText} placeholder="메시지를 입력해주세요" placeholderTextColor="#9A8D91" style={[s.input, s.textarea]} multiline />
            <TouchableOpacity style={s.darkButton} onPress={submitMessage}>
              <Text style={s.darkButtonText}>등록하기</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', alignItems: 'center' },
  page: { width: PAGE_W, backgroundColor: P.black, overflow: 'hidden' },
  hero: {
    backgroundColor: P.black,
    alignItems: 'center',
    paddingTop: 78,
    paddingHorizontal: 18,
    paddingBottom: 78,
  },
  saveTitle: {
    color: P.hotPink,
    fontFamily: SCRIPT_FONT,
    fontSize: Math.min(PAGE_W * 0.16, 70),
    lineHeight: Math.min(PAGE_W * 0.19, 82),
    fontWeight: '400',
    textAlign: 'center',
  },
  enNames: {
    marginTop: 6,
    color: '#F2F2F2',
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  laceStage: {
    width: Math.min(PAGE_W - 38, 370),
    height: Math.min(PAGE_W - 38, 370),
    marginTop: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lacePhoto: {
    position: 'absolute',
    width: '52%',
    height: '68%',
    borderRadius: 999,
    zIndex: 1,
  },
  laceFrame: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  invitePink: {
    marginTop: 60,
    color: P.hotPink,
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroInfo: {
    marginTop: 10,
    color: '#F0F0F0',
    fontSize: 18,
    lineHeight: 25,
    textAlign: 'center',
    fontWeight: '600',
  },
  blackPaperWrap: {
    backgroundColor: P.black,
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  paperCard: {
    aspectRatio: 930 / 1691,
    backgroundColor: P.paper,
    shadowColor: '#000',
    shadowOpacity: 0.36,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  paperBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  paperContent: {
    flex: 1,
  },
  paperFold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  paperNoiseOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0,0,0,0.035)',
    left: -60,
    top: 180,
    transform: [{ rotate: '-16deg' }],
  },
  paperNoiseTwo: {
    position: 'absolute',
    width: 240,
    height: 170,
    backgroundColor: 'rgba(255,255,255,0.38)',
    right: -40,
    bottom: 100,
    transform: [{ rotate: '12deg' }],
  },
  handMessage: {
    position: 'absolute',
    top: '12.5%',
    left: '11%',
    right: '11%',
    color: P.ink,
    fontFamily: HAND_FONT,
    fontSize: 19,
    lineHeight: 31,
    textAlign: 'center',
    fontWeight: '700',
    zIndex: 3,
  },
  paperLargePhotoWrap: {
    position: 'absolute',
    left: '9.4%',
    top: '54.8%',
    width: '45.2%',
    height: '33.4%',
    overflow: 'hidden',
    backgroundColor: '#D9D6D1',
    transform: [{ rotate: '-6.2deg' }],
    zIndex: 2,
  },
  paperSmallPhotoWrap: {
    position: 'absolute',
    right: '9.9%',
    top: '46.8%',
    width: '28.4%',
    height: '27.4%',
    overflow: 'hidden',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: '#6B6B69',
    zIndex: 2,
  },
  paperStamp: {
    position: 'absolute',
    left: '53.8%',
    top: '86.1%',
    width: '29%',
    height: '7.6%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '8deg' }],
    zIndex: 3,
  },
  paperStampText: {
    color: P.hotPink,
    fontFamily: SERIF_FONT,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    transform: [{ translateX: 3 }],
  },
  paperStampDate: {
    color: P.hotPink,
    fontFamily: SERIF_FONT,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  parentSection: { backgroundColor: '#F7B8CC', paddingTop: 58, paddingBottom: 68, overflow: 'hidden' },
  parentBgPhoto: {
    position: 'absolute',
  },
  parentBgPinkVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 139, 181, 0.34)',
  },
  parentBgWhiteWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  parentBlock: { minHeight: 760, paddingHorizontal: 34, alignItems: 'center', marginBottom: 42, zIndex: 2 },
  parentTitle: { color: P.ink, fontSize: 19, lineHeight: 27, fontWeight: '500', textAlign: 'center' },
  parentName: { color: P.ink, fontSize: 22, lineHeight: 30, fontWeight: '900', textAlign: 'center', marginBottom: 22 },
  parentPhotoFrame: {
    width: '92%',
    height: 280,
    backgroundColor: P.paper,
    padding: 12,
    paddingBottom: 16,
    marginTop: 6,
    marginBottom: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3,
  },
  parentPhotoFrameLeft: {
    alignSelf: 'flex-start',
    transform: [{ rotate: '-3deg' }],
  },
  parentPhotoFrameRight: {
    alignSelf: 'flex-end',
    transform: [{ rotate: '3deg' }],
  },
  tape: {
    position: 'absolute',
    width: 34,
    height: 78,
    opacity: 0.82,
    zIndex: 3,
  },
  tapeLeft: { left: -13, top: 34, transform: [{ rotate: '2deg' }] },
  tapeRight: { right: -13, top: 40, transform: [{ rotate: '-4deg' }] },
  memoPaper: {
    width: '100%',
    minHeight: 360,
    backgroundColor: '#FBF8E9',
    marginTop: -8,
    paddingHorizontal: 26,
    paddingTop: 36,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  memoPaperLined: { backgroundColor: '#FBFAEF' },
  memoPaperGrid: { backgroundColor: '#FAFBF2' },
  memoPaperLeft: { transform: [{ rotate: '-6deg' }] },
  memoPaperRight: { transform: [{ rotate: '6deg' }] },
  noteLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(97,146,174,0.24)',
  },
  noteMarginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 34,
    width: 1,
    backgroundColor: 'rgba(223,114,118,0.25)',
  },
  noteGridVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(99,157,176,0.2)',
  },
  noteGridHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(99,157,176,0.2)',
  },
  notePaperSmudge: {
    position: 'absolute',
    right: -48,
    bottom: -36,
    width: 170,
    height: 130,
    borderRadius: 85,
    backgroundColor: 'rgba(0,0,0,0.025)',
    transform: [{ rotate: '-12deg' }],
  },
  memoText: {
    color: P.ink,
    fontFamily: HAND_FONT,
    fontSize: 21,
    lineHeight: 34,
    fontWeight: '900',
    transform: [{ rotate: '-1deg' }],
  },
  galleryGrid: { backgroundColor: P.black, flexDirection: 'row', flexWrap: 'wrap' },
  galleryTile: { width: PAGE_W / 3, height: PAGE_W / 3 },
  fill: { width: '100%', height: '100%' },
  calendarSection: {
    backgroundColor: P.pink,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 38,
    overflow: 'hidden',
  },
  calendarDoodles: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.92,
    zIndex: 1,
  },
  calendarPaper: {
    backgroundColor: P.pink,
    paddingHorizontal: 4,
    overflow: 'hidden',
    zIndex: 2,
  },
  calendarTitle: {
    color: P.ink,
    fontFamily: SERIF_FONT,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  calendarTime: {
    color: P.ink,
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 21,
    fontStyle: 'italic',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 34,
  },
  calendarHead: { flexDirection: 'row', marginBottom: 18 },
  calendarHeadText: { flex: 1, color: P.ink, textAlign: 'center', fontFamily: SERIF_FONT, fontSize: 15, fontWeight: '900' },
  calendarDays: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: `${100 / 7}%`, height: 36, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { color: P.ink, fontFamily: SERIF_FONT, fontSize: 17, fontWeight: '700' },
  calendarSelected: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: P.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarSelectedText: { color: P.white },
  mapTitleSection: { backgroundColor: P.paper, paddingTop: 36, paddingBottom: 28, alignItems: 'center' },
  mapTitleImage: {
    width: Math.min(PAGE_W * 0.58, 250),
    height: Math.min(PAGE_W * 0.235, 101),
  },
  mapBox: { height: 270, backgroundColor: '#EDEDED' },
  locationInfo: { backgroundColor: P.paper, paddingBottom: 44 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: P.line },
  locationName: { color: P.ink, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  locationAddr: { color: P.ink, fontSize: 17, lineHeight: 25 },
  copyBtn: { backgroundColor: P.pink, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 12 },
  copyBtnText: { color: P.ink, fontSize: 15, fontWeight: '900' },
  accountSection: { backgroundColor: P.paper, paddingHorizontal: 22, paddingVertical: 48 },
  accountTitle: { color: P.ink, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  accountGroup: { marginBottom: 18 },
  accountHeader: { borderBottomWidth: 1, borderBottomColor: P.ink, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  accountHeaderText: { color: P.ink, fontSize: 16, fontWeight: '900' },
  accountHeaderAction: { color: P.muted, fontSize: 13, fontWeight: '800' },
  accountPerson: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: P.line },
  accountName: { color: P.ink, fontSize: 15, fontWeight: '900', marginBottom: 4 },
  accountValue: { color: P.muted, fontSize: 13, lineHeight: 20 },
  messageSection: { backgroundColor: P.paper, paddingHorizontal: 22, paddingBottom: 46 },
  messageCard: { borderBottomWidth: 1, borderBottomColor: P.line, paddingVertical: 14 },
  messageName: { color: P.ink, fontSize: 14, fontWeight: '900', marginBottom: 6 },
  messageText: { color: P.muted, fontSize: 14, lineHeight: 22 },
  darkButton: { marginTop: 18, backgroundColor: P.black, paddingVertical: 14, alignItems: 'center' },
  darkButtonText: { color: P.white, fontSize: 14, fontWeight: '900' },
  shareSection: { backgroundColor: P.paper, paddingHorizontal: 32, paddingBottom: 58, alignItems: 'center', gap: 12 },
  kakaoButton: { backgroundColor: '#FFEA00', borderRadius: 4, paddingHorizontal: 34, paddingVertical: 14 },
  kakaoText: { color: P.ink, fontSize: 14, fontWeight: '900' },
  urlButton: { backgroundColor: P.black, borderRadius: 4, paddingHorizontal: 28, paddingVertical: 14 },
  urlText: { color: P.white, fontSize: 14, fontWeight: '900' },
  copyright: { color: '#858585', fontSize: 11, marginTop: 24 },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  toastText: { color: P.white, fontSize: 13, fontWeight: '800' },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  modalClose: { position: 'absolute', right: 18, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  modalCloseText: { color: P.white, fontSize: 13, fontWeight: '900' },
  modalSlide: { width: W, alignItems: 'center', justifyContent: 'center' },
  modalImage: { width: W, height: '82%' },
  messageModalWrap: { flex: 1, justifyContent: 'flex-end' },
  messageDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.44)' },
  messageModal: { backgroundColor: P.paper, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 30 },
  messageModalTitle: { color: P.ink, fontSize: 18, fontWeight: '900', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: P.line, paddingHorizontal: 14, paddingVertical: 12, color: P.ink, fontSize: 14, marginBottom: 10 },
  textarea: { minHeight: 112, textAlignVertical: 'top' },
});
