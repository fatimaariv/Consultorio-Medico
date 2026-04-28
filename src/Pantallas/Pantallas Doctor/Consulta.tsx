import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, SafeAreaView,
  StatusBar, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase/supabase';

// ─── Tipos ──────────────────────────────────────────────────────────────────
type FormData = {
  peso: string;
  estatura: string;
  presion: string;
  temperatura: string;
  sintomas: string;
  diagnostico: string;
  tratamiento: string;
  notas: string;
};

// ─── Componente ─────────────────────────────────────────────────────────────
export default function Consulta({ route, navigation }: any) {
  const {
    citaId,
    nombrePaciente,
    motivo,
    hora,
    estado,
    idDoctor,
  } = route.params || {};

  const [idPaciente, setIdPaciente] = useState<number | null>(null);
  const [loadingPaciente, setLoadingPaciente] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormData>({
    peso: '',
    estatura: '',
    presion: '',
    temperatura: '',
    sintomas: '',
    diagnostico: '',
    tratamiento: '',
    notas: '',
  });

  // ── Obtener id_paciente desde la cita ────────────────────────────────────
  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const { data, error } = await supabase
          .from('citas')
          .select('id_paciente')
          .eq('id', citaId)
          .single();

        if (error || !data) throw new Error('No se pudo obtener el paciente de la cita.');
        setIdPaciente(data.id_paciente);
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        setLoadingPaciente(false);
      }
    };

    if (citaId) fetchPaciente();
  }, [citaId]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ── Validación básica ────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!form.peso || isNaN(Number(form.peso))) return 'Ingresa un peso válido.';
    if (!form.estatura || isNaN(Number(form.estatura))) return 'Ingresa una estatura válida.';
    if (!form.presion.trim()) return 'Ingresa la presión arterial.';
    if (!form.temperatura || isNaN(Number(form.temperatura))) return 'Ingresa una temperatura válida.';
    if (!form.sintomas.trim()) return 'Describe los síntomas.';
    if (!form.diagnostico.trim()) return 'Escribe el diagnóstico.';
    if (!form.tratamiento.trim()) return 'Escribe el tratamiento.';
    return null;
  };

  // ── Guardar consulta y marcar cita como completada ───────────────────────
  const handleGuardar = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Campos incompletos', error);
      return;
    }
    if (!idPaciente || !idDoctor || !citaId) {
      Alert.alert('Error', 'Faltan datos de la cita. Regresa e intenta de nuevo.');
      return;
    }

    Alert.alert(
      'Confirmar consulta',
      '¿Deseas guardar la consulta y marcar la cita como terminada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          style: 'default',
          onPress: async () => {
            setSaving(true);
            try {
              // 1. Insertar la consulta
              const { error: consultaError } = await supabase
                .from('consultas')
                .insert([{
                  id_cita: citaId,
                  id_doctor: idDoctor,
                  id_paciente: idPaciente,
                  fecha: new Date().toISOString().split('T')[0],
                  peso: parseFloat(form.peso),
                  estatura: parseFloat(form.estatura),
                  presion: form.presion.trim(),
                  temperatura: parseFloat(form.temperatura),
                  sintomas: form.sintomas.trim(),
                  diagnostico: form.diagnostico.trim(),
                  tratamiento: form.tratamiento.trim(),
                  notas: form.notas.trim() || null,
                }]);

              if (consultaError) throw consultaError;

              // 2. Actualizar estado de la cita a 'completada'
              const { error: citaError } = await supabase
                .from('citas')
                .update({ estado: 'terminada' })
                .eq('id', citaId);

              if (citaError) throw citaError;

              Alert.alert('✅ Consulta registrada', 'La cita quedó marcada como terminada.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Error al guardar', err.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // ── Loading paciente ─────────────────────────────────────────────────────
  if (loadingPaciente) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Cargando datos de la cita...</Text>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View style={styles.headerBubble1} />
            <View style={styles.headerBubble2} />

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
              <Text style={styles.backText}>Regresar</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Consulta Médica</Text>
            <Text style={styles.headerSubtitle}>Registro de datos clínicos</Text>

            {/* Info card de la cita */}
            <View style={styles.citaInfoCard}>
              <View style={styles.citaInfoRow}>
                <Ionicons name="person-circle-outline" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.citaInfoText}>{nombrePaciente || 'Paciente'}</Text>
              </View>
              <View style={styles.citaInfoDivider} />
              <View style={styles.citaInfoRow}>
                <Ionicons name="document-text-outline" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.citaInfoText} numberOfLines={1}>{motivo || '—'}</Text>
              </View>
              <View style={styles.citaInfoDivider} />
              <View style={styles.citaInfoRow}>
                <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.citaInfoText}>{hora || '—'} hrs</Text>
              </View>
            </View>
          </View>

          {/* ── SECCIÓN: SIGNOS VITALES ── */}
          <SectionTitle icon="pulse-outline" label="Signos Vitales" />

          <View style={styles.rowGap}>
            <Field
              label="Peso"
              unit="kg"
              icon="scale-outline"
              placeholder="00.0"
              value={form.peso}
              onChangeText={v => handleChange('peso', v)}
              keyboardType="numeric"
              flex
            />
            <Field
              label="Estatura"
              unit="cm"
              icon="body-outline"
              placeholder="000"
              value={form.estatura}
              onChangeText={v => handleChange('estatura', v)}
              keyboardType="numeric"
              flex
            />
          </View>

          <View style={styles.rowGap}>
            <Field
              label="Presión Arterial"
              unit="mmHg"
              icon="heart-outline"
              placeholder="120/80"
              value={form.presion}
              onChangeText={v => handleChange('presion', v)}
              flex
            />
            <Field
              label="Temperatura"
              unit="°C"
              icon="thermometer-outline"
              placeholder="36.6"
              value={form.temperatura}
              onChangeText={v => handleChange('temperatura', v)}
              keyboardType="numeric"
              flex
            />
          </View>

          {/* ── SECCIÓN: CLÍNICO ── */}
          <SectionTitle icon="medkit-outline" label="Evaluación Clínica" />

          <Field
            label="Síntomas"
            icon="alert-circle-outline"
            placeholder="Describe los síntomas del paciente..."
            value={form.sintomas}
            onChangeText={v => handleChange('sintomas', v)}
            multiline
          />

          <Field
            label="Diagnóstico"
            icon="clipboard-outline"
            placeholder="Diagnóstico médico..."
            value={form.diagnostico}
            onChangeText={v => handleChange('diagnostico', v)}
            multiline
          />

          <Field
            label="Tratamiento"
            icon="medical-outline"
            placeholder="Indicaciones y medicamentos..."
            value={form.tratamiento}
            onChangeText={v => handleChange('tratamiento', v)}
            multiline
          />

          <Field
            label="Notas adicionales"
            icon="chatbubble-ellipses-outline"
            placeholder="Observaciones opcionales..."
            value={form.notas}
            onChangeText={v => handleChange('notas', v)}
            multiline
            optional
          />

          {/* ── BOTÓN GUARDAR ── */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleGuardar}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Finalizar y guardar consulta</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={17} color={BLUE} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

type FieldProps = {
  label: string;
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  unit?: string;
  keyboardType?: any;
  multiline?: boolean;
  flex?: boolean;
  optional?: boolean;
};

function Field({ label, icon, placeholder, value, onChangeText, unit, keyboardType, multiline, flex, optional }: FieldProps) {
  return (
    <View style={[styles.fieldWrap, flex && { flex: 1 }]}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon} size={13} color={BLUE} />
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional && <Text style={styles.fieldOptional}>· opcional</Text>}
      </View>
      <View style={[styles.inputWrap, multiline && styles.inputWrapMulti]}>
        <TextInput
          style={[styles.input, multiline && styles.inputMulti]}
          placeholder={placeholder}
          placeholderTextColor="#b0bec5"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'auto'}
        />
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const BLUE = '#2563eb';
const BLUE_DARK = '#1a4fd6';

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 15 },
  scrollContent: { paddingBottom: 20 },

  // ── Header ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 12 : 18,
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
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 16, alignSelf: 'flex-start',
  },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 18 },

  // Cita info card en el header
  citaInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row', alignItems: 'center',
    gap: 10,
  },
  citaInfoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  citaInfoDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.2)' },
  citaInfoText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600', flex: 1 },

  // ── Sección ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, marginBottom: 12, marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#1e293b',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // ── Fields ──
  rowGap: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 22, marginBottom: 0,
  },
  fieldWrap: { marginHorizontal: 22, marginBottom: 12 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldOptional: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },

  inputWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#dbe8ff',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapMulti: { alignItems: 'flex-start' },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#1e293b',
  },
  inputMulti: { height: 90, paddingTop: 13 },
  unit: {
    paddingRight: 12, fontSize: 12,
    color: '#94a3b8', fontWeight: '600',
  },

  // ── Botón guardar ──
  saveBtn: {
    marginHorizontal: 22,
    marginTop: 28,
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});