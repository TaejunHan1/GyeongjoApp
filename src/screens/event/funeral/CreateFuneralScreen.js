// src/screens/event/funeral/CreateFuneralScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Modal,
  Animated,
  Easing,
  PanResponder,
  DeviceEventEmitter,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { createEvent, uploadImageToStorage, deleteImageFromStorage, getCurrentUserInfo, moveImagesToEventFolder, refundEventCreationCredit, updateEvent, getEventDetail,
} from '../../../lib/supabaseHelper';
import DaumPostcode from '../../../components/DaumPostcode';
import FuneralTemplatePreview from '../templates/FuneralTemplatePreview';

const { width, height } = Dimensions.get('window');
const calendarDaySize = Math.floor((width - 40) / 7);

// 토스 컬러 시스템
const TossColors = {
  primary: '#4A88FF',
  secondary: '#F8FAFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#191F28',
  textSecondary: '#8B95A1',
  textTertiary: '#C1C8D0',
  border: '#F2F4F6',
  success: '#26C976',
  warning: '#FFB800',
  error: '#FF6B6B',
  disabled: '#F2F4F6',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

const MAIN_IMAGE_LAYOUT_DEFAULT = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  baseWidth: null,
};
const MEMORIAL_TEXT_LAYOUT_DEFAULT = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  baseWidth: null,
};
const MEMORIAL_NAME_LAYOUT_DEFAULT = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  baseWidth: null,
};
const MEMORIAL_DATE_LAYOUT_DEFAULT = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  baseWidth: null,
};
const MAIN_IMAGE_MIN_SCALE = 0.25;
const MAIN_IMAGE_MAX_SCALE = 3;
const MAIN_IMAGE_TRANSLATE_LIMIT = 5000;
const MEMORIAL_TEXT_MIN_SCALE = 0.35;
const MEMORIAL_TEXT_MAX_SCALE = 1.8;
const MEMORIAL_TEXT_TRANSLATE_LIMIT = 500;

const FUNERAL_STEP_COUNT = 3;

const getStoredImageIdentity = (image) => (
  image?.storagePath ||
  image?.publicUrl ||
  image?.originalUri ||
  image?.uri ||
  image?.id ||
  ''
);

const normalizeStoredFuneralImageForEdit = (img, index, fallbackCategory = 'all', fallbackLabel = null) => {
  const uri = typeof img === 'string'
    ? img
    : (img?.uri || img?.publicUrl || img?.url || img?.originalUri || null);
  const category = typeof img === 'object' ? (img.category || fallbackCategory) : fallbackCategory;
  return {
    ...(typeof img === 'object' ? img : {}),
    uri,
    originalUri: typeof img === 'object' ? (img.originalUri || uri) : uri,
    publicUrl: typeof img === 'string' ? img : (img?.publicUrl || uri || null),
    category,
    categoryLabel: typeof img === 'object' ? (img.categoryLabel || fallbackLabel) : fallbackLabel,
    id: typeof img === 'object' ? (img.id || `edit_${category}_${index}`) : `edit_${category}_${index}`,
  };
};

const flattenStoredFuneralCategorizedImages = (categorizedImages = {}) => {
  if (!categorizedImages || typeof categorizedImages !== 'object') return [];
  const labels = { main: '고인 사진', gallery: '갤러리' };
  return ['main', 'gallery', 'all'].flatMap((category) => {
    const list = categorizedImages[category];
    if (!Array.isArray(list)) return [];
    return list.map((img, index) => normalizeStoredFuneralImageForEdit(img, index, category, labels[category] || null));
  });
};

const dedupeStoredFuneralImages = (images = []) => {
  const seen = new Set();
  return images.filter((image) => {
    const key = getStoredImageIdentity(image);
    if (!key) return true;
    const scopedKey = `${image?.category || 'all'}:${key}`;
    if (seen.has(scopedKey)) return false;
    seen.add(scopedKey);
    return true;
  });
};

const MEMORIAL_TEXT_FONT_OPTIONS = [
  // 종이 청첩장 디자이너와 동일한 폰트 옵션
  {
    id: 'serif',
    label: '명조',
    name: '명조',
    sample: '가나',
    description: '정갈하고 차분한 기본 명조체',
    fontFamily: 'NanumMyeongjo',
    script: 'ko',
  },
  {
    id: 'sans',
    label: '고딕',
    name: '고딕',
    sample: '가나',
    description: '모바일에서 또렷하게 읽히는 고딕체',
    fontFamily: 'GowunDodum',
    script: 'ko',
  },
  {
    id: 'nanum-myeongjo',
    label: '나눔명조',
    name: '나눔명조',
    sample: '가나',
    description: '부고장에 잘 맞는 단정한 명조체',
    fontFamily: 'NanumMyeongjo',
    script: 'ko',
  },
  {
    id: 'hahmlet',
    label: '함렛',
    name: '함렛',
    sample: '가나',
    description: '획이 안정적인 문예적인 글꼴',
    fontFamily: 'Hahmlet',
    script: 'ko',
  },
  {
    id: 'gowun-batang',
    label: '고운바탕',
    name: '고운바탕',
    sample: '가나',
    description: '한글 본문과 이름에 모두 어울리는 바탕체',
    fontFamily: 'GowunBatang',
    script: 'ko',
  },
  {
    id: 'gowun-dodum',
    label: '고운돋움',
    name: '고운돋움',
    sample: '가나',
    description: '부드럽고 깨끗한 돋움체',
    fontFamily: 'GowunDodum',
    script: 'ko',
  },
  {
    id: 'sunflower',
    label: '선플라워',
    name: '선플라워',
    sample: '가나',
    description: '얇고 담백한 분위기의 한글 글꼴',
    fontFamily: 'Sunflower',
    script: 'ko',
  },
  {
    id: 'black-han',
    label: '블랙한산스',
    name: '블랙한산스',
    sample: '가나',
    description: '강한 제목용 글꼴',
    fontFamily: 'BlackHanSans',
    script: 'ko',
  },
  {
    id: 'yeon-sung',
    label: '연성',
    name: '연성',
    sample: '가나',
    description: '손글씨 느낌이 있는 한글 글꼴',
    fontFamily: 'YeonSung',
    script: 'ko',
  },
  {
    id: 'single-day',
    label: '싱글데이',
    name: '싱글데이',
    sample: '가나',
    description: '둥글고 가벼운 손글씨 글꼴',
    fontFamily: 'SingleDay',
    script: 'ko',
  },
  {
    id: 'playfair',
    label: 'Playfair',
    name: 'Playfair',
    sample: 'Aa',
    description: '숫자 날짜에 어울리는 영문 세리프',
    fontFamily: 'PlayfairDisplay',
    script: 'latin',
  },
  {
    id: 'garamond',
    label: 'Garamond',
    name: 'Garamond',
    sample: 'Aa',
    description: '숫자 날짜에 어울리는 고전적인 영문 세리프',
    fontFamily: 'EBGaramond',
    script: 'latin',
  },
  {
    id: 'cinzel',
    label: 'Cinzel',
    name: 'Cinzel',
    sample: 'Aa',
    description: '숫자 날짜에 어울리는 격식 있는 영문 글꼴',
    fontFamily: 'Cinzel',
    script: 'latin',
  },
  {
    id: 'great-vibes',
    label: 'Vibes',
    name: 'Vibes',
    sample: 'Aa',
    description: '숫자 날짜에 어울리는 우아한 영문 스크립트',
    fontFamily: 'Great Vibes',
    script: 'latin',
  },
  {
    id: 'italianno',
    label: 'Italianno',
    name: 'Italianno',
    sample: 'Aa',
    description: '숫자 날짜에 어울리는 섬세한 영문 필기체',
    fontFamily: 'Italianno',
    script: 'latin',
  },
  {
    id: 'dancing',
    label: 'Dancing',
    name: 'Dancing',
    sample: 'Aa',
    description: '숫자 날짜에 어울리는 자연스러운 영문 손글씨',
    fontFamily: 'DancingScript',
    script: 'latin',
  },
  {
    id: 'tangerine',
    label: 'Tangerine',
    name: 'Tangerine',
    sample: 'Aa',
    description: '숫자 날짜에 어울리는 가늘고 장식적인 영문 필기체',
    fontFamily: 'Tangerine',
    script: 'latin',
  },
];

const MEMORIAL_TEXT_COLOR_OPTIONS = [
  { id: 'ink', label: '먹', value: '#222222' },
  { id: 'charcoal', label: '차콜', value: '#444444' },
  { id: 'gray', label: '회색', value: '#666666' },
  { id: 'lightgray', label: '연회색', value: '#9AA1AA' },
  { id: 'white', label: '흰색', value: '#FFFFFF' },
  { id: 'black', label: '검정', value: '#000000' },
  { id: 'brown', label: '브라운', value: '#4A3428' },
  { id: 'mocha', label: '모카', value: '#6B4A3A' },
  { id: 'gold', label: '골드', value: '#A8895A' },
  { id: 'wine', label: '와인', value: '#722F37' },
  { id: 'navy', label: '네이비', value: '#26364D' },
  { id: 'forest', label: '포레스트', value: '#3C5A4E' },
];

const MEMORIAL_NAME_DEFAULT_COLOR = '#222222';
const MEMORIAL_DATE_DEFAULT_COLOR = '#555555';

const FUNERAL_PHOTO_FRAMES = [
  {
    id: 'photo-frame-modern-card',
    key: 'funeral-template-modern-card',
    name: '모던카드 액자',
    source: require('../../../../assets/funeral/templates/funeral-template-modern-card.png'),
  },
  {
    id: 'photo-frame-editorial-timeline',
    key: 'funeral-template-editorial-timeline',
    name: '타임라인 액자',
    source: require('../../../../assets/funeral/templates/funeral-template-editorial-timeline.png'),
  },
  {
    id: 'photo-frame-paper-letter',
    key: 'funeral-template-paper-letter',
    name: '레터지 액자',
    source: require('../../../../assets/funeral/templates/funeral-template-paper-letter.png'),
  },
  {
    id: 'photo-frame-certificate',
    key: 'funeral-template-certificate',
    name: '증명서형 액자',
    source: require('../../../../assets/funeral/templates/funeral-template-certificate.png'),
  },
  {
    id: 'photo-frame-classic-flower',
    key: 'funeral-template-classic-flower',
    name: '클래식 플라워 액자',
    source: require('../../../../assets/funeral/templates/funeral-template-classic-flower.png'),
  },
];

const MODERN_TEMPLATE_PREVIEW_ASSETS = {
  flowerCorner: require('../../../../assets/studio/elements/2-white-flowers-bottom-left.png'),
  cottonFlower: require('../../../../assets/studio/elements/14-cotton-flower.png'),
  divider: require('../../../../assets/studio/elements/18-divider-flower-horizontal.png'),
  oliveBranch: require('../../../../assets/studio/elements/7-olive-branch.png'),
  singleLeaf: require('../../../../assets/studio/elements/10-single-leaf-small.png'),
  petals: require('../../../../assets/studio/elements/12-magnolia-petals.png'),
};

// 사진 카테고리 설정 - 부고용 (고인 사진만)
const FUNERAL_PHOTO_CATEGORIES = {
  main: {
    key: 'main',
    label: '고인 사진',
    icon: '🖼️',
    description: '부고에 표시될 고인의 사진',
    maxCount: 1,
    required: true,
  },
};

const UPLOAD_TIMEOUT_MS = 45000;
const IMAGE_PREP_TIMEOUT_MS = 25000;
const PHOTO_JOYSTICK_LIMIT = 32;
const PHOTO_JOYSTICK_VELOCITY = 1.35;
const PHOTO_JOYSTICK_DEAD_ZONE = 5;

const BANK_LOGOS = {
  NH: require('../../../../assets/BankLogosAscii/nhbank.png'),
  KB: require('../../../../assets/BankLogosAscii/kbbank.png'),
  KAKAO: require('../../../../assets/BankLogosAscii/kakaobank.png'),
  SHINHAN: require('../../../../assets/BankLogosAscii/shinhanjejubank.png'),
  WOORI: require('../../../../assets/BankLogosAscii/wooribank.png'),
  IBK: require('../../../../assets/BankLogosAscii/ibkbank.png'),
  HANA: require('../../../../assets/BankLogosAscii/hanabank.png'),
  SAEMAEUL: require('../../../../assets/BankLogosAscii/mono.png'),
  DGB: require('../../../../assets/BankLogosAscii/imbank.png'),
  BNK: require('../../../../assets/BankLogosAscii/kyongnambusanbank.png'),
  KBANK: require('../../../../assets/BankLogosAscii/kbank.png'),
  POST: require('../../../../assets/BankLogosAscii/postofficebank.png'),
  SH: require('../../../../assets/BankLogosAscii/shbank.png'),
  GWANGJU: require('../../../../assets/BankLogosAscii/gwangjujeonbukbank.png'),
  JEONBUK: require('../../../../assets/BankLogosAscii/gwangjujeonbukbank.png'),
  TOSS: require('../../../../assets/BankLogosAscii/tossbank.png'),
  SAVINGS: require('../../../../assets/BankLogosAscii/sbibank.png'),
  SC: require('../../../../assets/BankLogosAscii/scbank.png'),
  CITI: require('../../../../assets/BankLogosAscii/citibank.png'),
  KDB: require('../../../../assets/BankLogosAscii/kdbbank.png'),
  CREDIT: require('../../../../assets/BankLogosAscii/creditunion.png'),
  KYONGNAM: require('../../../../assets/BankLogosAscii/kyongnambusanbank.png'),
  JEJU: require('../../../../assets/BankLogosAscii/shinhanjejubank.png'),
};

const BANKS = [
  { code: 'GWANGJU', name: '광주은행', color: '#0066B3' },
  { code: 'KYONGNAM', name: '경남은행', color: '#D4001E' },
  { code: 'KB', name: 'KB국민은행', color: '#FFB300' },
  { code: 'KDB', name: 'KDB산업은행', color: '#00529B' },
  { code: 'DGB', name: '대구은행', color: '#007BC0' },
  { code: 'BNK', name: '부산은행', color: '#D4001E' },
  { code: 'SAEMAEUL', name: '새마을금고', color: '#0072CE' },
  { code: 'SH', name: '수협은행', color: '#005BAC' },
  { code: 'SHINHAN', name: '신한은행', color: '#0046FF' },
  { code: 'CREDIT', name: '신협', color: '#007CC2' },
  { code: 'CITI', name: '씨티은행', color: '#003DA5' },
  { code: 'WOORI', name: '우리은행', color: '#0066B3' },
  { code: 'POST', name: '우체국', color: '#EF4444' },
  { code: 'IBK', name: 'IBK기업은행', color: '#005BAC' },
  { code: 'JEONBUK', name: '전북은행', color: '#0066B3' },
  { code: 'JEJU', name: '제주은행', color: '#FF6600' },
  { code: 'SAVINGS', name: '저축은행', color: '#FF6B00' },
  { code: 'KAKAO', name: '카카오뱅크', color: '#FFE600' },
  { code: 'KBANK', name: '케이뱅크', color: '#4B0082' },
  { code: 'TOSS', name: '토스뱅크', color: '#0064FF' },
  { code: 'HANA', name: '하나은행', color: '#009688' },
  { code: 'NH', name: 'NH농협은행', color: '#00A651' },
  { code: 'SC', name: 'SC제일은행', color: '#0072CE' },
];

const findBank = (name) => BANKS.find(bank => bank.name === name);

const ACCOUNT_FORMATS = {
  KB: [6, 2, 6],
  WOORI: [4, 3, 6],
  SHINHAN: [3, 3, 6],
  HANA: [3, 6, 5],
  NH: [3, 4, 4, 2],
  IBK: [3, 6, 2, 3],
  KAKAO: [4, 2, 7],
  TOSS: [4, 4, 4],
  KBANK: [3, 3, 6],
  SC: [3, 2, 6],
  CITI: [3, 6, 3],
  DGB: [3, 2, 6, 1],
  BNK: [3, 4, 4, 2],
  GWANGJU: [3, 3, 6],
  JEONBUK: [3, 2, 6],
  KYONGNAM: [3, 2, 7],
  JEJU: [2, 2, 6],
  POST: [6, 2, 6],
  SH: [4, 4, 4],
  SAEMAEUL: [4, 4, 4, 1],
  CREDIT: [3, 3, 6],
  KDB: [3, 7, 2],
  SAVINGS: [3, 4, 6],
};

const formatAccountNumber = (value, bankCode) => {
  const numbers = value.replace(/[^\d]/g, '');
  const pattern = bankCode ? ACCOUNT_FORMATS[bankCode] : null;
  if (!pattern) return numbers;
  let result = '';
  let cursor = 0;
  pattern.forEach((size, index) => {
    const chunk = numbers.slice(cursor, cursor + size);
    if (!chunk) return;
    if (index > 0) result += '-';
    result += chunk;
    cursor += size;
  });
  if (cursor < numbers.length) result += numbers.slice(cursor);
  return result;
};

const FUNERAL_RELATION_OPTIONS = [
  { label: '배우자', description: '고인과 혼인 관계에 있는 남편 또는 아내를 상주로 표시할 때 선택합니다.', group: '가족' },
  { label: '장남', description: '고인의 아들 중 첫째를 뜻하며, 일반적으로 대표 상주로 가장 많이 사용됩니다.', group: '자녀' },
  { label: '차남', description: '고인의 아들 중 둘째를 뜻하며, 장남 다음 순서의 아들을 표시할 때 사용합니다.', group: '자녀' },
  { label: '삼남', description: '고인의 아들 중 셋째를 뜻하며, 형제 순서를 분명히 표시하고 싶을 때 사용합니다.', group: '자녀' },
  { label: '막내아들', description: '고인의 아들 중 가장 어린 자녀를 뜻하며, 출생 순서보다 막내 표현이 자연스러울 때 사용합니다.', group: '자녀' },
  { label: '장녀', description: '고인의 딸 중 첫째를 뜻하며, 딸을 대표 상주로 표시할 때 사용합니다.', group: '자녀' },
  { label: '차녀', description: '고인의 딸 중 둘째를 뜻하며, 자녀 순서를 구분해 안내할 때 사용합니다.', group: '자녀' },
  { label: '삼녀', description: '고인의 딸 중 셋째를 뜻하며, 여러 딸의 관계를 차례대로 표시할 때 사용합니다.', group: '자녀' },
  { label: '막내딸', description: '고인의 딸 중 가장 어린 자녀를 뜻하며, 가족에게 익숙한 호칭 그대로 표시할 때 사용합니다.', group: '자녀' },
  { label: '며느리', description: '고인의 아들과 혼인한 가족을 뜻하며, 상주 명단에 배우자 가족을 함께 올릴 때 사용합니다.', group: '사위/며느리' },
  { label: '사위', description: '고인의 딸과 혼인한 가족을 뜻하며, 상주 명단에 배우자 가족을 함께 올릴 때 사용합니다.', group: '사위/며느리' },
  { label: '손자', description: '고인의 자녀가 낳은 남자 손주를 뜻하며, 손주 세대를 함께 표시할 때 사용합니다.', group: '손주' },
  { label: '손녀', description: '고인의 자녀가 낳은 여자 손주를 뜻하며, 손주 세대를 함께 표시할 때 사용합니다.', group: '손주' },
  { label: '형제', description: '고인과 같은 부모를 둔 남자 가족을 뜻하며, 형이나 남동생을 표시할 때 사용합니다.', group: '형제자매' },
  { label: '자매', description: '고인과 같은 부모를 둔 여자 가족을 뜻하며, 누나나 여동생을 표시할 때 사용합니다.', group: '형제자매' },
  { label: '부친', description: '아버지를 높여 부르는 표현으로, 고인의 아버지를 상주로 표시할 때 사용합니다.', group: '부모' },
  { label: '모친', description: '어머니를 높여 부르는 표현으로, 고인의 어머니를 상주로 표시할 때 사용합니다.', group: '부모' },
  { label: '친지', description: '가까운 친척이나 인척을 함께 부르는 표현으로, 정확한 관계를 넓게 안내할 때 사용합니다.', group: '기타' },
  { label: '기타', description: '목록에 없는 관계를 직접 입력해야 할 때 선택합니다. 선택 후 입력칸에서 원하는 호칭으로 수정할 수 있습니다.', group: '기타' },
];

const RELIGIOUS_RITE_OPTIONS = ['무교/일반', '기독교식', '천주교식', '불교식', '유교식', '기타'];
const FUNERAL_METHOD_OPTIONS = ['일반 장례', '가족장', '무빈소장', '화장 후 봉안', '매장', '기타'];
const VISITATION_OPTIONS = [
  { value: 'available', label: '조문 가능' },
  { value: 'after_time', label: '시간 안내' },
  { value: 'family_only', label: '가족장' },
  { value: 'decline', label: '조문 사양' },
];

const VISITATION_NOTE_TEMPLATES = [
  '조문은 빈소 마련 후부터 가능합니다. 늦은 시간 방문은 유가족에게 먼저 연락 부탁드립니다.',
  '조문은 오늘 오후 2시 이후부터 가능합니다. 빈소 위치를 확인하신 뒤 방문해 주세요.',
  '입관 전까지는 가족 중심으로 시간을 갖고자 합니다. 조문은 입관 이후부터 정중히 부탁드립니다.',
  '가족장으로 조용히 모시고자 합니다. 마음으로 함께해 주시면 깊이 감사하겠습니다.',
  '고인의 뜻에 따라 조문과 부의금은 정중히 사양합니다. 따뜻한 마음만 감사히 받겠습니다.',
  '빈소가 협소하여 조문객이 많을 경우 대기 시간이 있을 수 있습니다. 너른 양해 부탁드립니다.',
  '발인 전날 저녁 시간대 조문객이 많을 수 있어 가능한 낮 시간 방문을 부탁드립니다.',
  '멀리서 마음을 전해주시는 분들께도 깊이 감사드립니다. 조문 가능 시간은 상황에 따라 변경될 수 있습니다.',
];

const FUNERAL_MESSAGE_TEMPLATES = [
  '바쁘신 가운데에도 고인의 마지막 길을 함께해 주시고 따뜻한 위로를 보내주셔서 깊이 감사드립니다.\n보내주신 마음을 가족 모두 오래도록 잊지 않고 간직하겠습니다.',
  '황망한 소식에 먼 길 마다하지 않고 찾아와 주신 모든 분들께 진심으로 감사드립니다.\n고인을 기억해 주시고 명복을 빌어주시는 마음이 저희 가족에게 큰 힘이 되고 있습니다.',
  '갑작스러운 이별로 경황이 없는 중에도 많은 분들께서 보내주신 위로와 격려 덕분에 큰 위안을 얻고 있습니다.\n고인의 생전 인연을 소중히 기억하며 깊은 감사의 말씀을 드립니다.',
  '고인의 마지막 가시는 길에 함께해 주시고 마음을 나누어 주신 모든 분들께 감사드립니다.\n슬픔을 함께해 주신 따뜻한 마음을 잊지 않고, 고인의 뜻을 기리며 살아가겠습니다.',
  '직접 찾아와 조문해 주신 분들, 멀리서 마음으로 위로를 전해주신 분들께 진심으로 감사드립니다.\n보내주신 따뜻한 정성과 위로가 저희 가족에게 큰 힘이 되었습니다.',
  '깊은 슬픔 속에서도 여러분의 위로와 배려로 고인을 편안히 모실 수 있었습니다.\n고인을 기억해 주신 모든 분들께 머리 숙여 감사의 인사를 올립니다.',
  '고인의 삶을 함께 기억해 주시고 마지막 인사를 나누어 주셔서 감사드립니다.\n소중한 시간을 내어 보내주신 위로와 조문을 가족 모두 마음 깊이 새기겠습니다.',
  '예기치 못한 이별에 마음을 추스르기 어려운 가운데, 많은 분들의 따뜻한 말씀과 조문이 큰 위로가 되었습니다.\n고인의 명복을 빌어주신 모든 분들께 깊이 감사드립니다.',
  '고인께서 생전에 맺으신 귀한 인연들이 마지막 길까지 함께해 주셔서 가족 모두 감사한 마음입니다.\n보내주신 사랑과 위로를 오래 기억하겠습니다.',
  '삼가 고인의 명복을 빌어주시고 유가족에게 따뜻한 마음을 전해주신 모든 분들께 감사드립니다.\n찾아주신 정성과 위로에 보답하는 마음으로 고인을 잘 모시겠습니다.',
];

