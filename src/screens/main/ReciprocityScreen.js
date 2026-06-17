import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import LottieLoading from '../../components/LottieLoading';
import { supabase } from '../../lib/supabase';
import {
  getReciprocityNotifications,
  updateReciprocityNotificationStatus,
} from '../../lib/eventReciprocity';

const EVENT_ICONS = {
  wedding: require('../../../assets/icons/reciprocity/wedding.png'),
  funeral: require('../../../assets/icons/reciprocity/funeral.png'),
};

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'unread', label: '새 소식' },
  { key: 'read', label: '챙긴 내역' },
];

function formatAmount(amount) {
  return `${new Intl.NumberFormat('ko-KR').format(Number(amount || 0))}원`;
}

function formatDate(dateString) {
  if (!dateString) return '날짜 미정';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '날짜 미정';
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function formatPhoneNumber(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  const localDigits = digits.startsWith('0082') && digits.length >= 13
    ? `0${digits.slice(4)}`
    : digits.startsWith('82') && digits.length >= 11
      ? `0${digits.slice(2)}`
      : digits;
  if (localDigits.length === 11) return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 7)}-${localDigits.slice(7)}`;
  if (localDigits.length === 10) return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
  return phone || '';
}

function normalizePhoneDigits(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0082') && digits.length >= 13) return `0${digits.slice(4)}`;
  if (digits.startsWith('82') && digits.length >= 11) return `0${digits.slice(2)}`;
  return digits;
}

function getEventIcon(eventType) {
  return eventType === 'funeral' ? EVENT_ICONS.funeral : EVENT_ICONS.wedding;
}

function getStatusLabel(status) {
  if (status === 'read') return '챙겼어요';
  return '챙겨야 해요';
}

function getEventTypeLabel(eventType) {
  return eventType === 'funeral' ? '장례식' : '결혼식';
}

function groupNotifications(items = []) {
  const grouped = new Map();

  items.forEach((item) => {
    const phoneKey = normalizePhoneDigits(item.source_guest_phone);
    const newEventId = item.new_event_id || item.new_event?.id || 'unknown';
    const key = `${newEventId}:${phoneKey || item.source_guest_name || item.id}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...item,
        groupKey: key,
        items: [],
        originalEventMap: new Map(),
        totalAmount: 0,
        status: 'read',
      });
    }

    const group = grouped.get(key);
    group.items.push(item);
    if (item.status === 'unread') group.status = 'unread';

    const originalEventId = item.original_event_id || item.original_event?.id;
    if (originalEventId && item.original_event && !group.originalEventMap.has(originalEventId)) {
      const amount = Number(item.source_amount || 0);
      group.originalEventMap.set(originalEventId, {
        ...item.original_event,
        notificationId: item.id,
        source_guest_id: item.source_guest_id,
        source_guest_name: item.source_guest_name,
        source_guest_phone: item.source_guest_phone,
        amount,
        created_at: item.created_at,
      });
      group.totalAmount += amount;
    }

    if (!group.created_at || new Date(item.created_at) > new Date(group.created_at)) {
      group.created_at = item.created_at;
      group.source_guest_name = item.source_guest_name || group.source_guest_name;
      group.source_guest_phone = item.source_guest_phone || group.source_guest_phone;
    }
  });

  return Array.from(grouped.values()).map((group) => ({
    ...group,
    originalEvents: Array.from(group.originalEventMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    originalEventMap: undefined,
  })).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export default function ReciprocityScreen({ navigation, userInfo, session }) {
  const currentUserId = session?.user?.id || userInfo?.userId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const loadItems = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await getReciprocityNotifications(currentUserId);
      if (res?.success) setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
      if (!currentUserId) return undefined;

      const channel = supabase
        .channel(`reciprocity_screen_${currentUserId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'event_reciprocity_notifications',
          filter: `receiver_user_id=eq.${currentUserId}`,
        }, loadItems)
        .subscribe();

      return () => supabase.removeChannel(channel);
    }, [currentUserId, loadItems])
  );

  const groups = useMemo(() => groupNotifications(items), [items]);
  const filteredGroups = useMemo(() => (
    filter === 'all' ? groups : groups.filter(item => item.status === filter)
  ), [filter, groups]);

  const updateGroupStatus = async (group, status) => {
    const ids = group.items?.map(item => item.id).filter(Boolean) || [];
    if (ids.length === 0) return;
    const previous = items;
    setItems(prev => prev.map(item => ids.includes(item.id) ? { ...item, status } : item));
    const results = await Promise.all(ids.map(id => updateReciprocityNotificationStatus(id, status, currentUserId)));
    if (results.some(result => !result?.success)) setItems(previous);
  };

  const openEventDetail = (group, originalEvent) => {
    const focusQuery = originalEvent.source_guest_phone
      || group.source_guest_phone
      || originalEvent.source_guest_name
      || group.source_guest_name
      || '';
    setSelected(null);
    navigation.navigate('EventDetail', {
      eventId: originalEvent.id,
      initialEvent: originalEvent,
      initialSearchQuery: focusQuery,
      focusContributionId: originalEvent.source_guest_id || null,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#191F28" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>챙길 경조사</Text>
          <Text style={styles.subtitle}>내 행사에 와줬던 분들의 새 소식</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key)}
            activeOpacity={0.78}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && groups.length === 0 ? (
        <View style={styles.loadingBox}>
          <LottieLoading size={82} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredGroups.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-circle-outline" size={34} color="#B0B8C1" />
              <Text style={styles.emptyTitle}>표시할 경조사가 없어요</Text>
              <Text style={styles.emptyText}>새로 챙길 소식이 생기면 여기에 모아둘게요.</Text>
            </View>
          ) : (
            filteredGroups.map(group => {
              const newEvent = group.new_event || {};
              const latestOriginal = group.originalEvents?.[0] || group.original_event || {};
              return (
                <TouchableOpacity
                  key={group.groupKey}
                  style={[styles.card, group.status === 'unread' && styles.cardUnread]}
                  onPress={() => setSelected(group)}
                  activeOpacity={0.84}
                >
                  <Image source={getEventIcon(newEvent.event_type)} style={styles.cardIcon} resizeMode="contain" />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardEyebrow}>{getEventTypeLabel(newEvent.event_type)} · {getStatusLabel(group.status)}</Text>
                      {group.status === 'unread' && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{newEvent.event_name || '새 경조사'}</Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {group.source_guest_name || '하객'} · {formatDate(newEvent.event_date)}
                    </Text>
                    <View style={styles.relationshipBox}>
                      <Text style={styles.relationshipMain}>
                        내 행사 {group.originalEvents.length}회 방문 · {formatAmount(group.totalAmount)}
                      </Text>
                      <Text style={styles.relationshipSub} numberOfLines={1}>
                        최근 {latestOriginal.event_name || '이전 경조사'} · {formatAmount(latestOriginal.amount || 0)}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Text style={styles.cardActionHint}>기록을 보고 챙길지 결정해요</Text>
                      <View style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>기록 보기</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <TouchableWithoutFeedback onPress={() => setSelected(null)}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                {selected && (
                  <>
                    <View style={styles.sheetHandle} />
                    <View style={styles.sheetHeader}>
                      <Image source={getEventIcon(selected.new_event?.event_type)} style={styles.sheetIcon} resizeMode="contain" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sheetTitle}>{selected.source_guest_name || '하객'}님 기록</Text>
                        <Text style={styles.sheetPhone}>{formatPhoneNumber(selected.source_guest_phone)}</Text>
                      </View>
                      <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
                        <Ionicons name="close" size={20} color="#6B7684" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.sheetFocusBox}>
                      <Text style={styles.sheetLabel}>이번에 챙길 경조사</Text>
                      <Text style={styles.sheetFocusTitle}>{selected.new_event?.event_name || '새 경조사'}</Text>
                      <Text style={styles.sheetFocusSub}>{formatDate(selected.new_event?.event_date)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>방문 기록</Text>
                        <Text style={styles.summaryValue}>{selected.originalEvents.length}회</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>받은 마음</Text>
                        <Text style={styles.summaryValue}>{formatAmount(selected.totalAmount)}</Text>
                      </View>
                    </View>

                    <Text style={styles.historyTitle}>내가 받은 부조 내역</Text>
                    <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                      {selected.originalEvents.map(event => (
                        <TouchableOpacity
                          key={event.id || event.notificationId}
                          style={styles.historyRow}
                          onPress={() => openEventDetail(selected, event)}
                          activeOpacity={0.78}
                        >
                          <View style={styles.historyDot} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.historyName} numberOfLines={1}>{event.event_name || '이전 경조사'}</Text>
                            <Text style={styles.historySub} numberOfLines={1}>
                              {event.source_guest_name || selected.source_guest_name || '하객'}님에게 받은 부조 · {formatAmount(event.amount || 0)}
                            </Text>
                            {!!event.event_date && (
                              <Text style={styles.historyDate} numberOfLines={1}>{formatDate(event.event_date)}</Text>
                            )}
                          </View>
                          <Text style={styles.historyLink}>내역 보기</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <TouchableOpacity
                      style={styles.sheetDoneButton}
                      onPress={() => {
                        updateGroupStatus(selected, 'read');
                        setSelected(null);
                      }}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.sheetDoneButtonText}>이 경조사 챙겼어요</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14, backgroundColor: '#FFFFFF' },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F6' },
  title: { fontSize: 22, fontWeight: '900', color: '#191F28' },
  subtitle: { marginTop: 3, fontSize: 13, fontWeight: '600', color: '#8B95A1' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  filterChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F2F4F6' },
  filterChipActive: { backgroundColor: '#191F28' },
  filterText: { fontSize: 13, fontWeight: '800', color: '#6B7684' },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { padding: 18, paddingBottom: 40, gap: 12 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', padding: 28, borderRadius: 18, backgroundColor: '#FFFFFF' },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '900', color: '#191F28' },
  emptyText: { marginTop: 5, fontSize: 13, fontWeight: '600', color: '#8B95A1' },
  card: { flexDirection: 'row', gap: 13, padding: 14, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF1F4' },
  cardUnread: { borderColor: '#B7D7FF', backgroundColor: '#FBFDFF' },
  cardIcon: { width: 58, height: 58 },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardEyebrow: { fontSize: 12, fontWeight: '800', color: '#3182F6' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3182F6' },
  cardTitle: { marginTop: 4, fontSize: 17, fontWeight: '900', color: '#191F28' },
  cardMeta: { marginTop: 4, fontSize: 13, fontWeight: '700', color: '#6B7684' },
  relationshipBox: { marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: '#F9FAFB' },
  relationshipMain: { fontSize: 13, fontWeight: '900', color: '#191F28' },
  relationshipSub: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#8B95A1' },
  cardActions: { marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardActionHint: { flex: 1, fontSize: 11, fontWeight: '700', color: '#8B95A1' },
  secondaryButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F2F4F6' },
  secondaryButtonText: { fontSize: 12, fontWeight: '900', color: '#4E5968' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#3182F6' },
  primaryButtonText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.32)' },
  sheet: { maxHeight: '84%', paddingTop: 10, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 22, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFFFFF' },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 999, backgroundColor: '#D1D6DB', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIcon: { width: 54, height: 54 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: '#191F28' },
  sheetPhone: { marginTop: 3, fontSize: 13, fontWeight: '700', color: '#8B95A1' },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F6' },
  sheetFocusBox: { marginTop: 18, padding: 15, borderRadius: 16, backgroundColor: '#F7FAFF', borderWidth: 1, borderColor: '#E8F2FF' },
  sheetLabel: { fontSize: 12, fontWeight: '800', color: '#3182F6' },
  sheetFocusTitle: { marginTop: 6, fontSize: 17, fontWeight: '900', color: '#191F28' },
  sheetFocusSub: { marginTop: 4, fontSize: 13, fontWeight: '700', color: '#8B95A1' },
  summaryRow: { marginTop: 14, flexDirection: 'row', borderRadius: 15, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#EEF1F4' },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  summaryDivider: { width: 1, backgroundColor: '#EEF1F4' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#8B95A1' },
  summaryValue: { marginTop: 4, fontSize: 16, fontWeight: '900', color: '#191F28' },
  historyTitle: { marginTop: 18, marginBottom: 10, fontSize: 15, fontWeight: '900', color: '#191F28' },
  historyList: { maxHeight: 280 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F4F6' },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3182F6' },
  historyName: { fontSize: 14, fontWeight: '900', color: '#191F28' },
  historySub: { marginTop: 3, fontSize: 12, fontWeight: '700', color: '#8B95A1' },
  historyDate: { marginTop: 2, fontSize: 11, fontWeight: '700', color: '#B0B8C1' },
  historyLink: { fontSize: 12, fontWeight: '900', color: '#3182F6' },
  sheetDoneButton: { marginTop: 16, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: '#191F28' },
  sheetDoneButtonText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
});
