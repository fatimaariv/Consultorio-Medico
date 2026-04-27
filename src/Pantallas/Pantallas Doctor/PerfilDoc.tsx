import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';

// ─── Tipos ──────────────────────────────────────────────────────────────────
type DoctorProfile = {
  nombreCompleto: string;
  iniciales: string;
  especialidad: string;
  cedula: string;
  correo: string;
  telefono: string;
  genero: string;
  hora_inicio: string;
  hora_fin: string;
};

// ─── Componente auxiliar InfoRow ────────────────────────────────────────────
const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// ─── Componente principal ───────────────────────────────────────────────────
export default function PerfilDoc({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);

  useEffect(() => {
    fetchDoctorProfile();
  }, [session]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      if (!session?.user?.email) return;

      // 1. Buscar usuario por correo (datos personales viven en 'usuarios')
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido1, apellido2, correo, telefono, genero')
        .eq('correo', session.user.email)
        .single();

      if (usuarioError || !usuarioData) throw new Error('No se encontró el usuario.');

      // 2. Con el id, buscar los datos médicos en 'doctores' (doctores.id === usuarios.id)
      const { data: docData, error: docError } = await supabase
        .from('doctores')
        .select('especialidad, cedula, hora_inicio, hora_fin')
        .eq('id', usuarioData.id)
        .single();

      if (docError || !docData) throw new Error('No se encontró el perfil de doctor.');

      const nombre = usuarioData.nombre || '';
      const apellido1 = usuarioData.apellido1 || '';
      const apellido2 = usuarioData.apellido2 || '';

      setProfile({
        nombreCompleto: `${nombre} ${apellido1} ${apellido2}`.trim(),
        iniciales: `${nombre[0] || ''}${apellido1[0] || ''}`.toUpperCase(),
        especialidad: docData.especialidad,
        cedula: docData.cedula,
        correo: usuarioData.correo,
        telefono: usuarioData.telefono || 'No registrado',
        genero: usuarioData.genero,
        hora_inicio: docData.hora_inicio,
        hora_fin: docData.hora_fin,
      });
    } catch (error: any) {
      console.error('Error al obtener perfil:', error.message);
      Alert.alert('Error', `No se pudo cargar el perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando perfil profesional...</Text>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4fd6" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerBubble1} />
          <View style={styles.headerBubble2} />

          <Text style={styles.logoText}>Medi Track · Panel Médico</Text>

          {/* Avatar con iniciales */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.iniciales || '?'}</Text>
            </View>
            <Text style={styles.headerName}>Dr. {profile?.nombreCompleto}</Text>
            <View style={styles.especialidadBadge}>
              <Text style={styles.especialidadBadgeText}>🩺 {profile?.especialidad}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── INFORMACIÓN PERSONAL ── */}
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.card}>
            <InfoRow icon="✉️" label="Correo electrónico" value={profile?.correo || ''} />
            <View style={styles.rowDivider} />
            <InfoRow
              icon="📞"
              label="Teléfono de contacto"
              value={profile?.telefono || 'No registrado'}
            />
            <View style={styles.rowDivider} />
            <InfoRow
              icon={profile?.genero === 'masculino' ? '♂️' : '♀️'}
              label="Género"
              value={
                profile?.genero === 'masculino'
                  ? 'Masculino'
                  : profile?.genero === 'femenino'
                  ? 'Femenino'
                  : profile?.genero || 'No especificado'
              }
            />
          </View>

          {/* ── DATOS PROFESIONALES ── */}
          <Text style={styles.sectionTitle}>Datos Profesionales</Text>
          <View style={styles.card}>
            <InfoRow icon="🪪" label="Cédula profesional" value={profile?.cedula || 'En trámite'} />
            <View style={styles.rowDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕐</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Horario de atención</Text>
                <View style={styles.horarioBox}>
                  <View style={styles.horarioItem}>
                    <Text style={styles.horarioItemLabel}>Entrada</Text>
                    <Text style={styles.horarioItemValue}>{profile?.hora_inicio}</Text>
                  </View>
                  <View style={styles.horarioSeparator} />
                  <View style={styles.horarioItem}>
                    <Text style={styles.horarioItemLabel}>Salida</Text>
                    <Text style={styles.horarioItemValue}>{profile?.hora_fin}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── CERRAR SESIÓN ── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── NAVBAR ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('DoctorHome')}>
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => {}}>
          <Text style={[styles.navText, styles.navTextActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const BLUE = '#2563eb';
const BLUE_DARK = '#1a4fd6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scrollContent: { paddingBottom: 100 },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f0f4ff',
  },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },

  // ── Header ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 16 : 16,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBubble1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50,
  },
  headerBubble2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -30,
  },
  logoText: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    alignSelf: 'flex-start', marginBottom: 20,
  },
  avatarContainer: { alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  especialidadBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  especialidadBadgeText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },

  // ── Body ──
  body: { paddingHorizontal: 22 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 22,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 },
  infoIcon: { fontSize: 18, marginRight: 14, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 12, color: '#94a3b8', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3,
  },
  infoValue: { fontSize: 15, color: '#1e293b', fontWeight: '500' },
  rowDivider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 32 },

  // Horario box
  horarioBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8faff', borderRadius: 10,
    borderWidth: 1, borderColor: '#dbe8ff',
    marginTop: 6, overflow: 'hidden',
  },
  horarioItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  horarioItemLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
  horarioItemValue: { fontSize: 16, fontWeight: '700', color: BLUE, marginTop: 2 },
  horarioSeparator: { width: 1, height: '80%', backgroundColor: '#dbe8ff' },

  // Logout
  logoutBtn: {
    backgroundColor: '#fff1f0', borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 8,
    borderWidth: 1.5, borderColor: '#fca5a5',
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },

  // Navbar
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', flexDirection: 'row',
    justifyContent: 'space-around', paddingVertical: 20,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  navBtn: { alignItems: 'center' },
  navText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  navTextActive: { color: BLUE },
});