import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { supabase } from '../../supabase/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Doctor = {
  id: string;
  nombre: string;
  especialidad: string;
  hora_inicio: string;
  hora_fin: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte "HH:MM" o "HH:MM:SS" a minutos desde medianoche */
const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Genera slots de 30 min entre hora_inicio y hora_fin del doctor.
 * Devuelve strings "HH:MM".
 */
const generateSlots = (hora_inicio: string, hora_fin: string): string[] => {
  const slots: string[] = [];
  let current = timeToMinutes(hora_inicio);
  const end = timeToMinutes(hora_fin);
  while (current < end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += 30;
  }
  return slots;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ScheduleScreen({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctoresDB, setDoctoresDB] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_doctor: '',
    especialidad: '',
    fecha: '',
    hora: '',
    motivo: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  // Slots generados y ocupados
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Consultorio asignado (preview en resumen y usado al insertar)
  const [consultorioAsignado, setConsultorioAsignado] = useState<{ id: number; numero: string } | null>(null);

  // ── Handlers de fecha ────────────────────────────────────────────────────
  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      // Usar partes locales para evitar que toISOString() desfase la fecha por UTC
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      setFormData(prev => ({ ...prev, fecha: formattedDate, hora: '' }));
    }
  };

  // ── Fetch doctores ────────────────────────────────────────────────────────
  useFocusEffect(
  useCallback(() => {
    fetchDoctores();
  }, [])
);

  const fetchDoctores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctores')
        .select(`
          id,
          cedula,
          especialidad,
          hora_inicio,
          hora_fin,
          usuarios!doctores_id_fkey (
            nombre,
            apellido1,
            apellido2
          )
        `);

      if (error) throw error;

      const formateados: Doctor[] = (data || []).map((doc: any) => {
        const u = doc.usuarios;
        const nombre = u
          ? `${u.nombre} ${u.apellido1}${u.apellido2 ? ' ' + u.apellido2 : ''}`
          : `Dr. (Cédula: ${doc.cedula})`;
        return {
          id: doc.id.toString(),
          nombre,
          especialidad: doc.especialidad,
          hora_inicio: doc.hora_inicio,
          hora_fin: doc.hora_fin,
        };
      });

      setDoctoresDB(formateados);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los médicos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Recalcular slots cuando cambia doctor o fecha ────────────────────────
  useEffect(() => {
    if (selectedDoctor && formData.fecha) {
      fetchOccupiedSlots(selectedDoctor, formData.fecha);
    } else {
      setAllSlots([]);
      setOccupiedSlots([]);
    }
    // Limpiar hora seleccionada y consultorio cuando cambia doctor o fecha
    setFormData(prev => ({ ...prev, hora: '' }));
    setConsultorioAsignado(null);
  }, [selectedDoctor, formData.fecha]);

  const fetchOccupiedSlots = async (doctor: Doctor, fecha: string) => {
    try {
      setLoadingSlots(true);

      // Generar todos los slots del horario del doctor
      const slots = generateSlots(doctor.hora_inicio, doctor.hora_fin);
      setAllSlots(slots);

      // Consultar citas ya existentes para ese doctor y fecha
      const { data, error } = await supabase
        .from('citas')
        .select('hora')
        .eq('id_doctor', Number(doctor.id))
        .eq('fecha', fecha);

      if (error) throw error;

      // Normalizar a "HH:MM" (la BD puede devolver "HH:MM:SS")
      const ocupadas = (data || []).map((c: any) => c.hora.slice(0, 5));
      setOccupiedSlots(ocupadas);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo verificar disponibilidad: ' + error.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ── Seleccionar doctor ────────────────────────────────────────────────────
  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setFormData(prev => ({
      ...prev,
      id_doctor: doc.id,
      especialidad: doc.especialidad,
      hora: '',
    }));
    setDropdownOpen(false);
  };

  // ── Asignar consultorio disponible ───────────────────────────────────────
  /**
   * Consulta la tabla `citas` para saber qué consultorios ya están ocupados
   * en la fecha+hora exacta solicitada. De los consultorios con estado
   * 'disponible' que NO aparezcan ocupados en ese slot, elige uno al azar.
   * Si la cita anterior fue a las 09:00 y la nueva es a las 10:00, el
   * consultorio de las 09:00 ya está libre y puede reasignarse.
   */
  const asignarConsultorio = async (
    fecha: string,
    hora: string,
  ): Promise<{ id: number; numero: string } | null> => {
    try {
      // 1. Obtener todos los consultorios disponibles
      const { data: consultorios, error: errC } = await supabase
        .from('consultorios')
        .select('id, numero')
        .eq('estado', 'disponible');

      if (errC || !consultorios || consultorios.length === 0) return null;

      // 2. Ver qué consultorios tienen cita en ese slot exacto (misma fecha y hora)
      const { data: citasSlot, error: errCitas } = await supabase
        .from('citas')
        .select('id_consultorio')
        .eq('fecha', fecha)
        .eq('hora', hora)
        .not('id_consultorio', 'is', null);

      if (errCitas) return null;

      const ocupadosEnSlot = new Set<number>(
        (citasSlot || []).map((c: any) => c.id_consultorio),
      );

      // 3. Filtrar los libres en ese slot
      const libres = consultorios.filter((c: any) => !ocupadosEnSlot.has(c.id));
      if (libres.length === 0) return null;

      // 4. Elegir uno al azar
      return libres[Math.floor(Math.random() * libres.length)] as { id: number; numero: string };
    } catch {
      return null;
    }
  };

  // ── Crear cita ────────────────────────────────────────────────────────────
  const handleCreateAppointment = async () => {
    if (!formData.id_doctor || !formData.fecha || !formData.hora || !formData.motivo) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    const userEmail = session?.user?.email;
    if (!userEmail) {
      Alert.alert('Error', 'No se encontró una sesión activa.');
      return;
    }

    try {
      setSubmitting(true);

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('correo', userEmail)
        .single();

      if (userError || !userData) throw new Error('No se pudo identificar tu usuario.');

      // Doble-check: verificar que el slot siga libre justo antes de insertar
      const { data: conflicto } = await supabase
        .from('citas')
        .select('id')
        .eq('id_doctor', Number(formData.id_doctor))
        .eq('fecha', formData.fecha)
        .eq('hora', formData.hora)
        .maybeSingle();

      if (conflicto) {
        Alert.alert('Horario no disponible', 'Ese horario acaba de ser tomado. Por favor elige otro.');
        if (selectedDoctor) fetchOccupiedSlots(selectedDoctor, formData.fecha);
        setFormData(prev => ({ ...prev, hora: '' }));
        setConsultorioAsignado(null);
        return;
      }

      // Usar el consultorio ya asignado en el preview (mismo que se muestra al usuario)
      const { error } = await supabase.from('citas').insert([{
        id_doctor: Number(formData.id_doctor),
        id_paciente: Number(userData.id),
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo,
        estado: 'pendiente',
        id_consultorio: consultorioAsignado?.id ?? null,
      }]);

      if (error) throw error;

      Alert.alert('¡Cita confirmada!', 'Tu cita fue programada exitosamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando médicos...</Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1d4ed8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Nueva Cita</Text>
          <Text style={styles.headerSub}>Programa tu consulta médica</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Selección de médico ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médico</Text>

          <TouchableOpacity
            style={[styles.dropdownTrigger, dropdownOpen && styles.dropdownTriggerOpen]}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            activeOpacity={0.8}
          >
            {selectedDoctor ? (
              <View style={styles.doctorPreview}>
                <View style={styles.doctorAvatar}>
                  <Text style={styles.doctorAvatarText}>
                    {selectedDoctor.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorPreviewName}>Dr. {selectedDoctor.nombre}</Text>
                  <Text style={styles.doctorPreviewSpec}>{selectedDoctor.especialidad}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.dropdownPlaceholder}>Seleccione un médico...</Text>
            )}
            <Text style={[styles.dropdownArrow, dropdownOpen && { transform: [{ rotate: '180deg' }] }]}>
              ▾
            </Text>
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownList}>
              {doctoresDB.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.dropdownItem,
                    selectedDoctor?.id === doc.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleSelectDoctor(doc)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.doctorAvatar,
                    selectedDoctor?.id === doc.id && styles.doctorAvatarSelected
                  ]}>
                    <Text style={styles.doctorAvatarText}>
                      {doc.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownItemName}>Dr. {doc.nombre}</Text>
                    <Text style={styles.dropdownItemSpec}>{doc.especialidad}</Text>
                  </View>
                  <Text style={styles.dropdownItemHours}>
                    {doc.hora_inicio.slice(0, 5)}–{doc.hora_fin.slice(0, 5)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Especialidad (auto) ── */}
        {formData.especialidad ? (
          <View style={styles.specialtyBadgeRow}>
            <View style={styles.specialtyBadge}>
              <Text style={styles.specialtyBadgeText}>🩺 {formData.especialidad}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Fecha ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha</Text>
          <TouchableOpacity
            style={[styles.dateTimeBtn, formData.fecha && styles.dateTimeBtnFilled]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dateTimeIcon}>📅</Text>
            <View>
              <Text style={styles.dateTimeLabelSmall}>Fecha</Text>
              <Text style={formData.fecha ? styles.dateTimeValue : styles.dateTimePlaceholder}>
                {formData.fecha
                  ? new Date(formData.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })
                  : 'Seleccionar'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* ── Slots de hora ── */}
        {selectedDoctor && formData.fecha ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hora disponible</Text>

            {loadingSlots ? (
              <View style={styles.slotsLoading}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.slotsLoadingText}>Verificando disponibilidad...</Text>
              </View>
            ) : allSlots.length === 0 ? (
              <Text style={styles.slotsEmpty}>No hay horarios configurados para este médico.</Text>
            ) : (
              <>
                <View style={styles.slotsGrid}>
                  {allSlots.map((slot) => {
                    const occupied = occupiedSlots.includes(slot);
                    const selected = formData.hora === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotBtn,
                          selected && styles.slotBtnSelected,
                          occupied && styles.slotBtnOccupied,
                        ]}
                        onPress={async () => {
                          if (!occupied) {
                            setFormData(prev => ({ ...prev, hora: slot }));
                            setConsultorioAsignado(null);
                            const c = await asignarConsultorio(formData.fecha, slot);
                            setConsultorioAsignado(c);
                          }
                        }}
                        activeOpacity={occupied ? 1 : 0.75}
                        disabled={occupied}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            selected && styles.slotTextSelected,
                            occupied && styles.slotTextOccupied,
                          ]}
                        >
                          {slot}
                        </Text>
                        {occupied && <Text style={styles.slotOccupiedLabel}>Ocupado</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Leyenda */}
                <View style={styles.slotsLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                    <Text style={styles.legendText}>Seleccionado</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#e5e7eb' }]} />
                    <Text style={styles.legendText}>Disponible</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#fecaca' }]} />
                    <Text style={styles.legendText}>Ocupado</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        ) : selectedDoctor && !formData.fecha ? (
          <View style={styles.slotsHint}>
            <Text style={styles.slotsHintText}>📅 Selecciona una fecha para ver los horarios disponibles</Text>
          </View>
        ) : !selectedDoctor && formData.fecha ? (
          <View style={styles.slotsHint}>
            <Text style={styles.slotsHintText}>👨‍⚕️ Selecciona un médico para ver los horarios disponibles</Text>
          </View>
        ) : null}

        {/* ── Motivo ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo de consulta</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Describe brevemente tus síntomas o el motivo de la consulta..."
            placeholderTextColor="#9ca3af"
            value={formData.motivo}
            onChangeText={(t) => setFormData(prev => ({ ...prev, motivo: t }))}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{formData.motivo.length} caracteres</Text>
        </View>

        {/* ── Resumen rápido ── */}
        {formData.id_doctor && formData.fecha && formData.hora ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen de tu cita</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>👨‍⚕️</Text>
              <Text style={styles.summaryText}>Dr. {selectedDoctor?.nombre}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>📅</Text>
              <Text style={styles.summaryText}>
                {new Date(formData.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>🕐</Text>
              <Text style={styles.summaryText}>{formData.hora} hrs</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>🏥</Text>
              <Text style={styles.summaryText}>
                {consultorioAsignado
                  ? `Consultorio ${consultorioAsignado.numero}`
                  : 'Buscando consultorio...'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Botones ── */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleCreateAppointment}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitBtnText}>Confirmar Cita</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const BLUE = '#2563eb';
const BLUE_DARK = '#1d4ed8';
const BLUE_LIGHT = '#eff6ff';
const BLUE_BORDER = '#bfdbfe';

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc',
  },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 15 },

  // Header
  header: {
    backgroundColor: BLUE_DARK,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow: { color: 'white', fontSize: 20, lineHeight: 22 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },

  // Scroll
  scrollContent: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Sections
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Dropdown
  dropdownTrigger: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownTriggerOpen: { borderColor: BLUE },
  dropdownPlaceholder: { color: '#9ca3af', fontSize: 15, flex: 1 },
  dropdownArrow: { color: '#6b7280', fontSize: 18, marginLeft: 8 },

  dropdownList: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: BLUE_BORDER,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: { backgroundColor: BLUE_LIGHT },
  dropdownItemName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  dropdownItemSpec: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  dropdownItemHours: { fontSize: 11, color: '#9ca3af' },

  // Doctor preview inside trigger
  doctorPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  doctorPreviewName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  doctorPreviewSpec: { fontSize: 13, color: '#6b7280', marginTop: 1 },

  // Avatar
  doctorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  doctorAvatarSelected: { backgroundColor: BLUE },
  doctorAvatarText: { color: BLUE, fontWeight: '700', fontSize: 16 },

  // Specialty badge
  specialtyBadgeRow: { marginTop: -10, marginBottom: 20 },
  specialtyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BLUE_LIGHT,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BLUE_BORDER,
  },
  specialtyBadgeText: { color: BLUE, fontWeight: '600', fontSize: 13 },

  // Date button
  dateTimeBtn: {
    flex: 1, backgroundColor: 'white',
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  dateTimeBtnFilled: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  dateTimeIcon: { fontSize: 22 },
  dateTimeLabelSmall: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' },
  dateTimePlaceholder: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  dateTimeValue: { fontSize: 14, color: '#1f2937', fontWeight: '600', marginTop: 2 },

  // ── Slots grid ──
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  slotBtnSelected: {
    backgroundColor: BLUE,
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  slotBtnOccupied: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    opacity: 0.7,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  slotTextSelected: { color: 'white' },
  slotTextOccupied: { color: '#f87171', fontSize: 12 },
  slotOccupiedLabel: {
    fontSize: 9,
    color: '#f87171',
    marginTop: 2,
    fontWeight: '500',
  },

  // Slots loading / empty / hint
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  slotsLoadingText: { color: '#6b7280', fontSize: 14 },
  slotsEmpty: { color: '#9ca3af', fontSize: 14, fontStyle: 'italic' },
  slotsHint: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BLUE_BORDER,
  },
  slotsHintText: { color: '#1e40af', fontSize: 13, fontWeight: '500' },

  // Leyenda
  slotsLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6b7280' },

  // TextArea
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1f2937',
    minHeight: 100,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  charCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 6 },

  // Summary card
  summaryCard: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: BLUE_BORDER,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 13, fontWeight: '700', color: BLUE,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  summaryIcon: { fontSize: 16 },
  summaryText: { fontSize: 14, color: '#1e40af', fontWeight: '500', flex: 1 },

  // Buttons
  submitBtn: {
    backgroundColor: BLUE,
    borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 12,
    shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: 'white', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});