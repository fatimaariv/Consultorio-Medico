import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase/supabase';

export default function VerifyCodeScreen({ route, navigation }: any) {
  const { email } = route.params; // Recibimos el email de la pantalla anterior
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyAndChange = async () => {
    // 1. Validación de campos y longitud exacta
    if (!code || !newPassword) {
      Alert.alert("Atención", "Por favor ingresa el código y tu nueva contraseña.");
      return;
    }

    if (newPassword.length !== 6) {
      Alert.alert("Contraseña no válida", "La nueva contraseña debe tener exactamente 6 caracteres.");
      return; 
    }

    setLoading(true);
    try {
      // 2. Validar el código (OTP)
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;

      // 3. Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;

      // --- PASO CRÍTICO DE SEGURIDAD ---
      // Cerramos la sesión que Supabase abre automáticamente. 
      // Esto limpia el AuthContext y hace que 'session' sea null.
      await supabase.auth.signOut();

      // 4. Redirección garantizada al Login
      Alert.alert("¡Éxito!", "Contraseña actualizada. Por favor, inicia sesión.", [
        { 
          text: "OK", 
          onPress: () => {
            // Usamos reset para limpiar el historial y asegurar que cargue el grupo de Login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]);

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MediTrak</Text>
      <Text style={styles.title}>Verificar Código</Text>
      <Text style={styles.subtitle}>Ingresa el código enviado a {email}</Text>
      
      <View style={styles.inputGroup}>
        <TextInput 
          placeholder="Código de 6 dígitos" 
          style={styles.input} 
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        <TextInput 
          placeholder="Nueva contraseña" 
          style={styles.input} 
          onChangeText={setNewPassword}
          secureTextEntry 
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerifyAndChange} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cambiar contraseña</Text>}
      </TouchableOpacity>
    </View>
  );
}

// Estilos idénticos a tus otras pantallas para mantener la uniformidad
const styles = StyleSheet.create({
    
    container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F8F9FA' },
    brand: { fontSize: 22, textAlign: 'center', color: '#007AFF', fontWeight: 'bold', marginBottom: 10 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
    inputGroup: { marginBottom: 20 },
    
    input: 
    { 
        backgroundColor: '#fff', 
        padding: 15, 
        borderRadius: 12, 
        marginBottom: 15, 
        borderWidth: 1, 
        borderColor: '#E1E1E1',
        fontSize: 16
    },
    button: 
    { 
        backgroundColor: '#007AFF', 
        padding: 18, 
        borderRadius: 12, 
        alignItems: 'center',
        elevation: 2,
    },
    
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});