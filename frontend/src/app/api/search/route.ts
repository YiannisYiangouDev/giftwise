import { NextResponse } from 'next/server'

const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'http://localhost:8191'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('q') || ''
  const query = rawQuery.trim()

  if (!query) {
    return NextResponse.json({ suggestions: [] })
  }

  if (query.length > 500 || /[\x00-\x1f]/.test(query)) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    // Run searches in parallel across all platforms
    const searchPromises = [
      tryFlareSolverr(query, 'cy'),
      tryFlareSolverr(query, 'gr'),
      tryWooCommerceSearch(query, 'Electroline', 'https://www.electroline.com.cy'),
      tryWooCommerceSearch(query, 'Cablenet', 'https://shop.cablenet.com.cy'),
      tryShopifySearch(query, 'Beauty Bar', 'https://www.beautybar.com.cy'),
      tryPythonSearch(query)
    ]

    const results = await Promise.allSettled(searchPromises)

    const cyList = results[0].status === 'fulfilled' ? results[0].value : []
    const grList = results[1].status === 'fulfilled' ? results[1].value : []
    const electrolineList = results[2].status === 'fulfilled' ? results[2].value : []
    const cablenetList = results[3].status === 'fulfilled' ? results[3].value : []
    const beautyBarList = results[4].status === 'fulfilled' ? results[4].value : []
    const pyList = results[5].status === 'fulfilled' ? results[5].value : []

    const combined: any[] = []
    const maxLen = Math.max(
      cyList.length,
      grList.length,
      electrolineList.length,
      cablenetList.length,
      beautyBarList.length,
      pyList.length
    )

    // Interleave the results to provide a mixed set of options
    for (let i = 0; i < maxLen; i++) {
      if (cyList[i]) combined.push(cyList[i])
      if (grList[i]) combined.push(grList[i])
      if (pyList[i]) combined.push(pyList[i])
      if (electrolineList[i]) combined.push(electrolineList[i])
      if (cablenetList[i]) combined.push(cablenetList[i])
      if (beautyBarList[i]) combined.push(beautyBarList[i])
    }

    if (combined.length > 0) {
      // Filter out duplicate product URLs
      const seenUrls = new Set()
      const uniqueCombined = combined.filter(item => {
        if (!item.url || seenUrls.has(item.url)) return false
        seenUrls.add(item.url)
        return true
      })
      return NextResponse.json({ suggestions: uniqueCombined.slice(0, 15) })
    }
  } catch (error) {
    console.error('Error performing parallel multi-store search:', error)
  }

  // Absolute fallback
  return NextResponse.json({
    suggestions: [{ name: query, price: null, url: '', image_url: null, store: 'Manual' }],
  })
}

async function tryFlareSolverr(query: string, domain: 'cy' | 'gr') {
  try {
    const url = `https://www.skroutz.${domain}/search?keyphrase=${encodeURIComponent(query)}`
    const res = await fetch(`${FLARESOLVERR_URL}/v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cmd: 'request.get',
        url,
        maxTimeout: 20000,
      }),
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (data?.status !== 'ok') return []
    const html = data.solution.response
    return parseSearchResults(html, domain)
  } catch {
    return []
  }
}

function parseSearchResults(html: string, domain: 'cy' | 'gr') {
  const regex = /<a[^>]*title="([^"]+)"[^>]*href="(\/s\/(\d+)\/([^"?]+)\.html[^"]*)"/gi
  const results = []
  const seen = new Set()
  let match
  while ((match = regex.exec(html)) !== null) {
    const title = match[1]
    const url_path = match[2]
    const base = url_path.split('?')[0]
    if (seen.has(base)) continue
    seen.add(base)

    // Try to find image nearby in HTML
    const startIndex = Math.max(0, match.index - 1500)
    const endIndex = match.index + 3000
    const chunk = html.substring(startIndex, endIndex)
    const imgMatch = chunk.match(/<img[^>]+src="(https?:\/\/[^"]+)"[^>]*>/i)
    const image_url = imgMatch ? imgMatch[1] : null

    results.push({
      name: title.trim().slice(0, 200),
      url: `https://www.skroutz.${domain}${base}`,
      price: null,
      image_url,
      store: `Skroutz.${domain}`,
    })
    if (results.length >= 6) break
  }
  return results
}

async function tryWooCommerceSearch(query: string, storeName: string, baseUrl: string) {
  try {
    const url = `${baseUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(query)}&per_page=3`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const products = await res.json()
    if (!Array.isArray(products)) return []
    return products.map((p: any) => ({
      name: p.name || '',
      url: p.permalink || '',
      price: p.price ? parseFloat(p.price) : null,
      image_url: p.images?.[0]?.src || null,
      store: storeName
    }))
  } catch {
    return []
  }
}

async function tryShopifySearch(query: string, storeName: string, baseUrl: string) {
  try {
    // Using Shopify front-end json predictive search API
    const url = `${baseUrl}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const data = await res.json()
    const products = data?.resources?.results?.products || []
    return products.map((p: any) => ({
      name: p.title || '',
      url: `${baseUrl}${p.url}`,
      price: p.price ? parseFloat(p.price) : null,
      image_url: p.image || null,
      store: storeName
    }))
  } catch {
    return []
  }
}

async function tryPythonSearch(query: string) {
  try {
    const { spawnSync } = require('child_process')
    const path = require('path')
    const script = path.join(process.cwd(), 'scripts', 'skroutz_helper.py')
    const py = spawnSync('python3', [script, 'search', query], { timeout: 10000, encoding: 'utf8' })
    const out = py.stdout?.trim() || ''
    if (out && !py.error) {
      const data = JSON.parse(out)
      if (Array.isArray(data)) return data
    }
    return []
  } catch {
    return []
  }
}
