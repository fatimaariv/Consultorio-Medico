import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function CitasProgramadas({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState<any[]>([]);

  useEffect(() => {
    fetchCitas();
  }, []);

  const fetchCitas = async () => {
    try {
      // 1. Obtener ID del doctor
      if (!session?.user?.email) return;
      
      const { data: doctorData } = await supabase
        .from('doctores')
        .select('id')
        .eq('correo', session.user.email)
        .single();

      if (doctorData) {
        // 2. Traer citas futuras (pendientes)
        const { data, error } = await supabase
          .from('citas')
          .select(`
            id, fecha, hora, motivo, estado,
            usuarios ( nombre, apellido )
          `)
          .eq('id_doctor', doctorData.id)
          .neq('estado', 'completada') // Filtramos las que NO están completadas
          .order('fecha', { ascending: true });

        if (data) setCitas(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderCita = ({ item }: any) => (
    <View style={[styles.card, styles.shadow]}>
      <View style={styles.cardInfo}>
        <Text style={styles.patientName}>
          {item.usuarios?.nombre} {item.usuarios?.apellido}
        </Text>
        <Text style={styles.motivoText}>{item.motivo}</Text>
        <View style={styles.dateTimeRow}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <Text style={styles.dateTimeText}>{item.fecha}</Text>
          <Ionicons name="time-outline" size={14} color="#64748b" style={{ marginLeft: 10 }} />
          <Text style={styles.dateTimeText}>{item.hora}</Text>
        </View>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{item.estado}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Próximas Citas</Text>
        <TouchableOpacity 
          style={styles.historyBtn} 
          onPress={() => navigation.navigate('HistorialDeCitas')}
        >
          <Ionicons name="time-outline" size={20} color="#2563eb" />
          <Text style={styles.historyBtnText}>Ver Historial</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCita}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes citas programadas.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#fff'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 8, borderRadius: 10 },
  historyBtnText: { color: '#2563eb', fontWeight: '600', marginLeft: 5 },
  listContent: { padding: 20 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 16, 
    marginBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cardInfo: { flex: 1 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  motivoText: { color: '#64748b', fontSize: 14, marginVertical: 4 },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  dateTimeText: { fontSize: 12, color: '#64748b', marginLeft: 4 },
  statusBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#16a34a', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});