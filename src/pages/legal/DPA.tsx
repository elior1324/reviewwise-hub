/**
 * DPA.tsx
 * הסכם עיבוד נתונים (Data Processing Agreement) — ReviewHub
 * עומד ב: GDPR Art. 28; חוק הגנת הפרטיות התשמ"א-1981 סעיף 16ב; תקנות אבטחת מידע התשע"ז-2017
 * נתיב: /legal/dpa
 *
 * ReviewHub = "מעבד" (Processor)
 * בעל העסק = "בעל המאגר" / "מאמן" (Controller)
 */
import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Shield, Server, AlertTriangle, Trash2, Eye, FileText,
  Globe, Scale, Users, Database, Bell, CheckCircle2, Mail,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Constants ─────────────────────────────────────────────────────────────────

const META = {
  updated: "מרץ 2026",
  version: "גרסת בטא — שלבי הרצה",
  company: "ReviewHub — פלטפורמה בשלבי הרצה",
  email: "support@reviewshub.info",
  privacyEmail: "privacy@reviewshub.info",
  address: "[כתובת תירשם בסיום שלבי ההרצה]",
};

// ─── Animation ─────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

// ─── Section component ─────────────────────────────────────────────────────────

const Section = ({
  icon: Icon,
  title,
  id,
  children,
}: {
  icon: React.ElementType;
  title: string;
  id?: string;
  children: ReactNode;
}) => (
  <motion.section
    id={id}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={fadeUp}
  >
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={20} className="text-primary" />
      </div>
      <h2 className="font-bold text-xl text-foreground leading-tight pt-1.5">{title}</h2>
    </div>
    <div className="pr-[52px] text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </motion.section>
);

// ─── InfoBox ───────────────────────────────────────────────────────────────────

const InfoBox = ({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "warning" | "success" }) => {
  const styles = {
    default: "bg-primary/8 border-primary/20",
    warning: "bg-amber-500/8 border-amber-500/25",
    success: "bg-emerald-500/8 border-emerald-500/20",
  };
  return (
    <div className={`p-4 rounded-xl border ${styles[variant]}`}>
      {children}
    </div>
  );
};

// ─── Sub-processor table ────────────────────────────────────────────────────────

