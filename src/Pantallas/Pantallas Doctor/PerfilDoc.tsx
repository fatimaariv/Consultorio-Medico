import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilDoc() {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    try {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      // 1. Buscamos en la tabla 'doctores' y unimos con 'usuarios' para nombre/apellido
      const { data, error } = await supabase
        .from('doctores')
        .select(`
          id,
          especialidad,
          telefono,
          correo,
          usuarios (
            nombre,
            apellido
          )
        `)
        .eq('correo', session.user.email)
        .single();

      if (data) setDoctorInfo(data);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con Diseño Curvo o Color Sólido */}
        <View style={styles.headerBackground}>
          <View style={styles.profileImageContainer}>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="person" size={60} color="#2563eb" />
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.userName}>
            Dr. {doctorInfo?.usuarios?.nombre} {doctorInfo?.usuarios?.apellido}
          </Text>
          <Text style={styles.specialtyText}>{doctorInfo?.especialidad || 'Especialista'}</Text>

          {/* Tarjetas de Información */}
          <View style={styles.cardContainer}>
            <View style={[styles.infoCard, styles.shadow]}>
              <View style={styles.iconWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748b" />
              </View>
              <View>
                <Text style={styles.label}>Correo Electrónico</Text>
                <Text style={styles.value}>{doctorInfo?.correo}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, styles.shadow]}>
              <View style={styles.iconWrapper}>
                <Ionicons name="call-outline" size={20} color="#64748b" />
              </View>
              <View>
                <Text style={styles.label}>Teléfono de Contacto</Text>
                <Text style={styles.value}>{doctorInfo?.telefono || 'No registrado'}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, styles.shadow]}>
              <View style={styles.iconWrapper}>
                <Ionicons name="medal-outline" size={20} color="#64748b" />
              </View>
              <View>
                <Text style={styles.label}>Cédula Profesional</Text>
                <Text style={styles.value}>Verificada</Text>
              </View>
            </View>
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color="white" />
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBackground: {
    height: 150,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    marginBottom: -50,
    backgroundColor: '#F8FAFC',
    borderRadius: 60,
    padding: 5,
  },
  imagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#DBEafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  specialtyText: { fontSize: 16, color: '#64748b', marginTop: 5, fontWeight: '500' },
  cardContainer: { width: '100%', marginTop: 30 },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  label: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 15, color: '#334155', fontWeight: '600', marginTop: 2 },
  actionContainer: { width: '100%', marginTop: 20, marginBottom: 40 },
  editButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  editButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});