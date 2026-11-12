export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-200/70 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Top Cards / Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="w-9 h-9 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-7 w-24 bg-slate-200 rounded-md" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="h-10 w-full sm:w-72 bg-slate-100 rounded-xl" />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="h-10 w-28 bg-slate-100 rounded-xl" />
            <div className="h-10 w-28 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 py-3 px-3 rounded-lg bg-slate-50/70"
            >
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-4 w-36 bg-slate-200/80 rounded hidden sm:block" />
              <div className="h-4 w-24 bg-slate-200/70 rounded hidden md:block" />
              <div className="h-4 w-20 bg-slate-200/60 rounded" />
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
