import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we're in development mode with placeholder credentials
const isDevelopmentMode = !supabaseUrl || !supabaseKey || 
  supabaseUrl.includes('your-project.supabase.co') || 
  supabaseKey.includes('your-anon-key-here');

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Return mock search results in development mode
    if (isDevelopmentMode) {
      console.log(`🔍 RAG Search (DEV MODE): "${query}"`);
      
      const mockResults = [
        {
          content: `Based on medical protocols, for symptoms like "${query}", the recommended approach is to assess severity and provide appropriate triage recommendations.`,
          title: 'CAF Medical Protocols',
          document_type: 'protocol',
          similarity_score: 0.89,
          chunk_index: 1,
          source: 'CAF Medical Protocols'
        },
        {
          content: `Emergency procedures indicate that patients with "${query}" should be evaluated for immediate care requirements and proper referral pathways.`,
          title: 'Emergency Procedures',
          document_type: 'guideline', 
          similarity_score: 0.76,
          chunk_index: 3,
          source: 'Emergency Procedures'
        }
      ];
      
      return NextResponse.json({
        query,
        results: mockResults,
        timestamp: new Date().toISOString(),
        mode: 'development',
        note: 'Using mock data. Configure Supabase credentials for real RAG search.'
      });
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