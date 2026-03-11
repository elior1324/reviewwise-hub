/**
 * LiabilityShieldBanner — Liability Shield Response Generator
 *
 * Shown to business owners when:
 *   a) A dispute is in "escalated" state (business threatened legal action
 *      AFTER the reviewer's evidence was verified), OR
 *   b) An admin resolves a dispute as "upheld" (review is kept)
 *
 * Generates a standard Hebrew legal response that the business owner can
 * copy and send to their legal counsel, proving that:
 *   1. ReviewHub verified the transaction
 *   2. The platform is a neutral intermediary (Safe Harbor)
 *   3. Further legal claims must target the verified reviewer, not the platform
 *
 * The generated letter is court-admissible as evidence of due diligence.
 */

import { useState }  from "react";
import { motion }    from "framer-motion";
import {
  Shield, Copy, Check, Download,
  Scale, Gavel, FileText,
} from "lucide-react";
import { Button }    from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }     from "@/components/ui/badge";
import { toast }     from "sonner";

interface LiabilityShieldBannerProps {
  reviewId:      string;
  businessName:  string;
  reviewerEmail?: string;   // shown only if admin passes it; normally hidden
  verifiedAt?:   string;    // ISO timestamp when evidence was verified
  evidenceRef?:  string;    // internal reference like "EVD-2026-03-11-abc123"
  onDismiss?:    () => void;
}

const LiabilityShieldBanner = ({
  reviewId,
  businessName,
  reviewerEmail,
  verifiedAt,
  evidenceRef,
  onDismiss,
}: LiabilityShieldBannerProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const verifiedDate = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString("he-IL", {
        day: "2-digit", month: "long", year: "numeric",
        timeZone: "Asia/Jerusalem",
      })
    : new Date().toLocaleDateString("he-IL", { day: "2-digit", month: "long", year: "numeric" });

  const refLine = evidenceRef
    ? `מס' אסמכתא: ${evidenceRef}`
    : `מס' ביקורת: ${reviewId.slice(0, 8).toUpperCase()}`;

  // ── The generated legal letter ────────────────────────────────────────────
  const legalLetter = `
לכבוד,
${businessName}

הנדון: תגובה רשמית לדרישה משפטית — Safe Harbor / צינור להעברת מידע

תאריך: ${verifiedDate}
${refLine}

בהתאם לחוק איסור לשון הרע, התשכ"ה-1965 (סעיף 15), וכן לעקרונות ה-Safe Harbor המוכרים בדין הישראלי ובדין האיחוד האירופי (EU DSA, Article 6), ReviewHub מתפקדת כ"צינור להעברת מידע" בלבד — פלטפורמה טכנולוגית ניטרלית.

לאחר קבלת ערעורכם, ReviewHub ביצעה את הדברים הבאים:

1. ✅ הביקורת הועברה לסטטוס "בחקירה" ונחסמה מהצגה ציבורית זמנית.
2. ✅ הכותב קיבל הודעה רשמית ונדרש להגיש הוכחת עסקה בתוך 72 שעות.
3. ✅ הכותב הגיש מסמך הוכחה (קבלה / חשבונית / אישור עסקה).
4. ✅ צוות ReviewHub בחן את המסמך ואימת את אמיתותו.
5. ✅ הביקורת הוחזרה לפלטפורמה עם תג "מאומת משפטית".

בשלב זה, ReviewHub מיצתה את חובתה כפלטפורמה ניטרלית על פי הדין.

⚠️ חשוב לציין:
ReviewHub אינה צד בסכסוך המשפטי הנוגע לתוכן הביקורת הספציפית.
על פי חוק איסור לשון הרע, התשכ"ה-1965, האחריות לתוכן שפרסם המשתמש מוטלת על המשתמש בלבד.
כל הליך משפטי הנוגע לתוכן הביקורת — לרבות תביעות בגין לשון הרע, עובדות כוזבות, או פגיעה במוניטין — יש להפנות ישירות כלפי כותב הביקורת, ולא כלפי ReviewHub.

ReviewHub שמרה את כל המידע המזהה הרלוונטי (כולל כתובת IP, כתובת דוא"ל מאומתת, חותמות זמן ומסמך הראיה) ותחשוף אותו בהתאם לצו בית משפט, בכפוף לחוק הגנת הפרטיות, התשמ"א-1981.

לפניות משפטיות: legal@reviewshub.info

בכבוד רב,
צוות משפטי ReviewHub
`.trim();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(legalLetter);
    setCopied(true);
    toast.success("הועתק ללוח");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([legalLetter], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `reviewhub-safe-harbor-response-${reviewId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("הקובץ הורד");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-card border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-bold text-foreground">מגן אחריות פעיל</p>
                <Badge className="text-[10px] bg-primary/15 text-primary border-0">
                  Safe Harbor ✓
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ReviewHub אימתה את העסקה. הפלטפורמה מוגנת — האחריות עברה לכותב הביקורת.
              </p>
            </div>
          </div>

          {/* Status steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[
              { icon: Gavel,    label: "ערעור נפתח"     },
              { icon: FileText, label: "ראיה התקבלה"    },
              { icon: Scale,    label: "אומתה ע\"י Admin" },
              { icon: Shield,   label: "Safe Harbor פעיל" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 border border-primary/15">
                <s.icon size={13} className="text-primary shrink-0" />
                <span className="text-[10px] text-muted-foreground leading-snug">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Expand/collapse letter */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs gap-1.5 mb-3 border-primary/30 hover:border-primary/60"
          >
            <FileText size={13} />
            {expanded ? "הסתר מכתב משפטי" : "הצג מכתב Safe Harbor לשליחה לעורך דין"}
          </Button>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <pre
                dir="rtl"
                className="text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-xl p-4 whitespace-pre-wrap leading-relaxed font-sans mb-3 max-h-72 overflow-y-auto"
              >
                {legalLetter}
              </pre>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="flex-1 gap-1.5 text-xs bg-primary text-primary-foreground"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "הועתק!" : "העתקה ללוח"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="gap-1.5 text-xs"
                >
                  <Download size={13} />
                  הורדה כ-TXT
                </Button>
              </div>
            </motion.div>
          )}

          {/* Dismiss */}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="w-full text-xs text-muted-foreground mt-2"
            >
              סגירה
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LiabilityShieldBanner;
