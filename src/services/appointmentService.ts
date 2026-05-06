import { supabase } from '../supabase/supabase';

export const getPatientHistory = async (userEmail: string) => {
  const { data: usuario, error: errorUsuario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('correo', userEmail)
    .single();

  if (errorUsuario || !usuario) return [];

  const { data, error } = await supabase
    .from('citas')
    .select(`
      id,
      fecha,
      motivo,
      doctores (
        nombre
      )
    `)
    .eq('id_paciente', usuario.id)
    .eq('estado', 'completada')
    .order('fecha', { ascending: false });

  if (error) return []; 
  return data ?? [];    
};