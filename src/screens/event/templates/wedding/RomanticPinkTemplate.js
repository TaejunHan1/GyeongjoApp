// src/screens/event/templates/wedding/RomanticPinkTemplate.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  Modal,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useCountdown,
  getCategorizedImagesSafe,
  formatKoreanDate,
  formatKoreanTime,
  width,
  height,
} from './WeddingUtils';
import {
  FallingPetals,
  CountdownDisplay,
  ImageViewer,
  MainPhotoSlideshow,
  HeartPulse,
  RomanticPinkCalendar,
  GuestBookMessages,
} from './WeddingCommonComponents';
import { WebView } from 'react-native-webview';
import styles from './WeddingStyles';

// 랜덤 인사말 목록 - 더 길고 아름답게 수정
const RANDOM_GREETINGS = [
  `두 사람이 만나 하나의 길을 걷습니다.
서로 다른 빛깔이 어우러져
더 아름다운 무지개가 되듯이
두 분의 사랑이 영원히 빛나길 바랍니다.

봄날 아침이슬처럼 맑고 투명한 마음으로
서로를 아끼고 보살피며
매일매일 새로운 행복을 만들어가는
아름다운 부부가 되시길 기원합니다.

저희 두 사람이 함께하는 새로운 시작에
귀한 발걸음으로 축복해 주시면 감사하겠습니다.`,

  `봄날의 꽃처럼 피어난 사랑이
여름의 태양처럼 뜨겁게 타오르고
가을의 결실처럼 풍성하며
겨울의 눈처럼 순수하길 바랍니다.

계절이 바뀌어도 변치 않는 사랑으로
서로에게 든든한 버팀목이 되어주며
평생 함께 걸어갈 동반자로서
아름다운 동행을 이어가시길 기도합니다.

소중한 날, 함께해 주시는 모든 분들께
진심으로 감사드립니다.`,

  `오랜 기다림 끝에 만난 인연
이제 서로의 영원한 동반자가 되어
기쁨은 두 배로, 슬픔은 반으로
나누며 살아가겠습니다.

햇살처럼 따스한 미소로 서로를 바라보며
별빛처럼 영롱한 추억들을 쌓아가고
무지개처럼 희망찬 내일을 꿈꾸며
한평생 아름다운 사랑을 키워가겠습니다.

저희의 첫걸음을 축복해 주세요.`,

  `서로를 향한 믿음과 사랑으로
평생을 함께하기로 약속했습니다.
따뜻한 격려와 축복 속에서
더욱 단단한 가정을 이루겠습니다.

아침 햇살처럼 포근하게 서로를 감싸주고
저녁 노을처럼 아름답게 물들어가며
밤하늘 별처럼 반짝이는 사랑으로
영원토록 함께하는 부부가 되겠습니다.

귀한 시간 내어 축하해 주시면
큰 기쁨이 되겠습니다.`,

  `첫 만남의 설렘을 간직한 채
이제 평생의 동반자가 되려 합니다.
서로 존중하고 배려하며
아름다운 가정을 만들어가겠습니다.

맑은 샘물처럼 순수한 마음으로
푸른 나무처럼 굳건한 신뢰로
향기로운 꽃처럼 아름다운 사랑으로
세상에서 가장 행복한 가정을 꾸려가겠습니다.

저희 두 사람의 새 출발을
함께 축복해 주시기 바랍니다.`,

  `운명처럼 만난 두 사람
이제 하나의 가정을 이루려 합니다.
변치 않는 사랑과 신뢰로
행복한 미래를 그려가겠습니다.

새벽 이슬처럼 청초한 마음으로 시작하여
한낮의 태양처럼 열정적으로 사랑하고
황혼의 노을처럼 아름답게 물들어가는
평생의 반려자가 되겠습니다.

소중한 분들과 함께 
이 기쁨을 나누고 싶습니다.`,

  `사랑하는 마음 하나로 시작하여
서로를 이해하는 지혜를 배우고
함께 성장하는 기쁨을 누리며
영원히 함께하겠습니다.

봄바람처럼 부드럽게 어루만지고
여름비처럼 시원하게 위로하며
가을 하늘처럼 높고 깊은 사랑으로
겨울 눈처럼 포근하게 덮어주는
그런 사랑을 하며 살겠습니다.`,

  `긴 여정 끝에 찾은 서로에게
이제 영원을 약속하려 합니다.
매일이 감사하고 행복한 날들로
채워지길 소망합니다.

아침마다 서로의 얼굴을 보며 미소 짓고
저녁마다 서로의 손을 잡고 감사하며
매순간 서로를 향한 사랑을 확인하는
그런 아름다운 부부가 되겠습니다.

함께해 주시는 모든 분들께
깊은 감사의 마음을 전합니다.`,

  `서로의 부족함을 채워주고
장점은 더욱 빛나게 해주는
최고의 파트너를 만났습니다.
평생 서로를 아끼며 살겠습니다.

산들바람처럼 상쾌한 아침을 열어주고
따스한 햇살처럼 온기를 나누며
맑은 하늘처럼 투명한 사랑으로
영원히 함께할 것을 약속합니다.

새로운 시작을 축복해 주신다면
더없는 기쁨이 되겠습니다.`,

  `따뜻한 봄날에 시작된 사랑이
이제 결실을 맺으려 합니다.
언제나 처음 그 마음 그대로
서로를 사랑하며 살아가겠습니다.

꽃잎처럼 여린 마음으로 서로를 아끼고
나무처럼 든든하게 서로를 지켜주며
바다처럼 넓은 마음으로 서로를 품어주는
아름답고 행복한 가정을 만들어가겠습니다.

귀한 발걸음 해주시는 모든 분들께
진심으로 감사드립니다.`
];

