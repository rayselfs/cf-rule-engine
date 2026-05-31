const regexCache: Record<string, RegExp> = Object.create(null)
const originPatternCache: Record<string, RegExp> = Object.create(null)

/** Convert a wildcard pattern to a RegExp. `*` matches any chars, `?` matches one char. Case-insensitive. */
export function wildcardToRegex(pattern: string): RegExp {
  if (!(pattern in regexCache)) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    regexCache[pattern] = new RegExp(`^${escaped}$`, 'i')
  }
  return regexCache[pattern]
}

/** Returns true if `str` matches the given wildcard pattern */
export function matchesWildcard(str: string, pattern: string): boolean {
  return wildcardToRegex(pattern).test(str)
}

/** Returns true if `str` matches ANY of the given wildcard patterns */
export function matchesAnyWildcard(str: string, patterns: string[]): boolean {
  return patterns.some(p => matchesWildcard(str, p))
}

/**
 * Returns true if `origin` matches the given origin pattern.
 * - `'*'` matches any origin.
 * - Patterns without `*` are exact-matched (case-sensitive).
 * - Patterns with `*` are converted to a cached RegExp (case-sensitive, `*` maps to `.*`).
 *
 * Unlike `matchesWildcard`, this function is case-sensitive and does not support `?`.
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
