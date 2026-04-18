import React, { useState } from 'react';
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
  ScrollView 
} from 'react-native';
import { supabase } from '../supabase/supabase';

export default function RegisterScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_p: '',
    apellido_m: '',
    email: '',
    password: '',
    telefono: '',
    genero: '', // Se llenará con los botones
    fecha_nacimiento: '', 
    enfermedades: ''
  });

  const handleRegister = async () => {
  const { nombre, apellido_p, apellido_m, email, password, telefono, genero, fecha_nacimiento, enfermedades } = formData;
  
  // Validación: Asegúrate de incluir los campos de paciente
  if (!nombre || !apellido_p || !email || !password || !fecha_nacimiento) {
    Alert.alert("Atención", "Por favor completa los campos obligatorios.");
    return;
  }

  setLoading(true);
  try {
    // 1. Crear en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    // 2. Insertar en tabla 'usuarios' y obtener el ID generado (.select().single())
    const { data: newUser, error: dbError } = await supabase
      .from('usuarios')
      .insert([{
        nombre,
        apellido1: apellido_p,
        apellido2: apellido_m || '',
        correo: email,
        contrasena: password,
        genero, 
        id_rol: 3, // Rol Paciente
        telefono,
      }])
      .select()
      .single(); // Esto nos devuelve el objeto creado con su ID

    if (dbError) throw dbError;

    // 3. Insertar en tabla 'pacientes' usando el ID del usuario recién creado
    const { error: pacienteError } = await supabase
      .from('pacientes')
      .insert([{
        id: newUser.id, // Relación uno a uno
        fecha_nacimiento: fecha_nacimiento,
        enfermedades: enfermedades || 'Ninguna'
      }]);

    if (pacienteError) throw pacienteError;

    Alert.alert("¡Éxito!", "Cuenta de paciente creada correctamente.");
    navigation.navigate('Login');

  } catch (error: any) {
    Alert.alert("Error de registro", error.message);
  } finally {
    setLoading(false);
  }
};
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} 
      style={{ flex: 1, backgroundColor: '#F8F9FA' }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {/* Usamos un solo ScrollView que envuelva TODO el contenido */}
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
        >
          <Text style={styles.brand}>MediTrak</Text>
          <Text style={styles.title}>Nueva Cuenta</Text>
          
          <View style={styles.inputGroup}>
            <TextInput 
              placeholder="Nombre(s)" 
              style={styles.input} 
              onChangeText={(text) => setFormData({...formData, nombre: text})}
            />
            
            <View style={styles.row}>
              <TextInput 
                placeholder="Ap. Paterno" 
                style={[styles.input, { flex: 1, marginRight: 5 }]} 
                onChangeText={(text) => setFormData({...formData, apellido_p: text})}
              />
              <TextInput 
                placeholder="Ap. Materno" 
                style={[styles.input, { flex: 1, marginLeft: 5 }]} 
                onChangeText={(text) => setFormData({...formData, apellido_m: text})}
              />
            </View>

            <TextInput 
              placeholder="Teléfono (10 dígitos)" 
              style={styles.input} 
              keyboardType="phone-pad"
              maxLength={10}
              onChangeText={(text) => setFormData({...formData, telefono: text})}
            />

            <Text style={styles.label}>Género</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity 
                style={[
                  styles.genderButton, 
                  formData.genero === 'masculino' && styles.genderButtonSelected
                ]}
                onPress={() => setFormData({...formData, genero: 'masculino'})}
              >
                <Text style={[
                  styles.genderText, 
                  formData.genero === 'masculino' && styles.genderTextSelected
                ]}>Masculino</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.genderButton, 
                  formData.genero === 'femenino' && styles.genderButtonSelected
                ]}
                onPress={() => setFormData({...formData, genero: 'femenino'})}
              >
                <Text style={[
                  styles.genderText, 
                  formData.genero === 'femenino' && styles.genderTextSelected
                ]}>Femenino</Text>
              </TouchableOpacity>
            </View>

              <Text style={styles.label}>Información Médica</Text>

            <TextInput 
              placeholder="Fecha de Nacimiento (AAAA-MM-DD)" 
  style={styles.input} 
  keyboardType="numbers-and-punctuation"
  value={formData.fecha_nacimiento}
  onChangeText={(text) => setFormData({...formData, fecha_nacimiento: text})}
/>

<TextInput 
  placeholder="Enfermedades o Alergias (Opcional)" 
  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} // Altura mayor para notas
  multiline={true}
  numberOfLines={3}
  value={formData.enfermedades}
  onChangeText={(text) => setFormData({...formData, enfermedades: text})}
/>

            <TextInput 
              placeholder="Correo electrónico" 
              style={styles.input} 
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(text) => setFormData({...formData, email: text})}
            />
            <TextInput 
              placeholder="Contraseña" 
              style={styles.input} 
              secureTextEntry 
              onChangeText={(text) => setFormData({...formData, password: text})}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleRegister} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footer}>
            <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F8F9FA' },
  brand: { fontSize: 22, textAlign: 'center', color: '#007AFF', fontWeight: 'bold', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  inputGroup: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E1E1E1',
    fontSize: 16
  },
  label: { fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '600', marginLeft: 5 },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  genderButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  genderButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  genderText: { color: '#666', fontWeight: '600' },
  genderTextSelected: { color: '#fff' },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { marginTop: 25, alignItems: 'center' },
  link: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
});