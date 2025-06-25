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
      }
      
      return null;
    } catch (error) {
      console.error('❌ AsyncStorage 체크 오류:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // 앱 시작 시 인증 상태 확인
    const initializeAuth = async () => {
      try {
        // 1. 먼저 AsyncStorage 체크 (폰 인증 사용자)
        const asyncAuthResult = await checkAsyncStorageAuth();
        
        if (asyncAuthResult && mounted) {
          console.log('🟢 AsyncStorage 인증 성공');
          setLoading(false);
          return;
        }
        
        // 2. AsyncStorage에 없으면 Supabase Auth 체크 (기존 OAuth 사용자)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            console.log('🟢 Supabase Auth 로그인:', session.user.phone || session.user.email);
            setSession(session);
            setIsAuthenticated(true);
          } else {
            console.log('🔴 인증되지 않은 사용자');
            setIsAuthenticated(false);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('🔴 초기화 오류:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Supabase Auth 상태 변화 감지 (OAuth 로그인용)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🟡 Supabase Auth 상태 변화:', event, session?.user?.phone || session?.user?.email || 'No user');
        
        if (mounted) {
          if (event === 'SIGNED_IN' && session?.user) {
            setSession(session);
            setIsAuthenticated(true);
            setLoading(false);
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setIsAuthenticated(false);
            setLoading(false);
            
            // Supabase 로그아웃 시 AsyncStorage도 정리
            await AsyncStorage.removeItem('userInfo');
            await AsyncStorage.removeItem('isLoggedIn');
            setUserInfo(null);
          }
        }
      }
    );

    // AsyncStorage 변화 감지 (주기적 체크)
    const asyncStorageInterval = setInterval(async () => {
      if (!isAuthenticated) {
        const asyncAuthResult = await checkAsyncStorageAuth();
        if (asyncAuthResult && mounted && !isAuthenticated) {
          console.log('🔄 AsyncStorage 변화 감지 - 로그인 상태로 전환');
          setUserInfo(asyncAuthResult);
          setIsAuthenticated(true);
          setLoading(false);
        }
      }
    }, 1000); // 1초마다 체크

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(asyncStorageInterval);
    };
  }, [isAuthenticated]);

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      // AsyncStorage 정리
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('isLoggedIn');
      
      // Supabase Auth 로그아웃
      await supabase.auth.signOut();
      
      // 상태 초기화
      setSession(null);
      setUserInfo(null);
      setIsAuthenticated(false);
      
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      {isAuthenticated ? (
        <AppNavigator 
          session={session} 
          userInfo={userInfo}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
      ) : (
        <AuthNavigator />
      )}
    </>
  );
}