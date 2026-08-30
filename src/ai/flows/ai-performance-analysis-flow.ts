'use server';

import { z } from 'zod';
import { askMunazzimAI, parseAIJson } from '@/ai/ai-client';
import { workspaceFacts } from '@/ai/schedule-facts';

const AnalysisSchema = z.object({
  summary: z.string().min(1),
  suggestions: z.array(z.string().min(1)),
}).strict();

const CompleteAnalysisSchema = AnalysisSchema.extend({
  suggestions: z.array(z.string().min(1)).length(3),
});

const ANALYSIS_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'suggestions'],
  properties: {
    summary: { type: 'string' },
    suggestions: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: { type: 'string' },
    },
  },
};

const ANALYSIS_SYSTEM_PROMPT = `
You analyze the user's real schedule. Return only valid JSON.
Do not create tasks or appointments. Do not invent statistics.
Use only the supplied facts and schedule.
When totals.taskCompletionRate is a number, the summary must include that exact percentage followed by "%".
Never combine the time or date of one schedule item with the title of another item.
Return exactly this shape:
{"summary":"string","suggestions":["string","string","string"]}
Provide exactly 3 useful, specific schedule recommendations.
`.trim();

const ANSWER_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['reply'],
  properties: {
    reply: { type: 'string' },
  },
};

const ANSWER_SYSTEM_PROMPT = `
You are a schedule assistant answering the user's question.
Return only valid JSON in this exact shape: {"reply":"string"}.
Give a useful answer in the user's language using the supplied schedule when relevant.
Do not create tasks or appointments. Do not echo the user's question.
`.trim();

export type PerformanceAnalysisOutput = z.infer<typeof CompleteAnalysisSchema> & {
  provider: string;
  model: string;
  responseTimeMs: number;
  rawResponse: string;
  attempts: number;
};

function isCompleted(task: Record<string, unknown>): boolean {
  return task.status === 'Done' || task.isCompleted === true;
}

function parseAnalysis(text: string): z.infer<typeof AnalysisSchema> {
  return AnalysisSchema.parse(parseAIJson(text));
}

export async function analyzeWorkspacePerformance(
  appointments: unknown[],
  tasks: unknown[],
  userRequest?: string
): Promise<PerformanceAnalysisOutput> {
  const facts = workspaceFacts(appointments, tasks);
  const prompt = `USER REQUEST:\n${userRequest || 'Analyze this schedule and provide recommendations.'}\n\nSCHEDULE FACTS:\n${JSON.stringify(facts)}\n\nReturn the analysis JSON now.`;
  const startedAt = Date.now();
  const firstResponse = await askMunazzimAI({
    system: ANALYSIS_SYSTEM_PROMPT,
    prompt,
    temperature: 0,
    maxTokens: 350,
    json: true,
    jsonSchema: ANALYSIS_JSON_SCHEMA,
  });
  const firstAnalysis = parseAnalysis(firstResponse.text);

  if (firstAnalysis.suggestions.length === 3) {
    const analysis = CompleteAnalysisSchema.parse(firstAnalysis);
    console.log('AI Performance raw model response:', firstResponse.text);
    return {
      ...analysis,
      provider: firstResponse.providerLabel,
      model: firstResponse.model,
      responseTimeMs: Date.now() - startedAt,
      rawResponse: firstResponse.text,
      attempts: 1,
    };
  }

  const retryResponse = await askMunazzimAI({
    system: ANALYSIS_SYSTEM_PROMPT,
    prompt: `${prompt}\n\nReturn the requested analysis JSON with exactly 3 useful schedule recommendations based on the supplied data.`,
    temperature: 0,
    maxTokens: 350,
    json: true,
    jsonSchema: ANALYSIS_JSON_SCHEMA,
  });
  const analysis = CompleteAnalysisSchema.parse(parseAnalysis(retryResponse.text));
  console.log('AI Performance raw model response:', retryResponse.text);

  return {
    ...analysis,
    provider: retryResponse.providerLabel,
    model: retryResponse.model,
    responseTimeMs: Date.now() - startedAt,
    rawResponse: retryResponse.text,
    attempts: 2,
  };
}

export async function answerScheduleQuestion(
  appointments: unknown[],
  tasks: unknown[],
  userRequest: string
): Promise<{ reply: string; provider: string; model: string; rawResponse: string }> {
  const facts = workspaceFacts(appointments, tasks);
  const response = await askMunazzimAI({
    system: ANSWER_SYSTEM_PROMPT,
    prompt: `USER QUESTION:\n${userRequest}\n\nSCHEDULE FACTS:\n${JSON.stringify(facts)}\n\nReturn the answer JSON now.`,
    temperature: 0,
    maxTokens: 250,
    json: true,
    jsonSchema: ANSWER_JSON_SCHEMA,
  });
  const parsed = z.object({ reply: z.string().min(1) }).strict().parse(parseAIJson(response.text));
  console.log('AI Assistant answer raw model response:', response.text);

  return {
    ...parsed,
    provider: response.providerLabel,
    model: response.model,
    rawResponse: response.text,
  };
}