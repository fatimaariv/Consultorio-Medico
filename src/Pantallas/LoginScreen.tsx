import React, { useState } from 'react';
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

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

            <Text style={styles.fieldLabel}>Correo electrónico</Text>
            <TextInput 
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#B0BAC9"
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />

            <Text style={styles.fieldLabel}>Contraseña</Text>
            <View style={[styles.passwordContainer, focusedField === 'password' && styles.inputFocused]}>
              <TextInput 
                placeholder="Tu contraseña"
                placeholderTextColor="#B0BAC9"
                style={styles.inputPassword}
                secureTextEntry={!showPassword} 
                onChangeText={setPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)} 
                style={styles.eyeButton}
              >
                <Text style={styles.eyeText}>{showPassword ? "Ocultar" : "Ver"}</Text>
              </TouchableOpacity>
            </View>

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
    marginBottom: 4,
  },
  inputPassword: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#1A2540',
  },
  eyeButton: { paddingHorizontal: 14 },
  eyeText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },

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