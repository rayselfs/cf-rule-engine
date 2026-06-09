import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * All valid CSP directives with their expected value types.
 *
 * - `string`  — directive requires a value, e.g. `'default-src': "'self'"`
 * - `boolean` — value-less flag directive; `true` emits the bare directive name,
 *               `false` (or omitted) skips it entirely
 * - `string | boolean` — directive is valid with or without a value (sandbox only)
 *
 * All fields are optional. Omitted fields are not emitted in the header.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
 */
export type CspDirectives = Partial<{
  // ── Fetch Directives ──────────────────────────────────────────────────────
  /** Fallback for all fetch directives not explicitly set. */
  'default-src': string
  /** Valid sources for Web Workers and nested browsing contexts. */
  'child-src': string
  /** Valid sources for XMLHttpRequest, WebSocket, EventSource, fetch(). */
  'connect-src': string
  /** Valid sources for fonts loaded with @font-face. */
  'font-src': string
  /** Valid sources for nested browsing contexts such as <frame> and <iframe>. */
  'frame-src': string
  /** Valid sources for images and favicons. */
  'img-src': string
  /** Valid sources for manifest files. */
  'manifest-src': string
  /** Valid sources for <audio>, <video>, and <track>. */
  'media-src': string
  /** Valid sources for <object> and <embed>. */
  'object-src': string
  /** Valid sources for JavaScript <script> elements. */
  'script-src': string
  /** Valid sources for inline <script> event handlers. */
  'script-src-attr': string
  /** Valid sources for JavaScript <script> elements (external files). */
  'script-src-elem': string
  /** Valid sources for stylesheets. */
  'style-src': string
  /** Valid sources for inline style attributes. */
  'style-src-attr': string
  /** Valid sources for <link> stylesheet elements. */
  'style-src-elem': string
  /** Valid sources for Worker, SharedWorker, and ServiceWorker scripts. */
  'worker-src': string

  // ── Document Directives ───────────────────────────────────────────────────
  /** Restricts URLs that can be used as the target of a <base> element. */
  'base-uri': string
  /**
   * Applies sandbox restrictions to the page. Presence alone (`true`) enables
   * the most restrictive sandbox. Pass a string of `allow-*` tokens to relax
   * specific restrictions, e.g. `'allow-scripts allow-same-origin'`.
   */
  sandbox: string | boolean

  // ── Navigation Directives ─────────────────────────────────────────────────
  /** Restricts URLs that can be used as a form action target. */
  'form-action': string
  /** Restricts which parents may embed this page in a frame. */
  'frame-ancestors': string
  /** Restricts URLs the document may navigate to. */
  'navigate-to': string

  // ── Trusted Types Directives ──────────────────────────────────────────────
  /**
   * Restricts creation of Trusted Types policies.
   * Use `'none'` to disallow all policies, or list allowed policy names.
   */
  'trusted-types': string
  /**
   * Enforces Trusted Types for a sink group.
   * Common value: `'script'`.
   */
  'require-trusted-types-for': string

  // ── Reporting Directives ──────────────────────────────────────────────────
  /** Reporting group name (defined via `Report-To` header). Preferred over `report-uri`. */
  'report-to': string
  /**
   * @deprecated Use `report-to` instead. `report-uri` is deprecated but remains
   * widely supported. Include both during transition:
   * `{ 'report-uri': '/csp-report', 'report-to': 'csp-endpoint' }`.
   */
  'report-uri': string

  // ── Flag Directives (value-less) ──────────────────────────────────────────
  /**
   * Upgrades all insecure HTTP requests to HTTPS before fetching.
   * Set to `true` to emit; `false` or omit to skip.
   */
  'upgrade-insecure-requests': boolean
  /**
   * @deprecated Superseded by `upgrade-insecure-requests`. Blocks all mixed
   * content (HTTP resources on HTTPS pages). Set to `true` to emit.
   */
  'block-all-mixed-content': boolean
}>

/**
 * Configuration for the `Content-Security-Policy` header.
 */
export type CspOptions = {
  /**
   * Map of CSP directives to their values. Each entry becomes one segment in
   * the `Content-Security-Policy` header, joined with `'; '`.
   *
   * - String value  → `directive value`  (e.g. `'img-src': "'self' data:"`)
   * - `true`        → `directive`         (bare flag, e.g. `'upgrade-insecure-requests': true`)
   * - `false`       → skipped             (useful for conditional disabling)
   *
   * @example
   * ```ts
   * {
   *   'default-src': "'self'",
   *   'img-src': "'self' data: https:",
   *   'upgrade-insecure-requests': true,
   *   'frame-ancestors': 'https://*.viverse.com',
   *   'sandbox': 'allow-scripts allow-same-origin',
   * }
   * // → "default-src 'self'; img-src 'self' data: https:; upgrade-insecure-requests; frame-ancestors https://*.viverse.com; sandbox allow-scripts allow-same-origin"
   * ```
   */
  directives: CspDirectives
}

/**
 * Sets the `Content-Security-Policy` response header from a typed directives map.
 *
 * - Value directives are emitted as `<directive> <value>`.
 * - Boolean directives (`upgrade-insecure-requests`, `block-all-mixed-content`) are emitted
 *   as `<directive>` with no trailing value or space.
 * - Entries are joined with `'; '` to form the final header value.
 * - Overwrites any existing CSP header from the origin.
 *
 * @param options - CSP configuration object containing the `directives` map.
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { setCsp } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/viewer-response'
 *
 * export default defineViewerResponse([
 *   setCsp({
 *     directives: {
 *       'default-src': "'self'",
 *       'script-src': "'self' https://cdn.example.com",
 *       'img-src': "'self' data: https:",
 *       'frame-ancestors': "'none'",
 *       'upgrade-insecure-requests': true,
 *     },
 *   }),
 * ])
 * // → "default-src 'self'; script-src 'self' https://cdn.example.com; img-src 'self' data: https:; frame-ancestors 'none'; upgrade-insecure-requests"
 * ```
 */
export function setCsp(options: CspOptions): ResponseBehaviorFn {
  const dirEntries = Object.entries(options.directives) as Array<[string, string | boolean | undefined]>
  const dirParts: string[] = []
  for (let i = 0; i < dirEntries.length; i++) {
    const key = dirEntries[i][0]
    const val = dirEntries[i][1]
    if (val === true) {
      dirParts.push(key)
    } else if (typeof val === 'string') {
      dirParts.push(key + ' ' + val)
    }
    // val === false or undefined → skip
  }
  const cspValue = dirParts.join('; ')

  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return Object.assign({}, response, {
      headers: Object.assign({}, response.headers, {
        'content-security-policy': { value: cspValue },
      }),
    })
  }
}
