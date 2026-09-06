'use server';

import { z } from 'zod';
import { askMunazzimAI, parseAIJson, type MunazzimAIResponse } from '@/ai/ai-client';
import { workspaceFacts } from '@/ai/schedule-facts';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

const TaskSchema = z.object({
  title: z.string().min(1),
  date: isoDate.nullable(),
  time: clockTime.nullable(),
  priority: z.enum(['High', 'Medium', 'Low']).nullable(),
  description: z.string().nullable(),
}).strict();

const AppointmentSchema = z.object({
  title: z.string().min(1),
  date: isoDate,
  startTime: clockTime,
  endTime: clockTime,
  location: z.string().nullable(),
  description: z.string().nullable(),
}).strict();

const AnalysisSchema = z.object({
  summary: z.string(),
  suggestions: z.array(z.string()),
}).strict();

const ModelResponseSchema = z.object({
  reply: z.string(),
  tasks: z.array(TaskSchema),
  appointments: z.array(AppointmentSchema),
  analysis: AnalysisSchema.nullable(),
}).strict();

const RequestIntentSchema = z.object({
  createTasks: z.boolean(),
  createAppointments: z.boolean(),
  analyzeSchedule: z.boolean(),
  taskDateProvided: z.boolean(),
  taskTimeProvided: z.boolean(),
  taskPriorityProvided: z.boolean(),
  taskDescriptionProvided: z.boolean(),
  appointmentLocationProvided: z.boolean(),
  appointmentDescriptionProvided: z.boolean(),
}).strict();

const REQUEST_INTENT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'createTasks',
    'createAppointments',
    'analyzeSchedule',
    'taskDateProvided',
    'taskTimeProvided',
    'taskPriorityProvided',
    'taskDescriptionProvided',
    'appointmentLocationProvided',
    'appointmentDescriptionProvided',
  ],
  properties: {
    createTasks: { type: 'boolean' },
    createAppointments: { type: 'boolean' },
    analyzeSchedule: { type: 'boolean' },
    taskDateProvided: { type: 'boolean' },
    taskTimeProvided: { type: 'boolean' },
    taskPriorityProvided: { type: 'boolean' },
    taskDescriptionProvided: { type: 'boolean' },
    appointmentLocationProvided: { type: 'boolean' },
    appointmentDescriptionProvided: { type: 'boolean' },
  },
};

const CANONICAL_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'tasks', 'appointments', 'analysis'],
  properties: {
    reply: { type: 'string' },
    tasks: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'date', 'time', 'priority', 'description'],
        properties: {
          title: { type: 'string' },
          date: { type: ['string', 'null'] },
          time: { type: ['string', 'null'] },
          priority: { type: ['string', 'null'], enum: ['High', 'Medium', 'Low', null] },
          description: { type: ['string', 'null'] },
        },
      },
    },
    appointments: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'date', 'startTime', 'endTime', 'location', 'description'],
        properties: {
          title: { type: 'string' },
          date: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          location: { type: ['string', 'null'] },
          description: { type: ['string', 'null'] },
        },
      },
    },
    analysis: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['summary', 'suggestions'],
          properties: {
            summary: { type: 'string' },
            suggestions: { type: 'array', maxItems: 6, items: { type: 'string' } },
          },
        },
      ],
    },
  },
};

export type AnalysisOutput = z.infer<typeof ModelResponseSchema> & {
  provider: string;
  model: string;
  providerMetadata: {
    finishReason: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    responseTimeMs: number;
  };
  warnings: string[];
};