const SUBPROCESSORS = [
  {
    name: "Supabase, Inc.",
    role: "אחסון מסד נתונים, אימות משתמשים",
    location: "ארה\"ב / סינגפור (AWS ap-southeast-1)",
    security: "DPA חתום, SOC 2 Type II, TLS 1.3 + AES-256 במנוחה",
    link: "https://supabase.com/privacy",
  },
  {
    name: "Resend, Inc.",
    role: "שליחת הודעות דואר אלקטרוני עסקיות (לא שיווקיות)",
    location: "ארה\"ב",
    security: "DPA חתום, הצפנת TLS לכל שידור",
    link: "https://resend.com/legal/privacy-policy",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

const DPA = () => (
  <div className="min-h-screen bg-background noise-overlay" dir="rtl">
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
      <div className="container py-14 md:py-20 relative">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-5 text-primary">
            <Shield size={15} /> הסכם עיבוד נתונים
          </div>
          <h1 className="font-bold text-3xl md:text-4xl text-foreground mb-3">
            Data Processing Agreement (DPA)
          </h1>
          <p className="text-muted-foreground text-lg font-medium mb-1">הסכם עיבוד נתונים</p>
          <p className="text-muted-foreground text-sm">
            גרסה 1.0 — {META.updated} · {META.version}
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            GDPR Art. 28 · חוק הגנת הפרטיות התשמ"א-1981 · תקנות אבטחת מידע התשע"ז-2017
          </p>
        </motion.div>
      </div>
    </section>

    <div className="container py-12 max-w-4xl">
      <div className="space-y-12">

        {/* Preamble */}
        <Section icon={FileText} title="הקדמה ומטרת ההסכם" id="preamble">
          <InfoBox>
            <p className="font-bold text-foreground mb-2">מהות ההסכם</p>
            <p>
              הסכם עיבוד נתונים זה (להלן: "ה-DPA") מגדיר את זכויות וחובות הצדדים ביחס לעיבוד
              נתונים אישיים של לקוחות בעל העסק, המבוצע על-ידי ReviewHub כמעבד נתונים (Processor)
              בשם בעל העסק כבעל המאגר (Controller) — בהתאם ל-GDPR Art. 28, חוק הגנת הפרטיות
              התשמ"א-1981 (סעיף 16ב), ותקנות הגנת הפרטיות (אבטחת מידע) התשע"ז-2017.
            </p>
          </InfoBox>
          <p>
            ה-DPA חל אוטומטית על כל בעל עסק שנרשם לפלטפורמת ReviewHub. השימוש בשירות מהווה
            הסכמה לתנאי DPA זה. ה-DPA הינו חלק בלתי נפרד מתנאי השימוש של ReviewHub.
          </p>
          <p className="text-xs text-muted-foreground p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
            ⚠️ שירות ReviewHub ניתן כרגע בגרסת בטא / שלבי הרצה. פרטי החברה הסופיים (מספר ח.פ.,
            כתובת רשומה) יעודכנו בסיום תהליך הרישום. עד אז, כל פנייה משפטית תופנה ל: {META.privacyEmail}
          </p>
        </Section>

        {/* Definitions */}
        <Section icon={FileText} title="1. הגדרות" id="definitions">
          <p><strong className="text-foreground">ReviewHub ("המעבד"):</strong> פלטפורמת הביקורות ReviewHub — {META.company}.</p>
          <p><strong className="text-foreground">בעל העסק ("בעל המאגר" / "הקונטרולר"):</strong> הגורם המשתמש בפלטפורמת ReviewHub לניהול ביקורות לקוחות עסקו.</p>
          <p><strong className="text-foreground">נושא מידע:</strong> אדם שנתוניו מעובדים — בדרך כלל: לקוח בעל העסק שכתב ביקורת.</p>
          <p><strong className="text-foreground">עיבוד נתונים:</strong> כל פעולה בנתונים — איסוף, אחסון, שידור, הצגה, מחיקה.</p>
          <p><strong className="text-foreground">נתונים אישיים:</strong> כל מידע המזהה או עשוי לזהות אדם — שם, דוא"ל, כתובת IP.</p>
          <p><strong className="text-foreground">מעבד משנה (Sub-processor):</strong> ספק שלישי שמסייע ל-ReviewHub בעיבוד הנתונים.</p>
        </Section>

        {/* Subject matter */}
        <Section icon={Database} title="2. נושא ומטרת עיבוד הנתונים" id="subject">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border/50 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-right p-3 font-semibold text-foreground border-b border-border/50">היבט</th>
                  <th className="text-right p-3 font-semibold text-foreground border-b border-border/50">פירוט</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ["מטרת העיבוד", "ניהול ביקורות לקוחות; שליחת הזמנות לכתיבת ביקורת; הצגת דירוגים לציבור; מניעת ביקורות מזויפות"],
                  ["סוגי נתונים", "שם הלקוח, כתובת דוא\"ל (להזמנות), תוכן הביקורת, דירוג כוכבים, כתובת IP (לאבטחה), חותמת זמן"],
                  ["קטגוריות נושאי מידע", "לקוחות ומשתמשי בעל העסק שהסכימו לכתוב ביקורת"],
                  ["משך העיבוד", "כל עוד חשבון בעל העסק פעיל, ועד 30 יום לאחר סיום ההתקשרות"],
                  ["מיקום עיבוד", "שרתי Supabase — AWS ap-southeast-1 (סינגפור) ו/או AWS us-east-1"],
                ].map(([k, v]) => (
                  <tr key={k} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground align-top whitespace-nowrap">{k}</td>
                    <td className="p-3 text-muted-foreground">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ReviewHub obligations */}
        <Section icon={CheckCircle2} title="3. התחייבויות ReviewHub כמעבד" id="obligations">
          <InfoBox variant="success">
            <p className="font-bold text-foreground mb-1">ReviewHub מתחייבת:</p>
          </InfoBox>
          <ol className="list-decimal pr-6 space-y-3">
            <li>
              <strong className="text-foreground">עיבוד על-פי הוראות בלבד:</strong>{" "}
              ReviewHub תעבד נתונים אישיים אך ורק לפי הוראות בעל העסק, או כנדרש על-פי דין חל.
              ReviewHub תעדכן את בעל העסק אם לדעתה הוראה כלשהי מפרה את הדין.
            </li>
            <li>
              <strong className="text-foreground">סודיות:</strong>{" "}
              כל עובד או קבלן של ReviewHub שיש לו גישה לנתונים אישיים מחויב בחובת סודיות
              חוזית או חוקית, גם לאחר סיום העסקתו.
            </li>
            <li>
              <strong className="text-foreground">הגבלת שימוש:</strong>{" "}
              ReviewHub לא תשתמש בנתונים לצרכים שאינם מצוינים ב-DPA זה — בפרט, לא
              לפרסום, לאימון מודלי AI, או למכירה לצדדים שלישיים.
            </li>
            <li>
              <strong className="text-foreground">סיוע לבעל המאגר:</strong>{" "}
              ReviewHub תסייע לבעל העסק למלא את חובותיו כלפי נושאי מידע — לרבות מימוש
              זכויות עיון, תיקון, מחיקה, ניידות נתונים, והגבלת עיבוד — תוך <strong>30 ימים</strong> מקבלת הבקשה.
            </li>
          </ol>
        </Section>

        {/* Sub-processors */}
        <Section icon={Server} title="4. מעבדי משנה (Sub-processors)" id="subprocessors">
          <p>
            ReviewHub מאשרת לבעל העסק את השימוש במעבדי המשנה הבאים. בעל העסק
            מסכים בזאת לשימוש בהם. ReviewHub תעדכן את בעל העסק ב-30 יום מראש לפני
            הוספת מעבד משנה חדש.
          </p>

          <div className="space-y-4 mt-2">
            {SUBPROCESSORS.map((sp) => (
              <div key={sp.name} className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-muted/30">
                  <span className="font-bold text-foreground">{sp.name}</span>
                  <a href={sp.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Globe size={11} /> מדיניות פרטיות
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-border/30">
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">תפקיד</p>
                    <p className="text-sm">{sp.role}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">מיקום</p>
                    <p className="text-sm">{sp.location}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">אבטחה</p>
                    <p className="text-sm">{sp.security}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            כל מעבד משנה כפוף לחוזה עיבוד נתונים (DPA) עם ReviewHub המחיל עליו חובות
            שוות-ערך לאלו המוטלות על ReviewHub ב-DPA זה.
          </p>
        </Section>

        {/* Security */}
        <Section icon={Shield} title="5. אבטחת מידע" id="security">
          <InfoBox>
            <p className="font-semibold text-foreground mb-2">
              ReviewHub מיישמת אמצעי אבטחה בהתאם לתקנות הגנת הפרטיות (אבטחת מידע) התשע"ז-2017,
              ולרמת הסיכון הטבועה בעיבוד:
            </p>
          </InfoBox>
          <ul className="list-disc pr-6 space-y-2 mt-2">
            <li><strong className="text-foreground">הצפנת תקשורת:</strong> TLS 1.3 על כל גישה לאתר ול-API.</li>
            <li><strong className="text-foreground">הצפנת מנוחה:</strong> AES-256 לכל הנתונים האגורים בשרתי Supabase.</li>
            <li><strong className="text-foreground">בקרת גישה (RBAC):</strong> הפרדת הרשאות קפדנית לפי תפקיד — עובדי ReviewHub ניגשים לנתונים אישיים אך ורק כשנדרש לתפעול.</li>
            <li><strong className="text-foreground">Row-Level Security (RLS):</strong> כל שאילתת DB מוגבלת לנתוני המשתמש/עסק המורשה בלבד.</li>
            <li><strong className="text-foreground">סיסמאות:</strong> מאוחסנות עם bcrypt (hash חד-כיוני) — ReviewHub אינה יכולה לצפות בסיסמתך.</li>
            <li><strong className="text-foreground">גיבויים:</strong> גיבויים מוצפנים יומיים. שמירה ל-30 יום.</li>
            <li><strong className="text-foreground">ניטור:</strong> יומני אבטחה (audit_log) — שמירה ל-12 חודשים.</li>
          </ul>
        </Section>

        {/* Breach notification */}
        <Section icon={Bell} title="6. דיווח על אירועי אבטחה" id="breach">
          <InfoBox variant="warning">
            <p className="font-bold text-foreground mb-2">
              ⚡ ReviewHub מתחייבת לדווח לבעל העסק על כל חשש לדליפת מידע תוך <u>72 שעות</u> מרגע הגילוי.
            </p>
          </InfoBox>
          <p>ה-DPA מחייב ReviewHub:</p>
          <ol className="list-decimal pr-6 space-y-2">
            <li>
              <strong className="text-foreground">זיהוי מיידי:</strong>{" "}
              ReviewHub תזהה אירועי אבטחה דרך ניטור שוטף ותחקור כל חשד לאירוע.
            </li>
            <li>
              <strong className="text-foreground">הודעה ראשונית תוך 72 שעות:</strong>{" "}
              הודעה ראשונית לבעל העסק (לכתובת הדוא"ל הרשומה) תוך 72 שעות מגילוי,
              גם אם לא ידועים כל הפרטים. ההודעה תכלול: אופי האירוע, קטגוריות הנתונים
              שנפגעו, כמות נושאי המידע המשוערת, ואמצעי הצמצום שננקטו.
            </li>
            <li>
              <strong className="text-foreground">עדכון שוטף:</strong>{" "}
              ReviewHub תעביר עדכונים נוספים בהתקדם החקירה.
            </li>
            <li>
              <strong className="text-foreground">סיוע לדיווח לרשויות:</strong>{" "}
              ReviewHub תסייע לבעל העסק לדווח לרשות הגנת הפרטיות הישראלית (ILPA)
              ו/או ל-DPA האירופאי הרלוונטי — כנדרש על-פי חוק.
            </li>
          </ol>
        </Section>

        {/* Data subject rights */}
        <Section icon={Users} title="7. סיוע למימוש זכויות נושאי מידע" id="rights">
          <p>
            ReviewHub תסייע לבעל העסק למלא בקשות של נושאי מידע לפי GDPR Art. 15-22
            וחוק הגנת הפרטיות הישראלי, תוך <strong className="text-foreground">30 ימים</strong> מקבלת הבקשה:
          </p>
          <ul className="list-disc pr-6 space-y-2 mt-2">
            <li><strong className="text-foreground">עיון (Art. 15):</strong> מסירת עותק של כל הנתונים.</li>
            <li><strong className="text-foreground">תיקון (Art. 16):</strong> תיקון נתונים שגויים.</li>
            <li><strong className="text-foreground">מחיקה — "זכות להישכח" (Art. 17):</strong> מחיקת נתונים אישיים, בכפוף לחובות שמירה חוקיות.</li>
            <li><strong className="text-foreground">ניידות נתונים (Art. 20):</strong> מסירת הנתונים בפורמט JSON/CSV.</li>
            <li><strong className="text-foreground">הגבלת עיבוד (Art. 18):</strong> בנסיבות הקבועות בחוק.</li>
          </ul>
          <p>
            בקשות נושאי מידע שמופנות ישירות ל-ReviewHub יועברו לבעל העסק הרלוונטי
            (כבעל המאגר) תוך 5 ימי עסקים.
          </p>
        </Section>

        {/* Data deletion on termination */}
        <Section icon={Trash2} title="8. מחיקת מידע בסיום ההתקשרות" id="deletion">
          <InfoBox variant="warning">
            <p className="font-bold text-foreground">
              בסיום ההתקשרות עם ReviewHub (סגירת חשבון / ביטול מנוי / הפסקת שירות):
            </p>
          </InfoBox>
          <ol className="list-decimal pr-6 space-y-3 mt-2">
            <li>
              <strong className="text-foreground">תקופת עיכוב:</strong>{" "}
              הנתונים ייחסמו מגישה לציבור מיידית, ויישמרו בגיבוי מוצפן למשך 30 יום
              לצורך שחזור אפשרי לפי בקשה.
            </li>
            <li>
              <strong className="text-foreground">מחיקה סופית:</strong>{" "}
              לאחר 30 יום — מחיקה מלאה ובלתי הפיכה של כל הנתונים האישיים שנאספו
              בשם בעל העסק, ממסדי הנתונים הפעילים ומהגיבויים.
            </li>
            <li>
              <strong className="text-foreground">אישור בכתב:</strong>{" "}
              ReviewHub תשלח לבעל העסק אישור כתוב על ביצוע המחיקה תוך 35 ימים
              מסיום ההתקשרות.
            </li>
            <li>
              <strong className="text-foreground">חריגים:</strong>{" "}
              נתונים שחלה עליהם חובת שמירה חוקית (כגון: נתוני עסקאות — 7 שנים לפי חוק החשבונאות;
              יומני אבטחה — 12 חודשים) יישמרו למשך הנדרש בחוק בלבד.
            </li>
          </ol>
        </Section>

        {/* Audit & transparency */}
        <Section icon={Eye} title="9. ביקורת ושקיפות" id="audit">
          <ul className="list-disc pr-6 space-y-2">
            <li>
              <strong className="text-foreground">תיעוד פעולות עיבוד:</strong>{" "}
              ReviewHub מנהלת תיעוד של פעולות העיבוד (Record of Processing Activities)
              בהתאם ל-GDPR Art. 30, וזה זמין לבעל העסק על פי בקשה.
            </li>
            <li>
              <strong className="text-foreground">ביקורות אבטחה:</strong>{" "}
              ReviewHub מבצעת ביקורות אבטחה תקופתיות. תוצאות הביקורות (ללא מידע
              אבטחתי רגיש) יועמדו לרשות בעל העסק תוך 30 ימים מבקשה מנומקת.
            </li>
            <li>
              <strong className="text-foreground">Transfer Impact Assessment:</strong>{" "}
              לנתונים של נושאי מידע מהאיחוד האירופי — ReviewHub ביצעה הערכת השפעה
              להעברות לשרתי Supabase בסינגפור, בהסתמך על SCCs (Standard Contractual Clauses)
              שנחתמו עם Supabase. TIA זמין לעיון על פי בקשה כתובה.
            </li>
          </ul>
        </Section>

        {/* Law & jurisdiction */}
        <Section icon={Scale} title="10. דין חל וסמכות שיפוט" id="jurisdiction">
          <ul className="list-disc pr-6 space-y-2">
            <li>
              <strong className="text-foreground">דין ישראלי:</strong>{" "}
              DPA זה כפוף לדיני מדינת ישראל. לנושאי מידע מה-EU חל גם ה-GDPR.
            </li>
            <li>
              <strong className="text-foreground">סמכות שיפוט:</strong>{" "}
              בתי המשפט המוסמכים בעיר תל אביב-יפו.
            </li>
            <li>
              <strong className="text-foreground">שפה:</strong>{" "}
              הנוסח העברי גובר. תרגום לאנגלית לנוחיות בלבד.
            </li>
            <li>
              <strong className="text-foreground">עדכונים:</strong>{" "}
              שינויים ב-DPA יפורסמו בהודעה של 30 יום מראש לבעלי עסקים פעילים.
            </li>
          </ul>
        </Section>

        {/* Contact */}
        <Section icon={Mail} title="11. יצירת קשר ממונה הגנת מידע" id="contact">
          <div className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-2 text-sm">
            <p className="font-bold text-foreground text-base">{META.company}</p>
            <p className="text-muted-foreground">כתובת: {META.address}</p>
            <p className="text-muted-foreground">
              דוא"ל כללי:{" "}
              <a href={`mailto:${META.email}`} className="text-primary hover:underline">{META.email}</a>
            </p>
            <p className="text-muted-foreground">
              ממונה הגנת מידע / Privacy:{" "}
              <a href={`mailto:${META.privacyEmail}`} className="text-primary hover:underline">{META.privacyEmail}</a>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            DPA זה עודכן לאחרונה: <strong>{META.updated}</strong>.
            לתאריך כניסה לתוקף: DPA נכנס לתוקף עם קבלת תנאי השימוש של ReviewHub.
          </p>

          {/* Related links */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
            <a href="/privacy" className="hover:text-primary transition-colors">← מדיניות פרטיות</a>
            <span>·</span>
            <a href="/terms" className="hover:text-primary transition-colors">תנאי שימוש</a>
            <span>·</span>
            <a href="/cookies" className="hover:text-primary transition-colors">מדיניות עוגיות</a>
          </div>
        </Section>

      </div>
    </div>

    <Footer />
  </div>
);

export default DPA;
