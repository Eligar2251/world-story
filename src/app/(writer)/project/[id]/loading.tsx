export default function ProjectLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 skeleton rounded" />
        <div className="space-y-2">
          <div className="h-6 w-48 skeleton" />
          <div className="h-4 w-32 skeleton" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 skeleton rounded-lg" />
        ))}
      </div>
      <div className="h-10 skeleton w-full rounded-lg" />
    </div>
  );
}