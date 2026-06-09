import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * @fileOverview AI Configuration for Munazzim project.
 * Uses Gemini 1.5 Pro/Flash models via OpenRouter provider.
 */

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});

