/**
 * useReviewProofs — Data hook for attaching and reading Proof of Experience signals.
 *
 * Covers all four proof types from migration 000012:
 *   purchase_receipt  — file upload (PDF/image) → Supabase Storage
 *   location_gps      — browser Geolocation API coordinates
 *   photo_evidence    — image upload → Supabase Storage
 *   booking_ref       — booking reference string (auto-verified)
 *
 * Principles:
 *   • Never stores raw file in state — only upload to storage then record the path
 *   • Receipt files go to private bucket 'review-proofs'; path pattern:
 *       {userId}/{reviewId}/{proofType}/{timestampMs}.{ext}
 *   • SHA-256 hash is computed in-browser before upload for Safe Harbor compliance
 *   • Signed URLs are fetched on-demand (5-minute TTL) and not cached in state
 *   • Location proof uses browser Geolocation API with 10-second timeout
 *
 * Usage:
 *   const {
 *     proofs, loading,
 *     attachFileProof, attachLocationProof, attachBookingRefProof,
 *     getSignedUrl, refetch,
 *   } = useReviewProofs(reviewId);
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth }  from "@/contexts/AuthContext";
import type { ProofType } from "@/components/ProofBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewProof {
  id:                       string;
  review_id:                string;
  user_id:                  string;
  proof_type:               ProofType;
  proof_status:             "pending" | "processing" | "verified" | "rejected" | "expired";
  storage_path:             string | null;
  storage_bucket:           string;
  file_size_bytes:          number | null;
  file_mime:                string | null;
  location_lat:             number | null;
  location_lng:             number | null;
  location_accuracy_m:      number | null;
  location_captured_at:     string | null;
  distance_from_business_m: number | null;
  booking_reference:        string | null;
  multiplier_granted:       number;
  verified_at:              string | null;
  verified_by:              string | null;
  rejection_reason:         string | null;
  rejection_code:           string | null;
  expires_at:               string | null;
  created_at:               string;
}

export interface AttachFileProofArgs {
  proofType: "purchase_receipt" | "photo_evidence";
  file:      File;
}

export interface AttachLocationProofArgs {
  reviewId?: string;   // override; defaults to hook's reviewId
}

export interface AttachBookingRefArgs {
  bookingReference: string;
}

export interface UseReviewProofsReturn {
  proofs:                 ReviewProof[];
  loading:                boolean;
  uploading:              boolean;
  error:                  string | null;
  attachFileProof:        (args: AttachFileProofArgs) => Promise<string | null>;
  attachLocationProof:    (args?: AttachLocationProofArgs) => Promise<string | null>;
  attachBookingRefProof:  (args: AttachBookingRefArgs) => Promise<string | null>;
  getSignedUrl:           (storagePath: string) => Promise<string | null>;
  refetch:                () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute SHA-256 of a File object — browser native crypto */
async function sha256File(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Extract file extension from MIME type or filename */
function fileExtension(file: File): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg":       "jpg",
    "image/jpg":        "jpg",
    "image/png":        "png",
    "image/webp":       "webp",
    "image/heic":       "heic",
    "application/pdf":  "pdf",
  };
  return mimeMap[file.type] ?? file.name.split(".").pop() ?? "bin";
}

/** Read browser GPS position — returns a promise or throws */
function getBrowserLocation(timeoutMs = 10_000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation_not_supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout:            timeoutMs,
      maximumAge:         0,        // must be fresh reading
    });
  });
}

/** Validate MIME type is acceptable for upload */
function validateFileMime(file: File): boolean {
  const allowed = new Set([
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "image/heic", "application/pdf",
  ]);
  return allowed.has(file.type);
}

