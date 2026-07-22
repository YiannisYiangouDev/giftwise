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

    const { questionId, type } = await req.json()
    if (!questionId || !type) {
      return NextResponse.json({ error: 'Question ID and Type are required' }, { status: 400 })
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch the QA message details
    const { data: qa, error: qaErr } = await adminClient
      .from('santa_qa_messages')
      .select('group_id, giver_user_id, receiver_user_id, question, answer')
      .eq('id', questionId)
      .single()

    if (qaErr || !qa) {
      return NextResponse.json({ error: qaErr?.message || 'QA message not found' }, { status: 404 })
    }

    // Fetch group details
    const { data: group } = await adminClient
      .from('secret_santa_groups')
      .select('name')
      .eq('id', qa.group_id)
      .single()

    const targetUserId = type === 'question' ? qa.receiver_user_id : qa.giver_user_id

    // Send Web Push notification
    sendPushToUser(
      targetUserId,
      {
        title: type === 'question' ? '💬 Secret Santa Question' : '💬 Question Answered!',
        body: type === 'question'
          ? `Your Secret Santa asked: "${qa.question}"`
          : `Your match answered: "${qa.answer}"`,
        url: `/secret-santa/${qa.group_id}`,
        tag: `qa-${questionId}`,
      },
      'notify_secret_santa'
    ).catch((err: any) => console.error('Push error in QA:', err))

    // Fetch recipient email
    const { data: userData, error: userErr } = await adminClient.auth.admin.getUserById(targetUserId)
    const targetEmail = userData.user?.email

    if (userErr || !targetEmail) {
      return NextResponse.json({ error: userErr?.message || 'Recipient email not found' }, { status: 404 })
    }

    let subject = ''
    let htmlContent = ''

    if (type === 'question') {
      subject = `💬 Secret Santa: New Question for ${group?.name || 'Group'}`
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
          <h2 style="color: #c5a880; font-weight: normal; margin-bottom: 20px;">New Anonymous Question</h2>
          <p>Your Secret Santa in <strong>${group?.name || 'Secret Santa Group'}</strong> has sent you a question:</p>
          <blockquote style="background: #fdfcf7; border-left: 4px solid #c5a880; margin: 20px 0; padding: 15px; font-style: italic; border-radius: 0 8px 8px 0;">
            "${qa.question}"
          </blockquote>
          <p style="margin-top: 30px;">
            <a href="https://giftwise.shillopelloi.com/secret-santa/${qa.group_id}" 
               style="background: linear-gradient(to right, #c5a880, #a28359); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reply to Question →
            </a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
          <p style="font-size: 11px; color: #999;">This is an automated notification from your family GiftWise platform.</p>
        </div>
      `
    } else {
      subject = `💬 Secret Santa: Your match answered your question!`
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
          <h2 style="color: #c5a880; font-weight: normal; margin-bottom: 20px;">Question Answered!</h2>
          <p>Your match in <strong>${group?.name || 'Secret Santa Group'}</strong> has answered your question:</p>
          <p style="color: #666; font-size: 13px; margin-bottom: 5px;"><strong>Your Question:</strong></p>
          <blockquote style="margin: 0 0 15px 0; padding-left: 10px; border-left: 2px solid #ddd; color: #777;">
            "${qa.question}"
          </blockquote>
          <p style="color: #666; font-size: 13px; margin-bottom: 5px;"><strong>Their Answer:</strong></p>
          <blockquote style="background: #fdfcf7; border-left: 4px solid #c5a880; margin: 0 0 20px 0; padding: 15px; font-style: italic; border-radius: 0 8px 8px 0;">
            "${qa.answer}"
          </blockquote>
          <p style="margin-top: 30px;">
            <a href="https://giftwise.shillopelloi.com/secret-santa/${qa.group_id}" 
               style="background: linear-gradient(to right, #c5a880, #a28359); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Go to Group →
            </a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
          <p style="font-size: 11px; color: #999;">This is an automated notification from your family GiftWise platform.</p>
        </div>
      `
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GiftWise <gwise@shillopelloi.com>',
        to: targetEmail,
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
