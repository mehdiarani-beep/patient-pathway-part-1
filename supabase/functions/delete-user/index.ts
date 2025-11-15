import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
          persistSession: false
        }
      }
    )

    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting comprehensive user deletion for userId:', userId)

    // Step 1: Get the doctor_profile ID(s) for this user
    const { data: doctorProfiles, error: profileError } = await supabaseClient
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', userId)

    if (profileError) {
      console.error('Error fetching doctor profiles:', profileError)
    }

    const doctorIds = doctorProfiles?.map(p => p.id) || []
    console.log('Found doctor profile IDs:', doctorIds)

    // Step 2: Delete from team_members table (where this user is a team member)
    console.log('Deleting from team_members where user_id matches...')
    const { error: teamMemberUserError } = await supabaseClient
      .from('team_members')
      .delete()
      .eq('user_id', userId)
    
    if (teamMemberUserError) {
      console.error('Error deleting team members by user_id:', teamMemberUserError)
    }

    // Step 3: Delete from team_members table (where user owns the doctor profile)
    if (doctorIds.length > 0) {
      console.log('Deleting from team_members where doctor_id matches...')
      const { error: teamMemberDoctorError } = await supabaseClient
        .from('team_members')
        .delete()
        .in('doctor_id', doctorIds)
      
      if (teamMemberDoctorError) {
        console.error('Error deleting team members by doctor_id:', teamMemberDoctorError)
      }
    }

    // Step 4: Delete from clinic_members table
    console.log('Deleting from clinic_members...')
    const { error: clinicMemberError } = await supabaseClient
      .from('clinic_members')
      .delete()
      .eq('user_id', userId)
    
    if (clinicMemberError) {
      console.error('Error deleting clinic members:', clinicMemberError)
    }

    // Step 5: Delete all data related to doctor profiles
    if (doctorIds.length > 0) {
      console.log('Deleting all doctor-related data...')

      // Delete quiz leads
      console.log('Deleting quiz_leads...')
      const { error: quizLeadsError } = await supabaseClient
        .from('quiz_leads')
        .delete()
        .in('doctor_id', doctorIds)
      if (quizLeadsError) console.error('Error deleting quiz_leads:', quizLeadsError)

      // Delete contacts
      console.log('Deleting contacts...')
      const { error: contactsError } = await supabaseClient
        .from('contacts')
        .delete()
        .in('doctor_id', doctorIds)
      if (contactsError) console.error('Error deleting contacts:', contactsError)

      // Delete custom quizzes
      console.log('Deleting custom_quizzes...')
      const { error: customQuizzesError } = await supabaseClient
        .from('custom_quizzes')
        .delete()
        .in('doctor_id', doctorIds)
      if (customQuizzesError) console.error('Error deleting custom_quizzes:', customQuizzesError)

      // Delete doctor notifications
      console.log('Deleting doctor_notifications...')
      const { error: notificationsError } = await supabaseClient
        .from('doctor_notifications')
        .delete()
        .in('doctor_id', doctorIds)
      if (notificationsError) console.error('Error deleting doctor_notifications:', notificationsError)

      // Delete email domains
      console.log('Deleting email_domains...')
      const { error: emailDomainsError } = await supabaseClient
        .from('email_domains')
        .delete()
        .in('doctor_id', doctorIds)
      if (emailDomainsError) console.error('Error deleting email_domains:', emailDomainsError)

      // Delete automation webhooks
      console.log('Deleting automation_webhooks...')
      const { error: webhooksError } = await supabaseClient
        .from('automation_webhooks')
        .delete()
        .in('doctor_id', doctorIds)
      if (webhooksError) console.error('Error deleting automation_webhooks:', webhooksError)

      // Delete email logs
      console.log('Deleting email_logs...')
      const { error: emailLogsError } = await supabaseClient
        .from('email_logs')
        .delete()
        .in('doctor_id', doctorIds)
      if (emailLogsError) console.error('Error deleting email_logs:', emailLogsError)

      // Delete short URLs
      console.log('Deleting short_urls...')
      const { error: shortUrlsError } = await supabaseClient
        .from('short_urls')
        .delete()
        .in('doctor_id', doctorIds)
      if (shortUrlsError) console.error('Error deleting short_urls:', shortUrlsError)

      // Delete social accounts
      console.log('Deleting social_accounts...')
      const { error: socialAccountsError } = await supabaseClient
        .from('social_accounts')
        .delete()
        .in('doctor_id', doctorIds)
      if (socialAccountsError) console.error('Error deleting social_accounts:', socialAccountsError)

      // Delete social posts
      console.log('Deleting social_posts...')
      const { error: socialPostsError } = await supabaseClient
        .from('social_posts')
        .delete()
        .in('doctor_id', doctorIds)
      if (socialPostsError) console.error('Error deleting social_posts:', socialPostsError)

      // Delete social media templates
      console.log('Deleting social_media_templates...')
      const { error: templatesError } = await supabaseClient
        .from('social_media_templates')
        .delete()
        .in('doctor_id', doctorIds)
      if (templatesError) console.error('Error deleting social_media_templates:', templatesError)

      // Delete email alias requests
      console.log('Deleting email_alias_requests...')
      const { error: aliasRequestsError } = await supabaseClient
        .from('email_alias_requests')
        .delete()
        .in('doctor_id', doctorIds)
      if (aliasRequestsError) console.error('Error deleting email_alias_requests:', aliasRequestsError)

      // Delete email aliases
      console.log('Deleting email_aliases...')
      const { error: aliasesError } = await supabaseClient
        .from('email_aliases')
        .delete()
        .in('doctor_id', doctorIds)
      if (aliasesError) console.error('Error deleting email_aliases:', aliasesError)

      // Delete AI landing pages (doctor_id is TEXT, need to convert)
      console.log('Deleting ai_landing_pages...')
      const doctorIdStrings = doctorIds.map(id => id.toString())
      const { error: aiPagesError } = await supabaseClient
        .from('ai_landing_pages')
        .delete()
        .in('doctor_id', doctorIdStrings)
      if (aiPagesError) console.error('Error deleting ai_landing_pages:', aiPagesError)

      // Delete generated content
      console.log('Deleting generated_content...')
      const { error: generatedContentError } = await supabaseClient
        .from('generated_content')
        .delete()
        .in('doctor_id', doctorIdStrings)
      if (generatedContentError) console.error('Error deleting generated_content:', generatedContentError)
    }

    // Step 6: Delete OAuth states
    console.log('Deleting oauth_states...')
    const { error: oauthError } = await supabaseClient
      .from('oauth_states')
      .delete()
      .eq('user_id', userId)
    if (oauthError) console.error('Error deleting oauth_states:', oauthError)

    // Step 7: Delete clinic profiles created by this user
    console.log('Deleting clinic_profiles...')
    const { error: clinicProfilesError } = await supabaseClient
      .from('clinic_profiles')
      .delete()
      .eq('created_by', userId)
    if (clinicProfilesError) console.error('Error deleting clinic_profiles:', clinicProfilesError)

    // Step 8: Delete doctor profiles (this should cascade to any remaining related tables)
    console.log('Deleting doctor_profiles...')
    const { error: deleteProfileError } = await supabaseClient
      .from('doctor_profiles')
      .delete()
      .eq('user_id', userId)

    if (deleteProfileError) {
      console.error('Error deleting doctor profiles:', deleteProfileError)
    }

    // Step 9: Finally, delete the auth user
    console.log('Deleting auth user...')
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      return new Response(
        JSON.stringify({ 
          error: authDeleteError.message,
          details: 'Failed to delete auth user after cleaning up related data'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully deleted user and all related data:', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User and all related data deleted successfully',
        deletedDoctorProfiles: doctorIds.length,
        userId: userId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
