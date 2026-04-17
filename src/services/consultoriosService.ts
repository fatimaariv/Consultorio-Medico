import { supabase } from '../supabase/supabase';

export const consultoriosService = {
  // Obtener todos los consultorios
  async getAll() {
    const { data, error } = await supabase.from('consultorios').select('*');
    if (error) throw error;
    return data;
  },

  // Crear nuevo
  async create(numero: string, estado: string) {
    const { data, error } = await supabase.from('consultorios').insert([{ numero, estado }]);
    if (error) throw error;
    return data;
  },

  // Actualizar
  async update(id: number, numero: string, estado: string) {
    const { data, error } = await supabase.from('consultorios').update({ numero, estado }).eq('id', id);
    if (error) throw error;
    return data;
  },

  // Eliminar
  async delete(id: number) {
    const { error } = await supabase.from('consultorios').delete().eq('id', id);
    if (error) throw error;
  }
};