// src/screens/main/studio/mobileTemplateConfigs.js
// 템플릿 설정
// - preview: 이미지·이름·날짜 다 베이크된 완성 미리보기 (Studio 탭 표시용)
// - template: 빈 프레임 + 장식만 있는 실제 원클릭 템플릿 (사용자가 사진·정보 넣을 때 사용)
// - category: floral / minimal / modern / vintage / korean

export const TEMPLATE_CATEGORIES = [
  { id: 'floral', label: '꽃·풀', icon: 'flower-outline' },
  { id: 'minimal', label: '미니멀', icon: 'remove-outline' },
  { id: 'modern', label: '모던', icon: 'square-outline' },
  { id: 'vintage', label: '빈티지', icon: 'time-outline' },
  { id: 'korean', label: '한국 전통', icon: 'leaf-outline' },
];

export const MOBILE_TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    subtitle: '클래식 아치형',
    category: 'floral',
    preview: require('../../../../assets/studio/templete/preview/preview1.png'),
    template: require('../../../../assets/studio/templete/preview1templete.png'),
    photo: { shape: 'arch', x: 50, y: 36, w: 54, h: 42 },
  },
  {
    id: 'wreath',
    name: 'Wreath',
    subtitle: '원형 화환',
    category: 'floral',
    preview: require('../../../../assets/studio/templete/preview/preview2.png'),
    template: require('../../../../assets/studio/templete/preview2templete.png'),
    photo: { shape: 'circle', x: 50, y: 34, w: 36, h: 36 },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    subtitle: '미니멀 라인',
    category: 'floral',
    preview: require('../../../../assets/studio/templete/preview/preview3.png'),
    template: require('../../../../assets/studio/templete/preview3templete.png'),
    photo: { shape: 'rectangle', x: 50, y: 40, w: 56, h: 48 },
  },
  {
    id: 'botanical',
    name: 'Botanical',
    subtitle: '보태니컬 풍성',
    category: 'floral',
    preview: require('../../../../assets/studio/templete/preview/preview4.png'),
    template: require('../../../../assets/studio/templete/preview4templete.png'),
    photo: { shape: 'arch', x: 50, y: 48, w: 44, h: 38 },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    subtitle: '빈티지 화환',
    category: 'floral',
    preview: require('../../../../assets/studio/templete/preview/preview5.png'),
    template: require('../../../../assets/studio/templete/preview5templete.png'),
    photo: { shape: 'oval', x: 50, y: 44, w: 40, h: 35 },
  },
];
