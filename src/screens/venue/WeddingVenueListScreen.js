// src/screens/venue/WeddingVenueListScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';

export default function WeddingVenueListScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('rating');

  // 샘플 결혼식장 데이터
  const sampleVenues = [
    {
      id: 1,
      name: '그랜드 워커힐 웨딩홀',
      location: '서울 광진구',
      priceRange: '200-500만원',
      capacity: '200-300명',
      rating: 4.8,
      reviewCount: 324,
      image: null,
      features: ['주차장', '웨딩카', '메이크업실', '신혼여행'],
    },
    {
      id: 2,
      name: '롯데호텔 크리스탈 볼룸',
      location: '서울 중구',
      priceRange: '300-600만원',
      capacity: '150-400명',
      rating: 4.9,
      reviewCount: 156,
      image: null,
      features: ['주차장', '웨딩카', '메이크업실'],
    },
    {
      id: 3,
      name: '신라호텔 영빈관',
      location: '서울 중구',
      priceRange: '400-800만원',
      capacity: '100-200명',
      rating: 4.7,
      reviewCount: 89,
      image: null,
      features: ['주차장', '웨딩카', '메이크업실', '신혼여행', '하객대기실'],
    }
  ];

  const filters = [
    { id: 'all', label: '전체' },
    { id: 'budget', label: '200만원 이하' },
    { id: 'mid', label: '200-400만원' },
    { id: 'premium', label: '400만원 이상' },
  ];

  const sortOptions = [
    { id: 'rating', label: '평점순' },
    { id: 'price', label: '가격순' },
    { id: 'review', label: '후기순' },
  ];

  const handleVenuePress = (venue) => {
    navigation.navigate('VenueDetail', { venue, type: 'wedding' });
  };

  const renderVenueCard = (venue) => (
    <TouchableOpacity
      key={venue.id}
      style={styles.venueCard}
      onPress={() => handleVenuePress(venue)}
      activeOpacity={0.7}
    >
      <View style={styles.venueImageContainer}>
        <View style={styles.venuePlaceholder}>
          <Ionicons name="image-outline" size={40} color={Colors.gray400} />
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={Colors.warning} />
          <Text style={styles.ratingText}>{venue.rating}</Text>
        </View>
      </View>
      
      <View style={styles.venueInfo}>
        <Text style={styles.venueName} numberOfLines={1}>
          {venue.name}
        </Text>
        <View style={styles.venueLocation}>
          <Ionicons name="location-outline" size={14} color={Colors.gray500} />
          <Text style={styles.venueLocationText}>{venue.location}</Text>
        </View>
        
        <View style={styles.venueDetails}>
          <View style={styles.venueDetailItem}>
            <Text style={styles.venueDetailLabel}>가격</Text>
            <Text style={styles.venueDetailValue}>{venue.priceRange}</Text>
          </View>
          <View style={styles.venueDetailItem}>
            <Text style={styles.venueDetailLabel}>수용인원</Text>
            <Text style={styles.venueDetailValue}>{venue.capacity}</Text>
          </View>
        </View>
        
        <View style={styles.venueFeatures}>
          {venue.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {venue.features.length > 3 && (
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>+{venue.features.length - 3}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.venueFooter}>
          <Text style={styles.reviewCount}>후기 {venue.reviewCount}개</Text>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 필터 바 */}
      <View style={styles.filterBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.id && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortButtonText}>
            {sortOptions.find(opt => opt.id === selectedSort)?.label}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.gray600} />
        </TouchableOpacity>
      </View>

      {/* 결과 헤더 */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>총 {sampleVenues.length}개 결혼식장</Text>
        <TouchableOpacity style={styles.mapButton}>
          <Ionicons name="map-outline" size={16} color={Colors.primary} />
          <Text style={styles.mapButtonText}>지도보기</Text>
        </TouchableOpacity>
      </View>

      {/* 결혼식장 목록 */}
      <ScrollView style={styles.venueList} showsVerticalScrollIndicator={false}>
        {sampleVenues.map(renderVenueCard)}
        
        {/* 더보기 버튼 */}
        <TouchableOpacity style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>더 많은 결혼식장 보기</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.primary} />
        </TouchableOpacity>
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  filterBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  
  filterScroll: {
    paddingRight: 16,
  },
  
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    marginRight: 8,
  },
  
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
  },
  
  filterButtonTextActive: {
    color: Colors.white,
  },
  
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.gray50,
  },
  
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray700,
    marginRight: 4,
  },
  
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  
  resultCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
  },
  
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  mapButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 4,
  },
  
  venueList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  venueCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  venueImageContainer: {
    position: 'relative',
  },
  
  venuePlaceholder: {
    height: 160,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray900,
    marginLeft: 2,
  },
  
  venueInfo: {
    padding: 16,
  },
  
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 8,
  },
  
  venueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  venueLocationText: {
    fontSize: 14,
    color: Colors.gray600,
    marginLeft: 4,
  },
  
  venueDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  
  venueDetailItem: {
    flex: 1,
  },
  
  venueDetailLabel: {
    fontSize: 12,
    color: Colors.gray500,
    marginBottom: 2,
  },
  
  venueDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray900,
  },
  
  venueFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  
  featureTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  reviewCount: {
    fontSize: 14,
    color: Colors.gray600,
  },
  
  favoriteButton: {
    padding: 4,
  },
  
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  
  loadMoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginRight: 4,
  },
});