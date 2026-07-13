import sanitizeHtml from 'sanitize-html'

const defaults: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
}

export function sanitize(value: string): string {
  return sanitizeHtml(value, defaults).trim().slice(0, 500)
}

export function sanitizeOptional(value: string | null | undefined): string | null {
  if (!value) return null
  const s = sanitize(value)
  return s || null
}
