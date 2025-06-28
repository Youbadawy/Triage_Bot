// Enhanced Scout AI Service for Continuous Improvement
// Provides knowledge gap detection, resource discovery, and learning recommendations

import { RAGService } from './rag-service';
import { medicalReferenceService } from '../supabase/services';
import { WebSearchService } from './web-search-service';

export interface ScoutAnalysis {
  patternAnalysis: {
    primarySymptoms: string[];
    emergencyIndicators: string[];
    complexityIndicators: string[];
    triageCategory: string;
    symptomCount: number;
  };
  confidenceFactors: string[];
  improvementSuggestions: string[];
}

export interface KnowledgeGap {
  type: 'missing_documentation' | 'insufficient_coverage' | 'outdated_protocol' | 'specialty_gap';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: string;
}

export interface DiscoveredResource {
  title: string;
  url: string;
  source: string;
  documentType: string;
  relevance: number;
  discoveryQuery: string;
  suggestedForIngestion: boolean;
  estimatedQuality: 'low' | 'medium' | 'high';
}

export class ScoutEnhancementService {
  private ragService: RAGService;
  private webSearchService: WebSearchService;

  constructor() {
    this.ragService = RAGService.getInstance();
    this.webSearchService = new WebSearchService();
  }

  /**
   * Perform comprehensive Scout analysis with continuous improvement
   */
  async performEnhancedAnalysis(triageText: string, triageResult: any): Promise<{
    analysis: ScoutAnalysis;
    knowledgeGaps: KnowledgeGap[];
    discoveredResources: DiscoveredResource[];
    learningRecommendations: string[];
  }> {
    console.log('🧠 Scout: Performing enhanced analysis with continuous improvement...');

    const [analysis, knowledgeGaps, discoveredResources] = await Promise.all([
      this.performScoutAnalysis(triageText, triageResult),
      this.detectKnowledgeGaps(triageText, triageResult),
      this.discoverNewResources(triageText, triageResult)
    ]);

    // Automatically ingest high-quality discovered resources
    if (discoveredResources.length > 0) {
      await this.ingestDiscoveredResources(discoveredResources);
    }

    const learningRecommendations = await this.generateLearningRecommendations(
      triageText, 
      triageResult, 
      knowledgeGaps
    );

    return {
      analysis,
      knowledgeGaps,
      discoveredResources,
      learningRecommendations
    };
  }

  /**
   * Analyze triage patterns and AI performance
   */
  private async performScoutAnalysis(triageText: string, result: any): Promise<ScoutAnalysis> {
    const indexStatus = await this.ragService.getIndexStatus();
    
    // Extract medical keywords and patterns
    const medicalKeywords = this.extractMedicalKeywords(triageText);
    
    const patternAnalysis = {
      primarySymptoms: medicalKeywords.slice(0, 3),
      emergencyIndicators: medicalKeywords.filter(k => 
        ['severe', 'acute', 'sudden', 'emergency', 'urgent', 'chest pain', 'breathing'].includes(k.toLowerCase())
      ),
      complexityIndicators: medicalKeywords.filter(k => 
        ['multiple', 'chronic', 'recurring', 'persistent'].includes(k.toLowerCase())
      ),
      triageCategory: result.appointmentType,
      symptomCount: medicalKeywords.length
    };

    const confidenceFactors = this.identifyConfidenceFactors(triageText, result, indexStatus);
    const improvementSuggestions = this.generateImprovementSuggestions(triageText, result, indexStatus);

    return {
      patternAnalysis,
      confidenceFactors,
      improvementSuggestions
    };
  }

