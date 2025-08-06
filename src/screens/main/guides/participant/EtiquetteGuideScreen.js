// src/screens/main/guides/EtiquetteGuideScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function EtiquetteGuideScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('wedding');
  const [expandedStep, setExpandedStep] = useState(null);

  // 결혼식 예절 단계별 가이드
  const weddingEtiquette = [
    {
      id: 'arrival',
      title: '도착 및 접수',
      icon: '🚗',
      time: '식 시작 30분 전',
      steps: [
        '주차장에서 조용히 하차',
        '접수처에서 축의금 전달',
        '방명록 작성 (간단명료하게)',
        '좌석 안내에 따라 착석',
      ],
      tips: [
        '축의금은 깨끗한 봉투에 넣어서',
        '신랑/신부측 구분해서 좌석 선택',
        '늦은 도착 시에는 뒷자리에 조용히',
      ]
    },
    {
      id: 'ceremony',
      title: '예식 진행',
      icon: '💒',
      time: '예식 중',
      steps: [
        '입장 시 박수로 환영',
        '서약 중에는 조용히',
        '반지 교환 시 박수',
        '선언 후 기립박수',
      ],
      tips: [
        '휴대폰은 무음 또는 진동으로',
        '사진 촬영 시 플래시 금지',
        '아이들이 울면 밖으로 나가기',
        '개인적인 대화는 자제',
      ]
    },
    {
      id: 'photo',
      title: '사진 촬영',
      icon: '📸',
      time: '예식 후',
      steps: [
        '신랑신부와 가족 사진 우선',
        '차례대로 단체 사진',
        '개인적인 축하 인사',
        '간단한 기념 촬영',
      ],
      tips: [
        '전문 사진사 방해하지 않기',
        '다른 하객들과 양보하며',
        '오래 붙잡고 있지 않기',
        '자연스러운 표정으로',
      ]
    },
    {
      id: 'reception',
      title: '피로연 및 식사',
      icon: '🍽️',
      time: '식사 시간',
      steps: [
        '안내에 따라 식사 자리로',
        '적당한 양의 음식 섭취',
        '주변 하객들과 인사',
        '신랑신부 테이블 방문',
      ],
      tips: [
        '술은 적당히 마시기',
        '음식 남기지 않도록 주의',
        '시끄럽게 떠들지 않기',
        '정리 시간 고려해서 마무리',
      ]
    },
  ];

  // 장례식 예절 단계별 가이드
  const funeralEtiquette = [
    {
      id: 'arrival',
      title: '도착 및 접수',
      icon: '🏢',
      time: '조문 시작',
      steps: [
        '조용히 입장',
        '접수처에서 조의금 전달',
        '방명록 작성',
        '분향소로 이동',
      ],
      tips: [
        '큰 소리내지 않기',
        '조의금은 부조금함에',
        '간단한 서명만',
        '차례를 지켜서',
      ]
    },
    {
      id: 'incense',
      title: '분향 및 절차',
      icon: '🕯️',
      time: '분향 시',
      steps: [
        '영정 앞에서 묵념',
        '향 3개를 들고 불 붙이기',
        '향로에 꽂고 두 번 절',
        '상주에게 인사',
      ],
      tips: [
        '종교에 따라 절차 다름',
        '기독교는 묵념만',
        '불교는 합장',
        '천주교는 성호긋기',
      ]
    },
    {
      id: 'condolence',
      title: '상주 위로',
      icon: '🤲',
      time: '인사 시',
      steps: [
        '"삼가 고인의 명복을 빕니다"',
        '간단한 위로의 말',
        '악수 또는 가벼운 포옹',
        '빠른 시일 내 마무리',
      ],
      tips: [
        '긴 위로보다 진심 있는 짧은 말',
        '"힘내세요"보다 "함께하겠습니다"',
        '고인의 사인 묻지 않기',
        '개인적 얘기는 나중에',
      ]
    },
    {
      id: 'departure',
      title: '조문 마무리',
      icon: '🚪',
      time: '떠날 때',
      steps: [
        '상주에게 작별 인사',
        '조용히 퇴장',
        '주차장에서도 조용히',
        '집에서 손 씻기',
      ],
      tips: [
        '10-15분 정도가 적당',
        '음식 권유 정중히 거절',
        '큰소리로 얘기하지 않기',
        '귀가 후 몸단장하기',
      ]
    },
  ];

  // 상황별 대처법
  const situationGuides = {
    wedding: [
      {
        situation: '늦게 도착했을 때',
        solution: '조용히 뒷자리에 앉고, 예식 끝난 후 축하 인사',
        icon: '⏰'
      },
      {
        situation: '아이가 울 때',
        solution: '즉시 밖으로 나가서 달래기',
        icon: '👶'
      },
      {
        situation: '모르는 사람들 사이에 있을 때',
        solution: '간단한 자기소개 후 자연스럽게 대화 참여',
        icon: '🤝'
      },
      {
        situation: '신랑신부를 잘 모를 때',
        solution: '"축하드립니다" 한마디면 충분',
        icon: '💭'
      },
    ],
    funeral: [
      {
        situation: '종교가 다를 때',
        solution: '해당 종교 방식을 따르거나 묵념으로 대체',
        icon: '🙏'
      },
      {
        situation: '고인과의 추억을 물어볼 때',
        solution: '좋은 기억만 간단히 말하고 길게 늘어놓지 않기',
        icon: '💭'
      },
      {
        situation: '상주가 너무 슬퍼할 때',
        solution: '말보다는 곁에 있어주는 것이 위로',
        icon: '🫂'
      },
      {
        situation: '어떤 말을 해야 할지 모를 때',
        solution: '"힘드시겠지만 함께하겠습니다" 정도면 충분',
        icon: '💬'
      },
    ]
  };

  const toggleStep = (stepId) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const renderEtiquetteSteps = () => {
    const currentGuide = selectedTab === 'wedding' ? weddingEtiquette : funeralEtiquette;
    
    return (
      <View style={styles.stepsContainer}>
        {currentGuide.map((step, index) => (
          <View key={step.id} style={styles.stepCard}>
            <TouchableOpacity
              style={styles.stepHeader}
              onPress={() => toggleStep(step.id)}
            >
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <View style={styles.stepTitleContainer}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
              </View>
              <Ionicons 
                name={expandedStep === step.id ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.gray400} 
              />
            </TouchableOpacity>
            
            {expandedStep === step.id && (
              <View style={styles.stepContent}>
                <View style={styles.stepSection}>
                  <Text style={styles.stepSectionTitle}>진행 순서</Text>
                  {step.steps.map((stepItem, stepIndex) => (
                    <View key={stepIndex} style={styles.stepItem}>
                      <View style={styles.stepBullet} />
                      <Text style={styles.stepText}>{stepItem}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.stepSection}>
                  <Text style={styles.stepSectionTitle}>💡 꿀팁</Text>
                  {step.tips.map((tip, tipIndex) => (
                    <View key={tipIndex} style={styles.tipItem}>
                      <View style={styles.tipBullet} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderSituationGuide = () => {
    const situations = situationGuides[selectedTab];
    
    return (
      <View style={styles.situationContainer}>
        {situations.map((situation, index) => (
          <View key={index} style={styles.situationCard}>
            <View style={styles.situationHeader}>
              <Text style={styles.situationIcon}>{situation.icon}</Text>
              <Text style={styles.situationTitle}>{situation.situation}</Text>
            </View>
            <Text style={styles.situationSolution}>{situation.solution}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>예절 가이드</Text>
          <Text style={styles.headerSubtitle}>
            경조사에서 지켜야 할 예절과 순서를 단계별로 알아보세요
          </Text>
        </View>

        {/* 경조사 타입 탭 */}
        <View style={styles.eventTabs}>
          <TouchableOpacity
            style={[styles.eventTab, selectedTab === 'wedding' && styles.eventTabActive]}
            onPress={() => setSelectedTab('wedding')}
          >
            <Text style={styles.eventTabEmoji}>💒</Text>
            <Text style={[styles.eventTabText, selectedTab === 'wedding' && styles.eventTabTextActive]}>
              결혼식 예절
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.eventTab, selectedTab === 'funeral' && styles.eventTabActive]}
            onPress={() => setSelectedTab('funeral')}
          >
            <Text style={styles.eventTabEmoji}>🕯️</Text>
            <Text style={[styles.eventTabText, selectedTab === 'funeral' && styles.eventTabTextActive]}>
              장례식 예절
            </Text>
          </TouchableOpacity>
        </View>

        {/* 단계별 예절 가이드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>단계별 예절 가이드</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedTab === 'wedding' ? '결혼식 참석부터 마무리까지' : '조문 절차를 순서대로'}
          </Text>
          {renderEtiquetteSteps()}
        </View>

        {/* 상황별 대처법 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상황별 대처법</Text>
          <Text style={styles.sectionSubtitle}>
            이런 상황에서는 어떻게 해야 할까요?
          </Text>
          {renderSituationGuide()}
        </View>

        {/* 국제 매너 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 국제 매너</Text>
          <View style={styles.internationalGuide}>
            <View style={styles.internationalItem}>
              <Text style={styles.internationalIcon}>🇰🇷</Text>
              <View style={styles.internationalContent}>
                <Text style={styles.internationalTitle}>한국식</Text>
                <Text style={styles.internationalText}>절, 정중한 인사, 연장자 우선</Text>
              </View>
            </View>
            <View style={styles.internationalItem}>
              <Text style={styles.internationalIcon}>🇺🇸</Text>
              <View style={styles.internationalContent}>
                <Text style={styles.internationalTitle}>서양식</Text>
                <Text style={styles.internationalText}>악수, 허그, 간단한 축하 인사</Text>
              </View>
            </View>
            <View style={styles.internationalItem}>
              <Text style={styles.internationalIcon}>🤝</Text>
              <View style={styles.internationalContent}>
                <Text style={styles.internationalTitle}>다문화</Text>
                <Text style={styles.internationalText}>상대방 문화에 맞춰 유연하게 대응</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 어린이 동반 시 주의사항 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👶 어린이 동반 시</Text>
          <View style={styles.childGuide}>
            <View style={styles.childItem}>
              <Text style={styles.childIcon}>🍼</Text>
              <Text style={styles.childText}>수유실이나 조용한 곳 미리 확인</Text>
            </View>
            <View style={styles.childItem}>
              <Text style={styles.childIcon}>🧸</Text>
              <Text style={styles.childText}>조용한 장난감이나 간식 준비</Text>
            </View>
            <View style={styles.childItem}>
              <Text style={styles.childIcon}>👨‍👩‍👧</Text>
              <Text style={styles.childText}>한 명은 아이를 돌보고 한 명은 예식 참석</Text>
            </View>
            <View style={styles.childItem}>
              <Text style={styles.childIcon}>🚪</Text>
              <Text style={styles.childText}>아이가 울면 즉시 밖으로 나가기</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    lineHeight: 20,
  },
  
  // 이벤트 탭
  eventTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  eventTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  eventTabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTabEmoji: {
    fontSize: 16,
  },
  eventTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  eventTabTextActive: {
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  
  // 단계별 가이드
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  stepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  stepContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    padding: 16,
    paddingTop: 20,
    gap: 16,
  },
  stepSection: {},
  stepSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  stepBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.warning,
    marginTop: 8,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  
  // 상황별 가이드
  situationContainer: {
    gap: 12,
  },
  situationCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  situationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  situationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  situationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  situationSolution: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // 국제 매너
  internationalGuide: {
    gap: 12,
  },
  internationalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  internationalIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  internationalContent: {},
  internationalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  internationalText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  
  // 어린이 가이드
  childGuide: {
    gap: 12,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  childIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  childText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});