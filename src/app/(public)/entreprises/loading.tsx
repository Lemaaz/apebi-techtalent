import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-3 flex items-center gap-3">
        <div className="size-10 shrink-0 rounded-lg bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 rounded-md bg-muted" />
          <div className="h-3 w-1/2 rounded-md bg-muted" />
        </div>
      </div>
      <div className="mb-3 flex gap-1.5">
        <div className="h-5 w-24 rounded-full bg-muted" />
      </div>
      <div className="mt-auto flex justify-between">
        <div className="h-3 w-20 rounded-md bg-muted" />
        <div className="h-3 w-16 rounded-md bg-muted" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
            <div className="mt-4 flex gap-3">
              <div className="h-8 flex-1 animate-pulse rounded-lg bg-muted" />
              <div className="h-8 w-52 animate-pulse rounded-lg bg-muted" />
              <div className="h-8 w-44 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
