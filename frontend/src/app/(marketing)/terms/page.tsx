import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Cpu, ShieldAlert, HeartHandshake, EyeOff } from 'lucide-react'

export const metadata: Metadata = { title: 'Terms of Service — GiftWise' }

export default function TermsPage() {
  return (
    <article className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="w-12 h-12 bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText size={24} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Terms of Service</h1>
        <p className="text-sm text-gray-500 mt-2">Last updated: July 17, 2026</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/40 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">
        
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <HeartHandshake size={18} />
            <h2 className="text-lg font-bold">1. Closed Invite-Only System</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            GiftWise is an invite-only platform designed exclusively for private family gift coordination. Access is strictly granted to family members. Signups from the public are blocked. You agree to protect your account password and not share your login credentials outside our family circle.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <Cpu size={18} />
            <h2 className="text-lg font-bold">2. Scraper Compliance Policy</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            GiftWise utilizes automated scripts to parse e-commerce store listings to monitor prices and stock levels. To maintain absolute transparency and respect for online retailers, our crawler operates under a strict compliance standard:
          </p>
          <div className="space-y-2 pl-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">🤖 Custom User-Agent:</span> Identifies itself as <code>GiftWise/1.0 (gift-tracking price monitor; contact@giftwise.app)</code> so retailers know the purpose and contact info of our system.
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">⏱ Rate Limiting (Crawl Delay):</span> Enforces a strict 3-second wait delay between subsequent requests to the same domain to protect server bandwidth.
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">📝 Robots.txt Enforcement:</span> Before scraping any page, the service downloads and respects the host&apos;s <code>robots.txt</code> instructions. If crawlers are disallowed for the path, the item check is skipped.
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">🏠 Household Purposes:</span> Collected data is purely for personal price comparison and is never shared, aggregated, or commercialized.
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <ShieldAlert size={18} />
            <h2 className="text-lg font-bold">3. Acceptable Use</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Users may not abuse the search or fetch services. Malicious insertions of internal network addresses (SSRF attempts) or triggering requests to exploit server systems are strictly forbidden and will result in account banishment.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <EyeOff size={18} />
            <h2 className="text-lg font-bold">4. Limitation of Liability & Accuracy</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            GiftWise attempts to fetch prices and stock levels accurately. However, we cannot guarantee that store parsers will never make mistakes, or that the retail prices shown are 100% correct or in stock. The final price and terms of purchase are determined by the retailer at the time of your purchase.
          </p>
        </section>
      </div>

      <div className="text-center mt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </article>
  )
}
