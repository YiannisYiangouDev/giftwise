import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Database, Lock, Eye, Download, Trash2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Privacy Policy — GiftWise' }

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="w-12 h-12 bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield size={24} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mt-2">Last updated: July 17, 2026</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/40 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">
        
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <Shield size={18} />
            <h2 className="text-lg font-bold">1. Household Exemption & Scope</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            GiftWise is a private, family-only utility tool. It is built strictly for personal and household purposes, aligning with the <strong>Household Exemption under GDPR Article 2(2)(c)</strong>. Public signups are disabled in production, and registration is restricted to family members invited by an administrator.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <Database size={18} />
            <h2 className="text-lg font-bold">2. Data We Collect</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            To provide wishlist coordination and price monitoring features, we collect and store:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1.5 pl-2">
            <li><strong>Account Information:</strong> Invited email addresses, usernames, and hashed passwords.</li>
            <li><strong>Gift Coordination Data:</strong> Recipient profiles, wishlist items (name, URL, custom notes, target prices).</li>
            <li><strong>Price Monitoring History:</strong> Historical price changes parsed from stores.</li>
            <li><strong>Gift Activity:</strong> Item reservation statuses (claims, purchased status) and joint contributions.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <Lock size={18} />
            <h2 className="text-lg font-bold">3. Cookies & Browser Storage</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            We use technical storage mechanisms solely to make the app function securely and persist settings:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1.5 pl-2">
            <li><strong>Session Cookies:</strong> Strictly necessary HTTP-only authentication session tokens managed by Supabase.</li>
            <li><strong>LocalStorage:</strong> Used to persist theme preferences (Dark Mode / Light Mode) and Command Palette recent histories.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <Eye size={18} />
            <h2 className="text-lg font-bold">4. GDPR Rights: Export & Erasure</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Despite the household exemption, we believe in giving family members full sovereignty over their data. We provide built-in tools to support key user rights:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 mb-1.5">
                <Download size={15} className="text-brand-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Data Portability</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                You can download a complete JSON dump of your account details, recipients, wishlists, and claims at any time by triggering the data export at `/api/account/export`.
              </p>
            </div>
            
            <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 mb-1.5">
                <Trash2 size={15} className="text-red-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Right to Be Forgotten</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                You can permanently delete your account and cascade delete all associated wishlists, recipients, and claims by triggering the erasure action at `/api/account/delete`.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">5. Scraper Security & Compliance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            GiftWise operates automated price scrapers to fetch product prices from Cyprus & Greek e-commerce platforms. We respect retailer infrastructure by complying with robots.txt limits, throttling requests with a 3-second delay, and identifying ourselves via a custom User-Agent. Scraped price data is kept private to family members and is never sold or used for marketing.
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
