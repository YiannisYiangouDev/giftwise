export default function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
          <div className="h-7 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-1.5" />
          <div className="h-4 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
