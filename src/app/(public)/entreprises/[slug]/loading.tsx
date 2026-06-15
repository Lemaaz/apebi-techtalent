import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Banner skeleton */}
        <div className="h-36 animate-pulse bg-muted sm:h-48" />

        {/* Header skeleton */}
        <div className="border-b border-border bg-background px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            {/* Logo overlapping banner */}
            <div className="-mt-7 mb-4 size-14 animate-pulse rounded-xl border-2 border-background bg-muted" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="h-6 w-52 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
                <div className="flex gap-2">
                  <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-36 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
              <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>

        {/* Body skeleton */}
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
          {/* Left */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded-md bg-muted" style={{ width: `${90 - i * 8}%` }} />
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded-md bg-muted" style={{ width: `${80 - i * 10}%` }} />
              ))}
            </div>
          </div>
          {/* Right */}
          <div className="space-y-3">
            <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
            {[1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
