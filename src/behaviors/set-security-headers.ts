import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * Options for individual security header values.
 *
 * Only headers with a provided value are emitted — omitted fields are **not** added to the
 * response. There are no built-in defaults; every emitted header value is explicit.
 *
 * Pass at least one field.
 */
export interface SecurityHeadersOptions {
  /**
   * Value for the `Strict-Transport-Security` header.
   * Example: `'max-age=31536000; includeSubDomains'`
   */
  hsts?: string
  /**
   * Value for the `X-Frame-Options` header. Controls whether the page can be
   * embedded in an iframe. Common values: `'DENY'`, `'SAMEORIGIN'`.
   */
  xFrameOptions?: string
  /**
   * Value for the `X-Content-Type-Options` header. Set to `'nosniff'` to
   * prevent browsers from MIME-sniffing the response content type.
   */
  xContentTypeOptions?: string
  /**
   * Value for the `X-XSS-Protection` header.
   * Example: `'1; mode=block'`
   *
   * Note: deprecated in modern browsers but still used for legacy compatibility.
   */
  xXssProtection?: string
}

/**
 * Sets security headers on the outgoing response.
 *
 * Only headers explicitly provided in `options` are emitted — there are **no built-in
 * defaults**. This avoids silently overriding headers set elsewhere in the pipeline and
 * lets Akamai-migrated properties carry their original values verbatim.
 *
 * Supported headers:
 * - `Strict-Transport-Security` (`hsts`)
 * - `X-Frame-Options` (`xFrameOptions`)
 * - `X-Content-Type-Options` (`xContentTypeOptions`)
 * - `X-XSS-Protection` (`xXssProtection`)
 *
 * Akamai equivalents: `httpStrictTransportSecurity` (HSTS), `modifyOutgoingResponseHeader`
 * (frame options, content-type options, XSS protection).
 *
 * @param options - Security header values to set. Pass at least one field.
 * @returns A `ResponseBehaviorFn` to use in `defineViewerResponse` or a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { setSecurityHeaders } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerResponse([
 *   setSecurityHeaders({
 *     hsts: 'max-age=31536000; includeSubDomains',
 *     xFrameOptions: 'SAMEORIGIN',
 *     xContentTypeOptions: 'nosniff',
 *     xXssProtection: '1; mode=block',
 *   }),
 * ])
 * ```
 */
export function setSecurityHeaders(options: SecurityHeadersOptions): ResponseBehaviorFn {
  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    const extra: Record<string, { value: string }> = {}

    if (options.hsts !== undefined)
      extra['strict-transport-security'] = { value: options.hsts }
    if (options.xFrameOptions !== undefined)
      extra['x-frame-options'] = { value: options.xFrameOptions }
    if (options.xContentTypeOptions !== undefined)
      extra['x-content-type-options'] = { value: options.xContentTypeOptions }
    if (options.xXssProtection !== undefined)
      extra['x-xss-protection'] = { value: options.xXssProtection }

    return Object.assign({}, response, {
      headers: Object.assign({}, response.headers, extra),
    })
  }
}
