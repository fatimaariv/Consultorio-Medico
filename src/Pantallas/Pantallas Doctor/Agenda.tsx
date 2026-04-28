import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';
import { useFocusEffect } from '@react-navigation/native';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Cita = {
  id: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: string;
  paciente: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const toISO = (d: Date) => d.toISOString().split('T')[0];

/** Genera los próximos N días a partir de hoy */
const generateDays = (n: number): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

const DAYS_TO_SHOW = 14;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Agenda({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [doctorName, setDoctorName] = useState('');
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [speciality, setSpeciality] = useState('');
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  // Días del carrusel
  const days = generateDays(DAYS_TO_SHOW);
  const today = toISO(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // ── Carga inicial: obtener datos del doctor ──────────────────────────────
  const fetchDoctorData = async () => {
    if (!session?.user?.email) return;
    try {
      setLoading(true);
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido1')
        .eq('correo', session.user.email)
        .single();

      if (userError || !userData) throw new Error('Usuario no encontrado');

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctores')
        .select('id, especialidad')
        .eq('id', userData.id)
        .single();

      if (doctorError || !doctorData) throw new Error('Doctor no encontrado');

      setDoctorName(`${userData.nombre} ${userData.apellido1}`);
      setDoctorId(doctorData.id);
      setSpeciality(doctorData.especialidad);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Carga de citas para la fecha seleccionada ────────────────────────────
  const fetchCitas = useCallback(async (fecha: string, idDoctor: number) => {
    try {
      setLoadingCitas(true);
      const { data, error } = await supabase
        .from('citas')
        .select(`
          id,
          fecha,
          hora,
          motivo,
          estado,
          pacientes (
            usuarios!pacientes_id_fkey (
              nombre,
              apellido1
            )
          )
        `)
        .eq('id_doctor', idDoctor)
        .eq('fecha', fecha)
        .order('hora', { ascending: true });

      if (error) throw error;

      const formateadas: Cita[] = (data || []).map((c: any) => ({
        id: c.id,
        fecha: c.fecha,
        hora: c.hora.slice(0, 5),
        motivo: c.motivo,
        estado: c.estado,
        paciente: c.pacientes?.usuarios
          ? `${c.pacientes.usuarios.nombre} ${c.pacientes.usuarios.apellido1}`
          : 'Paciente no encontrado',
      }));

      setCitas(formateadas);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudieron cargar las citas: ' + err.message);
    } finally {
      setLoadingCitas(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDoctorData();
    }, [session])
  );

  // Cuando cambia el doctor o la fecha, recargar citas
  useFocusEffect(
    useCallback(() => {
      if (doctorId) fetchCitas(selectedDate, doctorId);
    }, [doctorId, selectedDate])
  );

  // ── Cancelar cita ────────────────────────────────────────────────────────
  const handleCancelarCita = (cita: Cita) => {
    Alert.alert(
      'Cancelar cita',
      `¿Seguro que deseas cancelar la cita de ${cita.paciente} a las ${cita.hora}?`,
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('citas')
                .delete()
                .eq('id', cita.id);

              if (error) {
                Alert.alert('Error', 'No se pudo cancelar la cita.');
              } else {
                Alert.alert('Cita cancelada', 'La cita fue cancelada exitosamente.');
                setCitas(prev => prev.filter(c => c.id !== cita.id));
              }
            } catch {
              Alert.alert('Error', 'Ocurrió un error inesperado.');
            }
          },
        },
      ]
    );
  };

  // ── Helpers de UI ────────────────────────────────────────────────────────
  const getEstadoStyle = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'confirmada': return { bg: '#dcfce7', text: '#16a34a' };
      case 'pendiente':  return { bg: '#fef9c3', text: '#ca8a04' };
      case 'cancelada':  return { bg: '#fee2e2', text: '#dc2626' };
      default:           return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const isToday = selectedDate === today;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando agenda...</Text>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4fd6" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerBubble1} />
        <View style={styles.headerBubble2} />

        <View style={styles.headerTop}>
          <View>
            <Text style={styles.logoText}>Medi Track</Text>
            <Text style={styles.headerTitle}>Mi Agenda</Text>
            <Text style={styles.headerSub}>Dr. {doctorName}</Text>
          </View>
          <View style={styles.specialtyBadge}>
            <Text style={styles.specialtyBadgeText}>🩺 {speciality}</Text>
          </View>
        </View>

        {/* Resumen del día */}
        <View style={styles.daySummaryCard}>
          <View>
            <Text style={styles.daySummaryLabel}>
              {isToday ? 'Hoy' : DIAS[selectedDateObj.getDay()]}
            </Text>
            <Text style={styles.daySummaryDate}>
              {selectedDateObj.getDate()} de {MESES[selectedDateObj.getMonth()]}
            </Text>
          </View>
          <View style={styles.daySummaryRight}>
            <Text style={styles.daySummaryCitasNum}>{citas.length}</Text>
            <Text style={styles.daySummaryCitasLabel}>
              {citas.length === 1 ? 'cita' : 'citas'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── CARRUSEL DE DÍAS ── */}
      <View style={styles.calendarStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarStripContent}
        >
          {days.map((d) => {
            const iso = toISO(d);
            const isSelected = iso === selectedDate;
            const isTodayDay = iso === today;
            return (
              <TouchableOpacity
                key={iso}
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => setSelectedDate(iso)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayBtnWeekday, isSelected && styles.dayBtnTextSelected]}>
                  {DIAS[d.getDay()]}
                </Text>
                <Text style={[styles.dayBtnNum, isSelected && styles.dayBtnTextSelected]}>
                  {d.getDate()}
                </Text>
                {isTodayDay && (
                  <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── LISTA DE CITAS ── */}
      <ScrollView
        style={styles.citasList}
        contentContainerStyle={styles.citasListContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          {isToday ? 'Citas de hoy' : `Citas del ${selectedDateObj.getDate()} ${MESES_CORTOS[selectedDateObj.getMonth()]}`}
        </Text>

        {loadingCitas ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.centerStateText}>Cargando citas...</Text>
          </View>
        ) : citas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🗓️</Text>
            <Text style={styles.emptyStateTitle}>Sin citas</Text>
            <Text style={styles.emptyStateText}>
              No tienes citas agendadas para este día.
            </Text>
          </View>
        ) : (
          citas.map((cita, index) => {
            const estadoStyle = getEstadoStyle(cita.estado);
            return (
              <View key={cita.id} style={styles.citaCard}>
                {/* Acento de color izquierdo */}
                <View style={[styles.citaAccent, index === 0 && styles.citaAccentFirst]} />

                <View style={styles.citaBody}>
                  {/* Fila superior: hora + badge estado */}
                  <View style={styles.citaTopRow}>
                    <View style={styles.citaHoraContainer}>
                      <Text style={styles.citaHora}>{cita.hora}</Text>
                      <Text style={styles.citaHoraLabel}> hrs</Text>
                    </View>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoStyle.bg }]}>
                      <Text style={[styles.estadoText, { color: estadoStyle.text }]}>
                        {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Nombre paciente */}
                  <Text style={styles.citaPaciente}>{cita.paciente}</Text>

                  {/* Motivo */}
                  <View style={styles.citaMotivoRow}>
                    <Text style={styles.citaMotivoIcon}>💬</Text>
                    <Text style={styles.citaMotivo} numberOfLines={2}>{cita.motivo}</Text>
                  </View>

                  {/* Botón cancelar */}
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelarCita(cita)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.cancelBtnText}>✕  Cancelar cita</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const BLUE      = '#2563eb';
const BLUE_DARK = '#1a4fd6';
const BLUE_LIGHT = '#eff6ff';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff',
  },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 15 },

  // ── HEADER ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerBubble1: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60, right: -40,
  },
  headerBubble2: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 10, left: -20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  logoText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  specialtyBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
  },
  specialtyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Tarjeta resumen del día dentro del header
  daySummaryCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  daySummaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  daySummaryDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  daySummaryRight: {
    alignItems: 'center',
  },
  daySummaryCitasNum: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 36,
  },
  daySummaryCitasLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // ── CARRUSEL DE DÍAS ──
  calendarStrip: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarStripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayBtn: {
    width: 48,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  dayBtnSelected: {
    backgroundColor: BLUE,
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dayBtnWeekday: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  dayBtnNum: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 2,
  },
  dayBtnTextSelected: {
    color: '#fff',
  },
  todayDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: BLUE,
    marginTop: 4,
  },
  todayDotSelected: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  // ── LISTA ──
  citasList: {
    flex: 1,
  },
  citasListContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 14,
  },

  // Estados vacío / cargando
  centerState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  centerStateText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: { fontSize: 40, marginBottom: 10 },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // ── TARJETA DE CITA ──
  citaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  citaAccent: {
    width: 5,
    alignSelf: 'stretch',
    backgroundColor: '#93c5fd',
  },
  citaAccentFirst: {
    backgroundColor: BLUE,
  },
  citaBody: {
    flex: 1,
    padding: 14,
  },
  citaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  citaHoraContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  citaHora: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BLUE,
  },
  citaHoraLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  estadoBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  citaPaciente: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  citaMotivoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  citaMotivoIcon: { fontSize: 13, marginTop: 1 },
  citaMotivo: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
  },

  // Botón cancelar dentro de la tarjeta
  cancelBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
});