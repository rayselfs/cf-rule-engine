import type { CriteriaFn } from '../core/types.js'
import { matchesAnyWildcard } from '../shared/wildcard.js'

/**
 * Returns true if the request `User-Agent` header matches any of the given wildcard patterns.
 *
 * Patterns support `*` (match any number of characters) and `?` (match a single character).
 * The match is case-sensitive. If the `User-Agent` header is absent, the criterion returns `false`.
 *
 * Akamai equivalent: `userAgent` criterion with `IS_ONE_OF` and wildcard matching.
 *
 * @param patterns - Array of wildcard patterns to match the User-Agent string against
 *   (e.g. `['*Googlebot*', '*bingbot*']`).
 * @returns A `CriteriaFn` that evaluates to `true` when the User-Agent matches any listed pattern.
 *
 * @example
 * ```typescript
 * import { rule, not } from '@viverse/cf-engine'
 * import { userAgentMatches } from '@viverse/cf-engine/criteria'
 * import { redirect, constructResponse } from '@viverse/cf-engine/behaviors'
 *
 * // Block known scraper bots
 * rule(userAgentMatches(['*SemrushBot*', '*AhrefsBot*', '*MJ12bot*']),
 *   constructResponse({ statusCode: 403, body: 'Forbidden' }))
 *
 * // Allow only HTC internal automation tools (stage environment)
 * rule(not(userAgentMatches(['*HTCVRSDET*', '*Prerender*', '*HTC3PARTY*'])),
 *   redirect(302, 'https://www.viverse.com'))
 * ```
 */
export function userAgentMatches(patterns: string[]): CriteriaFn {
  return (req) => {
    const ua = req.headers['user-agent']?.value
    if (!ua) return false
    return matchesAnyWildcard(ua, patterns)
  }
}
