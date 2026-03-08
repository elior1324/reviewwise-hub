import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Shield, FileText, Users, CreditCard, Lock, AlertTriangle, Scale, Globe, RefreshCw, Mail, Ban, Handshake } from "lucide-react";
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

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <Scale size={16} /> תנאי שימוש
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              תנאי שימוש ומכירה
            </h1>
            <p className="text-muted-foreground text-lg">
              גרסה 1.0 — מרץ 2026
            </p>
            <p className="text-muted-foreground mt-2">
              תנאי שימוש אלה מסדירים את הגישה והשימוש שלכם בפלטפורמת ReviewHub ובשירותים הנלווים. אנא קראו אותם בעיון.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Introduction */}
          <Section icon={FileText} title="מבוא">
            <p>
              פלטפורמת הביקורות של ReviewHub מאפשרת לכם ליצור קשר עם צרכנים, לאסוף משובים ולקבל תובנות — ומספקת לכם את הכלים להניע חוויות צרכנים טובות יותר. המשימה שלנו היא להיות סמל אוניברסלי של אמון, והפלטפורמה שלנו בנויה על פתיחות ושיתוף פעולה.
            </p>
            <p className="mt-3">
              בין אם אתם משתמשים ב-ReviewHub בחינם ובין אם בשירותים בתשלום, עליכם לקבל תנאים אלה כדי שיהיה ברור מהן הזכויות וההתחייבויות המשפטיות שלכם ושלנו. הגישה והשימוש שלכם בשירותים מותנים בהסכמתכם לתנאים אלה.
            </p>
            <p className="mt-3">
              אתם מסכימים לתנאים אלה על ידי ביצוע אחת מהפעולות הבאות: (א) לחיצה על כפתור אישור; (ב) חתימה על טופס הזמנה; (ג) תשלום עבור מנוי; או (ד) תביעת עמוד פרופיל עסקי או שימוש בכל אחד מהשירותים שלנו.
            </p>
          </Section>

          {/* Definitions */}
          <Section icon={FileText} title="הגדרות">
            <p>
              כאשר אנו אומרים <strong>״אתם״</strong> או <strong>״שלכם״</strong> — אנו מתכוונים לישות או לעסק שאתם מייצגים. כאשר אנו אומרים <strong>״ReviewHub״</strong>, <strong>״אנחנו״</strong>, <strong>״שלנו״</strong> או <strong>״אותנו״</strong> — אנו מתכוונים לחברת ReviewHub בע"מ, הרשומה בישראל.
            </p>
            <p className="mt-3">
              <strong>״פלטפורמה״</strong> — פלטפורמת הביקורות שלנו המתארחת באתר ReviewHub, כל תת-דומיין, אפליקציה או שירות נלווה.
            </p>
            <p className="mt-3">
              <strong>״שירותים״</strong> — חשבון העסק ב-ReviewHub, שירותי הביקורות, וכל שירות נוסף שאנו מספקים כעת או בעתיד, כפי שמתואר בחומרים מסחריים שאנו מספקים לכם.
            </p>
          </Section>

          {/* Joining */}
          <Section icon={Users} title="הצטרפות ושימוש ב-ReviewHub">
            <p className="font-semibold text-foreground mb-2">עמוד פרופיל עסקי:</p>
            <p className="mb-3">
              אם אתם רוצים גישה לשירותים שלנו, עליכם (או מישהו מטעמכם) לתבוע עמוד פרופיל עסקי בפלטפורמה.
            </p>
            <p className="font-semibold text-foreground mb-2">תוכנית חינם:</p>
            <p className="mb-3">
              על ידי תביעת עמוד פרופיל עסקי, תקבלו גישה לחשבון עסקי שדרכו תוכלו להשתמש בכל השירותים הכלולים בתוכנית החינמית שלנו. תוכלו להשתמש בשירותים אלה אלא אם כן חשבונכם נמחק על ידכם או שהגישה אליו הופסקה על ידינו.
            </p>
            <p className="font-semibold text-foreground mb-2">מנויים:</p>
            <p className="mb-3">
              אם אתם נרשמים לשירותים שאינם כלולים בתוכנית החינמית (<strong>״מנוי״</strong>), תוכלו גם לגשת לשירותים אלה דרך חשבון העסק שלכם.
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li><strong>תקופת מנוי:</strong> רוב המנויים פעילים ל-12 חודשים, אך משך המנוי הספציפי יפורט בחומרים המסחריים.</li>
              <li><strong>חידוש אוטומטי:</strong> בתום כל תקופת מנוי, המנוי שלכם יתחדש אוטומטית לתקופה נוספת, אלא אם הסכמנו אחרת או שאתם או אנו מבטלים את המנוי.</li>
              <li><strong>עדכון מחיר בחידוש:</strong> בכפוף לדין, אנו רשאים להעלות את מחיר המנוי בעד 5% בחידוש, אלא אם הודענו לכם על עדכון מחיר שונה לפחות 45 ימים לפני מועד החידוש.</li>
            </ul>
          </Section>

          {/* Account */}
          <Section icon={Lock} title="חשבון עסקי ואחריות">
            <p className="mb-3">
              אתם נושאים באחריות מלאה לשליטה במי שמנהל ויכול לגשת לחשבון העסק שלכם, כיצד הוא מנוהל וכיצד אתם משתמשים בשירותים שלנו:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li><strong>שליטה בגישה:</strong> אתם קובעים מי רשאי להשתמש ולגשת לשירותים דרך חשבון העסק שלכם (<strong>״משתמשים מורשים״</strong>) ואיזו גישה יש לכל אחד מהם. תוכלו לשנות או לבטל גישה בכל עת.</li>
              <li><strong>אחריות על משתמשים:</strong> אתם אחראים לכל פעילות המשתמשים המורשים שלכם, לשימושם בשירותים ולעמידתם בתנאים אלה ובהנחיות.</li>
              <li><strong>מידע מעודכן:</strong> אתם מתחייבים לעדכן את המידע שלכם (כולל כתובת אימייל עדכנית).</li>
              <li><strong>מידע מדויק:</strong> אתם אחראים לספק מידע אמיתי, מדויק ושלם.</li>
              <li><strong>אבטחת חשבון:</strong> אתם אחראים להגן על שם המשתמש והסיסמה שלכם מפני גניבה או שימוש לרעה.</li>
            </ul>
          </Section>

          {/* Key Responsibilities */}
          <Section icon={Handshake} title="אחריות מרכזית והנחיות">
            <p className="mb-3">
              אתם מתחייבים להשתמש בשירותים שלנו רק למטרות עסקיות חוקיות ובהתאם לתנאים אלה ולהנחיות שלנו.
            </p>
            <p className="font-semibold text-foreground mb-2">דומיינים:</p>
            <p className="mb-3">
              אתם מתחייבים כי אתם (או אחד מהשותפים שלכם) הבעלים או בעלי זכות בלעדית להפעלת הדומיין(ים) שעבורם אתם משתמשים במערכות ובשירותים שלנו.
            </p>
            <p className="font-semibold text-foreground mb-2">שליחת הזמנות ביקורת:</p>
            <p>
              אם אתם משתמשים בשירות הזמנת הביקורות שלנו, אתם נחשבים כשולח של כל הזמנה שנשלחת — לא אנחנו. באחריותכם הבלעדית לוודא שההזמנות שאתם שולחים עומדות בכל הדרישות החוקיות והרגולטוריות החלות, בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, וחוק התקשורת (בזק ושידורים), התשמ"ב-1982 (חוק הספאם).
            </p>
          </Section>

          {/* IP */}
          <Section icon={Shield} title="קניין רוחני">
            <p className="mb-3">
              אנחנו, או מעניקי הרישיונות שלנו, הבעלים של כל מה שמופיע בפלטפורמה או בשירותים שלנו — למעט תוכן של אחרים, כגון: (א) ביקורות בפלטפורמה ששייכות לכותבים שיצרו אותן; ו-(ב) כל מידע שאתם מספקים לנו בעת שליחת הזמנות לצרכנים שלכם.
            </p>
            <p className="mb-3">
              הבעלות שלנו כוללת זכויות בעיצוב, הידור, מראה ותחושה של הפלטפורמה והשירותים. היא כוללת גם זכויות ביצירות מוגנות בזכויות יוצרים, סימנים מסחריים רשומים ולא רשומים, עיצובים, קוד, המצאות וקניין רוחני אחר.
            </p>
            <p>
              אתם הבעלים של הלוגו, שם המותג, סימני המסחר וקניין רוחני אחר שלכם (<strong>״קניין רוחני של הלקוח״</strong>). אתם מעניקים לנו זכות להשתמש בקניין הרוחני שלכם למטרות מתן, ניהול והבטחת הפעולה התקינה של השירותים, הפלטפורמה והמערכות הקשורות.
            </p>
          </Section>

          {/* Prohibited Actions */}
          <Section icon={Ban} title="פעולות אסורות">
            <p className="mb-3">להלן דוגמאות חשובות לדברים שאסור לכם לעשות לעולם:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>לערער על אבטחת או שלמות הפלטפורמה או השירותים</li>
              <li>להשתמש בפלטפורמה או בשירותים באופן שעלול לפגוע בפונקציונליות או להפריע לשימוש של אחרים</li>
              <li>לגשת לפלטפורמה או לשירותים ללא הרשאה</li>
              <li>להכניס או להעלות לפלטפורמה כל תוכן הכולל וירוס או קוד זדוני</li>
              <li>לכתוב, להגיש או לרכוש ביקורות מזויפות</li>
              <li>לבצע כל פעולה מטעה, פוגענית, המפרה חוק, הפוגעת בזכויות אחרים או שאינה עומדת בהנחיות שלנו</li>
              <li>לשנות, להעתיק, להתאים, לשכפל, לפרק, לבצע הנדסה הפוכה או לחלץ את קוד המקור של כל חלק מהפלטפורמה או השירותים</li>
              <li>למכור מחדש, להעביר, להעניק רישיון או לספק את השירותים שלנו בכל דרך שלא הותרה במפורש</li>
              <li>לבצע הונאה או מעשים בלתי חוקיים אחרים דרך הפלטפורמה</li>
              <li>לנהוג באופן פוגעני או חסר כבוד כלפי עובדי ReviewHub, משתמשים או לקוחות אחרים</li>
              <li>לגרד נתונים או לבצע כריית טקסט לכל מטרה, כולל פיתוח, אימון או אימות מערכות בינה מלאכותית</li>
            </ul>
          </Section>

          {/* Pricing */}
          <Section icon={CreditCard} title="מחירים ותשלומים">
            <p className="font-semibold text-foreground mb-2">תקופות ניסיון:</p>
            <p className="mb-3">
              ייתכן שתקבלו ניסיון חינם של חלק מהשירותים שלנו לתקופה מוגבלת. אנו רשאים לבטל או לשנות את הגישה שלכם לשירותים אלה לפי שיקול דעתנו ללא הודעה מוקדמת.
            </p>
            <p className="font-semibold text-foreground mb-2">מנויים בתשלום:</p>
            <p className="mb-3">
              מחיר המנוי וכל התנאים הספציפיים מפורטים בחומרים המסחריים שאתם מקבלים בעת רכישת המנוי.
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li><strong>מחירים ללא מע"מ:</strong> המחירים שלנו אינם כוללים מסים. אתם אחראים לתשלום כל המסים החלים, כולל מע"מ בהתאם לחוק מס ערך מוסף, התשל"ו-1975.</li>
              <li><strong>ללא החזרים:</strong> אלא אם צוין אחרת בתנאים אלה, לא נהיה חייבים לכם כל החזר או זיכוי אם אתם או אנו מבטלים את המנוי.</li>
              <li><strong>תשלום בזמן:</strong> כדי להמשיך לגשת לשירותים, עליכם לבצע תשלומים בזמן. אם לא נקבל תשלום בזמן, אנו רשאים להשהות או אף לסיים את הגישה שלכם.</li>
              <li><strong>ריבית פיגורים:</strong> במקרה של איחור בתשלום, אנו שומרים לעצמנו את הזכות לגבות ריבית על סכומים בלתי משולמים, בהתאם לחוק פסיקת ריבית והצמדה, התשכ"א-1961.</li>
            </ul>
          </Section>

          {/* Privacy */}
          <Section icon={Lock} title="פרטיות ושימוש בנתונים">
            <p className="mb-3">
              אתם ואנו מסכימים לציית לכל חוקי הגנת הנתונים והפרטיות החלים, כולל חוק הגנת הפרטיות, התשמ"א-1981, ותקנותיו.
            </p>
            <p className="font-semibold text-foreground mb-2">נתוני הזמנות:</p>
            <p className="mb-3">
              כאשר אתם שולחים הזמנות לצרכנים שלכם ומוסרים לנו מידע אישי לפני שהם מגישים ביקורת (<strong>״נתוני הזמנה״</strong>), אנו מעבדים מידע זה בשמכם בהתאם להסכם עיבוד הנתונים שלנו.
            </p>
            <p>
              אתם מאשרים כי יש לכם את כל הזכויות, ההרשאות וההסכמות הנדרשות על פי חוקי הפרטיות החלים למסירת נתוני ההזמנה אלינו.
            </p>
          </Section>

          {/* Termination */}
          <Section icon={AlertTriangle} title="סיום והשעיה">
            <p className="font-semibold text-foreground mb-2">זכויות הסיום שלכם:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>ביטול חידוש:</strong> אם אינכם רוצים שהמנוי יתחדש אוטומטית, עליכם להודיע לנו לפחות 30 יום לפני תום תקופת המנוי הנוכחית.</li>
              <li><strong>סיום בשל הפרה שלנו:</strong> תוכלו לסיים את המנוי מיידית אם אנו מפרים הפרה מהותית תנאים אלה ואיננו מתקנים את ההפרה תוך 14 ימים מקבלת הודעה מכם.</li>
              <li><strong>מחיקת חשבון:</strong> בתוכנית החינמית — תוכלו לסיים את תנאים אלה על ידי הפסקת השימוש ומחיקת חשבון העסק שלכם.</li>
            </ul>
            <p className="font-semibold text-foreground mb-2">זכויות הסיום שלנו:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>אי-חידוש:</strong> אנו רשאים לסיים את המנוי שלכם בתום כל תקופת מנוי על ידי מתן הודעה של 30 ימים לפחות.</li>
              <li><strong>סיום מיידי:</strong> אנו רשאים לסיים את המנוי או הגישה שלכם מיידית אם: אתם מפרים הפרה מהותית תנאים אלה; אתם יוצרים ביקורות מזויפות; אתם לא משלמים בזמן; השימוש שלכם מהווה סיכון אבטחה; או לפי שיקול דעתנו.</li>
            </ul>
            <p className="font-semibold text-foreground mb-2">השעיה:</p>
            <p>
              אנו רשאים להשהות את כל הגישה שלכם או חלקה לפלטפורמה ו/או לשירותים אם לפי שיקול דעתנו אתם מפרים תנאים אלה, לא משלמים בזמן, או שהשימוש שלכם מהווה סיכון אבטחה.
            </p>
          </Section>

          {/* Liability */}
          <Section icon={Scale} title="אחריות והגבלות">
            <p className="font-semibold text-foreground mb-2">הגבלת אחריות:</p>
            <p className="mb-3">
              בכפוף לחוק הגנת הצרכן, התשמ"א-1981, ולכל דין מחייב אחר, השירותים והפלטפורמה מסופקים לכם על בסיס <strong>״כמות שהם״</strong> (AS IS). אנחנו ושותפינו מתנערים מכל אחריות, מפורשת או משתמעת, כולל אחריות משתמעת לאי-הפרה, סחירות והתאמה למטרה מסוימת.
            </p>
            <p className="mb-3">
              בשום מקרה לא נהיה אחראים לאובדן הכנסה או רווח, אובדן מוניטין, אובדן לקוחות, אובדן או השחתה של נתונים, אובדן חסכונות צפויים, פגיעה במוניטין, או כל נזק עקיף, תוצאתי, אגבי או עונשי אחר.
            </p>
            <p className="mb-3">
              <strong>תקרת אחריות:</strong> אחריותנו הכוללת כלפיכם בכל מקרה מוגבלת לסכום הכולל ששילמתם לנו עבור השירותים ב-12 החודשים שקדמו למועד שבו נוצרה עילת התביעה.
            </p>
            <p className="font-semibold text-foreground mb-2">שיפוי:</p>
            <p>
              אתם תשפו אותנו ואת שותפינו מפני כל הפסד, עלות, הוצאה, תביעה או חבות הנובעים מ: (א) השימוש שלכם בשירותים; (ב) הפרת חוקי הפרטיות על ידכם; או (ג) כל מעשה או מחדל שלכם הגורם להפרת נתונים.
            </p>
          </Section>

          {/* Disputes */}
          <Section icon={Scale} title="יישוב סכסוכים">
            <p className="mb-3">
              רוב הבעיות ניתנות לפתרון מהיר ולשביעות רצון כל הצדדים באמצעות פנייה אלינו דרך מרכז התמיכה שלנו.
            </p>
            <p className="font-semibold text-foreground mb-2">דין חל:</p>
            <p className="mb-3">
              תנאים אלה וכל מחלוקת או תביעה הנובעת מהם או הקשורה אליהם (כולל מחלוקות שאינן חוזיות) יהיו כפופים לדיני מדינת ישראל ויפורשו בהתאם להם.
            </p>
            <p className="font-semibold text-foreground mb-2">סמכות שיפוט:</p>
            <p>
              אתם ואנו מסכימים כי לבתי המשפט המוסמכים בתל אביב-יפו תהיה סמכות שיפוט בלעדית ליישב כל מחלוקת או תביעה הנובעת מתנאים אלה או הקשורה אליהם, בהתאם לחוק בתי המשפט [נוסח משולב], התשמ"ד-1984.
            </p>
          </Section>

          {/* General */}
          <Section icon={RefreshCw} title="הוראות כלליות">
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li><strong>שינויים בתנאים:</strong> אנו רשאים לבצע שינויים בתנאים אלה מעת לעת. נשתדל להודיע לכם מראש על שינויים מהותיים — אלא אם נדרשים לבצע שינויים מיידיים מסיבות שאינן בשליטתנו, כגון שינוי בחוק.</li>
              <li><strong>שינויים בשירותים:</strong> אנו רשאים לשנות או להפסיק אחד או יותר מהשירותים שלנו לפי שיקול דעתנו. במקרה של שינויים מהותיים בפונקציונליות, תוכלו לפנות אלינו ולפי שיקול דעתנו נחזיר לכם את החלק היחסי של דמי המנוי.</li>
              <li><strong>כוח עליון:</strong> אנחנו ושותפינו לא נהיה אחראים כלפיכם בגין כל כשל או עיכוב בביצוע מחויבויותינו הנובע מנסיבות שמעבר לשליטתנו הסבירה.</li>
              <li><strong>המחאה:</strong> אנו רשאים להמחות, להעביר או לבצע קבלנות משנה לזכויות או חובות שלנו בתנאים אלה לפי שיקול דעתנו. אתם רשאים לעשות כן רק בהסכמתנו המוקדמת בכתב.</li>
              <li><strong>הסכם מלא:</strong> כאשר אתם מסכימים לתנאים אלה, הם (ביחד עם כל חומר מסחרי לגבי המנוי הנוכחי שלכם) מהווים את ההסכם המלא ביניכם לבינינו.</li>
              <li><strong>אכיפה:</strong> אם חלק כלשהו מתנאים אלה אינו ניתן לאכיפה משפטית, חלק זה יתעלם במידה שאינו ניתן לאכיפה, אך כל השאר יישאר תקף ובר-אכיפה.</li>
              <li><strong>שפה:</strong> תנאים אלה נערכו בעברית ובאנגלית. במקרה של סתירה, הנוסח העברי יגבר.</li>
            </ul>
          </Section>

          {/* Confidentiality */}
          <Section icon={Lock} title="סודיות">
            <p>
              במהלך השימוש בשירותים או בפלטפורמה שלנו, ייתכן שתשתפו מידע סודי עמנו, ותיתכן חשיפה למידע סודי אודותינו. אתם ואנו מסכימים לנקוט באמצעים סבירים כדי להגן על המידע הסודי של הצד השני מפני גישה על ידי אנשים, ישויות או צדדים שלישיים בלתי מורשים.
            </p>
            <p className="mt-3">
              מותר לכם או לנו לשתף מידע סודי עם רשויות משפטיות, ממשלתיות או רגולטוריות אם נדרש לכך, או אם נדרש על פי דין. לצורך ההבהרה — תוכן שנוצר על ידי משתמשים ונתוני פעילות הפלטפורמה אינם נחשבים למידע סודי שלכם.
            </p>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title="יצירת קשר">
            <p>
              אם יש לכם שאלות בנוגע לתנאי שימוש אלה, אתם מוזמנים לפנות אלינו:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2 text-sm">
              <p className="font-semibold text-foreground">ReviewHub בע"מ</p>
              <p className="text-muted-foreground">כתובת: תל אביב, ישראל</p>
              <p className="text-muted-foreground">אימייל: <a href="mailto:legal@reviewhub.co.il" className="text-primary hover:underline">legal@reviewhub.co.il</a></p>
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
};

export default TermsAndConditions;
