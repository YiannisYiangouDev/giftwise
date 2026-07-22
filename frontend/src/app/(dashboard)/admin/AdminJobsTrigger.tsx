'use client'
import { useState } from 'react'
import { Play, Loader2, Check, AlertCircle, TrendingDown, Calendar } from 'lucide-react'
import { useToast } from '@/components/Toast'

export default function AdminJobsTrigger() {
  const [runningJob, setRunningJob] = useState<'price-checker' | 'birthday-reminder' | null>(null)
  const [result, setResult] = useState<{ job: string; success: boolean; data?: any; error?: string } | null>(null)
  const { toast } = useToast()

  async function handleTrigger(job: 'price-checker' | 'birthday-reminder') {
    setRunningJob(job)
    setResult(null)
    toast(`Triggering ${job === 'price-checker' ? 'Price Checker' : 'Birthday Reminder'}...`)

    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ job, success: false, error: data.error || 'Failed to trigger job' })
        toast(`Error triggering ${job}`, 'error')
      } else {
        setResult({ job, success: true, data: data.result })
        toast(`${job === 'price-checker' ? 'Price check' : 'Birthday check'} completed successfully!`)
      }
    } catch (err: any) {
      setResult({ job, success: false, error: err.message || 'Network error occurred' })
      toast('Network error. Try again.', 'error')
    } finally {
      setRunningJob(null)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/40 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <Play size={16} className="text-white fill-white" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white">Trigger System Jobs</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Price Checker */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between bg-gray-50/30 dark:bg-gray-800/10">
          <div>
            <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 mb-1">
              <TrendingDown size={16} className="text-brand-500" />
              <h3 className="text-sm font-semibold">Price Checker</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Scrapes prices for all active items and alerts users of drops or restocks.
            </p>
          </div>
          <button
            onClick={() => handleTrigger('price-checker')}
            disabled={runningJob !== null}
            className="w-full py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {runningJob === 'price-checker' ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play size={12} className="fill-white" /> Run Price Checker
              </>
            )}
          </button>
        </div>

        {/* Birthday Reminder */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between bg-gray-50/30 dark:bg-gray-800/10">
          <div>
            <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 mb-1">
              <Calendar size={16} className="text-brand-500" />
              <h3 className="text-sm font-semibold">Birthday Reminder</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Checks upcoming birthdays within 7 days and dispatches email notifications.
            </p>
          </div>
          <button
            onClick={() => handleTrigger('birthday-reminder')}
            disabled={runningJob !== null}
            className="w-full py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {runningJob === 'birthday-reminder' ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play size={12} className="fill-white" /> Run Birthday Checker
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`mt-3 p-4 border rounded-xl text-xs space-y-2 ${
          result.success 
            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/60' 
            : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60'
        }`}>
          <div className="flex items-center gap-2 font-bold mb-1">
            {result.success ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>Job Output: {result.job} ({result.success ? 'Success' : 'Failed'})</span>
          </div>
          
          {result.success ? (
            <div className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto bg-white/50 dark:bg-black/30 p-2.5 rounded-lg border border-green-100 dark:border-green-900/40">
              {JSON.stringify(result.data, null, 2)}
            </div>
          ) : (
            <p className="font-mono text-[11px] bg-white/50 dark:bg-black/30 p-2.5 rounded-lg border border-red-100 dark:border-red-900/40">
              Error details: {result.error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
