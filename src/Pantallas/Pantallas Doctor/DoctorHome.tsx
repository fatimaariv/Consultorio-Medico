import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// ─── Tipos ─────────────────────────────────────────────────────────────────
type DoctorInfo = {
  nombre: string;
  apellido1: string;
  especialidad: string;
  cedula: string;
  hora_inicio: string;
  hora_fin: string;
  id: number | null;
};

type CitaHoy = {
  id: number;
  hora: string;
  motivo: string;
  nombrePaciente: string;
  estado: string;
};

// ─── Componente ────────────────────────────────────────────────────────────
export default function DoctorHome({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({
    nombre: '',
    apellido1: '',
    especialidad: '',
    cedula: '',
    hora_inicio: '',
    hora_fin: '',
    id: null,
  });
  const [stats, setStats] = useState({ totalPacientes: 0, citasHoy: 0, citasPendientes: 0 });
  const [proximasCitas, setProximasCitas] = useState<CitaHoy[]>([]);

  // ── Saludo dinámico ────────────────────────────────────────────────────
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatFecha = (fecha: string) => {
    const [year, month, day] = fecha.split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(day)} ${meses[parseInt(month) - 1]} ${year}`;
  };

  // ── Fetch datos ────────────────────────────────────────────────────────
  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      if (!session?.user?.email) return;

      // 1. Buscamos el usuario por correo para obtener su id
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido1, apellido2')
        .eq('correo', session.user.email)
        .single();

      if (usuarioError || !usuarioData) throw new Error('No se encontró el usuario.');

      // 2. Con el id del usuario buscamos el doctor (doctores.id === usuarios.id)
      const { data: docData, error: docError } = await supabase
        .from('doctores')
        .select('id, especialidad, cedula, hora_inicio, hora_fin')
        .eq('id', usuarioData.id)
        .single();

      if (docError || !docData) throw new Error('No se encontró el perfil de doctor.');

      setDoctorInfo({
        nombre: usuarioData.nombre,
        apellido1: usuarioData.apellido1,
        especialidad: docData.especialidad,
        cedula: docData.cedula,
        hora_inicio: docData.hora_inicio,
        hora_fin: docData.hora_fin,
        id: docData.id,
      });

      // 3. Stats: citas de hoy
      const hoy = new Date().toISOString().split('T')[0];

      const { count: citasHoyCount } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .eq('id_doctor', docData.id)
        .eq('fecha', hoy);

      // 4. Stats: citas pendientes totales
      const { count: pendientesCount } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .eq('id_doctor', docData.id)
        .eq('estado', 'pendiente');

      // 5. Pacientes únicos atendidos
      const { data: pacientesData } = await supabase
        .from('citas')
        .select('id_paciente')
        .eq('id_doctor', docData.id);

      const pacientesUnicos = new Set((pacientesData || []).map((c: any) => c.id_paciente)).size;

      setStats({
        totalPacientes: pacientesUnicos,
        citasHoy: citasHoyCount || 0,
        citasPendientes: pendientesCount || 0,
      });

      // 6. Próximas citas de hoy con nombre del paciente
      const { data: citasData } = await supabase
        .from('citas')
        .select(`
          id,
          hora,
          motivo,
          estado,
          pacientes!citas_id_paciente_fkey (
            usuarios!pacientes_id_fkey (
              nombre,
              apellido1
            )
          )
        `)
        .eq('id_doctor', docData.id)
        .eq('fecha', hoy)
        .order('hora', { ascending: true });

      const formateadas: CitaHoy[] = (citasData || []).map((c: any) => {
        const u = c.pacientes?.usuarios;
        return {
          id: c.id,
          hora: c.hora,
          motivo: c.motivo,
          estado: c.estado,
          nombrePaciente: u ? `${u.nombre} ${u.apellido1}` : 'Paciente',
        };
      });

      setProximasCitas(formateadas);
    } catch (error: any) {
      console.error('Error al obtener datos del doctor:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDoctorData();
    }, [session])
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando panel...</Text>
      </View>
    );
  }

  const nombreCompleto = `${doctorInfo.nombre} ${doctorInfo.apellido1}`;
  const proximaCita = proximasCitas[0] || null;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4fd6" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerBubble1} />
          <View style={styles.headerBubble2} />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.logoText}>Medi Track · Panel Médico</Text>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userNameText}>Dr. {nombreCompleto} 👋</Text>
              <Text style={styles.especialidadText}>{doctorInfo.especialidad}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* Próxima cita del día */}
          {proximaCita ? (
            <View style={styles.nextCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>Primera cita del día</Text>
                <Text style={styles.nextPatient}>{proximaCita.nombrePaciente}</Text>
                <Text style={styles.nextDetail}>{proximaCita.hora} hrs · {proximaCita.motivo}</Text>
              </View>
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>🩺</Text>
              </View>
            </View>
          ) : (
            <View style={styles.nextCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>Agenda de hoy</Text>
                <Text style={styles.nextPatient}>Sin citas para hoy</Text>
                <Text style={styles.nextDetail}>Horario: {doctorInfo.hora_inicio} – {doctorInfo.hora_fin}</Text>
              </View>
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>📋</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={22} color="#2563eb" />
            <Text style={styles.statNumber}>{stats.totalPacientes}</Text>
            <Text style={styles.statLabel}>Pacientes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={22} color="#10b981" />
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.citasHoy}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color="#f59e0b" />
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.citasPendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>

        {/* ── ACCIONES ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Agenda')}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Ver Agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('HistorialDeCitas')}
            activeOpacity={0.85}
          >
            <Ionicons name="time-outline" size={20} color="#2563eb" />
            <Text style={styles.secondaryBtnText}>Historial</Text>
          </TouchableOpacity>
        </View>

        {/* ── CITAS DE HOY ── */}
        <Text style={styles.sectionTitle}>Citas de hoy</Text>

        {proximasCitas.length > 0 ? (
          proximasCitas.map((cita, index) => (
            <View key={cita.id} style={styles.citaCard}>
              <View style={[styles.citaAccent, index === 0 && styles.citaAccentFirst]} />
              <View style={styles.citaInfo}>
                <Text style={styles.citaPatient}>{cita.nombrePaciente}</Text>
                <Text style={styles.citaMotivo}>{cita.motivo}</Text>
              </View>
              <View style={styles.citaRight}>
                <Text style={styles.citaHora}>{cita.hora}</Text>
                <View style={[
                  styles.estadoBadge,
                  cita.estado === 'pendiente' && styles.estadoPendiente,
                  cita.estado === 'completada' && styles.estadoCompletada,
                ]}>
                  <Text style={styles.estadoText}>{cita.estado}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyText}>No hay citas programadas para hoy</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── NAVBAR ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => {}}>
          <Ionicons name="home" size={22} color="#2563eb" />
          <Text style={[styles.navText, { color: '#2563eb' }]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Pacientes')}>
          <Ionicons name="person-outline" size={22} color="#64748b" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const BLUE = '#2563eb';
const BLUE_DARK = '#1a4fd6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 15 },
  scrollContent: { paddingBottom: 100 },

  // ── Header ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 18 : 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
  },
  headerBubble1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  headerBubble2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 20, left: -20,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  logoText: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  greetingText: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  userNameText: { fontSize: 21, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  especialidadText: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)',
    marginTop: 3, fontStyle: 'italic',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Next cita card
  nextCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nextLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  nextPatient: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  nextDetail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  nextBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  nextBadgeText: { fontSize: 20 },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 22,
    gap: 10, marginBottom: 18,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center',
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    gap: 4,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: BLUE },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },

  // ── Acciones ──
  actionsRow: {
    flexDirection: 'row', paddingHorizontal: 22,
    gap: 12, marginBottom: 26,
  },
  primaryBtn: {
    flex: 1, backgroundColor: BLUE, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  secondaryBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#dbe8ff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  secondaryBtnText: { color: BLUE, fontWeight: '600', fontSize: 14 },

  // ── Citas ──
  sectionTitle: {
    fontSize: 17, fontWeight: 'bold',
    color: '#1e293b', paddingHorizontal: 22, marginBottom: 12,
  },
  citaCard: {
    backgroundColor: '#fff', marginHorizontal: 22, marginBottom: 10,
    borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  citaAccent: { width: 4, alignSelf: 'stretch', backgroundColor: '#93c5fd' },
  citaAccentFirst: { backgroundColor: BLUE },
  citaInfo: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  citaPatient: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  citaMotivo: { fontSize: 13, color: '#64748b', marginTop: 3 },
  citaRight: { paddingRight: 14, alignItems: 'flex-end', gap: 6 },
  citaHora: { fontSize: 14, fontWeight: '700', color: BLUE },
  estadoBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, backgroundColor: '#f1f5f9',
  },
  estadoPendiente: { backgroundColor: '#fef3c7' },
  estadoCompletada: { backgroundColor: '#d1fae5' },
  estadoText: { fontSize: 11, fontWeight: '600', color: '#374151' },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 22 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },

  // ── Navbar ──
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', flexDirection: 'row',
    justifyContent: 'space-around', paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  navBtn: { alignItems: 'center', gap: 2 },
  navText: { fontSize: 11, marginTop: 2, color: '#64748b', fontWeight: '600' },
});