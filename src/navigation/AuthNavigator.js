// src/navigation/AuthNavigator.js
import React from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import VerificationScreen from '../screens/auth/VerificationScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LoginScreen from '../screens/auth/LoginScreen';

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