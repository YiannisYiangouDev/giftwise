'use client'
import { useState } from 'react'
import { Bookmark, Copy, Check, Gift, ExternalLink } from 'lucide-react'

export default function BookmarkletBanner() {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://giftwise.shillopelloi.com')

  const bookmarkletCode = `javascript:(function(){
  var u=encodeURIComponent(location.href);
  var t=encodeURIComponent(document.title.split('|')[0].split('–')[0].trim());
  var i='';
  var og=document.querySelector('meta[property="og:image"]');
  if(og) i=encodeURIComponent(og.content);
  var w=window.open('${appUrl}/wishlists/new?url='+u+'&name='+t+'&img='+i,'giftwise','width=500,height=600');
  if(!w) location.href='${appUrl}/wishlists/new?url='+u+'&name='+t+'&img='+i;
})();`

  async function handleCopy() {
    await navigator.clipboard.writeText(bookmarkletCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-brand-200/60 dark:border-brand-800/30 bg-gradient-to-br from-brand-50/60 to-purple-50/40 dark:from-brand-950/20 dark:to-purple-950/10 p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Bookmark size={18} className="text-white" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Quick Add — Bookmarklet</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Drag the button below to your bookmarks bar. Click it on any product page to instantly add it to GiftWise.
            </p>
          </div>

          {/* Draggable bookmarklet */}
          <a
            href={bookmarkletCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-all cursor-move shadow-md hover:shadow-lg"
            onClick={e => e.preventDefault()}
            title="Drag this to your bookmarks bar"
          >
            <Gift size={16} />
            + Add to GiftWise
          </a>

          <div className="flex items-center gap-2">
            <p className="text-[11px] text-gray-400">Or copy the code:</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-600 font-medium transition"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy JavaScript'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
