import { supabase } from '../supabase/supabase';

// ─── Constantes de negocio ────────────────────────────────────────────────────
// Rango operativo: 07:00 – 21:00 → 14 slots de 1 hora
const HORA_INICIO = 7;
const HORA_FIN    = 21;

// ─── Helpers internos ─────────────────────────────────────────────────────────

/** Genera los strings "HH:00" del rango operativo (07:00 … 20:00). */
function generarSlotsDelDia(): string[] {
  const slots: string[] = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
}

/** Devuelve los slots horarios libres para un consultorio en una fecha "YYYY-MM-DD". */
async function calcularSlotsLibres(idConsultorio: number, fecha: string): Promise<string[]> {
  const { data: citas, error } = await supabase
    .from('citas')
    .select('hora')
    .eq('id_consultorio', idConsultorio)
    .eq('fecha', fecha)
    .neq('estado', 'cancelada');

  if (error) throw error;

  const horasOcupadas = new Set((citas ?? []).map((c: any) => c.hora.slice(0, 5)));
  return generarSlotsDelDia().filter((s) => !horasOcupadas.has(s));
}

/**
 * Evalúa la ocupación de HOY y actualiza el estado en Supabase si es necesario.
 * - libre === 0  → 'ocupado'
 * - libre  > 0 y estado era 'ocupado' → 'disponible'
 * - 'mantenimiento' → sin cambios
 */
async function sincronizarEstadoHoy(consultorio: { id: number; estado: string }): Promise<void> {
  if (consultorio.estado === 'mantenimiento') return;

  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const libres      = await calcularSlotsLibres(consultorio.id, fecha);
  const nuevoEstado = libres.length === 0 ? 'ocupado' : 'disponible';

  if (nuevoEstado !== consultorio.estado) {
    await supabase
      .from('consultorios')
      .update({ estado: nuevoEstado })
      .eq('id', consultorio.id);
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const consultoriosService = {
  /** Total de slots horarios disponibles en un día operativo (usado en el Modal). */
  TOTAL_SLOTS: HORA_FIN - HORA_INICIO, // 14

  // ── Obtener todos ──────────────────────────────────────────────────────────
  // Sincroniza el estado de cada consultorio con la agenda de hoy antes de devolver.
  async getAll() {
    const { data, error } = await supabase
      .from('consultorios')
      .select('*')
      .order('numero');
    if (error) throw error;

    // Sincronización en paralelo (sin bloquear si alguna falla)
    await Promise.allSettled((data ?? []).map((c: any) => sincronizarEstadoHoy(c)));

    // Re-fetch para devolver los estados ya actualizados
    const { data: actualizados, error: err2 } = await supabase
      .from('consultorios')
      .select('*')
      .order('numero');
    if (err2) throw err2;
    return actualizados;
  },

  // ── Crear ──────────────────────────────────────────────────────────────────
  // Solo acepta 'disponible' | 'mantenimiento'; 'ocupado' lo gestiona el sistema.
  async create(numero: string, estado: 'disponible' | 'mantenimiento') {
    const { data, error } = await supabase
      .from('consultorios')
      .insert([{ numero, estado }]);
    if (error) throw error;
    return data;
  },

  // ── Actualizar ─────────────────────────────────────────────────────────────
  async update(id: number, numero: string, estado: 'disponible' | 'mantenimiento') {
    const { data, error } = await supabase
      .from('consultorios')
      .update({ numero, estado })
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // ── Eliminar ───────────────────────────────────────────────────────────────
  async delete(id: number) {
    const { error } = await supabase.from('consultorios').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Slots libres de un día (usado por ConsultorioModal para el timeline) ───
  async getHorasDisponibles(idConsultorio: number, fecha: string): Promise<string[]> {
    return calcularSlotsLibres(idConsultorio, fecha);
  },

  // ── Sincronizar uno (llamado al abrir el modal de edición) ─────────────────
  async sincronizarUno(id: number) {
    const { data, error } = await supabase
      .from('consultorios')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    await sincronizarEstadoHoy(data);

    const { data: updated, error: err2 } = await supabase
      .from('consultorios')
      .select('*')
      .eq('id', id)
      .single();
    if (err2) throw err2;
    return updated;
  },
};