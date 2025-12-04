import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { invitationCode } = await req.json()
    if (!invitationCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invitation code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: invitation, error: inviteError } = await supabaseClient
      .from('clinic_members')
      .select('id, clinic_id, role, status, invitation_token, token_expires_at')
      .eq('invitation_token', invitationCode)
      .single()

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid clinic code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (invitation.role !== 'doctor') {
      return new Response(
        JSON.stringify({ success: false, error: 'This code is not valid for doctor accounts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (invitation.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: 'This invitation was already used or revoked' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (invitation.token_expires_at) {
      const expiresAt = new Date(invitation.token_expires_at)
      if (expiresAt.getTime() < Date.now()) {
        return new Response(
          JSON.stringify({ success: false, error: 'This invitation has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const { data: clinicProfile, error: clinicError } = await supabaseClient
      .from('clinic_profiles')
      .select('clinic_name')
      .eq('id', invitation.clinic_id)
      .single()

    if (clinicError || !clinicProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Clinic not found for this invitation' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: updateInviteError } = await supabaseClient
      .from('clinic_members')
      .update({
        status: 'active',
        accepted_at: new Date().toISOString(),
        user_id: user.id,
      })
      .eq('id', invitation.id)

    if (updateInviteError) {
      console.error('Error updating clinic invitation:', updateInviteError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update clinic invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: existingDoctor, error: doctorError } = await supabaseClient
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let doctorId = existingDoctor?.id

    if (!existingDoctor) {
      const { data: newDoctor, error: createDoctorError } = await supabaseClient
        .from('doctor_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || 'Doctor',
          last_name: user.user_metadata?.last_name || 'Account',
          clinic_id: invitation.clinic_id,
          clinic_name: clinicProfile.clinic_name ?? 'Clinic',
          access_control: true,
        })
        .select('id')
        .single()

      if (createDoctorError || !newDoctor) {
        console.error('Error creating doctor profile:', createDoctorError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create doctor profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      doctorId = newDoctor.id
    } else if (doctorId) {
      const { error: updateDoctorError } = await supabaseClient
        .from('doctor_profiles')
        .update({
          clinic_id: invitation.clinic_id,
          clinic_name: clinicProfile.clinic_name ?? existingDoctor.clinic_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doctorId)

      if (updateDoctorError) {
        console.error('Error updating doctor profile:', updateDoctorError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update doctor profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        clinicId: invitation.clinic_id,
        doctorProfileId: doctorId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in join-clinic-by-code function:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