// 한글 이름을 영어로 변환하는 함수
const koreanToEnglish = (koreanName) => {
  const nameMap = {
    // 성씨
    '김': 'Kim', '이': 'Lee', '박': 'Park', '최': 'Choi', '정': 'Jung',
    '강': 'Kang', '조': 'Jo', '윤': 'Yoon', '장': 'Jang', '임': 'Lim',
    '한': 'Han', '오': 'Oh', '서': 'Seo', '신': 'Shin', '권': 'Kwon',
    '황': 'Hwang', '안': 'Ahn', '송': 'Song', '전': 'Jeon', '홍': 'Hong',
    '유': 'Yoo', '고': 'Ko', '문': 'Moon', '배': 'Bae', '백': 'Baek',
    '허': 'Heo', '남': 'Nam', '심': 'Sim', '노': 'Noh', '하': 'Ha',
    '곽': 'Kwak', '성': 'Sung', '차': 'Cha', '주': 'Joo', '우': 'Woo',
    '구': 'Koo', '민': 'Min', '진': 'Jin', '나': 'Na', '지': 'Ji',
    '변': 'Byun', '방': 'Bang', '양': 'Yang',
    
    // 이름 음절들
    '민': 'Min', '지': 'Ji', '수': 'Soo', '현': 'Hyun', '준': 'Jun',
    '영': 'Young', '정': 'Jung', '진': 'Jin', '성': 'Sung', '호': 'Ho',
    '연': 'Yeon', '은': 'Eun', '혜': 'Hye', '미': 'Mi', '선': 'Sun',
    '희': 'Hee', '경': 'Kyung', '윤': 'Yoon', '서': 'Seo', '아': 'Ah',
    '나': 'Na', '리': 'Ri', '라': 'Ra', '빈': 'Bin', '원': 'Won',
    '태': 'Tae', '규': 'Kyu', '재': 'Jae', '한': 'Han', '우': 'Woo',
    '동': 'Dong', '훈': 'Hoon', '상': 'Sang', '철': 'Chul', '병': 'Byung',
    '인': 'In', '기': 'Ki', '석': 'Seok', '광': 'Kwang', '용': 'Yong',
    '하': 'Ha', '솔': 'Sol', '린': 'Rin', '율': 'Yul', '별': 'Byul',
  };

  if (!koreanName) return '';
  
  let result = [];
  for (let i = 0; i < koreanName.length; i++) {
    const char = koreanName[i];
    if (nameMap[char]) {
      result.push(nameMap[char]);
    } else {
      result.push(char);
    }
  }
  
  if (result.length > 1) {
    const surname = result[0];
    const givenName = result.slice(1).join('').toLowerCase();
    return `${surname} ${givenName.charAt(0).toUpperCase() + givenName.slice(1)}`;
  }
  
  return result.join('');
};

