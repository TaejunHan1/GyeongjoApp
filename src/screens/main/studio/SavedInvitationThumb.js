// src/screens/main/studio/SavedInvitationThumb.js
// 저장된 청첩장 미리보기 (layout JSON 그대로 적용)
import React, { memo, useMemo, useState, useEffect } from "react";
import { ActivityIndicator, View, Text, Image } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Svg, { Defs, ClipPath, Path, Image as SvgImage } from "react-native-svg";
import { A6_ASPECT_RATIO, MOBILE_TEMPLATES } from "./mobileTemplateConfigs";
import { getStudioDecorationElement } from "./studioElements";
import { normalizePublicWebUrl } from "../../../lib/webLinks";

const SERIF_FONT = "NanumMyeongjo";
const NUMERIC_FONT = "GowunDodum";

const normalizeSavedFontFamily = (fontFamily) => {
  if (!fontFamily) return fontFamily;
  if (["AppleMyungjo", "Times New Roman", "serif"].includes(fontFamily))
    return SERIF_FONT;
  if (["Helvetica Neue", "System", "sans-serif"].includes(fontFamily))
    return NUMERIC_FONT;
  return fontFamily;
};

const fontFamilyFor = (fontFamily, fallback = SERIF_FONT) =>
  normalizeSavedFontFamily(fontFamily) || fallback;

const splitManualLines = (value) => String(value ?? "").split(/\r?\n/);

const estimateManualTextWidth = (lines, fontSize, letterSpacing = 0) => {
  const longest = lines.reduce(
    (max, line) => Math.max(max, String(line || " ").length),
    1,
  );
  return (
    longest * (fontSize * 0.82 + Math.max(0, letterSpacing)) + fontSize * 2
  );
};

const formatDisplayTime = (timeStr) => {
  if (!timeStr) return "";
  const value = String(timeStr).trim();
  const koreanMatch = value.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (koreanMatch) {
    return `${koreanMatch[1]} ${Number(koreanMatch[2])}:${koreanMatch[3]}`;
  }
  const englishMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!englishMatch) return value;
  const period = englishMatch[3].toUpperCase() === "PM" ? "오후" : "오전";
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
    case "circle":
      return { borderRadius: w / 2 };
    case "arch":
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

export const getOptimizedInvitationPhotoUrl = (photoUrl, targetWidth = 240) => {
  if (!photoUrl || typeof photoUrl !== "string") return photoUrl;
  if (!photoUrl.includes("/storage/v1/object/public/")) return photoUrl;

  const pixelWidth = Math.max(160, Math.min(900, Math.round(targetWidth)));
  const separator = photoUrl.includes("?") ? "&" : "?";

  return (
    photoUrl.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    ) + `${separator}width=${pixelWidth}&quality=62`
  );
};

