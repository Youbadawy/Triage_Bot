import { NextRequest, NextResponse } from 'next/server';
import { webSearchService } from '@/lib/rag/web-search-service';

export async function POST(request: NextRequest) {
  try {
    const { query, type, trade } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    let results;
    let summary = '';
    let ingestedCount = 0;

    switch (type) {
      case 'trade_requirements':
        if (!trade) {
          return NextResponse.json({ error: 'Trade is required for trade_requirements search' }, { status: 400 });
        }
        console.log(`🔍 Searching for ${trade} requirements`);
        results = await webSearchService.findTradeRequirements(trade);
        summary = `Found ${results.length} medical requirements for ${trade}`;
        break;

      case 'research':
        console.log(`🔍 Researching topic: ${query}`);
        const researchResult = await webSearchService.researchMedicalTopic(query);
        results = researchResult.documents;
        summary = researchResult.summary;
        ingestedCount = researchResult.ingestedCount;
        break;

      case 'general':
      default:
        console.log(`🔍 General search: ${query}`);
        results = await webSearchService.searchCAFMedicalDocs(query);
        summary = `Found ${results.length} relevant documents`;
        break;
    }
    
    return NextResponse.json({
      query,
      type: type || 'general',
      trade,
      results,
      summary,
      ingestedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Web Search API Error:', error);
    return NextResponse.json({ 
      error: 'Web search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    console.log(`🔍 Quick search: ${query}`);
    const results = await webSearchService.searchCAFMedicalDocs(query);
    
    return NextResponse.json({
      query,
      results: results.slice(0, 5), // Top 5 for quick search
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Web Search API Error:', error);
    return NextResponse.json({ 
      error: 'Web search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 