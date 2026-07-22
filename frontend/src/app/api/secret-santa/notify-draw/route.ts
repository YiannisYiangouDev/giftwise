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

    const { groupId } = await req.json()
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch the group name and details
    const { data: group, error: groupErr } = await adminClient
      .from('secret_santa_groups')
      .select('name, budget')
      .eq('id', groupId)
      .single()

    if (groupErr || !group) {
      return NextResponse.json({ error: groupErr?.message || 'Group not found' }, { status: 404 })
    }

    // Fetch participants
    const { data: participants, error: partErr } = await adminClient
      .from('secret_santa_participants')
      .select('user_id')
      .eq('group_id', groupId)

    if (partErr || !participants) {
      return NextResponse.json({ error: partErr?.message || 'Participants not found' }, { status: 404 })
    }

    // Send emails & web push in parallel to all participants
    const notificationPromises = participants.map(async (p) => {
      // 1. Web Push Notification
      sendPushToUser(
        p.user_id,
        {
          title: '🎁 Secret Santa Draw Complete!',
          body: `Names have been drawn for ${group.name}! Tap to reveal your match.`,
          url: `/secret-santa/${groupId}`,
          tag: `draw-${groupId}`,
        },
        'notify_secret_santa'
      ).catch(err => console.error('Push error in draw:', err))

      // 2. Resend Email
      const { data: userData } = await adminClient.auth.admin.getUserById(p.user_id)
      const userEmail = userData.user?.email

      if (!userEmail) return

      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GiftWise <gwise@shillopelloi.com>',
          to: userEmail,
          subject: `🎁 Secret Santa: Names have been drawn for ${group.name}!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
              <h2 style="color: #c5a880; font-weight: normal; margin-bottom: 20px;">Secret Santa Draw Complete!</h2>
              <p>The names have been drawn for the group: <strong>${group.name}</strong>.</p>
              ${group.budget ? `<p>The budget limit is: <strong>€${group.budget}</strong></p>` : ''}
              <p style="margin-top: 30px;">
                <a href="https://giftwise.shillopelloi.com/secret-santa/${groupId}" 
                   style="background: linear-gradient(to right, #c5a880, #a28359); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reveal Your Match →
                </a>
              </p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
              <p style="font-size: 11px; color: #999;">This is an automated notification from your family GiftWise platform.</p>
            </div>
          `,
        }),
      })
    })

    await Promise.allSettled(notificationPromises)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
