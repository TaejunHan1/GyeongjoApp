// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/main/HomeScreen';
import MyEventsScreen from '../screens/main/MyEventsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CreateEventScreen from '../screens/event/CreateEventScreen';
import EventDetailScreen from '../screens/event/EventDetailScreen';
import ContributionScreen from '../screens/event/ContributionScreen';

// 새로운 화면들
import QRCodeScreen from '../screens/event/QRCodeScreen';
import EventDisplayScreen from '../screens/event/EventDisplayScreen';

// [수정] 파일명과 컴포넌트명을 'SettingsScreen' (복수형)으로 통일합니다.
import SettingsScreen from '../screens/main/SettingsScreen'; 
import ContributionSettingsScreen from '../screens/main/ContributionSettingsScreen';

import { Colors } from '../styles/constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 하단 탭 네비게이터
function MainTabNavigator({ userInfo, session, isAuthenticated, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyEvents') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.gray100,
          backgroundColor: Colors.white,
          paddingBottom: 20,
          paddingTop: 8,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        options={{ tabBarLabel: '홈' }}
      >
        {(props) => (
          <HomeScreen 
            {...props} 
            userInfo={userInfo}
            session={session}
            isAuthenticated={isAuthenticated}
          />
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="MyEvents" 
        options={{ tabBarLabel: '내 행사' }}
      >
        {(props) => (
          <MyEventsScreen 
            {...props} 
            userInfo={userInfo}
            session={session}
            isAuthenticated={isAuthenticated}
          />
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile" 
        options={{ tabBarLabel: '프로필' }}
      >
        {(props) => (
          <ProfileScreen 
            {...props} 
            userInfo={userInfo}
            session={session}
            isAuthenticated={isAuthenticated}
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// 메인 스택 네비게이터
export default function AppNavigator({ session, userInfo, isAuthenticated, onLogout }) {
  console.log('🏗️ AppNavigator props:', { 
    hasSession: !!session, 
    hasUserInfo: !!userInfo, 
    isAuthenticated,
    userInfo: userInfo ? { userId: userInfo.userId, userName: userInfo.userName } : null
  });

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="MainTabs">
          {(props) => (
            <MainTabNavigator
              {...props}
              userInfo={userInfo}
              session={session}
              isAuthenticated={isAuthenticated}
              onLogout={onLogout}
            />
          )}
        </Stack.Screen>
        
        {/* 경조사 관련 화면들 */}
        <Stack.Screen 
          name="CreateEvent" 
          options={{
            headerShown: true,
            title: '경조사 만들기',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.gray100,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: Colors.textPrimary,
            },
            headerTintColor: Colors.textPrimary,
          }}
        >
          {(props) => (
            <CreateEventScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="EventDetail" 
          options={{
            headerShown: true,
            title: '경조사 상세',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.gray100,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: Colors.textPrimary,
            },
            headerTintColor: Colors.textPrimary,
          }}
        >
          {(props) => (
            <EventDetailScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Contribution" 
          options={{
            headerShown: true,
            title: '부조하기',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.gray100,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: Colors.textPrimary,
            },
            headerTintColor: Colors.textPrimary,
          }}
        >
          {(props) => (
            <ContributionScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        {/* QR 코드 화면 */}
        <Stack.Screen 
          name="QRCode" 
          options={{
            headerShown: true,
            title: 'QR 코드',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.gray100,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: Colors.textPrimary,
            },
            headerTintColor: Colors.textPrimary,
          }}
        >
          {(props) => (
            <QRCodeScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        {/* 경조사 전시 화면 (태블릿용) */}
        <Stack.Screen 
          name="EventDisplay" 
          options={{
            headerShown: false,
            gestureEnabled: false,
            orientation: 'landscape',
          }}
        >
          {(props) => (
            <EventDisplayScreen 
              {...props} 
            />
          )}
        </Stack.Screen>

        {/* 설정 관련 화면들 */}
        <Stack.Screen 
          name="Settings" 
          options={{
            headerShown: true,
            title: '설정',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.gray100,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: Colors.textPrimary,
            },
            headerTintColor: Colors.textPrimary,
          }}
        >
          {(props) => (
            <SettingsScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
              onLogout={onLogout}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="ContributionSettings" 
          options={{
            headerShown: true,
            title: '부조금 기본 설정',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.gray100,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: Colors.textPrimary,
            },
            headerTintColor: Colors.textPrimary,
          }}
        >
          {(props) => (
            <ContributionSettingsScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
