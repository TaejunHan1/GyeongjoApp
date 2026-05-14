// src/screens/event/templates/wedding/PhotoBookTemplate.js
// 포토북 에디션 — 앨범형 모바일 청첩장
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
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
import { SvgXml } from 'react-native-svg';
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
  ringsRibbon: require('../../../../../assets/studio/elements/31-wedding ornament rings ribbon.png'),
  watercolorBouquet: require('../../../../../assets/studio/elements/32-wedding watercolor bouquet ornament.png'),
  bridalHeels: require('../../../../../assets/studio/elements/34-wedding bridal heels veil ornament.png'),
};
const INTRO_CLOUD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="86" viewBox="0 0 180 86" fill="none">
  <path d="M24 64.5C13.2 64.5 4.5 56.6 4.5 46.8C4.5 37.8 12 30.3 21.8 29.3C26 15.3 40 5.5 56.1 5.5C69.6 5.5 81.5 12.4 87.7 22.8C93 18.6 99.9 16.1 107.3 16.1C122.1 16.1 134.5 25.9 137.3 39.1C139 38.7 140.9 38.5 142.8 38.5C154.1 38.5 163.2 46.8 163.2 57C163.2 67.1 154.1 75.5 142.8 75.5H24Z" fill="rgba(255,255,255,0.88)"/>
  <path d="M38 70.5H153" stroke="rgba(198,175,139,0.34)" stroke-width="2" stroke-linecap="round"/>
</svg>`;
const INTRO_BOOK_W = Math.min(W - 128, 260);
const INTRO_BOOK_H = Math.min(INTRO_BOOK_W * 1.42, 370);
const INTRO_BOOK_COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="370" viewBox="0 0 260 370" fill="none">
  <defs>
    <linearGradient id="coverPaper" x1="0" y1="0" x2="260" y2="370" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF6E7"/>
      <stop offset="0.52" stop-color="#F1E0C5"/>
      <stop offset="1" stop-color="#D7B981"/>
    </linearGradient>
    <pattern id="linen" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M0 2.5H10M0 7.5H10M2.5 0V10M7.5 0V10" stroke="#BFAE91" stroke-opacity="0.18" stroke-width="0.8"/>
    </pattern>
    <filter id="softShadow" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#6D5338" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect x="15" y="8" width="230" height="354" rx="5" fill="url(#coverPaper)" filter="url(#softShadow)"/>
  <rect x="20" y="13" width="220" height="344" rx="4" fill="#F4E7CF"/>
  <rect x="20" y="13" width="220" height="344" rx="4" fill="url(#linen)"/>
  <path d="M33 17V353" stroke="#CDAF70" stroke-opacity="0.58" stroke-width="3"/>
  <path d="M39 18V352" stroke="#FFF8EA" stroke-opacity="0.58" stroke-width="1.3"/>
  <path d="M22 14H238M22 356H238M239 16V354" stroke="#B98F44" stroke-opacity="0.55" stroke-width="2"/>
  <g transform="translate(112 220)">
    <path d="M27 61C18 47 22 27 39 17C57 6 78 13 86 29C95 47 84 69 63 75C48 80 35 74 27 61Z" fill="#F9F1DE" stroke="#C3A35E" stroke-opacity="0.42"/>
    <path d="M43 33C56 18 78 24 81 42C84 60 66 72 51 67C35 61 32 45 43 33Z" fill="#FFF8E9" stroke="#D9BE7C" stroke-opacity="0.55"/>
    <circle cx="62" cy="47" r="13" fill="#D8B566"/>
    <path d="M61 18C56 38 57 55 67 75M37 26C48 41 58 48 83 51M44 72C55 60 67 54 90 45" stroke="#D6CDB6" stroke-width="3" stroke-linecap="round"/>
    <path d="M8 76C29 56 48 50 72 47M58 90C68 71 82 57 101 49M15 48C34 43 48 45 67 54" stroke="#849070" stroke-width="5" stroke-linecap="round"/>
    <path d="M6 77C14 68 24 67 31 72C22 80 14 83 6 77ZM53 91C58 78 68 73 79 75C72 87 63 93 53 91ZM16 48C27 42 37 44 44 51C33 57 24 57 16 48ZM88 49C96 38 106 35 116 39C111 51 101 56 88 49Z" fill="#98A07E" stroke="#6F755C" stroke-opacity="0.25"/>
    <circle cx="20" cy="67" r="7" fill="#FFF5DD" stroke="#D8BD80" stroke-opacity="0.45"/>
    <circle cx="36" cy="78" r="6" fill="#FFF5DD" stroke="#D8BD80" stroke-opacity="0.45"/>
    <circle cx="104" cy="42" r="5" fill="#FFF5DD" stroke="#D8BD80" stroke-opacity="0.45"/>
  </g>
</svg>`;
const INTRO_BOOK_PAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="370" viewBox="0 0 260 370" fill="none">
  <defs>
    <linearGradient id="pageGrad" x1="0" y1="0" x2="260" y2="370" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFDF5"/>
      <stop offset="1" stop-color="#F4E8D4"/>
    </linearGradient>
    <pattern id="pageGrain" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 3H12M0 9H12" stroke="#C9B999" stroke-opacity="0.12" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect x="10" y="12" width="240" height="346" rx="7" fill="url(#pageGrad)"/>
  <rect x="10" y="12" width="240" height="346" rx="7" fill="url(#pageGrain)"/>
  <path d="M22 30H235M22 50H235M22 70H235" stroke="#C8B48E" stroke-opacity="0.12" stroke-width="1.2"/>
  <path d="M12 13H248M12 357H248" stroke="#BFA16A" stroke-opacity="0.32" stroke-width="2"/>
