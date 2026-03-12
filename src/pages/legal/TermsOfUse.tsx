/**
 * TermsOfUse.tsx
 * תנאי שימוש — ReviewHub
 * עומד ב: חוק הגנת הצרכן התשמ"א-1981, חוק הגנת הפרטיות התשמ"א-1981,
 *         חוק איסור לשון הרע התשכ"ה-1965, חוק המחשבים התשנ"ה-1995
 * נתיב: /terms
 */
import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Scale, FileText, Users, CreditCard, Lock, AlertTriangle,
  Globe, RefreshCw, Mail, Ban, Handshake, BadgeCheck, Shield, Gavel,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Animation ────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Section component ────────────────────────────────────────────────────────

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: ReactNode;
}) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={fadeUp}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" />
      </div>
      <h2 className="font-display font-bold text-xl text-foreground">{title}</h2>
    </div>
    <div className="pr-[52px] text-muted-foreground leading-relaxed">{children}</div>
  </motion.section>
);

// ─── Page ──────────────────────────────────────────────────────────────────────

const TermsOfUse = () => (
  <div className="min-h-screen bg-background noise-overlay" dir="rtl">
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
      <div className="container py-16 md:py-24 relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
            <Scale size={16} /> תנאי שימוש
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            תנאי שימוש ומכירה
          </h1>
          <p className="text-muted-foreground text-lg">גרסה 1.0 — מרץ 2026</p>
          <p className="text-muted-foreground mt-2">
            תנאי שימוש אלה מסדירים את הגישה והשימוש שלכם בפלטפורמת ReviewHub ובשירותים הנלווים.
            אנא קראו אותם בעיון.
          </p>
        </motion.div>
      </div>
    </section>

    <div className="container py-12 max-w-4xl">
      <div className="space-y-12">

        {/* 1 — Introduction */}
        <Section icon={FileText} title="מבוא">
          <p>
            ReviewHub הינה <strong>פלטפורמה טכנולוגית בלבד</strong> המשמשת כמתווכת בין בעלי עסקים
            לצרכנים, ומאפשרת פרסום ביקורות, דירוגים ומשובים. ReviewHub אינה צד לכל עסקה,
            התקשרות או יחסים משפטיים בין בעלי העסקים לבין הצרכנים או כותבי הביקורות, ואינה
            נושאת באחריות כלשהי לתוכן, לעסקאות או ליחסים אלה.
          </p>
          <p className="mt-3">
            בין אם אתם משתמשים ב-ReviewHub בחינם ובין אם בשירותים בתשלום, עליכם לקבל תנאים אלה
            כדי שיהיה ברור מהן הזכויות וההתחייבויות המשפטיות שלכם. הגישה והשימוש שלכם
            בשירותים מותנים בהסכמתכם לתנאים אלה.
          </p>
          <p className="mt-3">
            אתם מסכימים לתנאים אלה על ידי ביצוע אחת מהפעולות הבאות: (א) לחיצה על כפתור אישור;
            (ב) חתימה על טופס הזמנה; (ג) תשלום עבור מנוי; או (ד) תביעת עמוד פרופיל עסקי או
            שימוש בכל אחד מהשירותים שלנו.
          </p>
        </Section>

        {/* 1a — Safe Harbor / Neutral Intermediary */}
        <Section icon={Gavel} title='מגן Safe Harbor — צינור להעברת מידע (חוק איסור לשון הרע, סעיף 15)'>
          <div className="mb-4 p-4 rounded-xl bg-primary/8 border border-primary/20">
            <p className="font-bold text-foreground mb-2 text-base">
              ReviewHub פועלת כ"צינור להעברת מידע" בלבד — פלטפורמה טכנולוגית ניטרלית.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              בהתאם לחוק איסור לשון הרע, התשכ"ה-1965 (סעיף 15), ולעקרון "Safe Harbor" המוכר
              בדין הישראלי ובדין הבינלאומי, ReviewHub אינה אחראית לתוכן שגולשים מפרסמים
              בפלטפורמה. ReviewHub אינה יוצרת, עורכת, מאשרת או מאמתת את תוכן הביקורות,
              ואינה נושאת באחריות פלילית או אזרחית בגינו.
            </p>
          </div>

          <p className="font-semibold text-foreground mb-2">חמשת עקרונות ה-Safe Harbor של ReviewHub:</p>
          <ol className="list-decimal pr-6 space-y-3 text-muted-foreground">
            <li>
              <strong className="text-foreground">הגדרת הפלטפורמה:</strong>{" "}
              ReviewHub היא פלטפורמה טכנולוגית המאפשרת פרסום ביקורות על-ידי משתמשים.
              ReviewHub אינה המוציא לאור, אינה עורכת את התוכן, ואינה מציגה עמדה לגביו.
            </li>
            <li>
              <strong className="text-foreground">אחריות המשתמש:</strong>{" "}
              כל משתמש המפרסם ביקורת נושא באחריות המלאה והבלעדית לתוכן שכתב, לרבות
              אחריות פלילית ואזרחית בגין לשון הרע, עובדות כוזבות, פגיעה בפרטיות
              וניגוד עניינים. <strong>כותב הביקורת מאשר זאת באופן מפורש לפני שליחת הביקורת.</strong>
            </li>
            <li>
              <strong className="text-foreground">איסור ניגוד עניינים:</strong>{" "}
              חל איסור מוחלט על כתיבת ביקורת שמטרתה הפגעה במתחרה עסקי. ReviewHub
              שומרת מידע מזהה (IP, דוא"ל, חותמות זמן) ותחשוף אותו בצו בית משפט.
            </li>
            <li>
              <strong className="text-foreground">הליך Notice & Takedown:</strong>{" "}
              כל אדם הרואה עצמו נפגע מביקורת רשאי להגיש תלונה רשמית דרך הפלטפורמה.
              ReviewHub תפעל בתום לב לבחון כל תלונה תוך 72 שעות ותשיב תוך 14 יום.
              ביצוע ההליך מעניק לפלטפורמה הגנת Safe Harbor ואינו מטיל עליה
              אחריות כצד בסכסוך.
            </li>
            <li>
              <strong className="text-foreground">שקיפות ציבורית:</strong>{" "}
              כל ביקורת שהייתה נתונה לתלונה ונשארה בפלטפורמה לאחר בדיקה תסומן בתג
              שקיפות, כך שהציבור יוכל לראות שהתוכן נבחן ואושר בתום לב על-ידי
              ReviewHub. ביקורות שהוסרו יירשמו ביומן הגלוי.
            </li>
          </ol>

          <p className="mt-4 text-xs text-muted-foreground">
            ← למידע על הגשת תלונה ראו:{" "}
            <a href="/terms#notice-takedown" className="text-primary hover:underline">
              הליך Notice & Takedown
            </a>
            . לצו גילוי זהות ראו:{" "}
            <a href="/terms#court-order" className="text-primary hover:underline">
              חשיפת זהות בצו בית משפט
            </a>
            .
          </p>
        </Section>

        {/* 2 — Definitions */}
        <Section icon={FileText} title="הגדרות">
          <p>
            כאשר אנו אומרים <strong>״אתם״</strong> או <strong>״שלכם״</strong> — אנו מתכוונים
            לישות או לעסק שאתם מייצגים. כאשר אנו אומרים <strong>״ReviewHub״</strong>,{" "}
            <strong>״אנחנו״</strong>, <strong>״שלנו״</strong> או <strong>״אותנו״</strong> — אנו
            מתכוונים לחברת ReviewHub בע&quot;מ, הרשומה בישראל.
          </p>
          <p className="mt-3">
            <strong>״פלטפורמה״</strong> — פלטפורמת הביקורות שלנו המתארחת באתר ReviewHub, כל
            תת-דומיין, אפליקציה או שירות נלווה.
          </p>
          <p className="mt-3">
            <strong>״שירותים״</strong> — חשבון העסק ב-ReviewHub, שירותי הביקורות, וכל שירות
            נוסף שאנו מספקים כעת או בעתיד.
          </p>
        </Section>

        {/* 3 — Joining */}
        <Section icon={Users} title="הצטרפות ושימוש ב-ReviewHub">
          <p className="font-semibold text-foreground mb-2">עמוד פרופיל עסקי:</p>
          <p className="mb-3">
            אם אתם רוצים גישה לשירותים שלנו, עליכם (או מישהו מטעמכם) לתבוע עמוד פרופיל עסקי
            בפלטפורמה.
          </p>
          <p className="font-semibold text-foreground mb-2">תוכנית חינם:</p>
          <p className="mb-3">
            על ידי תביעת עמוד פרופיל עסקי, תקבלו גישה לחשבון עסקי שדרכו תוכלו להשתמש בכל
            השירותים הכלולים בתוכנית החינמית שלנו.
          </p>
          <p className="font-semibold text-foreground mb-2">מנויים:</p>
          <p className="mb-3">
            אם אתם נרשמים לשירותים שאינם כלולים בתוכנית החינמית (<strong>״מנוי״</strong>),
            תוכלו גם לגשת לשירותים אלה דרך חשבון העסק שלכם.
          </p>
          <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
            <li><strong>תקופת מנוי:</strong> רוב המנויים פעילים ל-12 חודשים, אך משך המנוי הספציפי יפורט בחומרים המסחריים.</li>
            <li><strong>חידוש אוטומטי:</strong> בתום כל תקופת מנוי, המנוי שלכם יתחדש אוטומטית לתקופה נוספת, אלא אם הסכמנו אחרת או שאתם או אנו מבטלים את המנוי.</li>
            <li><strong>עדכון מחיר בחידוש:</strong> בכפוף לדין, אנו רשאים להעלות את מחיר המנוי בעד 5% בחידוש, אלא אם הודענו לכם לפחות 45 ימים מראש.</li>
          </ul>
        </Section>

        {/* 4 — Account */}
        <Section icon={Lock} title="חשבון עסקי ואחריות">
          <p className="mb-3">
            אתם נושאים באחריות מלאה לשליטה במי שמנהל ויכול לגשת לחשבון העסק שלכם:
          </p>
          <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
            <li><strong>שליטה בגישה:</strong> אתם קובעים מי רשאי להשתמש בשירותים (<strong>״משתמשים מורשים״</strong>) ואיזו גישה יש לכל אחד.</li>
            <li><strong>אחריות על משתמשים:</strong> אתם אחראים לכל פעילות המשתמשים המורשים ולעמידתם בתנאים אלה.</li>
            <li><strong>מידע מעודכן:</strong> אתם מתחייבים לעדכן את המידע שלכם (כולל כתובת אימייל עדכנית).</li>
            <li><strong>מידע מדויק:</strong> אתם אחראים לספק מידע אמיתי, מדויק ושלם.</li>
            <li><strong>אבטחת חשבון:</strong> אתם אחראים להגן על שם המשתמש והסיסמה שלכם מפני גניבה.</li>
          </ul>
        </Section>

        {/* 5 — Responsibilities */}
        <Section icon={Handshake} title="אחריות מרכזית והנחיות">
          <p className="mb-3">
            אתם מתחייבים להשתמש בשירותים שלנו רק למטרות עסקיות חוקיות ובהתאם לתנאים אלה.
          </p>
          <p className="font-semibold text-foreground mb-2">שליחת הזמנות ביקורת:</p>
          <p>
            אם אתם משתמשים בשירות הזמנת הביקורות שלנו, אתם נחשבים כשולח של כל הזמנה שנשלחת
            — לא אנחנו. באחריותכם הבלעדית לוודא שההזמנות עומדות בכל הדרישות החוקיות, בהתאם
            לחוק הגנת הפרטיות, התשמ&quot;א-1981, וחוק התקשורת (בזק ושידורים),
            התשמ&quot;ב-1982 (חוק הספאם).
          </p>
        </Section>

        {/* 6 — IP */}
        <Section icon={Shield} title="קניין רוחני">
          <p className="mb-3">
            אנחנו, או מעניקי הרישיונות שלנו, הבעלים של כל מה שמופיע בפלטפורמה או בשירותים
            שלנו — למעט תוכן של אחרים, כגון: ביקורות ששייכות לכותבים שיצרו אותן ומידע שאתם
            מספקים לנו.
          </p>
          <p className="font-semibold text-foreground mb-2">איסור שימוש לא מורשה:</p>
          <p className="mb-3">
            אסור לשנות, להעתיק, לשכפל, לבצע הנדסה הפוכה, למכור מחדש, או לנצל את הפלטפורמה
            ו/או תכניה למטרה שאינה שימוש אישי שאינו מסחרי.
          </p>
        </Section>

        {/* 7 — Prohibited */}
        <Section icon={Ban} title="פעולות אסורות">
          <p className="mb-3">להלן דוגמאות חשובות לדברים שאסור לכם לעשות לעולם:</p>
          <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
            <li>לערער על אבטחת או שלמות הפלטפורמה</li>
            <li>להשתמש בפלטפורמה באופן שעלול לפגוע בפונקציונליות</li>
            <li>לגשת לפלטפורמה ללא הרשאה</li>
            <li>להכניס קוד זדוני, וירוסים, או כל רכיב זר</li>
            <li>לכתוב, להגיש, לרכוש, לקדם או לממן ביקורות מזויפות</li>
            <li>לבצע כל פעולה מטעה, פוגענית, מפרת חוק, או פוגעת בזכויות אחרים</li>
            <li>לשנות, לפרק, לבצע הנדסה הפוכה, או לחלץ קוד מקור</li>
            <li>למכור מחדש, להעביר, או להעניק רישיון לשירותים ללא הרשאה</li>
            <li>לנהוג בצורה פוגענית או חסרת כבוד כלפי עובדי ReviewHub ומשתמשים</li>
            <li>לגרד נתונים לכל מטרה, כולל אימון מערכות בינה מלאכותית</li>
            <li><strong>איסור ביקורות מתחרים (ניגוד עניינים):</strong> כתיבת ביקורות שליליות על עסק מתחרה, או כל פעולה שמטרתה לפגוע בדירוג או במוניטין של מתחרה באמצעות הפלטפורמה. ReviewHub שומרת לעצמה את הזכות לחשוף את זהות כותב הביקורת לבית המשפט במקרה של חשד לניגוד עניינים.</li>
          </ul>
        </Section>

        {/* 8 — Pricing */}
        <Section icon={CreditCard} title="מחירים ותשלומים">
          <p className="font-semibold text-foreground mb-2">מנויים בתשלום:</p>
          <p className="mb-3">
            מחיר המנוי וכל התנאים הספציפיים מפורטים בחומרים המסחריים שאתם מקבלים בעת הרכישה.
          </p>
          <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
            <li><strong>מחירים ללא מע&quot;מ:</strong> אתם אחראים לתשלום כל המסים החלים בהתאם לחוק מס ערך מוסף, התשל&quot;ו-1975.</li>
            <li><strong>ללא החזרים:</strong> אלא אם צוין אחרת, לא נהיה חייבים החזר אם אתם או אנו מבטלים את המנוי (ראו מדיניות ביטולים).</li>
            <li><strong>תשלום בזמן:</strong> אי-תשלום בזמן עשוי להוביל להשעיית גישה.</li>
            <li><strong>ריבית פיגורים:</strong> במקרה של איחור, אנו שומרים את הזכות לגבות ריבית בהתאם לחוק פסיקת ריבית והצמדה, התשכ&quot;א-1961.</li>
          </ul>
        </Section>

        {/* 9 — User-generated content */}
        <Section icon={AlertTriangle} title="תוכן גולשים — הגבלת אחריות והפרדת אחריות משפטית">
          <p className="mb-3 p-4 rounded-lg bg-primary/10 border border-primary/20 text-foreground font-semibold">
            🔒 ReviewHub משמשת כפלטפורמה טכנולוגית בלבד.{" "}
            <strong>
              כל סכסוך, מחלוקת או תביעה הנוגעים לתוכן שפורסם בפלטפורמה — לרבות ביקורות,
              דירוגים ותגובות — הינם עניין בלעדי בין כותב התוכן לבין בעל העסק או הצד הנפגע,
              ללא כל מעורבות, אחריות או חבות מצד ReviewHub.
            </strong>
          </p>
          <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
            <li><strong>לשון הרע ודיבה:</strong> האחריות הבלעדית חלה על המשתמש שכתב התוכן, בהתאם לחוק איסור לשון הרע, התשכ&quot;ה-1965.</li>
            <li><strong>הפרת סודיות:</strong> כל גילוי מידע סודי, סודות מסחריים או מידע הנכלל ב-NDA — בהתאם לחוק עוולות מסחריות, התשנ&quot;ט-1999.</li>
            <li><strong>הפרת פרטיות:</strong> כל גילוי מידע אישי, פרטי או רגיש של צד שלישי — כל תביעה בין המפרסם לנפגע ישירות.</li>
            <li><strong>תוכן שקרי או מטעה:</strong> ביקורות מזויפות, דירוגים מניפולטיביים — האחריות חלה על כותב התוכן בלבד.</li>
            <li><strong>הפרת זכויות קניין רוחני:</strong> תביעה תופנה כלפי המפר ישירות.</li>
            <li><strong>נזקים עסקיים:</strong> ReviewHub לא תהיה צד לכל תביעה.</li>
          </ul>
          <p className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-foreground font-medium">
            ⚠️ לדיווח על תוכן פוגעני:{" "}
            <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
              support@reviewshub.info
            </a>
            . כל הליך משפטי יתנהל בין כותב התוכן לצד הנפגע ישירות, ללא מעורבות ReviewHub.
          </p>
          <p className="font-semibold text-foreground mb-2">שיפוי בגין תוכן משתמשים:</p>
          <p>
            כל משתמש המפרסם תוכן מתחייב לשפות את ReviewHub בגין כל תביעה, הוצאה, נזק או הפסד
            (כולל שכר טרחת עורכי דין) הנובעים מתוכן שפרסם.
          </p>
        </Section>

        {/* 10 — Trust Points & Affiliate Disclosure */}
        <Section icon={BadgeCheck} title="נקודות אמון ותגים">
          <p className="mb-3">
            ReviewHub עשויה להציג נקודות אמון (Trust Points), דרגות ותגים קהילתיים עבור כותבי ביקורות.
            נקודות אלה נועדו למדידת מוניטין ותרומה בלבד.
          </p>
          <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
            <li><strong>100 נקודות אמון</strong> עבור ביקורת רגילה.</li>
            <li><strong>200 נקודות אמון</strong> עבור ביקורת מאומתת (כולל בונוס אימות).</li>
            <li><strong>אפס ערך כספי:</strong> לא ניתן להמיר, למשוך, להעביר או לפדות נקודות אמון.</li>
          </ul>
        </Section>

        <Section icon={Handshake} title="קישורי הפניה ועמלות פלטפורמה">
          <p className="mb-3">
            במקרים מסוימים ReviewHub עשויה להפנות אתכם לאתרים של צדדים שלישיים באמצעות קישורים ייעודיים.
            אם תבוצע רכישה דרך קישורים אלה, ReviewHub עשויה לקבל עמלה מהעסק או מהספק.
          </p>
          <p className="mb-3">
            <strong>העמלה שייכת לפלטפורמה בלבד.</strong> משתמשים ו/או כותבי ביקורות אינם זכאים לשום חלוקת הכנסה,
            תשלום או תגמול כספי מכל סוג.
          </p>
        </Section>

        {/* 11 — Liability */}
        <Section icon={Scale} title="אחריות והגבלות">
          <p className="mb-3 p-4 rounded-lg bg-secondary/50 border border-border/50 text-foreground">
            <strong>עיקרון יסוד:</strong> ReviewHub משמשת כפלטפורמה טכנולוגית מתווכת בלבד.
            אינה צד לעסקה, יחס משפטי, סכסוך או מחלוקת בין בעלי עסקים לבין צרכנים.
          </p>
          <p className="mb-3">
            השירותים והפלטפורמה מסופקים <strong>״כמות שהם״</strong> (AS IS). אנחנו ושותפינו
            מתנערים מכל אחריות, מפורשת או משתמעת.
          </p>
          <p className="mb-3">
            <strong>תקרת אחריות:</strong> אחריותנו הכוללת מוגבלת לסכום הכולל ששילמתם לנו ב-12
            החודשים שקדמו למועד שבו נוצרה עילת התביעה.
          </p>
          <p className="font-semibold text-foreground mb-2">שיפוי:</p>
          <p>
            כל העושה שימוש בפלטפורמה מתחייב לשפות ולפצות את ReviewHub בגין כל תביעה,
            הוצאה, נזקים ושכר טרחת עורכי דין הנובעים משימוש בשירותים, הפרת תנאים אלה, או
            תוכן שפרסם.
          </p>
        </Section>

        {/* 12 — Termination */}
        <Section icon={AlertTriangle} title="סיום והשעיה">
          <p className="font-semibold text-foreground mb-2">זכויות הסיום שלכם:</p>
          <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
            <li><strong>ביטול חידוש:</strong> הודעה 30 יום לפני תום תקופת המנוי הנוכחית.</li>
            <li><strong>סיום בשל הפרה שלנו:</strong> סיום מיידי אם לא תוקנה ההפרה תוך 14 ימים מהודעה.</li>
            <li><strong>מחיקת חשבון:</strong> בתוכנית החינמית — הפסקת שימוש ומחיקת חשבון.</li>
          </ul>
          <p className="font-semibold text-foreground mb-2">זכויות הסיום שלנו:</p>
          <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
            <li><strong>אי-חידוש:</strong> הודעה 30 יום לפני תום תקופת מנוי.</li>
            <li><strong>סיום מיידי:</strong> הפרת תנאים מהותית, ביקורות מזויפות, אי-תשלום, או סיכון אבטחה.</li>
          </ul>
        </Section>

        {/* Notice & Takedown */}
        <div id="notice-takedown">
        <Section icon={Shield} title="הליך דיווח והסרת תוכן (Notice & Takedown)">
          <p className="mb-3">
            ReviewHub מפעילה הליך מובנה לטיפול בתלונות על תוכן שפורסם בפלטפורמה:
          </p>
          <ol className="list-decimal pr-6 space-y-2 text-muted-foreground mb-4">
            <li><strong>הגשת דיווח:</strong> באמצעות כפתור ה&quot;דווח&quot; או פנייה ל-<a href="mailto:support@reviewshub.info" className="text-primary hover:underline">support@reviewshub.info</a>.</li>
            <li><strong>בדיקה ראשונית:</strong> תוך 72 שעות.</li>
            <li><strong>הודעה לכותב:</strong> הכותב מקבל 7 ימים להגיב.</li>
            <li><strong>החלטה:</strong> הותרה, עריכה או הסרה.</li>
            <li><strong>היעדר תגובה:</strong> ReviewHub רשאית להסיר לפי שיקול דעתה.</li>
          </ol>
          <p className="text-muted-foreground text-sm">
            ביצוע הליך זה אינו הופך את ReviewHub לצד בסכסוך.
          </p>
        </Section>
        </div>

        {/* Court-ordered identity disclosure */}
        <div id="court-order">
        <Section icon={Shield} title="חשיפת זהות בצו בית משפט">
          <p className="mb-3">
            ReviewHub שומרת לעצמה את הזכות לחשוף מידע מזהה של משתמשים (כולל כתובת IP,
            דוא&quot;ל מאומת וחותמות זמן) בהתאם לצו בית משפט או דרישה חוקית מחייבת,
            בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981.
          </p>
        </Section>
        </div>

        {/* 13 — Third party (original) */}
        <Section icon={Globe} title="תוכן צדדים שלישיים וקישורים חיצוניים">
          <p className="mb-3">
            ReviewHub אינה אחראית לתוכן, לנכונות, לאבטחה או לחוקיות של אתרים חיצוניים
            הקשורים בפלטפורמה. שימוש בהם על אחריות המשתמש בלבד.
          </p>
        </Section>

        {/* 14 — Disputes */}
        <Section icon={Scale} title="יישוב סכסוכים">
          <p className="mb-3">רוב הבעיות ניתנות לפתרון מהיר באמצעות פנייה לתמיכה.</p>
          <p className="font-semibold text-foreground mb-2">ויתור על תביעה ייצוגית:</p>
          <p className="mb-3">
            המשתמש מסכים כי לא יגיש ולא ייקח חלק בתביעה ייצוגית נגד ReviewHub.
          </p>
          <p className="font-semibold text-foreground mb-2">דין חל וסמכות שיפוט:</p>
          <p>
            דיני מדינת ישראל. סמכות שיפוט בלעדית — בתי המשפט המוסמכים{" "}
            <strong>בעיר תל אביב-יפו</strong>.
          </p>
        </Section>

        {/* 15 — General */}
        <Section icon={RefreshCw} title="הוראות כלליות">
          <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
            <li><strong>שינויים בתנאים:</strong> נשתדל להודיע מראש על שינויים מהותיים.</li>
            <li><strong>כוח עליון:</strong> לא נישא באחריות בגין כשל הנובע מנסיבות מחוץ לשליטתנו הסבירה.</li>
            <li><strong>הסכם מלא:</strong> תנאים אלה יחד עם החומר המסחרי מהווים את ההסכם המלא.</li>
            <li><strong>שפה:</strong> נוסח עברי גובר על כל תרגום.</li>
            <li><strong>שוויון מגדרי:</strong> השימוש בלשון זכר הוא מטעמי נוחות בלבד.</li>
          </ul>
        </Section>

        {/* 16 — Cancellation summary */}
        <Section icon={CreditCard} title="ביטול עסקה והחזרים — סיכום">
          <p className="mb-3">
            בהתאם לסעיף 14ג לחוק הגנת הצרכן, התשמ&quot;א-1981, רשאים לבטל עסקה{" "}
            <strong>תוך 14 ימים</strong> מיום ביצוע העסקה, ובתנאי שלא החלתם לעשות שימוש
            בשירות.
          </p>
          <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
            <li><strong>דמי ביטול:</strong> עד 5% מערך העסקה או 100 ש&quot;ח — הנמוך.</li>
            <li><strong>ביטול לאחר תחילת שימוש:</strong> החזר יחסי (Pro Rata) בניכוי דמי ביטול.</li>
            <li><strong>ביטול לאחר 14 ימים:</strong> לא יינתן החזר, אך המנוי לא יתחדש.</li>
          </ul>
          <p className="text-sm">
            לפרטים מלאים ראו{" "}
            <a href="/refund-policy" className="text-primary hover:underline">
              מדיניות ביטולים והחזרים
            </a>
            .
          </p>
        </Section>

        {/* 17 — Contact */}
        <Section icon={Mail} title="יצירת קשר">
          <p>לשאלות בנוגע לתנאי שימוש אלה, צרו קשר:</p>
          <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2 text-sm">
            <p className="font-semibold text-foreground">ReviewHub בע&quot;מ</p>
            <p className="text-muted-foreground">כתובת: תל אביב, ישראל</p>
            <p className="text-muted-foreground">
              אימייל:{" "}
              <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
                support@reviewshub.info
              </a>
            </p>
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            תנאי שימוש אלה עודכנו לאחרונה: מרץ 2026
          </p>
        </Section>

      </div>
    </div>

    <Footer />
  </div>
);

export default TermsOfUse;
