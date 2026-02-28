// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

// Pantallas
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'; 
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ScheduleScreen from '../screens/ScheduleScreen'; // <--- 1. IMPORTA LA NUEVA PANTALLA

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session } = useContext(AuthContext); //

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        /* Pantallas visibles SOLO cuando el usuario está logueado */
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} /> 
        </>
      ) : (
        /* Pantallas de Autenticación */
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} /> 
        </>
      )}
    </Stack.Navigator>
  );
}