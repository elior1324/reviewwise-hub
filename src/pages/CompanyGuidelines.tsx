import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { BookOpen, Flag, Star, Users, Send, MessageSquare, ShieldAlert, Ban, AlertTriangle, Scale, Mail, Eye } from "lucide-react";
import { ReactNode } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) => (
  <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" />
      </div>
      <h2 className="font-display font-bold text-xl text-foreground">{title}</h2>
    </div>
    <div className="pr-[52px] text-muted-foreground leading-relaxed">{children}</div>
  </motion.section>
);

const CompanyGuidelines = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <BookOpen size={16} /> הנחיות לעסקים
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              הנחיות לעסקים
            </h1>
            <p className="text-muted-foreground text-lg">
              גרסה 1.0 — מרץ 2026
            </p>
            <p className="text-muted-foreground mt-2">
              המטרה שלנו היא לעזור לאנשים ולעסקים לעזור זה לזה. ReviewHub היא פלטפורמה פתוחה, עצמאית וניטרלית — אנו עוזרים לצרכנים לקבל החלטות נכונות ולעסקים לבנות אמון, לצמוח ולהשתפר.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Key Takeaways */}
          <Section icon={Star} title="עיקרי ההנחיות">
            <p className="mb-4">ההנחיות שלנו לעסקים מפורטות ומקיפות. להלן תמצית הנקודות החשובות:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li><strong>דיווח על ביקורות שמפרות את ההנחיות:</strong> עסקים יכולים לדווח על ביקורות שמפרות את ההנחיות שלנו (למשל תוכן מזיק, מידע אישי, ביקורות מזויפות), אך שימוש לרעה בכלי הדיווח אינו מתקבל.</li>
              <li><strong>ללא ביקורות מזויפות:</strong> ביקורות מזויפות אסורות בהחלט ויוסרו.</li>
              <li><strong>תביעת הפרופיל העסקי:</strong> עסקים יכולים לתבוע ולנהל את הפרופיל שלהם ב-ReviewHub, להוסיף פרטים ולהגיב לביקורות.</li>
              <li><strong>שליחת הזמנות ביקורת באופן הוגן:</strong> עסקים מוזמנים להזמין לקוחות להשאיר ביקורות, אך ההזמנות חייבות להיות הוגנות, ניטרליות ולא משוחדות, ללא תמריצים.</li>
              <li><strong>הביקורות שייכות לכותבים:</strong> ביקורות שייכות לכותבים שיצרו אותן, והם יכולים לערוך או למחוק אותן.</li>
              <li><strong>הגיבו לביקורות:</strong> עסקים צריכים להתייחס לביקורות בצורה מקצועית ומנומסת.</li>
              <li><strong>ננקוט פעולה במקרה של שימוש לרעה:</strong> שימוש לרעה בפלטפורמה עלול להוביל לפעולות כגון השעיית חשבון או הוספת אזהרות לפרופיל.</li>
            </ul>
          </Section>

          {/* Flagging Reviews */}
          <Section icon={Flag} title="כיצד ניתן לדווח על ביקורות?">
            <p className="mb-3">
              אנו עובדים קשה ברקע באמצעות אנשים וטכנולוגיה כדי לזהות תוכן שמפר את ההנחיות שלנו לפני שהוא מופיע ב-ReviewHub. אך כאשר דברים חומקים, כל אחד בקהילה שלנו יכול לעזור על ידי דיווח.
            </p>
            <p className="mb-3">
              אם אתם חושבים שביקורת מפרה את ההנחיות שלנו, תוכלו לדווח עליה דרך חשבון העסק שלכם או על ידי יצירת קשר עם צוות אמינות התוכן שלנו.
            </p>
            <p className="mb-3">
              <strong>חשוב:</strong> אי-הסכמה עם דירוג כוכבים או עם ביקורת שלילית אינה סיבה תקפה לדיווח. אנחנו לא מסירים ביקורות רק בגלל שעסק חושב שהן לא הוגנות או ביקורתיות.
            </p>
            <p>
              כאשר מדווחים על ביקורות, היו הוגנים ועקביים — דווחו על ביקורות של 5 כוכבים מאותן סיבות שאתם מדווחים על ביקורות של כוכב אחד.
            </p>
          </Section>

          {/* Reasons to Flag */}
          <Section icon={AlertTriangle} title="מאילו סיבות ניתן לדווח על ביקורת?">
            <p className="mb-4">ניתן לדווח על ביקורת מהסיבות הבאות:</p>

            <p className="font-semibold text-foreground mb-2">תוכן מזיק או בלתי חוקי:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mb-4">
              <li>שנאה או הפליה — תוכן המכוון כנגד אנשים או קבוצה על בסיס דת, מוצא, גזע, מגדר או מאפייני זהות אחרים</li>
              <li>טרור — תוכן המשבח, תומך או מייצג קבוצות שנאה</li>
              <li>איומים או אלימות — תוכן המסית או מפאר פגיעה, כולל איומים והתנהגות פוגענית</li>
              <li>תועבה — גסות חמורה, חומר מטריד, תוכן מיני מפורש</li>
              <li>לשון הרע — הצהרה כוזבת אודות אדם או עסק הפוגעת במוניטין שלהם, בהתאם לחוק איסור לשון הרע, התשכ"ה-1965</li>
            </ul>

            <p className="font-semibold text-foreground mb-2">מידע אישי:</p>
            <p className="mb-4">
              ניתן לדווח על ביקורת אם היא מכילה מידע אישי של אדם אחר — כגון שם, מספר טלפון, כתובת אימייל, או תמונות/סרטונים. זאת בהתאם לחוק הגנת הפרטיות, התשמ"א-1981.
            </p>

            <p className="font-semibold text-foreground mb-2">פרסום או תוכן קידומי:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mb-4">
              <li>קידום עסק או מוצר אחר שאינו קשור לחוויית הכותב</li>
              <li>פרסום דעות פוליטיות, דתיות או אתיות בלבד</li>
              <li>קידום הונאות, כולל הונאות פיננסיות</li>
              <li>ספאם, ג׳יבריש או תוכן שנוצר על ידי בינה מלאכותית</li>
              <li>מידע שגוי או התחזות</li>
            </ul>

            <p className="font-semibold text-foreground mb-2">לא מבוססת על חוויה אמיתית:</p>
            <p className="mb-4">
              ניתן לדווח על ביקורת אם אתם חושבים שהיא לא מבוססת על חוויה אמיתית. זכרו שביקורת יכולה להיות אמיתית גם אם אינכם מזהים את הכותב — כל אחד עם חוויה אמיתית יכול להשאיר ביקורת בכל עת, חוויות אינן מוגבלות לרכישות, וכותבים אינם חייבים להיות מוזמנים.
            </p>

            <p className="font-semibold text-foreground mb-2">הביקורת מיועדת לעסק אחר:</p>
            <p>
              ניתן לדווח על ביקורת אם היא מציינת בבירור שהיא מיועדת לעסק אחר, או לבקש להעביר ביקורת שנמצאת בפרופיל הלא נכון.
            </p>
          </Section>

          {/* Business Profile */}
          <Section icon={Users} title="פרופיל עסקי ב-ReviewHub">
            <p className="font-semibold text-foreground mb-2">מדוע העסק שלי מופיע ב-ReviewHub?</p>
            <p className="mb-3">
              הצרכנים הם שמחליטים אילו עסקים מסוקרים בפלטפורמה. ברגע שמישהו כותב ביקורת על העסק שלכם, נוצר עמוד פרופיל לאחסון והצגת ביקורות. עמוד הפרופיל יהיה גלוי גם אם לא נקטתם שום פעולה לתביעתו.
            </p>
            <p className="font-semibold text-foreground mb-2">כיצד לתבוע את הפרופיל?</p>
            <p className="mb-3">
              אם העסק שלכם מסוקר ב-ReviewHub, תוכלו בקלות לתבוע את עמוד הפרופיל שלכם. תביעת הפרופיל מקימה עבורכם חשבון עסקי ונותנת לכם את היכולת לנהל את הביקורות — כולל הגבה עליהן. לאחר התביעה, עמוד הפרופיל מציג תווית ״נתבע״ ותהיה לכם גישה לתכונות התוכנית החינמית.
            </p>
            <p>
              תוכלו גם להוסיף פרטים שימושיים להצגת תמונה מלאה יותר של העסק — כולל תיאור, שעות פעילות, מיקום וכו׳. ודאו שכל מידע שאתם מוסיפים הוא מדויק, רלוונטי ולא מטעה.
            </p>
          </Section>

          {/* Who Can Review */}
          <Section icon={Eye} title="מי יכול ומי לא יכול לכתוב ביקורת?">
            <p className="mb-3">
              אנשים מעל גיל 18 שחוו חוויה אמיתית ועדכנית עם העסק שלכם יכולים לכתוב ביקורת. חוויה אינה בהכרח רכישה — היא רחבה יותר ויכולה לכלול:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mb-4">
              <li>שיחת טלפון</li>
              <li>תכתובת באימייל</li>
              <li>צ׳אט מקוון</li>
              <li>ביקור בחנות מקוונת</li>
            </ul>
            <p className="mb-3">
              אנו מעודדים מגוון רחב של משובים, כולל ממי שחוו חוויה ולא רכשו בסופו של דבר, כי זה יכול להציע תובנות חשובות לגבי מה ניתן לשפר.
            </p>
            <p className="font-semibold text-foreground mb-2">מי לא יכול לכתוב ביקורת?</p>
            <p>
              אנחנו לא מאפשרים לאנשים עם קשר מיוחד לעסק לכתוב ביקורות שעלולות להיות מוטות — חיובית או שלילית. זה כולל אתכם, בני משפחה קרובים, עובדי העסק, או מתחרים.
            </p>
          </Section>

          {/* Review Invitations */}
          <Section icon={Send} title="כללים לשליחת הזמנות ביקורת">
            <p className="mb-4">
              אנו מעודדים אתכם להזמין את הלקוחות שלכם להשאיר ביקורות כדי לאסוף משוב נוסף על המוצרים והשירותים שלכם. ללא קשר לשיטה שתבחרו, התהליך חייב להיות הוגן וניטרלי. אנו לא מאפשרים ביקורות מתומרצות ב-ReviewHub.
            </p>

            <p className="font-semibold text-foreground mb-2">מותר ✅:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mb-4">
              <li>הזמינו אנשים שחוו חוויה אמיתית עם המוצרים או השירותים שלכם — הזמנה אחת לכל חוויה</li>
              <li>הזמינו באופן עקבי והוגן — הזמינו את כולם באותו אופן, ללא קשר לחוויה חיובית או שלילית</li>
              <li>תנו ללקוחות זמן לחוות את המוצר או השירות לפני שמבקשים משוב</li>
              <li>השתמשו בשפה הוגנת, ניטרלית ולא מוטה</li>
            </ul>

            <p className="font-semibold text-foreground mb-2">אסור ❌:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>להיות סלקטיביים בהזמנות — לבחור ולהזמין רק לקוחות שידוע לכם שחוו חוויה חיובית</li>
              <li>לכלול תוכן מטעה, הונאתי או מזיק כגון קישורי פישינג</li>
              <li>להציע שכותבים ישאירו רק ביקורות חיוביות — למשל ״אם אהבתם, השאירו לנו ביקורת של 5 כוכבים״</li>
              <li>להציע תמריצים — הנחות, קודי קופון, הגרלות, החזרים, מתנות, או כל הטבה אחרת בתמורה לביקורת</li>
              <li>להזמין לקוחות עם קשר מיוחד לעסק (בני משפחה, עובדים, בעלי מניות)</li>
              <li>ללחוץ, לסחוט או לאיים על כותבים לכתוב, לערוך או למחוק ביקורת</li>
              <li>לבקש מאנשים לכתוב ביקורות מזויפות (חיוביות או שליליות)</li>
              <li>להשתמש בשיטות הזמנה לא הוגנות או מוטות</li>
            </ul>
          </Section>

          {/* Fake Reviews */}
          <Section icon={ShieldAlert} title="ביקורות מזויפות">
            <p className="mb-3">
              ביקורות מזויפות הן ביקורות שאינן משקפות חוויות שירות או רכישה אמיתיות עם עסק. לעיתים קרובות הן נכתבות בניסיון להטעות ולתמרן את מה שצרכנים אחרים חושבים על אותו עסק (לטוב או לרע).
            </p>
            <p className="mb-3">
              ביקורות מזויפות פוגעות באמון <strong>ואסורות על פי חוק הגנת הצרכן, התשמ"א-1981</strong>. אנו לא סובלים אותן בפלטפורמה שלנו. אין לכתוב, לבקש או לעודד אנשים לכתוב ביקורות מזויפות עבור העסק שלכם.
            </p>
            <p>
              כדי להגן על הפלטפורמה שלנו, אנו משתמשים בגישה משולשת הכוללת אנשים, טכנולוגיה וקהילה. טכנולוגיית הזיהוי האוטומטית שלנו חורגת מתוכן הביקורות ומנתחת מגוון רחב של נקודות נתונים התנהגותיות. כאשר אנו מזהים ביקורות מזויפות, אנו מסירים אותן ונוקטים פעולה בהתאם למדיניות שלנו.
            </p>
          </Section>

          {/* Responding to Reviews */}
          <Section icon={MessageSquare} title="תגובה לביקורות">
            <p className="mb-3">
              אנו מעודדים עסקים להתייחס לכותבי ביקורות על ידי תגובה לביקורות. תגובה לביקורות מספקת הזדמנות לענות על שאלות לקוחות, לפתור בעיות, להביע תודה ולבנות אמון.
            </p>
            <p className="mb-3">
              הקפידו תמיד שהתגובות שלכם יהיו מנומסות ומקצועיות, ואל תכלילו דברים כמו מידע אישי, איומים או שפה תוקפנית — אחרת נסיר את התגובות שלכם.
            </p>
            <p className="font-semibold text-foreground mb-2">מה אם אינכם מסכימים עם דעת הכותב?</p>
            <p>
              ReviewHub היא מקום לשיתוף משוב על חוויות אמיתיות, ואנו נוקטים עמדה ניטרלית. אם אינכם מסכימים עם ביקורת אך היא אינה מפרה את ההנחיות שלנו, אנו ממליצים לכתוב תגובה ולספר את הצד שלכם של הסיפור, כדי שקוראים יוכלו להחליט כמה משקל לתת לביקורת. זה גם מראה שאכפת לכם באמת ממשוב הצרכנים.
            </p>
          </Section>

          {/* Misuse */}
          <Section icon={Ban} title="שימוש לרעה בפלטפורמה">
            <p className="mb-3">
              הרוב המכריע של העסקים משתמש ב-ReviewHub באופן שנועד, לטובת כולם. אך אנחנו לא מאפשרים למשתמשים לעשות שימוש לרעה בפלטפורמה שלנו, למשל:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mb-4">
              <li>הגשה או רכישה של ביקורות מזויפות</li>
              <li>שימוש לרעה בכלי הדיווח</li>
              <li>איסוף ביקורות בצורה מוטה או לא הוגנת</li>
              <li>העתקה, איסוף וניצול מסחרי של הנתונים בפלטפורמה ללא רשות (״גריטת נתונים״)</li>
            </ul>
            <p className="mb-3">
              אם תעשו שימוש לרעה בפלטפורמה, בנתונים או במותג שלנו, ננקוט פעולה — זה יכול לכלול:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>חסימת גישה או השעיית תכונות בחשבון העסק שלכם</li>
              <li>ביטול כל הסכם שיש לכם עמנו</li>
              <li>הצבת אזהרת צרכן בפרופיל שלכם</li>
              <li>הסתרת הדירוג שלכם</li>
              <li>נקיטת הליכים משפטיים בהתאם לדין הישראלי</li>
            </ul>
          </Section>

          {/* Disagreements */}
          <Section icon={Scale} title="מה אם אני לא מסכים עם החלטה?">
            <p className="mb-3">
              אם אתם מאמינים שקיבלנו החלטה שגויה לגבי הביקורות או החשבון שלכם, תוכלו ליצור קשר עמנו ולהסביר מדוע אתם חושבים שההחלטה אינה נכונה. צוות אמינות התוכן שלנו ישמח לבחון זאת מחדש.
            </p>
            <p>
              אם עדיין אינכם מסכימים עם ההחלטה, תוכלו להגיש ערעור רשמי. הנחיות אלה הן עקרונות מנחים — במקרה של עמימות, ההחלטה הסופית נתונה לשיקול דעתנו. אנו רשאים לעדכן הנחיות אלה בכל עת.
            </p>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title="יצירת קשר">
            <p>
              אם יש לכם שאלות בנוגע להנחיות אלה, אתם מוזמנים לפנות אלינו:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2 text-sm">
              <p className="font-semibold text-foreground">ReviewHub בע"מ</p>
              <p className="text-muted-foreground">כתובת: תל אביב, ישראל</p>
              <p className="text-muted-foreground">אימייל: <a href="mailto:support@reviewhub.co.il" className="text-primary hover:underline">support@reviewhub.co.il</a></p>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              הנחיות אלה עודכנו לאחרונה: מרץ 2026
            </p>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CompanyGuidelines;
