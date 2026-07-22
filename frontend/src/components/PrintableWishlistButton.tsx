'use client'
import { Printer } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function PrintableWishlistButton() {
  const { t } = useLanguage()

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Hide non-printable UI chrome */
          header,
          aside,
          nav,
          button,
          .no-print,
          [role="banner"] {
            display: none !important;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px !important;
          }

          .card, .glass {
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
            background: #ffffff !important;
            break-inside: avoid;
          }

          h1, h2, h3 {
            color: #000000 !important;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={handlePrint}
        className="btn-secondary !py-2 !px-4 !text-xs flex items-center gap-1.5 no-print"
        title="Print or Save PDF"
      >
        <Printer size={14} className="text-brand-500" />
        <span>{t('export_pdf')}</span>
      </button>
    </>
  )
}
