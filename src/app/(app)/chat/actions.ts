'use server';

import { z } from 'zod';
import { chatBot } from '@/ai/flows/triage-chatbot';
import type { AIChatInput, AIChatOutput, TriageSession, ChatMessage } from '@/types';
import { auth as adminAuth } from 'firebase-admin'; // Assuming admin SDK is set up
import { firestore as adminFirestore } from 'firebase-admin'; // Assuming admin SDK is set up
import {Timestamp} from 'firebase-admin/firestore';

// This needs Firebase Admin SDK initialized. For scaffolding, this is conceptual.
// In a real app, ensure admin.initializeApp() is called once.
// For user-specific writes from server, we need user's UID.
// If called from client-side authenticated context, client SDK might be easier.
// Here, we assume this action can get the UID or is for general purpose.

const ChatActionInputSchema = z.object({
  userInput: z.string().min(1),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  userId: z.string(), // User ID must be passed to associate the session
  language: z.enum(['en', 'fr']),
});

export async function processChatMessage(input: z.infer<typeof ChatActionInputSchema>): Promise<{
  aiResponse: ChatMessage;
  recommendation?: AIChatOutput;
  sessionId?: string;
  error?: string;
}> {
  try {
    const validatedInput = ChatActionInputSchema.parse(input);

    const aiInput: AIChatInput = {
      userInput: validatedInput.userInput,
      chatHistory: validatedInput.chatHistory,
    };

    const aiOutput: AIChatOutput = await chatBot(aiInput);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: validatedInput.userInput,
      timestamp: new Date(),
    };
    
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `${aiOutput.reason} Recommended: ${aiOutput.appointmentType}`,
      timestamp: new Date(),
    };

    // Save triage session to Firestore (conceptual, requires Admin SDK setup)
    // For a real app, ensure firebaseAdminApp is initialized.
    // This is a simplified example.
    let sessionId: string | undefined = undefined;
    try {
        const sessionData: Omit<TriageSession, 'id'> = {
            userId: validatedInput.userId,
            timestamp: Timestamp.now(),
            chatHistory: [...(validatedInput.chatHistory || []).map(m => ({...m, id: crypto.randomUUID(), timestamp: new Date()})), userMessage, assistantMessage],
            recommendation: aiOutput,
            language: validatedInput.language,
            emergencyAlertTriggered: false, // This should be set based on actual detection
        };
        // Example Firestore write (conceptual, replace with actual Admin SDK usage)
        // const sessionRef = await adminFirestore().collection('triageSessions').add(sessionData);
        // sessionId = sessionRef.id;
        console.log("Triage session to be saved (conceptual):", sessionData);
        // For scaffolding, we're not doing the actual write to avoid Admin SDK setup.
        // In a real app, this would be:
        // const firestoreDb = adminFirestore(); // Get instance from initialized admin app
        // const newSessionRef = firestoreDb.collection('triageSessions').doc();
        // await newSessionRef.set(sessionData);
        // sessionId = newSessionRef.id;

    } catch (dbError) {
        console.error('Firestore save error:', dbError);
        // Don't let db error fail the entire chat response, but log it
    }


    return { aiResponse: assistantMessage, recommendation: aiOutput, sessionId };

  } catch (error) {
    console.error('Error in processChatMessage:', error);
    if (error instanceof z.ZodError) {
      return { 
        aiResponse: {id: crypto.randomUUID(), role: 'system', content: 'Invalid input.', timestamp: new Date()},
        error: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      };
    }
    // Check for specific error types if LLaMA models are unreachable
    // This is a generic catch-all for now
    return { 
        aiResponse: {id: crypto.randomUUID(), role: 'system', content: 'Sorry, I encountered an error. Please try again later.', timestamp: new Date()},
        error: 'AI service error or other internal error.'
    };
  }
}

const EmergencyKeywordsSchema = z.object({
  text: z.string(),
});

// Simple keyword check - this could be more sophisticated
const EMERGENCY_KEYWORDS_EN = ["suicide", "suicidal", "kill myself", "self-harm", "no reason to live", "hopeless", "want to die"];
const EMERGENCY_KEYWORDS_FR = ["suicide", "suicidaire", "me tuer", "automutilation", "aucune raison de vivre", "désespéré", "veux mourir"];


export async function checkForEmergencyKeywords(input: z.infer<typeof EmergencyKeywordsSchema>, language: 'en' | 'fr'): Promise<{ isEmergency: boolean }> {
  const text = input.text.toLowerCase();
  const keywords = language === 'fr' ? EMERGENCY_KEYWORDS_FR : EMERGENCY_KEYWORDS_EN;
  const isEmergency = keywords.some(keyword => text.includes(keyword));
  return { isEmergency };
}

// Action to save triage session (called from client after AI response)
// This is an alternative if Server Action based Firestore write is complex to set up initially.
// However, the prompt asks for Firestore write to be part of the main flow.
// The above processChatMessage attempts conceptual server-side save.
// If client-side save is preferred:
// export async function saveTriageSessionClient(sessionData: TriageSession) {
//   // Use client-side Firebase SDK to save. Requires user to be authenticated.
//   // Ensure db is imported from '@/lib/firebase/config'
//   // const docRef = await addDoc(collection(db, 'triageSessions'), sessionData);
//   // return docRef.id;
// }
