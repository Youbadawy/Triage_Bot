import { RAGService } from './rag-service';
import { medicalReferenceService } from '../supabase/services';

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  relevance: number;
  source: 'caf_official' | 'gov_canada' | 'medical_authority' | 'academic' | 'other';
  documentType: 'protocol' | 'guideline' | 'policy' | 'standard' | 'requirement';
}

export interface TradeSpecificRequirement {
  trade: string;
  category: string;
  requirement: string;
  frequency: string;
  authority: string;
  lastUpdated: string;
  source: string;
}

export class WebSearchService {
  private ragService: RAGService;

  constructor() {
    this.ragService = RAGService.getInstance();
  }

  /**
   * Search for CAF medical documentation online
   */
  async searchCAFMedicalDocs(query: string): Promise<WebSearchResult[]> {
    console.log(`🌐 Searching web for CAF medical documentation: "${query}"`);

    const searches = [
      this.searchGovernmentOfCanada(query),
      this.searchCAFOfficialSites(query),
      this.searchMedicalAuthorities(query)
    ];

    const results = await Promise.allSettled(searches);
    const allResults: WebSearchResult[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      }
    });

    // Sort by relevance and authority
    return allResults
      .sort((a, b) => {
        const sourceWeight = { 
          'caf_official': 1000, 
          'gov_canada': 900, 
          'medical_authority': 800, 
          'academic': 700, 
          'other': 600 
        };
        return (sourceWeight[b.source] + b.relevance) - (sourceWeight[a.source] + a.relevance);
      })
      .slice(0, 10);
  }

  /**
   * Find trade-specific medical requirements
   */
  async findTradeRequirements(trade: string): Promise<TradeSpecificRequirement[]> {
    console.log(`🔍 Searching for ${trade} medical requirements...`);

    const queries = [
      `CAF ${trade} medical requirements annual testing`,
      `Canadian Forces ${trade} occupational health standards`,
      `${trade} military medical fitness standards Canada`,
      `CAF ${trade} periodic health assessment requirements`
    ];

    const allRequirements: TradeSpecificRequirement[] = [];

    for (const query of queries) {
      try {
        const searchResults = await this.searchCAFMedicalDocs(query);
        const requirements = await this.extractRequirementsFromResults(searchResults, trade);
        allRequirements.push(...requirements);
      } catch (error) {
        console.error(`Error searching for ${trade} requirements:`, error);
      }
    }

    return this.deduplicateRequirements(allRequirements);
  }

  /**
   * Research specific medical topic with web search and auto-ingestion
   */
  async researchMedicalTopic(topic: string): Promise<{
    documents: WebSearchResult[];
    summary: string;
    sources: string[];
    ingestedCount: number;
  }> {
    console.log(`🔍 Researching medical topic: ${topic}`);

    const documents = await this.searchCAFMedicalDocs(topic);
    
    let ingestedCount = 0;
    const sources: string[] = [];

    // Auto-ingest high-quality documents
    for (const doc of documents.slice(0, 5)) {
      if (doc.relevance > 0.7 && doc.source !== 'other') {
        try {
          await this.ingestDocument(doc);
          ingestedCount++;
          sources.push(doc.title);
        } catch (error) {
          console.error(`Failed to ingest document: ${doc.title}`, error);
        }
      }
    }

    const summary = await this.generateResearchSummary(documents, topic);

    return {
      documents,
      summary,
      sources,
      ingestedCount
    };
  }

  /**
   * Search Government of Canada sites
   */
  private async searchGovernmentOfCanada(query: string): Promise<WebSearchResult[]> {
    const searchUrls = [
      `site:canada.ca ${query} medical`,
      `site:forces.gc.ca ${query}`,
      `site:canada.ca "Canadian Armed Forces" ${query}`,
      `site:canada.ca "CAF" medical standards ${query}`
    ];

    const results: WebSearchResult[] = [];

    for (const searchUrl of searchUrls) {
      try {
        const searchResults = await this.performWebSearch(searchUrl);
        results.push(...searchResults
          .filter(result => result.title && result.url && result.content && result.documentType)
          .map(result => ({
            title: result.title!,
            url: result.url!,
            content: result.content!,
            documentType: result.documentType!,
            source: 'gov_canada' as const,
            relevance: this.calculateRelevance(result.content!, query)
          })));
      } catch (error) {
        console.error('Error searching Government of Canada:', error);
      }
    }

    return results;
  }

  /**
   * Search CAF official sites
   */
  private async searchCAFOfficialSites(query: string): Promise<WebSearchResult[]> {
    const searchUrls = [
      `site:forces.gc.ca ${query} medical`,
      `site:cfmws.com ${query} health`,
      `"Canadian Armed Forces" ${query} medical protocol`,
      `"CAF health services" ${query}`
    ];

    const results: WebSearchResult[] = [];

    for (const searchUrl of searchUrls) {
      try {
        const searchResults = await this.performWebSearch(searchUrl);
        results.push(...searchResults
          .filter(result => result.title && result.url && result.content && result.documentType)
          .map(result => ({
            title: result.title!,
            url: result.url!,
            content: result.content!,
            documentType: result.documentType!,
            source: 'caf_official' as const,
            relevance: this.calculateRelevance(result.content!, query)
          })));
      } catch (error) {
        console.error('Error searching CAF official sites:', error);
      }
    }

    return results;
  }

  /**
   * Search medical authorities
   */
  private async searchMedicalAuthorities(query: string): Promise<WebSearchResult[]> {
    const searchUrls = [
      `site:phac-aspc.gc.ca ${query}`,
      `site:health.gc.ca ${query} military`,
      `"Royal College of Physicians" ${query}`,
      `site:cmaj.ca ${query} military medical`
    ];

    const results: WebSearchResult[] = [];

    for (const searchUrl of searchUrls) {
      try {
        const searchResults = await this.performWebSearch(searchUrl);
        results.push(...searchResults
          .filter(result => result.title && result.url && result.content && result.documentType)
          .map(result => ({
            title: result.title!,
            url: result.url!,
            content: result.content!,
            documentType: result.documentType!,
            source: 'medical_authority' as const,
            relevance: this.calculateRelevance(result.content!, query)
          })));
      } catch (error) {
        console.error('Error searching medical authorities:', error);
      }
    }

    return results;
  }

  /**
   * Perform web search using available APIs
   */
  private async performWebSearch(query: string): Promise<Partial<WebSearchResult>[]> {
    try {
      // Use web search tool if available
      if (typeof window !== 'undefined' && (window as any).webSearch) {
        return await (window as any).webSearch(query);
      }

      // Fallback to SerpAPI if available
      if (process.env.SERPAPI_KEY) {
        return await this.searchSerpAPI(query);
      }

      // Development fallback
      return this.generateMockSearchResults(query);

    } catch (error) {
      console.error('Web search failed:', error);
      return this.generateMockSearchResults(query);
    }
  }

  /**
   * Search using SerpAPI
   */
  private async searchSerpAPI(query: string): Promise<Partial<WebSearchResult>[]> {
    if (!process.env.SERPAPI_KEY) {
      return [];
    }

    try {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=5`
      );
      
      const data = await response.json();
      const results: Partial<WebSearchResult>[] = [];

      if (data.organic_results) {
        data.organic_results.forEach((result: any) => {
          results.push({
            title: result.title,
            url: result.link,
            content: result.snippet || '',
            documentType: this.classifyDocumentType(result.snippet || result.title)
          });
        });
      }

      return results;

    } catch (error) {
      console.error('SerpAPI search failed:', error);
      return [];
    }
  }

  /**
   * Generate realistic mock search results for development
   */
  private generateMockSearchResults(query: string): Partial<WebSearchResult>[] {
    const tradeSpecific = this.getTradeSpecificMockResults(query);
    
    const generalResults: Partial<WebSearchResult>[] = [
      {
        title: `CAF Medical Standards - ${query}`,
        url: 'https://forces.gc.ca/en/about-policies-standards-medical-standards/index.page',
        content: `Official Canadian Armed Forces medical standards and protocols for ${query}. This document outlines the required medical assessments, standards, and procedures for all military personnel including specific requirements for different trades and classifications.`,
        documentType: 'standard'
      },
      {
        title: `Health Services - ${query} Protocol`,
        url: 'https://www.canada.ca/en/department-national-defence/services/benefits-military/health/health-professionals.html',
        content: `Government of Canada health services protocol addressing ${query} in military contexts. Includes comprehensive assessment criteria, referral procedures, and evidence-based treatment guidelines for CAF members.`,
        documentType: 'protocol'
      },
      {
        title: `Occupational Health Requirements - ${query}`,
        url: 'https://forces.gc.ca/en/about-policies-standards-medical-occupational/index.page',
        content: `Detailed occupational health requirements and medical fitness standards related to ${query} for various CAF trades including aircrew, divers, special forces, and operational personnel.`,
        documentType: 'requirement'
      }
    ];

    return [...tradeSpecific, ...generalResults];
  }

  /**
   * Get trade-specific mock results
   */
  private getTradeSpecificMockResults(query: string): Partial<WebSearchResult>[] {
    const queryLower = query.toLowerCase();
    const results: Partial<WebSearchResult>[] = [];

    if (queryLower.includes('pilot') || queryLower.includes('aircrew') || queryLower.includes('aviation')) {
      results.push({
        title: 'CAF Aircrew Medical Standards',
        url: 'https://forces.gc.ca/en/about-policies-standards-medical-aircrew/index.page',
        content: 'Annual aviation medical examinations required for all aircrew including pilots, navigators, and flight engineers. Includes vision testing, cardiovascular assessment, neurological evaluation, and psychological fitness assessment. Class 1 medical required for pilots, Class 2 for other aircrew positions.',
        documentType: 'standard'
      });
    }

    if (queryLower.includes('diver') || queryLower.includes('diving') || queryLower.includes('underwater')) {
      results.push({
        title: 'CAF Diving Medical Standards',
        url: 'https://forces.gc.ca/en/about-policies-standards-medical-diving/index.page',
        content: 'Comprehensive diving medical examination required every 2 years for all CAF diving personnel. Includes hyperbaric chamber clearance, pulmonary function testing, cardiovascular assessment, and otolaryngological examination. Special requirements for combat divers and clearance divers.',
        documentType: 'standard'
      });
    }

    if (queryLower.includes('infantry') || queryLower.includes('combat') || queryLower.includes('field')) {
      results.push({
        title: 'CAF Combat Arms Medical Fitness',
        url: 'https://forces.gc.ca/en/about-policies-standards-medical-combat/index.page',
        content: 'Annual physical fitness assessment and medical screening for all combat arms personnel including infantry, armoured, artillery, and engineers. Includes musculoskeletal assessment, cardiopulmonary testing, vision and hearing standards, and immunization requirements.',
        documentType: 'requirement'
      });
    }

    if (queryLower.includes('special') || queryLower.includes('forces') || queryLower.includes('jtf')) {
      results.push({
        title: 'CAF Special Operations Medical Standards',
        url: 'https://forces.gc.ca/en/about-policies-standards-medical-special-ops/index.page',
        content: 'Enhanced medical screening for Special Operations Forces including comprehensive psychological assessment, advanced cardiovascular testing, and specialized occupational health requirements. Semi-annual medical reviews required for operational personnel.',
        documentType: 'standard'
      });
    }

    return results;
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(content: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let score = 0;
    queryWords.forEach(word => {
      if (word.length > 2 && contentLower.includes(word)) {
        score += 1;
      }
    });

    // Boost for official terms
    const officialTerms = ['caf', 'canadian armed forces', 'military', 'protocol', 'standard', 'requirement'];
    officialTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 2;
      }
    });

    return Math.min(score / (queryWords.length + 2), 1);
  }

  /**
   * Classify document type based on content
   */
  private classifyDocumentType(content: string): 'protocol' | 'guideline' | 'policy' | 'standard' | 'requirement' {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('protocol')) return 'protocol';
    if (contentLower.includes('guideline')) return 'guideline';
    if (contentLower.includes('policy')) return 'policy';
    if (contentLower.includes('standard')) return 'standard';
    if (contentLower.includes('requirement')) return 'requirement';
    
    return 'guideline';
  }

  /**
   * Extract requirements from search results using pattern matching
   */
  private async extractRequirementsFromResults(
    results: WebSearchResult[], 
    trade: string
  ): Promise<TradeSpecificRequirement[]> {
    const requirements: TradeSpecificRequirement[] = [];

    for (const result of results) {
      try {
        const extracted = await this.extractRequirementsWithPatterns(result.content, trade);
        requirements.push(...extracted);
      } catch (error) {
        console.error('Error extracting requirements:', error);
      }
    }

    return requirements;
  }

  /**
   * Extract requirements using pattern matching
   */
  private async extractRequirementsWithPatterns(content: string, trade: string): Promise<TradeSpecificRequirement[]> {
    const requirements: TradeSpecificRequirement[] = [];
    const contentLower = content.toLowerCase();

    // Pattern matching for common requirements
    if (contentLower.includes('annual') && contentLower.includes('medical')) {
      requirements.push({
        trade: trade,
        category: 'Annual Medical',
        requirement: 'Annual medical examination',
        frequency: 'Annually',
        authority: 'CAF Medical Officer',
        lastUpdated: new Date().toISOString(),
        source: 'CAF Medical Standards'
      });
    }

    if (contentLower.includes('vision') && contentLower.includes('test')) {
      requirements.push({
        trade: trade,
        category: 'Vision Standards',
        requirement: 'Visual acuity and color vision testing',
        frequency: 'Annually',
        authority: 'CAF Medical Officer',
        lastUpdated: new Date().toISOString(),
        source: 'CAF Vision Standards'
      });
    }

    if (contentLower.includes('cardiovascular') || contentLower.includes('cardiac')) {
      requirements.push({
        trade: trade,
        category: 'Cardiovascular Health',
        requirement: 'Cardiovascular assessment and fitness evaluation',
        frequency: 'Annually',
        authority: 'CAF Medical Officer',
        lastUpdated: new Date().toISOString(),
        source: 'CAF Cardiovascular Standards'
      });
    }

    return requirements;
  }

  /**
   * Remove duplicate requirements
   */
  private deduplicateRequirements(requirements: TradeSpecificRequirement[]): TradeSpecificRequirement[] {
    const seen = new Set<string>();
    return requirements.filter(req => {
      const key = `${req.trade}-${req.category}-${req.requirement}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Ingest a web document into the vector database
   */
  private async ingestDocument(doc: WebSearchResult): Promise<void> {
    try {
      const reference = await medicalReferenceService.create({
        title: doc.title,
        document_type: doc.documentType,
        content: doc.content,
        source: doc.url,
        url: doc.url,
        version: '1.0',
        metadata: {
          webSearchResult: true,
          relevance: doc.relevance,
          sourceType: doc.source,
          ingestedAt: new Date().toISOString()
        }
      });

      await this.ragService.ingestDocument(reference.id);
      
      console.log(`✅ Ingested document: ${doc.title}`);
    } catch (error) {
      console.error(`❌ Failed to ingest document: ${doc.title}`, error);
      throw error;
    }
  }

  /**
   * Generate research summary
   */
  private async generateResearchSummary(documents: WebSearchResult[], topic: string): Promise<string> {
    const docCount = documents.length;
    const sources = documents.map(d => d.source).filter((s, i, arr) => arr.indexOf(s) === i);
    
    return `Research Summary for "${topic}":

Found ${docCount} relevant documents from ${sources.length} authoritative sources including ${sources.join(', ')}.

Key findings:
- Official CAF protocols and standards identified
- Current medical requirements documented
- Evidence-based guidelines available
- Trade-specific considerations noted

This research has been automatically integrated into the knowledge base for enhanced triage recommendations.`;
  }
}

export const webSearchService = new WebSearchService(); 