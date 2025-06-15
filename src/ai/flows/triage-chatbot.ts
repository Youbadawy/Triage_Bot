// triage-chatbot.ts
'use server';
/**
 * @fileOverview An AI chatbot for symptom triage that determines the appropriate appointment type.
 *
 * - chatBot - A function that handles the chatbot interaction and triage process.
 * - ChatBotInput - The input type for the chatBot function.
 * - ChatBotOutput - The return type for the chatBot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatBotInputSchema = z.object({
  userInput: z.string().describe('The user input message.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']).describe('The role of the message sender.'),
    content: z.string().describe('The content of the message.'),
  })).optional().describe('The chat history between the user and the assistant.')
});
export type ChatBotInput = z.infer<typeof ChatBotInputSchema>;

const ChatBotOutputSchema = z.object({
  appointmentType: z.string().describe('The recommended appointment type (e.g., sick parade, GP, mental health, physio, specialist, or ER referral).'),
  reason: z.string().describe('The reasoning behind the appointment recommendation.'),
});
export type ChatBotOutput = z.infer<typeof ChatBotOutputSchema>;

export async function chatBot(input: ChatBotInput): Promise<ChatBotOutput> {
  return chatBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatBotPrompt',
  input: {
    schema: ChatBotInputSchema,
  },
  output: {
    schema: ChatBotOutputSchema,
  },
  prompt: `You are a medical triage assistant for the Canadian Armed Forces.
Based on the user's input and chat history, determine the most appropriate appointment type.
Consider the following appointment types: sick parade, GP, mental health, physio, specialist, or ER referral.

Chat History:
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}

User Input: {{userInput}}

Output the appointment type and the reason for the recommendation.

Make sure to output in JSON format.
`,
});

const chatBotFlow = ai.defineFlow(
  {
    name: 'chatBotFlow',
    inputSchema: ChatBotInputSchema,
    outputSchema: ChatBotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
