// src/screens/main/GuideScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';

const { width } = Dimensions.get('window');

export default function GuideScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedUserType, setSelectedUserType] = useState(null); // 'host' 또는 'participant'

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 사용자 타입 선택 데이터
  const userTypes = [
    {
      id: 'host',
      title: '행사 주최자',
      subtitle: '결혼식, 장례식을 준비하는 분',
      description: '처음 경조사를 준비하는 분들을 위한\n체계적인 준비 가이드',
      icon: 'calendar',
      gradient: ['#FF6B6B', '#FF8E8E'],
      emoji: '🎭',
    },
    {
      id: 'participant',
      title: '행사 참여자',
      subtitle: '경조사에 참석하는 분',
      description: '축의금부터 예절까지\n참석자를 위한 완벽 가이드',
      icon: 'people',
      gradient: ['#4A88FF', '#6FA8FF'],
      emoji: '👥',
    },
  ];

  // 주최자용 가이드 카테고리
  const hostGuideCategories = [
    {
      id: 'wedding-prep',
      title: '결혼식 준비',
      subtitle: '웨딩 플래닝의 모든 것',
      description: '예산부터 당일 진행까지\n완벽한 결혼식 준비 가이드',
      icon: 'heart',
      gradient: ['#FF69B4', '#FFB6C1'],
      screen: 'WeddingPrepGuide',
      badge: '완벽 준비',
    },
    {
      id: 'funeral-prep',
      title: '장례식 준비',
      subtitle: '장례 절차와 준비사항',
      description: '임종부터 발인까지\n차근차근 준비하는 방법',
      icon: 'flower',
      gradient: ['#9370DB', '#BA55D3'],
      screen: 'FuneralPrepGuide',
      badge: '절차 안내',
    },
    {
      id: 'budget-calc',
      title: '예산 계산기',
      subtitle: 'AI 기반 예산 추천',
      description: '규모와 스타일에 맞는\n합리적인 예산 계획',
      icon: 'calculator',
      gradient: ['#26C976', '#4FD18C'],
      screen: 'BudgetCalculator',
      badge: 'AI 추천',
    },
    {
      id: 'vendor-list',
      title: '업체 리스트',
      subtitle: '검증된 파트너 업체',
      description: '웨딩홀부터 상조회사까지\n신뢰할 수 있는 업체 정보',
      icon: 'business',
      gradient: ['#FFB800', '#FFCB3D'],
      screen: 'VendorList',
      badge: '검증완료',
    },
  ];

  // 참여자용 가이드 카테고리 (기존 것들)
  const participantGuideCategories = [
    {
      id: 'money',
      title: '축의금 가이드',
      subtitle: 'AI 추천으로 적정 금액 계산',
      description: '관계와 친밀도를 바탕으로\n스마트하게 축의금을 계산해보세요',
      icon: 'calculator',
      gradient: ['#4A88FF', '#6FA8FF'],
      screen: 'MoneyGuide',
      badge: 'AI 추천',
    },
    {
      id: 'manner',
      title: '복장 & 매너',
      subtitle: '상황별 완벽한 복장 가이드',
      description: '결혼식, 장례식에 맞는\n올바른 복장과 매너를 알아보세요',
      icon: 'shirt',
      gradient: ['#26C976', '#4FD18C'],
      screen: 'MannerGuide',
      badge: '필수',
    },
    {
      id: 'etiquette',
      title: '예절 가이드',
      subtitle: '경조사 예절의 모든 것',
      description: '결혼식과 장례식에서\n지켜야 할 예절을 배워보세요',
      icon: 'people',
      gradient: ['#FFB800', '#FFCB3D'],
      screen: 'EtiquetteGuide',
      badge: '기본',
    },
    {
      id: 'service',
      title: '추천 서비스',
      subtitle: '검증된 업체 추천',
      description: '웨딩홀부터 장례식장까지\n신뢰할 수 있는 업체들을 만나보세요',
      icon: 'storefront',
      gradient: ['#FF6B6B', '#FF8E8E'],
      screen: 'RecommendService',
      badge: '준비중',
    },
  ];

  // 주최자용 인기 가이드
  const hostPopularGuides = [
    {
      title: '결혼식 예산 세우기',
      views: '3.2만',
      icon: '💰',
      description: '합리적인 웨딩 예산 계획',
    },
    {
      title: '웨딩홀 선택 가이드',
      views: '2.8만',
      icon: '🏛️',
      description: '나에게 맞는 웨딩홀 찾기',
    },
    {
      title: '장례식 절차 A to Z',
      views: '1.9만',
      icon: '📋',
      description: '임종부터 발인까지 절차',
    },
  ];

  // 참여자용 인기 가이드 (기존 것들)
  const participantPopularGuides = [
    {
      title: '회사 동료 결혼식 축의금',
      views: '1.2만',
      icon: '💼',
      description: '친밀도에 따른 적정 금액',
    },
    {
      title: '장례식 조문 예절',
      views: '8,500',
      icon: '🕯️',
      description: '올바른 조문 절차와 매너',
    },
    {
      title: '결혼식 하객 복장',
      views: '6,300',
      icon: '👔',
      description: '계절별 하객 복장 가이드',
    },
  ];

  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType);
  };

  const handleBackToSelection = () => {
    setSelectedUserType(null);
  };

  const handleCategoryPress = (category) => {
    navigation.navigate(category.screen);
  };

  // 사용자 타입 선택 화면
  if (!selectedUserType) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>경조사 가이드</Text>
            <Text style={styles.headerSubtitle}>
              어떤 가이드를 찾고 계신가요?
            </Text>
          </View>
        </View>

        <Animated.ScrollView 
          style={[styles.content, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 사용자 타입 선택 */}
          <View style={styles.typeSelectionSection}>
            <Text style={styles.sectionTitle}>역할을 선택해주세요</Text>
            <Text style={styles.sectionDescription}>
              상황에 맞는 맞춤형 가이드를 제공해드릴게요
            </Text>
            
            <View style={styles.typeGrid}>
              {userTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.typeCard}
                  onPress={() => handleUserTypeSelect(type.id)}
                  activeOpacity={0.8}
                >
                  {/* 배경 그라디언트 효과 */}
                  <View style={[
                    styles.typeGradient,
                    { backgroundColor: type.gradient[0] }
                  ]}>
                    <View style={[
                      styles.typeGradientOverlay,
                      { backgroundColor: type.gradient[1] + '20' }
                    ]} />
                  </View>

                  {/* 이모지 */}
                  <View style={styles.typeEmojiContainer}>
                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  </View>

                  {/* 내용 */}
                  <View style={styles.typeContent}>
                    <Text style={styles.typeTitle}>{type.title}</Text>
                    <Text style={styles.typeSubtitle}>{type.subtitle}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </View>

                  {/* 화살표 */}
                  <View style={styles.typeArrow}>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 하단 여백 */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    );
  }

  // 선택된 타입에 따른 가이드 화면
  const currentCategories = selectedUserType === 'host' ? hostGuideCategories : participantGuideCategories;
  const currentPopularGuides = selectedUserType === 'host' ? hostPopularGuides : participantPopularGuides;
  const currentTitle = selectedUserType === 'host' ? '주최자 가이드' : '참여자 가이드';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToSelection}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{currentTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {selectedUserType === 'host' ? '완벽한 행사 준비를 도와드려요' : '스마트한 경조사 참석 가이드'}
          </Text>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 메인 가이드 카테고리 */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>가이드 카테고리</Text>
          <View style={styles.categoriesGrid}>
            {currentCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.8}
              >
                {/* 배경 그라디언트 효과 */}
                <View style={[
                  styles.categoryGradient,
                  { backgroundColor: category.gradient[0] }
                ]}>
                  <View style={[
                    styles.categoryGradientOverlay,
                    { backgroundColor: category.gradient[1] + '20' }
                  ]} />
                </View>

                {/* 배지 */}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{category.badge}</Text>
                </View>

                {/* 아이콘 */}
                <View style={styles.categoryIconContainer}>
                  <Ionicons 
                    name={category.icon} 
                    size={32} 
                    color="white" 
                  />
                </View>

                {/* 내용 */}
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>

                {/* 화살표 */}
                <View style={styles.categoryArrow}>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 인기 가이드 */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>인기 가이드</Text>
            <Text style={styles.sectionSubtitle}>많이 찾는 가이드들이에요</Text>
          </View>
          
          <View style={styles.popularList}>
            {currentPopularGuides.map((guide, index) => (
              <TouchableOpacity
                key={index}
                style={styles.popularItem}
                activeOpacity={0.8}
              >
                <View style={styles.popularIcon}>
                  <Text style={styles.popularEmoji}>{guide.icon}</Text>
                </View>
                <View style={styles.popularContent}>
                  <Text style={styles.popularTitle}>{guide.title}</Text>
                  <Text style={styles.popularDescription}>{guide.description}</Text>
                </View>
                <View style={styles.popularStats}>
                  <Text style={styles.popularViews}>{guide.views}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 퀴즈 섹션 */}
        <View style={styles.quizSection}>
          <View style={styles.quizCard}>
            <View style={styles.quizHeader}>
              <View style={styles.quizIcon}>
                <Ionicons name="help-circle" size={24} color={Colors.primary} />
              </View>
              <View style={styles.quizContent}>
                <Text style={styles.quizTitle}>
                  {selectedUserType === 'host' ? '행사 준비 체크리스트' : '경조사 매너 퀴즈'}
                </Text>
                <Text style={styles.quizSubtitle}>
                  {selectedUserType === 'host' ? '빠뜨린 준비사항은 없을까요?' : '내 매너 지수는 몇 점일까요?'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.quizButton}>
              <Text style={styles.quizButtonText}>
                {selectedUserType === 'host' ? '체크리스트 보기' : '퀴즈 풀기'}
              </Text>
              <Ionicons name="play" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // 헤더
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 타입 선택 섹션
  typeSelectionSection: {
    marginTop: 24,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  typeGrid: {
    gap: 20,
  },
  typeCard: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  typeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  typeGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  typeEmojiContainer: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  typeEmoji: {
    fontSize: 48,
  },
  typeContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 70,
  },
  typeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
  },
  typeSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  typeDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  typeArrow: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  
  // 카테고리 섹션
  categoriesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  categoriesGrid: {
    gap: 16,
  },
  categoryCard: {
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  categoryGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  categoryIconContainer: {
    position: 'absolute',
    top: 16,
    left: 20,
  },
  categoryContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 60,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  categoryArrow: {
    position: 'absolute',
    top: 16,
    right: 20,
  },
  
  // 인기 가이드 섹션
  popularSection: {
    marginTop: 40,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  popularList: {
    gap: 12,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  popularIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  popularEmoji: {
    fontSize: 20,
  },
  popularContent: {
    flex: 1,
  },
  popularTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  popularDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  popularStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popularViews: {
    fontSize: 12,
    color: Colors.gray400,
    fontWeight: '500',
  },
  
  // 퀴즈 섹션
  quizSection: {
    marginTop: 32,
  },
  quizCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quizIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quizContent: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  quizSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  quizButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});