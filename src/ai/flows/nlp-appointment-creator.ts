'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NLPAppointmentCreatorInputSchema = z.string();
export type NLPAppointmentCreatorInput = z.infer<typeof NLPAppointmentCreatorInputSchema>;

const NLPAppointmentCreatorOutputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  durationMinutes: z.number().int().default(60),
  attendees: z.array(z.string()).optional(),
  allDay: z.boolean().default(false),
});
export type NLPAppointmentCreatorOutput = z.infer<typeof NLPAppointmentCreatorOutputSchema>;

const nlpPrompt = ai.definePrompt({
  name: 'nlpAppointmentCreatorPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: NLPAppointmentCreatorInputSchema },
  output: { schema: NLPAppointmentCreatorOutputSchema },
  prompt: `
    You are an AI assistant specializing in parsing appointment requests. 
    Extract information from the following input: "{{{this}}}"
    Today's date: ${new Date().toISOString().split('T')[0]}
  `,
});

export async function nlpAppointmentCreator(input: NLPAppointmentCreatorInput): Promise<NLPAppointmentCreatorOutput> {
  const { output } = await nlpPrompt(input);
  if (!output) {
    return {
        title: "New Appointment",
        date: new Date().toISOString().split('T')[0],
        durationMinutes: 60,
        allDay: false
    };
  }
  return output;
}
