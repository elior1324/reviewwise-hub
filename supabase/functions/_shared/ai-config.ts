/**
 * _shared/ai-config.ts
 *
 * Central configuration for all AI/LLM calls in ReviewHub.
 * ALL edge functions MUST import model identifiers from here — never hardcode.
 *
 * Model selection guide:
 *   FAST    → cheap, low-latency classification (spam, short decisions)
 *   SMART   → quality-critical tasks (reports, summaries, compliance)
 *   STRUCT  → function-calling / structured JSON output
 */

export const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Canonical model identifiers — update here to upgrade the entire platform */
export const AI_MODELS = {
  /** Fast, cheap — anomaly classification, quick labels */
  fast:   "google/gemini-2.0-flash",
  /** High-quality — business reports, summaries, compliance decisions */
  smart:  "google/gemini-2.5-flash",
  /** Same as smart; alias used when calling with function/tool schemas */
  struct: "google/gemini-2.5-flash",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export interface AiMessage {
  role:    "system" | "user" | "assistant";
  content: string;
}

export interface AiCallOptions {
  model:        AiModel;
  messages:     AiMessage[];
  temperature?: number;   // default 0.3
  maxTokens?:   number;   // default 1500
  tools?:       unknown[];
  toolChoice?:  unknown;
  stream?:      boolean;
}

interface AiCallResult {
  ok:     boolean;
  status: number;
  data?:  unknown;
  text?:  string;
}

/**
 * Execute a single AI completion request via the Lovable gateway.
 * – For streaming calls, `data` is absent; the caller reads `response.body`.
 * – For tool-use calls, parse with `extractToolArgs()`.
 */
export async function callAi(
  apiKey:  string,
  options: AiCallOptions,
): Promise<AiCallResult> {
  const body: Record<string, unknown> = {
    model:       options.model,
    messages:    options.messages,
    temperature: options.temperature ?? 0.3,
    max_tokens:  options.maxTokens  ?? 1500,
  };

  if (options.tools)      body.tools       = options.tools;
  if (options.toolChoice) body.tool_choice = options.toolChoice;
  if (options.stream)     body.stream      = true;

  const res = await fetch(AI_GATEWAY, {
    method:  "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, text };
  }

  if (options.stream) {
    return { ok: true, status: 200 };
  }

  const data = await res.json();
  return { ok: true, status: 200, data };
}

/** Pull the assistant text from a standard (non-streaming) completion response. */
export function extractContent(data: unknown): string | null {
  const d = data as { choices?: Array<{ message?: { content?: string } }> };
  return d?.choices?.[0]?.message?.content?.trim() ?? null;
}

/** Pull parsed JSON arguments from the first tool-call in the response. */
export function extractToolArgs(data: unknown): unknown | null {
  const d = data as {
    choices?: Array<{
      message?: {
        tool_calls?: Array<{ function?: { arguments?: string } }>;
      };
    }>;
  };
  const raw = d?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Standard error response shapes for gateway failures */
export function aiGatewayErrorResponse(
  status: number,
  corsHeaders: Record<string, string>,
): Response | null {
  if (status === 429) {
    return new Response(
      JSON.stringify({ error: "ai_rate_limit", message: "מגבלת קצב AI חרגה — נסו שוב מאוחר יותר." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (status === 402) {
    return new Response(
      JSON.stringify({ error: "ai_payment_required", message: "נדרש תשלום לשירות AI." }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return null;
}
