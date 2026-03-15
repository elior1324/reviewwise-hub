import { useEffect, useState } from "react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Tag, Clock, Gift } from "lucide-react";
import {
  setAffiliateCookie,
  buildVerifiedPurchaseUrl,
  computeVerifiedPricing,
  formatPrice,
  AFFILIATE_COUPON_CODE,
  AFFILIATE_COOKIE_DAYS,
  LEARNER_DISCOUNT_RATE,
  PLATFORM_FEE_RATE,
} from "@/lib/affiliate";

type RedirectTarget =
  | { kind: "course";    name: string; url: string; price: number | null }
  | { kind: "business";  name: string; url: string; coupon: string | null; method: string | null };

const AffiliateRedirect = () => {
  const { courseId } = useParams(); // doubles as business slug for collab links
  const [target, setTarget]   = useState<RedirectTarget | null>(null);
  const [error,  setError]    = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const trackAndRedirect = async () => {
      if (!courseId) { setError(true); return; }

      try {
        // ── 1. Try business slug first (collaboration referral) ──────────
        const { data: biz } = await supabase
          .from("businesses")
          .select("id, name, website, collaboration_active, collaboration_method, collaboration_coupon")
          .eq("slug", courseId)
          .eq("collaboration_active", true)
          .maybeSingle();

        if (biz && biz.website) {
          await supabase.from("referral_clicks").insert({
            business_id:   biz.id,
            business_slug: courseId,
            referrer:      document.referrer || null,
            user_agent:    navigator.userAgent || null,
          });

          // Record purchase session (once per browser session)
          const sessionKeyBiz = `rh_ps_biz_${biz.id}`;
          if (!sessionStorage.getItem(sessionKeyBiz)) {
            sessionStorage.setItem(sessionKeyBiz, "1");
            await supabase.from("purchase_sessions").insert({
              business_id: biz.id,
              referrer:    document.referrer || null,
              user_agent:  navigator.userAgent || null,
            });
          }

          const tgt: RedirectTarget = {
            kind:   "business",
            name:   biz.name,
            url:    biz.website,
            coupon: biz.collaboration_coupon || null,
            method: biz.collaboration_method || null,
          };
          setTarget(tgt);
          setTimeout(() => { window.location.href = biz.website; }, 3000);
          return;
        }

        // ── 2. Fall back to course affiliate link ────────────────────────
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("name, affiliate_url, price")
          .eq("id", courseId)
          .single();

        if (courseError || !course) { setError(true); return; }

        // Set 30-day attribution cookie
        setAffiliateCookie(courseId);

        // Track click in DB
        await supabase.from("affiliate_clicks").insert({
          course_id: courseId,
          referrer:  document.referrer || null,
          converted: false,
        });

        // Record purchase session (once per browser session — deduplicate via sessionStorage)
        const sessionKey = `rh_ps_${courseId}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "1");
          await supabase.from("purchase_sessions").insert({
            course_id:   courseId,
            referrer:    document.referrer || null,
            user_agent:  navigator.userAgent || null,
          });
        }

        const verifiedUrl = course.affiliate_url
          ? buildVerifiedPurchaseUrl(course.affiliate_url)
          : "";

        setTarget({
          kind:  "course",
          name:  course.name,
          url:   verifiedUrl,
          price: course.price ? Number(course.price) : null,
        });

        if (verifiedUrl) {
          setTimeout(() => { window.location.href = verifiedUrl; }, 3000);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    trackAndRedirect();
  }, [courseId]);

  // Countdown timer for UX
  useEffect(() => {
    if (!target || error) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [target, countdown, error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center noise-overlay" dir="rtl">
      <div className="text-center space-y-5 max-w-sm px-6 w-full">
        {/* Logo */}
        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto animate-pulse">
          <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
        </div>

        {/* Error state */}
        {error && (
          <>
            <h1 className="font-display font-bold text-xl text-foreground">הקישור לא נמצא</h1>
            <p className="text-muted-foreground text-sm">הקישור שגוי, הקורס לא קיים, או שהתוכנית אינה פעילה.</p>
          </>
        )}

        {/* Loading state */}
        {!error && !target && (
          <p className="text-muted-foreground text-sm animate-pulse">בודק קישור מאומת...</p>
        )}

        {/* Course redirect */}
        {!error && target?.kind === "course" && (() => {
          const price   = (target as any).price as number | null;
          const pricing = price ? computeVerifiedPricing(price) : null;

          return (
            <>
              {/* Verified Deal header */}
              <div className="flex items-center justify-center gap-2">
                <Tag size={16} className="text-primary" />
                <span className="text-sm font-bold text-primary tracking-wide uppercase">Verified Deal</span>
              </div>

              <h1 className="font-display font-bold text-xl text-foreground">
                מעביר אותך לרכישה מאומתת...
              </h1>
              <p className="text-muted-foreground font-medium">{target.name}</p>

              {/* Countdown */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} />
                <span>עוברים בעוד {countdown} שניות</span>
              </div>

              {/* 5/5 Pricing breakdown */}
              {pricing && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-right space-y-2">
                  <p className="text-xs font-bold text-primary mb-2">פירוט מחיר — מודל 5/5 אמון</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">מחיר שוק</span>
                    <span className="text-muted-foreground line-through">{formatPrice(pricing.listPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary font-semibold">הנחת לומד (5%)</span>
                    <span className="text-primary font-semibold">−{formatPrice(pricing.learnerDiscount)}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold border-t border-border/40 pt-2">
                    <span className="text-foreground">מחיר מאומת לתשלום</span>
                    <span className="text-primary text-lg">{formatPrice(pricing.verifiedPrice)}</span>
                  </div>
                </div>
              )}

              {/* Coupon code display */}
              <div className="mx-auto inline-block border border-primary/30 bg-primary/10 rounded-xl px-5 py-3">
                <p className="text-xs text-muted-foreground mb-1">קוד הנחה לאימות בקופה:</p>
                <p className="font-mono font-bold text-2xl text-primary tracking-widest">{AFFILIATE_COUPON_CODE}</p>
                <p className="text-xs text-primary/70 mt-1">קוד 5% — מופעל אוטומטית בקישור</p>
              </div>

              {/* Trust benefits */}
              <ul className="space-y-1.5 text-xs text-muted-foreground text-right">
                {[
                  `הנחה מיידית של ${LEARNER_DISCOUNT_RATE * 100}% — ללא צורך להזין קוד`,
                  "סטטוס \"קונה מאומת\" אוטומטי לאחר הרכישה",
                  "כתיבת ביקורת מאומתת עם משקל ×1.0 בציון האמון",
                  `עוגיית מעקב של ${AFFILIATE_COOKIE_DAYS} יום — ההנחה תחול גם אם תרכשו מאוחר יותר`,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ShieldCheck size={10} className="text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Giveaway teaser */}
              <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={13} className="text-primary" />
                  <p className="text-xs font-bold text-primary">הגרלה חודשית ₪5,000</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  לאחר הרכישה כתבו ביקורת מאומתת — ותקבלו כניסה אוטומטית להגרלה החודשית.{" "}
                  <Link to="/giveaway" className="text-primary hover:underline font-medium">
                    פרטים נוספים ←
                  </Link>
                </p>
              </div>

              {/* Disclosure */}
              <div className="rounded-lg border border-border/30 bg-muted/30 px-4 py-3 text-right">
                <p className="text-[9px] text-muted-foreground/70 leading-relaxed">
                  <strong className="text-muted-foreground">גילוי נאות:</strong> ReviewHub גובה עמלת תפעול של {PLATFORM_FEE_RATE * 100}% מהיוצר על כל עסקה מאומתת. עמלה זו מממנת את תשתית האימות ואינה משפיעה על ציון האמון — "חומת אמון" מבנית מבדילה לחלוטין בין כל תשלום מסחרי לבין חישוב הציון.
                </p>
              </div>
            </>
          );
        })()}

        {/* Business/Collaboration redirect */}
        {!error && target?.kind === "business" && (
          <>
            <h1 className="font-display font-bold text-xl text-foreground">
              מעביר אותך לאימות רכישה — {target.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              עוברים דרך תשתית האימות של ReviewHub
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} />
              <span>עוברים בעוד {countdown} שניות</span>
            </div>

            {/* Coupon display */}
            {(target.method === "coupon" || target.method === "both") && target.coupon && (
              <div className="mx-auto inline-block border border-primary/30 bg-primary/5 rounded-xl px-5 py-3">
                <p className="text-xs text-muted-foreground mb-1">תנאי רכישה מסונכרנים — קוד לאימות בקופה:</p>
                <p className="font-mono font-bold text-2xl text-primary tracking-widest">{target.coupon}</p>
                <p className="text-xs text-primary/70 mt-1">תנאים מסופקים ישירות על ידי הספק</p>
              </div>
            )}

            {/* Giveaway teaser */}
            <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-right">
              <div className="flex items-center gap-2 mb-1">
                <Gift size={13} className="text-primary" />
                <p className="text-xs font-bold text-primary">הגרלה חודשית ₪5,000</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                לאחר הרכישה כתבו ביקורת מאומתת — ותקבלו כניסה אוטומטית להגרלה החודשית.{" "}
                <Link to="/giveaway" className="text-primary hover:underline font-medium">
                  פרטים נוספים ←
                </Link>
              </p>
            </div>

            <div className="rounded-lg border border-border/30 bg-muted/30 px-4 py-3 text-right">
              <p className="text-[9px] text-muted-foreground/70 leading-relaxed">
                <strong className="text-muted-foreground">גילוי נאות:</strong> רכישות דרך קישור זה עוברות דרך תשתית האימות של ReviewHub ומסייעות לאמת את אמיתות המשוב העתידי. ReviewHub עשויה לקבל אות תפעולי מרכישה זו. פעולה זו אינה משפיעה על ציון האמון האובייקטיבי של הספק.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateRedirect;
