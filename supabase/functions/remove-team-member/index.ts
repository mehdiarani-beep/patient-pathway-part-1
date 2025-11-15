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
    // Create a Supabase client with the service role key
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the request body
    const { teamMemberId, doctorId } = await req.json()

    if (!teamMemberId || !doctorId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the calling user is the doctor who owns this team member
    const { data: doctorProfile, error: doctorError } = await supabaseClient
      .from('doctor_profiles')
      .select('*')
      .eq('id', doctorId)
      .eq('user_id', user.id)
      .single()

    if (doctorError || !doctorProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: You can only remove team members from your own clinic' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the team member record to find the linked user
    const { data: teamMember, error: teamError } = await supabaseClient
      .from('team_members')
      .select('*')
      .eq('id', teamMemberId)
      .eq('doctor_id', doctorId)
      .single()

    if (teamError || !teamMember) {
      return new Response(
        JSON.stringify({ success: false, error: 'Team member not found or does not belong to your clinic' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Starting team member removal:', {
      teamMemberId: teamMember.id,
      email: teamMember.email,
      linked_user_id: teamMember.linked_user_id
    })

    let deletionSummary = {
      deletedClinicMembers: 0,
      deletedTeamMembers: 0,
      deletedDoctorProfiles: 0,
      deletedAuthUser: false,
      userId: teamMember.linked_user_id,
      errors: [] as string[]
    }

    // Use linked_user_id from team_members table
    const targetUserId = teamMember.linked_user_id

    // Step 1: Delete from clinic_members table (by user_id or email)
    if (targetUserId) {
      console.log('Step 1a: Deleting from clinic_members by user_id:', targetUserId)
      const { error: clinicMemberError } = await supabaseClient
        .from('clinic_members')
        .delete()
        .eq('user_id', targetUserId)
      
      if (clinicMemberError) {
        console.error('Error deleting from clinic_members by user_id:', clinicMemberError)
        deletionSummary.errors.push(`clinic_members (user_id): ${clinicMemberError.message}`)
      } else {
        deletionSummary.deletedClinicMembers++
        console.log('Successfully deleted from clinic_members by user_id')
      }
    }

    // Also delete by email as fallback
    if (teamMember.email) {
      console.log('Step 1b: Deleting from clinic_members by email:', teamMember.email)
      const { error: clinicMemberEmailError } = await supabaseClient
        .from('clinic_members')
        .delete()
        .eq('email', teamMember.email)
      
      if (clinicMemberEmailError) {
        console.error('Error deleting from clinic_members by email:', clinicMemberEmailError)
      } else {
        deletionSummary.deletedClinicMembers++
        console.log('Successfully deleted from clinic_members by email')
      }
    }

    // Step 2: Delete from team_members table
    console.log('Step 2: Deleting from team_members:', teamMemberId)
    const { error: teamDeleteError } = await supabaseClient
      .from('team_members')
      .delete()
      .eq('id', teamMemberId)

    if (teamDeleteError) {
      console.error('Error deleting team member:', teamDeleteError)
      deletionSummary.errors.push(`team_members: ${teamDeleteError.message}`)
    } else {
      deletionSummary.deletedTeamMembers++
      console.log('Successfully deleted team member')
    }

    // Step 3: Delete the doctor profile if linked user exists
    if (targetUserId) {
      console.log('Step 3: Deleting doctor profile for user_id:', targetUserId)
      
      // First get the doctor profile ID(s) for this user
      const { data: doctorProfiles, error: profileFetchError } = await supabaseClient
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', targetUserId)

      if (profileFetchError) {
        console.error('Error fetching doctor profiles:', profileFetchError)
        deletionSummary.errors.push(`fetch doctor_profiles: ${profileFetchError.message}`)
      } else if (doctorProfiles && doctorProfiles.length > 0) {
        const profileIds = doctorProfiles.map(p => p.id)
        console.log('Found doctor profiles to delete:', profileIds)
        
        // Delete the profiles
        const { error: profileDeleteError } = await supabaseClient
          .from('doctor_profiles')
          .delete()
          .eq('user_id', targetUserId)

        if (profileDeleteError) {
          console.error('Error deleting doctor profile:', profileDeleteError)
          deletionSummary.errors.push(`doctor_profiles: ${profileDeleteError.message}`)
        } else {
          deletionSummary.deletedDoctorProfiles = doctorProfiles.length
          console.log('Successfully deleted doctor profiles:', doctorProfiles.length)
        }
      }
    }

    // Step 4: Delete the auth user (last step)
    if (targetUserId) {
      console.log('Step 4: Deleting auth user:', targetUserId)
      const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(targetUserId)

      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError)
        deletionSummary.errors.push(`auth.users: ${authDeleteError.message}`)
      } else {
        deletionSummary.deletedAuthUser = true
        console.log('Successfully deleted auth user')
      }
    }

    // Determine if the operation was successful
    const isSuccess = deletionSummary.deletedTeamMembers > 0 || deletionSummary.deletedClinicMembers > 0

    return new Response(
      JSON.stringify({
        success: isSuccess,
        message: isSuccess 
          ? 'Team member removed successfully'
          : 'Failed to remove team member',
        summary: deletionSummary,
        teamMemberEmail: teamMember.email,
        teamMemberName: `${teamMember.first_name || ''} ${teamMember.last_name || ''}`.trim()
      }),
      { 
        status: isSuccess ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error in remove-team-member function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
