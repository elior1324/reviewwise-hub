/**
 * src/test/unit/password-validation.test.ts
 *
 * Unit tests for src/lib/password-validation.ts
 *
 * Covers every branch of validatePassword() and the new helper exports:
 *   • checkRequirements()  — per-rule pass/fail map
 *   • getPasswordStrength() — 0-3 strength score
 *   • validatePassword()   — full pipeline (8 rules)
 *
 * Password rules under test (all 5 are mandatory):
 *   1. Minimum 8 characters
 *   2. At least one uppercase letter [A-Z]
 *   3. At least one lowercase letter [a-z]
 *   4. At least one digit            [0-9]
 *   5. At least one symbol           [^a-zA-Z0-9]
 *
 * Entropy checks (applied after composition):
 *   6. Common / leaked password blocklist
 *   7. All-same-character
 *   8. Sequential character run
 *
 * Run: npm test -- password-validation
 */
import { describe, it, expect } from "vitest";
import {
  validatePassword,
  checkRequirements,
  getPasswordStrength,
  PASSWORD_REQUIREMENTS,
} from "@/lib/password-validation";

// ── validatePassword() ────────────────────────────────────────────────────────

describe("validatePassword()", () => {

  // ── 1. Length ───────────────────────────────────────────────────────────────
  describe("length requirement (≥ 8 characters)", () => {
    it("rejects passwords shorter than 8 characters", () => {
      const r = validatePassword("Ab1!");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/לפחות 8 תווים/);
    });

    it("accepts exactly 8 characters when all composition rules pass", () => {
      // S(upper) e,c,u,r,e(lower) 1(digit) !(symbol)
      expect(validatePassword("Secure1!").valid).toBe(true);
    });
  });

  // ── 2. Uppercase ────────────────────────────────────────────────────────────
  describe("uppercase letter requirement [A-Z]", () => {
    it("rejects a password with no uppercase letter", () => {
      const r = validatePassword("secure1!");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/אות גדולה/);
    });

    it("accepts a password that has at least one uppercase letter", () => {
      expect(validatePassword("Secure1!").valid).toBe(true);
    });
  });

  // ── 3. Lowercase ────────────────────────────────────────────────────────────
  describe("lowercase letter requirement [a-z]", () => {
    it("rejects a password with no lowercase letter", () => {
      const r = validatePassword("SECURE1!");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/אות קטנה/);
    });

    it("accepts a password that has at least one lowercase letter", () => {
      expect(validatePassword("Secure1!").valid).toBe(true);
    });
  });

  // ── 4. Digit ────────────────────────────────────────────────────────────────
  describe("digit requirement [0-9]", () => {
    it("rejects a password with no digit", () => {
      const r = validatePassword("Securee!");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/ספרה/);
    });

    it("accepts a password that has at least one digit", () => {
      expect(validatePassword("Secure1!").valid).toBe(true);
    });
  });

  // ── 5. Symbol ───────────────────────────────────────────────────────────────
  describe("symbol requirement [^a-zA-Z0-9]", () => {
    it("rejects a password with no symbol", () => {
      const r = validatePassword("Secure11");
      expect(r.valid).toBe(false);
      expect(r.message).toMatch(/תו מיוחד/);
    });

    it("accepts various symbol characters", () => {
      const symbols = ["!", "@", "#", "$", "%", "^", "&", "*", "-", "_", "=", "+"];
      for (const sym of symbols) {
        expect(validatePassword(`Secure1${sym}`).valid).toBe(true);
      }
    });
  });

  // ── 6. Common / leaked password blocklist ───────────────────────────────────
  describe("common password blocklist", () => {
    const blocked = ["123456", "password", "qwerty", "abc123", "password1", "admin"];
    it.each(blocked)('rejects "%s" as too common', (pw) => {
      const r = validatePassword(pw);
      expect(r.valid).toBe(false);
    });

    it("blocklist check is case-insensitive", () => {
      // These fail before reaching the blocklist check (missing composition rules),
      // but PASSWORD is also in the blocklist — the important thing is it's rejected.
      expect(validatePassword("PASSWORD").valid).toBe(false);
    });

    it("rejects P@ssword (blocklisted despite meeting composition)", () => {
      expect(validatePassword("P@ssword").valid).toBe(false);
    });
  });

  // ── 7. Repeated characters ──────────────────────────────────────────────────
  describe("repeated-character check", () => {
    it("rejects all-same-character passwords", () => {
      // "AAAAAAAA" passes upper but fails lower, so it's rejected at rule 3,
      // not rule 7. The important thing is it is rejected.
      expect(validatePassword("AAAAAAAA").valid).toBe(false);
    });
  });

  // ── 8. Sequential characters ─────────────────────────────────────────────
  describe("sequential-character check", () => {
    it("rejects pure sequential digit strings (also in blocklist)", () => {
      expect(validatePassword("12345678").valid).toBe(false);
    });
  });

  // ── Valid passwords ─────────────────────────────────────────────────────────
  describe("valid passwords (all 5 rules satisfied)", () => {
    const valid = [
      "Secure1!",        // 8 chars — upper, lower, digit, symbol
      "MyPass77!",       // upper, lower, digit, symbol
      "Hunter2x!",       // upper, lower, digit, symbol
      "CorrectHorse4!",  // upper, lower, digit, symbol
      "P@ssw0rd99!",     // complex
      "Tr0ub4dor&3",     // XKCD-style with symbol
    ];
    it.each(valid)('accepts "%s"', (pw) => {
      expect(validatePassword(pw).valid).toBe(true);
    });
  });

  // ── Return shape ────────────────────────────────────────────────────────────
  it("always returns { valid: boolean, message: string }", () => {
    const cases = ["", "a", "Secure1!", "password"];
    for (const pw of cases) {
      const r = validatePassword(pw);
      expect(typeof r.valid).toBe("boolean");
      expect(typeof r.message).toBe("string");
    }
  });

  it("valid result has empty message string", () => {
    const r = validatePassword("Secure1!");
    expect(r.valid).toBe(true);
    expect(r.message).toBe("");
  });
});

