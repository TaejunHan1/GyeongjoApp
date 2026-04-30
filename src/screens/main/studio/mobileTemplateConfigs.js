// src/screens/main/studio/mobileTemplateConfigs.js
// 종이 청첩장 템플릿 설정
// - preview: 샘플 정보·사진 다 박힌 완성 미리보기 (Studio 탭 카드용)
// - blank:   빈 프레임만 있는 실제 사용 템플릿 (사용자가 사진·텍스트 넣을 때)
// - category: floral / minimal / modern / vintage / korean
//
// 폴더 구조: assets/studio/templates/{category}/{template-id}/preview.png + blank.png

export const TEMPLATE_CATEGORIES = [
  { id: 'floral', label: '꽃·풀', icon: 'flower-outline' },
  { id: 'minimal', label: '미니멀', icon: 'remove-outline' },
  { id: 'modern', label: '모던', icon: 'square-outline' },
  { id: 'vintage', label: '빈티지', icon: 'time-outline' },
  { id: 'korean', label: '한국 전통', icon: 'leaf-outline' },
];

// text 좌표/크기는 percent + pt (1024×1400 base 기준)
// y: 위에서부터 % (0~100)
// size: pt 단위 (1024 base 기준 → 미리보기 width로 비율 스케일)
// names: 신랑 ♡ 신부 한 줄
// date:  날짜·시간 한 줄
// venue: 예식장 한 줄
export const MOBILE_TEMPLATES = [
  // ─── floral 카테고리 ───
  {
    id: 'floral-classic',
    name: 'Classic',
    subtitle: '클래식 아치형',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/classic/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/classic/blank.png'),
    // 아치 안에는 사진만, 이름·날짜·장소는 아치 밖(아래)
    photo: { shape: 'rectangle', x: 50, y: 38, w: 52, h: 54 },
    text: {
      names: { y: 70, size: 14, color: '#3A2E22', hideConnector: true },
      date: { y: 78, size: 9, color: '#6B5B44' },
      venue: { y: 85, size: 9, color: '#6B5B44' },
    },
  },
  {
    id: 'floral-wreath',
    name: 'Wreath',
    subtitle: '원형 화환',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/wreath/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/wreath/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 34, w: 36, h: 36 },
    text: {
      names: { y: 60, size: 13, color: '#3A2E22', hideConnector: true },
      date: { y: 71, size: 9, color: '#6B5B44' },
      venue: { y: 79, size: 9, color: '#6B5B44' },
    },
  },
  {
    id: 'floral-minimal-line',
    name: 'Minimal Line',
    subtitle: '미니멀 라인',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/minimal-line/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/minimal-line/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 40, w: 56, h: 48 },
    text: {
      names: { y: 72, size: 13, color: '#3A2E22', hideConnector: true },
      date: { y: 80, size: 9, color: '#6B5B44' },
      venue: { y: 86, size: 9, color: '#6B5B44' },
    },
  },
  {
    id: 'floral-botanical',
    name: 'Botanical',
    subtitle: '보태니컬 풍성',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/botanical/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/botanical/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 48, w: 44, h: 38 },
    text: {
      names: { y: 73, size: 13, color: '#3A2E22', hideConnector: true },
      date: { y: 81, size: 9, color: '#6B5B44' },
      venue: { y: 87, size: 9, color: '#6B5B44' },
    },
  },
  {
    id: 'floral-vintage',
    name: 'Vintage',
    subtitle: '빈티지 화환',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/vintage/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/vintage/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 44, w: 40, h: 35 },
    text: {
      names: { y: 68, size: 13, color: '#3A2E22', hideConnector: true },
      date: { y: 77, size: 9, color: '#6B5B44' },
      venue: { y: 84, size: 9, color: '#6B5B44' },
    },
  },

  // ─── minimal 카테고리 ───
  {
    id: 'minimal-1',
    name: 'Minimal 1',
    subtitle: '미니멀 1',
    category: 'minimal',
    preview: require('../../../../assets/studio/templates/minimal/minimal1/preview.png'),
    blank: require('../../../../assets/studio/templates/minimal/minimal1/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 38, w: 70, h: 55 },
    text: {
      names: { y: 74, size: 14, color: '#2C2A28', hideConnector: true },
      date: { y: 82, size: 9, color: '#5A5854' },
      venue: { y: 88, size: 9, color: '#5A5854' },
    },
  },
  {
    id: 'minimal-2',
    name: 'Minimal 2',
    subtitle: '미니멀 2',
    category: 'minimal',
    preview: require('../../../../assets/studio/templates/minimal/minimal2/preview.png'),
    blank: require('../../../../assets/studio/templates/minimal/minimal2/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 38, w: 70, h: 55 },
    text: {
      names: { y: 74, size: 14, color: '#2C2A28', hideConnector: true },
      date: { y: 82, size: 9, color: '#5A5854' },
      venue: { y: 88, size: 9, color: '#5A5854' },
    },
  },
  {
    id: 'minimal-3',
    name: 'Minimal 3',
    subtitle: '미니멀 3',
    category: 'minimal',
    preview: require('../../../../assets/studio/templates/minimal/minimal3/preview.png'),
    blank: require('../../../../assets/studio/templates/minimal/minimal3/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 38, w: 70, h: 55 },
    text: {
      names: { y: 74, size: 14, color: '#2C2A28', hideConnector: true },
      date: { y: 82, size: 9, color: '#5A5854' },
      venue: { y: 88, size: 9, color: '#5A5854' },
    },
  },
  {
    id: 'minimal-4',
    name: 'Minimal 4',
    subtitle: '미니멀 4',
    category: 'minimal',
    preview: require('../../../../assets/studio/templates/minimal/minimal4/preview.png'),
    blank: require('../../../../assets/studio/templates/minimal/minimal4/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 38, w: 70, h: 55 },
    text: {
      names: { y: 74, size: 14, color: '#2C2A28', hideConnector: true },
      date: { y: 82, size: 9, color: '#5A5854' },
      venue: { y: 88, size: 9, color: '#5A5854' },
    },
  },
  {
    id: 'minimal-5',
    name: 'Minimal 5',
    subtitle: '미니멀 5',
    category: 'minimal',
    preview: require('../../../../assets/studio/templates/minimal/minimal5/preview.png'),
    blank: require('../../../../assets/studio/templates/minimal/minimal5/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 38, w: 70, h: 55 },
    text: {
      names: { y: 74, size: 14, color: '#2C2A28', hideConnector: true },
      date: { y: 82, size: 9, color: '#5A5854' },
      venue: { y: 88, size: 9, color: '#5A5854' },
    },
  },
];
