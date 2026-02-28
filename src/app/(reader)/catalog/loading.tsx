export default function CatalogLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="h-8 w-32 skeleton mb-6" />
      <div className="h-10 skeleton mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] skeleton rounded-lg" />
            <div className="mt-2 space-y-1.5">
              <div className="h-4 skeleton w-3/4" />
              <div className="h-3 skeleton w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}