// src/screens/main/studio/SavedInvitationThumb.js
// 저장된 청첩장 미리보기 (layout JSON 그대로 적용)
import React, { useState, useEffect } from 'react';
import { View, Text, Image, Platform, ActivityIndicator } from 'react-native';
import Svg, { Defs, ClipPath, Path, Image as SvgImage } from 'react-native-svg';
import { MOBILE_TEMPLATES } from './mobileTemplateConfigs';

const SERIF_FONT = Platform.select({ ios: 'AppleMyungjo', android: 'serif' });
const NUMERIC_FONT = Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' });

const buildEggPath = (w, h) =>
  `M ${w / 2} 0 ` +
  `C ${w * 0.86} 0, ${w} ${h * 0.42}, ${w} ${h * 0.68} ` +
  `C ${w} ${h * 0.91}, ${w * 0.78} ${h}, ${w / 2} ${h} ` +
  `C ${w * 0.22} ${h}, 0 ${h * 0.91}, 0 ${h * 0.68} ` +
  `C 0 ${h * 0.42}, ${w * 0.14} 0, ${w / 2} 0 Z`;

const getPhotoRadius = (shape, w) => {
  switch (shape) {
    case 'circle':
      return { borderRadius: w / 2 };
    case 'arch':
      return {
        borderTopLeftRadius: w / 2,
        borderTopRightRadius: w / 2,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
      };
    default:
      return { borderRadius: 4 };
  }
};

