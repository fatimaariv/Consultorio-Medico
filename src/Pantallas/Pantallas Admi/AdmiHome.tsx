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
      // Obtenemos conteos en paralelo para que sea súper rápido
      const [doctores, pacientes, citas, pendientes] = await Promise.all([
        supabase.from('doctores').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('id_rol', 3), // Solo pacientes
        supabase.from('citas').select('*', { count: 'exact', head: true }),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente')
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
        
        {/* Header Superior */}
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
          <Text style={styles.sectionTitle}>Resumen General</Text>
          
          {/* Tarjetas de Estadísticas (Grid) */}
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

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.shadow]}>
              <Ionicons name="calendar" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{stats.citasTotales}</Text>
              <Text style={styles.statLabel}>Citas Totales</Text>
            </View>
            
            <View style={[styles.statCard, styles.shadow]}>
              <Ionicons name="alert-circle" size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>{stats.pendientes}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>

          {/* Acciones Rápidas */}
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Acciones Rápidas</Text>
          
          <TouchableOpacity style={[styles.actionRow, styles.shadow]}>
            <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="person-add" size={22} color="#0369a1" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Gestionar Doctores</Text>
              <Text style={styles.actionDesc}>Dar de alta o editar especialistas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.shadow]}>
            <View style={[styles.iconBox, { backgroundColor: '#f5f3ff' }]}>
              <Ionicons name="business" size={22} color="#6d28d9" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Consultorios</Text>
              <Text style={styles.actionDesc}>Administrar sedes y salas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.shadow]}>
            <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="bar-chart" size={22} color="#047857" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Reportes Mensuales</Text>
              <Text style={styles.actionDesc}>Ver analíticas de rendimiento</Text>
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
  header: { 
    backgroundColor: '#0ea5e9', 
    padding: 30, 
    paddingTop: 40,
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  welcomeText: { color: '#bae6fd', fontSize: 14, fontWeight: '500' },
  adminName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  logoutIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  body: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center' 
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 10 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  actionRow: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionInfo: { flex: 1, marginLeft: 15 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  actionDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 }
});