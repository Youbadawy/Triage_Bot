import { embeddingService } from './embedding-service';
import { medicalChunker, policyChunker, DocumentChunk } from './document-chunker';
import { vectorSearchService, medicalReferenceService } from '../supabase/services';
import { supabase } from '../supabase/config';
import type { MedicalReference } from '../supabase/types';

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

export class RAGService {
  private static instance: RAGService;

  static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Ingest a medical reference document into the vector database
   */
  async ingestDocument(referenceId: string): Promise<boolean> {
    try {
      console.log(`🔄 Ingesting document: ${referenceId}`);

      // Get the document from medical_references
      const { data: reference, error } = await supabase
        .from('medical_references')
        .select('*')
        .eq('id', referenceId)
        .single();

      if (error || !reference) {
        console.error('Document not found:', error);
        return false;
      }

      // Choose chunker based on document type
      const chunker = reference.document_type === 'policy' ? policyChunker : medicalChunker;

      // Chunk the document
      const chunks = await chunker.chunkDocument(reference.content, {
        documentId: reference.id,
        documentTitle: reference.title,
        documentType: reference.document_type,
        source: reference.source,
      });

      const validChunks = chunker.filterChunks(chunks);
      console.log(`📄 Created ${validChunks.length} valid chunks`);

      // Generate embeddings for all chunks
      const embeddings = await embeddingService.generateEmbeddings(
        validChunks.map(chunk => chunk.content)
      );

      // Insert chunks into document_chunks table
      const chunkInserts = validChunks.map((chunk, index) => ({
        reference_id: referenceId,
        chunk_index: chunk.metadata.chunkIndex,
        content: chunk.content,
        embedding: JSON.stringify(embeddings[index]),
        metadata: chunk.metadata,
      }));

      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(chunkInserts);

      if (insertError) {
        console.error('Error inserting chunks:', insertError);
        return false;
      }

      console.log(`✅ Successfully ingested ${validChunks.length} chunks for document: ${reference.title}`);
      return true;
    } catch (error) {
      console.error('Error ingesting document:', error);
      return false;
    }
  }

  /**
   * Ingest all medical references
   */
  async ingestAllDocuments(): Promise<{ success: number; failed: number }> {
    console.log('🔄 Starting bulk document ingestion...');

    const references = await medicalReferenceService.getByType('protocol');
    const guidelines = await medicalReferenceService.getByType('guideline');
    const allDocs = [...references, ...guidelines];

    let success = 0;
    let failed = 0;

    for (const doc of allDocs) {
      const result = await this.ingestDocument(doc.id);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`✅ Ingestion complete: ${success} successful, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Search for relevant documents using vector similarity
   */
  async searchDocuments(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      documentTypes?: string[];
    } = {}
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

      // Get full document details for each result
      const enrichedResults: RAGSearchResult[] = [];

      for (const result of searchResults) {
        const { data: reference } = await supabase
          .from('medical_references')
          .select('*')
          .eq('id', result.reference_id)
          .single();

        if (reference && (!options.documentTypes || options.documentTypes.includes(reference.document_type))) {
          enrichedResults.push({
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
          });
        }
      }

      const searchTime = Date.now() - startTime;
      console.log(`✅ Found ${enrichedResults.length} relevant chunks in ${searchTime}ms`);

      return enrichedResults;
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  /**
   * Get RAG context for a medical query
   */
  async getContext(
    query: string,
    options: {
      maxResults?: number;
      threshold?: number;
      documentTypes?: string[];
    } = {}
  ): Promise<RAGContext> {
    const startTime = Date.now();

    const results = await this.searchDocuments(query, {
      limit: options.maxResults || 5,
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
   * Create a summary of the retrieved context
   */
  private createContextSummary(results: RAGSearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant medical documents found for this query.';
    }

    const documentTypes = [...new Set(results.map(r => r.metadata.documentType))];
    const sources = [...new Set(results.map(r => r.metadata.source))];

    return `Found ${results.length} relevant sections from ${documentTypes.join(', ')} documents (${sources.join(', ')}). Average relevance: ${(results.reduce((sum, r) => sum + r.similarity, 0) / results.length * 100).toFixed(1)}%.`;
  }

  /**
   * Get context for triage decision making
   */
  async getTriageContext(symptoms: string, appointmentType?: string): Promise<RAGContext> {
    // Create a comprehensive query for triage
    let query = `medical triage symptoms: ${symptoms}`;
    
    if (appointmentType) {
      query += ` ${appointmentType} appointment criteria`;
    }

    // Focus on protocols and guidelines
    return this.getContext(query, {
      maxResults: 3,
      threshold: 0.75,
      documentTypes: ['protocol', 'guideline'],
    });
  }

  /**
   * Get emergency assessment context
   */
  async getEmergencyContext(symptoms: string): Promise<RAGContext> {
    return this.getContext(`emergency symptoms: ${symptoms}`, {
      maxResults: 3,
      threshold: 0.80,
      documentTypes: ['protocol'],
    });
  }

  /**
   * Get mental health context
   */
  async getMentalHealthContext(concerns: string): Promise<RAGContext> {
    return this.getContext(`mental health: ${concerns}`, {
      maxResults: 3,
      threshold: 0.75,
      documentTypes: ['protocol', 'guideline'],
    });
  }

  /**
   * Check if documents are indexed
   */
  async getIndexStatus(): Promise<{
    totalDocuments: number;
    indexedDocuments: number;
    totalChunks: number;
    lastIndexed?: string;
  }> {
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
      console.error('Error getting index status:', error);
      return {
        totalDocuments: 0,
        indexedDocuments: 0,
        totalChunks: 0,
      };
    }
  }

  /**
   * Clear all indexed chunks (useful for re-indexing)
   */
  async clearIndex(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('document_chunks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        console.error('Error clearing index:', error);
        return false;
      }

      console.log('✅ Index cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing index:', error);
      return false;
    }
  }
}

export const ragService = RAGService.getInstance(); 