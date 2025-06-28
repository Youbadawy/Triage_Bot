import { NextRequest, NextResponse } from 'next/server';
import { policyBasedAppointmentRouting } from '@/ai/flows/policy-based-routing';
import { ScoutEnhancementService } from '@/lib/rag/scout-enhancement-service';

export async function POST(request: NextRequest) {
  try {
    const { triageText, includeContext, enableContinuousImprovement } = await request.json();
    
    if (!triageText || typeof triageText !== 'string') {
      return NextResponse.json({ error: 'Triage text is required' }, { status: 400 });
    }

    console.log(`🔍 Scout AI Analysis: "${triageText.substring(0, 100)}..."`);

    // Use the existing policy-based routing with Scout AI
    const result = await policyBasedAppointmentRouting({ triageText });

    // 🧠 Enhanced Scout Analysis with Continuous Improvement
    const scoutService = new ScoutEnhancementService();
    let continuousImprovementData = null;
    
    if (enableContinuousImprovement) {
      continuousImprovementData = await scoutService.performEnhancedAnalysis(triageText, result);
    }

    // Enhanced response with confidence scoring and sources
    const response = {
      appointmentType: result.appointmentType,
      reason: result.reason,
      confidence: calculateConfidence(result.appointmentType, result.reason),
      sources: extractSources(result.reason),
      timestamp: new Date().toISOString(),
      scoutModel: 'meta-llama/llama-4-scout',
      analysis: {
        triageText: triageText.substring(0, 200),
        complexity: determineComplexity(triageText, result.appointmentType),
        urgency: determineUrgency(result.appointmentType),
        medicalKeywords: extractMedicalKeywords(triageText),
        ...(continuousImprovementData && {
          patternAnalysis: continuousImprovementData.analysis.patternAnalysis
        })
      },
      
      // 🚀 NEW: Continuous Improvement Features (only if enabled)
      ...(continuousImprovementData && {
        continuousImprovement: {
          knowledgeGaps: continuousImprovementData.knowledgeGaps,
          discoveredResources: continuousImprovementData.discoveredResources,
          improvementSuggestions: continuousImprovementData.analysis.improvementSuggestions,
          confidenceFactors: continuousImprovementData.analysis.confidenceFactors,
          learningRecommendations: continuousImprovementData.learningRecommendations
        }
      })
    };

    console.log(`✅ Enhanced Scout Analysis complete: ${result.appointmentType} (${Math.round(response.confidence * 100)}% confidence)`);
    if (continuousImprovementData) {
      console.log(`🧠 Identified ${continuousImprovementData.knowledgeGaps.length} knowledge gaps, discovered ${continuousImprovementData.discoveredResources.length} potential resources`);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Scout Analysis API Error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: {
        appointmentType: 'GP',
        reason: 'Unable to complete analysis at this time. Please consult with a General Practitioner for proper evaluation.',
        confidence: 0.5,
        sources: ['System Fallback']
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced Scout AI Analysis API with Continuous Improvement',
    description: 'POST a JSON body with { "triageText": "patient symptoms...", "enableContinuousImprovement": true } to get AI-powered analysis with knowledge discovery',
    model: 'meta-llama/llama-4-scout',
    capabilities: [
      'Policy-based appointment routing',
      'CAF medical protocol compliance', 
      'Emergency detection',
      'Evidence-based recommendations',
      '🔥 NEW: Knowledge gap detection',
      '🔥 NEW: Database resource discovery',
      '🔥 NEW: Continuous improvement loop',
      '🔥 NEW: AI Maverick feedback'
    ],
    example: {
      triageText: 'Patient reports chest pain, shortness of breath, and dizziness lasting 2 hours. Pain radiates to left arm.',
      includeContext: true,
      enableContinuousImprovement: true
    }
  });
}

// Helper functions used by both Scout service and API

// Existing helper functions (enhanced)
function extractMedicalKeywords(triageText: string): string[] {
  const commonMedicalTerms = [
    // Symptoms
    'pain', 'ache', 'hurt', 'sore', 'fever', 'cough', 'headache', 'nausea', 'dizzy', 'fatigue',
    'shortness of breath', 'chest pain', 'abdominal pain', 'back pain', 'joint pain',
    'swelling', 'rash', 'bleeding', 'vomiting', 'diarrhea', 'constipation',
    
    // Emergency indicators
    'severe', 'acute', 'sudden', 'emergency', 'urgent', 'can\'t breathe',
    'unconscious', 'bleeding heavily', 'heart attack', 'stroke',
    
    // Mental health
    'stress', 'anxiety', 'depression', 'mental health', 'counseling', 'therapy',
    'sleep problems', 'insomnia', 'panic', 'trauma', 'ptsd',
    
    // CAF specific
    'pilot', 'aircrew', 'aviation medicine', 'flight medical', 'G-force',
    'combat', 'deployment', 'training injury', 'military'
  ];

  const messageLower = triageText.toLowerCase();
  const foundTerms: string[] = [];

  for (const term of commonMedicalTerms) {
    if (messageLower.includes(term)) {
      foundTerms.push(term);
    }
  }

  return [...new Set(foundTerms)]; // Remove duplicates
}

function calculateConfidence(appointmentType: string, reason: string): number {
  // Base confidence on appointment type specificity and reason length
  let confidence = 0.75; // Base confidence
  
  // Higher confidence for specific, evidence-based recommendations
  if (appointmentType === 'ER referral') {
    confidence = 0.95; // High confidence for emergency situations
  } else if (appointmentType === 'specialist') {
    confidence = 0.85; // Good confidence for specialist referrals
  } else if (appointmentType === 'mental health') {
    confidence = 0.80; // Good confidence for mental health
  } else if (appointmentType === 'physio') {
    confidence = 0.82; // Good confidence for physical therapy
  } else if (appointmentType === 'sick parade') {
    confidence = 0.78; // Moderate confidence for routine care
  } else if (appointmentType === 'GP') {
    confidence = 0.75; // Moderate confidence for general care
  }
  
  // Adjust based on reason quality
  if (reason.length > 200) {
    confidence += 0.05; // More detailed reasoning
  }
  
  if (reason.includes('emergency') || reason.includes('urgent')) {
    confidence += 0.05; // Emergency keywords increase confidence
  }
  
  if (reason.includes('CAF') || reason.includes('protocol')) {
    confidence += 0.03; // Policy-based reasoning
  }
  
  return Math.min(confidence, 0.98); // Cap at 98%
}

function extractSources(reason: string): string[] {
  const sources: string[] = [];
  
  // Extract common medical sources mentioned in reasoning
  const sourcePatterns = [
    /CAF.*?protocol/gi,
    /medical.*?guideline/gi,
    /emergency.*?procedure/gi,
    /clinical.*?standard/gi,
    /triage.*?protocol/gi
  ];
  
  sourcePatterns.forEach(pattern => {
    const matches = reason.match(pattern);
    if (matches) {
      sources.push(...matches.map(m => m.charAt(0).toUpperCase() + m.slice(1)));
    }
  });
  
  // Default sources if none found
  if (sources.length === 0) {
    sources.push('CAF Medical Protocols', 'Clinical Guidelines');
  }
  
  return [...new Set(sources)]; // Remove duplicates
}

function determineComplexity(triageText: string, appointmentType: string): 'simple' | 'moderate' | 'complex' {
  const text = triageText.toLowerCase();
  
  // Complex cases
  if (appointmentType === 'ER referral' || 
      text.includes('multiple') || 
      text.includes('chronic') ||
      text.includes('complicated')) {
    return 'complex';
  }
  
  // Moderate cases
  if (appointmentType === 'specialist' || 
      text.includes('persistent') || 
      text.includes('recurring')) {
    return 'moderate';
  }
  
  return 'simple';
}

function determineUrgency(appointmentType: string): 'low' | 'medium' | 'high' | 'emergency' {
  switch (appointmentType) {
    case 'ER referral':
      return 'emergency';
    case 'specialist':
    case 'mental health':
      return 'high';
    case 'GP':
    case 'physio':
      return 'medium';
    case 'sick parade':
      return 'low';
    default:
      return 'medium';
  }
} 