import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteClinicMemberRequest {
  clinicId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'manager' | 'staff' | 'doctor';
  permissions?: {
    leads: boolean;
    content: boolean;
    payments: boolean;
    team: boolean;
  };
  locationIds?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { clinicId, email, firstName, lastName, role, permissions, locationIds }: InviteClinicMemberRequest = await req.json()

    // Verify the requesting user has permission to invite members
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is owner or manager of the clinic
    const { data: memberCheck, error: memberError } = await supabaseClient
      .from('clinic_members')
      .select('role')
      .eq('clinic_id', clinicId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (memberError || !memberCheck || !['owner', 'manager'].includes(memberCheck.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to invite members' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email is already invited or is a member
    const { data: existingMember, error: existingError } = await supabaseClient
      .from('clinic_members')
      .select('id, status')
      .eq('clinic_id', clinicId)
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingMember) {
      if (existingMember.status === 'active') {
        return new Response(
          JSON.stringify({ error: 'This email is already a member of the clinic' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (existingMember.status === 'pending') {
        return new Response(
          JSON.stringify({ error: 'This email has already been invited to the clinic' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Set default permissions based on role
    const defaultPermissions = {
      leads: true,
      content: true,
      payments: role === 'manager',
      team: role === 'manager',
      ...permissions
    }

    // Create the invitation
    const { data: newMember, error: insertError } = await supabaseClient
      .from('clinic_members')
      .insert([{
        clinic_id: clinicId,
        email: email.toLowerCase().trim(),
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        role,
        permissions: defaultPermissions,
        status: 'pending',
        invited_by: user.id,
        invitation_token: invitationToken,
        token_expires_at: tokenExpiresAt.toISOString()
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating clinic member invitation:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign to locations if specified
    if (locationIds && locationIds.length > 0) {
      const locationAssignments = locationIds.map(locationId => ({
        clinic_member_id: newMember.id,
        location_id: locationId
      }))

      const { error: locationError } = await supabaseClient
        .from('clinic_member_locations')
        .insert(locationAssignments)

      if (locationError) {
        console.error('Error assigning locations:', locationError)
        // Don't fail the entire operation for location assignment errors
      }
    }

    // Get clinic information for email
    const { data: clinic, error: clinicError } = await supabaseClient
      .from('clinic_profiles')
      .select('clinic_name, clinic_slug')
      .eq('id', clinicId)
      .single()

    if (clinicError) {
      console.error('Error fetching clinic info:', clinicError)
    }

    // Send invitation email
    const { error: emailError } = await supabaseClient.functions.invoke('send-resend-email', {
      body: {
        to: email,
        subject: `You're invited to join ${clinic?.clinic_name || 'the clinic'}!`,
        template: 'clinic-invitation',
        templateData: {
          clinicName: clinic?.clinic_name || 'the clinic',
          inviterName: user.user_metadata?.full_name || 'A team member',
          invitationLink: `${Deno.env.get('SITE_URL')}/team-signup?invitation=${invitationToken}`,
          role: role.charAt(0).toUpperCase() + role.slice(1),
          expirationDays: 7
        }
      }
    })

    if (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the operation for email errors
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        member: newMember,
        invitationToken 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in invite-clinic-member function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

serve(handler)

