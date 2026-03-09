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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          clicked_at: string
          converted: boolean | null
          course_id: string
          id: string
          ip_hash: string | null
          referrer: string | null
          revenue: number | null
        }
        Insert: {
          clicked_at?: string
          converted?: boolean | null
          course_id: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          revenue?: number | null
        }
        Update: {
          clicked_at?: string
          converted?: boolean | null
          course_id?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_reports: {
        Row: {
          business_id: string
          content: string
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          report_type: string
        }
        Insert: {
          business_id: string
          content: string
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          report_type?: string
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      approved_categories: {
        Row: {
          auto_approved: boolean
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          auto_approved?: boolean
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          auto_approved?: boolean
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      business_responses: {
        Row: {
          business_id: string
          created_at: string
          id: string
          review_id: string
          text: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          review_id: string
          text: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          review_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      business_webhooks: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          events: string[]
          id: string
          last_triggered_at: string | null
          secret: string | null
          url: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          events?: string[]
          id?: string
          last_triggered_at?: string | null
          secret?: string | null
          url: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          events?: string[]
          id?: string
          last_triggered_at?: string | null
          secret?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_webhooks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          difficulty_level: string | null
          email: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          rating: number | null
          review_count: number | null
          slug: string
          social_links: Json | null
          subscription_tier: string
          target_audience: string | null
          updated_at: string
          verified: boolean | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug: string
          social_links?: Json | null
          subscription_tier?: string
          target_audience?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          social_links?: Json | null
          subscription_tier?: string
          target_audience?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          affiliate_url: string | null
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration: string | null
          format: string | null
          id: string
          name: string
          price: number | null
          rating: number | null
          review_count: number | null
          updated_at: string
          verified_purchases: number | null
        }
        Insert: {
          affiliate_url?: string | null
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: string | null
          format?: string | null
          id?: string
          name: string
          price?: number | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          verified_purchases?: number | null
        }
        Update: {
          affiliate_url?: string | null
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: string | null
          format?: string | null
          id?: string
          name?: string
          price?: number | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          verified_purchases?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_receipts: {
        Row: {
          ai_analysis: Json | null
          ai_match_score: number | null
          business_id: string
          course_id: string | null
          created_at: string
          file_path: string
          file_type: string
          id: string
          reviewed_at: string | null
          user_id: string
          verification_status: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_match_score?: number | null
          business_id: string
          course_id?: string | null
          created_at?: string
          file_path: string
          file_type?: string
          id?: string
          reviewed_at?: string | null
          user_id: string
          verification_status?: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_match_score?: number | null
          business_id?: string
          course_id?: string | null
          created_at?: string
          file_path?: string
          file_type?: string
          id?: string
          reviewed_at?: string | null
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_receipts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_receipts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          ai_extracted_data: Json | null
          business_id: string
          created_at: string
          file_path: string
          file_type: string
          id: string
        }
        Insert: {
          ai_extracted_data?: Json | null
          business_id: string
          created_at?: string
          file_path: string
          file_type?: string
          id?: string
        }
        Update: {
          ai_extracted_data?: Json | null
          business_id?: string
          created_at?: string
          file_path?: string
          file_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_id: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          id: string
          notes: string | null
          review_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          notes?: string | null
          review_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          notes?: string | null
          review_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_top5: {
        Row: {
          ai_reasoning: string | null
          business_name: string
          business_slug: string
          business_type: string
          category: string
          created_at: string
          id: string
          month_year: string
          rank: number
          rating: number
          review_count: number
        }
        Insert: {
          ai_reasoning?: string | null
          business_name: string
          business_slug: string
          business_type: string
          category: string
          created_at?: string
          id?: string
          month_year: string
          rank: number
          rating?: number
          review_count?: number
        }
        Update: {
          ai_reasoning?: string | null
          business_name?: string
          business_slug?: string
          business_type?: string
          category?: string
          created_at?: string
          id?: string
          month_year?: string
          rank?: number
          rating?: number
          review_count?: number
        }
        Relationships: []
      }
      pending_categories: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          suggested_name: string
          type: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          suggested_name: string
          type: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          suggested_name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          partner_badge: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          partner_badge?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          partner_badge?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          course_id: string
          created_at: string
          customer_email: string
          customer_user_id: string | null
          id: string
          purchase_date: string
          verification_method: string
          verified: boolean | null
        }
        Insert: {
          course_id: string
          created_at?: string
          customer_email: string
          customer_user_id?: string | null
          id?: string
          purchase_date: string
          verification_method?: string
          verified?: boolean | null
        }
        Update: {
          course_id?: string
          created_at?: string
          customer_email?: string
          customer_user_id?: string | null
          id?: string
          purchase_date?: string
          verification_method?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      review_likes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string | null
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id?: string | null
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          business_id: string
          completed_at: string | null
          course_id: string
          customer_email: string
          id: string
          opened_at: string | null
          sent_at: string
          status: string
          token: string
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          course_id: string
          customer_email: string
          id?: string
          opened_at?: string | null
          sent_at?: string
          status?: string
          token?: string
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          course_id?: string
          customer_email?: string
          id?: string
          opened_at?: string | null
          sent_at?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          anonymous: boolean | null
          business_id: string
          course_id: string
          created_at: string
          flag_reason: string | null
          flagged: boolean | null
          id: string
          like_count: number
          purchase_id: string | null
          rating: number
          text: string
          updated_at: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          anonymous?: boolean | null
          business_id: string
          course_id: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          like_count?: number
          purchase_id?: string | null
          rating: number
          text: string
          updated_at?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          anonymous?: boolean | null
          business_id?: string
          course_id?: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          like_count?: number
          purchase_id?: string | null
          rating?: number
          text?: string
          updated_at?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_payouts: {
        Row: {
          amount: number
          id: string
          month_year: string
          points: number
          processed_at: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          id?: string
          month_year: string
          points?: number
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          month_year?: string
          points?: number
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      rewards_log: {
        Row: {
          base_points: number
          created_at: string
          id: string
          like_count: number
          month_year: string
          multiplier: number
          review_id: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_points?: number
          created_at?: string
          id?: string
          like_count?: number
          month_year: string
          multiplier?: number
          review_id: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_points?: number
          created_at?: string
          id?: string
          like_count?: number
          month_year?: string
          multiplier?: number
          review_id?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_log_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_pool: {
        Row: {
          community_pool: number
          created_at: string
          distributed: boolean
          id: string
          month_year: string
          total_commissions: number
          total_points: number
          updated_at: string
        }
        Insert: {
          community_pool?: number
          created_at?: string
          distributed?: boolean
          id?: string
          month_year: string
          total_commissions?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          community_pool?: number
          created_at?: string
          distributed?: boolean
          id?: string
          month_year?: string
          total_commissions?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonial_media: {
        Row: {
          business_id: string
          created_at: string
          external_url: string | null
          file_path: string
          file_type: string
          id: string
          media_type: string
          sort_order: number
          title: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          external_url?: string | null
          file_path: string
          file_type?: string
          id?: string
          media_type?: string
          sort_order?: number
          title?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          external_url?: string | null
          file_path?: string
          file_type?: string
          id?: string
          media_type?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_review_likes: {
        Args: { review_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_review_likes: {
        Args: { review_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
