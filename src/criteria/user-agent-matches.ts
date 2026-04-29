import type { CriteriaFn } from '../core/types.js'
import { matchesAnyWildcard } from '../shared/wildcard.js'

/** Returns true if the user agent matches any of the given wildcard patterns. */
export function userAgentMatches(patterns: string[]): CriteriaFn {
  return (req) => {
    const ua = req.headers['user-agent']?.value
    if (!ua) return false
    return matchesAnyWildcard(ua, patterns)
  }
}
