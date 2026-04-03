import AnimatedCounter from "@/components/AnimatedCounter";
import BusinessNavbar from "@/components/BusinessNavbar";
import logoIcon from "@/assets/logo-icon-cropped.png";
import BusinessFooter from "@/components/BusinessFooter";
import { HOMEPAGE_FAQ_PREVIEW } from "@/data/businessFaq";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Star, TrendingUp, Zap, BarChart3, Code,
  Award, ArrowLeft, Users, Crown, Sparkles,
  MessageSquare, FileText, Webhook, LineChart, Headphones,
  UserCheck, Globe, ChevronDown, HelpCircle, Eye, Tag
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useCallback, useEffect } from "react";


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

// ─── Features organized by tier ───────────────────────────
type Feature = { icon: any; title: string; desc: string; preview?: string; locked?: boolean; tooltip?: string };
const FREE_FEATURES: Feature[] = [
  { icon: ShieldCheck, title: "מערכת סינון ואימות", desc: "ביקורות מאומתות מקושרות לרכישה ממשית. ביקורות קהילה מסומנות בנפרד.", tooltip: "ביקורות שנכתבות לאחר רכישה מתועדת מסומנות כמאומתות ונספרות בציון האמון. ביקורות קהילה מוצגות בנפרד עם סימון ברור." },
  { icon: UserCheck, title: "פרופיל עסקי ציבורי", desc: "עמוד עסק מותאם אישית עם פרטים, לוגו ותיאור.", tooltip: "עמוד ייעודי לעסק שלכם שנגיש לכולם, כולל לוגו, תיאור, פרטי קשר ודירוג מצטבר." },
  { icon: MessageSquare, title: "תגובות לביקורות", desc: "הגיבו לביקורות של הלקוחות שלכם ובנו שיח.", tooltip: "אפשרות להגיב לכל ביקורת ישירות מהדאשבורד — מראים ללקוחות שאכפת לכם." },
  { icon: Star, title: "תג דירוג בסיסי", desc: "הציגו את הדירוג שלכם עם תג אמינות ReviewHub.", tooltip: "תג קטן עם הדירוג שלכם שאפשר לשתף או להציג, מעיד על אמינות העסק." },
];

const PRO_FEATURES: Feature[] = [
  { icon: BarChart3, title: "דאשבורד אנליטיקס", desc: "עקבו אחר דירוגים, מגמות וביקורות חדשות בזמן אמת.", tooltip: "לוח בקרה עם גרפים ונתונים בזמן אמת — דירוגים, מגמות, ביקורות חדשות ואחוזי מענה." },
  { icon: Code, title: "וידג׳טים להטמעה", desc: "הציגו ביקורות ודירוגים באתר שלכם בשורת קוד אחת.", tooltip: "קוד קצר שמטמיע קרוסלת ביקורות או תג דירוג ישירות באתר שלכם — ללא מתכנת." },
  { icon: Zap, title: "בקשות ביקורת אוטומטיות", desc: "שלחו קישורי ביקורת ייחודיים או העלו CSV של רכישות.", tooltip: "שלחו ללקוחות קישור אישי לכתיבת ביקורת, או העלו רשימת רכישות ותנו למערכת לעשות את השאר." },
  { icon: Tag, title: "Verified Deal — מודל 5/5", desc: "כל קישור רכישה מגיע עם הנחה של 5% ללומד + עמלת תפעול של 5% ל-ReviewHub. לאחר הרכישה הלומד מוזמן לכתוב ביקורת על חוויית הלקוח שלו.", tooltip: "מודל 5/5: לומד מקבל הנחה של 5% בקישור. ReviewHub גובה 5% עמלת תפעול. לאחר הרכישה, הלומד יכול לכתוב ביקורת על חוויית הלקוח שלו — ביקורות אלו מסומנות ״נרכש דרך ReviewHub״. ציון האמון מחושב באופן עצמאי ואינו מושפע." },
  { icon: Globe, title: "רשתות חברתיות ואתר", desc: "חברו YouTube, Instagram, TikTok, LinkedIn, Facebook ואתר האינטרנט שלכם לפרופיל העסקי.", tooltip: "הוסיפו קישורים לכל הרשתות החברתיות שלכם ולאתר — הכל מופיע בפרופיל העסקי." },
  { icon: Award, title: "סיכומי AI שבועיים", desc: "ניתוח אוטומטי של ביקורות עם תובנות לשיפור.", tooltip: "כל שבוע תקבלו דוח AI שמנתח את הביקורות, מזהה מגמות ונותן המלצות לשיפור." },
  { icon: Headphones, title: "תמיכה בעדיפות", desc: "תמיכה מהירה עם מענה תוך 4 שעות בימי עבודה.", tooltip: "פניות שלכם מקבלות עדיפות בתור התמיכה — המטרה שלנו היא מענה תוך 4 שעות בימי עבודה." },
];

