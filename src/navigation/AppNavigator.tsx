// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import ScheduleScreen from '../screens/ScheduleScreen';

// Importación de pantallas
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdmiHome from '../screens/AdmiHome'; 
import DoctorHome from '../screens/DoctorHome'; 
import PatientProfile from '../screens/PatientProfile';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session, userRole, loading } = useContext(AuthContext);

  // MIENTRAS CARGA: No mostramos ninguna pantalla para evitar saltos visuales
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

return (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {session && userRole !== null ? (
      <>
        {userRole === 1 && <Stack.Screen name="AdmiHome" component={AdmiHome} />}
        {userRole === 2 && <Stack.Screen name="DoctorHome" component={DoctorHome} />}
        
        {/* Agrupamos las pantallas del Rol 3 (Paciente) correctamente */}
        {userRole === 3 && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
            <Stack.Screen name="PatientProfile" component={PatientProfile} />
          </>
        )}
      </>
    ) : (
      <>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </>
    )}
  </Stack.Navigator>
);
}