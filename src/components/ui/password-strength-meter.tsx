/**
 * PasswordStrengthMeter
 *
 * Displays:
 *  • A coloured strength bar (weak / fair / strong)
 *  • A live checklist of all 5 password requirements
 *
 * Accepts only a `password` prop — all logic is derived from
 * the shared helpers in src/lib/password-validation.ts.
 *
 * Usage:
 *   <PasswordStrengthMeter password={password} />
 *
 * Show only while the user is typing (mount conditionally when password !== "").
 */
import { Check, X } from "lucide-react";
import {
  PASSWORD_REQUIREMENTS,
  checkRequirements,
  getPasswordStrength,
  STRENGTH_META,
} from "@/lib/password-validation";

interface Props {
  password: string;
}

const PasswordStrengthMeter = ({ password }: Props) => {
  const level    = getPasswordStrength(password);
  const meta     = STRENGTH_META[level];
  const reqMap   = checkRequirements(password);

  return (
    <div className="space-y-2 pt-1" aria-live="polite" aria-label="חוזק הסיסמה">

      {/* ── Strength bar ─────────────────────────────────────────────────── */}
      <div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${meta.color} ${meta.width}`}
          />
        </div>
        {meta.label && (
          <p
            className={`text-xs mt-0.5 ${
              level === 1
                ? "text-red-500"
                : level === 2
                ? "text-yellow-500"
                : "text-emerald-500"
            }`}
          >
            חוזק הסיסמה: {meta.label}
          </p>
        )}
      </div>

      {/* ── Requirements checklist ───────────────────────────────────────── */}
      <ul className="space-y-1" role="list" aria-label="דרישות הסיסמה">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const pass = reqMap[req.key];
          return (
            <li
              key={req.key}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                pass ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {pass ? (
                <Check size={11} className="shrink-0 text-emerald-500" aria-hidden="true" />
              ) : (
                <X size={11} className="shrink-0 text-muted-foreground/60" aria-hidden="true" />
              )}
              <span>{req.label}</span>
              <span className="sr-only">{pass ? "— עבר" : "— לא עבר"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