const PREMIUM_FEATURES: Feature[] = [
  { icon: Users, title: "חיבור CRM", desc: "חברו HubSpot, Salesforce ועוד ישירות לפלטפורמה.", tooltip: "סנכרנו ביקורות ולידים ישירות למערכת ה-CRM שלכם — HubSpot, Salesforce ועוד." },
  { icon: FileText, title: "ניהול לידים והפניות", desc: "ניהול לידים אוטומטי — כל ביקורת חיובית הופכת להפניה.", tooltip: "ביקורת חיובית הופכת אוטומטית לליד — המערכת שולחת הפניה ללקוח המרוצה." },
  { icon: Webhook, title: "Webhook למערכות חיצוניות", desc: "חברו ל-Zapier, Make ולכל מערכת עם webhook.", tooltip: "כל אירוע (ביקורת חדשה, ליד וכו׳) נשלח אוטומטית ל-Zapier, Make או כל מערכת אחרת." },
  { icon: Globe, title: "Google Ads Review Stars ⭐", desc: "הציגו כוכבי דירוג ישירות במודעות Google שלכם.", tooltip: "כוכבי הדירוג שלכם מופיעים ישירות במודעות Google — מגדיל CTR ואמינות." },
  { icon: LineChart, title: "דוחות AI מתקדמים יומיים", desc: "ניתוח עמוק עם מגמות, התרעות ותחזיות.", tooltip: "דוחות AI יומיים עם ניתוח מעמיק — מגמות, התרעות על ביקורות שליליות ותחזיות." },
  { icon: Code, title: "גישת API מלאה", desc: "בנו אינטגרציות מותאמות אישית עם ה-API שלנו.", tooltip: "גישה מלאה ל-API של ReviewHub — בנו אינטגרציות מותאמות לצרכים שלכם." },
];

// All features are free — no paid plans

