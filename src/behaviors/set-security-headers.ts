import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * Options for overriding individual security header values.
 * All fields are optional; omitted fields fall back to their secure defaults.
 */
export interface SecurityHeadersOptions {
  /**
   * Value for the `Strict-Transport-Security` header.
   * Default: `'max-age=31536000; includeSubDomains'`
   */
  hsts?: string
  /**
   * Value for the `X-Frame-Options` header. Controls whether the page can be
   * embedded in an iframe. Common values: `'DENY'`, `'SAMEORIGIN'`.
   * Default: `'SAMEORIGIN'`
   */
  xFrameOptions?: string
  /**
   * Value for the `X-Content-Type-Options` header. Set to `'nosniff'` to
   * prevent browsers from MIME-sniffing the response content type.
   * Default: `'nosniff'`
   */
  xContentTypeOptions?: string
}

/**
 * Sets common security headers on the outgoing response.
 *
 * Applied headers and their defaults:
 * - `Strict-Transport-Security`: `max-age=31536000; includeSubDomains`
 * - `X-Frame-Options`: `SAMEORIGIN`
 * - `X-Content-Type-Options`: `nosniff`
 *
 * Akamai equivalent: `httpStrictTransportSecurity` behavior (HSTS only).
 *
 * @param options - Optional overrides for individual header values.
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { setSecurityHeaders } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * // Apply defaults
 * export default defineViewerResponse([setSecurityHeaders()])
 *
 * // Override HSTS and frame options
 * export default defineViewerResponse([
 *   setSecurityHeaders({ hsts: 'max-age=63072000; includeSubDomains; preload', xFrameOptions: 'DENY' }),
 * ])
 * ```
 */
export function setSecurityHeaders(options?: SecurityHeadersOptions): ResponseBehaviorFn {
  const hsts = options?.hsts ?? 'max-age=31536000; includeSubDomains'
  const xFrameOptions = options?.xFrameOptions ?? 'SAMEORIGIN'
  const xContentTypeOptions = options?.xContentTypeOptions ?? 'nosniff'

  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return Object.assign({}, response, {
      headers: Object.assign({}, response.headers, {
        'strict-transport-security': { value: hsts },
        'x-frame-options': { value: xFrameOptions },
        'x-content-type-options': { value: xContentTypeOptions },
      }),
    })
  }
}
