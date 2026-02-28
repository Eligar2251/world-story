export default function StudioLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-28 skeleton" />
          <div className="h-4 w-52 skeleton" />
        </div>
        <div className="h-10 w-36 skeleton rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-lg border border-line">
            <div className="w-16 h-24 skeleton rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-5 skeleton w-1/3" />
              <div className="h-4 skeleton w-1/4" />
              <div className="h-3 skeleton w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}