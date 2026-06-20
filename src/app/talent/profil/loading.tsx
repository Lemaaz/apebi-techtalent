export default function Loading() {
  return (
    <>
        {/* Header skeleton */}
        <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start gap-4">
              <div className="size-16 animate-pulse rounded-2xl bg-muted" />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
            <div className="mt-4 flex max-w-sm items-center gap-3">
              <div className="h-1.5 flex-1 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-8 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </div>

        {/* Body skeleton */}
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px]">
          {/* Left */}
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-4 animate-pulse rounded-md bg-muted"
                    style={{ width: `${90 - j * 12}%` }}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Right */}
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
    </>
  )
}
