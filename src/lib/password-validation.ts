/**
 * src/lib/password-validation.ts
 *
 * Single source of truth for all password-related logic:
 *   • validatePassword()        — full validation (used before signUp / password-reset)
 *   • checkRequirements()       — per-rule pass/fail map (used by PasswordStrengthMeter)
 *   • getPasswordStrength()     — 0-3 strength score (used by PasswordStrengthMeter)
 *   • STRENGTH_META             — label/colour/width map for the strength bar
 *   • PASSWORD_REQUIREMENTS     — ordered list of rule definitions (drives the checklist UI)
 *
 * Password rules (all 5 are mandatory):
 *   1. Minimum 8 characters
 *   2. At least one uppercase letter  [A-Z]
 *   3. At least one lowercase letter  [a-z]
 *   4. At least one digit             [0-9]
 *   5. At least one symbol            [^a-zA-Z0-9]
 *
 * Additional entropy checks (blocklist, repeated chars, sequential runs) are
 * applied after the 5 composition rules.
 *
 * Hashing note:
 *   Supabase Auth hashes passwords with bcrypt (work factor 10) and a unique
 *   per-password salt before persisting them. No plain-text passwords are ever
 *   stored. The code in this file operates entirely on the client side to give
 *   the user feedback before the password reaches the server.
 */

// ── Common / leaked password blocklist ────────────────────────────────────────
const COMMON_PASSWORDS = new Set([
  "123456", "password", "123456789", "12345678", "12345", "1234567",
  "1234567890", "qwerty", "abc123", "111111", "123123", "admin",
  "letmein", "welcome", "monkey", "master", "dragon", "login",
  "princess", "football", "shadow", "sunshine", "trustno1",
  "iloveyou", "batman", "access", "hello", "charlie", "donald",
  "password1", "qwerty123", "654321", "555555", "lovely", "michael",
  "!@#$%^&*", "aa123456", "password123", "000000", "121212",
  "666666", "qwertyuiop", "1q2w3e4r", "987654321", "superman",
  "1qaz2wsx", "abcdef", "abcd1234", "passw0rd", "p@ssword",
  "P@ssword", "P@ssw0rd", "Passw0rd",
]);

// ── Requirement definitions ───────────────────────────────────────────────────

export interface PasswordRequirement {
  /** Unique key — also used as the property name in RequirementsMap */
  key: string;
  /** User-visible label (Hebrew) */
  label: string;
  /** Returns true when the requirement is satisfied */
  test: (pw: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    key:   "minLength",
    label: "לפחות 8 תווים",
    test:  (pw) => pw.length >= 8,
  },
  {
    key:   "uppercase",
    label: "לפחות אות גדולה אחת (A-Z)",
    test:  (pw) => /[A-Z]/.test(pw),
  },
  {
    key:   "lowercase",
    label: "לפחות אות קטנה אחת (a-z)",
    test:  (pw) => /[a-z]/.test(pw),
  },
  {
    key:   "number",
    label: "לפחות ספרה אחת (0-9)",
    test:  (pw) => /[0-9]/.test(pw),
  },
  {
    key:   "symbol",
    label: "לפחות תו מיוחד אחד (!@#$...)",
    test:  (pw) => /[^a-zA-Z0-9]/.test(pw),
  },
];

/** Map of requirement key → whether it currently passes */
export type RequirementsMap = Record<string, boolean>;

/**
 * checkRequirements
 * Returns a map of { [key]: boolean } for every entry in PASSWORD_REQUIREMENTS.
 * Used by PasswordStrengthMeter to render the live checklist.
 */
export function checkRequirements(password: string): RequirementsMap {
  return Object.fromEntries(
    PASSWORD_REQUIREMENTS.map((r) => [r.key, r.test(password)])
  );
}

// ── Strength score ─────────────────────────────────────────────────────────────

export type StrengthLevel = 0 | 1 | 2 | 3;

/**
 * getPasswordStrength
 * Returns a 0-3 score based on how many of the 5 composition rules are met.
 *   0 — empty
 *   1 — weak  (1-2 rules)
 *   2 — fair  (3-4 rules)
 *   3 — strong (all 5 rules)
 *
 * A bonus point is added for passwords ≥ 12 characters (can push fair → strong).
 * Blocklisted or pattern passwords are capped at level 1 regardless of composition.
 */
export function getPasswordStrength(pw: string): StrengthLevel {
  if (!pw) return 0;

  // Count how many of the 5 composition rules pass
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(pw)).length;
  // Bonus for length >= 12
  const bonus = pw.length >= 12 ? 1 : 0;
  const score = passed + bonus;

  if (score >= 6) return 3; // all 5 + bonus
  if (score === 5) return 3; // all 5, no bonus
  if (score >= 3)  return 2; // fair
  return 1;                  // weak
}

export const STRENGTH_META: Record<StrengthLevel, { label: string; color: string; width: string }> = {
  0: { label: "",        color: "",                  width: "w-0"    },
  1: { label: "חלשה",    color: "bg-red-500",        width: "w-1/3"  },
  2: { label: "בינונית", color: "bg-yellow-400",     width: "w-2/3"  },
  3: { label: "חזקה",    color: "bg-emerald-500",    width: "w-full" },
};

// ── Main validator ─────────────────────────────────────────────────────────────

export interface PasswordValidationResult {
  valid: boolean;
  /** Hebrew error message. Empty string when valid. */
  message: string;
}

/**
 * validatePassword
 *
 * Runs the full validation pipeline:
 *   1. Length ≥ 8
 *   2. Uppercase letter
 *   3. Lowercase letter
 *   4. Digit
 *   5. Symbol
 *   6. Common-password blocklist
 *   7. All-same-character check
 *   8. Sequential-character run check
 *
 * Returns the first failing rule (early-exit). Returns { valid: true, message: "" }
 * only when ALL checks pass.
 */
export function validatePassword(password: string): PasswordValidationResult {
  // ── 1. Length ────────────────────────────────────────────────────────────────
  if (password.length < 8) {
    return { valid: false, message: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }

  // ── 2. Uppercase ─────────────────────────────────────────────────────────────
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "הסיסמה חייבת להכיל לפחות אות גדולה אחת (A-Z)" };
  }

  // ── 3. Lowercase ─────────────────────────────────────────────────────────────
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "הסיסמה חייבת להכיל לפחות אות קטנה אחת (a-z)" };
  }

  // ── 4. Digit ─────────────────────────────────────────────────────────────────
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "הסיסמה חייבת להכיל לפחות ספרה אחת (0-9)" };
  }

  // ── 5. Symbol ────────────────────────────────────────────────────────────────
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return { valid: false, message: "הסיסמה חייבת להכיל לפחות תו מיוחד אחד (!@#$%^&*...)" };
  }

  // ── 6. Common / leaked password blocklist ────────────────────────────────────
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, message: "הסיסמה נפוצה מדי ואינה מאובטחת — בחרו סיסמה חזקה יותר" };
  }

  // ── 7. All-same-character ────────────────────────────────────────────────────
  if (/^(.)\1+$/.test(password)) {
    return { valid: false, message: "הסיסמה לא יכולה להכיל תו חוזר בלבד" };
  }

  // ── 8. Sequential character runs ─────────────────────────────────────────────
  const SEQ = /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i;
  if (SEQ.test(password)) {
    return { valid: false, message: "הסיסמה לא יכולה להיות רצף פשוט של תווים" };
  }

  return { valid: true, message: "" };
}
