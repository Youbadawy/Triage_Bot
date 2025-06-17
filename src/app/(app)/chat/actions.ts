
'use server';

import { z } from 'zod';
import { chatBot } from '@/ai/flows/triage-chatbot';
import type { AIChatInput, AIChatOutput, ChatMessage } from '@/types';
// Firebase Admin SDK imports removed as they are not used and causing build errors.
// Actual Firestore writes are handled client-side in chat/page.tsx.

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
  sessionId?: string; // This will be undefined as server-side save was conceptual
  error?: string;
}> {
  try {
    const validatedInput = ChatActionInputSchema.parse(input);

    const aiInput: AIChatInput = {
      userInput: validatedInput.userInput,
      chatHistory: validatedInput.chatHistory,
    };

    const aiOutput: AIChatOutput = await chatBot(aiInput);
    
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiOutput.reason, // The AI's detailed reason is now the full conversational response
      timestamp: new Date(),
    };

    // The conceptual server-side save block using firebase-admin has been removed
    // as it was causing build errors and the actual save is client-side.
    const sessionId: string | undefined = undefined;

    return { aiResponse: assistantMessage, recommendation: aiOutput, sessionId };

  } catch (error) {
    console.error('Error in processChatMessage:', error);
    if (error instanceof z.ZodError) {
      return { 
        aiResponse: {id: crypto.randomUUID(), role: 'system', content: 'Invalid input.', timestamp: new Date()},
        error: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      };
    }
    // Check if it's an error from our custom chatbot flow error handling
    if (error && typeof (error as any).appointmentType === 'string' && (error as any).appointmentType === 'Error') {
        return {
            aiResponse: {id: crypto.randomUUID(), role: 'system', content: (error as any).reason, timestamp: new Date()},
            error: (error as any).reason
        };
    }
    return { 
        aiResponse: {id: crypto.randomUUID(), role: 'system', content: 'Sorry, I encountered an error processing your message. Please try again later.', timestamp: new Date()},
        error: 'AI service error or other internal error processing the message.'
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
