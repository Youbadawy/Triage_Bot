import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(), 
  ],
  // Default model for Genkit flows
  model: 'googleai/gemini-1.5-flash-latest', 
});

// Custom OpenRouter client for direct API calls (for RAG integration)
export async function callOpenRouter(options: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
}) {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables');
  }
  
  try {
    const requestBody = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature || 0.1,
      max_tokens: options.max_tokens || 4000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:9002',
        'X-Title': 'CAF MedRoute',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenRouter API');
    }
    
    return content;
  } catch (error) {
    throw error;
  }
}
