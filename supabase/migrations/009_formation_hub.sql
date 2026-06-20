-- ============================================================
-- APEBI TechTalent — Migration 009 : Formation Hub (V2)
-- ============================================================
-- Dimension 5 du scope élargi : "le F de Formation & Talent".
-- Deux tables : training_institutions (partenaires) + training_programs (catalogue).
-- Source de vérité : saisie admin C5 + auto-saisie institutions (V2.1).
-- ============================================================

-- ── TRAINING INSTITUTIONS : écoles / bootcamps / organismes ──
CREATE TABLE IF NOT EXISTS training_institutions (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text    NOT NULL,
  slug        text    UNIQUE NOT NULL,
  type        text    NOT NULL DEFAULT 'autre'
    CHECK (type IN ('ecole','bootcamp','universite','certification','autre')),
  description text,
  logo_url    text,
  website_url text,
  city        text,
  is_apebi_partner boolean DEFAULT false,
  status      text    DEFAULT 'active' CHECK (status IN ('active','draft')),
  created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE training_institutions IS 'Écoles, bootcamps et organismes de formation partenaires APEBI.';
COMMENT ON COLUMN training_institutions.is_apebi_partner IS 'true = établissement labellisé partenaire officiel APEBI.';

-- ── TRAINING PROGRAMS : catalogue de formations ───────────────
CREATE TABLE IF NOT EXISTS training_programs (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text    NOT NULL,
  slug            text    UNIQUE NOT NULL,
  description     text,
  institution_id  uuid    REFERENCES training_institutions(id) ON DELETE SET NULL,
  domain_id       uuid    REFERENCES domains(id) ON DELETE SET NULL,
  level           text    DEFAULT 'Tous niveaux'
    CHECK (level IN ('Débutant','Intermédiaire','Avancé','Tous niveaux')),
  modality        text    DEFAULT 'Présentiel'
    CHECK (modality IN ('Présentiel','Online','Hybride')),
  duration_text   text,      -- "3 mois", "40h", "6 semaines"
  price_range     text,      -- "Gratuit", "5 000–10 000 MAD"
  url_inscription text,
  is_featured     boolean DEFAULT false,
  status          text    DEFAULT 'active'
    CHECK (status IN ('active','draft','archived')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

COMMENT ON TABLE training_programs IS 'Catalogue des formations tech disponibles dans l''écosystème APEBI.';

-- Index
CREATE INDEX IF NOT EXISTS idx_training_programs_domain       ON training_programs(domain_id)       WHERE domain_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_programs_institution  ON training_programs(institution_id)  WHERE institution_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_programs_status       ON training_programs(status);
CREATE INDEX IF NOT EXISTS idx_training_programs_featured     ON training_programs(is_featured)     WHERE is_featured = true;

-- updated_at trigger
CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON training_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE training_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs     ENABLE ROW LEVEL SECURITY;

-- Lecture publique (données non sensibles)
CREATE POLICY "public_read_active_institutions" ON training_institutions
  FOR SELECT USING (status = 'active');

CREATE POLICY "public_read_active_programs" ON training_programs
  FOR SELECT USING (status = 'active');

-- Admin : accès complet
CREATE POLICY "admin_all_institutions" ON training_institutions
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all_programs" ON training_programs
  FOR ALL USING (is_admin());

-- ── SEED : quelques institutions et formations de démonstration ──
-- (Données fictives — à remplacer par la saisie admin C5)

-- Institutions
INSERT INTO training_institutions (name, slug, type, description, city, website_url, is_apebi_partner, status) VALUES
  ('EMSI', 'emsi', 'ecole', 'École Marocaine des Sciences de l''Ingénieur — formation en génie informatique, réseaux et systèmes embarqués.', 'Casablanca', 'https://www.emsi.ma', true, 'active'),
  ('ESIG', 'esig', 'ecole', 'École Supérieure d''Ingénierie et de Gestion — spécialisée en systèmes d''information et cybersécurité.', 'Rabat', 'https://www.esig.ac.ma', true, 'active'),
  ('YouCode', 'youcode', 'bootcamp', 'Bootcamp tech intensif (UM6P × OCP) — développeurs full-stack et data engineers en 12 mois.', 'Benguerir', 'https://youcode.ma', true, 'active'),
  ('1337', '1337', 'ecole', 'École de coding gratuite et innovante inspirée du modèle 42 — apprentissage par projets, sans prof.', 'Khouribga', 'https://1337.ma', false, 'active'),
  ('OpenClassrooms Maroc', 'openclassrooms-maroc', 'certification', 'Formations certifiantes en ligne : développement web, data science, IA, product management.', 'Casablanca', 'https://openclassrooms.com', false, 'active')
ON CONFLICT (slug) DO NOTHING;

-- Formations (reliées aux domaines C5 via slug — on joint via sous-requête)
INSERT INTO training_programs
  (title, slug, description, institution_id, domain_id, level, modality, duration_text, price_range, url_inscription, is_featured, status)
SELECT
  'Développeur Full Stack (Node.js + React)',
  'fullstack-nodejs-react',
  'Formation intensive pour devenir développeur full-stack : JavaScript, Node.js, React, bases de données relationnelles et NoSQL, déploiement cloud.',
  (SELECT id FROM training_institutions WHERE slug = 'youcode'),
  (SELECT id FROM domains WHERE code = 'SOFTWARE' LIMIT 1),
  'Débutant', 'Présentiel', '12 mois', 'Gratuit (sur sélection)',
  'https://youcode.ma/inscription', true, 'active'
WHERE EXISTS (SELECT 1 FROM training_institutions WHERE slug = 'youcode')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO training_programs
  (title, slug, description, institution_id, domain_id, level, modality, duration_text, price_range, url_inscription, is_featured, status)
SELECT
  'Cycle Ingénieur Informatique',
  'cycle-ingenieur-emsi',
  'Formation d''ingénieur (bac+5) en génie informatique : algorithmique, systèmes distribués, développement logiciel, gestion de projet.',
  (SELECT id FROM training_institutions WHERE slug = 'emsi'),
  (SELECT id FROM domains WHERE code = 'SOFTWARE' LIMIT 1),
  'Tous niveaux', 'Présentiel', '5 ans', 'Sur demande',
  'https://www.emsi.ma/admission', false, 'active'
WHERE EXISTS (SELECT 1 FROM training_institutions WHERE slug = 'emsi')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO training_programs
  (title, slug, description, institution_id, domain_id, level, modality, duration_text, price_range, url_inscription, is_featured, status)
SELECT
  'Expert Cybersécurité',
  'expert-cybersecurite-esig',
  'Spécialisation en cybersécurité : tests d''intrusion, sécurité des réseaux, réponse à incident, conformité ISO 27001 et RGPD.',
  (SELECT id FROM training_institutions WHERE slug = 'esig'),
  (SELECT id FROM domains WHERE code = 'CYBER' LIMIT 1),
  'Avancé', 'Hybride', '18 mois', 'Sur demande',
  'https://www.esig.ac.ma', true, 'active'
WHERE EXISTS (SELECT 1 FROM training_institutions WHERE slug = 'esig')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO training_programs
  (title, slug, description, institution_id, domain_id, level, modality, duration_text, price_range, url_inscription, is_featured, status)
SELECT
  'Data Science & IA — Parcours certifiant',
  'data-science-ia-openclassrooms',
  'Parcours complet data scientist : Python, machine learning, deep learning, NLP, déploiement de modèles en production.',
  (SELECT id FROM training_institutions WHERE slug = 'openclassrooms-maroc'),
  (SELECT id FROM domains WHERE code = 'DATA' LIMIT 1),
  'Intermédiaire', 'Online', '12 mois', '800 MAD/mois',
  'https://openclassrooms.com/fr/paths/164-data-scientist', true, 'active'
WHERE EXISTS (SELECT 1 FROM training_institutions WHERE slug = 'openclassrooms-maroc')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO training_programs
  (title, slug, description, institution_id, domain_id, level, modality, duration_text, price_range, url_inscription, is_featured, status)
SELECT
  'Cursus 42 — Développeur Logiciel',
  'cursus-42-1337',
  'Méthode 42 : apprentissage par projets en peer-learning. Aucun prérequis, aucun cours magistral. C, Unix, algorithmes, web, IA.',
  (SELECT id FROM training_institutions WHERE slug = '1337'),
  (SELECT id FROM domains WHERE code = 'SOFTWARE' LIMIT 1),
  'Débutant', 'Présentiel', '18–36 mois', 'Gratuit',
  'https://1337.ma/candidature', false, 'active'
WHERE EXISTS (SELECT 1 FROM training_institutions WHERE slug = '1337')
ON CONFLICT (slug) DO NOTHING;
