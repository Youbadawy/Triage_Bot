// Enhanced triage flow with RAG integration
// Provides evidence-based medical recommendations using document search

import { callOpenRouter } from '../genkit';
import { simpleRAGSearch, type SearchContext } from '../../lib/rag/simple-search';

export interface TriageInput {
  message: string;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
  sessionId?: string;
}

export interface TriageOutput {
  appointmentType: 'sick parade' | 'GP' | 'mental health' | 'physio' | 'specialist' | 'ER referral';
  reason: string;
  complexity: 'easy' | 'medium' | 'complex';
  ragContext?: SearchContext;
  evidenceBased: boolean;
  sources?: string[];
}

/**
 * Enhanced triage chatbot with RAG integration
 */
export async function enhancedTriageChatbot(input: TriageInput): Promise<TriageOutput> {
  console.log('🏥 Enhanced Triage with RAG - Processing:', input.message);

  try {
    // Step 1: Analyze the user's input to extract medical keywords
    const medicalKeywords = extractMedicalKeywords(input.message);
    console.log('🔍 Extracted medical keywords:', medicalKeywords);

    // Step 2: Search for relevant medical context
    let ragContext: SearchContext | undefined;
    let evidenceBased = false;
    let sources: string[] = [];

    if (medicalKeywords.length > 0) {
      console.log('📚 Searching for medical context...');
      
      // Determine search strategy based on content
      if (isEmergencyIndicator(input.message)) {
        ragContext = await simpleRAGSearch.getEmergencyContext(medicalKeywords.join(' '));
      } else if (isMentalHealthIndicator(input.message)) {
        ragContext = await simpleRAGSearch.getMentalHealthContext(medicalKeywords.join(' '));
      } else {
        ragContext = await simpleRAGSearch.getTriageContext(medicalKeywords.join(' '));
      }

      if (ragContext.results.length > 0) {
        evidenceBased = true;
        sources = ragContext.results.map(r => r.documentTitle);
        console.log(`✅ Found ${ragContext.results.length} relevant medical documents`);
      } else {
        console.log('ℹ️ No relevant medical documents found, proceeding with standard triage');
      }
    }

    // Step 3: Create enhanced prompt with medical context
    const enhancedPrompt = createEnhancedTriagePrompt(input, ragContext);

    // Step 4: Call OpenRouter with enhanced context
    const response = await callOpenRouter({
      model: 'meta-llama/llama-4-maverick:free',
      messages: [{ role: 'user', content: enhancedPrompt }],
      temperature: 0.1,
      max_tokens: 4000,
    });

    // Step 5: Parse the response
    const triageResult = parseTriageResponse(response);

    // Step 6: Return enhanced result with RAG context
    return {
      ...triageResult,
      ragContext,
      evidenceBased,
      sources: evidenceBased ? sources : undefined,
    };

  } catch (error) {
    console.error('❌ Enhanced triage error:', error);
    
    // Fallback to basic triage without RAG
    return {
      appointmentType: 'GP',
      reason: 'I apologize, but I encountered an issue accessing medical references. For your safety, I recommend scheduling an appointment with a General Practitioner (GP) to discuss your concerns. Please contact your base clinic to book an appointment.',
      complexity: 'medium',
      evidenceBased: false,
    };
  }
}

/**
 * Extract medical keywords from user input
 */
function extractMedicalKeywords(message: string): string[] {
  const commonMedicalTerms = [
    // Symptoms
    'pain', 'ache', 'hurt', 'sore', 'fever', 'cough', 'headache', 'nausea', 'dizzy', 'fatigue',
    'shortness of breath', 'chest pain', 'abdominal pain', 'back pain', 'joint pain',
    'swelling', 'rash', 'bleeding', 'vomiting', 'diarrhea', 'constipation',
    
    // Body parts
    'head', 'neck', 'chest', 'abdomen', 'back', 'arm', 'leg', 'knee', 'shoulder', 'ankle',
    'stomach', 'heart', 'lung', 'throat', 'ear', 'eye', 'nose',
    
    // Conditions
    'injury', 'accident', 'fall', 'cut', 'burn', 'sprain', 'fracture', 'infection',
    'allergic reaction', 'asthma', 'diabetes', 'hypertension', 'depression', 'anxiety',
    
    // Mental health
    'stress', 'anxiety', 'depression', 'mental health', 'counseling', 'therapy',
    'sleep problems', 'insomnia', 'panic', 'trauma', 'ptsd',
    
    // Emergency indicators
    'emergency', 'urgent', 'severe', 'acute', 'sudden', 'immediate', 'can\'t breathe',
    'unconscious', 'bleeding heavily', 'chest pain', 'heart attack', 'stroke'
  ];

  const messageLower = message.toLowerCase();
  const foundTerms: string[] = [];

  for (const term of commonMedicalTerms) {
    if (messageLower.includes(term)) {
      foundTerms.push(term);
    }
  }

  // Also include any words that might be symptoms (simple heuristic)
  const words = message.toLowerCase().match(/\b\w{4,}\b/g) || [];
  for (const word of words) {
    if (word.endsWith('ing') || word.endsWith('ed') || word.endsWith('ache') || word.endsWith('pain')) {
      if (!foundTerms.includes(word)) {
        foundTerms.push(word);
      }
    }
  }

  return foundTerms.slice(0, 5); // Limit to top 5 terms
}

/**
 * Check if input indicates emergency
 */
