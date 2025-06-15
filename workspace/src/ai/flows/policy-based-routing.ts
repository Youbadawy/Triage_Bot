// PolicyDrivenAppointmentRouting
'use server';
/**
 * @fileOverview Uses an AI model via OpenRouter to reference CAF medical policies and routing rules to aid in appointment recommendation.
 *
 * - policyBasedAppointmentRouting - A function that uses an AI model to provide an appointment recommendation.
 * - PolicyBasedAppointmentRoutingInput - The input type for the policyBasedAppointmentRouting function.
 * - PolicyBasedAppointmentRoutingOutput - The return type for the policyBasedAppointmentRouting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PolicyBasedAppointmentRoutingInputSchema = z.object({
  triageText: z
    .string()
    .describe('The text of the triage, which will be used to determine the routing.'),
});
export type PolicyBasedAppointmentRoutingInput = z.infer<typeof PolicyBasedAppointmentRoutingInputSchema>;

const PolicyBasedAppointmentRoutingOutputSchema = z.object({
  appointmentType: z.string().describe('The recommended appointment type (e.g., sick parade, GP, mental health, physio, specialist, or ER referral).'),
  reason: z.string().describe('The reasoning behind the appointment type recommendation.'),
});
export type PolicyBasedAppointmentRoutingOutput = z.infer<typeof PolicyBasedAppointmentRoutingOutputSchema>;

export async function policyBasedAppointmentRouting(input: PolicyBasedAppointmentRoutingInput): Promise<PolicyBasedAppointmentRoutingOutput> {
  return policyBasedAppointmentRoutingFlow(input);
}

const getCaFRoutingRecommendation = ai.defineTool(
  {
    name: 'getCaFRoutingRecommendation',
    description: 'This tool uses an AI model (LLaMA 4 Scout equivalent via OpenRouter) to analyze triage text against CAF medical policies and routing rules to determine the appropriate appointment type. Use this to make a routing recommendation.',
    inputSchema: z.object({
      triageText: z.string().describe('The text of the triage to be used for routing.'),
    }),
    outputSchema: PolicyBasedAppointmentRoutingOutputSchema, // Output schema matches the flow's output
  },
  async (input) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OpenRouter API key is not set in .env file (OPENROUTER_API_KEY).');
      return {
        appointmentType: 'Error',
        reason: 'AI policy tool configuration error. API key missing. Please contact an administrator.',
      };
    }

    const modelName = "meta-llama/llama-3-70b-instruct"; // Using a capable Llama 3 model

    const systemPrompt = `You are an AI assistant acting as LLaMA 4 Scout, an expert in Canadian Armed Forces (CAF) medical policies and appointment routing rules. Your task is to analyze the provided triage text and recommend an appropriate medical appointment type based on CAF guidelines. You must strictly adhere to providing a response in the specified JSON format. Do not include any explanatory text or markdown formatting outside of the JSON structure itself.`;

    const userPrompt = `Based on the following triage text, determine the most appropriate appointment type and provide a clear reason for your recommendation.

Available appointment types are: sick parade, GP, mental health, physio, specialist, ER referral.

Triage Text: "${input.triageText}"

Provide your response exclusively in the following JSON format:
{
  "appointmentType": "string (one of the available types, exactly as listed)",
  "reason": "string (your detailed reasoning for the recommendation)"
}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          // OpenRouter specific headers if needed, e.g., for routing or referrer
          // 'HTTP-Referer': 'YOUR_SITE_URL', // Optional: Replace with your app's URL
          // 'X-Title': 'YOUR_APP_NAME', // Optional: Replace with your app's name
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: "json_object" } // Request JSON output
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`OpenRouter API error: ${response.status} ${response.statusText}`, errorBody);
        return {
          appointmentType: 'Error',
          reason: `AI policy tool request failed. Status: ${response.status}. Details: ${errorBody.substring(0, 200)}`,
        };
      }

      const data = await response.json();
      
      let recommendationOutput;
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          try {
              const content = data.choices[0].message.content;
              if (typeof content === 'string') {
                  // If content is a string, it needs to be parsed as JSON
                  recommendationOutput = JSON.parse(content);
              } else if (typeof content === 'object') {
                  // If content is already an object (due to response_format), use it directly
                  recommendationOutput = content;
              } else {
                   throw new Error("Unexpected content type from OpenRouter: " + typeof content);
              }
          } catch (e: any) {
              console.error('Failed to parse JSON from OpenRouter response:', e.message, data.choices[0].message.content);
              return {
                  appointmentType: 'Error',
                  reason: 'AI policy tool returned an invalidly formatted recommendation.',
              };
          }
      } else {
          console.error('Unexpected response structure from OpenRouter:', JSON.stringify(data, null, 2));
          return {
              appointmentType: 'Error',
              reason: 'AI policy tool returned an unexpected response structure.',
          };
      }

      // Validate the parsed output against the Zod schema
      const validationResult = PolicyBasedAppointmentRoutingOutputSchema.safeParse(recommendationOutput);
      if (validationResult.success) {
        return validationResult.data;
      } else {
         console.error('OpenRouter response failed Zod validation:', validationResult.error.flatten());
         return {
           appointmentType: 'Error',
           reason: `AI policy tool's recommendation is malformed or missing required fields. ${validationResult.error.issues.map(i => i.path.join('.') + ': ' + i.message).join(', ')}`,
         };
      }

    } catch (error: any) {
      console.error('Error calling OpenRouter API or processing its response:', error.message);
      return {
        appointmentType: 'Error',
        reason: 'An unexpected error occurred while communicating with the AI policy tool.',
      };
    }
  }
);

const policyBasedAppointmentRoutingPrompt = ai.definePrompt({
  name: 'policyBasedAppointmentRoutingPrompt',
  tools: [getCaFRoutingRecommendation],
  input: {schema: PolicyBasedAppointmentRoutingInputSchema},
  output: {schema: PolicyBasedAppointmentRoutingOutputSchema},
  prompt: `Based on the triage text provided, use the getCaFRoutingRecommendation tool to determine the most appropriate appointment type, according to CAF medical policies and routing rules.\n\nTriage Text: {{{triageText}}}`,
});

const policyBasedAppointmentRoutingFlow = ai.defineFlow(
  {
    name: 'policyBasedAppointmentRoutingFlow',
    inputSchema: PolicyBasedAppointmentRoutingInputSchema,
    outputSchema: PolicyBasedAppointmentRoutingOutputSchema,
  },
  async input => {
    const {output} = await policyBasedAppointmentRoutingPrompt(input);
    // Check if output exists and is valid before returning
    if (output && typeof output.appointmentType === 'string' && typeof output.reason === 'string') {
      return output;
    }
    // Fallback or error handling if the tool call within the prompt fails to produce valid output
    console.error('Policy-based routing flow did not receive a valid output from the prompt/tool.');
    return {
      appointmentType: 'Error',
      reason: 'Failed to determine appointment routing. The AI tool did not provide a valid response.',
    };
  }
);
