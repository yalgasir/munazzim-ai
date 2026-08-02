'use server';

/**
 * @fileOverview Deep schedule analysis flow using MythoMax-L2-13b via OpenRouter.
 * Enhanced to provide Focus Scores, Workload Status, and Smart Alerts.
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
  // Enhanced performance metrics
  focusScore: number;
  scheduleBalance: string;
  workloadStatus: 'Light' | 'Moderate' | 'Heavy';
  productivityInsight: string;
  smartAlerts: string[];
};

export async function analyzeFullSchedule(appointments: any[], tasks: any[], userContext?: string): Promise<AnalysisOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables.');
  }

  const sanitizedApps = appointments.map(a => ({
    title: a.title || 'Untitled',
    date: a.date || '',
    time: a.time || '',
    status: a.attendanceStatus || 'Upcoming'
  }));

  const sanitizedTasks = tasks.map(t => ({
    description: t.description || 'Untitled',
    priority: t.priority || 'Medium',
    status: t.status || (t.isCompleted ? 'Done' : 'Pending')
  }));

  const prompt = `
    You are a world-class executive productivity consultant. Analyze the user's workload for today and the upcoming period.
    
    Data:
    Appointments: ${JSON.stringify(sanitizedApps)}
    Tasks: ${JSON.stringify(sanitizedTasks)}
    Current Date: ${new Date().toISOString().split('T')[0]}
    User Query: ${userContext || 'Standard daily analysis'}
    
    Return ONLY a valid JSON object with this structure:
    {
      "todayOverview": "Executive summary of the day",
      "priorityRecommendations": ["Actionable step 1", "Actionable step 2"],
      "conflictAlerts": ["Conflict alert 1"],
      "upcomingDeadlines": ["Deadline 1"],
      "availableSlots": ["Free window 1"],
      "dailyPlan": [{"time": "HH:mm", "activity": "string", "isTask": boolean}],
      "generalRecommendation": "One key tip for the day",
      "focusScore": number (0-100),
      "scheduleBalance": "string describing balance",
      "workloadStatus": "Light" | "Moderate" | "Heavy",
      "productivityInsight": "Detailed insight about current trend",
      "smartAlerts": ["Detect conflicts, overloading, or missing priorities"]
    }
  `;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Munazzim AI Suite',
      },
      body: JSON.stringify({
        model: 'gryphe/mythomax-l2-13b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`AI Gateway error: ${response.statusText}`);

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI engine");

    const parsed = JSON.parse(content);
    
    return {
      todayOverview: parsed.todayOverview || "Standard operational status.",
      priorityRecommendations: parsed.priorityRecommendations || [],
      conflictAlerts: parsed.conflictAlerts || [],
      upcomingDeadlines: parsed.upcomingDeadlines || [],
      availableSlots: parsed.availableSlots || [],
      dailyPlan: parsed.dailyPlan || [],
      generalRecommendation: parsed.generalRecommendation || "Maintain steady progress.",
      focusScore: parsed.focusScore || 70,
      scheduleBalance: parsed.scheduleBalance || "Stable",
      workloadStatus: parsed.workloadStatus || "Moderate",
      productivityInsight: parsed.productivityInsight || "Tracking standard mission goals.",
      smartAlerts: parsed.smartAlerts || []
    };
  } catch (e) {
    console.error("AI Analysis Error:", e);
    throw new Error("Failed to generate performance analysis.");
  }
}
