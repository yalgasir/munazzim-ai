
import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * @fileOverview AI Configuration for Munazzim project.
 * Configured for OpenRouter integration using OpenAI compatible plugin.
 */

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
