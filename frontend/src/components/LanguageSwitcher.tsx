'use client'
import { useLanguage, Locale } from '@/context/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLanguage()

  return (
    <div className={`inline-flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-1 text-xs font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 rounded-lg transition flex items-center gap-1.5 ${
          locale === 'en'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
        }`}
        title="English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('el')}
        className={`px-2 py-1 rounded-lg transition flex items-center gap-1.5 ${
          locale === 'el'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
        }`}
        title="Ελληνικά"
      >
        <span>🇬🇷</span>
        <span>GR</span>
      </button>
    </div>
  )
}
