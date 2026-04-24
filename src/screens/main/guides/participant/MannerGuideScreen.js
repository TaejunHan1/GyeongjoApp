// src/screens/main/guides/participant/MannerGuideScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { TC, PressableCard, StaggerItem, Bubble, ScreenHeader, SectionLabel } from '../tossStyle';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 토스 스타일 컬러
const TossColors = {
  primary: '#0064FF',
  primaryLight: '#E6F0FF',
  background: '#FFFFFF',
  surface: '#F7F8FA',
  text: {
    primary: '#191F28',
    secondary: '#8B95A1',
    tertiary: '#B0B8C1',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F2F4F6',
    200: '#E5E8EB',
    300: '#D1D6DB',
    400: '#B0B8C1',
    500: '#8B95A1',
    600: '#6B7684',
    700: '#4E5968',
    800: '#333D4B',
    900: '#191F28',
  },
  border: '#F2F3F5',
  success: '#00C896',
  error: '#FF5A5F',
  warning: '#FFB800',
};

export default function MannerGuideScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('wedding');
  const [selectedGender, setSelectedGender] = useState('male');
  const [expandedCategory, setExpandedCategory] = useState(null);

  // quickTips 페이드 로테이션 (4초마다 교체)
  const [tipIndex, setTipIndex] = useState(0);
  const tipOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(tipOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => setTipIndex((i) => i + 1), 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 탭·성별 바뀔 때 인덱스 리셋
  useEffect(() => {
    setTipIndex(0);
  }, [selectedTab, selectedGender]);

  // 세그먼트 컨트롤 슬라이딩 애니메이션 (실제 pixel 폭 측정)
  const segAnim = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    Animated.spring(segAnim, {
      toValue: selectedTab === 'wedding' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 6,
      speed: 20,
    }).start();
  }, [selectedTab]);

  // 결혼식 복장 가이드 (2026 트렌드 반영)
  const weddingDressCode = {
    male: {
      quickTips: [
        '세미수트가 기본이에요',
        '네이비·베이지·파스텔 톤이 인기',
        '2026 트렌드는 노타이 캐주얼',
        '포켓치프로 포인트 주기',
        '겨울엔 브라운·차콜 추천',
        '무채색 톤으로 맞추기',
      ],
      recommended: [
        {
          item: '재킷·블레이저',
          detail: '네이비·베이지·그레이 · 겨울엔 브라운·차콜',
          icon: '🧥',
          color: TossColors.primary,
        },
        {
          item: '셔츠·니트',
          detail: '화이트 셔츠 기본 · 겨울엔 자켓+니트+슬랙스 OK',
          icon: '👕',
          color: '#4A88FF',
        },
        {
          item: '슬랙스',
          detail: '면·울 소재 · 차분한 무채색 (재킷과 톤 맞춤)',
          icon: '👖',
          color: '#6B7684',
        },
        {
          item: '신발·양말',
          detail: '로퍼·드레스슈즈 · 무채색 슬림 스니커즈 (캐주얼 웨딩 한정)',
          icon: '👞',
          color: '#333D4B',
        },
        {
          item: '넥타이 (선택)',
          detail: '노타이 추세 · 하지만 포켓치프·패턴넥타이로 포인트',
          icon: '👔',
          color: '#4E5968',
        },
      ],
      avoid: [
        { item: '화이트·아이보리·밝은 베이지', reason: '신랑과 구분 안 됨' },
        { item: '청바지·트레이닝복', reason: '격식 X (2026 공통 금기)' },
        { item: '슬리퍼·운동화 (일반 예식장)', reason: '호텔·일반 웨딩홀엔 부적절' },
        { item: '반바지·민소매', reason: '과도한 노출' },
        { item: '너무 화려한 패턴', reason: '신랑보다 튀면 실례' },
      ],
    },
    female: {
      quickTips: [
        '무릎선 아래 길이가 기본',
        '네이비·톤다운 핑크가 무난해요',
        '흰색·아이보리는 절대 금지',
        '7cm 이하 힐이 편안해요',
        '진주 액세서리가 포인트',
        '반묶음·리본으로 깔끔하게',
      ],
      recommended: [
        {
          item: '원피스',
          detail: '무릎선 아래 · 검정·네이비·톤다운 핑크·퍼플',
          icon: '👗',
          color: '#F472B6',
        },
        {
          item: '블라우스 세트',
          detail: '블라우스+스커트 or 슬랙스 (포멀한데 편안)',
          icon: '👚',
          color: '#6B7684',
        },
        {
          item: '스타킹',
          detail: '살색·무광 (짙은 컬러 원피스엔 검정 가능)',
          icon: '🩰',
          color: '#8B95A1',
        },
        {
          item: '신발',
          detail: '낮은 힐·플랫·블록힐 (7cm 이하 · 편안함 우선)',
          icon: '👠',
          color: '#FF5A5F',
        },
        {
          item: '액세서리·헤어',
          detail: '진주·작은 드롭 귀걸이 · 반묶음+리본 포인트',
          icon: '💍',
          color: '#FFB800',
        },
      ],
      avoid: [
        { item: '흰색·아이보리·밝은 베이지', reason: '신부 드레스와 겹침 (가장 큰 금기)' },
        { item: '페일 핑크·누드톤', reason: '들러리 색상과 혼동' },
        { item: '전신 검은색', reason: '장례식 분위기' },
        { item: '과한 노출 (미니·딥넥)', reason: '격식 X' },
        { item: '너무 큰 다이아·화려한 액세', reason: '신부보다 튀면 실례' },
        { item: '두꺼운 패딩 (겨울)', reason: '단정한 코트 권장' },
      ],
    },
  };

  // 장례식 복장 가이드 (2026 기준)
  const funeralDressCode = {
    male: {
      quickTips: [
        '검정 정장이 기본이에요',
        '흰 셔츠 + 검정 넥타이',
        '네이비·차콜도 허용돼요',
        '흰 양말은 절대 금지',
        '코트는 입장 전에 벗기',
        '여름엔 반팔도 가능해요',
      ],
      recommended: [
        {
          item: '정장·재킷',
          detail: '검정 기본 · 네이비·차콜도 허용',
          icon: '🖤',
          color: '#191F28',
        },
        {
          item: '셔츠',
          detail: '흰색 단색 (무늬 없음) · 여름 반팔도 단정하면 허용',
          icon: '👕',
          color: '#8B95A1',
        },
        {
          item: '넥타이',
          detail: '검정 or 짙은 무채색 (흰색 X · 과도한 무늬 X)',
          icon: '👔',
          color: '#191F28',
        },
        {
          item: '신발·양말',
          detail: '검정 구두·로퍼 + 검정 양말 (흰 양말 절대 X)',
          icon: '👞',
          color: '#333D4B',
        },
        {
          item: '코트',
          detail: '입장 전 반드시 벗기 · 검정·회색 무채색',
          icon: '🧥',
          color: '#4E5968',
        },
      ],
      avoid: [
        { item: '밝은 색 옷·화려한 셔츠', reason: '애도 분위기에 부적절' },
        { item: '흰 넥타이·원색 넥타이', reason: '결혼식용 · 조문엔 X' },
        { item: '청바지·트레이닝·반바지', reason: '격식 X' },
        { item: '큰 시계·팔찌·과한 액세서리', reason: '조용한 분위기 방해' },
        { item: '진한 향수·화장', reason: '좁은 빈소에서 실례' },
      ],
    },
    female: {
      quickTips: [
        '검정 원피스·정장이 정석',
        '스타킹은 반드시 검정 무광',
        '여름에도 맨다리는 실례예요',
        '진주 액세서리만 허용',
        '짙은 네이비·차콜도 가능',
        '가방도 검정으로 맞추기',
      ],
      recommended: [
        {
          item: '원피스·정장',
          detail: '검정 기본 · 무늬 없는 단색 · 네이비·차콜 허용',
          icon: '🖤',
          color: '#191F28',
        },
        {
          item: '블라우스+스커트',
          detail: '흰·검정 블라우스 + 검정 스커트 or 바지',
          icon: '👚',
          color: '#6B7684',
        },
        {
          item: '스타킹 (필수)',
          detail: '검정 무광 · 맨다리는 실례 · 여름에도 필수',
          icon: '🩰',
          color: '#4E5968',
        },
        {
          item: '신발',
          detail: '검정 플랫·낮은 굽 · 오픈토·반짝이 X',
          icon: '👠',
          color: '#333D4B',
        },
        {
          item: '액세서리',
          detail: '진주 목걸이·귀걸이 OK · 그 외 최소한으로',
          icon: '⚪',
          color: '#8B95A1',
        },
      ],
      avoid: [
        { item: '밝은 색·화려한 패턴', reason: '애도 분위기 해침' },
        { item: '미니 스커트·딥넥', reason: '과한 노출 X' },
        { item: '맨다리·망사 스타킹', reason: '반드시 검정 무광 필요' },
        { item: '큰 귀걸이·팔찌', reason: '소리·화려함 우려' },
        { item: '진한 화장·네일·향수', reason: '차분한 분위기 필요' },
        { item: '컬러풀한 가방', reason: '검정·짙은 무채색 권장' },
      ],
    },
  };

  // 매너 가이드
  const mannerGuides = {
    wedding: [
      {
        id: 'time',
        category: '시간 매너',
        icon: 'time-outline',
        color: TossColors.primary,
        tips: [
          '예식 15-30분 전 도착하기',
          '축의금은 입장 시 접수대에서',
          '식사 후 바로 떠나지 말고 잠시 인사',
          '늦게 도착하면 조용히 뒷자리로',
        ]
      },
      {
        id: 'photo',
        category: '사진 매너',
        icon: 'camera-outline',
        color: '#FF69B4',
        tips: [
          '플래시 끄고 무음 촬영',
          '신랑신부 입장 시 통로 비키기',
          '예식 중 자리 이탈 금지',
          '전문 사진사 방해 금지',
        ]
      },
      {
        id: 'talk',
        category: '축하 인사',
        icon: 'chatbubble-outline',
        color: '#00C896',
        tips: [
          '"축하합니다" 짧고 진심있게',
          '신랑신부 오래 붙잡지 않기',
          '양가 부모님께도 인사드리기',
          '개인적 이야기는 나중에',
        ]
      },
    ],
    funeral: [
      {
        id: 'condolence',
        category: '조문 예절',
        icon: 'flower-outline',
        color: '#4E5968',
        tips: [
          '조용히 입장하여 분향/헌화',
          '"삼가 고인의 명복을 빕니다"',
          '상주에게는 짧은 위로 인사',
          '조의금은 접수처에 전달',
        ]
      },
      {
        id: 'behavior',
        category: '행동 예절',
        icon: 'volume-mute-outline',
        color: '#6B7684',
        tips: [
          '휴대폰 무음 설정 필수',
          '낮은 목소리로 대화',
          '10-15분 정도만 머물기',
          '음식은 정중히 사양',
        ]
      },
      {
        id: 'avoid',
        category: '금기 사항',
        icon: 'close-circle-outline',
        color: TossColors.error,
        tips: [
          '사인 묻지 않기',
          '"힘내세요"보다 "함께 하겠습니다"',
          '웃음소리 절대 금지',
          '사진 촬영 절대 불가',
        ]
      },
    ]
  };

  const renderDressGuide = () => {
    const currentGuide = selectedTab === 'wedding' ? weddingDressCode : funeralDressCode;
    const genderGuide = currentGuide[selectedGender];

    return (
      <View style={styles.dressSection}>
        {/* 성별 선택 - 토스 스타일 세그먼트 */}
        <View style={styles.genderSelector}>
          <TouchableOpacity
            style={[styles.genderTab, selectedGender === 'male' && styles.genderTabActive]}
            onPress={() => setSelectedGender('male')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="man" 
              size={18} 
              color={selectedGender === 'male' ? TossColors.primary : TossColors.gray[400]} 
            />
            <Text style={[styles.genderTabText, selectedGender === 'male' && styles.genderTabTextActive]}>
              남성
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderTab, selectedGender === 'female' && styles.genderTabActive]}
            onPress={() => setSelectedGender('female')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="woman" 
              size={18} 
              color={selectedGender === 'female' ? TossColors.primary : TossColors.gray[400]} 
            />
            <Text style={[styles.genderTabText, selectedGender === 'female' && styles.genderTabTextActive]}>
              여성
            </Text>
          </TouchableOpacity>
        </View>

        {/* 한 줄 요약 - 페이드 로테이션 */}
        <View style={styles.quickTipCard}>
          <View style={styles.quickTipIcon}>
            <Ionicons name="bulb-outline" size={20} color={TossColors.warning} />
          </View>
          <Animated.Text style={[styles.quickTipText, { opacity: tipOpacity }]}>
            {genderGuide.quickTips[tipIndex % genderGuide.quickTips.length]}
          </Animated.Text>
        </View>

        {/* 추천 복장 - 토스 스타일 카드 */}
        <View style={styles.recommendSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="checkmark-circle" size={20} color={TossColors.success} />
            </View>
            <Text style={styles.sectionTitle}>추천 복장</Text>
          </View>
          <View style={styles.dressGrid}>
            {genderGuide.recommended.map((item, index) => (
              <View key={index} style={styles.dressCard}>
                <TouchableOpacity 
                  style={styles.dressCardInner}
                  activeOpacity={0.8}
                >
                  <View style={[styles.dressCardIcon, { backgroundColor: item.color + '15' }]}>
                    <Text style={styles.dressEmoji}>{item.icon}</Text>
                  </View>
                  <Text style={styles.dressCardTitle}>{item.item}</Text>
                  <Text style={styles.dressCardDetail}>{item.detail}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 피해야 할 복장 - 토스 스타일 리스트 */}
        <View style={styles.avoidSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: TossColors.error + '15' }]}>
              <Ionicons name="close-circle" size={20} color={TossColors.error} />
            </View>
            <Text style={styles.sectionTitle}>피해야 할 복장</Text>
          </View>
          <View style={styles.avoidList}>
            {genderGuide.avoid.map((item, index) => (
              <View key={index} style={[styles.avoidItem, index === genderGuide.avoid.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.avoidItemLeft}>
                  <View style={styles.avoidIconContainer}>
                    <Text style={styles.avoidIcon}>⚠️</Text>
                  </View>
                  <View style={styles.avoidContent}>
                    <Text style={styles.avoidItemText}>{item.item}</Text>
                    <Text style={styles.avoidItemReason}>{item.reason}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderMannerGuide = () => {
    const currentManner = mannerGuides[selectedTab];

    return (
      <View style={styles.mannerSection}>
        {currentManner.map((guide) => (
          <TouchableOpacity
            key={guide.id}
            style={styles.mannerCard}
            onPress={() => setExpandedCategory(expandedCategory === guide.id ? null : guide.id)}
            activeOpacity={0.7}
          >
            <View style={styles.mannerHeader}>
              <View style={styles.mannerHeaderLeft}>
                <View style={[styles.mannerIconContainer, { backgroundColor: guide.color + '15' }]}>
                  <Ionicons name={guide.icon} size={20} color={guide.color} />
                </View>
                <Text style={styles.mannerTitle}>{guide.category}</Text>
              </View>
              <Ionicons 
                name={expandedCategory === guide.id ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={TossColors.gray[400]} 
              />
            </View>
            {expandedCategory === guide.id && (
              <View style={styles.mannerContent}>
                {guide.tips.map((tip, tipIndex) => (
                  <View key={tipIndex} style={styles.mannerTip}>
                    <Text style={styles.tipNumber}>{tipIndex + 1}</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <StaggerItem delay={0}>
          <ScreenHeader
            onBack={() => navigation.goBack()}
            eyebrow="복장·매너 가이드"
            title="어떤 자리에 가시나요?"
            subtitle="자리에 맞는 복장과 매너를 알려드려요"
          />
        </StaggerItem>

        {/* 자리 선택 - 토스 스타일 세그먼트 컨트롤 */}
        <StaggerItem delay={80}>
          <View style={tossSeg.wrap}>
            <View
              style={tossSeg.track}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            >
              <Animated.View
                style={[
                  tossSeg.thumb,
                  {
                    width: trackWidth > 0 ? (trackWidth - 8) / 2 : '50%',
                    transform: [
                      {
                        translateX: segAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.max(0, (trackWidth - 8) / 2)],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <TouchableOpacity
                style={tossSeg.btn}
                activeOpacity={0.7}
                onPress={() => setSelectedTab('wedding')}
              >
                <Text
                  style={[
                    tossSeg.label,
                    selectedTab === 'wedding' && tossSeg.labelActive,
                  ]}
                >
                  결혼식
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tossSeg.btn}
                activeOpacity={0.7}
                onPress={() => setSelectedTab('funeral')}
              >
                <Text
                  style={[
                    tossSeg.label,
                    selectedTab === 'funeral' && tossSeg.labelActive,
                  ]}
                >
                  장례식
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </StaggerItem>

        {/* 복장 가이드 */}
        <StaggerItem delay={140}>
          <SectionLabel>복장 가이드</SectionLabel>
          {renderDressGuide()}
        </StaggerItem>

        {/* 매너 가이드 */}
        <StaggerItem delay={220}>
          <SectionLabel>행동 매너</SectionLabel>
          {renderMannerGuide()}
        </StaggerItem>

        {/* 하단 팁 카드 */}
        <StaggerItem delay={300}>
          <View style={tossTip.card}>
            <View style={tossTip.head}>
              <View style={tossTip.iconWrap}>
                <Ionicons name="information-circle" size={14} color={TC.blue} />
              </View>
              <Text style={tossTip.label}>알아두면 좋아요</Text>
            </View>
            <Text style={tossTip.text}>
              {selectedTab === 'wedding'
                ? '결혼식은 신랑신부의 새로운 시작을 축하하는 자리예요. 밝고 단정한 복장으로 기쁜 마음을 표현해 주세요.'
                : '장례식은 고인을 추모하는 엄숙한 자리예요. 검은색 복장으로 애도의 마음을 표현해 주세요.'}
            </Text>
          </View>
        </StaggerItem>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const tossSeg = StyleSheet.create({
  wrap: { paddingHorizontal: 20, marginBottom: 12 },
  track: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
    height: 48,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B95A1',
    letterSpacing: -0.2,
  },
  labelActive: {
    color: '#191F28',
    fontWeight: '700',
  },
});

const tossTip = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    backgroundColor: TC.blueSoft,
    borderRadius: 14,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TC.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '700', color: TC.blue, letterSpacing: -0.2 },
  text: { fontSize: 13, color: TC.ink, lineHeight: 20, letterSpacing: -0.2 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TossColors.background,
  },
  
  // 헤더 - 토스 스타일
  header: {
    height: Platform.OS === 'ios' ? 100 : 70, // iOS는 상태바 포함하여 더 높게
    flexDirection: 'row',
    alignItems: 'flex-end', // 하단 정렬로 변경
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12, // 하단 여백
    backgroundColor: TossColors.background,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 헤더 - 단순한 뒤로가기 버튼만
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: TossColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  
  // 탭 - 토스 스타일 개선
  tabContainer: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: TossColors.gray[50],
    marginHorizontal: -20,
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: TossColors.background,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  tabActive: {
    backgroundColor: TossColors.primary,
    borderColor: TossColors.primary,
    shadowColor: TossColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  tabTextActive: {
    color: TossColors.background,
    fontWeight: '700',
  },
  
  // 가이드 섹션
  guideSection: {
    paddingTop: 24,
  },
  guideSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text.primary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  
  // 복장 가이드
  dressSection: {
    gap: 16,
  },
  
  // 성별 선택 - 토스 스타일
  genderSelector: {
    flexDirection: 'row',
    backgroundColor: TossColors.gray[100],
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  genderTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  genderTabActive: {
    backgroundColor: TossColors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  genderTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: TossColors.gray[500],
    letterSpacing: -0.2,
  },
  genderTabTextActive: {
    color: TossColors.primary,
    fontWeight: '600',
  },
  
  // 한 줄 요약 - 토스 스타일
  quickTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TossColors.warning + '10',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  quickTipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TossColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickTipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
  },
  
  // 추천 복장 섹션
  recommendSection: {
    backgroundColor: TossColors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TossColors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  
  // 드레스 그리드 - 토스 스타일 (반응형)
  dressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6, // gap 보정
  },
  dressCard: {
    width: '50%', // 화면 너비의 50%
    paddingHorizontal: 6, // gap 역할
    marginBottom: 12,
  },
  dressCardInner: {
    backgroundColor: TossColors.gray[50],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    height: 140, // 고정 높이로 정렬 맞춤
  },
  dressCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dressEmoji: {
    fontSize: 24,
  },
  dressCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  dressCardDetail: {
    fontSize: 12,
    color: TossColors.text.secondary,
    textAlign: 'center',
    letterSpacing: -0.1,
    lineHeight: 16,
  },
  
  // 피해야 할 복장 - 토스 스타일 개선
  avoidSection: {
    backgroundColor: TossColors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  avoidList: {
    gap: 0,
  },
  avoidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.gray[100],
  },
  avoidItemLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  avoidIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TossColors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avoidIcon: {
    fontSize: 16,
  },
  avoidContent: {
    flex: 1,
  },
  avoidItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: TossColors.text.primary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  avoidItemReason: {
    fontSize: 13,
    color: TossColors.text.secondary,
    letterSpacing: -0.1,
  },
  
  // 매너 가이드 - 토스 스타일
  mannerSection: {
    gap: 12,
  },
  mannerCard: {
    backgroundColor: TossColors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  mannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mannerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mannerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  mannerContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: TossColors.border,
    gap: 12,
  },
  mannerTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TossColors.primary + '15',
    color: TossColors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: TossColors.text.secondary,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  
  // 하단 팁 카드 - 토스 스타일
  bottomTipCard: {
    margin: 20,
    backgroundColor: TossColors.primaryLight,
    borderRadius: 16,
    padding: 20,
  },
  bottomTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bottomTipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TossColors.primary,
    letterSpacing: -0.2,
  },
  bottomTipText: {
    fontSize: 14,
    color: TossColors.primary,
    lineHeight: 20,
    letterSpacing: -0.2,
    opacity: 0.8,
  },
});