// src/screens/main/MyEventsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getUserEvents, getEventStatistics, deleteEvent } from '../../lib/supabaseHelper';
import { supabase } from '../../lib/supabase';

export default function MyEventsScreen({ navigation, userInfo }) {
  const [activeTab, setActiveTab] = useState('hosted');
  const [hostedEvents, setHostedEvents] = useState([]);
  const [participatedEvents, setParticipatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hostedFilter, setHostedFilter] = useState('all');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const CACHE_DURATION = 30000;

  // iOS 스타일 커스텀 삭제 확인 모달
  const [deleteAlert, setDeleteAlert] = useState({ visible: false, eventId: null, eventName: '' });

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (dataLoaded && now - lastLoadTime < CACHE_DURATION) return;
      loadAllData();
    }, [dataLoaded, lastLoadTime])
  );

  const determineEventStatus = (eventDate) => {
    if (!eventDate) return 'active';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(eventDate);
    d.setHours(0, 0, 0, 0);
    return d >= today ? 'active' : 'completed';
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadHostedEvents(), loadParticipatedEvents()]);
      setDataLoaded(true);
      setLastLoadTime(Date.now());
    } finally {
      setLoading(false);
    }
  };

  const loadHostedEvents = async () => {
    try {
      const result = await getUserEvents();
      if (!result.success) { setHostedEvents([]); return; }
      const only = (result.data || []).filter(e =>
        !e.is_personal_schedule && !e.isPersonalSchedule && e.source !== 'personal'
      );
      const withStats = await Promise.all(only.map(async (event) => {
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
          return { ...event, status: determineEventStatus(event.event_date), stats: { totalContributions: 0, totalAmount: 0, averageAmount: 0, verifiedCount: 0 } };
        }
      }));
      setHostedEvents(withStats);
    } catch {
      setHostedEvents([]);
    }
  };

  const loadParticipatedEvents = async () => {
    try {
      if (!userInfo?.userId) { setParticipatedEvents([]); return; }
      const { data, error } = await supabase
        .from('personal_schedules')
        .select('*')
        .eq('user_id', userInfo.userId)
        .order('created_at', { ascending: false });
      if (error || !data?.length) { setParticipatedEvents([]); return; }
      setParticipatedEvents(data.map(s => ({
        id: s.id,
        event_name: s.title,
        event_type: s.event_type,
        event_date: s.event_date,
        location: s.location,
        main_person_name: '개인 일정',
        participationInfo: { contributedAmount: 0, contributionDate: s.created_at, relation: '개인 참여', message: s.notes },
        source: 'personal',
      })));
    } catch {
      setParticipatedEvents([]);
    }
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
    setDeleteAlert({ visible: false, eventId: null, eventName: '' });
    try {
      const result = await deleteEvent(eventId);
      if (result.success) loadHostedEvents();
    } catch {}
  };

  const filteredHostedEvents = hostedEvents.filter(e => {
    if (hostedFilter === 'active') return e.status === 'active';
    if (hostedFilter === 'completed') return e.status === 'completed';
    return true;
  });

  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0원';
    if (amount >= 100000000) return `${Math.floor(amount / 100000000)}억원`;
    if (amount >= 10000) return `${Math.floor(amount / 10000).toLocaleString()}만원`;
    return `${amount.toLocaleString()}원`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 미정';
    const d = new Date(dateString);
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'wedding': return '결혼식';
      case 'funeral': return '장례식';
      case 'birthday': return '생일';
      default: return '기타';
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
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('hosted')} activeOpacity={0.7}>
          <Text style={[styles.tabText, activeTab === 'hosted' && styles.tabTextActive]}>
            주최한 경조사
          </Text>
          {hostedEvents.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'hosted' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'hosted' && styles.tabBadgeTextActive]}>
                {hostedEvents.length}
              </Text>
            </View>
          )}
          {activeTab === 'hosted' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('participated')} activeOpacity={0.7}>
          <Text style={[styles.tabText, activeTab === 'participated' && styles.tabTextActive]}>
            참여한 경조사
          </Text>
          {participatedEvents.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'participated' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'participated' && styles.tabBadgeTextActive]}>
                {participatedEvents.length}
              </Text>
            </View>
          )}
          {activeTab === 'participated' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3182F6" />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <Ionicons name="refresh" size={28} color="#C5CCD5" />
            <Text style={styles.loadingText}>불러오는 중...</Text>
          </View>
        ) : activeTab === 'hosted' ? (
          <>
            {/* 필터 칩 */}
            <View style={styles.filterChipRow}>
              {[
                { key: 'all', label: '전체', count: hostedEvents.length },
                { key: 'active', label: '진행중', count: hostedEvents.filter(e => e.status === 'active').length },
                { key: 'completed', label: '완료', count: hostedEvents.filter(e => e.status === 'completed').length },
              ].map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, hostedFilter === f.key && styles.filterChipActive]}
                  onPress={() => setHostedFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, hostedFilter === f.key && styles.filterChipTextActive]}>
                    {f.label} {f.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 이벤트 목록 */}
            {filteredHostedEvents.length > 0 ? (
              <View style={styles.listSection}>
                {filteredHostedEvents.map((event, index) => {
                    const unverified = (event.stats?.totalContributions || 0) - (event.stats?.verifiedCount || 0);
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
                    return (
                      <View key={event.id} style={styles.eventCardWrap}>
                        <TouchableOpacity
                          style={[styles.eventItem, unverified > 0 && styles.eventItemWithBanner]}
                          onPress={() => navigation.navigate('EventDetail', navParams)}
                          activeOpacity={0.6}
                        >
                          {/* 아이콘 + 이름 + 삭제+상태 */}
                          <View style={styles.eventTopRow}>
                            <View style={[styles.eventTypeIcon, event.event_type === 'funeral' && styles.eventTypeIconFuneral]}>
                              {event.event_type === 'wedding' ? (
                                <Image source={require('../../../assets/images/Wedding.png')} style={styles.eventTypeImage} resizeMode="contain" />
                              ) : event.event_type === 'funeral' ? (
                                <Image source={require('../../../assets/images/Funeral.png')} style={styles.eventTypeImage} resizeMode="contain" />
                              ) : (
                                <Ionicons name="calendar" size={18} color="#FFFFFF" />
                              )}
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.eventName} numberOfLines={1}>{event.event_name}</Text>
                              <Text style={styles.eventMeta}>{formatDate(event.event_date)}</Text>
                            </View>

                            <View style={styles.eventRightCol}>
                              <TouchableOpacity
                                style={styles.cardDeleteBtn}
                                onPress={() => handleDeleteEvent(event.id, event.event_name)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="trash-outline" size={15} color="#C5CCD5" />
                              </TouchableOpacity>
                              <View style={styles.statusRow}>
                                <View style={[styles.statusDot, event.status === 'active' ? styles.statusDotActive : styles.statusDotDone]} />
                                <Text style={[styles.statusLabel, event.status === 'active' ? styles.statusLabelActive : styles.statusLabelDone]}>
                                  {event.status === 'active' ? '진행중' : '완료'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* 통계 행 */}
                          <View style={styles.eventStatsRow}>
                            <View style={styles.eventStatItem}>
                              <Text style={styles.eventStatValue}>{(event.stats?.totalContributions || 0)}명</Text>
                              <Text style={styles.eventStatLabel}>참여</Text>
                            </View>
                            <View style={styles.eventStatSep} />
                            <View style={styles.eventStatItem}>
                              <Text style={styles.eventStatValue}>{formatAmount(event.stats?.totalAmount)}</Text>
                              <Text style={styles.eventStatLabel}>총 부조금</Text>
                            </View>
                            <View style={styles.eventStatSep} />
                            <View style={styles.eventStatItem}>
                              <Text style={styles.eventStatValue}>{formatAmount(Math.round(event.stats?.averageAmount || 0))}</Text>
                              <Text style={styles.eventStatLabel}>평균</Text>
                            </View>
                          </View>

                          {/* 하단 행 */}
                          <View style={styles.eventBottomRow}>
                            <Text style={styles.eventHostText}>주최 · {event.main_person_name || '미입력'}</Text>
                            <View style={styles.eventBottomRight}>
                              <Text style={styles.detailText}>상세보기</Text>
                              <Ionicons name="chevron-forward" size={15} color="#C5CCD5" />
                            </View>
                          </View>

                          {/* 미확정 배너 — 카드 내부 하단에 붙임 */}
                          {unverified > 0 && (
                            <TouchableOpacity
                              style={styles.unverifiedBanner}
                              onPress={() => navigation.navigate('EventDetail', navParams)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.unverifiedIconBox}>
                                <Ionicons name="flash" size={16} color="#8B95A1" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.unverifiedBannerSub}>아직 정리되지 않은 부조금</Text>
                                <Text style={styles.unverifiedBannerMain}>미확정 내역이 {unverified}건 있어요</Text>
                              </View>
                              <Ionicons name="chevron-forward" size={16} color="#C5CCD5" />
                            </TouchableOpacity>
                          )}
                        </TouchableOpacity>
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
                  {hostedFilter === 'all' ? '주최한 경조사가 없어요' : hostedFilter === 'active' ? '진행중인 경조사가 없어요' : '완료된 경조사가 없어요'}
                </Text>
                <Text style={styles.emptySub}>홈 화면에서 경조사를 만들어보세요</Text>
              </View>
            )}
          </>
        ) : (
          /* 참여한 경조사 탭 */
          participatedEvents.length > 0 ? (
            <View style={styles.listSection}>
              {participatedEvents.map((event, index) => (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventItem, index < participatedEvents.length - 1 && styles.eventItemBorder]}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  activeOpacity={0.6}
                >
                  <View style={styles.eventTopRow}>
                    <View style={[styles.eventTypeIcon, event.event_type === 'funeral' && styles.eventTypeIconFuneral]}>
                      {event.event_type === 'wedding' ? (
                        <Image source={require('../../../assets/images/Wedding.png')} style={styles.eventTypeImage} resizeMode="contain" />
                      ) : event.event_type === 'funeral' ? (
                        <Image source={require('../../../assets/images/Funeral.png')} style={styles.eventTypeImage} resizeMode="contain" />
                      ) : (
                        <Ionicons name="calendar" size={18} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventName} numberOfLines={1}>{event.event_name}</Text>
                      <Text style={styles.eventMeta}>{formatDate(event.event_date)}</Text>
                    </View>
                    <View style={[styles.participatedBadge]}>
                      <Text style={styles.participatedBadgeText}>참여</Text>
                    </View>
                  </View>

                  {event.participationInfo?.message ? (
                    <Text style={styles.memoText} numberOfLines={1}>📝 {event.participationInfo.message}</Text>
                  ) : null}

                  <View style={styles.eventBottomRow}>
                    <Text style={styles.eventHostText}>주최 · {event.main_person_name || '미입력'}</Text>
                    <View style={styles.eventBottomRight}>
                      <Text style={styles.detailText}>상세보기</Text>
                      <Ionicons name="chevron-forward" size={15} color="#C5CCD5" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="gift-outline" size={36} color="#C5CCD5" />
              </View>
              <Text style={styles.emptyTitle}>참여한 경조사가 없어요</Text>
              <Text style={styles.emptySub}>다른 분의 경조사에 참여해보세요</Text>
            </View>
          )
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* iOS 스타일 삭제 확인 모달 */}
      <Modal
        visible={deleteAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAlert({ visible: false, eventId: null, eventName: '' })}
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
                onPress={() => setDeleteAlert({ visible: false, eventId: null, eventName: '' })}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F6',
  },

  // 헤더
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191F28',
    letterSpacing: -0.5,
  },

  // 탭
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B95A1',
  },
  tabTextActive: {
    color: '#191F28',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E8EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: '#191F28',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B95A1',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#191F28',
  },

  content: {
    flex: 1,
  },

  // 필터 칩
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  filterChipActive: {
    backgroundColor: '#191F28',
    borderColor: '#191F28',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B95A1',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  eventItemWithBanner: {
    paddingBottom: 0,
  },
  eventItemBorder: {},

  // 미확정 배너 — 카드 내부 하단
  unverifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
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
    backgroundColor: '#E5E8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unverifiedBannerSub: {
    fontSize: 12,
    color: '#8B95A1',
    marginBottom: 2,
  },
  unverifiedBannerMain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191F28',
  },

  // 이벤트 상단 행
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  eventTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFB3C6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  eventTypeIconFuneral: {
    backgroundColor: '#5C6472',
  },
  eventTypeImage: {
    width: 60,
    height: 60,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191F28',
    marginBottom: 3,
  },
  eventMeta: {
    fontSize: 13,
    color: '#8B95A1',
    fontWeight: '400',
  },
  eventRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#2ACB6E',
  },
  statusDotDone: {
    backgroundColor: '#C5CCD5',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusLabelActive: {
    color: '#2ACB6E',
  },
  statusLabelDone: {
    color: '#C5CCD5',
  },

  // 통계 행
  eventStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  eventStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  eventStatSep: {
    width: 1,
    backgroundColor: '#E5E8EB',
    marginVertical: 4,
  },
  eventStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191F28',
  },
  eventStatLabel: {
    fontSize: 11,
    color: '#8B95A1',
    fontWeight: '500',
  },

  // 하단 행
  eventBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventHostText: {
    fontSize: 13,
    color: '#8B95A1',
  },
  eventBottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#C5CCD5',
  },

  // 참여 뱃지
  participatedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#EBF3FF',
  },
  participatedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3182F6',
  },
  memoText: {
    fontSize: 13,
    color: '#8B95A1',
    marginBottom: 12,
    marginLeft: 56,
  },

  // 빈 상태
  emptyBox: {
    alignItems: 'center',
    paddingTop: 72,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#191F28',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#8B95A1',
    textAlign: 'center',
    lineHeight: 20,
  },


  // iOS 스타일 삭제 확인 모달
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBox: {
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  alertMessage: {
    fontSize: 13,
    color: '#3C3C43',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertDividerH: {
    height: 0.5,
    backgroundColor: 'rgba(60,60,67,0.29)',
  },
  alertBtnRow: {
    flexDirection: 'row',
    height: 44,
  },
  alertBtnLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDividerV: {
    width: 0.5,
    backgroundColor: 'rgba(60,60,67,0.29)',
  },
  alertCancelText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
  },
  alertDeleteText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
  },

  // 로딩
  loadingBox: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8B95A1',
  },
});
