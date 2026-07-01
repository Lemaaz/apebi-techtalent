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
          notify_on_application: boolean
          role_in_company: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          notify_on_application?: boolean
          role_in_company?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          notify_on_application?: boolean
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
          label_qr_token: string | null
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
          label_qr_token?: string | null
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
          label_qr_token?: string | null
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
      funnel_events: {
        Row: {
          id: string
          event_type: string
          talent_id: string | null
          user_id: string | null
          job_id: string | null
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          talent_id?: string | null
          user_id?: string | null
          job_id?: string | null
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          talent_id?: string | null
          user_id?: string | null
          job_id?: string | null
          company_id?: string | null
          created_at?: string
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
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string
          date_debut: string
          date_fin: string | null
          description: string | null
          id: string
          image_url: string | null
          is_apebi_event: boolean | null
          lieu: string | null
          organisateur_company_id: string | null
          places_disponibles: number | null
          slug: string
          status: string | null
          title: string
          type_event: string | null
          updated_at: string | null
          url_inscription_externe: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          date_debut: string
          date_fin?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_apebi_event?: boolean | null
          lieu?: string | null
          organisateur_company_id?: string | null
          places_disponibles?: number | null
          slug: string
          status?: string | null
          title: string
          type_event?: string | null
          updated_at?: string | null
          url_inscription_externe?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_apebi_event?: boolean | null
          lieu?: string | null
          organisateur_company_id?: string | null
          places_disponibles?: number | null
          slug?: string
          status?: string | null
          title?: string
          type_event?: string | null
          updated_at?: string | null
          url_inscription_externe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organisateur_company_id_fkey"
            columns: ["organisateur_company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
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
          mission_duration: string | null
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
          mission_duration?: string | null
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
          mission_duration?: string | null
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
          {
            foreignKeyName: "job_postings_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "mv_domain_activity"
            referencedColumns: ["domain_id"]
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
            referencedRelation: "mv_skills_demand"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "mv_skills_supply"
            referencedColumns: ["skill_id"]
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
      label_applications: {
        Row: {
          applicant_type: string
          company_id: string | null
          created_at: string | null
          criteria_data: Json | null
          id: string
          notes_admin: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          submitted_at: string | null
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_type: string
          company_id?: string | null
          created_at?: string | null
          criteria_data?: Json | null
          id?: string
          notes_admin?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string | null
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_type?: string
          company_id?: string | null
          created_at?: string | null
          criteria_data?: Json | null
          id?: string
          notes_admin?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string | null
          talent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "label_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
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
      saved_talents: {
        Row: {
          company_id: string
          saved_at: string | null
          talent_id: string
        }
        Insert: {
          company_id: string
          saved_at?: string | null
          talent_id: string
        }
        Update: {
          company_id?: string
          saved_at?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_talents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_talents_talent_id_fkey"
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
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "mv_domain_activity"
            referencedColumns: ["domain_id"]
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
          cv_url: string | null
          expected_salary_range: string | null
          first_name: string
          github_url: string | null
          has_techtalent_label: boolean | null
          id: string
          job_type: string[] | null
          label_qr_token: string | null
          label_valid_until: string | null
          last_alerted_at: string | null
          last_name: string
          linkedin_imported_at: string | null
          linkedin_url: string | null
          mission_duration_weeks: number | null
          portfolio_url: string | null
          receive_alerts: boolean
          public_enabled: boolean
          public_token: string | null
          remote_preference: string | null
          seniority_level: string | null
          title: string | null
          tjm_max: number | null
          tjm_min: number | null
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
          cv_url?: string | null
          expected_salary_range?: string | null
          first_name: string
          github_url?: string | null
          has_techtalent_label?: boolean | null
          id?: string
          job_type?: string[] | null
          label_qr_token?: string | null
          label_valid_until?: string | null
          last_alerted_at?: string | null
          last_name: string
          linkedin_imported_at?: string | null
          linkedin_url?: string | null
          mission_duration_weeks?: number | null
          portfolio_url?: string | null
          receive_alerts?: boolean
          public_enabled?: boolean
          public_token?: string | null
          remote_preference?: string | null
          seniority_level?: string | null
          title?: string | null
          tjm_max?: number | null
          tjm_min?: number | null
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
          cv_url?: string | null
          expected_salary_range?: string | null
          first_name?: string
          github_url?: string | null
          has_techtalent_label?: boolean | null
          id?: string
          job_type?: string[] | null
          label_qr_token?: string | null
          label_valid_until?: string | null
          last_alerted_at?: string | null
          last_name?: string
          linkedin_imported_at?: string | null
          linkedin_url?: string | null
          mission_duration_weeks?: number | null
          portfolio_url?: string | null
          receive_alerts?: boolean
          public_enabled?: boolean
          public_token?: string | null
          remote_preference?: string | null
          seniority_level?: string | null
          title?: string | null
          tjm_max?: number | null
          tjm_min?: number | null
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
            referencedRelation: "mv_skills_demand"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "talent_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "mv_skills_supply"
            referencedColumns: ["skill_id"]
          },
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
      training_institutions: {
        Row: {
          city: string | null
          created_at: string | null
          description: string | null
          id: string
          is_apebi_partner: boolean | null
          logo_url: string | null
          name: string
          slug: string
          status: string | null
          type: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_apebi_partner?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          status?: string | null
          type?: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_apebi_partner?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          status?: string | null
          type?: string
          website_url?: string | null
        }
        Relationships: []
      }
      training_programs: {
        Row: {
          created_at: string | null
          description: string | null
          domain_id: string | null
          duration_text: string | null
          id: string
          institution_id: string | null
          is_featured: boolean | null
          level: string | null
          modality: string | null
          price_range: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          url_inscription: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain_id?: string | null
          duration_text?: string | null
          id?: string
          institution_id?: string | null
          is_featured?: boolean | null
          level?: string | null
          modality?: string | null
          price_range?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          url_inscription?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain_id?: string | null
          duration_text?: string | null
          id?: string
          institution_id?: string | null
          is_featured?: boolean | null
          level?: string | null
          modality?: string | null
          price_range?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          url_inscription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "mv_domain_activity"
            referencedColumns: ["domain_id"]
          },
          {
            foreignKeyName: "training_programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "training_institutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_domain_activity: {
        Row: {
          active_jobs: number | null
          approved_talents: number | null
          code: string | null
          domain_id: string | null
          name_en: string | null
          name_fr: string | null
        }
        Relationships: []
      }
      mv_geo_distribution: {
        Row: {
          city: string | null
          city_key: string | null
          talent_count: number | null
        }
        Relationships: []
      }
      mv_skills_demand: {
        Row: {
          demand_count: number | null
          domain_code: string | null
          domain_id: string | null
          name: string | null
          name_en: string | null
          skill_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "mv_domain_activity"
            referencedColumns: ["domain_id"]
          },
        ]
      }
      mv_skills_supply: {
        Row: {
          domain_code: string | null
          domain_id: string | null
          name: string | null
          name_en: string | null
          skill_id: string | null
          supply_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "mv_domain_activity"
            referencedColumns: ["domain_id"]
          },
        ]
      }
    }
    Functions: {
      calculate_completeness_score: {
        Args: { p_talent_id: string }
        Returns: number
      }
      close_expired_job_postings: { Args: never; Returns: number }
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
      funnel_event_counts: {
        Args: Record<string, never>
        Returns: Array<{ event_type: string; cnt: number }>
      }
      increment_matching_quota: { Args: { p_user_id: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_company_member: { Args: { company_uuid: string }; Returns: boolean }
      refresh_observatoire: { Args: never; Returns: undefined }
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
