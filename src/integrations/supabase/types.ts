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
      admin_feedback: {
        Row: {
          admin_notes: string | null
          ai_analyzed_at: string | null
          ai_suggestion: Json | null
          category: string | null
          created_at: string | null
          feedback_text: string
          fix_description: string | null
          fix_status: string | null
          id: string
          is_read: boolean | null
          priority: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          selected_element: Json | null
          status: string | null
          suggestion_status: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          ai_analyzed_at?: string | null
          ai_suggestion?: Json | null
          category?: string | null
          created_at?: string | null
          feedback_text: string
          fix_description?: string | null
          fix_status?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          selected_element?: Json | null
          status?: string | null
          suggestion_status?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          ai_analyzed_at?: string | null
          ai_suggestion?: Json | null
          category?: string | null
          created_at?: string | null
          feedback_text?: string
          fix_description?: string | null
          fix_status?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          selected_element?: Json | null
          status?: string | null
          suggestion_status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      aerial_images: {
        Row: {
          angle: string | null
          api_source: string
          capture_date: string | null
          created_at: string
          file_size: number | null
          id: string
          image_metadata: Json | null
          image_quality_score: number | null
          image_type: string
          image_url: string
          latitude: number | null
          lead_id: string | null
          longitude: number | null
          processing_status: string | null
          project_id: string | null
          property_address: string
          quote_request_id: string | null
          resolution: string | null
          season: string | null
          thumbnail_url: string | null
          updated_at: string
          zoom_level: number | null
        }
        Insert: {
          angle?: string | null
          api_source: string
          capture_date?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          image_metadata?: Json | null
          image_quality_score?: number | null
          image_type?: string
          image_url: string
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          processing_status?: string | null
          project_id?: string | null
          property_address: string
          quote_request_id?: string | null
          resolution?: string | null
          season?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          zoom_level?: number | null
        }
        Update: {
          angle?: string | null
          api_source?: string
          capture_date?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          image_metadata?: Json | null
          image_quality_score?: number | null
          image_type?: string
          image_url?: string
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          processing_status?: string | null
          project_id?: string | null
          property_address?: string
          quote_request_id?: string | null
          resolution?: string | null
          season?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          zoom_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aerial_images_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aerial_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversation_messages: {
        Row: {
          agent_type: string | null
          confidence: number | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          structured_data: Json | null
        }
        Insert: {
          agent_type?: string | null
          confidence?: number | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          structured_data?: Json | null
        }
        Update: {
          agent_type?: string | null
          confidence?: number | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          structured_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversations: {
        Row: {
          category: string
          created_at: string
          id: string
          last_message: string | null
          message_count: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          last_message?: string | null
          message_count?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_message?: string | null
          message_count?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_learning_metrics: {
        Row: {
          accuracy_by_edge_type: Json | null
          created_at: string
          id: string
          last_trained_at: string | null
          metric_date: string
          model_version: string | null
          overall_accuracy: number | null
          samples_by_edge_type: Json | null
          total_training_samples: number | null
          training_sample_count: number | null
        }
        Insert: {
          accuracy_by_edge_type?: Json | null
          created_at?: string
          id?: string
          last_trained_at?: string | null
          metric_date?: string
          model_version?: string | null
          overall_accuracy?: number | null
          samples_by_edge_type?: Json | null
          total_training_samples?: number | null
          training_sample_count?: number | null
        }
        Update: {
          accuracy_by_edge_type?: Json | null
          created_at?: string
          id?: string
          last_trained_at?: string | null
          metric_date?: string
          model_version?: string | null
          overall_accuracy?: number | null
          samples_by_edge_type?: Json | null
          total_training_samples?: number | null
          training_sample_count?: number | null
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          confidence_score: number
          context_data: Json | null
          created_at: string
          feedback_notes: string | null
          id: string
          modified_data: Json | null
          quote_id: string
          responded_at: string | null
          session_id: string | null
          suggested_data: Json
          suggestion_type: string
          user_action: string | null
          user_id: string | null
        }
        Insert: {
          confidence_score: number
          context_data?: Json | null
          created_at?: string
          feedback_notes?: string | null
          id?: string
          modified_data?: Json | null
          quote_id: string
          responded_at?: string | null
          session_id?: string | null
          suggested_data: Json
          suggestion_type: string
          user_action?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number
          context_data?: Json | null
          created_at?: string
          feedback_notes?: string | null
          id?: string
          modified_data?: Json | null
          quote_id?: string
          responded_at?: string | null
          session_id?: string | null
          suggested_data?: Json
          suggestion_type?: string
          user_action?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quote_training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workforce_insights: {
        Row: {
          action_items: Json | null
          analysis_period_end: string | null
          analysis_period_start: string | null
          confidence_score: number | null
          created_at: string
          data_sources: Json | null
          description: string
          id: string
          impact_amount: number | null
          impact_type: string | null
          insight_type: string
          status: string | null
          title: string
        }
        Insert: {
          action_items?: Json | null
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          description: string
          id?: string
          impact_amount?: number | null
          impact_type?: string | null
          insight_type: string
          status?: string | null
          title: string
        }
        Update: {
          action_items?: Json | null
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string
          id?: string
          impact_amount?: number | null
          impact_type?: string | null
          insight_type?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: unknown
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      app_icons: {
        Row: {
          app_id: string
          created_at: string
          error_message: string | null
          icon_url: string | null
          id: string
          prompt_used: string | null
          status: string
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          error_message?: string | null
          icon_url?: string | null
          id?: string
          prompt_used?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          error_message?: string | null
          icon_url?: string | null
          id?: string
          prompt_used?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bid_package_bidders: {
        Row: {
          bid_amount: number | null
          bid_package_id: string
          company_name: string
          contact_name: string | null
          created_at: string
          date_sent: string | null
          email: string | null
          id: string
          invited_at: string | null
          notes: string | null
          phone: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string
          will_submit: boolean | null
        }
        Insert: {
          bid_amount?: number | null
          bid_package_id: string
          company_name: string
          contact_name?: string | null
          created_at?: string
          date_sent?: string | null
          email?: string | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          will_submit?: boolean | null
        }
        Update: {
          bid_amount?: number | null
          bid_package_id?: string
          company_name?: string
          contact_name?: string | null
          created_at?: string
          date_sent?: string | null
          email?: string | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          will_submit?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_package_bidders_bid_package_id_fkey"
            columns: ["bid_package_id"]
            isOneToOne: false
            referencedRelation: "bid_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_package_files: {
        Row: {
          bid_package_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          bid_package_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bid_package_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_package_files_bid_package_id_fkey"
            columns: ["bid_package_id"]
            isOneToOne: false
            referencedRelation: "bid_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_package_items: {
        Row: {
          bid_package_id: string
          cost_code: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          item_name: string
          item_type: string | null
          quantity: number | null
          unit: string | null
        }
        Insert: {
          bid_package_id: string
          cost_code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          item_name: string
          item_type?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          bid_package_id?: string
          cost_code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          item_name?: string
          item_type?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_package_items_bid_package_id_fkey"
            columns: ["bid_package_id"]
            isOneToOne: false
            referencedRelation: "bid_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_packages: {
        Row: {
          bid_manager_id: string | null
          bid_number: string | null
          bidding_deadline: string | null
          clarification: string | null
          created_at: string
          created_by: string | null
          deadline_time: string | null
          estimate_id: string | null
          exclusions: string | null
          id: string
          inclusions: string | null
          reminder_days: number | null
          scope_of_work: string | null
          status: string | null
          terms: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bid_manager_id?: string | null
          bid_number?: string | null
          bidding_deadline?: string | null
          clarification?: string | null
          created_at?: string
          created_by?: string | null
          deadline_time?: string | null
          estimate_id?: string | null
          exclusions?: string | null
          id?: string
          inclusions?: string | null
          reminder_days?: number | null
          scope_of_work?: string | null
          status?: string | null
          terms?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bid_manager_id?: string | null
          bid_number?: string | null
          bidding_deadline?: string | null
          clarification?: string | null
          created_at?: string
          created_by?: string | null
          deadline_time?: string | null
          estimate_id?: string | null
          exclusions?: string | null
          id?: string
          inclusions?: string | null
          reminder_days?: number | null
          scope_of_work?: string | null
          status?: string | null
          terms?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_packages_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_submissions: {
        Row: {
          awarded_at: string | null
          bid_package_id: string
          bid_total: number | null
          bidder_id: string
          created_at: string
          id: string
          is_awarded: boolean | null
          notes: string | null
          submitted_at: string
        }
        Insert: {
          awarded_at?: string | null
          bid_package_id: string
          bid_total?: number | null
          bidder_id: string
          created_at?: string
          id?: string
          is_awarded?: boolean | null
          notes?: string | null
          submitted_at?: string
        }
        Update: {
          awarded_at?: string | null
          bid_package_id?: string
          bid_total?: number | null
          bidder_id?: string
          created_at?: string
          id?: string
          is_awarded?: boolean | null
          notes?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_submissions_bid_package_id_fkey"
            columns: ["bid_package_id"]
            isOneToOne: false
            referencedRelation: "bid_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_submissions_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "bid_package_bidders"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_files: {
        Row: {
          bill_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          bill_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bill_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_files_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_items: {
        Row: {
          bill_id: string
          cost_code: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_taxable: boolean | null
          item_name: string
          quantity: number | null
          total: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          bill_id: string
          cost_code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_taxable?: boolean | null
          item_name: string
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          bill_id?: string
          cost_code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_taxable?: boolean | null
          item_name?: string
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_notes: {
        Row: {
          bill_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          bill_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          bill_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_notes_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_payments: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          balance_due: number | null
          bill_date: string
          bill_number: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_billable: boolean | null
          paid: number | null
          project_id: string | null
          project_name: string | null
          ref_number: string | null
          status: string | null
          sub_total: number | null
          tax: number | null
          terms: string | null
          total: number | null
          updated_at: string
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          balance_due?: number | null
          bill_date?: string
          bill_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_billable?: boolean | null
          paid?: number | null
          project_id?: string | null
          project_name?: string | null
          ref_number?: string | null
          status?: string | null
          sub_total?: number | null
          tax?: number | null
          terms?: string | null
          total?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          balance_due?: number | null
          bill_date?: string
          bill_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_billable?: boolean | null
          paid?: number | null
          project_id?: string | null
          project_name?: string | null
          ref_number?: string | null
          status?: string | null
          sub_total?: number | null
          tax?: number | null
          terms?: string | null
          total?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          category: Database["public"]["Enums"]["blog_category"]
          content: string
          created_at: string | null
          excerpt: string
          featured: boolean | null
          id: string
          image_url: string | null
          published: boolean | null
          read_time: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string
          category: Database["public"]["Enums"]["blog_category"]
          content: string
          created_at?: string | null
          excerpt: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          read_time?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          category?: Database["public"]["Enums"]["blog_category"]
          content?: string
          created_at?: string | null
          excerpt?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          read_time?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          created_at: string | null
          deployment_id: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          legacy_supabase_project_id: string | null
          legacy_supabase_url: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deployment_id?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          legacy_supabase_project_id?: string | null
          legacy_supabase_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deployment_id?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          legacy_supabase_project_id?: string | null
          legacy_supabase_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          bland_call_id: string
          completed_at: string | null
          created_at: string
          duration_min: number | null
          from_number: string
          id: string
          is_available: boolean
          raw: Json | null
          recording_url: string | null
          started_at: string | null
          status: string | null
          summary: string | null
          synced_at: string
          to_number: string
          transcript: string | null
        }
        Insert: {
          bland_call_id: string
          completed_at?: string | null
          created_at?: string
          duration_min?: number | null
          from_number: string
          id?: string
          is_available?: boolean
          raw?: Json | null
          recording_url?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          synced_at?: string
          to_number: string
          transcript?: string | null
        }
        Update: {
          bland_call_id?: string
          completed_at?: string | null
          created_at?: string
          duration_min?: number | null
          from_number?: string
          id?: string
          is_available?: boolean
          raw?: Json | null
          recording_url?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          synced_at?: string
          to_number?: string
          transcript?: string | null
        }
        Relationships: []
      }
      change_order_files: {
        Row: {
          change_order_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          change_order_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          change_order_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_order_files_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      change_order_items: {
        Row: {
          assigned_to: string | null
          change_order_id: string
          cost_code: string | null
          created_at: string
          display_order: number | null
          id: string
          is_taxable: boolean | null
          item_name: string
          item_type: string | null
          markup_percent: number | null
          quantity: number | null
          total: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          assigned_to?: string | null
          change_order_id: string
          cost_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_taxable?: boolean | null
          item_name: string
          item_type?: string | null
          markup_percent?: number | null
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          assigned_to?: string | null
          change_order_id?: string
          cost_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_taxable?: boolean | null
          item_name?: string
          item_type?: string | null
          markup_percent?: number | null
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "change_order_items_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      change_order_notes: {
        Row: {
          change_order_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          change_order_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          change_order_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_order_notes_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          approved_by: string | null
          associated_rfi: string | null
          co_number: string | null
          created_at: string
          created_by: string | null
          customer_co_number: string | null
          customer_id: string | null
          date: string
          description: string | null
          estimate_id: string | null
          estimated_cost: number | null
          estimator_id: string | null
          grand_total: number | null
          id: string
          is_no_cost: boolean | null
          profit_margin: number | null
          project_id: string | null
          project_manager_id: string | null
          requested_by: string | null
          status: string
          sub_total: number | null
          tax: number | null
          time_delay: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          associated_rfi?: string | null
          co_number?: string | null
          created_at?: string
          created_by?: string | null
          customer_co_number?: string | null
          customer_id?: string | null
          date?: string
          description?: string | null
          estimate_id?: string | null
          estimated_cost?: number | null
          estimator_id?: string | null
          grand_total?: number | null
          id?: string
          is_no_cost?: boolean | null
          profit_margin?: number | null
          project_id?: string | null
          project_manager_id?: string | null
          requested_by?: string | null
          status?: string
          sub_total?: number | null
          tax?: number | null
          time_delay?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          associated_rfi?: string | null
          co_number?: string | null
          created_at?: string
          created_by?: string | null
          customer_co_number?: string | null
          customer_id?: string | null
          date?: string
          description?: string | null
          estimate_id?: string | null
          estimated_cost?: number | null
          estimator_id?: string | null
          grand_total?: number | null
          id?: string
          is_no_cost?: boolean | null
          profit_margin?: number | null
          project_id?: string | null
          project_manager_id?: string | null
          requested_by?: string | null
          status?: string
          sub_total?: number | null
          tax?: number | null
          time_delay?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversation_state: {
        Row: {
          conversation_data: Json | null
          created_at: string | null
          id: string
          interest_score: number | null
          last_message_at: string | null
          message_count: number | null
          mrf_prospect_id: string
          qualification_data: Json | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          conversation_data?: Json | null
          created_at?: string | null
          id?: string
          interest_score?: number | null
          last_message_at?: string | null
          message_count?: number | null
          mrf_prospect_id: string
          qualification_data?: Json | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          conversation_data?: Json | null
          created_at?: string | null
          id?: string
          interest_score?: number | null
          last_message_at?: string | null
          message_count?: number | null
          mrf_prospect_id?: string
          qualification_data?: Json | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_conversations_mrf: {
        Row: {
          assistant_response: string
          created_at: string | null
          id: string
          interest_score: number | null
          lead_id: string | null
          mrf_prospect_id: string
          qualification_data: Json | null
          session_id: string
          user_message: string
        }
        Insert: {
          assistant_response: string
          created_at?: string | null
          id?: string
          interest_score?: number | null
          lead_id?: string | null
          mrf_prospect_id: string
          qualification_data?: Json | null
          session_id: string
          user_message: string
        }
        Update: {
          assistant_response?: string
          created_at?: string | null
          id?: string
          interest_score?: number | null
          lead_id?: string | null
          mrf_prospect_id?: string
          qualification_data?: Json | null
          session_id?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_mrf_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activity_log: {
        Row: {
          activity_type: string
          actor_name: string | null
          client_id: string
          created_at: string
          deliverable_id: string | null
          description: string
          id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          actor_name?: string | null
          client_id: string
          created_at?: string
          deliverable_id?: string | null
          description: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          actor_name?: string | null
          client_id?: string
          created_at?: string
          deliverable_id?: string | null
          description?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activity_log_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "client_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      client_chatbot_conversations: {
        Row: {
          client_id: string | null
          created_at: string | null
          deep_link_url: string | null
          delivered_at: string | null
          id: string
          message: string
          message_type: string | null
          project_id: string | null
          read_at: string | null
          sender_type: string
          twilio_message_sid: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deep_link_url?: string | null
          delivered_at?: string | null
          id?: string
          message: string
          message_type?: string | null
          project_id?: string | null
          read_at?: string | null
          sender_type: string
          twilio_message_sid?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deep_link_url?: string | null
          delivered_at?: string | null
          id?: string
          message?: string
          message_type?: string | null
          project_id?: string | null
          read_at?: string | null
          sender_type?: string
          twilio_message_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_chatbot_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_chatbot_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contracts: {
        Row: {
          contract_number: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          file_url: string
          id: string
          project_id: string
          proposal_id: string | null
          signature_url: string | null
          signed_at: string | null
          signed_by_name: string | null
          start_date: string | null
          status: string | null
          title: string
          total_value: number | null
        }
        Insert: {
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          file_url: string
          id?: string
          project_id: string
          proposal_id?: string | null
          signature_url?: string | null
          signed_at?: string | null
          signed_by_name?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          total_value?: number | null
        }
        Update: {
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          file_url?: string
          id?: string
          project_id?: string
          proposal_id?: string | null
          signature_url?: string | null
          signed_at?: string | null
          signed_by_name?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_deliverables: {
        Row: {
          activity_description: string | null
          assigned_team_member: string | null
          client_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deliverable_id: string
          estimated_completion: string | null
          id: string
          last_activity: string | null
          notes: string | null
          progress_percent: number | null
          screenshots: Json | null
          status: string | null
          timeline_events: Json | null
          updated_at: string
        }
        Insert: {
          activity_description?: string | null
          assigned_team_member?: string | null
          client_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deliverable_id: string
          estimated_completion?: string | null
          id?: string
          last_activity?: string | null
          notes?: string | null
          progress_percent?: number | null
          screenshots?: Json | null
          status?: string | null
          timeline_events?: Json | null
          updated_at?: string
        }
        Update: {
          activity_description?: string | null
          assigned_team_member?: string | null
          client_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deliverable_id?: string
          estimated_completion?: string | null
          id?: string
          last_activity?: string | null
          notes?: string | null
          progress_percent?: number | null
          screenshots?: Json | null
          status?: string | null
          timeline_events?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_deliverables_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "plan_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      client_designs: {
        Row: {
          category: string | null
          client_id: string
          created_at: string
          description: string | null
          design_url: string | null
          error_message: string | null
          generation_prompt: string | null
          id: string
          inspiration_url: string | null
          name: string
          status: string | null
          thumbnail_url: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          design_url?: string | null
          error_message?: string | null
          generation_prompt?: string | null
          id?: string
          inspiration_url?: string | null
          name: string
          status?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          design_url?: string | null
          error_message?: string | null
          generation_prompt?: string | null
          id?: string
          inspiration_url?: string | null
          name?: string
          status?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_designs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id?: string | null
          sender_type?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_nfc_cards: {
        Row: {
          card_data: Json | null
          card_name: string
          client_id: string
          created_at: string
          design_instructions: string | null
          design_url: string | null
          error_message: string | null
          id: string
          status: string | null
          thumbnail_url: string | null
        }
        Insert: {
          card_data?: Json | null
          card_name: string
          client_id: string
          created_at?: string
          design_instructions?: string | null
          design_url?: string | null
          error_message?: string | null
          id?: string
          status?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          card_data?: Json | null
          card_name?: string
          client_id?: string
          created_at?: string
          design_instructions?: string | null
          design_url?: string | null
          error_message?: string | null
          id?: string
          status?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_nfc_cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_polls: {
        Row: {
          client_choice: string | null
          client_feedback: string | null
          client_id: string
          created_at: string
          deliverable_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          option_a_image_url: string | null
          option_a_label: string
          option_b_image_url: string | null
          option_b_label: string
          responded_at: string | null
          title: string
        }
        Insert: {
          client_choice?: string | null
          client_feedback?: string | null
          client_id: string
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          option_a_image_url?: string | null
          option_a_label?: string
          option_b_image_url?: string | null
          option_b_label?: string
          responded_at?: string | null
          title: string
        }
        Update: {
          client_choice?: string | null
          client_feedback?: string | null
          client_id?: string
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          option_a_image_url?: string | null
          option_a_label?: string
          option_b_image_url?: string | null
          option_b_label?: string
          responded_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_polls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_polls_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "client_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_access: {
        Row: {
          access_token: string
          client_id: string | null
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          project_id: string | null
          url_slug: string | null
        }
        Insert: {
          access_token?: string
          client_id?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          project_id?: string | null
          url_slug?: string | null
        }
        Update: {
          access_token?: string
          client_id?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          project_id?: string | null
          url_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_updates: {
        Row: {
          acknowledged_at: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          media_urls: string[] | null
          project_id: string
          requires_acknowledgment: boolean | null
          title: string
          update_type: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          media_urls?: string[] | null
          project_id: string
          requires_acknowledgment?: boolean | null
          title: string
          update_type?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          media_urls?: string[] | null
          project_id?: string
          requires_acknowledgment?: boolean | null
          title?: string
          update_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companycam_photos: {
        Row: {
          admin_notes: string | null
          companycam_photo_id: string
          created_at: string
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          photo_type: string | null
          photo_url: string
          project_id: string
          published_at: string | null
          quality_score: number | null
          taken_at: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          companycam_photo_id: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          photo_type?: string | null
          photo_url: string
          project_id: string
          published_at?: string | null
          quality_score?: number | null
          taken_at?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          companycam_photo_id?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          photo_type?: string | null
          photo_url?: string
          project_id?: string
          published_at?: string | null
          quality_score?: number | null
          taken_at?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companycam_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "companycam_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companycam_projects: {
        Row: {
          admin_notes: string | null
          companycam_project_id: string
          completed_date: string | null
          created_at: string
          created_date: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          last_synced_at: string | null
          location: string | null
          materials_used: string[] | null
          name: string
          project_type: string | null
          published_at: string | null
          status: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          companycam_project_id: string
          completed_date?: string | null
          created_at?: string
          created_date?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          materials_used?: string[] | null
          name: string
          project_type?: string | null
          published_at?: string | null
          status: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          companycam_project_id?: string
          completed_date?: string | null
          created_at?: string
          created_date?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          materials_used?: string[] | null
          name?: string
          project_type?: string | null
          published_at?: string | null
          status?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      connecteam_config: {
        Row: {
          api_endpoint: string
          created_at: string
          id: string
          last_sync_at: string | null
          sync_errors: Json | null
          sync_status: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          sync_errors?: Json | null
          sync_status?: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          sync_errors?: Json | null
          sync_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_bills: {
        Row: {
          amount: number | null
          bill_date: string
          bill_number: string
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          is_billable: boolean | null
          notes: string | null
          project_id: string | null
          status: string | null
          terms: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount?: number | null
          bill_date?: string
          bill_number: string
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_billable?: boolean | null
          notes?: string | null
          project_id?: string | null
          status?: string | null
          terms?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number | null
          bill_date?: string
          bill_number?: string
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_billable?: boolean | null
          notes?: string | null
          project_id?: string | null
          status?: string | null
          terms?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_bills_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_files: {
        Row: {
          contact_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          contact_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          contact_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_files_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_notes: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          conversation_length: number | null
          created_at: string | null
          id: string
          interest_score: number | null
          last_activity: string | null
          lead_id: string | null
          messages: Json | null
          mrf_prospect_id: string | null
          qualification_data: Json | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          conversation_length?: number | null
          created_at?: string | null
          id?: string
          interest_score?: number | null
          last_activity?: string | null
          lead_id?: string | null
          messages?: Json | null
          mrf_prospect_id?: string | null
          qualification_data?: Json | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          conversation_length?: number | null
          created_at?: string | null
          id?: string
          interest_score?: number | null
          last_activity?: string | null
          lead_id?: string | null
          messages?: Json | null
          mrf_prospect_id?: string | null
          qualification_data?: Json | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_memberships: {
        Row: {
          created_at: string
          crew_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crew_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crew_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_memberships_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          created_at: string
          crew_lead_id: string | null
          crew_name: string
          description: string | null
          id: string
          is_active: boolean
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crew_lead_id?: string | null
          crew_name: string
          description?: string | null
          id?: string
          is_active?: boolean
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crew_lead_id?: string | null
          crew_name?: string
          description?: string | null
          id?: string
          is_active?: boolean
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_automations: {
        Row: {
          action_data: Json
          action_type: string
          condition_data: Json | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          action_data?: Json
          action_type: string
          condition_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          condition_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_customer_progress: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          current_phase_id: string | null
          current_step_id: string | null
          customer_id: string
          id: string
          progress_percentage: number
          started_at: string
          status: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          current_phase_id?: string | null
          current_step_id?: string | null
          customer_id: string
          id?: string
          progress_percentage?: number
          started_at?: string
          status?: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          current_phase_id?: string | null
          current_step_id?: string | null
          customer_id?: string
          id?: string
          progress_percentage?: number
          started_at?: string
          status?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_customer_progress_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_customer_progress_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "v_crm_phase_counts"
            referencedColumns: ["phase_id"]
          },
          {
            foreignKeyName: "crm_customer_progress_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_customer_progress_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_customer_progress_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_documents: {
        Row: {
          created_at: string
          customer_progress_id: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          customer_progress_id: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          customer_progress_id?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_documents_customer_progress_id_fkey"
            columns: ["customer_progress_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_customer_progress_id_fkey"
            columns: ["customer_progress_id"]
            isOneToOne: false
            referencedRelation: "v_crm_progress"
            referencedColumns: ["progress_id"]
          },
        ]
      }
      crm_step_history: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          customer_progress_id: string
          id: string
          notes: string | null
          started_at: string | null
          status: string
          step_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          customer_progress_id: string
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          customer_progress_id?: string
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_step_history_customer_progress_id_fkey"
            columns: ["customer_progress_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_step_history_customer_progress_id_fkey"
            columns: ["customer_progress_id"]
            isOneToOne: false
            referencedRelation: "v_crm_progress"
            referencedColumns: ["progress_id"]
          },
          {
            foreignKeyName: "crm_step_history_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_user_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          customer_progress_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          customer_progress_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          customer_progress_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_user_assignments_customer_progress_id_fkey"
            columns: ["customer_progress_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_user_assignments_customer_progress_id_fkey"
            columns: ["customer_progress_id"]
            isOneToOne: false
            referencedRelation: "v_crm_progress"
            referencedColumns: ["progress_id"]
          },
        ]
      }
      crm_workflow_phases: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          phase_order: number
          workflow_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          phase_order: number
          workflow_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          phase_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_phases_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflow_steps: {
        Row: {
          created_at: string
          description: string | null
          estimated_duration_hours: number | null
          id: string
          is_required: boolean
          name: string
          phase_id: string
          step_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_required?: boolean
          name: string
          phase_id: string
          step_order: number
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_required?: boolean
          name?: string
          phase_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_steps_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_steps_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "v_crm_phase_counts"
            referencedColumns: ["phase_id"]
          },
        ]
      }
      crm_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_feedback: {
        Row: {
          content: string
          created_at: string
          customer_email: string
          feedback_source: string | null
          feedback_type: string
          id: string
          is_read: boolean | null
          project_id: string
        }
        Insert: {
          content: string
          created_at?: string
          customer_email: string
          feedback_source?: string | null
          feedback_type?: string
          id?: string
          is_read?: boolean | null
          project_id: string
        }
        Update: {
          content?: string
          created_at?: string
          customer_email?: string
          feedback_source?: string | null
          feedback_type?: string
          id?: string
          is_read?: boolean | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_entries: {
        Row: {
          arrival_time: string | null
          created_at: string | null
          created_by: string | null
          delay_notes: string | null
          departure_time: string | null
          has_schedule_delay: boolean | null
          has_weather_delay: boolean | null
          id: string
          log_date: string
          project_id: string
          site_condition: string | null
          site_condition_notes: string | null
          status: string | null
          tasks_performed: string | null
          updated_at: string | null
          weather_data: Json | null
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string | null
          created_by?: string | null
          delay_notes?: string | null
          departure_time?: string | null
          has_schedule_delay?: boolean | null
          has_weather_delay?: boolean | null
          id?: string
          log_date: string
          project_id: string
          site_condition?: string | null
          site_condition_notes?: string | null
          status?: string | null
          tasks_performed?: string | null
          updated_at?: string | null
          weather_data?: Json | null
        }
        Update: {
          arrival_time?: string | null
          created_at?: string | null
          created_by?: string | null
          delay_notes?: string | null
          departure_time?: string | null
          has_schedule_delay?: boolean | null
          has_weather_delay?: boolean | null
          id?: string
          log_date?: string
          project_id?: string
          site_condition?: string | null
          site_condition_notes?: string | null
          status?: string | null
          tasks_performed?: string | null
          updated_at?: string | null
          weather_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_equipment: {
        Row: {
          cost_code: string | null
          created_at: string | null
          daily_log_id: string
          description: string | null
          equipment_name: string
          equipment_type: string
          hours: number | null
          id: string
          operator: string | null
          status: string | null
        }
        Insert: {
          cost_code?: string | null
          created_at?: string | null
          daily_log_id: string
          description?: string | null
          equipment_name: string
          equipment_type: string
          hours?: number | null
          id?: string
          operator?: string | null
          status?: string | null
        }
        Update: {
          cost_code?: string | null
          created_at?: string | null
          daily_log_id?: string
          description?: string | null
          equipment_name?: string
          equipment_type?: string
          hours?: number | null
          id?: string
          operator?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_equipment_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_files: {
        Row: {
          category: string | null
          created_at: string | null
          daily_log_id: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          daily_log_id: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          daily_log_id?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_files_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_materials: {
        Row: {
          created_at: string | null
          daily_log_id: string
          delivered_by: string | null
          description: string | null
          id: string
          item_name: string
          material_type: string
          quantity: number | null
          supplier: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          daily_log_id: string
          delivered_by?: string | null
          description?: string | null
          id?: string
          item_name: string
          material_type: string
          quantity?: number | null
          supplier?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          daily_log_id?: string
          delivered_by?: string | null
          description?: string | null
          id?: string
          item_name?: string
          material_type?: string
          quantity?: number | null
          supplier?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_materials_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_notes: {
        Row: {
          content: string
          created_at: string | null
          daily_log_id: string
          id: string
          note_type: string
          posted_at: string | null
          posted_by: string | null
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          daily_log_id: string
          id?: string
          note_type?: string
          posted_at?: string | null
          posted_by?: string | null
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          daily_log_id?: string
          id?: string
          note_type?: string
          posted_at?: string | null
          posted_by?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_notes_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_people: {
        Row: {
          cost_code: string | null
          created_at: string | null
          daily_log_id: string
          employee_name: string
          hours_worked: number | null
          id: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          cost_code?: string | null
          created_at?: string | null
          daily_log_id: string
          employee_name: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          cost_code?: string | null
          created_at?: string | null
          daily_log_id?: string
          employee_name?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_people_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_subcontractors: {
        Row: {
          company_name: string
          contact_name: string | null
          created_at: string | null
          daily_log_id: string
          id: string
          notes: string | null
          work_performed: string | null
          workers_count: number | null
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          daily_log_id: string
          id?: string
          notes?: string | null
          work_performed?: string | null
          workers_count?: number | null
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          daily_log_id?: string
          id?: string
          notes?: string | null
          work_performed?: string | null
          workers_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_subcontractors_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_visitors: {
        Row: {
          arrival_time: string | null
          company: string | null
          created_at: string | null
          daily_log_id: string
          departure_time: string | null
          id: string
          notes: string | null
          purpose: string | null
          visitor_name: string
        }
        Insert: {
          arrival_time?: string | null
          company?: string | null
          created_at?: string | null
          daily_log_id: string
          departure_time?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          visitor_name: string
        }
        Update: {
          arrival_time?: string | null
          company?: string | null
          created_at?: string | null
          daily_log_id?: string
          departure_time?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_visitors_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_one_id: string
          participant_two_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one_id: string
          participant_two_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one_id?: string
          participant_two_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      directory_contacts: {
        Row: {
          address: string | null
          cell: string | null
          city: string | null
          company: string | null
          contact_name: string | null
          contact_type: string
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          is_favorite: boolean | null
          last_name: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          rating: number | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          cell?: string | null
          city?: string | null
          company?: string | null
          contact_name?: string | null
          contact_type: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          cell?: string | null
          city?: string | null
          company?: string | null
          contact_name?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      document_fields: {
        Row: {
          created_at: string
          default_value: string | null
          document_id: string
          field_label: string | null
          field_type: string
          height: number
          id: string
          is_required: boolean | null
          options: Json | null
          page_number: number
          recipient_id: string
          tab_order: number | null
          validation_pattern: string | null
          width: number
          x_position: number
          y_position: number
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          document_id: string
          field_label?: string | null
          field_type: string
          height: number
          id?: string
          is_required?: boolean | null
          options?: Json | null
          page_number?: number
          recipient_id: string
          tab_order?: number | null
          validation_pattern?: string | null
          width: number
          x_position: number
          y_position: number
        }
        Update: {
          created_at?: string
          default_value?: string | null
          document_id?: string
          field_label?: string | null
          field_type?: string
          height?: number
          id?: string
          is_required?: boolean | null
          options?: Json | null
          page_number?: number
          recipient_id?: string
          tab_order?: number | null
          validation_pattern?: string | null
          width?: number
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_fields_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "envelope_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_fields_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "envelope_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_actions: {
        Row: {
          category: string
          color: string
          created_at: string | null
          id: string
          is_custom: boolean | null
          label: string
          quote_id: string
        }
        Insert: {
          category: string
          color: string
          created_at?: string | null
          id?: string
          is_custom?: boolean | null
          label: string
          quote_id: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string | null
          id?: string
          is_custom?: boolean | null
          label?: string
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edge_actions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_categories: {
        Row: {
          color: string
          created_at: string | null
          display_order: number | null
          group_name: string | null
          hotkey: string | null
          id: string
          is_active: boolean | null
          key: string
          label: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          display_order?: number | null
          group_name?: string | null
          hotkey?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          label: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          display_order?: number | null
          group_name?: string | null
          hotkey?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          label?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edge_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "edge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_training_data: {
        Row: {
          angle_degrees: number | null
          confidence_score: number | null
          correction_applied: boolean | null
          correction_metadata: Json | null
          created_at: string
          drawing_sequence: Json | null
          edge_type: string
          id: string
          imagery_metadata: Json | null
          length_ft: number | null
          line_geometry: Json
          neighboring_lines: Json | null
          quote_id: string
          roof_context: Json | null
          session_id: string | null
          training_quality_score: number | null
          user_accepted: boolean | null
          user_id: string | null
          was_ai_suggestion: boolean | null
        }
        Insert: {
          angle_degrees?: number | null
          confidence_score?: number | null
          correction_applied?: boolean | null
          correction_metadata?: Json | null
          created_at?: string
          drawing_sequence?: Json | null
          edge_type: string
          id?: string
          imagery_metadata?: Json | null
          length_ft?: number | null
          line_geometry: Json
          neighboring_lines?: Json | null
          quote_id: string
          roof_context?: Json | null
          session_id?: string | null
          training_quality_score?: number | null
          user_accepted?: boolean | null
          user_id?: string | null
          was_ai_suggestion?: boolean | null
        }
        Update: {
          angle_degrees?: number | null
          confidence_score?: number | null
          correction_applied?: boolean | null
          correction_metadata?: Json | null
          created_at?: string
          drawing_sequence?: Json | null
          edge_type?: string
          id?: string
          imagery_metadata?: Json | null
          length_ft?: number | null
          line_geometry?: Json
          neighboring_lines?: Json | null
          quote_id?: string
          roof_context?: Json | null
          session_id?: string | null
          training_quality_score?: number | null
          user_accepted?: boolean | null
          user_id?: string | null
          was_ai_suggestion?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "edge_training_data_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      edges: {
        Row: {
          created_at: string | null
          facet_id: string | null
          id: string
          label: Database["public"]["Enums"]["edge_label"]
          length_ft: number
          line_geojson: Json
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          facet_id?: string | null
          id?: string
          label: Database["public"]["Enums"]["edge_label"]
          length_ft?: number
          line_geojson: Json
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          facet_id?: string | null
          id?: string
          label?: Database["public"]["Enums"]["edge_label"]
          length_ft?: number
          line_geojson?: Json
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edges_facet_id_fkey"
            columns: ["facet_id"]
            isOneToOne: false
            referencedRelation: "facets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_certifications: {
        Row: {
          certification_name: string
          certification_type: string
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          is_active: boolean
          issued_date: string | null
          issuing_body: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certification_name: string
          certification_type?: string
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          issued_date?: string | null
          issuing_body?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certification_name?: string
          certification_type?: string
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          issued_date?: string | null
          issuing_body?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_mapping: {
        Row: {
          connecteam_employee_id: string
          connecteam_name: string | null
          created_at: string
          email: string
          id: string
          sync_status: string
          team_directory_user_id: string | null
          updated_at: string
        }
        Insert: {
          connecteam_employee_id: string
          connecteam_name?: string | null
          created_at?: string
          email: string
          id?: string
          sync_status?: string
          team_directory_user_id?: string | null
          updated_at?: string
        }
        Update: {
          connecteam_employee_id?: string
          connecteam_name?: string | null
          created_at?: string
          email?: string
          id?: string
          sync_status?: string
          team_directory_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_pay_rates: {
        Row: {
          burden_multiplier: number | null
          created_at: string
          effective_from: string
          effective_to: string | null
          employee_mapping_id: string
          hourly_rate: number
          id: string
          overhead_allocation_rate: number | null
          overtime_multiplier: number | null
          updated_at: string
        }
        Insert: {
          burden_multiplier?: number | null
          created_at?: string
          effective_from: string
          effective_to?: string | null
          employee_mapping_id: string
          hourly_rate: number
          id?: string
          overhead_allocation_rate?: number | null
          overtime_multiplier?: number | null
          updated_at?: string
        }
        Update: {
          burden_multiplier?: number | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          employee_mapping_id?: string
          hourly_rate?: number
          id?: string
          overhead_allocation_rate?: number | null
          overtime_multiplier?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_requests: {
        Row: {
          break_duration_minutes: number | null
          break_end_time: string | null
          break_start_time: string | null
          break_type: string | null
          created_at: string
          explanation: string | null
          id: string
          include_mileage: boolean | null
          is_all_day: boolean | null
          job_name: string | null
          notes: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          shift_end_date: string | null
          shift_end_time: string | null
          shift_start_date: string | null
          shift_start_time: string | null
          status: string
          submitted_at: string
          time_off_end_date: string | null
          time_off_end_time: string | null
          time_off_start_date: string | null
          time_off_start_time: string | null
          time_off_type: string | null
          total_hours: number | null
          total_time_off_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          break_duration_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          break_type?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          include_mileage?: boolean | null
          is_all_day?: boolean | null
          job_name?: string | null
          notes?: string | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_end_date?: string | null
          shift_end_time?: string | null
          shift_start_date?: string | null
          shift_start_time?: string | null
          status?: string
          submitted_at?: string
          time_off_end_date?: string | null
          time_off_end_time?: string | null
          time_off_start_date?: string | null
          time_off_start_time?: string | null
          time_off_type?: string | null
          total_hours?: number | null
          total_time_off_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          break_duration_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          break_type?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          include_mileage?: boolean | null
          is_all_day?: boolean | null
          job_name?: string | null
          notes?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_end_date?: string | null
          shift_end_time?: string | null
          shift_start_date?: string | null
          shift_start_time?: string | null
          status?: string
          submitted_at?: string
          time_off_end_date?: string | null
          time_off_end_time?: string | null
          time_off_start_date?: string | null
          time_off_start_time?: string | null
          time_off_type?: string | null
          total_hours?: number | null
          total_time_off_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_scores: {
        Row: {
          calculated_at: string
          created_at: string
          experience_score: number
          id: string
          performance_score: number
          reliability_score: number
          safety_score: number
          score_breakdown: Json | null
          skills_score: number
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          experience_score?: number
          id?: string
          performance_score?: number
          reliability_score?: number
          safety_score?: number
          score_breakdown?: Json | null
          skills_score?: number
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          experience_score?: number
          id?: string
          performance_score?: number
          reliability_score?: number
          safety_score?: number
          score_breakdown?: Json | null
          skills_score?: number
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_skills: {
        Row: {
          created_at: string
          id: string
          proficiency_level: number
          skill_category: string
          skill_name: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency_level?: number
          skill_category?: string
          skill_name: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          proficiency_level?: number
          skill_category?: string
          skill_name?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      enhanced_visitor_sessions: {
        Row: {
          chat_messages_count: number | null
          created_at: string | null
          id: string
          interest_indicators: Json | null
          last_activity: string | null
          mrf_prospect_id: string
          page_views: number | null
          qualification_score: number | null
          search_queries: Json | null
          session_data: Json | null
          session_id: string
          total_time_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          chat_messages_count?: number | null
          created_at?: string | null
          id?: string
          interest_indicators?: Json | null
          last_activity?: string | null
          mrf_prospect_id: string
          page_views?: number | null
          qualification_score?: number | null
          search_queries?: Json | null
          session_data?: Json | null
          session_id: string
          total_time_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          chat_messages_count?: number | null
          created_at?: string | null
          id?: string
          interest_indicators?: Json | null
          last_activity?: string | null
          mrf_prospect_id?: string
          page_views?: number | null
          qualification_score?: number | null
          search_queries?: Json | null
          session_data?: Json | null
          session_id?: string
          total_time_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      envelope_audit_trail: {
        Row: {
          action: string
          details: Json | null
          envelope_id: string
          id: string
          ip_address: string | null
          recipient_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          envelope_id: string
          id?: string
          ip_address?: string | null
          recipient_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          envelope_id?: string
          id?: string
          ip_address?: string | null
          recipient_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envelope_audit_trail_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "signature_envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envelope_audit_trail_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "envelope_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      envelope_documents: {
        Row: {
          created_at: string
          document_order: number
          envelope_id: string
          file_url: string
          id: string
          metadata: Json | null
          name: string
          page_count: number
        }
        Insert: {
          created_at?: string
          document_order?: number
          envelope_id: string
          file_url: string
          id?: string
          metadata?: Json | null
          name: string
          page_count?: number
        }
        Update: {
          created_at?: string
          document_order?: number
          envelope_id?: string
          file_url?: string
          id?: string
          metadata?: Json | null
          name?: string
          page_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "envelope_documents_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "signature_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      envelope_drafts: {
        Row: {
          created_at: string
          fields: Json
          id: string
          message: string
          proposal_id: string
          recipients: Json
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          message?: string
          proposal_id: string
          recipients?: Json
          subject?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          message?: string
          proposal_id?: string
          recipients?: Json
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "envelope_drafts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: true
            referencedRelation: "project_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      envelope_recipients: {
        Row: {
          access_token: string | null
          created_at: string
          decline_reason: string | null
          declined_at: string | null
          email: string
          envelope_id: string
          id: string
          ip_address: string | null
          name: string
          role: string
          sent_at: string | null
          signed_at: string | null
          signing_order: number
          status: string
          updated_at: string
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          email: string
          envelope_id: string
          id?: string
          ip_address?: string | null
          name: string
          role?: string
          sent_at?: string | null
          signed_at?: string | null
          signing_order?: number
          status?: string
          updated_at?: string
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          email?: string
          envelope_id?: string
          id?: string
          ip_address?: string | null
          name?: string
          role?: string
          sent_at?: string | null
          signed_at?: string | null
          signing_order?: number
          status?: string
          updated_at?: string
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envelope_recipients_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "signature_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_bid_packages: {
        Row: {
          created_at: string
          description: string | null
          estimate_id: string
          id: string
          package_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimate_id: string
          id?: string
          package_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimate_id?: string
          id?: string
          package_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_bid_packages_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_cover_sheet_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      estimate_files: {
        Row: {
          estimate_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          estimate_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          estimate_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_files_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          assigned_to_id: string | null
          cost_code: string | null
          created_at: string
          description: string | null
          display_order: number | null
          estimate_id: string
          id: string
          item_name: string
          item_type: string
          markup_pct: number | null
          quantity: number | null
          tax_applicable: boolean | null
          total: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          assigned_to_id?: string | null
          cost_code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          estimate_id: string
          id?: string
          item_name: string
          item_type?: string
          markup_pct?: number | null
          quantity?: number | null
          tax_applicable?: boolean | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          assigned_to_id?: string | null
          cost_code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          estimate_id?: string
          id?: string
          item_name?: string
          item_type?: string
          markup_pct?: number | null
          quantity?: number | null
          tax_applicable?: boolean | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          estimate_id: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          estimate_id: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          estimate_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_notes_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_scope_items: {
        Row: {
          category: string
          created_at: string
          description: string
          display_order: number | null
          estimate_id: string
          id: string
          is_included: boolean | null
          quantity: number | null
          unit: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          display_order?: number | null
          estimate_id: string
          id?: string
          is_included?: boolean | null
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          display_order?: number | null
          estimate_id?: string
          id?: string
          is_included?: boolean | null
          quantity?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_scope_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          created_at: string | null
          id: string
          price_sheet_id: string | null
          project_id: string
          settings: Json | null
          totals: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_sheet_id?: string | null
          project_id: string
          settings?: Json | null
          totals?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price_sheet_id?: string | null
          project_id?: string
          settings?: Json | null
          totals?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_price_sheet_id_fkey"
            columns: ["price_sheet_id"]
            isOneToOne: false
            referencedRelation: "price_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_files: {
        Row: {
          expense_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          expense_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          expense_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_files_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expense_id: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expense_id: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_notes_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account: string | null
          amount: number | null
          bank_account: string | null
          cost_code: string | null
          created_at: string
          created_by: string | null
          employee_name: string | null
          expense_date: string | null
          expense_name: string
          expense_number: string | null
          expense_type: string | null
          id: string
          is_billable: boolean | null
          project_id: string | null
          reason: string | null
          ref_number: string | null
          status: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          account?: string | null
          amount?: number | null
          bank_account?: string | null
          cost_code?: string | null
          created_at?: string
          created_by?: string | null
          employee_name?: string | null
          expense_date?: string | null
          expense_name: string
          expense_number?: string | null
          expense_type?: string | null
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          reason?: string | null
          ref_number?: string | null
          status?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          account?: string | null
          amount?: number | null
          bank_account?: string | null
          cost_code?: string | null
          created_at?: string
          created_by?: string | null
          employee_name?: string | null
          expense_date?: string | null
          expense_name?: string
          expense_number?: string | null
          expense_type?: string | null
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          reason?: string | null
          ref_number?: string | null
          status?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      facets: {
        Row: {
          created_at: string | null
          flags: Json | null
          id: string
          pitch: number | null
          polygon_geojson: Json
          project_id: string
          story: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flags?: Json | null
          id?: string
          pitch?: number | null
          polygon_geojson: Json
          project_id: string
          story?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flags?: Json | null
          id?: string
          pitch?: number | null
          polygon_geojson?: Json
          project_id?: string
          story?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fasto_failed_requests: {
        Row: {
          agent_response: string | null
          category: string | null
          created_at: string | null
          failure_reason: string | null
          id: string
          request_text: string
          tool_attempted: string | null
          user_id: string | null
        }
        Insert: {
          agent_response?: string | null
          category?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          request_text: string
          tool_attempted?: string | null
          user_id?: string | null
        }
        Update: {
          agent_response?: string | null
          category?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          request_text?: string
          tool_attempted?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback_fix_diagnostics: {
        Row: {
          completed_at: string | null
          created_at: string
          diagnostic_type: string
          error_message: string | null
          feedback_id: string
          id: string
          result: Json | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          diagnostic_type: string
          error_message?: string | null
          feedback_id: string
          id?: string
          result?: Json | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          diagnostic_type?: string
          error_message?: string | null
          feedback_id?: string
          id?: string
          result?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_fix_diagnostics_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "admin_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          status: string | null
          submitted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      field_completions: {
        Row: {
          completed_at: string
          field_id: string
          id: string
          ip_address: string | null
          metadata: Json | null
          recipient_id: string
          signature_image_url: string | null
          user_agent: string | null
          value: string | null
        }
        Insert: {
          completed_at?: string
          field_id: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          recipient_id: string
          signature_image_url?: string | null
          user_agent?: string | null
          value?: string | null
        }
        Update: {
          completed_at?: string
          field_id?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          recipient_id?: string
          signature_image_url?: string | null
          user_agent?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_completions_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "document_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_completions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "envelope_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          audio_url: string | null
          created_at: string
          id: string
          message_text: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          id?: string
          message_text?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          id?: string
          message_text?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      idea_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          submitted_by: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          submitted_by?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          submitted_by?: string | null
          title?: string
        }
        Relationships: []
      }
      image_annotations: {
        Row: {
          annotation_data: Json
          annotation_type: string
          created_at: string
          id: string
          photo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation_data: Json
          annotation_type?: string
          created_at?: string
          id?: string
          photo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation_data?: Json
          annotation_type?: string
          created_at?: string
          id?: string
          photo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_annotations_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "project_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      imagery_assets: {
        Row: {
          bounds_geojson: Json | null
          capture_date: string | null
          created_at: string | null
          id: string
          project_id: string
          updated_at: string | null
          url: string
          vendor: string
        }
        Insert: {
          bounds_geojson?: Json | null
          capture_date?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
          url: string
          vendor: string
        }
        Update: {
          bounds_geojson?: Json | null
          capture_date?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
          url?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "imagery_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          incident_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          incident_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          incident_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_files_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          incident_id: string
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id: string
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_notes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          accepted_treatment: boolean | null
          action_taken: string | null
          classification: string | null
          corrective_steps: string | null
          cost_code: string | null
          created_at: string
          created_by: string | null
          days_away_from_work: number | null
          days_job_transfer: number | null
          description: string | null
          has_injury: boolean | null
          hospital_description: string | null
          id: string
          incident_date: string
          incident_number: string | null
          incident_time: string | null
          injury_description: string | null
          injury_type: string | null
          involved_employee_ids: string[] | null
          is_osha_violation: boolean | null
          location: string | null
          notified_date: string | null
          notified_ids: string[] | null
          osha_description: string | null
          project_id: string | null
          reported_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          return_description: string | null
          returned_to_work_same_day: boolean | null
          severity: string | null
          status: string | null
          transported_to_hospital: boolean | null
          treatment_description: string | null
          type: string
          updated_at: string
          witness_ids: string[] | null
        }
        Insert: {
          accepted_treatment?: boolean | null
          action_taken?: string | null
          classification?: string | null
          corrective_steps?: string | null
          cost_code?: string | null
          created_at?: string
          created_by?: string | null
          days_away_from_work?: number | null
          days_job_transfer?: number | null
          description?: string | null
          has_injury?: boolean | null
          hospital_description?: string | null
          id?: string
          incident_date?: string
          incident_number?: string | null
          incident_time?: string | null
          injury_description?: string | null
          injury_type?: string | null
          involved_employee_ids?: string[] | null
          is_osha_violation?: boolean | null
          location?: string | null
          notified_date?: string | null
          notified_ids?: string[] | null
          osha_description?: string | null
          project_id?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          return_description?: string | null
          returned_to_work_same_day?: boolean | null
          severity?: string | null
          status?: string | null
          transported_to_hospital?: boolean | null
          treatment_description?: string | null
          type?: string
          updated_at?: string
          witness_ids?: string[] | null
        }
        Update: {
          accepted_treatment?: boolean | null
          action_taken?: string | null
          classification?: string | null
          corrective_steps?: string | null
          cost_code?: string | null
          created_at?: string
          created_by?: string | null
          days_away_from_work?: number | null
          days_job_transfer?: number | null
          description?: string | null
          has_injury?: boolean | null
          hospital_description?: string | null
          id?: string
          incident_date?: string
          incident_number?: string | null
          incident_time?: string | null
          injury_description?: string | null
          injury_type?: string | null
          involved_employee_ids?: string[] | null
          is_osha_violation?: boolean | null
          location?: string | null
          notified_date?: string | null
          notified_ids?: string[] | null
          osha_description?: string | null
          project_id?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          return_description?: string | null
          returned_to_work_same_day?: boolean | null
          severity?: string | null
          status?: string | null
          transported_to_hospital?: boolean | null
          treatment_description?: string | null
          type?: string
          updated_at?: string
          witness_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          color: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          photo_url: string | null
          quantity: number
          requires_protection: boolean
          unit_type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          requires_protection?: boolean
          unit_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          requires_protection?: boolean
          unit_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          item_id: string
          new_quantity: number
          note: string | null
          previous_quantity: number
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          item_id: string
          new_quantity: number
          note?: string | null
          previous_quantity: number
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          item_id?: string
          new_quantity?: number
          note?: string | null
          previous_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          invoice_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          invoice_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          invoice_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_files_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cost_code: string | null
          created_at: string
          display_order: number | null
          id: string
          invoice_id: string
          is_taxable: boolean | null
          item_name: string
          item_type: string | null
          markup_percent: number | null
          photo_url: string | null
          quantity: number | null
          total: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          cost_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          invoice_id: string
          is_taxable?: boolean | null
          item_name: string
          item_type?: string | null
          markup_percent?: number | null
          photo_url?: string | null
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          cost_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          invoice_id?: string
          is_taxable?: boolean | null
          item_name?: string
          item_type?: string | null
          markup_percent?: number | null
          photo_url?: string | null
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          payment_date: string
          payment_note: string | null
          payment_type: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          payment_date?: string
          payment_note?: string | null
          payment_type?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          payment_date?: string
          payment_note?: string | null
          payment_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          address: string | null
          approved_by: string | null
          balance_due: number
          created_at: string
          created_by: string | null
          credit_card_fee: number | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          description: string | null
          due_date: string | null
          estimate_id: string | null
          id: string
          invoice_number: string
          notes: string | null
          online_payment_enabled: boolean | null
          paid_at: string | null
          payment_method: string | null
          payment_terms: string | null
          period_end_date: string | null
          period_start_date: string | null
          project_address: string | null
          project_id: string | null
          project_name: string
          retainage_percent: number | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms_conditions: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          approved_by?: string | null
          balance_due: number
          created_at?: string
          created_by?: string | null
          credit_card_fee?: number | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          description?: string | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          online_payment_enabled?: boolean | null
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          period_end_date?: string | null
          period_start_date?: string | null
          project_address?: string | null
          project_id?: string | null
          project_name: string
          retainage_percent?: number | null
          status?: string
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms_conditions?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          approved_by?: string | null
          balance_due?: number
          created_at?: string
          created_by?: string | null
          credit_card_fee?: number | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          description?: string | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          online_payment_enabled?: boolean | null
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          period_end_date?: string | null
          period_start_date?: string | null
          project_address?: string | null
          project_id?: string | null
          project_name?: string
          retainage_percent?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      job_schedules: {
        Row: {
          actual_hours: number | null
          assigned_users: Json
          assignment_status: string | null
          attachments: Json | null
          color: string | null
          connecteam_job_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          estimated_hours: number | null
          id: string
          job_name: string
          location: string | null
          priority: string | null
          project_id: string | null
          responded_at: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_users?: Json
          assignment_status?: string | null
          attachments?: Json | null
          color?: string | null
          connecteam_job_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          estimated_hours?: number | null
          id?: string
          job_name: string
          location?: string | null
          priority?: string | null
          project_id?: string | null
          responded_at?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_users?: Json
          assignment_status?: string | null
          attachments?: Json | null
          color?: string | null
          connecteam_job_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          estimated_hours?: number | null
          id?: string
          job_name?: string
          location?: string | null
          priority?: string | null
          project_id?: string | null
          responded_at?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      labor_burden_config: {
        Row: {
          created_at: string
          effective_date: string
          health_insurance_monthly: number
          id: string
          is_active: boolean
          other_benefits_rate: number
          payroll_tax_rate: number
          updated_at: string
          workers_comp_rate: number
        }
        Insert: {
          created_at?: string
          effective_date?: string
          health_insurance_monthly?: number
          id?: string
          is_active?: boolean
          other_benefits_rate?: number
          payroll_tax_rate?: number
          updated_at?: string
          workers_comp_rate?: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          health_insurance_monthly?: number
          id?: string
          is_active?: boolean
          other_benefits_rate?: number
          payroll_tax_rate?: number
          updated_at?: string
          workers_comp_rate?: number
        }
        Relationships: []
      }
      lead_qualifications: {
        Row: {
          budget_range: string | null
          contact_preferences: Json | null
          created_at: string | null
          id: string
          lead_id: string | null
          pain_points: string[] | null
          project_type: string | null
          property_size: number | null
          qualification_score: number | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          budget_range?: string | null
          contact_preferences?: Json | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          pain_points?: string[] | null
          project_type?: string | null
          property_size?: number | null
          qualification_score?: number | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_range?: string | null
          contact_preferences?: Json | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          pain_points?: string[] | null
          project_type?: string | null
          property_size?: number | null
          qualification_score?: number | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_qualifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          created_at: string | null
          engagement_score: number | null
          id: string
          lead_id: string | null
          project_fit_score: number | null
          readiness_score: number | null
          total_score: number | null
          updated_at: string | null
          urgency_score: number | null
        }
        Insert: {
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          lead_id?: string | null
          project_fit_score?: number | null
          readiness_score?: number | null
          total_score?: number | null
          updated_at?: string | null
          urgency_score?: number | null
        }
        Update: {
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          lead_id?: string | null
          project_fit_score?: number | null
          readiness_score?: number | null
          total_score?: number | null
          updated_at?: string | null
          urgency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget_range: string | null
          company: string | null
          company_name: string | null
          created_at: string | null
          email: string
          estimated_value: number | null
          first_name: string | null
          id: string
          last_name: string | null
          mrf_prospect_id: string | null
          name: string
          notes: string | null
          phone: string | null
          project_type: string | null
          property_type: string | null
          qualification_data: Json | null
          roof_size: string | null
          source: string | null
          status: string
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          company?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          estimated_value?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mrf_prospect_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          property_type?: string | null
          qualification_data?: Json | null
          roof_size?: string | null
          source?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          company?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          estimated_value?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mrf_prospect_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          property_type?: string | null
          qualification_data?: Json | null
          roof_size?: string | null
          source?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      material_audit_log: {
        Row: {
          action: string
          changes: Json | null
          id: string
          material_id: string | null
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          id?: string
          material_id?: string | null
          performed_at?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          id?: string
          material_id?: string | null
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_audit_log_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_bills: {
        Row: {
          bill_number: string
          checked_by: string | null
          created_at: string
          delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          project_id: string
          status: string
          total_amount: number | null
          updated_at: string
          vendor: string
        }
        Insert: {
          bill_number?: string
          checked_by?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          project_id: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          vendor: string
        }
        Update: {
          bill_number?: string
          checked_by?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          project_id?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      material_documents: {
        Row: {
          bill_id: string
          document_type: string
          document_url: string
          file_name: string
          file_size: number | null
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          bill_id: string
          document_type: string
          document_url: string
          file_name: string
          file_size?: number | null
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          bill_id?: string
          document_type?: string
          document_url?: string
          file_name?: string
          file_size?: number | null
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_material_documents_bill_id"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "material_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      material_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          items: Json
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          items?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          items?: Json
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          last_updated_by: string | null
          name: string
          show_in_app: boolean
          show_on_contract: boolean
          show_on_estimate: boolean
          show_on_labor_report: boolean
          show_on_material_order: boolean
          status: string
          total: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_updated_by?: string | null
          name: string
          show_in_app?: boolean
          show_on_contract?: boolean
          show_on_estimate?: boolean
          show_on_labor_report?: boolean
          show_on_material_order?: boolean
          status?: string
          total?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_updated_by?: string | null
          name?: string
          show_in_app?: boolean
          show_on_contract?: boolean
          show_on_estimate?: boolean
          show_on_labor_report?: boolean
          show_on_material_order?: boolean
          status?: string
          total?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_chat_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string | null
          created_at: string
          id: string
          room_id: string
          sender_id: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          room_id: string
          sender_id?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "meeting_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          extracted_items: Json | null
          file_name: string
          file_path: string
          file_size: number | null
          file_url: string
          id: string
          participants: string[] | null
          recording_type: string | null
          room_name: string | null
          transcript: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          extracted_items?: Json | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_url: string
          id?: string
          participants?: string[] | null
          recording_type?: string | null
          room_name?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          extracted_items?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_url?: string
          id?: string
          participants?: string[] | null
          recording_type?: string | null
          room_name?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      meeting_rooms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_capacity: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name?: string
        }
        Relationships: []
      }
      message_read_status: {
        Row: {
          conversation_id: string
          id: string
          last_read_at: string
          last_read_message_id: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          last_read_at?: string
          last_read_message_id?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          last_read_at?: string
          last_read_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "direct_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_status_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          message: string
          parent_message_id: string
          sender: string
          sender_user_id: string | null
          timestamp: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          message: string
          parent_message_id: string
          sender: string
          sender_user_id?: string | null
          timestamp?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          message?: string
          parent_message_id?: string
          sender?: string
          sender_user_id?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      mt_business_branding: {
        Row: {
          accent_color: string | null
          business_id: string
          created_at: string | null
          favicon_url: string | null
          id: string
          logo_dark_url: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          business_id: string
          created_at?: string | null
          favicon_url?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          business_id?: string
          created_at?: string | null
          favicon_url?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_business_branding_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_business_branding_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "v_business_config"
            referencedColumns: ["business_id"]
          },
        ]
      }
      mt_business_faqs: {
        Row: {
          answer: string
          business_id: string
          category: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          question: string
          service_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          business_id: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          question: string
          service_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          business_id?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          question?: string
          service_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_business_faqs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_business_faqs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_config"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "mt_business_faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "mt_business_services"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_business_profiles: {
        Row: {
          address: string | null
          business_id: string
          business_name: string
          city: string | null
          created_at: string | null
          description: string | null
          email: string | null
          employees_count: string | null
          founded_year: number | null
          google_average_rating: number | null
          google_business_url: string | null
          google_place_id: string | null
          google_total_reviews: number | null
          hero_cta_primary: string | null
          hero_cta_secondary: string | null
          hero_headline: string | null
          hero_highlight: string | null
          hero_image_url: string | null
          hero_subheadline: string | null
          hero_video_url: string | null
          hours: string | null
          id: string
          license_number: string | null
          owner_bio: string | null
          owner_name: string | null
          owner_photo_url: string | null
          phone: string | null
          state: string | null
          tagline: string | null
          updated_at: string | null
          years_in_business: number | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          business_name: string
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employees_count?: string | null
          founded_year?: number | null
          google_average_rating?: number | null
          google_business_url?: string | null
          google_place_id?: string | null
          google_total_reviews?: number | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_headline?: string | null
          hero_highlight?: string | null
          hero_image_url?: string | null
          hero_subheadline?: string | null
          hero_video_url?: string | null
          hours?: string | null
          id?: string
          license_number?: string | null
          owner_bio?: string | null
          owner_name?: string | null
          owner_photo_url?: string | null
          phone?: string | null
          state?: string | null
          tagline?: string | null
          updated_at?: string | null
          years_in_business?: number | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          business_name?: string
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employees_count?: string | null
          founded_year?: number | null
          google_average_rating?: number | null
          google_business_url?: string | null
          google_place_id?: string | null
          google_total_reviews?: number | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_headline?: string | null
          hero_highlight?: string | null
          hero_image_url?: string | null
          hero_subheadline?: string | null
          hero_video_url?: string | null
          hours?: string | null
          id?: string
          license_number?: string | null
          owner_bio?: string | null
          owner_name?: string | null
          owner_photo_url?: string | null
          phone?: string | null
          state?: string | null
          tagline?: string | null
          updated_at?: string | null
          years_in_business?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_business_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_business_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "v_business_config"
            referencedColumns: ["business_id"]
          },
        ]
      }
      mt_business_service_areas: {
        Row: {
          aeo_city_summary: string | null
          aeo_local_answer: string | null
          aeo_local_context: string | null
          aeo_nearby_landmarks: string[] | null
          business_id: string
          city: string
          county: string | null
          created_at: string | null
          description: string | null
          hero_image: string | null
          id: string
          is_primary: boolean | null
          local_keywords: string[] | null
          neighborhoods: string[] | null
          region: string | null
          seo_content: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          state: string | null
          updated_at: string | null
          zip_codes: string[] | null
        }
        Insert: {
          aeo_city_summary?: string | null
          aeo_local_answer?: string | null
          aeo_local_context?: string | null
          aeo_nearby_landmarks?: string[] | null
          business_id: string
          city: string
          county?: string | null
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          is_primary?: boolean | null
          local_keywords?: string[] | null
          neighborhoods?: string[] | null
          region?: string | null
          seo_content?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          state?: string | null
          updated_at?: string | null
          zip_codes?: string[] | null
        }
        Update: {
          aeo_city_summary?: string | null
          aeo_local_answer?: string | null
          aeo_local_context?: string | null
          aeo_nearby_landmarks?: string[] | null
          business_id?: string
          city?: string
          county?: string | null
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          is_primary?: boolean | null
          local_keywords?: string[] | null
          neighborhoods?: string[] | null
          region?: string | null
          seo_content?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          state?: string | null
          updated_at?: string | null
          zip_codes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_business_service_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_business_service_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_config"
            referencedColumns: ["business_id"]
          },
        ]
      }
      mt_business_services: {
        Row: {
          aeo_conversational_answer: string | null
          aeo_key_points: string[] | null
          aeo_summary: string | null
          business_id: string
          created_at: string | null
          duration: string | null
          hero_image: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          long_description: string | null
          name: string
          price_range: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          short_description: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          aeo_conversational_answer?: string | null
          aeo_key_points?: string[] | null
          aeo_summary?: string | null
          business_id: string
          created_at?: string | null
          duration?: string | null
          hero_image?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          long_description?: string | null
          name: string
          price_range?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          aeo_conversational_answer?: string | null
          aeo_key_points?: string[] | null
          aeo_summary?: string | null
          business_id?: string
          created_at?: string | null
          duration?: string | null
          hero_image?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          long_description?: string | null
          name?: string
          price_range?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "v_business_config"
            referencedColumns: ["business_id"]
          },
        ]
      }
      mug_requests: {
        Row: {
          created_at: string
          id: string
          mug_accepted: boolean
          project_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          mug_accepted: boolean
          project_address: string
        }
        Update: {
          created_at?: string
          id?: string
          mug_accepted?: boolean
          project_address?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      overhead_config: {
        Row: {
          allocation_method: string
          created_at: string
          effective_date: string
          equipment_rental_rate: number
          facility_overhead_rate: number
          id: string
          is_active: boolean
          liability_insurance_rate: number
          office_staff_rate: number
          updated_at: string
        }
        Insert: {
          allocation_method?: string
          created_at?: string
          effective_date?: string
          equipment_rental_rate?: number
          facility_overhead_rate?: number
          id?: string
          is_active?: boolean
          liability_insurance_rate?: number
          office_staff_rate?: number
          updated_at?: string
        }
        Update: {
          allocation_method?: string
          created_at?: string
          effective_date?: string
          equipment_rental_rate?: number
          facility_overhead_rate?: number
          id?: string
          is_active?: boolean
          liability_insurance_rate?: number
          office_staff_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          payment_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          payment_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          payment_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_files_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          payment_id: string
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          payment_id: string
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payment_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_notes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          address: string | null
          amount: number
          created_at: string
          created_by: string | null
          customer_name: string
          deposit_to: string | null
          id: string
          invoice_id: string | null
          invoice_number: string | null
          payment_date: string
          payment_number: string | null
          payment_type: string | null
          reference_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_name: string
          deposit_to?: string | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          payment_date?: string
          payment_number?: string | null
          payment_type?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_name?: string
          deposit_to?: string | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          payment_date?: string
          payment_number?: string | null
          payment_type?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          permit_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          permit_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          permit_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_files_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          permit_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          permit_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          permit_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_notes_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          agency_id: string | null
          agency_name: string | null
          approved_date: string | null
          created_at: string
          created_by: string | null
          expires_date: string | null
          fee: number | null
          id: string
          must_pull_by_date: string | null
          permit_number: string
          permit_type: string
          project_address: string | null
          project_id: string | null
          project_name: string | null
          pulled_date: string | null
          referenced_inspection_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          agency_name?: string | null
          approved_date?: string | null
          created_at?: string
          created_by?: string | null
          expires_date?: string | null
          fee?: number | null
          id?: string
          must_pull_by_date?: string | null
          permit_number: string
          permit_type?: string
          project_address?: string | null
          project_id?: string | null
          project_name?: string | null
          pulled_date?: string | null
          referenced_inspection_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          agency_name?: string | null
          approved_date?: string | null
          created_at?: string
          created_by?: string | null
          expires_date?: string | null
          fee?: number | null
          id?: string
          must_pull_by_date?: string | null
          permit_number?: string
          permit_type?: string
          project_address?: string | null
          project_id?: string | null
          project_name?: string | null
          pulled_date?: string | null
          referenced_inspection_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permits_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_annotations: {
        Row: {
          annotation_type: string
          color: string | null
          comment: string | null
          created_at: string
          created_by: string
          height: number | null
          id: string
          photo_id: string
          project_id: string
          updated_at: string
          width: number | null
          x_position: number
          y_position: number
        }
        Insert: {
          annotation_type?: string
          color?: string | null
          comment?: string | null
          created_at?: string
          created_by: string
          height?: number | null
          id?: string
          photo_id: string
          project_id: string
          updated_at?: string
          width?: number | null
          x_position: number
          y_position: number
        }
        Update: {
          annotation_type?: string
          color?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string
          height?: number | null
          id?: string
          photo_id?: string
          project_id?: string
          updated_at?: string
          width?: number | null
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "photo_annotations_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "project_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_annotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_comments: {
        Row: {
          annotation_id: string | null
          comment_text: string
          created_at: string
          created_by: string
          created_by_name: string | null
          created_by_type: string | null
          id: string
          is_resolved: boolean | null
          photo_id: string
          project_id: string
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string
        }
        Insert: {
          annotation_id?: string | null
          comment_text: string
          created_at?: string
          created_by: string
          created_by_name?: string | null
          created_by_type?: string | null
          id?: string
          is_resolved?: boolean | null
          photo_id: string
          project_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Update: {
          annotation_id?: string | null
          comment_text?: string
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          created_by_type?: string | null
          id?: string
          is_resolved?: boolean | null
          photo_id?: string
          project_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_annotation_id_fkey"
            columns: ["annotation_id"]
            isOneToOne: false
            referencedRelation: "photo_annotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "project_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          message_id: string
          pinned_at: string
          pinned_by: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          message_id: string
          pinned_at?: string
          pinned_by?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          message_id?: string
          pinned_at?: string
          pinned_by?: string | null
        }
        Relationships: []
      }
      pins: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          position_point_geojson: Json
          project_id: string
          qty: number | null
          size: string | null
          subtype: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          position_point_geojson: Json
          project_id: string
          qty?: number | null
          size?: string | null
          subtype?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          position_point_geojson?: Json
          project_id?: string
          qty?: number | null
          size?: string | null
          subtype?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pins_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_deliverables: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          item_name: string
          order_index: number | null
          plan_type: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          order_index?: number | null
          plan_type: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          order_index?: number | null
          plan_type?: string
        }
        Relationships: []
      }
      price_sheets: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          lines: Json
          name: string
          system: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lines?: Json
          name: string
          system: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lines?: Json
          name?: string
          system?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_background_style: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          admin_background_style?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          admin_background_style?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_access_requests: {
        Row: {
          created_at: string
          id: string
          project_id: string
          reason: string | null
          requested_at: string
          requester_id: string
          requester_name: string
          responded_at: string | null
          responded_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          reason?: string | null
          requested_at?: string
          requester_id: string
          requester_name: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          reason?: string | null
          requested_at?: string
          requester_id?: string
          requester_name?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          customer_email: string
          customer_id: string | null
          id: string
          project_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          customer_email: string
          customer_id?: string | null
          id?: string
          project_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          customer_email?: string
          customer_id?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_calendar_events: {
        Row: {
          assignee_ids: string[] | null
          color_code: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          is_recurring: boolean | null
          parent_event_id: string | null
          project_id: string | null
          recurrence_days: number[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          reminder_days: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_ids?: string[] | null
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type: string
          id?: string
          is_recurring?: boolean | null
          parent_event_id?: string | null
          project_id?: string | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          reminder_days?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_ids?: string[] | null
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          parent_event_id?: string | null
          project_id?: string | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          reminder_days?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_calendar_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "project_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_change_orders: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          change_order_number: string
          created_at: string | null
          description: string | null
          id: string
          impact_days: number | null
          project_id: string
          reason: string | null
          requested_at: string | null
          requested_by: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          change_order_number: string
          created_at?: string | null
          description?: string | null
          id?: string
          impact_days?: number | null
          project_id: string
          reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          change_order_number?: string
          created_at?: string | null
          description?: string | null
          id?: string
          impact_days?: number | null
          project_id?: string
          reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_chat_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_deleted: boolean | null
          message_text: string | null
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          message_text?: string | null
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          message_text?: string | null
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string | null
          project_id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          project_id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          project_id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_daily_reports: {
        Row: {
          created_at: string
          created_by: string | null
          crew_count: number | null
          hours_total: number | null
          id: string
          materials_used: Json | null
          photos: Json | null
          project_id: string
          report_date: string
          summary: string | null
          updated_at: string
          weather: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crew_count?: number | null
          hours_total?: number | null
          id?: string
          materials_used?: Json | null
          photos?: Json | null
          project_id: string
          report_date: string
          summary?: string | null
          updated_at?: string
          weather?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crew_count?: number | null
          hours_total?: number | null
          id?: string
          materials_used?: Json | null
          photos?: Json | null
          project_id?: string
          report_date?: string
          summary?: string | null
          updated_at?: string
          weather?: Json | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          category: string | null
          coordinator_id: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          project_id: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          coordinator_id?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          project_id: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          coordinator_id?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_estimates: {
        Row: {
          approved_by_id: string | null
          city: string | null
          cover_sheet_content: string | null
          cover_sheet_template_id: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          estimate_date: string
          estimate_number: string
          estimator_id: string | null
          exclusions_content: string | null
          expiration_date: string | null
          grand_total: number | null
          id: string
          include_cover_sheet: boolean | null
          inclusions_content: string | null
          invoiced_to: string | null
          profit_margin_amount: number | null
          profit_margin_pct: number | null
          project_id: string | null
          project_manager_id: string | null
          project_type: string | null
          sales_rep_id: string | null
          scope_summary: string | null
          sector: string | null
          state: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_pct: number | null
          terms_content: string | null
          title: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          approved_by_id?: string | null
          city?: string | null
          cover_sheet_content?: string | null
          cover_sheet_template_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimate_date?: string
          estimate_number: string
          estimator_id?: string | null
          exclusions_content?: string | null
          expiration_date?: string | null
          grand_total?: number | null
          id?: string
          include_cover_sheet?: boolean | null
          inclusions_content?: string | null
          invoiced_to?: string | null
          profit_margin_amount?: number | null
          profit_margin_pct?: number | null
          project_id?: string | null
          project_manager_id?: string | null
          project_type?: string | null
          sales_rep_id?: string | null
          scope_summary?: string | null
          sector?: string | null
          state?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_pct?: number | null
          terms_content?: string | null
          title?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          approved_by_id?: string | null
          city?: string | null
          cover_sheet_content?: string | null
          cover_sheet_template_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimate_date?: string
          estimate_number?: string
          estimator_id?: string | null
          exclusions_content?: string | null
          expiration_date?: string | null
          grand_total?: number | null
          id?: string
          include_cover_sheet?: boolean | null
          inclusions_content?: string | null
          invoiced_to?: string | null
          profit_margin_amount?: number | null
          profit_margin_pct?: number | null
          project_id?: string | null
          project_manager_id?: string | null
          project_type?: string | null
          sales_rep_id?: string | null
          scope_summary?: string | null
          sector?: string | null
          state?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_pct?: number | null
          terms_content?: string | null
          title?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_incidents: {
        Row: {
          created_at: string
          description: string
          follow_up: string | null
          id: string
          incident_date: string
          incident_type: string
          photos: Json | null
          project_id: string
          reported_by: string | null
          resolved: boolean | null
          severity: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          follow_up?: string | null
          id?: string
          incident_date: string
          incident_type: string
          photos?: Json | null
          project_id: string
          reported_by?: string | null
          resolved?: boolean | null
          severity?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          follow_up?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          photos?: Json | null
          project_id?: string
          reported_by?: string | null
          resolved?: boolean | null
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_inspections: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          id: string
          inspection_type: string
          inspector_email: string | null
          inspector_name: string | null
          inspector_phone: string | null
          project_id: string
          result_notes: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          inspection_type: string
          inspector_email?: string | null
          inspector_name?: string | null
          inspector_phone?: string | null
          project_id: string
          result_notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          inspection_type?: string
          inspector_email?: string | null
          inspector_name?: string | null
          inspector_phone?: string | null
          project_id?: string
          result_notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          customer_email: string
          expires_at: string
          id: string
          invitation_token: string
          project_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          customer_email: string
          expires_at?: string
          id?: string
          invitation_token: string
          project_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          customer_email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_materials: {
        Row: {
          bill_id: string | null
          checked_by: string | null
          created_at: string
          date: string
          delivery_date: string | null
          external_id: string | null
          file_url: string | null
          id: string
          is_returned: boolean | null
          item_code: string | null
          item_description: string
          notes: string | null
          project_id: string
          quantity: number | null
          quantity_ordered: number | null
          quantity_received: number | null
          quantity_remaining: number | null
          return_date: string | null
          sent_to_yard: boolean | null
          source: string
          status: string | null
          tax_amount: number | null
          total_amount: number
          unit: string | null
          unit_price: number
          updated_at: string
          vendor: string
        }
        Insert: {
          bill_id?: string | null
          checked_by?: string | null
          created_at?: string
          date: string
          delivery_date?: string | null
          external_id?: string | null
          file_url?: string | null
          id?: string
          is_returned?: boolean | null
          item_code?: string | null
          item_description: string
          notes?: string | null
          project_id: string
          quantity?: number | null
          quantity_ordered?: number | null
          quantity_received?: number | null
          quantity_remaining?: number | null
          return_date?: string | null
          sent_to_yard?: boolean | null
          source?: string
          status?: string | null
          tax_amount?: number | null
          total_amount: number
          unit?: string | null
          unit_price: number
          updated_at?: string
          vendor: string
        }
        Update: {
          bill_id?: string | null
          checked_by?: string | null
          created_at?: string
          date?: string
          delivery_date?: string | null
          external_id?: string | null
          file_url?: string | null
          id?: string
          is_returned?: boolean | null
          item_code?: string | null
          item_description?: string
          notes?: string | null
          project_id?: string
          quantity?: number | null
          quantity_ordered?: number | null
          quantity_received?: number | null
          quantity_remaining?: number | null
          return_date?: string | null
          sent_to_yard?: boolean | null
          source?: string
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_materials_bill_id"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "material_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      project_overhead_allocation: {
        Row: {
          allocation_date: string
          created_at: string
          equipment_rental_cost: number
          facility_overhead_cost: number
          id: string
          labor_hours_base: number
          liability_insurance_cost: number
          office_staff_cost: number
          project_id: string
          total_overhead_cost: number
          updated_at: string
        }
        Insert: {
          allocation_date?: string
          created_at?: string
          equipment_rental_cost?: number
          facility_overhead_cost?: number
          id?: string
          labor_hours_base?: number
          liability_insurance_cost?: number
          office_staff_cost?: number
          project_id: string
          total_overhead_cost?: number
          updated_at?: string
        }
        Update: {
          allocation_date?: string
          created_at?: string
          equipment_rental_cost?: number
          facility_overhead_cost?: number
          id?: string
          labor_hours_base?: number
          liability_insurance_cost?: number
          office_staff_cost?: number
          project_id?: string
          total_overhead_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_photos: {
        Row: {
          caption: string | null
          display_order: number | null
          file_size: number | null
          id: string
          is_highlighted_after: boolean | null
          is_highlighted_before: boolean | null
          is_visible_to_customer: boolean
          photo_tag: string | null
          photo_url: string
          project_id: string
          recommendation: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          is_highlighted_after?: boolean | null
          is_highlighted_before?: boolean | null
          is_visible_to_customer?: boolean
          photo_tag?: string | null
          photo_url: string
          project_id: string
          recommendation?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          is_highlighted_after?: boolean | null
          is_highlighted_before?: boolean | null
          is_visible_to_customer?: boolean
          photo_tag?: string | null
          photo_url?: string
          project_id?: string
          recommendation?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_proposals: {
        Row: {
          access_token: string | null
          agreement_number: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          contract_created_at: string | null
          contract_price: number | null
          contract_url: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          notes_disclaimers: string | null
          payment_schedule: Json | null
          project_type: string
          property_address: string
          proposal_number: string
          quote_request_id: string | null
          scope_of_work: string | null
          status: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          agreement_number?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          contract_created_at?: string | null
          contract_price?: number | null
          contract_url?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          notes_disclaimers?: string | null
          payment_schedule?: Json | null
          project_type?: string
          property_address: string
          proposal_number?: string
          quote_request_id?: string | null
          scope_of_work?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          agreement_number?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          contract_created_at?: string | null
          contract_price?: number | null
          contract_url?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          notes_disclaimers?: string | null
          payment_schedule?: Json | null
          project_type?: string
          property_address?: string
          proposal_number?: string
          quote_request_id?: string | null
          scope_of_work?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_proposals_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      project_punchlists: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          item_number: number
          location: string | null
          photo_url: string | null
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_number: number
          location?: string | null
          photo_url?: string | null
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_number?: number
          location?: string | null
          photo_url?: string | null
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_punchlists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rating: {
        Row: {
          ai_suggested_rating: string | null
          ai_suggestion_reason: string | null
          notes: string | null
          project_id: string
          rating: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_suggested_rating?: string | null
          ai_suggestion_reason?: string | null
          notes?: string | null
          project_id: string
          rating: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_suggested_rating?: string | null
          ai_suggestion_reason?: string | null
          notes?: string | null
          project_id?: string
          rating?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      project_revenue: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          project_id: string
          revenue_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          project_id: string
          revenue_type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          project_id?: string
          revenue_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_status_updates: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          notes: string | null
          project_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          project_id: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          project_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_status_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task_assignees: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task_subtasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          order_index: number | null
          project_task_id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          project_task_id: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          project_task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_task_subtasks_project_task_id_fkey"
            columns: ["project_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          color: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          description: string | null
          display_order: number | null
          duration_days: number | null
          end_date: string | null
          id: string
          is_completed: boolean
          progress_percent: number | null
          project_id: string
          screenshots: Json | null
          start_date: string | null
          title: string
          updated_at: string
          visible_to_client: boolean | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          color?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          display_order?: number | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          is_completed?: boolean
          progress_percent?: number | null
          project_id: string
          screenshots?: Json | null
          start_date?: string | null
          title: string
          updated_at?: string
          visible_to_client?: boolean | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          color?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          display_order?: number | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          is_completed?: boolean
          progress_percent?: number | null
          project_id?: string
          screenshots?: Json | null
          start_date?: string | null
          title?: string
          updated_at?: string
          visible_to_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assignment_status: string | null
          id: string
          project_id: string
          responded_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assignment_status?: string | null
          id?: string
          project_id: string
          responded_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assignment_status?: string | null
          id?: string
          project_id?: string
          responded_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_training_documents: {
        Row: {
          created_at: string
          document_category: string
          extracted_data: Json | null
          file_name: string
          id: string
          processing_status: string | null
          quote_request_id: string | null
          source_file_type: string
          source_file_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_category: string
          extracted_data?: Json | null
          file_name: string
          id?: string
          processing_status?: string | null
          quote_request_id?: string | null
          source_file_type: string
          source_file_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_category?: string
          extracted_data?: Json | null
          file_name?: string
          id?: string
          processing_status?: string | null
          quote_request_id?: string | null
          source_file_type?: string
          source_file_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_training_documents_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_visible_to_customer: boolean
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_visible_to_customer?: boolean
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_visible_to_customer?: boolean
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_videos: {
        Row: {
          caption: string | null
          duration_seconds: number | null
          file_size: number | null
          id: string
          is_visible_to_customer: boolean
          project_id: string
          thumbnail_url: string | null
          uploaded_at: string
          uploaded_by: string
          video_url: string
        }
        Insert: {
          caption?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          id?: string
          is_visible_to_customer?: boolean
          project_id: string
          thumbnail_url?: string | null
          uploaded_at?: string
          uploaded_by: string
          video_url: string
        }
        Update: {
          caption?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          id?: string
          is_visible_to_customer?: boolean
          project_id?: string
          thumbnail_url?: string | null
          uploaded_at?: string
          uploaded_by?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          additional_contact: string | null
          address: string | null
          budget_labor: number | null
          budget_materials: number | null
          budget_overhead: number | null
          cf_project_id: string | null
          client_access_settings: Json | null
          client_name: string | null
          client_phone: string | null
          company_name: string | null
          connecteam_job_name: string | null
          connecteam_last_labor_sync_at: string | null
          connectteam_job_code_norm: string | null
          connectteam_job_code_raw: string | null
          connectteam_job_id: string | null
          contract_amount: number | null
          contractor_address: string | null
          contractor_company_name: string | null
          contractor_contact_person: string | null
          contractor_email: string | null
          contractor_phone: string | null
          created_at: string
          created_by: string
          customer_access_granted: boolean | null
          customer_email: string | null
          customer_rating: number | null
          description: string | null
          end_date: string | null
          existing_roof: string | null
          existing_roof_deck: string | null
          external_ref: string | null
          id: string
          insulation: string | null
          invitation_sent_at: string | null
          is_contractor_managed: boolean | null
          is_featured: boolean | null
          is_public: boolean | null
          labels: string[] | null
          name: string
          original_scope: string | null
          project_category: string | null
          project_manager_id: string | null
          project_type: string | null
          property_type: string | null
          quote_request_id: string | null
          rating_submitted_at: string | null
          retention_percentage: number | null
          roof_type: string | null
          sales_representative_id: string | null
          site_manager_id: string | null
          source: string | null
          start_date: string | null
          status: string
          stopped_date: string | null
          target_gp_percentage: number | null
          timeline: string | null
          updated_at: string
          wanted_roof: string | null
          wanted_roof_deck: string | null
          warranty_months: number | null
          warranty_start_date: string | null
        }
        Insert: {
          additional_contact?: string | null
          address?: string | null
          budget_labor?: number | null
          budget_materials?: number | null
          budget_overhead?: number | null
          cf_project_id?: string | null
          client_access_settings?: Json | null
          client_name?: string | null
          client_phone?: string | null
          company_name?: string | null
          connecteam_job_name?: string | null
          connecteam_last_labor_sync_at?: string | null
          connectteam_job_code_norm?: string | null
          connectteam_job_code_raw?: string | null
          connectteam_job_id?: string | null
          contract_amount?: number | null
          contractor_address?: string | null
          contractor_company_name?: string | null
          contractor_contact_person?: string | null
          contractor_email?: string | null
          contractor_phone?: string | null
          created_at?: string
          created_by: string
          customer_access_granted?: boolean | null
          customer_email?: string | null
          customer_rating?: number | null
          description?: string | null
          end_date?: string | null
          existing_roof?: string | null
          existing_roof_deck?: string | null
          external_ref?: string | null
          id?: string
          insulation?: string | null
          invitation_sent_at?: string | null
          is_contractor_managed?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          labels?: string[] | null
          name: string
          original_scope?: string | null
          project_category?: string | null
          project_manager_id?: string | null
          project_type?: string | null
          property_type?: string | null
          quote_request_id?: string | null
          rating_submitted_at?: string | null
          retention_percentage?: number | null
          roof_type?: string | null
          sales_representative_id?: string | null
          site_manager_id?: string | null
          source?: string | null
          start_date?: string | null
          status?: string
          stopped_date?: string | null
          target_gp_percentage?: number | null
          timeline?: string | null
          updated_at?: string
          wanted_roof?: string | null
          wanted_roof_deck?: string | null
          warranty_months?: number | null
          warranty_start_date?: string | null
        }
        Update: {
          additional_contact?: string | null
          address?: string | null
          budget_labor?: number | null
          budget_materials?: number | null
          budget_overhead?: number | null
          cf_project_id?: string | null
          client_access_settings?: Json | null
          client_name?: string | null
          client_phone?: string | null
          company_name?: string | null
          connecteam_job_name?: string | null
          connecteam_last_labor_sync_at?: string | null
          connectteam_job_code_norm?: string | null
          connectteam_job_code_raw?: string | null
          connectteam_job_id?: string | null
          contract_amount?: number | null
          contractor_address?: string | null
          contractor_company_name?: string | null
          contractor_contact_person?: string | null
          contractor_email?: string | null
          contractor_phone?: string | null
          created_at?: string
          created_by?: string
          customer_access_granted?: boolean | null
          customer_email?: string | null
          customer_rating?: number | null
          description?: string | null
          end_date?: string | null
          existing_roof?: string | null
          existing_roof_deck?: string | null
          external_ref?: string | null
          id?: string
          insulation?: string | null
          invitation_sent_at?: string | null
          is_contractor_managed?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          labels?: string[] | null
          name?: string
          original_scope?: string | null
          project_category?: string | null
          project_manager_id?: string | null
          project_type?: string | null
          property_type?: string | null
          quote_request_id?: string | null
          rating_submitted_at?: string | null
          retention_percentage?: number | null
          roof_type?: string | null
          sales_representative_id?: string | null
          site_manager_id?: string | null
          source?: string | null
          start_date?: string | null
          status?: string
          stopped_date?: string | null
          target_gp_percentage?: number | null
          timeline?: string | null
          updated_at?: string
          wanted_roof?: string | null
          wanted_roof_deck?: string | null
          warranty_months?: number | null
          warranty_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_commissions: {
        Row: {
          commission_amount: number
          created_at: string
          id: string
          proposal_id: string
          team_member_id: string
          team_member_name: string
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          id?: string
          proposal_id: string
          team_member_id: string
          team_member_name: string
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          id?: string
          proposal_id?: string
          team_member_id?: string
          team_member_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_commissions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "project_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_magic_links: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          proposal_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          proposal_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          proposal_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_magic_links_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "project_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_photos: {
        Row: {
          comparison_block_id: string | null
          comparison_metadata: Json | null
          created_at: string
          description: string | null
          display_order: number | null
          file_size: number | null
          id: string
          photo_type: string
          photo_url: string
          proposal_id: string
          uploaded_by: string
        }
        Insert: {
          comparison_block_id?: string | null
          comparison_metadata?: Json | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          photo_type: string
          photo_url: string
          proposal_id: string
          uploaded_by: string
        }
        Update: {
          comparison_block_id?: string | null
          comparison_metadata?: Json | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          photo_type?: string
          photo_url?: string
          proposal_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_photos_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "project_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_pricing: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_optional: boolean | null
          is_recommended: boolean | null
          proposal_id: string
          quantity: number | null
          system_name: string
          total_price: number | null
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_optional?: boolean | null
          is_recommended?: boolean | null
          proposal_id: string
          quantity?: number | null
          system_name: string
          total_price?: number | null
          unit?: string
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_optional?: boolean | null
          is_recommended?: boolean | null
          proposal_id?: string
          quantity?: number | null
          system_name?: string
          total_price?: number | null
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_pricing_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "project_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          purchase_order_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          purchase_order_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          purchase_order_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_files_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          item_name: string
          purchase_order_id: string
          quantity: number | null
          total: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          item_name: string
          purchase_order_id: string
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          item_name?: string
          purchase_order_id?: string
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          purchase_order_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          purchase_order_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          purchase_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_notes_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          delivery_date: string | null
          description: string | null
          fob_point: string | null
          from_employee: string | null
          id: string
          is_billable: boolean | null
          order_date: string | null
          payment_terms: string | null
          po_number: string | null
          project_id: string | null
          reference_number: string | null
          ship_to: string | null
          shipped_via: string | null
          status: string | null
          supplier: string | null
          supplier_contact: string | null
          tax_amount: number | null
          title: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          description?: string | null
          fob_point?: string | null
          from_employee?: string | null
          id?: string
          is_billable?: boolean | null
          order_date?: string | null
          payment_terms?: string | null
          po_number?: string | null
          project_id?: string | null
          reference_number?: string | null
          ship_to?: string | null
          shipped_via?: string | null
          status?: string | null
          supplier?: string | null
          supplier_contact?: string | null
          tax_amount?: number | null
          title: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          description?: string | null
          fob_point?: string | null
          from_employee?: string | null
          id?: string
          is_billable?: boolean | null
          order_date?: string | null
          payment_terms?: string | null
          po_number?: string | null
          project_id?: string | null
          reference_number?: string | null
          ship_to?: string | null
          shipped_via?: string | null
          status?: string | null
          supplier?: string | null
          supplier_contact?: string | null
          tax_amount?: number | null
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quantities: {
        Row: {
          area_sq: number | null
          eave_lf: number | null
          hip_lf: number | null
          project_id: string
          rake_lf: number | null
          ridge_lf: number | null
          step_lf: number | null
          updated_at: string | null
          valley_lf: number | null
          wall_lf: number | null
        }
        Insert: {
          area_sq?: number | null
          eave_lf?: number | null
          hip_lf?: number | null
          project_id: string
          rake_lf?: number | null
          ridge_lf?: number | null
          step_lf?: number | null
          updated_at?: string | null
          valley_lf?: number | null
          wall_lf?: number | null
        }
        Update: {
          area_sq?: number | null
          eave_lf?: number | null
          hip_lf?: number | null
          project_id?: string
          rake_lf?: number | null
          ridge_lf?: number | null
          step_lf?: number | null
          updated_at?: string | null
          valley_lf?: number | null
          wall_lf?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quantities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answer_order: number
          answer_text: string
          id: string
          is_correct: boolean
          question_id: string
        }
        Insert: {
          answer_order?: number
          answer_text: string
          id?: string
          is_correct?: boolean
          question_id: string
        }
        Update: {
          answer_order?: number
          answer_text?: string
          id?: string
          is_correct?: boolean
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          question_order: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_order?: number
          question_text: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_order?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          language: string
          passing_score: number
          presentation_url: string | null
          title: string
          updated_at: string
          week_number: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string
          passing_score?: number
          presentation_url?: string | null
          title: string
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string
          passing_score?: number
          presentation_url?: string | null
          title?: string
          updated_at?: string
          week_number?: number | null
        }
        Relationships: []
      }
      quote_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          quote_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          quote_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          quote_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_attachments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          ai_measurements: Json | null
          ai_measurements_status: string
          ai_measurements_updated_at: string | null
          company_name: string | null
          converted_to_project_at: string | null
          created_at: string
          crop_meta: Json | null
          edges: Json | null
          email: string
          enhanced_roi_image_url: string | null
          existing_roof: string | null
          existing_roof_deck: string | null
          facets: Json | null
          id: string
          imagery_scale_meta: Json | null
          imagery_transform: Json | null
          insulation: string | null
          latitude: number | null
          longitude: number | null
          material_items: Json | null
          measurements: Json | null
          name: string
          notes: string | null
          phone: string | null
          pins: Json | null
          pitch_schema: Json | null
          pitches: Json | null
          project_manager_id: string | null
          project_type: string | null
          project_variables: Json | null
          property_address: string | null
          property_type: string | null
          reference_line: Json | null
          rf_items: Json | null
          roi_image_bearing: number | null
          roi_image_center_lat: number | null
          roi_image_center_lng: number | null
          roi_image_url: string | null
          roi_image_zoom: number | null
          roi_summary: Json | null
          roof_roi: Json | null
          roof_seed: Json | null
          sales_representative_id: string | null
          selected_imagery: Json | null
          services_items: Json | null
          shingles_items: Json | null
          site_manager_id: string | null
          source: string | null
          status: string
          template_configurations: Json | null
          timeline: string | null
          updated_at: string
          wanted_roof: string | null
          wanted_roof_deck: string | null
        }
        Insert: {
          ai_measurements?: Json | null
          ai_measurements_status?: string
          ai_measurements_updated_at?: string | null
          company_name?: string | null
          converted_to_project_at?: string | null
          created_at?: string
          crop_meta?: Json | null
          edges?: Json | null
          email: string
          enhanced_roi_image_url?: string | null
          existing_roof?: string | null
          existing_roof_deck?: string | null
          facets?: Json | null
          id?: string
          imagery_scale_meta?: Json | null
          imagery_transform?: Json | null
          insulation?: string | null
          latitude?: number | null
          longitude?: number | null
          material_items?: Json | null
          measurements?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          pins?: Json | null
          pitch_schema?: Json | null
          pitches?: Json | null
          project_manager_id?: string | null
          project_type?: string | null
          project_variables?: Json | null
          property_address?: string | null
          property_type?: string | null
          reference_line?: Json | null
          rf_items?: Json | null
          roi_image_bearing?: number | null
          roi_image_center_lat?: number | null
          roi_image_center_lng?: number | null
          roi_image_url?: string | null
          roi_image_zoom?: number | null
          roi_summary?: Json | null
          roof_roi?: Json | null
          roof_seed?: Json | null
          sales_representative_id?: string | null
          selected_imagery?: Json | null
          services_items?: Json | null
          shingles_items?: Json | null
          site_manager_id?: string | null
          source?: string | null
          status?: string
          template_configurations?: Json | null
          timeline?: string | null
          updated_at?: string
          wanted_roof?: string | null
          wanted_roof_deck?: string | null
        }
        Update: {
          ai_measurements?: Json | null
          ai_measurements_status?: string
          ai_measurements_updated_at?: string | null
          company_name?: string | null
          converted_to_project_at?: string | null
          created_at?: string
          crop_meta?: Json | null
          edges?: Json | null
          email?: string
          enhanced_roi_image_url?: string | null
          existing_roof?: string | null
          existing_roof_deck?: string | null
          facets?: Json | null
          id?: string
          imagery_scale_meta?: Json | null
          imagery_transform?: Json | null
          insulation?: string | null
          latitude?: number | null
          longitude?: number | null
          material_items?: Json | null
          measurements?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          pins?: Json | null
          pitch_schema?: Json | null
          pitches?: Json | null
          project_manager_id?: string | null
          project_type?: string | null
          project_variables?: Json | null
          property_address?: string | null
          property_type?: string | null
          reference_line?: Json | null
          rf_items?: Json | null
          roi_image_bearing?: number | null
          roi_image_center_lat?: number | null
          roi_image_center_lng?: number | null
          roi_image_url?: string | null
          roi_image_zoom?: number | null
          roi_summary?: Json | null
          roof_roi?: Json | null
          roof_seed?: Json | null
          sales_representative_id?: string | null
          selected_imagery?: Json | null
          services_items?: Json | null
          shingles_items?: Json | null
          site_manager_id?: string | null
          source?: string | null
          status?: string
          template_configurations?: Json | null
          timeline?: string | null
          updated_at?: string
          wanted_roof?: string | null
          wanted_roof_deck?: string | null
        }
        Relationships: []
      }
      quote_settings: {
        Row: {
          created_at: string | null
          default_markup_pct: number | null
          default_waste_pct: number | null
          id: string
          labor_rate_per_sq: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_markup_pct?: number | null
          default_waste_pct?: number | null
          id?: string
          labor_rate_per_sq?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_markup_pct?: number | null
          default_waste_pct?: number | null
          id?: string
          labor_rate_per_sq?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_training_sessions: {
        Row: {
          actions_sequence: Json
          completed_at: string | null
          created_at: string
          difficulty_rating: number | null
          duration_seconds: number | null
          final_estimate: number | null
          id: string
          notes: string | null
          quote_id: string
          redo_count: number | null
          started_at: string
          total_actions: number | null
          total_facets_created: number | null
          total_lines_drawn: number | null
          total_measurements: number | null
          undo_count: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actions_sequence?: Json
          completed_at?: string | null
          created_at?: string
          difficulty_rating?: number | null
          duration_seconds?: number | null
          final_estimate?: number | null
          id?: string
          notes?: string | null
          quote_id: string
          redo_count?: number | null
          started_at?: string
          total_actions?: number | null
          total_facets_created?: number | null
          total_lines_drawn?: number | null
          total_measurements?: number | null
          undo_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actions_sequence?: Json
          completed_at?: string | null
          created_at?: string
          difficulty_rating?: number | null
          duration_seconds?: number | null
          final_estimate?: number | null
          id?: string
          notes?: string | null
          quote_id?: string
          redo_count?: number | null
          started_at?: string
          total_actions?: number | null
          total_facets_created?: number | null
          total_lines_drawn?: number | null
          total_measurements?: number | null
          undo_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_training_sessions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          items: Json
          lead_id: string | null
          notes: string | null
          option_name: string | null
          proposal_id: string | null
          quote_number: string
          status: string
          total_amount: number
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          option_name?: string | null
          proposal_id?: string | null
          quote_number: string
          status?: string
          total_amount: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          option_name?: string | null
          proposal_id?: string | null
          quote_number?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "project_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      recognitions: {
        Row: {
          badge_emoji: string
          badge_name: string
          created_at: string | null
          from_user_id: string
          id: string
          message: string | null
          to_user_ids: string[]
          updated_at: string | null
        }
        Insert: {
          badge_emoji: string
          badge_name: string
          created_at?: string | null
          from_user_id: string
          id?: string
          message?: string | null
          to_user_ids: string[]
          updated_at?: string | null
        }
        Update: {
          badge_emoji?: string
          badge_name?: string
          created_at?: string | null
          from_user_id?: string
          id?: string
          message?: string | null
          to_user_ids?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      rf_roles: {
        Row: {
          key: string
          label: string
        }
        Insert: {
          key: string
          label: string
        }
        Update: {
          key?: string
          label?: string
        }
        Relationships: []
      }
      roof_analyses: {
        Row: {
          aerial_image_id: string
          ai_confidence_score: number | null
          ai_response_data: Json | null
          analysis_status: string
          chimney_count: number | null
          created_at: string
          dormer_count: number | null
          downspout_count: number | null
          gutter_length_ft: number | null
          id: string
          penetration_count: number | null
          ridge_length_ft: number | null
          roof_complexity_score: number | null
          roof_outline_coordinates: Json | null
          roof_pitch_degrees: number | null
          roof_planes_data: Json | null
          skylight_count: number | null
          total_roof_area: number | null
          updated_at: string
          valley_count: number | null
          vent_count: number | null
        }
        Insert: {
          aerial_image_id: string
          ai_confidence_score?: number | null
          ai_response_data?: Json | null
          analysis_status?: string
          chimney_count?: number | null
          created_at?: string
          dormer_count?: number | null
          downspout_count?: number | null
          gutter_length_ft?: number | null
          id?: string
          penetration_count?: number | null
          ridge_length_ft?: number | null
          roof_complexity_score?: number | null
          roof_outline_coordinates?: Json | null
          roof_pitch_degrees?: number | null
          roof_planes_data?: Json | null
          skylight_count?: number | null
          total_roof_area?: number | null
          updated_at?: string
          valley_count?: number | null
          vent_count?: number | null
        }
        Update: {
          aerial_image_id?: string
          ai_confidence_score?: number | null
          ai_response_data?: Json | null
          analysis_status?: string
          chimney_count?: number | null
          created_at?: string
          dormer_count?: number | null
          downspout_count?: number | null
          gutter_length_ft?: number | null
          id?: string
          penetration_count?: number | null
          ridge_length_ft?: number | null
          roof_complexity_score?: number | null
          roof_outline_coordinates?: Json | null
          roof_pitch_degrees?: number | null
          roof_planes_data?: Json | null
          skylight_count?: number | null
          total_roof_area?: number | null
          updated_at?: string
          valley_count?: number | null
          vent_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roof_analyses_aerial_image_id_fkey"
            columns: ["aerial_image_id"]
            isOneToOne: false
            referencedRelation: "aerial_images"
            referencedColumns: ["id"]
          },
        ]
      }
      roof_corrections: {
        Row: {
          adjustment_summary: Json | null
          corrected_edges: Json | null
          corrected_vertices: Json
          correction_notes: string | null
          created_at: string | null
          created_by: string | null
          id: string
          image_quality: string | null
          image_resolution: string | null
          location_lat: number | null
          location_lng: number | null
          original_edges: Json | null
          original_vertices: Json
          quote_request_id: string | null
          roof_type: string | null
          vision_analysis_id: string | null
        }
        Insert: {
          adjustment_summary?: Json | null
          corrected_edges?: Json | null
          corrected_vertices: Json
          correction_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_quality?: string | null
          image_resolution?: string | null
          location_lat?: number | null
          location_lng?: number | null
          original_edges?: Json | null
          original_vertices: Json
          quote_request_id?: string | null
          roof_type?: string | null
          vision_analysis_id?: string | null
        }
        Update: {
          adjustment_summary?: Json | null
          corrected_edges?: Json | null
          corrected_vertices?: Json
          correction_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_quality?: string | null
          image_resolution?: string | null
          location_lat?: number | null
          location_lng?: number | null
          original_edges?: Json | null
          original_vertices?: Json
          quote_request_id?: string | null
          roof_type?: string | null
          vision_analysis_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roof_corrections_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roof_corrections_vision_analysis_id_fkey"
            columns: ["vision_analysis_id"]
            isOneToOne: false
            referencedRelation: "roof_vision_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      roof_features: {
        Row: {
          confidence_score: number | null
          created_at: string
          dimensions: Json | null
          feature_coordinates: Json
          feature_count: number | null
          feature_type: string
          id: string
          measurements: Json | null
          roof_analysis_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          dimensions?: Json | null
          feature_coordinates: Json
          feature_count?: number | null
          feature_type: string
          id?: string
          measurements?: Json | null
          roof_analysis_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          dimensions?: Json | null
          feature_coordinates?: Json
          feature_count?: number | null
          feature_type?: string
          id?: string
          measurements?: Json | null
          roof_analysis_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roof_features_roof_analysis_id_fkey"
            columns: ["roof_analysis_id"]
            isOneToOne: false
            referencedRelation: "roof_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      roof_measurements: {
        Row: {
          analysis_notes: string | null
          assistant_run_id: string | null
          assistant_thread_id: string | null
          confidence_score: number | null
          created_at: string
          data: Json
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          analysis_notes?: string | null
          assistant_run_id?: string | null
          assistant_thread_id?: string | null
          confidence_score?: number | null
          created_at?: string
          data?: Json
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          analysis_notes?: string | null
          assistant_run_id?: string | null
          assistant_thread_id?: string | null
          confidence_score?: number | null
          created_at?: string
          data?: Json
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      roof_planes: {
        Row: {
          area_sqft: number | null
          created_at: string
          id: string
          plane_coordinates: Json
          plane_type: string | null
          roof_analysis_id: string
          slope_angle: number | null
        }
        Insert: {
          area_sqft?: number | null
          created_at?: string
          id?: string
          plane_coordinates: Json
          plane_type?: string | null
          roof_analysis_id: string
          slope_angle?: number | null
        }
        Update: {
          area_sqft?: number | null
          created_at?: string
          id?: string
          plane_coordinates?: Json
          plane_type?: string | null
          roof_analysis_id?: string
          slope_angle?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roof_planes_roof_analysis_id_fkey"
            columns: ["roof_analysis_id"]
            isOneToOne: false
            referencedRelation: "roof_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      roof_quoter_projects: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          meta: Json | null
          project_id: string
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          meta?: Json | null
          project_id: string
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          meta?: Json | null
          project_id?: string
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roof_quoter_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      roof_structures: {
        Row: {
          area_sq_ft: number
          confidence: number
          created_at: string
          geometry: Json
          id: string
          is_included: boolean
          perimeter_ft: number | null
          quote_request_id: string
          structure_id: string
          updated_at: string
        }
        Insert: {
          area_sq_ft: number
          confidence: number
          created_at?: string
          geometry: Json
          id?: string
          is_included?: boolean
          perimeter_ft?: number | null
          quote_request_id: string
          structure_id: string
          updated_at?: string
        }
        Update: {
          area_sq_ft?: number
          confidence?: number
          created_at?: string
          geometry?: Json
          id?: string
          is_included?: boolean
          perimeter_ft?: number | null
          quote_request_id?: string
          structure_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roof_structures_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      roof_vision_analyses: {
        Row: {
          analysis_notes: string | null
          confidence_score: number | null
          created_at: string
          detected_edges: Json | null
          detected_features: Json | null
          detected_planes: Json | null
          id: string
          image_url: string
          model_used: string | null
          quote_request_id: string | null
          roof_type: string | null
          updated_at: string
        }
        Insert: {
          analysis_notes?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_edges?: Json | null
          detected_features?: Json | null
          detected_planes?: Json | null
          id?: string
          image_url: string
          model_used?: string | null
          quote_request_id?: string | null
          roof_type?: string | null
          updated_at?: string
        }
        Update: {
          analysis_notes?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_edges?: Json | null
          detected_features?: Json | null
          detected_planes?: Json | null
          id?: string
          image_url?: string
          model_used?: string | null
          quote_request_id?: string | null
          roof_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roof_vision_analyses_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      roofing_variable_definitions: {
        Row: {
          affects_categories: Json
          category: string
          created_at: string | null
          educational_tooltip: string | null
          id: string
          name: string
          options: Json
          updated_at: string | null
          variable_id: string
        }
        Insert: {
          affects_categories: Json
          category: string
          created_at?: string | null
          educational_tooltip?: string | null
          id?: string
          name: string
          options: Json
          updated_at?: string | null
          variable_id: string
        }
        Update: {
          affects_categories?: Json
          category?: string
          created_at?: string | null
          educational_tooltip?: string | null
          id?: string
          name?: string
          options?: Json
          updated_at?: string | null
          variable_id?: string
        }
        Relationships: []
      }
      room_participants: {
        Row: {
          id: string
          is_camera_on: boolean | null
          is_muted: boolean | null
          joined_at: string | null
          member_id: string
          room_id: string | null
        }
        Insert: {
          id?: string
          is_camera_on?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          member_id: string
          room_id?: string | null
        }
        Update: {
          id?: string
          is_camera_on?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          member_id?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "meeting_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_checklist_responses: {
        Row: {
          additional_items: string | null
          created_at: string
          hard_hat: boolean
          id: string
          protective_glasses: boolean
          safety_vest: boolean
          selfie_url: string | null
          signature_data: string | null
          steel_cap_boots: boolean
          time_clock_id: string | null
          user_id: string
        }
        Insert: {
          additional_items?: string | null
          created_at?: string
          hard_hat?: boolean
          id?: string
          protective_glasses?: boolean
          safety_vest?: boolean
          selfie_url?: string | null
          signature_data?: string | null
          steel_cap_boots?: boolean
          time_clock_id?: string | null
          user_id: string
        }
        Update: {
          additional_items?: string | null
          created_at?: string
          hard_hat?: boolean
          id?: string
          protective_glasses?: boolean
          safety_vest?: boolean
          selfie_url?: string | null
          signature_data?: string | null
          steel_cap_boots?: boolean
          time_clock_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_checklist_responses_time_clock_id_fkey"
            columns: ["time_clock_id"]
            isOneToOne: false
            referencedRelation: "time_clock"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_date: string
          incident_type: string
          project_id: string | null
          reported_by: string | null
          resolution: string | null
          resolved_at: string | null
          severity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          incident_date: string
          incident_type?: string
          project_id?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          project_id?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safety_meeting_attendees: {
        Row: {
          created_at: string
          employee_id: string | null
          employee_initials: string | null
          employee_name: string
          id: string
          meeting_id: string
          signature_url: string | null
          signed_at: string | null
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          employee_initials?: string | null
          employee_name: string
          id?: string
          meeting_id: string
          signature_url?: string | null
          signed_at?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          employee_initials?: string | null
          employee_name?: string
          id?: string
          meeting_id?: string
          signature_url?: string | null
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "safety_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_meeting_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          meeting_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          meeting_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          meeting_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_meeting_files_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "safety_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_meeting_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          meeting_id: string
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id: string
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "safety_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_meetings: {
        Row: {
          completed_at: string | null
          cost_code: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_leader_id: string | null
          meeting_leader_name: string | null
          meeting_time: string | null
          meeting_type: string | null
          project_id: string | null
          status: string | null
          topic: string
          topic_text: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          cost_code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_leader_id?: string | null
          meeting_leader_name?: string | null
          meeting_time?: string | null
          meeting_type?: string | null
          project_id?: string | null
          status?: string | null
          topic: string
          topic_text?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          cost_code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_leader_id?: string | null
          meeting_leader_name?: string | null
          meeting_time?: string | null
          meeting_type?: string | null
          project_id?: string | null
          status?: string | null
          topic?: string
          topic_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_clients: {
        Row: {
          address: string | null
          assigned_to: string | null
          avatar_url: string | null
          business_name: string | null
          call_status: string | null
          chatbot_started_at: string | null
          client_type: string | null
          company_size: string | null
          contact_name: string | null
          contract_end_date: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          google_business_url: string | null
          id: string
          industry: string | null
          instagram_handle: string | null
          last_chatbot_message_at: string | null
          lead_source: string | null
          monthly_value: number | null
          name: string
          notes: string | null
          onboarding_date: string | null
          parent_client_id: string | null
          phone: string | null
          plan_start_date: string | null
          plan_type: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          secondary_email: string | null
          secondary_phone: string | null
          service_area: string | null
          status: string
          tiktok_handle: string | null
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          avatar_url?: string | null
          business_name?: string | null
          call_status?: string | null
          chatbot_started_at?: string | null
          client_type?: string | null
          company_size?: string | null
          contact_name?: string | null
          contract_end_date?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          google_business_url?: string | null
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          last_chatbot_message_at?: string | null
          lead_source?: string | null
          monthly_value?: number | null
          name: string
          notes?: string | null
          onboarding_date?: string | null
          parent_client_id?: string | null
          phone?: string | null
          plan_start_date?: string | null
          plan_type?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          secondary_email?: string | null
          secondary_phone?: string | null
          service_area?: string | null
          status?: string
          tiktok_handle?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          avatar_url?: string | null
          business_name?: string | null
          call_status?: string | null
          chatbot_started_at?: string | null
          client_type?: string | null
          company_size?: string | null
          contact_name?: string | null
          contract_end_date?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          google_business_url?: string | null
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          last_chatbot_message_at?: string | null
          lead_source?: string | null
          monthly_value?: number | null
          name?: string
          notes?: string | null
          onboarding_date?: string | null
          parent_client_id?: string | null
          phone?: string | null
          plan_start_date?: string | null
          plan_type?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          secondary_email?: string | null
          secondary_phone?: string | null
          service_area?: string | null
          status?: string
          tiktok_handle?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_clients_parent_client_id_fkey"
            columns: ["parent_client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_ticket_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          ticket_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          ticket_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          ticket_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_files_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_ticket_invoices: {
        Row: {
          amount: number
          balance: number | null
          created_at: string
          id: string
          invoice_date: string
          invoice_number: string
          paid_amount: number | null
          status: string | null
          ticket_id: string
        }
        Insert: {
          amount?: number
          balance?: number | null
          created_at?: string
          id?: string
          invoice_date?: string
          invoice_number: string
          paid_amount?: number | null
          status?: string | null
          ticket_id: string
        }
        Update: {
          amount?: number
          balance?: number | null
          created_at?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          paid_amount?: number | null
          status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_ticket_items: {
        Row: {
          cost_code: string | null
          created_at: string
          description: string | null
          id: string
          item_name: string
          item_type: string | null
          quantity: number | null
          ticket_id: string
          total: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          cost_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          item_type?: string | null
          quantity?: number | null
          ticket_id: string
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          cost_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          item_type?: string | null
          quantity?: number | null
          ticket_id?: string
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_ticket_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_ticket_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          payment_date: string
          payment_note: string | null
          payment_type: string | null
          status: string | null
          ticket_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_note?: string | null
          payment_type?: string | null
          status?: string | null
          ticket_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_note?: string | null
          payment_type?: string | null
          status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "service_ticket_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_payments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_ticket_time_cards: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          cost_code: string | null
          created_at: string
          duration_hours: number | null
          employee_id: string | null
          employee_name: string | null
          id: string
          notes: string | null
          ticket_id: string
          work_date: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          cost_code?: string | null
          created_at?: string
          duration_hours?: number | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          notes?: string | null
          ticket_id: string
          work_date: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          cost_code?: string | null
          created_at?: string
          duration_hours?: number | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          notes?: string | null
          ticket_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_time_cards_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tickets: {
        Row: {
          access_gate_code: string | null
          assigned_technician_id: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_access_token: string | null
          customer_id: string | null
          description: string | null
          duration_hours: number | null
          id: string
          internal_notes: string | null
          is_billable: boolean | null
          latitude: number | null
          longitude: number | null
          project_id: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_address: string | null
          service_city: string | null
          service_notes: string | null
          service_state: string | null
          service_zip: string | null
          status: string
          ticket_number: string
          title: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          access_gate_code?: string | null
          assigned_technician_id?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_access_token?: string | null
          customer_id?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          internal_notes?: string | null
          is_billable?: boolean | null
          latitude?: number | null
          longitude?: number | null
          project_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_address?: string | null
          service_city?: string | null
          service_notes?: string | null
          service_state?: string | null
          service_zip?: string | null
          status?: string
          ticket_number: string
          title: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          access_gate_code?: string | null
          assigned_technician_id?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_access_token?: string | null
          customer_id?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          internal_notes?: string | null
          is_billable?: boolean | null
          latitude?: number | null
          longitude?: number | null
          project_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_address?: string | null
          service_city?: string | null
          service_notes?: string | null
          service_state?: string | null
          service_zip?: string | null
          status?: string
          ticket_number?: string
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          shift_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          shift_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          shift_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_tasks_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "job_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_envelopes: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          email_settings: Json | null
          id: string
          message: string | null
          metadata: Json | null
          proposal_id: string | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
          voided_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          email_settings?: Json | null
          id?: string
          message?: string | null
          metadata?: Json | null
          proposal_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          voided_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          email_settings?: Json | null
          id?: string
          message?: string | null
          metadata?: Json | null
          proposal_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_envelopes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "project_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_sessions: {
        Row: {
          completed_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: string | null
          last_activity_at: string
          recipient_id: string
          session_token: string | null
          started_at: string
          user_agent: string | null
        }
        Insert: {
          completed_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string
          recipient_id: string
          session_token?: string | null
          started_at?: string
          user_agent?: string | null
        }
        Update: {
          completed_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string
          recipient_id?: string
          session_token?: string | null
          started_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_sessions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "envelope_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          category: string
          content: string
          content_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          search_score: number | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category: string
          content: string
          content_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          search_score?: number | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          search_score?: number | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      skill_level_evaluations: {
        Row: {
          assigned_level: number
          competency_scores: Json
          created_at: string
          employee_id: string
          evaluated_at: string
          evaluation_notes: string | null
          evaluator_id: string
          id: string
          is_current: boolean
          updated_at: string
        }
        Insert: {
          assigned_level: number
          competency_scores?: Json
          created_at?: string
          employee_id: string
          evaluated_at?: string
          evaluation_notes?: string | null
          evaluator_id: string
          id?: string
          is_current?: boolean
          updated_at?: string
        }
        Update: {
          assigned_level?: number
          competency_scores?: Json
          created_at?: string
          employee_id?: string
          evaluated_at?: string
          evaluation_notes?: string | null
          evaluator_id?: string
          id?: string
          is_current?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_level_evaluations_assigned_level_fkey"
            columns: ["assigned_level"]
            isOneToOne: false
            referencedRelation: "skill_levels"
            referencedColumns: ["level"]
          },
        ]
      }
      skill_levels: {
        Row: {
          can_lead_crew: boolean
          can_work_alone: boolean
          color: string
          competencies: Json
          created_at: string
          description: string
          id: string
          level: number
          name: string
          short_name: string
        }
        Insert: {
          can_lead_crew?: boolean
          can_work_alone?: boolean
          color: string
          competencies?: Json
          created_at?: string
          description: string
          id?: string
          level: number
          name: string
          short_name: string
        }
        Update: {
          can_lead_crew?: boolean
          can_work_alone?: boolean
          color?: string
          competencies?: Json
          created_at?: string
          description?: string
          id?: string
          level?: number
          name?: string
          short_name?: string
        }
        Relationships: []
      }
      sms_conversations: {
        Row: {
          context: Json | null
          created_at: string
          direction: string
          from_phone: string
          id: string
          lead_id: string | null
          message: string
          to_phone: string
          twilio_sid: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          direction: string
          from_phone: string
          id?: string
          lead_id?: string | null
          message: string
          to_phone: string
          twilio_sid?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          direction?: string
          from_phone?: string
          id?: string
          lead_id?: string | null
          message?: string
          to_phone?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      solar_analyses: {
        Row: {
          confidence_score: number | null
          created_at: string
          error_message: string | null
          id: string
          imagery_date: string | null
          imagery_quality: string | null
          parsed_roof_data: Json
          quote_request_id: string
          raw_api_response: Json
          status: string
          total_area_sqft: number | null
          total_area_squares: number | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          imagery_date?: string | null
          imagery_quality?: string | null
          parsed_roof_data?: Json
          quote_request_id: string
          raw_api_response?: Json
          status?: string
          total_area_sqft?: number | null
          total_area_squares?: number | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          imagery_date?: string | null
          imagery_quality?: string | null
          parsed_roof_data?: Json
          quote_request_id?: string
          raw_api_response?: Json
          status?: string
          total_area_sqft?: number | null
          total_area_squares?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solar_analyses_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      solar_layer_cache: {
        Row: {
          crc32: string | null
          created_at: string
          expires_at: string
          file_size: number | null
          id: string
          layer_kind: string
          location_key: string
          signed_url: string
        }
        Insert: {
          crc32?: string | null
          created_at?: string
          expires_at: string
          file_size?: number | null
          id?: string
          layer_kind: string
          location_key: string
          signed_url: string
        }
        Update: {
          crc32?: string | null
          created_at?: string
          expires_at?: string
          file_size?: number | null
          id?: string
          layer_kind?: string
          location_key?: string
          signed_url?: string
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          shipping: number | null
          shipping_address: Json | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          shipping?: number | null
          shipping_address?: Json | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          shipping?: number | null
          shipping_address?: Json | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sub_contract_bills: {
        Row: {
          bill_date: string | null
          bill_number: string | null
          created_at: string
          due_date: string | null
          id: string
          paid: number | null
          sub_contract_id: string
          total: number | null
        }
        Insert: {
          bill_date?: string | null
          bill_number?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          paid?: number | null
          sub_contract_id: string
          total?: number | null
        }
        Update: {
          bill_date?: string | null
          bill_number?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          paid?: number | null
          sub_contract_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_contract_bills_sub_contract_id_fkey"
            columns: ["sub_contract_id"]
            isOneToOne: false
            referencedRelation: "sub_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_contract_documents: {
        Row: {
          created_at: string
          expires_at: string | null
          file_url: string | null
          id: string
          policy_number: string | null
          policy_type: string | null
          status: string | null
          sub_contract_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          policy_number?: string | null
          policy_type?: string | null
          status?: string | null
          sub_contract_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          policy_number?: string | null
          policy_type?: string | null
          status?: string | null
          sub_contract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_contract_documents_sub_contract_id_fkey"
            columns: ["sub_contract_id"]
            isOneToOne: false
            referencedRelation: "sub_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_contract_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          sub_contract_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          sub_contract_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          sub_contract_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_contract_files_sub_contract_id_fkey"
            columns: ["sub_contract_id"]
            isOneToOne: false
            referencedRelation: "sub_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_contract_items: {
        Row: {
          billed: number | null
          cost_code: string | null
          created_at: string
          display_order: number | null
          id: string
          item_name: string
          item_type: string | null
          quantity: number | null
          remaining: number | null
          sub_contract_id: string
          total: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          billed?: number | null
          cost_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          item_name: string
          item_type?: string | null
          quantity?: number | null
          remaining?: number | null
          sub_contract_id: string
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          billed?: number | null
          cost_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          item_name?: string
          item_type?: string | null
          quantity?: number | null
          remaining?: number | null
          sub_contract_id?: string
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_contract_items_sub_contract_id_fkey"
            columns: ["sub_contract_id"]
            isOneToOne: false
            referencedRelation: "sub_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_contract_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          sub_contract_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          sub_contract_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sub_contract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_contract_notes_sub_contract_id_fkey"
            columns: ["sub_contract_id"]
            isOneToOne: false
            referencedRelation: "sub_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_contract_terms: {
        Row: {
          clarifications: string | null
          created_at: string
          default_terms: string | null
          exclusions: string | null
          id: string
          inclusions: string | null
          scope_of_work: string | null
          sub_contract_id: string
          updated_at: string
        }
        Insert: {
          clarifications?: string | null
          created_at?: string
          default_terms?: string | null
          exclusions?: string | null
          id?: string
          inclusions?: string | null
          scope_of_work?: string | null
          sub_contract_id: string
          updated_at?: string
        }
        Update: {
          clarifications?: string | null
          created_at?: string
          default_terms?: string | null
          exclusions?: string | null
          id?: string
          inclusions?: string | null
          scope_of_work?: string | null
          sub_contract_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_contract_terms_sub_contract_id_fkey"
            columns: ["sub_contract_id"]
            isOneToOne: false
            referencedRelation: "sub_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_contracts: {
        Row: {
          agreement_number: string | null
          balance: number | null
          billed_amount: number | null
          created_at: string
          created_by: string | null
          date: string | null
          id: string
          issued_by: string | null
          paid: number | null
          project_id: string | null
          remaining_retainage: number | null
          status: string | null
          subcontractor_id: string | null
          subject: string
          total: number | null
          total_retainage: number | null
          updated_at: string
          work_retainage_percent: number | null
        }
        Insert: {
          agreement_number?: string | null
          balance?: number | null
          billed_amount?: number | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          id?: string
          issued_by?: string | null
          paid?: number | null
          project_id?: string | null
          remaining_retainage?: number | null
          status?: string | null
          subcontractor_id?: string | null
          subject: string
          total?: number | null
          total_retainage?: number | null
          updated_at?: string
          work_retainage_percent?: number | null
        }
        Update: {
          agreement_number?: string | null
          balance?: number | null
          billed_amount?: number | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          id?: string
          issued_by?: string | null
          paid?: number | null
          project_id?: string | null
          remaining_retainage?: number | null
          status?: string | null
          subcontractor_id?: string | null
          subject?: string
          total?: number | null
          total_retainage?: number | null
          updated_at?: string
          work_retainage_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_contracts_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "directory_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_item_attachments: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          submittal_item_id: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          submittal_item_id: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          submittal_item_id?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittal_item_attachments_submittal_item_id_fkey"
            columns: ["submittal_item_id"]
            isOneToOne: false
            referencedRelation: "submittal_items"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_items: {
        Row: {
          created_at: string | null
          date_received: string | null
          date_sent: string | null
          description: string | null
          id: string
          item_number: string
          manufacturer: string | null
          name: string
          order_index: number | null
          plan_sheet_numbers: string | null
          response_note: string | null
          response_status: string | null
          spec_section: string | null
          status: string | null
          submittal_id: string
        }
        Insert: {
          created_at?: string | null
          date_received?: string | null
          date_sent?: string | null
          description?: string | null
          id?: string
          item_number: string
          manufacturer?: string | null
          name: string
          order_index?: number | null
          plan_sheet_numbers?: string | null
          response_note?: string | null
          response_status?: string | null
          spec_section?: string | null
          status?: string | null
          submittal_id: string
        }
        Update: {
          created_at?: string | null
          date_received?: string | null
          date_sent?: string | null
          description?: string | null
          id?: string
          item_number?: string
          manufacturer?: string | null
          name?: string
          order_index?: number | null
          plan_sheet_numbers?: string | null
          response_note?: string | null
          response_status?: string | null
          spec_section?: string | null
          status?: string | null
          submittal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittal_items_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      submittals: {
        Row: {
          coordinator_id: string | null
          created_at: string | null
          date_received: string | null
          description: string | null
          due_date: string | null
          external_approver: string | null
          external_comments: string | null
          external_link: string | null
          external_status: string | null
          id: string
          internal_approver_id: string | null
          internal_comments: string | null
          internal_response: string | null
          name: string
          plan_sheet_numbers: string | null
          project_id: string
          sent_to: string | null
          spec_section: string | null
          status: string | null
          submittal_type: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          coordinator_id?: string | null
          created_at?: string | null
          date_received?: string | null
          description?: string | null
          due_date?: string | null
          external_approver?: string | null
          external_comments?: string | null
          external_link?: string | null
          external_status?: string | null
          id?: string
          internal_approver_id?: string | null
          internal_comments?: string | null
          internal_response?: string | null
          name: string
          plan_sheet_numbers?: string | null
          project_id: string
          sent_to?: string | null
          spec_section?: string | null
          status?: string | null
          submittal_type?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          coordinator_id?: string | null
          created_at?: string | null
          date_received?: string | null
          description?: string | null
          due_date?: string | null
          external_approver?: string | null
          external_comments?: string | null
          external_link?: string | null
          external_status?: string | null
          id?: string
          internal_approver_id?: string | null
          internal_comments?: string | null
          internal_response?: string | null
          name?: string
          plan_sheet_numbers?: string | null
          project_id?: string
          sent_to?: string | null
          spec_section?: string | null
          status?: string | null
          submittal_type?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          size: number | null
          task_id: string
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          size?: number | null
          task_id: string
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          size?: number | null
          task_id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "team_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          subtask_id: string | null
          task_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          subtask_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          subtask_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "task_subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "team_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_event_reminders: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          item_id: string
          item_type: string
          member_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          item_id: string
          item_type: string
          member_id?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          item_id?: string
          item_type?: string
          member_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      task_subtasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          order_index: number
          parent_task_id: string
          proof_description: string | null
          proof_url: string | null
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          parent_task_id: string
          proof_description?: string | null
          proof_url?: string | null
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          parent_task_id?: string
          proof_description?: string | null
          proof_url?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "team_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_log: {
        Row: {
          action_data: Json | null
          action_description: string | null
          action_type: string
          created_at: string | null
          id: string
          member_id: string
          points: number | null
        }
        Insert: {
          action_data?: Json | null
          action_description?: string | null
          action_type: string
          created_at?: string | null
          id?: string
          member_id: string
          points?: number | null
        }
        Update: {
          action_data?: Json | null
          action_description?: string | null
          action_type?: string
          created_at?: string | null
          id?: string
          member_id?: string
          points?: number | null
        }
        Relationships: []
      }
      team_board_comments: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_board_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "team_board_items"
            referencedColumns: ["id"]
          },
        ]
      }
      team_board_items: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          feedback_id: string | null
          id: string
          priority: string | null
          status: string
          title: string
          updated_at: string
          votes_count: number | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          feedback_id?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
          votes_count?: number | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          feedback_id?: string | null
          id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_board_items_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "admin_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      team_board_votes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_board_votes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "team_board_items"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chats: {
        Row: {
          attachments: Json | null
          audio_url: string | null
          channel_name: string | null
          connecteam_chat_id: string | null
          created_at: string
          duration: number | null
          id: string
          is_important: boolean | null
          message: string
          message_type: string | null
          sender: string
          sender_employee_id: string | null
          sender_user_id: string | null
          team_id: string | null
          timestamp: string
        }
        Insert: {
          attachments?: Json | null
          audio_url?: string | null
          channel_name?: string | null
          connecteam_chat_id?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          is_important?: boolean | null
          message: string
          message_type?: string | null
          sender: string
          sender_employee_id?: string | null
          sender_user_id?: string | null
          team_id?: string | null
          timestamp: string
        }
        Update: {
          attachments?: Json | null
          audio_url?: string | null
          channel_name?: string | null
          connecteam_chat_id?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          is_important?: boolean | null
          message?: string
          message_type?: string | null
          sender?: string
          sender_employee_id?: string | null
          sender_user_id?: string | null
          team_id?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      team_daily_scores: {
        Row: {
          created_at: string
          id: string
          member_id: string
          messages_sent: number | null
          rank: number | null
          recordings_made: number | null
          score_date: string
          tasks_completed: number | null
          tasks_created: number | null
          time_logged_minutes: number | null
          total_points: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          messages_sent?: number | null
          rank?: number | null
          recordings_made?: number | null
          score_date?: string
          tasks_completed?: number | null
          tasks_created?: number | null
          time_logged_minutes?: number | null
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          messages_sent?: number | null
          rank?: number | null
          recordings_made?: number | null
          score_date?: string
          tasks_completed?: number | null
          tasks_created?: number | null
          time_logged_minutes?: number | null
          total_points?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      team_directory: {
        Row: {
          avatar_url: string | null
          camera_on: boolean | null
          class_code: string | null
          created_at: string
          current_room_id: string | null
          email: string
          full_name: string | null
          hourly_rate: number | null
          in_call_with: string | null
          invite_token: string | null
          invited_at: string | null
          invited_by: string | null
          language: string | null
          last_login_at: string | null
          phone_number: string | null
          push_token: string | null
          role: string
          secondary_role: string | null
          sms_notifications_enabled: boolean | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          camera_on?: boolean | null
          class_code?: string | null
          created_at?: string
          current_room_id?: string | null
          email: string
          full_name?: string | null
          hourly_rate?: number | null
          in_call_with?: string | null
          invite_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          language?: string | null
          last_login_at?: string | null
          phone_number?: string | null
          push_token?: string | null
          role: string
          secondary_role?: string | null
          sms_notifications_enabled?: boolean | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          camera_on?: boolean | null
          class_code?: string | null
          created_at?: string
          current_room_id?: string | null
          email?: string
          full_name?: string | null
          hourly_rate?: number | null
          in_call_with?: string | null
          invite_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          language?: string | null
          last_login_at?: string | null
          phone_number?: string | null
          push_token?: string | null
          role?: string
          secondary_role?: string | null
          sms_notifications_enabled?: boolean | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_directory_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "rf_roles"
            referencedColumns: ["key"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          full_name: string
          id: string
          invited_by: string
          is_expired: boolean | null
          role: string
          status: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          full_name: string
          id?: string
          invited_by: string
          is_expired?: boolean | null
          role: string
          status?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          full_name?: string
          id?: string
          invited_by?: string
          is_expired?: boolean | null
          role?: string
          status?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      team_member_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          member_id: string
          message: string | null
          priority: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          member_id: string
          message?: string | null
          priority?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          member_id?: string
          message?: string | null
          priority?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_deleted: boolean
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "direct_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          last_activity_at: string | null
          member_id: string
          started_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          member_id: string
          started_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          member_id?: string
          started_at?: string | null
        }
        Relationships: []
      }
      team_tasks: {
        Row: {
          blocker_notes: string | null
          client_id: string | null
          client_name: string | null
          collaborator_ids: string[] | null
          completed_at: string | null
          created_at: string
          current_focus: boolean
          description: string | null
          document_title: string | null
          document_url: string | null
          due_date: string | null
          end_time: string | null
          estimated_duration: string
          id: string
          importance_level: number
          owner_id: string | null
          priority: string
          progress_percent: number
          project_id: string | null
          proof_description: string | null
          proof_url: string | null
          status: string
          title: string
          updated_at: string
          urgency_level: number
        }
        Insert: {
          blocker_notes?: string | null
          client_id?: string | null
          client_name?: string | null
          collaborator_ids?: string[] | null
          completed_at?: string | null
          created_at?: string
          current_focus?: boolean
          description?: string | null
          document_title?: string | null
          document_url?: string | null
          due_date?: string | null
          end_time?: string | null
          estimated_duration?: string
          id?: string
          importance_level?: number
          owner_id?: string | null
          priority?: string
          progress_percent?: number
          project_id?: string | null
          proof_description?: string | null
          proof_url?: string | null
          status?: string
          title: string
          updated_at?: string
          urgency_level?: number
        }
        Update: {
          blocker_notes?: string | null
          client_id?: string | null
          client_name?: string | null
          collaborator_ids?: string[] | null
          completed_at?: string | null
          created_at?: string
          current_focus?: boolean
          description?: string | null
          document_title?: string | null
          document_url?: string | null
          due_date?: string | null
          end_time?: string | null
          estimated_duration?: string
          id?: string
          importance_level?: number
          owner_id?: string | null
          priority?: string
          progress_percent?: number
          project_id?: string | null
          proof_description?: string | null
          proof_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          urgency_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sales_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_update_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          update_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          update_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          update_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_update_comments_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "team_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      team_update_interactions: {
        Row: {
          id: string
          liked: boolean
          update_id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          liked?: boolean
          update_id: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          liked?: boolean
          update_id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_update_interactions_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "team_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      team_updates: {
        Row: {
          background_color: string
          content: string
          created_at: string
          created_by: string
          id: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      time_clock: {
        Row: {
          break_location: string | null
          break_start_time: string | null
          break_time_minutes: number | null
          clock_in: string
          clock_out: string | null
          clock_out_location: string | null
          connecteam_timecard_id: string | null
          created_at: string
          employee_name: string
          employee_role: string | null
          id: string
          job_id: string | null
          location: string | null
          notes: string | null
          overtime_hours: number | null
          project_name: string | null
          status: string | null
          total_hours: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          break_location?: string | null
          break_start_time?: string | null
          break_time_minutes?: number | null
          clock_in: string
          clock_out?: string | null
          clock_out_location?: string | null
          connecteam_timecard_id?: string | null
          created_at?: string
          employee_name: string
          employee_role?: string | null
          id?: string
          job_id?: string | null
          location?: string | null
          notes?: string | null
          overtime_hours?: number | null
          project_name?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          break_location?: string | null
          break_start_time?: string | null
          break_time_minutes?: number | null
          clock_in?: string
          clock_out?: string | null
          clock_out_location?: string | null
          connecteam_timecard_id?: string | null
          created_at?: string
          employee_name?: string
          employee_role?: string | null
          id?: string
          job_id?: string | null
          location?: string | null
          notes?: string | null
          overtime_hours?: number | null
          project_name?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          address: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_actions_log: {
        Row: {
          action_data: Json
          action_type: string
          id: string
          quote_id: string | null
          session_id: string | null
          state_after: Json | null
          state_before: Json | null
          time_since_last_action_ms: number | null
          timestamp: string
          tool_active: string | null
          user_id: string | null
          view_state: Json | null
        }
        Insert: {
          action_data: Json
          action_type: string
          id?: string
          quote_id?: string | null
          session_id?: string | null
          state_after?: Json | null
          state_before?: Json | null
          time_since_last_action_ms?: number | null
          timestamp?: string
          tool_active?: string | null
          user_id?: string | null
          view_state?: Json | null
        }
        Update: {
          action_data?: Json
          action_type?: string
          id?: string
          quote_id?: string | null
          session_id?: string | null
          state_after?: Json | null
          state_before?: Json | null
          time_since_last_action_ms?: number | null
          timestamp?: string
          tool_active?: string | null
          user_id?: string | null
          view_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_actions_log_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_actions_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quote_training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_token: string
          id: string
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_token: string
          id?: string
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_token?: string
          id?: string
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      video_calls: {
        Row: {
          callee_id: string
          caller_id: string
          created_at: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          callee_id: string
          caller_id: string
          created_at?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          callee_id?: string
          caller_id?: string
          created_at?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          created_at: string | null
          id: string
          last_activity: string | null
          mrf_prospect_id: string
          page_views: number | null
          session_data: Json | null
          session_id: string
          total_time_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          mrf_prospect_id: string
          page_views?: number | null
          session_data?: Json | null
          session_id: string
          total_time_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          mrf_prospect_id?: string
          page_views?: number | null
          session_data?: Json | null
          session_id?: string
          total_time_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      visualizer_images: {
        Row: {
          created_at: string
          height: number
          id: string
          original_url: string
          project_id: string
          width: number
        }
        Insert: {
          created_at?: string
          height: number
          id?: string
          original_url: string
          project_id: string
          width: number
        }
        Update: {
          created_at?: string
          height?: number
          id?: string
          original_url?: string
          project_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "visualizer_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "visualizer_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      visualizer_masks: {
        Row: {
          alpha_url: string | null
          created_at: string
          id: string
          image_id: string
          name: string | null
          svg_path: string
          type: string | null
          updated_at: string
        }
        Insert: {
          alpha_url?: string | null
          created_at?: string
          id?: string
          image_id: string
          name?: string | null
          svg_path: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          alpha_url?: string | null
          created_at?: string
          id?: string
          image_id?: string
          name?: string | null
          svg_path?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visualizer_masks_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "visualizer_images"
            referencedColumns: ["id"]
          },
        ]
      }
      visualizer_projects: {
        Row: {
          created_at: string
          id: string
          owner: string | null
          session_token: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner?: string | null
          session_token?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner?: string | null
          session_token?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      visualizer_variants: {
        Row: {
          color_key: string
          created_at: string
          hex: string
          id: string
          image_id: string
          preview_url: string | null
        }
        Insert: {
          color_key: string
          created_at?: string
          hex: string
          id?: string
          image_id: string
          preview_url?: string | null
        }
        Update: {
          color_key?: string
          created_at?: string
          hex?: string
          id?: string
          image_id?: string
          preview_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visualizer_variants_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "visualizer_images"
            referencedColumns: ["id"]
          },
        ]
      }
      work_activities: {
        Row: {
          clock_in: string
          clock_out: string | null
          connectteam_timecard_id: string | null
          created_at: string
          employee_mapping_id: string | null
          employee_name: string
          employee_role: string | null
          hourly_rate: number | null
          id: string
          notes: string | null
          overtime_hours: number | null
          overtime_rate: number | null
          project_id: string
          regular_hours: number | null
          status: string | null
          total_cost: number | null
          total_hours: number | null
          updated_at: string
          work_date: string
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          connectteam_timecard_id?: string | null
          created_at?: string
          employee_mapping_id?: string | null
          employee_name: string
          employee_role?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          overtime_rate?: number | null
          project_id: string
          regular_hours?: number | null
          status?: string | null
          total_cost?: number | null
          total_hours?: number | null
          updated_at?: string
          work_date: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          connectteam_timecard_id?: string | null
          created_at?: string
          employee_mapping_id?: string | null
          employee_name?: string
          employee_role?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          overtime_rate?: number | null
          project_id?: string
          regular_hours?: number | null
          status?: string | null
          total_cost?: number | null
          total_hours?: number | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_activities_employee_mapping_id_fkey"
            columns: ["employee_mapping_id"]
            isOneToOne: false
            referencedRelation: "employee_mapping"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
          work_order_id: string
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
          work_order_id: string
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_files_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_items: {
        Row: {
          cost_code: string | null
          created_at: string
          display_order: number | null
          id: string
          item_name: string
          item_type: string | null
          markup_percentage: number | null
          quantity: number | null
          tax_applicable: boolean | null
          total: number | null
          unit: string | null
          unit_cost: number | null
          work_order_id: string
        }
        Insert: {
          cost_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          item_name: string
          item_type?: string | null
          markup_percentage?: number | null
          quantity?: number | null
          tax_applicable?: boolean | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
          work_order_id: string
        }
        Update: {
          cost_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          item_name?: string
          item_type?: string | null
          markup_percentage?: number | null
          quantity?: number | null
          tax_applicable?: boolean | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          work_order_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          work_order_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_notes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string
          created_by: string | null
          customer_contract_number: string | null
          description: string | null
          estimated_cost: number | null
          grand_total: number | null
          hours: number | null
          id: string
          invoiced_to: string | null
          is_no_cost: boolean | null
          issued_by: string | null
          issued_by_name: string | null
          location: string | null
          markup_percentage: number | null
          profit_amount: number | null
          profit_percentage: number | null
          project_id: string | null
          service_end_date: string | null
          service_start_date: string | null
          site_drawing: string | null
          site_page: string | null
          site_type: string | null
          site_url: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_percentage: number | null
          terms_and_conditions: string | null
          title: string
          updated_at: string
          work_order_number: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_contract_number?: string | null
          description?: string | null
          estimated_cost?: number | null
          grand_total?: number | null
          hours?: number | null
          id?: string
          invoiced_to?: string | null
          is_no_cost?: boolean | null
          issued_by?: string | null
          issued_by_name?: string | null
          location?: string | null
          markup_percentage?: number | null
          profit_amount?: number | null
          profit_percentage?: number | null
          project_id?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          site_drawing?: string | null
          site_page?: string | null
          site_type?: string | null
          site_url?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_percentage?: number | null
          terms_and_conditions?: string | null
          title: string
          updated_at?: string
          work_order_number: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_contract_number?: string | null
          description?: string | null
          estimated_cost?: number | null
          grand_total?: number | null
          hours?: number | null
          id?: string
          invoiced_to?: string | null
          is_no_cost?: boolean | null
          issued_by?: string | null
          issued_by_name?: string | null
          location?: string | null
          markup_percentage?: number | null
          profit_amount?: number | null
          profit_percentage?: number | null
          project_id?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          site_drawing?: string | null
          site_page?: string | null
          site_type?: string | null
          site_url?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_percentage?: number | null
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workforce_attendance: {
        Row: {
          break_duration_minutes: number | null
          clock_in: string | null
          clock_out: string | null
          connecteam_timecard_id: string | null
          created_at: string
          employee_mapping_id: string
          employee_name: string
          employee_role: string | null
          id: string
          location_data: Json | null
          project_id: string | null
          status: string
          sync_date: string
          total_hours: number | null
          updated_at: string
          work_date: string
        }
        Insert: {
          break_duration_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          connecteam_timecard_id?: string | null
          created_at?: string
          employee_mapping_id: string
          employee_name: string
          employee_role?: string | null
          id?: string
          location_data?: Json | null
          project_id?: string | null
          status?: string
          sync_date?: string
          total_hours?: number | null
          updated_at?: string
          work_date: string
        }
        Update: {
          break_duration_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          connecteam_timecard_id?: string | null
          created_at?: string
          employee_mapping_id?: string
          employee_name?: string
          employee_role?: string | null
          id?: string
          location_data?: Json | null
          project_id?: string | null
          status?: string
          sync_date?: string
          total_hours?: number | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workforce_attendance_employee_mapping_id_fkey"
            columns: ["employee_mapping_id"]
            isOneToOne: false
            referencedRelation: "employee_mapping"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workforce_attendance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workforce_messages: {
        Row: {
          attachments: Json | null
          author_employee_id: string | null
          author_name: string
          author_role: string | null
          channel_name: string | null
          connecteam_message_id: string | null
          created_at: string
          id: string
          is_important: boolean | null
          message_text: string
          message_type: string
          sync_date: string
          timestamp: string
        }
        Insert: {
          attachments?: Json | null
          author_employee_id?: string | null
          author_name: string
          author_role?: string | null
          channel_name?: string | null
          connecteam_message_id?: string | null
          created_at?: string
          id?: string
          is_important?: boolean | null
          message_text: string
          message_type?: string
          sync_date?: string
          timestamp: string
        }
        Update: {
          attachments?: Json | null
          author_employee_id?: string | null
          author_name?: string
          author_role?: string | null
          channel_name?: string | null
          connecteam_message_id?: string | null
          created_at?: string
          id?: string
          is_important?: boolean | null
          message_text?: string
          message_type?: string
          sync_date?: string
          timestamp?: string
        }
        Relationships: []
      }
      workforce_schedules: {
        Row: {
          assigned_date: string
          connecteam_schedule_id: string | null
          created_at: string
          employee_mapping_id: string
          employee_name: string
          employee_role: string | null
          id: string
          project_id: string | null
          scheduled_hours: number | null
          shift_description: string | null
          shift_end: string
          shift_start: string
          shift_title: string | null
          status: string
          sync_date: string
          updated_at: string
        }
        Insert: {
          assigned_date: string
          connecteam_schedule_id?: string | null
          created_at?: string
          employee_mapping_id: string
          employee_name: string
          employee_role?: string | null
          id?: string
          project_id?: string | null
          scheduled_hours?: number | null
          shift_description?: string | null
          shift_end: string
          shift_start: string
          shift_title?: string | null
          status?: string
          sync_date?: string
          updated_at?: string
        }
        Update: {
          assigned_date?: string
          connecteam_schedule_id?: string | null
          created_at?: string
          employee_mapping_id?: string
          employee_name?: string
          employee_role?: string | null
          id?: string
          project_id?: string | null
          scheduled_hours?: number | null
          shift_description?: string | null
          shift_end?: string
          shift_start?: string
          shift_title?: string | null
          status?: string
          sync_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workforce_schedules_employee_mapping_id_fkey"
            columns: ["employee_mapping_id"]
            isOneToOne: false
            referencedRelation: "employee_mapping"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workforce_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      missed_opportunities: {
        Row: {
          assistant_response: string | null
          created_at: string | null
          engagement_level: string | null
          interest_score: number | null
          page_views: number | null
          session_id: string | null
          total_time_seconds: number | null
          user_message: string | null
        }
        Relationships: []
      }
      v_business_config: {
        Row: {
          accent_color: string | null
          address: string | null
          business_id: string | null
          business_name: string | null
          business_slug: string | null
          city: string | null
          description: string | null
          email: string | null
          favicon_url: string | null
          google_average_rating: number | null
          google_place_id: string | null
          google_total_reviews: number | null
          hero_cta_primary: string | null
          hero_cta_secondary: string | null
          hero_headline: string | null
          hero_highlight: string | null
          hero_image_url: string | null
          hero_subheadline: string | null
          hero_video_url: string | null
          hours: string | null
          license_number: string | null
          logo_dark_url: string | null
          logo_url: string | null
          owner_bio: string | null
          owner_name: string | null
          owner_photo_url: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          state: string | null
          tagline: string | null
          years_in_business: number | null
          zip: string | null
        }
        Relationships: []
      }
      v_crm_phase_counts: {
        Row: {
          customer_count: number | null
          phase_id: string | null
          phase_name: string | null
          phase_order: number | null
        }
        Relationships: []
      }
      v_crm_progress: {
        Row: {
          assigned_to: string | null
          assigned_user_email: string | null
          completed_at: string | null
          created_at: string | null
          current_phase_name: string | null
          current_phase_order: number | null
          current_step_name: string | null
          current_step_order: number | null
          customer_id: string | null
          lead_email: string | null
          lead_name: string | null
          lead_phone: string | null
          lead_source: string | null
          lead_status: string | null
          pct: number | null
          progress_id: string | null
          service_needed: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          workflow_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_customer_progress_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_all_employee_scores: { Args: never; Returns: number }
      calculate_correction_adjustments: {
        Args: { corrected: Json; original: Json }
        Returns: Json
      }
      calculate_employee_score: { Args: { p_user_id: string }; Returns: Json }
      calculate_project_labor_cost: {
        Args: { p_from_date?: string; p_project_id: string; p_to_date?: string }
        Returns: {
          overtime_hours: number
          regular_hours: number
          total_hours: number
          total_labor_cost: number
        }[]
      }
      check_user_admin_or_owner: { Args: never; Returns: boolean }
      check_user_assigned_to_project: {
        Args: { project_id_param: string }
        Returns: boolean
      }
      check_user_is_sales: { Args: never; Returns: boolean }
      cleanup_expired_invitations: { Args: never; Returns: undefined }
      cleanup_expired_invite_tokens: { Args: never; Returns: undefined }
      create_project_invitation: {
        Args: { p_customer_email: string; p_project_id: string }
        Returns: string
      }
      crm_move_customer: {
        Args: { p_lead_id: string; p_phase_name: string; p_step_name?: string }
        Returns: boolean
      }
      generate_agreement_number: { Args: never; Returns: string }
      generate_bid_number: { Args: never; Returns: string }
      generate_estimate_number: { Args: never; Returns: string }
      generate_invitation_token: { Args: never; Returns: string }
      generate_invite_token: { Args: never; Returns: string }
      generate_quote_number: { Args: never; Returns: string }
      generate_secure_invite_token: { Args: never; Returns: string }
      generate_service_ticket_token: {
        Args: { p_ticket_id: string }
        Returns: string
      }
      generate_ticket_number: { Args: never; Returns: string }
      get_current_business_id: { Args: never; Returns: string }
      get_or_create_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_team_members: {
        Args: { page?: number; page_size?: number; q?: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          invited_at: string
          last_login_at: string
          phone_number: string
          role: string
          role_label: string
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      get_unread_feedback_count: {
        Args: { p_project_id: string }
        Returns: number
      }
      get_user_phone: { Args: { user_id_param: string }; Returns: string }
      initialize_contributor_scores: { Args: never; Returns: number }
      is_active_team_member: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_team_admin: { Args: never; Returns: boolean }
      mark_feedback_as_read: {
        Args: { p_feedback_id: string }
        Returns: undefined
      }
      migrate_before_after_to_current_proposed: {
        Args: never
        Returns: undefined
      }
      pin_message: {
        Args: { chat_id: string; message_id: string }
        Returns: undefined
      }
      recover_missed_leads: { Args: never; Returns: number }
      send_project_invitation: {
        Args: { customer_email_param: string; project_id_param: string }
        Returns: undefined
      }
      submit_quote_request: {
        Args: {
          p_email: string
          p_name: string
          p_notes?: string
          p_phone?: string
          p_project_type?: string
          p_property_address?: string
          p_property_type?: string
          p_timeline?: string
        }
        Returns: string
      }
      user_has_role: {
        Args: { required_role: string; user_uuid: string }
        Returns: boolean
      }
      validate_invitation_token: {
        Args: { token_value: string }
        Returns: {
          email: string
          full_name: string
          invited_by: string
          role: string
          status: string
          token_expires_at: string
          user_id: string
        }[]
      }
    }
    Enums: {
      blog_category:
        | "Metal Roofing"
        | "Installation Tips"
        | "Maintenance"
        | "Commercial Projects"
        | "Residential Projects"
        | "Industry News"
      edge_label:
        | "EAVE"
        | "RAKE"
        | "RIDGE"
        | "HIP"
        | "VALLEY"
        | "STEP"
        | "WALL"
        | "PITCH_CHANGE"
      lead_status_new:
        | "new"
        | "qualified"
        | "contacted"
        | "estimate_scheduled"
        | "proposal_sent"
        | "closed_won"
        | "closed_lost"
        | "nurturing"
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
      blog_category: [
        "Metal Roofing",
        "Installation Tips",
        "Maintenance",
        "Commercial Projects",
        "Residential Projects",
        "Industry News",
      ],
      edge_label: [
        "EAVE",
        "RAKE",
        "RIDGE",
        "HIP",
        "VALLEY",
        "STEP",
        "WALL",
        "PITCH_CHANGE",
      ],
      lead_status_new: [
        "new",
        "qualified",
        "contacted",
        "estimate_scheduled",
        "proposal_sent",
        "closed_won",
        "closed_lost",
        "nurturing",
      ],
    },
  },
} as const
