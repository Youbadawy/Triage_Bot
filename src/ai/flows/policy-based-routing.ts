// PolicyDrivenAppointmentRouting
'use server';
/**
 * @fileOverview Uses LLaMA 4 Scout tool to reference CAF medical policies and routing rules to aid in appointment recommendation.
 *
 * - policyBasedAppointmentRouting - A function that uses LLaMA 4 Scout tool to provide an appointment recommendation.
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
    description: 'This tool uses CAF medical policies and routing rules to determine the appropriate appointment type based on the triage text provided. Use this to make a routing recommendation.',
    inputSchema: z.object({
      triageText: z.string().describe('The text of the triage to be used for routing.'),
    }),
    outputSchema: z.object({
      appointmentType: z.string().describe('The recommended appointment type.'),
      reason: z.string().describe('The reasoning behind the recommendation.'),
    }),
  },
  async input => {
    // TODO: Integrate with LLaMA 4 Scout or equivalent API here to fetch policies and routing rules.
    // This is a placeholder implementation - replace with actual policy retrieval logic.
    return {
      appointmentType: 'GP',
      reason: 'This is a placeholder recommendation.  Implement integration with LLaMA 4 Scout.',
    };
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
    return output!;
  }
);