// 토스 스타일 모달 컴포넌트
const TossModal = ({ visible, title, message, onConfirm, onCancel, confirmText = "확인", cancelText = "취소" }) => {
  const closeByBackdrop = onCancel || onConfirm;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={closeByBackdrop}>
      <TouchableWithoutFeedback onPress={closeByBackdrop}>
        <View style={styles.tossModalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.tossModalContainer}>
              <View style={styles.tossModalContent}>
                <Text style={styles.tossModalTitle}>{title}</Text>
                <Text style={styles.tossModalMessage}>{message}</Text>
              </View>
              <View style={styles.tossModalButtons}>
                {onCancel && (
                  <TouchableOpacity style={styles.tossModalCancelButton} onPress={onCancel}>
                    <Text style={styles.tossModalCancelText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.tossModalConfirmButton} onPress={onConfirm}>
                  <Text style={styles.tossModalConfirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// 토스 스타일 달력 컴포넌트 (부고용 - 과거 날짜 허용)
const TossDatePicker = ({ visible, selectedDate, onSelect, onClose, allowPastDates = true }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();
    
    const days = [];
    
    // 이전 달의 날짜들
    for (let i = startDate - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // 6주를 항상 채워 달력 높이가 월/년도 변경 때 흔들리지 않게 고정한다.
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const navigateYear = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(currentMonth.getFullYear() + direction);
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date) => {
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    onSelect(selected);
    onClose();
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.tossPickerOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.tossPickerContainer}>
          <View style={styles.tossPickerHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={TossColors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.tossPickerTitle}>날짜 선택</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.monthNavButton}>
              <Ionicons name="chevron-back" size={20} color={TossColors.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.monthNavButton}>
              <Ionicons name="chevron-forward" size={20} color={TossColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.yearJumpSection}>
            <Text style={styles.yearJumpLabel}>년도 이동</Text>
            <View style={styles.yearJumpRow}>
              <TouchableOpacity style={styles.yearJumpButton} onPress={() => navigateYear(-10)}>
                <Text style={styles.yearJumpButtonText}>10년 전</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.yearJumpButton} onPress={() => navigateYear(-1)}>
                <Text style={styles.yearJumpButtonText}>1년 전</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.yearJumpButton} onPress={() => navigateYear(1)}>
                <Text style={styles.yearJumpButtonText}>1년 후</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.yearJumpButton} onPress={() => navigateYear(10)}>
                <Text style={styles.yearJumpButtonText}>10년 후</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, index) => (
              <Text key={index} style={[
                styles.weekDay,
                (index === 0 || index === 6) && styles.weekendDay
              ]}>
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {days.map((dayInfo, index) => {
              const isToday = dayInfo.date.toDateString() === today.toDateString();
              const isSelected = selectedDate && dayInfo.date.toDateString() === selectedDate.toDateString();
              const isPast = dayInfo.date < today && !isToday;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !dayInfo.isCurrentMonth && styles.otherMonthDay,
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay,
                  ]}
                  onPress={() => dayInfo.isCurrentMonth && handleDateSelect(dayInfo.date)}
                  disabled={!dayInfo.isCurrentMonth}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !dayInfo.isCurrentMonth && styles.otherMonthText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayText,
                    (index % 7 === 0) && styles.sundayText,
                  ]}>
                    {dayInfo.date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// 토스 스타일 시간 선택 컴포넌트
const TossTimePicker = ({ visible, selectedTime, onSelect, onClose }) => {
  const [selectedHour, setSelectedHour] = useState(selectedTime ? selectedTime.getHours() : 14);
  const [selectedMinute, setSelectedMinute] = useState(selectedTime ? selectedTime.getMinutes() : 0);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => {
    const time = new Date();
    time.setHours(selectedHour, selectedMinute, 0, 0);
    onSelect(time);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.tossPickerOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.tossPickerContainer}>
          <View style={styles.tossPickerHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.timePickerCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.tossPickerTitle}>시간 선택</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.timePickerConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.timePickerContent}>
            <View style={styles.timePickerSection}>
              <Text style={styles.timePickerLabel}>시</Text>
              <ScrollView style={styles.timePickerList} showsVerticalScrollIndicator={false}>
                {hours.map(hour => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timePickerItem,
                      selectedHour === hour && styles.timePickerItemSelected
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[
                      styles.timePickerItemText,
                      selectedHour === hour && styles.timePickerItemTextSelected
                    ]}>
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.timePickerSection}>
              <Text style={styles.timePickerLabel}>분</Text>
              <ScrollView style={styles.timePickerList} showsVerticalScrollIndicator={false}>
                {minutes.map(minute => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timePickerItem,
                      selectedMinute === minute && styles.timePickerItemSelected
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.timePickerItemText,
                      selectedMinute === minute && styles.timePickerItemTextSelected
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

function RelationPickerSheet({ visible, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? FUNERAL_RELATION_OPTIONS.filter(option =>
        option.label.includes(search.trim()) ||
        option.description.includes(search.trim()) ||
        option.group.includes(search.trim())
      )
    : FUNERAL_RELATION_OPTIONS;

  const handleSelect = (relation) => {
    setSearch('');
    onSelect(relation);
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.sheetDim} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.sheetDimTouch} onPress={handleClose} activeOpacity={1} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle}><View style={styles.sheetHandleBar} /></View>
          <View style={styles.sheetHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>상주 관계 선택</Text>
              <Text style={styles.sheetSubtitle}>관계명을 검색하거나 아래 목록에서 선택하세요</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.sheetCloseBtn}>
              <Ionicons name="close" size={20} color={TossColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bankSearchWrap}>
            <Ionicons name="search" size={18} color={TossColors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.bankSearchInput}
              placeholder="관계명 검색"
              placeholderTextColor={TossColors.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={TossColors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.relationGrid}>
              {filtered.map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={styles.relationGridItem}
                  onPress={() => handleSelect(option.label)}
                  activeOpacity={0.75}
                >
                  <View style={styles.relationCardHeader}>
                    <Text style={styles.relationCardTitle} numberOfLines={1}>{option.label}</Text>
                    <View style={styles.relationGroupBadge}>
                      <Text style={styles.relationGroupText}>{option.group}</Text>
                    </View>
                  </View>
                  <Text style={styles.relationGridDescription} numberOfLines={3}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BankPickerSheet({ visible, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? BANKS.filter(bank => bank.name.includes(search.trim()))
    : BANKS;

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleSelect = (bankName) => {
    setSearch('');
    onSelect(bankName);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.sheetDim} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.sheetDimTouch} onPress={handleClose} activeOpacity={1} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle}><View style={styles.sheetHandleBar} /></View>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>은행 선택</Text>
            <TouchableOpacity onPress={handleClose} style={styles.sheetCloseBtn}>
              <Ionicons name="close" size={20} color={TossColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bankSearchWrap}>
            <Ionicons name="search" size={18} color={TossColors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.bankSearchInput}
              placeholder="은행명 검색"
              placeholderTextColor={TossColors.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={TossColors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.bankGrid}>
              {filtered.map(bank => (
                <TouchableOpacity
                  key={bank.code}
                  style={styles.bankItem}
                  onPress={() => handleSelect(bank.name)}
                  activeOpacity={0.75}
                >
                  <View style={styles.bankIcon}>
                    {BANK_LOGOS[bank.code] ? (
                      <Image source={BANK_LOGOS[bank.code]} style={styles.bankLogoImg} resizeMode="contain" />
                    ) : (
                      <Text style={[styles.bankIconText, { color: bank.color }]}>{bank.name.slice(0, 2)}</Text>
                    )}
                  </View>
                  <Text style={styles.bankName} numberOfLines={1}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PhotoFramePickerSheet({ visible, frames, selectedFrameId, onSelect, onClose }) {
  const handleClose = () => {
    onClose();
  };

  const handleSelect = (frameId) => {
    onSelect(frameId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.sheetDim} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.sheetDimTouch} onPress={handleClose} activeOpacity={1} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle}><View style={styles.sheetHandleBar} /></View>
          <View style={styles.sheetHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>고인 사진 액자 선택</Text>
              <Text style={styles.sheetSubtitle}>작은 미리보기에서 원하는 액자를 고르세요.</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.sheetCloseBtn}>
              <Ionicons name="close" size={20} color={TossColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.photoFrameSheetGrid}>
              {frames.map((frame) => {
                const isSelected = frame.id === selectedFrameId;
                return (
                  <TouchableOpacity
                    key={frame.id}
                    style={[styles.photoFrameSheetItem, isSelected && styles.photoFrameSheetItemSelected]}
                    onPress={() => handleSelect(frame.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.photoFrameSheetThumbWrap, isSelected && styles.photoFrameSheetThumbSelected]}>
                      <Image source={frame.source} style={styles.photoFrameSheetThumb} resizeMode="contain" />
                    </View>
                    <Text style={[styles.photoFrameSheetName, isSelected && styles.photoFrameSheetNameSelected]}>
                      {frame.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.photoFrameSheetSelectedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={TossColors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MemorialFontPickerSheet({
  visible,
  target,
  nameFontId,
  dateFontId,
  nameColor,
  dateColor,
  nameVisible,
  dateVisible,
  onTargetChange,
  onSelect,
  onColorSelect,
  onVisibleChange,
  onClose,
}) {
  const handleClose = () => {
    onClose();
  };

  const activeFontId = target === 'date' ? dateFontId : nameFontId;
  const activeColor = target === 'date' ? dateColor : nameColor;
  const activeVisible = target === 'date' ? dateVisible : nameVisible;
  const isWhiteColor = String(activeColor || '').toUpperCase() === '#FFFFFF';
  const visibleFontOptions = target === 'name'
    ? MEMORIAL_TEXT_FONT_OPTIONS.filter(option => option.script !== 'latin')
    : MEMORIAL_TEXT_FONT_OPTIONS;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.sheetDim} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.sheetDimTouch} onPress={handleClose} activeOpacity={1} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle}><View style={styles.sheetHandleBar} /></View>
          <View style={styles.sheetHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>글꼴 선택</Text>
              <Text style={styles.sheetSubtitle}>이름과 날짜 글꼴을 따로 선택할 수 있어요.</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.sheetCloseBtn}>
              <Ionicons name="close" size={20} color={TossColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.fontTargetSwitch}>
            {[
              { key: 'name', label: '이름' },
              { key: 'date', label: '날짜' },
            ].map(item => {
              const selected = target === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.fontTargetButton, selected && styles.fontTargetButtonSelected]}
                  onPress={() => onTargetChange(item.key)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.fontTargetText, selected && styles.fontTargetTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.fontOptionList}>
            <View style={styles.textVisibilityCard}>
              <View style={styles.textVisibilityInfo}>
                <Text style={styles.textVisibilityTitle}>
                  {target === 'date' ? '날짜 표시' : '이름 표시'}
                </Text>
                <Text style={styles.textVisibilityDescription}>
                  {target === 'date'
                    ? '생년월일과 별세일 텍스트를 액자에 표시합니다.'
                    : '고인 성함 텍스트를 액자에 표시합니다.'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.textVisibilitySwitch, activeVisible && styles.textVisibilitySwitchActive]}
                onPress={() => onVisibleChange(target, !activeVisible)}
                activeOpacity={0.85}
              >
                <View style={[styles.textVisibilityKnob, activeVisible && styles.textVisibilityKnobActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.fontColorSection}>
              <View style={styles.fontSectionHeaderRow}>
                <Text style={styles.fontSectionTitle}>텍스트 색상</Text>
                {isWhiteColor && (
                  <Text style={styles.fontContrastBadge}>어두운 미리보기 배경 적용</Text>
                )}
              </View>
              <View style={styles.fontColorGrid}>
                {MEMORIAL_TEXT_COLOR_OPTIONS.map(color => {
                  const selected = activeColor === color.value;
                  return (
                    <TouchableOpacity
                      key={color.id}
                      style={[styles.fontColorChip, selected && styles.fontColorChipSelected]}
                      onPress={() => onColorSelect(target, color.value)}
                      activeOpacity={0.85}
                    >
                      <View style={[
                        styles.fontColorSwatch,
                        { backgroundColor: color.value },
                        color.value === '#FFFFFF' && styles.fontColorSwatchWhite,
                      ]} />
                      <Text style={[styles.fontColorLabel, selected && styles.fontColorLabelSelected]}>
                        {color.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.fontSectionTitle}>글씨체</Text>
            {visibleFontOptions.map(option => {
              const selected = activeFontId === option.id;
              const previewStyle = [
                styles.fontOptionPreview,
                option.fontFamily ? { fontFamily: option.fontFamily } : null,
                { fontWeight: '400' },
                { color: activeColor },
              ];
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.fontOptionCard, selected && styles.fontOptionCardSelected]}
                  onPress={() => onSelect(target, option.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.fontOptionContent}>
                    <View style={[styles.fontPreviewBox, isWhiteColor && styles.fontPreviewBoxDark]}>
                      <Text style={previewStyle}>
                        {target === 'date' ? '1948. 03. 12' : '故 김정담'}
                      </Text>
                    </View>
                    <Text style={styles.fontOptionName}>{option.name}</Text>
                    <Text style={styles.fontOptionDescription}>{option.description}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={22} color={TossColors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// 이미지 업로드 진행 상황 모달
const ImageUploadModal = ({ visible, currentIndex, totalCount, onCancel }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.uploadModalOverlay}>
      <View style={styles.uploadModalContainer}>
        <View style={styles.uploadModalContent}>
          <View style={styles.uploadIconContainer}>
            <Ionicons name="cloud-upload-outline" size={48} color={TossColors.primary} />
          </View>
          <Text style={styles.uploadModalTitle}>이미지 업로드 중</Text>
          <Text style={styles.uploadModalMessage}>
            {currentIndex}/{totalCount} 이미지 업로드 중...
          </Text>
          <View style={styles.uploadProgressContainer}>
            <View style={styles.uploadProgressTrack}>
              <View style={[
                styles.uploadProgressFill,
                { width: `${(currentIndex / totalCount) * 100}%` }
              ]} />
            </View>
            <Text style={styles.uploadProgressText}>
              {Math.round((currentIndex / totalCount) * 100)}%
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.uploadModalCancelButton} onPress={onCancel}>
          <Text style={styles.uploadModalCancelText}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function CreateFuneralScreen({ navigation, route }) {
  const isEditMode = !!route?.params?.editMode;
  const editEvent = route?.params?.editEvent || null;
  const editEventId = route?.params?.editEventId || editEvent?.id || null;
  const editHydratedRef = useRef(false);
  const creationCreditReservationRef = useRef(isEditMode ? null : (route?.params?.eventCreationCreditReservation || null));
  const creationCreditSettledRef = useRef(false);
  const completionNavTimeoutRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreationComplete, setIsCreationComplete] = useState(false);
  const [createdDisplayParams, setCreatedDisplayParams] = useState(null);
  const [eventData, setEventData] = useState({
    type: 'funeral', // 🔥 고정값
    title: '',
    date: null,
    time: null,
    location: '',
    detailedAddress: '',
    
    // 부고 관련 필드
    deceasedName: '',
    birthDate: null,
    deceasedAge: '',
    ageCalculationMethod: 'korean_year',
    deathDate: null,
    deathTime: null,
    deceasedGender: '남',
    religiousRite: '무교/일반',
    funeralMethod: '일반 장례',
    funeralStartDate: null,
    funeralEndDate: null,
    burialDate: null,
    burialTime: null,
    burialLocation: '',
    secondaryBurialLocation: '',
    casketDate: null,
    casketTime: null,
    familyMembers: [],
    primaryContact: '',
    secondaryContact: '',
    funeralDirector: '',
    funeralHome: '',
    funeralAddress: '', // 장례식장 주소
    visitationType: 'available',
    visitationNote: '',
    parkingTransportInfo: '',
    condolenceAccounts: [],
    customMessage: '',
    
    // 조문메시지 설정
    allowMessages: true,
    messageSettings: {
      placeholder: '삼가 고인의 명복을 빕니다.',
      requireLogin: true,
    },
    
    // 공통 필드
    familyRelations: ['신랑측', '신부측'],
    presetAmounts: [50000, 100000, 200000],
    selectedTemplate: null,
    selectedPhotoFrameId: FUNERAL_PHOTO_FRAMES[0]?.id || 'photo-frame-rectangle',
    mainPhotoLayout: { ...MAIN_IMAGE_LAYOUT_DEFAULT },
    memorialTextLayout: { ...MEMORIAL_TEXT_LAYOUT_DEFAULT },
    memorialNameLayout: { ...MEMORIAL_NAME_LAYOUT_DEFAULT },
    memorialDateLayout: { ...MEMORIAL_DATE_LAYOUT_DEFAULT },
    memorialNameFontId: MEMORIAL_TEXT_FONT_OPTIONS[0].id,
    memorialDateFontId: MEMORIAL_TEXT_FONT_OPTIONS[0].id,
    memorialNameColor: MEMORIAL_NAME_DEFAULT_COLOR,
    memorialDateColor: MEMORIAL_DATE_DEFAULT_COLOR,
    memorialNameVisible: true,
    memorialDateVisible: true,
    images: [],
  });
  const [mainPhotoLayoutView, setMainPhotoLayoutView] = useState({ ...MAIN_IMAGE_LAYOUT_DEFAULT });
  const [memorialNameLayoutView, setMemorialNameLayoutView] = useState({ ...MEMORIAL_NAME_LAYOUT_DEFAULT });
  const [memorialDateLayoutView, setMemorialDateLayoutView] = useState({ ...MEMORIAL_DATE_LAYOUT_DEFAULT });
  const [composerFrameWidth, setComposerFrameWidth] = useState(null);

  React.useEffect(() => {
    return () => {
      if (completionNavTimeoutRef.current) {
        clearTimeout(completionNavTimeoutRef.current);
        completionNavTimeoutRef.current = null;
      }
      const reservation = creationCreditReservationRef.current;
      if (!reservation?.success || creationCreditSettledRef.current) return;
      refundEventCreationCredit({
        userId: reservation.userId,
        paymentMethod: reservation.paymentMethod,
        priceCredits: reservation.priceCredits,
        reason: 'event_create_abandoned:funeral',
      })
        .then(() => DeviceEventEmitter.emit('event-creation-credit-refunded'))
        .catch(() => {});
    };
  }, []);

  React.useEffect(() => {
    if (!isCreationComplete) return undefined;

    navigation.setOptions?.({ gestureEnabled: false });
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      backSub.remove();
      navigation.setOptions?.({ gestureEnabled: true });
    };
  }, [isCreationComplete, navigation]);

  const goToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  const goToCreatedNotice = () => {
    if (!createdDisplayParams) {
      goToHome();
      return;
    }
    navigation.navigate('EventDisplay', createdDisplayParams);
  };
  
  // 이미지 업로드 관련 상태
  const [imageUploadState, setImageUploadState] = useState({
    isUploading: false,
    currentIndex: 0,
    totalCount: 0,
    uploadingCategory: null,
  });
  
  // 스크롤 및 입력 필드 참조
  const scrollViewRef = useRef(null);
  const eventDataRef = useRef(eventData);
  const joystickStartLayoutRef = useRef({ ...MAIN_IMAGE_LAYOUT_DEFAULT });
  const latestMainImageLayoutRef = useRef({ ...MAIN_IMAGE_LAYOUT_DEFAULT });
  const textJoystickStartLayoutRef = useRef({ ...MEMORIAL_TEXT_LAYOUT_DEFAULT });
  const textAdjustTargetRef = useRef('name');
  const latestMemorialTextLayoutRef = useRef({ ...MEMORIAL_TEXT_LAYOUT_DEFAULT });
  const latestMemorialNameLayoutRef = useRef({ ...MEMORIAL_NAME_LAYOUT_DEFAULT });
  const latestMemorialDateLayoutRef = useRef({ ...MEMORIAL_DATE_LAYOUT_DEFAULT });
  const joystickVelocityRef = useRef({ x: 0, y: 0 });
  const joystickTimerRef = useRef(null);
  const sectionPositions = useRef({
    deceasedInfo: 0,
    familyMembers: 0,
    funeralSchedule: 0,
    funeralLocation: 0,
    funeralContact: 0,
    funeralGuide: 0,
    condolenceAccounts: 0,
    photos: 0,
    messageSettings: 0,
    message: 0,
  });

  // 토스 스타일 피커 상태
  const [showFuneralAddressSearch, setShowFuneralAddressSearch] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 부고용 추가 피커 상태
  const [showCasketDatePicker, setShowCasketDatePicker] = useState(false);
  const [showCasketTimePicker, setShowCasketTimePicker] = useState(false);
  const [showBurialDatePicker, setShowBurialDatePicker] = useState(false);
  const [showBurialTimePicker, setShowBurialTimePicker] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showDeathDatePicker, setShowDeathDatePicker] = useState(false);
  const [showDeathTimePicker, setShowDeathTimePicker] = useState(false);
  const [relationPicker, setRelationPicker] = useState({ visible: false, index: null });
  const [photoFramePicker, setPhotoFramePicker] = useState(false);
  const [photoAdjustMode, setPhotoAdjustMode] = useState(false);
  const [textAdjustMode, setTextAdjustMode] = useState(false);
  const [textAdjustTarget, setTextAdjustTarget] = useState('name');
  const [adjustMenuOpen, setAdjustMenuOpen] = useState(false);
  const [fontPickerVisible, setFontPickerVisible] = useState(false);
  const [fontPickerTarget, setFontPickerTarget] = useState('name');
  const [photoJoystickKnob, setPhotoJoystickKnob] = useState({ x: 0, y: 0 });
  const [textJoystickKnob, setTextJoystickKnob] = useState({ x: 0, y: 0 });
  const [bankPicker, setBankPicker] = useState({ visible: false, index: null });
  
  // 토스 모달 상태
  const [modalState, setModalState] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  // 애니메이션
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  const testButtonAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    eventDataRef.current = eventData;
  }, [eventData]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, [currentStep]);

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(testButtonAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(testButtonAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [testButtonAnim]);

  const templates = {
    funeral: [
      {
        id: 'modern-card',
        name: '한지 모던',
        description: '한지 질감과 꽃 장식, 실시간 조문 일정이 어우러진 대표형 부고장',
        previewType: 'card-modern-soft',
        style: 'modern-card',
        features: ['한지 배경', '꽃 장식', '진행 일정'],
      },
      {
        id: 'editorial-timeline',
        name: '클린 타임라인',
        description: '입관·발인·장지를 차분한 세로 일정표로 정리한 안내형 부고장',
        previewType: 'card-editorial-timeline',
        style: 'editorial-timeline',
        features: ['세로 일정표', '안내 중심', '쿨그레이'],
      },
      {
        id: 'paper-letter',
        name: '레터지',
        description: '상주의 말과 고인 정보를 편지지처럼 차분하게 전하는 문장 중심 부고장',
        previewType: 'card-paper-letter',
        style: 'paper-letter',
        features: ['편지지', '문장 중심', '차분함'],
      },
      {
        id: 'certificate',
        name: '증명서형',
        description: '고인을 정갈하게 소개하는 전통적인 공문형 부고 스타일',
        previewType: 'card-certificate',
        style: 'certificate',
        features: ['엄숙함', '정보 밀도', '간결한 구성'],
      },
    ],
  };

  React.useEffect(() => {
    if (!isEditMode || editHydratedRef.current) return undefined;
    let cancelled = false;

    const hydrateEditEvent = async () => {
      let sourceEvent = editEvent || null;
      if (editEventId) {
        const detailResult = await getEventDetail(editEventId);
        if (detailResult.success && detailResult.data) {
          sourceEvent = detailResult.data;
        }
      }

      if (cancelled || !sourceEvent) return;
      editHydratedRef.current = true;

      const info = sourceEvent.additional_info || {};
      const selectedTemplate = templates.funeral.find(t => t.style === sourceEvent.template_style) || templates.funeral[0];
      const eventImages = dedupeStoredFuneralImages([
        ...flattenStoredFuneralCategorizedImages(info.categorized_images),
        ...(Array.isArray(sourceEvent.image_urls)
          ? sourceEvent.image_urls.map((img, index) => normalizeStoredFuneralImageForEdit(img, index, typeof img === 'object' ? img.category || 'all' : 'all'))
          : []),
      ]);
      const familyMembers = Array.isArray(info.family_members)
        ? info.family_members.map(member => ({ relation: member.relation || '', names: member.names || '' }))
        : [];
      const accountSource = info.condolence_accounts || sourceEvent.condolence_accounts || [];
      const condolenceAccounts = Array.isArray(accountSource)
        ? accountSource.map(account => ({
          ownerName: account.owner_name || account.ownerName || '',
          bankName: account.bank_name || account.bankName || '',
          accountNumber: account.account_number || account.accountNumber || '',
        }))
        : [];
      const mainPhotoLayout = normalizeMainImageLayout(info.main_photo_layout || sourceEvent.main_photo_layout || MAIN_IMAGE_LAYOUT_DEFAULT);
      const memorialNameLayout = normalizeMemorialTextLayout(info.memorial_name_layout || sourceEvent.memorial_name_layout || MEMORIAL_NAME_LAYOUT_DEFAULT);
      const memorialDateLayout = normalizeMemorialTextLayout(info.memorial_date_layout || sourceEvent.memorial_date_layout || MEMORIAL_DATE_LAYOUT_DEFAULT);

      latestMainImageLayoutRef.current = mainPhotoLayout;
      latestMemorialNameLayoutRef.current = memorialNameLayout;
      latestMemorialDateLayoutRef.current = memorialDateLayout;
      setMainPhotoLayoutView(mainPhotoLayout);
      setMemorialNameLayoutView(memorialNameLayout);
      setMemorialDateLayoutView(memorialDateLayout);

      setEventData(prev => ({
        ...prev,
        title: sourceEvent.event_name || '',
        date: sourceEvent.event_date || null,
        location: sourceEvent.location || '',
        detailedAddress: sourceEvent.detailed_address || '',
        deceasedName: sourceEvent.main_person_name || sourceEvent.deceasedName || info.deceasedName || '',
        birthDate: sourceEvent.birth_date || info.birth_date || null,
        deceasedAge: sourceEvent.deceased_age ? String(sourceEvent.deceased_age) : '',
        ageCalculationMethod: sourceEvent.age_calculation_method || info.age_calculation_method || prev.ageCalculationMethod,
        deathDate: sourceEvent.death_date || info.death_date || null,
        deathTime: sourceEvent.death_time || info.death_time || null,
        deceasedGender: sourceEvent.deceased_gender || prev.deceasedGender,
        religiousRite: sourceEvent.religious_rite || info.religious_rite || prev.religiousRite,
        funeralMethod: sourceEvent.funeral_method || info.funeral_method || prev.funeralMethod,
        casketDate: sourceEvent.casket_date || info.casket_date || null,
        casketTime: sourceEvent.casket_time || info.casket_time || null,
        burialDate: sourceEvent.burial_date || info.burial_date || null,
        burialTime: sourceEvent.burial_time || info.burial_time || null,
        burialLocation: sourceEvent.burial_location || info.burial_location || '',
        secondaryBurialLocation: sourceEvent.secondary_burial_location || info.secondary_burial_location || '',
        familyMembers,
        primaryContact: sourceEvent.primary_contact || '',
        secondaryContact: sourceEvent.secondary_contact || '',
        funeralDirector: sourceEvent.funeral_director || '',
        funeralHome: sourceEvent.funeral_home || info.funeral_home || '',
        funeralAddress: sourceEvent.location || '',
        visitationType: sourceEvent.visitation_type || info.visitation_type || prev.visitationType,
        visitationNote: sourceEvent.visitation_note || info.visitation_note || '',
        parkingTransportInfo: sourceEvent.parking_transport_info || info.parking_transport_info || '',
        condolenceAccounts,
        customMessage: sourceEvent.custom_message || info.custom_message || '',
        allowMessages: sourceEvent.allow_messages !== false,
        messageSettings: info.message_settings || prev.messageSettings,
        selectedTemplate,
        selectedPhotoFrameId: info.photo_frame?.id || prev.selectedPhotoFrameId,
        mainPhotoLayout,
        memorialTextLayout: normalizeMemorialTextLayout(info.memorial_text_layout || sourceEvent.memorial_text_layout || MEMORIAL_TEXT_LAYOUT_DEFAULT),
        memorialNameLayout,
        memorialDateLayout,
        memorialNameFontId: info.memorial_name_font_id || prev.memorialNameFontId,
        memorialDateFontId: info.memorial_date_font_id || prev.memorialDateFontId,
        memorialNameColor: info.memorial_name_color || prev.memorialNameColor,
        memorialDateColor: info.memorial_date_color || prev.memorialDateColor,
        memorialNameVisible: info.memorial_name_visible !== false,
        memorialDateVisible: info.memorial_date_visible !== false,
        images: eventImages,
      }));
    };

    hydrateEditEvent();
    return () => {
      cancelled = true;
    };
  }, [editEvent, editEventId, isEditMode]);

  // 섹션으로 스크롤하는 함수
  const scrollToSection = (sectionKey) => {
    const position = sectionPositions.current[sectionKey];
    if (scrollViewRef.current && position !== undefined) {
      scrollViewRef.current.scrollTo({ 
        y: Math.max(0, position - 100), 
        animated: true 
      });
    }
  };

  // 토스 스타일 모달 표시 함수 (스크롤 포함)
  const showTossModal = (title, message, onConfirm, onCancel = null, scrollTarget = null) => {
    setModalState({
      visible: true,
      title,
      message,
      onConfirm: () => {
        setModalState({ ...modalState, visible: false });
        if (scrollTarget) {
          setTimeout(() => scrollToSection(scrollTarget), 300);
        }
        onConfirm && onConfirm();
      },
      onCancel: onCancel ? () => {
        setModalState({ ...modalState, visible: false });
        onCancel();
      } : null,
    });
  };

  // 핸드폰 번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 010으로 시작하지 않으면 010 추가
    let formattedNumbers = numbers;
    if (!numbers.startsWith('010')) {
      formattedNumbers = '010' + numbers;
    }
    
    // 최대 11자리까지만
    formattedNumbers = formattedNumbers.slice(0, 11);
    
    // 포맷팅 적용
    if (formattedNumbers.length <= 3) {
      return formattedNumbers;
    } else if (formattedNumbers.length <= 7) {
      return `${formattedNumbers.slice(0, 3)}-${formattedNumbers.slice(3)}`;
    } else {
      return `${formattedNumbers.slice(0, 3)}-${formattedNumbers.slice(3, 7)}-${formattedNumbers.slice(7)}`;
    }
  };

  const handleFuneralAddressComplete = (data) => {
    console.log('장례식장 주소 검색 완료:', data);
    
    if (!data) {
      showTossModal('알림', '주소를 다시 선택해주세요', () => {});
      return;
    }

    let selectedAddress = '';
    
    if (data.roadAddress && data.roadAddress.trim()) {
      selectedAddress = data.roadAddress.trim();
    } else if (data.jibunAddress && data.jibunAddress.trim()) {
      selectedAddress = data.jibunAddress.trim();
    } else if (data.address && data.address.trim()) {
      selectedAddress = data.address.trim();
    }

    if (!selectedAddress) {
      showTossModal('알림', '올바른 주소를 선택해주세요', () => {});
      return;
    }

    setEventData(prevData => ({
      ...prevData,
      funeralAddress: selectedAddress,
    }));
    
    setShowFuneralAddressSearch(false);
  };

  const formatDate = (date) => {
    if (!date) return null;
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return null;
      
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } catch (error) {
      return null;
    }
  };

  const formatMemorialDate = (date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}`;
  };

  const formatTime = (time) => {
    if (!time) return null;
    
    try {
      if (typeof time === 'string') {
        const match = time.match(/^(\d{1,2}):(\d{2})/);
        if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
      if (time instanceof Date && !isNaN(time.getTime())) {
        return time.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const dateToISODate = (date) => (
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)
      ? date.slice(0, 10)
      : date && date instanceof Date && !isNaN(date.getTime())
      ? date.toISOString().split('T')[0]
      : null
  );

  const timeToISOTime = (time) => (
    typeof time === 'string' && /^\d{1,2}:\d{2}/.test(time)
      ? (() => {
          const [hh = '00', mm = '00', ss = '00'] = time.split(':');
          return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${String(ss || '00').padStart(2, '0')}`;
        })()
      : time && time instanceof Date && !isNaN(time.getTime())
      ? time.toTimeString().split(' ')[0]
      : null
  );

  const calculateAge = (birthDate, deathDate, method) => {
    if (!birthDate || !deathDate) return '';
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    const death = deathDate instanceof Date ? deathDate : new Date(deathDate);
    if (isNaN(birth.getTime()) || isNaN(death.getTime())) return '';

    const birthYear = birth.getFullYear();
    const birthMonth = birth.getMonth() + 1;
    const birthDay = birth.getDate();
    const deathYear = death.getFullYear();
    const deathMonth = death.getMonth() + 1;
    const deathDay = death.getDate();

    if (
      deathYear < birthYear ||
      (deathYear === birthYear && deathMonth < birthMonth) ||
      (deathYear === birthYear && deathMonth === birthMonth && deathDay < birthDay)
    ) {
      return '';
    }

    if (method === 'full_age') {
      let age = deathYear - birthYear;
      const birthdayPassed =
        deathMonth > birthMonth ||
        (deathMonth === birthMonth && deathDay >= birthDay);
      if (!birthdayPassed) age -= 1;
      return age >= 0 ? String(age) : '';
    }

    const age = deathYear - birthYear + 1;
    return age >= 0 ? String(age) : '';
  };

  const syncCalculatedAge = (nextData) => {
    const calculatedAge = calculateAge(nextData.birthDate, nextData.deathDate, nextData.ageCalculationMethod);
    return calculatedAge ? { ...nextData, deceasedAge: calculatedAge } : nextData;
  };

  const getVisibleAge = () => {
    const baseDate = eventData.deathDate || new Date();
    return calculateAge(eventData.birthDate, baseDate, eventData.ageCalculationMethod);
  };

  const getAgeBaseDateLabel = () => {
    const baseDate = eventData.deathDate || new Date();
    return formatDate(baseDate);
  };

  const updateEventData = (patch) => {
    setEventData(prevData => syncCalculatedAge({ ...prevData, ...patch }));
  };

  const normalizeMainImageLayout = (layout) => {
    const raw = layout && typeof layout === 'object' ? layout : {};
    const scale = Number(raw.scale);
    const translateX = Number(raw.translateX);
    const translateY = Number(raw.translateY);
    const baseWidth = Number(raw.baseWidth);
    return {
      scale: Number.isFinite(scale) ? Math.min(MAIN_IMAGE_MAX_SCALE, Math.max(MAIN_IMAGE_MIN_SCALE, scale)) : MAIN_IMAGE_LAYOUT_DEFAULT.scale,
      translateX: Number.isFinite(translateX) ? Math.min(MAIN_IMAGE_TRANSLATE_LIMIT, Math.max(-MAIN_IMAGE_TRANSLATE_LIMIT, translateX)) : MAIN_IMAGE_LAYOUT_DEFAULT.translateX,
      translateY: Number.isFinite(translateY) ? Math.min(MAIN_IMAGE_TRANSLATE_LIMIT, Math.max(-MAIN_IMAGE_TRANSLATE_LIMIT, translateY)) : MAIN_IMAGE_LAYOUT_DEFAULT.translateY,
      baseWidth: Number.isFinite(baseWidth) && baseWidth > 0 ? baseWidth : null,
    };
  };

  const updateMainImageLayout = (patch) => {
    const currentLayout = normalizeMainImageLayout(
      latestMainImageLayoutRef.current ||
      eventDataRef.current?.mainPhotoLayout ||
      MAIN_IMAGE_LAYOUT_DEFAULT
    );
    const nextLayout = normalizeMainImageLayout({
      ...currentLayout,
      ...(patch || {}),
      baseWidth: (patch && Object.prototype.hasOwnProperty.call(patch, 'baseWidth'))
        ? patch.baseWidth
        : currentLayout.baseWidth || composerFrameWidth || null,
    });
    latestMainImageLayoutRef.current = nextLayout;
    setMainPhotoLayoutView(nextLayout);
    eventDataRef.current = {
      ...(eventDataRef.current || {}),
      mainPhotoLayout: nextLayout,
    };

    setEventData(prevData => {
      return {
        ...prevData,
        mainPhotoLayout: nextLayout,
      };
    });
  };

  const getMainImageLayout = () => {
    const layout = normalizeMainImageLayout(
      latestMainImageLayoutRef.current ||
      eventDataRef.current?.mainPhotoLayout ||
      eventData.mainPhotoLayout ||
      MAIN_IMAGE_LAYOUT_DEFAULT
    );
    const nextLayout = layout.baseWidth || !composerFrameWidth
      ? layout
      : { ...layout, baseWidth: composerFrameWidth };
    latestMainImageLayoutRef.current = nextLayout;
    return nextLayout;
  };

  const commitMainImageLayout = () => {
    const layout = normalizeMainImageLayout(
      latestMainImageLayoutRef.current ||
      eventDataRef.current?.mainPhotoLayout ||
      MAIN_IMAGE_LAYOUT_DEFAULT
    );
    const nextLayout = {
      ...layout,
      baseWidth: layout.baseWidth || composerFrameWidth || null,
    };
    latestMainImageLayoutRef.current = nextLayout;
    setMainPhotoLayoutView(nextLayout);
    eventDataRef.current = {
      ...(eventDataRef.current || {}),
      mainPhotoLayout: nextLayout,
    };
    setEventData(prevData => ({
      ...prevData,
      mainPhotoLayout: nextLayout,
    }));
    return nextLayout;
  };

  const normalizeMemorialTextLayout = (layout) => {
    const raw = layout && typeof layout === 'object' ? layout : {};
    const scale = Number(raw.scale);
    const translateX = Number(raw.translateX);
    const translateY = Number(raw.translateY);
    const baseWidth = Number(raw.baseWidth);
    return {
      scale: Number.isFinite(scale) ? Math.min(MEMORIAL_TEXT_MAX_SCALE, Math.max(MEMORIAL_TEXT_MIN_SCALE, scale)) : MEMORIAL_TEXT_LAYOUT_DEFAULT.scale,
      translateX: Number.isFinite(translateX) ? Math.min(MEMORIAL_TEXT_TRANSLATE_LIMIT, Math.max(-MEMORIAL_TEXT_TRANSLATE_LIMIT, translateX)) : MEMORIAL_TEXT_LAYOUT_DEFAULT.translateX,
      translateY: Number.isFinite(translateY) ? Math.min(MEMORIAL_TEXT_TRANSLATE_LIMIT, Math.max(-MEMORIAL_TEXT_TRANSLATE_LIMIT, translateY)) : MEMORIAL_TEXT_LAYOUT_DEFAULT.translateY,
      baseWidth: Number.isFinite(baseWidth) && baseWidth > 0 ? baseWidth : null,
    };
  };

  const updateMemorialTextLayout = (patch) => {
    setEventData(prevData => {
      const nextLayout = normalizeMemorialTextLayout({
        ...(prevData.memorialTextLayout || MEMORIAL_TEXT_LAYOUT_DEFAULT),
        ...(patch || {}),
      });
      latestMemorialTextLayoutRef.current = nextLayout;
      return {
        ...prevData,
        memorialTextLayout: nextLayout,
      };
    });
  };

  const getMemorialTextLayout = () => {
    const layout = normalizeMemorialTextLayout(eventData.memorialTextLayout || latestMemorialTextLayoutRef.current || MEMORIAL_TEXT_LAYOUT_DEFAULT);
    latestMemorialTextLayoutRef.current = layout;
    return layout;
  };

  const applyMemorialTextAdjust = (axis, delta) => {
    const layout = getActiveMemorialTextLayout();
    if (axis === 'scale') {
      updateActiveMemorialTextLayout({ scale: layout.scale + delta });
      return;
    }
    const renderScale = getLayoutRenderScale(layout);
    const normalizedDelta = renderScale ? delta / renderScale : delta;
    if (axis === 'x') {
      updateActiveMemorialTextLayout({ translateX: layout.translateX + normalizedDelta });
      return;
    }
    updateActiveMemorialTextLayout({ translateY: layout.translateY + normalizedDelta });
  };

  const resetMemorialTextLayout = () => {
    latestMemorialTextLayoutRef.current = { ...MEMORIAL_TEXT_LAYOUT_DEFAULT };
    setEventData(prevData => ({
      ...prevData,
      memorialTextLayout: { ...MEMORIAL_TEXT_LAYOUT_DEFAULT },
    }));
  };

  const getMemorialNameLayout = () => {
    const layout = normalizeMemorialTextLayout(latestMemorialNameLayoutRef.current || eventDataRef.current?.memorialNameLayout || eventData.memorialNameLayout || MEMORIAL_NAME_LAYOUT_DEFAULT);
    latestMemorialNameLayoutRef.current = layout;
    return layout;
  };

  const getMemorialDateLayout = () => {
    const layout = normalizeMemorialTextLayout(latestMemorialDateLayoutRef.current || eventDataRef.current?.memorialDateLayout || eventData.memorialDateLayout || MEMORIAL_DATE_LAYOUT_DEFAULT);
    latestMemorialDateLayoutRef.current = layout;
    return layout;
  };

  const getActiveMemorialTextLayout = () => (
    textAdjustTargetRef.current === 'date' ? getMemorialDateLayout() : getMemorialNameLayout()
  );

  const getLayoutRenderScale = (layout, compact = false) => {
    if (compact) return 0.55;
    const baseWidth = Number(layout?.baseWidth);
    if (!composerFrameWidth || !Number.isFinite(baseWidth) || baseWidth <= 0) return 1;
    return composerFrameWidth / baseWidth;
  };

  const getMemorialFontOption = (fontId) => (
    MEMORIAL_TEXT_FONT_OPTIONS.find(option => option.id === fontId) || MEMORIAL_TEXT_FONT_OPTIONS[0]
  );

  const getMemorialFontStyle = (target) => {
    const fontId = target === 'date' ? eventData.memorialDateFontId : eventData.memorialNameFontId;
    const color = target === 'date'
      ? (eventData.memorialDateColor || MEMORIAL_DATE_DEFAULT_COLOR)
      : (eventData.memorialNameColor || MEMORIAL_NAME_DEFAULT_COLOR);
    const option = getMemorialFontOption(fontId);
    return [
      option.fontFamily ? { fontFamily: option.fontFamily } : null,
      option.fontFamily ? { fontWeight: '400' } : null,
      { color },
    ];
  };

  const updateMemorialFont = (target, fontId) => {
    setEventData(prevData => (
      target === 'date'
        ? { ...prevData, memorialDateFontId: fontId }
        : { ...prevData, memorialNameFontId: fontId }
    ));
  };

  const updateMemorialTextColor = (target, color) => {
    setEventData(prevData => (
      target === 'date'
        ? { ...prevData, memorialDateColor: color }
        : { ...prevData, memorialNameColor: color }
    ));
  };

  const updateMemorialTextVisible = (target, visible) => {
    setEventData(prevData => (
      target === 'date'
        ? { ...prevData, memorialDateVisible: visible }
        : { ...prevData, memorialNameVisible: visible }
    ));
  };

  const setActiveTextAdjustTarget = (target) => {
    const nextTarget = target === 'date' ? 'date' : 'name';
    textAdjustTargetRef.current = nextTarget;
    setTextAdjustTarget(nextTarget);
  };

  const updateActiveMemorialTextLayout = (patch) => {
    const target = textAdjustTargetRef.current === 'date' ? 'date' : 'name';
    const currentLayout = normalizeMemorialTextLayout(
      target === 'date'
        ? (latestMemorialDateLayoutRef.current || eventDataRef.current?.memorialDateLayout || MEMORIAL_DATE_LAYOUT_DEFAULT)
        : (latestMemorialNameLayoutRef.current || eventDataRef.current?.memorialNameLayout || MEMORIAL_NAME_LAYOUT_DEFAULT)
    );
    const safePatch = { ...(patch || {}) };
    if (!Object.prototype.hasOwnProperty.call(safePatch, 'scale')) {
      safePatch.scale = currentLayout.scale;
    }
    const nextLayout = normalizeMemorialTextLayout({
      ...currentLayout,
      ...safePatch,
      baseWidth: Object.prototype.hasOwnProperty.call(safePatch, 'baseWidth')
        ? safePatch.baseWidth
        : currentLayout.baseWidth || composerFrameWidth || null,
    });

    if (target === 'date') {
      latestMemorialDateLayoutRef.current = nextLayout;
      setMemorialDateLayoutView(nextLayout);
      eventDataRef.current = {
        ...(eventDataRef.current || {}),
        memorialDateLayout: nextLayout,
      };
      setEventData(prevData => ({ ...prevData, memorialDateLayout: nextLayout }));
      return;
    }

    latestMemorialNameLayoutRef.current = nextLayout;
    setMemorialNameLayoutView(nextLayout);
    eventDataRef.current = {
      ...(eventDataRef.current || {}),
      memorialNameLayout: nextLayout,
    };
    setEventData(prevData => ({ ...prevData, memorialNameLayout: nextLayout }));
  };

  const commitActiveMemorialTextLayout = () => {
    const target = textAdjustTargetRef.current === 'date' ? 'date' : 'name';
    const layout = normalizeMemorialTextLayout(
      target === 'date'
        ? (latestMemorialDateLayoutRef.current || eventDataRef.current?.memorialDateLayout || MEMORIAL_DATE_LAYOUT_DEFAULT)
        : (latestMemorialNameLayoutRef.current || eventDataRef.current?.memorialNameLayout || MEMORIAL_NAME_LAYOUT_DEFAULT)
    );
    const nextLayout = {
      ...layout,
      baseWidth: layout.baseWidth || composerFrameWidth || null,
    };

    if (target === 'date') {
      latestMemorialDateLayoutRef.current = nextLayout;
      setMemorialDateLayoutView(nextLayout);
      eventDataRef.current = { ...(eventDataRef.current || {}), memorialDateLayout: nextLayout };
      setEventData(prevData => ({ ...prevData, memorialDateLayout: nextLayout }));
      return nextLayout;
    }

    latestMemorialNameLayoutRef.current = nextLayout;
    setMemorialNameLayoutView(nextLayout);
    eventDataRef.current = { ...(eventDataRef.current || {}), memorialNameLayout: nextLayout };
    setEventData(prevData => ({ ...prevData, memorialNameLayout: nextLayout }));
    return nextLayout;
  };

  const getSelectedPhotoFrame = () => {
    const selectedFrameId = eventData.selectedPhotoFrameId || FUNERAL_PHOTO_FRAMES[0]?.id;
    return FUNERAL_PHOTO_FRAMES.find((frame) => frame.id === selectedFrameId) || FUNERAL_PHOTO_FRAMES[0] || null;
  };

  const getPhotoFrameAspectRatio = (frame) => {
    if (!frame?.source) return 3 / 4;
    const source = Image.resolveAssetSource(frame.source);
    return source?.width && source?.height ? source.width / source.height : 3 / 4;
  };

  const handlePhotoFrameSelect = (frameId) => {
    setEventData(prevData => ({
      ...prevData,
      selectedPhotoFrameId: frameId,
    }));
  };

  const applyMainImageAdjust = (axis, delta) => {
    const layout = latestMainImageLayoutRef.current || getMainImageLayout();

    if (axis === 'scale') {
      updateMainImageLayout({
        scale: layout.scale + delta,
      });
      return;
    }

    if (axis === 'x') {
      updateMainImageLayout({
        translateX: layout.translateX + delta,
      });
      return;
    }

    updateMainImageLayout({
      translateY: layout.translateY + delta,
    });
  };

  const resetMainImageLayout = () => {
    latestMainImageLayoutRef.current = { ...MAIN_IMAGE_LAYOUT_DEFAULT };
    setMainPhotoLayoutView({ ...MAIN_IMAGE_LAYOUT_DEFAULT });
    eventDataRef.current = {
      ...(eventDataRef.current || {}),
      mainPhotoLayout: { ...MAIN_IMAGE_LAYOUT_DEFAULT },
    };
    setEventData(prevData => ({
      ...prevData,
      mainPhotoLayout: {
        ...MAIN_IMAGE_LAYOUT_DEFAULT,
      },
    }));
  };

  const clampJoystickOffset = (value) => Math.min(PHOTO_JOYSTICK_LIMIT, Math.max(-PHOTO_JOYSTICK_LIMIT, value));

  const stopJoystickMotion = () => {
    if (joystickTimerRef.current) {
      clearInterval(joystickTimerRef.current);
      joystickTimerRef.current = null;
    }
    joystickVelocityRef.current = { x: 0, y: 0 };
  };

  const startJoystickMotion = () => {
    if (joystickTimerRef.current) return;

    joystickTimerRef.current = setInterval(() => {
      const velocity = joystickVelocityRef.current;
      const stepX = Math.abs(velocity.x) < PHOTO_JOYSTICK_DEAD_ZONE ? 0 : Math.sign(velocity.x) * PHOTO_JOYSTICK_VELOCITY;
      const stepY = Math.abs(velocity.y) < PHOTO_JOYSTICK_DEAD_ZONE ? 0 : Math.sign(velocity.y) * PHOTO_JOYSTICK_VELOCITY;
      if (stepX === 0 && stepY === 0) {
        return;
      }

      const currentLayout = latestMainImageLayoutRef.current || MAIN_IMAGE_LAYOUT_DEFAULT;
      const renderScale = getLayoutRenderScale(currentLayout);
      updateMainImageLayout({
        translateX: currentLayout.translateX + (renderScale ? stepX / renderScale : stepX),
        translateY: currentLayout.translateY + (renderScale ? stepY / renderScale : stepY),
      });
    }, 16);
  };

  React.useEffect(() => () => stopJoystickMotion(), []);

  const photoJoystickPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        joystickStartLayoutRef.current = commitMainImageLayout();
        joystickVelocityRef.current = { x: 0, y: 0 };
        setPhotoJoystickKnob({ x: 0, y: 0 });
        startJoystickMotion();
      },
      onPanResponderMove: (_, gestureState) => {
        const knobX = clampJoystickOffset(gestureState.dx);
        const knobY = clampJoystickOffset(gestureState.dy);
        setPhotoJoystickKnob({ x: knobX, y: knobY });
        joystickVelocityRef.current = { x: knobX, y: knobY };
      },
      onPanResponderRelease: () => {
        stopJoystickMotion();
        commitMainImageLayout();
        setPhotoJoystickKnob({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => {
        stopJoystickMotion();
        commitMainImageLayout();
        setPhotoJoystickKnob({ x: 0, y: 0 });
      },
    })
  ).current;

  const textJoystickPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        textJoystickStartLayoutRef.current = commitActiveMemorialTextLayout();
        setTextJoystickKnob({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        const knobX = clampJoystickOffset(gestureState.dx);
        const knobY = clampJoystickOffset(gestureState.dy);
        setTextJoystickKnob({ x: knobX, y: knobY });
        const startLayout = textJoystickStartLayoutRef.current || MEMORIAL_TEXT_LAYOUT_DEFAULT;
        const currentLayout = getActiveMemorialTextLayout();
        const renderScale = getLayoutRenderScale(currentLayout);
        updateActiveMemorialTextLayout({
          scale: currentLayout.scale,
          translateX: startLayout.translateX + (renderScale ? gestureState.dx / renderScale : gestureState.dx),
          translateY: startLayout.translateY + (renderScale ? gestureState.dy / renderScale : gestureState.dy),
        });
      },
      onPanResponderRelease: () => {
        commitActiveMemorialTextLayout();
        setTextJoystickKnob({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => {
        commitActiveMemorialTextLayout();
        setTextJoystickKnob({ x: 0, y: 0 });
      },
    })
  ).current;

  const withUploadTimeout = (promise, message = '업로드 시간이 초과되었습니다.') => (
    Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), UPLOAD_TIMEOUT_MS);
      }),
    ])
  );

  const prepareImageForUpload = async (asset) => {
    const converted = await Promise.race([
      ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 900 } }],
        { compress: 0.78, format: ImageManipulator.SaveFormat.JPEG }
      ),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('이미지 변환 시간이 초과되었습니다.')), IMAGE_PREP_TIMEOUT_MS);
      }),
    ]);

    return converted?.uri || asset.uri;
  };

  const fillTestFuneralData = () => {
    const sampleImageUri = Image.resolveAssetSource(require('../../../../assets/funeral/templates/oldface.png')).uri;
    latestMainImageLayoutRef.current = { ...MAIN_IMAGE_LAYOUT_DEFAULT };
    latestMemorialTextLayoutRef.current = { ...MEMORIAL_TEXT_LAYOUT_DEFAULT };
    latestMemorialNameLayoutRef.current = { ...MEMORIAL_NAME_LAYOUT_DEFAULT };
    latestMemorialDateLayoutRef.current = { ...MEMORIAL_DATE_LAYOUT_DEFAULT };
    setMainPhotoLayoutView({ ...MAIN_IMAGE_LAYOUT_DEFAULT });
    setMemorialNameLayoutView({ ...MEMORIAL_NAME_LAYOUT_DEFAULT });
    setMemorialDateLayoutView({ ...MEMORIAL_DATE_LAYOUT_DEFAULT });
    const sampleData = syncCalculatedAge({
      ...eventData,
      title: '故 김정담 부고',
      date: new Date(2037, 4, 13, 12),
      time: new Date(2037, 4, 13, 9, 0),
      location: '서울특별시 송파구 올림픽로43길 88',
      detailedAddress: '지하 1층 3호실',
      deceasedName: '김정담',
      birthDate: new Date(1972, 2, 7, 12),
      ageCalculationMethod: 'korean_year',
      deathDate: new Date(2037, 4, 11, 12),
      deathTime: new Date(2037, 4, 11, 6, 30),
      deceasedGender: '남',
      religiousRite: '무교/일반',
      funeralMethod: '일반 장례',
      casketDate: new Date(2037, 4, 12, 12),
      casketTime: new Date(2037, 4, 12, 14, 0),
      burialDate: new Date(2037, 4, 13, 12),
      burialTime: new Date(2037, 4, 13, 9, 0),
      burialLocation: '서울추모공원',
      secondaryBurialLocation: '분당메모리얼파크 봉안당',
      familyMembers: [
        { relation: '배우자', names: '이영희' },
        { relation: '장남', names: '김민준' },
        { relation: '장녀', names: '김서연' },
      ],
      primaryContact: '010-1234-5678',
      secondaryContact: '010-2345-6789',
      funeralDirector: '박지도',
      funeralHome: '서울아산병원 장례식장',
      funeralAddress: '서울특별시 송파구 올림픽로43길 88',
      visitationType: 'available',
      visitationNote: '조문은 5월 11일 오후 2시 이후부터 가능합니다.',
      parkingTransportInfo: '장례식장 지하 주차장 이용 가능하며, 2호선 잠실나루역에서 도보 이동 가능합니다.',
      condolenceAccounts: [
        { ownerName: '김민준', bankName: 'KB국민은행', accountNumber: formatAccountNumber('12345612345678', 'KB') },
      ],
      customMessage: FUNERAL_MESSAGE_TEMPLATES[0],
      allowMessages: true,
      messageSettings: {
        placeholder: '삼가 고인의 명복을 빕니다.',
        requireLogin: true,
      },
      selectedTemplate: null,
      selectedPhotoFrameId: FUNERAL_PHOTO_FRAMES[0]?.id || 'photo-frame-rectangle',
      mainPhotoLayout: { ...MAIN_IMAGE_LAYOUT_DEFAULT },
      memorialTextLayout: { ...MEMORIAL_TEXT_LAYOUT_DEFAULT },
      memorialNameLayout: { ...MEMORIAL_NAME_LAYOUT_DEFAULT },
      memorialDateLayout: { ...MEMORIAL_DATE_LAYOUT_DEFAULT },
      memorialNameFontId: MEMORIAL_TEXT_FONT_OPTIONS[0].id,
      memorialDateFontId: MEMORIAL_TEXT_FONT_OPTIONS[0].id,
      memorialNameColor: MEMORIAL_NAME_DEFAULT_COLOR,
      memorialDateColor: MEMORIAL_DATE_DEFAULT_COLOR,
      memorialNameVisible: true,
      memorialDateVisible: true,
      images: [{
        id: `test-funeral-main-${Date.now()}`,
        uri: sampleImageUri,
        publicUrl: sampleImageUri,
        category: 'main',
        categoryLabel: '고인 사진',
        storagePath: null,
      }],
    });

    eventDataRef.current = sampleData;
    setEventData(sampleData);
    setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 50);
  };

  const updateFamilyMember = (index, patch) => {
    setEventData(prevData => {
      const familyMembers = [...prevData.familyMembers];
      familyMembers[index] = { ...familyMembers[index], ...patch };
      return { ...prevData, familyMembers };
    });
  };

  const addFamilyMember = (relation) => {
    setEventData(prevData => ({
      ...prevData,
      familyMembers: [...prevData.familyMembers, { relation, names: '' }],
    }));
  };

  const openRelationPicker = (index = null) => {
    setRelationPicker({ visible: true, index });
  };

  const handleRelationSelect = (relation) => {
    if (relationPicker.index === null) {
      addFamilyMember(relation);
    } else {
      updateFamilyMember(relationPicker.index, { relation });
    }
    setRelationPicker({ visible: false, index: null });
  };

  const updateCondolenceAccount = (index, patch) => {
    setEventData(prevData => {
      const condolenceAccounts = [...prevData.condolenceAccounts];
      condolenceAccounts[index] = { ...condolenceAccounts[index], ...patch };
      return { ...prevData, condolenceAccounts };
    });
  };

  const handleAccountNumberChange = (index, value) => {
    const account = eventData.condolenceAccounts[index];
    const bank = findBank(account?.bankName);
    updateCondolenceAccount(index, {
      accountNumber: formatAccountNumber(value, bank?.code),
    });
  };

  const handleBankSelect = (bankName) => {
    const selectedIndex = bankPicker.index;
    setBankPicker({ visible: false, index: null });

    if (selectedIndex !== null) {
      const bank = findBank(bankName);
      setEventData(prevData => {
        const condolenceAccounts = [...prevData.condolenceAccounts];
        const account = condolenceAccounts[selectedIndex] || {};
        condolenceAccounts[selectedIndex] = {
          ...account,
          bankName,
          accountNumber: formatAccountNumber(account.accountNumber || '', bank?.code),
        };
        return { ...prevData, condolenceAccounts };
      });
    }
  };

  // 사진 관련 함수들
  const getCategoryImageCount = (category) => {
    const count = eventData.images.filter(img => img.category === category).length;
    console.log(`🔍 [DEBUG] ${category} 카테고리 이미지 개수:`, count);
    return count;
  };

  const getCategoryImages = (category) => {
    const images = eventData.images.filter(img => img.category === category);
    console.log(`🔍 [DEBUG] ${category} 카테고리 이미지들:`, images.map(img => ({ id: img.id, category: img.category })));
    return images;
  };

  const removeImage = async (imageId) => {
    console.log('🔍 [DEBUG] 이미지 제거 요청 ID:', imageId);
    
    setEventData(prevData => {
      const imageToRemove = prevData.images.find(img => img.id === imageId);
      console.log('🔍 [DEBUG] 제거할 이미지:', imageToRemove);
      
      if (imageToRemove?.storagePath) {
        deleteImageFromStorage(imageToRemove.storagePath)
          .then(result => {
            if (result.success) {
              console.log('✅ Storage에서 이미지 삭제 완료:', imageToRemove.storagePath);
            } else {
              console.log('⚠️ Storage 이미지 삭제 실패:', result.error);
            }
          })
          .catch(error => {
            console.log('⚠️ Storage 이미지 삭제 중 오류:', error);
          });
      }
      
      const newImages = prevData.images.filter(img => img.id !== imageId);
      console.log('🔍 [DEBUG] 제거 후 남은 이미지들:', newImages.map(img => ({ id: img.id, category: img.category })));
      
      return { 
        ...prevData, 
        images: newImages 
      };
    });
  };

  const getCategorizedImages = () => {
    const categorized = {
      main: eventData.images.filter(img => img.category === 'main'),
      all: eventData.images
    };

    console.log('🔍 [DEBUG] 부고 카테고리별 이미지 객체:', {
      main: categorized.main.length,
      total: categorized.all.length
    });

    return categorized;
  };

  const pickImagesForCategory = async (category) => {
    try {
      console.log('🔍 [DEBUG] 카테고리 선택:', category.key, category.label);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showTossModal('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요해요', () => {});
        return;
      }
  
      const currentCount = getCategoryImageCount(category.key);
      const remainingCount = category.maxCount - currentCount;
  
      console.log('🔍 [DEBUG] 현재 카운트:', currentCount, '남은 카운트:', remainingCount);
  
      if (remainingCount <= 0) {
        showTossModal('알림', `${category.label}은 최대 ${category.maxCount}장까지 업로드 가능해요`, () => {});
        return;
      }
  
      const allowsMultiple = remainingCount > 1 && category.maxCount > 1;
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: allowsMultiple,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('🔍 [DEBUG] 선택된 이미지 개수:', result.assets.length);

        const selectedImages = result.assets.slice(0, remainingCount);
        const tempEventId = eventData.tempEventId || `temp_${Date.now()}`;

        if (Platform.OS === 'ios') {
          latestMainImageLayoutRef.current = { ...MAIN_IMAGE_LAYOUT_DEFAULT };
          latestMemorialTextLayoutRef.current = { ...MEMORIAL_TEXT_LAYOUT_DEFAULT };
          latestMemorialNameLayoutRef.current = { ...MEMORIAL_NAME_LAYOUT_DEFAULT };
          latestMemorialDateLayoutRef.current = { ...MEMORIAL_DATE_LAYOUT_DEFAULT };
          setMainPhotoLayoutView({ ...MAIN_IMAGE_LAYOUT_DEFAULT });
          setMemorialNameLayoutView({ ...MEMORIAL_NAME_LAYOUT_DEFAULT });
          setMemorialDateLayoutView({ ...MEMORIAL_DATE_LAYOUT_DEFAULT });
          const localImages = selectedImages.map((asset, index) => {
            const timestamp = Date.now() + index;
            return {
              ...asset,
              uri: asset.uri,
              originalUri: asset.uri,
              category: category.key,
              categoryLabel: category.label,
              id: `${category.key}_local_${timestamp}_${index}`,
              publicUrl: null,
              storagePath: null,
              eventId: tempEventId,
              uploadSuccess: false,
              localOnly: true,
            };
          });

          setEventData(prevData => {
            const nextData = {
              ...prevData,
              images: [
                ...prevData.images.filter(img => img.category !== category.key),
                ...localImages,
              ],
              tempEventId,
              mainPhotoLayout: { ...MAIN_IMAGE_LAYOUT_DEFAULT },
              memorialTextLayout: { ...MEMORIAL_TEXT_LAYOUT_DEFAULT },
              memorialNameLayout: { ...MEMORIAL_NAME_LAYOUT_DEFAULT },
              memorialDateLayout: { ...MEMORIAL_DATE_LAYOUT_DEFAULT },
            };
            eventDataRef.current = nextData;
            return nextData;
          });

          setTimeout(() => {
            showTossModal('사진 선택 완료', '사진이 추가되었어요. 액자에 맞춰 위치와 크기를 조절해주세요.', () => {});
          }, 120);
          return;
        }

        const userResult = await getCurrentUserInfo();
        if (!userResult.success) {
          showTossModal('오류', '사용자 정보를 확인할 수 없어요. 다시 로그인해주세요.', () => {});
          return;
        }
  
        const currentUser = userResult.user;
        
        setImageUploadState({
          isUploading: true,
          currentIndex: 0,
          totalCount: selectedImages.length,
          uploadingCategory: category.label,
        });
  
        console.log('🔍 [DEBUG] 이미지 업로드 시작:', selectedImages.length, '개');

        const results = [];
        for (let index = 0; index < selectedImages.length; index += 1) {
          const asset = selectedImages[index];
          try {
            const timestamp = new Date().getTime();
            const fileName = `${category.key}_${timestamp}_${index}.jpg`;
            
            console.log('🔍 [DEBUG] 개별 이미지 업로드 시작:', fileName);

            const uploadUri = await prepareImageForUpload(asset);
  
            const uploadResult = await withUploadTimeout(
              uploadImageToStorage(uploadUri, fileName, currentUser.id, tempEventId)
            );
            
            setImageUploadState(prev => ({
              ...prev,
              currentIndex: index + 1,
            }));
            
            if (uploadResult.success) {
              console.log('✅ 개별 이미지 업로드 성공:', uploadResult.data.publicUrl);
              results.push({
                ...asset,
                uri: uploadUri,
                originalUri: asset.uri,
                category: category.key,
                categoryLabel: category.label,
                id: `${category.key}_${timestamp}_${index}`,
                publicUrl: uploadResult.data.publicUrl,
                storagePath: uploadResult.data.path,
                eventId: tempEventId,
                uploadSuccess: true,
              });
            } else {
              console.error('❌ 개별 이미지 업로드 실패:', uploadResult.error);
              results.push({
                ...asset,
                originalUri: asset.uri,
                category: category.key,
                categoryLabel: category.label,
                id: `${category.key}_${timestamp}_${index}`,
                eventId: tempEventId,
                uploadSuccess: false,
                error: uploadResult.error,
              });
            }
          } catch (error) {
            console.error('❌ 개별 이미지 처리 오류:', error);
            setImageUploadState(prev => ({
              ...prev,
              currentIndex: index + 1,
            }));
            results.push({
              ...asset,
              originalUri: asset.uri,
              category: category.key,
              categoryLabel: category.label,
              id: `${category.key}_${Date.now()}_${index}`,
              eventId: tempEventId,
              uploadSuccess: false,
              error: error.message,
            });
          }
        }
        
        setImageUploadState({
          isUploading: false,
          currentIndex: 0,
          totalCount: 0,
          uploadingCategory: null,
        });
  
        const successfulUploads = results.filter(result => result.uploadSuccess);
        const failedUploads = results.filter(result => !result.uploadSuccess);
        
        console.log('🔍 [DEBUG] 업로드 결과:', {
          total: results.length,
          success: successfulUploads.length,
          failed: failedUploads.length
        });
  
        if (successfulUploads.length > 0) {
          if (category.maxCount === 1) {
            latestMainImageLayoutRef.current = { ...MAIN_IMAGE_LAYOUT_DEFAULT };
            latestMemorialTextLayoutRef.current = { ...MEMORIAL_TEXT_LAYOUT_DEFAULT };
            latestMemorialNameLayoutRef.current = { ...MEMORIAL_NAME_LAYOUT_DEFAULT };
            latestMemorialDateLayoutRef.current = { ...MEMORIAL_DATE_LAYOUT_DEFAULT };
            setMainPhotoLayoutView({ ...MAIN_IMAGE_LAYOUT_DEFAULT });
            setMemorialNameLayoutView({ ...MEMORIAL_NAME_LAYOUT_DEFAULT });
            setMemorialDateLayoutView({ ...MEMORIAL_DATE_LAYOUT_DEFAULT });
          }
          setEventData(prevData => {
            let updatedImages;
            
            if (category.maxCount === 1) {
              const otherCategoryImages = prevData.images.filter(img => img.category !== category.key);
              updatedImages = [...otherCategoryImages, ...successfulUploads];
            } else {
              updatedImages = [...prevData.images, ...successfulUploads];
            }
  
            console.log('🔍 [DEBUG] 최종 이미지 배열 업데이트:', updatedImages.length, '개');
            
            const nextData = {
              ...prevData,
              images: updatedImages,
              tempEventId: tempEventId,
              ...(category.maxCount === 1 ? {
                mainPhotoLayout: { ...MAIN_IMAGE_LAYOUT_DEFAULT },
                memorialTextLayout: { ...MEMORIAL_TEXT_LAYOUT_DEFAULT },
                memorialNameLayout: { ...MEMORIAL_NAME_LAYOUT_DEFAULT },
                memorialDateLayout: { ...MEMORIAL_DATE_LAYOUT_DEFAULT },
              } : {}),
            };
            eventDataRef.current = nextData;
            return nextData;
          });
  
          setTimeout(() => {
            if (failedUploads.length > 0) {
              showTossModal(
                '일부 업로드 실패',
                `${successfulUploads.length}장은 성공했지만 ${failedUploads.length}장 업로드에 실패했어요. 다시 시도해주세요.`,
                () => {}
              );
            } else {
              showTossModal(
                '업로드 완료',
                `${successfulUploads.length}장의 이미지가 성공적으로 업로드되었어요!`,
                () => {}
              );
            }
          }, 120);
        } else {
          setTimeout(() => {
            showTossModal('업로드 실패', '이미지 업로드에 실패했어요. 네트워크 상태를 확인하고 다시 시도해주세요.', () => {});
          }, 120);
        }
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 이미지 선택 오류:', error);
      setImageUploadState({
        isUploading: false,
        currentIndex: 0,
        totalCount: 0,
        uploadingCategory: null,
      });
      showTossModal('오류', '사진 선택 중 문제가 발생했어요', () => {});
    }
  };

  const handleTemplatePreview = (template) => {
    console.log('🔍 [DEBUG] 템플릿 미리보기 시작:', template.name);
    setPreviewTemplate({
      ...template,
      style: template.style || template.id,
    });
    setShowTemplatePreview(true);
  };

  const handleTemplateSelect = (template) => {
    console.log('🔍 [DEBUG] 템플릿 선택:', template.name);
    setEventData(prevData => ({
      ...prevData,
      selectedTemplate: template,
    }));
    setShowTemplatePreview(false);
  };

  const validateStep1 = () => {
    if (!eventData.deceasedName.trim()) {
      showTossModal('필수 입력', '고인명을 입력해주세요', () => {}, null, 'deceasedInfo');
      return false;
    }
    if (!eventData.birthDate) {
      showTossModal('필수 입력', '생년월일을 선택해주세요', () => {}, null, 'deceasedInfo');
      return false;
    }
    if (!eventData.deathDate) {
      showTossModal('필수 입력', '별세일을 선택해주세요', () => {}, null, 'deceasedInfo');
      return false;
    }
    if (!eventData.deceasedAge.trim()) {
      showTossModal('필수 입력', '생년월일과 별세일을 기준으로 향년을 계산할 수 없어요', () => {}, null, 'deceasedInfo');
      return false;
    }
    if (!eventData.burialDate) {
      showTossModal('필수 입력', '발인일을 선택해주세요', () => {}, null, 'funeralSchedule');
      return false;
    }
    if (!eventData.burialTime) {
      showTossModal('필수 입력', '발인 시간을 선택해주세요', () => {}, null, 'funeralSchedule');
      return false;
    }
    if (!eventData.burialLocation.trim()) {
      showTossModal('필수 입력', '장지를 입력해주세요', () => {}, null, 'funeralSchedule');
      return false;
    }
    if (!eventData.primaryContact.trim()) {
      showTossModal('필수 입력', '주 연락처를 입력해주세요', () => {}, null, 'funeralContact');
      return false;
    }
    if (!eventData.funeralHome.trim()) {
      showTossModal('필수 입력', '장례식장명을 입력해주세요', () => {}, null, 'funeralLocation');
      return false;
    }
    if (!eventData.funeralAddress.trim()) {
      showTossModal('필수 입력', '장례식장 주소를 선택해주세요', () => {}, null, 'funeralLocation');
      return false;
    }
    if (!eventData.detailedAddress.trim()) {
      showTossModal('필수 입력', '빈소 위치를 입력해주세요', () => {}, null, 'funeralLocation');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const mainImageCount = getCategoryImageCount('main');
    if (mainImageCount === 0) {
      showTossModal('필수 입력', '고인 사진을 최소 1장 이상 업로드해주세요', () => {}, null, 'photos');
      return false;
    }
    if (!getSelectedPhotoFrame()) {
      showTossModal('필수 입력', '고인 사진 액자를 선택해 주세요', () => {}, null, 'photos');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setPhotoAdjustMode(false);
        setTextAdjustMode(false);
        setCurrentStep(2);
      }
      return;
    }

    if (currentStep === 2) {
      if (!validateStep2()) {
        return;
      }
      setPhotoAdjustMode(false);
      setTextAdjustMode(false);
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      handleSave();
      return;
    }
  };

  const handlePreviousStep = () => {
    setPhotoAdjustMode(false);
    setTextAdjustMode(false);
    stopJoystickMotion();
    setPhotoJoystickKnob({ x: 0, y: 0 });
    setTextJoystickKnob({ x: 0, y: 0 });
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  const getStepButtonText = () => {
    if (isLoading) {
      return '생성 중...';
    }
    if (imageUploadState.isUploading) {
      return '이미지 업로드 중...';
    }

    if (currentStep === 1 || currentStep === 2) {
      return '다음';
    }

    return isEditMode ? '수정 저장하기' : '부고 만들기';
  };

  const getStepButtonDisabled = () =>
    isLoading ||
    imageUploadState.isUploading ||
    (currentStep === 2 && (getCategoryImageCount('main') === 0 || !getSelectedPhotoFrame())) ||
    (currentStep === 3 && (!eventData.selectedTemplate || getCategoryImageCount('main') === 0));

  const renderPhotoAdjustmentOverlay = () => {
    const layout = mainPhotoLayoutView;
    const previewImage = getCategoryImages('main')[0];

    if (!previewImage || !photoAdjustMode) {
      return null;
    }

    const scalePct = Math.round(layout.scale * 100);

    return (
      <View style={styles.photoAdjustOverlay} pointerEvents="box-none">
        <View style={styles.photoScaleFloating}>
          <Text style={styles.photoScaleValue}>{scalePct}%</Text>
          <TouchableOpacity style={styles.photoScaleButton} onPress={() => applyMainImageAdjust('scale', 0.05)} activeOpacity={0.85}>
            <Ionicons name="add" size={21} color={TossColors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoScaleButton} onPress={() => applyMainImageAdjust('scale', -0.05)} activeOpacity={0.85}>
            <Ionicons name="remove" size={21} color={TossColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.photoJoystick}>
          <View style={styles.photoJoystickAxisHorizontal} />
          <View style={styles.photoJoystickAxisVertical} />
          <View
            style={[
              styles.photoJoystickKnob,
              {
                transform: [
                  { translateX: photoJoystickKnob.x },
                  { translateY: photoJoystickKnob.y },
                ],
              },
            ]}
            {...photoJoystickPanResponder.panHandlers}
          >
            <View style={styles.photoJoystickKnobDot} />
          </View>
        </View>

        <View style={styles.textAdjustDoneWrap}>
          <TouchableOpacity style={styles.textAdjustDoneButton} onPress={() => setPhotoAdjustMode(false)} activeOpacity={0.85}>
            <Text style={styles.photoAdjustDoneText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPhotoAdjustOpenButton = () => {
    const previewImage = getCategoryImages('main')[0];

    if (!previewImage || photoAdjustMode || textAdjustMode) {
      return null;
    }

    return (
      <View style={styles.photoAdjustOpenFloating} pointerEvents="box-none">
        <TouchableOpacity style={styles.photoAdjustOpenButton} onPress={() => setPhotoAdjustMode(true)} activeOpacity={0.86}>
          <Ionicons name="move-outline" size={18} color={TossColors.primary} />
          <Text style={styles.photoAdjustOpenText}>위치 조정</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMemorialTextOverlay = ({ compact = false } = {}) => {
    const nameLayout = memorialNameLayoutView;
    const dateLayout = memorialDateLayoutView;
    const name = eventData.deceasedName?.trim() || '고인명';
    const birth = formatMemorialDate(eventData.birthDate) || '1948. 03. 12';
    const death = formatMemorialDate(eventData.deathDate) || '2026. 05. 12';
    const nameRenderScale = getLayoutRenderScale(nameLayout, compact);
    const dateRenderScale = getLayoutRenderScale(dateLayout, compact);
    const textSizeScale = compact ? 1 : Math.min(1.35, Math.max(0.55, nameRenderScale || 1));
    const dateSizeScale = compact ? 1 : Math.min(1.35, Math.max(0.55, dateRenderScale || 1));

    return (
      <>
        {eventData.memorialNameVisible !== false && (
          <View
            pointerEvents="none"
            style={[
              compact ? styles.memorialNameOverlayCompact : styles.memorialNameOverlay,
              {
                transform: [
                  { translateX: nameLayout.translateX * nameRenderScale },
                  { translateY: nameLayout.translateY * nameRenderScale },
                  { scale: nameLayout.scale },
                ],
              },
            ]}
          >
            <Text
              style={[
                compact ? styles.memorialNameTextCompact : styles.memorialNameText,
                !compact && { fontSize: 28 * textSizeScale, lineHeight: 34 * textSizeScale },
                getMemorialFontStyle('name'),
              ]}
            >
              故 {name}
            </Text>
          </View>
        )}
        {eventData.memorialDateVisible !== false && (
          <View
            pointerEvents="none"
            style={[
              compact ? styles.memorialDateOverlayCompact : styles.memorialDateOverlay,
              {
                transform: [
                  { translateX: dateLayout.translateX * dateRenderScale },
                  { translateY: dateLayout.translateY * dateRenderScale },
                  { scale: dateLayout.scale },
                ],
              },
            ]}
          >
            <Text
              style={[
                compact ? styles.memorialDateTextCompact : styles.memorialDateText,
                !compact && { marginTop: 6 * dateSizeScale, fontSize: 13 * dateSizeScale, lineHeight: 18 * dateSizeScale },
                getMemorialFontStyle('date'),
              ]}
            >
              {birth} ~ {death}
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderComposedPhotoFrame = ({ compact = false, insideExistingFrame = false } = {}) => {
    const selectedPhoto = getCategoryImages('main')[0];
    const selectedPhotoUri = selectedPhoto?.publicUrl || selectedPhoto?.uri;
    const selectedFrame = getSelectedPhotoFrame();
    const layout = compact ? mainPhotoLayoutView : getMainImageLayout();
    const frameAspectRatio = getPhotoFrameAspectRatio(selectedFrame);
    const renderScale = getLayoutRenderScale(layout, compact);

    if (!selectedPhotoUri) {
      return (
        <View style={compact ? styles.templateComposerPhotoPlaceholderCompact : styles.templateComposerPhotoPlaceholder}>
          <Ionicons name="person-circle-outline" size={compact ? 26 : 36} color={TossColors.textTertiary} />
          <Text style={styles.templateComposerPhotoPlaceholderText}>고인 사진 업로드</Text>
        </View>
      );
    }

    const content = (
      <>
        <Image
          source={{ uri: selectedPhotoUri }}
          resizeMode="cover"
          style={[
            styles.templateComposerPhoto,
            {
              transform: [
                { translateX: layout.translateX * renderScale },
                { translateY: layout.translateY * renderScale },
                { scale: layout.scale },
              ],
            },
          ]}
        />
        {selectedFrame?.source ? (
          <Image
            source={selectedFrame.source}
            style={styles.templateComposerOverlay}
            resizeMode="cover"
          />
        ) : null}
        {renderMemorialTextOverlay({ compact })}
      </>
    );

    if (insideExistingFrame) {
      return content;
    }

    return (
      <View style={[
        compact ? styles.templateComposerPhotoFrameCompact : styles.templateComposerPhotoFrame,
        { aspectRatio: frameAspectRatio },
      ]}>
        {content}
      </View>
    );
  };

  const renderTextAdjustmentOverlay = () => {
    const layout = textAdjustTarget === 'date' ? memorialDateLayoutView : memorialNameLayoutView;
    if (!textAdjustMode) return null;
    const scalePct = Math.round(layout.scale * 100);

    return (
      <View style={styles.photoAdjustOverlay} pointerEvents="box-none">
        <View style={styles.photoScaleFloating}>
          <Text style={styles.photoScaleValue}>{scalePct}%</Text>
          <TouchableOpacity style={styles.photoScaleButton} onPress={() => applyMemorialTextAdjust('scale', 0.05)} activeOpacity={0.85}>
            <Ionicons name="add" size={21} color={TossColors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoScaleButton} onPress={() => applyMemorialTextAdjust('scale', -0.05)} activeOpacity={0.85}>
            <Ionicons name="remove" size={21} color={TossColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.photoJoystick}>
          <View style={styles.photoJoystickAxisHorizontal} />
          <View style={styles.photoJoystickAxisVertical} />
          <View
            style={[
              styles.photoJoystickKnob,
              {
                transform: [
                  { translateX: textJoystickKnob.x },
                  { translateY: textJoystickKnob.y },
                ],
              },
            ]}
            {...textJoystickPanResponder.panHandlers}
          >
            <View style={styles.photoJoystickKnobDot} />
          </View>
        </View>

        <View style={styles.textAdjustDoneWrap}>
          <TouchableOpacity style={styles.textAdjustDoneButton} onPress={() => setTextAdjustMode(false)} activeOpacity={0.85}>
            <Text style={styles.photoAdjustDoneText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTextAdjustOpenButton = () => {
    if (photoAdjustMode || textAdjustMode) return null;
    return (
      <View style={styles.textAdjustOpenFloating} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.photoAdjustOpenButton}
          onPress={() => {
            setActiveTextAdjustTarget('name');
            setTextAdjustMode(true);
          }}
          activeOpacity={0.86}
        >
          <Ionicons name="text-outline" size={18} color={TossColors.primary} />
          <Text style={styles.photoAdjustOpenText}>이름 조정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.photoAdjustOpenButton}
          onPress={() => {
            setActiveTextAdjustTarget('date');
            setTextAdjustMode(true);
          }}
          activeOpacity={0.86}
        >
          <Ionicons name="calendar-outline" size={18} color={TossColors.primary} />
          <Text style={styles.photoAdjustOpenText}>날짜 조정</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const openTextAdjustment = (target) => {
    setAdjustMenuOpen(false);
    setActiveTextAdjustTarget(target);
    setTextAdjustMode(true);
  };

  const renderComposerActionFab = () => {
    const previewImage = getCategoryImages('main')[0];

    if (!previewImage || photoAdjustMode || textAdjustMode) {
      return null;
    }

    const actions = [
      {
        key: 'photo',
        label: '사진 조정',
        icon: 'move-outline',
        onPress: () => {
          setAdjustMenuOpen(false);
          setPhotoAdjustMode(true);
        },
      },
      {
        key: 'name',
        label: '이름 조정',
        icon: 'text-outline',
        onPress: () => openTextAdjustment('name'),
      },
      {
        key: 'date',
        label: '날짜 조정',
        icon: 'calendar-outline',
        onPress: () => openTextAdjustment('date'),
      },
      {
        key: 'font',
        label: '글꼴',
        icon: 'color-palette-outline',
        onPress: () => {
          setAdjustMenuOpen(false);
          setFontPickerTarget('name');
          setFontPickerVisible(true);
        },
      },
    ];

    return (
      <View style={styles.composerFabWrap} pointerEvents="box-none">
        {adjustMenuOpen && (
          <View style={styles.composerFabMenu}>
            {actions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={styles.composerFabAction}
                onPress={action.onPress}
                activeOpacity={0.86}
              >
                <Text style={styles.composerFabActionText}>{action.label}</Text>
                <View style={styles.composerFabActionIcon}>
                  <Ionicons name={action.icon} size={18} color={TossColors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[styles.composerFabButton, adjustMenuOpen && styles.composerFabButtonActive]}
          onPress={() => setAdjustMenuOpen(prev => !prev)}
          activeOpacity={0.9}
        >
          <Ionicons name={adjustMenuOpen ? 'close' : 'options-outline'} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const eventTitle = `故 ${eventData.deceasedName} 부고`;
      const categorizedImages = getCategorizedImages();
      console.log('🔍 [DEBUG] 저장할 카테고리별 이미지:', categorizedImages);

      // 부고 데이터 처리
      const validFamilyMembers = eventData.familyMembers
        .filter(member => member.names && member.names.trim())
        .map(member => ({
          relation: member.relation,
          names: member.names.trim()
        }));
      const validCondolenceAccounts = eventData.condolenceAccounts
        .filter(account => account.bankName && account.accountNumber && account.ownerName)
        .map(account => ({
          owner_name: account.ownerName.trim(),
          bank_name: account.bankName,
          account_number: account.accountNumber.trim(),
        }));
      const selectedFrame = FUNERAL_PHOTO_FRAMES.find((frame) => frame.id === eventData.selectedPhotoFrameId);
      const savedMainPhotoLayout = normalizeMainImageLayout(
        latestMainImageLayoutRef.current ||
        mainPhotoLayoutView ||
        eventData.mainPhotoLayout ||
        MAIN_IMAGE_LAYOUT_DEFAULT
      );
      const savedMemorialTextLayout = normalizeMemorialTextLayout(
        latestMemorialTextLayoutRef.current ||
        eventData.memorialTextLayout ||
        MEMORIAL_TEXT_LAYOUT_DEFAULT
      );
      const savedMemorialNameLayout = normalizeMemorialTextLayout(
        latestMemorialNameLayoutRef.current ||
        memorialNameLayoutView ||
        eventData.memorialNameLayout ||
        MEMORIAL_NAME_LAYOUT_DEFAULT
      );
      const savedMemorialDateLayout = normalizeMemorialTextLayout(
        latestMemorialDateLayoutRef.current ||
        memorialDateLayoutView ||
        eventData.memorialDateLayout ||
        MEMORIAL_DATE_LAYOUT_DEFAULT
      );
      
      console.log('🔍 저장할 부고 데이터:', {
        deceasedName: eventData.deceasedName,
        familyMembersCount: validFamilyMembers.length,
        primaryContact: eventData.primaryContact,
        funeralHome: eventData.funeralHome,
        burialLocation: eventData.burialLocation,
        imageCount: eventData.images.length,
        imagesWithPublicUrl: eventData.images.filter(img => img.publicUrl).length,
      });

      let formattedEventData = {
        event_type: 'funeral', // 🔥 고정
        event_name: eventTitle,
        event_date: dateToISODate(eventData.burialDate) || dateToISODate(eventData.casketDate) || dateToISODate(eventData.deathDate),
        template_style: eventData.selectedTemplate?.style || 'modern-card',
        family_relations: eventData.familyRelations,
        preset_amounts: eventData.presetAmounts,
        status: 'active',
        is_finalized: false,
        
        image_urls: eventData.images.map(img => ({
          uri: img.publicUrl || img.uri,
          category: img.category,
          categoryLabel: img.categoryLabel,
          id: img.id,
          storagePath: img.storagePath || null,
          publicUrl: img.publicUrl || null,
          eventId: img.eventId || null
        })),
        
        allow_messages: eventData.allowMessages,
        message_placeholder: eventData.messageSettings.placeholder,
        
        main_person_name: eventData.deceasedName.trim(),
        location: eventData.funeralAddress?.trim() || null,
        detailed_address: eventData.detailedAddress?.trim() || null,
        birth_date: dateToISODate(eventData.birthDate),
        deceased_age: parseInt(eventData.deceasedAge, 10) || null,
        age_calculation_method: eventData.ageCalculationMethod,
        death_date: dateToISODate(eventData.deathDate),
        death_time: timeToISOTime(eventData.deathTime),
        deceased_gender: eventData.deceasedGender || '남',
        religious_rite: eventData.religiousRite,
        funeral_method: eventData.funeralMethod,
        casket_date: dateToISODate(eventData.casketDate),
        casket_time: timeToISOTime(eventData.casketTime),
        burial_date: dateToISODate(eventData.burialDate),
        burial_time: timeToISOTime(eventData.burialTime),
        burial_location: eventData.burialLocation?.trim() || null,
        secondary_burial_location: eventData.secondaryBurialLocation?.trim() || null,
        primary_contact: eventData.primaryContact || null,
        secondary_contact: eventData.secondaryContact || null,
        funeral_director: eventData.funeralDirector?.trim() || null,
        funeral_home: eventData.funeralHome?.trim() || null,
        visitation_type: eventData.visitationType,
        visitation_note: eventData.visitationNote?.trim() || null,
        parking_transport_info: eventData.parkingTransportInfo?.trim() || null,
        condolence_accounts: validCondolenceAccounts,
        custom_message: eventData.customMessage?.trim() || null,
        deceasedName: eventData.deceasedName.trim(),
        familyMembers: validFamilyMembers,
        additional_info: {
          family_members: validFamilyMembers,
          birth_date: dateToISODate(eventData.birthDate),
          photo_frame: {
            id: eventData.selectedPhotoFrameId,
            key: selectedFrame?.key || null,
          },
          age_calculation_method: eventData.ageCalculationMethod,
          main_photo_layout: savedMainPhotoLayout,
          memorial_text_layout: savedMemorialTextLayout,
          memorial_name_layout: savedMemorialNameLayout,
          memorial_date_layout: savedMemorialDateLayout,
          memorial_name_font_id: eventData.memorialNameFontId || MEMORIAL_TEXT_FONT_OPTIONS[0].id,
          memorial_date_font_id: eventData.memorialDateFontId || MEMORIAL_TEXT_FONT_OPTIONS[0].id,
          memorial_name_color: eventData.memorialNameColor || MEMORIAL_NAME_DEFAULT_COLOR,
          memorial_date_color: eventData.memorialDateColor || MEMORIAL_DATE_DEFAULT_COLOR,
          memorial_name_visible: eventData.memorialNameVisible !== false,
          memorial_date_visible: eventData.memorialDateVisible !== false,
          death_time: timeToISOTime(eventData.deathTime),
          religious_rite: eventData.religiousRite,
          funeral_method: eventData.funeralMethod,
          visitation_type: eventData.visitationType,
          visitation_note: eventData.visitationNote?.trim() || null,
          parking_transport_info: eventData.parkingTransportInfo?.trim() || null,
          condolence_accounts: validCondolenceAccounts,
          categorized_images: categorizedImages,
          message_settings: eventData.messageSettings,
          created_via: 'app_v2.3',
          version: '2.3',
        },
        event_creation_credit_reservation: creationCreditReservationRef.current,
      };

      console.log('🔍 [DEBUG] 최종 저장 데이터 - 이미지 정보:', {
        totalImages: formattedEventData.image_urls.length,
        imagesWithPublicUrl: formattedEventData.image_urls.filter(img => img.publicUrl).length,
        imagesWithStoragePath: formattedEventData.image_urls.filter(img => img.storagePath).length,
      });

      creationCreditSettledRef.current = isEditMode || !!creationCreditReservationRef.current;
      const updatePayload = { ...formattedEventData };
      delete updatePayload.event_creation_credit_reservation;
      delete updatePayload.deceasedName;
      delete updatePayload.familyMembers;

      const result = isEditMode
        ? await updateEvent(editEventId, updatePayload)
        : await createEvent(formattedEventData);

      if (result.success) {
        const nextEventId = isEditMode ? editEventId : result.data.id;
        console.log('✅ 부고 이벤트 저장 완료, ID:', nextEventId);
        const displayParams = {
          eventId: nextEventId,
          templateStyle: eventData.selectedTemplate?.style || 'modern-card',
          categorizedImages: categorizedImages,
          allowMessages: eventData.allowMessages,
          messageSettings: eventData.messageSettings,
          closeToHome: true,
        };
        setCreatedDisplayParams(displayParams);
        setIsCreationComplete(true);
        if (completionNavTimeoutRef.current) clearTimeout(completionNavTimeoutRef.current);
        completionNavTimeoutRef.current = setTimeout(() => {
          completionNavTimeoutRef.current = null;
          navigation.navigate('EventDisplay', displayParams);
        }, 2000);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('🔍 [DEBUG] 부고 저장 오류:', error);
      showTossModal('오류', error.message || (isEditMode ? '부고 수정 중 문제가 발생했어요' : '부고 생성 중 문제가 발생했어요'), () => {});
    } finally {
      setIsLoading(false);
    }
  };

  // 연락처 입력 핸들러
  const handleContactChange = (text, field) => {
    const formattedNumber = formatPhoneNumber(text);
    setEventData({ ...eventData, [field]: formattedNumber });
  };

  // 가족 구성원 삭제 함수
  const removeFamilyMember = (index) => {
    const updatedMembers = eventData.familyMembers.filter((_, i) => i !== index);
    setEventData({ ...eventData, familyMembers: updatedMembers });
  };

  // 업로드 취소 핸들러
  const handleUploadCancel = () => {
    setImageUploadState({
      isUploading: false,
      currentIndex: 0,
      totalCount: 0,
      uploadingCategory: null,
    });
    showTossModal('업로드 취소', '이미지 업로드가 취소되었습니다.', () => {});
  };

  // 부고 관련 폼 렌더링 함수들
  const renderDeceasedInfoForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.deceasedInfo = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>고인 정보</Text>
        <Text style={styles.sectionSubtitle}>고인의 기본 정보를 입력해주세요</Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>고인명 *</Text>
        <TextInput
          style={[styles.textInput, !eventData.deceasedName && styles.textInputEmpty]}
          placeholder="홍길동"
          value={eventData.deceasedName}
          onChangeText={(text) => setEventData({ ...eventData, deceasedName: text })}
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>성별</Text>
          <View style={styles.genderSelector}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                eventData.deceasedGender === '남' && styles.genderButtonSelected,
              ]}
              onPress={() => setEventData({ ...eventData, deceasedGender: '남' })}
            >
              <Text style={[
                styles.genderButtonText,
                eventData.deceasedGender === '남' && styles.genderButtonTextSelected,
              ]}>남</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                eventData.deceasedGender === '여' && styles.genderButtonSelected,
              ]}
              onPress={() => setEventData({ ...eventData, deceasedGender: '여' })}
            >
              <Text style={[
                styles.genderButtonText,
                eventData.deceasedGender === '여' && styles.genderButtonTextSelected,
              ]}>여</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>생년월일 *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowBirthDatePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !eventData.birthDate && styles.selectButtonTextEmpty
            ]}>
              {formatDate(eventData.birthDate) || '생년월일 선택'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={TossColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            eventData.ageCalculationMethod === 'korean_year' && styles.segmentButtonSelected,
          ]}
          onPress={() => updateEventData({ ageCalculationMethod: 'korean_year' })}
        >
          <Text style={[
            styles.segmentButtonText,
            eventData.ageCalculationMethod === 'korean_year' && styles.segmentButtonTextSelected,
          ]}>세는 나이</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            eventData.ageCalculationMethod === 'full_age' && styles.segmentButtonSelected,
          ]}
          onPress={() => updateEventData({ ageCalculationMethod: 'full_age' })}
        >
          <Text style={[
            styles.segmentButtonText,
            eventData.ageCalculationMethod === 'full_age' && styles.segmentButtonTextSelected,
          ]}>만 나이</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.inputHintSpaced}>생년월일과 별세일을 선택하면 선택한 나이 기준으로 향년이 자동 계산돼요.</Text>

      <View style={styles.formRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>별세일 *</Text>
          <TouchableOpacity
            style={[styles.selectButton, !eventData.deathDate && styles.selectButtonEmpty]}
            onPress={() => setShowDeathDatePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !eventData.deathDate && styles.selectButtonTextEmpty
            ]}>
              {formatDate(eventData.deathDate) || '별세일을 선택해주세요'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={TossColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>별세 시간</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowDeathTimePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !eventData.deathTime && styles.selectButtonTextEmpty
            ]}>
              {formatTime(eventData.deathTime) || '시간 선택'}
            </Text>
            <Ionicons name="time-outline" size={20} color={TossColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ageResultBox}>
        <Text style={styles.ageResultLabel}>
          {eventData.deathDate ? '향년' : '나이 미리보기'} · {eventData.ageCalculationMethod === 'full_age' ? '만 나이 기준' : '세는 나이 기준'}
        </Text>
        <Text style={[
          styles.ageResultValue,
          !getVisibleAge() && styles.ageResultValueEmpty,
        ]}>
          {getVisibleAge() ? `${getVisibleAge()}세` : '생년월일 선택 후 자동 계산'}
        </Text>
        {eventData.birthDate && (
          <Text style={styles.ageResultHint}>
            기준일: {getAgeBaseDateLabel()}{eventData.deathDate ? '' : ' (오늘 기준)'}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  const renderFamilyMembersForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.familyMembers = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>상주 정보</Text>
        <Text style={styles.sectionSubtitle}>관계를 먼저 선택한 뒤 상주 성함을 입력해주세요</Text>
      </View>
      
      {eventData.familyMembers.length === 0 && (
        <View style={styles.emptyFamilyBox}>
          <Ionicons name="people-outline" size={24} color={TossColors.textSecondary} />
          <Text style={styles.emptyFamilyTitle}>아직 상주 정보가 없어요</Text>
          <Text style={styles.emptyFamilyDescription}>관계 추가 버튼으로 장남, 장녀, 배우자 등 필요한 관계만 추가하세요.</Text>
        </View>
      )}

      {eventData.familyMembers.map((member, index) => (
        <View key={`${member.relation}-${index}`} style={styles.familyMemberCard}>
          <View style={styles.familyMemberHeader}>
            <TouchableOpacity
              style={styles.relationSelectButton}
              onPress={() => openRelationPicker(index)}
            >
              <Text style={styles.relationSelectText}>{member.relation || '관계 선택'}</Text>
              <Ionicons name="chevron-down" size={16} color={TossColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeFamilyButton}
              onPress={() => removeFamilyMember(index)}
            >
              <Ionicons name="close-circle" size={22} color={TossColors.textTertiary} />
            </TouchableOpacity>
          </View>
          <View style={styles.familyNamesInput}>
            <Text style={styles.inputLabel}>상주명</Text>
            <TextInput
              style={styles.textInput}
              placeholder="홍길동, 홍길순"
              value={member.names}
              onChangeText={(text) => updateFamilyMember(index, { names: text })}
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addFamilyButton}
        onPress={() => openRelationPicker(null)}
      >
        <Ionicons name="add-circle-outline" size={20} color={TossColors.primary} />
        <Text style={styles.addFamilyButtonText}>상주 관계 추가</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFuneralScheduleForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.funeralSchedule = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>장례 일정</Text>
        <Text style={styles.sectionSubtitle}>장례식 일정을 입력해주세요</Text>
      </View>
      
      <View style={styles.formRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>입관일</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCasketDatePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !eventData.casketDate && styles.selectButtonTextEmpty
            ]}>
              {formatDate(eventData.casketDate) || '입관일 선택'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={TossColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>입관 시간</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCasketTimePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !eventData.casketTime && styles.selectButtonTextEmpty
            ]}>
              {formatTime(eventData.casketTime) || '시간 선택'}
            </Text>
            <Ionicons name="time-outline" size={20} color={TossColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>발인일 *</Text>
          <TouchableOpacity
            style={[styles.selectButton, !eventData.burialDate && styles.selectButtonEmpty]}
            onPress={() => setShowBurialDatePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !eventData.burialDate && styles.selectButtonTextEmpty
            ]}>
              {formatDate(eventData.burialDate) || '발인일 선택'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={TossColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>발인 시간 *</Text>
          <TouchableOpacity
            style={[styles.selectButton, !eventData.burialTime && styles.selectButtonEmpty]}
            onPress={() => setShowBurialTimePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !eventData.burialTime && styles.selectButtonTextEmpty
            ]}>
              {formatTime(eventData.burialTime) || '시간 선택'}
            </Text>
            <Ionicons name="time-outline" size={20} color={TossColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>장지/화장장 *</Text>
        <TextInput
          style={[styles.textInput, !eventData.burialLocation && styles.textInputEmpty]}
          placeholder="예: 서울추모공원, ○○화장장"
          value={eventData.burialLocation}
          onChangeText={(text) => setEventData({ ...eventData, burialLocation: text })}
          placeholderTextColor={TossColors.textTertiary}
        />
        <Text style={styles.inputHint}>화장장, 공원묘지, 선산 등 발인 후 처음 이동하는 장소를 적어주세요.</Text>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>봉안당/2차 장지 (선택)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="예: ○○추모공원 봉안당, 선산"
          value={eventData.secondaryBurialLocation}
          onChangeText={(text) => setEventData({ ...eventData, secondaryBurialLocation: text })}
          placeholderTextColor={TossColors.textTertiary}
        />
        <Text style={styles.inputHint}>화장 후 봉안당, 수목장, 선산처럼 마지막 안치 장소가 따로 있으면 입력하세요.</Text>
      </View>
    </Animated.View>
  );

  const renderFuneralRiteForm = () => (
    <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>종교/장례 방식</Text>
        <Text style={styles.sectionSubtitle}>부고장에 표시할 장례 예식 방식을 선택해주세요</Text>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>종교 예식</Text>
        <View style={styles.chipGrid}>
          {RELIGIOUS_RITE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.choiceChip, eventData.religiousRite === option && styles.choiceChipSelected]}
              onPress={() => setEventData({ ...eventData, religiousRite: option })}
            >
              <Text style={[styles.choiceChipText, eventData.religiousRite === option && styles.choiceChipTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>장례 방식</Text>
        <View style={styles.chipGrid}>
          {FUNERAL_METHOD_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.choiceChip, eventData.funeralMethod === option && styles.choiceChipSelected]}
              onPress={() => setEventData({ ...eventData, funeralMethod: option })}
            >
              <Text style={[styles.choiceChipText, eventData.funeralMethod === option && styles.choiceChipTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  // 장례식장 정보 폼 (장례식장명, 주소, 빈소위치 통합)
  const renderFuneralLocationForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.funeralLocation = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>장례식장 정보</Text>
        <Text style={styles.sectionSubtitle}>장례식장 정보를 입력해주세요</Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>장례식장명 *</Text>
        <TextInput
          style={[styles.textInput, !eventData.funeralHome && styles.textInputEmpty]}
          placeholder="예: 서울아산병원 장례식장"
          value={eventData.funeralHome}
          onChangeText={(text) => setEventData({ ...eventData, funeralHome: text })}
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>장례식장 주소 *</Text>
        <TouchableOpacity
          style={[styles.addressButton, eventData.funeralAddress && styles.addressButtonSelected]}
          onPress={() => setShowFuneralAddressSearch(true)}
        >
          <View style={styles.addressButtonContent}>
            <Ionicons 
              name={eventData.funeralAddress ? "location" : "search"} 
              size={20} 
              color={eventData.funeralAddress ? TossColors.primary : TossColors.textSecondary} 
            />
            <Text style={[
              styles.addressButtonText,
              eventData.funeralAddress && styles.addressButtonTextSelected
            ]}>
              {eventData.funeralAddress || '장례식장 주소를 검색해주세요'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={TossColors.textTertiary} />
        </TouchableOpacity>
      </View>
      
      {eventData.funeralAddress && (
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>빈소 위치 *</Text>
          <TextInput
            style={[styles.textInput, !eventData.detailedAddress && styles.textInputEmpty]}
            placeholder="예: 지하 1층 3호실"
            value={eventData.detailedAddress}
            onChangeText={(text) => setEventData({ ...eventData, detailedAddress: text })}
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
      )}
    </Animated.View>
  );

  const renderFuneralContactForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.funeralContact = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>연락처</Text>
        <Text style={styles.sectionSubtitle}>조문객들이 연락할 수 있는 상주 연락처</Text>
      </View>
      
      <View style={styles.formRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>주 연락처 *</Text>
          <TextInput
            style={[styles.textInput, !eventData.primaryContact && styles.textInputEmpty]}
            placeholder="010-0000-0000"
            value={eventData.primaryContact}
            onChangeText={(text) => handleContactChange(text, 'primaryContact')}
            keyboardType="phone-pad"
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>보조 연락처</Text>
          <TextInput
            style={styles.textInput}
            placeholder="010-0000-0000"
            value={eventData.secondaryContact}
            onChangeText={(text) => handleContactChange(text, 'secondaryContact')}
            keyboardType="phone-pad"
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>장례지도사</Text>
        <TextInput
          style={styles.textInput}
          placeholder="장례지도사 성함"
          value={eventData.funeralDirector}
          onChangeText={(text) => setEventData({ ...eventData, funeralDirector: text })}
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>
    </Animated.View>
  );

  const renderFuneralGuideForm = () => (
    <Animated.View
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.funeralGuide = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>조문 안내</Text>
        <Text style={styles.sectionSubtitle}>조문 가능 여부와 주차/교통 안내를 선택 입력하세요</Text>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>조문 가능 안내</Text>
        <View style={styles.chipGrid}>
          {VISITATION_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[styles.choiceChip, eventData.visitationType === option.value && styles.choiceChipSelected]}
              onPress={() => setEventData({ ...eventData, visitationType: option.value })}
            >
              <Text style={[styles.choiceChipText, eventData.visitationType === option.value && styles.choiceChipTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>조문 안내 문구</Text>
        <View style={styles.messageTemplateGrid}>
          {VISITATION_NOTE_TEMPLATES.map((template, index) => (
            <TouchableOpacity
              key={template}
              style={[
                styles.messageTemplateButton,
                eventData.visitationNote === template && styles.messageTemplateButtonSelected,
              ]}
              onPress={() => setEventData({ ...eventData, visitationNote: template })}
            >
              <Text style={[
                styles.messageTemplateButtonText,
                eventData.visitationNote === template && styles.messageTemplateButtonTextSelected,
              ]}>
                안내 {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.textInput, styles.messageInput]}
          placeholder="예: 조문은 5월 12일 오후 2시 이후 가능합니다."
          value={eventData.visitationNote}
          onChangeText={(text) => setEventData({ ...eventData, visitationNote: text })}
          multiline
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>주차/교통 안내</Text>
        <TextInput
          style={[styles.textInput, styles.messageInput]}
          placeholder="예: 장례식장 지하 주차장 이용 가능, 2호선 ○○역 3번 출구 도보 5분"
          value={eventData.parkingTransportInfo}
          onChangeText={(text) => setEventData({ ...eventData, parkingTransportInfo: text })}
          multiline
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>
    </Animated.View>
  );

  const renderCondolenceAccountForm = () => (
    <Animated.View
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.condolenceAccounts = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>부의금 계좌</Text>
        <Text style={styles.sectionSubtitle}>필요한 경우에만 상주 계좌를 추가해주세요</Text>
      </View>

      {eventData.condolenceAccounts.map((account, index) => {
        const bank = findBank(account.bankName);
        return (
          <View key={`condolence-account-${index}`} style={styles.accountCard}>
            <View style={styles.familyMemberHeader}>
              <Text style={styles.accountCardTitle}>계좌 {index + 1}</Text>
              <TouchableOpacity
                style={styles.removeFamilyButton}
                onPress={() => setEventData({
                  ...eventData,
                  condolenceAccounts: eventData.condolenceAccounts.filter((_, i) => i !== index),
                })}
              >
                <Ionicons name="close-circle" size={22} color={TossColors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>예금주</Text>
              <TextInput
                style={styles.textInput}
                placeholder="홍길동"
                value={account.ownerName}
                onChangeText={(text) => updateCondolenceAccount(index, { ownerName: text })}
                placeholderTextColor={TossColors.textTertiary}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>은행</Text>
              <TouchableOpacity
                style={styles.bankSelectButton}
                onPress={() => {
                  if (!bankPicker.visible) {
                    setBankPicker({ visible: true, index });
                  }
                }}
              >
                <View style={styles.bankSelectContent}>
                  {bank && BANK_LOGOS[bank.code] ? (
                    <Image source={BANK_LOGOS[bank.code]} style={styles.bankBadgeLogo} resizeMode="contain" />
                  ) : (
                    <Ionicons name="business-outline" size={18} color={TossColors.textSecondary} />
                  )}
                  <Text style={[
                    styles.selectButtonText,
                    !account.bankName && styles.selectButtonTextEmpty
                  ]}>
                    {account.bankName || '은행 선택'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={TossColors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>계좌번호</Text>
              <TextInput
                style={styles.textInput}
                placeholder="계좌번호 입력"
                value={account.accountNumber}
                onChangeText={(text) => handleAccountNumberChange(index, text)}
                keyboardType="number-pad"
                placeholderTextColor={TossColors.textTertiary}
              />
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.addFamilyButton}
        onPress={() => setEventData({
          ...eventData,
          condolenceAccounts: [
            ...eventData.condolenceAccounts,
            { ownerName: '', bankName: '', accountNumber: '' },
          ],
        })}
      >
        <Ionicons name="add-circle-outline" size={20} color={TossColors.primary} />
        <Text style={styles.addFamilyButtonText}>부의금 계좌 추가</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // 부고용 조문메시지 설정 폼
  const renderMessageSettingsForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.messageSettings = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>조문 메시지</Text>
        <Text style={styles.sectionSubtitle}>조문객들이 메시지를 남길 수 있게 할지 설정해주세요</Text>
      </View>
      
      {/* 방명록 허용 여부 토글 */}
      <View style={styles.messageToggleContainer}>
        <TouchableOpacity
          style={styles.messageToggle}
          onPress={() => setEventData({ 
            ...eventData, 
            allowMessages: !eventData.allowMessages 
          })}
        >
          <View style={styles.messageToggleLeft}>
            <View style={styles.messageToggleIcon}>
              <Ionicons 
                name="chatbubble-outline" 
                size={20} 
                color={eventData.allowMessages ? TossColors.primary : TossColors.textSecondary} 
              />
            </View>
            <View style={styles.messageToggleTextContainer}>
              <Text style={[
                styles.messageToggleTitle,
                eventData.allowMessages && styles.messageToggleTitleActive
              ]}>
                조문 메시지 허용
              </Text>
              <Text style={styles.messageToggleDescription}>
                조문객들이 온라인으로 조문 메시지를 남길 수 있어요
              </Text>
            </View>
          </View>
          <View style={[
            styles.toggleSwitch,
            eventData.allowMessages && styles.toggleSwitchActive
          ]}>
            <View style={[
              styles.toggleSwitchKnob,
              eventData.allowMessages && styles.toggleSwitchKnobActive
            ]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 방명록이 활성화된 경우 안내 */}
      {eventData.allowMessages && (
        <View style={styles.messageSettingsDetails}>
          <View style={styles.messageSettingCard}>
            <View style={styles.messageSettingHeader}>
              <Ionicons name="shield-checkmark" size={20} color={TossColors.success} />
              <Text style={styles.messageSettingTitle}>회원 인증 필요</Text>
            </View>
            <Text style={styles.messageSettingDescription}>
              조문 메시지 작성 시 회원가입이 필요합니다.{'\n'}
              정중한 메시지 환경을 위해 본인 인증을 진행해요.
            </Text>
          </View>
        </View>
      )}

      {/* 방명록이 비활성화된 경우 안내 */}
      {!eventData.allowMessages && (
        <View style={styles.messageDisabledContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={TossColors.textTertiary} />
          <Text style={styles.messageDisabledText}>
            조문 메시지 기능을 사용하지 않습니다
          </Text>
          <Text style={styles.messageDisabledSubtext}>
            언제든지 위의 토글로 기능을 활성화할 수 있어요
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderMessageForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.message = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>상주의 말</Text>
        <Text style={styles.sectionSubtitle}>문구를 선택하거나 직접 수정해보세요</Text>
      </View>

      <View style={styles.messageTemplateGrid}>
        {FUNERAL_MESSAGE_TEMPLATES.map((template, index) => (
          <TouchableOpacity
            key={template}
            style={[
              styles.messageTemplateButton,
              eventData.customMessage === template && styles.messageTemplateButtonSelected,
            ]}
            onPress={() => setEventData({ ...eventData, customMessage: template })}
          >
            <Text style={[
              styles.messageTemplateButtonText,
              eventData.customMessage === template && styles.messageTemplateButtonTextSelected,
            ]}>
              문구 {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.textInput, styles.messageInput]}
          placeholder="고인을 위해 찾아주시는 모든 분들께 깊이 감사드립니다."
          value={eventData.customMessage}
          onChangeText={(text) => setEventData({ ...eventData, customMessage: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>
    </Animated.View>
  );

  // 카테고리별 사진 업로드 폼
  const renderPhotoUploadForm = () => {
    return (
      <Animated.View 
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        onLayout={(event) => {
          sectionPositions.current.photos = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>사진 업로드</Text>
          <Text style={styles.sectionSubtitle}>고인의 사진을 업로드해주세요 (자동으로 클라우드에 저장됩니다)</Text>
        </View>

        <View style={styles.photoCategoriesContainer}>
          {Object.values(FUNERAL_PHOTO_CATEGORIES).map((category) => {
            const currentCount = getCategoryImageCount(category.key);
            const categoryImages = getCategoryImages(category.key);
            const isComplete = currentCount >= category.maxCount;
            const isRequired = category.required && currentCount === 0;

            return (
              <View key={category.key} style={styles.photoCategorySection}>
                <View style={styles.photoCategoryHeader}>
                  <View style={styles.photoCategoryInfo}>
                    <View style={[
                      styles.photoCategoryIcon,
                      isComplete && styles.photoCategoryIconComplete,
                    ]}>
                      <Ionicons
                        name={isComplete ? 'person-circle' : 'person-circle-outline'}
                        size={24}
                        color={isComplete ? TossColors.textSecondary : TossColors.primary}
                      />
                    </View>
                    <View style={styles.photoCategoryTextContainer}>
                      <Text style={styles.photoCategoryTitle}>
                        {category.label}
                        {category.required && <Text style={styles.requiredAsterisk}> *</Text>}
                      </Text>
                      <Text style={styles.photoCategoryDescription}>{category.description}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.photoCategoryCount,
                    isComplete && styles.photoCategoryCountComplete,
                    isRequired && styles.photoCategoryCountRequired,
                  ]}>
                    <Text style={[
                      styles.photoCategoryCountText,
                      isComplete && styles.photoCategoryCountTextComplete,
                      isRequired && styles.photoCategoryCountTextRequired,
                    ]}>
                      {currentCount}/{category.maxCount}
                    </Text>
                  </View>
                </View>

                {/* 업로드 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.categoryUploadButton,
                    isComplete && styles.categoryUploadButtonDisabled,
                    isRequired && styles.categoryUploadButtonRequired,
                    imageUploadState.isUploading && styles.categoryUploadButtonUploading
                  ]}
                  onPress={() => {
                    console.log('🔍 [DEBUG] 업로드 버튼 클릭:', category.key);
                    pickImagesForCategory(category);
                  }}
                  disabled={isComplete || imageUploadState.isUploading}
                >
                  <Ionicons 
                    name={isComplete ? "checkmark-circle" : 
                         imageUploadState.isUploading ? "cloud-upload" : "camera"} 
                    size={20} 
                    color={isComplete ? TossColors.textSecondary : 
                           imageUploadState.isUploading ? TossColors.primary :
                           TossColors.primary} 
                  />
                  <Text style={[
                    styles.categoryUploadButtonText,
                    isComplete && styles.categoryUploadButtonTextDisabled,
                    isRequired && styles.categoryUploadButtonTextRequired,
                    imageUploadState.isUploading && styles.categoryUploadButtonTextUploading
                  ]}>
                    {imageUploadState.isUploading ? '업로드 중...' :
                     isComplete ? '업로드 완료' : 
                     currentCount === 0 ? `${category.label} 추가` : 
                     `${category.label} 추가 (${category.maxCount - currentCount}장 더)`}
                  </Text>
                </TouchableOpacity>

                {/* 업로드된 이미지들 */}
                {categoryImages.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryImagesScroll}
                  >
                    {categoryImages.map((image) => (
                      <View key={image.id} style={styles.categoryImageItem}>
                        <Image source={{ uri: image.publicUrl || image.uri }} style={styles.categoryImage} />
                        
                        {/* 업로드 상태 표시 */}
                        <View style={styles.categoryImageStatus}>
                          <Ionicons 
                            name={image.publicUrl || image.localOnly ? "checkmark-circle" : "cloud-upload-outline"} 
                            size={12} 
                            color={image.publicUrl || image.localOnly ? TossColors.textSecondary : TossColors.warning} 
                          />
                        </View>
                        
                        <TouchableOpacity
                          style={styles.categoryImageRemove}
                          onPress={() => {
                            console.log('🔍 [DEBUG] 이미지 제거 버튼 클릭:', image.id, image.category);
                            removeImage(image.id);
                          }}
                          disabled={imageUploadState.isUploading}
                        >
                          <Ionicons name="close-circle" size={20} color={TossColors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })}
        </View>

        {/* 전체 업로드 현황 요약 */}
        <View style={styles.photoSummaryContainer}>
          <Text style={styles.photoSummaryTitle}>업로드 현황</Text>
          <View style={styles.photoSummaryStats}>
            <Text style={styles.photoSummaryText}>
              총 {eventData.images.length}장 선택됨
            </Text>
            <Text style={styles.photoSummaryDetail}>
              클라우드 저장: {eventData.images.filter(img => img.publicUrl).length}장 / 
              대기 중: {eventData.images.filter(img => !img.publicUrl).length}장
            </Text>
            <Text style={styles.photoSummaryDetail}>
              고인 사진 {getCategoryImageCount('main')}/1
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderPhotoFrameSelector = () => {
    const hasMainPhoto = getCategoryImageCount('main') > 0;
    const selectedFrame = getSelectedPhotoFrame();

    if (!hasMainPhoto) {
      return null;
    }

    return (
      <Animated.View
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>고인 사진 액자 선택</Text>
          <Text style={styles.sectionSubtitle}>액자 스타일에 맞춰 고인 사진을 정렬해 주세요.</Text>
        </View>

        <TouchableOpacity
          style={styles.photoFrameSelectButton}
          onPress={() => setPhotoFramePicker(true)}
          activeOpacity={0.86}
        >
          <View style={styles.photoFrameSelectButtonInner}>
            {selectedFrame?.source ? (
              <Image source={selectedFrame.source} style={styles.photoFrameSelectThumb} resizeMode="contain" />
            ) : null}
            <Text style={styles.photoFrameSelectButtonText}>
              {selectedFrame?.name || '액자 선택'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={TossColors.textSecondary} />
        </TouchableOpacity>
        <View style={{ marginTop: 6 }}>
          <Text style={styles.photoFrameSelectedInfo}>
            현재 선택: {selectedFrame?.name || '없음'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderTemplatePreviewVisualCard = (previewType) => {
    switch (previewType) {
      case 'card-editorial-timeline':
        return (
          <View style={styles.previewCardVisualTimeline}>
            <View style={styles.previewTimelineSoftBlockA} />
            <View style={styles.previewTimelineSoftBlockB} />
            <View style={styles.previewTimelineCoverContent}>
              <View style={styles.previewTimelineVisualPanel}>
                <View style={styles.previewTimelineVisualRail} />
                {[0, 1, 2].map((index) => (
                  <View key={index} style={styles.previewTimelineVisualRow}>
                    <View style={[styles.previewTimelineVisualDot, index === 1 && styles.previewTimelineVisualDotActive]} />
                    <View style={styles.previewTimelineVisualLines}>
                      <View style={[styles.previewTimelineVisualLine, index === 1 && styles.previewTimelineVisualLineActive]} />
                      <View style={styles.previewTimelineVisualSubLine} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      case 'card-paper-letter':
        return (
          <View style={styles.previewCardVisualPaper}>
            <Text style={styles.previewPaperRibbon}>故人을 추모합니다</Text>
            <View style={styles.previewPaperCard}>
              <Text style={styles.previewPaperTitle}>부고</Text>
              <Text style={styles.previewPaperName}>故 홍길동</Text>
              <Text style={styles.previewPaperSub}>향년 70세</Text>
              <View style={styles.previewPaperLine} />
              <Text style={styles.previewPaperLineText}>상주: 배우자 ○○○</Text>
              <Text style={styles.previewPaperLineText}>빈소: ○○장례식장</Text>
              <Text style={styles.previewPaperLineText}>연락처: 010-0000-0000</Text>
            </View>
          </View>
        );
      case 'card-certificate':
        return (
          <View style={styles.previewCardVisualCertificate}>
            <View style={styles.previewCertificateHeader}>
              <Text style={styles.previewCertificateTitle}>부 고</Text>
              <View style={styles.previewCertificateTitleLine} />
            </View>
            <View style={styles.previewCertificatePhoto} />
            <Text style={styles.previewCertificateName}>故 홍길동</Text>
            <Text style={styles.previewCertificateSub}>향년 70세 · 2037.05.19 별세</Text>
            <View style={styles.previewCertificateSection}>
              <Text style={styles.previewCertificateSectionTitle}>상주의 말</Text>
              <View style={styles.previewCertificateLineWide} />
              <View style={styles.previewCertificateLineShort} />
            </View>
            <View style={styles.previewCertificateSection}>
              <Text style={styles.previewCertificateSectionTitle}>상 주</Text>
              <View style={styles.previewCertificateFamilyRow}>
                <View style={styles.previewCertificatePill} />
                <View style={styles.previewCertificateLineWide} />
              </View>
              <View style={styles.previewCertificateFamilyRow}>
                <View style={styles.previewCertificatePill} />
                <View style={styles.previewCertificateLineShort} />
              </View>
            </View>
          </View>
        );
      case 'card-modern-soft':
      default:
        return (
          <View style={styles.previewCardVisualModern}>
            <Image pointerEvents="none" source={MODERN_TEMPLATE_PREVIEW_ASSETS.flowerCorner} style={styles.previewModernFlowerCorner} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_TEMPLATE_PREVIEW_ASSETS.oliveBranch} style={styles.previewModernOlive} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_TEMPLATE_PREVIEW_ASSETS.petals} style={styles.previewModernPetals} resizeMode="contain" />
            <View style={styles.previewModernCoverContent}>
              <View style={styles.previewModernVisualCard}>
                <Image pointerEvents="none" source={MODERN_TEMPLATE_PREVIEW_ASSETS.divider} style={styles.previewModernCoverDivider} resizeMode="contain" />
                <View style={styles.previewModernVisualFrame} />
                <View style={styles.previewModernVisualLineWide} />
                <View style={styles.previewModernVisualLineShort} />
              </View>
              <Image pointerEvents="none" source={MODERN_TEMPLATE_PREVIEW_ASSETS.divider} style={styles.previewModernCoverDivider} resizeMode="contain" />
            </View>
          </View>
        );
    }
  };

  const renderTemplatePreviewThumbnail = (template) => {
    if (!template.preview) {
      return (
        <View style={[styles.templateImage, getTemplatePreviewStyle(template.previewType)]}>
          {renderTemplatePreviewVisualCard(template.previewType)}
        </View>
      );
    }

    return (
      <Image
        source={template.preview}
        style={styles.templateImage}
        resizeMode="cover"
      />
    );
  };

  const buildFuneralPreviewEventData = () => {
    const selectedFrame = FUNERAL_PHOTO_FRAMES.find((frame) => frame.id === eventData.selectedPhotoFrameId);
    const mainPhotoLayout = normalizeMainImageLayout(
      latestMainImageLayoutRef.current ||
      mainPhotoLayoutView ||
      eventData.mainPhotoLayout ||
      MAIN_IMAGE_LAYOUT_DEFAULT
    );
    const memorialNameLayout = normalizeMemorialTextLayout(
      latestMemorialNameLayoutRef.current ||
      memorialNameLayoutView ||
      eventData.memorialNameLayout ||
      MEMORIAL_NAME_LAYOUT_DEFAULT
    );
    const memorialDateLayout = normalizeMemorialTextLayout(
      latestMemorialDateLayoutRef.current ||
      memorialDateLayoutView ||
      eventData.memorialDateLayout ||
      MEMORIAL_DATE_LAYOUT_DEFAULT
    );

    return {
      ...eventData,
      mainPhotoLayout,
      main_photo_layout: mainPhotoLayout,
      memorialNameFontId: eventData.memorialNameFontId || MEMORIAL_TEXT_FONT_OPTIONS[0].id,
      memorialDateFontId: eventData.memorialDateFontId || MEMORIAL_TEXT_FONT_OPTIONS[0].id,
      memorialNameColor: eventData.memorialNameColor || MEMORIAL_NAME_DEFAULT_COLOR,
      memorialDateColor: eventData.memorialDateColor || MEMORIAL_DATE_DEFAULT_COLOR,
      memorialNameLayout,
      memorialDateLayout,
      additional_info: {
        ...(eventData.additional_info || {}),
        ...(eventData.additionalInfo || {}),
        photo_frame: {
          id: eventData.selectedPhotoFrameId,
          key: selectedFrame?.key || null,
        },
        main_photo_layout: mainPhotoLayout,
        memorial_name_layout: memorialNameLayout,
        memorial_date_layout: memorialDateLayout,
        memorial_name_font_id: eventData.memorialNameFontId || MEMORIAL_TEXT_FONT_OPTIONS[0].id,
        memorial_date_font_id: eventData.memorialDateFontId || MEMORIAL_TEXT_FONT_OPTIONS[0].id,
        memorial_name_color: eventData.memorialNameColor || MEMORIAL_NAME_DEFAULT_COLOR,
        memorial_date_color: eventData.memorialDateColor || MEMORIAL_DATE_DEFAULT_COLOR,
        memorial_name_visible: eventData.memorialNameVisible !== false,
        memorial_date_visible: eventData.memorialDateVisible !== false,
      },
    };
  };

  const renderTemplateSelection = () => (
    <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>템플릿 선택</Text>
        <Text style={styles.sectionSubtitle}>마음에 드는 디자인을 선택해주세요</Text>
      </View>

      <View style={styles.templateGrid}>
        {templates.funeral?.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              eventData.selectedTemplate?.id === template.id && styles.templateCardSelected,
            ]}
            onPress={() => handleTemplateSelect(template)}
          >
            <View style={styles.templateInfo}>
              <View style={styles.templateTitleRow}>
                <Text style={styles.templateName}>{template.name}</Text>
                {eventData.selectedTemplate?.id === template.id && (
                  <Ionicons name="checkmark-circle" size={22} color={TossColors.primary} />
                )}
              </View>
              <Text style={styles.templateDescription}>{template.description}</Text>
              
              {template.features && (
                <View style={styles.templateFeatures}>
                  {template.features.map((feature, index) => (
                    <View key={index} style={styles.templateFeature}>
                      <Text style={styles.templateFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.templatePreviewButton}
              onPress={() => handleTemplatePreview(template)}
            >
              <Text style={styles.templatePreviewButtonText}>미리보기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderPhotoFrameComposer = () => {
    const selectedPhoto = getCategoryImages('main')[0];
    const selectedPhotoUri = selectedPhoto?.publicUrl || selectedPhoto?.uri;
    const selectedFrame = getSelectedPhotoFrame();
    const layout = getMainImageLayout();
    const frameAspectRatio = getPhotoFrameAspectRatio(selectedFrame);

    if (!selectedPhotoUri) {
      return (
        <View style={[styles.section, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>고인 사진을 업로드해 주세요</Text>
          <Text style={styles.sectionSubtitle}>사진을 업로드하면 바로 액자에 맞춰 위치를 조절할 수 있어요.</Text>
        </View>
      );
    }

    return (
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>고인 사진 정렬</Text>
          <Text style={styles.sectionSubtitle}>선택한 액자에 맞춰 사진 위치와 크기를 조절해 주세요.</Text>
        </View>

        <View style={styles.templateComposerCanvas}>
          <View
            style={[styles.templateComposerPhotoFrame, { aspectRatio: frameAspectRatio }]}
            onLayout={(event) => {
              const nextWidth = event.nativeEvent.layout.width;
              if (nextWidth > 0 && Math.abs((composerFrameWidth || 0) - nextWidth) > 1) {
                setComposerFrameWidth(nextWidth);
              }
            }}
          >
            {renderComposedPhotoFrame({ insideExistingFrame: true })}
            {renderComposerActionFab()}
            {renderPhotoAdjustmentOverlay()}
            {renderTextAdjustmentOverlay()}
          </View>
        </View>
      </Animated.View>
    );
  };

  const getTemplatePreviewStyle = (previewType) => {
    switch (previewType) {
      case 'card-editorial-timeline':
        return {
          backgroundColor: '#F4F7FF',
          borderColor: '#D9E3FF',
          borderWidth: 1,
        };
      case 'card-paper-letter':
        return {
          backgroundColor: '#FAF7F1',
          borderColor: '#E7DFD1',
          borderWidth: 1,
        };
      case 'card-modern-soft':
      default:
        return {
          backgroundColor: '#F8FAFF',
          borderColor: '#E4EEFF',
          borderWidth: 1,
        };
    }
  };

  

  const renderTemplateComposer = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {renderTemplateSelection()}
    </ScrollView>
  );

  const renderStep1 = () => (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {renderDeceasedInfoForm()}
      {renderFamilyMembersForm()}
      {renderFuneralLocationForm()}
      {renderFuneralContactForm()}
      {renderFuneralGuideForm()}
      {renderFuneralScheduleForm()}
      {renderFuneralRiteForm()}
      {renderCondolenceAccountForm()}
      {renderMessageSettingsForm()}
      {renderMessageForm()}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!photoAdjustMode && !textAdjustMode}
    >
      {renderPhotoUploadForm()}
      {getCategoryImageCount('main') > 0 && (
        <>
          <View style={{ marginVertical: 12 }}>
            {renderPhotoFrameSelector()}
          </View>
          <View style={{ marginTop: 8 }}>
            {renderPhotoFrameComposer()}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderStep3 = () => renderTemplateComposer();

  const renderCompletion = () => (
    <View style={styles.completionContainer}>
      <View style={styles.completionContent}>
        <View style={styles.completionIconContainer}>
          <Text style={styles.completionEmoji}>🕯️</Text>
        </View>
        <Text style={styles.completionTitle}>{isEditMode ? '모바일 부고장이\n수정되었어요' : '모바일 부고장이\n완성되었어요'}</Text>
        <Text style={styles.completionSubtitle}>잠시 후 부고장 화면으로 이동할게요</Text>
        <TouchableOpacity
          style={styles.completionPrimaryButton}
          onPress={goToCreatedNotice}
          activeOpacity={0.88}
        >
          <Text style={styles.completionPrimaryButtonText}>부고장 바로 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.completionHomeButton}
          onPress={goToHome}
          activeOpacity={0.88}
        >
          <Ionicons name="home-outline" size={17} color={TossColors.primary} />
          <Text style={styles.completionHomeButtonText}>메인 화면으로 가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 프로그레스 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(currentStep / FUNERAL_STEP_COUNT) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep}/{FUNERAL_STEP_COUNT}
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isCreationComplete ? renderCompletion() : (
          <>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </>
        )}

        {/* 하단 버튼 */}
        {!isCreationComplete && currentStep <= 3 && (
          <>
          {currentStep === 1 && (
            <Animated.View
              style={[
                styles.testFillWrap,
                {
                  transform: [{
                    translateY: testButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.testFillButton}
                onPress={fillTestFuneralData}
                activeOpacity={0.86}
              >
                <Ionicons name="flash" size={14} color={TossColors.primary} />
                <Text style={styles.testFillText}>테스트 입력</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
            <View style={styles.bottomButtonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handlePreviousStep}
              >
                <Text style={styles.backButtonText}>이전</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.nextButton,
                getStepButtonDisabled() && styles.nextButtonDisabled,
                currentStep === 1 && { flex: 1 }
              ]}
              onPress={handleNext}
              disabled={getStepButtonDisabled()}
            >
              <Text style={styles.nextButtonText}>
                {getStepButtonText()}
              </Text>
            </TouchableOpacity>
          </View>
          </>
        )}

        {/* 이미지 업로드 진행 모달 */}
        <ImageUploadModal
          visible={imageUploadState.isUploading}
          currentIndex={imageUploadState.currentIndex}
          totalCount={imageUploadState.totalCount}
          onCancel={handleUploadCancel}
        />

        {/* 토스 스타일 모달들 */}
        <TossModal
          visible={modalState.visible}
          title={modalState.title}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
        />

        <TossDatePicker
          visible={showBirthDatePicker}
          selectedDate={eventData.birthDate}
          onSelect={(date) => updateEventData({ birthDate: date })}
          onClose={() => setShowBirthDatePicker(false)}
          allowPastDates={true}
        />

        <TossDatePicker
          visible={showDeathDatePicker}
          selectedDate={eventData.deathDate}
          onSelect={(date) => updateEventData({ deathDate: date })}
          onClose={() => setShowDeathDatePicker(false)}
          allowPastDates={true}
        />

        <TossTimePicker
          visible={showDeathTimePicker}
          selectedTime={eventData.deathTime}
          onSelect={(time) => setEventData({ ...eventData, deathTime: time })}
          onClose={() => setShowDeathTimePicker(false)}
        />

        <TossDatePicker
          visible={showCasketDatePicker}
          selectedDate={eventData.casketDate}
          onSelect={(date) => setEventData({ ...eventData, casketDate: date })}
          onClose={() => setShowCasketDatePicker(false)}
          allowPastDates={true}
        />

        <TossTimePicker
          visible={showCasketTimePicker}
          selectedTime={eventData.casketTime}
          onSelect={(time) => setEventData({ ...eventData, casketTime: time })}
          onClose={() => setShowCasketTimePicker(false)}
        />

        <TossDatePicker
          visible={showBurialDatePicker}
          selectedDate={eventData.burialDate}
          onSelect={(date) => setEventData({ ...eventData, burialDate: date })}
          onClose={() => setShowBurialDatePicker(false)}
          allowPastDates={true}
        />

        <TossTimePicker
          visible={showBurialTimePicker}
          selectedTime={eventData.burialTime}
          onSelect={(time) => setEventData({ ...eventData, burialTime: time })}
          onClose={() => setShowBurialTimePicker(false)}
        />

        <RelationPickerSheet
          visible={relationPicker.visible}
          onSelect={handleRelationSelect}
          onClose={() => setRelationPicker({ visible: false, index: null })}
        />

        <PhotoFramePickerSheet
          visible={photoFramePicker}
          frames={FUNERAL_PHOTO_FRAMES}
          selectedFrameId={getSelectedPhotoFrame()?.id}
          onSelect={handlePhotoFrameSelect}
          onClose={() => setPhotoFramePicker(false)}
        />

        <BankPickerSheet
          visible={bankPicker.visible}
          onSelect={handleBankSelect}
          onClose={() => setBankPicker({ visible: false, index: null })}
        />

        <MemorialFontPickerSheet
          visible={fontPickerVisible}
          target={fontPickerTarget}
          nameFontId={eventData.memorialNameFontId}
          dateFontId={eventData.memorialDateFontId}
          nameColor={eventData.memorialNameColor || MEMORIAL_NAME_DEFAULT_COLOR}
          dateColor={eventData.memorialDateColor || MEMORIAL_DATE_DEFAULT_COLOR}
          nameVisible={eventData.memorialNameVisible !== false}
          dateVisible={eventData.memorialDateVisible !== false}
          onTargetChange={setFontPickerTarget}
          onSelect={updateMemorialFont}
          onColorSelect={updateMemorialTextColor}
          onVisibleChange={updateMemorialTextVisible}
          onClose={() => setFontPickerVisible(false)}
        />

        <DaumPostcode
          visible={showFuneralAddressSearch}
          onComplete={handleFuneralAddressComplete}
          onClose={() => setShowFuneralAddressSearch(false)}
        />

        {/* 템플릿 미리보기 모달 */}
        <Modal
          visible={showTemplatePreview}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.previewModalContainer}>
            <TouchableOpacity 
              style={styles.previewModalClose}
              onPress={() => setShowTemplatePreview(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.previewModalSelect}
              onPress={() => handleTemplateSelect(previewTemplate)}
            >
              <Text style={styles.previewModalSelectText}>이 템플릿 선택</Text>
            </TouchableOpacity>
            
            {previewTemplate && (
              <FuneralTemplatePreview
                template={previewTemplate}
                eventData={buildFuneralPreviewEventData()}
                userImages={eventData.images}
                categorizedImages={getCategorizedImages()}
                allowMessages={eventData.allowMessages}
                messageSettings={eventData.messageSettings}
                isPreviewMode={true}
              />
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 🔥 기존 CreateEventScreen.js와 동일한 스타일 사용
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TossColors.background,
  },
  
  // 프로그레스 바
  progressContainer: {
    backgroundColor: TossColors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: TossColors.border,
    borderRadius: 2,
    marginRight: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: TossColors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: TossColors.secondary,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  
  // 섹션
  section: {
    backgroundColor: TossColors.background,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: TossColors.textSecondary,
    lineHeight: 20,
  },
  
  // 폼 요소
  formRow: {
    gap: 0,
  },
  inputWrapper: {
    flex: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: TossColors.textTertiary,
    marginTop: 6,
    lineHeight: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: TossColors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: TossColors.background,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  segmentButtonTextSelected: {
    color: TossColors.primary,
  },
  ageResultBox: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  ageResultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.textSecondary,
    marginBottom: 4,
  },
  ageResultValue: {
    fontSize: 18,
    fontWeight: '800',
    color: TossColors.primary,
  },
  ageResultValueEmpty: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.textTertiary,
  },
  ageResultHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: TossColors.textSecondary,
  },
  inputHintSpaced: {
    fontSize: 12,
    color: TossColors.textTertiary,
    marginTop: 8,
    marginBottom: 22,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: TossColors.text,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  textInputEmpty: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  messageInput: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  
  // 성별 선택 스타일
  genderSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderButtonSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  genderButtonText: {
    fontSize: 16,
    color: TossColors.textSecondary,
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: TossColors.primary,
    fontWeight: '600',
  },
  
  emptyFamilyBox: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.secondary,
    marginBottom: 16,
  },
  emptyFamilyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: TossColors.text,
  },
  emptyFamilyDescription: {
    marginTop: 4,
    fontSize: 13,
    color: TossColors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  familyMemberCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TossColors.border,
    marginBottom: 12,
  },
  familyMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  relationSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TossColors.secondary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  relationSelectText: {
    fontSize: 14,
    fontWeight: '700',
    color: TossColors.primary,
    marginRight: 4,
  },
  familyNamesInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeFamilyButton: {
    padding: 4,
  },
  
  // 가족 추가 버튼
  addFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TossColors.primary,
    borderStyle: 'dashed',
  },
  addFamilyButtonText: {
    fontSize: 14,
    color: TossColors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  messageTemplateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  messageTemplateButton: {
    minWidth: '30%',
    flexGrow: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  messageTemplateButtonSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  messageTemplateButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.textSecondary,
  },
  messageTemplateButtonTextSelected: {
    color: TossColors.primary,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
  },
  choiceChipSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  choiceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  choiceChipTextSelected: {
    color: TossColors.primary,
  },
  accountCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TossColors.border,
    marginBottom: 12,
  },
  accountCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TossColors.text,
  },
  bankSelectButton: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankSelectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankBadgeLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  sheetDim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: TossColors.overlay,
  },
  sheetDimTouch: {
    flex: 1,
  },
  bottomSheet: {
    maxHeight: '78%',
    backgroundColor: TossColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: TossColors.border,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TossColors.text,
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: TossColors.textSecondary,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TossColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  relationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  relationGridItem: {
    width: '48.5%',
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
    padding: 14,
    marginBottom: 10,
  },
  relationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  relationCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: TossColors.text,
    marginRight: 8,
  },
  relationGroupBadge: {
    minWidth: 34,
    height: 22,
    borderRadius: 11,
    backgroundColor: TossColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  relationGroupText: {
    fontSize: 10,
    fontWeight: '800',
    color: TossColors.primary,
  },
  relationGridDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: TossColors.textSecondary,
    textAlign: 'left',
  },
  bankSearchWrap: {
    height: 46,
    borderRadius: 12,
    backgroundColor: TossColors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  bankSearchInput: {
    flex: 1,
    fontSize: 15,
    color: TossColors.text,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 12,
  },
  bankItem: {
    width: '33.333%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  bankIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: TossColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  bankLogoImg: {
    width: 28,
    height: 28,
  },
  bankIconText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bankName: {
    fontSize: 12,
    color: TossColors.text,
    textAlign: 'center',
  },
  fontTargetSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: TossColors.secondary,
    marginBottom: 14,
  },
  fontTargetButton: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontTargetButtonSelected: {
    backgroundColor: TossColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  fontTargetText: {
    fontSize: 14,
    fontWeight: '800',
    color: TossColors.textSecondary,
  },
  fontTargetTextSelected: {
    color: TossColors.text,
  },
  fontOptionList: {
    gap: 10,
    paddingBottom: 8,
  },
  fontSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TossColors.text,
    marginTop: 4,
    marginBottom: 2,
  },
  fontSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fontContrastBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: '#191F28',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  textVisibilityCard: {
    minHeight: 72,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textVisibilityInfo: {
    flex: 1,
  },
  textVisibilityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TossColors.text,
    marginBottom: 4,
  },
  textVisibilityDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: TossColors.textSecondary,
  },
  textVisibilitySwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
    backgroundColor: TossColors.border,
  },
  textVisibilitySwitchActive: {
    backgroundColor: TossColors.primary,
  },
  textVisibilityKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TossColors.background,
  },
  textVisibilityKnobActive: {
    marginLeft: 20,
  },
  fontColorSection: {
    gap: 10,
    marginBottom: 4,
  },
  fontColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fontColorChip: {
    minWidth: '30%',
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
  },
  fontColorChipSelected: {
    borderColor: TossColors.primary,
    backgroundColor: '#F7FAFF',
  },
  fontColorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(25,31,40,0.12)',
  },
  fontColorSwatchWhite: {
    borderWidth: 1.5,
    borderColor: '#8B95A1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  fontColorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.textSecondary,
  },
  fontColorLabelSelected: {
    color: TossColors.primary,
  },
  fontOptionCard: {
    minHeight: 86,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fontOptionCardSelected: {
    borderColor: TossColors.primary,
    backgroundColor: '#F7FAFF',
  },
  fontOptionContent: {
    flex: 1,
  },
  fontPreviewBox: {
    alignSelf: 'flex-start',
    minWidth: 126,
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  fontPreviewBoxDark: {
    backgroundColor: '#191F28',
  },
  fontOptionPreview: {
    fontSize: 20,
    lineHeight: 26,
    color: TossColors.text,
  },
  fontOptionName: {
    fontSize: 14,
    fontWeight: '800',
    color: TossColors.text,
    marginBottom: 3,
  },
  fontOptionDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: TossColors.textSecondary,
  },
  
  // 방명록 설정 스타일 (공통)
  messageToggleContainer: {
    marginBottom: 24,
  },
  messageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TossColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  messageToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageToggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TossColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  messageToggleTextContainer: {
    flex: 1,
  },
  messageToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 4,
  },
  messageToggleTitleActive: {
    color: TossColors.primary,
  },
  messageToggleDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: TossColors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: TossColors.primary,
  },
  toggleSwitchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TossColors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleSwitchKnobActive: {
    marginLeft: 20,
  },
  
  messageSettingsDetails: {
    gap: 20,
  },
  messageSettingCard: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  messageSettingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSettingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TossColors.text,
    marginLeft: 8,
  },
  messageSettingDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
    lineHeight: 18,
  },
  
  messagePreviewContainer: {
    marginTop: 8,
  },
  messagePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 12,
  },
  messagePreviewBox: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  messagePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messagePreviewHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
    marginLeft: 8,
  },
  messagePreviewPlaceholder: {
    fontSize: 14,
    color: TossColors.textTertiary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  messagePreviewButton: {
    backgroundColor: TossColors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  messagePreviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.background,
  },
  
  messageDisabledContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  messageDisabledText: {
    fontSize: 16,
    color: TossColors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  messageDisabledSubtext: {
    fontSize: 13,
    color: TossColors.textTertiary,
    textAlign: 'center',
  },
  
  // 선택 버튼
  selectButton: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonEmpty: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  selectButtonText: {
    fontSize: 16,
    color: TossColors.text,
    flex: 1,
  },
  selectButtonTextEmpty: {
    color: TossColors.textTertiary,
  },
  
  // 주소 선택 버튼
  addressButton: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressButtonSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  addressButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressButtonText: {
    fontSize: 16,
    color: TossColors.textTertiary,
    marginLeft: 12,
    flex: 1,
  },
  addressButtonTextSelected: {
    color: TossColors.text,
  },
  
  // 카테고리별 사진 업로드 스타일
  photoCategoriesContainer: {
    gap: 14,
  },
  photoCategorySection: {
    backgroundColor: TossColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9EEF5',
  },
  photoCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  photoCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 12,
  },
  photoCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#F3F7FF',
    borderWidth: 1,
    borderColor: '#DDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCategoryIconComplete: {
    backgroundColor: '#F6F7F9',
    borderColor: '#E5E8EC',
  },
  photoCategoryTextContainer: {
    flex: 1,
  },
  photoCategoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 4,
  },
  requiredAsterisk: {
    color: TossColors.primary,
  },
  photoCategoryDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
    lineHeight: 18,
  },
  photoCategoryCount: {
    minWidth: 48,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: '#E6ECF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCategoryCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: TossColors.textSecondary,
  },
  photoCategoryCountComplete: {
    backgroundColor: '#F1F4F7',
    borderColor: '#E1E6EC',
  },
  photoCategoryCountRequired: {
    backgroundColor: '#F3F7FF',
    borderColor: '#DDE8FF',
  },
  photoCategoryCountTextComplete: {
    color: TossColors.textSecondary,
  },
  photoCategoryCountTextRequired: {
    color: TossColors.primary,
  },
  categoryUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFF',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#D9E6FF',
    marginBottom: 12,
  },
  categoryUploadButtonRequired: {
    borderColor: '#D9E6FF',
    backgroundColor: '#F7FAFF',
  },
  categoryUploadButtonDisabled: {
    borderColor: '#E4E8EE',
    backgroundColor: '#F6F7F9',
  },
  categoryUploadButtonUploading: {
    borderColor: '#D9E6FF',
    backgroundColor: '#F0F6FF',
  },
  categoryUploadButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: TossColors.primary,
    marginLeft: 8,
  },
  categoryUploadButtonTextRequired: {
    color: TossColors.primary,
  },
  categoryUploadButtonTextDisabled: {
    color: TossColors.textSecondary,
  },
  categoryUploadButtonTextUploading: {
    color: TossColors.primary,
  },
  categoryImagesScroll: {
    marginHorizontal: -4,
  },
  categoryImageItem: {
    position: 'relative',
    marginHorizontal: 4,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: TossColors.border,
  },
  categoryImageStatus: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: TossColors.background,
    borderRadius: 8,
    padding: 2,
  },
  categoryImageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: TossColors.background,
    borderRadius: 10,
  },
  photoFrameSelectButton: {
    borderWidth: 1,
    borderColor: TossColors.border,
    borderRadius: 12,
    backgroundColor: TossColors.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  photoFrameSelectButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoFrameSelectThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: TossColors.secondary,
  },
  photoFrameSelectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text,
  },
  photoFrameSelectedInfo: {
    fontSize: 12,
    color: TossColors.textSecondary,
  },
  photoFrameSheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 10,
  },
  photoFrameSheetItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: TossColors.border,
    borderRadius: 10,
    backgroundColor: TossColors.surface,
    padding: 8,
    marginBottom: 10,
    position: 'relative',
  },
  photoFrameSheetItemSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  photoFrameSheetThumbWrap: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.background,
    aspectRatio: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoFrameSheetThumbSelected: {
    borderColor: TossColors.primary,
  },
  photoFrameSheetThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: TossColors.surface,
  },
  photoFrameSheetName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: TossColors.textSecondary,
    textAlign: 'center',
  },
  photoFrameSheetNameSelected: {
    color: TossColors.primary,
  },
  photoFrameSheetSelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: TossColors.secondary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 사진 업로드 요약
  photoSummaryContainer: {
    backgroundColor: TossColors.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  photoSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 8,
  },
  photoAdjustSection: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: TossColors.surface,
    gap: 12,
  },
  photoAdjustTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TossColors.text,
  },
  photoAdjustControls: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: TossColors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: TossColors.surface,
    gap: 12,
  },
  photoAdjustOpenFloating: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    alignItems: 'flex-end',
  },
  textAdjustOpenFloating: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  composerFabWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    alignItems: 'flex-end',
  },
  composerFabMenu: {
    alignItems: 'flex-end',
    gap: 9,
    marginBottom: 10,
  },
  composerFabAction: {
    minHeight: 42,
    borderRadius: 21,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(25,31,40,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  composerFabActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: TossColors.text,
  },
  composerFabActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F7FF',
  },
  composerFabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  composerFabButtonActive: {
    backgroundColor: TossColors.text,
  },
  photoAdjustOpenButton: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(74,136,255,0.24)',
  },
  photoAdjustOpenText: {
    fontSize: 14,
    fontWeight: '700',
    color: TossColors.primary,
  },
  photoAdjustOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  photoScaleFloating: {
    position: 'absolute',
    right: 12,
    bottom: 78,
    width: 54,
    borderRadius: 25,
    alignItems: 'center',
    paddingVertical: 7,
    gap: 7,
    backgroundColor: 'rgba(17, 24, 39, 0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  photoScaleValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  photoScaleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  photoJoystick: {
    position: 'absolute',
    left: 12,
    bottom: 78,
    width: 136,
    height: 136,
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  photoJoystickAxisHorizontal: {
    position: 'absolute',
    width: 86,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  photoJoystickAxisVertical: {
    position: 'absolute',
    width: 2,
    height: 86,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  photoJoystickKnob: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  photoJoystickKnobDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: TossColors.primary,
  },
  photoAdjustActionBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 48,
    borderRadius: 24,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(25,31,40,0.08)',
  },
  photoAdjustResetButton: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F2F4F6',
  },
  photoAdjustResetButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: TossColors.textSecondary,
  },
  photoAdjustDoneButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.primary,
  },
  photoAdjustDoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  textAdjustDoneWrap: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    alignItems: 'flex-start',
  },
  textAdjustDoneButton: {
    minWidth: 76,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.primary,
  },
  photoAdjustPreviewWrapper: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#000',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdjustPreviewImage: {
    width: '140%',
    height: '140%',
  },
  photoAdjustGrid: {
    gap: 10,
  },
  photoAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoAdjustRowLabel: {
    width: 70,
    fontSize: 13,
    color: TossColors.textSecondary,
    fontWeight: '600',
  },
  photoAdjustButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TossColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.secondary,
  },
  photoAdjustValue: {
    width: 88,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.text,
  },
  photoAdjustReset: {
    marginTop: 4,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.secondary,
  },
  photoAdjustResetText: {
    color: TossColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  templateComposerCanvas: {
    borderRadius: 12,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: TossColors.border,
    marginBottom: 12,
    backgroundColor: TossColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  templateComposerPhotoFrame: {
    width: '88%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: TossColors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  templateComposerPhotoFrameCompact: {
    height: '100%',
    maxWidth: '100%',
    borderRadius: 10,
    backgroundColor: TossColors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  templateComposerPhoto: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    resizeMode: 'cover',
  },
  templateComposerOverlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  memorialNameOverlay: {
    position: 'absolute',
    top: '68%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  memorialNameOverlayCompact: {
    position: 'absolute',
    top: '68%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  memorialDateOverlay: {
    position: 'absolute',
    top: '75%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  memorialDateOverlayCompact: {
    position: 'absolute',
    top: '75%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  memorialNameText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
    letterSpacing: 0,
  },
  memorialNameTextCompact: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
    letterSpacing: 0,
  },
  memorialDateText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#555555',
    textAlign: 'center',
    letterSpacing: 0,
  },
  memorialDateTextCompact: {
    marginTop: 2,
    fontSize: 7,
    lineHeight: 10,
    fontWeight: '700',
    color: '#555555',
    textAlign: 'center',
    letterSpacing: 0,
  },
  photoAdjustPhotoFrameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  templateComposerPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.secondary,
    borderRadius: 12,
    gap: 8,
    paddingHorizontal: 12,
  },
  templateComposerPhotoPlaceholderCompact: {
    width: 96,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.secondary,
    borderRadius: 10,
    gap: 6,
    paddingHorizontal: 8,
  },
  templateComposerPhotoPlaceholderText: {
    color: TossColors.textTertiary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  templateComposerHint: {
    marginBottom: 10,
  },
  templateComposerHintText: {
    fontSize: 12,
    color: TossColors.textSecondary,
    lineHeight: 18,
  },
  templateComposerAdjustPreviewWrapper: {
    backgroundColor: TossColors.background,
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TossColors.border,
    borderRadius: 12,
  },
  photoSummaryStats: {
    gap: 4,
  },
  photoSummaryText: {
    fontSize: 14,
    color: TossColors.textSecondary,
  },
  photoSummaryDetail: {
    fontSize: 12,
    color: TossColors.textTertiary,
  },
  
  // 템플릿 선택
  templateGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: TossColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TossColors.border,
    padding: 18,
  },
  templateCardSelected: {
    borderColor: TossColors.primary,
    borderWidth: 2,
  },
  templateImageContainer: {
    position: 'relative',
  },
  templateImage: {
    width: '100%',
    height: 172,
    backgroundColor: TossColors.border,
    overflow: 'hidden',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'flex-end',
  },
  templateImageComposedPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  templateImageComposedFrameWrap: {
    width: 96,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateImageComposedMeta: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  templateImageComposedType: {
    fontSize: 18,
    fontWeight: '800',
    color: TossColors.text,
  },
  templateImageComposedHint: {
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.textSecondary,
  },
  templateImageMaskContainer: {
    width: '100%',
    height: 200,
    backgroundColor: TossColors.background,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateImageMaskPhotoLayer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  templateImageMaskPhoto: {
    width: '140%',
    height: '140%',
  },
  templateImageMaskPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF1F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  templateImageMaskPhotoPlaceholderText: {
    color: TossColors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  templateImageMask: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // 템플릿 미리보기 시각 블록
  previewCardVisualModern: {
    flex: 1,
    borderRadius: 12,
    padding: 0,
    backgroundColor: '#EEE4D4',
    borderWidth: 1,
    borderColor: '#D5C5AA',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewModernFlowerCorner: {
    position: 'absolute',
    left: -22,
    bottom: -40,
    width: 188,
    height: 188,
    opacity: 0.58,
  },
  previewModernOlive: {
    position: 'absolute',
    right: -32,
    top: -34,
    width: 202,
    height: 174,
    opacity: 0.52,
    transform: [{ rotate: '18deg' }],
  },
  previewModernPetals: {
    position: 'absolute',
    right: 18,
    bottom: 8,
    width: 118,
    height: 118,
    opacity: 0.28,
    transform: [{ rotate: '-12deg' }],
  },
  previewModernCoverContent: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: 29,
    bottom: 4,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  previewModernVisualCard: {
    width: '66%',
    minHeight: 116,
    borderRadius: 18,
    backgroundColor: 'rgba(255,253,248,0.82)',
    borderWidth: 1,
    borderColor: '#D8C9B2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    overflow: 'hidden',
  },
  previewModernVisualFrame: {
    width: 48,
    height: 58,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2B2B2A',
    backgroundColor: '#F7EFE1',
    marginTop: 7,
  },
  previewModernVisualLineWide: {
    width: 82,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(43,43,42,0.18)',
    marginTop: 10,
  },
  previewModernVisualLineShort: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(43,43,42,0.12)',
    marginTop: 6,
  },
  previewModernCoverKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  previewModernBadge: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  previewModernDate: {
    color: '#8A6A2F',
    fontSize: 8,
    fontWeight: '800',
  },
  previewModernCoverTitle: {
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800',
    color: '#191F28',
    letterSpacing: 0.2,
  },
  previewModernCoverSubtitle: {
    marginTop: 5,
    maxWidth: '82%',
    fontSize: 12,
    lineHeight: 17,
    color: '#51473C',
    fontWeight: '700',
  },
  previewModernCoverDivider: {
    width: '78%',
    height: 20,
    marginTop: 6,
    opacity: 0.48,
  },
  previewModernCoverFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 7,
  },
  previewModernCoverFeature: {
    minHeight: 25,
    borderRadius: 999,
    backgroundColor: 'rgba(255,253,248,0.78)',
    borderWidth: 1,
    borderColor: '#D8C9B2',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewModernCoverFeatureText: {
    fontSize: 9,
    color: '#2B2B2A',
    fontWeight: '800',
  },

  previewCardVisualTimeline: {
    flex: 1,
    borderRadius: 12,
    padding: 0,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#D5DCE5',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTimelineSoftBlockA: {
    position: 'absolute',
    right: -36,
    top: -18,
    width: 174,
    height: 122,
    borderRadius: 24,
    backgroundColor: 'rgba(54,81,108,0.12)',
    transform: [{ rotate: '-10deg' }],
  },
  previewTimelineSoftBlockB: {
    position: 'absolute',
    left: -28,
    bottom: -38,
    width: 188,
    height: 134,
    borderRadius: 28,
    backgroundColor: 'rgba(148,163,184,0.20)',
    transform: [{ rotate: '12deg' }],
  },
  previewTimelineCoverContent: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: 18,
    bottom: 14,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  previewTimelineVisualPanel: {
    width: '68%',
    minHeight: 124,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: '#D5DCE5',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    position: 'relative',
  },
  previewTimelineVisualRail: {
    position: 'absolute',
    top: 26,
    bottom: 24,
    left: 27,
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  previewTimelineVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewTimelineVisualDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  previewTimelineVisualDotActive: {
    backgroundColor: '#36516C',
    borderColor: '#36516C',
  },
  previewTimelineVisualLines: {
    flex: 1,
    gap: 5,
  },
  previewTimelineVisualLine: {
    width: '78%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
  },
  previewTimelineVisualLineActive: {
    width: '92%',
    backgroundColor: '#36516C',
  },
  previewTimelineVisualSubLine: {
    width: '54%',
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  previewTimelineCoverKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  previewTimelineHeaderDate: {
    fontSize: 9,
    color: '#536B84',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  previewTimelineBadge: {
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#36516C',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '900',
  },
  previewTimelineCoverTitle: {
    fontSize: 31,
    lineHeight: 36,
    color: '#191F28',
    fontWeight: '900',
  },
  previewTimelineCoverSubtitle: {
    marginTop: 5,
    maxWidth: '84%',
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    fontWeight: '800',
  },
  previewTimelineCoverFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 7,
  },
  previewTimelineCoverFeature: {
    minHeight: 25,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderWidth: 1,
    borderColor: '#D5DCE5',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewTimelineCoverFeatureText: {
    fontSize: 9,
    color: '#36516C',
    fontWeight: '900',
  },

  previewCardVisualPaper: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FBF8F0',
    borderWidth: 1,
    borderColor: '#E6DDCC',
    overflow: 'hidden',
  },
  previewPaperRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: '#7B5A3B',
    color: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 10,
  },
  previewPaperCard: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DBC8',
    padding: 12,
    justifyContent: 'center',
  },
  previewPaperTitle: {
    fontSize: 16,
    color: '#7B5A3B',
    fontWeight: '800',
    marginBottom: 10,
  },
  previewPaperName: {
    fontSize: 22,
    color: TossColors.text,
    fontWeight: '900',
    marginBottom: 2,
  },
  previewPaperSub: {
    fontSize: 12,
    color: TossColors.textSecondary,
    marginBottom: 12,
  },
  previewPaperLine: {
    width: 130,
    height: 1,
    backgroundColor: '#E7DDC9',
    marginBottom: 12,
  },
  previewPaperLineText: {
    fontSize: 11,
    color: '#6B5B49',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  previewCardVisualCertificate: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8F5EF',
    borderWidth: 1,
    borderColor: '#D8D0C1',
    overflow: 'hidden',
    alignItems: 'center',
  },
  previewCertificateHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  previewCertificateTitle: {
    fontSize: 17,
    color: '#2F3338',
    fontWeight: '900',
    letterSpacing: 2,
  },
  previewCertificateTitleLine: {
    width: 42,
    height: 2,
    backgroundColor: '#7C6F60',
    marginTop: 5,
  },
  previewCertificatePhoto: {
    width: 58,
    height: 66,
    borderRadius: 6,
    backgroundColor: '#E4DED3',
    borderWidth: 1,
    borderColor: '#CFC5B7',
    marginBottom: 8,
  },
  previewCertificateName: {
    fontSize: 18,
    color: '#202429',
    fontWeight: '900',
  },
  previewCertificateSub: {
    fontSize: 9,
    color: '#777169',
    marginTop: 3,
    marginBottom: 9,
  },
  previewCertificateSection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#DED7CC',
    paddingTop: 8,
    marginTop: 6,
  },
  previewCertificateSectionTitle: {
    fontSize: 10,
    color: '#4A4036',
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  previewCertificateLineWide: {
    height: 5,
    width: '76%',
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#DCD4C8',
    marginBottom: 5,
  },
  previewCertificateLineShort: {
    height: 5,
    width: '48%',
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#E7E0D6',
  },
  previewCertificateFamilyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
    paddingHorizontal: 12,
  },
  previewCertificatePill: {
    width: 28,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#B9AB98',
  },
  previewCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TossColors.text,
    marginBottom: 4,
  },
  previewCardDate: {
    fontSize: 12,
    color: TossColors.textTertiary,
    marginBottom: 10,
  },
  previewCardDotRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  previewChip: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  previewChipText: {
    fontSize: 11,
    color: TossColors.textSecondary,
    fontWeight: '600',
  },
  previewProfileMock: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 136, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 136, 255, 0.35)',
    marginBottom: 10,
  },
  previewProfileMockEditorial: {
    backgroundColor: 'rgba(64, 93, 230, 0.2)',
    borderColor: 'rgba(64, 93, 230, 0.35)',
  },
  previewProfileMockPaper: {
    backgroundColor: 'rgba(168, 132, 82, 0.24)',
    borderColor: 'rgba(168, 132, 82, 0.38)',
  },
  previewPhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: TossColors.text,
  },
  templateSelectedOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: TossColors.primary,
    borderRadius: 20,
    padding: 4,
  },
  templateInfo: {
    padding: 0,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: TossColors.textSecondary,
    marginBottom: 12,
  },
  templateFeatures: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  templateFeature: {
    backgroundColor: TossColors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  templateFeatureText: {
    fontSize: 11,
    color: TossColors.textSecondary,
  },
  templatePreviewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.secondary,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  templatePreviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
  },
  
  // 완성 화면
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.background,
    paddingHorizontal: 40,
  },
  completionContent: {
    alignItems: 'center',
  },
  completionIconContainer: {
    marginBottom: 24,
  },
  completionEmoji: {
    fontSize: 80,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TossColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 16,
    color: TossColors.textSecondary,
    textAlign: 'center',
  },
  completionPrimaryButton: {
    marginTop: 24,
    minWidth: 210,
    height: 54,
    borderRadius: 14,
    backgroundColor: TossColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TossColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  completionPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  completionHomeButton: {
    marginTop: 10,
    minWidth: 210,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  completionHomeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: TossColors.primary,
  },
  
  // 하단 버튼
  bottomButtonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: TossColors.background,
    borderTopWidth: 1,
    borderTopColor: TossColors.border,
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.surface,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: TossColors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: TossColors.disabled,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
  },
  testFillWrap: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    zIndex: 20,
  },
  testFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    backgroundColor: TossColors.background,
    borderWidth: 1,
    borderColor: TossColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  testFillText: {
    fontSize: 12,
    fontWeight: '800',
    color: TossColors.primary,
  },
  
  // 이미지 업로드 모달
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: TossColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  uploadModalContainer: {
    backgroundColor: TossColors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  uploadModalContent: {
    padding: 32,
    alignItems: 'center',
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadModalMessage: {
    fontSize: 15,
    color: TossColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  uploadProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  uploadProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: TossColors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: TossColors.primary,
    borderRadius: 3,
  },
  uploadProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
  },
  uploadModalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: TossColors.border,
  },
  uploadModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: TossColors.textSecondary,
  },
  
  // 토스 스타일 모달
  tossModalOverlay: {
    flex: 1,
    backgroundColor: TossColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  tossModalContainer: {
    backgroundColor: TossColors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  tossModalContent: {
    padding: 32,
    alignItems: 'center',
  },
  tossModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  tossModalMessage: {
    fontSize: 15,
    color: TossColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tossModalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: TossColors.border,
  },
  tossModalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: TossColors.border,
  },
  tossModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: TossColors.textSecondary,
  },
  tossModalConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tossModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.primary,
  },
  
  // 토스 스타일 피커
  tossPickerOverlay: {
    flex: 1,
    backgroundColor: TossColors.overlay,
    justifyContent: 'flex-end',
  },
  tossPickerContainer: {
    backgroundColor: TossColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.62,
  },
  tossPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
  },
  tossPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
  },
  
  // 달력 스타일
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  monthNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.secondary,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.text,
  },
  yearJumpSection: {
    marginHorizontal: 20,
    marginBottom: 14,
  },
  yearJumpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.textSecondary,
    marginBottom: 8,
  },
  yearJumpRow: {
    flexDirection: 'row',
    gap: 6,
  },
  yearJumpButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TossColors.border,
    backgroundColor: TossColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearJumpButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.text,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  weekendDay: {
    color: TossColors.primary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 14,
    minHeight: 302,
  },
  calendarDay: {
    width: calendarDaySize,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21,
    marginVertical: 3,
  },
  selectedDay: {
    backgroundColor: TossColors.primary,
  },
  todayDay: {
    backgroundColor: TossColors.secondary,
    borderWidth: 1,
    borderColor: TossColors.primary,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: TossColors.text,
  },
  selectedDayText: {
    color: TossColors.background,
    fontWeight: '700',
  },
  todayText: {
    color: TossColors.primary,
    fontWeight: '600',
  },
  otherMonthText: {
    color: TossColors.textTertiary,
  },
  pastDayText: {
    color: TossColors.textTertiary,
  },
  sundayText: {
    color: TossColors.error,
  },
  
  // 시간 선택기 스타일
  timePickerCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: TossColors.textSecondary,
  },
  timePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.primary,
  },
  timePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timePickerSection: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 16,
  },
  timePickerList: {
    height: 200,
    width: 80,
  },
  timePickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  timePickerItemSelected: {
    backgroundColor: TossColors.secondary,
  },
  timePickerItemText: {
    fontSize: 18,
    color: TossColors.textSecondary,
  },
  timePickerItemTextSelected: {
    color: TossColors.primary,
    fontWeight: '600',
  },
  
  // 미리보기 모달
  previewModalContainer: {
    flex: 1,
    backgroundColor: TossColors.background,
  },
  previewModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewModalSelect: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    backgroundColor: TossColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    minHeight: 44,
  },
  previewModalSelectText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
  },
});
