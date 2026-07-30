'use server';

/**
 * @fileOverview Deep schedule analysis flow using MythoMax-L2-13b via OpenRouter.
 */

export type AnalysisOutput = {
  todayOverview: string;
  priorityRecommendations: string[];
  conflictAlerts: string[];
  upcomingDeadlines: string[];
  availableSlots: string[];
  dailyPlan: {
    time: string;
    activity: string;
    isTask: boolean;
  }[];
  generalRecommendation: string;
};

export async function analyzeFullSchedule(appointments: any[], tasks: any[], userContext?: string): Promise<AnalysisOutput> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  const prompt = `
    You are a world-class productivity consultant. Analyze the user's current workload:
    
    Appointments: ${JSON.stringify(appointments)}
    Tasks: ${JSON.stringify(tasks)}
    Current Date: ${new Date().toISOString()}
    User Context: ${userContext || 'General analysis'}
    
    Return ONLY a valid JSON object with this structure:
    {
      "todayOverview": "string",
      "priorityRecommendations": ["string"],
      "conflictAlerts": ["string"],
      "upcomingDeadlines": ["string"],
      "availableSlots": ["string"],
      "dailyPlan": [{"time": "HH:mm", "activity": "string", "isTask": boolean}],
      "generalRecommendation": "string"
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
    console.error("Failed to parse AI analysis:", content);
    throw new Error("Invalid response from AI model");
  }
}
