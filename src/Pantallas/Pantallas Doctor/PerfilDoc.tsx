import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';

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
  const { session, doctorProfile, setDoctorProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(!doctorProfile); // si ya hay caché, no carga

  useEffect(() => {
    // Si ya tenemos el perfil en caché, no hacemos ninguna petición
    if (doctorProfile) return;
    fetchDoctorProfile();
  }, [session]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      if (!session?.user?.email) return;

      // ── Query única con JOIN (antes eran 2 queries secuenciales) ──
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id, nombre, apellido1, apellido2, correo, telefono, genero,
          doctores ( especialidad, cedula, hora_inicio, hora_fin )
        `)
        .eq('correo', session.user.email)
        .single();

      if (error || !data) throw new Error('No se encontró el perfil.');

      const docData = Array.isArray(data.doctores) ? data.doctores[0] : data.doctores;
      if (!docData) throw new Error('No se encontró el perfil de doctor.');

      const nombre = data.nombre || '';
      const apellido1 = data.apellido1 || '';
      const apellido2 = data.apellido2 || '';

      const perfil = {
        nombreCompleto: `${nombre} ${apellido1} ${apellido2}`.trim(),
        iniciales: `${nombre[0] || ''}${apellido1[0] || ''}`.toUpperCase(),
        especialidad: docData.especialidad,
        cedula: docData.cedula,
        correo: data.correo,
        telefono: data.telefono || 'No registrado',
        genero: data.genero,
        hora_inicio: docData.hora_inicio,
        hora_fin: docData.hora_fin,
      };

      // Guardar en caché del contexto para visitas futuras
      setDoctorProfile(perfil);
    } catch (error: any) {
      console.error('Error al obtener perfil:', error.message);
      Alert.alert('Error', `No se pudo cargar el perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // El caché se limpia automáticamente en AuthContext al detectar SIGNED_OUT
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4fd6" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER — siempre visible, placeholders mientras carga ── */}
        <View style={styles.header}>
          <View style={styles.headerBubble1} />
          <View style={styles.headerBubble2} />

          <Text style={styles.logoText}>Medi Track · Panel Médico</Text>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{doctorProfile?.iniciales || '...'}</Text>
            </View>
            <Text style={styles.headerName}>
              Dr. {doctorProfile?.nombreCompleto || 'Cargando...'}
            </Text>
            <View style={styles.especialidadBadge}>
              <Text style={styles.especialidadBadgeText}>
                🩺 {doctorProfile?.especialidad || 'Cargando...'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── CONTENIDO — spinner o cards según estado de carga ── */}
        {loading ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Cargando perfil profesional...</Text>
          </View>
        ) : (
          <View style={styles.body}>

            {/* ── INFORMACIÓN PERSONAL ── */}
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.card}>
              <InfoRow icon="✉️" label="Correo electrónico" value={doctorProfile?.correo || ''} />
              <View style={styles.rowDivider} />
              <InfoRow
                icon="📞"
                label="Teléfono de contacto"
                value={doctorProfile?.telefono || 'No registrado'}
              />
              <View style={styles.rowDivider} />
              <InfoRow
                icon={doctorProfile?.genero === 'masculino' ? '♂️' : '♀️'}
                label="Género"
                value={
                  doctorProfile?.genero === 'masculino'
                    ? 'Masculino'
                    : doctorProfile?.genero === 'femenino'
                    ? 'Femenino'
                    : doctorProfile?.genero || 'No especificado'
                }
              />
            </View>

            {/* ── DATOS PROFESIONALES ── */}
            <Text style={styles.sectionTitle}>Datos Profesionales</Text>
            <View style={styles.card}>
              <InfoRow icon="🪪" label="Cédula profesional" value={doctorProfile?.cedula || 'En trámite'} />
              <View style={styles.rowDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🕐</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Horario de atención</Text>
                  <View style={styles.horarioBox}>
                    <View style={styles.horarioItem}>
                      <Text style={styles.horarioItemLabel}>Entrada</Text>
                      <Text style={styles.horarioItemValue}>{doctorProfile?.hora_inicio}</Text>
                    </View>
                    <View style={styles.horarioSeparator} />
                    <View style={styles.horarioItem}>
                      <Text style={styles.horarioItemLabel}>Salida</Text>
                      <Text style={styles.horarioItemValue}>{doctorProfile?.hora_fin}</Text>
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
        )}

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

  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },

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

  logoutBtn: {
    backgroundColor: '#fff1f0', borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 8,
    borderWidth: 1.5, borderColor: '#fca5a5',
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },

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