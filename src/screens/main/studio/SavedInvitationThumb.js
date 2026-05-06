// src/screens/main/studio/SavedInvitationThumb.js
// 저장된 청첩장 미리보기 (layout JSON 그대로 적용)
import React from 'react';
import { View, Text, Image } from 'react-native';
import Svg, { Defs, ClipPath, Path, Image as SvgImage } from 'react-native-svg';
import { A6_ASPECT_RATIO, MOBILE_TEMPLATES } from './mobileTemplateConfigs';

const SERIF_FONT = 'NanumMyeongjo';
const NUMERIC_FONT = 'GowunDodum';

const normalizeSavedFontFamily = (fontFamily) => {
  if (!fontFamily) return fontFamily;
  if (['AppleMyungjo', 'Times New Roman', 'serif'].includes(fontFamily)) return SERIF_FONT;
  if (['Helvetica Neue', 'System', 'sans-serif'].includes(fontFamily)) return NUMERIC_FONT;
  return fontFamily;
};

const fontFamilyFor = (fontFamily, fallback = SERIF_FONT) =>
  normalizeSavedFontFamily(fontFamily) || fallback;

const splitManualLines = (value) => String(value ?? '').split(/\r?\n/);

const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  const value = String(timeStr).trim();
  const koreanMatch = value.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (koreanMatch) {
    return `${koreanMatch[1]} ${Number(koreanMatch[2])}:${koreanMatch[3]}`;
  }
  const englishMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!englishMatch) return value;
  const period = englishMatch[3].toUpperCase() === 'PM' ? '오후' : '오전';
  return `${period} ${Number(englishMatch[1])}:${englishMatch[2]}`;
};

const buildEggPath = (w, h) =>
  `M ${w / 2} 0 ` +
  `C ${w * 0.86} 0, ${w} ${h * 0.42}, ${w} ${h * 0.68} ` +
  `C ${w} ${h * 0.91}, ${w * 0.78} ${h}, ${w / 2} ${h} ` +
  `C ${w * 0.22} ${h}, 0 ${h * 0.91}, 0 ${h * 0.68} ` +
  `C 0 ${h * 0.42}, ${w * 0.14} 0, ${w / 2} 0 Z`;

