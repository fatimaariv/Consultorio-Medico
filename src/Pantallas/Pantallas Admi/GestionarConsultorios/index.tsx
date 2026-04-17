import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { consultoriosService } from '../../../services/consultoriosService';
import ConsultorioModal from './ConsultorioModal';
import { Ionicons } from '@expo/vector-icons';

export default function GestionarConsultorios() {
  const [consultorios, setConsultorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [consultorioEditando, setConsultorioEditando] = useState(null);

  useEffect(() => { cargarConsultorios(); }, []);

  const cargarConsultorios = async () => {
    const data = await consultoriosService.getAll();
    setConsultorios(data);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Gestionar Consultorios</Text>
      <FlatList
        data={consultorios}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setConsultorioEditando(item); setModalVisible(true); }}>
            <Text>Consultorio: {item.numero}</Text>
            <Text>Estado: {item.estado}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => { setConsultorioEditando(null); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
      <ConsultorioModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={cargarConsultorios}
        consultorioEditando={consultorioEditando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8F9FB' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 10 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#0ea5e9', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }
});