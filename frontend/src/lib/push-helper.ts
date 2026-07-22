import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || 'mailto:gwise@shillopelloi.com'

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export type PushCategory = 'notify_price_drops' | 'notify_secret_santa' | 'notify_contributions'

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload, category?: PushCategory) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey || !publicKey || !privateKey) {
      console.warn('Web push skipping: VAPID or Supabase credentials missing.')
      return
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let query = adminClient.from('push_subscriptions').select('*').eq('user_id', userId)
    if (category) {
      query = query.eq(category, true)
    }

    const { data: subs, error } = await query

    if (error || !subs || subs.length === 0) {
      return
    }

    const payloadString = JSON.stringify(payload)

    const dispatchPromises = subs.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        await webpush.sendNotification(pushSubscription, payloadString)
      } catch (err: any) {
        // If subscription has expired or is invalid (410 Gone / 404 Not Found), remove from DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await adminClient.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error(`Error sending push notification to sub ${sub.id}:`, err.message || err)
        }
      }
    })

    await Promise.allSettled(dispatchPromises)
  } catch (err) {
    console.error('sendPushToUser error:', err)
  }
}
