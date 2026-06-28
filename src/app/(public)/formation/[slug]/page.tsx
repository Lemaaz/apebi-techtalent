import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, GraduationCap, MapPin, Monitor, Clock,
  ExternalLink, Building2, Tag,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

type Params = Promise<{ slug: string }>

type ProgramDetail = {
  id: string
  title: string
  slug: string
  description: string | null
  level: string | null
  modality: string | null
  duration_text: string | null
  price_range: string | null
  url_inscription: string | null
  is_featured: boolean
  domain_id: string | null
  training_institutions: {
    id: string
    name: string
    city: string | null
    logo_url: string | null
    website_url: string | null
    description: string | null
    type: string
  } | null
  domains: { name_fr: string; code: string; color: string | null } | null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('training_programs')
    .select('title, description, training_institutions ( name )')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle<{ title: string; description: string | null; training_institutions: { name: string } | null }>()

  if (!data) return { title: 'Formation introuvable' }
  return {
    title: data.title,
    description: data.description?.slice(0, 160) ?? `Formation ${data.title} — ${data.training_institutions?.name ?? 'APEBI TechTalent'}`,
    openGraph: {
      title: `${data.title} — Formation APEBI TechTalent`,
      description: data.description?.slice(0, 160) ?? undefined,
    },
  }
}

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', expert: 'Expert',
}
const MODALITY_LABELS: Record<string, string> = {
  Online: 'En ligne', Présentiel: 'Présentiel', Hybride: 'Hybride',
}

export default async function FormationDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: program } = await supabase
    .from('training_programs')
    .select(
      `id, title, slug, description, level, modality, duration_text,
       price_range, url_inscription, is_featured, domain_id,
       training_institutions ( id, name, city, logo_url, website_url, description, type ),
       domains ( name_fr, code, color )`,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle<ProgramDetail>()

  if (!program) notFound()

  const institution = program.training_institutions
  const domain = program.domains
  const domainColor = domain?.color ?? '#00AFD2'

  // Autres formations de la même institution
  const { data: relatedPrograms } = await supabase
    .from('training_programs')
    .select('id, slug, title, level, modality, duration_text')
    .eq('institution_id', institution?.id ?? '')
    .eq('status', 'published')
    .neq('slug', slug)
    .limit(3)
    .returns<Array<{ id: string; slug: string; title: string; level: string | null; modality: string | null; duration_text: string | null }>>()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Back */}
          <Link
            href="/formation"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Toutes les formations
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            {/* ── Left ── */}
            <div className="space-y-6 min-w-0">
              {/* Domain badge */}
              {domain && (
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: domainColor }}
                >
                  {domain.name_fr}
                </span>
              )}

              <h1 className="font-heading text-2xl font-bold text-foreground">
                {program.title}
              </h1>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2">
                {program.modality && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <Monitor className="size-3" aria-hidden />
                    {MODALITY_LABELS[program.modality] ?? program.modality}
                  </span>
                )}
                {program.level && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <Tag className="size-3" aria-hidden />
                    {LEVEL_LABELS[program.level] ?? program.level}
                  </span>
                )}
                {program.duration_text && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <Clock className="size-3" aria-hidden />
                    {program.duration_text}
                  </span>
                )}
                {program.price_range && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {program.price_range}
                  </span>
                )}
              </div>

              {/* Description */}
              {program.description && (
                <section>
                  <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
                    Description
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {program.description}
                  </p>
                </section>
              )}

              {/* Related from same institution */}
              {relatedPrograms && relatedPrograms.length > 0 && (
                <section>
                  <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
                    Autres formations — {institution?.name}
                  </h2>
                  <ul className="space-y-2" role="list">
                    {relatedPrograms.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/formation/${r.slug}`}
                          className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-[var(--apebi-cyan)] hover:shadow-sm"
                        >
                          <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <div>
                            <p className="font-heading text-[13px] font-semibold text-foreground">{r.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {r.modality ? MODALITY_LABELS[r.modality] ?? r.modality : ''}
                              {r.duration_text ? ` · ${r.duration_text}` : ''}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* ── Sidebar ── */}
            <aside className="space-y-4">
              {/* Institution card */}
              {institution && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-3 font-heading text-sm font-semibold text-foreground">
                    Institution
                  </p>
                  <div className="flex items-start gap-3">
                    {institution.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={institution.logo_url} alt="" className="size-10 rounded-lg object-contain" />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="size-5 text-muted-foreground" aria-hidden />
                      </div>
                    )}
                    <div>
                      <p className="font-heading text-[13px] font-semibold text-foreground">{institution.name}</p>
                      {institution.city && (
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="size-3" aria-hidden />{institution.city}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground capitalize">{institution.type}</p>
                    </div>
                  </div>
                  {institution.website_url && (
                    <a
                      href={institution.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3 w-full justify-start gap-1.5 text-xs')}
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                      Site de l&apos;institution
                    </a>
                  )}
                </div>
              )}

              {/* CTA inscription */}
              {program.url_inscription && (
                <div className="rounded-xl border border-[var(--apebi-cyan)]/20 bg-[var(--apebi-cyan)]/5 p-4">
                  <p className="mb-2 font-heading text-sm font-semibold text-foreground">
                    S&apos;inscrire à cette formation
                  </p>
                  <p className="mb-3 text-[12px] text-muted-foreground">
                    L&apos;inscription se fait directement sur le site de l&apos;institution.
                  </p>
                  <a
                    href={program.url_inscription}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ size: 'sm' }), 'w-full gap-1.5 text-xs')}
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    S&apos;inscrire
                  </a>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
