// src/screens/main/guides/participant/MannerGuideScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
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

  // 결혼식 복장 가이드
  const weddingDressCode = {
    male: {
      quickTip: '깔끔한 블레이저 + 셔츠/니트 + 슬랙스 (현대적이고 편안한 포멀)',
      recommended: [
        { 
          item: '블레이저/재킷', 
          detail: '네이비, 베이지, 그레이',
          icon: '🧥', 
          color: TossColors.primary 
        },
        { 
          item: '셔츠/니트', 
          detail: '화이트 셔츠, 라운드 니트',
          icon: '👕', 
          color: '#4A88FF' 
        },
        { 
          item: '슬랙스', 
          detail: '면/울 소재, 차분한 색상',
          icon: '👖', 
          color: '#6B7684' 
        },
        { 
          item: '신발', 
          detail: '로퍼, 첼시부츠, 드레스슈즈',
          icon: '👞', 
          color: '#333D4B' 
        },
      ],
      avoid: [
        { item: '흰색 계열 복장', reason: '신랑과 구분되지 않음' },
        { item: '너무 화려한 패턴', reason: '주인공보다 튀면 안됨' },
        { item: '운동화/슬리퍼', reason: '격식에 맞지 않음' },
        { item: '반바지/민소매', reason: '과도한 노출' },
      ]
    },
    female: {
      quickTip: '단정한 원피스 또는 블라우스 + 스커트/팬츠 조합',
      recommended: [
        { 
          item: '원피스', 
          detail: '무릎 길이, 차분한 색상',
          icon: '👗', 
          color: '#FF69B4' 
        },
        { 
          item: '블라우스 세트', 
          detail: '블라우스 + 스커트/팬츠',
          icon: '👚', 
          color: '#6B7684' 
        },
        { 
          item: '신발', 
          detail: '낮은 힐, 플랫슈즈, 로퍼',
          icon: '👠', 
          color: '#FF5A5F' 
        },
        { 
          item: '액세서리', 
          detail: '단순한 목걸이, 작은 귀걸이',
          icon: '💍', 
          color: '#FFB800' 
        },
      ],
      avoid: [
        { item: '흰색/아이보리 드레스', reason: '신부와 색상 겹침' },
        { item: '전신 검은색', reason: '장례식 분위기' },
        { item: '과도한 노출 의상', reason: '격식에 어긋남' },
        { item: '지나치게 화려한 옷', reason: '주인공보다 튀면 안됨' },
      ]
    }
  };

  // 장례식 복장 가이드
  const funeralDressCode = {
    male: {
      quickTip: '검은색/다크 그레이 정장 또는 블레이저 + 흰색 셔츠',
      recommended: [
        { 
          item: '정장/블레이저', 
          detail: '검은색, 다크 그레이, 네이비',
          icon: '🖤', 
          color: '#191F28' 
        },
        { 
          item: '셔츠', 
          detail: '흰색 (무늬 없는 단정한)',
          icon: '👕', 
          color: '#8B95A1' 
        },
        { 
          item: '넥타이 (선택)', 
          detail: '검은색, 다크 톤 (필수 아님)',
          icon: '🖤', 
          color: '#191F28' 
        },
        { 
          item: '신발', 
          detail: '검은색 드레스슈즈, 로퍼',
          icon: '👞', 
          color: '#333D4B' 
        },
      ],
      avoid: [
        { item: '밝은 색상 옷', reason: '애도 분위기에 부적절' },
        { item: '화려한 액세서리', reason: '조용한 분위기 방해' },
        { item: '캐주얼 복장', reason: '격식에 어긋남' },
        { item: '진한 향수/화장', reason: '장례식장 예의' },
      ]
    },
    female: {
      quickTip: '검은색/다크 계열 원피스 또는 블라우스 + 스커트 조합',
      recommended: [
        { 
          item: '원피스/정장', 
          detail: '검은색, 다크 그레이 (단정)',
          icon: '🖤', 
          color: '#191F28' 
        },
        { 
          item: '스타킹 (선택)', 
          detail: '검은색, 살색 (계절에 따라)',
          icon: '🦵', 
          color: '#4E5968' 
        },
        { 
          item: '신발', 
          detail: '낮은 굽, 플랫슈즈',
          icon: '👠', 
          color: '#333D4B' 
        },
        { 
          item: '액세서리', 
          detail: '진주, 심플한 디자인 (최소)',
          icon: '⚪', 
          color: '#8B95A1' 
        },
      ],
      avoid: [
        { item: '밝은 색상/화려한 옷', reason: '애도 분위기에 부적절' },
        { item: '과도한 노출 의상', reason: '엄숙한 분위기 방해' },
        { item: '큰 액세서리/장식', reason: '소음과 화려함 우려' },
        { item: '진한 화장/네일', reason: '차분한 분위기 필요' },
      ]
    }
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

        {/* 한 줄 요약 - 토스 스타일 */}
        <View style={styles.quickTipCard}>
          <View style={styles.quickTipIcon}>
            <Ionicons name="bulb-outline" size={20} color={TossColors.warning} />
          </View>
          <Text style={styles.quickTipText}>{genderGuide.quickTip}</Text>
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
        {/* 헤더 - 다른 가이드 화면과 동일한 스타일 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={TossColors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>복장 & 매너 가이드</Text>
            <Text style={styles.headerSubtitle}>
              경조사에 적합한 복장과 행동 매너를 알아보세요
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        {/* 경조사 타입 탭 - 토스 스타일 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'wedding' && styles.tabActive]}
            onPress={() => setSelectedTab('wedding')}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabEmoji}>💒</Text>
              <Text style={[styles.tabText, selectedTab === 'wedding' && styles.tabTextActive]}>
                결혼식
              </Text>
            </View>
            {selectedTab === 'wedding' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'funeral' && styles.tabActive]}
            onPress={() => setSelectedTab('funeral')}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabEmoji}>🕯️</Text>
              <Text style={[styles.tabText, selectedTab === 'funeral' && styles.tabTextActive]}>
                장례식
              </Text>
            </View>
            {selectedTab === 'funeral' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* 복장 가이드 */}
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>👔 복장 가이드</Text>
          {renderDressGuide()}
        </View>

        {/* 매너 가이드 */}
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>📌 행동 매너</Text>
          {renderMannerGuide()}
        </View>

        {/* 하단 팁 카드 - 토스 스타일 */}
        <View style={styles.bottomTipCard}>
          <View style={styles.bottomTipHeader}>
            <Ionicons name="information-circle" size={20} color={TossColors.primary} />
            <Text style={styles.bottomTipTitle}>알아두면 좋아요</Text>
          </View>
          <Text style={styles.bottomTipText}>
            {selectedTab === 'wedding' 
              ? '결혼식은 신랑신부의 새로운 시작을 축하하는 자리입니다. 밝고 단정한 복장으로 기쁜 마음을 표현해주세요.'
              : '장례식은 고인을 추모하는 엄숙한 자리입니다. 검은색 복장으로 애도의 마음을 표현해주세요.'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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