const SYSTEM_PROMPT = `
You are Munazzim AI Assistant. Your ONLY job is to interpret the user's request and return EXACTLY one JSON object. Nothing else.

CRITICAL: If the user did NOT explicitly mention a value, it MUST be null. Do NOT invent, guess, or default any value.

Return exactly this shape - NO OTHER FIELDS:
{
  "reply": "brief message in user's language",
  "tasks": [{
    "title": "REQUIRED - never null",
    "date": "YYYY-MM-DD or null (only if explicitly mentioned)",
    "time": "HH:mm or null (only if explicitly mentioned)",
    "priority": "High|Medium|Low or null (only if explicitly mentioned)",
    "description": "string or null (only if explicitly mentioned)"
  }],
  "appointments": [{
    "title": "REQUIRED",
    "date": "YYYY-MM-DD (REQUIRED for appointments)",
    "startTime": "HH:mm (REQUIRED)",
    "endTime": "HH:mm (REQUIRED)",
    "location": "string or null (only if mentioned)",
    "description": "string or null (only if mentioned)"
  }],
  "analysis": {"summary": "", "suggestions": []} or null
}

ABSOLUTE RULES:
1. Return null for optional task fields the user did NOT request.
2. If priority is not mentioned, priority = null (NOT Medium, NOT High, NOT Low).
3. If time is not mentioned, time = null (NOT inferred, NOT guessed).
4. If date is not mentioned, date = null.
5. Existing schedule data is read-only context, not a source of new actions.
6. Never copy an existing task or appointment into the output tasks/appointments arrays.
7. Only put an item in tasks/appointments when the user's current request explicitly asks to create that new item.
8. Do NOT copy optional values from the existing schedule into new tasks.
9. Only add dates/times if the user explicitly mentioned them.
10. Any item with both a start time and an end time (such as "from X to Y" or "من X إلى Y") is an appointment, NEVER a task.

RELATIVE DATE RULES:
- Use ONLY the supplied current Riyadh date/time (provided at the start of your prompt).
- "tomorrow" = current date + 1 day
- "day after tomorrow" = current date + 2 days
- Day names = next occurrence from today
- Always output as YYYY-MM-DD

APPOINTMENT RULES:
- Only create if date, startTime, endTime are all present.
- If any are missing, return empty appointments array and explain in reply.
- Any meeting, appointment, event, or item that has both a start time and an end time (such as "from X to Y", "من X إلى Y", "meeting", "اجتماع", "موعد") MUST be placed in "appointments", NEVER in "tasks".

ANALYSIS RULES:
- Populate "analysis" whenever the user asks to review, organize, prioritize, plan, or get suggestions/recommendations about their schedule.
- This can happen in the SAME response as tasks/appointments - a single request may ask for a schedule change AND analysis together. Never drop one to satisfy the other.
- Use the supplied SCHEDULE FACTS for any statistics; never invent numbers not present there.
- If the user does not ask for analysis, set analysis = null.
- If the user only asks a question with no schedule change and no analysis request, set tasks=[], appointments=[], analysis=null, and answer in "reply".

Return JSON only. Do not use Markdown outside the JSON object.
`.trim();

const INTENT_SYSTEM_PROMPT = `
Classify only the user's current request. Return exactly one JSON object.

Understand the user's meaning in any language, especially Arabic and English.
Set createTasks=true only if the user explicitly asks for a new task, todo, reminder, or work item (e.g. "مهمة", "task", "todo", "عمل", "تذكير").
Set createAppointments=true only if the user explicitly asks for a new calendar item such as an appointment, meeting, event, or visit (e.g. "موعد", "اجتماع", "meeting", "لقاء", "مقابلة", "حدث", "appointment"). Any item with both a start time and end time (or "من ... إلى ...") is a calendar appointment, not a task.
Set analyzeSchedule=true only if the user explicitly asks to analyze, review, organize, prioritize, plan, or suggest improvements for their schedule (e.g. "حلل", "راجع", "توصيات", "analyze", "review").
If the user asks for more than one thing (such as a meeting AND a task), set every matching boolean to true.
Set each optional field boolean to true only when the user explicitly supplied that value in the current request. Do not count values from existing schedule data.

Do not infer actions from greetings, schedule context, existing data, or helpfulness.
Return JSON only.
`.trim();

