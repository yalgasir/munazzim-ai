
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
    .trim();
};

const prompt = ai.definePrompt({
  name: 'aiScheduleOptimizerPrompt',
  input: { schema: OptimizeScheduleInputSchema },
  output: { schema: OptimizeScheduleOutputSchema },
  prompt: `أنت مساعد 'منظّم' الذكي، خبير في الإنتاجية. حلل جدول المستخدم وقدم نصائح عملية.

حالة المستخدم أو سؤاله: {{{productivityContext}}}

المواعيد الحالية:
{{#each currentAppointments}}
- {{{title}}} (من {{{startTime}}} إلى {{{endTime}}})
{{/each}}

المهام المعلقة:
{{#each currentTasks}}
- {{{description}}} (الأولوية: {{{priority}}}, مكتملة: {{{isCompleted}}})
{{/each}}

تعليمات:
1. الرد باللغة العربية الفصحى.
2. لا تستخدم أي رموز Markdown نهائياً.
3. قدم تحليل ملخص وتوصيات محددة.`,
});

const aiScheduleOptimizerFlow = ai.defineFlow(
  {
    name: 'aiScheduleOptimizerFlow',
    inputSchema: OptimizeScheduleInputSchema,
    outputSchema: OptimizeScheduleOutputSchema,
  },
  async (input) => {
    // استخدام موديل qwen المطلوبه
    const modelName = 'qwen/qwen3-30b-a3b:free';

    if (!process.env.OPENROUTER_API_KEY) {
      return {
        summaryAnalysis: "تنبيه: مفتاح OPENROUTER_API_KEY غير متوفر حالياً. يرجى إضافته لتفعيل التحليل الذكي.",
        personalizedSuggestions: ["تأكد من إعداد المفتاح في إعدادات البيئة"],
      };
    }

    try {
      const { output } = await prompt(input, {
        model: `openai/${modelName}`,
        config: {
          temperature: 0.7,
        }
      });

      if (!output) throw new Error('Model returned no output');

      return {
        summaryAnalysis: cleanText(output.summaryAnalysis),
        personalizedSuggestions: (output.personalizedSuggestions || []).map(cleanText),
        conflictsDetected: (output.conflictsDetected || []).map(c => ({
          ...c,
          appointment1: cleanText(c.appointment1),
          appointment2: cleanText(c.appointment2),
          reason: cleanText(c.reason),
          suggestion: cleanText(c.suggestion),
        })),
      };
    } catch (error: any) {
      console.error('Genkit Flow Execution Error:', error);
      return {
        summaryAnalysis: "أواجه حالياً صعوبة تقنية في الوصول إلى محرك الذكاء الاصطناعي الجديد. نصيحتي السريعة هي مراجعة أهم مهامك اليوم والبدء بالأكثر إلحاحاً.",
        personalizedSuggestions: ["حاول تحديث الصفحة لاحقاً", "تأكد من استقرار اتصال الإنترنت"],
      };
    }
  }
);

export async function optimizeSchedule(input: OptimizeScheduleInput): Promise<OptimizeScheduleOutput> {
  return aiScheduleOptimizerFlow(input);
}
