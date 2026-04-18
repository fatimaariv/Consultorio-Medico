// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import ScheduleScreen from '../Pantallas/Pantallas Paciente/ScheduleScreen';


// Importación de pantallas
import HomeScreen from '../Pantallas/Pantallas Paciente/HomeScreen';
import LoginScreen from '../Pantallas/LoginScreen';
import RegisterScreen from '../Pantallas/RegisterScreen';
import AdmiHome from '../Pantallas/Pantallas Admi/AdmiHome';
import DoctorHome from '../Pantallas/Pantallas Doctor/DoctorHome'; 
import PatientProfile from '../Pantallas/Pantallas Paciente/PatientProfile'; 
import ForgotPasswordScreen from '../Pantallas/ForgotPasswordScreen';
import HistoryScreen from '../Pantallas/Pantallas Paciente/HistoryScreen';
import VerifyCodeScreen from '../Pantallas/VerifyCodeScreen';
import Agenda from '../Pantallas/Pantallas Doctor/Agenda';
import Pacientes from '../Pantallas/Pantallas Doctor/PerfilDoc';
import CitasProgramadas from '../Pantallas/Pantallas Doctor/CitasProgramadas';
import HistorialDeCitas from '../Pantallas/Pantallas Doctor/HistorialDeCitas';
import Consulta from '../Pantallas/Pantallas Doctor/Consulta';

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
        
        {userRole === 2 && (
          <>
            <Stack.Screen name="DoctorHome" component={DoctorHome} />
            <Stack.Screen name="Agenda" component={Agenda} />
            <Stack.Screen name="Pacientes" component={Pacientes} />
            <Stack.Screen name="CitasProgramadas" component={CitasProgramadas} />
            <Stack.Screen name="HistorialDeCitas" component={HistorialDeCitas} />
            <Stack.Screen name="Consulta" component={Consulta} />
          </>
        )}
        
        {/* Agrupamos las pantallas del Rol 3 (Paciente) correctamente */}
        {userRole === 3 && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
            <Stack.Screen name="PatientProfile" component={PatientProfile} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true, title: 'Historial' }} />
          </>
        )}
      </>
    ) : (
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