function getRiyadhLocalDateTime(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '';

  return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}`;
}

// Model-first single request/response. If the first reply is not JSON at all,
// allow exactly one retry asking for JSON only - never more, and never an
// attempt to sanitize prose into JSON ourselves.
async function requestCanonicalResponse(prompt: string): Promise<MunazzimAIResponse> {
  const first = await askMunazzimAI({
    system: SYSTEM_PROMPT,
    prompt,
    temperature: 0,
    maxTokens: 800,
    json: true,
    jsonSchema: CANONICAL_JSON_SCHEMA,
  });

  try {
    parseAIJson(first.text);
    return first;
  } catch {
    return askMunazzimAI({
      system: SYSTEM_PROMPT,
      prompt: `${prompt}\n\nYour previous response was not valid JSON. Return ONLY the canonical JSON object - no prose, no markdown, no explanation. Do not copy read-only schedule context into tasks or appointments.`,
      temperature: 0,
      maxTokens: 800,
      json: true,
      jsonSchema: CANONICAL_JSON_SCHEMA,
    });
  }
}

async function requestIntent(userRequest: string): Promise<z.infer<typeof RequestIntentSchema>> {
  const first = await askMunazzimAI({
    system: INTENT_SYSTEM_PROMPT,
    prompt: `USER REQUEST:\n${userRequest}`,
    temperature: 0,
    maxTokens: 180,
    json: true,
    jsonSchema: REQUEST_INTENT_JSON_SCHEMA,
  });

  try {
    return RequestIntentSchema.parse(parseAIJson(first.text));
  } catch (error) {
    console.warn('AI Assistant intent response invalid; retrying once:', error);
  }

  const retry = await askMunazzimAI({
    system: INTENT_SYSTEM_PROMPT,
    prompt: `USER REQUEST:\n${userRequest}\n\nYour previous response was not valid JSON. Return ONLY the exact intent JSON object with boolean values.`,
    temperature: 0,
    maxTokens: 180,
    json: true,
    jsonSchema: REQUEST_INTENT_JSON_SCHEMA,
  });

  return RequestIntentSchema.parse(parseAIJson(retry.text));
}

// True absence only: real nulls/undefined or the literal strings the local model
// sometimes emits in place of JSON null ("null", "undefined", ""). Never treated
// as a signal about content - only about whether a value was actually supplied.
function isMissingLiteral(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '' || normalized === 'null' || normalized === 'undefined';
  }
  return false;
}

type SanitizedTask = z.infer<typeof TaskSchema>;
type SanitizedAppointment = z.infer<typeof AppointmentSchema>;
type SanitizedAnalysis = z.infer<typeof AnalysisSchema>;

// Structural repair only: drop/omit fields that don't fit the required shape and
// report a warning for every case where the AI actually supplied a bad value.
// Never invents dates/times, never guesses intent, never repairs semantics.
function sanitizeTasks(raw: unknown): { tasks: SanitizedTask[]; warnings: string[] } {
  const tasks: SanitizedTask[] = [];
  const warnings: string[] = [];
  if (!Array.isArray(raw)) return { tasks, warnings };

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      warnings.push('A task without a title was omitted.');
      continue;
    }
    const row = item as Record<string, unknown>;
    const title = typeof row.title === 'string' ? row.title.trim() : '';
    if (!title) {
      warnings.push('A task without a title was omitted.');
      continue;
    }

    let date: string | null = null;
    if (!isMissingLiteral(row.date)) {
      if (typeof row.date === 'string' && isoDate.safeParse(row.date).success) {
        date = row.date;
      } else {
        warnings.push('AI returned an invalid task date; it was omitted.');
      }
    }

    let time: string | null = null;
    if (!isMissingLiteral(row.time)) {
      if (typeof row.time === 'string' && clockTime.safeParse(row.time).success) {
        time = row.time;
      } else {
        warnings.push('AI returned an invalid task time; it was omitted.');
      }
    }

    let priority: 'High' | 'Medium' | 'Low' | null = null;
    if (!isMissingLiteral(row.priority)) {
      if (row.priority === 'High' || row.priority === 'Medium' || row.priority === 'Low') {
        priority = row.priority;
      } else {
        warnings.push('AI returned an invalid task priority; it was omitted.');
      }
    }

    const rawDescription = isMissingLiteral(row.description) || typeof row.description !== 'string'
      ? null
      : row.description.trim();
    const description = rawDescription && rawDescription !== title ? rawDescription : null;

    tasks.push({ title, date, time, priority, description });
  }

  return { tasks, warnings };
}

function sanitizeAppointments(raw: unknown): { appointments: SanitizedAppointment[]; warnings: string[] } {
  const appointments: SanitizedAppointment[] = [];
  const warnings: string[] = [];
  if (!Array.isArray(raw)) return { appointments, warnings };

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      warnings.push('An appointment was omitted because required fields were missing.');
      continue;
    }
    const row = item as Record<string, unknown>;
    const title = typeof row.title === 'string' ? row.title.trim() : '';
    const dateValid = typeof row.date === 'string' && isoDate.safeParse(row.date).success;
    const startValid = typeof row.startTime === 'string' && clockTime.safeParse(row.startTime).success;
    const endValid = typeof row.endTime === 'string' && clockTime.safeParse(row.endTime).success;

    if (!title || !dateValid || !startValid || !endValid) {
      warnings.push('An appointment was omitted because its title, date, or time was missing or invalid.');
      continue;
    }

    const date = row.date as string;
    const startTime = row.startTime as string;
    const endTime = row.endTime as string;

    if (endTime <= startTime) {
      warnings.push('An appointment was omitted because its end time was not after its start time.');
      continue;
    }

    const location = isMissingLiteral(row.location) || typeof row.location !== 'string' ? null : row.location;
    const description = isMissingLiteral(row.description) || typeof row.description !== 'string' ? null : row.description;

    appointments.push({ title, date, startTime, endTime, location, description });
  }

  return { appointments, warnings };
}

function sanitizeAnalysis(raw: unknown): { analysis: SanitizedAnalysis | null; warnings: string[] } {
  if (isMissingLiteral(raw)) return { analysis: null, warnings: [] };
  if (!raw || typeof raw !== 'object') {
    return { analysis: null, warnings: ['AI returned an invalid analysis section; it was omitted.'] };
  }

  const row = raw as Record<string, unknown>;
  const summaryValid = typeof row.summary === 'string';
  const suggestionsValid = Array.isArray(row.suggestions)
    && row.suggestions.every((item) => typeof item === 'string');

  if (!summaryValid || !suggestionsValid) {
    return { analysis: null, warnings: ['AI returned an invalid analysis section; it was omitted.'] };
  }

  // Structural repair only: literal "null"/"undefined"/"" placeholders count as absent content.
  const summary = isMissingLiteral(row.summary) ? '' : (row.summary as string);
  const suggestions = (row.suggestions as string[]).filter((item) => !isMissingLiteral(item));

  if (!summary && suggestions.length === 0) {
    return { analysis: null, warnings: [] };
  }

  return { analysis: { summary, suggestions }, warnings: [] };
}

function sanitizeModelResponse(raw: unknown): { data: z.infer<typeof ModelResponseSchema>; warnings: string[] } {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const reply = isMissingLiteral(row.reply) || typeof row.reply !== 'string' ? '' : row.reply;
  const taskResult = sanitizeTasks(row.tasks);
  const appointmentResult = sanitizeAppointments(row.appointments);
  const analysisResult = sanitizeAnalysis(row.analysis);

  return {
    data: {
      reply,
      tasks: taskResult.tasks,
      appointments: appointmentResult.appointments,
      analysis: analysisResult.analysis,
    },
    warnings: [...taskResult.warnings, ...appointmentResult.warnings, ...analysisResult.warnings],
  };
}

function exactDuplicateKeys(
  appointments: unknown[],
  tasks: unknown[]
): { appointments: Set<string>; tasks: Set<string> } {
  const taskKeys = new Set(
    tasks.map((item) => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return [row.title ?? row.description, row.date, row.time].map(String).join('|').toLocaleLowerCase();
    })
  );
  const appointmentKeys = new Set(
    appointments.map((item) => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const range = row.startTime && row.endTime
        ? `${row.startTime} - ${row.endTime}`
        : row.time;
      return [row.title, row.date, range].map(String).join('|').toLocaleLowerCase();
    })
  );
  return { tasks: taskKeys, appointments: appointmentKeys };
}

function removeExactDuplicates(
  response: z.infer<typeof ModelResponseSchema>,
  appointments: unknown[],
  tasks: unknown[]
): z.infer<typeof ModelResponseSchema> {
  const existing = exactDuplicateKeys(appointments, tasks);
  const taskKeys = new Set<string>();
  const appointmentKeys = new Set<string>();

  return {
    ...response,
    tasks: response.tasks.filter((task) => {
      const key = [task.title, task.date, task.time].map(String).join('|').toLocaleLowerCase();
      if (existing.tasks.has(key) || taskKeys.has(key)) return false;
      taskKeys.add(key);
      return true;
    }),
    appointments: response.appointments.filter((appointment) => {
      const range = `${appointment.startTime} - ${appointment.endTime}`;
      const key = [appointment.title, appointment.date, range].map(String).join('|').toLocaleLowerCase();
      if (existing.appointments.has(key) || appointmentKeys.has(key)) return false;
      appointmentKeys.add(key);
      return true;
    }),
  };
}

function applyIntentGate(
  response: z.infer<typeof ModelResponseSchema>,
  intent: z.infer<typeof RequestIntentSchema>
): { data: z.infer<typeof ModelResponseSchema>; warnings: string[] } {
  const warnings: string[] = [];
  const tasks = intent.createTasks
    ? response.tasks.map((task) => ({
        ...task,
        date: intent.taskDateProvided ? task.date : null,
        time: intent.taskTimeProvided ? task.time : null,
        priority: intent.taskPriorityProvided ? task.priority : null,
        description: intent.taskDescriptionProvided ? task.description : null,
      }))
    : [];
  const appointments = intent.createAppointments
    ? response.appointments.map((appointment) => ({
        ...appointment,
        location: intent.appointmentLocationProvided ? appointment.location : null,
        description: intent.appointmentDescriptionProvided ? appointment.description : null,
      }))
    : [];
  const analysis = intent.analyzeSchedule ? response.analysis : null;

  if (!intent.createTasks && response.tasks.length > 0) {
    warnings.push('AI returned task actions that were not requested; they were omitted.');
  }
  if (!intent.createAppointments && response.appointments.length > 0) {
    warnings.push('AI returned appointment actions that were not requested; they were omitted.');
  }
  if (!intent.analyzeSchedule && response.analysis) {
    warnings.push('AI returned schedule analysis that was not requested; it was omitted.');
  }

  return { data: { ...response, tasks, appointments, analysis }, warnings };
}

export async function analyzeFullSchedule(
  appointments: unknown[],
  tasks: unknown[],
  userContext?: string
): Promise<AnalysisOutput> {
  const request = userContext?.trim() || 'Analyze my schedule and performance and give useful productivity recommendations.';

  const intent = await requestIntent(request);
  const facts = workspaceFacts(appointments, tasks);
  const scheduleFactsSection = intent.analyzeSchedule
    ? `READ-ONLY AGGREGATE SCHEDULE FACTS (use only for analysis; never invent numbers not present here):\n${JSON.stringify(facts)}`
    : 'READ-ONLY AGGREGATE SCHEDULE FACTS: Not supplied because schedule analysis was not requested.';

  const prompt = `