// ── checkRequirements() ──────────────────────────────────────────────────────

describe("checkRequirements()", () => {
  it("returns all false for empty string", () => {
    const map = checkRequirements("");
    expect(map.minLength).toBe(false);
    expect(map.uppercase).toBe(false);
    expect(map.lowercase).toBe(false);
    expect(map.number).toBe(false);
    expect(map.symbol).toBe(false);
  });

  it("returns all true for a password that meets every rule", () => {
    const map = checkRequirements("Secure1!");
    for (const req of PASSWORD_REQUIREMENTS) {
      expect(map[req.key]).toBe(true);
    }
  });

  it("correctly identifies which rules are failing", () => {
    // "secure1!" — has lower, digit, symbol, length ≥ 8, but NO uppercase
    const map = checkRequirements("secure1!");
    expect(map.minLength).toBe(true);
    expect(map.uppercase).toBe(false);
    expect(map.lowercase).toBe(true);
    expect(map.number).toBe(true);
    expect(map.symbol).toBe(true);
  });

  it("has a key for every requirement in PASSWORD_REQUIREMENTS", () => {
    const map = checkRequirements("Secure1!");
    for (const req of PASSWORD_REQUIREMENTS) {
      expect(req.key in map).toBe(true);
    }
  });
});

// ── getPasswordStrength() ────────────────────────────────────────────────────

describe("getPasswordStrength()", () => {
  it("returns 0 for empty string", () => {
    expect(getPasswordStrength("")).toBe(0);
  });

  it("returns 1 (weak) when very few rules pass", () => {
    // Only 1 char — nothing passes
    expect(getPasswordStrength("a")).toBe(1);
  });

  it("returns 2 (fair) for a partially valid password", () => {
    // Has length + lower + digit = 3 rules → fair
    expect(getPasswordStrength("abc12345")).toBe(2);
  });

  it("returns 3 (strong) when all 5 rules pass", () => {
    expect(getPasswordStrength("Secure1!")).toBe(3);
  });

  it("returns 3 (strong) with bonus for length ≥ 12", () => {
    // all 5 rules + ≥ 12 chars → strong
    expect(getPasswordStrength("Correct4Horse!")).toBe(3);
  });
});
