import { z } from 'zod';

const envSchema = z.object({
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Supabase URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // AI Service Configuration
  OPENROUTER_API_KEY: z.string().min(1, 'OpenRouter API key is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),

  // Optional AI Configuration
  GEMINI_API_KEY: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

let validatedEnv: ValidatedEnv | null = null;

export const validateEnv = (): ValidatedEnv => {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return validatedEnv;
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.error('Missing or invalid environment variables:');
      missingVars.forEach(msg => console.error(`  - ${msg}`));
    }
    process.exit(1);
  }
};

export const getEnv = (): ValidatedEnv => {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
};

// Validate environment variables for client-side usage
export const validateClientEnv = () => {
  const clientEnvSchema = z.object({
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  });

  try {
    clientEnvSchema.parse(process.env);
    return true;
  } catch (error) {
    console.error('❌ Client environment validation failed:', error);
    return false;
  }
};