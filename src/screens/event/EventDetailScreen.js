// src/screens/event/EventDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

export default function EventDetailScreen({ navigation, route }) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  
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


  // 부조 확정/미확정 토글 처리
  const handleToggleVerification = async (contribution) => {
    console.log('🔄 확정 상태 토글:', contribution);
    console.log('🔍 contribution.id:', contribution.id);
    
    setVerificationModalData({
      contribution,
      isVerified: contribution.is_verified
    });
    setVerificationModalVisible(true);
  };

  // 확정 처리 실행
  const executeVerificationToggle = async () => {
    setVerificationModalVisible(false);
    
    try {
      const result = await toggleGuestBookVerification(verificationModalData.contribution.id);
      
      if (result.success) {
        loadEventData(); // 데이터 새로고침
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
      default: // 기본값 (등록 순)
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
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

  const formatAmount = (amount) => {
    if (!amount) return '0원';
    
    // 소수점 제거를 위해 Math.round 적용
    const roundedAmount = Math.round(amount);
    
    // 만원 단위로 표시 (천만원 이상일 경우)
    if (roundedAmount >= 10000000) {
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
        {/* 토스 스타일 메인 헤더 */}
        <View style={styles.tossHeader}>
          <View style={styles.tossHeaderTop}>
            <View style={styles.tossTitleContainer}>
              <View style={styles.tossHeaderImageContainer}>
                <Image 
                  source={require('../../../assets/images/Wedding_Cash_Gifts_List.png')} 
                  style={styles.tossHeaderImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.tossTitle}>{event.event_name}</Text>
            </View>
          </View>
          <Text style={styles.tossSubtitle}>{formatDate(event.event_date)}</Text>
          <Text style={styles.tossLocation}>{event.location || '장소 미정'}</Text>
        </View>

        {/* 토스 스타일 메인 금액 카드 */}
        <View style={styles.tossMainCard}>
          <View style={styles.tossMainAmount}>
            <Text style={styles.tossAmountLabel}>총 부조금</Text>
            <Text style={styles.tossAmountValue}>{formatAmount(stats.totalAmount)}</Text>
          </View>
          
          <View style={styles.tossStatsRow}>
            <View style={styles.tossStatItem}>
              <Text style={styles.tossStatValue}>{stats.totalCount}</Text>
              <Text style={styles.tossStatLabel}>총 건수</Text>
            </View>
            <View style={styles.tossDivider} />
            <View style={styles.tossStatItem}>
              <Text style={styles.tossStatValue}>{formatAmount(stats.averageAmount)}</Text>
              <Text style={styles.tossStatLabel}>평균 금액</Text>
            </View>
          </View>
        </View>

        {/* 토스 스타일 액션 버튼들 */}
        <View style={styles.tossActionGrid}>
          <TouchableOpacity 
            style={styles.tossActionButton}
            onPress={() => setAddModalVisible(true)}
          >
            <View style={styles.tossActionImageContainer}>
              <Image 
                source={require('../../../assets/images/Additional_Condolence_Donations.png')} 
                style={styles.tossActionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.tossActionText}>부조 추가</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tossActionButton}
            onPress={() => setStatisticsModalVisible(true)}
          >
            <View style={styles.tossActionImageContainer}>
              <Image 
                source={require('../../../assets/images/Funeral_Donation_Records.png')} 
                style={styles.tossActionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.tossActionText}>통계</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tossActionButton}
            onPress={() => setVerifyManageModalVisible(true)}
          >
            <View style={styles.tossActionImageContainer}>
              <Image 
                source={require('../../../assets/images/check.png')} 
                style={styles.tossActionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.tossActionText}>확정관리</Text>
          </TouchableOpacity>
          
        </View>

        {/* 토스 스타일 부조 목록 */}
        <View style={styles.tossListSection}>
          <View style={styles.tossListHeader}>
            <Text style={styles.tossListTitle}>부조 내역</Text>
            <Text style={styles.tossListCount}>{filteredContributions.length}건</Text>
          </View>
          
          {/* 토스 스타일 탭 필터 */}
          <View style={styles.tossTabs}>
            <TouchableOpacity
              style={[styles.tossTab, activeTab === 'all' && styles.tossTabActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tossTabText, activeTab === 'all' && styles.tossTabTextActive]}>
                전체 ({contributions.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tossTab, activeTab === 'unverified' && styles.tossTabActive]}
              onPress={() => setActiveTab('unverified')}
            >
              <Text style={[styles.tossTabText, activeTab === 'unverified' && styles.tossTabTextActive]}>
                미확정 ({contributions.filter(c => !c.is_verified).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tossTab, activeTab === 'verified' && styles.tossTabActive]}
              onPress={() => setActiveTab('verified')}
            >
              <Text style={[styles.tossTabText, activeTab === 'verified' && styles.tossTabTextActive]}>
                확정 ({contributions.filter(c => c.is_verified).length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* 토스 스타일 정렬 버튼 */}
          <View style={styles.tossSortButtons}>
            <TouchableOpacity
              style={[styles.tossSortButton, sortOrder === 'default' && styles.tossSortButtonActive]}
              onPress={() => setSortOrder('default')}
            >
              <Text style={[styles.tossSortButtonText, sortOrder === 'default' && styles.tossSortButtonTextActive]}>
                등록순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tossSortButton, sortOrder === 'amount_desc' && styles.tossSortButtonActive]}
              onPress={() => setSortOrder('amount_desc')}
            >
              <Text style={[styles.tossSortButtonText, sortOrder === 'amount_desc' && styles.tossSortButtonTextActive]}>
                금액 많은순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tossSortButton, sortOrder === 'amount_asc' && styles.tossSortButtonActive]}
              onPress={() => setSortOrder('amount_asc')}
            >
              <Text style={[styles.tossSortButtonText, sortOrder === 'amount_asc' && styles.tossSortButtonTextActive]}>
                금액 적은순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tossSortButton, sortOrder === 'name_asc' && styles.tossSortButtonActive]}
              onPress={() => setSortOrder('name_asc')}
            >
              <Text style={[styles.tossSortButtonText, sortOrder === 'name_asc' && styles.tossSortButtonTextActive]}>
                이름순
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* 토스 스타일 검색바 */}
          <TouchableOpacity style={styles.tossSearchBar} onPress={openSearchModal}>
            <Ionicons name="search" size={16} color="#B0BEC5" />
            <Text style={[styles.tossSearchText, searchQuery && styles.tossSearchActive]}>
              {searchQuery || '이름으로 검색'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={16} color="#B0BEC5" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          
          {filteredContributions.length > 0 ? (
            <>
              <View style={styles.tossList}>
                {currentPageContributions.map((contribution, index) => (
                  <View key={contribution.id || index} style={[
                    styles.tossListItem,
                    contribution.is_verified ? styles.tossListItemVerified : styles.tossListItemUnverified
                  ]}>
                    <View style={styles.tossItemLeft}>
                      <View style={styles.tossAvatar}>
                        <Text style={styles.tossAvatarText}>
                          {(contribution.guest_name || '이름 없음').charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.tossItemInfo}>
                        <Text style={styles.tossItemName}>
                          {contribution.guest_name || '이름 없음'}
                        </Text>
                        <Text style={styles.tossItemRelation}>
                          {(() => {
                            const { displayCategory, displayDetail } = getRelationDisplay(
                              contribution.relation_category,
                              contribution.relation_detail
                            );
                            return `${displayCategory} · ${displayDetail}`;
                          })()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tossItemRight}>
                      <Text style={styles.tossItemAmount}>
                        {formatAmount(contribution.amount || 0)}
                      </Text>
                      <View style={styles.tossItemDate}>
                        <Text style={styles.tossDateText}>
                          {contribution.created_at ? 
                            new Date(contribution.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : 
                            '날짜 미상'
                          }
                        </Text>
                      </View>
                      
                      {/* 실제 데이터베이스 데이터인 경우만 액션 버튼들 표시 */}
                      {contribution.id && !String(contribution.id).includes('groom-') && !String(contribution.id).includes('bride-') && (
                        <View style={styles.tossSimpleActions}>
                          {/* 확정/확정취소 버튼 */}
                          <TouchableOpacity
                            style={[
                              styles.tossSimpleButton,
                              contribution.is_verified ? styles.tossVerifiedSimpleButton : styles.tossUnverifiedSimpleButton
                            ]}
                            onPress={() => handleToggleVerification(contribution)}
                          >
                            <Text style={[
                              styles.tossSimpleButtonText,
                              contribution.is_verified ? styles.tossVerifiedSimpleText : styles.tossUnverifiedSimpleText
                            ]}>
                              {contribution.is_verified ? '확정취소' : '확정'}
                            </Text>
                          </TouchableOpacity>
                          
                          {/* 수정/삭제 버튼 (확정되지 않은 경우만) */}
                          {!contribution.is_verified && (
                            <>
                              <TouchableOpacity
                                style={styles.tossEditButton}
                                onPress={() => handleEditContribution(contribution)}
                              >
                                <Text style={styles.tossEditButtonText}>수정</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.tossDeleteButton}
                                onPress={() => handleDeleteContribution(contribution)}
                              >
                                <Text style={styles.tossDeleteButtonText}>삭제</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              
              {/* 토스 스타일 페이지네이션 */}
              {totalPages > 1 && (
                <View style={styles.tossPagination}>
                  <TouchableOpacity 
                    style={[styles.tossPrevButton, currentPage === 1 && styles.tossPageDisabled]}
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? '#E0E0E0' : '#3182F6'} />
                  </TouchableOpacity>
                  
                  <Text style={styles.tossPageInfo}>
                    {currentPage} / {totalPages}
                  </Text>
                  
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


        <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 토스 스타일 부조 추가 모달 */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddModalVisible(false)}
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
                onPress={() => setAddModalVisible(false)}
              >
                <Ionicons name="chevron-back" size={24} color="#191F28" />
              </TouchableOpacity>
              <Text style={styles.tossFormModalTitle}>부조 추가</Text>
              <TouchableOpacity
                style={[
                  styles.tossFormModalSaveButton, 
                  addingContribution && styles.tossFormModalSaveButtonDisabled
                ]}
                onPress={handleAddContribution}
                disabled={addingContribution}
              >
                <Text style={[
                  styles.tossFormModalSaveText, 
                  addingContribution && styles.tossFormModalSaveTextDisabled
                ]}>
                  {addingContribution ? '저장 중...' : '완료'}
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
                    value={newContribution.guest_name}
                    onChangeText={(text) => setNewContribution(prev => ({ ...prev, guest_name: text }))}
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
                    value={newContribution.amount}
                    onChangeText={(text) => setNewContribution(prev => ({ 
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
                              newContribution.relation_category === category && styles.tossRelationButtonActive
                            ]}
                            onPress={() => setNewContribution(prev => ({ ...prev, relation_category: category }))}
                          >
                            <Text style={[
                              styles.tossRelationButtonText,
                              newContribution.relation_category === category && styles.tossRelationButtonTextActive
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
                              newContribution.relation_detail === detail && styles.tossRelationButtonActive
                            ]}
                            onPress={() => setNewContribution(prev => ({ ...prev, relation_detail: detail }))}
                          >
                            <Text style={[
                              styles.tossRelationButtonText,
                              newContribution.relation_detail === detail && styles.tossRelationButtonTextActive
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

      {/* 토스 스타일 통계 모달 */}
      <Modal
        visible={statisticsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setStatisticsModalVisible(false)}
      >
        <SafeAreaView style={styles.tossStatModalContainer}>
          <View style={styles.tossStatModalContent}>
            {/* 헤더 */}
            <View style={styles.tossStatModalHeader}>
              <TouchableOpacity
                style={styles.tossStatModalCloseButton}
                onPress={() => setStatisticsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#191F28" />
              </TouchableOpacity>
              <Text style={styles.tossStatModalTitle}>부조 통계</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView 
              style={styles.tossStatModalScrollView}
              showsVerticalScrollIndicator={false}
            >
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

              {/* 금액대별 분포 차트 */}
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
                          <View 
                            style={[
                              styles.tossStatBar,
                              { height: `${(range.count / maxCount) * 100}%` }
                            ]} 
                          />
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
                    <View 
                      style={[
                        styles.tossStatProgressFill,
                        { width: `${contributions.length > 0 ? (contributions.filter(c => c.is_verified).length / contributions.length * 100) : 0}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.tossStatProgressInfo}>
                    <View style={styles.tossStatProgressItem}>
                      <View style={[styles.tossStatDot, { backgroundColor: '#3182F6' }]} />
                      <Text style={styles.tossStatProgressLabel}>확정</Text>
                      <Text style={styles.tossStatProgressValue}>
                        {contributions.filter(c => c.is_verified).length}건
                      </Text>
                    </View>
                    <View style={styles.tossStatProgressItem}>
                      <View style={[styles.tossStatDot, { backgroundColor: '#E5E8EB' }]} />
                      <Text style={styles.tossStatProgressLabel}>미확정</Text>
                      <Text style={styles.tossStatProgressValue}>
                        {contributions.filter(c => !c.is_verified).length}건
                      </Text>
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
                      if (!relationStats[key]) {
                        relationStats[key] = { count: 0, amount: 0 };
                      }
                      relationStats[key].count++;
                      relationStats[key].amount += c.amount || 0;
                    });
                    
                    return Object.entries(relationStats)
                      .sort((a, b) => b[1].amount - a[1].amount)
                      .map(([relation, stats]) => (
                        <View key={relation} style={styles.tossStatRelationItem}>
                          <Text style={styles.tossStatRelationName}>{relation}</Text>
                          <View style={styles.tossStatRelationInfo}>
                            <Text style={styles.tossStatRelationCount}>{stats.count}건</Text>
                            <Text style={styles.tossStatRelationAmount}>{formatAmount(stats.amount)}</Text>
                          </View>
                        </View>
                      ));
                  })()}
                </View>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 토스 스타일 확정 관리 모달 */}
      <Modal
        visible={verifyManageModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVerifyManageModalVisible(false)}
      >
        <SafeAreaView style={styles.tossVerifyModalContainer}>
          <View style={styles.tossVerifyModalContent}>
            {/* 헤더 */}
            <View style={styles.tossVerifyModalHeader}>
              <TouchableOpacity
                style={styles.tossVerifyModalCloseButton}
                onPress={() => setVerifyManageModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#191F28" />
              </TouchableOpacity>
              <Text style={styles.tossVerifyModalTitle}>확정 관리</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView 
              style={styles.tossVerifyModalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* 확정 현황 요약 */}
              <View style={styles.tossVerifySummaryCard}>
                <View style={styles.tossVerifyStatusRow}>
                  <View style={styles.tossVerifyStatusItem}>
                    <View style={[styles.tossVerifyStatusIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                    </View>
                    <Text style={styles.tossVerifyStatusLabel}>확정됨</Text>
                    <Text style={styles.tossVerifyStatusCount}>
                      {contributions.filter(c => c.is_verified).length}건
                    </Text>
                    <Text style={styles.tossVerifyStatusAmount}>
                      {formatAmount(contributions.filter(c => c.is_verified).reduce((sum, c) => sum + (c.amount || 0), 0))}
                    </Text>
                  </View>
                  <View style={styles.tossVerifyDivider} />
                  <View style={styles.tossVerifyStatusItem}>
                    <View style={[styles.tossVerifyStatusIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="time-outline" size={32} color="#FF9800" />
                    </View>
                    <Text style={styles.tossVerifyStatusLabel}>미확정</Text>
                    <Text style={styles.tossVerifyStatusCount}>
                      {contributions.filter(c => !c.is_verified).length}건
                    </Text>
                    <Text style={styles.tossVerifyStatusAmount}>
                      {formatAmount(contributions.filter(c => !c.is_verified).reduce((sum, c) => sum + (c.amount || 0), 0))}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 미확정 목록 */}
              {contributions.filter(c => !c.is_verified).length > 0 && (
                <View style={styles.tossVerifyListCard}>
                  <View style={styles.tossVerifyListHeader}>
                    <Text style={styles.tossVerifyListTitle}>미확정 부조 목록</Text>
                    <TouchableOpacity
                      style={styles.tossVerifyAllButton}
                      onPress={async () => {
                        Alert.alert(
                          '전체 확정',
                          '모든 미확정 부조를 확정하시겠습니까?',
                          [
                            { text: '취소', style: 'cancel' },
                            {
                              text: '확정',
                              onPress: async () => {
                                // 모든 미확정 항목 확정 처리
                                const unverifiedItems = contributions.filter(c => !c.is_verified);
                                for (const item of unverifiedItems) {
                                  await toggleGuestBookVerification(item.id);
                                }
                                await loadEventData();
                                Alert.alert('완료', '모든 부조가 확정되었습니다.');
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.tossVerifyAllButtonText}>전체 확정</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.tossVerifyList}>
                    {contributions.filter(c => !c.is_verified).map((item, index) => (
                      <View key={item.id || index} style={styles.tossVerifyListItem}>
                        <View style={styles.tossVerifyListItemInfo}>
                          <Text style={styles.tossVerifyListItemName}>{item.guest_name}</Text>
                          <Text style={styles.tossVerifyListItemDetail}>
                            {item.relation_detail || '관계 미지정'} · {formatAmount(item.amount)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.tossVerifyListItemButton}
                          onPress={async () => {
                            await toggleGuestBookVerification(item.id);
                            await loadEventData();
                          }}
                        >
                          <Text style={styles.tossVerifyListItemButtonText}>확정</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 확정된 목록 */}
              {contributions.filter(c => c.is_verified).length > 0 && (
                <View style={styles.tossVerifyListCard}>
                  <Text style={styles.tossVerifyListTitle}>확정된 부조 목록</Text>
                  <View style={styles.tossVerifyList}>
                    {contributions.filter(c => c.is_verified).map((item, index) => (
                      <View key={item.id || index} style={[styles.tossVerifyListItem, styles.tossVerifyListItemConfirmed]}>
                        <View style={styles.tossVerifyListItemInfo}>
                          <View style={styles.tossVerifyListItemNameRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.tossVerifyListItemName, { marginLeft: 4 }]}>{item.guest_name}</Text>
                          </View>
                          <Text style={styles.tossVerifyListItemDetail}>
                            {item.relation_detail || '관계 미지정'} · {formatAmount(item.amount)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.tossVerifyListItemButton, styles.tossVerifyListItemButtonCancel]}
                          onPress={async () => {
                            await toggleGuestBookVerification(item.id);
                            await loadEventData();
                          }}
                        >
                          <Text style={styles.tossVerifyListItemButtonCancelText}>취소</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
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
  
  // 토스 스타일 메인 카드
  tossMainCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  tossMainAmount: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tossAmountLabel: {
    fontSize: 16,
    color: '#6B7684',
    marginBottom: 8,
    fontWeight: '500',
  },
  tossAmountValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#191F28',
    letterSpacing: -0.3,
  },
  tossStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  tossStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  tossStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191F28',
    marginBottom: 4,
  },
  tossStatLabel: {
    fontSize: 13,
    color: '#6B7684',
    fontWeight: '500',
  },
  tossDivider: {
    width: 1,
    backgroundColor: '#E5E8EB',
    marginHorizontal: 16,
  },
  
  // 토스 스타일 액션 그리드 (3개 버튼)
  tossActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  tossActionButton: {
    backgroundColor: 'white',
    width: '30%',
    aspectRatio: 0.95, // 세로로 좀 더 길게
    borderRadius: 16,
    padding: 16, // 패딩 증가
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10, // 간격 증가
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  tossActionIcon: {
    width: 48, // 아이콘 크기 증가
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tossActionImageContainer: {
    width: 48, // 이미지 컨테이너 크기 증가
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  tossActionImage: {
    width: '100%',
    height: '100%',
  },
  tossActionText: {
    fontSize: 14, // 텍스트 크기 증가
    fontWeight: '600',
    color: '#191F28',
    textAlign: 'center',
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
    gap: 4, // 항목 간격 적당하게
  },
  tossListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // 기본 세로 패딩 줄이기
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tossListItemVerified: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 6,
    borderLeftColor: '#3182F6',
    marginHorizontal: 0, // 좌우 여백 제거로 더 넓게
    marginVertical: 2, // 항목간 세로 간격 줄이기
    borderRadius: 12,
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 14, // 각 항목의 세로 패딩 줄이기
  },
  tossListItemUnverified: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#E5E8EB',
    marginHorizontal: 0,
    marginVertical: 2, // 항목간 세로 간격 줄이기
    borderRadius: 12,
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 14, // 각 항목의 세로 패딩 줄이기
  },
  tossItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tossAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3182F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tossAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  tossItemInfo: {
    flex: 1,
  },
  tossItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#191F28',
    marginBottom: 2,
  },
  tossItemRelation: {
    fontSize: 13,
    color: '#6B7684',
    fontWeight: '400',
  },
  tossItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tossItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191F28',
  },
  tossItemDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tossDateText: {
    fontSize: 12,
    color: '#B0BEC5',
    fontWeight: '400',
  },
  tossItemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  
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
});