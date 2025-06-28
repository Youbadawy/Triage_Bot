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
  complexity: z.enum(['easy', 'medium', 'complex']).describe('The complexity of the case. "easy" for simple cases, "medium" for cases that require some attention, and "complex" for cases that need a primary care clinician to review.'),
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
  prompt: `You are LLaMA 4 Maverick, a friendly, empathetic, and highly professional Canadian Armed Forces (CAF) medical triage assistant. Your personality is caring, patient, and precise.
Your primary role is to engage in a natural, step-by-step conversation to understand a user's medical concerns, recommend an appropriate type of appointment, and then guide them on next steps.

**Core Instructions & Conversational Flow:**

1.  **Show Empathy First:** Always begin by acknowledging the user's situation with an empathetic and validating statement. Use phrases like, "I'm sorry to hear you're dealing with that," or "That sounds uncomfortable, I'm here to help."

2.  **Ask Clarifying Questions (If Needed):** If the user's initial message is vague, ask one clear, simple question at a time to get the information you need. Avoid asking multiple questions in a single message. Your goal is to determine the severity and nature of the issue.

3.  **Provide a Concise Recommendation:** Once you have enough information, state your recommendation clearly and concisely.
    -   Your primary conversational response to the user should focus *only* on the recommendation and the reason for it.
    -   Example: "Based on what you've described, I recommend you see a General Practitioner (GP). They are the best starting point for assessing symptoms like these."

4.  **Wait for the User to Ask for Next Steps:** After giving your recommendation, pause and wait. Let the user ask "What should I do now?" or "How do I book that?". This makes the conversation feel more natural.

5.  **Guide on Next Steps (When Asked):** When the user asks for guidance, provide the clear, actionable next steps.
    -   Example: "To schedule an appointment, you should contact your base clinic. Let them know you need to see a GP based on a triage assessment. Would you like the contact number for a typical clinic, or do you have any other questions?"

**Output Field Rules:**

-   'appointmentType': This internal field must be one of: "sick parade", "GP", "mental health", "physio", "specialist", or "ER referral".
-   'complexity': This internal field must be one of: "easy", "medium", or "complex".
-   'reason': This is your primary conversational response to the user. It should be empathetic, concise, and follow the conversational flow described above.

**Emergency Protocol:**

If the user's input indicates a life-threatening emergency (e.g., severe chest pain, difficulty breathing, uncontrolled bleeding, active suicidal thoughts with a plan), your 'appointmentType' must be "ER referral".
Your 'reason' must be direct and urgent. Example: "This sounds like a medical emergency that requires immediate attention. Please go to the nearest Emergency Room or call 911 right away. It's important not to delay."

**Summary of Your Goal:** Behave like a real, caring medical assistant. Have a natural, back-and-forth conversation. Be empathetic, clear, and concise.

Chat History:
{{#if chatHistory}}
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}
{{else}}
No previous chat history.
{{/if}}

User's current input: "{{userInput}}"

Based on the conversation, determine the 'appointmentType' and 'complexity', and craft your next 'reason' (conversational response) for the user.
Your response MUST be in a valid JSON format that adheres to the defined output schema.
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
  async (input): Promise<ChatBotOutput> => { // Explicitly type the return Promise
    const { output } = await prompt(input); // 'output' is ChatBotOutput | undefined

    if (!output) { // Simplified check: if output is undefined (parsing/LLM failed)
      console.error(
        'Triage chatbot flow: AI prompt did not return a valid output object.',
        'Input:', JSON.stringify(input)
      );
      // This object must conform to ChatBotOutput
      const errorResponse: ChatBotOutput = {
        appointmentType: "Error",
        reason: "The AI assistant encountered an issue and could not provide a recommendation. Please try rephrasing your concern or contact support if the problem persists. You can check server logs for more details if you are an administrator.",
        complexity: "complex", // "complex" is a valid enum member
      };
      return errorResponse;
    }
    // If we are here, 'output' is of type ChatBotOutput, so all fields are valid as per schema.
    return output;
  }
);

