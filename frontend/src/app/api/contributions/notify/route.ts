import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push-helper'

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendKey = process.env.RESEND_API_KEY

    if (!url || !serviceKey || !resendKey) {
      return NextResponse.json({ error: 'Missing configuration keys' }, { status: 500 })
    }

    const { contributionId } = await req.json()
    if (!contributionId) {
      return NextResponse.json({ error: 'Contribution ID is required' }, { status: 400 })
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch contribution details
    const { data: contrib, error: contribErr } = await adminClient
      .from('contributions')
      .select('amount, message, user_id, item_id')
      .eq('id', contributionId)
      .single()

    if (contribErr || !contrib) {
      return NextResponse.json({ error: contribErr?.message || 'Contribution not found' }, { status: 404 })
    }

    // Fetch item and wishlist details
    const { data: item } = await adminClient
      .from('wishlist_items')
      .select('product_name, wishlist_id')
      .eq('id', contrib.item_id)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 })
    }

    const { data: wishlist } = await adminClient
      .from('wishlists')
      .select('recipient_id')
      .eq('id', item.wishlist_id)
      .single()

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
    }

    const { data: recipient } = await adminClient
      .from('recipients')
      .select('user_id, name')
      .eq('id', wishlist.recipient_id)
      .single()

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Fetch contributor name
    const { data: contributorRec } = await adminClient
      .from('recipients')
      .select('name')
      .eq('user_id', contrib.user_id)
      .single()

    let contributorName = contributorRec?.name
    if (!contributorName) {
      const { data: userData } = await adminClient.auth.admin.getUserById(contrib.user_id)
      contributorName = userData.user?.user_metadata?.full_name || userData.user?.email || 'A family member'
    }

    // Send Web Push notification to recipient user
    sendPushToUser(
      recipient.user_id,
      {
        title: '💰 New Gift Contribution!',
        body: `${contributorName} contributed €${Number(contrib.amount).toFixed(2)} to ${item.product_name}!`,
        url: `/wishlists/${item.wishlist_id}`,
        tag: `contrib-${contributionId}`,
      },
      'notify_contributions'
    ).catch((err: any) => console.error('Push error in contribution:', err))

    // Fetch owner email
    const { data: ownerData, error: ownerErr } = await adminClient.auth.admin.getUserById(recipient.user_id)
    const ownerEmail = ownerData.user?.email

    if (ownerErr || !ownerEmail) {
      return NextResponse.json({ error: ownerErr?.message || 'Owner email not found' }, { status: 404 })
    }

    // Send notification email
    const subject = `💰 New Contribution to Group Gift: ${item.product_name}`
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
        <h2 style="color: #c5a880; font-weight: normal; margin-bottom: 20px;">New Contribution Received</h2>
        <p><strong>${contributorName}</strong> has chipped in and contributed to a group gift on <strong>${recipient.name}</strong>'s wishlist!</p>
        
        <div style="background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Gift:</strong> ${item.product_name}</p>
          <p style="margin: 0 0 10px 0;"><strong>Contribution:</strong> <span style="color: #2e7d32; font-weight: bold;">€${Number(contrib.amount).toFixed(2)}</span></p>
          ${contrib.message ? `<p style="margin: 0; color: #555;"><strong>Message:</strong> "${contrib.message}"</p>` : ''}
        </div>

        <p style="margin-top: 30px;">
          <a href="https://giftwise.shillopelloi.com/wishlists/${item.wishlist_id}" 
             style="background: linear-gradient(to right, #c5a880, #a28359); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            View Wishlist →
          </a>
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
        <p style="font-size: 11px; color: #999;">This is an automated notification from your family GiftWise platform.</p>
      </div>
    `

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GiftWise <gwise@shillopelloi.com>',
        to: ownerEmail,
        subject,
        html: htmlContent,
      }),
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      return NextResponse.json({ error: `Resend failed: ${errText}` }, { status: emailRes.status })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
