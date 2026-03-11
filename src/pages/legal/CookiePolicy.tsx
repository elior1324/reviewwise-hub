/**
 * CookiePolicy.tsx
 * מדיניות קובצי עוגיות — ReviewHub
 * עומד ב: חוק התקשורת (בזק ושידורים) התשמ"ב-1982, סעיף 30א; GDPR Art. 7
 * נתיב: /cookies
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ChevronDown, Shield, ToggleLeft, ToggleRight, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const META = {
  updated: "מרץ 2026",
  company: "ReviewHub",
  email: "support@reviewshub.info",
  version: "גרסת בטא — שלבי הרצה",
};

// ─── Cookie table data ─────────────────────────────────────────────────────────
const COOKIES = [
  {
    name: "sb-auth-token",
    category: "הכרחי",
    categoryColor: "emerald",
    provider: "Supabase",
    purpose: "אימות זהות המשתמש ושמירת הסשן הפעיל. ללא עוגיה זו האתר אינו יכול לזהות אותך לאחר הכניסה.",
    duration: "Session (נמחקת בסגירת הדפדפן)",
    canBlock: false,
  },
  {
    name: "cookie_consent",
    category: "הכרחי",
    categoryColor: "emerald",
    provider: "ReviewHub",
    purpose: "שמירת בחירת הסכמתך לשימוש בעוגיות, כדי שלא נציג את הבאנר שוב לאחר שכבר בחרת.",
    duration: "365 ימים",
    canBlock: false,
  },
  {
    name: "_ga / _gid",
    category: "ניתוח תנועה",
    categoryColor: "blue",
    provider: "Google Analytics",
    purpose: "ניתוח תנועה אנונימי לאתר — מספר המבקרים, עמודים פופולריים ונתיבי ניווט. כל הנתונים אנונימיים לחלוטין.",
    duration: "_ga: שנתיים | _gid: 24 שעות",
    canBlock: true,
  },
];

// ─── FAQ items ─────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "מה זה עוגיה (Cookie)?",
    a: `עוגיה היא קובץ טקסט קטן שנשמר על המחשב או הטלפון שלך כאשר אתה מבקר באתר.
        העוגיות מאפשרות לאתר לזכור מידע כמו פרטי הכניסה שלך, העדפות תצוגה,
        או אילו עמודים ביקרת — כדי לספק לך חוויה טובה יותר.`,
  },
  {
    q: "כיצד ניתן לנהל ולמחוק עוגיות?",
    a: `ניתן לנהל עוגיות ישירות דרך הגדרות הדפדפן שלך:
        Chrome: הגדרות ← פרטיות ← קובצי Cookie.
        Firefox: הגדרות ← פרטיות ← מחק עוגיות.
        Safari: העדפות ← פרטיות ← נהל נתוני אתרים.
        שים לב: מחיקת עוגיות הכרחיות עלולה לשבש את פעולת האתר.`,
  },
  {
    q: "האם ניתן לבטל את עוגיות Google Analytics?",
    a: `כן. ניתן להוריד את תוסף הדפדפן הרשמי לביטול Google Analytics:
        https://tools.google.com/dlpage/gaoptout
        לחלופין, ניתן לבחור "ללא עוגיות ניתוח" בבאנר ההסכמה שמופיע בכניסה הראשונה לאתר.`,
  },
  {
    q: "האם ReviewHub מוכרת את הנתונים שנאספים דרך עוגיות?",
    a: `לא. ReviewHub אינה מוכרת, שוכרת, או מחליפה מידע שנאסף דרך עוגיות.
        נתוני Google Analytics מועברים ל-Google בכפוף למדיניות הפרטיות של Google,
        אך הם אנונימיים לחלוטין — אינם מכילים שמות, כתובות, או מידע מזהה.`,
  },
  {
    q: "האם ReviewHub משתמשת בעוגיות מפרסום (Advertising Cookies)?",
    a: `לא. ReviewHub אינה משתמשת בעוגיות פרסום, מיקוד (Targeting),
        עוקבות בין-אתריות (Cross-site Tracking), או פינגרפרינטינג.
        האתר אינו מציג מודעות ואין שיתוף נתונים עם רשתות פרסום.`,
  },
];

// ─── Components ────────────────────────────────────────────────────────────────

const CategoryBadge = ({ label, color }: { label: string; color: string }) => {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[color] ?? colors.blue}`}>
      {label}
    </span>
  );
};

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.03]">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-right hover:bg-white/[0.04] transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-white text-sm">{q}</span>
        <ChevronDown size={15} className={`text-white/40 shrink-0 ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 border-t border-white/10">
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <main className="container max-w-3xl py-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
            <Cookie size={13} /> מדיניות עוגיות
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">מדיניות קובצי עוגיות</h1>
          <p className="text-white/50 text-sm">
            עודכן: {META.updated} · {META.version}
          </p>
          <p className="text-white/40 text-xs mt-1">
            עומד בסעיף 30א לחוק התקשורת (בזק ושידורים) התשמ"ב-1982 ו-GDPR Art. 7
          </p>
        </motion.div>

        {/* Intro box */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-8 p-5 rounded-2xl bg-white/[0.04] border border-white/10">
          <p className="text-sm text-white/70 leading-relaxed">
            ReviewHub משתמשת במספר מועט של קובצי עוגיות, כולן נחוצות לתפעול השירות או לשיפורו.
            אנו <strong className="text-white">אינם</strong> משתמשים בעוגיות פרסום, מעקב בין-אתרי, או פינגרפרינטינג.
            בהמשך תמצא פירוט מלא של כל עוגיה, מטרתה ומשך חייה.
          </p>
        </motion.div>

        {/* Cookie table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" /> טבלת קובצי העוגיות
          </h2>

          <div className="space-y-4">
            {COOKIES.map((c) => (
              <div key={c.name} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {/* Cookie header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono font-bold text-emerald-400">{c.name}</code>
                    <CategoryBadge label={c.category} color={c.categoryColor} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    {c.canBlock
                      ? <><ToggleLeft size={16} className="text-white/30" /> ניתן לביטול</>
                      : <><ToggleRight size={16} className="text-emerald-500/60" /> חיוני לאתר</>
                    }
                  </div>
                </div>

                {/* Cookie details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-white/10">
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">ספק</p>
                    <p className="text-sm text-white/70">{c.provider}</p>
                  </div>
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">משך חיים</p>
                    <p className="text-sm text-white/70">{c.duration}</p>
                  </div>
                  <div className="px-5 py-3.5 sm:col-span-1">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">מטרה</p>
                    <p className="text-sm text-white/70 leading-relaxed">{c.purpose}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">שאלות נפוצות</h2>
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </motion.div>

        {/* Consent note */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <p className="text-sm text-white/60 leading-relaxed">
            <span className="font-semibold text-white/80">ניהול הסכמה: </span>
            בכניסתך הראשונה לאתר מוצג באנר הסכמה לעוגיות. ניתן לשנות את בחירתך בכל עת דרך
            הגדרות הדפדפן. עוגיות הכרחיות (Supabase auth, cookie_consent) פועלות ללא הסכמה,
            שכן הן חיוניות לתפעול הבסיסי של האתר.
          </p>
        </motion.div>

        {/* Links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="flex flex-wrap gap-3 justify-center text-xs text-white/40 mb-8">
          <a href="/privacy" className="hover:text-emerald-400 transition-colors">← מדיניות פרטיות</a>
          <span>·</span>
          <a href="/terms" className="hover:text-emerald-400 transition-colors">תנאי שימוש</a>
          <span>·</span>
          <a href="/legal/dpa" className="hover:text-emerald-400 transition-colors">הסכם עיבוד נתונים (DPA)</a>
        </motion.div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-sm text-white/50">
          <Mail size={14} className="text-emerald-400" />
          שאלות על עוגיות?&nbsp;
          <a href={`mailto:${META.email}`} className="text-emerald-400 hover:underline">{META.email}</a>
        </motion.div>

      </main>
      <Footer />
    </div>
  );
}
