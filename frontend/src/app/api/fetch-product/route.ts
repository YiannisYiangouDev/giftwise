import { NextResponse } from 'next/server'

// FlareSolverr URL — set in .env.local or Vercel env vars
const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'http://localhost:8191'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const slugName = extractSlugName(url)

  // Step 1: Python cloudscraper (bypasses Cloudflare)
  try {
    const { spawnSync } = require('child_process')
    const py = spawnSync('python3', [
      '/home/coder/projects/giftwise/frontend/scripts/skroutz_helper.py',
      'fetch', url,
    ], { timeout: 20000, encoding: 'utf8' })
    const out = py.stdout?.trim() || ''
    if (out && !py.error) {
      const data = JSON.parse(out)
      if (data.name) {
        return NextResponse.json({ name: data.name, price: data.price, image_url: data.image_url, from: 'python' })
      }
    }
  } catch {}

  // Step 2: Direct fetch (works for non-Cloudflare sites like Electroline, Cablenet)
  const direct = await tryDirect(url)
  if (direct) {
    return NextResponse.json({ name: direct.name || slugName, price: direct.price, image_url: direct.image_url, from: 'direct' })
  }

  // Step 3: FlareSolverr (Docker-based, if running)
  const bypassed = await tryFlareSolverr(url)
  if (bypassed) {
    return NextResponse.json({ name: bypassed.name || slugName, price: bypassed.price, image_url: bypassed.image_url, from: 'flaresolverr' })
  }

  // Step 4: URL slug fallback (always works)
  return NextResponse.json({ name: slugName, price: null, image_url: null, from: 'url' })
}

async function tryDirect(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return extractProductInfo(html)
  } catch {
    return null
  }
}

async function tryFlareSolverr(url: string) {
  try {
    const res = await fetch(`${FLARESOLVERR_URL}/v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cmd: 'request.get',
        url,
        maxTimeout: 30000,
      }),
      signal: AbortSignal.timeout(35000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.status !== 'ok') return null
    const html = data.solution.response
    return extractProductInfo(html)
  } catch {
    return null
  }
}

function extractProductInfo(html: string) {
  let name = ''
  let price: number | null = null
  let image_url: string | null = null

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    name = titleMatch[1].replace(/\s*[-|–—]\s*.*$/, '').trim().slice(0, 200)
  }

  // og:image
  const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
  if (ogImg) image_url = ogImg[1]

  // JSON-LD
  const ldMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
  if (ldMatch) {
    try {
      const ld = JSON.parse(ldMatch[1])
      const item = Array.isArray(ld) ? ld[0] : ld
      if (item.name) name = item.name
      if (!image_url && item.image) {
        image_url = typeof item.image === 'string' ? item.image : item.image?.[0]?.url || item.image?.[0]
      }
      const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers
      if (offers?.price) price = parseFloat(offers.price)
    } catch {}
  }

  // Meta tags
  if (!price) {
    const meta = html.match(/<meta[^>]+property="product:price:amount"[^>]+content="([\d.]+)"/i)
    if (meta) price = parseFloat(meta[1])
  }

  // Inline price patterns
  if (!price) {
    for (const p of [/"price"\s*:\s*"?([\d.]+)"?/i, /€\s*([\d,.]+)/]) {
      const m = html.match(p)
      if (m) { price = parseFloat(m[1].replace(',', '')); break }
    }
  }

  return { name, price, image_url }
}

function extractSlugName(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    return decodeURIComponent(parts[parts.length - 1] || new URL(url).hostname)
      .replace(/[-_]/g, ' ')
      .replace(/\.html?$/i, '')
      .replace(/\b\w/g, c => c.toUpperCase())
      .slice(0, 200)
  } catch { return '' }
}
