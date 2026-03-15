import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Handshake, Link2, Tag, Check, Copy, ExternalLink, Info, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type CollabMethod = "link" | "coupon" | "both";

export interface CollabConfig {
  active: boolean;
  method: CollabMethod | null;
  coupon: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessSlug: string;
  initial: CollabConfig;
  onSaved: (cfg: CollabConfig) => void;
}

const BASE_URL = "https://reviewhub.co.il";

const METHOD_OPTIONS: { id: CollabMethod; label: string; sub: string; icon: any }[] = [
  {
    id: "link",
    label: "קישור הפניה",
    sub: "ReviewHub תפנה גולשים לאתרכם דרך קישור ייחודי — כל קליק נמדד.",
    icon: Link2,
  },
  {
    id: "coupon",
    label: "קופון הנחה",
    sub: "צרו קוד קופון שגולשי ReviewHub ישתמשו בו באתרכם ויקבלו 10% הנחה.",
    icon: Tag,
  },
  {
    id: "both",
    label: "שניהם",
    sub: "השתמשו בקישור הפניה וגם בקופון — כפל חשיפה.",
    icon: Handshake,
  },
];

const CollaborationSetupModal = ({
  open, onClose, businessId, businessSlug, initial, onSaved,
}: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"intro" | "configure" | "done">(
    initial.active ? "configure" : "intro"
  );
  const [method, setMethod] = useState<CollabMethod>(initial.method ?? "link");
  const [coupon, setCoupon] = useState<string>(initial.coupon ?? "REVIEWHUB10");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralUrl = `${BASE_URL}/go/${businessSlug}`;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        collaboration_active: true,
        collaboration_method: method,
        collaboration_coupon: method === "link" ? null : coupon.trim().toUpperCase() || "REVIEWHUB10",
        collaboration_activated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    setSaving(false);

    if (error) {
      toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
      return;
    }

    onSaved({
      active: true,
      method,
      coupon: method === "link" ? null : coupon.trim().toUpperCase() || "REVIEWHUB10",
    });

    toast({
      title: "תוכנית שיתוף הפעולה הופעלה!",
      description: "הפרופיל הציבורי שלכם יציג תנאי רכישה מסונכרנים לגולשי ReviewHub.",
    });

    setStep("done");
  };

  const handleDeactivate = async () => {
    setSaving(true);
    await supabase
      .from("businesses")
      .update({ collaboration_active: false })
      .eq("id", businessId);
    setSaving(false);
    onSaved({ active: false, method: null, coupon: null });
    toast({ title: "תוכנית שיתוף הפעולה הושהתה" });
    onClose();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Handshake size={20} className="text-primary" />
            תוכנית שיתוף הפעולה של ReviewHub
          </DialogTitle>
        </DialogHeader>

        {/* ── Step: Intro ───────────────────────────────────────────── */}
        {step === "intro" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              הצטרפו לתוכנית שיתוף הפעולה ואפשרו ל-ReviewHub לחבר אתכם עם לקוחות פוטנציאליים דרך תשתית האימות. גולשים שיגיעו דרך ReviewHub יוכלו לרכוש עם תנאי מסונכרנים — ורכישתם תעבור אימות לביקורת מאומתת עתידית. ReviewHub עשויה לקבל אות תפעולי מרכישות אלו — הדבר מצוין בגילוי נאות ברור לגולש ואינו משפיע על ציון האמון שלכם.
            </p>

            <div className="grid gap-3">
              {[
                ["אימות רכישה מוגבר", "רכישות דרך ReviewHub עוברות תהליך אימות ומאפשרות ביקורות מאומתות."],
                ["תנאי מסונכרנים לגולש", "תנאי הרכישה המסונכרנים מסופקים ישירות על ידי הספק — שקופים לחלוטין."],
                ["השתתפות אופציונלית", "ניתן להפסיק בכל עת. עסקים שאינם משתתפים ממשיכים להופיע ומדורגים לפי ציון אמון."],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3 items-start">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 flex gap-2 text-xs text-muted-foreground">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <span>
                הפרופיל הציבורי שלכם יציג תיבת "תנאי רכישה מסונכרנים" כאשר התוכנית פעילה.
                הגולש יראה גילוי נאות ברור — כולל הסבר על תשתית האימות.
              </span>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={onClose}>ביטול</Button>
              <Button size="sm" onClick={() => setStep("configure")} className="gap-1">
                הגדרת תוכנית <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Configure ───────────────────────────────────────── */}
        {step === "configure" && (
          <div className="space-y-5">
            {/* Method selector */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">שיטת שיתוף הפעולה</Label>
              <div className="grid gap-2">
                {METHOD_OPTIONS.map(({ id, label, sub, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-right transition-all ${
                      method === id
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                      method === id ? "bg-primary/10" : "bg-muted/50"
                    }`}>
                      <Icon size={15} className={method === id ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${method === id ? "text-foreground" : "text-muted-foreground"}`}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</p>
                    </div>
                    <div className={`mt-1.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      method === id ? "border-primary" : "border-border"
                    }`}>
                      {method === id && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Referral link preview */}
            {(method === "link" || method === "both") && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">קישור הפניה שלכם</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={referralUrl}
                    className="font-mono text-xs bg-muted/30 border-border/50"
                  />
                  <Button variant="outline" size="sm" onClick={copyLink} className="gap-1 shrink-0">
                    {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                    {copied ? "הועתק" : "העתקה"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  קישור זה יופיע בפרופיל הציבורי שלכם. כל קליק נרשם אוטומטית.
                </p>
              </div>
            )}

            {/* Coupon input */}
            {(method === "coupon" || method === "both") && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">קוד קופון</Label>
                <Input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="REVIEWHUB10"
                  maxLength={30}
                  className="font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  הלקוח יזין קוד זה בקופה שלכם ויקבל 10% הנחה. אתם אחראים להטמיע את ההנחה
                  במערכת שלכם.
                </p>
              </div>
            )}

            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 flex gap-2 text-xs text-muted-foreground">
              <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                גילוי נאות יוצג לגולשים בסמוך לכפתור ההפניה: "ReviewHub עשויה לקבל עמלה
                אם תרכשו דרך קישור זה."
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              {initial.active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeactivate}
                  disabled={saving}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                >
                  השבתת תוכנית
                </Button>
              )}
              <div className="flex gap-2 mr-auto">
                <Button variant="ghost" size="sm" onClick={onClose}>ביטול</Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                >
                  {saving ? "שומר..." : initial.active ? "עדכון הגדרות" : "הפעלת תוכנית"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Done ────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check size={28} className="text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-foreground">התוכנית פעילה!</p>
              <p className="text-sm text-muted-foreground mt-1">
                הפרופיל הציבורי שלכם מציג עכשיו תנאי רכישה מסונכרנים לגולשי ReviewHub.
              </p>
            </div>

            {(method === "link" || method === "both") && (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-right">
                <p className="text-xs font-semibold text-foreground mb-1.5">הקישור שלכם:</p>
                <div className="flex gap-2">
                  <Input readOnly value={referralUrl} className="font-mono text-xs bg-muted/30 text-xs h-8" />
                  <Button variant="outline" size="sm" onClick={copyLink} className="gap-1 shrink-0 h-8">
                    {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                  </Button>
                </div>
              </div>
            )}

            {(method === "coupon" || method === "both") && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 py-3 px-5">
                <p className="text-xs text-muted-foreground mb-1">קוד הקופון:</p>
                <p className="font-mono font-bold text-xl text-primary tracking-widest">
                  {coupon.trim().toUpperCase() || "REVIEWHUB10"}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button size="sm" variant="outline" onClick={() => setStep("configure")}>
                עריכת הגדרות
              </Button>
              <Button size="sm" asChild>
                <a href={`/biz/${businessSlug}`} target="_blank" rel="noopener noreferrer" className="gap-1">
                  <ExternalLink size={13} /> הצגת פרופיל ציבורי
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CollaborationSetupModal;
