import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const leadData = await req.json()
    console.log('Processing lead submission:', leadData)

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'quiz_type', 'doctor_id', 'score']
    for (const field of requiredFields) {
      if (!leadData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Insert lead data
    const { data: lead, error } = await supabaseAdmin
      .from('quiz_leads')
      .insert([{
        ...leadData,
        submitted_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Get doctor profile for communication settings
    const { data: doctorProfile, error: doctorError } = await supabaseAdmin
      .from('doctor_profiles')
      .select('*')
      .eq('id', leadData.doctor_id)
      .single()

    if (doctorError) {
      console.warn('Could not fetch doctor profile for communications:', doctorError)
    }

    // Send doctor notification email via HTTP call to the edge function
    try {
      console.log('Calling send-doctor-notification edge function for lead:', lead.id)
      
      const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-doctor-notification`
      const functionKey = Deno.env.get('SUPABASE_ANON_KEY')
      
      console.log('Function URL:', functionUrl)
      console.log('Function key available:', !!functionKey)
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${functionKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          doctorId: leadData.doctor_id
        })
      })
      
      if (response.ok) {
        const notificationResult = await response.json()
        console.log('Doctor notification sent successfully:', notificationResult)
      } else {
        const errorText = await response.text()
        console.warn('Doctor notification edge function failed:', response.status, errorText)
      }
    } catch (commError) {
      console.warn('Doctor notification failed:', commError)
      // Don't fail the lead submission if communications fail
    }

    // Send patient confirmation email via HTTP call to the edge function
    try {
      console.log('Calling send-patient-confirmation edge function for lead:', lead.id)
      
      const patientFunctionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-patient-confirmation`
      const functionKey = Deno.env.get('SUPABASE_ANON_KEY')
      
      console.log('Patient confirmation function URL:', patientFunctionUrl)
      console.log('Function key available:', !!functionKey)
      
      const patientResponse = await fetch(patientFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${functionKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          doctorId: leadData.doctor_id
        })
      })
      
      if (patientResponse.ok) {
        const patientNotificationResult = await patientResponse.json()
        console.log('Patient confirmation sent successfully:', patientNotificationResult)
      } else {
        const errorText = await patientResponse.text()
        console.warn('Patient confirmation edge function failed:', patientResponse.status, errorText)
      }
    } catch (patientCommError) {
      console.warn('Patient confirmation failed:', patientCommError)
      // Don't fail the lead submission if patient communications fail
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: lead,
        message: 'Lead submitted successfully'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Failed to submit lead'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400
      }
    )
  }
})

// Doctor notification is now handled by the dedicated send-doctor-notification edge function

// Helper functions removed - now using dedicated send-doctor-notification edge function

// Note: Email and SMS functions are now handled by n8n workflows
// This file now only triggers the n8n workflow for automated communications