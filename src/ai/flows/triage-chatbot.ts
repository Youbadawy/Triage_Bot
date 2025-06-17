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
  prompt: `You are CAF MedRoute, a Canadian Armed Forces medical triage assistant.
Your role is to understand the user's symptoms or medical concerns and recommend an appropriate type of medical appointment.
Available appointment types are: sick parade, GP, mental health, physio, specialist, or ER referral.

Consider the user's input and the chat history provided.
If the user's input seems to indicate a life-threatening emergency (e.g., severe chest pain, difficulty breathing, uncontrolled bleeding, suicidal thoughts), you should strongly lean towards "ER referral".
For less urgent but serious issues, consider "GP" or "specialist".
For musculoskeletal issues, "physio" might be appropriate.
For mental well-being concerns, "mental health" is the path.
For minor, acute issues that can be handled quickly on base, "sick parade" is an option.

User's current input: "{{userInput}}"

Chat History:
{{#if chatHistory}}
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}
{{else}}
No previous chat history.
{{/if}}

Based on all the information, determine the most appropriate appointment type and provide a clear reason for your recommendation.
Your response MUST be in the following JSON format. Do not add any other text, explanations, or markdown formatting outside of the JSON structure itself.

Example of your exact output format:
{
  "appointmentType": "string (must be one of: sick parade, GP, mental health, physio, specialist, ER referral)",
  "reason": "string (your detailed reasoning for the recommendation based on the symptoms and CAF context)"
}
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
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT', // May need to be less restrictive for medical discussions
        threshold: 'BLOCK_MEDIUM_AND_ABOVE', // Was BLOCK_NONE, let's try medium first.
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
      console.error(
        'Triage chatbot flow: AI prompt did not return a valid output. This could be due to model refusal, content filtering, or an internal error.',
        'Input:', JSON.stringify(input),
        'Raw AI Result (if available):', JSON.stringify(result) 
      );
      // Return a structured error that matches the expected output schema to avoid breaking the client
      return {
        appointmentType: "Error",
        reason: "The AI assistant failed to generate a valid structured response. Please check server logs or try rephrasing your query."
      };
    }
    return result.output;
  }
);

