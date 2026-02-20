import { supabase } from '../supabase/supabase';

export const login = async (email: string, pass: string) => {
  // Nota: En una app real usarías supabase.auth.signInWithPassword
  // Pero según tu archivo database.types.ts, estás manejando una tabla manual de 'usuario'
  const { data, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('correo', email)
    .eq('contrasena', pass) // ¡Cuidado! En producción las contraseñas deben estar hasheadas
    .single();

  if (error) throw new Error("Credenciales inválidas");
  return data;
};