CURRENT RIYADH LOCAL DATE/TIME: ${getRiyadhLocalDateTime()}
TIMEZONE: Asia/Riyadh

MODEL-DERIVED REQUEST GATE:
${JSON.stringify(intent)}

Only fill output arrays/analysis where the matching gate value is true. If createTasks=false, tasks must be []. If createAppointments=false, appointments must be []. If analyzeSchedule=false, analysis must be null.
For optional fields, if the matching gate field ends with Provided=false, return null for that optional field.
If analyzeSchedule=false, do not mention schedule facts in the reply.

USER REQUEST:
${request}

${scheduleFactsSection}

Return only the canonical JSON object from the system instructions.
`.trim();

  const response = await requestCanonicalResponse(prompt);
  console.log('AI Assistant provider metadata:', {
    finishReason: response.finishReason,
    promptTokens: response.usage.promptTokens,
    completionTokens: response.usage.completionTokens,
    responseTimeMs: response.responseTimeMs,
  });
  console.log('AI Assistant action response received:', { provider: response.providerLabel });

  let parsed: z.infer<typeof ModelResponseSchema>;
  let warnings: string[];
  try {
    // Invalid JSON is a hard failure - no partial recovery is attempted here.
    const rawParsed = parseAIJson(response.text);

    // Beyond this point the JSON is well-formed; sanitize repairs structure
    // only (drop/omit bad fields) and reports every repair as a warning.
    const sanitized = sanitizeModelResponse(rawParsed);
    const gated = applyIntentGate(ModelResponseSchema.parse(sanitized.data), intent);
    parsed = gated.data;
    warnings = [...sanitized.warnings, ...gated.warnings];
  } catch (error) {
    console.error('AI canonical response validation failed:', error instanceof z.ZodError ? error.issues : error);
    throw new Error('AI returned malformed or invalid schedule JSON. No actions were created.');
  }

  const result = removeExactDuplicates(parsed, appointments, tasks);
  return {
    ...result,
    provider: response.providerLabel,
    model: response.model,
    providerMetadata: {
      finishReason: response.finishReason,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      responseTimeMs: response.responseTimeMs,
    },
    warnings,
  };
}
