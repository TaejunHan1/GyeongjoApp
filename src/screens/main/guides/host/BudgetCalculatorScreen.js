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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';
import { DeepSeekService, InsufficientCreditError } from '../../../../lib/deepseekService';
import { getAiStatus, AI_COST } from '../../../../lib/aiCredit';
import AiLoadingOverlay from '../../../../components/AiLoadingOverlay';

const { width } = Dimensions.get('window');

export default function BudgetCalculatorScreen({ navigation, userInfo, session }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [eventType, setEventType] = useState('wedding'); // 'wedding' or 'funeral'
  const [guestCount, setGuestCount] = useState('100');
  const [totalBudget, setTotalBudget] = useState('3000');
  const [budgetItems, setBudgetItems] = useState({});
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [location, setLocation] = useState('seoul');
  const [recommendedVenues, setRecommendedVenues] = useState([]);
  const [marketReality, setMarketReality] = useState('');
  const [aiStatus, setAiStatus] = useState({ balance: 0, budgetFreeAvailable: true });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // AI 크레딧 상태 로드
  React.useEffect(() => {
    let cancelled = false;
    getAiStatus().then((status) => {
      if (!cancelled && status?.success) {
        setAiStatus({
          balance: status.balance,
          budgetFreeAvailable: status.budgetFreeAvailable,
        });
      }
    });
    return () => { cancelled = true; };
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

  // 장례식 예산 항목들 (실제 장례식장 이용 기준)
  const funeralBudgetCategories = [
    {
      id: 'funeral_package',
      title: '장례식장 패키지',
      items: [
        { id: 'basic_package', name: '기본 패키지', defaultPercent: 45, description: '빈소, 장례용품, 지도사, 운구차 포함' },
        { id: 'additional_service', name: '추가 서비스', defaultPercent: 10, description: '화환, 근조용품, 특별 서비스' },
      ]
    },
    {
      id: 'burial_cremation',
      title: '안장/화장',
      items: [
        { id: 'cremation_cost', name: '화장 비용', defaultPercent: 8, description: '화장장 이용료' },
        { id: 'final_resting', name: '안장지', defaultPercent: 25, description: '묘지/납골당/수목장' },
      ]
    },
    {
      id: 'food_reception',
      title: '음식/접대',
      items: [
        { id: 'condolence_food', name: '조문객 음식', defaultPercent: 12, description: '3일간 조문객 식사 및 음료' },
        { id: 'wake_service', name: '빈소 다과', defaultPercent: 5, description: '차, 커피, 간식류' },
      ]
    },
    {
      id: 'misc',
      title: '기타 비용',
      items: [
        { id: 'obituary_ads', name: '부고 광고', defaultPercent: 3, description: '신문, 온라인 부고' },
        { id: 'memorial_photo', name: '영정사진', defaultPercent: 2, description: '영정사진 제작 및 액자' },
        { id: 'reserve_fund', name: '예비비', defaultPercent: 10, description: '예상치 못한 비용' },
      ]
    }
  ];

  const currentCategories = eventType === 'wedding' ? weddingBudgetCategories : funeralBudgetCategories;

  // DeepSeek AI 예산 계산 (실제 AI 연동)
  const calculateAIRecommendation = async () => {
    try {
      setIsCalculating(true);
      console.log('🤖 DeepSeek AI 예산 계산 시작...');

      const budget = parseInt(totalBudget) * 10000; // 만원 단위
      const guests = parseInt(guestCount);

      console.log('🔍 DeepSeek AI 계산 파라미터:', {
        eventType,
        totalBudget: budget,
        guestCount: guests,
        location
      });

      // DeepSeek AI 예산 계산 실행
      const aiResult = await DeepSeekService.getBudgetRecommendation(
        eventType,
        budget,
        guests,
        location,
        '' // 추가 정보
      );
      
      console.log('✅ DeepSeek AI 계산 완료:', {
        confidence: aiResult.confidence,
        insightCount: aiResult.insights.length,
        source: aiResult.metadata?.source,
        venues: aiResult.recommendedVenues?.length || 0,
        marketReality: aiResult.marketReality
      });

      // 추천 업체 및 시장 현실성 설정
      console.log('🏢 UI에 설정할 업체 정보:', aiResult.recommendedVenues);
      console.log('📊 UI에 설정할 시장 현실성:', aiResult.marketReality);
      setRecommendedVenues(aiResult.recommendedVenues || []);
      setMarketReality(aiResult.marketReality || '');

      // AI 결과를 기존 형식으로 변환
      const newBudgetItems = {};

      // 기존 하드코딩된 항목들과 매핑
      if (eventType === 'wedding') {
        newBudgetItems.hall_rental = Math.round(aiResult.detailed.venue?.hall_rental || 0);
        newBudgetItems.decoration = Math.round(aiResult.detailed.venue?.decoration || 0);
        newBudgetItems.lighting_sound = Math.round(aiResult.detailed.venue?.lighting_sound || 0);
        newBudgetItems.meal = Math.round(aiResult.detailed.food?.meal || 0);
        newBudgetItems.cake = Math.round(aiResult.detailed.food?.cake || 0);
        newBudgetItems.dress = Math.round(aiResult.detailed.attire?.dress || 0);
        newBudgetItems.makeup = Math.round(aiResult.detailed.attire?.makeup || 0);
        newBudgetItems.accessories = Math.round(aiResult.detailed.attire?.accessories || 0);
        newBudgetItems.photography = Math.round(aiResult.detailed.photo?.photography || 0);
        newBudgetItems.videography = Math.round(aiResult.detailed.photo?.videography || 0);
        newBudgetItems.invitation = Math.round(aiResult.detailed.misc?.invitation || 0);
        newBudgetItems.gift = Math.round(aiResult.detailed.misc?.gift || 0);
        newBudgetItems.honeymoon = Math.round(
          (aiResult.detailed.honeymoon?.travel || 0) + (aiResult.detailed.honeymoon?.accommodation || 0)
        );
        newBudgetItems.etc = Math.round(aiResult.detailed.misc?.etc || 0);
      } else {
        // 장례식 항목 매핑 (새로운 구조)
        newBudgetItems.basic_package = Math.round(aiResult.detailed.funeral_package?.basic_package || 0);
        newBudgetItems.additional_service = Math.round(aiResult.detailed.funeral_package?.additional_service || 0);
        newBudgetItems.cremation_cost = Math.round(aiResult.detailed.burial_cremation?.cremation_cost || 0);
        newBudgetItems.final_resting = Math.round(aiResult.detailed.burial_cremation?.final_resting || 0);
        newBudgetItems.condolence_food = Math.round(aiResult.detailed.food_reception?.condolence_food || 0);
        newBudgetItems.wake_service = Math.round(aiResult.detailed.food_reception?.wake_service || 0);
        newBudgetItems.obituary_ads = Math.round(aiResult.detailed.misc?.obituary_ads || 0);
        newBudgetItems.memorial_photo = Math.round(aiResult.detailed.misc?.memorial_photo || 0);
        newBudgetItems.reserve_fund = Math.round(aiResult.detailed.misc?.reserve_fund || 0);
      }

      console.log('🔢 설정할 예산 항목들:', newBudgetItems);
      setBudgetItems(newBudgetItems);
      setAiInsights(aiResult.insights);
      setAiConfidence(aiResult.confidence);
      setShowAIRecommendation(true);

      // AI 상태 즉시 반영 (무료 체험 소진 / 잔액 변화)
      if (aiResult.__credit) {
        setAiStatus({
          balance: aiResult.__credit.balance ?? 0,
          budgetFreeAvailable: false,
        });
      }

      // 성공 메시지
      Alert.alert(
        '🤖 DeepSeek AI 예산 계산 완료',
        `신뢰도 ${aiResult.confidence}%로 예산을 계산했습니다.\n${aiResult.insights.length}개의 맞춤 조언도 확인해보세요!`,
        [{ text: '확인', style: 'default' }]
      );

    } catch (error) {
      console.error('🔴 DeepSeek AI 예산 계산 오류:', error);

      // 크레딧 부족 → 충전 유도
      if (error instanceof InsufficientCreditError || error?.code === 'insufficient_balance') {
        setIsCalculating(false);
        Alert.alert(
          '크레딧이 부족해요',
          `AI 예산 계산은 크레딧 ${AI_COST.budget}건이 필요해요.\n현재 잔액: ${error.balance ?? 0}건`,
          [
            { text: '취소', style: 'cancel' },
            { text: '충전하러 가기', onPress: () => navigation?.navigate('Credit') },
          ]
        );
        return;
      }

      // 일반 에러 메시지 분기
      let errorTitle = 'AI 계산 오류';
      let errorMessage = 'AI 예산 계산에 실패했습니다. 다시 시도해주세요.';
      const msg = error?.message || '';
      if (msg.includes('Network')) {
        errorTitle = '인터넷 연결 오류';
        errorMessage = '인터넷 연결을 확인하고 다시 시도해주세요.';
      } else if (msg.includes('API') || msg.includes('upstream')) {
        errorTitle = 'AI 서비스 오류';
        errorMessage = 'AI 서비스에 일시적 문제가 있습니다. 잠시 후 다시 시도해주세요.';
      } else if (msg.includes('JSON')) {
        errorTitle = 'AI 응답 처리 오류';
        errorMessage = 'AI 응답을 처리하는 중 문제가 발생했습니다. 다시 시도해주세요.';
      }

      if (error.fallbackResult) {
        setBudgetItems(error.fallbackResult.budgetItems || {});
        setAiInsights(error.fallbackResult.insights || []);
        setAiConfidence(error.fallbackResult.confidence || 65);
        setRecommendedVenues(error.fallbackResult.recommendedVenues || []);
        setMarketReality(error.fallbackResult.marketReality || '');
        setShowAIRecommendation(true);
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: '확인', style: 'default' },
        {
          text: '다시 시도',
          onPress: () => setTimeout(() => calculateAIRecommendation(), 1000),
          style: 'cancel',
        },
      ]);
    } finally {
      setIsCalculating(false);
    }
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
  
  // 디버깅용
  console.log('💰 예산 계산 상태:', {
    budgetItems,
    totalCalculated,
    budgetDifference,
    totalBudget: parseInt(totalBudget) * 10000
  });

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

          {/* 지역 선택 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>지역</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              <View style={styles.optionContainer}>
                {[
                  { id: 'seoul', label: '서울' },
                  { id: 'gyeonggi', label: '경기' },
                  { id: 'busan', label: '부산' },
                  { id: 'daegu', label: '대구' },
                  { id: 'incheon', label: '인천' },
                  { id: 'gwangju', label: '광주' },
                  { id: 'daejeon', label: '대전' },
                  { id: 'ulsan', label: '울산' },
                  { id: 'jeju', label: '제주' },
                  { id: 'other', label: '기타' },
                ].map((region) => (
                  <TouchableOpacity
                    key={region.id}
                    style={[
                      styles.optionButton,
                      location === region.id && styles.optionButtonActive
                    ]}
                    onPress={() => setLocation(region.id)}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      location === region.id && styles.optionButtonTextActive
                    ]}>
                      {region.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>


          <TouchableOpacity 
            style={[styles.aiButton, isCalculating && styles.aiButtonDisabled]}
            onPress={calculateAIRecommendation}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="bulb" size={20} color={Colors.white} />
            )}
            <Text style={styles.aiButtonText}>
              {isCalculating
                ? 'AI 계산 중...'
                : aiStatus.budgetFreeAvailable
                  ? 'AI 추천 예산 계산하기 (무료 체험)'
                  : `AI 추천 예산 계산하기 (${AI_COST.budget} 크레딧)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 예산 결과 */}
        {showAIRecommendation && (
          <View style={styles.resultsSection}>
            {/* 추천 업체 정보 */}
            {recommendedVenues.length > 0 && (
              <View style={styles.venuesCard}>
                <View style={styles.venuesHeader}>
                  <View style={styles.venuesIcon}>
                    <Ionicons name="business" size={20} color="#26C976" />
                  </View>
                  <Text style={styles.venuesTitle}>추천 {eventType === 'wedding' ? '웨딩홀' : '장례식장'}</Text>
                </View>
                
                <View style={styles.venuesList}>
                  {recommendedVenues.map((venue, index) => {
                    console.log(`🏢 업체 ${index + 1} 렌더링:`, venue);
                    return (
                      <View key={index} style={styles.venueItem}>
                        <View style={styles.venueHeader}>
                          <View style={styles.venueMainInfo}>
                            <Text style={styles.venueName}>{venue.name || '업체명 미확인'}</Text>
                            <Text style={styles.venueLocation}>
                              📍 {venue.location || '위치 정보 없음'}
                            </Text>
                          </View>
                          {venue.phone && (
                            <TouchableOpacity 
                              style={styles.phoneButton}
                              onPress={() => Alert.alert(
                                '전화걸기', 
                                `${venue.name}에 전화하시겠습니까?\n\n📞 ${venue.phone}`,
                                [
                                  { text: '취소', style: 'cancel' },
                                  { text: '전화걸기', onPress: () => console.log('전화걸기:', venue.phone) }
                                ]
                              )}
                            >
                              <Ionicons name="call" size={16} color={Colors.primary} />
                              <Text style={styles.phoneText}>{venue.phone}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        <View style={styles.venuePriceSection}>
                          <View style={styles.priceInfo}>
                            <Text style={styles.venuePrice}>
                              💰 {venue.price_range || venue.package_price || '가격 정보 확인 필요'}
                            </Text>
                            
                            {/* 🔥 세부 가격 정보 표시 */}
                            {venue.detailedPrices && Object.keys(venue.detailedPrices).length > 0 && (
                              <View style={styles.detailedPricesContainer}>
                                <Text style={styles.detailedPricesTitle}>📋 세부 가격 정보</Text>
                                <View style={styles.detailedPricesList}>
                                  {Object.entries(venue.detailedPrices).map(([key, value], index) => (
                                    <View key={index} style={styles.detailedPriceItem}>
                                      <Text style={styles.detailedPriceLabel}>• {key}:</Text>
                                      <Text style={styles.detailedPriceValue}>{value}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                          </View>
                          
                          {/* 예산 부합도 표시 */}
                          <View style={styles.budgetCompatibility}>
                            {(() => {
                              const userBudget = parseInt(totalBudget) * 10000;
                              const priceText = venue.price_range || venue.package_price || '';
                              
                              // 가격에서 숫자 추출 시도
                              const priceMatch = priceText.match(/([0-9,]+)/g);
                              let compatibility = 'unknown';
                              let compatibilityText = '가격 비교 불가';
                              let compatibilityColor = Colors.textSecondary;
                              
                              if (priceMatch && priceMatch.length > 0) {
                                const venuePrice = parseInt(priceMatch[0].replace(/,/g, '')) * 10000;
                                const priceDiff = ((venuePrice - userBudget) / userBudget) * 100;
                                
                                if (priceDiff <= -20) {
                                  compatibility = 'under';
                                  compatibilityText = '예산 여유 있음';
                                  compatibilityColor = '#26C976';
                                } else if (priceDiff <= 10) {
                                  compatibility = 'match';
                                  compatibilityText = '예산에 적합';
                                  compatibilityColor = '#26C976';
                                } else if (priceDiff <= 30) {
                                  compatibility = 'over';
                                  compatibilityText = '예산 약간 초과';
                                  compatibilityColor = '#FF8A00';
                                } else {
                                  compatibility = 'high';
                                  compatibilityText = '예산 크게 초과';
                                  compatibilityColor = '#FF6B6B';
                                }
                              }
                              
                              return (
                                <View style={[
                                  styles.compatibilityBadge,
                                  { backgroundColor: compatibilityColor + '20' }
                                ]}>
                                  <Ionicons 
                                    name={
                                      compatibility === 'under' ? 'trending-down' :
                                      compatibility === 'match' ? 'checkmark-circle' :
                                      compatibility === 'over' ? 'warning' : 'alert-circle'
                                    }
                                    size={14} 
                                    color={compatibilityColor}
                                  />
                                  <Text style={[styles.compatibilityText, { color: compatibilityColor }]}>
                                    {compatibilityText}
                                  </Text>
                                </View>
                              );
                            })()}
                          </View>
                        </View>
                        
                        {/* 추가 정보가 있다면 표시 */}
                        {(venue.specialty || venue.description) && (
                          <Text style={styles.venueDescription}>
                            {venue.specialty || venue.description}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 시장 현실성 평가 - 개선된 버전 */}
            {marketReality && marketReality.length > 0 && (
              <View style={styles.marketCard}>
                <View style={styles.marketHeader}>
                  <View style={[styles.marketIcon, {
                    backgroundColor: 
                      marketReality.includes('적정') || marketReality.includes('적절') ? '#E8F5E8' :
                      marketReality.includes('높음') || marketReality.includes('부족') || marketReality.includes('초과') ? '#FFE8E8' : '#FFF3E0'
                  }]}>
                    <Ionicons 
                      name={
                        marketReality.includes('적정') || marketReality.includes('적절') ? 'checkmark-circle' :
                        marketReality.includes('높음') || marketReality.includes('부족') || marketReality.includes('초과') ? 'alert-circle' : 'warning'
                      }
                      size={20} 
                      color={
                        marketReality.includes('적정') || marketReality.includes('적절') ? '#26C976' :
                        marketReality.includes('높음') || marketReality.includes('부족') || marketReality.includes('초과') ? '#FF6B6B' : '#FF8A00'
                      }
                    />
                  </View>
                  <View style={styles.marketContent}>
                    <Text style={styles.marketTitle}>💡 예산 vs 시장가격 분석</Text>
                    <Text style={[styles.marketStatus, {
                      color: 
                        marketReality.includes('적정') || marketReality.includes('적절') ? '#26C976' :
                        marketReality.includes('높음') || marketReality.includes('부족') || marketReality.includes('초과') ? '#FF6B6B' : '#FF8A00'
                    }]}>
                      {marketReality}
                    </Text>
                  </View>
                </View>
                <Text style={styles.marketDescription}>
                  {marketReality.includes('높음') || marketReality.includes('부족') || marketReality.includes('초과') ? 
                    `현재 ${location === 'seoul' ? '서울' : location} 지역의 ${eventType === 'wedding' ? '웨딩홀' : '장례식장'} 시장 가격이 설정 예산보다 높습니다. 예산을 늘리거나 더 경제적인 옵션을 고려해보세요.` :
                    marketReality.includes('낮음') || marketReality.includes('여유') ?
                    `설정한 예산으로 더 좋은 서비스를 이용할 수 있습니다. ${eventType === 'wedding' ? '추가 장식이나 서비스' : '추가 서비스나 더 좋은 시설'}를 고려해보세요.` :
                    `설정한 예산이 현재 ${location === 'seoul' ? '서울' : location} 지역의 ${eventType === 'wedding' ? '웨딩홀' : '장례식장'} 시장 가격과 적절합니다.`
                  }
                </Text>
                
                {/* 구체적인 예산 가이드 추가 */}
                <View style={styles.budgetGuide}>
                  <Text style={styles.budgetGuideTitle}>💡 예산 조정 가이드</Text>
                  <View style={styles.budgetOptions}>
                    {marketReality.includes('높음') || marketReality.includes('부족') ? (
                      <>
                        <Text style={styles.budgetOption}>• 예산 20-30% 증액 고려</Text>
                        <Text style={styles.budgetOption}>• 비수기(11-2월) 이용으로 20% 절약</Text>
                        <Text style={styles.budgetOption}>• 주중 이용으로 10-15% 절약</Text>
                      </>
                    ) : marketReality.includes('적정') || marketReality.includes('적절') ? (
                      <>
                        <Text style={styles.budgetOption}>• 현재 예산으로 충분히 가능</Text>
                        <Text style={styles.budgetOption}>• 업체 비교견적으로 5-10% 절약</Text>
                        <Text style={styles.budgetOption}>• 패키지 상품으로 추가 혜택</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.budgetOption}>• 프리미엄 옵션 추가 고려</Text>
                        <Text style={styles.budgetOption}>• 더 좋은 시설/서비스 선택</Text>
                        <Text style={styles.budgetOption}>• 추가 장식이나 서비스 업그레이드</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            )}
            {/* AI 신뢰도 및 인사이트 */}
            {aiConfidence > 0 && (
              <View style={styles.aiInsightsCard}>
                <View style={styles.aiInsightsHeader}>
                  <View style={styles.aiIcon}>
                    <Ionicons name="bulb" size={20} color="#26C976" />
                  </View>
                  <View style={styles.aiHeaderContent}>
                    <Text style={styles.aiInsightsTitle}>AI 분석 결과</Text>
                    <Text style={styles.aiConfidenceText}>신뢰도 {aiConfidence}%</Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <View style={[
                      styles.confidenceIndicator,
                      { 
                        backgroundColor: aiConfidence >= 80 ? '#26C976' : 
                                       aiConfidence >= 60 ? '#FFB800' : '#FF6B6B',
                        width: `${aiConfidence}%`
                      }
                    ]} />
                  </View>
                </View>
                
                {aiInsights.length > 0 && (
                  <View style={styles.insightsList}>
                    {aiInsights.map((insight, index) => (
                      <View key={index} style={styles.insightItem}>
                        <View style={[
                          styles.insightIcon,
                          { backgroundColor: 
                            insight.type === 'tip' ? '#E8F5E8' :
                            insight.type === 'warning' ? '#FFF3E0' : '#E3F2FD'
                          }
                        ]}>
                          <Ionicons 
                            name={
                              insight.type === 'tip' ? 'bulb' :
                              insight.type === 'warning' ? 'warning' : 'information-circle'
                            }
                            size={16} 
                            color={
                              insight.type === 'tip' ? '#26C976' :
                              insight.type === 'warning' ? '#FF8A00' : '#2196F3'
                            }
                          />
                        </View>
                        <Text style={styles.insightText}>{insight.message}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryTitle}>예산 요약</Text>
                  {/* 🔥 실제 가격 반영 여부 표시 */}
                  {aiInsights.some(insight => insight.message.includes('실제 세부 가격 정보로')) && (
                    <Text style={styles.realPriceIndicator}>
                      ✅ 실제 업체 가격 반영
                    </Text>
                  )}
                </View>
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
                            activeOpacity={0.7}
                          >
                            <Text style={styles.editButtonText}>수정</Text>
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

      {/* AI 로딩 풀스크린 오버레이 */}
      <AiLoadingOverlay
        visible={isCalculating}
        title="AI가 예산을 계산하고 있어요"
        messages={[
          '🤖 AI가 예산을 분석 중',
          '🏢 지역 업체 정보를 조사 중',
          '💰 항목별 금액을 산정 중',
          '📋 맞춤 조언을 준비 중',
        ]}
      />
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
  aiButtonDisabled: {
    opacity: 0.7,
  },
  
  // 옵션 선택
  optionScroll: {
    marginTop: 8,
  },
  optionContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  optionButtonTextActive: {
    color: Colors.white,
  },
  
  // AI 인사이트
  aiInsightsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiHeaderContent: {
    flex: 1,
  },
  aiInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  aiConfidenceText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  confidenceBadge: {
    width: 60,
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceIndicator: {
    height: '100%',
    borderRadius: 3,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
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
  realPriceIndicator: {
    fontSize: 12,
    color: '#26C976',
    fontWeight: '500',
    marginTop: 2,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: -0.2,
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
  
  // 추천 업체
  venuesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  venuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  venuesIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  venuesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  venuesList: {
    gap: 12,
  },
  venueItem: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  venueInfo: {
    marginBottom: 8,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  venuePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignSelf: 'flex-start',
    gap: 6,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  
  // 시장 현실성
  marketCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  marketIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  marketContent: {
    flex: 1,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  marketStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  marketDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  budgetGuide: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  budgetGuideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  budgetOptions: {
    gap: 6,
  },
  budgetOption: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  
  // 웨딩홀/업체 정보 개선된 스타일
  venueItem: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  venueMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  venuePriceSection: {
    marginBottom: 8,
  },
  priceInfo: {
    marginBottom: 8,
  },
  venuePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  budgetCompatibility: {
    alignItems: 'flex-start',
  },
  compatibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  compatibilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  venueDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  
  // 🔥 세부 가격 정보 스타일
  detailedPricesContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  detailedPricesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  detailedPricesList: {
    gap: 4,
  },
  detailedPriceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailedPriceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailedPriceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'right',
  },
});