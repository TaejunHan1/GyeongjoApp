// src/screens/event/guestbook/GuestConfirmScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { DeviceEventEmitter } from 'react-native';
import { supabase } from '../../../lib/supabase';

// ML Kit은 dev client 빌드에서만 동작
let TextRecognition = null;
try {
  TextRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch (_) {}

const DEFAULT_AMOUNTS = [30000, 50000, 70000, 100000, 150000, 200000];

export default function GuestConfirmScreen({ navigation, route }) {
  const { event, handwritingUri, side = 'groom' } = route.params;
  const sideLabel = side === 'groom' ? '신랑측' : '신부측';
  const sideColor = side === 'groom' ? '#3B82F6' : '#EC4899';
  const sideEmoji = side === 'groom' ? '🤵' : '👰';

  const [screenSize, setScreenSize] = useState(Dimensions.get('window'));

  // 인식 상태
  const [recognizing, setRecognizing] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);

  // 금액
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmountVisible, setCustomAmountVisible] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('');

  // 관계
  const [relationDetail, setRelationDetail] = useState(null); // '친척'|'친구'|'직장'|'기타'

  // 저장
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 측 → relation_category
  const relationCategory = side === 'groom' ? '신랑측' : '신부측';

  // 화면 크기 감지 (회전 후 레이아웃 재계산용)
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenSize(window);
    });
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    recognize();
  }, []);

  const recognize = async () => {
    setRecognizing(true);
    try {
      if (!TextRecognition) {
        setCandidates([]);
        setSelectedName('');
        setRecognizing(false);
        return;
      }
      const result = await TextRecognition.recognize(handwritingUri);
      const raw = result?.text?.trim() || '';
      const blockTexts = (result?.blocks || [])
        .map((b) => b.text?.trim())
        .filter((t) => t && t.length > 0);
      const uniqueCandidates = [...new Set([raw, ...blockTexts])]
        .filter((t) => t.length > 0)
        .slice(0, 3);
      setCandidates(uniqueCandidates);
      setSelectedName(uniqueCandidates[0] || '');
    } catch (err) {
      console.warn('TextRecognition unavailable:', err?.message);
      setCandidates([]);
      setSelectedName('');
    } finally {
      setRecognizing(false);
    }
  };

  const handleConfirmName = () => {
    if (!selectedName.trim()) { Alert.alert('알림', '이름을 확인해주세요.'); return; }
    setNameConfirmed(true);
  };

  const amountPresets = (() => {
    const p = event?.preset_amounts;
    return Array.isArray(p) && p.length > 0 ? p : DEFAULT_AMOUNTS;
  })();

  const formatAmount = (amount) => {
    if (!amount) return '';
    const n = Math.round(amount);
    if (n >= 10000) {
      const man = Math.floor(n / 10000);
      const rem = n % 10000;
      return rem === 0 ? `${man}만원` : `${new Intl.NumberFormat('ko-KR').format(n)}원`;
    }
    return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
  };

  const handleCustomAmountConfirm = () => {
    const val = parseInt(customAmountInput.replace(/[^0-9]/g, ''), 10);
    if (!val || val < 1000) { Alert.alert('알림', '1,000원 이상 입력해주세요.'); return; }
    const rounded = Math.round(val / 10000) * 10000 || val;
    setSelectedAmount(rounded);
    setCustomAmountVisible(false);
    setCustomAmountInput('');
  };

  const handleSave = async (skipAmount = false) => {
    const finalAmount = skipAmount ? null : selectedAmount;
    setSaving(true);
    try {
      let handwritingImageUrl = null;
      try {
        const imgPath = `handwriting/${event.id}/${Date.now()}.png`;
        const response = await fetch(handwritingUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(imgPath, blob, { contentType: 'image/png', upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(imgPath);
          handwritingImageUrl = urlData?.publicUrl || null;
        }
      } catch (uploadErr) {
        console.warn('Handwriting image upload failed:', uploadErr);
      }

      const insertPayload = {
        event_id: event.id,
        guest_name: selectedName.trim(),
        guest_phone: null,
        amount: finalAmount,
        relation_category: relationCategory,  // '신랑측' | '신부측'
        relation_detail: relationDetail || '기타',
        is_verified: false,
        input_method: 'handwriting',
        handwriting_image_url: handwritingImageUrl,
        side,
      };

      const { data: insertedData, error } = await supabase
        .from('guest_book')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      // EventDetailScreen에 즉시 반영 (새로고침 불필요)
      DeviceEventEmitter.emit('guestbook_new_entry', {
        eventId: event.id,
        entry: insertedData ?? {
          ...insertPayload,
          id: `local_${Date.now()}`,
          created_at: new Date().toISOString(),
        },
      });

      setSaved(true);
      setTimeout(() => {
        // 세로 복구는 GuestWritingScreen의 intro mode useEffect가 처리
        setSaved(false);
        navigation.navigate('GuestWriting', { event, side });
      }, 2500);
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('저장 오류', '저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleExit = () => {
    Keyboard.dismiss();
    setTimeout(() => navigation.pop(2), Platform.OS === 'android' ? 150 : 0);
  };

  const { width: SW, height: SH } = screenSize;
  const isLandscape = SW > SH;
  const leftW = isLandscape ? SW * 0.42 : SW;
  const rightW = isLandscape ? SW * 0.55 : SW;

  // ── 감사 화면 ──────────────────────────────
  if (saved) {
    return (
      <View style={s.thankYou}>
        <StatusBar hidden />
        <Text style={s.thankYouEmoji}>🙏</Text>
        <Text style={s.thankYouTitle}>감사합니다</Text>
        <Text style={s.thankYouName}>{selectedName} 님</Text>
        <Text style={s.thankYouSub}>방명록이 기록되었습니다</Text>
        <View style={[s.thankYouLine, { backgroundColor: sideColor }]} />
      </View>
    );
  }

  // ── 인식 중 ─────────────────────────────────
  if (recognizing) {
    return (
      <View style={s.loading}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={sideColor} />
        <Text style={s.loadingText}>필기 내용 인식 중...</Text>
      </View>
    );
  }

  // ── 메인 (가로 2열 레이아웃) ───────────────
  return (
    <View style={[s.root, { backgroundColor: '#F8F4EE' }]}>
      <StatusBar hidden />

      {/* 좌: 필기 이미지 패널 */}
      <View style={[s.leftPanel, { width: leftW }]}>

        {/* 필기 원본 */}
        <View style={s.paperWrap}>
          <Text style={s.paperLabel}>✍️  작성하신 내용</Text>
          <View style={[s.paperInner, { height: SH - 80 }]}>
            <Image
              source={{ uri: handwritingUri }}
              style={{ width: leftW - 64, height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 하단: 다시 쓰기 버튼 */}
        <TouchableOpacity
          style={s.rewriteBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.rewriteBtnText}>↩  다시 쓰기</Text>
        </TouchableOpacity>

      </View>

      {/* 구분선 */}
      <View style={s.divider} />

      {/* 우: 이름·금액 패널 */}
      <KeyboardAvoidingView
        style={{ width: rightW }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 나가기 버튼 — 항상 우상단에 고정 */}
        <TouchableOpacity
          style={s.exitBtn}
          onPress={handleExit}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={s.exitBtnText}>✕  나가기</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[s.rightScroll, { minHeight: SH }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!nameConfirmed ? (
            /* 이름 확인 */
            <View style={s.panel}>
              {/* 타이틀 + 아이콘 */}
              <View style={s.panelTitleRow}>
                <View style={[s.panelIcon, { backgroundColor: sideColor + '20' }]}>
                  <Text style={s.panelIconText}>👤</Text>
                </View>
                <View>
                  <Text style={s.panelTitle}>이름 확인</Text>
                  <Text style={s.panelSub}>
                    {candidates.length > 0
                      ? '인식된 이름을 선택하거나 직접 수정하세요'
                      : '아래에 직접 이름을 입력해주세요'}
                  </Text>
                </View>
              </View>

              {candidates.length > 0 && (
                <View style={s.candidateRow}>
                  {candidates.map((c, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[s.candidateBtn, selectedName === c && [s.candidateBtnSel, { borderColor: sideColor, backgroundColor: sideColor + '12' }]]}
                      onPress={() => setSelectedName(c)}
                    >
                      <Text style={[s.candidateBtnText, selectedName === c && { color: sideColor, fontWeight: '700' }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 직접 입력창 */}
              <View style={[s.nameInputWrap, { borderColor: selectedName.trim() ? sideColor : '#D8D0C6' }]}>
                <Text style={s.nameInputIcon}>✏️</Text>
                <TextInput
                  style={s.nameInput}
                  value={selectedName}
                  onChangeText={setSelectedName}
                  placeholder="성함을 입력하세요"
                  placeholderTextColor="#C0B8AC"
                  maxLength={20}
                />
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, { backgroundColor: sideColor }, !selectedName.trim() && s.primaryBtnDisabled]}
                onPress={handleConfirmName}
                disabled={!selectedName.trim()}
              >
                <Text style={s.primaryBtnText}>네, 맞습니다  ✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* 금액 선택 */
            <View style={s.panel}>
              {/* 인사 */}
              <View style={s.greetRow}>
                <Text style={s.greetName}>{selectedName}</Text>
                <Text style={s.greetText}> 님, 축의금을 기록할게요 👋</Text>
              </View>

              {/* 증액 칩: 탭하면 현재 금액에 더해짐 */}
              <View style={s.addChipRow}>
                {[10000, 30000, 50000, 100000].map((add) => (
                  <TouchableOpacity
                    key={add}
                    style={[s.addChip, { borderColor: sideColor }]}
                    onPress={() => setSelectedAmount((prev) => (prev || 0) + add)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.addChipText, { color: sideColor }]}>+{formatAmount(add)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 선택 금액 확인 바 — 칩/프리셋 바로 위, 항상 보임 */}
              <View style={[
                s.amountConfirmBar,
                selectedAmount
                  ? { borderColor: sideColor, backgroundColor: sideColor + '0D' }
                  : { borderColor: '#DDD5C8', backgroundColor: '#F8F4EE' }
              ]}>
                <Text style={[s.amountConfirmLabel, !selectedAmount && { color: '#C0B8AC' }]}>
                  선택 금액
                </Text>
                <Text style={[s.amountConfirmValue, { color: selectedAmount ? sideColor : '#C0B8AC' }]}>
                  {selectedAmount ? formatAmount(selectedAmount) : '—'}
                </Text>
                {selectedAmount && (
                  <TouchableOpacity
                    onPress={() => setSelectedAmount(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[s.amountConfirmReset, { color: sideColor + '80' }]}>초기화</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 프리셋 버튼: 탭하면 해당 금액으로 SET */}
              <Text style={s.presetLabel}>빠른 선택</Text>
              <View style={s.amountGrid}>
                {amountPresets.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[s.amountBtn, selectedAmount === amt && [s.amountBtnSel, { borderColor: sideColor }]]}
                    onPress={() => setSelectedAmount(amt)}
                  >
                    <Text style={[s.amountBtnText, selectedAmount === amt && { color: sideColor, fontWeight: '700' }]}>
                      {formatAmount(amt)}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={s.amountBtn}
                  onPress={() => setCustomAmountVisible(true)}
                >
                  <Text style={s.amountBtnText}>직접입력</Text>
                </TouchableOpacity>
              </View>

              {/* 관계 선택 */}
              <Text style={s.presetLabel}>관계</Text>
              <View style={s.relationRow}>
                {['친척', '친구', '직장', '기타'].map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      s.relationBtn,
                      relationDetail === rel && [s.relationBtnSel, { borderColor: sideColor, backgroundColor: sideColor + '12' }],
                    ]}
                    onPress={() => setRelationDetail((prev) => (prev === rel ? null : rel))}
                  >
                    <Text style={[
                      s.relationBtnText,
                      relationDetail === rel && { color: sideColor, fontWeight: '700' },
                    ]}>
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, { backgroundColor: sideColor }, (!selectedAmount || saving) && s.primaryBtnDisabled]}
                onPress={() => handleSave(false)}
                disabled={saving || !selectedAmount}
              >
                <Text style={s.primaryBtnText}>{saving ? '저장 중...' : '기록하기'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.skipBtn} onPress={() => handleSave(true)} disabled={saving}>
                <Text style={s.skipBtnText}>금액 없이 이름만 기록할게요</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 금액 직접 입력 모달 */}
      <Modal
        visible={customAmountVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAmountVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {/* 현재 금액 표시 */}
            <View style={s.modalAmountDisplay}>
              <Text style={[s.modalAmountNumber, { color: customAmountInput ? sideColor : '#C0B8AC' }]}>
                {customAmountInput
                  ? Number(customAmountInput).toLocaleString('ko-KR')
                  : '0'}
              </Text>
              <Text style={[s.modalAmountUnit, { color: customAmountInput ? sideColor : '#C0B8AC' }]}>원</Text>
            </View>

            {/* 만원 단위 변환 힌트 */}
            {customAmountInput ? (
              <Text style={[s.modalHint, { color: sideColor }]}>
                = {formatAmount(parseInt(customAmountInput, 10))}
              </Text>
            ) : (
              <Text style={s.modalHint}>버튼을 탭하거나 직접 입력하세요</Text>
            )}

            {/* 빠른 증액 칩 */}
            <View style={s.addChipRow}>
              {[10000, 50000, 100000, 200000].map((add) => (
                <TouchableOpacity
                  key={add}
                  style={[s.addChip, { borderColor: sideColor }]}
                  onPress={() => {
                    const cur = parseInt(customAmountInput || '0', 10);
                    setCustomAmountInput(String(cur + add));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.addChipText, { color: sideColor }]}>
                    +{formatAmount(add)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 구분선 */}
            <View style={s.modalDivider} />

            {/* 직접 입력창 */}
            <View style={[s.modalInputWrap, { borderColor: customAmountInput ? sideColor : '#DDD5C8' }]}>
              <Text style={s.modalInputLabel}>직접 입력</Text>
              <TextInput
                style={s.modalInput}
                value={customAmountInput}
                onChangeText={(t) => setCustomAmountInput(t.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor="#C0B8AC"
                keyboardType="number-pad"
                textAlign="right"
              />
              <Text style={s.modalUnit}>원</Text>
            </View>

            {/* 초기화 + 확인 버튼 */}
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => { setCustomAmountVisible(false); setCustomAmountInput(''); }}
              >
                <Text style={s.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalResetBtn}
                onPress={() => setCustomAmountInput('')}
              >
                <Text style={s.modalResetText}>초기화</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalConfirmBtn, { backgroundColor: sideColor }, !customAmountInput && { opacity: 0.4 }]}
                onPress={handleCustomAmountConfirm}
                disabled={!customAmountInput}
              >
                <Text style={s.modalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },

  // 로딩
  loading: {
    flex: 1, backgroundColor: '#F8F4EE',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { fontSize: 16, color: '#8A7F72' },

  // 감사
  thankYou: {
    flex: 1, backgroundColor: '#FDFAF5',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  thankYouEmoji: { fontSize: 80, marginBottom: 8 },
  thankYouTitle: { fontSize: 34, fontWeight: '700', color: '#1A1209', letterSpacing: -0.5 },
  thankYouName: { fontSize: 20, fontWeight: '600', color: '#3C3733' },
  thankYouSub: { fontSize: 15, color: '#9C9185', marginTop: 4 },
  thankYouLine: { width: 48, height: 3, borderRadius: 99, marginTop: 20 },

  // 좌 패널
  leftPanel: {
    backgroundColor: '#FDFAF5',
    justifyContent: 'space-between',
    paddingTop: 16,
  },

  // 종이 래퍼
  paperWrap: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  paperLabel: {
    fontSize: 13, fontWeight: '600', color: '#8A7F72',
  },
  paperInner: {
    backgroundColor: '#FFFEF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD5C8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#8A7F72',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

  // 다시 쓰기
  rewriteBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 10,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8BFB4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0EB',
  },
  rewriteBtnText: { fontSize: 14, color: '#6B6258', fontWeight: '600' },

  // 구분선
  divider: {
    width: 1,
    backgroundColor: '#DDD5C8',
    marginVertical: 16,
  },

  // 우 패널
  rightScroll: {
    justifyContent: 'center',
    paddingVertical: 20,
  },
  panel: {
    paddingHorizontal: 20,
    gap: 14,
  },

  // 타이틀 행 (아이콘 + 텍스트)
  panelTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  panelIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  panelIconText: { fontSize: 22 },
  panelTitle: { fontSize: 17, fontWeight: '700', color: '#1A1209' },
  panelSub: { fontSize: 12, color: '#9C9185', marginTop: 2 },

  // 후보 버튼
  candidateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  candidateBtn: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD5C8',
    backgroundColor: '#F8F4EE',
  },
  candidateBtnSel: {},
  candidateBtnText: { fontSize: 17, color: '#3C3733', fontWeight: '500' },

  // 이름 입력 래퍼
  nameInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 14, borderWidth: 2,
    paddingHorizontal: 14,
    backgroundColor: '#FDFAF5',
    gap: 8,
  },
  nameInputIcon: { fontSize: 18 },
  nameInput: {
    flex: 1, fontSize: 20, color: '#1A1209',
    letterSpacing: 0.5, paddingVertical: 0,
  },

  // 프라이머리 버튼
  primaryBtn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.35, shadowOpacity: 0 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // 인사
  greetRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  greetName: { fontSize: 17, fontWeight: '700', color: '#1A1209' },
  greetText: { fontSize: 13, color: '#6B6258' },

  // 선택 금액 확인 바
  amountConfirmBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 8,
  },
  amountConfirmLabel: {
    fontSize: 12, fontWeight: '600', color: '#8A7F72',
    flex: 0,
  },
  amountConfirmValue: {
    flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center',
  },
  amountConfirmReset: {
    fontSize: 12, fontWeight: '600',
  },

  // 증액 칩
  addChipRow: { flexDirection: 'row', gap: 6 },
  addChip: {
    flex: 1, height: 38, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F4EE',
  },
  addChipText: { fontSize: 13, fontWeight: '700' },

  presetLabel: { fontSize: 11, color: '#A89E90', fontWeight: '600', letterSpacing: 0.5 },

  // 관계 선택
  relationRow: { flexDirection: 'row', gap: 7 },
  relationBtn: {
    flex: 1, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#DDD5C8',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F4EE',
  },
  relationBtnSel: {},
  relationBtnText: { fontSize: 13, fontWeight: '500', color: '#3C3733' },

  // 금액 프리셋 그리드
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  amountBtn: {
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD5C8',
    backgroundColor: '#F8F4EE',
    minWidth: '28%', alignItems: 'center',
  },
  amountBtnSel: { backgroundColor: '#FFF9F0' },
  amountBtnText: { fontSize: 13, fontWeight: '500', color: '#3C3733' },

  // 나가기 버튼
  exitBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 50,
    backgroundColor: '#191F28',
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 4,
  },
  exitBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },

  // 건너뛰기
  skipBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
  skipBtnText: { fontSize: 13, color: '#9C9185' },

  // 모달
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCard: {
    width: 360, backgroundColor: '#FFFFFF',
    borderRadius: 24, padding: 24, gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },

  // 금액 크게 표시
  modalAmountDisplay: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    paddingVertical: 8, gap: 4,
  },
  modalAmountNumber: {
    fontSize: 44, fontWeight: '700', letterSpacing: -1, lineHeight: 52,
  },
  modalAmountUnit: { fontSize: 20, fontWeight: '600', marginBottom: 4 },

  modalHint: { fontSize: 13, color: '#9C9185', textAlign: 'center', marginTop: -6 },

  // 빠른 증액 칩
  addChipRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 8,
  },
  addChip: {
    flex: 1, height: 42, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F6F2',
  },
  addChipText: { fontSize: 14, fontWeight: '700' },

  modalDivider: {
    height: 1, backgroundColor: '#F0EBE4', marginVertical: 2,
  },

  // 직접 입력창
  modalInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14, backgroundColor: '#F8F6F2', gap: 8,
  },
  modalInputLabel: { fontSize: 12, color: '#9C9185', fontWeight: '500' },
  modalInput: {
    flex: 1, fontSize: 20, fontWeight: '600',
    color: '#1A1209', paddingVertical: 0,
  },
  modalUnit: { fontSize: 15, color: '#8A7F72', fontWeight: '500' },

  modalBtns: { flexDirection: 'row', gap: 8 },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E5DDD4', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F0EB',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B6258' },
  modalResetBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E5DDD4', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F0EB',
  },
  modalResetText: { fontSize: 14, fontWeight: '600', color: '#6B6258' },
  modalConfirmBtn: {
    flex: 2, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
