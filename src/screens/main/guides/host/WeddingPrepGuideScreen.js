    // src/screens/main/guides/host/WeddingPrepGuideScreen.js
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

export default function WeddingPrepGuideScreen({ navigation, userInfo, session }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [checkedItems, setCheckedItems] = useState({});

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 준비 기간별 체크리스트
  const preparationPeriods = [
    { id: '6months', label: '6개월 전', period: '6개월 전' },
    { id: '3months', label: '3개월 전', period: '3개월 전' },
    { id: '1month', label: '1개월 전', period: '1개월 전' },
    { id: '1week', label: '1주일 전', period: '1주일 전' },
    { id: 'day', label: '당일', period: '결혼식 당일' },
  ];

  const checklistData = {
    '6months': [
      { id: 1, task: '예산 계획 수립', description: '전체 결혼식 예산을 계획하고 항목별로 배분', priority: 'high', estimated: '2-3시간' },
      { id: 2, task: '웨딩홀 예약', description: '원하는 날짜와 스타일에 맞는 웨딩홀 선택', priority: 'high', estimated: '1-2주' },
      { id: 3, task: '하객 명단 1차 작성', description: '대략적인 하객 수 파악으로 홀 규모 결정', priority: 'high', estimated: '1-2일' },
      { id: 4, task: '웨딩드레스 & 턱시도 예약', description: '체형에 맞는 드레스와 턱시도 예약', priority: 'medium', estimated: '1주' },
      { id: 5, task: '사진/영상 업체 선정', description: '포트폴리오 확인 후 스튜디오 예약', priority: 'medium', estimated: '1주' },
      { id: 6, task: '메이크업 & 헤어 예약', description: '리허설 포함하여 메이크업 아티스트 예약', priority: 'medium', estimated: '3-5일' },
    ],
    '3months': [
      { id: 7, task: '청첩장 디자인 & 제작', description: '청첩장 디자인 선택 및 인쇄 주문', priority: 'high', estimated: '1-2주' },
      { id: 8, task: '신혼여행 계획', description: '허니문 여행지 선택 및 예약', priority: 'medium', estimated: '1주' },
      { id: 9, task: '예물 & 반지 준비', description: '결혼반지와 예물 구매', priority: 'medium', estimated: '1주' },
      { id: 10, task: '혼수 준비', description: '신혼집에 필요한 가전제품 및 가구 준비', priority: 'medium', estimated: '2-3주' },
      { id: 11, task: '신혼집 준비', description: '신혼집 계약 및 인테리어', priority: 'high', estimated: '1-2개월' },
      { id: 12, task: '웨딩카 예약', description: '결혼식 당일 이동할 웨딩카 예약', priority: 'low', estimated: '1일' },
    ],
    '1month': [
      { id: 13, task: '청첩장 발송', description: '완성된 청첩장을 하객들에게 발송', priority: 'high', estimated: '3-5일' },
      { id: 14, task: '최종 하객 명단 확정', description: '참석 여부 확인 후 최종 인원 확정', priority: 'high', estimated: '1주' },
      { id: 15, task: '웨딩홀과 최종 미팅', description: '메뉴, 장식, 진행 순서 최종 확인', priority: 'high', estimated: '2-3시간' },
      { id: 16, task: '드레스 & 턱시도 최종 피팅', description: '마지막 사이즈 조정 및 완성품 확인', priority: 'medium', estimated: '2-3시간' },
      { id: 17, task: '스피치 & 감사 인사말 준비', description: '부모님 및 신랑신부 인사말 준비', priority: 'medium', estimated: '2-3일' },
      { id: 18, task: '답례품 준비', description: '하객들에게 드릴 답례품 준비', priority: 'medium', estimated: '1주' },
    ],
    '1week': [
      { id: 19, task: '메이크업 & 헤어 리허설', description: '결혼식 당일 메이크업 리허설 진행', priority: 'high', estimated: '2-3시간' },
      { id: 20, task: '웨딩홀 리허설', description: '진행 순서와 동선 확인', priority: 'high', estimated: '1-2시간' },
      { id: 21, task: '필요 물품 최종 점검', description: '반지, 부케, 답례품 등 필수 물품 확인', priority: 'high', estimated: '1-2시간' },
      { id: 22, task: '혼인신고서 작성', description: '혼인신고에 필요한 서류 준비', priority: 'medium', estimated: '1-2시간' },
      { id: 23, task: '가족 및 주요 인사 최종 안내', description: '시간, 장소, 역할 등 최종 안내', priority: 'medium', estimated: '1일' },
    ],
    'day': [
      { id: 24, task: '일찍 기상 & 가벼운 식사', description: '컨디션 관리를 위한 충분한 수면과 식사', priority: 'high', estimated: '아침' },
      { id: 25, task: '메이크업 & 헤어 진행', description: '예약된 시간에 맞춰 메이크업 진행', priority: 'high', estimated: '2-3시간' },
      { id: 26, task: '드레스 & 턱시도 착용', description: '완성된 의상 착용 및 최종 점검', priority: 'high', estimated: '30분-1시간' },
      { id: 27, task: '가족사진 촬영', description: '식전 가족사진 및 커플사진 촬영', priority: 'medium', estimated: '1시간' },
      { id: 28, task: '하객 맞이 & 식 진행', description: '하객 맞이부터 식 진행까지', priority: 'high', estimated: '4-5시간' },
      { id: 29, task: '피로연 & 마무리', description: '피로연 진행 및 뒷정리', priority: 'medium', estimated: '2-3시간' },
    ],
  };

  const toggleCheckItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFB800';
      case 'low': return '#26C976';
      default: return '#26C976';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '필수';
      case 'medium': return '중요';
      case 'low': return '선택';
      default: return '선택';
    }
  };

  const currentChecklist = checklistData[selectedPeriod] || [];
  const completedCount = currentChecklist.filter(item => checkedItems[item.id]).length;
  const totalCount = currentChecklist.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
            <Ionicons name="heart" size={32} color="#FF69B4" />
          </View>
          <Text style={styles.headerTitle}>결혼식 준비 가이드</Text>
          <Text style={styles.headerSubtitle}>
            단계별로 체계적인 결혼식 준비를 도와드려요
          </Text>
        </View>

        {/* 진행도 */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {preparationPeriods.find(p => p.id === selectedPeriod)?.period} 준비사항
            </Text>
            <Text style={styles.progressText}>
              {completedCount}/{totalCount} 완료
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` }
              ]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
          </View>
        </View>

        {/* 기간 선택 탭 */}
        <View style={styles.periodTabs}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {preparationPeriods.map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodTab,
                  selectedPeriod === period.id && styles.periodTabActive
                ]}
                onPress={() => setSelectedPeriod(period.id)}
              >
                <Text style={[
                  styles.periodTabText,
                  selectedPeriod === period.id && styles.periodTabTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 체크리스트 */}
        <View style={styles.checklistSection}>
          {currentChecklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.checklistItem,
                checkedItems[item.id] && styles.checklistItemCompleted
              ]}
              onPress={() => toggleCheckItem(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.checklistItemHeader}>
                <View style={styles.checklistItemLeft}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      checkedItems[item.id] && styles.checkboxChecked
                    ]}
                    onPress={() => toggleCheckItem(item.id)}
                  >
                    {checkedItems[item.id] && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </TouchableOpacity>
                  <View style={styles.checklistItemContent}>
                    <Text style={[
                      styles.checklistItemTitle,
                      checkedItems[item.id] && styles.checklistItemTitleCompleted
                    ]}>
                      {item.task}
                    </Text>
                    <Text style={[
                      styles.checklistItemDescription,
                      checkedItems[item.id] && styles.checklistItemDescriptionCompleted
                    ]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.checklistItemRight}>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(item.priority) + '20' }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color: getPriorityColor(item.priority) }
                    ]}>
                      {getPriorityText(item.priority)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.checklistItemFooter}>
                <View style={styles.estimatedTime}>
                  <Ionicons name="time-outline" size={14} color={Colors.gray400} />
                  <Text style={styles.estimatedTimeText}>예상 소요시간: {item.estimated}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 도움말 섹션 */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Ionicons name="bulb" size={24} color="#FFB800" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>💡 준비 팁</Text>
              <Text style={styles.helpText}>
                • 예산을 먼저 정하고 우선순위를 정해보세요{'\n'}
                • 웨딩홀과 드레스는 6개월 전 예약이 필수입니다{'\n'}
                • 청첩장은 넉넉하게 주문하세요 (예상 인원보다 10% 더){'\n'}
                • 비상계획도 함께 세워두면 안심입니다
              </Text>
            </View>
          </View>
        </View>

        {/* 관련 서비스 */}
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>관련 서비스</Text>
          <View style={styles.relatedServices}>
            <TouchableOpacity 
              style={styles.relatedService}
              onPress={() => navigation.navigate('BudgetCalculator')}
            >
              <Ionicons name="calculator" size={20} color={Colors.primary} />
              <Text style={styles.relatedServiceText}>예산 계산기</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.relatedService}
              onPress={() => navigation.navigate('VendorList')}
            >
              <Ionicons name="business" size={20} color={Colors.primary} />
              <Text style={styles.relatedServiceText}>업체 리스트</Text>
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
    backgroundColor: '#FF69B4' + '20',
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
  
  // 진행도
  progressSection: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  
  // 기간 탭
  periodTabs: {
    marginBottom: 24,
  },
  tabsContainer: {
    paddingRight: 20,
    gap: 8,
  },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    marginRight: 8,
  },
  periodTabActive: {
    backgroundColor: Colors.primary,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  periodTabTextActive: {
    color: Colors.white,
  },
  
  // 체크리스트
  checklistSection: {
    gap: 12,
    marginBottom: 32,
  },
  checklistItem: {
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
  checklistItemCompleted: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
  },
  checklistItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checklistItemLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checklistItemContent: {
    flex: 1,
  },
  checklistItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  checklistItemTitleCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  checklistItemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  checklistItemDescriptionCompleted: {
    color: Colors.gray400,
  },
  checklistItemRight: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checklistItemFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: 12,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estimatedTimeText: {
    fontSize: 12,
    color: Colors.gray400,
  },
  
  // 도움말
  helpSection: {
    marginBottom: 32,
  },
  helpCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FFE066',
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
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
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