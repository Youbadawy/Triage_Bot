// Simplified RAG search service using text-based similarity
// This allows testing without OpenAI API key requirements

import { supabase } from '../supabase/config';

export interface SimpleSearchResult {
  id: string;
  content: string;
  documentTitle: string;
  documentType: string;
  source: string;
  relevanceScore: number;
  chunkIndex: number;
}

export interface SearchContext {
  query: string;
  results: SimpleSearchResult[];
  searchTime: number;
  totalResults: number;
}

export class SimpleRAGSearch {
  private static instance: SimpleRAGSearch;

  static getInstance(): SimpleRAGSearch {
    if (!SimpleRAGSearch.instance) {
      SimpleRAGSearch.instance = new SimpleRAGSearch();
    }
    return SimpleRAGSearch.instance;
  }

  /**
   * Simple text-based search using PostgreSQL full-text search
   */
  async searchDocuments(
    query: string,
    options: {
      limit?: number;
      documentTypes?: string[];
    } = {}
  ): Promise<SimpleSearchResult[]> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Searching for: "${query}"`);

      // Build the search query
      let searchQuery = supabase
        .from('document_chunks')
        .select(`
          id,
          content,
          chunk_index,
          metadata,
          medical_references!inner (
            id,
            title,
            document_type,
            source
          )
        `)
        .textSearch('content', query, { type: 'websearch' })
        .limit(options.limit || 10);

      // Filter by document types if specified
      if (options.documentTypes && options.documentTypes.length > 0) {
        searchQuery = searchQuery.in('medical_references.document_type', options.documentTypes);
      }

      const { data, error } = await searchQuery;

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      // Calculate simple relevance scores based on keyword matching
      const results: SimpleSearchResult[] = (data || []).map(item => {
        const relevanceScore = this.calculateTextRelevance(query, item.content);
        const reference = Array.isArray(item.medical_references) 
          ? item.medical_references[0] 
          : item.medical_references;
        
        return {
          id: item.id,
          content: item.content,
          documentTitle: reference?.title || 'Unknown Document',
          documentType: reference?.document_type || 'unknown',
          source: reference?.source || 'Unknown Source',
          relevanceScore,
          chunkIndex: item.chunk_index,
        };
      });

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const searchTime = Date.now() - startTime;
      console.log(`✅ Found ${results.length} results in ${searchTime}ms`);

      return results;
    } catch (error) {
      console.error('Error in simple search:', error);
      return [];
    }
  }

  /**
   * Get medical context for triage decisions
   */
  async getTriageContext(symptoms: string): Promise<SearchContext> {
    const startTime = Date.now();
    
    // Search for relevant medical protocols and guidelines
    const results = await this.searchDocuments(symptoms, {
      limit: 5,
      documentTypes: ['protocol', 'guideline']
    });

    const searchTime = Date.now() - startTime;

    return {
      query: symptoms,
      results,
      searchTime,
      totalResults: results.length,
    };
  }

  /**
   * Get emergency-specific context
   */
  async getEmergencyContext(symptoms: string): Promise<SearchContext> {
    const emergencyQuery = `emergency ${symptoms} immediate referral criteria`;
    
    const results = await this.searchDocuments(emergencyQuery, {
      limit: 3,
      documentTypes: ['protocol']
    });

    return {
      query: emergencyQuery,
      results,
      searchTime: 0,
      totalResults: results.length,
    };
  }

  /**
   * Get mental health context
   */
  async getMentalHealthContext(concerns: string): Promise<SearchContext> {
    const mentalHealthQuery = `mental health ${concerns} support protocol`;
    
    const results = await this.searchDocuments(mentalHealthQuery, {
      limit: 3,
      documentTypes: ['protocol', 'guideline']
    });

    return {
      query: mentalHealthQuery,
      results,
      searchTime: 0,
      totalResults: results.length,
    };
  }

  /**
   * Calculate simple text relevance score
   */
  private calculateTextRelevance(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let score = 0;
    let totalWords = queryWords.length;

    for (const word of queryWords) {
      if (word.length < 3) continue; // Skip short words
      
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = (contentLower.match(regex) || []).length;
      
      if (matches > 0) {
        score += matches;
      }
    }

    // Normalize score (0-1 range)
    return Math.min(score / totalWords, 1);
  }

  /**
   * Format search results for display
   */
  formatResults(results: SimpleSearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant medical documents found.';
    }

    return results
      .slice(0, 3) // Top 3 results
      .map(result => 
        `📋 ${result.documentTitle} (${result.documentType})\n` +
        `   ${result.content.substring(0, 150)}...`
      )
      .join('\n\n');
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<{
    totalChunks: number;
    totalDocuments: number;
    lastUpdate: string | null;
  }> {
    try {
      const { count: totalChunks } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

      const { count: totalDocuments } = await supabase
        .from('medical_references')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { data: lastChunk } = await supabase
        .from('document_chunks')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        totalChunks: totalChunks || 0,
        totalDocuments: totalDocuments || 0,
        lastUpdate: lastChunk?.created_at || null,
      };
    } catch (error) {
      console.error('Error getting status:', error);
      return {
        totalChunks: 0,
        totalDocuments: 0,
        lastUpdate: null,
      };
    }
  }
}

export const simpleRAGSearch = SimpleRAGSearch.getInstance(); 