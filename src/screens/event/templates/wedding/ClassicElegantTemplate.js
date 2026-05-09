import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Animated, StyleSheet, Dimensions, Modal, Linking, TextInput, KeyboardAvoidingView, Platform, Easing,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getCategorizedImagesSafe,
  useCountdown,
  formatKoreanDate,
  formatKoreanTime,
} from './WeddingUtils';

const { width, height } = Dimensions.get('window');

// ── 컬러 팔레트 ──
const C = {
  main: '#222222',
  sub: '#777777',
  accent: '#9A8B7A',
  border: '#EAEAEA',
  surface: '#FAFAFA',
  bg: '#fff',
};

// ── 꽃잎 이미지 미리 로드 ──
const FLOWER_IMGS = [
  require('../../../../../assets/icons/1.png'),
  require('../../../../../assets/icons/2.png'),
  require('../../../../../assets/icons/3.png'),
  require('../../../../../assets/icons/4.png'),
  require('../../../../../assets/icons/5.png'),
  require('../../../../../assets/icons/6.png'),
  require('../../../../../assets/icons/7.png'),
  require('../../../../../assets/icons/8.png'),
  require('../../../../../assets/icons/9.png'),
  require('../../../../../assets/icons/10.png'),
  require('../../../../../assets/icons/11.png'),
  require('../../../../../assets/icons/12.png'),
];

function FallingFlowers() {
  const flowers = useRef([...Array(35)].map((_, i) => ({
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: 300 + i * 120,
    size: Math.random() * 12 + 8,
    imgIdx: i % 12,
    duration: 4000 + Math.random() * 2000,
  }))).current;

  useEffect(() => {
    flowers.forEach((f) => {
      const run = () => {
        f.anim.setValue(0);
        Animated.timing(f.anim, { toValue: 1, duration: f.duration, useNativeDriver: true, easing: Easing.linear }).start(() => setTimeout(run, 100));
      };
      setTimeout(run, f.delay);
    });
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
      {flowers.map((f, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: f.x,
          opacity: f.anim.interpolate({ inputRange: [0, 0.02, 0.95, 1], outputRange: [0, 0.6, 0.6, 0] }),
          transform: [
            { translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [-80, height + 50] }) },
            { translateX: f.anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 12, -8, 5] }) },
            { rotate: f.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '100deg'] }) },
          ],
        }}>
          <Image source={FLOWER_IMGS[f.imgIdx]} style={{ width: f.size, height: f.size }} resizeMode="contain" fadeDuration={0} />
        </Animated.View>
      ))}
    </View>
  );
}

