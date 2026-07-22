export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="space-y-2">
        <div className="h-9 w-52 skeleton"></div>
        <div className="h-4 w-64 skeleton"></div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 w-32 skeleton rounded-xl"></div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card p-5 space-y-4">
            <div className="w-10 h-10 skeleton rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-7 w-16 skeleton"></div>
              <div className="h-3 w-20 skeleton"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Card */}
      <div className="card p-6 space-y-4">
        <div className="h-5 w-40 skeleton"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 skeleton rounded-full"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 skeleton"></div>
                <div className="h-3 w-48 skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
