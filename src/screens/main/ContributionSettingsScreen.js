// src/screens/main/ContributionSettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../styles/constants';

export default function ContributionSettingsScreen({ navigation }) {
  const [presetGroups, setPresetGroups] = useState([
    { id: '1', name: '일반', amounts: [30000, 50000, 100000], selected: true },
    { id: '2', name: '친한 지인', amounts: [50000, 100000, 200000], selected: false },
    { id: '3', name: '가족/친척', amounts: [100000, 200000, 300000], selected: false },
    { id: '4', name: '비즈니스', amounts: [200000, 300000, 500000], selected: false },
  ]);

  const [customAmounts, setCustomAmounts] = useState(['', '', '']);
  const [defaultRelations, setDefaultRelations] = useState(['신랑측', '신부측']);
  const [newRelation, setNewRelation] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedPresets = await AsyncStorage.getItem('contributionPresets');
      const savedRelations = await AsyncStorage.getItem('defaultRelations');
      
      if (savedPresets) {
        setPresetGroups(JSON.parse(savedPresets));
      }
      
      if (savedRelations) {
        setDefaultRelations(JSON.parse(savedRelations));
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('contributionPresets', JSON.stringify(presetGroups));
      await AsyncStorage.setItem('defaultRelations', JSON.stringify(defaultRelations));
      Alert.alert('완료', '설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const parseAmount = (amountString) => {
    return parseInt(amountString.replace(/[^\d]/g, '')) || 0;
  };

  const selectPresetGroup = (groupId) => {
    setPresetGroups(prev => 
      prev.map(group => ({
        ...group,
        selected: group.id === groupId
      }))
    );
  };

  const updateCustomAmount = (index, value) => {
    const newCustomAmounts = [...customAmounts];
    newCustomAmounts[index] = value;
    setCustomAmounts(newCustomAmounts);
  };

  const addCustomPreset = () => {
    const amounts = customAmounts
      .map(amount => parseAmount(amount))
      .filter(amount => amount > 0)
      .sort((a, b) => a - b);

    if (amounts.length < 3) {
      Alert.alert('알림', '3개의 금액을 모두 입력해주세요.');
      return;
    }

    const newGroup = {
      id: Date.now().toString(),
      name: '커스텀',
      amounts: amounts,
      selected: false,
    };

    setPresetGroups(prev => [...prev, newGroup]);
    setCustomAmounts(['', '', '']);
    Alert.alert('완료', '커스텀 금액이 추가되었습니다.');
  };

  const deletePresetGroup = (groupId) => {
    const group = presetGroups.find(g => g.id === groupId);
    if (group?.name === '일반') {
      Alert.alert('알림', '기본 그룹은 삭제할 수 없습니다.');
      return;
    }

    Alert.alert(
      '삭제 확인',
      '이 금액 그룹을 삭제하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setPresetGroups(prev => {
              const filtered = prev.filter(g => g.id !== groupId);
              // 삭제된 그룹이 선택되어 있었다면 첫 번째 그룹을 선택
              if (group?.selected && filtered.length > 0) {
                filtered[0].selected = true;
              }
              return filtered;
            });
          },
        },
      ]
    );
  };

  const addRelation = () => {
    if (!newRelation.trim()) {
      Alert.alert('알림', '관계명을 입력해주세요.');
      return;
    }

    if (defaultRelations.includes(newRelation.trim())) {
      Alert.alert('알림', '이미 존재하는 관계명입니다.');
      return;
    }

    setDefaultRelations(prev => [...prev, newRelation.trim()]);
    setNewRelation('');
  };

  const removeRelation = (index) => {
    if (defaultRelations.length <= 1) {
      Alert.alert('알림', '최소 1개의 관계는 유지해야 합니다.');
      return;
    }

    setDefaultRelations(prev => prev.filter((_, i) => i !== index));
  };

  const resetToDefault = () => {
    Alert.alert(
      '초기화 확인',
      '모든 설정을 기본값으로 초기화하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            setPresetGroups([
              { id: '1', name: '일반', amounts: [30000, 50000, 100000], selected: true },
              { id: '2', name: '친한 지인', amounts: [50000, 100000, 200000], selected: false },
              { id: '3', name: '가족/친척', amounts: [100000, 200000, 300000], selected: false },
              { id: '4', name: '비즈니스', amounts: [200000, 300000, 500000], selected: false },
            ]);
            setDefaultRelations(['신랑측', '신부측']);
            setCustomAmounts(['', '', '']);
            setNewRelation('');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 미리 설정 금액 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>미리 설정 금액</Text>
            <Text style={styles.sectionSubtitle}>
              경조사 등록 시 사용할 기본 부조금 금액을 설정하세요
            </Text>
          </View>

          {presetGroups.map((group) => (
            <View key={group.id} style={styles.presetGroup}>
              <TouchableOpacity
                style={[
                  styles.presetGroupHeader,
                  group.selected && styles.presetGroupHeaderSelected,
                ]}
                onPress={() => selectPresetGroup(group.id)}
              >
                <View style={styles.presetGroupLeft}>
                  <View style={[
                    styles.radio,
                    group.selected && styles.radioSelected,
                  ]}>
                    {group.selected && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.presetGroupName,
                    group.selected && styles.presetGroupNameSelected,
                  ]}>
                    {group.name}
                  </Text>
                </View>
                
                {group.name !== '일반' && (
                  <TouchableOpacity
                    onPress={() => deletePresetGroup(group.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              
              <View style={styles.presetAmounts}>
                {group.amounts.map((amount, index) => (
                  <View key={index} style={styles.amountChip}>
                    <Text style={styles.amountText}>{formatAmount(amount)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* 커스텀 금액 추가 */}
          <View style={styles.customSection}>
            <Text style={styles.customTitle}>커스텀 금액 추가</Text>
            <View style={styles.customInputs}>
              {customAmounts.map((amount, index) => (
                <TextInput
                  key={index}
                  style={styles.customInput}
                  placeholder={`금액 ${index + 1}`}
                  value={amount ? formatAmount(parseAmount(amount)) : ''}
                  onChangeText={(text) => updateCustomAmount(index, text)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.gray400}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.addCustomButton} onPress={addCustomPreset}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addCustomText}>커스텀 금액 추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 기본 관계 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>기본 관계 설정</Text>
            <Text style={styles.sectionSubtitle}>
              부조자가 선택할 수 있는 기본 관계를 설정하세요
            </Text>
          </View>

          <View style={styles.relationsList}>
            {defaultRelations.map((relation, index) => (
              <View key={index} style={styles.relationItem}>
                <Text style={styles.relationText}>{relation}</Text>
                {defaultRelations.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeRelation(index)}
                    style={styles.removeRelationButton}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <View style={styles.addRelationSection}>
            <TextInput
              style={styles.relationInput}
              placeholder="새 관계 입력 (예: 친구, 동료, 선후배 등)"
              value={newRelation}
              onChangeText={setNewRelation}
              placeholderTextColor={Colors.gray400}
            />
            <TouchableOpacity style={styles.addRelationButton} onPress={addRelation}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addRelationText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 도움말 */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 도움말</Text>
          <View style={styles.helpList}>
            <View style={styles.helpItem}>
              <Text style={styles.helpText}>
                • 선택된 금액 그룹이 새 경조사의 기본값으로 사용됩니다
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpText}>
                • 커스텀 금액은 작은 금액부터 자동으로 정렬됩니다
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpText}>
                • 기본 관계는 부조자가 빠르게 선택할 수 있는 옵션입니다
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.resetButton} onPress={resetToDefault}>
          <Text style={styles.resetButtonText}>기본값으로 초기화</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  content: {
    flex: 1,
  },
  
  // 섹션
  section: {
    backgroundColor: Colors.white,
    marginBottom: 12,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // 프리셋 그룹
  presetGroup: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  presetGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.gray50,
  },
  presetGroupHeaderSelected: {
    backgroundColor: Colors.primary,
  },
  presetGroupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.white,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  presetGroupName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  presetGroupNameSelected: {
    color: Colors.white,
  },
  deleteButton: {
    padding: 4,
  },
  presetAmounts: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  amountChip: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  
  // 커스텀 섹션
  customSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  customInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.gray200,
    textAlign: 'center',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: 4,
  },
  addCustomText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // 관계 리스트
  relationsList: {
    gap: 8,
    marginBottom: 16,
  },
  relationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  relationText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  removeRelationButton: {
    padding: 4,
  },
  
  // 관계 추가
  addRelationSection: {
    flexDirection: 'row',
    gap: 8,
  },
  relationInput: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  addRelationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  addRelationText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 14,
  },
  
  // 도움말
  helpSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  helpList: {
    gap: 8,
  },
  helpItem: {},
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // 하단 버튼
  bottomButtons: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.gray100,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});