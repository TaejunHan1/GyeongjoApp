// src/screens/main/MyEventsScreen.js
import React, { useState } from "react";
import {
  Alert,
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Modal,
  Image,
  InteractionManager,
  Platform,
  ActivityIndicator,
  DeviceEventEmitter,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  getUserEvents,
  getEventStatistics,
  deleteEvent,
  updateEvent,
  finalizeEvent,
} from "../../lib/supabaseHelper";
import { supabase } from "../../lib/supabase";
import { getAlimtalkBalance } from "../../lib/alimtalkCredit";
import { getCurrentUserInfo } from "../../lib/supabaseHelper";
import {
  getEventCardCoverPurchaseState,
  purchaseEventCardCover,
} from "../../lib/eventCardCoverCredit";
import { getSharedEventsForCurrentUser } from "../../lib/eventSharing";
import {
  normalizePhone,
  samePhone,
  isValidKoreanMobile,
} from "../../lib/phoneUtils";
import SimpleModal from "../../components/SimpleModal";
import ReceiptModal from "../../components/ReceiptModal";
import LottieLoading from "../../components/LottieLoading";
import { useSimpleAlert } from "../../hooks/useSimpleAlert";
import { useTutorial } from "../../contexts/TutorialContext";

const EVENT_CARD_COVERS = [
  {
    key: "classic_ivory",
    label: "클래식 아이보리",
    description: "고급스러운 봉투 느낌",
    price: 50,
    image: require("../../../assets/event-card-covers/cover-classic-ivory.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-classic-ivory-thumb.png"),
  },
  {
    key: "modern_blue",
    label: "모던 블루",
    description: "차분한 프리미엄 톤",
    price: 60,
    image: require("../../../assets/event-card-covers/cover-modern-blue.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-modern-blue-thumb.png"),
  },
  {
    key: "hanji_gold",
    label: "한지 골드",
    description: "전통 문양과 금박",
    price: 90,
    image: require("../../../assets/event-card-covers/cover-hanji-gold.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-hanji-gold-thumb.png"),
  },
  {
    key: "floral_soft",
    label: "플라워 소프트",
    description: "밝은 꽃 장식",
    price: 60,
    image: require("../../../assets/event-card-covers/cover-floral-soft.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-floral-soft-thumb.png"),
  },
  {
    key: "black_premium",
    label: "블랙 프리미엄",
    description: "묵직한 행사 카드",
    price: 120,
    image: require("../../../assets/event-card-covers/cover-black-premium.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-black-premium-thumb.png"),
  },
  {
    key: "minimal_lock",
    label: "미니멀 락",
    description: "정보 보호에 집중",
    price: 50,
    image: require("../../../assets/event-card-covers/cover-minimal-lock.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-minimal-lock-thumb.png"),
  },
  {
    key: "pearl_seal",
    label: "펄 실링 커버",
    description: "아이보리 실링 덮개",
    price: 90,
    image: require("../../../assets/event-card-covers/cover-pearl-seal.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-pearl-seal-thumb.png"),
  },
  {
    key: "sage_clasp",
    label: "세이지 클라스프",
    description: "차분한 잠금 커버",
    price: 90,
    image: require("../../../assets/event-card-covers/cover-sage-clasp.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-sage-clasp-thumb.png"),
  },
  {
    key: "onyx_seal",
    label: "오닉스 실링",
    description: "블랙 프리미엄 덮개",
    price: 120,
    image: require("../../../assets/event-card-covers/cover-onyx-seal.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-onyx-seal-thumb.png"),
  },
  {
    key: "rose_camellia",
    label: "로즈 카멜리아",
    description: "부드러운 로즈 덮개",
    price: 90,
    image: require("../../../assets/event-card-covers/cover-rose-camellia.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-rose-camellia-thumb.png"),
  },
  {
    key: "navy_plum",
    label: "네이비 매화",
    description: "금빛 매화 잠금 커버",
    price: 110,
    image: require("../../../assets/event-card-covers/cover-navy-plum.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-navy-plum-thumb.png"),
  },
  {
    key: "taupe_lattice",
    label: "토프 창호",
    description: "은은한 창호 덮개",
    price: 90,
    image: require("../../../assets/event-card-covers/cover-taupe-lattice.png"),
    thumb: require("../../../assets/event-card-covers/thumbs/cover-taupe-lattice-thumb.png"),
  },
];

const EVENT_TYPE_IMAGES = {
  wedding: require("../../../assets/icons/reciprocity/thumbs/wedding-thumb.png"),
  funeral: require("../../../assets/icons/reciprocity/thumbs/funeral-thumb.png"),
};
const COMPLETED_STAMP_IMAGE = require("../../../assets/images/completed-stamp.png");
const EVENT_TYPE_IMAGE_SOURCES = Object.values(EVENT_TYPE_IMAGES);

const FREE_COVER_KEYS = EVENT_CARD_COVERS.filter(
  (cover) => cover.price <= 0,
).map((cover) => cover.key);
const EVENT_COVER_THUMB_SOURCES = EVENT_CARD_COVERS.map(
  (cover) => cover.thumb || cover.image,
);
let coverThumbsPreloadStarted = false;
let eventTypeIconsPreloadStarted = false;

const preloadEventCoverOptionImages = () => {
  if (coverThumbsPreloadStarted) return;
  coverThumbsPreloadStarted = true;
  EVENT_COVER_THUMB_SOURCES.forEach((source) => {
    const uri = Image.resolveAssetSource(source)?.uri;
    if (uri) Image.prefetch(uri).catch(() => {});
  });
};

const preloadEventTypeIcons = () => {
  if (eventTypeIconsPreloadStarted) return;
  eventTypeIconsPreloadStarted = true;
  EVENT_TYPE_IMAGE_SOURCES.forEach((source) => {
    const uri = Image.resolveAssetSource(source)?.uri;
    if (uri) Image.prefetch(uri).catch(() => {});
  });
};

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

const getEventCoverKey = (event) => {
  const info = parseAdditionalInfo(event?.additional_info);
  return info.card_cover_key || null;
};

const getCoverByKey = (coverKey) =>
  EVENT_CARD_COVERS.find((cover) => cover.key === coverKey) || null;

