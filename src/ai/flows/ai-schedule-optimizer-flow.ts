'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Deep schedule analysis flow.
 */

const AnalysisInputSchema = z.object({
  appointments: z.array(z.any()),
  tasks: z.array(z.any()),
  currentDate: z.string(),
});

const AnalysisOutputSchema = z.object({
  todayOverview: z.string(),
  priorityRecommendations: z.array(z.string()),
  conflictAlerts: z.array(z.string()),
  upcomingDeadlines: z.array(z.string()),
  availableSlots: z.array(z.string()),
  dailyPlan: z.array(z.object({
    time: z.string(),
    activity: z.string(),
    isTask: z.boolean()
  })),
  generalRecommendation: z.string()
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

export async function analyzeFullSchedule(appointments: any[], tasks: any[]): Promise<AnalysisOutput> {
  const currentDate = new Date().toISOString();
  
  const result = await ai.generate({
    prompt: `
      You are an expert productivity coach. Analyze the following user schedule:
      
      Appointments: ${JSON.stringify(appointments)}
      Tasks: ${JSON.stringify(tasks)}
      Current Date: ${currentDate}
      
      Provide a deep analysis. Identify conflicts, prioritize tasks based on deadlines and importance, 
      and create a suggested hourly plan for today.
      BE CONCISE but thorough.
    `,
    model: 'googleai/gemini-1.5-flash',
    output: { schema: AnalysisOutputSchema }
  });

  return result.output!;
}
