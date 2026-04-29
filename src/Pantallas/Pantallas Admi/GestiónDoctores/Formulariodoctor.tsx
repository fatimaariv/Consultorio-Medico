import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { DoctorConUsuario, DoctorFormData, UsuarioPaciente } from '../../../services/Doctoresadminservice';
 
// ─── Constantes (igual que AdmiHome) ─────────────────────────────────────────
const BLUE      = '#2563eb';
const BLUE_DARK = '#1a4fd6';
 
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
 
// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  visible:       boolean;
  onClose:       () => void;
  onGuardar:     (data: DoctorFormData) => Promise<void>;
  doctorEditar?: DoctorConUsuario | null;
  pacientes:     UsuarioPaciente[];
}
 
// ─── Componente ───────────────────────────────────────────────────────────────
export default function FormularioDoctor({ visible, onClose, onGuardar, doctorEditar, pacientes }: Props) {
  const [idUsuario,    setIdUsuario]    = useState<number | null>(null);
  const [especialidad, setEspecialidad] = useState('Medicina General');
  const [cedula,       setCedula]       = useState('');
  const [horaInicio,   setHoraInicio]   = useState('08:00');
  const [horaFin,      setHoraFin]      = useState('17:00');
  const [guardando,    setGuardando]    = useState(false);
 
  const esEdicion = !!doctorEditar;
 
  useEffect(() => {
    if (doctorEditar) {
      setEspecialidad(doctorEditar.especialidad);
      setCedula(doctorEditar.cedula);
      setHoraInicio(doctorEditar.hora_inicio.slice(0, 5));
      setHoraFin(doctorEditar.hora_fin.slice(0, 5));
    } else {
      setIdUsuario(pacientes.length > 0 ? pacientes[0].id : null);
      setEspecialidad('Medicina General');
      setCedula('');
      setHoraInicio('08:00');
      setHoraFin('17:00');
    }
  }, [doctorEditar, visible]);
 
  const validarHora = (h: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(h);
 
  const handleGuardar = async () => {
    if (!esEdicion && !idUsuario) {
      Alert.alert('Campo requerido', 'Selecciona un usuario.');
      return;
    }
    if (!cedula.trim()) {
      Alert.alert('Campo requerido', 'Ingresa la cédula profesional.');
      return;
    }
    if (!validarHora(horaInicio) || !validarHora(horaFin)) {
      Alert.alert('Formato inválido', 'Usa formato HH:MM (ej. 08:00).');
      return;
    }
    setGuardando(true);
    try {
      await onGuardar({
        id_usuario:   esEdicion ? doctorEditar!.id : idUsuario!,
        especialidad,
        cedula:       cedula.trim(),
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
 
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
                  ? 'Modifica la información del especialista'
                  : 'Promueve un paciente al rol de doctor'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnCerrar}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
 
          <View style={styles.divider} />
 
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
 
            {/* Info del doctor en edición */}
            {esEdicion && (
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
            )}
 
            {/* Selector de usuario (solo creación) */}
            {!esEdicion && (
              <View style={styles.campo}>
                <Text style={styles.label}>
                  <Ionicons name="person-outline" size={13} color="#64748b" /> Usuario a promover
                </Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={idUsuario}
                    onValueChange={(v) => setIdUsuario(Number(v))}
                    style={styles.picker}
                    dropdownIconColor="#64748b"
                  >
                    {pacientes.map((p) => (
                      <Picker.Item
                        key={p.id}
                        value={p.id}
                        label={`${p.nombre} ${p.apellido1} · ${p.correo}`}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}
 
            {/* Especialidad */}
            <View style={styles.campo}>
              <Text style={styles.label}>
                <Ionicons name="medical-outline" size={13} color="#64748b" /> Especialidad
              </Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={especialidad}
                  onValueChange={setEspecialidad}
                  style={styles.picker}
                  dropdownIconColor="#64748b"
                >
                  {ESPECIALIDADES.map((e) => (
                    <Picker.Item key={e} label={e} value={e} />
                  ))}
                </Picker>
              </View>
            </View>
 
            {/* Cédula */}
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
                keyboardType="default"
              />
            </View>
 
            {/* Horario */}
            <View style={styles.filaHorario}>
              <View style={[styles.campo, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>
                  <Ionicons name="time-outline" size={13} color="#64748b" /> Hora inicio
                </Text>
                <TextInput
                  style={styles.input}
                  value={horaInicio}
                  onChangeText={setHoraInicio}
                  placeholder="08:00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View style={[styles.campo, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>
                  <Ionicons name="time-outline" size={13} color="#64748b" /> Hora fin
                </Text>
                <TextInput
                  style={styles.input}
                  value={horaFin}
                  onChangeText={setHoraFin}
                  placeholder="17:00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
 
            <View style={{ height: 16 }} />
          </ScrollView>
 
          {/* Footer botones */}
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
    maxHeight: '88%',
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
  headerTitulo:   { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  headerSubtitulo:{ fontSize: 12, color: '#64748b', marginTop: 2 },
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
  infoNombre:  { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  infoCorreo:  { fontSize: 12, color: '#64748b', marginTop: 2 },
 
  campo:      { marginBottom: 16 },
  label:      { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 11, fontSize: 14,
    color: '#1e293b', backgroundColor: '#f8fafc',
  },
  pickerWrap: {
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  picker: { height: 48, color: '#1e293b' },
  filaHorario: { flexDirection: 'row' },
 
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