/**
 * RefundPolicy.tsx
 * מדיניות ביטולים והחזרים — ReviewHub
 * עומד ב: חוק הגנת הצרכן התשמ"א-1981, תקנות הגנת הצרכן (ביטול עסקה) התשע"א-2010
 *          חוק כרטיסי חיוב התשמ"ו-1986
 * נתיב: /refund-policy
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronDown, Mail, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const META = {
  updated: "10 במרץ 2026",
  email:   "billing@reviewhub.co.il",
};

const HERO_BOXES = [
  { label: "ימי ביטול", value: "14", sub: "ימי עסקים מלאים לביטול ללא הסבר", color: "text-emerald-400" },
  { label: "זמן החזר", value: "5–14", sub: "ימי עסקים לקבלת הכסף חזרה", color: "text-blue-400" },
  { label: "עמלת ביטול", value: "₪0", sub: "אין עמלה על ביטול בזמן", color: "text-purple-400" },
];

const SECTIONS = [
  {
    title: "1. תחולת המדיניות",
    body: [
      { type: "p", text: "מדיניות זו חלה על שירותים בתשלום של ReviewHub בלבד:" },
      { type: "list", items: [
        "מנוי Pro לבעלי עסקים — ₪189/חודש",
        "מנוי Premium לבעלי עסקים — ₪479/חודש",
        "רווחי תוכנית שותפים — ראה סעיף 5",
      ]},
      { type: "p", text: "אינה חלה על: קורסים ושירותים של עסקים צד-שלישי הרשומים בפלטפורמה. לגבי החזרים עבורם — פנה ישירות לבעל הקורס." },
    ],
  },
  {
    title: "2. ביטול בתוך 14 ימי עסקים (חוק הגנת הצרכן)",
    body: [
      { type: "p", text: "בהתאם לחוק הגנת הצרכן התשמ\"א-1981 (סעיף 14ג) ותקנות הגנת הצרכן (ביטול עסקה) התשע\"א-2010:" },
      { type: "list", items: [
        "זכות ביטול מלאה ללא צורך בהסבר תוך 14 ימי עסקים מיום הרכישה",
        "החזר כספי מלא תוך 14 ימי עסקים מקבלת בקשת הביטול",
        "ביטול ניתן: בדואר אלקטרוני, דרך ממשק האתר (הגדרות → מנוי → ביטול), או בפנייה ישירה",
        "אין עמלת ביטול",
      ]},
    ],
  },
  {
    title: "3. ביטול לאחר 14 ימי עסקים",
    body: [
      { type: "list", items: [
        "ביטול מנוי חודשי — ניתן בכל עת; החיוב ייפסק בסוף תקופת החיוב הנוכחית",
        "אין החזר יחסי על חלק שעבר מהחודש (אלא אם כן נגרמה תקלה מצידנו)",
        "מנוי שנתי (אם יופעל בעתיד) — ביטול יקנה החזר יחסי על החודשים שנותרו",
      ]},
    ],
  },
  {
    title: "4. החזרים במקרים מיוחדים",
    body: [
      { type: "subtitle", text: "החזר מלא מובטח:" },
      { type: "list", items: [
        "תקלה טכנית של ReviewHub שמנעה שימוש ביותר מ-48 שעות רצופות",
        "חיוב כפול בטעות",
        "שירות שלא סופק כמוסכם",
      ]},
      { type: "subtitle", text: "החזר חלקי (בשיקול דעת):" },
      { type: "list", items: [
        "אם הפסקת שימוש בתוך 7 ימים מתחילת תקופת חיוב חדשה",
        "נסיבות חריגות אישיות — כל מקרה לגופו",
      ]},
      { type: "subtitle", text: "אין החזר:" },
      { type: "list", items: [
        "לאחר 14 ימי עסקים ושימוש נרחב בשירות",
        "אם חשבון הושעה בשל הפרת תנאי שימוש",
        "על אי-שביעות רצון מביקורות שקיבל עסקך (שאינן בשליטתנו)",
      ]},
    ],
  },
  {
    title: "5. תוכנית שותפים — משיכת רווחים",
    body: [
      { type: "list", items: [
        "רווחים מחושבים בסוף חודש לוח ומועברים עד ה-10 בחודש שלאחריו",
        "מינימום למשיכה: 50 ₪ — יתרה קטנה יותר תגולגל לחודש הבא",
        "רווחים שנצברו בדרכי מרמה — יבוטלו ללא החזר",
        "שינוי שיעורי עמלה: הודעה 30 יום מראש; לא חל על רווחים שנצברו לפני השינוי",
        "חשבון שנסגר: ניתן למשוך רווחים תוך 60 יום; לאחר מכן מועברים לקרן הקהילה",
      ]},
    ],
  },
  {
    title: "6. הליך הגשת בקשת ביטול/החזר",
    body: [
      { type: "p", text: `שלח דואר אלקטרוני ל-${META.email} עם:` },
      { type: "list", items: [
        "שם מלא וכתובת אימייל החשבון",
        "מספר עסקה (מופיע בחשבונית)",
        "תיאור קצר של הסיבה",
        "צילום מסך במקרה של תקלה טכנית",
      ]},
      { type: "p", text: "מענה: עד 3 ימי עסקים. עיבוד ההחזר: 5–14 ימי עסקים לאחר האישור (תלוי בחברת האשראי)." },
    ],
  },
  {
    title: "7. סכסוכי חיוב (Chargeback)",
    body: [
      { type: "p", text: `לפני פתיחת סכסוך דרך חברת האשראי — אנא פנה אלינו ל-${META.email}. ברוב המקרים נוכל לפתור מהר יותר.` },
      { type: "p", text: "אם פתחת Chargeback ללא פנייה מוקדמת — שמורה לנו הזכות לעדכן את מצב חשבונך ולדחות בקשות שירות עתידיות עד ליישוב. מדיניות זו אינה גורעת מזכויותיך לפי חוק כרטיסי חיוב." },
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
                if (block.type === "subtitle") return <p key={i} className="text-sm font-semibold text-white/80 mt-2">{block.text}</p>;
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

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="container max-w-2xl py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
            <RotateCcw size={13} /> זכויות צרכן מוגנות בחוק
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">מדיניות ביטולים והחזרים</h1>
          <p className="text-white/50 text-sm">עודכן: {META.updated} · בהתאם לחוק הגנת הצרכן התשמ"א-1981</p>
        </motion.div>

        {/* Quick stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8">
          {HERO_BOXES.map((b, i) => (
            <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-center">
              <div className={`text-2xl font-bold ${b.color} mb-1`}>{b.value}</div>
              <div className="text-[11px] text-white/40 leading-tight">{b.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* Legal note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl mb-6">
          <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-white/50 leading-relaxed">
            לפי תקנות הגנת הצרכן (ביטול עסקה) התשע"א-2010, זכות הביטול תוך 14 ימי עסקים היא <strong className="text-white/80">זכות חוקית בלתי ניתנת לוויתור</strong>.
            לא ניתן להגביל אותה בחוזה.
          </p>
        </motion.div>

        <div className="space-y-2">
          {SECTIONS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03 }}>
              <AccordionItem section={s} />
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-sm text-white/50">
          <Mail size={14} className="text-emerald-400" />
          לבקשות ביטול והחזר:&nbsp;<a href={`mailto:${META.email}`} className="text-emerald-400 hover:underline">{META.email}</a>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              מדיניות ביטול עסקה והחזרים
            </h1>
            <p className="text-muted-foreground text-lg">
              גרסה 1.0 — מרץ 2026
            </p>
            <p className="text-muted-foreground mt-2">
              מדיניות זו מסדירה את תנאי ביטול עסקאות והחזרים כספיים עבור שירותי ReviewHub בתשלום, בהתאם לחוק הגנת הצרכן, התשמ"א-1981.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Right to Cancel */}
          <Section icon={Shield} title="זכות ביטול עסקה — חוק הגנת הצרכן">
            <p className="mb-3">
              בהתאם לסעיף 14ג לחוק הגנת הצרכן, התשמ"א-1981, ולתקנות הגנת הצרכן (ביטול עסקה), התשע"א-2010, עומדת לכם הזכות לבטל עסקה בתנאים הבאים:
            </p>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-foreground mb-4">
              <p className="font-semibold mb-2">📋 זכות ביטול עסקה בעסקת מכר מרחוק:</p>
              <p>רשאים לבטל את העסקה <strong>תוך 14 ימים מיום ביצוע העסקה או מיום קבלת מסמך הגילוי</strong> (המאוחר מביניהם), ובתנאי שלא החלתם לעשות שימוש בשירות.</p>
            </div>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li><strong>תקופת ביטול:</strong> 14 ימים מיום ביצוע העסקה או מיום קבלת פרטי העסקה בכתב — לפי המאוחר.</li>
              <li><strong>אזרח ותיק / אדם עם מוגבלות / עולה חדש:</strong> זכאים לביטול תוך <strong>4 חודשים</strong> מיום ביצוע העסקה או מיום קבלת פרטי העסקה — לפי המאוחר, ובלבד שההתקשרות כללה שיחה בין הצדדים (כולל שיחה באמצעות תקשורת אלקטרונית).</li>
            </ul>
          </Section>

          {/* How to Cancel */}
          <Section icon={FileText} title="אופן ביטול העסקה">
            <p className="mb-3">ניתן לבטל עסקה באחת הדרכים הבאות:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>דוא"ל:</strong> שליחת הודעת ביטול לכתובת <a href="mailto:billing@reviewhub.co.il" className="text-primary hover:underline">billing@reviewhub.co.il</a></li>
              <li><strong>טופס מקוון:</strong> באמצעות פנייה דרך עמוד "צור קשר" באתר</li>
              <li><strong>דואר רשום:</strong> ReviewHub בע"מ, תל אביב, ישראל</li>
            </ul>
            <p className="mb-3">הודעת הביטול צריכה לכלול:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>שם מלא וכתובת אימייל של בעל החשבון</li>
              <li>שם התוכנית / מנוי שברצונכם לבטל</li>
              <li>תאריך ביצוע העסקה</li>
              <li>סיבת הביטול (לא חובה אך מומלץ)</li>
            </ul>
          </Section>

          {/* Cancellation Fees */}
          <Section icon={CreditCard} title="דמי ביטול">
            <p className="mb-3">בהתאם לחוק הגנת הצרכן:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>ביטול בתוך 14 ימים ולפני תחילת מתן השירות:</strong> ReviewHub רשאית לגבות <strong>דמי ביטול בסך 5% מערך העסקה או 100 ש"ח — הנמוך מביניהם</strong>.</li>
              <li><strong>ביטול לאחר תחילת מתן השירות:</strong> יינתן החזר יחסי (Pro Rata) עבור התקופה שלא נוצלה, בניכוי דמי ביטול כאמור.</li>
              <li><strong>ביטול לאחר 14 ימים:</strong> לא יינתן החזר כספי, אך המנוי לא יתחדש אוטומטית בתום התקופה הנוכחית.</li>
            </ul>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-foreground text-sm">
              💡 <strong>שימו לב:</strong> ביטול חידוש אוטומטי אינו מהווה ביטול עסקה. לביטול חידוש, יש להודיע לפחות 30 ימים לפני תום תקופת המנוי הנוכחית.
            </div>
          </Section>

          {/* Refund Process */}
          <Section icon={Clock} title="תהליך ההחזר הכספי">
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li>החזר כספי יבוצע <strong>תוך 14 ימי עסקים</strong> מיום קבלת הודעת הביטול.</li>
              <li>ההחזר יבוצע באותו אמצעי תשלום בו בוצעה העסקה המקורית.</li>
              <li>ReviewHub תשלח אישור ביטול ופירוט ההחזר בדוא"ל.</li>
            </ul>
          </Section>

          {/* Free Plan */}
          <Section icon={RotateCcw} title="תוכנית חינם (Starter)">
            <p>
              תוכנית החינם אינה כרוכה בתשלום ולכן אינה כפופה למדיניות ביטולים והחזרים. ניתן למחוק חשבון חינמי בכל עת דרך הגדרות החשבון.
            </p>
          </Section>

          {/* Trial Period */}
          <Section icon={Clock} title="תקופות ניסיון">
            <p className="mb-3">
              ככל שתקבלו תקופת ניסיון חינם:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li>לא ייגבה תשלום בתקופת הניסיון.</li>
              <li>בתום תקופת הניסיון, המנוי יתחדש אוטומטית לתוכנית בתשלום אלא אם תבטלו לפני כן.</li>
              <li>ביטול בתקופת הניסיון אינו כרוך בדמי ביטול.</li>
            </ul>
          </Section>

          {/* Special Cases */}
          <Section icon={AlertTriangle} title="מקרים מיוחדים">
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>תקלה טכנית:</strong> אם לא הצלחתם להשתמש בשירות עקב תקלה טכנית שלנו — תהיו זכאים להחזר מלא עבור התקופה המושפעת.</li>
              <li><strong>חיוב שגוי:</strong> במקרה של חיוב כפול או שגוי, פנו אלינו ונתקן ונחזיר את הסכום בתוך 7 ימי עסקים.</li>
              <li><strong>הפסקת שירות על ידי ReviewHub:</strong> אם ReviewHub מפסיקה שירות בתשלום, יינתן החזר יחסי עבור התקופה שלא סופקה.</li>
            </ul>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title="יצירת קשר בנושא ביטולים והחזרים">
            <p>לכל שאלה בנושא ביטול עסקה או החזר כספי:</p>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2 text-sm">
              <p className="font-semibold text-foreground">ReviewHub בע"מ</p>
              <p className="text-muted-foreground">אימייל: <a href="mailto:billing@reviewhub.co.il" className="text-primary hover:underline">billing@reviewhub.co.il</a></p>
              <p className="text-muted-foreground">כתובת: תל אביב, ישראל</p>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              מדיניות זו עודכנה לאחרונה: מרץ 2026
            </p>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
