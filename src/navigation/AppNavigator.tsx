// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

// Pantallas
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'; 
import VerifyCodeScreen from '../screens/VerifyCodeScreen'; // <--- 1. IMPORTA LA PANTALLA DE VERIFICACIÓN

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          
          {/* 2. AÑÁDELA AQUÍ PARA QUE SEA ACCESIBLE */}
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} /> 
        </>
      )}
    </Stack.Navigator>
  );
}