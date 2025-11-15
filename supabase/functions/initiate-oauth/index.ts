import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { platform, doctorId, redirectUrl } = await req.json()

    if (!platform || !doctorId || !redirectUrl) {
      throw new Error('Missing required parameters: platform, doctorId, redirectUrl')
    }

    // Get environment variables for OAuth
    const clientId = Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`)
    const clientSecret = Deno.env.get(`${platform.toUpperCase()}_CLIENT_SECRET`)
    
    if (!clientId) {
      throw new Error(`${platform} client ID not configured`)
    }

    let authUrl: string
    let state: string

    switch (platform) {
      case 'facebook':
      case 'instagram':
        state = generateState(doctorId, platform)
        authUrl = generateFacebookAuthUrl(clientId, redirectUrl, state)
        break
      case 'twitter':
        state = generateState(doctorId, platform)
        authUrl = generateTwitterAuthUrl(clientId, redirectUrl, state)
        break
      case 'linkedin':
        state = generateState(doctorId, platform)
        authUrl = generateLinkedInAuthUrl(clientId, redirectUrl, state)
        break
      case 'youtube':
        state = generateState(doctorId, platform)
        authUrl = generateYouTubeAuthUrl(clientId, redirectUrl, state)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    // Store state in database for verification
    await supabaseClient
      .from('oauth_states')
      .insert({
        state,
        doctor_id: doctorId,
        platform,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      })

    return new Response(
      JSON.stringify({
        success: true,
        authUrl,
        state
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error('Error in initiate-oauth function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function generateState(doctorId: string, platform: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  return `${doctorId}_${platform}_${timestamp}_${random}`
}

function generateFacebookAuthUrl(clientId: string, redirectUrl: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUrl,
    scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish',
    response_type: 'code',
    state,
    config_id: 'default'
  })
  
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
}

function generateTwitterAuthUrl(clientId: string, redirectUrl: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUrl,
    scope: 'tweet.read tweet.write users.read',
    state,
    code_challenge: 'challenge',
    code_challenge_method: 'plain'
  })
  
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`
}

function generateLinkedInAuthUrl(clientId: string, redirectUrl: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUrl,
    scope: 'w_member_social',
    state
  })
  
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

function generateYouTubeAuthUrl(clientId: string, redirectUrl: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUrl,
    scope: 'https://www.googleapis.com/auth/youtube.upload',
    response_type: 'code',
    state,
    access_type: 'offline',
    prompt: 'consent'
  })
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
