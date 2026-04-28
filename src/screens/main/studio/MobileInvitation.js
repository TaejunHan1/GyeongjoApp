// src/screens/main/studio/MobileInvitation.js
// 완성된 청첩장 템플릿 배경 위에 사진·이름·날짜·예식장 텍스트 오버레이
import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { BASE_WIDTH } from './mobileTemplateConfigs';

const SERIF_FONT = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: 'serif',
});

/**
 * Props:
 *   template: mobileTemplateConfigs의 한 객체
 *   data: { groom, bride, date, venue, photoUri }
 *   width, height: 렌더 크기 (기본 비율 1024:1400 ≈ 0.73)
 */
export default function MobileInvitation({ template, data, width = 170, height = 238 }) {
  if (!template) return null;

  // 실제 width 기준 스케일 (BASE_WIDTH=170 기준 설계 → 더 크게 렌더 시 비례 확대)
  const scale = width / BASE_WIDTH;
  const pctX = (val) => (val / 100) * width;
  const pctY = (val) => (val / 100) * height;
  const px = (val) => val * scale;

  // 사진 프레임 shape에 맞는 border-radius
  const getPhotoRadius = (shape, w) => {
    switch (shape) {
      case 'circle':
        return { borderRadius: w / 2 };
      case 'arch':
        return {
          borderTopLeftRadius: w / 2,
          borderTopRightRadius: w / 2,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        };
      case 'oval':
        return { borderRadius: '50%' };
      case 'rectangle':
      default:
        return { borderRadius: 4 };
    }
  };

  const photo = template.photo;
  const text = template.text || {};
  const names = text.namesRow;

  return (
    <View style={[styles.root, { width, height }]}>
      {/* 배경 템플릿 이미지 */}
      <Image
        source={template.bg}
        style={{ position: 'absolute', width, height, resizeMode: 'cover' }}
      />

      {/* 사진 */}
      {photo && (
        <View
          style={{
            position: 'absolute',
            left: pctX(photo.x - photo.w / 2),
            top: pctY(photo.y - photo.h / 2),
            width: pctX(photo.w),
            height: pctY(photo.h),
            overflow: 'hidden',
            ...getPhotoRadius(photo.shape, pctX(photo.w)),
          }}
        >
          {data?.photoUri ? (
            <Image
              source={
                typeof data.photoUri === 'string'
                  ? { uri: data.photoUri }
                  : data.photoUri
              }
              style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(168, 149, 119, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: px(8), color: '#A89577', letterSpacing: 1 }}>
                PHOTO
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 이름 row (신랑 · 커넥터 · 신부) — flex로 중앙 정렬 */}
      {names && (
        <View
          style={{
            position: 'absolute',
            top: pctY(names.y),
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: SERIF_FONT,
              fontSize: px(names.groomSize),
              color: names.color || '#3E3424',
              fontWeight: '500',
              letterSpacing: -0.2,
            }}
          >
            {data?.groom || '신랑'}
          </Text>
          <Text
            style={{
              fontFamily: SERIF_FONT,
              fontSize: px(names.connectorSize),
              color: names.connectorColor || '#A89571',
              marginHorizontal: px(names.gap || 6),
              fontWeight: '300',
            }}
          >
            {names.connectorContent || '&'}
          </Text>
          <Text
            style={{
              fontFamily: SERIF_FONT,
              fontSize: px(names.brideSize),
              color: names.color || '#3E3424',
              fontWeight: '500',
              letterSpacing: -0.2,
            }}
          >
            {data?.bride || '신부'}
          </Text>
        </View>
      )}

      {/* 날짜 */}
      {text.date && data?.date && (
        <Text
          style={{
            position: 'absolute',
            top: pctY(text.date.y),
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: SERIF_FONT,
            fontSize: px(text.date.size || 6.5),
            color: text.date.color || '#6B5B44',
            letterSpacing: text.date.letterSpacing ?? 0.8,
          }}
        >
          {data.date}
        </Text>
      )}

      {/* 예식장 */}
      {text.venue && data?.venue && (
        <Text
          style={{
            position: 'absolute',
            top: pctY(text.venue.y),
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: SERIF_FONT,
            fontSize: px(text.venue.size || 6.5),
            color: text.venue.color || '#7B6B54',
            letterSpacing: text.venue.letterSpacing ?? 0,
          }}
        >
          {data.venue}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FBF9F3',
    overflow: 'hidden',
    borderRadius: 10,
    position: 'relative',
  },
});
