/**
 * Munazzim AI provider gateway.
 *
 * This is the ONLY source file that knows how to call Qwen or Ollama.
 * All product features call askMunazzimAI() instead of talking to a model
 * directly.
 */

export type MunazzimAIProvider = 'qwen' | 'ollama';

export type MunazzimAIResponse = {
  text: string;
  provider: MunazzimAIProvider;
  providerLabel: string;
  model: string;
};

export type AskMunazzimAIOptions = {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  jsonSchema?: Record<string, unknown>;
};

const LAB_AI_URL =
  process.env.MUNAZZIM_LAB_AI_URL ||
  'http://192.168.0.5/v1/chat/completions';

const LAB_MODEL =
  process.env.MUNAZZIM_LAB_MODEL ||
  '/models/Qwen3.5-2B-BF16.gguf';

const OLLAMA_URL =
  process.env.MUNAZZIM_OLLAMA_URL ||
  'http://127.0.0.1:11434/api/chat';

const OLLAMA_MODEL =
  process.env.MUNAZZIM_OLLAMA_MODEL ||
  'llama3.2:3b';

const LAB_TIMEOUT_MS = Number(
  process.env.MUNAZZIM_LAB_TIMEOUT_MS || 60000
);

const OLLAMA_TIMEOUT_MS = Number(
  process.env.MUNAZZIM_OLLAMA_TIMEOUT_MS || 180000
);

function cleanModelText(value: unknown): string {
  return String(value ?? '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^Assistant:\s*/i, '')
    .trim();
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
}

async function askQwen(
  options: AskMunazzimAIOptions
): Promise<MunazzimAIResponse> {
  const response = await fetchWithTimeout(
    LAB_AI_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LAB_MODEL,
        messages: [
          {
            role: 'system',
            content: options.system,
          },
          {
            role: 'user',
            content: options.prompt,
          },
        ],
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 700,
        ...(options.json
          ? { response_format: { type: 'json_object' } }
          : {}),
        chat_template_kwargs: {
          enable_thinking: false,
        },
      }),
    },
    LAB_TIMEOUT_MS
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Qwen error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text = cleanModelText(
    data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text
  );

  if (!text) {
    throw new Error('Qwen returned an empty response.');
  }

  return {
    text,
    provider: 'qwen',
    providerLabel: 'SCI Lab Qwen',
    model: LAB_MODEL,
  };
}

async function askOllama(
  options: AskMunazzimAIOptions
): Promise<MunazzimAIResponse> {
  const body: Record<string, unknown> = {
    model: OLLAMA_MODEL,
    messages: [
      {
        role: 'system',
        content: options.system,
      },
      {
        role: 'user',
        content: options.prompt,
      },
    ],
    stream: false,
    keep_alive: '30m',
    options: {
      temperature: options.temperature ?? 0,
      // Local llama3.2:3b does not need very long generations for Munazzim JSON.
      // Cap fallback output so it stays responsive even when a feature asks for more.
      num_predict: Math.min(options.maxTokens ?? 700, 500),
    },
  };

  if (options.json) {
    body.format = options.jsonSchema || 'json';
  }

  const response = await fetchWithTimeout(
    OLLAMA_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    OLLAMA_TIMEOUT_MS
  );

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Ollama error ${response.status}: ${responseBody}`
    );
  }

  const data = await response.json();
  const text = cleanModelText(data?.message?.content);

  if (!text) {
    throw new Error('Ollama returned an empty response.');
  }

  return {
    text,
    provider: 'ollama',
    providerLabel: 'Local Ollama Fallback',
    model: OLLAMA_MODEL,
  };
}

export async function askMunazzimAI(
  options: AskMunazzimAIOptions
): Promise<MunazzimAIResponse> {
  try {
    const result = await askQwen(options);
    console.log(
      `Munazzim AI: ${result.providerLabel} | ${result.model}`
    );
    return result;
  } catch (qwenError) {
    console.warn(
      'Qwen unavailable. Using local Ollama fallback:',
      qwenError
    );
  }

  try {
    const result = await askOllama(options);
    console.log(
      `Munazzim AI: ${result.providerLabel} | ${result.model}`
    );
    return result;
  } catch (ollamaError) {
    console.error('Local Ollama fallback failed:', ollamaError);
    throw new Error(
      'Both Qwen and local Ollama are unavailable.'
    );
  }
}

export function parseAIJson(text: string): unknown {
  let cleaned = cleanModelText(text)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Ollama may double-escape Unicode: \\\\uXXXX instead of \\uXXXX or literal characters.
    // Fix this by replacing double backslashes before Unicode sequences with single backslashes.
    const unescaped = cleaned.replace(/\\\\u([0-9a-fA-F]{4})/g, '\\u$1');
    
    // Log if we actually made changes (for debugging)
    if (unescaped !== cleaned) {
      console.log('DEBUG: Fixed double-escaped Unicode in AI response');
    }
    
    try {
      const parsed = JSON.parse(unescaped);
      
      // Verify the parse succeeded and contains expected structure
      if (typeof parsed === 'object' && parsed !== null && 'reply' in parsed) {
        console.log('DEBUG: Successfully parsed AI JSON after Unicode fix');
      }
      
      return parsed;
    } catch {
      // Last resort: try to extract JSON block from surrounding text
      const start = unescaped.indexOf('{');
      const end = unescaped.lastIndexOf('}');

      if (start >= 0 && end > start) {
        const extracted = unescaped.slice(start, end + 1);
        return JSON.parse(extracted);
      }

      throw new Error('AI did not return valid JSON.');
    }
  }
}