export default function MyEventsScreen({ navigation, userInfo }) {
  const {
    startMyEventsTutorial,
    registerTarget,
    registerHandler,
    activeTutorial,
    step: tutorialStep,
  } = useTutorial();
  const creditBannerRef = React.useRef(null);
  const firstEventCardRef = React.useRef(null);
  const tutorialCheckedRef = React.useRef(false);

  const [activeTab, setActiveTab] = useState("hosted");
  const [hostedEvents, setHostedEvents] = useState([]);
  const [participatedEvents, setParticipatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hostedFilter, setHostedFilter] = useState("active");
  const [hostedSortBy, setHostedSortBy] = useState("eventDate"); // 'eventDate', 'createdAt', or 'totalAmount'
  const [hostedSortOrder, setHostedSortOrder] = useState("desc"); // 'desc' or 'asc'
  const [hostedSortVisible, setHostedSortVisible] = useState(false);
  const [finalizedEventIds, setFinalizedEventIds] = useState(new Set());
  const [finalizingEventId, setFinalizingEventId] = useState(null);
  const [stampAnimationEventId, setStampAnimationEventId] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const CACHE_DURATION = 30000;
  const completedStampScale = React.useRef(new Animated.Value(1)).current;
  const completedStampOpacity = React.useRef(new Animated.Value(1)).current;

  // iOS 스타일 커스텀 삭제 확인 모달
  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    eventId: null,
    eventName: "",
  });

  // 알림톡 크레딧 잔액
  const [alimtalkBalance, setAlimtalkBalance] = useState(null);
  // 크레딧 realtime 구독용 userId
  const [currentUserId, setCurrentUserId] = useState(null);
  // 공통 Alert 훅
  const { showAlert, alertProps } = useSimpleAlert();
  // 영수증 모달
  const [receiptModal, setReceiptModal] = useState({
    visible: false,
    receipt: null,
  });
  // 주최 카드 덮개 구매/적용
  const [coverSheetVisible, setCoverSheetVisible] = useState(false);
  const [selectedCoverEvent, setSelectedCoverEvent] = useState(null);
  const [ownedCoverKeys, setOwnedCoverKeys] = useState(FREE_COVER_KEYS);
  const [coverPurchaseLoading, setCoverPurchaseLoading] = useState(false);
  const [coverPurchaseConfirm, setCoverPurchaseConfirm] = useState({
    visible: false,
    cover: null,
  });
  const [coverPreloadMounted, setCoverPreloadMounted] = useState(false);
  const [eventIconPreloadMounted, setEventIconPreloadMounted] = useState(false);

  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      preloadEventTypeIcons();
      preloadEventCoverOptionImages();
      setEventIconPreloadMounted(true);
      setCoverPreloadMounted(true);
    });
    return () => task?.cancel?.();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (dataLoaded && now - lastLoadTime < CACHE_DURATION) return;
      loadAllData();
    }, [dataLoaded, lastLoadTime]),
  );

  // 내 행사 튜토리얼 자동 시작 — 최초 진입 시 1회
  useFocusEffect(
    React.useCallback(() => {
      if (tutorialCheckedRef.current) return;
      (async () => {
        try {
          const info = await getCurrentUserInfo();
          const uid = info?.user?.id;
          if (!uid) return;
          tutorialCheckedRef.current = true;
          const { data } = await supabase
            .from("users")
            .select("tutorial_my_events_completed")
            .eq("id", uid)
            .single();
          if (data && !data.tutorial_my_events_completed) {
            setTimeout(() => startMyEventsTutorial(), 600);
          }
        } catch (e) {
          console.warn("내 행사 튜토리얼 상태 조회 실패:", e);
        }
      })();
    }, [startMyEventsTutorial]),
  );

  // 튜토리얼 활성 중에는 타겟 반복 측정 (크레딧 배너 + 첫 행사 카드)
  React.useEffect(() => {
    if (activeTutorial !== "myEvents") return;
    const measureRef = (ref, key) => {
      if (ref.current?.measureInWindow) {
        ref.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            registerTarget(key, { x, y, width, height });
          }
        });
      }
    };
    const measure = () => {
      measureRef(creditBannerRef, "myEventsCreditBanner");
      measureRef(firstEventCardRef, "myEventsFirstEventCard");
    };
    measure();
    const id = setInterval(measure, 500);
    return () => clearInterval(id);
  }, [activeTutorial, registerTarget]);

  // 첫 행사 카드 탭 핸들러 등록 — 튜토리얼 오버레이가 호출 → EventDetail로 이동
  React.useEffect(() => {
    if (activeTutorial !== "myEvents") return;
    const first = filteredHostedEvents[0];
    if (!first) return;
    registerHandler("myEventsFirstEventCard", () => {
      navigation.navigate("EventDetail", {
        eventId: first.id,
        initialEvent: first,
        initialStats: {
          totalAmount: first.stats?.totalAmount || 0,
          totalCount: first.stats?.totalContributions || 0,
          averageAmount: first.stats?.averageAmount || 0,
          confirmedCount: first.stats?.verifiedCount || 0,
        },
      });
    });
  }, [activeTutorial, hostedEvents, hostedFilter, registerHandler, navigation]);

  const determineEventStatus = (eventDate) => {
    if (!eventDate) return "active";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(eventDate);
    d.setHours(0, 0, 0, 0);
    return d >= today ? "active" : "completed";
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadHostedEvents(),
        loadParticipatedEvents(),
        loadAlimtalkBalance(),
        loadCoverPurchaseState(),
      ]);
      setDataLoaded(true);
      setLastLoadTime(Date.now());
    } finally {
      setLoading(false);
    }
  };

  const loadAlimtalkBalance = async () => {
    try {
      const res = await getAlimtalkBalance();
      if (res?.success) setAlimtalkBalance(res.balance);
    } catch (e) {
      console.warn("alimtalk balance load failed:", e);
    }
  };

  const loadCoverPurchaseState = async (userId = null) => {
    try {
      const res = await getEventCardCoverPurchaseState(userId);
      if (res?.success) {
        setOwnedCoverKeys(
          Array.from(new Set([...FREE_COVER_KEYS, ...(res.coverKeys || [])])),
        );
        if (typeof res.balance === "number") setAlimtalkBalance(res.balance);
      }
    } catch (e) {
      console.warn("event cover purchase state load failed:", e);
    }
  };

  // users 테이블 realtime 구독 — 같은 기기/다른 기기 어디서 차감돼도 즉시 반영
  React.useEffect(() => {
    let channel = null;
    let eventsChannel = null;
    (async () => {
      const { getCurrentUserInfo } = await import("../../lib/supabaseHelper");
      const info = await getCurrentUserInfo();
      const uid = info?.user?.id;
      if (!uid) return;
      setCurrentUserId(uid);
      loadCoverPurchaseState(uid);
      channel = supabase
        .channel(`myevents_balance_${uid}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${uid}`,
          },
          (payload) => {
            const next = payload?.new?.alimtalk_balance;
            if (typeof next === "number") setAlimtalkBalance(next);
          },
        )
        .subscribe();

      eventsChannel = supabase
        .channel(`myevents_events_${uid}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "events",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            const next = payload?.new;
            if (!next?.id) return;
            setHostedEvents((prev) =>
              prev.map((event) =>
                event.id === next.id
                  ? {
                      ...event,
                      ...next,
                      status: determineEventStatus(
                        next.event_date || event.event_date,
                      ),
                      stats: event.stats,
                    }
                  : event,
              ),
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "events",
            filter: `user_id=eq.${uid}`,
          },
          () => {
            loadHostedEvents();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "events",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            const deletedId = payload?.old?.id;
            if (!deletedId) return;
            setHostedEvents((prev) =>
              prev.filter((event) => event.id !== deletedId),
            );
          },
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
      if (eventsChannel) supabase.removeChannel(eventsChannel);
    };
  }, []);

  const handleChargePress = () => {
    navigation.navigate("Credit");
  };

  const getBalanceColor = (n) => {
    if (n == null) return "#8B95A1";
    if (n < 10) return "#EF4444"; // 빨강
    if (n < 50) return "#F59E0B"; // 주황
    return "#3182F6"; // 파랑
  };

  const loadHostedEvents = async () => {
    try {
      const [ownedResult, sharedResult] = await Promise.all([
        getUserEvents(),
        getSharedEventsForCurrentUser(),
      ]);

      if (!ownedResult.success && !sharedResult.success) {
        setHostedEvents([]);
        return;
      }

      const ownedOnly = (ownedResult.data || [])
        .filter(
          (e) =>
            !e.is_personal_schedule &&
            !e.isPersonalSchedule &&
            e.source !== "personal",
        )
        .map((e) => ({ ...e, shared_access: false, shared_role: "owner" }));
      const sharedOnly = (sharedResult.data || []).filter(
        (e) =>
          !e.is_personal_schedule &&
          !e.isPersonalSchedule &&
          e.source !== "personal",
      );

      const eventMap = new Map();
      [...ownedOnly, ...sharedOnly].forEach((event) => {
        if (!event?.id) return;
        const current = eventMap.get(event.id);
        if (!current || current.shared_access) eventMap.set(event.id, event);
      });
      const only = Array.from(eventMap.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );

      const withStats = await Promise.all(
        only.map(async (event) => {
          try {
            const s = await getEventStatistics(event.id);
            return {
              ...event,
              status: determineEventStatus(event.event_date),
              stats: {
                totalContributions: s.data?.totalContributions || 0,
                totalAmount: s.data?.totalAmount || 0,
                averageAmount: s.data?.averageAmount || 0,
                verifiedCount: s.data?.verifiedCount || 0,
              },
            };
          } catch {
            return {
              ...event,
              status: determineEventStatus(event.event_date),
              stats: {
                totalContributions: 0,
                totalAmount: 0,
                averageAmount: 0,
                verifiedCount: 0,
              },
            };
          }
        }),
      );
      setHostedEvents(withStats);
    } catch {
      setHostedEvents([]);
    }
  };

  const loadParticipatedEvents = async () => {
    try {
      // 1. 현재 유저 전화번호 확인
      const info = await getCurrentUserInfo();
      const myPhone = info?.user?.phone || userInfo?.phone;
      const myNormalized = normalizePhone(myPhone);

      const merged = [];

      // 2. guest_book에서 내 번호로 등록된 부조 내역 조회 (= 참여한 경조사)
      if (myNormalized && isValidKoreanMobile(myNormalized)) {
        const last8 = myNormalized.slice(-8);
        const { data: gbRows, error: gbError } = await supabase
          .from("guest_book")
          .select(
            `
            id, event_id, guest_name, guest_phone, amount, side,
            relation_category, relation_detail, alimtalk_sent, created_at,
            events:event_id (id, event_name, event_type, event_date, main_person_name, user_id)
          `,
          )
          .ilike("guest_phone", `%${last8}%`)
          .order("created_at", { ascending: false });

        if (!gbError && gbRows?.length) {
          // 뒷자리만 같은 가짜 매칭 걸러내기 — 정규화 비교로 확정
          const matched = gbRows.filter((r) =>
            samePhone(r.guest_phone, myNormalized),
          );
          matched.forEach((row) => {
            if (!row.events) return; // 이벤트 정보 없으면 스킵
            merged.push({
              id: `gb_${row.id}`,
              event_id: row.event_id,
              event_name: row.events.event_name || "행사",
              event_type: row.events.event_type,
              event_date: row.events.event_date,
              main_person_name: row.events.main_person_name,
              contributionId: row.id,
              contributionAmount: row.amount,
              contributionGuestName: row.guest_name,
              contributionSide: row.side,
              contributionCategory: row.relation_category,
              contributionDetail: row.relation_detail,
              contributionDate: row.created_at,
              alimtalkSent: row.alimtalk_sent,
              source: "guestbook",
            });
          });
        }
      }

      // 3. (기존 유지) personal_schedules — 직접 추가한 개인 일정
      if (userInfo?.userId) {
        const { data: psRows } = await supabase
          .from("personal_schedules")
          .select("*")
          .eq("user_id", userInfo.userId)
          .order("created_at", { ascending: false });
        if (psRows?.length) {
          psRows.forEach((s) => {
            merged.push({
              id: `ps_${s.id}`,
              event_name: s.title,
              event_type: s.event_type,
              event_date: s.event_date,
              main_person_name: "개인 일정",
              contributionDate: s.created_at,
              memo: s.notes,
              source: "personal",
            });
          });
        }
      }

      // 4. 날짜 내림차순 정렬 (참여한 시점 기준)
      merged.sort(
        (a, b) =>
          new Date(b.contributionDate || b.event_date || 0) -
          new Date(a.contributionDate || a.event_date || 0),
      );

      setParticipatedEvents(merged);
    } catch (e) {
      console.warn("참여한 경조사 로딩 실패:", e);
      setParticipatedEvents([]);
    }
  };

  // 영수증 모달 열기
  const openReceipt = (event) => {
    if (!event) return;
    setReceiptModal({
      visible: true,
      receipt: {
        contributionId: event.contributionId,
        eventName: event.event_name,
        eventDate: event.event_date,
        eventType: event.event_type,
        mainPersonName: event.main_person_name,
        guestName: event.contributionGuestName,
        amount: event.contributionAmount,
        category: event.contributionCategory,
        detail: event.contributionDetail,
        contributionDate: event.contributionDate,
        alimtalkSent: event.alimtalkSent,
      },
    });
  };
  const closeReceipt = () => setReceiptModal((r) => ({ ...r, visible: false }));

  const formatKrw = (n) => {
    if (!n) return "0원";
    return `${new Intl.NumberFormat("ko-KR").format(Math.round(n))}원`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setDataLoaded(false);
    await loadAllData();
    setRefreshing(false);
  };

  const handleDeleteEvent = (eventId, eventName) => {
    setDeleteAlert({ visible: true, eventId, eventName });
  };

  const confirmDelete = async () => {
    const { eventId } = deleteAlert;
    setDeleteAlert({ visible: false, eventId: null, eventName: "" });
    try {
      const result = await deleteEvent(eventId);
      if (result.success) loadHostedEvents();
    } catch {}
  };

  const openCoverSheet = (event) => {
    if (event?.shared_access) {
      return;
    }
    preloadEventCoverOptionImages();
    setCoverPreloadMounted(true);
    setSelectedCoverEvent(event);
    setCoverSheetVisible(true);
  };

  const closeCoverSheet = () => {
    if (coverPurchaseLoading) return;
    setCoverPurchaseConfirm({ visible: false, cover: null });
    setCoverSheetVisible(false);
    setSelectedCoverEvent(null);
  };

  const closeCoverPurchaseConfirm = () => {
    if (coverPurchaseLoading) return;
    setCoverPurchaseConfirm({ visible: false, cover: null });
  };

  const applyCoverToEvent = async (event, coverKey) => {
    if (!event?.id) return;
    if (event.shared_access) {
      setCoverSheetVisible(false);
      setCoverPurchaseConfirm({ visible: false, cover: null });
      setTimeout(() => {
        showAlert({
          title: "덮개 설정 권한이 없어요",
          message: "카드 덮개는 행사를 만든 사람만 변경할 수 있어요.",
        });
      }, 180);
      return;
    }

    const currentInfo = parseAdditionalInfo(event.additional_info);
    const nextInfo = { ...currentInfo };
    if (coverKey) {
      nextInfo.card_cover_key = coverKey;
    } else {
      delete nextInfo.card_cover_key;
    }

    const result = await updateEvent(event.id, { additional_info: nextInfo });
    if (!result?.success) {
      setCoverSheetVisible(false);
      setCoverPurchaseConfirm({ visible: false, cover: null });
      setTimeout(() => {
        showAlert({
          title: "덮개 적용 실패",
          message: result?.error || "잠시 후 다시 시도해주세요.",
        });
      }, 180);
      return;
    }

    const updateLocalEvent = (item) =>
      item.id === event.id
        ? {
            ...item,
            additional_info: nextInfo,
            updated_at: result.data?.updated_at || item.updated_at,
          }
        : item;
    setHostedEvents((prev) => prev.map(updateLocalEvent));
    setSelectedCoverEvent((prev) =>
      prev?.id === event.id ? updateLocalEvent(prev) : prev,
    );
    setCoverPurchaseConfirm({ visible: false, cover: null });
    setCoverSheetVisible(false);
  };

  const purchaseAndApplyCover = async (cover) => {
    if (!selectedCoverEvent || !cover || coverPurchaseLoading) return;
    const targetEvent = selectedCoverEvent;
    setCoverPurchaseLoading(true);

    try {
      const purchase = await purchaseEventCardCover({
        userId: currentUserId,
        coverKey: cover.key,
        price: cover.price,
      });

      if (!purchase?.success) {
        const alertConfig = {
          title:
            purchase?.error === "insufficient_balance"
              ? "크레딧이 부족해요"
              : "구매 실패",
          message:
            purchase?.error === "insufficient_balance"
              ? `${cover.label} 덮개는 ${cover.price}크레딧이 필요해요.`
              : purchase?.message || "잠시 후 다시 시도해주세요.",
        };
        setAlimtalkBalance(purchase?.balance ?? alimtalkBalance);
        setCoverPurchaseConfirm({ visible: false, cover: null });
        setCoverSheetVisible(false);
        setSelectedCoverEvent(null);
        setTimeout(() => showAlert(alertConfig), 180);
        return;
      }

      setOwnedCoverKeys((prev) => Array.from(new Set([...prev, cover.key])));
      if (typeof purchase.balance === "number")
        setAlimtalkBalance(purchase.balance);
      await applyCoverToEvent(targetEvent, cover.key);
      loadCoverPurchaseState(currentUserId);
    } catch (error) {
      setCoverPurchaseConfirm({ visible: false, cover: null });
      setCoverSheetVisible(false);
      setSelectedCoverEvent(null);
      setTimeout(() => {
        showAlert({
          title: "구매 실패",
          message: error?.message || "잠시 후 다시 시도해주세요.",
        });
      }, 180);
    } finally {
      setCoverPurchaseLoading(false);
    }
  };

  const handleCoverSelect = (cover) => {
    if (!selectedCoverEvent) return;
    const currentCoverKey = getEventCoverKey(selectedCoverEvent);
    if (currentCoverKey === cover.key) {
      setCoverSheetVisible(false);
      return;
    }

    const isOwned = cover.price <= 0 || ownedCoverKeys.includes(cover.key);

    if (isOwned) {
      applyCoverToEvent(selectedCoverEvent, cover.key);
      return;
    }

    setCoverPurchaseConfirm({ visible: true, cover });
  };

  const handleRemoveCover = () => {
    if (!selectedCoverEvent) return;
    applyCoverToEvent(selectedCoverEvent, null);
  };

  const getHostedEventSortTime = (event) => {
    const dateValue =
      hostedSortBy === "createdAt"
        ? event.created_at || event.createdAt || event.created_at_local
        : event.event_date;
    const time = new Date(dateValue || "").getTime();
    return Number.isFinite(time) ? time : null;
  };

  const isHostedEventFinalized = (event) =>
    event.is_finalized === true || finalizedEventIds.has(event.id);

  const filteredHostedEvents = hostedEvents
    .filter((e) => {
      const isFinalized = isHostedEventFinalized(e);
      if (hostedFilter === "active")
        return e.status === "active" && !isFinalized;
      if (hostedFilter === "completed") {
        return e.status === "completed" && !isFinalized;
      }
      if (hostedFilter === "finalized") return isFinalized;
      return true;
    })
    .sort((a, b) => {
      if (hostedSortBy === "totalAmount") {
        const aAmount = Number(a.stats?.totalAmount || 0);
        const bAmount = Number(b.stats?.totalAmount || 0);
        if (aAmount !== bAmount) {
          return hostedSortOrder === "asc"
            ? aAmount - bAmount
            : bAmount - aAmount;
        }
        return (
          new Date(b.event_date || b.created_at || 0) -
          new Date(a.event_date || a.created_at || 0)
        );
      }

      const aTime = getHostedEventSortTime(a);
      const bTime = getHostedEventSortTime(b);

      if (aTime === null && bTime === null) {
        return String(a.event_name || "").localeCompare(
          String(b.event_name || ""),
          "ko",
        );
      }
      if (aTime === null) return 1;
      if (bTime === null) return -1;

      return hostedSortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });

  const handleHostedSortByPress = (sortBy) => {
    if (hostedSortBy === sortBy) {
      setHostedSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
      return;
    }
    setHostedSortBy(sortBy);
    setHostedSortOrder("desc");
  };

  const hostedSortOptions = [
    { key: "eventDate", label: "행사일", icon: "calendar-outline" },
    { key: "createdAt", label: "생성일", icon: "time-outline" },
    { key: "totalAmount", label: "부조금", icon: "cash-outline" },
  ];

  const playCompletedStampAnimation = (eventId) => {
    setStampAnimationEventId(eventId);
    completedStampScale.setValue(1.85);
    completedStampOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(completedStampScale, {
        toValue: 1,
        tension: 95,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(completedStampOpacity, {
        toValue: 0.9,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setStampAnimationEventId(null);
        completedStampScale.setValue(1);
        completedStampOpacity.setValue(1);
      }, 450);
    });
  };

  const completeHostedEventFinalization = async (event) => {
    if (!event?.id || finalizingEventId) return;

    setFinalizingEventId(event.id);
    const result = await finalizeEvent(event.id);
    setFinalizingEventId(null);

    if (!result.success) {
      Alert.alert(
        "확정 실패",
        result.error || "확정 처리 중 문제가 발생했습니다.",
      );
      return;
    }

    setHostedEvents((prev) =>
      prev.map((item) =>
        item.id === event.id
          ? { ...item, status: "completed", is_finalized: true }
          : item,
      ),
    );
    setFinalizedEventIds((prev) => {
      const next = new Set(prev);
      next.add(event.id);
      return next;
    });
    DeviceEventEmitter.emit("hosted-event-finalized", {
      eventId: event.id,
    });
    playCompletedStampAnimation(event.id);
  };

  const handleFinalizeHostedEvent = (event, unverifiedCount = 0) => {
    const eventName = event?.event_name || "이 행사";
    const message =
      unverifiedCount > 0
        ? `${eventName}에 미확정 내역이 ${unverifiedCount}건 있습니다.\n그래도 확정 처리하시겠어요?\n\n확정 처리되면 완료 도장이 표시되고 감사 인사 보내기 기능을 사용할 수 있습니다.\n완료 도장이 찍힌 후에는 되돌릴 수 없습니다.`
        : `${eventName}을 확정 처리하시겠어요?\n\n확정 처리되면 완료 도장이 표시되고 감사 인사 보내기 기능을 사용할 수 있습니다.\n완료 도장이 찍힌 후에는 되돌릴 수 없습니다.`;

    Alert.alert("확정 처리", message, [
      { text: "취소", style: "cancel" },
      {
        text: "확정 처리",
        onPress: () => completeHostedEventFinalization(event),
      },
    ]);
  };

  const formatAmount = (amount) => {
    if (!amount || amount === 0) return "0원";
    if (amount >= 100000000) return `${Math.floor(amount / 100000000)}억원`;
    if (amount >= 10000)
      return `${Math.floor(amount / 10000).toLocaleString()}만원`;
    return `${amount.toLocaleString()}원`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "날짜 미정";
    const d = new Date(dateString);
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "wedding":
        return "결혼식";
      case "funeral":
        return "장례식";
      case "birthday":
        return "생일";
      default:
        return "기타";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 경조사</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("hosted")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "hosted" && styles.tabTextActive,
            ]}
          >
            주최한 경조사
          </Text>
          {hostedEvents.length > 0 && (
            <View
              style={[
                styles.tabBadge,
                activeTab === "hosted" && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === "hosted" && styles.tabBadgeTextActive,
                ]}
              >
                {hostedEvents.length}
              </Text>
            </View>
          )}
          {activeTab === "hosted" && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("participated")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "participated" && styles.tabTextActive,
            ]}
          >
            참여한 경조사
          </Text>
          {participatedEvents.length > 0 && (
            <View
              style={[
                styles.tabBadge,
                activeTab === "participated" && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === "participated" && styles.tabBadgeTextActive,
                ]}
              >
                {participatedEvents.length}
              </Text>
            </View>
          )}
          {activeTab === "participated" && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3182F6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "hosted" && !loading && (
          <View ref={creditBannerRef} style={styles.creditBanner}>
            <View
              style={[
                styles.creditIconBox,
                { backgroundColor: getBalanceColor(alimtalkBalance) + "1A" },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={18}
                color={getBalanceColor(alimtalkBalance)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.creditLabel}>알림톡 크레딧</Text>
              <Text
                style={[
                  styles.creditValue,
                  { color: getBalanceColor(alimtalkBalance) },
                ]}
              >
                {alimtalkBalance == null ? "-" : `${alimtalkBalance}건 남음`}
              </Text>
              {alimtalkBalance != null && alimtalkBalance < 10 && (
                <Text style={styles.creditWarning}>
                  {alimtalkBalance === 0
                    ? "크레딧이 모두 소진되었어요"
                    : "곧 소진됩니다"}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.chargeBtn}
              onPress={handleChargePress}
              activeOpacity={0.8}
            >
              <Text style={styles.chargeBtnText}>충전</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <LottieLoading size={76} />
          </View>
        ) : activeTab === "hosted" ? (
          <>
            {/* 필터 칩 */}
            <View style={styles.filterChipRow}>
              {[
                {
                  key: "active",
                  label: "진행중",
                  count: hostedEvents.filter(
                    (e) => e.status === "active" && !isHostedEventFinalized(e),
                  ).length,
                },
                {
                  key: "completed",
                  label: "완료",
                  count: hostedEvents.filter(
                    (e) =>
                      e.status === "completed" && !isHostedEventFinalized(e),
                  ).length,
                },
                {
                  key: "finalized",
                  label: "확정",
                  count: hostedEvents.filter((e) => isHostedEventFinalized(e))
                    .length,
                },
              ].map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    hostedFilter === f.key && styles.filterChipActive,
                  ]}
                  onPress={() => setHostedFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      hostedFilter === f.key && styles.filterChipTextActive,
                    ]}
                  >
                    {f.label} {f.count}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.filterSortToggle,
                  hostedSortVisible && styles.filterSortToggleActive,
                ]}
                onPress={() => setHostedSortVisible((prev) => !prev)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="swap-vertical"
                  size={14}
                  color={hostedSortVisible ? "#FFFFFF" : "#6B7684"}
                />
                <Text
                  style={[
                    styles.filterSortToggleText,
                    hostedSortVisible && styles.filterSortToggleTextActive,
                  ]}
                >
                  정렬
                </Text>
              </TouchableOpacity>
            </View>

            {hostedSortVisible && (
              <View style={styles.hostedSortBar}>
                <View style={styles.hostedSortGroup}>
                  {hostedSortOptions.map((option) => {
                    const isActive = hostedSortBy === option.key;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.hostedSortChip,
                          isActive && styles.hostedSortChipActive,
                        ]}
                        onPress={() => handleHostedSortByPress(option.key)}
                        activeOpacity={0.78}
                      >
                        <Ionicons
                          name={option.icon}
                          size={14}
                          color={isActive ? "#191F28" : "#8B95A1"}
                        />
                        <Text
                          style={[
                            styles.hostedSortChipText,
                            isActive && styles.hostedSortChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isActive && (
                          <Ionicons
                            name={
                              hostedSortOrder === "desc"
                                ? "arrow-down"
                                : "arrow-up"
                            }
                            size={13}
                            color="#3182F6"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 이벤트 목록 */}
            {filteredHostedEvents.length > 0 ? (
              <View style={styles.listSection}>
                {filteredHostedEvents.map((event, index) => {
                  const unverified =
                    (event.stats?.totalContributions || 0) -
                    (event.stats?.verifiedCount || 0);
                  const isFinalized = isHostedEventFinalized(event);
                  const showFinalizeButton =
                    hostedFilter === "completed" &&
                    !isFinalized &&
                    !event.shared_access;
                  const isStampAnimating = stampAnimationEventId === event.id;
                  const statusLabel = isFinalized
                    ? "확정"
                    : event.status === "active"
                      ? "진행중"
                      : "완료";
                  const statusDotStyle = isFinalized
                    ? styles.statusDotFinalized
                    : event.status === "active"
                      ? styles.statusDotActive
                      : styles.statusDotDone;
                  const statusLabelStyle = isFinalized
                    ? styles.statusLabelFinalized
                    : event.status === "active"
                      ? styles.statusLabelActive
                      : styles.statusLabelDone;
                  const navParams = {
                    eventId: event.id,
                    initialEvent: event,
                    initialStats: {
                      totalAmount: event.stats?.totalAmount || 0,
                      totalCount: event.stats?.totalContributions || 0,
                      averageAmount: event.stats?.averageAmount || 0,
                      confirmedCount: event.stats?.verifiedCount || 0,
                    },
                  };
                  const coverKey = getEventCoverKey(event);
                  const activeCover = getCoverByKey(coverKey);
                  const CardContainer = activeCover ? View : TouchableOpacity;
                  return (
                    <View
                      key={event.id}
                      style={styles.eventCardWrap}
                      ref={index === 0 ? firstEventCardRef : null}
                    >
                      <CardContainer
                        style={[
                          styles.eventItem,
                          activeCover &&
                            !isFinalized &&
                            styles.eventItemCovered,
                          !activeCover &&
                            !isFinalized &&
                            unverified > 0 &&
                            styles.eventItemWithBanner,
                        ]}
                        {...(!activeCover
                          ? {
                              onPress: () =>
                                navigation.navigate("EventDetail", navParams),
                              activeOpacity: 0.6,
                            }
                          : {})}
                      >
                        {/* 아이콘 + 이름 + 삭제+상태 */}
                        <View style={styles.eventTopRow}>
                          <View
                            style={[
                              styles.eventTypeIcon,
                              event.event_type === "funeral" &&
                                styles.eventTypeIconFuneral,
                            ]}
                          >
                            {event.event_type === "wedding" ? (
                              <Image
                                source={EVENT_TYPE_IMAGES.wedding}
                                style={styles.eventTypeImage}
                                resizeMode="contain"
                                fadeDuration={0}
                              />
                            ) : event.event_type === "funeral" ? (
                              <Image
                                source={EVENT_TYPE_IMAGES.funeral}
                                style={styles.eventTypeImage}
                                resizeMode="contain"
                                fadeDuration={0}
                              />
                            ) : (
                              <Ionicons
                                name="calendar"
                                size={18}
                                color="#FFFFFF"
                              />
                            )}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.eventName} numberOfLines={1}>
                              {event.event_name}
                            </Text>
                            <Text style={styles.eventMeta}>
                              {formatDate(event.event_date)}
                            </Text>
                          </View>

                          <View style={styles.eventRightCol}>
                            {!event.shared_access ? (
                              <TouchableOpacity
                                style={styles.cardDeleteBtn}
                                onPress={() =>
                                  handleDeleteEvent(event.id, event.event_name)
                                }
                                hitSlop={{
                                  top: 8,
                                  bottom: 8,
                                  left: 8,
                                  right: 8,
                                }}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={15}
                                  color="#C5CCD5"
                                />
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.sharedAccessBadge}>
                                <Ionicons
                                  name="people"
                                  size={11}
                                  color="#3182F6"
                                />
                                <Text style={styles.sharedAccessBadgeText}>
                                  공유받음
                                </Text>
                              </View>
                            )}
                            <View style={styles.statusRow}>
                              <View
                                style={[styles.statusDot, statusDotStyle]}
                              />
                              <Text
                                style={[styles.statusLabel, statusLabelStyle]}
                              >
                                {statusLabel}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* 통계 행 */}
                        <View style={styles.eventStatsRow}>
                          <View style={styles.eventStatItem}>
                            <Text style={styles.eventStatValue}>
                              {event.stats?.totalContributions || 0}명
                            </Text>
                            <Text style={styles.eventStatLabel}>참여</Text>
                          </View>
                          <View style={styles.eventStatSep} />
                          <View style={styles.eventStatItem}>
                            <Text style={styles.eventStatValue}>
                              {formatAmount(event.stats?.totalAmount)}
                            </Text>
                            <Text style={styles.eventStatLabel}>총 부조금</Text>
                          </View>
                          <View style={styles.eventStatSep} />
                          <View style={styles.eventStatItem}>
                            <Text style={styles.eventStatValue}>
                              {formatAmount(
                                Math.round(event.stats?.averageAmount || 0),
                              )}
                            </Text>
                            <Text style={styles.eventStatLabel}>평균</Text>
                          </View>
                        </View>

                        {/* 하단 행 */}
                        <View style={styles.eventBottomRow}>
                          <View style={styles.eventBottomLeft}>
                            <Text style={styles.eventHostText}>
                              주최 · {event.main_person_name || "미입력"}
                            </Text>
                            {showFinalizeButton && unverified > 0 && (
                              <Text style={styles.finalizeInlineWarning}>
                                미확정 {unverified}건
                              </Text>
                            )}
                          </View>
                          <View style={styles.eventBottomRight}>
                            {showFinalizeButton ? (
                              <TouchableOpacity
                                style={[
                                  styles.finalizeInlineButton,
                                  finalizingEventId === event.id &&
                                    styles.finalizeButtonDisabled,
                                ]}
                                onPress={(pressEvent) => {
                                  pressEvent?.stopPropagation?.();
                                  handleFinalizeHostedEvent(event, unverified);
                                }}
                                activeOpacity={0.84}
                                disabled={finalizingEventId === event.id}
                              >
                                <Ionicons
                                  name="checkmark-done-outline"
                                  size={14}
                                  color="#FFFFFF"
                                />
                                <Text style={styles.finalizeInlineButtonText}>
                                  {finalizingEventId === event.id
                                    ? "처리 중"
                                    : "확정 처리"}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <>
                                <Text style={styles.detailText}>상세보기</Text>
                                <Ionicons
                                  name="chevron-forward"
                                  size={15}
                                  color="#C5CCD5"
                                />
                              </>
                            )}
                          </View>
                        </View>

                        {!activeCover && !event.shared_access && (
                          <TouchableOpacity
                            style={styles.eventCoverWideBtn}
                            onPress={(pressEvent) => {
                              pressEvent?.stopPropagation?.();
                              openCoverSheet(event);
                            }}
                            activeOpacity={0.84}
                          >
                            <View style={styles.eventCoverWideIcon}>
                              <Ionicons
                                name="sparkles"
                                size={15}
                                color="#3182F6"
                              />
                            </View>
                            <Text style={styles.eventCoverWideText}>
                              덮개 꾸미기
                            </Text>
                            <Text style={styles.eventCoverWideSub}>
                              카드 정보를 예쁘게 가리기
                            </Text>
                          </TouchableOpacity>
                        )}

                        {isFinalized && (
                          <TouchableOpacity
                            style={styles.thankYouBanner}
                            onPress={(pressEvent) => {
                              pressEvent?.stopPropagation?.();
                              navigation.navigate("ThankYouMessages", {
                                eventId: event.id,
                              });
                            }}
                            activeOpacity={0.84}
                          >
                            <View style={styles.thankYouBannerIconBox}>
                              <Ionicons
                                name="chatbubble-ellipses-outline"
                                size={17}
                                color="#2563EB"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.thankYouBannerSub}>
                                확정된 하객에게
                              </Text>
                              <Text style={styles.thankYouBannerMain}>
                                감사 인사 보내기
                              </Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color="#93B7F2"
                            />
                          </TouchableOpacity>
                        )}

                        {/* 미확정 배너 — 카드 내부 하단에 붙임 */}
                        {!isFinalized && unverified > 0 && (
                          <TouchableOpacity
                            style={styles.unverifiedBanner}
                            onPress={() =>
                              navigation.navigate("EventDetail", navParams)
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.unverifiedIconBox}>
                              <Ionicons
                                name="flash"
                                size={16}
                                color="#8B95A1"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.unverifiedBannerSub}>
                                아직 정리되지 않은 부조금
                              </Text>
                              <Text style={styles.unverifiedBannerMain}>
                                미확정 내역이 {unverified}건 있어요
                              </Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color="#C5CCD5"
                            />
                          </TouchableOpacity>
                        )}
                        {activeCover && (
                          <TouchableOpacity
                            style={styles.eventCoverOverlay}
                            onPress={(pressEvent) => {
                              pressEvent?.stopPropagation?.();
                              navigation.navigate("EventDetail", navParams);
                            }}
                            activeOpacity={0.96}
                          >
                            <View style={styles.eventCoverWhiteShield} />
                            <Image
                              source={activeCover.image}
                              style={styles.eventCoverImage}
                              resizeMode="stretch"
                            />
                            <View style={styles.eventCoverBadge}>
                              <Ionicons
                                name="lock-closed"
                                size={14}
                                color="#FFFFFF"
                              />
                              <Text style={styles.eventCoverBadgeText}>
                                덮개 적용중
                              </Text>
                            </View>
                            <View style={styles.eventCoverHint}>
                              <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#8B95A1"
                              />
                            </View>
                          </TouchableOpacity>
                        )}
                        {activeCover && !event.shared_access && (
                          <TouchableOpacity
                            style={styles.eventCoverEditBtn}
                            onPress={(pressEvent) => {
                              pressEvent?.stopPropagation?.();
                              openCoverSheet(event);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="color-palette-outline"
                              size={13}
                              color="#191F28"
                            />
                            <Text style={styles.eventCoverEditText}>
                              덮개 변경
                            </Text>
                          </TouchableOpacity>
                        )}
                        {activeCover && !event.shared_access && (
                          <TouchableOpacity
                            style={styles.eventCoverRemoveBtn}
                            onPress={(pressEvent) => {
                              pressEvent?.stopPropagation?.();
                              applyCoverToEvent(event, null);
                            }}
                            activeOpacity={0.82}
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={13}
                              color="#FFFFFF"
                            />
                            <Text style={styles.eventCoverRemoveText}>
                              덮개 해제
                            </Text>
                          </TouchableOpacity>
                        )}
                        {isFinalized && (
                          <Animated.Image
                            source={COMPLETED_STAMP_IMAGE}
                            style={[
                              styles.finalizedStamp,
                              {
                                opacity: isStampAnimating
                                  ? completedStampOpacity
                                  : 0.9,
                                transform: [
                                  { rotate: "-8deg" },
                                  {
                                    scale: isStampAnimating
                                      ? completedStampScale
                                      : 1,
                                  },
                                ],
                              },
                            ]}
                            resizeMode="contain"
                            pointerEvents="none"
                          />
                        )}
                      </CardContainer>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="calendar-outline" size={36} color="#C5CCD5" />
                </View>
                <Text style={styles.emptyTitle}>
                  {hostedFilter === "active"
                    ? "진행중인 경조사가 없어요"
                    : hostedFilter === "completed"
                      ? "완료된 경조사가 없어요"
                      : "확정 처리된 경조사가 없어요"}
                </Text>
                <Text style={styles.emptySub}>
                  홈 화면에서 경조사를 만들어보세요
                </Text>
              </View>
            )}
          </>
        ) : /* 참여한 경조사 탭 */
        participatedEvents.length > 0 ? (
          <View style={styles.listSection}>
            {participatedEvents.map((event, index) => {
              const isGuestBook = event.source === "guestbook";
              return (
                <View key={event.id} style={styles.eventCardWrap}>
                  <View
                    style={[
                      styles.eventItem,
                      index < participatedEvents.length - 1 &&
                        styles.eventItemBorder,
                    ]}
                  >
                    {/* 상단: 아이콘 + 행사명/날짜 + 참여 뱃지 */}
                    <View style={styles.eventTopRow}>
                      <View
                        style={[
                          styles.eventTypeIcon,
                          event.event_type === "funeral" &&
                            styles.eventTypeIconFuneral,
                        ]}
                      >
                        {event.event_type === "wedding" ? (
                          <Image
                            source={EVENT_TYPE_IMAGES.wedding}
                            style={styles.eventTypeImage}
                            resizeMode="contain"
                            fadeDuration={0}
                          />
                        ) : event.event_type === "funeral" ? (
                          <Image
                            source={EVENT_TYPE_IMAGES.funeral}
                            style={styles.eventTypeImage}
                            resizeMode="contain"
                            fadeDuration={0}
                          />
                        ) : (
                          <Ionicons name="calendar" size={18} color="#FFFFFF" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.eventName} numberOfLines={1}>
                          {event.event_name}
                        </Text>
                        <Text style={styles.eventMeta}>
                          {formatDate(event.event_date)}
                        </Text>
                      </View>
                      <View style={[styles.participatedBadge]}>
                        <Text style={styles.participatedBadgeText}>
                          {isGuestBook ? "참여" : "개인"}
                        </Text>
                      </View>
                    </View>

                    {/* 부조 내역 박스 (guest_book에서 온 경우만) */}
                    {isGuestBook && event.contributionAmount != null && (
                      <View style={styles.participatedContribBox}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.participatedContribLabel}>
                            내 부조
                          </Text>
                          <Text style={styles.participatedContribSub}>
                            {event.contributionCategory || "-"}
                            {event.contributionDetail
                              ? ` · ${event.contributionDetail}`
                              : ""}
                          </Text>
                        </View>
                        <Text style={styles.participatedContribAmount}>
                          {formatKrw(event.contributionAmount)}
                        </Text>
                      </View>
                    )}

                    {/* 개인 일정 메모 */}
                    {!isGuestBook && event.memo ? (
                      <Text style={styles.memoText} numberOfLines={1}>
                        📝 {event.memo}
                      </Text>
                    ) : null}

                    {/* 하단 */}
                    <View style={styles.eventBottomRow}>
                      <Text style={styles.eventHostText}>
                        주최 · {event.main_person_name || "미입력"}
                      </Text>
                      {isGuestBook ? (
                        <TouchableOpacity
                          style={styles.receiptBtn}
                          onPress={() => openReceipt(event)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="receipt-outline"
                            size={13}
                            color="#3182F6"
                          />
                          <Text style={styles.receiptBtnText}>영수증 보기</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flex: 0 }} />
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="gift-outline" size={36} color="#C5CCD5" />
            </View>
            <Text style={styles.emptyTitle}>참여한 경조사가 없어요</Text>
            <Text style={styles.emptySub}>
              다른 분의 경조사에 참여하면 여기에 표시돼요
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* iOS 스타일 삭제 확인 모달 */}
      <Modal
        visible={deleteAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setDeleteAlert({ visible: false, eventId: null, eventName: "" })
        }
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>경조사 삭제</Text>
            <Text style={styles.alertMessage}>
              {`"${deleteAlert.eventName}"을(를) 삭제하시겠어요?\n이 작업은 되돌릴 수 없습니다.`}
            </Text>
            <View style={styles.alertDividerH} />
            <View style={styles.alertBtnRow}>
              <TouchableOpacity
                style={styles.alertBtnLeft}
                onPress={() =>
                  setDeleteAlert({
                    visible: false,
                    eventId: null,
                    eventName: "",
                  })
                }
                activeOpacity={0.6}
              >
                <Text style={styles.alertCancelText}>취소</Text>
              </TouchableOpacity>
              <View style={styles.alertDividerV} />
              <TouchableOpacity
                style={styles.alertBtnRight}
                onPress={confirmDelete}
                activeOpacity={0.6}
              >
                <Text style={styles.alertDeleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 주최 카드 덮개 설정 */}
      <Modal
        visible={coverSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCoverSheet}
      >
        <View style={styles.coverSheetOverlay}>
          <TouchableOpacity
            style={styles.coverSheetBackdrop}
            activeOpacity={1}
            onPress={closeCoverSheet}
          />
          <View style={styles.coverSheet}>
            <View style={styles.coverSheetHandle} />
            <View style={styles.coverSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.coverSheetTitle}>카드 덮개 설정</Text>
                <Text style={styles.coverSheetSub} numberOfLines={1}>
                  {selectedCoverEvent?.event_name || "행사"} 정보를 예쁘게
                  가려둘 수 있어요
                </Text>
              </View>
              <View style={styles.coverBalancePill}>
                <Ionicons name="flash" size={13} color="#3182F6" />
                <Text style={styles.coverBalanceText}>
                  {alimtalkBalance == null ? "-" : alimtalkBalance}크레딧
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.coverNoneRow,
                !getEventCoverKey(selectedCoverEvent) &&
                  styles.coverNoneRowActive,
              ]}
              onPress={handleRemoveCover}
              activeOpacity={0.75}
            >
              <View style={styles.coverNoneIcon}>
                <Ionicons name="eye-outline" size={18} color="#3182F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.coverNoneTitle}>덮개 없음</Text>
                <Text style={styles.coverNoneSub}>
                  카드 내용을 그대로 보여줘요
                </Text>
              </View>
              {!getEventCoverKey(selectedCoverEvent) && (
                <Ionicons name="checkmark-circle" size={20} color="#3182F6" />
              )}
            </TouchableOpacity>

            <ScrollView
              style={styles.coverOptionScroll}
              contentContainerStyle={styles.coverOptionList}
              showsVerticalScrollIndicator={false}
            >
              {EVENT_CARD_COVERS.map((cover) => {
                const isActive =
                  getEventCoverKey(selectedCoverEvent) === cover.key;
                const isOwned =
                  cover.price <= 0 || ownedCoverKeys.includes(cover.key);
                return (
                  <TouchableOpacity
                    key={cover.key}
                    style={[
                      styles.coverOptionCard,
                      isActive && styles.coverOptionCardActive,
                    ]}
                    onPress={() => handleCoverSelect(cover)}
                    activeOpacity={0.82}
                    disabled={coverPurchaseLoading}
                  >
                    <Image
                      source={cover.thumb || cover.image}
                      style={styles.coverOptionImage}
                      resizeMode="cover"
                      fadeDuration={0}
                    />
                    <View style={styles.coverOptionInfo}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.coverOptionTitle}>
                          {cover.label}
                        </Text>
                        <Text style={styles.coverOptionSub}>
                          {cover.description}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.coverPricePill,
                          isOwned && styles.coverPricePillOwned,
                          isActive && styles.coverPricePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.coverPriceText,
                            isOwned && styles.coverPriceTextOwned,
                            isActive && styles.coverPriceTextActive,
                          ]}
                        >
                          {isActive
                            ? "적용중"
                            : isOwned
                              ? "보유"
                              : `${cover.price}C`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {coverPurchaseConfirm.visible && (
            <View style={styles.coverPurchaseConfirmLayer}>
              <TouchableOpacity
                style={styles.coverPurchaseConfirmDim}
                activeOpacity={1}
                onPress={closeCoverPurchaseConfirm}
                disabled={coverPurchaseLoading}
              />
              <View style={styles.coverPurchaseConfirmBox}>
                <View style={styles.coverPurchaseConfirmIcon}>
                  <Ionicons name="sparkles" size={22} color="#3182F6" />
                </View>
                <Text style={styles.coverPurchaseConfirmTitle}>덮개 구매</Text>
                <Text style={styles.coverPurchaseConfirmMessage}>
                  {`${coverPurchaseConfirm.cover?.label || "선택한"} 덮개를 구매하고 바로 적용할까요?`}
                </Text>
                <View style={styles.coverPurchaseConfirmMeta}>
                  <View>
                    <Text style={styles.coverPurchaseConfirmMetaLabel}>
                      필요 크레딧
                    </Text>
                    <Text style={styles.coverPurchaseConfirmMetaValue}>
                      {coverPurchaseConfirm.cover?.price || 0}크레딧
                    </Text>
                  </View>
                  <View style={styles.coverPurchaseConfirmMetaDivider} />
                  <View>
                    <Text style={styles.coverPurchaseConfirmMetaLabel}>
                      보유 크레딧
                    </Text>
                    <Text style={styles.coverPurchaseConfirmMetaValue}>
                      {alimtalkBalance == null ? "-" : alimtalkBalance}크레딧
                    </Text>
                  </View>
                </View>
                <View style={styles.coverPurchaseConfirmActions}>
                  <TouchableOpacity
                    style={styles.coverPurchaseCancelBtn}
                    onPress={closeCoverPurchaseConfirm}
                    activeOpacity={0.8}
                    disabled={coverPurchaseLoading}
                  >
                    <Text style={styles.coverPurchaseCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.coverPurchaseConfirmBtn,
                      coverPurchaseLoading &&
                        styles.coverPurchaseConfirmBtnDisabled,
                    ]}
                    onPress={() =>
                      purchaseAndApplyCover(coverPurchaseConfirm.cover)
                    }
                    activeOpacity={0.86}
                    disabled={coverPurchaseLoading}
                  >
                    {coverPurchaseLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.coverPurchaseConfirmText}>구매</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {coverPreloadMounted && (
        <View pointerEvents="none" style={styles.coverPreloadLayer}>
          {EVENT_CARD_COVERS.map((cover) => (
            <Image
              key={`cover-preload-${cover.key}`}
              source={cover.thumb || cover.image}
              style={styles.coverPreloadImage}
              fadeDuration={0}
            />
          ))}
        </View>
      )}

      {eventIconPreloadMounted && (
        <View pointerEvents="none" style={styles.eventIconPreloadLayer}>
          {EVENT_TYPE_IMAGE_SOURCES.map((source, index) => (
            <Image
              key={`event-icon-preload-${index}`}
              source={source}
              style={styles.eventIconPreloadImage}
              fadeDuration={0}
            />
          ))}
        </View>
      )}

      {/* 공통 커스텀 Alert (iOS/안드 통일) */}
      <SimpleModal {...alertProps} />

      {/* 참여한 경조사 영수증 모달 */}
      <ReceiptModal
        visible={receiptModal.visible}
        receipt={receiptModal.receipt}
        onClose={closeReceipt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F6",
  },

  // 헤더
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 50,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#191F28",
    letterSpacing: -0.5,
  },

  // 탭
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
    position: "relative",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8B95A1",
  },
  tabTextActive: {
    color: "#191F28",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E8EB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: "#191F28",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B95A1",
  },
  tabBadgeTextActive: {
    color: "#FFFFFF",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#191F28",
  },

  content: {
    flex: 1,
  },

  // 필터 칩
  filterChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E8EB",
  },
  filterChipActive: {
    backgroundColor: "#191F28",
    borderColor: "#191F28",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B95A1",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  filterSortToggle: {
    marginLeft: "auto",
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E8EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterSortToggleActive: {
    backgroundColor: "#3182F6",
    borderColor: "#3182F6",
  },
  filterSortToggleText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B7684",
  },
  filterSortToggleTextActive: {
    color: "#FFFFFF",
  },
  hostedSortBar: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  hostedSortGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  hostedSortChip: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E8EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hostedSortChipActive: {
    backgroundColor: "#E8F2FF",
    borderColor: "#B7D7FF",
  },
  hostedSortChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B95A1",
  },
  hostedSortChipTextActive: {
    color: "#191F28",
  },

  // 리스트 섹션
  listSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  eventCardWrap: {
    marginBottom: 16,
  },
  eventItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  eventItemCovered: {
    aspectRatio: 900 / 520,
    minHeight: 190,
    maxHeight: 430,
  },
  eventItemWithBanner: {
    paddingBottom: 0,
  },
  eventItemBorder: {},
  finalizedStamp: {
    position: "absolute",
    right: 6,
    top: 38,
    width: 156,
    height: 122,
    zIndex: 45,
    elevation: 45,
  },
  finalizeButtonDisabled: {
    opacity: 0.58,
  },
  eventCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
    backgroundColor: "#FFFFFF",
  },
  eventCoverWhiteShield: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  eventCoverImage: {
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  eventCoverBadge: {
    position: "absolute",
    left: 16,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(25,31,40,0.68)",
    zIndex: 2,
  },
  eventCoverBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  eventCoverEditBtn: {
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 30,
    elevation: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(229,232,235,0.9)",
  },
  eventCoverEditText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#191F28",
  },
  eventCoverRemoveBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
    zIndex: 30,
    elevation: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(25,31,40,0.72)",
  },
  eventCoverRemoveText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  eventCoverHint: {
    position: "absolute",
    right: 16,
    bottom: 18,
    zIndex: 30,
    elevation: 30,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(229,232,235,0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  // 미확정 배너 — 카드 내부 하단
  unverifiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#F2F4F6",
    marginHorizontal: -20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  unverifiedIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E5E8EB",
    alignItems: "center",
    justifyContent: "center",
  },
  unverifiedBannerSub: {
    fontSize: 12,
    color: "#8B95A1",
    marginBottom: 2,
  },
  unverifiedBannerMain: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191F28",
  },
  thankYouBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#CFE3FF",
    borderRadius: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  thankYouBannerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#D8E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  thankYouBannerSub: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B95D8",
    marginBottom: 2,
  },
  thankYouBannerMain: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1D4ED8",
  },

  // 이벤트 상단 행
  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  eventTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFB3C6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  eventTypeIconFuneral: {
    backgroundColor: "#5C6472",
  },
  eventTypeImage: {
    width: 60,
    height: 60,
  },
  eventIconPreloadLayer: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
  eventIconPreloadImage: {
    width: 1,
    height: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191F28",
    marginBottom: 3,
  },
  eventMeta: {
    fontSize: 13,
    color: "#8B95A1",
    fontWeight: "400",
  },
  eventRightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sharedAccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EBF3FF",
  },
  sharedAccessBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#3182F6",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardDeleteBtn: {
    padding: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: "#2ACB6E",
  },
  statusDotDone: {
    backgroundColor: "#C5CCD5",
  },
  statusDotFinalized: {
    backgroundColor: "#EF4444",
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusLabelActive: {
    color: "#2ACB6E",
  },
  statusLabelDone: {
    color: "#C5CCD5",
  },
  statusLabelFinalized: {
    color: "#EF4444",
  },

  // 통계 행
  eventStatsRow: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  eventStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  eventStatSep: {
    width: 1,
    backgroundColor: "#E5E8EB",
    marginVertical: 4,
  },
  eventStatValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#191F28",
  },
  eventStatLabel: {
    fontSize: 11,
    color: "#8B95A1",
    fontWeight: "500",
  },

  // 하단 행
  eventBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  eventBottomLeft: {
    flex: 1,
    minWidth: 0,
  },
  eventHostText: {
    fontSize: 13,
    color: "#8B95A1",
  },
  finalizeInlineWarning: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  eventBottomRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#C5CCD5",
  },
  finalizeInlineButton: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  finalizeInlineButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  eventCoverWideBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F5F9FF",
    borderWidth: 1,
    borderColor: "#D6E8FF",
  },
  eventCoverWideIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  eventCoverWideText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#3182F6",
    marginRight: 8,
  },
  eventCoverWideSub: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#8B95A1",
    textAlign: "right",
  },

  // 참여 뱃지
  participatedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#EBF3FF",
  },
  participatedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3182F6",
  },
  memoText: {
    fontSize: 13,
    color: "#8B95A1",
    marginBottom: 12,
    marginLeft: 56,
  },

  // 빈 상태
  emptyBox: {
    alignItems: "center",
    paddingTop: 72,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#191F28",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: "#8B95A1",
    textAlign: "center",
    lineHeight: 20,
  },

  // iOS 스타일 삭제 확인 모달
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertBox: {
    width: 270,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  alertMessage: {
    fontSize: 13,
    color: "#3C3C43",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertDividerH: {
    height: 0.5,
    backgroundColor: "rgba(60,60,67,0.29)",
  },
  alertBtnRow: {
    flexDirection: "row",
    height: 44,
  },
  alertBtnLeft: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBtnRight: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  alertDividerV: {
    width: 0.5,
    backgroundColor: "rgba(60,60,67,0.29)",
  },
  alertCancelText: {
    fontSize: 17,
    fontWeight: "400",
    color: "#007AFF",
  },
  alertDeleteText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FF3B30",
  },

  // 카드 덮개 설정 바텀시트
  coverSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  coverSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.36)",
  },
  coverSheet: {
    maxHeight: "82%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
  },
  coverSheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E8EB",
    marginBottom: 16,
  },
  coverSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  coverSheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: -0.4,
  },
  coverSheetSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    color: "#8B95A1",
  },
  coverBalancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#EBF3FF",
  },
  coverBalanceText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#3182F6",
  },
  coverNoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E8EB",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 13,
    marginBottom: 12,
  },
  coverNoneRowActive: {
    borderColor: "#3182F6",
    backgroundColor: "#F5F9FF",
  },
  coverNoneIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  coverNoneTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#191F28",
  },
  coverNoneSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: "#8B95A1",
  },
  coverOptionScroll: {
    marginHorizontal: -2,
  },
  coverOptionList: {
    paddingHorizontal: 2,
    paddingBottom: 8,
    gap: 12,
  },
  coverOptionCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E8EB",
    overflow: "hidden",
  },
  coverOptionCardActive: {
    borderColor: "#3182F6",
    shadowColor: "#3182F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  coverOptionImage: {
    width: "100%",
    height: 128,
    backgroundColor: "#F2F4F6",
  },
  coverOptionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  coverOptionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#191F28",
  },
  coverOptionSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: "#8B95A1",
  },
  coverPricePill: {
    minWidth: 54,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#191F28",
  },
  coverPricePillOwned: {
    backgroundColor: "#F2F4F6",
  },
  coverPricePillActive: {
    backgroundColor: "#3182F6",
  },
  coverPriceText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  coverPriceTextOwned: {
    color: "#4E5968",
  },
  coverPriceTextActive: {
    color: "#FFFFFF",
  },
  coverPurchaseConfirmLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  coverPurchaseConfirmDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
  },
  coverPurchaseConfirmBox: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 18,
  },
  coverPurchaseConfirmIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  coverPurchaseConfirmTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#191F28",
    letterSpacing: -0.3,
  },
  coverPurchaseConfirmMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#6B7684",
    textAlign: "center",
  },
  coverPurchaseConfirmMeta: {
    width: "100%",
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "#F7F8FA",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  coverPurchaseConfirmMetaDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#E5E8EB",
  },
  coverPurchaseConfirmMetaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B95A1",
    textAlign: "center",
  },
  coverPurchaseConfirmMetaValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900",
    color: "#191F28",
    textAlign: "center",
  },
  coverPurchaseConfirmActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  coverPurchaseCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  coverPurchaseCancelText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#4E5968",
  },
  coverPurchaseConfirmBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#191F28",
    alignItems: "center",
    justifyContent: "center",
  },
  coverPurchaseConfirmBtnDisabled: {
    opacity: 0.65,
  },
  coverPurchaseConfirmText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  coverPreloadLayer: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
  coverPreloadImage: {
    width: 1,
    height: 1,
  },

  // 로딩
  loadingBox: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#8B95A1",
  },

  // 알림톡 크레딧 배너
  creditBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    gap: 12,
  },
  creditIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  creditLabel: {
    fontSize: 12,
    color: "#8B95A1",
    fontWeight: "600",
    marginBottom: 2,
  },
  creditValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  creditWarning: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "600",
    marginTop: 2,
  },
  chargeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#3182F6",
    borderRadius: 10,
  },
  chargeBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // 참여한 경조사 — 부조 내역 박스
  participatedContribBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    gap: 10,
  },
  participatedContribLabel: {
    fontSize: 12,
    color: "#8B95A1",
    fontWeight: "600",
    marginBottom: 2,
  },
  participatedContribSub: {
    fontSize: 12,
    color: "#4E5968",
    fontWeight: "500",
  },
  participatedContribAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#191F28",
    letterSpacing: -0.3,
  },
  // 영수증 보기 버튼
  receiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#EBF3FF",
    borderRadius: 8,
  },
  receiptBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3182F6",
  },
});