export default function SavedInvitationThumb({ invitation, width = 100 }) {
  const template = MOBILE_TEMPLATES.find((t) => t.id === invitation.template_id);

  // 사진 prefetch — 다 받아진 뒤 템플릿과 함께 한번에 표시
  const [photoReady, setPhotoReady] = useState(!invitation.photo_url);
  useEffect(() => {
    let cancelled = false;
    if (!invitation.photo_url) {
      setPhotoReady(true);
      return;
    }
    setPhotoReady(false);
    Image.prefetch(invitation.photo_url)
      .then(() => {
        if (!cancelled) setPhotoReady(true);
      })
      .catch(() => {
        // 실패해도 placeholder 라도 보여주기
        if (!cancelled) setPhotoReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [invitation.photo_url]);

  if (!template) {
    return (
      <View
        style={{
          width,
          aspectRatio: 1024 / 1400,
          backgroundColor: '#F0F0F0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 10, color: '#999' }}>템플릿 없음</Text>
      </View>
    );
  }

  const height = width * (1400 / 1024);
  const layout = invitation.layout || {};
  // 저장 시점 canvas 너비 기준으로 스케일 (없으면 260 fallback)
  const refWidth = layout.canvas_w || 260;
  const px = (val) => (val / refWidth) * width;

  return (
    <View style={{ width, height, position: 'relative' }}>
      {/* 로딩 중: 동일 크기 placeholder + spinner */}
      {!photoReady && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width,
            height,
            backgroundColor: template.bgColor || '#FBF9F3',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <ActivityIndicator size="small" color="#A89577" />
        </View>
      )}
    <View
      style={{
        width,
        height,
        backgroundColor: template.bgColor || '#FBF9F3',
        overflow: 'hidden',
        position: 'relative',
        opacity: photoReady ? 1 : 0,
      }}
    >
      {/* 사진 — blank.png 아래 layer (cutout 템플릿이면 사진이 구멍으로 비침) */}
      {layout.photo && (
        layout.photo.shape === 'oval' ? (
          <View
            style={{
              position: 'absolute',
              left: (layout.photo.x / 100) * width,
              top: (layout.photo.y / 100) * height,
              width: (layout.photo.w / 100) * width,
              height: (layout.photo.h / 100) * height,
            }}
          >
            <Svg
              width={(layout.photo.w / 100) * width}
              height={(layout.photo.h / 100) * height}
            >
              <Defs>
                <ClipPath id={`eggClipThumb-${invitation.id || 'x'}`}>
                  <Path
                    d={buildEggPath(
                      (layout.photo.w / 100) * width,
                      (layout.photo.h / 100) * height
                    )}
                  />
                </ClipPath>
              </Defs>
              <Path
                d={buildEggPath(
                  (layout.photo.w / 100) * width,
                  (layout.photo.h / 100) * height
                )}
                fill="rgba(168,149,119,0.15)"
              />
              {invitation.photo_url && (
                <SvgImage
                  href={{ uri: invitation.photo_url }}
                  x={0}
                  y={0}
                  width={(layout.photo.w / 100) * width}
                  height={(layout.photo.h / 100) * height}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#eggClipThumb-${invitation.id || 'x'})`}
                />
              )}
            </Svg>
          </View>
        ) : (
          <View
            style={{
              position: 'absolute',
              left: (layout.photo.x / 100) * width,
              top: (layout.photo.y / 100) * height,
              width: (layout.photo.w / 100) * width,
              height: (layout.photo.h / 100) * height,
              overflow: 'hidden',
              backgroundColor: 'rgba(168,149,119,0.15)',
              ...getPhotoRadius(
                layout.photo.shape,
                (layout.photo.w / 100) * width
              ),
            }}
          >
            {invitation.photo_url ? (
              <Image
                source={{ uri: invitation.photo_url }}
                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                onError={(e) =>
                  console.warn('[SavedInvitationThumb] image load error:', invitation.photo_url, e.nativeEvent)
                }
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#A89577', fontSize: px(10), letterSpacing: 1 }}>
                  PHOTO
                </Text>
              </View>
            )}
          </View>
        )
      )}

      {/* 빈 템플릿 — 사진 위 layer */}
      <Image
        source={template.blank}
        style={{ position: 'absolute', width, height }}
        resizeMode="contain"
      />

      {/* 베이크인 마스크 (& 등) — 템플릿 위에 얹힘 */}
      {(template.masks || []).map((m, i) => (
        <View
          key={`mask-${i}`}
          style={{
            position: 'absolute',
            left: ((m.x - m.w / 2) / 100) * width,
            top: ((m.y - m.h / 2) / 100) * height,
            width: (m.w / 100) * width,
            height: (m.h / 100) * height,
            backgroundColor: template.bgColor || '#FBF9F3',
          }}
        />
      ))}

      {/* 신랑 */}
      {layout.groom && invitation.groom && (
        <Text
          style={{
            position: 'absolute',
            left: (layout.groom.x / 100) * width,
            top: (layout.groom.y / 100) * height,
            width: (layout.groom.w / 100) * width,
            textAlign: 'center',
            fontFamily: layout.groom.fontFamily || SERIF_FONT,
            fontSize: px(layout.groom.size || 13),
            color: '#3A2E22',
            fontWeight: '500',
          }}
        >
          {invitation.groom}
        </Text>
      )}

      {/* 신부 */}
      {layout.bride && invitation.bride && (
        <Text
          style={{
            position: 'absolute',
            left: (layout.bride.x / 100) * width,
            top: (layout.bride.y / 100) * height,
            width: (layout.bride.w / 100) * width,
            textAlign: 'center',
            fontFamily: layout.bride.fontFamily || SERIF_FONT,
            fontSize: px(layout.bride.size || 13),
            color: '#3A2E22',
            fontWeight: '500',
          }}
        >
          {invitation.bride}
        </Text>
      )}

      {/* 날짜 — 편집 화면과 위치 정확히 일치하도록 좌측 보정 */}
      {layout.date && invitation.date_str && (
        <Text
          style={{
            position: 'absolute',
            left: (layout.date.x / 100) * width - 2,
            top: (layout.date.y / 100) * height,
            width: ((layout.date.w ?? 100) / 100) * width,
            textAlign: 'center',
            fontFamily: layout.date.fontFamily || NUMERIC_FONT,
            fontSize: px(layout.date.size || 9),
            color: '#6B5B44',
            letterSpacing: 1.2,
            fontWeight: '600',
          }}
        >
          {invitation.date_str}
          {invitation.time_str ? ` ${invitation.time_str}` : ''}
        </Text>
      )}

      {/* 예식장 */}
      {layout.venue && invitation.venue && (
        <Text
          numberOfLines={1}
          style={{
            position: 'absolute',
            left: (layout.venue.x / 100) * width,
            top: (layout.venue.y / 100) * height,
            width: ((layout.venue.w ?? 100) / 100) * width,
            textAlign: 'center',
            fontFamily: layout.venue.fontFamily || SERIF_FONT,
            fontSize: px(layout.venue.size || 9),
            color: '#6B5B44',
            fontWeight: '500',
          }}
        >
          {invitation.venue}
        </Text>
      )}
    </View>
    </View>
  );
}
