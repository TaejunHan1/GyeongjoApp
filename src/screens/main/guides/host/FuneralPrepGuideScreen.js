// src/screens/main/guides/host/FuneralPrepGuideScreen.js
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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function FuneralPrepGuideScreen({ navigation, userInfo, session }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedPhase, setSelectedPhase] = useState('immediate');
  const [checkedItems, setCheckedItems] = useState({});

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 장례 준비 단계
  const preparationPhases = [
    { id: 'immediate', label: '임종 직후', period: '임종 직후 (1-2시간 내)' },
    { id: 'day1', label: '첫째 날', period: '첫째 날' },
    { id: 'day2', label: '둘째 날', period: '둘째 날 (입관/성복)' },
    { id: 'day3', label: '셋째 날', period: '셋째 날 (발인)' },
    { id: 'after', label: '장례 후', period: '장례식 이후' },
  ];

  const checklistData = {
    'immediate': [
      { id: 1, task: '의사로부터 사망진단서 발급받기', description: '병원에서 사망진단서를 발급받아 보관', priority: 'high', estimated: '즉시', contact: '병원 원무과' },
      { id: 2, task: '장례식장 연락 및 예약', description: '장례식장에 연락하여 빈소 예약', priority: 'high', estimated: '30분-1시간', contact: '장례식장' },
      { id: 3, task: '가족 및 친지에게 부고 연락', description: '가까운 가족과 친지에게 우선 연락', priority: 'high', estimated: '1-2시간', contact: '가족/친지' },
      { id: 4, task: '상조회사 연락 (가입 시)', description: '상조서비스 가입자인 경우 즉시 연락', priority: 'medium', estimated: '30분', contact: '상조회사' },
      { id: 5, task: '고인 의복 및 수의 준비', description: '고인이 입을 의복이나 수의 준비', priority: 'medium', estimated: '1시간', contact: '장례용품점' },
      { id: 6, task: '영정사진 선정', description: '고인의 영정사진으로 사용할 사진 선정', priority: 'medium', estimated: '30분', contact: '가족' },
    ],
    'day1': [
      { id: 7, task: '부고장 작성 및 발송', description: '정식 부고장을 작성하여 지인들에게 발송', priority: 'high', estimated: '2-3시간', contact: '인쇄소' },
      { id: 8, task: '상주 및 상복 준비', description: '상주들의 상복과 완장 준비', priority: 'high', estimated: '1-2시간', contact: '장례용품점' },
      { id: 9, task: '빈소 설치 및 장식', description: '빈소 장식, 근조화환 배치', priority: 'medium', estimated: '2-3시간', contact: '장례식장' },
      { id: 10, task: '조문객 접대 준비', description: '음식 및 접대용품 준비', priority: 'medium', estimated: '1-2시간', contact: '케이터링/장례식장' },
      { id: 11, task: '장례비용 정산', description: '장례식장과 비용 내역 확인', priority: 'medium', estimated: '1시간', contact: '장례식장' },
      { id: 12, task: '종교 의식 준비', description: '종교에 따른 의식 준비 (목사, 신부, 스님 등)', priority: 'low', estimated: '1시간', contact: '종교기관' },
    ],
    'day2': [
      { id: 13, task: '입관식 준비', description: '입관식에 필요한 물품과 절차 준비', priority: 'high', estimated: '1-2시간', contact: '장례지도사' },
      { id: 14, task: '성복식 진행', description: '상주들의 성복식 진행', priority: 'high', estimated: '30분-1시간', contact: '장례지도사' },
      { id: 15, task: '조문객 맞이', description: '조문객들을 정중하게 맞이하고 접대', priority: 'high', estimated: '하루 종일', contact: '가족/친지' },
      { id: 16, task: '조화 및 조의금 관리', description: '받은 조화와 조의금을 정리하고 기록', priority: 'medium', estimated: '수시로', contact: '가족' },
      { id: 17, task: '발인 준비', description: '다음 날 발인을 위한 준비사항 점검', priority: 'medium', estimated: '1-2시간', contact: '장례지도사' },
      { id: 18, task: '운구차량 및 버스 예약', description: '발인 시 필요한 차량들 예약', priority: 'medium', estimated: '30분-1시간', contact: '장례식장/렌터카' },
    ],
    'day3': [
      { id: 19, task: '발인식 준비', description: '발인식 진행을 위한 최종 준비', priority: 'high', estimated: '1-2시간', contact: '장례지도사' },
      { id: 20, task: '영구차 및 운구', description: '영구차에 관을 모시고 출발 준비', priority: 'high', estimated: '30분-1시간', contact: '장례지도사' },
      { id: 21, task: '화장장/묘지 이동', description: '화장장 또는 묘지로 이동', priority: 'high', estimated: '1-3시간', contact: '운전기사' },
      { id: 22, task: '화장/매장 진행', description: '화장 또는 매장 의식 진행', priority: 'high', estimated: '2-4시간', contact: '화장장/묘지관리소' },
      { id: 23, task: '상차림 및 음식 접대', description: '참석자들을 위한 식사 준비', priority: 'medium', estimated: '2-3시간', contact: '케이터링' },
      { id: 24, task: '귀가 및 정리', description: '모든 의식 완료 후 정리 및 귀가', priority: 'medium', estimated: '1-2시간', contact: '가족' },
    ],
    'after': [
      { id: 25, task: '부고 인사말 작성', description: '장례를 마친 후 감사 인사말 준비', priority: 'medium', estimated: '1-2시간', contact: '가족' },
      { id: 26, task: '조의금 답례', description: '조의금을 주신 분들께 답례 인사', priority: 'medium', estimated: '1-2주', contact: '가족' },
      { id: 27, task: '각종 서류 정리', description: '사망신고, 보험, 연금 등 관련 서류 처리', priority: 'high', estimated: '1-2주', contact: '구청/관련기관' },
      { id: 28, task: '제사 및 추모 계획', description: '49재, 기일 등 추모 계획 수립', priority: 'low', estimated: '며칠', contact: '가족/종교기관' },
      { id: 29, task: '유품 정리', description: '고인의 유품을 정리하고 분배', priority: 'low', estimated: '수주-수개월', contact: '가족' },
      { id: 30, task: '상속 절차', description: '필요시 상속 관련 법적 절차 진행', priority: 'low', estimated: '수개월', contact: '법무사/변호사' },
    ],
  };

  // 중요 연락처 정보
  const importantContacts = [
    { category: '응급상황', number: '119', description: '응급실/구급차' },
    { category: '관공서', number: '구청 민원실', description: '사망신고, 각종 서류' },
    { category: '장례식장', number: '해당 식장', description: '빈소 예약, 장례 진행' },
    { category: '상조회사', number: '가입 상조사', description: '상조서비스 (가입자만)' },
    { category: '종교기관', number: '해당 교회/절', description: '종교 의식 집전' },
  ];

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

  const currentChecklist = checklistData[selectedPhase] || [];
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
            <Ionicons name="flower" size={32} color="#9370DB" />
          </View>
          <Text style={styles.headerTitle}>장례식 준비 가이드</Text>
          <Text style={styles.headerSubtitle}>
            어려운 시기에 차근차근 도움을 드리겠습니다
          </Text>
        </View>

        {/* 응급 연락처 */}
        <View style={styles.emergencySection}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="call" size={20} color="#FF6B6B" />
            <Text style={styles.emergencyTitle}>중요 연락처</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contactsContainer}
          >
            {importantContacts.map((contact, index) => (
              <View key={index} style={styles.contactCard}>
                <Text style={styles.contactCategory}>{contact.category}</Text>
                <Text style={styles.contactNumber}>{contact.number}</Text>
                <Text style={styles.contactDescription}>{contact.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 진행도 */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {preparationPhases.find(p => p.id === selectedPhase)?.period}
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

        {/* 단계 선택 탭 */}
        <View style={styles.phaseTabs}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {preparationPhases.map((phase) => (
              <TouchableOpacity
                key={phase.id}
                style={[
                  styles.phaseTab,
                  selectedPhase === phase.id && styles.phaseTabActive
                ]}
                onPress={() => setSelectedPhase(phase.id)}
              >
                <Text style={[
                  styles.phaseTabText,
                  selectedPhase === phase.id && styles.phaseTabTextActive
                ]}>
                  {phase.label}
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
                <View style={styles.itemInfo}>
                  <View style={styles.estimatedTime}>
                    <Ionicons name="time-outline" size={14} color={Colors.gray400} />
                    <Text style={styles.estimatedTimeText}>소요시간: {item.estimated}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Ionicons name="call-outline" size={14} color={Colors.gray400} />
                    <Text style={styles.contactText}>연락처: {item.contact}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 도움말 섹션 */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Ionicons name="heart" size={24} color="#9370DB" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>🕯️ 위로의 말씀</Text>
              <Text style={styles.helpText}>
                어려운 시기이지만, 한 걸음씩 차근차근 준비해 나가시면 됩니다. 모든 절차를 완벽하게 하려고 무리하지 마시고, 가족과 친지들의 도움을 받으시길 바랍니다. 고인을 정성껏 배웅하는 마음이 가장 중요합니다.
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
              onPress={() => Alert.alert(
                '준비중',
                '장례비용 계산기 서비스를 준비중입니다.\n곧 더 나은 서비스로 찾아뵙겠습니다.',
                [{ text: '확인', style: 'default' }]
              )}
            >
              <Ionicons name="calculator" size={20} color={Colors.primary} />
              <Text style={styles.relatedServiceText}>장례비용 계산기</Text>
              <View style={styles.preparingBadge}>
                <Text style={styles.preparingText}>준비중</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.relatedService}
              onPress={() => Alert.alert(
                '준비중',
                '장례 업체 리스트 서비스를 준비중입니다.\n곧 더 나은 서비스로 찾아뵙겠습니다.',
                [{ text: '확인', style: 'default' }]
              )}
            >
              <Ionicons name="business" size={20} color={Colors.primary} />
              <Text style={styles.relatedServiceText}>장례 업체 리스트</Text>
              <View style={styles.preparingBadge}>
                <Text style={styles.preparingText}>준비중</Text>
              </View>
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
    backgroundColor: '#9370DB' + '20',
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
  
  // 응급 연락처
  emergencySection: {
    marginBottom: 24,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  contactsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  contactCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  contactCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
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
  
  // 단계 탭
  phaseTabs: {
    marginBottom: 24,
  },
  tabsContainer: {
    paddingRight: 20,
    gap: 8,
  },
  phaseTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    marginRight: 8,
  },
  phaseTabActive: {
    backgroundColor: Colors.primary,
  },
  phaseTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  phaseTabTextActive: {
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
  itemInfo: {
    gap: 8,
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
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: Colors.gray400,
  },
  
  // 도움말
  helpSection: {
    marginBottom: 32,
  },
  helpCard: {
    backgroundColor: '#F8F5FF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0D4FF',
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
  preparingBadge: {
    backgroundColor: '#FFB800' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  preparingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFB800',
  },
});