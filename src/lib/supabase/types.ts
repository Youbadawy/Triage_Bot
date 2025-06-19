export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          caf_id: string | null
          rank: string | null
          unit: string | null
          base_location: string | null
          medical_category: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          allergies: string[] | null
          medications: string[] | null
          medical_conditions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          caf_id?: string | null
          rank?: string | null
          unit?: string | null
          base_location?: string | null
          medical_category?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          allergies?: string[] | null
          medications?: string[] | null
          medical_conditions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          caf_id?: string | null
          rank?: string | null
          unit?: string | null
          base_location?: string | null
          medical_category?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          allergies?: string[] | null
          medications?: string[] | null
          medical_conditions?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      triage_sessions: {
        Row: {
          id: string
          user_id: string
          session_start: string
          session_end: string | null
          status: string
          initial_complaint: string | null
          final_recommendation: Json | null
          appointment_type: string | null
          complexity: string | null
          urgency_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_start?: string
          session_end?: string | null
          status?: string
          initial_complaint?: string | null
          final_recommendation?: Json | null
          appointment_type?: string | null
          complexity?: string | null
          urgency_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_start?: string
          session_end?: string | null
          status?: string
          initial_complaint?: string | null
          final_recommendation?: Json | null
          appointment_type?: string | null
          complexity?: string | null
          urgency_level?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          metadata?: Json | null
          timestamp?: string
        }
      }
      medical_references: {
        Row: {
          id: string
          title: string
          document_type: string
          source: string
          url: string | null
          content: string
          version: string | null
          effective_date: string | null
          last_updated: string
          is_active: boolean | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          document_type: string
          source: string
          url?: string | null
          content: string
          version?: string | null
          effective_date?: string | null
          last_updated?: string
          is_active?: boolean | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          document_type?: string
          source?: string
          url?: string | null
          content?: string
          version?: string | null
          effective_date?: string | null
          last_updated?: string
          is_active?: boolean | null
          tags?: string[] | null
          created_at?: string
        }
      }
      document_chunks: {
        Row: {
          id: string
          reference_id: string
          chunk_index: number
          content: string
          embedding: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          reference_id: string
          chunk_index: number
          content: string
          embedding?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          reference_id?: string
          chunk_index?: number
          content?: string
          embedding?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      appointment_bookings: {
        Row: {
          id: string
          session_id: string
          user_id: string
          appointment_type: string
          preferred_date: string | null
          preferred_time: string | null
          clinic_location: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          appointment_type: string
          preferred_date?: string | null
          preferred_time?: string | null
          clinic_location?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          appointment_type?: string
          preferred_date?: string | null
          preferred_time?: string | null
          clinic_location?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_medical_documents: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          reference_id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      get_user_recent_sessions: {
        Args: {
          user_uuid: string
          limit_count?: number
        }
        Returns: {
          id: string
          session_start: string
          status: string
          initial_complaint: string
          appointment_type: string
          complexity: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type TriageSession = Database['public']['Tables']['triage_sessions']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type MedicalReference = Database['public']['Tables']['medical_references']['Row']
export type DocumentChunk = Database['public']['Tables']['document_chunks']['Row']
export type AppointmentBooking = Database['public']['Tables']['appointment_bookings']['Row']

export type NewUserProfile = Database['public']['Tables']['user_profiles']['Insert']
export type NewTriageSession = Database['public']['Tables']['triage_sessions']['Insert']
export type NewChatMessage = Database['public']['Tables']['chat_messages']['Insert']
export type NewAppointmentBooking = Database['public']['Tables']['appointment_bookings']['Insert'] 