import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { consultoriosService } from '../../../services/consultoriosService';

// ─── Solo Disponible y Mantenimiento son opciones manuales ────────────────────
const ESTADO_OPTIONS = [
  {
    value: 'disponible',
    label: 'Disponible',
    icon: 'checkmark-circle-outline' as const,
    color: '#10b981',
    bg: '#ecfdf5',
    description: 'Quedan espacios para citas',
  },
  {
    value: 'mantenimiento',
    label: 'Mantenimiento',
    icon: 'construct-outline' as const,
    color: '#ef4444',
    bg: '#fef2f2',
    description: 'Fuera de servicio temporalmente',
  },
];

const DIAS_ES  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatFecha(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Etiqueta legible: "Lun 12 May" */
function labelFechaLarga(date: Date): string {
  return `${DIAS_ES[date.getDay()]} ${date.getDate()} ${MESES_ES[date.getMonth()]}`;
}

type DiaInfo = {
  fecha: string;
  label: string;         // "Hoy" | "Mar 13 May" …
  fechaLarga: string;    // para el mensaje "Ocupado para el día …"
  libre: number;
  total: number;
  estado: 'disponible' | 'ocupado' | 'mantenimiento';
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ConsultorioModal({
  visible,
  onClose,
  onSave,
  consultorioEditando,
}: any) {
  const [numero,        setNumero]        = useState('');
  const [estado,        setEstado]        = useState('disponible');
  const [loading,       setLoading]       = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingDias,   setLoadingDias]   = useState(false);
  const [error,         setError]         = useState('');
  const [diasInfo,      setDiasInfo]      = useState<DiaInfo[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaInfo | null>(null);

  // Estado real del consultorio (tras sincronización con el sistema)
  const [estadoReal, setEstadoReal] = useState<string>(consultorioEditando?.estado ?? 'disponible');

  useEffect(() => {
    if (!visible) return;

    setNumero(consultorioEditando?.numero ?? '');
    setError('');
    setDiaSeleccionado(null);
    setDiasInfo([]);

    if (consultorioEditando?.id) {
      cargarYSincronizar(consultorioEditando.id);
    } else {
      // Nuevo consultorio: estado por defecto
      setEstadoReal('disponible');
      setEstado('disponible');
    }
  }, [visible, consultorioEditando]);

  /**
   * 1. Sincroniza el estado en Supabase según la agenda de hoy.
   * 2. Carga la disponibilidad de los próximos 5 días (hoy + 4).
   */
  const cargarYSincronizar = async (idConsultorio: number) => {
    setLoadingDias(true);
    try {
      // Sincronización automática: puede cambiar 'disponible' ↔ 'ocupado'
      const consultorioActualizado = await consultoriosService.sincronizarUno(idConsultorio);
      const estadoSync = consultorioActualizado.estado;
      setEstadoReal(estadoSync);

      // Si el estado es ocupado, la selección del usuario se fija en 'disponible'
      // (no mostramos 'ocupado' como opción manual)
      setEstado(estadoSync === 'ocupado' ? 'disponible' : estadoSync);

      // Carga predictiva: hoy + 4 días
      const hoy  = new Date();
      const dias: DiaInfo[] = [];

      for (let i = 0; i < 5; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        const fechaStr   = formatFecha(fecha);
        const labelCorto = i === 0 ? 'Hoy' : `${DIAS_ES[fecha.getDay()]} ${fecha.getDate()} ${MESES_ES[fecha.getMonth()]}`;
        const fechaLarga = i === 0 ? 'hoy' : labelFechaLarga(fecha);

        if (estadoSync === 'mantenimiento') {
          dias.push({
            fecha: fechaStr, label: labelCorto, fechaLarga,
            libre: 0, total: consultoriosService.TOTAL_SLOTS,
            estado: 'mantenimiento',
          });
        } else {
          const horasLibres = await consultoriosService.getHorasDisponibles(idConsultorio, fechaStr);
          const libre       = horasLibres.length;
          const total       = consultoriosService.TOTAL_SLOTS;
          dias.push({
            fecha: fechaStr, label: labelCorto, fechaLarga,
            libre, total,
            estado: libre === 0 ? 'ocupado' : 'disponible',
          });
        }
      }

      setDiasInfo(dias);
      setDiaSeleccionado(dias[0]);
    } catch (e) {
      console.error('Error cargando disponibilidad:', e);
    } finally {
      setLoadingDias(false);
    }
  };

  const isEditing = !!consultorioEditando;
  const isOcupado = estadoReal === 'ocupado';

  const handleSave = async () => {
    if (!numero.trim()) {
      setError('El número de consultorio es obligatorio.');
      return;
    }
    // Garantiza que nunca se persiste 'ocupado' manualmente
    const estadoAGuardar = (estado === 'ocupado' ? 'disponible' : estado) as 'disponible' | 'mantenimiento';

    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await consultoriosService.update(consultorioEditando.id, numero.trim(), estadoAGuardar);
      } else {
        await consultoriosService.create(numero.trim(), estadoAGuardar);
      }
      onSave();
      onClose();
    } catch (e) {
      setError('Ocurrió un error al guardar. Intenta de nuevo.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar consultorio',
      `¿Estás seguro de que deseas eliminar el Consultorio ${consultorioEditando?.numero}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            setLoadingDelete(true);
            try {
              await consultoriosService.delete(consultorioEditando.id);
              onSave();
              onClose();
            } catch (e) {
              setError('No se pudo eliminar el consultorio. Intenta de nuevo.');
              console.error(e);
            } finally {
              setLoadingDelete(false);
            }
          },
        },
      ]
    );
  };

  const getColorDia = (d: DiaInfo) => {
    if (d.estado === 'mantenimiento') return '#ef4444';
    if (d.estado === 'ocupado')       return '#f59e0b';
    const pct = d.libre / d.total;
    return pct > 0.5 ? '#10b981' : '#f59e0b';
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Ionicons
                  name={isEditing ? 'create-outline' : 'add-circle-outline'}
                  size={20}
                  color="#0ea5e9"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isEditing ? 'Editar Consultorio' : 'Nuevo Consultorio'}
                </Text>
                <Text style={styles.headerSub}>
                  {isEditing
                    ? `Consultorio #${consultorioEditando.numero}`
                    : 'Ingresa los datos del consultorio'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Número ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Número de consultorio</Text>
              <View style={[styles.inputWrap, isEditing && styles.inputDisabled]}>
                <Ionicons name="business-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  placeholder="Ej. 101, A-3, Piso 2…"
                  value={numero}
                  onChangeText={(t) => { setNumero(t); setError(''); }}
                  style={[styles.input, isEditing && { color: '#94a3b8' }]}
                  placeholderTextColor="#94a3b8"
                  editable={!isEditing}
                  returnKeyType="done"
                />
              </View>
              {isEditing && (
                <Text style={styles.fieldHint}>El número no puede modificarse una vez creado.</Text>
              )}
            </View>

            {/* ── Disponibilidad predictiva (solo al editar) ── */}
            {isEditing && (
              <View style={styles.fieldGroup}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="calendar-outline" size={15} color="#0ea5e9" />
                  <Text style={styles.sectionTitle}>Disponibilidad — próximos 5 días</Text>
                </View>

                {loadingDias ? (
                  <View style={styles.loadingDias}>
                    <ActivityIndicator size="small" color="#0ea5e9" />
                    <Text style={styles.loadingDiasText}>Calculando disponibilidad…</Text>
                  </View>
                ) : (
                  <>
                    {/* Timeline / tabs de días */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.diasScroll}
                    >
                      {diasInfo.map((dia) => {
                        const isSelected = diaSeleccionado?.fecha === dia.fecha;
                        const color = getColorDia(dia);
                        return (
                          <TouchableOpacity
                            key={dia.fecha}
                            style={[
                              styles.diaTab,
                              isSelected && { borderColor: color, backgroundColor: color + '18' },
                            ]}
                            onPress={() => setDiaSeleccionado(dia)}
                            activeOpacity={0.75}
                          >
                            <View style={[styles.diaTabDot, { backgroundColor: color }]} />
                            <Text style={[
                              styles.diaTabLabel,
                              isSelected && { color, fontWeight: '700' },
                            ]}>
                              {dia.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Detalle del día seleccionado */}
                    {diaSeleccionado && (
                      <View style={styles.diaDetalle}>
                        {diaSeleccionado.estado === 'mantenimiento' ? (
                          <View style={styles.diaDetalleRow}>
                            <View style={[styles.diaDetalleIconWrap, { backgroundColor: '#fef2f2' }]}>
                              <Ionicons name="construct" size={18} color="#ef4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.diaDetalleEstado, { color: '#ef4444' }]}>
                                En mantenimiento
                              </Text>
                              <Text style={styles.diaDetalleHint}>
                                El consultorio no atiende este día.
                              </Text>
                            </View>
                          </View>

                        ) : diaSeleccionado.estado === 'ocupado' ? (
                          <View style={styles.diaDetalleRow}>
                            <View style={[styles.diaDetalleIconWrap, { backgroundColor: '#fffbeb' }]}>
                              <Ionicons name="time" size={18} color="#f59e0b" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.diaDetalleEstado, { color: '#f59e0b' }]}>
                                Ocupado para el día {diaSeleccionado.fechaLarga}
                              </Text>
                              <Text style={styles.diaDetalleHint}>
                                Los {diaSeleccionado.total} horarios del día ya están reservados.
                              </Text>
                            </View>
                          </View>

                        ) : (
                          <View style={styles.diaDetalleRow}>
                            <View style={[styles.diaDetalleIconWrap, { backgroundColor: '#ecfdf5' }]}>
                              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.diaDetalleEstado, { color: '#10b981' }]}>
                                Disponible
                              </Text>
                              <Text style={styles.diaDetalleHint}>
                                {diaSeleccionado.libre} de {diaSeleccionado.total} horarios libres
                              </Text>
                              {/* Barra de ocupación */}
                              <View style={styles.barRow}>
                                <View style={styles.barBg}>
                                  <View
                                    style={[
                                      styles.barFill,
                                      {
                                        width: `${((diaSeleccionado.total - diaSeleccionado.libre) / diaSeleccionado.total) * 100}%` as any,
                                        backgroundColor: getColorDia(diaSeleccionado),
                                      },
                                    ]}
                                  />
                                </View>
                                <Text style={styles.barPct}>
                                  {Math.round(((diaSeleccionado.total - diaSeleccionado.libre) / diaSeleccionado.total) * 100)}% ocupado
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* ── Estado manual ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {isEditing ? 'Cambiar estado' : 'Estado inicial'}
              </Text>

              {/* Aviso informativo cuando el sistema marcó como Ocupado */}
              {isEditing && isOcupado && (
                <View style={styles.ocupadoNotice}>
                  <Ionicons name="information-circle-outline" size={15} color="#f59e0b" />
                  <Text style={styles.ocupadoNoticeText}>
                    Este consultorio está{' '}
                    <Text style={{ fontWeight: '700' }}>Ocupado</Text> porque no
                    quedan horarios libres hoy. El sistema lo actualizará
                    automáticamente cuando se libere un espacio.
                  </Text>
                </View>
              )}

              {isEditing && !isOcupado && (
                <Text style={[styles.fieldHint, { marginBottom: 12 }]}>
                  Puedes cambiar entre{' '}
                  <Text style={{ fontWeight: '600' }}>Disponible</Text> y{' '}
                  <Text style={{ fontWeight: '600' }}>Mantenimiento</Text>.
                  El estado{' '}
                  <Text style={{ fontWeight: '600' }}>Ocupado</Text> lo gestiona
                  el sistema automáticamente según la agenda.
                </Text>
              )}

              {/* Grid de opciones — oculto cuando el sistema dice Ocupado */}
              {!isOcupado && (
                <View style={styles.estadoGrid}>
                  {ESTADO_OPTIONS.map((opt) => {
                    const active = estado === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.estadoCard,
                          active && { borderColor: opt.color, backgroundColor: opt.bg },
                        ]}
                        onPress={() => setEstado(opt.value)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.estadoIconWrap, { backgroundColor: active ? opt.color : '#f1f5f9' }]}>
                          <Ionicons name={opt.icon} size={18} color={active ? '#fff' : '#94a3b8'} />
                        </View>
                        <Text style={[styles.estadoLabel, active && { color: opt.color }]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.estadoDesc}>{opt.description}</Text>
                        {active && (
                          <View style={[styles.estadoCheck, { backgroundColor: opt.color }]}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Eliminar */}
            {isEditing && (
              <TouchableOpacity
                style={[styles.btnDelete, loadingDelete && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={loadingDelete}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={loadingDelete ? 'hourglass-outline' : 'trash-outline'}
                  size={16}
                  color="#ef4444"
                />
                <Text style={styles.btnDeleteText}>
                  {loadingDelete ? 'Eliminando…' : 'Eliminar consultorio'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>

            {/* Guardar se muestra siempre que no esté "solo ocupado sin editar" */}
            {!isOcupado && (
              <TouchableOpacity
                style={[styles.btnSave, loading && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={loading}
              >
                <Ionicons
                  name={loading ? 'hourglass-outline' : 'save-outline'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.btnSaveText}>
                  {loading ? 'Guardando…' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  kavWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 24 },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 12,
    marginBottom: 20,
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },

  divider:     { height: 1, backgroundColor: '#f1f5f9', marginBottom: 4 },
  scrollContent: { paddingTop: 16, paddingBottom: 8 },
  fieldGroup:  { marginBottom: 20 },
  label:       { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, letterSpacing: 0.1 },
  fieldHint:   { fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 16 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, backgroundColor: '#f8fafc',
    paddingHorizontal: 12, height: 48,
  },
  inputDisabled: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  inputIcon:     { marginRight: 8 },
  input:         { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '500' },

  // Disponibilidad
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle:    { fontSize: 13, fontWeight: '700', color: '#0ea5e9', letterSpacing: 0.2 },
  loadingDias:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingDiasText: { fontSize: 13, color: '#94a3b8' },
  diasScroll:      { gap: 8, paddingBottom: 4 },

  diaTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  diaTabDot:   { width: 7, height: 7, borderRadius: 4 },
  diaTabLabel: { fontSize: 12, fontWeight: '500', color: '#64748b' },

  diaDetalle: {
    marginTop: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc', padding: 14,
  },
  diaDetalleRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  diaDetalleIconWrap:{ width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  diaDetalleEstado:  { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  diaDetalleHint:    { fontSize: 12, color: '#64748b', lineHeight: 17 },
  barRow:  { marginTop: 8, gap: 4 },
  barBg:   { height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  barPct:  { fontSize: 10, color: '#94a3b8', fontWeight: '500' },

  // Estado
  ocupadoNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fffbeb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 12, borderWidth: 1, borderColor: '#fde68a',
  },
  ocupadoNoticeText: { fontSize: 12, color: '#92400e', flex: 1, lineHeight: 17 },

  estadoGrid: { flexDirection: 'row', gap: 10 },
  estadoCard: {
    flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 14, padding: 12, alignItems: 'center',
    backgroundColor: '#fafafa', position: 'relative',
  },
  estadoIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  estadoLabel:    { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 3 },
  estadoDesc:     { fontSize: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 13 },
  estadoCheck:    { position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fef2f2', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: '#ef4444', flex: 1 },

  btnDelete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 14,
    paddingVertical: 13, backgroundColor: '#fef2f2', marginBottom: 4,
  },
  btnDeleteText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },

  actions:      { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnCancel:    { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  btnCancelText:{ fontSize: 15, fontWeight: '600', color: '#64748b' },
  btnSave: {
    flex: 2, height: 50, borderRadius: 14, backgroundColor: '#0ea5e9',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    ...Platform.select({
      ios:     { shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  btnSaveText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});