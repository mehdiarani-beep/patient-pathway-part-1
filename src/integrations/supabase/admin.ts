import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for admin operations
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://drvitjhhggcywuepyncx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase admin environment variables are missing');
  console.warn('Admin functionality will be limited without service role key');
}

export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY ? createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'pp-admin',
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-admin'
      }
    }
  }
) : null;
