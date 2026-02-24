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
          id_cita: number
          id_consultorio: number
          id_doctor: number
          id_paciente: number
          motivo: string
        }
        Insert: {
          estado: string
          fecha: string
          id_cita?: number
          id_consultorio: number
          id_doctor: number
          id_paciente: number
          motivo: string
        }
        Update: {
          estado?: string
          fecha?: string
          id_cita?: number
          id_consultorio?: number
          id_doctor?: number
          id_paciente?: number
          motivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "citas_id_consultorio_fkey"
            columns: ["id_consultorio"]
            isOneToOne: false
            referencedRelation: "consultorio"
            referencedColumns: ["id_consultorio"]
          },
          {
            foreignKeyName: "citas_id_doctor_fkey"
            columns: ["id_doctor"]
            isOneToOne: false
            referencedRelation: "doctores"
            referencedColumns: ["id_doctor"]
          },
          {
            foreignKeyName: "citas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id_paciente"]
          },
        ]
      }
      consultas: {
        Row: {
          diagnostico: string
          estatura: number | null
          fecha: string
          id_cita: number
          id_consulta: number
          id_doctor: number
          id_paciente: number
          notas: string | null
          peso: number | null
          presion: string | null
          sintomas: string
          temperatura: number | null
          tratamiento: string
        }
        Insert: {
          diagnostico: string
          estatura?: number | null
          fecha: string
          id_cita: number
          id_consulta?: number
          id_doctor: number
          id_paciente: number
          notas?: string | null
          peso?: number | null
          presion?: string | null
          sintomas: string
          temperatura?: number | null
          tratamiento: string
        }
        Update: {
          diagnostico?: string
          estatura?: number | null
          fecha?: string
          id_cita?: number
          id_consulta?: number
          id_doctor?: number
          id_paciente?: number
          notas?: string | null
          peso?: number | null
          presion?: string | null
          sintomas?: string
          temperatura?: number | null
          tratamiento?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_id_cita_fkey"
            columns: ["id_cita"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id_cita"]
          },
          {
            foreignKeyName: "consultas_id_doctor_fkey"
            columns: ["id_doctor"]
            isOneToOne: false
            referencedRelation: "doctores"
            referencedColumns: ["id_doctor"]
          },
          {
            foreignKeyName: "consultas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id_paciente"]
          },
        ]
      }
      consultorio: {
        Row: {
          estado: string
          id_consultorio: number
          numero: number
        }
        Insert: {
          estado: string
          id_consultorio?: number
          numero: number
        }
        Update: {
          estado?: string
          id_consultorio?: number
          numero?: number
        }
        Relationships: []
      }
      doctores: {
        Row: {
          cedula: string
          especialidad: string
          horario_f: string
          horario_i: string
          id_doctor: number
          id_usuario: number
        }
        Insert: {
          cedula: string
          especialidad: string
          horario_f: string
          horario_i: string
          id_doctor?: number
          id_usuario: number
        }
        Update: {
          cedula?: string
          especialidad?: string
          horario_f?: string
          horario_i?: string
          id_doctor?: number
          id_usuario?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctores_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      pacientes: {
        Row: {
          enf_cronicas: string | null
          id_paciente: number
          id_usuario: number
          nacimiento: string
          sexo: string
          telefono: string | null
        }
        Insert: {
          enf_cronicas?: string | null
          id_paciente?: number
          id_usuario: number
          nacimiento: string
          sexo: string
          telefono?: string | null
        }
        Update: {
          enf_cronicas?: string | null
          id_paciente?: number
          id_usuario?: number
          nacimiento?: string
          sexo?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      usuario: {
        Row: {
          apellido_m: string
          apellido_p: string
          contrasena: string
          correo: string
          id_usuario: number
          nombre: string
          rol: string
        }
        Insert: {
          apellido_m: string
          apellido_p: string
          contrasena: string
          correo: string
          id_usuario?: number
          nombre: string
          rol: string
        }
        Update: {
          apellido_m?: string
          apellido_p?: string
          contrasena?: string
          correo?: string
          id_usuario?: number
          nombre?: string
          rol?: string
        }
        Relationships: []
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
