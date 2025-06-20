import { supabase } from '../supabase/config';
import { vectorSearchService } from '../supabase/services';
import { embeddingService } from './embedding-service';
import { medicalChunker } from './document-chunker';
import { cacheService } from '../cache/cache-service';
import { secureLogger } from '../utils/secret-scrubber';

export interface RAGSearchResult {
  content: string;
  similarity: number;
  metadata: {
    documentId: string;
    documentTitle: string;
    documentType: string;
    source: string;
    chunkIndex: number;
  };
  sourceDocument: {
    id: string;
    title: string;
    url?: string;
    source: string;
  };
}

export interface RAGContext {
  query: string;
  results: RAGSearchResult[];
  totalResults: number;
  searchTime: number;
  contextSummary: string;
}

interface SearchOptions {
  limit?: number;
  threshold?: number;
  documentTypes?: string[];
}

interface IndexStatus {
  totalDocuments: number;
  indexedDocuments: number;
  totalChunks: number;
  lastIndexed?: string;
}

interface VectorSearchResult {
  id: string;
  reference_id: string;
  content: string;
  metadata: any;
  similarity: number;
}

export class RAGService {
  private static instance: RAGService;

  static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Ingest a document into the vector database
   */
  async ingestDocument(documentId: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      console.log(`� Ingesting document: ${documentId}`);

      // Get the document
      const { data: document, error: docError } = await supabase
        .from('medical_references')
        .select('*')
        .eq('id', documentId)
        .eq('is_active', true)
        .single();

      if (docError || !document) {
        secureLogger.error('Document not found or inactive:', { documentId, error: docError });
        return false;
      }

      // Check if document is already processed
      const { data: existingChunks } = await supabase
        .from('document_chunks')
        .select('id')
        .eq('reference_id', documentId)
        .limit(1);

      if (existingChunks && existingChunks.length > 0) {
        console.log(`📄 Document ${documentId} already ingested, skipping`);
        return true;
      }

      // Chunk the document
      const chunks = await medicalChunker.chunkDocument(document.content, {
        documentId: document.id,
        documentTitle: document.title,
        documentType: document.document_type,
        source: document.source,
      });

      if (chunks.length === 0) {
        console.warn(`📄 No chunks generated for document ${documentId}`);
        return false;
      }

      // Generate embeddings for all chunks in batch
      const chunkTexts = chunks.map(chunk => chunk.content);
      const embeddings = await embeddingService.generateEmbeddings(chunkTexts);

      // Prepare batch insert data
      const chunksToInsert = chunks.map((chunk, index) => ({
        reference_id: documentId,
        chunk_index: index,
        content: chunk.content,
        embedding: JSON.stringify(embeddings[index]),
        metadata: chunk.metadata,
      }));

      // Batch insert all chunks
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(chunksToInsert);

      if (insertError) {
        secureLogger.error('Error inserting document chunks:', insertError);
        return false;
      }

      // Invalidate relevant caches
      cacheService.invalidate('rag', documentId);
      cacheService.invalidate('db', 'medical_references');

      const processingTime = Date.now() - startTime;
      console.log(`✅ Document ${documentId} ingested successfully with ${chunks.length} chunks in ${processingTime}ms`);
      
      return true;
    } catch (error) {
      secureLogger.error('Error ingesting document:', { documentId, error });
      return false;
    }
  }

  /**
   * Search for relevant documents using vector similarity with caching
   * FIXED: N+1 query issue by batching database queries
   */
  async searchDocuments(
    query: string,
    options: SearchOptions = {}
  ): Promise<RAGSearchResult[]> {
    const cacheKey = `search:${query}`;
    
    return await cacheService.cacheRAGSearch(
      query,
      options,
      () => this.performSearch(query, options),
      60 * 60 * 1000 // 1 hour TTL
    );
  }

  /**
   * Actual search implementation without caching
   */
  private async performSearch(
    query: string,
    options: SearchOptions = {}
  ): Promise<RAGSearchResult[]> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Searching for: "${query}"`);

      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Search using vector similarity
      const searchResults = await vectorSearchService.searchDocuments(
        queryEmbedding,
        options.threshold || 0.78,
        options.limit || 10
      );

      if (searchResults.length === 0) {
        console.log('🔍 No search results found');
        return [];
      }

      // FIXED: Batch query instead of N+1 individual queries
      const referenceIds = [...new Set(searchResults.map((result: VectorSearchResult) => result.reference_id))];
      
      // Single query to get all required references
      const { data: references, error: refError } = await supabase
        .from('medical_references')
        .select('*')
        .in('id', referenceIds)
        .eq('is_active', true);

      if (refError) {
        secureLogger.error('Error fetching medical references:', refError);
        return [];
      }

      // Create a map for O(1) lookup
      const referenceMap = new Map(references?.map(ref => [ref.id, ref]) || []);

      // Build enriched results
      const enrichedResults: RAGSearchResult[] = searchResults
        .map((result: VectorSearchResult) => {
          const reference = referenceMap.get(result.reference_id);
          
          // Filter by document type if specified
          if (!reference || 
              (options.documentTypes && !options.documentTypes.includes(reference.document_type))) {
            return null;
          }

          return {
            content: result.content,
            similarity: result.similarity,
            metadata: {
              documentId: result.reference_id,
              documentTitle: reference.title,
              documentType: reference.document_type,
              source: reference.source,
              chunkIndex: result.metadata?.chunkIndex || 0,
            },
            sourceDocument: {
              id: reference.id,
              title: reference.title,
              url: reference.url,
              source: reference.source,
            },
          };
        })
        .filter(Boolean) as RAGSearchResult[];

      const searchTime = Date.now() - startTime;
      console.log(`✅ Found ${enrichedResults.length} relevant chunks in ${searchTime}ms`);

      return enrichedResults;
    } catch (error) {
      secureLogger.error('Error searching documents:', { query, options, error });
      return [];
    }
  }

  /**
   * Get RAG context for a medical query with caching
   */
  async getContext(
    query: string,
    options: SearchOptions = {}
  ): Promise<RAGContext> {
    const cacheKey = `context:${query}`;
    
    return await cacheService.cacheRAGSearch(
      query,
      options,
      () => this.buildContext(query, options),
      30 * 60 * 1000 // 30 minutes TTL
    );
  }

  /**
   * Build context without caching
   */
  private async buildContext(
    query: string,
    options: SearchOptions = {}
  ): Promise<RAGContext> {
    const startTime = Date.now();

    const results = await this.performSearch(query, {
      limit: options.limit || 5,
      threshold: options.threshold || 0.78,
      documentTypes: options.documentTypes,
    });

    const searchTime = Date.now() - startTime;

    // Create a context summary
    const contextSummary = this.createContextSummary(results);

    return {
      query,
      results,
      totalResults: results.length,
      searchTime,
      contextSummary,
    };
  }

  /**
   * Create a summary of the search context
   */
  private createContextSummary(results: RAGSearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant medical information found for this query.';
    }

    const documentTypes = [...new Set(results.map(r => r.metadata.documentType))];
    const sources = [...new Set(results.map(r => r.metadata.source))];
    
    let summary = `Found ${results.length} relevant medical references`;
    
    if (documentTypes.length > 0) {
      summary += ` from ${documentTypes.join(', ')} documents`;
    }
    
    if (sources.length > 0) {
      summary += ` sourced from ${sources.join(', ')}`;
    }
    
    // Add relevance information
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    summary += `. Average relevance: ${(avgSimilarity * 100).toFixed(1)}%`;

    return summary;
  }

  /**
   * Remove document from vector database
   */
  async removeDocument(documentId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Removing document: ${documentId}`);

      const { error } = await supabase
        .from('document_chunks')
        .delete()
        .eq('reference_id', documentId);

      if (error) {
        secureLogger.error('Error removing document chunks:', error);
        return false;
      }

      // Invalidate relevant caches
      cacheService.invalidate('rag', documentId);
      cacheService.invalidate('db', 'medical_references');

      console.log(`✅ Document ${documentId} removed successfully`);
      return true;
    } catch (error) {
      secureLogger.error('Error removing document:', { documentId, error });
      return false;
    }
  }

  /**
   * Check if documents are indexed with caching
   */
  async getIndexStatus(): Promise<IndexStatus> {
    return await cacheService.cacheDBQuery(
      'index_status',
      {},
      () => this.fetchIndexStatus(),
      5 * 60 * 1000 // 5 minutes TTL
    );
  }

  /**
   * Fetch index status without caching
   */
  private async fetchIndexStatus(): Promise<IndexStatus> {
    try {
      // Get total documents
      const { count: totalDocuments } = await supabase
        .from('medical_references')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get indexed documents (those with chunks)
      const { data: allChunks } = await supabase
        .from('document_chunks')
        .select('reference_id');
      
      const uniqueReferenceIds = [...new Set(allChunks?.map(chunk => chunk.reference_id) || [])];

      // Get total chunks
      const { count: totalChunks } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

      // Get last indexed timestamp
      const { data: lastChunk } = await supabase
        .from('document_chunks')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        totalDocuments: totalDocuments || 0,
        indexedDocuments: uniqueReferenceIds.length,
        totalChunks: totalChunks || 0,
        lastIndexed: lastChunk?.created_at,
      };
    } catch (error) {
      secureLogger.error('Error getting index status:', error);
      return {
        totalDocuments: 0,
        indexedDocuments: 0,
        totalChunks: 0,
      };
    }
  }

  /**
   * Get system health and performance metrics
   */
  getHealthMetrics() {
    const cacheStats = cacheService.getStats();
    const cacheHealth = cacheService.getHealthStatus();
    
    return {
      cache: cacheHealth,
      ragCacheHitRate: cacheStats.rag?.hitRate || 0,
      dbCacheHitRate: cacheStats.db?.hitRate || 0,
    };
  }

  /**
   * Clear all RAG-related caches
   */
  clearCache(): void {
    cacheService.invalidate('rag', '');
    cacheService.invalidate('db', 'medical_references');
    console.log('🧹 RAG cache cleared');
  }
}

// Export singleton instance
export const ragService = RAGService.getInstance(); 