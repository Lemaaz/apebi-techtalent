-- ============================================================
-- APEBI TechTalent — Migration 011 : Bucket Supabase Storage "resumes"
-- ============================================================
-- Crée le bucket public "resumes" pour les CV PDF des talents (TAL-12).
-- Les buckets "avatars" et "logos" sont supposés déjà créés via le dashboard.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  5242880,  -- 5 Mo
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS sur storage.objects : les talents ne peuvent lire/écrire que leur propre dossier
-- (le chemin est structuré comme {user_id}/{timestamp}.pdf)

CREATE POLICY "talent_upload_own_resume"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "talent_update_own_resume"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Lecture publique (le bucket est public — les recruteurs peuvent télécharger le CV)
CREATE POLICY "public_read_resumes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes');
