import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const MAX_CANDIDATES = 20 // max talents/offres envoyés à Claude
const CONCURRENCY = 4     // appels Claude en parallèle simultanés

export type MatchScore = {
  score: number            // 0-100
  points_forts: string[]   // 2-3 atouts
  points_attention: string[] // 0-2 points à surveiller
}

export type TalentMatchResult = MatchScore & {
  talent: {
    id: string
    first_name: string
    last_name: string
    title: string | null
    city: string | null
    seniority_level: string | null
    years_experience: number | null
    availability: string | null
    avatar_url: string | null
    skills: string[]
    skill_match_count: number
  }
}

export type JobMatchResult = MatchScore & {
  job: {
    id: string
    slug: string
    title: string
    contract_type: string
    city: string | null
    remote_policy: string | null
    seniority_level: string | null
    salary_range: string | null
    company: { name: string; logo_url: string | null }
    skills: string[]
    skill_match_count: number
  }
}

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY manquante')
  return new Anthropic({ apiKey: key })
}

async function scoreWithClaude(
  anthropic: Anthropic,
  prompt: string,
): Promise<MatchScore> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    tools: [
      {
        name: 'evaluate_match',
        description: 'Évalue la compatibilité entre un profil talent et une offre d\'emploi',
        input_schema: {
          type: 'object' as const,
          properties: {
            score: {
              type: 'integer',
              description: 'Score de compatibilité de 0 (aucun match) à 100 (match parfait)',
            },
            points_forts: {
              type: 'array',
              items: { type: 'string' },
              description: '2 à 3 points forts du candidat pour ce poste spécifique',
            },
            points_attention: {
              type: 'array',
              items: { type: 'string' },
              description: '0 à 2 points d\'attention ou manques importants (tableau vide si aucun)',
            },
          },
          required: ['score', 'points_forts', 'points_attention'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'evaluate_match' },
    messages: [{ role: 'user', content: prompt }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    return { score: 0, points_forts: [], points_attention: ['Erreur d\'évaluation'] }
  }

  const input = toolUse.input as MatchScore
  return {
    score: Math.min(100, Math.max(0, input.score)),
    points_forts: (input.points_forts ?? []).slice(0, 3),
    points_attention: (input.points_attention ?? []).slice(0, 2),
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

// ── JOB → TALENTS ────────────────────────────────────────────

export async function matchTalentsToJob(jobId: string): Promise<TalentMatchResult[]> {
  const supabase = await createClient()

  // 1. Fetch job details
  const { data: job } = await supabase
    .from('job_postings')
    .select(
      `id, title, description, contract_type, seniority_level, city,
       remote_policy, salary_range,
       job_skills ( skill_id, is_required, skills ( name ) )`,
    )
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Offre introuvable')

  const requiredSkills = (job.job_skills as any[])
    .filter((js) => js.is_required)
    .map((js) => js.skills?.name)
    .filter(Boolean)

  const optionalSkills = (job.job_skills as any[])
    .filter((js) => !js.is_required)
    .map((js) => js.skills?.name)
    .filter(Boolean)

  const jobSkillIds = (job.job_skills as any[]).map((js) => js.skill_id)

  // 2. Pre-filter: approved talents with at least 1 matching skill
  type TalentRow = {
    id: string
    first_name: string
    last_name: string
    title: string | null
    bio: string | null
    city: string | null
    seniority_level: string | null
    years_experience: number | null
    availability: string | null
    job_type: string[] | null
    remote_preference: string | null
    avatar_url: string | null
    talent_skills: Array<{ skills: { name: string } | null }>
  }

  let candidates: (TalentRow & { skill_match_count: number })[] = []

  if (jobSkillIds.length > 0) {
    const { data: talentsWithSkills } = await supabase
      .from('talent_profiles')
      .select(
        `id, first_name, last_name, title, bio, city, seniority_level,
         years_experience, availability, job_type, remote_preference, avatar_url,
         talent_skills ( skills ( name ) )`,
      )
      .eq('validation_status', 'approved')
      .eq('visibility', true)
      .returns<TalentRow[]>()

    candidates = (talentsWithSkills ?? [])
      .map((t) => {
        const talentSkillNames = (t.talent_skills ?? [])
          .map((ts) => ts.skills?.name)
          .filter(Boolean) as string[]
        const matchCount = talentSkillNames.filter((s) =>
          requiredSkills.concat(optionalSkills).some(
            (rs) => rs.toLowerCase() === s.toLowerCase(),
          ),
        ).length
        return { ...t, skill_match_count: matchCount }
      })
      .filter((t) => t.skill_match_count > 0)
      .sort((a, b) => b.skill_match_count - a.skill_match_count)
      .slice(0, MAX_CANDIDATES)
  }

  if (candidates.length === 0) {
    // Fallback: return any approved talents
    const { data: fallback } = await supabase
      .from('talent_profiles')
      .select(
        `id, first_name, last_name, title, bio, city, seniority_level,
         years_experience, availability, job_type, remote_preference, avatar_url,
         talent_skills ( skills ( name ) )`,
      )
      .eq('validation_status', 'approved')
      .eq('visibility', true)
      .limit(MAX_CANDIDATES)
      .returns<TalentRow[]>()
    candidates = (fallback ?? []).map((t) => ({ ...t, skill_match_count: 0 }))
  }

  if (candidates.length === 0) return []

  // 3. Claude scoring
  const anthropic = getClient()

  const results = await runWithConcurrency(
    candidates,
    async (talent) => {
      const talentSkills = (talent.talent_skills ?? [])
        .map((ts) => ts.skills?.name)
        .filter(Boolean)
        .join(', ')

      const prompt = `Tu es un expert RH spécialisé en recrutement tech au Maroc. Évalue la compatibilité entre ce profil talent et cette offre d'emploi.

OFFRE :
- Titre : ${job.title}
- Type de contrat : ${job.contract_type}
- Niveau requis : ${job.seniority_level ?? 'Non précisé'}
- Localisation : ${job.city ?? 'Non précisée'} | Télétravail : ${job.remote_policy ?? 'Non précisé'}
- Compétences requises : ${requiredSkills.join(', ') || 'Non spécifiées'}
- Compétences souhaitées : ${optionalSkills.join(', ') || 'Aucune'}
- Description (extrait) : ${job.description?.slice(0, 300) ?? ''}

PROFIL TALENT :
- Titre : ${talent.title ?? 'Non précisé'}
- Expérience : ${talent.years_experience ?? '?'} ans | Niveau : ${talent.seniority_level ?? 'Non précisé'}
- Compétences : ${talentSkills || 'Non renseignées'}
- Disponibilité : ${talent.availability ?? 'Non précisée'}
- Localisation : ${talent.city ?? 'Non précisée'}
- Types de postes recherchés : ${(talent.job_type ?? []).join(', ') || 'Non précisé'}
- Préférence télétravail : ${talent.remote_preference ?? 'Non précisée'}

Évalue la compatibilité avec un score et des points clés.`

      const match = await scoreWithClaude(anthropic, prompt)

      return {
        ...match,
        talent: {
          id: talent.id,
          first_name: talent.first_name,
          last_name: talent.last_name,
          title: talent.title,
          city: talent.city,
          seniority_level: talent.seniority_level,
          years_experience: talent.years_experience,
          availability: talent.availability,
          avatar_url: talent.avatar_url,
          skills: (talent.talent_skills ?? [])
            .map((ts) => ts.skills?.name)
            .filter(Boolean) as string[],
          skill_match_count: talent.skill_match_count,
        },
      } satisfies TalentMatchResult
    },
    CONCURRENCY,
  )

  return results.sort((a, b) => b.score - a.score)
}

// ── TALENT → JOBS ─────────────────────────────────────────────

export async function matchJobsToTalent(talentId: string): Promise<JobMatchResult[]> {
  const supabase = await createClient()

  // 1. Fetch talent profile
  type TalentFull = {
    id: string
    title: string | null
    bio: string | null
    city: string | null
    seniority_level: string | null
    years_experience: number | null
    availability: string | null
    job_type: string[] | null
    remote_preference: string | null
    talent_skills: Array<{ skill_id: string; skills: { name: string } | null }>
  }

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(
      `id, title, bio, city, seniority_level, years_experience,
       availability, job_type, remote_preference,
       talent_skills ( skill_id, skills ( name ) )`,
    )
    .eq('id', talentId)
    .single<TalentFull>()

  if (!talent) throw new Error('Profil introuvable')

  const talentSkillIds = (talent.talent_skills ?? []).map((ts) => ts.skill_id)
  const talentSkillNames = (talent.talent_skills ?? [])
    .map((ts) => ts.skills?.name)
    .filter(Boolean) as string[]

  // 2. Pre-filter: active jobs with at least 1 matching skill
  type JobRow = {
    id: string
    slug: string
    title: string
    description: string
    contract_type: string
    city: string | null
    remote_policy: string | null
    seniority_level: string | null
    salary_range: string | null
    company_profiles: { name: string; logo_url: string | null } | null
    job_skills: Array<{ skill_id: string; is_required: boolean; skills: { name: string } | null }>
  }

  const { data: jobs } = await supabase
    .from('job_postings')
    .select(
      `id, slug, title, description, contract_type, city, remote_policy,
       seniority_level, salary_range,
       company_profiles ( name, logo_url ),
       job_skills ( skill_id, is_required, skills ( name ) )`,
    )
    .eq('status', 'active')
    .returns<JobRow[]>()

  const candidates = (jobs ?? [])
    .map((j) => {
      const jobSkillNames = (j.job_skills ?? []).map((js) => js.skills?.name).filter(Boolean) as string[]
      const matchCount = jobSkillNames.filter((s) =>
        talentSkillNames.some((ts) => ts.toLowerCase() === s.toLowerCase()),
      ).length
      return { ...j, skill_match_count: matchCount }
    })
    .filter((j) => j.skill_match_count > 0)
    .sort((a, b) => b.skill_match_count - a.skill_match_count)
    .slice(0, MAX_CANDIDATES)

  if (candidates.length === 0) return []

  // 3. Claude scoring
  const anthropic = getClient()
  const talentSkillsStr = talentSkillNames.join(', ')

  const results = await runWithConcurrency(
    candidates,
    async (job) => {
      const requiredSkills = (job.job_skills ?? [])
        .filter((js) => js.is_required)
        .map((js) => js.skills?.name)
        .filter(Boolean)
        .join(', ')

      const prompt = `Tu es un expert RH spécialisé en recrutement tech au Maroc. Évalue si cette offre d'emploi correspond bien au profil de ce talent.

PROFIL TALENT :
- Titre : ${talent.title ?? 'Non précisé'}
- Expérience : ${talent.years_experience ?? '?'} ans | Niveau : ${talent.seniority_level ?? 'Non précisé'}
- Compétences : ${talentSkillsStr || 'Non renseignées'}
- Disponibilité : ${talent.availability ?? 'Non précisée'}
- Localisation : ${talent.city ?? 'Non précisée'}
- Types de postes recherchés : ${(talent.job_type ?? []).join(', ') || 'Non précisé'}
- Préférence télétravail : ${talent.remote_preference ?? 'Non précisée'}

OFFRE :
- Titre : ${job.title}
- Entreprise : ${job.company_profiles?.name ?? 'Non précisée'}
- Type de contrat : ${job.contract_type}
- Niveau requis : ${job.seniority_level ?? 'Non précisé'}
- Localisation : ${job.city ?? 'Non précisée'} | Télétravail : ${job.remote_policy ?? 'Non précisé'}
- Compétences requises : ${requiredSkills || 'Non spécifiées'}
- Description (extrait) : ${job.description?.slice(0, 300) ?? ''}

Évalue la compatibilité du point de vue du talent.`

      const match = await scoreWithClaude(anthropic, prompt)

      return {
        ...match,
        job: {
          id: job.id,
          slug: job.slug,
          title: job.title,
          contract_type: job.contract_type,
          city: job.city,
          remote_policy: job.remote_policy,
          seniority_level: job.seniority_level,
          salary_range: job.salary_range,
          company: job.company_profiles ?? { name: '?', logo_url: null },
          skills: (job.job_skills ?? [])
            .map((js) => js.skills?.name)
            .filter(Boolean) as string[],
          skill_match_count: job.skill_match_count,
        },
      } satisfies JobMatchResult
    },
    CONCURRENCY,
  )

  return results.sort((a, b) => b.score - a.score)
}
