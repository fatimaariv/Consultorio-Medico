import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'paciente' | 'doctor'>('paciente');

  const handleLogin = () => {
    // SIMULACIÓN: No importa qué pongas, si el email tiene un @, te deja pasar
    if (email.includes('@') && password.length > 3) {
      Alert.alert("Login Exitoso", `Bienvenido como ${role}`);
      
      // Aquí simularíamos ir a la pantalla correspondiente
      if (role === 'doctor') {
        // navigation.navigate('DoctorDashboard'); 
        console.log("Ir a panel de Doctor");
      } else {
        // navigation.navigate('PatientDashboard');
        console.log("Ir a panel de Paciente");
      }
    } else {
      Alert.alert("Error", "Introduce un correo válido y contraseña");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediTrack</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Correo electrónico" 
        onChangeText={setEmail}
      />
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña" 
        secureTextEntry 
        onChangeText={setPassword}
      />

      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[styles.roleBtn, role === 'paciente' && styles.activeBtn]}
          onPress={() => setRole('paciente')}
        >
          <Text>Soy Paciente</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleBtn, role === 'doctor' && styles.activeBtn]}
          onPress={() => setRole('doctor')}
        >
          <Text>Soy Doctor</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginText}>ENTRAR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#2c3e50' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleBtn: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ccc' },
  activeBtn: { borderBottomColor: '#3498db', backgroundColor: '#e1f5fe' },
  loginBtn: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default LoginScreen;