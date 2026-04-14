import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Animated, StyleSheet, Dimensions, Alert, PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');

// ── 아이콘 폴백 ──
const Ic = {
  Back:   () => <Text style={{ fontSize: 24, color: '#191F28', fontWeight: '300' }}>‹</Text>,
  Plus:   () => <Text style={{ fontSize: 20, color: '#fff', fontWeight: '700' }}>+</Text>,
  Trash:  () => <Text style={{ fontSize: 15, color: '#D1D6DB' }}>🗑</Text>,
  Check:  () => <Text style={{ fontSize: 22, color: '#3182F6', fontWeight: '700' }}>✓</Text>,
  ChevR:  () => <Text style={{ fontSize: 16, color: '#B0B8C1' }}>›</Text>,
  ChevD:  () => <Text style={{ fontSize: 14, color: '#8B95A1' }}>▾</Text>,
  More:   () => <Text style={{ fontSize: 20, color: '#8B95A1' }}>⋮</Text>,
  Zap:    () => <Text style={{ fontSize: 14 }}>⚡</Text>,
  X:      () => <Text style={{ fontSize: 26, color: '#D1D6DB' }}>✕</Text>,
  Reload: () => <Text style={{ fontSize: 14, color: '#8B95A1' }}>↺</Text>,
  Search: () => <Text style={{ fontSize: 18, color: '#8B95A1' }}>🔍</Text>,
};

// ── 데이터 ──
const INIT_EVENTS = [
  { id: 1, title: '우리 결혼식',      status: 'ongoing',   date: '2026. 05. 20', type: 'wedding' },
  { id: 2, title: '아버지 칠순 잔치', status: 'completed', date: '2025. 11. 15', type: 'birthday' },
  { id: 3, title: '조모상',           status: 'ongoing',   date: '2026. 04. 14', type: 'funeral' },
];

const INIT_ENTRIES = [
  { id: 1, eventId: 1, name: '김토스', amount: 150000, isConfirmed: false, relation: '신랑 친구',    time: '09:39' },
  { id: 2, eventId: 1, name: '이페이', amount:  50000, isConfirmed: true,  relation: '신부 직장동료', time: '10:12' },
  { id: 3, eventId: 1, name: '박뱅크', amount: 200000, isConfirmed: false, relation: '가족',         time: '11:45' },
  { id: 4, eventId: 2, name: '최주식', amount: 300000, isConfirmed: true,  relation: '친척',         time: '14:20' },
  { id: 5, eventId: 3, name: '정조문', amount: 100000, isConfirmed: false, relation: '지인',         time: '18:30' },
];

function fmt(n) { return n.toLocaleString('ko-KR'); }

function getTheme(type) {
  switch (type) {
    case 'wedding':  return { bg: '#FEE3E8', text: '#F04452', emoji: '💍' };
    case 'birthday': return { bg: '#FFF0D4', text: '#F08C00', emoji: '🎂' };
    case 'funeral':  return { bg: '#F2F4F6', text: '#191F28', emoji: '🕊️' };
    default:         return { bg: '#E8F3FF', text: '#3182F6', emoji: '🎉' };
  }
}

