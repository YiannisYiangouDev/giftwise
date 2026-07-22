'use client'
import { useState, useEffect, useRef } from 'react'
import { Gift, ChevronRight, Sparkles, ShoppingBag, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

interface Question {
  id: string
  text: string
  options: { label: string; value: string; icon?: string }[]
}

interface QuizResult {
  name: string
  description: string
  reason: string
  price: number | null
}

interface Props {
  recipientId: string
  wishlistId?: string
  onItemAdded?: () => void
}

const QUESTIONS: Question[] = [
  {
    id: 'category',
    text: 'What type of gift are you looking for?',
    options: [
      { label: '🎮 Tech & Gadgets', value: 'tech' },
      { label: '🏠 Home & Living', value: 'home' },
      { label: '👕 Fashion & Style', value: 'fashion' },
      { label: '📚 Books & Learning', value: 'books' },
      { label: '🏃 Sports & Outdoors', value: 'sports' },
      { label: '🎨 Art & Creative', value: 'art' },
    ],
  },
  {
    id: 'personality',
    text: 'How would you describe the recipient?',
    options: [
      { label: '🧘 Relaxed & Chill', value: 'relaxed' },
      { label: '⚡ Active & Energetic', value: 'active' },
      { label: '🎯 Practical & Organized', value: 'practical' },
      { label: '✨ Creative & Artsy', value: 'creative' },
    ],
  },
  {
    id: 'budget',
    text: 'What\'s your budget range?',
    options: [
      { label: '💰 Under €25', value: 'budget' },
      { label: '💵 €25 – €50', value: 'mid' },
      { label: '💎 €50 – €100', value: 'premium' },
      { label: '👑 €100+ (Splurge!)', value: 'luxury' },
    ],
  },
]

const GIFT_MATRIX: Record<string, QuizResult[]> = {
  // Tech + personality + budget combinations
  'tech-relaxed-budget': [
    { name: 'Wireless Bluetooth Eye Mask', description: 'Soft sleeping mask with built-in speakers for relaxing music', reason: 'Perfect for a tech-loving relaxed person on a budget', price: 19.99 },
    { name: 'Phone Stand with Ring Light', description: 'Adjustable aluminium stand with LED ring light for video calls', reason: 'Practical tech accessory at a great price', price: 22.50 },
  ],
  'tech-active-mid': [
    { name: 'Wireless Earbuds', description: 'IPX5 waterproof Bluetooth earbuds with 30hr battery', reason: 'Ideal for active lifestyle with quality audio', price: 45.00 },
    { name: 'Smart Fitness Jump Rope', description: 'App-connected jump rope with counter and calorie tracker', reason: 'Tech meets fitness for the active recipient', price: 35.99 },
  ],
  'tech-practical-premium': [
    { name: 'Mechanical Keyboard', description: 'Hot-swappable wireless mechanical keyboard with RGB', reason: 'Premium typing experience for the practical tech enthusiast', price: 85.00 },
    { name: 'Smart Home Starter Kit', description: 'WiFi smart plugs + motion sensor bundle', reason: 'Practical home automation for organized minds', price: 69.99 },
  ],
  // Home + personality
  'home-relaxed-mid': [
    { name: 'Weighted Blanket', description: '15lb premium glass-bead weighted blanket, breathable cotton', reason: 'Ultimate relaxation gift for cozy evenings', price: 49.99 },
    { name: 'Aromatherapy Diffuser', description: 'Ultrasonic essential oil diffuser with 7 LED colours', reason: 'Creates a spa-like atmosphere at home', price: 32.00 },
  ],
  'home-creative-premium': [
    { name: 'Smart Photo Frame', description: 'WiFi digital frame, auto-syncs from phone gallery', reason: 'Beautiful way to display memories for creative souls', price: 79.99 },
    { name: 'Premium Throw Blanket', description: 'Merino wool blend, ethically sourced, geometric pattern', reason: 'Luxury home comfort for the style-conscious recipient', price: 65.00 },
  ],
  'home-practical-budget': [
    { name: 'Bamboo Organizer Set', description: '3-piece drawer organizer with compartments', reason: 'Tidy home for the organized mind', price: 18.99 },
    { name: 'Cork Coaster Set', description: 'Handcrafted 6-piece hexagonal cork coasters with holder', reason: 'Stylish and practical home addition', price: 14.50 },
  ],
  // Fashion
  'fashion-creative-mid': [
    { name: 'Minimalist Watch', description: 'Ultra-thin mesh strap watch with date window', reason: 'Timeless accessory for style-conscious recipients', price: 55.00 },
    { name: 'Leather Tote Bag', description: 'Full-grain leather daily tote with laptop sleeve', reason: 'Functional fashion for creative professionals', price: 48.99 },
  ],
  'fashion-active-premium': [
    { name: 'Premium Running Shoes', description: 'Lightweight carbon-plate trainers for daily runs', reason: 'Top-tier footwear for the active fashion lover', price: 95.00 },
    { name: 'Designer Sunglasses', description: 'Polarized UV400 lenses, Italian acetate frame', reason: 'Style meets function for outdoor enthusiasts', price: 89.99 },
  ],
  // Books
  'books-relaxed-budget': [
    { name: 'Kindle Paperwhite Case', description: 'Premium leather folio case with auto wake/sleep', reason: 'Protects their reader in style', price: 24.99 },
    { name: 'Book Lover\'s Gift Set', description: 'Reading journal, bookmark, and scented candle bundle', reason: 'The perfect cozy reading companion', price: 22.00 },
  ],
  'books-practical-mid': [
    { name: 'Noise-Cancelling Headphones', description: 'Over-ear ANC headphones, 40hr battery for focused reading', reason: 'Deep focus for the serious reader', price: 59.99 },
    { name: 'Premium Notebook Set', description: '3-pack dot-grid hardcover notebooks, 180gsm paper', reason: 'Beautiful writing tools for the note-taker', price: 28.50 },
  ],
  // Sports
  'sports-active-mid': [
    { name: 'Insulated Water Bottle', description: '750ml triple-wall vacuum insulated, stays cold 24hrs', reason: 'Essential hydration for active lifestyles', price: 32.00 },
    { name: 'Resistance Band Set', description: '5-band set with door anchor and ankle straps', reason: 'Complete home workout kit', price: 25.99 },
  ],
  'sports-active-luxury': [
    { name: 'GPS Running Watch', description: 'Multi-sport GPS watch with heart rate and VO2 max', reason: 'Serious training tool for dedicated athletes', price: 120.00 },
    { name: 'Premium Yoga Mat', description: '6mm natural rubber mat with alignment lines', reason: 'Top-tier gear for the committed yogi', price: 85.00 },
  ],
  // Art
  'art-creative-mid': [
    { name: 'Watercolour Paint Set', description: '48-colour professional grade set with brushes', reason: 'Unleash creativity with premium art supplies', price: 39.99 },
    { name: 'Calligraphy Starter Kit', description: 'Complete set with 4 pens, ink, and practice book', reason: 'Beautiful art form for creative expression', price: 28.00 },
  ],
  'art-creative-budget': [
    { name: 'Adult Colouring Book Set', description: '3-book mindfulness set with 48 gel pens', reason: 'Relaxing creative outlet at an affordable price', price: 19.99 },
    { name: 'DIY Macramé Kit', description: 'Complete kit with cord, rings, and video tutorial access', reason: 'Hands-on creative project for beginners', price: 22.50 },
  ],
}

// Default fallback recommendations
const DEFAULT_GIFTS: QuizResult[] = [
  { name: 'Gourmet Gift Basket', description: 'Curated selection of artisanal treats and snacks', reason: 'Universally loved gift for any occasion', price: 35.00 },
  { name: 'Premium Candle Set', description: 'Set of 3 soy candles in amber, vanilla, and cedar', reason: 'Thoughtful gift that suits any personality', price: 28.99 },
  { name: 'Gift Card Bundle', description: 'Multi-brand gift card with elegant presentation box', reason: 'Lets them choose exactly what they want', price: 50.00 },
]

export default function GiftQuiz({ recipientId, wishlistId, onItemAdded }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(false)
  const [addingItem, setAddingItem] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  function handleAnswer(value: string) {
    const q = QUESTIONS[step]
    const newAnswers = { ...answers, [q.id]: value }
    setAnswers(newAnswers)

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      generateResults(newAnswers)
    }
  }

  function generateResults(finalAnswers: Record<string, string>) {
    setLoading(true)
    const key = `${finalAnswers.category}-${finalAnswers.personality}-${finalAnswers.budget}`
    
    // Try exact match first, then fall back to category-personality, then default
    let matches = GIFT_MATRIX[key]
    if (!matches) {
      const partialKey = `${finalAnswers.category}-${finalAnswers.personality}-${finalAnswers.budget}`
      // Try same category + personality with any budget
      const partialMatches = Object.entries(GIFT_MATRIX).filter(([k]) => 
        k.startsWith(`${finalAnswers.category}-${finalAnswers.personality}`)
      )
      matches = partialMatches.length > 0 ? partialMatches[0][1] : DEFAULT_GIFTS
    }

    setTimeout(() => {
      setResults(matches!.slice(0, 3))
      setLoading(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }, 600)
  }

  async function addGift(result: QuizResult) {
    if (!wishlistId) {
      toast('Please select a wishlist first', 'error')
      return
    }
    setAddingItem(result.name)
    const { error } = await supabase.from('wishlist_items').insert({
      wishlist_id: wishlistId,
      product_name: result.name,
      target_price: result.price,
      notes: `${result.description}\n\nWhy: ${result.reason}`,
      status: 'wanted',
    })
    setAddingItem(null)
    if (error) {
      toast('Failed to add item', 'error')
    } else {
      toast(`Added "${result.name}"!`)
      onItemAdded?.()
    }
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setResults([])
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      {results.length === 0 && !loading && (
        <div className="flex gap-1 mb-4">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
              i < step ? 'bg-brand-500' : i === step ? 'bg-brand-300' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          ))}
        </div>
      )}

      {/* Question */}
      {step < QUESTIONS.length && results.length === 0 && !loading && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Question {step + 1} of {QUESTIONS.length}
          </p>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {QUESTIONS[step].text}
          </h3>
          <div className="grid gap-2">
            {QUESTIONS[step].options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all text-left text-sm text-gray-700 dark:text-gray-300 group"
              >
                <span className="flex-1">{opt.label}</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-8 text-center space-y-4 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-950/30 flex items-center justify-center mx-auto">
            <Sparkles size={24} className="text-brand-500 animate-pulse" />
          </div>
          <p className="text-sm text-gray-500">Finding the perfect gifts...</p>
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div ref={resultsRef} className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Sparkles size={16} className="text-brand-500" />
              Recommended Gifts
            </h3>
            <button onClick={reset} className="text-xs text-brand-500 hover:underline font-medium">
              Retake quiz
            </button>
          </div>
          {results.map((r, i) => (
            <div key={i} className="card p-4 flex items-start gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center flex-shrink-0">
                <Gift size={18} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{r.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                <p className="text-[11px] text-brand-500 mt-1 italic">{r.reason}</p>
                {r.price && (
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1.5">€{r.price.toFixed(2)}</p>
                )}
              </div>
              {wishlistId && (
                <button
                  onClick={() => addGift(r)}
                  disabled={addingItem === r.name}
                  className="flex-shrink-0 p-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition disabled:opacity-40"
                  title="Add to wishlist"
                >
                  {addingItem === r.name ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
