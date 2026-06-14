// Auto-généré via: supabase gen types typescript --project-id [ref] > src/types/database.ts
// Pour l'instant : types manuels alignés sur DATA_DICTIONARY.md

export type UserRole = 'TALENT' | 'RECRUITER' | 'PARTNER' | 'ADMIN'
export type ValidationStatus = 'pending' | 'approved' | 'rejected'
export type ApplicationStatus = 'sent' | 'viewed' | 'shortlisted' | 'rejected' | 'accepted'
export type JobStatus = 'draft' | 'pending' | 'active' | 'closed' | 'rejected'
export type ContractType = 'CDI' | 'CDD' | 'Freelance' | 'Stage' | 'Alternance'
export type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Expert'
export type RemotePolicy = 'Full remote' | 'Hybride' | 'Présentiel'
export type SkillLevel = 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert'
export type Availability = 'Immédiate' | '1 mois' | '3 mois' | 'Non disponible'

export interface TalentProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  title?: string
  bio?: string
  avatar_url?: string
  city?: string
  country: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  years_experience?: number
  seniority_level?: SeniorityLevel
  availability?: Availability
  job_type?: ContractType[]
  remote_preference?: RemotePolicy
  expected_salary_range?: string
  visibility: boolean
  completeness_score: number
  validation_status: ValidationStatus
  validation_note?: string
  linkedin_imported_at?: string
  created_at: string
  updated_at: string
}

export interface CompanyProfile {
  id: string
  name: string
  slug: string
  description?: string
  culture?: string
  logo_url?: string
  banner_url?: string
  website_url?: string
  linkedin_url?: string
  sector: string
  company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '500+'
  founded_year?: number
  city?: string
  country: string
  apebi_member_since?: string
  apebi_member_id?: string
  has_techtalent_label: boolean
  label_valid_until?: string
  validation_status: ValidationStatus
  validation_note?: string
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface JobPosting {
  id: string
  company_id: string
  created_by: string
  title: string
  slug: string
  description: string
  contract_type: ContractType
  seniority_level?: SeniorityLevel
  city?: string
  remote_policy?: RemotePolicy
  salary_range?: string
  domain_id?: string
  status: JobStatus
  closes_at?: string
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
  published_at?: string
  company?: CompanyProfile
}

export interface Application {
  id: string
  job_id: string
  talent_id: string
  cover_letter?: string
  cv_url?: string
  status: ApplicationStatus
  recruiter_note?: string
  created_at: string
  updated_at: string
  job?: JobPosting
  talent?: TalentProfile
}

export interface Domain {
  id: string
  code: string
  name_fr: string
  name_en: string
  description_fr?: string
  icon?: string
  color?: string
}

export interface Skill {
  id: string
  domain_id: string
  name: string
  name_en?: string
  category?: string
  is_active: boolean
  domain?: Domain
}

export type Database = {
  public: {
    Tables: {
      talent_profiles: { Row: TalentProfile; Insert: Partial<TalentProfile>; Update: Partial<TalentProfile> }
      company_profiles: { Row: CompanyProfile; Insert: Partial<CompanyProfile>; Update: Partial<CompanyProfile> }
      job_postings: { Row: JobPosting; Insert: Partial<JobPosting>; Update: Partial<JobPosting> }
      applications: { Row: Application; Insert: Partial<Application>; Update: Partial<Application> }
      domains: { Row: Domain; Insert: Partial<Domain>; Update: Partial<Domain> }
      skills: { Row: Skill; Insert: Partial<Skill>; Update: Partial<Skill> }
    }
  }
}
