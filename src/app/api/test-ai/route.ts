import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, message: "API route is working" });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.OPENROUTER_MODEL || "gryphe/mythomax-l2-13b";
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is missing' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { prompt } = body;
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Munazzim App",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: "You are a friendly AI assistant. Always respond in English and be concise." },
          { role: "user", content: prompt }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.error?.message || 'Failed to call OpenRouter',
          details: data 
        }, 
        { status: response.status }
      );
    }

    return NextResponse.json({
      response: data.choices?.[0]?.message?.content || 'No response content',
      modelUsed: data.model || modelName,
      raw: data
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

 