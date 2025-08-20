// App.js - AsyncStorage와 Supabase Auth 둘 다 체크
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/lib/supabase';
import LoadingScreen from './src/screens/LoadingScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [session, setSession] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    let authCheckInterval;

    // 앱 시작 시 인증 상태 확인
    const initializeAuth = async () => {
      try {
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

    return () => {
      mounted = false;
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
      authListener?.subscription?.unsubscribe();
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
    <>
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
    </>
  );
}