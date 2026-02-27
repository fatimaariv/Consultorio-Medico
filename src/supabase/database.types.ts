export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      citas: {
        Row: {
          estado: string
          fecha: string
          fecha_creacion: string
          hora: string
          id: number
          id_consultorio: number | null
          id_doctor: number
          id_paciente: number
          motivo: string
        }
        Insert: {
          estado: string
          fecha: string
          fecha_creacion?: string
          hora: string
          id?: never
          id_consultorio?: number | null
          id_doctor: number
          id_paciente: number
          motivo: string
        }
        Update: {
          estado?: string
          fecha?: string
          fecha_creacion?: string
          hora?: string
          id?: never
          id_consultorio?: number | null
          id_doctor?: number
          id_paciente?: number
          motivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "citas_id_consultorio_fkey"
            columns: ["id_consultorio"]
            isOneToOne: false
            referencedRelation: "consultorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_id_doctor_fkey"
            columns: ["id_doctor"]
            isOneToOne: false
            referencedRelation: "doctores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas: {
        Row: {
          diagnostico: string
          estatura: number
          fecha: string
          id: number
          id_cita: number
          id_doctor: number
          id_paciente: number
          notas: string | null
          peso: number
          presion: string
          sintomas: string
          temperatura: number
          tratamiento: string
        }
        Insert: {
          diagnostico: string
          estatura: number
          fecha: string
          id?: never
          id_cita: number
          id_doctor: number
          id_paciente: number
          notas?: string | null
          peso: number
          presion: string
          sintomas: string
          temperatura: number
          tratamiento: string
        }
        Update: {
          diagnostico?: string
          estatura?: number
          fecha?: string
          id?: never
          id_cita?: number
          id_doctor?: number
          id_paciente?: number
          notas?: string | null
          peso?: number
          presion?: string
          sintomas?: string
          temperatura?: number
          tratamiento?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_id_cita_fkey"
            columns: ["id_cita"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_id_doctor_fkey"
            columns: ["id_doctor"]
            isOneToOne: false
            referencedRelation: "doctores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      consultorios: {
        Row: {
          estado: string
          id: number
          numero: string
        }
        Insert: {
          estado: string
          id?: never
          numero: string
        }
        Update: {
          estado?: string
          id?: never
          numero?: string
        }
        Relationships: []
      }
      doctores: {
        Row: {
          cedula: string
          especialidad: string
          hora_fin: string
          hora_inicio: string
          id: number
        }
        Insert: {
          cedula: string
          especialidad: string
          hora_fin: string
          hora_inicio: string
          id: number
        }
        Update: {
          cedula?: string
          especialidad?: string
          hora_fin?: string
          hora_inicio?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctores_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          enfermedades: string
          fecha_nacimiento: string
          id: number
        }
        Insert: {
          enfermedades: string
          fecha_nacimiento: string
          id: number
        }
        Update: {
          enfermedades?: string
          fecha_nacimiento?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          descripcion?: string | null
          id?: never
          nombre: string
        }
        Update: {
          descripcion?: string | null
          id?: never
          nombre?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          apellido1: string
          apellido2: string | null
          contrasena: string
          correo: string
          genero: string
          id: number
          id_rol: number
          nombre: string
          telefono: string | null
        }
        Insert: {
          apellido1: string
          apellido2?: string | null
          contrasena: string
          correo: string
          genero: string
          id?: never
          id_rol: number
          nombre: string
          telefono?: string | null
        }
        Update: {
          apellido1?: string
          apellido2?: string | null
          contrasena?: string
          correo?: string
          genero?: string
          id?: never
          id_rol?: number
          nombre?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_rol_fkey"
            columns: ["id_rol"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
