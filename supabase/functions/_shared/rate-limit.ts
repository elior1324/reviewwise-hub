/**
 * _shared/rate-limit.ts
 *
 * Shared rate-limiting utility for AI/LLM Edge Functions.
 *
 * Uses the `ai_rate_limit_check` SECURITY DEFINER function which atomically
 * increments a usage counter and returns whether the call is allowed.
 *
 * Usage in any Edge Function:
 *
 *   import { checkAiRateLimit } from "../_shared/rate-limit.ts";
 *
 *   const limitResult = await checkAiRateLimit(adminClient, userId, "generate-ai-report");
 *   if (!limitResult.allowed) {
 *     return limitResult.response!;   // pre-built 429 Response
 *   }
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitResult {
  /** Whether the call is within the daily limit */
  allowed:   boolean;
  /** Calls remaining today after this one (0 if blocked) */
  remaining: number;
  /** Total calls used today */
  used:      number;
  /** Pre-built 429 Response to return immediately when !allowed */
  response?: Response;
}

/**
 * Check whether `userId` may call `functionName` once more today.
 *
 * @param adminClient  A Supabase client initialised with the SERVICE ROLE key
 * @param userId       The authenticated user's UUID
 * @param functionName Must match a row in ai_function_limits (e.g. "generate-ai-report")
 * @param corsHeaders  CORS headers to include in the 429 response
 */
export async function checkAiRateLimit(
  adminClient:  SupabaseClient,
  userId:       string,
  functionName: string,
  corsHeaders:  Record<string, string> = {},
): Promise<RateLimitResult> {
  try {
    const { data, error } = await adminClient.rpc("ai_rate_limit_check", {
      p_user_id:       userId,
      p_function_name: functionName,
    });

    if (error) {
      // If the rate-limit check fails (e.g. DB unreachable) fail open with a
      // warning rather than blocking legitimate users.
      console.warn(`[rate-limit] RPC error for ${functionName}:`, error.message);
      return { allowed: true, remaining: 1, used: 0 };
    }

    // data is an array with one row: { allowed, remaining, used }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || row.allowed) {
      return {
        allowed:   true,
        remaining: row?.remaining ?? 1,
        used:      row?.used       ?? 1,
      };
    }

    // Build a standard 429 response
    const body = JSON.stringify({
      error:   "rate_limit_exceeded",
      message: `הגעתם למגבלת השימוש היומית עבור ${functionName}. נסו שוב מחר.`,
      used:    row.used,
    });
    const response = new Response(body, {
      status:  429,
      headers: { "Content-Type": "application/json", "Retry-After": "86400", ...corsHeaders },
    });

    return { allowed: false, remaining: 0, used: row.used, response };

  } catch (err) {
    // Network/parse error — fail open
    console.warn(`[rate-limit] unexpected error for ${functionName}:`, err);
    return { allowed: true, remaining: 1, used: 0 };
  }
}
