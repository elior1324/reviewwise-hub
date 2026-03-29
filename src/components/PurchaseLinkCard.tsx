/**
 * PurchaseLinkCard — Simple dashboard card for managing purchase link & coupon code.
 *
 * Business owners use this to:
 *   1. Set a purchase/affiliate link (displayed as CTA on their public profile)
 *   2. Optionally add a coupon code (displayed next to the CTA)
 *
 * Either a link or a coupon is enough — both are optional.
 * Data is saved to businesses.personal_affiliate_url and businesses.collaboration_coupon.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link2, Tag, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Props {
  businessId: string;
}

const PurchaseLinkCard = ({ businessId }: Props) => {
  const [link, setLink] = useState("");
  const [coupon, setCoupon] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load current values from DB
  useEffect(() => {
    supabase
      .from("businesses")
      .select("personal_affiliate_url, collaboration_coupon")
      .eq("id", businessId)
      .single()
      .then(({ data }) => {
        if (data) {
          setLink(data.personal_affiliate_url || "");
          setCoupon(data.collaboration_coupon || "");
        }
        setLoaded(true);
      });
  }, [businessId]);

  const handleSave = async () => {
    setSaving(true);
    const trimmedLink = link.trim();
    const trimmedCoupon = coupon.trim().toUpperCase();

    // Validate URL if provided
    if (trimmedLink) {
      try {
        new URL(trimmedLink);
      } catch {
        toast.error("כתובת הקישור אינה תקינה — יש להזין כתובת מלאה (https://...)");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("businesses")
      .update({
        personal_affiliate_url: trimmedLink || null,
        affiliate_mode: trimmedLink ? "personal_affiliate" : "none",
        collaboration_coupon: trimmedCoupon || null,
        collaboration_active: !!(trimmedLink || trimmedCoupon),
        collaboration_method: trimmedLink && trimmedCoupon ? "both" : trimmedLink ? "link" : trimmedCoupon ? "coupon" : null,
      })
      .eq("id", businessId);

    if (error) {
      toast.error("שגיאה בשמירה");
    } else {
      toast.success("נשמר בהצלחה");
    }
    setSaving(false);
  };

  if (!loaded) return null;

  const hasData = link.trim() || coupon.trim();

  return (
    <Card className="mb-6 border-primary/20 bg-primary/3">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ExternalLink size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">קישור רכישה וקופון</h3>
            <p className="text-[11px] text-muted-foreground">יוצג בדף הפרופיל הציבורי שלכם</p>
          </div>
        </div>

        <div className="space-y-3 max-w-lg">
          {/* Purchase Link */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Link2 size={11} /> קישור רכישה
            </Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://yoursite.com/buy"
              className="h-9 text-sm"
              dir="ltr"
            />
          </div>

          {/* Coupon Code */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Tag size={11} /> קוד קופון (אופציונלי)
            </Label>
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="לדוגמה: SAVE10"
              className="h-9 text-sm font-mono tracking-wider"
              dir="ltr"
              maxLength={30}
            />
          </div>

          {/* Helper text */}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {!hasData
              ? "הוסיפו קישור רכישה או קוד קופון — הלקוחות יראו אותם בדף הפרופיל שלכם. אין לכם קישור? השתמשו בקוד קופון בלבד."
              : "הקישור והקופון מוצגים בדף הפרופיל הציבורי שלכם. לקוחות יכולים לרכוש ישירות או להשתמש בקוד."}
          </p>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-1.5"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            {saving ? "שומר..." : "שמור"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseLinkCard;
