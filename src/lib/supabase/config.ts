import { createClient } from '@supabase/supabase-js';
import { validateEnv, getEnv } from '@/lib/config/env-validation';

// Validate environment variables at startup
const env = validateEnv();

// Create Supabase client with validated environment variables
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'caf-medroute-triage-bot',
    },
  },
});

// Create a client for server-side operations (with service role key)
export const supabaseAdmin = createClient(
  supabaseUrl,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'caf-medroute-admin',
      },
    },
  }
);

export default supabase; 