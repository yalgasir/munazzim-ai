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
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables.');
  }

  // Ensure data is clean for the prompt
  const sanitizedApps = appointments.map(a => ({
    title: a.title || 'Untitled',
    date: a.date || '',
    time: a.time || ''
  }));

  const sanitizedTasks = tasks.map(t => ({
    description: t.description || 'Untitled',
    priority: t.priority || 'Medium',
    status: t.isCompleted ? 'Completed' : 'Pending'
  }));

  const prompt = `
    You are a world-class productivity consultant. Analyze the user's current workload:
    
    Appointments: ${JSON.stringify(sanitizedApps)}
    Tasks: ${JSON.stringify(sanitizedTasks)}
    Current Date: ${new Date().toISOString().split('T')[0]}
    User Context: ${userContext || 'General analysis'}
    
    Return ONLY a valid JSON object with this exact structure:
    {
      "todayOverview": "summary string",
      "priorityRecommendations": ["item1", "item2"],
      "conflictAlerts": ["alert1"],
      "upcomingDeadlines": ["deadline1"],
      "availableSlots": ["slot1"],
      "dailyPlan": [{"time": "HH:mm", "activity": "string", "isTask": boolean}],
      "generalRecommendation": "final tip string"
    }
  `;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Munazzim Productivity Suite',
      },
      body: JSON.stringify({
        model: 'gryphe/mythomax-l2-13b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from AI");

    const parsed = JSON.parse(content);
    
    // Ensure all required fields exist to prevent UI crashes
    return {
      todayOverview: parsed.todayOverview || "No overview available.",
      priorityRecommendations: parsed.priorityRecommendations || [],
      conflictAlerts: parsed.conflictAlerts || [],
      upcomingDeadlines: parsed.upcomingDeadlines || [],
      availableSlots: parsed.availableSlots || [],
      dailyPlan: parsed.dailyPlan || [],
      generalRecommendation: parsed.generalRecommendation || "Keep up the good work!"
    };
  } catch (e) {
    console.error("AI Analysis Error:", e);
    throw new Error("Failed to generate schedule analysis. Please check your API key.");
  }
}
