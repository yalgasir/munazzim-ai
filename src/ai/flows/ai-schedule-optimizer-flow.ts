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
  priorityAdjustments: z.array(
    z.object({
      taskDescription: z.string(),
      originalPriority: z.string(),
      suggestedPriority: z.string(),
      reason: z.string(),
    })
  ).optional(),
});

export type OptimizeScheduleOutput = z.infer<typeof OptimizeScheduleOutputSchema>;

export async function optimizeSchedule(input: OptimizeScheduleInput): Promise<OptimizeScheduleOutput> {
  return aiScheduleOptimizerFlow(input);
}

const cleanText = (text: string) => {
  return text
    .replace(/[#*`|_~]/g, '')
    .replace(/-{3,}/g, '')
    .replace(/Markdown/gi, '')
    .trim();
};

const aiScheduleOptimizerFlow = ai.defineFlow(
  {
    name: 'aiScheduleOptimizerFlow',
    inputSchema: OptimizeScheduleInputSchema,
    outputSchema: OptimizeScheduleOutputSchema,
  },
  async (input) => {
    const modelName = (process.env.OPENROUTER_MODEL || 'openrouter/free') as any;

    const { output } = await ai.generate({
      model: `openai/${modelName}`,
      input,
      system: `
أنت مساعد عربي متخصص في إدارة الوقت.
قواعد صارمة:
- لا تستخدم Markdown نهائياً (ممنوع استخدام # أو * أو - أو |).
- الرد باللغة العربية فقط.
- لا تشرح طريقة تفكيرك.
- اجعل الرد نصاً بسيطاً وسهل القراءة.
`,
      prompt: `حلل البيانات التالية وقدم نصائح مرتبة: ${JSON.stringify(input)}`,
    });

    if (!output) {
      throw new Error('لم يتم استلام رد من المساعد الذكي.');
    }

    output.summaryAnalysis = cleanText(output.summaryAnalysis);
    output.personalizedSuggestions = output.personalizedSuggestions.map(cleanText);

    return output;
  }
);
