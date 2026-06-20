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
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string | null
          cv_url: string | null
          id: string
          job_id: string
          recruiter_note: string | null
          status: string | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string | null
          cv_url?: string | null
          id?: string
          job_id: string
          recruiter_note?: string | null
          status?: string | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          cover_letter?: string | null
          created_at?: string | null
          cv_url?: string | null
          id?: string
          job_id?: string
          recruiter_note?: string | null
          status?: string | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string | null
          full_name: string
          id: string
          job_title: string | null
          role_in_company: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          role_in_company?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          role_in_company?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          apebi_member_id: string | null
          apebi_member_since: string | null
          banner_url: string | null
          city: string | null
          company_size: string | null
          country: string | null
          created_at: string | null
          culture: string | null
          description: string | null
          founded_year: number | null
          has_techtalent_label: boolean | null
          id: string
          is_featured: boolean | null
          label_valid_until: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          sector: string
          slug: string
          updated_at: string | null
          validation_note: string | null
          validation_status: string | null
          website_url: string | null
        }
        Insert: {
          apebi_member_id?: string | null
          apebi_member_since?: string | null
          banner_url?: string | null
          city?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          culture?: string | null
          description?: string | null
          founded_year?: number | null
          has_techtalent_label?: boolean | null
          id?: string
          is_featured?: boolean | null
          label_valid_until?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          sector?: string
          slug: string
          updated_at?: string | null
          validation_note?: string | null
          validation_status?: string | null
          website_url?: string | null
        }
        Update: {
          apebi_member_id?: string | null
          apebi_member_since?: string | null
          banner_url?: string | null
          city?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          culture?: string | null
          description?: string | null
          founded_year?: number | null
          has_techtalent_label?: boolean | null
          id?: string
          is_featured?: boolean | null
          label_valid_until?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          sector?: string
          slug?: string
          updated_at?: string | null
          validation_note?: string | null
          validation_status?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      domains: {
        Row: {
          code: string
          color: string | null
          description_fr: string | null
          icon: string | null
          id: string
          name_en: string
          name_fr: string
        }
        Insert: {
          code: string
          color?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          name_en: string
          name_fr: string
        }
        Update: {
          code?: string
          color?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          name_en?: string
          name_fr?: string
        }
        Relationships: []
      }
      educations: {
        Row: {
          degree: string | null
          end_year: number | null
          field: string | null
          id: string
          institution: string
          is_apebi_labeled: boolean | null
          start_year: number | null
          talent_id: string
        }
        Insert: {
          degree?: string | null
          end_year?: number | null
          field?: string | null
          id?: string
          institution: string
          is_apebi_labeled?: boolean | null
          start_year?: number | null
          talent_id: string
        }
        Update: {
          degree?: string | null
          end_year?: number | null
          field?: string | null
          id?: string
          institution?: string
          is_apebi_labeled?: boolean | null
          start_year?: number | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "educations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          company_name: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          start_date: string
          talent_id: string
          title: string
        }
        Insert: {
          company_name: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date: string
          talent_id: string
          title: string
        }
        Update: {
          company_name?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date?: string
          talent_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          applications_count: number | null
          city: string | null
          closes_at: string | null
          company_id: string
          contract_type: string
          created_at: string | null
          created_by: string
          description: string
          domain_id: string | null
          id: string
          published_at: string | null
          remote_policy: string | null
          salary_range: string | null
          seniority_level: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          applications_count?: number | null
          city?: string | null
          closes_at?: string | null
          company_id: string
          contract_type: string
          created_at?: string | null
          created_by: string
          description: string
          domain_id?: string | null
          id?: string
          published_at?: string | null
          remote_policy?: string | null
          salary_range?: string | null
          seniority_level?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          applications_count?: number | null
          city?: string | null
          closes_at?: string | null
          company_id?: string
          contract_type?: string
          created_at?: string | null
          created_by?: string
          description?: string
          domain_id?: string | null
          id?: string
          published_at?: string | null
          remote_policy?: string | null
          salary_range?: string | null
          seniority_level?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skills: {
        Row: {
          is_required: boolean | null
          job_id: string
          skill_id: string
        }
        Insert: {
          is_required?: boolean | null
          job_id: string
          skill_id: string
        }
        Update: {
          is_required?: boolean | null
          job_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          job_id: string
          saved_at: string | null
          talent_id: string
        }
        Insert: {
          job_id: string
          saved_at?: string | null
          talent_id: string
        }
        Update: {
          job_id?: string
          saved_at?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          domain_id: string
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
        }
        Insert: {
          category?: string | null
          domain_id: string
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
        }
        Update: {
          category?: string | null
          domain_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          completeness_score: number | null
          country: string | null
          created_at: string | null
          expected_salary_range: string | null
          first_name: string
          github_url: string | null
          id: string
          job_type: string[] | null
          last_name: string
          linkedin_imported_at: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          remote_preference: string | null
          seniority_level: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          validation_note: string | null
          validation_status: string | null
          visibility: boolean | null
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          completeness_score?: number | null
          country?: string | null
          created_at?: string | null
          expected_salary_range?: string | null
          first_name: string
          github_url?: string | null
          id?: string
          job_type?: string[] | null
          last_name: string
          linkedin_imported_at?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          remote_preference?: string | null
          seniority_level?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          validation_note?: string | null
          validation_status?: string | null
          visibility?: boolean | null
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          completeness_score?: number | null
          country?: string | null
          created_at?: string | null
          expected_salary_range?: string | null
          first_name?: string
          github_url?: string | null
          id?: string
          job_type?: string[] | null
          last_name?: string
          linkedin_imported_at?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          remote_preference?: string | null
          seniority_level?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          validation_note?: string | null
          validation_status?: string | null
          visibility?: boolean | null
          years_experience?: number | null
        }
        Relationships: []
      }
      talent_skills: {
        Row: {
          level: string | null
          skill_id: string
          talent_id: string
        }
        Insert: {
          level?: string | null
          skill_id: string
          talent_id: string
        }
        Update: {
          level?: string | null
          skill_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_skills_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_company_with_member: {
        Args: {
          p_apebi_member_since?: string
          p_city?: string
          p_company_size?: string
          p_contact_full_name?: string
          p_contact_role?: string
          p_description?: string
          p_linkedin_url?: string
          p_name: string
          p_sector: string
          p_slug: string
          p_website_url?: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_company_member: { Args: { company_uuid: string }; Returns: boolean }
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
