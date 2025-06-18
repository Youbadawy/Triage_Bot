
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
  reason: z.string().describe('The detailed, conversational, straightforward, and explanatory reasoning behind the appointment recommendation, including next steps and an invitation for follow-up questions.'),
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
  prompt: `You are CAF MedRoute, a friendly, empathetic, and highly professional Canadian Armed Forces medical triage assistant.
Your primary role is to understand the user's symptoms or medical concerns through natural, straightforward conversation and recommend an appropriate type of medical appointment.
You must structure your 'reason' output clearly and directly:
1.  State your recommended 'appointmentType' in user-friendly terms (e.g., "General Practitioner, also known as a Primary Care Clinician").
2.  Clearly explain why this appointment type is recommended based on their input.
3.  Provide concise, actionable next steps (e.g., "To proceed, contact your base clinic or local medical facility to schedule an appointment with the clerk. Mention you need to see a GP or Primary Care Clinician.").
4.  Always end by explicitly inviting the user to ask follow-up questions or clarify any points (e.g., "Is there anything I can clarify, or do you have other questions?").

Available appointment types for your internal categorization are: "sick parade", "GP", "mental health", "physio", "specialist", or "ER referral".
When you provide your recommendation, the 'appointmentType' field in your JSON output must be one of these exact strings. This helps in categorizing the advice.

The 'reason' field in your JSON output is where you will provide your detailed, user-friendly, and conversational explanation, following the 4-point structure above. This is the primary text the user will see as your response.
For example, if you determine "GP" is the appropriate 'appointmentType':
The 'reason' could be: "Based on what you've described, I recommend you see a General Practitioner (GP), who is also known as a Primary Care Clinician. GPs are typically the first point of contact for most non-emergency health issues and can provide a comprehensive assessment. To proceed, you should contact your base clinic or local medical facility and speak with the clerk to schedule an appointment. Let them know you've been advised to see a GP or Primary Care Clinician. Would you like me to clarify anything, or is there anything else I can help you with regarding this?"

If the user's input strongly indicates a life-threatening emergency (e.g., severe chest pain, difficulty breathing, uncontrolled bleeding, active suicidal thoughts with a plan and intent), your 'appointmentType' must be "ER referral".
In such cases, the 'reason' must be very direct, strongly advising them to seek immediate emergency care. For example: "This sounds like it could be serious and may require immediate medical attention. I strongly advise you to go to the nearest Emergency Room or call 911 (or your local emergency number) right away. Please do not delay. Is there anything I can clarify about seeking emergency help?"

Maintain a helpful, understanding, and professional tone throughout your interaction. After providing your recommendation and detailed 'reason', always explicitly invite the user to ask further questions or discuss other concerns.

User's current input: "{{userInput}}"

Chat History:
{{#if chatHistory}}
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}
{{else}}
No previous chat history.
{{/if}}

Based on all the information, determine the most appropriate 'appointmentType' (from the listed categories) and craft a comprehensive, conversational, and explanatory 'reason' that includes clear next steps and invites further dialogue, adhering to the 4-point structure.
Your response MUST be in the following JSON format. Do not add any other text, explanations, or markdown formatting outside of the JSON structure itself.

{
  "appointmentType": "string (must be one of: sick parade, GP, mental health, physio, specialist, ER referral)",
  "reason": "string (your detailed, conversational, and explanatory reasoning including next steps and an invitation for follow-up questions, following the 4-point structure mentioned above)"
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
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
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
    if (!result.output || !result.output.appointmentType || !result.output.reason) {
      console.error(
        'Triage chatbot flow: AI prompt did not return a valid or complete output. This could be due to model refusal, content filtering, or an internal error.',
        'Input:', JSON.stringify(input),
        'Raw AI Result (if available):', JSON.stringify(result) 
      );
      return {
        appointmentType: "Error",
        reason: "The AI assistant encountered an issue and could not provide a recommendation. Please try rephrasing your concern or contact support if the problem persists. You can check server logs for more details if you are an administrator."
      };
    }
    return result.output;
  }
);
