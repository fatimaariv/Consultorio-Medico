import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorHome({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState({ nombre: '', id: null as number | null });
  const [stats, setStats] = useState({ pacientes: 0, citasHoy: 0 });

  useEffect(() => {
    fetchDoctorData();
  }, []);

const fetchDoctorData = async () => {
  try {
    if (!session?.user?.email) return;

    // 1. Realizamos la consulta
    const { data: docData, error: docError } = await supabase
      .from('doctores')
      .select(`
        id, 
        usuarios (nombre)
      `)
      .eq('correo', session.user.email)
      .single();

    if (docError) throw docError;

    // 2. ACCESO CORRECTO: nombre está dentro de 'usuarios'
    // Usamos encadenamiento opcional (?.) por seguridad
    const nombre = docData.usuarios?.nombre || '';
    
    const fullNombre = nombre.trim();

    setDoctorInfo({ 
      nombre: fullNombre || 'Doctor', 
      id: docData.id 
    });

    // ... resto del código de estadísticas
  } catch (error) {
    console.error("Error al obtener datos del doctor:", error);
  } finally {
    setLoading(false);
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header con Logout en la parte superior derecha */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Panel Médico</Text>
          <Text style={styles.doctorName}>Dr. {doctorInfo.nombre}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        
        {/* Sección de Tarjetas de Información */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.shadow]}>
            <Ionicons name="people" size={24} color="#2563eb" />
            <Text style={styles.statNumber}>{stats.pacientes}</Text>
            <Text style={styles.statLabel}>Pacientes</Text>
          </View>
          <View style={[styles.statCard, styles.shadow]}>
            <Ionicons name="calendar" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{stats.citasHoy}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
        </View>

        {/* Botones de Acción */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.shadow]} 
            onPress={() => navigation.navigate('CitasProgramadas')} // Manda a CitasProgramadas.tsx
          >
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={24} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.btnTitle}>Ver Agenda</Text>
              <Text style={styles.btnSub}>Citas programadas para hoy</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.shadow]} 
            onPress={() => navigation.navigate('HistorialDeCitas')} // Manda a HistorialDeCitas.tsx
          >
            <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time-outline" size={24} color="#d97706" />
            </View>
            <View>
              <Text style={styles.btnTitle}>Historial</Text>
              <Text style={styles.btnSub}>Revisar citas anteriores</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Barra Inferior Personalizada */}
      <View style={styles.bottomNav}>
        <View style={styles.navSpace} /> 
        <View style={styles.navActions}>
          <TouchableOpacity style={styles.navBtn} onPress={() => {}}>
            <Ionicons name="home" size={24} color="#2563eb" />
            <Text style={[styles.navText, { color: '#2563eb' }]}>Inicio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navBtn} 
            onPress={() => navigation.navigate('Pacientes')} // Manda a PerfilDoc.tsx
          >
            <Ionicons name="person-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
          
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  welcome: { fontSize: 14, color: '#64748b' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  logoutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 },
  scrollBody: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  statNumber: { fontSize: 20, fontWeight: 'bold', marginVertical: 5 },
  statLabel: { fontSize: 12, color: '#64748b' },
  menuContainer: { gap: 15 },
  actionBtn: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  iconCircle: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  btnTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  btnSub: { fontSize: 12, color: '#94a3b8' },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bottomNav: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navSpace: { flex: 1 }, // Empuja los botones a la derecha si es necesario o los centra
  navActions: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  navBtn: { alignItems: 'center' },
  navText: { fontSize: 11, marginTop: 4, color: '#64748b' }
});