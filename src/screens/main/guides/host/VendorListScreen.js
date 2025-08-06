// src/screens/main/guides/host/VendorListScreen.js
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
  Linking,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function VendorListScreen({ navigation, userInfo, session }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [eventType, setEventType] = useState('wedding');
  const [selectedCategory, setSelectedCategory] = useState('venue');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 결혼식 업체 카테고리
  const weddingCategories = [
    { id: 'venue', name: '웨딩홀', icon: 'business' },
    { id: 'photo', name: '사진/영상', icon: 'camera' },
    { id: 'makeup', name: '메이크업', icon: 'brush' },
    { id: 'dress', name: '드레스/턱시도', icon: 'shirt' },
    { id: 'flower', name: '플라워', icon: 'flower' },
    { id: 'cake', name: '케이크', icon: 'gift' },
    { id: 'music', name: '음악/DJ', icon: 'musical-notes' },
    { id: 'car', name: '웨딩카', icon: 'car' },
  ];

  // 장례식 업체 카테고리
  const funeralCategories = [
    { id: 'funeral_home', name: '장례식장', icon: 'business' },
    { id: 'funeral_service', name: '장례서비스', icon: 'people' },
    { id: 'cremation', name: '화장장', icon: 'flame' },
    { id: 'cemetery', name: '묘지/납골당', icon: 'home' },
    { id: 'flower', name: '조화/꽃', icon: 'flower' },
    { id: 'catering', name: '케이터링', icon: 'restaurant' },
    { id: 'supplies', name: '장례용품', icon: 'bag' },
    { id: 'transport', name: '운구/차량', icon: 'car' },
  ];

  // 결혼식 업체 데이터
  const weddingVendors = {
    venue: [
      {
        id: 1, name: '엘리시안 웨딩홀', area: '강남구', rating: 4.8, reviewCount: 324,
        price: '300-500만원', phone: '02-1234-5678', features: ['야외예식', '수용인원 200명', '주차 50대'],
        description: '자연친화적인 야외정원이 아름다운 프리미엄 웨딩홀'
      },
      {
        id: 2, name: '그랜드볼룸', area: '서초구', rating: 4.6, reviewCount: 256,
        price: '200-350만원', phone: '02-2345-6789', features: ['실내예식', '수용인원 150명', '주차 30대'],
        description: '클래식한 분위기의 고급스러운 실내 웨딩홀'
      },
      {
        id: 3, name: '스카이라운지 웨딩', area: '마포구', rating: 4.7, reviewCount: 189,
        price: '250-400만원', phone: '02-3456-7890', features: ['루프탑', '수용인원 100명', '한강뷰'],
        description: '한강이 내려다보이는 로맨틱한 루프탑 웨딩홀'
      },
    ],
    photo: [
      {
        id: 4, name: '드림 스튜디오', area: '강남구', rating: 4.9, reviewCount: 567,
        price: '80-150만원', phone: '02-4567-8901', features: ['본식촬영', '스냅촬영', '앨범제작'],
        description: '20년 경력의 전문 웨딩포토그래퍼'
      },
      {
        id: 5, name: '로맨틱 포토', area: '성동구', rating: 4.7, reviewCount: 432,
        price: '60-120만원', phone: '02-5678-9012', features: ['야외촬영', '드론촬영', '당일편집'],
        description: '감성적이고 자연스러운 웨딩촬영 전문'
      },
    ],
    makeup: [
      {
        id: 6, name: '뷰티살롱 미스', area: '강남구', rating: 4.8, reviewCount: 298,
        price: '15-25만원', phone: '02-6789-0123', features: ['신부메이크업', '헤어스타일링', '리허설'],
        description: 'TV 연예인 메이크업도 담당하는 실력파'
      },
    ],
    dress: [
      {
        id: 7, name: '프린세스 드레스', area: '서초구', rating: 4.6, reviewCount: 201,
        price: '50-200만원', phone: '02-7890-1234', features: ['드레스 대여', '맞춤제작', '피팅서비스'],
        description: '유럽 수입 드레스부터 한복까지 다양한 스타일'
      },
    ],
  };

  // 장례식 업체 데이터  
  const funeralVendors = {
    funeral_home: [
      {
        id: 11, name: '서울대병원 장례식장', area: '종로구', rating: 4.7, reviewCount: 456,
        price: '빈소 1일 30만원', phone: '02-1111-2222', features: ['24시간 운영', '주차 100대', '종교시설'],
        description: '서울 최대 규모의 종합병원 장례식장'
      },
      {
        id: 12, name: '평안장례식장', area: '영등포구', rating: 4.5, reviewCount: 234,
        price: '빈소 1일 25만원', phone: '02-2222-3333', features: ['24시간 운영', '가족빈소', '접대실'],
        description: '30년 전통의 신뢰할 수 있는 장례식장'
      },
    ],
    funeral_service: [
      {
        id: 13, name: '한국장례지도사협회', area: '전국', rating: 4.8, reviewCount: 789,
        price: '서비스별 상이', phone: '02-3333-4444', features: ['24시간 상담', '전문지도사', '전국서비스'],
        description: '자격증을 갖춘 전문 장례지도사들이 모든 절차를 도움'
      },
    ],
    cremation: [
      {
        id: 14, name: '서울시립 추모공원', area: '서초구', rating: 4.6, reviewCount: 345,
        price: '화장료 18만원', phone: '02-4444-5555', features: ['화장시설', '유족대기실', '추모시설'],
        description: '쾌적하고 편안한 환경의 공립 화장시설'
      },
    ],
    cemetery: [
      {
        id: 15, name: '영면공원 납골당', area: '경기 용인', rating: 4.5, reviewCount: 167,
        price: '납골료 200만원~', phone: '031-5555-6666', features: ['영구보관', '추모시설', '셔틀버스'],
        description: '자연친화적 환경의 현대식 납골당'
      },
    ],
  };

  const currentCategories = eventType === 'wedding' ? weddingCategories : funeralCategories;
  const currentVendors = eventType === 'wedding' ? weddingVendors : funeralVendors;
  const vendorList = currentVendors[selectedCategory] || [];

  const handleCall = (phone) => {
    Alert.alert(
      '전화 걸기',
      `${phone}로 전화를 걸까요?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '전화걸기', onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={12} color="#FFB800" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={12} color="#FFB800" />);
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#FFB800" />);
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 정보 */}
        <View style={styles.headerSection}>
          <View style={styles.headerIcon}>
            <Ionicons name="business" size={32} color="#FFB800" />
          </View>
          <Text style={styles.headerTitle}>검증된 업체 리스트</Text>
          <Text style={styles.headerSubtitle}>
            신뢰할 수 있는 파트너 업체들을 만나보세요
          </Text>
        </View>

        {/* 행사 타입 선택 */}
        <View style={styles.eventTypeSection}>
          <View style={styles.eventTypeButtons}>
            <TouchableOpacity
              style={[
                styles.eventTypeButton,
                eventType === 'wedding' && styles.eventTypeButtonActive
              ]}
              onPress={() => {
                setEventType('wedding');
                setSelectedCategory('venue');
              }}
            >
              <Ionicons 
                name="heart" 
                size={20} 
                color={eventType === 'wedding' ? Colors.white : Colors.primary} 
              />
              <Text style={[
                styles.eventTypeButtonText,
                eventType === 'wedding' && styles.eventTypeButtonTextActive
              ]}>
                결혼식 업체
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.eventTypeButton,
                eventType === 'funeral' && styles.eventTypeButtonActive
              ]}
              onPress={() => {
                setEventType('funeral');
                setSelectedCategory('funeral_home');
              }}
            >
              <Ionicons 
                name="flower" 
                size={20} 
                color={eventType === 'funeral' ? Colors.white : Colors.primary} 
              />
              <Text style={[
                styles.eventTypeButtonText,
                eventType === 'funeral' && styles.eventTypeButtonTextActive
              ]}>
                장례식 업체
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 카테고리 선택 */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>업체 카테고리</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {currentCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.id && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon} 
                  size={18} 
                  color={selectedCategory === category.id ? Colors.white : Colors.primary} 
                />
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === category.id && styles.categoryTabTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 업체 리스트 */}
        <View style={styles.vendorSection}>
          <View style={styles.vendorHeader}>
            <Text style={styles.sectionTitle}>
              {currentCategories.find(c => c.id === selectedCategory)?.name} 업체
            </Text>
            <Text style={styles.vendorCount}>{vendorList.length}개 업체</Text>
          </View>

          {vendorList.length > 0 ? (
            <View style={styles.vendorList}>
              {vendorList.map((vendor) => (
                <View key={vendor.id} style={styles.vendorCard}>
                  <View style={styles.vendorHeader}>
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>{vendor.name}</Text>
                      <View style={styles.vendorMeta}>
                        <View style={styles.locationBadge}>
                          <Ionicons name="location" size={12} color={Colors.textSecondary} />
                          <Text style={styles.locationText}>{vendor.area}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                          <View style={styles.stars}>
                            {renderStars(vendor.rating)}
                          </View>
                          <Text style={styles.ratingText}>
                            {vendor.rating} ({vendor.reviewCount})
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.vendorActions}>
                      <TouchableOpacity 
                        style={styles.callButton}
                        onPress={() => handleCall(vendor.phone)}
                      >
                        <Ionicons name="call" size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.vendorDescription}>{vendor.description}</Text>

                  <View style={styles.vendorDetails}>
                    <View style={styles.priceContainer}>
                      <Ionicons name="card" size={14} color={Colors.primary} />
                      <Text style={styles.priceText}>{vendor.price}</Text>
                    </View>
                    <View style={styles.featuresContainer}>
                      {vendor.features.map((feature, index) => (
                        <View key={index} style={styles.featureBadge}>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.vendorFooter}>
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => handleCall(vendor.phone)}
                    >
                      <Ionicons name="call-outline" size={16} color={Colors.primary} />
                      <Text style={styles.contactButtonText}>연락하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.favoriteButton}>
                      <Ionicons name="heart-outline" size={16} color={Colors.gray400} />
                      <Text style={styles.favoriteButtonText}>관심업체</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyStateTitle}>등록된 업체가 없습니다</Text>
              <Text style={styles.emptyStateText}>
                다른 카테고리를 선택해보세요
              </Text>
            </View>
          )}
        </View>

        {/* 업체 등록 안내 */}
        <View style={styles.registerSection}>
          <View style={styles.registerCard}>
            <View style={styles.registerIcon}>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
            </View>
            <View style={styles.registerContent}>
              <Text style={styles.registerTitle}>업체 등록 문의</Text>
              <Text style={styles.registerText}>
                우수한 서비스를 제공하는 업체라면 언제든 연락주세요
              </Text>
            </View>
            <TouchableOpacity style={styles.registerButton}>
              <Text style={styles.registerButtonText}>등록 문의</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 헤더
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFB800' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  
  // 섹션
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  
  // 행사 타입 선택
  eventTypeSection: {
    marginBottom: 24,
  },
  eventTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  eventTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    gap: 8,
  },
  eventTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  eventTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  eventTypeButtonTextActive: {
    color: Colors.white,
  },
  
  // 카테고리 섹션
  categorySection: {
    marginBottom: 24,
  },
  categoryTabs: {
    paddingRight: 20,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    marginRight: 8,
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: Colors.white,
  },
  
  // 업체 섹션
  vendorSection: {
    marginBottom: 32,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  vendorList: {
    gap: 16,
  },
  
  // 업체 카드
  vendorCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vendorInfo: {
    flex: 1,
    marginRight: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  vendorActions: {
    alignItems: 'flex-end',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  vendorDetails: {
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureBadge: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  vendorFooter: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  favoriteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    gap: 6,
  },
  favoriteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray400,
  },
  
  // 빈 상태
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.gray400,
  },
  
  // 업체 등록 섹션
  registerSection: {
    marginBottom: 32,
  },
  registerCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  registerIcon: {
    marginRight: 12,
  },
  registerContent: {
    flex: 1,
    marginRight: 12,
  },
  registerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  registerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});