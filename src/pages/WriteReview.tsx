/**
 * WriteReview — Token-based review submission page
 * ─────────────────────────────────────────────────
 * Reached via /review/:token (link in the 7-day review request email).
 *
 * Flow:
 *  1. Look up review_requests row by token → get course/business + verified_purchase
 *  2. Validate token is not expired and not already used (reviewed_at IS NULL)
 *  3. User fills out the review form (RTL, Hebrew)
 *  4. On submit: call submit-review edge function with verifiedPurchase = true
 *  5. Create giveaway_entries row
 *  6. Mark review_requests.reviewed_at = now()
 *  7. Show post-submit giveaway confirmation
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Star, Gift, Trophy, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import TurnstileWidget from "@/components/TurnstileWidget";
import { sanitizeText } from "@/lib/sanitize";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const REVIEW_MIN_LENGTH = 10;
const REVIEW_MAX_LENGTH = 2000;
const SUBJECT_MAX_LENGTH = 60;

interface RequestContext {
  id:                   string;   // review_request.id
  token:                string;
  userEmail:            string;
  courseId:             string | null;
  businessId:           string | null;
  verifiedPurchaseId:   string | null;
  productName:          string;
  businessName:         string;
  businessSlug:         string | null;
  alreadyReviewed:      boolean;
  expired:              boolean;
}

const RequiredMark = () => <span className="text-destructive mr-0.5">*</span>;

const WriteReview = () => {
  const { token } = useParams<{ token: string }>();
  const { user }  = useAuth();

  // ── Page state
  const [ctx, setCtx]             = useState<RequestContext | null>(null);
  const [loading, setLoading]     = useState(true);
  const [tokenError, setTokenError] = useState<"not_found" | "expired" | "used" | null>(null);

  // ── Form state
  const [rating, setRating]           = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject]         = useState("");
  const [reviewText, setReviewText]   = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // ── Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [giveawayEntered, setGiveawayEntered] = useState(false);

  // ── 1. Validate token on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setTokenError("not_found"); setLoading(false); return; }
    document.title = "כתבו ביקורת מאומתת | ReviewHub";

    const validateToken = async () => {
      const { data: rr } = await (supabase as any)
        .from("review_requests")
        .select(`
          id, token, user_email, course_id, business_id, verified_purchase_id,
          reviewed_at, expires_at,
          courses ( name ),
          businesses ( name, slug )
        `)
        .eq("token", token)
        .maybeSingle();

      if (!rr) { setTokenError("not_found"); setLoading(false); return; }
      if ((rr as any).reviewed_at) { setTokenError("used"); setLoading(false); return; }
      if ((rr as any).expires_at && new Date((rr as any).expires_at) < new Date()) {
        setTokenError("expired"); setLoading(false); return;
      }

      const rrAny = rr as any;
      const courseName   = rrAny.courses?.name   || "";
      const bizName      = rrAny.businesses?.name || "";
      const bizSlug      = rrAny.businesses?.slug || null;

      setCtx({
        id:                 rrAny.id,
        token:              rrAny.token,
        userEmail:          rrAny.user_email,
        courseId:           rrAny.course_id,
        businessId:         rrAny.business_id,
        verifiedPurchaseId: rrAny.verified_purchase_id,
        productName:        courseName || bizName,
        businessName:       bizName,
        businessSlug:       bizSlug,
        alreadyReviewed:    false,
        expired:            false,
      });
      setLoading(false);
    };

    validateToken();
  }, [token]);

  // ── 2. Submit handler ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ctx) return;
    if (rating === 0)                           return;
    if (!subject.trim())                        return;
    if (reviewText.trim().length < REVIEW_MIN_LENGTH) return;
    if (!turnstileToken)                        return;

    setSubmitting(true);

    const cleanSubject = sanitizeText(subject, SUBJECT_MAX_LENGTH);
    const cleanText    = sanitizeText(reviewText, REVIEW_MAX_LENGTH);

    try {
      // ── Call submit-review edge function (handles Turnstile + DB insert)
      const { data: fnResult, error: fnError } = await supabase.functions.invoke(
        "submit-review",
        {
          body: {
            turnstileToken,
            businessId:          ctx.businessId,
            courseId:            ctx.courseId,
            rating,
            subject:             cleanSubject,
            reviewText:          cleanText,
            trainingDuration:    "reviewed_via_email",
            verifiedPurchase:    true,
            indemnityAccepted:   true,
            indemnityAcceptedAt: new Date().toISOString(),
            verificationStatus:  "purchase_verified",
            verifiedPurchaseId:  ctx.verifiedPurchaseId,
          },
        }
      );

      if (fnError || fnResult?.error) {
        console.error("submit-review error:", fnError || fnResult?.error);
        setSubmitting(false);
        return;
      }

      // ── Mark review_request as used
      await (supabase as any)
        .from("review_requests")
        .update({ reviewed_at: new Date().toISOString() })
        .eq("id", ctx.id);

      // ── Create giveaway entry (one per review + one per user per month)
      const reviewId   = fnResult?.reviewId;
      const authUserId = user?.id ?? null;
      const giveawayMonth = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })();

      if (reviewId && authUserId) {
        const { error: entryError } = await (supabase.from as any)("giveaway_entries").insert({
          user_id:              authUserId,
          review_id:            reviewId,
          verified_purchase_id: ctx.verifiedPurchaseId,
          giveaway_month:       giveawayMonth,
        });

        // 23505 = unique violation (already has entry this month) — not a problem
        if (!entryError || entryError.code === "23505") {
          setGiveawayEntered(!entryError);
        }
      }

      setSubmitted(true);
    } catch (err) {
      console.error("WriteReview submit error:", err);
    }

    setSubmitting(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // ── Token errors ──────────────────────────────────────────────────────────
  if (tokenError) {
    const msgs: Record<NonNullable<typeof tokenError>, { title: string; body: string }> = {
      not_found: { title: "הקישור לא תקין",   body: "הקישור לביקורת שגוי או לא קיים. בדקו שהעתקתם את הקישור המלא מהמייל." },
      expired:   { title: "הקישור פג תוקפו",  body: "קישורי ביקורת תקפים ל-30 יום מרגע קבלת המייל. ניתן לכתוב ביקורת גם ישירות מדף הקורס." },
      used:      { title: "הביקורת כבר נשלחה", body: "כבר שלחתם ביקורת דרך קישור זה. תודה על השתתפותכם!" },
    };
    const { title, body } = msgs[tokenError];

    return (
      <div className="min-h-screen bg-background noise-overlay" dir="rtl">
        <Navbar />
        <div className="container pt-24 pb-16 max-w-lg text-center">
          <AlertCircle size={40} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display font-bold text-2xl mb-2">{title}</h1>
          <p className="text-muted-foreground">{body}</p>
          <Link to="/search" className="mt-6 inline-block">
            <Button variant="outline">חיפוש קורסים</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Post-submission success ───────────────────────────────────────────────
  if (submitted && ctx) {
    return (
      <div className="min-h-screen bg-background noise-overlay" dir="rtl">
        <Navbar />
        <div className="container pt-24 pb-16 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-primary" />
            </div>

            <h1 className="font-display font-bold text-2xl">תודה על הביקורת! 🙌</h1>
            <p className="text-muted-foreground">
              הביקורת המאומתת שלכם על <strong className="text-foreground">{ctx.productName}</strong> פורסמה בהצלחה.
            </p>

            {/* Giveaway confirmation */}
            <div className={`rounded-2xl border p-6 text-right space-y-3 ${
              giveawayEntered
                ? "border-primary/25 bg-primary/5"
                : "border-border/40 bg-muted/20"
            }`}>
              {giveawayEntered ? (
                <>
                  <div className="flex items-center gap-3">
                    <Trophy size={22} className="text-primary" />
                    <span className="font-display font-bold text-lg">נכנסתם להגרלה! 🎉</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    נרשמתם אוטומטית להגרלה החודשית — <strong className="text-foreground">פרס ₪5,000</strong> לרכישת כל קורס, שירות דיגיטלי, SaaS או מוצר ב-ReviewHub.
                  </p>
                  <Link to="/giveaway">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 mt-1">
                      <Gift size={14} />
                      לדף ההגרלה
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Gift size={20} className="text-muted-foreground" />
                    <span className="font-semibold text-foreground">הגרלה חודשית</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    יש לכם כבר כניסה להגרלה החודשית — רק כניסה אחת בחודש לכל משתמש.
                  </p>
                </>
              )}
            </div>

            {ctx.businessSlug && (
              <Link to={`/biz/${ctx.businessSlug}`}>
                <Button variant="outline" className="gap-2">
                  לדף {ctx.businessName}
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Main review form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Verified badge */}
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <span className="text-sm font-medium text-primary">ביקורת רכישה מאומתת</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
              Verified Purchase
            </Badge>
          </div>

          <h1 className="font-display font-bold text-2xl text-foreground">
            ספרו על החוויה שלכם
            {ctx?.productName && <span className="text-primary"> עם {ctx.productName}</span>}
          </h1>

          {/* Giveaway incentive callout */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Gift size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">הגרלה חודשית — ₪5,000</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                שליחת ביקורת זו תכניס אתכם אוטומטית להגרלה.{" "}
                <Link to="/giveaway" className="text-primary hover:underline">פרטים ←</Link>
              </p>
            </div>
          </div>

          {/* Review form */}
          <Card className="shadow-card animated-border bg-card">
            <CardHeader>
              <CardTitle className="font-display">כתבו ביקורת</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Star rating */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">הדירוג שלכם <RequiredMark /></p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={32}
                          className={`transition-colors ${
                            i <= (hoverRating || rating)
                              ? "fill-star text-star"
                              : "fill-star-empty text-star-empty"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">נושא הביקורת <RequiredMark /></p>
                  <Input
                    placeholder="לדוגמה: חוויית למידה מעולה"
                    value={subject}
                    onChange={e => { if (e.target.value.length <= SUBJECT_MAX_LENGTH) setSubject(e.target.value); }}
                    maxLength={SUBJECT_MAX_LENGTH}
                    className="glass border-border/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-left">{subject.length}/{SUBJECT_MAX_LENGTH}</p>
                </div>

                {/* Review text */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">פירוט הביקורת <RequiredMark /></p>
                  <Textarea
                    placeholder="שתפו את החוויה שלכם בהרחבה — מה למדתם, מה השתפר, מה חסר..."
                    value={reviewText}
                    onChange={e => { if (e.target.value.length <= REVIEW_MAX_LENGTH) setReviewText(e.target.value); }}
                    maxLength={REVIEW_MAX_LENGTH}
                    rows={5}
                    className="glass border-border/50 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-left">
                    {reviewText.length}/{REVIEW_MAX_LENGTH} תווים
                  </p>
                </div>

                {/* Verification notice */}
                <div className="rounded-lg bg-muted/40 border border-border/40 px-4 py-3 flex items-center gap-3">
                  <ShieldCheck size={15} className="text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    הביקורת שלכם תפורסם עם תג <strong className="text-foreground">Verified Purchase</strong> — הרכישה אומתה אוטומטית דרך ReviewHub.
                  </p>
                </div>

                <TurnstileWidget
                  onSuccess={t => setTurnstileToken(t)}
                  onError={() => setTurnstileToken(null)}
                  className="flex justify-center"
                />

                <Button
                  type="submit"
                  disabled={submitting || !turnstileToken || rating === 0 || !subject.trim() || reviewText.trim().length < REVIEW_MIN_LENGTH}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary gap-2"
                  size="lg"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "שולח..." : "שלחו ביקורת + כניסה להגרלה"}
                </Button>

                <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
                  הגשת ביקורת מהווה הסכמה לתקנון ReviewHub. הביקורת מבטאת דעתכם האישית.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default WriteReview;