  /**
   * Detect knowledge gaps in the current knowledge base
   */
  private async detectKnowledgeGaps(triageText: string, result: any): Promise<KnowledgeGap[]> {
    const gaps: KnowledgeGap[] = [];
    
    try {
      // Search for relevant documents
      const ragResults = await this.ragService.searchDocuments(triageText, { limit: 5, threshold: 0.7 });
      const medicalKeywords = this.extractMedicalKeywords(triageText);
      
      // No relevant documentation found
      if (ragResults.length === 0) {
        gaps.push({
          type: 'missing_documentation',
          description: `No relevant documentation found for: ${medicalKeywords.join(', ')}`,
          priority: 'high',
          suggestedAction: 'Search and ingest relevant CAF medical protocols'
        });
      }

      // Emergency scenario with limited documentation
      if (ragResults.length < 3 && result.appointmentType === 'ER referral') {
        gaps.push({
          type: 'insufficient_coverage',
          description: 'Limited emergency protocol documentation for this scenario',
          priority: 'critical',
          suggestedAction: 'Expand emergency medical protocol library'
        });
      }

      // Missing specialist protocols
      if (result.appointmentType === 'specialist' && 
          !ragResults.some(r => r.metadata.documentType === 'specialist_protocol')) {
        gaps.push({
          type: 'specialty_gap',
          description: 'Missing specialist referral protocols',
          priority: 'medium',
          suggestedAction: 'Add CAF specialist referral guidelines'
        });
      }

      // Mental health documentation gap
      if (this.containsMentalHealthKeywords(medicalKeywords) && 
          !ragResults.some(r => r.metadata.documentTitle.toLowerCase().includes('mental'))) {
        gaps.push({
          type: 'specialty_gap',
          description: 'Limited mental health guidance documentation',
          priority: 'high',
          suggestedAction: 'Ingest CAF mental health support protocols'
        });
      }

      // Aviation medicine gap
      if (triageText.toLowerCase().includes('pilot') && 
          !ragResults.some(r => r.metadata.documentTitle.toLowerCase().includes('aviation'))) {
        gaps.push({
          type: 'specialty_gap',
          description: 'Missing CAF aviation medicine protocols',
          priority: 'high',
          suggestedAction: 'Add aviation medical examination requirements and protocols'
        });
      }

    } catch (error) {
      console.error('Error detecting knowledge gaps:', error);
      gaps.push({
        type: 'missing_documentation',
        description: 'Unable to analyze knowledge base completeness',
        priority: 'medium',
        suggestedAction: 'Check knowledge base connectivity and integrity'
      });
    }

    return gaps;
  }

