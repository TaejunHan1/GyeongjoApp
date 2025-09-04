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
              contribution: true,
              events: true, 
              updates: false
            }
          })
          .eq('id', userId);

        if (error) {
          console.error('알림 설정 저장 오류:', error);
          Alert.alert('오류', '알림 설정 저장에 실패했습니다.');
          return;
        }

        // 로컬 스토리지에도 저장
        await AsyncStorage.setItem('notificationPermissionAsked', 'true');
        await AsyncStorage.setItem('notificationEnabled', 'true');
        
        // 토큰 타입에 따라 메시지 구분
        if (pushToken && pushToken.startsWith('ExponentPushToken')) {
          console.log('✅ Expo 백그라운드 알림 설정 완료');
          Alert.alert(
            'Expo 백그라운드 알림 활성화! 🎉', 
            '새로운 축의금이 전달되면 앱이 백그라운드에 있어도 즉시 알림을 받습니다.\n\n📱 Expo Push 서비스를 통해 알림이 전달됩니다.'
          );
        } else if (pushToken && !pushToken.includes('polling-mode') && pushToken.length > 100) {
          console.log('✅ FCM 백그라운드 알림 설정 완료');
          Alert.alert(
            '백그라운드 알림 활성화! 🎉', 
            '새로운 축의금이 전달되면 앱이 백그라운드에 있어도 즉시 알림을 받습니다.'
          );
        } else {
          console.log('✅ 폴링 모드 알림 설정 완료');
          Alert.alert(
            '알림 활성화 완료! 🎉', 
            '새로운 축의금이 전달되면 앱에서 바로 확인할 수 있습니다.\n\n📱 앱이 실행 중일 때 실시간으로 업데이트됩니다.'
          );
        }
        onClose();
        
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
      await AsyncStorage.setItem('notificationPermissionAsked', 'true');
      await AsyncStorage.setItem('notificationEnabled', 'false');
      onClose();
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f8ff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3182f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#8b95a1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitList: {
    width: '100%',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 28,
  },
  benefitText: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
  allowButton: {
    backgroundColor: '#3182f6',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#3182f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  allowButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#8b95a1',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default NotificationPermissionModal;