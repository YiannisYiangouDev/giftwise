import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { relationship, notes, age, budgetMin, budgetMax } = await req.json()

    // Prompt construction
    const prompt = `You are an expert personal shopping assistant. Generate a list of 5 creative, highly-personalized gift recommendations for a recipient with the following profile:
    - Relationship: ${relationship || 'Friend'}
    - Age/Birthday Context: ${age || 'Unknown age'}
    - Budget Range: €${budgetMin || 0} - €${budgetMax || 150}
    - Recipient Notes: ${notes || 'No specific notes'}

    Provide details for each gift: name, description, estimated price in Euros, and why this is a good match based on their profile.`

    const apiKey = process.env.GEMINI_API_KEY

    // Fallback Mock Data if API key is not configured yet
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined. Returning high-quality mock recommendations.')
      return NextResponse.json({
        ideas: [
          {
            name: 'Luxury Scented Soy Candle Set',
            description: 'A hand-poured set of three relaxing wood-wick soy candles (sandalwood, amber, and sea salt) in minimalist matte ceramic jars.',
            price: 34.99,
            reasoning: 'Matches a relaxing notes profile and fits comfortably in the budget.'
          },
          {
            name: 'Minimalist Leather Cardholder',
            description: 'Ultra-slim full-grain leather card sleeve designed to fit up to 6 cards and folded cash cleanly.',
            price: 25.00,
            reasoning: 'A timeless, sleek, and highly practical daily-carry item matching a luxury minimalist aesthetic.'
          },
          {
            name: 'Premium Loose Leaf Tea Sampler',
            description: 'An elegant selection of 6 organic herbal and green teas complete with a fine-mesh stainless steel infuser.',
            price: 19.50,
            reasoning: 'Perfect for cozy winter months or someone who loves artisanal tea and warm drinks.'
          },
          {
            name: 'Wireless Desktop Charging Pad',
            description: 'Fast-charging Qi-certified desktop charger wrapped in premium grey felt and aluminum casing.',
            price: 42.00,
            reasoning: 'Keeps desktop layouts cable-free and clutter-free, matching modern clean styling.'
          },
          {
            name: 'Artisanal Chocolate & Wine Pairing Kit',
            description: 'A curated box of single-origin dark chocolates paired with a tasting guide for red wines.',
            price: 29.99,
            reasoning: 'An excellent choice for social gatherings, anniversaries, or celebratory occasions.'
          }
        ]
      })
    }

    // Call Gemini API REST endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                ideas: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      name: { type: 'STRING' },
                      description: { type: 'STRING' },
                      price: { type: 'NUMBER' },
                      reasoning: { type: 'STRING' }
                    },
                    required: ['name', 'description', 'price', 'reasoning']
                  }
                }
              },
              required: ['ideas']
            }
          }
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error: ${errText}`)
    }

    const responseJson = await response.json()
    const contentText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text
    if (!contentText) {
      throw new Error('Empty response from Gemini API')
    }

    return NextResponse.json(JSON.parse(contentText))
  } catch (error: any) {
    console.error('Error fetching gift ideas:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch gift ideas' }, { status: 500 })
  }
}