const getPhotoRadius = (shape, w, radius) => {
  if (radius != null) return { borderRadius: radius };
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

const parseWeddingDate = (dateStr) => {
  const m = (dateStr || '').match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

function MiniCalendarThumb({ dateStr, width, height }) {
  const date = parseWeddingDate(dateStr);
  if (!date) return null;

  const year = date.getFullYear();
  const month = date.getMonth();
  const selectedDay = date.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.max(35, Math.ceil((firstDay + daysInMonth) / 7) * 7);
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const horizontalPadding = Math.max(1, width * 0.035);
  const innerW = Math.max(1, width - horizontalPadding * 2);
  const cellW = innerW / 7;
  const headerH = height * 0.18;
  const weekdaysH = height * 0.13;
  const weekCount = cells.length / 7;
  const rowH = Math.max(1, (height - headerH - weekdaysH) / weekCount);
  const monthLabel = `${year}. ${String(month + 1).padStart(2, '0')}`;
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weeks = Array.from({ length: weekCount }, (_, row) =>
    cells.slice(row * 7, row * 7 + 7)
  );

  return (
    <View style={{ width, height, paddingHorizontal: horizontalPadding }}>
      <Text
        style={{
          height: headerH,
          textAlign: 'center',
          fontSize: Math.max(5, headerH * 0.55),
          fontWeight: '700',
          color: '#A96770',
          letterSpacing: 0.5,
          lineHeight: headerH,
        }}
      >
        {monthLabel}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((d, i) => (
          <Text
            key={`${d}-${i}`}
            style={{
              width: cellW,
              height: weekdaysH,
              textAlign: 'center',
              fontSize: Math.max(4, weekdaysH * 0.42),
              fontWeight: '700',
              color: i === 0 ? '#C98B92' : '#3A3732',
              lineHeight: weekdaysH,
            }}
          >
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, rowIndex) => (
        <View key={`week-${rowIndex}`} style={{ flexDirection: 'row', width: innerW }}>
          {week.map((day, colIndex) => {
            const selected = day === selectedDay;
            return (
              <View
                key={`day-${rowIndex}-${colIndex}`}
                style={{
                  width: cellW,
                  height: rowH,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text
                      style={{
                        fontSize: Math.max(10, rowH * 1.22),
                        color: '#F1B7BE',
                        lineHeight: Math.max(10, rowH * 1.18),
                      }}
                    >
                      ♥
                    </Text>
                    <Text
                      style={{
                        position: 'absolute',
                        fontSize: Math.max(3, rowH * 0.34),
                        fontWeight: '900',
                        color: '#4A3838',
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      fontSize: Math.max(4, rowH * 0.42),
                      fontWeight: '500',
                      color: day ? (colIndex === 0 ? '#C98B92' : '#3A3732') : 'transparent',
                    }}
                  >
                    {day || ''}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function SavedInvitationThumb({ invitation, width = 100, side = 'front' }) {
  const template = MOBILE_TEMPLATES.find((t) => t.id === invitation.template_id);

  // photoReady prefetch 로직 제거 — 즉시 카드 표시.
  // 사진은 RN Image 컴포넌트가 자동 캐싱/로드하고, 로드 전엔 placeholder 배경색이 보임.

  if (!template) {
    return (
      <View
        style={{
          width,
          aspectRatio: 1 / A6_ASPECT_RATIO,
          backgroundColor: '#F0F0F0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 10, color: '#999' }}>템플릿 없음</Text>
      </View>
    );
  }

  const height = width * A6_ASPECT_RATIO;
  const layout = invitation.layout || {};
  // 저장 시점 canvas 너비 기준으로 스케일 (없으면 260 fallback)
  const refWidth = layout.canvas_w || 260;
  const px = (val) => (val / refWidth) * width;
  const scaledSize = (el, fallback) => {
    if (el?.size_pct != null) return (el.size_pct / 100) * width;
    return px(el?.size ?? fallback);
  };
  const back = layout.back || {};
  const backData = layout.backData || {};
  const templateBack = template.back || {};

  if (side === 'back' && template.hasBack) {
    const formatParentLine = (father, mother, childLabel) => {
      const names = [father, mother].map((v) => (v || '').trim()).filter(Boolean);
      if (names.length === 0) return childLabel;
      return `${names.join(' · ')}의 ${childLabel}`;
    };

    const renderBackText = (key, value, options = {}) => {
      const el = back[key] || templateBack[key];
      if (!el || !value) return null;
      const sizePx = scaledSize(el, 10);
      // Saved/detail rendering draws Text directly, while the editor draws it inside
      // a draggable box. Nudge the direct Text up to match the editor's visual baseline.
      const baselineOffset = options.baselineOffset ?? sizePx * 0.28;
      const manualLines = options.preserveManualLines ? splitManualLines(value) : null;

      return manualLines ? (
        <View
          style={{
            position: 'absolute',
            left: (el.x / 100) * width,
            top: (el.y / 100) * height - baselineOffset,
            width: ((el.w ?? 80) / 100) * width,
            transform: [{ rotate: `${el.rotation || 0}deg` }],
          }}
        >
          {manualLines.map((line, idx) => (
            <Text
              key={`${key}-line-${idx}`}
              numberOfLines={1}
              ellipsizeMode="clip"
              style={{
                textAlign: options.align || 'center',
                fontFamily: fontFamilyFor(el.fontFamily),
                fontSize: sizePx,
                lineHeight: sizePx * 1.55,
                color: el.color || options.color || '#3A3732',
                fontWeight: el.bold ? '900' : options.weight || '500',
                letterSpacing: el.letterSpacing ?? options.letterSpacing ?? 0,
              }}
            >
              {line || ' '}
            </Text>
          ))}
        </View>
      ) : (
        <Text
          numberOfLines={options.lines === 1 ? 1 : undefined}
          style={{
            position: 'absolute',
            left: (el.x / 100) * width,
            top: (el.y / 100) * height - baselineOffset,
            width: ((el.w ?? 80) / 100) * width,
            textAlign: options.align || 'center',
            fontFamily: fontFamilyFor(el.fontFamily),
            fontSize: sizePx,
            lineHeight: options.lines && options.lines > 1 ? sizePx * 1.55 : undefined,
            color: el.color || options.color || '#3A3732',
            fontWeight: el.bold ? '900' : options.weight || '500',
            letterSpacing: el.letterSpacing ?? options.letterSpacing ?? 0,
            transform: [{ rotate: `${el.rotation || 0}deg` }],
          }}
        >
          {value}
        </Text>
      );
    };

    return (
      <View
        style={{
          width,
          height,
          backgroundColor: template.bgColor || '#FFFFFF',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {template.backBlank ? (
          <Image
            source={template.backBlank}
            style={{ position: 'absolute', width, height }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ position: 'absolute', width, height, backgroundColor: '#FFFDF9' }} />
        )}

        {renderBackText('title', 'INVITATION', {
          weight: '400',
          letterSpacing: 0,
        })}
        {renderBackText('invitation', backData.invitationText, {
          preserveManualLines: true,
          weight: '400',
          letterSpacing: 0.2,
        })}
        {renderBackText('groomParents', formatParentLine(
          backData.groomFather || '아버님',
          backData.groomMother || '어머님',
          backData.groomRelation || '아들'
        ), {
          align: 'left',
          weight: '400',
          baselineOffset: scaledSize(back.groomParents || templateBack.groomParents, 10) * 0.42,
        })}
        {renderBackText('brideParents', formatParentLine(
          backData.brideFather || '아버님',
          backData.brideMother || '어머님',
          backData.brideRelation || '딸'
        ), {
          align: 'left',
          weight: '400',
          baselineOffset: scaledSize(back.brideParents || templateBack.brideParents, 10) * 0.42,
        })}
        {renderBackText('groomName', invitation.groom, {
          letterSpacing: 2,
          baselineOffset: scaledSize(back.groomName || templateBack.groomName, 10) * 0.42,
        })}
        {renderBackText('brideName', invitation.bride, {
          letterSpacing: 2,
          baselineOffset: scaledSize(back.brideName || templateBack.brideName, 10) * 0.42,
        })}
        {renderBackText('dateLabel', '일  시  |', {
          align: 'left',
        })}
        {renderBackText('venueLabel', '장  소  |', {
          align: 'left',
        })}
        {renderBackText('date', `${invitation.date_str || ''}${invitation.time_str ? ` ${formatDisplayTime(invitation.time_str)}` : ''}`, {
          align: 'left',
        })}
        {!!invitation.venue && renderBackText('venue', invitation.venue, {
          preserveManualLines: true,
          align: 'left',
        })}

        {['infoTopDivider', 'infoBottomDivider', 'thanksDivider'].map((key) => {
          const el = back[key] || templateBack[key];
          if (!el) return null;
          return (
          <View
            key={key}
            style={{
              position: 'absolute',
              left: (el.x / 100) * width,
              top: (el.y / 100) * height,
              width: ((el.w ?? 50) / 100) * width,
              height: Math.max(1, (el.h / 100) * height),
              backgroundColor: el.color || '#B6B2AD',
              transform: [{ rotate: `${el.rotation || 0}deg` }],
            }}
          />
          );
        })}

        {(back.calendar || templateBack.calendar) && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: ((back.calendar || templateBack.calendar).x / 100) * width,
              top: ((back.calendar || templateBack.calendar).y / 100) * height,
              width: (((back.calendar || templateBack.calendar).w ?? 58) / 100) * width,
              height: (((back.calendar || templateBack.calendar).h ?? 25) / 100) * height,
              transform: [{ rotate: `${(back.calendar || templateBack.calendar).rotation || 0}deg` }],
            }}
          >
            <MiniCalendarThumb
              dateStr={invitation.date_str}
              width={(((back.calendar || templateBack.calendar).w ?? 58) / 100) * width}
              height={(((back.calendar || templateBack.calendar).h ?? 25) / 100) * height}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: template.bgColor || '#FFFFFF',
        overflow: 'hidden',
        position: 'relative',
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
              transform: [{ rotate: `${layout.photo.rotation || 0}deg` }],
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
              transform: [{ rotate: `${layout.photo.rotation || 0}deg` }],
              ...getPhotoRadius(
                layout.photo.shape,
                (layout.photo.w / 100) * width,
                layout.photo.radius ?? (template?.id === 'minimal-5' ? 0 : undefined)
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

      {/* 빈 템플릿 — 사진 위 layer (cover로 캔버스 가득) */}
      <Image
        source={template.blank}
        style={{ position: 'absolute', width, height }}
        resizeMode="cover"
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
          numberOfLines={1}
          ellipsizeMode="clip"
          style={{
            position: 'absolute',
            left: (layout.groom.x / 100) * width,
            top: (layout.groom.y / 100) * height,
            width: (layout.groom.w / 100) * width,
            textAlign: 'center',
            fontFamily: fontFamilyFor(layout.groom.fontFamily),
            fontSize: scaledSize(layout.groom, 13),
            color: layout.groom.color || '#3A2E22',
            fontWeight: layout.groom.bold ? '900' : '500',
            transform: [{ rotate: `${layout.groom.rotation || 0}deg` }],
          }}
        >
          {invitation.groom}
        </Text>
      )}

      {/* 신부 */}
      {layout.bride && invitation.bride && (
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={{
            position: 'absolute',
            left: (layout.bride.x / 100) * width,
            top: (layout.bride.y / 100) * height,
            width: (layout.bride.w / 100) * width,
            textAlign: 'center',
            fontFamily: fontFamilyFor(layout.bride.fontFamily),
            fontSize: scaledSize(layout.bride, 13),
            color: layout.bride.color || '#3A2E22',
            fontWeight: layout.bride.bold ? '900' : '500',
            transform: [{ rotate: `${layout.bride.rotation || 0}deg` }],
          }}
        >
          {invitation.bride}
        </Text>
      )}

      {/* 날짜 — 편집 화면과 위치 정확히 일치하도록 좌측 보정 (width 비례) */}
      {layout.date && invitation.date_str && (
        <Text
          style={{
            position: 'absolute',
            left: (layout.date.x / 100) * width - px(2),
            top: (layout.date.y / 100) * height,
            width: ((layout.date.w ?? 100) / 100) * width,
            textAlign: 'center',
            fontFamily: fontFamilyFor(layout.date.fontFamily, NUMERIC_FONT),
            fontSize: scaledSize(layout.date, 9),
            color: layout.date.color || '#6B5B44',
            letterSpacing: px(1.2),
            fontWeight: layout.date.bold ? '900' : '600',
            transform: [{ rotate: `${layout.date.rotation || 0}deg` }],
          }}
        >
          {invitation.date_str}
          {invitation.time_str ? ` ${formatDisplayTime(invitation.time_str)}` : ''}
        </Text>
      )}

      {/* 예식장 */}
      {layout.venue && invitation.venue && (() => {
        const venueSize = scaledSize(layout.venue, 9);
        const venueLines = splitManualLines(invitation.venue);
        return (
          <View
            style={{
              position: 'absolute',
              left: (layout.venue.x / 100) * width,
              top: (layout.venue.y / 100) * height,
              width: ((layout.venue.w ?? 100) / 100) * width,
              transform: [{ rotate: `${layout.venue.rotation || 0}deg` }],
            }}
          >
            {venueLines.map((line, idx) => (
              <Text
                key={`venue-line-${idx}`}
                numberOfLines={1}
                ellipsizeMode="clip"
                style={{
                  textAlign: 'center',
                  fontFamily: fontFamilyFor(layout.venue.fontFamily),
                  fontSize: venueSize,
                  lineHeight: venueSize * 1.55,
                  color: layout.venue.color || '#6B5B44',
                  fontWeight: layout.venue.bold ? '900' : '500',
                }}
              >
                {line || ' '}
              </Text>
            ))}
          </View>
        );
      })()}

      {/* 큰 날짜 (월/일 두 줄) — invitation.layout.dateBig 있을 때만 */}
      {layout.dateBig && invitation.date_str && (() => {
        const m = (invitation.date_str || '').match(/\d+\.(\d+)\.(\d+)/);
        if (!m) return null;
        const sizePx = scaledSize(layout.dateBig, 28);
        return (
          <Text
            style={{
              position: 'absolute',
              left: (layout.dateBig.x / 100) * width,
              top: (layout.dateBig.y / 100) * height,
              width: ((layout.dateBig.w ?? 100) / 100) * width,
              textAlign: 'center',
              fontFamily: fontFamilyFor(layout.dateBig.fontFamily),
              fontSize: sizePx,
              color: layout.dateBig.color || '#2C2A28',
              fontWeight: layout.dateBig.bold ? '900' : '300',
              letterSpacing: 1,
              lineHeight: sizePx * 1.1,
              transform: [{ rotate: `${layout.dateBig.rotation || 0}deg` }],
            }}
          >
            {`${m[1]}.\n${m[2]}.`}
          </Text>
        );
      })()}

      {/* 인사말 — 템플릿이 greeting 정의했을 때 (예: minimal-4 "결 혼 합 니 다") */}
      {layout.greeting && template.text?.greeting?.text && (
        <Text
          numberOfLines={1}
          style={{
            position: 'absolute',
            left: (layout.greeting.x / 100) * width,
            top: (layout.greeting.y / 100) * height,
            width: ((layout.greeting.w ?? 100) / 100) * width,
            textAlign: 'center',
            fontFamily: fontFamilyFor(layout.greeting.fontFamily),
            fontSize: scaledSize(layout.greeting, 12),
            color: layout.greeting.color || '#5A5854',
            fontWeight: layout.greeting.bold ? '900' : '500',
            letterSpacing: px(1),
            transform: [{ rotate: `${layout.greeting.rotation || 0}deg` }],
          }}
        >
          {template.text.greeting.text}
        </Text>
      )}
    </View>
  );
}
