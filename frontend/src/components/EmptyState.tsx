import { Package, Users, Gift, TrendingDown, ShoppingBag, ListChecks } from 'lucide-react'

const ILLUSTRATIONS = {
  recipients: {
    icon: Users,
    title: 'No recipients yet',
    subtitle: 'Add your first person to start tracking gifts!',
    action: { label: 'Add Recipient', href: '/recipients/new' },
  },
  wishlists: {
    icon: ListChecks,
    title: 'No wishlists yet',
    subtitle: 'Create a wishlist and start adding gift ideas.',
    action: { label: 'New Wishlist', href: '/wishlists/new' },
  },
  tracker: {
    icon: TrendingDown,
    title: 'Nothing tracked yet',
    subtitle: 'Add items to a wishlist to monitor prices across 16 stores.',
    action: { label: 'Browse Wishlists', href: '/wishlists' },
  },
  'secret-santa': {
    icon: Gift,
    title: 'No Secret Santa groups yet',
    subtitle: 'Create a group, invite family, and let the magic happen.',
    action: { label: 'Create Group', href: '/secret-santa/new' },
  },
  items: {
    icon: ShoppingBag,
    title: 'No items yet',
    subtitle: 'Search Skroutz.cy or paste a URL to add your first item.',
  },
  contributions: {
    icon: Package,
    title: 'No contributions yet',
    subtitle: 'Pool money with family for group gifts.',
  },
} as const

type EmptyStateType = keyof typeof ILLUSTRATIONS

interface Props {
  type: EmptyStateType
  className?: string
}

export default function EmptyState({ type, className = '' }: Props) {
  const state = ILLUSTRATIONS[type]
  const Icon = state.icon

  return (
    <div className={`text-center py-16 ${className}`}>
      {/* Decorative blob background */}
      <div className="relative mx-auto mb-6 w-20 h-20">
        <div className="absolute inset-0 bg-brand-500/5 rounded-full blur-xl animate-gentle-float" />
        <div className="absolute inset-2 bg-brand-500/10 rounded-full blur-md" style={{ animationDelay: '0.5s' }} />
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-950/30 dark:to-purple-950/20 border border-brand-100/50 dark:border-brand-800/20 flex items-center justify-center">
          <Icon size={28} className="text-brand-400 dark:text-brand-600" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{state.title}</h3>
      <p className="text-xs text-gray-400 max-w-[220px] mx-auto mb-4">{state.subtitle}</p>

      {'action' in state && state.action && (
        <a
          href={state.action.href}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-all shadow-md hover:shadow-lg"
        >
          {state.action.label}
        </a>
      )}
    </div>
  )
}
