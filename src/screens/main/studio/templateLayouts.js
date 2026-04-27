// src/screens/main/studio/templateLayouts.js
// 5가지 청첩장 템플릿 레이아웃 정의
// 좌표: 퍼센트 기반 (x,y는 중앙 기준, w,h는 카드 대비 %)

export const TEMPLATE_LAYOUTS = [
  // ═══════════════════════════════════════════
  // 1. Classic Arch — 참고 이미지 스타일
  // ═══════════════════════════════════════════
  {
    id: 'classic-arch',
    name: 'Classic',
    subtitle: '클래식 아치형',
    bg: '#FBF9F3',
    photo: { shape: 'arch', x: 50, y: 45, w: 62, h: 56 },
    assets: [
      { key: 'eucalyptus-branch-top-right', x: 80, y: 18, w: 42 },
      { key: 'white-flowers-bottom-left', x: 18, y: 82, w: 38 },
    ],
    decorations: [
      { type: 'text-header', content: "WE'RE GETTING MARRIED", y: 10, size: 6 },
      { type: 'divider-line', y: 80, w: 30 },
      { type: 'divider-line', y: 86, w: 22 },
      { type: 'script-footer', content: 'Please join us', y: 92, size: 9 },
    ],
  },

  // ═══════════════════════════════════════════
  // 2. Circle Wreath
  // ═══════════════════════════════════════════
  {
    id: 'circle-wreath',
    name: 'Wreath',
    subtitle: '원형 화환',
    bg: '#F9F6EE',
    photo: { shape: 'circle', x: 50, y: 46, w: 48, h: 48 },
    photoFrame: { key: 'photo-frame-wreath', x: 50, y: 46, w: 78 },
    decorations: [
      { type: 'text-header', content: 'SAVE THE DATE', y: 10, size: 6 },
      { type: 'divider-line', y: 80, w: 28 },
      { type: 'script-footer', content: 'With love', y: 90, size: 10 },
    ],
  },

  // ═══════════════════════════════════════════
  // 3. Minimal
  // ═══════════════════════════════════════════
  {
    id: 'minimal',
    name: 'Minimal',
    subtitle: '미니멀',
    bg: '#FDFCF9',
    photo: { shape: 'rectangle', x: 50, y: 40, w: 56, h: 48 },
    assets: [
      { key: 'single-leaf-small', x: 14, y: 22, w: 14 },
      { key: 'single-leaf-small', x: 86, y: 72, w: 14, rotate: 180 },
    ],
    decorations: [
      { type: 'text-header', content: 'INVITATION', y: 10, size: 6 },
      { type: 'divider-line', y: 78, w: 24 },
      { type: 'divider-line', y: 84, w: 18 },
    ],
  },

  // ═══════════════════════════════════════════
  // 4. Botanical
  // ═══════════════════════════════════════════
  {
    id: 'botanical',
    name: 'Botanical',
    subtitle: '보태니컬 풍성',
    bg: '#F8F5EB',
    photo: { shape: 'arch', x: 50, y: 50, w: 50, h: 44 },
    assets: [
      { key: 'white-peony-cluster', x: 22, y: 18, w: 38 },
      { key: 'lavender-stems', x: 16, y: 78, w: 22 },
      { key: 'eucalyptus-single-short', x: 84, y: 62, w: 24 },
      { key: 'babies-breath-small', x: 82, y: 86, w: 24 },
    ],
    decorations: [
      { type: 'script-footer', content: 'Our Wedding', y: 12, size: 10 },
      { type: 'divider-line', y: 82, w: 26 },
    ],
  },

  // ═══════════════════════════════════════════
  // 5. Vintage
  // ═══════════════════════════════════════════
  {
    id: 'vintage',
    name: 'Vintage',
    subtitle: '빈티지 클래식',
    bg: '#EEE5D4',
    photo: { shape: 'rectangle', x: 50, y: 48, w: 54, h: 50 },
    photoFrame: { key: 'photo-frame-drop', x: 50, y: 48, w: 60, h: 68 },
    assets: [
      { key: 'corner-ornament', x: 14, y: 86, w: 18 },
      { key: 'corner-ornament', x: 86, y: 86, w: 18, rotate: 90 },
    ],
    decorations: [
      { type: 'text-header', content: 'WEDDING', y: 9, size: 8, color: '#6B5538' },
      { type: 'divider-line', y: 16, w: 28, color: 'rgba(107,85,56,0.3)' },
      { type: 'divider-line', y: 80, w: 28, color: 'rgba(107,85,56,0.3)' },
    ],
  },
];
