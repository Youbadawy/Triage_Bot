// Enhanced triage flow with RAG integration
// Provides evidence-based medical recommendations using document search

import { callOpenRouter } from '../genkit';
import { ai } from '../genkit';
import { simpleRAGSearch, type SearchContext } from '../../lib/rag/simple-search';

export interface TriageInput {
  message: string;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
  sessionId?: string;
}

export interface TriageOutput {
  appointmentType: 'sick parade' | 'GP' | 'mental health' | 'physio' | 'specialist' | 'ER referral' | 'no appointment needed';
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
    // Step 0: Check if this is a non-medical query first
    if (isNonMedicalQuery(input.message)) {
      console.log('ℹ️ Detected non-medical query, providing appropriate response');
      return handleNonMedicalQuery(input.message);
    }

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

    // Step 4: Call AI with enhanced context - Use Google Gemini as primary
    let response: string;
    
    try {
      // Try Google Gemini first (working API key)
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-latest',
        prompt: enhancedPrompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 4000,
        },
      });
      
      response = output?.text || '';
      if (!response.trim()) {
        throw new Error('Google Gemini returned empty response');
      }
      console.log('✅ Google Gemini response successful');
    } catch (geminiError) {
      console.log('⚠️ Google Gemini failed, trying OpenRouter...');
      
      try {
        // Fallback to OpenRouter 
        response = await callOpenRouter({
          model: 'meta-llama/llama-4-maverick',
          messages: [{ role: 'user', content: enhancedPrompt }],
          temperature: 0.1,
          max_tokens: 4000,
        });
        console.log('✅ OpenRouter response successful');
      } catch (openRouterError) {
        console.log('⚠️ OpenRouter failed, using development mode...');
        console.log('🔧 AI system running in DEVELOPMENT MODE - using mock responses');
        
        // Ultimate fallback: development mode
        response = generateMockTriageResponse(input, ragContext);
      }
    }

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
  let prompt = `You are an expert Canadian Armed Forces medical triage assistant powered by Google Gemini. You are friendly, empathetic, and highly professional.

Your primary role is to understand the user's symptoms or medical concerns through natural conversation, recommend an appropriate type of medical appointment, and guide them on next steps.

CRITICAL: You must respond with valid JSON in exactly this format:
{
  "appointmentType": "one of: sick parade, GP, mental health, physio, specialist, ER referral, no appointment needed",
  "reason": "detailed explanation of your recommendation and next steps",
  "complexity": "one of: easy, medium, complex"
}`;

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
    
    prompt += `Please use this evidence-based context to inform your triage decision.

`;
  }

  prompt += `

USER'S MESSAGE: "${input.message}"

APPOINTMENT TYPES AVAILABLE:
- **sick parade**: For routine, non-urgent medical issues
- **GP**: For general medical concerns requiring physician assessment  
- **mental health**: For psychological, emotional, or mental health concerns
- **physio**: For musculoskeletal injuries, mobility issues, or rehabilitation
- **specialist**: For complex conditions requiring specialized medical expertise
- **ER referral**: For urgent/emergency situations requiring immediate care
- **no appointment needed**: For non-medical queries, greetings, tests, or when no medical intervention is required

RESPONSE REQUIREMENTS:
1. Analyze the user's input and context
2. Choose the most appropriate appointment type (including "no appointment needed" for non-medical queries)
3. For medical concerns: provide clear reasoning based on medical best practices
4. For non-medical queries: provide helpful, friendly responses without forcing medical appointments
5. Include appropriate guidance on next steps
6. Use warm, professional, and reassuring language
7. Format as valid JSON with no extra text

Remember: 
- For medical concerns: When in doubt about severity, err on the side of caution and recommend a higher level of care
- For non-medical queries: Don't force medical appointments - use "no appointment needed" and provide helpful information`;

  return prompt;
}

/**
 * Parse OpenRouter response
 */
