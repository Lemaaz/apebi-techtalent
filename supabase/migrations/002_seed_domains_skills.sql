-- ============================================================
-- APEBI TechTalent — Migration 002 : Seed domaines & compétences (référentiel C5)
-- ============================================================

-- Domaines C5
INSERT INTO domains (code, name_fr, name_en, description_fr, icon, color) VALUES
('D1', 'Compétences numériques techniques', 'Technical Digital Skills',
 'Développement, Data/IA, Cybersécurité, Cloud, UX/Design', 'Code', '#00AFD2'),
('D2', 'Compétences numériques transversales', 'Cross-cutting Digital Skills',
 'AI Literacy, Data Literacy, Agilité, No-code, Outils numériques', 'Globe', '#3A4652'),
('D3', 'Compétences métiers hybrides', 'Hybrid Business Skills',
 'Sales Tech, HR Tech, Legal Tech, EdTech, FinTech', 'Briefcase', '#10B981'),
('D4', 'Compétences managériales & leadership', 'Management & Leadership Skills',
 'Management tech, Transformation digitale, Innovation, Product', 'Users', '#F59E0B'),
('D5', 'Compétences comportementales', 'Behavioral Skills',
 'Pensée critique, Communication, Adaptabilité, Soft Skills', 'Heart', '#8B5CF6'),
('D6', 'Compétences émergentes', 'Emerging Skills',
 'IA au travail, Éthique numérique, Green IT, Future of Work', 'Zap', '#EF4444')
ON CONFLICT (code) DO NOTHING;

-- Compétences D1 — Techniques
WITH d1 AS (SELECT id FROM domains WHERE code = 'D1')
INSERT INTO skills (domain_id, name, name_en, category) SELECT
  d1.id, skill.name, skill.name_en, skill.category
FROM d1, (VALUES
  ('JavaScript', 'JavaScript', 'Frontend'),
  ('TypeScript', 'TypeScript', 'Frontend'),
  ('React / Next.js', 'React / Next.js', 'Frontend'),
  ('Vue.js / Nuxt', 'Vue.js / Nuxt', 'Frontend'),
  ('Node.js', 'Node.js', 'Backend'),
  ('Python', 'Python', 'Backend'),
  ('Java / Spring', 'Java / Spring', 'Backend'),
  ('PHP / Laravel', 'PHP / Laravel', 'Backend'),
  ('SQL (PostgreSQL, MySQL)', 'SQL (PostgreSQL, MySQL)', 'Data'),
  ('MongoDB / NoSQL', 'MongoDB / NoSQL', 'Data'),
  ('Data Analysis', 'Data Analysis', 'Data'),
  ('Machine Learning', 'Machine Learning', 'IA'),
  ('Deep Learning', 'Deep Learning', 'IA'),
  ('NLP / LLM', 'NLP / LLM', 'IA'),
  ('Cybersécurité', 'Cybersecurity', 'Cybersec'),
  ('Pentesting', 'Pentesting', 'Cybersec'),
  ('AWS', 'AWS', 'Cloud'),
  ('Azure', 'Azure', 'Cloud'),
  ('GCP', 'GCP', 'Cloud'),
  ('Docker / Kubernetes', 'Docker / Kubernetes', 'DevOps'),
  ('CI/CD', 'CI/CD', 'DevOps'),
  ('UX Design', 'UX Design', 'Design'),
  ('UI Design', 'UI Design', 'Design'),
  ('Figma', 'Figma', 'Design'),
  ('Mobile (React Native)', 'Mobile (React Native)', 'Mobile'),
  ('Mobile (Flutter)', 'Mobile (Flutter)', 'Mobile')
) AS skill(name, name_en, category);

-- Compétences D2 — Transversales
WITH d2 AS (SELECT id FROM domains WHERE code = 'D2')
INSERT INTO skills (domain_id, name, name_en, category) SELECT
  d2.id, skill.name, skill.name_en, skill.category
FROM d2, (VALUES
  ('AI Literacy', 'AI Literacy', 'Digital'),
  ('Data Literacy', 'Data Literacy', 'Digital'),
  ('Méthodes Agile / Scrum', 'Agile / Scrum', 'Méthodes'),
  ('No-code / Low-code', 'No-code / Low-code', 'Digital'),
  ('Outils collaboratifs (Notion, Slack)', 'Collaborative Tools', 'Digital'),
  ('Prompt Engineering', 'Prompt Engineering', 'IA')
) AS skill(name, name_en, category);

-- Compétences D3 — Métiers hybrides
WITH d3 AS (SELECT id FROM domains WHERE code = 'D3')
INSERT INTO skills (domain_id, name, name_en, category) SELECT
  d3.id, skill.name, skill.name_en, skill.category
FROM d3, (VALUES
  ('CRM (Salesforce, HubSpot)', 'CRM', 'Sales Tech'),
  ('Marketing digital', 'Digital Marketing', 'Marketing Tech'),
  ('RH digitale', 'Digital HR', 'HR Tech'),
  ('Legal Tech', 'Legal Tech', 'Legal'),
  ('FinTech / Paiement digital', 'FinTech', 'Finance'),
  ('EdTech', 'EdTech', 'Education')
) AS skill(name, name_en, category);

-- Compétences D4 — Management
WITH d4 AS (SELECT id FROM domains WHERE code = 'D4')
INSERT INTO skills (domain_id, name, name_en, category) SELECT
  d4.id, skill.name, skill.name_en, skill.category
FROM d4, (VALUES
  ('Product Management', 'Product Management', 'Product'),
  ('Transformation digitale', 'Digital Transformation', 'Management'),
  ('Management d''équipe tech', 'Tech Team Management', 'Management'),
  ('Innovation & design thinking', 'Innovation', 'Innovation')
) AS skill(name, name_en, category);

-- Compétences D5 — Comportementales
WITH d5 AS (SELECT id FROM domains WHERE code = 'D5')
INSERT INTO skills (domain_id, name, name_en, category) SELECT
  d5.id, skill.name, skill.name_en, skill.category
FROM d5, (VALUES
  ('Communication', 'Communication', 'Soft Skills'),
  ('Pensée critique', 'Critical Thinking', 'Soft Skills'),
  ('Résolution de problèmes', 'Problem Solving', 'Soft Skills'),
  ('Adaptabilité', 'Adaptability', 'Soft Skills'),
  ('Travail en équipe', 'Teamwork', 'Soft Skills'),
  ('Gestion du temps', 'Time Management', 'Soft Skills')
) AS skill(name, name_en, category);

-- Compétences D6 — Émergentes
WITH d6 AS (SELECT id FROM domains WHERE code = 'D6')
INSERT INTO skills (domain_id, name, name_en, category) SELECT
  d6.id, skill.name, skill.name_en, skill.category
FROM d6, (VALUES
  ('IA générative au travail', 'Generative AI at Work', 'IA'),
  ('Éthique numérique', 'Digital Ethics', 'Éthique'),
  ('Green IT', 'Green IT', 'Durabilité'),
  ('Future of Work', 'Future of Work', 'Tendances')
) AS skill(name, name_en, category);