</svg>`;
const INTRO_INVITE_CARD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="370" viewBox="0 0 260 370" fill="none">
  <defs>
    <linearGradient id="invitePaper" x1="0" y1="0" x2="260" y2="370" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFDF7"/>
      <stop offset="1" stop-color="#F4E7D3"/>
    </linearGradient>
    <pattern id="inviteGrain" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 4H12M4 0V12" stroke="#D6C4A2" stroke-opacity="0.13" stroke-width="0.8"/>
    </pattern>
    <filter id="cardShadow" x="-20%" y="-10%" width="140%" height="125%">
      <feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#7B5B35" flood-opacity="0.13"/>
    </filter>
  </defs>
  <rect x="20" y="10" width="220" height="350" rx="10" fill="url(#invitePaper)" filter="url(#cardShadow)"/>
  <rect x="20" y="10" width="220" height="350" rx="10" fill="url(#inviteGrain)"/>
  <rect x="33" y="25" width="194" height="320" rx="7" stroke="#CBAA62" stroke-opacity="0.46" stroke-width="1.5"/>
  <path d="M68 83C85 63 104 55 128 59C152 55 173 65 190 83" stroke="#B8A37B" stroke-opacity="0.34" stroke-width="2" stroke-linecap="round"/>
  <path d="M73 294C94 313 114 318 131 313C151 319 171 313 190 294" stroke="#B8A37B" stroke-opacity="0.34" stroke-width="2" stroke-linecap="round"/>
  <g transform="translate(86 58)">
    <circle cx="43" cy="31" r="18" stroke="#C7A45C" stroke-width="3" fill="none"/>
    <circle cx="62" cy="31" r="18" stroke="#D5B76F" stroke-width="3" fill="none"/>
    <path d="M53 8L58 1L63 8" stroke="#C7A45C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <path d="M78 258H182" stroke="#CBAA62" stroke-opacity="0.36" stroke-width="1.2"/>
</svg>`;
const INTRO_ENVELOPE_BACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="230" viewBox="0 0 330 230" fill="none">
  <defs>
    <linearGradient id="envBack" x1="0" y1="0" x2="330" y2="230" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF9EE"/>
      <stop offset="1" stop-color="#E8CF9F"/>
    </linearGradient>
    <filter id="envShadow" x="-10%" y="-20%" width="120%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#71512B" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect x="17" y="52" width="296" height="154" rx="14" fill="url(#envBack)" filter="url(#envShadow)"/>
  <path d="M21 62L164 150L309 62" stroke="#C5A36A" stroke-opacity="0.35" stroke-width="2"/>
  <path d="M32 195L128 126M298 195L202 126" stroke="#C5A36A" stroke-opacity="0.25" stroke-width="2"/>
