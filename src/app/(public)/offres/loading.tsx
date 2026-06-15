import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-7 w-24 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </div>
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
