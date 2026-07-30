import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit configuration with Google AI plugin.
 * The system uses this global 'ai' object to register prompts and flows.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
