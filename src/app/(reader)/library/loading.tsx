export default function LibraryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="h-8 w-44 skeleton mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 skeleton rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] skeleton rounded-lg" />
            <div className="mt-2 h-4 skeleton w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}