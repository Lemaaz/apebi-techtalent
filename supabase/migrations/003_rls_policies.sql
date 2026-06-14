-- ============================================================
-- APEBI TechTalent — Migration 003 : Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: is user admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: is user a recruiter for a given company
CREATE OR REPLACE FUNCTION is_company_member(company_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE user_id = auth.uid() AND company_id = company_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ── TALENT PROFILES ──────────────────────────────────────────
-- Owner can read/update their own profile
CREATE POLICY "talent_own_profile" ON talent_profiles
  FOR ALL USING (user_id = auth.uid());

-- Recruiters of approved companies can read approved+visible profiles
CREATE POLICY "recruiter_can_read_approved_talents" ON talent_profiles
  FOR SELECT USING (
    validation_status = 'approved' AND visibility = true
    AND EXISTS (
      SELECT 1 FROM company_members cm
      JOIN company_profiles cp ON cp.id = cm.company_id
      WHERE cm.user_id = auth.uid() AND cp.validation_status = 'approved'
    )
  );

-- Admin can do everything
CREATE POLICY "admin_all_talents" ON talent_profiles
  FOR ALL USING (is_admin());

-- ── COMPANY PROFILES ─────────────────────────────────────────
-- Public: anyone can read approved companies
CREATE POLICY "public_read_approved_companies" ON company_profiles
  FOR SELECT USING (validation_status = 'approved');

-- Company members can update their company
CREATE POLICY "members_update_company" ON company_profiles
  FOR UPDATE USING (is_company_member(id));

-- Admin can do everything
CREATE POLICY "admin_all_companies" ON company_profiles
  FOR ALL USING (is_admin());

-- ── COMPANY MEMBERS ───────────────────────────────────────────
CREATE POLICY "members_read_own" ON company_members
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "admin_all_members" ON company_members
  FOR ALL USING (is_admin());

-- ── JOB POSTINGS ─────────────────────────────────────────────
-- Public: anyone can read active jobs
CREATE POLICY "public_read_active_jobs" ON job_postings
  FOR SELECT USING (status = 'active');

-- Company members can CRUD their own company's jobs
CREATE POLICY "company_crud_jobs" ON job_postings
  FOR ALL USING (is_company_member(company_id));

-- Admin can do everything
CREATE POLICY "admin_all_jobs" ON job_postings
  FOR ALL USING (is_admin());

-- ── JOB SKILLS ───────────────────────────────────────────────
CREATE POLICY "public_read_job_skills" ON job_skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_postings WHERE id = job_id AND status = 'active')
  );

CREATE POLICY "company_crud_job_skills" ON job_skills
  FOR ALL USING (
    EXISTS (SELECT 1 FROM job_postings jp WHERE jp.id = job_id AND is_company_member(jp.company_id))
  );

-- ── APPLICATIONS ─────────────────────────────────────────────
-- Talent sees their own applications
CREATE POLICY "talent_own_applications" ON applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM talent_profiles WHERE id = talent_id AND user_id = auth.uid())
  );

-- Recruiter sees applications for their company's jobs
CREATE POLICY "recruiter_sees_applications" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_postings jp WHERE jp.id = job_id AND is_company_member(jp.company_id)
    )
  );

-- Recruiter can update status/note on applications
CREATE POLICY "recruiter_update_applications" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM job_postings jp WHERE jp.id = job_id AND is_company_member(jp.company_id)
    )
  );

-- Admin can do everything
CREATE POLICY "admin_all_applications" ON applications
  FOR ALL USING (is_admin());

-- ── EXPERIENCES & EDUCATIONS ─────────────────────────────────
CREATE POLICY "talent_own_experiences" ON experiences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM talent_profiles WHERE id = talent_id AND user_id = auth.uid())
  );

CREATE POLICY "talent_own_educations" ON educations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM talent_profiles WHERE id = talent_id AND user_id = auth.uid())
  );

-- ── TALENT SKILLS ─────────────────────────────────────────────
CREATE POLICY "talent_own_skills" ON talent_skills
  FOR ALL USING (
    EXISTS (SELECT 1 FROM talent_profiles WHERE id = talent_id AND user_id = auth.uid())
  );

-- ── SAVED JOBS ────────────────────────────────────────────────
CREATE POLICY "talent_saved_jobs" ON saved_jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM talent_profiles WHERE id = talent_id AND user_id = auth.uid())
  );

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE POLICY "user_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Domains and skills: public read
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_domains" ON domains FOR SELECT USING (true);
CREATE POLICY "public_read_skills" ON skills FOR SELECT USING (is_active = true);
CREATE POLICY "admin_manage_domains" ON domains FOR ALL USING (is_admin());
CREATE POLICY "admin_manage_skills" ON skills FOR ALL USING (is_admin());
