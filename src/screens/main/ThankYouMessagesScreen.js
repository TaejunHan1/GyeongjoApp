import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import { getCurrentUserInfo } from "../../lib/supabaseHelper";
import { getSharedEventsForCurrentUser } from "../../lib/eventSharing";
import { normalizePhone } from "../../lib/phoneUtils";
import { Colors } from "../../styles/constants";
import SimpleModal from "../../components/SimpleModal";
import { useSimpleAlert } from "../../hooks/useSimpleAlert";

const EVENT_TYPE_IMAGES = {
  wedding: require("../../../assets/icons/reciprocity/thumbs/wedding-thumb.png"),
  funeral: require("../../../assets/icons/reciprocity/thumbs/funeral-thumb.png"),
};
const THANK_YOU_HERO_IMAGE = require("../../../assets/images/thank-you/thank-you-hero.png");

const getEventTypeImage = (eventType) =>
  eventType === "funeral"
    ? EVENT_TYPE_IMAGES.funeral
    : EVENT_TYPE_IMAGES.wedding;

const THANK_YOU_HISTORY_PREFIX = "thankYouMessageHistory";

const parseAdditionalInfo = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const formatPhone = (value) => {
  const d = normalizePhone(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
};

const formatAmount = (amount) => {
  const n = Number(amount || 0);
  if (!n) return "금액 미입력";
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(n))}원`;
};

const getEventTypeLabel = (eventType) =>
  eventType === "funeral" ? "부고" : "청첩";

const RELATION_CATEGORY_LABELS = {
  groom: "신랑측",
  bride: "신부측",
  mourner: "상주측",
  mourner_side: "상주측",
  host: "주최측",
  guest: "조문객",
  condolence_guest: "조문객",
  family: "가족",
  friend: "친구",
  colleague: "직장",
  coworker: "직장",
  relative: "친척",
  acquaintance: "지인",
  other: "기타",
};

const RELATION_DETAIL_LABELS = {
  family: "가족",
  friend: "친구",
  colleague: "직장동료",
  coworker: "직장동료",
  senior: "선배",
  junior: "후배",
  relative: "친척",
  acquaintance: "지인",
  neighbor: "이웃",
  school: "학교",
  company: "회사",
  church: "종교",
  other: "기타",
};

const getRelationLabel = (value, map) => {
  if (!value) return "";
  return map[value] || map[String(value).toLowerCase()] || value;
};

const getGivenName = (fullName = "") => {
  const name = String(fullName || "")
    .trim()
    .replace(/\s+/g, "");
  if (name.length >= 3) return name.slice(1);
  return name;
};

const getCasualName = (guest) => {
  const givenName = getGivenName(guest?.guest_name);
  return givenName || "친구";
};

const hasKoreanFinalConsonant = (value = "") => {
  const clean = String(value || "").trim();
  if (!clean) return false;
  const code = clean.charCodeAt(clean.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
};

const getVocativeName = (name = "") =>
  hasKoreanFinalConsonant(name) ? `${name}아` : `${name}야`;

const getKinshipName = (name = "", title = "") =>
  hasKoreanFinalConsonant(name) ? `${name}이 ${title}` : `${name} ${title}`;

const buildTemplateTexts = (guest, tone) => {
  const fullName = String(guest?.guest_name || "").trim();
  const politeName = fullName ? `${fullName}님, ` : "";
  const casualName = getCasualName(guest);
  const friendName = getVocativeName(casualName);
  const brotherName = getKinshipName(casualName, "형");
  const sisterName = getKinshipName(casualName, "누나");
  const juniorName = getVocativeName(casualName);
  const isFuneral = guest?.event_type === "funeral";

  const weddingTemplates = {
    polite: [
      `${politeName}오늘 와주시고 따뜻하게 축하해주셔서 정말 감사드립니다. 보내주신 마음 잊지 않고 예쁘게 잘 살겠습니다. 😊`,
      `${politeName}바쁘신데 귀한 시간 내주셔서 감사드립니다. 함께해주신 덕분에 더 행복한 하루였습니다. 🙏`,
      `${politeName}멀리서도 마음 전해주시고 축하해주셔서 감사드립니다. 좋은 마음 오래 기억하겠습니다. 😊`,
      `${politeName}오늘 함께해주셔서 진심으로 감사드립니다. 축하해주신 마음 덕분에 큰 힘이 되었습니다. 🙏`,
      `${politeName}소중한 걸음 해주셔서 감사드립니다. 보내주신 따뜻한 마음 잘 간직하며 행복하게 살겠습니다. 😊`,
    ],
    friend: [
      `${friendName}, 오늘 와줘서 진짜 고마워. 덕분에 긴장도 풀리고 하루가 훨씬 더 좋았어. 조만간 밥 한번 먹자 😊`,
      `${friendName}, 바쁜데 와줘서 고마워. 네가 와줘서 마음이 엄청 든든했어. 축하해준 마음 잊지 않을게!`,
      `${friendName}, 오늘 얼굴 봐서 너무 좋았어. 와주고 축하해줘서 진짜 고마워. 곧 편하게 보자 😊`,
      `${friendName}, 와줘서 고마워. 정신없어서 제대로 인사도 못 했는데 네 덕분에 정말 행복했어!`,
      `${friendName}, 오늘 함께해줘서 고마워. 보내준 마음까지 잘 받았어. 나중에 제대로 한 번 볼게 😊`,
    ],
    brother: [
      `${brotherName}, 바쁜데 와줘서 정말 고마워요. 형이 와주니까 마음이 훨씬 든든했어요. 조만간 연락드릴게요 🙏`,
      `${brotherName}, 오늘 축하해주셔서 감사해요. 정신없어서 인사를 길게 못 드렸는데 정말 큰 힘이 됐어요.`,
      `${brotherName}, 귀한 시간 내주셔서 고마워요. 보내주신 마음 잘 기억하면서 예쁘게 살겠습니다 😊`,
      `${brotherName}, 와주셔서 정말 감사해요. 덕분에 더 따뜻하고 든든한 하루였습니다. 곧 편하게 뵐게요.`,
      `${brotherName}, 오늘 함께해주셔서 고맙습니다. 축하해주신 마음 오래 기억할게요 🙏`,
    ],
    sister: [
      `${sisterName}, 바쁜데 와줘서 정말 고마워요. 누나가 축하해줘서 마음이 많이 든든했어요 😊`,
      `${sisterName}, 오늘 함께해주셔서 감사해요. 정신없어서 제대로 인사 못 드렸지만 정말 고마웠어요.`,
      `${sisterName}, 귀한 걸음 해주셔서 고마워요. 따뜻하게 축하해주신 마음 오래 기억할게요 🙏`,
      `${sisterName}, 와주셔서 정말 감사해요. 덕분에 하루가 더 따뜻하고 행복했습니다.`,
      `${sisterName}, 오늘 축하해주셔서 고마워요. 조만간 편하게 연락드리고 인사드릴게요 😊`,
    ],
    junior: [
      `${juniorName}, 오늘 와줘서 고마워. 덕분에 기분 좋고 든든했어. 조만간 편하게 보자 😊`,
      `${juniorName}, 바쁜데 시간 내줘서 고마워. 축하해준 마음 잘 받았고 오래 기억할게!`,
      `${juniorName}, 와줘서 정말 고마워. 정신없어서 제대로 챙기진 못했지만 너무 고마웠어.`,
      `${juniorName}, 오늘 함께해줘서 고마워. 네가 와줘서 하루가 더 따뜻했어 😊`,
      `${juniorName}, 축하해줘서 고마워. 보내준 마음까지 잘 받았어. 다음에 편하게 보자!`,
    ],
    short: [
      `${politeName}오늘 함께해주시고 축하해주셔서 정말 감사합니다. 😊`,
      `${politeName}귀한 걸음과 따뜻한 마음 진심으로 감사드립니다. 🙏`,
      `${politeName}축하해주신 마음 오래 기억하겠습니다. 감사합니다. 😊`,
      `${politeName}함께해주셔서 덕분에 행복한 하루였습니다. 감사합니다.`,
      `${politeName}보내주신 마음 잘 받았습니다. 진심으로 감사드립니다. 🙏`,
    ],
  };

  const funeralTemplates = {
    polite: [
      `${politeName}바쁘신 와중에도 와주시고 따뜻한 위로 전해주셔서 진심으로 감사드립니다. 덕분에 큰 힘이 되었습니다. 🤍`,
      `${politeName}어려운 걸음 해주시고 마음 써주셔서 감사드립니다. 보내주신 위로 오래 기억하겠습니다.`,
      `${politeName}함께해주시고 위로해주셔서 진심으로 감사드립니다. 정신없는 중에도 큰 힘이 되었습니다. 🙏`,
      `${politeName}따뜻한 마음 전해주셔서 감사드립니다. 덕분에 무사히 잘 모실 수 있었습니다.`,
      `${politeName}귀한 시간 내어 함께해주셔서 감사드립니다. 보내주신 마음 잊지 않겠습니다. 🤍`,
    ],
    friend: [
      `${friendName}, 와줘서 정말 고마워. 정신없는 와중에도 네가 있어줘서 큰 힘이 됐어. 잊지 않을게 🤍`,
      `${friendName}, 마음 써줘서 고마워. 제대로 인사도 못 했는데 와줘서 정말 든든했어.`,
      `${friendName}, 와주고 위로해줘서 고마워. 네 말이랑 마음이 많이 힘이 됐어.`,
      `${friendName}, 어려운 자리 와줘서 진짜 고마워. 나중에 편할 때 따로 연락할게.`,
      `${friendName}, 챙겨줘서 고마워. 정신없어서 표현을 못 했는데 정말 큰 위로가 됐어 🤍`,
    ],
    brother: [
      `${brotherName}, 어려운 걸음 해주셔서 정말 감사해요. 형 마음 덕분에 큰 힘이 됐습니다. 🙏`,
      `${brotherName}, 와주시고 위로해주셔서 고마워요. 정신없는 중에도 많이 든든했습니다.`,
      `${brotherName}, 마음 써주셔서 감사해요. 보내주신 위로 잊지 않겠습니다.`,
      `${brotherName}, 함께해주셔서 정말 고맙습니다. 덕분에 큰 힘 얻었습니다.`,
      `${brotherName}, 바쁘신데 와주셔서 감사해요. 나중에 따로 연락드리겠습니다. 🤍`,
    ],
    sister: [
      `${sisterName}, 어려운 걸음 해주셔서 정말 감사해요. 따뜻한 위로가 큰 힘이 됐습니다. 🤍`,
      `${sisterName}, 와주시고 마음 써주셔서 고마워요. 정신없는 중에도 많이 든든했어요.`,
      `${sisterName}, 함께해주셔서 감사해요. 보내주신 위로 오래 기억하겠습니다.`,
      `${sisterName}, 바쁘신데 와주셔서 정말 고마워요. 덕분에 큰 힘이 됐습니다.`,
      `${sisterName}, 따뜻하게 챙겨주셔서 감사해요. 나중에 따로 연락드릴게요. 🙏`,
    ],
    junior: [
      `${juniorName}, 와줘서 고마워. 네가 챙겨준 마음 덕분에 정말 큰 힘이 됐어 🤍`,
      `${juniorName}, 어려운 자리 와줘서 고마워. 정신없었는데 네 마음이 많이 고마웠어.`,
      `${juniorName}, 위로해줘서 고마워. 보내준 마음 잊지 않을게.`,
      `${juniorName}, 와주고 챙겨줘서 정말 고마워. 나중에 편하게 연락할게.`,
      `${juniorName}, 마음 써줘서 고마워. 덕분에 조금이나마 힘낼 수 있었어. 🙏`,
    ],
    short: [
      `${politeName}따뜻한 위로와 마음 전해주셔서 진심으로 감사드립니다. 🤍`,
      `${politeName}함께해주셔서 큰 힘이 되었습니다. 감사합니다.`,
      `${politeName}어려운 걸음 해주셔서 진심으로 감사드립니다. 🙏`,
      `${politeName}보내주신 위로와 마음 오래 기억하겠습니다.`,
      `${politeName}마음 써주셔서 감사드립니다. 덕분에 큰 힘이 되었습니다. 🤍`,
    ],
  };

  return (
    (isFuneral ? funeralTemplates : weddingTemplates)[tone] ||
    (isFuneral ? funeralTemplates.polite : weddingTemplates.polite)
  );
};

const buildTemplateText = (guest, tone, index = 0) => {
  const templates = buildTemplateTexts(guest, tone);
  return templates[index] || templates[0] || "";
};

const MESSAGE_TEMPLATES = [
  { key: "polite", label: "정중", icon: "person-outline" },
  { key: "friend", label: "친구", icon: "happy-outline" },
  { key: "brother", label: "형", icon: "man-outline" },
  { key: "sister", label: "누나", icon: "woman-outline" },
  { key: "junior", label: "동생", icon: "accessibility-outline" },
  { key: "short", label: "짧게", icon: "ellipsis-horizontal" },
];

const STATUS_FILTERS = [
  { key: "pending", label: "미처리" },
  { key: "done", label: "처리됨" },
  { key: "all", label: "전체" },
];

const formatSentAt = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const getAvatarInitial = (name = "") => {
  const cleanName = String(name || "")
    .trim()
    .replace(/\s+/g, "");
  return cleanName ? cleanName.slice(0, 1) : "정";
};

const RecipientCharacter = ({ name }) => {
  const initial = getAvatarInitial(name);
  return (
    <View style={styles.recipientCharacterWrap}>
      <Text style={styles.recipientCharacterInitial}>{initial}</Text>
    </View>
  );
};

export default function ThankYouMessagesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guests, setGuests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("polite");
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sentHistory, setSentHistory] = useState({});
  const sheetFade = React.useRef(new Animated.Value(0)).current;
  const sheetSlide = React.useRef(new Animated.Value(360)).current;
  const messageInputRef = React.useRef(null);
  const { showAlert, alertProps } = useSimpleAlert();
  const showAlertRef = React.useRef(showAlert);
  showAlertRef.current = showAlert;

  const sentCount = guests.filter((guest) => sentHistory[guest.id]).length;
  const pendingCount = Math.max(guests.length - sentCount, 0);
  const filteredGuests = React.useMemo(() => {
    if (statusFilter === "pending") {
      return guests.filter((guest) => !sentHistory[guest.id]);
    }
    if (statusFilter === "done") {
      return guests.filter((guest) => sentHistory[guest.id]);
    }
    return guests;
  }, [guests, sentHistory, statusFilter]);
  const currentTemplateTexts = React.useMemo(
    () => buildTemplateTexts(selectedGuest, selectedTemplate),
    [selectedGuest, selectedTemplate],
  );

  const getHistoryKey = useCallback(
    (userId) =>
      userId
        ? `${THANK_YOU_HISTORY_PREFIX}:${userId}`
        : THANK_YOU_HISTORY_PREFIX,
    [],
  );

  const loadSentHistory = useCallback(
    async (userId) => {
      try {
        const raw = await AsyncStorage.getItem(getHistoryKey(userId));
        const parsed = raw ? JSON.parse(raw) : {};
        setSentHistory(parsed && typeof parsed === "object" ? parsed : {});
      } catch {
        setSentHistory({});
      }
    },
    [getHistoryKey],
  );

  const saveSentHistory = useCallback(
    async (nextHistory, userId = currentUserId) => {
      setSentHistory(nextHistory);
      try {
        await AsyncStorage.setItem(
          getHistoryKey(userId),
          JSON.stringify(nextHistory),
        );
      } catch (error) {
        console.warn("감사 인사 이력 저장 실패:", error);
      }
    },
    [currentUserId, getHistoryKey],
  );

  const groupedGuests = React.useMemo(() => {
    const map = new Map();
    filteredGuests.forEach((guest) => {
      const key = guest.event_id || "unknown";
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          event_name: guest.event_name || "행사",
          event_type: guest.event_type,
          event_date: guest.event_date,
          totalAmount: 0,
          guests: [],
        });
      }
      const group = map.get(key);
      group.totalAmount += Number(guest.amount || 0);
      group.guests.push(guest);
    });
    return Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(a.event_date || 0).getTime();
      const bTime = new Date(b.event_date || 0).getTime();
      return bTime - aTime;
    });
  }, [filteredGuests]);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const info = await getCurrentUserInfo();
      const userId = info?.user?.id;
      if (!userId) {
        setGuests([]);
        return;
      }
      setCurrentUserId(userId);
      await loadSentHistory(userId);

      const [{ data: ownedEvents }, sharedResult] = await Promise.all([
        supabase
          .from("events")
          .select("id, event_name, event_type, event_date, is_finalized")
          .eq("user_id", userId),
        getSharedEventsForCurrentUser(),
      ]);

      const eventMap = new Map();
      [...(ownedEvents || []), ...(sharedResult?.data || [])].forEach(
        (event) => {
          if (event?.id && event.is_finalized === true) {
            eventMap.set(event.id, event);
          }
        },
      );

      const eventIds = Array.from(eventMap.keys());
      if (eventIds.length === 0) {
        setGuests([]);
        return;
      }

      const { data, error } = await supabase
        .from("guest_book")
        .select(
          "id, event_id, guest_name, guest_phone, amount, relation_category, relation_detail, created_at, input_method, additional_info",
        )
        .in("event_id", eventIds)
        .not("guest_phone", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data || [])
        .map((row) => {
          const event = eventMap.get(row.event_id) || {};
          const info = parseAdditionalInfo(row.additional_info);
          return {
            ...row,
            event_name: event.event_name || "행사",
            event_type: event.event_type,
            event_date: event.event_date,
            source: row.input_method || info.created_via || "app",
            normalized_phone: normalizePhone(row.guest_phone),
          };
        })
        .filter((row) => row.normalized_phone);

      setGuests(rows);
    } catch (error) {
      console.error("감사 인사 대상 로딩 실패:", error);
      showAlertRef.current({
        title: "불러오기 실패",
        message: "감사 인사 대상을 불러오지 못했습니다.",
      });
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [loadSentHistory]);

  useFocusEffect(
    useCallback(() => {
      loadGuests();
    }, [loadGuests]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGuests();
    setRefreshing(false);
  };

  const openMessageModal = (guest) => {
    setSelectedGuest(guest);
    setSelectedTemplate("polite");
    setSelectedTemplateIndex(0);
    setMessage(buildTemplateText(guest, "polite"));
    setSheetVisible(true);
    sheetFade.setValue(0);
    sheetSlide.setValue(360);
    Animated.parallel([
      Animated.timing(sheetFade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(sheetSlide, {
        toValue: 0,
        damping: 24,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMessageModal = () => {
    Animated.parallel([
      Animated.timing(sheetFade, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetSlide, {
        toValue: 360,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSheetVisible(false);
      setSelectedGuest(null);
      setMessage("");
      setSelectedTemplate("polite");
      setSelectedTemplateIndex(0);
      setEditModalVisible(false);
    });
  };

  const applyTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    setSelectedTemplateIndex(0);
    setMessage(buildTemplateText(selectedGuest, templateKey));
  };

  const applyTemplateOption = (index) => {
    setSelectedTemplateIndex(index);
    setMessage(buildTemplateText(selectedGuest, selectedTemplate, index));
  };

  const openEditModal = () => {
    setEditModalVisible(true);
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 260);
  };

  const closeEditModal = () => {
    Keyboard.dismiss();
    setEditModalVisible(false);
  };

  const openSmsApp = async () => {
    const phone = normalizePhone(selectedGuest?.guest_phone);
    const body = message.trim();

    if (!phone || !body) {
      showAlert({
        title: "확인 필요",
        message: "휴대폰번호와 감사 문구를 확인해주세요.",
      });
      return;
    }

    try {
      const separator = Platform.OS === "ios" ? "&" : "?";
      await Linking.openURL(
        `sms:${phone}${separator}body=${encodeURIComponent(body)}`,
      );
      if (selectedGuest?.id) {
        await saveSentHistory({
          ...sentHistory,
          [selectedGuest.id]: {
            sent_at: new Date().toISOString(),
            message: body,
            phone,
            guest_name: selectedGuest.guest_name || "",
            event_id: selectedGuest.event_id || "",
            event_name: selectedGuest.event_name || "",
            template: selectedTemplate,
            template_index: selectedTemplateIndex,
          },
        });
      }
      setEditModalVisible(false);
      closeMessageModal();
    } catch (error) {
      showAlert({
        title: "문자앱 열기 실패",
        message: "기본 메시지 앱을 열 수 없습니다.",
      });
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.("Home");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.78}
        >
          <Ionicons name="chevron-back" size={24} color="#191F28" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>감사 인사</Text>
        <View style={styles.topRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroVisual}>
            <Image
              source={THANK_YOU_HERO_IMAGE}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>문자앱으로 마음을 전해요</Text>
            <Text style={styles.heroSubtitle}>
              하객을 고르면 문구를 수정한 뒤 내 휴대폰 메시지 앱으로 보낼 수
              있어요.
            </Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>경조사별 대상</Text>
            <Text style={styles.listSubtitle}>
              미처리와 처리됨을 나눠서 관리해요
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredGuests.length}명</Text>
          </View>
        </View>

        {!loading && guests.length > 0 && (
          <View style={styles.statusTabs}>
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter.key;
              const count =
                filter.key === "pending"
                  ? pendingCount
                  : filter.key === "done"
                    ? sentCount
                    : guests.length;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.statusTab, active && styles.statusTabActive]}
                  onPress={() => setStatusFilter(filter.key)}
                  activeOpacity={0.78}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      active && styles.statusTabTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                  <View
                    style={[
                      styles.statusTabCountBadge,
                      active && styles.statusTabCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTabCountText,
                        active && styles.statusTabCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>대상을 불러오는 중이에요</Text>
          </View>
        ) : guests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={40}
              color="#C8D0DA"
            />
            <Text style={styles.emptyTitle}>보낼 대상이 없어요</Text>
            <Text style={styles.emptyText}>
              하객 접수에서 휴대폰번호가 저장되면 여기에 표시됩니다.
            </Text>
          </View>
        ) : filteredGuests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name={
                statusFilter === "pending"
                  ? "checkmark-done-outline"
                  : "time-outline"
              }
              size={40}
              color="#C8D0DA"
            />
            <Text style={styles.emptyTitle}>
              {statusFilter === "pending"
                ? "미처리 대상이 없어요"
                : "처리된 대상이 없어요"}
            </Text>
            <Text style={styles.emptyText}>
              {statusFilter === "pending"
                ? "현재 저장된 대상은 모두 감사 인사 처리가 완료됐습니다."
                : "문자앱을 열어 발송 처리하면 이곳에 표시됩니다."}
            </Text>
          </View>
        ) : (
          <View style={styles.groupList}>
            {groupedGuests.map((group) => (
              <View key={group.id} style={styles.eventGroupCard}>
                <View style={styles.eventGroupHeader}>
                  <View style={styles.eventThumbWrap}>
                    <Image
                      source={getEventTypeImage(group.event_type)}
                      style={styles.eventThumb}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.eventGroupInfo}>
                    <Text style={styles.eventGroupTitle} numberOfLines={1}>
                      {group.event_name}
                    </Text>
                    <Text style={styles.eventGroupMeta}>
                      {getEventTypeLabel(group.event_type)} ·{" "}
                      {group.guests.length}명 ·{" "}
                      {formatAmount(group.totalAmount)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.groupStatusBadge,
                      statusFilter === "done" && styles.groupStatusBadgeDone,
                      statusFilter === "all" && styles.groupStatusBadgeAll,
                    ]}
                  >
                    <Text
                      style={[
                        styles.groupStatusText,
                        statusFilter === "done" && styles.groupStatusTextDone,
                        statusFilter === "all" && styles.groupStatusTextAll,
                      ]}
                    >
                      {statusFilter === "pending"
                        ? "미처리"
                        : statusFilter === "done"
                          ? "처리됨"
                          : "전체"}
                    </Text>
                  </View>
                </View>

                <View style={styles.groupGuestList}>
                  {group.guests.map((guest) => (
                    <TouchableOpacity
                      key={guest.id}
                      style={[
                        styles.guestCard,
                        sentHistory[guest.id] && styles.guestCardDone,
                      ]}
                      onPress={() => openMessageModal(guest)}
                      activeOpacity={0.82}
                    >
                      <View style={styles.guestInfo}>
                        <View style={styles.guestTopRow}>
                          <Text style={styles.guestName} numberOfLines={1}>
                            {guest.guest_name || "이름 없음"}
                          </Text>
                          <Text style={styles.guestAmount}>
                            {formatAmount(guest.amount)}
                          </Text>
                        </View>
                        <View style={styles.guestSubRow}>
                          {!!guest.relation_category && (
                            <Text
                              style={styles.guestRelation}
                              numberOfLines={1}
                            >
                              {getRelationLabel(
                                guest.relation_category,
                                RELATION_CATEGORY_LABELS,
                              )}
                              {guest.relation_detail
                                ? ` · ${getRelationLabel(guest.relation_detail, RELATION_DETAIL_LABELS)}`
                                : ""}
                            </Text>
                          )}
                          <View style={styles.phoneRow}>
                            <Ionicons
                              name="call-outline"
                              size={13}
                              color="#8B95A1"
                            />
                            <Text style={styles.guestPhone}>
                              {formatPhone(guest.guest_phone)}
                            </Text>
                          </View>
                        </View>
                        {!!sentHistory[guest.id]?.sent_at && (
                          <View style={styles.sentInfoRow}>
                            <Ionicons
                              name="checkmark-circle"
                              size={13}
                              color="#16A34A"
                            />
                            <Text style={styles.sentInfoText}>
                              {formatSentAt(sentHistory[guest.id].sent_at)}{" "}
                              처리됨
                            </Text>
                          </View>
                        )}
                      </View>
                      <View
                        style={[
                          styles.sendPill,
                          sentHistory[guest.id] && styles.sendPillDone,
                        ]}
                      >
                        {sentHistory[guest.id] ? (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#16A34A"
                          />
                        ) : (
                          <Ionicons
                            name="chevron-forward"
                            size={17}
                            color="#2563EB"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeMessageModal}
      >
        <View style={styles.sheetOverlay}>
          <Animated.View style={[styles.sheetBackdrop, { opacity: sheetFade }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeMessageModal}
            />
          </Animated.View>
          {editModalVisible ? (
            <KeyboardAvoidingView
              style={styles.editModalOverlay}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                accessible={false}
              >
                <View style={styles.editModalCard}>
                  <View style={styles.editModalTop}>
                    <TouchableOpacity
                      style={styles.editModalClose}
                      onPress={closeEditModal}
                    >
                      <Ionicons name="chevron-back" size={24} color="#191F28" />
                    </TouchableOpacity>
                    <Text style={styles.editModalTitle}>문구 직접 수정</Text>
                    <View style={styles.editModalSpacer} />
                  </View>

                  <View style={styles.editRecipientBox}>
                    <RecipientCharacter name={selectedGuest?.guest_name} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.editRecipientName} numberOfLines={1}>
                        {selectedGuest?.guest_name || "하객"}
                      </Text>
                      <Text style={styles.editRecipientMeta} numberOfLines={1}>
                        {formatPhone(selectedGuest?.guest_phone || "")} ·{" "}
                        {selectedGuest?.event_name || "행사"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.editInputHeader}>
                    <Text style={styles.editInputLabel}>보낼 문구</Text>
                    <Text style={styles.editInputCount}>
                      {message.length}/500
                    </Text>
                  </View>
                  <TextInput
                    ref={messageInputRef}
                    style={styles.editMessageInput}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />

                  <View style={styles.editModalActions}>
                    <TouchableOpacity
                      style={styles.editModalCancelButton}
                      onPress={closeEditModal}
                    >
                      <Text style={styles.editModalCancelText}>돌아가기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editModalSendButton}
                      onPress={openSmsApp}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={17}
                        color="#FFFFFF"
                      />
                      <Text style={styles.editModalSendText}>문자앱 열기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          ) : (
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <Animated.View
                style={[
                  styles.sheetCard,
                  { transform: [{ translateY: sheetSlide }] },
                ]}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.sheetTop}>
                  <View style={styles.sheetTitleBox}>
                    <Text style={styles.sheetEyebrow}>감사 인사</Text>
                    <Text style={styles.sheetTitle}>어떤 톤으로 보낼까요?</Text>
                    <Text style={styles.sheetName} numberOfLines={1}>
                      {selectedGuest?.guest_name || "하객"} ·{" "}
                      {selectedGuest?.event_name || "행사"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sheetClose}
                    onPress={closeMessageModal}
                  >
                    <Ionicons name="close" size={22} color="#8B95A1" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.sheetBody}
                  contentContainerStyle={styles.sheetBodyContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.sheetRecipientCard}>
                    <RecipientCharacter name={selectedGuest?.guest_name} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.sheetRecipientName} numberOfLines={1}>
                        {selectedGuest?.guest_name || "하객"}
                      </Text>
                      <Text style={styles.sheetRecipientPhone}>
                        {formatPhone(selectedGuest?.guest_phone || "")}
                      </Text>
                    </View>
                    {!!sentHistory[selectedGuest?.id] && (
                      <View style={styles.sheetDoneBadge}>
                        <Ionicons name="checkmark" size={13} color="#16A34A" />
                        <Text style={styles.sheetDoneBadgeText}>처리됨</Text>
                      </View>
                    )}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.toneRail}
                    keyboardShouldPersistTaps="handled"
                  >
                    {MESSAGE_TEMPLATES.map((template) => {
                      const active = selectedTemplate === template.key;
                      return (
                        <TouchableOpacity
                          key={template.key}
                          style={[
                            styles.toneButton,
                            active && styles.toneButtonActive,
                          ]}
                          onPress={() => applyTemplate(template.key)}
                          activeOpacity={0.82}
                        >
                          <Ionicons
                            name={template.icon}
                            size={24}
                            color={active ? "#FFFFFF" : "#4E5968"}
                          />
                          <Text
                            style={[
                              styles.toneLabel,
                              active && styles.toneLabelActive,
                            ]}
                          >
                            {template.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.templateOptionHeader}>
                    <Text style={styles.templateOptionTitle}>추천 문구</Text>
                    <Text style={styles.templateOptionMeta}>
                      5개 중 {selectedTemplateIndex + 1}번
                    </Text>
                  </View>
                  <View style={styles.templateOptionList}>
                    {currentTemplateTexts.map((text, index) => {
                      const active = selectedTemplateIndex === index;
                      return (
                        <TouchableOpacity
                          key={`${selectedTemplate}-${index}`}
                          style={[
                            styles.templateOptionRowCard,
                            active && styles.templateOptionRowCardActive,
                          ]}
                          onPress={() => applyTemplateOption(index)}
                          activeOpacity={0.82}
                        >
                          <View
                            style={[
                              styles.templateOptionNumber,
                              active && styles.templateOptionNumberActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.templateOptionNumberText,
                                active && styles.templateOptionNumberTextActive,
                              ]}
                            >
                              {index + 1}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.templateOptionText,
                              active && styles.templateOptionTextActive,
                            ]}
                            numberOfLines={3}
                          >
                            {text}
                          </Text>
                          <View
                            style={[
                              styles.templateOptionCheck,
                              active && styles.templateOptionCheckActive,
                            ]}
                          >
                            {active && (
                              <Ionicons
                                name="checkmark"
                                size={15}
                                color="#FFFFFF"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.messagePreviewBox}>
                    <View style={styles.messagePreviewHeader}>
                      <Text style={styles.messagePreviewTitle}>
                        선택한 문구
                      </Text>
                      <Text style={styles.messagePreviewCount}>
                        {message.length}/500
                      </Text>
                    </View>
                    <Text style={styles.messagePreviewText} numberOfLines={4}>
                      {message}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={openEditModal}
                  >
                    <Ionicons name="create-outline" size={17} color="#4E5968" />
                    <Text style={styles.editText}>직접 수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smsButton}
                    onPress={openSmsApp}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={17}
                      color="#FFFFFF"
                    />
                    <Text style={styles.smsText}>문자앱 열기</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </Modal>

      <SimpleModal {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  topBar: {
    height: 58,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  topRightSpacer: {
    width: 40,
    height: 40,
  },
  content: { padding: 18, paddingBottom: 40 },
  heroCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EEF8",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 18,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  heroVisual: {
    width: 96,
    height: 76,
    borderRadius: 18,
    backgroundColor: "#F5F9FF",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroTextBox: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  heroSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0,
  },
  listHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  listSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#8B95A1",
  },
  countBadge: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    backgroundColor: "#EEF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
  },
  statusTabs: {
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EDEFF3",
    padding: 4,
    marginBottom: 14,
    flexDirection: "row",
    gap: 4,
  },
  statusTab: {
    flex: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statusTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6B7280",
  },
  statusTabTextActive: {
    color: "#191F28",
  },
  statusTabCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: "#D9DEE7",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTabCountBadgeActive: {
    backgroundColor: "#2563EB",
  },
  statusTabCountText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    color: "#6B7280",
    textAlign: "center",
  },
  statusTabCountTextActive: {
    color: "#FFFFFF",
  },
  loadingBox: { marginTop: 80, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "700", color: "#8B95A1" },
  emptyBox: { marginTop: 80, alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "900",
    color: "#191F28",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#8B95A1",
    textAlign: "center",
  },
  groupList: { gap: 14 },
  eventGroupCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF4",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  eventGroupHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  eventThumbWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  eventThumb: {
    width: 30,
    height: 30,
  },
  eventGroupInfo: {
    flex: 1,
    minWidth: 0,
  },
  groupStatusBadge: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  groupStatusBadgeDone: {
    backgroundColor: "#ECFDF3",
  },
  groupStatusBadgeAll: {
    backgroundColor: "#EEF6FF",
  },
  groupStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#F59E0B",
  },
  groupStatusTextDone: {
    color: "#16A34A",
  },
  groupStatusTextAll: {
    color: "#2563EB",
  },
  eventGroupTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  eventGroupMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0,
  },
  groupGuestList: {
    padding: 10,
    gap: 8,
  },
  guestCard: {
    minHeight: 74,
    borderRadius: 14,
    backgroundColor: "#FAFBFD",
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#EEF1F5",
  },
  guestCardDone: {
    backgroundColor: "#F7FCF9",
    borderColor: "#D7F0DF",
  },
  guestInfo: { flex: 1, minWidth: 0 },
  guestTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guestName: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  guestAmount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: 0,
  },
  guestSubRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  guestRelation: {
    maxWidth: "48%",
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  guestPhone: { fontSize: 12, fontWeight: "800", color: "#8B95A1" },
  sentInfoRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sentInfoText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#16A34A",
  },
  sendPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendPillDone: {
    backgroundColor: "#DCFCE7",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.46)",
  },
  sheetCard: {
    height: "90%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 14,
    overflow: "hidden",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D6DB",
    marginBottom: 18,
  },
  sheetTop: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  sheetTitleBox: { flex: 1, minWidth: 0 },
  sheetEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: 0,
  },
  sheetTitle: {
    marginTop: 4,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: 0,
  },
  sheetName: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "800",
    color: "#8B95A1",
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  sheetBodyContent: {
    paddingBottom: 28,
  },
  sheetRecipientCard: {
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF1F5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  sheetRecipientName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#191F28",
  },
  sheetRecipientPhone: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
  },
  recipientCharacterWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#EEF6FF",
    borderWidth: 1,
    borderColor: "#DCEBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  recipientCharacterInitial: {
    textAlign: "center",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: "#2563EB",
  },
  sheetDoneBadge: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 9,
    backgroundColor: "#ECFDF3",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  sheetDoneBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#16A34A",
  },
  toneRail: {
    marginTop: 14,
    paddingBottom: 2,
    flexDirection: "row",
    gap: 7,
  },
  toneButton: {
    width: 58,
    height: 76,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF1F5",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 5,
  },
  toneButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  toneLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#4E5968",
    letterSpacing: 0,
  },
  toneLabelActive: {
    color: "#FFFFFF",
  },
  templateOptionHeader: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  templateOptionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#191F28",
  },
  templateOptionMeta: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8B95A1",
  },
  templateOptionList: {
    marginTop: 9,
    gap: 8,
  },
  templateOptionRowCard: {
    minHeight: 74,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF1F5",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  templateOptionRowCardActive: {
    backgroundColor: "#F5F9FF",
    borderColor: "#BFD8FF",
  },
  templateOptionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5EAF1",
    alignItems: "center",
    justifyContent: "center",
  },
  templateOptionNumberActive: {
    backgroundColor: "#2563EB",
  },
  templateOptionNumberText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    color: "#6B7280",
    textAlign: "center",
  },
  templateOptionNumberTextActive: {
    color: "#FFFFFF",
  },
  templateOptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#4B5563",
    letterSpacing: 0,
  },
  templateOptionTextActive: {
    color: "#191F28",
    fontWeight: "800",
  },
  templateOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5EAF1",
    alignItems: "center",
    justifyContent: "center",
  },
  templateOptionCheckActive: {
    backgroundColor: "#2563EB",
  },
  messagePreviewBox: {
    marginTop: 16,
    marginBottom: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#F9FAFB",
    padding: 14,
  },
  messagePreviewHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messagePreviewTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#191F28",
  },
  messagePreviewCount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8B95A1",
  },
  messagePreviewText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: "#4B5563",
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F5",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F2F4F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  editText: { fontSize: 15, fontWeight: "900", color: "#4E5968" },
  smsButton: {
    flex: 1.35,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  smsText: { fontSize: 15, fontWeight: "900", color: "#FFFFFF" },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  editModalCard: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 54 : 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },
  editModalTop: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  editModalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#191F28",
  },
  editModalSpacer: {
    width: 40,
    height: 40,
  },
  editRecipientBox: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF1F5",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  editRecipientName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#191F28",
  },
  editRecipientMeta: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "800",
    color: "#8B95A1",
  },
  editInputHeader: {
    marginTop: 22,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editInputLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: "#191F28",
  },
  editInputCount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8B95A1",
  },
  editMessageInput: {
    flex: 1,
    minHeight: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE3EC",
    backgroundColor: "#F9FAFB",
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#191F28",
  },
  editModalActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  editModalCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  editModalCancelText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#4E5968",
  },
  editModalSendButton: {
    flex: 1.35,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  editModalSendText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
