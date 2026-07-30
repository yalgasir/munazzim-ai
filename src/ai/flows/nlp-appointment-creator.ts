'use server';

/**
 * @fileOverview Quick NLP parser for appointment quick-add.
 * Uses MythoMax-L2-13b via OpenRouter.
 */

export type NLPAppointmentCreatorOutput = {
  title: string;
  description?: string;
  date: string;
  time?: string;
  durationMinutes: number;
  attendees?: string[];
  allDay: boolean;
};

export async function nlpAppointmentCreator(input: string): Promise<NLPAppointmentCreatorOutput> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  const prompt = `
    Extract appointment details from this text: "${input}"
    Today's date is ${new Date().toISOString().split('T')[0]}.
    
    Return ONLY a JSON object:
    {
      "title": "string",
      "description": "string",
      "date": "YYYY-MM-DD",
      "time": "HH:mm",
      "durationMinutes": number,
      "attendees": ["string"],
      "allDay": boolean
    }
  `;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Munazzim App',
    },
    body: JSON.stringify({
      model: 'gryphe/mythomax-l2-13b',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch (e) {
    return {
      title: "New Appointment",
      date: new Date().toISOString().split('T')[0],
      durationMinutes: 60,
      allDay: false
    };
  }
}
