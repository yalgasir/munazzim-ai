'use server';

/**
 * @fileOverview AI Flow for intent-based schedule creation.
 * Automatically classifies natural language into appointments, tasks, or both.
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
  intent: 'appointment' | 'task' | 'both';
  appointment?: {
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    participants?: string[];
  };
  tasks?: z.infer<typeof GeneratedTaskSchema>[];
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
    
    TASK: 
    1. Identify if the user wants to create an Appointment (meeting, visit, event), a Task (to-do, report, reminder), or BOTH.
    2. Extract all details.
    
    Rules:
    - If the input is about a specific time/place/meeting, it's an Appointment.
    - If it's an action item or deadline without a fixed start/end time, it's a Task.
    - If it contains multiple distinct actions (e.g. "Meet X then write Y"), it's both.
    
    Return ONLY a valid JSON object:
    {
      "intent": "appointment" | "task" | "both",
      "appointment": {
        "title": "string",
        "description": "string",
        "date": "YYYY-MM-DD",
        "startTime": "HH:mm",
        "endTime": "HH:mm",
        "location": "string"
      },
      "tasks": [
        { "description": "string", "priority": "High/Medium/Low", "category": "General", "dueDate": "YYYY-MM-DD" }
      ],
      "conflictWarning": "string (optional if schedule conflict detected)"
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

    return {
      intent: parsed.intent || 'task',
      appointment: (parsed.intent === 'appointment' || parsed.intent === 'both') ? {
        title: parsed.appointment?.title || "New Appointment",
        description: parsed.appointment?.description || "",
        date: parsed.appointment?.date || input.currentDate.split('T')[0],
        startTime: parsed.appointment?.startTime || "09:00",
        endTime: parsed.appointment?.endTime || "10:00",
        location: parsed.appointment?.location || ""
      } : undefined,
      tasks: (parsed.intent === 'task' || parsed.intent === 'both') ? (parsed.tasks || []) : undefined,
      conflictWarning: parsed.conflictWarning || ""
    };
  } catch (e) {
    console.error("AI Create Error:", e);
    throw new Error("Failed to process request.");
  }
}
