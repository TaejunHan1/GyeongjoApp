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

export const MOBILE_TEMPLATES = [
  // ─── floral 카테고리 ───
  {
    id: 'floral-classic',
    name: 'Classic',
    subtitle: '클래식 아치형',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/classic/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/classic/blank.png'),
    photo: { shape: 'arch', x: 50, y: 36, w: 54, h: 42 },
  },
  {
    id: 'floral-wreath',
    name: 'Wreath',
    subtitle: '원형 화환',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/wreath/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/wreath/blank.png'),
    photo: { shape: 'circle', x: 50, y: 34, w: 36, h: 36 },
  },
  {
    id: 'floral-minimal-line',
    name: 'Minimal Line',
    subtitle: '미니멀 라인',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/minimal-line/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/minimal-line/blank.png'),
    photo: { shape: 'rectangle', x: 50, y: 40, w: 56, h: 48 },
  },
  {
    id: 'floral-botanical',
    name: 'Botanical',
    subtitle: '보태니컬 풍성',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/botanical/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/botanical/blank.png'),
    photo: { shape: 'arch', x: 50, y: 48, w: 44, h: 38 },
  },
  {
    id: 'floral-vintage',
    name: 'Vintage',
    subtitle: '빈티지 화환',
    category: 'floral',
    preview: require('../../../../assets/studio/templates/floral/vintage/preview.png'),
    blank: require('../../../../assets/studio/templates/floral/vintage/blank.png'),
    photo: { shape: 'oval', x: 50, y: 44, w: 40, h: 35 },
  },
];
