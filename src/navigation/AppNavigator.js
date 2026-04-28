// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/main/HomeScreen';
import MyEventsScreen from '../screens/main/MyEventsScreen';
// import GuideScreen from '../screens/main/GuideScreen'; // 기존 스타일
import GuideScreen from '../screens/main/GuideScreenToss'; // 토스 스타일
import BenefitsScreen from '../screens/main/BenefitsScreen'; // 🆕 혜택 화면
import PaperInvitationFormScreen from '../screens/main/studio/PaperInvitationFormScreen';
import PaperInvitationLayoutScreen from '../screens/main/studio/PaperInvitationLayoutScreen';
import SavedInvitationsScreen from '../screens/main/studio/SavedInvitationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CreditScreen from '../screens/main/CreditScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';
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
import FAQScreen from '../screens/main/guides/FAQScreen';

import SettingsScreen from '../screens/main/SettingsScreen';
import ContributionSettingsScreen from '../screens/main/ContributionSettingsScreen';

// 디지털 방명록 화면
import GuestWritingScreen from '../screens/event/guestbook/GuestWritingScreen';
import GuestConfirmScreen from '../screens/event/guestbook/GuestConfirmScreen';

// 🆕 장소/업체 관련 화면들
import VenueSearchScreen from '../screens/venue/VenueSearchScreen';
import WeddingVenueListScreen from '../screens/venue/WeddingVenueListScreen';
import FuneralVenueListScreen from '../screens/venue/FuneralVenueListScreen';

import { Colors } from '../styles/constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 하단 탭 네비게이터 - 4개 탭으로 확장
function MainTabNavigator({ userInfo, session, isAuthenticated, onLogout }) {
  const insets = useSafeAreaInsets();
  
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
          } else if (route.name === 'Benefits') {
            iconName = focused ? 'color-palette' : 'color-palette-outline';
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
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
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

      {/* 🆕 혜택 탭 추가 */}
      <Tab.Screen 
        name="Benefits" 
        options={{ tabBarLabel: '스튜디오' }}
      >
        {(props) => (
          <BenefitsScreen 
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
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          headerBackTitleVisible: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
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
            headerShown: false,
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
            headerShown: false,
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
            headerShown: false,
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
            headerShown: false,
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
            headerShown: false,
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
            headerShown: false,
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
            headerShown: false,
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
            headerShown: false,
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

        {/* 통합 FAQ — route.params.role 로 주최자/참여자 분기 */}
        <Stack.Screen
          name="FAQ"
          component={FAQScreen}
          options={{ headerShown: false }}
        />

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

        {/* 디지털 방명록 — 하객 필기 화면 (전체화면, 헤더 없음) */}
        <Stack.Screen
          name="GuestWriting"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        >
          {(props) => <GuestWritingScreen {...props} />}
        </Stack.Screen>

        {/* 디지털 방명록 — 이름 확인 + 금액 입력 */}
        <Stack.Screen
          name="GuestConfirm"
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          {(props) => <GuestConfirmScreen {...props} />}
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

        {/* 알림톡 크레딧 */}
        <Stack.Screen
          name="Credit"
          options={{ headerShown: false }}
        >
          {(props) => (
            <CreditScreen
              {...props}
              userInfo={userInfo}
              session={session}
              isAuthenticated={isAuthenticated}
            />
          )}
        </Stack.Screen>

        {/* 종이 청첩장 — 1단계: 정보 입력 */}
        <Stack.Screen
          name="PaperInvitationForm"
          component={PaperInvitationFormScreen}
          options={{ headerShown: false }}
        />
        {/* 종이 청첩장 — 2단계: 위치/크기 조정 */}
        <Stack.Screen
          name="PaperInvitationLayout"
          component={PaperInvitationLayoutScreen}
          options={{ headerShown: false }}
        />
        {/* 종이 청첩장 — 내가 만든 목록 */}
        <Stack.Screen
          name="SavedInvitations"
          component={SavedInvitationsScreen}
          options={{ headerShown: false }}
        />

        {/* 이용약관 / 개인정보 처리방침 */}
        <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}