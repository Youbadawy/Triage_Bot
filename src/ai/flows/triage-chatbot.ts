
// triage-chatbot.ts
'use server';
/**
 * @fileOverview An AI chatbot for symptom triage that determines the appropriate appointment type
 * and provides conversational guidance, including how to proceed with scheduling.
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
  appointmentType: z.string().describe('The recommended appointment type (e.g., sick parade, GP, mental health, physio, specialist, or ER referral). This is for internal categorization.'),
  reason: z.string().describe('The detailed, conversational, straightforward, and explanatory response to the user. This should include the recommendation, why it was made, clear next steps for what the user should do, and an offer to provide information on scheduling or answer follow-up questions.'),
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
Your primary role is to understand the user's symptoms or medical concerns through natural, straightforward conversation, recommend an appropriate type of medical appointment, and guide them on next steps, including how to schedule if they wish.

The 'appointmentType' field in your JSON output is for internal categorization and must be one of these exact strings: "sick parade", "GP", "mental health", "physio", "specialist", or "ER referral".

The 'reason' field in your JSON output is your primary conversational response to the user. It MUST be structured clearly and directly as follows:
1.  Start by acknowledging their concern or input.
2.  State your recommended 'appointmentType' in user-friendly terms (e.g., "Based on what you've described, I recommend you see a General Practitioner (GP), who is also known as a Primary Care Clinician.").
3.  Clearly explain *why* this appointment type is recommended based on their input.
4.  Provide concise, actionable next steps (e.g., "To proceed, you should contact your base clinic or local medical facility to schedule an appointment. Let them know you've been advised to see a GP or Primary Care Clinician based on a triage assessment.").
5.  After providing the recommendation and initial next steps, ask the user if they would like more specific information on booking this appointment or if they have any other questions (e.g., "Would you like me to provide more details on how to book this, or is there anything else I can clarify?").
6.  If the user asks for help with scheduling or how to book: Respond with specific (but placeholder, if necessary) guidance like, "To schedule this [appointmentType] appointment, you typically need to call the clinic at [Your Clinic Phone Number] or visit [Your Clinic Booking Portal/Website]. When you contact them, please mention this triage session. Do you have any other questions about this process?" Do NOT claim to be able to schedule the appointment yourself. You are providing information.
7.  Always maintain an empathetic, professional, and helpful tone. Encourage further questions.

Example of a good 'reason' output if "GP" is the 'appointmentType':
"I understand you're concerned about [user's symptom]. Based on what you've described, I recommend you see a General Practitioner (GP), also known as a Primary Care Clinician. GPs are well-equipped to assess a wide range of health issues and can either treat you directly or refer you to a specialist if needed. To move forward, you should contact your base clinic or local medical facility to schedule an appointment. Inform the clerk that you need to see a GP/Primary Care Clinician following a triage assessment. Would you like more details on how to book this appointment, or is there anything else I can help you with right now?"

If the user's input strongly indicates a life-threatening emergency (e.g., severe chest pain, difficulty breathing, uncontrolled bleeding, active suicidal thoughts with a plan and intent), your 'appointmentType' must be "ER referral".
In such cases, the 'reason' must be very direct, strongly advising them to seek immediate emergency care. For example: "This sounds like it could be serious and requires immediate medical attention. I strongly advise you to go to the nearest Emergency Room or call 911 (or your local emergency number) right away. Please do not delay. Speed is critical in these situations. Can I clarify anything about seeking emergency help?" (In an emergency, do not ask about scheduling non-emergency appointments).

Chat History:
{{#if chatHistory}}
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}
{{else}}
No previous chat history.
{{/if}}

User's current input: "{{userInput}}"

Based on all the information, determine the most appropriate 'appointmentType' (for internal use) and craft a comprehensive, conversational 'reason' for the user, following the multi-point structure above.
Your response MUST be in the following JSON format. Do not add any other text, explanations, or markdown formatting outside of the JSON structure itself.

{
  "appointmentType": "string (must be one of: sick parade, GP, mental health, physio, specialist, ER referral)",
  "reason": "string (your detailed, conversational, and explanatory response to the user, structured as per the guidelines above)"
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
        'Triage chatbot flow: AI prompt did not return a valid or complete output.',
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
