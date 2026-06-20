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
            content: "You are 'Munazzim AI', a highly skilled productivity and time management expert. Always respond in professional and clear English."
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
    return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response at this time.";
  }

 