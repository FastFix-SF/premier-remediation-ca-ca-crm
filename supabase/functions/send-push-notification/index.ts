import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create } from 'https://deno.land/x/djwt@v2.9.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationRequest {
  userId: string
  title: string
  body: string
  data?: Record<string, any>
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600

  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry
  }

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const jwt = await create(header, payload, privateKey)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })

  const data = await response.json()
  return data.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, title, body, data = {} }: PushNotificationRequest = await req.json()

    // Get all device tokens for this user
    const { data: devices, error: devicesError } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)

    if (devicesError) {
      throw devicesError
    }

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No devices registered for this user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Store notification in database
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        data
      })

    if (notifError) {
      console.error('Error storing notification:', notifError)
    }

    // Group devices by platform
    const iosDevices = devices.filter(d => d.platform === 'ios')
    const androidDevices = devices.filter(d => d.platform === 'android')

    const results = []

    // Try to use FCM API V1 first (modern approach)
    const fcmServiceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT')
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    
    if (!fcmServiceAccountJson && !fcmServerKey) {
      console.log('FCM not configured - notifications will not be sent')
      return new Response(
        JSON.stringify({ 
          message: 'Push notifications not configured. Please set FCM_SERVICE_ACCOUNT or FCM_SERVER_KEY in Supabase secrets.',
          totalDevices: devices.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Use modern FCM API V1 if service account is available
    if (fcmServiceAccountJson) {
      try {
        const serviceAccount = JSON.parse(fcmServiceAccountJson)
        const accessToken = await getAccessToken(serviceAccount)
        const projectId = serviceAccount.project_id

        // Send to all devices via FCM v1
        for (const device of devices) {
          try {
            const response = await fetch(
              `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                  message: {
                    token: device.device_token,
                    notification: {
                      title,
                      body
                    },
                    data: {
                      ...data,
                      click_action: 'FLUTTER_NOTIFICATION_CLICK'
                    },
                    android: {
                      priority: 'high',
                      notification: {
                        sound: 'default',
                        badge: 1
                      }
                    },
                    apns: {
                      payload: {
                        aps: {
                          sound: 'default',
                          badge: 1
                        }
                      }
                    }
                  }
                })
              }
            )

            const result = await response.json()
            
            // If token is invalid, deactivate the device
            if (response.status === 404 || result.error?.code === 'NOT_FOUND' || result.error?.status === 'NOT_FOUND') {
              await supabase
                .from('user_devices')
                .update({ is_active: false })
                .eq('id', device.id)
              console.log(`Deactivated invalid device token: ${device.id}`)
            }
            
            results.push({ platform: device.platform, deviceId: device.id, result, api: 'v1' })
          } catch (error) {
            console.error(`Error sending to device ${device.id}:`, error)
            results.push({ platform: device.platform, deviceId: device.id, error: error.message, api: 'v1' })
          }
        }
      } catch (error) {
        console.error('Error with FCM API V1:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to send notifications via FCM API V1: ' + error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    } 
    // Fall back to legacy FCM API
    else if (fcmServerKey) {
      // Send to all devices via FCM (works for both iOS and Android when configured with Capacitor)
      for (const device of devices) {
        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${fcmServerKey}`
            },
            body: JSON.stringify({
              to: device.device_token,
              notification: {
                title,
                body,
                sound: 'default',
                badge: 1
              },
              data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
              },
              priority: 'high'
            })
          })

          const result = await response.json()
          
          // If token is invalid, deactivate the device
          if (result.failure === 1 && result.results?.[0]?.error === 'InvalidRegistration') {
            await supabase
              .from('user_devices')
              .update({ is_active: false })
              .eq('id', device.id)
            console.log(`Deactivated invalid device token: ${device.id}`)
          }
          
          results.push({ platform: device.platform, deviceId: device.id, result, api: 'legacy' })
        } catch (error) {
          console.error(`Error sending to device ${device.id}:`, error)
          results.push({ platform: device.platform, deviceId: device.id, error: error.message, api: 'legacy' })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent',
        results,
        totalDevices: devices.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
