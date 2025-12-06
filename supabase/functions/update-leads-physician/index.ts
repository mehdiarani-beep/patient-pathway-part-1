import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { physicianId, doctorId } = await req.json()

    if (!physicianId || !doctorId) {
      throw new Error('Missing physicianId or doctorId')
    }

    // Update all leads for this doctor that have null physician_id
    const { data, error } = await supabaseAdmin
      .from('quiz_leads')
      .update({ physician_id: physicianId })
      .eq('doctor_id', doctorId)
      .is('physician_id', null)
      .select('id')

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: data?.length || 0,
        message: `Updated ${data?.length || 0} leads with physician_id`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
