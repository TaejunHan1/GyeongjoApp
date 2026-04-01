// src/screens/main/MyEventsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../styles/constants';
import { getUserEvents, getEventStatistics, deleteEvent, getEventContributions } from '../../lib/supabaseHelper';
import { supabase } from '../../lib/supabase';

export default function MyEventsScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [activeTab, setActiveTab] = useState('hosted'); // hosted, participated
  const [hostedEvents, setHostedEvents] = useState([]);
  const [participatedEvents, setParticipatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hostedFilter, setHostedFilter] = useState('all'); // all, active, completed
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const CACHE_DURATION = 30000; // 30초 캐시

  // 화면 포커스 시 데이터 새로고침 (캐시 적용)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (dataLoaded && (now - lastLoadTime < CACHE_DURATION)) {
        return; // 캐시 유효 → 로딩 건너뛰기
      }
      loadAllData();
    }, [dataLoaded, lastLoadTime])
  );

  // 디버그: 테스트 데이터 확인/생성
  const debugCreateTestContribution = async () => {
    try {
      console.log('🔍 테스트 개인 일정 생성 중...');
      
      if (!userInfo || !userInfo.userId) {
        console.error('🔴 userInfo가 없거나 userId가 없음:', userInfo);
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        return;
      }

      console.log('🔍 테스트 데이터를 생성할 사용자 ID:', userInfo.userId);

      // 테스트 personal_schedule 항목 생성
      const testPersonalSchedule = {
        user_id: userInfo.userId,
        title: '테스트 결혼식',
        event_type: 'wedding',
        event_date: '2025-08-30',
        location: '테스트 웨딩홀',
        notes: '테스트용 개인 일정입니다',
        is_reminder_set: false
      };

      const { data: newSchedule, error: createError } = await supabase
        .from('personal_schedules')
        .insert([testPersonalSchedule])
        .select();

      if (createError) {
        console.error('🔴 테스트 개인 일정 생성 실패:', createError);
        Alert.alert('오류', `테스트 데이터 생성 실패: ${createError.message}`);
      } else {
        console.log('✅ 테스트 개인 일정 생성 성공:', newSchedule);
        Alert.alert('성공', '테스트 개인 일정이 생성되었습니다!');
        // 데이터 새로고침
        loadParticipatedEvents();
      }
    } catch (error) {
      console.error('🔴 테스트 개인 일정 생성 오류:', error);
      Alert.alert('오류', `오류 발생: ${error.message}`);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadHostedEvents(),
        loadParticipatedEvents()
      ]);
      setDataLoaded(true);
      setLastLoadTime(Date.now());
    } catch (error) {
      console.error('전체 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 기반으로 이벤트 상태 자동 판별
  const determineEventStatus = (eventDate) => {
    if (!eventDate) return 'active';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDateObj = new Date(eventDate);
    eventDateObj.setHours(0, 0, 0, 0);

    return eventDateObj >= today ? 'active' : 'completed';
  };

  const loadHostedEvents = async () => {
    try {
      const result = await getUserEvents();
      
      if (result.success) {
        // 🔥 개인 일정 제외하고 실제 경조사만 필터링
        const hostedEventsOnly = (result.data || []).filter(event => 
          !event.is_personal_schedule && !event.isPersonalSchedule && event.source !== 'personal'
        );
        
        // 통계 정보를 포함한 이벤트 데이터 가져오기
        const eventsWithStats = await Promise.all(
          hostedEventsOnly.map(async (event) => {
            try {
              const statsResult = await getEventStatistics(event.id);
              // 날짜 기반으로 상태 자동 판별
              const autoStatus = determineEventStatus(event.event_date);
              
              return {
                ...event,
                status: autoStatus, // 자동 판별된 상태로 업데이트
                stats: {
                  totalContributions: statsResult.data?.totalContributions || 0,
                  totalAmount: statsResult.data?.totalAmount || 0,
                  averageAmount: statsResult.data?.averageAmount || 0,
                  participantCount: statsResult.data?.totalContributions || 0 // totalContributions가 실제 참여자 수
                }
              };
            } catch (error) {
              console.error('통계 로딩 오류:', error);
              const autoStatus = determineEventStatus(event.event_date);
              return {
                ...event,
                status: autoStatus,
                stats: {
                  totalContributions: 0,
                  totalAmount: 0,
                  averageAmount: 0,
                  participantCount: 0
                }
              };
            }
          })
        );
        setHostedEvents(eventsWithStats);
      } else {
        console.error('주최 이벤트 로딩 실패:', result.error);
        setHostedEvents([]);
      }
    } catch (error) {
      console.error('주최 이벤트 로딩 오류:', error);
      setHostedEvents([]);
    }
  };

  const loadParticipatedEvents = async () => {
    try {
      if (!userInfo?.userId) {
        setParticipatedEvents([]);
        return;
      }

      const { data: personalSchedules, error: schedulesError } = await supabase
        .from('personal_schedules')
        .select('*')
        .eq('user_id', userInfo.userId)
        .order('created_at', { ascending: false });

      if (schedulesError) {
        console.error('personal_schedules 조회 에러:', schedulesError);
        setParticipatedEvents([]);
        return;
      }

      if (!personalSchedules || personalSchedules.length === 0) {
        setParticipatedEvents([]);
        return;
      }

      const participatedEventsArray = personalSchedules.map(schedule => ({
        id: schedule.id,
        event_name: schedule.title,
        event_type: schedule.event_type,
        event_date: schedule.event_date,
        location: schedule.location,
        main_person_name: '개인 일정',
        participationInfo: {
          contributedAmount: 0,
          contributionDate: schedule.created_at,
          relation: '개인 참여',
          message: schedule.notes
        },
        source: 'personal'
      }));

      setParticipatedEvents(participatedEventsArray);
    } catch (error) {
      console.error('참여 이벤트 로딩 오류:', error);
      setParticipatedEvents([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setDataLoaded(false); // 캐시 무효화
    await loadAllData();
    setRefreshing(false);
  };

  const handleDeleteEvent = (eventId, eventName) => {
    Alert.alert(
      '경조사 삭제',
      `"${eventName}"을(를) 삭제하시겠어요?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteEvent(eventId);
              if (result.success) {
                Alert.alert('완료', '경조사가 삭제되었습니다.');
                loadHostedEvents(); // 목록 새로고침
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

  // 주최 이벤트 필터링
  const filteredHostedEvents = hostedEvents.filter(event => {
    if (hostedFilter === 'all') return true;
    if (hostedFilter === 'active') return event.status === 'active';
    if (hostedFilter === 'completed') return event.status === 'completed';
    return true;
  });

  const renderTabButton = (tab, title, count) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabText,
        activeTab === tab && styles.tabTextActive
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.tabCount,
        activeTab === tab && styles.tabCountActive
      ]}>
        ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderHostedEvents = () => (
    <>
      {/* 필터 */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {[
            { id: 'all', label: '전체', count: hostedEvents.length },
            { id: 'active', label: '진행중', count: hostedEvents.filter(e => e.status === 'active').length },
            { id: 'completed', label: '완료', count: hostedEvents.filter(e => e.status === 'completed').length }
          ].map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                hostedFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => setHostedFilter(filter.id)}
            >
              <Text style={[
                styles.filterText,
                hostedFilter === filter.id && styles.filterTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 주최 이벤트 목록 */}
      <View style={styles.eventsList}>
        {filteredHostedEvents.length > 0 ? (
          filteredHostedEvents.map((event) => (
            <HostedEventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              onDelete={() => handleDeleteEvent(event.id, event.event_name)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>
              {hostedFilter === 'all' ? '주최한 경조사가 없어요' 
               : hostedFilter === 'active' ? '진행중인 경조사가 없어요'
               : '완료된 경조사가 없어요'}
            </Text>
            <Text style={styles.emptySubtitle}>
              홈 화면에서 첫 번째 경조사를 만들어보세요
            </Text>
          </View>
        )}
      </View>
    </>
  );

  const renderParticipatedEvents = () => (
    <View style={styles.eventsList}>
      {participatedEvents.length > 0 ? (
        participatedEvents.map((event) => (
          <ParticipatedEventCard
            key={event.id}
            event={event}
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="gift-outline" size={64} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>참여한 경조사가 없어요</Text>
          <Text style={styles.emptySubtitle}>
            다른 분의 경조사에 참여하여 부조금을 기록해보세요
          </Text>
          
          {/* 디버그 버튼 - 개발용 */}
          <TouchableOpacity 
            style={[styles.addParticipationButton, { backgroundColor: Colors.error, marginBottom: 12 }]}
            onPress={debugCreateTestContribution}
          >
            <Ionicons name="bug" size={20} color={Colors.white} />
            <Text style={styles.addParticipationText}>테스트 데이터 생성</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.addParticipationButton}
            onPress={() => {
              // TODO: 참여 경조사 추가 화면으로 이동
              Alert.alert('준비중', '참여 경조사 추가 기능을 준비중입니다.');
            }}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addParticipationText}>참여 기록 추가</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 경조사</Text>
        <Text style={styles.headerSubtitle}>경조사 관리 및 부조금 기록</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabContainer}>
        {renderTabButton('hosted', '주최한 경조사', hostedEvents.length)}
        {renderTabButton('participated', '참여한 경조사', participatedEvents.length)}
      </View>

      {/* 콘텐츠 */}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={32} color={Colors.gray400} />
            <Text style={styles.loadingText}>불러오는 중...</Text>
          </View>
        ) : activeTab === 'hosted' ? (
          renderHostedEvents()
        ) : (
          renderParticipatedEvents()
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 주최 이벤트 카드 컴포넌트
const HostedEventCard = ({ event, onPress, onDelete }) => {
  const getEventIcon = () => {
    switch (event.event_type) {
      case 'wedding': return 'heart';
      case 'funeral': return 'flower';
      case 'birthday': return 'gift';
      default: return 'calendar';
    }
  };

  const getEventColor = () => {
    switch (event.event_type) {
      case 'wedding': return Colors.wedding;
      case 'funeral': return Colors.funeral;
      case 'birthday': return Colors.celebration;
      default: return Colors.other;
    }
  };

  const getStatusBadge = () => {
    const isActive = event.status === 'active';
    return {
      backgroundColor: isActive ? Colors.success : Colors.gray300,
      text: isActive ? '진행중' : '완료',
      textColor: isActive ? Colors.white : Colors.textSecondary,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0원';
    
    // 백만원 이상이면 만원 단위로 표시
    if (amount >= 1000000) {
      const manWon = Math.floor(amount / 10000);
      return `${manWon.toLocaleString()}만원`;
    }
    
    return `${amount.toLocaleString()}원`;
  };

  const statusBadge = getStatusBadge();
  const stats = event.stats || {};

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress}>
      <View style={styles.eventHeader}>
        <View style={styles.eventIconContainer}>
          <View style={[styles.eventIcon, { backgroundColor: getEventColor() }]}>
            {event.event_type === 'wedding' ? (
              <Image 
                source={require('../../../assets/images/Wedding.png')}
                style={styles.eventIconImage}
                resizeMode="contain"
              />
            ) : event.event_type === 'funeral' ? (
              <Image 
                source={require('../../../assets/images/Funeral.png')}
                style={styles.eventIconImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={getEventIcon()} size={20} color={Colors.white} />
            )}
          </View>
          <View style={styles.eventBasicInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.event_name}
            </Text>
            <View style={styles.eventSubInfo}>
              <Text style={styles.eventType}>
                {event.event_type === 'wedding' ? '결혼식' : 
                 event.event_type === 'funeral' ? '장례식' : 
                 event.event_type === 'birthday' ? '생일' : '기타'}
              </Text>
              <Text style={styles.eventTypeDivider}>·</Text>
              <Text style={styles.eventDate}>
                {formatDate(event.event_date)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.eventActions}>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusBadge.textColor }]}>
              {statusBadge.text}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 부조금 통계 */}
      <View style={styles.eventStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.participantCount || 0}명</Text>
          <Text style={styles.statLabel}>참여자</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatAmount(stats.totalAmount)}</Text>
          <Text style={styles.statLabel}>총 부조금</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatAmount(Math.round(stats.averageAmount))}</Text>
          <Text style={styles.statLabel}>평균</Text>
        </View>
      </View>

      <View style={styles.eventFooter}>
        <Text style={styles.eventHost}>
          주최: {event.main_person_name || '미입력'}
        </Text>
        <View style={styles.eventFooterRight}>
          <Text style={styles.viewDetailsText}>부조금 상세보기</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 참여 이벤트 카드 컴포넌트
const ParticipatedEventCard = ({ event, onPress }) => {
  const getEventIcon = () => {
    switch (event.event_type) {
      case 'wedding': return 'heart';
      case 'funeral': return 'flower';
      case 'birthday': return 'gift';
      default: return 'calendar';
    }
  };

  const getEventColor = () => {
    switch (event.event_type) {
      case 'wedding': return Colors.wedding;
      case 'funeral': return Colors.funeral;
      case 'birthday': return Colors.celebration;
      default: return Colors.other;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0원';
    
    // 백만원 이상이면 만원 단위로 표시
    if (amount >= 1000000) {
      const manWon = Math.floor(amount / 10000);
      return `${manWon.toLocaleString()}만원`;
    }
    
    return `${amount.toLocaleString()}원`;
  };

  const participationInfo = event.participationInfo || {};

  return (
    <TouchableOpacity style={styles.participatedEventCard} onPress={onPress}>
      <View style={styles.eventHeader}>
        <View style={styles.eventIconContainer}>
          <View style={[styles.eventIcon, { backgroundColor: getEventColor() }]}>
            {event.event_type === 'wedding' ? (
              <Image 
                source={require('../../../assets/images/Wedding.png')}
                style={styles.eventIconImage}
                resizeMode="contain"
              />
            ) : event.event_type === 'funeral' ? (
              <Image 
                source={require('../../../assets/images/Funeral.png')}
                style={styles.eventIconImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={getEventIcon()} size={20} color={Colors.white} />
            )}
          </View>
          <View style={styles.eventBasicInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.event_name}
            </Text>
            <View style={styles.eventSubInfo}>
              <Text style={styles.eventType}>
                {event.event_type === 'wedding' ? '결혼식' : 
                 event.event_type === 'funeral' ? '장례식' : 
                 event.event_type === 'birthday' ? '생일' : '기타'}
              </Text>
              <Text style={styles.eventTypeDivider}>·</Text>
              <Text style={styles.eventDate}>
                {formatDate(event.event_date)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.participatedBadge}>
          <Text style={styles.participatedBadgeText}>참여</Text>
        </View>
      </View>

      {/* 참여 정보 */}
      <View style={styles.participationInfoSection}>
        {/* 개인 일정이 아닌 경우에만 부조금 표시 */}
        {event.source !== 'personal' && (
          <View style={styles.participationRow}>
            <Text style={styles.participationLabel}>내 부조금</Text>
            <Text style={styles.participationAmount}>
              {formatAmount(participationInfo.contributedAmount)}
            </Text>
          </View>
        )}
        {participationInfo.relation && (
          <View style={styles.participationRow}>
            <Text style={styles.participationLabel}>
              {event.source === 'personal' ? '일정 타입' : '관계'}
            </Text>
            <Text style={styles.participationValue}>
              {participationInfo.relation}
            </Text>
          </View>
        )}
        {participationInfo.contributionDate && (
          <View style={styles.participationRow}>
            <Text style={styles.participationLabel}>
              {event.source === 'personal' ? '등록 일자' : '참여 일자'}
            </Text>
            <Text style={styles.participationValue}>
              {formatDate(participationInfo.contributionDate)}
            </Text>
          </View>
        )}
        {participationInfo.message && (
          <View style={styles.participationRow}>
            <Text style={styles.participationLabel}>메모</Text>
            <Text style={styles.participationValue}>
              {participationInfo.message}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.eventFooter}>
        <Text style={styles.eventHost}>
          주최: {event.main_person_name || '미입력'}
        </Text>
        <View style={styles.eventFooterRight}>
          <Text style={styles.viewDetailsText}>상세보기</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  
  // 헤더
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // 탭
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: Colors.gray50,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabCountActive: {
    color: Colors.white,
  },
  
  // 필터 (주최 이벤트용)
  filterSection: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
  },
  
  // 이벤트 목록
  eventsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden', // 동그라미 경계를 벗어나는 이미지 잘라내기
  },
  eventIconImage: {
    width: 80,
    height: 80,
  },
  eventBasicInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventType: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  eventTypeDivider: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: 6,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  
  // 통계
  eventStats: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray200,
    marginHorizontal: 16,
  },
  
  // 푸터
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventHost: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  eventFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  
  // 빈 상태
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  
  // 참여 추가 버튼
  addParticipationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addParticipationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 참여 이벤트 카드
  participatedEventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  participatedBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participatedBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
  },
  participationInfoSection: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  participationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participationLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  participationAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  participationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },

  // 로딩
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});