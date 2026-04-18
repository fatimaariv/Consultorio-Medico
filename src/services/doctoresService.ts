import { supabase } from '../supabase/supabase';

export const doctoresService = {
  async getAll() {
    // Hacemos un join con 'usuarios' para obtener el nombre del doctor
    const { data, error } = await supabase
      .from('doctores')
      .select(`
        id,
        especialidad,
        cedula,
        usuarios (nombre, apellido1, apellido2)
      `);
    if (error) throw error;
    return data;
  },

  async delete(id: number) {
    const { error } = await supabase.from('doctores').delete().eq('id', id);
    if (error) throw error;
  }
};