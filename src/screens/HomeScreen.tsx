import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen({ route }: any) {
  const { user } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>¡Bienvenido, {user.nombre}!</Text>
      <Text>Tu rol es: {user.rol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcome: { fontSize: 20, fontWeight: 'bold' }
});