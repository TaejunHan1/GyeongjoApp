import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const NotificationPermissionModal = ({ visible, onClose, userInfo }) => {
  const [loading, setLoading] = useState(false);

  const handleAllowNotifications = async () => {
    try {
      // 즉시 모달 닫기
      onClose();
      
      // 백그라운드에서 처리
      setTimeout(async () => {
        setLoading(true);
        
        // userInfo 확인 및 변환
        const actualUserInfo = userInfo?.userId ? {
          id: userInfo.userId,
          name: userInfo.userName
        } : userInfo;
        
        console.log('📱 알림 허용 프로세스 시작 - userInfo:', actualUserInfo);

        // 1. 알림 권한 요청
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('📱 시스템 알림 권한:', status);
        
        if (status !== 'granted') {
          Toast.show({
            type: 'error',
            text1: '알림 권한 필요',
            text2: '설정에서 알림 권한을 허용해주세요.',
            position: 'top',
            visibilityTime: 4000,
            topOffset: 60,
          });
          setLoading(false);
          return;
        }

        // 2. Expo 푸시 토큰 생성
        let pushToken = null;
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '6e007e44-78af-48b5-b36e-ab75a54ab3fa',
          });
          pushToken = tokenData.data;
          console.log('📱 Expo 푸시 토큰 생성:', pushToken);
        } catch (tokenError) {
          console.error('❌ 푸시 토큰 생성 실패:', tokenError);
          Toast.show({
            type: 'error',
            text1: '토큰 생성 실패',
            text2: '푸시 알림 설정에 실패했습니다.',
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
          });
          setLoading(false);
          return;
        }

        // 3. 데이터베이스에 알림 설정 업데이트 (모든 알림 활성화)
        const { error } = await supabase
          .from('users')
          .update({
            push_notification_enabled: true,
            push_token: pushToken,
            notification_settings: {
              contribution: true,        // 축의금 알림
              event_reminder: true,      // 경조사 리마인더
              app_notifications: true    // 앱 내 알림
            }
          })
          .eq('id', actualUserInfo.id);

        if (error) {
          console.error('❌ 알림 설정 저장 실패:', error);
          Toast.show({
            type: 'error',
            text1: '설정 저장 실패',
            text2: '알림 설정 저장에 실패했습니다.',
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
          });
          setLoading(false);
          return;
        }

        // 4. 로컬 저장소에 권한 상태 저장
        await AsyncStorage.setItem('notificationPermissionAsked', 'true');
        await AsyncStorage.setItem('notificationPermissionGranted', 'true');

        console.log('✅ 알림 설정 완료');
        Toast.show({
          type: 'success',
          text1: '알림 설정 완료',
          text2: '축의금 알림을 받을 수 있습니다.',
          position: 'top',
          visibilityTime: 3000,
          topOffset: 60,
        });

        setLoading(false);
      }, 100);
    } catch (error) {
      console.error('❌ 알림 허용 처리 중 오류:', error);
      Toast.show({
        type: 'error',
        text1: '오류 발생',
        text2: '알림 설정 중 오류가 발생했습니다.',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 60,
      });
      setLoading(false);
    }
  };

  const handleLater = async () => {
    try {
      // 즉시 모달 닫기
      onClose();
      
      // 백그라운드에서 처리
      setTimeout(async () => {
        // userInfo 확인 및 변환
        const actualUserInfo = userInfo?.userId ? {
          id: userInfo.userId,
          name: userInfo.userName
        } : userInfo;
        
        console.log('📱 알림 나중에 처리 - userInfo:', actualUserInfo);

        // 데이터베이스에 백그라운드 알림만 비활성화, 앱 내 알림은 유지
        const { error } = await supabase
          .from('users')
          .update({
            push_notification_enabled: false,
            notification_settings: {
              contribution: false,       // 백그라운드 축의금 알림 비활성화
              event_reminder: false,     // 백그라운드 리마인더 비활성화
              app_notifications: true    // 앱 내 알림은 유지
            }
          })
          .eq('id', actualUserInfo.id);

        if (error) {
          console.error('❌ 알림 설정 업데이트 실패:', error);
        }

        // 로컬 저장소에 권한 요청 상태만 저장 (거부는 저장하지 않음)
        await AsyncStorage.setItem('notificationPermissionAsked', 'true');

        Toast.show({
          type: 'info',
          text1: '알림 비활성화',
          text2: '설정에서 언제든지 알림을 활성화할 수 있습니다.',
          position: 'top',
          visibilityTime: 3000,
          topOffset: 60,
        });
      }, 100);
    } catch (error) {
      console.error('❌ 나중에 처리 중 오류:', error);
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
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications-outline" size={32} color="#FF6B6B" />
            </View>
            <Text style={styles.title}>알림 받기</Text>
            <Text style={styles.subtitle}>
              축의금이 전달될 때 알림을 받으시겠습니까?
            </Text>
          </View>

          {/* 알림 타입 설명 */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="cash-outline" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>축의금 전달 알림</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
              <Text style={styles.featureText}>경조사 리마인더</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
              <Text style={styles.featureText}>중요 소식 알림</Text>
            </View>
          </View>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.laterButton]}
              onPress={handleLater}
              disabled={loading}
            >
              <Text style={styles.laterButtonText}>나중에</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.allowButton]}
              onPress={handleAllowNotifications}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.allowButtonText}>알림 받기</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 개인정보 안내 */}
          <Text style={styles.privacyText}>
            알림 설정은 언제든지 앱 설정에서 변경할 수 있습니다.
          </Text>
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
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  laterButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  allowButton: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  privacyText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default NotificationPermissionModal;