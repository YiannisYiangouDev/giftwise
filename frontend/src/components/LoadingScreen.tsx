'use client'
import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Elegant fade out after the custom CSS animation sequence finishes (1.8 seconds)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 1800)

    const destroyTimer = setTimeout(() => {
      setVisible(false)
    }, 2500) // 1800ms animation + 700ms fade transition

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(destroyTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fbfbfa] dark:bg-[#0a0a0a] transition-opacity duration-700 ease-in-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center gap-6">
        {/* Breathing ambient radial gold glow */}
        <div className="absolute w-64 h-64 bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />

        {/* Premium Luxury SVG Gift Box Animation */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Slow spinning luxury outer ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-brand-300/40 dark:border-brand-700/20 animate-spin" style={{ animationDuration: '15s' }} />
          
          <svg
            width="72"
            height="72"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            {/* Styles for draw path and floating animations */}
            <style>{`
              .draw-path {
                stroke-dasharray: 200;
                stroke-dashoffset: 200;
                animation: draw 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
              }
              .float-lid {
                animation: floatLid 3s ease-in-out infinite;
              }
              .box-base {
                animation: pulseBase 3s ease-in-out infinite;
              }
              @keyframes draw {
                to { stroke-dashoffset: 0; }
              }
              @keyframes floatLid {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              @keyframes pulseBase {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(0.98); }
              }
            `}</style>

            {/* Ribbon Bow Loops (Draws itself dynamically) */}
            <path
              d="M50 35 C38 20, 30 45, 50 35 C70 45, 62 20, 50 35 Z"
              stroke="#c5a880"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="draw-path"
              style={{ animationDelay: '0.2s' }}
            />
            <circle cx="50" cy="35" r="3.5" fill="#dfc9a4" />

            {/* Gift Box Lid (Gently floats) */}
            <g className="float-lid" style={{ transformOrigin: '50px 35px' }}>
              <rect x="22" y="38" width="56" height="10" rx="2" fill="#c5a880" />
              {/* Lid Ribbon accent */}
              <rect x="47" y="38" width="6" height="10" fill="#dfc9a4" />
            </g>

            {/* Gift Box Base */}
            <g className="box-base" style={{ transformOrigin: '50px 70px' }}>
              <rect x="25" y="48" width="50" height="30" rx="3" fill="#b5966d" />
              {/* Base vertical ribbon */}
              <rect x="47" y="48" width="6" height="30" fill="#dfc9a4" />
              {/* Base horizontal ribbon */}
              <rect x="25" y="58" width="50" height="4" fill="#dfc9a4" />
            </g>
          </svg>
        </div>

        {/* Elegant typography with gold gradient and slide-up animation */}
        <div className="text-center space-y-1 z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h1 className="text-2xl font-light tracking-[0.15em] text-gold-gradient serif-heading">
            GiftWise
          </h1>
          <p className="text-[10px] tracking-[0.3em] font-semibold text-brand-400 dark:text-brand-500 uppercase">
            Family Gift Registry
          </p>
        </div>

        {/* Minimal Progress Indicator */}
        <div className="flex gap-2 mt-2 z-10">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-brand-400 animate-ping"
              style={{ animationDelay: `${i * 0.25}s`, animationDuration: '1.2s' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
