// src/screens/event/EventDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../styles/constants';
import { getEventDetail, getEventContributions, getEventStatistics, addGuestBookEntry, updateGuestBookEntry, deleteGuestBookEntry, toggleGuestBookVerification } from '../../lib/supabaseHelper';
import { supabase } from '../../lib/supabase';

export default function EventDetailScreen({ navigation, route }) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();

  // 백 버튼 텍스트 제거 (iOS) — 마운트 즉시 적용
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
    });
  }, [navigation]);
  
  const [event, setEvent] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
    confirmedCount: 0,
  });

  // 검색 및 페이지네이션
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'verified', 'unverified'
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
  
  // 통계 모달
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);
  
  // 확정 관리 모달
  const [verifyManageModalVisible, setVerifyManageModalVisible] = useState(false);
  const [verifyPage, setVerifyPage] = useState(0); // 확정관리 페이지 (5개씩)

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
      'groom_side': '신랑측',
      'bride_side': '신부측',
      '신랑측': '신랑측',
      '신부측': '신부측'
    };
    
    // detail 매핑
    const detailMap = {
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

  // 부조 수정 모달
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingContribution, setEditingContribution] = useState(false);
  const [editContribution, setEditContribution] = useState(null);
  const [editData, setEditData] = useState({
    guest_name: '',
    amount: '',
    relation_category: '신랑측',
    relation_detail: '친구',
  });

  // 부조 추가 처리
  const handleAddContribution = async () => {
    if (!newContribution.guest_name.trim()) {
      Alert.alert('알림', '성함을 입력해주세요.');
      return;
    }
    
    const amount = parseInt(newContribution.amount.replace(/[^0-9]/g, ''));
    if (!amount || amount < 1000) {
      Alert.alert('알림', '부조금을 1,000원 이상 입력해주세요.');
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
        Alert.alert(
          '부조 추가 완료',
          `${newContribution.guest_name}님의 부조가 등록되었습니다.\n${formatAmount(amount)}`,
          [{
            text: '확인',
            onPress: () => {
              setAddModalVisible(false);
              setNewContribution({
                guest_name: '',
                amount: '',
                relation_category: '신랑측',
                relation_detail: '친구',
              });
              loadEventData(); // 데이터 새로고침
            }
          }]
        );
      } else {
        Alert.alert('오류', result.error || '부조 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('부조 추가 오류:', error);
      Alert.alert('오류', '부조 등록 중 오류가 발생했습니다.');
    } finally {
      setAddingContribution(false);
    }
  };

  // 부조 수정 처리
  const handleEditContribution = (contribution) => {
    console.log('🔍 수정할 contribution 객체:', contribution);
    console.log('🔍 contribution.id:', contribution.id);
    setEditContribution(contribution);
    setEditData({
      guest_name: contribution.guest_name,
      amount: formatAmount(contribution.amount),
      relation_category: contribution.relation_category,
      relation_detail: contribution.relation_detail,
    });
    setEditModalVisible(true);
  };

  const handleUpdateContribution = async () => {
    if (!editData.guest_name.trim()) {
      Alert.alert('알림', '성함을 입력해주세요.');
      return;
    }
    
    const amount = parseInt(editData.amount.replace(/[^0-9]/g, ''));
    if (!amount || amount < 1000) {
      Alert.alert('알림', '부조금을 1,000원 이상 입력해주세요.');
      return;
    }

    setEditingContribution(true);

    try {
      const updateData = {
        guest_name: editData.guest_name.trim(),
        amount: amount,
        relation_category: editData.relation_category,
        relation_detail: editData.relation_detail,
      };

      const result = await updateGuestBookEntry(editContribution.id, updateData);
      
      if (result.success) {
        setEditModalVisible(false);
        setEditContribution(null);
        setEditData({
          guest_name: '',
          amount: '',
          relation_category: '신랑측',
          relation_detail: '친구',
        });
        loadEventData(); // 데이터 새로고침
      } else {
        Alert.alert('오류', result.error || '부조 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('부조 수정 오류:', error);
      Alert.alert('오류', '부조 수정 중 오류가 발생했습니다.');
    } finally {
      setEditingContribution(false);
    }
  };

  // 부조 삭제 처리
  const handleDeleteContribution = (contribution) => {
    console.log('🔍 삭제할 contribution 객체:', contribution);
    console.log('🔍 contribution.id:', contribution.id);
    Alert.alert(
      '부조 삭제',
      `${contribution.guest_name}님의 부조 내역을 정말 삭제하시겠어요?\n\n삭제된 내역은 복구할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteGuestBookEntry(contribution.id);
              
              if (result.success) {
                loadEventData(); // 데이터 새로고침
              } else {
                Alert.alert('삭제 실패', result.error || '부조 삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('부조 삭제 오류:', error);
              Alert.alert('삭제 실패', '부조 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };


  // 부조 확정/미확정 토글 처리 — 카드 버튼: 모달 없이 즉시 처리
  const handleToggleVerification = async (contribution) => {
    try {
      const result = await toggleGuestBookVerification(contribution.id);
      if (result.success) {
        loadEventData();
      } else {
        Alert.alert('오류', result.error || '확정 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('확정 상태 변경 오류:', error);
      Alert.alert('오류', '확정 상태 변경 중 오류가 발생했습니다.');
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
        Alert.alert('오류', result.error || '확정 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('확정 상태 변경 오류:', error);
      Alert.alert('오류', '확정 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const formatAmountInput = (text) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('ko-KR').format(parseInt(numbers));
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

  // 검색어나 탭, 정렬이 변경되면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortOrder]);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadEventData();
    }, [eventId])
  );

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
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] 구독 오류 — 재시도 필요');
        }
      });

    return () => {
      localSub.remove();
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      
      // 경조사 정보 로드
      const eventResult = await getEventDetail(eventId);
      
      if (eventResult.success) {
        setEvent(eventResult.data);
        
        // 헤더 제목 업데이트
        navigation.setOptions({
          title: eventResult.data.event_name || '경조사 상세',
        });
        
        // 통계 가져오기
        const statsResult = await getEventStatistics(eventId);
        
        // 실제 부조금 목록 조회
        const contributionsResult = await getEventContributions(eventId);
        
        // 부조금 목록 설정 - 실제 데이터를 우선으로 하고, 없으면 통계 데이터 기반으로 생성
        if (contributionsResult.success && contributionsResult.data && contributionsResult.data.length > 0) {
          setContributions(contributionsResult.data);
        } else if (eventResult.data?.guest_book && eventResult.data.guest_book.length > 0) {
          setContributions(eventResult.data.guest_book);
        } else if (statsResult.success && statsResult.data?.totalContributions > 0) {
          // 통계 데이터를 기반으로 부조자 목록 생성 (기존 데이터 복원)
          const contributionList = [];
          
          // 신랑측 부조금이 있으면 추가
          if (statsResult.data.groomSideCount > 0) {
            for (let i = 0; i < statsResult.data.groomSideCount; i++) {
              contributionList.push({
                id: `groom-${i + 1}`,
                guest_name: i === 0 ? '한태준' : `신랑측 부조자 ${i + 1}`,
                amount: Math.floor(statsResult.data.groomSideAmount / statsResult.data.groomSideCount),
                relation_category: '신랑측',
                relation_detail: '친구',
                message: i === 0 ? '와 니가 결혼하다니 ㄹㅇㅋㅋ' : '축하합니다!',
                message_type: 'congratulation',
                is_verified: false,
                created_at: new Date().toISOString()
              });
            }
          }
          
          // 신부측 부조금이 있으면 추가
          if (statsResult.data.brideSideCount > 0) {
            for (let i = 0; i < statsResult.data.brideSideCount; i++) {
              contributionList.push({
                id: `bride-${i + 1}`,
                guest_name: `신부측 부조자 ${i + 1}`,
                amount: Math.floor(statsResult.data.brideSideAmount / statsResult.data.brideSideCount),
                relation_category: '신부측',
                relation_detail: '친구',
                message: '축하합니다!',
                message_type: 'congratulation',
                is_verified: false,
                created_at: new Date().toISOString()
              });
            }
          }
          
          setContributions(contributionList);
        } else {
          setContributions([]);
        }
        
        // 통계 데이터를 stats state에 설정
        if (statsResult.success) {
          setStats({
            totalAmount: statsResult.data?.totalAmount || 0,
            totalCount: statsResult.data?.totalContributions || 0,
            averageAmount: statsResult.data?.averageAmount || 0,
            confirmedCount: statsResult.data?.verifiedCount || 0,
          });
        }
      } else {
        Alert.alert('오류', eventResult.error || '경조사 정보를 불러올 수 없습니다.');
        navigation.goBack();
        return;
      }
      
    } catch (error) {
      console.error('Event detail loading error:', error);
      Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
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
              onPress={() => setStatisticsModalVisible(true)}
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
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.heroBtnGrayText}>부조 추가</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroBtnBlue}
              onPress={() => setSideSelectVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.heroBtnBlueText}>하객 접수</Text>
            </TouchableOpacity>
          </View>

          {/* 미확정 배너 */}
          {contributions.filter(c => !c.is_verified).length > 0 && (
            <TouchableOpacity
              style={styles.unverifiedBanner}
              onPress={() => setVerifyManageModalVisible(true)}
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

        </View>

        {/* 섹션 구분 */}
        <View style={styles.sectionGap} />

        {/* ── 리스트 섹션 ── */}
        <View style={styles.newListSection}>

          {/* 필터 탭 + 검색 */}
          <View style={styles.listControlRow}>
            <View style={styles.filterTabRow}>
              {[
                { key: 'all', label: '전체' },
                { key: 'unverified', label: '미확정' },
                { key: 'verified', label: '확정' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterTab, activeTab === tab.key && styles.filterTabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterTabText, activeTab === tab.key && styles.filterTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={openSearchModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

                return (
                  <TouchableOpacity
                    key={contribution.id || index}
                    style={styles.flatItem}
                    onPress={() => isRealItem && toggleExpand(contribution.id || index)}
                    activeOpacity={0.6}
                  >
                    {/* 아바타 */}
                    <View style={[
                      styles.flatAvatar,
                      contribution.is_verified && styles.flatAvatarVerified,
                    ]}>
                      <Text style={styles.flatAvatarText}>
                        {(contribution.guest_name || '이').charAt(0)}
                      </Text>
                    </View>

                    {/* 이름 + 시간·관계 */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.flatName}>
                        {contribution.guest_name || '이름 없음'}
                      </Text>
                      <Text style={styles.flatMeta}>
                        {timeStr ? `${timeStr} · ` : ''}{displayCategory} {displayDetail}
                      </Text>

                      {/* 액션 버튼 (탭 시 펼침) */}
                      {isExpanded && isRealItem && (
                        <View style={styles.flatActions}>
                          {contribution.is_verified ? (
                            <TouchableOpacity
                              style={styles.flatActBtn}
                              onPress={() => { handleToggleVerification(contribution); setExpandedItemId(null); }}
                            >
                              <Text style={[styles.flatActBtnText, { color: '#8B95A1' }]}>확정취소</Text>
                            </TouchableOpacity>
                          ) : (
                            <>
                              <TouchableOpacity
                                style={styles.flatActBtn}
                                onPress={() => { handleToggleVerification(contribution); setExpandedItemId(null); }}
                              >
                                <Text style={[styles.flatActBtnText, { color: '#3182F6' }]}>확정</Text>
                              </TouchableOpacity>
                              <View style={styles.flatActSep} />
                              <TouchableOpacity
                                style={styles.flatActBtn}
                                onPress={() => { handleEditContribution(contribution); setExpandedItemId(null); }}
                              >
                                <Text style={styles.flatActBtnText}>수정</Text>
                              </TouchableOpacity>
                              <View style={styles.flatActSep} />
                              <TouchableOpacity
                                style={styles.flatActBtn}
                                onPress={() => { handleDeleteContribution(contribution); setExpandedItemId(null); }}
                              >
                                <Text style={[styles.flatActBtnText, { color: '#F04452' }]}>삭제</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}
                    </View>

                    {/* 금액 + 상태 */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[
                        styles.flatAmount,
                        !contribution.amount && styles.flatAmountEmpty,
                      ]}>
                        {contribution.amount ? `+${formatAmountCard(contribution.amount)}원` : '금액 미입력'}
                      </Text>
                      <Text style={[
                        styles.flatStatus,
                        contribution.is_verified && styles.flatStatusDone,
                      ]}>
                        {contribution.is_verified ? '확정완료' : '미확정'}
                      </Text>
                    </View>
                  </TouchableOpacity>
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
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.bsOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.bsBackdrop} activeOpacity={1} onPress={() => setAddModalVisible(false)} />
          <View style={styles.bsContainer}>
            <View style={styles.bsHandle} />

            {/* 헤더 */}
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>부조 추가</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 토스 스타일 부조 수정 모달 */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.tossFormModalContainer}>
          <View style={styles.tossFormModalContent}>
            <KeyboardAvoidingView 
              style={{ flex: 1 }} 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            {/* 토스 스타일 헤더 */}
            <View style={styles.tossFormModalHeader}>
              <TouchableOpacity
                style={styles.tossFormModalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="chevron-back" size={24} color="#191F28" />
              </TouchableOpacity>
              <Text style={styles.tossFormModalTitle}>부조 수정</Text>
              <TouchableOpacity
                style={[
                  styles.tossFormModalSaveButton, 
                  editingContribution && styles.tossFormModalSaveButtonDisabled
                ]}
                onPress={handleUpdateContribution}
                disabled={editingContribution}
              >
                <Text style={[
                  styles.tossFormModalSaveText, 
                  editingContribution && styles.tossFormModalSaveTextDisabled
                ]}>
                  {editingContribution ? '수정 중...' : '완료'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.tossFormModalScrollView}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 성함 입력 */}
              <View style={styles.tossFormSection}>
                <View style={styles.tossFormInputContainer}>
                  <Text style={styles.tossFormLabel}>성함</Text>
                  <TextInput
                    style={styles.tossFormInput}
                    placeholder="성함을 입력해주세요"
                    value={editData.guest_name}
                    onChangeText={(text) => setEditData(prev => ({ ...prev, guest_name: text }))}
                    placeholderTextColor="#A0A8B5"
                  />
                </View>
              </View>

              {/* 금액 입력 */}
              <View style={styles.tossFormSection}>
                <View style={styles.tossFormInputContainer}>
                  <Text style={styles.tossFormLabel}>부조금</Text>
                  <TextInput
                    style={styles.tossFormInput}
                    placeholder="금액을 입력해주세요"
                    value={editData.amount}
                    onChangeText={(text) => setEditData(prev => ({ 
                      ...prev, 
                      amount: formatAmountInput(text) 
                    }))}
                    keyboardType="numeric"
                    placeholderTextColor="#A0A8B5"
                  />
                </View>
              </View>

              {/* 관계 선택 */}
              <View style={styles.tossFormSection}>
                <View style={styles.tossFormInputContainer}>
                  <Text style={styles.tossFormLabel}>관계</Text>
                  <View style={styles.tossRelationContainer}>
                    <View style={styles.tossRelationGroup}>
                      <Text style={styles.tossRelationGroupLabel}>측</Text>
                      <View style={styles.tossRelationButtons}>
                        {['신랑측', '신부측'].map((category) => (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.tossRelationButton,
                              editData.relation_category === category && styles.tossRelationButtonActive
                            ]}
                            onPress={() => setEditData(prev => ({ ...prev, relation_category: category }))}
                          >
                            <Text style={[
                              styles.tossRelationButtonText,
                              editData.relation_category === category && styles.tossRelationButtonTextActive
                            ]}>
                              {category}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    
                    <View style={styles.tossRelationGroup}>
                      <Text style={styles.tossRelationGroupLabel}>관계</Text>
                      <View style={styles.tossRelationButtons}>
                        {['친구', '동료', '가족', '친척', '기타'].map((detail) => (
                          <TouchableOpacity
                            key={detail}
                            style={[
                              styles.tossRelationButton,
                              editData.relation_detail === detail && styles.tossRelationButtonActive
                            ]}
                            onPress={() => setEditData(prev => ({ ...prev, relation_detail: detail }))}
                          >
                            <Text style={[
                              styles.tossRelationButtonText,
                              editData.relation_detail === detail && styles.tossRelationButtonTextActive
                            ]}>
                              {detail}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── 통계 바텀 시트 ── */}
      <Modal
        visible={statisticsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatisticsModalVisible(false)}
      >
        <View style={styles.bsOverlay}>
          <TouchableOpacity style={styles.bsBackdrop} activeOpacity={1} onPress={() => setStatisticsModalVisible(false)} />
          <View style={[styles.bsContainer, { maxHeight: '88%' }]}>
            <View style={styles.bsHandle} />
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>부조 통계</Text>
              <TouchableOpacity onPress={() => setStatisticsModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
          </View>
        </View>
      </Modal>

      {/* ── 확정 관리 바텀 시트 ── */}
      <Modal
        visible={verifyManageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { setVerifyManageModalVisible(false); setVerifyPage(0); }}
      >
        <View style={styles.bsOverlay}>
          <TouchableOpacity style={styles.bsBackdrop} activeOpacity={1} onPress={() => { setVerifyManageModalVisible(false); setVerifyPage(0); }} />
          <View style={[styles.bsContainer, { maxHeight: '88%' }]}>
            <View style={styles.bsHandle} />
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>확정 관리</Text>
              <TouchableOpacity onPress={() => { setVerifyManageModalVisible(false); setVerifyPage(0); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
                        onPress={() => Alert.alert('전체 확정', '모든 미확정 부조를 확정하시겠어요?', [
                          { text: '취소', style: 'cancel' },
                          { text: '확정', onPress: async () => {
                            for (const item of unverified) await toggleGuestBookVerification(item.id);
                            await loadEventData();
                            setVerifyPage(0);
                          }}
                        ])}
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
          </View>
        </View>
      </Modal>

      {/* 토스 스타일 확정 모달 (Bottom Sheet) */}
      <Modal
        visible={verificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVerificationModalVisible(false)}
      >
        <View style={styles.tossBottomSheetOverlay}>
          <TouchableOpacity 
            style={styles.tossBottomSheetBackground}
            activeOpacity={1}
            onPress={() => setVerificationModalVisible(false)}
          />
          <View style={styles.tossBottomSheetContainer}>
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
              onPress={() => setVerificationModalVisible(false)}
            >
              <Text style={styles.tossBottomSheetCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
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
                  console.log(`🔍 검색 결과 개수: ${filteredCount}개, 검색어: "${tempSearchQuery}"`);
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

      {/* ── 디지털 방명록 측 선택 모달 ── */}
      <Modal
        visible={sideSelectVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSideSelectVisible(false)}
      >
        <View style={styles.sideSelectOverlay}>
          <View style={styles.sideSelectCard}>
            {/* 상단 아이콘 */}
            <View style={styles.sideSelectIconWrap}>
              <Text style={styles.sideSelectIcon}>📋</Text>
            </View>

            <Text style={styles.sideSelectTitle}>방명록 접수대 선택</Text>
            <Text style={styles.sideSelectSub}>
              담당자가 한 번만 선택하면 됩니다.
            </Text>

            {/* 카드 2개 가로 배치 */}
            <View style={styles.sideSelectRow}>
              <TouchableOpacity
                style={styles.sideCardGroom}
                onPress={() => {
                  setSideSelectVisible(false);
                  navigation.navigate('GuestWriting', { event, side: 'groom' });
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.sideCardEmoji}>🤵</Text>
                <Text style={styles.sideCardTitle}>신랑측</Text>
                <Text style={styles.sideCardDesc}>신랑 가족·친구{'\n'}동료 하객</Text>
                <View style={styles.sideCardTag}>
                  <Text style={styles.sideCardTagText}>선택</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sideCardBride}
                onPress={() => {
                  setSideSelectVisible(false);
                  navigation.navigate('GuestWriting', { event, side: 'bride' });
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.sideCardEmoji}>👰</Text>
                <Text style={[styles.sideCardTitle, { color: '#EC4899' }]}>신부측</Text>
                <Text style={styles.sideCardDesc}>신부 가족·친구{'\n'}동료 하객</Text>
                <View style={[styles.sideCardTag, { backgroundColor: '#EC4899' }]}>
                  <Text style={styles.sideCardTagText}>선택</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sideSelectCancelBtn}
              onPress={() => setSideSelectVisible(false)}
            >
              <Text style={styles.sideSelectCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // ── 새 리스트 섹션 ────────────────────────────
  newListSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  listControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
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
  filterTabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F2F4F6',
  },
  filterTabActive: {
    backgroundColor: '#191F28',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B95A1',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // 플랫 리스트 아이템
  flatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
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
    fontWeight: '700',
    color: '#4E5968',
  },
  flatName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191F28',
    marginBottom: 3,
  },
  flatMeta: {
    fontSize: 13,
    color: '#8B95A1',
    fontWeight: '400',
  },
  flatAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191F28',
    marginBottom: 3,
  },
  flatAmountEmpty: {
    color: '#B0BEC5',
    fontWeight: '400',
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
  },
  flatActBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4E5968',
  },
  flatActSep: {
    width: 6,
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

  // 측 선택 모달
  sideSelectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sideSelectCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  sideSelectIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#F0F0F5',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  sideSelectIcon: { fontSize: 28 },
  sideSelectTitle: {
    fontSize: 19, fontWeight: '700', color: '#1C1C1E',
    textAlign: 'center', marginBottom: 6,
  },
  sideSelectSub: {
    fontSize: 14, color: '#8E8E93', textAlign: 'center',
    lineHeight: 20, marginBottom: 24,
  },
  sideSelectRow: {
    flexDirection: 'row', gap: 12, width: '100%', marginBottom: 8,
  },
  sideCardGroom: {
    flex: 1,
    backgroundColor: '#EBF5FF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2, borderColor: '#3B82F6',
  },
  sideCardBride: {
    flex: 1,
    backgroundColor: '#FFF0F6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2, borderColor: '#EC4899',
  },
  sideCardEmoji: { fontSize: 36, marginBottom: 2 },
  sideCardTitle: {
    fontSize: 18, fontWeight: '800', color: '#3B82F6',
  },
  sideCardDesc: {
    fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18,
  },
  sideCardTag: {
    marginTop: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 999,
  },
  sideCardTagText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  sideSelectCancelBtn: {
    marginTop: 10, height: 44, alignItems: 'center', justifyContent: 'center',
    width: '100%',
  },
  sideSelectCancelText: { fontSize: 15, color: '#8E8E93' },

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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
});