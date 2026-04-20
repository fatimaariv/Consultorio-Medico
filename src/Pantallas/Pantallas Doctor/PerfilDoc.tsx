import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';

export default function PerfilDoc({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);

  useEffect(() => {
    fetchDoctorData();
  }, [session]);

  const fetchDoctorData = async () => {
  try {
    setLoading(true);
    
    // 1. Obtenemos el ID del usuario de la sesión actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Ajustamos la consulta según tu diagrama exacto:
    // La tabla es 'doctores', se relaciona con 'usuario'
    const { data, error } = await supabase
      .from('doctores')
      .select(`
        especialidad,
        cedula,
        hora_inicio,
        hora_fin,
        usuario!id_usuario (
          nombre,
          apellido1,
          apellido2,
          correo,
          telefono
        )
      `)
      .eq('id_usuario', user.id) // Usamos el ID de auth para filtrar
      .single();

    if (error) throw error;

    if (data) {
      // Manejamos si 'usuario' viene como objeto o array
      const u = Array.isArray(data.usuario) ? data.usuario[0] : data.usuario;

      setDoctorInfo({
        nombreCompleto: u 
          ? `Dr. ${u.nombre || ''} ${u.apellido_p || ''} ${u.apellido_m || ''}`.trim() 
          : 'Nombre no disponible',
        especialidad: data.especialidad,
        correo: u?.correo || 'No disponible', // El correo viene de la tabla usuario
        telefono: u?.telefono || 'No registrado', // El teléfono viene de usuario según tu diagrama
        cedula: data.cedula,
        horario: `${data.hora_inicio || ''} - ${data.hora_fin || ''}`
      });
    }
  } catch (error: any) {
    console.error("Error al obtener perfil:", error.message);
    Alert.alert("Error", `No se pudo cargar el perfil: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando perfil profesional...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.logo}>MediTrak</Text>
          <Text style={styles.title}>Perfil Profesional</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <Text style={styles.label}>Nombre del Médico</Text>
            <Text style={styles.infoValue}>{doctorInfo?.nombreCompleto}</Text>

            <Text style={styles.label}>Especialidad</Text>
            <Text style={styles.infoValue}>{doctorInfo?.especialidad || 'Médico General'}</Text>

            <Text style={styles.label}>Cédula Profesional</Text>
            <Text style={styles.infoValue}>{doctorInfo?.cedula || 'En trámite'}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Contacto y Horarios</Text>

            <Text style={styles.label}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{doctorInfo?.correo}</Text>

            <Text style={styles.label}>Teléfono de Contacto</Text>
            <Text style={styles.infoValue}>{doctorInfo?.telefono || 'No registrado'}</Text>

            <Text style={styles.label}>Horario de Atención</Text>
            <View style={styles.textAreaDisplay}>
              <Text style={styles.infoValue}>{doctorInfo?.horario}</Text>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={async () => await supabase.auth.signOut()}
            >
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginBottom: 20
  },
  logoutButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFA39E'
  },
  logoutText: {
    color: '#F5222D',
    fontWeight: 'bold',
    fontSize: 16
  }
});