
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TestInputSchema = z.string();
export type TestInput = z.infer<typeof TestInputSchema>;

const TestOutputSchema = z.object({
  response: z.string(),
  modelUsed: z.string(),
});
export type TestOutput = z.infer<typeof TestOutputSchema>;

export async function runTestAI(prompt: string): Promise<TestOutput> {
  return testFlow(prompt);
}

const testFlow = ai.defineFlow(
  {
    name: 'testFlow',
    inputSchema: TestInputSchema,
    outputSchema: TestOutputSchema,
  },
  async (input) => {
    try {
      const modelName = 'qwen/qwen3-30b-a3b:free';
      const { text } = await ai.generate({
        model: `openai/${modelName}`,
        prompt: input,
        system: `أنت مساعد عربي. لا تستخدم رموز Markdown مثل # أو * نهائياً. أجب بنص عادي فقط.`,
      });

      const cleanResponse = (text || '').replace(/[#*`|_~]/g, '').trim();

      return {
        response: cleanResponse || 'لا يوجد رد.',
        modelUsed: modelName,
      };
    } catch (error: any) {
      console.error('Test Flow Error:', error);
      throw new Error(error.message || 'فشل الاتصال بـ OpenRouter');
    }
  }
);
