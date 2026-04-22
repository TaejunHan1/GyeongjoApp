// src/screens/main/ProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Modal,
  Linking,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';
import { supabase } from '../../lib/supabase';
import { getAlimtalkBalance } from '../../lib/alimtalkCredit';

// 스마트패스 카카오톡 채널
const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_WsUuX/chat';
const KAKAO_CHANNEL_WEB_URL = 'https://pf.kakao.com/_WsUuX';

export default function ProfileScreen({ navigation, userInfo, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [balance, setBalance] = useState(0);

  // 이름 편집 모달
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      if (!userInfo || !userInfo.userId) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userInfo.userId)
        .single();

      if (profileData) setProfile(profileData);

      const balRes = await getAlimtalkBalance(userInfo.userId);
      if (balRes?.success) setBalance(balRes.balance || 0);
    } catch (error) {
      console.error('Load user data error:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // 크레딧 페이지에서 돌아올 때 잔액 갱신
  useFocusEffect(
    useCallback(() => {
      if (userInfo?.userId) {
        getAlimtalkBalance(userInfo.userId).then((r) => {
          if (r?.success) setBalance(r.balance || 0);
        });
      }
    }, [userInfo?.userId])
  );

  const userName = profile?.name || userInfo?.userName || '사용자';
  const userPhone = formatPhone(profile?.phone || userInfo?.phone?.replace('+82', '0') || userInfo?.phone || '');
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ko-KR')
    : userInfo?.loginTime
      ? new Date(userInfo.loginTime).toLocaleDateString('ko-KR')
      : '—';

  // ── 이름 편집 ──
  const openEdit = () => {
    setEditName(profile?.name || userInfo?.userName || '');
    setEditOpen(true);
  };
  const saveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      Alert.alert('오류', '이름을 입력해주세요');
      return;
    }
    if (!userInfo?.userId) return;
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: trimmed })
        .eq('id', userInfo.userId);
      if (error) throw error;
      setProfile((prev) => ({ ...(prev || {}), name: trimmed }));
      setEditOpen(false);
    } catch (e) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다');
    } finally {
      setEditSaving(false);
    }
  };

  // ── 공유 ──
  const handleShareApp = async () => {
    try {
      await Share.share({
        message: '정담 - 마음을 나누는 가장 쉬운 방법\n경조사 관리를 쉽고 체계적으로 해보세요!',
        title: '정담 앱 공유',
      });
    } catch {}
  };

  // ── 카카오톡 채널 ──
  const openKakaoChannel = async () => {
    try {
      const canOpen = await Linking.canOpenURL(KAKAO_CHANNEL_URL);
      if (canOpen) {
        await Linking.openURL(KAKAO_CHANNEL_URL);
        return;
      }
    } catch {}
    try {
      await Linking.openURL(KAKAO_CHANNEL_WEB_URL);
    } catch {
      Alert.alert('오류', '카카오톡 채널을 열 수 없어요');
    }
  };

  // ── 로그아웃 ──
  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      if (onLogout) await onLogout();
      else await supabase.auth.signOut();
    } catch {
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다');
    }
  };

  // ── 계정 삭제 ──
  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말 계정을 삭제하시겠습니까?\n모든 경조사 데이터가 영구적으로 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => Alert.alert('안내', '계정 삭제 요청은 문의하기를 통해 접수됩니다.\n카카오톡 채널로 연결할게요.', [
            { text: '취소', style: 'cancel' },
            { text: '문의하기', onPress: openKakaoChannel },
          ]),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* 사용자 정보 카드 */}
        <View style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color={Colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userPhone}>{userPhone || '전화번호 미설정'}</Text>
              <Text style={styles.userMeta}>{joinDate} 가입</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color={Colors.primary} />
              <Text style={styles.editBtnText}>편집</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 계정 */}
        <SectionLabel>계정</SectionLabel>
        <View style={styles.menuCard}>
          <MenuItem
            icon="heart-outline"
            title="내 경조사"
            subtitle="등록한 경조사 관리"
            onPress={() => navigation.navigate('MyEvents')}
          />
          <Divider />
          <MenuItem
            icon="chatbubble-ellipses-outline"
            title="알림톡 크레딧"
            subtitle={`잔액 ${balance.toLocaleString('ko-KR')}건 · 충전 및 사용 내역`}
            onPress={() => navigation.navigate('Credit')}
            badge={balance < 5 ? '부족' : null}
          />
        </View>

        {/* 정보 */}
        <SectionLabel>정보</SectionLabel>
        <View style={styles.menuCard}>
          <MenuItem
            icon="share-outline"
            title="앱 공유하기"
            subtitle="친구에게 정담 추천"
            onPress={handleShareApp}
          />
          <Divider />
          <MenuItem
            icon="chatbubble-outline"
            title="문의하기"
            subtitle="카카오톡 채널 스마트패스로 연결"
            onPress={openKakaoChannel}
          />
          <Divider />
          <MenuItem
            icon="document-text-outline"
            title="이용약관"
            onPress={() => navigation.navigate('Terms')}
          />
          <Divider />
          <MenuItem
            icon="shield-checkmark-outline"
            title="개인정보 처리방침"
            onPress={() => navigation.navigate('Privacy')}
          />
        </View>

        {/* 계정 관리 */}
        <View style={styles.accountSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Text style={styles.deleteText}>계정 삭제</Text>
          </TouchableOpacity>
        </View>

        {/* 앱 정보 */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>정담 v1.0.0</Text>
          <Text style={styles.copyright}>© 2026 정담. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* 로그아웃 모달 */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="log-out-outline" size={30} color={Colors.error} />
            </View>
            <Text style={styles.modalTitle}>로그아웃</Text>
            <Text style={styles.modalMessage}>
              정말 로그아웃하시겠어요?{'\n'}다시 로그인하실 때 전화번호 인증이 필요합니다.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowLogoutModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmLogout} activeOpacity={0.85}>
                <Text style={styles.modalConfirmText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 이름 편집 바텀시트 */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setEditOpen(false)}>
            <TouchableOpacity style={styles.sheetBody} activeOpacity={1} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>이름 변경</Text>
              <Text style={styles.sheetSub}>청첩장에 표시될 이름을 입력해주세요</Text>

              <TextInput
                style={styles.sheetInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="이름"
                placeholderTextColor={Colors.gray400}
                maxLength={20}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.sheetSaveBtn, (!editName.trim() || editSaving) && { opacity: 0.5 }]}
                onPress={saveName}
                disabled={!editName.trim() || editSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.sheetSaveText}>{editSaving ? '저장 중...' : '저장'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ───── 서브 컴포넌트 ─────
const SectionLabel = ({ children }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);
const Divider = () => <View style={styles.divider} />;
const MenuItem = ({ icon, title, subtitle, onPress, badge }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuIcon}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
    </View>
    <View style={styles.menuTextWrap}>
      <View style={styles.menuTitleRow}>
        <Text style={styles.menuTitle}>{title}</Text>
        {badge ? (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
  </TouchableOpacity>
);

// ───── 유틸 ─────
const formatPhone = (phone) => {
  const d = (phone || '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone || '';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  // 헤더
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  // 사용자 카드
  userCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  userPhone: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  userMeta: { fontSize: 11, color: Colors.gray400 },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.primary + '08',
  },
  editBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    letterSpacing: 0.3,
  },

  // 메뉴 카드
  menuCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  menuTextWrap: { flex: 1 },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  menuSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  menuBadge: {
    backgroundColor: Colors.error + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  menuBadgeText: { color: Colors.error, fontSize: 10, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.gray100, marginLeft: 64 },

  // 계정 관리
  accountSection: {
    marginHorizontal: 16,
    marginTop: 28,
    gap: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: { color: Colors.error, fontSize: 14, fontWeight: '600' },
  deleteBtn: { alignItems: 'center', paddingVertical: 8 },
  deleteText: { color: Colors.gray500, fontSize: 12, textDecorationLine: 'underline' },

  // 앱 정보
  appInfo: { alignItems: 'center', marginTop: 24, gap: 4 },
  appVersion: { fontSize: 12, color: Colors.gray500 },
  copyright: { fontSize: 11, color: Colors.gray400 },

  // 로그아웃 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.error + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  modalMessage: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalBtnRow: { flexDirection: 'row', gap: 8, width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: Colors.gray100, borderRadius: 10 },
  modalCancelText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: Colors.error, borderRadius: 10 },
  modalConfirmText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  // 이름 편집 바텀시트
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetBody: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sheetSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 18 },
  sheetInput: {
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sheetSaveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetSaveText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
