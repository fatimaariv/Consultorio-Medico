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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { consultoriosService } from '../../../services/consultoriosService';

const ESTADO_OPTIONS = [
  {
    value: 'disponible',
    label: 'Disponible',
    icon: 'checkmark-circle-outline' as const,
    color: '#10b981',
    bg: '#ecfdf5',
    description: 'Quedan espacios para citas hoy',
  },
  {
    value: 'ocupado',
    label: 'Ocupado',
    icon: 'time-outline' as const,
    color: '#f59e0b',
    bg: '#fffbeb',
    description: 'Sin espacios disponibles hoy',
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

export default function ConsultorioModal({
  visible,
  onClose,
  onSave,
  consultorioEditando,
}: any) {
  const [numero, setNumero] = useState('');
  const [estado, setEstado] = useState('disponible');
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setNumero(consultorioEditando?.numero || '');
      setEstado(consultorioEditando?.estado || 'disponible');
      setError('');
    }
  }, [visible, consultorioEditando]);

  const isEditing = !!consultorioEditando;

  const availableOptions = isEditing
    ? ESTADO_OPTIONS.filter((o) => ['disponible', 'mantenimiento'].includes(o.value))
    : ESTADO_OPTIONS;

  const handleSave = async () => {
    if (!numero.trim()) {
      setError('El número de consultorio es obligatorio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await consultoriosService.update(consultorioEditando.id, numero.trim(), estado);
      } else {
        await consultoriosService.create(numero.trim(), estado);
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
          text: 'Eliminar',
          style: 'destructive',
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

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      {/* Tap outside to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          {/* Handle */}
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

          {/* Scrollable content — safe against keyboard */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Número */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Número de consultorio</Text>
              <View style={[styles.inputWrap, isEditing && styles.inputDisabled]}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Ej. 101, A-3, Piso 2..."
                  value={numero}
                  onChangeText={(t) => { setNumero(t); setError(''); }}
                  style={[styles.input, isEditing && { color: '#94a3b8' }]}
                  placeholderTextColor="#94a3b8"
                  editable={!isEditing}
                  returnKeyType="done"
                />
              </View>
              {isEditing && (
                <Text style={styles.fieldHint}>
                  El número no puede modificarse una vez creado.
                </Text>
              )}
            </View>

            {/* Estado */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {isEditing ? 'Cambiar estado' : 'Estado inicial'}
              </Text>
              {isEditing && (
                <Text style={[styles.fieldHint, { marginBottom: 12 }]}>
                  Solo puedes cambiar entre{' '}
                  <Text style={{ fontWeight: '600' }}>Disponible</Text> y{' '}
                  <Text style={{ fontWeight: '600' }}>Mantenimiento</Text>.
                  El estado <Text style={{ fontWeight: '600' }}>Ocupado</Text> lo
                  gestiona el sistema automáticamente.
                </Text>
              )}
              <View style={styles.estadoGrid}>
                {availableOptions.map((opt) => {
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
                      <View
                        style={[
                          styles.estadoIconWrap,
                          { backgroundColor: active ? opt.color : '#f1f5f9' },
                        ]}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={active ? '#fff' : '#94a3b8'}
                        />
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
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Delete — only when editing */}
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
                  {loadingDelete ? 'Eliminando...' : 'Eliminar consultorio'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Actions — always visible above keyboard */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
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
                {loading ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  kavWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 4,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  fieldHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    height: 48,
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  estadoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  estadoCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    position: 'relative',
  },
  estadoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  estadoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 3,
  },
  estadoDesc: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 13,
  },
  estadoCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    flex: 1,
  },
  btnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#fef2f2',
    marginBottom: 4,
  },
  btnDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  btnCancel: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  btnSave: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});