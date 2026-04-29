import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { consultoriosService } from '../../../services/consultoriosService';
import ConsultorioModal from './ConsultorioModal';

type Consultorio = {
  id: number;
  numero: string;
  estado: string;
};

const ESTADO_CONFIG: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  disponible: { color: '#10b981', bg: '#ecfdf5', icon: 'checkmark-circle', label: 'Disponible' },
  ocupado: { color: '#f59e0b', bg: '#fffbeb', icon: 'time', label: 'Ocupado' },
  mantenimiento: { color: '#ef4444', bg: '#fef2f2', icon: 'construct', label: 'Mantenimiento' },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { color: '#64748b', bg: '#f1f5f9', icon: 'ellipse-outline', label: estado };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={12} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function StatsBar({ consultorios }: { consultorios: Consultorio[] }) {
  const counts = {
    disponible: consultorios.filter((c) => c.estado === 'disponible').length,
    ocupado: consultorios.filter((c) => c.estado === 'ocupado').length,
    mantenimiento: consultorios.filter((c) => c.estado === 'mantenimiento').length,
  };
  return (
    <View style={styles.statsBar}>
      {Object.entries(counts).map(([key, val]) => {
        const cfg = ESTADO_CONFIG[key];
        return (
          <View key={key} style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: cfg.color }]} />
            <Text style={styles.statNum}>{val}</Text>
            <Text style={styles.statLabel}>{cfg.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function GestionarConsultorios() {
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [consultorioEditando, setConsultorioEditando] = useState<Consultorio | null>(null);

  const cargarConsultorios = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await consultoriosService.getAll();
      setConsultorios(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargarConsultorios(); }, []);

  const handleEdit = (item: Consultorio) => {
    setConsultorioEditando(item);
    setModalVisible(true);
  };

  const handleNew = () => {
    setConsultorioEditando(null);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Consultorio }) => {
    const cfg = ESTADO_CONFIG[item.estado] ?? ESTADO_CONFIG['disponible'];
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleEdit(item)} activeOpacity={0.75}>
        {/* Left accent bar */}
        <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

        <View style={styles.cardBody}>
          <View style={styles.cardMain}>
            <View style={[styles.cardIconWrap, { backgroundColor: cfg.bg }]}>
              <Ionicons name="business" size={20} color={cfg.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Consultorio {item.numero}</Text>
              <EstadoBadge estado={item.estado} />
            </View>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={17} color="#64748b" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Consultorios</Text>
          <Text style={styles.headerSub}>
            {consultorios.length} {consultorios.length === 1 ? 'consultorio registrado' : 'consultorios registrados'}
          </Text>
        </View>
        <View style={[styles.headerIconWrap]}>
          <Ionicons name="business-outline" size={22} color="#0ea5e9" />
        </View>
      </View>

      {/* Stats */}
      {!loading && consultorios.length > 0 && <StatsBar consultorios={consultorios} />}

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando consultorios...</Text>
        </View>
      ) : (
        <FlatList
          data={consultorios}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => cargarConsultorios(true)}
              tintColor="#0ea5e9"
              colors={['#0ea5e9']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="business-outline" size={36} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Sin consultorios</Text>
              <Text style={styles.emptyDesc}>Agrega el primer consultorio con el botón +</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleNew} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ConsultorioModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => cargarConsultorios()}
        consultorioEditando={consultorioEditando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
});