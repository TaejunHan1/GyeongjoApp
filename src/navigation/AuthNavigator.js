// src/navigation/AuthNavigator.js
import React from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import VerificationScreen from '../screens/auth/VerificationScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import GuestGuideScreen from '../screens/auth/GuestGuideScreen';
import MannerGuideScreen from '../screens/main/guides/participant/MannerGuideScreen';
import EtiquetteGuideScreen from '../screens/main/guides/participant/EtiquetteGuideScreen';
import WeddingPrepGuideScreen from '../screens/main/guides/host/WeddingPrepGuideScreen';
import FuneralPrepGuideScreen from '../screens/main/guides/host/FuneralPrepGuideScreen';
import FAQScreen from '../screens/main/guides/FAQScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';

const Stack = createStackNavigator();

export default function AuthNavigator({ setUserInfo, setIsAuthenticated }) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          ...TransitionPresets.SlideFromRightIOS,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="GuestGuide" component={GuestGuideScreen} />
        <Stack.Screen name="MannerGuide" component={MannerGuideScreen} />
        <Stack.Screen name="EtiquetteGuide" component={EtiquetteGuideScreen} />
        <Stack.Screen name="WeddingPrepGuide" component={WeddingPrepGuideScreen} />
        <Stack.Screen name="FuneralPrepGuide" component={FuneralPrepGuideScreen} />
        <Stack.Screen name="FAQ" component={FAQScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen 
          name="PhoneAuth" 
          component={PhoneAuthScreen}
          initialParams={{ setUserInfo, setIsAuthenticated }}
        />
        <Stack.Screen 
          name="Verification" 
          component={VerificationScreen}
          initialParams={{ setUserInfo, setIsAuthenticated }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          initialParams={{ setUserInfo, setIsAuthenticated }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
