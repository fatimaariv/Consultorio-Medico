import { supabase } from '../supabase/supabase';

export const doctoresService = {
  async getAll() {
    const { data, error } = await supabase
      .from('doctores')
      .select(`
        id,
        especialidad,
        cedula,
        usuarios (nombre, apellido1, apellido2)
      `);
    if (error) throw error;
    return data ?? []; // ✅ nunca retorna null
  },

  async delete(id: number) {
    const { error } = await supabase.from('doctores').delete().eq('id', id);
    if (error) throw error;
  }
};