/** Max file size: 10 MB */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReviewProofs(reviewId: string): UseReviewProofsReturn {
  const { user } = useAuth();

  const [proofs,     setProofs]     = useState<ReviewProof[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Fetch proofs ───────────────────────────────────────────────────────────
  const fetchProofs = useCallback(async () => {
    if (!reviewId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("review_proofs")
      .select("*")
      .eq("review_id", reviewId)
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setProofs((data as ReviewProof[]) ?? []);
    }
    setLoading(false);
  }, [reviewId]);

  useEffect(() => { fetchProofs(); }, [fetchProofs]);

  // ── Attach file-based proof (purchase_receipt or photo_evidence) ───────────
  const attachFileProof = useCallback(
    async ({ proofType, file }: AttachFileProofArgs): Promise<string | null> => {
      if (!user) { setError("login_required"); return null; }

      // Validate
      if (!validateFileMime(file)) {
        setError("invalid_file_type");
        return null;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("file_too_large");
        return null;
      }
      // Check no active proof of this type already
      const alreadyActive = proofs.some(
        (p) => p.proof_type === proofType &&
               ["pending", "processing", "verified"].includes(p.proof_status)
      );
      if (alreadyActive) { setError("proof_already_active"); return null; }

      setUploading(true);
      setError(null);

      try {
        // 1. Compute SHA-256 (Safe Harbor — stored server-side, not the file)
        const fileHash = await sha256File(file);
        const ext      = fileExtension(file);
        const path     = `${user.id}/${reviewId}/${proofType}/${Date.now()}.${ext}`;

        // 2. Upload file to private bucket
        const { error: uploadErr } = await supabase.storage
          .from("review-proofs")
          .upload(path, file, {
            contentType:  file.type,
            cacheControl: "3600",
            upsert:       false,
          });
        if (uploadErr) throw new Error(uploadErr.message);

        // 3. Attach proof via DB function
        const { data: proofId, error: fnErr } = await supabase
          .rpc("fn_attach_proof", {
            p_review_id:       reviewId,
            p_user_id:         user.id,
            p_proof_type:      proofType,
            p_storage_path:    path,
            p_file_hash:       fileHash,
            p_file_size_bytes: file.size,
            p_file_mime:       file.type,
          });
        if (fnErr) throw new Error(fnErr.message);

        await fetchProofs();
        return proofId as string;

      } catch (e) {
        setError(e instanceof Error ? e.message : "upload_failed");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, reviewId, proofs, fetchProofs]
  );

  // ── Attach location proof ──────────────────────────────────────────────────
  const attachLocationProof = useCallback(
    async (_args?: AttachLocationProofArgs): Promise<string | null> => {
      if (!user) { setError("login_required"); return null; }

      const alreadyActive = proofs.some(
        (p) => p.proof_type === "location_gps" &&
               ["pending", "processing", "verified"].includes(p.proof_status)
      );
      if (alreadyActive) { setError("proof_already_active"); return null; }

      setUploading(true);
      setError(null);

      try {
        // 1. Read browser GPS
        const position = await getBrowserLocation();
        const { latitude, longitude, accuracy } = position.coords;

        // 2. Attach proof via DB function
        const { data: proofId, error: fnErr } = await supabase
          .rpc("fn_attach_proof", {
            p_review_id:            reviewId,
            p_user_id:              user.id,
            p_proof_type:           "location_gps",
            p_location_lat:         latitude,
            p_location_lng:         longitude,
            p_location_accuracy_m:  Math.round(accuracy),
            p_location_captured_at: new Date(position.timestamp).toISOString(),
          });
        if (fnErr) throw new Error(fnErr.message);

        await fetchProofs();
        return proofId as string;

      } catch (e) {
        const msg =
          e instanceof GeolocationPositionError
            ? (e.code === 1 ? "location_permission_denied"
               : e.code === 2 ? "location_unavailable"
               : "location_timeout")
            : (e instanceof Error ? e.message : "location_failed");
        setError(msg);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, reviewId, proofs, fetchProofs]
  );

  // ── Attach booking reference proof ─────────────────────────────────────────
  const attachBookingRefProof = useCallback(
    async ({ bookingReference }: AttachBookingRefArgs): Promise<string | null> => {
      if (!user) { setError("login_required"); return null; }
      if (!bookingReference.trim()) { setError("booking_reference_required"); return null; }

      setUploading(true);
      setError(null);

      try {
        const { data: proofId, error: fnErr } = await supabase
          .rpc("fn_attach_proof", {
            p_review_id:        reviewId,
            p_user_id:          user.id,
            p_proof_type:       "booking_ref",
            p_booking_reference: bookingReference.trim(),
          });
        if (fnErr) throw new Error(fnErr.message);

        await fetchProofs();
        return proofId as string;

      } catch (e) {
        setError(e instanceof Error ? e.message : "booking_attach_failed");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, reviewId, fetchProofs]
  );

  // ── Get signed URL for a private file ─────────────────────────────────────
  const getSignedUrl = useCallback(
    async (storagePath: string): Promise<string | null> => {
      const { data, error: err } = await supabase.storage
        .from("review-proofs")
        .createSignedUrl(storagePath, 300);  // 5-minute TTL
      if (err) return null;
      return data?.signedUrl ?? null;
    },
    []
  );

  return {
    proofs,
    loading,
    uploading,
    error,
    attachFileProof,
    attachLocationProof,
    attachBookingRefProof,
    getSignedUrl,
    refetch: fetchProofs,
  };
}

// ─── Utility: human-readable error messages (Hebrew) ─────────────────────────

export const PROOF_ERROR_MESSAGES: Record<string, string> = {
  login_required:           "יש להתחבר כדי להוסיף הוכחת ניסיון",
  invalid_file_type:        "סוג קובץ לא נתמך. ניתן להעלות PDF, JPG, PNG, WEBP",
  file_too_large:           "הקובץ גדול מדי. הגודל המקסימלי הוא 10MB",
  proof_already_active:     "כבר קיימת הוכחה מסוג זה עבור ביקורת זו",
  location_permission_denied: "הגישה למיקום נדחתה. אנא אפשר גישה בהגדרות הדפדפן",
  location_unavailable:     "לא ניתן לקרוא את המיקום. נסה שוב",
  location_timeout:         "הבקשה למיקום פגה. נסה שוב",
  booking_reference_required: "יש להזין מספר הזמנה",
  proof_already_active_booking: "קוד הזמנה כבר מחובר לביקורת זו",
  upload_failed:            "העלאת הקובץ נכשלה. נסה שוב",
  not_review_owner:         "לא ניתן להוסיף הוכחה לביקורת שאינה שלך",
};

export function getProofErrorMessage(code: string | null): string {
  if (!code) return "שגיאה לא ידועה";
  return PROOF_ERROR_MESSAGES[code] ?? code;
}
