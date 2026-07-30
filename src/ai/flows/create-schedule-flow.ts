'use server';

/**
 * @fileOverview AI Flow for parsing natural language into highly structured appointments and tasks.
 * 
 * - createSchedule - A function that handles the schedule extraction process.
 * - CreateScheduleInput - The input type for the function.
 * - CreateScheduleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratedTaskSchema = z.object({
  description: z.string().describe('Detailed description of the task'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('Urgency level'),
  category: z.enum(['Preparation', 'Follow-up', 'General']),
  dueDate: z.string().optional().describe('Suggested deadline in YYYY-MM-DD format'),
});

const CreateScheduleInputSchema = z.object({
  userInput: z.string().describe('The user description of a meeting or activity'),
  currentDate: z.string().describe('Current date for context'),
});

const CreateScheduleOutputSchema = z.object({
  appointment: z.object({
    title: z.string().describe('Concise title for the event'),
    description: z.string().describe('Detailed description or purpose'),
    date: z.string().describe('Date in YYYY-MM-DD format'),
    startTime: z.string().describe('Start time in HH:mm format'),
    endTime: z.string().describe('End time in HH:mm format'),
    location: z.string().optional().describe('Physical location or URL link'),
    participants: z.array(z.string()).optional().describe('List of people involved'),
    objectives: z.array(z.string()).optional().describe('Primary goals of the meeting'),
    agenda: z.array(z.string()).optional().describe('Step by step agenda items'),
  }),
  tasks: z.array(GeneratedTaskSchema).describe('Suggested preparation and follow-up tasks'),
  missingInformation: z.array(z.string()).optional().describe('Questions to ask the user for missing vital details'),
  conflictWarning: z.string().optional().describe('A warning if the requested time seems inappropriate or conflicts with common sense'),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleInputSchema>;
export type CreateScheduleOutput = z.infer<typeof CreateScheduleOutputSchema>;

const createSchedulePrompt = ai.definePrompt({
  name: 'createSchedulePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: CreateScheduleInputSchema },
  output: { schema: CreateScheduleOutputSchema },
  prompt: `
    You are an elite executive assistant. 
    Current Date: {{{currentDate}}}
    User Input: "{{{userInput}}}"
    
    Instructions:
    1. Extract all meeting details. If a time isn't specified, suggest a logical one.
    2. Generate specific 'Preparation' tasks (e.g., "Prepare slides", "Research attendee profiles").
    3. Generate specific 'Follow-up' tasks (e.g., "Send meeting minutes", "Update CRM").
    4. Assign realistic deadlines and priorities.
    5. Identify if the user forgot crucial info (like location or specific time).
  `,
});

const createScheduleFlow = ai.defineFlow(
  {
    name: 'createScheduleFlow',
    inputSchema: CreateScheduleInputSchema,
    outputSchema: CreateScheduleOutputSchema,
  },
  async (input) => {
    const { output } = await createSchedulePrompt(input);
    if (!output) throw new Error('Failed to generate schedule output');
    return output;
  }
);

export async function createSchedule(input: CreateScheduleInput): Promise<CreateScheduleOutput> {
  return await createScheduleFlow(input);
}
