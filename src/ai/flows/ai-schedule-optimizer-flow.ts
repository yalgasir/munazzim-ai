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
  prompt: `أنت مساعد 'منظّم' الذكي، خبير في علم النفس والإنتاجية. مهمتك هي تحليل جدول المستخدم وتقديم نصائح عملية.

حالة المستخدم أو سؤاله: {{{productivityContext}}}

المواعيد الحالية:
{{#each currentAppointments}}
- {{{title}}} (من {{{startTime}}} إلى {{{endTime}}})
{{/each}}

المهام المعلقة:
{{#each currentTasks}}
- {{{description}}} (الأولوية: {{{priority}}}, مكتملة: {{{isCompleted}}})
{{/each}}

تعليمات هامة:
1. إذا كان المستخدم يشعر بالتعب أو الإحباط (مثل قوله 'تعبان')، ابدأ بكلمات تشجيعية وانصحه بأخذ استراحة أو تقليل ضغط المهام.
2. حلل التعارضات الزمنية إن وجدت.
3. قدم اقتراحات محددة بناءً على قائمة المهام.
4. الرد باللغة العربية الفصحى والودودة.
5. لا تستخدم أي رموز Markdown نهائياً.`,
});

const aiScheduleOptimizerFlow = ai.defineFlow(
  {
    name: 'aiScheduleOptimizerFlow',
    inputSchema: OptimizeScheduleInputSchema,
    outputSchema: OptimizeScheduleOutputSchema,
  },
  async (input) => {
    // استخدام نموذج Gemini 2.0 Flash عبر OpenRouter
    const modelName = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

    if (!process.env.OPENROUTER_API_KEY) {
      return {
        summaryAnalysis: "عذراً، يبدو أن مفتاح البرمجة (API Key) غير مهيأ في النظام. يرجى التأكد من إعدادات البيئة.",
        personalizedSuggestions: ["تأكد من إضافة OPENROUTER_API_KEY في ملف .env"],
      };
    }

    try {
      const { output } = await prompt(input, {
        model: `openai/${modelName}`,
      });

      if (!output) {
        throw new Error('No output from model');
      }

      return {
        summaryAnalysis: cleanText(output.summaryAnalysis),
        personalizedSuggestions: (output.personalizedSuggestions || []).map(cleanText),
        conflictsDetected: output.conflictsDetected,
      };
    } catch (error: any) {
      console.error('AI Flow Error:', error);
      return {
        summaryAnalysis: "أواجه حالياً ضغطاً في الاتصال بمحرك الذكاء الاصطناعي عبر OpenRouter. نصيحتي السريعة لك هي ترتيب مهامك حسب الأولوية والتركيز على المهمة الأهم حالياً.",
        personalizedSuggestions: ["حاول إعادة المحاولة بعد ثوانٍ", "تأكد من استقرار اتصالك بالإنترنت"],
      };
    }
  }
);

export async function optimizeSchedule(input: OptimizeScheduleInput): Promise<OptimizeScheduleOutput> {
  return aiScheduleOptimizerFlow(input);
}