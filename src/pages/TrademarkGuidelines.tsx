import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Stamp, ShieldCheck, Ban, Mail, RefreshCw, FileText } from "lucide-react";
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

const TrademarkGuidelines = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <Stamp size={16} /> הנחיות סימני מסחר
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              הנחיות סימני מסחר ומותג
            </h1>
            <p className="text-muted-foreground text-lg">
              גרסה 1.0 — מרץ 2026
            </p>
            <p className="text-muted-foreground mt-2">
              הנחיות אלה חלות על כל שימוש בסימני המסחר, הלוגואים, הגרפיקה והעיצובים של ReviewHub (להלן <strong>״עיצובי ReviewHub״</strong>) על ידי לקוחות הפלטפורמה.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Designs Ownership */}
          <Section icon={Stamp} title="1. עיצובי ReviewHub">
            <p className="mb-3">
              עיצובי ReviewHub הם רכוש של ReviewHub בע"מ ומוגנים בהתאם לחוק זכות יוצרים, התשס"ח-2007, פקודת סימני מסחר [נוסח חדש], התשל"ב-1972, וכל חקיקה רלוונטית אחרת.
            </p>
            <p className="mb-3">
              שום דבר בהנחיות אלה לא ייחשב כהעברת בעלות בעיצובי ReviewHub ללקוח. הלקוח מקבל רישיון לא-בלעדי בלבד לשימוש בעיצובי ReviewHub כמפורט בהנחיות אלה ובהסכם הלקוח עם ReviewHub, כל עוד ללקוח רישיון תקף.
            </p>
            <p className="mb-3">
              עיצובי ReviewHub שהלקוח רשאי להשתמש בהם זמינים דרך חשבון העסק שלו בפלטפורמה.
            </p>
            <p>
              הלקוח יציג, יאיית ויכתוב באותיות רישיות את עיצובי ReviewHub בדיוק כפי שהם מוצגים בפלטפורמה, ואינו רשאי להמציא שמות הכוללים עיצובי ReviewHub.
            </p>
          </Section>

          {/* Authorized Use */}
          <Section icon={ShieldCheck} title="2. שימוש מורשה בעיצובי ReviewHub">
            <p className="mb-3">
              הלקוח רשאי להשתמש בעיצובי ReviewHub רק בהתאם להסכם שלו עם ReviewHub או לאחר קבלת הסכמה מראש ובכתב מ-ReviewHub.
            </p>
            <p className="mb-3">
              כל גורם אחר רשאי להשתמש בעיצובי ReviewHub או בכל סימן מסחר אחר של ReviewHub, כולל סמלים גרפיים, לוגואים או שינויים שלהם, כחלק משם חברה, שם מסחרי, שם מוצר או שם שירות — רק לאחר קבלת הסכמה מראש ובכתב מ-ReviewHub או אם הדבר מותר על פי דין מחייב.
            </p>
            <p className="font-semibold text-foreground mb-2">הלקוח רשאי להשתמש בעיצובי ReviewHub רק באופן הבא:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mb-4">
              <li>באתר האינטרנט של הלקוח</li>
              <li>בחומרי קידום מכירות של הלקוח</li>
            </ul>
            <p>
              כל שימוש אחר בעיצובי ReviewHub, לרבות אך לא רק שימוש בפרסומות טלוויזיה, מותר רק לאחר קבלת הסכמה מראש ובכתב מ-ReviewHub או אם מותר בהתאם להסכם הלקוח עם ReviewHub.
            </p>
          </Section>

          {/* Unauthorized Use */}
          <Section icon={Ban} title="3. שימוש בלתי מורשה בעיצובי ReviewHub">
            <p className="mb-3">
              הלקוח אינו רשאי להשתמש בעיצובי ReviewHub בכל דרך אחרת מזו המתוארת בהסכם הלקוח עם ReviewHub או שהוסכמה עליה בכתב.
            </p>
            <p className="mb-3 font-semibold text-foreground">בפרט, הלקוח אינו רשאי:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li>להשתמש או לרשום, כולו או חלקו, עיצובי ReviewHub או כל סימן מסחר אחר של ReviewHub — כולל סמלים גרפיים, לוגואים או שינויים שלהם — כשם חברה, שם מסחרי, שם מוצר או שם שירות, אלא אם הדבר מותר בהנחיות אלה או בהסכם הלקוח</li>
              <li>להשתמש בווריאציות אחרות של עיצובי ReviewHub לכל מטרה</li>
              <li>להשתמש בעיצובי ReviewHub או בכל סמל גרפי, לוגו או אייקון של ReviewHub באופן מזלזל או משפיל</li>
              <li>להשתמש בעיצובי ReviewHub באופן שמרמז על אישור, שיוך, חסות או תמיכה של ReviewHub במוצר או שירות של צד שלישי</li>
              <li>לרשום עיצובי ReviewHub זהים או כמעט זהים כשם דומיין, כולל כשם דומיין רמה שנייה, או להשתמש בהם כדומיין רקע</li>
            </ul>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-foreground">
                <strong>⚠️ אזהרה:</strong> כל שימוש לא מורשה בסימני המסחר של ReviewHub עלול להוביל לנקיטת הליכים משפטיים בהתאם לפקודת סימני מסחר [נוסח חדש], התשל"ב-1972, וחוק עוולות מסחריות, התשנ"ט-1999.
              </p>
            </div>
          </Section>

          {/* Inquiries */}
          <Section icon={Mail} title="4. פניות בנוגע להנחיות סימני המסחר">
            <p>
              במקרה של שאלות בנוגע להנחיות סימני המסחר, ניתן ליצור קשר עם ReviewHub בכתובת הבאה:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2 text-sm">
              <p className="font-semibold text-foreground">ReviewHub בע"מ</p>
              <p className="text-muted-foreground">כתובת: תל אביב, ישראל</p>
              <p className="text-muted-foreground">אימייל: <a href="mailto:legal@reviewhub.co.il" className="text-primary hover:underline">legal@reviewhub.co.il</a></p>
            </div>
          </Section>

          {/* Updates */}
          <Section icon={RefreshCw} title="5. עדכונים להנחיות סימני המסחר">
            <p>
              ReviewHub רשאית בכל עת לבצע שינויים בהנחיות סימני המסחר עם תחולה עתידית. ReviewHub תודיע ללקוח מראש אם ייערכו שינויים בהנחיות סימני המסחר.
            </p>
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

export default TrademarkGuidelines;
