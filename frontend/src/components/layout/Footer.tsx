'use client'
import Link from 'next/link'
import { Github, Twitter, Instagram, Mail, MapPin, Activity, Heart } from 'lucide-react'
import GiftWiseLogo from '@/components/GiftWiseLogo'

export default function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-gray-200/60 dark:border-gray-850/40 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-md px-6 py-10 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Column 1: Branding and Description */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2" aria-label="GiftWise Dashboard">
            <GiftWiseLogo size={24} variant="icon" />
            <span className="text-base font-bold tracking-wide text-gray-900 dark:text-white serif-heading">GiftWise</span>
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
            Private family gift tracker with wishlist coordination, group gifting pools, Secret Santa draws, and live price tracking across Cyprus & Greece.
          </p>
          {/* Social Icons */}
          <div className="flex items-center gap-3 pt-1">
            {[
              { icon: Github, label: 'GitHub Profile', href: 'https://github.com' },
              { icon: Twitter, label: 'Twitter Profile', href: 'https://twitter.com' },
              { icon: Instagram, label: 'Instagram Profile', href: 'https://instagram.com' },
              { icon: Mail, label: 'Contact Email', href: 'mailto:contact@giftwise.app' },
            ].map((s, idx) => (
              <a
                key={idx}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200/40 dark:border-gray-800/40 flex items-center justify-center text-gray-400 hover:text-brand-500 hover:border-brand-500/30 dark:hover:text-brand-400 dark:hover:border-brand-400/30 transition-all duration-200 shadow-sm"
              >
                <s.icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Navigation Links */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Navigation</h3>
          <nav className="flex flex-col gap-2.5" aria-label="Footer Navigation">
            {[
              { label: 'Dashboard', href: '/' },
              { label: 'Recipients', href: '/recipients' },
              { label: 'Wishlists', href: '/wishlists' },
              { label: 'Secret Santa', href: '/secret-santa' },
              { label: 'Price Tracker', href: '/tracker' },
              { label: 'Settings', href: '/settings' },
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="text-xs text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors duration-200 w-fit"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Column 3: Contact & Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Contact & Info</h3>
          <div className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-brand-500" />
              <a href="mailto:contact@giftwise.app" className="hover:underline">contact@giftwise.app</a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-brand-500" />
              <span>Limassol, Cyprus 🇨🇾</span>
            </div>
            <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800/60 pt-3 mt-1 w-fit">
              <Activity size={13} className="text-green-500 animate-pulse" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Scraper Engine: Active</span>
            </div>
          </div>
        </div>

        {/* Column 4: GDPR Statement */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Legal Compliance</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            GiftWise operates as a closed personal tool under the <strong>GDPR Article 2(2)(c) Household Exemption</strong>. No public signups are permitted.
          </p>
          <div className="text-[10px] text-gray-400 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800/40 p-2.5 rounded-lg leading-normal">
            Automated crawler complies with e-commerce rate limits (3s crawl delay) and respects domain robots.txt directives.
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto border-t border-gray-100/60 dark:border-gray-800/40 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 dark:text-gray-500">
        <div>
          © {new Date().getFullYear()} GiftWise. All rights reserved.
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:underline hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:underline hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Terms of Service</Link>
          <span>·</span>
          <a href="/privacy#cookies" className="hover:underline hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Cookie Preferences</a>
        </div>

        <div className="flex items-center gap-1">
          <span>Made with</span>
          <Heart size={10} className="text-red-500 fill-red-500" />
          <span>in Cyprus 🇨🇾</span>
        </div>
      </div>
    </footer>
  )
}
