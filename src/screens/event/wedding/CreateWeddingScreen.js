// src/screens/event/wedding/CreateWeddingScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Image,
  Dimensions, Modal, Animated, Easing, FlatList, DeviceEventEmitter, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  createEvent, uploadImageToStorage, deleteImageFromStorage,
  getCurrentUserInfo, moveImagesToEventFolder, refundEventCreationCredit,
} from '../../../lib/supabaseHelper';
import DaumPostcode from '../../../components/DaumPostcode';
import WeddingTemplatePreview from '../templates/WeddingTemplatePreview';
import { GlobalFallingEffect } from '../templates/wedding/WeddingCommonComponents';
import WeddingIntroSelectModal, { INTRO_OVERLAYS, INTRO_LIST } from './WeddingIntroSelectModal';
import { useTutorial } from '../../../contexts/TutorialContext';
import TutorialOverlay from '../../../components/TutorialOverlay';

const { width } = Dimensions.get('window');

const formatLocalDateKey = (value) => {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value);
};

const getImageIdentity = (image) => (
  image?.storagePath ||
  image?.publicUrl ||
  image?.originalUri ||
  image?.uri ||
  image?.id ||
  ''
);

const dedupeImages = (images = []) => {
  const seen = new Set();
  return images.filter((image) => {
    const key = getImageIdentity(image);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ── 컬러 시스템 ──
const C = {
  primary: '#3182F6',
  bg: '#F2F4F6',
  white: '#FFFFFF',
  text: '#191F28',
  textSub: '#8B95A1',
  textTertiary: '#C1C8D0',
  border: '#F2F4F6',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#FFB800',
};

// ── 은행 로고 ──
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

// ── 은행 목록 (가나다순) ──
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

// 은행 이름으로 정보 조회
const findBank = (name) => BANKS.find(b => b.name === name);

// ── 은행별 계좌번호 하이픈 패턴 (입출금통장 기준) ──
const ACCOUNT_FORMATS = {
  KB: [6, 2, 6],            // KB국민은행 XXXXXX-XX-XXXXXX (14자리)
  WOORI: [4, 3, 6],         // 우리은행 XXXX-XXX-XXXXXX (13자리)
  SHINHAN: [3, 3, 6],       // 신한은행 XXX-XXX-XXXXXX (12자리)
  HANA: [3, 6, 5],          // 하나은행 XXX-XXXXXX-XXXXX (14자리)
  NH: [3, 4, 4, 2],         // NH농협은행 XXX-XXXX-XXXX-XX (13자리)
  IBK: [3, 6, 2, 3],        // IBK기업은행 XXX-XXXXXX-XX-XXX (14자리)
  KAKAO: [4, 2, 7],         // 카카오뱅크 XXXX-XX-XXXXXXX (13자리)
  TOSS: [4, 4, 4],          // 토스뱅크 XXXX-XXXX-XXXX (12자리)
  KBANK: [3, 3, 6],         // 케이뱅크 XXX-XXX-XXXXXX (12자리)
  SC: [3, 2, 6],            // SC제일은행 XXX-XX-XXXXXX (11자리)
  CITI: [3, 6, 3],          // 씨티은행 XXX-XXXXXX-XXX (12자리)
  DGB: [3, 2, 6, 1],        // 대구은행(iM뱅크) XXX-XX-XXXXXX-X (12자리)
  BNK: [3, 4, 4, 2],        // 부산은행 XXX-XXXX-XXXX-XX (13자리)
  GWANGJU: [3, 3, 6],       // 광주은행 XXX-XXX-XXXXXX (12자리)
  JEONBUK: [3, 2, 6],       // 전북은행 XXX-XX-XXXXXX (11자리)
  KYONGNAM: [3, 2, 7],      // 경남은행 XXX-XX-XXXXXXX (12자리)
  JEJU: [2, 2, 6],          // 제주은행 XX-XX-XXXXXX (10자리)
  POST: [6, 2, 6],          // 우체국 XXXXXX-XX-XXXXXX (14자리)
  SH: [4, 4, 4],            // 수협은행 XXXX-XXXX-XXXX (12자리)
  SAEMAEUL: [4, 4, 4, 1],   // 새마을금고 XXXX-XXXX-XXXX-X (13자리)
  CREDIT: [3, 3, 6],        // 신협 XXX-XXX-XXXXXX (12자리)
  KDB: [3, 7, 2],           // KDB산업은행 XXX-XXXXXXX-XX (12자리)
  SAVINGS: [3, 4, 6],       // 저축은행 XXX-XXXX-XXXXXX (13자리)
};

const formatAccountNumber = (value, bankCode) => {
  const numbers = value.replace(/[^\d]/g, '');
  const pattern = bankCode ? ACCOUNT_FORMATS[bankCode] : null;
  if (!pattern) return numbers;
  let result = '';
  let idx = 0;
  for (let i = 0; i < pattern.length; i++) {
    const chunk = numbers.slice(idx, idx + pattern[i]);
    if (!chunk) break;
    if (i > 0) result += '-';
    result += chunk;
    idx += pattern[i];
  }
  // 패턴 이후 남은 숫자도 그대로 붙여줌
  if (idx < numbers.length) {
    result += numbers.slice(idx);
  }
  return result;
};

// ── 테스트용 랜덤 플레이스홀더 이미지 ──
const PLACEHOLDER_IMAGES = [
  require('../../../../assets/images/aa1.png'),
  require('../../../../assets/images/aa2.png'),
  require('../../../../assets/images/aa3.png'),
  require('../../../../assets/images/aa4.png'),
  require('../../../../assets/images/bb1.png'),
  require('../../../../assets/images/bb2.png'),
];

// ── 사진 카테고리 ──
const PHOTO_CATEGORIES = [
  { key: 'main',    label: '메인 사진',   icon: '🖼',  maxCount: 5,  required: false, desc: '청첩장 첫 화면에 표시될 대표 사진' },
  { key: 'gallery', label: '갤러리 사진', icon: '📷',  maxCount: 30, required: false, desc: '갤러리 섹션에 표시될 추억 사진들' },
];

// ── 배경음악 목록 ──
const MUSIC_TRACKS = [
  { id: 'none',    name: '음악 없음',      file: null, desc: '배경음악 없이 조용하게' },
  { id: 'track1',  name: '웨딩 트레일러',  file: require('../../../../assets/music/hitslab-wedding-wedding-trailer-music-269139.mp3'),                   desc: '웅장하고 설레는 오프닝 분위기' },
  { id: 'track2',  name: '로맨틱 웨딩',    file: require('../../../../assets/music/krasnoshchok-wedding-romantic-love-music-409293.mp3'),                 desc: '감미롭고 달콤한 러브 선율' },
  { id: 'track3',  name: '웨딩 피아노 I',  file: require('../../../../assets/music/paulyudin-wedding-485932.mp3'),                                         desc: '잔잔하고 감동적인 피아노 연주' },
  { id: 'track4',  name: '웨딩 피아노 II', file: require('../../../../assets/music/paulyudin-wedding-music-valentines-day-182505.mp3'),                   desc: '서정적이고 아름다운 피아노 곡' },
  { id: 'track5',  name: '웨딩 왈츠',      file: require('../../../../assets/music/prettyjohn1-wedding-487335.mp3'),                                       desc: '우아하고 흥겨운 왈츠 선율' },
  { id: 'track6',  name: '클래식 웨딩',    file: require('../../../../assets/music/starostin-wedding-wedding-music-345462.mp3'),                           desc: '품격 있는 클래식 웨딩 음악' },
  { id: 'track7',  name: '마운틴 웨딩 I',  file: require('../../../../assets/music/the_mountain-wedding-455512.mp3'),                                       desc: '청량하고 자연스러운 멜로디' },
  { id: 'track8',  name: '마운틴 웨딩 II', file: require('../../../../assets/music/the_mountain-wedding-487025.mp3'),                                       desc: '맑고 서정적인 산의 선율' },
  { id: 'track9',  name: '벨벳 펀치',      file: require('../../../../assets/music/The_Velvet_Punch.mp3'),                                                 desc: '재즈풍의 세련된 웨딩 음악' },
  { id: 'track10', name: '웨딩 조이',      file: require('../../../../assets/music/u_3m10w313je-wedding-joy-189888.mp3'),                                  desc: '밝고 즐거운 축제 분위기' },
  { id: 'track11', name: '로맨틱 배경음악', file: require('../../../../assets/music/viacheslavstarostin-romantic-wedding-background-music-357203.mp3'),    desc: '부드럽고 낭만적인 배경음악' },
];

// ── 꽃잎 효과 목록 ──
const PETAL_EFFECTS = [
  { id: 'none',    name: '효과 없음', emoji: '✨', desc: '꽃잎 효과를 사용하지 않습니다' },
  { id: 'flower',  name: '눈꽃',     emoji: '❄️', desc: '하얀 눈꽃이 화면 전체에 흩날려요' },
  { id: 'classic', name: '벚꽃잎',   emoji: '🌸', desc: '화사한 벚꽃잎이 화면 전체에' },
  { id: 'custom_petal', name: '커스텀꽃비', emoji: '🌸', desc: '색상을 선택할 수 있는 꽃비' },
];

const PETAL_COLORS = {
  none:         { bg: '#F7F8FA', accent: '#8B95A1', iconBg: '#ECEEF0' },
  flower:       { bg: '#EFF6FF', accent: '#3B82F6', iconBg: '#DBEAFE' },
  classic:      { bg: '#FFF0F8', accent: '#EC4899', iconBg: '#FCE7F3' },
  custom_petal: { bg: '#FFF5F0', accent: '#F97316', iconBg: '#FFEDD5' },
};

const CUSTOM_PETAL_COLOR_OPTIONS = [
  { id: 'pink',   label: '벚꽃', color: '#ffb7c5' },
  { id: 'yellow', label: '개나리', color: '#ffd700' },
  { id: 'red',    label: '장미', color: '#ff4060' },
  { id: 'blue',   label: '수국', color: '#8a2be2' },
  { id: 'mixed',  label: '믹스', colors: ['#ffb7c5', '#ffd700', '#ff4060', '#8a2be2'] },
];

const PETAL_SPEEDS = [
  { id: 'slow',   label: '느리게' },
  { id: 'normal', label: '보통' },
  { id: 'fast',   label: '빠르게' },
];

const PETAL_QTYS = [
  { id: 'few',    label: '적게' },
  { id: 'normal', label: '보통' },
  { id: 'many',   label: '많이' },
];

const PHOTO_FRAMES = [
  { id: 'none', name: '없음', source: null },
  { id: 'background2', name: '프레임 01', source: require('../../../../assets/studio/elements/background2.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background2-thumb.png') },
  { id: 'background3', name: '프레임 02', source: require('../../../../assets/studio/elements/background3.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background3-thumb.png') },
  { id: 'background4', name: '프레임 03', source: require('../../../../assets/studio/elements/background4.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background4-thumb.png') },
  { id: 'background5', name: '프레임 04', source: require('../../../../assets/studio/elements/background5.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background5-thumb.png') },
  { id: 'background6', name: '프레임 05', source: require('../../../../assets/studio/elements/background6.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background6-thumb.png') },
  { id: 'background7', name: '프레임 06', source: require('../../../../assets/studio/elements/background7.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background7-thumb.png') },
  { id: 'background8', name: '프레임 07', source: require('../../../../assets/studio/elements/background8.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background8-thumb.png') },
  { id: 'background9', name: '프레임 08', source: require('../../../../assets/studio/elements/background9.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background9-thumb.png') },
  { id: 'background10', name: '프레임 09', source: require('../../../../assets/studio/elements/background10.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/background10-thumb.png') },
  { id: 'backround4', name: '프레임 10', source: require('../../../../assets/studio/elements/backround4.png'), thumb: require('../../../../assets/studio/elements/frame-thumbs/backround4-thumb.png') },
];

const FRAME_DEFAULT_SCALE = 0.78;
const clampFrameScale = (value) => {
  if (!Number.isFinite(value)) return FRAME_DEFAULT_SCALE;
  return Math.max(0.05, value);
};
const clampFrameOffset = (value) => (Number.isFinite(value) ? value : 0);
const FRAME_THUMB_IDS = PHOTO_FRAMES.filter(frame => frame.thumb).map(frame => frame.id);

const EMPTY_WEDDING_EVENT_DATA = {
  type: 'wedding',
  groomName: '',
  brideName: '',
  groomContact: '',
  brideContact: '',
  groomBankName: '',
  groomAccountNumber: '',
  brideBankName: '',
  brideAccountNumber: '',
  groomFatherName: '',
  groomMotherName: '',
  groomFatherContact: '',
  groomMotherContact: '',
  groomFatherBankName: '',
  groomFatherAccountNumber: '',
  groomMotherBankName: '',
  groomMotherAccountNumber: '',
  brideFatherName: '',
  brideMotherName: '',
  brideFatherContact: '',
  brideMotherContact: '',
  brideFatherBankName: '',
  brideFatherAccountNumber: '',
  brideMotherBankName: '',
  brideMotherAccountNumber: '',
  date: null,
  ceremonyTime: null,
  location: '',
  detailedAddress: '',
  allowMessages: true,
  messageSettings: { placeholder: '축하의 메시지를 남겨주세요.', requireLogin: true },
  images: [],
  customMessage: '',
  parkingInfo: '',
  selectedTemplate: null,
  familyRelations: ['신랑측', '신부측'],
  presetAmounts: [100000, 200000, 300000],
};

const TEST_WEDDING_EVENT_DATA = {
  ...EMPTY_WEDDING_EVENT_DATA,
  groomName: '김민수',
  brideName: '이서연',
  groomContact: '1234-5678',
  brideContact: '8765-4321',
  groomBankName: 'KB국민은행',
  groomAccountNumber: '324702-04-117022',
  brideBankName: '신한은행',
  brideAccountNumber: '110-456-789012',
  groomFatherName: '김영호',
  groomMotherName: '박순희',
  groomFatherContact: '1111-2222',
  groomMotherContact: '3333-4444',
  groomFatherBankName: 'NH농협은행',
  groomFatherAccountNumber: '302-1234-5678-91',
  groomMotherBankName: '우리은행',
  groomMotherAccountNumber: '1002-567-891234',
  brideFatherName: '이정수',
  brideMotherName: '최미영',
  brideFatherContact: '5555-6666',
  brideMotherContact: '7777-8888',
  brideFatherBankName: '하나은행',
  brideFatherAccountNumber: '267-910123-45678',
  brideMotherBankName: '카카오뱅크',
  brideMotherAccountNumber: '3333-12-3456789',
  date: '2026-05-14',
  ceremonyTime: '13:00',
  location: '신라호텔 다이너스티홀 3층',
  detailedAddress: '서울 중구 동호로 249',
  customMessage: '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n\n저희 두 사람이 사랑의 이름으로\n지켜나갈 수 있게 앞날을\n축복해 주시면 감사하겠습니다.',
  parkingInfo: '지하 주차장 2시간 무료',
};

// ── 템플릿 목록 ──
const TEMPLATES = [
  {
    id: 'modern-dark', name: '모던 다크',
    description: '세련되고 감각적인 디자인',
    preview: require('../../../../assets/images/aa1.png'),
    style: 'modern-dark',
    features: ['다크 모드', '그라디언트', '달력 포함'],
  },
  {
    id: 'romantic-pink', name: '로맨틱 핑크',
    description: '따뜻하고 로맨틱한 분위기',
    preview: require('../../../../assets/images/aa2.png'),
    style: 'romantic-pink',
    features: ['핑크 톤', '감성적 디자인', '꽃 애니메이션'],
  },
  {
    id: 'korean-elegant', name: '클린 화이트',
    description: '깔끔하고 세련된 화이트 스타일',
    preview: require('../../../../assets/images/aa3.png'),
    style: 'korean-elegant',
    features: ['미니멀', '화이트 톤', '심플 레이아웃'],
  },
  {
    id: 'vintage-app', name: '웜 오렌지',
    description: '따뜻한 감성의 오렌지 스타일',
    preview: require('../../../../assets/images/aa2.png'),
    style: 'vintage-app',
    features: ['콜라주 갤러리', '웜톤 디자인', '빈티지 감성'],
  },
  {
    id: 'classic-elegant', name: '클래식 엘레강스',
    description: '프리미엄 호텔 예식 스타일',
    preview: require('../../../../assets/images/aa1.png'),
    style: 'classic-elegant',
    features: ['클래식', '화이트 톤', '호텔 예식'],
  },
  {
    id: 'ticket-flight', name: '러브 티켓',
    description: '밀어서 탑승하는 비행 티켓 컨셉',
    preview: require('../../../../assets/images/aa2.png'),
    style: 'ticket-flight',
    features: ['티켓 테마', '인트로 인터랙션', '폭죽 애니메이션'],
  },
  {
    id: 'cinema-romance', name: '시네마 로맨스',
    description: '클래퍼보드를 눌러 시작하는 영화 컨셉',
    preview: require('../../../../assets/images/aa1.png'),
    style: 'cinema-romance',
    features: ['클래퍼보드', '영화 포스터', '다크 골드'],
  },
  {
    id: 'runic-rift', name: '웨딩 데이 스크립트',
    description: '사진과 필기체 무드가 중심이 되는 감성 모바일 청첩장',
    preview: require('../../../../assets/images/aa3.png'),
    style: 'runic-rift',
    features: ['포토 커버', '필기체 무드', '감성 갤러리'],
  },
  {
    id: 'photo-book', name: '포토북 에디션',
    description: '아카이브 카드와 앨범 페이지로 구성한 포토북형 청첩장',
    preview: require('../../../../assets/images/aa4.png'),
    style: 'photo-book',
    features: ['아카이브 카드', '앨범 페이지', '블루 그레이 톤'],
  },
  {
    id: 'elegant-garden', name: '오로라 블랙',
    description: '준비중입니다',
    preview: require('../../../../assets/images/aa1.png'),
    style: 'elegant-garden',
    features: ['준비중'],
    disabled: true,
  },
  {
    id: 'romantic-arch', name: '로맨틱 아치',
    description: '준비중입니다',
    preview: require('../../../../assets/images/aa2.png'),
    style: 'romantic-arch',
    features: ['준비중'],
    disabled: true,
  },
  {
    id: 'editorial-magazine', name: '에디토리얼',
    description: '준비중입니다',
    preview: require('../../../../assets/images/aa3.png'),
    style: 'editorial-magazine',
    features: ['준비중'],
    disabled: true,
  },
];

// ======================================================================
// 공통 컴포넌트
// ======================================================================
function SectionCard({ title, required, subtitle, children }) {
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={s.sectionTitle}>{title}</Text>
          {required && <Text style={s.required}> *</Text>}
        </View>
        {subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}

function TossInput({ label, required, placeholder, value, onChangeText, icon, readOnly, multiline, numberOfLines, keyboardType }) {
  return (
    <View style={s.inputWrap}>
      {label && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={s.inputLabel}>{label}</Text>
          {required && <Text style={s.required}> *</Text>}
        </View>
      )}
      <View style={s.inputBox} pointerEvents={readOnly ? 'none' : 'auto'}>
        {icon && <View style={s.inputIcon}>{icon}</View>}
        <TextInput
          style={[
            s.input,
            icon && { paddingLeft: 40 },
            multiline && { height: numberOfLines ? numberOfLines * 24 : 80, textAlignVertical: 'top' },
          ]}
          placeholder={placeholder}
          placeholderTextColor={C.textSub}
          value={value}
          onChangeText={onChangeText}
          editable={!readOnly}
          multiline={multiline}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

function PhoneInput({ label, value, onChangeText }) {
  return (
    <View style={s.inputWrap}>
      {label && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={s.inputLabel}>{label}</Text>
        </View>
      )}
      <View style={s.phoneInputRow}>
        <View style={s.phonePrefix}>
          <Text style={s.phonePrefixText}>010</Text>
        </View>
        <View style={s.phoneSeparator} />
        <TextInput
          style={s.phoneSuffixInput}
          placeholder="0000-0000"
          placeholderTextColor={C.textSub}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          maxLength={9}
        />
      </View>
    </View>
  );
}

function Toggle({ active, onToggle }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[s.toggle, active && s.toggleOn]}
      activeOpacity={0.9}
    >
      <View style={[s.toggleKnob, active && s.toggleKnobOn]} />
    </TouchableOpacity>
  );
}

// ── 날짜 선택 바텀시트 ──
function DatePickerSheet({ visible, selectedDate, onSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate instanceof Date) return selectedDate;
    if (typeof selectedDate === 'string' && selectedDate) return new Date(selectedDate);
    return new Date();
  });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();
    const days = [];
    for (let i = startDate - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const navigateMonth = (dir) => {
    const m = new Date(currentMonth);
    m.setMonth(currentMonth.getMonth() + dir);
    setCurrentMonth(m);
  };

  const today = new Date();
  const days = getDaysInMonth(currentMonth);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.sheetDim}>
        <TouchableOpacity style={s.sheetDimTouch} onPress={onClose} activeOpacity={1} />
        <View style={s.bottomSheet}>
          <View style={s.sheetHandle}><View style={s.sheetHandleBar} /></View>
          <View style={s.sheetHeaderRow}>
            <Text style={s.sheetTitle}>날짜 선택</Text>
            <TouchableOpacity onPress={onClose} style={s.sheetCloseBtn}>
              <Ionicons name="close" size={20} color={C.textSub} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={20} color={C.textSub} />
            </TouchableOpacity>
            <Text style={s.calMonthText}>
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={{ padding: 8 }}>
              <Ionicons name="chevron-forward" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>

          <View style={s.calGrid}>
            {weekDays.map((d, i) => (
              <Text key={d} style={[s.calDayLabel, i === 0 && { color: '#EF4444' }, i === 6 && { color: '#3B82F6' }]}>{d}</Text>
            ))}
            {days.map((dayInfo, index) => {
              const isToday = dayInfo.date.toDateString() === today.toDateString();
              const selDate = selectedDate ? (selectedDate instanceof Date ? selectedDate : new Date(selectedDate)) : null;
              const isSelected = selDate && dayInfo.date.toDateString() === selDate.toDateString();
              const isPast = dayInfo.date < today && !isToday;
              const dayOfWeek = index % 7;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              return (
                <TouchableOpacity
                  key={index}
                  style={[s.calDay, !dayInfo.isCurrentMonth && { opacity: 0.3 }, isSelected && s.calDayActive, isToday && !isSelected && { backgroundColor: '#EFF6FF' }]}
                  onPress={() => dayInfo.isCurrentMonth && !isPast && onSelect(dayInfo.date)}
                  disabled={!dayInfo.isCurrentMonth || isPast}
                >
                  <Text style={[
                    s.calDayText,
                    isSunday && { color: '#EF4444' },
                    isSaturday && { color: '#3B82F6' },
                    isSelected && s.calDayTextActive,
                    isPast && { color: C.textTertiary },
                  ]}>
                    {dayInfo.date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── 시간 선택 바텀시트 (12시간제 + 오전/오후) ──
function TimePickerSheet({ visible, selectedTime, onSelect, onClose }) {
  const parseTime = () => {
    if (!selectedTime) return { h: 14, m: 0 };
    if (selectedTime instanceof Date) return { h: selectedTime.getHours(), m: selectedTime.getMinutes() };
    if (typeof selectedTime === 'string' && selectedTime.includes(':')) {
      const [hh, mm] = selectedTime.split(':').map(Number);
      return { h: isNaN(hh) ? 14 : hh, m: isNaN(mm) ? 0 : mm };
    }
    return { h: 14, m: 0 };
  };
  const initTime = parseTime();
  const [ampm, setAmpm] = useState(initTime.h >= 12 ? 'PM' : 'AM');
  const [hour12, setHour12] = useState(() => {
    const h = initTime.h % 12;
    return h === 0 ? 12 : h;
  });
  const [minute, setMinute] = useState(initTime.m);

  const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => {
    let h24 = hour12 % 12;
    if (ampm === 'PM') h24 += 12;
    const time = new Date();
    time.setHours(h24, minute, 0, 0);
    onSelect(time);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.sheetDim}>
        <TouchableOpacity style={s.sheetDimTouch} onPress={onClose} activeOpacity={1} />
        <View style={[s.bottomSheet, { paddingBottom: 40 }]}>
          <View style={[s.sheetHeaderRow, { justifyContent: 'space-between' }]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.timeCancel}>취소</Text>
            </TouchableOpacity>
            <Text style={s.sheetTitle}>시간 선택</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={s.timeConfirm}>확인</Text>
            </TouchableOpacity>
          </View>

          {/* 오전/오후 선택 */}
          <View style={s.ampmRow}>
            <TouchableOpacity
              style={[s.ampmBtn, ampm === 'AM' && s.ampmBtnActive]}
              onPress={() => setAmpm('AM')}
            >
              <Text style={[s.ampmBtnText, ampm === 'AM' && s.ampmBtnTextActive]}>오전</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.ampmBtn, ampm === 'PM' && s.ampmBtnActive]}
              onPress={() => setAmpm('PM')}
            >
              <Text style={[s.ampmBtnText, ampm === 'PM' && s.ampmBtnTextActive]}>오후</Text>
            </TouchableOpacity>
          </View>

          <View style={s.timePickerRow}>
            <View style={s.timePickerSection}>
              <Text style={s.timePickerLabel}>시</Text>
              <ScrollView style={s.timePickerList} showsVerticalScrollIndicator={false}>
                {hours12.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[s.timePickerItem, hour12 === h && s.timePickerItemActive]}
                    onPress={() => setHour12(h)}
                  >
                    <Text style={[s.timePickerItemText, hour12 === h && s.timePickerItemTextActive]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={s.timePickerSection}>
              <Text style={s.timePickerLabel}>분</Text>
              <ScrollView style={s.timePickerList} showsVerticalScrollIndicator={false}>
                {minutes.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[s.timePickerItem, minute === m && s.timePickerItemActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[s.timePickerItemText, minute === m && s.timePickerItemTextActive]}>
                      {m.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── 은행 선택 바텀시트 ──
function BankPickerSheet({ visible, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? BANKS.filter(b => b.name.includes(search.trim()))
    : BANKS;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={s.sheetDim}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={s.sheetDimTouch} onPress={onClose} activeOpacity={1} />
        <View style={[s.bottomSheet, { maxHeight: '75%' }]}>
          <View style={s.sheetHandle}><View style={s.sheetHandleBar} /></View>
          <View style={s.sheetHeaderRow}>
            <Text style={s.sheetTitle}>은행 선택</Text>
            <TouchableOpacity onPress={onClose} style={s.sheetCloseBtn}>
              <Ionicons name="close" size={20} color={C.textSub} />
            </TouchableOpacity>
          </View>

          {/* 검색 */}
          <View style={s.bankSearchWrap}>
            <Ionicons name="search" size={18} color={C.textSub} style={{ marginRight: 8 }} />
            <TextInput
              style={s.bankSearchInput}
              placeholder="은행명 검색"
              placeholderTextColor={C.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={C.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* 은행 그리드 */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }} keyboardShouldPersistTaps="handled">
            <View style={s.bankGrid}>
              {filtered.map(bank => (
                <TouchableOpacity
                  key={bank.code}
                  style={s.bankItem}
                  onPress={() => { onSelect(bank.name); onClose(); setSearch(''); }}
                  activeOpacity={0.7}
                >
                  <View style={s.bankIcon}>
                    {BANK_LOGOS[bank.code] ? (
                      <Image source={BANK_LOGOS[bank.code]} style={s.bankLogoImg} resizeMode="contain" />
                    ) : (
                      <Text style={[s.bankIconText, { color: bank.color }]}>
                        {bank.name.slice(0, 2)}
                      </Text>
                    )}
                  </View>
                  <Text style={s.bankName} numberOfLines={1}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: C.textSub, fontSize: 14 }}>검색 결과가 없습니다</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── 업로드 진행 모달 ──
function UploadProgressModal({ visible, currentIndex, totalCount, onCancel }) {
  const pct = totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.modalDim}>
        <View style={s.uploadBox}>
          <View style={s.uploadIconWrap}>
            <Ionicons name="cloud-upload-outline" size={32} color={C.primary} />
          </View>
          <Text style={s.uploadTitle}>이미지 업로드 중...</Text>
          <Text style={s.uploadSub}>{currentIndex}/{totalCount} 이미지 업로드 중</Text>
          <View style={s.uploadTrack}>
            <View style={[s.uploadFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.uploadPercent}>{pct}%</Text>
          <TouchableOpacity style={s.uploadCancelBtn} onPress={onCancel}>
            <Text style={s.uploadCancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ======================================================================
// 메인 컴포넌트
// ======================================================================
export default function CreateWeddingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const creationCreditReservationRef = useRef(route?.params?.eventCreationCreditReservation || null);
  const creationCreditSettledRef = useRef(false);
  // 튜토리얼 타겟 ref
  const namesSectionRef = useRef(null);
  const dateTimeSectionRef = useRef(null);
  const photosSectionRef = useRef(null);
  const nextBtnRef = useRef(null);
  const modernDarkPreviewBtnRef = useRef(null);
  const handleTemplatePreviewRef = useRef(null);
  // 미리보기 모달 내부 컨트롤 ref
  const previewCloseBtnRef = useRef(null);
  const previewMusicBtnRef = useRef(null);
  const previewPetalBtnRef = useRef(null);
  const previewIntroBtnRef = useRef(null);
  // 각 선택 모달의 첫 아이템 ref
  const firstMusicItemRef = useRef(null);
  const firstPetalItemRef = useRef(null);
  // 모던 다크 템플릿 카드 ref
  const modernDarkTemplateCardRef = useRef(null);
  const handleClosePreviewRef = useRef(null);
  const { activeTutorial, step: tutorialStep, registerTarget, registerHandler, advanceStep: tutorialAdvance, pauseTutorial, resumeTutorial } = useTutorial();
  const handleNextRef = useRef(null);
  // 스크롤 중엔 측정 skip (JS 부하 경감)
  const isScrollingRef = useRef(false);
  const sectionPositions = useRef({});

  useEffect(() => {
    return () => {
      const reservation = creationCreditReservationRef.current;
      if (!reservation?.success || creationCreditSettledRef.current) return;
      refundEventCreationCredit({
        userId: reservation.userId,
        paymentMethod: reservation.paymentMethod,
        priceCredits: reservation.priceCredits,
        reason: 'event_create_abandoned:wedding',
      })
        .then(() => DeviceEventEmitter.emit('event-creation-credit-refunded'))
        .catch(() => {});
    };
  }, []);

  // 튜토리얼 — 타겟 반복 측정
  useEffect(() => {
    if (activeTutorial !== 'home') return;
    if (!tutorialStep || tutorialStep.screen !== 'CreateWedding') return;

    const measure = () => {
      if (isScrollingRef.current) return; // 스크롤 중엔 skip
      const pairs = [
        [namesSectionRef, 'weddingSection_names'],
        [dateTimeSectionRef, 'weddingSection_datetime'],
        [photosSectionRef, 'weddingSection_photos'],
        [nextBtnRef, 'weddingNextBtn'],
        [modernDarkPreviewBtnRef, 'modernDarkPreviewBtn'],
        [previewCloseBtnRef, 'previewCloseBtn'],
        [previewMusicBtnRef, 'previewMusicBtn'],
        [previewPetalBtnRef, 'previewPetalBtn'],
        [previewIntroBtnRef, 'previewIntroBtn'],
        [modernDarkTemplateCardRef, 'modernDarkTemplateCard'],
      ];
      pairs.forEach(([ref, key]) => {
        if (ref.current?.measureInWindow) {
          ref.current.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
              registerTarget(key, { x, y, width, height });
            }
          });
        }
      });
    };
    measure();
    // 500ms 간격으로 줄여서 JS 부하 감소 (스크롤 프레임 끊김 방지)
    const id = setInterval(measure, 500);
    return () => clearInterval(id);
  }, [activeTutorial, tutorialStep, registerTarget]);

  // 튜토리얼 — 스텝 변경 시 자동 스크롤 (스포트라이트는 Overlay가 spring 이동)
  useEffect(() => {
    if (activeTutorial !== 'home') return;
    if (!tutorialStep || tutorialStep.screen !== 'CreateWedding') return;

    const key = tutorialStep.targetKey;
    let targetY;
    if (key === 'weddingSection_names') targetY = sectionPositions.current.names;
    else if (key === 'weddingSection_datetime') targetY = sectionPositions.current.dateTime;
    else if (key === 'weddingSection_photos') targetY = sectionPositions.current.photos;
    else if (key === 'weddingNextBtn') targetY = 999999;
    else if (key === 'modernDarkPreviewBtn') targetY = 0;
    else if (key === 'modernDarkTemplateCard') targetY = 0; // step 2에서 맨 위
    // 미리보기 모달 내부 버튼들과 scroll hint, close는 모달 안이라 ScrollView 스크롤 불필요

    if (targetY == null || !scrollRef.current) return;

    // 스크롤 중엔 measure skip → JS 부하 줄여서 프레임 끊김 방지
    isScrollingRef.current = true;
    if (targetY === 999999) {
      scrollRef.current?.scrollToEnd({ animated: true });
    } else {
      scrollRef.current?.scrollTo({ y: Math.max(0, targetY - 120), animated: true });
    }
    const endTimer = setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
    return () => clearTimeout(endTimer);
  }, [tutorialStep?.id, activeTutorial]);

  // 튜토리얼 — 핸들러 등록
  useEffect(() => {
    registerHandler('weddingNextBtn', () => handleNextRef.current?.());
    registerHandler('modernDarkPreviewBtn', () => {
      const modernDark = TEMPLATES.find(t => t.id === 'modern-dark');
      if (modernDark) handleTemplatePreviewRef.current?.(modernDark);
    });
    registerHandler('previewMusicBtn', () => setShowMusicModal(true));
    registerHandler('previewPetalBtn', () => setShowPetalModal(true));
    registerHandler('previewIntroBtn', () => setShowIntroModal(true));
    registerHandler('previewCloseBtn', () => handleClosePreviewRef.current?.());
    // 두 번째 음악 (MUSIC_TRACKS[0]은 '음악 없음', [1]은 첫 실제 음악 "웨딩 트레일러")
    registerHandler('firstMusicItem', () => {
      const target = MUSIC_TRACKS[1];
      if (target) {
        handleSelectMusic(target.id);
        setShowMusicModal(false);
      }
    });
    // 두 번째 꽃잎 ([0]은 '효과 없음', [1]이 첫 실제 꽃잎)
    registerHandler('firstPetalItem', () => {
      const target = PETAL_EFFECTS[1];
      if (target) {
        handleSelectPetal(target.id);
        setShowPetalModal(false);
      }
    });
    registerHandler('modernDarkTemplateCard', () => {
      const modernDark = TEMPLATES.find(t => t.id === 'modern-dark');
      if (modernDark) updateForm('selectedTemplate', modernDark);
    });
  }, [registerHandler]);

  const [step, setStep] = useState(1);
  const [eventData, setEventData] = useState(EMPTY_WEDDING_EVENT_DATA);

  // 모달/상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  // 러브 티켓 템플릿의 탑승 완료 여부 — 탑승 후에만 음악/꽃잎 버튼 노출
  const [ticketFlightBoarded, setTicketFlightBoarded] = useState(false);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('ticket-flight-boarded', (v) => {
      setTicketFlightBoarded(!!v);
    });
    return () => sub.remove();
  }, []);
  // 프리뷰 닫히면 초기화
  useEffect(() => {
    if (!showTemplatePreview) setTicketFlightBoarded(false);
  }, [showTemplatePreview]);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [templateMusicMap, setTemplateMusicMap] = useState({}); // { templateId: { id, name } }
  const [currentPreviewMusicId, setCurrentPreviewMusicId] = useState('none');
  const [showPetalModal, setShowPetalModal] = useState(false);
  const [templatePetalMap, setTemplatePetalMap] = useState({}); // { templateId: { id, speed, qty } }
  const [currentPreviewPetalId, setCurrentPreviewPetalId] = useState('none');
  const [currentPreviewPetalSpeed, setCurrentPreviewPetalSpeed] = useState('normal');
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [templateIntroMap, setTemplateIntroMap] = useState({}); // { templateId: { id, tapToOpen } }
  const [currentPreviewIntroId, setCurrentPreviewIntroId] = useState('none');
  const [currentPreviewTapToOpen, setCurrentPreviewTapToOpen] = useState(false);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const [showFrameModal, setShowFrameModal] = useState(false);
  const [templateFrameMap, setTemplateFrameMap] = useState({}); // { templateId: { id, name, source } }
  const [currentPreviewFrameId, setCurrentPreviewFrameId] = useState('none');
  const [currentPreviewFrameScale, setCurrentPreviewFrameScale] = useState(FRAME_DEFAULT_SCALE);
  const [currentPreviewFrameOffsetX, setCurrentPreviewFrameOffsetX] = useState(0);
  const [currentPreviewFrameOffsetY, setCurrentPreviewFrameOffsetY] = useState(0);
  const [isFrameAdjusting, setIsFrameAdjusting] = useState(false);
  const [loadedFrameThumbs, setLoadedFrameThumbs] = useState({});
  const [currentPreviewPetalQty, setCurrentPreviewPetalQty] = useState('normal');
  const [currentPreviewPetalColor, setCurrentPreviewPetalColor] = useState('pink');
  const currentPreviewTemplateRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [previewingId, setPreviewingId] = useState(null);
  const soundRef = useRef(null);
  const previewSoundRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const preloadedImageUrisRef = useRef(new Set());
  const [bankPicker, setBankPicker] = useState({ visible: false, field: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '' });
  const [imageUploadState, setImageUploadState] = useState({
    isUploading: false, currentIndex: 0, totalCount: 0, uploadingCategory: null,
  });

  // 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const testButtonAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start();
  }, [step]);

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

  // ── 헬퍼 함수들 ──
  const updateForm = (key, value) => setEventData(prev => ({ ...prev, [key]: value }));
  const fillTestWeddingData = () => {
    setEventData({
      ...TEST_WEDDING_EVENT_DATA,
      images: [],
      selectedTemplate: null,
    });
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  };
  const showAlert = (title, message) => setAlertInfo({ visible: true, title, message });
  const closeAlert = () => setAlertInfo({ visible: false, title: '', message: '' });

  const scrollToSection = (key) => {
    const pos = sectionPositions.current[key];
    if (scrollRef.current && pos !== undefined) {
      scrollRef.current.scrollTo({ y: Math.max(0, pos - 100), animated: true });
    }
  };

  const showAlertWithScroll = (title, message, scrollTarget) => {
    showAlert(title, message);
    if (scrollTarget) {
      setTimeout(() => scrollToSection(scrollTarget), 300);
    }
  };

  const formatPhoneSuffix = (value) => {
    const numbers = value.replace(/[^\d]/g, '').slice(0, 8);
    if (numbers.length <= 4) return numbers;
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  };

  const handleContactChange = (text, field) => {
    updateForm(field, formatPhoneSuffix(text));
  };

  // 계좌번호 변경 핸들러 (은행에 맞는 하이픈 자동 삽입)
  const handleAccountChange = (text, accountField, bankField) => {
    const bankName = eventData[bankField];
    const bank = bankName ? findBank(bankName) : null;
    updateForm(accountField, formatAccountNumber(text, bank?.code));
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    } catch { return ''; }
  };

  const formatTime = (time) => {
    if (!time) return '';
    try {
      if (time instanceof Date && !isNaN(time.getTime())) {
        return time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      if (typeof time === 'string' && time.includes(':')) {
        const [hh, mm] = time.split(':').map(Number);
        const ampm = hh >= 12 ? '오후' : '오전';
        const h = hh > 12 ? hh - 12 : (hh === 0 ? 12 : hh);
        return `${ampm} ${h}:${String(mm).padStart(2, '0')}`;
      }
      return '';
    } catch { return ''; }
  };

  // ── 주소 검색 ──
  const handleAddressComplete = (data) => {
    if (!data) { showAlert('알림', '주소를 다시 선택해주세요'); return; }
    let addr = '';
    if (data.roadAddress?.trim()) addr = data.roadAddress.trim();
    else if (data.jibunAddress?.trim()) addr = data.jibunAddress.trim();
    else if (data.address?.trim()) addr = data.address.trim();
    if (!addr) { showAlert('알림', '올바른 주소를 선택해주세요'); return; }
    setEventData(prev => ({ ...prev, location: addr, zonecode: data.zonecode || '', buildingName: data.buildingName || '' }));
    setShowAddressSearch(false);
  };

  // ── 사진 관련 ──
  const getCategoryImageCount = (cat) => dedupeImages(eventData.images.filter(img => img.category === cat)).length;
  const getCategoryImages = (cat) => dedupeImages(eventData.images.filter(img => img.category === cat));
  const buildCategorizedImages = (images = []) => {
    const uniqueImages = dedupeImages(images);
    return {
      main: uniqueImages.filter(img => img.category === 'main'),
      gallery: uniqueImages.filter(img => img.category === 'gallery'),
      groom: uniqueImages.filter(img => img.category === 'groom'),
      bride: uniqueImages.filter(img => img.category === 'bride'),
      all: uniqueImages,
    };
  };
  const getCategorizedImages = () => buildCategorizedImages(eventData.images);

  const getImagePrefetchUri = (source) => {
    if (!source) return null;
    if (typeof source === 'string') return source;
    if (typeof source === 'number') return Image.resolveAssetSource(source)?.uri || null;
    if (source.uri) return source.uri;
    if (source.publicUrl) return source.publicUrl;
    if (source.url) return source.url;
    return null;
  };

  const prefetchImages = (sources = []) => {
    sources.forEach((source) => {
      const uri = getImagePrefetchUri(source);
      if (!uri || preloadedImageUrisRef.current.has(uri)) return;
      preloadedImageUrisRef.current.add(uri);
      Image.prefetch(uri).catch(() => {
        preloadedImageUrisRef.current.delete(uri);
      });
    });
  };

  const prefetchFrameImages = () => {
    prefetchImages(PHOTO_FRAMES.flatMap(frame => [frame.thumb, frame.source]).filter(Boolean));
  };

  const markFrameThumbLoaded = (frameId) => {
    if (!frameId) return;
    setLoadedFrameThumbs(prev => (prev[frameId] ? prev : { ...prev, [frameId]: true }));
  };

  const frameThumbsReady = FRAME_THUMB_IDS.length > 0 && FRAME_THUMB_IDS.every(id => loadedFrameThumbs[id]);

  const prefetchPreviewImages = (images = eventData.images) => {
    const categorized = buildCategorizedImages(images);
    prefetchImages([
      ...categorized.main,
      ...categorized.gallery.slice(0, 8),
      ...categorized.all.slice(0, 10),
    ]);
    prefetchFrameImages();
  };

  useEffect(() => {
    prefetchFrameImages();
  }, []);

  useEffect(() => {
    if (eventData.images.length > 0) {
      prefetchPreviewImages(eventData.images);
    }
  }, [eventData.images]);

  const removeImage = async (imageId) => {
    setEventData(prev => {
      const img = prev.images.find(i => i.id === imageId);
      if (img?.storagePath) {
        deleteImageFromStorage(img.storagePath).catch(() => {});
      }
      return { ...prev, images: prev.images.filter(i => i.id !== imageId) };
    });
  };

  const pickImagesForCategory = async (category) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요해요');
        return;
      }
      const currentCount = getCategoryImageCount(category.key);
      const remaining = category.maxCount - currentCount;
      if (remaining <= 0) {
        showAlert('알림', `${category.label}은 최대 ${category.maxCount}장까지 업로드 가능해요`);
        return;
      }
      const allowsMultiple = remaining > 1 && category.maxCount > 1;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !allowsMultiple,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: allowsMultiple,
        selectionLimit: allowsMultiple ? remaining : 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const userResult = await getCurrentUserInfo();
        if (!userResult.success) {
          showAlert('오류', '사용자 정보를 확인할 수 없어요. 다시 로그인해주세요.');
          return;
        }
        const currentUser = userResult.user;

        // 중복 사진 제거 (원본 URI 기준 비교)
        const existingOriginalUris = new Set(eventData.images.map(img => img.originalUri || img.uri));
        const uniqueAssets = result.assets.filter(asset => !existingOriginalUris.has(asset.uri));
        if (uniqueAssets.length === 0) {
          showAlert('알림', '이미 업로드된 사진이에요.');
          return;
        }
        const selectedImages = uniqueAssets.slice(0, remaining);
        const tempEventId = eventData.tempEventId || `temp_${Date.now()}`;

        setImageUploadState({ isUploading: true, currentIndex: 0, totalCount: selectedImages.length, uploadingCategory: category.label });

        // 순차 업로드 (동시 업로드 시 hang 방지) + 타임아웃
        const results = [];
        for (let index = 0; index < selectedImages.length; index++) {
          const asset = selectedImages[index];
          const timestamp = Date.now() + index;
          const rnd = Math.random().toString(36).slice(2, 8);
          const fileName = `${category.key}_${timestamp}_${rnd}.jpg`;
          const imgId = `${category.key}_${timestamp}_${rnd}`;
          try {
            // HEIC → JPEG 변환 + 리사이즈 (대용량 파일 처리 속도 개선)
            let uploadUri = asset.uri;
            try {
              const converted = await ImageManipulator.manipulateAsync(
                asset.uri,
                [{ resize: { width: 1200 } }],
                { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
              );
              uploadUri = converted.uri;
              console.log('✅ 이미지 변환 완료 (JPEG)');
            } catch (e) {
              console.warn('⚠️ 이미지 변환 실패, 원본 사용:', e.message);
            }

            const uploadPromise = uploadImageToStorage(uploadUri, fileName, currentUser.id, tempEventId);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000));
            const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
            setImageUploadState(prev => ({ ...prev, currentIndex: index + 1 }));
            if (uploadResult.success) {
              results.push({
                ...asset,
                uri: uploadUri,
                originalUri: asset.uri,  // 원본 갤러리 URI 보존 (중복 체크용)
                category: category.key, categoryLabel: category.label,
                id: imgId, publicUrl: uploadResult.data.publicUrl, storagePath: uploadResult.data.path,
                eventId: tempEventId, uploadSuccess: true,
              });
            } else {
              results.push({ ...asset, originalUri: asset.uri, category: category.key, categoryLabel: category.label, id: imgId, eventId: tempEventId, uploadSuccess: false, error: uploadResult.error });
            }
          } catch (error) {
            setImageUploadState(prev => ({ ...prev, currentIndex: index + 1 }));
            results.push({ ...asset, originalUri: asset.uri, category: category.key, categoryLabel: category.label, id: imgId, eventId: tempEventId, uploadSuccess: false, error: error.message });
          }
        }
        setImageUploadState({ isUploading: false, currentIndex: 0, totalCount: 0, uploadingCategory: null });

        const success = results.filter(r => r.uploadSuccess);
        const failed = results.filter(r => !r.uploadSuccess);

        if (success.length > 0) {
          setEventData(prev => {
            let updated;
            if (category.maxCount === 1) {
              updated = [...prev.images.filter(img => img.category !== category.key), ...success];
            } else {
              updated = [...prev.images, ...success];
            }
            return { ...prev, images: updated, tempEventId };
          });
          // 모달 전환 충돌 방지: 딜레이 후 알림
          setTimeout(() => {
            if (failed.length > 0) {
              showAlert('일부 업로드 실패', `${success.length}장은 성공했지만 ${failed.length}장 업로드에 실패했어요.`);
            }
          }, 500);
        } else {
          setTimeout(() => {
            showAlert('업로드 실패', '이미지 업로드에 실패했어요. 네트워크 상태를 확인하고 다시 시도해주세요.');
          }, 500);
        }
      }
    } catch (error) {
      setImageUploadState({ isUploading: false, currentIndex: 0, totalCount: 0, uploadingCategory: null });
      showAlert('오류', '사진 선택 중 문제가 발생했어요');
    }
  };

  const handleUploadCancel = () => {
    setImageUploadState({ isUploading: false, currentIndex: 0, totalCount: 0, uploadingCategory: null });
    showAlert('업로드 취소', '이미지 업로드가 취소되었습니다.');
  };

  // ── 음악 ──
  const startProgressTracking = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(async () => {
      if (!soundRef.current) return;
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis > 0) {
          setPlaybackProgress(status.positionMillis / status.durationMillis);
        }
      } catch {}
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const stopAllSounds = async () => {
    stopProgressTracking();
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    if (previewSoundRef.current) {
      try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {}
      previewSoundRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    setPreviewingId(null);
  };

  const playMusic = async (trackId) => {
    const track = MUSIC_TRACKS.find(t => t.id === trackId);
    if (!track?.file) return;
    await stopAllSounds();
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await Audio.Sound.createAsync(track.file, { isLooping: true, volume: 0.6 });
      soundRef.current = sound;
      await sound.playAsync();
      setIsPlaying(true);
      startProgressTracking();
    } catch (e) { console.warn('음악 재생 오류:', e); }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) { if (currentPreviewMusicId !== 'none') await playMusic(currentPreviewMusicId); return; }
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      stopProgressTracking();
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      startProgressTracking();
    }
  };

  const previewTrack = async (trackId) => {
    const track = MUSIC_TRACKS.find(t => t.id === trackId);
    if (!track?.file) return;
    if (previewingId === trackId) {
      if (previewSoundRef.current) { try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {} previewSoundRef.current = null; }
      setPreviewingId(null); return;
    }
    if (previewSoundRef.current) { try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {} previewSoundRef.current = null; }
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await Audio.Sound.createAsync(track.file, { volume: 0.8 });
      previewSoundRef.current = sound;
      await sound.playAsync();
      setPreviewingId(trackId);
      setTimeout(async () => {
        if (previewSoundRef.current) { try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {} previewSoundRef.current = null; }
        setPreviewingId(null);
      }, 10000);
    } catch (e) { console.warn('미리듣기 오류:', e); }
  };

  const handleSelectMusic = async (trackId) => {
    if (previewSoundRef.current) { try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {} previewSoundRef.current = null; setPreviewingId(null); }
    setCurrentPreviewMusicId(trackId);
    const tplId = currentPreviewTemplateRef.current;
    if (tplId) {
      setTemplateMusicMap(prev => ({
        ...prev,
        [tplId]: trackId === 'none' ? null : { id: trackId, name: MUSIC_TRACKS.find(t => t.id === trackId)?.name },
      }));
    }
    if (trackId === 'none') { await stopAllSounds(); }
    else { await playMusic(trackId); }
    setShowMusicModal(false);
  };

  const handleSelectPetal = (petalId) => {
    setCurrentPreviewPetalId(petalId);
    const tplId = currentPreviewTemplateRef.current;
    if (tplId) {
      setTemplatePetalMap(prev => ({
        ...prev,
        [tplId]: petalId === 'none' ? null : {
          id: petalId,
          speed: currentPreviewPetalSpeed,
          qty: currentPreviewPetalQty,
          color: currentPreviewPetalColor,
        },
      }));
    }
  };

  const handleSelectIntro = (introData) => {
    const id        = typeof introData === 'string' ? introData : introData?.id || 'grand';
    const tapToOpen = typeof introData === 'object' && introData !== null ? introData.tapToOpen || false : false;
    setCurrentPreviewIntroId(id);
    setCurrentPreviewTapToOpen(tapToOpen);
    const tplId = currentPreviewTemplateRef.current;
    if (tplId) {
      setTemplateIntroMap(prev => ({
        ...prev,
        [tplId]: id === 'none' ? null : { id, tapToOpen },
      }));
    }
  };

  const handleSelectFrame = (frameId) => {
    const frame = PHOTO_FRAMES.find(item => item.id === frameId) || PHOTO_FRAMES[0];
    setCurrentPreviewFrameId(frame.id);
    const nextScale = frame.id === 'none' ? FRAME_DEFAULT_SCALE : currentPreviewFrameScale;
    const nextOffsetX = frame.id === 'none' ? 0 : currentPreviewFrameOffsetX;
    const nextOffsetY = frame.id === 'none' ? 0 : currentPreviewFrameOffsetY;
    if (frame.id === 'none') {
      setCurrentPreviewFrameScale(FRAME_DEFAULT_SCALE);
      setCurrentPreviewFrameOffsetX(0);
      setCurrentPreviewFrameOffsetY(0);
      setIsFrameAdjusting(false);
    }
    const tplId = currentPreviewTemplateRef.current;
    if (tplId) {
      setTemplateFrameMap(prev => ({
        ...prev,
        [tplId]: frame.id === 'none' ? null : {
          ...frame,
          scale: nextScale,
          offsetX: nextOffsetX,
          offsetY: nextOffsetY,
        },
      }));
    }
  };

  const updateFrameAdjustment = (patch) => {
    const nextScale = patch.scale !== undefined ? clampFrameScale(patch.scale) : currentPreviewFrameScale;
    const nextOffsetX = patch.offsetX !== undefined ? clampFrameOffset(patch.offsetX) : currentPreviewFrameOffsetX;
    const nextOffsetY = patch.offsetY !== undefined ? clampFrameOffset(patch.offsetY) : currentPreviewFrameOffsetY;
    setCurrentPreviewFrameScale(nextScale);
    setCurrentPreviewFrameOffsetX(nextOffsetX);
    setCurrentPreviewFrameOffsetY(nextOffsetY);

    const tplId = currentPreviewTemplateRef.current;
    const frame = PHOTO_FRAMES.find(item => item.id === currentPreviewFrameId);
    if (tplId && frame && frame.id !== 'none') {
      setTemplateFrameMap(prev => ({
        ...prev,
        [tplId]: {
          ...frame,
          scale: nextScale,
          offsetX: nextOffsetX,
          offsetY: nextOffsetY,
        },
      }));
    }
  };

  const resetFrameAdjustment = () => {
    updateFrameAdjustment({
      scale: FRAME_DEFAULT_SCALE,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const startFrameAdjustment = () => {
    if (currentPreviewFrameId === 'none') return;
    setShowFrameModal(false);
    setIsFrameAdjusting(true);
  };

  const onIntroModalClose = () => {
    setShowIntroModal(false);
    setShowIntroOverlay(false);
    // 인트로 선택 모달 닫힘 후 인트로 바로 재생
    setTimeout(() => setShowIntroOverlay(true), 300);
  };

  const handleApplyPetalSettings = () => {
    const tplId = currentPreviewTemplateRef.current;
    if (tplId && currentPreviewPetalId !== 'none') {
      setTemplatePetalMap(prev => ({
        ...prev,
        [tplId]: { id: currentPreviewPetalId, speed: currentPreviewPetalSpeed, qty: currentPreviewPetalQty, color: currentPreviewPetalColor },
      }));
    }
    setShowPetalModal(false);
  };

  const handleClosePreview = async () => {
    await stopAllSounds();
    setCurrentPreviewMusicId('none');
    setCurrentPreviewPetalId('none');
    setCurrentPreviewPetalSpeed('normal');
    setCurrentPreviewPetalQty('normal');
    setCurrentPreviewPetalColor('pink');
    setCurrentPreviewIntroId('none');
    setCurrentPreviewFrameId('none');
    setCurrentPreviewFrameScale(FRAME_DEFAULT_SCALE);
    setCurrentPreviewFrameOffsetX(0);
    setCurrentPreviewFrameOffsetY(0);
    setIsFrameAdjusting(false);
    setShowIntroOverlay(false);
    currentPreviewTemplateRef.current = null;
    setShowTemplatePreview(false);
    // 튜토리얼 preview_scroll 단계에서 X 누르면 자동으로 다음 단계 진행
    if (activeTutorial === 'home' && tutorialStep?.id === 'preview_scroll') {
      pauseTutorial();
      tutorialAdvance();
      setTimeout(() => resumeTutorial(), 800);
    }
  };
  handleClosePreviewRef.current = handleClosePreview;

  // ── 템플릿 ──
  const handleTemplatePreview = async (tpl) => {
    await stopAllSounds();
    prefetchPreviewImages();
    currentPreviewTemplateRef.current = tpl.id;
    const savedMusic = templateMusicMap[tpl.id];
    const musicId = savedMusic?.id || 'none';
    setCurrentPreviewMusicId(musicId);
    const savedPetal = templatePetalMap[tpl.id];
    setCurrentPreviewPetalId(savedPetal?.id || 'none');
    setCurrentPreviewPetalSpeed(savedPetal?.speed || 'normal');
    setCurrentPreviewPetalQty(savedPetal?.qty || 'normal');
    setCurrentPreviewPetalColor(savedPetal?.color || 'pink');
    const savedFrame = templateFrameMap[tpl.id];
    setCurrentPreviewFrameId(savedFrame?.id || 'none');
    setCurrentPreviewFrameScale(savedFrame?.scale || FRAME_DEFAULT_SCALE);
    setCurrentPreviewFrameOffsetX(savedFrame?.offsetX || 0);
    setCurrentPreviewFrameOffsetY(savedFrame?.offsetY || 0);
    // 웜 오렌지·시네마 로맨스는 자체 인트로가 있어 외부 인트로 오버레이 강제 비활성화
    const hasOwnIntro = tpl.id === 'vintage-app' || tpl.id === 'cinema-romance';
    const savedIntro = hasOwnIntro ? null : templateIntroMap[tpl.id];
    setCurrentPreviewIntroId(savedIntro?.id || 'none');
    setPreviewTemplate(tpl);
    if (savedIntro?.id) {
      setShowIntroOverlay(true); // 모달 열리기 전에 미리 true → 열리자마자 인트로가 덮음
    } else {
      setShowIntroOverlay(false);
    }
    setShowTemplatePreview(true);
    if (musicId !== 'none') {
      setTimeout(() => playMusic(musicId), 400);
    }
  };
  // 튜토리얼용 ref 동기화
  handleTemplatePreviewRef.current = handleTemplatePreview;

  // ── 검증 ──
  const validateStep1 = () => {
    if (!eventData.groomName.trim()) { showAlertWithScroll('필수 입력', '신랑 이름을 입력해주세요', 'names'); return false; }
    if (!eventData.brideName.trim()) { showAlertWithScroll('필수 입력', '신부 이름을 입력해주세요', 'names'); return false; }
    if (!eventData.date) { showAlertWithScroll('필수 입력', '결혼식 날짜를 선택해주세요', 'dateTime'); return false; }
    if (!eventData.ceremonyTime) { showAlertWithScroll('필수 입력', '예식 시간을 선택해주세요', 'dateTime'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    } else if (step === 2) {
      if (!eventData.selectedTemplate) {
        showAlert('템플릿 선택', '원하는 템플릿을 선택해주세요');
        return;
      }
      handleSave();
    }
  };
  // 튜토리얼에서 다음 버튼 호출용 — 렌더마다 최신 버전 유지
  handleNextRef.current = handleNext;

  // ── 저장 ──
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const eventTitle = `${eventData.groomName} ♥ ${eventData.brideName} 결혼식`;
      const uniqueEventImages = dedupeImages(eventData.images);
      const categorizedImages = buildCategorizedImages(uniqueEventImages);

      // 테스트용: 메인 사진 없으면 랜덤 플레이스홀더 1장 삽입
      if (categorizedImages.main.length === 0) {
        const placeholder = PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
        const placeholderEntry = { uri: Image.resolveAssetSource(placeholder).uri, category: 'main', categoryLabel: '메인 사진', id: 'placeholder_0', storagePath: null, publicUrl: null, eventId: null };
        categorizedImages.main = [placeholderEntry];
        categorizedImages.all = [placeholderEntry, ...categorizedImages.all];
      }
      const fullLocation = eventData.detailedAddress
        ? `${eventData.location} ${eventData.detailedAddress}`.trim()
        : eventData.location.trim();

      const formattedEventData = {
        event_type: 'wedding',
        event_name: eventTitle,
        template_style: eventData.selectedTemplate?.style || 'modern-dark',
        family_relations: eventData.familyRelations,
        preset_amounts: eventData.presetAmounts,
        status: 'active',
        is_finalized: false,
        image_urls: uniqueEventImages.map(img => ({
          uri: img.publicUrl || img.uri, category: img.category, categoryLabel: img.categoryLabel,
          id: img.id, storagePath: img.storagePath || null, publicUrl: img.publicUrl || null, eventId: img.eventId || null,
        })),
        allow_messages: eventData.allowMessages,
        message_placeholder: eventData.messageSettings.placeholder,
        event_date: formatLocalDateKey(eventData.date),
        location: fullLocation || null,
        detailed_address: eventData.detailedAddress.trim() || null,
        main_person_name: `${eventData.groomName}, ${eventData.brideName}`,
        bride_name: eventData.brideName.trim(),
        groom_name: eventData.groomName.trim(),
        bride_father_name: eventData.brideFatherName.trim() || null,
        bride_mother_name: eventData.brideMotherName.trim() || null,
        groom_father_name: eventData.groomFatherName.trim() || null,
        groom_mother_name: eventData.groomMotherName.trim() || null,
        bride_contact: eventData.brideContact || null,
        groom_contact: eventData.groomContact || null,
        ceremony_time: eventData.ceremonyTime
          ? (eventData.ceremonyTime instanceof Date ? eventData.ceremonyTime.toTimeString().split(' ')[0] : String(eventData.ceremonyTime))
          : null,
        custom_message: eventData.customMessage.trim() || null,
        parking_info: eventData.parkingInfo.trim() || null,
        additional_info: {
          groom_father_contact: eventData.groomFatherContact || null,
          groom_mother_contact: eventData.groomMotherContact || null,
          bride_father_contact: eventData.brideFatherContact || null,
          bride_mother_contact: eventData.brideMotherContact || null,
          groom_account_number: eventData.groomAccountNumber?.trim() || null,
          bride_account_number: eventData.brideAccountNumber?.trim() || null,
          groom_father_account_number: eventData.groomFatherAccountNumber?.trim() || null,
          groom_mother_account_number: eventData.groomMotherAccountNumber?.trim() || null,
          bride_father_account_number: eventData.brideFatherAccountNumber?.trim() || null,
          bride_mother_account_number: eventData.brideMotherAccountNumber?.trim() || null,
          groom_bank_name: eventData.groomBankName?.trim() || null,
          bride_bank_name: eventData.brideBankName?.trim() || null,
          groom_father_bank_name: eventData.groomFatherBankName?.trim() || null,
          groom_mother_bank_name: eventData.groomMotherBankName?.trim() || null,
          bride_father_bank_name: eventData.brideFatherBankName?.trim() || null,
          bride_mother_bank_name: eventData.brideMotherBankName?.trim() || null,
          message_settings: eventData.messageSettings,
          background_music: templateMusicMap[eventData.selectedTemplate?.id] || null,
          background_petal: templatePetalMap[eventData.selectedTemplate?.id] || null,
          photo_frame: templateFrameMap[eventData.selectedTemplate?.id]
            ? {
                id: templateFrameMap[eventData.selectedTemplate?.id].id,
                name: templateFrameMap[eventData.selectedTemplate?.id].name,
                scale: templateFrameMap[eventData.selectedTemplate?.id].scale,
                offsetX: templateFrameMap[eventData.selectedTemplate?.id].offsetX,
                offsetY: templateFrameMap[eventData.selectedTemplate?.id].offsetY,
              }
            : null,
          intro_effect: templateIntroMap[eventData.selectedTemplate?.id] || null, // { id }
        },
        event_creation_credit_reservation: creationCreditReservationRef.current,
      };

      creationCreditSettledRef.current = !!creationCreditReservationRef.current;
      const result = await createEvent(formattedEventData);
      if (result.success) {
        setStep(3);
        setTimeout(() => {
          navigation.navigate('EventDisplay', {
            eventId: result.data.id,
            templateStyle: eventData.selectedTemplate?.style || 'modern-dark',
            categorizedImages,
            allowMessages: eventData.allowMessages,
            messageSettings: eventData.messageSettings,
          });
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showAlert('오류', error.message || '결혼식 청첩장 생성 중 문제가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  };

  // ── 부모님 필드 렌더 ──
  const renderParentFields = (side, title, prefix) => (
    <View style={s.parentBox}>
      <Text style={s.parentTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <TossInput placeholder="아버님 성함" value={eventData[`${prefix}FatherName`]} onChangeText={v => updateForm(`${prefix}FatherName`, v)} />
        </View>
        <View style={{ flex: 1 }}>
          <TossInput placeholder="어머님 성함" value={eventData[`${prefix}MotherName`]} onChangeText={v => updateForm(`${prefix}MotherName`, v)} />
        </View>
      </View>
      <PhoneInput
        label="아버님 연락처"
        value={eventData[`${prefix}FatherContact`]}
        onChangeText={v => handleContactChange(v, `${prefix}FatherContact`)}
      />
      <PhoneInput
        label="어머님 연락처"
        value={eventData[`${prefix}MotherContact`]}
        onChangeText={v => handleContactChange(v, `${prefix}MotherContact`)}
      />
      <View style={s.accountSection}>
        <Text style={s.accountLabel}>계좌번호 (선택)</Text>
        <View style={s.bankAccountCard}>
          <Text style={s.bankFieldLabel}>아버님</Text>
          <TouchableOpacity onPress={() => setBankPicker({ visible: true, field: `${prefix}FatherBankName` })}>
            {eventData[`${prefix}FatherBankName`] ? (() => { const b = findBank(eventData[`${prefix}FatherBankName`]); return (
              <View style={s.bankBadge}>
                {b && BANK_LOGOS[b.code] && <Image source={BANK_LOGOS[b.code]} style={s.bankBadgeLogo} resizeMode="contain" />}
                <Text style={s.bankBadgeText}>{eventData[`${prefix}FatherBankName`]}</Text>
                <Ionicons name="close-circle" size={14} color={C.textTertiary} style={{ marginLeft: 2 }} />
              </View>
            ); })() : (
              <View style={s.bankBadgeEmpty}>
                <Ionicons name="add-circle-outline" size={16} color={C.primary} />
                <Text style={s.bankBadgeEmptyText}>은행을 선택해주세요</Text>
              </View>
            )}
          </TouchableOpacity>
          <TossInput placeholder="계좌번호를 입력해주세요" value={eventData[`${prefix}FatherAccountNumber`]} onChangeText={v => handleAccountChange(v, `${prefix}FatherAccountNumber`, `${prefix}FatherBankName`)} keyboardType="numeric" />
        </View>
        <View style={s.bankAccountCard}>
          <Text style={s.bankFieldLabel}>어머님</Text>
          <TouchableOpacity onPress={() => setBankPicker({ visible: true, field: `${prefix}MotherBankName` })}>
            {eventData[`${prefix}MotherBankName`] ? (() => { const b = findBank(eventData[`${prefix}MotherBankName`]); return (
              <View style={s.bankBadge}>
                {b && BANK_LOGOS[b.code] && <Image source={BANK_LOGOS[b.code]} style={s.bankBadgeLogo} resizeMode="contain" />}
                <Text style={s.bankBadgeText}>{eventData[`${prefix}MotherBankName`]}</Text>
                <Ionicons name="close-circle" size={14} color={C.textTertiary} style={{ marginLeft: 2 }} />
              </View>
            ); })() : (
              <View style={s.bankBadgeEmpty}>
                <Ionicons name="add-circle-outline" size={16} color={C.primary} />
                <Text style={s.bankBadgeEmptyText}>은행을 선택해주세요</Text>
              </View>
            )}
          </TouchableOpacity>
          <TossInput placeholder="계좌번호를 입력해주세요" value={eventData[`${prefix}MotherAccountNumber`]} onChangeText={v => handleAccountChange(v, `${prefix}MotherAccountNumber`, `${prefix}MotherBankName`)} keyboardType="numeric" />
        </View>
      </View>
    </View>
  );

  // ── 날짜 선택 핸들러 ──
  const handleDateSelect = (date) => {
    updateForm('date', date);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (time) => {
    updateForm('ceremonyTime', time);
  };

  const progressPercent = (step / 3) * 100;

  // ======================================================================
  // 렌더링
  // ======================================================================
  return (
      <View style={[s.root, { paddingTop: insets.top }]}>

        {/* ── 헤더 & 진행바 ── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity
              onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
              style={s.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color={C.text} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>청첩장 만들기</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={s.stepText}>Step {step} / 3</Text>
        </View>

        {/* ── 스크롤 본문 ── */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: C.bg }}
          contentContainerStyle={[s.scrollContent, { paddingBottom: step < 3 ? 100 : 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== STEP 1 ===== */}
          {step === 1 && (
            <View>
              {/* 주인공 정보 */}
              <View
                ref={namesSectionRef}
                onLayout={e => { sectionPositions.current.names = e.nativeEvent.layout.y; }}
              >
                <SectionCard title="주인공 정보" required>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <TossInput label="신랑 이름" required placeholder="홍길동" value={eventData.groomName} onChangeText={v => updateForm('groomName', v)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TossInput label="신부 이름" required placeholder="김영희" value={eventData.brideName} onChangeText={v => updateForm('brideName', v)} />
                    </View>
                  </View>
                </SectionCard>
              </View>

              {/* 연락처 & 계좌 */}
              <SectionCard title="연락처 및 계좌번호">
                <PhoneInput
                  label="신랑 연락처"
                  value={eventData.groomContact}
                  onChangeText={v => handleContactChange(v, 'groomContact')}
                />
                <PhoneInput
                  label="신부 연락처"
                  value={eventData.brideContact}
                  onChangeText={v => handleContactChange(v, 'brideContact')}
                />
                <Text style={s.optionalLabel}>축하금을 받을 계좌번호 <Text style={s.optionalNote}>(선택사항)</Text></Text>
                <View style={s.bankAccountCard}>
                  <Text style={s.bankFieldLabel}>신랑</Text>
                  <TouchableOpacity onPress={() => setBankPicker({ visible: true, field: 'groomBankName' })}>
                    {eventData.groomBankName ? (() => { const b = findBank(eventData.groomBankName); return (
                      <View style={s.bankBadge}>
                        {b && BANK_LOGOS[b.code] && <Image source={BANK_LOGOS[b.code]} style={s.bankBadgeLogo} resizeMode="contain" />}
                        <Text style={s.bankBadgeText}>{eventData.groomBankName}</Text>
                        <Ionicons name="close-circle" size={14} color={C.textTertiary} style={{ marginLeft: 2 }} />
                      </View>
                    ); })() : (
                      <View style={s.bankBadgeEmpty}>
                        <Ionicons name="add-circle-outline" size={16} color={C.primary} />
                        <Text style={s.bankBadgeEmptyText}>은행을 선택해주세요</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TossInput placeholder="계좌번호를 입력해주세요" value={eventData.groomAccountNumber} onChangeText={v => handleAccountChange(v, 'groomAccountNumber', 'groomBankName')} keyboardType="numeric" />
                </View>
                <View style={s.bankAccountCard}>
                  <Text style={s.bankFieldLabel}>신부</Text>
                  <TouchableOpacity onPress={() => setBankPicker({ visible: true, field: 'brideBankName' })}>
                    {eventData.brideBankName ? (() => { const b = findBank(eventData.brideBankName); return (
                      <View style={s.bankBadge}>
                        {b && BANK_LOGOS[b.code] && <Image source={BANK_LOGOS[b.code]} style={s.bankBadgeLogo} resizeMode="contain" />}
                        <Text style={s.bankBadgeText}>{eventData.brideBankName}</Text>
                        <Ionicons name="close-circle" size={14} color={C.textTertiary} style={{ marginLeft: 2 }} />
                      </View>
                    ); })() : (
                      <View style={s.bankBadgeEmpty}>
                        <Ionicons name="add-circle-outline" size={16} color={C.primary} />
                        <Text style={s.bankBadgeEmptyText}>은행을 선택해주세요</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TossInput placeholder="계좌번호를 입력해주세요" value={eventData.brideAccountNumber} onChangeText={v => handleAccountChange(v, 'brideAccountNumber', 'brideBankName')} keyboardType="numeric" />
                </View>
              </SectionCard>

              {/* 양가 부모님 */}
              <SectionCard title="양가 부모님 정보" subtitle="입력하지 않은 항목은 청첩장에 표시되지 않아요">
                {renderParentFields('groom', '신랑측 부모님', 'groom')}
                {renderParentFields('bride', '신부측 부모님', 'bride')}
              </SectionCard>

              {/* 일시 */}
              <View
                ref={dateTimeSectionRef}
                onLayout={e => { sectionPositions.current.dateTime = e.nativeEvent.layout.y; }}
              >
                <SectionCard title="일시" required>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <TossInput
                      label="결혼식 날짜" required
                      placeholder="날짜를 선택해주세요"
                      value={formatDate(eventData.date)}
                      icon={<Ionicons name="calendar-outline" size={16} color={C.textSub} />}
                      readOnly
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                    <TossInput
                      label="예식 시간" required
                      placeholder="시간을 선택해주세요"
                      value={formatTime(eventData.ceremonyTime)}
                      icon={<Ionicons name="time-outline" size={16} color={C.textSub} />}
                      readOnly
                    />
                  </TouchableOpacity>
                </SectionCard>
              </View>

              {/* 장소 */}
              <SectionCard title="장소">
                <TouchableOpacity onPress={() => setShowAddressSearch(true)}>
                  <TossInput
                    label="예식장 주소"
                    placeholder="주소를 검색해주세요"
                    value={eventData.location}
                    icon={<Ionicons name="location-outline" size={16} color={C.textSub} />}
                    readOnly
                  />
                </TouchableOpacity>
                {!!eventData.location && (
                  <TossInput
                    placeholder="상세 주소 (예: 3층 그랜드볼룸)"
                    value={eventData.detailedAddress}
                    onChangeText={v => updateForm('detailedAddress', v)}
                  />
                )}
              </SectionCard>

              {/* 방명록 */}
              <SectionCard title="축하 메시지 (방명록)">
                <View style={s.guestbookRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.guestbookLabel}>방명록 기능 사용</Text>
                    <Text style={s.guestbookSub}>하객들이 축하 메시지를 남길 수 있어요</Text>
                  </View>
                  <Toggle active={eventData.allowMessages} onToggle={() => updateForm('allowMessages', !eventData.allowMessages)} />
                </View>
                <View style={s.infoPill}>
                  <Ionicons name="information-circle-outline" size={16} color={C.textSub} />
                  <Text style={s.infoPillText}>
                    {eventData.allowMessages
                      ? '축하 메시지 작성 시 스팸 방지를 위해 하객의 간단한 인증이 필요합니다.'
                      : '축하 메시지 기능을 사용하지 않습니다. 청첩장에서 방명록 섹션이 숨김 처리됩니다.'}
                  </Text>
                </View>
              </SectionCard>

              {/* 사진 업로드 */}
              <View
                ref={photosSectionRef}
                onLayout={e => { sectionPositions.current.photos = e.nativeEvent.layout.y; }}
              >
                <SectionCard title="사진 업로드" subtitle="가장 아름다운 순간을 공유해주세요">
                  {PHOTO_CATEGORIES.map(cat => {
                    const count = getCategoryImageCount(cat.key);
                    const images = getCategoryImages(cat.key);
                    return (
                      <View key={cat.key} style={s.photoCategory}>
                        <View style={s.photoCategoryHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                            <Text style={s.photoCategoryLabel}>{cat.label}</Text>
                            {cat.required && <Text style={s.required}>*</Text>}
                          </View>
                          <Text style={s.photoCount}>{count} / {cat.maxCount}장</Text>
                        </View>
                        <Text style={s.photoCategoryDesc}>{cat.desc}</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoScroll}>
                          <TouchableOpacity
                            style={s.photoAddBtn}
                            onPress={() => pickImagesForCategory(cat)}
                            disabled={count >= cat.maxCount || imageUploadState.isUploading}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="camera" size={18} color={C.textSub} />
                            <Text style={s.photoAddText}>추가</Text>
                          </TouchableOpacity>
                          {images.map((image) => (
                            <View key={image.id} style={s.photoThumb}>
                              <Image source={{ uri: image.uri || image.publicUrl }} style={s.photoThumbImg} />
                              <TouchableOpacity
                                style={s.photoRemoveBtn}
                                onPress={() => removeImage(image.id)}
                                disabled={imageUploadState.isUploading}
                              >
                                <Ionicons name="close" size={12} color="#fff" />
                              </TouchableOpacity>
                              {image.publicUrl && (
                                <View style={s.photoCheckBadge}>
                                  <Ionicons name="checkmark" size={10} color="#fff" />
                                </View>
                              )}
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })}
                </SectionCard>
              </View>

              {/* 인사말 */}
              <SectionCard title="인사말">
                <TossInput
                  placeholder="저희의 소중한 첫 걸음에 함께해주시는 모든 분들께 진심으로 감사드립니다."
                  value={eventData.customMessage}
                  onChangeText={v => updateForm('customMessage', v)}
                  multiline numberOfLines={5}
                />
                {!eventData.customMessage && (
                  <View style={s.infoNote}>
                    <Ionicons name="information-circle-outline" size={14} color={C.textSub} />
                    <Text style={s.infoNoteText}>인사말을 비워두시면 템플릿 기본 문구가 들어갑니다.</Text>
                  </View>
                )}
              </SectionCard>

              {/* 주차 안내 */}
              <SectionCard title="주차 안내">
                <TossInput
                  placeholder="예: 건물 지하 1층 주차장 이용 (2시간 무료)"
                  value={eventData.parkingInfo}
                  onChangeText={v => updateForm('parkingInfo', v)}
                  multiline numberOfLines={3}
                />
              </SectionCard>
            </View>
          )}

          {/* ===== STEP 2: 템플릿 ===== */}
          {step === 2 && (
            <View>
              <View style={{ marginBottom: 24, paddingHorizontal: 4 }}>
                <Text style={s.step2Title}>{'어떤 디자인이\n마음에 드시나요?'}</Text>
                <Text style={s.step2Sub}>원하는 템플릿을 선택하고 미리보세요</Text>
              </View>

              {TEMPLATES.map((tpl, tplIdx) => {
                const isSelected = eventData.selectedTemplate?.id === tpl.id;
                const isDisabled = tpl.disabled;
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    ref={tpl.id === 'modern-dark' ? modernDarkTemplateCardRef : null}
                    style={[s.tplCard, isSelected && s.tplCardSelected, isDisabled && { opacity: 0.5 }]}
                    onPress={() => !isDisabled && updateForm('selectedTemplate', tpl)}
                    activeOpacity={isDisabled ? 1 : 0.9}
                  >
                    <View style={s.tplImgWrap}>
                      <Image source={tpl.preview} style={s.tplImg} />
                      {isSelected && !isDisabled && (
                        <View style={s.tplCheckOverlay}>
                          <View style={s.tplCheckCircle}>
                            <Ionicons name="checkmark" size={16} color={C.primary} />
                          </View>
                        </View>
                      )}
                      {isDisabled && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>준비중</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.tplInfo}>
                      <Text style={s.tplName}>{tpl.name}</Text>
                      <Text style={s.tplDesc}>{tpl.description}</Text>
                      <View style={s.tplTags}>
                        {tpl.features?.map(tag => (
                          <View key={tag} style={s.tplTag}>
                            <Text style={s.tplTagText}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                      {(templateMusicMap[tpl.id] || (templatePetalMap[tpl.id] && templatePetalMap[tpl.id].id !== 'none') || (templateIntroMap[tpl.id] && templateIntroMap[tpl.id].id !== 'none') || templateFrameMap[tpl.id]) && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {templateMusicMap[tpl.id] && (
                            <View style={s.tplMusicBadge}>
                              <Ionicons name="musical-notes" size={11} color={C.primary} />
                              <Text style={s.tplMusicBadgeText} numberOfLines={1}>
                                {templateMusicMap[tpl.id].name}
                              </Text>
                            </View>
                          )}
                          {templatePetalMap[tpl.id] && templatePetalMap[tpl.id].id !== 'none' && (
                            <View style={[s.tplMusicBadge, { backgroundColor: '#fff0f6' }]}>
                              <Text style={{ fontSize: 11 }}>{PETAL_EFFECTS.find(p => p.id === templatePetalMap[tpl.id].id)?.emoji}</Text>
                              <Text style={[s.tplMusicBadgeText, { color: '#c0386b' }]} numberOfLines={1}>
                                {PETAL_EFFECTS.find(p => p.id === templatePetalMap[tpl.id].id)?.name}
                              </Text>
                            </View>
                          )}
                          {/* 웜 오렌지(vintage-app)는 자체 인트로라 외부 인트로 뱃지 숨김 */}
                          {tpl.id !== 'vintage-app' && templateIntroMap[tpl.id] && templateIntroMap[tpl.id].id !== 'none' && (
                            <View style={[s.tplMusicBadge, { backgroundColor: '#f0f4ff' }]}>
                              <Text style={{ fontSize: 11 }}>🎬</Text>
                              <Text style={[s.tplMusicBadgeText, { color: '#3a5bd9' }]} numberOfLines={1}>
                                {INTRO_LIST.find(i => i.id === templateIntroMap[tpl.id].id)?.title}
                              </Text>
                            </View>
                          )}
                          {templateFrameMap[tpl.id] && (
                            <View style={[s.tplMusicBadge, { backgroundColor: '#f4f1ff' }]}>
                              <Ionicons name="albums-outline" size={11} color="#6d55c9" />
                              <Text style={[s.tplMusicBadgeText, { color: '#6d55c9' }]} numberOfLines={1}>
                                {templateFrameMap[tpl.id].name || '사진 프레임 적용'}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      {!isDisabled && (
                        <TouchableOpacity
                          ref={tpl.id === 'modern-dark' ? modernDarkPreviewBtnRef : null}
                          style={s.previewBtn}
                          onPress={() => handleTemplatePreview(tpl)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="eye-outline" size={14} color="#fff" />
                          <Text style={s.previewBtnText}>청첩장 미리보기</Text>
                          <Ionicons name="chevron-forward" size={14} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ===== STEP 3: 완료 ===== */}
          {step === 3 && (
            <View style={s.completionWrap}>
              <Text style={{ fontSize: 60, marginBottom: 24 }}>🎉</Text>
              <Text style={s.completionTitle}>{'결혼식 청첩장이\n완성되었어요!'}</Text>
              <View style={s.completionPill}>
                <Text style={s.completionPillText}>잠시 후 청첩장 화면으로 이동할게요</Text>
              </View>
              <View style={s.spinner} />
            </View>
          )}
        </ScrollView>

        {/* ── 하단 버튼 ── */}
        {step < 3 && (
          <>
            {step === 1 && (
              <Animated.View
                style={[
                  s.testFillWrap,
                  {
                    bottom: insets.bottom + 78,
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
                  style={s.testFillBtn}
                  onPress={fillTestWeddingData}
                  activeOpacity={0.86}
                >
                  <Ionicons name="flash" size={14} color={C.primary} />
                  <Text style={s.testFillText}>테스트 입력</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
              {step === 2 && (
                <TouchableOpacity style={s.prevBtn} onPress={() => setStep(1)} activeOpacity={0.85}>
                  <Text style={s.prevBtnText}>이전</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                ref={nextBtnRef}
                style={[s.nextBtn, (isLoading || imageUploadState.isUploading) && { opacity: 0.6 }]}
                onPress={handleNext}
                disabled={isLoading || imageUploadState.isUploading}
                activeOpacity={0.88}
              >
                <Text style={s.nextBtnText}>
                  {isLoading ? '생성 중...'
                    : imageUploadState.isUploading ? '이미지 업로드 중...'
                    : step === 1 ? '다음' : '결혼식 청첩장 만들기'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ===== 모달들 ===== */}

        {/* Alert 모달 */}
        <Modal visible={alertInfo.visible} transparent animationType="fade">
          <TouchableOpacity style={s.modalDim} onPress={closeAlert} activeOpacity={1}>
            <TouchableOpacity style={s.alertBox} activeOpacity={1} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name="alert-circle" size={24} color={C.error} />
                <Text style={s.alertTitle}>{alertInfo.title}</Text>
              </View>
              <Text style={s.alertMessage}>{alertInfo.message}</Text>
              <TouchableOpacity style={s.alertBtn} onPress={closeAlert}>
                <Text style={s.alertBtnText}>확인</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* 날짜 선택 */}
        <DatePickerSheet
          visible={showDatePicker}
          selectedDate={eventData.date}
          onSelect={handleDateSelect}
          onClose={() => setShowDatePicker(false)}
        />

        {/* 시간 선택 */}
        <TimePickerSheet
          visible={showTimePicker}
          selectedTime={eventData.ceremonyTime}
          onSelect={handleTimeSelect}
          onClose={() => setShowTimePicker(false)}
        />

        {/* 주소 검색 */}
        <DaumPostcode
          visible={showAddressSearch}
          onComplete={handleAddressComplete}
          onClose={() => setShowAddressSearch(false)}
        />

        {/* 업로드 진행 */}
        <UploadProgressModal
          visible={imageUploadState.isUploading}
          currentIndex={imageUploadState.currentIndex}
          totalCount={imageUploadState.totalCount}
          onCancel={handleUploadCancel}
        />

        {/* 은행 선택 */}
        <BankPickerSheet
          visible={bankPicker.visible}
          onSelect={(bankName) => updateForm(bankPicker.field, bankName)}
          onClose={() => setBankPicker({ visible: false, field: '' })}
        />

        {/* 템플릿 미리보기 */}
        <Modal visible={showTemplatePreview} animationType="slide" presentationStyle="fullScreen">
          <View style={s.previewModal}>

            {/* 오른쪽 컨트롤 — X / 음악 / 꽃잎 세로 스택 */}
            <View style={[s.previewControls, { top: insets.top + 12 }]}>
              {/* 닫기 */}
              <TouchableOpacity
                ref={previewCloseBtnRef}
                style={s.previewCtrlBtn}
                onPress={handleClosePreview}
                activeOpacity={0.7}
                onLayout={() => {
                  previewCloseBtnRef.current?.measureInWindow((x, y, w, h) => {
                    if (w > 0 && h > 0) registerTarget('previewCloseBtn', { x, y, width: w, height: h });
                  });
                }}
              >
                <Ionicons name="close" size={19} color="#fff" />
              </TouchableOpacity>

              {/* 음악 — 러브 티켓은 탑승 완료 후에만 노출 */}
              {(previewTemplate?.id !== 'ticket-flight' || ticketFlightBoarded) && (
                <TouchableOpacity
                  ref={previewMusicBtnRef}
                  style={[s.previewCtrlBtn, isPlaying && s.previewCtrlBtnMusic]}
                  onPress={() => setShowMusicModal(true)}
                  activeOpacity={0.8}
                  onLayout={() => {
                    previewMusicBtnRef.current?.measureInWindow((x, y, w, h) => {
                      if (w > 0 && h > 0) registerTarget('previewMusicBtn', { x, y, width: w, height: h });
                    });
                  }}
                >
                  <Ionicons name={isPlaying ? 'musical-notes' : 'musical-note'} size={17} color="#fff" />
                </TouchableOpacity>
              )}

              {/* 꽃잎 — 러브 티켓은 탑승 완료 후에만 노출 */}
              {(previewTemplate?.id !== 'ticket-flight' || ticketFlightBoarded) && (
                <TouchableOpacity
                  ref={previewPetalBtnRef}
                  style={[s.previewCtrlBtn, currentPreviewPetalId !== 'none' && s.previewCtrlBtnPetal]}
                  onPress={() => setShowPetalModal(true)}
                  activeOpacity={0.8}
                  onLayout={() => {
                    previewPetalBtnRef.current?.measureInWindow((x, y, w, h) => {
                      if (w > 0 && h > 0) registerTarget('previewPetalBtn', { x, y, width: w, height: h });
                    });
                  }}
                >
                  <Text style={{ fontSize: 16, lineHeight: 20 }}>
                    {currentPreviewPetalId !== 'none' ? PETAL_EFFECTS.find(p => p.id === currentPreviewPetalId)?.emoji : '✨'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* 프레임 */}
              {(previewTemplate?.id !== 'ticket-flight' || ticketFlightBoarded) && (
                <TouchableOpacity
                  style={s.previewCtrlBtn}
                  onPress={() => {
                    prefetchFrameImages();
                    setShowFrameModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="albums-outline" size={17} color="#fff" />
                </TouchableOpacity>
              )}

              {/* 인트로 — 웜 오렌지·러브 티켓·시네마 로맨스는 자체 인트로가 있어 별도 선택 불가 */}
              {previewTemplate?.id !== 'vintage-app' && previewTemplate?.id !== 'ticket-flight' && previewTemplate?.id !== 'cinema-romance' && (
                <TouchableOpacity
                  ref={previewIntroBtnRef}
                  style={[s.previewCtrlBtn, currentPreviewIntroId !== 'none' && s.previewCtrlBtnIntro]}
                  onPress={() => setShowIntroModal(true)}
                  activeOpacity={0.8}
                  onLayout={() => {
                    previewIntroBtnRef.current?.measureInWindow((x, y, w, h) => {
                      if (w > 0 && h > 0) registerTarget('previewIntroBtn', { x, y, width: w, height: h });
                    });
                  }}
                >
                  <Text style={{ fontSize: 16, lineHeight: 20 }}>🎬</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flex: 1 }}>
              {previewTemplate && (
                <WeddingTemplatePreview
                  template={previewTemplate}
                  eventData={{
                    ...eventData,
                    groomBank: eventData.groomBankName,
                    groomAccount: eventData.groomAccountNumber,
                    brideBank: eventData.brideBankName,
                    brideAccount: eventData.brideAccountNumber,
                    additional_info: {
                      groom_account_number: eventData.groomAccountNumber,
                      bride_account_number: eventData.brideAccountNumber,
                      groom_father_account_number: eventData.groomFatherAccountNumber,
                      groom_mother_account_number: eventData.groomMotherAccountNumber,
                      bride_father_account_number: eventData.brideFatherAccountNumber,
                      bride_mother_account_number: eventData.brideMotherAccountNumber,
                      groom_bank_name: eventData.groomBankName,
                      bride_bank_name: eventData.brideBankName,
                      groom_father_bank_name: eventData.groomFatherBankName,
                      groom_mother_bank_name: eventData.groomMotherBankName,
                      bride_father_bank_name: eventData.brideFatherBankName,
                      bride_mother_bank_name: eventData.brideMotherBankName,
                    },
                  }}
                  userImages={eventData.images}
                  categorizedImages={getCategorizedImages()}
                  allowMessages={eventData.allowMessages}
                  messageSettings={eventData.messageSettings}
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlayPause}
                  playbackProgress={playbackProgress}
                  frameAdjusting={isFrameAdjusting}
                  onPhotoFrameAdjust={updateFrameAdjustment}
                  selectedPhotoFrame={(() => {
                    const frame = PHOTO_FRAMES.find(item => item.id === currentPreviewFrameId);
                    return frame?.source ? {
                      ...frame,
                      scale: currentPreviewFrameScale,
                      offsetX: currentPreviewFrameOffsetX,
                      offsetY: currentPreviewFrameOffsetY,
                    } : null;
                  })()}
                />
              )}
            </View>

            {/* 인트로 오버레이 */}
            {showIntroOverlay && INTRO_OVERLAYS[currentPreviewIntroId] && (() => {
              const IntroComp = INTRO_OVERLAYS[currentPreviewIntroId];
              return (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} pointerEvents={currentPreviewTapToOpen ? 'box-none' : 'none'}>
                  <IntroComp
                    containerW={width}
                    containerH={Dimensions.get('window').height}
                    tapToOpen={currentPreviewTapToOpen}
                    coupleNames={eventData.groomName && eventData.brideName ? `${eventData.groomName} · ${eventData.brideName}` : undefined}
                    onEnd={() => setShowIntroOverlay(false)}
                  />
                </View>
              );
            })()}

            {/* 전역 꽃잎 효과 — 인트로 위에 렌더 (zIndex > 인트로의 9999) */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }} pointerEvents="none">
              <GlobalFallingEffect
                key={`${currentPreviewPetalId}-${currentPreviewPetalSpeed}-${currentPreviewPetalQty}-${currentPreviewPetalColor}`}
                type={currentPreviewPetalId}
                speed={currentPreviewPetalSpeed}
                qty={currentPreviewPetalQty}
                color={currentPreviewPetalColor}
              />
            </View>

            {isFrameAdjusting && currentPreviewFrameId !== 'none' && (
              <View style={[s.frameAdjustDock, { paddingBottom: insets.bottom + 12 }]}>
                <View style={s.frameAdjustDockHeader}>
                  <View>
                    <Text style={s.frameAdjustDockEyebrow}>Frame Control</Text>
                    <Text style={s.frameAdjustDockTitle}>프레임 위치 조정</Text>
                  </View>
                  <TouchableOpacity style={s.frameDoneBtn} onPress={() => setIsFrameAdjusting(false)} activeOpacity={0.75}>
                    <Text style={s.frameDoneText}>완료</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.frameAdjustDockBody}>
                  <View style={s.frameGestureGuide}>
                    <View style={s.frameGestureIcon}>
                      <Ionicons name="hand-left-outline" size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.frameGestureTitle}>프레임을 직접 움직이세요</Text>
                      <Text style={s.frameGestureText}>드래그로 위치 이동 · 두 손가락으로 크기 조절</Text>
                    </View>
                    <Text style={s.frameAdjustValue}>{Math.round(currentPreviewFrameScale * 100)}%</Text>
                  </View>
                  <TouchableOpacity style={s.frameResetBtn} onPress={resetFrameAdjustment} activeOpacity={0.75}>
                    <Text style={s.frameResetText}>초기화</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 튜토리얼 오버레이 — 미리보기 모달 내부 */}
            <TutorialOverlay scope="previewModal" />
          </View>

          {/* 음악 선택 모달 */}
          <Modal visible={showMusicModal} transparent animationType="slide" onRequestClose={() => setShowMusicModal(false)}>
            <View style={s.mOverlay} onStartShouldSetResponder={() => true}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setShowMusicModal(false); if (previewSoundRef.current) { previewSoundRef.current.stopAsync().catch(()=>{}); previewSoundRef.current = null; setPreviewingId(null); } }} />
              <View style={s.mSheet}>
                <View style={s.mHandle} />
                <View style={s.mHeaderRow}>
                  <Text style={s.mTitle}>배경음악</Text>
                  <TouchableOpacity style={s.mCloseBtn} onPress={() => { setShowMusicModal(false); if (previewSoundRef.current) { previewSoundRef.current.stopAsync().catch(()=>{}); previewSoundRef.current = null; setPreviewingId(null); } }}>
                    <Ionicons name="close" size={16} color="rgba(60,60,67,0.6)" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                  {MUSIC_TRACKS.map((item, index) => {
                    const isSelected = currentPreviewMusicId === item.id;
                    const isPreviewing = previewingId === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        ref={index === 1 ? firstMusicItemRef : null}
                        style={s.mRow}
                        onPress={() => handleSelectMusic(item.id)}
                        activeOpacity={0.5}
                        onLayout={index === 1 ? () => {
                          firstMusicItemRef.current?.measureInWindow((x, y, w, h) => {
                            if (w > 0 && h > 0) registerTarget('firstMusicItem', { x, y, width: w, height: h });
                          });
                        } : undefined}
                      >
                        <TouchableOpacity
                          style={[s.mSpeaker, isPreviewing && s.mSpeakerActive]}
                          onPress={(e) => { e.stopPropagation(); item.file ? previewTrack(item.id) : handleSelectMusic(item.id); }}
                          activeOpacity={0.6}
                        >
                          <Ionicons
                            name={item.file ? (isPreviewing ? 'volume-high' : 'volume-medium-outline') : 'volume-mute-outline'}
                            size={19}
                            color={isPreviewing ? '#fff' : 'rgba(0,0,0,0.48)'}
                          />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.mRowName, isSelected && s.mRowNameSelected]}>{item.name}</Text>
                          {item.desc && <Text style={s.mRowDesc}>{item.desc}</Text>}
                        </View>
                        {isSelected && <Ionicons name="checkmark" size={18} color="#0071e3" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              {/* 튜토리얼 오버레이 — 모달 전체 화면 기준 (뱃지가 최상단에 표시되도록) */}
              <TutorialOverlay scope="musicModal" />
            </View>
          </Modal>

          {/* 꽃잎 선택 모달 */}
          <Modal visible={showPetalModal} transparent animationType="fade" onRequestClose={() => setShowPetalModal(false)}>
            <View style={s.mOverlay} onStartShouldSetResponder={() => true}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowPetalModal(false)} />
              <View style={s.mSheet}>
                <View style={s.mHandle} />
                <View style={s.mHeaderRow}>
                  <Text style={s.mTitle}>꽃잎 효과</Text>
                  <TouchableOpacity style={s.mCloseBtn} onPress={() => setShowPetalModal(false)}>
                    <Ionicons name="close" size={16} color="rgba(60,60,67,0.6)" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                  {PETAL_EFFECTS.map((item, petalIdx) => {
                    const isSelected = currentPreviewPetalId === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        ref={petalIdx === 1 ? firstPetalItemRef : null}
                        style={s.mRow}
                        onPress={() => handleSelectPetal(item.id)}
                        activeOpacity={0.5}
                        onLayout={petalIdx === 1 ? () => {
                          firstPetalItemRef.current?.measureInWindow((x, y, w, h) => {
                            if (w > 0 && h > 0) registerTarget('firstPetalItem', { x, y, width: w, height: h });
                          });
                        } : undefined}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[s.mRowName, isSelected && s.mRowNameSelected]}>{item.name}</Text>
                          <Text style={s.mRowDesc}>{item.desc}</Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark" size={18} color="#0071e3" />}
                      </TouchableOpacity>
                    );
                  })}

                  {currentPreviewPetalId !== 'none' && (
                    <View style={s.pControls}>
                      {currentPreviewPetalId === 'custom_petal' && (
                        <View style={s.pControlRow}>
                          <Text style={s.pControlLabel}>색상</Text>
                          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            {CUSTOM_PETAL_COLOR_OPTIONS.map(opt => {
                              const active = currentPreviewPetalColor === opt.id;
                              return (
                                <TouchableOpacity
                                  key={opt.id}
                                  onPress={() => setCurrentPreviewPetalColor(opt.id)}
                                  style={{ alignItems: 'center', gap: 4 }}
                                  activeOpacity={0.7}
                                >
                                  {opt.colors ? (
                                    <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: active ? 2 : 1.5, borderColor: active ? '#0071e3' : 'rgba(0,0,0,0.12)', flexDirection: 'row', flexWrap: 'wrap' }}>
                                      {opt.colors.map((c, ci) => (
                                        <View key={ci} style={{ width: '50%', height: '50%', backgroundColor: c }} />
                                      ))}
                                    </View>
                                  ) : (
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: opt.color, borderWidth: active ? 2 : 1.5, borderColor: active ? '#0071e3' : 'rgba(0,0,0,0.12)' }} />
                                  )}
                                  <Text style={{ fontSize: 10, color: active ? '#0071e3' : 'rgba(0,0,0,0.5)', fontWeight: active ? '600' : '400' }}>{opt.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}
                      <View style={s.pControlRow}>
                        <Text style={s.pControlLabel}>속도</Text>
                        <View style={s.pSegment}>
                          {PETAL_SPEEDS.map(sp => {
                            const active = currentPreviewPetalSpeed === sp.id;
                            return (
                              <TouchableOpacity key={sp.id} style={[s.pSegBtn, active && s.pSegBtnActive]} onPress={() => setCurrentPreviewPetalSpeed(sp.id)}>
                                <Text style={[s.pSegBtnText, active && s.pSegBtnTextActive]}>{sp.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                      <View style={s.pControlRow}>
                        <Text style={s.pControlLabel}>수량</Text>
                        <View style={s.pSegment}>
                          {PETAL_QTYS.map(qt => {
                            const active = currentPreviewPetalQty === qt.id;
                            return (
                              <TouchableOpacity key={qt.id} style={[s.pSegBtn, active && s.pSegBtnActive]} onPress={() => setCurrentPreviewPetalQty(qt.id)}>
                                <Text style={[s.pSegBtnText, active && s.pSegBtnTextActive]}>{qt.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
                <TouchableOpacity style={s.pApplyBtn} onPress={handleApplyPetalSettings}>
                  <Text style={s.pApplyBtnText}>적용하기</Text>
                </TouchableOpacity>
              </View>
              {/* 튜토리얼 오버레이 — 모달 전체 화면 기준 */}
              <TutorialOverlay scope="petalModal" />
            </View>
          </Modal>

          {/* 프레임 선택 모달 */}
          <Modal visible={showFrameModal} transparent animationType="slide" onRequestClose={() => setShowFrameModal(false)}>
            <View style={s.frameOverlay} onStartShouldSetResponder={() => true}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowFrameModal(false)} />
              <View style={[s.framePickerBar, { paddingBottom: insets.bottom + 14 }]}>
                <View style={s.framePickerHeader}>
                  <View>
                    <Text style={s.framePickerEyebrow}>Photo Frame</Text>
                    <Text style={s.framePickerTitle}>사진 프레임</Text>
                  </View>
                  <TouchableOpacity style={s.frameCloseBtn} onPress={() => setShowFrameModal(false)}>
                    <Ionicons name="close" size={17} color="rgba(255,255,255,0.82)" />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.frameList}
                >
                  {PHOTO_FRAMES.map((frame) => {
                    const isSelected = currentPreviewFrameId === frame.id;
                    return (
                      <TouchableOpacity
                        key={frame.id}
                        style={s.frameThumb}
                        onPress={() => handleSelectFrame(frame.id)}
                        activeOpacity={0.78}
                      >
                        <View style={[s.frameThumbImageWrap, isSelected && s.frameThumbImageWrapSelected]}>
                          {frame.source ? (
                            <Image
                              source={frame.thumb || frame.source}
                              style={s.frameThumbImage}
                              resizeMode="cover"
                              onLoad={() => markFrameThumbLoaded(frame.id)}
                              onError={() => markFrameThumbLoaded(frame.id)}
                            />
                          ) : (
                            <View style={s.frameNoneThumb}>
                              <Ionicons name="remove-circle-outline" size={24} color="rgba(255,255,255,0.72)" />
                            </View>
                          )}
                        </View>
                        <Text style={[s.frameThumbText, isSelected && s.frameThumbTextSelected]} numberOfLines={1}>
                          {frame.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {currentPreviewFrameId !== 'none' && (
                  <TouchableOpacity style={s.frameAdjustEntryBtn} onPress={startFrameAdjustment} activeOpacity={0.82}>
                    <Ionicons name="move-outline" size={17} color="#050505" />
                    <Text style={s.frameAdjustEntryText}>크기 · 위치 조정</Text>
                  </TouchableOpacity>
                )}
                {!frameThumbsReady && (
                  <View style={s.frameLoadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={s.frameLoadingText}>프레임을 불러오는 중</Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>

          <View style={s.framePreloadLayer} pointerEvents="none">
            {PHOTO_FRAMES.filter(frame => frame.thumb).map(frame => (
              <Image
                key={frame.id}
                source={frame.thumb}
                style={s.framePreloadImage}
                onLoad={() => markFrameThumbLoaded(frame.id)}
                onError={() => markFrameThumbLoaded(frame.id)}
              />
            ))}
          </View>

          {/* 인트로 선택 모달 */}
          <WeddingIntroSelectModal
            visible={showIntroModal}
            onClose={onIntroModalClose}
            selectedId={currentPreviewIntroId !== 'none' ? { id: currentPreviewIntroId, tapToOpen: currentPreviewTapToOpen } : null}
            onSelect={handleSelectIntro}
          />
        </Modal>
      </View>
  );
}

// ======================================================================
// 스타일
// ======================================================================
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // 헤더
  header: {
    backgroundColor: C.white, paddingHorizontal: 20, paddingBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 16 },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  progressTrack: { height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  stepText: { fontSize: 12, fontWeight: '700', color: C.primary, textAlign: 'right', marginTop: 6 },

  // 스크롤
  scrollContent: { padding: 16 },

  // 섹션 카드
  sectionCard: {
    backgroundColor: C.white, borderRadius: 20, padding: 20, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  sectionSubtitle: { fontSize: 13, color: C.textSub, marginTop: 4, fontWeight: '500' },
  required: { color: C.error, fontWeight: '700' },

  // 인풋
  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#4E5968' },
  inputBox: { position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12 },
  inputIcon: { position: 'absolute', left: 12, top: 13, zIndex: 1 },
  input: {
    flex: 1, backgroundColor: 'transparent', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: '500', color: C.text,
  },
  phoneInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 12,
  },
  phonePrefix: {
    paddingLeft: 16, paddingVertical: 14,
  },
  phonePrefixText: {
    fontSize: 15, fontWeight: '700', color: C.text,
  },
  phoneSeparator: {
    width: 1, height: 18, backgroundColor: C.textTertiary, marginHorizontal: 12,
  },
  phoneSuffixInput: {
    flex: 1, fontSize: 15, fontWeight: '500', color: C.text,
    paddingVertical: 14, paddingRight: 16,
  },

  // 토글
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#D1D6DB', justifyContent: 'center', padding: 2 },
  toggleOn: { backgroundColor: C.primary },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: C.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  toggleKnobOn: { alignSelf: 'flex-end' },

  // 부모 정보
  parentBox: {
    backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.bg,
  },
  parentTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  accountSection: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8 },
  accountLabel: { fontSize: 12, fontWeight: '600', color: C.textSub, marginBottom: 10 },

  // 계좌 옵셔널
  optionalLabel: { fontSize: 14, fontWeight: '600', color: '#4E5968', marginTop: 16, marginBottom: 10 },
  optionalNote: { fontWeight: '400', fontSize: 12, color: C.textSub },

  // 방명록
  guestbookRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, marginBottom: 12 },
  guestbookLabel: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  guestbookSub: { fontSize: 12, color: C.textSub },
  infoPill: { backgroundColor: C.bg, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoPillText: { fontSize: 12, color: '#4E5968', lineHeight: 18, flex: 1 },

  // 사진
  photoCategory: { marginBottom: 24 },
  photoCategoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  photoCategoryLabel: { fontSize: 14, fontWeight: '700', color: '#4E5968' },
  photoCount: { fontSize: 12, fontWeight: '600', color: C.textSub },
  photoCategoryDesc: { fontSize: 11, color: C.textSub, marginBottom: 10 },
  photoScroll: { flexDirection: 'row' },
  photoAddBtn: {
    width: 80, height: 80, backgroundColor: C.bg, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 4, marginRight: 10,
    borderWidth: 1, borderColor: '#D1D6DB', borderStyle: 'dashed',
  },
  photoAddText: { fontSize: 10, fontWeight: '600', color: C.textSub },
  photoThumb: { width: 80, height: 80, borderRadius: 14, overflow: 'hidden', marginRight: 10, position: 'relative' },
  photoThumbImg: { width: '100%', height: '100%' },
  photoRemoveBtn: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  photoCheckBadge: {
    position: 'absolute', bottom: 4, right: 4, width: 16, height: 16,
    backgroundColor: C.success, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },

  // 인포 노트
  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  infoNoteText: { fontSize: 12, color: C.textSub },

  // STEP 2 템플릿
  step2Title: { fontSize: 24, fontWeight: '700', color: C.text, lineHeight: 32, marginBottom: 6 },
  step2Sub: { fontSize: 15, color: C.textSub, fontWeight: '500' },
  tplCard: {
    backgroundColor: C.white, borderRadius: 20, padding: 16, flexDirection: 'row', gap: 16,
    marginBottom: 14, borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  tplCardSelected: { borderColor: C.primary },
  tplImgWrap: { width: 80, height: 112, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f3f4f6', position: 'relative' },
  tplImg: { width: '100%', height: '100%', opacity: 0.9 },
  tplCheckOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(49,130,246,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  tplCheckCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  tplInfo: { flex: 1, justifyContent: 'center' },
  tplName: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
  tplDesc: { fontSize: 13, color: C.textSub, marginBottom: 10 },
  tplTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tplTag: { backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tplTagText: { fontSize: 10, fontWeight: '700', color: '#4E5968' },
  tplMusicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  tplMusicBadgeText: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '600',
    maxWidth: 150,
  },
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, alignSelf: 'stretch', justifyContent: 'center',
  },
  previewBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // 미리보기 오른쪽 컨트롤 스택
  previewControls: {
    position: 'absolute', right: 16, zIndex: 10,
    alignItems: 'center', gap: 8,
  },
  previewCtrlBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewCtrlBtnMusic: { backgroundColor: C.primary },
  previewCtrlBtnPetal: { backgroundColor: 'rgba(192,56,107,0.85)' },
  previewCtrlBtnIntro: { backgroundColor: 'rgba(212,175,55,0.85)' },

  // ── 바텀 시트 모달 — Apple Design System ──
  mOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  mSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
    paddingHorizontal: 20, paddingBottom: 42,
  },
  // 핸들 — Apple 표준 (#d2d2d7, 36×5)
  mHandle: { width: 36, height: 5, backgroundColor: '#d2d2d7', borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 20 },
  // 헤더
  mHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.12)',
    marginBottom: 0,
  },
  // "SF Pro Display" 스타일 — weight 600, tight letter-spacing
  mTitle: { fontSize: 20, fontWeight: '600', color: '#1d1d1f', letterSpacing: -0.26 },
  // 닫기 버튼 — Apple Media Control 스타일
  mCloseBtn: {
    width: 30, height: 30, borderRadius: 999,
    backgroundColor: 'rgba(210,210,215,0.64)',
    alignItems: 'center', justifyContent: 'center',
  },
  frameOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  framePickerBar: {
    backgroundColor: '#050505',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  framePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  framePickerEyebrow: { color: 'rgba(255,255,255,0.46)', fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  framePickerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 2 },
  frameCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameList: { gap: 12, paddingRight: 8 },
  frameThumb: { width: 88, alignItems: 'center', gap: 8, paddingBottom: 2 },
  frameThumbImageWrap: {
    width: 78,
    height: 112,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  frameThumbImageWrapSelected: { borderColor: '#fff', borderWidth: 2 },
  frameThumbImage: { width: '100%', height: '100%' },
  frameNoneThumb: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#151515' },
  frameThumbText: { color: 'rgba(255,255,255,0.58)', fontSize: 11, fontWeight: '600' },
  frameThumbTextSelected: { color: '#fff' },
  frameLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,5,5,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  frameLoadingText: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '700' },
  framePreloadLayer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    left: -10,
    bottom: -10,
  },
  framePreloadImage: { width: 1, height: 1 },
  frameAdjustEntryBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  frameAdjustEntryText: { color: '#050505', fontSize: 14, fontWeight: '800' },
  frameAdjustDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    zIndex: 99998,
    backgroundColor: 'rgba(5,5,5,0.94)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  frameAdjustDockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  frameAdjustDockEyebrow: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  frameAdjustDockTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 2 },
  frameDoneBtn: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameDoneText: { color: '#050505', fontSize: 13, fontWeight: '900' },
  frameAdjustDockBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  frameGestureGuide: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  frameGestureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameGestureTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  frameGestureText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  frameAdjustValue: { minWidth: 44, textAlign: 'center', color: '#fff', fontSize: 13, fontWeight: '800' },
  frameResetBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameResetText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },

  // 리스트 행 — 하단 hairline 구분선
  mRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)',
  },

  // 스피커 원형 버튼 — Apple Media Control (#rgba(210,210,215,0.64))
  mSpeaker: {
    width: 44, height: 44, borderRadius: 999,
    backgroundColor: 'rgba(210,210,215,0.64)',
    alignItems: 'center', justifyContent: 'center',
  },
  // 재생 중 상태 — Apple Blue fill
  mSpeakerActive: { backgroundColor: '#0071e3' },

  // 트랙명 — SF Pro Text, 17px, -0.374 tracking
  mRowName: { fontSize: 17, fontWeight: '400', color: '#1d1d1f', letterSpacing: -0.374, marginBottom: 2 },
  // 선택 시 Apple Blue, semibold
  mRowNameSelected: { color: '#0071e3', fontWeight: '600' },
  // 설명 — caption, rgba(0,0,0,0.48)
  mRowDesc: { fontSize: 14, color: 'rgba(0,0,0,0.48)', letterSpacing: -0.224 },

  // 꽃잎 속도/수량 — #f5f5f7 카드 + iOS 세그먼트 컨트롤
  pControls: {
    backgroundColor: '#f5f5f7', borderRadius: 12,
    padding: 14, gap: 14, marginTop: 8, marginBottom: 16,
  },
  pControlRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pControlLabel: { fontSize: 14, fontWeight: '600', color: '#1d1d1f', width: 28, letterSpacing: -0.224 },
  // iOS 세그먼트 컨트롤 트랙
  pSegment: {
    flex: 1, flexDirection: 'row',
    backgroundColor: 'rgba(120,120,128,0.16)',
    borderRadius: 9, padding: 2,
  },
  pSegBtn: { flex: 1, paddingVertical: 8, borderRadius: 7, alignItems: 'center' },
  // 선택된 세그먼트 — 흰 배경 + 미세 그림자
  pSegBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2,
  },
  pSegBtnText: { fontSize: 14, fontWeight: '400', color: 'rgba(0,0,0,0.48)', letterSpacing: -0.224 },
  pSegBtnTextActive: { color: '#1d1d1f', fontWeight: '600' },

  // 적용 버튼 — Apple Blue, 8px radius, no heavy shadow
  pApplyBtn: {
    backgroundColor: '#0071e3', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8,
  },
  pApplyBtnText: { fontSize: 17, fontWeight: '400', color: '#fff', letterSpacing: -0.374 },

  // STEP 3 완료
  completionWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  completionTitle: { fontSize: 24, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 16, lineHeight: 32 },
  completionPill: {
    backgroundColor: C.white, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20,
    borderWidth: 1, borderColor: C.bg,
  },
  completionPillText: { color: C.textSub, fontWeight: '500', textAlign: 'center' },
  spinner: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 4,
    borderColor: C.bg, borderTopColor: C.primary, marginTop: 48,
  },

  // 하단 버튼
  footer: {
    backgroundColor: C.white, paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', gap: 10,
    borderTopWidth: 1, borderTopColor: C.bg,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 4,
  },
  testFillWrap: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
  },
  testFillBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#D6E8FF',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  testFillText: { fontSize: 12, fontWeight: '800', color: C.primary },
  prevBtn: { flex: 1, backgroundColor: C.bg, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  prevBtnText: { fontSize: 17, fontWeight: '700', color: '#4E5968' },
  nextBtn: {
    flex: 3, backgroundColor: C.primary, paddingVertical: 18, borderRadius: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  nextBtnText: { fontSize: 17, fontWeight: '700', color: C.white },

  // 모달 공통
  modalDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheetDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetDimTouch: { flex: 1 },

  // Alert
  alertBox: { backgroundColor: C.white, width: '100%', maxWidth: 360, borderRadius: 20, padding: 24 },
  alertTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  alertMessage: { fontSize: 15, color: '#4E5968', fontWeight: '500', marginBottom: 24 },
  alertBtn: { backgroundColor: C.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  alertBtnText: { fontSize: 16, fontWeight: '700', color: C.white },

  // 바텀 시트
  bottomSheet: {
    backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 12,
  },
  sheetHandle: { alignItems: 'center', marginBottom: 20 },
  sheetHandleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E8EB' },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  sheetCloseBtn: { padding: 6, backgroundColor: C.bg, borderRadius: 999 },

  // 달력
  calMonthText: { fontSize: 18, fontWeight: '700', color: C.text },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#9ca3af', marginBottom: 8 },
  calDay: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 6 },
  calDayActive: { backgroundColor: C.primary, borderRadius: 999 },
  calDayText: { fontSize: 15, fontWeight: '600', color: C.text },
  calDayTextActive: { color: C.white },

  // 은행 선택
  bankSearchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  bankSearchInput: {
    flex: 1, fontSize: 15, fontWeight: '500', color: C.text, padding: 0,
  },
  bankGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 20, gap: 8,
  },
  bankItem: {
    width: '30.5%', alignItems: 'center', paddingVertical: 14,
    backgroundColor: '#F5F6F8', borderRadius: 14,
  },
  bankIcon: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  bankLogoImg: {
    width: 40, height: 40,
  },
  bankIconText: {
    fontSize: 14, fontWeight: '800',
  },
  bankName: {
    fontSize: 12, fontWeight: '600', color: C.text, textAlign: 'center',
  },
  bankAccountCard: {
    backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, marginBottom: 10,
  },
  bankFieldLabel: {
    fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8,
  },
  bankBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
    backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E5E8EB', marginBottom: 10,
  },
  bankBadgeLogo: {
    width: 22, height: 22,
  },
  bankBadgeText: {
    fontSize: 13, fontWeight: '700', color: C.text,
  },
  bankBadgeEmpty: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
    backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: C.primary, borderStyle: 'dashed', marginBottom: 10,
  },
  bankBadgeEmptyText: {
    fontSize: 13, fontWeight: '600', color: C.primary,
  },

  // 시간 선택
  timeCancel: { fontSize: 16, fontWeight: '600', color: C.textSub },
  timeConfirm: { fontSize: 16, fontWeight: '700', color: C.primary },
  ampmRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20,
  },
  ampmBtn: {
    paddingVertical: 10, paddingHorizontal: 28, borderRadius: 12,
    backgroundColor: C.bg,
  },
  ampmBtnActive: { backgroundColor: C.primary },
  ampmBtnText: { fontSize: 16, fontWeight: '600', color: C.textSub },
  ampmBtnTextActive: { color: C.white },
  timePickerRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  timePickerSection: { alignItems: 'center', flex: 1 },
  timePickerLabel: { fontSize: 14, fontWeight: '700', color: C.textSub, marginBottom: 12 },
  timePickerList: { height: 200 },
  timePickerItem: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center' },
  timePickerItemActive: { backgroundColor: C.bg },
  timePickerItemText: { fontSize: 18, fontWeight: '600', color: C.text },
  timePickerItemTextActive: { color: C.primary, fontWeight: '700' },

  // 업로드
  uploadBox: { backgroundColor: C.white, width: '90%', maxWidth: 320, borderRadius: 20, padding: 24, alignItems: 'center' },
  uploadIconWrap: {
    width: 64, height: 64, backgroundColor: '#eff6ff', borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
  uploadSub: { fontSize: 13, color: C.textSub, marginBottom: 20 },
  uploadTrack: { width: '100%', height: 8, backgroundColor: C.bg, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  uploadFill: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },
  uploadPercent: { fontSize: 12, fontWeight: '700', color: C.primary, alignSelf: 'flex-end' },
  uploadCancelBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24 },
  uploadCancelText: { fontSize: 14, fontWeight: '600', color: C.textSub },

  // 템플릿 미리보기
  previewModal: { flex: 1, backgroundColor: '#191F28' },
  previewCloseBg: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
});
