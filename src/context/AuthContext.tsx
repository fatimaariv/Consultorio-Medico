// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase';

// 1. Definimos qué datos compartirá el contexto
export const AuthContext = createContext<{ 
  session: Session | null, 
  userRole: number | null,
  loading: boolean 
}>({ 
  session: null, 
  userRole: null, 
  loading: true 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Función para obtener el rol desde la tabla 'usuarios'
  const fetchRole = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id_rol')
        .eq('correo', email) // Usamos el correo para vincular Auth con tu tabla
        .single();

      if (data) {
        setUserRole(data.id_rol);
      }
    } catch (err) {
      console.error("Error obteniendo rol:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Escuchar cambios en la sesión (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session?.user?.email) {
        await fetchRole(session.user.email);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    // Cargar sesión inicial al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        fetchRole(session.user.email);
      } else {
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};