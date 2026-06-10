'use server';

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

function buildPrompt(input: OptimizeScheduleInput) {
  const appointments = input.currentAppointments.length
    ? input.currentAppointments
        .map((a) => `- ${a.title} من ${a.startTime} إلى ${a.endTime}`)
        .join('\n')
    : 'لا توجد مواعيد مسجلة.';

  const tasks = input.currentTasks.length
    ? input.currentTasks
        .map(
          (t) =>
            `- ${t.description}، الأولوية: ${t.priority}، مكتملة: ${t.isCompleted ? 'نعم' : 'لا'}`
        )
        .join('\n')
    : 'لا توجد مهام مسجلة.';

  return `
أنت مساعد "منظّم" الذكي، خبير في الإنتاجية وإدارة الوقت.

حالة المستخدم أو سؤاله:
${input.productivityContext || 'لا يوجد سياق إضافي.'}

المواعيد الحالية:
${appointments}

المهام المعلقة:
${tasks}

المطلوب:
1. قدم تحليل مختصر لحالة المستخدم.
2. قدم 3 توصيات عملية ومباشرة.
3. اذكر أي تعارضات زمنية إن وجدت.
4. الرد باللغة العربية الفصحى.
5. لا تستخدم Markdown ولا رموز خاصة.
`;
}

function extractSuggestions(text: string): string[] {
  const lines = text
    .split('\n')
    .map((line) => cleanText(line))
    .filter(Boolean);

  const suggestions = lines.filter(
    (line) =>
      line.includes('التوصية') ||
      line.includes('اقترح') ||
      line.includes('ابدأ') ||
      line.includes('خصص') ||
      line.includes('راجع') ||
      line.includes('رتب')
  );

  if (suggestions.length >= 3) return suggestions.slice(0, 3);

  return [
    'ابدأ بالمهام ذات الأولوية العالية أولاً.',
    'اترك وقتاً فاصلاً بين المواعيد لتجنب الضغط والتعارض.',
    'راجع جدولك في نهاية اليوم وحدد ما سيتم نقله لليوم التالي.',
  ];
}

export async function optimizeSchedule(
  input: OptimizeScheduleInput
): Promise<OptimizeScheduleOutput> {
  const modelName = process.env.OPENROUTER_MODEL || 'qwen/qwen3.6-plus:free';

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      summaryAnalysis:
        'تنبيه: مفتاح OPENROUTER_API_KEY غير متوفر حالياً. يرجى إضافته لتفعيل التحليل الذكي.',
      personalizedSuggestions: ['تأكد من إعداد OPENROUTER_API_KEY في إعدادات البيئة.'],
      conflictsDetected: [],
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://huggingface.co/spaces/yalgasir/ai-time-manager',
        'X-Title': 'Munazzim AI Time Manager',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content:
              'أنت مساعد عربي متخصص في إدارة الوقت والإنتاجية. رد دائماً بالعربية وبأسلوب واضح ومباشر.',
          },
          {
            role: 'user',
            content: buildPrompt(input),
          },
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter Error:', errorText);

      return {
        summaryAnalysis:
          'حدث خطأ في الاتصال بـ Qwen3.6 Plus عبر OpenRouter. تحقق من المفتاح واسم الموديل في إعدادات البيئة.',
        personalizedSuggestions: [
          'تأكد من وجود OPENROUTER_API_KEY.',
          'تأكد من أن OPENROUTER_MODEL يساوي qwen/qwen3.6-plus:free.',
          'أعد تشغيل التطبيق أو Hugging Face Space بعد تحديث الإعدادات.',
        ],
        conflictsDetected: [],
      };
    }

    const data = await response.json();
    const aiText = cleanText(data?.choices?.[0]?.message?.content || '');

    if (!aiText) {
      return {
        summaryAnalysis:
          'تم الاتصال بالموديل، لكن لم يتم توليد رد واضح. حاول إعادة صياغة طلبك.',
        personalizedSuggestions: [
          'اكتب مهامك ومواعيدك بشكل أوضح.',
          'حدد أوقات المواعيد بدقة.',
          'اذكر المهام الأعلى أولوية.',
        ],
        conflictsDetected: [],
      };
    }

    return {
      summaryAnalysis: aiText,
      personalizedSuggestions: extractSuggestions(aiText),
      conflictsDetected: [],
    };
  } catch (error: any) {
    console.error('OpenRouter Direct Call Error:', error);

    return {
      summaryAnalysis:
        'أواجه حالياً صعوبة تقنية في الوصول إلى Qwen3.6 Plus عبر OpenRouter. تأكد من المفتاح والاتصال ثم حاول مرة أخرى.',
      personalizedSuggestions: [
        'تحقق من OPENROUTER_API_KEY.',
        'تحقق من OPENROUTER_MODEL.',
        'أعد تشغيل السيرفر بعد أي تعديل.',
      ],
      conflictsDetected: [],
    };
  }
}