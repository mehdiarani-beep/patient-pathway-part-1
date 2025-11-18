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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_landing_pages: {
        Row: {
          chatbot_colors: Json | null
          clinic_id: string | null
          content: Json
          created_at: string | null
          doctor_id: string
          doctor_profile: Json | null
          id: string
          quiz_type: string
          updated_at: string
        }
        Insert: {
          chatbot_colors?: Json | null
          clinic_id?: string | null
          content: Json
          created_at?: string | null
          doctor_id: string
          doctor_profile?: Json | null
          id?: string
          quiz_type?: string
          updated_at?: string
        }
        Update: {
          chatbot_colors?: Json | null
          clinic_id?: string | null
          content?: Json
          created_at?: string | null
          doctor_id?: string
          doctor_profile?: Json | null
          id?: string
          quiz_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_landing_pages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_webhooks: {
        Row: {
          active: boolean | null
          clinic_id: string | null
          created_at: string | null
          doctor_id: string
          id: string
          updated_at: string | null
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          active?: boolean | null
          clinic_id?: string | null
          created_at?: string | null
          doctor_id: string
          id?: string
          updated_at?: string | null
          webhook_type?: string
          webhook_url: string
        }
        Update: {
          active?: boolean | null
          clinic_id?: string | null
          created_at?: string | null
          doctor_id?: string
          id?: string
          updated_at?: string | null
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_webhooks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_locations: {
        Row: {
          address: string | null
          city: string | null
          clinic_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          clinic_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          clinic_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_locations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_member_locations: {
        Row: {
          clinic_member_id: string
          created_at: string
          id: string
          location_id: string
        }
        Insert: {
          clinic_member_id: string
          created_at?: string
          id?: string
          location_id: string
        }
        Update: {
          clinic_member_id?: string
          created_at?: string
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_member_locations_clinic_member_id_fkey"
            columns: ["clinic_member_id"]
            isOneToOne: false
            referencedRelation: "clinic_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_member_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          accepted_at: string | null
          clinic_id: string
          created_at: string
          email: string
          first_name: string | null
          id: string
          invitation_token: string | null
          invited_by: string | null
          last_active_at: string | null
          last_name: string | null
          permissions: Json | null
          role: string
          status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          clinic_id: string
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          last_active_at?: string | null
          last_name?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          clinic_id?: string
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          last_active_at?: string | null
          last_name?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_profiles: {
        Row: {
          address: string | null
          city: string | null
          clinic_name: string
          clinic_slug: string | null
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          state: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          clinic_name: string
          clinic_slug?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          clinic_name?: string
          clinic_slug?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          doctor_id: string
          email: string | null
          id: string
          location_id: string | null
          name: string
          phone: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          doctor_id: string
          email?: string | null
          id?: string
          location_id?: string | null
          name: string
          phone?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          doctor_id?: string
          email?: string | null
          id?: string
          location_id?: string | null
          name?: string
          phone?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
          {
            foreignKeyName: "contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_quizzes: {
        Row: {
          category: string
          clinic_id: string | null
          created_at: string
          cta_text: string | null
          cta_type: string | null
          description: string
          doctor_id: string
          id: string
          instructions: string | null
          is_active: boolean | null
          max_score: number
          questions: Json
          scoring: Json
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          clinic_id?: string | null
          created_at?: string
          cta_text?: string | null
          cta_type?: string | null
          description: string
          doctor_id: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_score?: number
          questions?: Json
          scoring?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          clinic_id?: string | null
          created_at?: string
          cta_text?: string | null
          cta_type?: string | null
          description?: string
          doctor_id?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_score?: number
          questions?: Json
          scoring?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_quizzes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_quizzes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_quizzes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      doctor_notifications: {
        Row: {
          clinic_id: string | null
          created_at: string
          doctor_id: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_notifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_notifications_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_notifications_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          access_control: boolean | null
          avatar_url: string | null
          clinic_id: string | null
          clinic_name: string | null
          created_at: string
          doctor_id: string | null
          doctor_id_clinic: string | null
          email: string | null
          email_alias: string | null
          email_alias_created: boolean
          email_settings: Json | null
          first_name: string | null
          id: string
          is_admin: boolean
          is_manager: boolean | null
          is_staff: boolean | null
          last_name: string | null
          location: string | null
          logo_url: string | null
          phone: string | null
          profile_image_url: string | null
          providers: string | null
          specialty: string | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          access_control?: boolean | null
          avatar_url?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_id_clinic?: string | null
          email?: string | null
          email_alias?: string | null
          email_alias_created?: boolean
          email_settings?: Json | null
          first_name?: string | null
          id?: string
          is_admin?: boolean
          is_manager?: boolean | null
          is_staff?: boolean | null
          last_name?: string | null
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          profile_image_url?: string | null
          providers?: string | null
          specialty?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          access_control?: boolean | null
          avatar_url?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_id_clinic?: string | null
          email?: string | null
          email_alias?: string | null
          email_alias_created?: boolean
          email_settings?: Json | null
          first_name?: string | null
          id?: string
          is_admin?: boolean
          is_manager?: boolean | null
          is_staff?: boolean | null
          last_name?: string | null
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          profile_image_url?: string | null
          providers?: string | null
          specialty?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_profiles_doctor_id_clinic_fkey"
            columns: ["doctor_id_clinic"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_profiles_doctor_id_clinic_fkey"
            columns: ["doctor_id_clinic"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
          {
            foreignKeyName: "doctor_profiles_email_alias_fkey"
            columns: ["email_alias"]
            isOneToOne: false
            referencedRelation: "email_aliases"
            referencedColumns: ["alias"]
          },
        ]
      }
      email_alias_requests: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          rejection_reason: string | null
          requested_alias: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          rejection_reason?: string | null
          requested_alias: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          rejection_reason?: string | null
          requested_alias?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_alias_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_alias_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      email_aliases: {
        Row: {
          alias: string
          created_at: string
          doctor_id: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          alias: string
          created_at?: string
          doctor_id: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          alias?: string
          created_at?: string
          doctor_id?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_aliases_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_aliases_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          campaign_name: string
          created_at: string
          doctor_id: string
          id: string
          quiz_id: string | null
          recipient_list: Json
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          status: string
          template_id: string | null
          total_count: number
          updated_at: string
        }
        Insert: {
          campaign_name: string
          created_at?: string
          doctor_id: string
          id?: string
          quiz_id?: string | null
          recipient_list?: Json
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          template_id?: string | null
          total_count?: number
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          created_at?: string
          doctor_id?: string
          id?: string
          quiz_id?: string | null
          recipient_list?: Json
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          template_id?: string | null
          total_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_connections: {
        Row: {
          access_token: string | null
          created_at: string
          display_name: string | null
          doctor_id: string
          email_address: string
          email_provider: string
          expires_at: string | null
          id: string
          is_active: boolean
          refresh_token: string | null
          smtp_config: Json | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          display_name?: string | null
          doctor_id: string
          email_address: string
          email_provider: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          refresh_token?: string | null
          smtp_config?: Json | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          display_name?: string | null
          doctor_id?: string
          email_address?: string
          email_provider?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          refresh_token?: string | null
          smtp_config?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      email_domains: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          doctor_id: string
          domain: string
          id: string
          landing_page_url: string | null
          updated_at: string | null
          verification_token: string | null
          verified: boolean | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          doctor_id: string
          domain: string
          id?: string
          landing_page_url?: string | null
          updated_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          doctor_id?: string
          domain?: string
          id?: string
          landing_page_url?: string | null
          updated_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "email_domains_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          delivered_at: string | null
          doctor_id: string
          error_message: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          sent_at: string
          status: string
          subject: string
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          delivered_at?: string | null
          doctor_id: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          sent_at?: string
          status: string
          subject: string
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          delivered_at?: string | null
          doctor_id?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          doctor_id: string
          html_content: string
          id: string
          is_active: boolean
          subject: string
          template_name: string
          template_type: string
          text_content: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          html_content: string
          id?: string
          is_active?: boolean
          subject: string
          template_name: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          html_content?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_name?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_communications: {
        Row: {
          communication_type: string
          created_at: string | null
          id: string
          lead_id: string
          message: string | null
          metadata: Json | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          communication_type: string
          created_at?: string | null
          id?: string
          lead_id: string
          message?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          communication_type?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          message?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "quiz_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      link_mappings: {
        Row: {
          doctor_id: string
          id: number
          short_id: string
        }
        Insert: {
          doctor_id: string
          id?: number
          short_id: string
        }
        Update: {
          doctor_id?: string
          id?: number
          short_id?: string
        }
        Relationships: []
      }
      nose_landing_pages: {
        Row: {
          chatbot_enabled: boolean
          clinic_id: string | null
          created_at: string
          doctor_id: string
          id: string
          quiz_embedded: boolean
          sections: Json
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          chatbot_enabled?: boolean
          clinic_id?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          quiz_embedded?: boolean
          sections?: Json
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          chatbot_enabled?: boolean
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          quiz_embedded?: boolean
          sections?: Json
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nose_landing_pages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string
          doctor_id: string | null
          expires_at: string
          id: string
          platform: string
          state: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          expires_at: string
          id?: string
          platform: string
          state: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          expires_at?: string
          id?: string
          platform?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_states_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      quiz_incidents: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          description: string | null
          doctor_id: string
          id: string
          name: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id: string
          id?: string
          name: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_incidents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_incidents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_incidents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      quiz_leads: {
        Row: {
          answers: Json | null
          clinic_id: string | null
          created_at: string
          custom_quiz_id: string | null
          doctor_id: string
          email: string | null
          id: string
          incident_source: string | null
          is_partial: boolean | null
          lead_source: string | null
          lead_status: string | null
          location_id: string | null
          name: string
          phone: string | null
          quiz_type: string
          scheduled_date: string | null
          score: number
          share_key: string | null
          submitted_at: string
        }
        Insert: {
          answers?: Json | null
          clinic_id?: string | null
          created_at?: string
          custom_quiz_id?: string | null
          doctor_id: string
          email?: string | null
          id?: string
          incident_source?: string | null
          is_partial?: boolean | null
          lead_source?: string | null
          lead_status?: string | null
          location_id?: string | null
          name: string
          phone?: string | null
          quiz_type: string
          scheduled_date?: string | null
          score: number
          share_key?: string | null
          submitted_at?: string
        }
        Update: {
          answers?: Json | null
          clinic_id?: string | null
          created_at?: string
          custom_quiz_id?: string | null
          doctor_id?: string
          email?: string | null
          id?: string
          incident_source?: string | null
          is_partial?: boolean | null
          lead_source?: string | null
          lead_status?: string | null
          location_id?: string | null
          name?: string
          phone?: string | null
          quiz_type?: string
          scheduled_date?: string | null
          score?: number
          share_key?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_leads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_leads_custom_quiz_id_fkey"
            columns: ["custom_quiz_id"]
            isOneToOne: false
            referencedRelation: "custom_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_leads_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_leads_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
          {
            foreignKeyName: "quiz_leads_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          clinic_id: string | null
          connected: boolean | null
          created_at: string | null
          doctor_id: string
          id: string
          platform: string
          refresh_token: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          access_token?: string | null
          clinic_id?: string | null
          connected?: boolean | null
          created_at?: string | null
          doctor_id: string
          id?: string
          platform: string
          refresh_token?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          access_token?: string | null
          clinic_id?: string | null
          connected?: boolean | null
          created_at?: string | null
          doctor_id?: string
          id?: string
          platform?: string
          refresh_token?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_calendar: {
        Row: {
          created_at: string
          date: string
          doctor_id: string | null
          id: string
          occasion: string
          post_text: string | null
          relevance: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          doctor_id?: string | null
          id?: string
          occasion: string
          post_text?: string | null
          relevance?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string | null
          id?: string
          occasion?: string
          post_text?: string | null
          relevance?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_calendar_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_calendar_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      social_media_templates: {
        Row: {
          category: string | null
          clinic_id: string | null
          content: string
          created_at: string
          description: string | null
          doctor_id: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          is_public: boolean | null
          name: string
          platforms: string[] | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          clinic_id?: string | null
          content: string
          created_at?: string
          description?: string | null
          doctor_id?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          name: string
          platforms?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          clinic_id?: string | null
          content?: string
          created_at?: string
          description?: string | null
          doctor_id?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          name?: string
          platforms?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_templates_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_templates_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      social_post_platforms: {
        Row: {
          created_at: string
          error_message: string | null
          external_post_id: string | null
          id: string
          platform: string
          post_id: string
          published_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_post_id?: string | null
          id?: string
          platform: string
          post_id: string
          published_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_post_id?: string | null
          id?: string
          platform?: string
          post_id?: string
          published_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_platforms_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          clinic_id: string | null
          content: string
          created_at: string
          doctor_id: string | null
          error_message: string | null
          external_post_id: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          platform: string
          published_at: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          content: string
          created_at?: string
          doctor_id?: string | null
          error_message?: string | null
          external_post_id?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          content?: string
          created_at?: string
          doctor_id?: string | null
          error_message?: string | null
          external_post_id?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          doctor_id: string
          email: string
          first_name: string | null
          id: string
          invitation_token: string | null
          invited_at: string
          invited_by: string | null
          last_name: string | null
          linked_user_id: string | null
          permissions: Json | null
          role: string | null
          status: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          doctor_id: string
          email: string
          first_name?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string
          invited_by?: string | null
          last_name?: string | null
          linked_user_id?: string | null
          permissions?: Json | null
          role?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          doctor_id?: string
          email?: string
          first_name?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string
          invited_by?: string | null
          last_name?: string | null
          linked_user_id?: string | null
          permissions?: Json | null
          role?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
    }
    Views: {
      team_member_access: {
        Row: {
          access_control: boolean | null
          clinic_name: string | null
          doctor_id_clinic: string | null
          doctor_profile_id: string | null
          email: string | null
          first_name: string | null
          is_manager: boolean | null
          is_staff: boolean | null
          last_name: string | null
          linked_user_id: string | null
          main_doctor_first_name: string | null
          main_doctor_last_name: string | null
          role: string | null
          status: string | null
          team_member_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_profiles_doctor_id_clinic_fkey"
            columns: ["doctor_id_clinic"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_profiles_doctor_id_clinic_fkey"
            columns: ["doctor_id_clinic"]
            isOneToOne: false
            referencedRelation: "team_member_access"
            referencedColumns: ["doctor_profile_id"]
          },
        ]
      }
    }
    Functions: {
      approve_alias_request: {
        Args: { approved_by: string; request_id: string }
        Returns: boolean
      }
      approve_alias_request_debug: {
        Args: { approved_by: string; request_id: string }
        Returns: Json
      }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      delete_team_member_profile: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      generate_clinic_slug: { Args: { clinic_name: string }; Returns: string }
      generate_invitation_token: { Args: never; Returns: string }
      get_platform_character_limit: {
        Args: { platform_name: string }
        Returns: number
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_alias_available: {
        Args: { requested_alias: string }
        Returns: boolean
      }
      is_invitation_token_valid: { Args: { token: string }; Returns: boolean }
      link_team_member_to_doctor: {
        Args: { p_invitation_token: string; p_user_id: string }
        Returns: Json
      }
      reject_alias_request: {
        Args: {
          rejected_by: string
          rejection_reason?: string
          request_id: string
        }
        Returns: boolean
      }
      update_doctor_profile_user_id: {
        Args: { p_email: string; p_user_id: string }
        Returns: Json
      }
      update_team_member_user_id: { Args: { p_user_id: string }; Returns: Json }
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
