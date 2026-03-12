import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView // Agregamos ScrollView para consistencia
} from "react-native";

const PatientProfile = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Usamos ScrollView igual que en Home para que el comportamiento sea idéntico */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.logo}>Meditrack</Text>

          <Text style={styles.title}>Perfil del Paciente</Text>

          <View style={styles.card}>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Nombre:</Text> Juan Pérez
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Edad:</Text> 24 años
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Correo:</Text> juan@email.com
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Teléfono:</Text> 8112345678
            </Text>
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.navTextSelection}>Perfil</Text> 
          {/* Tip: Cambié el estilo aquí para que sepas que estás en Perfil */}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  scrollContent: {
    paddingBottom: 100, // IMPORTANTE: Este espacio evita que el Nav tape el botón de Editar
  },
  content: {
    padding: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: "#2563eb",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 10,
  },
  bold: {
    fontWeight: "bold",
    color: "#000",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
    // Agregamos una pequeña sombra para que se vea igual que en la foto
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navText: {
    color: "#94a3b8", // Color gris para los no seleccionados
    fontWeight: "600",
  },
  navTextSelection: {
    color: "#2563eb", // Azul para el que está activo
    fontWeight: "bold",
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  }
});

export default PatientProfile;