</svg>`;
const INTRO_ENVELOPE_FRONT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="230" viewBox="0 0 330 230" fill="none">
  <defs>
    <linearGradient id="envFront" x1="0" y1="0" x2="330" y2="230" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F8E8C9"/>
      <stop offset="1" stop-color="#D7B36F"/>
    </linearGradient>
  </defs>
  <path d="M18 74L162 166L312 74V197C312 205 305 212 297 212H33C25 212 18 205 18 197V74Z" fill="url(#envFront)"/>
  <path d="M18 74L158 167C162 170 168 170 172 167L312 74" stroke="#A98643" stroke-opacity="0.32" stroke-width="2"/>
  <path d="M35 198L128 135M295 198L202 135" stroke="#FFF3D6" stroke-opacity="0.35" stroke-width="2"/>
</svg>`;
const INTRO_ENVELOPE_FLAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="160" viewBox="0 0 330 160" fill="none">
  <defs>
    <linearGradient id="envFlap" x1="0" y1="0" x2="330" y2="160" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF4DC"/>
      <stop offset="1" stop-color="#E5C58A"/>
    </linearGradient>
  </defs>
  <path d="M22 142L151 31C159 24 171 24 179 31L308 142H22Z" fill="url(#envFlap)"/>
  <path d="M42 134L154 42C160 37 170 37 176 42L288 134" stroke="#C29B52" stroke-opacity="0.35" stroke-width="2"/>
</svg>`;
const INTRO_RINGS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="94" height="58" viewBox="0 0 94 58" fill="none">
  <circle cx="36" cy="32" r="20" stroke="#C39A45" stroke-width="5"/>
  <circle cx="58" cy="32" r="20" stroke="#D7B86C" stroke-width="5"/>
  <path d="M45 8L51 1L57 8" stroke="#C39A45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const INTRO_ARCH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="430" viewBox="0 0 330 430" fill="none">
  <defs>
    <linearGradient id="archGold" x1="50" y1="30" x2="280" y2="410" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F1D694"/>
      <stop offset="0.54" stop-color="#C59A45"/>
      <stop offset="1" stop-color="#8E682D"/>
    </linearGradient>
    <radialGradient id="archGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(165 215) rotate(90) scale(195 138)">
      <stop stop-color="#FFF6DD" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#FFF6DD" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="165" cy="236" rx="124" ry="170" fill="url(#archGlow)"/>
  <path d="M66 396V178C66 89 110 42 165 42C220 42 264 89 264 178V396" stroke="url(#archGold)" stroke-width="5" stroke-linecap="round"/>
  <path d="M88 398V185C88 111 122 72 165 72C208 72 242 111 242 185V398" stroke="#EAD6A4" stroke-opacity="0.48" stroke-width="2" stroke-linecap="round"/>
  <path d="M48 398H282" stroke="#C59A45" stroke-opacity="0.62" stroke-width="3" stroke-linecap="round"/>
  <path d="M88 128C116 98 139 88 165 88C191 88 215 98 242 128" stroke="#F8E8B8" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"/>
</svg>`;
const INTRO_CURTAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="430" viewBox="0 0 170 430" fill="none">
  <defs>
    <linearGradient id="curtain" x1="0" y1="0" x2="170" y2="430" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF7ED" stop-opacity="0.96"/>
      <stop offset="0.48" stop-color="#E9CFAE" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#B99063" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <path d="M0 0H162C141 77 132 148 142 214C151 276 140 350 166 430H0V0Z" fill="url(#curtain)"/>
  <path d="M39 0C31 90 35 173 51 249C61 301 55 359 73 430M88 0C72 97 78 183 95 260C107 315 99 366 120 430M132 0C118 88 122 162 139 227C153 282 145 352 164 430" stroke="#FFF8EA" stroke-opacity="0.42" stroke-width="2"/>
  <path d="M10 0C22 83 25 155 19 217C12 286 18 356 34 430" stroke="#A67545" stroke-opacity="0.14" stroke-width="3"/>
