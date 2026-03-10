/**
 * src/test/unit/auth-errors.test.ts
 *
 * Unit tests for src/lib/auth-errors.ts — translateAuthError().
 * Verifies every mapped Supabase error message and the fallback.
 *
 * Run: npm test -- auth-errors
 */
import { describe, it, expect } from "vitest";
import { translateAuthError } from "@/lib/auth-errors";

describe("translateAuthError()", () => {
  // ── Known Supabase error messages ─────────────────────────────────────────
  const cases: [string, RegExp][] = [
    ["Invalid login credentials",    /פרטי התחברות שגויים/],
    ["Email not confirmed",          /אימות/],
    ["User already registered",      /כבר רשומה/],
    ["Email address is invalid",     /אינה תקינה/],
    ["Password should be at least",  /לפחות 8 תווים/],
    ["signup is disabled",           /מושבתת/],
    ["Email provider is disabled",   /מושבתת/],
    ["auth hook error",              /auth hook/],
    ["rate limit exceeded",          /יותר מדי ניסיונות/],
    ["Too many requests",            /יותר מדי ניסיונות/],
    ["network error",                /שגיאת רשת/],
    ["fetch failed",                 /שגיאת רשת/],
  ];

  it.each(cases)('maps "%s" to a Hebrew message', (input, pattern) => {
    expect(translateAuthError(input)).toMatch(pattern);
  });

  // ── Case-insensitive matching ──────────────────────────────────────────────
  it("is case-insensitive", () => {
    expect(translateAuthError("INVALID LOGIN CREDENTIALS")).toMatch(/פרטי התחברות שגויים/);
  });

  // ── Fallback for unknown messages ─────────────────────────────────────────
  it("returns the raw message for unknown errors (so devs can see it)", () => {
    const unknown = "some totally unknown supabase error xyz";
    expect(translateAuthError(unknown)).toBe(unknown);
  });

  // ── Empty / null-ish input ─────────────────────────────────────────────────
  it("returns a fallback for empty string", () => {
    expect(translateAuthError("")).toMatch(/לא ידועה/);
  });
});
