import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API Key is missing" },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://munazzim.app",
        "X-Title": "Munazzim App",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "أنت 'منظّم'، مساعد ذكاء اصطناعي خبير في إدارة الوقت والإنتاجية. أجب دائماً باللغة العربية. ركز على تقديم نصائح عملية، حل تعارضات المواعيد، وترتيب الأولويات. إذا سألك المستخدم عن ترتيب جدول، قدم له تحليلاً منطقياً. اجعل ردودك ودودة ومهنية وبدون تنسيقات Markdown معقدة.",
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
      console.error("OpenRouter API Error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "خطأ في الاتصال بالنموذج" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json({ reply: "عذراً، لم أتمكن من توليد رد حالياً." });
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json(
      {
        error: error?.message || "حدث خطأ غير متوقع",
      },
      { status: 500 }
    );
  }
}
