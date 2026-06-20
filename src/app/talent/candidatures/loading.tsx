export default function Loading() {
  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
