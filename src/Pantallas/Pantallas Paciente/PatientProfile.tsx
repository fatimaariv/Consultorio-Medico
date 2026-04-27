import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StatusBar,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert("Error", "No se encontró una sesión activa."); return; }
      const userEmail = user.email;
      if (!userEmail) { Alert.alert("Error", "No se encontró el correo del usuario."); return; }

      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          nombre,
          apellido1,
          apellido2,
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
        const paciente = Array.isArray(data.pacientes) ? data.pacientes[0] : data.pacientes;
        setProfile({
          nombreCompleto: `${data.nombre} ${data.apellido1 || ''} ${data.apellido2 || ''}`.trim(),
          iniciales: `${data.nombre?.[0] || ''}${data.apellido1?.[0] || ''}`.toUpperCase(),
          correo: data.correo,
          telefono: data.telefono,
          genero: data.genero,
          fecha_nacimiento: paciente?.fecha_nacimiento || 'No registrada',
          enfermedades: paciente?.enfermedades || 'Ninguna'
        });
      }
    } catch (error: any) {
      console.error("Error al cargar perfil:", error.message);
      Alert.alert("Error", "No se pudieron cargar tus datos de salud.");
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha || fecha === 'No registrada') return fecha;
    const [year, month, day] = fecha.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando tu perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4fd6" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerBubble1} />
          <View style={styles.headerBubble2} />

          <Text style={styles.logoText}>Medi Track</Text>

          {/* Avatar con iniciales */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.iniciales || '?'}</Text>
            </View>
            <Text style={styles.headerName}>{profile?.nombreCompleto}</Text>
            <View style={styles.genderBadge}>
              <Text style={styles.genderBadgeText}>
                {profile?.genero === 'masculino' ? '♂ Masculino' : profile?.genero === 'femenino' ? '♀ Femenino' : profile?.genero || 'No especificado'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── SECCIÓN INFORMACIÓN PERSONAL ── */}
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.card}>
            <InfoRow icon="✉️" label="Correo electrónico" value={profile?.correo} />
            <View style={styles.rowDivider} />
            <InfoRow icon="📞" label="Teléfono" value={profile?.telefono || 'No registrado'} />
          </View>

          {/* ── SECCIÓN DATOS DE SALUD ── */}
          <Text style={styles.sectionTitle}>Datos de Salud</Text>
          <View style={styles.card}>
            <InfoRow icon="🎂" label="Fecha de nacimiento" value={formatFecha(profile?.fecha_nacimiento)} />
            <View style={styles.rowDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🩺</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Antecedentes / Alergias</Text>
                <View style={styles.enfermedadesBox}>
                  <Text style={styles.enfermedadesText}>{profile?.enfermedades}</Text>
                </View>
              </View>
            </View>
          </View>

        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── NAVBAR (sin cambios) ── */}
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

// Componente auxiliar para cada fila de info
const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const BLUE = '#2563eb';
const BLUE_DARK = '#1a4fd6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scrollContent: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },

  // ── HEADER ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBubble1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -70,
    right: -50,
  },
  headerBubble2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: -30,
  },
  logoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  genderBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  genderBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── BODY ──
  body: {
    paddingHorizontal: 22,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 22,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 14,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 32,
  },
  enfermedadesBox: {
    backgroundColor: '#f8faff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbe8ff',
    marginTop: 4,
  },
  enfermedadesText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },

  // ── NAVBAR (sin cambios) ──
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

export default PatientProfile;