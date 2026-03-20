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
          course_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
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
      ai_anomaly_flags: {
        Row: {
          business_id: string
          details: Json
          detected_at: string
          flag_type: string
          id: string
          resolved_at: string | null
          severity: string
          status: string
        }
        Insert: {
          business_id: string
          details?: Json
          detected_at?: string
          flag_type: string
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
        }
        Update: {
          business_id?: string
          details?: Json
          detected_at?: string
          flag_type?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_anomaly_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "ai_anomaly_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_anomaly_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_anomaly_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_function_limits: {
        Row: {
          daily_limit: number
          description: string | null
          function_name: string
        }
        Insert: {
          daily_limit: number
          description?: string | null
          function_name: string
        }
        Update: {
          daily_limit?: number
          description?: string | null
          function_name?: string
        }
        Relationships: []
      }
      ai_moderation_queue: {
        Row: {
          action_taken: string | null
          actioned_at: string | null
          ai_reason: string | null
          classification: string
          confidence: number | null
          created_at: string
          id: string
          raw_response: Json | null
          review_id: string | null
        }
        Insert: {
          action_taken?: string | null
          actioned_at?: string | null
          ai_reason?: string | null
          classification?: string
          confidence?: number | null
          created_at?: string
          id?: string
          raw_response?: Json | null
          review_id?: string | null
        }
        Update: {
          action_taken?: string | null
          actioned_at?: string | null
          ai_reason?: string | null
          classification?: string
          confidence?: number | null
          created_at?: string
          id?: string
          raw_response?: Json | null
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_moderation_queue_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_moderation_queue_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_summary_meta: {
        Row: {
          business_id: string
          created_at: string
          generated_at: string
          id: string
          is_current: boolean
          model_version: string | null
          period_end: string | null
          period_start: string | null
          review_count: number
          summary_text: string
        }
        Insert: {
          business_id: string
          created_at?: string
          generated_at?: string
          id?: string
          is_current?: boolean
          model_version?: string | null
          period_end?: string | null
          period_start?: string | null
          review_count?: number
          summary_text: string
        }
        Update: {
          business_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          is_current?: boolean
          model_version?: string | null
          period_end?: string | null
          period_start?: string | null
          review_count?: number
          summary_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_summary_meta_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "ai_summary_meta_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_summary_meta_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_summary_meta_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          call_count: number
          function_name: string
          usage_date: string
          user_id: string
        }
        Insert: {
          call_count?: number
          function_name: string
          usage_date?: string
          user_id: string
        }
        Update: {
          call_count?: number
          function_name?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          label: string | null
          last_used_at: string | null
          rotated_at: string | null
          rotated_by: string | null
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          label?: string | null
          last_used_at?: string | null
          rotated_at?: string | null
          rotated_by?: string | null
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          label?: string | null
          last_used_at?: string | null
          rotated_at?: string | null
          rotated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_rotated_by_fkey"
            columns: ["rotated_by"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          actor_id: string | null
          actor_type: string
          business_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_hash: string | null
          payload: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string
          business_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_hash?: string | null
          payload?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          business_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_hash?: string | null
          payload?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_affiliate_clicks: {
        Row: {
          business_id: string
          clicked_at: string
          converted: boolean
          id: string
          landing_url: string | null
          referrer: string | null
          session_token: string | null
          user_agent: string | null
        }
        Insert: {
          business_id: string
          clicked_at?: string
          converted?: boolean
          id?: string
          landing_url?: string | null
          referrer?: string | null
          session_token?: string | null
          user_agent?: string | null
        }
        Update: {
          business_id?: string
          clicked_at?: string
          converted?: boolean
          id?: string
          landing_url?: string | null
          referrer?: string | null
          session_token?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_affiliate_clicks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_affiliate_clicks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_affiliate_clicks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_affiliate_clicks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_affiliate_conversions: {
        Row: {
          business_id: string
          business_net: number | null
          click_id: string | null
          confirmed_at: string | null
          coupon_code: string | null
          created_at: string
          customer_discount: number | null
          customer_email_hash: string | null
          id: string
          notes: string | null
          platform_commission: number | null
          status: string
          transaction_amount: number | null
        }
        Insert: {
          business_id: string
          business_net?: number | null
          click_id?: string | null
          confirmed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_discount?: number | null
          customer_email_hash?: string | null
          id?: string
          notes?: string | null
          platform_commission?: number | null
          status?: string
          transaction_amount?: number | null
        }
        Update: {
          business_id?: string
          business_net?: number | null
          click_id?: string | null
          confirmed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_discount?: number | null
          customer_email_hash?: string | null
          id?: string
          notes?: string | null
          platform_commission?: number | null
          status?: string
          transaction_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_affiliate_conversions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_affiliate_conversions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_affiliate_conversions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_affiliate_conversions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_affiliate_conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "business_affiliate_clicks"
            referencedColumns: ["id"]
          },
        ]
      }
      business_external_profiles: {
        Row: {
          business_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          consecutive_errors: number | null
          created_at: string | null
          external_address: string | null
          external_id: string
          external_name: string | null
          external_rating: number | null
          external_review_count: number | null
          external_url: string | null
          id: string
          last_synced_at: string | null
          match_confidence: number | null
          match_method: string | null
          match_signals: Json | null
          next_sync_at: string | null
          oauth_access_token: string | null
          oauth_expires_at: string | null
          oauth_refresh_token: string | null
          oauth_scope: string | null
          rejected_reason: string | null
          source_id: string
          status: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          consecutive_errors?: number | null
          created_at?: string | null
          external_address?: string | null
          external_id: string
          external_name?: string | null
          external_rating?: number | null
          external_review_count?: number | null
          external_url?: string | null
          id?: string
          last_synced_at?: string | null
          match_confidence?: number | null
          match_method?: string | null
          match_signals?: Json | null
          next_sync_at?: string | null
          oauth_access_token?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token?: string | null
          oauth_scope?: string | null
          rejected_reason?: string | null
          source_id: string
          status?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          consecutive_errors?: number | null
          created_at?: string | null
          external_address?: string | null
          external_id?: string
          external_name?: string | null
          external_rating?: number | null
          external_review_count?: number | null
          external_url?: string | null
          id?: string
          last_synced_at?: string | null
          match_confidence?: number | null
          match_method?: string | null
          match_signals?: Json | null
          next_sync_at?: string | null
          oauth_access_token?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token?: string | null
          oauth_scope?: string | null
          rejected_reason?: string | null
          source_id?: string
          status?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_external_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_external_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_external_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_external_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_external_profiles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "external_review_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      business_integrations: {
        Row: {
          active: boolean
          business_id: string
          config: Json
          created_at: string
          id: string
          integration_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          config?: Json
          created_at?: string
          id?: string
          integration_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          config?: Json
          created_at?: string
          id?: string
          integration_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          affiliate_enrolled: boolean
          affiliate_enrolled_at: string | null
          affiliate_link_active: boolean
          affiliate_mode: string
          affiliate_program_status: string
          ai_flags: Json | null
          ai_summary: string | null
          ai_summary_updated_at: string | null
          avg_response_hours: number | null
          category: string | null
          collaboration_activated_at: string | null
          collaboration_active: boolean
          collaboration_coupon: string | null
          collaboration_method: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          founder_name: string | null
          grow_order_id: string | null
          grow_transaction_id: string | null
          id: string
          last_ai_scan_at: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          payplus_page_uid: string | null
          payplus_txn_uid: string | null
          personal_affiliate_url: string | null
          personal_affiliate_urls: string[] | null
          phone: string | null
          pricing_model: string | null
          quality_score: number | null
          rating: number
          response_rate: number | null
          review_count: number
          review_velocity: number | null
          sentiment_score: number | null
          slug: string | null
          social_links: Json | null
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_tier: string
          transparency_score: number | null
          transparency_score_updated_at: string | null
          trending_score: number | null
          trial_ends_at: string | null
          trial_reminder_sent_at: string | null
          trust_status: string
          trust_status_reason: string | null
          trust_status_updated_at: string | null
          trust_tier: string | null
          updated_at: string
          verified: boolean | null
          verified_ratio: number | null
          verified_review_count: number
          verified_review_ratio: number | null
          website: string | null
        }
        Insert: {
          affiliate_enrolled?: boolean
          affiliate_enrolled_at?: string | null
          affiliate_link_active?: boolean
          affiliate_mode?: string
          affiliate_program_status?: string
          ai_flags?: Json | null
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          avg_response_hours?: number | null
          category?: string | null
          collaboration_activated_at?: string | null
          collaboration_active?: boolean
          collaboration_coupon?: string | null
          collaboration_method?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          founder_name?: string | null
          grow_order_id?: string | null
          grow_transaction_id?: string | null
          id?: string
          last_ai_scan_at?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          payplus_page_uid?: string | null
          payplus_txn_uid?: string | null
          personal_affiliate_url?: string | null
          personal_affiliate_urls?: string[] | null
          phone?: string | null
          pricing_model?: string | null
          quality_score?: number | null
          rating?: number
          response_rate?: number | null
          review_count?: number
          review_velocity?: number | null
          sentiment_score?: number | null
          slug?: string | null
          social_links?: Json | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          transparency_score?: number | null
          transparency_score_updated_at?: string | null
          trending_score?: number | null
          trial_ends_at?: string | null
          trial_reminder_sent_at?: string | null
          trust_status?: string
          trust_status_reason?: string | null
          trust_status_updated_at?: string | null
          trust_tier?: string | null
          updated_at?: string
          verified?: boolean | null
          verified_ratio?: number | null
          verified_review_count?: number
          verified_review_ratio?: number | null
          website?: string | null
        }
        Update: {
          affiliate_enrolled?: boolean
          affiliate_enrolled_at?: string | null
          affiliate_link_active?: boolean
          affiliate_mode?: string
          affiliate_program_status?: string
          ai_flags?: Json | null
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          avg_response_hours?: number | null
          category?: string | null
          collaboration_activated_at?: string | null
          collaboration_active?: boolean
          collaboration_coupon?: string | null
          collaboration_method?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          founder_name?: string | null
          grow_order_id?: string | null
          grow_transaction_id?: string | null
          id?: string
          last_ai_scan_at?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          payplus_page_uid?: string | null
          payplus_txn_uid?: string | null
          personal_affiliate_url?: string | null
          personal_affiliate_urls?: string[] | null
          phone?: string | null
          pricing_model?: string | null
          quality_score?: number | null
          rating?: number
          response_rate?: number | null
          review_count?: number
          review_velocity?: number | null
          sentiment_score?: number | null
          slug?: string | null
          social_links?: Json | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          transparency_score?: number | null
          transparency_score_updated_at?: string | null
          trending_score?: number | null
          trial_ends_at?: string | null
          trial_reminder_sent_at?: string | null
          trust_status?: string
          trust_status_reason?: string | null
          trust_status_updated_at?: string | null
          trust_tier?: string | null
          updated_at?: string
          verified?: boolean | null
          verified_ratio?: number | null
          verified_review_count?: number
          verified_review_ratio?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_feedback: {
        Row: {
          actor_id: string
          feedback: string | null
          id: string
          submitted_at: string
          subscription_tier: string | null
        }
        Insert: {
          actor_id: string
          feedback?: string | null
          id?: string
          submitted_at?: string
          subscription_tier?: string | null
        }
        Update: {
          actor_id?: string
          feedback?: string | null
          id?: string
          submitted_at?: string
          subscription_tier?: string | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          billing_starts_at: string
          business_id: string | null
          coupon_id: string
          discounted_until: string | null
          id: string
          phase2_reminder_sent_at: string | null
          redeemed_at: string
          reminder_sent_at: string | null
          user_id: string
        }
        Insert: {
          billing_starts_at: string
          business_id?: string | null
          coupon_id: string
          discounted_until?: string | null
          id?: string
          phase2_reminder_sent_at?: string | null
          redeemed_at?: string
          reminder_sent_at?: string | null
          user_id: string
        }
        Update: {
          billing_starts_at?: string
          business_id?: string | null
          coupon_id?: string
          discounted_until?: string | null
          id?: string
          phase2_reminder_sent_at?: string | null
          redeemed_at?: string
          reminder_sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "coupon_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_percent: number
          duration_months: number
          id: string
          is_active: boolean
          max_uses: number
          phase2_discount_percent: number | null
          phase2_duration_months: number | null
          stripe_phase2_coupon_id: string | null
          used_count: number
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          duration_months?: number
          id?: string
          is_active?: boolean
          max_uses?: number
          phase2_discount_percent?: number | null
          phase2_duration_months?: number | null
          stripe_phase2_coupon_id?: string | null
          used_count?: number
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          duration_months?: number
          id?: string
          is_active?: boolean
          max_uses?: number
          phase2_discount_percent?: number | null
          phase2_duration_months?: number | null
          stripe_phase2_coupon_id?: string | null
          used_count?: number
          valid_until?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          affiliate_url: string | null
          business_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number | null
        }
        Insert: {
          affiliate_url?: string | null
          business_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number | null
        }
        Update: {
          affiliate_url?: string | null
          business_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_users_audit: {
        Row: {
          businesses_orphaned: number
          deleted_at: string
          deleted_user_id: string
          email_hint: string | null
          id: string
          initiated_by: string
          purchases_deleted: number
          reviews_anonymized: number
          role: string | null
        }
        Insert: {
          businesses_orphaned?: number
          deleted_at?: string
          deleted_user_id: string
          email_hint?: string | null
          id?: string
          initiated_by?: string
          purchases_deleted?: number
          reviews_anonymized?: number
          role?: string | null
        }
        Update: {
          businesses_orphaned?: number
          deleted_at?: string
          deleted_user_id?: string
          email_hint?: string | null
          id?: string
          initiated_by?: string
          purchases_deleted?: number
          reviews_anonymized?: number
          role?: string | null
        }
        Relationships: []
      }
      evidence_vault: {
        Row: {
          created_at: string
          file_size_bytes: number
          file_type: string
          id: string
          retention_until: string
          review_id: string
          storage_path: string
          uploader_id: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          file_size_bytes: number
          file_type: string
          id?: string
          retention_until?: string
          review_id: string
          storage_path: string
          uploader_id: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          file_size_bytes?: number
          file_type?: string
          id?: string
          retention_until?: string
          review_id?: string
          storage_path?: string
          uploader_id?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_vault_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_vault_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      external_review_sources: {
        Row: {
          created_at: string | null
          display_name: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          rate_limit_per_day: number | null
          requires_oauth: boolean | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rate_limit_per_day?: number | null
          requires_oauth?: boolean | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rate_limit_per_day?: number | null
          requires_oauth?: boolean | null
        }
        Relationships: []
      }
      external_sync_log: {
        Row: {
          api_units_used: number | null
          business_external_profile_id: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          raw_response_meta: Json | null
          reviews_deleted: number | null
          reviews_found: number | null
          reviews_new: number | null
          reviews_updated: number | null
          source: string | null
          status: string
          synced_at: string | null
          trigger: string | null
        }
        Insert: {
          api_units_used?: number | null
          business_external_profile_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          raw_response_meta?: Json | null
          reviews_deleted?: number | null
          reviews_found?: number | null
          reviews_new?: number | null
          reviews_updated?: number | null
          source?: string | null
          status: string
          synced_at?: string | null
          trigger?: string | null
        }
        Update: {
          api_units_used?: number | null
          business_external_profile_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          raw_response_meta?: Json | null
          reviews_deleted?: number | null
          reviews_found?: number | null
          reviews_new?: number | null
          reviews_updated?: number | null
          source?: string | null
          status?: string
          synced_at?: string | null
          trigger?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_sync_log_business_external_profile_id_fkey"
            columns: ["business_external_profile_id"]
            isOneToOne: false
            referencedRelation: "business_external_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_reviews: {
        Row: {
          author_name: string | null
          author_photo_url: string | null
          author_profile_url: string | null
          business_id: string
          created_at: string
          external_id: string | null
          id: string
          last_synced_at: string
          published_at: string | null
          rating: number | null
          review_source: string
          source_label: string
          source_url: string | null
          text: string | null
        }
        Insert: {
          author_name?: string | null
          author_photo_url?: string | null
          author_profile_url?: string | null
          business_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_synced_at?: string
          published_at?: string | null
          rating?: number | null
          review_source?: string
          source_label?: string
          source_url?: string | null
          text?: string | null
        }
        Update: {
          author_name?: string | null
          author_photo_url?: string | null
          author_profile_url?: string | null
          business_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_synced_at?: string
          published_at?: string | null
          rating?: number | null
          review_source?: string
          source_label?: string
          source_url?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facebook_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "facebook_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_google_reviews: {
        Row: {
          attribution_label: string | null
          attribution_required: boolean | null
          author_name: string
          author_photo_url: string | null
          business_external_profile_id: string
          business_id: string
          content_hash: string
          display_allowed: boolean | null
          external_review_id: string
          first_imported_at: string | null
          id: string
          is_deleted_at_source: boolean | null
          last_seen_at: string | null
          original_language: string | null
          published_at: string | null
          rating: number
          raw_data: Json | null
          source: string | null
          source_url: string | null
          text: string | null
          translated_text: string | null
          updated_at_source: string | null
        }
        Insert: {
          attribution_label?: string | null
          attribution_required?: boolean | null
          author_name: string
          author_photo_url?: string | null
          business_external_profile_id: string
          business_id: string
          content_hash: string
          display_allowed?: boolean | null
          external_review_id: string
          first_imported_at?: string | null
          id?: string
          is_deleted_at_source?: boolean | null
          last_seen_at?: string | null
          original_language?: string | null
          published_at?: string | null
          rating: number
          raw_data?: Json | null
          source?: string | null
          source_url?: string | null
          text?: string | null
          translated_text?: string | null
          updated_at_source?: string | null
        }
        Update: {
          attribution_label?: string | null
          attribution_required?: boolean | null
          author_name?: string
          author_photo_url?: string | null
          business_external_profile_id?: string
          business_id?: string
          content_hash?: string
          display_allowed?: boolean | null
          external_review_id?: string
          first_imported_at?: string | null
          id?: string
          is_deleted_at_source?: boolean | null
          last_seen_at?: string | null
          original_language?: string | null
          published_at?: string | null
          rating?: number
          raw_data?: Json | null
          source?: string | null
          source_url?: string | null
          text?: string | null
          translated_text?: string | null
          updated_at_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imported_google_reviews_business_external_profile_id_fkey"
            columns: ["business_external_profile_id"]
            isOneToOne: false
            referencedRelation: "business_external_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "imported_google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_dm_review_flows: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          flow_token: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          flow_token?: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          flow_token?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_dm_review_flows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "instagram_dm_review_flows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_dm_review_flows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_dm_review_flows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_dm_reviews: {
        Row: {
          approved_at: string | null
          author_name: string | null
          author_phone_hash: string | null
          business_id: string
          created_at: string
          flagged_reason: string | null
          flow_id: string | null
          id: string
          is_approved: boolean
          is_flagged: boolean
          rating: number | null
          received_at: string
          text: string
        }
        Insert: {
          approved_at?: string | null
          author_name?: string | null
          author_phone_hash?: string | null
          business_id: string
          created_at?: string
          flagged_reason?: string | null
          flow_id?: string | null
          id?: string
          is_approved?: boolean
          is_flagged?: boolean
          rating?: number | null
          received_at?: string
          text: string
        }
        Update: {
          approved_at?: string | null
          author_name?: string | null
          author_phone_hash?: string | null
          business_id?: string
          created_at?: string
          flagged_reason?: string | null
          flow_id?: string | null
          id?: string
          is_approved?: boolean
          is_flagged?: boolean
          rating?: number | null
          received_at?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_dm_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "instagram_dm_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_dm_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_dm_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_dm_reviews_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "instagram_dm_review_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          created_at: string
          id: string
          points: number
          review_count: number
          season_id: string
          updated_at: string
          user_id: string
          verified_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          review_count?: number
          season_id: string
          updated_at?: string
          user_id: string
          verified_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          review_count?: number
          season_id?: string
          updated_at?: string
          user_id?: string
          verified_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_seasons: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          season_name: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          is_active?: boolean
          season_name: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          season_name?: string
          starts_at?: string
        }
        Relationships: []
      }
      moderation_cases: {
        Row: {
          business_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision: string | null
          decision_reason: string | null
          id: string
          proof_deadline: string | null
          proof_received_at: string | null
          proof_requested_at: string | null
          report_category: string | null
          report_reason: string
          reporter_id: string | null
          review_id: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          decision_reason?: string | null
          id?: string
          proof_deadline?: string | null
          proof_received_at?: string | null
          proof_requested_at?: string | null
          report_category?: string | null
          report_reason: string
          reporter_id?: string | null
          review_id: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          decision_reason?: string | null
          id?: string
          proof_deadline?: string | null
          proof_received_at?: string | null
          proof_requested_at?: string | null
          report_category?: string | null
          report_reason?: string
          reporter_id?: string | null
          review_id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_cases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "moderation_cases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_review_id_fkey"
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
          business_slug: string
          created_at: string
          id: string
          month_year: string
          rank: number
        }
        Insert: {
          ai_reasoning?: string | null
          business_slug: string
          created_at?: string
          id?: string
          month_year: string
          rank: number
        }
        Update: {
          ai_reasoning?: string | null
          business_slug?: string
          created_at?: string
          id?: string
          month_year?: string
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_top5_business_slug_fkey"
            columns: ["business_slug"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "monthly_top5_business_slug_fkey"
            columns: ["business_slug"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "monthly_top5_business_slug_fkey"
            columns: ["business_slug"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["slug"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          business_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          read: boolean
          recipient_type: string | null
          review_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean
          recipient_type?: string | null
          review_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean
          recipient_type?: string | null
          review_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_logs: {
        Row: {
          amount_ils: number | null
          error_message: string | null
          id: string
          order_id: string | null
          processed_at: string | null
          processing_status: string
          raw_payload: Json
          received_at: string
          source: string
          status_raw: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_ils?: number | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          processed_at?: string | null
          processing_status?: string
          raw_payload: Json
          received_at?: string
          source: string
          status_raw?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_ils?: number | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          processed_at?: string | null
          processing_status?: string
          raw_payload?: Json
          received_at?: string
          source?: string
          status_raw?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      place_match_candidates: {
        Row: {
          business_id: string
          confidence: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          place_address: string | null
          place_id: string
          place_name: string | null
          place_phone: string | null
          place_rating: number | null
          place_url: string | null
          place_website: string | null
          signals: Json | null
          status: string | null
        }
        Insert: {
          business_id: string
          confidence?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          place_address?: string | null
          place_id: string
          place_name?: string | null
          place_phone?: string | null
          place_rating?: number | null
          place_url?: string | null
          place_website?: string | null
          signals?: Json | null
          status?: string | null
        }
        Update: {
          business_id?: string
          confidence?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          place_address?: string | null
          place_id?: string
          place_name?: string | null
          place_phone?: string | null
          place_rating?: number | null
          place_url?: string | null
          place_website?: string | null
          signals?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_match_candidates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "place_match_candidates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_match_candidates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_match_candidates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_payment_transactions: {
        Row: {
          amount_ils: number | null
          business_id: string | null
          plan_id: string | null
          processed_at: string
          source: string
          transaction_id: string
          user_id: string
          webhook_log_id: string | null
        }
        Insert: {
          amount_ils?: number | null
          business_id?: string | null
          plan_id?: string | null
          processed_at?: string
          source: string
          transaction_id: string
          user_id: string
          webhook_log_id?: string | null
        }
        Update: {
          amount_ils?: number | null
          business_id?: string | null
          plan_id?: string | null
          processed_at?: string
          source?: string
          transaction_id?: string
          user_id?: string
          webhook_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processed_payment_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "processed_payment_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_payment_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_payment_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_payment_transactions_webhook_log_id_fkey"
            columns: ["webhook_log_id"]
            isOneToOne: false
            referencedRelation: "payment_webhook_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_verifications: {
        Row: {
          business_id: string | null
          id: string
          proof_type: string
          proof_url: string | null
          rejection_reason: string | null
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          id?: string
          proof_type: string
          proof_url?: string | null
          rejection_reason?: string | null
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          id?: string
          proof_type?: string
          proof_url?: string | null
          rejection_reason?: string | null
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "purchase_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_verifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_verifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          purchase_date: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          purchase_date?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          purchase_date?: string | null
          user_id?: string | null
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
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          business_id: string
          business_slug: string
          created_at: string
          id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          business_id: string
          business_slug: string
          created_at?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          business_id?: string
          business_slug?: string
          created_at?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "referral_clicks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_clicks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_clicks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_decision: string | null
          ai_reason: string | null
          business_id: string | null
          created_at: string | null
          id: string
          llm_confidence: number | null
          llm_triage_at: string | null
          llm_triage_decision: string | null
          llm_triage_reason: string | null
          moderation_status: string
          reason: string | null
          report_type: string | null
          reporter_id: string | null
          resolved_at: string | null
          review_id: string | null
        }
        Insert: {
          ai_decision?: string | null
          ai_reason?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          llm_confidence?: number | null
          llm_triage_at?: string | null
          llm_triage_decision?: string | null
          llm_triage_reason?: string | null
          moderation_status?: string
          reason?: string | null
          report_type?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          review_id?: string | null
        }
        Update: {
          ai_decision?: string | null
          ai_reason?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          llm_confidence?: number | null
          llm_triage_at?: string | null
          llm_triage_decision?: string | null
          llm_triage_reason?: string | null
          moderation_status?: string
          reason?: string | null
          report_type?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_burst_flags: {
        Row: {
          business_id: string
          created_at: string
          detected_at: string
          flagged_review_ids: string[] | null
          id: string
          notes: string | null
          review_count: number
          severity: string
          status: string
          threshold: number
          window_end: string
          window_start: string
        }
        Insert: {
          business_id: string
          created_at?: string
          detected_at?: string
          flagged_review_ids?: string[] | null
          id?: string
          notes?: string | null
          review_count: number
          severity?: string
          status?: string
          threshold?: number
          window_end: string
          window_start: string
        }
        Update: {
          business_id?: string
          created_at?: string
          detected_at?: string
          flagged_review_ids?: string[] | null
          id?: string
          notes?: string | null
          review_count?: number
          severity?: string
          status?: string
          threshold?: number
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_burst_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "review_burst_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_burst_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_burst_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          business_id: string | null
          completed: boolean | null
          course_id: string | null
          email: string | null
          id: string
          sent_at: string | null
          unique_token: string | null
        }
        Insert: {
          business_id?: string | null
          completed?: boolean | null
          course_id?: string | null
          email?: string | null
          id?: string
          sent_at?: string | null
          unique_token?: string | null
        }
        Update: {
          business_id?: string | null
          completed?: boolean | null
          course_id?: string | null
          email?: string | null
          id?: string
          sent_at?: string | null
          unique_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "review_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
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
      review_responses: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          response_text: string | null
          review_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          response_text?: string | null
          review_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          response_text?: string | null
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "review_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          ai_moderated_at: string | null
          ai_moderation_model: string | null
          ai_moderation_reason: string | null
          ai_moderation_tags: string[] | null
          ai_spam_risk: number | null
          anonymous: boolean | null
          business_id: string | null
          challenge_upheld: boolean | null
          challenged: boolean
          course_id: string | null
          created_at: string | null
          credibility_status: string | null
          deleted_at: string | null
          duplicate_hash: string | null
          evidence_file_path: string | null
          external_review_id: string | null
          id: string
          indemnity_accepted: boolean
          indemnity_accepted_at: string | null
          is_flagged_spam: boolean
          is_purchase_verified: boolean
          is_verified_purchase: boolean | null
          like_count: number
          moderation_status: string
          purchase_date: string | null
          quality_score: number | null
          rating: number | null
          review_source: string | null
          review_text: string | null
          reviewer_name: string | null
          source_label: string | null
          source_url: string | null
          spam_flags: string[] | null
          spam_score: number | null
          status: Database["public"]["Enums"]["review_status_enum"]
          status_reason: string | null
          status_updated_at: string | null
          subject: string | null
          submission_ip: string | null
          submission_user_agent: string | null
          toxicity_risk: number | null
          training_duration: string | null
          updated_at: string | null
          user_id: string | null
          verification_status: string
          verified_purchase: boolean | null
        }
        Insert: {
          ai_moderated_at?: string | null
          ai_moderation_model?: string | null
          ai_moderation_reason?: string | null
          ai_moderation_tags?: string[] | null
          ai_spam_risk?: number | null
          anonymous?: boolean | null
          business_id?: string | null
          challenge_upheld?: boolean | null
          challenged?: boolean
          course_id?: string | null
          created_at?: string | null
          credibility_status?: string | null
          deleted_at?: string | null
          duplicate_hash?: string | null
          evidence_file_path?: string | null
          external_review_id?: string | null
          id?: string
          indemnity_accepted?: boolean
          indemnity_accepted_at?: string | null
          is_flagged_spam?: boolean
          is_purchase_verified?: boolean
          is_verified_purchase?: boolean | null
          like_count?: number
          moderation_status?: string
          purchase_date?: string | null
          quality_score?: number | null
          rating?: number | null
          review_source?: string | null
          review_text?: string | null
          reviewer_name?: string | null
          source_label?: string | null
          source_url?: string | null
          spam_flags?: string[] | null
          spam_score?: number | null
          status?: Database["public"]["Enums"]["review_status_enum"]
          status_reason?: string | null
          status_updated_at?: string | null
          subject?: string | null
          submission_ip?: string | null
          submission_user_agent?: string | null
          toxicity_risk?: number | null
          training_duration?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string
          verified_purchase?: boolean | null
        }
        Update: {
          ai_moderated_at?: string | null
          ai_moderation_model?: string | null
          ai_moderation_reason?: string | null
          ai_moderation_tags?: string[] | null
          ai_spam_risk?: number | null
          anonymous?: boolean | null
          business_id?: string | null
          challenge_upheld?: boolean | null
          challenged?: boolean
          course_id?: string | null
          created_at?: string | null
          credibility_status?: string | null
          deleted_at?: string | null
          duplicate_hash?: string | null
          evidence_file_path?: string | null
          external_review_id?: string | null
          id?: string
          indemnity_accepted?: boolean
          indemnity_accepted_at?: string | null
          is_flagged_spam?: boolean
          is_purchase_verified?: boolean
          is_verified_purchase?: boolean | null
          like_count?: number
          moderation_status?: string
          purchase_date?: string | null
          quality_score?: number | null
          rating?: number | null
          review_source?: string | null
          review_text?: string | null
          reviewer_name?: string | null
          source_label?: string | null
          source_url?: string | null
          spam_flags?: string[] | null
          spam_score?: number | null
          status?: Database["public"]["Enums"]["review_status_enum"]
          status_reason?: string | null
          status_updated_at?: string | null
          subject?: string | null
          submission_ip?: string | null
          submission_user_agent?: string | null
          toxicity_risk?: number | null
          training_duration?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
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
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_catalog: {
        Row: {
          created_at: string
          description_he: string | null
          id: string
          is_active: boolean
          name_he: string
          points_required: number
          reward_type: string
          reward_value: number | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_he?: string | null
          id?: string
          is_active?: boolean
          name_he: string
          points_required: number
          reward_type: string
          reward_value?: number | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_he?: string | null
          id?: string
          is_active?: boolean
          name_he?: string
          points_required?: number
          reward_type?: string
          reward_value?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          points_spent: number
          processed_at: string | null
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          points_spent: number
          processed_at?: string | null
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          points_spent?: number
          processed_at?: string | null
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_pool: {
        Row: {
          community_pool: number
          created_at: string | null
          id: string
          month_year: string
          total_points: number
          updated_at: string | null
        }
        Insert: {
          community_pool?: number
          created_at?: string | null
          id?: string
          month_year: string
          total_points?: number
          updated_at?: string | null
        }
        Update: {
          community_pool?: number
          created_at?: string | null
          id?: string
          month_year?: string
          total_points?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonial_media: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          id: string
          media_type: string
          media_url: string
          sort_order: number
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          sort_order?: number
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "testimonial_media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonial_media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonial_media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string | null
          id: string
          media_type: string
          media_url: string
          sort_order: number | null
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string | null
          id?: string
          media_type?: string
          media_url: string
          sort_order?: number | null
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "testimonials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_moderation_log: {
        Row: {
          business_id: string | null
          created_at: string
          decision_type: string
          id: string
          metadata: Json | null
          reason: string
          reporter_id: string | null
          review_id: string | null
          source: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          decision_type: string
          id?: string
          metadata?: Json | null
          reason: string
          reporter_id?: string | null
          review_id?: string | null
          source?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          decision_type?: string
          id?: string
          metadata?: Json | null
          reason?: string
          reporter_id?: string | null
          review_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_moderation_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "trust_moderation_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_moderation_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_moderation_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_moderation_log_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_moderation_log_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invite_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_point_transactions: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          month_year: string
          points: number
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_year: string
          points?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month_year?: string
          points?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referrals: {
        Row: {
          confirmed_at: string | null
          created_at: string
          id: string
          invite_code: string
          invited_user_id: string
          inviter_id: string
          points_awarded: number
          status: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          invite_code: string
          invited_user_id: string
          inviter_id: string
          points_awarded?: number
          status?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          invited_user_id?: string
          inviter_id?: string
          points_awarded?: number
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          consent_ip: string | null
          cover_url: string | null
          created_at: string | null
          deletion_feedback: string | null
          deletion_initiated_at: string | null
          deletion_scheduled_at: string | null
          email: string | null
          full_name: string | null
          id: string
          marketing_consent: boolean | null
          marketing_consent_at: string | null
          pending_deletion: boolean
          privacy_accepted_at: string | null
          privacy_version: string | null
          role: string | null
          terms_accepted_at: string | null
          terms_version: string | null
        }
        Insert: {
          avatar_url?: string | null
          consent_ip?: string | null
          cover_url?: string | null
          created_at?: string | null
          deletion_feedback?: string | null
          deletion_initiated_at?: string | null
          deletion_scheduled_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          pending_deletion?: boolean
          privacy_accepted_at?: string | null
          privacy_version?: string | null
          role?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
        }
        Update: {
          avatar_url?: string | null
          consent_ip?: string | null
          cover_url?: string | null
          created_at?: string | null
          deletion_feedback?: string | null
          deletion_initiated_at?: string | null
          deletion_scheduled_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          pending_deletion?: boolean
          privacy_accepted_at?: string | null
          privacy_version?: string | null
          role?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
        }
        Relationships: []
      }
      whatsapp_review_flows: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          flow_token: string
          id: string
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          flow_token?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          flow_token?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_review_flows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "whatsapp_review_flows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_review_flows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_review_flows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_reviews: {
        Row: {
          approved_at: string | null
          author_name: string | null
          author_phone_hash: string | null
          business_id: string
          created_at: string
          flagged_reason: string | null
          flow_id: string | null
          id: string
          is_approved: boolean
          is_flagged: boolean
          rating: number | null
          received_at: string
          review_source: string
          source_label: string
          source_url: string | null
          text: string
          whatsapp_message_id: string | null
        }
        Insert: {
          approved_at?: string | null
          author_name?: string | null
          author_phone_hash?: string | null
          business_id: string
          created_at?: string
          flagged_reason?: string | null
          flow_id?: string | null
          id?: string
          is_approved?: boolean
          is_flagged?: boolean
          rating?: number | null
          received_at?: string
          review_source?: string
          source_label?: string
          source_url?: string | null
          text: string
          whatsapp_message_id?: string | null
        }
        Update: {
          approved_at?: string | null
          author_name?: string | null
          author_phone_hash?: string | null
          business_id?: string
          created_at?: string
          flagged_reason?: string | null
          flow_id?: string | null
          id?: string
          is_approved?: boolean
          is_flagged?: boolean
          rating?: number | null
          received_at?: string
          review_source?: string
          source_label?: string
          source_url?: string | null
          text?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "whatsapp_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_reviews_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_review_flows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      business_rating_summary: {
        Row: {
          avg_rating: number | null
          business_id: string | null
          total_reviews: number | null
        }
        Relationships: []
      }
      churn_feedback_analytics: {
        Row: {
          feedback_rate_pct: number | null
          month: string | null
          silent_churn: number | null
          tier: string | null
          total_churned: number | null
          with_feedback: number | null
        }
        Relationships: []
      }
      course_rating_summary: {
        Row: {
          avg_rating: number | null
          course_id: string | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      public_businesses: {
        Row: {
          business_name: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          slug: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          business_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          slug?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          business_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          slug?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      public_reviews: {
        Row: {
          anonymous: boolean | null
          business_id: string | null
          course_id: string | null
          course_name: string | null
          created_at: string | null
          flag_reason: string | null
          flagged: boolean | null
          id: string | null
          like_count: number | null
          purchase_date: string | null
          rating: number | null
          review_text: string | null
          reviewer_name: string | null
          updated_at: string | null
          user_id: string | null
          verified_purchase: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_rating_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_business_rankings: {
        Row: {
          ai_flags: Json | null
          ai_summary: string | null
          category: string | null
          composite_rank_score: number | null
          id: string | null
          last_ai_scan_at: string | null
          name: string | null
          quality_score: number | null
          rating: number | null
          response_rate: number | null
          review_count: number | null
          review_velocity: number | null
          sentiment_score: number | null
          slug: string | null
          trending_score: number | null
          verified_review_count: number | null
        }
        Insert: {
          ai_flags?: Json | null
          ai_summary?: string | null
          category?: string | null
          composite_rank_score?: never
          id?: string | null
          last_ai_scan_at?: string | null
          name?: string | null
          quality_score?: number | null
          rating?: number | null
          response_rate?: number | null
          review_count?: number | null
          review_velocity?: number | null
          sentiment_score?: number | null
          slug?: string | null
          trending_score?: number | null
          verified_review_count?: number | null
        }
        Update: {
          ai_flags?: Json | null
          ai_summary?: string | null
          category?: string | null
          composite_rank_score?: never
          id?: string | null
          last_ai_scan_at?: string | null
          name?: string | null
          quality_score?: number | null
          rating?: number | null
          response_rate?: number | null
          review_count?: number | null
          review_velocity?: number | null
          sentiment_score?: number | null
          slug?: string | null
          trending_score?: number | null
          verified_review_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      ai_rate_limit_check: {
        Args: { p_function_name: string; p_user_id: string }
        Returns: {
          allowed: boolean
          remaining: number
          used: number
        }[]
      }
      cleanup_old_ip_data: { Args: never; Returns: number }
      create_verified_review: {
        Args: {
          p_anonymous: boolean
          p_course_id: string
          p_rating: number
          p_review_text: string
        }
        Returns: Json
      }
      decrement_review_likes: {
        Args: { review_id: string }
        Returns: undefined
      }
      delete_user_account: {
        Args: { initiated_by?: string; target_user_id: string }
        Returns: Json
      }
      fn_get_ranked_businesses: {
        Args: { p_category?: string; p_limit?: number; p_offset?: number }
        Returns: {
          ai_summary: string
          category: string
          composite_rank_score: number
          id: string
          name: string
          rating: number
          review_count: number
          sentiment_score: number
          slug: string
          trending_score: number
          verified_review_count: number
        }[]
      }
      generate_invite_code: { Args: never; Returns: string }
      get_affiliate_stats: { Args: { p_business_id: string }; Returns: Json }
      get_business_stats: { Args: { business_uuid: string }; Returns: Json }
      get_my_referral_stats: { Args: never; Returns: Json }
      get_or_create_instagram_dm_flow: {
        Args: { p_business_id: string }
        Returns: {
          flow_token: string
        }[]
      }
      get_or_create_my_invite_code: { Args: never; Returns: string }
      get_or_create_whatsapp_flow: {
        Args: { p_business_id: string }
        Returns: {
          active: boolean
          flow_id: string
          flow_token: string
        }[]
      }
      increment_review_likes: {
        Args: { review_id: string }
        Returns: undefined
      }
      process_user_referral: {
        Args: { p_invite_code: string; p_new_user_id: string }
        Returns: Json
      }
      redeem_reward: { Args: { p_reward_id: string }; Returns: Json }
      refresh_business_rating: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      refresh_verified_ratio: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      soft_delete_review: { Args: { review_uuid: string }; Returns: undefined }
    }
    Enums: {
      review_status_enum:
        | "pending"
        | "verified"
        | "flagged"
        | "under_review"
        | "removed"
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
      review_status_enum: [
        "pending",
        "verified",
        "flagged",
        "under_review",
        "removed",
      ],
    },
  },
} as const
