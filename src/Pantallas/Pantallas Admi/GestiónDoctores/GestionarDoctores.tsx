import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  doctoresAdminService,
  DoctorConUsuario,
  DoctorFormData,
  UsuarioPaciente,
} from '../../../services/Doctoresadminservice';
import FormularioDoctor from './Formulariodoctor';
 
// ─── Constantes (igual que AdmiHome) ─────────────────────────────────────────
const BLUE      = '#2563eb';
const BLUE_DARK = '#1a4fd6';
 
// ─── Componente ───────────────────────────────────────────────────────────────
export default function GestionarDoctores({ navigation }: any) {
  const [doctores,      setDoctores]      = useState<DoctorConUsuario[]>([]);
  const [pacientes,     setPacientes]     = useState<UsuarioPaciente[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refrescando,   setRefrescando]   = useState(false);
  const [busqueda,      setBusqueda]      = useState('');
  const [modalVisible,  setModalVisible]  = useState(false);
  const [doctorEditar,  setDoctorEditar]  = useState<DoctorConUsuario | null>(null);
 
  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = async (esRefresco = false) => {
    if (esRefresco) setRefrescando(true);
    else setLoading(true);
    try {
      const [docs, pacs] = await Promise.all([
        doctoresAdminService.obtenerDoctores(),
        doctoresAdminService.obtenerPacientes(),
      ]);
      setDoctores(docs);
      setPacientes(pacs);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
      setRefrescando(false);
    }
  };
 
  useFocusEffect(useCallback(() => { fetchData(); }, []));
 
  // ── Filtro búsqueda ───────────────────────────────────────────────────────
  const doctoresFiltrados = doctores.filter((d) => {
    const t = busqueda.toLowerCase();
    const nombre = `${d.usuario.nombre} ${d.usuario.apellido1} ${d.usuario.apellido2}`.toLowerCase();
    return nombre.includes(t) || d.especialidad.toLowerCase().includes(t) || d.cedula.toLowerCase().includes(t);
  });
 
  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleCrear = () => { setDoctorEditar(null); setModalVisible(true); };
 
  const handleEditar = (doctor: DoctorConUsuario) => { setDoctorEditar(doctor); setModalVisible(true); };
 
  const handleGuardar = async (data: DoctorFormData) => {
    if (doctorEditar) {
      await doctoresAdminService.actualizarDoctor(doctorEditar.id, data);
    } else {
      await doctoresAdminService.crearDoctor(data);
    }
    await fetchData();
  };
 
  const handleEliminar = (doctor: DoctorConUsuario) => {
    const nombre = `${doctor.usuario.nombre} ${doctor.usuario.apellido1}`;
    Alert.alert(
      'Quitar doctor',
      `¿Deseas quitar a ${nombre} del rol de doctor? Su cuenta volverá a ser paciente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar', style: 'destructive',
          onPress: async () => {
            try {
              await doctoresAdminService.eliminarDoctor(doctor.id);
              await fetchData();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };
 
  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Cargando doctores...</Text>
      </View>
    );
  }
 
  // ── Render tarjeta doctor ─────────────────────────────────────────────────
  const renderDoctor = ({ item, index }: { item: DoctorConUsuario; index: number }) => {
    const iniciales = `${item.usuario.nombre[0] ?? ''}${item.usuario.apellido1[0] ?? ''}`.toUpperCase();
    const hora = `${item.hora_inicio.slice(0, 5)} – ${item.hora_fin.slice(0, 5)}`;
 
    return (
      <View style={[styles.doctorCard, index === 0 && styles.doctorCardFirst]}>
        {/* Acento lateral (igual que citaAccent en AdmiHome) */}
        <View style={[styles.cardAccent, index === 0 && styles.cardAccentFirst]} />
 
        <View style={styles.cardBody}>
          {/* Fila superior */}
          <View style={styles.cardTopRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{iniciales}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorNombre}>
                Dr. {item.usuario.nombre} {item.usuario.apellido1} {item.usuario.apellido2}
              </Text>
              <Text style={styles.doctorCorreo}>{item.usuario.correo}</Text>
            </View>
            {/* Acciones */}
            <View style={styles.accionesWrap}>
              <TouchableOpacity style={styles.btnEditar} onPress={() => handleEditar(item)}>
                <Ionicons name="create-outline" size={16} color={BLUE} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnEliminar} onPress={() => handleEliminar(item)}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
 
          {/* Badges info */}
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="medical" size={11} color={BLUE} />
              <Text style={[styles.badgeText, { color: BLUE }]}>{item.especialidad}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="time-outline" size={11} color="#059669" />
              <Text style={[styles.badgeText, { color: '#059669' }]}>{hora}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#f8fafc' }]}>
              <Ionicons name="card-outline" size={11} color="#64748b" />
              <Text style={[styles.badgeText, { color: '#64748b' }]}>{item.cedula}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
 
  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />
 
      {/* ── HEADER (igual al de AdmiHome) ── */}
      <View style={styles.header}>
        <View style={styles.headerBubble1} />
        <View style={styles.headerBubble2} />
 
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoText}>Medi Track · Panel Admin</Text>
            <Text style={styles.headerTitulo}>Gestión de Doctores</Text>
            <Text style={styles.headerSubtitulo}>
              {doctores.length} {doctores.length === 1 ? 'especialista registrado' : 'especialistas registrados'}
            </Text>
          </View>
          <TouchableOpacity style={styles.btnAgregar} onPress={handleCrear}>
            <Ionicons name="person-add-outline" size={16} color="#fff" />
            <Text style={styles.btnAgregarTexto}>Agregar</Text>
          </TouchableOpacity>
        </View>
 
        {/* Mini stat en header */}
        <View style={styles.headerStatsRow}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>{doctores.length}</Text>
            <Text style={styles.headerStatLabel}>Doctores</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>{pacientes.length}</Text>
            <Text style={styles.headerStatLabel}>Pacientes disponibles</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>
              {[...new Set(doctores.map(d => d.especialidad))].length}
            </Text>
            <Text style={styles.headerStatLabel}>Especialidades</Text>
          </View>
        </View>
      </View>
 
      {/* ── BUSCADOR ── */}
      <View style={styles.buscadorWrap}>
        <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.buscador}
          placeholder="Buscar por nombre, especialidad o cédula..."
          placeholderTextColor="#94a3b8"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>
 
      {/* ── LISTA ── */}
      {doctoresFiltrados.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="medkit-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay doctores registrados aún.'}
          </Text>
          {!busqueda && (
            <TouchableOpacity style={styles.btnAgregarEmpty} onPress={handleCrear}>
              <Ionicons name="person-add-outline" size={16} color="#fff" />
              <Text style={styles.btnAgregarEmptyTexto}>Registrar primer doctor</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={doctoresFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderDoctor}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => fetchData(true)}
              colors={[BLUE]}
              tintColor={BLUE}
            />
          }
        />
      )}
 
      {/* ── MODAL ── */}
      <FormularioDoctor
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onGuardar={handleGuardar}
        doctorEditar={doctorEditar}
        pacientes={pacientes}
      />
    </SafeAreaView>
  );
}
 
// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f0f4ff' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 15 },
 
  // ── Header (copia fiel de AdmiHome) ──
  header: {
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 18 : 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerBubble1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  headerBubble2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 10, left: -20,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 20,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 18,
  },
  logoText: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitulo:   { fontSize: 21, fontWeight: 'bold', color: '#fff' },
  headerSubtitulo:{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontStyle: 'italic' },
  btnAgregar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 18,
  },
  btnAgregarTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerStatsRow: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  headerStat:        { alignItems: 'center', flex: 1 },
  headerStatNum:     { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerStatLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'center' },
  headerStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
 
  // ── Buscador ──
  buscadorWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 22, marginBottom: 14,
    borderRadius: 14, paddingHorizontal: 14, height: 46,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  buscador: { flex: 1, fontSize: 14, color: '#1e293b' },
 
  // ── Lista ──
  lista: { paddingHorizontal: 22, paddingBottom: 28 },
 
  // ── Tarjeta doctor (copia patrón citaCard de AdmiHome) ──
  doctorCard: {
    backgroundColor: '#fff', marginBottom: 10,
    borderRadius: 16, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  doctorCardFirst: {
    shadowColor: BLUE, shadowOpacity: 0.1,
  },
  cardAccent:      { width: 5, backgroundColor: '#cbd5e1' },
  cardAccentFirst: { backgroundColor: BLUE },
  cardBody:        { flex: 1, padding: 14 },
 
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  avatarWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { fontSize: 14, fontWeight: '700', color: BLUE },
  doctorNombre:  { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  doctorCorreo:  { fontSize: 12, color: '#64748b', marginTop: 1 },
 
  accionesWrap: { flexDirection: 'row', gap: 6 },
  btnEditar: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
  },
  btnEliminar: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
  },
 
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
 
  // ── Empty state (igual que AdmiHome) ──
  emptyState: {
    alignItems: 'center', paddingVertical: 48,
    paddingHorizontal: 22,
  },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 12, marginBottom: 20 },
  btnAgregarEmpty: {
    backgroundColor: BLUE, flexDirection: 'row',
    alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnAgregarEmptyTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
});