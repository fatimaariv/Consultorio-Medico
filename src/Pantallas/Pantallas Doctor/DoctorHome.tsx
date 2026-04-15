import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';

export default function DoctorHome() {
  const { session } = useContext(AuthContext);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Meditrack</Text>
        <Text style={styles.greeting}>Buenos días, Doctor</Text>
        
        <Text style={styles.sectionTitle}>Panel Principal</Text>

        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Pacientes</Text>
            <Text style={styles.cardValue}>128</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Citas Hoy</Text>
            <Text style={styles.cardValue}>12</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Text style={styles.buttonText}>Ver Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  content: { padding: 20 },
  logo: { color: '#2563eb', fontSize: 24, fontWeight: 'bold' },
  greeting: { color: '#6b7280', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 15 },
  row: { flexDirection: 'row', gap: 15 },
  card: { flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 16, elevation: 3 },
  cardLabel: { color: '#666' },
  cardValue: { fontSize: 22, fontWeight: 'bold' },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  logoutBtn: { backgroundColor: '#ff4444', padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' }
});