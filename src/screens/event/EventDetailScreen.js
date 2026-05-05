// src/screens/event/EventDetailScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  DeviceEventEmitter,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  Keyboard,
  Vibration,
  Image,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../styles/constants';
import { getCurrentUserInfo, getEventDetail, getEventContributions, getEventStatistics, addGuestBookEntry, updateGuestBookEntry, deleteGuestBookEntry, toggleGuestBookVerification, updateEvent } from '../../lib/supabaseHelper';
import { supabase } from '../../lib/supabase';
import { sendAlimtalkWithCredit, getAlimtalkBalance } from '../../lib/alimtalkCredit';
import { normalizePhone, samePhone } from '../../lib/phoneUtils';
import SimpleModal from '../../components/SimpleModal';
import { useSimpleAlert } from '../../hooks/useSimpleAlert';
import TutorialOverlay from '../../components/TutorialOverlay';
import { useTutorial } from '../../contexts/TutorialContext';

const GUEST_CARD_ASSETS = {
  groomRail: require('../../../assets/guestbook/card/guest-card-rail-groom-fast.png'),
  brideRail: require('../../../assets/guestbook/card/guest-card-rail-bride-fast.png'),
  pattern: require('../../../assets/guestbook/card/guest-card-pattern-visible-fast.png'),
  confirmedStamp: require('../../../assets/guestbook/card/ChatGPT Image May 5, 2026, 06_09_38 PM.png'),
  cash: require('../../../assets/guestbook/card/icon-cash.png'),
  ticket: require('../../../assets/guestbook/card/icon-ticket.png'),
};
const GUEST_CARD_FONT_FAMILY = Platform.select({
  ios: 'Apple SD Gothic Neo',
  android: 'sans-serif',
  default: undefined,
});

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, initialEvent, initialStats } = route.params;
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const guestCardWidth = Math.min(viewportWidth * 0.96, 680);
  const guestCardScale = Math.max(Math.min(guestCardWidth / 680, 1), 0.55);
  const guestCardFontScale = Math.max(Math.min(guestCardWidth / 680, 1), 0.7);
  const scaleGuestCard = (value, min = 0) => Math.round(Math.max(value * guestCardScale, min));
  const scaleGuestFont = (value, min = 0) => Math.round(Math.max(value * guestCardFontScale, min));

  // 백 버튼 텍스트 제거 + 초기 타이틀 즉시 적용
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color="#191F28" />
        </TouchableOpacity>
      ),
      ...(initialEvent?.event_name ? { title: initialEvent.event_name } : {}),
    });
  }, [navigation]);

  // initialEvent/initialStats가 있으면 즉시 렌더링, 없으면 로딩 후 표시
  const [event, setEvent] = useState(initialEvent || null);
  const [contributions, setContributions] = useState([]);
  const contributionsRef = useRef([]);
  const [loading, setLoading] = useState(!initialEvent); // 초기 데이터 있으면 로딩 스킵
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(initialStats || {
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
    confirmedCount: 0,
  });

  // 검색 및 페이지네이션
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'groom', 'bride', 'verified', 'unverified'
  const [sortOrder, setSortOrder] = useState('default'); // 'default', 'amount_desc', 'amount_asc', 'name_asc', 'name_desc'

  // 성공 모달
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: '',
    message: '',
    icon: 'checkmark-circle',
    color: Colors.success || Colors.primary
  });

  // 확정 모달
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationModalData, setVerificationModalData] = useState({
    contribution: null,
    isVerified: false
  });

  // 검색 모달
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [inputEditable, setInputEditable] = useState(true);
  const searchInputRef = useRef(null);
  const keyboardActivated = useRef(false); // 키보드 활성화 상태 추적
  const scrollViewRef = useRef(null);
  const itemYPositions = useRef({}); // 각 아이템의 Y 위치 (newListSection 기준)
  const listSectionY = useRef(0);    // newListSection의 ScrollView 기준 Y 위치
  const guestbookRealtimeChannelRef = useRef(null);
  
  // 통계 모달
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);
  
  // 확정 관리 모달
  const [verifyManageModalVisible, setVerifyManageModalVisible] = useState(false);
  const [verifyPage, setVerifyPage] = useState(0); // 확정관리 페이지 (5개씩)
  const [mealUnlocked, setMealUnlocked] = useState(false);
  const [mealPasswordVisible, setMealPasswordVisible] = useState(false);
  const [mealPassword, setMealPassword] = useState('');
  const [mealPasswordError, setMealPasswordError] = useState('');
  const [pendingMealAction, setPendingMealAction] = useState(null);
  const [mealCompact, setMealCompact] = useState(true);
  const [mealEditVisible, setMealEditVisible] = useState(false);
  const [savingMealSettlement, setSavingMealSettlement] = useState(false);
  const [mealFormError, setMealFormError] = useState('');
  const [mealForm, setMealForm] = useState({
    price: '',
    contractedCount: '',
    groomCount: '',
    brideCount: '',
  });
  const mealPasswordShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    contributionsRef.current = contributions;
  }, [contributions]);

  // ── 바텀시트 애니메이션 (배경 fade / 시트 slide 분리) ──
  const bsAddFade     = useRef(new Animated.Value(0)).current;
  const bsStatFade    = useRef(new Animated.Value(0)).current;
  const bsVerifyFade  = useRef(new Animated.Value(0)).current;
  const bsVmFade      = useRef(new Animated.Value(0)).current;
  const bsSideFade    = useRef(new Animated.Value(0)).current;
  const bsMealFade    = useRef(new Animated.Value(0)).current;
  const bsAddSlide    = useRef(new Animated.Value(600)).current;
  const bsStatSlide   = useRef(new Animated.Value(600)).current;
  const bsVerifySlide = useRef(new Animated.Value(600)).current;
  const bsVmSlide     = useRef(new Animated.Value(600)).current;
  const bsSideSlide   = useRef(new Animated.Value(600)).current;
  const bsMealSlide   = useRef(new Animated.Value(600)).current;

  const openBS = useCallback((setVisible, fade, slide) => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, damping: 22, stiffness: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  const closeBS = useCallback((setVisible, fade, slide, extra) => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 600, duration: 220, useNativeDriver: true }),
    ]).start(() => { setVisible(false); extra?.(); });
  }, []);

  // 아이템 탭 → 액션 버튼 토글
  const [expandedItemId, setExpandedItemId] = useState(null);
  const toggleExpand = (id) => setExpandedItemId(prev => prev === id ? null : id);

  // 검색 모달 열기
  const openSearchModal = () => {
    console.log('🔍 검색 모달 열기 시작');
    keyboardActivated.current = false; // 키보드 상태 리셋
    setTempSearchQuery(searchQuery);
    setSearchModalVisible(true);
  };

  // 모달이 완전히 나타난 후 키보드 활성화
  const handleModalShow = () => {
    console.log('🎬 모달 onShow 이벤트 발생');
    
    if (keyboardActivated.current) {
      console.log('⏭️ 키보드 이미 활성화됨, 건너뜀');
      return;
    }
    
    // 단순하고 효과적인 방법만 사용
    const activateKeyboard = () => {
      if (searchInputRef.current && !keyboardActivated.current) {
        console.log('🚀 키보드 활성화 시도');
        
        // editable 토글 트릭 (가장 효과적)
        setInputEditable(false);
        setTimeout(() => {
          setInputEditable(true);
          setTimeout(() => {
            if (searchInputRef.current && !keyboardActivated.current) {
              searchInputRef.current.focus();
              console.log('✅ 키보드 활성화 완료');
            }
          }, 50);
        }, 50);
      }
    };
    
    // 한 번만 시도
    setTimeout(activateKeyboard, 200);
  };

  // 검색 적용
  const applySearch = () => {
    setSearchQuery(tempSearchQuery);
    setSearchModalVisible(false);
  };

  // 검색 취소
  const cancelSearch = () => {
    setTempSearchQuery(searchQuery);
    setSearchModalVisible(false);
  };

  // 검색 초기화
  const clearSearch = () => {
    setTempSearchQuery('');
    setSearchQuery('');
    setSearchModalVisible(false);
  };

  // 관계 매핑 함수
  const getRelationDisplay = (category, detail) => {
    // category 매핑
    const categoryMap = {
      'groom': '신랑측',
      'bride': '신부측',
      'groom_side': '신랑측',
      'bride_side': '신부측',
      '신랑측': '신랑측',
      '신부측': '신부측'
    };

    // detail 매핑
    const detailMap = {
      'family': '친척',
      'friend': '친구',
      'colleague': '직장',
      'other': '기타',
      'groom_family': '친척',
      'bride_family': '친척',
      'groom_friend': '친구',
      'bride_friend': '친구',
      'groom_colleague': '직장',
      'bride_colleague': '직장',
      '친척': '친척',
      '친구': '친구',
      '직장': '직장',
      '기타': '기타'
    };
    
    const displayCategory = categoryMap[category] || category || '미분류';
    const displayDetail = detailMap[detail] || detail || '일반';
    
    return { displayCategory, displayDetail };
  };

  // 디지털 방명록 측 선택 모달
  const [sideSelectVisible, setSideSelectVisible] = useState(false);

  // 부조 추가 모달
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addingContribution, setAddingContribution] = useState(false);
  const [newContribution, setNewContribution] = useState({
    guest_name: '',
    amount: '',
    relation_category: '신랑측',
    relation_detail: '친구',
  });

  // 알림톡 재발송 — 로딩 중 UI 블로킹용
  const [resendingId, setResendingId] = useState(null);
  // 현재 유저 알림톡 크레딧 잔액
  const [alimtalkBalance, setAlimtalkBalance] = useState(null);
  // 공통 Alert 훅
  const { showAlert, alertProps } = useSimpleAlert();

  // ── 튜토리얼 ──
  const { activeTutorial, step: tutorialStep, registerTarget, registerHandler, advanceStep: tutorialAdvance } = useTutorial();
  const guestReceiveBtnRef = useRef(null);
  const sideSelectRowsRef = useRef(null);

  // 튜토리얼 타겟 반복 측정 (하객 접수 버튼 + 접수대 선택 행)
  useEffect(() => {
    if (activeTutorial !== 'myEvents') return;
    if (tutorialStep?.screen !== 'EventDetail') return;
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
      measureRef(guestReceiveBtnRef, 'eventDetailGuestReceiveBtn');
      measureRef(sideSelectRowsRef, 'eventDetailSideSelectRows');
    };
    measure();
    const id = setInterval(measure, 500);
    return () => clearInterval(id);
  }, [activeTutorial, tutorialStep?.screen, registerTarget]);

  // 하객 접수 버튼 탭 핸들러 — 오버레이 탭 시 바텀시트 열기
  useEffect(() => {
    if (activeTutorial !== 'myEvents') return;
    registerHandler('eventDetailGuestReceiveBtn', () => {
      openBS(setSideSelectVisible, bsSideFade, bsSideSlide);
    });
  }, [activeTutorial, registerHandler]);

  // 인라인 수정
  const [editingItemId, setEditingItemId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({
    guest_name: '',
    amount: '',
    relation_category: '신랑측',
    relation_detail: '친구',
    guest_phone: '',
  });

  // 인라인 수정 중 키보드 올라오면 해당 아이템이 키보드 위로 오도록 스크롤
  useEffect(() => {
    if (!editingItemId) return;
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      const itemY = itemYPositions.current[editingItemId];
      if (itemY === undefined || !scrollViewRef.current) return;
      const targetY = listSectionY.current + itemY - 80;
      scrollViewRef.current.scrollTo({ y: Math.max(0, targetY), animated: true });
    });
    return () => sub.remove();
  }, [editingItemId]);

  // 부조 추가 처리
  const handleAddContribution = async () => {
    if (!newContribution.guest_name.trim()) {
      showAlert({ title: '알림', message: '성함을 입력해주세요.' });
      return;
    }
    
    const amount = parseInt(newContribution.amount.replace(/[^0-9]/g, ''));
    if (!amount || amount < 1000) {
      showAlert({ title: '알림', message: '부조금을 1,000원 이상 입력해주세요.' });
      return;
    }

    setAddingContribution(true);

    try {
      const contributionData = {
        guest_name: newContribution.guest_name.trim(),
        amount: amount,
        relation_category: newContribution.relation_category,
        relation_detail: newContribution.relation_detail,
        is_manual_entry: true,
      };

      
      const result = await addGuestBookEntry(eventId, contributionData);
      
      if (result.success) {
        showAlert({
          title: '부조 추가 완료',
          message: `${newContribution.guest_name}님의 부조가 등록되었습니다.\n${formatAmount(amount)}`,
          onConfirm: () => {
            setAddModalVisible(false);
            setNewContribution({
              guest_name: '',
              amount: '',
              relation_category: '신랑측',
              relation_detail: '친구',
            });
            loadEventData();
          },
        });
      } else {
        showAlert({ title: '오류', message: result.error || '부조 등록에 실패했습니다.' });
      }
    } catch (error) {
      console.error('부조 추가 오류:', error);
      showAlert({ title: '오류', message: '부조 등록 중 오류가 발생했습니다.' });
    } finally {
      setAddingContribution(false);
    }
  };

  // 인라인 수정 열기
  const formatPhone = (text) => {
    const d = text.replace(/[^0-9]/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
  };

  const handleResendAlimtalk = async (contribution) => {
    if (!contribution.guest_phone || !contribution.amount) return;
    if (contribution.alimtalk_sent) return;
    if (resendingId === contribution.id) return;

    showAlert({
      title: '알림톡 재발송',
      message: '크레딧 1건이 차감됩니다.\n발송하시겠어요?',
      confirmText: '발송',
      cancelText: '취소',
      onConfirm: async () => {
        setResendingId(contribution.id);
        try {
          const res = await sendAlimtalkWithCredit({
            userId: event?.user_id,
            eventId,
            contributionId: contribution.id,
            phone: contribution.guest_phone,
            guestName: contribution.guest_name,
            amount: contribution.amount,
            side: contribution.side || 'groom',
            relationship: contribution.relation_detail || 'other',
            isResend: true,
          });

          if (res?.success) {
            setContributions(prev => prev.map(c =>
              c.id === contribution.id ? { ...c, alimtalk_sent: true } : c
            ));
            setAlimtalkBalance(res.balance);
            showAlert({
              title: '발송 완료',
              message: `카카오 알림톡 영수증을 재발송했습니다.\n남은 크레딧: ${res.balance}건`,
            });
          } else if (res?.error === 'insufficient_balance') {
            setAlimtalkBalance(res.balance ?? 0);
            showAlert({
              title: '크레딧 부족',
              message: '알림톡 크레딧이 부족합니다.\n충전 후 다시 시도해주세요.',
            });
          } else if (res?.error === 'send_failed') {
            showAlert({
              title: '발송 실패',
              message: '알림톡 발송에 실패했습니다.\n크레딧은 자동으로 환불되었습니다.',
            });
          } else {
            showAlert({
              title: '발송 실패',
              message: res?.message || '알림톡 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
            });
          }
        } catch (e) {
          showAlert({ title: '오류', message: '알림톡 발송 중 오류가 발생했습니다.' });
        } finally {
          setResendingId(null);
        }
      },
    });
  };

  const handleEditContribution = (contribution) => {
    setEditingItemId(contribution.id);
    setInlineEditData({
      guest_name: contribution.guest_name || '',
      amount: contribution.amount || 0,
      relation_category: contribution.relation_category || '신랑측',
      relation_detail: contribution.relation_detail || '친구',
      guest_phone: contribution.guest_phone || '',
    });

    // 스크롤은 keyboardDidShow 리스너에서 처리
  };

  // 인라인 수정 저장 (낙관적 업데이트)
  const handleSaveInlineEdit = async (contribution) => {
    if (!inlineEditData.guest_name.trim()) {
      showAlert({ title: '알림', message: '성함을 입력해주세요.' });
      return;
    }
    const amount = inlineEditData.amount;
    if (!amount || amount < 1000) {
      showAlert({ title: '알림', message: '부조금을 1,000원 이상 입력해주세요.' });
      return;
    }

    const cleanPhone = normalizePhone(inlineEditData.guest_phone);

    // 같은 이벤트 내 전화번호 중복 체크 (+82, 010, dash 포함 등 다양한 형식 정규화 비교)
    if (cleanPhone) {
      const duplicate = contributions.find(c =>
        c.id !== contribution.id &&
        samePhone(c.guest_phone, cleanPhone)
      );
      if (duplicate) {
        showAlert({ title: '중복 번호', message: `이미 ${duplicate.guest_name}님이 같은 번호로 등록되어 있습니다.` });
        return;
      }
    }

    const updated = {
      ...contribution,
      guest_name: inlineEditData.guest_name.trim(),
      amount,
      relation_category: inlineEditData.relation_category,
      relation_detail: inlineEditData.relation_detail,
      guest_phone: cleanPhone || null,
    };

    // 즉시 UI 반영
    setContributions(prev => prev.map(c => c.id === contribution.id ? updated : c));
    setEditingItemId(null);

    try {
      const result = await updateGuestBookEntry(contribution.id, {
        guest_name: updated.guest_name,
        amount: updated.amount,
        relation_category: updated.relation_category,
        relation_detail: updated.relation_detail,
        guest_phone: updated.guest_phone,
      });
      if (!result.success) {
        // 실패 시 원래 값으로 되돌리기
        setContributions(prev => prev.map(c => c.id === contribution.id ? contribution : c));
        showAlert({ title: '오류', message: result.error || '부조 수정에 실패했습니다.' });
      }
    } catch (error) {
      setContributions(prev => prev.map(c => c.id === contribution.id ? contribution : c));
      showAlert({ title: '오류', message: '부조 수정 중 오류가 발생했습니다.' });
    }
  };

  // 부조 삭제 처리
  const handleDeleteContribution = (contribution) => {
    console.log('🔍 삭제할 contribution 객체:', contribution);
    console.log('🔍 contribution.id:', contribution.id);
    showAlert({
      title: '부조 삭제',
      message: `${contribution.guest_name}님의 부조 내역을 정말 삭제하시겠어요?\n\n삭제된 내역은 복구할 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      dangerous: true,
      onConfirm: async () => {
        try {
          const result = await deleteGuestBookEntry(contribution.id);
          if (result.success) {
            loadEventData();
          } else {
            showAlert({ title: '삭제 실패', message: result.error || '부조 삭제에 실패했습니다.' });
          }
        } catch (error) {
          console.error('부조 삭제 오류:', error);
          showAlert({ title: '삭제 실패', message: '부조 삭제 중 오류가 발생했습니다.' });
        }
      },
    });
  };


  // 부조 확정/미확정 토글 처리 — 낙관적 업데이트(즉시 UI 반영)
  const handleToggleVerification = async (contribution) => {
    const newVerified = !contribution.is_verified;
    const broadcastVerificationChange = (isVerified) => {
      guestbookRealtimeChannelRef.current?.send({
        type: 'broadcast',
        event: 'verification_changed',
        payload: {
          event_id: eventId,
          id: contribution.id,
          is_verified: isVerified,
        },
      });
    };

    // 즉시 UI 반영
    setContributions(prev =>
      prev.map(c => c.id === contribution.id ? { ...c, is_verified: newVerified } : c)
    );
    setStats(prev => ({
      ...prev,
      confirmedCount: prev.confirmedCount + (newVerified ? 1 : -1),
    }));
    // 다른 태블릿도 DB 응답을 기다리지 않고 바로 바뀌게 먼저 알림
    broadcastVerificationChange(newVerified);

    try {
      const result = await toggleGuestBookVerification(contribution.id);
      if (!result.success) {
        // 실패 시 되돌리기
        setContributions(prev =>
          prev.map(c => c.id === contribution.id ? { ...c, is_verified: contribution.is_verified } : c)
        );
        setStats(prev => ({
          ...prev,
          confirmedCount: prev.confirmedCount + (newVerified ? -1 : 1),
        }));
        broadcastVerificationChange(contribution.is_verified);
        showAlert({ title: '오류', message: result.error || '확정 상태 변경에 실패했습니다.' });
      }
    } catch (error) {
      // 실패 시 되돌리기
      setContributions(prev =>
        prev.map(c => c.id === contribution.id ? { ...c, is_verified: contribution.is_verified } : c)
      );
      setStats(prev => ({
        ...prev,
        confirmedCount: prev.confirmedCount + (newVerified ? -1 : 1),
      }));
      broadcastVerificationChange(contribution.is_verified);
      showAlert({ title: '오류', message: '확정 상태 변경 중 오류가 발생했습니다.' });
    }
  };

  // 확정 처리 실행 — 확정관리 모달·바텀시트에서 사용
  const executeVerificationToggle = async () => {
    setVerificationModalVisible(false);
    try {
      const result = await toggleGuestBookVerification(verificationModalData.contribution.id);
      if (result.success) {
        loadEventData();
      } else {
        showAlert({ title: '오류', message: result.error || '확정 상태 변경에 실패했습니다.' });
      }
    } catch (error) {
      console.error('확정 상태 변경 오류:', error);
      showAlert({ title: '오류', message: '확정 상태 변경 중 오류가 발생했습니다.' });
    }
  };

  const formatAmountInput = (text) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('ko-KR').format(parseInt(numbers));
  };

  const parseAdditionalInfo = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return {};
    }
  };

  const getMealSettlement = () => {
    const info = parseAdditionalInfo(event?.additional_info);
    return info.meal_settlement || {};
  };

  const mealSettlement = getMealSettlement();
  const mealTicketPrice = Number(mealSettlement.ticket_price || 0);
  const mealContractedTicketCount = Number(mealSettlement.contracted_ticket_count || mealSettlement.ticket_count || 0);
  const mealGroomTicketCount = Number(mealSettlement.groom_ticket_count || 0);
  const mealBrideTicketCount = Number(mealSettlement.bride_ticket_count || 0);
  const getMealContributionSide = (item) => {
    const raw = item?.side || item?.relation_category || item?.relation_detail || '';
    if (raw === 'bride' || raw === 'bride_side' || raw === '신부측') return 'bride';
    return 'groom';
  };
  const mealTicketStats = contributions.reduce((acc, item) => {
    const count = Number(item.ticket_count || 0);
    if (count <= 0) return acc;
    acc.total += count;
    if (getMealContributionSide(item) === 'bride') {
      acc.bride += count;
    } else {
      acc.groom += count;
    }
    return acc;
  }, { total: 0, groom: 0, bride: 0 });
  const mealRemainingTicketCount = mealContractedTicketCount - mealTicketStats.total;
  const mealGroomRemainingTicketCount = mealGroomTicketCount - mealTicketStats.groom;
  const mealBrideRemainingTicketCount = mealBrideTicketCount - mealTicketStats.bride;
  const mealContractedTotalAmount = mealTicketPrice * mealContractedTicketCount;
  const mealDistributedTotalAmount = mealTicketPrice * mealTicketStats.total;
  const hasMealSettlement = mealTicketPrice > 0 || mealContractedTicketCount > 0 || mealGroomTicketCount > 0 || mealBrideTicketCount > 0;
  const formatMealTicketDelta = (value) => {
    if (value < 0) return `${formatAmountCard(Math.abs(value))}장 초과`;
    return `${formatAmountCard(value)}장 남음`;
  };
  const formatProtectedMealAmount = (amount) => {
    if (!mealUnlocked) return '금액 잠김';
    return formatAmount(amount);
  };

  const getPhoneLast4Password = async () => {
    const userResult = await getCurrentUserInfo();
    const phone = userResult?.user?.phone || '';
    const digits = String(phone).replace(/\D/g, '');
    return digits.slice(-4);
  };

  const requestMealPassword = (action) => {
    if (mealCompact && action === 'view') {
      setMealCompact(false);
    }
    setPendingMealAction(action);
    setMealPassword('');
    setMealPasswordError('');
    setMealPasswordVisible(true);
  };

  const closeMealPasswordModal = () => {
    Keyboard.dismiss();
    setMealPasswordVisible(false);
    setMealPassword('');
    setMealPasswordError('');
    setPendingMealAction(null);
  };

  const closeMealEditModal = (extra) => {
    Keyboard.dismiss();
    closeBS(setMealEditVisible, bsMealFade, bsMealSlide, () => {
      setMealFormError('');
      if (typeof extra === 'function') extra();
    });
  };

  const runMealAction = (action) => {
    if (action === 'view') {
      setMealUnlocked(true);
      return;
    }
    if (action === 'edit') {
      const settlement = getMealSettlement();
      setMealForm({
        price: settlement.ticket_price ? formatAmountInput(String(settlement.ticket_price)) : '',
        contractedCount: (settlement.contracted_ticket_count || settlement.ticket_count) ? formatAmountInput(String(settlement.contracted_ticket_count || settlement.ticket_count)) : '',
        groomCount: settlement.groom_ticket_count ? formatAmountInput(String(settlement.groom_ticket_count)) : '',
        brideCount: settlement.bride_ticket_count ? formatAmountInput(String(settlement.bride_ticket_count)) : '',
      });
      setMealFormError('');
      openBS(setMealEditVisible, bsMealFade, bsMealSlide);
      return;
    }
    if (action === 'delete') {
      showAlert({
        title: '식대 정보 삭제',
        message: '저장된 식권/식대 정산 정보를 삭제하시겠어요?',
        confirmText: '삭제',
        cancelText: '취소',
        dangerous: true,
        onConfirm: handleDeleteMealSettlement,
      });
    }
  };

  const handleConfirmMealPassword = async () => {
    const triggerPasswordError = (message) => {
      setMealPasswordError(message);
      Vibration.vibrate(35);
      mealPasswordShake.setValue(0);
      Animated.sequence([
        Animated.timing(mealPasswordShake, { toValue: 1, duration: 42, useNativeDriver: true }),
        Animated.timing(mealPasswordShake, { toValue: -1, duration: 42, useNativeDriver: true }),
        Animated.timing(mealPasswordShake, { toValue: 1, duration: 42, useNativeDriver: true }),
        Animated.timing(mealPasswordShake, { toValue: 0, duration: 42, useNativeDriver: true }),
      ]).start();
    };

    Keyboard.dismiss();
    if (mealPassword.length < 4) {
      triggerPasswordError('휴대폰 번호 뒤 4자리를 입력해주세요.');
      return;
    }
    const expected = await getPhoneLast4Password();
    if (!expected || expected.length < 4) {
      triggerPasswordError('로그인한 휴대폰 번호를 확인할 수 없습니다.');
      return;
    }
    if (mealPassword !== expected) {
      triggerPasswordError('비밀번호가 맞지 않아요. 다시 입력해주세요.');
      return;
    }
    const action = pendingMealAction;
    setMealPasswordVisible(false);
    setMealPassword('');
    setMealPasswordError('');
    setPendingMealAction(null);
    runMealAction(action);
  };

  const saveMealSettlementInfo = async (nextSettlement) => {
    if (!event) return { success: false, error: '이벤트 정보가 없습니다.' };
    const nextAdditionalInfo = {
      ...parseAdditionalInfo(event.additional_info),
      meal_settlement: nextSettlement,
    };
    const result = await updateEvent(eventId, { additional_info: nextAdditionalInfo });
    if (result.success) {
      setEvent(prev => ({
        ...prev,
        ...(result.data || {}),
        additional_info: nextAdditionalInfo,
      }));
    }
    return result;
  };

  const handleSaveMealSettlement = async () => {
    const price = parseInt(String(mealForm.price || '').replace(/[^0-9]/g, ''), 10) || 0;
    const contractedCount = parseInt(String(mealForm.contractedCount || '').replace(/[^0-9]/g, ''), 10) || 0;
    const groomCount = parseInt(String(mealForm.groomCount || '').replace(/[^0-9]/g, ''), 10) || 0;
    const brideCount = parseInt(String(mealForm.brideCount || '').replace(/[^0-9]/g, ''), 10) || 0;
    if (price <= 0) {
      setMealFormError('식권 1장당 식대를 입력해주세요.');
      return;
    }
    if (contractedCount <= 0) {
      setMealFormError('전체 계약 식권 수를 입력해주세요.');
      return;
    }
    if (groomCount <= 0 || brideCount <= 0) {
      setMealFormError('신랑측/신부측 배정 식권 수를 모두 입력해주세요.');
      return;
    }
    if (groomCount + brideCount !== contractedCount) {
      setMealFormError('신랑측/신부측 배정 합계가 전체 계약 식권 수와 같아야 합니다.');
      return;
    }
    Keyboard.dismiss();
    setMealFormError('');
    setSavingMealSettlement(true);
    try {
      const result = await saveMealSettlementInfo({
        ticket_price: price,
        contracted_ticket_count: contractedCount,
        groom_ticket_count: groomCount,
        bride_ticket_count: brideCount,
        ticket_count: contractedCount,
        updated_at: new Date().toISOString(),
      });
      if (result.success) {
        setMealUnlocked(true);
        closeMealEditModal(() => {
          showAlert({ title: '저장 완료', message: '식대 정산 정보가 저장되었습니다.' });
        });
      } else {
        showAlert({ title: '저장 실패', message: result.error || '식대 정보를 저장하지 못했습니다.' });
      }
    } catch (error) {
      showAlert({ title: '저장 실패', message: '식대 정보 저장 중 오류가 발생했습니다.' });
    } finally {
      setSavingMealSettlement(false);
    }
  };

  const handleDeleteMealSettlement = async () => {
    const result = await saveMealSettlementInfo(null);
    if (result.success) {
      setMealUnlocked(false);
      showAlert({ title: '삭제 완료', message: '식대 정산 정보가 삭제되었습니다.' });
    } else {
      showAlert({ title: '삭제 실패', message: result.error || '식대 정보를 삭제하지 못했습니다.' });
    }
  };

  // 검색 및 탭 필터링 계산
  const filteredContributions = contributions.filter(contribution => {
    // 검색 필터
    const matchesSearch = contribution.guest_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 탭 필터
    let matchesTab = true;
    if (activeTab === 'verified') {
      matchesTab = contribution.is_verified === true;
    } else if (activeTab === 'unverified') {
      matchesTab = contribution.is_verified === false;
    } else if (activeTab === 'groom') {
      matchesTab = getMealContributionSide(contribution) === 'groom';
    } else if (activeTab === 'bride') {
      matchesTab = getMealContributionSide(contribution) === 'bride';
    }
    
    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    // 정렬 적용
    switch (sortOrder) {
      case 'amount_desc': // 부조금 많은 순
        return (b.amount || 0) - (a.amount || 0);
      case 'amount_asc': // 부조금 적은 순  
        return (a.amount || 0) - (b.amount || 0);
      case 'name_asc': // 이름 가나다 순
        return (a.guest_name || '').localeCompare(b.guest_name || '', 'ko-KR');
      case 'name_desc': // 이름 역순
        return (b.guest_name || '').localeCompare(a.guest_name || '', 'ko-KR');
      default: // 기본값 (최신 등록 순 — 방금 등록한 게 맨 위)
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });
  
  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageContributions = filteredContributions.slice(startIndex, startIndex + itemsPerPage);
  const listTabItems = [
    { key: 'all', label: '전체', count: contributions.length },
    { key: 'groom', label: '신랑측', count: contributions.filter(c => getMealContributionSide(c) === 'groom').length },
    { key: 'bride', label: '신부측', count: contributions.filter(c => getMealContributionSide(c) === 'bride').length },
    { key: 'unverified', label: '미확정', count: contributions.filter(c => !c.is_verified).length },
    { key: 'verified', label: '확정', count: contributions.filter(c => c.is_verified).length },
  ];

  // 검색어나 탭, 정렬이 변경되면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortOrder]);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadEventData();
      // 알림톡 크레딧 잔액도 같이 갱신
      getAlimtalkBalance().then(res => {
        if (res?.success) setAlimtalkBalance(res.balance);
      });
      // 하객 접수 흐름에서 pop(2)로 돌아왔을 때 모달 상태 초기화
      setSideSelectVisible(false);
      setAddModalVisible(false);
      // Android 키보드 잔상 제거
      Keyboard.dismiss();
    }, [eventId])
  );

  // users 테이블 realtime 구독 — 차감/환불 즉시 반영
  useEffect(() => {
    let channel = null;
    (async () => {
      const { getCurrentUserInfo } = await import('../../lib/supabaseHelper');
      const info = await getCurrentUserInfo();
      const uid = info?.user?.id;
      if (!uid) return;
      channel = supabase
        .channel(`eventdetail_balance_${uid}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${uid}`,
          },
          (payload) => {
            const next = payload?.new?.alimtalk_balance;
            if (typeof next === 'number') setAlimtalkBalance(next);
          },
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // ── 방명록 실시간 반영 ────────────────────────
  // ① DeviceEventEmitter: 같은 기기에서 등록 시 즉시 반영
  // ② Supabase Realtime: 다른 기기에서 등록해도 반영
  useEffect(() => {
    if (!eventId) return;

    // ① 같은 기기 (즉시)
    const localSub = DeviceEventEmitter.addListener(
      'guestbook_new_entry',
      ({ eventId: updatedEventId, entry }) => {
        if (updatedEventId !== eventId) return;
        setContributions((prev) => {
          if (prev.some((c) => c.id === entry.id)) return prev; // 중복 방지
          return [entry, ...prev];
        });
      }
    );

    // ② 다른 기기 / Supabase Realtime
    // filter 없이 구독하고 client-side에서 eventId 필터링
    // (RLS 설정 없이도 동작)
    const channel = supabase
      .channel(`guestbook_rt_${eventId}`)
      .on(
        'broadcast',
        { event: 'verification_changed' },
        ({ payload }) => {
          if (payload?.event_id !== eventId || !payload?.id) return;
          setContributions((prev) =>
            prev.map((c) => (
              c.id === payload.id
                ? { ...c, is_verified: !!payload.is_verified }
                : c
            ))
          );
          setStats((prev) => {
            const confirmedCount = contributionsRef.current.reduce((count, item) => {
              if (item.id === payload.id) return count + (payload.is_verified ? 1 : 0);
              return count + (item.is_verified ? 1 : 0);
            }, 0);
            return { ...prev, confirmedCount };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guest_book' },
        (payload) => {
          const entry = payload.new;
          if (entry?.event_id !== eventId) return;
          setContributions((prev) => {
            if (prev.some((c) => c.id === entry.id)) return prev; // 중복 방지
            return [entry, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'guest_book' },
        (payload) => {
          const entry = payload.new;
          if (entry?.event_id !== eventId) return;
          setContributions((prev) =>
            prev.map((c) => (c.id === entry.id ? entry : c))
          );
          if (typeof entry.is_verified === 'boolean') {
            setStats((prev) => {
              const confirmedCount = contributionsRef.current.reduce((count, item) => {
                if (item.id === entry.id) return count + (entry.is_verified ? 1 : 0);
                return count + (item.is_verified ? 1 : 0);
              }, 0);
              return { ...prev, confirmedCount };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'guest_book' },
        (payload) => {
          const old = payload.old;
          if (old?.event_id !== eventId) return;
          setContributions((prev) => prev.filter((c) => c.id !== old.id));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] guest_book 구독 성공');
          guestbookRealtimeChannelRef.current = channel;
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] 구독 오류 — 재시도 필요');
        }
      });

    return () => {
      localSub.remove();
      if (guestbookRealtimeChannelRef.current === channel) {
        guestbookRealtimeChannelRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadEventData = async () => {
    try {
      // initialEvent가 있으면 전체 로딩 스피너 없이 백그라운드에서 갱신
      if (!initialEvent) setLoading(true);

      // 세 API를 동시에 병렬 호출 — 순차 대기 제거
      const [eventResult, statsResult, contributionsResult] = await Promise.all([
        initialEvent
          ? Promise.resolve({ success: true, data: initialEvent })
          : getEventDetail(eventId),
        getEventStatistics(eventId),
        getEventContributions(eventId),
      ]);

      if (eventResult.success) {
        setEvent(eventResult.data);
        navigation.setOptions({ title: eventResult.data.event_name || '경조사 상세' });
      } else {
        showAlert({
          title: '오류',
          message: eventResult.error || '경조사 정보를 불러올 수 없습니다.',
          onConfirm: () => navigation.goBack(),
        });
        return;
      }

      // 부조 목록
      if (contributionsResult.success && contributionsResult.data?.length > 0) {
        setContributions(contributionsResult.data);
      } else if (eventResult.data?.guest_book?.length > 0) {
        setContributions(eventResult.data.guest_book);
      } else {
        setContributions([]);
      }

      // 통계
      if (statsResult.success) {
        setStats({
          totalAmount: statsResult.data?.totalAmount || 0,
          totalCount: statsResult.data?.totalContributions || 0,
          averageAmount: statsResult.data?.averageAmount || 0,
          confirmedCount: statsResult.data?.verifiedCount || 0,
        });
      }
    } catch (error) {
      console.error('Event detail loading error:', error);
      showAlert({ title: '오류', message: '데이터를 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEventData();
    setRefreshing(false);
  };

  const calculateStats = (contributionsList) => {
    const totalAmount = contributionsList.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalCount = contributionsList.length;
    const confirmedCount = contributionsList.filter(item => item.is_verified).length;
    const averageAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
    
    const calculatedStats = {
      totalAmount,
      totalCount,
      averageAmount,
      confirmedCount,
    };
    
    setStats(calculatedStats);
  };


  const formatDate = (dateString) => {
    if (!dateString) return '날짜 미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatCardTime = (dateString) => {
    if (!dateString) return '날짜 미상';
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    if (isToday) return `오늘 ${hh}:${mm}`;
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) + ` ${hh}:${mm}`;
  };

  const formatAmountCard = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('ko-KR').format(Math.round(amount));
  };

  const formatAmount = (amount) => {
    if (!amount) return '0원';
    
    // 소수점 제거를 위해 Math.round 적용
    const roundedAmount = Math.round(amount);
    
    // 만원 단위로 표시 (백만원 이상일 경우)
    if (roundedAmount >= 1000000) {
      const man = Math.floor(roundedAmount / 10000);
      return new Intl.NumberFormat('ko-KR').format(man) + '만원';
    }
    
    return new Intl.NumberFormat('ko-KR').format(roundedAmount) + '원';
  };

  const getEventIcon = () => {
    if (!event) return 'calendar';
    switch (event.event_type) {
      case 'wedding': return 'heart';
      case 'funeral': return 'flower';
      case 'birthday': return 'gift';
      default: return 'calendar';
    }
  };

  const getEventColor = () => {
    if (!event) return Colors.primary;
    switch (event.event_type) {
      case 'wedding': return Colors.wedding;
      case 'funeral': return Colors.funeral;
      case 'birthday': return Colors.celebration;
      default: return Colors.other;
    }
  };

  if (loading && !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={32} color={Colors.gray400} />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>경조사를 찾을 수 없습니다</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* 토스 스타일 메인 금액 카드 */}
        {/* ── 히어로 섹션 ── */}
        <View style={styles.heroSection}>

          {/* 이벤트명 + 통계 버튼 */}
          <View style={styles.heroTopRow}>
            <Text style={styles.heroEventName}>{event.event_name}</Text>
            <TouchableOpacity
              style={styles.heroStatBtn}
              onPress={() => openBS(setStatisticsModalVisible, bsStatFade, bsStatSlide)}
              activeOpacity={0.7}
            >
              <Ionicons name="bar-chart-outline" size={15} color="#4E5968" />
              <Text style={styles.heroStatBtnText}>통계</Text>
            </TouchableOpacity>
          </View>

          {/* 총 부조금 */}
          <Text style={styles.heroAmount}>
            {formatAmountCard(stats.totalAmount)}원
          </Text>

          {/* 부조 추가 + 하객접수 */}
          <View style={styles.heroBtnRow}>
            <TouchableOpacity
              style={styles.heroBtnGray}
              onPress={() => openBS(setAddModalVisible, bsAddFade, bsAddSlide)}
              activeOpacity={0.75}
            >
              <Text style={styles.heroBtnGrayText}>부조 추가</Text>
            </TouchableOpacity>
            <TouchableOpacity
              ref={guestReceiveBtnRef}
              style={styles.heroBtnBlue}
              onPress={() => openBS(setSideSelectVisible, bsSideFade, bsSideSlide)}
              activeOpacity={0.85}
            >
              <Text style={styles.heroBtnBlueText}>하객 접수</Text>
            </TouchableOpacity>
          </View>

          {/* 미확정 배너 */}
          {contributions.filter(c => !c.is_verified).length > 0 && (
            <TouchableOpacity
              style={styles.unverifiedBanner}
              onPress={() => openBS(setVerifyManageModalVisible, bsVmFade, bsVmSlide)}
              activeOpacity={0.7}
            >
              <View style={styles.unverifiedIconBox}>
                <Ionicons name="flash" size={18} color="#8B95A1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.unverifiedSub}>아직 정리되지 않은 부조금</Text>
                <Text style={styles.unverifiedMain}>
                  미확정 내역이 {contributions.filter(c => !c.is_verified).length}건 있어요
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C5CCD5" />
            </TouchableOpacity>
          )}

          {/* 알림톡 크레딧 카드 */}
          <View style={styles.creditBanner}>
            {(() => {
              const n = alimtalkBalance;
              const color = n == null ? '#8B95A1' : n < 10 ? '#EF4444' : n < 50 ? '#F59E0B' : '#3182F6';
              return (
                <>
                  <View style={[styles.creditIconBox, { backgroundColor: color + '1A' }]}>
                    <Ionicons name="chatbubble-ellipses" size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.creditLabel}>알림톡 크레딧</Text>
                    <Text style={[styles.creditValue, { color }]}>
                      {n == null ? '-' : `${n}건 남음`}
                    </Text>
                    {n != null && n < 10 && (
                      <Text style={styles.creditWarning}>
                        {n === 0 ? '크레딧이 모두 소진되었어요' : '곧 소진됩니다'}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.chargeBtn}
                    onPress={() => showAlert({ title: '알림톡 크레딧 충전', message: '충전 기능은 곧 제공될 예정입니다.' })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chargeBtnText}>충전</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>

        </View>

        {/* 섹션 구분 */}
        <View style={styles.sectionGap} />

        {/* 예식 정보 + 주최자 정산 */}
        {event.event_type === 'wedding' && (
          <>
            <View style={styles.weddingInfoSection}>
              <View style={styles.mealSettlementCard}>
                <View style={styles.mealHeaderRow}>
                  <View>
                    <Text style={styles.mealTitle}>식대 정보</Text>
                    <Text style={styles.mealSub}>
                      {mealCompact ? '식권 현황만 간단히 보여요' : '식권 현황은 공개, 금액만 보호돼요'}
                    </Text>
                  </View>
                  <View style={styles.mealHeaderActions}>
                    {hasMealSettlement && (
                      <TouchableOpacity
                        style={styles.mealModeToggle}
                        onPress={() => {
                          setMealCompact(prev => {
                            const next = !prev;
                            if (next) setMealUnlocked(false);
                            return next;
                          });
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.mealModeToggleText}>
                          간소화
                        </Text>
                        <View style={[styles.mealSwitchTrack, mealCompact && styles.mealSwitchTrackOn]}>
                          <View style={[styles.mealSwitchThumb, mealCompact && styles.mealSwitchThumbOn]} />
                        </View>
                      </TouchableOpacity>
                    )}
                    <View style={styles.mealLockBadge}>
                      <Ionicons name={mealUnlocked ? 'lock-open-outline' : 'lock-closed-outline'} size={14} color="#8B95A1" />
                      <Text style={styles.mealLockText}>{mealUnlocked ? '금액 열림' : '금액 잠김'}</Text>
                    </View>
                  </View>
                </View>

                {!hasMealSettlement ? (
                  <TouchableOpacity
                    style={styles.mealLockedBox}
                    activeOpacity={0.8}
                    onPress={() => requestMealPassword('edit')}
                  >
                    <View style={styles.mealLockedIcon}>
                      <Ionicons name="receipt-outline" size={22} color="#3182F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealLockedTitle}>식권과 식대 정보를 입력해주세요</Text>
                      <Text style={styles.mealLockedSub}>입력/수정 시 비밀번호가 필요해요</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#C5CCD5" />
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.mealSummaryGrid}>
                      <View style={styles.mealSummaryItem}>
                        <Text style={styles.mealSummaryLabel}>계약 식권</Text>
                        <Text style={styles.mealSummaryValue}>{formatAmountCard(mealContractedTicketCount)}장</Text>
                      </View>
                      <View style={styles.mealSummaryItem}>
                        <Text style={styles.mealSummaryLabel}>실제 배부</Text>
                        <Text style={styles.mealSummaryValue}>{formatAmountCard(mealTicketStats.total)}장</Text>
                      </View>
                      <View style={styles.mealSummaryItem}>
                        <Text style={styles.mealSummaryLabel}>잔여/초과</Text>
                        <Text style={[
                          styles.mealSummaryValue,
                          mealRemainingTicketCount < 0 && { color: '#F04452' }
                        ]}>
                          {formatMealTicketDelta(mealRemainingTicketCount)}
                        </Text>
                      </View>
                    </View>
                    {!mealCompact && (
                      <View style={[styles.mealSummaryGrid, { marginTop: 10 }]}>
                        <View style={styles.mealSummaryItem}>
                          <Text style={styles.mealSummaryLabel}>1인 식대</Text>
                          <Text style={[
                            styles.mealSummaryValue,
                            !mealUnlocked && styles.mealProtectedValue
                          ]}>
                            {formatProtectedMealAmount(mealTicketPrice)}
                          </Text>
                        </View>
                      </View>
                    )}
                    <View style={styles.mealTicketSplitBox}>
                      {[
                        { label: '신랑측', assigned: mealGroomTicketCount, distributed: mealTicketStats.groom, remaining: mealGroomRemainingTicketCount },
                        { label: '신부측', assigned: mealBrideTicketCount, distributed: mealTicketStats.bride, remaining: mealBrideRemainingTicketCount },
                      ].map((item) => (
                        <View key={item.label} style={styles.mealTicketSplitRow}>
                          <Text style={styles.mealTicketSplitLabel}>{item.label}</Text>
                          <Text style={styles.mealTicketSplitValue}>
                            배정 {formatAmountCard(item.assigned)}장 · 배부 {formatAmountCard(item.distributed)}장
                          </Text>
                          <Text style={[
                            styles.mealTicketSplitDelta,
                            item.remaining < 0 && { color: '#F04452' }
                          ]}>
                            {formatMealTicketDelta(item.remaining)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {mealCompact ? (
                      <View style={styles.mealCompactLockBox}>
                        <Ionicons name="lock-closed-outline" size={15} color="#8B95A1" />
                        <Text style={styles.mealCompactLockText}>식대와 예상 청구 금액은 숨겨져 있어요</Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.mealTotalBox}>
                          <Text style={styles.mealTotalLabel}>예상 청구 식대</Text>
                          <Text style={styles.mealTotalValue}>
                            {formatProtectedMealAmount(mealContractedTotalAmount)}
                          </Text>
                          <Text style={styles.mealTotalSub}>
                            실제 배부 기준 {formatProtectedMealAmount(mealDistributedTotalAmount)}
                          </Text>
                        </View>
                        <View style={styles.mealActionRow}>
                          <TouchableOpacity
                            style={styles.mealActionBtn}
                            onPress={() => mealUnlocked ? setMealUnlocked(false) : requestMealPassword('view')}
                          >
                            <Text style={styles.mealActionText}>{mealUnlocked ? '금액 숨기기' : '금액 보기'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.mealActionBtn} onPress={() => requestMealPassword('edit')}>
                            <Text style={styles.mealActionText}>수정</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.mealActionBtn} onPress={() => requestMealPassword('delete')}>
                            <Text style={[styles.mealActionText, { color: '#F04452' }]}>삭제</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>

            </View>

            <View style={styles.sectionGap} />
          </>
        )}

        {/* ── 리스트 섹션 ── */}
        <View
          style={styles.newListSection}
          onLayout={e => { listSectionY.current = e.nativeEvent.layout.y; }}
        >

          {/* 필터 탭 + 검색 */}
          <View style={styles.listControlRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterTabScroll}
              contentContainerStyle={styles.filterTabRow}
            >
                {listTabItems.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.filterTab, activeTab === tab.key && styles.filterTabActive]}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.filterTabText, activeTab === tab.key && styles.filterTabTextActive]}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1}
                    >
                      {tab.label} {formatAmountCard(tab.count)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
              onPress={openSearchModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.filterSearchButton}
            >
              <Ionicons name="search" size={22} color="#191F28" />
            </TouchableOpacity>
          </View>

          {filteredContributions.length > 0 ? (
            <>
              {currentPageContributions.map((contribution, index) => {
                const isRealItem = contribution.id &&
                  !String(contribution.id).includes('groom-') &&
                  !String(contribution.id).includes('bride-');
                const { displayCategory, displayDetail } = getRelationDisplay(
                  contribution.relation_category,
                  contribution.relation_detail
                );
                const isExpanded = expandedItemId === (contribution.id || index);
                const timeStr = (() => {
                  if (!contribution.created_at) return '';
                  const d = new Date(contribution.created_at);
                  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                })();

                const isEditing = editingItemId === contribution.id;
                const ticketCount = Number(contribution.ticket_count || 0);
                const sideKey = getMealContributionSide(contribution);
                const sideAccent = '#3182F6';
                const sideSoft = '#EEF5FF';
                const railImage = sideKey === 'bride' ? GUEST_CARD_ASSETS.brideRail : GUEST_CARD_ASSETS.groomRail;

                return (
                  <View
                    key={contribution.id || index}
                    onLayout={e => {
                      if (contribution.id) {
                        itemYPositions.current[contribution.id] = e.nativeEvent.layout.y;
                      }
                    }}
                    style={[
                      styles.flatItem,
                      { borderLeftColor: sideAccent, backgroundColor: sideKey === 'bride' ? '#FFFCFD' : '#FCFDFF' },
                      isEditing && styles.flatItemEditing
                    ]}
                  >
                    {isEditing ? (
                      /* ── 인라인 수정 폼 ── */
                      <View style={styles.inlineEditCard}>
                        {/* 성함 한 줄 */}
                        <View style={styles.inlineEditRow}>
                          <TextInput
                            style={[styles.inlineInput, { flex: 1 }]}
                            value={inlineEditData.guest_name}
                            onChangeText={t => setInlineEditData(p => ({ ...p, guest_name: t }))}
                            placeholder="성함"
                            placeholderTextColor="#C5CCD5"
                            autoFocus
                          />
                        </View>

                        {/* 금액 터치 칩 */}
                        <View style={styles.amountChipSection}>
                          {/* 현재 금액 표시 */}
                          <View style={styles.amountDisplayRow}>
                            <Text style={styles.amountDisplayText}>
                              {inlineEditData.amount > 0
                                ? `${inlineEditData.amount.toLocaleString()}원`
                                : '금액 선택'}
                            </Text>
                            <TouchableOpacity
                              style={styles.amountResetBtn}
                              onPress={() => setInlineEditData(p => ({ ...p, amount: 0 }))}
                            >
                              <Text style={styles.amountResetText}>정정</Text>
                            </TouchableOpacity>
                          </View>

                          {/* 빠른 설정 칩 (만원 단위 세팅) */}
                          <View style={styles.amountChipRow}>
                            {[30000, 50000, 70000, 100000, 150000, 200000].map(v => (
                              <TouchableOpacity
                                key={v}
                                style={[
                                  styles.amountChip,
                                  inlineEditData.amount === v && styles.amountChipActive,
                                ]}
                                onPress={() => setInlineEditData(p => ({ ...p, amount: v }))}
                              >
                                <Text style={[
                                  styles.amountChipText,
                                  inlineEditData.amount === v && styles.amountChipTextActive,
                                ]}>
                                  {v / 10000}만
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {/* 추가 칩 (+N만) */}
                          <View style={styles.amountChipRow}>
                            {[10000, 30000, 50000, 100000].map(v => (
                              <TouchableOpacity
                                key={`add-${v}`}
                                style={styles.amountAddChip}
                                onPress={() => setInlineEditData(p => ({ ...p, amount: (p.amount || 0) + v }))}
                              >
                                <Text style={styles.amountAddChipText}>+{v / 10000}만</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* 전화번호 */}
                        <View style={styles.inlineEditRow}>
                          <TextInput
                            style={[styles.inlineInput, { flex: 1 }]}
                            value={inlineEditData.guest_phone}
                            onChangeText={t => setInlineEditData(p => ({ ...p, guest_phone: formatPhone(t) }))}
                            placeholder="010-0000-0000 (선택)"
                            placeholderTextColor="#C5CCD5"
                            keyboardType="phone-pad"
                            maxLength={13}
                          />
                        </View>

                        {/* 측 칩 */}
                        <View style={styles.inlineChipRow}>
                          {['신랑측', '신부측'].map(cat => (
                            <TouchableOpacity
                              key={cat}
                              style={[styles.inlineChip, inlineEditData.relation_category === cat && styles.inlineChipActive]}
                              onPress={() => setInlineEditData(p => ({ ...p, relation_category: cat }))}
                            >
                              <Text style={[styles.inlineChipText, inlineEditData.relation_category === cat && styles.inlineChipTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                          ))}
                          <View style={{ width: 12 }} />
                          {['친구', '동료', '가족', '친척', '기타'].map(det => (
                            <TouchableOpacity
                              key={det}
                              style={[styles.inlineChip, inlineEditData.relation_detail === det && styles.inlineChipActive]}
                              onPress={() => setInlineEditData(p => ({ ...p, relation_detail: det }))}
                            >
                              <Text style={[styles.inlineChipText, inlineEditData.relation_detail === det && styles.inlineChipTextActive]}>{det}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* 저장 / 취소 */}
                        <View style={styles.inlineActRow}>
                          <TouchableOpacity
                            style={styles.inlineCancelBtn}
                            onPress={() => setEditingItemId(null)}
                          >
                            <Text style={styles.inlineCancelText}>취소</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.inlineSaveBtn}
                            onPress={() => handleSaveInlineEdit(contribution)}
                          >
                            <Text style={styles.inlineSaveText}>저장</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.flatGuestCard, { height: scaleGuestCard(238, 194) }]}>
                        <Image
                          source={railImage}
                          style={[styles.flatCardRailImage, { width: scaleGuestCard(56, 48) }]}
                          resizeMode="stretch"
                          fadeDuration={0}
                        />
                        <View style={[styles.flatCardBody, contribution.is_verified && styles.flatCardBodyConfirmed]}>
                          <Image
                            source={GUEST_CARD_ASSETS.pattern}
                            style={styles.flatCardPattern}
                            resizeMode="contain"
                            fadeDuration={0}
                          />
                          <View style={[styles.flatCardHeader, contribution.is_verified && styles.flatCardDimmed]}>
                            <View style={styles.flatCardHeaderLeft}>
                              <Text
                                style={[styles.flatCardName, { fontSize: scaleGuestFont(22, 16) }]}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1}
                                adjustsFontSizeToFit
                              >
                                {contribution.guest_name || '이름 없음'}
                              </Text>
                              <View style={styles.flatCardMetaRow}>
                                <Text
                                  style={[styles.flatCardSideText, { color: sideAccent, fontSize: scaleGuestFont(12, 10) }]}
                                  numberOfLines={1}
                                  maxFontSizeMultiplier={1}
                                >
                                  {displayCategory}
                                </Text>
                                <Text style={[styles.flatCardMetaDot, { fontSize: scaleGuestFont(12, 10) }]} maxFontSizeMultiplier={1}>·</Text>
                                <Text
                                  style={[styles.flatCardRelationText, { fontSize: scaleGuestFont(12, 10) }]}
                                  numberOfLines={1}
                                  maxFontSizeMultiplier={1}
                                >
                                  {displayDetail}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.flatCardHeaderRight}>
                              {!!timeStr && (
                                <Text style={[styles.flatCardTime, { fontSize: scaleGuestFont(12, 10) }]} maxFontSizeMultiplier={1}>
                                  {timeStr} 접수
                                </Text>
                              )}
                              {contribution.guest_phone && contribution.amount && (
                                contribution.alimtalk_sent ? (
                                  <View style={[styles.flatCardResendBadge, { backgroundColor: sideSoft }]}>
                                    <Ionicons name="checkmark-circle-outline" size={scaleGuestCard(14, 11)} color={sideAccent} />
                                    <Text
                                      style={[styles.flatCardResendText, { color: sideAccent, fontSize: scaleGuestFont(11, 9) }]}
                                      maxFontSizeMultiplier={1}
                                    >
                                      알림톡 발송완료
                                    </Text>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={[styles.flatCardResendBadge, { backgroundColor: sideSoft }]}
                                    onPress={() => handleResendAlimtalk(contribution)}
                                    disabled={resendingId === contribution.id}
                                    activeOpacity={0.78}
                                  >
                                    <Ionicons name="refresh-circle-outline" size={scaleGuestCard(14, 11)} color={sideAccent} />
                                    <Text
                                      style={[styles.flatCardResendText, { color: sideAccent, fontSize: scaleGuestFont(11, 9) }]}
                                      maxFontSizeMultiplier={1}
                                    >
                                      {resendingId === contribution.id ? '발송 중...' : '알림톡 재발송'}
                                    </Text>
                                  </TouchableOpacity>
                                )
                              )}
                            </View>
                          </View>

                          <View style={[styles.flatCardDottedLine, contribution.is_verified && styles.flatCardDimmed]} />

                          <View style={[styles.flatCardValueRow, contribution.is_verified && styles.flatCardDimmed]}>
                            <View style={styles.flatCardAmountSection}>
                              <Image
                                source={GUEST_CARD_ASSETS.cash}
                                style={[
                                  styles.flatCardCashIcon,
                                  {
                                    tintColor: sideAccent,
                                    width: scaleGuestCard(38, 26),
                                    height: scaleGuestCard(38, 26),
                                  },
                                ]}
                              />
                              <View style={styles.flatCardAmountTexts}>
                                <Text style={[styles.flatCardLabel, { fontSize: scaleGuestFont(12, 9) }]} maxFontSizeMultiplier={1}>부조금</Text>
                                <Text
                                  style={[
                                    styles.flatCardAmount,
                                    { fontSize: scaleGuestFont(23, 16) },
                                    !contribution.amount && styles.flatAmountEmpty,
                                  ]}
                                  numberOfLines={1}
                                  maxFontSizeMultiplier={1}
                                  adjustsFontSizeToFit
                                >
                                  {contribution.amount ? `${formatAmountCard(contribution.amount)}원` : '금액 미입력'}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.flatCardValueDivider} />

                            <View style={[styles.flatCardTicketBox, { backgroundColor: sideSoft }]}>
                              <Image
                                source={GUEST_CARD_ASSETS.ticket}
                                style={[
                                  styles.flatCardTicketIcon,
                                  {
                                    tintColor: sideAccent,
                                    width: scaleGuestCard(26, 18),
                                    height: scaleGuestCard(26, 18),
                                  },
                                ]}
                              />
                              <Text
                                style={[styles.flatCardTicketInlineText, { color: sideAccent, fontSize: scaleGuestFont(14, 11) }]}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1}
                                adjustsFontSizeToFit
                              >
                                식권 {formatAmountCard(ticketCount)}장
                              </Text>
                            </View>
                          </View>

                          {contribution.is_verified && (
                            <View style={styles.flatCardConfirmedLayer} pointerEvents="none">
                              <Image
                                source={GUEST_CARD_ASSETS.confirmedStamp}
                                style={styles.flatCardConfirmedStamp}
                                resizeMode="contain"
                                fadeDuration={0}
                              />
                            </View>
                          )}

                          <View style={[styles.flatCardBottomLine, contribution.is_verified && styles.flatCardDimmed]} />

                          {isRealItem && (
                            contribution.is_verified ? (
                              <View style={styles.flatCardConfirmedActionBox}>
                                <View style={styles.flatCardConfirmedGuide}>
                                  <Ionicons name="information-circle-outline" size={scaleGuestCard(16, 12)} color={sideAccent} />
                                  <Text
                                    style={[styles.flatCardConfirmedGuideText, { fontSize: scaleGuestFont(11, 9) }]}
                                    numberOfLines={1}
                                    maxFontSizeMultiplier={1}
                                  >
                                    확정 취소가 필요하신 경우 아래 버튼을 눌러주세요.
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={styles.flatCardCancelConfirmButton}
                                  onPress={() => handleToggleVerification(contribution)}
                                  activeOpacity={0.75}
                                >
                                  <Ionicons name="arrow-undo-outline" size={scaleGuestCard(15, 11)} color={sideAccent} />
                                  <Text style={[styles.flatCardActionText, { color: sideAccent, fontSize: scaleGuestFont(12, 10) }]}>
                                    확정 취소
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <View style={styles.flatCardActionRow}>
                                <TouchableOpacity
                                  style={[
                                    styles.flatCardActionButton,
                                    styles.flatCardConfirmButton,
                                  ]}
                                  onPress={() => handleToggleVerification(contribution)}
                                  activeOpacity={0.75}
                                >
                                  <Ionicons name="checkmark-circle-outline" size={scaleGuestCard(15, 11)} color={sideAccent} />
                                  <Text style={[styles.flatCardActionText, { color: sideAccent, fontSize: scaleGuestFont(12, 10) }]}>
                                    확정
                                  </Text>
                                </TouchableOpacity>
                                <>
                                  <TouchableOpacity
                                    style={styles.flatCardActionButton}
                                    onPress={() => handleEditContribution(contribution)}
                                    activeOpacity={0.75}
                                  >
                                    <Ionicons name="pencil-outline" size={scaleGuestCard(15, 11)} color="#4E5968" />
                                    <Text style={[styles.flatCardActionText, { fontSize: scaleGuestFont(12, 10) }]}>수정</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.flatCardActionButton, styles.flatCardDeleteButton]}
                                    onPress={() => handleDeleteContribution(contribution)}
                                    activeOpacity={0.75}
                                  >
                                    <Ionicons name="trash-outline" size={scaleGuestCard(15, 11)} color="#F04452" />
                                    <Text style={[styles.flatCardActionText, styles.flatCardDeleteText, { fontSize: scaleGuestFont(12, 10) }]}>삭제</Text>
                                  </TouchableOpacity>
                                </>
                              </View>
                            )
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <View style={styles.tossPagination}>
                  <TouchableOpacity
                    style={[styles.tossPrevButton, currentPage === 1 && styles.tossPageDisabled]}
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? '#E0E0E0' : '#3182F6'} />
                  </TouchableOpacity>
                  <Text style={styles.tossPageInfo}>{currentPage} / {totalPages}</Text>
                  <TouchableOpacity
                    style={[styles.tossNextButton, currentPage === totalPages && styles.tossPageDisabled]}
                    onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? '#E0E0E0' : '#3182F6'} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.tossEmptyState}>
              <View style={styles.tossEmptyIcon}>
                <Ionicons name="receipt-outline" size={32} color="#B0BEC5" />
              </View>
              <Text style={styles.tossEmptyTitle}>
                {searchQuery ? '검색 결과가 없어요' : '부조 내역이 없어요'}
              </Text>
              <Text style={styles.tossEmptySubtitle}>
                {searchQuery ? '다른 이름으로 검색해보세요' : '첫 번째 부조를 추가해보세요'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>


      {/* 토스 스타일 부조 추가 모달 */}
      {/* ── 부조 추가 바텀 시트 ── */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeBS(setAddModalVisible, bsAddFade, bsAddSlide)}
      >
        <KeyboardAvoidingView
          style={styles.bsOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[StyleSheet.absoluteFill, styles.bsBackdropAnim, { opacity: bsAddFade }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closeBS(setAddModalVisible, bsAddFade, bsAddSlide)} />
          </Animated.View>
          <Animated.View style={[styles.bsContainer, { transform: [{ translateY: bsAddSlide }] }]}>
            <View style={styles.bsHandle} />

            {/* 헤더 */}
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>부조 추가</Text>
              <TouchableOpacity onPress={() => closeBS(setAddModalVisible, bsAddFade, bsAddSlide)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#8B95A1" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ paddingHorizontal: 20 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 성함 */}
              <Text style={styles.bsLabel}>성함</Text>
              <TextInput
                style={styles.bsInput}
                placeholder="성함을 입력해주세요"
                value={newContribution.guest_name}
                onChangeText={(text) => setNewContribution(prev => ({ ...prev, guest_name: text }))}
                placeholderTextColor="#C5CCD5"
              />

              {/* 금액 */}
              <Text style={styles.bsLabel}>부조금</Text>
              <View style={styles.bsAmountRow}>
                <TextInput
                  style={[styles.bsInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="0"
                  value={newContribution.amount}
                  onChangeText={(text) => setNewContribution(prev => ({ ...prev, amount: formatAmountInput(text) }))}
                  keyboardType="numeric"
                  placeholderTextColor="#C5CCD5"
                />
                <Text style={styles.bsAmountUnit}>원</Text>
              </View>

              {/* 빠른 금액 */}
              <View style={styles.bsQuickAmounts}>
                {[30000, 50000, 100000, 200000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.bsQuickBtn}
                    onPress={() => setNewContribution(prev => ({ ...prev, amount: formatAmountInput(String(amt)) }))}
                  >
                    <Text style={styles.bsQuickBtnText}>+{amt >= 10000 ? (amt / 10000) + '만' : amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 측 */}
              <Text style={styles.bsLabel}>측</Text>
              <View style={styles.bsChipRow}>
                {['신랑측', '신부측'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.bsChip, newContribution.relation_category === cat && styles.bsChipActive]}
                    onPress={() => setNewContribution(prev => ({ ...prev, relation_category: cat }))}
                  >
                    <Text style={[styles.bsChipText, newContribution.relation_category === cat && styles.bsChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 관계 */}
              <Text style={styles.bsLabel}>관계</Text>
              <View style={styles.bsChipRow}>
                {['친구', '동료', '가족', '친척', '기타'].map((det) => (
                  <TouchableOpacity
                    key={det}
                    style={[styles.bsChip, newContribution.relation_detail === det && styles.bsChipActive]}
                    onPress={() => setNewContribution(prev => ({ ...prev, relation_detail: det }))}
                  >
                    <Text style={[styles.bsChipText, newContribution.relation_detail === det && styles.bsChipTextActive]}>{det}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* 저장 버튼 */}
            <View style={styles.bsSaveWrap}>
              <TouchableOpacity
                style={[styles.bsSaveBtn, addingContribution && { opacity: 0.6 }]}
                onPress={handleAddContribution}
                disabled={addingContribution}
                activeOpacity={0.85}
              >
                <Text style={styles.bsSaveBtnText}>{addingContribution ? '저장 중...' : '부조 추가'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 통계 바텀 시트 ── */}
      <Modal
        visible={statisticsModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeBS(setStatisticsModalVisible, bsStatFade, bsStatSlide)}
      >
        <View style={styles.bsOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.bsBackdropAnim, { opacity: bsStatFade }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closeBS(setStatisticsModalVisible, bsStatFade, bsStatSlide)} />
          </Animated.View>
          <Animated.View style={[styles.bsContainer, { maxHeight: '88%', transform: [{ translateY: bsStatSlide }] }]}>
            <View style={styles.bsHandle} />
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>부조 통계</Text>
              <TouchableOpacity onPress={() => closeBS(setStatisticsModalVisible, bsStatFade, bsStatSlide)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#8B95A1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
              {/* 총 요약 */}
              <View style={styles.tossStatSummaryCard}>
                <View style={styles.tossStatMainAmount}>
                  <Text style={styles.tossStatLabel}>총 부조금</Text>
                  <Text style={styles.tossStatBigValue}>
                    {formatAmount(contributions.reduce((sum, c) => sum + (c.amount || 0), 0))}
                  </Text>
                </View>
                <View style={styles.tossStatDivider} />
                <View style={styles.tossStatSubInfo}>
                  <View style={styles.tossStatInfoItem}>
                    <Text style={styles.tossStatSmallLabel}>총 건수</Text>
                    <Text style={styles.tossStatSmallValue}>{contributions.length}건</Text>
                  </View>
                  <View style={styles.tossStatInfoItem}>
                    <Text style={styles.tossStatSmallLabel}>평균 부조금</Text>
                    <Text style={styles.tossStatSmallValue}>
                      {formatAmount(contributions.length > 0 ? Math.round(contributions.reduce((sum, c) => sum + (c.amount || 0), 0) / contributions.length) : 0)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 금액대별 분포 */}
              <View style={styles.tossStatChartCard}>
                <Text style={styles.tossStatSectionTitle}>금액대별 분포</Text>
                <View style={styles.tossStatBars}>
                  {(() => {
                    const ranges = [
                      { label: '~5만', count: contributions.filter(c => c.amount < 50000).length },
                      { label: '5~10만', count: contributions.filter(c => c.amount >= 50000 && c.amount < 100000).length },
                      { label: '10~20만', count: contributions.filter(c => c.amount >= 100000 && c.amount < 200000).length },
                      { label: '20만~', count: contributions.filter(c => c.amount >= 200000).length },
                    ];
                    const maxCount = Math.max(...ranges.map(r => r.count), 1);
                    return ranges.map((range, index) => (
                      <View key={index} style={styles.tossStatBarContainer}>
                        <View style={styles.tossStatBarWrapper}>
                          <View style={[styles.tossStatBar, { height: `${(range.count / maxCount) * 100}%` }]} />
                          <Text style={styles.tossStatBarCount}>{range.count}</Text>
                        </View>
                        <Text style={styles.tossStatBarLabel}>{range.label}</Text>
                      </View>
                    ));
                  })()}
                </View>
              </View>

              {/* 확정 현황 */}
              <View style={styles.tossStatStatusCard}>
                <Text style={styles.tossStatSectionTitle}>확정 현황</Text>
                <View style={styles.tossStatProgressContainer}>
                  <View style={styles.tossStatProgressBar}>
                    <View style={[styles.tossStatProgressFill, { width: `${contributions.length > 0 ? (contributions.filter(c => c.is_verified).length / contributions.length * 100) : 0}%` }]} />
                  </View>
                  <View style={styles.tossStatProgressInfo}>
                    <View style={styles.tossStatProgressItem}>
                      <View style={[styles.tossStatDot, { backgroundColor: '#3182F6' }]} />
                      <Text style={styles.tossStatProgressLabel}>확정</Text>
                      <Text style={styles.tossStatProgressValue}>{contributions.filter(c => c.is_verified).length}건</Text>
                    </View>
                    <View style={styles.tossStatProgressItem}>
                      <View style={[styles.tossStatDot, { backgroundColor: '#E5E8EB' }]} />
                      <Text style={styles.tossStatProgressLabel}>미확정</Text>
                      <Text style={styles.tossStatProgressValue}>{contributions.filter(c => !c.is_verified).length}건</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 관계별 통계 */}
              <View style={styles.tossStatRelationCard}>
                <Text style={styles.tossStatSectionTitle}>관계별 통계</Text>
                <View style={styles.tossStatRelationList}>
                  {(() => {
                    const relationStats = {};
                    contributions.forEach(c => {
                      const key = c.relation_detail || '기타';
                      if (!relationStats[key]) relationStats[key] = { count: 0, amount: 0 };
                      relationStats[key].count++;
                      relationStats[key].amount += c.amount || 0;
                    });
                    return Object.entries(relationStats)
                      .sort((a, b) => b[1].amount - a[1].amount)
                      .map(([relation, s]) => (
                        <View key={relation} style={styles.tossStatRelationItem}>
                          <Text style={styles.tossStatRelationName}>{relation}</Text>
                          <View style={styles.tossStatRelationInfo}>
                            <Text style={styles.tossStatRelationCount}>{s.count}건</Text>
                            <Text style={styles.tossStatRelationAmount}>{formatAmount(s.amount)}</Text>
                          </View>
                        </View>
                      ));
                  })()}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ── 확정 관리 바텀 시트 ── */}
      <Modal
        visible={verifyManageModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeBS(setVerifyManageModalVisible, bsVmFade, bsVmSlide, () => setVerifyPage(0))}
      >
        <View style={styles.bsOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.bsBackdropAnim, { opacity: bsVmFade }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closeBS(setVerifyManageModalVisible, bsVmFade, bsVmSlide, () => setVerifyPage(0))} />
          </Animated.View>
          <Animated.View style={[styles.bsContainer, { maxHeight: '88%', transform: [{ translateY: bsVmSlide }] }]}>
            <View style={styles.bsHandle} />
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>확정 관리</Text>
              <TouchableOpacity onPress={() => closeBS(setVerifyManageModalVisible, bsVmFade, bsVmSlide, () => setVerifyPage(0))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#8B95A1" />
              </TouchableOpacity>
            </View>

            {/* 요약 카드: 확정 / 미확정 */}
            <View style={styles.vmSummaryRow}>
              <View style={styles.vmSummaryCard}>
                <Text style={styles.vmSummaryCount}>{contributions.filter(c => c.is_verified).length}건</Text>
                <Text style={styles.vmSummaryLabel}>확정</Text>
                <Text style={styles.vmSummaryAmount}>
                  {formatAmountCard(contributions.filter(c => c.is_verified).reduce((s, c) => s + (c.amount || 0), 0))}원
                </Text>
              </View>
              <View style={styles.vmSummarySep} />
              <View style={styles.vmSummaryCard}>
                <Text style={[styles.vmSummaryCount, { color: '#FF6B35' }]}>{contributions.filter(c => !c.is_verified).length}건</Text>
                <Text style={styles.vmSummaryLabel}>미확정</Text>
                <Text style={styles.vmSummaryAmount}>
                  {formatAmountCard(contributions.filter(c => !c.is_verified).reduce((s, c) => s + (c.amount || 0), 0))}원
                </Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
              {/* 미확정 목록 (5개씩 페이지네이션) */}
              {contributions.filter(c => !c.is_verified).length > 0 && (() => {
                const unverified = contributions.filter(c => !c.is_verified);
                const totalVP = Math.ceil(unverified.length / 5);
                const pageItems = unverified.slice(verifyPage * 5, verifyPage * 5 + 5);
                return (
                  <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
                    <View style={styles.vmListHeader}>
                      <Text style={styles.vmListTitle}>미확정 부조</Text>
                      <TouchableOpacity
                        style={styles.vmAllBtn}
                        onPress={() => showAlert({
                          title: '전체 확정',
                          message: '모든 미확정 부조를 확정하시겠어요?',
                          confirmText: '확정',
                          cancelText: '취소',
                          onConfirm: async () => {
                            for (const item of unverified) await toggleGuestBookVerification(item.id);
                            await loadEventData();
                            setVerifyPage(0);
                          },
                        })}
                      >
                        <Text style={styles.vmAllBtnText}>전체 확정</Text>
                      </TouchableOpacity>
                    </View>

                    {pageItems.map((item, idx) => (
                      <View key={item.id || idx} style={styles.vmItem}>
                        <View style={styles.vmAvatar}>
                          <Text style={styles.vmAvatarText}>{(item.guest_name || '이').charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.vmItemName}>{item.guest_name}</Text>
                          <Text style={styles.vmItemMeta}>{item.relation_detail || '관계 미지정'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={styles.vmItemAmount}>+{formatAmountCard(item.amount)}원</Text>
                          <TouchableOpacity
                            style={styles.vmConfirmBtn}
                            onPress={async () => { await toggleGuestBookVerification(item.id); await loadEventData(); }}
                          >
                            <Text style={styles.vmConfirmBtnText}>확정</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    {/* 페이지네이션 */}
                    {totalVP > 1 && (
                      <View style={styles.vmPagination}>
                        <TouchableOpacity
                          onPress={() => setVerifyPage(p => Math.max(0, p - 1))}
                          disabled={verifyPage === 0}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="chevron-back" size={20} color={verifyPage === 0 ? '#D5DADE' : '#3182F6'} />
                        </TouchableOpacity>
                        <Text style={styles.vmPageText}>{verifyPage + 1} / {totalVP}</Text>
                        <TouchableOpacity
                          onPress={() => setVerifyPage(p => Math.min(totalVP - 1, p + 1))}
                          disabled={verifyPage === totalVP - 1}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="chevron-forward" size={20} color={verifyPage === totalVP - 1 ? '#D5DADE' : '#3182F6'} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* 확정된 목록 */}
              {contributions.filter(c => c.is_verified).length > 0 && (
                <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                  <Text style={styles.vmListTitle}>확정 완료</Text>
                  {contributions.filter(c => c.is_verified).map((item, idx) => (
                    <View key={item.id || idx} style={styles.vmItem}>
                      <View style={[styles.vmAvatar, { backgroundColor: '#D6E8FF' }]}>
                        <Text style={[styles.vmAvatarText, { color: '#3182F6' }]}>{(item.guest_name || '이').charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vmItemName}>{item.guest_name}</Text>
                        <Text style={styles.vmItemMeta}>{item.relation_detail || '관계 미지정'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={[styles.vmItemAmount, { color: '#3182F6' }]}>+{formatAmountCard(item.amount)}원</Text>
                        <TouchableOpacity
                          style={styles.vmCancelBtn}
                          onPress={async () => { await toggleGuestBookVerification(item.id); await loadEventData(); }}
                        >
                          <Text style={styles.vmCancelBtnText}>취소</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* 토스 스타일 확정 모달 (Bottom Sheet) */}
      <Modal
        visible={verificationModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeBS(setVerificationModalVisible, bsVerifyFade, bsVerifySlide)}
      >
        <View style={styles.tossBottomSheetOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.bsBackdropAnim, { opacity: bsVerifyFade }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closeBS(setVerificationModalVisible, bsVerifyFade, bsVerifySlide)} />
          </Animated.View>
          <Animated.View style={[styles.tossBottomSheetContainer, { transform: [{ translateY: bsVerifySlide }] }]}>
            {/* 핸들바 */}
            <View style={styles.tossBottomSheetHandle} />
            
            {/* 제목 */}
            <Text style={styles.tossBottomSheetTitle}>
              {verificationModalData.contribution?.guest_name}님의 부조
            </Text>
            
            {/* 금액 정보 */}
            <View style={styles.tossBottomSheetAmountInfo}>
              <Text style={styles.tossBottomSheetAmount}>
                {formatAmount(verificationModalData.contribution?.amount || 0)}
              </Text>
              <Text style={styles.tossBottomSheetAmountLabel}>
                {(() => {
                  const contrib = verificationModalData.contribution;
                  if (!contrib) return '';
                  const { displayCategory, displayDetail } = getRelationDisplay(
                    contrib.relation_category,
                    contrib.relation_detail
                  );
                  return `${displayCategory} · ${displayDetail}`;
                })()}
              </Text>
            </View>

            {/* 설명 */}
            <Text style={styles.tossBottomSheetDescription}>
              {verificationModalData.isVerified 
                ? '확정을 취소하면 내역을 다시 수정하거나 삭제할 수 있습니다.'
                : '확정하면 내역을 더 이상 수정하거나 삭제할 수 없습니다. 정말 확정하시겠어요?'
              }
            </Text>
            
            {/* 액션 버튼들 */}
            <TouchableOpacity
              style={[
                styles.tossBottomSheetActionButton,
                verificationModalData.isVerified ? styles.tossBottomSheetDangerButton : styles.tossBottomSheetPrimaryButton
              ]}
              onPress={executeVerificationToggle}
            >
              <Text style={[
                styles.tossBottomSheetActionButtonText,
                verificationModalData.isVerified ? styles.tossBottomSheetDangerButtonText : styles.tossBottomSheetPrimaryButtonText
              ]}>
                {verificationModalData.isVerified ? '확정 취소' : '확정하기'}
              </Text>
            </TouchableOpacity>
            
            {/* 취소 버튼 */}
            <TouchableOpacity
              style={styles.tossBottomSheetCancelButton}
              onPress={() => closeBS(setVerificationModalVisible, bsVerifyFade, bsVerifySlide)}
            >
              <Text style={styles.tossBottomSheetCancelText}>취소</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* 검색 모달 */}
      <Modal
        visible={searchModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelSearch}
        onShow={handleModalShow}
      >
        <KeyboardAvoidingView 
          style={styles.searchModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.searchModalContainer, { paddingBottom: insets.bottom }]}>
            {/* 헤더 */}
            <View style={styles.searchModalHeader}>
              <TouchableOpacity onPress={cancelSearch} style={styles.searchModalCloseButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.searchModalTitle}>부조 검색</Text>
              <TouchableOpacity onPress={applySearch} style={styles.searchModalApplyButton}>
                <Text style={styles.searchModalApplyText}>완료</Text>
              </TouchableOpacity>
            </View>

            {/* 검색 입력 */}
            <View style={styles.searchModalInputContainer}>
              <Ionicons name="search" size={20} color={Colors.gray400} style={styles.searchModalInputIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchModalInput}
                placeholder="이름으로 검색해주세요"
                value={tempSearchQuery}
                onChangeText={setTempSearchQuery}
                editable={inputEditable}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                onSubmitEditing={applySearch}
                blurOnSubmit={false}
                onFocus={() => {
                  console.log('✅ TextInput onFocus 발생 - 키보드 활성화됨');
                  keyboardActivated.current = true;
                }}
                onBlur={() => {
                  console.log('❌ TextInput onBlur 발생 - 키보드 비활성화됨');
                  keyboardActivated.current = false;
                }}
                onLayout={() => console.log('📏 TextInput onLayout 발생 - 렌더링 완료')}
              />
              {tempSearchQuery && (
                <TouchableOpacity onPress={() => setTempSearchQuery('')} style={styles.searchModalClearButton}>
                  <Ionicons name="close-circle" size={20} color={Colors.gray400} />
                </TouchableOpacity>
              )}
            </View>

            {/* 검색 결과 미리보기 */}
            <View style={styles.searchModalPreview}>
              <Text style={styles.searchModalPreviewTitle}>
                검색 결과 ({(() => {
                  const filteredCount = contributions.filter(c => 
                    c.guest_name?.toLowerCase().includes(tempSearchQuery.toLowerCase())
                  ).length;
                  // console.log(`🔍 검색 결과 개수: ${filteredCount}개, 검색어: "${tempSearchQuery}"`);
                  return filteredCount;
                })()}명)
              </Text>
              
              <ScrollView style={styles.searchModalPreviewList} showsVerticalScrollIndicator={false}>
                {tempSearchQuery ? (
                  contributions
                    .filter(c => c.guest_name?.toLowerCase().includes(tempSearchQuery.toLowerCase()))
                    .slice(0, 5)
                    .map((contribution, index) => (
                    <View key={contribution.id || index} style={styles.searchModalPreviewItem}>
                      <View style={styles.searchModalPreviewInfo}>
                        <Text style={styles.searchModalPreviewName}>{contribution.guest_name}</Text>
                        <Text style={styles.searchModalPreviewRelation}>
                          {(() => {
                            const { displayCategory, displayDetail } = getRelationDisplay(
                              contribution.relation_category,
                              contribution.relation_detail
                            );
                            return `${displayCategory} · ${displayDetail}`;
                          })()}
                        </Text>
                      </View>
                      <Text style={styles.searchModalPreviewAmount}>
                        {formatAmount(contribution.amount || 0)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.searchModalEmptyState}>
                    <Ionicons name="search" size={48} color={Colors.gray300} />
                    <Text style={styles.searchModalEmptyText}>검색어를 입력해주세요</Text>
                    <Text style={styles.searchModalEmptySubtext}>이름으로 부조 내역을 찾을 수 있어요</Text>
                  </View>
                )}
                  
                {tempSearchQuery && contributions.filter(c => 
                  c.guest_name?.toLowerCase().includes(tempSearchQuery.toLowerCase())
                ).length === 0 && (
                  <View style={styles.searchModalNoResults}>
                    <Ionicons name="search" size={48} color={Colors.gray300} />
                    <Text style={styles.searchModalNoResultsText}>검색 결과가 없어요</Text>
                    <Text style={styles.searchModalNoResultsSubtext}>다른 이름으로 검색해보세요</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 식대 정산 비밀번호 확인 ── */}
      <Modal
        visible={mealPasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMealPasswordModal}
      >
        <KeyboardAvoidingView
          style={styles.centerModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.centerModalCard}>
            <View style={styles.centerModalTopRow}>
              <View style={styles.centerModalIcon}>
                <Ionicons name="shield-checkmark" size={23} color="#3182F6" />
              </View>
              <TouchableOpacity
                style={styles.centerModalClose}
                onPress={closeMealPasswordModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#8B95A1" />
              </TouchableOpacity>
            </View>
            <Text style={styles.centerModalTitle}>주최자 확인</Text>
            <Text style={styles.centerModalDesc}>
              민감한 식대 정보라 본인 확인 후 보여드릴게요.
            </Text>
            <View style={styles.passwordHintRow}>
              <Ionicons name="phone-portrait-outline" size={15} color="#8B95A1" />
              <Text style={styles.passwordHintText}>휴대폰 번호 뒤 4자리</Text>
            </View>
            <Animated.View
              style={[
                styles.passwordInputWrap,
                {
                  transform: [
                    {
                      translateX: mealPasswordShake.interpolate({
                        inputRange: [-1, 1],
                        outputRange: [-9, 9],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, mealPasswordError && styles.passwordInputError]}
                value={mealPassword}
                onChangeText={(text) => {
                  setMealPassword(text.replace(/[^0-9]/g, '').slice(0, 4));
                  if (mealPasswordError) setMealPasswordError('');
                }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                placeholder="••••"
                placeholderTextColor="#C5CCD5"
                autoFocus
                onSubmitEditing={handleConfirmMealPassword}
              />
            </Animated.View>
            {!!mealPasswordError && (
              <Text style={styles.passwordErrorText}>{mealPasswordError}</Text>
            )}
            <View style={styles.centerModalActions}>
              <TouchableOpacity
                style={styles.centerModalCancel}
                onPress={closeMealPasswordModal}
              >
                <Text style={styles.centerModalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.centerModalConfirm}
                onPress={handleConfirmMealPassword}
              >
                <Text style={styles.centerModalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 식대 정산 입력/수정 ── */}
      <Modal
        visible={mealEditVisible}
        transparent
        animationType="none"
        onRequestClose={closeMealEditModal}
      >
        <KeyboardAvoidingView
          style={styles.bsOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[StyleSheet.absoluteFill, styles.bsBackdropAnim, { opacity: bsMealFade }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeMealEditModal} />
          </Animated.View>
          <Animated.View style={[styles.bsContainer, { transform: [{ translateY: bsMealSlide }] }]}>
            <View style={styles.bsHandle} />
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>식대 정산 정보</Text>
              <TouchableOpacity onPress={closeMealEditModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#8B95A1" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ paddingHorizontal: 20 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.bsLabel}>식권 1장당 식대</Text>
              <View style={styles.bsAmountRow}>
                <TextInput
                  style={[styles.bsInput, { flex: 1, marginBottom: 0 }]}
                  value={mealForm.price}
                  onChangeText={(text) => {
                    setMealForm(prev => ({ ...prev, price: formatAmountInput(text) }));
                    if (mealFormError) setMealFormError('');
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#C5CCD5"
                />
                <Text style={styles.bsAmountUnit}>원</Text>
              </View>
              <Text style={styles.bsLabel}>전체 계약 식권 수</Text>
              <View style={styles.bsAmountRow}>
                <TextInput
                  style={[styles.bsInput, { flex: 1, marginBottom: 0 }]}
                  value={mealForm.contractedCount}
                  onChangeText={(text) => {
                    setMealForm(prev => ({ ...prev, contractedCount: formatAmountInput(text) }));
                    if (mealFormError) setMealFormError('');
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#C5CCD5"
                />
                <Text style={styles.bsAmountUnit}>장</Text>
              </View>
              <View style={styles.mealSideInputRow}>
                <View style={styles.mealSideInputCol}>
                  <Text style={styles.bsLabel}>신랑측 배정</Text>
                  <View style={styles.bsAmountRow}>
                    <TextInput
                      style={[styles.bsInput, { flex: 1, marginBottom: 0 }]}
                      value={mealForm.groomCount}
                      onChangeText={(text) => {
                        setMealForm(prev => ({ ...prev, groomCount: formatAmountInput(text) }));
                        if (mealFormError) setMealFormError('');
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#C5CCD5"
                    />
                    <Text style={styles.bsAmountUnit}>장</Text>
                  </View>
                </View>
                <View style={styles.mealSideInputCol}>
                  <Text style={styles.bsLabel}>신부측 배정</Text>
                  <View style={styles.bsAmountRow}>
                    <TextInput
                      style={[styles.bsInput, { flex: 1, marginBottom: 0 }]}
                      value={mealForm.brideCount}
                      onChangeText={(text) => {
                        setMealForm(prev => ({ ...prev, brideCount: formatAmountInput(text) }));
                        if (mealFormError) setMealFormError('');
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#C5CCD5"
                    />
                    <Text style={styles.bsAmountUnit}>장</Text>
                  </View>
                </View>
              </View>
              {!!mealFormError && (
                <Text style={styles.mealFormErrorText}>{mealFormError}</Text>
              )}
              <View style={styles.mealPreviewBox}>
                <Text style={styles.mealPreviewLabel}>예상 청구 식대</Text>
                <Text style={styles.mealPreviewValue}>
                  {formatAmount(
                    (parseInt(String(mealForm.price || '').replace(/[^0-9]/g, ''), 10) || 0) *
                    (parseInt(String(mealForm.contractedCount || '').replace(/[^0-9]/g, ''), 10) || 0)
                  )}
                </Text>
                <Text style={styles.mealPreviewSub}>
                  신랑측/신부측 배정 합계 {
                    formatAmountCard(
                      (parseInt(String(mealForm.groomCount || '').replace(/[^0-9]/g, ''), 10) || 0) +
                      (parseInt(String(mealForm.brideCount || '').replace(/[^0-9]/g, ''), 10) || 0)
                    )
                  }장
                </Text>
              </View>
            </ScrollView>
            <View style={styles.bsSaveWrap}>
              <TouchableOpacity
                style={[styles.bsSaveBtn, savingMealSettlement && { opacity: 0.6 }]}
                onPress={handleSaveMealSettlement}
                disabled={savingMealSettlement}
              >
                <Text style={styles.bsSaveBtnText}>{savingMealSettlement ? '저장 중...' : '저장'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 하객 접수 바텀시트 ── */}
      <Modal
        visible={sideSelectVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeBS(setSideSelectVisible, bsSideFade, bsSideSlide)}
      >
        <View style={styles.bsOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.bsBackdropAnim, { opacity: bsSideFade }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closeBS(setSideSelectVisible, bsSideFade, bsSideSlide)} />
          </Animated.View>
          <Animated.View style={[styles.bsContainer, { transform: [{ translateY: bsSideSlide }] }]}>
            <View style={styles.bsHandle} />

            {/* 헤더 */}
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>하객 접수대 선택</Text>
              <TouchableOpacity onPress={() => closeBS(setSideSelectVisible, bsSideFade, bsSideSlide)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#8B95A1" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sideSelectDesc}>접수대 선택 후 종이 배경 템플릿을 고를 수 있어요</Text>

            {/* 접수대 선택 영역 — 튜토리얼 스포트라이트 대상 */}
            <View ref={sideSelectRowsRef} collapsable={false}>
              {/* 신랑측 행 */}
              <TouchableOpacity
                style={styles.sideRow}
                onPress={() => {
                  if (tutorialStep?.id === 'me_side_select') tutorialAdvance();
                  closeBS(setSideSelectVisible, bsSideFade, bsSideSlide, () => {
                    setTimeout(() => navigation.navigate('GuestWriting', { event, side: 'groom' }), 50);
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sideRowMark, { backgroundColor: '#EBF3FF' }]}>
                  <Text style={[styles.sideRowMarkText, { color: '#3182F6' }]}>GROOM</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sideRowTitle}>신랑측 접수대</Text>
                  <Text style={styles.sideRowSub}>신랑 가족 · 친구 · 동료 하객</Text>
                </View>
                <View style={styles.sideRowAction}>
                  <Text style={styles.sideRowActionText}>선택</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.sideRowDivider} />

              {/* 신부측 행 */}
              <TouchableOpacity
                style={styles.sideRow}
                onPress={() => {
                  if (tutorialStep?.id === 'me_side_select') tutorialAdvance();
                  closeBS(setSideSelectVisible, bsSideFade, bsSideSlide, () => {
                    setTimeout(() => navigation.navigate('GuestWriting', { event, side: 'bride' }), 50);
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sideRowMark, { backgroundColor: '#FFF0F6' }]}>
                  <Text style={[styles.sideRowMarkText, { color: '#EC4899' }]}>BRIDE</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sideRowTitle, { color: '#EC4899' }]}>신부측 접수대</Text>
                  <Text style={styles.sideRowSub}>신부 가족 · 친구 · 동료 하객</Text>
                </View>
                <View style={styles.sideRowAction}>
                  <Text style={styles.sideRowActionText}>선택</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </Animated.View>

          {/* 튜토리얼 오버레이 — 하객 접수대 선택 바텀시트 내부 */}
          <TutorialOverlay scope="sideSelectModal" />
        </View>
      </Modal>

      {/* 공통 커스텀 Alert (iOS/안드 통일) */}
      <SimpleModal {...alertProps} />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flex1: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  
  // 로딩 및 에러
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 토스 스타일 헤더
  tossHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tossHeaderTop: {
    marginBottom: 8,
  },
  tossTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tossHeaderImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  tossHeaderImage: {
    width: '100%',
    height: '100%',
  },
  tossTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#191F28',
    letterSpacing: -0.3,
  },
  tossSubtitle: {
    fontSize: 15,
    color: '#6B7684',
    marginBottom: 4,
    fontWeight: '500',
  },
  tossLocation: {
    fontSize: 15,
    color: '#6B7684',
    fontWeight: '400',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 상태 섹션
  statusSection: {
    backgroundColor: Colors.white,
    padding: 20,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeStatus: {
    backgroundColor: Colors.success,
  },
  completedStatus: {
    backgroundColor: Colors.gray500,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  
  // ── 히어로 섹션 ─────────────────────────────────
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroEventName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B95A1',
    textDecorationLine: 'underline',
  },
  heroStatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    backgroundColor: '#FFFFFF',
  },
  heroStatBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4E5968',
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#191F28',
    letterSpacing: -1.5,
    marginBottom: 24,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  heroBtnGray: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnGrayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4E5968',
  },
  heroBtnBlue: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#3182F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3182F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBtnBlueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unverifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  unverifiedIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unverifiedSub: {
    fontSize: 12,
    color: '#8B95A1',
    marginBottom: 2,
  },
  unverifiedMain: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191F28',
  },

  // 섹션 구분
  sectionGap: {
    height: 8,
    backgroundColor: '#F2F4F6',
  },
  weddingInfoSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  venueCompactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    padding: 14,
  },
  venueCompactIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueCompactTextBox: {
    flex: 1,
    minWidth: 0,
  },
  venueCompactLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B95A1',
    marginBottom: 3,
  },
  venueCompactTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#191F28',
  },
  venueCompactSub: {
    fontSize: 12,
    color: '#6B7684',
    marginTop: 5,
  },
  venueToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  venueToggleButtonActive: {
    backgroundColor: '#191F28',
    borderColor: '#191F28',
  },
  venueToggleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6B7684',
  },
  venueToggleTextActive: {
    color: '#FFFFFF',
  },
  venueToggleRow: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  venueToggleIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueToggleRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#4E5968',
  },
  venueDetailBox: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  venueDetailRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  venueDetailLabel: {
    width: 52,
    fontSize: 12,
    fontWeight: '800',
    color: '#8B95A1',
  },
  venueDetailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#4E5968',
    lineHeight: 18,
  },
  mealSettlementCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    padding: 16,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  mealHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F2F4F6',
  },
  mealModeToggleText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6B7684',
  },
  mealSwitchTrack: {
    width: 34,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#D1D6DB',
    padding: 2,
    justifyContent: 'center',
  },
  mealSwitchTrackOn: {
    backgroundColor: '#3182F6',
  },
  mealSwitchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  mealSwitchThumbOn: {
    transform: [{ translateX: 14 }],
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191F28',
  },
  mealSub: {
    fontSize: 12,
    color: '#8B95A1',
    marginTop: 4,
  },
  mealLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F2F4F6',
  },
  mealLockText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B95A1',
  },
  mealLockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFF',
    padding: 14,
  },
  mealLockedIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191F28',
    lineHeight: 20,
  },
  mealLockedSub: {
    fontSize: 12,
    color: '#8B95A1',
    marginTop: 3,
  },
  mealSummaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  mealSummaryItem: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    padding: 14,
  },
  mealSummaryLabel: {
    fontSize: 12,
    color: '#8B95A1',
    fontWeight: '700',
    marginBottom: 6,
  },
  mealSummaryValue: {
    fontSize: 17,
    color: '#191F28',
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  mealProtectedValue: {
    fontSize: 15,
    color: '#8B95A1',
    letterSpacing: 0,
  },
  mealTotalBox: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#191F28',
    padding: 16,
  },
  mealTotalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '700',
    marginBottom: 6,
  },
  mealTotalValue: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  mealTotalSub: {
    marginTop: 7,
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
    fontWeight: '700',
  },
  mealTicketSplitBox: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#E8F1FF',
    padding: 12,
    gap: 10,
  },
  mealTicketSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTicketSplitLabel: {
    width: 48,
    fontSize: 12,
    fontWeight: '900',
    color: '#3182F6',
  },
  mealTicketSplitValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#4E5968',
  },
  mealTicketSplitDelta: {
    fontSize: 12,
    fontWeight: '900',
    color: '#191F28',
  },
  mealCompactLockBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  mealCompactLockText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#8B95A1',
  },
  mealActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  mealActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4E5968',
  },

  // ── 새 리스트 섹션 ────────────────────────────
  newListSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  listControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterDropdownText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191F28',
  },
  filterTabScroll: {
    flex: 1,
  },
  filterTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingRight: 4,
  },
  filterTab: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F2F4F6',
  },
  filterTabActive: {
    backgroundColor: '#191F28',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B95A1',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterSearchButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // 플랫 리스트 아이템
  flatItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'center',
    width: '96%',
    maxWidth: 680,
    marginHorizontal: 0,
    marginVertical: 4,
    paddingHorizontal: 0,
    borderRadius: 18,
    overflow: 'visible',
    position: 'relative',
  },
  flatGuestCard: {
    width: '100%',
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'stretch',
  },
  flatCardRailImage: {
    height: '100%',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    zIndex: 2,
  },
  flatCardBody: {
    flex: 1,
    marginLeft: -8,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#E5E8EF',
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  flatCardBodyConfirmed: {
    paddingBottom: 6,
  },
  flatCardPattern: {
    position: 'absolute',
    right: -14,
    bottom: 30,
    width: 138,
    height: 138,
    opacity: 0.5,
  },
  flatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 44,
  },
  flatCardHeaderLeft: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 7,
  },
  flatCardHeaderRight: {
    alignItems: 'flex-end',
    gap: 5,
    minWidth: 112,
  },
  flatCardName: {
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '800',
    color: '#050B1A',
    letterSpacing: 0,
  },
  flatCardMetaRow: {
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flatCardSideText: {
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '800',
  },
  flatCardMetaDot: {
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '700',
    color: '#8B95A1',
  },
  flatCardRelationText: {
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '700',
    color: '#4E5968',
  },
  flatCardTime: {
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '700',
    color: '#505766',
  },
  flatCardResendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9,
    backgroundColor: '#F1F5FB',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  flatCardResendText: {
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '800',
  },
  flatCardDottedLine: {
    marginTop: 9,
    borderTopWidth: 2,
    borderStyle: 'dotted',
    borderColor: '#D7DCE4',
  },
  flatCardValueRow: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  flatCardAmountSection: {
    flex: 0.82,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  flatCardCashIcon: {
    flexShrink: 0,
  },
  flatCardLabel: {
    color: '#5B6472',
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '700',
  },
  flatCardAmountTexts: {
    flex: 1,
    minWidth: 0,
  },
  flatCardAmount: {
    marginTop: 1,
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '800',
    color: '#050B1A',
    letterSpacing: 0,
  },
  flatCardValueDivider: {
    width: 1,
    height: 50,
    marginLeft: 8,
    marginRight: 12,
    backgroundColor: '#E0E3E8',
  },
  flatCardTicketBox: {
    width: 112,
    height: 40,
    borderRadius: 11,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  flatCardTicketIcon: {
    flexShrink: 0,
    zIndex: 1,
  },
  flatCardTicketInlineText: {
    flex: 1,
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '800',
    zIndex: 1,
  },
  flatCardDimmed: {
    opacity: 0.26,
  },
  flatCardConfirmedLayer: {
    position: 'absolute',
    left: '0%',
    right: '0%',
    top: -6,
    bottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  flatCardConfirmedStamp: {
    width: '145%',
    height: '145%',
    zIndex: 21,
  },
  flatCardBottomLine: {
    height: 1,
    backgroundColor: '#E6E9EF',
    marginBottom: 10,
  },
  flatCardActionRow: {
    flexDirection: 'row',
    gap: 8,
    height: 38,
    flexShrink: 0,
  },
  flatCardActionButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D0DA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  flatCardConfirmButton: {
    borderColor: '#94B8EA',
    backgroundColor: '#F2F7FF',
  },
  flatCardDeleteButton: {
    borderColor: '#FF8B95',
  },
  flatCardActionText: {
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '800',
    color: '#5B6472',
  },
  flatCardDeleteText: {
    color: '#F04452',
  },
  flatCardConfirmedActionBox: {
    height: 38,
    marginTop: 'auto',
    marginBottom: -2,
    borderRadius: 9,
    backgroundColor: '#F3F7FC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  flatCardConfirmedGuide: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flatCardConfirmedGuideText: {
    flex: 1,
    minWidth: 0,
    fontFamily: GUEST_CARD_FONT_FAMILY,
    fontWeight: '700',
    color: '#5B6472',
  },
  flatCardCancelConfirmButton: {
    height: 28,
    minWidth: 112,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3182F6',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
  },
  flatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E8EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  flatAvatarVerified: {
    backgroundColor: '#D6E8FF',
  },
  flatAvatarText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#4E5968',
  },
  flatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 3,
  },
  flatName: {
    fontSize: 23,
    fontWeight: '900',
    color: '#191F28',
    flexShrink: 1,
  },
  flatSidePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  flatSidePillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  flatMeta: {
    fontSize: 15,
    color: '#8B95A1',
    fontWeight: '800',
    marginTop: 4,
  },
  flatPhone: {
    fontSize: 12,
    color: '#3182F6',
    fontWeight: '700',
    marginTop: 4,
  },
  flatTicketBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  flatTicketBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  alimtalkBadge: {
    backgroundColor: '#FEE500',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  alimtalkBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3A1D00',
  },
  // 알림톡 전용 영역 (카드 하단)
  alimtalkRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
  },
  // 재발송 — 액션 버튼 (검정 bg + 카카오 노랑 텍스트로 임팩트)
  alimtalkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191F28',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  alimtalkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEE500',
    letterSpacing: -0.2,
  },
  alimtalkSentBadge: {
    backgroundColor: '#E8F3FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  alimtalkSentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3182F6',
  },
  flatAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.4,
  },
  flatAmountEmpty: {
    color: '#B0BEC5',
    fontWeight: '700',
    fontSize: 13,
  },
  flatStatus: {
    fontSize: 12,
    color: '#8B95A1',
    fontWeight: '500',
  },
  flatStatusDone: {
    color: '#3182F6',
  },

  // 플랫 아이템 액션 버튼 (탭 시 펼침)
  flatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 0,
  },
  flatActBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
  },
  flatActBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4E5968',
  },
  flatActSep: {
    width: 8,
  },

  // ── 풀너비 액션 버튼 ──────────────────────────────
  flatItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  flatActBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flatActBtnFull: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
  },
  flatActBtnFullConfirm: {
    backgroundColor: '#EBF3FF',
  },
  flatActBtnFullText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4E5968',
  },
  flatActionIcon: {
    width: 17,
    height: 17,
  },
  flatActBtnDivider: {
    width: 1,
    backgroundColor: '#E5E8EB',
    marginVertical: 8,
  },

  // ── 인라인 수정 ──────────────────────────────────
  flatItemEditing: {
    backgroundColor: '#F8F9FA',
    width: '96%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  inlineEditCard: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    padding: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  inlineEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inlineInput: {
    height: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#191F28',
  },
  inlineAmountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineAmountUnit: {
    fontSize: 13,
    color: '#4E5968',
    fontWeight: '500',
  },

  // ── 금액 터치 칩 ──────────────────────────────────
  amountChipSection: {
    marginBottom: 12,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  amountDisplayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191F28',
  },
  amountResetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
  },
  amountResetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B95A1',
  },
  amountChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  amountChip: {
    flexGrow: 1,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amountChipActive: {
    backgroundColor: '#EBF3FF',
    borderColor: '#3182F6',
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E5968',
  },
  amountChipTextActive: {
    color: '#3182F6',
  },
  amountAddChip: {
    flexGrow: 1,
    minWidth: 82,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#D1D6DB',
  },
  amountAddChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333D4B',
  },

  inlineChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  inlineChip: {
    flexGrow: 1,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  inlineChipActive: {
    backgroundColor: '#EBF3FF',
    borderColor: '#3182F6',
  },
  inlineChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B95A1',
  },
  inlineChipTextActive: {
    color: '#3182F6',
    fontWeight: '600',
  },
  inlineActRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  inlineCancelBtn: {
    minWidth: 96,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
  },
  inlineCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B95A1',
  },
  inlineSaveBtn: {
    minWidth: 112,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#3182F6',
  },
  inlineSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── 총 부조금 요약 카드 ─────────────────────────
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B95A1',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#191F28',
    letterSpacing: -1,
  },
  summaryDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F2F4F6',
    marginVertical: 18,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryStatSep: {
    width: 1,
    backgroundColor: '#E5E8EB',
    marginHorizontal: 8,
  },
  summaryStatValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#191F28',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#8B95A1',
    fontWeight: '500',
  },

  // ── 액션 버튼 3개 ────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#191F28',
    textAlign: 'center',
  },

  // (구형 스타일 호환)
  tossMainCard: { backgroundColor: 'white', margin: 16, borderRadius: 20, padding: 24 },
  tossMainAmount: { alignItems: 'center', marginBottom: 24 },
  tossAmountLabel: { fontSize: 16, color: '#6B7684', marginBottom: 8, fontWeight: '500' },
  tossAmountValue: { fontSize: 26, fontWeight: '700', color: '#191F28' },
  tossStatsRow: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16 },
  tossStatItem: { flex: 1, alignItems: 'center' },
  tossStatValue: { fontSize: 18, fontWeight: '600', color: '#191F28', marginBottom: 4 },
  tossStatLabel: { fontSize: 13, color: '#6B7684', fontWeight: '500' },
  tossDivider: { width: 1, backgroundColor: '#E5E8EB', marginHorizontal: 16 },
  tossActionGrid: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  tossActionButton: { backgroundColor: 'white', flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 10 },
  tossActionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tossActionImageContainer: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F8F9FA' },
  tossActionImage: { width: '100%', height: '100%' },
  tossActionText: { fontSize: 14, fontWeight: '600', color: '#191F28', textAlign: 'center' },
  
  // 하단 고정 부조 추가 버튼
  addBtnWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  addBtnFixed: {
    backgroundColor: '#3182F6',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3182F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  addBtnFixedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // 하객 접수 바텀시트
  sideSelectDesc: {
    fontSize: 13,
    color: '#8B95A1',
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: -4,
  },
  sideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    gap: 12,
  },
  sideRowMark: {
    width: 58,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideRowMarkText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  sideRowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191F28',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  sideRowSub: {
    fontSize: 13,
    color: '#8B95A1',
    letterSpacing: -0.2,
  },
  sideRowDivider: {
    height: 10,
  },
  sideRowAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F2F4F6',
  },
  sideRowActionText: {
    fontSize: 12,
    color: '#4E5968',
    fontWeight: '800',
  },

  // 디지털 방명록 아이콘 박스
  guestbookIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 디지털 방명록 현황 카드
  guestbookCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  guestbookCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  guestbookCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  guestbookStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestbookStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  guestbookStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191F28',
  },
  guestbookStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  guestbookStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E5EA',
  },
  guestbookRecentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  guestbookRecentName: {
    fontSize: 14,
    color: '#3C3C43',
    fontWeight: '500',
  },
  guestbookRecentAmount: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // 토스 스타일 리스트 섹션
  tossListSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  tossListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tossListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#191F28',
  },
  tossListCount: {
    fontSize: 15,
    color: '#6B7684',
    fontWeight: '500',
  },
  // 토스 스타일 탭
  tossTabs: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tossTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tossTabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tossTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7684',
  },
  tossTabTextActive: {
    color: '#191F28',
  },
  
  // 토스 스타일 정렬 버튼
  tossSortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tossSortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  tossSortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tossSortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7684',
  },
  tossSortButtonTextActive: {
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1C1D',
  },
  sectionCount: {
    fontSize: 16,
    color: '#8B95A1',
    fontWeight: '500',
  },
  contributionsList: {
    gap: 0,
  },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F7',
    borderRadius: 8,
    marginBottom: 4,
  },
  contributionInfo: {
    flex: 1,
    paddingRight: 12,
  },
  contributorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1B1C1D',
    marginBottom: 4,
  },
  contributionDate: {
    fontSize: 14,
    color: '#8B95A1',
    fontWeight: '500',
  },
  contributionAmount: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 100,
  },
  contributionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  actionButtonToss: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F7F8FA',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#4E5968',
    fontWeight: '600',
  },
  actionButtonTextDelete: {
    fontSize: 13,
    color: '#F04452',
    fontWeight: '600',
  },
  actionSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E8EB',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1C1D',
    textAlign: 'right',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // 토스 스타일 페이지네이션
  tossPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  tossPrevButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tossNextButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tossPageDisabled: {
    backgroundColor: '#F1F3F4',
    opacity: 0.5,
  },
  tossPageInfo: {
    fontSize: 14,
    color: '#6B7684',
    fontWeight: '500',
  },
  
  // 토스 스타일 빈 상태
  tossEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  tossEmptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tossEmptyTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#191F28',
    textAlign: 'center',
  },
  tossEmptySubtitle: {
    fontSize: 14,
    color: '#6B7684',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // 경조사 정보
  eventInfoSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 60,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },

  // 토스 스타일 검색바
  tossSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  tossSearchText: {
    flex: 1,
    fontSize: 15,
    color: '#B0BEC5',
    fontWeight: '400',
  },
  tossSearchActive: {
    color: '#191F28',
    fontWeight: '500',
  },

  // 토스 스타일 리스트
  tossList: {
    gap: 10,
  },

  // ── 부조 내역 카드 (새 디자인) ──────────────────
  contribCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  contribCardVerified: {
    borderLeftWidth: 4,
    borderLeftColor: '#3182F6',
  },
  contribCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  contribAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4E9AF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contribAvatarVerified: {
    backgroundColor: '#3182F6',
  },
  contribAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contribInfo: {
    flex: 1,
  },
  contribName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191F28',
    marginBottom: 3,
  },
  contribRelation: {
    fontSize: 13,
    color: '#8B95A1',
    fontWeight: '400',
  },
  contribAmountArea: {
    alignItems: 'flex-end',
    gap: 3,
  },
  contribAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  contribAmountNum: {
    fontSize: 17,
    fontWeight: '700',
    color: '#191F28',
    letterSpacing: -0.3,
  },
  contribAmountUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#191F28',
  },
  contribTime: {
    fontSize: 12,
    color: '#B0BEC5',
    fontWeight: '400',
  },
  contribCardDivider: {
    height: 1,
    backgroundColor: '#F2F4F6',
    marginHorizontal: 0,
  },
  contribCardBtns: {
    flexDirection: 'row',
    height: 44,
  },
  contribCardBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contribCardBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4E5968',
  },
  contribBtnConfirm: {
    color: '#3182F6',
    fontWeight: '600',
  },
  contribBtnDelete: {
    color: '#F04452',
  },
  contribBtnCancel: {
    color: '#8B95A1',
  },
  contribBtnSep: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E8EB',
    alignSelf: 'center',
  },

  // (구형 스타일 — 미사용, 하위호환용)
  tossListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  tossListItemVerified: {},
  tossListItemUnverified: {},
  tossItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tossAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3182F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tossAvatarText: { fontSize: 16, fontWeight: '600', color: 'white' },
  tossItemInfo: { flex: 1 },
  tossItemName: { fontSize: 16, fontWeight: '500', color: '#191F28', marginBottom: 2 },
  tossItemRelation: { fontSize: 13, color: '#6B7684', fontWeight: '400' },
  tossItemRight: { alignItems: 'flex-end', gap: 4 },
  tossItemAmount: { fontSize: 16, fontWeight: '600', color: '#191F28' },
  tossItemDate: { flexDirection: 'row', alignItems: 'center' },
  tossDateText: { fontSize: 12, color: '#B0BEC5', fontWeight: '400' },
  tossItemActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  
  // 확정 뱃지 스타일
  tossVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  tossVerifiedBadgeText: {
    fontSize: 10,
    color: '#FF4757',
    fontWeight: '600',
    marginLeft: 2,
  },

  // 기여자 관계 및 메시지 스타일
  contributionRelation: {
    fontSize: 13,
    color: '#8B95A1',
    marginBottom: 4,
    fontWeight: '500',
  },

  // 토스 스타일 폼 모달
  tossFormModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tossFormModalContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tossFormModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tossFormModalCloseButton: {
    padding: 4,
    width: 50,
    alignItems: 'flex-start',
  },
  tossFormModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191F28',
    letterSpacing: -0.3,
  },
  tossFormModalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3182F6',
    minWidth: 50,
    alignItems: 'center',
  },
  tossFormModalSaveButtonDisabled: {
    backgroundColor: '#E5E8EB',
  },
  tossFormModalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  tossFormModalSaveTextDisabled: {
    color: '#6B7684',
  },
  tossFormModalScrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tossFormSection: {
    marginBottom: 12,
  },
  tossFormInputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  tossFormLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191F28',
    marginBottom: 12,
  },
  tossFormInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#191F28',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  tossRelationContainer: {
    gap: 20,
  },
  tossRelationGroup: {
    gap: 8,
  },
  tossRelationGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7684',
  },
  tossRelationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tossRelationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  tossRelationButtonActive: {
    backgroundColor: '#3182F6',
    borderColor: '#3182F6',
  },
  tossRelationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7684',
  },
  tossRelationButtonTextActive: {
    color: 'white',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  relationRow: {
    gap: 12,
  },
  relationSection: {
    marginBottom: 8,
  },
  relationSubLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7684',
    marginBottom: 8,
  },
  relationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    minHeight: 50,
  },
  relationButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  relationButtonActive: {
    backgroundColor: '#3182F6',
    borderColor: '#3182F6',
  },
  relationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7684',
  },
  relationButtonTextActive: {
    color: 'white',
  },

  // 토스 스타일 Bottom Sheet
  tossBottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tossBottomSheetBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tossBottomSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 20,
    minHeight: 350,
  },
  tossBottomSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E8EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  tossBottomSheetAmountInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  tossBottomSheetAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191F28',
    marginBottom: 4,
  },
  tossBottomSheetAmountLabel: {
    fontSize: 14,
    color: '#6B7684',
    fontWeight: '500',
  },
  tossBottomSheetActionButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  tossBottomSheetPrimaryButton: {
    backgroundColor: '#3182F6',
  },
  tossBottomSheetDangerButton: {
    backgroundColor: '#FF4757',
  },
  tossBottomSheetActionButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  tossBottomSheetPrimaryButtonText: {
    color: 'white',
  },
  tossBottomSheetDangerButtonText: {
    color: 'white',
  },
  // 간단한 확정 뱃지
  tossSimpleVerifiedBadge: {
    marginLeft: 8,
  },
  // 간단한 액션 버튼들
  tossSimpleActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  tossSimpleButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0,
    minWidth: 35,
    alignItems: 'center',
  },
  tossVerifiedSimpleButton: {
    backgroundColor: '#FF4757', // 진한 빨간색
  },
  tossUnverifiedSimpleButton: {
    backgroundColor: '#3182F6', // 진한 파란색
  },
  tossSimpleButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  tossVerifiedSimpleText: {
    color: 'white',
  },
  tossUnverifiedSimpleText: {
    color: 'white',
  },
  tossEditButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F3F5',
    borderWidth: 0,
    minWidth: 40,
    alignItems: 'center',
  },
  tossEditButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#495057',
  },
  tossDeleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFE8E8',
    borderWidth: 0,
    minWidth: 40,
    alignItems: 'center',
  },
  tossDeleteButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF4757',
  },
  tossBottomSheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191F28',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  tossBottomSheetDescription: {
    fontSize: 16,
    color: '#6B7684',
    lineHeight: 24,
    marginBottom: 32,
  },
  tossBottomSheetOptions: {
    marginBottom: 24,
  },
  tossBottomSheetOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    marginBottom: 8,
  },
  tossBottomSheetOptionPrimary: {
    borderColor: '#3182F6',
    backgroundColor: '#F8FAFF',
  },
  tossBottomSheetOptionDanger: {
    borderColor: '#FF4757',
    backgroundColor: '#FFF8F8',
  },
  tossBottomSheetOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  tossBottomSheetOptionIcon: {
    marginRight: 16,
  },
  tossBottomSheetOptionText: {
    flex: 1,
  },
  tossBottomSheetOptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191F28',
    marginBottom: 4,
  },
  tossBottomSheetOptionTitlePrimary: {
    color: '#3182F6',
  },
  tossBottomSheetOptionTitleDanger: {
    color: '#FF4757',
  },
  tossBottomSheetOptionSubtitle: {
    fontSize: 14,
    color: '#6B7684',
    lineHeight: 20,
  },
  tossBottomSheetCancelButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  tossBottomSheetCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7684',
  },

  // 검색 모달 스타일
  searchModalOverlay: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  searchModalCloseButton: {
    padding: 4,
  },
  searchModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  searchModalApplyButton: {
    padding: 4,
  },
  searchModalApplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchModalInputIcon: {
    marginRight: 8,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  searchModalClearButton: {
    padding: 4,
  },
  searchModalPreview: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchModalPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  searchModalPreviewList: {
    flex: 1,
    maxHeight: 400, // 최대 높이 제한
  },
  searchModalPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  searchModalPreviewInfo: {
    flex: 1,
  },
  searchModalPreviewName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  searchModalPreviewRelation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchModalPreviewAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchModalNoResults: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchModalNoResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  searchModalNoResultsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchModalEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchModalEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  searchModalEmptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // 토스 스타일 통계 모달
  tossStatModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tossStatModalContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tossStatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  tossStatModalCloseButton: {
    padding: 4,
  },
  tossStatModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191F28',
  },
  tossStatModalScrollView: {
    flex: 1,
    padding: 16,
  },
  tossStatSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tossStatMainAmount: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  tossStatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7684',
    marginBottom: 8,
  },
  tossStatBigValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#191F28',
  },
  tossStatDivider: {
    height: 1,
    backgroundColor: '#E5E8EB',
    marginVertical: 16,
  },
  tossStatSubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tossStatInfoItem: {
    alignItems: 'center',
  },
  tossStatSmallLabel: {
    fontSize: 13,
    color: '#6B7684',
    marginBottom: 4,
  },
  tossStatSmallValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191F28',
  },
  tossStatChartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tossStatSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191F28',
    marginBottom: 16,
  },
  tossStatBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  tossStatBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  tossStatBarWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  tossStatBar: {
    width: '60%',
    backgroundColor: '#3182F6',
    borderRadius: 4,
    minHeight: 4,
  },
  tossStatBarCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191F28',
    marginTop: 4,
    marginBottom: 4,
  },
  tossStatBarLabel: {
    fontSize: 11,
    color: '#6B7684',
    marginTop: 4,
  },
  tossStatStatusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tossStatProgressContainer: {
    marginTop: 8,
  },
  tossStatProgressBar: {
    height: 8,
    backgroundColor: '#E5E8EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tossStatProgressFill: {
    height: '100%',
    backgroundColor: '#3182F6',
  },
  tossStatProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tossStatProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tossStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tossStatProgressLabel: {
    fontSize: 14,
    color: '#6B7684',
  },
  tossStatProgressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191F28',
  },
  tossStatRelationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tossStatRelationList: {
    gap: 12,
  },
  tossStatRelationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tossStatRelationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191F28',
  },
  tossStatRelationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tossStatRelationCount: {
    fontSize: 13,
    color: '#6B7684',
  },
  tossStatRelationAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191F28',
  },
  
  // 토스 스타일 확정 관리 모달
  tossVerifyModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tossVerifyModalContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tossVerifyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  tossVerifyModalCloseButton: {
    padding: 4,
  },
  tossVerifyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191F28',
  },
  tossVerifyModalScrollView: {
    flex: 1,
    padding: 16,
  },
  tossVerifySummaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tossVerifyStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tossVerifyStatusItem: {
    flex: 1,
    alignItems: 'center',
  },
  tossVerifyStatusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tossVerifyStatusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7684',
    marginBottom: 4,
  },
  tossVerifyStatusCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191F28',
    marginBottom: 4,
  },
  tossVerifyStatusAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3182F6',
  },
  tossVerifyDivider: {
    width: 1,
    backgroundColor: '#E5E8EB',
    marginHorizontal: 16,
  },
  tossVerifyListCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tossVerifyListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tossVerifyListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191F28',
  },
  tossVerifyAllButton: {
    backgroundColor: '#3182F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tossVerifyAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  tossVerifyList: {
    gap: 8,
  },
  tossVerifyListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  tossVerifyListItemConfirmed: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3182F6',
  },
  tossVerifyListItemInfo: {
    flex: 1,
  },
  tossVerifyListItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191F28',
    marginBottom: 2,
  },
  tossVerifyListItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tossVerifyListItemDetail: {
    fontSize: 13,
    color: '#6B7684',
  },
  tossVerifyListItemButton: {
    backgroundColor: '#3182F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tossVerifyListItemButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  tossVerifyListItemButtonCancel: {
    backgroundColor: '#F5F5F5',
  },
  tossVerifyListItemButtonCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7684',
  },

  // ── 공통 바텀 시트 ────────────────────────────
  bsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bsBackdropAnim: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bsBackdrop: {
    flex: 1,
  },
  bsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '92%',
  },
  bsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E8EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  bsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191F28',
  },

  // ── 부조 추가 바텀 시트 ────────────────────────
  bsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B95A1',
    marginBottom: 8,
    marginTop: 4,
  },
  bsInput: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#191F28',
    marginBottom: 16,
  },
  bsAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  bsAmountUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191F28',
  },
  bsQuickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  bsQuickBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bsQuickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3182F6',
  },
  bsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bsChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F2F4F6',
  },
  bsChipActive: {
    backgroundColor: '#191F28',
  },
  bsChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B95A1',
  },
  bsChipTextActive: {
    color: '#FFFFFF',
  },
  bsSaveWrap: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
  },
  bsSaveBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#3182F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bsSaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerModalCard: {
    width: '100%',
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
  },
  centerModalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  centerModalIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#191F28',
    marginBottom: 7,
  },
  centerModalDesc: {
    fontSize: 14,
    color: '#6B7684',
    lineHeight: 20,
    marginBottom: 18,
  },
  passwordHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  passwordHintText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B95A1',
  },
  passwordInputWrap: {
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F2F4F6',
  },
  passwordInputError: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FF6B6B',
    marginBottom: 8,
  },
  passwordErrorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E03131',
    marginBottom: 16,
  },
  centerModalActions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  centerModalCancel: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerModalCancelText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4E5968',
  },
  centerModalConfirm: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#3182F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerModalConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mealPreviewBox: {
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  mealFormErrorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E03131',
    marginTop: 8,
    marginBottom: 4,
  },
  mealPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
    marginBottom: 6,
  },
  mealPreviewValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.5,
  },
  mealPreviewSub: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
  },
  mealSideInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mealSideInputCol: {
    flex: 1,
  },

  // ── 확정 관리 바텀 시트 ────────────────────────
  vmSummaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    overflow: 'hidden',
  },
  vmSummaryCard: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  vmSummarySep: {
    width: 1,
    backgroundColor: '#E5E8EB',
    marginVertical: 16,
  },
  vmSummaryCount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191F28',
  },
  vmSummaryLabel: {
    fontSize: 12,
    color: '#8B95A1',
    fontWeight: '500',
  },
  vmSummaryAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4E5968',
  },
  vmListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  vmListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191F28',
  },
  vmAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EBF3FF',
  },
  vmAllBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3182F6',
  },
  vmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
    gap: 12,
  },
  vmAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vmAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4E5968',
  },
  vmItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191F28',
    marginBottom: 2,
  },
  vmItemMeta: {
    fontSize: 13,
    color: '#8B95A1',
  },
  vmItemAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191F28',
  },
  vmConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#3182F6',
  },
  vmConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vmCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
  },
  vmCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B95A1',
  },
  vmPagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  vmPageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E5968',
  },

  // 알림톡 크레딧 배너 (히어로 섹션 내)
  creditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    gap: 12,
  },
  creditIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditLabel: {
    fontSize: 12,
    color: '#8B95A1',
    fontWeight: '600',
    marginBottom: 2,
  },
  creditValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  creditWarning: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
  },
  chargeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#3182F6',
    borderRadius: 10,
  },
  chargeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
