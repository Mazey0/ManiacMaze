// ─── Safe file name generator ─────────────────────────────────────────────────
// Always produces an ASCII-only filename — no Arabic, no special chars.
// Format: maze-{timestamp}-{randomId}.{ext}
// Arabic title/description must ONLY go into the database, never into file paths.

const MIME_TO_EXT = {
  'application/pdf': 'pdf',
  'image/png':       'png',
  'image/jpeg':      'jpg',
  'image/jpg':       'jpg',
  'image/webp':      'webp',
  'image/svg+xml':   'svg',
  'image/gif':       'gif',
}

export function generateSafeFileName(mimeType) {
  const timestamp = Date.now()
  const randomId  = Math.random().toString(36).slice(2, 8)
  const ext       = MIME_TO_EXT[mimeType] || 'bin'
  return `maze-${timestamp}-${randomId}.${ext}`
}
