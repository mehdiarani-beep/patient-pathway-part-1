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

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      throw new Error(`OAuth error: ${error}`)
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter')
    }

    // Verify state and get doctor info
    const { data: stateData, error: stateError } = await supabaseClient
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (stateError || !stateData) {
      throw new Error('Invalid or expired state')
    }

    const { doctor_id, platform } = stateData

    // Get environment variables
    const clientId = Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`)
    const clientSecret = Deno.env.get(`${platform.toUpperCase()}_CLIENT_SECRET`)
    
    if (!clientId || !clientSecret) {
      throw new Error(`${platform} credentials not configured`)
    }

    // Exchange code for tokens
    let tokens: any
    switch (platform) {
      case 'facebook':
      case 'instagram':
        tokens = await exchangeFacebookCode(code, clientId, clientSecret, url.origin + '/api/oauth-callback')
        break
      case 'twitter':
        tokens = await exchangeTwitterCode(code, clientId, clientSecret, url.origin + '/api/oauth-callback')
        break
      case 'linkedin':
        tokens = await exchangeLinkedInCode(code, clientId, clientSecret, url.origin + '/api/oauth-callback')
        break
      case 'youtube':
        tokens = await exchangeYouTubeCode(code, clientId, clientSecret, url.origin + '/api/oauth-callback')
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    // Get user info from platform
    const userInfo = await getUserInfo(platform, tokens.access_token)

    // Store/update social account
    const accountData = {
      doctor_id: doctor_id,
      platform: platform,
      username: userInfo.username || userInfo.name,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      connected: true,
      expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
      last_sync_at: new Date().toISOString(),
      permissions: userInfo.permissions || {}
    }

    // Upsert social account
    const { data: account, error: accountError } = await supabaseClient
      .from('social_accounts')
      .upsert(accountData, {
        onConflict: 'doctor_id,platform',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (accountError) throw accountError

    // Clean up state
    await supabaseClient
      .from('oauth_states')
      .delete()
      .eq('state', state)

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          id: account.id,
          platform: account.platform,
          username: account.username,
          connected: account.connected
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error('Error in oauth-callback function:', error)
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

async function exchangeFacebookCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Facebook token exchange error: ${error}`)
  }

  return await response.json()
}

async function exchangeTwitterCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: 'challenge' // Should match the challenge used in auth URL
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Twitter token exchange error: ${error}`)
  }

  return await response.json()
}

async function exchangeLinkedInCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn token exchange error: ${error}`)
  }

  return await response.json()
}

async function exchangeYouTubeCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`YouTube token exchange error: ${error}`)
  }

  return await response.json()
}

async function getUserInfo(platform: string, accessToken: string) {
  switch (platform) {
    case 'facebook':
      return await getFacebookUserInfo(accessToken)
    case 'instagram':
      return await getInstagramUserInfo(accessToken)
    case 'twitter':
      return await getTwitterUserInfo(accessToken)
    case 'linkedin':
      return await getLinkedInUserInfo(accessToken)
    case 'youtube':
      return await getYouTubeUserInfo(accessToken)
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

async function getFacebookUserInfo(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name,accounts{id,name,category}&access_token=${accessToken}`
  )

  if (!response.ok) {
    throw new Error('Failed to get Facebook user info')
  }

  const data = await response.json()
  
  // Get the first page for posting
  const page = data.accounts?.data?.[0]
  
  return {
    id: data.id,
    name: data.name,
    username: data.name,
    page_id: page?.id,
    permissions: ['pages_manage_posts', 'pages_read_engagement']
  }
}

async function getInstagramUserInfo(accessToken: string) {
  // First get Facebook pages to find Instagram accounts
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  )

  if (!response.ok) {
    throw new Error('Failed to get Instagram user info')
  }

  const data = await response.json()
  
  // Find Instagram business account
  for (const page of data.data || []) {
    try {
      const instagramResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
      )
      
      if (instagramResponse.ok) {
        const instagramData = await instagramResponse.json()
        if (instagramData.instagram_business_account) {
          const igAccount = instagramData.instagram_business_account
          
          return {
            id: igAccount.id,
            name: page.name,
            username: page.name,
            page_id: igAccount.id,
            permissions: ['instagram_basic', 'instagram_content_publish']
          }
        }
      }
    } catch (error) {
      console.log(`Page ${page.id} doesn't have Instagram account`)
    }
  }

  throw new Error('No Instagram business account found')
}

async function getTwitterUserInfo(accessToken: string) {
  const response = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=username,name',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get Twitter user info')
  }

  const data = await response.json()
  
  return {
    id: data.data.id,
    name: data.data.name,
    username: data.data.username,
    permissions: ['tweet.read', 'tweet.write']
  }
}

async function getLinkedInUserInfo(accessToken: string) {
  const response = await fetch(
    'https://api.linkedin.com/v2/me',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get LinkedIn user info')
  }

  const data = await response.json()
  
  return {
    id: data.id,
    name: `${data.firstName.localized.en_US} ${data.lastName.localized.en_US}`,
    username: data.localizedFirstName?.en_US || data.firstName.localized.en_US,
    permissions: ['w_member_social']
  }
}

async function getYouTubeUserInfo(accessToken: string) {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get YouTube user info')
  }

  const data = await response.json()
  const channel = data.items?.[0]
  
  if (!channel) {
    throw new Error('No YouTube channel found')
  }

  return {
    id: channel.id,
    name: channel.snippet.title,
    username: channel.snippet.title,
    permissions: ['youtube.upload']
  }
}
