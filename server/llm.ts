/**
 * Minimal JSON-generation client for an OpenAI-compatible endpoint.
 *
 * The CourseGlide advisor treats the model as an optional language layer: it
 * translates a student's sentence into fixed search parameters and nothing
 * else. Every call is time-boxed and every failure returns null, so the
 * deterministic advisor keeps working when the provider is slow, rate limited,
 * out of credits, or offline.
 *
 * A primary model plus an ordered fallback chain is used for a live demo: if the
 * first model times out, is rate limited, or answers with something that is not
 * JSON, the next model is tried within one overall budget.
 */

export interface LlmConfig {
  provider: 'nvidia';
  apiKey: string;
  baseUrl: string;
  /** Primary model; also the one the UI advertises. */
  model: string;
  /** Ordered models tried after the primary fails. Never empty. */
  models: string[];
}

export const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3.5-bolt-e4b';

/**
 * Tried in order. All are served by integrate.api.nvidia.com with the same
 * OpenAI-compatible chat-completions + json_object contract, so no other code
 * changes when the primary model is unavailable.
 */
export const DEFAULT_NVIDIA_FALLBACK_MODELS = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  'stepfun-ai/step-5-preview',
];

function splitModelList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function resolveLlmConfig(): LlmConfig | null {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return null;

  const primary = process.env.NVIDIA_MODEL?.trim() || DEFAULT_NVIDIA_MODEL;
  const fallbacks = process.env.NVIDIA_FALLBACK_MODELS
    ? splitModelList(process.env.NVIDIA_FALLBACK_MODELS)
    : DEFAULT_NVIDIA_FALLBACK_MODELS;

  const models = [primary, ...fallbacks].filter(
    (model, index, list) => list.indexOf(model) === index
  );

  return {
    provider: 'nvidia',
    apiKey,
    baseUrl: process.env.NVIDIA_BASE_URL?.trim() || 'https://integrate.api.nvidia.com/v1',
    model: primary,
    models: models.slice(0, 4),
  };
}

export interface LlmJsonRequest {
  system: string;
  user: string;
  maxOutputTokens?: number;
  /** Time allowed for a single model attempt. */
  timeoutMs?: number;
  /** Time allowed for the whole chain, including retries. */
  totalTimeoutMs?: number;
}

export interface LlmJsonResult {
  data: Record<string, unknown>;
  /** The model that actually answered, which may be a fallback. */
  model: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
  }>;
}

/** Tolerates code fences and leading prose around a single JSON object. */
export function parseJsonLoose(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const withoutFences = raw.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(withoutFences.slice(start, end + 1));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function attemptModel(
  config: LlmConfig,
  model: string,
  request: LlmJsonRequest,
  timeoutMs: number
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
        temperature: 0.1,
        top_p: 0.7,
        max_tokens: request.maxOutputTokens ?? 400,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Status only: never log prompt or key material.
      console.warn(`Advisor model ${model} unavailable (HTTP ${res.status}); trying next.`);
      return null;
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const message = data.choices?.[0]?.message;
    const text =
      typeof message?.content === 'string' && message.content.trim()
        ? message.content
        : typeof message?.reasoning_content === 'string'
        ? message.reasoning_content
        : '';
    const parsed = parseJsonLoose(text);
    if (!parsed) {
      console.warn(`Advisor model ${model} returned no usable JSON; trying next.`);
    }
    return parsed;
  } catch (err) {
    console.warn(
      `Advisor model ${model} failed, trying next:`,
      err instanceof Error ? err.name : 'unknown error'
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateLlmJson(
  config: LlmConfig,
  request: LlmJsonRequest
): Promise<LlmJsonResult | null> {
  const perModelTimeout = request.timeoutMs ?? 7_000;
  // The chain is bounded so a slow provider cannot hold the advisor open: once
  // the budget is spent the deterministic rules answer is returned instead.
  const deadline = Date.now() + (request.totalTimeoutMs ?? 16_000);

  for (let index = 0; index < config.models.length; index += 1) {
    const model = config.models[index];
    const remaining = deadline - Date.now();
    if (remaining < 900) break;

    const parsed = await attemptModel(config, model, request, Math.min(perModelTimeout, remaining));
    if (parsed) {
      if (index > 0) {
        console.info(`Advisor language layer answered with fallback model ${model}.`);
      }
      return { data: parsed, model };
    }
  }

  return null;
}
