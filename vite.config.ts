/**
 * vite.config.ts
 *
 * SECURITY FIX #5 (part 2) — Add Content Security Policy + hardening headers.
 *
 * VULNERABILITY (before fix):
 *   No security headers were configured. Combined with sessionStorage tokens,
 *   a successful XSS injection (e.g. via review text rendered without
 *   sanitisation, or a compromised npm package) could:
 *     - Read session tokens from sessionStorage
 *     - Make authenticated Supabase requests on the user's behalf
 *     - Exfiltrate data to an attacker-controlled server
 *
 * FIX:
 *   CSP blocks inline script execution and restricts resource origins.
 *   Headers applied both in dev server AND production (via _headers file — see below).
 *
 * PRODUCTION NOTE:
 *   Vite's `server.headers` only applies to the DEVELOPMENT server.
 *   For production (Netlify / Vercel / Cloudflare Pages), also create
 *   a `public/_headers` file — see SECURITY_HEADERS.md generated alongside this.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ── CSP Policy ────────────────────────────────────────────────────────────────
// Adjust src allowlists as new third-party services are added.
const CSP = [
  "default-src 'self'",
  // Scripts: only from self + Cloudflare Turnstile + Stripe.js
  "script-src 'self' https://challenges.cloudflare.com https://js.stripe.com",
  // Styles: self + inline styles needed by Tailwind/shadcn
  "style-src 'self' 'unsafe-inline'",
  // Images: self + Supabase storage + data URIs for avatars
  "img-src 'self' data: blob: https://*.supabase.co https://supabase.co",
  // Fonts: self only (Tailwind uses system fonts)
  "font-src 'self'",
  // Frames: only Stripe and Turnstile iframes
  "frame-src https://challenges.cloudflare.com https://js.stripe.com",
  // Fetch/XHR: Supabase API + Stripe + Cloudflare
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://challenges.cloudflare.com",
  // Objects: block Flash / Java plugins
  "object-src 'none'",
  // No iframes of this site by others (clickjacking protection)
  "frame-ancestors 'self'",
  // Upgrade insecure requests in production
  "upgrade-insecure-requests",
].join("; ");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      // ── Security Headers (dev server) ────────────────────────────────────
      "Content-Security-Policy": CSP,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

/**
 * ── PRODUCTION: create public/_headers (Netlify / Cloudflare Pages) ──────────
 *
 * Copy the block below into a file at:
 *   reviewwise-hub/public/_headers
 *
 * /*
 *   Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self'; frame-src https://challenges.cloudflare.com https://js.stripe.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://challenges.cloudflare.com; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests
 *   X-Content-Type-Options: nosniff
 *   X-Frame-Options: SAMEORIGIN
 *   X-XSS-Protection: 1; mode=block
 *   Referrer-Policy: strict-origin-when-cross-origin
 *   Permissions-Policy: camera=(), microphone=(), geolocation=()
 *   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
 */
