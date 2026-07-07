import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  adjustAdminUserCredits,
  deleteAdminModal,
  getAdminDashboard,
  getAdminEventGuests,
  getAdminUserEvents,
  getAdminUsers,
  getCurrentAppUserId,
  isAdminUser,
  listAdminModals,
  saveAdminModal,
} from '../../lib/adminConsole';
import { uploadImageToStorage } from '../../lib/supabaseHelper';

const TARGETS = [
  { key: 'all', label: '전체' },
  { key: 'home', label: '홈' },
  { key: 'my_events', label: '내 행사' },
  { key: 'guide', label: '가이드' },
  { key: 'studio', label: '스튜디오' },
  { key: 'profile', label: '프로필' },
];

const EMPTY_FORM = {
  id: null,
  title: '',
  body: '',
  image_url: '',
  target_screen: 'home',
  starts_at: '',
  ends_at: '',
  cta_label: '',
  cta_url: '',
  priority: '0',
  is_active: true,
};

const formatAmount = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`;
const formatCredits = (value) => `${Number(value || 0).toLocaleString('ko-KR')}건`;

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
};

const dateInputToIso = (value, endOfDay = false) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T${endOfDay ? '23:59:59' : '00:00:00'}+09:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed.replace(' ', 'T')}:00+09:00`;
  }
  return trimmed;
};

const eventTypeLabel = (type) => {
  switch (type) {
    case 'wedding':
      return '결혼식';
    case 'funeral':
      return '장례식';
    default:
      return '기타';
  }
};

const getEventContributionAmount = (event) =>
  Number(
    event?.contribution_amount ??
      event?.total_amount ??
      event?.confirmed_amount ??
      event?.amount ??
      0,
  );

const getEventContributionCount = (event) =>
  Number(
    event?.contribution_count ??
      event?.guest_count ??
      event?.total_contributions ??
      event?.confirmed_contributions ??
      0,
  );

