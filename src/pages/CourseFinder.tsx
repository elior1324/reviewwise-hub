/**
 * CourseFinder — Multi-step Matchmaker Wizard
 *
 * Captures user intent (budget → goals → interests → contact)
 * then matches them with up to 3 Verified Business partners from the DB.
 *
 * Monetisation:
 *   • Submits a `matchmaker_lead` row to Supabase
 *   • When a business clicks "Reveal Contact", the commission-splitter
 *     edge function fires a `charge_lead` event (₪25 flat fee)
 *
 * Route: /course-finder
 * Auth: not required (contact info collected inline)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Target,
  Wallet,
  Heart,
  User,
  Mail,
  Phone,
  BookOpen,
  Zap,
  Star,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const BUDGET_OPTIONS = [
  { id: "under_500", label: "עד ₪500", sublabel: "מתחיל / מנסה" },
  { id: "500_2000", label: "₪500 – ₪2,000", sublabel: "רציני / מתקדם" },
  { id: "2000_5000", label: "₪2,000 – ₪5,000", sublabel: "מקצועי" },
  { id: "over_5000", label: "מעל ₪5,000", sublabel: "עסקי / מיתוג" },
];

const GOAL_OPTIONS = [
  { id: "new_skill", label: "לרכוש מיומנות חדשה", icon: BookOpen },
  { id: "career_change", label: "מעבר קריירה", icon: ArrowRight },
  { id: "grow_business", label: "לצמוח בעסק", icon: Zap },
  { id: "earn_online", label: "להרוויח אונליין", icon: Wallet },
  { id: "personal_dev", label: "פיתוח אישי", icon: Heart },
  { id: "freelance", label: "פרילנס / עצמאי", icon: Target },
];

const INTEREST_OPTIONS = [
  "שיווק דיגיטלי",
  "בניית אתרים",
  "עיצוב גרפי",
  "פיתוח תוכנה",
  "הדרכה ועסקים",
  "כתיבה ותוכן",
  "E-Commerce",
  "נדל\"ן",
  "בריאות וכושר",
  "צילום ווידאו",
  "מוזיקה ואומנות",
  "קואצ'ינג",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "budget" | "goals" | "interests" | "contact" | "results";

interface FormData {
  budget: string;
  goals: string[];
  interests: string[];
  name: string;
  email: string;
  phone: string;
}

interface MatchedBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  subscription_tier: string | null;
  logo_url: string | null;
  cashback_rate: number;
}

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "budget", label: "תקציב" },
  { id: "goals", label: "מטרות" },
  { id: "interests", label: "תחומי עניין" },
  { id: "contact", label: "פרטים" },
  { id: "results", label: "תוצאות" },
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-1 mb-8 dir-ltr">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
              i < idx
                ? "w-7 h-7 bg-emerald-500 text-white"
                : i === idx
                ? "w-8 h-8 bg-primary text-white shadow-lg shadow-primary/30"
                : "w-7 h-7 bg-muted text-muted-foreground"
            }`}
          >
            {i < idx ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-8 mx-1 transition-all duration-500 ${
                i < idx ? "bg-emerald-500" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Slide animation ──────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function CourseFinder() {
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("budget");
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchedBusiness[]>([]);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    budget: "",
    goals: [],
    interests: [],
    name: user?.user_metadata?.full_name ?? "",
    email: user?.email ?? "",
    phone: "",
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  const stepOrder: Step[] = ["budget", "goals", "interests", "contact", "results"];

  function goNext() {
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) {
      setDirection(1);
      setStep(stepOrder[idx + 1] as Step);
    }
  }

  function goBack() {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) {
      setDirection(-1);
      setStep(stepOrder[idx - 1] as Step);
    }
  }

  // ── Toggles ─────────────────────────────────────────────────────────────────

  function toggleGoal(id: string) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(id)
        ? f.goals.filter((g) => g !== id)
        : [...f.goals, id],
    }));
  }

  function toggleInterest(label: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(label)
        ? f.interests.filter((i) => i !== label)
        : f.interests.length < 5
        ? [...f.interests, label]
        : f.interests,
    }));
  }

  // ── Submit & match ───────────────────────────────────────────────────────────

  async function handleSubmit() {
    setError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setError("נא למלא שם ואימייל");
      return;
    }

    setLoading(true);
    setDirection(1);

    try {
      // 1. Fetch matching businesses (Verified, category overlap)
      const { data: businesses, error: bizErr } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, category, description, rating, review_count, subscription_tier, logo_url, cashback_rate"
        )
        .in("category", form.interests.length > 0 ? form.interests : ["שיווק דיגיטלי"])
        .not("subscription_tier", "is", null)
        .order("rating", { ascending: false })
        .limit(3);

      const matched: MatchedBusiness[] = bizErr || !businesses ? [] : businesses;

      // 2. Insert matchmaker_lead row
      const { data: lead, error: leadErr } = await supabase
        .from("matchmaker_leads")
        .insert({
          user_id: user?.id ?? null,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          budget_range: form.budget,
          goals: form.goals,
          interests: form.interests,
          matched_business_ids: matched.map((b) => b.id),
          status: "new",
        })
        .select("id")
        .single();

      if (leadErr) throw leadErr;

      setLeadId(lead?.id ?? null);
      setMatches(matched);
      setStep("results");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "שגיאה בלתי צפויה";
      setError(`אירעה שגיאה: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Validation per step ──────────────────────────────────────────────────────

  function canAdvance(): boolean {
    if (step === "budget") return !!form.budget;
    if (step === "goals") return form.goals.length > 0;
    if (step === "interests") return form.interests.length > 0;
    if (step === "contact") return !!form.name.trim() && !!form.email.trim();
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-primary/10 py-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="text-primary w-6 h-6" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Course Finder — מציאת המדריך המושלם
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            מה אתה רוצה ללמוד?
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
            ענה על 4 שאלות קצרות ואנחנו נמצא לך עד 3 שותפים עסקיים מאומתים
            שמתאימים בדיוק לצרכים שלך.
          </p>
        </motion.div>
      </div>

      {/* Wizard */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-xl mx-auto">
          {step !== "results" && <StepIndicator current={step} />}

          <div className="relative overflow-hidden min-h-[340px]">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* ── Step: Budget ───────────────────────────────────────────── */}
                {step === "budget" && (
                  <StepCard title="מה התקציב שלך?" icon={<Wallet className="text-primary w-5 h-5" />}>
                    <div className="grid grid-cols-2 gap-3">
                      {BUDGET_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setForm((f) => ({ ...f, budget: opt.id }))}
                          className={`rounded-xl border-2 p-4 text-right transition-all duration-200 ${
                            form.budget === opt.id
                              ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                              : "border-border bg-card hover:border-primary/40"
                          }`}
                        >
                          <p className="font-bold text-foreground text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.sublabel}</p>
                        </button>
                      ))}
                    </div>
                  </StepCard>
                )}

                {/* ── Step: Goals ────────────────────────────────────────────── */}
                {step === "goals" && (
                  <StepCard
                    title="מה המטרה שלך?"
                    subtitle="בחר אחת או יותר"
                    icon={<Target className="text-primary w-5 h-5" />}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {GOAL_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = form.goals.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleGoal(opt.id)}
                            className={`rounded-xl border-2 p-3 flex items-center gap-2 text-right transition-all duration-200 ${
                              active
                                ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            <div
                              className={`rounded-lg p-1.5 flex-shrink-0 ${
                                active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon size={14} />
                            </div>
                            <span className="text-xs font-medium text-foreground leading-tight">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </StepCard>
                )}

                {/* ── Step: Interests ────────────────────────────────────────── */}
                {step === "interests" && (
                  <StepCard
                    title="באילו תחומים אתה מעוניין?"
                    subtitle={`בחר עד 5 תחומים (${form.interests.length}/5)`}
                    icon={<Heart className="text-primary w-5 h-5" />}
                  >
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map((label) => {
                        const active = form.interests.includes(label);
                        const disabled = !active && form.interests.length >= 5;
                        return (
                          <button
                            key={label}
                            onClick={() => toggleInterest(label)}
                            disabled={disabled}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                              active
                                ? "border-primary bg-primary text-white shadow-sm"
                                : disabled
                                ? "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                                : "border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary/5"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </StepCard>
                )}

                {/* ── Step: Contact ──────────────────────────────────────────── */}
                {step === "contact" && (
                  <StepCard
                    title="פרטי יצירת קשר"
                    subtitle="המחנכים יגיעו אליך — ללא התחייבות"
                    icon={<User className="text-primary w-5 h-5" />}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium mb-1 block">
                          שם מלא *
                        </Label>
                        <div className="relative">
                          <User
                            size={15}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <Input
                            id="name"
                            className="pr-9 text-right"
                            placeholder="ישראל ישראלי"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm font-medium mb-1 block">
                          אימייל *
                        </Label>
                        <div className="relative">
                          <Mail
                            size={15}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <Input
                            id="email"
                            type="email"
                            className="pr-9 text-right"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium mb-1 block">
                          טלפון (אופציונלי)
                        </Label>
                        <div className="relative">
                          <Phone
                            size={15}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <Input
                            id="phone"
                            type="tel"
                            className="pr-9 text-right"
                            placeholder="050-000-0000"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                          {error}
                        </p>
                      )}

                      {/* Privacy note */}
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Shield size={12} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                        הפרטים שלך מוצפנים ומועברים רק לשותפים המאומתים שנבחרו. לא נמכרים לצדדים שלישיים.
                      </p>
                    </div>
                  </StepCard>
                )}

                {/* ── Step: Results ──────────────────────────────────────────── */}
                {step === "results" && (
                  <ResultsStep matches={matches} leadId={leadId} form={form} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons (hidden on results) */}
          {step !== "results" && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={step === "budget"}
                className="gap-1.5"
              >
                <ChevronRight size={16} />
                חזרה
              </Button>

              {step === "contact" ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!canAdvance() || loading}
                  className="gap-2 min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      מחפש...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      מצא לי שותפים
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  disabled={!canAdvance()}
                  className="gap-1.5"
                >
                  המשך
                  <ChevronLeft size={16} />
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─── Helper: Step card wrapper ─────────────────────────────────────────────────

function StepCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ─── Helper: Results step ─────────────────────────────────────────────────────

function ResultsStep({
  matches,
  leadId,
  form,
}: {
  matches: MatchedBusiness[];
  leadId: string | null;
  form: FormData;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-3">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">מצאנו התאמות!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {form.name}, הנה{" "}
          <span className="font-semibold text-primary">{matches.length} שותפים עסקיים</span>{" "}
          שנבחרו במיוחד עבורך
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground text-sm">
            לא נמצאו שותפים מאומתים בתחומים שבחרת כרגע.
            <br />
            ניצור איתך קשר ברגע שיהיו התאמות חדשות.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((biz, i) => (
            <BusinessMatchCard key={biz.id} biz={biz} rank={i + 1} leadId={leadId} />
          ))}
        </div>
      )}

      {/* What happens next */}
      <div className="mt-6 bg-primary/5 border border-primary/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
          <Zap size={12} />
          מה קורה עכשיו?
        </p>
        <ul className="text-xs text-muted-foreground space-y-1 list-none">
          <li>• הבקשה שלך נשמרה במערכת</li>
          <li>• השותפים המאומתים יוכלו לראות את הצורך שלך</li>
          <li>• כשהם מאשרים — הם מגיעים אליך ישירות</li>
          <li>• אין עלות מצידך — השירות חינמי לחולשים</li>
        </ul>
      </div>
    </motion.div>
  );
}

// ─── Helper: Single match card ─────────────────────────────────────────────────

function BusinessMatchCard({
  biz,
  rank,
  leadId,
}: {
  biz: MatchedBusiness;
  rank: number;
  leadId: string | null;
}) {
  const rankColors = ["from-amber-400 to-orange-400", "from-slate-400 to-slate-500", "from-amber-600 to-amber-700"];
  const rankLabels = ["#1 התאמה הטובה ביותר", "#2 מומלץ", "#3 אופציה נוספת"];

  const cashbackPct = Math.round((biz.cashback_rate ?? 0.025) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Rank banner */}
      <div className={`h-1.5 bg-gradient-to-r ${rankColors[rank - 1] ?? "from-primary to-primary/60"}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo / avatar */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {biz.logo_url ? (
              <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
            ) : (
              <BookOpen size={22} className="text-primary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-foreground text-sm truncate">{biz.name}</h3>
              {biz.subscription_tier && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {biz.subscription_tier === "pro" ? "Pro" : biz.subscription_tier === "business" ? "Business" : "Verified"}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">{biz.category}</p>

            {/* Rating */}
            {biz.rating != null && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold text-foreground">{biz.rating.toFixed(1)}</span>
                {biz.review_count != null && (
                  <span className="text-xs text-muted-foreground">
                    ({biz.review_count.toLocaleString("he-IL")} ביקורות)
                  </span>
                )}
              </div>
            )}

            {biz.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{biz.description}</p>
            )}
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
          {/* Cashback pill */}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
            <Zap size={10} />
            {cashbackPct}% קאשבק
          </span>

          {/* Rank label */}
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            {rankLabels[rank - 1]}
          </span>

          {/* CTA */}
          <a
            href={`/biz/${biz.slug}`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            פרופיל
            <ChevronLeft size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
