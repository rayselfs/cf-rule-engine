import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

export const ORIGIN_WILDCARD = '*' as const
export type OriginWildcard = typeof ORIGIN_WILDCARD

export const ORIGIN_ECHO = 'echo' as const
export type OriginEcho = typeof ORIGIN_ECHO

/**
 * A valid HTTP origin — must start with `https://` or `http://`.
 * Supports wildcard subdomains (e.g. `https://*.viverse.com`).
 */
export type Origin = `https://${string}` | `http://${string}`

/**
 * A function that returns `true` when the given request origin should be allowed.
 * Build one with `originMatcher(origins)` from `@rayselfs/cf-rule-engine/behaviors/origin-matcher`.
 */
export type OriginMatcher = (origin: string) => boolean

/**
 * Controls how `Access-Control-Allow-Origin` is set:
 * - `ORIGIN_WILDCARD` (`'*'`) — static `*`, allows all origins without inspection
 * - `ORIGIN_ECHO` (`'echo'`) — echo any request `Origin` if present, skip if none
 * - `OriginMatcher` — call the function with the request `Origin`; echo if truthy, skip if falsy.
 *   Build one with `originMatcher(origins)` from `@rayselfs/cf-rule-engine/behaviors/origin-matcher`.
 */
export type OriginPolicy = OriginWildcard | OriginEcho | OriginMatcher

export type Methods =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | 'TRACE'
  | 'CONNECT'

/**
 * CORS configuration options for `setCorsHeaders` and `preflightRequest`.
 */
export type CorsOptions = {
  /**
   * Origin policy. See `OriginPolicy` for details.
   */
  allowedOrigins: OriginPolicy
  /**
   * HTTP methods to include in `Access-Control-Allow-Methods`.
   * Array items are joined with `, ` before being written to the header.
   * Omit to exclude the header.
   *
   * @example `['GET', 'POST', 'OPTIONS']`
   */
  allowedMethods?: Methods[]
  /**
   * Header names to include in `Access-Control-Allow-Headers`.
   * Array items are joined with `, ` before being written to the header.
   * Omit to exclude the header.
   *
   * @example `['Content-Type', 'Authorization']`
   */
  allowedHeaders?: string[]
  /**
   * When `true`, sets `Access-Control-Allow-Credentials: true`.
   * Use with `ORIGIN_ECHO` or `OriginMatcher` — browsers reject `*` with credentials.
   */
  allowCredentials?: boolean
  /**
   * Preflight cache duration in seconds. Sets `Access-Control-Max-Age` when specified.
   * Omit to exclude the header.
   */
  maxAge?: number
}

/**
 * Sets CORS response headers with configurable origin policy.
 *
 * @param options - CORS configuration. `allowedOrigins` is required.
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { originMatcher } from '@rayselfs/cf-rule-engine/behaviors/origin-matcher'
 *
 * setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD })
 * setCorsHeaders({ allowedOrigins: originMatcher(['https://*.viverse.com']) })
 * setCorsHeaders({ allowedOrigins: ORIGIN_ECHO, allowCredentials: true })
 * ```
 */
export function setCorsHeaders(options: CorsOptions): ResponseBehaviorFn {
  const allowedOrigins = options.allowedOrigins

  return (request: HttpRequest, response: HttpResponse): HttpResponse => {
    let allowOrigin: string | undefined

    if (allowedOrigins === ORIGIN_WILDCARD) {
      allowOrigin = '*'
    } else if (allowedOrigins === ORIGIN_ECHO) {
      allowOrigin = request.headers['origin']?.value
    } else {
      const originHeader = request.headers['origin']?.value
      if (originHeader && allowedOrigins(originHeader)) {
        allowOrigin = originHeader
      }
    }

    if (allowOrigin === undefined) return response

    const corsHeaders: Record<string, { value: string }> = {
      'access-control-allow-origin': { value: allowOrigin },
    }

    if (options.allowedMethods !== undefined) {
      corsHeaders['access-control-allow-methods'] = { value: options.allowedMethods.join(', ') }
    }

    if (options.allowedHeaders !== undefined) {
      corsHeaders['access-control-allow-headers'] = { value: options.allowedHeaders.join(', ') }
    }

    if (options.allowCredentials) {
      corsHeaders['access-control-allow-credentials'] = { value: 'true' }
    }

    if (options.maxAge !== undefined) {
      corsHeaders['access-control-max-age'] = { value: String(options.maxAge) }
    }

    return Object.assign({}, response, {
      headers: Object.assign({}, response.headers, corsHeaders),
    })
  }
}
