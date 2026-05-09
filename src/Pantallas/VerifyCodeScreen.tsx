import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase/supabase';
import { AuthContext } from '../context/AuthContext';

export default function VerifyCodeScreen({ route, navigation }: any) {
  const { email } = route.params;
  const { setLoading: setGlobalLoading, setIsResettingPassword } = useContext(AuthContext);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleVerifyAndChange = async () => {
    if (!code || !newPassword) {
      Alert.alert("Atención", "Por favor ingresa el código y tu nueva contraseña.");
      return;
    }

    setLoading(true);
    setIsResettingPassword(true);
    setGlobalLoading(true);

    try {
      // 1. Verificar el código OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;

      // 2. Actualizar contraseña en Supabase Auth (la que usa para login)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;

      // 3. Sincronizar la columna 'contrasena' en la tabla usuarios 👈 fix
      const { error: dbError } = await supabase
        .from('usuarios')
        .update({ contrasena: newPassword })
        .eq('correo', email);
      if (dbError) throw dbError;

      // 4. Cerrar sesión y redirigir al login
      await supabase.auth.signOut();

      Alert.alert("¡Éxito!", "Tu contraseña ha sido actualizada. Por favor, inicia sesión.");
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setIsResettingPassword(false);
      setGlobalLoading(false);
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
          placeholderTextColor="#999"
          style={styles.input} 
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <View style={styles.passwordContainer}>
          <TextInput 
            placeholder="Nueva contraseña" 
            placeholderTextColor="#999"
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.eyeButton}
          >
            <Text style={styles.eyeText}>{showPassword ? "Ocultar" : "Ver"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerifyAndChange} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cambiar contraseña</Text>}
      </TouchableOpacity>
    </View>
  );
}

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
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    marginBottom: 15,
    color: '#333',
  },
  eyeButton: {
    paddingHorizontal: 15,
  },
  eyeText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});