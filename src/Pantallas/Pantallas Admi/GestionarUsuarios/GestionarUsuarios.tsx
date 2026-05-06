import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../supabase/supabase';
import { Ionicons } from '@expo/vector-icons';

// ─── Constantes (idénticas a AdmiHome) ───────────────────────────────────────
const BLUE      = '#2563eb';
const BLUE_DARK = '#1a4fd6';

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────
type UsuarioRow = {
  id: number;
  nombre: string;
  apellido1: string;
  apellido2: string | null;
  correo: string;
  contrasena: string;
  telefono: string | null;
  genero: string;
  id_rol: number;
};

type PacienteRow = {
  id: number;
  fecha_nacimiento: string;
  enfermedades: string;
};

type PacienteCompleto = UsuarioRow & PacienteRow;

// ──────────────────────────────────────────────
// Componente auxiliar: campo de formulario
// ──────────────────────────────────────────────
function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.campoContainer}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        style={[
          styles.campoInput,
          multiline && styles.campoInputMultiline,
          !editable && styles.campoInputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        editable={editable}
        autoCapitalize="none"
      />
    </View>
  );
}

// ──────────────────────────────────────────────
// Pantalla principal
// ──────────────────────────────────────────────
export default function GestionarUsuarios() {
  const [correoBusqueda, setCorreoBusqueda] = useState('');
  const [buscando, setBuscando]             = useState(false);
  const [guardando, setGuardando]           = useState(false);
  const [paciente, setPaciente]             = useState<PacienteCompleto | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    correo: '',
    telefono: '',
    genero: '',
    fecha_nacimiento: '',
    enfermedades: '',
  });

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  const buscarPaciente = async () => {
    if (!correoBusqueda.trim()) {
      Alert.alert('Campo vacío', 'Ingresa el correo del paciente.');
      return;
    }
    Keyboard.dismiss();
    setBuscando(true);
    setPaciente(null);

    try {
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correoBusqueda.trim().toLowerCase())
        .single();

      if (errorUsuario || !usuario) {
        Alert.alert('No encontrado', 'No existe un usuario con ese correo.');
        return;
      }

      const { data: pacienteData, error: errorPaciente } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', usuario.id)
        .single();

      if (errorPaciente || !pacienteData) {
        Alert.alert('No es paciente', 'El usuario encontrado no está registrado como paciente.');
        return;
      }

      const completo: PacienteCompleto = { ...usuario, ...pacienteData };
      setPaciente(completo);
      setForm({
        nombre:           completo.nombre,
        apellido1:        completo.apellido1,
        apellido2:        completo.apellido2 ?? '',
        correo:           completo.correo,
        telefono:         completo.telefono ?? '',
        genero:           completo.genero,
        fecha_nacimiento: completo.fecha_nacimiento,
        enfermedades:     completo.enfermedades,
      });
    } catch (e) {
      Alert.alert('Error', 'Ocurrió un error inesperado.');
      console.error(e);
    } finally {
      setBuscando(false);
    }
  };

  // ── Guardar cambios ───────────────────────────────────────────────────────
  const guardarCambios = async () => {
    if (!paciente) return;
    Keyboard.dismiss();

    if (!form.nombre.trim() || !form.apellido1.trim() || !form.correo.trim()) {
      Alert.alert('Campos requeridos', 'Nombre, primer apellido y correo son obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      const { error: errorUsuario } = await supabase
        .from('usuarios')
        .update({
          nombre:    form.nombre.trim(),
          apellido1: form.apellido1.trim(),
          apellido2: form.apellido2.trim() || null,
          correo:    form.correo.trim().toLowerCase(),
          telefono:  form.telefono.trim() || null,
          genero:    form.genero.trim(),
        })
        .eq('id', paciente.id);

      if (errorUsuario) throw errorUsuario;

      const { error: errorPaciente } = await supabase
        .from('pacientes')
        .update({
          fecha_nacimiento: form.fecha_nacimiento.trim(),
          enfermedades:     form.enfermedades.trim(),
        })
        .eq('id', paciente.id);

      if (errorPaciente) throw errorPaciente;

      setPaciente((prev) =>
        prev ? {
          ...prev,
          nombre:           form.nombre.trim(),
          apellido1:        form.apellido1.trim(),
          apellido2:        form.apellido2.trim() || null,
          correo:           form.correo.trim().toLowerCase(),
          telefono:         form.telefono.trim() || null,
          genero:           form.genero.trim(),
          fecha_nacimiento: form.fecha_nacimiento.trim(),
          enfermedades:     form.enfermedades.trim(),
        } : prev
      );

      Alert.alert('Éxito', 'Los datos del paciente han sido actualizados correctamente.');
    } catch (e: any) {
      Alert.alert('Error al guardar', e?.message ?? 'No se pudieron guardar los cambios.');
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── HEADER (mismo estilo que AdmiHome) ── */}
            <View style={styles.header}>
              <View style={styles.headerBubble1} />
              <View style={styles.headerBubble2} />

              <View style={styles.headerTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logoText}>Medi Track · Admin</Text>
                  <Text style={styles.headerTitle}>Gestionar Pacientes</Text>
                  <Text style={styles.headerSubtitle}>
                    Busca por correo para consultar y editar datos.
                  </Text>
                </View>
                <View style={[styles.headerIconWrap]}>
                  <Ionicons name="people-outline" size={28} color="rgba(255,255,255,0.85)" />
                </View>
              </View>
            </View>

            {/* ── BUSCADOR ── */}
            <Text style={styles.sectionTitle}>Buscar paciente</Text>

            <View style={styles.card}>
              <View style={styles.buscadorRow}>
                <View style={styles.buscadorInputWrap}>
                  <Ionicons name="mail-outline" size={16} color="#94a3b8" style={styles.buscadorIcon} />
                  <TextInput
                    style={styles.buscadorInput}
                    value={correoBusqueda}
                    onChangeText={setCorreoBusqueda}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="search"
                    onSubmitEditing={buscarPaciente}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.botonBuscar, buscando && styles.botonDeshabilitado]}
                  onPress={buscarPaciente}
                  disabled={buscando}
                >
                  {buscando
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Ionicons name="search" size={18} color="#fff" />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* ── FORMULARIO ── */}
            {paciente && (
              <>
                {/* Chip de ID */}
                <View style={styles.pacienteChip}>
                  <Ionicons name="person-circle-outline" size={16} color={BLUE} />
                  <Text style={styles.pacienteChipText}>
                    Paciente #{paciente.id} · {paciente.nombre} {paciente.apellido1}
                  </Text>
                </View>

                {/* Grupo: Información personal */}
                <Text style={styles.sectionTitle}>Datos del paciente</Text>

                <View style={styles.card}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupIconWrap, { backgroundColor: '#dbeafe' }]}>
                      <Ionicons name="person-outline" size={16} color={BLUE} />
                    </View>
                    <Text style={styles.groupLabel}>Información personal</Text>
                  </View>
                  <Campo label="Nombre"                   value={form.nombre}           onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))} />
                  <Campo label="Primer apellido"          value={form.apellido1}        onChangeText={(t) => setForm((f) => ({ ...f, apellido1: t }))} />
                  <Campo label="Segundo apellido (opcional)" value={form.apellido2}     onChangeText={(t) => setForm((f) => ({ ...f, apellido2: t }))} />
                  <Campo label="Género"                   value={form.genero}           onChangeText={(t) => setForm((f) => ({ ...f, genero: t }))}           placeholder="Ej. Masculino, Femenino, Otro" />
                  <Campo label="Fecha de nacimiento"      value={form.fecha_nacimiento} onChangeText={(t) => setForm((f) => ({ ...f, fecha_nacimiento: t }))} placeholder="YYYY-MM-DD" />
                </View>

                {/* Grupo: Contacto */}
                <View style={[styles.card, { marginTop: 12 }]}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupIconWrap, { backgroundColor: '#fce7f3' }]}>
                      <Ionicons name="call-outline" size={16} color="#db2777" />
                    </View>
                    <Text style={styles.groupLabel}>Contacto</Text>
                  </View>
                  <Campo label="Correo electrónico" value={form.correo}   onChangeText={(t) => setForm((f) => ({ ...f, correo: t }))}   keyboardType="email-address" />
                  <Campo label="Teléfono (opcional)" value={form.telefono} onChangeText={(t) => setForm((f) => ({ ...f, telefono: t }))} keyboardType="phone-pad" />
                </View>

                {/* Grupo: Historial médico */}
                <View style={[styles.card, { marginTop: 12 }]}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupIconWrap, { backgroundColor: '#d1fae5' }]}>
                      <Ionicons name="medkit-outline" size={16} color="#059669" />
                    </View>
                    <Text style={styles.groupLabel}>Historial médico</Text>
                  </View>
                  <Campo
                    label="Enfermedades"
                    value={form.enfermedades}
                    onChangeText={(t) => setForm((f) => ({ ...f, enfermedades: t }))}
                    placeholder="Ej. Diabetes tipo 2, Hipertensión"
                    multiline
                  />
                </View>

                {/* Botón guardar */}
                <TouchableOpacity
                  style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
                  onPress={guardarCambios}
                  disabled={guardando}
                  activeOpacity={0.85}
                >
                  {guardando ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.botonGuardarTexto}>Guardar cambios</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4ff' },
  flex:     { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Header (mismo patrón que AdmiHome) ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: 18,
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 18,
  },
  headerIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    marginLeft: 12, marginTop: 18,
  },

  // ── Sección ──
  sectionTitle: {
    fontSize: 17, fontWeight: 'bold', color: '#1e293b',
    paddingHorizontal: 22, marginBottom: 12,
  },

  // ── Card genérica (mismo shadow que AdmiHome) ──
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 22,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // ── Buscador ──
  buscadorRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  buscadorInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#dbe8ff',
    paddingHorizontal: 12,
  },
  buscadorIcon: { marginRight: 8 },
  buscadorInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1e293b',
  },
  botonBuscar: {
    backgroundColor: BLUE,
    borderRadius: 12,
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  // ── Chip de paciente encontrado ──
  pacienteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dbeafe',
    marginHorizontal: 22,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  pacienteChipText: {
    fontSize: 13, fontWeight: '600', color: BLUE,
  },

  // ── Grupos dentro del formulario ──
  groupHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  groupIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  groupLabel: {
    fontSize: 14, fontWeight: '700', color: '#1e293b',
  },

  // ── Campo de formulario ──
  campoContainer: { marginBottom: 12 },
  campoLabel: {
    fontSize: 12, color: '#64748b', fontWeight: '600',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  campoInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  campoInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  campoInputDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
  },

  // ── Botón guardar ──
  botonGuardar: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 15,
    marginHorizontal: 22,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  botonGuardarTexto: {
    color: '#fff', fontSize: 16, fontWeight: '700',
  },
  botonDeshabilitado: { opacity: 0.6 },
});