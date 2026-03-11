/**
 * ProofUploadPanel — Full UI for attaching Proof of Experience to a review.
 *
 * Renders a 2×2 card grid (one per proof type) with:
 *   • Status indicator (locked / pending / verified / rejected)
 *   • Inline upload / capture action per type
 *   • Progress feedback and error messages
 *   • Combined score preview showing multiplier effect on points
 *
 * Integration:
 *   Place inside WriteReview or a post-submission "Boost your review" flow.
 *   Reads and writes via useReviewProofs hook.
 *
 * Props:
 *   reviewId     — UUID of the review to attach proofs to
 *   basePoints   — base point value of the review (default 100)
 *   onProofAdded — callback fired after any proof is successfully attached
 *   compact      — slim list mode (for sidebar / drawer)
 *
 * Usage:
 *   <ProofUploadPanel reviewId={review.id} basePoints={100} />
 */

import { useRef, useState }          from "react";
import { motion, AnimatePresence }   from "framer-motion";
import {
  Receipt, MapPin, Camera, CalendarCheck,
  CheckCircle2, Clock, XCircle, Loader2,
  Upload, LocateFixed, Hash, ChevronDown,
  ChevronUp, Sparkles, Shield, Info,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { ProofBadgeStrip, ProofScoreSummary, PROOF_META }
  from "@/components/ProofBadge";
import {
  useReviewProofs,
  getProofErrorMessage,
  type ReviewProof,
}  from "@/hooks/useReviewProofs";
import type { ProofType } from "@/components/ProofBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProofUploadPanelProps {
  reviewId:     string;
  basePoints?:  number;
  onProofAdded?: (proofId: string, type: ProofType) => void;
  compact?:     boolean;
}

// ─── Proof card config ────────────────────────────────────────────────────────

interface ProofCardConfig {
  type:        ProofType;
  titleHe:     string;
  descHe:      string;
  icon:        React.FC<{ size?: number; className?: string }>;
  actionLabel: string;
  inputType:   "file" | "geolocation" | "text";
  acceptMime?: string;
}

const PROOF_CARDS: ProofCardConfig[] = [
  {
    type:        "purchase_receipt",
    titleHe:     "קבלת רכישה",
    descHe:      "העלה PDF או תמונה של קבלת הרכישה שלך",
    icon:        Receipt,
    actionLabel: "העלה קבלה",
    inputType:   "file",
    acceptMime:  "image/jpeg,image/png,image/webp,image/heic,application/pdf",
  },
  {
    type:        "booking_ref",
    titleHe:     "מספר הזמנה",
    descHe:      "הזן את קוד ההזמנה שקיבלת מ-ReviewHub",
    icon:        CalendarCheck,
    actionLabel: "אמת הזמנה",
    inputType:   "text",
  },
  {
    type:        "photo_evidence",
    titleHe:     "צילום עדות",
    descHe:      "צרף תמונה מהביקור שלך בעסק",
    icon:        Camera,
    actionLabel: "העלה תמונה",
    inputType:   "file",
    acceptMime:  "image/jpeg,image/png,image/webp,image/heic",
  },
  {
    type:        "location_gps",
    titleHe:     "אימות מיקום",
    descHe:      "אמת שנמצאת קרוב לעסק בזמן כתיבת הביקורת",
    icon:        MapPin,
    actionLabel: "שתף מיקום",
    inputType:   "geolocation",
  },
];

// ─── Helper: proof status display ─────────────────────────────────────────────

function proofStatusDisplay(proof: ReviewProof | undefined): {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  color: string;
} {
  if (!proof)
    return { icon: Clock,        label: "לא הוגש",    color: "text-muted-foreground" };
  switch (proof.proof_status) {
    case "verified":   return { icon: CheckCircle2, label: "מאומת",      color: "text-emerald-500" };
    case "pending":    return { icon: Clock,        label: "בבדיקה",     color: "text-amber-500"   };
    case "processing": return { icon: Loader2,      label: "מעבד...",    color: "text-blue-500"    };
    case "rejected":   return { icon: XCircle,      label: "נדחה",       color: "text-red-500"     };
    case "expired":    return { icon: XCircle,      label: "פג תוקף",    color: "text-muted-foreground" };
    default:           return { icon: Clock,        label: "לא ידוע",    color: "text-muted-foreground" };
  }
}

// ─── Single proof card ────────────────────────────────────────────────────────

