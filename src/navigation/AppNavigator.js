// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/main/HomeScreen';
import MyEventsScreen from '../screens/main/MyEventsScreen';
import GuideScreen from '../screens/main/GuideScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CreateEventScreen from '../screens/event/CreateEventScreen';

// 🆕 새로 추가된 결혼식 전용 스크린
import CreateWeddingScreen from '../screens/event/wedding/CreateWeddingScreen';

// 🆕 새로 추가된 부고 전용 스크린
import CreateFuneralScreen from '../screens/event/funeral/CreateFuneralScreen';

import EventDetailScreen from '../screens/event/EventDetailScreen';
import ContributionScreen from '../screens/event/ContributionScreen';

// 새로운 화면들
import QRCodeScreen from '../screens/event/QRCodeScreen';
import EventDisplayScreen from '../screens/event/EventDisplayScreen';

// 참여자용 가이드 관련 화면들 (기존 경로 수정)
import MoneyGuideScreen from '../screens/main/guides/participant/MoneyGuideScreen';
import MannerGuideScreen from '../screens/main/guides/participant/MannerGuideScreen';
import EtiquetteGuideScreen from '../screens/main/guides/participant/EtiquetteGuideScreen';
import RecommendServiceScreen from '../screens/main/guides/participant/RecommendServiceScreen';

// 🆕 주최자용 가이드 관련 화면들
import WeddingPrepGuideScreen from '../screens/main/guides/host/WeddingPrepGuideScreen';
import FuneralPrepGuideScreen from '../screens/main/guides/host/FuneralPrepGuideScreen';
import BudgetCalculatorScreen from '../screens/main/guides/host/BudgetCalculatorScreen';
import VendorListScreen from '../screens/main/guides/host/VendorListScreen';
import ChecklistManagerScreen from '../screens/main/guides/host/ChecklistManagerScreen';
import TimelineScreen from '../screens/main/guides/host/TimelineScreen';

import SettingsScreen from '../screens/main/SettingsScreen'; 
import ContributionSettingsScreen from '../screens/main/ContributionSettingsScreen';

// 🆕 장소/업체 관련 화면들
import VenueSearchScreen from '../screens/venue/VenueSearchScreen';
import WeddingVenueListScreen from '../screens/venue/WeddingVenueListScreen';
import FuneralVenueListScreen from '../screens/venue/FuneralVenueListScreen';

import { Colors } from '../styles/constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 하단 탭 네비게이터 - 4개 탭으로 확장
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
          } else if (route.name === 'Guide') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Venue') {
            iconName = focused ? 'business' : 'business-outline';
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
      
      {/* 🆕 경조사 가이드 탭 추가 */}
      <Tab.Screen 
        name="Guide" 
        options={{ tabBarLabel: '가이드' }}
      >
        {(props) => (
          <GuideScreen 
            {...props} 
            userInfo={userInfo}
            session={session}
            isAuthenticated={isAuthenticated}
          />
        )}
      </Tab.Screen>

      {/* 🆕 장소/업체 탭 추가 */}
      <Tab.Screen 
        name="Venue" 
        options={{ tabBarLabel: '장소' }}
      >
        {(props) => (
          <VenueSearchScreen 
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
        
        {/* 🆕 결혼식 전용 스크린 추가 */}
        <Stack.Screen 
          name="CreateWedding" 
          options={{
            headerShown: true,
            title: '결혼식 청첩장 만들기',
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
            <CreateWeddingScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>
        
        {/* 🆕 부고 전용 스크린 추가 */}
        <Stack.Screen 
          name="CreateFuneral" 
          options={{
            headerShown: true,
            title: '부고장 만들기',
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
            <CreateFuneralScreen 
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

        {/* 🆕 참여자용 가이드 관련 화면들 */}
        <Stack.Screen 
          name="MoneyGuide" 
          options={{
            headerShown: true,
            title: '축의금 가이드',
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
            <MoneyGuideScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="MannerGuide" 
          options={{
            headerShown: true,
            title: '복장 & 매너',
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
            <MannerGuideScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="EtiquetteGuide" 
          options={{
            headerShown: true,
            title: '예절 가이드',
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
            <EtiquetteGuideScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="RecommendService" 
          options={{
            headerShown: true,
            title: '추천 서비스',
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
            <RecommendServiceScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        {/* 🆕 주최자용 가이드 관련 화면들 */}
        <Stack.Screen 
          name="WeddingPrepGuide" 
          options={{
            headerShown: true,
            title: '결혼식 준비 가이드',
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
            <WeddingPrepGuideScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="FuneralPrepGuide" 
          options={{
            headerShown: true,
            title: '장례식 준비 가이드',
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
            <FuneralPrepGuideScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="BudgetCalculator" 
          options={{
            headerShown: true,
            title: '예산 계산기',
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
            <BudgetCalculatorScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="VendorList" 
          options={{
            headerShown: true,
            title: '업체 리스트',
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
            <VendorListScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="ChecklistManager" 
          options={{
            headerShown: true,
            title: '체크리스트 관리',
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
            <ChecklistManagerScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="Timeline" 
          options={{
            headerShown: true,
            title: '준비 타임라인',
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
            <TimelineScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
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

        {/* 🆕 장소 관련 화면들 */}
        <Stack.Screen 
          name="WeddingVenueList" 
          options={{
            headerShown: true,
            title: '결혼식장 목록',
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
            <WeddingVenueListScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
              isAuthenticated={isAuthenticated}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="FuneralVenueList" 
          options={{
            headerShown: true,
            title: '장례식장 목록',
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
            <FuneralVenueListScreen 
              {...props} 
              userInfo={userInfo}
              session={session}
              isAuthenticated={isAuthenticated}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}