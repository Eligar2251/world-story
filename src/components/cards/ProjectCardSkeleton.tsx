export default function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg bg-surface-raised border border-line overflow-hidden">
      <div className="aspect-[2/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/2" />
        <div className="h-3 skeleton w-2/3" />
      </div>
    </div>
  );
}