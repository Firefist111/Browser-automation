/** URL validation shared between the editor (canvas/inspector) and the node executor. */

// Matches `{{ nodeId.output }}` interpolation tokens. Tokens are valid at
// edit time because they're resolved at runtime by `interpolate`, so they must
// not be flagged as invalid URLs while the workflow is being authored.
const TOKEN_RE = /\{\{\s*[^}]+\s*\}\}/

// Matches any value that already starts with a scheme, e.g. "https://", "http://",
// "javascript:", "data:...". Used to decide whether to validate directly or to
// try the https:// prefix fallback for scheme-less hostnames.
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i

/**
 * Returns true when the value is a usable URL OR contains an interpolation
 * token that will be resolved at runtime (e.g. `{{ nodeId.url }}`).
 *
 * Mirrors the lenient rules used by the `open-url` executor: a scheme-less
 * hostname like `example.com` is accepted because the executor prepends
 * `https://`.
 *
 * NOTE: this is a *syntax* check only. A syntactically valid but unreachable
 * host (e.g. `https://this-host-does-not-exist.invalid`) is considered valid —
 * detecting unreachable hosts requires a runtime navigation/reachability probe.
 */
export function isValidUrl(value: string | undefined): boolean {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return false
  if (TOKEN_RE.test(trimmed)) return true

  // Browsers and `new URL` silently percent-encode internal whitespace, which
  // produces a technically-"valid" URL with a garbage host. Reject whitespace
  // outright (a well-formed URL never contains raw spaces).
  if (/\s/.test(trimmed)) return false

  let parsed: URL
  if (SCHEME_RE.test(trimmed)) {
    // The value already has a scheme — validate it directly so scheme-only
    // inputs like "http://" are rejected (instead of being masked by the
    // https:// prefix fallback below).
    try {
      parsed = new URL(trimmed)
    } catch {
      return false
    }
  } else {
    // Scheme-less hostnames (e.g. "example.com") are accepted because the
    // executor prepends https:// before navigating.
    try {
      parsed = new URL(`https://${trimmed}`)
    } catch {
      return false
    }
  }

  // Only http/https are meaningful for an Open URL action. This rejects
  // schemes like javascript:, data:, file:, mailto:, ftp:, etc.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false
  }

  return !!parsed.hostname
}

export const URL_ERROR_MESSAGE =
  "Enter a valid URL (e.g. https://example.com). You can also reference an upstream node, e.g. {{ nodeId.url }}."
