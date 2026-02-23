import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../supabase/supabase';

export default function RegisterScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_p: '',
    apellido_m: '',
    email: '',
    password: '',
  });

  const handleRegister = async () => {
    const { nombre, apellido_p, apellido_m, email, password } = formData;

    // Validación de campos obligatorios
    if (!nombre || !apellido_p || !email || !password) {
      Alert.alert("Atención", "Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      // 1. Crear el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Insertar en tu tabla 'usuario'
      // id_rol: 2 (Asegúrate de que el '2' sea el ID de 'Paciente' en tu tabla roles)
      const { error: dbError } = await supabase
        .from('usuario')
        .insert([
          {
            nombre: nombre,
            apellido_p: apellido_p,
            apellido_m: apellido_m,
            correo: email,
            contrasena: password,
            id_rol: 2, 
          }
        ]);

      if (dbError) throw dbError;

      Alert.alert("¡Éxito!", "Cuenta creada. Por favor verifica tu correo para activar tu cuenta.");
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert("Error de registro", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>MediTrak</Text>
      <Text style={styles.title}>Nueva Cuenta</Text>
      
      <View style={styles.inputGroup}>
        <TextInput 
          placeholder="Nombre(s)" 
          style={styles.input} 
          onChangeText={(text) => setFormData({...formData, nombre: text})}
        />
        
        {/* Apellidos en una sola fila para ahorrar espacio */}
        <View style={styles.row}>
          <TextInput 
            placeholder="Ap. Paterno" 
            style={[styles.input, { flex: 1, marginRight: 5 }]} 
            onChangeText={(text) => setFormData({...formData, apellido_p: text})}
          />
          <TextInput 
            placeholder="Ap. Materno" 
            style={[styles.input, { flex: 1, marginLeft: 5 }]} 
            onChangeText={(text) => setFormData({...formData, apellido_m: text})}
          />
        </View>

        <TextInput 
          placeholder="Correo electrónico" 
          style={styles.input} 
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(text) => setFormData({...formData, email: text})}
        />
        <TextInput 
          placeholder="Contraseña" 
          style={styles.input} 
          secureTextEntry 
          onChangeText={(text) => setFormData({...formData, password: text})}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleRegister} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footer}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F8F9FA' },
  brand: { fontSize: 22, textAlign: 'center', color: '#007AFF', fontWeight: 'bold', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  inputGroup: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { marginTop: 25, alignItems: 'center' },
  link: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
});