export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="animate-pulse">
        <div className="h-8 w-2/3 rounded bg-zinc-200" />
        <div className="mt-3 h-5 w-1/3 rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-1/4 rounded bg-zinc-100" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-full rounded bg-zinc-100" />
              <div className="mt-2 h-4 w-5/6 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
        <aside className="order-1 lg:order-2 lg:col-span-1">
          <div className="animate-pulse rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="h-4 w-1/2 rounded bg-zinc-200" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-3 w-3/4 rounded bg-zinc-100" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
