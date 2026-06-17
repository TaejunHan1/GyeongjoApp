// src/screens/main/studio/PaperInvitationLayoutScreen.js
// 종이 청첩장 만들기 2단계 — 사진·텍스트 위치/크기 직접 조정
// - 요소 탭으로 선택 → 드래그로 이동 → 하단 툴바로 크기 조정
// - 완성 누르면 Supabase 저장
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  FlatList,
  Platform,
  PanResponder,
  Animated,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import Svg, { Defs, ClipPath, Path, Image as SvgImage } from "react-native-svg";
import { TC } from "../guides/tossStyle";
import LottieLoading from "../../../components/LottieLoading";
import {
  createPaperInvitation,
  updatePaperInvitation,
  uploadInvitationPhoto,
} from "../../../lib/paperInvitationHelper";
import { getUserEvents } from "../../../lib/supabaseHelper";
import {
  getPublicInvitationUrl,
  normalizePublicWebUrl,
} from "../../../lib/webLinks";
import {
  getStudioDecorationElement,
  STUDIO_DECORATION_ELEMENTS,
} from "./studioElements";

const MOBILE_QR_CARD_IMAGES = [
  require("../../../../assets/studio/icons/mobile-qr-cards/mobile-qr-card-ivory.png"),
  require("../../../../assets/studio/icons/mobile-qr-cards/mobile-qr-card-blue.png"),
  require("../../../../assets/studio/icons/mobile-qr-cards/mobile-qr-card-pink.png"),
  require("../../../../assets/studio/icons/mobile-qr-cards/mobile-qr-card-navy.png"),
];

// 계란 모양 path — 위가 좁고 아래가 넓은 비대칭 oval (vintage 템플릿 프레임 매칭)
const buildEggPath = (w, h) =>
  `M ${w / 2} 0 ` +
  `C ${w * 0.86} 0, ${w} ${h * 0.42}, ${w} ${h * 0.68} ` +
  `C ${w} ${h * 0.91}, ${w * 0.78} ${h}, ${w / 2} ${h} ` +
  `C ${w * 0.22} ${h}, 0 ${h * 0.91}, 0 ${h * 0.68} ` +
  `C 0 ${h * 0.42}, ${w * 0.14} 0, ${w / 2} 0 Z`;

const { width: SCREEN_W } = Dimensions.get("window");
// 카드 패딩 16 + 화면 여백 좌우 16
const CARD_INNER_PADDING = 16;
const A6_ASPECT_RATIO = 148 / 105;
const CANVAS_W = SCREEN_W - 32 - CARD_INNER_PADDING * 2;
const CANVAS_H = CANVAS_W * A6_ASPECT_RATIO;

// 사진 크기 최대값 — 캔버스를 넘어 크롭 효과처럼 확대 가능
const PHOTO_MAX = 500;
// 텍스트 글자 크기 범위
const TEXT_SIZE_MIN = 6;
const TEXT_SIZE_MAX = 150;
const BACK_DIVIDER_IDS = [
  "backInfoTopDivider",
  "backInfoBottomDivider",
  "backThanksDivider",
];
const isBackDivider = (id) => BACK_DIVIDER_IDS.includes(id);
const DECORATION_PREFIX = "decoration:";
const isDecorationElement = (id) =>
  typeof id === "string" && id.startsWith(DECORATION_PREFIX);
const MOBILE_QR_ID = "mobileQr";
const FRONT_ELEMENT_LABELS = {
  photo: "사진",
  groom: "신랑",
  connector: "&",
  bride: "신부",
  date: "일시",
  venue: "장소",
  dateBig: "큰 날짜",
  greeting: "인사말",
  [MOBILE_QR_ID]: "모바일 QR",
};
const BACK_ELEMENT_LABELS = {
  backTitle: "타이틀",
  backInvitation: "초대문구",
  backGroomParents: "신랑측",
  backGroomName: "신랑",
  backBrideParents: "신부측",
  backBrideName: "신부",
  backDateLabel: "일시 |",
  backDate: "일시",
  backVenueLabel: "장소 |",
  backVenue: "장소",
  backCalendar: "달력",
  backInfoTopDivider: "상단선",
  backInfoBottomDivider: "하단선",
  backThanksDivider: "감사선",
};
const ELEMENT_LABELS = {
  ...FRONT_ELEMENT_LABELS,
  ...BACK_ELEMENT_LABELS,
};

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
  const hour = Number(englishMatch[1]);
  const minute = englishMatch[2];
  const period = englishMatch[3].toUpperCase() === "PM" ? "오후" : "오전";
  return `${period} ${hour}:${minute}`;
};

// 텍스트 색상 옵션 — 청첩장에 어울리는 톤
const COLOR_OPTIONS = [
  // 무채색
  { id: "black", label: "검정", value: "#000000" },
  { id: "ink", label: "먹", value: "#2C2A28" },
  { id: "charcoal", label: "차콜", value: "#4A4A4A" },
  { id: "gray", label: "회색", value: "#8E9197" },
  { id: "lightgray", label: "연회색", value: "#C7C7C7" },
  { id: "white", label: "흰색", value: "#FFFFFF" },
  // 갈색 톤
  { id: "darkbrown", label: "진갈", value: "#4A2C20" },
  { id: "brown", label: "갈색", value: "#3A2E22" },
  { id: "mocha", label: "모카", value: "#6B4A3A" },
  { id: "olive", label: "올리브", value: "#6B5B44" },
  { id: "beige", label: "베이지", value: "#A89571" },
  { id: "gold", label: "골드", value: "#A8895A" },
  // 컬러
  { id: "wine", label: "와인", value: "#722F37" },
  { id: "rose", label: "로즈", value: "#C8898E" },
  { id: "pink", label: "핑크", value: "#F4A5B6" },
  { id: "lightpink", label: "연핑크", value: "#F8DAD0" },
  { id: "navy", label: "네이비", value: "#2C3E50" },
  { id: "darkblue", label: "진청", value: "#1F3A5F" },
  { id: "blue", label: "블루", value: "#3182F6" },
  { id: "forest", label: "포레스트", value: "#3C5A4E" },
];

// 폰트 옵션 — 무료 폰트 (assets/fonts에 ttf + App.js에서 Font.loadAsync로 로드)
const FONT_OPTIONS = [
  // 한글
  { id: "serif", label: "명조", sample: "가나", family: SERIF_FONT },
  { id: "sans", label: "고딕", sample: "가나", family: NUMERIC_FONT },
  {
    id: "nanum-myeongjo",
    label: "나눔명조",
    sample: "가나",
    family: "NanumMyeongjo",
  },
  { id: "hahmlet", label: "함렛", sample: "가나", family: "Hahmlet" },
  {
    id: "gowun-batang",
    label: "고운바탕",
    sample: "가나",
    family: "GowunBatang",
  },
  {
    id: "gowun-dodum",
    label: "고운돋움",
    sample: "가나",
    family: "GowunDodum",
  },
  { id: "sunflower", label: "선플라워", sample: "가나", family: "Sunflower" },
  {
    id: "black-han",
    label: "블랙한산스",
    sample: "가나",
    family: "BlackHanSans",
  },
  { id: "yeon-sung", label: "연성", sample: "가나", family: "YeonSung" },
  { id: "single-day", label: "싱글데이", sample: "가나", family: "SingleDay" },
  // 영문
  {
    id: "playfair",
    label: "Playfair",
    sample: "Aa",
    family: "PlayfairDisplay",
  },
  { id: "garamond", label: "Garamond", sample: "Aa", family: "EBGaramond" },
  { id: "cinzel", label: "Cinzel", sample: "Aa", family: "Cinzel" },
  { id: "great-vibes", label: "Vibes", sample: "Aa", family: "Great Vibes" },
  { id: "italianno", label: "Italianno", sample: "Aa", family: "Italianno" },
  { id: "dancing", label: "Dancing", sample: "Aa", family: "DancingScript" },
  { id: "tangerine", label: "Tangerine", sample: "Aa", family: "Tangerine" },
];

const CALENDAR_STYLE_OPTIONS = [
  {
    id: "heart",
    label: "하트형",
    icon: "heart",
    accent: "#F1B7BE",
    text: "#3A3732",
  },
  {
    id: "circle",
    label: "박스형",
    icon: "grid-outline",
    accent: "#A96770",
    text: "#3A3732",
  },
  {
    id: "ring",
    label: "라인형",
    icon: "reorder-two-outline",
    accent: "#A8895A",
    text: "#2C2A28",
  },
  {
    id: "underline",
    label: "포스터형",
    icon: "newspaper-outline",
    accent: "#722F37",
    text: "#3A3732",
  },
  {
    id: "minimal",
    label: "날짜형",
    icon: "calendar-clear-outline",
    accent: "#111827",
    text: "#222222",
  },
  {
    id: "classic",
    label: "클래식",
    icon: "calendar-number-outline",
    accent: "#8B6F47",
    text: "#2F2A25",
  },
  {
    id: "dot",
    label: "도트형",
    icon: "ellipsis-horizontal-circle-outline",
    accent: "#C8898E",
    text: "#3A3732",
  },
  {
    id: "vertical",
    label: "세로형",
    icon: "swap-vertical-outline",
    accent: "#6B4A3A",
    text: "#2C2A28",
  },
  {
    id: "band",
    label: "밴드형",
    icon: "reader-outline",
    accent: "#2C3E50",
    text: "#1F2933",
  },
];

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
    case "oval":
      // 진짜 계란/타원: percentage borderRadius 로 양축 모두 풀라운드
      return { borderRadius: "50%" };
    default:
      return { borderRadius: 6 };
  }
};

