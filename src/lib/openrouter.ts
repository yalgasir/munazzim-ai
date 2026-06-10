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
        model: process.env.OPENROUTER_MODEL || "qwen/qwen3.6-plus:free",
        messages: [
          {
            role: "system",
            content: "You are Munazzim AI, an Arabic assistant specialized in time management, task planning, and productivity."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 700
      })
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
  
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No answer generated.";
  }