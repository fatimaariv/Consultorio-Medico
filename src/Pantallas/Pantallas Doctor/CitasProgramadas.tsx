import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  StatusBar, 
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CitasProgramadas() {
  const navigation = useNavigation<any>();

  // Función para manejar la navegación a la pantalla de Consulta
  const handlePressCita = () => {
    navigation.navigate('Consulta'); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Citas Programadas</Text>
        <Text style={styles.headerSubtitle}>Próximas revisiones médicas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        
        {/* CITA ESTÁTICA (BOTÓN) */}
        <TouchableOpacity 
          style={[styles.card, styles.shadow]} 
          onPress={handlePressCita}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={24} color="#3b82f6" />
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.rowJustify}>
              <Text style={styles.patientName}>Paciente de Prueba</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Hoy</Text>
              </View>
            </View>
            
            <Text style={styles.motivoText}>Motivo: Consulta General</Text>
            
            <View style={styles.dateTimeRow}>
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
              <Text style={styles.dateTimeText}> 20/04/2026</Text>
              <Ionicons name="time-outline" size={14} color="#64748b" style={{ marginLeft: 10 }} />
              <Text style={styles.dateTimeText}> 10:00 AM</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Mensaje informativo */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#64748b" />
          <Text style={styles.infoBoxText}>
            Esta es una cita estática. Al presionarla, serás redirigido a la pantalla de Consulta.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    padding: 20, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#64748b', 
    marginTop: 2 
  },
  list: { 
    padding: 16 
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContainer: { 
    flex: 1 
  },
  rowJustify: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  patientName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  motivoText: { 
    fontSize: 14, 
    color: '#475569',
    marginBottom: 6
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#64748b',
  },
  infoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18
  }
});