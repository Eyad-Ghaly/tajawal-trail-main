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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          related_id: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          related_id?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          related_id?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon_path: string | null
          id: string
          title: string
          xp_required: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_path?: string | null
          id?: string
          title: string
          xp_required?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_path?: string | null
          id?: string
          title?: string
          xp_required?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          lesson_id: string | null
          level_classroom: Database["public"]["Enums"]["user_level"] | null
          message: string
          parent_message_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          lesson_id?: string | null
          level_classroom?: Database["public"]["Enums"]["user_level"] | null
          message: string
          parent_message_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          lesson_id?: string | null
          level_classroom?: Database["public"]["Enums"]["user_level"] | null
          message?: string
          parent_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_lessons: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
          video_link: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
          video_link?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_lessons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_lessons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkin: {
        Row: {
          created_at: string | null
          data_task: boolean | null
          date: string
          id: string
          lang_task: boolean | null
          soft_task: boolean | null
          user_id: string
          xp_generated: number | null
        }
        Insert: {
          created_at?: string | null
          data_task?: boolean | null
          date?: string
          id?: string
          lang_task?: boolean | null
          soft_task?: boolean | null
          user_id: string
          xp_generated?: number | null
        }
        Update: {
          created_at?: string | null
          data_task?: boolean | null
          date?: string
          id?: string
          lang_task?: boolean | null
          soft_task?: boolean | null
          user_id?: string
          xp_generated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          level: Database["public"]["Enums"]["user_level"] | null
          order_index: number | null
          published: boolean | null
          title: string
          track_type: Database["public"]["Enums"]["track_type"]
          updated_at: string | null
          video_link: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          level?: Database["public"]["Enums"]["user_level"] | null
          order_index?: number | null
          published?: boolean | null
          title: string
          track_type: Database["public"]["Enums"]["track_type"]
          updated_at?: string | null
          video_link?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          level?: Database["public"]["Enums"]["user_level"] | null
          order_index?: number | null
          published?: boolean | null
          title?: string
          track_type?: Database["public"]["Enums"]["track_type"]
          updated_at?: string | null
          video_link?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          data_progress: number | null
          english_progress: number | null
          full_name: string
          governorate: string | null
          id: string
          join_date: string | null
          level: Database["public"]["Enums"]["user_level"] | null
          membership_number: string | null
          overall_progress: number | null
          placement_test_url: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          soft_progress: number | null
          status: string | null
          streak_days: number | null
          updated_at: string | null
          xp_total: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          data_progress?: number | null
          english_progress?: number | null
          full_name: string
          governorate?: string | null
          id: string
          join_date?: string | null
          level?: Database["public"]["Enums"]["user_level"] | null
          membership_number?: string | null
          overall_progress?: number | null
          placement_test_url?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          soft_progress?: number | null
          status?: string | null
          streak_days?: number | null
          updated_at?: string | null
          xp_total?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          data_progress?: number | null
          english_progress?: number | null
          full_name?: string
          governorate?: string | null
          id?: string
          join_date?: string | null
          level?: Database["public"]["Enums"]["user_level"] | null
          membership_number?: string | null
          overall_progress?: number | null
          placement_test_url?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          soft_progress?: number | null
          status?: string | null
          streak_days?: number | null
          updated_at?: string | null
          xp_total?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          level: Database["public"]["Enums"]["user_level"] | null
          published: boolean | null
          resource_link: string | null
          title: string
          track_type: Database["public"]["Enums"]["track_type"]
          updated_at: string | null
          xp: number | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["user_level"] | null
          published?: boolean | null
          resource_link?: string | null
          title: string
          track_type: Database["public"]["Enums"]["track_type"]
          updated_at?: string | null
          xp?: number | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["user_level"] | null
          published?: boolean | null
          resource_link?: string | null
          title?: string
          track_type?: Database["public"]["Enums"]["track_type"]
          updated_at?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lessons: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          user_id: string
          watched: boolean | null
          watched_at: string | null
          xp_granted: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
          watched?: boolean | null
          watched_at?: string | null
          xp_granted?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
          watched?: boolean | null
          watched_at?: string | null
          xp_granted?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lessons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lessons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completion_proof: string | null
          created_at: string | null
          id: string
          proof_type: Database["public"]["Enums"]["proof_type"] | null
          rejection_reason: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          submitted_at: string | null
          task_id: string
          user_id: string
          xp_granted: number | null
        }
        Insert: {
          completion_proof?: string | null
          created_at?: string | null
          id?: string
          proof_type?: Database["public"]["Enums"]["proof_type"] | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          submitted_at?: string | null
          task_id: string
          user_id: string
          xp_granted?: number | null
        }
        Update: {
          completion_proof?: string | null
          created_at?: string | null
          id?: string
          proof_type?: Database["public"]["Enums"]["proof_type"] | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          submitted_at?: string | null
          task_id?: string
          user_id?: string
          xp_granted?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          level: Database["public"]["Enums"]["user_level"] | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          level?: Database["public"]["Enums"]["user_level"] | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          level?: Database["public"]["Enums"]["user_level"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_track_progress: {
        Args: {
          p_track_type: Database["public"]["Enums"]["track_type"]
          p_user_id: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "learner"
      proof_type: "file" | "link" | "text"
      task_status: "pending" | "submitted" | "approved" | "rejected"
      track_type: "data" | "english" | "soft"
      user_level: "Beginner" | "Intermediate" | "Advanced"
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
    Enums: {
      app_role: ["admin", "learner"],
      proof_type: ["file", "link", "text"],
      task_status: ["pending", "submitted", "approved", "rejected"],
      track_type: ["data", "english", "soft"],
      user_level: ["Beginner", "Intermediate", "Advanced"],
    },
  },
} as const
