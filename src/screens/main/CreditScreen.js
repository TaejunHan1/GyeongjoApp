// src/screens/main/CreditScreen.js
// 알림톡 크레딧 관리 화면
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';
import { supabase } from '../../lib/supabase';
import { getAlimtalkBalance } from '../../lib/alimtalkCredit';

const formatKRW = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;

const txTypeLabel = (type) => {
  switch (type) {
    case 'charge': return '충전';
    case 'send':   return '발송';
    case 'refund': return '환불';
    case 'adjust': return '조정';
    default:       return type || '거래';
  }
};

const txTypeColor = (type) => {
  switch (type) {
    case 'charge': return Colors.primary;
    case 'send':   return Colors.gray600;
    case 'refund': return Colors.warning;
    default:       return Colors.gray500;
  }
};

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${dd} ${hh}:${mm}`;
  } catch {
    return '';
  }
};

export default function CreditScreen({ navigation, userInfo }) {
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    const uid = userInfo?.userId;
    if (!uid) return;

    const [balRes, pkgRes, txRes] = await Promise.all([
      getAlimtalkBalance(uid),
      supabase
        .from('alimtalk_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('alimtalk_transactions')
        .select('id, type, credits_change, balance_after, memo, created_at, package_id')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (balRes?.success) setBalance(balRes.balance || 0);
    if (pkgRes?.data) {
      setPackages(pkgRes.data);
      const recommended = pkgRes.data.find((p) => p.is_recommended);
      setSelectedPackage((prev) => prev || recommended?.id || pkgRes.data[0]?.id || null);
    }
    if (txRes?.data) setTransactions(txRes.data);
  }, [userInfo?.userId]);

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
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecharge = () => {
    if (!selectedPackage) return;
    Alert.alert(
      '결제 준비중',
      '인앱결제 시스템이 심사 중입니다.\n곧 충전이 가능해질 예정이에요.',
      [{ text: '확인' }]
    );
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackage);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림톡 크레딧</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* 잔액 카드 */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>현재 잔액</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceNum}>{Number(balance).toLocaleString('ko-KR')}</Text>
              <Text style={styles.balanceUnit}>건</Text>
            </View>
            <Text style={styles.balanceHint}>
              하객에게 부조 접수 알림톡 1건당 크레딧 1건이 차감됩니다
            </Text>
          </View>

          {/* 충전 패키지 */}
          {packages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>충전하기</Text>
              <Text style={styles.sectionSub}>원하시는 패키지를 선택해주세요</Text>

              <View style={styles.pkgList}>
                {packages.map((pkg) => {
                  const total = (pkg.credits || 0) + (pkg.bonus_credits || 0);
                  const isSelected = selectedPackage === pkg.id;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[styles.pkgCard, isSelected && styles.pkgCardSelected]}
                      onPress={() => setSelectedPackage(pkg.id)}
                      activeOpacity={0.85}
                    >
                      {pkg.is_recommended && (
                        <View style={styles.pkgBadge}>
                          <Text style={styles.pkgBadgeText}>추천</Text>
                        </View>
                      )}
                      <View style={styles.pkgHeader}>
                        <Text style={styles.pkgName}>{pkg.name}</Text>
                        {pkg.description ? (
                          <Text style={styles.pkgDesc}>{pkg.description}</Text>
                        ) : null}
                      </View>

                      <View style={styles.pkgBody}>
                        <View style={styles.pkgCreditRow}>
                          <Text style={styles.pkgCreditNum}>{total.toLocaleString('ko-KR')}</Text>
                          <Text style={styles.pkgCreditUnit}>건</Text>
                        </View>
                        {pkg.bonus_credits > 0 && (
                          <Text style={styles.pkgBonus}>
                            기본 {pkg.credits}건 + 보너스 {pkg.bonus_credits}건
                          </Text>
                        )}
                        <Text style={styles.pkgPrice}>{formatKRW(pkg.price_krw)}</Text>
                      </View>

                      <View style={styles.pkgRadio}>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                        ) : (
                          <Ionicons name="ellipse-outline" size={22} color={Colors.gray300} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.rechargeBtn, !selectedPkg && styles.rechargeBtnDisabled]}
                onPress={handleRecharge}
                disabled={!selectedPkg}
                activeOpacity={0.85}
              >
                <Ionicons name="card-outline" size={18} color="#fff" />
                <Text style={styles.rechargeBtnText}>
                  {selectedPkg ? `${formatKRW(selectedPkg.price_krw)} 충전하기` : '패키지를 선택해주세요'}
                </Text>
              </TouchableOpacity>

              <View style={styles.noticeBox}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.gray500} />
                <Text style={styles.noticeText}>
                  현재 인앱결제 시스템 심사 중입니다. 정식 오픈 전까지 테스트용 크레딧이 지급됩니다.
                </Text>
              </View>
            </View>
          )}

          {/* 거래 내역 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>거래 내역</Text>

            {transactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="receipt-outline" size={32} color={Colors.gray300} />
                <Text style={styles.emptyText}>아직 거래 내역이 없어요</Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const isPositive = tx.credits_change > 0;
                return (
                  <View key={tx.id} style={styles.txItem}>
                    <View style={[styles.txTypeTag, { backgroundColor: txTypeColor(tx.type) + '15' }]}>
                      <Text style={[styles.txTypeText, { color: txTypeColor(tx.type) }]}>
                        {txTypeLabel(tx.type)}
                      </Text>
                    </View>
                    <View style={styles.txBody}>
                      <Text style={styles.txMemo} numberOfLines={1}>
                        {tx.memo || (tx.type === 'charge' ? '크레딧 충전' : tx.type === 'send' ? '알림톡 발송' : tx.type === 'refund' ? '발송 실패 환불' : '크레딧 조정')}
                      </Text>
                      <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txChange, { color: isPositive ? Colors.primary : Colors.gray700 }]}>
                        {isPositive ? '+' : ''}{tx.credits_change}건
                      </Text>
                      <Text style={styles.txBalance}>잔액 {tx.balance_after}건</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: { width: 26, alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  // 잔액 카드
  balanceCard: {
    margin: 20,
    padding: 28,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginBottom: 10, letterSpacing: 0.5 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline' },
  balanceNum: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  balanceUnit: { fontSize: 18, fontWeight: '600', color: '#fff', marginLeft: 6 },
  balanceHint: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 10, lineHeight: 18 },

  // 섹션
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },

  // 패키지
  pkgList: { gap: 10 },
  pkgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    padding: 16,
    position: 'relative',
  },
  pkgCardSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  pkgBadge: {
    position: 'absolute',
    top: -8,
    right: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pkgBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  pkgHeader: { flex: 1 },
  pkgName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  pkgDesc: { fontSize: 11, color: Colors.textSecondary },

  pkgBody: { alignItems: 'flex-end', marginRight: 12 },
  pkgCreditRow: { flexDirection: 'row', alignItems: 'baseline' },
  pkgCreditNum: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  pkgCreditUnit: { fontSize: 13, color: Colors.textPrimary, marginLeft: 2, fontWeight: '600' },
  pkgBonus: { fontSize: 10, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  pkgPrice: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },

  pkgRadio: { width: 22, alignItems: 'center' },

  // 충전 버튼
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 16,
  },
  rechargeBtnDisabled: { backgroundColor: Colors.gray300 },
  rechargeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.gray50,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  noticeText: { flex: 1, fontSize: 11, color: Colors.gray500, lineHeight: 16 },

  // 거래 내역
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  emptyText: { fontSize: 13, color: Colors.textSecondary },

  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  txTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 42,
    alignItems: 'center',
    marginRight: 10,
  },
  txTypeText: { fontSize: 11, fontWeight: '700' },
  txBody: { flex: 1 },
  txMemo: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  txDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  txRight: { alignItems: 'flex-end' },
  txChange: { fontSize: 14, fontWeight: '700' },
  txBalance: { fontSize: 10, color: Colors.textSecondary, marginTop: 3 },
});
