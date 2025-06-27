import { NextRequest, NextResponse } from 'next/server';
import { policyBasedAppointmentRouting } from '@/ai/flows/policy-based-routing';

export async function POST(request: NextRequest) {
  try {
    const { triageText, includeContext } = await request.json();
    
    if (!triageText || typeof triageText !== 'string') {
      return NextResponse.json({ error: 'Triage text is required' }, { status: 400 });
    }

    console.log(`🔍 Scout AI Analysis: "${triageText.substring(0, 100)}..."`);

    // Use the existing policy-based routing with Scout AI
    const result = await policyBasedAppointmentRouting({ triageText });

    // Enhanced response with confidence scoring and sources
    const response = {
      appointmentType: result.appointmentType,
      reason: result.reason,
      confidence: calculateConfidence(result.appointmentType, result.reason),
      sources: extractSources(result.reason),
      timestamp: new Date().toISOString(),
      scoutModel: 'meta-llama/llama-4-scout',
      analysis: {
        triageText: triageText.substring(0, 200), // First 200 chars for reference
        complexity: determineComplexity(triageText, result.appointmentType),
        urgency: determineUrgency(result.appointmentType)
      }
    };

    console.log(`✅ Scout Analysis complete: ${result.appointmentType} (${Math.round(response.confidence * 100)}% confidence)`);

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
    message: 'Scout AI Analysis API',
    description: 'POST a JSON body with { "triageText": "patient symptoms..." } to get AI-powered appointment routing',
    model: 'meta-llama/llama-4-scout',
    capabilities: [
      'Policy-based appointment routing',
      'CAF medical protocol compliance', 
      'Emergency detection',
      'Evidence-based recommendations'
    ],
    example: {
      triageText: 'Patient reports chest pain, shortness of breath, and dizziness lasting 2 hours. Pain radiates to left arm.',
      includeContext: true
    }
  });
}

// Helper functions
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