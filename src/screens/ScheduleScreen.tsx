import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Necesitas instalar: npm install @react-native-picker/picker

export default function ScheduleScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    doctor: '',
    fecha: '',
    hora: '',
    motivo: ''
  });

  const handleSubmit = () => {
    if (!formData.doctor || !formData.fecha || !formData.hora) {
      Alert.alert("Error", "Por favor completa los campos obligatorios");
      return;
    }
    
    console.log('Datos de la cita:', formData);
    Alert.alert(
      "Cita Agendada", 
      `Cita con el Dr. ${formData.doctor} para el ${formData.fecha} a las ${formData.hora}`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Agendar Nueva Cita</Text>

          <Text style={styles.label}>Doctor</Text>
          <Text style={styles.label}>Doctor</Text>
<View style={styles.pickerContainer}>
  <Picker
    selectedValue={formData.doctor}
    onValueChange={(itemValue) => setFormData({ ...formData, doctor: itemValue })}
  >
    <Picker.Item label="Seleccione un especialista" value="" />
    <Picker.Item label="Dr. García - Cardiología" value="Garcia" />
    <Picker.Item label="Dra. Rodríguez - Pediatría" value="Rodriguez" />
    <Picker.Item label="Dr. López - Medicina General" value="Lopez" />
  </Picker>
</View>

          <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ej: 2024-05-20"
            value={formData.fecha}
            onChangeText={(text) => setFormData({...formData, fecha: text})}
          />

          <Text style={styles.label}>Hora</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ej: 10:30 AM"
            value={formData.hora}
            onChangeText={(text) => setFormData({...formData, hora: text})}
          />

          <Text style={styles.label}>Motivo de la consulta</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder="Describa el motivo..."
            multiline
            numberOfLines={4}
            value={formData.motivo}
            onChangeText={(text) => setFormData({...formData, motivo: text})}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Confirmar Cita</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f4f6f9', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fafafa', marginBottom: 5 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 25 },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 15, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontSize: 14 }
});