</svg>`;

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

function IntroCloud({ top, size, delay = 0, duration = 30000, opacity = 0.55 }) {
  const x = useRef(new Animated.Value(-size)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(x, {
        toValue: W + size,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(x, { toValue: -size, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [delay, duration, size, x]);

  return (
    <Animated.View style={[s.introCloud, { top, opacity, transform: [{ translateX: x }] }]}>
      <SvgXml xml={INTRO_CLOUD_SVG} width={size} height={size * 0.48} />
    </Animated.View>
  );
}

const getTouchDistance = (touches = []) => {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  const dx = (a.pageX || 0) - (b.pageX || 0);
  const dy = (a.pageY || 0) - (b.pageY || 0);
  return Math.sqrt(dx * dx + dy * dy);
};

export default function PhotoBookTemplate({
  eventData = {},
  categorizedImages = {},
  allowMessages,
  messageSettings,
  selectedPhotoFrame,
  frameAdjusting = false,
  onPhotoFrameAdjust,
}) {
  const insets = useSafeAreaInsets();
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [toast, setToast] = useState('');
  const [activeAccount, setActiveAccount] = useState(null);
  const [mapCoord, setMapCoord] = useState(null);
  const [guestBookOpen, setGuestBookOpen] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const introOpenAnim = useRef(new Animated.Value(0)).current;
  const introOpacity = useRef(new Animated.Value(1)).current;
  const introHintOpacity = useRef(new Animated.Value(1)).current;
  const introBookFloatY = useRef(new Animated.Value(0)).current;
  const introPlayingRef = useRef(false);
  const [selectedImageGroup, setSelectedImageGroup] = useState('gallery');
  const imageModalScrollRef = useRef(null);
  const imageViewerClosingRef = useRef(false);
  const [gbName, setGbName] = useState('');
  const [gbMessage, setGbMessage] = useState('');
  const [guestMessages, setGuestMessages] = useState([
    { name: '친구', message: '두 분의 아름다운 시작을 진심으로 축하합니다.', time: '방금 전' },
    { name: '동료', message: '평생 서로에게 가장 따뜻한 계절이 되어주세요.', time: '1시간 전' },
  ]);
  const selectedFrameRef = useRef(selectedPhotoFrame);
  const adjustFrameRef = useRef(onPhotoFrameAdjust);
  const frameAdjustingRef = useRef(frameAdjusting);
  const frameGestureStartRef = useRef({ scale: 0.78, offsetX: 0, offsetY: 0, distance: 0 });

  useEffect(() => {
    selectedFrameRef.current = selectedPhotoFrame;
  }, [selectedPhotoFrame]);

  useEffect(() => {
    adjustFrameRef.current = onPhotoFrameAdjust;
  }, [onPhotoFrameAdjust]);

  useEffect(() => {
    frameAdjustingRef.current = frameAdjusting;
  }, [frameAdjusting]);

  const framePanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => frameAdjustingRef.current && !!selectedFrameRef.current?.source,
    onMoveShouldSetPanResponder: () => frameAdjustingRef.current && !!selectedFrameRef.current?.source,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (evt) => {
      const frame = selectedFrameRef.current || {};
      const touches = evt.nativeEvent?.touches || [];
      frameGestureStartRef.current = {
        scale: frame.scale || 0.78,
        offsetX: frame.offsetX || 0,
        offsetY: frame.offsetY || 0,
        distance: getTouchDistance(touches),
      };
    },
    onPanResponderMove: (evt, gestureState) => {
      const start = frameGestureStartRef.current;
      const touches = evt.nativeEvent?.touches || [];
      if (touches.length >= 2) {
        const distance = getTouchDistance(touches);
        if (distance <= 0) return;
        if (start.distance <= 0) {
          const frame = selectedFrameRef.current || {};
          frameGestureStartRef.current = {
            scale: frame.scale || 0.78,
            offsetX: frame.offsetX || 0,
            offsetY: frame.offsetY || 0,
            distance,
          };
          return;
        }
        adjustFrameRef.current?.({ scale: start.scale * (distance / start.distance) });
        return;
      }
      adjustFrameRef.current?.({
        offsetX: start.offsetX + gestureState.dx,
        offsetY: start.offsetY + gestureState.dy,
      });
    },
  })).current;

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

  useEffect(() => {
    if (!introVisible) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(introHintOpacity, { toValue: 0.35, duration: 760, useNativeDriver: true }),
      Animated.timing(introHintOpacity, { toValue: 1, duration: 760, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [introVisible, introHintOpacity]);

  useEffect(() => {
    if (!introVisible) return undefined;
    let rafId;
    const start = Date.now();
    const tick = () => {
      const t = ((Date.now() - start) % 4600) / 4600;
      introBookFloatY.setValue(Math.sin(t * Math.PI * 2) * 5);
      rafId = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [introBookFloatY, introVisible]);

  const openPhotoBookIntro = () => {
    if (introPlayingRef.current) return;
    introPlayingRef.current = true;
    introOpenAnim.setValue(0);

    Animated.sequence([
      Animated.timing(introOpenAnim, {
        toValue: 1,
        duration: 1550,
        easing: Easing.bezier(0.22, 0.78, 0.22, 1),
        useNativeDriver: true,
      }),
      Animated.delay(220),
      Animated.timing(introOpacity, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setContentVisible(true);
      requestAnimationFrame(() => setIntroVisible(false));
    });
  };

  const mainImages = safeImages.main?.length ? safeImages.main : defaultImages.slice(0, 2);
  const galleryImages = safeImages.gallery?.length ? safeImages.gallery : defaultImages.slice(2, 10);
  const mainImage = mainImages[0];
  const modalImages = selectedImageGroup === 'main' ? mainImages : galleryImages;

  useEffect(() => {
    if (!introVisible) return undefined;
    const prefetches = [mainImage, ...galleryImages.slice(0, 6)]
      .map(getImageSource)
      .filter(source => typeof source?.uri === 'string')
      .map(source => Image.prefetch(source.uri).catch(() => false));
    Promise.all(prefetches).catch(() => {});
    return undefined;
  }, [galleryImages, introVisible, mainImage]);

  useEffect(() => {
    setHeroImageLoaded(false);
  }, [mainImage]);

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
      {contentVisible && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={!frameAdjusting}
          contentContainerStyle={{ paddingBottom: insets.bottom + 76 }}
        >
          <View style={[s.hero, { paddingTop: insets.top + 24 }]}>
            <TouchableOpacity
              activeOpacity={frameAdjusting ? 1 : 0.92}
              onPress={frameAdjusting ? undefined : () => openImageViewer('main', 0)}
              style={s.coverPhotoCard}
            >
              {!heroImageLoaded && <View style={s.coverPhotoSkeleton} />}
              <Image
                source={getImageSource(mainImage)}
                style={[s.coverPhoto, !heroImageLoaded && s.coverPhotoHidden]}
                resizeMode="cover"
                onLoadEnd={() => setHeroImageLoaded(true)}
              />
              {selectedPhotoFrame?.source && (
                <View
                  style={[s.coverFrameLayer, frameAdjusting && s.coverFrameLayerActive]}
                  pointerEvents={frameAdjusting ? 'auto' : 'none'}
                  {...(frameAdjusting ? framePanResponder.panHandlers : {})}
                >
                  <Image
                    source={selectedPhotoFrame.source}
                    style={[
                      s.coverFrameOverlay,
                      {
                        width: `${(selectedPhotoFrame.scale || 0.78) * 100}%`,
                        height: `${(selectedPhotoFrame.scale || 0.78) * 100}%`,
                        transform: [
                          { translateX: selectedPhotoFrame.offsetX || 0 },
                          { translateY: selectedPhotoFrame.offsetY || 0 },
                        ],
                      },
                    ]}
                    resizeMode="contain"
                  />
                </View>
              )}
            </TouchableOpacity>
            <View style={s.coverMeta}>
              <Image source={DECOR.watercolorBouquet} style={s.coverBouquetDecor} resizeMode="contain" />
              <Image source={DECOR.bridalHeels} style={s.coverHeelsDecor} resizeMode="contain" />
              <View style={s.coverMetaInner}>
                <View style={s.coverLabelWrap}>
                  <View style={s.coverLabelLine} />
                  <Text style={s.coverMetaLabel}>Wedding Invitation</Text>
                  <View style={s.coverLabelLine} />
                </View>
                <View style={s.coverNameBlock}>
                  <Text style={s.coverName} numberOfLines={1}>{groomName}</Text>
                  <View style={s.coverRingsWrap}>
                    <Image source={DECOR.ringsRibbon} style={s.coverRings} resizeMode="contain" />
                  </View>
                  <Text style={s.coverName} numberOfLines={1}>{brideName}</Text>
                </View>
                <Text style={s.coverDate}>{dateLine}</Text>
              </View>
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
                  onPress={() => openImageViewer('gallery', i)}
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
      )}

      {contentVisible && !!toast && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}

      <Modal visible={contentVisible && selectedImageIndex !== null} transparent animationType="fade">
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

      <Modal visible={contentVisible && guestBookOpen} transparent animationType="fade">
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

      {introVisible && (
        <Animated.View style={[s.photoBookIntroLayer, { opacity: introOpacity }]}>
          <View style={s.photoBookIntroSky} pointerEvents="none">
            <IntroCloud top="9%" size={170} delay={0} duration={34000} opacity={0.38} />
            <IntroCloud top="25%" size={220} delay={9000} duration={39000} opacity={0.28} />
            <IntroCloud top="72%" size={145} delay={4200} duration={31000} opacity={0.32} />
            <Image source={DECOR.babyBreath} style={s.introFloatingFlowerA} resizeMode="contain" />
            <Image source={DECOR.leafSmall} style={s.introFloatingLeaf} resizeMode="contain" />
          </View>
          <View pointerEvents="none" style={s.photoBookIntroPreloader}>
            {[mainImage, ...galleryImages.slice(0, 6)].filter(Boolean).map((img, index) => (
              <Image
                key={`photobook-content-preload-${index}`}
                source={getImageSource(img)}
                style={s.photoBookIntroPreloadImage}
                resizeMode="cover"
                onLoadEnd={index === 0 ? () => setHeroImageLoaded(true) : undefined}
              />
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.96} style={s.photoBookIntroTouch} onPress={openPhotoBookIntro}>
            <Animated.View style={[s.photoBookIntroStage, { transform: [{ translateY: introBookFloatY }] }]}>
              <Animated.View
                style={[
                  s.stageIntroArch,
                  {
                    opacity: introOpenAnim.interpolate({
                      inputRange: [0, 0.26, 1],
                      outputRange: [0.42, 0.82, 1],
                    }),
                    transform: [
                      {
                        scale: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.96, 1.02],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <SvgXml xml={INTRO_ARCH_SVG} width={330} height={430} />
              </Animated.View>
              <Animated.View
                style={[
                  s.stageIntroCurtainLeft,
                  {
                    opacity: introOpenAnim.interpolate({
                      inputRange: [0, 0.72, 1],
                      outputRange: [1, 0.88, 0],
                    }),
                    transform: [
                      {
                        scaleX: -1,
                      },
                      {
                        translateX: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -132],
                        }),
                      },
                      {
                        rotateZ: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-5deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <SvgXml xml={INTRO_CURTAIN_SVG} width={170} height={430} />
              </Animated.View>
              <Animated.View
                style={[
                  s.stageIntroCurtainRight,
                  {
                    opacity: introOpenAnim.interpolate({
                      inputRange: [0, 0.72, 1],
                      outputRange: [1, 0.88, 0],
                    }),
                    transform: [
                      {
                        translateX: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 132],
                        }),
                      },
                      {
                        rotateZ: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '5deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <SvgXml xml={INTRO_CURTAIN_SVG} width={170} height={430} />
              </Animated.View>
              <Animated.View
                style={[
                  s.stageIntroCard,
                  {
                    opacity: introOpenAnim.interpolate({
                      inputRange: [0, 0.28, 0.78, 1],
                      outputRange: [0, 0.18, 0.92, 1],
                    }),
                    transform: [
                      {
                        translateY: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [72, -6],
                        }),
                      },
                      {
                        scale: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.88, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <SvgXml xml={INTRO_INVITE_CARD_SVG} width={INTRO_BOOK_W} height={INTRO_BOOK_H} />
                <View style={s.weddingIntroCardText}>
                  <Text style={s.weddingIntroCardLabel}>WEDDING INVITATION</Text>
                  <Text style={s.weddingIntroCardNames}>{groomName} & {brideName}</Text>
                  <Text style={s.weddingIntroCardDate}>{dateLine}</Text>
                </View>
              </Animated.View>
              <Animated.View
                style={[
                  s.stageIntroRings,
                  {
                    opacity: introOpenAnim.interpolate({
                      inputRange: [0, 0.4, 1],
                      outputRange: [0, 0.4, 1],
                    }),
                    transform: [
                      {
                        translateY: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, -68],
                        }),
                      },
                      {
                        scale: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.72, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <SvgXml xml={INTRO_RINGS_SVG} width={94} height={58} />
              </Animated.View>
              <Animated.Text
                style={[
                  s.stageIntroTitle,
                  {
                    opacity: introOpenAnim.interpolate({
                      inputRange: [0, 0.32, 1],
                      outputRange: [0, 0.24, 1],
                    }),
                    transform: [
                      {
                        translateY: introOpenAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [18, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                결혼식에 초대합니다
              </Animated.Text>
              {[0, 1, 2, 3, 4, 5].map((dot) => (
                <Animated.View
                  key={`wedding-intro-spark-${dot}`}
                  style={[
                    s.weddingIntroSparkle,
                    {
                      opacity: introOpenAnim.interpolate({
                        inputRange: [0, 0.38, 0.86, 1],
                        outputRange: [0, 0, 1, 0],
                      }),
                      transform: [
                        {
                          translateX: introOpenAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, [-116, 118, -78, 82, -30, 34][dot]],
                          }),
                        },
                        {
                          translateY: introOpenAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [36, [-126, -118, -76, -66, -22, -18][dot]],
                          }),
                        },
                        {
                          scale: introOpenAnim.interpolate({
                            inputRange: [0, 0.66, 1],
                            outputRange: [0.4, 1, 0.7],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </Animated.View>
            <Animated.View style={[s.photoBookIntroHintPill, { opacity: introHintOpacity }]}>
              <Text style={s.photoBookIntroHint}>앨범 열기</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  fill: { width: '100%', height: '100%' },
  hero: { paddingHorizontal: 24, paddingBottom: 46, backgroundColor: P.bg },
  coverPhotoCard: {
    width: '100%',
    height: Math.min(W * 1.16, 520),
    backgroundColor: P.paper,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(36,33,30,0.12)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  coverPhoto: { width: '100%', height: '100%', zIndex: 1 },
  coverPhotoHidden: { opacity: 0 },
  coverPhotoSkeleton: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    backgroundColor: P.mist,
    zIndex: 0,
  },
  coverFrameLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    elevation: 5,
  },
  coverFrameLayerActive: {
    borderWidth: 1,
    borderColor: 'rgba(156,115,94,0.45)',
  },
  coverFrameOverlay: {},
  coverMeta: {
    marginTop: 18,
    marginHorizontal: IS_TABLET ? 26 : 4,
    minHeight: 176,
    backgroundColor: 'rgba(255,253,249,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(156,115,94,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#4C3A2F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  coverMetaInner: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? 44 : 24,
    paddingVertical: 25,
    zIndex: 2,
  },
  coverBouquetDecor: {
    position: 'absolute',
    width: IS_TABLET ? 144 : 112,
    height: IS_TABLET ? 144 : 112,
    right: -24,
    top: -24,
    opacity: 0.52,
    transform: [{ rotate: '8deg' }],
  },
  coverHeelsDecor: {
    position: 'absolute',
    width: IS_TABLET ? 132 : 104,
    height: IS_TABLET ? 132 : 104,
    left: -28,
    bottom: -34,
    opacity: 0.34,
    transform: [{ rotate: '-10deg' }],
  },
  coverLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 15,
  },
  coverLabelLine: {
    width: 34,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(156,115,94,0.42)',
  },
  coverMetaLabel: {
    color: P.clay,
    fontSize: 10,
    letterSpacing: 2.8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  coverNameBlock: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IS_TABLET ? 18 : 12,
  },
  coverName: {
    flexShrink: 1,
    maxWidth: '34%',
    color: P.deep,
    fontSize: IS_TABLET ? 31 : 26,
    fontWeight: '300',
    lineHeight: IS_TABLET ? 38 : 33,
    textAlign: 'center',
    letterSpacing: 1.4,
  },
  coverRingsWrap: {
    width: IS_TABLET ? 78 : 64,
    height: IS_TABLET ? 54 : 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverRings: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  coverDate: {
    color: P.clay,
    fontSize: 11,
    letterSpacing: 2.6,
    fontWeight: '900',
  },
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
  imageModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageModalClose: { position: 'absolute', left: 16, zIndex: 10, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
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
  modalDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { backgroundColor: P.paper, padding: 24, gap: 12 },
  modalTitle: { color: P.ink, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  input: { borderWidth: 1, borderColor: P.line, color: P.ink, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  submitButton: { backgroundColor: P.ink, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { color: P.paper, fontSize: 15, fontWeight: '800' },
  photoBookIntroLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: '#EFE8DD',
    overflow: 'hidden',
  },
  photoBookIntroSky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EFE8DD',
  },
  introCloud: {
    position: 'absolute',
    left: 0,
  },
  introFloatingFlowerA: {
    position: 'absolute',
    right: -20,
    top: '15%',
    width: 120,
    height: 120,
    opacity: 0.2,
    transform: [{ rotate: '-14deg' }],
  },
  introFloatingLeaf: {
    position: 'absolute',
    left: 26,
    bottom: '18%',
    width: 72,
    height: 72,
    opacity: 0.26,
    transform: [{ rotate: '18deg' }],
  },
  photoBookIntroTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  photoBookIntroStage: {
    width: Math.min(W - 40, 430),
    height: Math.min((W - 40) * 1.2, 500),
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBookIntroBookShadow: {
    position: 'absolute',
    width: '78%',
    height: '74%',
    borderRadius: 180,
    backgroundColor: 'rgba(126,94,54,0.10)',
    transform: [{ translateY: 54 }],
    shadowColor: '#4C3A2F',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 3,
  },
  stageIntroArch: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stageIntroCurtainLeft: {
    position: 'absolute',
    left: '50%',
    marginLeft: -166,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  stageIntroCurtainRight: {
    position: 'absolute',
    right: '50%',
    marginRight: -166,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  stageIntroCard: {
    position: 'absolute',
    width: INTRO_BOOK_W,
    height: INTRO_BOOK_H,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  stageIntroRings: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  stageIntroTitle: {
    position: 'absolute',
    bottom: 38,
    color: P.deep,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
    zIndex: 6,
  },
  weddingIntroEnvelopeBack: {
    position: 'absolute',
    left: '50%',
    marginLeft: -165,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  weddingIntroCard: {
    position: 'absolute',
    width: INTRO_BOOK_W,
    height: INTRO_BOOK_H,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  weddingIntroCardText: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 126,
    alignItems: 'center',
  },
  weddingIntroCardLabel: {
    color: P.clay,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
    marginBottom: 20,
  },
  weddingIntroCardNames: {
    color: P.deep,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '400',
    textAlign: 'center',
  },
  weddingIntroCardDate: {
    color: P.sub,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 18,
  },
  weddingIntroEnvelopeFlap: {
    position: 'absolute',
    left: '50%',
    marginLeft: -165,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  weddingIntroEnvelopeFront: {
    position: 'absolute',
    left: '50%',
    marginLeft: -165,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  weddingIntroRingSeal: {
    position: 'absolute',
    left: '50%',
    marginLeft: -47,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  weddingIntroSparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBAA62',
    zIndex: 7,
  },
  photoBookIntroSeal: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,253,249,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(151,126,83,0.28)',
    zIndex: 6,
  },
  photoBookIntroSealText: {
    color: P.clay,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  photoBookIntroPreloader: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  photoBookIntroPreloadImage: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  photoBookIntroHintPill: {
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,253,249,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(151,126,83,0.28)',
  },
  photoBookIntroHint: {
    color: P.sub,
    fontSize: 13,
    letterSpacing: 1.8,
    fontWeight: '800',
  },
});
