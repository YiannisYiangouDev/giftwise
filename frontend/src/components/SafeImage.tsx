'use client'
import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { Gift, X, ZoomIn } from 'lucide-react'

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null
  alt: string
  fallbackName?: string
  aspectRatio?: string
  enableZoom?: boolean
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackName,
  fill,
  sizes,
  enableZoom = true,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setError(false)
    setLoaded(false)
  }, [src])

  const nameInitial = (fallbackName || alt || '?').charAt(0).toUpperCase()

  if (!src || error) {
    return (
      <div
        className={`bg-gradient-to-br from-brand-50 to-amber-50 dark:from-brand-950/30 dark:to-amber-950/20 border border-brand-100/60 dark:border-brand-800/20 flex flex-col items-center justify-center text-brand-500 font-semibold flex-shrink-0 ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
        }}
        title={alt}
      >
        <Gift size={typeof width === 'number' && width < 48 ? 16 : 22} className="opacity-70 mb-0.5" />
        <span className="text-[10px] tracking-wider font-bold opacity-80">{nameInitial}</span>
      </div>
    )
  }

  return (
    <>
      <div
        onClick={(e) => {
          if (enableZoom) {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(true)
          }
        }}
        className={`relative overflow-hidden group ${enableZoom ? 'cursor-zoom-in' : ''} ${fill ? 'w-full h-full' : ''}`}
      >
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes}
          unoptimized
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
        {enableZoom && loaded && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <ZoomIn size={16} />
          </div>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {isOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(false)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 transition"
              aria-label="Close Preview"
            >
              <X size={24} />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            {alt && <p className="text-xs text-white/80 mt-3 font-medium text-center">{alt}</p>}
          </div>
        </div>
      )}
    </>
  )
}
