// src/lib/notificationConfig.js - 푸시 알림 설정 및 채널 구성
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Android 알림 채널 설정
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    // 축의금 알림 채널
    await Notifications.setNotificationChannelAsync('contribution-notifications', {
      name: '축의금 알림',
      description: '축의금 전달 관련 알림입니다.',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3182f6',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // 일반 이벤트 알림 채널
    await Notifications.setNotificationChannelAsync('event-notifications', {
      name: '이벤트 알림',
      description: '이벤트 관련 일반 알림입니다.',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#4CAF50',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    console.log('🔔 Android 알림 채널 설정 완료');
  }
};

// 알림 권한 상태 확인
export const checkNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  return existingStatus;
};

// Expo 푸시 알림 설정 (Firebase 없이)

// 푸시 토큰 가져오기 (FCM 토큰 시도)
export const getExpoPushToken = async () => {
  try {
    console.log('🔍 FCM 푸시 토큰 획득 시도...');
    
    // Expo projectId 사용 (app.json의 extra.eas.projectId)
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: '6e007e44-78af-48b5-b36e-ab75a54ab3fa'
    });
    
    if (token) {
      if (token.length > 100 && !token.startsWith('ExponentPushToken')) {
        console.log('🎯 FCM 토큰 획득 성공 (백그라운드 알림 가능):', token.substring(0, 30) + '...');
        return token;
      } else {
        console.log('🎯 Expo 토큰 획득 (일부 백그라운드 알림 가능):', token.substring(0, 30) + '...');
        return token;
      }
    }
    
    throw new Error('토큰 획득 실패');
  } catch (error) {
    console.error('❌ 토큰 획득 실패:', error);
    console.log('📱 폴링 모드로 전환');
    return 'polling-mode-' + Date.now();
  }
};