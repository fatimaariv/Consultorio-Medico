import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function GestionarUsuarios() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pantalla de Gestionar Usuarios</Text>
        <Text>Aquí se mostrarán los usuarios gestionados.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});