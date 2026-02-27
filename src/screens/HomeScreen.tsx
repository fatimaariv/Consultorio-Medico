import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext'; // Tu contexto
import { supabase } from '../supabase/supabase'; // Tu cliente de Supabase

export default function HomeScreen() {
  const { session } = useContext(AuthContext); // Obtenemos la sesión actual

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut(); // Cerramos sesión en Supabase
      if (error) throw error;
      // Al cerrarse la sesión, AuthContext lo detectará y te enviará al Login
    } catch (error: any) {
      Alert.alert("Error", "No se pudo cerrar la sesión: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>¡Bienvenido!</Text>
      <Text style={styles.info}>Usuario: {session?.user?.email}</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  welcome: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  info: { fontSize: 16, color: '#666', marginBottom: 40 },
  logoutButton: { 
    backgroundColor: '#FF3B30', // Rojo para indicar salida
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 8 
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});