import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export interface DocumentChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    startIndex: number;
    endIndex: number;
    documentId?: string;
    documentTitle?: string;
    documentType?: string;
    source?: string;
  };
}

export class DocumentChunker {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(
    chunkSize: number = 1000,
    chunkOverlap: number = 150,
    separators: string[] = ['\n\n', '\n', '. ', ' ', '']
  ) {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators,
    });
  }

  /**
   * Split a document into chunks
   */
  async chunkDocument(
    content: string,
    metadata: {
      documentId?: string;
      documentTitle?: string;
      documentType?: string;
      source?: string;
    } = {}
  ): Promise<DocumentChunk[]> {
    try {
      const chunks = await this.textSplitter.splitText(content);
      
      return chunks.map((chunk, index) => ({
        content: chunk.trim(),
        metadata: {
          chunkIndex: index,
          totalChunks: chunks.length,
          startIndex: content.indexOf(chunk),
          endIndex: content.indexOf(chunk) + chunk.length,
          ...metadata,
        },
      }));
    } catch (error) {
      console.error('Error chunking document:', error);
      throw new Error(`Failed to chunk document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Split multiple documents into chunks
   */
  async chunkDocuments(
    documents: Array<{
      content: string;
      metadata: {
        documentId?: string;
        documentTitle?: string;
        documentType?: string;
        source?: string;
      };
    }>
  ): Promise<DocumentChunk[]> {
    const allChunks: DocumentChunk[] = [];

    for (const doc of documents) {
      const chunks = await this.chunkDocument(doc.content, doc.metadata);
      allChunks.push(...chunks);
    }

    return allChunks;
  }

  /**
   * Create optimized chunks for medical documents
   */
  static createMedicalChunker(): DocumentChunker {
    // Optimized for medical documents with specific separators
    return new DocumentChunker(
      800, // Smaller chunks for more precise retrieval
      100, // Less overlap for medical content
      [
        '\n\n', // Paragraph breaks
        '\n', // Line breaks
        '. ', // Sentence endings
        '; ', // Clause endings
        ', ', // Phrase endings
        ' ', // Word boundaries
        ''
      ]
    );
  }

  /**
   * Create chunks specifically for policy documents
   */
  static createPolicyChunker(): DocumentChunker {
    return new DocumentChunker(
      1200, // Larger chunks for policy context
      200, // More overlap to maintain policy context
      [
        '\n\n',
        '\n',
        '. ',
        ': ', // For numbered lists and definitions
        '; ',
        ', ',
        ' ',
        ''
      ]
    );
  }

  /**
   * Validate chunk quality
   */
  validateChunk(chunk: DocumentChunk): boolean {
    const content = chunk.content.trim();
    
    // Check minimum length
    if (content.length < 50) {
      return false;
    }

    // Check if chunk is mostly whitespace or special characters
    const meaningfulChars = content.replace(/[\s\n\r\t.,;:!?()[\]{}'"]/g, '');
    if (meaningfulChars.length < content.length * 0.3) {
      return false;
    }

    return true;
  }

  /**
   * Filter and clean chunks
   */
  filterChunks(chunks: DocumentChunk[]): DocumentChunk[] {
    return chunks
      .filter(chunk => this.validateChunk(chunk))
      .map(chunk => ({
        ...chunk,
        content: this.cleanChunkContent(chunk.content),
      }));
  }

  /**
   * Clean chunk content
   */
  private cleanChunkContent(content: string): string {
    return content
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize line breaks
      .replace(/[^\w\s.,;:!?()[\]{}'"/-]/g, ''); // Remove unusual characters
  }
}

export const medicalChunker = DocumentChunker.createMedicalChunker();
export const policyChunker = DocumentChunker.createPolicyChunker(); 