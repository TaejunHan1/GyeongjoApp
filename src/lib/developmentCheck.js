// src/lib/developmentCheck.js - Development build 체크 유틸리티
import Constants from 'expo-constants';

// Development build인지 체크
export const isDevelopmentBuild = () => {
  // expo-dev-client가 설치되어 있고 development build로 실행 중인지 확인
  return Constants.executionEnvironment === 'storeClient' || 
         Constants.executionEnvironment === 'standalone';
};

// Expo Go인지 체크
export const isExpoGo = () => {
  return Constants.executionEnvironment === 'expoGo';
};

// 알림 기능 사용 가능 여부
export const canUseNotifications = () => {
  // SDK 53부터는 Expo Go에서 알림 지원 안함
  if (isExpoGo()) {
    console.warn('⚠️ 푸시 알림은 Development Build에서만 작동합니다.');
    console.warn('📱 빌드 진행 중: https://expo.dev/accounts/takun/projects/gyeongjoapp/builds/');
    return false;
  }
  return true;
};