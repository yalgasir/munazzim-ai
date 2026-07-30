'use server';

/**
 * @fileOverview AI Flow for parsing natural language into highly structured appointments and tasks.
 * Uses MythoMax-L2-13b via OpenRouter.
 */

import { z } from 'genkit';

const GeneratedTaskSchema = z.object({
  description: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  category: z.enum(['Preparation', 'Follow-up', 'General']),
  dueDate: z.string().optional(),
});

export type CreateScheduleInput = {
  userInput: string;
  currentDate: string;
};

export type CreateScheduleOutput = {
  appointment: {
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    participants?: string[];
    objectives?: string[];
    agenda?: string[];
  };
  tasks: z.infer<typeof GeneratedTaskSchema>[];
  missingInformation?: string[];
  conflictWarning?: string;
};

export async function createSchedule(input: CreateScheduleInput): Promise<CreateScheduleOutput> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  const prompt = `
    You are an elite executive assistant. 
    Current Date: ${input.currentDate}
    User Input: "${input.userInput}"
    
    Task: Extract meeting details and generate sub-tasks.
    Return ONLY a valid JSON object with the following structure:
    {
      "appointment": {
        "title": "string",
        "description": "string",
        "date": "YYYY-MM-DD",
        "startTime": "HH:mm",
        "endTime": "HH:mm",
        "location": "string (optional)",
        "participants": ["string"],
        "objectives": ["string"],
        "agenda": ["string"]
      },
      "tasks": [
        { "description": "string", "priority": "High/Medium/Low", "category": "Preparation/Follow-up/General", "dueDate": "YYYY-MM-DD" }
      ],
      "missingInformation": ["string"],
      "conflictWarning": "string (optional)"
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
    console.error("Failed to parse AI response:", content);
    throw new Error("Invalid response from AI model");
  }
}
