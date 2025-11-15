import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== FIXING DUPLICATE DOCTOR PROFILES ===');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, get all users with multiple profiles
    const { data: duplicateUsers, error: duplicateError } = await supabaseClient
      .from('doctor_profiles')
      .select('user_id')
      .then(({ data, error }) => {
        if (error) throw error;
        
        // Group by user_id and count
        const userCounts = data.reduce((acc: any, profile: any) => {
          acc[profile.user_id] = (acc[profile.user_id] || 0) + 1;
          return acc;
        }, {});
        
        // Return users with more than 1 profile
        const duplicates = Object.entries(userCounts)
          .filter(([_, count]) => (count as number) > 1)
          .map(([user_id, count]) => ({ user_id, count: count as number }));
        
        return { data: duplicates, error: null };
      });

    if (duplicateError) {
      throw duplicateError;
    }

    console.log(`Found ${duplicateUsers.length} users with duplicate profiles`);

    let cleanedCount = 0;
    let errors: string[] = [];

    // For each user with duplicates, keep only the first profile
    for (const duplicate of duplicateUsers) {
      try {
        // Get all profiles for this user, ordered by created_at
        const { data: profiles, error: profileError } = await supabaseClient
          .from('doctor_profiles')
          .select('*')
          .eq('user_id', duplicate.user_id)
          .order('created_at', { ascending: true });

        if (profileError) {
          errors.push(`Error fetching profiles for user ${duplicate.user_id}: ${profileError.message}`);
          continue;
        }

        if (profiles && profiles.length > 1) {
          // Keep the first profile, delete the rest
          const profilesToDelete = profiles.slice(1);
          
          for (const profile of profilesToDelete) {
            const { error: deleteError } = await supabaseClient
              .from('doctor_profiles')
              .delete()
              .eq('id', profile.id);

            if (deleteError) {
              errors.push(`Error deleting profile ${profile.id}: ${deleteError.message}`);
            } else {
              cleanedCount++;
              console.log(`Deleted duplicate profile ${profile.id} for user ${duplicate.user_id}`);
            }
          }
        }
      } catch (error: any) {
        errors.push(`Error processing user ${duplicate.user_id}: ${error.message}`);
      }
    }

    // Now add the unique constraint
    console.log('Adding unique constraint on user_id...');
    const { error: constraintError } = await supabaseClient.rpc('add_unique_constraint_user_id');

    if (constraintError) {
      console.log('Constraint might already exist or failed:', constraintError.message);
    }

    console.log('=== DUPLICATE CLEANUP COMPLETED ===');
    console.log(`Cleaned up ${cleanedCount} duplicate profiles`);
    console.log(`Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Duplicate profiles cleaned up successfully',
      cleanedCount,
      errors: errors.length > 0 ? errors : null
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error fixing duplicate profiles:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