// SVG 텍스트 애니메이션 컴포넌트
const AnimatedSvgText = ({ text, style, fontSize = 48, color = 'white' }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();
  }, []);
  
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });
  
  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.8, 1],
  });
  
  return (
    <Animated.View style={[{ opacity }, style]}>
      <Svg height={fontSize * 1.5} width={width - 40}>
        <SvgText
          x="50%"
          y="50%"
          fontSize={fontSize}
          fontFamily={Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive'}
          fontStyle="italic"
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {text}
        </SvgText>
        <Animated.View style={{ position: 'absolute', opacity }}>
          <SvgText
            x="50%"
            y="50%"
            fontSize={fontSize}
            fontFamily={Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive'}
            fontStyle="italic"
            fill={color}
            textAnchor="middle"
            alignmentBaseline="middle"
            strokeDasharray="400"
            strokeDashoffset={strokeDashoffset}
          >
            {text}
          </SvgText>
        </Animated.View>
      </Svg>
    </Animated.View>
  );
};


const RomanticPinkTemplate = ({ eventData = {}, categorizedImages = {}, allowMessages = false, messageSettings = {}, isPlaying = false, onTogglePlay, playbackProgress = 0 }) => {
  const insets = useSafeAreaInsets();
  // additional_info가 문자열인지 객체인지 확인 및 파싱
  if (typeof eventData.additional_info === 'string') {
    try {
      eventData.additional_info = JSON.parse(eventData.additional_info);
    } catch (e) {
      eventData.additional_info = {};
    }
  }
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [galleryScrollIndex, setGalleryScrollIndex] = useState(0);
  const [activeAccountToggle, setActiveAccountToggle] = useState('groom');
  const [showDateAnimation, setShowDateAnimation] = useState(false);
  const [dateSectionY, setDateSectionY] = useState(0);
  const [randomGreeting, setRandomGreeting] = useState(null);
  const [mapCoord, setMapCoord] = useState(null);
  // isPlaying은 EventDisplayScreen에서 prop으로 전달 (없으면 로컬 state fallback)
  const [localPlaying, setLocalPlaying] = useState(false);
  const isMusicPlaying = onTogglePlay ? isPlaying : localPlaying;
  const handleTogglePlay = onTogglePlay ?? (() => setLocalPlaying(p => !p));

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(Array.from({ length: 15 }, () => new Animated.Value(1))).current;
  const slideAnims = useRef(Array.from({ length: 15 }, () => new Animated.Value(0))).current;
  
  // 신랑/신부 이름 애니메이션용
  const namesFadeAnim = useRef(new Animated.Value(1)).current;
  const namesScaleAnim = useRef(new Animated.Value(1)).current;
  const heartBeatAnim = useRef(new Animated.Value(1)).current;
  
  // 랜덤 인사말 선택
  useEffect(() => {
    if (!eventData.customMessage || eventData.customMessage.trim() === '') {
      const randomIndex = Math.floor(Math.random() * RANDOM_GREETINGS.length);
      setRandomGreeting(RANDOM_GREETINGS[randomIndex]);
    }
  }, [eventData.customMessage]);
  
  // 스크롤 위치 추적
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const screenHeight = Dimensions.get('window').height;
    
    if (dateSectionY > 0 && offsetY + (screenHeight * 0.7) > dateSectionY && !showDateAnimation) {
      setShowDateAnimation(true);
    }
  };
  
  // 날짜 섹션 위치 측정
  const onDateSectionLayout = (event) => {
    setDateSectionY(event.nativeEvent.layout.y);
  };
  
  // 실시간 카운트다운
  const getTimeString = (timeData) => {
    if (!timeData) return '12:00';
    
    if (timeData instanceof Date) {
      const hours = timeData.getHours().toString().padStart(2, '0');
      const minutes = timeData.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (typeof timeData === 'string') {
      return timeData;
    }
    
    return '12:00';
  };
  
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date || '2025-10-04', 
    getTimeString(eventData.ceremonyTime || eventData.ceremony_time)
  );
  
  // 카테고리별 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);

  // 신랑/신부 사진 유무 확인 (기본 이미지가 아닌 실제 업로드 사진)
  const hasGroomPhoto = categorizedImages?.groom?.length > 0 && typeof categorizedImages.groom[0] !== 'number';
  const hasBridePhoto = categorizedImages?.bride?.length > 0 && typeof categorizedImages.bride[0] !== 'number';
  const hasCouplePhotos = hasGroomPhoto || hasBridePhoto;

  useEffect(() => {
    // 하트 비트 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeatAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(heartBeatAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        })
      ])
    ).start();
  }, []);

  // 날짜 포맷팅
  const dateInfo = formatKoreanDate(eventData.date || eventData.event_date || '2025-10-04');
  
  // 시간 포맷팅
  const formatTimeData = (timeData) => {
    if (!timeData) return '오후 12:00';
    
    if (timeData instanceof Date) {
      const hours = timeData.getHours();
      const minutes = timeData.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? '오후' : '오전';
      const hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      return `${period} ${hour12}:${minutes}`;
    } else if (typeof timeData === 'string') {
      return formatKoreanTime(timeData);
    }
    
    return '오후 12:00';
  };
  
  const ceremonyTime = formatTimeData(eventData.ceremonyTime || eventData.ceremony_time);
  const receptionTime = formatTimeData(eventData.receptionTime || eventData.reception_time);
  
  // 영문 날짜 포맷팅
  const getEnglishDate = () => {
    const date = new Date(eventData.date || eventData.event_date || '2025-10-04');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // 영문 날짜 시간 포맷팅
  const getEnglishDateTime = () => {
    const date = new Date(eventData.date || eventData.event_date || '2025-10-04');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let hour12 = 12;
    let minutes = '00';
    let ampm = 'PM';
    
    const ceremonyTime = eventData.ceremonyTime || eventData.ceremony_time;
    
    if (ceremonyTime) {
      if (ceremonyTime instanceof Date) {
        const hours = ceremonyTime.getHours();
        minutes = ceremonyTime.getMinutes().toString().padStart(2, '0');
        hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        ampm = hours >= 12 ? 'PM' : 'AM';
      } else if (typeof ceremonyTime === 'string') {
        const timeParts = ceremonyTime.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0]);
          minutes = timeParts[1];
          hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
          ampm = hours >= 12 ? 'PM' : 'AM';
        }
      }
    }
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} | ${hour12}:${minutes} ${ampm}`;
  };

  const handleShare = async () => {
    try {
      const groomName = eventData.groomName || eventData.groom_name || '이민호';
      const brideName = eventData.brideName || eventData.bride_name || '배하윤';
      const dateStr = dateInfo.full;
      const timeStr = ceremonyTime;
      const location = eventData.location || '더 플라자 지스텀하우스 22층';
      
      // 템플릿 공유 로직 - 웹 링크로 이동
      const WEB_BASE_URL = 'https://contribution-web-srgt.vercel.app';
      const eventId = eventData.id || eventData.event_id || 'sample-event';
      const templateUrl = `${WEB_BASE_URL}/template/${eventId}?template=romantic`;
      
      
      await Share.share({
        message: `${groomName} ♥ ${brideName} 결혼식에 초대합니다!\n\n${dateStr} ${timeStr}\n${location}\n\n모바일 청첩장을 확인하세요:\n${templateUrl}`,
        title: '모바일 청첩장',
      });
    } catch (error) {
    }
  };

  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const handleAccountToggle = (type) => {
    setActiveAccountToggle(activeAccountToggle === type ? null : type);
  };

  const copyAccount = async (accountNumber) => {
    try {
      await Clipboard.setStringAsync(accountNumber);
      Alert.alert('복사 완료', '계좌번호가 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '복사에 실패했습니다.');
    }
  };

  const openMessageModal = () => {
    setShowMessageModal(true);
  };

  // 카카오 좌표 검색
  const KAKAO_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
  const locName = eventData.location || eventData.hallName || eventData.hall_name || '';
  const locAddr = eventData.detailedAddress || eventData.detailed_address || eventData.address || '';

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

  const handleNavigation = () => {
    const address = eventData.detailedAddress || eventData.detailed_address || '서울시 중구 소공로 119';
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`
    });
    Linking.openURL(url);
  };

  // 방명록 메시지 데이터
  const guestMessages = eventData.guestMessages || [
    {
      from: "민나",
      date: "2025.04.24 18:52",
      content: "하윤아❤️ 결혼을 진심으로 축하한다!\n민호 오빠랑 둘이 지금처럼 행복하게 백년해로 하기\n항상 웃음 가득한 하루하루 보내길 바랄게!\nHappy Wedding💜"
    },
    {
      from: "sooyeon",
      date: "2025.04.23 09:41",
      content: "결혼을 진심으로 축하드립니다💕\n사진도 청첩장도 너무 이쁘요!\n항상 서로를 응원하고 아껴주는 모습이 참 이쁜 커플입니다😊\n행복한 결혼 생활 되길 바래요"
    },
    {
      from: "지현",
      date: "2025.04.22 14:23",
      content: "하윤아 결혼 진심으로 축하해!\n웨딩스냅, 청첩장 모두 너무 예쁘다!💚\n남은 결혼식 준비도 잘 마무리하고!\n행복한 결혼생활 되기를 바래✨"
    }
  ];

  // 인사말 텍스트 결정
  let greetingMessage = '';
  if (eventData.customMessage) {
    if (typeof eventData.customMessage === 'object') {
      greetingMessage = eventData.customMessage.poem || '';
    } else if (typeof eventData.customMessage === 'string' && eventData.customMessage.trim() !== '') {
      greetingMessage = eventData.customMessage;
    } else {
      greetingMessage = randomGreeting;
    }
  } else {
    greetingMessage = randomGreeting;
  }

  // 신랑신부 영어 이름 생성
  const groomEnglishName = koreanToEnglish(eventData.groomName || eventData.groom_name || '이민호');
  const brideEnglishName = koreanToEnglish(eventData.brideName || eventData.bride_name || '배하윤');

  return (
    <View style={styles.romantic_container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5F2" />


      <ScrollView
        style={styles.romantic_scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* 인트로 섹션 — 뮤직 플레이어 카드 */}
        <View style={[styles.romantic_introSection]}>
          <View style={[styles.romantic_playerCard, { paddingTop: 20 + insets.top }]}>
            {/* 사진 */}
            <View style={styles.romantic_playerPhoto}>
              <MainPhotoSlideshow
                images={safeImages.main}
                style={{ width: '100%', height: '100%' }}
                onImagePress={handleImagePress}
                template="romantic"
              />
            </View>

            {/* 이름 */}
            <View style={styles.romantic_playerNames}>
              <Text style={styles.romantic_playerName}>
                {eventData.groomName || eventData.groom_name || '신랑'}
              </Text>
              <Animated.Text style={[styles.romantic_playerHeart, { transform: [{ scale: heartBeatAnim }] }]}>
                ♥
              </Animated.Text>
              <Text style={styles.romantic_playerName}>
                {eventData.brideName || eventData.bride_name || '신부'}
              </Text>
            </View>

            {/* 날짜 */}
            <Text style={styles.romantic_playerDate}>
              {dateInfo.year && `${dateInfo.year}.${String(dateInfo.month).padStart(2,'0')}.${String(dateInfo.day).padStart(2,'0')}`}
              {dateInfo.dayOfWeek && `  ${dateInfo.dayOfWeek}`}
              {ceremonyTime && `  ${ceremonyTime}`}
            </Text>

            {/* 프로그레스 바 */}
            <View style={styles.romantic_playerProgressWrap}>
              <View style={styles.romantic_playerProgressTrack}>
                <View style={[styles.romantic_playerProgressFill, { width: `${playbackProgress * 100}%` }]} />
                <View style={[styles.romantic_playerProgressDot, { left: `${playbackProgress * 100}%`, transform: [{ translateX: -5 }] }]} />
              </View>
            </View>

            {/* 컨트롤 버튼 */}
            <View style={styles.romantic_playerControls}>
              {/* 되감기 << */}
              <TouchableOpacity style={styles.romantic_playerBtn}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" stroke="#7A6058" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
              {/* 이전 |< */}
              <TouchableOpacity style={styles.romantic_playerBtn}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M19 20L9 12l10-8v16zM5 4v16" stroke="#7A6058" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
              {/* 재생/일시정지 */}
              <TouchableOpacity
                style={styles.romantic_playerPlayBtn}
                onPress={handleTogglePlay}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  {isMusicPlaying ? (
                    <>
                      <Rect x="6" y="5" width="4" height="14" rx="1" fill="#5A463E"/>
                      <Rect x="14" y="5" width="4" height="14" rx="1" fill="#5A463E"/>
                    </>
                  ) : (
                    <Path d="M8 5l11 7-11 7V5z" fill="#5A463E"/>
                  )}
                </Svg>
              </TouchableOpacity>
              {/* 다음 >| */}
              <TouchableOpacity style={styles.romantic_playerBtn}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 4l10 8-10 8V4zM19 4v16" stroke="#7A6058" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
              {/* 빨리감기 >> */}
              <TouchableOpacity style={styles.romantic_playerBtn}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M13 5l7 7-7 7M6 5l7 7-7 7" stroke="#7A6058" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 인사말 섹션 - 수정된 부분 */}
        <Animated.View style={[
          styles.romantic_greetingSection,
          {
            opacity: fadeAnims[1],
            transform: [{ translateY: slideAnims[1] }]
          }
        ]}>
          {/* 섹션 제목 추가 */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{
              fontSize: 28,
              fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
              fontStyle: 'italic',
              color: '#333',
              marginBottom: 8
            }}>
              Greeting
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#9B8D82',
              fontWeight: '300'
            }}>
              인사말
            </Text>
          </View>
          
          {greetingMessage && (
            <Text style={[
              styles.romantic_poem,
              { marginBottom: 15 }
            ]}>
              {greetingMessage}
            </Text>
          )}
          
          <View style={[styles.romantic_divider, { marginTop: 10, marginBottom: 35 }]} />
          
          {/* 신랑/신부 이름 - 애니메이션 적용 */}
          <Animated.View style={{
            opacity: namesFadeAnim,
            transform: [{ scale: namesScaleAnim }],
            alignItems: 'center',
            paddingVertical: 30,
            backgroundColor: 'rgba(252, 248, 245, 0.8)',
            width: '100%',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ alignItems: 'center', marginRight: 15 }}>
                <Text style={{
                  fontSize: 11,
                  color: '#C2B0A2',
                  letterSpacing: 2,
                  marginBottom: 5,
                  fontWeight: '300'
                }}>
                  GROOM
                </Text>
                <Text style={{
                  fontSize: 20,
                  color: '#333',
                  fontWeight: '600',
                  fontFamily: Platform.OS === 'ios' ? 'Noto Serif KR' : 'serif',
                }}>
                  {eventData.groomName || eventData.groom_name || '이민호'}
                </Text>
              </View>
              
              <Animated.Text style={{
                fontSize: 22,
                color: '#FFC0CB',
                marginHorizontal: 20,
                marginTop: 12,
                transform: [{ scale: heartBeatAnim }]
              }}>
                ♥
              </Animated.Text>
              
              <View style={{ alignItems: 'center', marginLeft: 15 }}>
                <Text style={{
                  fontSize: 11,
                  color: '#C2B0A2',
                  letterSpacing: 2,
                  marginBottom: 5,
                  fontWeight: '300'
                }}>
                  BRIDE
                </Text>
                <Text style={{
                  fontSize: 20,
                  color: '#333',
                  fontWeight: '600',
                  fontFamily: Platform.OS === 'ios' ? 'Noto Serif KR' : 'serif',
                }}>
                  {eventData.brideName || eventData.bride_name || '배하윤'}
                </Text>
              </View>
            </View>
            
            <View style={{
              marginTop: 15,
              paddingHorizontal: 30,
            }}>
              <Text style={{
                fontSize: 13,
                color: '#9B8D82',
                textAlign: 'center',
                fontStyle: 'italic',
                letterSpacing: 0.5,
              }}>
                두 사람이 하나되어 새로운 시작을 합니다
              </Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* 갤러리 섹션 */}
        <Animated.View style={[
          styles.romantic_gallerySection,
          {
            opacity: fadeAnims[2],
            transform: [{ translateY: slideAnims[2] }]
          }
        ]}>
          <Text style={styles.romantic_galleryTitle}>Our Gallery</Text>
          <Text style={styles.romantic_gallerySubtitle}>우리의 특별한 순간들</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.romantic_gallerySlider}
            pagingEnabled
            snapToInterval={width * 0.75 + 15}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width * 0.75 + 15));
              setGalleryScrollIndex(Math.min(newIndex, safeImages.gallery.length - 1));
            }}
          >
            {safeImages.gallery.map((image, index) => (
              <TouchableOpacity 
                key={index} 
                style={{
                  width: width * 0.75,
                  height: 350,
                  marginHorizontal: 7.5,
                  borderRadius: 15,
                  overflow: 'hidden',
                  backgroundColor: '#F0EBE6',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.08,
                  shadowRadius: 20,
                  elevation: 5,
                }}
                onPress={() => handleImagePress(safeImages.main.length + index)}
              >
                <Image 
                  source={image} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* 갤러리 인디케이터 */}
          <View style={styles.romantic_galleryDots}>
            {safeImages.gallery.slice(0, 6).map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.romantic_dot,
                  galleryScrollIndex === index && styles.romantic_dotActive
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Oct 4 2025 별도 섹션 */}
        <Animated.View 
          onLayout={onDateSectionLayout}
          style={[
            {
              paddingVertical: 80,
              backgroundColor: '#9B8D82',
              alignItems: 'center',
              justifyContent: 'center',
              height: 220,
            },
            {
              opacity: fadeAnims[3],
              transform: [{ translateY: slideAnims[3] }]
            }
          ]}
        >
          <LinearGradient
            colors={['#9B8D82', '#C2B0A2']}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ 
            height: 80, 
            width: '100%',
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            {!showDateAnimation ? (
              <Text style={{ 
                fontSize: 48, 
                color: 'transparent',
                fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
                fontStyle: 'italic'
              }}>
                {getEnglishDate()}
              </Text>
            ) : (
              <AnimatedSvgText 
                text={getEnglishDate()} 
                fontSize={48} 
                color="white"
              />
            )}
          </View>
        </Animated.View>

        {/* Wedding Day 섹션 */}
        <Animated.View style={[
          styles.romantic_weddingDaySection,
          {
            opacity: fadeAnims[4],
            transform: [{ translateY: slideAnims[4] }]
          }
        ]}>
          <Text style={styles.romantic_weddingDayTitle}>Wedding Day</Text>
          
          {/* 날짜 정보를 달력 위로 이동 */}
          <View style={styles.romantic_dateInfo}>
            <Text style={styles.romantic_dateMain}>{dateInfo.full}</Text>
            <Text style={styles.romantic_dateSub}>{getEnglishDateTime()}</Text>
          </View>
          
          {/* 달력 */}
          <RomanticPinkCalendar 
            targetDate={eventData.date || eventData.event_date || '2025-10-04'}
            style={{ marginTop: 30, marginBottom: 30 }}
          />
          
          {/* 카운트다운 */}
          <View style={styles.romantic_countdown}>
            <CountdownDisplay 
              timeLeft={timeLeft}
              style={styles.romantic_countdownGrid}
              textStyle={styles.romantic_countdownNumber}
              labelStyle={styles.romantic_countdownLabel}
              isExpired={timeLeft.isExpired}
            />
          </View>
          
          <Text style={styles.romantic_countdownMessage}>
            {eventData.groomName || eventData.groom_name || '민호'} 
            <Text style={styles.romantic_heartText}> ♥ </Text>
            {eventData.brideName || eventData.bride_name || '하윤'}의 결혼식이{' '}
            <Text style={styles.romantic_countdownDays}>{timeLeft.days}일</Text> 남았습니다
          </Text>
        </Animated.View>

        {/* 신랑신부 카드 - 사진이 있을 때만 */}
        {hasCouplePhotos && (
        <Animated.View style={[
          styles.romantic_coupleSection,
          {
            opacity: fadeAnims[5],
            transform: [{ translateY: slideAnims[5] }]
          }
        ]}>
          <LinearGradient
            colors={['#F8F5F2', '#F5F3F2']}
            style={StyleSheet.absoluteFill}
          />

          <Text style={styles.romantic_coupleTitle}>Meet the Couple</Text>

          <View style={styles.romantic_coupleCardsColumn}>
            {/* 신부 카드 */}
            {hasBridePhoto && (
            <View style={styles.romantic_coupleCardFull}>
              <View style={{ width: '100%', height: 200, marginBottom: 25 }}>
                <Image
                  source={safeImages.bride[0]}
                  style={{ width: '100%', height: '100%', borderRadius: 12 }}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.romantic_coupleRole}>신부</Text>
              <Text style={styles.romantic_coupleName}>{eventData.brideName || eventData.bride_name || ''}</Text>
              <Text style={styles.romantic_coupleEngName}>{brideEnglishName}</Text>
              <Text style={styles.romantic_coupleParents}>
                {eventData.brideFatherName || eventData.bride_father_name || ''} · {eventData.brideMotherName || eventData.bride_mother_name || ''}의 딸
              </Text>
            </View>
            )}

            {/* 신랑 카드 */}
            {hasGroomPhoto && (
            <View style={styles.romantic_coupleCardFull}>
              <View style={{ width: '100%', height: 200, marginBottom: 25 }}>
                <Image
                  source={safeImages.groom[0]}
                  style={{ width: '100%', height: '100%', borderRadius: 12 }}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.romantic_coupleRole}>신랑</Text>
              <Text style={styles.romantic_coupleName}>{eventData.groomName || eventData.groom_name || ''}</Text>
              <Text style={styles.romantic_coupleEngName}>{groomEnglishName}</Text>
              <Text style={styles.romantic_coupleParents}>
                {eventData.groomFatherName || eventData.groom_father_name || ''} · {eventData.groomMotherName || eventData.groom_mother_name || ''}의 아들
              </Text>
            </View>
            )}
          </View>
        </Animated.View>
        )}

        {/* 방명록 메시지 섹션 */}
        {allowMessages && (
          <Animated.View style={[
            styles.romantic_messagesSection,
            {
              opacity: fadeAnims[6],
              transform: [{ translateY: slideAnims[6] }]
            }
          ]}>
            <LinearGradient
              colors={['#F8F5F2', '#F3EFEC']}
              style={StyleSheet.absoluteFill}
            />
            
            <Text style={styles.romantic_messagesTitle}>Messages</Text>
            <Text style={styles.romantic_messagesSubtitle}>
              {messageSettings?.placeholder || '저희 둘에게 따뜻한 방명록을 남겨주세요'}
            </Text>
            
            <GuestBookMessages 
              messages={guestMessages}
              onAddMessage={openMessageModal}
            />
          </Animated.View>
        )}

        {/* 오시는 길 */}
        <Animated.View style={[
          styles.romantic_locationSection,
          {
            opacity: fadeAnims[7],
            transform: [{ translateY: slideAnims[7] }]
          }
        ]}>
          <Text style={styles.romantic_locationTitle}>Location</Text>
          <View style={styles.romantic_venueInfo}>
            <Text style={styles.romantic_venueName}>
              {eventData.location || '더 플라자 지스텀하우스 22층'}
            </Text>
            <Text style={styles.romantic_venueAddress}>
              {eventData.detailedAddress || eventData.detailed_address || '서울시 중구 소공로 119'}
            </Text>
          </View>
          
          {mapCoord ? (
            <View style={styles.romantic_mapContainerReal}>
              <WebView
                source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                javaScriptEnabled
                originWhitelist={['*']}
              />
            </View>
          ) : (locAddr || locName) ? (
            <View style={styles.romantic_mapContainer}>
              <Text style={{ fontSize: 14, color: '#999' }}>지도를 불러오는 중...</Text>
            </View>
          ) : null}
          
          <View style={styles.romantic_transportCard}>
            <View style={styles.romantic_transportIcon}>
              <Text>🅿️</Text>
            </View>
            <View style={styles.romantic_transportContent}>
              <Text style={styles.romantic_transportTitle}>주차 안내</Text>
              <Text style={styles.romantic_transportText}>
                {eventData.parkingInfo || eventData.parking_info || 
                 '더 플라자 호텔 주차장 이용\n하객 3시간 무료 주차\n주차 요원의 안내를 받아주세요'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.romantic_navigationButton} onPress={handleNavigation}>
            <Ionicons name="navigate" size={20} color="white" />
            <Text style={styles.romantic_navigationText}>길찾기</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 축하금 안내 섹션 - 웹 버전 스타일 적용 */}
        <Animated.View style={[
          styles.romantic_giftSection,
          {
            opacity: fadeAnims[8],
            transform: [{ translateY: slideAnims[8] }]
          }
        ]}>
          <View style={styles.romantic_giftHeader}>
            <Text style={styles.romantic_giftTitle}>축의금 전달</Text>
            <Text style={styles.romantic_giftSubtitle}>따뜻한 마음을 함께 나누어주세요</Text>
          </View>
          
          <View style={styles.romantic_giftDescription}>
            <Text style={styles.romantic_giftDescriptionText}>
              축복의 마음을 담은 소중한 마음,{'\n'}
              이렇게 전할 수 있어요
            </Text>
          </View>

          {/* 토글 버튼 */}
          <View style={styles.romantic_toggleContainer}>
            <View style={styles.romantic_toggleButtons}>
              <TouchableOpacity 
                style={[
                  styles.romantic_toggleButton, 
                  activeAccountToggle === 'groom' && styles.romantic_toggleButtonActive
                ]}
                onPress={() => handleAccountToggle('groom')}
              >
                <Text style={[
                  styles.romantic_toggleButtonText,
                  activeAccountToggle === 'groom' && styles.romantic_toggleButtonTextActive
                ]}>신랑측</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.romantic_toggleButton, 
                  activeAccountToggle === 'bride' && styles.romantic_toggleButtonActive
                ]}
                onPress={() => handleAccountToggle('bride')}
              >
                <Text style={[
                  styles.romantic_toggleButtonText,
                  activeAccountToggle === 'bride' && styles.romantic_toggleButtonTextActive
                ]}>신부측</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.romantic_accountsContainer}>
            {/* 신랑측 계좌 */}
            {activeAccountToggle === 'groom' && (eventData.additional_info?.groom_account_number || 
              eventData.additional_info?.groom_father_account_number || 
              eventData.additional_info?.groom_mother_account_number) && (
              <View style={styles.romantic_accountGroup}>
                <View style={styles.romantic_accountCards}>
                  {eventData.additional_info?.groom_account_number && (
                    <TouchableOpacity 
                      style={styles.romantic_accountCard}
                      onPress={() => copyAccount(eventData.additional_info.groom_account_number)}
                    >
                      <View style={styles.romantic_accountInfo}>
                        <Text style={styles.romantic_accountName}>
                          {eventData.groomName || eventData.groom_name || '신랑'}
                        </Text>
                        <View style={styles.romantic_bankInfo}>
                          <Text style={styles.romantic_bankName}>{eventData.additional_info.groom_bank_name || '은행'}</Text>
                          <Text style={styles.romantic_accountNumber}>{eventData.additional_info.groom_account_number}</Text>
                        </View>
                      </View>
                      <View style={styles.romantic_copyButton}>
                        <Text style={styles.romantic_copyIcon}>복사</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {eventData.additional_info?.groom_father_account_number && (
                    <TouchableOpacity 
                      style={styles.romantic_accountCard}
                      onPress={() => copyAccount(eventData.additional_info.groom_father_account_number)}
                    >
                      <View style={styles.romantic_accountInfo}>
                        <Text style={styles.romantic_accountName}>
                          {eventData.groomFatherName || eventData.groom_father_name || '신랑'} 아버님
                        </Text>
                        <View style={styles.romantic_bankInfo}>
                          <Text style={styles.romantic_bankName}>{eventData.additional_info.groom_father_bank_name || '은행'}</Text>
                          <Text style={styles.romantic_accountNumber}>{eventData.additional_info.groom_father_account_number}</Text>
                        </View>
                      </View>
                      <View style={styles.romantic_copyButton}>
                        <Text style={styles.romantic_copyIcon}>복사</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {eventData.additional_info?.groom_mother_account_number && (
                    <TouchableOpacity 
                      style={styles.romantic_accountCard}
                      onPress={() => copyAccount(eventData.additional_info.groom_mother_account_number)}
                    >
                      <View style={styles.romantic_accountInfo}>
                        <Text style={styles.romantic_accountName}>
                          {eventData.groomMotherName || eventData.groom_mother_name || '신랑'} 어머님
                        </Text>
                        <View style={styles.romantic_bankInfo}>
                          <Text style={styles.romantic_bankName}>{eventData.additional_info.groom_mother_bank_name || '은행'}</Text>
                          <Text style={styles.romantic_accountNumber}>{eventData.additional_info.groom_mother_account_number}</Text>
                        </View>
                      </View>
                      <View style={styles.romantic_copyButton}>
                        <Text style={styles.romantic_copyIcon}>복사</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            
            {/* 신부측 계좌 */}
            {activeAccountToggle === 'bride' && (eventData.additional_info?.bride_account_number || 
              eventData.additional_info?.bride_father_account_number || 
              eventData.additional_info?.bride_mother_account_number) && (
              <View style={styles.romantic_accountGroup}>
                <View style={styles.romantic_accountCards}>
                  {eventData.additional_info?.bride_account_number && (
                    <TouchableOpacity 
                      style={styles.romantic_accountCard}
                      onPress={() => copyAccount(eventData.additional_info.bride_account_number)}
                    >
                      <View style={styles.romantic_accountInfo}>
                        <Text style={styles.romantic_accountName}>
                          {eventData.brideName || eventData.bride_name || '신부'}
                        </Text>
                        <View style={styles.romantic_bankInfo}>
                          <Text style={styles.romantic_bankName}>{eventData.additional_info.bride_bank_name || '은행'}</Text>
                          <Text style={styles.romantic_accountNumber}>{eventData.additional_info.bride_account_number}</Text>
                        </View>
                      </View>
                      <View style={styles.romantic_copyButton}>
                        <Text style={styles.romantic_copyIcon}>복사</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {eventData.additional_info?.bride_father_account_number && (
                    <TouchableOpacity 
                      style={styles.romantic_accountCard}
                      onPress={() => copyAccount(eventData.additional_info.bride_father_account_number)}
                    >
                      <View style={styles.romantic_accountInfo}>
                        <Text style={styles.romantic_accountName}>
                          {eventData.brideFatherName || eventData.bride_father_name || '신부'} 아버님
                        </Text>
                        <View style={styles.romantic_bankInfo}>
                          <Text style={styles.romantic_bankName}>{eventData.additional_info.bride_father_bank_name || '은행'}</Text>
                          <Text style={styles.romantic_accountNumber}>{eventData.additional_info.bride_father_account_number}</Text>
                        </View>
                      </View>
                      <View style={styles.romantic_copyButton}>
                        <Text style={styles.romantic_copyIcon}>복사</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {eventData.additional_info?.bride_mother_account_number && (
                    <TouchableOpacity 
                      style={styles.romantic_accountCard}
                      onPress={() => copyAccount(eventData.additional_info.bride_mother_account_number)}
                    >
                      <View style={styles.romantic_accountInfo}>
                        <Text style={styles.romantic_accountName}>
                          {eventData.brideMotherName || eventData.bride_mother_name || '신부'} 어머님
                        </Text>
                        <View style={styles.romantic_bankInfo}>
                          <Text style={styles.romantic_bankName}>{eventData.additional_info.bride_mother_bank_name || '은행'}</Text>
                          <Text style={styles.romantic_accountNumber}>{eventData.additional_info.bride_mother_account_number}</Text>
                        </View>
                      </View>
                      <View style={styles.romantic_copyButton}>
                        <Text style={styles.romantic_copyIcon}>복사</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* 공유 섹션 */}
        <Animated.View style={[
          styles.romantic_shareSection,
          {
            opacity: fadeAnims[9],
            transform: [{ translateY: slideAnims[9] }]
          }
        ]}>
          <TouchableOpacity style={styles.romantic_shareButton} onPress={handleShare}>
            <LinearGradient
              colors={['#C2B0A2', '#9B8D82']}
              style={styles.romantic_shareButtonGradient}
            >
              <Ionicons name="share-social" size={24} color="white" />
              <Text style={styles.romantic_shareButtonText}>청첩장 공유하기</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* 푸터 */}
        <Animated.View style={[
          styles.romantic_footerSection,
          {
            opacity: fadeAnims[10],
            transform: [{ translateY: slideAnims[10] }]
          }
        ]}>
          <LinearGradient
            colors={['#9B8D82', '#C2B0A2']}
            style={StyleSheet.absoluteFill}
          />
          
          <Text style={styles.romantic_footerTitle}>Thank You</Text>
          <View style={styles.romantic_footerDivider} />
          <Text style={styles.romantic_footerMessage}>
            저희의 새로운 시작을 축복해주셔서{'\n'}
            진심으로 감사드립니다
          </Text>
        </Animated.View>
      </ScrollView>

      {/* 이미지 뷰어 */}
      <ImageViewer 
        visible={showImageViewer}
        images={[...safeImages.main, ...safeImages.gallery]}
        currentIndex={currentImageIndex}
        onClose={() => setShowImageViewer(false)}
        onIndexChange={setCurrentImageIndex}
      />

      {/* 메시지 작성 모달 */}
      <Modal
        visible={showMessageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.romantic_modalOverlay}>
          <View style={styles.romantic_modalContent}>
            <Text style={styles.romantic_modalTitle}>축하 메시지 남기기</Text>
            <TouchableOpacity 
              style={styles.romantic_modalClose}
              onPress={() => setShowMessageModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RomanticPinkTemplate;