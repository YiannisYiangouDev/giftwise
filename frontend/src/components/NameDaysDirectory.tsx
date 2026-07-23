'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Calendar, UserPlus, Sparkles, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { GREEK_NAMEDAYS, NameDayEntry } from '@/lib/namedays'
import type { RecipientRow } from '@/types/rows'
import { useLanguage } from '@/context/LanguageContext'

interface NameDaysDirectoryProps {
  recipients: RecipientRow[]
}

const MONTHS = [
  { name: 'All', value: 'all' },
  { name: 'Jan', value: '01' },
  { name: 'Feb', value: '02' },
  { name: 'Mar', value: '03' },
  { name: 'Apr', value: '04' },
  { name: 'May', value: '05' },
  { name: 'Jun', value: '06' },
  { name: 'Jul', value: '07' },
  { name: 'Aug', value: '08' },
  { name: 'Sep', value: '09' },
  { name: 'Oct', value: '10' },
  { name: 'Nov', value: '11' },
  { name: 'Dec', value: '12' },
]

export default function NameDaysDirectory({ recipients }: NameDaysDirectoryProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'matched'>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 12

  // Get current month-day string (e.g. "07-23")
  const todayStr = useMemo(() => {
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return `${mm}-${dd}`
  }, [])

  // Filter namedays
  const filteredNameDays = useMemo(() => {
    return GREEK_NAMEDAYS.filter((nd) => {
      // 1. Search Query Match
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        q === '' ||
        nd.name.toLowerCase().includes(q) ||
        nd.greekName.toLowerCase().includes(q) ||
        nd.description.toLowerCase().includes(q) ||
        nd.date.includes(q)

      if (!matchesSearch) return false

      // 2. Month Filter Match
      if (selectedMonth !== 'all') {
        const ndMonth = nd.date.split('-')[0]
        if (ndMonth !== selectedMonth) return false
      }

      // 3. Tab Filter Match
      if (activeTab === 'today') {
        return nd.date === todayStr
      }

      if (activeTab === 'matched') {
        // Match recipient names to this name day entry
        return recipients.some((r) => {
          const recName = r.name.toLowerCase().trim()
          const ndName = nd.name.toLowerCase().trim()
          return recName === ndName || recName.includes(ndName) || ndName.includes(recName)
        })
      }

      return true
    })
  }, [searchQuery, activeTab, selectedMonth, todayStr, recipients])

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, selectedMonth])

  // Paginated namedays
  const paginatedNameDays = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredNameDays.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredNameDays, currentPage])

  const totalPages = Math.ceil(filteredNameDays.length / itemsPerPage)

  const formatDate = (dateStr: string) => {
    const [mm, dd] = dateStr.split('-')
    const dateObj = new Date(2026, parseInt(mm) - 1, parseInt(dd))
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  // Check if a name day matches any recipient
  const getMatchedRecipients = (name: string) => {
    const ndName = name.toLowerCase().trim()
    return recipients.filter((r) => {
      const recName = r.name.toLowerCase().trim()
      return recName === ndName || recName.includes(ndName) || ndName.includes(recName)
    })
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-purple-500" size={20} />
            {t('nd_directory_title')}
          </h2>
          <p className="text-xs text-gray-400">{t('nd_directory_subtitle')}</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={t('nd_search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Tabs & Month Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
          {/* Tab Buttons */}
          <div className="flex gap-1 bg-gray-50 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-gray-800 text-brand-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('nd_tab_all')}
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'today'
                  ? 'bg-white dark:bg-gray-800 text-brand-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Calendar size={13} />
              {t('nd_tab_today')}
            </button>
            <button
              onClick={() => setActiveTab('matched')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'matched'
                  ? 'bg-white dark:bg-gray-800 text-brand-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('nd_tab_matched')} ({recipients.filter(r => {
                const recName = r.name.toLowerCase().trim()
                return GREEK_NAMEDAYS.some(nd => {
                  const ndName = nd.name.toLowerCase().trim()
                  return recName === ndName || recName.includes(ndName) || ndName.includes(recName)
                })
              }).length})
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex flex-wrap gap-1 items-center">
            <Filter size={13} className="text-gray-400 mr-1" />
            <span className="text-xs text-gray-400 mr-2">Month:</span>
            {MONTHS.map((m) => (
              <button
                key={m.value}
                onClick={() => setSelectedMonth(m.value)}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  selectedMonth === m.value
                    ? 'bg-brand-500 text-white font-medium'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {m.value === 'all' ? t('nd_month_all') : m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {paginatedNameDays.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paginatedNameDays.map((nd, idx) => {
            const isToday = nd.date === todayStr
            const matchedRecipients = getMatchedRecipients(nd.name)
            const isMatched = matchedRecipients.length > 0

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 border transition duration-200 flex flex-col justify-between space-y-4 hover:shadow-sm ${
                  isToday
                    ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/10'
                    : isMatched
                    ? 'border-purple-500/50 bg-purple-500/5 dark:bg-purple-950/10'
                    : 'border-gray-100 dark:border-gray-800/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                      {nd.name}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                    }`}>
                      {formatDate(nd.date)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 italic leading-snug">
                    {nd.greekName}
                  </p>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                    {nd.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100/80 dark:border-gray-800/80 flex items-center justify-between">
                  {isMatched ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">{t('nd_for')}</span>
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate max-w-[120px]">
                        {matchedRecipients.map(r => r.name).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">{t('nd_unassigned')}</span>
                  )}

                  <Link
                    href={`/recipients/new?name=${encodeURIComponent(nd.name)}`}
                    className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-brand-500 border border-gray-100 dark:border-gray-700 transition"
                    title={`Add new recipient named ${nd.name}`}
                  >
                    <UserPlus size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Calendar size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t('nd_no_results')}</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            {t('nd_showing')}{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
            {t('nd_to')}{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {Math.min(currentPage * itemsPerPage, filteredNameDays.length)}
            </span>{' '}
            {t('nd_of')}{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredNameDays.length}</span>{' '}
            {t('nd_entries')}
          </p>

          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1
              if (totalPages > 6 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={i} className="px-1 text-gray-400 text-xs self-center">...</span>
                }
                return null
              }

              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-brand-500 text-white'
                      : 'border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
