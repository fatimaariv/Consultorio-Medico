import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: string;
  nombre_doctor: string;
}

export default function HistoryScreen() {
  const { session } = useContext(AuthContext);
  const [history, setHistory] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [session]);

  const fetchHistory = async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);

      // 1. Obtenemos el ID del paciente logueado
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('correo', session.user.email)
        .single();

      if (userError || !userData) throw new Error("No se encontró el usuario");

      // 2. Consultamos citas pasadas (fecha < hoy)
      const hoy = new Date().toISOString().split('T')[0];

      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select(`
          id,
          fecha,
          hora,
          motivo,
          estado,
          doctores (
            usuarios (
              nombre,
              apellido1
            )
          )
        `)
        .eq('id_paciente', userData.id)
        .lt('fecha', hoy) // LT significa "Less Than" (Menor que hoy)
        .order('fecha', { ascending: false }); // Las más recientes primero

      if (citasError) throw citasError;

      // 3. Formateamos los datos para la lista
      if (citasData) {
        const formateadas = citasData.map((c: any) => ({
          id: c.id,
          fecha: c.fecha,
          hora: c.hora,
          motivo: c.motivo,
          estado: c.estado,
          nombre_doctor: c.doctores?.usuarios 
            ? `Dr. ${c.doctores.usuarios.nombre} ${c.doctores.usuarios.apellido1}`
            : "Médico General"
        }));
        setHistory(formateadas);
      }
    } catch (error) {
      console.error("Error al obtener historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Cita }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.doctorName}>{item.nombre_doctor}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.estado === 'Completada' ? '#D1FAE5' : '#F3F4F6' }]}>
          <Text style={[styles.statusText, { color: item.estado === 'Completada' ? '#059669' : '#6B7280' }]}>
            {item.estado}
          </Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>FECHA</Text>
          <Text style={styles.detailValue}>{item.fecha}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>HORA</Text>
          <Text style={styles.detailValue}>{item.hora}</Text>
        </View>
      </View>

      <Text style={styles.detailLabel}>MOTIVO</Text>
      <Text style={styles.reasonText}>{item.motivo}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Mi Historial</Text>
        <Text style={styles.headerSubtitle}>Registro de tus consultas pasadas</Text>
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>No tienes citas registradas en tu historial todavía.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#111827'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4
  },
  listContent: {
    padding: 16,
    paddingBottom: 30
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  doctorName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1F2937'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  detailItem: {
    flex: 1
  },
  detailLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600'
  },
  reasonText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 20
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24
  }
});