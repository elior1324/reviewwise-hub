/**
 * CookieConsent.tsx
 * באנר הסכמה לקוקיז — ReviewHub
 * GDPR / ePrivacy / חוק התקשורת (בזק ושידורים) סעיף 30א compliant
 *
 * שימוש: הוסף <CookieConsent /> ב-App.tsx (מחוץ לראוטר, ברמת root)
 * ייצוא: useCookieConsent() hook לשימוש בכל מקום באפליקציה
 *
 * אחסון: localStorage (לא cookie) — כך ניתן לזהות את ההסכמה גם לאחר ניקוי קוקיז
 * תוקף הסכמה: 12 חודשים — לאחר מכן הבאנר מוצג מחדש (GDPR Best Practice)
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConsentState {
  essential:   true;          // תמיד true — לא ניתן לשינוי
  functional:  boolean;
  analytics:   boolean;
  marketing:   false;         // תמיד false — אין שימוש
  savedAt:     string;        // ISO string
  version:     string;        // גרסת המדיניות — עדכן בעת שינוי מהותי
}

const STORAGE_KEY    = "rh_cookie_consent";
const POLICY_VERSION = "2026-03";   // עדכן בכל שינוי מהותי במדיניות
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 חודשים

// ─── Storage helpers ──────────────────────────────────────────────────────────

const loadConsent = (): ConsentState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c: ConsentState = JSON.parse(raw);
    // Expired?
    if (Date.now() - new Date(c.savedAt).getTime() > CONSENT_TTL_MS) return null;
    // Policy changed?
    if (c.version !== POLICY_VERSION) return null;
    return c;
  } catch {
    return null;
  }
};

const saveConsent = (c: Omit<ConsentState, "essential" | "marketing" | "savedAt" | "version">): ConsentState => {
  const full: ConsentState = {
    essential: true,
    functional: c.functional,
    analytics: c.analytics,
    marketing: false,
    savedAt: new Date().toISOString(),
    version: POLICY_VERSION,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  return full;
};

// ─── Public hook ──────────────────────────────────────────────────────────────

export const useCookieConsent = (): ConsentState => {
  return loadConsent() ?? {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    savedAt: "",
    version: "",
  };
};

// ─── Toggle switch ────────────────────────────────────────────────────────────

const Toggle = ({
  checked,
  onChange,
  disabled = false,
  label,
}: { checked: boolean; onChange: () => void; disabled?: boolean; label: string }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    disabled={disabled}
    className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
      ${checked ? "bg-emerald-500" : "bg-white/20"}
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200
      ${checked ? "right-0.5" : "left-0.5"}`} />
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function CookieConsent() {
  const [visible,   setVisible]   = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics,  setAnalytics]  = useState(false);

  useEffect(() => {
    if (!loadConsent()) {
      // Short delay — don't flash on first paint
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = (f: boolean, a: boolean) => {
    saveConsent({ functional: f, analytics: a });
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-auto sm:right-6 sm:w-[400px] z-[999]"
          role="dialog"
          aria-modal="true"
          aria-label="בקשת הסכמה לקובצי עוגיות"
          dir="rtl"
        >
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Cookie size={16} className="text-emerald-400" />
                <span className="font-semibold text-white text-sm">קובצי עוגיות</span>
              </div>
              <button
                aria-label="סגור ואשר חיוניות בלבד"
                onClick={() => accept(false, false)}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-1">
              <p className="text-sm text-white/55 leading-relaxed">
                אנחנו משתמשים בקוקיז לניהול ההפעלה ושיפור חוויתך.{" "}
                <Link to="/cookie-policy" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5 text-sm">
                  מדיניות מלאה <ExternalLink size={11} />
                </Link>
              </p>

              {/* Advanced toggle */}
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-white/35 hover:text-white/60 mt-2.5 mb-1 transition-colors"
                aria-expanded={expanded}
                aria-controls="cookie-settings-panel"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                התאמה אישית
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    id="cookie-settings-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="py-3 space-y-3 border-t border-white/[0.07] mt-1">
                      {/* Essential — always on */}
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-white/80">חיוניות</p>
                          <p className="text-[11px] text-white/35 mt-0.5">הכרחיות לתפקוד, כניסה לחשבון</p>
                        </div>
                        <Toggle checked disabled onChange={() => {}} label="חיוניות — לא ניתן לכיבוי" />
                      </div>
                      {/* Functional */}
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-white/80">פונקציונליות</p>
                          <p className="text-[11px] text-white/35 mt-0.5">שמירת הגדרות תצוגה ושפה</p>
                        </div>
                        <Toggle checked={functional} onChange={() => setFunctional(f => !f)} label="פונקציונליות" />
                      </div>
                      {/* Analytics */}
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-white/80">ניתוח</p>
                          <p className="text-[11px] text-white/35 mt-0.5">Google Analytics אנונימי — עוזר לשפר</p>
                        </div>
                        <Toggle checked={analytics} onChange={() => setAnalytics(a => !a)} label="ניתוח" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 py-4">
              {expanded ? (
                <>
                  <button
                    onClick={() => accept(functional, analytics)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold h-9 rounded-xl transition-colors"
                  >
                    שמור הגדרות
                  </button>
                  <button
                    onClick={() => accept(false, false)}
                    className="flex-1 bg-white/[0.07] hover:bg-white/10 text-white/60 text-xs font-medium h-9 rounded-xl transition-colors"
                  >
                    חיוניות בלבד
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => accept(true, true)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold h-9 rounded-xl transition-colors"
                  >
                    אישור הכל
                  </button>
                  <button
                    onClick={() => accept(false, false)}
                    className="flex-1 bg-white/[0.07] hover:bg-white/10 text-white/60 text-xs font-medium h-9 rounded-xl transition-colors"
                  >
                    חיוניות בלבד
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
