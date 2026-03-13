import { supabase } from '../supabase/supabase';

export const getPatientHistory = async (userEmail: string) => {
  // Primero buscamos el ID numérico en tu tabla 'usuarios'
  const { data: usuario, error: errorUsuario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('correo', userEmail) 
    .single();

  if (errorUsuario || !usuario) return [];

  // Luego buscamos las citas usando ese ID numérico
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
};