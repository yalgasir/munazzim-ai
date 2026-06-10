import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "API Key missing" },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        messages: [
          {
            role: "system",
            content: "أنت 'منظّم'، مساعد ذكاء اصطناعي خبير في إدارة الوقت والإنتاجية. أجب دائماً باللغة العربية. اجعل ردودك ودودة ومهنية وبدون تنسيقات Markdown معقدة.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || "Error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    return NextResponse.json({ reply: reply || "عذراً، لم أتمكن من توليد رد." });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}





