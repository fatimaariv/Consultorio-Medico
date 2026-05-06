import { useState, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context'; // ✅
import { AuthContext } from '../../context/AuthContext'; 
import { supabase } from '../../supabase/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function HistorialDeCitas() {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<any[]>([]);

  useFocusEffect(
  useCallback(() => {
    fetchHistorial();
  }, [session])
);

  const fetchHistorial = async () => {
    try {
      // 1. Identificar al doctor por su correo de sesión
      if (!session?.user?.email) return;
      
      const { data: usuarioData } = await supabase
  .from('usuarios')
  .select('id')
  .eq('correo', session.user.email)
  .single();

if (!usuarioData) return;

const { data: doctorData } = await supabase
  .from('doctores')
  .select('id')
  .eq('id', usuarioData.id)
  .single();

      if (doctorData) {
        // 2. Consultar citas completadas con datos del paciente (tabla usuarios)
        const { data, error } = await supabase
          .from('citas')
          .select(`
            id, 
            fecha, 
            hora, 
            motivo, 
            estado,
            usuarios ( nombre, apellido )
          `)
          .eq('id_doctor', doctorData.id)
          .eq('estado', 'completada') // Solo las ya realizadas
          .order('fecha', { ascending: false }); // De la más nueva a la más vieja

        if (data) setHistorial(data);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={[styles.card, styles.shadow]}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark-done-circle" size={24} color="#16a34a" />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.patientName}>
          {item.usuarios?.nombre} {item.usuarios?.apellido}
        </Text>
        <Text style={styles.motivoText}>{item.motivo}</Text>
        
        <View style={styles.footerCard}>
          <View style={styles.tag}>
            <Ionicons name="calendar-outline" size={12} color="#64748b" />
            <Text style={styles.tagText}>{item.fecha}</Text>
          </View>
          <View style={[styles.tag, { marginLeft: 10 }]}>
            <Ionicons name="time-outline" size={12} color="#64748b" />
            <Text style={styles.tagText}>{item.hora}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial de Citas</Text>
        <Text style={styles.headerSubtitle}>Registro de pacientes atendidos</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={50} color="#cbd5e1" />
              <Text style={styles.emptyText}>Aún no hay citas registradas en el historial.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContainer: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  motivoText: { fontSize: 14, color: '#475569', marginVertical: 4 },
  footerCard: { flexDirection: 'row', marginTop: 5 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#64748b', marginLeft: 4, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontSize: 15, textAlign: 'center', paddingHorizontal: 40 }
});