import { supabase } from '../supabase/supabase';
 
export interface DoctorConUsuario {
  id: number;
  especialidad: string;
  cedula: string;
  hora_inicio: string;
  hora_fin: string;
  usuario: {
    id: number;
    nombre: string;
    apellido1: string;
    apellido2: string;
    correo: string;
    telefono: string;
    genero: string;
    id_rol: number;
  };
}
 
export interface UsuarioPaciente {
  id: number;
  nombre: string;
  apellido1: string;
  apellido2: string;
  correo: string;
  telefono: string;
  id_rol: number;
}
 
export interface DoctorFormData {
  id_usuario: number;
  especialidad: string;
  cedula: string;
  hora_inicio: string;
  hora_fin: string;
}
 
// ⚠️ Verifica estos IDs en tu tabla `roles` de Supabase
const ROL_DOCTOR_ID   = 2;
const ROL_PACIENTE_ID = 3;
 
export const doctoresAdminService = {
 
  async obtenerDoctores(): Promise<DoctorConUsuario[]> {
  const { data, error } = await supabase
    .from('doctores')
    .select(`
      id,
      especialidad,
      cedula,
      hora_inicio,
      hora_fin,
      usuario:usuarios!doctores_id_fkey (
        id, nombre, apellido1, apellido2,
        correo, telefono, genero, id_rol
      )
    `);
  if (error) throw error;
  return data as unknown as DoctorConUsuario[];
},
 
  async obtenerPacientes(): Promise<UsuarioPaciente[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido1, apellido2, correo, telefono, id_rol')
      .eq('id_rol', ROL_PACIENTE_ID);
    if (error) throw error;
    return data as UsuarioPaciente[];
  },
 
  async crearDoctor(form: DoctorFormData): Promise<void> {
    const { error: rolError } = await supabase
      .from('usuarios')
      .update({ id_rol: ROL_DOCTOR_ID })
      .eq('id', form.id_usuario);
    if (rolError) throw rolError;
 
    const { error: doctorError } = await supabase
      .from('doctores')
      .insert({
        id:           form.id_usuario,
        especialidad: form.especialidad,
        cedula:       form.cedula,
        hora_inicio:  form.hora_inicio,
        hora_fin:     form.hora_fin,
      });
 
    if (doctorError) {
      await supabase.from('usuarios').update({ id_rol: ROL_PACIENTE_ID }).eq('id', form.id_usuario);
      throw doctorError;
    }
  },
 
  async actualizarDoctor(doctorId: number, form: Omit<DoctorFormData, 'id_usuario'>): Promise<void> {
    const { error } = await supabase
      .from('doctores')
      .update({
        especialidad: form.especialidad,
        cedula:       form.cedula,
        hora_inicio:  form.hora_inicio,
        hora_fin:     form.hora_fin,
      })
      .eq('id', doctorId);
    if (error) throw error;
  },
 
  async eliminarDoctor(doctorId: number): Promise<void> {
    const { error: e1 } = await supabase.from('doctores').delete().eq('id', doctorId);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from('usuarios').update({ id_rol: ROL_PACIENTE_ID }).eq('id', doctorId);
    if (e2) throw e2;
  },
};