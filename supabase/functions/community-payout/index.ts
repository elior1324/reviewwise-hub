/**
 * community-payout (Deprecated)
 *
 * ReviewHub no longer runs any community vault / monetary payout distribution.
 * This legacy function is intentionally disabled.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async () => {
  return new Response(
    JSON.stringify({
      error: "DEPRECATED",
      message: "Community payout was removed in the B2B pivot.",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
});
