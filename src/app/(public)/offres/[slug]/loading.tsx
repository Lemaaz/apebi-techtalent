export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="h-14 border-b bg-background" />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-8 h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </main>
    </div>
  )
}
