
import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * @fileOverview إعداد Genkit للعمل مع OpenRouter.
 * يتم التحقق من أن الـ Base URL والـ API Key يتم تمريرهما بشكل صحيح لنموذج OpenAI الموحد.
 */

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      // تأكد من أن الـ Base URL ينتهي بـ /v1 للعمل مع معظم المكتبات المتوافقة مع OpenAI
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
