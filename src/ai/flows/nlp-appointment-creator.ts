'use server';

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

export async function nlpAppointmentCreator(input: NLPAppointmentCreatorInput): Promise<NLPAppointmentCreatorOutput> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  const currentDate = new Date().toISOString().split('T')[0];
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gryphe/mythomax-l2-13b",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specializing in parsing appointment requests. Extract information and return only valid JSON. Today's date: ${currentDate}. Response MUST be JSON with fields: title, description, date, time, durationMinutes, allDay.`
        },
        {
          role: "user",
          content: input
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error('OpenRouter connection failed');
  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  
  return {
    title: result.title || "New Appointment",
    description: result.description,
    date: result.date || currentDate,
    time: result.time,
    durationMinutes: result.durationMinutes || 60,
    allDay: !!result.allDay
  };
}

 