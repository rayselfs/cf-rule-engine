const regexCache = new Map<string, RegExp>()

/** Convert a wildcard pattern to a RegExp. `*` matches any chars, `?` matches one char. Case-insensitive. */
export function wildcardToRegex(pattern: string): RegExp {
  if (!regexCache.has(pattern)) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    regexCache.set(pattern, new RegExp(`^${escaped}$`, 'i'))
  }
  return regexCache.get(pattern)!
}

/** Returns true if `str` matches the given wildcard pattern */
export function matchesWildcard(str: string, pattern: string): boolean {
  return wildcardToRegex(pattern).test(str)
}

/** Returns true if `str` matches ANY of the given wildcard patterns */
export function matchesAnyWildcard(str: string, patterns: string[]): boolean {
  return patterns.some(p => matchesWildcard(str, p))
}
