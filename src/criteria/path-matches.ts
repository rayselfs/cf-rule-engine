import type { CriteriaFn } from '../core/types.js'
import { matchesAnyWildcard } from '../shared/wildcard.js'

/** Returns true if the request path (without query) matches any of the given wildcard patterns. */
export function pathMatches(patterns: string[]): CriteriaFn {
  return (req) => {
    const path = req.uri.split('?')[0]
    return matchesAnyWildcard(path, patterns)
  }
}
