
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NLPAppointmentCreatorInputSchema = z.string();
export type NLPAppointmentCreatorInput = z.infer<typeof NLPAppointmentCreatorInputSchema>;

const NLPAppointmentCreatorOutputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  durationMinutes: z.number().int().default(60),
  attendees: z.array(z.string()).optional(),
  allDay: z.boolean().default(false),
});
export type NLPAppointmentCreatorOutput = z.infer<typeof NLPAppointmentCreatorOutputSchema>;

const prompt = ai.definePrompt({
  name: 'nlpAppointmentCreatorPrompt',
  input: { schema: NLPAppointmentCreatorInputSchema },
  output: { schema: NLPAppointmentCreatorOutputSchema },
  prompt: `أنت مساعد ذكاء اصطناعي متخصص في تحليل طلبات المواعيد. استخرج المعلومات التالية وحولها إلى JSON. تاريخ اليوم هو: {{currentDate}} مدخلات المستخدم: {{{it}}}`,
});

const nlpAppointmentCreatorFlow = ai.defineFlow(
  {
    name: 'nlpAppointmentCreatorFlow',
    inputSchema: NLPAppointmentCreatorInputSchema,
    outputSchema: NLPAppointmentCreatorOutputSchema,
  },
  async (input) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const modelName = 'qwen/qwen3-30b-a3b:free';
    
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is missing');
    }

    const { output } = await prompt(input, { 
      model: `openai/${modelName}`,
      config: {
        version: '1.0'
      }
    });
    
    return output!;
  }
);

export async function nlpAppointmentCreator(input: NLPAppointmentCreatorInput): Promise<NLPAppointmentCreatorOutput> {
  return nlpAppointmentCreatorFlow(input);
}
