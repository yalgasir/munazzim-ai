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
  finishReason: string | null;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
  responseTimeMs: number;
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
  process.env.MUNAZZIM_LAB_TIMEOUT_MS || 120000
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
  const startedAt = Date.now();
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
          ? {
              response_format: options.jsonSchema
                ? {
                    type: 'json_schema',
                    json_schema: {
                      name: 'munazzim_canonical_response',
                      strict: true,
                      schema: options.jsonSchema,
                    },
                  }
                : { type: 'json_object' },
            }
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
  const responseTimeMs = Date.now() - startedAt;
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
    finishReason: typeof data?.choices?.[0]?.finish_reason === 'string'
      ? data.choices[0].finish_reason
      : null,
    usage: {
      promptTokens: typeof data?.usage?.prompt_tokens === 'number' ? data.usage.prompt_tokens : null,
      completionTokens: typeof data?.usage?.completion_tokens === 'number' ? data.usage.completion_tokens : null,
      totalTokens: typeof data?.usage?.total_tokens === 'number' ? data.usage.total_tokens : null,
    },
    responseTimeMs,
  };
}

async function askOllama(
  options: AskMunazzimAIOptions
): Promise<MunazzimAIResponse> {
  const startedAt = Date.now();
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
  const responseTimeMs = Date.now() - startedAt;
  const text = cleanModelText(data?.message?.content);

  if (!text) {
    throw new Error('Ollama returned an empty response.');
  }

  return {
    text,
    provider: 'ollama',
    providerLabel: 'Local Ollama Fallback',
    model: OLLAMA_MODEL,
    finishReason: typeof data?.done_reason === 'string' ? data.done_reason : null,
    usage: {
      promptTokens: typeof data?.prompt_eval_count === 'number' ? data.prompt_eval_count : null,
      completionTokens: typeof data?.eval_count === 'number' ? data.eval_count : null,
      totalTokens: typeof data?.prompt_eval_count === 'number' && typeof data?.eval_count === 'number'
        ? data.prompt_eval_count + data.eval_count
        : null,
    },
    responseTimeMs,
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
  const cleaned = cleanModelText(text)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}