  /**
   * Discover new resources to fill knowledge gaps
   */
  private async discoverNewResources(triageText: string, result: any): Promise<DiscoveredResource[]> {
    const discoveredResources: DiscoveredResource[] = [];
    
    try {
      const searchQueries = this.generateSearchQueries(triageText, result);
      
      // Limit to 3 searches to avoid rate limiting
      for (const query of searchQueries.slice(0, 3)) {
        console.log(`🔍 Scout discovering resources for: ${query}`);
        
        try {
          const searchResults = await this.webSearchService.searchCAFMedicalDocs(query);
          
          // Filter and evaluate results
          const qualityResults = searchResults
            .filter(result => result.relevance > 0.7 && result.source !== 'other')
            .slice(0, 2) // Top 2 per query
            .map(result => ({
              title: result.title,
              url: result.url,
              source: result.source,
              documentType: result.documentType,
              relevance: result.relevance,
              discoveryQuery: query,
              suggestedForIngestion: result.relevance > 0.8,
              estimatedQuality: this.evaluateResourceQuality(result)
            }));

          discoveredResources.push(...qualityResults);
          
        } catch (error) {
          console.error(`Error searching for ${query}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Error in resource discovery:', error);
    }

    // Remove duplicates and sort by relevance
    const uniqueResources = Array.from(
      new Map(discoveredResources.map(item => [item.url, item])).values()
    );
    
    return uniqueResources.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Generate learning recommendations for AI Maverick improvement
   */
  private async generateLearningRecommendations(
    triageText: string, 
    result: any, 
    knowledgeGaps: KnowledgeGap[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Knowledge base expansion recommendations
    if (knowledgeGaps.length > 2) {
      recommendations.push('🔄 Implement automated medical document discovery and ingestion pipeline');
    }

    // Emergency detection improvement
    if (result.appointmentType === 'GP' && triageText.toLowerCase().includes('urgent')) {
      recommendations.push('⚠️ Enhance urgency assessment algorithms - potential missed emergency indicators');
    }

    // Complex case handling
    if (this.extractMedicalKeywords(triageText).length > 5) {
      recommendations.push('🧩 Develop multi-symptom correlation algorithms for complex presentations');
    }

    // Specialty-specific improvements
    const keywords = this.extractMedicalKeywords(triageText);
    if (keywords.some(k => ['chest pain', 'breathing', 'heart'].includes(k.toLowerCase()))) {
      recommendations.push('❤️ Update cardiovascular emergency protocols and decision trees');
    }

    if (this.containsMentalHealthKeywords(keywords)) {
      recommendations.push('🧠 Expand mental health triage capabilities and crisis detection');
    }

    if (triageText.toLowerCase().includes('pilot')) {
      recommendations.push('✈️ Integrate CAF aviation medicine standards and flight medical requirements');
    }

    // Confidence improvement
    if (knowledgeGaps.some(gap => gap.priority === 'critical')) {
      recommendations.push('🚨 Critical knowledge gaps detected - immediate protocol review required');
    }

    // Performance optimization
    const indexStatus = await this.ragService.getIndexStatus();
    if (indexStatus.totalDocuments < 10) {
      recommendations.push('📚 Expand knowledge base to minimum 50 documents for optimal performance');
    }

    return recommendations;
  }

  // Helper methods
  private generateSearchQueries(triageText: string, result: any): string[] {
    const queries: string[] = [];
    const medicalKeywords = this.extractMedicalKeywords(triageText);
    
    // Generate queries based on appointment type
    switch (result.appointmentType) {
      case 'ER referral':
        queries.push('CAF emergency medical procedures', 'military medical emergency protocols');
        break;
      case 'specialist':
        queries.push('CAF specialist referral guidelines', 'military specialist medical care');
        break;
      case 'mental health':
        queries.push('CAF mental health support protocols', 'military mental health guidelines');
        break;
      case 'physio':
        queries.push('CAF physiotherapy protocols', 'military physical therapy guidelines');
        break;
    }

    // Add keyword-specific queries
    medicalKeywords.forEach(keyword => {
      queries.push(`CAF medical protocol ${keyword}`);
    });

    // Add aviation-specific queries if relevant
    if (triageText.toLowerCase().includes('pilot')) {
      queries.push('CAF aviation medicine requirements', 'military pilot medical standards');
    }

    return [...new Set(queries)]; // Remove duplicates
  }

  private evaluateResourceQuality(result: any): 'low' | 'medium' | 'high' {
    let qualityScore = 0;
    
    // Source quality
    if (result.source === 'caf_official') qualityScore += 3;
    else if (result.source === 'gov_canada') qualityScore += 2;
    else if (result.source === 'medical_authority') qualityScore += 2;
    else qualityScore += 1;
    
    // Document type quality
    if (['protocol', 'guideline'].includes(result.documentType)) qualityScore += 2;
    else qualityScore += 1;
    
    // Relevance quality
    if (result.relevance > 0.9) qualityScore += 2;
    else if (result.relevance > 0.8) qualityScore += 1;
    
    if (qualityScore >= 6) return 'high';
    if (qualityScore >= 4) return 'medium';
    return 'low';
  }

  private extractMedicalKeywords(triageText: string): string[] {
    const medicalTerms = [
      'pain', 'ache', 'fever', 'cough', 'headache', 'nausea', 'dizzy', 'fatigue',
      'chest pain', 'shortness of breath', 'breathing', 'heart', 'bleeding',
      'severe', 'acute', 'sudden', 'emergency', 'urgent', 'unconscious',
      'stress', 'anxiety', 'depression', 'mental health', 'counseling',
      'pilot', 'aircrew', 'aviation', 'flight medical', 'combat', 'military'
    ];

    const text = triageText.toLowerCase();
    return medicalTerms.filter(term => text.includes(term));
  }

  private containsMentalHealthKeywords(keywords: string[]): boolean {
    const mentalHealthTerms = ['stress', 'anxiety', 'depression', 'mental health', 'counseling', 'therapy'];
    return keywords.some(k => mentalHealthTerms.includes(k.toLowerCase()));
  }

  private identifyConfidenceFactors(triageText: string, result: any, indexStatus: any): string[] {
    const factors = [];
    
    if (indexStatus.totalChunks > 50) {
      factors.push('✅ Rich knowledge base available for evidence-based decisions');
    } else {
      factors.push('⚠️ Limited knowledge base - confidence may be reduced');
    }
    
    if (result.appointmentType === 'ER referral') {
      factors.push('🚨 Emergency indicators detected - high confidence in urgency assessment');
    }
    
    if (triageText.length > 100) {
      factors.push('📝 Detailed symptom description provides good analytical context');
    } else {
      factors.push('📝 Brief description - may benefit from additional details');
    }

    const keywords = this.extractMedicalKeywords(triageText);
    if (keywords.length > 3) {
      factors.push('🎯 Multiple medical indicators support decision confidence');
    }
    
    return factors;
  }

  private generateImprovementSuggestions(triageText: string, result: any, indexStatus: any): string[] {
    const suggestions = [];
    
    if (indexStatus.totalDocuments < 10) {
      suggestions.push('📚 Expand medical reference library for enhanced evidence-based decisions');
    }
    
    if (result.appointmentType === 'GP' && triageText.includes('pain')) {
      suggestions.push('⚖️ Implement standardized pain assessment scales and protocols');
    }
    
    if (this.extractMedicalKeywords(triageText).length < 3) {
      suggestions.push('🗣️ Enhance triage interface to encourage detailed symptom reporting');
    }

    if (triageText.toLowerCase().includes('pilot') && indexStatus.totalDocuments < 5) {
      suggestions.push('✈️ Add CAF aviation medicine protocols for pilot-specific medical requirements');
    }
    
    return suggestions;
  }

  /**
   * Ingest high-quality discovered resources into the database.
   * This closes the continuous improvement loop.
   */
  private async ingestDiscoveredResources(resources: DiscoveredResource[]): Promise<void> {
    const resourcesToIngest = resources.filter(r => r.suggestedForIngestion);

    if (resourcesToIngest.length === 0) {
      return;
    }

    console.log(`Ingesting ${resourcesToIngest.length} new resources into the knowledge base...`);

    for (const resource of resourcesToIngest) {
      try {
        // Here we would typically fetch the full content from the URL.
        // For now, we'll create a document with the title and a placeholder content.
        const documentContent = `Reference document for: ${resource.title}. Full content available at ${resource.url}. This document was automatically discovered and ingested by Scout AI based on its relevance to user queries.`;
        
        const newDocument = {
          title: resource.title,
          document_type: resource.documentType || 'guideline',
          source: resource.source,
          url: resource.url,
          content: documentContent,
          tags: this.extractKeywordsFromTitle(resource.title),
          is_active: true,
          version: new Date().getFullYear().toString()
        };

        const createdDoc = await medicalReferenceService.create(newDocument);
        console.log(`✅ Successfully ingested document: ${createdDoc.title} (ID: ${createdDoc.id})`);
      } catch (error) {
        console.error(`Failed to ingest resource: ${resource.title}`, error);
      }
    }
  }

  private extractKeywordsFromTitle(title: string): string[] {
    const stopWords = new Set(['a', 'an', 'the', 'for', 'of', 'in', 'and', 'on', 'with', 'guide', 'protocol', 'document']);
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter(word => !stopWords.has(word) && word.length > 2);
  }
} 