import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * CORS configuration options for the `setCorsHeaders` behavior.
 */
export interface CorsOptions {
  /**
   * List of allowed origin patterns. Supports exact strings and wildcard `*` patterns
   * (e.g. `'https://*.example.com'`). Use `['*']` to allow all origins.
   */
  allowedOrigins: string[]
  /**
   * When `true`, reflects the incoming `Origin` request header as the
   * `Access-Control-Allow-Origin` response value, provided it matches one of
   * `allowedOrigins`. Required when `allowCredentials` is `true` (browsers reject
   * `Access-Control-Allow-Origin: *` with credentials).
   * Default: `false`
   */
  allowOriginEcho?: boolean
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
   * Must be used together with `allowOriginEcho: true`; browsers reject
   * wildcard origins when credentials are present.
   * Default: `false`
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
 * Sets CORS response headers with configurable origin matching, methods, headers,
 * credentials, and preflight cache duration.
 *
 * Akamai equivalent: typically implemented via `modifyOutgoingResponseHeader` rules
 * for each CORS header individually.
 *
 * @param options - CORS configuration. `allowedOrigins` is required.
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { setCorsHeaders } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * // Allow all origins explicitly
 * export default defineViewerResponse([setCorsHeaders({ allowedOrigins: ['*'] })])
 *
 * // Echo origin with credentials (e.g. for authenticated API endpoints)
 * export default defineViewerResponse([
 *   setCorsHeaders({
 *     allowedOrigins: ['https://www.example.com', 'https://*.example.com'],
 *     allowOriginEcho: true,
 *     allowCredentials: true,
 *     allowedMethods: 'GET, POST, PUT, DELETE, OPTIONS',
 *     maxAge: 86400,
 *   }),
 * ])
 * ```
 */
export function setCorsHeaders(options: CorsOptions): ResponseBehaviorFn {
  const { allowedOrigins } = options
  if (allowedOrigins.length === 0) throw new Error('setCorsHeaders: allowedOrigins must not be empty')

  return (request: HttpRequest, response: HttpResponse): HttpResponse => {
    let allowOrigin = allowedOrigins[0]

    if (options.allowOriginEcho) {
      const originHeader = request.headers['origin']?.value
      if (originHeader && allowedOrigins.some((p) => matchesOriginPattern(originHeader, p))) {
        allowOrigin = originHeader
      }
    }

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
