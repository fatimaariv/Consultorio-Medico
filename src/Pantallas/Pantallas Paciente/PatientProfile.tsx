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
import { supabase } from "../../supabase/supabase";
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
    id: null as number | null
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return;

    const emailLimpio = user.email.toLowerCase().trim();
    console.log("Intentando vincular correo:", emailLimpio);

    // Buscamos en 'usuarios' sin usar .single() para que no explote si hay dudas
    const { data: usersFound, error: userErr } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('correo', emailLimpio);

    if (userErr || !usersFound || usersFound.length === 0) {
      console.log("No se encontró en tabla usuarios:", userErr);
      setLoading(false);
      return;
    }

    const dbUser = usersFound[0]; // Tomamos el primer resultado
    setUserData(dbUser);
    
    // ESTA LÍNEA ES VITAL: Actualiza el ID para el registro de paciente
    setPatientData(prev => ({ ...prev, id: dbUser.id }));

    // Ahora buscamos si ya existe en la tabla 'pacientes'
    const { data: patientsFound } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', dbUser.id);

    if (patientsFound && patientsFound.length > 0) {
      const patient = patientsFound[0];
      setIsPatient(true);
      setPatientData({
        fecha_nacimiento: patient.fecha_nacimiento,
        enfermedades: patient.enfermedades || '',
        id: dbUser.id
      });
      if (patient.fecha_nacimiento) setDate(new Date(patient.fecha_nacimiento));
    }
  } catch (error) {
    console.error("Error en carga completa:", error);
  } finally {
    setLoading(false);
  }
};

  const handleSaveProfile = async () => {
  // Verificamos que tengamos los datos mínimos
  if (!patientData.id) {
    Alert.alert("Error", "No se encontró tu ID de usuario (ID: null)");
    return;
  }
  if (!patientData.fecha_nacimiento) {
    Alert.alert("Atención", "Selecciona tu fecha de nacimiento");
    return;
  }

  try {
    setLoading(true);

    // Creamos el objeto exactamente como lo pide la tabla 'pacientes'
    const payload = {
      id: Number(patientData.id), // Forzamos que sea número
      fecha_nacimiento: patientData.fecha_nacimiento,
      enfermedades: patientData.enfermedades || ""
    };

    console.log("Intentando insertar en pacientes:", payload);

    // Usamos (as any) para saltar cualquier restricción de tipos de TS
    const { error } = await (supabase.from('pacientes') as any)
      .insert([payload]);

    if (error) {
      console.log("Detalle del error:", error);
      // Si el error dice que no existe el ID 4, es que algo anda mal en la relación de la DB
      throw error;
    }

    setIsPatient(true);
    Alert.alert("¡Éxito!", "Registro completado.");
    navigation.goBack(); // Opcional: regresar a la pantalla anterior

  } catch (error: any) {
    Alert.alert("Error de Registro", error.message);
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