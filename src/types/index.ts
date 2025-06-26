
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile extends FirebaseUser {
  // Add any custom profile properties here
  // e.g. cafId?: string;
  // e.g. role?: 'user' | 'admin'; // This should ideally come from custom claims
}

export interface ChatMessage {
  id: string; // Unique ID for the message, important for React keys
  role: 'user' | 'assistant' | 'system'; // 'system' for emergency messages or instructions
  content: string;
  timestamp?: Date | Timestamp; // Firestore typically uses Timestamp, client might use Date
}

export interface AppointmentRecommendation {
  appointmentType: string;
  reason: string;
  complexity: 'easy' | 'medium' | 'complex';
  evidenceBased?: boolean;
  sources?: string[];
  ragContext?: any; // Optional RAG search context
}

export interface TriageSession {
  id?: string; // Document ID from Firestore
  userId: string;
  timestamp: Timestamp; // Firestore Timestamp for when the session was logged
  chatHistory: ChatMessage[]; // Ensure chat messages here also align, Firestore might store Date as Timestamp
  recommendation: AppointmentRecommendation;
  language: 'en' | 'fr'; // For bilingual support
  emergencyAlertTriggered: boolean;
}

// Input for the AI chatBot flow (from src/ai/flows/triage-chatbot.ts)
export interface AIChatInput {
  userInput: string;
  chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}

// Output for the AI chatBot flow
export interface AIChatOutput {
  appointmentType: string;
  reason: string;
  complexity: 'easy' | 'medium' | 'complex';
  evidenceBased?: boolean;
  sources?: string[];
  ragContext?: any; // Optional RAG search context
}
