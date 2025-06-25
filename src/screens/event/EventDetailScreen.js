// src/screens/event/EventDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../styles/constants';
import { getEventDetail, getEventContributions, updateEvent, deleteEvent } from '../../lib/supabaseHelper';

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
      } else {
        Alert.alert('오류', eventResult.error || '경조사 정보를 불러올 수 없습니다.');
        navigation.goBack();
        return;
      }
      
      // 부조금 목록 로드
      const contributionsResult = await getEventContributions(eventId);
      if (contributionsResult.success) {
        setContributions(contributionsResult.data || []);
        calculateStats(contributionsResult.data || []);
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
    const confirmedCount = contributionsList.filter(item => item.is_confirmed).length;
    const averageAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
    
    setStats({
      totalAmount,
      totalCount,
      averageAmount,
      confirmedCount,
    });
  };

  const handleShareEvent = async () => {
    if (!event) return;
    
    try {
      const shareContent = {
        message: `📱 경조사 참석 안내\n\n${event.event_name}\n${event.event_date ? formatDate(event.event_date) : '날짜 미정'}\n${event.location || '장소 미정'}\n\n정담 앱에서 간편하게 부조하세요!`,
        title: event.event_name,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleEditEvent = () => {
    Alert.alert('준비중', '경조사 편집 기능을 준비 중입니다.');
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      '경조사 삭제',
      `"${event?.event_name}"을(를) 삭제하시겠어요?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteEvent(eventId);
              if (result.success) {
                Alert.alert('완료', '경조사가 삭제되었습니다.', [
                  { text: '확인', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('오류', result.error || '삭제에 실패했습니다.');
              }
            } catch (error) {
              Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleStatusToggle = async () => {
    if (!event) return;
    
    const newStatus = event.status === 'active' ? 'completed' : 'active';
    const statusText = newStatus === 'active' ? '진행중' : '완료';
    
    try {
      const result = await updateEvent(eventId, { status: newStatus });
      if (result.success) {
        setEvent({ ...event, status: newStatus });
        Alert.alert('완료', `경조사 상태가 "${statusText}"로 변경되었습니다.`);
      } else {
        Alert.alert('오류', result.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '상태 변경 중 오류가 발생했습니다.');
    }
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
          
          <View style={styles.eventActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShareEvent}>
              <Ionicons name="share-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditEvent}>
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDeleteEvent}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 상태 및 QR */}
        <View style={styles.statusSection}>
          <TouchableOpacity 
            style={[
              styles.statusButton,
              event.status === 'active' ? styles.activeStatus : styles.completedStatus
            ]}
            onPress={handleStatusToggle}
          >
            <Ionicons 
              name={event.status === 'active' ? 'play-circle' : 'checkmark-circle'} 
              size={20} 
              color={Colors.white} 
            />
            <Text style={styles.statusText}>
              {event.status === 'active' ? '진행중' : '완료'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={() => Alert.alert('준비중', 'QR 코드 기능을 준비 중입니다.')}
          >
            <Ionicons name="qr-code-outline" size={20} color={Colors.primary} />
            <Text style={styles.qrButtonText}>QR 코드</Text>
          </TouchableOpacity>
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
            onPress={() => navigation.navigate('Contribution', { 
              eventId, 
              eventName: event.event_name 
            })}
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
            <Text style={styles.sectionCount}>({stats.totalCount})</Text>
          </View>
          
          {contributions.length > 0 ? (
            <View style={styles.contributionsList}>
              {contributions.slice(0, 5).map((contribution, index) => (
                <View key={contribution.id || index} style={styles.contributionItem}>
                  <View style={styles.contributionInfo}>
                    <Text style={styles.contributorName}>
                      {contribution.contributor_name || '이름 없음'}
                    </Text>
                    <Text style={styles.contributionDate}>
                      {contribution.created_at ? 
                        new Date(contribution.created_at).toLocaleDateString('ko-KR') : 
                        '날짜 미상'
                      }
                    </Text>
                  </View>
                  <View style={styles.contributionAmount}>
                    <Text style={styles.amountText}>
                      {formatAmount(contribution.amount || 0)}
                    </Text>
                    {contribution.is_confirmed && (
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    )}
                  </View>
                </View>
              ))}
              
              {contributions.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => Alert.alert('준비중', '전체 목록 보기 기능을 준비 중입니다.')}
                >
                  <Text style={styles.viewAllText}>
                    더보기 ({contributions.length - 5}건)
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyContributions}>
              <Ionicons name="people-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>아직 부조가 없어요</Text>
              <Text style={styles.emptySubtitle}>첫 번째 부조를 추가해보세요</Text>
            </View>
          )}
        </View>

        {/* 경조사 정보 */}
        <View style={styles.eventInfoSection}>
          <Text style={styles.sectionTitle}>경조사 정보</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="person" label="주최자" value={event.main_person_name || '미입력'} />
            <InfoRow icon="call" label="연락처" value={event.host_phone || '미입력'} />
            <InfoRow icon="location" label="장소" value={event.location || '미입력'} />
            <InfoRow icon="calendar" label="등록일" value={
              event.created_at ? 
                new Date(event.created_at).toLocaleDateString('ko-KR') : 
                '알 수 없음'
            } />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 정보 행 컴포넌트
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  contributionInfo: {},
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
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
});