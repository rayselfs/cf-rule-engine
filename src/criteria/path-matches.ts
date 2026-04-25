import type { CriteriaFn } from '../core/types.js'
import { matchesAnyWildcard } from '../shared/wildcard.js'

/**
 * Returns `true` if the request path (query string stripped) matches any of the given
 * wildcard patterns.
 *
 * Wildcard syntax: `*` matches any sequence of characters; `?` matches exactly one character.
 * Matching is case-insensitive.
 *
 * Akamai equivalent: `path` criterion with `MATCHES_ONE_OF` wildcard match type.
 *
 * @param patterns - Array of wildcard path patterns (e.g. `['/blog/*', '/posts/????-??-??-*']`).
 * @returns A `CriteriaFn` to use as the first argument to `rule()`.
 *
 * @example
 * ```ts
 * rule(pathMatches(['/blog/*', '/news/*']), setRequestHeader('x-section', 'editorial'))
 * ```
 */
export function pathMatches(patterns: string[]): CriteriaFn {
  return (req) => {
    const path = req.uri.split('?')[0]
    return matchesAnyWildcard(path, patterns)
  }
}
