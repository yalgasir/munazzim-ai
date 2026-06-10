
export async function askMunazzimAI(prompt: string) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://huggingface.co/spaces/yalgasir/ai-time-manager",
        "X-Title": "Munazzim AI Time Manager"
      },
      body: JSON.stringify({
        model: "gryphe/mythomax-l2-13b",
        messages: [
          {
            role: "system",
            content: "أنت مساعد 'منظّم' الذكي، خبير في إدارة الوقت والإنتاجية. أجب دائماً باللغة العربية بأسلوب مهني وواضح."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 800
      })
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
  
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "عذراً، لم أتمكن من توليد رد حالياً.";
  }
