import { NextRequest, NextResponse } from 'next/server'

// POST /api/scrape
// Body: { url: string }
// Returns: { product_name, image_url, current_best_price }
// TODO: replace stub with Firecrawl integration in Phase 3
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    // -- Firecrawl / scraper integration goes here (Phase 3) --
    // For now, return a stub so the UI flow can be tested end-to-end.
    // The stub extracts a readable name from the URL.
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    const guessedName = pathParts
      .at(-1)
      ?.replace(/[-_]/g, ' ')
      .replace(/\.(html?|php|aspx?)$/i, '')
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') ?? 'Product'

    return NextResponse.json({
      product_name: guessedName,
      image_url: null,
      current_best_price: null,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
}
