/**
 * file-validation.ts — Shared file upload security helpers.
 *
 * Validates file extension against an allowlist BEFORE uploading.
 * Prevents arbitrary file type uploads that bypass client-side accept attributes.
 */

/** Allowed extensions per upload context. All lowercase, without leading dot. */
export const ALLOWED_EXTENSIONS = {
  /** Invoices, receipts, purchase proofs */
  document: new Set(["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif", "csv"]),
  /** Profile images (avatars, covers) */
  image: new Set(["jpg", "jpeg", "png", "webp", "gif"]),
  /** Testimonial media (images + video) */
  media: new Set(["jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "webm"]),
} as const;

/**
 * Extracts and validates the file extension.
 * Returns the lowercase extension if valid, or null if blocked.
 */
export function validateFileExtension(
  fileName: string,
  context: keyof typeof ALLOWED_EXTENSIONS,
): string | null {
  // Extract the part after the LAST dot only (prevents double-extension attacks)
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return ALLOWED_EXTENSIONS[context].has(ext) ? ext : null;
}
