
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OptimizeScheduleInputSchema = z.object({
  currentAppointments: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
    })
  ),
  currentTasks: z.array(
    z.object({
      description: z.string(),
      priority: z.enum(['High', 'Medium', 'Low']),
      dueDate: z.string().datetime().optional(),
      isCompleted: z.boolean(),
    })
  ),
  userGoals: z.array(z.string()).optional(),
  productivityContext: z.string().optional(),
});

export type OptimizeScheduleInput = z.infer<typeof OptimizeScheduleInputSchema>;

const OptimizeScheduleOutputSchema = z.object({
  summaryAnalysis: z.string(),
  personalizedSuggestions: z.array(z.string()),
  conflictsDetected: z.array(
    z.object({
      appointment1: z.string(),
      appointment2: z.string(),
      reason: z.string(),
      suggestion: z.string(),
    })
  ).optional(),
});

export type OptimizeScheduleOutput = z.infer<typeof OptimizeScheduleOutputSchema>;

const cleanText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[#*`|_~]/g, '')
    .replace(/-{3,}/g, '')
    .replace(/Markdown/gi, '')
    .trim();
};

const prompt = ai.definePrompt({
  name: 'aiScheduleOptimizerPrompt',
  input: { schema: OptimizeScheduleInputSchema },
  output: { schema: OptimizeScheduleOutputSchema },
  prompt: `أنت مساعد عربي متخصص في إدارة الوقت. قم بتحليل جدول المواعيد والمهام الحالي للمستخدم.
  
  السياق الإضافي من المستخدم: {{{productivityContext}}}
  
  المواعيد:
  {{#each currentAppointments}}
  - {{{title}}} من {{{startTime}}} إلى {{{endTime}}}
  {{/each}}
  
  المهام:
  {{#each currentTasks}}
  - {{{description}}} (الأولوية: {{{priority}}}, مكتملة: {{{isCompleted}}})
  {{/each}}
  
  قواعد صارمة: 
  1. لا تستخدم Markdown نهائياً.
  2. الرد باللغة العربية فقط.
  3. قدم تحليلاً شاملاً وتوصيات عملية لزيادة الإنتاجية.`,
});

const aiScheduleOptimizerFlow = ai.defineFlow(
  {
    name: 'aiScheduleOptimizerFlow',
    inputSchema: OptimizeScheduleInputSchema,
    outputSchema: OptimizeScheduleOutputSchema,
  },
  async (input) => {
    const modelName = (process.env.OPENROUTER_MODEL || 'openrouter/free') as any;

    try {
      const { output } = await prompt(input, {
        model: `openai/${modelName}`,
      });

      if (!output) {
        throw new Error('لم يتم استلام رد من المساعد الذكي.');
      }

      return {
        summaryAnalysis: cleanText(output.summaryAnalysis),
        personalizedSuggestions: (output.personalizedSuggestions || []).map(cleanText),
        conflictsDetected: output.conflictsDetected,
      };
    } catch (error: any) {
      console.error('Flow Error:', error);
      throw error;
    }
  }
);

export async function optimizeSchedule(input: OptimizeScheduleInput): Promise<OptimizeScheduleOutput> {
  return aiScheduleOptimizerFlow(input);
}