function isEmergencyIndicator(message: string): boolean {
  const emergencyKeywords = [
    'emergency', 'urgent', 'severe', 'acute', 'sudden', 'immediate',
    'can\'t breathe', 'chest pain', 'heart attack', 'stroke', 'unconscious',
    'bleeding heavily', 'severe pain', 'can\'t move', 'difficulty breathing'
  ];

  const messageLower = message.toLowerCase();
  return emergencyKeywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Check if input indicates mental health concern
 */
function isMentalHealthIndicator(message: string): boolean {
  const mentalHealthKeywords = [
    'stress', 'anxiety', 'depression', 'mental health', 'counseling', 'therapy',
    'sleep problems', 'insomnia', 'panic', 'trauma', 'ptsd', 'suicidal',
    'self-harm', 'emotional', 'psychological', 'mood', 'overwhelmed'
  ];

  const messageLower = message.toLowerCase();
  return mentalHealthKeywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Create enhanced prompt with RAG context
 */
function createEnhancedTriagePrompt(input: TriageInput, ragContext?: SearchContext): string {
  let prompt = `You are LLaMA 4 Maverick, a friendly, empathetic, and highly professional Canadian Armed Forces medical triage assistant.

Your primary role is to understand the user's symptoms or medical concerns through natural, straightforward conversation, recommend an appropriate type of medical appointment, and guide them on next steps, including how to schedule if they wish.`;

  // Add RAG context if available
  if (ragContext && ragContext.results.length > 0) {
    prompt += `

MEDICAL REFERENCE CONTEXT:
Based on CAF medical protocols and guidelines, here are relevant references for this case:

`;
    
    for (const result of ragContext.results.slice(0, 3)) {
      prompt += `📋 ${result.documentTitle} (${result.documentType}):
${result.content.substring(0, 300)}...

`;
    }

    prompt += `Please use this medical reference information to provide evidence-based recommendations while maintaining your conversational and empathetic tone.`;
  }

  prompt += `

The 'appointmentType' field in your JSON output is for internal categorization and must be one of these exact strings: "sick parade", "GP", "mental health", "physio", "specialist", or "ER referral".

The 'complexity' field in your JSON output must be one of "easy", "medium", or "complex".
- "easy": Simple, straightforward cases that can be handled by the bot (e.g., a common cold).
- "medium": Cases that are not emergencies but require some attention (e.g., a persistent cough).
- "complex": Cases that are not immediate emergencies but should be reviewed by a primary care clinician (e.g., multiple interacting symptoms, chronic conditions).

The 'reason' field in your JSON output is your primary conversational response to the user. It MUST be structured clearly and directly as follows:
1. Start by acknowledging their concern or input.
2. State your recommended 'appointmentType' in user-friendly terms (e.g., "Based on what you've described, I recommend you see a General Practitioner (GP), who is also known as a Primary Care Clinician.").
3. Clearly explain *why* this appointment type is recommended based on their input.`;

  if (ragContext && ragContext.results.length > 0) {
    prompt += `
4. Reference the supporting medical documentation when relevant (e.g., "According to CAF medical protocols, [relevant guideline]").`;
  }

  prompt += `
5. Provide concise, actionable next steps (e.g., "To proceed, you should contact your base clinic or local medical facility to schedule an appointment. Let them know you've been advised to see a GP or Primary Care Clinician based on a triage assessment.").
6. After providing the recommendation and initial next steps, ask the user if they would like more specific information on booking this appointment or if they have any other questions.
7. Always maintain an empathetic, professional, and helpful tone. Encourage further questions.

If the user's input strongly indicates a life-threatening emergency (e.g., severe chest pain, difficulty breathing, uncontrolled bleeding, active suicidal thoughts with a plan and intent), your 'appointmentType' must be "ER referral" and the 'complexity' must be "complex".
In such cases, the 'reason' must be very direct, strongly advising them to seek immediate emergency care.

Chat History:
${input.chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's current input: "${input.message}"

Based on all the information${ragContext ? ' and the medical reference context provided' : ''}, determine the most appropriate 'appointmentType' (for internal use) and 'complexity', and craft a comprehensive, conversational 'reason' for the user, following the multi-point structure above.

Your response MUST be in the following JSON format. Do not add any other text, explanations, or markdown formatting outside of the JSON structure itself.

{
  "appointmentType": "string (must be one of: sick parade, GP, mental health, physio, specialist, ER referral)",
  "reason": "string (your detailed, conversational, and explanatory response to the user, structured as per the guidelines above)",
  "complexity": "string (must be one of: easy, medium, complex)"
}`;

  return prompt;
}

/**
 * Parse OpenRouter response
 */
function parseTriageResponse(response: string): Pick<TriageOutput, 'appointmentType' | 'reason' | 'complexity'> {
  try {
    const parsed = JSON.parse(response);
    
    // Validate required fields
    if (!parsed.appointmentType || !parsed.reason || !parsed.complexity) {
      throw new Error('Missing required fields in response');
    }

    // Validate appointmentType
    const validAppointmentTypes = ['sick parade', 'GP', 'mental health', 'physio', 'specialist', 'ER referral'];
    if (!validAppointmentTypes.includes(parsed.appointmentType)) {
      throw new Error(`Invalid appointmentType: ${parsed.appointmentType}`);
    }

    // Validate complexity
    const validComplexities = ['easy', 'medium', 'complex'];
    if (!validComplexities.includes(parsed.complexity)) {
      throw new Error(`Invalid complexity: ${parsed.complexity}`);
    }

    return {
      appointmentType: parsed.appointmentType,
      reason: parsed.reason,
      complexity: parsed.complexity,
    };
  } catch (error) {
    console.error('❌ Error parsing triage response:', error);
    console.error('❌ Raw response:', response);
    
    // Return fallback response
    return {
      appointmentType: 'GP',
      reason: 'I apologize, but I had trouble processing your request. For your safety, I recommend scheduling an appointment with a General Practitioner (GP) to discuss your concerns. Please contact your base clinic to book an appointment.',
      complexity: 'medium',
    };
  }
} 