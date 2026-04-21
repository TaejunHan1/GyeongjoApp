import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Animated, StyleSheet, Dimensions, Modal, Alert, Linking, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  getCategorizedImagesSafe,
  useCountdown,
  formatKoreanDate,
  formatKoreanTime,
} from './WeddingUtils';

const { width, height } = Dimensions.get('window');

// 한글 → 영문 이름 변환
const koreanToEnglish = (name) => {
  const map = {
    '김':'Kim','이':'Lee','박':'Park','최':'Choi','정':'Jung','강':'Kang','조':'Jo','윤':'Yoon','장':'Jang','임':'Lim',
    '한':'Han','오':'Oh','서':'Seo','신':'Shin','권':'Kwon','황':'Hwang','안':'Ahn','송':'Song','전':'Jeon','홍':'Hong',
    '유':'Yoo','고':'Ko','문':'Moon','배':'Bae','백':'Baek','민':'Min','지':'Ji','수':'Soo','현':'Hyun','준':'Jun',
    '영':'Young','진':'Jin','성':'Sung','호':'Ho','연':'Yeon','은':'Eun','혜':'Hye','미':'Mi','선':'Sun',
    '희':'Hee','경':'Kyung','아':'Ah','나':'Na','리':'Ri','라':'Ra','빈':'Bin','원':'Won',
    '태':'Tae','규':'Kyu','재':'Jae','우':'Woo','동':'Dong','훈':'Hoon','상':'Sang','철':'Chul',
    '인':'In','기':'Ki','석':'Seok','광':'Kwang','용':'Yong',
  };
  if (!name) return '';
  const parts = [...name].map(c => map[c] || c);
  if (parts.length > 1) {
    const given = parts.slice(1).join('').toLowerCase();
    return `${parts[0]} ${given.charAt(0).toUpperCase()}${given.slice(1)}`;
  }
  return parts.join('');
};

// ── 아이콘 ──
const Ic = {
  Phone:  () => <Text style={{ fontSize: 17 }}>📞</Text>,
  Chat:   () => <Text style={{ fontSize: 17 }}>💬</Text>,
  Pin:    () => (
    <Svg width={14} height={18} viewBox="0 0 24 30" fill="none">
      <Path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 17 9 17s9-10.25 9-17c0-4.97-4.03-9-9-9z" fill="#8B95A1" />
      <Circle cx="12" cy="9" r="3.5" fill="#fff" />
    </Svg>
  ),
  NavPin: () => (
    <Svg width={15} height={18} viewBox="0 0 24 30" fill="none">
      <Path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 17 9 17s9-10.25 9-17c0-4.97-4.03-9-9-9z" fill="#4E5968" />
      <Circle cx="12" cy="9" r="3.5" fill="#fff" />
    </Svg>
  ),
  NaverIcon: () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h6.5l3.5 6.5V4H20v16h-6.5L10 13.5V20H4V4z" fill="#03C75A" />
    </Svg>
  ),
  TmapIcon: () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#E8002D" />
      <Path d="M9 7h6v1.5h-2.1V14h-1.8V8.5H9V7z" fill="#fff" />
    </Svg>
  ),
  Share:  () => <Text style={{ fontSize: 22, color: '#4E5968' }}>↗</Text>,
  Check:  () => <Text style={{ fontSize: 16, color: '#3182F6' }}>✓</Text>,
  Heart:  () => <Text style={{ fontSize: 16, color: '#fff' }}>♥</Text>,
  ChevUp: () => <Text style={{ fontSize: 18, color: '#8B95A1' }}>▲</Text>,
  ChevDn: () => <Text style={{ fontSize: 18, color: '#8B95A1' }}>▼</Text>,
};

