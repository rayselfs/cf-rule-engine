import type { CriteriaFn } from '../core/types.js'

/**
 * Returns true if the request `User-Agent` header contains any of the given substrings.
 *
 * Lighter alternative to `userAgentMatches` for patterns of the form `*keyword*` —
 * uses `String.includes` instead of wildcard-to-RegExp conversion, avoiding the
 * regex cache entirely. The match is case-sensitive.
 *
 * Use `userAgentMatches` when you need wildcard (`*`, `?`) or case-insensitive matching.
 * Use `uaContains` when you only need substring presence checks.
 *
 * If the `User-Agent` header is absent, the criterion returns `false`.
 *
 * @param keywords - Array of substrings to look for in the User-Agent header.
 * @returns A `CriteriaFn` that evaluates to `true` when the User-Agent contains any keyword.
 *
 * @example
 * ```typescript
 * import { rule, not } from '@rayselfs/cf-rule-engine'
 * import { uaContains } from '@rayselfs/cf-rule-engine/criteria/user-agent-contains'
 * import { redirect } from '@rayselfs/cf-rule-engine/behaviors/redirect'
 *
 * // Allow internal bots by UA substring
 * rule(not(uaContains(['HTCVRSDET', 'Prerender', 'HTC3PARTY'])),
 *   redirect(302, 'https://www.example.com'))
 * ```
 */
export function uaContains(keywords: string[]): CriteriaFn {
  return (req) => {
    const ua = req.headers['user-agent']?.value
    if (!ua) return false
    return keywords.some(k => ua.includes(k))
  }
}
