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
  // Allow framing from self + Lovable preview panel (*.lovable.app).
  // X-Frame-Options is omitted in server.headers because it cannot whitelist
  // specific external origins — CSP frame-ancestors handles this instead.
  "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev https://lovable.dev",
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
      // X-Frame-Options intentionally omitted — CSP frame-ancestors above handles
      // clickjacking protection and supports the *.lovable.app whitelist.
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
  build: {
    // ── SECURITY: never expose source maps in production builds ─────────────
    // Source maps would reveal the original TypeScript source to anyone who
    // opens DevTools, making reverse-engineering and vulnerability discovery
    // significantly easier for attackers.
    sourcemap: false,
  },
}));

/**
 * ── PRODUCTION: public/_headers and public/_redirects ────────────────────────
 *
 * Both files now exist at:
 *   reviewwise-hub/public/_headers   ← all security headers + HSTS
 *   reviewwise-hub/public/_redirects ← SPA routing fallback
 *
 * Netlify/Lovable picks these up automatically at deploy time.
 * No manual copy needed.
 *
 * ── One remaining manual step ────────────────────────────────────────────────
 * Enable "Force HTTPS" in your Lovable project settings:
 *   Lovable Dashboard → Project → Settings → Domain → Force HTTPS (toggle ON)
 *
 * This redirects all http:// traffic to https:// at the CDN edge (301).
 * The HSTS header in _headers then instructs browsers to skip HTTP entirely.
 *
 * ── TLS version enforcement ───────────────────────────────────────────────────
 * TLS 1.0 and 1.1 are disabled automatically by Netlify CDN (no config needed).
 * TLS 1.2 and TLS 1.3 are the only accepted protocols.
 * Verify at: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
 *
 * ── SSL certificate ───────────────────────────────────────────────────────────
 * Provisioned and auto-renewed every 60 days by Let's Encrypt via Lovable.
 * No action required.
 */
