import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../supabase/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }: any) {
  const { session } = useContext(AuthContext);
  const [userName, setUserName] = useState('usuarios');
  const [totalCitas, setTotalCitas] = useState(0);
  const [citasReales, setCitasReales] = useState<any[]>([]);

  const fetchUserDataAndCitas = async () => {
    if (session?.user?.email) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('id, nombre')
          .eq('correo', session.user.email)
          .single();

        if (userData && !userError) {
          setUserName(userData.nombre);

          const { count } = await supabase
            .from('citas')
            .select('*', { count: 'exact', head: true })
            .eq('id_paciente', userData.id);
          setTotalCitas(count || 0);

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

  // Saludo dinámico según la hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Formatear fecha legible
  const formatFecha = (fecha: string) => {
    const [year, month, day] = fecha.split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(day)} ${meses[parseInt(month) - 1]} ${year}`;
  };

  const proximaCita = citasReales.length > 0 ? citasReales[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4fd6" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER con gradiente visual ── */}
        <View style={styles.header}>
          <View style={styles.headerBubble1} />
          <View style={styles.headerBubble2} />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.logoText}>Medi Track</Text>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userNameText}>{userName} 👋</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* Tarjeta de próxima cita dentro del header */}
          {proximaCita ? (
            <View style={styles.nextAppointmentCard}>
              <View>
                <Text style={styles.nextAppointmentLabel}>Próxima cita</Text>
                <Text style={styles.nextAppointmentDoctor}>{proximaCita.nombreDoctor}</Text>
                <Text style={styles.nextAppointmentDate}>
                  {formatFecha(proximaCita.fecha)} · {proximaCita.hora}
                </Text>
              </View>
              <View style={styles.nextAppointmentBadge}>
                <Text style={styles.nextAppointmentBadgeText}>📅</Text>
              </View>
            </View>
          ) : (
            <View style={styles.nextAppointmentCard}>
              <View>
                <Text style={styles.nextAppointmentLabel}>Próxima cita</Text>
                <Text style={styles.nextAppointmentDoctor}>Sin citas agendadas</Text>
                <Text style={styles.nextAppointmentDate}>¡Agenda una ahora!</Text>
              </View>
              <View style={styles.nextAppointmentBadge}>
                <Text style={styles.nextAppointmentBadgeText}>📋</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCitas}</Text>
            <Text style={styles.statLabel}>Citas totales</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{citasReales.length}</Text>
            <Text style={styles.statLabel}>Próximas</Text>
          </View>
        </View>

        {/* ── ACCIONES ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.primaryBtnIcon}>＋</Text>
            <Text style={styles.primaryBtnText}>Agendar Cita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('History')}>
            <Text style={styles.secondaryBtnIcon}>📋</Text>
            <Text style={styles.secondaryBtnText}>Historial</Text>
          </TouchableOpacity>
        </View>

        {/* ── LISTA DE PRÓXIMAS CITAS ── */}
        <Text style={styles.sectionTitle}>Próximas Citas</Text>

        {citasReales.length > 0 ? (
          citasReales.map((cita, index) => (
            <TouchableOpacity key={cita.id} style={styles.citaCard} activeOpacity={0.8}>
              {/* Línea de color izquierda */}
              <View style={[styles.citaAccent, index === 0 && styles.citaAccentFirst]} />
              <View style={styles.citaInfo}>
                <Text style={styles.citaDoctor}>{cita.nombreDoctor}</Text>
                <Text style={styles.citaDetalle}>{formatFecha(cita.fecha)}</Text>
              </View>
              <View style={styles.citaHoraContainer}>
                <Text style={styles.citaHora}>{cita.hora}</Text>
                <Text style={styles.citaArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🗓️</Text>
            <Text style={styles.emptyStateText}>No tienes citas próximamente</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── NAVBAR (sin cambios) ── */}
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

const BLUE = '#2563eb';
const BLUE_DARK = '#1a4fd6';
const BLUE_LIGHT = '#eff6ff';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ── HEADER ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
  },
  headerBubble1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -40,
  },
  headerBubble2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 20,
    left: -20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Tarjeta próxima cita dentro del header
  nextAppointmentCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nextAppointmentLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  nextAppointmentDoctor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextAppointmentDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  nextAppointmentBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextAppointmentBadgeText: {
    fontSize: 20,
  },

  // ── STATS ──
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BLUE,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  // ── ACCIONES ──
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    gap: 12,
    marginBottom: 26,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnIcon: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 2,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dbe8ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryBtnIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  secondaryBtnText: {
    color: BLUE,
    fontWeight: '600',
    fontSize: 13,
  },

  // ── SECCIÓN CITAS ──
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  citaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 22,
    marginBottom: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  citaAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#93c5fd',
  },
  citaAccentFirst: {
    backgroundColor: BLUE,
  },
  citaInfo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  citaDoctor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  citaDetalle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  citaHoraContainer: {
    paddingRight: 14,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  citaHora: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },
  citaArrow: {
    fontSize: 22,
    color: '#cbd5e1',
    lineHeight: 26,
  },

  // ── EMPTY STATE ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 22,
  },
  emptyStateIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // ── NAVBAR (sin cambios) ──
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});