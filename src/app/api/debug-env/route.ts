import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      ENVIRONMENT: process.env.ENVIRONMENT,
      
      // Check if Firebase config variables exist (don't expose values)
      hasFirebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasFirebaseAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasFirebaseStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      hasFirebaseMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      hasFirebaseAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      
      // Check if Supabase config exists
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Check if AI API keys exist
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      hasGoogleKey: !!process.env.GOOGLE_API_KEY,
      
      // Show format validation (safe)
      firebaseApiKeyFormat: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.startsWith('AIza') ? 'valid' : 'invalid',
      supabaseUrlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ? 'valid' : 'invalid',
      
      // Timestamp for cache busting
      timestamp: new Date().toISOString(),
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'unknown'
    };

    return NextResponse.json({
      status: 'success',
      message: 'Environment variables check completed',
      data: envVars
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check environment variables',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 