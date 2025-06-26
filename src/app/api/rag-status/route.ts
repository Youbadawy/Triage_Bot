import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
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