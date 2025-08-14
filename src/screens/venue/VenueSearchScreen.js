// src/screens/venue/VenueSearchScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';

export default function VenueSearchScreen({ navigation, userInfo, session, isAuthenticated }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', title: '전체', icon: 'business-outline' },
    { id: 'wedding', title: '결혼식장', icon: 'heart-outline' },
    { id: 'funeral', title: '장례식장', icon: 'flower-outline' },
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    
    if (categoryId === 'wedding') {
      navigation.navigate('WeddingVenueList');
    } else if (categoryId === 'funeral') {
      navigation.navigate('FuneralVenueList');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>장소 찾기</Text>
        <Text style={styles.headerSubtitle}>믿을 수 있는 경조사 장소를 찾아보세요</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 카테고리 선택 */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive
                ]}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.categoryIcon,
                  selectedCategory === category.id && styles.categoryIconActive
                ]}>
                  <Ionicons 
                    name={category.icon} 
                    size={32} 
                    color={selectedCategory === category.id ? Colors.white : Colors.gray600} 
                  />
                </View>
                <Text style={[
                  styles.categoryTitle,
                  selectedCategory === category.id && styles.categoryTitleActive
                ]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 인기 장소 */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>인기 장소</Text>
            <TouchableOpacity>
              <Text style={styles.moreButton}>더보기</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.popularCard}>
            <View style={styles.popularContent}>
              <Text style={styles.popularTitle}>준비중입니다</Text>
              <Text style={styles.popularSubtitle}>
                곧 다양한 결혼식장과 장례식장 정보를 제공할 예정입니다
              </Text>
            </View>
            <Ionicons name="construct-outline" size={48} color={Colors.gray300} />
          </View>
        </View>

        {/* 지역별 찾기 */}
        <View style={styles.regionSection}>
          <Text style={styles.sectionTitle}>지역별 찾기</Text>
          <View style={styles.regionGrid}>
            {['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산'].map((region) => (
              <TouchableOpacity
                key={region}
                style={styles.regionItem}
                onPress={() => {
                  // 추후 지역별 검색 구현
                }}
              >
                <Text style={styles.regionText}>{region}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: 4,
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: Colors.gray600,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  categorySection: {
    marginTop: 24,
    marginBottom: 32,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 16,
  },
  
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  categoryCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.gray100,
  },
  
  categoryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  
  categoryIconActive: {
    backgroundColor: Colors.primary,
  },
  
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray700,
    textAlign: 'center',
  },
  
  categoryTitleActive: {
    color: Colors.primary,
  },
  
  popularSection: {
    marginBottom: 32,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  moreButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  popularCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  popularContent: {
    flex: 1,
  },
  
  popularTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 4,
  },
  
  popularSubtitle: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 20,
  },
  
  regionSection: {
    marginBottom: 32,
  },
  
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  
  regionItem: {
    width: '23%',
    marginHorizontal: '1%',
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  
  regionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray700,
  },
});