// Trusted companies — fetched from DB (verified businesses with good ratings)
// Smooth collapsible with measured height
const SmoothCollapse = ({ isOpen, preview, title }: { isOpen: boolean; preview?: string; title: string }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, preview]);

  return (
    <div
      className="overflow-hidden transition-[height] duration-[400ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
      style={{ height: isOpen && preview ? height : 0 }}
    >
      <div ref={contentRef}>
        {preview && (
          <div className="pt-4 pb-1">
            <img
              src={preview}
              alt={`תצוגה מקדימה — ${title}`}
              className={`rounded-lg border border-border/30 w-full transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
              loading="lazy"
            />
            <p className={`text-[11px] text-muted-foreground mt-2 text-center transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>תצוגה מקדימה של הפיצ׳ר</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BusinessLanding = () => {
  const { user } = useAuth();
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [trustedCompanies, setTrustedCompanies] = useState<{ name: string; initials: string }[]>([]);

  useEffect(() => {
    const fetchTrusted = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("name")
        .eq("verified", true)
        .gte("rating", 4)
        .order("review_count", { ascending: false })
        .limit(8);
      if (data && data.length > 0) {
        setTrustedCompanies(data.map(b => ({
          name: b.name,
          initials: b.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
        })));
      }
    };
    fetchTrusted();
  }, []);

  const toggleFeature = (title: string) => {
    setExpandedFeature(prev => prev === title ? null : title);
  };

  // All features are free — no checkout needed

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute top-20 left-1/3 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="container py-24 md:py-36 relative">
          <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
                  <ShieldCheck size={16} /> ליוצרים ובעלי עסקים
                </motion.div>
                <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight mb-4">
                  תפסיק לשכנע.<br />
                  תן ללקוחות שלך לעשות את זה בשבילך.<br />
                  <span className="gradient-text glow-text">שיווק שמבוסס על חוויית לקוח אמיתית.</span>
                </motion.h1>
                <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  רכז את כל הביקורות שלך ממספר מקורות —<br />
                  ותן ללקוחות להבין למה לבחור בך.
                </motion.p>
                <motion.div variants={fadeUp} custom={3} className="flex gap-3 flex-wrap">
                  {user ? (
                    <Link to="/business/dashboard">
                      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                        לדאשבורד שלי
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/business/signup">
                      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                        צור פרופיל עסקי
                      </Button>
                    </Link>
                  )}
                  {!user && (
                    <Link to="/business/login">
                      <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                        כבר יש לי חשבון
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
              <motion.div variants={fadeUp} custom={2} className="hidden md:block">
                <div className="rounded-2xl p-6 bg-card border border-border/50 shadow-card space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden">
                      <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm">דאשבורד ReviewHub</p>
                      <p className="text-xs text-muted-foreground">תצוגה מקדימה</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "דירוג ממוצע", value: "4.8 ⭐" },
                      { label: "ביקורות שנבדקו", value: "23" },
                      { label: "סה״כ ביקורות", value: "31" },
                      { label: "תקופת פעילות", value: "14 חו׳" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-display font-bold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <ShieldCheck size={14} />
                    <span>הנתונים מחושבים מפעילות בפלטפורמה</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof — only shown when real verified businesses exist */}
      {trustedCompanies.length > 0 && (
        <section className="border-y border-border/50 glass">
          <div className="container py-12">
            <p className="text-center text-sm text-muted-foreground mb-8 font-medium">חברות ועסקים שכבר סומכים על ReviewHub</p>
            <div className="flex flex-wrap justify-center gap-4">
              {trustedCompanies.map((company) => (
                <div key={company.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/30">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-xs">
                    {company.initials}
                  </div>
                  <span className="text-xs text-foreground font-medium">{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Demo CTA Banner */}
      <section className="bg-primary/5 border-y border-primary/20">
        <div className="container py-4">
          <Link to="/business/dashboard" className="flex items-center justify-center gap-3 group">
            <Eye size={18} className="text-primary" />
            <span className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              ראו איך הדאשבורד נראה — התחברו לחשבון שלכם
            </span>
            <ArrowLeft size={16} className="text-primary group-hover:translate-x-[-4px] transition-transform" />
          </Link>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "01", label: "שלח קישור ללקוחות שלך" },
            { value: "02", label: "הם כותבים ביקורת בקלות" },
            { value: "03", label: "כל הביקורות מתרכזות במקום אחד" },
            { value: "04", label: "לקוחות חדשים רואים ובוחרים בך" },
          ].map(({ value, label }, i) => (
            <motion.div key={label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <p className="font-display font-bold text-3xl md:text-4xl text-foreground"><AnimatedCounter value={value} /></p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Free Features */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              חינם לתמיד
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">התחילו בחינם</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">פרופיל עסקי ציבורי עם ציון שקיפות — ללא עלות</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FREE_FEATURES.map(({ icon: Icon, title, desc, preview, tooltip }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`rounded-xl p-6 bg-card border transition-all duration-300 group cursor-pointer relative ${
                  expandedFeature === title ? "border-primary/50 shadow-card-hover" : "border-border/50 hover:border-primary/30"
                }`}
                onClick={() => preview && toggleFeature(title)}
              >
                {tooltip && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="absolute top-4 left-4 w-6 h-6 rounded-full bg-muted/60 hover:bg-primary/15 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                          <HelpCircle size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px] text-sm leading-relaxed text-right" dir="rtl">
                        {tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  {preview && (
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${expandedFeature === title ? "rotate-180" : ""}`} />
                  )}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <SmoothCollapse isOpen={expandedFeature === title} preview={preview} title={title} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro Features — visible to all but clearly labeled */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Sparkles size={14} /> כלים מתקדמים — חינם
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">כלים מתקדמים לניהול נתונים</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">אנליטיקס, אוטומציה וכלי גילוי — הכל מבוסס על נתוני אמון אמיתיים. חינם לגמרי.</p>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRO_FEATURES.map(({ icon: Icon, title, desc, preview, tooltip }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`rounded-xl p-6 bg-card border transition-all duration-300 group cursor-pointer relative ${
                  expandedFeature === title ? "border-primary/50 shadow-card-hover" : "border-primary/20 hover:border-primary/40"
                }`}
                onClick={() => preview && toggleFeature(title)}
              >
                {tooltip && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="absolute top-4 left-4 w-6 h-6 rounded-full bg-muted/60 hover:bg-primary/15 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                          <HelpCircle size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px] text-sm leading-relaxed text-right" dir="rtl">
                        {tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  {preview && (
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${expandedFeature === title ? "rotate-180" : ""}`} />
                  )}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <SmoothCollapse isOpen={expandedFeature === title} preview={preview} title={title} />
              </motion.div>
            ))}
          </div>
      </section>

      {/* Enterprise Features — shown with lock icons */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <Crown size={14} /> אינטגרציות מתקדמות — חינם
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">CRM, לידים ואינטגרציות</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">חברו את ReviewHub לכל המערכות שלכם והפכו ביקורות ללידים — הכל חינם</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREMIUM_FEATURES.map(({ icon: Icon, title, desc, preview, tooltip }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`rounded-xl p-6 bg-card border transition-all duration-300 group relative cursor-pointer ${
                  expandedFeature === title ? "border-primary/50 shadow-card-hover" : "border-border/50 hover:border-primary/30"
                }`}
                onClick={() => preview && toggleFeature(title)}
              >
                {tooltip && (
                  <div className="absolute top-4 left-4">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="w-6 h-6 rounded-full bg-muted/60 hover:bg-primary/15 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                            <HelpCircle size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] text-sm leading-relaxed text-right" dir="rtl">
                          {tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  {preview && (
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 mt-7 ${expandedFeature === title ? "rotate-180" : ""}`} />
                  )}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <SmoothCollapse isOpen={expandedFeature === title} preview={preview} title={title} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free platform banner */}
      <section className="container py-16" id="pricing">
        <div className="rounded-2xl p-10 text-center bg-primary/5 border border-primary/20">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">חינם לגמרי</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-2">כל הפיצ׳רים, כל הכלים, ללא הגבלה — בחינם. אין תוכניות בתשלום, אין כרטיס אשראי, אין הגבלת זמן.</p>
          <p className="text-xs text-muted-foreground">SSL, גיבוי יומי ואבטחת מידע מלאה — כלולים. אם יחול שינוי במודל — תקבלו הודעה 30 ימים מראש.</p>
        </div>
      </section>

      {/* CTA for non-authenticated */}
      {!user && (
        <section className="container py-20">
          <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
            <div className="absolute inset-0 bg-primary/5 blur-3xl" />
            <div className="relative">
              <ShieldCheck size={32} className="mx-auto mb-4 text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
                הכל חינם. בלי הגבלת זמן.
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                צרו חשבון עסקי וקבלו גישה לכל הכלים — אנליטיקס, ווידג׳טים, AI, אינטגרציות ועוד. חינם לגמרי, ללא כרטיס אשראי.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link to="/business/signup">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary gap-2">
                    התחל לאסוף ביקורות <ArrowLeft size={16} />
                  </Button>
                </Link>
                <Link to="/business/login">
                  <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                    כבר יש לי חשבון
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA for authenticated */}
      {user && (
        <section className="container py-20">
          <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
            <div className="absolute inset-0 bg-primary/5 blur-3xl" />
            <div className="relative">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
                הציון שלכם — בלתי תלוי
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                כל הכלים פתוחים לכם בחינם. הציון שלכם מחושב באופן עצמאי ולא ניתן לרכישה.
              </p>
              <Link to="/business/dashboard">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary gap-2">
                  עברו לדאשבורד <ArrowLeft size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Collaboration paths — lightweight mention ─────────────────────── */}
      <section className="border-y border-border/50 bg-primary/5">
        <div className="container py-14">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
              <Tag size={14} aria-hidden="true" /> שיתוף פעולה שיווקי — אופציונלי
            </div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-3">
              2 דרכים להגדיל פעילות דרך הפרופיל שלכם
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              לאחר ההרשמה תוכלו לבחור מסלול שמתאים לכם — מסלול הנחה ללקוחות שמגיעים דרך ReviewHub, או מסלול חשיפה שמתמקד בחיזוק הנוכחות ובאמון ללא תמחור פרומואי. שניהם אופציונליים ולא משפיעים על ציון האמון.
            </p>
            <Link to="/business/about#collaboration">
              <Button variant="outline" size="sm" className="border-border/50 gap-2">
                קראו על שני המסלולים
                <ArrowLeft size={14} aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section — preview only; full list at /business/about */}
      <section className="border-t border-border/50" id="faq">
        <div className="container py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <HelpCircle size={14} /> שאלות נפוצות
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">שאלות ותשובות לבעלי עסקים</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">התשובות הכי נפוצות — לרשימה המלאה ראו את עמוד אודות</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {HOMEPAGE_FAQ_PREVIEW.map(({ q, a }, i) => (
              <motion.div
                key={q}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <details className="group rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-colors">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm font-display font-semibold text-foreground list-none">
                    <ChevronDown size={16} className="text-muted-foreground transition-transform duration-300 group-open:rotate-180 shrink-0 ms-3" />
                    <span className="flex-1 text-start">{q}</span>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                    {a}
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/business/about#faq">
              <Button variant="outline" className="border-border/50 font-semibold gap-2">
                לכל השאלות והתשובות
                <ArrowLeft size={14} aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <BusinessFooter />
    </div>
  );
};

export default BusinessLanding;
