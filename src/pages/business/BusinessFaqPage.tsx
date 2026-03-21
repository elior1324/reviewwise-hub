import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BusinessNavbar from "@/components/BusinessNavbar";
import { ChevronDown, ArrowLeft, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "איך מתחילים?",
    a: "נרשמים, יוצרים פרופיל, ומתחילים לשלוח קישורים ללקוחות. Free — ללא עלות, ללא כרטיס אשראי. הפרופיל עולה באותו יום.",
  },
  {
    q: "איך אני אוסף ביקורות?",
    a: "יוצרים קישור ייחודי מלוח הבקרה ושולחים ללקוח — דרך WhatsApp, Instagram DM, אימייל, או QR. כל קישור חד-פעמי. לא ניתן לשיתוף, לא ניתן לשימוש חוזר.",
  },
  {
    q: "הביקורות באמת מאומתות?",
    a: "כן — כמה שאפשר בסקייל. כל ביקורת מגיעה דרך טוקן ייחודי שאתה יצרת. AI בודק את התוכן לפני פרסום. ביקורת חשודה עוברת לבדיקה אנושית. אין מערכת שהיא 100%, אבל זו הרמה הגבוהה ביותר שקיימת.",
  },
  {
    q: "יכולה להיות ביקורת שקרית?",
    a: "כן. לכן יש מנגנון דיווח. דיווחת — הביקורת עוברת לבדיקה אנושית. הוסרה? נקודות המבקר מבוטלות. אנחנו לא מוחקים ביקורות שליליות. רק כאלה שמפרות כללים.",
  },
  {
    q: "אפשר למחוק ביקורת שלילית?",
    a: "לא. ביקורת לגיטימית נשארת. מה שאתה יכול: להגיב עליה ציבורית. תגובה טובה לביקורת שלילית בונה אמון יותר ממחיקתה.",
  },
  {
    q: "איך Trust Score מחושב?",
    a: "ממוצע דירוג (50%) + אחוז ביקורות מאומתות (25%) + עדכניות (15%) + מגוון מבקרים (10%). הכול מהביקורות בפועל. אין קיצורי דרך.",
  },
  {
    q: "אם אשלם יותר — הציון יעלה?",
    a: "לא. תוכנית המנוי לא נוגעת ב-Trust Score. עסק Free עם ביקורות מצוינות יציג ציון גבוה יותר מעסק Enterprise עם ביקורות בינוניות. בכוונה.",
  },
  {
    q: "מה ההבדל בין Free ל-Pro?",
    a: "Free: פרופיל, עד 50 ביקורות, תגובות. Pro: ביקורות ללא הגבלה + כל ערוצי האיסוף + אנליטיקה + תג מאומת + ווידג׳טים + השוואה תחרותית + עוזר תגובה AI.",
  },
  {
    q: "מה קורה כשמגיעים ל-50 ביקורות ב-Free?",
    a: "המערכת מפסיקה לקבל ביקורות חדשות. ביקורות קיימות נשמרות. שדרוג ל-Pro — ואפשר להמשיך.",
  },
  {
    q: "מה קורה אם אני מפסיק לשלם?",
    a: "הפרופיל נשאר פעיל. הביקורות נשמרות. גישה לפיצ׳רי Pro — אנליטיקה, ערוצי איסוף, ווידג׳טים — מוקפאת עד לחידוש.",
  },
  {
    q: "יכול לענות לביקורות?",
    a: "כן — בכל תוכנית. התגובה מופיעה ציבורית מתחת לביקורת. ב-Pro: AI מציע טיוטה. אתה תמיד מאשר לפני פרסום.",
  },
  {
    q: "מה זה תג \"מאומת\"?",
    a: 'אימות מסמכי עסק דרך מערכת AFVE. מראה ללקוחות שמדובר בעסק אמיתי שעבר בדיקה. האימות פתוח לכל תוכנית. הצגת התג בפרופיל — Pro.',
  },
  {
    q: "איך עובדים קישורי האפיליאייט?",
    a: "מצרפים קישור לפרופיל שלך. לקוח לוחץ — הקליק נרשם — הוא מועבר ליעד. ערוץ הכנסה שנשען ישירות על האמון שבנית.",
  },
  {
    q: "המערכת הוגנת לעסקים קטנים?",
    a: "כן — ובכוונה. Trust Score מחושב על בסיס איכות, לא גודל. עסק עם 20 ביקורות מצוינות יכול לנצח רשת עם 500 בינוניות. הגודל לא עוזר כאן.",
  },
  {
    q: "יש API?",
    a: "בתוכנית Enterprise — כן. ב-Free וב-Pro — לא.",
  },
  {
    q: "כמה זמן עד שביקורת מתפרסמת?",
    a: "בדרך כלל דקות. אם עברה לבדיקה אנושית — קצת יותר. אתה מקבל התראה על כל ביקורת חדשה.",
  },
  {
    q: "קישור פג תוקף ללקוח — מה קורה?",
    a: "הלקוח רואה הודעה עם אפשרות לבקש קישור חדש. תוקף מוגבל הוא חלק ממנגנון האימות — לא באג.",
  },
  {
    q: "יכול לייצא את הנתונים שלי?",
    a: "כן. GDPR compliant. הנתונים שלך — שלך.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-5 text-right text-sm font-semibold text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">
          {a}
        </p>
      )}
    </div>
  );
}

export default function BusinessFaqPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <BusinessNavbar />

      <main className="pt-20">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-zinc-900 text-white py-16 px-4 text-center">
          <div className="container max-w-2xl mx-auto">
            <HelpCircle size={36} className="text-amber-400 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold mb-3">שאלות נפוצות</h1>
            <p className="text-zinc-400 text-base">
              כל מה שצריך לדעת לפני שמתחילים — בלי עיגולים.
            </p>
          </div>
        </section>

        {/* ── FAQ list ─────────────────────────────────────────── */}
        <section className="py-14 px-4">
          <div className="container max-w-2xl mx-auto">
            <div className="rounded-2xl border border-border bg-card px-6 divide-y divide-border">
              {FAQS.map(({ q, a }) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────── */}
        <section className="py-14 px-4 bg-zinc-50 dark:bg-zinc-950 text-center">
          <div className="container max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-2">
              עדיין יש שאלה?
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              צרו קשר — נחזור אליכם.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/business/signup">
                <Button className="px-8 font-bold">
                  הצטרף בחינם
                  <ArrowLeft size={15} className="mr-2" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/business/about">
                <Button variant="outline">קרא עוד על ReviewHub לעסקים</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
