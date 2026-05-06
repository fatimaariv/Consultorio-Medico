// src/Pantallas/Pantallas Admi/GestionarCitas/GestionarCitas.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,        // ✅ este se queda en react-native
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ movido aquí
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabase/supabase';

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

// Estados de cita con colores
const ESTADO_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pendiente:  { color: '#d97706', bg: '#fef3c7', label: 'Pendiente' },
  confirmada: { color: '#2563eb', bg: '#dbeafe', label: 'Confirmada' },
  completada: { color: '#16a34a', bg: '#dcfce7', label: 'Completada' },
  cancelada:  { color: '#dc2626', bg: '#fee2e2', label: 'Cancelada'  },
};

// Horas disponibles para agendar
const HORAS_DISPONIBLES = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00',
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionarCitas({ navigation }: any) {
  // Búsqueda
  const [correo, setCorreo]           = useState('');
  const [buscando, setBuscando]       = useState(false);
  const [buscado, setBuscado]         = useState(false);
  const [pacienteNombre, setPacienteNombre] = useState('');
  const [citas, setCitas]             = useState<any[]>([]);

  // Modal de edición
  const [modalVisible, setModalVisible] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [nuevaFecha, setNuevaFecha]   = useState('');   // YYYY-MM-DD
  const [nuevaHora, setNuevaHora]     = useState('');
  const [guardando, setGuardando]     = useState(false);

  // ── Buscar paciente por correo ─────────────────────────────────────────────
  const buscarPaciente = async () => {
    if (!correo.trim()) {
      Alert.alert('Campo vacío', 'Por favor ingresa un correo electrónico.');
      return;
    }

    setBuscando(true);
    setBuscado(false);
    setCitas([]);
    setPacienteNombre('');

    try {
      // 1. Buscar usuario por correo
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido1')
        .eq('correo', correo.trim().toLowerCase())
        .single();

      if (userError || !usuario) {
        Alert.alert('No encontrado', 'No existe un paciente registrado con ese correo.');
        setBuscado(true);
        setBuscando(false);
        return;
      }

      setPacienteNombre(`${usuario.nombre} ${usuario.apellido1}`);

      // 2. Buscar citas del paciente
      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select(`
          id, fecha, hora, estado, motivo,
          doctores!citas_id_doctor_fkey (
            especialidad,
            usuarios ( nombre, apellido1 )
          ),
          consultorios!citas_id_consultorio_fkey (
            numero
          )
        `)
        .eq('id_paciente', usuario.id)
        .order('fecha', { ascending: true })
        .order('hora',  { ascending: true });

      if (citasError) throw citasError;

      const formateadas = (citasData || []).map((c: any) => ({
        id:           c.id,
        fecha:        c.fecha,
        hora:         c.hora,
        estado:       c.estado,
        motivo:       c.motivo,
        doctor:       c.doctores?.usuarios
          ? `Dr. ${c.doctores.usuarios.nombre} ${c.doctores.usuarios.apellido1}`
          : 'Doctor no asignado',
        especialidad: c.doctores?.especialidad ?? '',
        consultorio:  c.consultorios?.numero ? `Consultorio #${c.consultorios.numero}` : 'Sin asignar',
      }));

      setCitas(formateadas);
      setBuscado(true);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Ocurrió un error al buscar. Intenta de nuevo.');
    } finally {
      setBuscando(false);
    }
  };

  // ── Abrir modal de edición ─────────────────────────────────────────────────
  const abrirEdicion = (cita: any) => {
    setCitaSeleccionada(cita);
    setNuevaFecha(cita.fecha);   // Formato YYYY-MM-DD
    setNuevaHora(cita.hora.substring(0, 5)); // HH:MM
    setModalVisible(true);
  };

  // ── Guardar cambios en Supabase ────────────────────────────────────────────
  const guardarCambios = async () => {
    if (!nuevaFecha || !nuevaHora) {
      Alert.alert('Campos incompletos', 'Por favor selecciona fecha y hora.');
      return;
    }

    // Validar formato de fecha YYYY-MM-DD
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(nuevaFecha)) {
      Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD (ej: 2025-12-31)');
      return;
    }

    // Validar que la fecha no sea en el pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaElegida = new Date(nuevaFecha + 'T00:00:00');
    if (fechaElegida < hoy) {
      Alert.alert('Fecha inválida', 'No puedes agendar en una fecha pasada.');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase
        .from('citas')
        .update({ fecha: nuevaFecha, hora: nuevaHora + ':00' })
        .eq('id', citaSeleccionada.id);

      if (error) throw error;

      // Actualizar localmente
      setCitas(prev => prev.map(c =>
        c.id === citaSeleccionada.id
          ? { ...c, fecha: nuevaFecha, hora: nuevaHora + ':00' }
          : c
      ));

      setModalVisible(false);
      Alert.alert('✅ Listo', `La cita fue reprogramada al ${formatFecha(nuevaFecha)} a las ${formatHora(nuevaHora + ':00')}.`);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar el cambio. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.headerTitle}>Gestionar Citas</Text>
              <Text style={styles.headerSub}>Busca al paciente y modifica su cita</Text>
            </View>
          </View>

          {/* Tarjeta de instrucción dentro del header */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.infoCardText}>
              Ingresa el correo del paciente para ver sus citas y poder cambiar la fecha u hora.
            </Text>
          </View>
        </View>

        {/* ── BUSCADOR ── */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Correo del paciente</Text>
          <View style={styles.searchRow}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#cbd5e1"
                value={correo}
                onChangeText={setCorreo}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="search"
                onSubmitEditing={buscarPaciente}
              />
              {correo.length > 0 && (
                <TouchableOpacity onPress={() => { setCorreo(''); setBuscado(false); setCitas([]); }}>
                  <Ionicons name="close-circle" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={buscarPaciente}
              disabled={buscando}
              activeOpacity={0.8}
            >
              {buscando
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="search" size={20} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── RESULTADOS ── */}
        {buscado && (
          <>
            {/* Nombre del paciente encontrado */}
            {pacienteNombre ? (
              <View style={styles.pacienteRow}>
                <View style={styles.pacienteAvatar}>
                  <Ionicons name="person" size={18} color={BLUE} />
                </View>
                <View>
                  <Text style={styles.pacienteLabel}>Paciente encontrado</Text>
                  <Text style={styles.pacienteNombre}>{pacienteNombre}</Text>
                </View>
                <View style={styles.citasBadge}>
                  <Text style={styles.citasBadgeText}>{citas.length} cita{citas.length !== 1 ? 's' : ''}</Text>
                </View>
              </View>
            ) : null}

            {/* Lista de citas */}
            <Text style={styles.sectionTitle}>
              {citas.length > 0 ? 'Citas del paciente' : 'Sin citas registradas'}
            </Text>

            {citas.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="calendar-outline" size={36} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>Sin citas</Text>
                <Text style={styles.emptyText}>Este paciente no tiene citas registradas.</Text>
              </View>
            ) : (
              citas.map((cita, index) => {
                const estadoCfg = ESTADO_CONFIG[cita.estado] ?? ESTADO_CONFIG['pendiente'];
                const esProxima = new Date(cita.fecha + 'T00:00:00') >= new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
                return (
                  <View key={cita.id} style={styles.citaCard}>
                    {/* Acento lateral */}
                    <View style={[styles.citaAccent, { backgroundColor: index === 0 && esProxima ? BLUE : '#93c5fd' }]} />

                    <View style={styles.citaBody}>
                      {/* Fila superior: doctor y estado */}
                      <View style={styles.citaTopRow}>
                        <Text style={styles.citaDoctor} numberOfLines={1}>{cita.doctor}</Text>
                        <View style={[styles.estadoBadge, { backgroundColor: estadoCfg.bg }]}>
                          <Text style={[styles.estadoText, { color: estadoCfg.color }]}>
                            {estadoCfg.label}
                          </Text>
                        </View>
                      </View>

                      {/* Especialidad */}
                      {cita.especialidad ? (
                        <Text style={styles.citaEspecialidad}>{cita.especialidad}</Text>
                      ) : null}

                      {/* Fecha y hora */}
                      <View style={styles.citaFechaRow}>
                        <Ionicons name="calendar-outline" size={13} color="#64748b" />
                        <Text style={styles.citaFechaText}>{formatFecha(cita.fecha)}</Text>
                        <Ionicons name="time-outline" size={13} color="#64748b" style={{ marginLeft: 8 }} />
                        <Text style={styles.citaFechaText}>{formatHora(cita.hora)}</Text>
                      </View>

                      {/* Consultorio y motivo */}
                      <Text style={styles.citaDetalle}>{cita.consultorio}</Text>
                      {cita.motivo ? (
                        <Text style={styles.citaMotivo} numberOfLines={1}>📝 {cita.motivo}</Text>
                      ) : null}

                      {/* Botón editar */}
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => abrirEdicion(cita)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="pencil-outline" size={15} color="#fff" />
                        <Text style={styles.editBtnText}>Cambiar fecha / hora</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL DE EDICIÓN ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar cita</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {citaSeleccionada && (
              <>
                {/* Info de la cita */}
                <View style={styles.modalCitaInfo}>
                  <Text style={styles.modalCitaDoctor}>{citaSeleccionada.doctor}</Text>
                  <Text style={styles.modalCitaActual}>
                    Actual: {formatFecha(citaSeleccionada.fecha)} a las {formatHora(citaSeleccionada.hora)}
                  </Text>
                </View>

                {/* Campo fecha */}
                <Text style={styles.modalLabel}>📅 Nueva fecha (AAAA-MM-DD)</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    value={nuevaFecha}
                    onChangeText={setNuevaFecha}
                    placeholder="2025-12-31"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />
                </View>

                {/* Selector de hora */}
                <Text style={styles.modalLabel}>🕐 Nueva hora</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horasContainer}
                >
                  {HORAS_DISPONIBLES.map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.horaChip, nuevaHora === h && styles.horaChipActive]}
                      onPress={() => setNuevaHora(h)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.horaChipText, nuevaHora === h && styles.horaChipTextActive]}>
                        {formatHora(h + ':00')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Resumen del cambio */}
                {nuevaFecha && nuevaHora && (
                  <View style={styles.resumenCambio}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={BLUE} />
                    <Text style={styles.resumenText}>
                      Nueva cita: {formatFecha(nuevaFecha)} a las {formatHora(nuevaHora + ':00')}
                    </Text>
                  </View>
                )}

                {/* Botones */}
                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={styles.cancelarModalBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelarModalText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.guardarBtn}
                    onPress={guardarCambios}
                    disabled={guardando}
                    activeOpacity={0.8}
                  >
                    {guardando
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.guardarText}>Guardar cambio</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const BLUE      = '#2563eb';
const BLUE_DARK = '#1a4fd6';

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f0f4ff' },
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
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
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

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  infoCardText: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19 },

  // ── Búsqueda ──
  searchSection: { paddingHorizontal: 22, marginBottom: 20 },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#1e293b',
    marginBottom: 10, paddingHorizontal: 22,
  },
  searchRow: { flexDirection: 'row', gap: 10 },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#e2e8f0',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 14, color: '#1e293b' },
  searchBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },

  // ── Paciente encontrado ──
  pacienteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', marginHorizontal: 22, marginBottom: 20,
    borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#dbeafe',
    ...Platform.select({
      ios:     { shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  pacienteAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center',
  },
  pacienteLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
  pacienteNombre: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 1 },
  citasBadge: {
    marginLeft: 'auto',
    backgroundColor: '#eff6ff', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  citasBadgeText: { fontSize: 12, fontWeight: '700', color: BLUE },

  // ── Tarjeta cita ──
  citaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 22, marginBottom: 12,
    borderRadius: 16, flexDirection: 'row', overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  citaAccent: { width: 4 },
  citaBody:   { flex: 1, padding: 14 },
  citaTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  citaDoctor: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b', marginRight: 8 },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  estadoText:  { fontSize: 11, fontWeight: '700' },
  citaEspecialidad: { fontSize: 12, color: '#64748b', marginBottom: 6, fontStyle: 'italic' },
  citaFechaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  citaFechaText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  citaDetalle:   { fontSize: 12, color: '#94a3b8', marginBottom: 3 },
  citaMotivo:    { fontSize: 12, color: '#64748b', marginBottom: 10 },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: BLUE,
    borderRadius: 10, paddingVertical: 9, marginTop: 4,
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── Empty state ──
  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 22 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  emptyText:  { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  // ── Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  modalCitaInfo: {
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 20,
  },
  modalCitaDoctor: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  modalCitaActual: { fontSize: 12, color: '#64748b' },

  modalLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  modalInputWrapper: {
    backgroundColor: '#f8fafc', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  modalInput: { height: 48, paddingHorizontal: 14, fontSize: 15, color: '#1e293b' },

  horasContainer: { gap: 8, paddingBottom: 4, marginBottom: 20 },
  horaChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  horaChipActive:     { backgroundColor: BLUE, borderColor: BLUE },
  horaChipText:       { fontSize: 13, fontWeight: '600', color: '#64748b' },
  horaChipTextActive: { color: '#fff' },

  resumenCambio: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginBottom: 20,
  },
  resumenText: { fontSize: 13, color: BLUE, fontWeight: '600', flex: 1 },

  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelarModalBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#f1f5f9',
  },
  cancelarModalText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  guardarBtn: {
    flex: 2, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', backgroundColor: BLUE,
    ...Platform.select({
      ios:     { shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  guardarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});