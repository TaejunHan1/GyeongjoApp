// src/screens/main/studio/TemplatePreview.js
// layout JSON을 받아서 실제 에셋을 절대좌표로 조합하는 미리보기 컴포넌트
// 모든 좌표는 퍼센트(0~100) 기반 — 카드 크기에 자동 스케일
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getAsset } from './assetManifest';

/**
 * layout 구조 예시:
 * {
 *   bg: '#FBF9F3',
 *   photo: { shape: 'arch', x: 50, y: 42, w: 68, h: 52 },  // 빈 프레임 자리
 *   assets: [
 *     { key: 'eucalyptus-branch-top-right', x: 82, y: 14, w: 40, rotate: 0 },
 *     { key: 'white-flowers-bottom-left', x: 12, y: 86, w: 36 },
 *   ],
 *   decorations: [
 *     { type: 'text-header', content: "WE'RE GETTING MARRIED", y: 10 },
 *     { type: 'divider-line', y: 76, w: 50 },
 *     { type: 'script-footer', content: 'Please join us', y: 92 },
 *   ]
 * }
 *
 * 좌표는 모두 중앙 기준 (x=50이면 가로 중앙, y=50이면 세로 중앙)
 * w, h는 카드 대비 % (ex. w=40 = 카드 가로폭의 40%)
 */
export default function TemplatePreview({ layout, width = 140, height = 200 }) {
  if (!layout) return <View style={[s.card, { width, height }]} />;

  // 퍼센트 좌표를 절대 픽셀로 변환
  const toPx = (val, dim) => (val / 100) * dim;

  return (
    <View
      style={[
        s.card,
        { width, height, backgroundColor: layout.bg || '#FBF9F3' },
      ]}
    >
      {/* 빈 사진 프레임 자리 — 은은한 배경색으로 표시 */}
      {layout.photo && (
        <View
          style={{
            position: 'absolute',
            left: toPx(layout.photo.x - layout.photo.w / 2, width),
            top: toPx(layout.photo.y - layout.photo.h / 2, height),
            width: toPx(layout.photo.w, width),
            height: toPx(layout.photo.h, height),
            backgroundColor: 'rgba(0,0,0,0.04)',
            borderRadius:
              layout.photo.shape === 'circle'
                ? toPx(layout.photo.w / 2, width)
                : layout.photo.shape === 'arch'
                ? toPx(layout.photo.w / 2, width)
                : layout.photo.radius ?? 6,
            borderTopLeftRadius:
              layout.photo.shape === 'arch' ? toPx(layout.photo.w / 2, width) : undefined,
            borderTopRightRadius:
              layout.photo.shape === 'arch' ? toPx(layout.photo.w / 2, width) : undefined,
            borderBottomLeftRadius:
              layout.photo.shape === 'arch' ? 2 : undefined,
            borderBottomRightRadius:
              layout.photo.shape === 'arch' ? 2 : undefined,
          }}
        />
      )}

      {/* 사진 프레임 PNG 오버레이 (선택적) */}
      {layout.photoFrame && getAsset(layout.photoFrame.key) && (
        <Image
          source={getAsset(layout.photoFrame.key)}
          style={{
            position: 'absolute',
            left: toPx(layout.photoFrame.x - layout.photoFrame.w / 2, width),
            top: toPx(layout.photoFrame.y - (layout.photoFrame.h || layout.photoFrame.w) / 2, height),
            width: toPx(layout.photoFrame.w, width),
            height: toPx(layout.photoFrame.h || layout.photoFrame.w, height),
            resizeMode: 'contain',
          }}
        />
      )}

      {/* 에셋들 배치 */}
      {(layout.assets || []).map((a, idx) => {
        const src = getAsset(a.key);
        if (!src) return null;
        const w = toPx(a.w, width);
        const h = toPx(a.h || a.w, height);
        return (
          <Image
            key={`a-${idx}`}
            source={src}
            style={{
              position: 'absolute',
              left: toPx(a.x - a.w / 2, width),
              top: toPx(a.y - (a.h || a.w) / 2, height),
              width: w,
              height: h,
              transform: a.rotate ? [{ rotate: `${a.rotate}deg` }] : undefined,
              opacity: a.opacity ?? 1,
              resizeMode: 'contain',
            }}
          />
        );
      })}

      {/* 데코레이션 (텍스트 헤더·라인·필기체) */}
      {(layout.decorations || []).map((d, idx) => {
        if (d.type === 'text-header') {
          return (
            <Text
              key={`d-${idx}`}
              style={{
                position: 'absolute',
                top: toPx(d.y, height),
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: d.size || 7,
                fontWeight: '600',
                letterSpacing: 1.5,
                color: d.color || '#8B95A1',
              }}
            >
              {d.content}
            </Text>
          );
        }
        if (d.type === 'divider-line') {
          return (
            <View
              key={`d-${idx}`}
              style={{
                position: 'absolute',
                top: toPx(d.y, height),
                left: toPx(50 - (d.w || 40) / 2, width),
                width: toPx(d.w || 40, width),
                height: 0.8,
                backgroundColor: d.color || 'rgba(0,0,0,0.2)',
              }}
            />
          );
        }
        if (d.type === 'script-footer') {
          return (
            <Text
              key={`d-${idx}`}
              style={{
                position: 'absolute',
                top: toPx(d.y, height),
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: d.size || 10,
                fontStyle: 'italic',
                fontWeight: '400',
                color: d.color || '#A89577',
              }}
            >
              {d.content}
            </Text>
          );
        }
        return null;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
});
