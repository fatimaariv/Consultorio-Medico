import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform 
} from "react-native";
import { supabase } from "../supabase/supabase";
import DateTimePicker from '@react-native-community/datetimepicker';

const PatientProfile = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [isPatient, setIsPatient] = useState(false);
  const [userData, setUserData] = useState<any>(null); // Estado para datos del usuario
  
  // --- ESTADOS PARA EL CALENDARIO ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date(2000, 0, 1)); 
  
  const [patientData, setPatientData] = useState({
    fecha_nacimiento: '',
    enfermedades: '',
    id_usuario: null as number | null
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  // --- FUNCIÓN PARA EL CAMBIO DE FECHA ---
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    
    if (selectedDate) {
      setDate(selectedDate);
      // Formato YYYY-MM-DD para Supabase
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setPatientData({ ...patientData, fecha_nacimiento: formattedDate });
    }
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert("Error", "No se encontró una sesión activa");
        return;
      }

      const { data: dbUser, error: userErr } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', user.email as string)
        .single();

      if (userErr || !dbUser) throw new Error("No se encontró el perfil en la tabla usuarios");
      
      setUserData(dbUser);

      const { data: patient } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id_usuario', dbUser.id)
        .single();

      if (patient) {
        setIsPatient(true);
        setPatientData({
          fecha_nacimiento: patient.fecha_nacimiento,
          enfermedades: patient.enfermedades || '',
          id_usuario: dbUser.id
        });
        // Si ya hay fecha, actualizamos el estado del calendario
        if (patient.fecha_nacimiento) setDate(new Date(patient.fecha_nacimiento));
      } else {
        setIsPatient(false);
        setPatientData(prev => ({ ...prev, id_usuario: dbUser.id }));
      }

    } catch (error: any) {
      Alert.alert("Error de carga", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!patientData.id_usuario) {
      Alert.alert("Error", "No se pudo identificar al usuario");
      return;
    }
    if (!patientData.fecha_nacimiento) {
      Alert.alert("Error", "La fecha de nacimiento es obligatoria");
      return;
    }

    try {
      setLoading(true);
      const datosParaGuardar: any = {
        id_usuario: patientData.id_usuario,
        fecha_nacimiento: patientData.fecha_nacimiento,
        enfermedades: patientData.enfermedades || ""
      };

      if (isPatient) {
        const { error } = await (supabase.from('pacientes') as any)
          .update(datosParaGuardar)
          .eq('id_usuario', datosParaGuardar.id_usuario);
        
        if (error) throw error;
        Alert.alert("Éxito", "Perfil médico actualizado");
      } else {
        const { error } = await (supabase.from('pacientes') as any)
          .insert([datosParaGuardar]);
        
        if (error) throw error;
        setIsPatient(true);
        Alert.alert("¡Bienvenido!", "Ahora ya estás registrado como paciente");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.logo}>Meditrack</Text>
          <Text style={styles.title}>Perfil del Paciente</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos Personales</Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Nombre:</Text> {userData?.nombre} {userData?.apellido1}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Correo:</Text> {userData?.correo}
            </Text>
          </View>

          <View style={[styles.card, { marginTop: 15 }]}>
            <Text style={styles.sectionTitle}>
              {isPatient ? "Información Médica" : "Completar Registro Médico"}
            </Text>
            
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            {/* BOTÓN QUE ABRE EL CALENDARIO */}
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: patientData.fecha_nacimiento ? '#000' : '#999', fontSize: 16 }}>
                {patientData.fecha_nacimiento || "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()} // No permite fechas futuras
                onChange={onDateChange}
              />
            )}

            <Text style={styles.label}>Enfermedades o Alergias</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              placeholder="Describe alergias o enfermedades crónicas..."
              multiline
              numberOfLines={4}
              value={patientData.enfermedades}
              onChangeText={(t) => setPatientData({...patientData, enfermedades: t})}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
            <Text style={styles.buttonText}>
              {isPatient ? "Guardar Cambios" : "Finalizar Registro de Paciente"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
         <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={{color: '#666'}}>Inicio</Text>
         </TouchableOpacity>
         <TouchableOpacity>
            <Text style={{color: '#2563eb', fontWeight: 'bold'}}>Perfil</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  logo: { fontSize: 24, fontWeight: "bold", color: "#2563eb", textAlign: 'center', marginBottom: 5 },
  title: { fontSize: 22, fontWeight: "600", color: "#333", marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: "white", padding: 20, borderRadius: 16, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginBottom: 15 },
  infoText: { fontSize: 16, color: "#444", marginBottom: 10 },
  bold: { fontWeight: "bold", color: "#000" },
  label: { fontSize: 14, color: "#666", marginTop: 10, marginBottom: 5 },
  input: { 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 8, 
    padding: 12, // Aumentamos un poco el padding
    fontSize: 16, 
    backgroundColor: '#fff',
    justifyContent: 'center', // Centra el texto si usas un TouchableOpacity
    minHeight: 50, // Le da una altura consistente
  },
  button: { marginTop: 25, backgroundColor: "#2563eb", paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "white", flexDirection: "row", justifyContent: "space-around", paddingVertical: 20, borderTopWidth: 1, borderTopColor: "#eee" }
});

export default PatientProfile;