// ── 공통 섹션 ──
function Section({ children, style }) {
  return <View style={[ts.section, style]}>{children}</View>;
}
function SectionTitle({ children, subtitle }) {
  return (
    <View style={ts.sectionTitleWrap}>
      <Text style={ts.sectionTitle}>{children}</Text>
      {subtitle && <Text style={ts.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}
function ActionBtn({ icon, text, onPress }) {
  return (
    <TouchableOpacity style={ts.actionBtn} onPress={onPress} activeOpacity={0.85}>
      {icon}
      <Text style={ts.actionBtnText}>{text}</Text>
    </TouchableOpacity>
  );
}

// ======================================================================
export default function TossStyleTemplate({ eventData = {}, categorizedImages = {}, allowMessages, messageSettings }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [giftSide, setGiftSide] = useState('groom');

  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // 사진 유무
  const hasGroomPhoto = categorizedImages?.groom?.length > 0 && typeof categorizedImages.groom[0] !== 'number';
  const hasBridePhoto = categorizedImages?.bride?.length > 0 && typeof categorizedImages.bride[0] !== 'number';

  // 이름
  const groomName = eventData.groomName || eventData.groom_name || '';
  const brideName = eventData.brideName || eventData.bride_name || '';
  const groomEnName = koreanToEnglish(groomName);
  const brideEnName = koreanToEnglish(brideName);

  // 부모님
  const groomFather = eventData.groomFatherName || eventData.groom_father_name || '';
  const groomMother = eventData.groomMotherName || eventData.groom_mother_name || '';
  const brideFather = eventData.brideFatherName || eventData.bride_father_name || '';
  const brideMother = eventData.brideMotherName || eventData.bride_mother_name || '';

  // 날짜/시간
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date);
  const dateStr = dateInfo?.full || '';
  const timeStr = formatKoreanTime(eventData.ceremonyTime || eventData.ceremony_time);

  // 장소
  const locName = eventData.hallName || eventData.hall_name || eventData.location || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';

  // 카카오 좌표 검색
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const [mapCoord, setMapCoord] = useState(null);

  useEffect(() => {
    const query = locAddr || locName;
    if (!query) return;

    // 1차: 키워드 검색
    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    })
      .then(r => r.json())
      .then(data => {
        const doc = data.documents?.[0];
        if (doc) {
          setMapCoord({ lat: doc.y, lng: doc.x });
        } else if (locAddr) {
          // 2차: 주소 검색
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

  // 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date,
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // 연락처 포맷
  const formatPhone = (phone) => {
    if (!phone) return '';
    const d = phone.replace(/\D/g, '');
    if (d.length === 8) return `010-${d.slice(0,4)}-${d.slice(4)}`;
    if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
    if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
    return phone;
  };

  // 계좌 정보
  const ai = eventData.additional_info || {};

  // 연락처
  const groomContact = eventData.groomContact || eventData.groom_contact || '';
  const brideContact = eventData.brideContact || eventData.bride_contact || '';
  const groomFatherContact = eventData.groomFatherContact || ai.groom_father_contact || '';
  const groomMotherContact = eventData.groomMotherContact || ai.groom_mother_contact || '';
  const brideFatherContact = eventData.brideFatherContact || ai.bride_father_contact || '';
  const brideMotherContact = eventData.brideMotherContact || ai.bride_mother_contact || '';
  // 계좌번호 (camelCase 미리보기 + snake_case DB 둘 다 대응)
  const groomAccount      = { num: eventData.groomAccountNumber       || ai.groom_account_number        || '', bank: eventData.groomBankName       || ai.groom_bank_name        || '' };
  const groomFatherAccount= { num: eventData.groomFatherAccountNumber || ai.groom_father_account_number || '', bank: eventData.groomFatherBankName || ai.groom_father_bank_name || '' };
  const groomMotherAccount= { num: eventData.groomMotherAccountNumber || ai.groom_mother_account_number || '', bank: eventData.groomMotherBankName || ai.groom_mother_bank_name || '' };
  const brideAccount      = { num: eventData.brideAccountNumber       || ai.bride_account_number        || '', bank: eventData.brideBankName       || ai.bride_bank_name        || '' };
  const brideFatherAccount= { num: eventData.brideFatherAccountNumber || ai.bride_father_account_number || '', bank: eventData.brideFatherBankName || ai.bride_father_bank_name || '' };
  const brideMotherAccount= { num: eventData.brideMotherAccountNumber || ai.bride_mother_account_number || '', bank: eventData.brideMotherBankName || ai.bride_mother_bank_name || '' };

  const hasGiftSection = groomAccount.num || groomFatherAccount.num || groomMotherAccount.num
    || brideAccount.num || brideFatherAccount.num || brideMotherAccount.num
    || groomContact || brideContact || groomFatherContact || groomMotherContact
    || brideFatherContact || brideMotherContact;

  // 갤러리
  const galleryImages = safeImages.gallery || safeImages.all || [];

  // 방명록
  const guestMessages = eventData.guestMessages || [
    { from: '민나', date: '2025.04.24 18:52', content: '하윤아❤️ 결혼을 진심으로 축하한다!\n민호 오빠랑 둘이 지금처럼 행복하게 백년해로 하기\n항상 웃음 가득한 하루하루 보내길 바랄게!\nHappy Wedding💜' },
    { from: 'sooyeon', date: '2025.04.23 09:41', content: '결혼을 진심으로 축하드립니다💕\n사진도 청첩장도 너무 이쁘요!\n항상 서로를 응원하고 아껴주는 모습이 참 이쁜 커플입니다😊\n행복한 결혼 생활 되길 바래요' },
    { from: '지현', date: '2025.04.22 14:23', content: '하윤아 결혼 진심으로 축하해!\n웨딩스냅, 청첩장 모두 너무 예쁘다!💚\n남은 결혼식 준비도 잘 마무리하고!\n행복한 결혼생활 되기를 바래✨' },
  ];
  const msgsPerPage = 3;
  const totalMsgPages = Math.ceil(guestMessages.length / msgsPerPage);
  const currentMsgs = guestMessages.slice(currentPage * msgsPerPage, (currentPage + 1) * msgsPerPage);

  // 토스트
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
      showToast('계좌번호가 복사되었어요');
    } catch { showToast('복사에 실패했습니다'); }
  };


  // 달력
  const calDays = ['일', '월', '화', '수', '목', '금', '토'];
  const weddingDate = eventData.date || eventData.event_date;
  let calYear = 2026, calMonth = 5, calDay = 14;
  if (weddingDate) {
    try {
      const d = new Date(weddingDate);
      if (!isNaN(d.getTime())) { calYear = d.getFullYear(); calMonth = d.getMonth() + 1; calDay = d.getDate(); }
    } catch {}
  }
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();

  // D-day
  let dDayText = '';
  if (weddingDate) {
    const diff = Math.ceil((new Date(weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff > 0) dDayText = `D-${diff}`;
    else if (diff === 0) dDayText = 'D-Day';
    else dDayText = `D+${Math.abs(diff)}`;
  }

  return (
    <View style={[ts.root, { paddingBottom: insets.bottom }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ── 메인 사진 ── */}
        <View style={ts.heroPhotoWrap}>
          <Image
            source={safeImages.main?.[0] || safeImages.all?.[0]}
            style={ts.heroPhoto}
            resizeMode="cover"
          />
        </View>

        {/* ── 인사말 ── */}
        <Section style={ts.greetingSection}>
          <SectionTitle subtitle="소중한 분들을 초대합니다">인사말</SectionTitle>
          {/* 인사 메시지 박스 */}
          <View style={ts.greetingMsgBox}>
            <Text style={ts.greetingText}>
              {eventData.customMessage || eventData.custom_message ||
                '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n\n저희 두 사람이 사랑의 이름으로\n지켜나갈 수 있게 앞날을\n축복해 주시면 감사하겠습니다.'}
            </Text>
          </View>

          {/* 신랑 · 신부 카드 */}
          <View style={ts.coupleCard}>
            <View style={ts.coupleCardItem}>
              <Text style={ts.coupleCardRole}>신랑</Text>
              <Text style={ts.coupleCardName}>{groomName}</Text>
              <Text style={ts.coupleCardParents}>
                {groomFather || '아버지'}{groomFather && groomMother ? ' · ' : ''}{groomMother || '어머니'}의 아들
              </Text>
            </View>
            <Text style={ts.coupleCardHeart}>♥</Text>
            <View style={ts.coupleCardItem}>
              <Text style={ts.coupleCardRole}>신부</Text>
              <Text style={ts.coupleCardName}>{brideName}</Text>
              <Text style={ts.coupleCardParents}>
                {brideFather || '아버지'}{brideFather && brideMother ? ' · ' : ''}{brideMother || '어머니'}의 딸
              </Text>
            </View>
          </View>
        </Section>

        {/* ── 갤러리 ── */}
        {galleryImages.length > 0 && (
          <Section style={{ paddingRight: 0 }}>
            <SectionTitle subtitle="아름다운 순간들">갤러리</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ts.galleryScroll}>
              {galleryImages.map((img, idx) => (
                <TouchableOpacity key={idx} onPress={() => setSelectedImage(img)} activeOpacity={0.92}>
                  <Image source={typeof img === 'string' ? { uri: img } : img} style={ts.galleryThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Section>
        )}

        {/* ── 웨딩데이 ── */}
        {weddingDate && (
          <Section>
            <SectionTitle subtitle="소중한 날을 함께해요">Wedding Day</SectionTitle>
            {/* 달력 */}
            <View style={ts.calBox}>
              <Text style={ts.calMonth}>{calYear}년 {calMonth}월</Text>
              <View style={ts.calRow}>
                {calDays.map(d => (
                  <Text key={d} style={[ts.calDayLabel, d === '일' && ts.calDayLabelSun]}>{d}</Text>
                ))}
              </View>
              <View style={ts.calGrid}>
                {Array.from({ length: firstDow }).map((_, i) => (
                  <View key={`e${i}`} style={ts.calCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isWedding = day === calDay;
                  return (
                    <View key={i} style={ts.calCell}>
                      <View style={[ts.calDayCircle, isWedding && ts.calDayCircleActive]}>
                        <Text style={[ts.calDayText, isWedding && ts.calDayTextActive]}>{day}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* 카운트다운 카드 */}
            {!timeLeft.isExpired ? (
              <View style={ts.countdownCards}>
                {[
                  { v: timeLeft.days,    l: '일' },
                  { v: timeLeft.hours,   l: '시간' },
                  { v: timeLeft.minutes, l: '분' },
                  { v: timeLeft.seconds, l: '초' },
                ].map((item, i) => (
                  <View key={i} style={ts.countdownCard}>
                    <Text style={ts.countdownNumber}>{item.v}</Text>
                    <Text style={ts.countdownLabel}>{item.l}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={ts.countdownComplete}>
                <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🎉</Text>
                <Text style={ts.countdownCompleteText}>D-Day! 축하합니다!</Text>
              </View>
            )}
            <Text style={ts.countdownMessage}>
              {groomName}<Text style={ts.countdownHeart}> ♡ </Text>{brideName}의 결혼식이{' '}
              <Text style={ts.countdownDays}>{timeLeft.days}일</Text> 남았습니다
            </Text>
          </Section>
        )}

        {/* ── 장소 ── */}
        {locName && (
          <Section>
            <SectionTitle subtitle="오시는 길">장소 안내</SectionTitle>
            <View style={ts.locationNameRow}>
              <Ic.NavPin />
              <Text style={[ts.locationName, { marginBottom: 0, marginLeft: 6 }]}>{locName}</Text>
            </View>
            {locAddr ? (
              <View style={ts.locationAddrRow}>
                <Ic.Pin />
                <Text style={ts.locationAddr}> {locAddr}</Text>
              </View>
            ) : null}
            {mapCoord ? (
              <View style={ts.mapContainer}>
                <WebView
                  source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              </View>
            ) : (locAddr || locName) ? (
              <View style={ts.mapMock}>
                <Text style={{ fontSize: 14, color: '#8B95A1' }}>지도를 불러오는 중...</Text>
              </View>
            ) : null}
            <View style={ts.navBtns}>
              <ActionBtn icon={<Ic.NaverIcon />} text="네이버지도" onPress={() => {
                const query = encodeURIComponent(locAddr || locName);
                Linking.openURL(`nmap://search?query=${query}&appname=com.gyeongjo`).catch(() =>
                  Linking.openURL(`https://map.naver.com/v5/search/${query}`)
                );
              }} />
              <ActionBtn icon={<Ic.TmapIcon />} text="티맵" onPress={() => {
                const query = encodeURIComponent(locAddr || locName);
                Linking.openURL(`tmap://search?searchKeyword=${query}`).catch(() =>
                  Linking.openURL(`https://tmap.life/search?query=${query}`)
                );
              }} />
            </View>
          </Section>
        )}

        {/* ── 방명록 ── */}
        {allowMessages && (
          <View style={ts.messagesSection}>
            <Text style={ts.messagesTitle}>Messages</Text>
            <Text style={ts.messagesSubtitle}>
              {messageSettings?.placeholder || '저희 둘에게 따뜻한 방명록을 남겨주세요'}
            </Text>

            {/* 메시지 리스트 */}
            <View style={ts.msgList}>
              {guestMessages.length === 0 ? (
                <View style={ts.msgEmpty}>
                  <Text style={ts.msgEmptyIcon}>💬</Text>
                  <Text style={ts.msgEmptyText}>아직 축하 메시지가 없습니다</Text>
                </View>
              ) : (
                currentMsgs.map((msg, i) => (
                  <View key={i} style={ts.msgCard}>
                    <View style={ts.msgHeader}>
                      <Text style={ts.msgFrom}>From. {msg.from}</Text>
                      <Text style={ts.msgDate}>{msg.date}</Text>
                    </View>
                    <Text style={ts.msgContent}>{msg.content}</Text>
                  </View>
                ))
              )}
            </View>

            {/* 페이지네이션 */}
            {totalMsgPages > 1 && (
              <View style={ts.msgPagination}>
                <TouchableOpacity onPress={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                  <Text style={[ts.msgPageNav, currentPage === 0 && ts.msgPageNavDisabled]}>‹</Text>
                </TouchableOpacity>
                <View style={ts.msgPageDots}>
                  {Array.from({ length: totalMsgPages }, (_, i) => (
                    <TouchableOpacity key={i} onPress={() => setCurrentPage(i)}>
                      <View style={[ts.msgPageDot, currentPage === i && ts.msgPageDotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setCurrentPage(p => Math.min(totalMsgPages - 1, p + 1))} disabled={currentPage === totalMsgPages - 1}>
                  <Text style={[ts.msgPageNav, currentPage === totalMsgPages - 1 && ts.msgPageNavDisabled]}>›</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 축하메시지 남기기 버튼 (미리보기 비활성) */}
            <View style={ts.msgWriteBtn}>
              <Text style={ts.msgWriteBtnText}>축하메시지 남기기</Text>
            </View>
          </View>
        )}

        {/* ── 축의금 & 연락처 ── */}
        {hasGiftSection && (
          <Section>
            <SectionTitle subtitle="따뜻한 마음을 함께 나누어주세요">축의금 & 연락처</SectionTitle>

            {/* 신랑/신부 토글 */}
            <View style={ts.giftToggleWrap}>
              <TouchableOpacity
                style={[ts.giftToggleBtn, giftSide === 'groom' && ts.giftToggleBtnActive]}
                onPress={() => setGiftSide('groom')} activeOpacity={0.85}
              >
                <Text style={[ts.giftToggleBtnText, giftSide === 'groom' && ts.giftToggleBtnTextActive]}>신랑측</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ts.giftToggleBtn, giftSide === 'bride' && ts.giftToggleBtnActive]}
                onPress={() => setGiftSide('bride')} activeOpacity={0.85}
              >
                <Text style={[ts.giftToggleBtnText, giftSide === 'bride' && ts.giftToggleBtnTextActive]}>신부측</Text>
              </TouchableOpacity>
            </View>

            {/* 신랑측 카드 */}
            {giftSide === 'groom' && (
              <View style={ts.personCardsContainer}>
                {/* 신랑 */}
                {(groomAccount.num || groomContact) && (
                  <View style={ts.personCard}>
                    <Text style={ts.personCardLabel}>{groomName || '신랑'}</Text>
                    {groomAccount.num && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => copyToClipboard(groomAccount.num)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          {groomAccount.bank ? <Text style={ts.personCardBank}>{groomAccount.bank}</Text> : null}
                          <Text style={ts.personCardValue}>{groomAccount.num}</Text>
                        </View>
                        <View style={ts.personCopyBtn}><Text style={ts.personCopyBtnText}>복사</Text></View>
                      </TouchableOpacity>
                    )}
                    {groomAccount.num && groomContact ? <View style={ts.personCardDivider} /> : null}
                    {groomContact && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => Linking.openURL(`tel:${groomContact.replace(/\D/g,'')}`)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          <Text style={ts.personCardValue}>{formatPhone(groomContact)}</Text>
                        </View>
                        <View style={ts.personCallBtn}>
                          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2">
                            <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                          </Svg>
                          <Text style={ts.personCallBtnText}>전화</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* 신랑 아버님 */}
                {(groomFatherAccount.num || groomFatherContact) && (
                  <View style={ts.personCard}>
                    <Text style={ts.personCardLabel}>{groomFather || '아버님'}</Text>
                    {groomFatherAccount.num && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => copyToClipboard(groomFatherAccount.num)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          {groomFatherAccount.bank ? <Text style={ts.personCardBank}>{groomFatherAccount.bank}</Text> : null}
                          <Text style={ts.personCardValue}>{groomFatherAccount.num}</Text>
                        </View>
                        <View style={ts.personCopyBtn}><Text style={ts.personCopyBtnText}>복사</Text></View>
                      </TouchableOpacity>
                    )}
                    {groomFatherAccount.num && groomFatherContact ? <View style={ts.personCardDivider} /> : null}
                    {groomFatherContact && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => Linking.openURL(`tel:${groomFatherContact.replace(/\D/g,'')}`)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          <Text style={ts.personCardValue}>{formatPhone(groomFatherContact)}</Text>
                        </View>
                        <View style={ts.personCallBtn}>
                          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2">
                            <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                          </Svg>
                          <Text style={ts.personCallBtnText}>전화</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* 신랑 어머님 */}
                {(groomMotherAccount.num || groomMotherContact) && (
                  <View style={ts.personCard}>
                    <Text style={ts.personCardLabel}>{groomMother || '어머님'}</Text>
                    {groomMotherAccount.num && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => copyToClipboard(groomMotherAccount.num)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          {groomMotherAccount.bank ? <Text style={ts.personCardBank}>{groomMotherAccount.bank}</Text> : null}
                          <Text style={ts.personCardValue}>{groomMotherAccount.num}</Text>
                        </View>
                        <View style={ts.personCopyBtn}><Text style={ts.personCopyBtnText}>복사</Text></View>
                      </TouchableOpacity>
                    )}
                    {groomMotherAccount.num && groomMotherContact ? <View style={ts.personCardDivider} /> : null}
                    {groomMotherContact && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => Linking.openURL(`tel:${groomMotherContact.replace(/\D/g,'')}`)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          <Text style={ts.personCardValue}>{formatPhone(groomMotherContact)}</Text>
                        </View>
                        <View style={ts.personCallBtn}>
                          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2">
                            <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                          </Svg>
                          <Text style={ts.personCallBtnText}>전화</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* 신부측 카드 */}
            {giftSide === 'bride' && (
              <View style={ts.personCardsContainer}>
                {/* 신부 */}
                {(brideAccount.num || brideContact) && (
                  <View style={ts.personCard}>
                    <Text style={ts.personCardLabel}>{brideName || '신부'}</Text>
                    {brideAccount.num && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => copyToClipboard(brideAccount.num)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          {brideAccount.bank ? <Text style={ts.personCardBank}>{brideAccount.bank}</Text> : null}
                          <Text style={ts.personCardValue}>{brideAccount.num}</Text>
                        </View>
                        <View style={ts.personCopyBtn}><Text style={ts.personCopyBtnText}>복사</Text></View>
                      </TouchableOpacity>
                    )}
                    {brideAccount.num && brideContact ? <View style={ts.personCardDivider} /> : null}
                    {brideContact && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => Linking.openURL(`tel:${brideContact.replace(/\D/g,'')}`)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          <Text style={ts.personCardValue}>{formatPhone(brideContact)}</Text>
                        </View>
                        <View style={ts.personCallBtn}>
                          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2">
                            <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                          </Svg>
                          <Text style={ts.personCallBtnText}>전화</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* 신부 아버님 */}
                {(brideFatherAccount.num || brideFatherContact) && (
                  <View style={ts.personCard}>
                    <Text style={ts.personCardLabel}>{brideFather || '아버님'}</Text>
                    {brideFatherAccount.num && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => copyToClipboard(brideFatherAccount.num)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          {brideFatherAccount.bank ? <Text style={ts.personCardBank}>{brideFatherAccount.bank}</Text> : null}
                          <Text style={ts.personCardValue}>{brideFatherAccount.num}</Text>
                        </View>
                        <View style={ts.personCopyBtn}><Text style={ts.personCopyBtnText}>복사</Text></View>
                      </TouchableOpacity>
                    )}
                    {brideFatherAccount.num && brideFatherContact ? <View style={ts.personCardDivider} /> : null}
                    {brideFatherContact && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => Linking.openURL(`tel:${brideFatherContact.replace(/\D/g,'')}`)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          <Text style={ts.personCardValue}>{formatPhone(brideFatherContact)}</Text>
                        </View>
                        <View style={ts.personCallBtn}>
                          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2">
                            <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                          </Svg>
                          <Text style={ts.personCallBtnText}>전화</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* 신부 어머님 */}
                {(brideMotherAccount.num || brideMotherContact) && (
                  <View style={ts.personCard}>
                    <Text style={ts.personCardLabel}>{brideMother || '어머님'}</Text>
                    {brideMotherAccount.num && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => copyToClipboard(brideMotherAccount.num)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          {brideMotherAccount.bank ? <Text style={ts.personCardBank}>{brideMotherAccount.bank}</Text> : null}
                          <Text style={ts.personCardValue}>{brideMotherAccount.num}</Text>
                        </View>
                        <View style={ts.personCopyBtn}><Text style={ts.personCopyBtnText}>복사</Text></View>
                      </TouchableOpacity>
                    )}
                    {brideMotherAccount.num && brideMotherContact ? <View style={ts.personCardDivider} /> : null}
                    {brideMotherContact && (
                      <TouchableOpacity style={ts.personCardRow} onPress={() => Linking.openURL(`tel:${brideMotherContact.replace(/\D/g,'')}`)} activeOpacity={0.7}>
                        <View style={ts.personCardInfo}>
                          <Text style={ts.personCardValue}>{formatPhone(brideMotherContact)}</Text>
                        </View>
                        <View style={ts.personCallBtn}>
                          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2">
                            <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                          </Svg>
                          <Text style={ts.personCallBtnText}>전화</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
          </Section>
        )}
      </ScrollView>

      {/* ── 하단 바 ── */}
      <View style={[ts.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={ts.shareBtn} onPress={() => showToast('공유 기능 준비 중입니다')} activeOpacity={0.85}>
          <Ic.Share />
        </TouchableOpacity>
        <TouchableOpacity style={ts.msgBtn} onPress={() => showToast('축하 메시지 기능 준비 중입니다')} activeOpacity={0.88}>
          <Text style={ts.msgBtnText}>축하 메시지 남기기</Text>
        </TouchableOpacity>
      </View>

      {/* ── 토스트 ── */}
      {toast.visible && (
        <Animated.View style={[ts.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          top: insets.top + 16,
        }]}>
          <Ic.Check />
          <Text style={ts.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ── 이미지 풀스크린 ── */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={ts.imageModal}>
          <TouchableOpacity style={[ts.imageModalClose, { top: insets.top + 16 }]} onPress={() => setSelectedImage(null)}>
            <Text style={{ fontSize: 22, color: '#fff' }}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={typeof selectedImage === 'string' ? { uri: selectedImage } : selectedImage} style={ts.imageModalImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ======================================================================
const ts = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F4F6' },

  heroPhotoWrap: { width: '100%', height: height * 0.72, backgroundColor: '#F8F9FA' },
  heroPhoto: { width: '100%', height: '100%' },
  introSection: { width: '100%', backgroundColor: '#fff', paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center', gap: 16 },
  heroBadge: { backgroundColor: '#EBF2FF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { color: '#3182F6', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  heroNamesRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroNameItem: { alignItems: 'center', gap: 4 },
  heroNameKo: { fontSize: 28, fontWeight: '900', color: '#1B1B1B', letterSpacing: -1 },
  heroNameEn: { fontSize: 13, color: '#6B7684', fontWeight: '400' },
  heroAmpersand: { fontSize: 32, fontWeight: '300', color: '#3182F6', lineHeight: 36 },
  heroDateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(248,249,250,0.9)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  heroDateText: { fontSize: 13, fontWeight: '500', color: '#1B1B1B' },
  heroDateSep: { color: '#C4C4C4', fontSize: 14 },

  section: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 40, marginBottom: 8 },
  greetingSection: { borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, zIndex: 1 },
  sectionTitleWrap: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#191F28', marginBottom: 4 },
  sectionSubtitle: { fontSize: 15, color: '#8B95A1', fontWeight: '500' },

  greetingMsgBox: { backgroundColor: '#F8F9FA', borderRadius: 12, paddingVertical: 24, paddingHorizontal: 20, marginBottom: 20 },
  greetingText: { fontSize: 15, lineHeight: 28, color: '#4E5968', fontWeight: '500', textAlign: 'center' },

  coupleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EBF2FF', borderRadius: 16, paddingVertical: 24, paddingHorizontal: 16, gap: 8 },
  coupleCardItem: { flex: 1, alignItems: 'center', gap: 4 },
  coupleCardRole: { fontSize: 11, fontWeight: '700', color: '#3182F6', letterSpacing: 1 },
  coupleCardName: { fontSize: 20, fontWeight: '700', color: '#1B1B1B', letterSpacing: -0.5 },
  coupleCardParents: { fontSize: 11, color: '#8B95A1', textAlign: 'center', marginTop: 2 },
  coupleCardHeart: { fontSize: 22, color: '#EF4444', fontWeight: '300' },

  contactCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F2F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  contactLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactBadgeText: { fontSize: 13, fontWeight: '700' },
  contactName: { fontSize: 18, fontWeight: '700', color: '#191F28' },
  contactActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, backgroundColor: '#F2F4F6', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  galleryScroll: { paddingRight: 24, gap: 14, paddingBottom: 8 },
  galleryThumb: { width: 192, height: 256, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },

  calBox: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#F2F4F6' },
  calMonth: { fontSize: 16, fontWeight: '700', color: '#191F28', marginBottom: 16, textAlign: 'center' },
  calRow: { flexDirection: 'row', marginBottom: 10 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#8B95A1' },
  calDayLabelSun: { color: '#F04452' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  calDayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calDayCircleActive: { backgroundColor: '#3182F6', shadowColor: '#3182F6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  calDayText: { fontSize: 15, fontWeight: '600', color: '#4E5968' },
  calDayTextActive: { color: '#fff' },
  countdownCards: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 16 },
  countdownCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', minWidth: 64, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  countdownNumber: { fontSize: 28, fontWeight: '900', color: '#3182F6', lineHeight: 32 },
  countdownLabel: { fontSize: 11, fontWeight: '500', color: '#8B95A1', marginTop: 4 },
  countdownComplete: { alignItems: 'center', paddingVertical: 24 },
  countdownCompleteText: { fontSize: 18, fontWeight: '700', color: '#3182F6' },
  countdownMessage: { fontSize: 14, color: '#8B95A1', textAlign: 'center', marginBottom: 4 },
  countdownHeart: { color: '#3182F6' },
  countdownDays: { fontWeight: '900', color: '#3182F6', fontSize: 16 },

  locationNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  locationName: { fontSize: 18, fontWeight: '700', color: '#191F28', marginBottom: 6 },
  locationAddrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationAddr: { fontSize: 15, color: '#8B95A1', fontWeight: '500' },
  mapContainer: { width: '100%', height: 192, borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#F2F4F6' },
  mapMock: { width: '100%', height: 192, backgroundColor: '#E5E8EB', borderRadius: 20, marginBottom: 16, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  mapPin: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  mapPinInner: { width: 32, height: 32, backgroundColor: '#3182F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mapLabel: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  mapLabelText: { fontSize: 12, fontWeight: '700', color: '#4E5968' },
  navBtns: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#F2F4F6', paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#4E5968' },

  messagesSection: { paddingVertical: 60, paddingHorizontal: 20, backgroundColor: '#fff', marginBottom: 8 },
  messagesTitle: { fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif', fontSize: 40, color: '#333', fontStyle: 'italic', textAlign: 'center', marginBottom: 10 },
  messagesSubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 40 },
  msgList: { width: '100%', maxWidth: 500, alignSelf: 'center', marginBottom: 20 },
  msgEmpty: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 16 },
  msgEmptyIcon: { fontSize: 40, marginBottom: 12 },
  msgEmptyText: { fontSize: 15, color: '#999' },
  msgCard: { backgroundColor: '#fff', borderRadius: 16, padding: 22, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  msgFrom: { fontSize: 13, color: '#9B8D82', fontWeight: '500' },
  msgDate: { fontSize: 11, color: '#bbb' },
  msgContent: { fontSize: 14, lineHeight: 22, color: '#555' },
  msgPagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 24 },
  msgPageNav: { fontSize: 22, color: '#9B8D82', paddingHorizontal: 8, paddingVertical: 4 },
  msgPageNavDisabled: { color: '#ddd' },
  msgPageDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  msgPageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0D5D1' },
  msgPageDotActive: { width: 24, backgroundColor: '#9B8D82' },
  msgWriteBtn: { alignSelf: 'center', marginTop: 20, backgroundColor: '#3182F6', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12 },
  msgWriteBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  giftToggleWrap: { flexDirection: 'row', backgroundColor: '#F2F4F6', borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 },
  giftToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  giftToggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  giftToggleBtnText: { fontSize: 14, fontWeight: '600', color: '#8B95A1' },
  giftToggleBtnTextActive: { color: '#3182F6' },

  personCardsContainer: { gap: 10 },
  personCard: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 14, overflow: 'hidden' },
  personCardLabel: { fontSize: 11, fontWeight: '700', color: '#3182F6', letterSpacing: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  personCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  personCardInfo: { flex: 1 },
  personCardBank: { fontSize: 11, color: '#8B95A1', marginBottom: 2 },
  personCardValue: { fontSize: 14, fontWeight: '600', color: '#191F28' },
  personCardDivider: { height: 1, backgroundColor: '#E8E8E8', marginHorizontal: 16 },
  personCopyBtn: { backgroundColor: '#3182F6', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  personCopyBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  personCallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#3182F6' },
  personCallBtnText: { fontSize: 12, fontWeight: '700', color: '#3182F6' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.92)', borderTopWidth: 1, borderTopColor: '#F2F4F6', paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', gap: 10 },
  shareBtn: { width: 56, height: 56, backgroundColor: '#F2F4F6', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  msgBtn: { flex: 1, height: 56, backgroundColor: '#3182F6', borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#3182F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  msgBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  toast: { position: 'absolute', left: 0, right: 0, zIndex: 50, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  toastText: { backgroundColor: 'rgba(25,31,40,0.9)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999, fontSize: 15, fontWeight: '700', color: '#fff' },

  imageModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageModalClose: { position: 'absolute', left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 999, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  imageModalImg: { width: '100%', height: '80%' },
});
