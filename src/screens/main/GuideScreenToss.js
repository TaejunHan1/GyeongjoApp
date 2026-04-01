// src/screens/main/GuideScreenToss.js - 토스 스타일 가이드 화면
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
  BackHandler,
  Modal,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : RNStatusBar.currentHeight || 24;

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
};

export default function GuideScreenToss({ navigation, userInfo, session, isAuthenticated }) {
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [showPreparingModal, setShowPreparingModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [displayedHostFAQ, setDisplayedHostFAQ] = useState([]);
  const [displayedParticipantFAQ, setDisplayedParticipantFAQ] = useState([]);
  const [currentHostTip, setCurrentHostTip] = useState('');
  const [currentParticipantTip, setCurrentParticipantTip] = useState('');

  // 주최자 꿀팁 데이터
  const hostTips = [
    '평균 준비 기간은 결혼식 6개월, 장례식은 즉시 진행됩니다',
    '결혼식 예산의 40%는 웨딩홀, 30%는 스드메에 배정하세요',
    '청첩장은 예식 2개월 전에 발송하는 것이 적절합니다',
    '웨딩홀 예약은 최소 6개월 전에 하는 것이 안전합니다',
    '상조회사는 충분히 비교해보고 신중하게 선택하세요',
    '장례식장은 접근성을 최우선으로 고려하세요',
    '부주금 관리는 엑셀로 정리하면 나중에 편합니다',
    '결혼식 리허설은 꼭 1주일 전에 진행하세요',
    '비수기(11-2월)에는 20-30% 할인 혜택이 있습니다',
    '답례품은 실용적인 것으로 준비하는 것이 좋습니다',
    '사진 촬영은 날씨를 고려해 실내외 모두 준비하세요',
    '하객 수는 예상의 90% 정도로 계산하는 것이 정확합니다',
  ];

  // 참여자 꿀팁 데이터
  const participantTips = [
    '축의금은 관계와 나이를 고려해 결정하세요',
    '결혼식에는 밝은 색상의 옷을 입어도 좋습니다',
    '장례식 조의금은 홀수로 준비하는 것이 관례입니다',
    '예식장 도착은 시작 15분 전이 적절합니다',
    '검은색 정장은 경조사 필수 복장입니다',
    '부조금 봉투는 미리 준비해두면 편합니다',
    '온라인 송금도 요즘은 일반적으로 받아들여집니다',
    '임신 중이거나 영유아 동반 시 미리 양해를 구하세요',
    '조문은 오전 11시-오후 8시가 적절한 시간입니다',
    '화환보다는 현금이 실질적으로 도움이 됩니다',
    '못 가게 되면 미리 연락하고 축의금만 보내도 됩니다',
    '장례식장에서는 향수를 자제하는 것이 예의입니다',
  ];

  // Fisher-Yates 셔플 알고리즘으로 랜덤 선택
  const getRandomFAQ = (data, count = 6) => {
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  };


  // 화면 포커스 시 랜덤 데이터 생성 및 하드웨어 뒤로가기 처리
  useFocusEffect(
    React.useCallback(() => {
      // 랜덤 FAQ 생성
      const randomHostFAQ = getRandomFAQ(allHostQuickAnswers);
      const randomParticipantFAQ = getRandomFAQ(allParticipantQuickAnswers);
      
      console.log('🎲 주최자 FAQ 랜덤 생성:', randomHostFAQ.slice(0, 3).map(q => q.question));
      console.log('🎲 참여자 FAQ 랜덤 생성:', randomParticipantFAQ.slice(0, 3).map(q => q.question));
      
      setDisplayedHostFAQ(randomHostFAQ);
      setDisplayedParticipantFAQ(randomParticipantFAQ);
      
      // 랜덤 꿀팁 선택
      const randomHostTip = hostTips[Math.floor(Math.random() * hostTips.length)];
      const randomParticipantTip = participantTips[Math.floor(Math.random() * participantTips.length)];
      
      console.log('🎯 주최자 꿀팁:', randomHostTip);
      console.log('🎯 참여자 꿀팁:', randomParticipantTip);
      
      setCurrentHostTip(randomHostTip);
      setCurrentParticipantTip(randomParticipantTip);

      // Android에서만 동작하는 하드웨어 뒤로가기 버튼 처리
      if (Platform.OS === 'android') {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          // 사용자 타입이 선택된 상태에서 뒤로가기를 누르면
          if (selectedUserType) {
            // 선택 화면으로 돌아가기
            setSelectedUserType(null);
            return true; // 이벤트 처리됨 (기본 동작 방지)
          }
          // 선택 화면에서는 기본 동작 (다른 탭으로 이동 허용)
          return false;
        });

        // cleanup
        return () => backHandler.remove();
      }
    }, [selectedUserType])
  );

  // 사용자 타입 선택 데이터 - 토스 스타일로 수정
  const userTypes = [
    {
      id: 'host',
      title: '행사를 준비해요',
      subtitle: '결혼식·장례식 주최자',
      icon: 'calendar-outline',
    },
    {
      id: 'participant',
      title: '행사에 참석해요',
      subtitle: '하객·조문객',
      icon: 'people-outline',
    },
  ];

  // 주최자용 가이드 - 토스 스타일로 수정
  const hostGuideCategories = [
    {
      id: 'wedding-prep',
      title: '결혼식 준비',
      subtitle: '체크리스트부터 예산까지',
      icon: 'heart-outline',
      screen: 'WeddingPrepGuide',
      isNew: true,
    },
    {
      id: 'funeral-prep',
      title: '장례식 준비',
      subtitle: '절차와 준비사항',
      icon: 'flower-outline',
      screen: 'FuneralPrepGuide',
    },
    {
      id: 'budget-calc',
      title: '예산 계산기',
      subtitle: 'AI 예산 추천',
      icon: 'calculator-outline',
      screen: 'BudgetCalculator',
      isPreparing: true,
    },
    {
      id: 'vendor-list',
      title: '업체 찾기',
      subtitle: '검증된 파트너사',
      icon: 'business-outline',
      screen: 'VendorList',
      isPreparing: true,
    },
  ];

  // 참여자용 가이드 - 토스 스타일로 수정
  const participantGuideCategories = [
    {
      id: 'money',
      title: '축의금·조의금',
      subtitle: 'AI가 추천하는 적정 금액',
      icon: 'cash-outline',
      screen: 'MoneyGuide',
      isPopular: true,
    },
    {
      id: 'manner',
      title: '복장 가이드',
      subtitle: '상황별 올바른 복장',
      icon: 'shirt-outline',
      screen: 'MannerGuide',
    },
    {
      id: 'etiquette',
      title: '예절·매너',
      subtitle: '꼭 알아야 할 예절',
      icon: 'book-outline',
      screen: 'EtiquetteGuide',
    },
    {
      id: 'service',
      title: '추천 서비스',
      subtitle: '편리한 서비스 모음',
      icon: 'sparkles-outline',
      screen: 'RecommendService',
      isPreparing: true,
    },
  ];

  // 전체 FAQ 데이터 - 참여자용
  const allParticipantQuickAnswers = [
    {
      question: '부조금 봉투에 이름 어떻게 써요?',
      answer: '한자 또는 한글 정자체로 세로 작성',
      icon: '✍️',
    },
    {
      question: '결혼식 당일 축의금 언제 전달해요?',
      answer: '입장 시 접수대에서 방명록 작성 후',
      icon: '💌',
    },
    {
      question: '장례식장 조문 시간은 언제가 좋아요?',
      answer: '오전 11시~오후 8시가 적절',
      icon: '🕐',
    },
    {
      question: '임신 중인데 장례식장 가도 되나요?',
      answer: '가급적 피하거나 짧게 조문',
      icon: '🤰',
    },
    {
      question: '못 가게 됐을 때 축의금만 보내도 되나요?',
      answer: '계좌이체나 지인 통해 전달 가능',
      icon: '📱',
    },
    {
      question: '재혼이나 삼혼 축의금도 똑같나요?',
      answer: '초혼의 70~80% 수준이 일반적',
      icon: '💑',
    },
    {
      question: '코로나 시대 경조사 예절이 바뀔었나요?',
      answer: '비대면 참석, 마스크 대사 증가',
      icon: '😷',
    },
    {
      question: '결혼식에 아이와 함께 가도 될까요?',
      answer: '사전 허락 후 조용히 참석',
      icon: '👶',
    },
    {
      question: '온라인 축의금 송금은 언제 하나요?',
      answer: '예식 당일 오전까지 권장',
      icon: '📱',
    },
    {
      question: '예식장 주차는 어떻게 하나요?',
      answer: '미리 도착 또는 대중교통 이용',
      icon: '🏎️',
    },
    {
      question: '여름 결혼식 복장은 어떻게 하나요?',
      answer: '시원한 소재, 무릎 아래 길이',
      icon: '☀️',
    },
    {
      question: '결혼식 사진 촬영 예절은?',
      answer: '전문사진사 방해 금지, 플래시 자제',
      icon: '📷',
    },
    {
      question: '장례식장 복장과 메이크업은?',
      answer: '검은색 정장, 진한 화장 피하기',
      icon: '🕶️',
    },
    {
      question: '빈소에서 향을 피우는 방법은?',
      answer: '3개 집어 촛불에 점화 후 손으로 끌기',
      icon: '🕯️',
    },
    {
      question: '조문할 때 하지 말아야 할 말은?',
      answer: '"어떻게 돌아가셨어요?", "왜 이렇게 일찍.." 금기',
      icon: '🤐',
    },
    {
      question: '결혼식 중 울거나 감정이 북받칠 때는?',
      answer: '조용히 휴지로 닦기, 과도하게 울지 않기',
      icon: '😭',
    },
    {
      question: '주차가 어려운 예식장은 어떻게?',
      answer: '지하철/버스 또는 카풀 활용',
      icon: '🚇',
    },
  ];

  // 전체 FAQ 데이터 - 주최자용  
  const allHostQuickAnswers = [
    {
      question: '결혼식 예산은 얼마나 준비해야 하나요?',
      answer: '평균 3000~5000만원 (지역별 차이)',
      icon: '💰',
    },
    {
      question: '청첩장은 언제 보내는게 좋아요?',
      answer: '결혼식 2개월 전 발송 권장',
      icon: '💌',
    },
    {
      question: '예식장 예약은 언제 해야 하나요?',
      answer: '최소 6개월 전 예약 필수',
      icon: '🏛️',
    },
    {
      question: '부주 받은 금액 관리는 어떻게?',
      answer: '방명록과 함께 엑셀로 정리',
      icon: '📊',
    },
    {
      question: '장례식장 선택 기준은 뭔가요?',
      answer: '접근성, 시설, 가격 순으로 고려',
      icon: '🏥',
    },
    {
      question: '상조회사 가입이 필수인가요?',
      answer: '선택사항, 장단점 비교 후 결정',
      icon: '📋',
    },
    {
      question: '웨딩드레스는 언제 정해야 하나요?',
      answer: '최소 4-6개월 전 예약 및 시착',
      icon: '👰',
    },
    {
      question: '빈소 차리는 방법을 알려주세요',
      answer: '영정 사진 가운데, 제단과 상차림 앞쪽',
      icon: '🏺',
    },
    {
      question: '장례 기간은 며칠이 적당한가요?',
      answer: '3일장이 가장 일반적, 5일장은 여유 있게',
      icon: '📅',
    },
    {
      question: '화장과 매장 중 어떻게 선택하나요?',
      answer: '경제적 부담, 관리 편의성, 고인 의향 고려',
      icon: '⚰️',
    },
    {
      question: '웨딩 케이크는 어떻게 준비하나요?',
      answer: '1-2개월 전 주문, 맛보기 예약 필수',
      icon: '🎂',
    },
    {
      question: '리허설은 언제 어떻게 하나요?',
      answer: '예식 1주일 전 또는 전날, 주례와 가족 참석',
      icon: '🎬',
    },
    {
      question: '혼수는 어떻게 준비해야 하나요?',
      answer: '3-4개월 전부터 신혼집 구조 확정 후',
      icon: '🏠',
    },
    {
      question: '웨딩 플래너가 필요한가요?',
      answer: '처음 준비 또는 시간 부족 시 추천',
      icon: '📉',
    },
    {
      question: '예식 당일 준비사항은?',
      answer: '헤어메이크업 4시간 전, 결혼반지 확인',
      icon: '💍',
    },
    {
      question: '날씨가 안 좋을 때 대비책은?',
      answer: '하객용 우산, 실내 촬영 장소 확보',
      icon: '☔',
    },
    {
      question: '신혼집 준비는 언제부터 해야 하나요?',
      answer: '전세/매매는 6개월 전, 임대는 3개월 전',
      icon: '🏡',
    },
  ];

  // 인기 서비스 섹션 (하단 추가 콘텐츠)
  const popularServices = [
    {
      title: '모바일 청첩장',
      description: '카톡으로 간편하게',
      icon: '📱',
      badge: '준비중',
      isPreparing: true,
    },
    {
      title: '웨딩 사진 촬영',
      description: '전문 작가 매칭',
      icon: '📸',
      badge: '준비중',
      isPreparing: true,
    },
    {
      title: '부조금 관리',
      description: '자동 정산 서비스',
      icon: '💳',
      badge: '준비중',
      isPreparing: true,
    },
    {
      title: '화환/근조화환',
      description: '당일 배송 가능',
      icon: '🌸',
      badge: '준비중',
      isPreparing: true,
    },
  ];

  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType);
  };

  const handleBackToSelection = () => {
    setSelectedUserType(null);
  };

  const handleCategoryPress = (category) => {
    // 준비중인 메뉴 체크 (예산 계산기, 업체 찾기)
    if (category.id === 'budget-calc' || category.id === 'vendor-list') {
      showModal();
      return;
    }
    navigation.navigate(category.screen);
  };

  const showModal = () => {
    setShowPreparingModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowPreparingModal(false);
    });
  };

  // 사용자 타입 선택 화면 - 토스 스타일
  if (!selectedUserType) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        {/* 헤더 - 토스 스타일 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>경조사 가이드</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* 메인 질문 - 토스 스타일 */}
          <View style={styles.mainQuestion}>
            <Text style={styles.questionTitle}>어떤 도움이 필요하신가요?</Text>
            <Text style={styles.questionSubtitle}>상황에 맞는 가이드를 제공해드려요</Text>
          </View>

          {/* 역할 선택 버튼들 - 토스 스타일 플랫 디자인 */}
          <View style={styles.roleSelection}>
            {userTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.roleButton}
                onPress={() => handleUserTypeSelect(type.id)}
                activeOpacity={0.7}
              >
                <View style={styles.roleIconContainer}>
                  <Ionicons 
                    name={type.icon} 
                    size={24} 
                    color={TossColors.primary}
                  />
                </View>
                <View style={styles.roleContent}>
                  <Text style={styles.roleTitle}>{type.title}</Text>
                  <Text style={styles.roleSubtitle}>{type.subtitle}</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={TossColors.gray[400]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* 빠른 답변 섹션 - 토스 스타일 (역할별) */}
          <View style={styles.quickSection}>
            <View style={styles.quickHeader}>
              <View>
                <Text style={styles.quickTitle}>자주 묻는 질문</Text>
                <Text style={styles.quickSubtitle}>
                  역할을 선택하면 맞춤 FAQ를 볼 수 있어요
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.quickMore}>전체보기</Text>
              </TouchableOpacity>
            </View>
            
            {/* 주최자 FAQ */}
            <View style={styles.faqTabSection}>
              <Text style={styles.faqTabTitle}>👑 주최자 FAQ</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.quickScroll}
                contentContainerStyle={styles.quickScrollContent}
              >
                {displayedHostFAQ.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.quickCard}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quickCardHeader}>
                      <Text style={styles.quickIcon}>{item.icon}</Text>
                    </View>
                    <Text style={styles.quickQuestion} numberOfLines={2}>
                      {item.question}
                    </Text>
                    <Text style={styles.quickAnswer} numberOfLines={2}>
                      {item.answer}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 참여자 FAQ */}
            <View style={[styles.faqTabSection, { marginTop: 20 }]}>
              <Text style={styles.faqTabTitle}>👥 참여자 FAQ</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.quickScroll}
                contentContainerStyle={styles.quickScrollContent}
              >
                {displayedParticipantFAQ.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.quickCard}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quickCardHeader}>
                      <Text style={styles.quickIcon}>{item.icon}</Text>
                    </View>
                    <Text style={styles.quickQuestion} numberOfLines={2}>
                      {item.question}
                    </Text>
                    <Text style={styles.quickAnswer} numberOfLines={2}>
                      {item.answer}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* 인기 서비스 섹션 - 토스 스타일 */}
          <View style={styles.servicesSection}>
            <Text style={styles.servicesTitle}>인기 서비스</Text>
            <View style={styles.servicesGrid}>
              {popularServices.map((service, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.serviceItem,
                    service.isPreparing && styles.serviceItemDisabled
                  ]}
                  activeOpacity={service.isPreparing ? 1 : 0.7}
                  onPress={() => service.isPreparing && showModal()}
                >
                  <View style={styles.serviceIconContainer}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    {service.badge && (
                      <View style={[
                        styles.serviceBadge,
                        service.badge === 'HOT' && styles.hotBadge,
                        service.badge === 'NEW' && styles.newBadge,
                        service.badge === '준비중' && styles.preparingServiceBadge,
                      ]}>
                        <Text style={styles.serviceBadgeText}>{service.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.serviceTitle,
                    service.isPreparing && styles.serviceTitleDisabled
                  ]}>{service.title}</Text>
                  <Text style={[
                    styles.serviceDescription,
                    service.isPreparing && styles.serviceDescriptionDisabled
                  ]}>{service.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 안내 메시지 - 토스 스타일 */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={20} color={TossColors.primary} />
            </View>
            <Text style={styles.infoText}>
              AI가 관계와 상황을 분석해{'\n'}맞춤형 가이드를 제공합니다
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 선택된 타입에 따른 가이드 화면 - 토스 스타일
  const currentCategories = selectedUserType === 'host' ? hostGuideCategories : participantGuideCategories;
  const currentTitle = selectedUserType === 'host' ? '주최자 가이드' : '참여자 가이드';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 준비중 모달 */}
      <Modal
        transparent={true}
        visible={showPreparingModal}
        onRequestClose={hideModal}
        animationType="none"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={hideModal}
        >
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                opacity: modalAnimation,
                transform: [{
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalContent}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="construct-outline" size={48} color={TossColors.primary} />
                </View>
                <Text style={styles.modalTitle}>준비중이에요</Text>
                <Text style={styles.modalDescription}>
                  더 나은 서비스를 위해 열심히 준비하고 있어요.{'\n'}
                  조금만 기다려주세요!
                </Text>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={hideModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>확인</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
      
      {/* 헤더 with 뒤로가기 - 토스 스타일 */}
      <View style={styles.headerWithBack}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToSelection}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={TossColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitleWithBack}>{currentTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* 메뉴 리스트 - 토스 스타일 */}
        <View style={styles.menuSection}>
          {currentCategories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.menuItem,
                index === 0 && styles.menuItemFirst,
                index === currentCategories.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={[
                  styles.menuIconContainer,
                  category.isPreparing && styles.menuIconDisabled
                ]}>
                  <Ionicons 
                    name={category.icon} 
                    size={22} 
                    color={category.isPreparing ? TossColors.gray[400] : TossColors.primary}
                  />
                </View>
                <View style={styles.menuContent}>
                  <View style={styles.menuTitleRow}>
                    <Text style={[
                      styles.menuTitle,
                      category.isPreparing && styles.menuTitleDisabled
                    ]}>{category.title}</Text>
                    {category.isPreparing && (
                      <View style={styles.preparingBadge}>
                        <Text style={styles.preparingBadgeText}>준비중</Text>
                      </View>
                    )}
                    {category.isNew && !category.isPreparing && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                    {category.isPopular && !category.isPreparing && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>인기</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.menuSubtitle,
                    category.isPreparing && styles.menuSubtitleDisabled
                  ]}>{category.subtitle}</Text>
                </View>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={TossColors.gray[400]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* 추가 정보 카드 - 토스 스타일 */}
        <View style={styles.bottomCard}>
          <View style={styles.bottomCardHeader}>
            <Ionicons name="bulb-outline" size={20} color={TossColors.primary} />
            <Text style={styles.bottomCardTitle}>
              {selectedUserType === 'host' ? '준비 꿀팁' : '참석 꿀팁'}
            </Text>
          </View>
          <Text style={styles.bottomCardText}>
            {selectedUserType === 'host' 
              ? currentHostTip
              : currentParticipantTip}
          </Text>
          <TouchableOpacity style={styles.bottomCardButton} activeOpacity={0.7}>
            <Text style={styles.bottomCardButtonText}>더 알아보기</Text>
            <Ionicons name="arrow-forward" size={16} color={TossColors.primary} />
          </TouchableOpacity>
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
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.background,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
    marginTop: Platform.OS === 'ios' ? 0 : STATUSBAR_HEIGHT, // SafeAreaView가 iOS 상단 처리
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  headerWithBack: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: TossColors.background,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
    marginTop: Platform.OS === 'ios' ? 0 : STATUSBAR_HEIGHT, // SafeAreaView가 iOS 상단 처리
  },
  backButton: {
    padding: 4,
  },
  headerTitleWithBack: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
  },
  
  // 메인 질문 - 토스 스타일
  mainQuestion: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TossColors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  
  // 역할 선택 - 토스 스타일 플랫 디자인
  roleSelection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TossColors.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.gray[200],
  },
  roleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TossColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  
  // 빠른 답변 - 토스 스타일 (개선된 버전)
  quickSection: {
    marginTop: 32,
  },
  quickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  quickSubtitle: {
    fontSize: 13,
    color: TossColors.text.secondary,
    marginTop: 4,
  },
  quickMore: {
    fontSize: 14,
    color: TossColors.primary,
    fontWeight: '500',
  },
  faqTabSection: {
    marginTop: 8,
  },
  faqTabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text.primary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  quickScroll: {
    paddingLeft: 20,
  },
  quickScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  quickCard: {
    width: 160,
    backgroundColor: TossColors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minHeight: 140,
  },
  quickCardHeader: {
    marginBottom: 12,
  },
  quickIcon: {
    fontSize: 28,
  },
  quickQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
    marginBottom: 8,
    lineHeight: 18,
  },
  quickAnswer: {
    fontSize: 13,
    color: TossColors.text.secondary,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  
  // 정보 카드 - 토스 스타일
  infoCard: {
    marginTop: 24,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TossColors.primaryLight,
    borderRadius: 12,
    padding: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: TossColors.primary,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  
  // 인기 서비스 섹션 - 토스 스타일
  servicesSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  servicesTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceItem: {
    width: (width - 52) / 2, // 2열 그리드
    backgroundColor: TossColors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: TossColors.gray[200],
    alignItems: 'center',
  },
  serviceIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  serviceIcon: {
    fontSize: 32,
  },
  serviceBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotBadge: {
    backgroundColor: TossColors.error,
  },
  newBadge: {
    backgroundColor: TossColors.success,
  },
  preparingServiceBadge: {
    backgroundColor: TossColors.gray[300],
  },
  serviceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: TossColors.background,
    letterSpacing: 0.5,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 12,
    color: TossColors.text.secondary,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  serviceItemDisabled: {
    opacity: 0.6,
  },
  serviceTitleDisabled: {
    color: TossColors.gray[400],
  },
  serviceDescriptionDisabled: {
    color: TossColors.gray[300],
  },
  
  // 메뉴 섹션 - 토스 스타일
  menuSection: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: TossColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TossColors.gray[200],
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.gray[100],
  },
  menuItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TossColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  menuSubtitle: {
    fontSize: 14,
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  
  // 배지 - 토스 스타일
  newBadge: {
    backgroundColor: TossColors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: TossColors.background,
    letterSpacing: 0.5,
  },
  popularBadge: {
    backgroundColor: TossColors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: TossColors.background,
  },
  
  // 준비중 스타일
  preparingBadge: {
    backgroundColor: TossColors.gray[300],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  preparingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: TossColors.background,
    letterSpacing: 0.5,
  },
  menuIconDisabled: {
    backgroundColor: TossColors.gray[100],
  },
  menuTitleDisabled: {
    color: TossColors.gray[400],
  },
  menuSubtitleDisabled: {
    color: TossColors.gray[300],
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: TossColors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TossColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TossColors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalDescription: {
    fontSize: 15,
    color: TossColors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  modalButton: {
    width: '100%',
    backgroundColor: TossColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
    letterSpacing: -0.3,
  },
  
  // 하단 카드 - 토스 스타일
  bottomCard: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: TossColors.gray[50],
    borderRadius: 12,
    padding: 20,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
    marginLeft: 8,
  },
  bottomCardText: {
    fontSize: 14,
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
    lineHeight: 20,
    marginBottom: 16,
  },
  bottomCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
    letterSpacing: -0.2,
  },
});