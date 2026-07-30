'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview AI Flow for parsing natural language into structured appointments and tasks.
 */

const CreateScheduleInputSchema = z.object({
  userInput: z.string().describe('The user description of a meeting or activity'),
  currentDate: z.string().describe('Current date for context'),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleInputSchema>;

const GeneratedTaskSchema = z.object({
  description: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  category: z.enum(['Preparation', 'Follow-up', 'General']),
  dueDate: z.string().optional().describe('ISO string date'),
});

const CreateScheduleOutputSchema = z.object({
  appointment: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().describe('YYYY-MM-DD'),
    startTime: z.string().describe('HH:mm'),
    endTime: z.string().describe('HH:mm'),
    location: z.string().optional(),
    meetingLink: z.string().optional(),
    participants: z.array(z.string()).optional(),
    objectives: z.array(z.string()).optional(),
    agenda: z.array(z.string()).optional(),
  }),
  tasks: z.array(GeneratedTaskSchema).describe('Suggested preparation and follow-up tasks'),
  missingInformation: z.array(z.string()).optional().describe('Questions to ask if details are unclear'),
  conflictWarning: z.string().optional().describe('Warning if the AI detects a potential overlap'),
});

export type CreateScheduleOutput = z.infer<typeof CreateScheduleOutputSchema>;

export async function createSchedule(input: CreateScheduleInput): Promise<CreateScheduleOutput> {
  const result = await ai.generate({
    prompt: `
      You are an expert executive assistant. 
      Current Date: ${input.currentDate}
      User Input: "${input.userInput}"
      
      Extract and structure the meeting details. 
      - Generate logical 'Preparation' tasks to be done before the meeting.
      - Generate logical 'Follow-up' tasks for after the meeting.
      - If times are not specified, suggest reasonable defaults based on the context.
      - Ensure the output is strictly valid JSON matching the schema.
    `,
    model: 'googleai/gemini-1.5-flash', // Standard reliable model
    output: { schema: CreateScheduleOutputSchema }
  });

  return result.output!;
}
