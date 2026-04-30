import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { supabase } from '../../../supabase/supabase'; // ajusta la ruta según tu proyecto

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
        placeholderTextColor="#9CA3AF"
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
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [paciente, setPaciente] = useState<PacienteCompleto | null>(null);

  // Campos editables del formulario
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

  // ── Búsqueda ──────────────────────────────────
  const buscarPaciente = async () => {
    if (!correoBusqueda.trim()) {
      Alert.alert('Campo vacío', 'Ingresa el correo del paciente.');
      return;
    }
    Keyboard.dismiss();
    setBuscando(true);
    setPaciente(null);

    try {
      // 1. Buscar en usuarios por correo y rol de paciente
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correoBusqueda.trim().toLowerCase())
        .single();

      if (errorUsuario || !usuario) {
        Alert.alert('No encontrado', 'No existe un usuario con ese correo.');
        return;
      }

      // 2. Buscar datos del paciente
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
        nombre: completo.nombre,
        apellido1: completo.apellido1,
        apellido2: completo.apellido2 ?? '',
        correo: completo.correo,
        telefono: completo.telefono ?? '',
        genero: completo.genero,
        fecha_nacimiento: completo.fecha_nacimiento,
        enfermedades: completo.enfermedades,
      });
    } catch (e) {
      Alert.alert('Error', 'Ocurrió un error inesperado.');
      console.error(e);
    } finally {
      setBuscando(false);
    }
  };

  // ── Guardar cambios ───────────────────────────
  const guardarCambios = async () => {
    if (!paciente) return;
    Keyboard.dismiss();

    if (!form.nombre.trim() || !form.apellido1.trim() || !form.correo.trim()) {
      Alert.alert('Campos requeridos', 'Nombre, primer apellido y correo son obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      // Actualizar tabla usuarios
      const { error: errorUsuario } = await supabase
        .from('usuarios')
        .update({
          nombre: form.nombre.trim(),
          apellido1: form.apellido1.trim(),
          apellido2: form.apellido2.trim() || null,
          correo: form.correo.trim().toLowerCase(),
          telefono: form.telefono.trim() || null,
          genero: form.genero.trim(),
        })
        .eq('id', paciente.id);

      if (errorUsuario) throw errorUsuario;

      // Actualizar tabla pacientes
      const { error: errorPaciente } = await supabase
        .from('pacientes')
        .update({
          fecha_nacimiento: form.fecha_nacimiento.trim(),
          enfermedades: form.enfermedades.trim(),
        })
        .eq('id', paciente.id);

      if (errorPaciente) throw errorPaciente;

      // Refrescar estado local
      setPaciente((prev) =>
        prev
          ? {
              ...prev,
              nombre: form.nombre.trim(),
              apellido1: form.apellido1.trim(),
              apellido2: form.apellido2.trim() || null,
              correo: form.correo.trim().toLowerCase(),
              telefono: form.telefono.trim() || null,
              genero: form.genero.trim(),
              fecha_nacimiento: form.fecha_nacimiento.trim(),
              enfermedades: form.enfermedades.trim(),
            }
          : prev
      );

      Alert.alert('Éxito', 'Los datos del paciente han sido actualizados correctamente.');
    } catch (e: any) {
      Alert.alert('Error al guardar', e?.message ?? 'No se pudieron guardar los cambios.');
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* KeyboardAvoidingView evita que el teclado tape los campos */}
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
            {/* Encabezado */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Gestionar Paciente</Text>
              <Text style={styles.headerSubtitle}>
                Busca al paciente por correo electrónico para consultar y editar sus datos.
              </Text>
            </View>

            {/* Buscador */}
            <View style={styles.buscadorCard}>
              <Text style={styles.sectionTitle}>Buscar paciente</Text>
              <View style={styles.buscadorRow}>
                <TextInput
                  style={styles.buscadorInput}
                  value={correoBusqueda}
                  onChangeText={setCorreoBusqueda}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={buscarPaciente}
                />
                <TouchableOpacity
                  style={[styles.botonBuscar, buscando && styles.botonDeshabilitado]}
                  onPress={buscarPaciente}
                  disabled={buscando}
                >
                  {buscando ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.botonBuscarTexto}>Buscar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Formulario de edición */}
            {paciente && (
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Datos del paciente</Text>
                <Text style={styles.pacienteId}>ID: #{paciente.id}</Text>

                {/* Datos personales */}
                <Text style={styles.groupLabel}>Información personal</Text>
                <Campo
                  label="Nombre"
                  value={form.nombre}
                  onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))}
                />
                <Campo
                  label="Primer apellido"
                  value={form.apellido1}
                  onChangeText={(t) => setForm((f) => ({ ...f, apellido1: t }))}
                />
                <Campo
                  label="Segundo apellido (opcional)"
                  value={form.apellido2}
                  onChangeText={(t) => setForm((f) => ({ ...f, apellido2: t }))}
                />
                <Campo
                  label="Género"
                  value={form.genero}
                  onChangeText={(t) => setForm((f) => ({ ...f, genero: t }))}
                  placeholder="Ej. Masculino, Femenino, Otro"
                />
                <Campo
                  label="Fecha de nacimiento"
                  value={form.fecha_nacimiento}
                  onChangeText={(t) => setForm((f) => ({ ...f, fecha_nacimiento: t }))}
                  placeholder="YYYY-MM-DD"
                />

                {/* Contacto */}
                <Text style={styles.groupLabel}>Contacto</Text>
                <Campo
                  label="Correo electrónico"
                  value={form.correo}
                  onChangeText={(t) => setForm((f) => ({ ...f, correo: t }))}
                  keyboardType="email-address"
                />
                <Campo
                  label="Teléfono (opcional)"
                  value={form.telefono}
                  onChangeText={(t) => setForm((f) => ({ ...f, telefono: t }))}
                  keyboardType="phone-pad"
                />

                {/* Historial médico */}
                <Text style={styles.groupLabel}>Historial médico</Text>
                <Campo
                  label="Enfermedades"
                  value={form.enfermedades}
                  onChangeText={(t) => setForm((f) => ({ ...f, enfermedades: t }))}
                  placeholder="Ej. Diabetes tipo 2, Hipertensión"
                  multiline
                />

                {/* Botón guardar */}
                <TouchableOpacity
                  style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
                  onPress={guardarCambios}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.botonGuardarTexto}>Guardar cambios</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
// Estilos
// ──────────────────────────────────────────────
const AZUL = '#2563EB';
const AZUL_CLARO = '#EFF6FF';
const GRIS_BORDE = '#E5E7EB';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Cards
  buscadorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Títulos de sección
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AZUL,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  pacienteId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: -8,
  },

  // Buscador
  buscadorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buscadorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: GRIS_BORDE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  botonBuscar: {
    backgroundColor: AZUL,
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  botonBuscarTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // Campo de formulario
  campoContainer: {
    marginBottom: 12,
  },
  campoLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  campoInput: {
    borderWidth: 1,
    borderColor: GRIS_BORDE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  campoInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  campoInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },

  // Botón guardar
  botonGuardar: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  botonGuardarTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
});