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

    const { postId, platforms } = await req.json()

    if (!postId || !platforms || !Array.isArray(platforms)) {
      throw new Error('Missing required parameters: postId and platforms')
    }

    // Get the post data
    const { data: post, error: postError } = await supabaseClient
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError) throw postError
    if (!post) throw new Error('Post not found')

    // Get connected social accounts for the platforms
    const { data: accounts, error: accountsError } = await supabaseClient
      .from('social_accounts')
      .select('*')
      .eq('doctor_id', post.doctor_id)
      .in('platform', platforms)
      .eq('connected', true)

    if (accountsError) throw accountsError

    const results = []
    const errors = []

    // Publish to each platform
    for (const platform of platforms) {
      const account = accounts?.find(acc => acc.platform === platform)
      
      if (!account) {
        errors.push({
          platform,
          error: 'No connected account found for this platform'
        })
        continue
      }

      try {
        let result
        switch (platform) {
          case 'facebook':
            result = await publishToFacebook(post, account)
            break
          case 'instagram':
            result = await publishToInstagram(post, account)
            break
          case 'twitter':
            result = await publishToTwitter(post, account)
            break
          case 'linkedin':
            result = await publishToLinkedIn(post, account)
            break
          case 'youtube':
            result = await publishToYouTube(post, account)
            break
          default:
            throw new Error(`Unsupported platform: ${platform}`)
        }

        if (result && 'id' in result) {
          results.push({
            platform,
            success: true,
            externalId: result.id,
            url: result.url
          })

          // Update platform-specific record
          await supabaseClient
            .from('social_post_platforms')
            .update({
              status: 'published',
              external_post_id: result.id,
              published_at: new Date().toISOString()
            })
            .eq('post_id', postId)
            .eq('platform', platform)
        }

      } catch (error: any) {
        console.error(`Error publishing to ${platform}:`, error)
        errors.push({
          platform,
          error: error.message
        })

        // Update platform-specific record with error
        await supabaseClient
          .from('social_post_platforms')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('post_id', postId)
          .eq('platform', platform)
      }
    }

    // Update main post status
    const hasErrors = errors.length > 0
    const hasSuccesses = results.length > 0

    let status = 'failed'
    let errorMessage = null

    if (hasSuccesses && !hasErrors) {
      status = 'published'
    } else if (hasSuccesses && hasErrors) {
      status = 'partial'
      errorMessage = `Partial success. Errors: ${errors.map(e => `${e.platform}: ${e.error}`).join(', ')}`
    } else {
      errorMessage = errors.map(e => `${e.platform}: ${e.error}`).join(', ')
    }

    await supabaseClient
      .from('social_posts')
      .update({
        status,
        published_at: hasSuccesses ? new Date().toISOString() : null,
        external_post_id: results[0]?.externalId || null,
        external_url: results[0]?.url || null,
        error_message: errorMessage
      })
      .eq('id', postId)

    return new Response(
      JSON.stringify({
        success: hasSuccesses,
        results,
        errors,
        status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error('Error in publish-to-social function:', error)
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

async function publishToFacebook(post: any, account: any) {
  const { content, image_url, hashtags } = post
  
  // Format content with hashtags
  const message = content + (hashtags?.length ? '\n\n' + hashtags.join(' ') : '')
  
  const payload: any = {
    message,
    access_token: account.access_token
  }

  // Add image if available
  if (image_url) {
    payload.link = image_url
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${account.page_id}/feed`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Facebook API error: ${error}`)
  }

  const result = await response.json()
  
  return {
    id: result.id,
    url: `https://facebook.com/${result.id}`
  }
}

async function publishToInstagram(post: any, account: any) {
  const { content, image_url, hashtags } = post
  
  if (!image_url) {
    throw new Error('Instagram requires an image')
  }

  // Step 1: Create media container
  const caption = content + (hashtags?.length ? '\n\n' + hashtags.join(' ') : '')
  
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${account.page_id}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url,
        caption,
        access_token: account.access_token
      })
    }
  )

  if (!containerResponse.ok) {
    const error = await containerResponse.text()
    throw new Error(`Instagram container error: ${error}`)
  }

  const container = await containerResponse.json()

  // Step 2: Publish the media
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${account.page_id}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: account.access_token
      })
    }
  )

  if (!publishResponse.ok) {
    const error = await publishResponse.text()
    throw new Error(`Instagram publish error: ${error}`)
  }

  const result = await publishResponse.json()
  
  return {
    id: result.id,
    url: `https://instagram.com/p/${result.id}`
  }
}

async function publishToTwitter(post: any, account: any) {
  const { content, hashtags } = post
  
  // Twitter API v2
  const text = content + (hashtags?.length ? '\n\n' + hashtags.join(' ') : '')
  
  const response = await fetch(
    'https://api.twitter.com/2/tweets',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.substring(0, 280) // Twitter character limit
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Twitter API error: ${error}`)
  }

  const result = await response.json()
  
  return {
    id: result.data.id,
    url: `https://twitter.com/user/status/${result.data.id}`
  }
}

async function publishToLinkedIn(post: any, account: any) {
  const { content, image_url, hashtags } = post
  
  // LinkedIn API v2
  const text = {
    text: content + (hashtags?.length ? '\n\n' + hashtags.join(' ') : '')
  }

  const payload: any = {
    author: `urn:li:person:${account.page_id}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: text,
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  }

  // Add image if available
  if (image_url) {
    payload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE'
    payload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
      status: 'READY',
      description: { text },
      media: image_url,
      title: { text: 'Shared Image' }
    }]
  }

  const response = await fetch(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(payload)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn API error: ${error}`)
  }

  const result = await response.json()
  
  return {
    id: result.id,
    url: `https://linkedin.com/feed/update/${result.id}`
  }
}

async function publishToYouTube(post: any, account: any) {
  // YouTube requires video content, not suitable for text posts
  // This would need to be implemented differently for video uploads
  throw new Error('YouTube publishing requires video content and is not supported for text posts')
}