// ── 서명 캔버스 (PanResponder) ──
function SignatureCanvas({ onDraw }) {
  const [strokes, setStrokes] = useState([]);
  const currentStroke = useRef([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentStroke.current = [{ x: locationX, y: locationY }];
        onDraw(true);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentStroke.current = [...currentStroke.current, { x: locationX, y: locationY }];
        setStrokes(prev => {
          const copy = [...prev];
          const idx = copy.length === 0 ? 0 : copy.length - 1;
          copy[idx] = [...currentStroke.current];
          return copy;
        });
      },
      onPanResponderRelease: () => {
        setStrokes(prev => [...prev, [...currentStroke.current]]);
        currentStroke.current = [];
      },
    })
  ).current;

  const clear = () => { setStrokes([]); onDraw(false); };

  return (
    <View style={{ flex: 1 }}>
      <View style={sc.canvas} {...panResponder.panHandlers}>
        {strokes.length === 0 && (
          <View style={sc.placeholder}>
            <Text style={sc.placeholderText}>이곳에 정자로 적어주세요</Text>
          </View>
        )}
        {strokes.map((stroke, si) =>
          stroke.length >= 2
            ? stroke.slice(1).map((pt, pi) => {
                const prev = stroke[pi];
                const dx = pt.x - prev.x;
                const dy = pt.y - prev.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                return (
                  <View
                    key={`${si}-${pi}`}
                    style={[sc.segment, {
                      width: len,
                      left: prev.x,
                      top: prev.y - 2.5,
                      transform: [{ rotate: `${angle}deg` }],
                    }]}
                  />
                );
              })
            : null
        )}
      </View>
      <TouchableOpacity style={sc.clearBtn} onPress={clear} activeOpacity={0.85}>
        <Ic.Reload /><Text style={sc.clearText}>  다시쓰기</Text>
      </TouchableOpacity>
    </View>
  );
}

const sc = StyleSheet.create({
  canvas:          { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E8EB', borderRadius: 24, overflow: 'hidden', position: 'relative' },
  placeholder:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 18, fontWeight: '700', color: '#D1D6DB' },
  segment:         { position: 'absolute', height: 5, backgroundColor: '#191F28', borderRadius: 3 },
  clearBtn:        { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#F2F4F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginTop: 12 },
  clearText:       { fontSize: 14, fontWeight: '700', color: '#8B95A1' },
});

// ── 토스트 훅 ──
function useToast() {
  const [msg, setMsg] = useState('');
  const anim = useRef(new Animated.Value(0)).current;
  const show = (m) => {
    setMsg(m);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };
  const style = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
  };
  return { msg, show, style };
}

