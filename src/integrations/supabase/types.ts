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
      brands: {
        Row: {
          created_at: string
          default_market: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          vertical: string
        }
        Insert: {
          created_at?: string
          default_market?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          vertical?: string
        }
        Update: {
          created_at?: string
          default_market?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          vertical?: string
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          changes: Json | null
          created_at: string
          decided_at: string | null
          decided_by_name: string | null
          decision_note: string | null
          id: string
          locked_version_id: string | null
          new_scan_id: string
          product_key: string
          product_name: string | null
          promote_to_locked: boolean | null
          status: string
        }
        Insert: {
          changes?: Json | null
          created_at?: string
          decided_at?: string | null
          decided_by_name?: string | null
          decision_note?: string | null
          id?: string
          locked_version_id?: string | null
          new_scan_id: string
          product_key: string
          product_name?: string | null
          promote_to_locked?: boolean | null
          status?: string
        }
        Update: {
          changes?: Json | null
          created_at?: string
          decided_at?: string | null
          decided_by_name?: string | null
          decision_note?: string | null
          id?: string
          locked_version_id?: string | null
          new_scan_id?: string
          product_key?: string
          product_name?: string | null
          promote_to_locked?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_locked_version_id_fkey"
            columns: ["locked_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      early_access_signups: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          name: string
          product_category: string
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          id?: string
          name: string
          product_category: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          product_category?: string
        }
        Relationships: []
      }
      generated_labels: {
        Row: {
          alcohol_abv: number | null
          allergens: string | null
          batch_number: string | null
          best_before: string | null
          brand_name: string | null
          category: string | null
          certifications: string | null
          compliance_score: number
          country_of_origin: string | null
          created_at: string
          date_type: string | null
          id: string
          ingredients: string | null
          irradiated: boolean | null
          lead_id: string | null
          nano: boolean | null
          net_quantity: string | null
          nutrition_json: Json | null
          pack: string | null
          packaged_protective_atmosphere: boolean | null
          preview_text: string | null
          product_name: string | null
          quid_percent: string | null
          responsible_person: string | null
          storage_instructions: string | null
          warnings_json: Json | null
        }
        Insert: {
          alcohol_abv?: number | null
          allergens?: string | null
          batch_number?: string | null
          best_before?: string | null
          brand_name?: string | null
          category?: string | null
          certifications?: string | null
          compliance_score?: number
          country_of_origin?: string | null
          created_at?: string
          date_type?: string | null
          id?: string
          ingredients?: string | null
          irradiated?: boolean | null
          lead_id?: string | null
          nano?: boolean | null
          net_quantity?: string | null
          nutrition_json?: Json | null
          pack?: string | null
          packaged_protective_atmosphere?: boolean | null
          preview_text?: string | null
          product_name?: string | null
          quid_percent?: string | null
          responsible_person?: string | null
          storage_instructions?: string | null
          warnings_json?: Json | null
        }
        Update: {
          alcohol_abv?: number | null
          allergens?: string | null
          batch_number?: string | null
          best_before?: string | null
          brand_name?: string | null
          category?: string | null
          certifications?: string | null
          compliance_score?: number
          country_of_origin?: string | null
          created_at?: string
          date_type?: string | null
          id?: string
          ingredients?: string | null
          irradiated?: boolean | null
          lead_id?: string | null
          nano?: boolean | null
          net_quantity?: string | null
          nutrition_json?: Json | null
          pack?: string | null
          packaged_protective_atmosphere?: boolean | null
          preview_text?: string | null
          product_name?: string | null
          quid_percent?: string | null
          responsible_person?: string | null
          storage_instructions?: string | null
          warnings_json?: Json | null
        }
        Relationships: []
      }
      lead_clicks: {
        Row: {
          created_at: string
          id: string
          landing_path: string
          lead_id: string | null
          raw_query: string | null
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          landing_path: string
          lead_id?: string | null
          raw_query?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          landing_path?: string
          lead_id?: string | null
          raw_query?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      product_versions: {
        Row: {
          approved_at: string
          approved_by_name: string | null
          approved_note: string | null
          archived_at: string | null
          archived_reason: string | null
          created_at: string
          id: string
          product_key: string
          product_name: string | null
          scan_id: string
          status: string
          version_number: number
        }
        Insert: {
          approved_at?: string
          approved_by_name?: string | null
          approved_note?: string | null
          archived_at?: string | null
          archived_reason?: string | null
          created_at?: string
          id?: string
          product_key: string
          product_name?: string | null
          scan_id: string
          status?: string
          version_number: number
        }
        Update: {
          approved_at?: string
          approved_by_name?: string | null
          approved_note?: string | null
          archived_at?: string | null
          archived_reason?: string | null
          created_at?: string
          id?: string
          product_key?: string
          product_name?: string | null
          scan_id?: string
          status?: string
          version_number?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: string
          category: string | null
          created_at: string
          id: string
          is_seasonal: boolean
          label_status: string
          label_types: string[]
          label_version: string | null
          launch_date: string | null
          material_data: Json
          name: string
          product_key: string
          season_tag: string | null
          sku: string | null
          supplier_id: string | null
          thumbnail: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          category?: string | null
          created_at?: string
          id?: string
          is_seasonal?: boolean
          label_status?: string
          label_types?: string[]
          label_version?: string | null
          launch_date?: string | null
          material_data?: Json
          name: string
          product_key: string
          season_tag?: string | null
          sku?: string | null
          supplier_id?: string | null
          thumbnail?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category?: string | null
          created_at?: string
          id?: string
          is_seasonal?: boolean
          label_status?: string
          label_types?: string[]
          label_version?: string | null
          launch_date?: string | null
          material_data?: Json
          name?: string
          product_key?: string
          season_tag?: string | null
          sku?: string | null
          supplier_id?: string | null
          thumbnail?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          category: string | null
          changes_detected: Json | null
          compared_to_scan_id: string | null
          created_at: string
          fields: Json
          file_name: string
          file_path: string | null
          found_count: number
          id: string
          is_seasonal: boolean
          lead_id: string | null
          market: string | null
          mime_type: string | null
          needs_attention_count: number
          product_key: string | null
          product_name: string | null
          referrer: string | null
          season_tag: string | null
          total_count: number
          user_agent: string | null
        }
        Insert: {
          category?: string | null
          changes_detected?: Json | null
          compared_to_scan_id?: string | null
          created_at?: string
          fields?: Json
          file_name: string
          file_path?: string | null
          found_count?: number
          id?: string
          is_seasonal?: boolean
          lead_id?: string | null
          market?: string | null
          mime_type?: string | null
          needs_attention_count?: number
          product_key?: string | null
          product_name?: string | null
          referrer?: string | null
          season_tag?: string | null
          total_count?: number
          user_agent?: string | null
        }
        Update: {
          category?: string | null
          changes_detected?: Json | null
          compared_to_scan_id?: string | null
          created_at?: string
          fields?: Json
          file_name?: string
          file_path?: string | null
          found_count?: number
          id?: string
          is_seasonal?: boolean
          lead_id?: string | null
          market?: string | null
          mime_type?: string | null
          needs_attention_count?: number
          product_key?: string | null
          product_name?: string | null
          referrer?: string | null
          season_tag?: string | null
          total_count?: number
          user_agent?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          last_activity_at: string
          name: string
          notes: string | null
          verification_score: number
          verification_status: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          last_activity_at?: string
          name: string
          notes?: string | null
          verification_score?: number
          verification_status?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          name?: string
          notes?: string | null
          verification_score?: number
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
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
  public: {
    Enums: {},
  },
} as const
