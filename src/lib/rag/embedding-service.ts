import OpenAI from 'openai';

// Initialize OpenAI client with proper error handling
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined,
  });
};

export class EmbeddingService {
  private static instance: EmbeddingService;
  private readonly model = 'text-embedding-3-small';
  private readonly dimension = 1536;

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const openai = getOpenAI();
      const response = await openai.embeddings.create({
        model: this.model,
        input: text.trim(),
        encoding_format: 'float',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data received from OpenAI');
      }

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const openai = getOpenAI();
      const response = await openai.embeddings.create({
        model: this.model,
        input: texts.map(text => text.trim()),
        encoding_format: 'float',
      });

      if (!response.data || response.data.length !== texts.length) {
        throw new Error('Mismatch between input texts and embedding responses');
      }

      return response.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Get model name
   */
  getModel(): string {
    return this.model;
  }
}

export const embeddingService = EmbeddingService.getInstance(); 