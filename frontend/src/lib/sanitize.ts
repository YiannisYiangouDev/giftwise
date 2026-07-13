/** Strip HTML tags from user input to prevent XSS. */
export function sanitize(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript\s*:/gi, '')    // strip javascript: URIs
    .replace(/on\w+\s*=/gi, '')         // strip inline event handlers
    .trim()
    .slice(0, 500)                       // max length
}

/** Sanitize optional string — returns null if empty after sanitization. */
export function sanitizeOptional(value: string | null | undefined): string | null {
  if (!value) return null
  const s = sanitize(value)
  return s || null
}
