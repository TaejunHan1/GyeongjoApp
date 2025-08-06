// src/screens/main/guides/host/ChecklistManagerScreen.js
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
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function ChecklistManagerScreen({ navigation, userInfo, session }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [eventType, setEventType] = useState('wedding');
  const [customItems, setCustomItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('venue');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 기본 체크리스트 템플릿 (결혼식)
  const weddingTemplateItems = [
    {
      id: 'w1', category: 'venue', title: '웨딩홀 예약', description: '원하는 날짜와 스타일에 맞는 웨딩홀 선택',
      priority: 'high', daysFromEvent: -180, isTemplate: true
    },
    {
      id: 'w2', category: 'venue', title: '웨딩드레스 예약', description: '체형에 맞는 드레스 선택 및 피팅',
      priority: 'high', daysFromEvent: -180, isTemplate: true
    },
    {
      id: 'w3', category: 'photo', title: '웨딩촬영 업체 선정', description: '포트폴리오 확인 후 스튜디오 예약',
      priority: 'medium', daysFromEvent: -150, isTemplate: true
    },
    {
      id: 'w4', category: 'invitation', title: '청첩장 제작', description: '청첩장 디자인 선택 및 인쇄 주문',
      priority: 'high', daysFromEvent: -90, isTemplate: true
    },
    {
      id: 'w5', category: 'preparation', title: '청첩장 발송', description: '완성된 청첩장을 하객들에게 발송',
      priority: 'high', daysFromEvent: -30, isTemplate: true
    },
  ];

  // 기본 체크리스트 템플릿 (장례식)
  const funeralTemplateItems = [
    {
      id: 'f1', category: 'immediate', title: '사망진단서 발급', description: '병원에서 사망진단서 발급받기',
      priority: 'high', daysFromEvent: 0, isTemplate: true
    },
    {
      id: 'f2', category: 'immediate', title: '장례식장 예약', description: '장례식장에 연락하여 빈소 예약',
      priority: 'high', daysFromEvent: 0, isTemplate: true
    },
    {
      id: 'f3', category: 'preparation', title: '부고장 작성', description: '정식 부고장을 작성하여 지인들에게 발송',
      priority: 'high', daysFromEvent: 1, isTemplate: true
    },
    {
      id: 'f4', category: 'ceremony', title: '입관식 준비', description: '입관식에 필요한 물품과 절차 준비',
      priority: 'high', daysFromEvent: 2, isTemplate: true
    },
    {
      id: 'f5', category: 'ceremony', title: '발인식 진행', description: '발인식 진행을 위한 최종 준비',
      priority: 'high', daysFromEvent: 3, isTemplate: true
    },
  ];

  const currentTemplateItems = eventType === 'wedding' ? weddingTemplateItems : funeralTemplateItems;
  const allItems = [...currentTemplateItems, ...customItems.filter(item => item.eventType === eventType)];

  // 카테고리별 분류
  const categorizedItems = allItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // 진행도 계산
  const completedCount = allItems.filter(item => checkedItems[item.id]).length;
  const totalCount = allItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // 우선순위별 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFB800';
      case 'low': return '#26C976';
      default: return '#26C976';
    }
  };

  // 카테고리 이름 매핑
  const getCategoryName = (category, eventType) => {
    if (eventType === 'wedding') {
      const categoryMap = {
        venue: '장소/의상',
        photo: '사진/영상',
        invitation: '청첩장',
        preparation: '준비사항',
        ceremony: '당일 진행',
        custom: '직접 추가'
      };
      return categoryMap[category] || category;
    } else {
      const categoryMap = {
        immediate: '임종 직후',
        preparation: '준비사항',
        ceremony: '의식 진행',
        after: '장례 후',
        custom: '직접 추가'
      };
      return categoryMap[category] || category;
    }
  };

  // 체크 상태 토글
  const toggleCheckItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 커스텀 아이템 추가
  const addCustomItem = () => {
    if (!newItemTitle.trim()) {
      Alert.alert('알림', '할 일 제목을 입력해주세요.');
      return;
    }

    const newItem = {
      id: `custom_${Date.now()}`,
      category: 'custom',
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || '사용자가 직접 추가한 항목',
      priority: 'medium',
      daysFromEvent: 0,
      eventType: eventType,
      isTemplate: false,
      isCustom: true,
    };

    setCustomItems(prev => [...prev, newItem]);
    setNewItemTitle('');
    setNewItemDescription('');
    setShowAddModal(false);
  };

  // 커스텀 아이템 삭제
  const deleteCustomItem = (itemId) => {
    Alert.alert(
      '삭제 확인',
      '이 항목을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setCustomItems(prev => prev.filter(item => item.id !== itemId));
            setCheckedItems(prev => {
              const newCheckedItems = { ...prev };
              delete newCheckedItems[itemId];
              return newCheckedItems;
            });
          }
        }
      ]
    );
  };

  // D-Day 계산
  const getDDayText = (daysFromEvent) => {
    if (daysFromEvent === 0) return '당일';
    if (daysFromEvent > 0) return `D+${daysFromEvent}`;
    return `D${daysFromEvent}`;
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
            <Ionicons name="checkmark-circle" size={32} color="#26C976" />
          </View>
          <Text style={styles.headerTitle}>나만의 체크리스트</Text>
          <Text style={styles.headerSubtitle}>
            준비사항을 체계적으로 관리하고 진행상황을 확인하세요
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

        {/* 진행도 */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>전체 진행률</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
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
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} 항목 완료
          </Text>
        </View>

        {/* 체크리스트 */}
        <View style={styles.checklistSection}>
          {Object.entries(categorizedItems).map(([category, items]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {getCategoryName(category, eventType)}
              </Text>
              <View style={styles.categoryItems}>
                {items
                  .sort((a, b) => (a.daysFromEvent || 0) - (b.daysFromEvent || 0))
                  .map((item) => (
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
                          <View style={styles.titleRow}>
                            <Text style={[
                              styles.checklistItemTitle,
                              checkedItems[item.id] && styles.checklistItemTitleCompleted
                            ]}>
                              {item.title}
                            </Text>
                            {item.daysFromEvent !== undefined && (
                              <View style={styles.ddayBadge}>
                                <Text style={styles.ddayText}>
                                  {getDDayText(item.daysFromEvent)}
                                </Text>
                              </View>
                            )}
                          </View>
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
                            {item.priority === 'high' ? '필수' : item.priority === 'medium' ? '중요' : '선택'}
                          </Text>
                        </View>
                        {item.isCustom && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => deleteCustomItem(item.id)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* 아이템 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCloseText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>할 일 추가</Text>
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={addCustomItem}
            >
              <Text style={styles.modalSaveText}>추가</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>할 일 제목 *</Text>
              <TextInput
                style={styles.textInput}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
                placeholder="예: 웨딩홀 계약서 확인"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>상세 설명</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                placeholder="할 일에 대한 상세한 설명을 입력하세요"
                placeholderTextColor={Colors.gray400}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
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
    lineHeight: 20,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
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
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  
  // 체크리스트
  checklistSection: {
    gap: 24,
    marginBottom: 32,
  },
  categorySection: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  categoryItems: {
    gap: 8,
  },
  checklistItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  checklistItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  checklistItemTitleCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  ddayBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  ddayText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
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
    gap: 8,
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
  deleteButton: {
    padding: 4,
  },
  
  // 모달
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.gray400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalSaveButton: {
    paddingVertical: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
});