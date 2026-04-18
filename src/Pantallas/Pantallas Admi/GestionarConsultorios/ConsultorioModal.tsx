import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { consultoriosService } from '../../../services/consultoriosService';

export default function ConsultorioModal({ visible, onClose, onSave, consultorioEditando }: any) {
  const [numero, setNumero] = useState(consultorioEditando?.numero || '');
  const [estado, setEstado] = useState(consultorioEditando?.estado || 'disponible');

  const handleSave = async () => {
    try {
      if (consultorioEditando) {
        await consultoriosService.update(consultorioEditando.id, numero, estado);
      } else {
        await consultoriosService.create(numero, estado);
      }
      onSave(); // Refresca la lista
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.titulo}> {consultorioEditando ? 'Editar' : 'Nuevo'} Consultorio</Text>
          <TextInput placeholder="Número de consultorio" value={numero} onChangeText={setNumero} style={styles.input} />
          <TextInput placeholder="Estado (ej. disponible, ocupado)" value={estado} onChangeText={setEstado} style={styles.input} />
          <TouchableOpacity style={styles.btnGuardar} onPress={handleSave}>
            <Text style={{ color: 'white' }}>Guardar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 20 },
  input: { borderBottomWidth: 1, marginBottom: 15, padding: 8 },
  titulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  btnGuardar: { backgroundColor: '#0ea5e9', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 }
});