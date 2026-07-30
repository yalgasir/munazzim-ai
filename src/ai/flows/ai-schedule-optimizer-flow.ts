'use server';

/**
 * @fileOverview Deep schedule analysis flow providing insights and recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalysisInputSchema = z.object({
  appointments: z.array(z.any()),
  tasks: z.array(z.any()),
  currentDate: z.string(),
});

const AnalysisOutputSchema = z.object({
  todayOverview: z.string().describe('Summary of the day and week ahead'),
  priorityRecommendations: z.array(z.string()).describe('Top 3-5 tasks to focus on'),
  conflictAlerts: z.array(z.string()).describe('List of overlapping events or missed deadlines'),
  upcomingDeadlines: z.array(z.string()).describe('Key deadlines approaching'),
  availableSlots: z.array(z.string()).describe('Suggested times for deep work or breaks'),
  dailyPlan: z.array(z.object({
    time: z.string(),
    activity: z.string(),
    isTask: z.boolean()
  })).describe('An hourly breakdown of the suggested day'),
  generalRecommendation: z.string().describe('Overall advice for productivity and balance')
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

export async function analyzeFullSchedule(appointments: any[], tasks: any[]): Promise<AnalysisOutput> {
  const currentDate = new Date().toISOString();
  
  const result = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    input: { appointments, tasks, currentDate },
    output: { schema: AnalysisOutputSchema },
    prompt: `
      You are a world-class productivity consultant. Analyze the user's current workload:
      
      Appointments: {{json appointments}}
      Tasks: {{json tasks}}
      Current Date: {{currentDate}}
      
      Deliver a comprehensive analysis including:
      1. How realistic their day looks (Workload balance).
      2. Specific conflicts or tight transitions.
      3. Which tasks are dependencies for upcoming meetings.
      4. Recommendations on what to postpone if they are overbooked.
      5. A clear, actionable daily execution plan.
    `,
  });

  return result.output!;
}
