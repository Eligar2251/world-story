export default function WorkLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-[200px] mx-auto md:mx-0 aspect-[2/3] skeleton rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-5 skeleton w-20" />
          <div className="h-8 skeleton w-2/3" />
          <div className="h-4 skeleton w-40" />
          <div className="h-4 skeleton w-60" />
          <div className="flex gap-2 mt-4">
            <div className="h-10 w-28 skeleton rounded-lg" />
            <div className="h-10 w-28 skeleton rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}