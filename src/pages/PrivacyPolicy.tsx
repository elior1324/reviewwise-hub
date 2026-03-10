/**
 * PrivacyPolicy.tsx
 * מדיניות פרטיות — ReviewHub
 * עומד ב: חוק הגנת הפרטיות התשמ"א-1981, תקנות אבטחת מידע התשע"ז-2017, GDPR Article 13/14
 * נתיב: /privacy-policy
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const META = {
  updated:   "10 במרץ 2026",
  company:   "ReviewHub",
  email:     "support@reviewshub.info",
  authority: "https://www.gov.il/he/departments/the_privacy_protection_authority",
};

const SECTIONS = [
  {
    id: "intro",
    title: "1. מבוא ותחולה",
    body: [
      { type: "p", text: `${META.company} ("אנחנו", "האתר") מחויבת להגן על פרטיותך. מדיניות זו מסבירה אילו נתונים אנו אוספים, מדוע, וכיצד תוכל לממש את זכויותיך.` },
      { type: "p", text: `מדיניות זו חלה על כל משתמשי האתר reviewhub.co.il ועומדת בדרישות:` },
      { type: "list", items: [
        "חוק הגנת הפרטיות, התשמ\"א-1981 ותקנותיו",
        "תקנות הגנת הפרטיות (אבטחת מידע), התשע\"ז-2017",
        "תקנות ה-GDPR האירופאיות (Regulation 2016/679) — לגבי משתמשים מה-EU",
        "חוק התקשורת (בזק ושידורים), התשמ\"ב-1982 — לעניין קובצי עוגיות",
      ]},
    ],
  },
  {
    id: "data",
    title: "2. המידע שאנו אוספים",
    body: [
      { type: "subtitle", text: "מידע שמסרת לנו ישירות:" },
      { type: "list", items: [
        "שם מלא וכתובת דואר אלקטרוני (בהרשמה)",
        "סיסמה — מאוחסנת בהצפנה חד-כיוונית (bcrypt) בלבד",
        "ביקורות שכתבת: טקסט, דירוג, שם מציג (או 'אנונימי')",
        "מידע עסקי (לבעלי עסקים): שם, אתר, טלפון, קטגוריה — שנמסר מרצון",
        "ראיה לרכישה לאימות ביקורת מאומתת (לא נשמרת; רק התוצאה הבולאנית נשמרת)",
      ]},
      { type: "subtitle", text: "מידע שנאסף אוטומטית:" },
      { type: "list", items: [
        "כתובת IP — לאבטחה, מניעת הונאה ומעקב קישורי שותפים (נמחקת לאחר 90 יום)",
        "User-Agent ו-Referrer — לצרכי ניתוח טכני (קישורי שותפים בלבד)",
        "תאריכים ושעות גישה",
        "קובצי עוגיות — ראה מדיניות קוקיז נפרדת",
      ]},
      { type: "subtitle", text: "מידע שאיננו אוספים לעולם:" },
      { type: "list", items: [
        "מספרי כרטיס אשראי (עיבוד תשלומים מתבצע ישירות דרך Stripe בלבד)",
        "מסמכי זיהוי (תעודת זהות, דרכון)",
        "נתוני מיקום מדויק",
      ]},
    ],
  },
  {
    id: "purpose",
    title: "3. מטרות השימוש במידע",
    body: [
      { type: "p", text: "אנו משתמשים במידע אך ורק למטרות הבאות (עקרון הצמצום — Data Minimisation):" },
      { type: "list", items: [
        "מתן השירות — ניהול חשבונך, הצגת ביקורות, עיבוד תשלומים",
        "אמינות הפלטפורמה — אימות רכישות, מניעת ביקורות מזויפות",
        "תגמולי קהילה — חישוב נקודות ותשלום דמי שותפות",
        "תקשורת שירות — התראות על ביקורות חדשות ותגובות (לא שיווק)",
        "אבטחה ומניעת הונאה — זיהוי פעילות חשודה",
        "עמידה בחוק — מענה לצווי בית משפט ובקשות רשויות מוסמכות",
      ]},
    ],
  },
  {
    id: "legal-basis",
    title: "4. הבסיס המשפטי לעיבוד (GDPR Art. 6)",
    body: [
      { type: "list", items: [
        "ביצוע חוזה (Art. 6(1)(b)) — אספקת השירות שהזמנת",
        "הסכמה (Art. 6(1)(a)) — שיווק ישיר, קוקיז לניתוח (ניתן לביטול בכל עת)",
        "אינטרס לגיטימי (Art. 6(1)(f)) — אבטחה, מניעת הונאה, שיפור השירות",
        "עמידה בחוק (Art. 6(1)(c)) — חובות דיווח ורגולטוריות",
      ]},
    ],
  },
  {
    id: "sharing",
    title: "5. שיתוף מידע עם צדדים שלישיים",
    body: [
      { type: "p", text: "אנו לא מוכרים, שוכרים או מחליפים את המידע שלך. שיתוף מתבצע רק במקרים הבאים:" },
      { type: "list", items: [
        "Supabase (מסד נתונים) — שרתי AWS, אזור ap-southeast-1 (סינגפור). DPA חתום.",
        "Stripe (תשלומים) — מוסמך PCI-DSS Level 1. מקבל רק את הנחוץ לעיבוד.",
        "ספקי AI — לעיבוד שאילתות השוואה בלבד; ללא שמירת נתונים אישיים.",
        "רשויות חוק — אך ורק בעת קבלת צו שיפוטי תקף לפי חוק ישראלי.",
      ]},
      { type: "p", text: "כל ספק שלישי כפוף להסכם עיבוד נתונים (DPA) ומחויב לאמצעי אבטחה תואמים." },
    ],
  },
  {
    id: "retention",
    title: "6. שמירת מידע",
    body: [
      { type: "list", items: [
        "חשבון פעיל — כל עוד החשבון פעיל",
        "לאחר מחיקת חשבון — 30 יום בגיבוי מוצפן, אחר כך מחיקה סופית",
        "ביקורות שפורסמו — נשמרות כחלק מהארכיון הציבורי בצורה אנונימית לאחר מחיקת חשבון",
        "כתובות IP — נמחקות אוטומטית לאחר 90 יום",
        "נתוני עסקאות — 7 שנים בהתאם לחוק החשבונאות הישראלי",
        "יומני אבטחה — 1 שנה",
      ]},
    ],
  },
  {
    id: "rights",
    title: "7. זכויותיך",
    body: [
      { type: "p", text: `בהתאם לחוק הגנת הפרטיות הישראלי וה-GDPR, עומדות לך הזכויות הבאות. לממשן, פנה ל: ${META.email}` },
      { type: "list", items: [
        "עיון (Art. 15) — לקבל עותק של כל המידע שנשמר עליך",
        "תיקון (Art. 16) — לתקן מידע שגוי",
        "מחיקה — 'הזכות להישכח' (Art. 17); כפוף לחובות שמירת מידע חוקיות",
        "הגבלת עיבוד (Art. 18) — בנסיבות מסוימות",
        "ניידות נתונים (Art. 20) — קבלת המידע שלך בפורמט JSON/CSV",
        "התנגדות (Art. 21) — לעיבוד המבוסס על אינטרס לגיטימי",
        "ביטול הסכמה — בכל עת, ללא פגיעה בחוקיות העיבוד שבוצע לפני כן",
      ]},
      { type: "p", text: `מענה תוך 30 יום. לתלונה: הרשות להגנת הפרטיות — ${META.authority}` },
    ],
  },
  {
    id: "security",
    title: "8. אבטחת מידע",
    body: [
      { type: "p", text: "אנו מיישמים אמצעים בהתאם לתקנות הגנת הפרטיות (אבטחת מידע) התשע\"ז-2017:" },
      { type: "list", items: [
        "הצפנת TLS 1.3 לכל תקשורת",
        "הצפנת מידע רגיש במנוחה (AES-256)",
        "Row Level Security (RLS) על כל טבלאות מסד הנתונים",
        "הפרדת הרשאות קפדנית לפי תפקיד (RBAC)",
        "גיבויים מוצפנים יומיים",
        "ביקורות אבטחה תקופתיות ובדיקות חדירה",
      ]},
      { type: "p", text: `במקרה של פרצת מידע שעשויה לפגוע בך — נודיע לך תוך 72 שעות בהתאם ל-GDPR Art. 34.` },
    ],
  },
  {
    id: "minors",
    title: "9. קטינים",
    body: [
      { type: "p", text: "האתר אינו מיועד לבני פחות מ-18. אנו לא אוספים ביודעין מידע מקטינים. אם הגיע לידיעתנו שנאסף מידע מקטין — נמחק אותו לאלתר. הורים/אפוטרופוסים: פנו אלינו." },
    ],
  },
  {
    id: "changes",
    title: "10. שינויים במדיניות",
    body: [
      { type: "p", text: "שינויים מהותיים (כגון: סוגי מידע חדשים, שימושים חדשים) יפורסמו בהודעה בולטת 30 יום מראש. שינויים מינוריים (ניסוח, הבהרות) — יעודכן תאריך 'עודכן לאחרונה' בלבד. המשך שימוש לאחר השינוי — מהווה הסכמה." },
    ],
  },
];

const AccordionItem = ({ section }: { section: typeof SECTIONS[0] }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03]">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-right hover:bg-white/[0.04] transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-white text-sm">{section.title}</span>
        <ChevronDown size={16} className={`text-white/40 transition-transform duration-200 shrink-0 ml-4 ${open ? "rotate-180" : ""}`} />
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
            <div className="px-6 pb-5 pt-1 border-t border-white/10 space-y-3">
              {section.body.map((block, i) => {
                if (block.type === "p") return (
                  <p key={i} className="text-sm text-white/60 leading-relaxed">{block.text}</p>
                );
                if (block.type === "subtitle") return (
                  <p key={i} className="text-sm font-semibold text-white/80 mt-3">{block.text}</p>
                );
                if (block.type === "list") return (
                  <ul key={i} className="space-y-1.5">
                    {(block.items as string[]).map((item, j) => (
                      <li key={j} className="flex gap-2 text-sm text-white/60">
                        <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
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

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="container max-w-2xl py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
            <Shield size={13} /> מסמך משפטי מחייב
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">מדיניות פרטיות</h1>
          <p className="text-white/50 text-sm">עודכן לאחרונה: {META.updated} · חל על כלל משתמשי {META.company}</p>
        </motion.div>

        <div className="space-y-2">
          {SECTIONS.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <AccordionItem section={s} />
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-8 flex items-center justify-center gap-2 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-sm text-white/50">
          <Mail size={14} className="text-emerald-400" />
          שאלות על פרטיות?&nbsp;
          <a href={`mailto:${META.email}`} className="text-emerald-400 hover:underline">{META.email}</a>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
