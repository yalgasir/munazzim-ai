'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NLPAppointmentCreatorInputSchema = z
  .string()
  .describe('وصف الموعد باللغة الطبيعية.');
export type NLPAppointmentCreatorInput = z.infer<
  typeof NLPAppointmentCreatorInputSchema
>;

const NLPAppointmentCreatorOutputSchema = z.object({
  title: z.string().describe('عنوان الموعد.'),
  description: z.string().optional().describe('تفاصيل إضافية.'),
  date: z.string().describe('التاريخ بصيغة YYYY-MM-DD.'),
  time: z.string().optional().describe('الوقت بصيغة HH:MM (24 ساعة).'),
  durationMinutes: z.number().int().default(60).describe('المدة بالدقائق.'),
  attendees: z.array(z.string()).optional().describe('أسماء الحضور.'),
  allDay: z.boolean().default(false).describe('هل هو حدث طوال اليوم؟'),
});
export type NLPAppointmentCreatorOutput = z.infer<
  typeof NLPAppointmentCreatorOutputSchema
>;

const prompt = ai.definePrompt({
  name: 'nlpAppointmentCreatorPrompt',
  input: { schema: NLPAppointmentCreatorInputSchema },
  output: { schema: NLPAppointmentCreatorOutputSchema },
  prompt: `أنت مساعد ذكاء اصطناعي متخصص في تحليل طلبات المواعيد.
استخرج المعلومات التالية وحولها إلى JSON.
تاريخ اليوم هو: {{currentDate}}

مدخلات المستخدم: {{{it}}}`,
});

const nlpAppointmentCreatorFlow = ai.defineFlow(
  {
    name: 'nlpAppointmentCreatorFlow',
    inputSchema: NLPAppointmentCreatorInputSchema,
    outputSchema: NLPAppointmentCreatorOutputSchema,
  },
  async (input) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const modelName = (process.env.OPENROUTER_MODEL || 'openrouter/free') as any;
    
    const { output } = await prompt(input, { 
      model: `openai/${modelName}`,
      context: { currentDate } 
    });
    
    return output!;
  }
);

export async function nlpAppointmentCreator(
  input: NLPAppointmentCreatorInput
): Promise<NLPAppointmentCreatorOutput> {
  return nlpAppointmentCreatorFlow(input);
}
