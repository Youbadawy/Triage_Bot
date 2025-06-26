import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if we're in development mode with placeholder credentials
const isDevelopmentMode = supabaseUrl.includes('your-project.supabase.co') || supabaseKey.includes('your-anon-key-here');

export async function GET() {
  try {
    // Return mock data in development mode
    if (isDevelopmentMode) {
      console.log('⚠️  RAG system running in DEVELOPMENT MODE - using mock data');
      return NextResponse.json({
        status: 'development_mode',
        message: 'RAG system running in development mode with mock data',
        totalDocuments: 3,
        totalChunks: 42,
        documents: [
          {
            id: 'mock-1',
            title: 'CAF Medical Protocols',
            document_type: 'protocol',
            version: '2024.1',
            created_at: new Date().toISOString(),
            chunk_count: 15
          },
          {
            id: 'mock-2', 
            title: 'Emergency Procedures',
            document_type: 'guideline',
            version: '2024.1',
            created_at: new Date().toISOString(),
            chunk_count: 12
          },
          {
            id: 'mock-3',
            title: 'Mental Health Guidelines',
            document_type: 'guideline', 
            version: '2024.1',
            created_at: new Date().toISOString(),
            chunk_count: 15
          }
        ],
        timestamp: new Date().toISOString(),
        note: 'To enable full RAG functionality, configure your Supabase credentials in .env.local'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get medical references with chunk counts
    const { data: documents, error: docsError } = await supabase
      .from('medical_references')
      .select(`
        id,
        title,
        document_type,
        version,
        created_at,
        document_chunks(count)
      `);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Get total chunk count
    const { count: totalChunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true });

    if (chunksError) {
      console.error('Error counting chunks:', chunksError);
      return NextResponse.json({ error: 'Failed to count chunks' }, { status: 500 });
    }

    // Format the response
    const formattedDocuments = documents?.map(doc => ({
      id: doc.id,
      title: doc.title,
      document_type: doc.document_type,
      version: doc.version,
      created_at: doc.created_at,
      chunk_count: doc.document_chunks?.[0]?.count || 0
    }));

    return NextResponse.json({
      status: 'operational',
      totalDocuments: documents?.length || 0,
      totalChunks: totalChunks || 0,
      documents: formattedDocuments || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('RAG Status API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      status: 'error'
    }, { status: 500 });
  }
} 