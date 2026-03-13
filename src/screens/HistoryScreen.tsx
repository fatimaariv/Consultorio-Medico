import React, { useEffect, useState, useContext } from 'react'; // 1. Agregamos useContext
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { getPatientHistory } from '../services/appointmentService';
import { AuthContext } from '../context/AuthContext'; // 2. Importamos el Contexto

interface Cita {
  id: number;
  fecha: string;
  motivo: string;
  doctores?: { nombre: string };
}

export default function HistoryScreen() { // Ya no necesitamos 'route'
  const [history, setHistory] = useState<Cita[]>([]);
  const { session } = useContext(AuthContext); // 3. Obtenemos la sesión para sacar el email
  
  const userEmail = session?.user?.email;

  useEffect(() => {
    const fetchHistory = async () => {
      // 4. Usamos el email para buscar
      if (userEmail) {
        try {
          const data = await getPatientHistory(userEmail);
          setHistory(data as any);
        } catch (error) {
          console.error("Error al obtener historial:", error);
        }
      }
    };
    fetchHistory();
  }, [userEmail]);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Mi Historial de Citas</Text>
      
      <FlatList
        data={history}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No hay citas previas.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.title}>Dr. {item.doctores?.nombre || 'General'}</Text>
              <Text style={styles.date}>{item.fecha}</Text>
              <Text style={styles.reason}>{item.motivo}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#F8F9FA' 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    color: '#1A1A1A',
    paddingHorizontal: 5
  },
  card: { 
    padding: 18, 
    marginVertical: 10, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 15,
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // Sombra para Android
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF' // Un color azul para que se vea médico
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#2C3E50' 
  },
  date: { 
    fontSize: 14, 
    color: '#6C757D', 
    marginTop: 4 
  },
  reason: { 
    fontSize: 15, 
    color: '#495057', 
    marginTop: 8,
    fontStyle: 'italic'
  }
});