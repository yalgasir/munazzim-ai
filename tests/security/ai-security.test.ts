import { askMunazzimAI, parseAIJson } from '../../src/ai/ai-client';
import { analyzeFullSchedule } from '../../src/ai/flows/ai-schedule-optimizer-flow';

type Case = { test: string; expected: string; actual: string; passed: boolean };
const results: Case[] = [];

function record(test: string, expected: string, actual: string, passed: boolean) {
  results.push({ test, expected, actual, passed });
}

const intent = {
  createTasks: true,
  createAppointments: true,
  analyzeSchedule: true,
  taskDateProvided: true,
  taskTimeProvided: true,
  taskPriorityProvided: true,
  taskDescriptionProvided: true,
  appointmentLocationProvided: true,
  appointmentDescriptionProvided: true,
};

function providerResponse(text: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });
}

async function flowWithResponses(responses: string[]) {
  const originalFetch = globalThis.fetch;
  let index = 0;
  globalThis.fetch = async () => providerResponse(responses[index++] ?? responses.at(-1) ?? '');
  try {
    return await analyzeFullSchedule([], [], 'Create requested items and analyze the schedule.');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function expectRejected(test: string, responses: string[]) {
  try {
    await flowWithResponses(responses);
    record(test, 'AI flow rejects invalid model output with no persistence call.', 'Flow unexpectedly resolved.', false);
  } catch {
    record(test, 'AI flow rejects invalid model output with no persistence call.', 'Flow rejected; this function has no Firestore write path.', true);
  }
}

async function main() {
await expectRejected('Malformed model JSON', [JSON.stringify(intent), '{invalid', '{invalid']);
await expectRejected('Empty model JSON', [JSON.stringify(intent), '', '']);

const invalidOutput = JSON.stringify({
  reply: 'Checked.',
  tasks: [
    { title: '', date: '2026-99-99', time: '25:00', priority: 'Urgent', description: null },
    { title: 'Invalid optional values', date: 'bad-date', time: '99:99', priority: null, description: null },
  ],
  appointments: [
    { title: 'Bad date', date: 'bad-date', startTime: '10:00', endTime: '11:00', location: null, description: null },
    { title: 'Bad start', date: '2026-09-03', startTime: '25:00', endTime: '11:00', location: null, description: null },
    { title: 'Bad end', date: '2026-09-03', startTime: '10:00', endTime: '99:99', location: null, description: null },
    { title: 'Reverse range', date: '2026-09-03', startTime: '11:00', endTime: '10:00', location: null, description: null },
  ],
  analysis: { summary: 7, suggestions: 'not-an-array' },
});
const sanitized = await flowWithResponses([JSON.stringify(intent), invalidOutput]);
record('Missing title and invalid optional task date/time', 'Invalid task is omitted; invalid optional fields are omitted.', `tasks=${sanitized.tasks.length}`, sanitized.tasks.length === 1 && sanitized.tasks[0].date === null && sanitized.tasks[0].time === null);
record('Invalid appointment date/start/end and end <= start', 'Invalid appointments are omitted.', `appointments=${sanitized.appointments.length}`, sanitized.appointments.length === 0);
record('Malformed analysis object', 'Invalid analysis is omitted.', `analysis=${sanitized.analysis === null ? 'null' : 'present'}`, sanitized.analysis === null);

const duplicateOutput = JSON.stringify({
  reply: 'Duplicate removed.',
  tasks: [{ title: 'Existing', date: '2026-09-03', time: '09:00', priority: null, description: null }],
  appointments: [],
  analysis: null,
});
const originalFetch = globalThis.fetch;
let duplicateIndex = 0;
globalThis.fetch = async () => providerResponse([JSON.stringify(intent), duplicateOutput][duplicateIndex++] ?? duplicateOutput);
try {
  const duplicateResult = await analyzeFullSchedule([], [{ title: 'Existing', date: '2026-09-03', time: '09:00' }], 'Create a task.');
  record('Duplicate AI action', 'Exact duplicate is removed before any persistence action.', `tasks=${duplicateResult.tasks.length}`, duplicateResult.tasks.length === 0);
} finally {
  globalThis.fetch = originalFetch;
}

const providerFetch = globalThis.fetch;
let fallbackCalls: string[] = [];
globalThis.fetch = async (url) => {
  fallbackCalls.push(String(url));
  if (String(url).includes('192.168.0.5')) throw new Error('isolated primary failure');
  return new Response(JSON.stringify({ message: { content: '{"reply":"fallback"}' }, done_reason: 'stop' }), { status: 200 });
};
try {
  const fallback = await askMunazzimAI({ system: 'Return JSON.', prompt: 'Test.', json: true });
  record('Qwen unavailable to Ollama fallback', 'Primary fails, fallback returns valid Ollama result.', `provider=${fallback.provider}; calls=${fallbackCalls.length}`, fallback.provider === 'ollama' && fallbackCalls.length === 2);
} finally {
  globalThis.fetch = providerFetch;
}

globalThis.fetch = async () => { throw new Error('isolated provider failure'); };
try {
  await askMunazzimAI({ system: 'Return JSON.', prompt: 'Test.', json: true });
  record('Both providers unavailable', 'Clean controlled error with no result or persistence.', 'Gateway unexpectedly resolved.', false);
} catch (error) {
  record('Both providers unavailable', 'Clean controlled error with no result or persistence.', `error=${error instanceof Error ? error.message : 'unknown'}`, error instanceof Error && error.message === 'Both Qwen and local Ollama are unavailable.');
} finally {
  globalThis.fetch = providerFetch;
}

const parseCases = ['{', ''];
for (const value of parseCases) {
  try { parseAIJson(value); record(`parseAIJson ${JSON.stringify(value)}`, 'Throws.', 'Unexpectedly parsed.', false); }
  catch { record(`parseAIJson ${JSON.stringify(value)}`, 'Throws.', 'Threw JSON parse error.', true); }
}

console.table(results);
if (results.some((result) => !result.passed)) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});