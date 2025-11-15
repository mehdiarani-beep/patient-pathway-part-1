import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://drvitjhhggcywuepyncx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydml0amhoZ2djeXd1ZXB5bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwOTc2NzMsImV4cCI6MjA2MzY3MzY3M30.R3g3sZc4O8w3ox22tQ31_RopbzAddU8o7j12BQEe35A';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'pp-auth'
    }
  }
);

