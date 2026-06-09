const originPatternCache: Record<string, RegExp> = Object.create(null)

/**
 * Returns true if `origin` matches the given origin pattern.
 * - `'*'` matches any origin.
 * - Patterns without `*` are exact-matched (case-sensitive).
 * - Patterns with `*` are converted to a cached RegExp (case-sensitive, `*` maps to `.*`).
 *
 * This function is case-sensitive and does not support `?`.
 * Extracted from `shared/wildcard` so that CORS consumers using `ORIGIN_WILDCARD`
 * or `ORIGIN_ECHO` do not pull the full wildcard module into their bundle.
 */
export function matchesOriginPattern(origin: string, pattern: string): boolean {
  if (pattern === '*') return true
  if (!pattern.includes('*')) return origin === pattern
  if (!(pattern in originPatternCache)) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
    originPatternCache[pattern] = new RegExp(`^${escaped}$`)
  }
  return originPatternCache[pattern].test(origin)
}