const parseWeddingDate = (dateStr) => {
  const m = (dateStr || "").match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

function MiniCalendar({ dateStr, width, height, styleId = "heart" }) {
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
  const weekCount = totalCells / 7;
  const weeks = Array.from({ length: weekCount }, (_, row) =>
    cells.slice(row * 7, row * 7 + 7),
  );
  const monthNumber = String(month + 1).padStart(2, "0");
  const dayNumber = String(selectedDay).padStart(2, "0");
  const weekdaysEn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const weekdaysKo = ["일", "월", "화", "수", "목", "금", "토"];
  const calendarStyle =
    CALENDAR_STYLE_OPTIONS.find((item) => item.id === styleId) ||
    CALENDAR_STYLE_OPTIONS[0];
  const accent = calendarStyle.accent;
  const textColor = calendarStyle.text;

  const renderGrid = ({
    xPad = Math.max(4, width * 0.035),
    headerH = height * 0.18,
    weekdaysH = height * 0.13,
    label = `${year}. ${monthNumber}`,
    weekdays = weekdaysEn,
    selectedMode = "heart",
    showBorder = false,
    cellBorder = false,
    muted = "#B6B2AD",
    sundayColor = "#C98B92",
  } = {}) => {
    const innerW = Math.max(1, width - xPad * 2);
    const cellW = innerW / 7;
    const rowH = Math.max(
      1,
      (height - headerH - weekdaysH - (showBorder ? 10 : 0)) / weekCount,
    );
    const dayFont = Math.max(7, rowH * 0.42);
    return (
      <View
        style={[
          { width, height, paddingHorizontal: xPad },
          showBorder && {
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: "rgba(169,103,112,0.38)",
            backgroundColor: "rgba(255,248,249,0.68)",
          },
        ]}
      >
        <Text
          style={{
            height: headerH,
            textAlign: "center",
            fontSize: Math.max(10, headerH * 0.55),
            fontWeight: selectedMode === "line" ? "500" : "800",
            color: selectedMode === "minimal" ? textColor : accent,
            letterSpacing: selectedMode === "box" ? 0.4 : 1.4,
            lineHeight: headerH,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: selectedMode === "line" ? 1 : 0,
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
                fontSize: Math.max(6, weekdaysH * 0.42),
                fontWeight: "800",
                color: i === 0 ? sundayColor : textColor,
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
              const dayColor = day
                ? colIndex === 0
                  ? sundayColor
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
                    borderWidth: cellBorder ? 0.5 : 0,
                    borderColor: "rgba(169,103,112,0.15)",
                  }}
                >
                  {selected && selectedMode === "heart" ? (
                    <View
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: Math.max(18, rowH * 1.22),
                          color: accent,
                          lineHeight: Math.max(18, rowH * 1.18),
                        }}
                      >
                        ♥
                      </Text>
                      <Text
                        style={{
                          position: "absolute",
                          fontSize: Math.max(6, rowH * 0.34),
                          fontWeight: "900",
                          color: "#4A3838",
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : selected && selectedMode === "box" ? (
                    <View
                      style={{
                        width: Math.max(19, rowH * 0.82),
                        height: Math.max(19, rowH * 0.82),
                        backgroundColor: accent,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: Math.max(7, rowH * 0.36),
                          fontWeight: "900",
                          color: "#FFFFFF",
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : selected && selectedMode === "line" ? (
                    <View
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: dayFont,
                          fontWeight: "900",
                          color: textColor,
                        }}
                      >
                        {day}
                      </Text>
                      <View
                        style={{
                          width: Math.max(16, rowH * 0.8),
                          height: 2,
                          marginTop: 2,
                          backgroundColor: accent,
                        }}
                      />
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontSize: dayFont,
                        fontWeight: selected ? "900" : "500",
                        color: selected ? accent : dayColor,
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
          paddingHorizontal: Math.max(7, width * 0.055),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            padding: Math.max(5, height * 0.055),
            backgroundColor: "rgba(255,252,250,0.72)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "stretch" }}>
            <View
              style={{
                width: "34%",
                alignItems: "center",
                justifyContent: "center",
                borderRightWidth: 1,
                borderRightColor: "rgba(169,103,112,0.28)",
                marginRight: width * 0.045,
              }}
            >
              <Text
                style={{
                  fontSize: Math.max(8, height * 0.08),
                  fontWeight: "700",
                  color: "#8B5A60",
                  letterSpacing: 1.3,
                }}
              >
                {year}
              </Text>
              <Text
                style={{
                  marginTop: height * 0.015,
                  fontSize: Math.max(28, height * 0.32),
                  fontWeight: "300",
                  color: textColor,
                  letterSpacing: 1,
                }}
              >
                {dayNumber}
              </Text>
              <Text
                style={{
                  marginTop: height * 0.01,
                  fontSize: Math.max(8, height * 0.085),
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
                  marginBottom: height * 0.045,
                }}
              >
                {weekdaysKo.map((d, i) => (
                  <Text
                    key={`box-week-${d}`}
                    style={{
                      fontSize: Math.max(7, height * 0.075),
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
                    marginTop: rowIndex === 0 ? 0 : height * 0.014,
                  }}
                >
                  {week.map((day, colIndex) => {
                    const selected = day === selectedDay;
                    return (
                      <View
                        key={`box-day-${rowIndex}-${colIndex}`}
                        style={{
                          width: width * 0.04,
                          height: Math.max(10, height * 0.085),
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: selected ? accent : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: Math.max(6, height * 0.06),
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
          paddingHorizontal: Math.max(8, width * 0.065),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: height * 0.09,
          }}
        >
          <Text
            style={{
              fontSize: Math.max(9, height * 0.095),
              fontWeight: "700",
              color: accent,
              letterSpacing: 1.4,
            }}
          >
            {year}
          </Text>
          <Text
            style={{
              fontSize: Math.max(24, height * 0.28),
              fontWeight: "300",
              color: textColor,
              letterSpacing: 2,
            }}
          >
            {monthNumber}
          </Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: Math.max(9, height * 0.095),
                fontWeight: "800",
                color: "#6B625E",
              }}
            >
              {weekdaysKo[date.getDay()]}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: Math.max(18, height * 0.2),
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
            marginTop: height * 0.07,
          }}
        >
          {weekdaysEn.map((d, i) => (
            <Text
              key={`line-week-${d}`}
              style={{
                fontSize: Math.max(7, height * 0.07),
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
          paddingHorizontal: Math.max(6, width * 0.05),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: height * 0.06,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: Math.max(18, height * 0.22),
                fontWeight: "900",
                color: textColor,
                letterSpacing: 1,
              }}
            >
              {monthNumber}.{dayNumber}
            </Text>
          </View>
          <Text
            style={{
              fontSize: Math.max(10, height * 0.11),
              fontWeight: "700",
              color: accent,
            }}
          >
            {year}
          </Text>
        </View>
        {renderGrid({
          xPad: 0,
          headerH: 0,
          weekdaysH: height * 0.14,
          label: "",
          selectedMode: "line",
          sundayColor: "#A96770",
        })}
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
          paddingHorizontal: Math.max(8, width * 0.06),
        }}
      >
        <Text
          style={{
            fontSize: Math.max(8, height * 0.08),
            fontWeight: "700",
            color: "#6B7280",
            letterSpacing: 2,
          }}
        >
          WEDDING DAY
        </Text>
        <Text
          style={{
            marginTop: height * 0.03,
            fontSize: Math.max(30, height * 0.28),
            fontWeight: "300",
            color: textColor,
            letterSpacing: 2,
          }}
        >
          {monthNumber}.{dayNumber}
        </Text>
        <View
          style={{
            width: "76%",
            height: 1,
            backgroundColor: "#111827",
            marginVertical: height * 0.06,
          }}
        />
        <Text
          style={{
            fontSize: Math.max(9, height * 0.09),
            fontWeight: "700",
            color: "#374151",
            letterSpacing: 1.2,
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
          paddingHorizontal: Math.max(7, width * 0.055),
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontSize: Math.max(11, height * 0.11),
            fontWeight: "700",
            color: accent,
            letterSpacing: 2,
            marginBottom: height * 0.05,
          }}
        >
          {year}.{monthNumber}
        </Text>
        {renderGrid({
          xPad: 0,
          headerH: 0,
          weekdaysH: height * 0.14,
          label: "",
          selectedMode: "line",
          sundayColor: "#8B6F47",
        })}
      </View>
    );
  }

  if (styleId === "dot") {
    return (
      <View
        style={{
          width,
          height,
          paddingHorizontal: Math.max(7, width * 0.06),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "center",
            marginBottom: height * 0.06,
          }}
        >
          <Text
            style={{
              fontSize: Math.max(18, height * 0.18),
              fontWeight: "300",
              color: textColor,
              letterSpacing: 1,
            }}
          >
            {monthNumber}
          </Text>
          <Text
            style={{
              marginLeft: 7,
              fontSize: Math.max(9, height * 0.09),
              fontWeight: "800",
              color: accent,
            }}
          >
            {year}
          </Text>
        </View>
        {renderGrid({
          xPad: 0,
          headerH: 0,
          weekdaysH: height * 0.12,
          label: "",
          selectedMode: "line",
          sundayColor: "#C8898E",
        })}
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
          paddingHorizontal: Math.max(8, width * 0.07),
        }}
      >
        <View style={{ alignItems: "center", marginRight: width * 0.08 }}>
          <Text
            style={{
              fontSize: Math.max(9, height * 0.09),
              fontWeight: "800",
              color: accent,
              letterSpacing: 1,
            }}
          >
            {year}
          </Text>
          <Text
            style={{
              marginTop: height * 0.025,
              fontSize: Math.max(32, height * 0.34),
              fontWeight: "300",
              color: textColor,
              lineHeight: Math.max(36, height * 0.36),
            }}
          >
            {dayNumber}
          </Text>
          <Text
            style={{
              marginTop: height * 0.015,
              fontSize: Math.max(9, height * 0.09),
              fontWeight: "800",
              color: accent,
            }}
          >
            {monthNumber}월
          </Text>
        </View>
        <View
          style={{
            width: 1,
            height: "68%",
            backgroundColor: "rgba(107,74,58,0.25)",
            marginRight: width * 0.08,
          }}
        />
        <View style={{ alignItems: "center" }}>
          {weekdaysKo.map((d, i) => (
            <Text
              key={`vertical-week-${d}`}
              style={{
                fontSize: Math.max(8, height * 0.075),
                fontWeight: i === date.getDay() ? "900" : "600",
                color: i === date.getDay() ? accent : "#8B8580",
                marginVertical: 1,
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
          paddingHorizontal: Math.max(8, width * 0.06),
          justifyContent: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(44,62,80,0.08)",
            paddingVertical: height * 0.08,
            paddingHorizontal: width * 0.06,
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
                fontSize: Math.max(10, height * 0.095),
                fontWeight: "800",
                color: accent,
                letterSpacing: 1.2,
              }}
            >
              {year}
            </Text>
            <Text
              style={{
                fontSize: Math.max(26, height * 0.27),
                fontWeight: "900",
                color: textColor,
              }}
            >
              {monthNumber}.{dayNumber}
            </Text>
          </View>
          <Text
            style={{
              marginTop: height * 0.045,
              textAlign: "right",
              fontSize: Math.max(9, height * 0.085),
              fontWeight: "700",
              color: "#667085",
              letterSpacing: 1,
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

// 드래그 가능한 요소
function DraggableElement({
  id,
  selected,
  onSelect,
  initialX,
  initialY,
  width,
  height,
  onMoveEnd,
  onMoveLive,
  onDragStart,
  onDragEnd,
  zIndex,
  raiseOnSelect = true,
  locked,
  rotation = 0,
  children,
}) {
  const pan = useRef(
    new Animated.ValueXY({ x: initialX, y: initialY }),
  ).current;
  const positionRef = useRef({ x: initialX, y: initialY });
  const dragStartRef = useRef({ x: initialX, y: initialY });
  const isDraggingRef = useRef(false);
  const idRef = useRef(id);
  idRef.current = id;
  const selectedLabel = ELEMENT_LABELS[id] || "요소";
  // PanResponder는 한 번만 생성 → ref로 최신 locked 추적
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const onSelectRef = useRef(onSelect);
  const onMoveEndRef = useRef(onMoveEnd);
  const onMoveLiveRef = useRef(onMoveLive);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  onSelectRef.current = onSelect;
  onMoveEndRef.current = onMoveEnd;
  onMoveLiveRef.current = onMoveLive;
  onDragStartRef.current = onDragStart;
  onDragEndRef.current = onDragEnd;
  const layerZIndex = selected && raiseOnSelect ? 200 : (zIndex ?? 0);

  // initialX/Y가 외부에서 바뀌면 동기화 (size 조정 등)
  React.useEffect(() => {
    if (isDraggingRef.current) return;
    pan.setValue({ x: initialX, y: initialY });
    positionRef.current = { x: initialX, y: initialY };
  }, [initialX, initialY]);

  const responder = useRef(
    PanResponder.create({
      // 항상 제스처 잡음 → 잠금이어도 선택은 가능
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        const currentId = idRef.current;
        // 선택은 항상
        onSelectRef.current?.(currentId);
        // 잠금이면 드래그 시작/오프셋 세팅 안 함 → 박스 안 움직임
        if (lockedRef.current) return;
        isDraggingRef.current = true;
        onDragStartRef.current?.();
        dragStartRef.current = positionRef.current;
        pan.setOffset(dragStartRef.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (lockedRef.current) return;
        const currentId = idRef.current;
        positionRef.current = {
          x: dragStartRef.current.x + g.dx,
          y: dragStartRef.current.y + g.dy,
        };
        onMoveLiveRef.current?.(
          currentId,
          positionRef.current.x,
          positionRef.current.y,
        );
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (lockedRef.current) return;
        const currentId = idRef.current;
        pan.flattenOffset();
        const newX = dragStartRef.current.x + g.dx;
        const newY = dragStartRef.current.y + g.dy;
        positionRef.current = { x: newX, y: newY };
        onMoveEndRef.current?.(currentId, newX, newY);
        isDraggingRef.current = false;
        onDragEndRef.current?.();
      },
      onPanResponderTerminate: () => {
        if (lockedRef.current) return;
        const currentId = idRef.current;
        pan.flattenOffset();
        onMoveEndRef.current?.(
          currentId,
          positionRef.current.x,
          positionRef.current.y,
        );
        isDraggingRef.current = false;
        onDragEndRef.current?.();
      },
    }),
  ).current;

  return (
    <Animated.View
      collapsable={false}
      pointerEvents="auto"
      {...responder.panHandlers}
      onTouchStart={() => {
        onSelectRef.current?.(idRef.current);
      }}
      style={{
        position: "absolute",
        width,
        height,
        backgroundColor: "rgba(255,255,255,0.001)",
        // 외부: 위치만 (Animated translate)
        transform: pan.getTranslateTransform(),
        zIndex: layerZIndex,
        elevation: layerZIndex,
      }}
    >
      <View
        pointerEvents="none"
        style={[
          {
            width: "100%",
            height: "100%",
            // 내부: 회전만 (정적) — Animated와 분리해서 누락 방지
            transform: [{ rotate: `${rotation}deg` }],
          },
        ]}
      >
        {children}
        {selected && (
          <>
            <View
              pointerEvents="none"
              style={[
                s.selectedOverlay,
                locked ? s.selectedOverlayLocked : s.selectedOverlayActive,
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                s.selectedBadge,
                initialY < 28 && s.selectedBadgeInside,
                locked && s.selectedBadgeLocked,
              ]}
            >
              <Ionicons
                name={locked ? "lock-closed" : "checkmark"}
                size={10}
                color="#FFFFFF"
              />
              <Text style={s.selectedBadgeText} numberOfLines={1}>
                {selectedLabel}
              </Text>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}

// 누르고 있으면 빠르게 반복 — 미세조정/크기 조절 가속용
// 안전망: timeout/interval 별도 ref + unmount/terminate cleanup + 안전 횟수 제한
function HoldButton({ onPress, style, children }) {
  // onPress는 매 렌더마다 새 참조 → ref로 최신값 추적
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    // 혹시 이전 타이머가 살아있다면 먼저 정리
    stop();
    onPressRef.current();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      let count = 0;
      intervalRef.current = setInterval(() => {
        // 안전망: 최대 300회 (= 약 18초) 후 자동 중단
        if (count++ > 300) {
          stop();
          return;
        }
        onPressRef.current();
      }, 60);
    }, 320);
  }, [stop]);

  // 언마운트 / props 교체 시 정리
  useEffect(() => stop, [stop]);

  return (
    <Pressable
      onPressIn={start}
      onPressOut={stop}
      // 제스처가 ScrollView 등으로 가로채일 때도 정리
      onResponderTerminate={stop}
      onTouchCancel={stop}
      style={style}
      hitSlop={4}
    >
      {children}
    </Pressable>
  );
}

// 토스 스타일 슬라이더 — 의존성 없음, PanResponder 기반
function Slider({ value, min, max, onChange }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        if (trackWidth <= 0) return;
        const x = e.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / trackWidth));
        const next = Math.round(min + ratio * (max - min));
        if (next !== valueRef.current) onChange(next);
      },
      onPanResponderMove: (e) => {
        if (trackWidth <= 0) return;
        const x = e.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / trackWidth));
        const next = Math.round(min + ratio * (max - min));
        if (next !== valueRef.current) onChange(next);
      },
    }),
  ).current;

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const fillW = trackWidth * Math.max(0, Math.min(1, ratio));

  return (
    <View
      style={sliderStyles.track}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...responder.panHandlers}
    >
      <View style={sliderStyles.trackBg} />
      <View style={[sliderStyles.trackFill, { width: fillW }]} />
      <View style={[sliderStyles.thumb, { left: Math.max(0, fillW - 12) }]} />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  track: {
    height: 24,
    justifyContent: "center",
    flex: 1,
  },
  trackBg: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E8EAF0",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3182F6",
  },
  thumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#3182F6",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

export default function PaperInvitationLayoutScreen({ navigation, route }) {
  const { template, formData, editingId, editingLayout } = route.params;
  const isEditing = !!editingId;
  const hasBackSide = !!template.hasBack;
  const frontData = formData.frontData || editingLayout?.frontData || {};
  const backData = formData.backData || editingLayout?.backData || {};
  const savedCanvasW =
    editingLayout?.canvas_w && editingLayout.canvas_w > 0
      ? editingLayout.canvas_w
      : null;

  // 저장된 layout(percent 기준)을 현재 캔버스 px 좌표로 복원
  const restoreFromSaved = (savedEl) => {
    if (!savedEl) return null;
    const out = {};
    if (savedEl.x != null) out.x = (savedEl.x / 100) * CANVAS_W;
    if (savedEl.y != null) out.y = (savedEl.y / 100) * CANVAS_H;
    if (savedEl.w != null) out.w = (savedEl.w / 100) * CANVAS_W;
    if (savedEl.h != null) out.h = (savedEl.h / 100) * CANVAS_H;
    if (savedEl.size_pct != null) {
      out.size = (savedEl.size_pct / 100) * CANVAS_W;
    } else if (savedEl.size != null) {
      out.size = savedCanvasW
        ? savedEl.size * (CANVAS_W / savedCanvasW)
        : savedEl.size;
    }
    if (savedEl.shape) out.shape = savedEl.shape;
    if (savedEl.radius != null) out.radius = savedEl.radius;
    if (savedEl.fontFamily)
      out.fontFamily = normalizeSavedFontFamily(savedEl.fontFamily);
    if (savedEl.letterSpacing != null)
      out.letterSpacing = savedEl.letterSpacing;
    if (savedEl.align) out.align = savedEl.align;
    if (savedEl.calendarStyle) out.calendarStyle = savedEl.calendarStyle;
    if (savedEl.elementId) out.elementId = savedEl.elementId;
    if (savedEl.sourceW != null) out.sourceW = savedEl.sourceW;
    if (savedEl.sourceH != null) out.sourceH = savedEl.sourceH;
    if (savedEl.locked) out.locked = true;
    if (savedEl.hidden) out.hidden = true;
    if (savedEl.rotation != null) out.rotation = savedEl.rotation;
    if (savedEl.color) out.color = savedEl.color;
    if (savedEl.bold) out.bold = true;
    if (savedEl.qrValue) out.qrValue = savedEl.qrValue;
    if (savedEl.mobileEventId) out.mobileEventId = savedEl.mobileEventId;
    if (savedEl.mobileEventName) out.mobileEventName = savedEl.mobileEventName;
    if (savedEl.mobileTemplateStyle)
      out.mobileTemplateStyle = savedEl.mobileTemplateStyle;
    if (savedEl.backgroundColor) out.backgroundColor = savedEl.backgroundColor;
    return out;
  };

  // photo: x, y는 좌상단 기준 px (canvas 안에서)
  const photoConf = template.photo || {
    shape: "rectangle",
    x: 50,
    y: 35,
    w: 50,
    h: 38,
  };
  const text = template.text || {};

  // 초기 위치를 percent → px 변환 (좌상단 기준)
  // shape='circle' 이면 정사각 픽셀로 강제 (캔버스 가로세로 비율 보정)
  const photoCenterX_px = (photoConf.x / 100) * CANVAS_W;
  const photoCenterY_px = (photoConf.y / 100) * CANVAS_H;
  const baseWPx = (photoConf.w / 100) * CANVAS_W;
  const baseHPx = (photoConf.h / 100) * CANVAS_H;
  const shouldUseTemplatePhotoBox = photoConf.fit === "cover";

  // 사진 원본 비율(가로/세로) — 사용자가 업로드한 사진을 자르지 않고
  // 그 비율 그대로 사진 영역 크기를 맞춤. circle은 정사각 강제 유지.
  const aspect = formData.photoAspect;
  let photoWPx, photoHPx;

  if (shouldUseTemplatePhotoBox) {
    photoWPx = baseWPx;
    photoHPx = baseHPx;
  } else if (photoConf.shape === "circle") {
    photoWPx = baseWPx;
    photoHPx = baseWPx;
  } else if (aspect && aspect > 0) {
    // 템플릿 기본 영역의 대각선/면적을 비슷하게 유지하면서 사진 비율로 매핑
    if (aspect >= 1) {
      // 가로형 사진: 너비 기준
      photoWPx = baseWPx;
      photoHPx = baseWPx / aspect;
      // 영역이 캔버스 높이를 넘지 않게 안전장치
      if (photoHPx > CANVAS_H * 0.85) {
        photoHPx = CANVAS_H * 0.85;
        photoWPx = photoHPx * aspect;
      }
    } else {
      // 세로형 사진: 높이 기준
      photoHPx = baseHPx;
      photoWPx = baseHPx * aspect;
      if (photoWPx > CANVAS_W * 0.95) {
        photoWPx = CANVAS_W * 0.95;
        photoHPx = photoWPx / aspect;
      }
    }
  } else {
    // 사진 비율 모름 → 템플릿 기본 사용
    photoWPx = baseWPx;
    photoHPx = baseHPx;
  }

  const initPhoto = {
    w: photoWPx,
    h: photoHPx,
    x: photoCenterX_px - photoWPx / 2,
    y: photoCenterY_px - photoHPx / 2,
    shape: photoConf.shape,
    radius: photoConf.radius,
  };
  const isLegacyMinimal1PhotoLayout = (savedPhoto) => {
    if (template.id !== "minimal-1" || !savedPhoto) return false;
    const x = Number(savedPhoto.x);
    const y = Number(savedPhoto.y);
    const w = Number(savedPhoto.w);
    const h = Number(savedPhoto.h);
    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Number.isFinite(w) &&
      Number.isFinite(h) &&
      x >= 10 &&
      x <= 20 &&
      y >= 8 &&
      y <= 14 &&
      w >= 65 &&
      w <= 75 &&
      h >= 50 &&
      h <= 60
    );
  };

  // 신랑·신부 각각 분리. 템플릿에 베이크인 "&" 있으면 connector 안 그림
  const hideConnector = !!text.names?.hideConnector;
  const namesY = ((text.names?.y || 70) / 100) * CANVAS_H;
  const namesSize = text.names?.size || 14;
  // 박스 너비를 35% 로 키워서 글자 크기 키워도 줄나눔 안 되게 함.
  // 박스 가운데 위치는 기존과 동일하게 유지 (좌측 25%, 우측 75% 또는 35%/65%).
  const NAME_W = CANVAS_W * 0.35;
  const NAME_HALF = NAME_W / 2;
  const initGroom = {
    x: hideConnector
      ? CANVAS_W * 0.27 - NAME_HALF
      : CANVAS_W * 0.37 - NAME_HALF,
    y: namesY,
    w: NAME_W,
    size: namesSize,
    color: text.names?.color,
  };
  const initBride = {
    x: hideConnector
      ? CANVAS_W * 0.73 - NAME_HALF
      : CANVAS_W * 0.63 - NAME_HALF,
    y: namesY,
    w: NAME_W,
    size: namesSize,
    color: text.names?.color,
  };
  const initConnector = {
    x: CANVAS_W * 0.46,
    y: namesY,
    w: CANVAS_W * 0.08,
    size: namesSize,
    color: text.names?.connectorColor,
  };
  const initDate = {
    x: 0,
    y: ((text.date?.y || 78) / 100) * CANVAS_H,
    size: text.date?.size || 9,
    w: CANVAS_W,
    color: text.date?.color,
  };
  const initVenue = {
    x: 0,
    y: ((text.venue?.y || 85) / 100) * CANVAS_H,
    size: text.venue?.size || 9,
    w: CANVAS_W,
    color: text.venue?.color,
  };
  // 큰 날짜 (월/일 두 줄) — 템플릿에 dateBig 정의된 경우만 사용
  const hasDateBig = !!text.dateBig;
  const initDateBig = {
    x: 0,
    y: ((text.dateBig?.y || 92) / 100) * CANVAS_H,
    size: text.dateBig?.size || 28,
    w: CANVAS_W,
    color: text.dateBig?.color,
  };
  // 인사말 — 템플릿에 greeting 정의된 경우만 (예: minimal-4의 "결 혼 합 니 다")
  const hasGreeting = !!text.greeting;
  const greetingText = frontData.greetingText ?? text.greeting?.text ?? "";
  const greetingLines = splitManualLines(greetingText);
  const greetingLineCount = Math.max(1, greetingLines.length);
  const initGreeting = {
    x: ((text.greeting?.x ?? 0) / 100) * CANVAS_W,
    y: ((text.greeting?.y || 8) / 100) * CANVAS_H,
    size: text.greeting?.size || 12,
    w: ((text.greeting?.w ?? 100) / 100) * CANVAS_W,
    color: text.greeting?.color,
    align: text.greeting?.align,
    letterSpacing: text.greeting?.letterSpacing,
  };
  const initMobileQr = {
    x: CANVAS_W * 0.68,
    y: CANVAS_H * 0.74,
    w: CANVAS_W * 0.18,
    h: CANVAS_W * 0.18,
    qrValue: null,
    mobileEventId: null,
    mobileEventName: null,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    rotation: 0,
    hidden: true,
  };
  const backConf = template.back || {};
  const hasBackTitle = !!backConf.title;
  const makeBackText = (key, fallback) => {
    const conf = backConf[key] || fallback;
    return {
      x: ((conf.x ?? 10) / 100) * CANVAS_W,
      y: ((conf.y ?? 10) / 100) * CANVAS_H,
      w: ((conf.w ?? 80) / 100) * CANVAS_W,
      size: conf.size ?? 10,
      color: conf.color,
      fontFamily: conf.fontFamily
        ? normalizeSavedFontFamily(conf.fontFamily)
        : undefined,
      letterSpacing: conf.letterSpacing,
      bold: conf.bold,
    };
  };
  const makeBackBox = (key, fallback) => {
    const conf = backConf[key] || fallback;
    return {
      x: ((conf.x ?? 20) / 100) * CANVAS_W,
      y: ((conf.y ?? 60) / 100) * CANVAS_H,
      w: ((conf.w ?? 60) / 100) * CANVAS_W,
      h: ((conf.h ?? 24) / 100) * CANVAS_H,
      color: conf.color,
      calendarStyle: conf.calendarStyle,
    };
  };
  const initBackInvitation = makeBackText("invitation", {
    x: 18,
    y: 15.2,
    w: 64,
    size: 9.5,
    color: "#3A3732",
  });
  const initBackTitle = makeBackText("title", {
    x: 18,
    y: 9.4,
    w: 64,
    size: 17,
    color: "#2C2A28",
    fontFamily: "PlayfairDisplay",
    letterSpacing: 0,
  });
  const initBackGroomParents = makeBackText("groomParents", {
    x: 23,
    y: 39.7,
    w: 35,
    size: 8.5,
    color: "#3A3732",
  });
  const initBackBrideParents = makeBackText("brideParents", {
    x: 23,
    y: 44.1,
    w: 35,
    size: 8.5,
    color: "#3A3732",
  });
  const initBackGroomName = makeBackText("groomName", {
    x: 60,
    y: 39.3,
    w: 21,
    size: 13,
    color: "#2C2A28",
  });
  const initBackBrideName = makeBackText("brideName", {
    x: 60,
    y: 43.8,
    w: 21,
    size: 13,
    color: "#2C2A28",
  });
  const initBackDateLabel = makeBackText("dateLabel", {
    x: 24,
    y: 52,
    w: 18,
    size: 8.5,
    color: "#3A3732",
  });
  const initBackVenueLabel = makeBackText("venueLabel", {
    x: 24,
    y: 57.8,
    w: 18,
    size: 8.5,
    color: "#3A3732",
  });
  const initBackDate = makeBackText("date", {
    x: 37,
    y: 52,
    w: 48,
    size: 9,
    color: "#3A3732",
  });
  const initBackVenue = makeBackText("venue", {
    x: 37,
    y: 57.8,
    w: 55,
    size: 8.5,
    color: "#3A3732",
  });
  const initBackCalendar = makeBackBox("calendar", {
    x: 21,
    y: 65.5,
    w: 58,
    h: 21.5,
  });
  const initBackInfoTopDivider = makeBackBox("infoTopDivider", {
    x: 18,
    y: 49.6,
    w: 64,
    h: 0.16,
    color: "#B6B2AD",
  });
  const initBackInfoBottomDivider = makeBackBox("infoBottomDivider", {
    x: 18,
    y: 62.4,
    w: 64,
    h: 0.16,
    color: "#B6B2AD",
  });
  const initBackThanksDivider = makeBackBox("thanksDivider", {
    x: 18,
    y: 86.4,
    w: 64,
    h: 0.16,
    color: "#B6B2AD",
  });

  // 수정 모드: 저장된 layout이 있으면 그걸로 시작, 부족한 필드는 기본값
  const [layoutState, setLayoutState] = useState(() => {
    const saved = isEditing && editingLayout ? editingLayout : null;
    const merge = (defaultEl, savedKey) => {
      const restored = saved ? restoreFromSaved(saved[savedKey]) : null;
      return restored ? { ...defaultEl, ...restored } : defaultEl;
    };
    const mergeBack = (defaultEl, savedKey) => {
      const restored = saved?.back
        ? restoreFromSaved(saved.back[savedKey])
        : null;
      return restored ? { ...defaultEl, ...restored } : defaultEl;
    };
    const initialLayout = {
      photo:
        saved && isLegacyMinimal1PhotoLayout(saved.photo)
          ? initPhoto
          : merge(initPhoto, "photo"),
      groom: merge(initGroom, "groom"),
      connector: merge(initConnector, "connector"),
      bride: merge(initBride, "bride"),
      date: merge(initDate, "date"),
      venue: merge(initVenue, "venue"),
      dateBig: merge(initDateBig, "dateBig"),
      greeting: merge(initGreeting, "greeting"),
      mobileQr: merge(initMobileQr, "mobileQr"),
      backTitle: mergeBack(initBackTitle, "title"),
      backInvitation: mergeBack(initBackInvitation, "invitation"),
      backGroomParents: mergeBack(initBackGroomParents, "groomParents"),
      backBrideParents: mergeBack(initBackBrideParents, "brideParents"),
      backGroomName: mergeBack(initBackGroomName, "groomName"),
      backBrideName: mergeBack(initBackBrideName, "brideName"),
      backDateLabel: mergeBack(initBackDateLabel, "dateLabel"),
      backVenueLabel: mergeBack(initBackVenueLabel, "venueLabel"),
      backDate: mergeBack(initBackDate, "date"),
      backVenue: mergeBack(initBackVenue, "venue"),
      backCalendar: mergeBack(initBackCalendar, "calendar"),
      backInfoTopDivider: mergeBack(initBackInfoTopDivider, "infoTopDivider"),
      backInfoBottomDivider: mergeBack(
        initBackInfoBottomDivider,
        "infoBottomDivider",
      ),
      backThanksDivider: mergeBack(initBackThanksDivider, "thanksDivider"),
      frontDecorations: Array.isArray(saved?.frontDecorations)
        ? saved.frontDecorations
            .map((item, index) => {
              const restored = restoreFromSaved(item);
              return restored
                ? {
                    id: `${DECORATION_PREFIX}front:${item.id || index}`,
                    ...restored,
                  }
                : null;
            })
            .filter(Boolean)
        : [],
      backDecorations: Array.isArray(saved?.backDecorations)
        ? saved.backDecorations
            .map((item, index) => {
              const restored = restoreFromSaved(item);
              return restored
                ? {
                    id: `${DECORATION_PREFIX}back:${item.id || index}`,
                    ...restored,
                  }
                : null;
            })
            .filter(Boolean)
        : [],
    };
    return initialLayout;
  });
  const layoutRef = useRef(layoutState);
  const setLayout = useCallback((updater) => {
    setLayoutState((prev) => {
      const base = layoutRef.current || prev;
      const next = typeof updater === "function" ? updater(base) : updater;
      layoutRef.current = next;
      return next;
    });
  }, []);
  const layout = layoutRef.current || layoutState;

  // formData.date_str ("2026.06.14 SAT") 에서 월·일 추출 → "06.\n14."
  const bigDateText = (() => {
    const m = (formData.date_str || "").match(/\d+\.(\d+)\.(\d+)/);
    if (!m) return "";
    return `${m[1]}.\n${m[2]}.`;
  })();
  const [selected, setSelected] = useState(null);
  const selectedRef = useRef(null);
  const lastElementTouchAtRef = useRef(0);
  const [activeSide, setActiveSide] = useState("front");
  const [resizeMode, setResizeMode] = useState("all"); // 'all' | 'w' | 'h' (사진만 적용)
  // 슬라이더 카드 안 카테고리 탭 — 한 번에 한 영역만 표시 (미리보기 잘 보이게)
  const [editTab, setEditTab] = useState("size"); // 'style' | 'size' | 'position' | 'rotation'
  const [showCompactPositionPad, setShowCompactPositionPad] = useState(false);
  const [showDecorationPicker, setShowDecorationPicker] = useState(false);
  const [showMobileQrPicker, setShowMobileQrPicker] = useState(false);
  const [pickerSheetMounted, setPickerSheetMounted] = useState(false);
  const pickerSheetAnim = useRef(new Animated.Value(0)).current;
  const [mobileQrOptions, setMobileQrOptions] = useState([]);
  const [loadingMobileQrOptions, setLoadingMobileQrOptions] = useState(false);
  const [loadedDecorationImages, setLoadedDecorationImages] = useState({});

  const closePickerSheet = useCallback(() => {
    Animated.timing(pickerSheetAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setPickerSheetMounted(false);
      setShowDecorationPicker(false);
      setShowMobileQrPicker(false);
    });
  }, [pickerSheetAnim]);

  useEffect(() => {
    if (!showDecorationPicker && !showMobileQrPicker) return;
    setPickerSheetMounted(true);
    pickerSheetAnim.setValue(0);
    Animated.timing(pickerSheetAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [pickerSheetAnim, showDecorationPicker, showMobileQrPicker]);

  useEffect(() => {
    if (!showDecorationPicker) return;
    STUDIO_DECORATION_ELEMENTS.slice(0, 12).forEach((item) => {
      const resolved = Image.resolveAssetSource(item.thumbSource || item.source);
      if (resolved?.uri) Image.prefetch(resolved.uri).catch(() => {});
    });
  }, [showDecorationPicker]);

  // 요소 변경 시 기본 탭으로 (사진은 style 없음)
  useEffect(() => {
    setEditTab("size");
    setShowCompactPositionPad(false);
    if (isBackDivider(selected)) setResizeMode("w");
    if (selected === "photo") setResizeMode("all");
  }, [selected]);
  useEffect(() => {
    clearSelected();
  }, [activeSide]);
  const [dragging, setDragging] = useState(false); // 드래그 중엔 스크롤 차단
  const [saving, setSaving] = useState(false);

  const selectElement = (id) => {
    lastElementTouchAtRef.current = Date.now();
    selectedRef.current = id;
    setSelected(id);
  };

  const clearSelected = () => {
    selectedRef.current = null;
    setSelected(null);
  };

  const clearSelectedFromCanvas = () => {
    if (Date.now() - lastElementTouchAtRef.current < 300) return;
    clearSelected();
  };

  const flushLayoutState = () => {
    const latest = layoutRef.current || layout;
    const flushed = { ...latest };
    layoutRef.current = flushed;
    setLayout(flushed);
  };

  const switchSide = (sideId) => {
    if (sideId === activeSide) return;
    flushLayoutState();
    clearSelected();
    closePickerSheet();
    requestAnimationFrame(() => {
      setActiveSide(sideId);
    });
  };

  const updateLayout = (updater) => {
    setLayout((prev) => {
      const base = layoutRef.current || prev;
      const next = typeof updater === "function" ? updater(base) : updater;
      layoutRef.current = next;
      return next;
    });
  };

  const getActiveDecorationKey = (side = activeSide) =>
    side === "front" ? "frontDecorations" : "backDecorations";

  const getDecorationById = (state, id) => {
    const decorations = [
      ...(state.frontDecorations || []),
      ...(state.backDecorations || []),
    ];
    return decorations.find((item) => item.id === id);
  };

  const updateDecorationById = (state, id, updater) => {
    const key = id.includes(":back:") ? "backDecorations" : "frontDecorations";
    const list = state[key] || [];
    return {
      ...state,
      [key]: list.map((item) =>
        item.id === id ? { ...item, ...updater(item) } : item,
      ),
    };
  };

  const addDecoration = (element) => {
    if (!element) return;
    const source = Image.resolveAssetSource(element.source) || {};
    const sourceW = source.width || 240;
    const sourceH = source.height || 160;
    const maxW = CANVAS_W * 0.42;
    const maxH = CANVAS_H * 0.22;
    const ratio = sourceH / sourceW;
    let w = Math.min(maxW, sourceW);
    let h = w * ratio;
    if (h > maxH) {
      h = maxH;
      w = h / ratio;
    }
    const key = getActiveDecorationKey();
    const side = activeSide;
    const id = `${DECORATION_PREFIX}${side}:${Date.now()}`;
    const next = {
      id,
      elementId: element.id,
      x: (CANVAS_W - w) / 2,
      y: CANVAS_H * 0.12,
      w,
      h,
      sourceW,
      sourceH,
      rotation: 0,
    };
    updateLayout((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), next],
    }));
    closePickerSheet();
    selectElement(id);
  };

  const renderDecorationPickerItem = ({ item }) => {
    const isLoaded = !!loadedDecorationImages[item.id];
    return (
      <TouchableOpacity
        style={s.sheetDecorationItem}
        onPress={() => addDecoration(item)}
        activeOpacity={0.75}
      >
        {!isLoaded && (
          <View style={s.sheetDecorationLoader}>
            <ActivityIndicator size="small" color={TC.blue} />
          </View>
        )}
        <Image
          source={item.thumbSource || item.source}
          style={[
            s.sheetDecorationImage,
            !isLoaded && s.sheetDecorationImageLoading,
          ]}
          resizeMethod="resize"
          fadeDuration={80}
          onLoadEnd={() => {
            setLoadedDecorationImages((prev) =>
              prev[item.id] ? prev : { ...prev, [item.id]: true },
            );
          }}
          onError={() => {
            setLoadedDecorationImages((prev) =>
              prev[item.id] ? prev : { ...prev, [item.id]: true },
            );
          }}
        />
        <Text style={s.sheetDecorationLabel} numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const loadMobileQrOptions = async () => {
    if (activeSide !== "front") {
      setActiveSide("front");
    }
    setShowDecorationPicker(false);

    if (showMobileQrPicker) {
      closePickerSheet();
      return;
    }

    setLoadingMobileQrOptions(true);
    try {
      const result = await getUserEvents();
      if (!result.success) {
        Alert.alert("불러오기 실패", result.error || "모바일 청첩장을 불러오지 못했습니다.");
        return;
      }

      const groomName = String(formData.groom || "").trim();
      const brideName = String(formData.bride || "").trim();
      const getEventPreviewImage = (event) => {
        const info = event.additional_info || {};
        const categorized = info.categorized_images || {};
        const imageUrls = Array.isArray(event.image_urls) ? event.image_urls : [];
        const candidates = [
          event.cover_image_url,
          event.thumbnail_url,
          event.main_image_url,
          event.photo_url,
          info.cover_image_url,
          info.thumbnail_url,
          info.main_image_url,
          categorized.main?.[0]?.url,
          categorized.main?.[0]?.uri,
          imageUrls.find((img) => img?.category === "main")?.url,
          imageUrls.find((img) => img?.category === "main")?.uri,
          imageUrls[0]?.url,
          imageUrls[0]?.uri,
        ];
        return candidates.find((value) => typeof value === "string" && value);
      };
      const options = (result.data || [])
        .filter((event) => event?.event_type === "wedding" && event.public_slug)
        .map((event) => {
          const title =
            event.event_name ||
            [event.groom_name, event.bride_name].filter(Boolean).join(" ♥ ") ||
            "모바일 청첩장";
          const score =
            (groomName && String(title).includes(groomName) ? 2 : 0) +
            (brideName && String(title).includes(brideName) ? 2 : 0);
          return {
            id: event.id,
            title,
            date: event.event_date || "",
            templateStyle: event.template_style || "기본 템플릿",
            imageUrl: getEventPreviewImage(event),
            url: getPublicInvitationUrl(event),
            score,
          };
        })
        .filter((item) => item.url)
        .sort((a, b) => b.score - a.score || String(b.date).localeCompare(String(a.date)))
        .slice(0, 12);

      if (options.length === 0) {
        Alert.alert(
          "모바일 청첩장 없음",
          "QR로 연결할 모바일 청첩장이 없습니다. 먼저 모바일 청첩장을 만들고 다시 불러와주세요.",
        );
        return;
      }

      setMobileQrOptions(options);
      setShowMobileQrPicker(true);
    } catch (error) {
      Alert.alert("불러오기 실패", error.message || "모바일 청첩장을 불러오지 못했습니다.");
    } finally {
      setLoadingMobileQrOptions(false);
    }
  };

  const addMobileInvitationQr = (item) => {
    if (!item?.url) return;
    const size = Math.max(54, CANVAS_W * 0.2);
    updateLayout((prev) => ({
      ...prev,
      mobileQr: {
        ...(prev.mobileQr || {}),
        x: CANVAS_W - size - CANVAS_W * 0.08,
        y: CANVAS_H - size - CANVAS_H * 0.08,
        w: size,
        h: size,
        qrValue: normalizePublicWebUrl(item.url),
        mobileEventId: item.id,
        mobileEventName: item.title,
        mobileTemplateStyle: item.templateStyle,
        color: "#111827",
        backgroundColor: "transparent",
        hidden: false,
      },
    }));
    closePickerSheet();
    selectElement(MOBILE_QR_ID);
  };

  const handleMoveLive = (id, x, y) => {
    lastElementTouchAtRef.current = Date.now();
    selectedRef.current = id;
    setLayout((prev) => {
      const current = layoutRef.current || prev;
      if (isDecorationElement(id)) {
        const el = getDecorationById(current, id);
        if (!el || el.locked) return prev;
        const next = updateDecorationById(current, id, () => ({ x, y }));
        layoutRef.current = next;
        return next;
      }
      const el = current[id] || prev[id];
      if (!el || el.locked) return prev;
      const next = {
        ...current,
        [id]: { ...el, x, y },
      };
      layoutRef.current = next;
      return next;
    });
  };

  const handleMoveEnd = (id, x, y) => {
    selectElement(id);
    updateLayout((prev) => {
      if (isDecorationElement(id)) {
        const el = getDecorationById(prev, id);
        if (!el || el.locked) return prev;
        return updateDecorationById(prev, id, () => ({ x, y }));
      }
      const el = prev[id];
      if (!el || el.locked) return prev;
      return { ...prev, [id]: { ...el, x, y } };
    });
  };

  // 미세조정 — 1px 씩 이동 (잠금 시 차단)
  const nudge = (dx, dy) => {
    const target = selectedRef.current || selected;
    if (!target) return;
    updateLayout((prev) => {
      const currentLayout = layoutRef.current || prev;
      if (isDecorationElement(target)) {
        const el = getDecorationById(currentLayout, target);
        if (!el || el.locked) return prev;
        return updateDecorationById(currentLayout, target, () => ({
          x: el.x + dx,
          y: el.y + dy,
        }));
      }
      const el = currentLayout[target] || prev[target];
      if (!el || el.locked) return prev;
      return {
        ...prev,
        [target]: {
          ...el,
          x: el.x + dx,
          y: el.y + dy,
        },
      };
    });
  };

  const getElementBox = (el) => {
    if (!el) return { w: 0, h: 0 };
    if (el.w != null || el.h != null) {
      return {
        w: el.w ?? CANVAS_W,
        h: el.h ?? (el.size ? el.size * 2.2 : 1),
      };
    }
    return {
      w: CANVAS_W,
      h: el.size ? el.size * 2.2 : 1,
    };
  };

  const alignSelected = (mode) => {
    if (!selected) return;
    updateLayout((prev) => {
      const el = isDecorationElement(selected)
        ? getDecorationById(prev, selected)
        : prev[selected];
      if (!el || el.locked) return prev;
      const box = getElementBox(el);
      const safeX = CANVAS_W * 0.08;
      const safeY = CANVAS_H * 0.06;
      const next = { ...el };

      if (mode === "centerX") next.x = (CANVAS_W - box.w) / 2;
      if (mode === "centerY") next.y = (CANVAS_H - box.h) / 2;
      if (mode === "safeLeft") next.x = safeX;
      if (mode === "safeRight") next.x = CANVAS_W - safeX - box.w;
      if (mode === "safeTop") next.y = safeY;
      if (mode === "safeBottom") next.y = CANVAS_H - safeY - box.h;

      if (isDecorationElement(selected)) {
        return updateDecorationById(prev, selected, () => next);
      }
      return { ...prev, [selected]: next };
    });
  };

  const selectedMetrics = (() => {
    if (!selected) return null;
    const el = isDecorationElement(selected)
      ? getDecorationById(layout, selected)
      : layout[selected];
    if (!el) return null;
    const box = getElementBox(el);
    const centerDeltaX = Math.round(el.x + box.w / 2 - CANVAS_W / 2);
    const centerDeltaY = Math.round(el.y + box.h / 2 - CANVAS_H / 2);
    const leftGap = Math.round(el.x);
    const rightGap = Math.round(CANVAS_W - el.x - box.w);
    const topGap = Math.round(el.y);
    const bottomGap = Math.round(CANVAS_H - el.y - box.h);
    return {
      centerDeltaX,
      centerDeltaY,
      leftGap,
      rightGap,
      topGap,
      bottomGap,
      horizontalGapDiff: Math.round(leftGap - rightGap),
      verticalGapDiff: Math.round(topGap - bottomGap),
      isCenterX: Math.abs(centerDeltaX) <= 1,
      isCenterY: Math.abs(centerDeltaY) <= 1,
      isEvenX: Math.abs(leftGap - rightGap) <= 1,
      isEvenY: Math.abs(topGap - bottomGap) <= 1,
    };
  })();

  // 잠금 토글 — 잠그면 드래그/미세조정/크기/폰트 모두 차단
  const toggleLock = () => {
    if (!selected) return;
    updateLayout((prev) => {
      if (isDecorationElement(selected)) {
        const el = getDecorationById(prev, selected);
        if (!el) return prev;
        return updateDecorationById(prev, selected, () => ({
          locked: !el.locked,
        }));
      }
      const el = prev[selected];
      if (!el) return prev;
      return { ...prev, [selected]: { ...el, locked: !el.locked } };
    });
  };

  const deleteSelected = () => {
    if (!selected) return;
    const id = selected;
    updateLayout((prev) => {
      if (isDecorationElement(id)) {
        return {
          ...prev,
          frontDecorations: (prev.frontDecorations || []).filter(
            (item) => item.id !== id,
          ),
          backDecorations: (prev.backDecorations || []).filter(
            (item) => item.id !== id,
          ),
        };
      }
      const el = prev[id];
      if (!el) return prev;
      return { ...prev, [id]: { ...el, hidden: true } };
    });
    clearSelected();
  };

  // 회전 — 절대값 설정 (잠금 시 차단)
  const setRotation = (deg) => {
    if (!selected) return;
    updateLayout((prev) => {
      if (isDecorationElement(selected)) {
        const el = getDecorationById(prev, selected);
        if (!el || el.locked) return prev;
        let v = Math.round(deg);
        if (v > 180) v = 180;
        if (v < -180) v = -180;
        return updateDecorationById(prev, selected, () => ({ rotation: v }));
      }
      const el = prev[selected];
      if (!el || el.locked) return prev;
      // -180 ~ 180 범위로 정규화
      let v = Math.round(deg);
      if (v > 180) v = 180;
      if (v < -180) v = -180;
      return { ...prev, [selected]: { ...el, rotation: v } };
    });
  };

  // 회전 — 미세조정 (잠금 시 차단)
  const adjustRotation = (delta) => {
    if (!selected) return;
    updateLayout((prev) => {
      if (isDecorationElement(selected)) {
        const el = getDecorationById(prev, selected);
        if (!el || el.locked) return prev;
        let v = (el.rotation || 0) + delta;
        if (v > 180) v = 180;
        if (v < -180) v = -180;
        return updateDecorationById(prev, selected, () => ({ rotation: v }));
      }
      const el = prev[selected];
      if (!el || el.locked) return prev;
      const cur = el.rotation || 0;
      let v = cur + delta;
      if (v > 180) v = 180;
      if (v < -180) v = -180;
      return { ...prev, [selected]: { ...el, rotation: v } };
    });
  };

  // 회전 리셋 (잠금 시 차단)
  const resetRotation = () => {
    if (!selected) return;
    updateLayout((prev) => {
      if (isDecorationElement(selected)) {
        const el = getDecorationById(prev, selected);
        if (!el || el.locked) return prev;
        return updateDecorationById(prev, selected, () => ({ rotation: 0 }));
      }
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, rotation: 0 } };
    });
  };

  const adjustSize = (delta) => {
    updateLayout((prev) => {
      if (isDecorationElement(selected)) {
        const el = getDecorationById(prev, selected);
        if (!el || el.locked) return prev;
        const ratio = el.h / el.w;
        const newW = Math.max(24, Math.min(CANVAS_W * 1.2, el.w + delta * 6));
        return updateDecorationById(prev, selected, () => ({
          w: newW,
          h: newW * ratio,
        }));
      }
      const el = prev[selected];
      if (!el || el.locked) return prev;

      if (isBackDivider(selected)) {
        const step = delta * 6;
        if (resizeMode === "h") {
          const newH = Math.max(1, Math.min(18, el.h + delta));
          return { ...prev, [selected]: { ...el, h: newH } };
        }
        const newW = Math.max(40, Math.min(CANVAS_W, el.w + step));
        return { ...prev, [selected]: { ...el, w: newW } };
      }

      if (selected === "backCalendar") {
        const step = delta * 6;
        const ratio = el.h / el.w;
        const newW = Math.max(120, Math.min(CANVAS_W, el.w + step));
        return { ...prev, backCalendar: { ...el, w: newW, h: newW * ratio } };
      }

      if (selected === MOBILE_QR_ID) {
        const step = delta * 6;
        const newW = Math.max(42, Math.min(CANVAS_W * 0.5, el.w + step));
        return { ...prev, mobileQr: { ...el, w: newW, h: newW } };
      }

      if (selected === "photo") {
        const step = delta * 6;
        const newW = Math.max(40, Math.min(PHOTO_MAX, el.w + step));

        // 원형: 항상 정사각 유지 (가로/세로 별도 조절 불가)
        if (el.shape === "circle") {
          return { ...prev, photo: { ...el, w: newW, h: newW } };
        }
        if (resizeMode === "w") {
          return { ...prev, photo: { ...el, w: newW } };
        }
        if (resizeMode === "h") {
          const newH = Math.max(40, Math.min(PHOTO_MAX, el.h + step));
          return { ...prev, photo: { ...el, h: newH } };
        }
        // all: 비율 유지
        const ratio = el.h / el.w;
        return { ...prev, photo: { ...el, w: newW, h: newW * ratio } };
      }

      // 텍스트: 글자 크기 조정
      const newSize = Math.max(
        TEXT_SIZE_MIN,
        Math.min(TEXT_SIZE_MAX, el.size + delta),
      );
      return { ...prev, [selected]: { ...el, size: newSize } };
    });
  };

  // 폰트 변경 — 텍스트 요소에만 적용 (잠금 시 차단)
  const setFont = (family) => {
    if (!selected || selected === "photo") return;
    updateLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, fontFamily: family } };
    });
  };

  // 색상 변경 — 텍스트 요소에만 적용 (잠금 시 차단)
  const setColor = (color) => {
    if (!selected || selected === "photo") return;
    updateLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, color } };
    });
  };

  // 굵게 토글 — 텍스트 요소에만 적용 (잠금 시 차단)
  const toggleBold = () => {
    if (!selected || selected === "photo") return;
    updateLayout((prev) => {
      const el = prev[selected];
      if (!el || el.locked) return prev;
      return { ...prev, [selected]: { ...el, bold: !el.bold } };
    });
  };

  const setCalendarStyle = (calendarStyle) => {
    updateLayout((prev) => {
      const el = prev.backCalendar;
      if (!el || el.locked) return prev;
      return { ...prev, backCalendar: { ...el, calendarStyle } };
    });
  };

  // 슬라이더로 절대값 설정 (잠금 시 차단)
  const setSizeAbsolute = (value) => {
    updateLayout((prev) => {
      if (isDecorationElement(selected)) {
        const el = getDecorationById(prev, selected);
        if (!el || el.locked) return prev;
        const ratio = el.h / el.w;
        const newW = Math.max(24, Math.min(CANVAS_W * 1.2, value));
        return updateDecorationById(prev, selected, () => ({
          w: newW,
          h: newW * ratio,
        }));
      }
      const el = prev[selected];
      if (!el || el.locked) return prev;

      if (selected === "photo") {
        const newW = Math.max(40, Math.min(PHOTO_MAX, value));
        if (el.shape === "circle") {
          return { ...prev, photo: { ...el, w: newW, h: newW } };
        }
        if (resizeMode === "w") {
          return { ...prev, photo: { ...el, w: newW } };
        }
        if (resizeMode === "h") {
          const newH = Math.max(40, Math.min(PHOTO_MAX, value));
          return { ...prev, photo: { ...el, h: newH } };
        }
        const ratio = el.h / el.w;
        return { ...prev, photo: { ...el, w: newW, h: newW * ratio } };
      }

      if (isBackDivider(selected)) {
        if (resizeMode === "h") {
          const newH = Math.max(1, Math.min(18, value));
          return { ...prev, [selected]: { ...el, h: newH } };
        }
        const newW = Math.max(40, Math.min(CANVAS_W, value));
        return { ...prev, [selected]: { ...el, w: newW } };
      }

      if (selected === "backCalendar") {
        const ratio = el.h / el.w;
        const newW = Math.max(120, Math.min(CANVAS_W, value));
        return { ...prev, backCalendar: { ...el, w: newW, h: newW * ratio } };
      }

      if (selected === MOBILE_QR_ID) {
        const newW = Math.max(42, Math.min(CANVAS_W * 0.5, value));
        return { ...prev, mobileQr: { ...el, w: newW, h: newW } };
      }

      const newSize = Math.round(
        Math.max(TEXT_SIZE_MIN, Math.min(TEXT_SIZE_MAX, value)),
      );
      return { ...prev, [selected]: { ...el, size: newSize } };
    });
  };

  // 현재 슬라이더 값/범위 계산
  const sliderConfig = (() => {
    if (!selected) return null;
    const el = isDecorationElement(selected)
      ? getDecorationById(layout, selected)
      : layout[selected];
    if (!el) return null;
    if (isDecorationElement(selected)) {
      return {
        value: Math.round(el.w),
        min: 24,
        max: Math.round(CANVAS_W * 1.2),
      };
    }
    if (selected === "photo") {
      if (resizeMode === "h") {
        return { value: Math.round(el.h), min: 40, max: PHOTO_MAX };
      }
      return { value: Math.round(el.w), min: 40, max: PHOTO_MAX };
    }
    if (isBackDivider(selected)) {
      if (resizeMode === "h")
        return { value: Math.round(el.h), min: 1, max: 18 };
      return { value: Math.round(el.w), min: 40, max: CANVAS_W };
    }
    if (selected === "backCalendar") {
      return { value: Math.round(el.w), min: 120, max: CANVAS_W };
    }
    if (selected === MOBILE_QR_ID) {
      return {
        value: Math.round(el.w),
        min: 42,
        max: Math.round(CANVAS_W * 0.5),
      };
    }
    return {
      value: Math.round(el.size),
      min: TEXT_SIZE_MIN,
      max: TEXT_SIZE_MAX,
    };
  })();

  // 잠금 여부 — 잠금 시 컨트롤 영역 시각적 비활성
  const selectedElement = selected
    ? isDecorationElement(selected)
      ? getDecorationById(layout, selected)
      : layout[selected]
    : null;
  const isLocked = !!selectedElement?.locked;
  const lockedDimStyle = isLocked ? { opacity: 0.4 } : null;
  const lockedPointer = isLocked ? "none" : "auto";
  const useCompactTouchEditor = template.category === "minimal";
  const frontElementTabs = [
    { id: "photo", label: "사진", icon: "image-outline" },
    { id: "groom", label: "신랑", icon: "person-outline" },
    ...(hideConnector
      ? []
      : [{ id: "connector", label: "&", icon: "remove-outline" }]),
    { id: "bride", label: "신부", icon: "person-outline" },
    { id: "date", label: "일시", icon: "calendar-outline" },
    ...(formData.venue
      ? [{ id: "venue", label: "장소", icon: "location-outline" }]
      : []),
    ...(hasDateBig && bigDateText
      ? [{ id: "dateBig", label: "큰 날짜", icon: "calendar" }]
      : []),
    ...(hasGreeting
      ? [{ id: "greeting", label: "인사말", icon: "chatbox-outline" }]
      : []),
    ...(layout.mobileQr && !layout.mobileQr.hidden
      ? [{ id: MOBILE_QR_ID, label: "QR", icon: "qr-code-outline" }]
      : []),
  ];
  const backElementTabs = [
    ...(hasBackTitle
      ? [{ id: "backTitle", label: "타이틀", icon: "text-outline" }]
      : []),
    {
      id: "backInvitation",
      label: "초대문구",
      icon: "chatbubble-ellipses-outline",
    },
    { id: "backGroomParents", label: "신랑측", icon: "people-outline" },
    { id: "backGroomName", label: "신랑", icon: "person-outline" },
    { id: "backBrideParents", label: "신부측", icon: "people-outline" },
    { id: "backBrideName", label: "신부", icon: "person-outline" },
    { id: "backDateLabel", label: "일시 |", icon: "text-outline" },
    { id: "backDate", label: "일시", icon: "time-outline" },
    { id: "backVenueLabel", label: "장소 |", icon: "text-outline" },
    ...(formData.venue
      ? [{ id: "backVenue", label: "장소", icon: "location-outline" }]
      : []),
    { id: "backCalendar", label: "달력", icon: "calendar-outline" },
    { id: "backInfoTopDivider", label: "상단선", icon: "remove-outline" },
    { id: "backInfoBottomDivider", label: "하단선", icon: "remove-outline" },
    { id: "backThanksDivider", label: "감사선", icon: "remove-outline" },
  ];
  const activeElementTabs =
    activeSide === "front" ? frontElementTabs : backElementTabs;
  const visibleElementTabs = activeElementTabs.filter(
    (tab) => !layout[tab.id]?.hidden,
  );
  const selectedLabel =
    (isDecorationElement(selected) &&
      getStudioDecorationElement(selectedElement?.elementId)?.label) ||
    FRONT_ELEMENT_LABELS[selected] ||
    backElementTabs.find((tab) => tab.id === selected)?.label ||
    "요소";
  const selectedIsText =
    !!selected &&
    !isDecorationElement(selected) &&
    selected !== "photo" &&
    selected !== MOBILE_QR_ID &&
    selected !== "backCalendar" &&
    !isBackDivider(selected);
  const selectedSizeLabel =
    isDecorationElement(selected)
      ? "장식 크기"
      : selected === "photo"
      ? "사진 크기"
      : selected === MOBILE_QR_ID
        ? "QR 크기"
      : selected === "backCalendar"
        ? "달력 크기"
        : isBackDivider(selected)
          ? resizeMode === "h"
            ? "구분선 두께"
            : "구분선 길이"
          : "글자 크기";
  const selectedSizeValueLabel = sliderConfig
    ? selectedIsText
      ? `${sliderConfig.value}pt`
      : `${sliderConfig.value}px`
    : "";

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1) 사진 업로드 — 사용자가 새 사진을 골랐을 때만 업로드
      // 수정 모드에서 photoUri가 기존 supabase URL이면 그대로 재사용
      let photoUrl = null;
      if (formData.photoUri) {
        const isRemoteUrl = /^https?:\/\//i.test(formData.photoUri);
        if (isRemoteUrl) {
          photoUrl = formData.photoUri;
        } else {
          const upload = await uploadInvitationPhoto(formData.photoUri);
          if (upload.success) {
            photoUrl = upload.url;
          } else {
            console.warn("[handleSave] photo upload failed:", upload.error);
          }
        }
      }

      // 2) layout px → percent 로 정규화 후 저장
      const latestLayout = layoutRef.current || layout;
      const norm = (el, hasW = true) => ({
        x: (el.x / CANVAS_W) * 100,
        y: (el.y / CANVAS_H) * 100,
        ...(hasW && el.w != null ? { w: (el.w / CANVAS_W) * 100 } : {}),
        ...(el.h != null ? { h: (el.h / CANVAS_H) * 100 } : {}),
        ...(el.size != null
          ? {
              size: el.size,
              size_pct: (el.size / CANVAS_W) * 100,
            }
          : {}),
        ...(el.shape ? { shape: el.shape } : {}),
        ...(el.radius != null ? { radius: el.radius } : {}),
        ...(el.fontFamily ? { fontFamily: el.fontFamily } : {}),
        ...(el.id ? { id: String(el.id).split(":").pop() } : {}),
        ...(el.elementId ? { elementId: el.elementId } : {}),
        ...(el.sourceW != null ? { sourceW: el.sourceW } : {}),
        ...(el.sourceH != null ? { sourceH: el.sourceH } : {}),
        ...(el.letterSpacing != null
          ? { letterSpacing: el.letterSpacing }
          : {}),
        ...(el.align ? { align: el.align } : {}),
        ...(el.calendarStyle ? { calendarStyle: el.calendarStyle } : {}),
        ...(el.locked ? { locked: true } : {}),
        ...(el.hidden ? { hidden: true } : {}),
        ...(el.rotation ? { rotation: el.rotation } : {}),
        ...(el.color ? { color: el.color } : {}),
        ...(el.bold ? { bold: true } : {}),
        ...(el.qrValue
          ? { qrValue: normalizePublicWebUrl(el.qrValue) }
          : {}),
        ...(el.mobileEventId ? { mobileEventId: el.mobileEventId } : {}),
        ...(el.mobileEventName ? { mobileEventName: el.mobileEventName } : {}),
        ...(el.mobileTemplateStyle
          ? { mobileTemplateStyle: el.mobileTemplateStyle }
          : {}),
        ...(el.backgroundColor ? { backgroundColor: el.backgroundColor } : {}),
      });
      const normalizedLayout = {
        canvas_w: CANVAS_W, // 저장 시점 캔버스 너비 (px) — 스케일 기준
        canvas_h: CANVAS_H,
        photo: norm(latestLayout.photo),
        groom: norm(latestLayout.groom),
        bride: norm(latestLayout.bride),
        date: norm(latestLayout.date),
        venue: norm(latestLayout.venue),
        frontDecorations: (latestLayout.frontDecorations || [])
          .filter((item) => !item.hidden)
          .map((item) => norm(item)),
        ...(hideConnector ? {} : { connector: norm(latestLayout.connector) }),
        ...(hasDateBig ? { dateBig: norm(latestLayout.dateBig) } : {}),
        ...(hasGreeting
          ? {
              frontData: {
                greetingText,
              },
              greeting: norm(latestLayout.greeting),
            }
          : {}),
        ...(latestLayout.mobileQr &&
        !latestLayout.mobileQr.hidden &&
        latestLayout.mobileQr.qrValue
          ? { mobileQr: norm(latestLayout.mobileQr) }
          : {}),
        ...(hasBackSide
          ? {
              backData,
              backDecorations: (latestLayout.backDecorations || [])
                .filter((item) => !item.hidden)
                .map((item) => norm(item)),
              back: {
                ...(hasBackTitle
                  ? { title: norm(latestLayout.backTitle) }
                  : {}),
                invitation: norm(latestLayout.backInvitation),
                groomParents: norm(latestLayout.backGroomParents),
                brideParents: norm(latestLayout.backBrideParents),
                groomName: norm(latestLayout.backGroomName),
                brideName: norm(latestLayout.backBrideName),
                dateLabel: norm(latestLayout.backDateLabel),
                venueLabel: norm(latestLayout.backVenueLabel),
                date: norm(latestLayout.backDate),
                venue: norm(latestLayout.backVenue),
                calendar: norm(latestLayout.backCalendar),
                infoTopDivider: norm(latestLayout.backInfoTopDivider),
                infoBottomDivider: norm(latestLayout.backInfoBottomDivider),
                thanksDivider: norm(latestLayout.backThanksDivider),
              },
            }
          : {}),
      };

      // 3) DB insert 또는 update
      const payload = {
        template_id: template.id,
        category: template.category,
        groom: formData.groom,
        bride: formData.bride,
        date_str: formData.date_str,
        time_str: formData.time_str,
        venue: formData.venue,
        address: formData.address,
        photo_url: photoUrl,
        layout: normalizedLayout,
      };
      const result = isEditing
        ? await updatePaperInvitation(editingId, payload)
        : await createPaperInvitation(payload);

      if (!result.success) {
        Alert.alert(
          isEditing ? "수정 실패" : "저장 실패",
          result.error ||
            (isEditing ? "수정에 실패했습니다." : "저장에 실패했습니다."),
        );
        setSaving(false);
        return;
      }

      Alert.alert(
        isEditing ? "수정 완료" : "저장 완료",
        isEditing ? "청첩장이 수정되었습니다." : "청첩장이 저장되었습니다.",
        [
          {
            text: "목록 보기",
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.popToTop();
              }
              setTimeout(
                () =>
                  navigation.navigate("SavedInvitations", {
                    updatedInvitation: result.data,
                    refreshAt: Date.now(),
                  }),
                100,
              );
            },
          },
          {
            text: "확인",
            style: "cancel",
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.popToTop();
                setTimeout(
                  () =>
                    navigation.navigate("SavedInvitations", {
                      updatedInvitation: result.data,
                      refreshAt: Date.now(),
                    }),
                  100,
                );
              }
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert("오류", e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderBackTextElement = (id, value, options = {}) => {
    const el = layout[id];
    if (!el || el.hidden || !value) return null;
    const manualLines = options.preserveManualLines
      ? splitManualLines(value)
      : null;
    const letterSpacing = el.letterSpacing ?? options.letterSpacing ?? 0;
    const manualWidth = manualLines
      ? estimateManualTextWidth(manualLines, el.size, letterSpacing)
      : 0;
    const textWidth = Math.max(el.w, options.minWidth || 0, manualWidth);
    const lineCount = manualLines
      ? Math.max(1, manualLines.length)
      : options.lines || 1;
    const lineHeight = lineCount === 1 ? el.size * 2.2 : el.size * 1.55;
    return (
      <DraggableElement
        id={id}
        selected={selected === id}
        onSelect={selectElement}
        initialX={el.x}
        initialY={el.y}
        width={textWidth}
        height={
          manualLines
            ? lineHeight * lineCount
            : el.size * (lineCount === 1 ? 2.2 : lineCount * 1.45)
        }
        onMoveEnd={handleMoveEnd}
        onMoveLive={handleMoveLive}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        locked={el.locked}
        rotation={el.rotation}
        zIndex={4}
      >
        {manualLines ? (
          <View pointerEvents="none" style={{ width: "100%" }}>
            {manualLines.map((line, idx) => (
              <Text
                key={`${id}-line-${idx}`}
                numberOfLines={1}
                ellipsizeMode="clip"
                style={{
                  textAlign: options.align || "center",
                  fontFamily: el.fontFamily || SERIF_FONT,
                  fontSize: el.size,
                  lineHeight,
                  color: el.color || options.color || "#3A3732",
                  fontWeight: el.bold ? "900" : options.weight || "500",
                  letterSpacing,
                }}
              >
                {line || " "}
              </Text>
            ))}
          </View>
        ) : (
          <Text
            numberOfLines={lineCount === 1 ? 1 : undefined}
            style={{
              textAlign: options.align || "center",
              fontFamily: el.fontFamily || SERIF_FONT,
              fontSize: el.size,
              lineHeight: lineCount === 1 ? undefined : el.size * 1.55,
              color: el.color || options.color || "#3A3732",
              fontWeight: el.bold ? "900" : options.weight || "500",
              letterSpacing: el.letterSpacing ?? options.letterSpacing ?? 0,
            }}
          >
            {value}
          </Text>
        )}
      </DraggableElement>
    );
  };

  const renderDecorationElement = (item) => {
    if (!item || item.hidden) return null;
    const element = getStudioDecorationElement(item.elementId);
    if (!element) return null;
    return (
      <DraggableElement
        key={item.id}
        id={item.id}
        selected={selected === item.id}
        onSelect={selectElement}
        initialX={item.x}
        initialY={item.y}
        width={item.w}
        height={item.h}
        onMoveEnd={handleMoveEnd}
        onMoveLive={handleMoveLive}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        locked={item.locked}
        rotation={item.rotation}
        zIndex={3}
        raiseOnSelect
      >
        <Image
          pointerEvents="none"
          source={element.source}
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />
      </DraggableElement>
    );
  };

  const renderMobileQrElement = () => {
    const item = layout.mobileQr;
    if (!item || item.hidden || !item.qrValue) return null;
    const qrSize = Math.max(24, Math.min(item.w, item.h || item.w));

    return (
      <DraggableElement
        id={MOBILE_QR_ID}
        selected={selected === MOBILE_QR_ID}
        onSelect={selectElement}
        initialX={item.x}
        initialY={item.y}
        width={item.w}
        height={item.h}
        onMoveEnd={handleMoveEnd}
        onMoveLive={handleMoveLive}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        locked={item.locked}
        rotation={item.rotation}
        zIndex={5}
        raiseOnSelect
      >
        <View
          pointerEvents="none"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <QRCode
            value={normalizePublicWebUrl(item.qrValue)}
            size={qrSize}
            color={item.color || "#111827"}
            backgroundColor="transparent"
          />
        </View>
      </DraggableElement>
    );
  };

  const renderBackDividerElement = (id) => {
    const el = layout[id];
    if (!el || el.hidden) return null;

    return (
      <DraggableElement
        id={id}
        selected={selected === id}
        onSelect={selectElement}
        initialX={el.x}
        initialY={el.y}
        width={el.w}
        height={Math.max(el.h + 12, 18)}
        onMoveEnd={handleMoveEnd}
        onMoveLive={handleMoveLive}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        locked={el.locked}
        rotation={el.rotation}
        zIndex={4}
      >
        <View
          pointerEvents="none"
          style={{
            width: "100%",
            height: Math.max(el.h, 1),
            marginTop: 6,
            backgroundColor: el.color || "#B6B2AD",
          }}
        />
      </DraggableElement>
    );
  };

  const formatParentLine = (father, mother, childLabel) => {
    const names = [father, mother].map((v) => (v || "").trim()).filter(Boolean);
    if (names.length === 0) return "";
    return `${names.join(" · ")}의 ${childLabel}`;
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      {/* 헤더 — 저장 버튼 우측 인라인 */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={TC.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {isEditing ? "청첩장 수정" : "청첩장 만들기"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.headerSaveBtn}
        >
          <Text style={[s.headerSaveText, saving && { opacity: 0.4 }]}>
            {saving ? "저장 중" : "저장"}
          </Text>
        </TouchableOpacity>
      </View>

      {hasBackSide && (
        <View style={s.sideSwitch}>
          {[
            { id: "front", label: "앞면" },
            { id: "back", label: "뒷면" },
          ].map((side) => {
            const active = activeSide === side.id;
            return (
              <TouchableOpacity
                key={side.id}
                style={[s.sideSwitchBtn, active && s.sideSwitchBtnActive]}
                onPress={() => switchSide(side.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[s.sideSwitchText, active && s.sideSwitchTextActive]}
                >
                  {side.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={s.decorationToolbar}>
        <TouchableOpacity
          style={[
            s.decorationAddButton,
            showDecorationPicker && s.decorationAddButtonActive,
          ]}
          onPress={() => {
            if (showDecorationPicker) {
              closePickerSheet();
              return;
            }
            setPickerSheetMounted(true);
            setShowMobileQrPicker(false);
            setShowDecorationPicker(true);
          }}
          activeOpacity={0.75}
        >
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={showDecorationPicker ? "#FFFFFF" : TC.blue}
          />
          <Text
            style={[
              s.decorationAddText,
              showDecorationPicker && s.decorationAddTextActive,
            ]}
          >
            {activeSide === "front" ? "앞면 장식 추가" : "뒷면 장식 추가"}
          </Text>
        </TouchableOpacity>
        {activeSide === "front" && (
          <TouchableOpacity
            style={[
              s.decorationAddButton,
              showMobileQrPicker && s.decorationAddButtonActive,
            ]}
            onPress={loadMobileQrOptions}
            activeOpacity={0.75}
            disabled={loadingMobileQrOptions}
          >
            <Ionicons
              name="qr-code-outline"
              size={16}
              color={showMobileQrPicker ? "#FFFFFF" : TC.blue}
            />
            {loadingMobileQrOptions ? (
              <LottieLoading
                text="QR 불러오는 중"
                size={24}
                color={showMobileQrPicker ? "#FFFFFF" : TC.blue}
                horizontal
                textStyle={[
                  s.decorationAddText,
                  showMobileQrPicker && s.decorationAddTextActive,
                  { opacity: 0.72 },
                ]}
              />
            ) : (
              <Text
                style={[
                  s.decorationAddText,
                  showMobileQrPicker && s.decorationAddTextActive,
                ]}
              >
                모바일 QR 불러오기
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      <Modal
        visible={pickerSheetMounted || showDecorationPicker || showMobileQrPicker}
        transparent
        animationType="none"
        onRequestClose={closePickerSheet}
      >
        <View style={s.pickerSheetOverlay}>
          <Animated.View
            style={[s.pickerSheetScrim, { opacity: pickerSheetAnim }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closePickerSheet}
            />
          </Animated.View>
          <Animated.View
            style={[
              s.pickerSheet,
              {
                opacity: pickerSheetAnim,
                transform: [
                  {
                    translateY: pickerSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [36, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={s.pickerSheetHandle} />
            <View style={s.pickerSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.pickerSheetTitle}>
                  {showMobileQrPicker
                    ? "모바일 청첩장 QR 불러오기"
                    : activeSide === "front"
                      ? "앞면 장식 추가"
                      : "뒷면 장식 추가"}
                </Text>
                <Text style={s.pickerSheetSub}>
                  {showMobileQrPicker
                    ? "선택한 모바일 청첩장을 종이 청첩장 앞면에 QR로 연결해요."
                    : "장식은 사진과 글자 뒤에 배치되고, 캔버스에서 크기를 조정할 수 있어요."}
                </Text>
              </View>
              <TouchableOpacity
                style={s.pickerSheetClose}
                onPress={closePickerSheet}
                activeOpacity={0.75}
              >
                <Ionicons name="close" size={20} color={TC.ink} />
              </TouchableOpacity>
            </View>

            {showDecorationPicker ? (
              <FlatList
                data={STUDIO_DECORATION_ELEMENTS}
                keyExtractor={(item) => item.id}
                renderItem={renderDecorationPickerItem}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.sheetDecorationGrid}
                columnWrapperStyle={s.sheetDecorationRow}
                initialNumToRender={12}
                maxToRenderPerBatch={9}
                updateCellsBatchingPeriod={32}
                windowSize={5}
                removeClippedSubviews={Platform.OS === "android"}
              />
            ) : (
              <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.sheetQrList}
              >
                {mobileQrOptions.length > 0 ? (
                  mobileQrOptions.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={s.sheetQrItem}
                      onPress={() => addMobileInvitationQr(item)}
                      activeOpacity={0.75}
                    >
                      <View style={s.sheetQrVisual}>
                        <Image
                          source={
                            MOBILE_QR_CARD_IMAGES[
                              index % MOBILE_QR_CARD_IMAGES.length
                            ]
                          }
                          style={s.sheetQrVisualImage}
                        />
                        <View style={s.sheetQrFloatingQr}>
                          <Ionicons
                            name="qr-code-outline"
                            size={22}
                            color={TC.blue}
                          />
                        </View>
                      </View>
                      <View style={s.sheetQrBody}>
                        <View style={s.sheetQrContent}>
                          <Text style={s.sheetQrLabel}>모바일 청첩장</Text>
                          <Text style={s.sheetQrTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={s.sheetQrMeta} numberOfLines={1}>
                            {item.date || "날짜 미정"}
                          </Text>
                        </View>
                      <View style={s.sheetQrAction}>
                        <Ionicons
                          name="scan-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={s.sheetQrActionText}>
                          QR 불러오기
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={15}
                          color="#FFFFFF"
                        />
                      </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={s.sheetEmptyBox}>
                    <Ionicons
                      name="qr-code-outline"
                      size={28}
                      color={TC.inkDim}
                    />
                    <Text style={s.sheetEmptyText}>
                      불러올 모바일 청첩장이 없어요.
                    </Text>
                  </View>
                )}
              </ScrollView>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* 캔버스 — 토스 스타일 흰색 카드, 가운데 정렬, 필요시만 스크롤 */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!dragging}
      >
        <View style={s.canvasCard}>
          <View
            style={[
              s.canvas,
              {
                width: CANVAS_W,
                height: CANVAS_H,
                backgroundColor: template.bgColor || "#FFFFFF",
              },
            ]}
          >
            {activeSide === "front" ? (
              <>
                {(layout.frontDecorations || [])
                  .filter((item) => !item.hidden)
                  .map(renderDecorationElement)}

                {/* 사진 — blank.png 아래 layer (cutout 템플릿이면 사진이 구멍으로 비침) */}
                {!layout.photo.hidden && (
                  <DraggableElement
                    id="photo"
                    selected={selected === "photo"}
                    onSelect={selectElement}
                    initialX={layout.photo.x}
                    initialY={layout.photo.y}
                    width={layout.photo.w}
                    height={layout.photo.h}
                    onMoveEnd={handleMoveEnd}
                    onMoveLive={handleMoveLive}
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => setDragging(false)}
                    locked={layout.photo.locked}
                    rotation={layout.photo.rotation}
                    zIndex={1}
                    raiseOnSelect={false}
                  >
                    {layout.photo.shape === "oval" ? (
                      // 계란 모양: SVG 클립 패스로 비대칭 oval 렌더
                      <Svg
                        pointerEvents="none"
                        width={layout.photo.w}
                        height={layout.photo.h}
                        style={{ overflow: "visible" }}
                      >
                        <Defs>
                          <ClipPath id="eggClip">
                            <Path
                              d={buildEggPath(layout.photo.w, layout.photo.h)}
                            />
                          </ClipPath>
                        </Defs>
                        <Path
                          d={buildEggPath(layout.photo.w, layout.photo.h)}
                          fill="rgba(168,149,119,0.15)"
                        />
                        {formData.photoUri && (
                          <SvgImage
                            href={{ uri: formData.photoUri }}
                            x={0}
                            y={0}
                            width={layout.photo.w}
                            height={layout.photo.h}
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="url(#eggClip)"
                          />
                        )}
                      </Svg>
                    ) : (
                      <View
                        pointerEvents="none"
                        style={[
                          {
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            backgroundColor: "rgba(168,149,119,0.15)",
                          },
                          getPhotoRadius(
                            layout.photo.shape,
                            layout.photo.w,
                            layout.photo.radius,
                          ),
                        ]}
                      >
                        {formData.photoUri ? (
                          <Image
                            pointerEvents="none"
                            source={{ uri: formData.photoUri }}
                            style={{
                              width: "100%",
                              height: "100%",
                              resizeMode: "cover",
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
                                fontSize: 12,
                                letterSpacing: 1,
                              }}
                            >
                              PHOTO
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </DraggableElement>
                )}

                {/* 빈 템플릿 — 사진 위 layer. pointerEvents="none" 으로 터치는 사진/캔버스로 통과 */}
                {/* cover: 템플릿 PNG가 캔버스를 가득 채워 흰 띠 없음 → 사진이 캔버스 밖으로 나가면 잘림이 명확 */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: CANVAS_W,
                    height: CANVAS_H,
                    zIndex: 2,
                    elevation: 2,
                  }}
                >
                  <Image
                    pointerEvents="none"
                    source={template.blank}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>

                {/* 베이크인 요소 가리는 마스크 (& 등) — 템플릿 위에 얹힘 */}
                {(template.masks || []).map((m, i) => (
                  <View
                    key={`mask-${i}`}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: ((m.x - m.w / 2) / 100) * CANVAS_W,
                      top: ((m.y - m.h / 2) / 100) * CANVAS_H,
                      width: (m.w / 100) * CANVAS_W,
                      height: (m.h / 100) * CANVAS_H,
                      backgroundColor: template.bgColor || "#FBF9F3",
                      zIndex: 3,
                      elevation: 3,
                    }}
                  />
                ))}

                {/* 신랑 — 별도 드래그. 박스 너비를 글자 크기에 비례하게 늘려 줄나눔/잘림 방지 */}
                {!layout.groom.hidden && (
                  <DraggableElement
                    id="groom"
                    selected={selected === "groom"}
                    onSelect={selectElement}
                    initialX={layout.groom.x}
                    initialY={layout.groom.y}
                    width={Math.max(
                      layout.groom.w,
                      (layout.groom.size || 14) * 5,
                    )}
                    height={layout.groom.size * 2.2}
                    onMoveEnd={handleMoveEnd}
                    onMoveLive={handleMoveLive}
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => setDragging(false)}
                    locked={layout.groom.locked}
                    rotation={layout.groom.rotation}
                    zIndex={4}
                  >
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="clip"
                      style={{
                        textAlign: "center",
                        fontFamily: layout.groom.fontFamily || SERIF_FONT,
                        fontSize: layout.groom.size,
                        color: layout.groom.color || "#3A2E22",
                        fontWeight: layout.groom.bold ? "900" : "500",
                      }}
                    >
                      {formData.groom}
                    </Text>
                  </DraggableElement>
                )}

                {/* & 커넥터 — 템플릿에 베이크인 안 되어있을 때만 */}
                {!hideConnector && !layout.connector.hidden && (
                  <DraggableElement
                    id="connector"
                    selected={selected === "connector"}
                    onSelect={selectElement}
                    initialX={layout.connector.x}
                    initialY={layout.connector.y}
                    width={Math.max(
                      layout.connector.w,
                      (layout.connector.size || 14) * 1.5,
                    )}
                    height={layout.connector.size * 2.2}
                    onMoveEnd={handleMoveEnd}
                    onMoveLive={handleMoveLive}
                    locked={layout.connector.locked}
                    rotation={layout.connector.rotation}
                    zIndex={4}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        textAlign: "center",
                        fontFamily: layout.connector.fontFamily || SERIF_FONT,
                        fontSize: layout.connector.size * 0.95,
                        color: layout.connector.color || "#A89571",
                        fontWeight: layout.connector.bold ? "900" : "300",
                      }}
                    >
                      &
                    </Text>
                  </DraggableElement>
                )}

                {/* 신부 — 별도 드래그. 박스 너비 동적 확장 (이름 길이/크기 대응) */}
                {!layout.bride.hidden && (
                  <DraggableElement
                    id="bride"
                    selected={selected === "bride"}
                    onSelect={selectElement}
                    initialX={layout.bride.x}
                    initialY={layout.bride.y}
                    width={Math.max(
                      layout.bride.w,
                      (layout.bride.size || 14) * 5,
                    )}
                    height={layout.bride.size * 2.2}
                    onMoveEnd={handleMoveEnd}
                    onMoveLive={handleMoveLive}
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => setDragging(false)}
                    locked={layout.bride.locked}
                    rotation={layout.bride.rotation}
                    zIndex={4}
                  >
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="clip"
                      style={{
                        textAlign: "center",
                        fontFamily: layout.bride.fontFamily || SERIF_FONT,
                        fontSize: layout.bride.size,
                        color: layout.bride.color || "#3A2E22",
                        fontWeight: layout.bride.bold ? "900" : "500",
                      }}
                    >
                      {formData.bride}
                    </Text>
                  </DraggableElement>
                )}

                {/* 날짜 */}
                {!layout.date.hidden && (
                  <DraggableElement
                    id="date"
                    selected={selected === "date"}
                    onSelect={selectElement}
                    initialX={layout.date.x}
                    initialY={layout.date.y}
                    width={layout.date.w}
                    height={layout.date.size * 2.2}
                    onMoveEnd={handleMoveEnd}
                    onMoveLive={handleMoveLive}
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => setDragging(false)}
                    locked={layout.date.locked}
                    rotation={layout.date.rotation}
                    zIndex={4}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontFamily: layout.date.fontFamily || NUMERIC_FONT,
                        fontSize: layout.date.size,
                        color: layout.date.color || "#6B5B44",
                        letterSpacing: 1.2,
                        fontWeight: layout.date.bold ? "900" : "600",
                      }}
                    >
                      {formData.date_str} {formatDisplayTime(formData.time_str)}
                    </Text>
                  </DraggableElement>
                )}

                {/* 장소 — 입력했을 때만 표시 (선택사항) */}
                {!!formData.venue &&
                  !layout.venue.hidden &&
                  (() => {
                    const venueLines = splitManualLines(formData.venue);
                    const venueLineHeight = layout.venue.size * 1.55;
                    return (
                      <DraggableElement
                        id="venue"
                        selected={selected === "venue"}
                        onSelect={selectElement}
                        initialX={layout.venue.x}
                        initialY={layout.venue.y}
                        width={layout.venue.w}
                        height={Math.max(
                          layout.venue.size * 2.2,
                          venueLineHeight * venueLines.length,
                        )}
                        onMoveEnd={handleMoveEnd}
                        onMoveLive={handleMoveLive}
                        onDragStart={() => setDragging(true)}
                        onDragEnd={() => setDragging(false)}
                        locked={layout.venue.locked}
                        rotation={layout.venue.rotation}
                        zIndex={4}
                      >
                        <View pointerEvents="none" style={{ width: "100%" }}>
                          {venueLines.map((line, idx) => (
                            <Text
                              key={`venue-line-${idx}`}
                              numberOfLines={1}
                              ellipsizeMode="clip"
                              style={{
                                textAlign: "center",
                                fontFamily:
                                  layout.venue.fontFamily || SERIF_FONT,
                                fontSize: layout.venue.size,
                                lineHeight: venueLineHeight,
                                color: layout.venue.color || "#6B5B44",
                                fontWeight: layout.venue.bold ? "900" : "500",
                              }}
                            >
                              {line || " "}
                            </Text>
                          ))}
                        </View>
                      </DraggableElement>
                    );
                  })()}

                {/* 큰 날짜 (월/일 두 줄) — 템플릿에 dateBig 정의되고 일시 선택했을 때만 표시 */}
                {hasDateBig && bigDateText !== "" && !layout.dateBig.hidden && (
                  <DraggableElement
                    id="dateBig"
                    selected={selected === "dateBig"}
                    onSelect={selectElement}
                    initialX={layout.dateBig.x}
                    initialY={layout.dateBig.y}
                    width={layout.dateBig.w}
                    height={layout.dateBig.size * 2.6}
                    onMoveEnd={handleMoveEnd}
                    onMoveLive={handleMoveLive}
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => setDragging(false)}
                    locked={layout.dateBig.locked}
                    rotation={layout.dateBig.rotation}
                    zIndex={4}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontFamily: layout.dateBig.fontFamily || SERIF_FONT,
                        fontSize: layout.dateBig.size,
                        color: layout.dateBig.color || "#2C2A28",
                        fontWeight: layout.dateBig.bold ? "900" : "300",
                        letterSpacing: 1,
                        lineHeight: layout.dateBig.size * 1.1,
                      }}
                    >
                      {bigDateText}
                    </Text>
                  </DraggableElement>
                )}

                {/* 인사말 — 템플릿이 greeting 정의한 경우만 (예: minimal-4 "결 혼 합 니 다") */}
                {hasGreeting && !layout.greeting.hidden && (
                  <DraggableElement
                    id="greeting"
                    selected={selected === "greeting"}
                    onSelect={selectElement}
                    initialX={layout.greeting.x}
                    initialY={layout.greeting.y}
                    width={layout.greeting.w}
                    height={
                      greetingLineCount === 1
                        ? layout.greeting.size * 2.2
                        : layout.greeting.size * 1.55 * greetingLineCount
                    }
                    onMoveEnd={handleMoveEnd}
                    onMoveLive={handleMoveLive}
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => setDragging(false)}
                    locked={layout.greeting.locked}
                    rotation={layout.greeting.rotation}
                    zIndex={4}
                  >
                    <Text
                      style={{
                        textAlign:
                          layout.greeting.align ||
                          text.greeting?.align ||
                          "center",
                        fontFamily: layout.greeting.fontFamily || SERIF_FONT,
                        fontSize: layout.greeting.size,
                        color: layout.greeting.color || "#5A5854",
                        fontWeight: layout.greeting.bold ? "900" : "500",
                        letterSpacing:
                          layout.greeting.letterSpacing ??
                          text.greeting?.letterSpacing ??
                          0,
                        lineHeight:
                          greetingLineCount === 1
                            ? undefined
                            : layout.greeting.size * 1.55,
                      }}
                    >
                      {greetingText}
                    </Text>
                  </DraggableElement>
                )}

                {renderMobileQrElement()}
              </>
            ) : (
              <>
                {template.backBlank ? (
                  <Image
                    source={template.backBlank}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      width: CANVAS_W,
                      height: CANVAS_H,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    pointerEvents="none"
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      backgroundColor: "#FFFDF9",
                    }}
                  />
                )}

                {(layout.backDecorations || [])
                  .filter((item) => !item.hidden)
                  .map(renderDecorationElement)}

                {hasBackTitle &&
                  renderBackTextElement("backTitle", "INVITATION", {
                    letterSpacing: layout.backTitle?.letterSpacing ?? 0,
                    weight: "400",
                  })}
                {renderBackTextElement(
                  "backInvitation",
                  backData.invitationText,
                  {
                    preserveManualLines: true,
                    minWidth: CANVAS_W * 0.74,
                    align: "center",
                    weight: "400",
                    letterSpacing: 0.2,
                  },
                )}
                {renderBackTextElement(
                  "backGroomParents",
                  formatParentLine(
                    backData.showGroomFather === false
                      ? ""
                      : backData.groomFather,
                    backData.showGroomMother === false
                      ? ""
                      : backData.groomMother,
                    backData.groomRelation || "아들",
                  ),
                  {
                    align: "left",
                    weight: "400",
                  },
                )}
                {renderBackTextElement(
                  "backBrideParents",
                  formatParentLine(
                    backData.showBrideFather === false
                      ? ""
                      : backData.brideFather,
                    backData.showBrideMother === false
                      ? ""
                      : backData.brideMother,
                    backData.brideRelation || "딸",
                  ),
                  {
                    align: "left",
                    weight: "400",
                  },
                )}
                {renderBackTextElement("backGroomName", formData.groom, {
                  letterSpacing: 2,
                })}
                {renderBackTextElement("backBrideName", formData.bride, {
                  letterSpacing: 2,
                })}
                {renderBackTextElement("backDateLabel", "일  시  |", {
                  align: "left",
                  weight: "500",
                  minWidth: CANVAS_W * 0.18,
                })}
                {renderBackTextElement("backVenueLabel", "장  소  |", {
                  align: "left",
                  weight: "500",
                  minWidth: CANVAS_W * 0.18,
                })}
                {renderBackTextElement(
                  "backDate",
                  `${formData.date_str} ${formatDisplayTime(formData.time_str)}`,
                  {
                    align: "left",
                    weight: "500",
                  },
                )}
                {!!formData.venue &&
                  renderBackTextElement("backVenue", formData.venue, {
                    preserveManualLines: true,
                    align: "left",
                    weight: "500",
                  })}

                {renderBackDividerElement("backInfoTopDivider")}
                {renderBackDividerElement("backInfoBottomDivider")}
                {renderBackDividerElement("backThanksDivider")}

                {!layout.backCalendar.hidden && (
                  <DraggableElement
                    id="backCalendar"
                    selected={selected === "backCalendar"}
                    onSelect={selectElement}
                    initialX={layout.backCalendar.x}
                    initialY={layout.backCalendar.y}
                    width={layout.backCalendar.w}
                    height={layout.backCalendar.h}
                    onMoveEnd={handleMoveEnd}
                    onMoveLive={handleMoveLive}
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => setDragging(false)}
                    locked={layout.backCalendar.locked}
                    rotation={layout.backCalendar.rotation}
                    zIndex={4}
                  >
                    <MiniCalendar
                      dateStr={formData.date_str}
                      width={layout.backCalendar.w}
                      height={layout.backCalendar.h}
                      styleId={layout.backCalendar.calendarStyle}
                    />
                  </DraggableElement>
                )}
              </>
            )}

            {selected && (
              <View pointerEvents="none" style={s.guideLayer}>
                <View style={s.guideCenterV} />
                <View style={s.guideCenterH} />
                <Text style={s.guideCenterVLabel}>세로 중앙</Text>
                <Text style={s.guideCenterHLabel}>가로 중앙</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {useCompactTouchEditor && (
        <View style={s.compactTabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.compactTabContent}
          >
            {visibleElementTabs.map((tab) => {
              const active = selected === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[s.compactTabChip, active && s.compactTabChipActive]}
                  onPress={() => selectElement(tab.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={active ? "#FFFFFF" : TC.inkMuted}
                  />
                  <Text
                    style={[s.compactTabText, active && s.compactTabTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {useCompactTouchEditor && selected && sliderConfig && (
        <View style={s.compactEditorCard}>
          <View style={s.compactEditorHeader}>
            <View style={s.compactEditorTitleWrap}>
              <Text style={s.compactEditorTitle}>{selectedLabel}</Text>
              <Text style={s.compactEditorHint}>
                직접 드래그해서 위치를 옮겨요
              </Text>
            </View>
            {selectedIsText && (
                <TouchableOpacity
                  onPress={() =>
                    setEditTab(editTab === "style" ? "size" : "style")
                  }
                  style={[
                    s.compactIconButton,
                    editTab === "style" && s.compactIconButtonActive,
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      s.compactAaText,
                      editTab === "style" && s.compactAaTextActive,
                    ]}
                  >
                    Aa
                  </Text>
                </TouchableOpacity>
              )}
            {selected === "backCalendar" && (
              <TouchableOpacity
                onPress={() => {
                  setShowCompactPositionPad(false);
                  setEditTab(editTab === "style" ? "size" : "style");
                }}
                style={[
                  s.compactIconButton,
                  editTab === "style" && s.compactIconButtonActive,
                ]}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="color-palette-outline"
                  size={17}
                  color={editTab === "style" ? "#FFFFFF" : TC.inkMuted}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={deleteSelected}
              style={[s.compactIconButton, s.compactDeleteButton]}
              activeOpacity={0.75}
            >
              <Ionicons name="trash-outline" size={17} color="#D64545" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleLock}
              style={[
                s.compactIconButton,
                selectedElement?.locked && s.compactIconButtonActive,
              ]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={
                  selectedElement?.locked
                    ? "lock-closed"
                    : "lock-open-outline"
                }
                size={17}
                color={selectedElement?.locked ? "#FFFFFF" : TC.inkMuted}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[s.compactToolRow, lockedDimStyle]}
            pointerEvents={lockedPointer}
          >
            <TouchableOpacity
              style={s.compactToolButton}
              onPress={() => alignSelected("centerX")}
              activeOpacity={0.75}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={17}
                color={TC.ink}
              />
              <Text style={s.compactToolText}>가로중앙</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.compactToolButton}
              onPress={() => alignSelected("centerY")}
              activeOpacity={0.75}
            >
              <Ionicons name="swap-vertical-outline" size={17} color={TC.ink} />
              <Text style={s.compactToolText}>세로중앙</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.compactToolButton,
                showCompactPositionPad && s.compactToolButtonActive,
              ]}
              onPress={() => setShowCompactPositionPad((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="locate-outline"
                size={17}
                color={showCompactPositionPad ? "#FFFFFF" : TC.ink}
              />
              <Text
                style={[
                  s.compactToolText,
                  showCompactPositionPad && s.compactToolTextActive,
                ]}
              >
                미세위치
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.compactToolButton,
                editTab === "size" &&
                  !showCompactPositionPad &&
                  s.compactToolButtonActive,
              ]}
              onPress={() => {
                setShowCompactPositionPad(false);
                setEditTab("size");
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="resize-outline"
                size={17}
                color={
                  editTab === "size" && !showCompactPositionPad
                    ? "#FFFFFF"
                    : TC.ink
                }
              />
              <Text
                style={[
                  s.compactToolText,
                  editTab === "size" &&
                    !showCompactPositionPad &&
                    s.compactToolTextActive,
                ]}
              >
                {selectedSizeValueLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.compactToolButton,
                editTab === "rotation" &&
                  !showCompactPositionPad &&
                  s.compactToolButtonActive,
              ]}
              onPress={() => {
                setShowCompactPositionPad(false);
                setEditTab("rotation");
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="refresh-outline"
                size={17}
                color={
                  editTab === "rotation" && !showCompactPositionPad
                    ? "#FFFFFF"
                    : TC.ink
                }
              />
              <Text
                style={[
                  s.compactToolText,
                  editTab === "rotation" &&
                    !showCompactPositionPad &&
                    s.compactToolTextActive,
                ]}
              >
                회전
              </Text>
            </TouchableOpacity>
          </View>
          {editTab === "size" && !showCompactPositionPad && (
            <View
              style={[s.compactInlinePanel, lockedDimStyle]}
              pointerEvents={lockedPointer}
            >
              <Text style={s.compactInlineLabel}>{selectedSizeLabel}</Text>
              <View style={s.compactInlineControls}>
                <HoldButton
                  style={s.compactInlineButton}
                  onPress={() => adjustSize(-1)}
                >
                  <Ionicons name="remove" size={17} color={TC.ink} />
                </HoldButton>
                <Text style={s.compactInlineValue} numberOfLines={1}>
                  {selectedSizeValueLabel}
                </Text>
                <HoldButton
                  style={s.compactInlineButton}
                  onPress={() => adjustSize(1)}
                >
                  <Ionicons name="add" size={17} color={TC.ink} />
                </HoldButton>
              </View>
            </View>
          )}
          {editTab === "rotation" && !showCompactPositionPad && (
            <View
              style={[s.compactInlinePanel, lockedDimStyle]}
              pointerEvents={lockedPointer}
            >
              <Text style={s.compactInlineLabel}>회전</Text>
              <View style={s.compactInlineControls}>
                <HoldButton
                  style={s.compactInlineButton}
                  onPress={() => adjustRotation(-1)}
                >
                  <Ionicons name="arrow-undo" size={15} color={TC.ink} />
                </HoldButton>
                <TouchableOpacity
                  style={s.compactInlineValueWrap}
                  onPress={resetRotation}
                  activeOpacity={0.75}
                >
                  <Text style={s.compactInlineValue} numberOfLines={1}>
                    {selectedElement?.rotation || 0}°
                  </Text>
                </TouchableOpacity>
                <HoldButton
                  style={s.compactInlineButton}
                  onPress={() => adjustRotation(1)}
                >
                  <Ionicons name="arrow-redo" size={15} color={TC.ink} />
                </HoldButton>
              </View>
            </View>
          )}
          {showCompactPositionPad && (
            <View
              style={[s.compactInlinePanel, lockedDimStyle]}
              pointerEvents={lockedPointer}
            >
              <Text style={s.compactInlineLabel}>
                {selectedMetrics
                  ? `X ${selectedMetrics.centerDeltaX > 0 ? "+" : ""}${selectedMetrics.centerDeltaX}px · Y ${selectedMetrics.centerDeltaY > 0 ? "+" : ""}${selectedMetrics.centerDeltaY}px`
                  : "미세위치"}
              </Text>
              <View style={s.compactInlinePositionControls}>
                <HoldButton
                  style={s.compactInlineButton}
                  onPress={() => nudge(-1, 0)}
                >
                  <Ionicons name="chevron-back" size={17} color={TC.ink} />
                </HoldButton>
                <HoldButton
                  style={s.compactInlineButton}
                  onPress={() => nudge(0, -1)}
                >
                  <Ionicons name="chevron-up" size={17} color={TC.ink} />
                </HoldButton>
                <TouchableOpacity
                  style={s.compactInlineCenterButton}
                  onPress={() => {
                    alignSelected("centerX");
                    alignSelected("centerY");
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="contract-outline" size={16} color={TC.blue} />
                </TouchableOpacity>
                <HoldButton
                  style={s.compactInlineButton}
                  onPress={() => nudge(0, 1)}
                >
                  <Ionicons name="chevron-down" size={17} color={TC.ink} />
                </HoldButton>
                <HoldButton
                  style={s.compactInlineButton}
                  onPress={() => nudge(1, 0)}
                >
                  <Ionicons name="chevron-forward" size={17} color={TC.ink} />
                </HoldButton>
              </View>
            </View>
          )}
          {editTab === "style" &&
            selectedIsText && (
              <View
                style={[s.compactStylePanel, lockedDimStyle]}
                pointerEvents={lockedPointer}
              >
                <View style={s.compactStyleHeader}>
                  <Text style={s.compactStyleLabel}>글씨체</Text>
                  <TouchableOpacity
                    style={[
                      s.compactBoldButton,
                      selectedElement?.bold && s.compactBoldButtonActive,
                    ]}
                    onPress={toggleBold}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        s.compactBoldText,
                        selectedElement?.bold && s.compactBoldTextActive,
                      ]}
                    >
                      B
                    </Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.compactFontRow}
                >
                  {FONT_OPTIONS.map((f) => {
                      const currentFamily =
                        selectedElement?.fontFamily || SERIF_FONT;
                    const active = currentFamily === f.family;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[
                          s.compactFontChip,
                          active && s.compactFontChipActive,
                        ]}
                        onPress={() => setFont(f.family)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            s.compactFontSample,
                            { fontFamily: f.family },
                            active && s.compactFontSampleActive,
                          ]}
                        >
                          {f.sample}
                        </Text>
                        <Text
                          style={[
                            s.compactFontLabel,
                            active && s.compactFontLabelActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.compactFontRow}
                >
                  {COLOR_OPTIONS.map((c) => {
                    const active = selectedElement?.color === c.value;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          s.compactColorChip,
                          active && s.compactColorChipActive,
                        ]}
                        onPress={() => setColor(c.value)}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            s.compactColorSwatch,
                            { backgroundColor: c.value },
                          ]}
                        />
                        <Text
                          style={[
                            s.compactFontLabel,
                            active && s.compactFontLabelActive,
                          ]}
                        >
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          {editTab === "style" && selected === "backCalendar" && (
            <View
              style={[s.compactStylePanel, lockedDimStyle]}
              pointerEvents={lockedPointer}
            >
              <Text style={s.compactStyleLabel}>달력 스타일</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.compactFontRow}
              >
                {CALENDAR_STYLE_OPTIONS.map((item) => {
                  const active =
                    (layout.backCalendar?.calendarStyle || "heart") === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        s.calendarStyleChip,
                        active && s.calendarStyleChipActive,
                      ]}
                      onPress={() => setCalendarStyle(item.id)}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          s.calendarStyleIcon,
                          { borderColor: item.accent },
                          item.id === "circle" && {
                            backgroundColor: item.accent,
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={14}
                          color={item.id === "circle" ? "#FFFFFF" : item.accent}
                        />
                      </View>
                      <Text
                        style={[
                          s.compactFontLabel,
                          active && s.compactFontLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* 요소 선택 탭 — 큰 카드형 4분할 그리드 (토스 스타일) */}
      {!useCompactTouchEditor && (
        <View style={s.tabsCard}>
          {visibleElementTabs.map((tab) => {
            const active = selected === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={s.tabItem}
                onPress={() => selectElement(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={active ? TC.blue : TC.inkMuted}
                />
                <Text
                  style={[
                    s.tabItemText,
                    active && { color: TC.blue, fontWeight: "700" },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 슬라이더 카드 — 선택 시에만 */}
      {selected &&
        sliderConfig &&
        !useCompactTouchEditor &&
        (() => {
          const selectedIsShapeOnly =
            selected === "photo" ||
            selected === "backCalendar" ||
            selected === MOBILE_QR_ID ||
            isDecorationElement(selected);
          const selectedHasStyle =
            selected === "backCalendar" ||
            (!selectedIsShapeOnly && !isBackDivider(selected));
          const editTabs = [
            ...(selectedHasStyle ? [{ id: "style", label: "꾸미기" }] : []),
            { id: "size", label: "크기" },
            { id: "position", label: "위치" },
            { id: "rotation", label: "회전" },
          ];
          const currentTab = editTabs.some((t) => t.id === editTab)
            ? editTab
            : "size";
          return (
            <View style={s.sliderCard}>
              {/* 카테고리 탭 + 잠금 버튼 (헤더에 항상) */}
              <View style={s.editTabsRow}>
                <View style={s.editTabs}>
                  {editTabs.map((t) => {
                    const active = currentTab === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[s.editTabBtn, active && s.editTabBtnActive]}
                        onPress={() => setEditTab(t.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[s.editTabText, active && s.editTabTextActive]}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  onPress={deleteSelected}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[s.lockBtn, s.deleteBtn]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#D64545" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleLock}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={s.lockBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      selectedElement?.locked
                        ? "lock-closed"
                        : "lock-open-outline"
                    }
                    size={18}
                    color={selectedElement?.locked ? TC.blue : TC.inkMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* 꾸미기 — 폰트 + 색상 (텍스트 요소만) */}
              {currentTab === "style" && (
                <View
                  style={[lockedDimStyle, { gap: 10 }]}
                  pointerEvents={lockedPointer}
                >
                  {selected === "backCalendar" && (
                    <View style={s.fontSection}>
                      <Text style={s.fontSectionLabel}>달력 스타일</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.fontRow}
                      >
                        {CALENDAR_STYLE_OPTIONS.map((item) => {
                          const active =
                            (layout.backCalendar?.calendarStyle || "heart") ===
                            item.id;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[
                                s.calendarStyleChip,
                                active && s.calendarStyleChipActive,
                              ]}
                              onPress={() => setCalendarStyle(item.id)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  s.calendarStyleIcon,
                                  { borderColor: item.accent },
                                  item.id === "circle" && {
                                    backgroundColor: item.accent,
                                  },
                                ]}
                              >
                                <Ionicons
                                  name={item.icon}
                                  size={14}
                                  color={
                                    item.id === "circle"
                                      ? "#FFFFFF"
                                      : item.accent
                                  }
                                />
                              </View>
                              <Text
                                style={[
                                  s.fontChipLabel,
                                  active && {
                                    color: TC.blue,
                                    fontWeight: "700",
                                  },
                                ]}
                              >
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                  {/* 글씨체 + 굵게 토글 */}
                  {selected !== "backCalendar" && !isBackDivider(selected) && (
                    <View style={s.fontSection}>
                      <View style={s.styleSectionHeader}>
                        <Text style={s.fontSectionLabel}>글씨체</Text>
                        <TouchableOpacity
                          style={[
                            s.boldBtn,
                            selectedElement?.bold && s.boldBtnActive,
                          ]}
                          onPress={toggleBold}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              s.boldBtnText,
                              selectedElement?.bold && { color: "#FFFFFF" },
                            ]}
                          >
                            B
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.fontRow}
                      >
                        {FONT_OPTIONS.map((f) => {
                          const currentFamily =
                            selectedElement?.fontFamily || SERIF_FONT;
                          const active = currentFamily === f.family;
                          return (
                            <TouchableOpacity
                              key={f.id}
                              style={[s.fontChip, active && s.fontChipActive]}
                              onPress={() => setFont(f.family)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  s.fontChipSample,
                                  { fontFamily: f.family },
                                  active && { color: TC.blue },
                                ]}
                              >
                                {f.sample}
                              </Text>
                              <Text
                                style={[
                                  s.fontChipLabel,
                                  active && {
                                    color: TC.blue,
                                    fontWeight: "700",
                                  },
                                ]}
                              >
                                {f.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                  <View style={s.fontSection}>
                    <Text style={s.fontSectionLabel}>색상</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.fontRow}
                    >
                      {COLOR_OPTIONS.map((c) => {
                        const active = selectedElement?.color === c.value;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[s.colorChip, active && s.colorChipActive]}
                            onPress={() => setColor(c.value)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                s.colorSwatch,
                                { backgroundColor: c.value },
                              ]}
                            />
                            <Text
                              style={[
                                s.fontChipLabel,
                                active && { color: TC.blue, fontWeight: "700" },
                              ]}
                            >
                              {c.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              )}

              {/* 크기 — 사진 모드 + 사이즈 슬라이더 */}
              {currentTab === "size" && (
                <View
                  style={[lockedDimStyle, { gap: 10 }]}
                  pointerEvents={lockedPointer}
                >
                  {selected === "photo" && layout.photo.shape !== "circle" && (
                    <View style={s.modeRow}>
                      {[
                        { id: "all", label: "전체" },
                        { id: "w", label: "가로" },
                        { id: "h", label: "세로" },
                      ].map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            s.modeBtn,
                            resizeMode === m.id && s.modeBtnActive,
                          ]}
                          onPress={() => setResizeMode(m.id)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              s.modeBtnText,
                              resizeMode === m.id && s.modeBtnTextActive,
                            ]}
                          >
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {isBackDivider(selected) && (
                    <View style={s.modeRow}>
                      {[
                        { id: "w", label: "길이" },
                        { id: "h", label: "두께" },
                      ].map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            s.modeBtn,
                            resizeMode === m.id && s.modeBtnActive,
                          ]}
                          onPress={() => setResizeMode(m.id)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              s.modeBtnText,
                              resizeMode === m.id && s.modeBtnTextActive,
                            ]}
                          >
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View style={s.sliderHeader}>
                    <Text style={s.sliderLabel}>
                      {selected === "photo"
                        ? layout.photo.shape === "circle"
                          ? "사진 크기"
                          : resizeMode === "w"
                            ? "가로 크기"
                            : resizeMode === "h"
                              ? "세로 크기"
                              : "사진 크기"
                        : selected === "backCalendar"
                          ? "달력 크기"
                          : isBackDivider(selected)
                            ? resizeMode === "h"
                              ? "구분선 두께"
                              : "구분선 길이"
                            : "글자 크기"}
                    </Text>
                    <Text style={s.sliderValue}>{sliderConfig.value}</Text>
                  </View>
                  <View style={s.sliderRow}>
                    <HoldButton
                      style={s.sliderIconBtn}
                      onPress={() => adjustSize(-1)}
                    >
                      <Ionicons name="remove" size={20} color={TC.inkMuted} />
                    </HoldButton>
                    <Slider
                      value={sliderConfig.value}
                      min={sliderConfig.min}
                      max={sliderConfig.max}
                      onChange={setSizeAbsolute}
                    />
                    <HoldButton
                      style={s.sliderIconBtn}
                      onPress={() => adjustSize(1)}
                    >
                      <Ionicons name="add" size={20} color={TC.inkMuted} />
                    </HoldButton>
                  </View>
                </View>
              )}

              {/* 위치 — 4방향 미세조정 (크게) */}
              {currentTab === "position" && (
                <View
                  style={[s.positionPad, lockedDimStyle]}
                  pointerEvents={lockedPointer}
                >
                  {selectedMetrics && (
                    <View style={s.measurePanel}>
                      <View style={s.measureRow}>
                        <Text style={s.measureLabel}>중앙</Text>
                        <Text
                          style={[
                            s.measureValue,
                            selectedMetrics.isCenterX &&
                              selectedMetrics.isCenterY &&
                              s.measureValueGood,
                          ]}
                        >
                          X {selectedMetrics.centerDeltaX > 0 ? "+" : ""}
                          {selectedMetrics.centerDeltaX}px · Y{" "}
                          {selectedMetrics.centerDeltaY > 0 ? "+" : ""}
                          {selectedMetrics.centerDeltaY}px
                        </Text>
                      </View>
                      <View style={s.measureRow}>
                        <Text style={s.measureLabel}>좌우</Text>
                        <Text
                          style={[
                            s.measureValue,
                            selectedMetrics.isEvenX && s.measureValueGood,
                          ]}
                        >
                          L {selectedMetrics.leftGap}px / R{" "}
                          {selectedMetrics.rightGap}px
                        </Text>
                      </View>
                      <View style={s.measureRow}>
                        <Text style={s.measureLabel}>상하</Text>
                        <Text
                          style={[
                            s.measureValue,
                            selectedMetrics.isEvenY && s.measureValueGood,
                          ]}
                        >
                          T {selectedMetrics.topGap}px / B{" "}
                          {selectedMetrics.bottomGap}px
                        </Text>
                      </View>
                    </View>
                  )}
                  <View style={s.alignQuickRow}>
                    {[
                      { id: "centerX", label: "가로중앙" },
                      { id: "centerY", label: "세로중앙" },
                      { id: "safeLeft", label: "좌측여백" },
                      { id: "safeRight", label: "우측여백" },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={s.alignQuickBtn}
                        onPress={() => alignSelected(item.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={s.alignQuickText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={s.positionRow}>
                    <View style={s.positionSlot} />
                    <HoldButton
                      style={s.positionBtn}
                      onPress={() => nudge(0, -1)}
                    >
                      <Ionicons name="chevron-up" size={20} color={TC.ink} />
                    </HoldButton>
                    <View style={s.positionSlot} />
                  </View>
                  <View style={s.positionRow}>
                    <HoldButton
                      style={s.positionBtn}
                      onPress={() => nudge(-1, 0)}
                    >
                      <Ionicons name="chevron-back" size={20} color={TC.ink} />
                    </HoldButton>
                    <View style={s.positionCenter}>
                      <Ionicons name="move" size={18} color={TC.inkMuted} />
                    </View>
                    <HoldButton
                      style={s.positionBtn}
                      onPress={() => nudge(1, 0)}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={TC.ink}
                      />
                    </HoldButton>
                  </View>
                  <View style={s.positionRow}>
                    <View style={s.positionSlot} />
                    <HoldButton
                      style={s.positionBtn}
                      onPress={() => nudge(0, 1)}
                    >
                      <Ionicons name="chevron-down" size={20} color={TC.ink} />
                    </HoldButton>
                    <View style={s.positionSlot} />
                  </View>
                </View>
              )}

              {/* 회전 — 슬라이더 + -/+ + 0° 리셋 */}
              {currentTab === "rotation" && (
                <View
                  style={[lockedDimStyle, { gap: 10 }]}
                  pointerEvents={lockedPointer}
                >
                  <View style={s.sliderHeader}>
                    <Text style={s.sliderLabel}>회전</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text style={s.sliderValue}>
                        {selectedElement?.rotation || 0}°
                      </Text>
                      <TouchableOpacity
                        onPress={resetRotation}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={s.lockBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="refresh-outline"
                          size={18}
                          color={TC.inkMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={s.sliderRow}>
                    <HoldButton
                      style={s.sliderIconBtn}
                      onPress={() => adjustRotation(-1)}
                    >
                      <Ionicons
                        name="arrow-undo"
                        size={18}
                        color={TC.inkMuted}
                      />
                    </HoldButton>
                    <Slider
                      value={selectedElement?.rotation || 0}
                      min={-180}
                      max={180}
                      onChange={setRotation}
                    />
                    <HoldButton
                      style={s.sliderIconBtn}
                      onPress={() => adjustRotation(1)}
                    >
                      <Ionicons
                        name="arrow-redo"
                        size={18}
                        color={TC.inkMuted}
                      />
                    </HoldButton>
                  </View>
                </View>
              )}
            </View>
          );
        })()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: TC.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 8 : 50,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: TC.ink,
    textAlign: "center",
    letterSpacing: -0.4,
  },

  // 헤더 우측 저장 버튼
  headerSaveBtn: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 8,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: TC.blue,
    letterSpacing: -0.3,
  },
  sideSwitch: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 4,
    backgroundColor: "#EDEFF3",
    borderRadius: 12,
  },
  sideSwitchBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 9,
  },
  sideSwitchBtnActive: {
    backgroundColor: "#FFFFFF",
  },
  sideSwitchText: {
    fontSize: 13,
    fontWeight: "700",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  sideSwitchTextActive: {
    color: TC.ink,
  },
  decorationToolbar: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  decorationAddButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E8FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  decorationAddButtonActive: {
    backgroundColor: TC.blue,
    borderColor: TC.blue,
  },
  decorationAddText: {
    fontSize: 13,
    fontWeight: "800",
    color: TC.blue,
    letterSpacing: -0.2,
  },
  decorationAddTextActive: {
    color: "#FFFFFF",
  },
  pickerSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerSheetScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25,31,40,0.34)",
  },
  pickerSheet: {
    maxHeight: "72%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "ios" ? 30 : 22,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  pickerSheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D8DEE6",
    marginBottom: 14,
  },
  pickerSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  pickerSheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: TC.ink,
    letterSpacing: -0.2,
  },
  pickerSheetSub: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    color: TC.inkMuted,
    letterSpacing: -0.1,
  },
  pickerSheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDecorationGrid: {
    gap: 10,
    paddingBottom: 4,
  },
  sheetDecorationRow: {
    gap: 9,
  },
  sheetDecorationItem: {
    width: "31.6%",
    height: 104,
    borderRadius: 14,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  sheetDecorationLoader: {
    position: "absolute",
    top: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDecorationImage: {
    width: "86%",
    height: 58,
    resizeMode: "contain",
  },
  sheetDecorationImageLoading: {
    opacity: 0,
  },
  sheetDecorationLabel: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: "800",
    color: TC.inkSoft,
    letterSpacing: -0.15,
  },
  sheetQrHero: {
    minHeight: 92,
    borderRadius: 20,
    backgroundColor: "#F7FAFF",
    borderWidth: 1,
    borderColor: "#E4F0FF",
    marginBottom: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetQrHeroImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    resizeMode: "cover",
  },
  sheetQrHeroText: {
    flex: 1,
    minWidth: 0,
  },
  sheetQrHeroTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: TC.ink,
    letterSpacing: -0.2,
  },
  sheetQrHeroSub: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    color: TC.inkMuted,
    letterSpacing: -0.1,
  },
  sheetQrList: {
    gap: 14,
    paddingBottom: 4,
  },
  sheetQrItem: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAF0",
    padding: 10,
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sheetQrVisual: {
    height: 156,
    borderRadius: 18,
    overflow: "visible",
    backgroundColor: "#F6F8FC",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetQrVisualImage: {
    width: "90%",
    height: "104%",
    resizeMode: "contain",
  },
  sheetQrFloatingQr: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sheetQrBody: {
    paddingTop: 12,
    paddingHorizontal: 2,
  },
  sheetQrContent: {
    minWidth: 0,
  },
  sheetQrLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: TC.inkMuted,
    letterSpacing: -0.1,
    marginBottom: 5,
  },
  sheetQrDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: TC.inkDim,
  },
  sheetQrTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: TC.ink,
    letterSpacing: -0.2,
  },
  sheetQrMeta: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "800",
    color: TC.inkSoft,
    letterSpacing: -0.1,
  },
  sheetQrAction: {
    height: 42,
    borderRadius: 15,
    marginTop: 12,
    backgroundColor: TC.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  sheetQrActionText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
  sheetEmptyBox: {
    minHeight: 130,
    borderRadius: 16,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sheetEmptyText: {
    fontSize: 13,
    fontWeight: "800",
    color: TC.inkMuted,
    letterSpacing: -0.1,
  },

  // 캔버스 wrap — 배경/그림자 없이 템플릿 PNG만 보이도록
  canvasCard: {
    backgroundColor: "transparent",
    padding: CARD_INNER_PADDING,
  },
  canvas: {
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
    borderRadius: 8,
    // 캔버스 영역 명확화 — 그림자로 떠있는 종이 느낌
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  guideLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    elevation: 99,
  },
  guideCenterV: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(49,130,246,0.48)",
  },
  guideCenterH: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(49,130,246,0.48)",
  },
  guideCenterVLabel: {
    position: "absolute",
    top: 8,
    left: "50%",
    marginLeft: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(49,130,246,0.86)",
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  guideCenterHLabel: {
    position: "absolute",
    top: "50%",
    right: 8,
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(49,130,246,0.86)",
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  selectedOverlayActive: {
    borderColor: TC.blue,
    borderStyle: "dashed",
  },
  selectedOverlayLocked: {
    borderColor: "#A0A0A0",
    borderStyle: "solid",
  },
  selectedBadge: {
    position: "absolute",
    left: 0,
    top: -24,
    minWidth: 48,
    maxWidth: 108,
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: TC.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    zIndex: 12,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  selectedBadgeInside: {
    top: 3,
  },
  selectedBadgeLocked: {
    backgroundColor: "#8B95A1",
  },
  selectedBadgeText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  selectedBorder: {
    borderWidth: 1.5,
    borderColor: TC.blue,
    borderStyle: "dashed",
    borderRadius: 4,
  },
  selectedBorderLocked: {
    borderWidth: 1.5,
    borderColor: "#A0A0A0",
    borderStyle: "solid",
    borderRadius: 4,
  },
  lockBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  deleteBtn: {
    backgroundColor: "#FFF1F1",
  },
  compactEditorCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  compactEditorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  compactEditorTitleWrap: {
    flex: 1,
  },
  compactEditorTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: TC.ink,
    letterSpacing: -0.3,
  },
  compactEditorHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  compactIconButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  compactIconButtonActive: {
    backgroundColor: TC.blue,
  },
  compactDeleteButton: {
    backgroundColor: "#FFF1F1",
  },
  compactAaText: {
    fontSize: 13,
    fontWeight: "900",
    color: TC.inkMuted,
  },
  compactAaTextActive: {
    color: "#FFFFFF",
  },
  compactToolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactToolButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  compactToolButtonActive: {
    backgroundColor: TC.blue,
    borderColor: TC.blue,
  },
  compactToolText: {
    fontSize: 10,
    fontWeight: "800",
    color: TC.ink,
    letterSpacing: -0.2,
  },
  compactToolTextActive: {
    color: "#FFFFFF",
  },
  compactStepper: {
    flexGrow: 1,
    flexBasis: "34%",
    minHeight: 44,
    minWidth: 116,
    borderRadius: 12,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  compactStepButton: {
    width: 28,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  compactStepperLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "900",
    color: TC.inkMuted,
    letterSpacing: -0.2,
    textAlign: "center",
    minWidth: 44,
    flexShrink: 1,
  },
  compactInlinePanel: {
    marginTop: 8,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#FAFBFC",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactInlineLabel: {
    minWidth: 58,
    fontSize: 10,
    fontWeight: "900",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  compactInlineControls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  compactInlinePositionControls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  compactInlineButton: {
    width: 30,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  compactInlineCenterButton: {
    width: 30,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  compactInlineValueWrap: {
    minWidth: 54,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  compactInlineValue: {
    minWidth: 54,
    fontSize: 11,
    fontWeight: "900",
    color: TC.ink,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  compactPositionPanel: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F4",
    gap: 8,
  },
  compactMeasureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  compactMeasureText: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F2F4F6",
    fontSize: 10,
    fontWeight: "800",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  compactDpadWrap: {
    alignSelf: "center",
    width: 132,
    gap: 5,
  },
  compactDpadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  compactDpadButton: {
    width: 40,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  compactDpadCenter: {
    width: 40,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#CFE5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  compactDpadSpacer: {
    width: 40,
    height: 34,
  },
  compactStylePanel: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F4",
    gap: 8,
  },
  compactStyleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactStyleLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: TC.ink,
    letterSpacing: -0.2,
  },
  compactBoldButton: {
    width: 30,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  compactBoldButtonActive: {
    backgroundColor: TC.ink,
  },
  compactBoldText: {
    fontSize: 13,
    fontWeight: "900",
    color: TC.ink,
  },
  compactBoldTextActive: {
    color: "#FFFFFF",
  },
  compactFontRow: {
    gap: 7,
    paddingVertical: 2,
    paddingRight: 4,
  },
  compactFontChip: {
    minWidth: 58,
    height: 48,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  compactFontChipActive: {
    backgroundColor: "#EAF3FF",
    borderColor: TC.blue,
  },
  compactFontSample: {
    fontSize: 15,
    color: TC.ink,
    lineHeight: 18,
  },
  compactFontSampleActive: {
    color: TC.blue,
  },
  compactFontLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  compactFontLabelActive: {
    color: TC.blue,
    fontWeight: "900",
  },
  compactColorChip: {
    width: 50,
    height: 44,
    borderRadius: 11,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  compactColorChipActive: {
    backgroundColor: "#EAF3FF",
    borderColor: TC.blue,
  },
  compactColorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  calendarStyleChip: {
    minWidth: 58,
    height: 48,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarStyleChipActive: {
    backgroundColor: "#EAF3FF",
    borderColor: TC.blue,
  },
  calendarStyleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  compactTabBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  compactTabContent: {
    paddingHorizontal: 8,
    gap: 7,
  },
  compactTabChip: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  compactTabChipActive: {
    backgroundColor: TC.blue,
    borderColor: TC.blue,
  },
  compactTabText: {
    fontSize: 12,
    fontWeight: "800",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  compactTabTextActive: {
    color: "#FFFFFF",
  },

  // 요소 탭 카드 — 흰색, 4분할 그리드
  tabsCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabItem: {
    width: "25%",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: "500",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // 슬라이더 카드
  sliderCard: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === "ios" ? 24 : 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // 사진 가로/세로/전체 모드 토글 (슬라이더 카드 안)
  modeRow: {
    flexDirection: "row",
    backgroundColor: "#F2F4F6",
    borderRadius: 10,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: "#FFFFFF" },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  modeBtnTextActive: {
    color: TC.ink,
    fontWeight: "700",
  },

  // 폰트 선택 영역
  fontSection: {
    gap: 6,
  },
  fontSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: TC.ink,
    letterSpacing: -0.3,
  },
  fontRow: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  fontChip: {
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F7F8FA",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  fontChipActive: {
    backgroundColor: "#EAF3FF",
    borderColor: TC.blue,
  },
  fontChipSample: {
    fontSize: 18,
    color: TC.ink,
    marginBottom: 2,
    lineHeight: 22,
  },
  fontChipLabel: {
    fontSize: 10,
    color: TC.inkMuted,
    fontWeight: "500",
    letterSpacing: -0.2,
  },

  // 꾸미기 섹션 헤더 (라벨 + 굵게 버튼)
  styleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  boldBtn: {
    width: 32,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  boldBtnActive: {
    backgroundColor: TC.ink,
  },
  boldBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: TC.ink,
  },

  // 색상 칩
  colorChip: {
    width: 56,
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: "#F7F8FA",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 4,
  },
  colorChipActive: {
    backgroundColor: "#EAF3FF",
    borderColor: TC.blue,
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: TC.ink,
    letterSpacing: -0.3,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "700",
    color: TC.inkMuted,
    letterSpacing: -0.3,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sliderIconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // 위치 미세조정 — 슬라이더 카드 푸터
  nudgeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F5",
  },
  nudgeFooterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  nudgeFooterBtns: {
    flexDirection: "row",
    gap: 4,
  },
  nudgeFooterBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // 회전 섹션
  rotationSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F5",
    gap: 10,
  },

  // 카테고리 탭 (꾸미기 / 크기 / 위치 / 회전)
  editTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editTabs: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F2F4F6",
    borderRadius: 10,
    padding: 3,
  },
  editTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  editTabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  editTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  editTabTextActive: {
    color: TC.ink,
    fontWeight: "700",
  },

  // 위치 D-pad (크게, 직관적)
  positionPad: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  alignQuickRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginBottom: 2,
  },
  measurePanel: {
    width: "100%",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F7FAFF",
    borderWidth: 1,
    borderColor: "#DCEBFF",
    gap: 5,
  },
  measureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  measureLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: TC.inkMuted,
  },
  measureValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "800",
    color: TC.ink,
  },
  measureValueGood: {
    color: TC.blue,
  },
  alignQuickBtn: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F2F7FF",
    borderWidth: 1,
    borderColor: "#D8E8FF",
    alignItems: "center",
  },
  alignQuickText: {
    fontSize: 12,
    fontWeight: "800",
    color: TC.blue,
    letterSpacing: -0.2,
  },
  positionRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  positionBtn: {
    width: 44,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  positionSlot: { width: 44, height: 38 },
  positionCenter: {
    width: 44,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
