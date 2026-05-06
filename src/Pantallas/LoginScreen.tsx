import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Text, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView 
} from 'react-native';
import { login } from '../services/authService';
import { supabase } from '../supabase/supabase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── Estados de validación ─────────────────────────────────────────────────
  // null = sin verificar, true = válido, false = inválido
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);

  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Validación de formato ─────────────────────────────────────────────────
  const isValidEmailFormat = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // ── Correo: verificar contra BD con debounce ──────────────────────────────
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailValid(null);
    setEmailChecking(false);

    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    if (!isValidEmailFormat(value)) return;

    setEmailChecking(true);
    emailDebounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('usuarios')
        .select('id')
        .eq('correo', value)
        .maybeSingle();

      setEmailChecking(false);
      setEmailValid(data !== null);
    }, 600);
  };

  // ── Contraseña: mínimo 6 caracteres ──────────────────────────────────────
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length === 0) {
      setPasswordValid(null);
    } else {
      setPasswordValid(value.length >= 6);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atención", "Escribe tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers de color ──────────────────────────────────────────────────────
  const getFieldColors = (valid: boolean | null, focused: boolean) => {
    if (valid === true)  return { border: '#16a34a', bg: '#f0fdf4' };
    if (valid === false) return { border: '#dc2626', bg: '#fef2f2' };
    if (focused)         return { border: '#2563EB', bg: '#EEF3FF' };
    return { border: '#E4EAF8', bg: '#F7F9FF' };
  };

  const emailColors    = getFieldColors(emailValid,    focusedField === 'email');
  const passwordColors = getFieldColors(passwordValid, focusedField === 'password');

  // ── Ícono de estado dentro del campo ─────────────────────────────────────
  const StatusIcon = ({ valid }: { valid: boolean | null }) => {
    if (valid === null) return null;
    return (
      <Text style={{ fontSize: 16, marginRight: 12, color: valid ? '#16a34a' : '#dc2626' }}>
        {valid ? '✓' : '✕'}
      </Text>
    );
  };

  // ── Franja de ayuda — solo aparece cuando hay algo que mostrar ───────────
  const HelperText = ({
    valid,
    checking,
    validMsg,
    invalidMsg,
  }: {
    valid: boolean | null;
    checking?: boolean;
    validMsg: string;
    invalidMsg: string;
  }) => {
    if (!checking && valid === null) return null; // sin hueco cuando no hay mensaje
    const isValid = valid === true;
    const color   = checking ? '#94a3b8' : isValid ? '#16a34a' : '#dc2626';
    const bgColor = checking ? '#f8fafc' : isValid ? '#f0fdf4' : '#fef2f2';
    const msg     = checking ? 'Verificando...' : isValid ? `✓  ${validMsg}` : `✕  ${invalidMsg}`;
    return (
      <View style={[styles.helperBar, { backgroundColor: bgColor }]}>
        <Text style={[styles.helperText, { color }]}>{msg}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: '#F0F4FF' }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>MediTrak</Text>
            <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar sesión</Text>

            {/* ── Correo ── */}
            <Text style={styles.fieldLabel}>Correo electrónico</Text>
            <View style={[
              styles.inputRow,
              { borderColor: emailColors.border, backgroundColor: emailColors.bg }
            ]}>
              <TextInput 
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#B0BAC9"
                style={styles.inputInner}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
              {emailChecking
                ? <ActivityIndicator size="small" color="#94a3b8" style={{ marginRight: 12 }} />
                : <StatusIcon valid={emailValid} />
              }
            </View>
            <HelperText
              valid={emailValid}
              checking={emailChecking}
              validMsg="Correo encontrado"
              invalidMsg="Este correo no está registrado"
            />

            {/* ── Contraseña ── */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Contraseña</Text>
            <View style={[
              styles.inputRow,
              { borderColor: passwordColors.border, backgroundColor: passwordColors.bg }
            ]}>
              <TextInput 
                placeholder="Tu contraseña"
                placeholderTextColor="#B0BAC9"
                style={styles.inputInner}
                secureTextEntry={!showPassword} 
                onChangeText={handlePasswordChange}
                autoCapitalize="none"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <StatusIcon valid={passwordValid} />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)} 
                style={styles.eyeButton}
              >
                <Text style={styles.eyeText}>{showPassword ? "Ocultar" : "Ver"}</Text>
              </TouchableOpacity>
            </View>
            <HelperText
              valid={passwordValid}
              validMsg="Contraseña válida"
              invalidMsg="Mínimo 6 caracteres"
            />

          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin} 
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Regístrate</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F0F4FF' },

  header: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 32, fontWeight: '800', color: '#1A2540', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6B7A99', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#1A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1A2540', marginBottom: 20, textAlign: 'center' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#4B5B7B', marginBottom: 6, marginLeft: 2 },

  // ── Campo con ícono ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  inputInner: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#1A2540',
  },

  eyeButton: { paddingHorizontal: 14 },
  eyeText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },

  // ── Franja de ayuda ──
  helperBar: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  helperText: { fontSize: 12, fontWeight: '600' },

  forgotLink: { alignItems: 'center', marginTop: 14, marginBottom: 4 },
  forgotText: { color: '#6B7A99', fontSize: 13, fontWeight: '600' },

  button: { 
    backgroundColor: '#2563EB', 
    padding: 17, 
    borderRadius: 14, 
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 13 },
  footerText: { color: '#6B7A99', fontSize: 13 },
  link: { color: '#2563EB', fontSize: 13, fontWeight: '700' },
});