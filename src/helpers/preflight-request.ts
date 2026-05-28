import type { Rule } from '../core/types.js'
import { type CorsOptions, ORIGIN_WILDCARD, ORIGIN_ECHO } from '../behaviors/set-cors-headers.js'
import { methodIs } from '../criteria/method-is.js'

function matchesOriginPattern(origin: string, pattern: string): boolean {
  if (pattern === '*') return true
  if (!pattern.includes('*')) return origin === pattern
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`).test(origin)
}

/**
 * Returns a `Rule` that responds 204 to OPTIONS preflight requests with CORS headers.
 *
 * Accepts the same `CorsOptions` as `setCorsHeaders` — pass the same object to both
 * to define CORS config in one place. `allowedMethods` and `allowedHeaders` default to
 * permissive values if omitted.
 *
 * @example
 * ```ts
 * import { preflightRequest } from '@rayselfs/cf-rule-engine/helpers'
 * import { setCorsHeaders, ORIGIN_WILDCARD } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerRequest, defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 * import type { CorsOptions } from '@rayselfs/cf-rule-engine/behaviors'
 *
 * const CORS: CorsOptions = {
 *   allowedOrigins: ORIGIN_WILDCARD,
 *   allowedMethods: 'GET, POST, OPTIONS',
 *   allowedHeaders: 'Content-Type, Cache-Control, Pragma, Range',
 * }
 *
 * // viewer-request.ts
 * export default defineViewerRequest([
 *   preflightRequest(CORS),
 * ])
 *
 * // viewer-response.ts
 * export default defineViewerResponse([
 *   setCorsHeaders(CORS),
 * ])
 * ```
 *
 * @returns A `Rule` ready to pass into `defineViewerRequest`.
 */
export function preflightRequest(options: CorsOptions): Rule {
  const { allowedOrigins } = options
  const allowedMethods = options.allowedMethods ?? 'GET, POST, OPTIONS'
  const allowedHeaders = options.allowedHeaders ?? 'Content-Type, Cache-Control, Pragma, Range'
  const allowCredentials = options.allowCredentials ?? false
  const maxAge = options.maxAge

  return {
    criteria: methodIs(['OPTIONS']),
    behavior: (request) => {
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

      const headers: Record<string, { value: string }> = {
        'cache-control': { value: 'no-store' },
        'access-control-allow-methods': { value: allowedMethods },
        'access-control-allow-headers': { value: allowedHeaders },
      }

      if (allowOrigin !== undefined) {
        headers['access-control-allow-origin'] = { value: allowOrigin }
      }

      if (allowCredentials) {
        headers['access-control-allow-credentials'] = { value: 'true' }
      }

      if (maxAge !== undefined) {
        headers['access-control-max-age'] = { value: String(maxAge) }
      }

      return {
        action: 'respond',
        response: { statusCode: 204, statusDescription: 'No Content', headers },
      }
    },
  }
}
