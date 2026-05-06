import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase/supabase';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Estados de validación (igual que LoginScreen) ─────────────────────────
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Validación de formato ─────────────────────────────────────────────────
  const isValidEmailFormat = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // ── Correo: verificar contra BD con debounce (igual que LoginScreen) ──────
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

  // ── Helpers de color (igual que LoginScreen) ──────────────────────────────
  const getFieldColors = (valid: boolean | null, focused: boolean) => {
    if (valid === true)  return { border: '#16a34a', bg: '#f0fdf4' };
    if (valid === false) return { border: '#dc2626', bg: '#fef2f2' };
    if (focused)         return { border: '#007AFF', bg: '#EEF3FF' };
    return { border: '#E1E1E1', bg: '#fff' };
  };

  const emailColors = getFieldColors(emailValid, focusedField === 'email');

  // ── Ícono de estado dentro del campo ─────────────────────────────────────
  const StatusIcon = ({ valid }: { valid: boolean | null }) => {
    if (valid === null) return null;
    return (
      <Text style={{ fontSize: 16, marginRight: 12, color: valid ? '#16a34a' : '#dc2626' }}>
        {valid ? '✓' : '✕'}
      </Text>
    );
  };

  // ── Franja de ayuda (igual que LoginScreen) ───────────────────────────────
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
    if (!checking && valid === null) return null;
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

  // ── Envío del correo de recuperación ─────────────────────────────────────
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Atención', 'Ingresa tu correo.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      Alert.alert('Código enviado', 'Revisa tu bandeja de entrada.');
      navigation.navigate('VerifyCode', { email });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MediTrak</Text>
      <Text style={styles.title}>Recuperar Acceso</Text>
      <Text style={styles.subtitle}>Te enviaremos un código de 6 dígitos a tu correo.</Text>

      <View style={styles.inputGroup}>
        {/* ── Campo de correo con validación ── */}
        <View style={[
          styles.inputRow,
          { borderColor: emailColors.border, backgroundColor: emailColors.bg }
        ]}>
          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#B0BAC9"
            style={styles.inputInner}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
          {emailChecking
            ? <ActivityIndicator size="small" color="#94a3b8" style={{ marginRight: 12 }} />
            : <StatusIcon valid={emailValid} />
          }
        </View>

        {/* ── Franja de ayuda ── */}
        <HelperText
          valid={emailValid}
          checking={emailChecking}
          validMsg="Correo encontrado"
          invalidMsg="Este correo no está registrado"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Enviar código</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footer}>
        <Text style={styles.link}>Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F8F9FA' },
  brand:       { fontSize: 22, textAlign: 'center', color: '#007AFF', fontWeight: 'bold', marginBottom: 10 },
  title:       { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle:    { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputGroup:  { marginBottom: 20 },

  // ── Campo con ícono (igual que LoginScreen) ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  inputInner: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1A2540',
  },

  // ── Franja de ayuda ──
  helperBar: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  helperText: { fontSize: 12, fontWeight: '600' },

  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer:     { marginTop: 25, alignItems: 'center' },
  link:       { color: '#007AFF', fontSize: 14, fontWeight: '600' },
});