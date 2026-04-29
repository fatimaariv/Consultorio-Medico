// src/Pantallas/Pantallas Admi/Reportes/Reportes.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabase/supabase';
import { useFocusEffect } from '@react-navigation/native';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type EntradaReporte = {
  id: string;
  tipo: 'cita' | 'consultorio' | 'doctor' | 'paciente';
  titulo: string;
  detalle: string;
  fecha: string;
  fechaDisplay: string;
};

type Filtro = 'todos' | 'cita' | 'consultorio' | 'doctor' | 'paciente';

// ─── Config visual por tipo ───────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  label: string;
}> = {
  cita:        { icon: 'calendar-outline', color: '#ea580c', bg: '#fff7ed', label: 'Cita' },
  consultorio: { icon: 'business-outline', color: '#7c3aed', bg: '#ede9fe', label: 'Consultorio' },
  doctor:      { icon: 'medical-outline',  color: '#2563eb', bg: '#dbeafe', label: 'Doctor' },
  paciente:    { icon: 'person-outline',   color: '#db2777', bg: '#fce7f3', label: 'Paciente' },
};

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos',       label: 'Todos' },
  { key: 'cita',        label: 'Citas' },
  { key: 'consultorio', label: 'Consultorios' },
  { key: 'doctor',      label: 'Doctores' },
  { key: 'paciente',    label: 'Pacientes' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const formatFecha = (iso: string) => {
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};

const formatHora = (hora: string) => {
  const [h, m] = hora.split(':');
  const hNum = parseInt(h);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  const h12  = hNum % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Reportes({ navigation }: any) {
  const [reportes, setReportes]     = useState<EntradaReporte[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro]         = useState<Filtro>('todos');

  const [totales, setTotales] = useState({
    citas: 0, consultorios: 0, doctores: 0, pacientes: 0,
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [resCitas, resConsultorios, resDoctores, resPacientes] = await Promise.all([

        // ✅ CITAS: join a pacientes y doctores, luego a usuarios
        // La FK en citas es id_paciente → pacientes.id e id_doctor → doctores.id
        supabase
          .from('citas')
          .select(`
            id, fecha, hora, estado, motivo, fecha_creacion,
            pacientes!citas_id_paciente_fkey (
              usuarios ( nombre, apellido1 )
            ),
            doctores!citas_id_doctor_fkey (
              usuarios ( nombre, apellido1 )
            )
          `)
          .order('fecha_creacion', { ascending: false })
          .limit(30),

        // ✅ CONSULTORIOS: columnas reales = id, numero, estado
        supabase
          .from('consultorios')
          .select('id, numero, estado')
          .order('id', { ascending: false })
          .limit(20),

        // ✅ DOCTORES: FK doctores.id → usuarios.id (isOneToOne: true)
        supabase
          .from('doctores')
          .select(`
            id, especialidad, cedula, hora_inicio, hora_fin,
            usuarios ( nombre, apellido1 )
          `)
          .order('id', { ascending: false })
          .limit(20),

        // ✅ PACIENTES: FK pacientes.id → usuarios.id (isOneToOne: true)
        supabase
          .from('pacientes')
          .select(`
            id, fecha_nacimiento, enfermedades,
            usuarios ( nombre, apellido1 )
          `)
          .order('id', { ascending: false })
          .limit(20),
      ]);

      const entradas: EntradaReporte[] = [];

      // — Citas —
      if (resCitas.data) {
        setTotales(t => ({ ...t, citas: resCitas.data!.length }));
        resCitas.data.forEach((c: any) => {
          const pacNombre = c.pacientes?.usuarios
            ? `${c.pacientes.usuarios.nombre} ${c.pacientes.usuarios.apellido1}`
            : 'Paciente desconocido';
          const docNombre = c.doctores?.usuarios
            ? `Dr. ${c.doctores.usuarios.nombre} ${c.doctores.usuarios.apellido1}`
            : 'Doctor no asignado';

          entradas.push({
            id:           `cita-${c.id}`,
            tipo:         'cita',
            titulo:       `Cita — ${pacNombre}`,
            detalle:      `${docNombre} · ${formatFecha(c.fecha)} a las ${formatHora(c.hora)} · Estado: ${c.estado}`,
            fecha:        c.fecha_creacion,
            fechaDisplay: formatFecha(c.fecha_creacion),
          });
        });
      }

      // — Consultorios —
      if (resConsultorios.data) {
        setTotales(t => ({ ...t, consultorios: resConsultorios.data!.length }));
        resConsultorios.data.forEach((c: any) => {
          entradas.push({
            id:           `consultorio-${c.id}`,
            tipo:         'consultorio',
            titulo:       `Consultorio #${c.numero}`,
            detalle:      `Estado: ${c.estado}`,
            fecha:        `2000-01-01T00:00:00.00${c.id}Z`,
            fechaDisplay: `ID #${c.id}`,
          });
        });
      }

      // — Doctores —
      if (resDoctores.data) {
        setTotales(t => ({ ...t, doctores: resDoctores.data!.length }));
        resDoctores.data.forEach((d: any) => {
          // usuarios viene como objeto único porque la relación es isOneToOne
          const u = d.usuarios;
          const nombre = u
            ? `Dr. ${u.nombre} ${u.apellido1}`
            : `Doctor ID #${d.id}`;
          entradas.push({
            id:           `doctor-${d.id}`,
            tipo:         'doctor',
            titulo:       nombre,
            detalle:      `Especialidad: ${d.especialidad} · Cédula: ${d.cedula} · Horario: ${formatHora(d.hora_inicio)} - ${formatHora(d.hora_fin)}`,
            fecha:        `2000-01-01T00:00:00.00${d.id}Z`,
            fechaDisplay: `ID #${d.id}`,
          });
        });
      }

      // — Pacientes —
      if (resPacientes.data) {
        setTotales(t => ({ ...t, pacientes: resPacientes.data!.length }));
        resPacientes.data.forEach((p: any) => {
          // usuarios viene como objeto único porque la relación es isOneToOne
          const u = p.usuarios;
          const nombre = u
            ? `${u.nombre} ${u.apellido1}`
            : `Paciente ID #${p.id}`;
          entradas.push({
            id:           `paciente-${p.id}`,
            tipo:         'paciente',
            titulo:       nombre,
            detalle:      `Fecha de nacimiento: ${formatFecha(p.fecha_nacimiento)}${p.enfermedades ? ` · ${p.enfermedades}` : ''}`,
            fecha:        `2000-01-01T00:00:00.00${p.id}Z`,
            fechaDisplay: `ID #${p.id}`,
          });
        });
      }

      entradas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setReportes(entradas);

    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const reportesFiltrados = filtro === 'todos'
    ? reportes
    : reportes.filter(r => r.tipo === filtro);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={BLUE}
            colors={[BLUE]}
          />
        }
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerBubble1} />
          <View style={styles.headerBubble2} />

          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.logoText}>Medi Track · Panel Admin</Text>
              <Text style={styles.headerTitle}>Reportes del sistema</Text>
              <Text style={styles.headerSub}>Registros actuales en la base de datos</Text>
            </View>
          </View>

          <View style={styles.headerStatsRow}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNum}>{totales.citas}</Text>
              <Text style={styles.headerStatLabel}>Citas</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNum}>{totales.doctores}</Text>
              <Text style={styles.headerStatLabel}>Doctores</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNum}>{totales.pacientes}</Text>
              <Text style={styles.headerStatLabel}>Pacientes</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNum}>{totales.consultorios}</Text>
              <Text style={styles.headerStatLabel}>Consultorios</Text>
            </View>
          </View>
        </View>

        {/* ── FILTROS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosContainer}
        >
          {FILTROS.map(f => {
            const active = filtro === f.key;
            const cfg = f.key !== 'todos' ? TIPO_CONFIG[f.key] : null;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filtroBtn,
                  active && { backgroundColor: cfg?.color ?? BLUE, borderColor: cfg?.color ?? BLUE },
                ]}
                onPress={() => setFiltro(f.key)}
                activeOpacity={0.75}
              >
                {cfg && (
                  <Ionicons
                    name={cfg.icon}
                    size={13}
                    color={active ? '#fff' : cfg.color}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[styles.filtroText, active && { color: '#fff' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── CONTEO ── */}
        <View style={styles.conteoRow}>
          <Text style={styles.conteoText}>
            {reportesFiltrados.length} {reportesFiltrados.length === 1 ? 'registro' : 'registros'}
          </Text>
        </View>

        {/* ── LISTA ── */}
        {reportesFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={36} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>Sin registros</Text>
            <Text style={styles.emptyText}>No hay datos para este filtro.</Text>
          </View>
        ) : (
          reportesFiltrados.map((r) => {
            const cfg = TIPO_CONFIG[r.tipo];
            return (
              <View key={r.id} style={styles.reporteCard}>
                <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />
                <View style={styles.cardBody}>
                  <View style={[styles.cardIconWrap, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTopRow}>
                      <View style={[styles.tipoBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.tipoBadgeText, { color: cfg.color }]}>
                          {cfg.label}
                        </Text>
                      </View>
                      <Text style={styles.cardFecha}>{r.fechaDisplay}</Text>
                    </View>
                    <Text style={styles.cardTitulo} numberOfLines={1}>{r.titulo}</Text>
                    <Text style={styles.cardDetalle} numberOfLines={2}>{r.detalle}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const BLUE      = '#2563eb';
const BLUE_DARK = '#1a4fd6';

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f0f4ff' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  loadingText:   { marginTop: 12, color: '#6b7280', fontSize: 15 },
  scrollContent: { paddingBottom: 20 },

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
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 10, left: -20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoText: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitle: { fontSize: 21, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  headerStatsRow: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  headerStat:        { alignItems: 'center', flex: 1 },
  headerStatNum:     { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerStatLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  headerStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

  filtrosContainer: {
    paddingHorizontal: 22, paddingBottom: 4,
    gap: 8, flexDirection: 'row', marginBottom: 12,
  },
  filtroBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: '#e2e8f0', backgroundColor: '#fff',
  },
  filtroText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  conteoRow:  { paddingHorizontal: 22, marginBottom: 10 },
  conteoText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  reporteCard: {
    backgroundColor: '#fff',
    marginHorizontal: 22, marginBottom: 10,
    borderRadius: 16, flexDirection: 'row', overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  cardAccent: { width: 4 },
  cardBody: {
    flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  tipoBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  tipoBadgeText: { fontSize: 11, fontWeight: '700' },
  cardFecha:     { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  cardTitulo:    { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  cardDetalle:   { fontSize: 12, color: '#64748b', lineHeight: 17 },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 22 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  emptyText:  { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
});