export default function AdminScreen({ userInfo, session }) {
  const adminUserId = getCurrentAppUserId(userInfo, session);
  const canUseAdmin = isAdminUser(userInfo, session);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('modals');
  const [dashboard, setDashboard] = useState(null);
  const [modals, setModals] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [eventGuests, setEventGuests] = useState([]);
  const [modalForm, setModalForm] = useState(EMPTY_FORM);
  const [creditDelta, setCreditDelta] = useState('');
  const [creditMemo, setCreditMemo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    if (!canUseAdmin || !adminUserId) return;
    const [dashboardRes, modalRes, userRes] = await Promise.all([
      getAdminDashboard(adminUserId),
      listAdminModals(adminUserId),
      getAdminUsers(adminUserId),
    ]);
    if (dashboardRes.success) setDashboard(dashboardRes.data);
    if (modalRes.success) setModals(modalRes.data);
    if (userRes.success) setUsers(userRes.data);
  }, [adminUserId, canUseAdmin]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadAll();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
      if (selectedUser?.id) await loadUserEvents(selectedUser, { forceOpen: true });
      if (selectedEvent?.event_id) await loadEventGuests(selectedEvent);
    } finally {
      setRefreshing(false);
    }
  };

  const loadUserEvents = async (user, options = {}) => {
    if (selectedUser?.id === user.id && !options.forceOpen) {
      setSelectedUser(null);
      setSelectedEvent(null);
      setUserEvents([]);
      setEventGuests([]);
      return;
    }

    setSelectedUser(user);
    setSelectedEvent(null);
    setEventGuests([]);
    const result = await getAdminUserEvents(adminUserId, user.id);
    if (result.success) setUserEvents(result.data);
    else Alert.alert('조회 실패', result.error || '행사 내역을 불러오지 못했습니다.');
  };

  const loadEventGuests = async (event) => {
    setSelectedEvent(event);
    const result = await getAdminEventGuests(adminUserId, event.event_id);
    if (result.success) setEventGuests(result.data);
    else Alert.alert('조회 실패', result.error || '축의금 상세를 불러오지 못했습니다.');
  };

  const selectedTargetLabel = useMemo(
    () => TARGETS.find((target) => target.key === modalForm.target_screen)?.label || '홈',
    [modalForm.target_screen],
  );

  const resetModalForm = () => setModalForm(EMPTY_FORM);

  const editModal = (item) => {
    setModalForm({
      id: item.id,
      title: item.title || '',
      body: item.body || '',
      image_url: item.image_url || '',
      target_screen: item.target_screen || 'home',
      starts_at: item.starts_at ? item.starts_at.slice(0, 16).replace('T', ' ') : '',
      ends_at: item.ends_at ? item.ends_at.slice(0, 16).replace('T', ' ') : '',
      cta_label: item.cta_label || '',
      cta_url: item.cta_url || '',
      priority: String(item.priority ?? 0),
      is_active: item.is_active !== false,
    });
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('권한 필요', '이미지를 선택하려면 사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.86,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setSaving(true);
    try {
      const fileName = `admin-modal-${Date.now()}.jpg`;
      const upload = await uploadImageToStorage(
        result.assets[0].uri,
        fileName,
        adminUserId,
        'admin_modals',
      );
      if (!upload.success) {
        Alert.alert('업로드 실패', upload.error || '이미지를 업로드하지 못했습니다.');
        return;
      }
      setModalForm((prev) => ({ ...prev, image_url: upload.data.publicUrl }));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModal = async () => {
    if (!modalForm.title.trim()) {
      Alert.alert('제목 필요', '모달 제목을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const result = await saveAdminModal({
        ...modalForm,
        admin_user_id: adminUserId,
        starts_at: dateInputToIso(modalForm.starts_at, false),
        ends_at: dateInputToIso(modalForm.ends_at, true),
      });
      if (!result.success) {
        Alert.alert('저장 실패', result.error || '모달을 저장하지 못했습니다.');
        return;
      }
      resetModalForm();
      const modalRes = await listAdminModals(adminUserId);
      if (modalRes.success) setModals(modalRes.data);
      Alert.alert('저장 완료', '앱 모달이 저장되었습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModal = (item) => {
    Alert.alert('모달 삭제', `"${item.title}" 모달을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteAdminModal(item.id, adminUserId);
          if (!result.success) {
            Alert.alert('삭제 실패', result.error || '모달을 삭제하지 못했습니다.');
            return;
          }
          const modalRes = await listAdminModals(adminUserId);
          if (modalRes.success) setModals(modalRes.data);
        },
      },
    ]);
  };

  const applyCreditDelta = async (deltaValue = null) => {
    if (!selectedUser?.id) {
      Alert.alert('사용자 선택', '크레딧을 조정할 사용자를 선택해주세요.');
      return;
    }
    const delta = Number(deltaValue ?? creditDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      Alert.alert('수량 확인', '추가하거나 뺄 크레딧 수량을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const result = await adjustAdminUserCredits({
        adminUserId,
        targetUserId: selectedUser.id,
        delta,
        memo: creditMemo || '관리자 수동 조정',
      });
      if (!result.success) {
        Alert.alert('조정 실패', result.error || '크레딧을 조정하지 못했습니다.');
        return;
      }
      setCreditDelta('');
      setCreditMemo('');
      await loadAll();
      setSelectedUser((prev) =>
        prev ? { ...prev, alimtalk_balance: result.data.new_balance } : prev,
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canUseAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.blocked}>
          <Ionicons name="lock-closed-outline" size={42} color="#8B95A1" />
          <Text style={styles.blockedTitle}>관리자 전용 페이지</Text>
          <Text style={styles.blockedText}>
            등록된 관리자 번호로 로그인한 계정만 접근할 수 있습니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderStats = () => (
    <View style={styles.statGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>전체 사용자</Text>
        <Text style={styles.statValue}>{Number(dashboard?.total_users || users.length).toLocaleString('ko-KR')}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>전체 행사</Text>
        <Text style={styles.statValue}>{Number(dashboard?.total_events || 0).toLocaleString('ko-KR')}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>총 접수금</Text>
        <Text style={styles.statValueSmall}>{formatAmount(dashboard?.total_contribution_amount || 0)}</Text>
      </View>
    </View>
  );

  const renderModalManager = () => (
    <>
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>{modalForm.id ? '모달 수정' : '새 모달 만들기'}</Text>
            <Text style={styles.panelSub}>기간과 노출 위치를 정하면 해당 탭에서 자동으로 뜹니다.</Text>
          </View>
          {modalForm.id && (
            <TouchableOpacity style={styles.ghostButton} onPress={resetModalForm}>
              <Text style={styles.ghostButtonText}>새로 만들기</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.inputLabel}>노출 위치</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentRow}>
          {TARGETS.map((target) => {
            const active = modalForm.target_screen === target.key;
            return (
              <TouchableOpacity
                key={target.key}
                style={[styles.segmentChip, active && styles.segmentChipActive]}
                onPress={() => setModalForm((prev) => ({ ...prev, target_screen: target.key }))}
                activeOpacity={0.78}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{target.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.inputLabel}>제목</Text>
        <TextInput
          style={styles.input}
          value={modalForm.title}
          onChangeText={(title) => setModalForm((prev) => ({ ...prev, title }))}
          placeholder="예: 업데이트 안내"
          placeholderTextColor="#B0B8C1"
        />

        <Text style={styles.inputLabel}>내용</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={modalForm.body}
          onChangeText={(body) => setModalForm((prev) => ({ ...prev, body }))}
          multiline
          placeholder="사용자에게 보여줄 안내 문구"
          placeholderTextColor="#B0B8C1"
        />

        <Text style={styles.inputLabel}>이미지</Text>
        {!!modalForm.image_url && (
          <Image source={{ uri: modalForm.image_url }} style={styles.previewImage} resizeMode="cover" />
        )}
        <View style={styles.rowGap}>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} disabled={saving}>
            <Ionicons name="image-outline" size={18} color="#3182F6" />
            <Text style={styles.uploadText}>사진 선택해서 업로드</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={modalForm.image_url}
          onChangeText={(image_url) => setModalForm((prev) => ({ ...prev, image_url }))}
          placeholder="또는 이미지 URL 직접 입력"
          placeholderTextColor="#B0B8C1"
          autoCapitalize="none"
        />

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>시작일</Text>
            <TextInput
              style={styles.input}
              value={modalForm.starts_at}
              onChangeText={(starts_at) => setModalForm((prev) => ({ ...prev, starts_at }))}
              placeholder="2026-06-20"
              placeholderTextColor="#B0B8C1"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>종료일</Text>
            <TextInput
              style={styles.input}
              value={modalForm.ends_at}
              onChangeText={(ends_at) => setModalForm((prev) => ({ ...prev, ends_at }))}
              placeholder="2026-06-30"
              placeholderTextColor="#B0B8C1"
            />
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>버튼 문구</Text>
            <TextInput
              style={styles.input}
              value={modalForm.cta_label}
              onChangeText={(cta_label) => setModalForm((prev) => ({ ...prev, cta_label }))}
              placeholder="자세히 보기"
              placeholderTextColor="#B0B8C1"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>우선순위</Text>
            <TextInput
              style={styles.input}
              value={modalForm.priority}
              onChangeText={(priority) => setModalForm((prev) => ({ ...prev, priority }))}
              placeholder="0"
              placeholderTextColor="#B0B8C1"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <TextInput
          style={styles.input}
          value={modalForm.cta_url}
          onChangeText={(cta_url) => setModalForm((prev) => ({ ...prev, cta_url }))}
          placeholder="버튼 클릭 URL"
          placeholderTextColor="#B0B8C1"
          autoCapitalize="none"
        />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>모달 활성화</Text>
            <Text style={styles.switchSub}>{selectedTargetLabel} 화면에 노출됩니다.</Text>
          </View>
          <Switch
            value={modalForm.is_active}
            onValueChange={(is_active) => setModalForm((prev) => ({ ...prev, is_active }))}
            trackColor={{ true: '#B7D7FF', false: '#DDE4EC' }}
            thumbColor={modalForm.is_active ? '#3182F6' : '#FFFFFF'}
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveModal} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>모달 저장</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>등록된 모달</Text>
        <View style={styles.modalList}>
          {modals.map((item) => (
            <View key={item.id} style={styles.modalItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{item.title}</Text>
                <Text style={styles.modalMeta}>
                  {TARGETS.find((target) => target.key === item.target_screen)?.label || item.target_screen}
                  {' · '}
                  {item.is_active ? '활성' : '비활성'}
                </Text>
                <Text style={styles.modalDate}>
                  {formatDate(item.starts_at)} ~ {formatDate(item.ends_at)}
                </Text>
              </View>
              <TouchableOpacity style={styles.smallButton} onPress={() => editModal(item)}>
                <Text style={styles.smallButtonText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallButton, styles.dangerButton]} onPress={() => handleDeleteModal(item)}>
                <Text style={styles.dangerText}>삭제</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderUsers = () => (
    <>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>사용자 / 크레딧</Text>
        <Text style={styles.panelSub}>사용자를 선택하면 크레딧 조정과 만든 행사 내역을 바로 확인할 수 있습니다.</Text>
        <View style={styles.userList}>
          {users.map((user) => {
            const selected = selectedUser?.id === user.id;
            return (
              <React.Fragment key={user.id}>
                <TouchableOpacity
                  style={[styles.userCard, selected && styles.userCardSelected]}
                  onPress={() => loadUserEvents(user)}
                  activeOpacity={0.82}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{(user.name || user.phone || '?').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.userName} numberOfLines={1}>{user.name || '이름 없음'}</Text>
                    <Text style={styles.userPhone}>{user.phone || '-'}</Text>
                    <Text style={styles.userMeta}>
                      행사 {user.total_events || 0}개 · 접수 {formatAmount(user.total_contribution_amount || 0)}
                    </Text>
                  </View>
                  <View style={styles.userRightStack}>
                    <Text style={styles.creditValue}>{formatCredits(user.alimtalk_balance || 0)}</Text>
                    <Ionicons
                      name={selected ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#8B95A1"
                    />
                  </View>
                </TouchableOpacity>
                {selected && renderEvents()}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {selectedUser && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{selectedUser.name || selectedUser.phone} 크레딧 조정</Text>
          <View style={styles.quickCreditRow}>
            {[10, 50, 100, -10, -50].map((delta) => (
              <TouchableOpacity
                key={delta}
                style={[styles.creditQuickButton, delta < 0 && styles.creditMinusButton]}
                onPress={() => applyCreditDelta(delta)}
                disabled={saving}
              >
                <Text style={[styles.creditQuickText, delta < 0 && styles.creditMinusText]}>
                  {delta > 0 ? `+${delta}` : delta}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={creditDelta}
            onChangeText={setCreditDelta}
            placeholder="직접 입력 예: 30 또는 -30"
            placeholderTextColor="#B0B8C1"
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            style={styles.input}
            value={creditMemo}
            onChangeText={setCreditMemo}
            placeholder="메모 예: 베타 테스트 보상"
            placeholderTextColor="#B0B8C1"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={() => applyCreditDelta()} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>크레딧 적용</Text>}
          </TouchableOpacity>
        </View>
      )}

    </>
  );

  const renderEvents = () => (
    <>
      <View style={styles.inlinePanel}>
        <Text style={styles.panelTitle}>만든 행사</Text>
        <Text style={styles.panelSub}>{selectedUser?.name || selectedUser?.phone || '선택한 사용자'}님이 만든 행사입니다.</Text>
        {!selectedUser ? (
          <View style={styles.emptyBox}>
            <Ionicons name="person-circle-outline" size={34} color="#B0B8C1" />
            <Text style={styles.emptyText}>먼저 사용자를 선택해주세요.</Text>
          </View>
        ) : userEvents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={34} color="#B0B8C1" />
            <Text style={styles.emptyText}>이 사용자가 만든 행사가 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.eventList}>
            {userEvents.map((event) => (
              <TouchableOpacity
                key={event.event_id}
                style={[
                  styles.eventCard,
                  selectedEvent?.event_id === event.event_id && styles.eventCardSelected,
                ]}
                onPress={() => loadEventGuests(event)}
                activeOpacity={0.82}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{event.event_name || '행사명 없음'}</Text>
                  <Text style={styles.eventMeta}>
                    {eventTypeLabel(event.event_type)} · {formatDate(event.event_date)}
                  </Text>
                </View>
                <View style={styles.eventAmountBox}>
                  <Text style={styles.eventCount}>{getEventContributionCount(event)}건</Text>
                  <Text style={styles.eventAmount}>{formatAmount(getEventContributionAmount(event))}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedEvent && (
        <View style={styles.inlineDetailPanel}>
          <Text style={styles.panelTitle}>축의금 상세</Text>
          <Text style={styles.panelSub}>{selectedEvent.event_name}</Text>
          {eventGuests.length === 0 ? (
            <Text style={styles.emptyText}>등록된 접수 내역이 없습니다.</Text>
          ) : (
            eventGuests.map((guest) => (
              <View key={guest.guest_id} style={styles.guestRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestName}>{guest.guest_name || '이름 없음'}</Text>
                  <Text style={styles.guestMeta}>
                    {guest.guest_phone || '-'} · {guest.relation_category || '-'} · {formatDate(guest.created_at)}
                  </Text>
                </View>
                <Text style={styles.guestAmount}>{formatAmount(guest.amount || 0)}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>정담 Admin</Text>
          <Text style={styles.headerTitle}>관리자</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3182F6" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 42 + Math.max(insets.bottom, 12) },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3182F6" />}
          showsVerticalScrollIndicator={false}
        >
          {renderStats()}

          <View style={styles.tabRow}>
            {[
              { key: 'modals', label: '모달' },
              { key: 'users', label: '사용자' },
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.78}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === 'modals' && renderModalManager()}
          {activeTab === 'users' && renderUsers()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF1',
  },
  headerEyebrow: {
    fontSize: 13,
    fontWeight: '900',
    color: '#3182F6',
  },
  headerTitle: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: 0,
  },
  content: {
    padding: 16,
    paddingBottom: 42,
    gap: 14,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  blockedTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '900',
    color: '#191F28',
  },
  blockedText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#8B95A1',
    textAlign: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 86,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B95A1',
  },
  statValue: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: '900',
    color: '#191F28',
  },
  statValueSmall: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '900',
    color: '#191F28',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#EDEFF3',
  },
  tabChip: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#6B7684',
  },
  tabTextActive: {
    color: '#3182F6',
  },
  panel: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: '#191F28',
  },
  panelSub: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#8B95A1',
  },
  ghostButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F4F6',
  },
  ghostButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4E5968',
  },
  inputLabel: {
    marginTop: 16,
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '900',
    color: '#4E5968',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDE4EC',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    color: '#191F28',
  },
  textArea: {
    minHeight: 104,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  segmentRow: {
    gap: 8,
  },
  segmentChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F2F4F6',
  },
  segmentChipActive: {
    backgroundColor: '#E8F3FF',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#6B7684',
  },
  segmentTextActive: {
    color: '#3182F6',
  },
  previewImage: {
    width: '100%',
    height: 154,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#F2F4F6',
  },
  rowGap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#E8F3FF',
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#3182F6',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F7F9FC',
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#191F28',
  },
  switchSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
  },
  primaryButton: {
    marginTop: 16,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182F6',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalList: {
    marginTop: 12,
    gap: 10,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F7F9FC',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#191F28',
  },
  modalMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: '#3182F6',
  },
  modalDate: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
  },
  smallButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE4EC',
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4E5968',
  },
  dangerButton: {
    borderColor: '#FFD4D6',
    backgroundColor: '#FFF5F5',
  },
  dangerText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F04452',
  },
  userList: {
    marginTop: 12,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    backgroundColor: '#FFFFFF',
  },
  userCardSelected: {
    borderColor: '#9ECBFF',
    backgroundColor: '#F7FBFF',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3FF',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2F5C9B',
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#191F28',
  },
  userPhone: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
  },
  userMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7684',
  },
  userRightStack: {
    alignItems: 'flex-end',
    gap: 6,
  },
  creditValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#3182F6',
  },
  quickCreditRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  creditQuickButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3FF',
  },
  creditMinusButton: {
    backgroundColor: '#FFF1F2',
  },
  creditQuickText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#3182F6',
  },
  creditMinusText: {
    color: '#F04452',
  },
  emptyBox: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    borderRadius: 18,
    backgroundColor: '#F7F9FC',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: '#8B95A1',
    textAlign: 'center',
  },
  eventList: {
    marginTop: 14,
    gap: 10,
  },
  inlinePanel: {
    marginTop: -2,
    marginLeft: 8,
    marginRight: 8,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8F3FF',
    backgroundColor: '#F7FBFF',
  },
  inlineDetailPanel: {
    marginLeft: 8,
    marginRight: 8,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    backgroundColor: '#FFFFFF',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    backgroundColor: '#FFFFFF',
  },
  eventCardSelected: {
    borderColor: '#9ECBFF',
    backgroundColor: '#F7FBFF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#191F28',
  },
  eventMeta: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
  },
  eventAmountBox: {
    alignItems: 'flex-end',
  },
  eventCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7684',
  },
  eventAmount: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '900',
    color: '#3182F6',
  },
  guestRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
  },
  guestName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#191F28',
  },
  guestMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
  },
  guestAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#191F28',
  },
});
