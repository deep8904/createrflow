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
  public: {
    Tables: {
      automation_runs: {
        Row: {
          automation_id: string
          created_at: string | null
          duration: string | null
          id: string
          logs: Json | null
          status: string
          summary: string | null
        }
        Insert: {
          automation_id: string
          created_at?: string | null
          duration?: string | null
          id?: string
          logs?: Json | null
          status: string
          summary?: string | null
        }
        Update: {
          automation_id?: string
          created_at?: string | null
          duration?: string | null
          id?: string
          logs?: Json | null
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          enabled: boolean | null
          frequency: string | null
          id: string
          name: string
          settings: Json | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          name: string
          settings?: Json | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          name?: string
          settings?: Json | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author: string
          author_avatar: string | null
          created_at: string | null
          id: string
          intent_tag: string | null
          like_count: number | null
          published_at: string | null
          reply_count: number | null
          sentiment: string | null
          text: string
          user_id: string
          video_id: string | null
          youtube_comment_id: string
          youtube_video_id: string
        }
        Insert: {
          author: string
          author_avatar?: string | null
          created_at?: string | null
          id?: string
          intent_tag?: string | null
          like_count?: number | null
          published_at?: string | null
          reply_count?: number | null
          sentiment?: string | null
          text: string
          user_id: string
          video_id?: string | null
          youtube_comment_id: string
          youtube_video_id: string
        }
        Update: {
          author?: string
          author_avatar?: string | null
          created_at?: string | null
          id?: string
          intent_tag?: string | null
          like_count?: number | null
          published_at?: string | null
          reply_count?: number | null
          sentiment?: string | null
          text?: string
          user_id?: string
          video_id?: string | null
          youtube_comment_id?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_messages: {
        Row: {
          content: string
          created_at: string | null
          deal_id: string
          gmail_message_id: string | null
          gmail_thread_id: string | null
          id: string
          sender: string
          subject: string | null
          timestamp: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deal_id: string
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          sender: string
          subject?: string | null
          timestamp?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deal_id?: string
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          sender?: string
          subject?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          brand_email: string | null
          brand_logo: string | null
          brand_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          deliverables: string[] | null
          extracted_data: Json | null
          gmail_thread_id: string | null
          id: string
          proposed_rate: number | null
          source: string | null
          status: string | null
          subject: string
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_email?: string | null
          brand_logo?: string | null
          brand_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          extracted_data?: Json | null
          gmail_thread_id?: string | null
          id?: string
          proposed_rate?: number | null
          source?: string | null
          status?: string | null
          subject: string
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_email?: string | null
          brand_logo?: string | null
          brand_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          extracted_data?: Json | null
          gmail_thread_id?: string | null
          id?: string
          proposed_rate?: number | null
          source?: string | null
          status?: string | null
          subject?: string
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          platform: string
          related_video_id: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          platform: string
          related_video_id?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          platform?: string
          related_video_id?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drafts_related_video_id_fkey"
            columns: ["related_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty: string | null
          estimated_length: string | null
          hooks: Json | null
          id: string
          outline: Json | null
          platform: string | null
          source: string | null
          source_type: string | null
          status: string | null
          suggested_titles: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          estimated_length?: string | null
          hooks?: Json | null
          id?: string
          outline?: Json | null
          platform?: string | null
          source?: string | null
          source_type?: string | null
          status?: string | null
          suggested_titles?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          estimated_length?: string | null
          hooks?: Json | null
          id?: string
          outline?: Json | null
          platform?: string | null
          source?: string | null
          source_type?: string | null
          status?: string | null
          suggested_titles?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token_encrypted: string | null
          channel_id: string | null
          channel_name: string | null
          channel_thumbnail: string | null
          connected: boolean | null
          created_at: string | null
          filter_keywords: string[] | null
          id: string
          last_sync_at: string | null
          provider: string
          refresh_token_encrypted: string | null
          subscribers: number | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          channel_id?: string | null
          channel_name?: string | null
          channel_thumbnail?: string | null
          connected?: boolean | null
          created_at?: string | null
          filter_keywords?: string[] | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          subscribers?: number | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          channel_id?: string | null
          channel_name?: string | null
          channel_thumbnail?: string | null
          connected?: boolean | null
          created_at?: string | null
          filter_keywords?: string[] | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          subscribers?: number | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          creator_type: string | null
          email: string | null
          id: string
          name: string | null
          onboarding_completed: boolean | null
          personal_style: Json | null
          platforms: string[] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          creator_type?: string | null
          email?: string | null
          id: string
          name?: string | null
          onboarding_completed?: boolean | null
          personal_style?: Json | null
          platforms?: string[] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          creator_type?: string | null
          email?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          personal_style?: Json | null
          platforms?: string[] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          content: string
          created_at: string
          id: string
          language: string | null
          source: string
          timestamps: Json | null
          updated_at: string
          user_id: string
          video_id: string | null
          youtube_video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          language?: string | null
          source?: string
          timestamps?: Json | null
          updated_at?: string
          user_id: string
          video_id?: string | null
          youtube_video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          language?: string | null
          source?: string
          timestamps?: Json | null
          updated_at?: string
          user_id?: string
          video_id?: string | null
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          comments_count: number | null
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          likes: number | null
          published_at: string | null
          removed_at: string | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          views: number | null
          youtube_video_id: string
        }
        Insert: {
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          likes?: number | null
          published_at?: string | null
          removed_at?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          views?: number | null
          youtube_video_id: string
        }
        Update: {
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          likes?: number | null
          published_at?: string | null
          removed_at?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views?: number | null
          youtube_video_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_automation: {
        Args: { automation_uuid: string }
        Returns: boolean
      }
      user_owns_deal: { Args: { deal_uuid: string }; Returns: boolean }
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
