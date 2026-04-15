import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabase/supabase'; // Ajusta la ruta si es necesario
import DateTimePicker from '@react-native-community/datetimepicker';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext'; 

export default function ScheduleScreen({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [doctoresDB, setDoctoresDB] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id_doctor: '',
    especialidad: '',
    fecha: '',
    hora: '',
    motivo: ''
  });

  // 2. AGREGA ESTOS NUEVOS ESTADOS (Para el calendario)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  // 3. AGREGA ESTAS FUNCIONES (Para manejar el cambio de fecha/hora)
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, fecha: formattedDate });
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setFormData({ ...formData, hora: `${hours}:${minutes}` });
    }
  };

  useEffect(() => {
    fetchDoctores();
  }, []);

  const fetchDoctores = async () => {
    try {
      setLoading(true);
      
      // 1. Traemos los doctores
      const { data: dData, error: dError } = await supabase.from('doctores').select('*');
      
      // 2. Traemos TODO de usuarios para no fallar con el nombre de la columna
      const { data: uData, error: uError } = await supabase.from('usuarios').select('*');

      if (dError || uError) throw (dError || uError);

      const formateados = (dData || []).map((doc: any) => {
        // Buscamos al usuario. 
        // IMPORTANTE: Si en tu tabla usuarios NO se llama 'cedula', 
        // cambia 'u.cedula' por el nombre correcto (ej: u.id_usuario o u.dni)
        const usuario = (uData || []).find(
          (u: any) => String(u.cedula || u.id).trim() === String(doc.cedula).trim()
        );

        return {
          id: doc.id.toString(),
          nombre: usuario ? `${usuario.nombre} ${usuario.apellido1}` : `Dr. Cédula: ${doc.cedula}`,
          especialidad: doc.especialidad // Se saca de la tabla doctores
        };
      });

      setDoctoresDB(formateados);
    } catch (error: any) {
      console.error("Error detallado:", error.message);
      Alert.alert("Error", "No se pudieron conectar las tablas. Revisa los nombres de las columnas.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
  // 1. Validar que los campos no estén vacíos
  if (!formData.id_doctor || !formData.fecha || !formData.hora || !formData.motivo) {
    Alert.alert("Error", "Por favor completa todos los campos");
    return;
  }

  // 2. Obtener el email del usuario desde la sesión
  const userEmail = session!.user!.email!;
  if (!userEmail) {
    Alert.alert("Error", "No se encontró una sesión activa");
    return;
  }

  try {
    setLoading(true);

    // 3. Buscar el ID real del paciente en la tabla 'usuarios'
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('correo', userEmail)
      .single();

    if (userError || !userData) {
      throw new Error("No se pudo identificar tu ID de usuario en la base de datos.");
    }

    // 4. INSERTAR EN LA BASE DE DATOS
    // Usamos Number() para asegurar que los IDs sean números y no texto
    const { error } = await supabase.from('citas').insert([{
      id_doctor: Number(formData.id_doctor),
      id_paciente: Number(userData.id),
      fecha: formData.fecha,
      hora: formData.hora,
      motivo: formData.motivo,
      estado: 'pendiente',
      // id_consultorio: null // Opcional, según tu tabla
    }]);

    if (error) throw error;

    Alert.alert("Éxito", "Cita programada correctamente");
    navigation.goBack();

  } catch (error: any) {
    console.error("Error completo:", error);
    Alert.alert("Error", error.message || "No se pudo crear la cita");
  } finally {
    setLoading(false);
  }
};

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={{marginTop: 10}}>Cargando médicos...</Text>
    </View>
  );

  

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Programar Cita</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Médico Disponible</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.id_doctor}
                onValueChange={(val) => {
                  const doc = doctoresDB.find(d => d.id === val);
                  setFormData({
                    ...formData, 
                    id_doctor: val, 
                    especialidad: doc ? doc.especialidad : '' 
                  });
                }}
              >
                <Picker.Item label="Seleccione un médico..." value="" />
                {doctoresDB.map((doc) => (
                  <Picker.Item key={doc.id} label={`Doc. ${doc.nombre}`} value={doc.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Especialidad</Text>
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              value={formData.especialidad} 
              editable={false} 
              placeholder="Se llenará automáticamente"
            />
          </View>

          <View style={styles.row}>
  <View style={styles.halfField}>
    <Text style={styles.label}>Fecha</Text>
    <TouchableOpacity 
      style={styles.input} 
      onPress={() => setShowDatePicker(true)}
    >
      <Text>{formData.fecha || "Seleccionar Fecha"}</Text>
    </TouchableOpacity>
  </View>

  <View style={styles.halfField}>
    <Text style={styles.label}>Hora</Text>
    <TouchableOpacity 
      style={styles.input} 
      onPress={() => setShowTimePicker(true)}
    >
      <Text>{formData.hora || "Seleccionar Hora"}</Text>
    </TouchableOpacity>
  </View>
</View>

{/* Componentes del Selector (solo se ven al presionar) */}
{showDatePicker && (
  <DateTimePicker
    value={date}
    mode="date"
    display="default"
    onChange={onDateChange}
    minimumDate={new Date()} // No permite citas en el pasado
  />
)}

{showTimePicker && (
  <DateTimePicker
    value={date}
    mode="time"
    display="default"
    is24Hour={true}
    onChange={onTimeChange}
  />
)}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Motivo de la consulta</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline 
                placeholder="Describa brevemente..." 
                value={formData.motivo} 
                onChangeText={(t) => setFormData({...formData, motivo: t})} 
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreateAppointment}>
            <Text style={styles.submitBtnText}>Confirmar Cita</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flexGrow: 1, backgroundColor: '#f9fafb', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: 'white', padding: 32, borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#1f2937' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 8, fontSize: 16, backgroundColor: 'white' },
  disabledInput: { backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 'bold' },
  pickerWrapper: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, backgroundColor: 'white' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  halfField: { width: '48%' },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelBtnText: { color: '#ef4444', textAlign: 'center', marginTop: 16, fontWeight: '600' }
});