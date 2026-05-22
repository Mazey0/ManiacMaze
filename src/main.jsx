import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ─── DEBUG: catch the exact header causing ISO-8859-1 error ──────────────────
// This runs before ANY network request. Remove after root cause is found.
;(function patchHeaders() {
  const _set = Headers.prototype.set
  Headers.prototype.set = function (name, value) {
    const n = String(name)
    const v = String(value)
    if (/[^\x00-\xFF]/.test(n) || /[^\x00-\xFF]/.test(v)) {
      const err = new Error(`[DEBUG] BAD HEADER: "${n}" = "${v}"`)
      console.error('[DEBUG] Non-ISO-8859-1 header detected!', {
        headerName:  n,
        headerValue: v,
        stack:       err.stack,
      })
      // Re-throw with clear message instead of browser's cryptic error
      throw new Error(`[DEBUG] Non-ISO-8859-1 in header "${n}" — value starts with: ${v.slice(0, 80)}`)
    }
    return _set.call(this, name, value)
  }

  // Also patch the Headers constructor so new Headers({...}) is caught
  const OrigHeaders = window.Headers
  window.Headers = class PatchedHeaders extends OrigHeaders {
    constructor(init) {
      super()
      if (init) {
        const entries = init instanceof Headers
          ? [...init.entries()]
          : Object.entries(init)
        for (const [k, v] of entries) this.set(k, v)
      }
    }
  }
  Object.defineProperty(window.Headers.prototype, Symbol.toStringTag, { value: 'Headers' })
  console.log('[DEBUG] Headers.prototype.set patched — watching for non-ASCII headers')
})()
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
