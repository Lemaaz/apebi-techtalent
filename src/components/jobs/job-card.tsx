// src/components/jobs/job-card.tsx
import Link from 'next/link'
import { MapPin, Clock, Wifi } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export type JobCardData = {
  id: string
  title: string
  slug: string
  contract_type: string
  seniority_level: string | null
  city: string | null
  remote_policy: string | null
  salary_range: string | null
  created_at: string
  skills: string[]
  company: {
    name: string
    slug: string
    logo_url: string | null
    sector: string
  }
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} j`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

function CompanyInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div
      aria-hidden
      className="flex size-full items-center justify-center font-heading text-sm font-semibold text-primary"
    >
      {initials}
    </div>
  )
}

export function JobCard({ job }: { job: JobCardData }) {
  return (
    <Link href={`/offres/${job.slug}`}>
      <Card className="h-full transition-all hover:shadow-sm hover:ring-1 hover:ring-primary/20">
        <CardContent className="pt-5">
          {/* Company row */}
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {job.company.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.company.logo_url}
                  alt={`Logo ${job.company.name}`}
                  className="size-full object-contain"
                />
              ) : (
                <CompanyInitials name={job.company.name} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{job.company.name}</p>
              <p className="truncate text-[11px] text-muted-foreground/70">{job.company.sector}</p>
            </div>
          </div>

          {/* Title */}
          <p className="font-heading text-sm font-semibold text-foreground line-clamp-2">
            {job.title}
          </p>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
              {job.contract_type}
            </span>
            {job.seniority_level && <span>{job.seniority_level}</span>}
            {job.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-3" aria-hidden />
                {job.city}
              </span>
            )}
            {job.remote_policy && (
              <span className="flex items-center gap-0.5">
                <Wifi className="size-3" aria-hidden />
                {job.remote_policy}
              </span>
            )}
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] text-primary"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{job.skills.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            {job.salary_range ? (
              <span className="text-[11px] font-medium text-emerald-600">{job.salary_range}</span>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              {timeAgo(job.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
