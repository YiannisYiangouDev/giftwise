import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'GiftWise' }

export default function PrivacyPage() {
  return (
    <article className="text-center py-20">
      <h1 className="text-2xl font-bold mb-4">GiftWise</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        A private family gift tracker — not a public service. 
        This app is built for coordinating gifts within our family.
      </p>
      <Link href="/" className="inline-block mt-6 text-brand-500 hover:underline text-sm">← Back to dashboard</Link>
    </article>
  )
}
