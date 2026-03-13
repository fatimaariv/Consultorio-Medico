import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../supabase/supabase';

interface Appointment {
  id: number;
  doctor: string;
  time: string;
  type: string;
}

export default function HomeScreen({ navigation }: any) {
  const { session } = useContext(AuthContext);

  const appointments: Appointment[] = [
    { id: 1, doctor: "Dr. Ramírez", time: "10:30 AM", type: "Consulta General" },
    { id: 2, doctor: "Dra. López", time: "1:00 PM", type: "Resultados" },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error", "No se pudo cerrar la sesión: " + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>Meditrack</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.greeting}>Buenos días,</Text>
            <Text style={styles.userName}>{session?.user?.email?.split('@')[0] || 'Usuario'}</Text>
            <TouchableOpacity style={styles.logout} onPress={handleLogout}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>Tu agenda</Text>

        {/* RESUMEN (CARDS) */}
        <View style={styles.summaryContainer}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Próxima cita</Text>
            <Text style={styles.cardValue}>10:30 AM</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total citas</Text>
            <Text style={styles.cardValue}>8</Text>
          </View>
        </View>

        {/* BOTONES DE ACCIÓN */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Schedule')} // <--- ESTA ES LA CONEXIÓN
          >
            <Text style={styles.primaryBtnText}>+ Agendar Cita</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              console.log("Navegando a History con ID:", session?.user?.id);
              try {
                navigation.navigate('History', { patientId: session?.user?.id });
              } catch (e) {
                console.log("Error de navegación:", e);
              }
            }}
          >
            <Text style={styles.secondaryBtnText}>Ver Historial</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Próximas Citas</Text>

        {/* LISTA DE CITAS */}
        {appointments.map((appointment) => (
          <TouchableOpacity key={appointment.id} style={styles.appointmentItem}>
            <View>
              <Text style={styles.appointmentDoctor}>{appointment.doctor}</Text>
              <Text style={styles.appointmentDetail}>
                {appointment.time} - {appointment.type}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* NAVBAR INFERIOR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
          <Text style={styles.navText}>Citas</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('PatientProfile')}>
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView> // ✅ Cierre limpio aquí
  ); // ✅ Cierre del return
} // ✅ Cierre de la función HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Espacio para que el navbar no tape el contenido
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
  },
  greeting: {
    fontSize: 14,
    color: "#666",
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  logout: {
    backgroundColor: "#e74c3c",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  logoutText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 15,
    marginVertical: 15,
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 16,
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Sombra para Android
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    color: "#666",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "bold",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#333",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 10,
  },
  appointmentItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  appointmentDoctor: {
    fontSize: 16,
    fontWeight: "bold",
  },
  appointmentDetail: {
    color: "#666",
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: "#ccc",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  navText: {
    color: "#2563eb",
    fontWeight: "600",
  },
});