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
import { Picker } from '@react-native-picker/picker'; //

export default function ScheduleScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    doctor: '',
    especialidad: '',
    fecha: '',
    hora: '',
    motivo: ''
  });

  // Tu diccionario de doctores conocidos
  const especialistas = [
    { nombre: "Dr. García", especialidad: "Cardiología" },
    { nombre: "Dra. Rodríguez", especialidad: "Pediatría" },
    { nombre: "Dr. López", especialidad: "Medicina General" }
  ];

  // Lógica de autocompletado adaptada a móvil
  const handleDoctorChange = (val: string) => {
    const coincidencia = especialistas.find(esp => esp.nombre === val);
    
    setFormData({
      ...formData,
      doctor: val,
      // Si el nombre coincide, ponemos la especialidad automática
      especialidad: coincidencia ? coincidencia.especialidad : formData.especialidad
    });
  };

  const handleSubmit = () => {
    if (!formData.doctor || !formData.fecha || !formData.hora) {
      Alert.alert("Error", "Por favor completa los campos obligatorios");
      return;
    }
    
    console.log('Datos enviados:', formData);
    Alert.alert(
      "Cita Agendada", 
      `Cita agendada con ${formData.doctor} (${formData.especialidad})`,
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

          {/* Nombre del Doctor con Selector (Equivalente a Datalist) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre del Doctor</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.doctor}
                onValueChange={(itemValue) => handleDoctorChange(itemValue)}
              >
                <Picker.Item label="Selecciona un doctor..." value="" />
                {especialistas.map((esp, index) => (
                  <Picker.Item key={index} label={esp.nombre} value={esp.nombre} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Especialidad (Manual o Autocompletada) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Especialidad</Text>
            <TextInput 
              style={styles.input}
              placeholder="Especialidad médica"
              value={formData.especialidad}
              onChangeText={(text) => setFormData({...formData, especialidad: text})}
            />
          </View>

          {/* Fecha y Hora en la misma fila (Equivalente a grid-cols-2) */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Fecha</Text>
              <TextInput 
                style={styles.input}
                placeholder="AAAA-MM-DD"
                value={formData.fecha}
                onChangeText={(text) => setFormData({...formData, fecha: text})}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Hora</Text>
              <TextInput 
                style={styles.input}
                placeholder="HH:MM"
                value={formData.hora}
                onChangeText={(text) => setFormData({...formData, hora: text})}
              />
            </View>
          </View>

          {/* Motivo (Equivalente a Textarea) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Motivo</Text>
            <TextInput 
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Revisión general"
              multiline
              numberOfLines={3}
              value={formData.motivo}
              onChangeText={(text) => setFormData({...formData, motivo: text})}
            />
          </View>

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
  container: { flexGrow: 1, backgroundColor: '#f9fafb', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: 'white', padding: 32, borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#1f2937' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 8, fontSize: 16, backgroundColor: 'white' },
  pickerWrapper: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, backgroundColor: 'white' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  halfField: { width: '48%' },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  cancelBtn: { marginTop: 15, alignItems: 'center' },
  cancelBtnText: { color: '#6b7280' }
});