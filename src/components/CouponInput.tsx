/**
 * CouponInput — רכיב הזנת קופון (MVP)
 *
 * מציג שדה קלט + כפתור. כשהמשתמש שולח קוד:
 *  1. קורא ל-Edge Function apply-coupon
 *  2. מציג הצלחה / שגיאה
 *  3. מעדכן את ה-parent שהקופון הופעל
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, CheckCircle2, Loader2 } from "lucide-react";

interface CouponInputProps {
  businessId?: string;
  /** called when coupon is successfully redeemed */
  onSuccess?: (billingStartsAt: string) => void;
}

export default function CouponInput({ businessId, onSuccess }: CouponInputProps) {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("נא להזין קוד קופון"); return; }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("apply-coupon", {
        body: { code: trimmed, business_id: businessId },
      });

      if (fnError || !data?.success) {
        setError(data?.error ?? "שגיאה בהפעלת הקופון. נסה שנית.");
        return;
      }

      setSuccess(data.message);
      setCode("");
      onSuccess?.(data.billing_starts_at);
    } catch {
      setError("שגיאת רשת. נסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  // ── If already redeemed (success shown), render confirmation card
  if (success) {
    return (
      <Card className="border-green-700 bg-green-950/30">
        <CardContent className="flex items-center gap-3 py-4 px-5">
          <CheckCircle2 className="text-green-400 shrink-0" size={22} />
          <p className="text-green-300 text-sm font-medium">{success}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-700 bg-zinc-900/50">
      <CardContent className="py-4 px-5">
        <p className="text-sm text-zinc-400 mb-3 flex items-center gap-2">
          <Tag size={15} className="text-green-500" />
          יש לך קוד קופון? הזן כאן לקבלת חודש חינם + 2 חודשים ב-90% הנחה
        </p>

        <div className="flex gap-2 dir-ltr" dir="ltr">
          <Input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
            onKeyDown={e => e.key === "Enter" && handleApply()}
            placeholder="RH-XXXX-XXXX"
            className="font-mono tracking-widest bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 uppercase"
            maxLength={12}
            disabled={loading}
          />
          <Button
            onClick={handleApply}
            disabled={loading || !code.trim()}
            className="bg-green-700 hover:bg-green-600 text-white shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "הפעל"}
          </Button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
