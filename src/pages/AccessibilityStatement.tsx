/**
 * AccessibilityStatement.tsx
 * הצהרת נגישות — ReviewHub
 * עומד ב: חוק שוויון זכויות לאנשים עם מוגבלות התשנ"ח-1998,
 *          תקנות שוויון זכויות (התאמות נגישות לשירות) התשע"ג-2013,
 *          תקן ישראלי IS 5568, WCAG 2.1 Level AA
 * נתיב: /accessibility
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ChevronDown, CheckCircle2, Clock, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const META = {
  updated:     "10 במרץ 2026",
  coordinator: "accessibility@reviewhub.co.il",
  level:       "WCAG 2.1 AA / תקן IS 5568",
};

const FEATURES = [
  // done
  { done: true,  text: "ניווט מלא במקלדת (Tab / Enter / Space / חצים)" },
  { done: true,  text: "תאימות עם NVDA, JAWS, VoiceOver, TalkBack" },
  { done: true,  text: "כל התמונות מכילות alt text תיאורי" },
  { done: true,  text: "יחס ניגודיות ≥ 4.5:1 (WCAG AA) לטקסט רגיל" },
  { done: true,  text: "יחס ניגודיות ≥ 3:1 לאלמנטים גרפיים ואינטראקטיביים" },
  { done: true,  text: "גופנים ניתנים להגדלה עד 200% ללא גלילה אופקית" },
  { done: true,  text: "ממשק RTL מלאה עם תמיכה בעברית" },
  { done: true,  text: "כל הכפתורים/קישורים עם תוויות ARIA ותיאורים נגישים" },
  { done: true,  text: "הודעות שגיאה בטפסים מפורשות ומוקדמות למיקוד" },
  { done: true,  text: "Skip navigation link — קפיצה לתוכן הראשי" },
  { done: true,  text: "מבנה כותרות היררכי ועקבי (h1→h2→h3)" },
  { done: true,  text: "Landmark roles (main, nav, footer, aside)" },
  { done: true,  text: "אנימציות מכובדות prefers-reduced-motion" },
  // in progress
  { done: false, text: "כתוביות לסרטוני וידאו שמועלים על ידי משתמשים (בפיתוח, Q2 2026)" },
  { done: false, text: "מצב ניגודיות גבוהה (High Contrast Mode) — בפיתוח" },
  { done: false, text: "Live regions לעדכונים דינמיים — בשיפור" },
];

const SECTIONS = [
  {
    title: "מהו תקן IS 5568?",
    body: [
      { type: "p", text: "תקן ישראלי IS 5568 הוא תרגום רשמי של הנחיות WCAG 2.1 ברמת AA, כפי שאומצו על ידי מכון התקנים הישראלי. תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות) מחייבות אתרים ציבוריים לעמוד בתקן זה." },
    ],
  },
  {
    title: "טכנולוגיות עזר נתמכות",
    body: [
      { type: "list", items: [
        "קוראי מסך: NVDA + Chrome (Windows), JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)",
        "ניווט מקלדת: ללא עכבר — כולל focus visible ברור",
        "מגדיל מסך: עד 200% בדפדפן",
        "דפדפנים: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+",
      ]},
    ],
  },
  {
    title: "מגבלות ידועות",
    body: [
      { type: "p", text: "אנחנו עובדים על שיפור מתמיד. מגבלות ידועות נכון לתאריך העדכון:" },
      { type: "list", items: [
        "תכנים מוטמעים מ-YouTube: כפופים למדיניות YouTube; אנו ממליצים לצפות ישירות ב-YouTube עם כתוביות",
        "טבלאות מורכבות בדשבורד — בשיפור לתאימות מלאה עם קוראי מסך",
        "מצב ניגודיות גבוהה — עדיין לא זמין; פנה אלינו ונסייע ידנית",
      ]},
    ],
  },
  {
    title: "כיצד לנווט בנגישות",
    body: [
      { type: "list", items: [
        "Tab — מעבר בין אלמנטים אינטראקטיביים",
        "Shift+Tab — חזרה לאלמנט הקודם",
        "Enter / Space — הפעלת כפתורים וקישורים",
        "חצים — ניווט בתפריטים ורשימות",
        "Escape — סגירת דיאלוגים ומוגנים",
        'הקש Alt+1 (או Tab+1 ב-VoiceOver) לדילוג לתוכן הראשי',
      ]},
    ],
  },
  {
    title: "הגשת משוב על נגישות",
    body: [
      { type: "p", text: `מצאת מחסום נגישות? אנחנו רוצים לדעת ולתקן. רכז הנגישות: ${META.coordinator}` },
      { type: "p", text: "בפנייתך כלול: תיאור המחסום, הדף/הפונקציה, הדפדפן ומערכת ההפעלה, וציוד העזר בו השתמשת." },
      { type: "p", text: "זמן מענה: עד 7 ימי עסקים. אם לא קיבלת מענה — ניתן לפנות לנציב שוויון זכויות לאנשים עם מוגבלות." },
    ],
  },
];

const AccordionItem = ({ section }: { section: typeof SECTIONS[0] }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03]">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-right hover:bg-white/[0.04] transition-colors" aria-expanded={open}>
        <span className="font-semibold text-white text-sm">{section.title}</span>
        <ChevronDown size={16} className={`text-white/40 transition-transform duration-200 shrink-0 ml-4 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-6 pb-5 pt-1 border-t border-white/10 space-y-3">
              {section.body.map((block, i) => {
                if (block.type === "p") return <p key={i} className="text-sm text-white/60 leading-relaxed">{block.text}</p>;
                if (block.type === "list") return (
                  <ul key={i} className="space-y-1.5">
                    {(block.items as string[]).map((item, j) => (
                      <li key={j} className="flex gap-2 text-sm text-white/60"><span className="text-emerald-400 shrink-0 mt-0.5">•</span><span>{item}</span></li>
                    ))}
                  </ul>
                );
                return null;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AccessibilityStatement() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Skip navigation — hidden visually but accessible */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:bg-emerald-500 focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold">
        דלג לתוכן הראשי
      </a>

      <Navbar />
      <main id="main-content" className="container max-w-2xl py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
            <Eye size={13} /> תקן IS 5568 / WCAG 2.1 AA
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">הצהרת נגישות</h1>
          <p className="text-white/50 text-sm">עודכן: {META.updated} · ReviewHub מחויבת לנגישות דיגיטלית לכולם</p>
        </motion.div>

        {/* Compliance status badge */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl mb-6">
          <div>
            <p className="text-sm font-semibold text-white">רמת עמידה נוכחית</p>
            <p className="text-xs text-white/50 mt-0.5">חלקית — WCAG 2.1 Level AA</p>
          </div>
          <div className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full font-semibold">
            בתהליך שיפור מתמיד
          </div>
        </motion.div>

        {/* Features checklist */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-white text-sm mb-4">תכונות נגישות קיימות ומתוכננות</h2>
          <div className="space-y-2.5">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                {f.done
                  ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  : <Clock size={15} className="text-yellow-400 shrink-0 mt-0.5" />}
                <span className={f.done ? "text-white/70" : "text-white/40"}>{f.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-2">
          {SECTIONS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }}>
              <AccordionItem section={s} />
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-sm text-white/50">
          <Mail size={14} className="text-emerald-400" />
          רכז נגישות:&nbsp;<a href={`mailto:${META.coordinator}`} className="text-emerald-400 hover:underline">{META.coordinator}</a>
        </motion.div>

        <p className="text-center text-xs text-white/30 mt-6">
          הצהרה זו נערכה בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.
        </p>
      </main>
      <Footer />
    </div>
  );
}
