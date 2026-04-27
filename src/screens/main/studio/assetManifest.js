// src/screens/main/studio/assetManifest.js
// 청첩장 에셋 매니페스트 — require()는 정적 경로만 허용되므로 key로 매핑
// 경로: /Users/hantaejun/Documents/GitHub/GyeongjoApp/assets/studio/elements/

export const STUDIO_ASSETS = {
  'eucalyptus-branch-top-right': require('../../../../assets/studio/elements/1-eucalyptus-branch-top-right.png'),
  'white-flowers-bottom-left': require('../../../../assets/studio/elements/2-white-flowers-bottom-left.png'),
  'eucalyptus-single-short': require('../../../../assets/studio/elements/3-eucalyptus-single-short.png'),
  'white-peony-single': require('../../../../assets/studio/elements/4-white-peony-single.png'),
  'white-peony-cluster': require('../../../../assets/studio/elements/5-white-peony-cluster.png'),
  'babies-breath-small': require('../../../../assets/studio/elements/6-babies-breath-small.png'),
  'olive-branch': require('../../../../assets/studio/elements/7-olive-branch.png'),
  'lavender-stems': require('../../../../assets/studio/elements/8-lavender-stems.png'),
  'ranunculus-cream': require('../../../../assets/studio/elements/9-ranunculus-cream.png'),
  'single-leaf-small': require('../../../../assets/studio/elements/10-single-leaf-small.png'),
  'rose-bud-dusty': require('../../../../assets/studio/elements/11-rose-bud-dusty.png'),
  'magnolia-petals': require('../../../../assets/studio/elements/12-magnolia-petals.png'),
  'cherry-blossom-branch': require('../../../../assets/studio/elements/13-cherry-blossom-branch.png'),
  'cotton-flower': require('../../../../assets/studio/elements/14-cotton-flower.png'),
  'pampas-small': require('../../../../assets/studio/elements/15-pampas-small.png'),
  'greenery-mixed-small': require('../../../../assets/studio/elements/16-greenery-mixed-small.png'),
  'divider-leaves-horizontal': require('../../../../assets/studio/elements/17-divider-leaves-horizontal.png'),
  'divider-flower-horizontal': require('../../../../assets/studio/elements/18-divider-flower-horizontal.png'),
  'corner-ornament': require('../../../../assets/studio/elements/19-corner-ornament.png'),
  'divider-wave-script': require('../../../../assets/studio/elements/20-divider-wave-script.png'),
  'motif-minimal-plant': require('../../../../assets/studio/elements/21-motif-minimal-plant.png'),
  'photo-frame-arch': require('../../../../assets/studio/elements/22-photo-frame-arch.png'),
  'photo-frame-circle': require('../../../../assets/studio/elements/23-photo-frame-circle.png'),
  'photo-frame-rectangle': require('../../../../assets/studio/elements/24-photo-frame-rectangle.png'),
  'photo-frame-wreath': require('../../../../assets/studio/elements/25-photo-frame-wreath.png'),
  'photo-frame-drop': require('../../../../assets/studio/elements/26-photo-frame-drop.png'),
  'map-simple-crossroad': require('../../../../assets/studio/elements/27-map-simple-crossroad.png'),
};

export const getAsset = (key) => STUDIO_ASSETS[key] || null;
