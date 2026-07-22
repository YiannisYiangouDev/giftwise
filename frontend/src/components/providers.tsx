'use client'
import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/Toast'
import { LanguageProvider } from '@/context/LanguageContext'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PushNotificationPrompt from '@/components/PushNotificationPrompt'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        console.log('SW registered:', reg.scope);
      }).catch(function(err) {
        console.error('SW registration failed:', err);
      });
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ToastProvider>
          {children}
          <PWAInstallPrompt />
          <PushNotificationPrompt />
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
