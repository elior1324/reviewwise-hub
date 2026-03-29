/**
 * _shared/file-validation.ts
 *
 * Server-side file validation utilities for Edge Functions.
 *
 * Validates uploaded files using magic bytes (file signatures) — NOT file
 * extensions or client-supplied content-type headers, which can be spoofed.
 *
 * Usage:
 *   import { validateFile, ALLOWED_MIMES } from "../_shared/file-validation.ts";
 *
 *   const { data } = await supabase.storage.from("invoices").download(filePath);
 *   const bytes = new Uint8Array(await data.arrayBuffer());
 *   const result = validateFile(bytes, "document");
 *   if (!result.valid) return errorResponse(result.reason);
 */

// ── Magic byte detection ────────────────────────────────────────────────────

/** Detect MIME type from the first bytes of a file (magic bytes / file signature). */
export function detectMime(bytes: Uint8Array): string {
  if (bytes.length < 4) return "application/octet-stream";

  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  // GIF: GIF8
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }
  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  // HEIC/HEIF: ....ftyp (offset 4)
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === "heic" || brand === "heix" || brand === "mif1") return "image/heic";
    // MP4/MOV also use ftyp
    if (brand === "isom" || brand === "mp41" || brand === "mp42" || brand === "avc1") return "video/mp4";
    if (brand === "qt  " || brand === "M4V ") return "video/quicktime";
  }
  // BMP: BM
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";

  // DENY BY DEFAULT: if no known magic bytes matched, return octet-stream.
  // The caller's allowlist will reject this, blocking unknown file types.
  // We intentionally do NOT fall back to text heuristics or extensions.
  return "application/octet-stream";
}

// ── Allowed MIME sets ───────────────────────────────────────────────────────

/** Allowed MIME types per upload context. */
export const ALLOWED_MIMES = {
  /** Invoices, receipts, templates */
  document: new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
  ]),
  /** Profile images (avatars, covers) */
  image: new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]),
  /** Testimonial media */
  media: new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
  ]),
} as const;

// ── Max file sizes ──────────────────────────────────────────────────────────

/** Max file sizes in bytes per context. */
export const MAX_FILE_BYTES = {
  document: 15 * 1024 * 1024,   // 15 MB
  image:    10 * 1024 * 1024,   // 10 MB
  media:    50 * 1024 * 1024,   // 50 MB
} as const;

// ── Validation result ───────────────────────────────────────────────────────

export interface FileValidationResult {
  valid:       boolean;
  detectedMime: string;
  reason?:     string;
}

/**
 * Validate a file's actual content against the allowed MIME set for a context.
 *
 * @param bytes   Raw file bytes (at least the first 12 bytes are needed for detection)
 * @param context Which allowlist to use: "document", "image", or "media"
 * @param totalSize Optional total file size in bytes for size limit check
 */
export function validateFile(
  bytes: Uint8Array,
  context: keyof typeof ALLOWED_MIMES,
  totalSize?: number,
): FileValidationResult {
  const detectedMime = detectMime(bytes);

  if (!ALLOWED_MIMES[context].has(detectedMime)) {
    return {
      valid: false,
      detectedMime,
      reason: `File type "${detectedMime}" is not allowed. Expected: ${[...ALLOWED_MIMES[context]].join(", ")}`,
    };
  }

  if (totalSize !== undefined && totalSize > MAX_FILE_BYTES[context]) {
    const maxMB = Math.round(MAX_FILE_BYTES[context] / (1024 * 1024));
    return {
      valid: false,
      detectedMime,
      reason: `File size ${Math.round(totalSize / (1024 * 1024))}MB exceeds the ${maxMB}MB limit`,
    };
  }

  return { valid: true, detectedMime };
}
