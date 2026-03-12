/**
 * commission-splitter (Deprecated)
 *
 * ReviewHub pivoted to a pure B2B SaaS reputation platform.
 *
 * - No user/reviewer monetary incentives.
 * - No cashback.
 * - No payout / withdrawal flows.
 *
 * This legacy function is intentionally disabled to prevent accidental use.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async () => {
  return new Response(
    JSON.stringify({
      error: "DEPRECATED",
      message: "This function was disabled during the B2B pivot.",
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
