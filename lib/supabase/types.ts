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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          user_role: 'admin' | 'general' | 'vip'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          user_role?: 'admin' | 'general' | 'vip'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          user_role?: 'admin' | 'general' | 'vip'
          created_at?: string
          updated_at?: string
        }
      }
      memorization_sets: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          chunk_mode: 'paragraph' | 'sentence'
          progress: Json
          session_state: Json
          recommended_step: 'familiarize' | 'encode' | 'test'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          chunk_mode?: 'paragraph' | 'sentence'
          progress?: Json
          session_state?: Json
          recommended_step?: 'familiarize' | 'encode' | 'test'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          chunk_mode?: 'paragraph' | 'sentence'
          progress?: Json
          session_state?: Json
          recommended_step?: 'familiarize' | 'encode' | 'test'
          created_at?: string
          updated_at?: string
        }
      }
      chunks: {
        Row: {
          id: string
          set_id: string
          order_index: number
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          set_id: string
          order_index: number
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          order_index?: number
          text?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      set_tags: {
        Row: {
          set_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          set_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          set_id?: string
          tag_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tags: {
        Args: { user_uuid: string }
        Returns: { name: string }[]
      }
    }
    Enums: {
      chunk_mode: 'paragraph' | 'sentence'
      recommended_step: 'familiarize' | 'encode' | 'test'
    }
  }
}
