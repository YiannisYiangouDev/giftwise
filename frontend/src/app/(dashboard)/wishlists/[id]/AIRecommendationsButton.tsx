'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import GiftIdeasModal from '@/components/GiftIdeasModal'

interface Props {
  wishlistId: string
  recipient: {
    name: string
    relationship: string | null
    birthday: string | null
    notes: string | null
    budget_min: number
    budget_max: number
  }
}

export default function AIRecommendationsButton({ wishlistId, recipient }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-4 py-2 text-sm font-semibold border border-lux-gold text-lux-gold rounded-xl hover:bg-lux-gold/5 transition duration-300"
      >
        <Sparkles size={14} /> Get Gift Ideas
      </button>

      <GiftIdeasModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        recipient={recipient}
        wishlistId={wishlistId}
        onItemAdded={() => router.refresh()}
      />
    </>
  )
}
