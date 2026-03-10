/**
 * src/test/unit/password-validation.test.ts
 *
 * Unit tests for src/lib/password-validation.ts
 * Tests every branch of validatePassword() including the blocklist,
 * character-repetition check, sequential-chars check, and composition rules.
 *
 * Run: npm test -- password-validation
 */
import { describe, it, expect } from "vitest";
import { validatePassword } from "@/lib/password-validation";

describe("validatePassword()", () => {
  // ── Too short ───────────────────────────────────────────────────────────────
  describe("length requirement", () => {
    it("rejects passwords shorter than 8 characters", () => {
      const r = validatePassword("Ab1");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/לפחות 8 תווים/);
    });

    it("accepts exactly 8 characters when composition is valid", () => {
      const r = validatePassword("Secure1!");
      expect(r.valid).toBe(true);
    });
  });

  // ── Common / blocklisted passwords ─────────────────────────────────────────
  describe("common password blocklist", () => {
    const blocked = ["123456", "password", "qwerty", "abc123", "password1", "admin"];
    it.each(blocked)('rejects "%s" as too common', (pw) => {
      const r = validatePassword(pw);
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/נפוצה/);
    });

    it("blocklist check is case-insensitive", () => {
      expect(validatePassword("PASSWORD").valid).toBe(false);
      expect(validatePassword("Password").valid).toBe(false);
    });
  });

  // ── Repeated characters ─────────────────────────────────────────────────────
  describe("repeated-character check", () => {
    it("rejects all-same-character passwords", () => {
      const r = validatePassword("aaaaaaaa");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/תו חוזר/);
    });

    it("rejects '11111111'", () => {
      expect(validatePassword("11111111").valid).toBe(false);
    });
  });

  // ── Sequential characters ──────────────────────────────────────────────────
  describe("sequential-character check", () => {
    it("rejects pure sequential digit strings", () => {
      const r = validatePassword("12345678");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/רצף/);
    });

    it("rejects pure sequential alpha strings", () => {
      expect(validatePassword("abcdefgh").valid).toBe(false);
    });
  });

  // ── Composition (must have letter + number) ────────────────────────────────
  describe("letter + number requirement", () => {
    it("rejects passwords with only letters", () => {
      const r = validatePassword("OnlyLetters");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/אות אחת ומספר/);
    });

    it("rejects passwords with only numbers", () => {
      const r = validatePassword("98765432");
      expect(r.valid).toBe(false);
    });
  });

  // ── Valid passwords ────────────────────────────────────────────────────────
  describe("valid passwords", () => {
    const valid = [
      "Secure1!",       // 8 chars, letter + number + special
      "MyPass77",       // 8 chars, letter + number
      "Hunter2x!",      // 9 chars
      "CorrectHorse4",  // 12 chars, no special
      "P@ssw0rd99!",    // complex
    ];
    it.each(valid)('accepts "%s"', (pw) => {
      expect(validatePassword(pw).valid).toBe(true);
    });
  });

  // ── Return shape ───────────────────────────────────────────────────────────
  it("always returns { valid: boolean, message: string }", () => {
    const cases = ["", "a", "Secure1!", "password"];
    for (const pw of cases) {
      const r = validatePassword(pw);
      expect(typeof r.valid).toBe("boolean");
      expect(typeof r.message).toBe("string");
    }
  });

  it("valid result has empty message", () => {
    const r = validatePassword("Secure1!");
    expect(r.valid).toBe(true);
    expect(r.message).toBe("");
  });
});
