import { NextRequest, NextResponse } from 'next/server'

// Domain → scraper strategy map for Cyprus & Greece stores
const STORE_MAP: Record<string, { name: string; type: 'skroutz' | 'shopify' | 'woocommerce' | 'firecrawl' }> = {
  'skroutz.cy': { name: 'Skroutz CY', type: 'skroutz' },
  'skroutz.gr': { name: 'Skroutz GR', type: 'skroutz' },
  'electroline.com.cy': { name: 'Electroline', type: 'woocommerce' },
  'stephanis.com': { name: 'Stephanis', type: 'woocommerce' },
  'mediamarkt.com.cy': { name: 'MediaMarkt CY', type: 'firecrawl' },
  'public.cy': { name: 'Public CY', type: 'firecrawl' },
  'public.gr': { name: 'Public GR', type: 'firecrawl' },
  'plaisio.gr': { name: 'Plaisio', type: 'firecrawl' },
  'kotsovolos.gr': { name: 'Kotsovolos', type: 'firecrawl' },
  'e-shop.gr': { name: 'e-Shop', type: 'shopify' },
}

function detectStore(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return STORE_MAP[host] ?? { name: host, type: 'firecrawl' as const }
  } catch {
    return null
  }
}

function guessName(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    return parts
      .at(-1)
      ?.replace(/[-_]/g, ' ')
      .replace(/\.(html?|php|aspx?)$/i, '')
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') ?? 'Product'
  } catch { return 'Product' }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    const store = detectStore(url)
    if (!store) return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })

    // --- Real scraper integration (Phase 3 backend) ---
    // Skroutz → Apify actor
    // WooCommerce → /wp-json/wc/store/products endpoint
    // Shopify → /products.json endpoint
    // Firecrawl → firecrawl.dev extract API
    //
    // For now, call the Python scraper service if SCRAPER_URL is set;
    // otherwise fall back to URL-name stub.
    const scraperUrl = process.env.SCRAPER_SERVICE_URL
    if (scraperUrl) {
      const res = await fetch(`${scraperUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: store.type }),
        signal: AbortSignal.timeout(30_000),
      })
      const data = await res.json()
      return NextResponse.json({
        product_name: data.product_name ?? guessName(url),
        image_url: data.image_url ?? null,
        current_best_price: data.price ? String(data.price) : null,
        store_name: store.name,
        store_type: store.type,
      })
    }

    // Stub fallback
    return NextResponse.json({
      product_name: guessName(url),
      image_url: null,
      current_best_price: null,
      store_name: store.name,
      store_type: store.type,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
}
