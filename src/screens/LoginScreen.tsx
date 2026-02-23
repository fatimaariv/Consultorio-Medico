import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { login } from '../services/authService';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atención", "Escribe tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      // No necesitas navegar manualmente a Home, AuthContext lo hará por ti
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MediTrak</Text>
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      <View style={styles.inputGroup}>
        <TextInput 
          placeholder="Correo electrónico" 
          style={styles.input} 
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput 
          placeholder="Contraseña" 
          style={styles.input} 
          secureTextEntry 
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>
        
        <Text style={styles.separator}>|</Text>
        
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Olvidé mi contraseña</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F8F9FA' },
  brand: { fontSize: 22, textAlign: 'center', color: '#007AFF', fontWeight: 'bold', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#333' },
  inputGroup: { marginBottom: 20 },
  input: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E1E1E1',
    fontSize: 16
  },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  link: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  separator: { marginHorizontal: 15, color: '#CCC' }
});