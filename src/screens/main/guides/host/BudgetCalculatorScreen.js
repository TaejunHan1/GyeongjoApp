// src/screens/main/guides/host/BudgetCalculatorScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function BudgetCalculatorScreen({ navigation, userInfo, session }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [eventType, setEventType] = useState('wedding'); // 'wedding' or 'funeral'
  const [guestCount, setGuestCount] = useState('100');
  const [totalBudget, setTotalBudget] = useState('3000');
  const [budgetItems, setBudgetItems] = useState({});
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 결혼식 예산 항목들
  const weddingBudgetCategories = [
    {
      id: 'venue',
      title: '웨딩홀/장소',
      items: [
        { id: 'hall_rental', name: '홀 대관료', defaultPercent: 25, description: '웨딩홀 대관 및 기본 세팅' },
        { id: 'decoration', name: '장식/플라워', defaultPercent: 8, description: '회장 장식, 부케, 꽃장식' },
        { id: 'lighting_sound', name: '조명/음향', defaultPercent: 5, description: '조명 및 음향 설비' },
      ]
    },
    {
      id: 'food',
      title: '식음료',
      items: [
        { id: 'meal', name: '식사비용', defaultPercent: 30, description: '하객 식사 및 음료' },
        { id: 'cake', name: '웨딩케이크', defaultPercent: 2, description: '웨딩케이크 및 디저트' },
      ]
    },
    {
      id: 'attire',
      title: '의상/미용',
      items: [
        { id: 'dress', name: '웨딩드레스/턱시도', defaultPercent: 8, description: '신랑신부 의상' },
        { id: 'makeup', name: '메이크업/헤어', defaultPercent: 3, description: '신부 메이크업 및 헤어' },
        { id: 'accessories', name: '액세서리', defaultPercent: 2, description: '신발, 장갑, 베일 등' },
      ]
    },
    {
      id: 'photo_video',
      title: '사진/영상',
      items: [
        { id: 'photography', name: '웨딩촬영', defaultPercent: 8, description: '웨딩사진 및 스냅촬영' },
        { id: 'videography', name: '웨딩영상', defaultPercent: 5, description: '웨딩영상 제작' },
      ]
    },
    {
      id: 'misc',
      title: '기타',
      items: [
        { id: 'invitation', name: '청첩장', defaultPercent: 2, description: '청첩장 제작 및 발송' },
        { id: 'gift', name: '답례품', defaultPercent: 3, description: '하객 답례품' },
        { id: 'honeymoon', name: '신혼여행', defaultPercent: 15, description: '허니문 여행비용' },
        { id: 'etc', name: '기타비용', defaultPercent: 5, description: '예비비 및 기타 비용' },
      ]
    }
  ];

  // 장례식 예산 항목들
  const funeralBudgetCategories = [
    {
      id: 'facility',
      title: '장례식장',
      items: [
        { id: 'hall_rental', name: '빈소 사용료', defaultPercent: 20, description: '빈소 3일 사용료' },
        { id: 'decoration', name: '빈소 장식', defaultPercent: 8, description: '영정사진, 근조화환 등' },
        { id: 'funeral_supplies', name: '장례용품', defaultPercent: 10, description: '상복, 완장, 관련 용품' },
      ]
    },
    {
      id: 'services',
      title: '장례서비스',
      items: [
        { id: 'funeral_director', name: '장례지도사', defaultPercent: 15, description: '장례 진행 및 안내' },
        { id: 'transportation', name: '운구/차량', defaultPercent: 8, description: '영구차, 버스 등' },
        { id: 'religious', name: '종교의식', defaultPercent: 5, description: '목사, 신부, 스님 예배료' },
      ]
    },
    {
      id: 'burial',
      title: '매장/화장',
      items: [
        { id: 'cremation', name: '화장비용', defaultPercent: 12, description: '화장장 사용료' },
        { id: 'burial_plot', name: '묘지/납골당', defaultPercent: 25, description: '영구 안장지' },
      ]
    },
    {
      id: 'food_service',
      title: '접대비용',
      items: [
        { id: 'food', name: '조문객 접대', defaultPercent: 15, description: '음식 및 다과비' },
        { id: 'memorial_meal', name: '상차림', defaultPercent: 8, description: '발인 후 식사비' },
      ]
    },
    {
      id: 'misc',
      title: '기타',
      items: [
        { id: 'obituary', name: '부고/광고', defaultPercent: 3, description: '부고장 및 신문광고' },
        { id: 'memorial_items', name: '추모용품', defaultPercent: 2, description: '영정사진, 위패 등' },
        { id: 'etc', name: '기타비용', defaultPercent: 5, description: '예비비 및 기타' },
      ]
    }
  ];

  const currentCategories = eventType === 'wedding' ? weddingBudgetCategories : funeralBudgetCategories;

  // AI 추천 예산 계산
  const calculateAIRecommendation = () => {
    const budget = parseInt(totalBudget) * 10000; // 만원 단위
    const guests = parseInt(guestCount);
    const newBudgetItems = {};

    currentCategories.forEach(category => {
      category.items.forEach(item => {
        let percentage = item.defaultPercent;
        
        // 인원수에 따른 조정
        if (['meal', 'food', 'gift'].includes(item.id)) {
          if (guests > 150) percentage *= 1.1;
          else if (guests < 50) percentage *= 0.9;
        }
        
        // 예산 규모에 따른 조정
        if (budget > 50000000) { // 5천만원 이상
          if (['photography', 'videography', 'decoration'].includes(item.id)) {
            percentage *= 1.2;
          }
        } else if (budget < 20000000) { // 2천만원 미만
          if (['honeymoon', 'accessories', 'etc'].includes(item.id)) {
            percentage *= 0.8;
          }
        }

        newBudgetItems[item.id] = Math.round((budget * percentage) / 100);
      });
    });

    setBudgetItems(newBudgetItems);
    setShowAIRecommendation(true);
  };

  // 수동 입력 처리
  const updateBudgetItem = (itemId, value) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setBudgetItems(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  // 총 계산된 비용
  const totalCalculated = Object.values(budgetItems).reduce((sum, value) => sum + (value || 0), 0);
  const budgetDifference = (parseInt(totalBudget) * 10000) - totalCalculated;

  // 숫자 포맷팅
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatToWon = (num) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만원`;
    }
    return `${formatNumber(num)}원`;
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
            <Ionicons name="calculator" size={32} color="#26C976" />
          </View>
          <Text style={styles.headerTitle}>스마트 예산 계산기</Text>
          <Text style={styles.headerSubtitle}>
            AI 추천으로 합리적인 예산을 계획해보세요
          </Text>
        </View>

        {/* 행사 타입 선택 */}
        <View style={styles.eventTypeSection}>
          <Text style={styles.sectionTitle}>행사 종류</Text>
          <View style={styles.eventTypeButtons}>
            <TouchableOpacity
              style={[
                styles.eventTypeButton,
                eventType === 'wedding' && styles.eventTypeButtonActive
              ]}
              onPress={() => setEventType('wedding')}
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
                결혼식
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.eventTypeButton,
                eventType === 'funeral' && styles.eventTypeButtonActive
              ]}
              onPress={() => setEventType('funeral')}
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
                장례식
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 기본 정보 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {eventType === 'wedding' ? '예상 하객 수' : '예상 조문객 수'}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={guestCount}
                onChangeText={setGuestCount}
                keyboardType="numeric"
                placeholder="100"
              />
              <Text style={styles.inputUnit}>명</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>총 예산</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={totalBudget}
                onChangeText={setTotalBudget}
                keyboardType="numeric"
                placeholder="3000"
              />
              <Text style={styles.inputUnit}>만원</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.aiButton}
            onPress={calculateAIRecommendation}
          >
            <Ionicons name="bulb" size={20} color={Colors.white} />
            <Text style={styles.aiButtonText}>AI 추천 예산 계산하기</Text>
          </TouchableOpacity>
        </View>

        {/* 예산 결과 */}
        {showAIRecommendation && (
          <View style={styles.resultsSection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>예산 요약</Text>
                <View style={[
                  styles.budgetStatus,
                  { backgroundColor: budgetDifference >= 0 ? '#E8F5E8' : '#FFE8E8' }
                ]}>
                  <Text style={[
                    styles.budgetStatusText,
                    { color: budgetDifference >= 0 ? '#26C976' : '#FF6B6B' }
                  ]}>
                    {budgetDifference >= 0 ? '예산 내' : '예산 초과'}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryContent}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>설정 예산</Text>
                  <Text style={styles.summaryValue}>
                    {formatToWon(parseInt(totalBudget) * 10000)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>계산된 비용</Text>
                  <Text style={styles.summaryValue}>
                    {formatToWon(totalCalculated)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                  <Text style={styles.summaryLabelTotal}>차액</Text>
                  <Text style={[
                    styles.summaryValueTotal,
                    { color: budgetDifference >= 0 ? '#26C976' : '#FF6B6B' }
                  ]}>
                    {budgetDifference >= 0 ? '+' : ''}{formatToWon(Math.abs(budgetDifference))}
                  </Text>
                </View>
              </View>
            </View>

            {/* 세부 항목별 예산 */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>항목별 세부 예산</Text>
              
              {currentCategories.map((category) => (
                <View key={category.id} style={styles.categoryCard}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <View style={styles.categoryItems}>
                    {category.items.map((item) => (
                      <View key={item.id} style={styles.budgetItem}>
                        <View style={styles.budgetItemHeader}>
                          <Text style={styles.budgetItemName}>{item.name}</Text>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => {
                              Alert.prompt(
                                '예산 수정',
                                `${item.name} 예산을 입력하세요 (원)`,
                                [
                                  { text: '취소', style: 'cancel' },
                                  { 
                                    text: '확인', 
                                    onPress: (value) => updateBudgetItem(item.id, value) 
                                  }
                                ],
                                'plain-text',
                                budgetItems[item.id]?.toString() || '0'
                              );
                            }}
                          >
                            <Ionicons name="pencil" size={16} color={Colors.primary} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.budgetItemDescription}>{item.description}</Text>
                        <View style={styles.budgetItemFooter}>
                          <Text style={styles.budgetItemAmount}>
                            {formatToWon(budgetItems[item.id] || 0)}
                          </Text>
                          <Text style={styles.budgetItemPercent}>
                            {((budgetItems[item.id] || 0) / (parseInt(totalBudget) * 10000) * 100).toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 도움말 */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Ionicons name="information-circle" size={24} color="#26C976" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>💡 예산 계획 팁</Text>
              <Text style={styles.helpText}>
                • 예산의 10-15%는 예비비로 남겨두세요{'\n'}
                • 우선순위를 정해서 중요한 항목부터 배분하세요{'\n'}
                • 여러 업체에서 견적을 받아 비교해보세요{'\n'}
                • 계절과 요일에 따라 비용이 달라질 수 있어요
              </Text>
            </View>
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
    backgroundColor: '#26C976' + '20',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  eventTypeButtonTextActive: {
    color: Colors.white,
  },
  
  // 입력 섹션
  inputSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 결과 섹션
  resultsSection: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  budgetStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  budgetStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 12,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  // 세부 항목
  detailsSection: {
    gap: 16,
  },
  categoryCard: {
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
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  categoryItems: {
    gap: 12,
  },
  budgetItem: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 12,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  editButton: {
    padding: 4,
  },
  budgetItemDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  budgetItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  budgetItemPercent: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  
  // 도움말
  helpSection: {
    marginBottom: 32,
  },
  helpCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#B8E6B8',
  },
  helpIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});