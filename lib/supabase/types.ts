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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chunk_progress: {
        Row: {
          id: string
          user_id: string
          set_id: string
          chunk_id: string
          ease_factor: number
          interval_days: number
          repetitions: number
          last_score: number | null
          last_reviewed_at: string | null
          next_review_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          set_id: string
          chunk_id: string
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          last_score?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          set_id?: string
          chunk_id?: string
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          last_score?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunk_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunk_progress_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "memorization_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunk_progress_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      chunks: {
        Row: {
          created_at: string
          id: string
          order_index: number
          set_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index: number
          set_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          set_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunks_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "memorization_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      memorization_sets: {
        Row: {
          audio_file_path: string | null
          chunk_mode: string
          content: string
          created_at: string
          created_from: string | null
          id: string
          is_custom_chunked: boolean | null
          marked_chunks: Json | null
          original_filename: string | null
          progress: Json
          recommended_step: string
          repetition_config: Json
          repetition_mode: string
          reviewed_chunks: Json | null
          session_state: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_file_path?: string | null
          chunk_mode?: string
          content: string
          created_at?: string
          created_from?: string | null
          id?: string
          is_custom_chunked?: boolean | null
          marked_chunks?: Json | null
          original_filename?: string | null
          progress?: Json
          recommended_step?: string
          repetition_config?: Json
          repetition_mode?: string
          reviewed_chunks?: Json | null
          session_state?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_file_path?: string | null
          chunk_mode?: string
          content?: string
          created_at?: string
          created_from?: string | null
          id?: string
          is_custom_chunked?: boolean | null
          marked_chunks?: Json | null
          original_filename?: string | null
          progress?: Json
          recommended_step?: string
          repetition_config?: Json
          repetition_mode?: string
          reviewed_chunks?: Json | null
          session_state?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorization_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
          user_role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_role?: string
        }
        Relationships: []
      }
      set_tags: {
        Row: {
          created_at: string
          set_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          set_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          set_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_tags_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "memorization_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          chunk_id: string | null
          correct_words: number
          created_at: string
          id: string
          mode: string
          score: number
          set_id: string
          total_words: number
        }
        Insert: {
          chunk_id?: string | null
          correct_words?: number
          created_at?: string
          id?: string
          mode: string
          score: number
          set_id: string
          total_words?: number
        }
        Update: {
          chunk_id?: string | null
          correct_words?: number
          created_at?: string
          id?: string
          mode?: string
          score?: number
          set_id?: string
          total_words?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "memorization_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tags: {
        Args: { user_uuid: string }
        Returns: {
          name: string
        }[]
      }
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
  public: {
    Enums: {},
  },
} as const
