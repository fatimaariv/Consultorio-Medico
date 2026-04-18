import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../supabase/supabase';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

// ForgotPasswordScreen.tsx
const handleResetPassword = async () => {
  if (!email) {
    Alert.alert("Atención", "Ingresa tu correo.");
    return;
  }

  setLoading(true);
  try {
    // Esto dispara el envío del código {{ .Token }} que configuraste arriba
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;

    Alert.alert("Código enviado", "Revisa tu bandeja de entrada.");
    // Pasamos el email a la siguiente pantalla para la verificación
    navigation.navigate('VerifyCode', { email: email });

  } catch (error: any) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MediTrak</Text>
      <Text style={styles.title}>Recuperar Acceso</Text>
      <Text style={styles.subtitle}>Te enviaremos un código de 6 dígitos a tu correo.</Text>
      
      <View style={styles.inputGroup}>
        <TextInput 
          placeholder="Correo electrónico" 
          style={styles.input} 
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar código</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footer}>
        <Text style={styles.link}>Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// ESTILOS INTACTOS
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F8F9FA' },
  brand: { fontSize: 22, textAlign: 'center', color: '#007AFF', fontWeight: 'bold', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
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
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { marginTop: 25, alignItems: 'center' },
  link: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
});