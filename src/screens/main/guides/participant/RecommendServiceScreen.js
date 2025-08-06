// src/screens/main/guides/RecommendServiceScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function RecommendServiceScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('wedding');
  const [showComingSoon, setShowComingSoon] = useState(false);

  // 웨딩 서비스 카테고리
  const weddingServices = [
    {
      id: 'venue',
      title: '웨딩홀',
      subtitle: '꿈꿔왔던 완벽한 웨딩홀',
      description: '규모별, 예산별, 지역별\n맞춤 웨딩홀 추천',
      icon: 'business',
      gradient: ['#FF6B9D', '#FFB1C1'],
      badge: '인기',
      stats: '1,200+ 업체',
    },
    {
      id: 'studio',
      title: '웨딩 스튜디오',
      subtitle: '평생 간직할 아름다운 순간',
      description: '드레스부터 촬영까지\n원스톱 웨딩 서비스',
      icon: 'camera',
      gradient: ['#4ECDC4', '#7BDBD8'],
      badge: '추천',
      stats: '800+ 업체',
    },
    {
      id: 'items',
      title: '웨딩 용품',
      subtitle: '특별한 날을 위한 모든 것',
      description: '부케, 웨딩링, 소품까지\n완벽한 웨딩 준비',
      icon: 'gift',
      gradient: ['#A8E6CF', '#C8F0DB'],
      badge: '신규',
      stats: '500+ 상품',
    },
    {
      id: 'services',
      title: '기타 서비스',
      subtitle: '웨딩의 모든 것',
      description: '플래너, 케이터링, 음향\n전문가들과 함께',
      icon: 'people',
      gradient: ['#FFB347', '#FFCC7A'],
      badge: '전문',
      stats: '300+ 전문가',
    },
  ];

  // 장례 서비스 카테고리
  const funeralServices = [
    {
      id: 'funeral_home',
      title: '장례식장',
      subtitle: '정중하고 엄숙한 마지막 인사',
      description: '24시간 상담 가능한\n신뢰할 수 있는 장례식장',
      icon: 'business',
      gradient: ['#B8C5D1', '#D1DCE5'],
      badge: '24시간',
      stats: '200+ 식장',
    },
    {
      id: 'supplies',
      title: '장례 용품',
      subtitle: '고인을 위한 정성',
      description: '관, 수의, 상복 등\n모든 장례 용품',
      icon: 'flower',
      gradient: ['#E8E8E8', '#F5F5F5'],
      badge: '품질보증',
      stats: '150+ 업체',
    },
    {
      id: 'flowers',
      title: '화환 & 조화',
      subtitle: '마음을 전하는 조화',
      description: '당일 배송 가능한\n근조화환 서비스',
      icon: 'leaf',
      gradient: ['#DED7C7', '#E8E1D8'],
      badge: '당일배송',
      stats: '100+ 화원',
    },
    {
      id: 'funeral_services',
      title: '기타 서비스',
      subtitle: '전문적인 장례 지원',
      description: '장례지도사, 운구차\n전문 서비스',
      icon: 'car',
      gradient: ['#C8D6E5', '#D9E3F0'],
      badge: '전문',
      stats: '80+ 업체',
    },
  ];

  // 지역별 인기 업체 (샘플)
  const popularVenues = [
    { name: '그랜드 웨딩홀', location: '강남구', rating: 4.8, price: '💰💰💰', feature: '럭셔리' },
    { name: '아름다운 정원', location: '송파구', rating: 4.7, price: '💰💰', feature: '가든웨딩' },
    { name: '엘레간스홀', location: '서초구', rating: 4.9, price: '💰💰💰💰', feature: '프리미엄' },
    { name: '로맨틱 스페이스', location: '마포구', rating: 4.6, price: '💰💰', feature: '아늑함' },
  ];

  const handleServicePress = (service) => {
    setShowComingSoon(true);
  };

  const renderServiceGrid = () => {
    const services = selectedCategory === 'wedding' ? weddingServices : funeralServices;
    
    return (
      <View style={styles.servicesGrid}>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => handleServicePress(service)}
            activeOpacity={0.8}
          >
            {/* 배경 그라디언트 */}
            <View style={[
              styles.serviceGradient,
              { backgroundColor: service.gradient[0] }
            ]}>
              <View style={[
                styles.serviceGradientOverlay,
                { backgroundColor: service.gradient[1] + '60' }
              ]} />
            </View>

            {/* 배지 */}
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>{service.badge}</Text>
            </View>

            {/* 아이콘 */}
            <View style={styles.serviceIconContainer}>
              <Ionicons 
                name={service.icon} 
                size={28} 
                color="white" 
              />
            </View>

            {/* 내용 */}
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              
              <View style={styles.serviceStats}>
                <Text style={styles.serviceStatsText}>{service.stats}</Text>
              </View>
            </View>

            {/* 화살표 */}
            <View style={styles.serviceArrow}>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPopularSection = () => (
    <View style={styles.popularSection}>
      <Text style={styles.popularTitle}>인기 웨딩홀 미리보기</Text>
      <Text style={styles.popularSubtitle}>곧 상세 정보와 예약 서비스를 제공할 예정이에요</Text>
      
      <View style={styles.popularList}>
        {popularVenues.map((venue, index) => (
          <TouchableOpacity
            key={index}
            style={styles.popularItem}
            onPress={() => setShowComingSoon(true)}
          >
            <View style={styles.popularInfo}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <View style={styles.venueDetails}>
                <View style={styles.venueLocation}>
                  <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.venueLocationText}>{venue.location}</Text>
                </View>
                <View style={styles.venueRating}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.venueRatingText}>{venue.rating}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.venueRight}>
              <Text style={styles.venuePrice}>{venue.price}</Text>
              <View style={styles.venueFeature}>
                <Text style={styles.venueFeatureText}>{venue.feature}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>추천 서비스</Text>
          <Text style={styles.headerSubtitle}>
            검증된 파트너 업체들의 전문 서비스
          </Text>
        </View>

        {/* 카테고리 탭 */}
        <View style={styles.categoryTabs}>
          <TouchableOpacity
            style={[styles.categoryTab, selectedCategory === 'wedding' && styles.categoryTabActive]}
            onPress={() => setSelectedCategory('wedding')}
          >
            <Text style={styles.categoryTabEmoji}>💒</Text>
            <Text style={[styles.categoryTabText, selectedCategory === 'wedding' && styles.categoryTabTextActive]}>
              웨딩 서비스
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryTab, selectedCategory === 'funeral' && styles.categoryTabActive]}
            onPress={() => setSelectedCategory('funeral')}
          >
            <Text style={styles.categoryTabEmoji}>🕯️</Text>
            <Text style={[styles.categoryTabText, selectedCategory === 'funeral' && styles.categoryTabTextActive]}>
              장례 서비스
            </Text>
          </TouchableOpacity>
        </View>

        {/* 서비스 그리드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'wedding' ? '웨딩 서비스' : '장례 서비스'}
          </Text>
          {renderServiceGrid()}
        </View>

        {/* 인기 업체 미리보기 (웨딩만) */}
        {selectedCategory === 'wedding' && renderPopularSection()}

        {/* 파트너 신청 안내 */}
        <View style={styles.partnerSection}>
          <View style={styles.partnerCard}>
            <View style={styles.partnerHeader}>
              <Ionicons name="business" size={24} color={Colors.primary} />
              <Text style={styles.partnerTitle}>파트너 업체 모집</Text>
            </View>
            <Text style={styles.partnerDescription}>
              정담과 함께 경조사 서비스를 제공하고 싶으신가요?{'\n'}
              검증된 파트너 업체로 등록하여 더 많은 고객들을 만나보세요.
            </Text>
            <TouchableOpacity 
              style={styles.partnerButton}
              onPress={() => setShowComingSoon(true)}
            >
              <Text style={styles.partnerButtonText}>파트너 신청하기</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 이용 안내 */}
        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>📋 이용 안내</Text>
          <View style={styles.guideList}>
            <View style={styles.guideItem}>
              <Text style={styles.guideIcon}>1️⃣</Text>
              <Text style={styles.guideText}>원하는 서비스 카테고리를 선택하세요</Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideIcon}>2️⃣</Text>
              <Text style={styles.guideText}>지역과 예산에 맞는 업체를 찾아보세요</Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideIcon}>3️⃣</Text>
              <Text style={styles.guideText}>리뷰와 평점을 확인하고 연락해보세요</Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideIcon}>4️⃣</Text>
              <Text style={styles.guideText}>정담 회원 할인 혜택을 받으세요</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 준비중 모달 */}
      <Modal
        visible={showComingSoon}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalIcon}>
                <Ionicons name="construct" size={32} color={Colors.warning} />
              </View>
              <Text style={styles.modalTitle}>서비스 준비중</Text>
              <Text style={styles.modalMessage}>
                더 나은 서비스 제공을 위해{'\n'}
                파트너 업체들과 협의 중입니다.{'\n\n'}
                곧 만나볼 수 있어요! 🚀
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowComingSoon(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 헤더
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // 카테고리 탭
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  categoryTabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTabEmoji: {
    fontSize: 16,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // 섹션
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  
  // 서비스 그리드
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  serviceGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  serviceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  serviceIconContainer: {
    position: 'absolute',
    top: 12,
    left: 16,
  },
  serviceContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 50,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 14,
    marginBottom: 6,
  },
  serviceStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  serviceStatsText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  serviceArrow: {
    position: 'absolute',
    top: 12,
    right: 16,
  },
  
  // 인기 업체
  popularSection: {
    marginBottom: 32,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  popularSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  popularList: {
    gap: 12,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  popularInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  venueDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  venueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueLocationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  venueRatingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  venueRight: {
    alignItems: 'flex-end',
  },
  venuePrice: {
    fontSize: 14,
    marginBottom: 4,
  },
  venueFeature: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  venueFeatureText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // 파트너 섹션
  partnerSection: {
    marginBottom: 32,
  },
  partnerCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  partnerDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  partnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  partnerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  
  // 가이드 섹션
  guideSection: {
    marginBottom: 32,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  guideList: {
    gap: 12,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guideIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  guideText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  
  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 300,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 32,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});