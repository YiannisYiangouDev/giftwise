import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ suggestions: [] })
  }

  // Use Python cloudscraper to bypass Cloudflare on Skroutz autocomplete
  try {
    const { spawnSync } = require('child_process')
    const path = require('path')
    const script = path.join(process.cwd(), 'scripts', 'skroutz_helper.py')
    const py = spawnSync('python3', [script, 'search', query], { timeout: 20000, encoding: 'utf8' })
    const out = py.stdout?.trim() || ''
    if (out && !py.error) {
      const data = JSON.parse(out)
      // Skroutz autocomplete returns `{suggestions: [...]}` 
      // Our fallback returns `[{name, url, ...}]`
      const suggestions = data.suggestions || data
      return NextResponse.json({ suggestions: Array.isArray(suggestions) ? suggestions : [suggestions] })
    }
  } catch {}

  // Absolute fallback
  return NextResponse.json({
    suggestions: [{ name: query, price: null, url: '', image_url: null }],
  })
}