function ProofCard({
  config,
  existingProof,
  onAttachFile,
  onAttachLocation,
  onAttachBookingRef,
  uploading,
  activeType,
}: {
  config:            ProofCardConfig;
  existingProof:     ReviewProof | undefined;
  onAttachFile:      (type: "purchase_receipt" | "photo_evidence", file: File) => void;
  onAttachLocation:  () => void;
  onAttachBookingRef: (ref: string) => void;
  uploading:         boolean;
  activeType:        ProofType | null;
}) {
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [bookingRef, setBookingRef] = useState("");
  const [expanded, setExpanded]     = useState(!existingProof);

  const Icon   = config.icon;
  const meta   = PROOF_META[config.type];
  const status = proofStatusDisplay(existingProof);
  const StatusIcon = status.icon;
  const isActive   = activeType === config.type;
  const isVerified = existingProof?.proof_status === "verified";
  const isPending  = existingProof?.proof_status === "pending";

  return (
    <motion.div
      layout
      className={`
        rounded-xl border bg-card transition-all duration-200
        ${isVerified
          ? "border-emerald-200 dark:border-emerald-800 shadow-sm shadow-emerald-100 dark:shadow-emerald-900/20"
          : "border-border hover:border-primary/30"
        }
      `}
    >
      {/* Card header */}
      <button
        type="button"
        onClick={() => !isVerified && setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-right"
      >
        {/* Type icon */}
        <div className={`
          flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
          ${isVerified ? `${meta.bg} ${meta.border} border` : "bg-muted"}
        `}>
          <Icon size={16} className={isVerified ? meta.color : "text-muted-foreground"} />
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 flex-row-reverse justify-end">
            <span className="text-sm font-semibold text-foreground">{config.titleHe}</span>
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${meta.color}`}>
              {meta.multiplier}×
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{config.descHe}</p>
        </div>

        {/* Status */}
        <div className={`flex-shrink-0 flex items-center gap-1 ${status.color}`}>
          <StatusIcon size={14} className={existingProof?.proof_status === "processing" ? "animate-spin" : ""} />
          <span className="text-xs font-medium hidden sm:block">{status.label}</span>
        </div>

        {/* Expand toggle */}
        {!isVerified && (
          <div className="text-muted-foreground ml-1">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </button>

      {/* Action area */}
      <AnimatePresence>
        {expanded && !isVerified && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/50 pt-3">

              {/* Rejection reason */}
              {existingProof?.proof_status === "rejected" && existingProof.rejection_reason && (
                <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 flex items-start gap-2">
                  <XCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {existingProof.rejection_reason}
                  </p>
                </div>
              )}

              {/* Pending note */}
              {isPending && (
                <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Clock size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    ההוכחה בתהליך אימות. זה בדרך כלל לוקח עד 24 שעות.
                  </p>
                </div>
              )}

              {/* File upload */}
              {config.inputType === "file" && !isPending && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={config.acceptMime}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onAttachFile(config.type as "purchase_receipt" | "photo_evidence", file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full gap-2"
                  >
                    {isActive && uploading
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Upload size={14} />
                    }
                    {isActive && uploading ? "מעלה..." : config.actionLabel}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center flex items-center justify-center gap-1">
                    <Shield size={9} />
                    הקובץ נשמר בצורה מוצפנת. לא נשמר תוכן הקובץ, רק חתימה דיגיטלית.
                  </p>
                </>
              )}

              {/* Geolocation */}
              {config.inputType === "geolocation" && !isPending && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAttachLocation}
                    disabled={uploading}
                    className="w-full gap-2"
                  >
                    {isActive && uploading
                      ? <Loader2 size={14} className="animate-spin" />
                      : <LocateFixed size={14} />
                    }
                    {isActive && uploading ? "קורא מיקום..." : config.actionLabel}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center flex items-center justify-center gap-1">
                    <Info size={9} />
                    הקואורדינטות לא מוצגות. נשמר רק המרחק מהעסק.
                  </p>
                </>
              )}

              {/* Booking reference text input */}
              {config.inputType === "text" && !isPending && (
                <div className="space-y-2">
                  <div className="relative">
                    <Hash size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="REV-XXXXXXXX"
                      className="pr-8 text-right text-sm"
                      value={bookingRef}
                      onChange={(e) => setBookingRef(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && bookingRef.trim()) {
                          onAttachBookingRef(bookingRef);
                        }
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAttachBookingRef(bookingRef)}
                    disabled={uploading || !bookingRef.trim()}
                    className="w-full gap-2"
                  >
                    {isActive && uploading ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} />}
                    {isActive && uploading ? "מאמת..." : config.actionLabel}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProofUploadPanel({
  reviewId,
  basePoints = 100,
  onProofAdded,
  compact = false,
}: ProofUploadPanelProps) {
  const {
    proofs,
    loading,
    uploading,
    error,
    attachFileProof,
    attachLocationProof,
    attachBookingRefProof,
  } = useReviewProofs(reviewId);

  const [activeType, setActiveType] = useState<ProofType | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const verifiedProofs = proofs.filter((p) => p.proof_status === "verified");
  const verifiedTypes  = verifiedProofs.map((p) => p.proof_type);

  // Best multiplier from all verified proofs
  const bestMultiplier = verifiedProofs.length > 0
    ? Math.max(...verifiedProofs.map((p) => p.multiplier_granted))
    : 1.0;
  const boostedPoints  = Math.round(basePoints * bestMultiplier);

  // ── Action wrappers ────────────────────────────────────────────────────────

  async function handleAttachFile(type: "purchase_receipt" | "photo_evidence", file: File) {
    setLocalError(null);
    setActiveType(type);
    const id = await attachFileProof({ proofType: type, file });
    if (id) onProofAdded?.(id, type);
    else if (error) setLocalError(getProofErrorMessage(error));
    setActiveType(null);
  }

  async function handleAttachLocation() {
    setLocalError(null);
    setActiveType("location_gps");
    const id = await attachLocationProof();
    if (id) onProofAdded?.(id, "location_gps");
    else if (error) setLocalError(getProofErrorMessage(error));
    setActiveType(null);
  }

  async function handleAttachBookingRef(ref: string) {
    setLocalError(null);
    setActiveType("booking_ref");
    const id = await attachBookingRefProof({ bookingReference: ref });
    if (id) onProofAdded?.(id, "booking_ref");
    else if (error) setLocalError(getProofErrorMessage(error));
    setActiveType(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">הוכחת ניסיון</h3>
            <p className="text-xs text-muted-foreground">
              הוסף עדויות ותגדיל את מכפיל הנקודות שלך
            </p>
          </div>
        </div>
      )}

      {/* Score preview */}
      {verifiedProofs.length > 0 && !compact && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>{verifiedProofs.length} הוכחות אומתו</span>
            </div>
            <div className="text-right">
              <ProofScoreSummary proofTypes={verifiedTypes} basePoints={basePoints} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Error banner */}
      <AnimatePresence>
        {localError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{    opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
          >
            <XCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{localError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof cards grid */}
      <div className={compact ? "space-y-2" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        {PROOF_CARDS.map((cfg) => (
          <ProofCard
            key={cfg.type}
            config={cfg}
            existingProof={proofs.find((p) =>
              p.proof_type === cfg.type &&
              p.proof_status !== "rejected"
            )}
            onAttachFile={handleAttachFile}
            onAttachLocation={handleAttachLocation}
            onAttachBookingRef={handleAttachBookingRef}
            uploading={uploading}
            activeType={activeType}
          />
        ))}
      </div>

      {/* Verified strip */}
      {verifiedTypes.length > 0 && (
        <div className="pt-1">
          <Label className="text-xs text-muted-foreground mb-2 block">הוכחות מאומתות</Label>
          <ProofBadgeStrip
            proofTypes={verifiedTypes}
            proofDetails={verifiedProofs.map((p) => ({
              proof_type:              p.proof_type,
              verified_at:             p.verified_at,
              verified_by:             p.verified_by,
              multiplier_granted:      p.multiplier_granted,
              distance_from_business_m: p.distance_from_business_m,
            }))}
            size="sm"
          />
        </div>
      )}

      {/* Privacy note */}
      {!compact && (
        <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 pt-1">
          <Shield size={10} className="mt-0.5 flex-shrink-0 text-emerald-500" />
          הקבצים שלך מוצפנים ומוגנים. קבלות מאוחסנות בפרטיות מלאה — רק חתימה דיגיטלית
          (SHA-256) נשמרת במסד הנתונים. אין גישה לתוכן הקובץ עצמו.
        </p>
      )}
    </div>
  );
}
