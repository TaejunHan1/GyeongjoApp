// src/screens/main/guides/host/TimelineScreen.js
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
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function TimelineScreen({ navigation, userInfo, session }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [eventType, setEventType] = useState('wedding');
  const [selectedPhase, setSelectedPhase] = useState('all');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 결혼식 타임라인 데이터
  const weddingTimeline = [
    {
      id: 'w6months',
      period: '6개월 전',
      phase: 'planning',
      color: '#FF6B6B',
      icon: 'calendar-outline',
      title: '기본 계획 수립',
      items: [
        '결혼식 날짜 및 시간 결정',
        '웨딩홀 예약 및 계약',
        '하객 명단 1차 작성 (약 100명)',
        '전체 예산 계획 수립',
        '웨딩드레스 & 턱시도 예약',
        '메이크업 & 헤어 업체 예약'
      ]
    },
    {
      id: 'w4months',
      period: '4개월 전',
      phase: 'planning',
      color: '#FF8E8E',
      icon: 'camera-outline',
      title: '업체 선정',
      items: [
        '웨딩촬영 스튜디오 예약',
        '웨딩영상 업체 선정',
        '신혼여행 계획 및 예약',
        '웨딩카 예약',
        '음악/DJ 섭외'
      ]
    },
    {
      id: 'w3months',
      period: '3개월 전',
      phase: 'preparation',
      color: '#FFB800',
      icon: 'card-outline',
      title: '세부 준비',
      items: [
        '청첩장 디자인 선택',
        '예물 & 결혼반지 구매',
        '혼수 준비 시작',
        '신혼집 준비',
        '하객 명단 최종 검토'
      ]
    },
    {
      id: 'w2months',
      period: '2개월 전',
      phase: 'preparation',
      color: '#FFCB3D',
      icon: 'mail-outline',
      title: '청첩장 제작',
      items: [
        '청첩장 인쇄 주문',
        '답례품 선정 및 주문',
        '웨딩홀과 메뉴 최종 확인',
        '드레스 1차 피팅'
      ]
    },
    {
      id: 'w1month',
      period: '1개월 전',
      phase: 'finalization',
      color: '#26C976',
      icon: 'send-outline',
      title: '최종 준비',
      items: [
        '청첩장 발송',
        '참석 여부 확인',
        '최종 하객 수 확정',
        '웨딩홀과 최종 미팅',
        '드레스 최종 피팅',
        '스피치 준비'
      ]
    },
    {
      id: 'w1week',
      period: '1주일 전',
      phase: 'finalization',
      color: '#4FD18C',
      icon: 'checkmark-circle-outline',
      title: '리허설 & 점검',
      items: [
        '메이크업 & 헤어 리허설',
        '웨딩홀 리허설',
        '필요 물품 최종 점검',
        '혼인신고서 작성',
        '가족 최종 안내'
      ]
    },
    {
      id: 'wday',
      period: '결혼식 당일',
      phase: 'event',
      color: '#4A88FF',
      icon: 'heart',
      title: 'D-Day',
      items: [
        '일찍 기상 & 가벼운 식사',
        '메이크업 & 헤어 진행',
        '드레스 & 턱시도 착용',
        '가족사진 촬영',
        '하객 맞이 & 식 진행',
        '피로연 & 마무리'
      ]
    }
  ];

  // 장례식 타임라인 데이터
  const funeralTimeline = [
    {
      id: 'fimmediate',
      period: '임종 직후',
      phase: 'immediate',
      color: '#9370DB',
      icon: 'medical-outline',
      title: '응급 처리',
      items: [
        '의사로부터 사망진단서 발급',
        '장례식장 연락 및 예약',
        '가족 및 친지에게 부고 연락',
        '상조회사 연락 (가입시)',
        '고인 의복 및 수의 준비',
        '영정사진 선정'
      ]
    },
    {
      id: 'fday1',
      period: '첫째 날',
      phase: 'preparation',
      color: '#BA55D3',
      icon: 'document-text-outline',
      title: '장례 준비',
      items: [
        '부고장 작성 및 발송',
        '상주 및 상복 준비',
        '빈소 설치 및 장식',
        '조문객 접대 준비',
        '장례비용 정산',
        '종교 의식 준비'
      ]
    },
    {
      id: 'fday2',
      period: '둘째 날',
      phase: 'ceremony',
      color: '#DDA0DD',
      icon: 'flower-outline',
      title: '입관 & 성복',
      items: [
        '입관식 준비',
        '성복식 진행',
        '조문객 맞이',
        '조화 및 조의금 관리',
        '발인 준비',
        '운구차량 및 버스 예약'
      ]
    },
    {
      id: 'fday3',
      period: '셋째 날',
      phase: 'ceremony',
      color: '#E6E6FA',
      icon: 'car-outline',
      title: '발인',
      items: [
        '발인식 준비',
        '영구차 및 운구',
        '화장장/묘지 이동',
        '화장/매장 진행',
        '상차림 및 음식 접대',
        '귀가 및 정리'
      ]
    },
    {
      id: 'fafter',
      period: '장례 후',
      phase: 'after',
      color: '#F0F8FF',
      icon: 'document-outline',
      title: '사후 처리',
      items: [
        '부고 인사말 작성',
        '조의금 답례',
        '각종 서류 정리',
        '제사 및 추모 계획',
        '유품 정리',
        '상속 절차 (필요시)'
      ]
    }
  ];

  const currentTimeline = eventType === 'wedding' ? weddingTimeline : funeralTimeline;
  
  // 단계별 필터링
  const filteredTimeline = selectedPhase === 'all' 
    ? currentTimeline 
    : currentTimeline.filter(item => item.phase === selectedPhase);

  // 단계 필터 옵션
  const phaseOptions = eventType === 'wedding' 
    ? [
        { id: 'all', name: '전체', color: Colors.primary },
        { id: 'planning', name: '계획', color: '#FF6B6B' },
        { id: 'preparation', name: '준비', color: '#FFB800' },
        { id: 'finalization', name: '마무리', color: '#26C976' },
        { id: 'event', name: '당일', color: '#4A88FF' },
      ]
    : [
        { id: 'all', name: '전체', color: Colors.primary },
        { id: 'immediate', name: '응급', color: '#9370DB' },
        { id: 'preparation', name: '준비', color: '#BA55D3' },
        { id: 'ceremony', name: '의식', color: '#DDA0DD' },
        { id: 'after', name: '사후', color: '#F0F8FF' },
      ];

  const getTimelineItemStyle = (index, total) => {
    const isFirst = index === 0;
    const isLast = index === total - 1;
    
    return {
      marginTop: isFirst ? 0 : -1,
      zIndex: total - index,
    };
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
            <Ionicons name="timeline" size={32} color="#4A88FF" />
          </View>
          <Text style={styles.headerTitle}>준비 타임라인</Text>
          <Text style={styles.headerSubtitle}>
            시간 순서대로 체계적인 준비 계획을 확인하세요
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
                setSelectedPhase('all');
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
                결혼식
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.eventTypeButton,
                eventType === 'funeral' && styles.eventTypeButtonActive
              ]}
              onPress={() => {
                setEventType('funeral');
                setSelectedPhase('all');
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
                장례식
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 단계 필터 */}
        <View style={styles.phaseFilterSection}>
          <Text style={styles.sectionTitle}>단계 필터</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.phaseFilters}
          >
            {phaseOptions.map((phase) => (
              <TouchableOpacity
                key={phase.id}
                style={[
                  styles.phaseFilter,
                  { borderColor: phase.color },
                  selectedPhase === phase.id && { backgroundColor: phase.color }
                ]}
                onPress={() => setSelectedPhase(phase.id)}
              >
                <Text style={[
                  styles.phaseFilterText,
                  { color: selectedPhase === phase.id ? Colors.white : phase.color }
                ]}>
                  {phase.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 타임라인 */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>
            {eventType === 'wedding' ? '결혼식 준비 타임라인' : '장례식 준비 타임라인'}
          </Text>
          
          <View style={styles.timeline}>
            {filteredTimeline.map((item, index) => (
              <View 
                key={item.id} 
                style={[styles.timelineItem, getTimelineItemStyle(index, filteredTimeline.length)]}
              >
                {/* 타임라인 연결선 */}
                {index < filteredTimeline.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: item.color + '40' }]} />
                )}
                
                {/* 타임라인 도트 */}
                <View style={[styles.timelineDot, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={20} color={Colors.white} />
                </View>
                
                {/* 타임라인 콘텐츠 */}
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelinePeriod}>{item.period}</Text>
                    <View style={[styles.phaseBadge, { backgroundColor: item.color + '20' }]}>
                      <Text style={[styles.phaseBadgeText, { color: item.color }]}>
                        {phaseOptions.find(p => p.id === item.phase)?.name || item.phase}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  
                  <View style={styles.timelineItems}>
                    {item.items.map((task, taskIndex) => (
                      <View key={taskIndex} style={styles.timelineTaskItem}>
                        <View style={[styles.taskDot, { backgroundColor: item.color }]} />
                        <Text style={styles.taskText}>{task}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 도움말 */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Ionicons name="information-circle" size={24} color="#4A88FF" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>💡 타임라인 활용 팁</Text>
              <Text style={styles.helpText}>
                • 각 단계별로 미리 준비하여 여유있게 진행하세요{'\n'}
                • 중요한 항목은 여러 업체에서 견적을 받아보세요{'\n'}
                • 예상보다 시간이 오래 걸릴 수 있으니 여유를 두세요{'\n'}
                • 가족과 함께 역할을 분담하여 준비하시면 좋습니다
              </Text>
            </View>
          </View>
        </View>

        {/* 관련 서비스 */}
        <View style={styles.relatedSection}>
          <Text style={styles.sectionTitle}>관련 서비스</Text>
          <View style={styles.relatedServices}>
            <TouchableOpacity 
              style={styles.relatedService}
              onPress={() => navigation.navigate('ChecklistManager')}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.relatedServiceText}>체크리스트 관리</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.relatedService}
              onPress={() => navigation.navigate('BudgetCalculator')}
            >
              <Ionicons name="calculator" size={20} color={Colors.primary} />
              <Text style={styles.relatedServiceText}>예산 계산기</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
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
    backgroundColor: '#4A88FF' + '20',
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
    lineHeight: 20,
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
  
  // 단계 필터
  phaseFilterSection: {
    marginBottom: 24,
  },
  phaseFilters: {
    paddingRight: 20,
    gap: 8,
  },
  phaseFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    marginRight: 8,
  },
  phaseFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // 타임라인
  timelineSection: {
    marginBottom: 32,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 32,
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: '100%',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineContent: {
    flex: 1,
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
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelinePeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phaseBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  timelineItems: {
    gap: 8,
  },
  timelineTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  
  // 도움말
  helpSection: {
    marginBottom: 32,
  },
  helpCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#CCE5FF',
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
  
  // 관련 서비스
  relatedSection: {
    marginBottom: 32,
  },
  relatedServices: {
    gap: 8,
  },
  relatedService: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    gap: 12,
  },
  relatedServiceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});