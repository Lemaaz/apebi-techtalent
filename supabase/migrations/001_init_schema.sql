-- ============================================================
-- APEBI TechTalent — Migration 001 : Schéma initial
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DOMAINS (référentiel 6 domaines C5)
-- ============================================================
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  description_fr text,
  icon text,
  color text
);

-- ============================================================
-- SKILLS (référentiel compétences)
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_en text,
  category text,
  is_active boolean DEFAULT true
);

-- ============================================================
-- COMPANY PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  culture text,
  logo_url text,
  banner_url text,
  website_url text,
  linkedin_url text,
  sector text NOT NULL DEFAULT '',
  company_size text CHECK (company_size IN ('1-10','11-50','51-200','201-500','500+')),
  founded_year integer,
  city text,
  country text DEFAULT 'Maroc',
  apebi_member_since date,
  apebi_member_id text,
  has_techtalent_label boolean DEFAULT false,
  label_valid_until date,
  validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending','approved','rejected')),
  validation_note text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- COMPANY MEMBERS (recruteurs liés à une entreprise)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  role_in_company text DEFAULT 'Recruiter' CHECK (role_in_company IN ('Owner','Admin','Recruiter')),
  full_name text NOT NULL,
  job_title text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- ============================================================
-- TALENT PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS talent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  title text,
  bio text CHECK (char_length(bio) <= 500),
  avatar_url text,
  city text,
  country text DEFAULT 'Maroc',
  linkedin_url text,
  github_url text,
  portfolio_url text,
  years_experience integer CHECK (years_experience >= 0 AND years_experience <= 50),
  seniority_level text CHECK (seniority_level IN ('Junior','Mid','Senior','Lead','Expert')),
  availability text CHECK (availability IN ('Immédiate','1 mois','3 mois','Non disponible')),
  job_type text[],
  remote_preference text CHECK (remote_preference IN ('Full remote','Hybride','Présentiel')),
  expected_salary_range text,
  visibility boolean DEFAULT false,
  completeness_score integer DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending','approved','rejected')),
  validation_note text,
  linkedin_imported_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- EXPERIENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  location text
);

-- ============================================================
-- EDUCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text,
  field text,
  start_year integer,
  end_year integer,
  is_apebi_labeled boolean DEFAULT false
);

-- ============================================================
-- TALENT SKILLS (jointure many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS talent_skills (
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level text CHECK (level IN ('Débutant','Intermédiaire','Avancé','Expert')),
  PRIMARY KEY (talent_id, skill_id)
);

-- ============================================================
-- JOB POSTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('CDI','CDD','Freelance','Stage','Alternance')),
  seniority_level text CHECK (seniority_level IN ('Junior','Mid','Senior','Lead')),
  city text,
  remote_policy text CHECK (remote_policy IN ('Full remote','Hybride','Présentiel')),
  salary_range text,
  domain_id uuid REFERENCES domains(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft','pending','active','closed','rejected')),
  closes_at date,
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- ============================================================
-- JOB SKILLS (jointure many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_skills (
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  is_required boolean DEFAULT true,
  PRIMARY KEY (job_id, skill_id)
);

-- ============================================================
-- APPLICATIONS (candidatures)
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  cover_letter text CHECK (char_length(cover_letter) <= 1000),
  cv_url text,
  status text DEFAULT 'sent' CHECK (status IN ('sent','viewed','shortlisted','rejected','accepted')),
  recruiter_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, talent_id)
);

-- ============================================================
-- SAVED JOBS (offres sauvegardées)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  PRIMARY KEY (talent_id, job_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_talent_profiles_status ON talent_profiles(validation_status);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_visibility ON talent_profiles(visibility);
CREATE INDEX IF NOT EXISTS idx_company_profiles_status ON company_profiles(validation_status);
CREATE INDEX IF NOT EXISTS idx_company_profiles_slug ON company_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_talent ON applications(talent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_talent_profiles_updated_at
  BEFORE UPDATE ON talent_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
