import { supabase } from '../supabase/supabase';

export const getPatientHistory = async (patientId: number) => {
  const { data, error } = await supabase
    .from('citas')
    .select('*, doctores(nombre)') // Trae la info de la cita y el nombre del doctor
    .eq('id_paciente', patientId)
    .eq('estado', 'completada') // O como lo llames en tu base de datos
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data;
};