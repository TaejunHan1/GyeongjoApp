// Firebase 초기화 설정
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Firebase 설정 (app.json과 일치)
const firebaseConfig = {
  apiKey: "AIzaSyC8VB0xt0LnEPGTnjcb_2ZCP7zo1ym_acw",
  authDomain: "gyeongjoapp.firebaseapp.com",
  projectId: "gyeongjoapp",
  storageBucket: "gyeongjoapp.firebasestorage.app",
  messagingSenderId: "455141269729",
  appId: "1:455141269729:android:85ce82bd3e2341965b17a0"
};

// FCM 토큰 획득 (Firebase 설정 사용)
export const getFCMToken = async () => {
  try {
    console.log('🔥 Firebase 설정으로 FCM 토큰 획득...');
    
    // Expo가 google-services.json + app.json 설정을 사용해서 FCM 토큰 획득
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: firebaseConfig.projectId
    });
    
    if (token) {
      console.log('🎯 FCM 토큰 획득 성공 (백그라운드 알림 지원):', token.substring(0, 30) + '...');
      return token;
    } else {
      throw new Error('FCM 토큰 획득 실패');
    }
  } catch (error) {
    console.error('❌ FCM 토큰 획득 실패:', error);
    return null;
  }
};