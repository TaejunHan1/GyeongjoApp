// src/screens/event/guestbook/GuestConfirmScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, TextInput, Modal, ActivityIndicator, Alert,
  Dimensions, KeyboardAvoidingView, Platform, StatusBar, Keyboard,
} from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { sendAlimtalkWithCredit, getAlimtalkBalance } from '../../../lib/alimtalkCredit';
import { normalizePhone, samePhone, isValidKoreanMobile } from '../../../lib/phoneUtils';
import SimpleModal from '../../../components/SimpleModal';
import { useSimpleAlert } from '../../../hooks/useSimpleAlert';
import { useTutorial } from '../../../contexts/TutorialContext';

const DEFAULT_AMOUNTS = [30000, 50000, 70000, 100000, 150000, 200000];

export default function GuestConfirmScreen({ navigation, route }) {
  const {
    event,
    handwritingUri,
    side = 'groom',
    inkCandidates = [],
    recognitionDebug = null,
    paperTemplateId,
  } = route.params;
  const isFuneralEvent = event?.event_type === 'funeral';
  const sideMeta = isFuneralEvent
    ? { label: '조문객', color: '#4E5968', bg: '#F2F4F6', category: '조문객' }
    : (side === 'groom'
        ? { label: '신랑측 하객', color: '#3182F6', bg: '#E8F3FF', category: '신랑측' }
        : { label: '신부측 하객', color: '#F04452', bg: '#FFF0F1', category: '신부측' });
  const sideColor  = sideMeta.color;
  const sideBg     = sideMeta.bg;
  const sideLabel  = sideMeta.label;
  const amountLabel = isFuneralEvent ? '조의금' : '축의금';
  const visitorLabel = isFuneralEvent ? '조문' : '하객';
  const relationOptions = isFuneralEvent
    ? ['가족', '친척', '친구', '동료', '지인', '기타']
    : ['친척', '친구', '직장', '기타'];
  const relationRows = isFuneralEvent
    ? [['가족', '친척', '친구'], ['동료', '지인', '기타']]
    : [relationOptions];

  const [screenSize, setScreenSize]           = useState(Dimensions.get('window'));
  const [recognizing, setRecognizing]         = useState(true);
  const [candidates, setCandidates]           = useState([]);
  const [selectedName, setSelectedName]       = useState('');
  const [nameConfirmed, setNameConfirmed]     = useState(false);
  const [selectedAmount, setSelectedAmount]   = useState(0);
  const [relationDetail, setRelationDetail]   = useState(null);
  const [ticketCount, setTicketCount]          = useState(0);
  const [guestPhone, setGuestPhone]           = useState('');
  const [phoneVisible, setPhoneVisible]       = useState(false);
  // 휴대폰 번호 중복 체크 — idle | checking | available | duplicate | invalid
  const [phoneCheckStatus, setPhoneCheckStatus] = useState('idle');
  const [duplicateGuestName, setDuplicateGuestName] = useState('');
  // 주최자 알림톡 크레딧 잔액 (0이면 카카오톡 영수증 불가)
  const [alimtalkBalance, setAlimtalkBalance] = useState(null);
  // 공통 Alert 훅
  const { showAlert, alertProps } = useSimpleAlert();
  const [customAmountVisible, setCustomAmountVisible] = useState(false);
  const [customAmountInput, setCustomAmountInput]     = useState('');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const scrollRef = useRef(null);

  // ── 튜토리얼 ──
  const { activeTutorial, step: tutorialStep, registerTarget, resumeTutorial, advanceStep: tutorialAdvance } = useTutorial();
  const nameAreaRef = useRef(null);
  const yesBtnRef = useRef(null);
  const amountRelationRef = useRef(null);
  const kakaoToggleRef = useRef(null);
  const phoneAreaRef = useRef(null);
  const saveBtnRef = useRef(null);

  // 서명패드에서 넘어오면 튜토리얼 재개
  useEffect(() => {
    if (activeTutorial === 'myEvents' && tutorialStep?.id === 'me_guest_confirm_name') {
      resumeTutorial();
    }
  }, [activeTutorial, tutorialStep?.id, resumeTutorial]);

  // 튜토리얼: 금액/관계 스텝 진입 시 임의값 자동 선택
  useEffect(() => {
    if (activeTutorial !== 'myEvents') return;
    if (tutorialStep?.id !== 'me_guest_amount_relation') return;
    if (!nameConfirmed) return;
    if (selectedAmount === 0) setSelectedAmount(50000);
    if (!relationDetail) setRelationDetail('친구');
  }, [activeTutorial, tutorialStep?.id, nameConfirmed]);

  // 튜토리얼: 카카오/휴대폰 스텝 진입 시 해당 영역이 보이도록 자동 스크롤 (모바일 가로 대응)
  useEffect(() => {
    if (activeTutorial !== 'myEvents') return;
    if (!nameConfirmed) return;
    const id = tutorialStep?.id;
    if (id !== 'me_guest_kakao_toggle' && id !== 'me_guest_phone_input') return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
    return () => clearTimeout(t);
  }, [activeTutorial, tutorialStep?.id, nameConfirmed, phoneVisible]);

  // 튜토리얼 타겟 반복 측정 (이름 영역 / 네,맞습니다 버튼 / 금액·관계 영역)
  useEffect(() => {
    if (activeTutorial !== 'myEvents') return;
    if (recognizing) return;
    const stepId = tutorialStep?.id;
    const measureRef = (ref, key) => {
      if (ref.current?.measureInWindow) {
        ref.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            registerTarget(key, { x, y, width, height });
          }
        });
      }
    };
    const measure = () => {
      if (!nameConfirmed && (stepId === 'me_guest_confirm_name' || stepId === 'me_guest_confirm_btn')) {
        measureRef(nameAreaRef, 'guestConfirmNameArea');
        measureRef(yesBtnRef, 'guestConfirmYesBtn');
      }
      if (nameConfirmed && stepId === 'me_guest_amount_relation') {
        measureRef(amountRelationRef, 'guestConfirmAmountRelation');
      }
      if (nameConfirmed && stepId === 'me_guest_kakao_toggle') {
        measureRef(kakaoToggleRef, 'guestConfirmKakaoToggle');
      }
      if (nameConfirmed && stepId === 'me_guest_phone_input' && phoneVisible) {
        measureRef(phoneAreaRef, 'guestConfirmPhoneArea');
      }
      if (nameConfirmed && stepId === 'me_guest_save_btn') {
        measureRef(saveBtnRef, 'guestConfirmSaveBtn');
      }
    };
    measure();
    const id = setInterval(measure, 500);
    return () => clearInterval(id);
  }, [activeTutorial, tutorialStep?.id, nameConfirmed, recognizing, phoneVisible, registerTarget]);

  // 튜토리얼: 휴대폰 번호가 유효(available)해지면 키보드 내리고 기록하기 스텝으로 자동 이동
  useEffect(() => {
    if (activeTutorial !== 'myEvents') return;
    if (tutorialStep?.id !== 'me_guest_phone_input') return;
    if (phoneCheckStatus === 'available') {
      Keyboard.dismiss();
      tutorialAdvance();
    }
  }, [activeTutorial, tutorialStep?.id, phoneCheckStatus]);

  const relationCategory = sideMeta.category;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenSize(window));
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    const filtered = (inkCandidates || [])
      .map(t => t?.trim()).filter(t => t && t.length > 0).slice(0, 5);
    setCandidates(filtered);
    setSelectedName(filtered[0] || '');
    setRecognizing(false);
  }, [inkCandidates]);

  // 주최자 알림톡 크레딧 조회 + realtime 구독
  useEffect(() => {
    const uid = event?.user_id;
    if (!uid) return;

    // 초기 fetch
    getAlimtalkBalance(uid).then(res => {
      if (res?.success) setAlimtalkBalance(res.balance);
    });

    // realtime 구독 — 다른 화면에서 차감돼도 여기서도 즉시 반영
    const channel = supabase
      .channel(`guestconfirm_balance_${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${uid}`,
        },
        (payload) => {
          const next = payload?.new?.alimtalk_balance;
          if (typeof next === 'number') setAlimtalkBalance(next);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [event?.user_id]);

  // 크레딧이 0으로 떨어지면 카카오 영수증 토글 자동 해제
  useEffect(() => {
    if (alimtalkBalance != null && alimtalkBalance <= 0 && phoneVisible) {
      setPhoneVisible(false);
      setGuestPhone('');
    }
  }, [alimtalkBalance]);

  // 휴대폰 번호 중복 체크 (debounced) — 같은 행사의 guest_book에서 검색
  useEffect(() => {
    if (!phoneVisible || !event?.id) {
      setPhoneCheckStatus('idle');
      setDuplicateGuestName('');
      return;
    }
    const normalized = normalizePhone(guestPhone);
    if (!normalized) {
      setPhoneCheckStatus('idle');
      return;
    }
    if (normalized.length < 11) {
      setPhoneCheckStatus('idle'); // 입력 중 — 아직 판정 보류
      return;
    }
    if (!isValidKoreanMobile(normalized)) {
      setPhoneCheckStatus('invalid');
      return;
    }

    setPhoneCheckStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('guest_book')
          .select('guest_name, guest_phone')
          .eq('event_id', event.id);
        if (error) throw error;
        const dup = (data || []).find(c => samePhone(c.guest_phone, normalized));
        if (dup) {
          setDuplicateGuestName(dup.guest_name || '');
          setPhoneCheckStatus('duplicate');
        } else {
          setDuplicateGuestName('');
          setPhoneCheckStatus('available');
        }
      } catch (e) {
        console.warn('phone duplicate check failed:', e);
        setPhoneCheckStatus('idle');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [guestPhone, phoneVisible, event?.id]);

  const amountPresets = (() => {
    const p = event?.preset_amounts;
    return Array.isArray(p) && p.length > 0 ? p : DEFAULT_AMOUNTS;
  })();

  const fmt = (n) => {
    if (!n) return '';
    const v = Math.round(n), man = Math.floor(v / 10000), rem = v % 10000;
    if (v >= 10000) return rem === 0 ? `${man}만원` : `${new Intl.NumberFormat('ko-KR').format(v)}원`;
    return `${new Intl.NumberFormat('ko-KR').format(v)}원`;
  };
  const fmtShort = (n) => `${Math.floor(n / 10000)}만`;
  const fmtComma = (n) => n ? new Intl.NumberFormat('ko-KR').format(Math.round(n)) : '0';

  const formatPhone = (text) => {
    const d = text.replace(/[^0-9]/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
  };

  const handleConfirmName = () => {
    if (!selectedName.trim()) { showAlert({ title: '알림', message: '성함을 확인해주세요.' }); return; }
    // 튜토리얼: "네, 맞습니다" 버튼 탭 스텝이면 다음(금액/관계)으로 진행
    if (tutorialStep?.id === 'me_guest_confirm_btn') tutorialAdvance();
    setNameConfirmed(true);
  };

  const handleCustomAmountConfirm = () => {
    const val = parseInt(customAmountInput.replace(/[^0-9]/g, ''), 10);
    if (!val || val < 1000) { showAlert({ title: '알림', message: '1,000원 이상 입력해주세요.' }); return; }
    setSelectedAmount(Math.round(val / 10000) * 10000 || val);
    setCustomAmountVisible(false);
    setCustomAmountInput('');
  };

  const handleSave = async (skipAmount = false) => {
    if (!selectedName.trim()) { showAlert({ title: '알림', message: '성함을 확인해주세요.' }); return; }
    if (!skipAmount && selectedAmount === 0) { showAlert({ title: '알림', message: '금액을 선택해주세요.' }); return; }
    // 전화번호 입력한 상태에서 중복/유효하지 않으면 저장 막기
    if (phoneVisible && guestPhone && (phoneCheckStatus === 'duplicate' || phoneCheckStatus === 'invalid')) {
      return;
    }
    const finalAmount = skipAmount ? null : selectedAmount;
    const cleanPhone  = normalizePhone(guestPhone);
    setSaving(true);
    try {
      let handwritingImageUrl = null;
      try {
        const imgPath = `handwriting/${event.id}/${Date.now()}.png`;
        const response = await fetch(handwritingUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('event-images').upload(imgPath, blob, { contentType: 'image/png', upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(imgPath);
          handwritingImageUrl = urlData?.publicUrl || null;
        }
      } catch (e) { console.warn('Handwriting upload failed:', e); }

      const insertPayload = {
        event_id: event.id,
        guest_name: selectedName.trim(),
        guest_phone: cleanPhone || null,
        amount: finalAmount,
        relation_category: relationCategory,
        relation_detail: relationDetail || '기타',
        ticket_count: isFuneralEvent ? 0 : ticketCount,
        is_verified: false,
        input_method: 'handwriting',
        handwriting_image_url: handwritingImageUrl,
        side,
        additional_info: {
          created_via: 'app_guest_reception',
          receipt_requested: !!(cleanPhone && finalAmount),
          source_screen: 'GuestConfirmScreen',
        },
      };

      const { data: insertedData, error } = await supabase
        .from('guest_book').insert(insertPayload).select().single();
      if (error) throw error;

      if (cleanPhone && finalAmount && event?.user_id) {
        sendAlimtalkWithCredit({
          userId: event.user_id,
          eventId: event.id,
          contributionId: insertedData?.id,
          phone: cleanPhone,
          guestName: selectedName.trim(),
          amount: finalAmount,
          side,
          relationship: relationDetail || 'other',
        })
          .then((res) => {
            if (!res?.success) {
              // 주최자 기기를 손님이 쓰는 시나리오 — 손님에게 크레딧 부족 노출하지 않음
              if (res?.error === 'insufficient_balance') {
                console.warn('[Alimtalk] 잔액 부족으로 발송 스킵');
              } else {
                console.warn('[Alimtalk] 발송 실패:', res?.error, res?.message);
              }
            }
          })
          .catch((e) => console.warn('[Alimtalk] 예외:', e));
      }

      DeviceEventEmitter.emit('guestbook_new_entry', {
        eventId: event.id,
        entry: insertedData ?? { ...insertPayload, id: `local_${Date.now()}`, created_at: new Date().toISOString() },
      });

      // 튜토리얼 분기: 기록하기 스텝이면 감사 화면 스킵하고 EventDetail로 즉시 복귀 + 마지막 스텝 표시
      if (tutorialStep?.id === 'me_guest_save_btn') {
        Keyboard.dismiss();
        tutorialAdvance();
        // pop(2): GuestConfirm + GuestWriting 동시에 제거 → EventDetail로 복귀 (GuestWriting 언마운트 시 세로 복구)
        navigation.pop(2);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setSelectedName(''); setNameConfirmed(false);
        setSelectedAmount(0); setRelationDetail(null); setTicketCount(0);
        setGuestPhone(''); setPhoneVisible(false);
        navigation.navigate('GuestWriting', { event, side, paperTemplateId });
      }, 2500);
    } catch (err) {
      console.error('Save error:', err);
      showAlert({ title: '저장 오류', message: '저장 중 오류가 발생했습니다.' });
    } finally { setSaving(false); }
  };

  const handleExit = () => {
    Keyboard.dismiss();
    setTimeout(() => navigation.pop(2), Platform.OS === 'android' ? 150 : 0);
  };

  const { width: SW, height: SH } = screenSize;
  const sc     = Math.max(1, Math.min(SH / 820, 1.45));
  const leftW  = nameConfirmed ? 0 : SW * 0.38;
  const rightW = nameConfirmed ? SW : SW * 0.62;
  const dense = nameConfirmed ? 0.82 : 1;

  const d = {
    ph:           Math.round((nameConfirmed ? 28 : 32) * sc),
    gap8:         Math.round(8  * sc * dense),
    gap12:        Math.round(12 * sc * dense),
    gap16:        Math.round(16 * sc * dense),
    gap20:        Math.round(20 * sc * dense),
    gap24:        Math.round(24 * sc * dense),
    gap32:        Math.round(32 * sc * dense),
    gap40:        Math.round(40 * sc * dense),
    gap48:        Math.round(48 * sc * dense),
    r12:          Math.round(12 * sc),
    r14:          Math.round(14 * sc),
    r16:          Math.round(16 * sc),
    r20:          Math.round(20 * sc),
    titleFs:      Math.round((nameConfirmed ? 19 : 24) * sc),
    inputFs:      Math.round(24 * sc),
    candFs:       Math.round(16 * sc),
    chipFs:       Math.round((nameConfirmed ? 15 : 18) * sc),
    presetFs:     Math.round((nameConfirmed ? 15 : 18) * sc),
    relationFs:   Math.round((nameConfirmed ? 16 : 20) * sc),
    amountBigFs:  Math.round((nameConfirmed ? 24 : 30) * sc),
    amountUnitFs: Math.round((nameConfirmed ? 16 : 20) * sc),
    amountLblFs:  Math.round((nameConfirmed ? 13 : 16) * sc),
    resetFs:      Math.round((nameConfirmed ? 12 : 14) * sc),
    toggleFs:     Math.round((nameConfirmed ? 15 : 18) * sc),
    optionalFs:   Math.round((nameConfirmed ? 12 : 14) * sc),
    hintFs:       Math.round(13 * sc),
    phoneLblFs:   Math.round(15 * sc),
    phoneFs:      Math.round(22 * sc),
    saveBtnFs:    Math.round(22 * sc),
    skipBtnFs:    Math.round(16 * sc),
    inputH:       Math.round(64 * sc),
    chipH:        Math.round((nameConfirmed ? 42 : 52) * sc),
    presetH:      Math.round((nameConfirmed ? 46 : 58) * sc),
    relationH:    Math.round((nameConfirmed ? 48 : 64) * sc),
    btnH:         Math.round((nameConfirmed ? 58 : 72) * sc),
    actionBarH:   Math.round((nameConfirmed ? 104 : 136) * sc),
    swW:          Math.round((nameConfirmed ? 42 : 48) * sc),
    swH:          Math.round((nameConfirmed ? 23 : 26) * sc),
    swThumb:      Math.round((nameConfirmed ? 16 : 18) * sc),
  };

  // ── 인식 중 ──
  if (recognizing) {
    return (
      <View style={s.recognizing}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#3182F6" style={{ marginBottom: d.gap32 }} />
        <Text style={[s.recognizingText, { fontSize: Math.round(28 * sc) }]}>
          작성하신 성함을 스캔하고 있습니다
        </Text>
      </View>
    );
  }

  // ── 감사 화면 ──
  if (saved) {
    return (
      <View style={s.thanks}>
        <StatusBar hidden />
        <Text style={{ fontSize: Math.round(80 * sc), marginBottom: d.gap16 }}>🙏</Text>
        <Text style={[s.thanksTitle, { fontSize: Math.round(40 * sc) }]}>
          <Text style={{ color: sideColor }}>{selectedName}</Text>{'님,\n'}
          방명록 기록이 완료되었습니다
        </Text>
        <Text style={[s.thanksSub, { fontSize: Math.round(22 * sc), marginTop: d.gap12 }]}>
          소중한 발걸음에 진심으로 감사드립니다.
        </Text>
      </View>
    );
  }

  const row1 = amountPresets.slice(0, 4);
  const row2 = amountPresets.slice(4, 6);
  const recognitionTiming = recognitionDebug?.timing || {};
  const recognitionDebugLines = recognitionDebug ? [
    `stage: ${recognitionDebug.stage || '-'}`,
    `moduleLoaded: ${String(recognitionDebug.moduleLoaded ?? '-')}`,
    `language: ${recognitionDebug.languageTag || recognitionDebug.language || '-'} -> ${recognitionDebug.resolvedLanguageTag || '-'}`,
    `strokes/points: ${recognitionDebug.strokeCount ?? '-'} / ${recognitionDebug.pointCount ?? '-'}`,
    `model: before=${String(recognitionDebug.modelDownloadedBefore ?? '-')} after=${String(recognitionDebug.modelDownloadedAfter ?? recognitionDebug.modelDownloaded ?? '-')}`,
    `timing: capture=${recognitionTiming.captureMs ?? '-'}ms recognize=${recognitionTiming.recognizeMs ?? '-'}ms total=${recognitionTiming.totalBeforeNavigateMs ?? '-'}ms`,
    `raw: ${(recognitionDebug.rawCandidates || recognitionDebug.candidates || []).join(', ') || '[]'}`,
    `normalized: ${(recognitionDebug.normalizedCandidates || []).join(', ') || '[]'}`,
    recognitionDebug.error ? `error: ${recognitionDebug.error}` : null,
  ].filter(Boolean) : [];

  return (
    <View style={[s.root, { backgroundColor: '#F2F4F6' }]}>
      <StatusBar hidden />

      {/* ── 좌: 서명 패널 — 이름 확인 단계에서만 표시 ── */}
      {!nameConfirmed && (
        <>
          <View style={[s.leftPanel, { width: leftW }]}>
            {/* 측 배지 */}
            <View style={[s.sideBadge, { backgroundColor: sideBg, margin: d.gap20, alignSelf: 'flex-start', borderRadius: d.r12 }]}>
              <Text style={[s.sideBadgeText, { color: sideColor, fontSize: Math.round(16 * sc) }]}>{sideLabel}</Text>
            </View>

            {/* 서명 이미지 */}
            <View style={[s.sigCard, { marginHorizontal: d.gap16, marginBottom: d.gap12 }]}>
              <Text style={[s.sigLabel, { fontSize: Math.round(15 * sc), marginBottom: d.gap8 }]}>작성하신 서명</Text>
              <View style={[s.sigImageWrap, { borderRadius: d.r16 }]}>
                <Image
                  source={{ uri: handwritingUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* 다시 쓰기 */}
            <TouchableOpacity
              style={[s.rewriteBtn, { marginHorizontal: d.gap16, marginBottom: d.gap24, height: d.btnH, borderRadius: d.r16 }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[s.rewriteBtnText, { fontSize: Math.round(18 * sc) }]}>↩  다시 쓰기</Text>
            </TouchableOpacity>
          </View>

          <View style={s.divider} />
        </>
      )}

      {/* ── 우: 입력 패널 ── */}
      <View style={[s.rightPanel, { width: rightW }]}>
        {/* 나가기 */}
        <TouchableOpacity
          style={[s.exitBtn, { top: d.gap20, right: d.gap20 }]}
          onPress={handleExit}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[s.exitBtnText, { fontSize: Math.round(14 * sc) }]}>✕  나가기</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              paddingHorizontal: d.ph,
              paddingTop: d.gap48,
              paddingBottom: d.actionBarH + d.gap24,
              flexGrow: 1,
              justifyContent: 'center',
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── Step 1: 성함 확인 ── */}
            {!nameConfirmed ? (
              <View ref={nameAreaRef} collapsable={false} style={{ gap: d.gap16 }}>
                <Text style={[s.secTitle, { fontSize: d.titleFs }]}>성함을 확인해주세요</Text>

                {candidates.length === 0 && recognitionDebugLines.length > 0 && (
                  <View style={s.debugBox}>
                    <Text style={s.debugTitle}>손글씨 인식 디버그</Text>
                    {recognitionDebugLines.map((line, index) => (
                      <Text key={`${line}-${index}`} style={s.debugText}>{line}</Text>
                    ))}
                  </View>
                )}

                {candidates.length > 0 && (
                  <View style={[s.candRow, { gap: d.gap8 }]}>
                    {candidates.map((c, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          s.candChip,
                          { paddingHorizontal: d.gap16, height: Math.round(44 * sc), borderRadius: 999 },
                          selectedName === c && { backgroundColor: sideColor + '15', borderColor: sideColor },
                        ]}
                        onPress={() => setSelectedName(c)}
                      >
                        <Text style={[
                          s.candText, { fontSize: d.candFs },
                          selectedName === c && { color: sideColor, fontWeight: '700' },
                        ]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={[s.inputWrap, { height: d.inputH, borderRadius: d.r16 },
                  selectedName.trim() ? { borderColor: sideColor } : {}]}>
                  <TextInput
                    style={[s.inputText, { fontSize: d.inputFs }]}
                    value={selectedName}
                    onChangeText={setSelectedName}
                    placeholder="이름 직접 입력"
                    placeholderTextColor="#D1D6DB"
                    maxLength={20}
                    autoFocus={candidates.length === 0}
                  />
                  {selectedName.length > 0 && (
                    <TouchableOpacity
                      style={[s.clearBtn, { width: Math.round(28 * sc), height: Math.round(28 * sc), borderRadius: 999 }]}
                      onPress={() => setSelectedName('')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: Math.round(12 * sc), fontWeight: '700' }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (

            /* ── Step 2: 금액 / 관계 / 영수증 ── */
              <View style={{ gap: d.gap16 }}>

                {/* 인사 */}
                <Text style={[s.greetText, { fontSize: Math.round(17 * sc) }]}>
                  <Text style={{ color: sideColor, fontWeight: '800' }}>{selectedName}</Text> 님, {amountLabel}을 기록해주세요 👋
                </Text>

                <View style={s.confirmGrid}>
                  {/* 튜토리얼 타겟: 금액 + 관계 영역 */}
                  <View
                    ref={amountRelationRef}
                    collapsable={false}
                    style={[s.confirmGridColLeft, { gap: d.gap16, paddingRight: d.gap16 }]}
                  >
                    <View style={s.confirmColumnHeader}>
                      <Text style={[s.confirmColumnTitle, { fontSize: Math.round(15 * sc) }]}>{amountLabel} 정보</Text>
                      <Text style={[s.confirmColumnSub, { fontSize: Math.round(11 * sc) }]}>금액과 {visitorLabel} 구분을 확인해요</Text>
                    </View>

                {/* 섹션: 부조금 */}
                <View style={{ gap: d.gap12 }}>
                  <Text style={[s.secTitle, { fontSize: d.titleFs }]}>금액을 선택해주세요</Text>

                  {/* 선택 금액 바 */}
                  <View style={[s.amountBar, { borderRadius: d.r16, paddingHorizontal: d.gap16, paddingVertical: d.gap12 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: d.gap8, flex: 1 }}>
                      <Text style={[s.amountBarLbl, { fontSize: d.amountLblFs }]}>선택 금액</Text>
                      <Text style={[s.amountBarVal, { fontSize: d.amountBigFs }]}>
                        {fmtComma(selectedAmount)}
                        <Text style={[s.amountBarUnit, { fontSize: d.amountUnitFs }]}>원</Text>
                      </Text>
                    </View>
                    {selectedAmount > 0 && (
                      <TouchableOpacity
                        style={[s.resetBtn, { paddingHorizontal: d.gap12, paddingVertical: Math.round(6 * sc), borderRadius: Math.round(8 * sc) }]}
                        onPress={() => setSelectedAmount(0)}
                      >
                        <Text style={[s.resetBtnText, { fontSize: d.resetFs }]}>초기화 ✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 증액 칩 */}
                  <View style={[s.row, { gap: d.gap8 }]}>
                    {[10000, 30000, 50000, 100000].map(add => (
                      <TouchableOpacity
                        key={add}
                        style={[s.addChip, { flex: 1, height: d.chipH, borderRadius: d.r14 }]}
                        onPress={() => setSelectedAmount(p => p + add)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.addChipText, { fontSize: d.chipFs }]}>+{add / 10000}만</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* 빠른 선택 row1 */}
                  <View style={[s.row, { gap: d.gap8 }]}>
                    {row1.map(val => (
                      <TouchableOpacity
                        key={val}
                        style={[s.presetBtn, { flex: 1, height: d.presetH, borderRadius: d.r14 },
                          selectedAmount === val ? s.presetSel : s.presetDef]}
                        onPress={() => setSelectedAmount(val)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.presetText, { fontSize: d.presetFs }, selectedAmount === val && { color: '#FFFFFF' }]}>
                          {fmtShort(val)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* 빠른 선택 row2 + 직접입력 */}
                  <View style={[s.row, { gap: d.gap8 }]}>
                    {row2.map(val => (
                      <TouchableOpacity
                        key={val}
                        style={[s.presetBtn, { flex: 1, height: d.presetH, borderRadius: d.r14 },
                          selectedAmount === val ? s.presetSel : s.presetDef]}
                        onPress={() => setSelectedAmount(val)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.presetText, { fontSize: d.presetFs }, selectedAmount === val && { color: '#FFFFFF' }]}>
                          {fmtShort(val)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[s.presetBtn, s.presetDef, { flex: 2, height: d.presetH, borderRadius: d.r14 }]}
                      onPress={() => setCustomAmountVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.presetText, { fontSize: d.presetFs, color: '#4E5968' }]}>직접 입력하기 ›</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 섹션: 관계 */}
                {!isFuneralEvent && (
                  <View style={{ gap: d.gap12 }}>
                    <Text style={[s.secTitle, { fontSize: d.titleFs }]}>어떤 분으로 오셨나요?</Text>
                    <View style={{ gap: d.gap8 }}>
                      {relationRows.map((row, rowIndex) => (
                        <View key={rowIndex} style={[s.row, { gap: d.gap8 }]}>
                          {row.map(rel => (
                            <TouchableOpacity
                              key={rel}
                              style={[s.relBtn, { flex: 1, height: d.relationH, borderRadius: d.r16 },
                                relationDetail === rel ? s.relSel : s.relDef]}
                              onPress={() => setRelationDetail(p => p === rel ? null : rel)}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.relText, { fontSize: d.relationFs }, relationDetail === rel && { color: '#FFFFFF' }]}>
                                {rel}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                  </View>

                  <View style={s.confirmGridDivider} />

                  <View style={[s.confirmGridColRight, { gap: d.gap16, paddingLeft: d.gap16 }]}>
                    <View style={s.confirmColumnHeader}>
                      <Text style={[s.confirmColumnTitle, { fontSize: Math.round(15 * sc) }]}>접수 옵션</Text>
                      <Text style={[s.confirmColumnSub, { fontSize: Math.round(11 * sc) }]}>
                        {isFuneralEvent ? '영수증 발송을 선택해요' : '식권과 영수증 발송을 선택해요'}
                      </Text>
                    </View>
                {/* 섹션: 식권 */}
                {!isFuneralEvent && (
                  <View style={{ gap: d.gap12 }}>
                    <Text style={[s.secTitle, { fontSize: d.titleFs }]}>식권은 몇 장 필요하신가요?</Text>
                    <View style={[s.ticketBox, { borderRadius: d.r16, paddingHorizontal: d.gap16, paddingVertical: d.gap12 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.ticketBoxTitle, { fontSize: Math.round(13 * sc) }]}>필요 식권</Text>
                        <Text style={[s.ticketBoxValue, { fontSize: Math.round(22 * sc) }]}>
                          {ticketCount === 0 ? '없음' : `${ticketCount}장`}
                        </Text>
                      </View>
                      <View style={[s.ticketStepper, { height: d.chipH, borderRadius: d.r14 }]}>
                        <TouchableOpacity
                          style={s.ticketStepBtn}
                          onPress={() => setTicketCount(prev => Math.max(0, prev - 1))}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="remove" size={Math.round(22 * sc)} color={ticketCount === 0 ? '#C5CCD5' : '#4E5968'} />
                        </TouchableOpacity>
                        <Text style={[s.ticketStepText, { fontSize: Math.round(17 * sc) }]}>{ticketCount}</Text>
                        <TouchableOpacity
                          style={s.ticketStepBtn}
                          onPress={() => setTicketCount(prev => Math.min(10, prev + 1))}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="add" size={Math.round(22 * sc)} color="#4E5968" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={[s.row, { gap: d.gap8 }]}>
                      {[0, 1, 2, 3, 4].map(count => (
                        <TouchableOpacity
                          key={count}
                          style={[
                            s.ticketChip,
                            { flex: 1, height: d.chipH, borderRadius: d.r14 },
                            ticketCount === count ? s.ticketChipSel : s.ticketChipDef,
                          ]}
                          onPress={() => setTicketCount(count)}
                          activeOpacity={0.75}
                        >
                          <Text style={[
                            s.ticketChipText,
                            { fontSize: d.chipFs },
                            ticketCount === count && { color: '#FFFFFF' },
                          ]}>
                            {count === 0 ? '없음' : `${count}장`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* 섹션: 카카오 영수증 */}
                <View style={{ gap: d.gap8 }}>
                  <Text style={[s.secTitle, { fontSize: d.titleFs }]}>영수증 안내</Text>
                  {(() => {
                    const noCredit = alimtalkBalance != null && alimtalkBalance <= 0;
                    return (
                      <TouchableOpacity
                        ref={kakaoToggleRef}
                        collapsable={false}
                        style={[s.kakaoToggle, { borderRadius: d.r16, paddingHorizontal: d.gap16, paddingVertical: d.gap12 },
                          phoneVisible ? s.kakaoOn : s.kakaoOff,
                          noCredit && s.kakaoDisabled]}
                        onPress={() => {
                          if (noCredit) {
                            showAlert({
                              title: '크레딧 부족',
                              message: '카카오 알림톡 크레딧이 소진되어 영수증을 보낼 수 없습니다.\n주최자에게 충전을 요청해주세요.',
                            });
                            return;
                          }
                          const next = !phoneVisible;
                          setPhoneVisible(next);
                          if (!next) setGuestPhone('');
                          else {
                            setGuestPhone('010-');
                            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                          }
                          // 튜토리얼: 토글 탭 스텝이면 다음으로
                          if (tutorialStep?.id === 'me_guest_kakao_toggle' && !phoneVisible) {
                            tutorialAdvance();
                          }
                        }}
                        activeOpacity={noCredit ? 1 : 0.8}
                      >
                        <View style={[s.kakaoIcon, { width: Math.round(32 * sc), height: Math.round(32 * sc), borderRadius: 999 },
                          noCredit && { backgroundColor: '#E5E8EB' }]}>
                          <Text style={{ fontSize: Math.round(15 * sc), opacity: noCredit ? 0.4 : 1 }}>📱</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.kakaoText, { fontSize: d.toggleFs },
                            noCredit && { color: '#8B95A1' }]}>
                            카카오톡으로 영수증 받기
                            {!noCredit && <Text style={[s.kakaoOpt, { fontSize: d.optionalFs }]}> (선택)</Text>}
                          </Text>
                          {noCredit && (
                            <Text style={[s.kakaoOpt, { fontSize: d.optionalFs, color: '#EF4444', marginTop: 2 }]}>
                              크레딧 부족으로 이용할 수 없습니다
                            </Text>
                          )}
                        </View>
                        <View style={[s.sw, { width: d.swW, height: d.swH, borderRadius: 999 },
                          noCredit ? { backgroundColor: '#E5E8EB' } :
                          phoneVisible ? { backgroundColor: '#3182F6' } : { backgroundColor: '#D1D6DB' }]}>
                          <View style={[s.swThumb, { width: d.swThumb, height: d.swThumb, borderRadius: 999 },
                            phoneVisible && !noCredit ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
                        </View>
                      </TouchableOpacity>
                    );
                  })()}

                  {phoneVisible && (
                    <View
                      ref={phoneAreaRef}
                      collapsable={false}
                      style={[s.phoneArea, { borderRadius: d.r16, padding: d.gap16 }]}
                    >
                      <Text style={[s.phoneLbl, { fontSize: d.phoneLblFs, marginBottom: d.gap8 }]}>휴대폰 번호</Text>
                      <View style={[s.inputWrap, { height: d.inputH, borderRadius: d.r12 },
                        guestPhone ? { borderColor: '#FEE500' } : {},
                        phoneCheckStatus === 'duplicate' || phoneCheckStatus === 'invalid' ? { borderColor: '#EF4444' } : {},
                        phoneCheckStatus === 'available' ? { borderColor: '#22C55E' } : {},
                      ]}>
                        <TextInput
                          style={[s.inputText, { fontSize: d.phoneFs, letterSpacing: 1 }]}
                          value={guestPhone}
                          onChangeText={t => setGuestPhone(formatPhone(t))}
                          placeholder="010-0000-0000"
                          placeholderTextColor="#D1D6DB"
                          keyboardType="phone-pad"
                          maxLength={13}
                          autoFocus
                        />
                        {phoneCheckStatus === 'checking' && (
                          <ActivityIndicator size="small" color="#8B95A1" style={{ marginLeft: 8 }} />
                        )}
                        {phoneCheckStatus === 'available' && (
                          <Ionicons name="checkmark-circle" size={Math.round(22 * sc)} color="#22C55E" style={{ marginLeft: 8 }} />
                        )}
                        {(phoneCheckStatus === 'duplicate' || phoneCheckStatus === 'invalid') && (
                          <Ionicons name="close-circle" size={Math.round(22 * sc)} color="#EF4444" style={{ marginLeft: 8 }} />
                        )}
                      </View>
                      {phoneCheckStatus === 'duplicate' ? (
                        <Text style={[s.phoneHint, { fontSize: d.hintFs, marginTop: d.gap8, color: '#EF4444' }]}>
                          ✗  이미 {duplicateGuestName || '다른 분'}님이 같은 번호로 등록되어 있어요.
                        </Text>
                      ) : phoneCheckStatus === 'invalid' ? (
                        <Text style={[s.phoneHint, { fontSize: d.hintFs, marginTop: d.gap8, color: '#EF4444' }]}>
                          ✗  올바른 휴대폰 번호를 입력해주세요.
                        </Text>
                      ) : phoneCheckStatus === 'available' ? (
                        <Text style={[s.phoneHint, { fontSize: d.hintFs, marginTop: d.gap8, color: '#22C55E' }]}>
                          ✓  등록 가능한 번호입니다.
                        </Text>
                      ) : (
                        <Text style={[s.phoneHint, { fontSize: d.hintFs, marginTop: d.gap8 }]}>
                          ✓  기록 완료 시 카카오 알림톡으로 부조 내역이 발송됩니다.
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {isFuneralEvent && (
                  <View style={{ gap: d.gap12 }}>
                    <Text style={[s.secTitle, { fontSize: d.titleFs }]}>어떤 분으로 오셨나요?</Text>
                    <View style={{ gap: d.gap8 }}>
                      {relationRows.map((row, rowIndex) => (
                        <View key={rowIndex} style={[s.row, { gap: d.gap8 }]}>
                          {row.map(rel => (
                            <TouchableOpacity
                              key={rel}
                              style={[s.relBtn, { flex: 1, height: d.relationH, borderRadius: d.r16 },
                                relationDetail === rel ? s.relSel : s.relDef]}
                              onPress={() => setRelationDetail(p => p === rel ? null : rel)}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.relText, { fontSize: d.relationFs }, relationDetail === rel && { color: '#FFFFFF' }]}>
                                {rel}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                  </View>
                </View>

              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── 고정 하단 버튼 바 ── */}
        <View style={[s.actionBar, { padding: d.gap20, gap: d.gap12 }]}>
          {!nameConfirmed ? (
            // Step 1: 이름 확인 버튼
            <TouchableOpacity
              ref={yesBtnRef}
              collapsable={false}
              style={[s.saveBtn, { flex: 1, height: d.btnH, borderRadius: d.r20, backgroundColor: sideColor },
                !selectedName.trim() && { opacity: 0.4 }]}
              onPress={handleConfirmName}
              disabled={!selectedName.trim()}
              activeOpacity={0.85}
            >
              <Text style={[s.saveBtnText, { fontSize: d.saveBtnFs }]}>네, 맞습니다  ✓</Text>
            </TouchableOpacity>
          ) : (
            // Step 2: 기록 버튼
            <>
              <TouchableOpacity
                style={[s.skipBtn, { flex: 4, height: d.btnH, borderRadius: d.r20 }]}
                onPress={() => handleSave(true)}
                disabled={saving}
              >
                <Text style={[s.skipBtnText, { fontSize: d.skipBtnFs }]}>금액 없이 이름만 기록할게요</Text>
              </TouchableOpacity>
              {(() => {
                // 카카오톡 번호 입력 토글 ON일 때: 11자리 완성 + 중복 아닐 때만 활성화
                const phoneBlockingSave =
                  phoneVisible && phoneCheckStatus !== 'available';
                const saveDisabled = saving || selectedAmount === 0 || phoneBlockingSave;
                return (
                  <TouchableOpacity
                    ref={saveBtnRef}
                    collapsable={false}
                    style={[s.saveBtn, { flex: 6, height: d.btnH, borderRadius: d.r20 },
                      saveDisabled && { opacity: 0.4 }]}
                    onPress={() => handleSave(false)}
                    disabled={saveDisabled}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.saveBtnText, { fontSize: d.saveBtnFs }]}>{saving ? '저장 중...' : '기록하기'}</Text>
                  </TouchableOpacity>
                );
              })()}
            </>
          )}
        </View>
      </View>

      {/* ── 직접 금액 입력 모달 ── */}
      <Modal visible={customAmountVisible} transparent animationType="fade" onRequestClose={() => setCustomAmountVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { borderRadius: Math.round(24 * sc), padding: Math.round(24 * sc), gap: Math.round(14 * sc) }]}>
            <View style={s.modalAmtRow}>
              <Text style={[s.modalAmtNum, { color: customAmountInput ? '#191F28' : '#D1D6DB', fontSize: Math.round(44 * sc) }]}>
                {customAmountInput ? Number(customAmountInput).toLocaleString('ko-KR') : '0'}
              </Text>
              <Text style={[s.modalAmtUnit, { color: customAmountInput ? '#191F28' : '#D1D6DB', fontSize: Math.round(20 * sc) }]}>원</Text>
            </View>
            {customAmountInput
              ? <Text style={[s.modalHint, { color: '#3182F6', fontSize: Math.round(13 * sc) }]}>= {fmt(parseInt(customAmountInput, 10))}</Text>
              : <Text style={[s.modalHint, { fontSize: Math.round(13 * sc) }]}>버튼을 탭하거나 직접 입력하세요</Text>
            }
            <View style={[s.row, { gap: Math.round(8 * sc) }]}>
              {[10000, 50000, 100000, 200000].map(add => (
                <TouchableOpacity
                  key={add}
                  style={[s.modalChip, { flex: 1, height: Math.round(42 * sc), borderRadius: Math.round(12 * sc) }]}
                  onPress={() => setCustomAmountInput(String(parseInt(customAmountInput || '0') + add))}
                  activeOpacity={0.7}
                >
                  <Text style={[s.modalChipText, { fontSize: Math.round(14 * sc) }]}>+{fmt(add)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalDivider} />
            <View style={[s.modalInputWrap, { height: Math.round(52 * sc), borderRadius: Math.round(12 * sc), borderColor: customAmountInput ? '#3182F6' : '#E5E8EB' }]}>
              <Text style={[s.modalInputLbl, { fontSize: Math.round(12 * sc) }]}>직접 입력</Text>
              <TextInput
                style={[s.modalInput, { fontSize: Math.round(20 * sc) }]}
                value={customAmountInput}
                onChangeText={t => setCustomAmountInput(t.replace(/[^0-9]/g, ''))}
                placeholder="0" placeholderTextColor="#D1D6DB"
                keyboardType="number-pad" textAlign="right"
              />
              <Text style={[s.modalUnit, { fontSize: Math.round(15 * sc) }]}>원</Text>
            </View>
            <View style={[s.row, { gap: Math.round(8 * sc) }]}>
              <TouchableOpacity style={[s.modalCancelBtn, { flex: 1, height: Math.round(48 * sc), borderRadius: Math.round(12 * sc) }]}
                onPress={() => { setCustomAmountVisible(false); setCustomAmountInput(''); }}>
                <Text style={[s.modalCancelText, { fontSize: Math.round(14 * sc) }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalResetBtn, { flex: 1, height: Math.round(48 * sc), borderRadius: Math.round(12 * sc) }]}
                onPress={() => setCustomAmountInput('')}>
                <Text style={[s.modalResetText, { fontSize: Math.round(14 * sc) }]}>초기화</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalConfirmBtn, { flex: 2, height: Math.round(48 * sc), borderRadius: Math.round(12 * sc) }, !customAmountInput && { opacity: 0.4 }]}
                onPress={handleCustomAmountConfirm} disabled={!customAmountInput}>
                <Text style={[s.modalConfirmText, { fontSize: Math.round(15 * sc) }]}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 공통 커스텀 Alert (iOS/안드 통일) */}
      <SimpleModal {...alertProps} />
    </View>
  );
}

const s = StyleSheet.create({
  recognizing: { flex: 1, backgroundColor: '#191F28', alignItems: 'center', justifyContent: 'center' },
  recognizingText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center', paddingHorizontal: 40 },

  thanks: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60, gap: 12 },
  thanksTitle: { fontWeight: '800', color: '#191F28', textAlign: 'center' },
  thanksSub: { color: '#8B95A1', fontWeight: '700', textAlign: 'center' },

  root: { flex: 1, flexDirection: 'row' },

  // 좌 패널
  leftPanel: { backgroundColor: '#F9FAFB', flexDirection: 'column' },
  sideBadge: { paddingHorizontal: 14, paddingVertical: 8 },
  sideBadgeText: { fontWeight: '800' },
  sigCard: { flex: 1, gap: 8 },
  sigLabel: { color: '#8B95A1', fontWeight: '700' },
  sigImageWrap: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E6DED1',
    backgroundColor: '#F8F4EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rewriteBtn: {
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D1D6DB',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rewriteBtnText: { color: '#4E5968', fontWeight: '700' },

  divider: { width: 1, backgroundColor: '#E5E8EB' },

  // 우 패널
  rightPanel: { flex: 1, backgroundColor: '#FFFFFF', position: 'relative' },
  exitBtn: {
    position: 'absolute', zIndex: 100,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E8EB',
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  exitBtnText: { color: '#8B95A1', fontWeight: '700' },

  row: { flexDirection: 'row' },
  confirmGrid: { flexDirection: 'row', alignItems: 'stretch' },
  confirmGridColLeft: {
    width: '50%',
    minWidth: 0,
  },
  confirmGridColRight: {
    width: '50%',
    minWidth: 0,
  },
  confirmGridDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#EEF2F7',
  },
  confirmColumnHeader: {
    paddingBottom: 2,
  },
  confirmColumnTitle: {
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.2,
  },
  confirmColumnSub: {
    marginTop: 3,
    fontWeight: '700',
    color: '#8B95A1',
  },
  secTitle: { fontWeight: '800', color: '#191F28', letterSpacing: -0.3 },
  greetText: { color: '#4E5968', fontWeight: '600' },
  debugBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  debugTitle: {
    color: '#9A3412',
    fontWeight: '900',
    marginBottom: 2,
  },
  debugText: {
    color: '#7C2D12',
    fontSize: 12,
    fontWeight: '700',
  },

  // 후보 칩
  candRow: { flexDirection: 'row', flexWrap: 'wrap' },
  candChip: { borderWidth: 1.5, borderColor: '#E5E8EB', backgroundColor: '#F2F4F6', alignItems: 'center', justifyContent: 'center' },
  candText: { color: '#4E5968', fontWeight: '600' },

  // 입력창
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E8EB', paddingHorizontal: 20,
  },
  inputText: { flex: 1, color: '#191F28', fontWeight: '700', paddingVertical: 0 },
  clearBtn: { backgroundColor: '#D1D6DB', alignItems: 'center', justifyContent: 'center' },

  // 금액 바
  amountBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F3FF', borderWidth: 1, borderColor: '#D3E4FF',
  },
  amountBarLbl: { fontWeight: '700', color: '#3182F6' },
  amountBarVal: { fontWeight: '800', color: '#191F28', letterSpacing: -1 },
  amountBarUnit: { fontWeight: '600', color: '#4E5968' },
  resetBtn: { backgroundColor: '#FFFFFF' },
  resetBtnText: { color: '#3182F6', fontWeight: '700' },

  addChip: { backgroundColor: '#F2F4F6', alignItems: 'center', justifyContent: 'center' },
  addChipText: { color: '#4E5968', fontWeight: '800' },

  presetBtn: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  presetDef: { backgroundColor: '#FFFFFF', borderColor: '#E5E8EB' },
  presetSel: { backgroundColor: '#191F28', borderColor: '#191F28' },
  presetText: { color: '#4E5968', fontWeight: '800' },

  relBtn: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  relDef: { backgroundColor: '#FFFFFF', borderColor: '#E5E8EB' },
  relSel: { backgroundColor: '#191F28', borderColor: '#191F28' },
  relText: { color: '#4E5968', fontWeight: '800' },

  ticketBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E5E8EB',
  },
  ticketBoxTitle: {
    fontWeight: '800',
    color: '#8B95A1',
    marginBottom: 3,
  },
  ticketBoxValue: {
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.5,
  },
  ticketStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E8EB',
    overflow: 'hidden',
  },
  ticketStepBtn: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketStepText: {
    width: 42,
    textAlign: 'center',
    fontWeight: '900',
    color: '#191F28',
  },
  ticketChip: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketChipDef: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E8EB',
  },
  ticketChipSel: {
    backgroundColor: '#191F28',
    borderColor: '#191F28',
  },
  ticketChipText: {
    color: '#4E5968',
    fontWeight: '800',
  },

  // 하단 액션 바
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F2F4F6',
    flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 8,
  },
  skipBtn: { borderWidth: 2, borderColor: '#D1D6DB', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  skipBtnText: { color: '#4E5968', fontWeight: '700' },
  saveBtn: {
    backgroundColor: '#3182F6', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3182F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.3 },

  // 모달
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: {
    width: 380, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  modalAmtRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  modalAmtNum: { fontWeight: '700', letterSpacing: -1, lineHeight: 52 },
  modalAmtUnit: { fontWeight: '600', marginBottom: 4 },
  modalHint: { color: '#9C9185', textAlign: 'center', marginTop: -6 },
  modalChip: { borderWidth: 1.5, borderColor: '#3182F6', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F5FF' },
  modalChipText: { color: '#3182F6', fontWeight: '700' },
  modalDivider: { height: 1, backgroundColor: '#F0EBE4', marginVertical: 2 },
  modalInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 14, backgroundColor: '#F8F6F2', gap: 8 },
  modalInputLbl: { color: '#9C9185', fontWeight: '500' },
  modalInput: { flex: 1, fontWeight: '600', color: '#1A1209', paddingVertical: 0 },
  modalUnit: { color: '#8A7F72', fontWeight: '500' },
  modalCancelBtn: { borderWidth: 1.5, borderColor: '#E5DDD4', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0EB' },
  modalCancelText: { fontWeight: '600', color: '#6B6258' },
  modalResetBtn: { borderWidth: 1.5, borderColor: '#E5DDD4', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0EB' },
  modalResetText: { fontWeight: '600', color: '#6B6258' },
  modalConfirmBtn: { backgroundColor: '#3182F6', alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  modalConfirmText: { fontWeight: '700', color: '#FFFFFF' },

  // 카카오 영수증
  kakaoToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kakaoOn: { backgroundColor: '#FFFDE7', borderWidth: 1.5, borderColor: '#FEE500' },
  kakaoOff: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E8EB' },
  kakaoIcon: { backgroundColor: '#FEE500', alignItems: 'center', justifyContent: 'center' },
  kakaoText: { color: '#191F28', fontWeight: '700' },
  kakaoOpt: { color: '#8B95A1', fontWeight: '500' },
  sw: { padding: 3, justifyContent: 'center' },
  swThumb: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  phoneArea: { backgroundColor: '#FFFDE7', borderWidth: 1.5, borderColor: '#FEE500' },
  phoneLbl: { color: '#4E5968', fontWeight: '700' },
  phoneHint: { color: '#8B95A1', fontWeight: '500' },
  kakaoDisabled: { backgroundColor: '#F2F4F6', borderColor: '#E5E8EB', borderWidth: 1.5 },
});
