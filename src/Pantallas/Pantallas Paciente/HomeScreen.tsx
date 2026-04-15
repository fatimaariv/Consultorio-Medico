import React, { useContext, useState, useCallback } from 'react'; // 1. Cambiamos useEffect por useCallback
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';
import { useFocusEffect } from '@react-navigation/native'; // 2. Importamos useFocusEffect

export default function HomeScreen({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [userName, setUserName] = useState('usuarios');
  const [totalCitas, setTotalCitas] = useState(0);
  const [citasReales, setCitasReales] = useState<any[]>([]);

  // 3. Sacamos la función de carga para poder usarla dentro del useFocusEffect
  const fetchUserDataAndCitas = async () => {
    if (session?.user?.email) {
      try {
        // 1. Obtenemos datos del usuario logueado
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('id, nombre')
          .eq('correo', session.user.email)
          .single();

        if (userData && !userError) {
          setUserName(userData.nombre);

          // 2. Contador total de citas (Histórico)
          const { count } = await supabase
            .from('citas')
            .select('*', { count: 'exact', head: true })
            .eq('id_paciente', userData.id);
          setTotalCitas(count || 0);

          // 3. OBTENER SOLO CITAS PRÓXIMAS (Fecha >= Hoy)
          const hoy = new Date().toISOString().split('T')[0];

          const { data: citasData, error: citasError } = await supabase
            .from('citas')
            .select(`
              id,
              fecha,
              hora,
              doctores (
                usuarios (
                  nombre,
                  apellido1
                )
              )
            `)
            .eq('id_paciente', userData.id)
            .gte('fecha', hoy)
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

          if (!citasError && citasData) {
            const formateadas = citasData.map((c: any) => ({
              id: c.id,
              fecha: c.fecha,
              hora: c.hora,
              nombreDoctor: c.doctores?.usuarios 
                ? `Dr. ${c.doctores.usuarios.nombre} ${c.doctores.usuarios.apellido1}`
                : "Doctor no asignado"
            }));
            setCitasReales(formateadas);
          }
        }
      } catch (error) {
        console.log("Error:", error);
      }
    }
  };

  // 4. CLAVE: useFocusEffect recarga los datos cada vez que la pantalla "se enfoca"
  useFocusEffect(
    useCallback(() => {
      fetchUserDataAndCitas();
    }, [session])
  );

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar sesión");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>Medi Track</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.greeting}>Buenos días,</Text>
            <Text style={styles.userName}>{userName}</Text>
            <TouchableOpacity style={styles.logout} onPress={handleLogout}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>Tu agenda</Text>

        {/* RESUMEN */}
        <View style={styles.summaryContainer}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Próxima cita</Text>
            <Text style={styles.cardValue}>
              {citasReales.length > 0 ? citasReales[0].hora : "--:--"}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total citas</Text>
            <Text style={styles.cardValue}>{totalCitas}</Text>
          </View>
        </View>

        {/* ACCIONES */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.primaryBtnText}>+ Agendar Cita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('History')}>
            <Text style={styles.secondaryBtnText}>Ver Historial</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Próximas Citas</Text>

        {/* LISTA DE CITAS FUTURAS */}
        {citasReales.length > 0 ? (
          citasReales.map((cita) => (
            <TouchableOpacity key={cita.id} style={styles.appointmentItem}>
              <View>
                <Text style={styles.appointmentDoctor}>{cita.nombreDoctor}</Text>
                <Text style={styles.appointmentDetail}>
                  {cita.fecha} - {cita.hora}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: "#666", fontStyle: "italic" }}>No tienes citas próximamente.</Text>
        )}

      </ScrollView>

      {/* NAVBAR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('PatientProfile')}>
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


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