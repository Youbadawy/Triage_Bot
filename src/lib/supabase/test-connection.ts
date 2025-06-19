import { supabase } from './config';
import { medicalReferenceService, triageSessionService } from './services';

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('medical_references')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Basic Supabase connection successful');
    
    // Test medical references service
    console.log('🔍 Testing medical references service...');
    const references = await medicalReferenceService.getByType('protocol');
    console.log(`✅ Found ${references.length} protocol references`);
    
    // Test search functionality
    console.log('🔍 Testing search functionality...');
    const searchResults = await medicalReferenceService.searchReferences('emergency');
    console.log(`✅ Search found ${searchResults.length} results for "emergency"`);
    
    // Test authentication state
    console.log('🔍 Testing authentication state...');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log(`✅ User authenticated: ${user.email}`);
    } else {
      console.log('ℹ️ No user currently authenticated');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return false;
  }
}

export async function createTestTriageSession(userId: string) {
  try {
    console.log('🔍 Creating test triage session...');
    
    const session = await triageSessionService.createSession({
      user_id: userId,
      initial_complaint: 'Test complaint - headache and fatigue',
      status: 'active'
    });
    
    if (session) {
      console.log(`✅ Test session created with ID: ${session.id}`);
      return session;
    } else {
      console.error('❌ Failed to create test session');
      return null;
    }
  } catch (error) {
    console.error('❌ Test session creation failed:', error);
    return null;
  }
}

export async function getSupabaseStatus() {
  const status = {
    connected: false,
    tablesExist: false,
    sampleDataExists: false,
    authConfigured: false,
    error: null as string | null
  };
  
  try {
    // Test connection
    const { error: connectionError } = await supabase
      .from('medical_references')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      status.error = connectionError.message;
      return status;
    }
    
    status.connected = true;
    status.tablesExist = true;
    
    // Check for sample data
    const references = await medicalReferenceService.getByType('protocol');
    status.sampleDataExists = references.length > 0;
    
    // Check auth configuration
    const { data: { user } } = await supabase.auth.getUser();
    status.authConfigured = true; // If we can call this without error, auth is configured
    
    return status;
  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown error';
    return status;
  }
} 