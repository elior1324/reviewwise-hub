import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, Trash2, FileText, Users, Globe, Database, Cookie, Baby, RefreshCw, CheckCircle, ExternalLink } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <Shield size={16} /> מדיניות פרטיות
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              מדיניות פרטיות
            </h1>
            <p className="text-muted-foreground text-lg">
              גרסה 2.0 — מרץ 2026 | מעודכנת בהתאם לתיקון 13 לחוק הגנת הפרטיות
            </p>
            <p className="text-muted-foreground mt-2">
              אנו מעריכים את פרטיותכם. במדיניות זו אנו מפרטים את זכויותיכם ואת האופן שבו אנו אוספים, משתמשים, חושפים, מעבירים ומאחסנים את המידע האישי שלכם — בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, <strong>לרבות תיקון 13 (2025)</strong>, ותקנותיו.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Definitions */}
          <Section icon={FileText} title="מונחים בהם אנו משתמשים במדיניות זו">
            <p>
              כאשר אנו אומרים "ReviewHub", "אנחנו", "שלנו" או "אותנו" — אנו מתכוונים לחברת ReviewHub בע"מ, הישות האחראית לעיבוד המידע האישי שלכם בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, <strong>לרבות תיקון 13 (2025)</strong>, ותקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017.
            </p>
            <p className="mt-3">
              כאשר אנו אומרים "אתר", "פלטפורמה" או "שירות" — אנו מתכוונים לכל אתרי ReviewHub, היישומים והשירותים הנלווים.
            </p>
          </Section>

          {/* Consent */}
          <Section icon={CheckCircle} title="הסכמתך">
            <p>
              הינך מבין כי לא חלה עליך חובה חוקית למסור מידע אישי, וכי אתה מוסר את המידע מרצונך החופשי ובהסכמתך המלאה. המידע נשמר במאגרי המידע של ReviewHub, בארץ ו/או בחו"ל, ו/או אצל מי מטעמה, לצורכי מתן שירות ו/או שליחת עדכונים מקצועיים ו/או שיווקיים, בכפוף לכל דין.
            </p>
            <p className="mt-3">
              מסירת המידע האישי הנדרש לצורך יצירת חשבון וכתיבת ביקורות הינה תנאי הכרחי למתן השירות. ללא מידע זה, לצערנו, לא נוכל לספק את השירות המבוקש.
            </p>
            <p className="mt-3 font-semibold text-foreground">
              אם אינך מסכים למדיניות פרטיות זו, אנא הפסק את השימוש בפלטפורמה לאלתר.
            </p>
            <p className="mt-3 text-muted-foreground">
              המשך השימוש בפלטפורמה מהווה הסכמה מלאה לתנאי מדיניות פרטיות זו.
            </p>
          </Section>

          {/* Open Platform */}
          <Section icon={Globe} title="אנחנו פלטפורמה פתוחה">
            <p>
              כאשר אתם כותבים ביקורת, הביקורת והפרופיל שלכם יהיו גלויים לכל מי שמבקר בפלטפורמה שלנו. כל מי שמקליק על הפרופיל שלכם יוכל לראות את מיקומכם (מדינה), את כל הביקורות שכתבתם, ואת הקורסים או השירותים שסקרתם.
            </p>
            <p className="mt-3">
              באופן דומה, אם אתם בעלי עסק ומגיבים לביקורת, התגובה שלכם תהיה גלויה בפלטפורמה. אנו מחשיבים מידע זה כ<strong>מידע אישי פומבי</strong>. תוכלו לשתף כמה שתרצו — או כמה שפחות — מידע אישי ביצירת הפרופיל שלכם.
            </p>
          </Section>

          {/* Data Collection */}
          <Section icon={Database} title="מידע אישי שאנו אוספים">
            <p className="mb-4">
              מידע אישי הוא כל מידע המתייחס לאדם מזוהה או ניתן לזיהוי. כאשר אתם יוצרים חשבון, כותבים ביקורת, יוצרים חשבון עסקי, או משתמשים בפלטפורמה — ייתכן שנאסוף ונעבד מידע אישי אודותיכם.
            </p>
            <p className="font-semibold text-foreground mb-2">מידע אישי פומבי:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>פרטי חשבון משתמש: שם משתמש, תמונה, מיקום (מדינה)</li>
              <li>מידע על ביקורות ודירוגים: איזה עסק או קורס סקרתם, תאריך, תוכן הביקורת, דירוג הכוכבים</li>
              <li>מידע על ״שימושי״: כמה אנשים מצאו את הביקורת שלכם מועילה</li>
            </ul>
            <p className="font-semibold text-foreground mt-4 mb-2">מידע אישי פרטי:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>פרטי קשר: שם, כתובת אימייל, סיסמה מוצפנת</li>
              <li>מידע על מכשיר ומיקום: כתובת IP, הגדרות דפדפן, אזור זמן</li>
              <li>מידע על שימוש: היסטוריית חיפוש, אינטראקציות עם הפלטפורמה, אימיילים שנפתחו</li>
              <li>מידע אימות: נתונים שנמסרו בתהליך אימות רכישה</li>
              <li>העדפות: הסכמות שניתנו או נדחו, העדפות ניוזלטר</li>
              <li>תקשורת: הודעות שנשלחו אלינו, פניות שירות, משובים</li>
            </ul>
            <p className="font-semibold text-foreground mt-4 mb-2">לבעלי חשבון עסקי:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>פרטי חשבון עסקי: שם העסק, לוגו, תחום פעילות, אתר אינטרנט</li>
              <li>תגובות לביקורות: שם, פרטי חברה, תוכן התגובה, תאריך</li>
              <li>מידע על ביקורות מדווחות: ביקורות שדווחו, סיבת הדיווח, תאריך</li>
            </ul>
          </Section>

          {/* How We Collect */}
          <Section icon={Eye} title="כיצד אנו אוספים מידע אישי">
            <p>
              המידע האישי שאנו מעבדים נאסף בעיקר ישירות מכם — כאשר אתם מוסרים פרטים ליצירת חשבון, כותבים ביקורת, או מקיימים אינטראקציה עם הפלטפורמה.
            </p>
            <p className="mt-3">
              לעיתים אנו מקבלים מידע מצדדים שלישיים. לדוגמה, כאשר עסק מבקש מאיתנו לשלוח הזמנת ביקורת בשמו, הוא מוסר לנו את שמכם, כתובת האימייל ומספר הפניה.
            </p>
            <p className="mt-3">
              כמו כן, אנו אוספים מידע אוטומטית מהמחשב או המכשיר שלכם — כגון כתובת IP, מיקום, מידע על הדפדפן והמכשיר, ודפוסי שימוש בפלטפורמה.
            </p>
          </Section>

          {/* Data Controller */}
          <Section icon={Users} title="מי האחראי על המידע האישי שלכם?">
            <p>
              בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, "בעל מאגר מידע" הוא מי שקובע כיצד ומדוע מידע אישי מעובד. ReviewHub בע"מ היא בעלת מאגר המידע ואחראית על עיבוד המידע האישי שלכם בכל הנוגע לפלטפורמה.
            </p>
            <p className="mt-3">
              בהתאם לשירותים בהם משתמשים לקוחותינו העסקיים, גם הם עשויים להיות בעלי מאגרי מידע נפרדים לגבי הנתונים שלכם, כגון ביקורות שכתבתם ושם המשתמש שלכם.
            </p>
          </Section>

          {/* How We Use */}
          <Section icon={FileText} title="כיצד אנו משתמשים במידע האישי שלכם">
            <p className="mb-3">אנו עשויים להשתמש במידע האישי שלכם למטרות הבאות:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>מתן השירותים שלנו — כולל הצגת ביקורות, גישה לחשבון, ותפעול הפלטפורמה</li>
              <li>זיהוי שלכם כמשתמשים רשומים בעת התחברות</li>
              <li>מענה לשאלות ומתן שירות לקוחות</li>
              <li>שליחת ניוזלטרים ועדכונים (בכפוף להסכמתכם)</li>
              <li>התאמה אישית של חוויית השימוש — למשל, המלצות מותאמות</li>
              <li>ניהול פעולות עסקיות — ניתוח נתונים, ביקורות, זיהוי הונאות ופיקוח תוכן</li>
              <li>שיפור הפלטפורמה, המוצרים והשירותים שלנו</li>
              <li>עמידה בדרישות חוקיות ורגולטוריות</li>
              <li>הגנה על זכויותינו המשפטיות</li>
            </ul>
            <p className="mt-4 mb-2 font-semibold text-foreground">שימוש בבינה מלאכותית (AI):</p>
            <p className="mb-3">
              בהתאם לדרישות תיקון 13 לחוק הגנת הפרטיות, אנו מפרטים כי ReviewHub משתמשת בטכנולוגיות בינה מלאכותית לצרכים הבאים:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li><strong>זיהוי ביקורות מזויפות או הונאתיות</strong> — באמצעות ניתוח טקסט אוטומטי</li>
              <li><strong>ניתוח מגמות ויצירת דוחות תובנות</strong> — עבור בעלי עסקים</li>
              <li><strong>צ'אטבוט AI</strong> — לסיוע למשתמשים בפלטפורמה</li>
              <li><strong>השוואה חכמה</strong> — ניתוח והשוואת עסקים וקורסים</li>
              <li><strong>סריקת קטגוריות</strong> — סיווג אוטומטי של תחומי עסקים</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              שירותי ה-AI מסופקים באמצעות ספקי צד שלישי, כולל מודלים מבית Google ו-OpenAI. המידע המועבר לספקים אלה כולל את תוכן הביקורות ומידע עסקי פומבי בלבד — <strong>אין העברה של מידע אישי מזהה</strong> (כגון אימייל, שם מלא או סיסמה) לספקי ה-AI. ספקים אלה מחויבים שלא לשמור או להשתמש במידע מעבר למתן השירות.
            </p>
            <p className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 text-foreground text-sm">
              🤖 <strong>גילוי נאות:</strong> בכל מקום בפלטפורמה שבו תוכן נוצר או מנותח באמצעות AI, הדבר מצוין במפורש. תוכלו להתנגד לעיבוד המידע שלכם באמצעות AI על ידי פנייה אלינו.
            </p>
          </Section>

          {/* Legal Basis */}
          <Section icon={Shield} title="הבסיס המשפטי לעיבוד המידע">
            <p className="mb-3">אנו מעבדים את המידע האישי שלכם על בסיס העילות המשפטיות הבאות, בהתאם לחוק הגנת הפרטיות, התשמ"א-1981:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li><strong>הסכמה:</strong> כאשר נתתם הסכמה מפורשת לעיבוד המידע (למשל, הרשמה לניוזלטר או קבלת עוגיות). תוכלו לחזור בכם מהסכמתכם בכל עת.</li>
              <li><strong>ביצוע חוזה:</strong> כאשר העיבוד נחוץ לקיום ההתקשרות ביניכם לבינינו או לספק לכם את השירותים שביקשתם.</li>
              <li><strong>אינטרס לגיטימי:</strong> כאשר העיבוד נחוץ לצורך האינטרסים העסקיים הלגיטימיים שלנו, ובלבד שזכויותיכם אינן נפגעות.</li>
              <li><strong>עמידה בדרישות חוק:</strong> כאשר נדרש מאיתנו על פי חוק ישראלי לעבד או לשמור מידע.</li>
            </ul>
          </Section>

          {/* Who May Access */}
          <Section icon={Users} title="מי עשוי לגשת למידע האישי שלכם?">
            <p className="font-semibold text-foreground mb-2">מידע אישי פומבי:</p>
            <p className="mb-3">
              אנו משתפים את המידע הפומבי שלכם בפלטפורמה כדי שאחרים יוכלו לקרוא על החוויה שלכם. ברגע שפרסמתם משהו באופן פומבי, הטבע הפתוח של האינטרנט מאפשר שתוכן זה יהיה נגיש לכל אחד בעולם — כולל מנועי חיפוש (כגון Google) וישויות אחרות.
            </p>
            <p className="font-semibold text-foreground mb-2">מידע אישי פרטי:</p>
            <p className="mb-3">
              לעובדי ReviewHub מסוימים תהיה גישה למידע שלכם כדי לסייע בתפעול השירותים. הגישה מוגבלת לאלו שיש להם צורך עסקי מוצדק.
            </p>
            <p className="font-semibold text-foreground mb-2">שיתוף עם צדדים שלישיים:</p>
            <p className="mb-3 text-muted-foreground">
              ידוע לך כי המידע עשוי להימסר לצדדים שלישיים מהסיבות הבאות:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li>ספקי שירות שתומכים בתפעול הטכני של הפלטפורמה (מעבדי מידע), כגון מערכת הדואר האלקטרוני, שירותי אחסון ומחשוב, ספקי עיבוד תשלומים, מערכות ניהול נתונים וכיו"ב</li>
              <li>עסקים שעליהם כתבתם ביקורת</li>
              <li>מנועי חיפוש ופלטפורמות מקוונות</li>
              <li>ככל שההגדרות במכשיר שלכם מאפשרות כך, עשוי להימסר מידע סטטיסטי לצדדים שלישיים לצורך שיפור השירות עבורכם</li>
              <li>ככל שיתקבל צו שיפוטי מכל סוג שהוא, ומכל רשות ו/או ערכאה שיפוטית ו/או מוסד ממשלתי, המורה על מסירת פרטיכם האישיים</li>
              <li>ככל ש-ReviewHub תתמזג עם גוף אחר ו/או תתפרק — ננקוט במירב המאמצים לעדכן אתכם בטרם נעשה כן</li>
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
              <p className="flex items-center gap-2 font-semibold text-foreground mb-2">
                <ExternalLink size={16} className="text-primary" /> קישורים חיצוניים
              </p>
              <p className="text-sm text-muted-foreground">
                בעת גלישה בפלטפורמה עלולים להופיע קישורים חיצוניים שיובילו אתכם לאתרים אחרים. אנא קראו את מדיניות הפרטיות באותם אתרים לפני שאתם מזינים נתונים אישיים. ReviewHub אינה אחראית על המידע הנאסף אודותיכם באותם אתרים חיצוניים.
              </p>
            </div>
          </Section>

          {/* Data Storage */}
          <Section icon={Lock} title="כמה זמן אנו שומרים את המידע?">
            <p>
              אנו שומרים את המידע שלכם רק כל עוד יש לנו צורך בו, או כל עוד אנו נדרשים לכך על פי חוק. לאחר שאין עוד סיבה מוצדקת לשמירה, אנו מוחקים את המידע או הופכים אותו לאנונימי.
            </p>
            <p className="mt-3">
              מידע אישי שמסרתם, כולל ביקורות, נשמר כל עוד יש לכם חשבון ב-ReviewHub. אם תמחקו את חשבונכם, אנו שומרים מידע מסוים שנדרש על פי חוק, או שיש לנו אינטרס לגיטימי בשמירתו — למשל למניעת הונאות.
            </p>
          </Section>

          {/* Security */}
          <Section icon={Lock} title="כיצד אנו שומרים על אבטחת המידע?">
            <p>
              אבטחת המידע האישי שלכם היא בעדיפות עליונה. אנו נוקטים באמצעי אבטחה ארגוניים, טכניים ומנהליים מתאימים בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017, כולל:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mt-3">
              <li>הצפנת נתונים בהעברה ובמנוחה באמצעות פרוטוקול SSL</li>
              <li>בקרת גישה ברמת שורה (Row-Level Security) — כל משתמש יכול לגשת רק לנתונים שלו</li>
              <li>הגבלת גישה על בסיס ״צריך לדעת״ — רק לספקי שירות הקשורים באופן ישיר לתפעול המערכת יש גישה מבוקרת למידע הרלוונטי</li>
              <li>ניטור ותיעוד גישה למידע</li>
              <li>סקירות אבטחה תקופתיות של התשתית והקוד</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              המידע אודות המשתמשים הנו סודי ושמור בקפידה. העברת מידע המוגדר כפרטי נעשית בצורה מאובטחת ומקודדת.
            </p>
            <p className="mt-3 text-muted-foreground">
              עם זאת, ReviewHub מבהירה כי איננה מתחייבת שהפלטפורמה תתנהל כסדרה ללא כל הפרעה, ו/או שהנתונים שנאספו יהיו חסינים באופן מוחלט מפני גישה או חדירה בלתי מורשית. ידוע למשתמש כי ReviewHub לא תישא באחריות בגין כל נזק או אבדן שנגרם כתוצאה מכך, אלא בהתאם לאחריות המוטלת עליה על פי דין.
            </p>
          </Section>

          {/* Cookies */}
          <Section icon={Cookie} title="עוגיות (Cookies) — בהתאם לתיקון 13">
            <p>
              כן. אנו משתמשים בעוגיות וטכנולוגיות דומות כדי לספק, לייעל, להתאים אישית ולנתח את השירותים שלנו.
            </p>
            <p className="mt-3">
              <strong>מה זו עוגיה?</strong> עוגיה היא קובץ טקסט קטן שנשמר במכשיר שלכם כאשר אתם מבקרים באתר. היא מאפשרת לנו לזהות את המכשיר שלכם ולזכור העדפות.
            </p>
            <p className="mt-3">
              בהתאם לתיקון 13 לחוק הגנת הפרטיות, אנו מבקשים את הסכמתכם המדעת לפני הפעלת עוגיות שאינן הכרחיות. סוגי העוגיות באתר:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mt-2">
              <li><strong>עוגיות הכרחיות:</strong> נדרשות לתפעול הבסיסי של האתר (אימות, אבטחה). אלו פועלות תמיד ואינן דורשות הסכמה.</li>
              <li><strong>עוגיות ביצועים:</strong> עוזרות לנו להבין כיצד מבקרים משתמשים באתר (דורשות הסכמה)</li>
              <li><strong>עוגיות פונקציונליות:</strong> מאפשרות התאמה אישית כגון שפה ואזור (דורשות הסכמה)</li>
              <li><strong>עוגיות פרסום:</strong> משמשות להצגת מודעות רלוונטיות (דורשות הסכמה מפורשת)</li>
            </ul>
            <p className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border/50 text-foreground text-sm">
              🍪 <strong>ניהול עוגיות:</strong> בכניסה הראשונה לאתר יוצג באנר הסכמה לעוגיות. תוכלו לבחור לאשר את כל העוגיות, לאשר הכרחיות בלבד, או לדחות. ניתן לשנות את בחירתכם בכל עת דרך הגדרות הדפדפן שלכם.
            </p>
          </Section>

          {/* Your Rights - Israeli Law */}
          <Section icon={Shield} title="הזכויות שלכם — חוק הגנת הפרטיות הישראלי">
            <p className="mb-4">
              בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, ותקנות הגנת הפרטיות, עומדות לכם הזכויות הבאות:
            </p>
            <div className="space-y-4">
              <RightItem title="זכות עיון" desc="הזכות לעיין במידע האישי המוחזק אודותיכם במאגרי המידע שלנו. נשיב לבקשתכם תוך 30 יום." />
              <RightItem title="זכות תיקון" desc="אם מידע אישי אודותיכם אינו נכון, שלם, ברור או מעודכן — תוכלו לבקש לתקנו, ונפעל בהתאם." />
              <RightItem title="זכות מחיקה" desc="תוכלו לבקש מחיקה של המידע האישי שלכם ומחיקת חשבונכם, בכפוף למגבלות חוקיות. ניתן לשלוח בקשת מחיקה ל-reviewhub.il@gmail.com. לאחר מחיקת חשבון, ייתכן שנשמור מידע מסוים כנדרש בחוק." />
              <RightItem title="זכות להתנגד" desc="תוכלו להתנגד לעיבוד המידע האישי שלכם למטרות שיווק ישיר בכל עת." />
              <RightItem title="זכות לביטול הסכמה" desc="ככל שהעיבוד מבוסס על הסכמתכם, תוכלו לחזור בכם מההסכמה בכל עת — מבלי שהדבר ישפיע על חוקיות העיבוד שבוצע קודם לכן." />
              <RightItem title="הגשת תלונה" desc="אם סבורים שזכויותיכם נפגעו, תוכלו להגיש תלונה לרשות להגנת הפרטיות (הרשם של מאגרי מידע) במשרד המשפטים." />
            </div>
          </Section>

          {/* International Transfer */}
          <Section icon={Globe} title="העברת מידע בינלאומית">
            <p>
              חלק מספקי השירות שלנו ממוקמים מחוץ לישראל. אנו מעבירים מידע אישי מחוץ לגבולות ישראל רק כאשר קיימים אמצעי הגנה מתאימים, בהתאם לתקנות הגנת הפרטיות (העברת מידע אל מאגרי מידע שמחוץ לגבולות המדינה), התשס"א-2001, כולל:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mt-3">
              <li>העברה למדינות עם רמת הגנה נאותה</li>
              <li>חוזים עם סעיפי הגנת מידע מתאימים</li>
              <li>אמצעי אבטחה טכניים וארגוניים</li>
            </ul>
          </Section>

          {/* Children */}
          <Section icon={Baby} title="מידע על קטינים">
            <p>
              הפלטפורמה שלנו אינה מיועדת לילדים מתחת לגיל 18, ואיננו אוספים ביודעין מידע אישי מקטינים. אם נודע לכם שקטין מסר לנו מידע אישי, אנא צרו קשר עמנו ונמחק את המידע.
            </p>
          </Section>

          {/* Changes */}
          <Section icon={RefreshCw} title="שינויים במדיניות זו">
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת בהתאם לשינויים בחקיקה, ברגולציה או בשירותים שלנו. שינויים מהותיים יובאו לידיעתכם — באמצעות אימייל או הודעה בפלטפורמה. המשך השימוש בפלטפורמה לאחר פרסום השינויים מהווה הסכמה למדיניות המעודכנת.
            </p>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title="יצירת קשר">
            <p>
              אנו שואפים להציג מידע זה בצורה ברורה ושקופה ככל האפשר. אם יש לכם שאלות בנוגע לאופן שבו אנו מעבדים את המידע האישי שלכם, או שתרצו לממש את זכויותיכם, אתם מוזמנים לפנות אלינו:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2 text-sm">
              <p className="font-semibold text-foreground">ReviewHub בע"מ</p>
              <p className="text-muted-foreground">כתובת: תל אביב, ישראל</p>
              <p className="text-muted-foreground">אימייל: <a href="mailto:privacy@reviewhub.co.il" className="text-primary hover:underline">privacy@reviewhub.co.il</a></p>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              אם פנייתכם אלינו לא פתרה את התלונה, תוכלו להגיש תלונה לרשם מאגרי המידע ברשות להגנת הפרטיות שבמשרד המשפטים:
              {" "}
              <a href="https://www.gov.il/he/departments/the_privacy_protection_authority" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                הרשות להגנת הפרטיות
              </a>
            </p>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeUp}
    className="scroll-mt-20"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" />
      </div>
      <h2 className="font-display font-bold text-xl text-foreground">{title}</h2>
    </div>
    <div className="pr-[52px] text-muted-foreground leading-relaxed">
      {children}
    </div>
  </motion.section>
);

const RightItem = ({ title, desc }: { title: string; desc: string }) => (
  <div className="p-4 rounded-lg bg-card border border-border/50">
    <p className="font-display font-semibold text-sm text-foreground mb-1">{title}</p>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </div>
);

export default PrivacyPolicy;
