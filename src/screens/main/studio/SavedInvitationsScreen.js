// src/screens/main/studio/SavedInvitationsScreen.js
// 내가 저장한 종이 청첩장 목록
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Platform,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TC } from '../guides/tossStyle';
import {
  listPaperInvitations,
  deletePaperInvitation,
} from '../../../lib/paperInvitationHelper';
import SavedInvitationThumb from './SavedInvitationThumb';

const { width: SCREEN_W } = Dimensions.get('window');

export default function SavedInvitationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState(null); // 상세 모달

  const load = useCallback(async () => {
    const r = await listPaperInvitations();
    if (r.success) setItems(r.data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleDelete = (item) => {
    Alert.alert(
      '청첩장 삭제',
      `${item.groom || ''} & ${item.bride || ''} 청첩장을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const r = await deletePaperInvitation(item.id);
            if (r.success) {
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              setDetail(null);
            } else {
              Alert.alert('오류', r.error || '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => setDetail(item)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.85}
    >
      <SavedInvitationThumb invitation={item} width={84} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.cardName}>
          {item.groom || '신랑'} & {item.bride || '신부'}
        </Text>
        {item.date_str && (
          <Text style={s.cardSub}>
            {item.date_str}
            {item.time_str ? `  ${item.time_str}` : ''}
          </Text>
        )}
        {item.venue && <Text style={s.cardSub}>{item.venue}</Text>}
        <View style={s.statusRow}>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>
              {item.status === 'completed' ? '완성' : '저장됨'}
            </Text>
          </View>
          <Text style={s.cardDate}>
            {new Date(item.created_at).toLocaleDateString('ko-KR')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={TC.inkDim} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={TC.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>내가 만든 청첩장</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={TC.blue} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="document-outline" size={32} color={TC.inkMuted} />
          </View>
          <Text style={s.emptyTitle}>아직 만든 청첩장이 없어요</Text>
          <Text style={s.emptySub}>스튜디오에서 첫 청첩장을 만들어보세요</Text>
          <TouchableOpacity
            style={s.emptyCta}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={s.emptyCtaText}>템플릿 보러가기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            <Text style={s.listHint}>
              총 {items.length}개 · 길게 누르면 삭제
            </Text>
          }
        />
      )}

      {/* 상세 미리보기 모달 */}
      <Modal
        visible={!!detail}
        transparent
        animationType="fade"
        onRequestClose={() => setDetail(null)}
        statusBarTranslucent
      >
        <View style={s.detailBackdrop}>
          <Pressable
            style={{ ...StyleSheet.absoluteFillObject }}
            onPress={() => setDetail(null)}
          />
          <View style={s.detailSheet}>
            <View style={s.detailHandle} />

            {detail && (
              <>
                <View style={s.detailHeader}>
                  <Text style={s.detailTitle}>
                    {detail.groom} & {detail.bride}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDetail(null)}
                    hitSlop={10}
                    style={s.detailCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={TC.ink} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  contentContainerStyle={{ alignItems: 'center', paddingTop: 8, paddingBottom: 16 }}
                >
                  <SavedInvitationThumb
                    invitation={detail}
                    width={SCREEN_W - 64}
                  />

                  <View style={s.detailInfo}>
                    {detail.date_str && (
                      <View style={s.detailRow}>
                        <Ionicons name="calendar-outline" size={14} color={TC.inkMuted} />
                        <Text style={s.detailText}>
                          {detail.date_str}
                          {detail.time_str ? `  ${detail.time_str}` : ''}
                        </Text>
                      </View>
                    )}
                    {detail.venue && (
                      <View style={s.detailRow}>
                        <Ionicons name="location-outline" size={14} color={TC.inkMuted} />
                        <Text style={s.detailText}>{detail.venue}</Text>
                      </View>
                    )}
                    {detail.address && (
                      <View style={s.detailRow}>
                        <Ionicons name="navigate-outline" size={14} color={TC.inkMuted} />
                        <Text style={s.detailText}>{detail.address}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>

                <View style={s.detailActions}>
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => handleDelete(detail)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color="#E14C4C" />
                    <Text style={s.deleteBtnText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: TC.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: TC.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // 빈 상태
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TC.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: TC.inkMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCta: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: TC.ink,
    borderRadius: 12,
  },
  emptyCtaText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  // 리스트
  listHint: {
    fontSize: 11,
    color: TC.inkMuted,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  // 카드
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: TC.inkMuted,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: TC.greenSoft,
    borderRadius: 6,
  },
  statusText: { fontSize: 10, fontWeight: '700', color: TC.green, letterSpacing: -0.1 },
  cardDate: { fontSize: 11, color: TC.inkDim, fontWeight: '500' },

  // 상세 모달
  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    maxHeight: '90%',
  },
  detailHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E8EB',
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  detailTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.4,
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TC.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: { fontSize: 13, color: TC.ink, fontWeight: '500', letterSpacing: -0.2 },
  detailActions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E14C4C',
    letterSpacing: -0.2,
  },
});
