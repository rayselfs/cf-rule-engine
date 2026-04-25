import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * Configuration for the `Content-Security-Policy` header.
 */
export interface CspOptions {
  /**
   * Map of CSP directive names to their values.
   * Each entry becomes one `<directive> <value>` segment in the header,
   * joined with `'; '`.
   *
   * @example
   * ```ts
   * { 'default-src': "'self'", 'img-src': "'self' data: https:", 'script-src': "'self' 'nonce-abc123'" }
   * // → "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'nonce-abc123'"
   * ```
   */
  directives: Record<string, string>
}

/**
 * Sets the `Content-Security-Policy` response header from a directives map.
 *
 * Directive entries are joined with `'; '` to form the final header value.
 * Overwrites any existing CSP header from the origin.
 *
 * @param options - CSP configuration object containing the `directives` map.
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { setCsp } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerResponse([
 *   setCsp({
 *     directives: {
 *       'default-src': "'self'",
 *       'script-src': "'self' https://cdn.example.com",
 *       'img-src': "'self' data: https:",
 *       'frame-ancestors': "'none'",
 *     },
 *   }),
 * ])
 * ```
 */
export function setCsp(options: CspOptions): ResponseBehaviorFn {
  const dirEntries = Object.entries(options.directives)
  const dirParts: string[] = []
  for (let i = 0; i < dirEntries.length; i++) {
    dirParts.push(dirEntries[i][0] + ' ' + dirEntries[i][1])
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
