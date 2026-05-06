// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase';

// ─── Tipo del perfil completo (PerfilDoc) ────────────────────────────────────
export type DoctorProfile = {
  nombreCompleto: string;
  iniciales: string;
  especialidad: string;
  cedula: string;
  correo: string;
  telefono: string;
  genero: string;
  hora_inicio: string;
  hora_fin: string;
};

// ─── Tipo de la info básica del doctor (DoctorHome) ──────────────────────────
export type DoctorInfo = {
  nombre: string;
  apellido1: string;
  especialidad: string;
  cedula: string;
  hora_inicio: string;
  hora_fin: string;
  id: number | null;
};

export const AuthContext = createContext<{
  session: Session | null;
  userRole: number | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isResettingPassword: boolean;
  setIsResettingPassword: (v: boolean) => void;
  // ── Caché perfil completo (PerfilDoc) ──
  doctorProfile: DoctorProfile | null;
  setDoctorProfile: (profile: DoctorProfile | null) => void;
  // ── Caché info básica (DoctorHome) ──
  doctorInfo: DoctorInfo | null;
  setDoctorInfo: (info: DoctorInfo | null) => void;
}>({
  session: null,
  userRole: null,
  loading: true,
  setLoading: () => {},
  isResettingPassword: false,
  setIsResettingPassword: () => {},
  doctorProfile: null,
  setDoctorProfile: () => {},
  doctorInfo: null,
  setDoctorInfo: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);

  const isResettingRef = useRef(false);

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
      console.error('Error obteniendo rol:', err);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Evento de Auth:', event);

      if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        setLoading(true);
      }

      // Al cerrar sesión, limpiar todos los cachés
      if (event === 'SIGNED_OUT') {
        setDoctorProfile(null);
        setDoctorInfo(null);
      }

      setSession(session);

      if (session?.user?.email) {
        if (isResettingRef.current) {
          setLoading(false);
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
    <AuthContext.Provider
      value={{
        session,
        userRole,
        loading,
        setLoading,
        isResettingPassword,
        setIsResettingPassword: handleSetIsResettingPassword,
        doctorProfile,
        setDoctorProfile,
        doctorInfo,
        setDoctorInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};