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
import { supabase } from '../../supabase/supabase';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Stats = {
  doctores: number;
  pacientes: number;
  citasHoy: number;
  citasHoyTerminadas: number;
  citasTotal: number;
  pendientesTotal: number;
  terminadasTotal: number;
  consultorios: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

// ─── Componente ──────────────────────────────────────────────────────────────
export default function AdmiHome({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [adminNombre, setAdminNombre] = useState('Administrador');
  const [stats, setStats] = useState<Stats>({
    doctores: 0,
    pacientes: 0,
    citasHoy: 0,
    citasHoyTerminadas: 0,
    citasTotal: 0,
    pendientesTotal: 0,
    terminadasTotal: 0,
    consultorios: 0,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Monterrey' }); // formato YYYY-MM-DD

      // Nombre del admin
      if (session?.user?.email) {
        const { data: u } = await supabase
          .from('usuarios')
          .select('nombre, apellido1')
          .eq('correo', session.user.email)
          .single();
        if (u) setAdminNombre(`${u.nombre} ${u.apellido1}`);
      }

      // Stats generales en paralelo
      const [
        resDoctores,
        resPacientes,
        resCitasHoy,
        resCitasHoyTerminadas,
        resCitasTotal,
        resPendientesTotal,
        resTerminadasTotal,
        resConsultorios,
      ] = await Promise.all([
        supabase.from('doctores').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('id_rol', 3),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('fecha', hoy),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('fecha', hoy).eq('estado', 'terminada'),
        supabase.from('citas').select('*', { count: 'exact', head: true }),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('estado', 'terminada'),
        supabase.from('consultorios').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        doctores:           resDoctores.count           || 0,
        pacientes:          resPacientes.count          || 0,
        citasHoy:           resCitasHoy.count           || 0,
        citasHoyTerminadas: resCitasHoyTerminadas.count || 0,
        citasTotal:         resCitasTotal.count         || 0,
        pendientesTotal:    resPendientesTotal.count    || 0,
        terminadasTotal:    resTerminadasTotal.count    || 0,
        consultorios:       resConsultorios.count       || 0,
      });
    } catch (err: any) {
      console.error('Error cargando AdmiHome:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [session]));

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Cargando panel...</Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerBubble1} />
          <View style={styles.headerBubble2} />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.logoText}>Medi Track · Panel Admin</Text>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.adminName}>{adminNombre} 👋</Text>
              <Text style={styles.adminRole}>Administrador del sistema</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* Mini stats en header — totales generales */}
          <View style={styles.headerStatsRow}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNum}>{stats.citasTotal}</Text>
              <Text style={styles.headerStatLabel}>Total citas</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNum}>{stats.pendientesTotal}</Text>
              <Text style={styles.headerStatLabel}>Pendientes</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNum}>{stats.terminadasTotal}</Text>
              <Text style={styles.headerStatLabel}>Terminadas</Text>
            </View>
          </View>
        </View>

        {/* ── STATS GRID ── */}
        <Text style={styles.sectionTitle}>Resumen General</Text>

        <View style={styles.statsGrid}>
          <StatCard icon="medical" color="#2563eb"  label="Doctores"     value={stats.doctores} />
          <StatCard icon="people"  color="#7c3aed"  label="Pacientes"    value={stats.pacientes} />
          <StatCard icon="business-outline" color="#0891b2" label="Consultorios" value={stats.consultorios} />
        </View>

        {/* ── ACCIONES RÁPIDAS ── */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Acciones Rápidas</Text>

        <ActionCard
          icon="person-add-outline"
          iconBg="#dbeafe"
          iconColor={BLUE}
          title="Gestionar Doctores"
          subtitle="Dar de alta o editar especialistas"
          onPress={() => navigation.navigate('GestionarDoctores')}
        />
        <ActionCard
          icon="people-outline"
          iconBg="#fce7f3"
          iconColor="#db2777"
          title="Gestionar Usuarios"
          subtitle="Administrar pacientes y cuentas"
          onPress={() => navigation.navigate('GestionarUsuarios')}
        />
        <ActionCard
          icon="calendar-outline"
          iconBg="#fff7ed"
          iconColor="#ea580c"
          title="Gestionar Citas"
          subtitle="Ver, editar y cancelar citas"
          onPress={() => navigation.navigate('GestionarCitas')}
        />
        <ActionCard
          icon="business-outline"
          iconBg="#ede9fe"
          iconColor="#7c3aed"
          title="Consultorios"
          subtitle="Administrar"
          onPress={() => navigation.navigate('GestionarConsultorios')}
        />
        <ActionCard
          icon="bar-chart-outline"
          iconBg="#d1fae5"
          iconColor="#059669"
          title="Reportes "
          subtitle="Listado de datos"
          onPress={() => navigation.navigate('Reportes')}
        />

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function StatCard({ icon, color, label, value }: { icon: any; color: string; label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statNumber, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ icon, iconBg, iconColor, title, subtitle, onPress }: {
  icon: any; iconBg: string; iconColor: string;
  title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.actionLeft}>
        <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const BLUE      = '#2563eb';
const BLUE_DARK = '#1a4fd6';

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f0f4ff' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 15 },
  scrollContent: { paddingBottom: 20 },

  // ── Header ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 18 : 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
  },
  headerBubble1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  headerBubble2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 10, left: -20,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 22,
  },
  logoText: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  greetingText: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  adminName:    { fontSize: 21, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  adminRole:    { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3, fontStyle: 'italic' },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Mini stats en header
  headerStatsRow: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  headerStat:        { alignItems: 'center', flex: 1 },
  headerStatNum:     { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerStatLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  headerStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  // ── Sección ──
  sectionTitle: {
    fontSize: 17, fontWeight: 'bold', color: '#1e293b',
    paddingHorizontal: 22, marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 22, marginBottom: 12,
  },
  sectionCount: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  // ── Stat cards ──
  statsGrid: {
    flexDirection: 'row', paddingHorizontal: 22,
    gap: 10, marginBottom: 24,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 6,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  statIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statNumber: { fontSize: 22, fontWeight: 'bold' },
  statLabel:  { fontSize: 11, color: '#94a3b8', textAlign: 'center' },

  // ── Card citas de hoy ──
  citasHoyCard: {
    backgroundColor: '#fff', marginHorizontal: 22, marginBottom: 24,
    borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  citasHoyStat:    { alignItems: 'center', flex: 1, gap: 4 },
  citasHoyNum:     { fontSize: 26, fontWeight: 'bold' },
  citasHoyLabel:   { fontSize: 11, color: '#94a3b8' },
  citasHoyDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },

  // ── Actions ──
  actionCard: {
    backgroundColor: '#fff', marginHorizontal: 22, marginBottom: 10,
    borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle:    { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  actionSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // ── Cita cards ──
  citaCard: {
    backgroundColor: '#fff', marginHorizontal: 22, marginBottom: 10,
    borderRadius: 16, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  citaAccent:      { width: 5, backgroundColor: '#94a3b8' },
  citaAccentFirst: { backgroundColor: BLUE },
  citaBody:        { flex: 1, padding: 14 },
  citaTopRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  citaHora:        { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  estadoBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  estadoText:      { fontSize: 12, fontWeight: '600' },
  citaPaciente:    { fontSize: 14, fontWeight: '600', color: '#334155' },
  citaDoctor:      { fontSize: 13, color: '#64748b', marginTop: 2 },
  citaMotivo:      { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center', paddingVertical: 32,
    marginHorizontal: 22,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});