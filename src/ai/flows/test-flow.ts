
'use server';

import { z } from 'genkit';

const TestInputSchema = z.string();
export type TestInput = z.infer<typeof TestInputSchema>;

const TestOutputSchema = z.object({
  response: z.string(),
  modelUsed: z.string(),
});
export type TestOutput = z.infer<typeof TestOutputSchema>;

export async function runTestAI(prompt: string): Promise<TestOutput> {
  const modelName = 'gryphe/mythomax-l2-13b';
  
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY missing');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || 'لا يوجد رد';

  return {
    response: text.replace(/[#*`|_~]/g, '').trim(),
    modelUsed: modelName,
  };
}

