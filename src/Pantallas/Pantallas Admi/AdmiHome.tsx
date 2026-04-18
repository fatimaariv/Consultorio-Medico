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
import { supabase } from '../../supabase/supabase';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AdmiHome({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    doctores: 0,
    pacientes: 0,
    citasTotales: 0,
    pendientes: 0
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // 1. Obtener conteo de tablas
      const [doctores, pacientes, citas, pendientes] = await Promise.all([
        supabase.from('doctores').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('id_rol', 3), // Pacientes (Rol 3)
        supabase.from('citas').select('*', { count: 'exact', head: true }),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente') // Supone que 'estado' existe en 'citas'
      ]);

      setStats({
        doctores: doctores.count || 0,
        pacientes: pacientes.count || 0,
        citasTotales: citas.count || 0,
        pendientes: pendientes.count || 0
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
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
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header Superior (Azul) */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Panel de Control</Text>
            <Text style={styles.adminName}>Administrador</Text>
          </View>
          <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          
          {/* SECCIÓN 1: Resumen General */}
          <Text style={styles.sectionTitle}>Resumen General</Text>
          
          {/* Fila 1 de Estadísticas (Doctores y Pacientes) */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.shadow]}>
              <Ionicons name="medical" size={24} color="#0ea5e9" />
              <Text style={styles.statNumber}>{stats.doctores}</Text>
              <Text style={styles.statLabel}>Doctores</Text>
            </View>
            <View style={[styles.statCard, styles.shadow]}>
              <Ionicons name="people" size={24} color="#8b5cf6" />
              <Text style={styles.statNumber}>{stats.pacientes}</Text>
              <Text style={styles.statLabel}>Pacientes</Text>
            </View>
          </View>

          {/* Fila 2 de Estadísticas (Citas Totales y Pendientes) */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.shadow]}>
              <Ionicons name="calendar-outline" size={24} color="#22c55e" /> {/* Verde */}
              <Text style={styles.statNumber}>{stats.citasTotales}</Text>
              <Text style={styles.statLabel}>Citas Totales</Text>
            </View>
            <View style={[styles.statCard, styles.shadow]}>
              <Ionicons name="alert-circle-outline" size={24} color="#f97316" /> {/* Naranja */}
              <Text style={styles.statNumber}>{stats.pendientes}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>

          {/* SECCIÓN 2: Acciones Rápidas */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Acciones Rápidas</Text>

          {/* Acción: Gestionar Doctores */}
          <TouchableOpacity style={[styles.actionCard, styles.shadow]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}> {/* Azul claro */}
                <Ionicons name="person-add-outline" size={24} color="#0ea5e9" />
              </View>
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.actionTitle}>Gestionar Doctores</Text>
                <Text style={styles.actionSubtitle}>Dar de alta o editar especialistas</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Acción: Consultorios (ESTA ES LA QUE AGREGASTE) */}
          <TouchableOpacity 
            style={[styles.actionCard, styles.shadow]} 
            onPress={() => navigation.navigate('GestionarConsultorios')} // Navegación funcional
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconContainer, { backgroundColor: '#f3e8ff' }]}> {/* Morado claro */}
                <Ionicons name="business-outline" size={24} color="#8b5cf6" />
              </View>
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.actionTitle}>Consultorios</Text>
                <Text style={styles.actionSubtitle}>Administrar sedes y salas</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Acción: Reportes Mensuales */}
          <TouchableOpacity style={[styles.actionCard, styles.shadow]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconContainer, { backgroundColor: '#f0fdf4' }]}> {/* Verde claro */}
                <Ionicons name="bar-chart-outline" size={24} color="#22c55e" />
              </View>
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.actionTitle}>Reportes Mensuales</Text>
                <Text style={styles.actionSubtitle}>Ver analíticas de rendimiento</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#0ea5e9', padding: 30, paddingTop: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: '#bae6fd', fontSize: 14, fontWeight: '500' },
  adminName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  logoutIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  body: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 10 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  // Estilos para Acciones Rápidas
  actionCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 15, // Un poco menos de padding para que quepan bien
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 15
  },
  iconContainer: {
    padding: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  actionSubtitle: { fontSize: 12, color: '#64748b' },
});