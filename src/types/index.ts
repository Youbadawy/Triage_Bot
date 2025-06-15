import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile extends FirebaseUser {
  // Add any custom profile properties here
  // e.g. cafId?: string;
  // e.g. role?: 'user' | 'admin'; // This should ideally come from custom claims
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system'; // 'system' for emergency messages or instructions
  content: string;
  timestamp?: Date | Timestamp; // Firestore typically uses Timestamp
}

export interface AppointmentRecommendation {
  appointmentType: string;
  reason: string;
}

export interface TriageSession {
  id?: string; // Document ID from Firestore
  userId: string;
  timestamp: Timestamp;
  chatHistory: ChatMessage[];
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
}
