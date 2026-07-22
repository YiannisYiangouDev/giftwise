import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'GiftWise — Family Gift Tracker'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow ambient background effect */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '30%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(197, 168, 128, 0.25) 0%, rgba(0,0,0,0) 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Brand Icon Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '110px',
            height: '110px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #c5a880 0%, #9e7f54 100%)',
            marginBottom: '28px',
            boxShadow: '0 20px 40px rgba(197, 168, 128, 0.3)',
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="8" width="18" height="13" rx="2" />
            <path d="M12 8v13" />
            <path d="M19 12H5" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #d4d4d8 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '16px',
          }}
        >
          GiftWise
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 500,
            color: '#c5a880',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '32px',
          }}
        >
          Family Gift Tracker · Wishlists & Secret Santa
        </div>

        {/* Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '18px',
            color: '#a1a1aa',
          }}
        >
          <span>🇨🇾 Cyprus & 🇬🇷 Greece</span>
          <span>·</span>
          <span>Price Drop Alerts</span>
          <span>·</span>
          <span>Group Gifts</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
