import { matchesOriginPattern } from '../shared/origin-pattern.js'
import type { Origin, OriginMatcher } from './set-cors-headers.js'

/**
 * Builds an `OriginMatcher` from a list of origin patterns.
 *
 * Pass the returned function as `allowedOrigins` to `setCorsHeaders` or `preflightRequest`.
 * Consumers that only use `ORIGIN_WILDCARD` or `ORIGIN_ECHO` do NOT need to import this — it
 * exists as a separate entry point so that `origin-pattern.ts` is only bundled when origin list
 * matching is actually used.
 *
 * Pattern rules (same as before):
 * - Exact match: `'https://example.com'`
 * - Wildcard subdomain: `'https://*.viverse.com'`
 *
 * @example
 * ```ts
 * import { setCorsHeaders } from '@rayselfs/cf-rule-engine/behaviors/set-cors-headers'
 * import { originMatcher } from '@rayselfs/cf-rule-engine/behaviors/origin-matcher'
 *
 * const CORS = {
 *   allowedOrigins: originMatcher(['https://*.viverse.com', 'https://localhost:3000']),
 * }
 * ```
 */
export function originMatcher(origins: Origin[]): OriginMatcher {
  return (origin: string) => origins.some((p) => matchesOriginPattern(origin, p))
}
