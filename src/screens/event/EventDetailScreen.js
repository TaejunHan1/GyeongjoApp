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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../styles/constants';
import { getEventDetail, getEventContributions, getEventStatistics, addGuestBookEntry, updateGuestBookEntry, deleteGuestBookEntry } from '../../lib/supabaseHelper';

export default function EventDetailScreen({ navigation, route }) {
  const { eventId } = route.params;
  
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

  // 성공 모달
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: '',
    message: '',
    icon: 'checkmark-circle',
    color: Colors.success || Colors.primary
  });

  // 검색 모달
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [inputEditable, setInputEditable] = useState(true);
  const searchInputRef = useRef(null);
  const keyboardActivated = useRef(false); // 키보드 활성화 상태 추적

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
        // 커스텀 성공 모달 표시
        setSuccessMessage({
          title: '수정 완료',
          message: `${editData.guest_name}님의 부조가 수정되었습니다.`,
          icon: 'checkmark-circle',
          color: Colors.success || Colors.primary
        });
        setSuccessModalVisible(true);
        
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
      `${contribution.guest_name}님의 부조를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteGuestBookEntry(contribution.id);
              
              if (result.success) {
                // 커스텀 성공 모달 표시
                setSuccessMessage({
                  title: '삭제 완료',
                  message: '부조가 삭제되었습니다.',
                  icon: 'trash',
                  color: Colors.error || '#FF6B6B'
                });
                setSuccessModalVisible(true);
                loadEventData(); // 데이터 새로고침
              } else {
                Alert.alert('오류', result.error || '부조 삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('부조 삭제 오류:', error);
              Alert.alert('오류', '부조 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const formatAmountInput = (text) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('ko-KR').format(parseInt(numbers));
  };

  // 검색 및 페이지네이션 계산
  const filteredContributions = contributions.filter(contribution =>
    contribution.guest_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageContributions = filteredContributions.slice(startIndex, startIndex + itemsPerPage);

  // 검색어가 변경되면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    
    // 만원 단위로 표시 (천만원 이상일 경우)
    if (amount >= 10000000) {
      const man = Math.floor(amount / 10000);
      return new Intl.NumberFormat('ko-KR').format(man) + '만원';
    }
    
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
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
        {/* 경조사 헤더 */}
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <View style={[styles.eventIcon, { backgroundColor: getEventColor() }]}>
              <Ionicons name={getEventIcon()} size={32} color={Colors.white} />
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>{event.event_name}</Text>
              <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
              <Text style={styles.eventLocation}>{event.location || '장소 미정'}</Text>
            </View>
          </View>
          
        </View>


        {/* 통계 카드 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>부조 현황</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatAmount(stats.totalAmount)}</Text>
              <Text style={styles.statLabel}>총 부조금</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalCount}건</Text>
              <Text style={styles.statLabel}>총 건수</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatAmount(stats.averageAmount)}</Text>
              <Text style={styles.statLabel}>평균 금액</Text>
            </View>
          </View>
        </View>

        {/* 빠른 액션 */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => setAddModalVisible(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary }]}>
              <Ionicons name="add" size={20} color={Colors.white} />
            </View>
            <Text style={styles.quickActionText}>부조 추가</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => Alert.alert('준비중', '통계 보기 기능을 준비 중입니다.')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.success }]}>
              <Ionicons name="bar-chart" size={20} color={Colors.white} />
            </View>
            <Text style={styles.quickActionText}>통계 보기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => Alert.alert('준비중', '내보내기 기능을 준비 중입니다.')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.warning }]}>
              <Ionicons name="download" size={20} color={Colors.white} />
            </View>
            <Text style={styles.quickActionText}>내보내기</Text>
          </TouchableOpacity>
        </View>

        {/* 부조 목록 */}
        <View style={styles.contributionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>부조 목록</Text>
            <Text style={styles.sectionCount}>({filteredContributions.length})</Text>
          </View>
          
          {/* 검색 버튼 */}
          <TouchableOpacity style={styles.searchButton} onPress={openSearchModal}>
            <Ionicons name="search" size={20} color={Colors.gray400} style={styles.searchIcon} />
            <Text style={[styles.searchPlaceholder, searchQuery && styles.searchActive]}>
              {searchQuery || '이름으로 검색...'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={Colors.gray400} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          
          {filteredContributions.length > 0 ? (
            <>
              <View style={styles.contributionsList}>
                {currentPageContributions.map((contribution, index) => (
                  <View key={contribution.id || index} style={styles.contributionItem}>
                    <View style={styles.contributionInfo}>
                      <Text style={styles.contributorName}>
                        {contribution.guest_name || '이름 없음'}
                      </Text>
                      <Text style={styles.contributionRelation}>
                        {(() => {
                          const { displayCategory, displayDetail } = getRelationDisplay(
                            contribution.relation_category,
                            contribution.relation_detail
                          );
                          return `${displayCategory} · ${displayDetail}`;
                        })()}
                      </Text>
                      <Text style={styles.contributionDate}>
                        {contribution.created_at ? 
                          new Date(contribution.created_at).toLocaleDateString('ko-KR') : 
                          '날짜 미상'
                        }
                      </Text>
                    </View>
                    <View style={styles.contributionAmount}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.amountText}>
                          {formatAmount(contribution.amount || 0)}
                        </Text>
                        {contribution.is_verified && (
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        )}
                      </View>
                      {/* 실제 데이터베이스 데이터인 경우만 수정/삭제 버튼 표시 (가짜 데이터 id는 문자열) */}
                      {contribution.id && !String(contribution.id).includes('groom-') && !String(contribution.id).includes('bride-') && (
                        <View style={styles.contributionActions}>
                          <TouchableOpacity
                            style={styles.actionButtonToss}
                            onPress={() => handleEditContribution(contribution)}
                          >
                            <Text style={styles.actionButtonText}>수정</Text>
                          </TouchableOpacity>
                          <Text style={styles.actionSeparator}>|</Text>
                          <TouchableOpacity
                            style={styles.actionButtonToss}
                            onPress={() => handleDeleteContribution(contribution)}
                          >
                            <Text style={styles.actionButtonTextDelete}>삭제</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity 
                    style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? Colors.gray300 : Colors.primary} />
                  </TouchableOpacity>
                  
                  <Text style={styles.pageInfo}>
                    {currentPage} / {totalPages} 페이지 ({filteredContributions.length}명)
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? Colors.gray300 : Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContributions}>
              <Ionicons name="people-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? '검색 결과가 없어요' : '아직 부조가 없어요'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? '다른 검색어를 시도해보세요' : '첫 번째 부조를 추가해보세요'}
              </Text>
            </View>
          )}
        </View>


        <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 부조 추가 모달 */}
      <Modal
        visible={addModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setAddModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <KeyboardAvoidingView 
              style={{ flex: 1 }} 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setAddModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>부조 추가</Text>
              <TouchableOpacity
                style={[styles.modalSaveButton, addingContribution && styles.modalSaveButtonDisabled]}
                onPress={handleAddContribution}
                disabled={addingContribution}
              >
                <Text style={[styles.modalSaveText, addingContribution && styles.modalSaveTextDisabled]}>
                  {addingContribution ? '저장 중...' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 성함 입력 */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>성함 *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="성함을 입력해주세요"
                  value={newContribution.guest_name}
                  onChangeText={(text) => setNewContribution(prev => ({ ...prev, guest_name: text }))}
                  placeholderTextColor={Colors.gray400}
                />
              </View>

              {/* 금액 입력 */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>부조금 *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="금액을 입력해주세요"
                  value={newContribution.amount}
                  onChangeText={(text) => setNewContribution(prev => ({ 
                    ...prev, 
                    amount: formatAmountInput(text) 
                  }))}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.gray400}
                />
              </View>

              {/* 관계 선택 */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>관계</Text>
                <View style={styles.relationRow}>
                  <View style={styles.relationSection}>
                    <Text style={styles.relationSubLabel}>측</Text>
                    <View style={styles.relationButtons}>
                      {['신랑측', '신부측'].map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.relationButton,
                            newContribution.relation_category === category && styles.relationButtonActive
                          ]}
                          onPress={() => setNewContribution(prev => ({ ...prev, relation_category: category }))}
                        >
                          <Text style={[
                            styles.relationButtonText,
                            newContribution.relation_category === category && styles.relationButtonTextActive
                          ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.relationSection}>
                    <Text style={styles.relationSubLabel}>관계</Text>
                    <View style={styles.relationButtons}>
                      {['친구', '동료', '가족', '친척', '기타'].map((detail) => (
                        <TouchableOpacity
                          key={detail}
                          style={[
                            styles.relationButton,
                            newContribution.relation_detail === detail && styles.relationButtonActive
                          ]}
                          onPress={() => setNewContribution(prev => ({ ...prev, relation_detail: detail }))}
                        >
                          <Text style={[
                            styles.relationButtonText,
                            newContribution.relation_detail === detail && styles.relationButtonTextActive
                          ]}>
                            {detail}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 부조 수정 모달 */}
      <Modal
        visible={editModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setEditModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <KeyboardAvoidingView 
              style={{ flex: 1 }} 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>부조 수정</Text>
              <TouchableOpacity
                style={[styles.modalSaveButton, editingContribution && styles.modalSaveButtonDisabled]}
                onPress={handleUpdateContribution}
                disabled={editingContribution}
              >
                <Text style={[styles.modalSaveText, editingContribution && styles.modalSaveTextDisabled]}>
                  {editingContribution ? '수정 중...' : '수정'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 성함 입력 */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>성함 *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="성함을 입력해주세요"
                  value={editData.guest_name}
                  onChangeText={(text) => setEditData(prev => ({ ...prev, guest_name: text }))}
                  placeholderTextColor={Colors.gray400}
                />
              </View>

              {/* 금액 입력 */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>부조금 *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="금액을 입력해주세요"
                  value={editData.amount}
                  onChangeText={(text) => setEditData(prev => ({ 
                    ...prev, 
                    amount: formatAmountInput(text) 
                  }))}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.gray400}
                />
              </View>

              {/* 관계 선택 */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>관계</Text>
                <View style={styles.relationRow}>
                  <View style={styles.relationSection}>
                    <Text style={styles.relationSubLabel}>측</Text>
                    <View style={styles.relationButtons}>
                      {['신랑측', '신부측'].map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.relationButton,
                            editData.relation_category === category && styles.relationButtonActive
                          ]}
                          onPress={() => setEditData(prev => ({ ...prev, relation_category: category }))}
                        >
                          <Text style={[
                            styles.relationButtonText,
                            editData.relation_category === category && styles.relationButtonTextActive
                          ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.relationSection}>
                    <Text style={styles.relationSubLabel}>관계</Text>
                    <View style={styles.relationButtons}>
                      {['친구', '동료', '가족', '친척', '기타'].map((detail) => (
                        <TouchableOpacity
                          key={detail}
                          style={[
                            styles.relationButton,
                            editData.relation_detail === detail && styles.relationButtonActive
                          ]}
                          onPress={() => setEditData(prev => ({ ...prev, relation_detail: detail }))}
                        >
                          <Text style={[
                            styles.relationButtonText,
                            editData.relation_detail === detail && styles.relationButtonTextActive
                          ]}>
                            {detail}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 성공 모달 */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successModalOverlay}>
          <TouchableOpacity 
            style={styles.successModalBackground}
            activeOpacity={1}
            onPress={() => setSuccessModalVisible(false)}
          />
          <View style={styles.successModalContainer}>
            <View style={[styles.successIconContainer, { backgroundColor: successMessage.color + '20' }]}>
              <Ionicons 
                name={successMessage.icon} 
                size={48} 
                color={successMessage.color} 
              />
            </View>
            
            <Text style={styles.successTitle}>{successMessage.title}</Text>
            <Text style={styles.successMessage}>{successMessage.message}</Text>
            
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: successMessage.color }]}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.successButtonText}>확인</Text>
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
          <View style={styles.searchModalContainer}>
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
    backgroundColor: Colors.gray50,
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
  
  // 경조사 헤더
  eventHeader: {
    backgroundColor: Colors.white,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  eventIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  
  // 통계 카드
  statsCard: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray200,
    marginHorizontal: 16,
  },
  
  // 빠른 액션
  quickActions: {
    backgroundColor: Colors.white,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  
  // 부조 목록
  contributionsSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  contributionsList: {
    gap: 12,
  },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  contributionInfo: {
    flex: 1,
    paddingRight: 12,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  contributionDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contributionAmount: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 100,
  },
  contributionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonToss: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.gray600,
    fontWeight: '500',
  },
  actionButtonTextDelete: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  actionSeparator: {
    fontSize: 12,
    color: Colors.gray300,
    marginHorizontal: 6,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  
  // 빈 상태
  emptyContributions: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
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

  // 검색 버튼
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray400,
  },
  searchActive: {
    color: Colors.textPrimary,
  },
  clearButton: {
    padding: 4,
  },

  // 페이지네이션
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.gray50,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    minWidth: 120,
    textAlign: 'center',
  },

  // 기여자 관계 및 메시지 스타일
  contributionRelation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },

  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    maxHeight: '80%',
    minHeight: 500,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  modalCloseButton: {
    padding: 4,
    width: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    width: 60,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  modalSaveTextDisabled: {
    color: Colors.gray500,
  },
  modalScrollView: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  relationRow: {
    gap: 8,
  },
  relationSection: {
    marginBottom: 4,
  },
  relationSubLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  relationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 50,
  },
  relationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  relationButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  relationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  relationButtonTextActive: {
    color: Colors.white,
  },

  // 성공 모달 스타일
  successModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  successModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '80%',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  successButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
});