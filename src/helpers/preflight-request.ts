import type { Rule } from '../core/types.js'
import type { CorsOptions } from '../behaviors/set-cors-headers.js'
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
 * to define CORS config in one place.
 *
 * @example
 * ```ts
 * import { preflightRequest } from '@rayselfs/cf-rule-engine/helpers'
 * import { setCorsHeaders } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerRequest, defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 * import type { CorsOptions } from '@rayselfs/cf-rule-engine/behaviors'
 *
 * const CORS: CorsOptions = {
 *   allowedOrigins: ['*'],
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
export function preflightRequest(options?: CorsOptions): Rule {
  const allowedOrigins = options?.allowedOrigins ?? ['*']
  const allowedMethods = options?.allowedMethods ?? 'GET, POST, OPTIONS'
  const allowedHeaders = options?.allowedHeaders ?? 'Content-Type, Cache-Control, Pragma, Range'
  const allowCredentials = options?.allowCredentials ?? false
  const maxAge = options?.maxAge

  return {
    criteria: methodIs(['OPTIONS']),
    behavior: (request) => {
      let allowOrigin: string

      if (options?.allowOriginEcho) {
        const originHeader = request.headers['origin']?.value
        allowOrigin =
          originHeader && allowedOrigins.some((p) => matchesOriginPattern(originHeader, p))
            ? originHeader
            : (allowedOrigins[0] ?? '*')
      } else {
        allowOrigin = allowedOrigins.includes('*') ? '*' : (allowedOrigins[0] ?? '*')
      }

      const headers: Record<string, { value: string }> = {
        'cache-control': { value: 'no-store' },
        'access-control-allow-origin': { value: allowOrigin },
        'access-control-allow-methods': { value: allowedMethods },
        'access-control-allow-headers': { value: allowedHeaders },
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
