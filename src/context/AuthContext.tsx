// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase';

export const AuthContext = createContext<{ 
  session: Session | null, 
  userRole: number | null,
  loading: boolean,
  setLoading: (loading: boolean) => void,
  isResettingPassword: boolean,
  setIsResettingPassword: (v: boolean) => void
}>({ 
  session: null, 
  userRole: null, 
  loading: true,
  setLoading: () => {},
  isResettingPassword: false,
  setIsResettingPassword: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Ref para que el listener siempre lea el valor actual (evita closure desactualizado)
  const isResettingRef = useRef(false);

  // Wrapper que mantiene ref y estado sincronizados
  const handleSetIsResettingPassword = (v: boolean) => {
    isResettingRef.current = v;
    setIsResettingPassword(v);
  };

  const fetchRole = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id_rol')
        .eq('correo', email)
        .single();

      if (data) {
        setUserRole(data.id_rol);
      } else {
        setUserRole(null);
      }
    } catch (err) {
      console.error("Error obteniendo rol:", err);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento de Auth:", event);

      if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        setLoading(true);
      }

      setSession(session);
      
      if (session?.user?.email) {
        // Leemos la REF (no el estado) para evitar el closure desactualizado
        if (isResettingRef.current) {
          setLoading(false); // Quitamos el spinner sin navegar
          return;
        }
        await fetchRole(session.user.email);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      userRole, 
      loading, 
      setLoading,
      isResettingPassword, 
      setIsResettingPassword: handleSetIsResettingPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};