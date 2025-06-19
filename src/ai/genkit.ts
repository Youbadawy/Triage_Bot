import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openrouter} from 'genkitx-openrouter'; // Import openrouter plugin

export const ai = genkit({
  plugins: [
    googleAI(), 
    openrouter({ // Add openrouter plugin
      apiKey: process.env.OPENROUTER_API_KEY,
    }),
  ],
  // Default model for prompts not specifying one explicitly.
  // The triage-chatbot prompt will use this if not overridden.
  // For OpenRouter, model names are typically prefixed, e.g., 'openrouter/meta-llama/llama-4-maverick:free'
  model: 'openrouter/meta-llama/llama-4-maverick:free', 
});
