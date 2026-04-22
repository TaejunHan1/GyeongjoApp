// App.js - AsyncStorage와 Supabase Auth 둘 다 체크
import React, { useState, useEffect, useRef } from 'react';
import { Alert, Platform, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

// Expo Go에서 나오는 알림 관련 경고 숨기기
LogBox.ignoreLogs([
  'expo-notifications',
  'expo-notifications:',
  'Android Push notifications',
  'functionality is not fully supported',
  'Network request failed',
]);

// 네트워크 에러 (Supabase Realtime 등) 조용히 처리
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args[0]?.toString?.() || '';
  if (msg.includes('Network request failed')) return;
  originalConsoleError(...args);
};
import { supabase } from './src/lib/supabase';
import LoadingScreen from './src/screens/LoadingScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import { TutorialProvider } from './src/contexts/TutorialContext';
import TutorialOverlay from './src/components/TutorialOverlay';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


// Expo 네이티브 알림 초기화 (Expo Go에서는 제한됨)
const initializeNotifications = async () => {
  try {
    console.log('🔔 Expo 알림 시스템 초기화...');

    // Android 알림 채널 설정 (함수 존재 여부 확인)
    if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
      console.log('📱 Android 기본 알림 채널 설정...');
      await Notifications.setNotificationChannelAsync('contribution-notifications', {
        name: '축의금 알림',
        importance: Notifications.AndroidImportance?.HIGH || 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
      console.log('✅ Android 기본 알림 채널 설정 완료');
    } else {
      console.log('📱 알림 채널 설정 스킵 (Expo Go 제한)');
    }

    return true;
  } catch (error) {
    console.log('⚠️ 알림 초기화 스킵 (Expo Go 제한):', error.message);
    return false;
  }
};

// 알림 수신 시 처리 설정 (백그라운드 알림 지원) - Expo Go에서는 제한됨
try {
  if (typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('🔔 백그라운드 알림 수신:', notification);

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH || 'high',
        };
      },
    });
    console.log('✅ 백그라운드 알림 핸들러 설정 완료');
  } else {
    console.log('⚠️ 알림 핸들러 설정 스킵 (Expo Go 제한)');
  }
} catch (error) {
  console.log('⚠️ 알림 핸들러 설정 스킵 (Expo Go 제한)');
}