function parseTriageResponse(response: string): Pick<TriageOutput, 'appointmentType' | 'reason' | 'complexity'> {
  try {
    // Check if response is empty or whitespace
    if (!response || !response.trim()) {
      console.error('❌ Empty response received from AI service');
      throw new Error('Empty response from AI service');
    }

    console.log(`🔍 Parsing response (${response.length} chars):`, response.substring(0, 200) + '...');
    
    // Clean up the response - remove markdown code blocks if present
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(cleanResponse);

    // Validate required fields
    if (!parsed.appointmentType || !parsed.reason || !parsed.complexity) {
      console.error('❌ Missing required fields in response:', { 
        hasAppointmentType: !!parsed.appointmentType,
        hasReason: !!parsed.reason,
        hasComplexity: !!parsed.complexity 
      });
      throw new Error('Missing required fields in AI response');
    }

    // Validate appointmentType values
    const validAppointmentTypes = ['sick parade', 'GP', 'mental health', 'physio', 'specialist', 'ER referral', 'no appointment needed'];
    if (!validAppointmentTypes.includes(parsed.appointmentType)) {
      console.error('❌ Invalid appointmentType:', parsed.appointmentType);
      parsed.appointmentType = 'GP'; // Default fallback
    }

    // Validate complexity values
    const validComplexity = ['easy', 'medium', 'complex'];
    if (!validComplexity.includes(parsed.complexity)) {
      console.error('❌ Invalid complexity:', parsed.complexity);
      parsed.complexity = 'medium'; // Default fallback
    }

    return {
      appointmentType: parsed.appointmentType,
      reason: parsed.reason,
      complexity: parsed.complexity,
    };
  } catch (error) {
    console.error('❌ Error parsing triage response:', error);
    console.error('❌ Raw response:', response);
    
    // Return safe fallback
    return {
      appointmentType: 'GP',
      reason: 'I apologize, but I encountered a technical issue while processing your request. For your safety, I recommend scheduling an appointment with a General Practitioner (GP) to discuss your concerns. Please contact your base clinic to book an appointment.',
      complexity: 'medium',
    };
  }
}

/**
 * Generate mock triage response for development mode
 */
function generateMockTriageResponse(input: TriageInput, ragContext?: SearchContext): string {
  const message = input.message.toLowerCase();
  
  // Check for non-medical queries first
  if (isNonMedicalQuery(input.message)) {
    const nonMedicalResponse = handleNonMedicalQuery(input.message);
    return JSON.stringify({
      appointmentType: nonMedicalResponse.appointmentType,
      reason: nonMedicalResponse.reason + "\n\n[DEV MODE: This is a mock response. To enable full AI capabilities, configure your OpenRouter or Google API keys.]",
      complexity: nonMedicalResponse.complexity
    });
  }
  
  // Determine mock appointment type based on keywords
  let appointmentType = 'GP';
  let complexity = 'medium';
  let reason = '';
  
  if (message.includes('emergency') || message.includes('urgent') || message.includes('chest pain') || message.includes('can\'t breathe')) {
    appointmentType = 'ER referral';
    complexity = 'complex';
    reason = 'Based on what you\'ve described, this appears to be an urgent situation that requires immediate medical attention. I strongly recommend you go to the Emergency Room (ER) right away or call emergency services. Please don\'t delay seeking immediate care.';
  } else if (message.includes('stress') || message.includes('anxiety') || message.includes('depression') || message.includes('mental health')) {
    appointmentType = 'mental health';
    complexity = 'medium';
    reason = 'I understand you\'re dealing with mental health concerns. Based on what you\'ve shared, I recommend scheduling an appointment with a Mental Health Professional or counselor. They can provide specialized support and appropriate treatment options for your situation.';
  } else if (message.includes('physio') || message.includes('muscle') || message.includes('joint') || message.includes('back pain') || message.includes('injury')) {
    appointmentType = 'physio';
    complexity = 'medium';
    reason = 'From what you\'ve described, it sounds like you may benefit from physiotherapy. I recommend seeing a Physiotherapist who can assess your condition and provide appropriate treatment and rehabilitation exercises.';
  } else if (message.includes('specialist') || message.includes('chronic') || message.includes('ongoing')) {
    appointmentType = 'specialist';
    complexity = 'complex';
    reason = 'Based on your description, this may require specialized medical attention. I recommend seeing a Specialist who can provide more targeted evaluation and treatment for your specific condition.';
  } else if (message.includes('cold') || message.includes('flu') || message.includes('minor')) {
    appointmentType = 'sick parade';
    complexity = 'easy';
    reason = 'This sounds like it could be managed at sick parade. I recommend attending sick parade at your unit for an initial assessment and basic medical care.';
  } else {
    appointmentType = 'GP';
    complexity = 'medium';
    reason = 'Based on what you\'ve described, I recommend scheduling an appointment with a General Practitioner (GP), also known as a Primary Care Clinician. They can properly assess your symptoms and determine the best course of treatment.';
  }
  
  // Add RAG context note if available
  if (ragContext && ragContext.results.length > 0) {
    reason += ` This recommendation is supported by CAF medical protocols and guidelines.`;
  }
  
  reason += ` To proceed, please contact your base clinic or local medical facility to schedule an appointment. Would you like more information about booking this appointment or do you have any other questions?`;
  
  // Add development mode note
  reason += ` 

[DEV MODE: This is a mock response. To enable full AI capabilities, configure your OpenRouter or Google API keys.]`;

  return JSON.stringify({
    appointmentType,
    reason,
    complexity
  });
}

