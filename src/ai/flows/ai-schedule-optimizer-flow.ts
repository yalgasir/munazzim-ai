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
        .map((a) => `- ${a.title} from ${a.startTime} to ${a.endTime}`)
        .join('\n')
    : 'No registered appointments.';

  const tasks = input.currentTasks.length
    ? input.currentTasks
        .map(
          (t) =>
            `- ${t.description}, Priority: ${t.priority}, Completed: ${t.isCompleted ? 'Yes' : 'No'}`
        )
        .join('\n')
    : 'No registered tasks.';

  return `
You are the "Munazzim" AI assistant, an expert in productivity and time management.

User context or question:
${input.productivityContext || 'No additional context.'}

Current Appointments:
${appointments}

Pending Tasks:
${tasks}

Requirements:
1. Provide a concise analysis of the user's situation.
2. Provide 3 direct, actionable recommendations.
3. Mention any time conflicts if found.
4. Respond in professional English.
5. Do not use Markdown or special symbols.
`;
}

function extractSuggestions(text: string): string[] {
  const lines = text
    .split('\n')
    .map((line) => cleanText(line))
    .filter(Boolean);

  const suggestions = lines.filter(
    (line) =>
      line.toLowerCase().includes('recommend') ||
      line.toLowerCase().includes('suggest') ||
      line.toLowerCase().includes('start') ||
      line.toLowerCase().includes('allocate') ||
      line.toLowerCase().includes('review') ||
      line.toLowerCase().includes('organize')
  );

  if (suggestions.length >= 3) return suggestions.slice(0, 3);

  return [
    'Start with high-priority tasks first.',
    'Leave buffer time between appointments to avoid stress.',
    'Review your schedule at the end of the day and move unfinished tasks.',
  ];
}

export async function optimizeSchedule(
  input: OptimizeScheduleInput
): Promise<OptimizeScheduleOutput> {
  const modelName = process.env.OPENROUTER_MODEL || 'gryphe/mythomax-l2-13b';

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      summaryAnalysis:
        'Alert: OPENROUTER_API_KEY is not currently available. Please add it to activate intelligent analysis.',
      personalizedSuggestions: ['Ensure OPENROUTER_API_KEY is set in environment settings.'],
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
              'You are a professional English AI assistant specializing in time management and productivity. Always respond in clear, direct English.',
          },
          {
            role: 'user',
            content: buildPrompt(input),
          },
        ],
        temperature: 0.6,
        max_tokens: 800,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter Error:', errorText);

      return {
        summaryAnalysis:
          'A connection error occurred with the AI engine. Please check your API key.',
        personalizedSuggestions: [
          'Verify OPENROUTER_API_KEY exists.',
          'Try again later.',
        ],
        conflictsDetected: [],
      };
    }

    const data = await response.json();
    const aiText = cleanText(data?.choices?.[0]?.message?.content || '');

    if (!aiText) {
      return {
        summaryAnalysis:
          'Connected to model, but no clear response was generated. Try rephrasing your request.',
        personalizedSuggestions: [
          'Write your tasks and appointments more clearly.',
          'Specify appointment times accurately.',
          'Mention the highest priority tasks.',
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
        'I am currently experiencing technical difficulties accessing the AI engine. Please check your connection.',
      personalizedSuggestions: [
        'Check environment settings.',
        'Restart the server after any modification.',
      ],
      conflictsDetected: [],
    };
  }
}

