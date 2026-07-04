import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not set' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['extract'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              product_name: { type: 'string', description: 'Full product name / title' },
              price: { type: 'number', description: 'Current price in EUR as a number, no currency symbol' },
              image_url: { type: 'string', description: 'URL of the main product image' },
              in_stock: { type: 'boolean', description: 'Whether the product is currently in stock' },
            },
            required: ['product_name'],
          },
        },
      }),
    })

    if (!scrapeRes.ok) {
      const text = await scrapeRes.text()
      return new Response(JSON.stringify({ error: `Firecrawl error: ${text}` }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const scrapeData = await scrapeRes.json()
    const extracted = scrapeData?.data?.extract ?? {}

    return new Response(
      JSON.stringify({
        product_name: extracted.product_name ?? null,
        price: extracted.price ?? null,
        image_url: extracted.image_url ?? null,
        in_stock: extracted.in_stock ?? true,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
