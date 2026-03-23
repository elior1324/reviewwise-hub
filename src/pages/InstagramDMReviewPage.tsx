/**
 * InstagramDMReviewPage
 *
 * Customer-facing review submission page reached via /ig/:token
 * (the link a business sends customers via Instagram DM bot).
 *
 * Design principles:
 *  - No login required — customers submit anonymously
 *  - Mobile-first layout (most customers arrive from Instagram on mobile)
 *  - Hebrew RTL, clean and trustworthy feel
 *  - Instagram gradient branding (#833AB4 → #E1306C → #F77737)
 *  - Calls the receive-instagram-dm-review edge function
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Instagram SVG icon ────────────────────────────────────────────────────────
const InstagramIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F77737" />
        <stop offset="50%" stopColor="#E1306C" />
        <stop offset="100%" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <path
      fill="url(#ig-grad)"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
    />
  </svg>
);

// ── StarPicker ─────────────────────────────────────────────────────────────────
const StarPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1.5 justify-center" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} כוכבים`}
        >
          <Star
            size={36}
            className={
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-amber-300"
            }
          />
        </button>
      ))}
    </div>
  );
};

const RATING_LABELS: Record<number, string> = {
  1: "מאוד לא מרוצה",
  2: "לא מרוצה",
  3: "בסדר",
  4: "מרוצה",
  5: "מאוד מרוצה",
};

type PageState = "loading" | "ready" | "submitting" | "success" | "invalid";

const InstagramDMReviewPage = () => {
  const { token }  = useParams<{ token: string }>();
  const navigate   = useNavigate();

  const [pageState, setPageState]       = useState<PageState>("loading");
  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");

  const [rating, setRating]         = useState(0);
  const [text, setText]             = useState("");
  const [authorName, setAuthorName] = useState("");
  const [phone, setPhone]           = useState("");
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  // ── Resolve flow token ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setPageState("invalid"); return; }

    const resolve = async () => {
      const { data: flow } = await supabase
        .from("instagram_dm_review_flows" as any)
        .select("id, active, business_id, businesses(name, slug)")
        .eq("flow_token", token)
        .maybeSingle();

      if (!flow || !flow.active) { setPageState("invalid"); return; }

      const biz = flow.businesses as { name: string; slug: string } | null;
      setBusinessName(biz?.name ?? "");
      setBusinessSlug(biz?.slug ?? "");
      setPageState("ready");
    };

    resolve();
  }, [token]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) { setErrorMsg("אנא בחרו דירוג כוכבים"); return; }
    if (text.trim().length < 5) { setErrorMsg("אנא כתבו לפחות 5 תווים"); return; }

    setErrorMsg(null);
    setPageState("submitting");

    try {
      const { data, error } = await supabase.functions.invoke("receive-instagram-dm-review", {
        body: {
          flow_token:  token,
          rating,
          text:        text.trim(),
          author_name: authorName.trim() || null,
          author_phone: phone.trim() || null,
        },
      });

      if (error || data?.error) {
        setErrorMsg(data?.error ?? error?.message ?? "שגיאה לא ידועה");
        setPageState("ready");
        return;
      }

      setPageState("success");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "שגיאת רשת — נסו שוב");
      setPageState("ready");
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin" style={{ color: "#E1306C" }} />
      </div>
    );
  }

  // ── Invalid token ────────────────────────────────────────────────────────────
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-4" dir="rtl">
        <AlertCircle size={40} className="text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">הקישור אינו תקף</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          ייתכן שהקישור פג תוקף או הושבת. בקשו מהעסק קישור עדכני.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          חזרה לעמוד הבית
        </Button>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-5" dir="rtl">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", opacity: 0.15 }}>
        </div>
        <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center -mt-[72px]">
          <CheckCircle2 size={32} style={{ color: "#E1306C" }} />
        </div>
        <h1 className="text-xl font-bold text-foreground">תודה על הביקורת!</h1>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          הביקורת התקבלה בהצלחה ותוצג לאחר אישור בעל העסק.
        </p>
        {businessSlug && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/biz/${businessSlug}`)}
          >
            צפו בדף העסק
          </Button>
        )}
      </div>
    );
  }

  // ── Review form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-10" dir="rtl">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}>
            <InstagramIcon size={28} />
          </div>
          <h1 className="text-xl font-bold text-foreground leading-tight">
            שתפו את החוויה שלכם
          </h1>
          {businessName && (
            <p className="text-muted-foreground text-sm">
              ביקורת עבור <strong className="text-foreground">{businessName}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Star rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-center block">
              דירוג כללי <span className="text-destructive">*</span>
            </Label>
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-1">
                {RATING_LABELS[rating]}
              </p>
            )}
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <Label htmlFor="ig-text" className="text-sm font-medium">
              הביקורת שלכם <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ig-text"
              placeholder="ספרו על החוויה שלכם עם העסק..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
              required
            />
            <p className="text-[11px] text-muted-foreground/70 text-left" dir="ltr">
              {text.length} תווים
            </p>
          </div>

          {/* Name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="ig-name" className="text-sm font-medium">
              שם <span className="text-muted-foreground text-xs font-normal">(אופציונלי)</span>
            </Label>
            <Input
              id="ig-name"
              placeholder="השם שלכם"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </div>

          {/* Phone (optional, for dedup only) */}
          <div className="space-y-2">
            <Label htmlFor="ig-phone" className="text-sm font-medium">
              מספר טלפון <span className="text-muted-foreground text-xs font-normal">(אופציונלי — לאימות בלבד)</span>
            </Label>
            <Input
              id="ig-phone"
              type="tel"
              placeholder="+972 50 0000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground/70">
              מספר הטלפון ישמש למניעת כפילויות בלבד ולא יוצג לציבור.
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={pageState === "submitting"}
            className="w-full text-white gap-2"
            style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
          >
            {pageState === "submitting" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <InstagramIcon size={15} />
                שלחו ביקורת
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
            הביקורת תוצג לאחר אישור בעל העסק. ReviewHub שומרת את הביקורת על פי מדיניות הפרטיות.
          </p>
        </form>
      </div>
    </div>
  );
};

export default InstagramDMReviewPage;
