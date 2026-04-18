import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity
} from "react-native";
import { supabase } from "../../supabase/supabase";

const PatientProfile = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadCompleteProfile();
  }, []);

  const loadCompleteProfile = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener el usuario autenticado de Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "No se encontró una sesión activa.");
        return;
      }

      const userEmail = user.email;
      if (!userEmail) {
        Alert.alert("Error", "No se encontró el correo del usuario.");
        return;
      }

      // 2. Traer datos de la tabla 'usuarios' y 'pacientes' 
      // Relacionamos ambas tablas mediante el correo electrónico
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          nombre,
          correo,
          telefono,
          genero,
          pacientes (
            fecha_nacimiento,
            enfermedades
          )
        `)
        .eq('correo', userEmail)
        .single();

      if (error) throw error;

      if (data) {
        // Estructuramos los datos para facilitar el renderizado
        const pacientesArray = Array.isArray(data.pacientes) ? data.pacientes : [];
        setProfile({
          nombreCompleto: data.nombre,
          correo: data.correo,
          telefono: data.telefono,
          genero: data.genero,
          // Accedemos al primer elemento de la relación 'pacientes'
          fecha_nacimiento: pacientesArray[0]?.fecha_nacimiento || 'No registrada',
          enfermedades: pacientesArray[0]?.enfermedades || 'Ninguna'
        });
      }
    } catch (error: any) {
      console.error("Error al cargar perfil:", error.message);
      Alert.alert("Error", "No se pudieron cargar tus datos de salud.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando tu historial médico...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.logo}>MediTrak</Text>
          <Text style={styles.title}>Mi Perfil Médico</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.infoValue}>{profile?.nombreCompleto}</Text>

            <Text style={styles.label}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{profile?.correo}</Text>

            <Text style={styles.label}>Teléfono</Text>
            <Text style={styles.infoValue}>{profile?.telefono}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Datos de Salud</Text>

            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <Text style={styles.infoValue}>{profile?.fecha_nacimiento}</Text>

            <Text style={styles.label}>Género</Text>
            <Text style={styles.infoValue}>{profile?.genero}</Text>

            <Text style={styles.label}>Antecedentes / Alergias</Text>
            <View style={styles.textAreaDisplay}>
              <Text style={styles.infoValue}>{profile?.enfermedades}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* NAVBAR */}
            <View style={styles.bottomNav}>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text style={styles.navText}>Inicio</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('PatientProfile')}>
                <Text style={styles.navText}>Perfil</Text>
              </TouchableOpacity>
            </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  logo: { fontSize: 24, fontWeight: "bold", color: "#007AFF", textAlign: 'center', marginBottom: 5 },
  title: { fontSize: 20, fontWeight: "600", color: "#333", marginBottom: 20, textAlign: 'center' },
  card: { 
    backgroundColor: "white", 
    padding: 20, 
    borderRadius: 16, 
    elevation: 4, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 10 
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  navText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginBottom: 15 },
  label: { fontSize: 13, color: "#7F8C8D", fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 16, color: "#2C3E50", marginBottom: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#ECF0F1', marginVertical: 20 },
  textAreaDisplay: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    minHeight: 80
  }
});

export default PatientProfile;