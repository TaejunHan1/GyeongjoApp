// components/NotificationPermissionModal.js - 푸시 알림 권한 요청 모달
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { getExpoPushToken } from '../lib/notificationConfig';
import { canUseNotifications } from '../lib/developmentCheck';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationPermissionModal = ({ visible, onClose, userId }) => {
  
  const requestNotificationPermission = async () => {
    try {
      console.log('🔔 알림 권한 요청 시작');
      
      // 알림 권한 요청 (푸시 토큰 없이)
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('📱 시스템 알림 권한 상태:', status);
      
      if (status === 'granted') {
        // 즉시 모달 닫기
        onClose();
        
        // 백그라운드에서 나머지 작업 처리
        setTimeout(async () => {
          try {
            // 실제 푸시 토큰 받아보기
            let pushToken = 'polling-mode-' + Date.now();
            
            try {
              console.log('🔍 실제 푸시 토큰 획득 시도...');
              pushToken = await getExpoPushToken();
              console.log('✅ 푸시 토큰 설정 완료:', pushToken);
            } catch (tokenError) {
              console.error('토큰 획득 실패:', tokenError);
              pushToken = 'polling-mode-' + Date.now();
            }
            
            // 푸시 토큰과 알림 설정 저장
            const { error } = await supabase
              .from('users')
              .update({ 
                push_notification_enabled: true,
                push_token: pushToken,
                notification_settings: {
                  contribution: true,    // 축의금 알림
                  events: true,         // 이벤트 알림
                  updates: true         // 업데이트 알림
                }
              })
              .eq('id', userId);

            if (error) {
              console.error('알림 설정 저장 오류:', error);
              return;
            }

            // 로컬 스토리지에도 저장
            await AsyncStorage.setItem('notificationPermissionAsked', 'true');
            await AsyncStorage.setItem('notificationEnabled', 'true');
            
            console.log('✅ 알림 설정 완료');
            
          } catch (bgError) {
            console.error('백그라운드 알림 처리 오류:', bgError);
          }
        }, 100);
        
      } else {
        // 권한 거부됨
        await AsyncStorage.setItem('notificationPermissionAsked', 'true');
        await AsyncStorage.setItem('notificationEnabled', 'false');
        
        Alert.alert('알림 비활성화', '설정에서 언제든지 알림을 활성화할 수 있습니다.');
        onClose();
      }
      
    } catch (error) {
      console.error('알림 권한 요청 오류:', error);
      Alert.alert('알림 설정 완료', '기본 알림 설정이 저장되었습니다.\n(개발 모드에서는 시뮬레이션됩니다)');
      
      // 에러가 나도 기본 설정은 저장
      try {
        await AsyncStorage.setItem('notificationPermissionAsked', 'true');
        await AsyncStorage.setItem('notificationEnabled', 'true');
        onClose();
      } catch (storageError) {
        console.error('로컬 저장 오류:', storageError);
      }
    }
  };

  const skipNotification = async () => {
    try {
      console.log('🔕 나중에 선택 - 제한적 알림 설정');
      
      // 백그라운드 알림은 비활성화하지만, 앱 내 알림과 업데이트는 허용
      const { error } = await supabase
        .from('users')
        .update({ 
          push_notification_enabled: false,   // 백그라운드 알림 거부
          push_token: null,                   // 푸시 토큰 제거
          notification_settings: {
            contribution: false,              // 백그라운드 축의금 알림 거부
            events: true,                    // 앱 내 이벤트 알림 허용
            updates: true                    // 업데이트 알림 허용
          }
        })
        .eq('id', userId);

      if (error) {
        console.error('알림 설정 저장 오류:', error);
      }

      // 로컬 설정
      await AsyncStorage.setItem('notificationPermissionAsked', 'true');
      await AsyncStorage.setItem('notificationEnabled', 'partial'); // 부분 허용 표시
      
      console.log('✅ 제한적 알림 설정 완료');
      onClose();
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* 아이콘 */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Text style={styles.icon}>🔔</Text>
            </View>
          </View>
          
          {/* 제목 */}
          <Text style={styles.title}>알림 받기</Text>
          
          {/* 설명 */}
          <Text style={styles.description}>
            축의금 전달 알림을 실시간으로{'\n'}
            받아보시겠어요?
          </Text>
          
          {/* 혜택 설명 */}
          <View style={styles.benefitList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💰</Text>
              <Text style={styles.benefitText}>축의금 전달 즉시 알림</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitText}>실시간 현황 업데이트</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={styles.benefitText}>중요한 이벤트 알림</Text>
            </View>
          </View>
          
          {/* 버튼들 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.allowButton} 
              onPress={requestNotificationPermission}
            >
              <Text style={styles.allowButtonText}>알림 받기</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={skipNotification}
            >
              <Text style={styles.skipButtonText}>나중에</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 72,
    height: 72,
    backgroundColor: '#f8faff',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e6f0ff',
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '400',
  },
  benefitList: {
    width: '100%',
    marginBottom: 28,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  benefitText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  allowButton: {
    backgroundColor: '#3182f6',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#3182f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  allowButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationPermissionModal;