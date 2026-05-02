// src/screens/main/studio/mobileTemplateConfigs.js
// 종이 청첩장 템플릿 설정
// - preview: 샘플 정보·사진 다 박힌 완성 미리보기 (Studio 탭 카드용)
// - blank:   빈 프레임만 있는 실제 사용 템플릿 (사용자가 사진·텍스트 넣을 때)
// - category: floral / minimal / modern / vintage / korean
//
// 폴더 구조: assets/studio/templates/{category}/{template-id}/preview.png + blank.png

export const A6_ASPECT_RATIO = 148 / 105;
export const BASE_WIDTH = 170;

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
      // 큰 날짜 (월/일 두 줄) — minimal-2 전용
      dateBig: { y: 92, size: 28, color: '#2C2A28' },
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
      // 인사말 — minimal-4 전용. PNG 위에 덮어쓰는 용도라 사용자가 위치/색 조절 가능.
      greeting: { text: '결 혼 합 니 다', y: 8, size: 12, color: '#5A5854' },
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

  // ─── modern 카테고리 ───
  {
    id: 'modern-editorial',
    name: 'Cobalt Block',
    subtitle: '코발트 그래픽 블록',
    category: 'modern',
    preview: require('../../../../assets/studio/templates/modern/modern-editorial/preview.png'),
    blank: require('../../../../assets/studio/templates/modern/modern-editorial/blank.png'),
    bgColor: '#F6F7F4',
    photo: { shape: 'arch', x: 62, y: 45, w: 43, h: 64 },
    text: {
      names: { y: 81, size: 16, color: '#FFFFFF', hideConnector: true },
      date: { y: 88, size: 9, color: '#FFFFFF' },
      venue: { y: 92, size: 9, color: '#FFFFFF' },
    },
  },
  {
    id: 'modern-cobalt-grid',
    name: 'Mono Construct',
    subtitle: '건축적 흑백 포스터',
    category: 'modern',
    preview: require('../../../../assets/studio/templates/modern/modern-cobalt-grid/preview.png'),
    blank: require('../../../../assets/studio/templates/modern/modern-cobalt-grid/blank.png'),
    bgColor: '#F8F8F6',
    photo: { shape: 'rectangle', x: 70, y: 57, w: 50, h: 60 },
    text: {
      names: { y: 16.7, size: 16, color: '#111111', hideConnector: true },
      date: { y: 6.1, size: 9, color: '#171717' },
      venue: { y: 91.5, size: 9, color: '#222222' },
    },
  },
  {
    id: 'modern-champagne-frame',
    name: 'Digital Glass',
    subtitle: '블루 디지털 카드',
    category: 'modern',
    preview: require('../../../../assets/studio/templates/modern/modern-champagne-frame/preview.png'),
    blank: require('../../../../assets/studio/templates/modern/modern-champagne-frame/blank.png'),
    bgColor: '#F2F7FF',
    photo: { shape: 'rectangle', x: 64.8, y: 34.6, w: 45.5, h: 38.2 },
    text: {
      names: { y: 58, size: 18, color: '#1F2937', hideConnector: true },
      date: { y: 64, size: 9, color: '#243244' },
      venue: { y: 75.2, size: 9, color: '#243244' },
    },
  },
  {
    id: 'modern-mono-split',
    name: 'Gallery Line',
    subtitle: '딥그린 갤러리 라인',
    category: 'modern',
    preview: require('../../../../assets/studio/templates/modern/modern-mono-split/preview.png'),
    blank: require('../../../../assets/studio/templates/modern/modern-mono-split/blank.png'),
    bgColor: '#F7F7F3',
    photo: { shape: 'rectangle', x: 65, y: 69, w: 58, h: 43 },
    text: {
      names: { y: 30, size: 18, color: '#111827', hideConnector: true },
      date: { y: 86, size: 9, color: '#00503D' },
      venue: { y: 90, size: 9, color: '#00503D' },
    },
  },
  {
    id: 'modern-sage-glass',
    name: 'Navy Diagonal',
    subtitle: '네이비 대각 포스터',
    category: 'modern',
    preview: require('../../../../assets/studio/templates/modern/modern-sage-glass/preview.png'),
    blank: require('../../../../assets/studio/templates/modern/modern-sage-glass/blank.png'),
    bgColor: '#F9F9F6',
    photo: { shape: 'rectangle', x: 60, y: 32, w: 46, h: 64 },
    text: {
      names: { y: 42, size: 17, color: '#0C2748', hideConnector: true },
      date: { y: 65, size: 9, color: '#0C2748' },
      venue: { y: 69, size: 9, color: '#0C2748' },
    },
  },

  // ─── vintage 카테고리 ───
  {
    id: 'vintage-letterpress',
    name: 'Ivory Film',
    subtitle: '아이보리 필름 포트레이트',
    category: 'vintage',
    preview: require('../../../../assets/studio/templates/vintage/vintage-letterpress/preview.png'),
    blank: require('../../../../assets/studio/templates/vintage/vintage-letterpress/blank.png'),
    bgColor: '#EEE7D8',
    photo: { shape: 'rectangle', x: 50, y: 35.5, w: 58, h: 56 },
    text: {
      names: { y: 72, size: 15, color: '#4D4338', hideConnector: true },
      date: { y: 84, size: 9, color: '#6B5E50' },
      venue: { y: 88, size: 9, color: '#6B5E50' },
    },
  },
  {
    id: 'vintage-film',
    name: 'Quiet Archive',
    subtitle: '조용한 흑백 아카이브',
    category: 'vintage',
    preview: require('../../../../assets/studio/templates/vintage/vintage-film/preview.png'),
    blank: require('../../../../assets/studio/templates/vintage/vintage-film/blank.png'),
    bgColor: '#EFEBE1',
    photo: { shape: 'rectangle', x: 50, y: 36.5, w: 68, h: 32 },
    text: {
      names: { y: 61, size: 15, color: '#3F3A34', hideConnector: true },
      date: { y: 77, size: 9, color: '#6F675C' },
      venue: { y: 82, size: 9, color: '#6F675C' },
    },
  },
  {
    id: 'vintage-nouveau',
    name: 'Cotton Frame',
    subtitle: '코튼 페이퍼 여백',
    category: 'vintage',
    preview: require('../../../../assets/studio/templates/vintage/vintage-nouveau/preview.png'),
    blank: require('../../../../assets/studio/templates/vintage/vintage-nouveau/blank.png'),
    bgColor: '#F0ECE2',
    photo: { shape: 'rectangle', x: 50, y: 31.5, w: 32, h: 34 },
    text: {
      names: { y: 59, size: 15, color: '#4E453B', hideConnector: true },
      date: { y: 74, size: 9, color: '#766B5E' },
      venue: { y: 79, size: 9, color: '#766B5E' },
    },
  },
  {
    id: 'vintage-postcard',
    name: 'Sepia Column',
    subtitle: '세피아 세로 사진',
    category: 'vintage',
    preview: require('../../../../assets/studio/templates/vintage/vintage-postcard/preview.png'),
    blank: require('../../../../assets/studio/templates/vintage/vintage-postcard/blank.png'),
    bgColor: '#EBE3D3',
    photo: { shape: 'rectangle', x: 70, y: 51, w: 40, h: 76 },
    text: {
      names: { y: 58, size: 15, color: '#5A4B3E', hideConnector: true },
      date: { y: 75, size: 9, color: '#7A6A58' },
      venue: { y: 80, size: 9, color: '#7A6A58' },
    },
  },
  {
    id: 'vintage-deco',
    name: 'Gallery Square',
    subtitle: '갤러리 흑백 스퀘어',
    category: 'vintage',
    preview: require('../../../../assets/studio/templates/vintage/vintage-deco/preview.png'),
    blank: require('../../../../assets/studio/templates/vintage/vintage-deco/blank.png'),
    bgColor: '#F0EEE6',
    photo: { shape: 'rectangle', x: 50, y: 51, w: 40, h: 28 },
    text: {
      names: { y: 23, size: 15, color: '#4A443B', hideConnector: true },
      date: { y: 75, size: 9, color: '#746C60' },
      venue: { y: 80, size: 9, color: '#746C60' },
    },
  },
];
