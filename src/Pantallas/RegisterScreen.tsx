import React, { useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { supabase } from '../supabase/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

const STEPS = ['Personal', 'Médico', 'Acceso'];

export default function RegisterScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [formData, setFormData] = useState({
    nombre: '',
    apellido_p: '',
    apellido_m: '',
    email: '',
    password: '',
    telefono: '',
    genero: '',
    fecha_nacimiento: '',
    enfermedades: '',
  });

  const updateField = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const animateStep = (direction: 'forward' | 'back') => {
    const toValue = direction === 'forward' ? -30 : 30;
    slideAnim.setValue(toValue * -1);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const goNext = () => {
    if (currentStep === 0) {
      if (!formData.nombre || !formData.apellido_p) {
        Alert.alert('Atención', 'Nombre y apellido paterno son obligatorios.');
        return;
      }
    }
    if (currentStep === 1) {
      if (!formData.fecha_nacimiento) {
        Alert.alert('Atención', 'La fecha de nacimiento es obligatoria.');
        return;
      }
    }
    animateStep('forward');
    setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    animateStep('back');
    setCurrentStep((s) => s - 1);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'set') {
      setShowDatePicker(false);
      if (selectedDate) {
        setDate(selectedDate);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        updateField('fecha_nacimiento', `${year}-${month}-${day}`);
      }
    } else {
      setShowDatePicker(false);
    }
  };

  const handleRegister = async () => {
    const { nombre, apellido_p, apellido_m, email, password, telefono, genero, fecha_nacimiento, enfermedades } = formData;
    if (!nombre || !apellido_p || !email || !password || !fecha_nacimiento) {
      Alert.alert('Atención', 'Por favor completa los campos obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const { data: newUser, error: dbError } = await supabase
        .from('usuarios')
        .insert([{
          nombre,
          apellido1: apellido_p,
          apellido2: apellido_m || '',
          correo: email,
          contrasena: password,
          genero,
          id_rol: 3,
          telefono,
        }])
        .select()
        .single();
      if (dbError) throw dbError;

      const { error: pacienteError } = await supabase
        .from('pacientes')
        .insert([{
          id: newUser.id,
          fecha_nacimiento,
          enfermedades: enfermedades || 'Ninguna',
        }]);
      if (pacienteError) throw pacienteError;

      Alert.alert('¡Éxito!', 'Cuenta de paciente creada correctamente.');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Error de registro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={{ flex: 1, backgroundColor: '#F0F4FF' }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>MediTrak</Text>
            <Text style={styles.subtitle}>Crea tu cuenta de paciente</Text>
          </View>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            {STEPS.map((label, index) => (
              <React.Fragment key={label}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepCircle,
                    index < currentStep && styles.stepDone,
                    index === currentStep && styles.stepActive,
                  ]}>
                    {index < currentStep ? (
                      <Text style={styles.stepCheckmark}>✓</Text>
                    ) : (
                      <Text style={[
                        styles.stepNumber,
                        index === currentStep && styles.stepNumberActive,
                      ]}>{index + 1}</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    index === currentStep && styles.stepLabelActive,
                  ]}>{label}</Text>
                </View>
                {index < STEPS.length - 1 && (
                  <View style={[
                    styles.stepLine,
                    index < currentStep && styles.stepLineDone,
                  ]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Form Content */}
          <Animated.View style={[styles.card, { transform: [{ translateX: slideAnim }] }]}>

            {/* PASO 0: Datos personales */}
            {currentStep === 0 && (
              <View>
                <Text style={styles.sectionTitle}>Datos personales</Text>

                <Text style={styles.fieldLabel}>Nombre(s) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  placeholder="Ej. Juan Carlos"
                  placeholderTextColor="#B0BAC9"
                  style={inputStyle('nombre')}
                  value={formData.nombre}
                  onFocus={() => setFocusedField('nombre')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => updateField('nombre', t)}
                />

                <Text style={styles.fieldLabel}>Apellido paterno <Text style={styles.required}>*</Text></Text>
                <TextInput
                  placeholder="Ej. García"
                  placeholderTextColor="#B0BAC9"
                  style={inputStyle('apellido_p')}
                  value={formData.apellido_p}
                  onFocus={() => setFocusedField('apellido_p')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => updateField('apellido_p', t)}
                />

                <Text style={styles.fieldLabel}>Apellido materno</Text>
                <TextInput
                  placeholder="Ej. López"
                  placeholderTextColor="#B0BAC9"
                  style={inputStyle('apellido_m')}
                  value={formData.apellido_m}
                  onFocus={() => setFocusedField('apellido_m')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => updateField('apellido_m', t)}
                />

                <Text style={styles.fieldLabel}>Teléfono</Text>
                <TextInput
                  placeholder="10 dígitos"
                  placeholderTextColor="#B0BAC9"
                  style={inputStyle('telefono')}
                  value={formData.telefono}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setFocusedField('telefono')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => updateField('telefono', t)}
                />

                <Text style={styles.fieldLabel}>Género</Text>
                <View style={styles.genderRow}>
                  {['masculino', 'femenino'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, formData.genero === g && styles.genderBtnSelected]}
                      onPress={() => updateField('genero', g)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.genderTxt, formData.genero === g && styles.genderTxtSelected]}>
                        {g === 'masculino' ? '♂ Masculino' : '♀ Femenino'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* PASO 1: Información médica */}
            {currentStep === 1 && (
              <View>
                <Text style={styles.sectionTitle}>Información médica</Text>

                <Text style={styles.fieldLabel}>Fecha de nacimiento <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 15, color: formData.fecha_nacimiento ? '#1A2540' : '#B0BAC9' }}>
                    {formData.fecha_nacimiento ? `📅  ${formData.fecha_nacimiento}` : '📅  Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                    maximumDate={new Date()}
                    onChange={onDateChange}
                  />
                )}

                <Text style={styles.fieldLabel}>Enfermedades o alergias <Text style={styles.optional}>(opcional)</Text></Text>
                <TextInput
                  placeholder="Ej. Diabetes tipo 2, alergia al polvo..."
                  placeholderTextColor="#B0BAC9"
                  style={[inputStyle('enfermedades'), styles.textArea]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={formData.enfermedades}
                  onFocus={() => setFocusedField('enfermedades')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => updateField('enfermedades', t)}
                />
              </View>
            )}

            {/* PASO 2: Acceso */}
            {currentStep === 2 && (
              <View>
                <Text style={styles.sectionTitle}>Datos de acceso</Text>

                <Text style={styles.fieldLabel}>Correo electrónico <Text style={styles.required}>*</Text></Text>
                <TextInput
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#B0BAC9"
                  style={inputStyle('email')}
                  value={formData.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => updateField('email', t)}
                />

                <Text style={styles.fieldLabel}>Contraseña <Text style={styles.required}>*</Text></Text>
                <View style={[styles.passwordContainer, focusedField === 'password' && styles.inputFocused]}>
                  <TextInput
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#B0BAC9"
                    style={styles.inputPassword}
                    value={formData.password}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(t) => updateField('password', t)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Resumen de tu registro</Text>
                  <Text style={styles.summaryItem}>👤  {formData.nombre} {formData.apellido_p}</Text>
                  {formData.fecha_nacimiento ? <Text style={styles.summaryItem}>📅  {formData.fecha_nacimiento}</Text> : null}
                  {formData.genero ? <Text style={styles.summaryItem}>{formData.genero === 'masculino' ? '♂' : '♀'}  {formData.genero}</Text> : null}
                </View>
              </View>
            )}
          </Animated.View>

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>← Anterior</Text>
              </TouchableOpacity>
            )}

            {currentStep < STEPS.length - 1 ? (
              <TouchableOpacity
                style={[styles.nextBtn, currentStep === 0 && { flex: 1 }]}
                onPress={goNext}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerBtnText}>Crear cuenta</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>¿Ya tienes cuenta? <Text style={{ fontWeight: '700' }}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, backgroundColor: '#F0F4FF' },

  header: { alignItems: 'center', marginBottom: 28 },
  appName: { fontSize: 32, fontWeight: '800', color: '#1A2540', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6B7A99', marginTop: 4 },

  // Stepper
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepItem: { alignItems: 'center', minWidth: 56 },
  stepCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#E4EAF8', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#D0D9EF',
  },
  stepActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  stepDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  stepCheckmark: { color: '#fff', fontSize: 15, fontWeight: '700' },
  stepNumber: { fontSize: 14, fontWeight: '700', color: '#8896B3' },
  stepNumberActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: '#8896B3', marginTop: 4, fontWeight: '500' },
  stepLabelActive: { color: '#2563EB', fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#D0D9EF', marginHorizontal: 4, marginBottom: 16 },
  stepLineDone: { backgroundColor: '#10B981' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#1A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A2540', marginBottom: 18 },

  // Fields
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#4B5B7B', marginBottom: 6, marginLeft: 2 },
  required: { color: '#EF4444' },
  optional: { color: '#9DAAC2', fontWeight: '400' },
  input: {
    backgroundColor: '#F7F9FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E4EAF8',
    fontSize: 15,
    color: '#1A2540',
  },
  inputFocused: { borderColor: '#2563EB', backgroundColor: '#EEF3FF' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4EAF8',
    marginBottom: 14,
  },
  inputPassword: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#1A2540',
  },
  eyeButton: { paddingHorizontal: 14 },
  eyeText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  dateInput: { justifyContent: 'center' },
  textArea: { height: 88, paddingTop: 12 },

  // Gender
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  genderBtn: {
    flex: 1, padding: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E4EAF8',
    backgroundColor: '#F7F9FF', alignItems: 'center',
  },
  genderBtnSelected: { backgroundColor: '#EEF3FF', borderColor: '#2563EB' },
  genderTxt: { fontSize: 14, fontWeight: '600', color: '#6B7A99' },
  genderTxtSelected: { color: '#2563EB' },

  // Summary
  summaryBox: {
    backgroundColor: '#F0F4FF', borderRadius: 12,
    padding: 14, marginTop: 10, gap: 6,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#6B7A99', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryItem: { fontSize: 14, color: '#1A2540', fontWeight: '500' },

  // Navigation
  navRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  backBtn: {
    flex: 1, padding: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#D0D9EF', alignItems: 'center',
    backgroundColor: '#fff',
  },
  backBtnText: { color: '#4B5B7B', fontWeight: '600', fontSize: 15 },
  nextBtn: {
    flex: 2, padding: 16, borderRadius: 14,
    backgroundColor: '#2563EB', alignItems: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  registerBtn: {
    flex: 2, padding: 16, borderRadius: 14,
    backgroundColor: '#10B981', alignItems: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  registerBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  loginLink: { alignItems: 'center', marginTop: 8 },
  loginLinkText: { color: '#6B7A99', fontSize: 13 },
});