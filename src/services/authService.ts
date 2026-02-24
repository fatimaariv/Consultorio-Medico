import { supabase } from '../supabase/supabase';

export const login = async (email: string, pass: string) => {
  // 1. Validamos con el sistema de Autenticación de Supabase.
  // Esto comprueba que el usuario existe en la lista de "Authentication" 
  // y que la contraseña es correcta.
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: pass,
  });

  // Si hay error aquí, es porque la contraseña está mal o el correo no existe en Auth
  if (authError) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  // 2. Si la contraseña es correcta, buscamos los datos adicionales 
  // (nombre, apellido, rol) en tu tabla 'usuario' usando el correo.
  const { data, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('correo', email)
    .single();

  // Si no encuentra el registro en la tabla 'usuario'
  if (error || !data) {
    throw new Error("Sesión iniciada, pero no se encontró el perfil en la base de datos.");
  }
  
  // 3. Devolvemos los datos del usuario para que la App los use
  return data;
};