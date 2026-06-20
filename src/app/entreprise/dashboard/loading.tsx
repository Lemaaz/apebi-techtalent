export default function Loading() {
  return (
    <div>
        {/* Header skeleton */}
        <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded-md bg-muted" />
                <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </div>

        {/* Body skeleton */}
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
          <div className="space-y-3">
            <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-36 animate-pulse rounded-md bg-muted" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
    </div>
  )
}
