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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../styles/constants';
import { getUserEvents, deleteEvent } from '../../lib/supabaseHelper';

export default function MyEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, completed

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    try {
      setLoading(true);
      const result = await getUserEvents();
      
      if (result.success) {
        setEvents(result.data || []);
      } else {
        Alert.alert('오류', result.error || '경조사 목록을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('Events loading error:', error);
      Alert.alert('오류', '경조사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
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
                loadEvents(); // 목록 새로고침
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

  // 필터링된 이벤트 목록
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'active') return event.status === 'active';
    if (filter === 'completed') return event.status === 'completed';
    return true;
  });

  // 필터 버튼 스타일
  const getFilterButtonStyle = (filterType) => ({
    ...styles.filterButton,
    backgroundColor: filter === filterType ? Colors.primary : Colors.gray100,
  });

  const getFilterTextStyle = (filterType) => ({
    ...styles.filterText,
    color: filter === filterType ? Colors.white : Colors.textSecondary,
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 경조사</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* 필터 */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={getFilterButtonStyle('all')}
            onPress={() => setFilter('all')}
          >
            <Text style={getFilterTextStyle('all')}>전체</Text>
            <Text style={getFilterTextStyle('all')}>({events.length})</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={getFilterButtonStyle('active')}
            onPress={() => setFilter('active')}
          >
            <Text style={getFilterTextStyle('active')}>진행중</Text>
            <Text style={getFilterTextStyle('active')}>
              ({events.filter(e => e.status === 'active').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={getFilterButtonStyle('completed')}
            onPress={() => setFilter('completed')}
          >
            <Text style={getFilterTextStyle('completed')}>완료</Text>
            <Text style={getFilterTextStyle('completed')}>
              ({events.filter(e => e.status === 'completed').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 이벤트 목록 */}
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
        ) : filteredEvents.length > 0 ? (
          <View style={styles.eventsList}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                onDelete={() => handleDeleteEvent(event.id, event.event_name)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? '등록된 경조사가 없어요' 
               : filter === 'active' ? '진행중인 경조사가 없어요'
               : '완료된 경조사가 없어요'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' ? '첫 번째 경조사를 만들어보세요'
               : '다른 필터를 선택해보세요'}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <Text style={styles.createButtonText}>경조사 만들기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 이벤트 카드 컴포넌트
const EventCard = ({ event, onPress, onDelete }) => {
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

  const statusBadge = getStatusBadge();

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress}>
      <View style={styles.eventHeader}>
        <View style={styles.eventIconContainer}>
          <View style={[styles.eventIcon, { backgroundColor: getEventColor() }]}>
            <Ionicons name={getEventIcon()} size={20} color={Colors.white} />
          </View>
          <View style={styles.eventBasicInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.event_name}
            </Text>
            <Text style={styles.eventDate}>
              {formatDate(event.event_date)}
            </Text>
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

      <View style={styles.eventStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>부조금</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0건</Text>
          <Text style={styles.statLabel}>참석자</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0원</Text>
          <Text style={styles.statLabel}>평균</Text>
        </View>
      </View>

      <View style={styles.eventFooter}>
        <Text style={styles.eventHost}>
          주최: {event.main_person_name || '미입력'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 필터
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // 콘텐츠
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 이벤트 목록
  eventsList: {
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
    fontSize: 18,
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
  
  // 빈 상태
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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