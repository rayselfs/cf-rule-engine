import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * Boolean (value-less) CSP directives defined by the W3C CSP spec.
 * These directives have no associated value — they act as flags.
 */
export type CspBooleanDirective = 'upgrade-insecure-requests' | 'block-all-mixed-content'

/**
 * Value-bearing CSP directives defined by the W3C CSP spec.
 * Each directive requires a string value (e.g. source list, URL, keyword).
 */
export type CspValueDirective =
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'img-src'
  | 'font-src'
  | 'connect-src'
  | 'media-src'
  | 'object-src'
  | 'frame-src'
  | 'child-src'
  | 'worker-src'
  | 'manifest-src'
  | 'form-action'
  | 'frame-ancestors'
  | 'navigate-to'
  | 'base-uri'
  | 'sandbox'
  | 'report-uri'
  | 'report-to'
  | 'require-trusted-types-for'
  | 'trusted-types'

/**
 * Typed map of CSP directives.
 *
 * - Boolean directives (`upgrade-insecure-requests`, `block-all-mixed-content`) use `true` as their value.
 * - Value directives use a string source list or keyword.
 */
export type CspDirectives = { [K in CspBooleanDirective]?: true } & {
  [K in CspValueDirective]?: string
}

/**
 * Configuration for the `Content-Security-Policy` header.
 */
export type CspOptions = {
  /**
   * Typed map of CSP directives. Boolean directives use `true`; all others use a string value.
   * Entries are joined with `'; '` to form the final header value.
   *
   * @example
   * ```ts
   * {
   *   'default-src': "'self'",
   *   'img-src': "'self' data: https:",
   *   'upgrade-insecure-requests': true,
   *   'frame-ancestors': 'https://*.viverse.com',
   * }
   * // → "default-src 'self'; img-src 'self' data: https:; upgrade-insecure-requests; frame-ancestors https://*.viverse.com"
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
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
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
  const dirEntries = Object.entries(options.directives) as [string, string | true][]
  const dirParts: string[] = []
  for (let i = 0; i < dirEntries.length; i++) {
    const name = dirEntries[i][0]
    const value = dirEntries[i][1]
    dirParts.push(value === true ? name : name + ' ' + value)
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
