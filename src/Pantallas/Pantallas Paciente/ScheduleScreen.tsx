import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar, Animated
} from 'react-native';
import { supabase } from '../../supabase/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Doctor = {
  id: string;
  nombre: string;
  especialidad: string;
  hora_inicio: string;
  hora_fin: string;
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  // ── Handlers de fecha / hora ─────────────────────────────────────────────
  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, fecha: formattedDate }));
    }
  };

  const onTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, hora: `${hours}:${minutes}` }));
    }
  };

  // ── Fetch doctores ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDoctores();
  }, []);

  const fetchDoctores = async () => {
    try {
      setLoading(true);

      // ✅ FIX: join correcto — doctores.id === usuarios.id (no cedula)
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

  // ── Seleccionar doctor ────────────────────────────────────────────────────
  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setFormData(prev => ({
      ...prev,
      id_doctor: doc.id,
      especialidad: doc.especialidad,
    }));
    setDropdownOpen(false);
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

      const { error } = await supabase.from('citas').insert([{
        id_doctor: Number(formData.id_doctor),
        id_paciente: Number(userData.id),
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo,
        estado: 'pendiente',
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
                    {doc.hora_inicio}–{doc.hora_fin}
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

        {/* ── Fecha y Hora ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha y Hora</Text>
          <View style={styles.row}>
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

            <TouchableOpacity
              style={[styles.dateTimeBtn, formData.hora && styles.dateTimeBtnFilled]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dateTimeIcon}>🕐</Text>
              <View>
                <Text style={styles.dateTimeLabelSmall}>Hora</Text>
                <Text style={formData.hora ? styles.dateTimeValue : styles.dateTimePlaceholder}>
                  {formData.hora || 'Seleccionar'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
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
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            is24Hour={true}
            onChange={onTimeChange}
          />
        )}

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

  // Date/Time
  row: { flexDirection: 'row', gap: 12 },
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