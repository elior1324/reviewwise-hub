import { useEffect, useState } from "react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type RedirectTarget =
  | { kind: "course"; name: string; url: string }
  | { kind: "business"; name: string; url: string; coupon: string | null; method: string | null };

const AffiliateRedirect = () => {
  const { courseId } = useParams(); // doubles as business slug for collab links
  const [target, setTarget] = useState<RedirectTarget | null>(null);
  const [error, setError] = useState(false);

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
          // Record referral click
          await supabase.from("referral_clicks").insert({
            business_id: biz.id,
            business_slug: courseId,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent || null,
          });

          const tgt: RedirectTarget = {
            kind: "business",
            name: biz.name,
            url: biz.website,
            coupon: biz.collaboration_coupon || null,
            method: biz.collaboration_method || null,
          };
          setTarget(tgt);

          setTimeout(() => { window.location.href = biz.website; }, 2200);
          return;
        }

        // ── 2. Fall back to course affiliate link ────────────────────────
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("name, affiliate_url")
          .eq("id", courseId)
          .single();

        if (courseError || !course) { setError(true); return; }

        setTarget({ kind: "course", name: course.name, url: course.affiliate_url || "" });

        await supabase.from("affiliate_clicks").insert({
          course_id: courseId,
          referrer: document.referrer || null,
          converted: false,
        });

        if (course.affiliate_url) {
          setTimeout(() => { window.location.href = course.affiliate_url!; }, 1500);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    trackAndRedirect();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center noise-overlay" dir="rtl">
      <div className="text-center space-y-4 max-w-sm px-6">
        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto animate-pulse">
          <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
        </div>

        {error && (
          <>
            <h1 className="font-display font-bold text-xl text-foreground">הקישור לא נמצא</h1>
            <p className="text-muted-foreground text-sm">הקישור שגוי, הקורס לא קיים, או שהתוכנית אינה פעילה.</p>
          </>
        )}

        {!error && !target && (
          <p className="text-muted-foreground text-sm animate-pulse">בודק קישור...</p>
        )}

        {!error && target?.kind === "course" && (
          <>
            <h1 className="font-display font-bold text-xl text-foreground">מעביר אותך לאימות רכישה...</h1>
            <p className="text-muted-foreground">{target.name}</p>
            <p className="text-xs text-muted-foreground">עוברים דרך תשתית האימות של ReviewHub</p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-right space-y-1 mt-2">
              <p className="text-xs text-foreground/80 leading-relaxed">
                <strong className="text-foreground">מדוע לרכוש דרך קישור זה?</strong><br />
                רכישה דרך קישור ReviewHub מאומת מבטיחה שהמשוב שלכם יוכל להיות מאומת. רק עסקאות שעוברות דרך תשתית האימות של ReviewHub מעניקות למשתמש סטטוס <span className="text-primary font-medium">״קונה מאומת״</span> — שמעניק לביקורת שלהם משקל גבוה יותר בציון האמון ומאפשר ל-ReviewHub לסייע בסכסוכים הנוגעים לתוכן הקורס.
              </p>
              <p className="text-[10px] text-muted-foreground/70 border-t border-border/30 pt-2">
                לשקיפות מלאה: רכישות דרך קישור זה מייצרות אות טכני לאימות ומסייעות לתפעול תשתית האימות של ReviewHub. אות זה אינו משפיע על דירוג המוצר.
              </p>
            </div>
          </>
        )}

        {!error && target?.kind === "business" && (
          <>
            <h1 className="font-display font-bold text-xl text-foreground">
              מעביר אותך לאימות רכישה — {target.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              עוברים דרך תשתית האימות של ReviewHub
            </p>

            {/* Coupon display */}
            {(target.method === "coupon" || target.method === "both") && target.coupon && (
              <div className="mx-auto inline-block border border-primary/30 bg-primary/5 rounded-xl px-5 py-3">
                <p className="text-xs text-muted-foreground mb-1">תנאי רכישה מסונכרנים — קוד לאימות בקופה:</p>
                <p className="font-mono font-bold text-2xl text-primary tracking-widest">{target.coupon}</p>
                <p className="text-xs text-primary/70 mt-1">תנאים מסופקים ישירות על ידי הספק</p>
              </div>
            )}

            <div className="rounded-lg border border-border/30 bg-muted/30 px-4 py-3 text-right">
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                לשקיפות מלאה: רכישות דרך קישור זה עוברות דרך תשתית האימות של ReviewHub ומסייעות לאמת את אמיתות המשוב העתידי. ReviewHub עשויה לקבל אות תפעולי מרכישה זו. פעולה זו אינה משפיעה על ציון האמון האובייקטיבי של הספק.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateRedirect;