// ======================================================================
export default function ClassicElegantTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings }) {
  const insets = useSafeAreaInsets();
  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // ── 인트로 상태 ──
  // 자체 인트로 제거 — mainOpacity를 1로 초기화해 메인 콘텐츠 즉시 노출
  const [showIntro, setShowIntro] = useState(false);
  const introOpacity = useRef(new Animated.Value(0)).current;
  const mainOpacity = useRef(new Animated.Value(1)).current;
  const doorLeftRotate = useRef(new Animated.Value(1)).current;
  const doorRightRotate = useRef(new Animated.Value(1)).current;

  // ── 기타 상태 ──
  const [activeAccount, setActiveAccount] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [guestBookOpen, setGuestBookOpen] = useState(false);
  const [gbName, setGbName] = useState('');
  const [gbPassword, setGbPassword] = useState('');
  const [gbMessage, setGbMessage] = useState('');
  const [guestMessages, setGuestMessages] = useState([
    { name: '김영희', message: '결혼 진심으로 축하드려요! 행복하세요.', time: '방금 전' },
    { name: '박철수', message: '두 분 정말 잘 어울려요. 축하합니다!', time: '1시간 전' },
  ]);

  // ── 이름 ──
  const groomName = eventData.groomName || eventData.groom_name || '';
  const brideName = eventData.brideName || eventData.bride_name || '';

  // ── 부모님 ──
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '';

  // ── 날짜/시간 ──
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const dateStr = dateInfo?.full || '';
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);
  const displayTimeStr = timeStr.replace('시 ', '시 ');

  // ── 장소 ──
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';

  // ── 카운트다운 ──
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date,
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // ── D-day ──
  const weddingDate = eventData.date || eventData.event_date;
  let dDayText = '';
  if (weddingDate) {
    const baseDate = dateInfo
      ? new Date(dateInfo.year, dateInfo.month - 1, dateInfo.day)
      : new Date(weddingDate);
    const diff = Math.ceil((baseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff > 0) dDayText = `D-${diff}`;
    else if (diff === 0) dDayText = 'D-Day';
    else dDayText = `D+${Math.abs(diff)}`;
  }

  // ── 달력 ──
  const calDays = ['일', '월', '화', '수', '목', '금', '토'];
  let calYear = 2026, calMonth = 5, calDay = 14;
  if (weddingDate) {
    calYear = dateInfo.year;
    calMonth = dateInfo.month;
    calDay = dateInfo.day;
  }
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();

  // ── 계좌 & 연락처 (통합) ──
  const ai = eventData.additional_info || {};
  const groomContact = eventData.groomContact || eventData.groom_contact || '';
  const brideContact = eventData.brideContact || eventData.bride_contact || '';
  const groomFatherContact = eventData.groomFatherContact || ai.groom_father_contact || '';
  const groomMotherContact = eventData.groomMotherContact || ai.groom_mother_contact || '';
  const brideFatherContact = eventData.brideFatherContact || ai.bride_father_contact || '';
  const brideMotherContact = eventData.brideMotherContact || ai.bride_mother_contact || '';

  const buildPerson = (name, role, bank, number, contact) => {
    if (!number && !contact) return null;
    return { name: name || role, role, bank: bank || '', number: number || '', contact: contact || '' };
  };
  const accounts = {
    groom: [
      buildPerson(groomName || '신랑', '신랑', ai.groom_bank_name, ai.groom_account_number, groomContact),
      buildPerson(groomFather ? `${groomFather} 아버님` : '아버님', '아버님', ai.groom_father_bank_name, ai.groom_father_account_number, groomFatherContact),
      buildPerson(groomMother ? `${groomMother} 어머님` : '어머님', '어머님', ai.groom_mother_bank_name, ai.groom_mother_account_number, groomMotherContact),
    ].filter(Boolean),
    bride: [
      buildPerson(brideName || '신부', '신부', ai.bride_bank_name, ai.bride_account_number, brideContact),
      buildPerson(brideFather ? `${brideFather} 아버님` : '아버님', '아버님', ai.bride_father_bank_name, ai.bride_father_account_number, brideFatherContact),
      buildPerson(brideMother ? `${brideMother} 어머님` : '어머님', '어머님', ai.bride_mother_bank_name, ai.bride_mother_account_number, brideMotherContact),
    ].filter(Boolean),
  };
  const hasAnyAccount = accounts.groom.length > 0 || accounts.bride.length > 0;

  // 전화번호 포맷
  const formatPhone = (phone) => {
    const d = (phone || '').replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
    return phone || '';
  };

  // ── 갤러리 ──
  const galleryImages = safeImages.gallery || safeImages.all || [];

  // ── 히어로 메인 이미지 크로스페이드 슬라이드쇼 ──
  const mainImages = safeImages.main?.length > 0 ? safeImages.main : (safeImages.all?.length > 0 ? [safeImages.all[0]] : []);
  const heroAnims = useRef(mainImages.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const heroIdxRef = useRef(0);

  useEffect(() => {
    if (mainImages.length <= 1) return;
    const interval = setInterval(() => {
      const curr = heroIdxRef.current;
      const next = (curr + 1) % mainImages.length;
      Animated.parallel([
        Animated.timing(heroAnims[curr], { toValue: 0, duration: 1200, useNativeDriver: true }),
        Animated.timing(heroAnims[next], { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]).start();
      heroIdxRef.current = next;
    }, 5000);
    return () => clearInterval(interval);
  }, [mainImages.length]);

  // ── 인트로 애니메이션 ──
  const dismissIntro = () => {
    Animated.parallel([
      Animated.timing(doorLeftRotate, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(doorRightRotate, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(introOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      Animated.timing(mainOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start(() => setShowIntro(false));
  };

  // ── 토스트 ──
  const toastAnim = useRef(new Animated.Value(0)).current;
  const showToast = (message) => {
    setToast({ visible: true, message });
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, message: '' }));
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast('계좌번호가 복사되었습니다');
    } catch { showToast('복사에 실패했습니다'); }
  };

  // ── 아코디언 ──
  const groomAnim = useRef(new Animated.Value(0)).current;
  const brideAnim = useRef(new Animated.Value(0)).current;
  const chevronGroomAnim = useRef(new Animated.Value(0)).current;
  const chevronBrideAnim = useRef(new Animated.Value(0)).current;

  const toggleAccount = (side) => {
    const isOpen = activeAccount === side;
    const anim = side === 'groom' ? groomAnim : brideAnim;
    const other = side === 'groom' ? brideAnim : groomAnim;
    const chevAnim = side === 'groom' ? chevronGroomAnim : chevronBrideAnim;
    const chevOther = side === 'groom' ? chevronBrideAnim : chevronGroomAnim;
    Animated.timing(other, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    Animated.timing(chevOther, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    Animated.timing(anim, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    Animated.timing(chevAnim, { toValue: isOpen ? 0 : 1, duration: 260, useNativeDriver: false }).start();
    setActiveAccount(isOpen ? null : side);
  };

  const accordionHeight = (anim, count) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(count * 80 + 16, 96)] });

  // ── 카카오 좌표 검색 ──
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);

  useEffect(() => {
    const query = locAddr || locName;
    if (!query) return;
    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    })
      .then(r => r.json())
      .then(data => {
        const doc = data.documents?.[0];
        if (doc) {
          setMapCoord({ lat: doc.y, lng: doc.x });
        } else if (locAddr) {
          return fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(locAddr)}`, {
            headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
          }).then(r => r.json()).then(d2 => {
            const doc2 = d2.documents?.[0];
            if (doc2) setMapCoord({ lat: doc2.y, lng: doc2.x });
          });
        }
      })
      .catch(() => {});
  }, [locAddr, locName]);

  // ── 교통편 ──
  const transportInfo = eventData.additional_info?.transport || eventData.transport || null;

  // ── 방명록 제출 ──
  const handleGuestBookSubmit = () => {
    if (!gbName.trim() || !gbMessage.trim()) {
      showToast('이름과 메시지를 입력해주세요');
      return;
    }
    setGuestMessages(prev => [{ name: gbName.trim(), message: gbMessage.trim(), time: '방금 전' }, ...prev]);
    setGbName('');
    setGbPassword('');
    setGbMessage('');
    setGuestBookOpen(false);
    showToast('메시지가 등록되었습니다');
  };

  // ═══════════════════════════════════════════════════════════════════
  // 메인
  // ═══════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <Animated.View style={[s.root, { opacity: mainOpacity, paddingBottom: insets.bottom }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

        {/* ── 히어로 ── */}
        <View style={[s.hero, { marginTop: insets.top }]}>
          <View style={s.heroInner}>
            {/* 크로스페이드 슬라이드쇼 */}
            {mainImages.map((img, i) => (
              <Animated.Image
                key={i}
                source={typeof img === 'string' ? { uri: img } : img}
                style={[s.heroImage, i > 0 && StyleSheet.absoluteFill, { opacity: heroAnims[i] }]}
                resizeMode="cover"
              />
            ))}
            {/* 하단 60% 흰색 딤 */}
            {/* 더블 프레임 (사진 안쪽 border) */}
            <View style={s.heroInnerFrame} />
          </View>
        </View>
        {/* 이름 - 사진 아래 */}
        <View style={s.heroTextSection}>
          <Text style={s.heroNamesText}>
            {groomName}  <Text style={s.heroHeart}>♥</Text>  {brideName}
          </Text>
        </View>

        {/* ── 인사말 ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Invitation</Text>
          <View style={s.divider} />
          <Text style={s.greetingText}>
            {eventData.customMessage || eventData.custom_message ||
              '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n\n저희 두 사람이 사랑의 이름으로\n지켜나갈 수 있게 앞날을\n축복해 주시면 감사하겠습니다.'}
          </Text>
          {(groomFather || groomMother || brideFather || brideMother) && (
            <View style={s.parentsWrap}>
              {(groomFather || groomMother) && (
                <Text style={s.parentsText}>
                  {groomFather}{groomFather && groomMother ? ' · ' : ''}{groomMother}
                  <Text style={s.parentsRole}> 의 아들 </Text>
                  <Text style={s.parentsChild}>{groomName}</Text>
                </Text>
              )}
              {(brideFather || brideMother) && (
                <Text style={[s.parentsText, { marginTop: 8 }]}>
                  {brideFather}{brideFather && brideMother ? ' · ' : ''}{brideMother}
                  <Text style={s.parentsRole}> 의 딸 </Text>
                  <Text style={s.parentsChild}>{brideName}</Text>
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── 달력 ── */}
        {weddingDate && (
          <View style={[s.section, s.dateSection]}>
            <Text style={s.sectionLabel}>Date</Text>
            <View style={s.divider} />
            <View style={s.dateSummaryWrap}>
              <View style={s.dateMainRow}>
                <Text style={s.dateMainText}>{calYear}</Text>
                <Text style={s.dateSlash}>/</Text>
                <Text style={s.dateMainText}>{String(calMonth).padStart(2, '0')}</Text>
              </View>
              <View style={s.dateTimeBox}>
                <Text style={s.dateTimeLabel}>TIME</Text>
                <Text style={s.dateTimeText}>{displayTimeStr}</Text>
              </View>
            </View>

            <View style={s.calendarWrap}>
              <View style={s.calDayHeaderRow}>
                {calDays.map((d, i) => (
                  <View key={i} style={s.calDayHeaderCell}>
                    <Text style={[s.calDayHeaderText, i === 0 && s.calSundayText]}>{d}</Text>
                  </View>
                ))}
              </View>
              <View style={s.calDayHeaderDivider} />
              <View style={s.calGrid}>
                {Array.from({ length: firstDow }).map((_, i) => (
                  <View key={`empty-${i}`} style={s.calCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dow = (firstDow + i) % 7;
                  const isSunday = dow === 0;
                  const isWedding = day === calDay;

                  return (
                    <View key={day} style={s.calCell}>
                      {isWedding ? (
                        <View style={s.calHeartWrap}>
                          <Text style={s.calHeartText}>♥</Text>
                          <Text style={s.calHeartDay}>{day}</Text>
                        </View>
                      ) : (
                        <Text style={[s.calDayText, isSunday && s.calSundayText]}>{day}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
              {dDayText ? (
                <View style={s.calFooter}>
                  <Text style={s.calFooterText}>
                    {groomName} ♥ {brideName}의 결혼식이 <Text style={s.dateDdayStrong}>{dDayText}</Text> 남았습니다
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ── 갤러리 (2행 × N열 가로 스크롤, 4장씩 보임) ── */}
        {galleryImages.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Gallery</Text>
            <View style={s.divider} />
            <View style={s.galleryOuter}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.galleryScrollContent}
              >
                {Array.from({ length: Math.ceil(galleryImages.length / 2) }).map((_, colIdx) => {
                  const top = galleryImages[colIdx * 2];
                  const bottom = galleryImages[colIdx * 2 + 1];
                  const renderCard = (img, key) => {
                    if (!img) return <View key={key} style={{ width: 160, height: 200 }} />;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setSelectedImage(img)}
                        activeOpacity={0.9}
                        style={s.galleryCardNew}
                      >
                        <Image
                          source={typeof img === 'string' ? { uri: img } : img}
                          style={s.galleryImageNew}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                  };
                  return (
                    <View key={colIdx} style={s.galleryColumn}>
                      {renderCard(top, `t${colIdx}`)}
                      <View style={{ height: 12 }} />
                      {renderCard(bottom, `b${colIdx}`)}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
            {galleryImages.length > 4 && (
              <View style={s.galleryHint}>
                <Text style={s.galleryHintText}>
                  옆으로 밀면 사진 {galleryImages.length - 4}장이 더 있어요
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── 오시는 길 ── */}
        {locName && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Location</Text>
            <View style={s.divider} />
            <Text style={s.locationName}>{locName}</Text>
            {locAddr ? <Text style={s.locationAddr}>{locAddr}</Text> : null}

            {mapCoord ? (
              <View style={s.mapContainer}>
                <WebView
                  source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              </View>
            ) : (locAddr || locName) ? (
              <View style={s.mapPlaceholder}>
                <Text style={{ fontSize: 14, color: C.sub }}>지도를 불러오는 중...</Text>
              </View>
            ) : null}

            {/* 내비 버튼 */}
            <View style={s.navBtns}>
              <TouchableOpacity style={s.navBtn} activeOpacity={0.8} onPress={() => {
                if (mapCoord) Linking.openURL(`nmap://place?lat=${mapCoord.lat}&lng=${mapCoord.lng}&name=${encodeURIComponent(locName)}&appname=wedding`);
                else showToast('좌표 정보가 없습니다');
              }}>
                <Text style={s.navBtnText}>🧭 네이버지도</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.navBtn} activeOpacity={0.8} onPress={() => {
                if (mapCoord) Linking.openURL(`kakaomap://look?p=${mapCoord.lat},${mapCoord.lng}`);
                else showToast('좌표 정보가 없습니다');
              }}>
                <Text style={s.navBtnText}>🧭 카카오내비</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.navBtn} activeOpacity={0.8} onPress={() => {
                if (mapCoord) Linking.openURL(`tmap://route?goalx=${mapCoord.lng}&goaly=${mapCoord.lat}&goalname=${encodeURIComponent(locName)}`);
                else showToast('좌표 정보가 없습니다');
              }}>
                <Text style={s.navBtnText}>🧭 티맵</Text>
              </TouchableOpacity>
            </View>

            {/* 교통편 */}
            {transportInfo && (
              <View style={s.transportWrap}>
                {transportInfo.subway && (
                  <View style={s.transportItem}>
                    <View style={s.transportDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.transportTitle}>지하철</Text>
                      <Text style={s.transportDesc}>{transportInfo.subway}</Text>
                    </View>
                  </View>
                )}
                {transportInfo.bus && (
                  <View style={s.transportItem}>
                    <View style={s.transportDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.transportTitle}>버스</Text>
                      <Text style={s.transportDesc}>{transportInfo.bus}</Text>
                    </View>
                  </View>
                )}
                {transportInfo.parking && (
                  <View style={s.transportItem}>
                    <View style={s.transportDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.transportTitle}>주차</Text>
                      <Text style={s.transportDesc}>{transportInfo.parking}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── 계좌 + 연락처 (방명록보다 먼저 노출) ── */}
        {hasAnyAccount && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Mind</Text>
            <View style={s.divider} />
            <Text style={s.accountDesc}>
              계좌번호는 터치하면 복사되고,{'\n'}연락처는 터치하면 전화가 연결됩니다.
            </Text>
            {['groom', 'bride'].map(side => {
              const list = accounts[side];
              if (list.length === 0) return null;
              const anim = side === 'groom' ? groomAnim : brideAnim;
              const chevAnim = side === 'groom' ? chevronGroomAnim : chevronBrideAnim;
              // 한 사람당 계좌+연락처 합쳐서 ~140px
              const h = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(list.length * 140 + 16, 140)] });
              const chevronRotate = chevAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
              return (
                <View key={side} style={s.accordionCard}>
                  <TouchableOpacity style={s.accordionHeader} onPress={() => toggleAccount(side)} activeOpacity={0.85}>
                    <Text style={s.accordionTitle}>{side === 'groom' ? '신랑측 계좌·연락처' : '신부측 계좌·연락처'}</Text>
                    <Animated.Text style={[s.accordionChevron, { transform: [{ rotate: chevronRotate }] }]}>▼</Animated.Text>
                  </TouchableOpacity>
                  <Animated.View style={[s.accordionBody, { height: h, overflow: 'hidden' }]}>
                    {list.map((p, idx) => (
                      <View key={idx} style={s.personCard}>
                        <Text style={s.personCardLabel}>{p.name}</Text>
                        {p.number ? (
                          <TouchableOpacity style={s.personRow} onPress={() => copyToClipboard(p.number)} activeOpacity={0.7}>
                            <Text style={s.personRowValue}>{p.bank} {p.number}</Text>
                            <View style={s.copyBtn}>
                              <Text style={s.copyBtnText}>복사</Text>
                            </View>
                          </TouchableOpacity>
                        ) : null}
                        {p.number && p.contact ? <View style={s.personDivider} /> : null}
                        {p.contact ? (
                          <TouchableOpacity
                            style={s.personRow}
                            onPress={() => Linking.openURL(`tel:${p.contact.replace(/\D/g, '')}`)}
                            activeOpacity={0.7}
                          >
                            <Text style={s.personRowValue}>📞 {formatPhone(p.contact)}</Text>
                            <View style={s.callBtn}>
                              <Text style={s.callBtnText}>전화</Text>
                            </View>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))}
                  </Animated.View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── 방명록 (계좌 아래) ── */}
        {allowMessages && (
          <View style={[s.section, { backgroundColor: C.surface }]}>
            <Text style={s.sectionLabel}>Guestbook</Text>
            <View style={s.divider} />
            {guestMessages.map((msg, idx) => (
              <View key={idx} style={s.gbCard}>
                <View style={s.gbCardHeader}>
                  <Text style={s.gbCardName}>{msg.name}</Text>
                  <Text style={s.gbCardTime}>{msg.time}</Text>
                </View>
                <Text style={s.gbCardMessage}>{msg.message}</Text>
              </View>
            ))}
            <TouchableOpacity style={s.gbWriteBtn} activeOpacity={0.8} onPress={() => setGuestBookOpen(true)}>
              <Text style={s.gbWriteBtnText}>✏️ 메시지 작성하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 푸터 ── */}
        <View style={s.footer}>
          <Text style={s.footerThankYou}>Thank You</Text>
          <Text style={s.footerNames}>{groomName} & {brideName}</Text>
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.footerBtn} activeOpacity={0.8} onPress={() => showToast('카카오톡 공유 준비 중입니다')}>
              <Text style={s.footerBtnText}>카카오톡 공유</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.footerBtn} activeOpacity={0.8} onPress={async () => {
              try {
                await Clipboard.setStringAsync(`${groomName} & ${brideName} 결혼식 초대장`);
                showToast('링크가 복사되었습니다');
              } catch { showToast('복사에 실패했습니다'); }
            }}>
              <Text style={s.footerBtnText}>링크 복사</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* ── 토스트 ── */}
      {toast.visible && (
        <Animated.View style={[s.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          top: insets.top + 16,
        }]}>
          <Text style={s.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ── 이미지 풀스크린 모달 ── */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={s.imageModal}>
          <TouchableOpacity style={[s.imageModalClose, { top: insets.top + 16 }]} onPress={() => setSelectedImage(null)}>
            <Text style={{ fontSize: 22, color: '#fff' }}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={typeof selectedImage === 'string' ? { uri: selectedImage } : selectedImage}
              style={s.imageModalImg}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* ── 방명록 바텀시트 ── */}
      <Modal visible={guestBookOpen} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.gbOverlay} activeOpacity={1} onPress={() => setGuestBookOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={s.gbSheet} onPress={() => {}}>
              <View style={s.gbSheetHandle} />
              <Text style={s.gbSheetTitle}>메시지 작성</Text>
              <TextInput
                style={s.gbInput}
                placeholder="이름"
                placeholderTextColor="#aaa"
                value={gbName}
                onChangeText={setGbName}
              />
              <TextInput
                style={s.gbInput}
                placeholder="비밀번호"
                placeholderTextColor="#aaa"
                secureTextEntry
                value={gbPassword}
                onChangeText={setGbPassword}
              />
              <TextInput
                style={[s.gbInput, s.gbInputMessage]}
                placeholder={messageSettings?.placeholder || '축하 메시지를 입력해주세요'}
                placeholderTextColor="#aaa"
                multiline
                textAlignVertical="top"
                value={gbMessage}
                onChangeText={setGbMessage}
              />
              <TouchableOpacity style={s.gbSubmitBtn} activeOpacity={0.85} onPress={handleGuestBookSubmit}>
                <Text style={s.gbSubmitText}>등록하기</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>

    {/* ── 인트로 (3D 문 열림 효과) ── */}
    {showIntro && (
      <Animated.View style={[s.introRoot, { paddingTop: insets.top, paddingBottom: insets.bottom, opacity: introOpacity }]}>
        {/* 왼쪽 문 (텍스트 포함) */}
        <Animated.View style={[s.doorLeft, {
          transform: [
            { perspective: 1200 },
            { translateX: -(width / 4) },
            { rotateY: doorLeftRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-85deg'] }) },
            { translateX: width / 4 },
          ],
        }]}>
          {/* 전체 너비 텍스트를 왼쪽 문 안에서 렌더링 (오른쪽 반은 clip) */}
          <View style={s.doorTextLayer}>
            <View style={s.introLine} />
            <Text style={s.introNames}>{groomName}  |  {brideName}</Text>
            <Text style={s.introLabel}>WEDDING INVITATION</Text>
            <TouchableOpacity style={s.introBtn} onPress={dismissIntro} activeOpacity={0.85}>
              <Text style={s.introBtnText}>초대장 열기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {/* 오른쪽 문 (텍스트 포함) */}
        <Animated.View style={[s.doorRight, {
          transform: [
            { perspective: 1200 },
            { translateX: width / 4 },
            { rotateY: doorRightRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '85deg'] }) },
            { translateX: -(width / 4) },
          ],
        }]}>
          {/* 전체 너비 텍스트를 오른쪽 문 안에서 렌더링 (왼쪽 반은 clip) */}
          <View style={[s.doorTextLayer, { left: -(width / 2) }]}>
            <View style={s.introLine} />
            <Text style={s.introNames}>{groomName}  |  {brideName}</Text>
            <Text style={s.introLabel}>WEDDING INVITATION</Text>
            <TouchableOpacity style={s.introBtn} onPress={dismissIntro} activeOpacity={0.85}>
              <Text style={s.introBtnText}>초대장 열기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    )}
    </View>
  );
}

// ======================================================================
const s = StyleSheet.create({
  // ── 인트로 ──
  introRoot: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100, overflow: 'hidden',
  },
  doorLeft: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%',
    backgroundColor: C.bg, borderRightWidth: 0.5, borderRightColor: C.border,
    overflow: 'hidden',
  },
  doorRight: {
    position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%',
    backgroundColor: C.bg, borderLeftWidth: 0.5, borderLeftColor: C.border,
    overflow: 'hidden',
  },
  doorTextLayer: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: width,
    justifyContent: 'center', alignItems: 'center',
  },
  introLine: {
    width: 1, height: 64, backgroundColor: C.border, marginBottom: 32,
  },
  introNames: {
    fontSize: 24, fontWeight: '500', color: C.main, letterSpacing: 4,
    textAlign: 'center', marginBottom: 0,
  },
  introLabel: {
    fontSize: 13, fontWeight: '400', color: C.sub, letterSpacing: 4,
    textTransform: 'uppercase', marginBottom: 56,
  },
  introBtn: {
    paddingHorizontal: 28, paddingVertical: 14, borderWidth: 1, borderColor: C.border,
  },
  introBtnText: {
    fontSize: 13, fontWeight: '400', color: C.sub, letterSpacing: 4,
  },

  // ── 루트 ──
  root: { flex: 1, backgroundColor: C.bg },

  // ── 히어로 ──
  hero: { padding: 16 },
  heroInner: {
    width: '100%', height: height * 0.65, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroDim: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  heroInnerFrame: {
    position: 'absolute', top: 8, left: 8, right: 8, bottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  heroTextSection: {
    alignItems: 'center', paddingTop: 20, paddingBottom: 22, backgroundColor: C.bg,
  },
  heroLabelBg: {
    backgroundColor: C.bg, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 16,
  },
  heroLabelText: {
    fontSize: 12, fontWeight: '400', color: C.sub, letterSpacing: 4,
  },
  heroNamesText: {
    fontSize: 24, fontWeight: '300', color: C.main, letterSpacing: 4, marginBottom: 8,
  },
  heroBar: { fontWeight: '200', color: C.sub },
  heroHeart: { fontWeight: '400', color: '#E8A0A0', fontSize: 20, letterSpacing: 0 },
  heroDateText: {
    fontSize: 13, fontWeight: '400', color: C.sub, letterSpacing: 1,
  },

  // ── 섹션 ──
  section: {
    backgroundColor: C.bg, paddingHorizontal: 24, paddingVertical: 34,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '400', color: C.accent, letterSpacing: 4,
    textAlign: 'center', textTransform: 'uppercase', marginBottom: 12,
    fontFamily: 'PlayfairDisplay',
  },
  divider: {
    width: 40, height: 1, backgroundColor: C.border, alignSelf: 'center', marginBottom: 24,
  },

  // ── 인사말 ──
  greetingText: {
    fontSize: 15, lineHeight: 28, color: C.sub, fontWeight: '300',
    textAlign: 'center', marginBottom: 32,
  },
  parentsWrap: { alignItems: 'center' },
  parentsText: {
    fontSize: 14, fontWeight: '400', color: C.main, textAlign: 'center', lineHeight: 22,
  },
  parentsRole: { color: C.sub, fontWeight: '300' },
  parentsChild: { fontWeight: '500', color: C.main },

  // ── 연락처 ──
  contactRow: { flexDirection: 'row', gap: 12 },
  contactBtn: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 2,
    paddingVertical: 14, alignItems: 'center',
  },
  contactBtnText: { fontSize: 14, fontWeight: '400', color: C.main },

  // ── 달력 ──
  dateSection: {
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  dateSummaryWrap: {
    alignItems: 'center',
    marginBottom: 26,
  },
  dateMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 18,
  },
  dateMainText: {
    fontSize: 30,
    fontWeight: '300',
    color: C.main,
    letterSpacing: 2,
    lineHeight: 38,
    fontFamily: 'PlayfairDisplay',
  },
  dateSlash: {
    fontSize: 30,
    fontWeight: '200',
    color: C.main,
    marginHorizontal: 10,
    lineHeight: 38,
    fontFamily: 'PlayfairDisplay',
  },
  dateTimeBox: {
    alignSelf: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(154, 139, 122, 0.28)',
    paddingVertical: 9,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#B8A894',
    letterSpacing: 2,
    marginRight: 12,
    textTransform: 'uppercase',
    fontFamily: 'PlayfairDisplay',
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6F6255',
    letterSpacing: 0,
    lineHeight: 18,
  },
  dateDdayText: {
    marginTop: 12,
    fontSize: 13,
    color: C.sub,
    fontWeight: '300',
    textAlign: 'center',
  },
  dateDdayStrong: {
    color: C.accent,
    fontWeight: '700',
  },
  calFullDate: {
    fontSize: 14, fontWeight: '300', color: C.sub, textAlign: 'center', marginBottom: 4,
  },
  calMonthYear: {
    fontSize: 28, fontWeight: '200', color: C.main, textAlign: 'center',
    letterSpacing: 2, marginBottom: 24,
  },
  calendarWrap: { alignSelf: 'center', width: '100%', paddingHorizontal: 4 },
  calDayHeaderRow: { flexDirection: 'row', marginBottom: 10 },
  calDayHeaderCell: { flex: 1, alignItems: 'center' },
  calDayHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
  },
  calSundayText: { color: '#EE9A9D' },
  calDayHeaderDivider: { height: 1, backgroundColor: C.border, marginBottom: 42 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCircle: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  calDayText: {
    fontSize: 18,
    fontWeight: '400',
    color: C.main,
    fontFamily: 'NanumMyeongjo',
  },
  // 결혼일 하트 표시
  calHeartWrap: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  calHeartText: {
    fontSize: 34, color: '#E8A0A0', position: 'absolute',
  },
  calHeartDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    zIndex: 2,
  },
  calFooter: {
    marginTop: 42, paddingTop: 22, borderTopWidth: 1, borderTopColor: C.border,
    alignItems: 'center',
  },
  calFooterText: {
    fontSize: 15,
    color: C.sub,
    fontWeight: '300',
    fontFamily: 'NanumMyeongjo',
  },

  // ── 갤러리 (2행 × N열 가로 스크롤) ──
  galleryOuter: { marginHorizontal: -24, marginTop: 4, position: 'relative' },
  galleryScrollContent: { paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row' },
  galleryColumn: { width: 160, marginRight: 12 },
  galleryCardNew: {
    width: 160, height: 200, borderRadius: 2, borderWidth: 3,
    borderColor: '#fff', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
    elevation: 2,
    backgroundColor: C.surface,
  },
  galleryImageNew: { width: '100%', height: '100%' },
  galleryHint: {
    alignSelf: 'center', marginTop: 16, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.surface, borderRadius: 999, borderWidth: 1, borderColor: C.border,
  },
  galleryHintText: { fontSize: 13, fontWeight: '500', color: C.main },

  // ── 계좌 + 연락처 통합 카드 ──
  personCard: {
    backgroundColor: C.surface, borderRadius: 2, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  personCardLabel: { fontSize: 14, fontWeight: '600', color: C.main, marginBottom: 10 },
  personRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
  },
  personRowValue: { flex: 1, fontSize: 14, color: C.main, fontWeight: '400' },
  personDivider: { height: 1, backgroundColor: C.border, marginVertical: 2 },
  callBtn: {
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 2, borderWidth: 1, borderColor: C.border,
  },
  callBtnText: { fontSize: 12, fontWeight: '500', color: C.accent, letterSpacing: 0.5 },

  // ── 오시는 길 ──
  locationName: {
    fontSize: 18, fontWeight: '500', color: C.main, textAlign: 'center', marginBottom: 4,
  },
  locationAddr: {
    fontSize: 14, fontWeight: '300', color: C.sub, textAlign: 'center', marginBottom: 20,
  },
  mapContainer: {
    width: '100%', height: 200, borderRadius: 2, overflow: 'hidden',
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  mapPlaceholder: {
    width: '100%', height: 200, backgroundColor: C.surface, borderRadius: 2,
    marginBottom: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  navBtns: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  navBtn: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 2,
    paddingVertical: 12, alignItems: 'center',
  },
  navBtnText: { fontSize: 13, fontWeight: '400', color: C.main },
  transportWrap: { marginTop: 8 },
  transportItem: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16,
  },
  transportDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent,
    marginTop: 6, marginRight: 12,
  },
  transportTitle: { fontSize: 14, fontWeight: '500', color: C.main, marginBottom: 2 },
  transportDesc: { fontSize: 13, fontWeight: '300', color: C.sub, lineHeight: 20 },

  // ── 방명록 ──
  gbCard: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 2, padding: 16, marginBottom: 10,
  },
  gbCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  gbCardName: { fontSize: 14, fontWeight: '500', color: C.main },
  gbCardTime: { fontSize: 12, fontWeight: '300', color: C.sub },
  gbCardMessage: { fontSize: 14, fontWeight: '300', color: C.sub, lineHeight: 22 },
  gbWriteBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 2,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  gbWriteBtnText: { fontSize: 14, fontWeight: '400', color: C.main },

  // 방명록 바텀시트
  gbOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  gbSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, paddingBottom: 40,
  },
  gbSheetHandle: {
    width: 40, height: 4, backgroundColor: C.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  gbSheetTitle: {
    fontSize: 18, fontWeight: '500', color: C.main, textAlign: 'center', marginBottom: 20,
  },
  gbInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 2,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: C.main, marginBottom: 12,
  },
  gbInputMessage: { height: 100, textAlignVertical: 'top' },
  gbSubmitBtn: {
    backgroundColor: C.main, borderRadius: 2, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  gbSubmitText: { fontSize: 15, fontWeight: '500', color: '#fff' },

  // ── 계좌 ──
  accountDesc: {
    fontSize: 14, fontWeight: '300', color: C.sub, textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  accordionCard: {
    borderWidth: 1, borderColor: C.border, borderRadius: 2,
    overflow: 'hidden', marginBottom: 10, backgroundColor: C.bg,
  },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  accordionTitle: { fontSize: 15, fontWeight: '500', color: C.main },
  accordionChevron: { fontSize: 12, color: C.sub },
  accordionBody: { paddingHorizontal: 16 },
  accountBox: {
    backgroundColor: C.surface, borderRadius: 2, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  accountBank: { fontSize: 12, fontWeight: '400', color: C.sub, marginBottom: 2 },
  accountNum: { fontSize: 16, fontWeight: '500', color: C.main },
  copyBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 2,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  copyBtnText: { fontSize: 12, fontWeight: '500', color: C.accent },

  // ── 푸터 ──
  footer: {
    paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: C.border,
  },
  footerThankYou: {
    fontSize: 20, fontWeight: '200', color: C.main, letterSpacing: 4, marginBottom: 8,
  },
  footerNames: {
    fontSize: 14, fontWeight: '400', color: C.sub, letterSpacing: 2, marginBottom: 24,
  },
  footerBtns: { flexDirection: 'row', gap: 12 },
  footerBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 2,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  footerBtnText: { fontSize: 13, fontWeight: '400', color: C.main },

  // ── 토스트 ──
  toast: {
    position: 'absolute', left: 24, right: 24, zIndex: 50,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: 'rgba(34,34,34,0.9)', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 2, fontSize: 14, fontWeight: '400', color: '#fff',
  },

  // ── 이미지 모달 ──
  imageModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageModalClose: {
    position: 'absolute', left: 16, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 999,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  imageModalImg: { width: '100%', height: '80%' },
});
