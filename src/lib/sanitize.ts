/**
 * src/lib/sanitize.ts
 *
 * Lightweight client-side sanitization helpers.
 * These run before data reaches the database and before URLs are rendered
 * as anchor hrefs, providing a defence-in-depth layer on top of React's
 * built-in JSX escaping and Supabase's parameterised queries.
 *
 * ─ sanitizeUrl ────────────────────────────────────────────────────────────
 *   Blocks javascript:, data:, vbscript:, and other non-http(s) schemes that
 *   could be used for XSS via <a href="...">. Returns an empty string for
 *   any URL that doesn't pass validation so the caller can skip rendering.
 *
 * ─ sanitizeText ───────────────────────────────────────────────────────────
 *   Strips raw HTML tags and common HTML entities from freeform user input
 *   (review text, business description, etc.) before it is written to the DB.
 *   React already escapes on render, but scrubbing at the write path means
 *   even a future server-rendered or email-forwarded path stays clean.
 */

// ── sanitizeUrl ────────────────────────────────────────────────────────────────

/**
 * Returns a safe URL string, or "" if the URL contains a dangerous scheme.
 *
 * Rules (case-insensitive, whitespace-stripped):
 *  • Allows:   http://...  https://...
 *  • Allows:   bare domains (no scheme) → prepended with "https://"
 *  • Blocks:   javascript:  data:  vbscript:  blob:  file:  and anything else
 *              that isn't a recognised http(s) prefix
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return "";

  // Collapse whitespace and strip zero-width / invisible characters that are
  // sometimes used to disguise dangerous scheme names.
  const trimmed = url.trim().replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");

  if (!trimmed) return "";

  // Blocked schemes — checked before the http(s) allowlist so that strings like
  // "  javascript:alert(1)" (leading spaces) are still caught.
  const lc = trimmed.toLowerCase();
  const BLOCKED_SCHEMES = [
    "javascript:",
    "data:",
    "vbscript:",
    "blob:",
    "file:",
    "about:",
  ];
  for (const scheme of BLOCKED_SCHEMES) {
    if (lc.startsWith(scheme)) return "";
  }

  // Already has a valid http(s) scheme
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Bare domain (e.g. "example.com") → upgrade to https://
  return `https://${trimmed}`;
}

// ── sanitizeText ───────────────────────────────────────────────────────────────

const HTML_TAG_RE    = /<[^>]*>/g;
const HTML_ENTITY_RE = /&(?:#\d+|#x[\da-f]+|[a-z]{2,8});/gi;

/**
 * Strips HTML tags and entities from freeform text and trims whitespace.
 *
 * @param input     Raw user input (review body, description, etc.)
 * @param maxLength Hard cap on character count (default 5000).
 *                  Enforced AFTER stripping so the limit reflects visible content.
 */
export function sanitizeText(input: string, maxLength = 5000): string {
  return input
    .replace(HTML_TAG_RE, "")        // remove <any tag>
    .replace(HTML_ENTITY_RE, " ")    // turn &lt; &amp; &#x3c; etc. into spaces
    .replace(/\s+/g, " ")            // collapse runs of whitespace
    .trim()
    .slice(0, maxLength);
}
