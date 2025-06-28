import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    ENVIRONMENT: process.env.ENVIRONMENT,
    // Only show if variables exist (don't expose values)
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    hasGoogle: !!process.env.GOOGLE_API_KEY,
    hasFirebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    
    // Show actual values for debugging (only for Supabase URL format check)
    supabaseUrlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co') ? 'valid-format' : 'invalid-format' 
      : 'missing',
      
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(envVars);
} 