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
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function WeddingPrepGuideScreen({ navigation, userInfo, session }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [checkedItems, setCheckedItems] = useState({});
  const [viewMode, setViewMode] = useState('checklist'); // 'checklist' | 'timeline'
  const [customItems, setCustomItems] = useState({}); // { [periodId]: [items] }
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 준비 기간별 체크리스트 (타임라인 뷰 색상/아이콘 포함)
  const preparationPeriods = [
    { id: '6months', label: '6개월 전', period: '6개월 전',  color: '#FF6B6B', icon: 'calendar-outline' },
    { id: '3months', label: '3개월 전', period: '3개월 전',  color: '#FFB800', icon: 'card-outline' },
    { id: '1month',  label: '1개월 전', period: '1개월 전',  color: '#26C976', icon: 'send-outline' },
    { id: '1week',   label: '1주일 전', period: '1주일 전',  color: '#4A88FF', icon: 'checkmark-done-outline' },
    { id: 'day',     label: '당일',     period: '결혼식 당일', color: '#9966FF', icon: 'heart-outline' },
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

  // 내 항목 추가
  const addCustomItem = () => {
    const title = newItemTitle.trim();
    if (!title) {
      Alert.alert('알림', '할 일 제목을 입력해주세요');
      return;
    }
    const newItem = {
      id: `custom_${Date.now()}`,
      task: title,
      description: newItemDesc.trim() || '직접 추가한 항목',
      priority: 'medium',
      estimated: '',
      isCustom: true,
    };
    setCustomItems(prev => ({
      ...prev,
      [selectedPeriod]: [...(prev[selectedPeriod] || []), newItem],
    }));
    setNewItemTitle('');
    setNewItemDesc('');
    setShowAddModal(false);
  };

  const removeCustomItem = (itemId) => {
    Alert.alert('삭제 확인', '이 항목을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setCustomItems(prev => ({
            ...prev,
            [selectedPeriod]: (prev[selectedPeriod] || []).filter(i => i.id !== itemId),
          }));
          setCheckedItems(prev => {
            const copy = { ...prev };
            delete copy[itemId];
            return copy;
          });
        },
      },
    ]);
  };

  const currentChecklist = [
    ...(checklistData[selectedPeriod] || []),
    ...(customItems[selectedPeriod] || []),
  ];
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

        {/* 뷰 모드 토글 */}
        <View style={styles.viewToggleWrap}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'checklist' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('checklist')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={16}
              color={viewMode === 'checklist' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.viewToggleText, viewMode === 'checklist' && styles.viewToggleTextActive]}>
              체크리스트
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'timeline' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('timeline')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={viewMode === 'timeline' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.viewToggleText, viewMode === 'timeline' && styles.viewToggleTextActive]}>
              타임라인
            </Text>
          </TouchableOpacity>
        </View>

        {/* 진행도 (체크리스트 모드에서만) */}
        {viewMode === 'checklist' && (
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
        )}

        {/* 타임라인 뷰 */}
        {viewMode === 'timeline' && (
          <View style={styles.timelineSection}>
            <View style={styles.timeline}>
              {preparationPeriods.map((period, periodIdx) => {
                const tasks = checklistData[period.id] || [];
                const isLast = periodIdx === preparationPeriods.length - 1;
                return (
                  <View key={period.id} style={styles.timelineRow}>
                    {/* 연결선 */}
                    {!isLast && (
                      <View style={[styles.timelineLine, { backgroundColor: period.color + '40' }]} />
                    )}
                    {/* 도트 */}
                    <View style={[styles.timelineDot, { backgroundColor: period.color }]}>
                      <Ionicons name={period.icon} size={18} color="#fff" />
                    </View>
                    {/* 콘텐츠 */}
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelinePeriodLabel}>{period.period}</Text>
                        <View style={[styles.timelinePhaseBadge, { backgroundColor: period.color + '20' }]}>
                          <Text style={[styles.timelinePhaseText, { color: period.color }]}>
                            {tasks.length}개 항목
                          </Text>
                        </View>
                      </View>
                      <View style={styles.timelineTasks}>
                        {tasks.map((task) => (
                          <View key={task.id} style={styles.timelineTaskRow}>
                            <View style={[styles.timelineTaskDot, { backgroundColor: period.color }]} />
                            <Text
                              style={[
                                styles.timelineTaskText,
                                checkedItems[task.id] && styles.timelineTaskTextDone,
                              ]}
                              numberOfLines={2}
                            >
                              {task.task}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 기간 선택 탭 (체크리스트 모드만) */}
        {viewMode === 'checklist' && (
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
        )}

        {/* 체크리스트 (체크리스트 모드만) */}
        {viewMode === 'checklist' && (
        <View style={styles.checklistSection}>
          {/* 내 항목 추가 버튼 */}
          <TouchableOpacity
            style={styles.addCustomBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FF69B4" />
            <Text style={styles.addCustomBtnText}>내 항목 추가하기</Text>
          </TouchableOpacity>

          {currentChecklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.checklistItem,
                checkedItems[item.id] && styles.checklistItemCompleted,
                item.isCustom && styles.checklistItemCustom,
              ]}
              onPress={() => toggleCheckItem(item.id)}
              onLongPress={item.isCustom ? () => removeCustomItem(item.id) : undefined}
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
        )}

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
              onPress={() => Alert.alert(
                '준비중',
                '예산 계산기 서비스를 준비중입니다.\n곧 더 나은 서비스로 찾아뵙겠습니다.',
                [{ text: '확인', style: 'default' }]
              )}
            >
              <Ionicons name="calculator" size={20} color={Colors.primary} />
              <Text style={styles.relatedServiceText}>예산 계산기</Text>
              <View style={styles.preparingBadge}>
                <Text style={styles.preparingText}>준비중</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.relatedService}
              onPress={() => Alert.alert(
                '준비중',
                '업체 리스트 서비스를 준비중입니다.\n곧 더 나은 서비스로 찾아뵙겠습니다.',
                [{ text: '확인', style: 'default' }]
              )}
            >
              <Ionicons name="business" size={20} color={Colors.primary} />
              <Text style={styles.relatedServiceText}>업체 리스트</Text>
              <View style={styles.preparingBadge}>
                <Text style={styles.preparingText}>준비중</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* 내 항목 추가 모달 */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>내 항목 추가</Text>
              <Text style={styles.modalSub}>
                {preparationPeriods.find(p => p.id === selectedPeriod)?.period} 에 추가됩니다
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="할 일 제목"
                placeholderTextColor={Colors.gray400}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
                maxLength={40}
                autoFocus
              />
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="설명 (선택)"
                placeholderTextColor={Colors.gray400}
                value={newItemDesc}
                onChangeText={setNewItemDesc}
                multiline
                maxLength={120}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, !newItemTitle.trim() && { opacity: 0.5 }]}
                  onPress={addCustomItem}
                  disabled={!newItemTitle.trim()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalConfirmText}>추가</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
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

  // 뷰 모드 토글
  viewToggleWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  viewToggleBtnActive: {
    backgroundColor: '#FF69B4',
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  viewToggleTextActive: {
    color: Colors.white,
  },

  // 타임라인
  timelineSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 38,
    width: 2,
    height: '100%',
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timelinePeriodLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timelinePhaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timelinePhaseText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timelineTasks: { gap: 7 },
  timelineTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timelineTaskDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  timelineTaskText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  timelineTaskTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.gray400,
  },

  // 내 항목 추가 버튼 + 커스텀 아이템
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#FF69B4',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFF5F9',
  },
  addCustomBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF69B4',
    letterSpacing: 0.2,
  },
  checklistItemCustom: {
    borderColor: '#FF69B4',
    borderWidth: 1,
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
  },
  modalCancelText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FF69B4',
    borderRadius: 12,
  },
  modalConfirmText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});