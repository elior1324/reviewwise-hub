/**
 * WhatsAppReviewPage
 *
 * Customer-facing review submission page reached via /wa/:token
 * (e.g., the link a business shares on WhatsApp with their customers).
 *
 * Design principles:
 *  - No login required — customers submit anonymously
 *  - Mobile-first layout (most customers arrive from WhatsApp on mobile)
 *  - Hebrew RTL, clean and trustworthy feel
 *  - Calls the receive-whatsapp-review edge function
 *  - Business name fetched via flow_token → flow → business_id → business.name
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Inline WhatsApp SVG ────────────────────────────────────────────────────────
const WhatsAppIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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

// ── Rating label ───────────────────────────────────────────────────────────────
const RATING_LABELS: Record<number, string> = {
  1: "מאוד לא מרוצה",
  2: "לא מרוצה",
  3: "בסדר",
  4: "מרוצה",
  5: "מאוד מרוצה",
};

// ── Page component ─────────────────────────────────────────────────────────────

type PageState = "loading" | "ready" | "submitting" | "success" | "error" | "invalid";

const WhatsAppReviewPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [businessName, setBusinessName] = useState<string>("");
  const [businessSlug, setBusinessSlug] = useState<string>("");

  // Form fields
  const [rating, setRating]         = useState(0);
  const [text, setText]             = useState("");
  const [authorName, setAuthorName] = useState("");
  const [phone, setPhone]           = useState("");
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  // ── Resolve flow token → business name ──────────────────────────────────────
  useEffect(() => {
    if (!token) { setPageState("invalid"); return; }

    const resolve = async () => {
      const { data: flow } = await (supabase as any)
        .from("whatsapp_review_flows")
        .select("id, active, business_id, businesses(name, slug)")
        .eq("flow_token", token)
        .maybeSingle();

      if (!flow || !(flow as any).active) {
        setPageState("invalid");
        return;
      }

      const biz = (flow as any).businesses as { name: string; slug: string } | null;
      setBusinessName(biz?.name ?? "");
      setBusinessSlug(biz?.slug ?? "");
      setPageState("ready");
    };

    resolve();
  }, [token]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setErrorMsg("אנא בחרו דירוג כוכבים");
      return;
    }
    if (text.trim().length < 5) {
      setErrorMsg("אנא כתבו לפחות 5 תווים");
      return;
    }

    setErrorMsg(null);
    setPageState("submitting");

    try {
      const { data, error } = await supabase.functions.invoke("receive-whatsapp-review", {
        body: {
          flow_token: token,
          rating,
          text: text.trim(),
          author_name: authorName.trim() || null,
          phone: phone.trim() || null,
        },
      });

      if (error || data?.error) {
        const msg = data?.error ?? error?.message ?? "שגיאה לא ידועה";
        setErrorMsg(msg);
        setPageState("ready");
        return;
      }

      setPageState("success");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "שגיאת רשת — נסו שוב");
      setPageState("ready");
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-[#25D366]" />
      </div>
    );
  }

  // ── Invalid token ───────────────────────────────────────────────────────────
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

  // ── Success ─────────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-5" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-[#25D366]/15 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-[#25D366]" />
        </div>
        <h1 className="text-xl font-bold text-foreground">תודה על הביקורת!</h1>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          הביקורת התקבלה בהצלחה ותוצג לאחר אישור בעל העסק.
        </p>
        {businessSlug && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/business/${businessSlug}`)}
          >
            צפו בדף העסק
          </Button>
        )}
      </div>
    );
  }

  // ── Review form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-10" dir="rtl">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#25D366]/15 flex items-center justify-center">
            <WhatsAppIcon size={28} />
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
            <Label htmlFor="wa-text" className="text-sm font-medium">
              הביקורת שלכם <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="wa-text"
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
            <Label htmlFor="wa-name" className="text-sm font-medium">
              שם <span className="text-muted-foreground text-xs font-normal">(אופציונלי)</span>
            </Label>
            <Input
              id="wa-name"
              placeholder="השם שלכם"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </div>

          {/* Phone (optional, for dedup only) */}
          <div className="space-y-2">
            <Label htmlFor="wa-phone" className="text-sm font-medium">
              מספר טלפון <span className="text-muted-foreground text-xs font-normal">(אופציונלי — לאימות בלבד)</span>
            </Label>
            <Input
              id="wa-phone"
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
            className="w-full bg-[#25D366] hover:bg-[#22c55e] text-white gap-2"
          >
            {pageState === "submitting" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <WhatsAppIcon size={15} />
                שלחו ביקורת
              </>
            )}
          </Button>

          {/* Privacy note */}
          <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
            הביקורת תוצג לאחר אישור בעל העסק. ReviewHub שומרת את הביקורת על פי מדיניות הפרטיות.
          </p>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppReviewPage;
