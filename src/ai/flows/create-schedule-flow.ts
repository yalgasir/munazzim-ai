'use server';

/**
 * @fileOverview AI Flow for parsing natural language into highly structured appointments and tasks.
 * Uses MythoMax-L2-13b via OpenRouter.
 */

import { z } from 'zod';

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
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
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

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Munazzim App',
      },
      body: JSON.stringify({
        model: 'gryphe/mythomax-l2-13b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error("OpenRouter error");

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content);

    // Ensure structure is safe for frontend
    return {
      appointment: {
        title: parsed.appointment?.title || "New Appointment",
        description: parsed.appointment?.description || "",
        date: parsed.appointment?.date || input.currentDate.split('T')[0],
        startTime: parsed.appointment?.startTime || "09:00",
        endTime: parsed.appointment?.endTime || "10:00",
        location: parsed.appointment?.location || "",
        participants: parsed.appointment?.participants || [],
        objectives: parsed.appointment?.objectives || [],
        agenda: parsed.appointment?.agenda || []
      },
      tasks: parsed.tasks || [],
      missingInformation: parsed.missingInformation || [],
      conflictWarning: parsed.conflictWarning || ""
    };
  } catch (e) {
    console.error("AI Create Error:", e);
    throw new Error("Failed to process your request. Please check your prompt and try again.");
  }
}
