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
 * Controls how `Access-Control-Allow-Origin` is set:
 * - `ORIGIN_WILDCARD` (`'*'`) — static `*`, allows all origins without inspection
 * - `Origin[]` — compare request `Origin` header against the list; echo if matched, skip if not
 * - `ORIGIN_ECHO` (`'echo'`) — echo any request `Origin` if present, skip if none
 */
export type OriginPolicy = OriginWildcard | Origin[] | OriginEcho

/**
 * CORS configuration options for `setCorsHeaders` and `preflightRequest`.
 */
export interface CorsOptions {
  /**
   * Origin policy. See `OriginPolicy` for details.
   */
  allowedOrigins: OriginPolicy
  /**
   * Value for the `Access-Control-Allow-Methods` header.
   * Omit to exclude the header.
   */
  allowedMethods?: string
  /**
   * Value for the `Access-Control-Allow-Headers` header.
   * Omit to exclude the header.
   */
  allowedHeaders?: string
  /**
   * When `true`, sets `Access-Control-Allow-Credentials: true`.
   * Use with `ORIGIN_ECHO` or `Origin[]` — browsers reject `*` with credentials.
   */
  allowCredentials?: boolean
  /**
   * Preflight cache duration in seconds. Sets `Access-Control-Max-Age` when specified.
   * Omit to exclude the header.
   */
  maxAge?: number
}

function matchesOriginPattern(origin: string, pattern: string): boolean {
  if (pattern === '*') return true
  if (!pattern.includes('*')) return origin === pattern
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`).test(origin)
}

/**
 * Sets CORS response headers with configurable origin policy.
 *
 * @param options - CORS configuration. `allowedOrigins` is required.
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { setCorsHeaders, ORIGIN_WILDCARD, ORIGIN_ECHO } from '@rayselfs/cf-rule-engine/behaviors/set-cors-headers'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/viewer-response'
 *
 * // Public API — static Access-Control-Allow-Origin: *
 * export default defineViewerResponse([
 *   setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD }),
 * ])
 *
 * // Restricted — echo only listed origins (supports wildcard subdomains)
 * export default defineViewerResponse([
 *   setCorsHeaders({ allowedOrigins: ['https://*.viverse.com', 'https://sdk-api.viverse.com'] }),
 * ])
 *
 * // Echo any origin (e.g. for credentialed requests)
 * export default defineViewerResponse([
 *   setCorsHeaders({ allowedOrigins: ORIGIN_ECHO, allowCredentials: true }),
 * ])
 * ```
 */
export function setCorsHeaders(options: CorsOptions): ResponseBehaviorFn {
  const { allowedOrigins } = options

  return (request: HttpRequest, response: HttpResponse): HttpResponse => {
    let allowOrigin: string | undefined

    if (allowedOrigins === ORIGIN_WILDCARD) {
      allowOrigin = '*'
    } else if (allowedOrigins === ORIGIN_ECHO) {
      allowOrigin = request.headers['origin']?.value
    } else {
      const originHeader = request.headers['origin']?.value
      if (originHeader && allowedOrigins.some((p) => matchesOriginPattern(originHeader, p))) {
        allowOrigin = originHeader
      }
    }

    if (allowOrigin === undefined) return response

    const corsHeaders: Record<string, { value: string }> = {
      'access-control-allow-origin': { value: allowOrigin },
    }

    if (options.allowedMethods !== undefined) {
      corsHeaders['access-control-allow-methods'] = { value: options.allowedMethods }
    }

    if (options.allowedHeaders !== undefined) {
      corsHeaders['access-control-allow-headers'] = { value: options.allowedHeaders }
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
