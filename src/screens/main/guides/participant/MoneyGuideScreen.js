// src/screens/main/guides/MoneyGuideScreen.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// DeepSeek API 설정
const DEEPSEEK_API_KEY = 'sk-6dc707c794ba4207b8f7cf4be6eef1a7';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 토스 스타일 컬러 시스템
const TossColors = {
  primary: '#0064FF',
  blue50: '#F0F6FF',
  blue100: '#D9E9FF',
  blue500: '#0064FF',
  blue600: '#0052CC',
  
  gray50: '#F9FAFB',
  gray100: '#F2F4F6',
  gray200: '#E5E8EB',
  gray300: '#D1D6DB',
  gray400: '#B0B8C1',
  gray500: '#8B95A1',
  gray600: '#6B7684',
  gray700: '#4E5968',
  gray800: '#333D4B',
  gray900: '#191F28',
  
  red: '#FF6B6B',
  green: '#32D74B',
  yellow: '#FFD60A',
  purple: '#5856D6',
  white: '#FFFFFF',
};

export default function MoneyGuideScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIntimacy, setSelectedIntimacy] = useState(-1);
  const [selectedSalary, setSelectedSalary] = useState(''); // 월급 상태 추가
  const [showResult, setShowResult] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // 애니메이션 상태 추가
  const [isLoading, setIsLoading] = useState(false); // API 로딩 상태
  const [apiResult, setApiResult] = useState(null); // API 결과 저장
  const [error, setError] = useState(null); // 에러 상태
  const [loadingMessage, setLoadingMessage] = useState('AI 분석 준비 중'); // 로딩 메시지
  
  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current; // 로딩 점 애니메이션

  // 경조사 타입
  const eventTypes = [
    { id: 'wedding', label: '결혼식', emoji: '💒' },
    { id: 'funeral', label: '장례식', emoji: '🕯️' },
  ];

  // 관계 카테고리
  const categories = [
    { id: 'family', label: '가족', emoji: '👨‍👩‍👧‍👦', description: '부모, 형제자매' },
    { id: 'relative', label: '친척', emoji: '👥', description: '삼촌, 이모, 사촌' },
    { id: 'friend', label: '친구', emoji: '👫', description: '학교, 동네 친구' },
    { id: 'company', label: '회사', emoji: '💼', description: '직장 동료, 상사' },
    { id: 'acquaintance', label: '지인', emoji: '🤝', description: '아는 사람' },
  ];

  // 친밀도 단계
  const intimacyLevels = [
    { level: 0, label: '전혀 모름', description: '이름만 아는 사이', emoji: '😐' },
    { level: 1, label: '어색함', description: '가끔 마주치지만 대화는 없음', emoji: '😅' },
    { level: 2, label: '인사하는 사이', description: '만나면 인사 정도', emoji: '🙂' },
    { level: 3, label: '가끔 대화', description: '같이 밥 먹거나 얘기함', emoji: '😊' },
    { level: 4, label: '친한 사이', description: '자주 만나고 연락함', emoji: '😄' },
    { level: 5, label: '매우 친함', description: '절친, 가족 같은 사이', emoji: '🥰' },
  ];

  // 가족/친척용 친밀도 (다른 레벨)
  const familyIntimacyLevels = [
    { level: 3, label: '가끔 연락하는', description: '명절이나 행사 때 만나는 사이', emoji: '😊' },
    { level: 4, label: '자주 보는', description: '정기적으로 만나고 연락하는 사이', emoji: '😄' },
    { level: 5, label: '매우 가까운', description: '매우 친하고 소중한 관계', emoji: '🥰' },
  ];

  // 월급 옵션 (세후 기준)
  const salaryOptions = [
    { id: 'student', label: '무직/학생', emoji: '🎓', description: '수입이 없는 상태' },
    { id: 'under200', label: '200만원 미만', emoji: '💼', description: '세후 월급 기준' },
    { id: '200to300', label: '200-300만원', emoji: '💰', description: '세후 월급 기준' },
    { id: '300to400', label: '300-400만원', emoji: '💵', description: '세후 월급 기준' },
    { id: '400to500', label: '400-500만원', emoji: '💸', description: '세후 월급 기준' },
    { id: 'over500', label: '500만원 이상', emoji: '💎', description: '세후 월급 기준' },
  ];

  // 로딩 메시지 순환
  const loadingMessages = [
    '🤖 AI 분석 준비 중',
    '📊 관계 데이터 분석 중',
    '💰 적정 금액 계산 중',
    '✨ 맞춤 추천 생성 중'
  ];

  // 프롬프트 생성
  const createPrompt = (eventType, relationshipType, intimacyLevel, salaryLevel) => {
    const eventTypeKor = {
      'wedding': '결혼식',
      'funeral': '장례식'
    };

    const relationshipTypeKor = {
      'family': '가족',
      'relative': '친척',
      'friend': '친구',
      'company': '회사 동료',
      'acquaintance': '지인'
    };

    const intimacyLevelKor = {
      0: '전혀 모르는 사이',
      1: '어색한 사이',
      2: '인사하는 사이',
      3: '가끔 대화하는 사이',
      4: '친한 사이',
      5: '매우 친한 사이'
    };

    const salaryLevelKor = {
      'student': '무직/학생 (수입 없음)',
      'under200': '월급 200만원 미만 (저소득)',
      '200to300': '월급 200-300만원 (평균 소득)',
      '300to400': '월급 300-400만원 (중상위 소득)',
      '400to500': '월급 400-500만원 (상위 10% 고소득)',
      'over500': '월급 500만원 이상 (상위 5% 최고소득)'
    };

    // 구체적인 금액 기준 제시
    let specificGuideline = '';
    
    if (relationshipType === 'friend' && intimacyLevel === 5) {
      // 매우 친한 친구
      if (salaryLevel === 'student') {
        specificGuideline = '무직/학생이지만 매우 친한 친구이므로 최소 10-15만원은 준비해야 합니다.';
      } else if (salaryLevel === 'under200') {
        specificGuideline = '저소득이지만 매우 친한 친구이므로 15-20만원 정도가 적절합니다.';
      } else if (salaryLevel === '200to300') {
        specificGuideline = '평균 소득으로 매우 친한 친구에게는 20-25만원이 적절합니다.';
      } else if (salaryLevel === '300to400') {
        specificGuideline = '중상위 소득으로 매우 친한 친구에게는 25-35만원이 적절합니다.';
      } else if (salaryLevel === '400to500') {
        specificGuideline = '상위 10% 고소득자로 매우 친한 친구에게는 30-50만원이 적절합니다.';
      } else if (salaryLevel === 'over500') {
        specificGuideline = '상위 5% 최고소득자로 매우 친한 친구에게는 40-60만원이 적절합니다.';
      }
    } else if (relationshipType === 'friend' && intimacyLevel === 4) {
      // 친한 친구
      if (salaryLevel === 'student') {
        specificGuideline = '무직/학생이지만 친한 친구이므로 8-12만원 정도가 적절합니다.';
      } else if (salaryLevel === '400to500') {
        specificGuideline = '상위 10% 고소득자로 친한 친구에게는 20-30만원이 적절합니다.';
      } else if (salaryLevel === 'over500') {
        specificGuideline = '상위 5% 최고소득자로 친한 친구에게는 25-40만원이 적절합니다.';
      }
    }

    return `한국 ${eventTypeKor[eventType]} 축의금을 추천해주세요.

== 상황 정보 ==
관계: ${relationshipTypeKor[relationshipType]}
친밀도: ${intimacyLevelKor[intimacyLevel]}
경제적 상황: ${salaryLevelKor[salaryLevel]}

== 중요한 현실 기준 ==
${specificGuideline}

== 절대 준수 사항 ==
- 무직/학생도 체면상 최소 8-10만원은 준비함
- 월급 400-500만원은 한국에서 상위 10% 고소득자임 (절대 중간 수준 아님)
- 매우 친한 친구에게 10만원은 2024년 기준으로 너무 적음
- 고소득자는 사회적 체면도 고려해야 함

2024년 한국 기준으로 위 상황에 맞는 현실적인 축의금을 JSON으로만 응답하세요.`;
  };

  // 금액 검증
  const validateAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return 100000;
    }
    if (amount > 5000000) return 500000;
    if (amount < 30000) return 50000;
    return Math.round(amount);
  };

  // 짝수 금액으로 반올림
  const roundToEvenAmount = (amount) => {
    const rounded = Math.round(amount / 10000) * 10000;
    if (rounded % 20000 !== 0) {
      return Math.round(rounded / 20000) * 20000;
    }
    return rounded;
  };

  // 결과 검증 (AI가 말도 안 되는 추천하면 무시하고 우리 로직 사용)
  const validateResult = (result) => {
    let { recommendedAmount, minAmount, maxAmount, reasoning, tips } = result;

    // 현실성 검증 - AI가 말도 안 되는 추천하면 무시
    const shouldUseOurLogic = checkIfAIRecommendationIsUnrealistic(recommendedAmount);
    
    if (shouldUseOurLogic) {
      console.log('🚫 AI 추천이 비현실적이므로 자체 로직 사용');
      return getFallbackRecommendation();
    }

    // 숫자 검증
    recommendedAmount = validateAmount(recommendedAmount);
    minAmount = validateAmount(minAmount || recommendedAmount - 50000);
    maxAmount = validateAmount(maxAmount || recommendedAmount + 50000);

    // 범위 검증
    if (minAmount > recommendedAmount) minAmount = recommendedAmount - 20000;
    if (maxAmount < recommendedAmount) maxAmount = recommendedAmount + 30000;

    // 짝수 금액으로 보정
    recommendedAmount = roundToEvenAmount(recommendedAmount);
    minAmount = roundToEvenAmount(Math.max(minAmount, 30000));
    maxAmount = roundToEvenAmount(maxAmount);

    return {
      recommendedAmount,
      minAmount,
      maxAmount,
      reasoning: reasoning || '표준적인 축의금 기준에 따른 추천입니다.',
      tips: Array.isArray(tips) && tips.length > 0 ? tips.slice(0, 3) : [
        '짝수 금액을 준비하세요',
        '깨끗한 지폐로 준비하세요',
        '봉투에 정성스럽게 이름을 적어주세요'
      ]
    };
  };

  // AI 추천이 현실적인지 검증 (새로운 기준에 맞게 수정)
  const checkIfAIRecommendationIsUnrealistic = (amount) => {
    // 가족 관계 검증
    if (selectedCategory === 'family') {
      if (selectedIntimacy === 5 && amount < 500000) {
        console.log('🚫 매우 가까운 가족에게 50만원 미만 추천 - 비현실적');
        return true;
      }
      if (selectedIntimacy === 4 && amount < 300000) {
        console.log('🚫 가까운 가족에게 30만원 미만 추천 - 비현실적');
        return true;
      }
      if (amount < 200000) {
        console.log('🚫 가족에게 20만원 미만 추천 - 비현실적');
        return true;
      }
    }
    
    // 친척 관계 검증
    if (selectedCategory === 'relative') {
      if (selectedIntimacy === 5 && amount < 200000) {
        console.log('🚫 매우 가까운 친척에게 20만원 미만 추천 - 비현실적');
        return true;
      }
      if (selectedIntimacy === 4 && amount < 150000) {
        console.log('🚫 가까운 친척에게 15만원 미만 추천 - 비현실적');
        return true;
      }
    }
    
    // 친구 관계 + 고소득자 검증
    if (selectedCategory === 'friend') {
      if (selectedIntimacy === 5) {
        // 매우 친한 친구
        if ((selectedSalary === '400to500' || selectedSalary === 'over500') && amount < 250000) {
          console.log('🚫 고소득자인데 매우 친한 친구에게 25만원 미만 추천 - 비현실적');
          return true;
        }
        if (selectedSalary === '300to400' && amount < 200000) {
          console.log('🚫 중상위 소득자인데 매우 친한 친구에게 20만원 미만 추천 - 비현실적');
          return true;
        }
        if (amount < 150000 && selectedSalary !== 'student') {
          console.log('🚫 매우 친한 친구에게 15만원 미만 추천 - 비현실적');
          return true;
        }
      } else if (selectedIntimacy === 4) {
        // 친한 친구
        if ((selectedSalary === '400to500' || selectedSalary === 'over500') && amount < 180000) {
          console.log('🚫 고소득자인데 친한 친구에게 18만원 미만 추천 - 비현실적');
          return true;
        }
      }
    }

    // 회사 관계에서 너무 높은 금액 검증
    if (selectedCategory === 'company') {
      if (selectedIntimacy <= 2 && amount > 150000) {
        console.log('🚫 잘 모르는 회사 동료에게 15만원 초과 추천 - 비현실적');
        return true;
      }
    }

    // 지인 관계에서 너무 높은 금액 검증
    if (selectedCategory === 'acquaintance') {
      if (amount > 200000) {
        console.log('🚫 지인에게 20만원 초과 추천 - 비현실적');
        return true;
      }
    }

    return false;
  };

  // 2024-2025년 현실적인 축의금 계산 로직 (완전 새로 작성)
  const getFallbackRecommendation = () => {
    // 1단계: 관계별 기본 금액 (2024년 실제 기준)
    let baseAmount = 0;
    
    if (selectedEventType === 'wedding') {
      switch (selectedCategory) {
        case 'family':
          // 가족: 친밀도에 따라 차등
          if (selectedIntimacy === 5) baseAmount = 1000000; // 매우 가까운 가족 (형제자매, 자녀)
          else if (selectedIntimacy === 4) baseAmount = 700000; // 가까운 가족
          else baseAmount = 500000; // 일반 가족
          break;
        case 'relative':
          // 친척: 친밀도에 따라 큰 차이
          if (selectedIntimacy === 5) baseAmount = 500000; // 매우 가까운 친척 (사촌형제 등)
          else if (selectedIntimacy === 4) baseAmount = 300000; // 가까운 친척 (삼촌, 이모)
          else baseAmount = 200000; // 일반 친척
          break;
        case 'friend':
          // 친구: 친밀도가 매우 중요
          if (selectedIntimacy === 5) baseAmount = 300000; // 절친
          else if (selectedIntimacy === 4) baseAmount = 200000; // 친한 친구
          else if (selectedIntimacy === 3) baseAmount = 150000; // 보통 친구
          else if (selectedIntimacy === 2) baseAmount = 100000; // 아는 친구
          else baseAmount = 50000; // 거의 모르는 사이
          break;
        case 'company':
          // 회사: 친밀도와 직급 관계
          if (selectedIntimacy === 5) baseAmount = 200000; // 매우 가까운 동료
          else if (selectedIntimacy === 4) baseAmount = 150000; // 가까운 동료
          else if (selectedIntimacy === 3) baseAmount = 100000; // 보통 동료
          else if (selectedIntimacy === 2) baseAmount = 70000; // 아는 동료
          else baseAmount = 50000; // 거의 모르는 동료
          break;
        case 'acquaintance':
          // 지인: 대부분 최소 금액
          if (selectedIntimacy >= 3) baseAmount = 100000; // 아는 지인
          else baseAmount = 50000; // 거의 모르는 지인
          break;
      }
    } else {
      // 장례식 조의금: 결혼식의 60-70% 수준
      switch (selectedCategory) {
        case 'family':
          if (selectedIntimacy === 5) baseAmount = 600000; // 매우 가까운 가족
          else if (selectedIntimacy === 4) baseAmount = 400000; // 가까운 가족
          else baseAmount = 300000; // 일반 가족
          break;
        case 'relative':
          if (selectedIntimacy === 5) baseAmount = 300000; // 매우 가까운 친척
          else if (selectedIntimacy === 4) baseAmount = 180000; // 가까운 친척
          else baseAmount = 120000; // 일반 친척
          break;
        case 'friend':
          if (selectedIntimacy === 5) baseAmount = 180000; // 절친
          else if (selectedIntimacy === 4) baseAmount = 120000; // 친한 친구
          else if (selectedIntimacy === 3) baseAmount = 90000; // 보통 친구
          else if (selectedIntimacy === 2) baseAmount = 60000; // 아는 친구
          else baseAmount = 30000; // 거의 모르는 사이
          break;
        case 'company':
          if (selectedIntimacy === 5) baseAmount = 120000; // 매우 가까운 동료
          else if (selectedIntimacy === 4) baseAmount = 90000; // 가까운 동료
          else if (selectedIntimacy === 3) baseAmount = 60000; // 보통 동료
          else if (selectedIntimacy === 2) baseAmount = 40000; // 아는 동료
          else baseAmount = 30000; // 거의 모르는 동료
          break;
        case 'acquaintance':
          if (selectedIntimacy >= 3) baseAmount = 60000; // 아는 지인
          else baseAmount = 30000; // 거의 모르는 지인
          break;
      }
    }
    
    // 2단계: 월급별 현실적 조정 (더 세밀하게)
    let salaryMultiplier = 1;
    switch (selectedSalary) {
      case 'student':
        // 무직/학생: 관계별로 다르게 적용
        if (selectedCategory === 'family') salaryMultiplier = 0.3; // 가족한테는 최소한 체면
        else if (selectedCategory === 'relative') salaryMultiplier = 0.4;
        else if (selectedCategory === 'friend') salaryMultiplier = 0.5;
        else salaryMultiplier = 0.6;
        break;
      case 'under200':
        // 저소득: 부담 줄여주되 최소 체면 유지
        salaryMultiplier = 0.7;
        break;
      case '200to300':
        // 평균 소득: 기준점
        salaryMultiplier = 1.0;
        break;
      case '300to400':
        // 중상위 소득: 조금 더 여유롭게
        salaryMultiplier = 1.25;
        break;
      case '400to500':
        // 고소득: 사회적 체면 고려
        salaryMultiplier = 1.6;
        break;
      case 'over500':
        // 최고소득: 충분한 체면 유지
        salaryMultiplier = 2.1;
        break;
    }
    
    // 3단계: 최종 계산
    let finalAmount = Math.round(baseAmount * salaryMultiplier);
    
    // 4단계: 현실적 최소/최대 보장
    let minGuarantee = 0;
    let maxLimit = 0;
    
    if (selectedCategory === 'family') {
      minGuarantee = selectedSalary === 'student' ? 200000 : 300000;
      maxLimit = 3000000;
    } else if (selectedCategory === 'relative') {
      minGuarantee = selectedSalary === 'student' ? 50000 : 100000;
      maxLimit = 1000000;
    } else if (selectedCategory === 'friend') {
      if (selectedIntimacy >= 4) {
        minGuarantee = selectedSalary === 'student' ? 80000 : 100000;
      } else {
        minGuarantee = selectedSalary === 'student' ? 50000 : 70000;
      }
      maxLimit = 800000;
    } else if (selectedCategory === 'company') {
      minGuarantee = selectedSalary === 'student' ? 30000 : 50000;
      maxLimit = 500000;
    } else {
      minGuarantee = selectedSalary === 'student' ? 30000 : 50000;
      maxLimit = 300000;
    }
    
    // 최소/최대 제한 적용
    finalAmount = Math.max(finalAmount, minGuarantee);
    finalAmount = Math.min(finalAmount, maxLimit);
    
    // 5단계: 짝수 금액으로 반올림
    finalAmount = roundToEvenAmount(finalAmount);
    
    // 6단계: 범위 설정
    const rangePercent = selectedCategory === 'family' ? 0.3 : 0.25; // 가족은 범위를 더 넓게
    const minAmount = roundToEvenAmount(Math.max(finalAmount * (1 - rangePercent), minGuarantee));
    const maxAmount = roundToEvenAmount(Math.min(finalAmount * (1 + rangePercent), maxLimit));
    
    // 7단계: 설명 생성
    const relationshipDesc = {
      'family': '가족',
      'relative': '친척',
      'friend': '친구',
      'company': '회사 동료',
      'acquaintance': '지인'
    };
    
    const salaryDesc = {
      'student': '학생/무직',
      'under200': '저소득층',
      '200to300': '평균 소득',
      '300to400': '중상위 소득',
      '400to500': '고소득층',
      'over500': '최고소득층'
    };
    
    const intimacyDesc = {
      0: '거의 모르는',
      1: '어색한',
      2: '인사하는',
      3: '가끔 대화하는',
      4: '가까운',
      5: '매우 가까운'
    };

    return {
      recommendedAmount: finalAmount,
      minAmount,
      maxAmount,
      reasoning: `${salaryDesc[selectedSalary]} 수준에서 ${intimacyDesc[selectedIntimacy]} ${relationshipDesc[selectedCategory]} 관계를 고려한 2024년 현실적인 추천입니다. ${selectedSalary === 'over500' || selectedSalary === '400to500' ? '고소득자로서 사회적 체면도 고려했습니다.' : selectedSalary === 'student' ? '경제적 부담을 고려하되 최소한의 예의는 지키는 금액입니다.' : '적절한 수준의 축의금입니다.'}`,
      tips: [
        selectedCategory === 'family' ? '가족 관계에서는 넉넉하게 준비하는 것이 좋아요' : '관계를 고려한 적절한 금액이에요',
        selectedEventType === 'wedding' 
          ? '결혼식은 인생의 중요한 순간이니 마음을 담아 준비하세요'
          : '조의금은 고인을 추모하고 유족을 위로하는 마음을 담아주세요',
        selectedSalary === 'over500' || selectedSalary === '400to500'
          ? '고소득자라면 향후 관계 유지도 고려해서 준비하세요'
          : '본인의 경제 상황에 무리가 되지 않는 선에서 준비하세요'
      ]
    };
  };

  // 프로그레스 업데이트
  useEffect(() => {
    const progress = ((currentStep - 1) / 4) * 100; // 총 5단계로 변경
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // 로딩 애니메이션 및 메시지 변경
  useEffect(() => {
    if (isLoading) {
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 1000);

      // 점 애니메이션
      const dotAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      dotAnimation.start();

      return () => {
        clearInterval(messageInterval);
        dotAnimation.stop();
      };
    }
  }, [isLoading]);

  // 단계 전환 애니메이션
  const animateStepTransition = () => {
    setIsAnimating(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false, // 그림자 애니메이션을 위해 false로 변경
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // 애니메이션 완료 후 약간의 지연을 두고 상태 업데이트
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    });
  };

  // DeepSeek API를 사용한 축의금 추천
  const getAIRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage(loadingMessages[0]);
    
    try {
      console.log('AI 추천 시작...');
      
      // API 호출
      const prompt = createPrompt(selectedEventType, selectedCategory, selectedIntimacy, selectedSalary);
      
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `당신은 한국의 경조사 예절과 축의금 문화에 대한 전문가입니다. 
              사용자의 상황에 맞는 적절한 축의금을 추천해주세요. 
              
              응답은 반드시 다음과 같은 JSON 형태로만 제공하고, 다른 텍스트는 절대 포함하지 마세요:
              {"recommendedAmount": 100000, "minAmount": 80000, "maxAmount": 120000, "reasoning": "추천 이유를 한국어로 설명", "tips": ["팁1", "팁2", "팁3"]}
              
              주의사항:
              - JSON 외의 다른 텍스트 절대 금지
              - 마크다운이나 코드블록 사용 금지  
              - 모든 금액은 숫자로만 표기
              - 짝수 금액으로 추천 (20,000원 단위)
              - 월급이 적은 경우 부담 없는 현실적 금액 추천
              - 월급이 많은 경우 체면을 지킬 수 있는 적절한 금액 추천`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.1,
          stream: false
        })
      });

      console.log('API 응답 상태:', response.status);

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('API 응답:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('잘못된 API 응답');
      }

      const content = data.choices[0].message.content.trim();
      console.log('응답 내용:', content);
      
      // JSON 파싱
      try {
        // JSON 부분만 추출
        const jsonMatch = content.match(/\{.*\}/s);
        if (!jsonMatch) {
          throw new Error('JSON을 찾을 수 없음');
        }

        const result = JSON.parse(jsonMatch[0]);
        console.log('파싱 결과:', result);
        
        // 결과 검증
        const validatedResult = validateResult(result);
        setApiResult(validatedResult);
        return validatedResult;
        
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('원본 응답:', content);
        throw parseError;
      }
      
    } catch (error) {
      console.error('AI 추천 오류:', error);
      setError('AI 추천을 가져오는 중 오류가 발생했습니다.');
      
      // 에러 시 기본값 반환
      const fallbackResult = getFallbackRecommendation();
      setApiResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsLoading(false);
      dotAnim.setValue(0); // 애니메이션 초기화
    }
  };

  // 이벤트 선택
  const selectEvent = (event) => {
    setSelectedEventType(event);
  };

  // 관계 선택
  const selectRelation = (relation) => {
    setSelectedCategory(relation);
  };

  // 친밀도 선택
  const selectIntimacy = (intimacy) => {
    setSelectedIntimacy(intimacy);
  };

  // 월급 선택
  const selectSalary = (salary) => {
    console.log('월급 선택 전 상태:', selectedSalary);
    setSelectedSalary(salary);
    console.log('월급 선택:', salary);
    console.log('월급 선택 직후 상태:', selectedSalary); // 이건 아직 이전 값일 것
  };

  // selectedSalary가 변경될 때마다 로그 출력
  useEffect(() => {
    console.log('selectedSalary 상태 변경됨:', selectedSalary);
    
    // 버튼 활성화 조건 확인
    const enabled = currentStep === 4 ? !!selectedSalary : true;
    console.log('4단계 버튼 활성화 상태:', enabled, 'selectedSalary 존재:', !!selectedSalary);
  }, [selectedSalary, currentStep]);

  // 다음 단계
  const nextStep = async () => {
    if (currentStep === 1 && !selectedEventType) return;
    if (currentStep === 2 && !selectedCategory) return;
    if (currentStep === 3 && selectedIntimacy === -1) return;
    if (currentStep === 4 && !selectedSalary) return;

    if (currentStep < 5) {
      if (currentStep === 4) {
        // 마지막 단계에서 AI 추천 받기
        const result = await getAIRecommendation();
        if (result) {
          setCurrentStep(currentStep + 1);
          animateStepTransition();
          setShowResult(true);
          
          // 결과 화면 애니메이션
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } else {
        setCurrentStep(currentStep + 1);
        animateStepTransition();
      }
    }
  };

  // 이전 단계
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      animateStepTransition();
      
      if (currentStep === 5) {
        setShowResult(false);
        scaleAnim.setValue(0);
        slideAnim.setValue(0);
      }
    }
  };

  // 초기화
  const resetApp = () => {
    setCurrentStep(1);
    setSelectedEventType('');
    setSelectedCategory('');
    setSelectedIntimacy(-1);
    setShowResult(false);
    setIsAnimating(false); // 애니메이션 상태 초기화
    setIsLoading(false); // 로딩 상태 초기화
    setApiResult(null); // API 결과 초기화
    setError(null); // 에러 상태 초기화
    scaleAnim.setValue(0);
    slideAnim.setValue(0);
    fadeAnim.setValue(1);
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 현재 단계에서 다음 버튼 활성화 여부
  const isNextEnabled = () => {
    if (isLoading) return false; // 로딩 중에는 비활성화
    
    switch (currentStep) {
      case 1: return !!selectedEventType;
      case 2: return !!selectedCategory;
      case 3: return selectedIntimacy !== -1;
      default: return false;
    }
  };

  // 결과 데이터 (API 결과 또는 기본값 사용)
  const getResultData = () => {
    if (apiResult) {
      // API 결과가 있으면 사용
      const relationTexts = {
        'family': '가족',
        'relative': '친척', 
        'friend': '친구',
        'company': '회사',
        'acquaintance': '지인'
      };
      
      const intimacyTexts = {
        0: '전혀 모르는',
        1: '어색한',
        2: '인사하는',
        3: '가끔 연락하는',
        4: '자주 보는',
        5: '매우 가까운'
      };
      
      return {
        amount: apiResult.recommendedAmount,
        minRange: apiResult.minAmount,
        maxRange: apiResult.maxAmount,
        relationText: relationTexts[selectedCategory],
        intimacyText: intimacyTexts[selectedIntimacy],
        emoji: selectedEventType === 'wedding' ? '💒' : '🕯️',
        reasoning: apiResult.reasoning,
        tips: apiResult.tips
      };
    }
    
    // API 결과가 없으면 기본값 반환
    return {
      amount: 100000,
      minRange: 80000,
      maxRange: 120000,
      relationText: '지인',
      intimacyText: '보통',
      emoji: '🎁',
      reasoning: '일반적인 기준에 따른 추천입니다.',
      tips: ['기본 팁1', '기본 팁2', '기본 팁3']
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 헤더 */}
      <LinearGradient
        colors={['#0064FF', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.appTitle}>축의금 똑똑하게</Text>
            <Text style={styles.appSubtitle}>AI가 추천하는 적정 축의금</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>🎁</Text>
          </View>
        </View>
      </LinearGradient>

      {/* 프로그레스 바 */}
      <View style={styles.progressContainer}>
        <Animated.View style={[
          styles.progressBar,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            })
          }
        ]} />
      </View>

      <ScrollView 
        style={styles.mainContent} 
        contentContainerStyle={styles.stepContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View style={[{ 
          opacity: fadeAnim,
          // 애니메이션 중 모든 그림자 완전 제거
          ...(isAnimating && {
            elevation: 0,
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
          })
        }]}>
          {/* 1단계: 경조사 선택 */}
          {currentStep === 1 && (
            <View style={styles.step}>
              <Text style={styles.stepTitle}>어떤 경조사인가요?</Text>
              <Text style={styles.stepDescription}>경조사 유형을 선택해주세요</Text>
              
              <View style={styles.eventOptions}>
                {eventTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.eventCard,
                      selectedEventType === type.id && styles.eventCardSelected,
                      !isAnimating && styles.eventCardShadow,
                      // 애니메이션 중 그림자 완전 제거
                      isAnimating && {
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowRadius: 0,
                        shadowOffset: { width: 0, height: 0 },
                      }
                    ]}
                    onPress={() => selectEvent(type.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.eventIcon,
                      !isAnimating && styles.eventIconShadow,
                      // 애니메이션 중 그림자 완전 제거
                      isAnimating && {
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowRadius: 0,
                        shadowOffset: { width: 0, height: 0 },
                      }
                    ]}>
                      <Text style={styles.eventEmoji}>{type.emoji}</Text>
                    </View>
                    <Text style={styles.eventTitle}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 2단계: 관계 선택 */}
          {currentStep === 2 && (
            <View style={styles.step}>
              <Text style={styles.stepTitle}>어떤 관계인가요?</Text>
              <Text style={styles.stepDescription}>해당하는 관계를 선택해주세요</Text>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.optionCard,
                    selectedCategory === category.id && styles.optionCardSelected,
                    !isAnimating && styles.optionCardShadow,
                    // 애니메이션 중 그림자 완전 제거
                    isAnimating && {
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}
                  onPress={() => selectRelation(category.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionIcon,
                      !isAnimating && styles.optionIconShadow,
                      // 애니메이션 중 그림자 완전 제거
                      isAnimating && {
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowRadius: 0,
                        shadowOffset: { width: 0, height: 0 },
                      }
                    ]}>
                      <Text style={styles.optionEmoji}>{category.emoji}</Text>
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[
                        styles.optionTitle,
                        selectedCategory === category.id && styles.optionTitleSelected
                      ]}>
                        {category.label}
                      </Text>
                      <Text style={[
                        styles.optionSubtitle,
                        selectedCategory === category.id && styles.optionSubtitleSelected
                      ]}>
                        {category.description}
                      </Text>
                    </View>
                    {selectedCategory === category.id && (
                      <View style={styles.optionCheck}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 3단계: 친밀도 선택 */}
          {currentStep === 3 && (
            <View style={styles.step}>
              <Text style={styles.stepTitle}>얼마나 가까운 사이인가요?</Text>
              <Text style={styles.stepDescription}>
                {(selectedCategory === 'family' || selectedCategory === 'relative') 
                  ? '가족 관계의 친밀도를 선택해주세요'
                  : '친밀도를 선택해주세요'
                }
              </Text>
              
              {((selectedCategory === 'family' || selectedCategory === 'relative') 
                ? familyIntimacyLevels 
                : intimacyLevels
              ).map((level) => (
                <TouchableOpacity
                  key={level.level}
                  style={[
                    styles.optionCard,
                    selectedIntimacy === level.level && styles.optionCardSelected,
                    !isAnimating && styles.optionCardShadow,
                    // 애니메이션 중 그림자 완전 제거
                    isAnimating && {
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}
                  onPress={() => selectIntimacy(level.level)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionIcon,
                      !isAnimating && styles.optionIconShadow,
                      // 애니메이션 중 그림자 완전 제거
                      isAnimating && {
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowRadius: 0,
                        shadowOffset: { width: 0, height: 0 },
                      }
                    ]}>
                      <Text style={styles.optionEmoji}>{level.emoji}</Text>
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[
                        styles.optionTitle,
                        selectedIntimacy === level.level && styles.optionTitleSelected
                      ]}>
                        {level.label}
                      </Text>
                      <Text style={[
                        styles.optionSubtitle,
                        selectedIntimacy === level.level && styles.optionSubtitleSelected
                      ]}>
                        {level.description}
                      </Text>
                    </View>
                    {selectedIntimacy === level.level && (
                      <View style={styles.optionCheck}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 4단계: 월급 선택 */}
          {currentStep === 4 && (
            <View style={styles.step}>
              <Text style={styles.stepTitle}>월급은 어느 정도인가요?</Text>
              <Text style={styles.stepDescription}>
                세후 기준으로 선택해주세요 (경제적 상황을 고려한 추천을 위해)
              </Text>
              
              {/* 디버깅용 - 현재 선택된 값 표시 */}
              {selectedSalary && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>선택됨: {selectedSalary}</Text>
                </View>
              )}
              
              {salaryOptions.map((salary) => (
                <TouchableOpacity
                  key={salary.id}
                  style={[
                    styles.optionCard,
                    selectedSalary === salary.id && styles.optionCardSelected,
                    !isAnimating && styles.optionCardShadow,
                    // 애니메이션 중 그림자 완전 제거
                    isAnimating && {
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}
                  onPress={() => {
                    console.log('월급 옵션 클릭:', salary.id);
                    selectSalary(salary.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionIcon,
                      !isAnimating && styles.optionIconShadow,
                      // 애니메이션 중 그림자 완전 제거
                      isAnimating && {
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowRadius: 0,
                        shadowOffset: { width: 0, height: 0 },
                      }
                    ]}>
                      <Text style={styles.optionEmoji}>{salary.emoji}</Text>
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[
                        styles.optionTitle,
                        selectedSalary === salary.id && styles.optionTitleSelected
                      ]}>
                        {salary.label}
                      </Text>
                      <Text style={[
                        styles.optionSubtitle,
                        selectedSalary === salary.id && styles.optionSubtitleSelected
                      ]}>
                        {salary.description}
                      </Text>
                    </View>
                    {selectedSalary === salary.id && (
                      <View style={styles.optionCheck}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 5단계: 결과 */}
          {currentStep === 5 && showResult && (
            <View style={styles.step}>
              <Animated.View style={[
                styles.resultContainer,
                !isAnimating && styles.resultContainerShadow,
                // 애니메이션 중 그림자 완전 제거
                isAnimating && {
                  elevation: 0,
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  shadowOffset: { width: 0, height: 0 },
                },
                {
                  opacity: scaleAnim,
                  transform: [
                    { scale: scaleAnim },
                    { 
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })
                    }
                  ]
                }
              ]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultEmoji}>{getResultData().emoji}</Text>
                  <Text style={styles.resultTitle}>AI 추천 축의금</Text>
                  <Text style={styles.resultSubtitle}>
                    {getResultData().relationText} 관계에서 "{getResultData().intimacyText}" 사이라면{'\n'}이 정도가 적당해요
                  </Text>
                </View>
                
                <View style={styles.amountDisplay}>
                  <Text style={styles.amountLabel}>추천 금액</Text>
                  <Text style={styles.amountValue}>{formatAmount(getResultData().amount)}</Text>
                  <View style={styles.amountRangeContainer}>
                    <Text style={styles.amountRange}>
                      {formatAmount(getResultData().minRange)} ~ {formatAmount(getResultData().maxRange)}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* 팁 섹션 */}
              <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>✨ AI 추천 팁</Text>
                
                {/* API 추천 이유 */}
                {apiResult && apiResult.reasoning && (
                  <View style={[
                    styles.tipItem,
                    !isAnimating && styles.tipItemShadow,
                    isAnimating && {
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}>
                    <View style={styles.tipIcon}>
                      <Text style={styles.tipIconText}>🤖</Text>
                    </View>
                    <Text style={styles.tipText}>{apiResult.reasoning}</Text>
                  </View>
                )}
                
                {/* API에서 받은 팁들 */}
                {getResultData().tips.map((tip, index) => (
                  <View key={index} style={[
                    styles.tipItem,
                    !isAnimating && styles.tipItemShadow,
                    isAnimating && {
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}>
                    <View style={styles.tipIcon}>
                      <Text style={styles.tipIconText}>
                        {index === 0 ? '💰' : index === 1 ? '✉️' : '⏰'}
                      </Text>
                    </View>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
                
                {/* 에러 표시 및 재시도 버튼 */}
                {error && (
                  <View style={[
                    styles.tipItem,
                    { backgroundColor: '#FFF2F2', borderColor: '#FFB8C6', borderWidth: 1 },
                    !isAnimating && styles.tipItemShadow,
                    isAnimating && {
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}>
                    <View style={styles.tipIcon}>
                      <Text style={styles.tipIconText}>⚠️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tipText, { color: '#D32F2F', marginBottom: 8 }]}>
                        {error}
                      </Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={async () => {
                          const result = await getAIRecommendation();
                          if (result) {
                            // 결과가 이미 setApiResult로 설정됨
                          }
                        }}
                        disabled={isLoading}
                      >
                        <Text style={styles.retryButtonText}>
                          {isLoading ? '재시도 중...' : '🔄 다시 시도'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* 버튼 영역 */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', '#FFFFFF']}
        style={[
          styles.buttonContainer,
          // 애니메이션 중 그림자 완전 제거
          isAnimating && {
            elevation: 0,
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
          }
        ]}
      >
        <View style={styles.buttonRow}>
          {currentStep > 1 && currentStep < 5 && (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={prevStep}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSecondaryText}>← 이전</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 5 ? (
            <TouchableOpacity
              style={[
                styles.btnPrimary,
                (!isNextEnabled || isLoading) && styles.btnDisabled,
                currentStep === 1 && { flex: 1 }
              ]}
              onPress={() => {
                console.log('=== 버튼 클릭 디버깅 ===');
                console.log('버튼 클릭, 활성화 상태:', isNextEnabled);
                console.log('currentStep:', currentStep);
                console.log('selectedSalary:', selectedSalary);
                console.log('isLoading:', isLoading);
                console.log('========================');
                
                if (isNextEnabled && !isLoading) {
                  nextStep();
                } else {
                  console.log('버튼 비활성화 상태로 클릭 무시');
                }
              }}
              disabled={!isNextEnabled || isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isNextEnabled && !isLoading ? ['#0064FF', '#4F46E5'] : ['#B0B8C1', '#8B95A1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Animated.Text style={[
                      styles.btnPrimaryText,
                      styles.loadingText,
                      {
                        opacity: dotAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        })
                      }
                    ]}>
                      {loadingMessage}
                      <Animated.Text style={{
                        opacity: dotAnim.interpolate({
                          inputRange: [0, 0.33, 0.66, 1],
                          outputRange: [0, 1, 0, 1],
                        })
                      }}>
                        ...
                      </Animated.Text>
                    </Animated.Text>
                  </View>
                ) : (
                  <Text style={styles.btnPrimaryText}>
                    {currentStep === 4 ? 
                      (selectedSalary ? 'AI 추천받기 🤖' : '월급을 선택해주세요') 
                      : '다음 →'
                    }
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={resetApp}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSecondaryText}>🔄 다시하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TossColors.white,
  },
  
  // 헤더
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TossColors.white,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  headerIcon: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerIconText: {
    fontSize: 22,
  },
  
  // 프로그레스 바
  progressContainer: {
    height: 4,
    backgroundColor: TossColors.gray100,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: TossColors.primary,
  },
  
  // 메인 컨텐츠
  mainContent: {
    flex: 1,
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120, // 버튼 영역을 위한 여백 증가
  },
  step: {
    minHeight: 400, // 최소 높이 설정으로 스크롤 가능하게
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TossColors.gray900,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepDescription: {
    fontSize: 16,
    color: TossColors.gray600,
    marginBottom: 32,
    lineHeight: 24,
  },
  
  // 이벤트 카드들
  eventOptions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  eventCard: {
    flex: 1,
    backgroundColor: TossColors.white,
    borderWidth: 2,
    borderColor: TossColors.gray200,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  eventCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  eventCardSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.blue50,
  },
  eventIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TossColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventIconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  eventEmoji: {
    fontSize: 28,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.gray900,
  },
  
  // 옵션 카드들
  optionCard: {
    backgroundColor: TossColors.white,
    borderWidth: 2,
    borderColor: TossColors.gray200,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  optionCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.blue50,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: TossColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.gray900,
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: TossColors.primary,
  },
  optionSubtitle: {
    fontSize: 14,
    color: TossColors.gray600,
  },
  optionSubtitleSelected: {
    color: TossColors.primary,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TossColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.white,
  },
  
  // 결과 화면
  resultContainer: {
    backgroundColor: TossColors.white,
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: TossColors.gray100,
  },
  resultContainerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TossColors.gray900,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: TossColors.gray600,
    textAlign: 'center',
    lineHeight: 24,
  },
  amountDisplay: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: TossColors.gray600,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '800',
    color: TossColors.primary,
    marginBottom: 12,
  },
  amountRangeContainer: {
    backgroundColor: 'rgba(0, 100, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  amountRange: {
    fontSize: 14,
    fontWeight: '500',
    color: TossColors.primary,
  },
  
  // 팁 섹션
  tipsSection: {
    backgroundColor: TossColors.gray50,
    borderRadius: 16,
    padding: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.gray900,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: TossColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipItemShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TossColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipIconText: {
    fontSize: 16,
  },
  tipText: {
    fontSize: 15,
    color: TossColors.gray700,
    flex: 1,
    lineHeight: 22,
  },
  
  // 버튼들
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnPrimary: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.white,
  },
  btnSecondary: {
    height: 56,
    backgroundColor: TossColors.gray100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.gray700,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: TossColors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: TossColors.white,
  },
  debugInfo: {
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F57F17',
  },
  debugText: {
    fontSize: 14,
    color: '#F57F17',
    fontWeight: '600',
    textAlign: 'center',
  },
});