// ======================================================================
// 메인 앱
// ======================================================================
export default function App() {
  const insets = useSafeAreaInsets();
  const toast  = useToast();

  const [view,       setView]       = useState('main');
  const [selEventId, setSelEventId] = useState(null);
  const [events,     setEvents]     = useState(INIT_EVENTS);
  const [entries,    setEntries]    = useState(INIT_ENTRIES);

  // detail 필터
  const [detailFilter, setDetailFilter] = useState('all');
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [openMenuId,   setOpenMenuId]   = useState(null);

  // kiosk 상태
  const [kioskData, setKioskData] = useState({ side: '', recognizedName: '', relation: '', amount: 0 });
  const [hasStroke, setHasStroke] = useState(false);

  // 화면 전환 애니메이션
  const slideAnim = useRef(new Animated.Value(0)).current;

  const navigate = (next, dir = 'forward') => {
    const from = dir === 'forward' ? W : -W * 0.3;
    slideAnim.setValue(from);
    setView(next);
    Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }).start();
  };

  // 통계
  const getStats = (eventId) => {
    const ev = entries.filter(e => e.eventId === eventId);
    return {
      count:       ev.length,
      total:       ev.reduce((s, e) => s + e.amount, 0),
      unconfirmed: ev.filter(e => !e.isConfirmed).length,
    };
  };

  const totalMoney = entries.reduce((s, e) => s + e.amount, 0);

  const handleDeleteEvent = (id) => {
    Alert.alert('삭제', '이 경조사를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
        setEvents(prev => prev.filter(e => e.id !== id));
        setEntries(prev => prev.filter(e => e.eventId !== id));
        toast.show('삭제되었습니다.');
      }},
    ]);
  };

  const startKiosk = (eventId) => {
    setSelEventId(eventId);
    setKioskData({ side: '', recognizedName: '', relation: '', amount: 0 });
    setHasStroke(false);
    const ev = events.find(e => e.id === eventId);
    navigate(ev?.type === 'wedding' ? 'kiosk-select' : 'kiosk-draw');
  };

  const exitKiosk = () => {
    Alert.alert('종료', '하객용 화면을 종료하고 관리자 화면으로 돌아가시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '종료', onPress: () => navigate('detail', 'backward') },
    ]);
  };

  const submitGuestbook = () => {
    if (!kioskData.recognizedName.trim()) { toast.show('이름을 확인해주세요.'); return; }
    if (!kioskData.relation)              { toast.show('관계를 선택해주세요.'); return; }
    if (kioskData.amount === 0)           { toast.show('금액을 입력해주세요.'); return; }
    const ev = events.find(e => e.id === selEventId);
    const prefix = kioskData.side === 'groom' ? '신랑측 ' : kioskData.side === 'bride' ? '신부측 ' : '';
    const newEntry = {
      id: Date.now(),
      eventId: selEventId,
      name: kioskData.recognizedName,
      amount: kioskData.amount,
      isConfirmed: false,
      relation: `${prefix}${kioskData.relation}`,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setEntries(prev => [newEntry, ...prev]);
    navigate('kiosk-thanks');
    setTimeout(() => {
      setKioskData({ side: '', recognizedName: '', relation: '', amount: 0 });
      setHasStroke(false);
      navigate(ev?.type === 'wedding' ? 'kiosk-select' : 'kiosk-draw', 'backward');
    }, 3000);
  };

  // ── 1. 메인 화면 ──
  const MainView = () => {
    const topPad = insets.top + 16;
    return (
      <View style={{ flex: 1, backgroundColor: '#F2F4F6' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={[mv.header, { paddingTop: topPad }]}>
            <Text style={mv.tabActive}>내 경조사</Text>
            <TouchableOpacity onPress={() => toast.show('참여 내역은 준비 중입니다.')}>
              <Text style={mv.tabInactive}>참여 내역</Text>
            </TouchableOpacity>
          </View>

          {/* 총액 카드 */}
          <View style={mv.totalCard}>
            <View style={mv.totalRow}>
              <Text style={mv.totalLabel}>모인 부조금 총액</Text>
              <Ic.ChevR />
            </View>
            <Text style={mv.totalAmt}>{fmt(totalMoney)}<Text style={mv.totalUnit}>원</Text></Text>
          </View>

          {/* 경조사 카드 목록 */}
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {events.map(ev => {
              const stats = getStats(ev.id);
              const theme = getTheme(ev.type);
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={mv.card}
                  onPress={() => { setSelEventId(ev.id); setDetailFilter('all'); navigate('detail'); }}
                  activeOpacity={0.95}
                >
                  {/* 카드 헤더 */}
                  <View style={mv.cardHeader}>
                    <View style={mv.cardHeaderLeft}>
                      <View style={[mv.emoji, { backgroundColor: theme.bg }]}>
                        <Text style={{ fontSize: 20 }}>{theme.emoji}</Text>
                      </View>
                      <View style={mv.cardTitleRow}>
                        <Text style={mv.cardTitle}>{ev.title}</Text>
                        {ev.status === 'ongoing' && <View style={mv.dot} />}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteEvent(ev.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ic.Trash />
                    </TouchableOpacity>
                  </View>

                  <Text style={mv.cardAmt}>{fmt(stats.total)}<Text style={mv.cardAmtUnit}>원</Text></Text>

                  {/* 버튼 */}
                  <View style={mv.cardBtns}>
                    <TouchableOpacity
                      style={mv.btnSecondary}
                      onPress={() => { setSelEventId(ev.id); setDetailFilter('all'); navigate('detail'); }}
                      activeOpacity={0.88}
                    >
                      <Text style={mv.btnSecondaryText}>내역 관리</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={mv.btnPrimary} onPress={() => startKiosk(ev.id)} activeOpacity={0.88}>
                      <Text style={mv.btnPrimaryText}>하객 접수</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 미확정 알림 */}
                  {stats.unconfirmed > 0 && (
                    <TouchableOpacity
                      style={mv.unconfirmedRow}
                      onPress={() => { setSelEventId(ev.id); setDetailFilter('unconfirmed'); navigate('detail'); }}
                      activeOpacity={0.85}
                    >
                      <View style={mv.unconfirmedLeft}>
                        <View style={mv.zapCircle}><Ic.Zap /></View>
                        <View>
                          <Text style={mv.unconfirmedSub}>새로운 부조금</Text>
                          <Text style={mv.unconfirmedMain}>미확정 내역이 {stats.unconfirmed}건 있어요</Text>
                        </View>
                      </View>
                      <Ic.ChevR />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[mv.cta, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={mv.ctaBtn} onPress={() => toast.show('새 경조사 추가 화면 이동')} activeOpacity={0.88}>
            <Ic.Plus /><Text style={mv.ctaBtnText}> 새 경조사 추가</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── 2. 상세 화면 ──
  const DetailView = () => {
    const ev = events.find(e => e.id === selEventId);
    if (!ev) return null;
    const stats = getStats(ev.id);
    const theme = getTheme(ev.type);
    const filtered = entries
      .filter(e => e.eventId === ev.id)
      .filter(e =>
        detailFilter === 'all'
          ? true
          : detailFilter === 'unconfirmed'
          ? !e.isConfirmed
          : e.isConfirmed
      );
    const filterLabel = detailFilter === 'all' ? '전체' : detailFilter === 'unconfirmed' ? '미확정' : '확정';

    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* 네비바 */}
        <View style={[dv.navBar, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity onPress={() => navigate('main', 'backward')} style={{ padding: 8 }}><Ic.Back /></TouchableOpacity>
          <TouchableOpacity style={{ padding: 8 }}><Ic.More /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          {/* 이모지 + 금액 */}
          <View style={dv.hero}>
            <View style={[dv.heroEmoji, { backgroundColor: theme.bg }]}>
              <Text style={{ fontSize: 30 }}>{theme.emoji}</Text>
            </View>
            <View style={dv.heroTitleRow}>
              <Text style={dv.heroTitle}>{ev.title} 부조금</Text><Ic.ChevR />
            </View>
            <Text style={dv.heroAmt}>{fmt(stats.total)}<Text style={dv.heroAmtUnit}>원</Text></Text>
            <View style={dv.heroBtns}>
              <TouchableOpacity style={dv.btnSec} onPress={() => toast.show('수기 추가 팝업')} activeOpacity={0.88}>
                <Text style={dv.btnSecText}>수기 추가</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dv.btnPri} onPress={() => startKiosk(ev.id)} activeOpacity={0.88}>
                <Text style={dv.btnPriText}>하객 접수</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={dv.divider} />

          {/* 필터 & 목록 */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
            <View style={dv.filterRow}>
              <TouchableOpacity style={dv.filterBtn} onPress={() => setFilterOpen(!filterOpen)} activeOpacity={0.85}>
                <Text style={dv.filterLabel}>{filterLabel}</Text><Ic.ChevD />
              </TouchableOpacity>
              <Ic.Search />
            </View>

            {filterOpen && (
              <View style={dv.filterMenu}>
                {[{ id: 'all', l: '전체' }, { id: 'unconfirmed', l: '미확정' }, { id: 'confirmed', l: '확정' }].map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={dv.filterMenuItem}
                    onPress={() => { setDetailFilter(f.id); setFilterOpen(false); }}
                    activeOpacity={0.85}
                  >
                    <Text style={[dv.filterMenuText, detailFilter === f.id && { color: '#3182F6' }]}>{f.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={dv.dateLabel}>{ev.date}</Text>

            {filtered.length === 0 ? (
              <View style={dv.empty}><Text style={dv.emptyText}>조회된 내역이 없습니다.</Text></View>
            ) : (
              filtered.map(entry => (
                <View key={entry.id}>
                  <TouchableOpacity
                    style={dv.entryRow}
                    onPress={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)}
                    activeOpacity={0.85}
                  >
                    <View style={dv.avatar}><Text style={dv.avatarText}>{entry.name[0]}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={dv.entryName}>{entry.name}</Text>
                      <Text style={dv.entrySub}>{entry.time} · {entry.relation}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={dv.entryAmt}>+{fmt(entry.amount)}원</Text>
                      <Text style={dv.entryStatus}>{entry.isConfirmed ? '확정완료' : '미확정'}</Text>
                    </View>
                  </TouchableOpacity>

                  {openMenuId === entry.id && (
                    <View style={dv.entryMenu}>
                      {!entry.isConfirmed && (
                        <TouchableOpacity
                          style={dv.menuBtnBlue}
                          onPress={() => {
                            setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isConfirmed: true } : e));
                            setOpenMenuId(null);
                            toast.show('확정 완료되었습니다.');
                          }}
                          activeOpacity={0.88}
                        >
                          <Text style={dv.menuBtnBlueText}>확정</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={dv.menuBtnGray}
                        onPress={() => { toast.show('수정 팝업'); setOpenMenuId(null); }}
                        activeOpacity={0.88}
                      >
                        <Text style={dv.menuBtnGrayText}>수정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={dv.menuBtnRed}
                        onPress={() => {
                          setEntries(prev => prev.filter(e => e.id !== entry.id));
                          setOpenMenuId(null);
                          toast.show('내역이 삭제되었습니다.');
                        }}
                        activeOpacity={0.88}
                      >
                        <Text style={dv.menuBtnRedText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ── 3. 키오스크 – 신랑/신부 선택 ──
  const KioskSelectView = () => (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <TouchableOpacity style={[kv.xBtn, { top: insets.top + 16 }]} onPress={exitKiosk}>
        <Ic.X />
      </TouchableOpacity>
      <View style={kv.center}>
        <Text style={kv.bigTitle}>{'방문해주셔서\n감사합니다'}</Text>
        <Text style={kv.bigSub}>어느 분의 하객으로 오셨나요?</Text>
        {[
          { side: 'groom', emoji: '🤵‍♂️', label: '신랑측 하객', bg: '#E8F3FF' },
          { side: 'bride', emoji: '👰‍♀️', label: '신부측 하객', bg: '#FFF0F1' },
        ].map(opt => (
          <TouchableOpacity
            key={opt.side}
            style={kv.sideCard}
            onPress={() => { setKioskData(p => ({ ...p, side: opt.side })); navigate('kiosk-draw'); }}
            activeOpacity={0.95}
          >
            <View style={[kv.sideEmoji, { backgroundColor: opt.bg }]}>
              <Text style={{ fontSize: 26 }}>{opt.emoji}</Text>
            </View>
            <Text style={kv.sideLabel}>{opt.label}</Text>
            <Ic.ChevR />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── 4. 키오스크 – 서명 ──
  const KioskDrawView = () => {
    const ev = events.find(e => e.id === selEventId);
    const goBack = () => navigate(ev?.type === 'wedding' ? 'kiosk-select' : 'detail', 'backward');
    const handleNext = () => {
      if (!hasStroke) { toast.show('성함을 먼저 적어주세요.'); return; }
      navigate('kiosk-recognizing');
      setTimeout(() => {
        setKioskData(p => ({ ...p, recognizedName: '홍길동' }));
        navigate('kiosk-details');
      }, 1500);
    };
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
        <View style={kv.drawNav}>
          <TouchableOpacity onPress={goBack} style={{ padding: 8 }}><Ic.Back /></TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={kv.drawTitle}>{'화면에 펜으로\n성함을 써주세요.'}</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
          <SignatureCanvas onDraw={(v) => setHasStroke(v)} />
          <TouchableOpacity style={kv.nextBtn} onPress={handleNext} activeOpacity={0.88}>
            <Text style={kv.nextBtnText}>입력 완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── 5. 키오스크 – 인식 중 ──
  const KioskRecognizingView = () => (
    <View style={kv.recognizingWrap}>
      <ActivityIndicator size="large" color="#fff" style={{ marginBottom: 24 }} />
      <Text style={kv.recognizingText}>이름을 스캔하고 있습니다</Text>
    </View>
  );

  // ── 6. 키오스크 – 상세 입력 ──
  const KioskDetailsView = () => (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
        <Text style={kv.drawTitle}>{'내용이 맞는지\n확인해주세요'}</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, gap: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 이름 */}
        <View>
          <Text style={kd.fieldLabel}>인식된 성명</Text>
          <TextInput
            style={kd.nameInput}
            value={kioskData.recognizedName}
            onChangeText={v => setKioskData(p => ({ ...p, recognizedName: v }))}
          />
        </View>

        {/* 금액 */}
        <View>
          <Text style={kd.fieldLabel}>부조금 금액</Text>
          <Text style={kd.amtDisplay}>
            {kioskData.amount > 0 ? fmt(kioskData.amount) : '0'}
            <Text style={{ fontSize: 22, fontWeight: '700' }}>원</Text>
          </Text>
          <View style={kd.amtBtns}>
            {[50000, 100000, 150000].map(a => (
              <TouchableOpacity
                key={a}
                style={kd.amtBtn}
                onPress={() => setKioskData(p => ({ ...p, amount: p.amount + a }))}
                activeOpacity={0.85}
              >
                <Text style={kd.amtBtnText}>+{a / 10000}만</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={kd.amtBtnGray}
              onPress={() => setKioskData(p => ({ ...p, amount: 0 }))}
              activeOpacity={0.85}
            >
              <Text style={kd.amtBtnGrayText}>정정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 관계 */}
        <View>
          <Text style={kd.fieldLabel}>어떤 분으로 오셨나요?</Text>
          <View style={kd.relGrid}>
            {['가족/친척', '친구', '직장동료', '지인'].map(rel => (
              <TouchableOpacity
                key={rel}
                style={[kd.relBtn, kioskData.relation === rel && kd.relBtnActive]}
                onPress={() => setKioskData(p => ({ ...p, relation: rel }))}
                activeOpacity={0.85}
              >
                <Text style={[kd.relBtnText, kioskData.relation === rel && { color: '#fff' }]}>{rel}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[kd.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={kd.submitBtn} onPress={submitGuestbook} activeOpacity={0.88}>
          <Text style={kd.submitBtnText}>기록 완료하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── 7. 키오스크 – 감사 ──
  const KioskThanksView = () => (
    <View style={kv.thanksWrap}>
      <View style={kv.thanksCircle}><Ic.Check /></View>
      <Text style={kv.thanksTitle}>{'접수가\n완료되었습니다'}</Text>
      <Text style={kv.thanksSub}>소중한 발걸음에 진심으로 감사드립니다.</Text>
    </View>
  );

  // ── 라우터 ──
  const ViewMap = {
    'main':              MainView,
    'detail':            DetailView,
    'kiosk-select':      KioskSelectView,
    'kiosk-draw':        KioskDrawView,
    'kiosk-recognizing': KioskRecognizingView,
    'kiosk-details':     KioskDetailsView,
    'kiosk-thanks':      KioskThanksView,
  };
  const CurrentView = ViewMap[view];

  return (
    <View style={s.root}>
      <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: slideAnim }] }]}>
        <CurrentView />
      </Animated.View>

      {/* 토스트 */}
      <Animated.View style={[s.toast, toast.style, { top: insets.top + 12 }]}>
        <Text style={s.toastText}>{toast.msg}</Text>
      </Animated.View>
    </View>
  );
}

// ======================================================================
// 스타일
// ======================================================================

const mv = StyleSheet.create({
  header:           { paddingHorizontal: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  tabActive:        { fontSize: 26, fontWeight: '800', color: '#191F28', letterSpacing: -0.5 },
  tabInactive:      { fontSize: 22, fontWeight: '700', color: '#8B95A1', letterSpacing: -0.5 },
  totalCard:        { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  totalRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalLabel:       { fontSize: 15, fontWeight: '500', color: '#4E5968' },
  totalAmt:         { fontSize: 28, fontWeight: '700', color: '#191F28', letterSpacing: -0.5 },
  totalUnit:        { fontSize: 20, fontWeight: '600' },
  card:             { backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardHeaderLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji:            { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:        { fontSize: 16, fontWeight: '600', color: '#4E5968' },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3182F6' },
  cardAmt:          { fontSize: 32, fontWeight: '700', color: '#191F28', letterSpacing: -0.5, marginBottom: 20 },
  cardAmtUnit:      { fontSize: 22, fontWeight: '600' },
  cardBtns:         { flexDirection: 'row', gap: 10 },
  btnSecondary:     { flex: 1, backgroundColor: '#F0F5FF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#3182F6' },
  btnPrimary:       { flex: 1, backgroundColor: '#3182F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnPrimaryText:   { fontSize: 15, fontWeight: '600', color: '#fff' },
  unconfirmedRow:   { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F2F4F6',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unconfirmedLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  zapCircle:        { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F2F4F6', alignItems: 'center', justifyContent: 'center' },
  unconfirmedSub:   { fontSize: 12, fontWeight: '500', color: '#8B95A1', marginBottom: 2 },
  unconfirmedMain:  { fontSize: 14, fontWeight: '700', color: '#191F28' },
  cta:              { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: 'rgba(242,244,246,0.9)' },
  ctaBtn:           { backgroundColor: '#3182F6', borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3182F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  ctaBtnText:       { fontSize: 16, fontWeight: '600', color: '#fff' },
});

const dv = StyleSheet.create({
  navBar:         { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 4 },
  hero:           { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, alignItems: 'center' },
  heroEmoji:      { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  heroTitle:      { fontSize: 15, fontWeight: '600', color: '#4E5968' },
  heroAmt:        { fontSize: 38, fontWeight: '700', color: '#191F28', letterSpacing: -0.5, marginBottom: 24 },
  heroAmtUnit:    { fontSize: 26, fontWeight: '600' },
  heroBtns:       { flexDirection: 'row', gap: 10, width: '100%' },
  btnSec:         { flex: 1, backgroundColor: '#F0F5FF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnSecText:     { fontSize: 15, fontWeight: '600', color: '#3182F6' },
  btnPri:         { flex: 1, backgroundColor: '#3182F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnPriText:     { fontSize: 15, fontWeight: '600', color: '#fff' },
  divider:        { height: 10, backgroundColor: '#F2F4F6' },
  filterRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterLabel:    { fontSize: 16, fontWeight: '700', color: '#4E5968' },
  filterMenu:     { position: 'absolute', top: 40, left: 0, backgroundColor: '#fff', borderRadius: 12, zIndex: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
    borderWidth: 1, borderColor: '#F2F4F6', overflow: 'hidden', width: 120 },
  filterMenuItem: { paddingHorizontal: 16, paddingVertical: 12 },
  filterMenuText: { fontSize: 15, fontWeight: '600', color: '#4E5968' },
  dateLabel:      { fontSize: 13, fontWeight: '600', color: '#8B95A1', marginBottom: 8 },
  empty:          { paddingVertical: 48, alignItems: 'center' },
  emptyText:      { fontSize: 15, fontWeight: '500', color: '#8B95A1' },
  entryRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  avatar:         { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F2F4F6', alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 15, fontWeight: '700', color: '#8B95A1' },
  entryName:      { fontSize: 16, fontWeight: '600', color: '#191F28', marginBottom: 2 },
  entrySub:       { fontSize: 13, color: '#8B95A1' },
  entryAmt:       { fontSize: 16, fontWeight: '600', color: '#3182F6', textAlign: 'right', marginBottom: 2 },
  entryStatus:    { fontSize: 13, fontWeight: '500', color: '#8B95A1', textAlign: 'right' },
  entryMenu:      { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, backgroundColor: '#F9FAFB',
    padding: 8, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F2F4F6' },
  menuBtnBlue:    { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8F3FF', borderRadius: 8 },
  menuBtnBlueText:{ fontSize: 13, fontWeight: '700', color: '#3182F6' },
  menuBtnGray:    { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: '#E5E8EB' },
  menuBtnGrayText:{ fontSize: 13, fontWeight: '700', color: '#4E5968' },
  menuBtnRed:     { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF0F1', borderRadius: 8 },
  menuBtnRedText: { fontSize: 13, fontWeight: '700', color: '#F04452' },
});

const kv = StyleSheet.create({
  xBtn:             { position: 'absolute', right: 16, zIndex: 50, padding: 16 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  bigTitle:         { fontSize: 36, fontWeight: '900', color: '#191F28', letterSpacing: -0.5, textAlign: 'center', marginBottom: 14, lineHeight: 44 },
  bigSub:           { fontSize: 18, fontWeight: '700', color: '#8B95A1', marginBottom: 40 },
  sideCard:         { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24,
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  sideEmoji:        { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  sideLabel:        { flex: 1, fontSize: 22, fontWeight: '700', color: '#191F28' },
  drawNav:          { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  drawTitle:        { fontSize: 28, fontWeight: '900', color: '#191F28', letterSpacing: -0.5, lineHeight: 36 },
  nextBtn:          { backgroundColor: '#191F28', paddingVertical: 20, borderRadius: 20, alignItems: 'center', marginTop: 16,
    shadowColor: '#191F28', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 },
  nextBtnText:      { fontSize: 20, fontWeight: '700', color: '#fff' },
  recognizingWrap:  { flex: 1, backgroundColor: '#191F28', alignItems: 'center', justifyContent: 'center' },
  recognizingText:  { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  thanksWrap:       { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  thanksCircle:     { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  thanksTitle:      { fontSize: 32, fontWeight: '900', color: '#191F28', textAlign: 'center', lineHeight: 40, marginBottom: 14 },
  thanksSub:        { fontSize: 17, fontWeight: '700', color: '#8B95A1', textAlign: 'center' },
});

const kd = StyleSheet.create({
  fieldLabel:    { fontSize: 15, fontWeight: '700', color: '#8B95A1', marginBottom: 8 },
  nameInput:     { fontSize: 28, fontWeight: '900', color: '#191F28', borderBottomWidth: 3, borderBottomColor: '#191F28', paddingBottom: 6 },
  amtDisplay:    { fontSize: 36, fontWeight: '900', color: '#191F28', letterSpacing: -0.5, marginBottom: 14 },
  amtBtns:       { flexDirection: 'row', gap: 8 },
  amtBtn:        { flex: 1, backgroundColor: '#F2F4F6', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  amtBtnText:    { fontSize: 15, fontWeight: '700', color: '#4E5968' },
  amtBtnGray:    { flex: 1, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E8EB' },
  amtBtnGrayText:{ fontSize: 15, fontWeight: '700', color: '#8B95A1' },
  relGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  relBtn:        { flex: 1, minWidth: '40%', paddingVertical: 18, borderRadius: 16, backgroundColor: '#F2F4F6', alignItems: 'center' },
  relBtnActive:  { backgroundColor: '#191F28' },
  relBtnText:    { fontSize: 16, fontWeight: '700', color: '#4E5968' },
  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)' },
  submitBtn:     { backgroundColor: '#3182F6', paddingVertical: 20, borderRadius: 20, alignItems: 'center',
    shadowColor: '#3182F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  submitBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },
});

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#fff' },
  toast:     { position: 'absolute', alignSelf: 'center', backgroundColor: '#333D4B', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, zIndex: 200 },
  toastText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