const parseWeddingDate = (dateStr) => {
  const m = (dateStr || "").match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

const CALENDAR_STYLE_THUMB = {
  heart: { accent: "#F1B7BE", text: "#3A3732" },
  circle: { accent: "#A96770", text: "#3A3732" },
  ring: { accent: "#A8895A", text: "#2C2A28" },
  underline: { accent: "#722F37", text: "#3A3732" },
  minimal: { accent: "#111827", text: "#222222" },
  classic: { accent: "#8B6F47", text: "#2F2A25" },
  dot: { accent: "#C8898E", text: "#3A3732" },
  vertical: { accent: "#6B4A3A", text: "#2C2A28" },
  band: { accent: "#2C3E50", text: "#1F2933" },
};

function MiniCalendarThumb({ dateStr, width, height, styleId = "heart" }) {
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
  const weekCount = cells.length / 7;
  const weeks = Array.from({ length: weekCount }, (_, row) =>
    cells.slice(row * 7, row * 7 + 7),
  );
  const calendarStyle =
    CALENDAR_STYLE_THUMB[styleId] || CALENDAR_STYLE_THUMB.heart;
  const accent = calendarStyle.accent;
  const textColor = calendarStyle.text;
  const monthNumber = String(month + 1).padStart(2, "0");
  const dayNumber = String(selectedDay).padStart(2, "0");
  const weekdaysEn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const weekdaysKo = ["일", "월", "화", "수", "목", "금", "토"];

  const renderGrid = ({
    label = `${year}. ${monthNumber}`,
    weekdays = weekdaysEn,
    mode = "heart",
    box = false,
    xPad = Math.max(1, width * 0.035),
  } = {}) => {
    const innerW = Math.max(1, width - xPad * 2);
    const cellW = innerW / 7;
    const headerH = mode === "poster" ? 0 : height * 0.18;
    const weekdaysH = height * 0.13;
    const rowH = Math.max(
      1,
      (height - headerH - weekdaysH - (box ? 4 : 0)) / weekCount,
    );
    return (
      <View
        style={[
          { width, height, paddingHorizontal: xPad },
          box && {
            borderWidth: 0.7,
            borderColor: "rgba(169,103,112,0.35)",
            backgroundColor: "rgba(255,248,249,0.6)",
            paddingVertical: 2,
          },
        ]}
      >
        {!!label && (
          <Text
            style={{
              height: headerH,
              textAlign: "center",
              fontSize: Math.max(5, headerH * 0.55),
              fontWeight: "800",
              color: mode === "minimal" ? textColor : accent,
              letterSpacing: 0.5,
              lineHeight: headerH,
            }}
          >
            {label}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: mode === "line" ? 0.6 : 0,
            borderBottomColor: "rgba(168,137,90,0.35)",
          }}
        >
          {weekdays.map((d, i) => (
            <Text
              key={`${d}-${i}`}
              style={{
                width: cellW,
                height: weekdaysH,
                textAlign: "center",
                fontSize: Math.max(3, weekdaysH * 0.42),
                fontWeight: "800",
                color:
                  i === 0
                    ? styleId === "minimal"
                      ? textColor
                      : "#C98B92"
                    : textColor,
                lineHeight: weekdaysH,
              }}
            >
              {d}
            </Text>
          ))}
        </View>
        {weeks.map((week, rowIndex) => (
          <View
            key={`week-${rowIndex}`}
            style={{ flexDirection: "row", width: innerW }}
          >
            {week.map((day, colIndex) => {
              const selected = day === selectedDay;
              const color = day
                ? colIndex === 0
                  ? styleId === "minimal"
                    ? textColor
                    : "#C98B92"
                  : textColor
                : "transparent";
              return (
                <View
                  key={`day-${rowIndex}-${colIndex}`}
                  style={{
                    width: cellW,
                    height: rowH,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: box ? 0.35 : 0,
                    borderColor: "rgba(169,103,112,0.13)",
                  }}
                >
                  {selected && mode === "heart" ? (
                    <View
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: Math.max(10, rowH * 1.22),
                          color: accent,
                          lineHeight: Math.max(10, rowH * 1.18),
                        }}
                      >
                        ♥
                      </Text>
                      <Text
                        style={{
                          position: "absolute",
                          fontSize: Math.max(3, rowH * 0.34),
                          fontWeight: "900",
                          color: "#4A3838",
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : selected && mode === "box" ? (
                    <View
                      style={{
                        width: Math.max(9, rowH * 0.78),
                        height: Math.max(9, rowH * 0.78),
                        backgroundColor: accent,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: Math.max(3, rowH * 0.34),
                          fontWeight: "900",
                          color: "#FFFFFF",
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : selected && mode === "line" ? (
                    <View
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: Math.max(4, rowH * 0.42),
                          fontWeight: "900",
                          color: textColor,
                        }}
                      >
                        {day}
                      </Text>
                      <View
                        style={{
                          width: Math.max(7, rowH * 0.7),
                          height: 1,
                          backgroundColor: accent,
                          marginTop: 0.5,
                        }}
                      />
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontSize: Math.max(4, rowH * 0.42),
                        fontWeight: selected ? "900" : "500",
                        color: selected ? accent : color,
                      }}
                    >
                      {day || ""}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  if (styleId === "circle") {
    return (
      <View
        style={{
          width,
          height,
          paddingHorizontal: Math.max(2, width * 0.055),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            padding: Math.max(2, height * 0.045),
            backgroundColor: "rgba(255,252,250,0.72)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "stretch" }}>
            <View
              style={{
                width: "34%",
                alignItems: "center",
                justifyContent: "center",
                borderRightWidth: 0.7,
                borderRightColor: "rgba(169,103,112,0.28)",
                marginRight: width * 0.035,
              }}
            >
              <Text
                style={{
                  fontSize: Math.max(3, height * 0.075),
                  fontWeight: "700",
                  color: "#8B5A60",
                }}
              >
                {year}
              </Text>
              <Text
                style={{
                  marginTop: height * 0.01,
                  fontSize: Math.max(11, height * 0.28),
                  fontWeight: "300",
                  color: textColor,
                }}
              >
                {dayNumber}
              </Text>
              <Text
                style={{
                  fontSize: Math.max(3, height * 0.075),
                  fontWeight: "800",
                  color: accent,
                }}
              >
                {monthNumber}월
              </Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: height * 0.02,
                }}
              >
                {weekdaysKo.map((d, i) => (
                  <Text
                    key={`box-week-${d}`}
                    style={{
                      fontSize: Math.max(3, height * 0.06),
                      fontWeight: "800",
                      color: i === 0 ? "#A96770" : "#6B625E",
                    }}
                  >
                    {d}
                  </Text>
                ))}
              </View>
              {weeks.map((week, rowIndex) => (
                <View
                  key={`box-row-${rowIndex}`}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: rowIndex === 0 ? 0 : height * 0.006,
                  }}
                >
                  {week.map((day, colIndex) => {
                    const selected = day === selectedDay;
                    return (
                      <View
                        key={`box-day-${rowIndex}-${colIndex}`}
                        style={{
                          width: width * 0.02,
                          height: Math.max(4, height * 0.055),
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: selected ? accent : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: Math.max(2.5, height * 0.04),
                            fontWeight: selected ? "900" : "600",
                            color: !day
                              ? "transparent"
                              : selected
                                ? "#FFFFFF"
                                : colIndex === 0
                                  ? "#A96770"
                                  : "#4B4542",
                          }}
                        >
                          {day || ""}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }
  if (styleId === "ring") {
    return (
      <View
        style={{
          width,
          height,
          paddingHorizontal: Math.max(2, width * 0.065),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: height * 0.06,
          }}
        >
          <Text
            style={{
              fontSize: Math.max(3, height * 0.08),
              fontWeight: "700",
              color: accent,
            }}
          >
            {year}
          </Text>
          <Text
            style={{
              fontSize: Math.max(10, height * 0.25),
              fontWeight: "300",
              color: textColor,
            }}
          >
            {monthNumber}
          </Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: Math.max(3, height * 0.07),
                fontWeight: "800",
                color: "#6B625E",
              }}
            >
              {weekdaysKo[date.getDay()]}
            </Text>
            <Text
              style={{
                fontSize: Math.max(7, height * 0.17),
                fontWeight: "900",
                color: accent,
              }}
            >
              {dayNumber}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: height * 0.035,
          }}
        >
          {weekdaysEn.map((d, i) => (
            <Text
              key={`line-week-${d}`}
              style={{
                fontSize: Math.max(2.5, height * 0.055),
                fontWeight: i === date.getDay() ? "900" : "600",
                color: i === date.getDay() ? accent : "#8B8580",
              }}
            >
              {d}
            </Text>
          ))}
        </View>
      </View>
    );
  }
  if (styleId === "underline") {
    return (
      <View
        style={{
          width,
          height,
          paddingHorizontal: Math.max(2, width * 0.05),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: height * 0.03,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: Math.max(10, height * 0.22),
                fontWeight: "900",
                color: textColor,
              }}
            >
              {monthNumber}.{dayNumber}
            </Text>
          </View>
          <Text
            style={{
              fontSize: Math.max(4, height * 0.11),
              fontWeight: "700",
              color: accent,
            }}
          >
            {year}
          </Text>
        </View>
        {renderGrid({ xPad: 0, label: "", mode: "line" })}
      </View>
    );
  }
  if (styleId === "minimal") {
    return (
      <View
        style={{
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: Math.max(2, width * 0.06),
        }}
      >
        <Text
          style={{
            fontSize: Math.max(3, height * 0.08),
            fontWeight: "700",
            color: "#6B7280",
            letterSpacing: 1,
          }}
        >
          WEDDING DAY
        </Text>
        <Text
          style={{
            marginTop: height * 0.03,
            fontSize: Math.max(14, height * 0.28),
            fontWeight: "300",
            color: textColor,
          }}
        >
          {monthNumber}.{dayNumber}
        </Text>
        <View
          style={{
            width: "76%",
            height: 0.7,
            backgroundColor: "#111827",
            marginVertical: height * 0.06,
          }}
        />
        <Text
          style={{
            fontSize: Math.max(4, height * 0.09),
            fontWeight: "700",
            color: "#374151",
          }}
        >
          {year} / {weekdaysEn[date.getDay()]}
        </Text>
      </View>
    );
  }

  if (styleId === "classic") {
    return (
      <View
        style={{
          width,
          height,
          paddingHorizontal: Math.max(2, width * 0.055),
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontSize: Math.max(4, height * 0.09),
            fontWeight: "700",
            color: accent,
            marginBottom: height * 0.02,
          }}
        >
          {year}.{monthNumber}
        </Text>
        {renderGrid({ xPad: 0, label: "", mode: "line" })}
      </View>
    );
  }

  if (styleId === "dot") {
    return (
      <View
        style={{
          width,
          height,
          paddingHorizontal: Math.max(2, width * 0.06),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "center",
            marginBottom: height * 0.025,
          }}
        >
          <Text
            style={{
              fontSize: Math.max(8, height * 0.16),
              fontWeight: "300",
              color: textColor,
            }}
          >
            {monthNumber}
          </Text>
          <Text
            style={{
              marginLeft: 3,
              fontSize: Math.max(3, height * 0.07),
              fontWeight: "800",
              color: accent,
            }}
          >
            {year}
          </Text>
        </View>
        {renderGrid({ xPad: 0, label: "", mode: "line" })}
      </View>
    );
  }

  if (styleId === "vertical") {
    return (
      <View
        style={{
          width,
          height,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: Math.max(2, width * 0.07),
        }}
      >
        <View style={{ alignItems: "center", marginRight: width * 0.06 }}>
          <Text
            style={{
              fontSize: Math.max(3, height * 0.075),
              fontWeight: "800",
              color: accent,
            }}
          >
            {year}
          </Text>
          <Text
            style={{
              marginTop: height * 0.01,
              fontSize: Math.max(12, height * 0.3),
              fontWeight: "300",
              color: textColor,
            }}
          >
            {dayNumber}
          </Text>
          <Text
            style={{
              fontSize: Math.max(3, height * 0.075),
              fontWeight: "800",
              color: accent,
            }}
          >
            {monthNumber}월
          </Text>
        </View>
        <View
          style={{
            width: 0.7,
            height: "62%",
            backgroundColor: "rgba(107,74,58,0.25)",
            marginRight: width * 0.06,
          }}
        />
        <View style={{ alignItems: "center" }}>
          {weekdaysKo.map((d, i) => (
            <Text
              key={`vertical-week-${d}`}
              style={{
                fontSize: Math.max(3, height * 0.06),
                fontWeight: i === date.getDay() ? "900" : "600",
                color: i === date.getDay() ? accent : "#8B8580",
              }}
            >
              {d}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  if (styleId === "band") {
    return (
      <View
        style={{
          width,
          height,
          paddingHorizontal: Math.max(2, width * 0.06),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(44,62,80,0.08)",
            paddingVertical: height * 0.06,
            paddingHorizontal: width * 0.04,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: Math.max(3, height * 0.075),
                fontWeight: "800",
                color: accent,
              }}
            >
              {year}
            </Text>
            <Text
              style={{
                fontSize: Math.max(10, height * 0.24),
                fontWeight: "900",
                color: textColor,
              }}
            >
              {monthNumber}.{dayNumber}
            </Text>
          </View>
          <Text
            style={{
              marginTop: height * 0.025,
              textAlign: "right",
              fontSize: Math.max(3, height * 0.065),
              fontWeight: "700",
              color: "#667085",
            }}
          >
            {weekdaysEn[date.getDay()]}
          </Text>
        </View>
      </View>
    );
  }

  return renderGrid();
}

function SavedInvitationThumb({ invitation, width = 100, side = "front" }) {
  const template = MOBILE_TEMPLATES.find(
    (t) => t.id === invitation.template_id,
  );
  const preferredPhotoUrl = invitation.photo_url;
  const [failedOptimizedPhoto, setFailedOptimizedPhoto] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(
    Boolean(invitation.photo_url),
  );
  const photoUrl = useMemo(
    () => (failedOptimizedPhoto ? invitation.photo_url : preferredPhotoUrl),
    [failedOptimizedPhoto, invitation.photo_url, preferredPhotoUrl],
  );

  useEffect(() => {
    setFailedOptimizedPhoto(false);
    setPhotoLoading(Boolean(invitation.photo_url));
  }, [invitation.photo_url, preferredPhotoUrl]);

  // photoReady prefetch 로직 제거 — 즉시 카드 표시.
  // 사진은 RN Image 컴포넌트가 자동 캐싱/로드하고, 로드 전엔 placeholder 배경색이 보임.

  if (!template) {
    return (
      <View
        style={{
          width,
          aspectRatio: 1 / A6_ASPECT_RATIO,
          backgroundColor: "#F0F0F0",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 10, color: "#999" }}>템플릿 없음</Text>
      </View>
    );
  }

  const height = width * A6_ASPECT_RATIO;
  const layout = invitation.layout || {};
  // 저장 시점 canvas 너비 기준으로 스케일 (없으면 260 fallback)
  const refWidth = layout.canvas_w || 260;
  const refHeight = layout.canvas_h || refWidth * A6_ASPECT_RATIO;
  const px = (val) => (val / refWidth) * width;
  const py = (val) => (val / refHeight) * height;
  const scaleXValue = (val, fallback = 0) => {
    const raw = val ?? fallback;
    return Math.abs(raw) <= 100 ? (raw / 100) * width : px(raw);
  };
  const scaleYValue = (val, fallback = 0) => {
    const raw = val ?? fallback;
    return Math.abs(raw) <= 100 ? (raw / 100) * height : py(raw);
  };
  const scaleWidthValue = (val, fallback = 100) => {
    const raw = val ?? fallback;
    return Math.abs(raw) <= 100 ? (raw / 100) * width : px(raw);
  };
  const scaleHeightValue = (val, fallback = 0) => {
    const raw = val ?? fallback;
    return Math.abs(raw) <= 100 ? (raw / 100) * height : py(raw);
  };
  const scaledSize = (el, fallback) => {
    if (el?.size_pct != null) return (el.size_pct / 100) * width;
    return px(el?.size ?? fallback);
  };
  const scaledBoxWidth = (el, fallback = 100, minWidth = 0) =>
    Math.max(scaleWidthValue(el?.w, fallback), minWidth);
  const back = layout.back || {};
  const frontData = layout.frontData || {};
  const backData = layout.backData || {};
  const templateBack = template.back || {};
  const renderDecoration = (item) => {
    if (!item || item.hidden) return null;
    const element = getStudioDecorationElement(item.elementId);
    if (!element) return null;
    return (
      <Image
        key={item.id || `${item.elementId}-${item.x}-${item.y}`}
        pointerEvents="none"
        source={element.source}
        style={{
          position: "absolute",
          left: scaleXValue(item.x),
          top: scaleYValue(item.y),
          width: scaleWidthValue(item.w, 24),
          height: scaleHeightValue(item.h, 24),
          resizeMode: "contain",
          transform: [{ rotate: `${item.rotation || 0}deg` }],
        }}
      />
    );
  };
  const renderMobileQr = () => {
    const item = layout.mobileQr;
    if (!item || item.hidden || !item.qrValue) return null;
    const size = scaleWidthValue(item.w, 18);
    const qrSize = Math.max(18, size);

    return (
      <View
        key="mobile-qr"
        style={{
          position: "absolute",
          left: scaleXValue(item.x),
          top: scaleYValue(item.y),
          width: size,
          height: size,
          backgroundColor: "transparent",
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: `${item.rotation || 0}deg` }],
        }}
      >
        <QRCode
          value={normalizePublicWebUrl(item.qrValue)}
          size={qrSize}
          color={item.color || "#111827"}
          backgroundColor="transparent"
        />
      </View>
    );
  };
  const renderPositionedText = (el, value, options = {}) => {
    if (!el || el.hidden || !value) return null;
    const sizePx = scaledSize(el, options.fallbackSize || 10);
    const manualLines = options.preserveManualLines
      ? splitManualLines(value)
      : null;
    const letterSpacing =
      el.letterSpacing != null
        ? px(el.letterSpacing)
        : options.letterSpacing != null
          ? px(options.letterSpacing)
          : 0;
    const manualWidth = manualLines
      ? estimateManualTextWidth(manualLines, sizePx, letterSpacing)
      : 0;
    const boxWidth = Math.max(
      scaledBoxWidth(
        el,
        options.fallbackWidth || 80,
        options.minWidth ? options.minWidth * width : 0,
      ),
      options.minPxWidth || 0,
      manualWidth,
    );
    const lineCount = manualLines
      ? Math.max(1, manualLines.length)
      : options.lines || 1;
    const lineHeight = options.lineHeight
      ? options.lineHeight(sizePx)
      : manualLines || lineCount > 1
        ? sizePx * 1.55
        : undefined;
    const boxHeight = options.height
      ? options.height(sizePx, lineCount)
      : manualLines
        ? sizePx * 1.55 * lineCount
        : sizePx * (lineCount === 1 ? 2.2 : lineCount * 1.45);
    const visualTopCorrection =
      typeof options.visualTopCorrection === "function"
        ? options.visualTopCorrection(sizePx, lineCount)
        : options.visualTopCorrection || 0;
    return (
      <View
        style={{
          position: "absolute",
          left: scaleXValue(el.x),
          top: scaleYValue(el.y) - visualTopCorrection,
          width: boxWidth,
          height: boxHeight,
          transform: [{ rotate: `${el.rotation || 0}deg` }],
        }}
      >
        {manualLines ? (
          manualLines.map((line, idx) => (
            <Text
              key={`${options.keyPrefix || "text"}-line-${idx}`}
              numberOfLines={1}
              ellipsizeMode="clip"
              style={{
                textAlign: options.align || "center",
                fontFamily: fontFamilyFor(
                  el.fontFamily,
                  options.fontFallback || SERIF_FONT,
                ),
                fontSize: sizePx,
                lineHeight,
                color: el.color || options.color || "#3A3732",
                fontWeight: el.bold ? "900" : options.weight || "500",
                letterSpacing,
              }}
            >
              {line || " "}
            </Text>
          ))
        ) : (
          <Text
            numberOfLines={lineCount === 1 ? 1 : undefined}
            ellipsizeMode="clip"
            style={{
              textAlign: options.align || "center",
              fontFamily: fontFamilyFor(
                el.fontFamily,
                options.fontFallback || SERIF_FONT,
              ),
              fontSize: sizePx,
              lineHeight,
              color: el.color || options.color || "#3A3732",
              fontWeight: el.bold ? "900" : options.weight || "500",
              letterSpacing,
            }}
          >
            {value}
          </Text>
        )}
      </View>
    );
  };

  if (side === "back" && template.hasBack) {
    const formatParentLine = (father, mother, childLabel) => {
      const names = [father, mother]
        .map((v) => (v || "").trim())
        .filter(Boolean);
      if (names.length === 0) return "";
      return `${names.join(" · ")}의 ${childLabel}`;
    };

    const renderBackText = (key, value, options = {}) => {
      const el = back[key] || templateBack[key];
      return renderPositionedText(el, value, {
        visualTopCorrection: (sizePx) => sizePx * 0.58,
        ...options,
        keyPrefix: key,
      });
    };

    return (
      <View
        style={{
          width,
          height,
          backgroundColor: template.bgColor || "#FFFFFF",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {template.backBlank ? (
          <Image
            source={template.backBlank}
            style={{ position: "absolute", width, height }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              position: "absolute",
              width,
              height,
              backgroundColor: "#FFFDF9",
            }}
          />
        )}

        {(layout.backDecorations || []).map(renderDecoration)}

        {renderBackText("title", "INVITATION", {
          weight: "400",
          letterSpacing: 0,
        })}
        {renderBackText("invitation", backData.invitationText, {
          preserveManualLines: true,
          minWidth: 0.74,
          weight: "400",
          letterSpacing: 0.2,
        })}
        {renderBackText(
          "groomParents",
          formatParentLine(
            backData.showGroomFather === false ? "" : backData.groomFather,
            backData.showGroomMother === false ? "" : backData.groomMother,
            backData.groomRelation || "아들",
          ),
          {
            align: "left",
            weight: "400",
          },
        )}
        {renderBackText(
          "brideParents",
          formatParentLine(
            backData.showBrideFather === false ? "" : backData.brideFather,
            backData.showBrideMother === false ? "" : backData.brideMother,
            backData.brideRelation || "딸",
          ),
          {
            align: "left",
            weight: "400",
          },
        )}
        {renderBackText("groomName", invitation.groom, {
          letterSpacing: 2,
        })}
        {renderBackText("brideName", invitation.bride, {
          letterSpacing: 2,
        })}
        {renderBackText("dateLabel", "일  시  |", {
          align: "left",
        })}
        {renderBackText("venueLabel", "장  소  |", {
          align: "left",
        })}
        {renderBackText(
          "date",
          `${invitation.date_str || ""}${invitation.time_str ? ` ${formatDisplayTime(invitation.time_str)}` : ""}`,
          {
            align: "left",
          },
        )}
        {!!invitation.venue &&
          renderBackText("venue", invitation.venue, {
            preserveManualLines: true,
            align: "left",
          })}

        {["infoTopDivider", "infoBottomDivider", "thanksDivider"].map((key) => {
          const el = back[key] || templateBack[key];
          if (!el || el.hidden) return null;
          return (
            <View
              key={key}
              style={{
                position: "absolute",
                left: scaleXValue(el.x),
                top: scaleYValue(el.y),
                width: scaleWidthValue(el.w, 50),
                height: Math.max(1, scaleHeightValue(el.h, 0)),
                backgroundColor: el.color || "#B6B2AD",
                transform: [{ rotate: `${el.rotation || 0}deg` }],
              }}
            />
          );
        })}

        {(back.calendar || templateBack.calendar) &&
          (() => {
            const calendarEl = back.calendar || templateBack.calendar;
            if (calendarEl.hidden) return null;
            return (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: scaleXValue(calendarEl.x),
                  top: scaleYValue(calendarEl.y),
                  width: scaleWidthValue(calendarEl.w, 58),
                  height: scaleHeightValue(calendarEl.h, 25),
                  transform: [{ rotate: `${calendarEl.rotation || 0}deg` }],
                }}
              >
                <MiniCalendarThumb
                  dateStr={invitation.date_str}
                  width={scaleWidthValue(calendarEl.w, 58)}
                  height={scaleHeightValue(calendarEl.h, 25)}
                  styleId={calendarEl.calendarStyle}
                />
              </View>
            );
          })()}
      </View>
    );
  }

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: template.bgColor || "#FFFFFF",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {(layout.frontDecorations || []).map(renderDecoration)}

      {/* 사진 — blank.png 아래 layer (cutout 템플릿이면 사진이 구멍으로 비침) */}
      {layout.photo &&
        !layout.photo.hidden &&
        (layout.photo.shape === "oval" ? (
          <View
            style={{
              position: "absolute",
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
                <ClipPath id={`eggClipThumb-${invitation.id || "x"}`}>
                  <Path
                    d={buildEggPath(
                      (layout.photo.w / 100) * width,
                      (layout.photo.h / 100) * height,
                    )}
                  />
                </ClipPath>
              </Defs>
              <Path
                d={buildEggPath(
                  (layout.photo.w / 100) * width,
                  (layout.photo.h / 100) * height,
                )}
                fill="rgba(168,149,119,0.15)"
              />
              {photoUrl && (
                <SvgImage
                  href={{ uri: photoUrl }}
                  x={0}
                  y={0}
                  width={(layout.photo.w / 100) * width}
                  height={(layout.photo.h / 100) * height}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#eggClipThumb-${invitation.id || "x"})`}
                  onLoad={() => setPhotoLoading(false)}
                  onError={() => {
                    if (
                      photoUrl !== invitation.photo_url &&
                      invitation.photo_url
                    ) {
                      setFailedOptimizedPhoto(true);
                      setPhotoLoading(true);
                      return;
                    }
                    setPhotoLoading(false);
                  }}
                />
              )}
            </Svg>
            {photoUrl && photoLoading && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.34)",
                }}
              >
                <ActivityIndicator size="small" color="#A89577" />
              </View>
            )}
          </View>
        ) : (
          <View
            style={{
              position: "absolute",
              left: (layout.photo.x / 100) * width,
              top: (layout.photo.y / 100) * height,
              width: (layout.photo.w / 100) * width,
              height: (layout.photo.h / 100) * height,
              overflow: "hidden",
              backgroundColor: "rgba(168,149,119,0.15)",
              transform: [{ rotate: `${layout.photo.rotation || 0}deg` }],
              ...getPhotoRadius(
                layout.photo.shape,
                (layout.photo.w / 100) * width,
                layout.photo.radius ??
                  (template?.id === "minimal-5" ? 0 : undefined),
              ),
            }}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                fadeDuration={0}
                style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                onLoadEnd={() => setPhotoLoading(false)}
                onError={(e) => {
                  if (
                    photoUrl !== invitation.photo_url &&
                    invitation.photo_url
                  ) {
                    setFailedOptimizedPhoto(true);
                    setPhotoLoading(true);
                    return;
                  }
                  setPhotoLoading(false);
                  console.warn(
                    "[SavedInvitationThumb] image load error:",
                    photoUrl,
                    e.nativeEvent,
                  );
                }}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#A89577",
                    fontSize: px(10),
                    letterSpacing: 1,
                  }}
                >
                  PHOTO
                </Text>
              </View>
            )}
            {photoUrl && photoLoading && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.34)",
                }}
              >
                <ActivityIndicator size="small" color="#A89577" />
              </View>
            )}
          </View>
        ))}

      {/* 빈 템플릿 — 사진 위 layer (cover로 캔버스 가득) */}
      <Image
        source={template.blank}
        style={{ position: "absolute", width, height }}
        resizeMode="cover"
      />

      {/* 베이크인 마스크 (& 등) — 템플릿 위에 얹힘 */}
      {(template.masks || []).map((m, i) => (
        <View
          key={`mask-${i}`}
          style={{
            position: "absolute",
            left: ((m.x - m.w / 2) / 100) * width,
            top: ((m.y - m.h / 2) / 100) * height,
            width: (m.w / 100) * width,
            height: (m.h / 100) * height,
            backgroundColor: template.bgColor || "#FBF9F3",
          }}
        />
      ))}

      {/* 신랑 */}
      {layout.groom &&
        !layout.groom.hidden &&
        invitation.groom &&
        (() => {
          const groomSize = scaledSize(layout.groom, 13);
          return renderPositionedText(layout.groom, invitation.groom, {
            fallbackSize: 13,
            fallbackWidth: 35,
            minPxWidth: groomSize * 5,
            color: "#3A2E22",
            weight: "500",
            height: (size) => size * 2.2,
          });
        })()}

      {/* 신부 */}
      {layout.bride &&
        !layout.bride.hidden &&
        invitation.bride &&
        (() => {
          const brideSize = scaledSize(layout.bride, 13);
          return renderPositionedText(layout.bride, invitation.bride, {
            fallbackSize: 13,
            fallbackWidth: 35,
            minPxWidth: brideSize * 5,
            color: "#3A2E22",
            weight: "500",
            height: (size) => size * 2.2,
          });
        })()}

      {/* 날짜 */}
      {layout.date &&
        !layout.date.hidden &&
        invitation.date_str &&
        renderPositionedText(
          layout.date,
          `${invitation.date_str}${invitation.time_str ? ` ${formatDisplayTime(invitation.time_str)}` : ""}`,
          {
            fallbackSize: 9,
            fallbackWidth: 100,
            fontFallback: NUMERIC_FONT,
            color: "#6B5B44",
            weight: "600",
            letterSpacing: 1.2,
            height: (size) => size * 2.2,
          },
        )}

      {/* 예식장 */}
      {layout.venue &&
        !layout.venue.hidden &&
        invitation.venue &&
        (() => {
          const venueSize = scaledSize(layout.venue, 9);
          const venueLines = splitManualLines(invitation.venue);
          return (
            <View
              style={{
                position: "absolute",
                left: (layout.venue.x / 100) * width,
                top: (layout.venue.y / 100) * height,
                width: scaledBoxWidth(layout.venue, 100),
                transform: [{ rotate: `${layout.venue.rotation || 0}deg` }],
              }}
            >
              {venueLines.map((line, idx) => (
                <Text
                  key={`venue-line-${idx}`}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  style={{
                    textAlign: "center",
                    fontFamily: fontFamilyFor(layout.venue.fontFamily),
                    fontSize: venueSize,
                    lineHeight: venueSize * 1.55,
                    color: layout.venue.color || "#6B5B44",
                    fontWeight: layout.venue.bold ? "900" : "500",
                  }}
                >
                  {line || " "}
                </Text>
              ))}
            </View>
          );
        })()}

      {/* 큰 날짜 (월/일 두 줄) — invitation.layout.dateBig 있을 때만 */}
      {layout.dateBig &&
        !layout.dateBig.hidden &&
        invitation.date_str &&
        (() => {
          const m = (invitation.date_str || "").match(/\d+\.(\d+)\.(\d+)/);
          if (!m) return null;
          return renderPositionedText(layout.dateBig, `${m[1]}.\n${m[2]}.`, {
            fallbackSize: 28,
            fallbackWidth: 100,
            preserveManualLines: true,
            color: "#2C2A28",
            weight: "300",
            letterSpacing: 1,
            lineHeight: (size) => size * 1.1,
            height: (size) => size * 2.6,
          });
        })()}

      {/* 인사말 — 템플릿이 greeting 정의했을 때 */}
      {layout.greeting &&
        !layout.greeting.hidden &&
        (frontData.greetingText ?? template.text?.greeting?.text) &&
        renderPositionedText(
          layout.greeting,
          frontData.greetingText ?? template.text.greeting.text,
          {
            fallbackSize: 12,
            fallbackWidth: 100,
            preserveManualLines: true,
            align:
              layout.greeting.align ||
              template.text?.greeting?.align ||
              "center",
            color: "#5A5854",
            weight: "500",
            letterSpacing:
              layout.greeting.letterSpacing ??
              template.text?.greeting?.letterSpacing ??
              0,
          },
        )}
      {renderMobileQr()}
    </View>
  );
}

export default memo(
  SavedInvitationThumb,
  (prev, next) =>
    prev.width === next.width &&
    prev.side === next.side &&
    prev.invitation?.id === next.invitation?.id &&
    prev.invitation?.photo_url === next.invitation?.photo_url &&
    prev.invitation?.template_id === next.invitation?.template_id &&
    prev.invitation?.groom === next.invitation?.groom &&
    prev.invitation?.bride === next.invitation?.bride &&
    prev.invitation?.date_str === next.invitation?.date_str &&
    prev.invitation?.time_str === next.invitation?.time_str &&
    prev.invitation?.venue === next.invitation?.venue &&
    prev.invitation?.layout === next.invitation?.layout,
);
