// Fix: Next.js 15 changed PageProps to require async params/searchParams.
// This declaration makes TypeScript happy with both sync and async page components.
import type { ReactNode } from 'react'

declare module 'next' {
  interface PageProps {
    params?: Record<string, string>
    searchParams?: Record<string, string | string[] | undefined>
  }
}

export type LayoutProps = {
  children: ReactNode
  params?: Record<string, string>
}

export type PageProps<T extends Record<string, string> = Record<string, string>> = {
  params: T
  searchParams?: Record<string, string | string[] | undefined>
}
