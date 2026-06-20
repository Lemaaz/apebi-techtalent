export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
