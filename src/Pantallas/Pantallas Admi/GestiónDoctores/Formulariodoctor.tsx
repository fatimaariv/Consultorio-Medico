import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabase/supabase';
import { DoctorConUsuario, DoctorFormData } from '../../../services/Doctoresadminservice';

// ─── Constantes ───────────────────────────────────────────────────────────────
const BLUE      = '#2563eb';
const GREEN     = '#16a34a';
const GREEN_BG  = '#dcfce7';
const RED       = '#dc2626';
const RED_BG    = '#fee2e2';
const ORANGE    = '#ea580c';
const ORANGE_BG = '#fff7ed';

const ESPECIALIDADES = [
  'Medicina General',
  'Pediatría',
  'Cardiología',
  'Dermatología',
  'Ginecología',
  'Neurología',
  'Oftalmología',
  'Ortopedia',
  'Psiquiatría',
  'Radiología',
  'Otra',
];

// Genera horas en intervalos de 30 min: ["07:00", "07:30", ..., "21:00"]
const HORAS: string[] = [];
for (let h = 7; h <= 21; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 21) HORAS.push(`${String(h).padStart(2, '0')}:30`);
}

// ─── Selector de hora (modal interno) ─────────────────────────────────────────
interface HoraSelectorProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function HoraSelector({ label, value, onChange }: HoraSelectorProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.selectorBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Ionicons name="time-outline" size={16} color={BLUE} />
        <Text style={styles.selectorBtnTexto}>{value}</Text>
        <Ionicons name="chevron-down" size={14} color="#64748b" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>{label}</Text>
            <FlatList
              data={HORAS}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, item === value && styles.modalItemActivo]}
                  onPress={() => { onChange(item); setOpen(false); }}
                >
                  <Text style={[styles.modalItemTexto, item === value && styles.modalItemTextoActivo]}>
                    {item}
                  </Text>
                  {item === value && <Ionicons name="checkmark" size={16} color={BLUE} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Selector de especialidad (modal interno) ──────────────────────────────────
interface EspSelectorProps {
  value: string;
  onChange: (v: string) => void;
}

function EspecialidadSelector({ value, onChange }: EspSelectorProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.selectorBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Ionicons name="medical-outline" size={16} color={BLUE} />
        <Text style={[styles.selectorBtnTexto, { flex: 1 }]}>{value || 'Selecciona especialidad'}</Text>
        <Ionicons name="chevron-down" size={14} color="#64748b" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>Selecciona especialidad</Text>
            <FlatList
              data={ESPECIALIDADES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, item === value && styles.modalItemActivo]}
                  onPress={() => { onChange(item); setOpen(false); }}
                >
                  <Text style={[styles.modalItemTexto, item === value && styles.modalItemTextoActivo]}>
                    {item}
                  </Text>
                  {item === value && <Ionicons name="checkmark" size={16} color={BLUE} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface UsuarioEncontrado {
  id: number;
  nombre: string;
  apellido1: string;
  correo: string;
}

interface Props {
  visible:       boolean;
  onClose:       () => void;
  onGuardar:     (data: DoctorFormData) => Promise<void>;
  doctorEditar?: DoctorConUsuario | null;
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function FormularioDoctor({ visible, onClose, onGuardar, doctorEditar }: Props) {
  const [especialidad,              setEspecialidad]              = useState('Medicina General');
  const [especialidadPersonalizada, setEspecialidadPersonalizada] = useState('');
  const [cedula,                    setCedula]                    = useState('');
  const [horaInicio,                setHoraInicio]                = useState('08:00');
  const [horaFin,                   setHoraFin]                   = useState('17:00');
  const [guardando,                 setGuardando]                 = useState(false);

  const [correo,            setCorreo]            = useState('');
  const [estadoCorreo,      setEstadoCorreo]      = useState<'idle' | 'buscando' | 'encontrado' | 'no_encontrado' | 'no_es_paciente'>('idle');
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<UsuarioEncontrado | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const esEdicion        = !!doctorEditar;
  const especialidadFinal = especialidad === 'Otra' ? especialidadPersonalizada : especialidad;

  // ── Inicializar formulario ──────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    if (doctorEditar) {
      const esp = ESPECIALIDADES.includes(doctorEditar.especialidad) ? doctorEditar.especialidad : 'Otra';
      setEspecialidad(esp);
      setEspecialidadPersonalizada(esp === 'Otra' ? doctorEditar.especialidad : '');
      setCedula(doctorEditar.cedula);
      setHoraInicio(doctorEditar.hora_inicio.slice(0, 5));
      setHoraFin(doctorEditar.hora_fin.slice(0, 5));
    } else {
      setCorreo('');
      setEstadoCorreo('idle');
      setUsuarioEncontrado(null);
      setEspecialidad('Medicina General');
      setEspecialidadPersonalizada('');
      setCedula('');
      setHoraInicio('08:00');
      setHoraFin('17:00');
    }
  }, [doctorEditar, visible]);

  // ── Buscar usuario por correo ───────────────────────────────────────────────
  useEffect(() => {
    if (esEdicion) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = correo.trim();
    if (!trimmed) {
      setEstadoCorreo('idle');
      setUsuarioEncontrado(null);
      return;
    }

    setEstadoCorreo('buscando');
    debounceRef.current = setTimeout(async () => {
      try {
        // 1. Buscar el usuario por correo
        const { data: usuario, error: errUsuario } = await supabase
          .from('usuarios')
          .select('id, nombre, apellido1, correo')
          .ilike('correo', trimmed)
          .limit(1)
          .single();

        if (errUsuario || !usuario) {
          setEstadoCorreo('no_encontrado');
          setUsuarioEncontrado(null);
          return;
        }

        // 2. Verificar que ese usuario existe en la tabla pacientes
        const { data: paciente, error: errPaciente } = await supabase
          .from('pacientes')
          .select('id')
          .eq('id', usuario.id)
          .single();

        if (errPaciente || !paciente) {
          // Existe en usuarios pero no es paciente → no puede convertirse en doctor
          setEstadoCorreo('no_es_paciente');
          setUsuarioEncontrado(null);
          return;
        }

        // 3. Todo OK: es un paciente válido
        setEstadoCorreo('encontrado');
        setUsuarioEncontrado(usuario as UsuarioEncontrado);
      } catch {
        setEstadoCorreo('no_encontrado');
        setUsuarioEncontrado(null);
      }
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [correo, esEdicion]);

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!esEdicion && estadoCorreo !== 'encontrado') {
      Alert.alert('Usuario no encontrado', 'Ingresa un correo registrado en el sistema.');
      return;
    }
    if (!esEdicion && !cedula.trim()) {
      Alert.alert('Campo requerido', 'Ingresa la cédula profesional.');
      return;
    }
    if (!especialidadFinal.trim()) {
      Alert.alert('Campo requerido', 'Selecciona o escribe la especialidad.');
      return;
    }
    if (horaFin <= horaInicio) {
      Alert.alert('Horario inválido', 'La hora de fin debe ser mayor que la de inicio.');
      return;
    }

    setGuardando(true);
    try {
      await onGuardar({
        id_usuario:   esEdicion ? doctorEditar!.id : usuarioEncontrado!.id,
        especialidad: especialidadFinal.trim(),
        cedula:       esEdicion ? doctorEditar!.cedula : cedula.trim(),
        hora_inicio:  horaInicio,
        hora_fin:     horaFin,
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  };

  // ── Colores del campo correo ────────────────────────────────────────────────
  const correoColor = () => {
    if (estadoCorreo === 'encontrado')     return GREEN;
    if (estadoCorreo === 'no_encontrado')  return RED;
    if (estadoCorreo === 'no_es_paciente') return ORANGE;
    return '#e2e8f0';
  };
  const correoBg = () => {
    if (estadoCorreo === 'encontrado')     return GREEN_BG;
    if (estadoCorreo === 'no_encontrado')  return RED_BG;
    if (estadoCorreo === 'no_es_paciente') return ORANGE_BG;
    return '#f8fafc';
  };
  const correoIcono = () => {
    if (estadoCorreo === 'buscando')       return <ActivityIndicator size="small" color={BLUE} />;
    if (estadoCorreo === 'encontrado')     return <Ionicons name="checkmark-circle" size={18} color={GREEN}  />;
    if (estadoCorreo === 'no_encontrado')  return <Ionicons name="close-circle"     size={18} color={RED}    />;
    if (estadoCorreo === 'no_es_paciente') return <Ionicons name="warning"          size={18} color={ORANGE} />;
    return null;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* KeyboardAvoidingView evita que el teclado tape el formulario */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>

            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.headerIconWrap, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name={esEdicion ? 'create-outline' : 'person-add-outline'} size={20} color={BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitulo}>
                  {esEdicion ? 'Editar doctor' : 'Registrar doctor'}
                </Text>
                <Text style={styles.headerSubtitulo}>
                  {esEdicion
                    ? 'Modifica el horario y especialidad del doctor'
                    : 'Busca al usuario por correo y completa sus datos'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.btnCerrar}>
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* keyboardShouldPersistTaps="handled" permite tocar los selectors sin cerrar teclado */}
            <ScrollView
              style={styles.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >

              {/* ── MODO EDICIÓN ── */}
              {esEdicion && (
                <>
                  <View style={styles.infoCard}>
                    <View style={styles.infoAvatar}>
                      <Text style={styles.infoAvatarTexto}>
                        {(doctorEditar?.usuario.nombre[0] ?? '') + (doctorEditar?.usuario.apellido1[0] ?? '')}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.infoNombre}>
                        {doctorEditar?.usuario.nombre} {doctorEditar?.usuario.apellido1}
                      </Text>
                      <Text style={styles.infoCorreo}>{doctorEditar?.usuario.correo}</Text>
                    </View>
                  </View>

                  <View style={styles.campo}>
                    <Text style={styles.label}>
                      <Ionicons name="card-outline" size={13} color="#64748b" /> Cédula profesional
                    </Text>
                    <View style={styles.inputReadonlyWrap}>
                      <Ionicons name="lock-closed-outline" size={14} color="#94a3b8" style={{ marginRight: 8 }} />
                      <Text style={styles.inputReadonlyText}>{doctorEditar?.cedula}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* ── MODO REGISTRO ── */}
              {!esEdicion && (
                <>
                  <View style={styles.campo}>
                    <Text style={styles.label}>
                      <Ionicons name="mail-outline" size={13} color="#64748b" /> Correo del usuario
                    </Text>
                    <View style={[styles.inputIconWrap, {
                      borderColor: correoColor(),
                      backgroundColor: correoBg(),
                    }]}>
                      <TextInput
                        style={[styles.inputInner, {
                          color: estadoCorreo === 'encontrado'
                            ? GREEN
                            : estadoCorreo === 'no_encontrado'
                            ? RED
                            : estadoCorreo === 'no_es_paciente'
                            ? ORANGE
                            : '#1e293b',
                        }]}
                        value={correo}
                        onChangeText={setCorreo}
                        placeholder="usuario@correo.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                      />
                      <View style={{ marginLeft: 8 }}>{correoIcono()}</View>
                    </View>

                    {estadoCorreo === 'encontrado' && usuarioEncontrado && (
                      <View style={styles.usuarioChip}>
                        <View style={styles.usuarioChipAvatar}>
                          <Text style={styles.usuarioChipAvatarTxt}>
                            {usuarioEncontrado.nombre[0]}{usuarioEncontrado.apellido1[0]}
                          </Text>
                        </View>
                        <Text style={styles.usuarioChipNombre}>
                          {usuarioEncontrado.nombre} {usuarioEncontrado.apellido1}
                        </Text>
                        <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                      </View>
                    )}

                    {estadoCorreo === 'no_encontrado' && (
                      <Text style={styles.errorMsg}>
                        No se encontró ningún usuario con ese correo
                      </Text>
                    )}

                    {estadoCorreo === 'no_es_paciente' && (
                      <View style={styles.warningChip}>
                        <Ionicons name="warning-outline" size={14} color={ORANGE} />
                        <Text style={styles.warningMsg}>
                          Este usuario no tiene perfil de paciente. Solo los pacientes pueden convertirse en doctores.
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.campo}>
                    <Text style={styles.label}>
                      <Ionicons name="card-outline" size={13} color="#64748b" /> Cédula profesional
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={cedula}
                      onChangeText={setCedula}
                      placeholder="Ej. 1234567"
                      placeholderTextColor="#94a3b8"
                      returnKeyType="done"
                    />
                  </View>
                </>
              )}

              {/* ── Especialidad ── selector personalizado (funciona en iOS y Android) */}
              <View style={styles.campo}>
                <Text style={styles.label}>
                  <Ionicons name="medical-outline" size={13} color="#64748b" /> Especialidad
                </Text>
                <EspecialidadSelector value={especialidad} onChange={setEspecialidad} />
                {especialidad === 'Otra' && (
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    value={especialidadPersonalizada}
                    onChangeText={setEspecialidadPersonalizada}
                    placeholder="Escribe la especialidad"
                    placeholderTextColor="#94a3b8"
                    returnKeyType="done"
                  />
                )}
              </View>

              {/* ── Horario ── selectores visuales en vez de TextInput libre */}
              <View style={styles.campo}>
                <Text style={styles.label}>
                  <Ionicons name="time-outline" size={13} color="#64748b" /> Horario de atención
                </Text>
                <View style={styles.filaHorario}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.sublabel}>Inicio</Text>
                    <HoraSelector label="Hora de inicio" value={horaInicio} onChange={setHoraInicio} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.sublabel}>Fin</Text>
                    <HoraSelector label="Hora de fin" value={horaFin} onChange={setHoraFin} />
                  </View>
                </View>
                {horaFin <= horaInicio && (
                  <Text style={styles.errorMsg}>
                    La hora de fin debe ser mayor que la de inicio
                  </Text>
                )}
              </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.btnCancelar} onPress={onClose}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnGuardar, guardando && { opacity: 0.65 }]}
                onPress={handleGuardar}
                disabled={guardando}
                activeOpacity={0.8}
              >
                {guardando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name={esEdicion ? 'checkmark-outline' : 'person-add-outline'} size={16} color="#fff" />
                      <Text style={styles.btnGuardarTexto}>
                        {esEdicion ? 'Guardar cambios' : 'Registrar doctor'}
                      </Text>
                    </>
                }
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingHorizontal: 22, paddingVertical: 16,
  },
  headerIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitulo:    { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  headerSubtitulo: { fontSize: 12, color: '#64748b', marginTop: 2 },
  btnCerrar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 22 },
  body: { paddingHorizontal: 22, paddingTop: 20 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 14, padding: 14, marginBottom: 20,
  },
  infoAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#dbeafe',
    alignItems: 'center', justifyContent: 'center',
  },
  infoAvatarTexto: { fontSize: 15, fontWeight: '700', color: BLUE },
  infoNombre:      { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  infoCorreo:      { fontSize: 12, color: '#64748b', marginTop: 2 },

  inputReadonlyWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 11, backgroundColor: '#f1f5f9',
  },
  inputReadonlyText: { fontSize: 14, color: '#94a3b8', flex: 1 },

  campo:    { marginBottom: 16 },
  label:    { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  sublabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 11, fontSize: 14,
    color: '#1e293b', backgroundColor: '#f8fafc',
  },

  inputIconWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 2,
  },
  inputInner: { flex: 1, fontSize: 14, paddingVertical: 9 },

  usuarioChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GREEN_BG,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginTop: 8,
  },
  usuarioChipAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#86efac',
    alignItems: 'center', justifyContent: 'center',
  },
  usuarioChipAvatarTxt: { fontSize: 11, fontWeight: '700', color: GREEN },
  usuarioChipNombre:    { flex: 1, fontSize: 13, fontWeight: '600', color: '#166534' },

  errorMsg: { fontSize: 12, color: RED, marginTop: 6 },

  warningChip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: ORANGE_BG,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginTop: 8,
  },
  warningMsg: { fontSize: 12, color: ORANGE, flex: 1, lineHeight: 17 },

  filaHorario: { flexDirection: 'row' },

  // Botón selector (hora y especialidad)
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  selectorBtnTexto: { fontSize: 14, fontWeight: '600', color: '#1e293b' },

  // Modal selector
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalSheet: {
    backgroundColor: '#fff', borderRadius: 20,
    width: '78%', paddingTop: 20, paddingBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.15,
    shadowRadius: 20, elevation: 10,
  },
  modalTitulo: {
    fontSize: 14, fontWeight: '700', color: '#1e293b',
    textAlign: 'center', marginBottom: 12, paddingHorizontal: 16,
  },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  modalItemActivo:      { backgroundColor: '#eff6ff' },
  modalItemTexto:       { fontSize: 15, color: '#374151' },
  modalItemTextoActivo: { fontWeight: '700', color: BLUE },

  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 22, paddingTop: 16,
  },
  btnCancelar: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  btnCancelarTexto: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  btnGuardar: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: BLUE,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnGuardarTexto: { fontSize: 14, fontWeight: '700', color: '#fff' },
});