export default function App() {
  const [session, setSession] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 커스텀 폰트 로드
  useEffect(() => {
    Font.loadAsync({
      'Great Vibes': require('./assets/fonts/GreatVibes-Regular.ttf'),
    }).catch(() => {});
  }, []);
  
  // 알림 리스너 참조
  const notificationListener = useRef();
  const responseListener = useRef();

  // AsyncStorage에서 사용자 정보 확인
  const checkAsyncStorageAuth = async () => {
    try {
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      console.log('📱 AsyncStorage 체크:', { 
        storedUserInfo: !!storedUserInfo, 
        isLoggedIn,
        parsedData: storedUserInfo ? JSON.parse(storedUserInfo) : null
      });
      
      if (isLoggedIn === 'true' && storedUserInfo) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        console.log('✅ AsyncStorage 로그인 확인:', parsedUserInfo.userName);
        
        setUserInfo(parsedUserInfo);
        setIsAuthenticated(true);
        return parsedUserInfo; // userInfo 반환
      } else {
        // AsyncStorage에 로그인 정보가 없으면 인증되지 않은 상태로 설정
        if (isAuthenticated) {
          console.log('❌ AsyncStorage 로그인 정보 없음 - 로그아웃 상태로 변경');
          setUserInfo(null);
          setIsAuthenticated(false);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ AsyncStorage 체크 오류:', error);
      return null;
    }
  };

  // 알림 수신 처리 함수
  const handleNotificationReceived = (notification) => {
    console.log('🔔 알림 수신:', notification);
    
    // 축의금 알림인 경우
    if (notification.request.content.data?.type === 'contribution') {
      console.log('💰 축의금 알림 데이터:', notification.request.content.data);
    }
  };

  // 알림 탭 처리 함수
  const handleNotificationResponse = (response) => {
    console.log('👆 알림 탭 응답:', response);
    
    const data = response.notification.request.content.data;
    if (data?.type === 'contribution' && data.eventId) {
      // 필요시 특정 화면으로 네비게이션 처리
      console.log('축의금 알림 탭 - 이벤트로 이동:', data.eventId);
    }
  };

  useEffect(() => {
    let mounted = true;
    let authCheckInterval;

    // 앱 시작 시 인증 상태 확인
    const initializeAuth = async () => {
      try {
        // 알림 시스템 초기화  
        await initializeNotifications();
        
        // 1. 먼저 AsyncStorage 체크 (폰 인증 사용자)
        const asyncStorageUser = await checkAsyncStorageAuth();
        
        if (asyncStorageUser && mounted) {
          console.log('✅ 폰 인증 사용자 로그인 유지:', asyncStorageUser.userName);
          setLoading(false);
          return; // 폰 인증 사용자는 여기서 종료
        }

        // 2. AsyncStorage에 없으면 Supabase 세션 체크 (OAuth 사용자)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          console.log('✅ Supabase OAuth 세션 확인:', session.user.email);
          setSession(session);
          setIsAuthenticated(true);
        } else {
          console.log('❌ 로그인 필요 - 인증 화면으로 이동');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('초기화 오류:', error);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // 정기적으로 AsyncStorage 체크 (인증 상태 변경 감지)
    const checkAuthPeriodically = async () => {
      if (!loading && mounted) {
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        
        // 현재 상태와 AsyncStorage 상태 비교
        const shouldBeAuthenticated = isLoggedIn === 'true' && storedUserInfo;
        
        if (shouldBeAuthenticated && !isAuthenticated) {
          // 로그인 상태로 변경
          const parsedUserInfo = JSON.parse(storedUserInfo);
          console.log('🔄 인증 상태 변경 감지 - 로그인:', parsedUserInfo.userName);
          setUserInfo(parsedUserInfo);
          setIsAuthenticated(true);
        } else if (!shouldBeAuthenticated && isAuthenticated) {
          // 로그아웃 상태로 변경
          console.log('🔄 인증 상태 변경 감지 - 로그아웃');
          setUserInfo(null);
          setIsAuthenticated(false);
        }
      }
    };

    initializeAuth();
    
    // 1초마다 AsyncStorage 체크 (인증 상태 변경 감지용)
    authCheckInterval = setInterval(checkAuthPeriodically, 1000);

    // Supabase 인증 상태 변경 감지 (OAuth용)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth 상태 변경:', _event);
        
        // 폰 인증 사용자가 있으면 Supabase 이벤트 무시
        const asyncStorageUser = await checkAsyncStorageAuth();
        if (asyncStorageUser) {
          console.log('📱 폰 인증 사용자 우선 - Supabase 이벤트 무시');
          return;
        }
        
        // OAuth 사용자 처리
        if (session) {
          setSession(session);
          setIsAuthenticated(true);
        } else {
          setSession(null);
          setIsAuthenticated(false);
        }
      }
    );

    // 푸시 알림 리스너 설정 (Expo Go에서는 제한됨)
    try {
      if (typeof Notifications.addNotificationReceivedListener === 'function') {
        notificationListener.current = Notifications.addNotificationReceivedListener(handleNotificationReceived);
      }
      if (typeof Notifications.addNotificationResponseReceivedListener === 'function') {
        responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
      }
      console.log('🔔 푸시 알림 리스너 설정 완료');
    } catch (error) {
      console.log('⚠️ Expo Go 환경 - 알림 기능 비활성화');
    }

    return () => {
      mounted = false;
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
      authListener?.subscription?.unsubscribe();

      // 알림 리스너 정리 (함수 존재 여부 확인)
      try {
        if (notificationListener.current) {
          if (typeof Notifications.removeNotificationSubscription === 'function') {
            Notifications.removeNotificationSubscription(notificationListener.current);
          } else if (notificationListener.current?.remove) {
            notificationListener.current.remove();
          }
        }
        if (responseListener.current) {
          if (typeof Notifications.removeNotificationSubscription === 'function') {
            Notifications.removeNotificationSubscription(responseListener.current);
          } else if (responseListener.current?.remove) {
            responseListener.current.remove();
          }
        }
      } catch (cleanupError) {
        console.log('⚠️ 알림 리스너 정리 스킵');
      }
    };
  }, []);

  // 로그아웃 함수 - 자식 컴포넌트에 전달
  const handleLogout = async () => {
    try {
      // AsyncStorage 클리어 (폰 인증 사용자)
      await AsyncStorage.multiRemove(['userInfo', 'isLoggedIn']);
      
      // Supabase 로그아웃 (OAuth 사용자)
      await supabase.auth.signOut();
      
      // 상태 초기화
      setUserInfo(null);
      setSession(null);
      setIsAuthenticated(false);
      
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TutorialProvider>
          <StatusBar style="auto" />
          {isAuthenticated ? (
            <AppNavigator
              userInfo={userInfo}
              session={session}
              onLogout={handleLogout}
            />
          ) : (
            <AuthNavigator
              setUserInfo={setUserInfo}
              setIsAuthenticated={setIsAuthenticated}
            />
          )}
          {isAuthenticated && <TutorialOverlay scope="app" />}
          <Toast />
        </TutorialProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}