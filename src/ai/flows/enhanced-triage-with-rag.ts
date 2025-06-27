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

    // Step 4: Call AI with enhanced context - Use LLaMA 4 Maverick as primary
    let response: string;
    
    try {
      // Try OpenRouter LLaMA 4 Maverick first (primary)
      response = await callOpenRouter({
        model: 'meta-llama/llama-4-maverick',
        messages: [{ role: 'user', content: enhancedPrompt }],
        temperature: 0.1,
        max_tokens: 4000,
      });
      console.log('✅ LLaMA 4 Maverick (primary) response successful');
    } catch (llamaError) {
      console.log('⚠️ LLaMA 4 Maverick failed, trying Google Gemini backup...');
      
      try {
        // Fallback to Google Gemini 2.5 Pro
        const { output } = await ai.generate({
          model: 'googleai/gemini-2.5-pro-latest',
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
        console.log('✅ Google Gemini 2.5 Pro (backup) response successful');
      } catch (geminiError) {
        console.log('⚠️ Both AI services failed, using development mode...');
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
  let prompt = `You are an expert Canadian Armed Forces medical triage assistant powered by LLaMA 4 Maverick. You are friendly, empathetic, and highly professional.

Your primary role is to understand the user's symptoms or medical concerns through natural conversation, recommend an appropriate type of medical appointment, and guide them on next steps.

CRITICAL: You must respond with ONLY valid JSON in exactly this format (no additional text before or after):
{
  "appointmentType": "one of: sick parade, GP, mental health, physio, specialist, ER referral, no appointment needed",
  "reason": "detailed explanation of your recommendation and next steps",
  "complexity": "one of: easy, medium, complex"
}

IMPORTANT FOR CAF PILOT REQUIREMENTS:
When asked about pilot medical requirements, include specific CAF aviation medicine standards:
- Annual Aviation Medical Examination (AME)
- Medical Category requirements (Cat 1, 2, 3)
- Vision standards (20/20 corrected, color vision)
- Hearing standards (audiometry requirements)
- Cardiovascular fitness requirements
- G-tolerance for fighter pilots
- Contact information for Wing Aviation Medicine units`;

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
    
    // Clean up the response - extract JSON from various formats
    let cleanResponse = response.trim();
    
    // Case 1: Direct JSON response
    if (cleanResponse.startsWith('{')) {
      // Already JSON, use as-is
    }
    // Case 2: Markdown JSON blocks
    else if (cleanResponse.includes('```json')) {
      const jsonMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[1].trim();
      }
    }
    // Case 3: Any code blocks with JSON
    else if (cleanResponse.includes('```')) {
      const codeBlockMatch = cleanResponse.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        const blockContent = codeBlockMatch[1].trim();
        if (blockContent.startsWith('{')) {
          cleanResponse = blockContent;
        }
      }
    }
    // Case 4: JSON embedded in text (extract the JSON object)
    else if (cleanResponse.includes('{')) {
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
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
  
  // Check for informational medical queries about CAF requirements
  if (isInformationalMedicalQuery(input.message)) {
    const informationalResponse = handleInformationalMedicalQuery(input.message, ragContext);
    return JSON.stringify({
      appointmentType: informationalResponse.appointmentType,
      reason: informationalResponse.reason + "\n\n[DEV MODE: This is a mock response. To enable full AI capabilities, configure your OpenRouter or Google API keys.]",
      complexity: informationalResponse.complexity
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
 * Check if the input is a non-medical query that needs informational response
 */
function isNonMedicalQuery(message: string): boolean {
  const messageLower = message.toLowerCase().trim();
  
  // Test messages
  if (messageLower === 'test' || messageLower === 'testing' || messageLower === 'hello' || 
      messageLower === 'hi' || messageLower === 'hey' || messageLower === 'ping') {
    return true;
  }
  
  // Greetings and basic system questions
  const basicNonMedicalPatterns = [
    /^(hello|hi|hey|good morning|good afternoon|good evening)$/,
    /^(test|testing|check)$/,
    /^(how are you|what can you do|how do you work)$/,
    /^(thank you|thanks|bye|goodbye)$/,
  ];
  
  // BUT: If it's asking about CAF medical requirements, pilot standards, etc., 
  // this is still medical-related and should be handled as informational medical query
  const medicalInformationPatterns = [
    /(pilot|aircrew|aviation|flying).*requirements?/,
    /(medical|health).*requirements?/,
    /(annual|yearly).*medical/,
    /(caf|canadian armed forces).*medical/,
    /(trade|occupation).*medical/,
    /(diving|diver).*medical/,
    /(infantry|combat|special forces).*medical/,
    /medical.*standards?/,
    /fitness.*standards?/,
    /health.*standards?/,
    /what.*requirements?/,
    /requirements?.*per year/
  ];
  
  // If it matches medical information patterns, it's NOT a non-medical query
  if (medicalInformationPatterns.some(pattern => pattern.test(messageLower))) {
    return false;
  }
  
  return basicNonMedicalPatterns.some(pattern => pattern.test(messageLower));
}

/**
 * Check if the input is an informational medical query (about CAF requirements, standards, etc.)
 */
function isInformationalMedicalQuery(message: string): boolean {
  const messageLower = message.toLowerCase().trim();
  
  const informationalPatterns = [
    /(pilot|aircrew|aviation|flying).*requirements?/,
    /(medical|health).*requirements?/,
    /(annual|yearly).*medical/,
    /(caf|canadian armed forces).*medical/,
    /(trade|occupation).*medical/,
    /(diving|diver).*medical/,
    /(infantry|combat|special forces).*medical/,
    /medical.*standards?/,
    /fitness.*standards?/,
    /health.*standards?/,
    /what.*requirements?/,
    /requirements?.*per year/,
    /medical.*clearance/,
    /fitness.*test/,
    /physical.*standards?/,
    /medical.*exam/,
    /health.*screening/
  ];
  
  return informationalPatterns.some(pattern => pattern.test(messageLower));
}

/**
 * Handle informational medical queries about CAF requirements and standards
 */
function handleInformationalMedicalQuery(message: string, ragContext?: SearchContext): TriageOutput {
  const messageLower = message.toLowerCase().trim();
  
  let reason = '';
  
  if (messageLower.includes('pilot') || messageLower.includes('aircrew') || messageLower.includes('aviation') || messageLower.includes('flying')) {
    reason = "✈️ **CAF Pilot Medical Requirements & Policies:**\n\n" +
             "**Annual Medical Requirements:**\n" +
             "• Aviation Medical Examination (AME) - conducted annually\n" +
             "• Medical Category certification (Cat 1/2/3 based on aircraft type)\n" +
             "• Vision assessment: 20/20 corrected, color vision standards\n" +
             "• Hearing: Pure tone audiometry within CAF limits\n" +
             "• Cardiovascular stress testing (age-dependent)\n" +
             "• Neurological and psychological evaluation\n\n" +
             "**CAF Aviation Medicine Categories:**\n" +
             "• **Category 1**: Fighter/high-performance aircraft\n" +
             "• **Category 2**: Multi-engine transport aircraft\n" +
             "• **Category 3**: Basic flying training/utility aircraft\n\n" +
             "**Additional Requirements:**\n" +
             "• G-tolerance testing for fighter pilots\n" +
             "• Hypoxia training certification\n" +
             "• Night vision goggle compatibility\n" +
             "• Ejection seat medical clearance (fighters)\n\n" +
             "**Policy References:**\n" +
             "• A-MD-154-000/FP-000 (CAF Aviation Medicine Manual)\n" +
             "• Transport Canada CARs 404 (Medical Standards)\n" +
             "• CAF Health Services Group directives\n\n" +
             "**Contact:** Wing Aviation Medicine Officer or 1 Canadian Air Division Flight Surgeon for detailed requirements.";
  } else if (messageLower.includes('diving') || messageLower.includes('diver')) {
    reason = "🤿 **CAF Diving Medical Requirements:**\n\n" +
             "**Annual Requirements:**\n" +
             "• Annual Diving Medical Examination\n" +
             "• Pulmonary function tests\n" +
             "• Cardiovascular fitness assessment\n" +
             "• Neurological examination\n" +
             "• Dental examination for equipment fit\n\n" +
             "**Key Standards:**\n" +
             "• Must pass specialized diving medical\n" +
             "• No respiratory conditions (asthma, etc.)\n" +
             "• Excellent cardiovascular fitness\n" +
             "• No history of pneumothorax\n\n" +
             "**Contact:** Diving Medical Officer or specialized diving medicine clinic.";
  } else if (messageLower.includes('requirements') && messageLower.includes('per year')) {
    reason = "📅 **CAF Annual Medical Requirements (General):**\n\n" +
             "**Standard CAF Members:**\n" +
             "• Annual medical examination (if over 40 or in certain trades)\n" +
             "• Biennial medical for most members under 40\n" +
             "• Annual fitness test (FORCE test)\n" +
             "• Dental examination (annual)\n" +
             "• Vision screening (as required)\n\n" +
             "**Special Trades (additional requirements):**\n" +
             "• Pilots: Aviation medical + specialized assessments\n" +
             "• Divers: Diving medical + pulmonary function\n" +
             "• Special Forces: Enhanced fitness + psychological\n" +
             "• Combat Arms: Enhanced fitness standards\n\n" +
             "**Contact:** Your unit medical officer or base clinic for specific requirements.";
  } else {
    reason = "📋 **CAF Medical Standards & Requirements:**\n\n" +
             "I can provide information about various CAF medical requirements including:\n\n" +
             "• **Pilot/Aircrew** - Aviation medicine requirements\n" +
             "• **Diving** - Specialized diving medical standards\n" +
             "• **Combat Arms** - Enhanced fitness and medical standards\n" +
             "• **General Service** - Standard CAF medical requirements\n" +
             "• **Special Forces** - Enhanced screening requirements\n\n" +
             "Could you specify which trade or type of requirements you're interested in? For example:\n" +
             "• 'What are the pilot medical requirements?'\n" +
             "• 'Combat diver medical standards'\n" +
             "• 'Annual medical requirements for infantry'\n\n" +
             "**Contact:** Your unit medical officer for trade-specific requirements.";
  }
  
  // Add RAG context if available
  if (ragContext && ragContext.results.length > 0) {
    reason += "\n\n**📚 Supporting Documentation:**\n";
    for (const result of ragContext.results.slice(0, 2)) {
      reason += `• ${result.documentTitle} - ${result.documentType}\n`;
    }
  }
  
  return {
    appointmentType: 'no appointment needed',
    reason,
    complexity: 'medium',
    evidenceBased: ragContext ? ragContext.results.length > 0 : false,
  };
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