'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { en, TranslationKeys } from '@/locales/en'
import { el } from '@/locales/el'

export type Locale = 'en' | 'el'

interface LanguageContextType {
  locale: Locale
  setLocale: (loc: Locale) => void
  t: (key: TranslationKeys) => string
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => en[key] || key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('giftwise_lang') as Locale | null
      if (savedLang === 'en' || savedLang === 'el') {
        setLocaleState(savedLang)
      } else {
        // Auto-detect Greek browser language
        const browserLang = navigator.language.toLowerCase()
        if (browserLang.startsWith('el')) {
          setLocaleState('el')
        }
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('giftwise_lang', newLocale)
    }
  }

  const t = (key: TranslationKeys): string => {
    const dict = locale === 'el' ? el : en
    return dict[key] || en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
