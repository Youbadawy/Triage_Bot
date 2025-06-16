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

Your response MUST be a JSON object matching the following structure:
{
  "appointmentType": "string (one of: sick parade, GP, mental health, physio, specialist, ER referral)",
  "reason": "string (your reasoning for the recommendation)"
}
Do not include any text outside of this JSON object.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE', // More permissive for medical discussions
      },
    ],
  },
});

const chatBotFlow = ai.defineFlow(
  {
    name: 'chatBotFlow',
    inputSchema: ChatBotInputSchema,
    outputSchema: ChatBotOutputSchema,
  },
  async input => {
    const result = await prompt(input);
    if (!result.output) {
      console.error('Triage chatbot flow: AI prompt did not return a valid output. This could be due to model refusal, content filtering, or an internal error. Input:', JSON.stringify(input), 'Result:', JSON.stringify(result));
      throw new Error('The AI assistant failed to generate a response. Please try again.');
    }
    return result.output;
  }
);
