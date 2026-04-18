import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView, SafeAreaView 
} from 'react-native';
import { supabase } from '../../supabase/supabase';

export default function Consulta({ route, navigation }: any) {
  // Estos datos vendrían de la cita seleccionada
  const { id_cita } = route.params || {};

  const [form, setForm] = useState({
    peso: '',
    estatura: '',
    presion: '',
    temperatura: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    diagnostico: '',
    tratamiento: '',
    sintomas: ''
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Nota: Asegúrate de tener una tabla llamada 'detalles_consulta' 
      // o similar para guardar estos datos médicos específicos.
      const { error } = await supabase
        .from('consultas') 
        .insert([{
          id_cita: id_cita,
          id_doctor: 1, // Replace with actual doctor ID from context
          id_paciente: 1, // Replace with actual patient ID from context
          fecha: new Date().toISOString().split('T')[0],
          peso: parseInt(form.peso) || 0,
          estatura: parseInt(form.estatura) || 0,
          presion: form.presion,
          temperatura: parseInt(form.temperatura) || 0,
          diagnostico: form.diagnostico,
          tratamiento: form.tratamiento,
          sintomas: form.frecuencia_cardiaca + ' ' + form.frecuencia_respiratoria
        }]);

      if (error) throw error;

      Alert.alert("Éxito", "Consulta registrada correctamente");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Detalles de Consulta</Text>

        <View style={styles.row}>
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Peso (kg)" value={form.peso} onChangeText={(v) => handleInputChange('peso', v)} keyboardType="numeric" />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Estatura (cm)" value={form.estatura} onChangeText={(v) => handleInputChange('estatura', v)} keyboardType="numeric" />
        </View>

        <TextInput style={styles.input} placeholder="Presión Arterial" value={form.presion} onChangeText={(v) => handleInputChange('presion', v)} />
        <TextInput style={styles.input} placeholder="Temperatura (°C)" value={form.temperatura} onChangeText={(v) => handleInputChange('temperatura', v)} keyboardType="numeric" />
        
        <View style={styles.row}>
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Frec. Cardiaca" value={form.frecuencia_cardiaca} onChangeText={(v) => handleInputChange('frecuencia_cardiaca', v)} keyboardType="numeric" />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Frec. Respiratoria" value={form.frecuencia_respiratoria} onChangeText={(v) => handleInputChange('frecuencia_respiratoria', v)} keyboardType="numeric" />
        </View>

        <TextInput style={[styles.input, styles.textArea]} placeholder="Diagnóstico" value={form.diagnostico} onChangeText={(v) => handleInputChange('diagnostico', v)} multiline />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Tratamiento" value={form.tratamiento} onChangeText={(v) => handleInputChange('tratamiento', v)} multiline />

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar Consulta</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1e293b' },
  row: { flexDirection: 'row', gap: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 15, borderRadius: 12, marginBottom: 15 },
  textArea: { height: 80 },
  button: { backgroundColor: '#2563eb', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});