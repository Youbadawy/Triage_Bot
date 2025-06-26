import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Perform text-based search instead of vector search for build compatibility
    const { data: searchResults, error } = await supabase
      .from('document_chunks')
      .select(`
        content,
        chunk_index,
        metadata,
        medical_references!inner(
          title,
          document_type,
          source
        )
      `)
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(3);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // Format results
    const results = (searchResults || []).map((result: any) => ({
      content: result.content,
      title: result.medical_references.title,
      document_type: result.medical_references.document_type,
      similarity_score: 0.85, // Mock similarity for demo
      chunk_index: result.chunk_index,
      source: result.medical_references.title
    }));
    
    return NextResponse.json({
      query,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('RAG Search API Error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'RAG Search API',
    description: 'POST a JSON body with { "query": "your search term" } to search the medical knowledge base',
    example: {
      query: 'chest pain',
    }
  });
} 