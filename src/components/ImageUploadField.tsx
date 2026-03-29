/**
 * ImageUploadField.tsx
 *
 * Reusable image upload control used in both user and business settings pages.
 * Handles file selection, local preview, Supabase Storage upload, and error feedback.
 *
 * Props:
 *   value      — current image URL (displayed as preview)
 *   onChange   — called with the new public URL after a successful upload
 *   bucket     — Supabase Storage bucket name ("avatars" | "covers")
 *   storagePath — storage path including filename, e.g. "userId/avatar.jpg"
 *   shape      — "circle" (avatar) | "rect" (cover banner)
 *   label      — accessible label / tooltip shown on hover
 *   placeholder — text shown when no image is set
 *   className  — extra wrapper classes
 *   disabled   — prevent interaction while parent is saving
 */

import { useRef, useState } from "react";
import { Camera, ImageIcon, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  value?: string | null;
  onChange: (url: string) => void;
  bucket: "avatars" | "covers";
  storagePath: string;
  shape?: "circle" | "rect";
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES: Record<"avatars" | "covers", number> = {
  avatars: 5 * 1024 * 1024,   // 5 MB
  covers:  10 * 1024 * 1024,  // 10 MB
};

const ImageUploadField = ({
  value,
  onChange,
  bucket,
  storagePath,
  shape = "rect",
  label,
  placeholder,
  className,
  disabled = false,
}: ImageUploadFieldProps) => {
  const [uploading, setUploading]     = useState(false);
  const [preview,   setPreview]       = useState<string | null>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);

  const currentSrc = preview ?? value ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_BYTES[bucket]) {
      toast.error(
        bucket === "avatars"
          ? "התמונה גדולה מדי — מקסימום 5 MB"
          : "התמונה גדולה מדי — מקסימום 10 MB"
      );
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      // Build the final storage path (include file extension from MIME)
      const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
      const ALLOWED_IMG_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
      const ext = ALLOWED_IMG_EXT.has(rawExt) ? rawExt : "jpg";
      const path = storagePath.endsWith(`.${ext}`) ? storagePath : `${storagePath}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      // Bust CDN cache by appending timestamp
      const cacheBusted = `${publicUrl}?t=${Date.now()}`;

      onChange(cacheBusted);
      toast.success("התמונה עודכנה בהצלחה");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה בהעלאת התמונה";
      toast.error(msg);
      setPreview(null); // revert preview on error
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Circle (avatar) ──────────────────────────────────────────────────────
  if (shape === "circle") {
    return (
      <div className={cn("relative inline-block", className)}>
        <button
          type="button"
          aria-label={label ?? "העלו תמונת פרופיל"}
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "relative w-24 h-24 rounded-full overflow-hidden border-2 border-border/50",
            "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-all",
            disabled || uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/60"
          )}
        >
          {currentSrc ? (
            <img
              src={currentSrc}
              alt="תמונת פרופיל"
              className="w-full h-full object-cover"
              key={currentSrc}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Camera size={28} className="text-muted-foreground/40" />
            </div>
          )}

          {/* Hover overlay */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1",
              "bg-black/50 transition-opacity duration-200",
              uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            {uploading
              ? <Loader2 size={20} className="text-white animate-spin" />
              : <Camera size={18} className="text-white" />
            }
            {!uploading && (
              <span className="text-[10px] text-white font-medium">שנו תמונה</span>
            )}
          </div>
        </button>

        {/* Clear button — only shown when image is set */}
        {currentSrc && !uploading && !disabled && (
          <button
            type="button"
            aria-label="הסר תמונה"
            onClick={handleClear}
            className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors z-10"
          >
            <X size={11} />
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>
    );
  }

  // ── Rectangle (cover banner) ─────────────────────────────────────────────
  return (
    <div className={cn("relative group", className)}>
      <button
        type="button"
        aria-label={label ?? "העלו תמונת כריכה"}
        disabled={disabled || uploading}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "relative w-full h-36 rounded-xl overflow-hidden border-2 border-dashed border-border/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "transition-all",
          disabled || uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        {currentSrc ? (
          <img
            src={currentSrc}
            alt="תמונת כריכה"
            className="w-full h-full object-cover"
            key={currentSrc}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/30">
            <ImageIcon size={28} className="text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">
              {placeholder ?? "לחצו להעלאת תמונת כריכה"}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              JPG, PNG, WebP · מקסימום 10MB
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center gap-2",
            "bg-black/40 transition-opacity duration-200",
            uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {uploading ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : (
            <>
              <Camera size={18} className="text-white" />
              <span className="text-sm text-white font-medium">
                {currentSrc ? "שנו תמונה" : "העלו תמונה"}
              </span>
            </>
          )}
        </div>
      </button>

      {/* Clear button */}
      {currentSrc && !uploading && !disabled && (
        <button
          type="button"
          aria-label="הסר תמונת כריכה"
          onClick={handleClear}
          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10 backdrop-blur-sm"
        >
          <X size={13} />
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
};

export default ImageUploadField;
