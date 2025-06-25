// src/screens/main/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../styles/constants';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen({ navigation, userInfo, session, onLogout }) {
  const [settings, setSettings] = useState({
    notifications: true,
    eventReminders: true,
    contributionReminders: false,
    darkMode: false,
    autoBackup: true,
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings({
          ...settings,
          ...JSON.parse(savedSettings),
        });
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('설정 저장 오류:', error);
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // AsyncStorage 정리
              await AsyncStorage.removeItem('userInfo');
              await AsyncStorage.removeItem('isLoggedIn');
              await AsyncStorage.removeItem('appSettings');
              
              // Supabase 로그아웃
              await supabase.auth.signOut();
              
              // 부모 컴포넌트의 logout 함수 호출
              if (onLogout) {
                onLogout();
              }
              
              console.log('✅ 로그아웃 완료');
            } catch (error) {
              console.error('❌ 로그아웃 오류:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDataExport = () => {
    Alert.alert('준비중', '데이터 내보내기 기능을 준비 중입니다.');
  };

  const handleDataBackup = () => {
    Alert.alert('준비중', '데이터 백업 기능을 준비 중입니다.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠어요?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert('준비중', '계정 삭제 기능을 준비 중입니다.');
          },
        },
      ]
    );
  };

  const userName = userInfo?.userName || session?.user?.user_metadata?.name || '사용자';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 사용자 정보 */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userPhone}>
                {userInfo?.phone || session?.user?.phone || '번호 없음'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => Alert.alert('준비중', '프로필 편집 기능을 준비 중입니다.')}
          >
            <Text style={styles.editProfileText}>편집</Text>
          </TouchableOpacity>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          
          <SettingItem
            icon="notifications"
            title="푸시 알림"
            subtitle="새로운 부조나 업데이트 알림"
            value={settings.notifications}
            onValueChange={(value) => updateSetting('notifications', value)}
            type="switch"
          />
          
          <SettingItem
            icon="calendar"
            title="행사 알림"
            subtitle="등록한 경조사 날짜 알림"
            value={settings.eventReminders}
            onValueChange={(value) => updateSetting('eventReminders', value)}
            type="switch"
          />
          
          <SettingItem
            icon="heart"
            title="부조 알림"
            subtitle="부조 관련 알림"
            value={settings.contributionReminders}
            onValueChange={(value) => updateSetting('contributionReminders', value)}
            type="switch"
          />
        </View>

        {/* 앱 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 설정</Text>
          
          <SettingItem
            icon="moon"
            title="다크 모드"
            subtitle="어두운 테마 사용"
            value={settings.darkMode}
            onValueChange={(value) => updateSetting('darkMode', value)}
            type="switch"
            disabled={true}
          />
          
          <SettingItem
            icon="cloud-upload"
            title="자동 백업"
            subtitle="데이터 자동 클라우드 백업"
            value={settings.autoBackup}
            onValueChange={(value) => updateSetting('autoBackup', value)}
            type="switch"
          />
          
          <SettingItem
            icon="settings"
            title="부조금 기본 설정"
            subtitle="미리 설정할 부조금 금액 관리"
            onPress={() => navigation.navigate('ContributionSettings')}
            type="arrow"
          />
        </View>

        {/* 데이터 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>데이터 관리</Text>
          
          <SettingItem
            icon="download"
            title="데이터 내보내기"
            subtitle="Excel, PDF로 데이터 내보내기"
            onPress={handleDataExport}
            type="arrow"
          />
          
          <SettingItem
            icon="cloud"
            title="백업 및 복원"
            subtitle="수동 백업 및 데이터 복원"
            onPress={handleDataBackup}
            type="arrow"
          />
        </View>

        {/* 지원 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지원</Text>
          
          <SettingItem
            icon="help-circle"
            title="도움말"
            subtitle="앱 사용법 및 FAQ"
            onPress={() => Alert.alert('준비중', '도움말 기능을 준비 중입니다.')}
            type="arrow"
          />
          
          <SettingItem
            icon="mail"
            title="문의하기"
            subtitle="버그 신고나 건의사항"
            onPress={() => Alert.alert('준비중', '문의하기 기능을 준비 중입니다.')}
            type="arrow"
          />
          
          <SettingItem
            icon="document-text"
            title="이용약관 및 개인정보처리방침"
            subtitle="서비스 약관 확인"
            onPress={() => Alert.alert('준비중', '약관 보기 기능을 준비 중입니다.')}
            type="arrow"
          />
        </View>

        {/* 계정 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.error }]}>
                  <Ionicons name="log-out" size={20} color={Colors.white} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: Colors.error }]}>로그아웃</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>계정 삭제</Text>
          </TouchableOpacity>
        </View>

        {/* 앱 정보 */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>정담 v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 정담. All rights reserved.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 설정 아이템 컴포넌트
const SettingItem = ({ 
  icon, 
  title, 
  subtitle, 
  value, 
  onValueChange, 
  onPress, 
  type = 'arrow',
  disabled = false 
}) => {
  const handlePress = () => {
    if (disabled) return;
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.settingItem, disabled && styles.settingItemDisabled]} 
      onPress={handlePress}
      disabled={disabled || type === 'switch'}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, disabled && styles.settingIconDisabled]}>
          <Ionicons 
            name={icon} 
            size={20} 
            color={disabled ? Colors.gray400 : Colors.primary} 
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.gray300, true: Colors.primary }}
          thumbColor={value ? Colors.white : Colors.gray400}
          disabled={disabled}
        />
      )}
      
      {type === 'arrow' && !disabled && (
        <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  content: {
    flex: 1,
  },
  
  // 사용자 섹션
  userSection: {
    backgroundColor: Colors.white,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editProfileButton: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  
  // 섹션
  section: {
    backgroundColor: Colors.white,
    marginBottom: 12,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.gray50,
  },
  
  // 설정 아이템
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconDisabled: {
    backgroundColor: Colors.gray100,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: Colors.gray400,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // 로그아웃 버튼
  logoutButton: {
    borderBottomWidth: 0,
  },
  
  // 계정 삭제 버튼
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.gray400,
    textDecorationLine: 'underline',
  },
  
  // 앱 정보
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  copyright: {
    fontSize: 12,
    color: Colors.gray400,
  },
});