/**
 * Check if the input is a non-medical query
 */
function isNonMedicalQuery(message: string): boolean {
  const messageLower = message.toLowerCase().trim();
  
  // Test messages
  if (messageLower === 'test' || messageLower === 'testing' || messageLower === 'hello' || 
      messageLower === 'hi' || messageLower === 'hey' || messageLower === 'ping') {
    return true;
  }
  
  // Greetings and general questions
  const nonMedicalPatterns = [
    /^(hello|hi|hey|good morning|good afternoon|good evening)/,
    /^(test|testing|check)/,
    /^(how are you|what can you do|how do you work)/,
    /^(help|info|information|about)/,
    /^(thank you|thanks|bye|goodbye)/,
    /^(what|how|when|where|why).*(system|work|help|service)/
  ];
  
  return nonMedicalPatterns.some(pattern => pattern.test(messageLower));
}

/**
 * Handle non-medical queries appropriately
 */
function handleNonMedicalQuery(message: string): TriageOutput {
  const messageLower = message.toLowerCase().trim();
  
  let reason = '';
  
  if (messageLower === 'test' || messageLower === 'testing') {
    reason = "Hello! I see you're testing the system. I'm your CAF MedRoute medical triage assistant, and I'm working properly! ✅\n\nI'm here to help you with medical concerns, symptoms, or health-related questions. When you have actual medical symptoms or health concerns, just describe them to me and I'll provide appropriate appointment recommendations.\n\nHow can I assist you with your health needs today?";
  } else if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
    reason = "Hello! Welcome to CAF MedRoute, your medical triage assistant. I'm here to help you understand your symptoms and recommend the appropriate type of medical appointment.\n\nPlease tell me about any symptoms, injuries, or health concerns you're experiencing, and I'll guide you toward the right care. What brings you here today?";
  } else if (messageLower.includes('help') || messageLower.includes('how do you work')) {
    reason = "I'm here to help you with medical triage! Here's how I work:\n\n• Describe your symptoms or health concerns to me\n• I'll analyze what you're experiencing\n• I'll recommend the most appropriate type of medical appointment\n• I'll guide you on next steps for getting care\n\nI can recommend appointments for: sick parade, GP visits, mental health services, physiotherapy, specialist referrals, or emergency care.\n\nWhat health concerns can I help you with today?";
  } else if (messageLower.includes('thank') || messageLower.includes('bye')) {
    reason = "You're welcome! Take care of yourself, and remember that I'm here whenever you need medical guidance. Stay safe and healthy! 🏥";
  } else {
    reason = "I'm your CAF MedRoute medical triage assistant. I'm designed to help with medical symptoms and health concerns to recommend appropriate care.\n\nIf you have medical symptoms, injuries, or health questions, please describe them and I'll provide guidance. For non-medical questions, you might want to contact your unit's information services.\n\nHow can I help with your health needs today?";
  }
  
  return {
    appointmentType: 'no appointment needed',
    reason,
    complexity: 'easy',
    evidenceBased: false,
  };
} 